/**
 * Rotas de WhatsApp
 * 
 * Define rotas para envio e recebimento de mensagens via WhatsApp.
 * 
 * Endpoints:
 * - POST /api/whatsapp/send - Enviar mensagem
 * - POST /api/whatsapp/webhook - Webhook para receber mensagens
 */

const express = require("express");
const router = express.Router();
const axios = require("axios");
const whatsappService = require("../services/whatsapp");
const witService = require("../services/wit");
const whisperService = require("../services/whisper");
const db = require("../config/database");
const fcmService = require("../services/fcm");
const { extractDateTime } = require("../utils/dateParser");
const { normalizeTask } = require("../models/Task");

/**
 * Normaliza valores de entidades vindas do Wit.ai ou do texto bruto.
 * 
 * Objetivo:
 * - Garantir que title/description/status sejam strings válidas.
 * - Evitar falhas quando as entidades vêm como array ou objeto.
 * 
 * @param {any} value - Valor bruto da entidade
 * @param {string|null} fallback - Valor alternativo se o valor bruto for inválido
 * @returns {string|null} Valor normalizado
 */
const normalizeEntityValue = (value, fallback = null) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (Array.isArray(value) && value.length > 0) {
    return normalizeEntityValue(value[0], fallback);
  }

  if (value && typeof value === "object") {
    const objectValue = value.value || value.text || value.body || value.message || null;
    return normalizeEntityValue(objectValue, fallback);
  }

  return fallback;
};

/**
 * Cria tarefa a partir da mensagem e entidades e monta a resposta.
 * 
 * Objetivos:
 * - Centralizar a criação de tarefas para intents e fallback.
 * - Garantir resposta consistente com data/hora agendada.
 * - Enviar notificação FCM apenas quando não houver agendamento.
 * 
 * Fluxo interno:
 * 1) Normaliza título/descrição/status com base nas entidades e no texto.
 * 2) Extrai data/hora (Wit.ai ou parsing manual).
 * 3) Persiste tarefa no banco JSON.
 * 4) Monta mensagem de resposta.
 * 5) Envia FCM quando aplicável.
 * 
 * @param {string} message - Texto bruto recebido no WhatsApp
 * @param {Object} entities - Entidades extraídas pelo Wit.ai
 * @returns {Promise<Object>} Resultado com tarefa criada e resposta
 */
const createTaskFromMessage = async (message, entities = {}) => {
  const title = normalizeEntityValue(entities.title, null)
    || normalizeEntityValue(entities.task_name, null)
    || normalizeEntityValue(message, "Nova tarefa via WhatsApp");
  const description = normalizeEntityValue(entities.description, null);
  const rawStatus = normalizeEntityValue(entities.status, "pending");
  const status = ["pending", "in_progress", "completed"].includes(rawStatus)
    ? rawStatus
    : "pending";

  // Extrair data/hora agendada da mensagem
  const scheduledAt = extractDateTime(message, entities);

  // Normalizar payload da tarefa antes de persistir
  const normalizedTask = normalizeTask({
    title,
    description,
    status,
    scheduled_at: scheduledAt,
  });

  const taskCreated = db.createTask(normalizedTask);

  // Montar mensagem de resposta
  let responseMessage = "";
  if (scheduledAt) {
    const scheduledDate = new Date(scheduledAt);
    const formattedDate = scheduledDate.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    responseMessage = `✅ Tarefa criada: "${taskCreated.title}"\n📅 Agendada para: ${formattedDate}`;
  } else {
    responseMessage = `✅ Tarefa criada: "${taskCreated.title}"`;
  }

  // Não enviar notificação FCM imediata se tiver agendamento
  // A notificação será enviada pelo app mobile no horário agendado
  if (!scheduledAt) {
    try {
      await fcmService.sendNotification({
        title: "Nova tarefa via WhatsApp",
        body: `Tarefa "${taskCreated.title}" foi criada`,
        data: { taskId: taskCreated.id },
      });
    } catch (error) {
      console.warn("⚠️ Erro ao enviar notificação FCM:", error);
    }
  }

  return {
    taskCreated,
    responseMessage,
    scheduledAt,
  };
};

/**
 * POST /api/whatsapp/send
 * Envia uma mensagem via WhatsApp
 */
