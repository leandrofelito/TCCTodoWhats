/**
 * Serviço de Sincronização
 * 
 * Este arquivo gerencia a sincronização bidirecional entre o app mobile (SQLite)
 * e o backend.
 * 
 * Funcionalidades:
 * - Sincronizar tarefas locais com o servidor
 * - Baixar tarefas do servidor
 * - Resolver conflitos (last-write-wins)
 * - Sincronização automática e manual
 * 
 * Estratégia de Sincronização:
 * - Last-write-wins: Em caso de conflito, a última atualização vence
 * - Timestamps: Usa created_at e updated_at para determinar ordem
 * - Marcação de sincronização: Campo 'synced' indica se tarefa foi sincronizada
 */

import { getAllTasks, getUnsyncedTasks, markTasksAsSynced, createTask, updateTask } from "../database/tasks";
import { initDatabase } from "../database/db";
import { tasksAPI } from "./api";
import { SYNC_CONFIG } from "../utils/constants";
import { scheduleTaskNotification } from "./fcm";

/**
 * Sincroniza tarefas locais com o servidor
 * 
 * Fluxo:
 * 1. Garantir que o banco de dados está inicializado
 * 2. Busca tarefas não sincronizadas localmente
 * 3. Envia para o servidor
 * 4. Marca como sincronizadas localmente
 * 5. Baixa tarefas do servidor
 * 6. Atualiza/insere tarefas locais
 * 
 * @returns {Promise<Object>} Resultado da sincronização
 */
