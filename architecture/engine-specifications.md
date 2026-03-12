# Engine Specifications — Core MVP v1.1

Детальные технические спецификации пяти движков ядра **Product Engineering OS**.  
Документ предназначен для разработчиков, реализующих Core MVP, и содержит все необходимые данные: форматы, алгоритмы, программные интерфейсы, примеры и правила конфигурации.

---

## Содержание

1. [Stage Engine](#stage-engine)
2. [AI Task Engine](#ai-task-engine)
3. [Context Generation Engine](#context-generation-engine)
4. [Token Budget Engine](#token-budget-engine)
5. [Validation Engine](#validation-engine)
6. [Общие положения](#общие-положения)

---

## Stage Engine

**Файл реализации:** `scripts/stage-engine.js`  
**Назначение:** управляет последовательностью этапов разработки и проверяет stage gates — наличие обязательных артефактов перед переходом между этапами.

### Входные данные

| Параметр       | Тип     | Описание                                          |
|----------------|---------|---------------------------------------------------|
| `currentStage` | string  | Текущий этап (например, `"product"`)              |
| `targetStage`  | string  | Целевой этап (например, `"architecture"`)         |
| `projectPath`  | string  | Абсолютный путь к корню проекта                   |
| `config`       | object  | (опционально) Объект конфигурации (см. раздел Конфигурация) |

### Выходные данные

Функция `canTransition` возвращает Promise, который разрешается объектом:

```typescript
{
  allowed: boolean;               // разрешён ли переход
  missingArtifacts: string[];     // список отсутствующих артефактов (если переход запрещён)
  message: string;                // пояснение (например, причина отказа)
}
Алгоритм
Загрузить конфигурацию этапов (из переданного config или из файла architecture/stages-config.json).

Для currentStage получить список обязательных артефактов из поля requiredArtifacts.

Проверить существование каждого артефакта в файловой системе относительно projectPath.

Если все артефакты присутствуют — вернуть { allowed: true, missingArtifacts: [], message: "Stage transition allowed" }.

Иначе вернуть { allowed: false, missingArtifacts: [ ... ], message: "Stage transition denied: required artifacts are missing" }.

Программный интерфейс
typescript
export async function canTransition(
  currentStage: string,
  targetStage: string,
  projectPath: string,
  config?: object
): Promise<{
  allowed: boolean;
  missingArtifacts: string[];
  message: string;
}>;

export async function getMissingArtifacts(
  stage: string,
  projectPath: string,
  config?: object
): Promise<string[]>;
Пример использования
javascript
import { canTransition } from './scripts/stage-engine.js';

const result = await canTransition('product', 'architecture', '/my-project');
if (!result.allowed) {
  console.log('Переход невозможен. Отсутствуют:', result.missingArtifacts);
} else {
  console.log('Переход разрешён');
}
Конфигурация
Файл architecture/stages-config.json (обязательный) имеет следующую структуру:

json
{
  "formatVersion": "1.0.0",
  "stages": {
    "product": {
      "requiredArtifacts": [
        "product/vision.md",
        "product/roadmap.md"
      ]
    },
    "architecture": {
      "requiredArtifacts": [
        "architecture/system-overview.md",
        "architecture/dependency-rules.md"
      ]
    },
    "domain": {
      "requiredArtifacts": [
        "domain/entities/",
        "domain/aggregates/"
      ]
    },
    "application": {
      "requiredArtifacts": [
        "application/use-cases/"
      ]
    },
    "contracts": {
      "requiredArtifacts": [
        "contracts/api/",
        "contracts/database/"
      ]
    },
    "blocks": {
      "requiredArtifacts": [
        "blocks/frontend/",
        "blocks/backend/"
      ]
    }
  }
}
Если артефакт заканчивается на / — это директория (проверяется существование папки).

Формат может быть переопределён параметром config при вызове.

Обработка ошибок
Если файл конфигурации не найден или содержит невалидный JSON, функция выбрасывает исключение с описанием.

Если указан неизвестный этап, возвращается объект с allowed: false и соответствующим сообщением.

AI Task Engine
Файл реализации: scripts/ai-task-engine.js
Назначение: декомпозиция высокоуровневой задачи (feature) в последовательность микрозадач, соответствующих слоям архитектуры.

Входные данные
Параметр	Тип	Описание
taskDescription	string	Описание задачи на естественном языке
context	string	Проектный контекст (обычно содержимое generated/project-context.md)
options	object	Дополнительные параметры (см. ниже)
Поля options:

model (string) – идентификатор LLM (по умолчанию "gpt-4")

rules (string) – путь к файлу с правилами декомпозиции (опционально)

taskBudget (number) – бюджет токенов для каждой микрозадачи (по умолчанию 500)

Выходные данные
Функция decomposeTask возвращает Promise с объектом:

typescript
{
  microtasks: Microtask[];
  rawResponse: any;      // сырой ответ LLM (для отладки)
  prompt: string;        // сформированный промпт
}

interface Microtask {
  id: string;                // уникальный идентификатор (например, "task-1")
  description: string;       // описание микрозадачи
  layer: string;             // один из: "product", "architecture", "domain", "application", "contracts", "blocks"
  dependencies: string[];    // id задач, от которых зависит данная
  estimatedTokens: number;   // оценочное количество токенов для выполнения
}
Алгоритм
Сформировать промпт, включающий описание задачи, контекст и правила декомпозиции (примеры микрозадач).

Вызвать LLM (через API) с инструкцией вернуть JSON-массив микрозадач.

Проверить, что ответ является массивом.

Нормализовать каждую задачу (заполнить поля по умолчанию, если отсутствуют).

Для каждой задачи вызвать checkBudget из Token Budget Engine, чтобы оценить количество токенов (используя taskBudget).

Проверить валидность каждой микрозадачи (наличие обязательных полей, корректный layer).

Вернуть результат.

Программный интерфейс
typescript
export async function decomposeTask(
  taskDescription: string,
  context: string,
  options?: {
    model?: string;
    rules?: string;
    taskBudget?: number;
  }
): Promise<{
  microtasks: Microtask[];
  rawResponse: any;
  prompt: string;
}>;
Пример использования
javascript
import { decomposeTask } from './scripts/ai-task-engine.js';

const context = await fs.readFile('generated/project-context.md', 'utf-8');
const { microtasks } = await decomposeTask(
  'Добавить аутентификацию через JWT',
  context,
  { model: 'gpt-4', taskBudget: 600 }
);
console.log(microtasks);
Конфигурация
Правила декомпозиции могут быть заданы в файле (например, architecture/decomposition-rules.md), но в текущей версии они жёстко заданы в промпте.

Обработка ошибок
Если LLM возвращает невалидный JSON или не массив, выбрасывается исключение с указанием полученного ответа.

Если после нормализации какая-либо микрозадача не проходит валидацию, выбрасывается исключение.

Ошибки при вызове checkBudget логируются, но не прерывают процесс (устанавливается estimatedTokens = 0).

Context Generation Engine
Файл реализации: scripts/context-generation.js
Назначение: сбор и объединение всех документов проекта (из слоёв product, architecture, domain и т.д.) в единый файл generated/project-context.md.

Входные данные
Параметр	Тип	Описание
projectPath	string	Абсолютный путь к корню проекта
options	object	Дополнительные параметры (см. ниже)
Поля options:

layers (string[]) – список слоёв для включения (по умолчанию все шесть)

outputFile (string) – путь для сохранения результата (по умолчанию generated/project-context.md)

updateOnly (boolean) – если true, обновлять только изменённые файлы (пока не реализовано, всегда false)

Выходные данные
Функция generateContext возвращает Promise с объектом:

typescript
{
  success: boolean;          // всегда true при успешном завершении
  outputPath: string;        // путь к сгенерированному файлу
  stats: {
    files: number;           // количество обработанных файлов
    tokens: number;          // общее количество токенов в сгенерированном контексте
    characters: number;      // общее количество символов
  };
}
Алгоритм
Определить список слоёв для обработки.

Для каждого слоя рекурсивно собрать все .md файлы.

Отсортировать файлы по пути для детерминированного порядка.

Для каждого файла прочитать содержимое и добавить в итоговую строку заголовок с относительным путём и содержимое.

Подсчитать количество токенов с помощью countTokens из Token Budget Engine.

Создать выходную директорию (если не существует) и записать результат.

Вернуть статистику.

Программный интерфейс
typescript
export async function generateContext(
  projectPath: string,
  options?: {
    layers?: string[];
    outputFile?: string;
    updateOnly?: boolean;
  }
): Promise<{
  success: boolean;
  outputPath: string;
  stats: {
    files: number;
    tokens: number;
    characters: number;
  };
}>;

export function watchContext(projectPath: string, callback: () => void): void; // заглушка
Пример использования
javascript
import { generateContext } from './scripts/context-generation.js';

const stats = await generateContext('/my-project', { layers: ['product', 'architecture'] });
console.log(`Сгенерировано ${stats.files} файлов, токенов: ${stats.tokens}`);
Конфигурация
Не требует отдельной конфигурации; все параметры передаются через options.

Обработка ошибок
Если директория слоя не существует, она игнорируется (без ошибки).

При ошибке чтения отдельного файла он пропускается, и в консоль выводится предупреждение.

Ошибки создания директории или записи файла приводят к исключению.

Token Budget Engine
Файл реализации: scripts/token-budget.js
Назначение: подсчёт токенов в тексте, контроль лимитов и автоматическое сокращение (summary mode) при превышении бюджета.

Входные данные
countTokens

Параметр	Тип	Описание
text	string	Исходный текст
model	string	Модель для токенизации (по умолчанию "gpt-4", не влияет)
checkBudget

Параметр	Тип	Описание
text	string	Исходный текст
budget	number	Максимальное допустимое количество токенов
options	object	Дополнительные параметры (см. ниже)
Поля options:

model (string) – модель для токенизации

contextPriority (object) – приоритеты слоёв для summary mode (например, { product: 10, architecture: 9 })

Выходные данные
countTokens возвращает число.

checkBudget возвращает объект:

typescript
{
  count: number;                // исходное количество токенов
  exceeded: boolean;            // превышен ли бюджет
  summaryText: string;          // текст после сокращения (если превышен, иначе исходный)
  reductionStats: {
    original: number;           // исходное количество токенов
    final: number;              // количество токенов после сокращения
  };
}
Алгоритм
Подсчитать токены с помощью библиотеки gpt-tokenizer.

Если count <= budget, вернуть исходный текст.

Иначе применить summary mode:

Разбить текст на секции по заголовкам второго уровня (##).

Для каждой секции определить слой (по наличию подстроки "product/", "architecture/" и т.д.).

Присвоить приоритет (по умолчанию: product=10, architecture=9, domain=8, application=7, contracts=6, blocks=5, other=1).

Отсортировать секции по убыванию приоритета.

Последовательно добавлять секции, пока не будет превышен бюджет.

Если ни одна секция не помещается, включить самую приоритетную (с предупреждением).

Вернуть объединённый текст.

Программный интерфейс
typescript
export function countTokens(text: string, model?: string): number;

export function checkBudget(
  text: string,
  budget: number,
  options?: {
    model?: string;
    contextPriority?: Record<string, number>;
  }
): {
  count: number;
  exceeded: boolean;
  summaryText: string;
  reductionStats: { original: number; final: number };
};
Пример использования
javascript
import { checkBudget } from './scripts/token-budget.js';

const longContext = '...';
const result = checkBudget(longContext, 12000);
if (result.exceeded) {
  console.log(`Сокращено с ${result.reductionStats.original} до ${result.reductionStats.final} токенов`);
  // использовать result.summaryText
}
Конфигурация
Приоритеты слоёв могут быть переопределены через options.contextPriority. Глобальная конфигурация не предусмотрена.

Обработка ошибок
Если budget отрицательный или не число, выбрасывается исключение.

При проблемах с токенизацией исключение пробрасывается из библиотеки.

Validation Engine
Файл реализации: scripts/validation-engine.js
Назначение: запуск набора проверок качества проекта: линтеры, тесты, контракты, архитектура, безопасность.

Входные данные
Параметр	Тип	Описание
projectPath	string	Абсолютный путь к корню проекта
checks	string[]	Список проверок ("lint", "test", "contract", "arch", "security") или ["all"]
options	object	Дополнительные параметры (см. ниже)
Поля options:

config (object) – конфигурация команд для каждой проверки (например, { lintCommand: "npx eslint .", testCommand: "npx jest" })

parallel (boolean) – выполнять проверки параллельно (по умолчанию true)

Выходные данные
Функция validate возвращает Promise с объектом:

typescript
{
  results: Record<string, CheckResult>;
  overallPassed: boolean;
}

interface CheckResult {
  passed: boolean;           // успешность проверки
  output: string;            // полный вывод команды
  errors: string[];          // отфильтрованные сообщения об ошибках
  duration: number;          // время выполнения в миллисекундах
}
Алгоритм
Если checks содержит "all", заменить на полный список.

Для каждой запрошенной проверки определить команду (из options.config или жёстко заданную по умолчанию).

Запустить команду в projectPath с помощью exec.

Измерить время выполнения.

Проанализировать результат:

если команда завершилась успешно, passed: true, errors: []

если завершилась ошибкой, passed: false, errors извлечь из вывода (строки, содержащие "error")

Собрать все результаты.

Вернуть объект с результатами и общим флагом overallPassed (все проверки успешны).

Программный интерфейс
typescript
export async function validate(
  projectPath: string,
  checks?: string[],
  options?: {
    config?: Record<string, string>;
    parallel?: boolean;
  }
): Promise<{
  results: Record<string, CheckResult>;
  overallPassed: boolean;
}>;
Пример использования
javascript
import { validate } from './scripts/validation-engine.js';

const { overallPassed, results } = await validate('/my-project', ['lint', 'test']);
if (!overallPassed) {
  console.error('Ошибки линтера:', results.lint.errors);
}
Конфигурация
По умолчанию используются команды:

Проверка	Команда
lint	npx eslint .
test	npx jest
contract	npx openapi-cli validate contracts/api/openapi.yaml
arch	npx depcruise src
security	npx eslint . --plugin security
Эти команды могут быть переопределены через options.config.

Обработка ошибок
Если передан неизвестный тип проверки, в results добавляется запись с passed: false и сообщением.

Ошибки выполнения команды (например, отсутствие инструмента) обрабатываются и попадают в errors.

При параллельном выполнении одна упавшая проверка не останавливает остальные.

Общие положения
Реализация модулей
Все движки реализуются в виде отдельных файлов в папке scripts/:

text
scripts/
  stage-engine.js
  ai-task-engine.js
  context-generation.js
  token-budget.js
  validation-engine.js
Каждый файл экспортирует функции, описанные выше.

Использование в CLI
Команды CLI (pos) вызывают соответствующие функции движков. Например:

pos context → generateContext(process.cwd())

pos validate → validate(process.cwd(), ['all'])

Совместимость
Все движки рассчитаны на работу в среде Node.js 18+ и используют ES-модули (import/export).

Версионирование
Данный документ соответствует версии 1.1 Core MVP. Изменения в спецификациях отслеживаются через систему контроля версий.

