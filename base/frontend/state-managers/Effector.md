---
tags:
  - frontend
  - state-managers
  - effector
---

## Введение

Effector - это стейт-менеджер, построенный на принципах реактивного программирования и событийной архитектуры. Состояние описывается через три базовых юнита - Store, Event, Effect - и их связи. Связи между юнитами задаются декларативно, что делает граф зависимостей прозрачным и предсказуемым.

Ключевые принципы:
- Событийная модель - любое изменение начинается с события
- Декларативные связи - юниты соединяются через операторы, а не императивный код
- Независимость от фреймворка - ядро Effector работает без React, Vue или других библиотек
- Типобезопасность - типы выводятся автоматически по всему графу зависимостей
- Поддержка SSR из коробки через механизм Scope

> [!info] Effector vs Redux
> В Redux действие проходит через редьюсеры, где каждый решает, реагировать или нет. В Effector связь между событием и стором задаётся явно через `.on()` или `sample()`. Это упрощает отслеживание потока данных, потому что все зависимости видны в одном месте.

---

## Установка

```bash
npm install effector effector-react
```

Для работы с плагином Babel/SWC, который добавляет имена юнитам автоматически:

```bash
npm install -D effector/babel-plugin
# или для SWC
npm install -D @effector/swc-plugin
```

```json
// .babelrc
{
  "plugins": ["effector/babel-plugin"]
}
```

---

## Базовые юниты

### Store

Store - контейнер реактивного состояния. Хранит текущее значение и обновляется при срабатывании связанных событий.

```ts
import { createStore, createEvent } from 'effector';

// создание стора с начальным значением
const $counter = createStore(0);

// создание событий
const increment = createEvent();
const decrement = createEvent();
const reset = createEvent();

// привязка событий к стору
$counter
  .on(increment, (state) => state + 1)
  .on(decrement, (state) => state - 1)
  .reset(reset);

// подписка на изменения (вне React)
$counter.watch((value) => console.log('counter:', value));
```

> [!info] Конвенция именования
> В Effector принято называть сторы с префиксом `$` - это позволяет визуально отличать сторы от событий и эффектов в коде.

### Event

Event - юнит, который описывает намерение что-то сделать. События запускают обновления сторов и могут нести полезную нагрузку.

```ts
import { createEvent } from 'effector';

// событие без данных
const buttonClicked = createEvent();

// событие с типизированными данными
const nameChanged = createEvent<string>();
const userSelected = createEvent<{ id: string; name: string }>();

// вызов события
buttonClicked();
nameChanged('Alice');
userSelected({ id: '1', name: 'Alice' });

// prepend - создание нового события с маппингом данных
const inputChanged = nameChanged.prepend(
  (e: React.ChangeEvent<HTMLInputElement>) => e.target.value
);
```

### Effect

Effect - юнит для описания асинхронных операций с побочными эффектами. Автоматически генерирует события `done`, `fail` и `pending`.

```ts
import { createEffect } from 'effector';

interface LoginParams {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

const loginFx = createEffect<LoginParams, AuthResponse, Error>(
  async (params) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }
);

// автоматически генерируемые события
loginFx.done;     // { params, result }
loginFx.fail;     // { params, error }
loginFx.finally;  // { params, status, result?, error? }
loginFx.pending;  // Store<boolean>
```

```ts
// использование эффекта со сторами
const $user = createStore<User | null>(null);
const $error = createStore<string | null>(null);
const $isLoading = loginFx.pending;

$user.on(loginFx.doneData, (_, user) => user);
$error
  .on(loginFx.failData, (_, error) => error.message)
  .reset(loginFx);
```

---

## Производные сторы

### combine

Объединяет несколько сторов в один.

```ts
import { combine, createStore } from 'effector';

const $firstName = createStore('John');
const $lastName = createStore('Doe');

// объект
const $fullName = combine({ first: $firstName, last: $lastName });
// { first: 'John', last: 'Doe' }

// с трансформацией
const $displayName = combine(
  $firstName,
  $lastName,
  (first, last) => `${first} ${last}`
);
// 'John Doe'
```

### map

Создаёт производный стор через трансформацию.

```ts
const $users = createStore<User[]>([]);

const $userCount = $users.map((users) => users.length);

const $activeUsers = $users.map((users) =>
  users.filter((u) => u.isActive)
);

const $userNames = $users.map((users) =>
  users.map((u) => u.name)
);
```

---

## Операторы

### sample

Центральный оператор Effector. Связывает юниты, позволяя взять данные из источника при срабатывании триггера и передать их в цель.

```ts
import { sample, createStore, createEvent, createEffect } from 'effector';

const $form = createStore({ email: '', password: '' });
const submitClicked = createEvent();
const loginFx = createEffect<LoginParams, AuthResponse, Error>(/* ... */);

// при submitClicked - взять данные из $form и передать в loginFx
sample({
  clock: submitClicked,
  source: $form,
  target: loginFx,
});

// с фильтрацией
const $isValid = createStore(false);

sample({
  clock: submitClicked,
  source: $form,
  filter: $isValid,
  target: loginFx,
});

// с маппингом данных
sample({
  clock: submitClicked,
  source: $form,
  fn: (form) => ({
    email: form.email.trim().toLowerCase(),
    password: form.password,
  }),
  target: loginFx,
});
```

