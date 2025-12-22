/**
 * Componente TaskItem - Item de Tarefa na Lista
 * 
 * Este componente renderiza um item individual da lista de tarefas.
 * 
 * Funcionalidades:
 * - Exibe título e descrição da tarefa
 * - Mostra status com cor indicativa
 * - Permite tocar para editar
 * - Permite deletar com swipe ou botão
 * - Mostra data de criação/atualização
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, TASK_STATUS } from "../utils/constants";

/**
 * Componente TaskItem
 * 
 * @param {Object} props
 * @param {Object} props.task - Dados da tarefa
 * @param {Function} props.onPress - Callback quando item é pressionado
 * @param {Function} props.onDelete - Callback quando item é deletado
 */
export default function TaskItem({ task, onPress, onDelete }) {
  /**
   * Obtém cor do status
   */
  const getStatusColor = () => {
    switch (task.status) {
      case TASK_STATUS.COMPLETED:
        return COLORS.SUCCESS;
      case TASK_STATUS.IN_PROGRESS:
        return COLORS.SECONDARY;
      case TASK_STATUS.PENDING:
      default:
        return COLORS.WARNING;
    }
  };

  /**
   * Obtém texto do status
   */
  const getStatusText = () => {
    switch (task.status) {
      case TASK_STATUS.COMPLETED:
        return "Concluída";
      case TASK_STATUS.IN_PROGRESS:
        return "Em Progresso";
      case TASK_STATUS.PENDING:
      default:
        return "Pendente";
    }
  };

  /**
   * Formata data para exibição
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Hoje";
    } else if (diffDays === 2) {
      return "Ontem";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Título */}
        <Text style={styles.title} numberOfLines={1}>
          {task.title}
        </Text>

        {/* Descrição (se existir) */}
        {task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {/* Footer com status e data */}
        <View style={styles.footer}>
          {/* Status */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>

          {/* Data */}
          <Text style={styles.date}>
            {formatDate(task.updated_at || task.created_at)}
          </Text>
        </View>
      </View>

      {/* Indicador de sincronização */}
      {task.synced === 0 && (
        <View style={styles.syncIndicator}>
          <Text style={styles.syncText}>⏳</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  syncIndicator: {
    marginLeft: 8,
  },
  syncText: {
    fontSize: 16,
  },
});