router.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;

    // Validação
    if (!phone || !message) {
      return res.status(400).json({
        error: {
          message: "Telefone e mensagem são obrigatórios",
          status: 400,
        },
      });
    }

    // Enviar mensagem
    const result = await whatsappService.sendWhatsAppMessage(phone, message);

    res.json({
      success: true,
      message: "Mensagem enviada com sucesso",
      data: result,
    });
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem WhatsApp:", error);
    res.status(500).json({
      error: {
        message: error.message || "Erro ao enviar mensagem",
        status: 500,
      },
    });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Webhook para receber mensagens do WhatsApp
 * 
 * Fluxo:
 * 1. Recebe mensagem do WhatsApp
 * 2. Processa mensagem usando Wit.ai
 * 3. Interpreta comando (criar tarefa, listar tarefas, etc)
 * 4. Executa ação correspondente
 * 5. Envia resposta via WhatsApp
 * 6. Envia notificação FCM se necessário
 */
router.post("/webhook", async (req, res) => {
  try {
    // Processar mensagem recebida
    const messageData = whatsappService.processReceivedMessage(req.body);
    const { phone, message, ignored, reason, media } = messageData;

    if (ignored || !phone || (!message && !media?.isAudio)) {
      // Ignorar eventos de ack ou payloads sem campos minimos
      console.log(
        `⚠️ Webhook ignorado: phone=${phone} message=${message} reason=${reason || "missing_fields"}`
      );
      return res.json({
        success: true,
        ignored: true,
        reason: reason || "missing_fields",
      });
    }

    console.log(`📱 Mensagem recebida de ${phone}: ${message || "[audio]"}`);

    // Interpretar mensagem usando Wit.ai
    let intent = null;
    let entities = {};
    let finalMessage = message;

    /**
     * Tratamento de áudio (WhatsApp -> Ultramsg -> Backend).
     * 
     * Objetivos:
     * - Baixar o áudio quando o payload indica mídia.
     * - Transcrever localmente via Whisper (gratuito).
     * - Manter o Wit.ai apenas para interpretar o texto transcrito.
     * - Não quebrar o fluxo de mensagens de texto já existente.
     */
    if (!finalMessage && media?.isAudio) {
      try {
        if (!media.url) {
          throw new Error("URL do áudio não encontrada no payload");
        }

        /**
         * Baixar áudio com timeout e validação básica.
         * 
         * Objetivos:
         * - Evitar travar o webhook em downloads lentos.
         * - Garantir que o conteúdo retornado é binário de áudio.
         */
        const audioResponse = await axios.get(media.url, {
          responseType: "arraybuffer",
          timeout: 15000,
          validateStatus: (status) => status >= 200 && status < 300,
        });

        const audioBuffer = Buffer.from(audioResponse.data || []);
        const responseContentType = audioResponse.headers?.["content-type"] || null;

        if (!audioBuffer.length) {
          throw new Error("Download do áudio retornou vazio");
        }

        if (typeof responseContentType === "string" && responseContentType.startsWith("text/")) {
          throw new Error("Download do áudio retornou conteúdo não binário");
        }
        /**
         * Resolver content-type do áudio.
         * 
         * Objetivos:
         * - Evitar erro do Wit.ai quando o header não vem no download.
         * - Usar heurística simples baseada no tipo de mídia.
         * - Manter um fallback seguro para áudio do WhatsApp.
         */
        let resolvedContentType =
          media.mimeType ||
          responseContentType ||
          null;

        // Normalizar content-type para remover parâmetros (ex.: codecs)
        if (typeof resolvedContentType === "string") {
          resolvedContentType = resolvedContentType.split(";")[0].trim();
        }

        if (!resolvedContentType) {
          if (String(media?.type || "").includes("ptt")) {
            resolvedContentType = "audio/ogg";
          } else if (String(media?.type || "").includes("audio")) {
            resolvedContentType = "audio/mpeg";
          } else {
            resolvedContentType = "audio/ogg";
          }
        }

        console.log("🎧 Áudio baixado:", {
          contentType: resolvedContentType,
          bytes: audioBuffer.length,
        });

        /**
         * Transcrever o áudio localmente.
         * 
         * Objetivos:
         * - Evitar chamadas externas para transcrição.
         * - Garantir funcionamento gratuito para o TCC.
         * - Retornar texto para o fluxo atual de intents.
         */
        finalMessage = await whisperService.transcribeAudioBuffer(audioBuffer, resolvedContentType);

        console.log("📝 Transcrição:", finalMessage || "[vazia]");

        intent = null;
        entities = {};
      } catch (error) {
        console.warn("⚠️ Erro ao transcrever áudio:", error.message || error);
        if (String(error?.message || "").includes("URL do áudio não encontrada")) {
          console.warn(
            "⚠️ Dica: habilite o webhook_message_download_media no Ultramsg para receber a URL do arquivo."
          );
        }

        const errorResponse = "❌ Não consegui transcrever o áudio. Tente novamente ou envie o texto.";

        try {
          await whatsappService.sendWhatsAppMessage(phone, errorResponse);
        } catch (sendError) {
          console.error("❌ Erro ao enviar resposta de falha:", sendError);
        }

        return res.json({
          success: true,
          message: "Webhook processado com erro de transcrição",
          intent: null,
          taskCreated: null,
          reason: "audio_transcription_error",
        });
      }
    }

    if (!finalMessage) {
      const fallbackResponse = "Não consegui entender o áudio. Pode enviar novamente ou digitar o texto?";

      try {
        await whatsappService.sendWhatsAppMessage(phone, fallbackResponse);
      } catch (error) {
        console.error("❌ Erro ao enviar resposta:", error);
      }

      return res.json({
        success: true,
        message: "Webhook processado com aviso",
        intent: null,
        taskCreated: null,
        reason: "empty_transcription",
      });
    }

    if (!intent) {
      try {
        const witResult = await witService.interpretText(finalMessage);
        intent = witResult.intent;
        entities = witResult.entities || {};
      } catch (error) {
        console.warn("⚠️ Erro ao interpretar com Wit.ai:", error);
        // Continuar mesmo se Wit.ai falhar
      }
    }

    // Processar comando baseado no intent
    let responseMessage = "";
    let taskCreated = null;
    const shouldFallbackCreate = !intent;

    switch (intent) {
      case "create_task":
      case "add_task":
        // Criar nova tarefa com base no intent identificado
        const createResult = await createTaskFromMessage(finalMessage, entities);
        taskCreated = createResult.taskCreated;
        responseMessage = createResult.responseMessage;
        break;

      case "list_tasks":
      case "show_tasks":
        // Listar tarefas
        const tasks = db.getAllTasks();
        const pendingTasks = tasks.filter((t) => t.status === "pending");
        
        if (pendingTasks.length === 0) {
          responseMessage = "📋 Você não tem tarefas pendentes.";
        } else {
          responseMessage = `📋 Você tem ${pendingTasks.length} tarefa(s) pendente(s):\n\n`;
          pendingTasks.slice(0, 5).forEach((task, index) => {
            responseMessage += `${index + 1}. ${task.title}\n`;
          });
          if (pendingTasks.length > 5) {
            responseMessage += `\n... e mais ${pendingTasks.length - 5} tarefa(s)`;
          }
        }
        break;

      default:
        if (shouldFallbackCreate) {
          // Fallback: criar tarefa mesmo sem intent reconhecido
          const fallbackResult = await createTaskFromMessage(finalMessage, entities);
          taskCreated = fallbackResult.taskCreated;
          responseMessage = fallbackResult.responseMessage;
        } else {
          // Comando não reconhecido quando existe intent não suportado
          responseMessage = `Olá! Eu sou o TodoWhats bot. Você pode:\n\n` +
            `• Criar tarefa: "Criar tarefa comprar leite"\n` +
            `• Listar tarefas: "Mostrar minhas tarefas"\n\n` +
            `Sua mensagem: "${finalMessage}"`;
        }
    }

    // Enviar resposta via WhatsApp
    try {
      await whatsappService.sendWhatsAppMessage(phone, responseMessage);
    } catch (error) {
      console.error("❌ Erro ao enviar resposta:", error);
    }

    // Responder ao webhook
    res.json({
      success: true,
      message: "Webhook processado com sucesso",
      intent,
      taskCreated: taskCreated ? taskCreated.id : null,
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    res.status(500).json({
      error: {
        message: "Erro ao processar webhook",
        status: 500,
      },
    });
  }
});

module.exports = router;

