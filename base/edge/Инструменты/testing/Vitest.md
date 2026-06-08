---
tags:
  - edge
  - typescript
  - testing
---
#Vitest #TypeScript #Testing

[NPM: vitest](https://www.npmjs.com/package/vitest)

## Что это такое?

Vitest - быстрый test runner для TypeScript и JavaScript. Он хорошо работает с Vite, но его можно использовать и отдельно.

Полезен для:

- unit-тестов;
- тестирования утилит;
- React/Vue компонентов;
- проверки бизнес-логики;
- snapshot-тестов;
- coverage в CI.

## Установка

```bash
pnpm add -D vitest
```

Для DOM-тестов:

```bash
pnpm add -D jsdom @testing-library/dom
```

## package.json

```JSON
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

## Пример теста

```TS
import { describe, expect, test } from 'vitest';

function sum(a: number, b: number) {
  return a + b;
}

describe('sum', () => {
  test('складывает два числа', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

## Конфигурация

`vitest.config.ts`

```TS
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
```

## Когда использовать

Vitest стоит подключать почти в любом продукте: он быстро запускается, хорошо типизирован и легко встраивается в CI.

## Плюсы

- быстрый test runner для TS/JS;
- удобный watch mode и coverage;
- хорошо интегрируется с Vite и Testing Library.

## Минусы

- для некоторых Jest-плагинов нужна адаптация;
- DOM-тестам требуется jsdom/happy-dom;
- e2e-сценарии всё равно лучше закрывать Playwright/Cypress.

## Когда использовать

- нужны unit и integration тесты для TypeScript-кода;
- проект использует Vite или современный ESM;
- важны быстрые локальные запуски и CI.
