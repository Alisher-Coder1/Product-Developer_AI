#!/usr/bin/env node

import { program } from 'commander';
import picocolors from 'picocolors'; // Рекомендую добавить для UX
import { generateContext } from './context-generation.js';
import { validate } from './validation-engine.js';
// import { canTransition } from './stage-engine.js'; // Пока не используется

// Универсальный обработчик для сокращения дублирования
const run = (fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error(picocolors.red(`\nError: ${err.message}`));
    process.exit(1);
  }
};

program
  .name('pos')
  .description('Product Engineering OS CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Create project structure')
  .action(run(async () => {
    console.log(picocolors.blue('Initializing project...'));
    // ... реализация
    console.log(picocolors.green('Project initialized successfully.'));
  }));

program
  .command('start')
  .description('Start development stage')
  .action(() => {
    console.log(picocolors.yellow('pos start: not implemented yet'));
  });

// ... (предыдущий код)

program
  .command('stage')
  .description('Check and transition between development stages')
  .argument('[nextStage]', 'Target stage to transition to') // Добавил аргумент для гибкости
  .option('-f, --force', 'Force transition bypassing some checks', false)
  .action(run(async (nextStage, options) => {
    const currentPath = process.cwd();
    
    // Если стадия не указана, просто выводим текущий статус
    if (!nextStage) {
      console.log(picocolors.blue('Current project stage: Analyzing...'));
      // Здесь должна быть логика определения текущей стадии
      return;
    }

    console.log(picocolors.yellow(`Attempting transition to stage: ${nextStage}...`));
    
    // Используем ваш импортированный метод canTransition
    const transition = await canTransition(currentPath, nextStage, options.force);
    
    if (transition.allowed) {
      console.log(picocolors.green(`✔ Success: Ready for ${nextStage}`));
      // Логика смены стейджа (например, обновление meta-файла)
    } else {
      console.error(picocolors.red(`✘ Blocked: Cannot move to ${nextStage}`));
      console.error(picocolors.dim(`Reason: ${transition.reason}`));
      process.exit(1);
    }
  }));

// ... (остальной код)

program
  .command('context')
  .description('Generate project context')
  .option('-l, --layers <layers>', 'comma-separated layer list')
  .action(run(async (options) => {
    const layers = options.layers?.split(',') || undefined;
    const result = await generateContext(process.cwd(), { layers });
    console.log(picocolors.green(`✔ Context generated: ${result.outputPath}`));
  }));

program
  .command('validate')
  .description('Run validation checks')
  .option('-c, --checks <checks>', 'comma-separated check list')
  .action(run(async (options) => {
    const checks = options.checks?.split(',') || ['all'];
    const result = await validate(process.cwd(), checks);
    
    if (!result.overallPassed) {
      console.error(picocolors.red('✘ Validation failed'));
      process.exit(1);
    }
    console.log(picocolors.green('✔ Validation passed'));
  }));

// Обработка неизвестных команд
program.on('command:*', () => {
  console.error(picocolors.red('Invalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

program.parse(process.argv);
