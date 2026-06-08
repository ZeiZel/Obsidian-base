---
tags:
  - edge
  - typescript
  - utility
---
#neverthrow #TypeScript #Result

[NPM: neverthrow](https://www.npmjs.com/package/neverthrow)

## Что это такое?

neverthrow - библиотека для явной работы с ошибками через `Result` и `ResultAsync`. Вместо исключений функция возвращает либо успешный результат, либо ошибку как часть типа.

Это полезно в продуктовой разработке, потому что ошибки становятся видимой частью контракта функции.

## Установка

```bash
pnpm add neverthrow
```

## Result

```TS
import { err, ok, Result } from 'neverthrow';

type DomainError = 'INVALID_EMAIL' | 'USER_BLOCKED';

function createUser(email: string): Result<{ email: string }, DomainError> {
  if (!email.includes('@')) {
    return err('INVALID_EMAIL');
  }

  return ok({ email });
}
```

## Обработка

```TS
const result = createUser('test@example.com');

if (result.isErr()) {
  console.log(result.error);
  return;
}

console.log(result.value.email);
```

## ResultAsync

```TS
import { ResultAsync } from 'neverthrow';

function loadUser(id: string) {
  return ResultAsync.fromPromise(
    fetch(`/api/users/${id}`).then((response) => response.json()),
    () => 'NETWORK_ERROR' as const,
  );
}
```

## Когда использовать

neverthrow полезен для доменной логики, интеграций, платежей, авторизации и других участков, где нельзя терять информацию об ошибке.

Для исключительных ситуаций вроде "сломался инвариант программы" обычный `throw` всё ещё нормален.

## Плюсы

- ошибки становятся частью типа функции;
- удобен для доменной логики и интеграций;
- уменьшает неявные `throw` в ожидаемых ошибках.

## Минусы

- требует дисциплины и нового стиля обработки ошибок;
- может быть многословнее исключений;
- не все библиотеки возвращают Result-подобные типы.

## Когда использовать

- ошибка является ожидаемым результатом операции;
- важно явно различать success/error ветки;
- код связан с платежами, API, авторизацией или доменными правилами.