export const syncTasks = async () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:35',message:'syncTasks ENTRY',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  try {
    console.log("🔄 Iniciando sincronização...");

    // 0. Garantir que o banco de dados está inicializado antes de acessar a tabela
    // Isso previne o erro "no such table: tasks" quando a sincronização
    // é chamada antes da inicialização do banco estar completa
    await initDatabase();

    // 1. Buscar tarefas não sincronizadas localmente
    const unsyncedTasks = await getUnsyncedTasks();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:41',message:'Unsynced tasks retrieved',data:{unsyncedCount:unsyncedTasks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    console.log(`📤 ${unsyncedTasks.length} tarefas para enviar ao servidor`);

    // 2. Enviar tarefas não sincronizadas para o servidor
    let syncedIds = [];
    let serverTaskMap = new Map(); // Mapeamento de ID local -> server_id
    let serverTasksFromSync = []; // Tarefas retornadas pelo sync (evita duplicação)
    
    if (unsyncedTasks.length > 0) {
      try {
        const syncResult = await tasksAPI.sync(unsyncedTasks);
        syncedIds = syncResult.syncedIds || unsyncedTasks.map((t) => t.id);
        
        // CORREÇÃO CRÍTICA: Vincular server_id ANTES de processar outras tarefas
        // Isso previne duplicação ao garantir que tarefas recém-criadas sejam vinculadas imediatamente
        if (syncResult.tasks && Array.isArray(syncResult.tasks)) {
          serverTasksFromSync = syncResult.tasks;
          
          // Buscar todas as tarefas locais para verificar duplicatas
          const allLocalTasks = await getAllTasks();
          
          // Processar cada tarefa retornada pelo servidor
          for (const serverTask of syncResult.tasks) {
            // Primeiro tentar encontrar por server_id (se já existe vinculação)
            let localTask = allLocalTasks.find(t => t.server_id === serverTask.id);
            
            // Se não encontrou por server_id, tentar encontrar tarefa local não sincronizada
            // que corresponde a esta tarefa do servidor (mesmo título e timestamp próximo)
            if (!localTask) {
              localTask = unsyncedTasks.find(t => {
                // Verificar se já tem server_id (já foi vinculada)
                if (t.server_id) return false;
                
                // Comparar títulos (normalizar espaços)
                const localTitle = (t.title || "").trim();
                const serverTitle = (serverTask.title || "").trim();
                if (localTitle !== serverTitle) return false;
                
                // Comparar timestamps (dentro de 120 segundos para ser mais tolerante)
                const localCreatedAt = t.created_at;
                const serverCreatedAt = serverTask.created_at || serverTask.createdAt;
                if (!localCreatedAt || !serverCreatedAt) return false;
                
                const timeDiff = Math.abs(
                  new Date(localCreatedAt).getTime() - new Date(serverCreatedAt).getTime()
                );
                
                return timeDiff < 120000; // 120 segundos (2 minutos)
              });
            }
            
            // Se encontrou tarefa local correspondente, vincular imediatamente
            if (localTask && !localTask.server_id) {
              serverTaskMap.set(localTask.id, serverTask.id);
              try {
                await updateTask(localTask.id, {
                  server_id: serverTask.id,
                  synced: 1,
                });
                console.log(`✅ Tarefa local "${localTask.title}" (${localTask.id}) vinculada ao server_id: ${serverTask.id}`);
              } catch (error) {
                console.error(`❌ Erro ao vincular server_id para tarefa ${localTask.id}:`, error);
              }
            }
          }
        }
        
        console.log(`✅ ${syncedIds.length} tarefas enviadas ao servidor`);
      } catch (error) {
        console.error("❌ Erro ao enviar tarefas:", error);
        throw error;
      }
    }

    // 3. Marcar tarefas como sincronizadas localmente
    // Nota: Tarefas que foram vinculadas acima já estão marcadas como sincronizadas
    // Aqui marcamos as que não foram vinculadas ainda (serão vinculadas depois)
    if (syncedIds.length > 0) {
      await markTasksAsSynced(syncedIds);
    }

    // 4. Baixar tarefas do servidor
    // CORREÇÃO: Usar tarefas do sync se disponíveis, senão baixar todas
    let serverTasks = [];
    try {
      if (serverTasksFromSync.length > 0) {
        // Usar tarefas já retornadas pelo sync (evita duplicação)
        serverTasks = serverTasksFromSync;
        console.log(`📥 ${serverTasks.length} tarefas recebidas do sync (evitando duplicação)`);
      } else {
        // Se não temos tarefas do sync, baixar todas
        serverTasks = await tasksAPI.getAll();
        console.log(`📥 ${serverTasks.length} tarefas recebidas do servidor`);
      }
    } catch (error) {
      console.error("❌ Erro ao baixar tarefas:", error);
      // Continuar mesmo se falhar, pois já sincronizamos as locais
    }

    // 4.5. CORREÇÃO: Detectar e limpar tarefas órfãs (com server_id que não existe no servidor)
    if (serverTasks.length > 0) {
      const allLocalTasks = await getAllTasks();
      const serverIds = new Set(serverTasks.map(t => t.id));
      
      // Encontrar tarefas órfãs
      const orphanTasks = allLocalTasks.filter(task => {
        return task.server_id && !serverIds.has(task.server_id);
      });
      
      if (orphanTasks.length > 0) {
        console.log(`🔍 Detectadas ${orphanTasks.length} tarefa(s) órfã(s) (server_id não existe no servidor)`);
        
        // Remover server_id e marcar como não sincronizada para recriação
        const { updateTask } = await import("../database/tasks");
        for (const orphanTask of orphanTasks) {
          try {
            console.log(`🔧 Removendo server_id da tarefa órfã "${orphanTask.title}" (${orphanTask.id})`);
            await updateTask(orphanTask.id, {
              server_id: null,
              synced: false,
            });
          } catch (error) {
            console.error(`❌ Erro ao corrigir tarefa órfã ${orphanTask.id}:`, error);
          }
        }
      }
    }

    // 5. Atualizar/inserir tarefas locais com dados do servidor
    if (serverTasks.length > 0) {
      await syncServerTasksToLocal(serverTasks);
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:76',message:'syncTasks SUCCESS',data:{uploaded:syncedIds.length,downloaded:serverTasks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    console.log("✅ Sincronização concluída");

    return {
      success: true,
      uploaded: syncedIds.length,
      downloaded: serverTasks.length,
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:84',message:'syncTasks ERROR',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    console.error("❌ Erro na sincronização:", error);
    throw error;
  }
};

/**
 * Sincroniza tarefas do servidor para o local
 * 
 * Estratégia:
 * - Se tarefa não existe localmente, cria
 * - Se tarefa existe e servidor tem versão mais recente, atualiza
 * - Usa updated_at para determinar qual versão é mais recente
 * 
 * @param {Array} serverTasks - Tarefas do servidor
 */
