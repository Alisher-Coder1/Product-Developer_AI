import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'structure-config.json');

/**
 * Проверяет существование элемента и его тип (файл или директория).
 * @param {string} basePath - базовый путь (корень проекта)
 * @param {Object} item - элемент конфигурации { path, type }
 * @returns {boolean} true, если элемент корректен
 */
function checkItem(basePath, item) {
  const fullPath = path.join(basePath, item.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing: ${item.path}`);
    return false;
  }
  const stat = fs.statSync(fullPath);
  if (item.type === 'dir' && !stat.isDirectory()) {
    console.error(`Expected directory, but found file: ${item.path}`);
    return false;
  }
  if (item.type === 'file' && !stat.isFile()) {
    console.error(`Expected file, but found directory: ${item.path}`);
    return false;
  }
  return true;
}

/**
 * Основная функция валидации структуры проекта.
 */
function validateStructure() {
  // Проверка, что скрипт запущен из корня проекта
  if (!fs.existsSync('package.json')) {
    console.error('Error: This script must be run from the project root.');
    process.exit(1);
  }

  // Загрузка конфигурации
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error(`Failed to load configuration: ${err.message}`);
    process.exit(1);
  }

  let ok = true;
  for (const item of config.required) {
    if (!checkItem(process.cwd(), item)) {
      ok = false;
    }
  }

  if (!ok) {
    console.error('❌ Structure validation failed.');
    process.exit(1);
  }

  console.log('✅ Project structure is valid.');
}

validateStructure();