/**
 * Utilitário para Parsing de Data/Hora
 * 
 * Converte expressões de data/hora em português para formato ISO 8601.
 * 
 * Suporta:
 * - Linguagem natural: "amanhã às 15h", "hoje às 20:30", "próxima segunda às 10h"
 * - Formato estruturado: "25/12/2024 15:00", "2024-12-25 15:00"
 */

/**
 * Converte expressão de data/hora em português para ISO 8601
 * 
 * @param {string} text - Texto contendo data/hora
 * @returns {string|null} Data/hora em formato ISO 8601 ou null se não encontrado
 */
const parseDateTime = (text) => {
  if (!text || typeof text !== "string") {
    return null;
  }

  const lowerText = text.toLowerCase().trim();
  const now = new Date();
  let targetDate = new Date(now);

  // Padrões de data/hora estruturados
  // Formato: DD/MM/YYYY HH:mm ou YYYY-MM-DD HH:mm
  const structuredPatterns = [
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/, // 25/12/2024 15:00
    /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/,   // 2024-12-25 15:00
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2})h/,        // 25/12/2024 15h
  ];

  for (const pattern of structuredPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === structuredPatterns[0] || pattern === structuredPatterns[2]) {
        // DD/MM/YYYY
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // Mês é 0-indexed
        const year = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const minute = pattern === structuredPatterns[0] ? parseInt(match[5], 10) : 0;
        targetDate = new Date(year, month, day, hour, minute, 0, 0);
      } else {
        // YYYY-MM-DD
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        targetDate = new Date(year, month, day, hour, minute, 0, 0);
      }

      if (!isNaN(targetDate.getTime()) && targetDate > now) {
        return targetDate.toISOString();
      }
    }
  }

  // Padrões de linguagem natural
  // "hoje às HH:mm" ou "hoje às HHh"
  if (lowerText.includes("hoje")) {
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?h?/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
      
      // Se já passou hoje, considerar amanhã
      if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      if (targetDate > now) {
        return targetDate.toISOString();
      }
    }
  }

  // "amanhã às HH:mm" ou "amanhã às HHh"
  if (lowerText.includes("amanhã") || lowerText.includes("amanha")) {
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?h?/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(hour, minute, 0, 0);
      
      if (targetDate > now) {
        return targetDate.toISOString();
      }
    }
  }

  // "próxima [dia da semana] às HH:mm"
  const weekdays = {
    "domingo": 0,
    "segunda": 1,
    "terça": 2,
    "terca": 2,
    "quarta": 3,
    "quinta": 4,
    "sexta": 5,
    "sábado": 6,
    "sabado": 6,
  };

  for (const [dayName, dayIndex] of Object.entries(weekdays)) {
    if (lowerText.includes(dayName) && (lowerText.includes("próxima") || lowerText.includes("proxima") || lowerText.includes("próximo") || lowerText.includes("proximo"))) {
      const timeMatch = text.match(/(\d{1,2}):?(\d{2})?h?/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1], 10);
        const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        targetDate = new Date(now);
        
        // Calcular dias até o próximo dia da semana
        const currentDay = now.getDay();
        let daysToAdd = (dayIndex - currentDay + 7) % 7;
        if (daysToAdd === 0) {
          daysToAdd = 7; // Se for hoje, considerar próxima semana
        }
        
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        targetDate.setHours(hour, minute, 0, 0);
        
        if (targetDate > now) {
          return targetDate.toISOString();
        }
      }
    }
  }

  return null;
};

/**
 * Extrai data/hora de uma mensagem usando Wit.ai entities (se disponível) ou parsing manual
 * 
 * @param {string} message - Mensagem completa
 * @param {Object} witEntities - Entidades do Wit.ai
 * @returns {string|null} Data/hora em formato ISO 8601 ou null
 */
const extractDateTime = (message, witEntities = {}) => {
  // Tentar usar entidade do Wit.ai primeiro
  if (witEntities["wit$datetime"]) {
    const datetime = witEntities["wit$datetime"];
    try {
      const date = new Date(datetime);
      if (!isNaN(date.getTime()) && date > new Date()) {
        return date.toISOString();
      }
    } catch (error) {
      console.warn("⚠️ Erro ao processar datetime do Wit.ai:", error);
    }
  }

  // Fallback para parsing manual
  return parseDateTime(message);
};

module.exports = {
  parseDateTime,
  extractDateTime,
};

