---
tags:
  - interview
  - react
  - frontend
---

Данная статья содержит 50 вопросов по React уровня Senior и развёрнутые ответы на них. Вопросы охватывают внутреннее устройство React, современные возможности (React 18 и 19), паттерны проектирования, производительность и тестирование. Каждый ответ раскрывает механику работы, компромиссы и практические сценарии.

---

### 1. Virtual DOM vs Real DOM

Virtual DOM - это легковесное JavaScript-представление реального DOM. Преимущество не в том, что VDOM быстрее прямых манипуляций с DOM, а в том, что он даёт декларативную модель программирования с приемлемой производительностью.

**Как работает VDOM:**

1. При изменении состояния React строит новое виртуальное дерево (fiber-дерево)
2. Запускается reconciliation - сравнение нового дерева с текущим (diffing)
3. Вычисляются минимальные мутации, необходимые для обновления реального DOM
4. Commit phase применяет мутации к реальному DOM

**Почему VDOM не всегда быстрее:**

1. **Простые обновления одного элемента:** `document.querySelector` + `textContent` быстрее, чем прогон всего fiber-дерева
2. **Первичный рендер:** VDOM строится + реальный DOM строится = двойная работа
3. **Большие списки без ключей:** O(n) diffing по всему списку вместо точечного обновления
4. **Глубокие деревья с частыми обновлениями:** Diffing проходит всё поддерево, даже если меняется только один лист

VDOM - это не про абсолютную скорость, а про баланс между производительностью разработки (декларативность) и рантайм-производительностью. Альтернативные подходы: компиляция (Svelte) или реактивность на основе сигналов (Solid.js) - дают лучшую рантайм-производительность ценой иной модели программирования.

React работает над преодолением ограничений VDOM: React Compiler (Forget) выполняет часть работы на этапе компиляции, а не в рантайме, уменьшая затраты на reconciliation.

> [!important]
> VDOM - это prerequisite для reconciliation. Без промежуточного представления React не мог бы сравнивать деревья и вычислять минимальные мутации. Но сам по себе VDOM не гарантирует производительность - ключевую роль играет эффективность diffing-алгоритма.

---

### 2. Reconciliation + Diffing + Keys

Reconciliation - это процесс, с помощью которого React определяет, какие части DOM необходимо обновить при изменении состояния или пропсов. В основе reconciliation лежит Diffing алгоритм со сложностью O(n), работающий по двум предположениям:

- Элементы разного типа порождают разные поддеревья
- Разработчик может подсказать, какие элементы стабильны, с помощью атрибута `key`

**Пошаговая механика Diffing:**

1. **Корневое сравнение:** Если тип корневого элемента изменился (например, `<div>` → `<span>`), React размонтирует старое дерево целиком и монтирует новое. Сравнение атрибутов: для элементов одного типа React обновляет только изменившиеся атрибуты.
2. **Рекурсия по детям:** React итерируется по списку детей одновременно по старому и новому виртуальному DOM. Без ключей он сравнивает элементы по индексу, что приводит к лишним пересозданиям при вставке в начало списка.
3. **Keys:** Ключи позволяют React сопоставить старые и новые элементы по идентификатору, минимизируя мутации DOM.

**Проблема индекса как ключа:**

```tsx
// Исходный список
const items = [
  { id: 'a', text: 'Apple' },
  { id: 'b', text: 'Banana' },
  { id: 'c', text: 'Cherry' },
];

// После вставки в начало
const items = [
  { id: 'd', text: 'Date' },
  { id: 'a', text: 'Apple' },
  { id: 'b', text: 'Banana' },
  { id: 'c', text: 'Cherry' },
];
```

С индексами React думает, что элемент 0 изменился с Apple на Date, элемент 1 - с Banana на Apple, и т.д. Это приводит к пересозданию всех 1000 DOM-узлов при вставке одного элемента. С ID React понимает: 'd' - новый, 'a', 'b', 'c' - существующие.

> [!important]
> Без ключей вставка элемента в начало списка из 1000 элементов вызовет пересоздание всех 1000 элементов. С ключами React переиспользует существующие DOM-узлы и только добавит новый. Index как ключ допустим только если список статичен и не содержит состояния внутри элементов.

```tsx
// Плохо: индекс как ключ при изменяемом списке
{items.map((item, index) => <Item key={index} {...item} />)}

// Хорошо: стабильный идентификатор
{items.map(item => <Item key={item.id} {...item} />)}
```

React не делает полного сравнения двух VDOM-деревьев (это было бы O(n³)). Вместо этого применяется эвристический алгоритм O(n), который достаточно эффективен для большинства UI-паттернов.

---

### 3. useEffect: execution, dependencies, cleanup, race conditions

`useEffect` - основной механизм для side effects в функциональных компонентах. Понимание его механики критично для избежания багов.

**Порядок выполнения:**

```
Рендер → commit (React обновляет DOM) → useLayoutEffect → браузер рисует → useEffect
```

**Зависимости:**

- `[]` - эффект выполняется только при монтировании
- `[a, b]` - эффект выполняется при изменении `a` или `b`
- без массива - эффект выполняется после каждого рендера

**Cleanup функция:**

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });

  return () => controller.abort(); // cleanup при размонтировании или изменении зависимостей
}, [userId]);
```

> [!important]
> Cleanup вызывается в двух случаях: при размонтировании компонента и перед повторным выполнением эффекта при изменении зависимостей. Это гарантирует, что подписки, таймеры и запросы не накапливаются.

**Race conditions:**

При быстром изменении зависимостей может возникнуть ситуация, когда результат старого запроса arrives позже нового:

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });

    return () => controller.abort();
  }, [userId]);

  return user ? <div>{user.name}</div> : <Spinner />;
}
```

Флаг `cancelled` предотвращает `setState` на размонтированном компоненте, но не отменяет сетевой запрос. AbortController реально прерывает fetch на уровне браузера, экономя трафик и ресурсы сервера.

---

### 4. useState vs useReducer

`useReducer` предпочтителен, когда:

1. Следующее состояние зависит от предыдущего сложным образом
2. Несколько взаимосвязанных значений обновляются атомарно
3. Логика обновления сложна и должна быть протестирована отдельно от компонента
4. Обновления состояния происходят глубоко в дереве - dispatch не меняет ссылку между рендерами

```tsx
type State = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: User[] | null;
  error: Error | null;
  selectedIds: Set<string>;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User[] }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'TOGGLE_SELECT'; payload: string };

function userReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS':
      return { ...state, status: 'success', data: action.payload };
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedIds);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      return { ...state, selectedIds: next };
    }
    default:
      return state;
  }
}
```

> [!important]
> `dispatch` стабилен между рендерами (как ref), поэтому его безопасно передавать в `useEffect`-зависимости и дочерним компонентам без `useCallback`. Это ключевое преимущество перед `useState` при передаче колбэков вниз по дереву.

**Тестируемость:** Редьюсер - чистая функция (state, action) → state. Её можно тестировать изолированно, без рендеринга компонентов.

```tsx
test('TOGGLE_SELECT adds item if not selected', () => {
  const state = { selectedIds: new Set(['1']), /* ... */ };
  const next = userReducer(state, { type: 'TOGGLE_SELECT', payload: '2' });
  expect(next.selectedIds.has('2')).toBe(true);
});
```

---

### 5. useMemo vs useCallback vs React.memo

Все три механизма решают проблему referential equality и предотвращают избыточные вычисления, но на разных уровнях:

**`React.memo`** - HOC, оборачивающий компонент. Предотвращает ререндер компонента, если пропсы не изменились (поверхностное сравнение).

```tsx
const UserCard = React.memo(function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
});
```

**`useMemo`** - кеширует результат вычисления. Предотвращает повторное выполнение дорогой функции.

```tsx
const sortedList = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);
```

**`useCallback`** - кеширует функцию. Это частный случай `useMemo`:

```tsx
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);
// Эквивалентно:
// const handleClick = useMemo(() => (id: string) => setSelected(id), []);
```

> [!important]
> `useMemo` и `useCallback` не бесплатны - они потребляют память и добавляют накладные расходы на проверку зависимостей. Применяйте их, только если есть измеримая проблема: передача значения в `React.memo`-обёрнутый компонент, использование в `useEffect`, или реально дорогое вычисление (>1 мс).

**Проблема referential equality с React.memo:**

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount(c => c + 1); // новая функция при каждом рендере

  return (
    <>
      <div>{count}</div>
      {/* ExpensiveChild ререндерится всегда, несмотря на memo */}
      <ExpensiveChild onClick={handleClick} />
    </>
  );
}

