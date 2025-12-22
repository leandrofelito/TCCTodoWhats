/**
 * Cliente HTTP para comunicação com o Backend
 * 
 * Este arquivo centraliza todas as requisições HTTP para a API.
 * Usa Axios como cliente HTTP.
 * 
 * Funcionalidades:
 * - Requisições GET, POST, PUT, DELETE
 * - Tratamento de erros padronizado
 * - Interceptores para logs e tratamento de erros
 * - Configuração centralizada da URL base
 */

import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS, ERROR_MESSAGES } from "../utils/constants";

/**
 * Instância do Axios configurada
 * Timeout de 30 segundos para requisições
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor de requisições
 * Adiciona logs para debug
 */
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Erro na requisição:", error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respostas
 * Trata erros de forma padronizada
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error("❌ Erro na resposta:", error.response?.data || error.message);
    
    // Tratamento de erros específicos
    if (error.code === "ECONNABORTED") {
      error.message = "Timeout na requisição. Verifique sua conexão.";
    } else if (error.code === "ERR_NETWORK") {
      error.message = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.response) {
      // Erro do servidor (4xx, 5xx)
      error.message = error.response.data?.error?.message || ERROR_MESSAGES.SERVER_ERROR;
    }
    
    return Promise.reject(error);
  }
);

/**
 * API de Tarefas
 */
export const tasksAPI = {
  /**
   * Lista todas as tarefas do servidor
   * 
   * @returns {Promise<Array>} Lista de tarefas
   */
  getAll: async () => {
    const response = await apiClient.get(API_ENDPOINTS.TASKS);
    return response.data;
  },

  /**
   * Busca uma tarefa específica por ID
   * 
   * @param {string} id - ID da tarefa
   * @returns {Promise<Object>} Tarefa
   */
  getById: async (id) => {
    const response = await apiClient.get(`${API_ENDPOINTS.TASKS}/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova tarefa no servidor
   * 
   * @param {Object} taskData - Dados da tarefa
   * @returns {Promise<Object>} Tarefa criada
   */
  create: async (taskData) => {
    const response = await apiClient.post(API_ENDPOINTS.TASKS, taskData);
    return response.data;
  },

  /**
   * Atualiza uma tarefa existente
   * 
   * @param {string} id - ID da tarefa
   * @param {Object} updates - Campos a atualizar
   * @returns {Promise<Object>} Tarefa atualizada
   */
  update: async (id, updates) => {
    const response = await apiClient.put(`${API_ENDPOINTS.TASKS}/${id}`, updates);
    return response.data;
  },

  /**
   * Deleta uma tarefa
   * 
   * @param {string} id - ID da tarefa
   * @returns {Promise<boolean>} true se deletada
   */
  delete: async (id) => {
    await apiClient.delete(`${API_ENDPOINTS.TASKS}/${id}`);
    return true;
  },

  /**
   * Sincroniza tarefas com o servidor
   * 
   * @param {Array} tasks - Lista de tarefas para sincronizar
   * @returns {Promise<Object>} Resultado da sincronização
   */
  sync: async (tasks) => {
    const response = await apiClient.post(API_ENDPOINTS.TASKS_SYNC, { tasks });
    return response.data;
  },
};

/**
 * API de WhatsApp
 */
export const whatsappAPI = {
  /**
   * Envia uma mensagem via WhatsApp
   * 
   * @param {string} phone - Número do telefone (com código do país)
   * @param {string} message - Mensagem a enviar
   * @returns {Promise<Object>} Resultado do envio
   */
  sendMessage: async (phone, message) => {
    const response = await apiClient.post(API_ENDPOINTS.WHATSAPP_SEND, {
      phone,
      message,
    });
    return response.data;
  },
};

/**
 * API de Wit.ai
 */
export const witAPI = {
  /**
   * Interpreta um texto usando Wit.ai
   * 
   * @param {string} text - Texto a interpretar
   * @returns {Promise<Object>} Resultado da interpretação
   */
  interpret: async (text) => {
    const response = await apiClient.post(API_ENDPOINTS.WIT_INTERPRET, { text });
    return response.data;
  },

  /**
   * Processa um áudio usando Wit.ai
   * 
   * @param {FormData} audioFile - Arquivo de áudio
   * @returns {Promise<Object>} Resultado do processamento
   */
  processAudio: async (audioFile) => {
    const response = await apiClient.post(API_ENDPOINTS.WIT_AUDIO, audioFile, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

/**
 * API de FCM
 */
export const fcmAPI = {
  /**
   * Registra o token FCM do dispositivo
   * 
   * @param {string} token - Token FCM
   * @returns {Promise<Object>} Resultado do registro
   */
  registerToken: async (token) => {
    const response = await apiClient.post(API_ENDPOINTS.FCM_REGISTER, { token });
    return response.data;
  },
};

export default apiClient;

