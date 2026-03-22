---
tags:
  - frontend
  - validation
  - zod
  - yup
  - valibot
---

## Валидация данных на фронтенде

Валидация входных данных - одна из базовых задач любого приложения. На фронтенде она нужна в нескольких точках: формы пользователя, ответы API, переменные окружения, параметры URL. Без валидации данные попадают в систему в непредсказуемом виде, что приводит к ошибкам в рантайме.

Современные валидаторы решают сразу две задачи: проверяют данные и выводят из схемы TypeScript-типы, что устраняет дублирование между типами и рантайм-проверками.

---

## Zod

Zod - библиотека валидации с приоритетом на TypeScript. Схема описывается декларативно, а TypeScript-тип выводится из неё автоматически через `z.infer`. Не имеет внешних зависимостей.

### Установка

```bash
npm install zod
```

### Базовые схемы

```ts
import { z } from "zod";

// Примитивы
const nameSchema = z.string().min(1).max(100);
const ageSchema = z.number().int().positive();
const isActiveSchema = z.boolean();
const createdAtSchema = z.date();

// Литералы и перечисления
const roleSchema = z.enum(["admin", "user", "moderator"]);
const statusSchema = z.literal("active");

// Nullable и optional
const bioSchema = z.string().nullable();       // string | null
const nicknameSchema = z.string().optional();   // string | undefined
```

### Объекты и массивы

```ts
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().regex(/^\d{6}$/),
});

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  role: z.enum(["admin", "user"]),
  addresses: z.array(addressSchema).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Вложенные объекты и расширение
const adminSchema = userSchema.extend({
  permissions: z.array(z.string()),
});

// Частичные и обязательные
const updateUserSchema = userSchema.partial();           // все поля optional
const requiredUserSchema = updateUserSchema.required();  // все обратно required

// Выбор и исключение полей
const publicUserSchema = userSchema.pick({ name: true, email: true });
const internalSchema = userSchema.omit({ email: true });
```

### Композиция схем

```ts
// Union - одна из нескольких схем
const resultSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("success"), data: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

// Intersection - объединение нескольких схем
const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

const userWithTimestamps = userSchema.merge(timestampsSchema);

// Рекурсивные схемы
type Category = {
  name: string;
  children: Category[];
};

const categorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    children: z.array(categorySchema),
  })
);
```

### Refinements и transforms

Refinement добавляет кастомную проверку, transform преобразует данные в процессе парсинга.

```ts
// Refinement - дополнительная проверка
const passwordSchema = z
  .string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), {
    message: "Нужна хотя бы одна заглавная буква",
  })
  .refine((val) => /\d/.test(val), {
    message: "Нужна хотя бы одна цифра",
  });

// Superrefine - несколько ошибок за один проход
const registrationSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
      });
    }
  });

// Transform - преобразование данных
const trimmedString = z.string().trim().toLowerCase();

const priceSchema = z
  .string()
  .transform((val) => parseFloat(val))
  .pipe(z.number().positive());

// Preprocess - обработка до валидации
const numericString = z.preprocess(
  (val) => (typeof val === "string" ? parseInt(val, 10) : val),
  z.number().int().positive()
);
```

### Вывод типов

```ts
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

// Тип выводится автоматически из схемы
type User = z.infer<typeof userSchema>;
// {
//   id: string;
//   name: string;
//   email: string;
//   role: "admin" | "user";
// }

// Input и output типы для схем с transform
const apiSchema = z.object({
  count: z.string().transform(Number),
});

type ApiInput = z.input<typeof apiSchema>;   // { count: string }
type ApiOutput = z.output<typeof apiSchema>; // { count: number }
```

### Обработка ошибок

```ts
const result = userSchema.safeParse(unknownData);

if (!result.success) {
  // Структурированный доступ к ошибкам
  const formatted = result.error.format();
  // { name: { _errors: ["String must contain at least 2 character(s)"] } }

  // Плоский список
  const flat = result.error.flatten();
  // { fieldErrors: { name: [...], email: [...] }, formErrors: [...] }

  // Массив всех проблем
  result.error.issues.forEach((issue) => {
    console.log(issue.path, issue.message);
  });
} else {
  // result.data полностью типизирован
  console.log(result.data.name);
}

// Кастомные сообщения об ошибках
const localizedSchema = z.object({
  name: z.string({ required_error: "Имя обязательно" }).min(2, "Минимум 2 символа"),
  email: z.string().email("Некорректный email"),
});

// Кастомная карта ошибок
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: `Минимальная длина: ${issue.minimum}` };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);
```

### Интеграция с React Hook Form

