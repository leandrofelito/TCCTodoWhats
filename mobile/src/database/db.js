/**
 * Configuração do Banco de Dados SQLite
 *
 * Este arquivo configura e inicializa o banco de dados SQLite local.
 *
 * Por que SQLite?
 * - Armazenamento local rápido e confiável
 * - Funciona offline (sem necessidade de internet)
 * - Ideal para MVP sem custos de servidor de banco
 * - Fácil migração futura se necessário
 *
 * Funcionalidades:
 * - Criação do banco de dados
 * - Criação de tabelas
 * - Inicialização de dados
 *
 * Observação (SDK 54):
 * A API antiga baseada em `openDatabase` foi substituída pela nova
 * API assíncrona (`openDatabaseAsync`, `runAsync`, `getAllAsync`, etc).
 * Este arquivo adapta a inicialização do banco para a nova API,
 * preservando a estrutura das tabelas e o comportamento do app.
 */

// Importar a nova API do SQLite (SDK 54+)
import * as SQLite from "expo-sqlite";

/**
 * Nome do banco de dados
 */
const DB_NAME = "todowhats.db";

/**
 * Promessa da instância do banco de dados.
 * Usamos uma Promise para garantir que a abertura (assíncrona)
 * aconteça apenas uma vez e seja reaproveitada por todo o app.
 */
let dbPromise = null;

/**
 * Promessa da inicialização do banco de dados.
 * Usamos uma Promise para garantir que a inicialização (criação de tabelas, migrações)
 * aconteça apenas uma vez, mesmo se múltiplas chamadas simultâneas ocorrerem.
 * Isso previne condições de corrida onde múltiplas chamadas tentam criar a mesma tabela.
 */
let initPromise = null;

/**
 * Obtém ou cria a instância do banco de dados (API nova, assíncrona).
 *
 * @returns {Promise<SQLite.SQLiteDatabase>} Instância do banco de dados
 */
