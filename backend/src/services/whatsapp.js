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
 * Normaliza valores de texto vindos de diferentes formatos de payload.
 * 
 * Objetivo:
 * - Garantir que retornamos uma string utilizável mesmo quando o campo
 *   vem como array, objeto ou string com espaços extras.
 * 
 * @param {any} value - Valor bruto do payload
 * @returns {string|null} Texto normalizado ou null se inválido
 */
const normalizeTextValue = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return normalizeTextValue(first);
  }

  if (value && typeof value === "object") {
    const textCandidates = [
      value.text,
      value.body,
      value.message,
      value.value,
      value.caption,
    ];

    for (const candidate of textCandidates) {
      const normalized = normalizeTextValue(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
};

/**
 * Normaliza número de telefone (remove sufixos e caracteres não numéricos).
 * 
 * Objetivo:
 * - Garantir que o número esteja no formato numérico puro,
 *   mesmo que venha como "551199...@c.us" ou com símbolos.
 * 
 * @param {any} value - Valor bruto do telefone
 * @returns {string|null} Telefone normalizado ou null
 */
const normalizePhoneValue = (value) => {
  if (!value) {
    return null;
  }

  let raw = String(value);
  if (raw.includes("@")) {
    raw = raw.split("@")[0];
  }

  const digitsOnly = raw.replace(/[^0-9]/g, "");
  return digitsOnly.length > 0 ? digitsOnly : null;
};

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
  // Estrutura varia conforme a API usada (Ultramsg ou CallMeBot)
  // Objetivo: normalizar phone/message e ignorar eventos que nao sao mensagens recebidas

  const eventType = messageData?.event_type || messageData?.eventType || messageData?.type;
  const data = messageData?.data || messageData?.payload || {};

  // Ultramsg envia eventos de ack, que nao devem ser processados
  if (eventType === "message_ack" || String(eventType || "").includes("ack")) {
    return {
      ignored: true,
      reason: "ack_event",
    };
  }

  // Candidatos de telefone variam conforme o provedor do WhatsApp
  const phoneCandidates = [
    data.from,
    data.sender,
    data.author,
    data.phone,
    data.chatId,
    data.participant,
    messageData.from,
    messageData.phone,
    messageData.sender,
    messageData.author,
    messageData.chatId,
    messageData.wa_id,
    messageData.participant,
    messageData?.messages?.[0]?.from,
  ];

  // Candidatos de mensagem variam conforme o provedor do WhatsApp
  const messageCandidates = [
    data.body,
    data.text,
    data.message,
    data.content,
    data.caption,
    data?.message?.body,
    data?.message?.text,
    messageData.text,
    messageData.body,
    messageData.message,
    messageData?.messages?.[0]?.text?.body,
    messageData?.messages?.[0]?.text,
    messageData?.messages?.[0]?.body,
  ];

  let phoneRaw = null;
  for (const candidate of phoneCandidates) {
    const normalized = normalizePhoneValue(candidate);
    if (normalized) {
      phoneRaw = normalized;
      break;
    }
  }

  let messageRaw = null;
  for (const candidate of messageCandidates) {
    const normalized = normalizeTextValue(candidate);
    if (normalized) {
      messageRaw = normalized;
      break;
    }
  }

  const timestampRaw =
    data.time ||
    data.timestamp ||
    messageData.timestamp ||
    messageData.time ||
    messageData?.messages?.[0]?.timestamp ||
    null;

  return {
    phone: phoneRaw,
    message: messageRaw,
    timestamp: timestampRaw
      ? new Date(
          typeof timestampRaw === "number" ? timestampRaw * 1000 : timestampRaw
        ).toISOString()
      : new Date().toISOString(),
    ignored: false,
  };
};

module.exports = {
  sendWhatsAppMessage,
  processReceivedMessage,
};

