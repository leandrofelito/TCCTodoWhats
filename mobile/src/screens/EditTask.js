/**
 * Tela EditTask - Editar Tarefa Existente
 * 
 * Esta tela permite ao usuário editar uma tarefa existente.
 * 
 * Funcionalidades:
 * - Carregar dados da tarefa do SQLite
 * - Formulário para editar (título, descrição, status)
 * - Validação de campos
 * - Atualizar no SQLite local
 * - Sincronizar com backend após atualizar
 * - Deletar tarefa
 */

import React, { useState, useEffect } from "react";
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
import { getTaskById, updateTask, deleteTask } from "../database/tasks";
import { syncTasks } from "../services/sync";
import { COLORS, TASK_STATUS, SUCCESS_MESSAGES } from "../utils/constants";

/**
 * Componente da tela EditTask
 */
export default function EditTaskScreen({ route, navigation }) {
  const { taskId } = route.params;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(TASK_STATUS.PENDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Carrega dados da tarefa
   */
  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const task = await getTaskById(taskId);
      if (task) {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setStatus(task.status || TASK_STATUS.PENDING);
      } else {
        Alert.alert("Erro", "Tarefa não encontrada.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar tarefa:", error);
      Alert.alert("Erro", "Não foi possível carregar a tarefa.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler para salvar alterações
   */
  const handleSave = async () => {
    // Validação
    if (!title.trim()) {
      Alert.alert("Erro", "Por favor, informe o título da tarefa.");
      return;
    }

    setSaving(true);
    try {
      // Atualizar tarefa no SQLite local
      await updateTask(taskId, {
        title: title.trim(),
        description: description.trim() || null,
        status,
      });

      // Tentar sincronizar com backend (não bloquear se falhar)
      try {
        await syncTasks();
      } catch (error) {
        console.warn("⚠️ Erro ao sincronizar (tarefa atualizada localmente):", error);
      }

      Alert.alert("Sucesso", SUCCESS_MESSAGES.TASK_UPDATED, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("❌ Erro ao atualizar tarefa:", error);
      Alert.alert("Erro", "Não foi possível atualizar a tarefa.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handler para deletar tarefa
   */
  const handleDelete = () => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja deletar esta tarefa?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(taskId);
              // Tentar sincronizar com backend
              try {
                await syncTasks();
              } catch (error) {
                console.warn("⚠️ Erro ao sincronizar:", error);
              }
              Alert.alert("Sucesso", SUCCESS_MESSAGES.TASK_DELETED, [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error("❌ Erro ao deletar tarefa:", error);
              Alert.alert("Erro", "Não foi possível deletar a tarefa.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

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
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Text>
        </TouchableOpacity>

        {/* Botão Deletar */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Deletar Tarefa</Text>
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
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginTop: 40,
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
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: COLORS.DANGER,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

