
# Engine Specifications — Core MVP v1.1

Детальные спецификации пяти движков ядра **Product Engineering OS**.

Документ соответствует:
- Architecture Freeze v1.1
- Road Map (этапы 0–3)

Каждый движок описывает:
- назначение
- входные данные
- выходные данные
- алгоритм работы
- программный интерфейс
- примеры использования

Все движки реализуются в папке:

```
scripts/
```

Каждый движок является отдельным модулем.

---

# Содержание

1. Stage Engine  
2. AI Task Engine  
3. Context Generation Engine  
4. Token Budget Engine  
5. Validation Engine  

---

# Stage Engine

**Файл:** `architecture/engines/stage-engine.md`

Назначение:

Управляет последовательностью этапов разработки и проверяет **stage gates** — наличие обязательных артефактов перед переходом.

Последовательность этапов разработки:

```
product → architecture → domain → application → contracts → blocks
```

Основные функции:

- проверка обязательных файлов
- контроль переходов между этапами
- предотвращение пропуска этапов

Интерфейс:

```
canTransition(currentStage, targetStage, projectPath)
```

---

# AI Task Engine

**Файл:** `architecture/engines/ai-task-engine.md`

Назначение:

Декомпозиция высокоуровневых задач в **микрозадачи**, соответствующие слоям архитектуры.

Функции:

- анализ задачи
- генерация списка микрозадач
- определение зависимостей между задачами
- оценка токенов для выполнения

Пример структуры микрозадачи:

```json
{
  "id": "task1",
  "description": "Определить модель User",
  "layer": "domain",
  "dependencies": [],
  "estimatedTokens": 150
}
```

Интерфейс:

```
decomposeTask(taskDescription, context, options)
```

---

# Context Generation Engine

**Файл:** `architecture/engines/context-generation-engine.md`

Назначение:

Формирует единый контекст проекта для AI.

Генерируемый файл:

```
generated/project-context.md
```

Этот файл содержит объединённую документацию из:

- product
- architecture
- domain
- application
- contracts
- blocks

Основные функции:

- сбор Markdown документов
- структурирование контекста
- автоматическое обновление

Интерфейс:

```
generateContext(projectPath, options)
```

---

# Token Budget Engine

**Файл:** `architecture/engines/token-budget-engine.md`

Назначение:

Контролирует количество токенов в контексте и промптах.

Основные функции:

- подсчёт токенов
- проверка лимитов
- сокращение контекста (summary mode)

Входные данные:

```
text
model
budget
```

Интерфейс:

```
countTokens(text)

checkBudget(text, budget)
```

Используется:

- AI Task Engine
- Context Generation Engine

---

# Validation Engine

**Файл:** `architecture/engines/validation-engine.md`

Назначение:

Запускает проверки качества проекта.

Поддерживаемые проверки:

| Проверка | Инструмент         | Назначение   |
|--------  |--------            |--------      |
| lint     | ESLint             | стиль кода   |
| test     | Jest               | юнит тесты   |
| contract | OpenAPI validator  | проверка API |
| arch     | dependency-cruiser | архитектура  |
| security | Trivy              | безопасность |

Интерфейс:

```
validate(projectPath, checks)
```

---

# Архитектура взаимодействия движков

```
Context Generation Engine
↓
AI Task Engine
↓
Token Budget Engine
↓
Validation Engine
↑
Stage Engine
```

---

# Реализация модулей

```
scripts/

stage-engine.js  
ai-task-engine.js  
context-generation.js  
token-budget.js  
validation-engine.js  
```

---

# Итог

Документ описывает архитектуру **Core MVP v1.1**.

Каждый движок реализуется как независимый модуль и используется CLI инструментом:

```
pos
```

Документ является частью **Architecture Freeze v1.1**.
