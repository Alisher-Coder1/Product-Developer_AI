import { encode } from "gpt-tokenizer";

/**
 * Разбивает текст на секции по заголовкам второго уровня (##).
 * @param {string} text - исходный текст в формате Markdown
 * @returns {string[]} массив секций
 */
function splitSections(text) {
  return text
    .split(/\n(?=##\s)/g)
    .map((section) => section.trim())
    .filter(Boolean);
}

/**
 * Определяет слой архитектуры по содержимому секции.
 * @param {string} section - текст секции
 * @returns {string} идентификатор слоя (product, architecture, ... , other)
 */
function detectLayer(section) {
  const lower = section.toLowerCase();

  if (lower.includes("product/")) return "product";
  if (lower.includes("architecture/")) return "architecture";
  if (lower.includes("domain/")) return "domain";
  if (lower.includes("application/")) return "application";
  if (lower.includes("contracts/")) return "contracts";
  if (lower.includes("blocks/")) return "blocks";

  return "other";
}

/**
 * Возвращает приоритет слоя для сортировки при сокращении.
 * @param {string} layer - идентификатор слоя
 * @param {Object} contextPriority - переопределение приоритетов
 * @returns {number} числовой приоритет (чем выше, тем важнее)
 */
function getPriority(layer, contextPriority = {}) {
  const defaults = {
    product: 10,
    architecture: 9,
    domain: 8,
    application: 7,
    contracts: 6,
    blocks: 5,
    other: 1
  };

  return contextPriority[layer] ?? defaults[layer] ?? 0;
}

/**
 * Сокращает текст до заданного бюджета токенов, сохраняя наиболее приоритетные секции.
 * @param {string} text - исходный текст
 * @param {number} targetBudget - целевое количество токенов
 * @param {Object} options - опции (contextPriority, model)
 * @returns {string} сокращённый текст
 */
function summarize(text, targetBudget, options = {}) {
  const sections = splitSections(text);

  const ranked = sections.map((section) => {
    const layer = detectLayer(section);
    const priority = getPriority(layer, options.contextPriority);
    const tokens = countTokens(section, options.model || "gpt-4");

    return {
      section,
      layer,
      priority,
      tokens
    };
  });

  ranked.sort((a, b) => b.priority - a.priority);

  let selected = [];
  let total = 0;

  for (const item of ranked) {
    if (total + item.tokens <= targetBudget) {
      selected.push(item.section);
      total += item.tokens;
    }
  }

  // Fallback: если ни одна секция не помещается, берём самую приоритетную
  if (selected.length === 0 && ranked.length > 0) {
    selected.push(ranked[0].section);
    total = ranked[0].tokens;
    console.warn(`Budget too low (${targetBudget}), including highest priority section (${ranked[0].tokens} tokens)`);
  }

  return selected.join("\n\n");
}

/**
 * Подсчитывает количество токенов в тексте для указанной модели.
 * @param {string} text - исходный текст
 * @param {string} [model="gpt-4"] - идентификатор модели (в текущей реализации не влияет)
 * @returns {number} количество токенов
 */
export function countTokens(text, model = "gpt-4") {
  return encode(text).length;
}

/**
 * Проверяет, укладывается ли текст в бюджет токенов, и при необходимости возвращает сокращённую версию.
 * @param {string} text - исходный текст
 * @param {number} budget - максимальное допустимое количество токенов
 * @param {Object} options - дополнительные опции (contextPriority, model)
 * @returns {Object} результат проверки
 * @returns {number} result.count - исходное количество токенов
 * @returns {boolean} result.exceeded - превышен ли бюджет
 * @returns {string} result.summaryText - текст для использования (исходный или сокращённый)
 * @returns {Object} result.reductionStats - статистика сокращения
 * @returns {number} result.reductionStats.original - исходное количество токенов
 * @returns {number} result.reductionStats.final - конечное количество токенов после сокращения
 */
export function checkBudget(text, budget, options = {}) {
  if (typeof budget !== 'number' || budget < 0) {
    throw new Error('Budget must be a non-negative number');
  }

  const count = countTokens(text, options.model || "gpt-4");

  if (count <= budget) {
    return {
      count,
      exceeded: false,
      summaryText: text,
      reductionStats: {
        original: count,
        final: count
      }
    };
  }

  const summaryText = summarize(text, budget, options);
  const finalCount = countTokens(summaryText, options.model || "gpt-4");

  return {
    count,
    exceeded: true,
    summaryText,
    reductionStats: {
      original: count,
      final: finalCount
    }
  };
}