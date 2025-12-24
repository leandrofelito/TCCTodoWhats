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
  Switch,
  Modal,
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
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

  /**
   * Formata o input de data enquanto o usuário digita (DD/MM/YYYY)
   */
  const formatDateInput = (text) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, "");
    
    // Limita a 8 dígitos (DDMMYYYY)
    const limited = numbers.slice(0, 8);
    
    // Adiciona barras automaticamente
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  /**
   * Formata o input de hora enquanto o usuário digita (HH:MM)
   */
  const formatTimeInput = (text) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, "");
    
    // Limita a 4 dígitos (HHMM)
    const limited = numbers.slice(0, 4);
    
    // Adiciona dois pontos automaticamente
    if (limited.length <= 2) {
      return limited;
    } else {
      return `${limited.slice(0, 2)}:${limited.slice(2)}`;
    }
  };

  /**
   * Handler para mudança de input de data
   */
  const handleDateInputChange = (text) => {
    const formatted = formatDateInput(text);
    setDateInput(formatted);
  };

  /**
   * Handler para mudança de input de hora
   */
  const handleTimeInputChange = (text) => {
    const formatted = formatTimeInput(text);
    setTimeInput(formatted);
  };

  /**
   * Handler para confirmar data/hora
   */
  const handleConfirmDateTime = () => {
    if (!dateInput || !timeInput) {
      Alert.alert("Erro", "Por favor, preencha data e hora.");
      return;
    }

    // Parse da data (formato DD/MM/YYYY)
    const [day, month, year] = dateInput.split("/");
    // Parse da hora (formato HH:MM)
    const [hour, minute] = timeInput.split(":");

    if (!day || !month || !year || !hour || !minute) {
      Alert.alert("Erro", "Formato inválido. Use DD/MM/YYYY para data e HH:MM para hora.");
      return;
    }

    const newDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );

    if (isNaN(newDate.getTime())) {
      Alert.alert("Erro", "Data/hora inválida.");
      return;
    }

    if (newDate <= new Date()) {
      Alert.alert("Erro", "A data/hora deve ser no futuro.");
      return;
    }

    setScheduledAt(newDate);
    setShowDatePicker(false);
  };

  /**
   * Formata data/hora para exibição
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

  /**
   * Handler para salvar tarefa
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
      if (scheduledAt <= now) {
        Alert.alert("Erro", "A data/hora agendada deve ser no futuro.");
        return;
      }
    }

    setLoading(true);
    try {
      // Criar tarefa no SQLite local
      await createTask({
        title: title.trim(),
        description: description.trim() || null,
        status,
        scheduled_at: enableScheduling ? scheduledAt.toISOString() : null,
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
                  // Inicializar inputs com valores atuais formatados
                  const now = new Date();
                  const tomorrow = new Date(now);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  // Formatar data como DD/MM/YYYY
                  const day = String(tomorrow.getDate()).padStart(2, "0");
                  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
                  const year = tomorrow.getFullYear();
                  setDateInput(`${day}/${month}/${year}`);
                  
                  // Formatar hora como HH:MM
                  const hour = String(tomorrow.getHours()).padStart(2, "0");
                  const minute = String(tomorrow.getMinutes()).padStart(2, "0");
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
                        <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Confirmar</Text>
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
    justifyContent: "center",
    minHeight: 44,
  },
  statusButtonActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: "500",
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
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
});

