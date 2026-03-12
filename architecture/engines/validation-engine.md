# Validation Engine

## Назначение
Запускает проверки качества проекта.

---

## Поддерживаемые проверки

| Проверка | Инструмент         | Назначение            |
|----------|--------------------|-----------------------|
| lint     | ESLint             | стиль кода            |
| test     | Jest               | юнит‑тесты            |
| contract | OpenAPI validator  | проверка API          |
| arch     | dependency-cruiser | правила архитектуры   |
| security | Trivy              | проверка безопасности |

---

## Интерфейс

```javascript
export async function validate(projectPath, checks = ['all'], options = {}) {
  return { results, overallPassed }
}
```