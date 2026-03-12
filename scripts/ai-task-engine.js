import { checkBudget } from "./token-budget.js";

const ALLOWED_LAYERS = ['product', 'architecture', 'domain', 'application', 'contracts', 'blocks'];

function normalizeMicrotask(task, index) {
  return {
    id: task.id || `task-${index + 1}`,
    description: task.description || "",
    layer: ALLOWED_LAYERS.includes(task.layer) ? task.layer : "application",
    dependencies: Array.isArray(task.dependencies) ? task.dependencies.filter(d => typeof d === 'string') : [],
    estimatedTokens: typeof task.estimatedTokens === "number" ? task.estimatedTokens : 0
  };
}

function validateMicrotask(task) {
  return (
    typeof task.id === "string" &&
    typeof task.description === "string" &&
    ALLOWED_LAYERS.includes(task.layer) &&
    Array.isArray(task.dependencies) &&
    task.dependencies.every(d => typeof d === 'string') &&
    typeof task.estimatedTokens === "number"
  );
}

async function callLLM(taskDescription, context, options = {}) {
  // Здесь должен быть реальный вызов OpenAI API
  // Пример:
  // const response = await openai.chat.completions.create({ ... });
  // return JSON.parse(response.choices[0].message.content);

  // Заглушка для тестов
  return {
    rawResponse: [
      {
        id: "task-1",
        description: taskDescription,
        layer: "application",
        dependencies: [],
        estimatedTokens: 0
      }
    ],
    prompt: `Task: ${taskDescription}\nContext: ${context}`
  };
}

export async function decomposeTask(taskDescription, context, options = {}) {
  const { rawResponse, prompt } = await callLLM(taskDescription, context, options);

  if (!Array.isArray(rawResponse)) {
    throw new Error(`LLM response must be an array, got ${typeof rawResponse}`);
  }

  const microtasks = rawResponse.map((task, index) => normalizeMicrotask(task, index));
  const budget = options?.taskBudget ?? 500;

  const enrichedMicrotasks = microtasks.map((task) => {
    try {
      const tokenCheck = checkBudget(task.description, budget, options);
      return {
        ...task,
        estimatedTokens: tokenCheck?.count ?? 0
      };
    } catch (err) {
      console.warn(`Token check failed for task ${task.id}: ${err.message}`);
      return { ...task, estimatedTokens: 0 };
    }
  });

  const invalidTask = enrichedMicrotasks.find((task) => !validateMicrotask(task));
  if (invalidTask) {
    throw new Error(`Invalid microtask structure: ${JSON.stringify(invalidTask)}`);
  }

  return {
    microtasks: enrichedMicrotasks,
    rawResponse,
    prompt
  };
}