const ExpensiveChild = React.memo(function ExpensiveChild({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click</button>;
});
```

Решение - стабилизация ссылок через `useCallback` или `useMemo`.

---

### 6. State management: lifting state up, colocation

**Lifting state up** - подъём состояния до ближайшего общего предка компонентов, которым оно нужно. Это фундаментальный паттерн React.

```tsx
function Accordion() {
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  return (
    <div>
      <Panel id="1" isOpen={openPanel === '1'} onToggle={setOpenPanel} />
      <Panel id="2" isOpen={openPanel === '2'} onToggle={setOpenPanel} />
    </div>
  );
}
```

**Colocation** - принцип размещения состояния как можно ближе к месту его использования.

> [!important]
> Золотое правило: если два компонента разделяют состояние - подними его до ближайшего общего предка. Если состояние используется только в одном компоненте - держи его там. Не поднимай состояние «на всякий случай» - это создаёт избыточные ререндеры.

```tsx
// Плохо: query поднят в App, хотя используется только в SearchBar
function App() {
  const [query, setQuery] = useState('');
  return (
    <>
      <Header />
      <SearchBar query={query} setQuery={setQuery} />
      <Content />
    </>
  );
}

// Хорошо: query живёт в SearchBar
function App() {
  return (
    <>
      <Header />
      <SearchBar />
      <Content />
    </>
  );
}
```

---

### 7. Context API и проблемы производительности

Context решает проблему «prop drilling» - передачи пропсов через множество промежуточных компонентов. Однако его главная проблема - производительность.

**Механика ререндеров:** Когда значение контекста изменяется, React рекурсивно перерендеривает **всех** потребителей этого контекста, независимо от того, изменилась ли та часть значения, которую они читают. `React.memo` на потребителе не помогает.

```tsx
const AppContext = createContext<{ theme: string; user: User | null }>(
  { theme: 'light', user: null }
);

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState<User | null>(null);

  // При изменении theme ВСЕ потребители перерендерятся,
  // даже те, что читают только user
  const value = { theme, user };
  return (
    <AppContext.Provider value={value}>
      <ThemeDisplay />  {/* ререндерится при изменении user - ненужно */}
      <UserAvatar />    {/* ререндерится при изменении theme - ненужно */}
    </AppContext.Provider>
  );
}
```

**Решения:**

1. **Разделение контекстов** - отдельный контекст для каждого независимого значения:

```tsx
const ThemeContext = createContext('light');
const UserContext = createContext<User | null>(null);
```

2. **Разделение чтения и записи** - один контекст для значения, другой для сеттера:

```tsx
const ThemeValueContext = createContext('light');
const ThemeDispatchContext = createContext<Dispatch<string>>(() => {});
```

3. **Селекторы через useMemo** - вычисление производного значения вне контекста.

> [!important]
> Context - не замена стейт-менеджеру. Он не оптимизирован для часто меняющихся значений. Для высокочастотных обновлений используйте специализированные библиотеки (Zustand, Jotai) или колокацию состояния.

---

### 8. Controlled vs Uncontrolled компоненты

**Controlled:** значение и его обновление контролируются React через state и onChange.

```tsx
function ControlledInput() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
  // React - единственный источник правды
}
```

**Uncontrolled:** DOM управляет состоянием, React читает его через ref при необходимости.

```tsx
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    console.log(inputRef.current?.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="initial" />
    </form>
  );
}
```

> [!important]
> Controlled компоненты дают полный контроль (валидация в реальном времени, форматирование, маски ввода), но вызывают ререндер на каждое нажатие клавиши. Uncontrolled подходят для форм, где достаточно прочитать значения при submit - меньше ререндеров, проще интеграция с нативными элементами (input type=file всегда uncontrolled).

---

### 9. Fiber архитектура

Fiber - это полная переработка ядра React (React 16), заменившая старый стековый reconciliation. Ключевая идея: reconciliation может быть прерван и возобновлён.

**Почему понадобился Fiber:**

Старый reconciler выполнял обход дерева рекурсивно и синхронно. Если дерево компонентов было большим, главный поток блокировался на длительное время, что приводило к пропуску кадров и «залипанию» интерфейса.

**Как работает Fiber:**

- Fiber-узел - это JavaScript-объект, представляющий единицу работы (unit of work). Каждый компонент имеет свой fiber-узел.
- Узлы образуют связный список (через `child`, `sibling`, `return`), а не рекурсивное дерево. Это позволяет обходить структуру итеративно.
- Reconciliation разбивается на фазы:
  - **Render phase** (прерываемая): Построение fiber-дерева, вычисление изменений. Может быть приостановлена для более приоритетной работы.
  - **Commit phase** (непрерываемая): Применение вычисленных изменений к DOM. Всегда синхронна.

```typescript
interface Fiber {
  tag: WorkTag;          // тип (FunctionComponent, ClassComponent, HostComponent...)
  type: any;             // div, span, MyComponent
  stateNode: any;        // DOM-узел или инстанс класса
  return: Fiber | null;  // родитель
  child: Fiber | null;   // первый потомок
  sibling: Fiber | null; // следующий сосед
  alternate: Fiber | null; // предыдущее состояние (double buffering)
  memoizedState: any;    // состояние (для хуков - связный список)
  pendingProps: any;
  memoizedProps: any;
}
```

> [!important]
> Fiber использует технику double buffering: в памяти всегда два fiber-дерева - current (отображаемое) и workInProgress (строящееся). После commit они меняются местами.

Приоритизация реализована через кооперативную многозадачность: React периодически проверяет `requestIdleCallback` (или полифил `Scheduler`) и уступает поток браузера, если прошло больше 5 мс.

---

### 10. Concurrent Features: useTransition, useDeferredValue, startTransition

Concurrent Mode - это не отдельный «режим», а набор возможностей React 18, позволяющих React прерывать рендеринг для обработки более срочных обновлений. Ключевой ментальный сдвиг: **рендеринг теперь прерываемый**.

> [!important]
> В Concurrent Mode React может начать рендеринг, приостановить его, отбросить частичный результат и переключиться на более приоритетное обновление - и всё это без видимых для пользователя артефактов.

**Основные concurrent features:**

- `startTransition` / `useTransition` - пометка обновлений как неприоритетных
- `useDeferredValue` - отложенное обновление значения
- Suspense с concurrent рендерингом
- Automatic batching - группировка обновлений состояния в один рендер

**Как работает под капотом:**

React использует lanes-модель для приоритизации. Каждое обновление получает lane (битовую маску приоритета). Обновления с высоким приоритетом (ввод пользователя) могут прервать низкоприоритетные (переходы между страницами).

**`useTransition`** - хук, возвращающий флаг `isPending` и функцию `startTransition`. Используется, когда **вы контролируете** обновление состояния.

```tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value); // Срочное обновление

    startTransition(() => {
      setSearchResults(filterData(e.target.value)); // Несрочное обновление
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results />
    </>
  );
}
```

**`useDeferredValue`** - хук, возвращающий отложенную версию значения. Используется, когда **вы не контролируете** обновление (значение приходит из пропсов).

```tsx
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => filterData(deferredQuery), [deferredQuery]);

  return (
    <div style={{ opacity: query !== deferredQuery ? 0.5 : 1 }}>
      {results.map(r => <ResultItem key={r.id} {...r} />)}
    </div>
  );
}
```

> [!important]
> Оба хука не уменьшают объём работы - они меняют её приоритет. Тяжёлый рендер будет выполнен в любом случае, но не заблокирует ввод пользователя.

**startTransition vs useTransition:**

- `startTransition` - standalone import, можно использовать вне компонентов
- `useTransition` - хук, возвращает `isPending` для индикации загрузки

---

### 11. React Router - routing, protected routes, lazy loading, loaders/actions

React Router - стандартная библиотека маршрутизации для React. Версия 6.4+ добавила loaders, actions и error boundaries на уровне маршрутов.

**Основы маршрутизации:**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Вложенные маршруты и Outlet:**

```tsx
function DashboardLayout() {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>
        <Outlet /> {/* Вложенные маршруты рендерятся здесь */}
      </main>
    </div>
  );
}

// Конфигурация
<Route element={<DashboardLayout />}>
  <Route index element={<Overview />} />
  <Route path="users" element={<Users />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

**Хуки навигации:**

```tsx
// useParams - получение параметров маршрута
function UserProfile() {
  const { id } = useParams();
  return <div>User ID: {id}</div>;
}

// useNavigate - программная навигация
function LoginForm() {
  const navigate = useNavigate();
  const handleSubmit = () => {
    // ... login logic
    navigate('/dashboard', { replace: true });
  };
  // ...
}

// useLocation - текущий location
function Breadcrumbs() {
  const location = useLocation();
  // location.pathname, location.search, location.state
}
```

**Защищённые маршруты:**

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <>{children}</>;
}

// Использование
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

**Lazy loading маршрутов:**

```tsx
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const UserProfile = lazy(() => import('./UserProfile'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/users/:id" element={<UserProfile />} />
      </Routes>
    </Suspense>
  );
}
```

**Loaders и Actions (React Router 6.4+):**

```tsx
import { createBrowserRouter, useLoaderData, useActionData } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/users/:id',
    loader: async ({ params }) => {
      const user = await fetchUser(params.id);
      if (!user) throw new Response('Not Found', { status: 404 });
      return { user };
    },
    action: async ({ request }) => {
      const formData = await request.formData();
      await updateUser(params.id, formData);
      return { success: true };
    },
    element: <UserPage />,
    errorElement: <ErrorPage />,
  },
]);

function UserPage() {
  const { user } = useLoaderData() as { user: User };
  return <div>{user.name}</div>;
}
```

> [!important]
> Loaders и actions переносят логику загрузки данных на уровень маршрутов, что уменьшает количество состояний загрузки в компонентах и упрощает обработку ошибок. React Router гарантирует, что данные загружены до рендера компонента.

**defer для streaming данных:**

