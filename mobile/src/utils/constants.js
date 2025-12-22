/**
 * Constantes do Aplicativo TodoWhats
 * 
 * Este arquivo centraliza todas as constantes utilizadas no app.
 * Facilita manutenção e alterações futuras.
 */

/**
 * URL base da API backend
 * 
 * IMPORTANTE: Para desenvolvimento local, use o IP da sua máquina na rede local
 * Exemplo: http://192.168.1.100:3000
 * 
 * Para produção, substitua pela URL do seu servidor
 */
export const API_BASE_URL = __DEV__
  ? "http://192.168.0.151:3000" // Desenvolvimento local
  : "http://192.168.0.151:3000"; // Produção

/**
 * Endpoints da API
 * Centraliza todas as rotas da API para facilitar manutenção
 */
export const API_ENDPOINTS = {
  TASKS: "/api/tasks",
  TASKS_SYNC: "/api/tasks/sync",
  WHATSAPP_SEND: "/api/whatsapp/send",
  FCM_REGISTER: "/api/fcm/register",
  WIT_INTERPRET: "/api/wit/interpret",
  WIT_AUDIO: "/api/wit/audio",
};

/**
 * Configurações de sincronização
 */
export const SYNC_CONFIG = {
  INTERVAL: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 segundos
};

/**
 * Status de tarefas
 */
export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

/**
 * Cores do tema do aplicativo
 */
export const COLORS = {
  PRIMARY: "#4CAF50",
  PRIMARY_DARK: "#388E3C",
  SECONDARY: "#2196F3",
  DANGER: "#F44336",
  WARNING: "#FF9800",
  SUCCESS: "#4CAF50",
  BACKGROUND: "#F5F5F5",
  TEXT: "#212121",
  TEXT_SECONDARY: "#757575",
  BORDER: "#E0E0E0",
};

/**
 * Mensagens de erro padronizadas
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Erro de conexão. Verifique sua internet.",
  SERVER_ERROR: "Erro no servidor. Tente novamente mais tarde.",
  VALIDATION_ERROR: "Dados inválidos. Verifique os campos.",
  UNKNOWN_ERROR: "Erro desconhecido. Tente novamente.",
};

/**
 * Mensagens de sucesso padronizadas
 */
export const SUCCESS_MESSAGES = {
  TASK_CREATED: "Tarefa criada com sucesso!",
  TASK_UPDATED: "Tarefa atualizada com sucesso!",
  TASK_DELETED: "Tarefa deletada com sucesso!",
  SYNC_SUCCESS: "Sincronização concluída!",
};

