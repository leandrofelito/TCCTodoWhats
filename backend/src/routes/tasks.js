/**
 * Rotas de Tarefas
 * 
 * Define todas as rotas relacionadas a tarefas.
 * 
 * Endpoints:
 * - GET /api/tasks - Listar todas as tarefas
 * - GET /api/tasks/:id - Obter tarefa específica
 * - POST /api/tasks - Criar nova tarefa
 * - PUT /api/tasks/:id - Atualizar tarefa
 * - DELETE /api/tasks/:id - Deletar tarefa
 * - POST /api/tasks/sync - Sincronizar tarefas
 */

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { validateTask, normalizeTask } = require("../models/Task");

/**
 * GET /api/tasks
 * Lista todas as tarefas
 */
router.get("/", (req, res) => {
  try {
    const tasks = db.getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error("❌ Erro ao listar tarefas:", error);
    res.status(500).json({
      error: {
        message: "Erro ao listar tarefas",
        status: 500,
      },
    });
  }
});

/**
 * GET /api/tasks/:id
 * Obtém uma tarefa específica
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const task = db.getTaskById(id);

    if (!task) {
      return res.status(404).json({
        error: {
          message: "Tarefa não encontrada",
          status: 404,
        },
      });
    }

    res.json(task);
  } catch (error) {
    console.error("❌ Erro ao buscar tarefa:", error);
    res.status(500).json({
      error: {
        message: "Erro ao buscar tarefa",
        status: 500,
      },
    });
  }
});

/**
 * POST /api/tasks
 * Cria uma nova tarefa
 */
router.post("/", (req, res) => {
  try {
    const taskData = req.body;

    // Validar dados
    const validation = validateTask(taskData);
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          message: "Dados inválidos",
          details: validation.errors,
          status: 400,
        },
      });
    }

    // Normalizar e criar tarefa
    const normalized = normalizeTask(taskData);
    const task = db.createTask(normalized);

    res.status(201).json(task);
  } catch (error) {
    console.error("❌ Erro ao criar tarefa:", error);
    res.status(500).json({
      error: {
        message: "Erro ao criar tarefa",
        status: 500,
      },
    });
  }
});

/**
 * PUT /api/tasks/:id
 * Atualiza uma tarefa existente
 */
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar se tarefa existe
    const existingTask = db.getTaskById(id);
    if (!existingTask) {
      return res.status(404).json({
        error: {
          message: "Tarefa não encontrada",
          status: 404,
        },
      });
    }

    // Validar dados (permitir atualização parcial)
    const taskToValidate = { ...existingTask, ...updates };
    const validation = validateTask(taskToValidate);
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          message: "Dados inválidos",
          details: validation.errors,
          status: 400,
        },
      });
    }

    // Normalizar e atualizar
    const normalized = normalizeTask(updates);
    const updatedTask = db.updateTask(id, normalized);

    res.json(updatedTask);
  } catch (error) {
    console.error("❌ Erro ao atualizar tarefa:", error);
    res.status(500).json({
      error: {
        message: "Erro ao atualizar tarefa",
        status: 500,
      },
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Deleta uma tarefa
 */
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteTask(id);

    if (!deleted) {
      return res.status(404).json({
        error: {
          message: "Tarefa não encontrada",
          status: 404,
        },
      });
    }

    res.json({ message: "Tarefa deletada com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao deletar tarefa:", error);
    res.status(500).json({
      error: {
        message: "Erro ao deletar tarefa",
        status: 500,
      },
    });
  }
});

/**
 * POST /api/tasks/sync
 * Sincroniza tarefas do mobile com o servidor
 * 
 * Estratégia:
 * - Recebe lista de tarefas do mobile
 * - Para cada tarefa:
 *   - Se não existe no servidor, cria
 *   - Se existe e servidor tem versão mais recente, mantém servidor
 *   - Se mobile tem versão mais recente, atualiza servidor
 * - Retorna lista de tarefas do servidor para sincronização reversa
 */
router.post("/sync", (req, res) => {
  try {
    const { tasks: mobileTasks } = req.body;
    const serverTasks = db.getAllTasks();
    const syncedIds = [];

    // Criar mapa de tarefas do servidor por ID
    const serverTasksMap = new Map(serverTasks.map((t) => [t.id, t]));

    // Processar tarefas do mobile
    if (mobileTasks && Array.isArray(mobileTasks)) {
      for (const mobileTask of mobileTasks) {
        const serverTask = serverTasksMap.get(mobileTask.server_id || mobileTask.id);

        if (!serverTask) {
          // Tarefa não existe no servidor, criar
          const validation = validateTask(mobileTask);
          if (validation.valid) {
            const normalized = normalizeTask(mobileTask);
            const newTask = db.createTask(normalized);
            syncedIds.push(mobileTask.id);
            serverTasksMap.set(newTask.id, newTask);
          }
        } else {
          // Tarefa existe, verificar qual versão é mais recente
          const serverUpdated = new Date(serverTask.updated_at);
          const mobileUpdated = new Date(mobileTask.updated_at);

          if (mobileUpdated > serverUpdated) {
            // Mobile tem versão mais recente, atualizar servidor
            const validation = validateTask(mobileTask);
            if (validation.valid) {
              const normalized = normalizeTask(mobileTask);
              db.updateTask(serverTask.id, normalized);
              syncedIds.push(mobileTask.id);
            }
          } else {
            // Servidor tem versão mais recente, manter servidor
            syncedIds.push(mobileTask.id);
          }
        }
      }
    }

    // Retornar tarefas do servidor para sincronização reversa
    res.json({
      syncedIds,
      tasks: Array.from(serverTasksMap.values()),
    });
  } catch (error) {
    console.error("❌ Erro ao sincronizar tarefas:", error);
    res.status(500).json({
      error: {
        message: "Erro ao sincronizar tarefas",
        status: 500,
      },
    });
  }
});

module.exports = router;

