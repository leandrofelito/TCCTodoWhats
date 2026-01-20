/**
 * Componente TaskItem - Item de Tarefa na Lista
 * 
 * Este componente renderiza um item individual da lista de tarefas.
 * 
 * Funcionalidades:
 * - Exibe título e descrição da tarefa
 * - Mostra status com cor indicativa
 * - Mostra horário agendado (se existir)
 * - Permite tocar para editar
 * - Permite deletar, editar e concluir com ícones
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
 * @param {Function} props.onEdit - Callback quando botão editar é pressionado
 * @param {Function} props.onDelete - Callback quando botão deletar é pressionado
 * @param {Function} props.onComplete - Callback quando botão concluir é pressionado
 */
export default function TaskItem({ task, onPress, onEdit, onDelete, onComplete }) {
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

  /**
   * Formata horário agendado para exibição
   */
  const formatScheduledTime = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Verificar se é hoje
    const isToday = 
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      // Se for hoje, mostrar apenas a hora
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // Se não for hoje, mostrar data e hora
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const scheduledTime = formatScheduledTime(task.scheduled_at);
  const isCompleted = task.status === TASK_STATUS.COMPLETED;

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

        {/* Horário agendado (se existir) */}
        {scheduledTime && (
          <View style={styles.scheduledContainer}>
            <Text style={styles.scheduledIcon}>📅</Text>
            <Text style={styles.scheduledText}>{scheduledTime}</Text>
          </View>
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

      {/* Ações com ícones */}
      <View style={styles.actionsContainer}>
        {/* Botão Concluir (só mostra se não estiver concluída) */}
        {!isCompleted && onComplete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>✅</Text>
          </TouchableOpacity>
        )}

        {/* Botão Editar */}
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
        )}

        {/* Botão Deletar */}
        {onDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        )}

        {/* Indicador de sincronização */}
        {task.synced === 0 && (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>⏳</Text>
          </View>
        )}
      </View>
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
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    marginRight: 8,
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
  scheduledContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduledIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  scheduledText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: "500",
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
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 20,
  },
  syncIndicator: {
    marginLeft: 4,
  },
  syncText: {
    fontSize: 16,
  },
});

