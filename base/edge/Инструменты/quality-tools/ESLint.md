---
tags:
  - edge
  - typescript
  - lint
---
#ESLint #TypeScript

[NPM: eslint](https://www.npmjs.com/package/eslint)

## Что это такое?

ESLint - инструмент статического анализа кода. В TypeScript-проектах он дополняет `tsc`: компилятор проверяет типы, а ESLint проверяет стиль, опасные конструкции и командные правила.

## Установка

```bash
pnpm add -D eslint typescript typescript-eslint
```

## Минимальная конфигурация

`eslint.config.js`

```JS
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

## Скрипты

```JSON
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## Type-aware правила

Некоторые правила требуют информации от TypeScript compiler API. Они медленнее, но ловят больше ошибок.

```JS
export default tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
```

## Что проверять ESLint-ом

- запрещать неиспользуемые переменные;
- ограничивать `any`;
- проверять unsafe-присваивания;
- запрещать floating promises;
- контролировать импортные правила;
- отделять автофиксируемый стиль от архитектурных правил.

Prettier отвечает за форматирование, ESLint - за качество и опасные паттерны.

## Плюсы

- ловит опасные паттерны до runtime;
- гибко настраивается под правила команды;
- хорошо интегрируется с TypeScript и редакторами.

## Минусы

- type-aware правила могут замедлять lint;
- конфигурация требует поддержки;
- может создавать шум, если правила выбраны без контекста проекта.

## Когда использовать

- нужно единое качество кода в команде;
- проект растёт и требует автоматических правил;
- линтер запускается в IDE, pre-commit или CI.
