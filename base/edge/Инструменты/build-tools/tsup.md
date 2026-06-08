---
tags:
  - edge
  - typescript
  - bundler
---
#tsup #TypeScript #Bundler

[NPM: tsup](https://www.npmjs.com/package/tsup)

## Что это такое?

tsup - простой сборщик TypeScript-библиотек и Node.js-пакетов поверх esbuild. Он удобен, когда нужно собрать пакет в ESM/CJS, сгенерировать `.d.ts` и не писать большой конфиг.

## Установка

```bash
pnpm add -D tsup typescript
```

## package.json

```JSON
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

## Конфигурация

`tsup.config.ts`

```TS
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
});
```

## Когда выбирать tsup

tsup хорошо подходит для:

- npm-библиотек;
- внутренних packages в монорепозитории;
- SDK;
- CLI;
- небольших Node.js-сервисов.

Для сложных frontend-приложений обычно лучше Vite, Webpack или фреймворковый сборщик.

## Плюсы

- минимальный конфиг для TypeScript-библиотек;
- умеет ESM/CJS и `.d.ts`;
- использует скорость esbuild.

## Минусы

- не подходит для сложных SPA как основной сборщик;
- не закрывает все сценарии asset pipeline;
- для declaration-файлов могут всплывать ограничения TypeScript-конфига.

## Когда использовать

- нужно собрать npm-пакет, SDK, CLI или внутреннюю библиотеку;
- нужны ESM/CJS-выходы без большого конфига;
- проекту достаточно простого bundling pipeline.
