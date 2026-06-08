---
tags:
  - edge
  - typescript
  - validation
  - json-schema
---
#Ajv #JSONSchema #Validation

[NPM: ajv](https://www.npmjs.com/package/ajv)

## Что это такое?

Ajv - быстрый валидатор JSON Schema. Он не является TypeScript-библиотекой в стиле Zod, но очень полезен в TypeScript-проектах, если данные описываются через JSON Schema.

Частые сценарии:

- проверка API-контрактов;
- валидация конфигов;
- Fastify schemas;
- OpenAPI;
- проверка входящих webhook-событий.

## Установка

```bash
pnpm add ajv ajv-formats
```

## Пример схемы

```TS
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = addFormats(new Ajv({ allErrors: true }));

const schema = {
  type: 'object',
  required: ['id', 'email'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
  },
} as const;

const validate = ajv.compile(schema);

if (!validate(input)) {
  console.log(validate.errors);
}
```

## Типы

Если писать JSON Schema руками, TypeScript-тип можно описать отдельно:

```TS
interface User {
  id: string;
  email: string;
}
```

Но лучше избегать двух источников правды. Для этого можно использовать [[validators/TypeBox|TypeBox]] или генераторы схем из типов.

## Когда выбирать Ajv

Ajv стоит использовать, если:

- в проекте уже есть JSON Schema;
- нужен высокий runtime performance;
- схема используется не только в TypeScript;
- требуется совместимость с OpenAPI/Fastify.

Если нужна удобная разработка прикладных схем прямо в коде, обычно проще взять [[validators/Zod|Zod]] или [[validators/Valibot|Valibot]].

## Плюсы

- очень быстрый JSON Schema validator;
- подходит для стандартных API-контрактов;
- хорошо работает в backend и gateway-слоях.

## Минусы

- TypeScript-типы не выводятся автоматически из обычной JSON Schema;
- ошибки валидации требуют форматирования для UI;
- для прикладного кода API ниже уровнем, чем у Zod/Valibot.

## Когда использовать

- в проекте уже есть JSON Schema;
- нужна производительная проверка больших потоков данных;
- валидация должна быть совместима с внешними системами.
