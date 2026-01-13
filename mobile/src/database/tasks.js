/**
 * CRUD de Tarefas - SQLite
 *
 * Este arquivo contém todas as funções para manipular tarefas no banco SQLite.
 *
 * Funcionalidades:
 * - Criar tarefa (CREATE)
 * - Listar tarefas (READ)
 * - Atualizar tarefa (UPDATE)
 * - Deletar tarefa (DELETE)
 * - Buscar tarefas por status
 * - Buscar tarefas não sincronizadas
 *
 * Cada função retorna uma Promise para facilitar uso com async/await.
 *
 * Observação (SDK 54):
 * A API do `expo-sqlite` agora é totalmente assíncrona. Este arquivo
 * foi adaptado para usar `openDatabaseAsync`, `runAsync` e `getAllAsync`,
 * preservando a estrutura do banco e o comportamento original do app.
 */

import { getDatabase } from "./db";
import { tasksAPI } from "../services/api";
import { scheduleTaskNotification, cancelTaskNotification } from "../services/fcm";

/**
 * Gera um ID único para a tarefa
 * Usa timestamp + número aleatório para garantir unicidade
 * 
 * @returns {string} ID único
 */
const generateId = () => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Obtém a data atual no formato ISO 8601
 * 
 * @returns {string} Data no formato ISO 8601
 */
const getCurrentDate = () => {
  return new Date().toISOString();
};

/**
 * Cria uma nova tarefa no banco de dados
 *
 * @param {Object} taskData - Dados da tarefa
 * @param {string} taskData.title - Título da tarefa (obrigatório)
 * @param {string} [taskData.description] - Descrição da tarefa (opcional)
 * @param {string} [taskData.status] - Status da tarefa (padrão: 'pending')
 * @param {string} [taskData.scheduled_at] - Data/hora agendada para notificação (opcional, formato ISO 8601)
 * @param {string} [taskData.created_at] - Data de criação (opcional, usa data atual se não fornecido)
 * @param {string} [taskData.updated_at] - Data de atualização (opcional, usa data atual se não fornecido)
 * @param {string} [taskData.server_id] - ID da tarefa no servidor (opcional)
 * @param {boolean} [taskData.synced] - Se a tarefa já foi sincronizada (padrão: false)
 * @returns {Promise<Object|null>} Tarefa criada com ID e timestamps ou null
 */