```tsx
const router = createBrowserRouter([
  {
    path: '/dashboard',
    loader: async () => {
      return defer({
        criticalData: await fetchCritical(), // ждём
        slowData: fetchSlow(),               // Promise, не await
      });
    },
    element: <DashboardPage />,
  },
]);

function DashboardPage() {
  const { criticalData, slowData } = useLoaderData();
  return (
    <>
      <CriticalSection data={criticalData} />
      <Suspense fallback={<Spinner />}>
        <Await resolve={slowData}>
          {(data) => <SlowSection data={data} />}
        </Await>
      </Suspense>
    </>
  );
}
```

---

### 12. Higher-Order Components (HOC)

HOC - функция, принимающая компонент и возвращающая новый компонент с дополнительной функциональностью. До появления хуков это был основной паттерн переиспользования логики.

```tsx
function withAuth<P extends { user?: User }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: Omit<P, 'user'>) {
    const user = useContext(AuthContext);
    if (!user) return <Navigate to="/login" />;
    return <WrappedComponent {...(props as P)} user={user} />;
  };
}

const Dashboard = withAuth(function Dashboard({ user }: { user: User }) {
  return <div>Hello, {user.name}</div>;
});
```

> [!important]
> В эпоху хуков HOC используются редко. Основные проблемы HOC: оборачивание создаёт дополнительные слои в дереве (усложняет отладку), конфликты имён пропсов, статические методы теряются без копирования. Хуки решают те же задачи элегантнее.

HOC всё ещё применяются в определённых случаях: оборачивание для React.memo, интеграция со сторонними библиотеками, ожидающими HOC (react-redux `connect`, react-router `withRouter`), или когда нужно добавить поведение к компоненту без изменения его кода.

---

### 13. Render Props паттерн

Render props - паттерн, при котором компонент принимает функцию в качестве пропса, которая вызывается для рендеринга части UI. Функция получает данные от компонента и возвращает React-элемент.

```tsx
interface MousePosition {
  x: number;
  y: number;
}

function MouseTracker({ render }: { render: (pos: MousePosition) => React.ReactNode }) {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return <>{render(position)}</>;
}

// Использование
<MouseTracker render={({ x, y }) => (
  <div>Mouse is at {x}, {y}</div>
)} />

// Вариация: children как функция
<MouseTracker>
  {({ x, y }) => <div>Mouse is at {x}, {y}</div>}
</MouseTracker>
```

> [!info]
> До хуков render props конкурировали с HOC за звание основного паттерна переиспользования логики. Сегодня хуки заменили оба подхода в большинстве сценариев. Render props сохраняют ценность в случаях, где нужно разделить логику и представление между несколькими визуально разными потребителями.

---

### 14. Error Boundaries + Suspense + React.lazy + Code Splitting

**Error Boundary** - компонент класса, реализующий метод `componentDidCatch` или статический `getDerivedStateFromError`. Перехватывает ошибки в дочернем дереве при рендеринге, в методах жизненного цикла и конструкторах.

```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

> [!important]
> Error Boundaries не перехватывают ошибки в асинхронных колбэках (setTimeout, промисах без await), обработчиках событий и в самом Error Boundary. Для асинхронных ошибок нужно использовать try/catch внутри обработчиков.

**Suspense** - механизм декларативного ожидания асинхронных операций. Компонент выбрасывает Promise в процессе рендеринга, React перехватывает его и показывает fallback UI.

**Code Splitting** с React.lazy:

```tsx
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const UserProfile = lazy(() => import('./UserProfile'));

function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<Skeleton />}>
        {page === 'admin' ? <AdminDashboard /> : <UserProfile />}
      </Suspense>
    </ErrorBoundary>
  );
}
```

> [!info]
> `React.lazy` принимает функцию, возвращающую динамический import. Runtime Webpack/Vite распознаёт динамический import и выделяет его в отдельный чанк. Компонент-обёртка выбрасывает Promise при первой загрузке - Suspense перехватывает его.

**Гранулярность code splitting - стратегии:**

1. **На уровне маршрутов:** каждая страница - отдельный чанк
2. **На уровне фич:** тяжёлые компоненты (редакторы, графики) загружаются лениво
3. **По видимости:** компоненты ниже fold загружаются через IntersectionObserver + lazy

```tsx
function LazyBelowFold({ component: Component, ...props }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!shouldLoad) return <div ref={ref} />;
  return <Component {...props} />;
}
```

**Композиция Suspense и Error Boundary:**

```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<Skeleton />}>
    <UserProfile userId={id} />
  </Suspense>
</ErrorBoundary>
```

---

### 15. useRef + forwardRef + useImperativeHandle

**`useState`** вызывает ререндер при изменении. **`useRef`** хранит мутабельное значение без вызова ререндера.

`useRef` - это объект `{ current: value }`, мутирование которого не уведомляет React. Значение сохраняется между рендерами, но не участвует в потоке данных React.

**Когда useRef:**

- Доступ к DOM-элементам: `ref={inputRef}`
- Хранение предыдущего значения без ререндера
- ID таймеров/интервалов: `intervalRef.current = setInterval(...)`
- Флаги, не влияющие на UI: `isMountedRef.current = true`
- Сохранение значений для `useEffect` без их включения в зависимости

**forwardRef** позволяет компоненту получить ref от родителя и переслать его внутреннему DOM-элементу или обработать самостоятельно.

**useImperativeHandle** позволяет ограничить и кастомизировать то, что родитель может делать с ref.

```tsx
interface InputHandle {
  focus: () => void;
  select: () => void;
  clear: () => void;
}

const CustomInput = forwardRef<InputHandle, { label: string }>(
  function CustomInput({ label }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus() { inputRef.current?.focus(); },
      select() { inputRef.current?.select(); },
      clear() {
        if (inputRef.current) inputRef.current.value = '';
      },
    }), []);

    return (
      <label>
        {label}
        <input ref={inputRef} />
      </label>
    );
  }
);

// Использование
function Form() {
  const inputRef = useRef<InputHandle>(null);
  return (
    <>
      <CustomInput ref={inputRef} label="Email" />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
}
```

> [!important]
> Императивное API через ref нарушает декларативный поток данных React. Это escape hatch - используйте, только когда декларативный подход невозможен (управление фокусом, прокрутка, анимация, интеграция со сторонними библиотеками).

**Типичные сценарии refs для imperative API:**

```tsx
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function play() { videoRef.current?.play(); }
  function pause() { videoRef.current?.pause(); }
  function seekTo(time: number) {
    if (videoRef.current) videoRef.current.currentTime = time;
  }

  return (
    <div>
      <video ref={videoRef} src={src} />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  );
}

// Интеграция со сторонними библиотеками (D3, Three.js, Chart.js)
function Chart({ data }: { data: DataPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ChartInstance>();

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = new ChartJS(containerRef.current, { data });
    return () => chartRef.current?.destroy();
  }, [data]);

  return <div ref={containerRef} />;
}
```

---

### 16. useLayoutEffect vs useEffect

Оба выполняют эффекты, но в разное время жизненного цикла:

- **`useEffect`** - после отрисовки и commit-фазы. Не блокирует браузер, не задерживает paint.
- **`useLayoutEffect`** - после commit-фазы, но **до** того, как браузер отрисует изменения. Блокирует paint.

```
Рендер → commit (React обновляет DOM) → useLayoutEffect → браузер рисует → useEffect
```

```tsx
function Tooltip({ targetRef }: { targetRef: React.RefObject<HTMLElement> }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!targetRef.current || !tooltipRef.current) return;
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPosition({
      x: targetRect.left,
      y: targetRect.bottom + 8
    });
  }, [targetRef]);

  return <div ref={tooltipRef} style={{ position: 'fixed', left: position.x, top: position.y }} />;
}
```

> [!important]
> В 95% случаев нужен `useEffect`. `useLayoutEffect` используйте только когда вы читаете/пишете DOM и результат должен быть применён синхронно до paint (измерения размеров, позиционирование, предотвращение мерцания). На сервере `useLayoutEffect` не выполняется и выдаст предупреждение - используйте `useEffect` или `useSyncExternalStore`.

---

### 17. Custom hooks patterns

Кастомные хуки - основной механизм переиспользования логики в React. Правильно спроектированные хуки следуют нескольким принципам:

**Принцип «одна ответственность»:** Хук должен решать одну задачу.

```tsx
// Плохо: смешаны загрузка данных и работа с формой
function useUserDashboard(userId: string) { /* ... */ }

// Хорошо: разделённые хуки
function useUser(userId: string) { /* загрузка и кеширование */ }
function useUserForm(initialData: User) { /* логика формы */ }
function useUserPermissions(userId: string) { /* проверка прав */ }
```

**Паттерн «controlled props»:** Хук принимает параметры и возвращает пропсы для UI.

```tsx
function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(items.length / pageSize);
  const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);

  return {
    items: pageItems,
    page,
    totalPages,
    next: () => setPage(p => Math.min(p + 1, totalPages - 1)),
    prev: () => setPage(p => Math.max(p - 1, 0)),
    goTo: (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1))),
    hasNext: page < totalPages - 1,
    hasPrev: page > 0,
  };
}
```

> [!info]
> Кастомный хук - это композиция примитивных хуков. Хук, не использующий другие хуки внутри - это просто обычная функция, не получающая преимуществ React (сохранение состояния, подписка на контекст и т.д.).

---

### 18. JSX - transpilation, Babel, React.createElement, React 17 JSX transform

JSX - синтаксический сахар для `React.createElement`. Браузеры не понимают JSX напрямую - он должен быть транслирован в обычный JavaScript.

**Транспиляция:**

```tsx
// JSX
const element = <div className="greeting">Hello, {name}!</div>;

