# AI Task Engine

**Файл реализации:** `scripts/ai-task-engine.js`  
**Назначение:** декомпозиция высокоуровневой задачи (feature) в последовательность микрозадач, соответствующих слоям архитектуры (product, architecture, domain, application, contracts, blocks).  
**Этап Roadmap:** этап 2 (Stage Engine и AI Task Engine)

---

## Входные данные

| Параметр           | Тип     | Описание                                                       |
|--------------------|---------|----------------------------------------------------------------|
| `taskDescription`  | string  | Описание задачи на естественном языке                          |
| `context`          | string  | Проектный контекст (обычно содержимое `generated/project-context.md`) |
| `options`          | object  | Дополнительные параметры (см. ниже)                            |

### Поля `options`

| Параметр      | Тип    | Значение по умолчанию | Описание                                        |
|---------------|--------|-----------------------|-------------------------------------------------|
| `model`       | string | `"gpt-4"`             | Идентификатор LLM (влияет на токенизацию и качество) |
| `rules`       | string | `undefined`           | Путь к файлу с правилами декомпозиции (опционально) |
| `taskBudget`  | number | `500`                 | Бюджет токенов для каждой микрозадачи (используется для оценки `estimatedTokens`) |
| `maxMicrotasks`| number | `10`                  | Максимальное количество микрозадач (ограничение) |

---

## Выходные данные

Функция `decomposeTask` возвращает Promise, который разрешается объектом:

