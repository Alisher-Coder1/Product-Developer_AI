import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runCommand(command, cwd) {
  const start = Date.now();

  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    const output = stdout || stderr;

    return {
      passed: true,
      output,
      errors: [], // можно оставить пустым, либо добавить парсинг
      duration: Date.now() - start
    };
  } catch (err) {
    const output = err.stdout || err.stderr || err.message;

    return {
      passed: false,
      output,
      errors: [output], // упрощённо
      duration: Date.now() - start
    };
  }
}

async function runCheck(check, projectPath, options = {}) {
  const config = options.config || {};

  switch (check) {
    case "lint":
      return runCommand(config.lintCommand || "npx eslint .", projectPath);
    case "test":
      return runCommand(config.testCommand || "npx jest", projectPath);
    case "contract":
      const contractPath = config.contractPath || "contracts/api/openapi.yaml";
      return runCommand(`npx openapi-cli validate ${contractPath}`, projectPath);
    case "arch":
      return runCommand(config.archCommand || "npx depcruise src", projectPath);
    case "security":
      return runCommand(config.securityCommand || "npx eslint . --plugin security", projectPath);
    default:
      return {
        passed: false,
        output: "",
        errors: [`Unknown check: ${check}`],
        duration: 0
      };
  }
}

/**
 * Запускает проверки качества для проекта.
 * @param {string} projectPath - путь к корню проекта
 * @param {string[]} checks - список проверок ("lint", "test", "contract", "arch", "security") или ["all"]
 * @param {Object} options - дополнительные опции (config, parallel)
 * @returns {Promise<Object>} результаты проверок и общий статус
 */
export async function validate(projectPath, checks = ["all"], options = {}) {
  if (!Array.isArray(checks)) {
    checks = [checks];
  }

  const enabledChecks = checks.includes("all")
    ? ["lint", "test", "contract", "arch", "security"]
    : checks;

  if (enabledChecks.length === 0) {
    return {
      results: {},
      overallPassed: true,
      warning: "No checks selected"
    };
  }

  const runParallel = options.parallel !== false; // по умолчанию параллельно

  if (runParallel) {
    const resultsArray = await Promise.all(
      enabledChecks.map(async (check) => {
        const result = await runCheck(check, projectPath, options);
        return [check, result];
      })
    );
    const results = Object.fromEntries(resultsArray);
    const overallPassed = Object.values(results).every(r => r.passed);
    return { results, overallPassed };
  } else {
    const results = {};
    for (const check of enabledChecks) {
      results[check] = await runCheck(check, projectPath, options);
    }
    const overallPassed = Object.values(results).every(r => r.passed);
    return { results, overallPassed };
  }
}