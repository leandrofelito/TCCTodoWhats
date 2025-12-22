/**
 * Rotas de FCM (Firebase Cloud Messaging)
 * 
 * Define rotas para gerenciamento de notificações push.
 * 
 * Endpoints:
 * - POST /api/fcm/register - Registrar token FCM
 * - POST /api/fcm/send - Enviar notificação
 */

const express = require("express");
const router = express.Router();
const fcmService = require("../services/fcm");

/**
 * POST /api/fcm/register
 * Registra um token FCM do dispositivo
 */
router.post("/register", (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        error: {
          message: "Token é obrigatório",
          status: 400,
        },
      });
    }

    fcmService.registerToken(token);

    res.json({
      success: true,
      message: "Token registrado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao registrar token:", error);
    res.status(500).json({
      error: {
        message: "Erro ao registrar token",
        status: 500,
      },
    });
  }
});

/**
 * POST /api/fcm/send
 * Envia uma notificação push
 */
router.post("/send", async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: {
          message: "Título e corpo da notificação são obrigatórios",
          status: 400,
        },
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
    };

    let result;

    if (token) {
      // Enviar para dispositivo específico
      result = await fcmService.sendToDevice(token, notification);
    } else {
      // Enviar para todos os dispositivos registrados
      result = await fcmService.sendNotification(notification);
    }

    if (result.success) {
      res.json({
        success: true,
        message: "Notificação enviada com sucesso",
        data: result,
      });
    } else {
      res.status(500).json({
        error: {
          message: result.error || "Erro ao enviar notificação",
          status: 500,
        },
      });
    }
  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error);
    res.status(500).json({
      error: {
        message: "Erro ao enviar notificação",
        status: 500,
      },
    });
  }
});

module.exports = router;

