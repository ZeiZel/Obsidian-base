---
tags:
  - frontend
  - state-managers
  - jotai
  - react
---

## Введение

Jotai - это атомарный стейт-менеджер для React, вдохновлённый концепцией Recoil. Название переводится с японского как "состояние". Философия Jotai строится на идее атомов - минимальных единиц состояния, которые можно компоновать для создания сложных структур данных.

Ключевые принципы:
- Атомарный подход - каждый атом хранит одну единицу состояния
- Минимальный API - библиотека предоставляет несколько хуков и функцию создания атомов
- Нет бойлерплейта - не нужны провайдеры, редьюсеры и экшены
- Дерево зависимостей строится автоматически через производные атомы
- Размер бандла около 3.2 KB (gzip)

> [!info] Jotai vs Redux/Zustand
> В отличие от сторов с одним большим объектом состояния, Jotai использует подход "снизу вверх" - состояние собирается из мелких атомов. Это устраняет проблему лишних ре-рендеров, потому что компонент подписывается только на конкретные атомы, а не на весь стор.

---

## Установка

```bash
npm install jotai
```

Для дополнительных утилит:

```bash
npm install jotai-devtools
```

---

## Атомы

### Примитивный атом

Примитивный атом - это базовая единица состояния. Он хранит одно значение и может быть прочитан и записан.

```ts
import { atom } from 'jotai';

// примитивные атомы
const countAtom = atom(0);
const nameAtom = atom('');
const isActiveAtom = atom(false);

// атом с объектом
interface User {
  id: string;
  name: string;
  email: string;
}

const userAtom = atom<User | null>(null);

// атом с массивом
const todosAtom = atom<Todo[]>([]);
```

### Производный атом (read-only)

Производные атомы вычисляют значение на основе других атомов. Они автоматически обновляются при изменении зависимостей.

```ts
import { atom } from 'jotai';

const priceAtom = atom(100);
const quantityAtom = atom(2);
const discountAtom = atom(0.1);

// производный атом - пересчитывается автоматически
const totalAtom = atom((get) => {
  const price = get(priceAtom);
  const quantity = get(quantityAtom);
  const discount = get(discountAtom);
  return price * quantity * (1 - discount);
});

// производный атом с фильтрацией
const todosAtom = atom<Todo[]>([]);
const filterAtom = atom<'all' | 'active' | 'completed'>('all');

const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom);
  const filter = get(filterAtom);

  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
});
```

### Read-write атом

Атом может быть одновременно и читаемым, и записываемым. Это позволяет добавить логику при записи.

```ts
import { atom } from 'jotai';

const countAtom = atom(0);

// read-write атом с кастомной логикой записи
const clampedCountAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue: number) => {
    const clamped = Math.max(0, Math.min(100, newValue));
    set(countAtom, clamped);
  }
);

// write-only атом (void в первом аргументе)
const resetAtom = atom(null, (get, set) => {
  set(countAtom, 0);
  set(nameAtom, '');
  set(todosAtom, []);
});
```

### Асинхронный атом

Jotai нативно поддерживает асинхронные атомы, которые интегрируются с React Suspense.

```ts
import { atom } from 'jotai';

interface Post {
  id: number;
  title: string;
  body: string;
}

// асинхронный read атом
const postsAtom = atom(async () => {
  const response = await fetch('/api/posts');
  return response.json() as Promise<Post[]>;
});

// асинхронный атом с зависимостями
const userIdAtom = atom(1);

const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const response = await fetch(`/api/users/${id}`);
  return response.json() as Promise<User>;
});

// асинхронный read-write атом
const todosAtom = atom<Todo[]>([]);

const fetchTodosAtom = atom(
  (get) => get(todosAtom),
  async (get, set) => {
    const response = await fetch('/api/todos');
    const data = await response.json();
    set(todosAtom, data);
  }
);
```

---

## Хуки

### useAtom

Основной хук - возвращает текущее значение и функцию для обновления. Аналогичен `useState`.

```tsx
import { useAtom } from 'jotai';

function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount((prev) => prev + 1)}>+</button>
      <button onClick={() => setCount((prev) => prev - 1)}>-</button>
    </div>
  );
}
```