// После Babel/TypeScript транпиляции
const element = React.createElement(
  'div',
  { className: 'greeting' },
  'Hello, ',
  name,
  '!'
);
```

**React 17 Automatic JSX Transform:**

До React 17 каждый файл с JSX требовал `import React from 'react'`, потому что `React.createElement` вызывался явно. В React 17 появился автоматический JSX transform:

```tsx
// React 17+: не нужен import React
import { jsx as _jsx } from 'react/jsx-runtime';

const element = _jsx('div', {
  className: 'greeting',
  children: ['Hello, ', name, '!']
});
```

Новый импорт идёт из `react/jsx-runtime` (production) или `react/jsx-dev-runtime` (development). Это позволяет использовать JSX без импорта React и даёт лучшую оптимизацию бандла.

**Почему компоненты должны начинаться с заглавной буквы:**

```tsx
// Заглавная буква - React воспринимает как компонент
<MyComponent /> // React.createElement(MyComponent, ...)

// Строчная буква - React воспринимает как HTML-элемент
<div /> // React.createElement('div', ...)
```

Если написать `<myComponent />`, React будет искать HTML-тег `myComponent`, которого не существует.

**Выражения vs инструкции в JSX:**

JSX поддерживает JavaScript выражения (expression) внутри `{}`, но не инструкции (statement):

```tsx
// OK - выражения
<div>{count + 1}</div>
<div>{isLoggedIn ? 'Welcome' : 'Login'}</div>
<div>{users.map(u => <User key={u.id} {...u} />)}</div>

// Ошибка - инструкции (if, for, switch)
<div>{if (isLoggedIn) return 'Welcome'}</div> // SyntaxError
```

**Children prop:**

JSX автоматически передаёт вложенные элементы через prop `children`:

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

// Эквивалентно:
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>

// React.createElement(Card, null,
//   React.createElement('h2', null, 'Title'),
//   React.createElement('p', null, 'Content')
// )
```

**Spread props:**

```tsx
const props = { className: 'btn', disabled: true, onClick: handleClick };
return <button {...props}>Click</button>;
// Эквивалентно: React.createElement('button', props, 'Click')
```

---

### 19. Композиция компонентов vs наследование

В React наследование компонентов - антипаттерн. Композиция - основной механизм переиспользования.

**Композиция через `children`:**

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </Card>
  );
}
```

**Композиция через пропсы-слоты:**

```tsx
function Layout({
  header,
  sidebar,
  children,
}: {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}
```

> [!info]
> Паттерн «слоты» мощнее наследования, потому что позволяет передавать не просто данные, а целые компоненты. Родитель не знает о внутреннем устройстве детей - он лишь предоставляет «места» для вставки.

React никогда не рекомендовал наследование компонентов. Даже в эпоху классовых компонентов документация советовала композицию. Причина: наследование создаёт жёсткую связь между родителем и потомком, тогда как композиция через children/slots даёт гибкость и тестируемость.

---

### 20. Compound Components паттерн

Паттерн, при котором несколько компонентов работают вместе, разделяя неявное состояние. Родитель предоставляет контекст, а дочерние компоненты потребляют его.

```tsx
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.TabList = function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>;
};

Tabs.Tab = function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab must be used inside Tabs');
  return (
    <button
      role="tab"
      aria-selected={ctx.activeTab === id}
      onClick={() => ctx.setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.TabPanel = function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabPanel must be used inside Tabs');
  if (ctx.activeTab !== id) return null;
  return <div role="tabpanel">{children}</div>;
};

// Использование
<Tabs defaultTab="tab1">
  <Tabs.TabList>
    <Tabs.Tab id="tab1">First</Tabs.Tab>
    <Tabs.Tab id="tab2">Second</Tabs.Tab>
  </Tabs.TabList>
  <Tabs.TabPanel id="tab1">Content 1</Tabs.TabPanel>
  <Tabs.TabPanel id="tab2">Content 2</Tabs.TabPanel>
</Tabs>
```

> [!important]
> Преимущества: гибкость (пользователь сам собирает структуру), неявное разделение состояния без prop drilling, читаемый API. Паттерн используется в популярных библиотеках: Radix UI, Reach UI, Headless UI.

---

### 21. Portals

Portals позволяют рендерить дочерние элементы в DOM-узел, находящийся вне иерархии родительского компонента. При этом события всплывают через React-дерево (не DOM-дерево).

```tsx
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, children }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

> [!info]
> Ключевые use-cases: модальные окна, тултипы, дропдауны, тосты/нотификации. Любой UI, который визуально должен «вырываться» из родительского контейнера (overflow: hidden, z-index stacking context).

Почему события всплывают через React-дерево, а не DOM-дерево: React использует синтетическую систему событий. Когда вы кликаете на элемент в портале, событие всплывает по DOM до document.body, затем React ищет ближайший fiber-узел и передаёт событие вверх по fiber-дереву. Это значит, что родительский компонент может обработать событие дочернего компонента из портала.

---

### 22. Synthetic Events

React оборачивает нативные DOM-события в объекты `SyntheticEvent` для кросс-браузерной совместимости и оптимизации.

**Ключевые особенности:**

