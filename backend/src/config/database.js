/**
 * Configuração do Banco de Dados
 * 
 * Para MVP, usamos arquivo JSON como armazenamento.
 * Isso simplifica o setup e não requer configuração de banco de dados.
 * 
 * Por que JSON?
 * - Não requer instalação de PostgreSQL/MySQL
 * - Fácil de debugar e visualizar dados
 * - Pode migrar facilmente para banco real depois
 * - Suficiente para demonstração em TCC
 * 
 * Em produção, migrar para SQLite, PostgreSQL ou MongoDB.
 */

const fs = require("fs");
const path = require("path");

// Caminho do arquivo JSON
const DB_FILE = path.join(__dirname, "../../data/tasks.json");
const DB_DIR = path.dirname(DB_FILE);

/**
 * Garante que o diretório de dados existe
 */
const ensureDataDir = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
};

/**
 * Inicializa o banco de dados
 * Cria arquivo JSON vazio se não existir
 */
const initDatabase = () => {
  ensureDataDir();
  
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      tasks: [],
      lastId: 0,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log("✅ Banco de dados JSON inicializado");
  }
};

/**
 * Lê todos os dados do banco
 * 
 * @returns {Object} Dados do banco
 */
const readDatabase = () => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Erro ao ler banco de dados:", error);
    return { tasks: [], lastId: 0 };
  }
};

/**
 * Escreve dados no banco
 * 
 * @param {Object} data - Dados a escrever
 */
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Erro ao escrever no banco de dados:", error);
    throw error;
  }
};

/**
 * Gera um ID único para nova tarefa
 * 
 * @returns {string} ID único
 */
const generateId = () => {
  const data = readDatabase();
  data.lastId += 1;
  writeDatabase(data);
  return `task_${Date.now()}_${data.lastId}`;
};

/**
 * Obtém todas as tarefas
 * 
 * @returns {Array} Lista de tarefas
 */
const getAllTasks = () => {
  const data = readDatabase();
  return data.tasks || [];
};

/**
 * Busca tarefa por ID
 * 
 * @param {string} id - ID da tarefa
 * @returns {Object|null} Tarefa encontrada ou null
 */
const getTaskById = (id) => {
  const tasks = getAllTasks();
  return tasks.find((task) => task.id === id) || null;
};

/**
 * Cria uma nova tarefa
 * 
 * @param {Object} taskData - Dados da tarefa
 * @returns {Object} Tarefa criada
 */
const createTask = (taskData) => {
  const data = readDatabase();
  const now = new Date().toISOString();
  
  const task = {
    id: generateId(),
    title: taskData.title,
    description: taskData.description || null,
    status: taskData.status || "pending",
    created_at: now,
    updated_at: now,
  };
  
  data.tasks.push(task);
  writeDatabase(data);
  
  return task;
};

/**
 * Atualiza uma tarefa existente
 * 
 * @param {string} id - ID da tarefa
 * @param {Object} updates - Campos a atualizar
 * @returns {Object|null} Tarefa atualizada ou null
 */
const updateTask = (id, updates) => {
  const data = readDatabase();
  const taskIndex = data.tasks.findIndex((task) => task.id === id);
  
  if (taskIndex === -1) {
    return null;
  }
  
  const task = data.tasks[taskIndex];
  const updatedTask = {
    ...task,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  data.tasks[taskIndex] = updatedTask;
  writeDatabase(data);
  
  return updatedTask;
};

/**
 * Deleta uma tarefa
 * 
 * @param {string} id - ID da tarefa
 * @returns {boolean} true se deletada
 */
const deleteTask = (id) => {
  const data = readDatabase();
  const initialLength = data.tasks.length;
  data.tasks = data.tasks.filter((task) => task.id !== id);
  
  if (data.tasks.length < initialLength) {
    writeDatabase(data);
    return true;
  }
  
  return false;
};

// Inicializar banco na primeira importação
initDatabase();

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

