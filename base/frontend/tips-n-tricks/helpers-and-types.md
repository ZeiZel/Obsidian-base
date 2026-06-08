---
tags:
  - frontend
---

## Типы

### Nullable

```ts
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Maybe<T> = T | null | undefined;
```

### ValueOf

```ts
type ValueOf<T> = T[keyof T];

const USER_ROLES = {
	admin: 'admin',
	manager: 'manager',
	viewer: 'viewer',
} as const;

type UserRole = ValueOf<typeof USER_ROLES>;
```

### StrictOmit и StrictPick

```ts
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
type StrictPick<T, K extends keyof T> = Pick<T, K>;
```

Обычный `Omit<User, 'unknown'>` не ругается на несуществующий ключ. `StrictOmit` заставляет TypeScript проверить ключ.

### AsyncReturnType

```ts
type AsyncReturnType<T extends (...args: never[]) => Promise<unknown>> =
	Awaited<ReturnType<T>>;
```

```ts
async function getCurrentUser() {
	return { id: '1', name: 'Ada' };
}

type CurrentUser = AsyncReturnType<typeof getCurrentUser>;
```

### ApiResult

```ts
type ApiSuccess<T> = {
	ok: true;
	data: T;
};

type ApiFailure = {
	ok: false;
	error: {
		code: string;
		message: string;
	};
};

type ApiResult<T> = ApiSuccess<T> | ApiFailure;
```

## Guards

```ts
function isDefined<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}
```

```ts
const users = maybeUsers.filter(isDefined);
```

```ts
function assertNever(value: never): never {
	throw new Error(`Unexpected value: ${String(value)}`);
}
```

```ts
function getRoleLabel(role: UserRole) {
	switch (role) {
		case 'admin':
			return 'Администратор';
		case 'manager':
			return 'Менеджер';
		case 'viewer':
			return 'Наблюдатель';
		default:
			return assertNever(role);
	}
}
```

## Форматирование

```ts
function formatCurrency(value: number, currency = 'RUB', locale = 'ru-RU') {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: 0,
	}).format(value);
}
```

```ts
function formatPlural(
	value: number,
	forms: readonly [one: string, few: string, many: string],
) {
	const mod10 = value % 10;
	const mod100 = value % 100;

	if (mod10 === 1 && mod100 !== 11) return forms[0];
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];

	return forms[2];
}
```

```ts
formatPlural(3, ['задача', 'задачи', 'задач']);
```

## Работа с объектами

```ts
function pick<T extends object, K extends keyof T>(object: T, keys: readonly K[]) {
	return keys.reduce(
		(result, key) => {
			result[key] = object[key];
			return result;
		},
		{} as Pick<T, K>,
	);
}
```

```ts
function omit<T extends object, K extends keyof T>(object: T, keys: readonly K[]) {
	const entries = Object.entries(object).filter(
		([key]) => !keys.includes(key as K),
	);

	return Object.fromEntries(entries) as Omit<T, K>;
}
```

## Работа с URL

```ts
function getSearchParam<T extends string>(
	params: URLSearchParams,
	key: string,
	fallback: T,
) {
	return (params.get(key) as T | null) ?? fallback;
}
```

```ts
function setSearchParam(params: URLSearchParams, key: string, value?: string) {
	const nextParams = new URLSearchParams(params);

	if (!value) {
		nextParams.delete(key);
	} else {
		nextParams.set(key, value);
	}

	return nextParams;
}
```

## Async helpers

```ts
function sleep(ms: number) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
```

```ts
async function retry<T>(
	task: () => Promise<T>,
	options: { retries: number; delayMs: number },
) {
	let lastError: unknown;

	for (let attempt = 0; attempt <= options.retries; attempt += 1) {
		try {
			return await task();
		} catch (error) {
			lastError = error;

			if (attempt < options.retries) {
				await sleep(options.delayMs);
			}
		}
	}

	throw lastError;
}
```

## Storage

```ts
function readJsonStorage<T>(key: string, fallback: T): T {
	const rawValue = localStorage.getItem(key);

	if (!rawValue) return fallback;

	try {
		return JSON.parse(rawValue) as T;
	} catch {
		return fallback;
	}
}
```

```ts
function writeJsonStorage<T>(key: string, value: T) {
	localStorage.setItem(key, JSON.stringify(value));
}
```
