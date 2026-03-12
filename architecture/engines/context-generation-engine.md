# Context Generation Engine

**Файл реализации:** `scripts/context-generation.js`  
**Назначение:** сбор и объединение всех документов проекта (из слоёв product, architecture, domain, application, contracts, blocks) в единый файл `generated/project-context.md`, который служит источником контекста для AI Task Engine.  
**Этап Roadmap:** этап 1 (Context Generation и Token Budget)

---

## Входные данные

| Параметр      | Тип     | Описание                                                |
|---------------|---------|---------------------------------------------------------|
| `projectPath` | string  | Абсолютный путь к корню проекта                         |
| `options`     | object  | Дополнительные параметры (см. ниже)                     |

### Поля `options`

| Параметр      | Тип       | Значение по умолчанию | Описание                                        |
|---------------|-----------|-----------------------|-------------------------------------------------|
| `layers`      | string[]  | `["product","architecture","domain","application","contracts","blocks"]` | Список слоёв для включения в контекст |
| `outputFile`  | string    | `"generated/project-context.md"` | Путь для сохранения результата (относительно `projectPath`) |
| `updateOnly`  | boolean   | `false`               | Если `true`, обновлять только изменённые файлы (пока не реализовано) |

---

## Выходные данные

Функция `generateContext` возвращает Promise, который разрешается объектом:

```typescript
{
  success: boolean;          // всегда true при успешном завершении
  outputPath: string;        // абсолютный путь к сгенерированному файлу
  stats: {
    files: number;           // количество обработанных файлов
    tokens: number;          // общее количество токенов в сгенерированном контексте
    characters: number;      // общее количество символов
  };
}
Алгоритм
Определение списка слоёв – используется options.layers (или значение по умолчанию).

Сбор файлов – для каждого слоя рекурсивно обходятся все поддиректории и собираются все файлы с расширением .md.

Сортировка – все собранные файлы сортируются по полному пути для детерминированного порядка.

Чтение и форматирование – для каждого файла:

читается содержимое (если ошибка – файл пропускается, выводится предупреждение);

добавляется разделитель и заголовок с относительным путём файла;

содержимое добавляется к итоговой строке.

Подсчёт токенов – вызывается countTokens из Token Budget Engine для подсчёта токенов в итоговой строке.

Создание директории – если директория для выходного файла не существует, она создаётся рекурсивно.

Запись результата – итоговая строка записывается в outputFile.

Возврат статистики – возвращается объект с путём и количеством файлов, токенов и символов.

Программный интерфейс
javascript
/**
 * Генерирует единый файл контекста проекта.
 * @param {string} projectPath - путь к корню проекта
 * @param {Object} [options] - дополнительные параметры
 * @param {string[]} [options.layers] - список слоёв для включения
 * @param {string} [options.outputFile] - путь для сохранения результата
 * @param {boolean} [options.updateOnly] - обновлять только изменённые файлы (не реализовано)
 * @returns {Promise<{
 *   success: boolean,
 *   outputPath: string,
 *   stats: { files: number, tokens: number, characters: number }
 * }>}
 */
export async function generateContext(projectPath, options = {}) {
  // реализация
}

/**
 * Устанавливает наблюдение за файлами и автоматически регенерирует контекст при изменениях.
 * @param {string} projectPath - путь к корню проекта
 * @param {Function} callback - функция, вызываемая после регенерации
 * @returns {void}
 */
export function watchContext(projectPath, callback) {
  // заглушка, не реализовано в Core MVP
}
Пример использования
javascript
import { generateContext } from './scripts/context-generation.js';

const result = await generateContext('/my-project', {
  layers: ['product', 'architecture'],
  outputFile: 'generated/project-context.md'
});

console.log(`Сгенерировано ${result.stats.files} файлов`);
console.log(`Всего токенов: ${result.stats.tokens}`);
console.log(`Результат сохранён в: ${result.outputPath}`);
Пример вывода:

text
Сгенерировано 12 файлов
Всего токенов: 3450
Результат сохранён в: /my-project/generated/project-context.md
Конфигурация
Движок не требует отдельной конфигурации; все настройки передаются через параметры options. Значения по умолчанию обеспечивают работу «из коробки».

Обработка ошибок
Ситуация	Реакция
Указанный слой не существует (нет директории)	Слой игнорируется, выполнение продолжается (без ошибки)
Ошибка чтения отдельного файла	Файл пропускается, в консоль выводится предупреждение
Ошибка создания выходной директории	Исключение с описанием причины
Ошибка записи выходного файла	Исключение с описанием причины
Нет ни одного файла для генерации	Создаётся пустой файл, статистика: files: 0, tokens: 0, characters: 0
Все исключения должны обрабатываться вызывающим кодом (например, в CLI).

Связь с другими движками
Token Budget Engine – используется для подсчёта токенов в сгенерированном контексте.

AI Task Engine – использует сгенерированный контекст как входные данные.

Stage Engine – косвенно, так как контекст содержит информацию о состоянии этапов.

Реализация
Файл scripts/context-generation.js должен экспортировать функции generateContext и watchContext. Внутренние утилиты (сбор файлов, чтение, запись) могут быть вынесены в отдельные модули для удобства тестирования.

javascript
// scripts/context-generation.js
import fs from 'fs/promises';
import path from 'path';
import { countTokens } from './token-budget.js';

const DEFAULT_LAYERS = ['product', 'architecture', 'domain', 'application', 'contracts', 'blocks'];

// ... реализация
Дата последнего обновления: 2026-03-12
Версия документа: 1.1 (соответствует Core MVP)

text
