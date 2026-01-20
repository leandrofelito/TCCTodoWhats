/**
 * Constantes do Aplicativo TodoWhats
 * 
 * Este arquivo centraliza todas as constantes utilizadas no app.
 * Facilita manutenção e alterações futuras.
 */

import { Platform } from "react-native";

/**
 * Força o modo emulador Android em desenvolvimento.
 *
 * Objetivo:
 * - Evitar que o app use 10.0.2.2 em dispositivo físico (causa erro de rede).
 * - Permitir alternar manualmente quando você estiver no emulador.
 *
 * Como usar:
 * - true  => sempre usar 10.0.2.2 em dev Android (emulador).
 * - false => usar IP local da máquina em dev Android (dispositivo físico).
 */
const FORCE_ANDROID_EMULATOR = false;

/**
 * Detecta se o app deve usar a rota de emulador Android.
 *
 * Fluxo:
 * - Se não for Android, retorna false.
 * - Se não for desenvolvimento, retorna false.
 * - Usa o valor de FORCE_ANDROID_EMULATOR para decidir.
 *
 * @returns {boolean} true se deve usar rota de emulador Android
 */
const isAndroidEmulator = () => {
  if (Platform.OS !== "android") {
    return false;
  }

  // Somente em desenvolvimento consideramos o emulador.
  if (!__DEV__) {
    return false;
  }

  return FORCE_ANDROID_EMULATOR;
};

/**
 * Obtém a URL base configurada via variáveis de ambiente do Expo.
 *
 * Objetivo:
 * - Permitir trocar a base URL sem alterar o código (ex.: ngrok, produção).
 * - Priorizar `EXPO_PUBLIC_API_BASE_URL` quando presente.
 *
 * @returns {string|null} URL base configurada ou null se ausente
 */
const getEnvApiBaseUrl = () => {
  const envValue = typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_BASE_URL : null;

  if (typeof envValue === "string") {
    const trimmed = envValue.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
};

/**
 * Normaliza a URL base removendo barras finais.
 *
 * Objetivo:
 * - Evitar URLs duplicadas ao concatenar com endpoints.
 *
 * @param {string} url - URL base original
 * @returns {string} URL base normalizada
 */
const normalizeBaseUrl = (url) => {
  return String(url || "").replace(/\/+$/, "");
};

/**
 * URL base da API backend
 *
 * IMPORTANTE:
 * - Se `EXPO_PUBLIC_API_BASE_URL` estiver definida, ela será usada.
 * - Para emulador Android: usa 10.0.2.2 (localhost do host)
 * - Para dispositivo físico Android: usa IP local da rede
 * - Para iOS: usa IP local da rede
 *
 * Para desenvolvimento local, use o IP da sua máquina na rede local
 * Exemplo: http://192.168.1.100:3000
 *
 * Para produção, substitua pela URL do seu servidor
 */
export const API_BASE_URL = (() => {
  const envBaseUrl = getEnvApiBaseUrl();
  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  if (!__DEV__) {
    // Produção - usar URL do servidor
    return "http://192.168.0.151:3000";
  }

  // Desenvolvimento
  if (isAndroidEmulator()) {
    // Emulador Android: 10.0.2.2 é o alias para localhost do host
    return "http://10.0.2.2:3000";
  }

  // Dispositivo físico ou iOS: usar IP local da rede
  return "http://192.168.0.151:3000";
})();

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

