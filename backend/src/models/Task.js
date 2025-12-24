/**
 * Modelo de Tarefa
 * 
 * Define a estrutura e validação de uma tarefa.
 * 
 * Estrutura:
 * - id: ID único da tarefa
 * - title: Título da tarefa (obrigatório)
 * - description: Descrição da tarefa (opcional)
 * - status: Status da tarefa (pending, in_progress, completed)
 * - scheduled_at: Data/hora agendada para a tarefa (opcional, ISO 8601)
 * - created_at: Data de criação (ISO 8601)
 * - updated_at: Data de última atualização (ISO 8601)
 */

/**
 * Valida dados de uma tarefa
 * 
 * @param {Object} taskData - Dados da tarefa
 * @returns {Object} { valid: boolean, errors: Array }
 */
const validateTask = (taskData) => {
  const errors = [];

  // Validar título
  if (!taskData.title || typeof taskData.title !== "string" || taskData.title.trim().length === 0) {
    errors.push("Título é obrigatório");
  } else if (taskData.title.length > 100) {
    errors.push("Título deve ter no máximo 100 caracteres");
  }

  // Validar descrição (opcional)
  if (taskData.description !== undefined && taskData.description !== null) {
    if (typeof taskData.description !== "string") {
      errors.push("Descrição deve ser uma string");
    } else if (taskData.description.length > 500) {
      errors.push("Descrição deve ter no máximo 500 caracteres");
    }
  }

  // Validar status
  const validStatuses = ["pending", "in_progress", "completed"];
  if (taskData.status && !validStatuses.includes(taskData.status)) {
    errors.push(`Status deve ser um dos seguintes: ${validStatuses.join(", ")}`);
  }

  // Validar scheduled_at (opcional)
  if (taskData.scheduled_at !== undefined && taskData.scheduled_at !== null) {
    if (typeof taskData.scheduled_at !== "string") {
      errors.push("scheduled_at deve ser uma string no formato ISO 8601");
    } else {
      // Validar formato ISO 8601
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (!dateRegex.test(taskData.scheduled_at)) {
        errors.push("scheduled_at deve estar no formato ISO 8601 (ex: 2024-12-25T15:00:00.000Z)");
      } else {
        // Validar se é data futura
        const scheduledDate = new Date(taskData.scheduled_at);
        const now = new Date();
        if (isNaN(scheduledDate.getTime())) {
          errors.push("scheduled_at deve ser uma data válida");
        } else if (scheduledDate <= now) {
          errors.push("scheduled_at deve ser uma data futura");
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Normaliza dados de tarefa
 * Remove espaços em branco e define valores padrão
 * 
 * @param {Object} taskData - Dados da tarefa
 * @returns {Object} Dados normalizados
 */
const normalizeTask = (taskData) => {
  return {
    title: taskData.title ? taskData.title.trim() : "",
    description: taskData.description ? taskData.description.trim() : null,
    status: taskData.status || "pending",
    scheduled_at: taskData.scheduled_at || null,
  };
};

/**
 * Cria objeto de tarefa completo
 * 
 * @param {Object} taskData - Dados da tarefa
 * @param {string} id - ID da tarefa
 * @returns {Object} Tarefa completa
 */
const createTaskObject = (taskData, id) => {
  const now = new Date().toISOString();
  const normalized = normalizeTask(taskData);

  return {
    id,
    title: normalized.title,
    description: normalized.description,
    status: normalized.status,
    scheduled_at: normalized.scheduled_at,
    created_at: now,
    updated_at: now,
  };
};

module.exports = {
  validateTask,
  normalizeTask,
  createTaskObject,
};

