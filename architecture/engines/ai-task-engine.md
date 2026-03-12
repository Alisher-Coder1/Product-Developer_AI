# AI Task Engine

## Назначение
AI Task Engine выполняет декомпозицию высокоуровневой задачи в **микрозадачи**, соответствующие слоям архитектуры.

---

## Входные данные

| Параметр        | Тип      | Описание                 |
|----------       |-----     |----------                |
| taskDescription | string   | описание задачи          |
| context         | string   | контекст проекта         |
| options         | object   | дополнительные параметры |

### options

| Параметр      | Тип    |
|---------------|--------|
| model         | string |
| rules         | string |
| maxMicrotasks | number |

---

## Выходные данные

```json
{
  "id": "string",
  "description": "string",
  "layer": "string",
  "dependencies": ["string"],
  "estimatedTokens": 0
}
```

---

## Алгоритм

1. сформировать prompt  
2. вызвать LLM  
3. получить JSON со списком микрозадач  
4. проверить корректность структуры  
5. оценить токены через Token Budget Engine  
6. вернуть отсортированный список задач  

---

## Интерфейс

```javascript
export async function decomposeTask(taskDescription, context, options = {}) {
  return { microtasks, rawResponse }
}
```