export const createTask = async (taskData) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.js:56',message:'createTask ENTRY',data:{taskDataKeys:Object.keys(taskData),hasCreated_at:!!taskData.created_at,hasCreatedAt:!!taskData.createdAt,hasUpdated_at:!!taskData.updated_at,hasUpdatedAt:!!taskData.updatedAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  const db = await getDatabase();
  
  // VERIFICAÇÃO CRÍTICA: Verificar schema antes de inserir
  // Se houver colunas camelCase, a migração falhou e precisamos corrigir
  try {
    const schemaCheck = await db.getAllAsync(`PRAGMA table_info(tasks);`);
    const columnNames = schemaCheck.map(col => col.name);
    const hasCamelCase = columnNames.includes("createdAt") || columnNames.includes("updatedAt");
    const hasSnakeCase = columnNames.includes("created_at") && columnNames.includes("updated_at");
    
    if (hasCamelCase) {
      console.error("🚨 ERRO CRÍTICO: Schema possui colunas camelCase! Migração falhou.");
      console.error("📋 Colunas detectadas:", columnNames);
      console.error("🔧 Tentando corrigir schema antes de inserir...");
      
      // Tentar corrigir o schema imediatamente
      const { initDatabase } = await import("./db");
      await initDatabase();
      
      // Verificar novamente
      const schemaCheckAfter = await db.getAllAsync(`PRAGMA table_info(tasks);`);
      const columnNamesAfter = schemaCheckAfter.map(col => col.name);
      const stillHasCamelCase = columnNamesAfter.includes("createdAt") || columnNamesAfter.includes("updatedAt");
      
      if (stillHasCamelCase) {
        throw new Error(`Schema ainda possui colunas camelCase após correção: ${columnNamesAfter.join(", ")}`);
      }
      
      console.log("✅ Schema corrigido antes do INSERT");
    }
  } catch (schemaError) {
    console.error("❌ Erro ao verificar/corrigir schema:", schemaError);
    throw new Error(`Erro no schema do banco de dados: ${schemaError.message}`);
  }
  
  const id = generateId();
  const now = getCurrentDate();

  // Validar e garantir que timestamps sempre tenham valores válidos
  // Se created_at ou updated_at vierem como null/undefined/inválido, usar data atual
  let createdAt = taskData.created_at || taskData.createdAt;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.js:64',message:'createdAt BEFORE validation',data:{createdAt,createdAtType:typeof createdAt,createdAtIsNull:createdAt===null,createdAtIsUndefined:createdAt===undefined,createdAtLength:createdAt?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (!createdAt || typeof createdAt !== 'string' || createdAt.trim() === '') {
    createdAt = now;
  }

  let updatedAt = taskData.updated_at || taskData.updatedAt;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.js:69',message:'updatedAt BEFORE validation',data:{updatedAt,updatedAtType:typeof updatedAt,updatedAtIsNull:updatedAt===null,updatedAtIsUndefined:updatedAt===undefined,updatedAtLength:updatedAt?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (!updatedAt || typeof updatedAt !== 'string' || updatedAt.trim() === '') {
    updatedAt = now;
  }

  // Validar que os timestamps são datas válidas
  try {
    const createdDate = new Date(createdAt);
    if (isNaN(createdDate.getTime())) {
      createdAt = now;
    }
  } catch {
    createdAt = now;
  }

  try {
    const updatedDate = new Date(updatedAt);
    if (isNaN(updatedDate.getTime())) {
      updatedAt = now;
    }
  } catch {
    updatedAt = now;
  }

  const serverId = taskData.server_id || taskData.serverId || null;
  const synced = taskData.synced !== undefined ? (taskData.synced ? 1 : 0) : 0;

  // Validar título (obrigatório)
  if (!taskData.title || typeof taskData.title !== 'string' || taskData.title.trim() === '') {
    throw new Error('Título da tarefa é obrigatório');
  }

  // Garantir que createdAt e updatedAt nunca sejam null/undefined
  // Isso é crítico porque a coluna tem constraint NOT NULL
  // CORREÇÃO: Validação mais rigorosa para evitar que undefined seja passado ao SQLite
  if (createdAt === null || createdAt === undefined || typeof createdAt !== 'string' || createdAt.trim() === '') {
    console.warn("⚠️ createdAt estava inválido, usando data atual");
    createdAt = now;
  } else {
    createdAt = String(createdAt).trim();
    // Validar novamente após trim
    if (createdAt === '') {
      createdAt = now;
    }
  }

  if (updatedAt === null || updatedAt === undefined || typeof updatedAt !== 'string' || updatedAt.trim() === '') {
    console.warn("⚠️ updatedAt estava inválido, usando data atual");
    updatedAt = now;
  } else {
    updatedAt = String(updatedAt).trim();
    // Validar novamente após trim
    if (updatedAt === '') {
      updatedAt = now;
    }
  }

  // VALIDAÇÃO FINAL CRÍTICA: Garantir que os valores são strings não-vazias
  // Isso previne que undefined/null sejam passados ao SQLite, que os interpreta como NULL
  if (!createdAt || createdAt === null || createdAt === undefined || createdAt === '') {
    console.error("❌ ERRO CRÍTICO: createdAt ainda está inválido após validação!");
    createdAt = now;
  }
  if (!updatedAt || updatedAt === null || updatedAt === undefined || updatedAt === '') {
    console.error("❌ ERRO CRÍTICO: updatedAt ainda está inválido após validação!");
    updatedAt = now;
  }

  // CORREÇÃO CRÍTICA: Garantir que são strings ISO válidas e não-vazias
  // Se for objeto Date, converter para ISO string
  if (createdAt instanceof Date) {
    createdAt = createdAt.toISOString();
  } else {
    createdAt = String(createdAt);
  }
  
  if (updatedAt instanceof Date) {
    updatedAt = updatedAt.toISOString();
  } else {
    updatedAt = String(updatedAt);
  }

  // Validação final: garantir que são strings não-vazias
  if (!createdAt || createdAt.trim() === '') {
    console.error("❌ ERRO: createdAt está vazio após todas as validações!");
    createdAt = now;
  }
  if (!updatedAt || updatedAt.trim() === '') {
    console.error("❌ ERRO: updatedAt está vazio após todas as validações!");
    updatedAt = now;
  }

  // Garantir que são strings (não null/undefined)
  createdAt = String(createdAt).trim();
  updatedAt = String(updatedAt).trim();

  // Log final antes de inserir
  console.log("💾 Inserindo tarefa no banco:", {
    id,
    title: taskData.title.trim(),
    createdAt,
    updatedAt,
    synced,
    serverId,
    createdAtType: typeof createdAt,
    updatedAtType: typeof updatedAt,
    createdAtLength: createdAt.length,
    updatedAtLength: updatedAt.length,
    createdAtIsNull: createdAt === null,
    updatedAtIsNull: updatedAt === null,
    createdAtIsUndefined: createdAt === undefined,
    updatedAtIsUndefined: updatedAt === undefined,
  });

  // Inserir a nova tarefa usando a nova API assíncrona
  // CORREÇÃO: Garantir que os valores no array nunca sejam undefined/null/vazios
  // Declarar insertValues fora do try para que esteja disponível no catch
  let insertValues = null;
  
  try {
    // Validação final ANTES de criar o array
    if (!createdAt || createdAt === null || createdAt === undefined || createdAt === '') {
      throw new Error(`createdAt inválido no momento do INSERT: ${createdAt} (tipo: ${typeof createdAt})`);
    }
    if (!updatedAt || updatedAt === null || updatedAt === undefined || updatedAt === '') {
      throw new Error(`updatedAt inválido no momento do INSERT: ${updatedAt} (tipo: ${typeof updatedAt})`);
    }

    insertValues = [
      id,
      taskData.title.trim(),
      taskData.description ? taskData.description.trim() : null,
      taskData.status || "pending",
      taskData.scheduled_at || null,
      createdAt, // Garantido que é string não-vazia
      updatedAt, // Garantido que é string não-vazia
      synced,
      serverId,
    ];

    // Validação final dos valores no array antes do INSERT
    // IMPORTANTE: A ordem do array é:
    // [0] id, [1] title, [2] description, [3] status, [4] scheduled_at, [5] created_at, [6] updated_at, [7] synced, [8] server_id
    // Por isso validamos índices 5 e 6 para created_at e updated_at
    if (insertValues[5] === null || insertValues[5] === undefined || insertValues[5] === '') {
      throw new Error(`createdAt no array está inválido: ${insertValues[5]} (índice 5)`);
    }
    if (insertValues[6] === null || insertValues[6] === undefined || insertValues[6] === '') {
      throw new Error(`updatedAt no array está inválido: ${insertValues[6]} (índice 6)`);
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.js:212',message:'BEFORE INSERT - final values',data:{insertValues,createdAtValue:insertValues[5],updatedAtValue:insertValues[6],createdAtType:typeof insertValues[5],updatedAtType:typeof insertValues[6]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    await db.runAsync(
      `INSERT INTO tasks (id, title, description, status, scheduled_at, created_at, updated_at, synced, server_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      insertValues
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.js:217',message:'INSERT SUCCESS',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    console.log("✅ Tarefa inserida com sucesso:", id);
  } catch (error) {
    // #region agent log
    // Verificar se insertValues existe antes de usar no log
    const errorData = {
      errorMessage: error.message,
      errorCode: error.code,
    };
    
    if (insertValues) {
      errorData.insertValues = insertValues;
      errorData.createdAtValue = insertValues[4];
      errorData.updatedAtValue = insertValues[5];
      errorData.createdAtType = typeof insertValues[4];
      errorData.updatedAtType = typeof insertValues[5];
      errorData.createdAtIsNull = insertValues[4] === null;
      errorData.updatedAtIsNull = insertValues[5] === null;
    } else {
      errorData.insertValues = null;
      errorData.errorBeforeArrayCreation = true;
    }
    
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.js:218',message:'INSERT ERROR',data:errorData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    console.error("❌ Erro ao inserir tarefa:", error);
    console.error("📋 Dados que causaram erro:", {
      id,
      title: taskData.title.trim(),
      createdAt,
      updatedAt,
      synced,
      serverId,
      createdAtType: typeof createdAt,
      updatedAtType: typeof updatedAt,
      createdAtIsNull: createdAt === null,
      updatedAtIsNull: updatedAt === null,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack,
      insertValuesArray: insertValues || null,
    });
    throw error;
  }

  // Buscar a tarefa criada para retornar os dados completos
  const rows = await db.getAllAsync(`SELECT * FROM tasks WHERE id = ?;`, [id]);
  const createdTask = rows.length > 0 ? rows[0] : null;

  // Agendar notificação se a tarefa tiver scheduled_at
  if (createdTask && createdTask.scheduled_at) {
    try {
      await scheduleTaskNotification(createdTask.id, createdTask.scheduled_at, createdTask.title);
    } catch (error) {
      console.warn("⚠️ Erro ao agendar notificação (tarefa criada):", error);
      // Não falhar a criação da tarefa se o agendamento falhar
    }
  }

  return createdTask;
};

/**
 * Lista todas as tarefas do banco de dados
 *
 * @param {Object} [options] - Opções de filtro
 * @param {string} [options.status] - Filtrar por status
 * @param {boolean} [options.onlyUnsynced] - Listar apenas não sincronizadas
 * @returns {Promise<Array>} Lista de tarefas
 */
export const getAllTasks = async (options = {}) => {
  const db = await getDatabase();
  let query = "SELECT * FROM tasks";
  const params = [];

  // Construir query com filtros
  const conditions = [];
  if (options.status) {
    conditions.push("status = ?");
    params.push(options.status);
  }
  if (options.onlyUnsynced) {
    conditions.push("synced = 0");
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY created_at DESC;";

  const rows = await db.getAllAsync(query, params);
  return rows;
};

/**
 * Busca uma tarefa específica por ID
 *
 * @param {string} id - ID da tarefa
 * @returns {Promise<Object|null>} Tarefa encontrada ou null
 */
export const getTaskById = async (id) => {
  const db = await getDatabase();
  const rows = await db.getAllAsync(`SELECT * FROM tasks WHERE id = ?;`, [id]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Atualiza uma tarefa existente
 *
 * @param {string} id - ID da tarefa
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<Object|null>} Tarefa atualizada ou null
 */
export const updateTask = async (id, updates) => {
  const db = await getDatabase();
  const now = getCurrentDate();

  // Construir query dinamicamente baseado nos campos fornecidos
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  // Buscar tarefa atual antes de atualizar para verificar mudanças em scheduled_at
  const currentTask = await getTaskById(id);
  const hadScheduledAt = currentTask && currentTask.scheduled_at;
  const newScheduledAt = updates.scheduled_at;

  if (updates.scheduled_at !== undefined) {
    fields.push("scheduled_at = ?");
    values.push(updates.scheduled_at);
  }
  if (updates.server_id !== undefined) {
    fields.push("server_id = ?");
    values.push(updates.server_id);
  }
  if (updates.synced !== undefined) {
    fields.push("synced = ?");
    values.push(updates.synced ? 1 : 0);
  }

  // Sempre atualizar updated_at
  fields.push("updated_at = ?");
  values.push(now);

  // Adicionar ID no final para WHERE
  values.push(id);

  if (fields.length === 0) {
    // Nenhum campo para atualizar, apenas retornar a tarefa atual
    return getTaskById(id);
  }

  const query = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?;`;

  await db.runAsync(query, values);

  // Buscar tarefa atualizada
  const updatedTask = await getTaskById(id);

  // Gerenciar notificações baseado em mudanças em scheduled_at
  if (updatedTask) {
    // Se tinha agendamento e foi removido, cancelar notificação
    if (hadScheduledAt && !newScheduledAt) {
      try {
        await cancelTaskNotification(id);
      } catch (error) {
        console.warn("⚠️ Erro ao cancelar notificação:", error);
      }
    }
    // Se tinha agendamento e mudou, cancelar antiga e criar nova
    else if (hadScheduledAt && newScheduledAt && newScheduledAt !== currentTask.scheduled_at) {
      try {
        await cancelTaskNotification(id);
        await scheduleTaskNotification(id, newScheduledAt, updatedTask.title);
      } catch (error) {
        console.warn("⚠️ Erro ao atualizar notificação:", error);
      }
    }
    // Se não tinha agendamento e agora tem, criar notificação
    else if (!hadScheduledAt && newScheduledAt) {
      try {
        await scheduleTaskNotification(id, newScheduledAt, updatedTask.title);
      } catch (error) {
        console.warn("⚠️ Erro ao agendar notificação:", error);
      }
    }
  }

  return updatedTask;
};

/**
 * Deleta uma tarefa do banco de dados
 * 
 * IMPORTANTE: Também tenta deletar no servidor se a tarefa tiver server_id.
 * Isso previne que a tarefa seja recriada durante a sincronização automática.
 *
 * @param {string} id - ID da tarefa
 * @returns {Promise<boolean>} true se deletada com sucesso
 */
export const deleteTask = async (id) => {
  const db = await getDatabase();
  
  // Buscar a tarefa antes de deletar para obter o server_id
  const task = await getTaskById(id);
  
  if (!task) {
    console.warn(`⚠️ Tarefa ${id} não encontrada para deletar`);
    return false;
  }
  
  // Cancelar notificação se a tarefa tinha agendamento
  if (task.scheduled_at) {
    try {
      await cancelTaskNotification(id);
    } catch (error) {
      console.warn("⚠️ Erro ao cancelar notificação:", error);
    }
  }

  // Deletar do banco local
  await db.runAsync(`DELETE FROM tasks WHERE id = ?;`, [id]);
  console.log(`✅ Tarefa ${id} deletada localmente`);
  
  // Se a tarefa tem server_id, tentar deletar no servidor também
  // Isso previne que a tarefa seja recriada durante a sincronização
  if (task.server_id) {
    try {
      await tasksAPI.delete(task.server_id);
      console.log(`✅ Tarefa ${task.server_id} deletada no servidor`);
    } catch (error) {
      // Não falhar se não conseguir deletar no servidor
      // A tarefa já foi deletada localmente
      console.warn(`⚠️ Não foi possível deletar tarefa ${task.server_id} no servidor:`, error.message);
    }
  }
  
  return true;
};

/**
 * Busca tarefas não sincronizadas com o backend
 * Útil para sincronização
 *
 * @returns {Promise<Array>} Lista de tarefas não sincronizadas
 */
export const getUnsyncedTasks = () => {
  return getAllTasks({ onlyUnsynced: true });
};

/**
 * Marca tarefas como sincronizadas
 *
 * @param {Array<string>} ids - IDs das tarefas a marcar
 * @returns {Promise<boolean>} true se atualizado com sucesso
 */
export const markTasksAsSynced = async (ids) => {
  if (!ids || ids.length === 0) {
    return true;
  }

  const db = await getDatabase();
  const placeholders = ids.map(() => "?").join(",");

  await db.runAsync(
    `UPDATE tasks SET synced = 1 WHERE id IN (${placeholders});`,
    ids
  );

  return true;
};

