# Token Budget Engine

## Назначение
Подсчитывает количество токенов и контролирует лимиты контекста.

---

## Входные данные

| параметр | тип    |
|----------|--------|
| text     | string |
| model    | string |
| budget   | number |

---

## Выходные данные

| поле        | описание          |
|-------------|-------------------|
| count       | количество токенов|
| exceeded    | превышен ли лимит |
| summaryText | сокращённый текст |

---

## Интерфейс

```javascript
import { encode } from 'gpt-tokenizer';

export function countTokens(text, model = 'gpt-4') {
  return encode(text).length;
}

export function checkBudget(text, budget, options = {}) {
  const count = countTokens(text);

  if (count <= budget) {
    return { count, exceeded: false };
  }

  const summaryText = summarize(text, budget, options);

  return {
    count,
    exceeded: true,
    summaryText
  };
}
```