### useAtomValue

Хук только для чтения. Компонент подписывается на атом, но не может его изменять. Позволяет избежать лишних ре-рендеров в компонентах, которым не нужна функция записи.

```tsx
import { useAtomValue } from 'jotai';

function TotalDisplay() {
  const total = useAtomValue(totalAtom);
  return <span>Итого: {total}</span>;
}

function UserInfo() {
  const user = useAtomValue(userAtom);
  if (!user) return null;
  return <div>{user.name}</div>;
}
```

### useSetAtom

Хук только для записи. Компонент получает функцию обновления, но не подписывается на изменения атома. Полезен, когда компонент должен менять состояние, но не отображать его.

```tsx
import { useSetAtom } from 'jotai';

function LogoutButton() {
  const setUser = useSetAtom(userAtom);
  const resetTodos = useSetAtom(resetAtom);

  const handleLogout = () => {
    setUser(null);
    resetTodos();
  };

  return <button onClick={handleLogout}>Выйти</button>;
}
```

> [!important] Оптимизация ре-рендеров
> Разделение `useAtomValue` и `useSetAtom` позволяет точно контролировать, какие компоненты подписаны на обновления. Компонент с `useSetAtom` не перерендерится при изменении атома - это ключевое преимущество перед `useAtom`.

---

## Atom Families

Atom families создают параметризованные атомы. Это удобно, когда нужно создавать атомы динамически по ключу.

```ts
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// семейство атомов для элементов по ID
const todoAtomFamily = atomFamily((id: string) =>
  atom<Todo>({
    id,
    title: '',
    completed: false,
  })
);

// семейство с производным атомом
const todoCompletedFamily = atomFamily((id: string) =>
  atom(
    (get) => get(todoAtomFamily(id)).completed,
    (get, set, completed: boolean) => {
      set(todoAtomFamily(id), { ...get(todoAtomFamily(id)), completed });
    }
  )
);
```

```tsx
function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));
  const [completed, setCompleted] = useAtom(todoCompletedFamily(id));

  return (
    <li>
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => setCompleted(e.target.checked)}
      />
      <span>{todo.title}</span>
    </li>
  );
}
```

> [!info] Сравнение параметров
> По умолчанию `atomFamily` использует `===` для сравнения параметров. Для объектов нужно передать кастомную функцию сравнения вторым аргументом.

```ts
const userSettingsFamily = atomFamily(
  (params: { userId: string; section: string }) =>
    atom<Settings | null>(null),
  (a, b) => a.userId === b.userId && a.section === b.section
);
```

---

## Интеграция с React Suspense

Асинхронные атомы автоматически работают с Suspense. При загрузке данных компонент приостанавливается и показывает fallback.

```tsx
import { Suspense } from 'react';
import { atom, useAtomValue } from 'jotai';

const userAtom = atom(async () => {
  const res = await fetch('/api/user');
  return res.json() as Promise<User>;
});

function UserProfile() {
  const user = useAtomValue(userAtom);
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <UserProfile />
    </Suspense>
  );
}
```

Для обработки ошибок используется ErrorBoundary:

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>Ошибка загрузки</div>}>
      <Suspense fallback={<div>Загрузка...</div>}>
        <UserProfile />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## Утилиты из jotai/utils

### atomWithStorage

Атом с автоматической синхронизацией в localStorage или sessionStorage.

```ts
import { atomWithStorage } from 'jotai/utils';

const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');
const tokenAtom = atomWithStorage<string | null>('auth-token', null);

// с sessionStorage
const sessionDataAtom = atomWithStorage('session', {}, sessionStorage);
```

### selectAtom

Позволяет подписаться на часть атома, избегая ре-рендеров при изменении несвязанных полей.

```ts
import { selectAtom } from 'jotai/utils';

const userAtom = atom<User>({ name: 'Alice', age: 30, email: 'a@b.com' });

const userNameAtom = selectAtom(userAtom, (user) => user.name);
const userAgeAtom = selectAtom(userAtom, (user) => user.age);
```

### atomWithDefault

Создаёт атом с ленивым начальным значением.

