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
const whatsappService = require("../services/whatsapp");
const witService = require("../services/wit");
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
    const { phone, message, ignored, reason } = messageData;

    if (ignored || !phone || !message) {
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

    console.log(`📱 Mensagem recebida de ${phone}: ${message}`);

    // Interpretar mensagem usando Wit.ai
    let intent = null;
    let entities = {};

    try {
      const witResult = await witService.interpretText(message);
      intent = witResult.intent;
      entities = witResult.entities || {};
    } catch (error) {
      console.warn("⚠️ Erro ao interpretar com Wit.ai:", error);
      // Continuar mesmo se Wit.ai falhar
    }

    // Processar comando baseado no intent
    let responseMessage = "";
    let taskCreated = null;

    switch (intent) {
      case "create_task":
      case "add_task":
        // Criar nova tarefa
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

        taskCreated = db.createTask(normalizedTask);

        // Montar mensagem de resposta
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
        // Comando não reconhecido
        responseMessage = `Olá! Eu sou o TodoWhats bot. Você pode:\n\n` +
          `• Criar tarefa: "Criar tarefa comprar leite"\n` +
          `• Listar tarefas: "Mostrar minhas tarefas"\n\n` +
          `Sua mensagem: "${message}"`;
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

