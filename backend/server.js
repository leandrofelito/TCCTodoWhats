/**
 * TodoWhats Backend - Servidor Principal
 * 
 * Este arquivo configura e inicia o servidor Express.
 * 
 * Responsabilidades:
 * - Configurar middlewares (CORS, body-parser)
 * - Registrar rotas da API
 * - Inicializar serviços (WhatsApp, FCM, Wit.ai)
 * - Iniciar servidor HTTP
 * 
 * Arquitetura:
 * - Express como framework web
 * - Rotas organizadas em /src/routes
 * - Serviços em /src/services
 * - Modelos em /src/models
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Importar rotas
const tasksRoutes = require("./src/routes/tasks");
const whatsappRoutes = require("./src/routes/whatsapp");
const fcmRoutes = require("./src/routes/fcm");
const witRoutes = require("./src/routes/wit");

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURAÇÃO DE MIDDLEWARES
// ============================================

/**
 * CORS (Cross-Origin Resource Sharing)
 * Permite que o app mobile faça requisições para este backend
 */
app.use(cors());

/**
 * Body Parser
 * Permite ler JSON e URL-encoded nos requests
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Middleware de Logging
 * Registra todas as requisições para debug
 */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROTAS DA API
// ============================================

/**
 * Rota de Health Check
 * Útil para verificar se o servidor está rodando
 */
app.get("/", (req, res) => {
  res.json({
    message: "TodoWhats Backend API",
    version: "1.0.0",
    status: "running",
  });
});

/**
 * Rotas de Tarefas
 * CRUD completo de tarefas
 */
app.use("/api/tasks", tasksRoutes);

/**
 * Rotas de WhatsApp
 * Envio e recebimento de mensagens
 */
app.use("/api/whatsapp", whatsappRoutes);

/**
 * Rotas de FCM
 * Gerenciamento de notificações push
 */
app.use("/api/fcm", fcmRoutes);

/**
 * Rotas de Wit.ai
 * Processamento de linguagem natural
 */
app.use("/api/wit", witRoutes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

/**
 * Middleware de tratamento de erros
 * Captura erros não tratados e retorna resposta padronizada
 */
app.use((err, req, res, next) => {
  console.error("❌ Erro:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Erro interno do servidor",
      status: err.status || 500,
    },
  });
});

/**
 * Middleware para rotas não encontradas
 */
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Rota não encontrada",
      path: req.path,
    },
  });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

/**
 * Inicia o servidor HTTP
 * Escuta na porta definida em PORT (padrão: 3000)
 */
app.listen(PORT, () => {
  console.log("🚀 TodoWhats Backend iniciado!");
  console.log(`📡 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log("✅ Pronto para receber requisições");
});

// Exportar app para testes (se necessário)
module.exports = app;

