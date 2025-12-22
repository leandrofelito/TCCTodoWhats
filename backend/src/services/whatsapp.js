/**
 * Serviço de WhatsApp
 * 
 * Gerencia envio e recebimento de mensagens via WhatsApp.
 * 
 * APIs Suportadas:
 * - Ultramsg (https://ultramsg.com) - Recomendado para MVP
 * - CallMeBot (https://www.callmebot.com) - Alternativa gratuita
 * 
 * Por que APIs gratuitas?
 * - WhatsApp Business API oficial é paga
 * - APIs gratuitas suficientes para demonstração em TCC
 * - Ultramsg oferece trial gratuito
 * - CallMeBot tem plano gratuito limitado
 */

const axios = require("axios");

/**
 * Envia mensagem via Ultramsg
 * 
 * @param {string} phone - Número do telefone (com código do país, sem +)
 * @param {string} message - Mensagem a enviar
 * @returns {Promise<Object>} Resultado do envio
 */
const sendViaUltramsg = async (phone, message) => {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;

  if (!apiKey || !instanceId) {
    throw new Error("Credenciais do Ultramsg não configuradas");
  }

  const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
  
  try {
    const response = await axios.post(
      url,
      {
        to: phone,
        body: message,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return {
      success: true,
      provider: "ultramsg",
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Erro ao enviar via Ultramsg:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Envia mensagem via CallMeBot
 * 
 * @param {string} phone - Número do telefone (com código do país)
 * @param {string} message - Mensagem a enviar
 * @returns {Promise<Object>} Resultado do envio
 */
const sendViaCallMeBot = async (phone, message) => {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const callMeBotPhone = process.env.CALLMEBOT_PHONE || phone;

  if (!apiKey) {
    throw new Error("Credenciais do CallMeBot não configuradas");
  }

  // CallMeBot usa formato específico de URL
  const url = `https://api.callmebot.com/whatsapp.php`;
  
  try {
    const response = await axios.get(url, {
      params: {
        phone: callMeBotPhone,
        text: message,
        apikey: apiKey,
      },
    });

    return {
      success: true,
      provider: "callmebot",
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Erro ao enviar via CallMeBot:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Envia mensagem via WhatsApp
 * Tenta Ultramsg primeiro, depois CallMeBot como fallback
 * 
 * @param {string} phone - Número do telefone (com código do país)
 * @param {string} message - Mensagem a enviar
 * @returns {Promise<Object>} Resultado do envio
 */
const sendWhatsAppMessage = async (phone, message) => {
  // Normalizar número (remover caracteres especiais)
  const normalizedPhone = phone.replace(/[^0-9]/g, "");

  // Tentar Ultramsg primeiro
  if (process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_INSTANCE_ID) {
    try {
      return await sendViaUltramsg(normalizedPhone, message);
    } catch (error) {
      console.warn("⚠️ Falha ao enviar via Ultramsg, tentando CallMeBot...");
    }
  }

  // Fallback para CallMeBot
  if (process.env.CALLMEBOT_API_KEY) {
    try {
      return await sendViaCallMeBot(normalizedPhone, message);
    } catch (error) {
      throw new Error("Falha ao enviar mensagem via ambas as APIs");
    }
  }

  throw new Error("Nenhuma API de WhatsApp configurada");
};

/**
 * Processa mensagem recebida do WhatsApp
 * Extrai comando e dados da mensagem
 * 
 * @param {Object} messageData - Dados da mensagem recebida
 * @returns {Object} Dados processados
 */
const processReceivedMessage = (messageData) => {
  // Estrutura varia conforme a API usada
  // Adaptar conforme necessário
  
  return {
    phone: messageData.from || messageData.phone,
    message: messageData.text || messageData.body || messageData.message,
    timestamp: messageData.timestamp || new Date().toISOString(),
  };
};

module.exports = {
  sendWhatsAppMessage,
  processReceivedMessage,
};

