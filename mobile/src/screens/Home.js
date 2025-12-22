/**
 * Tela Home - Lista de Tarefas
 * 
 * Esta é a tela principal do aplicativo.
 * Exibe todas as tarefas do usuário e permite navegação para outras telas.
 * 
 * Funcionalidades:
 * - Listar todas as tarefas (do SQLite local)
 * - Filtrar por status (pendente, em progresso, concluída)
 * - Navegar para criar nova tarefa
 * - Navegar para editar tarefa
 * - Deletar tarefa
 * - Sincronizar com backend manualmente (pull-to-refresh)
 * - Sincronizar com backend automaticamente em intervalos regulares
 * - Indicador de status de sincronização (estado da lista)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAllTasks, deleteTask } from "../database/tasks";
import { initDatabase } from "../database/db";
import { syncTasks, startAutoSync } from "../services/sync";
import TaskItem from "../components/TaskItem";
import { COLORS, TASK_STATUS } from "../utils/constants";

/**
 * Componente da tela Home
 */
export default function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, in_progress, completed
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega tarefas do banco de dados local
   *
   * Fluxo importante:
   * - Garantir que o banco de dados e as migrações foram executados
   *   antes de executar qualquer SELECT em `tasks`.
   * - Isso evita erros transitórios como "no such column: created_at"
   *   em dispositivos que ainda possuem um schema antigo da tabela.
   */
  const loadTasks = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Home.js:53',message:'loadTasks ENTRY',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    try {
      setLoading(true);

      // 1) Garantir que o banco foi inicializado e migrado
      //    Mesmo que o App já chame `initDatabase`, aqui reforçamos
      //    para evitar condições de corrida (race condition) onde
      //    a Home tenta ler antes da migração terminar.
      await initDatabase();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Home.js:64',message:'initDatabase completed, fetching tasks',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 2) Buscar todas as tarefas já com o schema atualizado
      const allTasks = await getAllTasks();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/900d3e87-1857-467b-b71f-e58429934408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Home.js:66',message:'Tasks loaded successfully',data:{tasksCount:allTasks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      setTasks(allTasks);
    } catch (error) {
      console.error("❌ Erro ao carregar tarefas:", error);
      Alert.alert("Erro", "Não foi possível carregar as tarefas.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recarrega tarefas quando a tela recebe foco
   * Útil quando volta de outras telas (AddTask, EditTask)
   */
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  /**
   * Sincronização automática em background
   *
   * Objetivo:
   * - Manter o app sempre alinhado com o backend e com o WhatsApp,
   *   sem exigir que o usuário puxe para atualizar manualmente.
   * - Garantir que tarefas criadas/alteradas no app sejam enviadas
   *   periodicamente para o backend, e que tarefas criadas via
   *   WhatsApp sejam trazidas para o SQLite local com frequência.
   *
   * Estratégia:
   * - Usa `startAutoSync` do serviço de sync, que:
   *   - Executa uma sincronização imediata na montagem da Home.
   *   - Agenda sincronizações em intervalo fixo (definido em
   *     `SYNC_CONFIG.INTERVAL` nas constantes).
   * - Após cada sincronização, chamamos `loadTasks()` para recarregar
   *   a lista local com qualquer alteração vinda do backend.
   *
   * Observação:
   * - Mantemos também o pull-to-refresh manual para o usuário ter
   *   controle explícito quando desejar.
   */
  useEffect(() => {
    // Iniciar sincronização automática ao montar a tela Home
    const stopAutoSync = startAutoSync(() => {
      // Após cada ciclo de sync, recarregar tarefas locais.
      // Não aguardamos explicitamente aqui para não bloquear o callback.
      loadTasks();
    });

    // Ao desmontar a tela, interromper a sincronização automática
    return () => {
      if (typeof stopAutoSync === "function") {
        stopAutoSync();
      }
    };
  }, []);

  /**
   * Handler para pull-to-refresh
   * Recarrega tarefas e sincroniza com backend
   */
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Sincronizar com backend
      await syncTasks();
      // Recarregar tarefas locais
      await loadTasks();
    } catch (error) {
      console.error("❌ Erro ao sincronizar:", error);
      Alert.alert("Erro", "Não foi possível sincronizar. Verifique sua conexão.");
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handler para deletar tarefa
   */
  const handleDelete = (taskId) => {
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
              const deleted = await deleteTask(taskId);
              if (deleted) {
                // Recarregar lista imediatamente após deletar
                await loadTasks();
                // Tentar sincronizar para deletar no servidor (não bloquear se falhar)
                try {
                  await syncTasks();
                  // Recarregar novamente após sincronização
                  await loadTasks();
                } catch (syncError) {
                  console.warn("⚠️ Erro ao sincronizar após deletar (tarefa deletada localmente):", syncError);
                }
              } else {
                Alert.alert("Aviso", "Tarefa não encontrada.");
              }
            } catch (error) {
              console.error("❌ Erro ao deletar tarefa:", error);
              Alert.alert("Erro", "Não foi possível deletar a tarefa.");
            }
          },
        },
      ]
    );
  };

  /**
   * Filtra tarefas baseado no filtro selecionado
   */
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  /**
   * Renderiza item da lista de tarefas
   */
  const renderTaskItem = ({ item }) => (
    <TaskItem
      task={item}
      onPress={() => navigation.navigate("EditTask", { taskId: item.id })}
      onDelete={() => handleDelete(item.id)}
    />
  );

  /**
   * Renderiza lista vazia
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
      <Text style={styles.emptySubtext}>
        Toque no botão + para criar uma nova tarefa
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === TASK_STATUS.PENDING && styles.filterButtonActive,
          ]}
          onPress={() => setFilter(TASK_STATUS.PENDING)}
        >
          <Text
            style={[
              styles.filterText,
              filter === TASK_STATUS.PENDING && styles.filterTextActive,
            ]}
          >
            Pendentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === TASK_STATUS.COMPLETED && styles.filterButtonActive,
          ]}
          onPress={() => setFilter(TASK_STATUS.COMPLETED)}
        >
          <Text
            style={[
              styles.filterText,
              filter === TASK_STATUS.COMPLETED && styles.filterTextActive,
            ]}
          >
            Concluídas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de tarefas */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Botão flutuante para adicionar tarefa */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddTask")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
});

