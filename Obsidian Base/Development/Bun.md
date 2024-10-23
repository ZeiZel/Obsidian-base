#Bun #NodeJS

Bun - альтернатива NodeJS, которая позволяет более быстро и эффективно пользоваться возможностями разработки на JS

[Установка](https://bun.sh/) тут достаточно простая и выполняется буквально одной командой.



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


