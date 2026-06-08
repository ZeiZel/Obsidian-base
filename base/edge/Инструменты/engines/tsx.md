---
tags:
  - edge
  - typescript
  - nodejs
---
#tsx #TypeScript #NodeJS

[NPM: tsx](https://www.npmjs.com/package/tsx)

## Что это такое?

tsx - инструмент для запуска TypeScript-файлов в Node.js без отдельной ручной компиляции через `tsc`.

Он полезен для:

- локальных скриптов;
- миграций;
- seed-скриптов;
- CLI;
- разработки backend-приложений;
- одноразовых maintenance-задач.

## Установка

```bash
pnpm add -D tsx typescript
```

## Запуск файла

```bash
pnpm tsx scripts/seed.ts
```

## Watch mode

```bash
pnpm tsx watch src/index.ts
```

## package.json

```JSON
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "seed": "tsx scripts/seed.ts"
  }
}
```

## Когда использовать

tsx удобно использовать в разработке и для скриптов. Для production-сборки чаще оставляют отдельный шаг `tsc`, `tsup`, `esbuild` или фреймворковый build.

## Плюсы

- простой запуск TypeScript в Node.js;
- удобный watch mode;
- не требует отдельной dev-сборки для скриптов.

## Минусы

- не заменяет `tsc --noEmit` для проверки типов;
- не является полноценным production bundler;
- в больших backend-проектах всё равно нужен отдельный build pipeline.

## Когда использовать

- нужны seed-скрипты, миграции, CLI и локальные задачи;
- backend хочется запускать напрямую из TypeScript в dev;
- production-сборка выполняется отдельным инструментом.