```bash
npm install react-hook-form @hookform/resolvers zod
```

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: FormData) {
    // data полностью типизирован и провалидирован
    await login(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register("password")} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        Войти
      </button>
    </form>
  );
}
```

### Интеграция с TanStack Form

```bash
npm install @tanstack/react-form @tanstack/zod-form-adapter zod
```

```tsx
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

function UserForm() {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      await saveUser(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{ onChange: z.string().min(2, "Минимум 2 символа") }}
      >
        {(field) => (
          <div>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((err) => (
              <span key={err}>{err}</span>
            ))}
          </div>
        )}
      </form.Field>
    </form>
  );
}
```

### Валидация ответов API

```ts
const apiResponseSchema = z.object({
  data: z.object({
    users: z.array(userSchema),
    total: z.number(),
    page: z.number(),
  }),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string().datetime(),
  }),
});

type ApiResponse = z.infer<typeof apiResponseSchema>;

async function fetchUsers(page: number): Promise<ApiResponse["data"]> {
  const response = await fetch(`/api/users?page=${page}`);
  const json = await response.json();
  const parsed = apiResponseSchema.parse(json);
  return parsed.data;
}

// Обёртка для типобезопасного fetch
function createTypedFetcher<T extends z.ZodType>(schema: T) {
  return async (url: string): Promise<z.infer<T>> => {
    const response = await fetch(url);
    const json = await response.json();
    return schema.parse(json);
  };
}

const fetchUserList = createTypedFetcher(
  z.object({ users: z.array(userSchema) })
);
```

### Валидация переменных окружения

```ts
// env.ts
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  API_URL: z.string().url(),
  API_KEY: z.string().min(1),
  PORT: z.coerce.number().int().default(3000),
  DEBUG: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
});

export const env = envSchema.parse(process.env);

// Использование - типобезопасный доступ без проверок
console.log(env.API_URL); // string, гарантированно URL
console.log(env.PORT);    // number, гарантированно int
```

> [!info] Валидация env при старте приложения
> Схема env срабатывает при импорте модуля. Если переменные невалидны, приложение упадёт сразу при старте с понятной ошибкой, а не в рантайме при первом обращении.

---

## Yup

Yup - декларативный построитель схем валидации. Исторически это основной валидатор в экосистеме React, особенно в связке с Formik. API основан на цепочке методов.

### Установка

```bash
npm install yup
```

### Базовые схемы

```ts
import * as yup from "yup";

const nameSchema = yup.string().required().min(2).max(100);
const ageSchema = yup.number().required().integer().positive();
const isActiveSchema = yup.boolean().required();
const dateSchema = yup.date().required();

const roleSchema = yup.string().oneOf(["admin", "user", "moderator"]).required();
```

### Объекты и массивы

```ts
const addressSchema = yup.object({
  street: yup.string().required(),
  city: yup.string().required(),
  zip: yup.string().matches(/^\d{6}$/, "Невалидный индекс").required(),
});

const userSchema = yup.object({
  id: yup.string().uuid().required(),
  name: yup.string().min(2).max(100).required(),
  email: yup.string().email("Некорректный email").required(),
  age: yup.number().integer().min(18).max(120).required(),
  role: yup.string().oneOf(["admin", "user"]).required(),
  addresses: yup.array(addressSchema).min(1).required(),
});
```

### Методы валидации

```ts
const passwordSchema = yup
  .string()
  .required("Пароль обязателен")
  .min(8, "Минимум 8 символов")
  .max(128, "Максимум 128 символов")
  .matches(/[A-Z]/, "Нужна заглавная буква")
  .matches(/\d/, "Нужна цифра");

const urlSchema = yup.string().url("Невалидный URL").required();
const emailSchema = yup.string().email().lowercase().trim().required();

// Валидация
try {
  const validData = await userSchema.validate(unknownData, {
    abortEarly: false, // собрать все ошибки, а не только первую
    stripUnknown: true, // удалить поля, не описанные в схеме
  });
} catch (err) {
  if (err instanceof yup.ValidationError) {
    console.log(err.errors);  // string[]
    console.log(err.inner);   // ValidationError[] - по ошибке на поле
  }
}

// Проверка без исключений
const isValid = await userSchema.isValid(unknownData);
```

### Условная валидация

Метод `when` позволяет менять правила в зависимости от значения другого поля.

```ts
const paymentSchema = yup.object({
  method: yup.string().oneOf(["card", "bank_transfer", "crypto"]).required(),

  cardNumber: yup.string().when("method", {
    is: "card",
    then: (schema) => schema.required("Номер карты обязателен").length(16),
    otherwise: (schema) => schema.strip(), // удалить поле из результата
  }),

  iban: yup.string().when("method", {
    is: "bank_transfer",
    then: (schema) => schema.required("IBAN обязателен"),
    otherwise: (schema) => schema.strip(),
  }),

  walletAddress: yup.string().when("method", {
    is: "crypto",
    then: (schema) => schema.required("Адрес кошелька обязателен"),
    otherwise: (schema) => schema.strip(),
  }),
});
```

### Кастомные тесты

```ts
const uniqueEmailSchema = yup
  .string()
  .email()
  .test(
    "unique-email",
    "Этот email уже занят",
    async (value) => {
      if (!value) return true;
      const exists = await checkEmailExists(value);
      return !exists;
    }
  );

