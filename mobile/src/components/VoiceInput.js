/**
 * Componente VoiceInput - Entrada de Voz
 * 
 * Este componente permite ao usuário criar tarefas usando comandos de voz.
 * 
 * Funcionalidades:
 * - Gravar áudio do usuário
 * - Enviar áudio para backend/Wit.ai
 * - Processar resposta e criar tarefa
 * - Feedback visual durante gravação
 * 
 * Fluxo:
 * 1. Usuário pressiona botão de gravar
 * 2. App grava áudio
 * 3. Áudio é enviado para backend
 * 4. Backend processa com Wit.ai
 * 5. Backend cria tarefa baseado no comando
 * 6. App sincroniza e atualiza lista
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import { witAPI } from "../services/api";
import { createTask } from "../database/tasks";
import { syncTasks } from "../services/sync";
import { COLORS } from "../utils/constants";

/**
 * Componente VoiceInput
 * 
 * @param {Function} onTaskCreated - Callback quando tarefa é criada
 */
export default function VoiceInput({ onTaskCreated }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);

  /**
   * Inicia gravação de áudio
   */
  const startRecording = async () => {
    try {
      // Solicitar permissão de áudio
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "É necessário permitir acesso ao microfone.");
        return;
      }

      // Configurar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Iniciar gravação
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error("❌ Erro ao iniciar gravação:", error);
      Alert.alert("Erro", "Não foi possível iniciar a gravação.");
    }
  };

  /**
   * Para gravação e processa áudio
   */
  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setProcessing(true);

      // Parar gravação
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      // Criar FormData para enviar áudio
      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/wav",
        name: "audio.wav",
      });

      // Enviar para backend
      const result = await witAPI.processAudio(formData);

      // Processar resultado
      if (result.intent === "create_task" || result.intent === "add_task") {
        // Criar tarefa baseado no resultado
        const title = result.entities?.title || result.entities?.task_name || result.text || "Tarefa criada por voz";
        const description = result.entities?.description || null;
        const status = result.entities?.status || "pending";

        await createTask({
          title: typeof title === "string" ? title : title[0],
          description: description ? (typeof description === "string" ? description : description[0]) : null,
          status: typeof status === "string" ? status : status[0],
        });

        // Sincronizar com backend
        try {
          await syncTasks();
        } catch (error) {
          console.warn("⚠️ Erro ao sincronizar:", error);
        }

        Alert.alert("Sucesso", "Tarefa criada com sucesso via comando de voz!");
        
        if (onTaskCreated) {
          onTaskCreated();
        }
      } else {
        Alert.alert("Comando não reconhecido", "Não foi possível criar uma tarefa. Tente novamente.");
      }
    } catch (error) {
      console.error("❌ Erro ao processar áudio:", error);
      Alert.alert("Erro", "Não foi possível processar o áudio. Verifique sua conexão.");
    } finally {
      setRecording(null);
      setProcessing(false);
    }
  };

  /**
   * Cancela gravação
   */
  const cancelRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (error) {
        console.error("❌ Erro ao cancelar gravação:", error);
      }
    }
    setRecording(null);
    setIsRecording(false);
    setProcessing(false);
  };

  return (
    <View style={styles.container}>
      {processing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.processingText}>Processando áudio...</Text>
        </View>
      ) : isRecording ? (
        <View style={styles.recordingContainer}>
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopRecording}
          >
            <Text style={styles.buttonText}>⏹ Parar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={cancelRecording}
          >
            <Text style={styles.buttonText}>✕ Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.recordButton]}
          onPress={startRecording}
        >
          <Text style={styles.buttonText}>🎤 Gravar</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.hint}>
        Toque para gravar um comando de voz para criar uma tarefa
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  recordButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  stopButton: {
    backgroundColor: COLORS.DANGER,
  },
  cancelButton: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  recordingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  processingContainer: {
    alignItems: "center",
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
});

