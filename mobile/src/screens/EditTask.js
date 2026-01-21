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
  Switch,
  Modal,
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
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

  /**
   * Carrega dados da tarefa
   * Objetivo: preencher os campos da tela e preparar o agendamento existente.
   */
  useEffect(() => {
    loadTask();
  }, [taskId]);

  /**
   * Formata o input de data enquanto o usuário digita (DD/MM/YYYY)
   * Objetivo: evitar entrada inválida e facilitar a digitação.
   * @param {string} text - Texto digitado pelo usuário
   * @returns {string} Texto formatado com barras
   */
  const formatDateInput = (text) => {
    const numbers = text.replace(/\D/g, "");
    const limited = numbers.slice(0, 8);

    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    }
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  };

  /**
   * Formata o input de hora enquanto o usuário digita (HH:MM)
   * Objetivo: manter padrão de hora e evitar caracteres inválidos.
   * @param {string} text - Texto digitado pelo usuário
   * @returns {string} Texto formatado com dois pontos
   */
  const formatTimeInput = (text) => {
    const numbers = text.replace(/\D/g, "");
    const limited = numbers.slice(0, 4);

    if (limited.length <= 2) {
      return limited;
    }
    return `${limited.slice(0, 2)}:${limited.slice(2)}`;
  };

  /**
   * Handler para mudança de input de data
   * Objetivo: atualizar o estado com a data formatada.
   * @param {string} text - Texto digitado no campo
   */
  const handleDateInputChange = (text) => {
    const formatted = formatDateInput(text);
    setDateInput(formatted);
  };

  /**
   * Handler para mudança de input de hora
   * Objetivo: atualizar o estado com a hora formatada.
   * @param {string} text - Texto digitado no campo
   */
  const handleTimeInputChange = (text) => {
    const formatted = formatTimeInput(text);
    setTimeInput(formatted);
  };

  /**
   * Handler para confirmar data/hora do agendamento
   * Objetivo: validar e salvar a nova data/hora no estado.
   */
  const handleConfirmDateTime = () => {
    if (!dateInput || !timeInput) {
      Alert.alert("Erro", "Por favor, preencha data e hora.");
      return;
    }

    const [day, month, year] = dateInput.split("/");
    const [hour, minute] = timeInput.split(":");

    if (!day || !month || !year || !hour || !minute) {
      Alert.alert("Erro", "Formato inválido. Use DD/MM/YYYY para data e HH:MM para hora.");
      return;
    }

    const newDate = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      0,
      0
    );

    if (isNaN(newDate.getTime())) {
      Alert.alert("Erro", "Data/hora inválida.");
      return;
    }

    const now = new Date();
    const nextMinute = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes() + 1,
      0,
      0
    );

    if (newDate <= nextMinute) {
      const nowFormatted = now.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const newDateFormatted = newDate.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      Alert.alert(
        "Erro",
        `A data/hora deve ser no futuro (pelo menos 1 minuto a partir de agora).\n\nAgora: ${nowFormatted}\nTentado: ${newDateFormatted}`
      );
      return;
    }

    setScheduledAt(newDate);
    setShowDatePicker(false);
  };

  /**
   * Formata data/hora para exibição
   * Objetivo: manter padrão pt-BR no campo de agendamento.
   * @param {Date} date - Data a ser formatada
   * @returns {string} Data/hora no formato legível
   */
  const formatDateTime = (date) => {
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadTask = async () => {
    try {
      setLoading(true);
      const task = await getTaskById(taskId);
      if (task) {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setStatus(task.status || TASK_STATUS.PENDING);
        if (task.scheduled_at) {
          const parsedDate = new Date(task.scheduled_at);
          if (!isNaN(parsedDate.getTime())) {
            setEnableScheduling(true);
            setScheduledAt(parsedDate);
            const day = String(parsedDate.getDate()).padStart(2, "0");
            const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
            const year = parsedDate.getFullYear();
            const hour = String(parsedDate.getHours()).padStart(2, "0");
            const minute = String(parsedDate.getMinutes()).padStart(2, "0");
            setDateInput(`${day}/${month}/${year}`);
            setTimeInput(`${hour}:${minute}`);
          } else {
            setEnableScheduling(false);
          }
        } else {
          setEnableScheduling(false);
        }
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
   * Objetivo: validar dados, atualizar tarefa local e sincronizar.
   */
  const handleSave = async () => {
    // Validação
    if (!title.trim()) {
      Alert.alert("Erro", "Por favor, informe o título da tarefa.");
      return;
    }

    // Validar data agendada se habilitada
    if (enableScheduling) {
      const now = new Date();
      const nowNormalized = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        0,
        0
      );
      const scheduledNormalized = new Date(
        scheduledAt.getFullYear(),
        scheduledAt.getMonth(),
        scheduledAt.getDate(),
        scheduledAt.getHours(),
        scheduledAt.getMinutes(),
        0,
        0
      );
      const nextMinute = new Date(nowNormalized);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1);

      if (scheduledNormalized < nextMinute) {
        Alert.alert("Erro", "A data/hora agendada deve ser no futuro (pelo menos 1 minuto a partir de agora).");
        return;
      }
    }

    setSaving(true);
    try {
      // Atualizar tarefa no SQLite local
      await updateTask(taskId, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        scheduled_at: enableScheduling ? scheduledAt.toISOString() : null,
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

        {/* Campo Agendamento */}
        <View style={styles.field}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.label}>Agendar Notificação</Text>
            <Switch
              value={enableScheduling}
              onValueChange={setEnableScheduling}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
              thumbColor="#fff"
            />
          </View>
          {enableScheduling && (
            <View style={styles.scheduleContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  const baseDate = scheduledAt instanceof Date ? scheduledAt : new Date();
                  const day = String(baseDate.getDate()).padStart(2, "0");
                  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
                  const year = baseDate.getFullYear();
                  const hour = String(baseDate.getHours()).padStart(2, "0");
                  const minute = String(baseDate.getMinutes()).padStart(2, "0");
                  setDateInput(`${day}/${month}/${year}`);
                  setTimeInput(`${hour}:${minute}`);
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateTimeText}>
                  {formatDateTime(scheduledAt)}
                </Text>
              </TouchableOpacity>

              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Agendar Data e Hora</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Data (DD/MM/YYYY)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="DD/MM/YYYY"
                        value={dateInput}
                        onChangeText={handleDateInputChange}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Hora (HH:MM)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="HH:MM"
                        value={timeInput}
                        onChangeText={handleTimeInputChange}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCancel]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonConfirm]}
                        onPress={handleConfirmDateTime}
                      >
                        <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                          Confirmar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          )}
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
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduleContainer: {
    marginTop: 8,
  },
  dateTimeButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: "center",
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.TEXT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.TEXT,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f5f5f5",
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  modalButtonTextConfirm: {
    color: "#fff",
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
    // Centraliza o conteúdo para manter o texto alinhado no "quadradinho".
    justifyContent: "center",
  },
  statusButtonActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: "500",
    // Garante centralização do texto quando quebra linha.
    textAlign: "center",
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