- **Пул событий (до React 17):** Объекты SyntheticEvent переиспользовались (event pooling). После React 17 пул отменён - события ведут себя как нативные.
- **Делегирование:** React вешает по одному обработчику каждого типа событий на корневой элемент (#root), а не на каждый DOM-узел. Когда событие всплывает до корня, React определяет, какой компонент должен его получить.
- **Свойства:** `e.target`, `e.currentTarget`, `e.preventDefault()`, `e.stopPropagation()` работают как ожидается.

```tsx
function Form() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // ...
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

> [!important]
> `e.stopPropagation()` в React останавливает всплытие по React-дереву и DOM-дереву (до React 17 - только по React-дереву). `e.nativeEvent.stopPropagation()` останавливает только нативное всплытие. В порталах событие всплывает по React-дереву родителя, даже если DOM-иерархия другая.

SyntheticEvent не полностью идентичен нативному. Например, `e.persist()` (устарел), асинхронный доступ к событию до React 17 требовал вызова `e.persist()`. С React 17 можно обращаться асинхронно без дополнительных действий.

---

### 23. Automatic Batching в React 18

Automatic Batching - группировка нескольких вызовов `setState` в один ререндер, даже если они происходят вне обработчиков React.

**До React 18:** Батчинг работал только внутри синтетических обработчиков событий React. В `setTimeout`, промисах, нативных обработчиках каждый `setState` вызывал отдельный ререндер.

**В React 18:** Батчинг работает везде.

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    fetch('/api').then(() => {
      // React 17: два рендера
      // React 18: один рендер (автоматический батчинг)
      setCount(c => c + 1);
      setFlag(f => !f);
    });
  }

  return <button onClick={handleClick}>{count} {String(flag)}</button>;
}
```

**Как отключить батчинг (escape hatch):**

```tsx
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCount(c => c + 1); // ререндер немедленно
  });
  flushSync(() => {
    setFlag(f => !f); // ещё один ререндер
  });
}
```

> [!important]
> `flushSync` форсирует синхронный ререндер, что может ухудшить производительность. Используйте его осознанно: например, когда нужно прочитать DOM сразу после обновления состояния (скролл в конец списка после добавления элемента).

Функциональные обновления (`setCount(c => c + 1)`) безопаснее в батчах, чем прямые (`setCount(count + 1)`), потому что они всегда получают актуальное состояние, даже если несколько обновлений в одном батче.

---

### 24. Strict Mode

`<React.StrictMode>` - обёртка, активирующая дополнительные проверки только в development-режиме. Не влияет на production-сборку.

**Что Strict Mode делает дважды (в development):**

1. **Тело функции компонента** (функции-компоненты и render классовых)
2. **Функции-обновления state** (`setCount(prev => prev + 1)`)
3. **Инициализаторы useState/useReducer**
4. **Функции эффектов** (useEffect, useLayoutEffect, useInsertionEffect) - монтирование, размонтирование, повторное монтирование

> [!important]
> Двойной вызов выявляет проблемы с чистыми функциями: побочные эффекты в теле компонента, мутации, неочищаемые подписки. Если компонент ломается при двойном вызове, он написан с нарушением правил React.

```tsx
// Плохо: побочный эффект в теле компонента
function BadComponent() {
  fetch('/api'); // вызовится дважды в Strict Mode
  return <div />;
}

// Хорошо: чистый рендер
function GoodComponent() {
  const data = useFetch('/api'); // побочный эффект в хуке
  return <div>{data}</div>;
}
```

**Почему это важно:** Concurrent Mode может в любой момент прервать рендеринг и начать заново. Тело компонента может быть вызвано несколько раз даже в production (при прерывании рендера). Strict Mode симулирует это поведение в development, чтобы выявить нечистые компоненты.

---

### 25. React Server Components (RSC)

React Server Components - это компоненты, которые выполняются только на сервере, никогда не гидратируются на клиенте и не включаются в клиентский бандл. Это принципиально иная модель, нежели SSR.

**Ключевые отличия RSC от SSR:**

| Характеристика | SSR | RSC |
|---|---|---|
| Где выполняется | Сервер (первый рендер) + Клиент (гидратация) | Только сервер |
| Размер бандла | Код компонента включён в бандл | Код не попадает в бандл |
| Доступ к БД | Только через API | Прямой доступ |
| Состояние | Есть (useState, useEffect) | Нет состояния и эффектов |
| Перерендер | Клиентский | Не перерендериваются |

```tsx
// Server Component - выполняется на сервере, доступ к БД напрямую
async function UserList() {
  const users = await db.user.findMany(); // Прямой запрос к БД
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Client Component - исполняется на клиенте
'use client';
function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? '❤' : '♡'}</button>;
}
```

> [!important]
> RSC не могут содержать хуки состояния, эффектов или обработчики событий. Они сериализуются в специальный формат (React Flight), который передаётся клиенту в виде потока, а не HTML.

Архитектурный сдвиг: в RSC-модели серверный компонент - это «точка входа» данных, а клиентские компоненты - «островки интерактивности». Это позволяет серверным компонентам выполнять прямые запросы к БД и файловой системе, устраняя слой API для получения данных.

---

### 26. React DevTools + Profiler API

React DevTools - браузерное расширение для отладки React-приложений. Содержит несколько вкладок для инспекции компонентов, профилирования производительности и отладки хуков.

**Components Tree:**

Вкладка Components показывает дерево компонентов в реальном времени. Для каждого компонента можно увидеть:

- Пропсы (props)
- Состояние (state)
- Хуки (hooks) - включая кастомные
- Контекст (context)

```tsx
// useDebugValue для кастомных хуков
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useDebugValue(isOnline ? 'Online' : 'Offline');

  return isOnline;
}
```

**Profiler - измерение производительности:**

`<Profiler>` - компонент для измерения производительности рендеринга.

```tsx
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
) {
  if (actualDuration > 16) {
    console.warn(`${id} took ${actualDuration}ms in ${phase}`);
  }
}

function App() {
  return (
    <Profiler id="Navigation" onRender={onRenderCallback}>
      <Navigation />
    </Profiler>
  );
}
```

> [!important]
> Profiler добавляет небольшие накладные расходы. Не оборачивайте каждый компонент - группируйте логически связанные части (страница, фича). `actualDuration` включает время всех потомков, включая те, что были мемоизированы и не рендерились.

**Flamegraph vs Ranked view:**

- **Flamegraph** - визуализация дерева компонентов, где ширина бара соответствует времени рендера. Позволяет быстро найти «широкие» (медленные) компоненты.
- **Ranked view** - список компонентов, отсортированный по времени рендера. Удобно для быстрого определения самых медленных компонентов.

**Commit selector:** Profiler записывает каждый commit. Можно переключаться между commits и сравнивать производительность.

**Why-did-you-render паттерн:**

```tsx
// React.memo с кастомным компаратором для отладки
const DebugComponent = React.memo(Component, (prev, next) => {
  const changed = Object.keys(prev).filter(
    key => prev[key] !== next[key]
  );
  if (changed.length > 0) {
    console.log('Props changed:', changed);
  }
  return false; // всегда ререндерим для отладки
});
```

**React.memo highlighting:** DevTools может подсветить компоненты, которые ререндерятся, с зелёной (memo предотвратил) или красной (не предотвратил) рамкой.

**Стратегия профилирования:**

1. Обернуть корневой компонент - получить общую картину
2. Обернуть подозрительные поддеревья - сузить проблему
3. Сравнить `actualDuration` с `baseDuration` - если `baseDuration` сильно меньше, значит мемоизация неэффективна

---

### 27. Rendering behavior + batch updates

React ререндерит компонент в трёх случаях:

1. **Изменение состояния** (useState, useReducer dispatch)
2. **Изменение пропсов** (от родителя)
3. **Изменение контекста**, на который компонент подписан

> [!important]
> Распространённое заблуждение: «React ререндерит компонент, только если изменились пропсы». На самом деле, когда родитель ререндерится, все его дети ререндерятся по умолчанию, даже с теми же пропсами. `React.memo` предотвращает это поведение.

**Цепочка ререндеров:**

```
App (setState)
  └─ Header (ререндерится, пропсы те же)
       └─ Logo (ререндерится)
  └─ Content (ререндерится, пропсы те же)
       └─ UserList (ререндерится)
            └─ UserCard (ререндерится) × 1000
```

Если `App.setState` вызывается, ререндер каскадом проходит всех потомков, если они не обёрнуты в `React.memo` или не используют технику подъёма состояния с детьми как пропсами.

**Техника оптимизации - children как пропс:**

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveChild>
        <StaticContent /> {/* StaticContent создан в другом компоненте - не ререндерится */}
      </ExpensiveChild>
    </div>
  );
}
```

**Batch updates в React 18:**

Все обновления состояния группируются независимо от контекста вызова. До React 18 батчинг работал только в синтетических обработчиках событий.

```tsx
function handleAsyncClick() {
  // React 17: два рендера. React 18: один рендер
  setTimeout(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
  }, 100);
}

// Отключение батчинга
import { flushSync } from 'react-dom';
flushSync(() => setCount(c => c + 1)); // ререндер немедленно
```

---

### 28. Hydration

Hydration - процесс, при котором React «оживляет» серверный HTML на клиенте: прикрепляет обработчики событий, восстанавливает состояние, связывает DOM с fiber-деревом.

```tsx
import { hydrateRoot } from 'react-dom/client';

const root = hydrateRoot(
  document.getElementById('root')!,
  <App />
);
```

**Требования к успешной гидратации:**

- Клиентский рендер должен произвести точно такой же HTML, что и серверный (hydration mismatch → ошибка)
- Все компоненты, рендерящиеся на сервере, должны рендериться и на клиенте
- Состояние должно быть восстанавливаемо (через встроенные script-теги с данными)

> [!important]
> **Hydration mismatch** возникает, когда HTML на сервере и клиенте различается. Причины: использование `typeof window`, `Math.random()`, `Date.now()`, `localStorage` без проверок. Решения: `useId` для ID, проверки `typeof window !== 'undefined'`, перенос клиентского кода в `useEffect`.

**Selective Hydration (React 18):** Каждый `Suspense`-обёрнутый фрагмент гидратируется независимо. React приоритизирует гидратацию компонента, с которым пользователь взаимодействует (кликнул). Это значит, что клик по кнопке в `Suspense`-блоке заставит React немедленно гидратировать этот блок, даже если другие ещё не готовы.

---

### 29. Streaming SSR

Streaming SSR (в React 18) позволяет отправлять HTML клиенту по мере его готовности, не дожидаясь полного рендера на сервере.

**Ключевые методы (react-dom/server):**

- `renderToPipeableStream` - для Node.js стримов
- `renderToReadableStream` - для Web Streams (edge runtimes: Cloudflare Workers, Deno)

```tsx
// Сервер (Node.js)
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady() {
      res.setHeader('Content-Type', 'text/html');
      pipe(res);
    },
    onShellError(err) {
      res.status(500).send('Server Error');
    },
    onError(err) {
      console.error(err);
    },
  });
});
```

**Как это работает с Suspense:**

```tsx
function App() {
  return (
    <html>
      <body>
        <Header /> {/* Рендерится сразу - попадает в shell */}
        <Suspense fallback={<Skeleton />}>
          <SlowContent /> {/* Стримится позже, когда данные готовы */}
        </Suspense>
      </body>
    </html>
  );
}
```

В HTML внедряются специальные маркеры, которые браузер распознаёт и заменяет на реальный контент по мере получения (out-of-order streaming). React гидратирует каждый Suspense-блок независимо.

> [!important]
> Streaming SSR + Selective Hydration позволяют пользователю видеть и взаимодействовать с частями страницы до полной загрузки. Suspense-обёрнутые блоки гидратируются независимо - клик на уже загруженный блок не ждёт гидратации остальных.

---

### 30. useSyncExternalStore

`useSyncExternalStore` - хук для подписки на внешнее хранилище с поддержкой concurrent rendering. Заменяет `useEffect` + `useState` для внешних сторов, предотвращая tearing.

```tsx
import { useSyncExternalStore } from 'react';

function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true, // getServerSnapshot
  );
}
```

> [!important]
> `useSyncExternalStore` решает проблему **tearing** - ситуации, когда разные компоненты читают разное состояние внешнего стора в ходе concurrent rendering. Хук заставляет React синхронно перечитывать значение в определённые моменты, гарантируя консистентность.

**Почему не `useEffect` + `useState`:** В concurrent mode рендер может быть прерван и возобновлён. Если внешний стор изменится между прерыванием и возобновлением, разные компоненты могут увидеть разное состояние. `useSyncExternalStore` использует `getSnapshot` синхронно в процессе рендера, гарантируя, что все компоненты видят одно и то же значение в рамках одного commit.

---

### 31. useInsertionEffect

`useInsertionEffect` - хук, выполняющийся до мутаций DOM (до useLayoutEffect). Специально создан для CSS-in-JS библиотек, которым нужно вставить стили до того, как браузер начнёт вычислять макет.

```
Рендер → useInsertionEffect (вставка стилей) → мутации DOM → useLayoutEffect → paint → useEffect
```

```tsx
function useCSS(rule: string) {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.appendChild(style);
    return () => style.remove();
  }, [rule]);
}
```

> [!important]
> `useInsertionEffect` не имеет доступа к refs (DOM ещё не обновлён) и не может планировать обновления состояния. Это специальный инструмент для авторов CSS-in-JS библиотек, не для повседневной разработки. В обычном коде используйте `useEffect` или `useLayoutEffect`.

---

### 32. Tearing в concurrent rendering

Tearing (разрыв) - ситуация, когда в concurrent rendering разные части UI видят разные состояния одного и того же источника данных, что приводит к визуальным несоответствиям.

**Пример проблемы:**

```tsx
function ComponentA() {
  const count = store.getCount(); // 5
  return <div>{count}</div>;
}