### guard (устаревший, используйте sample с filter)

В ранних версиях Effector `guard` использовался для условной маршрутизации событий. Сейчас рекомендуется `sample` с параметром `filter`.

```ts
// устаревший вариант
guard({
  source: formSubmitted,
  filter: $isValid,
  target: submitFx,
});

// рекомендуемый вариант
sample({
  clock: formSubmitted,
  filter: $isValid,
  target: submitFx,
});
```

### split

Разделяет событие на несколько веток по условиям.

```ts
import { split, createEvent } from 'effector';

interface Notification {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const notificationReceived = createEvent<Notification>();
const showSuccess = createEvent<Notification>();
const showError = createEvent<Notification>();
const showWarning = createEvent<Notification>();

split({
  source: notificationReceived,
  match: (notification) => notification.type,
  cases: {
    success: showSuccess,
    error: showError,
    warning: showWarning,
  },
});
```

```ts
// split с условиями
const $age = createStore(0);
const ageChanged = createEvent<number>();

const { child, teen, adult } = split(ageChanged, {
  child: (age) => age < 13,
  teen: (age) => age >= 13 && age < 18,
  adult: (age) => age >= 18,
});
```

---

## Effector + React

### useUnit

Рекомендуемый хук для подключения любых юнитов к React-компонентам. Заменяет устаревшие `useStore` и `useEvent`.

```tsx
import { useUnit } from 'effector-react';

function Counter() {
  const { count, onIncrement, onDecrement, onReset } = useUnit({
    count: $counter,
    onIncrement: increment,
    onDecrement: decrement,
    onReset: reset,
  });

  return (
    <div>
      <span>{count}</span>
      <button onClick={onIncrement}>+</button>
      <button onClick={onDecrement}>-</button>
      <button onClick={onReset}>Reset</button>
    </div>
  );
}
```

```tsx
// useUnit с эффектами - автоматически подписывается на pending
function LoginForm() {
  const { form, isLoading, onSubmit, onEmailChange, onPasswordChange } = useUnit({
    form: $form,
    isLoading: loginFx.pending,
    onSubmit: submitClicked,
    onEmailChange: emailChanged,
    onPasswordChange: passwordChanged,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <input
        value={form.email}
        onChange={(e) => onEmailChange(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="password"
        value={form.password}
        onChange={(e) => onPasswordChange(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
```

### useGate

Gate - механизм для привязки жизненного цикла компонента к событиям.

```tsx
import { createGate } from 'effector-react';
import { sample } from 'effector';

const PageGate = createGate<{ id: string }>();

// при открытии страницы - загрузить данные
sample({
  clock: PageGate.open,
  fn: ({ id }) => id,
  target: fetchPostFx,
});

// при закрытии - очистить состояние
sample({
  clock: PageGate.close,
  target: resetPost,
});

function PostPage({ id }: { id: string }) {
  useGate(PageGate, { id });

  const { post, isLoading } = useUnit({
    post: $post,
    isLoading: fetchPostFx.pending,
  });

  if (isLoading) return <div>Загрузка...</div>;
  if (!post) return <div>Пост не найден</div>;

  return <article>{post.title}</article>;
}
```

---

## Domain API

Domain группирует юниты и позволяет управлять ими как единым целым. Полезен для логирования, тестирования и SSR.

```ts
import { createDomain } from 'effector';

const authDomain = createDomain('auth');

// создание юнитов в домене
const $user = authDomain.createStore<User | null>(null);
const $token = authDomain.createStore<string | null>(null);
const login = authDomain.createEvent<Credentials>();
const logout = authDomain.createEvent();
const loginFx = authDomain.createEffect<Credentials, AuthResponse, Error>();

// перехват всех событий домена
authDomain.onCreateEvent((event) => {
  event.watch((payload) => {
    console.log(`[auth] event: ${event.shortName}`, payload);
  });
});

// перехват всех сторов домена
authDomain.onCreateStore((store) => {
  store.watch((state) => {
    console.log(`[auth] store: ${store.shortName}`, state);
  });
});
```

---

## DevTools

Effector поддерживает инспекцию через пакет `effector-logger` или встроенный Inspector.

```bash
npm install -D effector-logger
```

```ts
import { attachLogger } from 'effector-logger';

// подключение логирования всех юнитов
attachLogger();

// или выборочно
attachLogger($counter);
attachLogger(loginFx);
```

Для визуальной отладки существует расширение `@effector/inspector`:

```bash
npm install -D @effector/inspector
```

```tsx
import { attachInspector } from '@effector/inspector';

if (process.env.NODE_ENV === 'development') {
  attachInspector();
}
```

