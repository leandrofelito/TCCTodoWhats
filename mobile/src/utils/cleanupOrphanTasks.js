/**
 * Utilitário para Limpar Tarefas Órfãs
 * 
 * Este arquivo contém funções utilitárias para encontrar e deletar tarefas problemáticas
 * que têm server_id mas não existem mais no backend (tarefas órfãs).
 * 
 * Uso:
 * - Deletar tarefas específicas por título
 * - Limpar todas as tarefas órfãs automaticamente
 * - Verificar integridade das tarefas locais
 */

import { getAllTasks, deleteTasksByTitle, deleteTask, forceDeleteTasksByExactTitle } from "../database/tasks";
import { tasksAPI } from "../services/api";

/**
 * Deleta tarefas específicas por título
 * 
 * @param {Array<string>} titles - Lista de títulos (ou partes) para deletar
 * @returns {Promise<Object>} Resultado da limpeza
 */
export const deleteTasksByTitles = async (titles) => {
  console.log(`🧹 Iniciando limpeza de tarefas: ${titles.join(", ")}`);
  
  let totalDeleted = 0;
  const results = {};
  
  for (const title of titles) {
    try {
      const deleted = await deleteTasksByTitle(title);
      results[title] = deleted;
      totalDeleted += deleted;
      console.log(`✅ Deletadas ${deleted} tarefa(s) com título contendo "${title}"`);
    } catch (error) {
      console.error(`❌ Erro ao deletar tarefas com título "${title}":`, error);
      results[title] = { error: error.message };
    }
  }
  
  return {
    success: true,
    totalDeleted,
    results,
  };
};

/**
 * Verifica e limpa tarefas órfãs (com server_id que não existe no servidor)
 * 
 * @returns {Promise<Object>} Resultado da limpeza
 */
export const cleanupOrphanTasks = async () => {
  console.log("🔍 Verificando tarefas órfãs...");
  
  try {
    // Buscar todas as tarefas locais
    const localTasks = await getAllTasks();
    console.log(`📋 Total de tarefas locais: ${localTasks.length}`);
    
    // Buscar todas as tarefas do servidor
    let serverTasks = [];
    try {
      serverTasks = await tasksAPI.getAll();
      console.log(`📋 Total de tarefas no servidor: ${serverTasks.length}`);
    } catch (error) {
      console.warn("⚠️ Não foi possível buscar tarefas do servidor:", error.message);
      return {
        success: false,
        error: "Não foi possível conectar ao servidor",
        orphanTasks: [],
      };
    }
    
    // Criar mapa de IDs do servidor
    const serverIds = new Set(serverTasks.map(t => t.id));
    
    // Encontrar tarefas órfãs (têm server_id mas não existem no servidor)
    const orphanTasks = localTasks.filter(task => {
      if (!task.server_id) {
        return false; // Tarefa local sem server_id não é órfã
      }
      return !serverIds.has(task.server_id);
    });
    
    console.log(`🔍 Encontradas ${orphanTasks.length} tarefa(s) órfã(s)`);
    
    if (orphanTasks.length === 0) {
      return {
        success: true,
        orphanTasks: [],
        deleted: 0,
      };
    }
    
    // Deletar tarefas órfãs
    let deletedCount = 0;
    for (const task of orphanTasks) {
      try {
        await deleteTask(task.id);
        deletedCount++;
        console.log(`✅ Tarefa órfã "${task.title}" (${task.id}) deletada`);
      } catch (error) {
        console.error(`❌ Erro ao deletar tarefa órfã ${task.id}:`, error);
      }
    }
    
    return {
      success: true,
      orphanTasks: orphanTasks.map(t => ({ id: t.id, title: t.title, server_id: t.server_id })),
      deleted: deletedCount,
    };
  } catch (error) {
    console.error("❌ Erro ao limpar tarefas órfãs:", error);
    return {
      success: false,
      error: error.message,
      orphanTasks: [],
    };
  }
};

/**
 * Limpa tarefas específicas mencionadas pelo usuário
 * 
 * Esta função é chamada para deletar as tarefas problemáticas:
 * - "Teste 2" (com data 24/12)
 * - "Teste" (com data 22/12)
 * 
 * CORREÇÃO: Usa força de deleção para garantir que as tarefas sejam removidas
 * mesmo se houver erro 404 no servidor.
 * 
 * @returns {Promise<Object>} Resultado da limpeza
 */
export const cleanupSpecificProblemTasks = async () => {
  // Títulos exatos das tarefas problemáticas (conforme mostrado na interface)
  const problemTitles = [
    "Teste 2",
    "Teste",
  ];
  
  console.log("🧹 Iniciando limpeza FORÇADA de tarefas problemáticas...");
  
  let totalDeleted = 0;
  const results = {};
  
  for (const title of problemTitles) {
    try {
      // Usar força de deleção para garantir remoção mesmo com erro 404
      const deleted = await forceDeleteTasksByExactTitle(title);
      results[title] = deleted;
      totalDeleted += deleted;
      console.log(`✅ Deletadas ${deleted} tarefa(s) com título exato "${title}"`);
    } catch (error) {
      console.error(`❌ Erro ao deletar tarefas com título "${title}":`, error);
      results[title] = { error: error.message };
    }
  }
  
  console.log(`✅ Limpeza concluída: ${totalDeleted} tarefa(s) removida(s)`);
  
  return {
    success: true,
    totalDeleted,
    results,
  };
};

