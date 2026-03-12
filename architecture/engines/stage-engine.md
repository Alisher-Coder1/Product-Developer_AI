# Stage Engine

**Файл реализации:** `scripts/stage-engine.js`  
**Назначение:** управляет последовательностью этапов разработки и проверяет **stage gates** — наличие обязательных артефактов перед переходом к следующему этапу.  
**Этап Roadmap:** этап 2 (Stage Engine и AI Task Engine)

Последовательность этапов разработки:
product → architecture → domain → application → contracts → blocks

text

---

## Входные данные

| Параметр       | Тип               | Описание                                                              |
|----------------|-------------------|-----------------------------------------------------------------------|
| `currentStage` | string            | Текущий этап (например, `"product"`)                                  |
| `targetStage`  | string            | Этап, на который выполняется переход (например, `"architecture"`)    |
| `projectPath`  | string            | Абсолютный путь к корню проекта                                       |
| `config`       | object (optional) | Объект конфигурации этапов (если передан, используется вместо файла) |

Конфигурация по умолчанию загружается из файла (приоритет):
1. Если передан параметр `config`, используется он.
2. Иначе ищется `architecture/stages-config.json`.
3. Если файл не найден – выбрасывается исключение.

---

## Выходные данные

Функция `canTransition` возвращает Promise, который разрешается объектом:

```typescript
{
  allowed: boolean;               // разрешён ли переход
  missingArtifacts: string[];     // список отсутствующих артефактов (если переход запрещён)
  message: string;                // текстовое описание результата
}
Функция getMissingArtifacts возвращает Promise с массивом строк — отсутствующих артефактов для указанного этапа.

Алгоритм
Загрузить конфигурацию

Если передан параметр config, использовать его.

Иначе прочитать файл architecture/stages-config.json (если отсутствует – исключение).

Проверить наличие поля stages и секции для currentStage. Если нет – вернуть ошибку в объекте результата.

Получить список обязательных артефактов из поля requiredArtifacts для currentStage.

Проверить существование каждого артефакта относительно projectPath:

Если артефакт заканчивается на / (например, domain/entities/) – проверяется существование директории.

Иначе – проверяется существование файла.

Собрать отсутствующие артефакты.

Сформировать результат:

Если отсутствующих нет – { allowed: true, missingArtifacts: [], message: "Stage transition allowed" }.

Иначе – { allowed: false, missingArtifacts: [...], message: "Stage transition denied: required artifacts are missing" }.

Программный интерфейс
javascript
/**
 * Проверяет возможность перехода с текущего этапа на целевой.
 * @param {string} currentStage - текущий этап
 * @param {string} targetStage - целевой этап
 * @param {string} projectPath - путь к корню проекта
 * @param {object} [config] - опциональный объект конфигурации (заменяет файл)
 * @returns {Promise<{ allowed: boolean, missingArtifacts: string[], message: string }>}
 */
export async function canTransition(currentStage, targetStage, projectPath, config = null) {
  // реализация
}

/**
 * Возвращает список отсутствующих артефактов для указанного этапа.
 * @param {string} stage - название этапа
 * @param {string} projectPath - путь к корню проекта
 * @param {object} [config] - опциональный объект конфигурации
 * @returns {Promise<string[]>} массив путей отсутствующих артефактов
 */
export async function getMissingArtifacts(stage, projectPath, config = null) {
  // реализация
}
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
        "domain/entities/",      // проверяется как директория
        "domain/aggregates/"     // проверяется как директория
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
Если артефакт заканчивается на / – проверяется существование директории.

Остальные артефакты проверяются как файлы.

Поле formatVersion обязательно для будущей совместимости.

Обработка ошибок
Ситуация	Реакция
Файл конфигурации не найден	Исключение: "stages-config.json not found"
Неверный JSON в файле конфигурации	Исключение с описанием ошибки парсинга
Отсутствует поле stages или нужный этап	В объекте результата allowed: false и сообщение "Unknown stage: ..."
Ошибка доступа к файловой системе	Исключение с описанием ошибки
Все исключения должны обрабатываться вызывающим кодом (например, в CLI).

Связь с другими движками
AI Task Engine – может использовать информацию о текущем этапе для контекста.

Validation Engine – косвенно, так как проверки могут зависеть от этапа.

Дата последнего обновления: 2026-03-12
Версия документа: 1.1 (соответствует Core MVP)
