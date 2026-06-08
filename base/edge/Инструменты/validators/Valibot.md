---
tags:
  - edge
  - typescript
  - validation
---
#Valibot #TypeScript #Validation

[NPM: valibot](https://www.npmjs.com/package/valibot)

## Что это такое?

Valibot - модульная TypeScript-библиотека для валидации данных. Она решает ту же задачу, что и Zod, но делает акцент на маленьком размере бандла и tree-shaking.

Полезна, когда валидация нужна на клиенте, в edge-runtime или в приложениях, где важен размер JavaScript.

## Установка

```bash
pnpm add valibot
```

## Базовая схема

```TS
import * as v from 'valibot';

const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(['admin', 'user']),
});

type User = v.InferOutput<typeof UserSchema>;
```

## Парсинг данных

```TS
const user = v.parse(UserSchema, input);
```

Для безопасной обработки:

```TS
const result = v.safeParse(UserSchema, input);

if (!result.success) {
  console.log(result.issues);
  return;
}

const user = result.output;
```

## Валидация формы

```TS
const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

type LoginForm = v.InferInput<typeof LoginSchema>;
```

`InferInput` описывает входные данные, а `InferOutput` - данные после всех преобразований.

## transform

```TS
const SearchSchema = v.object({
  query: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.transform((value) => value.toLowerCase()),
  ),
});
```

## Когда выбирать Valibot

Valibot хорошо подходит, если:

- валидация попадает в клиентский бандл;
- нужна модульность;
- проект чувствителен к размеру зависимостей;
- хочется явно собирать pipeline проверки и преобразования.

Если важнее максимальная популярность, количество примеров и интеграций, обычно проще начать с [[validators/Zod|Zod]].

## Плюсы

- модульная архитектура и хороший tree-shaking;
- маленький клиентский бандл;
- явный pipeline проверок и преобразований.

## Минусы

- меньше готовых примеров и интеграций, чем у Zod;
- API может быть менее привычным для команд, знакомых с Zod;
- для некоторых задач потребуется больше ручной настройки.

## Когда использовать

- валидация попадает в браузерный или edge-бандл;
- важен размер зависимостей;
- нужно явно разделять входной и выходной тип схемы.
