# Stage Engine

## Назначение
Stage Engine управляет последовательностью этапов разработки и проверяет **stage gates** — наличие обязательных артефактов перед переходом к следующему этапу.

Последовательность этапов разработки:

product → architecture → domain → application → contracts → blocks

---

## Входные данные

| Параметр     | Тип               | Описание                             |
|--------------|-------------------|--------------------------------------|
| currentStage | string            | текущий этап проекта                 |
| targetStage  | string            | этап, на который выполняется переход |
| projectPath  | string            | путь к корню проекта                 |
| config       | object (optional) | конфигурация этапов                  |

Конфигурация может загружаться из:

.os/config.json  
architecture/stages-config.json

---

## Выходные данные

| Поле             | Тип      | Описание                        |
|------------------|----------|---------------------------------|
| allowed          | boolean  | разрешён ли переход             |
| missingArtifacts | string[] | список отсутствующих артефактов |
| message          | string   | текстовое описание результата   |

---

## Алгоритм

1. загрузить конфигурацию этапов  
2. определить requiredArtifacts для текущего этапа  
3. проверить существование файлов и директорий  
4. если все существуют — переход разрешён  
5. если какие‑то отсутствуют — вернуть missingArtifacts  

---

## Программный интерфейс

```javascript
export async function canTransition(currentStage, targetStage, projectPath, config = null) {
  // возвращает { allowed, missingArtifacts, message }
}

export function getMissingArtifacts(stage, projectPath, config = null) {
  // возвращает массив отсутствующих артефактов
}
```

---

## Пример

```javascript
const { allowed, missingArtifacts } =
  await canTransition('product', 'architecture', '/my-project');

if (!allowed) {
  console.log('Переход невозможен:', missingArtifacts);
}
```