export const getDatabase = async () => {
  if (!dbPromise) {
    // openDatabaseAsync cria/abre o banco usando a nova API do expo-sqlite
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

/**
 * Inicializa o banco de dados
 * Cria as tabelas necessárias se não existirem, usando a nova API.
 * 
 * Mecanismo de Lock:
 * - Se já existe uma inicialização em andamento, retorna a mesma Promise
 * - Isso garante que apenas uma inicialização aconteça por vez
 * - Previne erros de "table already exists" em chamadas simultâneas
 *
 * @returns {Promise<void>}
 */
export const initDatabase = async () => {
  // Se já existe uma inicialização em andamento, retornar a mesma Promise
  // Isso previne múltiplas execuções simultâneas (condição de corrida)
  if (initPromise) {
    return initPromise;
  }

  // Criar nova Promise de inicialização
  initPromise = (async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:58',message:'initDatabase ENTRY',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    try {
      const db = await getDatabase();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:61',message:'Database connection obtained',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      /**
       * IMPORTANTE - ORDEM DA INICIALIZAÇÃO
       *
       * 1. Verificar se a tabela existe e qual schema ela tem.
       * 2. Se não existe, criar com schema correto (snake_case).
       * 3. Se existe, verificar se precisa migrar (camelCase -> snake_case).
       * 4. Executar migração se necessário.
       * 5. Garantir que todas as colunas necessárias existam.
       * 6. Criar índices apenas depois da migração.
       *
       * Isso permite que usuários com banco já criado em versões antigas
       * continuem usando o app sem precisar limpar dados manualmente.
       */

      // 1) Verificar se a tabela existe
      const tableExists = await db.getAllAsync(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='tasks';
      `);
      
      const hasTable = tableExists && tableExists.length > 0;
      
      if (!hasTable) {
        // Tabela não existe, criar com schema correto
        console.log("📋 Criando tabela tasks com schema correto...");
        try {
          await db.execAsync(
            `
            CREATE TABLE tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
            `
          );
          console.log("✅ Tabela tasks criada com sucesso");
        } catch (createError) {
          // Se der erro de "table already exists", verificar novamente
          // Isso pode acontecer em condições de corrida raras
          if (createError.message && createError.message.includes("table tasks already exists")) {
            console.log("⚠️ Tabela tasks já existe (criada por outra chamada simultânea), continuando...");
            // Verificar novamente se a tabela existe
            const tableExistsRetry = await db.getAllAsync(`
              SELECT name FROM sqlite_master 
              WHERE type='table' AND name='tasks';
            `);
            if (!tableExistsRetry || tableExistsRetry.length === 0) {
              // Tabela realmente não existe, re-lançar erro
              throw createError;
            }
          } else {
            // Outro tipo de erro, re-lançar
            throw createError;
          }
        }
      } else {
        // Tabela existe, verificar schema e migrar se necessário
        console.log("🔍 Tabela tasks já existe, verificando schema...");
      }

      // 2) Migrar bancos antigos, adicionando colunas que não existirem
      // Esta função também trata a migração de camelCase para snake_case
      await migrateTasksTable(db);

      // VERIFICAÇÃO FINAL CRÍTICA: Garantir que não há colunas camelCase após migração
      const finalSchemaCheck = await db.getAllAsync(`PRAGMA table_info(tasks);`);
      const finalColumnNames = finalSchemaCheck.map(col => col.name);
      const finalHasCamelCase = finalColumnNames.includes("createdAt") || finalColumnNames.includes("updatedAt");
      
      if (finalHasCamelCase) {
        console.error("🚨 ERRO CRÍTICO: Schema ainda possui colunas camelCase após migração!");
        console.error("📋 Colunas finais:", finalColumnNames);
        throw new Error(`Migração falhou: Schema ainda possui colunas camelCase (${finalColumnNames.filter(c => c === "createdAt" || c === "updatedAt").join(", ")})`);
      }
      
      console.log("✅ Verificação final: Schema correto (apenas snake_case)");
      console.log("📋 Colunas finais:", finalColumnNames);

      // 3) Criar índices somente após garantir que as colunas existem
      await db.execAsync(
        `
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_synced ON tasks(synced);
        `
      );

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:119',message:'initDatabase SUCCESS',data:{finalColumns:finalColumnNames,hasCamelCase:finalHasCamelCase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      console.log("✅ Banco de dados inicializado com sucesso (nova API SQLite + migração)");
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:121',message:'initDatabase ERROR',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Verificar se é erro de "table already exists" e tratar como sucesso
      // Isso pode acontecer em condições de corrida raras onde a tabela foi criada
      // por outra chamada simultânea antes desta verificar
      if (error.message && error.message.includes("table tasks already exists")) {
        console.log("⚠️ Tabela tasks já existe (provavelmente criada por outra chamada simultânea), continuando...");
        
        // Verificar se a tabela realmente existe e está acessível
        try {
          const db = await getDatabase();
          const tableExists = await db.getAllAsync(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='tasks';
          `);
          
          if (tableExists && tableExists.length > 0) {
            // Tabela existe, executar migração normalmente
            await migrateTasksTable(db);
            console.log("✅ Banco de dados inicializado com sucesso (tabela já existia)");
            return;
          }
        } catch (checkError) {
          // Se não conseguir verificar, re-lançar o erro original
          console.error("❌ Erro ao verificar tabela após erro de criação:", checkError);
        }
      }
      
      console.error("❌ Erro na inicialização do banco de dados:", error);
      throw error;
    }
  })();

  // Aguardar a conclusão da inicialização e retornar a Promise
  // Se houver erro, limpar a Promise para permitir nova tentativa
  try {
    await initPromise;
  } catch (error) {
    // Em caso de erro, limpar a Promise para permitir nova tentativa
    initPromise = null;
    throw error;
  }
  
  // Limpar a Promise após sucesso para permitir reinicialização se necessário
  // (embora normalmente não seja necessário, é mais seguro)
  initPromise = null;
  
  return;
};