function ComponentB() {
  const count = store.getCount(); // 6 - стор обновился между рендером A и B
  return <div>{count}</div>;
}
// Визуально: A показывает 5, B показывает 6 - tearing!
```

**Как React предотвращает tearing:**

1. **Встроенный useState:** React контролирует момент чтения состояния и гарантирует консистентность в рамках одного commit
2. **useSyncExternalStore:** для внешних сторов - синхронное чтение во время рендера
3. **Concurrent features:** `useTransition` и `useDeferredValue` допускают «отставание» значений, но делают это явно и контролируемо

> [!important]
> Tearing - это не баг, а компромисс concurrent rendering. React жертвует мгновенной консистентностью ради responsiveness (отзывчивости). Без concurrent mode tearing невозможен, потому что рендер всегда синхронный. С concurrent mode tearing предотвращается через useSyncExternalStore и явные transitions.

---

### 33. useId хук

`useId` генерирует уникальный стабильный ID, подходящий для атрибутов accessibility (aria-labelledby, htmlFor-id) и не чувствительный к hydration mismatches.

```tsx
function EmailField() {
  const id = useId();

  return (
    <>
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" aria-describedby={`${id}-error`} />
      <span id={`${id}-error`}>Invalid email</span>
    </>
  );
}
```

> [!important]
> `useId` гарантирует стабильность между серверным и клиентским рендером (server-side rendering), в отличие от `Math.random()` или счётчиков, которые дают разные значения на сервере и клиенте, вызывая hydration mismatch.

**Внутренняя механика:** ID строится на основе позиции компонента в fiber-дереве (префикс + путь в дереве). React использует технику «Fizz» для SSR - одинаковый алгоритм генерации на сервере и клиенте. Поэтому ID одинаковы при гидратации.

`useId` не должен использоваться для ключей в списках - ключи должны быть основаны на данных, а не на позиции в дереве.

---

### 34. useDebugValue

`useDebugValue` добавляет метку к кастомному хуку в React DevTools. Полезно для отладки сложных хуков в production-сборке (где DevTools всё ещё работают).

```tsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useDebugValue(isOnline ? 'Online' : 'Offline');

  return isOnline;
}
```

**Оптимизация с форматированием:** Второй аргумент - функция форматирования, которая вызывается только при открытии DevTools (ленивое вычисление):

```tsx
useDebugValue(user, (u: User) => `User: ${u.name} (${u.role})`);
// Функция форматирования не вызывается, пока DevTools не открыт
```

> [!info]
> `useDebugValue` не влияет на production-рендеринг. Это чисто диагностический инструмент. Используйте его в библиотечных хуках для улучшения developer experience - конечным пользователям он не виден.

---

### 35. Иммутабельность в React

Иммутабельность - ключевой принцип React. React сравнивает состояние по ссылке (===), а не по значению. Если вы мутируете объект/массив, React не обнаружит изменения и не перерендерит компонент.

```tsx
// Плохо: мутация существующего объекта
function addItem(items: Item[], newItem: Item) {
  items.push(newItem); // мутация - ссылка та же, React не заметит
  setItems(items);     // ререндера не будет
}

// Хорошо: новый объект/массив
function addItem(items: Item[], newItem: Item) {
  setItems([...items, newItem]); // новая ссылка - React обнаружит
}

// Хорошо: иммутабельное обновление вложенного объекта
function updateUser(user: User, name: string) {
  setUser({ ...user, profile: { ...user.profile, name } });
}
```

> [!info]
> Почему React выбрал сравнение по ссылке: это быстро (O(1)), позволяет использовать PureComponent/React.memo без глубокого сравнения (O(n)), и поощряет иммутабельный стиль программирования, который снижает вероятность багов в concurrent rendering.

**Immer для глубоких обновлений:**

```tsx
import { produce } from 'immer';

const [state, setState] = useState({ users: [], settings: { theme: 'light' } });

function updateTheme(theme: 'light' | 'dark') {
  setState(produce(draft => {
    draft.settings.theme = theme; // «мутация» внутри produce - безопасно
  }));
}
```

---

### 36. Derived state vs useEffect

Derived state - значение, вычисляемое из пропсов или существующего состояния во время рендера. Частая ошибка - копирование пропсов в состояние через `useEffect`.

```tsx
// Плохо: derived state через useEffect
function UserProfile({ user }: { user: User }) {
  const [name, setName] = useState(user.name);

  useEffect(() => {
    setName(user.name);
  }, [user]); // дополнительный ререндер, избыточно
}

