---
tags:
  - frontend
  - state-managers
  - signals
---

## Что такое Signals

Signals - это примитив реактивности, обеспечивающий тонкогранулярное отслеживание зависимостей. В отличие от подхода React, где ре-рендерится весь компонент при изменении состояния, сигналы обновляют только те части UI, которые действительно зависят от изменённых данных.

Основные концепции:
- Signal - реактивная ячейка, хранящая значение
- Computed / Memo - производное значение, пересчитываемое при изменении зависимостей
- Effect - побочный эффект, выполняемый при изменении зависимостей

Отслеживание зависимостей происходит автоматически во время чтения значения - если код внутри computed или effect обращается к сигналу, зависимость регистрируется. Это устраняет необходимость в массивах зависимостей, как в `useEffect` или `useMemo`.

> [!info] Тонкогранулярная реактивность
> При изменении сигнала обновляется не весь компонент, а конкретная привязка в DOM. Это исключает diff-сравнение виртуального DOM и даёт высокую производительность на больших списках и частых обновлениях.

---

## Preact Signals

Preact Signals - это легковесная реализация сигналов, доступная как для Preact, так и для React. Размер бандла около 1.3 KB.

### Установка

```bash
# для Preact
npm install @preact/signals

# для React
npm install @preact/signals-react
```

### Базовое использование

```ts
import { signal, computed, effect } from '@preact/signals-react';

// создание сигнала
const count = signal(0);
const name = signal('Alice');

// чтение и запись
console.log(count.value); // 0
count.value = 5;

// computed - автоматически пересчитывается
const doubled = computed(() => count.value * 2);

// effect - выполняется при изменении зависимостей
effect(() => {
  console.log(`Count is now: ${count.value}`);
});

count.value = 10; // выведет "Count is now: 10"
```

### Использование в React-компонентах

```tsx
import { signal, computed } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';

const todos = signal<Todo[]>([]);
const filter = signal<'all' | 'active' | 'completed'>('all');

const filteredTodos = computed(() => {
  switch (filter.value) {
    case 'active':
      return todos.value.filter((t) => !t.completed);
    case 'completed':
      return todos.value.filter((t) => t.completed);
    default:
      return todos.value;
  }
});

function TodoList() {
  useSignals(); // активирует отслеживание сигналов

  return (
    <ul>
      {filteredTodos.value.map((todo) => (
        <li key={todo.id}>
          <span>{todo.title}</span>
        </li>
      ))}
    </ul>
  );
}

function AddTodo() {
  useSignals();

  const handleAdd = (title: string) => {
    todos.value = [
      ...todos.value,
      { id: crypto.randomUUID(), title, completed: false },
    ];
  };

  return <button onClick={() => handleAdd('New task')}>Add</button>;
}
```

### Batch-обновления

```ts
import { batch, signal } from '@preact/signals-react';

const firstName = signal('John');
const lastName = signal('Doe');

// без batch - два обновления UI
firstName.value = 'Jane';
lastName.value = 'Smith';

// с batch - одно обновление
batch(() => {
  firstName.value = 'Jane';
  lastName.value = 'Smith';
});
```

---

## Angular Signals

Angular начиная с версии 17 включает сигналы как часть фреймворка. Это замена Zone.js и основа для будущей модели change detection.

### Базовое использование

```ts
import { signal, computed, effect } from '@angular/core';

// создание сигнала
const count = signal(0);
const name = signal('Alice');

// чтение
console.log(count()); // 0 - в Angular вызов как функция

// запись
count.set(5);
count.update((prev) => prev + 1);

// computed - read-only сигнал
const doubled = computed(() => count() * 2);
```

### В компонентах Angular

```ts
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>
      <span>{{ count() }}</span>
      <span>Doubled: {{ doubled() }}</span>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
    </div>
  `,
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  constructor() {
    // effect для побочных эффектов
    effect(() => {
      console.log(`Count changed: ${this.count()}`);
    });
  }

  increment() {
    this.count.update((c) => c + 1);
  }

  decrement() {
    this.count.update((c) => c - 1);
  }
}
```

### Signal inputs и model

Angular 17.1+ добавляет signal-based inputs:

```ts
import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <div>
      <h3>{{ name() }}</h3>
      <input [value]="searchQuery()" (input)="searchQuery.set($event.target.value)" />
    </div>
  `,
})
export class UserCardComponent {
  // signal input - read-only
  name = input.required<string>();
  age = input(0); // с дефолтным значением

  // model - двусторонняя привязка через сигнал
  searchQuery = model('');

  // typed output
  selected = output<string>();
}
```

### linkedSignal

Angular 19 добавляет `linkedSignal` - сигнал, который автоматически сбрасывается при изменении источника:

```ts
import { signal, linkedSignal } from '@angular/core';

const items = signal(['Apple', 'Banana', 'Cherry']);

// selectedItem сбрасывается на первый элемент при изменении items
const selectedItem = linkedSignal(() => items()[0]);

console.log(selectedItem()); // 'Apple'
items.set(['Date', 'Fig']);
console.log(selectedItem()); // 'Date' - автоматически обновился
```

### resource API

Angular 19 вводит `resource` для асинхронной загрузки данных через сигналы:

```ts
import { resource, signal } from '@angular/core';

const userId = signal(1);

const userResource = resource({
  request: () => ({ id: userId() }),
  loader: async ({ request }) => {
    const res = await fetch(`/api/users/${request.id}`);
    return res.json() as Promise<User>;
  },
});

// чтение
userResource.value();      // User | undefined
userResource.status();     // 'idle' | 'loading' | 'resolved' | 'error'
userResource.isLoading();  // boolean
userResource.error();      // unknown
```

---

## Solid.js Signals

Solid.js построен на сигналах как фундаментальном примитиве. Компоненты выполняются один раз, а реактивность обеспечивается через сигналы без виртуального DOM.

### Базовое использование

```tsx
import { createSignal, createMemo, createEffect } from 'solid-js';

function Counter() {
  // createSignal возвращает [getter, setter]
  const [count, setCount] = createSignal(0);
  const [name, setName] = createSignal('Alice');

  // memo - аналог computed
  const doubled = createMemo(() => count() * 2);

  // effect - выполняется при изменении зависимостей
  createEffect(() => {
    console.log(`Count: ${count()}, Doubled: ${doubled()}`);
  });

  return (
    <div>
      <span>{count()}</span>
      <span>x2: {doubled()}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
```

### Stores для сложного состояния

```tsx
import { createStore, produce } from 'solid-js/store';

function TodoApp() {
  const [state, setState] = createStore({
    todos: [] as Todo[],
    filter: 'all' as 'all' | 'active' | 'completed',
  });

  const addTodo = (title: string) => {
    setState(
      produce((s) => {
        s.todos.push({
          id: crypto.randomUUID(),
          title,
          completed: false,
        });
      })
    );
  };

  const toggleTodo = (id: string) => {
    setState(
      'todos',
      (todo) => todo.id === id,
      'completed',
      (completed) => !completed
    );
  };

  // тонкогранулярная реактивность - рендерит только изменённые элементы
  return (
    <For each={state.todos}>
      {(todo) => (
        <li>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.title}
        </li>
      )}
    </For>
  );
}
```

### createResource

Solid предоставляет встроенный примитив для асинхронных данных:

```tsx
import { createResource, createSignal, Suspense } from 'solid-js';

const [userId, setUserId] = createSignal(1);

const [user] = createResource(userId, async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

function UserProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>{user()?.name}</div>
    </Suspense>
  );
}
```

---

## TC39 Proposal

Существует предложение TC39 по стандартизации сигналов в JavaScript. Если оно будет принято, сигналы станут нативным API браузера.

Текущий статус - Stage 1. Ключевые идеи предложения:

```ts
// предполагаемый API (может измениться)
const counter = new Signal.State(0);
const doubled = new Signal.Computed(() => counter.get() * 2);

counter.set(5);
console.log(doubled.get()); // 10

// watcher для побочных эффектов
const watcher = new Signal.subtle.Watcher(() => {
  console.log('signal changed');
});
watcher.watch(counter);
```

> [!important] Статус предложения
> TC39 Signal proposal находится на ранней стадии. Полифиллы доступны, но API может существенно измениться. Для production-кода используйте библиотечные реализации (Preact Signals, Angular Signals, Solid.js).

Цель предложения - создать общий примитив реактивности, который фреймворки смогут использовать как основу, обеспечивая совместимость между библиотеками.

---

## Сравнение реализаций

| Критерий | Preact Signals | Angular Signals | Solid.js | TC39 Proposal |
|---|---|---|---|---|
| API чтения | `.value` | `signal()` | `signal()` | `.get()` |
| API записи | `.value = x` | `.set(x)`, `.update(fn)` | `setter(x)` | `.set(x)` |
| Computed | `computed()` | `computed()` | `createMemo()` | `Signal.Computed` |
| Effect | `effect()` | `effect()` | `createEffect()` | `Signal.subtle.Watcher` |
| Размер | ~1.3 KB | Часть фреймворка | Часть фреймворка | Нативный API |
| Фреймворк | Preact, React | Angular | Solid.js | Любой |
| Виртуальный DOM | Да (Preact/React) | Нет | Нет | N/A |
| Батчинг | `batch()` | Автоматический | Автоматический | `Signal.subtle` |

Solid.js предлагает наиболее зрелую реализацию сигналов с тонкогранулярной реактивностью без виртуального DOM. Angular Signals представляют эволюцию фреймворка в сторону зональной-независимой реактивности. Preact Signals дают возможность использовать сигналы в существующих React/Preact-проектах.