```ts
import { atomWithDefault } from 'jotai/utils';

const currentUserAtom = atomWithDefault(async (get) => {
  const response = await fetch('/api/me');
  return response.json();
});
```

---

## DevTools

Jotai DevTools позволяет инспектировать атомы в реальном времени.

```bash
npm install jotai-devtools
```

```tsx
import { DevTools } from 'jotai-devtools';
import 'jotai-devtools/styles.css';

function App() {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <DevTools />}
      <Main />
    </>
  );
}
```

Для удобной отладки атомам можно давать имена через `debugLabel`:

```ts
const countAtom = atom(0);
countAtom.debugLabel = 'count';

const userAtom = atom<User | null>(null);
userAtom.debugLabel = 'currentUser';
```

---

## Jotai vs Recoil

Jotai и Recoil оба реализуют атомарный подход, но между ними есть существенные различия.

| Критерий | Jotai | Recoil |
|---|---|---|
| Размер бандла | ~3.2 KB | ~22 KB |
| Провайдер | Опционален | Обязателен (RecoilRoot) |
| Строковые ключи | Не нужны | Обязательны для каждого атома |
| TypeScript | Нативная поддержка | Требует ручных типов |
| Поддержка | Активная разработка | Практически заморожен |
| API | Минимальный | Более обширный |

> [!summary] Рекомендация
> Recoil фактически прекратил развитие. Для новых проектов Jotai является предпочтительной атомарной библиотекой за счёт меньшего размера, отсутствия бойлерплейта и активной поддержки.

---

## Паттерны из реальных проектов

### Состояние авторизации

```ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

interface AuthState {
  user: User | null;
  token: string | null;
}

const tokenAtom = atomWithStorage<string | null>('auth-token', null);

const currentUserAtom = atom<User | null>(null);

const isAuthenticatedAtom = atom((get) => {
  return get(tokenAtom) !== null && get(currentUserAtom) !== null;
});

const loginAtom = atom(null, async (get, set, credentials: Credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const { user, token } = await response.json();
  set(tokenAtom, token);
  set(currentUserAtom, user);
});

const logoutAtom = atom(null, (get, set) => {
  set(tokenAtom, null);
  set(currentUserAtom, null);
});
```

### Тема приложения

```ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type Theme = 'light' | 'dark' | 'system';

const themePreferenceAtom = atomWithStorage<Theme>('theme', 'system');

const resolvedThemeAtom = atom((get) => {
  const preference = get(themePreferenceAtom);

  if (preference !== 'system') {
    return preference;
  }

  // определяем системную тему
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  return 'light';
});
```

### Форма с валидацией

```ts
import { atom } from 'jotai';

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const formAtom = atom<FormState>({
  name: '',
  email: '',
  message: '',
});

const formErrorsAtom = atom<FormErrors>((get) => {
  const form = get(formAtom);
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Имя обязательно';
  }

  if (!form.email.includes('@')) {
    errors.email = 'Некорректный email';
  }

  if (form.message.length < 10) {
    errors.message = 'Сообщение должно быть не менее 10 символов';
  }

  return errors;
});

const isFormValidAtom = atom((get) => {
  const errors = get(formErrorsAtom);
  return Object.keys(errors).length === 0;
});

const submitFormAtom = atom(null, async (get, set) => {
  const form = get(formAtom);
  const isValid = get(isFormValidAtom);

  if (!isValid) return;

  await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });

  // сброс формы
  set(formAtom, { name: '', email: '', message: '' });
});
```

### Серверное состояние с инвалидацией

```ts
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// версия для инвалидации кеша
const postsVersionAtom = atom(0);

const postsAtom = atom(async (get) => {
  get(postsVersionAtom); // подписка на инвалидацию
  const response = await fetch('/api/posts');
  return response.json() as Promise<Post[]>;
});

// инвалидация - увеличение версии перезапускает запрос
const invalidatePostsAtom = atom(null, (get, set) => {
  set(postsVersionAtom, (v) => v + 1);
});

const createPostAtom = atom(null, async (get, set, newPost: CreatePostDTO) => {
  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPost),
  });

  // инвалидируем список постов
  set(invalidatePostsAtom);
});
```
