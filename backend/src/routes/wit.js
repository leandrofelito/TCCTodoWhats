/**
 * Rotas de Wit.ai
 * 
 * Define rotas para processamento de linguagem natural.
 * 
 * Endpoints:
 * - POST /api/wit/interpret - Interpretar texto
 * - POST /api/wit/audio - Processar áudio
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const witService = require("../services/wit");

// Configurar multer para upload de áudio
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * POST /api/wit/interpret
 * Interpreta um texto usando Wit.ai
 */
router.post("/interpret", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: {
          message: "Texto é obrigatório",
          status: 400,
        },
      });
    }

    const result = await witService.interpretText(text);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Erro ao interpretar texto:", error);
    res.status(500).json({
      error: {
        message: error.message || "Erro ao interpretar texto",
        status: 500,
      },
    });
  }
});

/**
 * POST /api/wit/audio
 * Processa um arquivo de áudio usando Wit.ai
 */
router.post("/audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: "Arquivo de áudio é obrigatório",
          status: 400,
        },
      });
    }

    const audioBuffer = req.file.buffer;
    const result = await witService.processAudio(audioBuffer);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Erro ao processar áudio:", error);
    res.status(500).json({
      error: {
        message: error.message || "Erro ao processar áudio",
        status: 500,
      },
    });
  }
});

module.exports = router;