// Хорошо: derived value во время рендера
function UserProfile({ user }: { user: User }) {
  const displayName = user.name || 'Anonymous';
  // или: const displayName = useMemo(() => expensiveTransform(user), [user]);
}
```

> [!important]
> Правило: если значение можно вычислить во время рендера - вычислите его во время рендера. Не синхронизируйте пропсы с состоянием через useEffect. Это создаёт лишний ререндер (первый с устаревшим состоянием, второй с useEffect) и усложняет поток данных.

**Исключения - когда синхронизация оправдана:**

- Пропсы - начальное значение (initial value pattern), дальнейшие изменения не синхронизируются
- Сложное состояние, которое нельзя вычислить синхронно (требуется асинхронная валидация)
- Миграция с классовых компонентов, где `getDerivedStateFromProps` действительно был нужен

---

### 37. Data fetching: SWR, React Query vs useEffect

**Проблема useEffect для загрузки данных:**

```tsx
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  // Проблемы: нет кеширования, нет refetch, race conditions, waterfall requests
}
```

**React Query (TanStack Query) решает:**

```tsx
function UserList() {
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} onRetry={refetch} />;
  return <ul>{users?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**SWR vs React Query:**

| | SWR | React Query |
|---|---|---|
| Основной механизм | Stale-while-revalidate | Stale-while-revalidate |
| Размер бандла | ~5KB | ~12KB |
| DevTools | Нет (сторонние) | Встроенные |
| Window focus refetch | Да | Да |
| Mutation management | Базовый | Продвинутый (optimistic updates, retry) |

> [!important]
> `useEffect` для загрузки данных - это путь к состояниям гонки, дублирующимся запросам и отсутствию кеширования. React Query/SWR предоставляют декларативное управление кешем, автоматический refetch, дедупликацию запросов и обработку race conditions.

---

### 38. useDeferredValue паттерны

`useDeferredValue` - хук для отложенного обновления значения, которое React обрабатывает с низким приоритетом.

**Паттерн 1: Отложенный поиск/фильтрация**

```tsx
function SearchableList({ query, items }: { query: string; items: Item[] }) {
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(deferredQuery)),
    [items, deferredQuery]
  );

  return (
    <List
      items={filtered}
      isStale={query !== deferredQuery}
    />
  );
}
```

**Паттерн 2: Тяжёлый рендер с визуальной индикацией**

```tsx
function HeavyDashboard({ timeframe }: { timeframe: '1d' | '1w' | '1m' }) {
  const deferredTimeframe = useDeferredValue(timeframe);

  return (
    <div style={{ opacity: timeframe !== deferredTimeframe ? 0.5 : 1, transition: 'opacity 150ms' }}>
      <Charts timeframe={deferredTimeframe} />
      <Tables timeframe={deferredTimeframe} />
    </div>
  );
}
```

> [!important]
> `useDeferredValue` не ускоряет тяжёлый рендер - он делает его прерываемым. Если рендер занимает 2 секунды, он всё ещё займёт 2 секунды, но не заблокирует UI. Комбинируйте с `useMemo` и `React.memo`, чтобы старые данные не вызывали перерендеры.

---

### 39. Suspense for Data Fetching

Suspense изначально создан для code splitting, но в React 18 расширен на асинхронную загрузку данных.

**Механика:** Компонент выбрасывает Promise во время рендера. React перехватывает его, ищет ближайший Suspense и показывает fallback. Когда Promise разрешается, React повторно рендерит компонент.

```tsx
// React Query с Suspense
const { data } = useSuspenseQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
});
// useSuspenseQuery выбрасывает Promise, если данные не готовы
// Ближайший Suspense показывает fallback
```

> [!important]
> React 18 Suspense for Data Fetching официально не рекомендован для прямого использования без фреймворка. Механика «выброса Promise» технически реализована, но API помечен как «для фреймворков». React 19 стабилизирует этот паттерн. Пока используйте React Query/SWR с их встроенной поддержкой Suspense.

---

### 40. CSS-in-JS и React 18 проблемы

CSS-in-JS библиотеки (styled-components, Emotion) имеют проблемы совместимости с Concurrent Features в React 18 из-за времени вставки стилей.

**Корень проблемы:** В concurrent rendering React может прервать и отбросить рендер. Если библиотека вставила стили во время рендера, то при отбрасывании рендера стили удалить невозможно - они просочились в DOM.

```tsx
// Проблема: styled-components вставляет стили в процессе рендера
const Button = styled.button`
  color: ${props => props.primary ? 'blue' : 'gray'};
`;
// Если concurrent rendering отбросит рендер с primary=true,
// стили 'color: blue' останутся в DOM навсегда
```

**Решение - useInsertionEffect:**

```tsx
function useStyled(rule: string) {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.appendChild(style);
    return () => style.remove();
  }, [rule]);
}
```

> [!important]
> В React 18 CSS-in-JS библиотеки требуют обновления для поддержки concurrent rendering. Старые версии могут вызывать утечки стилей или некорректное отображение. Рассмотрите альтернативы: CSS Modules, Tailwind, Vanilla Extract (zero-runtime CSS-in-JS), Panda CSS. Эти решения генерируют CSS на этапе сборки, избегая проблем concurrent rendering полностью.

---

### 41. React Compiler (Forget)

React Compiler (ранее React Forget) - это компилятор, автоматически мемоизирующий компоненты и хуки. Цель - избавиться от ручного `useMemo`, `useCallback`, `React.memo`.

**Как работает:**

Компилятор анализирует код на этапе сборки и определяет, какие значения можно безопасно мемоизировать, следуя правилам React:

- Если значение вычисляется и не зависит от изменяющихся данных - его можно мемоизировать
- Если функция передаётся как пропс дочернему компоненту - её ссылка стабилизируется
- Компилятор отслеживает нарушения правил (побочные эффекты в рендере) и предупреждает

```tsx
// До компиляции (разработчик пишет)
function UserList({ users, sortOrder }: Props) {
  const sorted = users.sort(byName);           // ошибка: мутация!
  const displayName = `${user.first} ${user.last}`;
  const handleClick = () => doSomething(user.id);

  return (
    <div>
      {sorted.map(u =>
        <UserCard key={u.id} onClick={handleClick} name={displayName} />
      )}
    </div>
  );
}

// После компиляции (автоматически)
function UserList({ users, sortOrder }: Props) {
  // Компилятор: предупреждение о мутации users.sort()
  const sorted = useMemo(() => [...users].sort(byName), [users, sortOrder]);
  const displayName = useMemo(() => `${user.first} ${user.last}`, [user]);
  const handleClick = useCallback(() => doSomething(user.id), [user.id]);
  // ...
}
```

> [!important]
> React Compiler не изменяет поведение приложения - он добавляет оптимизации, которые разработчик мог бы добавить вручную. Компилятор не добавляет мемоизацию туда, где она нарушила бы логику. Он использует анализ потока данных для определения стабильности значений.

---

### 42. Signals vs useState

Signals - альтернативная модель реактивности, используемая в Solid.js, Preact, Qwik, Svelte. В отличие от React, где перерендеривается весь компонент, Signals обновляют только конкретные DOM-узлы.

**Принципиальная разница:**

| | React (useState) | Signals (Solid.js) |
|---|---|---|
| Гранулярность | Компонент | DOM-узел |
| Как работает | setState → ререндер компонента → сравнение VDOM → обновление DOM | signal.set() → немедленное обновление DOM-узла |
| VDOM | Да | Нет |
| Ререндер | Всего компонента | Только изменившегося узла |

```tsx
// Solid.js - signals
import { createSignal } from 'solid-js';

function Counter() {
  const [count, setCount] = createSignal(0);
  // При setCount(1) обновляется ТОЛЬКО текстовый узел {count()},
  // остальной JSX не перезапускается
  return <button onClick={() => setCount(c => c + 1)}>Count: {count()}</button>;
}
```

> [!info]
> React не использует Signals как основную модель, потому что VDOM даёт предсказуемость и единообразие. Signals быстрее для обновлений, но требуют более сложного компилятора. React развивает React Compiler для получения преимуществ компиляции без отказа от VDOM.

**Preact Signals в React:** Существует пакет `@preact/signals-react`, позволяющий использовать Signals в React, получая точечные обновления минуя VDOM. Но это создаёт разрыв в ментальной модели: часть состояния в Signals, часть в useState - два источника правды.

---

### 43. useEffect cleanup deep dive

**Race conditions и AbortController:**

Race condition в useEffect - классическая проблема: быстрый запрос и медленный запрос, результат медленного приходит позже и перезаписывает актуальный результат быстрого.

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setUser(data);
      });

    return () => { cancelled = true; };
  }, [userId]);

  // Проблема: запрос не отменяется - он просто игнорирует результат.
  // Лишняя нагрузка на сервер и сеть.
}
```

**AbortController - правильное решение:**

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });

    return () => controller.abort();
  }, [userId]);
}
```

> [!important]
> Флаг `cancelled` предотвращает `setState` на размонтированном компоненте, но не отменяет сетевой запрос. AbortController реально прерывает fetch на уровне браузера, экономя трафик и ресурсы сервера. Аналогичный подход применим для подписок (EventSource, WebSocket), таймеров и любых асинхронных операций.

**Паттерн с AbortSignal для кастомных хуков:**

```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
      .then(data => setData(data))
      .catch(err => { if (err.name !== 'AbortError') setError(err); });

    return () => controller.abort();
  }, [url]);

  return { data, error };
}
```

---

### 44. Тестирование React (RTL, hooks testing)

**React Testing Library (RTL):** Фокусируется на тестировании с точки зрения пользователя - что пользователь видит и делает, а не детали реализации.

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('login form submits and shows success', async () => {
  render(<LoginForm />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /sign in/i });

  await userEvent.type(emailInput, 'user@test.com');
  await userEvent.type(passwordInput, 'password123');
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

**Тестирование кастомных хуков:**

```tsx
import { renderHook, act } from '@testing-library/react';

function useCounter(initial: number = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, increment, decrement, reset };
}

test('useCounter increments and resets', () => {
  const { result } = renderHook(() => useCounter(5));

  expect(result.current.count).toBe(5);

  act(() => result.current.increment());
  expect(result.current.count).toBe(6);

  act(() => result.current.reset());
  expect(result.current.count).toBe(5);
});
```

**Тестирование асинхронных хуков:**

```tsx
test('useFetch returns data', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ name: 'Test' }),
  });

  const { result } = renderHook(() => useFetch('/api/user'));

  expect(result.current.data).toBeNull();

  await waitFor(() => {
    expect(result.current.data).toEqual({ name: 'Test' });
  });
});
```

> [!important]
> **Принципы тестирования React:** тестируйте поведение, а не имплементацию. Не проверяйте внутреннее состояние компонента - проверяйте то, что видит пользователь. Используйте семантические запросы (`getByRole`, `getByLabelText`), а не `getByTestId`. `act()` нужен только при прямом изменении состояния вне обработчиков React.

**Что тестировать:**

1. **Рендер:** Компонент отображается без ошибок
2. **Взаимодействия:** Клики, ввод данных вызывают ожидаемые изменения в DOM
3. **Асинхронность:** Данные появляются после загрузки, ошибки показываются при сбое
4. **Edge cases:** Пустые списки, null/undefined пропсы, граничные значения
5. **Accessibility:** Атрибуты aria, управление фокусом, навигация с клавиатуры

---

### 45. React 19: Actions, useActionState, useOptimistic, use

React 19 приносит значительные изменения в обработку форм, асинхронных действий и промисов.

**Actions и useFormStatus:**

Actions - новый паттерн для обработки мутаций данных. Функция, передаваемая в `action` пропс формы, автоматически обрабатывает pending state.

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}

async function updateUser(formData: FormData) {
  'use server';
  const name = formData.get('name');
  await api.updateUser({ name });
}

function UserForm() {
  return (
    <form action={updateUser}>
      <input name="name" defaultValue="Alice" />
      <SubmitButton />
    </form>
  );
}
```

**useActionState:**

Замена `useState` для форм с серверными действиями. Возвращает состояние, action и pending флаг.

```tsx
import { useActionState } from 'react';

async function increment(previousState: number, formData: FormData) {
  return previousState + 1;
}

function Counter() {
  const [state, formAction, isPending] = useActionState(increment, 0);
  return (
    <form action={formAction}>
      <span>Count: {state}</span>
      <button type="submit" disabled={isPending}>Increment</button>
    </form>
  );
}
```

**useOptimistic:**

Показывает оптимистичное обновление UI до завершения серверного действия.

```tsx
import { useOptimistic } from 'react';

function Thread({ messages, sendAction }: { messages: Message[]; sendAction: (form: FormData) => Promise<void> }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );

  async function formAction(formData: FormData) {
    const text = formData.get('message') as string;
    addOptimisticMessage({ text, sending: true });
    await sendAction(formData);
  }

  return (
    <form action={formAction}>
      {optimisticMessages.map((msg, i) => (
        <div key={i}>{msg.text}{msg.sending && ' (sending...)'}</div>
      ))}
      <input name="message" />
      <button type="submit">Send</button>
    </form>
  );
}
```

**`use` - новый хук для промисов и контекста:**

```tsx
// Чтение промиса напрямую в компоненте
function Message({ messagePromise }: { messagePromise: Promise<Message> }) {
  const message = use(messagePromise);
  return <div>{message.text}</div>;
}

// Использование с Suspense
<Suspense fallback={<Spinner />}>
  <Message messagePromise={fetchMessage(id)} />
