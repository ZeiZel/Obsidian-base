---
tags:
  - edge
  - typescript
  - utility
---
#ts-pattern #TypeScript

[NPM: ts-pattern](https://www.npmjs.com/package/ts-pattern)

## Что это такое?

ts-pattern - библиотека для pattern matching в TypeScript. Она помогает писать ветвления по union-типам так, чтобы TypeScript проверял полноту обработки вариантов.

Особенно полезна для:

- finite state machine;
- обработки API-состояний;
- discriminated union;
- доменных событий;
- замены длинных `switch` и вложенных `if`.

## Установка

```bash
pnpm add ts-pattern
```

## Пример

```TS
import { match } from 'ts-pattern';

type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; message: string };

function renderState(state: RequestState) {
  return match(state)
    .with({ status: 'idle' }, () => 'Ничего не загружено')
    .with({ status: 'loading' }, () => 'Загрузка')
    .with({ status: 'success' }, ({ data }) => data.join(', '))
    .with({ status: 'error' }, ({ message }) => message)
    .exhaustive();
}
```

`.exhaustive()` заставляет обработать все варианты union-типа. Если позже добавить новый статус, TypeScript подсветит места, которые нужно обновить.

## Когда использовать

ts-pattern стоит брать там, где состояние имеет конечный набор вариантов и каждый вариант требует отдельной логики.

Не нужно использовать его для простых условий, где обычный `if` читается лучше.

## Плюсы

- exhaustive-проверки для union-типов;
- читабельная обработка сложных состояний;
- хорошо раскрывает discriminated union.

## Минусы

- избыточен для простых `if`/`switch`;
- добавляет зависимость и новый синтаксис;
- при чрезмерном использовании может усложнить код.

## Когда использовать

- есть конечный набор состояний или событий;
- нужно гарантировать обработку всех вариантов union-типа;
- обычный `switch` стал слишком шумным.
