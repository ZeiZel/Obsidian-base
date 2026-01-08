---
tags:
  - NASA
  - coding
  - principles
---

NASA Power of 10 — это 10 строгих правил кодирования, разработанных в 2006 году Gerard Holzmann из NASA/JPL для safety-critical C-кода в космических миссиях. Они упрощают статический анализ, устраняют сложные конструкции и повышают надёжность, минимизируя ошибки в системах, где сбой стоит жизни. В TypeScript правила адаптируются через типы, ESLint/TSLint и инструменты вроде SonarQube, сохраняя фокус на предсказуемости и верифицируемости.[1][2][3][4][5]

## Правило 1: Простой контроль потока

Запрещены goto, setjmp/longjmp, рекурсия (прямая/косвенная). Цель — ациклический граф вызовов для лёгкого анализа.[5]

**Плохо (рекурсия):**

```typescript
function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1); // Рекурсия → запрет
}
```

**Хорошо (итерация):**

```typescript
function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) { // Фиксированный bound
    result *= i;
  }
  return result;
}
```

## Правило 2: Фиксированные границы циклов

Все циклы с compile-time verifiable верхней границей; инструменты (ESLint) должны статически доказать отсутствие бесконечности

**Плохо (нефиксированный while):**

```typescript
function processArray(arr: number[]): number {
  let i = 0;
  while (i < arr.length) { // Длина runtime → нарушение
    arr[i++] *= 2;
  }
  return arr.length;
}
```

**Хорошо (for с const max):**

```typescript
const MAX_ARRAY_SIZE = 1000;
function processArray(arr: number[]): number | Error {
  if (arr.length > MAX_ARRAY_SIZE) return new Error('Array too large');
  for (let i = 0; i < Math.min(arr.length, MAX_ARRAY_SIZE); i++) {
    arr[i] *= 2;
  }
  return arr.length;
}
```

## Правило 3: Без динамического выделения после init

Запрет new после инициализации; использовать фиксированные массивы или пулы объектов для предсказуемой памяти (в TS — избегать runtime new)

**Плохо:**

```typescript
function createCache(size: number): Map<string, string> {
  return new Map(); // Динамическое выделение
}
```

**Хорошо (фиксированный пул):**

```typescript
interface CacheEntry { key: string; value: string; used: boolean; }
const CACHE_POOL: CacheEntry[] = Array(100).fill({ key: '', value: '', used: false });

function getCacheEntry(key: string): CacheEntry | null {
  for (let i = 0; i < CACHE_POOL.length; i++) {
    if (!CACHE_POOL[i].used) {
      CACHE_POOL[i].key = key;
      CACHE_POOL[i].used = true;
      return CACHE_POOL[i];
    }
  }
  return null;
}
```

## Правило 4: Функции ≤60 строк

Одна логическая единица на лист бумаги; разбивать на мелкие функции

TS-инструмент для проверки (из ):

```typescript
function measureFunctionSize(fn: Function): number {
  const lines = fn.toString().split('\n')
    .filter(line => line.trim().length > 0 && !line.trim().startsWith('//'));
  return lines.length; // Должно быть ≤60
}
```

## Правило 5: ≥2 ассершена на функцию

Ассершены (assert) для pre/post-условий, без side-effects; при фейле — recovery (return Error).[5]

```typescript
function divide(a: number, b: number): number | Error {
  assert(a >= 0 && b > 0, 'Invalid inputs'); // Assertion 1: pre-condition
  const result = a / b;
  assert(Number.isFinite(result), 'Division overflow'); // Assertion 2: post-condition
  return result;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
```

## Правило 6: Минимальный scope переменных

Объявлять в самом узком scope; в TS — let/const внутри блоков.[5]

**Плохо:**

```typescript
function process(items: number[]) {
  let sum = 0; // Широкий scope
  for (let i = 0; i < items.length; i++) {
    sum += items[i]; // Переиспользование
  }
  // sum используется дальше?
}
```

**Хорошо:**

```typescript
function process(items: number[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i]; // Локальный scope
    total += item;
  }
  return total;
}
```

## Правило 7: Проверка возвратов и параметров

Все non-void функции проверять; параметры валидировать в callee

```typescript
function safeParseInt(str: string): number | Error {
  assert(typeof str === 'string' && str.length > 0, 'Invalid param');
  const num = parseInt(str, 10);
  if (isNaN(num)) return new Error('Parse failed');
  return num;
}

function useIt(str: string) {
  const result = safeParseInt(str); // Обязательная проверка
  if (result instanceof Error) return; // Recovery
  console.log(result * 2);
}
```

## Правило 8: Ограниченный препроцессор

Только #include и простые макросы; без token pasting, ellipses, рекурсии. 

В TS — избегать сложных const enum

**Хорошо (простые const):**

```typescript
const MAX_ITER = 1000;
const ERROR_CODE = 1;
```

## Правило 9: Ограниченные указатели

≤1 уровень dereference; без function pointers. В TS — избегать `any[]`, предпочитать typed arrays

**Плохо:**
```typescript
type Nested = { data: { value: number }[] };

function bad(nested: Nested) {
  return nested.data[0].value; // Двойной deref
}
```

**Хорошо:**

```typescript
interface FlatData { value: number; }

function good(data: FlatData[]) {
  if (data.length > 0) return data[0].value; // Один уровень
  return 0;
}
```

## Правило 10: Полная компиляция с warnings

Компиляция с max pedantic warnings (tsc --strict); ежедневный static analysis (ESLint, SonarTS) с 0 warnings.

`tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true
  }
}
```

Инструменты: ESLint + typescript-eslint для автоматизации

## Зачем и как применять

Правила снижают дефекты на 10-100x за счёт верифицируемости, используются в JPL для миссий вроде Toyota throttle (243 violations нашли). В TS внедрять через ESLint plugins, CI checks, code reviews; профит — в предсказуемом коде для high-reliability apps (IoT, finance).