</Suspense>
```

> [!important]
> `use` может вызываться условно (в отличие от других хуков), что позволяет использовать его внутри if/else и try/catch. Это открывает новые паттерны для обработки ошибок промисов.

**Server Actions:**

Серверные функции, вызываемые напрямую из клиентского кода:

```tsx
// Server Component
async function deleteUser(userId: string) {
  'use server';
  await db.user.delete(userId);
  revalidatePath('/users');
}

// Клиентский компонент может вызвать эту функцию напрямую
<form action={deleteUser.bind(null, userId)}>
  <button type="submit">Delete</button>
</form>
```

---

### 46. CSS approaches: CSS-in-JS vs CSS Modules vs Tailwind

В React существует несколько подходов к стилизации, каждый со своими компромиссами.

**CSS-in-JS (styled-components, Emotion):**

Стили пишутся в JavaScript/TypeScript файлах. Динамические стили на основе пропсов.

```tsx
const Button = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  color: ${props => props.primary ? 'white' : 'gray'};
  background: ${props => props.primary ? 'blue' : 'lightgray'};
`;

// Использование
<Button primary>Click</Button>
```

Проблемы: производительность в runtime, совместимость с React 18 concurrent features (решена через `useInsertionEffect`), размер бандла.

**CSS Modules:**

CSS файлы с локальной областью видимости. Классы автоматически хешируются.

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
}
.primary {
  color: white;
  background: blue;
}
```

```tsx
import styles from './Button.module.css';

function Button({ primary }: { primary?: boolean }) {
  return (
    <button className={cn(styles.button, primary && styles.primary)}>
      Click
    </button>
  );
}
```

Преимущества: нулевая runtime-стоимость, CSS генерируется на этапе сборки, полная совместимость с concurrent rendering.

**Tailwind CSS:**

Utility-first CSS фреймворк. Классы применяются напрямую в JSX.

```tsx
function Button({ primary }: { primary?: boolean }) {
  return (
    <button className={cn(
      'px-4 py-2 rounded',
      primary ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
    )}>
      Click
    </button>
  );
}
```

Преимущества: минимальный CSS (PurgeCSS удаляет неиспользуемые классы), быстрая разработка, нет конфликтов имён. Недостатки: «грязный» JSX, кривая обучения.

> [!important]
> Для новых проектов в 2024+ рекомендуется Tailwind или CSS Modules. CSS-in-JS требует дополнительных усилий для совместимости с concurrent rendering и добавляет runtime overhead. Vanilla Extract и Panda CSS - современные zero-runtime альтернативы CSS-in-JS, генерирующие CSS на этапе сборки с поддержкой типизации.

---

### 47. Refs для imperative API

Refs предоставляют императивный доступ к DOM-элементам и кастомным объектам, когда декларативного API недостаточно.

**Типичные сценарии:**

```tsx
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function play() { videoRef.current?.play(); }
  function pause() { videoRef.current?.pause(); }
  function seekTo(time: number) {
    if (videoRef.current) videoRef.current.currentTime = time;
  }

  return (
    <div>
      <video ref={videoRef} src={src} />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  );
}

// Интеграция со сторонними библиотеками (D3, Three.js, Chart.js)
function Chart({ data }: { data: DataPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ChartInstance>();

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = new ChartJS(containerRef.current, { data });
    return () => chartRef.current?.destroy();
  }, [data]);

  return <div ref={containerRef} />;
}
```

> [!info]
> Refs также используются как хранилище мутабельных значений, не участвующих в рендер-цикле: таймеры, предыдущие значения, флаги «смонтирован ли компонент», значения для useEffect без добавления в зависимости.

---

### 48. Props.children + React.Children API

`children` - специальный пропс, содержащий содержимое между открывающим и закрывающим тегами компонента.

**Children prop:**

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

// Использование
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

**React.Children API:**

```tsx
function Grid({ children }: { children: React.ReactNode }) {
  const count = React.Children.count(children);
  // React.Children.map(children, (child, index) => ...)
  // React.Children.forEach(children, (child, index) => ...)
  // React.Children.toArray(children) - возвращает плоский массив
  // React.Children.only(children) - ожидает ровно один child

  return (
    <div className={`grid grid-${count}`}>
      {React.Children.map(children, (child, i) => (
        <div className="grid-cell" key={i}>{child}</div>
      ))}
    </div>
  );
}
```

**Function as children (render function pattern):**

```tsx
function DataFetcher<T>({
  children,
  url,
}: {
  children: (data: T | null, loading: boolean) => React.ReactNode;
  url: string;
}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url).then(res => res.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [url]);

  return <>{children(data, loading)}</>;
}

// Использование
<DataFetcher url="/api/users">
  {(data, loading) => loading ? <Spinner /> : <UserList users={data} />}
</DataFetcher>
```

**Slot pattern с children:**

```tsx
function Modal({
  header,
  body,
  footer,
}: {
  header: React.ReactNode;
  body: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="modal">
      <div className="modal-header">{header}</div>
      <div className="modal-body">{body}</div>
      <div className="modal-footer">{footer}</div>
    </div>
  );
}
```

> [!important]
> React 19 удаляет большинство методов `React.Children` в пользу стандартных методов массивов. `React.Children.map` заменяется на `Children.toArray().map()`, `React.Children.count` на `Children.toArray().length`. Это упрощает API и делает его более предсказуемым.

---

### 49. Performance optimization checklist

Практический чеклист оптимизации производительности React-приложений:

**1. Минимизация ререндеров:**

- `React.memo` для компонентов, которые ререндерятся с теми же пропсами
- `useCallback` для функций, передаваемых в `React.memo`-компоненты
- `useMemo` для дорогих вычислений и объектов, передаваемых как пропсы
- Разделение контекстов для независимых значений
- Colocation состояния - держать state ближе к месту использования

**2. Code splitting:**

- `React.lazy` + `Suspense` для ленивой загрузки компонентов
- Route-level code splitting через React Router
- IntersectionObserver для компонентов ниже fold

**3. Виртуализация списков:**

- `react-window` или `react-virtualized` для длинных списков
- Рендерить только видимые элементы

**4. Оптимизация изображений:**

- Lazy loading через `loading="lazy"`
- WebP/AVIF форматы
- Responsive images через `srcSet`

**5. Concurrent Features:**

- `useTransition` для неприоритетных обновлений
- `useDeferredValue` для отложенных значений
- Streaming SSR для быстрого TTFB

**6. Избегание антипаттернов:**

- Не мутировать состояние напрямую
- Не использовать индекс как ключ в динамических списках
- Не создавать объекты/функции inline в пропсах
- Не использовать `useEffect` для derived state

**7. Профилирование:**

- React DevTools Profiler для измерения времени рендера
- `console.time` / `console.timeEnd` для ручных замеров
- Web Vitals (LCP, FID, CLS) для пользовательских метрик

> [!important]
> Оптимизация без профилирования - это гадание. Всегда измеряйте перед оптимизацией. React Compiler (Forget) может автоматически применить многие оптимизации, но понимание механики ререндеров остаётся критичным для архитектурных решений.

---

### 50. State managers: Redux, Zustand, Jotai, MobX comparison

Сравнение популярных библиотек управления состоянием в React-экосистеме:

**Redux (Redux Toolkit):**

```tsx
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value += 1; },
    decrement: state => { state.value -= 1; },
  },
});

const store = configureStore({ reducer: { counter: counterSlice.reducer } });
```

Плюсы: DevTools, middleware (thunk, saga), экосистема, предсказуемость. Минусы: boilerplate (даже с RTK), кривая обучения, избыточность для простых приложений.

**Zustand:**

```tsx
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
}));

// Использование - селекторы предотвращают лишние ререндеры
function Counter() {
  const count = useCounterStore(state => state.count);
  return <span>{count}</span>;
}
```

Плюсы: минимальный API, нет boilerplate, селекторы из коробки, поддержка middleware. Минусы: менее зрелая экосистема, чем Redux.

**Jotai (atomic state):**

```tsx
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Плюсы: атомарная модель (как Recoil), гранулярные подписки, минимальный API. Минусы: менее известен, меньше интеграций.

**MobX:**

```tsx
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';

class CounterStore {
  count = 0;
  constructor() { makeAutoObservable(this); }
  increment() { this.count += 1; }
  decrement() { this.count -= 1; }
}

const store = new CounterStore();

const Counter = observer(() => (
  <button onClick={() => store.increment()}>{store.count}</button>
));
```

Плюсы: реактивность «из коробки», OOP-стиль, автоматическое отслеживание зависимостей. Минусы: магия (скрытые зависимости), мутации вместо иммутабельности, сложная отладка.

> [!important]
> Выбор зависит от масштаба проекта. Для небольших приложений - Zustand или Jotai. Для enterprise - Redux Toolkit или MobX. Context API подходит для редко меняющихся значений (тема, аутентификация), но не для часто обновляемого состояния.

---

## Заключение

Знание внутреннего устройства React отличает Senior-разработчика от Middle. Понимание того, как работает reconciliation, Fiber, concurrent rendering - позволяет принимать правильные архитектурные решения, предотвращать проблемы производительности и эффективно отлаживать сложные баги.

Ключевые принципы Senior-уровня в React:
- Думайте о том, **когда и почему** компонент ререндерится
- Понимайте границы применимости каждого инструмента (Context не замена Redux, useMemo не бесплатен, Concurrent Features не ускоряют код)
- Тестируйте с точки зрения пользователя, а не реализации
- Следите за referential equality и иммутабельностью
