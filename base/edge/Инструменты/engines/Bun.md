---
tags:
  - edge
---
#Bun #NodeJS

[NPM: bun](https://www.npmjs.com/package/bun)

Bun - альтернатива NodeJS, которая позволяет более быстро и эффективно пользоваться возможностями разработки на JS

[Установка](https://bun.sh/) тут достаточно простая и выполняется буквально одной командой.

## Базовые команды

```bash
# установка пакета
bun install <pkg>

# бандлинг проекта
bun build ./index.tsx

# запуск тестов
bun test

# выполнение установленного пакета
bunx cowsay 'Hello, world!'

# создание нового проекта
bun init

# запуск команды из package.json
bun run start
```

## Bun в TypeScript-проекте

Bun умеет запускать TypeScript-файлы без отдельной ручной компиляции.

```bash
bun run src/index.ts
bun --watch src/index.ts
```

Для проверки типов всё равно стоит использовать TypeScript compiler:

```bash
bunx tsc --noEmit
```

Bun быстро запускает код, но сам запуск не заменяет полноценный typecheck.

## package.json

```JSON
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  }
}
```

Так выглядит простейший сервер на Bun

`index.ts`

```TS
import Bun, { file, serve } from "bun";

const server = serve({
  port: 3000,
  fetch(request) {
    return new Response("Welcome to Bun!");
  },
});

console.log(`Listening on localhost:${server.port}`);
```

Так же из коробки он провайдит достаточно большое количество API, которые покрывают почти все нужные потребности для backend-разработки

```TS
Bun.serve({
  fetch(req, server) {}, // upgrade logic
  websocket: {
    message(ws, message) {}, // a message is received
    open(ws) {}, // a socket is opened
    close(ws, code, message) {}, // a socket is closed
    drain(ws) {}, // the socket is ready to receive more data
  },
});
```

Встроенный сборщик, который работает на esbuild и их конфигурация будет достаточно схожа друг с другом

```TS
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './build',
});
```

## Когда использовать Bun

Bun можно использовать как:

- package manager;
- runtime для backend-сервисов и скриптов;
- test runner;
- bundler для простых сценариев.

В продакшене важно проверять совместимость зависимостей с Bun runtime. Если проект завязан на Node.js API или нативные модули, сначала стоит прогнать интеграционные тесты.

Тесты абсолютно аналогичны Jest

```TS
import { expect, test, describe } from "bun:test";

describe("arithmetic", () => {
  test("2 + 2", () => {
    expect(2 + 2).toBe(4);
  });

  test("2 * 2", () => {
    expect(2 * 2).toBe(4);
  });
});
```

## Плюсы

- очень быстрый runtime и package manager;
- из коробки есть test runner и bundler;
- удобно запускает TypeScript без отдельной настройки.

## Минусы

- совместимость с Node.js-экосистемой нужно проверять на практике;
- молодая платформа по сравнению с Node.js;
- часть production-инфраструктуры может быть завязана на Node.js.

## Когда использовать

- нужны быстрые локальные скрипты, dev-серверы и тесты;
- проект может позволить проверку совместимости зависимостей;
- команда хочет один инструмент для runtime, install, test и build.
