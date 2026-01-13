/**
 * Configuração do Firebase Cloud Messaging (FCM)
 * 
 * Este arquivo configura e gerencia notificações push usando Expo Notifications.
 * 
 * Funcionalidades:
 * - Solicitar permissões de notificação
 * - Registrar token FCM no backend
 * - Configurar handlers de notificações
 * - Enviar token para o backend
 * 
 * Por que FCM?
 * - Gratuito para sempre
 * - Suportado nativamente pelo Expo
 * - Funciona em iOS e Android
 * - Ideal para notificações push
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { fcmAPI } from "./api";

/**
 * Configuração de comportamento das notificações
 * Quando uma notificação chega e o app está em foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Inicializa o FCM
 * Solicita permissões e registra o token no backend
 * 
 * @returns {Promise<string>} Token FCM do dispositivo
 */
export const initFCM = async () => {
  try {
    // Solicitar permissões de notificação
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("⚠️ Permissão de notificação negada");
      return null;
    }

    // Obter token FCM
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "1b35cd68-4bf4-4f44-b1d6-6d5098af43b7",
    });

    const token = tokenData.data;
    console.log("📱 Token FCM obtido:", token);

    // Registrar token no backend
    try {
      await fcmAPI.registerToken(token);
      console.log("✅ Token FCM registrado no backend");
    } catch (error) {
      console.warn("⚠️ Erro ao registrar token no backend:", error.message);
      // Não falhar a inicialização se o backend não estiver disponível
    }

    // Configurar listeners de notificações
    setupNotificationListeners();

    return token;
  } catch (error) {
    console.error("❌ Erro ao inicializar FCM:", error);
    throw error;
  }
};

/**
 * Configura listeners para notificações
 * Handler para quando notificação chega e app está aberto
 */
const setupNotificationListeners = () => {
  // Listener para quando notificação chega e app está em foreground
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("📬 Notificação recebida:", notification);
    // Aqui você pode atualizar a UI ou fazer outras ações
  });

  // Listener para quando usuário toca na notificação
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("👆 Usuário tocou na notificação:", response);
    // Aqui você pode navegar para uma tela específica
    // Exemplo: navigation.navigate("TaskDetails", { id: taskId });
  });
};

/**
 * Envia uma notificação local
 * Útil para testes ou notificações internas
 * 
 * @param {Object} notification - Dados da notificação
 * @param {string} notification.title - Título
 * @param {string} notification.body - Corpo da mensagem
 * @param {Object} [notification.data] - Dados extras
 */
export const sendLocalNotification = async ({ title, body, data = {} }) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Enviar imediatamente
  });
};

/**
 * Cancela todas as notificações agendadas
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Agenda uma notificação para uma tarefa agendada
 * 
 * @param {string} taskId - ID da tarefa
 * @param {string} scheduledAt - Data/hora agendada (ISO 8601)
 * @param {string} title - Título da tarefa
 * @returns {Promise<string>} ID da notificação agendada
 */
export const scheduleTaskNotification = async (taskId, scheduledAt, title) => {
  try {
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();

    // Validar que a data é futura
    if (scheduledDate <= now) {
      console.warn("⚠️ Data agendada está no passado, não agendando notificação");
      return null;
    }

    // Usar o ID da tarefa como identificador único da notificação
    // Isso permite cancelar notificações específicas
    const notificationId = `task_${taskId}`;

    const notificationIdResult = await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: "📅 Tarefa Agendada",
        body: `É hora de: ${title}`,
        data: {
          taskId,
          type: "scheduled_task",
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: "date",
        date: scheduledDate,
      },
    });

    console.log(`✅ Notificação agendada para tarefa ${taskId} em ${scheduledDate.toLocaleString("pt-BR")}`);
    return notificationIdResult;
  } catch (error) {
    console.error("❌ Erro ao agendar notificação:", error);
    throw error;
  }
};

/**
 * Cancela a notificação de uma tarefa específica
 * 
 * @param {string} taskId - ID da tarefa
 * @returns {Promise<void>}
 */
export const cancelTaskNotification = async (taskId) => {
  try {
    const notificationId = `task_${taskId}`;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`✅ Notificação cancelada para tarefa ${taskId}`);
  } catch (error) {
    console.warn("⚠️ Erro ao cancelar notificação:", error);
    // Não falhar se a notificação não existir
  }
};

/**
 * Obtém o token FCM atual
 * 
 * @returns {Promise<string|null>} Token FCM ou null
 */
export const getFCMToken = async () => {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "1b35cd68-4bf4-4f44-b1d6-6d5098af43b7",
    });
    return tokenData.data;
  } catch (error) {
    console.error("❌ Erro ao obter token FCM:", error);
    return null;
  }
};

