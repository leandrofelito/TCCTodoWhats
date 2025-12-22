/**
 * Serviço Firebase Cloud Messaging (FCM)
 * 
 * Gerencia envio de notificações push via FCM.
 * 
 * Funcionalidades:
 * - Registrar tokens FCM de dispositivos
 * - Enviar notificações para dispositivos específicos
 * - Enviar notificações para múltiplos dispositivos
 * 
 * Por que FCM?
 * - Gratuito para sempre
 * - Suportado nativamente pelo Expo
 * - Funciona em iOS e Android
 * - Ideal para notificações push
 */

const admin = require("firebase-admin");

// Inicializar Firebase Admin SDK
let fcmInitialized = false;

/**
 * Inicializa Firebase Admin SDK
 * 
 * NOTA: Para MVP, FCM pode não estar totalmente configurado.
 * Em produção, usar service account JSON completo do Firebase.
 */
const initFCM = () => {
  if (fcmInitialized) {
    return;
  }

  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    console.warn("⚠️ FCM Server Key não configurada - notificações não funcionarão");
    return null;
  }

  try {
    // Para MVP simplificado, apenas marcar como inicializado
    // Em produção, inicializar Firebase Admin SDK corretamente com service account
    // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    
    console.log("⚠️ FCM configurado parcialmente - para produção, configure Firebase Admin SDK completo");
    fcmInitialized = true;
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin SDK:", error);
    // Para MVP, continuar mesmo se FCM não estiver configurado
  }
};

// Armazenamento simples de tokens (em produção, usar banco de dados)
const registeredTokens = new Set();

/**
 * Registra um token FCM
 * 
 * @param {string} token - Token FCM do dispositivo
 */
const registerToken = (token) => {
  registeredTokens.add(token);
  console.log(`✅ Token FCM registrado: ${token.substring(0, 20)}...`);
};

/**
 * Remove um token FCM
 * 
 * @param {string} token - Token FCM a remover
 */
const unregisterToken = (token) => {
  registeredTokens.delete(token);
  console.log(`🗑️ Token FCM removido`);
};

/**
 * Envia notificação para um dispositivo específico
 * 
 * @param {string} token - Token FCM do dispositivo
 * @param {Object} notification - Dados da notificação
 * @param {string} notification.title - Título
 * @param {string} notification.body - Corpo da mensagem
 * @param {Object} [notification.data] - Dados extras
 */
const sendToDevice = async (token, notification) => {
  initFCM();

  // Para MVP, apenas logar (em produção, usar Firebase Admin SDK)
  console.log(`📤 Notificação para ${token.substring(0, 20)}...: ${notification.title} - ${notification.body}`);
  
  // Em produção, descomentar e usar:
  /*
  if (!fcmInitialized || !admin.apps.length) {
    console.warn("⚠️ FCM não inicializado, notificação não enviada");
    return { success: false, error: "FCM não configurado" };
  }

  try {
    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Notificação enviada: ${response}`);

    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error);
    
    // Se token inválido, remover do registro
    if (error.code === "messaging/invalid-registration-token" || 
        error.code === "messaging/registration-token-not-registered") {
      unregisterToken(token);
    }

    return { success: false, error: error.message };
  }
  */
  
  // Para MVP, retornar sucesso simulado
  return { success: true, messageId: "simulated_for_mvp" };
};

/**
 * Envia notificação para múltiplos dispositivos
 * 
 * @param {Array<string>} tokens - Lista de tokens FCM
 * @param {Object} notification - Dados da notificação
 */
const sendToMultipleDevices = async (tokens, notification) => {
  initFCM();

  if (tokens.length === 0) {
    return { success: false, error: "Nenhum token fornecido" };
  }

  // Para MVP, apenas logar (em produção, usar Firebase Admin SDK)
  console.log(`📤 Notificação para ${tokens.length} dispositivo(s): ${notification.title} - ${notification.body}`);
  
  // Em produção, descomentar e usar Firebase Admin SDK
  // Retornar sucesso simulado para MVP
  return {
    success: true,
    successCount: tokens.length,
    failureCount: 0,
  };
};

/**
 * Envia notificação para todos os dispositivos registrados
 * 
 * @param {Object} notification - Dados da notificação
 */
const sendNotification = async (notification) => {
  const tokens = Array.from(registeredTokens);
  
  if (tokens.length === 0) {
    console.warn("⚠️ Nenhum token registrado");
    return { success: false, error: "Nenhum dispositivo registrado" };
  }

  return sendToMultipleDevices(tokens, notification);
};

module.exports = {
  registerToken,
  unregisterToken,
  sendToDevice,
  sendToMultipleDevices,
  sendNotification,
};

