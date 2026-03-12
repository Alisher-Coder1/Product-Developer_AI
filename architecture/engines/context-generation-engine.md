# Context Generation Engine

## Назначение
Собирает документацию проекта и формирует единый файл контекста:

generated/project-context.md

Этот файл используется AI Task Engine.

---

## Входные данные

| Параметр    | Тип    |
|-------------|--------|
| projectPath | string |
| options     | object |

### options

| параметр   | описание                          |
|------------|-----------------------------------|
| layers     | список слоёв                      |
| outputFile | путь к файлу результата           |
| updateOnly | обновлять только изменённые файлы |

---

## Алгоритм

1. обойти папки слоёв проекта  
2. прочитать все `.md` файлы  
3. добавить заголовок с путём файла  
4. объединить документы  
5. сохранить результат  

---

## Интерфейс

```javascript
export async function generateContext(projectPath, options = {}) {
  return { success, outputPath, stats }
}

export function watchContext(projectPath, callback) {}
```