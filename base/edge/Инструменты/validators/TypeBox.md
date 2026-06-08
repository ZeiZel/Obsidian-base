---
tags:
  - edge
  - typescript
  - validation
  - json-schema
---
#TypeBox #TypeScript #JSONSchema

[NPM: @sinclair/typebox](https://www.npmjs.com/package/@sinclair/typebox)

## Что это такое?

TypeBox - библиотека для описания JSON Schema с выводом TypeScript-типов. Она полезна, когда проекту нужен не только тип, но и стандартная JSON Schema для OpenAPI, Fastify, Ajv или межсервисных контрактов.

## Установка

```bash
pnpm add @sinclair/typebox
```

Для runtime-проверки часто добавляют компилятор TypeBox или Ajv:

```bash
pnpm add ajv
```

## Базовая схема

```TS
import { Static, Type } from '@sinclair/typebox';

const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Number({ minimum: 18 })),
});

type User = Static<typeof UserSchema>;
```

## Проверка через Ajv

```TS
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = addFormats(new Ajv());
const validateUser = ajv.compile(UserSchema);

if (!validateUser(input)) {
  console.log(validateUser.errors);
}
```

## Где полезен TypeBox

- Fastify-серверы, где JSON Schema используется для валидации и документации.
- Генерация OpenAPI.
- Контракты между сервисами.
- Системы, где runtime-схемы должны быть совместимы не только с TypeScript.

## Zod или TypeBox

Zod удобнее для прикладного кода и форм. TypeBox удобнее, когда главным форматом контракта является JSON Schema.

## Плюсы

- генерирует JSON Schema и TypeScript-типы из одной схемы;
- хорошо сочетается с Ajv, Fastify и OpenAPI;
- подходит для межсервисных контрактов.

## Минусы

- менее удобен для прикладной формы валидации, чем Zod;
- часто требует отдельный валидатор вроде Ajv;
- JSON Schema-ориентированный стиль бывает многословным.

## Когда использовать

- главный контракт системы должен быть JSON Schema;
- нужна совместимость с OpenAPI/Fastify/Ajv;
- схемы используются не только TypeScript-кодом.
