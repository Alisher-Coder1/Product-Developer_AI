# Validation Engine

**Файл реализации:** `scripts/validation-engine.js`  
**Назначение:** запуск набора проверок качества проекта: линтеры, тесты, контракты, архитектура, безопасность.  
**Этап Roadmap:** этап 3 (Validation Engine)

---

## Входные данные

| Параметр      | Тип            | Описание                                                |
|---------------|----------------|---------------------------------------------------------|
| `projectPath` | string         | Абсолютный путь к корню проекта                         |
| `checks`      | string[]       | Список проверок (`"lint"`, `"test"`, `"contract"`, `"arch"`, `"security"`) или `["all"]` |
| `options`     | object         | Дополнительные параметры (см. ниже)                     |

### Поля `options`

| Параметр   | Тип     | Значение по умолчанию | Описание                                        |
|------------|---------|-----------------------|-------------------------------------------------|
| `config`   | object  | `{}`                  | Переопределение команд для каждой проверки      |
| `parallel` | boolean | `true`                | Запускать проверки параллельно (если `true`)    |

---

## Выходные данные

Функция `validate` возвращает Promise с объектом:

```typescript
{
  results: Record<string, {
    passed: boolean;      // успешность проверки
    output: string;       // полный вывод команды
    errors: string[];     // отфильтрованные сообщения об ошибках
    duration: number;     // время выполнения в миллисекундах
  }>;
  overallPassed: boolean; // все проверки успешны
}
Поддерживаемые проверки и команды по умолчанию
Проверка	Инструмент	Команда по умолчанию
lint	ESLint	npx eslint .
test	Jest	npx jest
contract	OpenAPI validator	npx openapi-cli validate contracts/api/openapi.yaml
arch	dependency-cruiser	npx depcruise src
security	Trivy	npx eslint . --plugin security
Команды могут быть переопределены через options.config, например:

json
{
  "lint": "npm run lint",
  "test": "npm test"
}
Алгоритм
Определение списка проверок
Если checks содержит "all", он заменяется на ["lint", "test", "contract", "arch", "security"]. Иначе используется переданный массив.

Загрузка конфигурации команд
Из options.config извлекаются переопределения команд для каждой проверки. Если для проверки нет переопределения, используется команда по умолчанию.

Запуск проверок

Если options.parallel === true (по умолчанию), все проверки запускаются параллельно с помощью Promise.all.

Иначе – последовательно.

Выполнение команды
Для каждой проверки вызывается вспомогательная функция runCommand(command, projectPath), которая:

запускает процесс через exec;

измеряет время выполнения;

при успехе возвращает { passed: true, output, errors: [], duration };

при ошибке парсит вывод, извлекая строки, содержащие "error" (или всю ошибку, если нет), и возвращает { passed: false, output, errors, duration }.

Сбор результатов
Результаты собираются в объект results, где ключ — имя проверки.

Вычисление общего статуса
overallPassed = Object.values(results).every(r => r.passed).

Программный интерфейс
javascript
/**
 * Запускает указанные проверки качества для проекта.
 * @param {string} projectPath - путь к корню проекта
 * @param {string[]} [checks=["all"]] - список проверок или ["all"]
 * @param {Object} [options] - дополнительные параметры
 * @param {Object} [options.config] - переопределение команд для проверок
 * @param {boolean} [options.parallel=true] - параллельное выполнение
 * @returns {Promise<{
 *   results: Record<string, { passed: boolean, output: string, errors: string[], duration: number }>,
 *   overallPassed: boolean
 * }>}
 */
export async function validate(projectPath, checks = ["all"], options = {}) {
  // реализация
}
Пример использования
javascript
import { validate } from './scripts/validation-engine.js';

const { overallPassed, results } = await validate('/my-project', ['lint', 'test']);

if (!overallPassed) {
  console.error('Ошибки линтера:', results.lint.errors);
  console.error('Ошибки тестов:', results.test.errors);
} else {
  console.log('Все проверки пройдены');
}

// Пример вывода results:
// {
//   lint: { passed: true, output: "...", errors: [], duration: 1200 },
//   test: { passed: false, output: "...", errors: ["FAIL test/user.test.js"], duration: 3000 }
// }
Конфигурация
Глобальная конфигурация может быть задана в файле .os/validation-config.json. Если такой файл существует, он загружается и используется как базовый для options.config. Приоритет: явно переданный options.config переопределяет загруженный из файла.

Пример .os/validation-config.json:

json
{
  "lint": "npm run lint:strict",
  "test": "npm run test:ci"
}
Обработка ошибок
Ситуация	Реакция
Передан неизвестный тип проверки	В results добавляется запись с passed: false и сообщением "Unknown check: ..."
Команда не найдена (инструмент не установлен)	В errors добавляется сообщение об ошибке, passed: false
Ошибка выполнения команды	В errors добавляются строки, содержащие "error" (или весь вывод)
Пустой список проверок	Возвращается { results: {}, overallPassed: true } с предупреждением
Ошибка чтения конфигурационного файла	Игнорируется, используются значения по умолчанию
Все исключения, возникающие при запуске проверок, перехватываются и возвращаются как ошибки в соответствующем результате.

Связь с другими движками
Stage Engine – может использовать результаты валидации для проверки готовности этапа.

AI Task Engine – результаты валидации могут влиять на генерацию новых микрозадач (исправление ошибок).

Дата последнего обновления: 2026-03-12
Версия документа: 1.1 (соответствует Core MVP)