/**
 * Migração da tabela de tarefas (`tasks`)
 *
 * Esta função garante compatibilidade com bancos criados em versões antigas
 * do app que não possuíam todas as colunas atuais (ex.: `status`, `created_at`).
 *
 * Estratégia:
 * - Consultar o schema atual da tabela com `PRAGMA table_info(tasks)`.
 * - Verificar quais colunas já existem.
 * - Para cada coluna ausente, executar um `ALTER TABLE ... ADD COLUMN`.
 *
 * Observação:
 * - Usamos DEFAULT em colunas NOT NULL para evitar falhas ao adicionar
 *   a coluna em tabelas que já possuem registros.
 *
 * @param {SQLite.SQLiteDatabase} db - Instância do banco de dados
 * @returns {Promise<void>}
 */
const migrateTasksTable = async (db) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:144',message:'migrateTasksTable ENTRY',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Obter informações das colunas atuais da tabela `tasks`
    const columnsInfo = await db.getAllAsync(`PRAGMA table_info(tasks);`);

    // Log do schema atual para debug
    console.log("🔍 Schema atual da tabela tasks:", columnsInfo.map(col => ({
      name: col.name,
      type: col.type,
      notnull: col.notnull,
      dflt_value: col.dflt_value
    })));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:150',message:'Schema info retrieved',data:{columnsCount:columnsInfo.length,columns:columnsInfo.map(c=>({name:c.name,notnull:c.notnull}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Extrair apenas o nome das colunas existentes
    const existingColumns = columnsInfo.map((col) => col.name);

    /**
     * Função auxiliar para adicionar coluna caso ela não exista.
     *
     * @param {string} columnName - Nome da coluna
     * @param {string} columnDefinition - Definição SQL da coluna (tipo + constraints)
     */
    const ensureColumn = async (columnName, columnDefinition) => {
      if (!existingColumns.includes(columnName)) {
        console.log(`🔧 Migrando tabela tasks: adicionando coluna '${columnName}'`);
        await db.execAsync(
          `
          ALTER TABLE tasks
          ADD COLUMN ${columnDefinition};
          `
        );
      }
    };

    // PRIORIDADE MÁXIMA: Verificar e corrigir colunas duplicadas ANTES de qualquer outra operação
    // Isso previne erros de NOT NULL constraint que ocorrem quando há camelCase E snake_case
    const hasCreatedAtCamel = existingColumns.includes("createdAt");
    const hasUpdatedAtCamel = existingColumns.includes("updatedAt");
    const hasCreatedAtSnake = existingColumns.includes("created_at");
    const hasUpdatedAtSnake = existingColumns.includes("updated_at");
    
    // Se detectar duplicatas, corrigir IMEDIATAMENTE antes de continuar
    if ((hasCreatedAtCamel && hasCreatedAtSnake) || (hasUpdatedAtCamel && hasUpdatedAtSnake)) {
      console.error("🚨 ERRO CRÍTICO DETECTADO: Schema possui colunas duplicadas!");
      console.error("📋 Colunas detectadas:", existingColumns);
      console.error("🔧 Iniciando correção imediata...");
      
      // Forçar correção imediata (mesma lógica abaixo, mas executada primeiro)
      const existingTasks = await db.getAllAsync(`SELECT * FROM tasks LIMIT 1;`);
      const hasData = existingTasks && existingTasks.length > 0;
      const currentTimestamp = new Date().toISOString();
      
      if (hasData) {
        const allTasks = await db.getAllAsync(`SELECT * FROM tasks;`);
        
        // Atualizar dados antes de recriar
        if (hasCreatedAtCamel && hasCreatedAtSnake) {
          await db.runAsync(
            `UPDATE tasks SET created_at = COALESCE(created_at, createdAt, ?) WHERE created_at IS NULL OR created_at = '';`,
            [currentTimestamp]
          );
        }
        if (hasUpdatedAtCamel && hasUpdatedAtSnake) {
          await db.runAsync(
            `UPDATE tasks SET updated_at = COALESCE(updated_at, updatedAt, ?) WHERE updated_at IS NULL OR updated_at = '';`,
            [currentTimestamp]
          );
        }
        
        // Recriar tabela sem camelCase
        await db.execAsync(`DROP TABLE tasks;`);
        await db.execAsync(`
          CREATE TABLE tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            scheduled_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0,
            server_id TEXT
          );
        `);
        
        // Copiar dados
        for (const task of allTasks) {
          const createdAt = task.created_at || task.createdAt || currentTimestamp;
          const updatedAt = task.updated_at || task.updatedAt || currentTimestamp;
          
          await db.runAsync(`
            INSERT INTO tasks (id, title, description, status, scheduled_at, created_at, updated_at, synced, server_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
          `, [
            task.id,
            task.title,
            task.description || null,
            task.status || 'pending',
            task.scheduled_at || null,
            createdAt,
            updatedAt,
            task.synced !== undefined ? task.synced : 0,
            task.server_id || task.serverId || null,
          ]);
        }
        console.log("✅ Tabela recriada sem colunas camelCase (correção imediata)");
      } else {
        await db.execAsync(`DROP TABLE tasks;`);
        await db.execAsync(`
          CREATE TABLE tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            scheduled_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0,
            server_id TEXT
          );
        `);
        console.log("✅ Tabela recriada sem colunas camelCase (correção imediata, vazia)");
      }
      
      // Atualizar lista de colunas após correção
      const columnsInfoAfterFix = await db.getAllAsync(`PRAGMA table_info(tasks);`);
      const existingColumnsAfterFix = columnsInfoAfterFix.map((col) => col.name);
      console.log("✅ Schema após correção imediata:", existingColumnsAfterFix);
      
      // Atualizar variáveis para refletir o estado corrigido
      existingColumns.length = 0;
      existingColumns.push(...existingColumnsAfterFix);
    }

    // Garantir coluna `description` (descrição opcional da tarefa)
    // Em bancos antigos ela pode não existir; aqui garantimos que seja criada.
    await ensureColumn("description", "description TEXT");

    // Garantir coluna `status` (usada para filtros e índices)
    await ensureColumn("status", "status TEXT NOT NULL DEFAULT 'pending'");

    // Garantir coluna `scheduled_at` (data/hora agendada para notificação)
    await ensureColumn("scheduled_at", "scheduled_at TEXT");

    // Verificar novamente após garantir outras colunas (pode ter mudado)
    const finalColumnsCheck = await db.getAllAsync(`PRAGMA table_info(tasks);`);
    const finalColumns = finalColumnsCheck.map((col) => col.name);
    const hasCreatedAtCamelFinal = finalColumns.includes("createdAt");
    const hasUpdatedAtCamelFinal = finalColumns.includes("updatedAt");
    const hasCreatedAtSnakeFinal = finalColumns.includes("created_at");
    const hasUpdatedAtSnakeFinal = finalColumns.includes("updated_at");

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:190',message:'Column detection BEFORE migration',data:{hasCreatedAtCamel,hasUpdatedAtCamel,hasCreatedAtSnake,hasUpdatedAtSnake,duplicateDetected:hasCreatedAtCamel&&hasCreatedAtSnake},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // CORREÇÃO: Detectar quando AMBAS as colunas existem (camelCase E snake_case)
    // Isso causa erro porque o código insere em snake_case mas SQLite valida camelCase
    console.log("🔍 DEBUG - Verificação de colunas duplicadas:", {
      hasCreatedAtCamel: hasCreatedAtCamelFinal,
      hasUpdatedAtCamel: hasUpdatedAtCamelFinal,
      hasCreatedAtSnake: hasCreatedAtSnakeFinal,
      hasUpdatedAtSnake: hasUpdatedAtSnakeFinal,
      duplicateDetected: hasCreatedAtCamelFinal && hasCreatedAtSnakeFinal,
      allColumns: finalColumns,
    });

    if (hasCreatedAtCamelFinal && hasCreatedAtSnakeFinal) {
      console.log("🔧 Detectado schema duplicado (camelCase E snake_case), removendo camelCase...");
      console.log("⚠️ ERRO CRÍTICO: Schema possui colunas duplicadas! Isso causará NOT NULL constraint failed.");
      
      try {
        // Verificar se há dados na tabela
        const existingTasks = await db.getAllAsync(`SELECT * FROM tasks LIMIT 1;`);
        const hasData = existingTasks && existingTasks.length > 0;

        if (hasData) {
          // Migrar dados de camelCase para snake_case (se snake_case estiver vazio)
          console.log("📦 Migrando dados de camelCase para snake_case...");
          const currentTimestamp = new Date().toISOString();
          
          // Atualizar created_at com valores de createdAt se created_at estiver vazio
          await db.runAsync(
            `UPDATE tasks SET created_at = COALESCE(created_at, createdAt, ?) WHERE created_at IS NULL OR created_at = '';`,
            [currentTimestamp]
          );
          
          // Atualizar updated_at com valores de updatedAt se updated_at estiver vazio
          await db.runAsync(
            `UPDATE tasks SET updated_at = COALESCE(updated_at, updatedAt, ?) WHERE updated_at IS NULL OR updated_at = '';`,
            [currentTimestamp]
          );

          // Criar nova tabela sem colunas camelCase
          console.log("📋 Criando nova tabela sem colunas camelCase...");
          await db.execAsync(`
            CREATE TABLE tasks_new (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);

          // Copiar dados para nova tabela (usando snake_case)
          const allTasks = await db.getAllAsync(`SELECT * FROM tasks;`);
          console.log(`📋 Copiando ${allTasks.length} tarefas para nova tabela...`);
          
          for (const task of allTasks) {
            // Usar snake_case se disponível, senão usar camelCase, senão usar timestamp atual
            const createdAt = task.created_at || task.createdAt || currentTimestamp;
            const updatedAt = task.updated_at || task.updatedAt || currentTimestamp;
            
            await db.runAsync(`
              INSERT INTO tasks_new (id, title, description, status, scheduled_at, created_at, updated_at, synced, server_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              task.id,
              task.title,
              task.description || null,
              task.status || 'pending',
              task.scheduled_at || null,
              createdAt,
              updatedAt,
              task.synced !== undefined ? task.synced : 0,
              task.server_id || task.serverId || null,
            ]);
          }

          // Substituir tabela antiga
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`ALTER TABLE tasks_new RENAME TO tasks;`);
          console.log("✅ Colunas camelCase removidas, apenas snake_case permanece");
        } else {
          // Se não há dados, simplesmente recriar a tabela sem camelCase
          console.log("📋 Tabela vazia, recriando sem colunas camelCase...");
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`
            CREATE TABLE tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);
          console.log("✅ Tabela recriada sem colunas camelCase");
        }
        
        // Atualizar lista de colunas após migração
        const columnsInfoAfterMigration = await db.getAllAsync(`PRAGMA table_info(tasks);`);
        const existingColumnsAfterMigration = columnsInfoAfterMigration.map((col) => col.name);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:270',message:'Schema AFTER duplicate removal migration',data:{columnsAfter:existingColumnsAfterMigration,hasCreatedAtCamelAfter:existingColumnsAfterMigration.includes("createdAt"),hasUpdatedAtCamelAfter:existingColumnsAfterMigration.includes("updatedAt"),hasCreatedAtSnakeAfter:existingColumnsAfterMigration.includes("created_at"),hasUpdatedAtSnakeAfter:existingColumnsAfterMigration.includes("updated_at")},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Verificar se a migração foi bem-sucedida
        const stillHasCamelCase = existingColumnsAfterMigration.includes("createdAt") || existingColumnsAfterMigration.includes("updatedAt");
        const hasSnakeCase = existingColumnsAfterMigration.includes("created_at") && existingColumnsAfterMigration.includes("updated_at");
        
        console.log("🔍 DEBUG - Verificação pós-migração:", {
          columnsAfter: existingColumnsAfterMigration,
          stillHasCamelCase,
          hasSnakeCase,
        });

        if (stillHasCamelCase) {
          console.error("❌ ERRO: Migração falhou - colunas camelCase ainda existem:", {
            hasCreatedAt: existingColumnsAfterMigration.includes("createdAt"),
            hasUpdatedAt: existingColumnsAfterMigration.includes("updatedAt"),
          });
          throw new Error("Migração falhou: colunas camelCase ainda existem");
        }
        if (!hasSnakeCase) {
          console.error("❌ ERRO: Migração falhou - colunas snake_case não foram criadas");
          throw new Error("Migração falhou: colunas created_at/updated_at não foram criadas");
        }
        
        console.log("✅ Verificação pós-migração: schema correto (apenas snake_case)");
        console.log("📋 Schema final após migração:", existingColumnsAfterMigration);
      } catch (migrationError) {
        console.error("❌ Erro durante remoção de colunas camelCase:", migrationError);
        throw migrationError;
      }
    } else if (hasCreatedAtCamel && !hasCreatedAtSnake) {
      // Se existir em camelCase mas não em snake_case, precisamos migrar
      // IMPORTANTE: Esta migração deve acontecer ANTES de qualquer outra operação
      console.log("🔧 Detectado schema em camelCase, migrando para snake_case...");
      
      try {
        // Verificar se há dados na tabela
        const existingTasks = await db.getAllAsync(`SELECT * FROM tasks LIMIT 1;`);
        const hasData = existingTasks && existingTasks.length > 0;

        if (hasData) {
          // Se há dados, criar nova tabela e migrar
          console.log("📦 Migrando dados existentes...");
          
          // Criar tabela temporária com schema correto
          await db.execAsync(`
            CREATE TABLE tasks_new (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);

          // Copiar dados com conversão de nomes
          const currentTimestamp = new Date().toISOString();
          // Buscar todas as tarefas antigas
          const oldTasks = await db.getAllAsync(`SELECT * FROM tasks;`);
          
          console.log(`📋 Migrando ${oldTasks.length} tarefas...`);
          
          // Inserir cada tarefa na nova tabela
          for (const oldTask of oldTasks) {
            const createdAt = oldTask.createdAt || oldTask.created_at || currentTimestamp;
            const updatedAt = oldTask.updatedAt || oldTask.updated_at || currentTimestamp;
            
            await db.runAsync(`
              INSERT INTO tasks_new (id, title, description, status, scheduled_at, created_at, updated_at, synced, server_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              oldTask.id,
              oldTask.title,
              oldTask.description || null,
              oldTask.status || 'pending',
              oldTask.scheduled_at || oldTask.scheduledAt || null,
              createdAt,
              updatedAt,
              oldTask.synced !== undefined ? oldTask.synced : 0,
              oldTask.server_id || oldTask.serverId || null,
            ]);
          }

          // Substituir tabela antiga
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`ALTER TABLE tasks_new RENAME TO tasks;`);
          console.log("✅ Migração de camelCase para snake_case concluída");
        } else {
          // Se não há dados, simplesmente recriar a tabela
          console.log("📋 Tabela vazia, recriando com schema correto...");
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`
            CREATE TABLE tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);
          console.log("✅ Tabela recriada com schema correto (snake_case)");
        }
        
        // Atualizar lista de colunas após migração
        const columnsInfoAfterMigration = await db.getAllAsync(`PRAGMA table_info(tasks);`);
        const existingColumnsAfterMigration = columnsInfoAfterMigration.map((col) => col.name);
        
        // Verificar se a migração foi bem-sucedida
        if (!existingColumnsAfterMigration.includes("created_at") || !existingColumnsAfterMigration.includes("updated_at")) {
          throw new Error("Migração falhou: colunas created_at/updated_at não foram criadas");
        }
        
        console.log("✅ Verificação pós-migração: schema correto");
      } catch (migrationError) {
        console.error("❌ Erro durante migração de camelCase para snake_case:", migrationError);
        throw migrationError;
      }
    } else if (!hasCreatedAtSnake || !hasUpdatedAtSnake) {
      // Se não tem camelCase mas também não tem snake_case, adicionar colunas
      // Garantir coluna `created_at` (usada para ordenação)
      // IMPORTANTE:
      // - Em alguns ambientes (como expo-sqlite na nova API), o comando
      //   `ALTER TABLE ... ADD COLUMN ... DEFAULT (CURRENT_TIMESTAMP)` é
      //   rejeitado com erro "Cannot add a column with non-constant default".
      // - Por isso, na MIGRAÇÃO usamos apenas `TEXT` simples, sem DEFAULT.
      // - Os registros novos continuarão recebendo `created_at` via código
      //   (função `createTask` em `tasks.js`), e registros antigos serão
      //   preenchidos logo abaixo com um `UPDATE` específico.
      // - NOTA: Não usamos NOT NULL aqui para evitar erro ao adicionar coluna
      //   em tabelas existentes com dados. O código de inserção garante que
      //   sempre passemos valores válidos (não-null).
      await ensureColumn("created_at", "created_at TEXT");

      // Garantir coluna `updated_at` (timestamp de atualização)
      // Mesma estratégia da coluna `created_at`: sem DEFAULT na migração
      // para evitar erro de "non-constant default" em `ALTER TABLE`.
      await ensureColumn("updated_at", "updated_at TEXT");
    }

    // Garantir coluna `synced` (controle de sincronização com backend)
    await ensureColumn(
      "synced",
      "synced INTEGER NOT NULL DEFAULT 0"
    );

    // Garantir coluna `server_id` (ID da tarefa no servidor)
    await ensureColumn("server_id", "server_id TEXT");

    // Verificar novamente o schema após migração (pode ter mudado)
    const columnsInfoAfter = await db.getAllAsync(`PRAGMA table_info(tasks);`);
    const existingColumnsAfter = columnsInfoAfter.map((col) => col.name);
    const hasCreatedAtAfter = existingColumnsAfter.includes("created_at");
    const hasUpdatedAtAfter = existingColumnsAfter.includes("updated_at");
    
    // VERIFICAÇÃO FINAL CRÍTICA: Garantir que não há colunas duplicadas
    const hasCreatedAtCamelAfter = existingColumnsAfter.includes("createdAt");
    const hasUpdatedAtCamelAfter = existingColumnsAfter.includes("updatedAt");
    
    if (hasCreatedAtCamelAfter || hasUpdatedAtCamelAfter) {
      console.error("❌ ERRO CRÍTICO: Colunas camelCase ainda existem após migração!");
      console.error("📋 Schema atual:", existingColumnsAfter);
      console.error("🔧 Tentando remover colunas camelCase novamente...");
      
      // Tentar remover novamente (pode ter falhado silenciosamente antes)
      if ((hasCreatedAtCamelAfter && hasCreatedAtSnake) || (hasUpdatedAtCamelAfter && hasUpdatedAtSnake)) {
        console.log("⚠️ Executando migração de remoção de duplicatas novamente...");
        // Recriar tabela sem camelCase (mesma lógica acima, mas como fallback)
        const existingTasks = await db.getAllAsync(`SELECT * FROM tasks LIMIT 1;`);
        const hasData = existingTasks && existingTasks.length > 0;
        
        if (hasData) {
          const currentTimestamp = new Date().toISOString();
          const allTasks = await db.getAllAsync(`SELECT * FROM tasks;`);
          
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`
            CREATE TABLE tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);
          
          for (const task of allTasks) {
            const createdAt = task.created_at || task.createdAt || currentTimestamp;
            const updatedAt = task.updated_at || task.updatedAt || currentTimestamp;
            
            await db.runAsync(`
              INSERT INTO tasks (id, title, description, status, scheduled_at, created_at, updated_at, synced, server_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              task.id,
              task.title,
              task.description || null,
              task.status || 'pending',
              task.scheduled_at || null,
              createdAt,
              updatedAt,
              task.synced !== undefined ? task.synced : 0,
              task.server_id || task.serverId || null,
            ]);
          }
          console.log("✅ Tabela recriada sem colunas camelCase (fallback)");
        } else {
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`
            CREATE TABLE tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);
          console.log("✅ Tabela recriada sem colunas camelCase (fallback, vazia)");
        }
      }
    }

    // Só fazer UPDATE se as colunas existirem em snake_case
    if (hasCreatedAtAfter && hasUpdatedAtAfter) {
      /**
       * Pós-migração: normalização de timestamps
       *
       * Objetivo:
       * - Preencher `created_at` e `updated_at` em registros antigos que
       *   possam ter ficado nulos após a criação das colunas via migração.
       *
       * Decisão técnica:
       * - Usamos datetime('now') que é suportado pelo SQLite e retorna
       *   uma string no formato ISO 8601 compatível com JavaScript.
       * - Isso mantém a consistência dos dados para ordenação e exibição,
       *   sem quebrar a compatibilidade com bancos mais antigos.
       */
      const currentTimestamp = new Date().toISOString();
      await db.runAsync(
        `UPDATE tasks SET created_at = COALESCE(created_at, ?) WHERE created_at IS NULL OR created_at = '';`,
        [currentTimestamp]
      );
      await db.runAsync(
        `UPDATE tasks SET updated_at = COALESCE(updated_at, ?) WHERE updated_at IS NULL OR updated_at = '';`,
        [currentTimestamp]
      );

      /**
       * CORREÇÃO: Garantir que created_at e updated_at tenham NOT NULL
       * 
       * Se as colunas foram criadas via migração anterior sem NOT NULL,
       * precisamos garantir que tenham NOT NULL para evitar erros.
       * 
       * Como SQLite não permite alterar constraints diretamente, verificamos
       * se as colunas têm NOT NULL. Se não tiverem, isso significa que foram
       * criadas via migração e precisamos recriar a tabela.
       */
      const createdAtColumn = columnsInfoAfter.find(col => col.name === "created_at");
      const updatedAtColumn = columnsInfoAfter.find(col => col.name === "updated_at");
      
      const needsNotNullFix = 
        (createdAtColumn && createdAtColumn.notnull === 0) ||
        (updatedAtColumn && updatedAtColumn.notnull === 0);

      if (needsNotNullFix) {
        console.log("🔧 Colunas created_at/updated_at sem NOT NULL, garantindo NOT NULL...");
        
        // Verificar se há dados
        const taskCount = await db.getAllAsync(`SELECT COUNT(*) as count FROM tasks;`);
        const hasData = taskCount && taskCount.length > 0 && taskCount[0].count > 0;

        if (hasData) {
          // Criar nova tabela com NOT NULL
          await db.execAsync(`
            CREATE TABLE tasks_fixed (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);

          // Copiar dados (já garantimos que não há NULL acima)
          const allTasks = await db.getAllAsync(`SELECT * FROM tasks;`);
          console.log(`📋 Copiando ${allTasks.length} tarefas para tabela com NOT NULL...`);
          
          for (const task of allTasks) {
            const createdAt = task.created_at || new Date().toISOString();
            const updatedAt = task.updated_at || new Date().toISOString();
            
            await db.runAsync(`
              INSERT INTO tasks_fixed (id, title, description, status, scheduled_at, created_at, updated_at, synced, server_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              task.id,
              task.title,
              task.description || null,
              task.status || 'pending',
              task.scheduled_at || null,
              createdAt,
              updatedAt,
              task.synced !== undefined ? task.synced : 0,
              task.server_id || null,
            ]);
          }

          // Substituir tabela
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`ALTER TABLE tasks_fixed RENAME TO tasks;`);
          console.log("✅ NOT NULL garantido em created_at e updated_at");
        } else {
          // Se não há dados, simplesmente recriar
          await db.execAsync(`DROP TABLE tasks;`);
          await db.execAsync(`
            CREATE TABLE tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              scheduled_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              server_id TEXT
            );
          `);
          console.log("✅ Tabela recriada com NOT NULL em created_at e updated_at");
        }
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:346',message:'migrateTasksTable SUCCESS',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    console.log("✅ Migração da tabela tasks concluída com sucesso");
  } catch (migrationError) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.js:348',message:'migrateTasksTable ERROR',data:{errorMessage:migrationError.message,errorStack:migrationError.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Importante logar erro de migração, pois impacta carregamento de tarefas
    console.error("❌ Erro na migração da tabela tasks:", migrationError);
    console.error("📋 Detalhes do erro de migração:", {
      message: migrationError.message,
      stack: migrationError.stack,
      name: migrationError.name,
    });
    throw migrationError;
  }
};

/**
 * Fecha a conexão com o banco de dados
 * Útil para limpeza de recursos na nova API.
 */
export const closeDatabase = async () => {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
};

