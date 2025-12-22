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
    created_at: now,
    updated_at: now,
  };
};

module.exports = {
  validateTask,
  normalizeTask,
  createTaskObject,
};