---

## SSR с Scope

Effector реализует SSR через механизм Scope - изолированный контейнер состояния для каждого запроса.

```ts
import { fork, allSettled } from 'effector';

// серверная обработка запроса
async function handleRequest(req: Request) {
  // создаём изолированный scope для запроса
  const scope = fork();

  // выполняем начальную загрузку данных
  await allSettled(appStarted, { scope, params: req.url });

  // получаем значения сторов из scope
  const user = scope.getState($user);
  const posts = scope.getState($posts);

  // сериализация scope для передачи на клиент
  const serialized = serialize(scope);

  return renderToString(
    <Provider value={scope}>
      <App />
    </Provider>
  );
}
```

```tsx
// клиентская гидрация
import { Provider } from 'effector-react';
import { fork } from 'effector';

const scope = fork({
  values: window.__INITIAL_STATE__,
});

hydrateRoot(
  document.getElementById('root')!,
  <Provider value={scope}>
    <App />
  </Provider>
);
```

---

## Тестирование

Effector легко тестировать благодаря `fork` - каждый тест получает свой изолированный scope.

```ts
import { fork, allSettled } from 'effector';

describe('auth model', () => {
  test('login success updates user store', async () => {
    const scope = fork({
      handlers: [
        // мокаем эффект
        [loginFx, async () => ({ user: { id: '1', name: 'Alice' }, token: 'abc' })],
      ],
    });

    await allSettled(loginFx, {
      scope,
      params: { email: 'alice@example.com', password: '123' },
    });

    expect(scope.getState($user)).toEqual({ id: '1', name: 'Alice' });
    expect(scope.getState($token)).toBe('abc');
  });

  test('login failure sets error', async () => {
    const scope = fork({
      handlers: [
        [loginFx, async () => { throw new Error('Invalid credentials'); }],
      ],
    });

    await allSettled(loginFx, {
      scope,
      params: { email: 'wrong@example.com', password: 'wrong' },
    });

    expect(scope.getState($user)).toBeNull();
    expect(scope.getState($error)).toBe('Invalid credentials');
  });

  test('reset clears all state', async () => {
    const scope = fork({
      values: [
        [$user, { id: '1', name: 'Alice' }],
        [$token, 'abc'],
      ],
    });

    await allSettled(logout, { scope });

    expect(scope.getState($user)).toBeNull();
    expect(scope.getState($token)).toBeNull();
  });
});
```

---

## Паттерны из реальных проектов

### Модель страницы

```ts
import { createEvent, createEffect, createStore, sample } from 'effector';
import { createGate } from 'effector-react';

// gate для жизненного цикла страницы
export const PostsPageGate = createGate<void>();

// события
export const pageOpened = createEvent();
export const searchChanged = createEvent<string>();
export const sortChanged = createEvent<'date' | 'title'>();

// эффекты
export const fetchPostsFx = createEffect<FetchParams, Post[], Error>(
  async (params) => {
    const query = new URLSearchParams(params as Record<string, string>);
    const res = await fetch(`/api/posts?${query}`);
    return res.json();
  }
);

// сторы
export const $posts = createStore<Post[]>([]);
export const $search = createStore('');
export const $sort = createStore<'date' | 'title'>('date');
export const $isLoading = fetchPostsFx.pending;

// связи
$posts.on(fetchPostsFx.doneData, (_, posts) => posts);
$search.on(searchChanged, (_, value) => value);
$sort.on(sortChanged, (_, value) => value);

// загрузка при открытии страницы
sample({
  clock: PostsPageGate.open,
  source: { search: $search, sort: $sort },
  target: fetchPostsFx,
});

// перезагрузка при изменении фильтров
sample({
  clock: [searchChanged, sortChanged],
  source: { search: $search, sort: $sort },
  target: fetchPostsFx,
});
```

### CRUD-модель сущности

```ts
import { createEvent, createEffect, createStore, sample } from 'effector';

// эффекты
const fetchTodosFx = createEffect<void, Todo[]>(
  async () => (await fetch('/api/todos')).json()
);

const createTodoFx = createEffect<CreateTodoDTO, Todo>(
  async (dto) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return res.json();
  }
);

const deleteTodoFx = createEffect<string, string>(
  async (id) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    return id;
  }
);

const toggleTodoFx = createEffect<string, Todo>(
  async (id) => {
    const res = await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
    return res.json();
  }
);

// стор
const $todos = createStore<Todo[]>([])
  .on(fetchTodosFx.doneData, (_, todos) => todos)
  .on(createTodoFx.doneData, (todos, newTodo) => [...todos, newTodo])
  .on(deleteTodoFx.doneData, (todos, id) => todos.filter((t) => t.id !== id))
  .on(toggleTodoFx.doneData, (todos, updated) =>
    todos.map((t) => (t.id === updated.id ? updated : t))
  );

const $todosCount = $todos.map((t) => t.length);
const $completedCount = $todos.map((t) => t.filter((x) => x.completed).length);
```
