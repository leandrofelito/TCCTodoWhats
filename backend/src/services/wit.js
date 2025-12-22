/**
 * Serviço Wit.ai
 * 
 * Gerencia integração com Wit.ai para processamento de linguagem natural.
 * 
 * Funcionalidades:
 * - Interpretar texto em português
 * - Extrair intents (intenções) e entities (entidades)
 * - Processar comandos de voz/texto para criar tarefas
 * 
 * Por que Wit.ai?
 * - Plano gratuito disponível
 * - Suporta português brasileiro
 * - Fácil de configurar e usar
 * - Ideal para MVP de TCC
 */

const { Wit } = require("node-wit");

// Cliente Wit.ai
let witClient = null;

/**
 * Inicializa cliente Wit.ai
 */
const initWitClient = () => {
  const token = process.env.WIT_AI_TOKEN;

  if (!token) {
    console.warn("⚠️ Token do Wit.ai não configurado");
    return null;
  }

  if (!witClient) {
    witClient = new Wit({ accessToken: token });
  }

  return witClient;
};

/**
 * Interpreta um texto usando Wit.ai
 * 
 * @param {string} text - Texto a interpretar
 * @returns {Promise<Object>} Resultado da interpretação
 */
const interpretText = async (text) => {
  const client = initWitClient();

  if (!client) {
    // Retornar resultado padrão se Wit.ai não estiver configurado
    return {
      intent: null,
      entities: {},
      confidence: 0,
    };
  }

  try {
    const result = await client.message(text, {});
    
    // Extrair intent e entities do resultado
    const intent = result.intents && result.intents.length > 0 
      ? result.intents[0].name 
      : null;
    
    const entities = {};
    if (result.entities) {
      Object.keys(result.entities).forEach((key) => {
        const entity = result.entities[key];
        if (entity && entity.length > 0) {
          entities[key] = entity[0].value;
        }
      });
    }

    return {
      intent,
      entities,
      confidence: result.intents && result.intents.length > 0 
        ? result.intents[0].confidence 
        : 0,
      raw: result,
    };
  } catch (error) {
    console.error("❌ Erro ao interpretar texto com Wit.ai:", error);
    throw error;
  }
};

/**
 * Processa um arquivo de áudio usando Wit.ai
 * 
 * @param {Buffer} audioBuffer - Buffer do áudio
 * @returns {Promise<Object>} Resultado do processamento
 */
const processAudio = async (audioBuffer) => {
  const client = initWitClient();

  if (!client) {
    throw new Error("Wit.ai não configurado");
  }

  try {
    const result = await client.speech(audioBuffer, {
      contentType: "audio/wav", // Ajustar conforme formato do áudio
    });

    // Extrair texto transcrito e interpretação
    const text = result._text || "";
    const interpretation = await interpretText(text);

    return {
      text,
      ...interpretation,
    };
  } catch (error) {
    console.error("❌ Erro ao processar áudio com Wit.ai:", error);
    throw error;
  }
};

module.exports = {
  interpretText,
  processAudio,
};