// Тест с доступом к контексту
const priceRangeSchema = yup.object({
  minPrice: yup.number().required().min(0),
  maxPrice: yup
    .number()
    .required()
    .test(
      "greater-than-min",
      "Максимальная цена должна быть больше минимальной",
      function (value) {
        return value > this.parent.minPrice;
      }
    ),
});
```

### Интеграция с Formik

```bash
npm install formik yup
```

```tsx
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";

const validationSchema = yup.object({
  email: yup.string().email("Некорректный email").required("Обязательное поле"),
  password: yup.string().min(8, "Минимум 8 символов").required("Обязательное поле"),
});

function LoginForm() {
  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        await login(values);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting }) => (
        <Form>
          <Field name="email" type="email" />
          <ErrorMessage name="email" component="span" />

          <Field name="password" type="password" />
          <ErrorMessage name="password" component="span" />

          <button type="submit" disabled={isSubmitting}>
            Войти
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

### Интеграция с React Hook Form

```bash
npm install react-hook-form @hookform/resolvers yup
```

```tsx
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  name: yup.string().min(2).required(),
  email: yup.string().email().required(),
});

type FormData = yup.InferType<typeof schema>;

function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((data) => saveUser(data))}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit">Сохранить</button>
    </form>
  );
}
```

### Вывод типов

```ts
const schema = yup.object({
  name: yup.string().required(),
  age: yup.number().integer().required(),
  role: yup.string().oneOf(["admin", "user"] as const).required(),
});

type User = yup.InferType<typeof schema>;
// {
//   name: string;
//   age: number;
//   role: "admin" | "user";
// }
```

> [!important] Ограничения InferType
> Вывод типов в Yup менее точный, чем в Zod. Discriminated unions и сложные conditional-схемы через `when` не отражаются в выведенном типе. Для таких случаев нужны явные TypeScript-типы.

---

## Valibot

Valibot - модульная библиотека валидации с функциональным API. Главное преимущество перед Zod - каждая функция является отдельным экспортом, что позволяет tree-shaking на уровне отдельных операций. Результат - кратно меньший бандл.

### Установка

```bash
npm install valibot
```

### Базовые схемы

```ts
import * as v from "valibot";

const nameSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(100));
const ageSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
const isActiveSchema = v.boolean();
const roleSchema = v.picklist(["admin", "user", "moderator"]);

// Nullable и optional
const bioSchema = v.nullable(v.string());
const nicknameSchema = v.optional(v.string());
```

### Объекты и массивы

```ts
const addressSchema = v.object({
  street: v.string(),
  city: v.string(),
  zip: v.pipe(v.string(), v.regex(/^\d{6}$/)),
});

const userSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(2)),
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.integer(), v.minValue(18), v.maxValue(120)),
  role: v.picklist(["admin", "user"]),
  addresses: v.pipe(v.array(addressSchema), v.minLength(1)),
});

// Расширение
const adminSchema = v.object({
  ...userSchema.entries,
  permissions: v.array(v.string()),
});

// Partial и required
const updateSchema = v.partial(userSchema);

// Pick и omit
const publicSchema = v.pick(userSchema, ["name", "email"]);
const internalSchema = v.omit(userSchema, ["email"]);
```

### Pipes и actions

Pipe - центральный механизм Valibot. Схема оборачивается в цепочку действий: каждое действие - отдельная функция, которая валидирует или трансформирует.

```ts
// Валидационные actions
const emailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.email("Некорректный email"),
  v.maxLength(255)
);

const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, "Минимум 8 символов"),
  v.regex(/[A-Z]/, "Нужна заглавная буква"),
  v.regex(/\d/, "Нужна цифра")
);

// Transform - преобразование внутри pipe
const priceSchema = v.pipe(
  v.string(),
  v.transform((input) => parseFloat(input)),
  v.number(),
  v.minValue(0)
);

// Custom validation
const evenNumber = v.pipe(
  v.number(),
  v.check((input) => input % 2 === 0, "Число должно быть чётным")
);

// Кросс-валидация объектов
const registrationSchema = v.pipe(
  v.object({
    password: v.pipe(v.string(), v.minLength(8)),
    confirmPassword: v.string(),
  }),
  v.forward(
    v.check(
      (input) => input.password === input.confirmPassword,
      "Пароли не совпадают"
    ),
    ["confirmPassword"]
  )
);
```

### Вывод типов

```ts
const userSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(2)),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(["admin", "user"]),
});

type User = v.InferOutput<typeof userSchema>;
// {
//   id: string;
//   name: string;
//   email: string;
//   role: "admin" | "user";
// }

// Для схем с transform - входной и выходной типы
type UserInput = v.InferInput<typeof userSchema>;
type UserOutput = v.InferOutput<typeof userSchema>;
```

### Сравнение размера бандла с Zod

Ключевая причина выбора Valibot - tree-shaking. Zod экспортирует всё через класс `z`, и даже если используется только `z.string()`, в бандл попадает вся библиотека.

| Сценарий | Zod | Valibot |
|---|---|---|
| Полная библиотека | ~57 kB min | ~30 kB min |
| Простая форма (string, email, minLength) | ~57 kB min | ~1-2 kB min |
| Сложная валидация (object, array, transform) | ~57 kB min | ~5-8 kB min |

> [!info] Когда размер бандла критичен
> На мобильных устройствах с медленным соединением разница между 57 kB и 2 kB существенна. Если валидация используется только на клиенте для одной формы, Valibot экономит десятки килобайт. В серверном контексте или при сложной валидации разница менее значима.

### Интеграция с React Hook Form

```bash
npm install react-hook-form @hookform/resolvers valibot
```

```tsx
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";

const schema = v.object({
  email: v.pipe(v.string(), v.email("Некорректный email")),
  password: v.pipe(v.string(), v.minLength(8, "Минимум 8 символов")),
});

type FormData = v.InferOutput<typeof schema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((data) => login(data))}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register("password")} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Войти</button>
    </form>
  );
}
```

### Миграция с Zod

Основные отличия в API при переходе:

```ts
// Zod                              →  Valibot
// z.string().min(2)                →  v.pipe(v.string(), v.minLength(2))
// z.string().email()               →  v.pipe(v.string(), v.email())
// z.number().int().positive()      →  v.pipe(v.number(), v.integer(), v.minValue(1))
// z.enum(["a", "b"])               →  v.picklist(["a", "b"])
// z.string().nullable()            →  v.nullable(v.string())
// z.string().optional()            →  v.optional(v.string())
// z.object({...}).partial()        →  v.partial(v.object({...}))
// z.infer<typeof schema>           →  v.InferOutput<typeof schema>
// schema.parse(data)               →  v.parse(schema, data)
// schema.safeParse(data)           →  v.safeParse(schema, data)
// z.string().refine(fn)            →  v.pipe(v.string(), v.check(fn))
// z.string().transform(fn)         →  v.pipe(v.string(), v.transform(fn))
```

> [!summary] Структурное отличие
> Zod использует объектно-ориентированный API с цепочкой методов на одном экземпляре. Valibot использует функциональный подход - каждая операция является отдельной функцией, объединяемой через `pipe`. Это и даёт возможность tree-shaking.

---

## Сравнение

| Критерий | Zod | Yup | Valibot |
|---|---|---|---|
| Размер бандла (min) | ~57 kB | ~40 kB | ~1-30 kB (tree-shakeable) |
| Tree-shaking | Нет | Нет | Да |
| TypeScript-first | Да | Нет (добавлен позже) | Да |
| Вывод типов | Точный | Базовый | Точный |
| API стиль | Цепочка методов (ООП) | Цепочка методов (ООП) | Функции + pipe (ФП) |
| Async валидация | Да | Да | Да |
| Экосистема | Обширная | Зрелая | Растущая |
| React Hook Form | zodResolver | yupResolver | valibotResolver |
| Formik | Через адаптер | Нативная поддержка | Через адаптер |
| TanStack Form | Нативный адаптер | Через адаптер | Через адаптер |
| Discriminated unions | Да | Нет | Да (variant) |
| Рекурсивные схемы | z.lazy | yup.lazy | v.lazy |
| Кастомные ошибки | Гибкие (errorMap) | Строки | Строки |

### Когда что выбирать

Zod подходит для большинства TypeScript-проектов. Самая большая экосистема, лучшая поддержка в tRPC, Next.js Server Actions и других серверных фреймворках. Размер бандла не проблема, если валидация выполняется на сервере или бандл и без того крупный.

Yup стоит использовать в проектах с Formik или если команда уже знакома с его API. Для новых проектов объективных преимуществ перед Zod нет.

Valibot оптимален там, где размер бандла критичен - лёгкие SPA, виджеты для встраивания, мобильные PWA. Также подходит для проектов, где валидация используется только на клиенте в нескольких формах.

> [!summary] Общая рекомендация
> Для нового проекта - Zod. Если бандл критичен и валидация только на клиенте - Valibot. Yup - только если проект уже на Formik и нет причин мигрировать.
