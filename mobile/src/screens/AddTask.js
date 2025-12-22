/**
 * Tela AddTask - Criar Nova Tarefa
 * 
 * Esta tela permite ao usuário criar uma nova tarefa.
 * 
 * Funcionalidades:
 * - Formulário para criar tarefa (título, descrição, status)
 * - Validação de campos
 * - Salvar no SQLite local
 * - Sincronizar com backend após criar
 * - Navegação de volta após criar
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createTask } from "../database/tasks";
import { syncTasks } from "../services/sync";
import { COLORS, TASK_STATUS, SUCCESS_MESSAGES } from "../utils/constants";

/**
 * Componente da tela AddTask
 */
export default function AddTaskScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(TASK_STATUS.PENDING);
  const [loading, setLoading] = useState(false);

  /**
   * Handler para salvar tarefa
   */
  const handleSave = async () => {
    // Validação
    if (!title.trim()) {
      Alert.alert("Erro", "Por favor, informe o título da tarefa.");
      return;
    }

    setLoading(true);
    try {
      // Criar tarefa no SQLite local
      await createTask({
        title: title.trim(),
        description: description.trim() || null,
        status,
      });

      // Tentar sincronizar com backend (não bloquear se falhar)
      try {
        await syncTasks();
      } catch (error) {
        console.warn("⚠️ Erro ao sincronizar (tarefa salva localmente):", error);
      }

      Alert.alert("Sucesso", SUCCESS_MESSAGES.TASK_CREATED, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("❌ Erro ao criar tarefa:", error);
      Alert.alert("Erro", "Não foi possível criar a tarefa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Campo Título */}
        <View style={styles.field}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o título da tarefa"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
          />
        </View>

        {/* Campo Descrição */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Digite a descrição da tarefa (opcional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Campo Status */}
        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === TASK_STATUS.PENDING && styles.statusButtonActive,
              ]}
              onPress={() => setStatus(TASK_STATUS.PENDING)}
            >
              <Text
                style={[
                  styles.statusText,
                  status === TASK_STATUS.PENDING && styles.statusTextActive,
                ]}
              >
                Pendente
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === TASK_STATUS.IN_PROGRESS && styles.statusButtonActive,
              ]}
              onPress={() => setStatus(TASK_STATUS.IN_PROGRESS)}
            >
              <Text
                style={[
                  styles.statusText,
                  status === TASK_STATUS.IN_PROGRESS && styles.statusTextActive,
                ]}
              >
                Em Progresso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === TASK_STATUS.COMPLETED && styles.statusButtonActive,
              ]}
              onPress={() => setStatus(TASK_STATUS.COMPLETED)}
            >
              <Text
                style={[
                  styles.statusText,
                  status === TASK_STATUS.COMPLETED && styles.statusTextActive,
                ]}
              >
                Concluída
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Salvando..." : "Salvar Tarefa"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.TEXT,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: "center",
  },
  statusButtonActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: "500",
  },
  statusTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

