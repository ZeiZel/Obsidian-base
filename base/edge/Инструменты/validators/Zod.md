---
tags:
  - edge
  - typescript
  - validation
---
#Zod #TypeScript #Validation

[NPM: zod](https://www.npmjs.com/package/zod)

## Что это такое?

Zod - это TypeScript-first библиотека для runtime-валидации данных. TypeScript проверяет типы только во время разработки, а Zod проверяет реальные данные во время выполнения программы.

Особенно полезен для:

- данных из API;
- переменных окружения;
- форм;
- query-параметров и route params;
- сообщений из очередей, WebSocket и webhooks;
- контрактов между frontend и backend.

## Установка

```bash
pnpm add zod
```

## Базовая схема

```TS
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user']),
});

type User = z.infer<typeof UserSchema>;
```

`UserSchema` используется в runtime, а `User` получается из схемы и используется как обычный TypeScript-тип.

## parse и safeParse

`parse` выбрасывает ошибку, если данные невалидны.

```TS
const user = UserSchema.parse(input);
```

`safeParse` возвращает объект с результатом и удобнее для контролируемой обработки ошибок.

```TS
const result = UserSchema.safeParse(input);

if (!result.success) {
  console.log(result.error.flatten());
  return;
}

const user = result.data;
```

## Валидация env

```TS
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
});

export const env = EnvSchema.parse(process.env);
```

`z.coerce.number()` полезен, потому что значения из `process.env` всегда приходят строками.

## Валидация API-ответа

```TS
const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number().nonnegative(),
});

const ProductsResponseSchema = z.array(ProductSchema);

async function getProducts() {
  const response = await fetch('/api/products');
  const json = await response.json();

  return ProductsResponseSchema.parse(json);
}
```

Так приложение не доверяет внешнему API вслепую.

## refine и transform

`refine` добавляет кастомную проверку.

```TS
const PasswordSchema = z
  .string()
  .min(8)
  .refine((value) => /\d/.test(value), 'Пароль должен содержать цифру');
```

`transform` преобразует валидное значение.

```TS
const SlugSchema = z.string().transform((value) => value.trim().toLowerCase());
```

## Когда выбирать Zod

Zod стоит брать по умолчанию, если нужен понятный DX, хорошая поддержка TypeScript и один источник правды для схемы и типа.

Не стоит превращать Zod в замену бизнес-логике. Схемы должны проверять форму данных, а правила вроде "пользователь может оплатить заказ" лучше держать в доменной логике.

## Плюсы

- отличная TypeScript-интеграция и вывод типов из схем;
- удобный API для форм, API-ответов и env;
- большая экосистема интеграций.

## Минусы

- runtime-валидация добавляет вес и стоимость выполнения;
- сложные схемы могут стать трудно читаемыми;
- не заменяет доменную бизнес-валидацию.

## Когда использовать

- нужно валидировать неизвестные данные на границах системы;
- нужен один источник правды для схемы и TypeScript-типа;
- проекту важнее DX и экосистема, чем минимальный размер бандла.