const syncServerTasksToLocal = async (serverTasks) => {
  const localTasks = await getAllTasks();
  
  // Criar mapa usando server_id como chave primária
  const localTasksMapByServerId = new Map();
  for (const task of localTasks) {
    if (task.server_id) {
      localTasksMapByServerId.set(task.server_id, task);
    }
  }
  
  // CORREÇÃO: Incluir TODAS as tarefas sem server_id (independente de synced)
  // Tarefas recém-criadas têm synced=0, mas também precisam ser vinculadas
  const unsyncedLocalTasks = localTasks.filter(t => !t.server_id);
  
  // Ordenar por created_at para tentar vincular na ordem correta
  unsyncedLocalTasks.sort((a, b) => 
    new Date(a.created_at || 0) - new Date(b.created_at || 0)
  );

  for (const serverTask of serverTasks) {
    // Primeiro tentar encontrar por server_id
    let localTask = localTasksMapByServerId.get(serverTask.id);
    
    // Se não encontrou por server_id, tentar encontrar tarefa local sem server_id
    // que corresponde ao servidor (mesmo título e timestamp próximo)
    if (!localTask && unsyncedLocalTasks.length > 0) {
      const serverCreatedAt = serverTask.created_at || serverTask.createdAt;
      const serverTitle = serverTask.title;
      
      // CORREÇÃO: Procurar tarefa local com mesmo título e timestamp próximo
      // Usar janela de tempo maior (120 segundos) e normalizar títulos
      const matchingLocalTask = unsyncedLocalTasks.find(localTask => {
        // Normalizar títulos (remover espaços extras)
        const localTitle = (localTask.title || "").trim();
        const normalizedServerTitle = (serverTitle || "").trim();
        if (localTitle !== normalizedServerTitle) return false;
        
        const localCreatedAt = localTask.created_at;
        if (!localCreatedAt || !serverCreatedAt) return false;
        
        const timeDiff = Math.abs(
          new Date(localCreatedAt).getTime() - new Date(serverCreatedAt).getTime()
        );
        
        // CORREÇÃO: Usar janela de 120 segundos (2 minutos) para ser mais tolerante
        return timeDiff < 120000;
      });
      
      if (matchingLocalTask) {
        // Vincular a tarefa local ao server_id
        const { updateTask } = await import("../database/tasks");
        await updateTask(matchingLocalTask.id, { server_id: serverTask.id, synced: 1 });
        console.log(`✅ Tarefa local ${matchingLocalTask.id} vinculada ao server_id: ${serverTask.id}`);
        
        // Remover da lista de não vinculadas
        const index = unsyncedLocalTasks.indexOf(matchingLocalTask);
        if (index > -1) {
          unsyncedLocalTasks.splice(index, 1);
        }
        
        // Atualizar o mapa
        localTasksMapByServerId.set(serverTask.id, { ...matchingLocalTask, server_id: serverTask.id });
        continue; // Pular criação, já existe e foi atualizada
      }
    }

    // Se a tarefa não existe localmente, criar apenas se não foi deletada recentemente
    // (tarefas deletadas localmente não devem ser recriadas automaticamente)
    if (!localTask) {
      // Tarefa não existe localmente, criar preservando timestamps do servidor
      // Garantir que created_at e updated_at sempre tenham valores válidos
      
      // Log para debug
      console.log("📥 Criando tarefa do servidor:", {
        id: serverTask.id,
        title: serverTask.title,
        created_at: serverTask.created_at,
        updated_at: serverTask.updated_at,
        createdAt: serverTask.createdAt, // Verificar se vem em camelCase
        updatedAt: serverTask.updatedAt, // Verificar se vem em camelCase
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:111',message:'Server task data BEFORE processing',data:{serverTaskKeys:Object.keys(serverTask),hasCreated_at:!!serverTask.created_at,hasCreatedAt:!!serverTask.createdAt,hasUpdated_at:!!serverTask.updated_at,hasUpdatedAt:!!serverTask.updatedAt,created_atValue:serverTask.created_at,createdAtValue:serverTask.createdAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Aceitar tanto snake_case quanto camelCase do servidor
      const serverCreatedAt = serverTask.created_at || serverTask.createdAt || new Date().toISOString();
      const serverUpdatedAt = serverTask.updated_at || serverTask.updatedAt || new Date().toISOString();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:122',message:'Server timestamps AFTER extraction',data:{serverCreatedAt,serverUpdatedAt,serverCreatedAtType:typeof serverCreatedAt,serverUpdatedAtType:typeof serverUpdatedAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Validar que são strings válidas
      const createdAt = typeof serverCreatedAt === 'string' && serverCreatedAt.trim() !== '' 
        ? serverCreatedAt 
        : new Date().toISOString();
      const updatedAt = typeof serverUpdatedAt === 'string' && serverUpdatedAt.trim() !== '' 
        ? serverUpdatedAt 
        : new Date().toISOString();

      console.log("📝 Valores finais para inserção:", {
        createdAt,
        updatedAt,
        title: serverTask.title,
      });

      // CORREÇÃO CRÍTICA: Verificação robusta anti-duplicata antes de criar
      // Buscar tarefas locais NOVAMENTE para garantir que não foi vinculada entre o processamento
      const currentLocalTasks = await getAllTasks();
      const serverTitle = (serverTask.title || "").trim();
      
      // Verificação 1: Verificar se já existe tarefa com mesmo server_id
      const duplicateByServerId = currentLocalTasks.find(t => t.server_id === serverTask.id);
      if (duplicateByServerId) {
        console.log(`⚠️ Tarefa com server_id ${serverTask.id} já existe localmente, pulando criação`);
        continue;
      }
      
      // Verificação 2: Buscar tarefas locais sem server_id com mesmo título criadas recentemente
      // Usar janela de tempo maior (120 segundos) para ser mais tolerante
      const potentialDuplicates = currentLocalTasks.filter(t => {
        if (t.server_id) return false; // Já tem server_id, não é duplicata
        
        const localTitle = (t.title || "").trim();
        if (localTitle !== serverTitle) return false;
        
        // Verificar se foi criada recentemente (últimos 120 segundos)
        const localCreatedAt = t.created_at;
        if (!localCreatedAt || !serverCreatedAt) return false;
        
        const timeDiff = Math.abs(
          new Date(localCreatedAt).getTime() - new Date(serverCreatedAt).getTime()
        );
        
        return timeDiff < 120000; // 120 segundos (2 minutos)
      });
      
      if (potentialDuplicates.length > 0) {
        // Encontrou tarefa local correspondente, vincular ao invés de criar
        const duplicateTask = potentialDuplicates[0]; // Pegar a primeira correspondência
        console.log(`🔗 Tarefa local "${duplicateTask.title}" (${duplicateTask.id}) encontrada, vinculando ao server_id ${serverTask.id} ao invés de criar nova`);
        
        try {
          await updateTask(duplicateTask.id, {
            server_id: serverTask.id,
            synced: 1,
          });
          console.log(`✅ Tarefa local ${duplicateTask.id} vinculada ao server_id: ${serverTask.id}`);
          
          // Atualizar o mapa para evitar processar novamente
          localTasksMapByServerId.set(serverTask.id, { ...duplicateTask, server_id: serverTask.id });
        } catch (error) {
          console.error(`❌ Erro ao vincular tarefa duplicada ${duplicateTask.id}:`, error);
        }
        
        continue; // Pular criação, já vinculamos
      }

      const newTask = await createTask({
        title: serverTask.title,
        description: serverTask.description,
        status: serverTask.status,
        scheduled_at: serverTask.scheduled_at || null,
        created_at: createdAt,
        updated_at: updatedAt,
        server_id: serverTask.id,
        synced: 1, // Já vem do servidor, então já está sincronizada
      });

      // Agendar notificação se a tarefa tiver scheduled_at
      if (newTask && newTask.scheduled_at) {
        try {
          await scheduleTaskNotification(newTask.id, newTask.scheduled_at, newTask.title);
        } catch (error) {
          console.warn("⚠️ Erro ao agendar notificação após sincronização:", error);
        }
      }
    } else {
      // Tarefa existe, verificar qual é mais recente
      const serverUpdated = serverTask.updated_at ? new Date(serverTask.updated_at) : new Date(0);
      const localUpdated = localTask.updated_at ? new Date(localTask.updated_at) : new Date(0);

      if (serverUpdated > localUpdated) {
        // Servidor tem versão mais recente, atualizar local
        // Preservar created_at local (não deve mudar)
        const updatedTask = await updateTask(localTask.id, {
          title: serverTask.title,
          description: serverTask.description,
          status: serverTask.status,
          scheduled_at: serverTask.scheduled_at || null,
          server_id: serverTask.id,
          synced: 1,
          // updated_at será atualizado automaticamente pelo updateTask
        });

        // Notificação será agendada/cancelada automaticamente pelo updateTask
        // que já verifica mudanças em scheduled_at
      } else if (localUpdated > serverUpdated && !localTask.synced) {
        // Local tem versão mais recente e não foi sincronizada
        // Manter local e enviar na próxima sincronização
        // (já foi tratado acima)
      }
    }
  }
};

/**
 * Sincronização automática
 * Executa sincronização em intervalos regulares
 * 
 * @param {Function} [callback] - Callback chamado após cada sincronização
 * @returns {Function} Função para parar a sincronização automática
 */
export const startAutoSync = (callback) => {
  let intervalId = null;
  let isSyncInProgress = false;

  const sync = async () => {
    // Evita reentrada do auto-sync quando um ciclo anterior ainda está em execução.
    // Isso previne loops de sincronização e chamadas concorrentes ao backend.
    if (isSyncInProgress) {
      console.log("⏳ Auto-sync ignorado: sincronização anterior ainda em andamento.");
      return;
    }

    isSyncInProgress = true;

    try {
      const result = await syncTasks();
      if (callback) {
        callback(result);
      }
    } catch (error) {
      console.error("❌ Erro na sincronização automática:", error);
      if (callback) {
        callback({ success: false, error });
      }
    } finally {
      // Libera o lock para permitir o próximo ciclo de auto-sync.
      isSyncInProgress = false;
    }
  };

  // Executar imediatamente
  sync();

  // Configurar intervalo
  intervalId = setInterval(sync, SYNC_CONFIG.INTERVAL);

  // Retornar função para parar
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
};

