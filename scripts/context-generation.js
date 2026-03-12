import fs from "fs/promises";
import path from "path";
import { countTokens } from "./token-budget.js"; // предполагаемый импорт

const DEFAULT_LAYERS = [
  "product",
  "architecture",
  "domain",
  "application",
  "contracts",
  "blocks"
];

async function collectMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectMarkdownFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function createSectionHeader(filePath, projectPath) {
  const relative = path.relative(projectPath, filePath);
  return `\n\n---\n\n## ${relative}\n\n`;
}

async function readMarkdown(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (err) {
    console.warn(`Failed to read ${filePath}: ${err.message}`);
    return "";
  }
}

export async function generateContext(projectPath, options = {}) {
  const layers = options.layers || DEFAULT_LAYERS;
  const outputFile = options.outputFile ||
    path.join(projectPath, "generated", "project-context.md");

  let collected = "";
  let fileCount = 0;
  const allFiles = [];

  // Собираем все файлы из всех слоёв параллельно
  const layerResults = await Promise.all(layers.map(async (layer) => {
    const layerPath = path.join(projectPath, layer);
    const files = await collectMarkdownFiles(layerPath);
    return files;
  }));

  // Объединяем и сортируем
  const sortedFiles = layerResults.flat().sort();

  for (const file of sortedFiles) {
    const content = await readMarkdown(file);
    const header = createSectionHeader(file, projectPath);
    collected += header + content;
    fileCount++;
  }

  const tokens = countTokens(collected); // предполагаем функцию из token-budget

  const outputDir = path.dirname(outputFile);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, collected);

  return {
    success: true,
    outputPath: outputFile,
    stats: {
      files: fileCount,
      tokens,
      characters: collected.length
    }
  };
}

export function watchContext(projectPath, callback) {
  // TODO: реализовать наблюдение за файлами
  throw new Error("watchContext not implemented yet");
}