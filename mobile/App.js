/**
 * TodoWhats - App Principal
 * 
 * Este é o arquivo de entrada do aplicativo React Native.
 * Configura a navegação e inicializa os serviços necessários.
 * 
 * Funcionalidades:
 * - Configuração do React Navigation
 * - Inicialização do banco de dados SQLite
 * - Configuração de notificações FCM
 * - Setup de sincronização com backend
 */

import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";

// Importar telas
import HomeScreen from "./src/screens/Home";
import AddTaskScreen from "./src/screens/AddTask";
import EditTaskScreen from "./src/screens/EditTask";
import SettingsScreen from "./src/screens/Settings";

// Importar serviços de inicialização
import { initDatabase } from "./src/database/db";
import { initFCM } from "./src/services/fcm";
import { cleanupSpecificProblemTasks } from "./src/utils/cleanupOrphanTasks";

// Criar navegador Stack
const Stack = createStackNavigator();

/**
 * Componente principal do aplicativo
 * 
 * Responsabilidades:
 * 1. Inicializar banco de dados SQLite na primeira execução
 * 2. Configurar notificações FCM
 * 3. Configurar navegação entre telas
 */
export default function App() {
  useEffect(() => {
    // Inicializar banco de dados SQLite
    initDatabase()
      .then(() => {
        console.log("✅ Banco de dados SQLite inicializado com sucesso");
        
        // Limpar tarefas problemáticas específicas após inicializar o banco
        cleanupSpecificProblemTasks()
          .then((result) => {
            if (result.totalDeleted > 0) {
              console.log(`🧹 Limpeza automática: ${result.totalDeleted} tarefa(s) problemática(s) removida(s)`);
            }
          })
          .catch((error) => {
            console.warn("⚠️ Erro ao limpar tarefas problemáticas:", error);
            // Não bloquear a inicialização do app se a limpeza falhar
          });
      })
      .catch((error) => {
        console.error("❌ Erro ao inicializar banco de dados:", error);
      });

    // Inicializar Firebase Cloud Messaging
    initFCM()
      .then(() => {
        console.log("✅ FCM inicializado com sucesso");
      })
      .catch((error) => {
        console.error("❌ Erro ao inicializar FCM:", error);
      });
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#4CAF50",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Minhas Tarefas" }}
        />
        <Stack.Screen
          name="AddTask"
          component={AddTaskScreen}
          options={{ title: "Nova Tarefa" }}
        />
        <Stack.Screen
          name="EditTask"
          component={EditTaskScreen}
          options={{ title: "Editar Tarefa" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Configurações" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