```typescript
{
  microtasks: Microtask[];      // массив микрозадач
  rawResponse: any;             // сырой ответ LLM (для отладки)
  prompt: string;               // сформированный промпт, отправленный в LLM
}

interface Microtask {
  id: string;                   // уникальный идентификатор (например, "task-1")
  description: string;          // описание микрозадачи
  layer: string;                // один из: "product", "architecture", "domain", "application", "contracts", "blocks"
  dependencies: string[];       // id задач, от которых зависит данная
  estimatedTokens: number;      // оценочное количество токенов для выполнения (вычисляется через Token Budget Engine)
}
Алгоритм
Формирование промпта
Создаётся текстовый промпт, включающий:

описание задачи (taskDescription)

контекст проекта (context)

инструкцию вернуть JSON-массив объектов, каждый из которых содержит поля: id, description, layer, dependencies, estimatedTokens

пример ожидаемого вывода (опционально, для повышения качества)

Вызов LLM
Отправка промпта к указанной модели (через API). В случае ошибки сети или таймаута – повторная попытка (до 3 раз).

Обработка ответа

Парсинг JSON из ответа LLM.

Если ответ не является массивом, генерируется исключение с указанием полученного значения.

Нормализация микрозадач
Для каждого элемента массива:

если отсутствует id, генерируется task-{index+1}

если отсутствует description, устанавливается пустая строка

если layer не входит в список допустимых, заменяется на "application" (по умолчанию)

если dependencies не массив, устанавливается пустой массив

если estimatedTokens не число, устанавливается 0

Оценка токенов
Для каждой микрозадачи вызывается функция checkBudget из Token Budget Engine с параметрами:

text: описание микрозадачи

budget: options.taskBudget

options: пробрасываются (модель и т.д.)
Полученное значение count записывается в поле estimatedTokens. При ошибке вызова checkBudget значение остаётся 0, а в консоль выводится предупреждение.

Валидация структуры
Проверяется, что каждая микрозадача содержит все обязательные поля и их типы соответствуют ожидаемым:

id – строка

description – строка

layer – строка из допустимого набора

dependencies – массив строк

estimatedTokens – число
Если хотя бы одна задача не проходит валидацию, выбрасывается исключение с информацией о проблемной задаче.

Возврат результата
Возвращается объект, содержащий массив микрозадач, сырой ответ LLM и использованный промпт.

Программный интерфейс
javascript
/**
 * Декомпозирует задачу на микрозадачи с помощью LLM.
 * @param {string} taskDescription - описание задачи
 * @param {string} context - контекст проекта
 * @param {Object} [options] - дополнительные параметры
 * @param {string} [options.model="gpt-4"] - модель LLM
 * @param {string} [options.rules] - путь к файлу с правилами
 * @param {number} [options.taskBudget=500] - бюджет токенов на микрозадачу
 * @param {number} [options.maxMicrotasks=10] - максимальное количество микрозадач
 * @returns {Promise<{ microtasks: Microtask[], rawResponse: any, prompt: string }>}
 */
export async function decomposeTask(taskDescription, context, options = {}) {
  // реализация
}
Пример использования
javascript
import { decomposeTask } from './scripts/ai-task-engine.js';
import fs from 'fs/promises';

// Загружаем контекст проекта
const context = await fs.readFile('generated/project-context.md', 'utf-8');

// Выполняем декомпозицию
const result = await decomposeTask(
  'Добавить аутентификацию через JWT',
  context,
  { model: 'gpt-4', taskBudget: 600, maxMicrotasks: 8 }
);

console.log('Сгенерировано микрозадач:', result.microtasks.length);
console.log('Использованный промпт:', result.prompt);
console.log('Микрозадачи:', JSON.stringify(result.microtasks, null, 2));
Пример вывода:

json
{
  "microtasks": [
    {
      "id": "task-1",
      "description": "Определить модель User в слое domain",
      "layer": "domain",
      "dependencies": [],
      "estimatedTokens": 120
    },
    {
      "id": "task-2",
      "description": "Создать use case регистрации в application",
      "layer": "application",
      "dependencies": ["task-1"],
      "estimatedTokens": 200
    }
  ],
  "rawResponse": "[{\"id\":\"task-1\",\"description\":\"Определить модель User в слое domain\",\"layer\":\"domain\",\"dependencies\":[],\"estimatedTokens\":120},...]",
  "prompt": "Task: Добавить аутентификацию через JWT\nContext: ..."
}
Конфигурация
Глобальная конфигурация не требуется. Все настройки передаются через параметр options при вызове. При необходимости использования внешних правил декомпозиции можно указать путь к файлу в options.rules. Формат этого файла не стандартизирован и остаётся на усмотрение разработчика (может содержать примеры, ограничения и т.д.).

Обработка ошибок
Ситуация	Реакция
Ошибка сети при вызове LLM	Повторная попытка до 3 раз, затем исключение с описанием ошибки
Ответ LLM не является JSON-массивом	Исключение: "LLM response must be an array, got ..."
Отсутствуют обязательные поля в микрозадаче	Исключение: "Invalid microtask structure: ..."
Ошибка в Token Budget Engine	Предупреждение в консоль, estimatedTokens устанавливается в 0, выполнение продолжается
Превышен лимит maxMicrotasks	Исключение: "Too many microtasks, limit is ..." (проверка после нормализации)
Все исключения должны обрабатываться вызывающим кодом (например, в CLI).

Связь с другими движками
Token Budget Engine – используется для оценки количества токенов в каждой микрозадаче.

Context Generation Engine – предоставляет context (проектный контекст).

Stage Engine – в дальнейшем микрозадачи могут использоваться для управления этапами (не прямая зависимость).

Реализация
Файл scripts/ai-task-engine.js должен экспортировать функцию decomposeTask и, при необходимости, вспомогательные утилиты (например, validateMicrotask, normalizeMicrotask). Внутренняя реализация вызова LLM может быть вынесена в отдельный модуль (например, llm-client.js).

javascript
// scripts/ai-task-engine.js
import { checkBudget } from './token-budget.js';

const ALLOWED_LAYERS = ['product', 'architecture', 'domain', 'application', 'contracts', 'blocks'];

// ... остальная реализация
Дата последнего обновления: 2026-03-12
Версия документа: 1.1 (соответствует Core MVP)

text
