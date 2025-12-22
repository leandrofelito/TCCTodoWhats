/**
 * Tela Settings - Configurações
 * 
 * Esta tela permite ao usuário configurar o aplicativo.
 * 
 * Funcionalidades:
 * - Informações sobre sincronização
 * - Configurações de notificações
 * - Informações do app
 * - Sincronização manual
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { syncTasks } from "../services/sync";
import { COLORS, SUCCESS_MESSAGES } from "../utils/constants";

/**
 * Componente da tela Settings
 */
export default function SettingsScreen() {
  const [syncing, setSyncing] = useState(false);

  /**
   * Handler para sincronização manual
   */
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncTasks();
      Alert.alert(
        "Sincronização Concluída",
        `${SUCCESS_MESSAGES.SYNC_SUCCESS}\n\nEnviadas: ${result.uploaded}\nRecebidas: ${result.downloaded}`
      );
    } catch (error) {
      console.error("❌ Erro ao sincronizar:", error);
      Alert.alert("Erro", "Não foi possível sincronizar. Verifique sua conexão.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Seção de Sincronização */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sincronização</Text>
        <TouchableOpacity
          style={[styles.button, syncing && styles.buttonDisabled]}
          onPress={handleManualSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sincronizar Agora</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.sectionDescription}>
          Sincroniza suas tarefas com o servidor. As tarefas são sincronizadas automaticamente a cada 30 segundos.
        </Text>
      </View>

      {/* Seção de Informações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre o App</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versão:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Desenvolvido para:</Text>
          <Text style={styles.infoValue}>TCC</Text>
        </View>
      </View>

      {/* Seção de Tecnologias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tecnologias</Text>
        <Text style={styles.techText}>• React Native + Expo</Text>
        <Text style={styles.techText}>• SQLite (expo-sqlite)</Text>
        <Text style={styles.techText}>• Node.js + Express</Text>
        <Text style={styles.techText}>• Wit.ai (NLP)</Text>
        <Text style={styles.techText}>• Firebase Cloud Messaging</Text>
        <Text style={styles.techText}>• WhatsApp API</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: "500",
  },
  techText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
});

