---
tags:
  - frontend
  - state-managers
  - valtio
  - react
---

## Введение

Valtio - это стейт-менеджер, основанный на JavaScript Proxy. Уникальность подхода в том, что состояние мутируется напрямую, как обычный объект, а Valtio под капотом отслеживает изменения и создаёт иммутабельные снапшоты для React.

Ключевые принципы:
- Мутабельный API, иммутабельные снапшоты - пишешь мутации, получаешь предсказуемые обновления
- Автоматическое отслеживание зависимостей - компоненты ре-рендерятся только при изменении используемых полей
- Минимальный API - `proxy()` и `useSnapshot()` покрывают 90% случаев
- Размер бандла около 3.8 KB (gzip)
- Работа с вложенными объектами без вспомогательных функций

> [!info] Valtio vs обычный объект
> Valtio proxy выглядит и ведёт себя как обычный JavaScript-объект. Разница в том, что каждая мутация отслеживается, и React-компоненты обновляются гранулярно - только когда меняются поля, которые они читают.

---

## Установка

```bash
npm install valtio
```

Для утилит вычисляемых значений:

```bash
npm install derive-valtio
```

---

## proxy() и useSnapshot()

### Создание прокси-состояния

```ts
import { proxy } from 'valtio';

interface AppState {
  count: number;
  user: User | null;
  todos: Todo[];
}

const state = proxy<AppState>({
  count: 0,
  user: null,
  todos: [],
});

// мутация - как обычный объект
state.count++;
state.user = { id: '1', name: 'Alice' };
state.todos.push({ id: '1', title: 'Task', completed: false });
```

### useSnapshot - чтение в React

`useSnapshot()` создаёт иммутабельный снапшот и подписывается на изменения используемых полей.

```tsx
import { useSnapshot } from 'valtio';

function Counter() {
  const snap = useSnapshot(state);

  return (
    <div>
      <span>{snap.count}</span>
      <button onClick={() => state.count++}>+</button>
      <button onClick={() => state.count--}>-</button>
    </div>
  );
}
```

> [!important] Снапшот read-only
> Объект из `useSnapshot()` заморожен - он служит для чтения. Мутировать нужно оригинальный `state`, а не снапшот. Попытка записи в snap выбросит ошибку в dev-режиме.

```tsx
function UserProfile() {
  const snap = useSnapshot(state);

  // рендерится только при изменении user.name
  return <div>{snap.user?.name}</div>;
}

function TodoCount() {
  const snap = useSnapshot(state);

  // рендерится только при изменении длины массива
  return <span>Задач: {snap.todos.length}</span>;
}
```

---

## Экшены и асинхронные операции

Экшены в Valtio - это обычные функции, которые мутируют прокси. Никаких специальных обёрток не нужно.

```ts
// синхронные экшены
const actions = {
  increment() {
    state.count++;
  },

  decrement() {
    state.count--;
  },

  addTodo(title: string) {
    state.todos.push({
      id: crypto.randomUUID(),
      title,
      completed: false,
    });
  },

  toggleTodo(id: string) {
    const todo = state.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  },

  removeTodo(id: string) {
    const index = state.todos.findIndex((t) => t.id === id);
    if (index !== -1) {
      state.todos.splice(index, 1);
    }
  },
};
```

```ts
// асинхронные экшены
const asyncActions = {
  async fetchTodos() {
    state.isLoading = true;
    try {
      const response = await fetch('/api/todos');
      state.todos = await response.json();
    } catch (error) {
      state.error = (error as Error).message;
    } finally {
      state.isLoading = false;
    }
  },

  async login(credentials: Credentials) {
    state.isLoading = true;
    state.error = null;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      state.user = data.user;
      state.token = data.token;
    } catch (error) {
      state.error = (error as Error).message;
    } finally {
      state.isLoading = false;
    }
  },
};
```

---

## Производное состояние с derive

Для вычисляемых значений используется `derive-valtio` - отдельный пакет, который создаёт производные прокси.

```ts
import { derive } from 'derive-valtio';

const state = proxy({
  todos: [] as Todo[],
  filter: 'all' as 'all' | 'active' | 'completed',
});

const derived = derive({
  filteredTodos: (get) => {
    const todos = get(state).todos;
    const filter = get(state).filter;

    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  },

  completedCount: (get) => {
    return get(state).todos.filter((t) => t.completed).length;
  },

  progress: (get) => {
    const todos = get(state).todos;
    if (todos.length === 0) return 0;
    const completed = todos.filter((t) => t.completed).length;
    return Math.round((completed / todos.length) * 100);
  },
});
```

Альтернативно можно добавлять вычисляемые свойства прямо в прокси через геттеры:

```ts
const state = proxy({
  items: [] as CartItem[],
  get totalPrice() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  get itemCount() {
    return this.items.length;
  },
});
```

---

## subscribe и subscribeKey

### subscribe

Подписка на любые изменения прокси-объекта. Полезна для логирования, аналитики и побочных эффектов вне React.

```ts
import { subscribe } from 'valtio';

// подписка на все изменения
const unsubscribe = subscribe(state, () => {
  console.log('state changed:', state);
});

// отписка
unsubscribe();
```

### subscribeKey

Подписка на изменение конкретного ключа.

```ts
import { subscribeKey } from 'valtio/utils';

// реакция только на изменение user
subscribeKey(state, 'user', (user) => {
  if (user) {
    analytics.identify(user.id);
  }
});

// синхронизация с localStorage
subscribeKey(state, 'theme', (theme) => {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
});
```

---

## Утилиты из valtio/utils

### proxyWithHistory

Прокси с поддержкой undo/redo.

```ts
import { proxyWithHistory } from 'valtio/utils';

const state = proxyWithHistory({
  text: '',
  fontSize: 16,
});

// мутация
state.value.text = 'Hello';
state.value.fontSize = 20;

// undo/redo
state.undo();
state.redo();

// проверка возможности
state.canUndo(); // boolean
state.canRedo(); // boolean
```

### proxyMap и proxySet

Реактивные аналоги Map и Set.

```ts
import { proxyMap, proxySet } from 'valtio/utils';

const userMap = proxyMap<string, User>();
userMap.set('1', { id: '1', name: 'Alice' });
userMap.delete('1');

const selectedIds = proxySet<string>();
selectedIds.add('1');
selectedIds.has('1'); // true
selectedIds.delete('1');
```

---

## DevTools

Valtio поддерживает Redux DevTools через утилиту `devtools`.

```ts
import { devtools } from 'valtio/utils';

const state = proxy({ count: 0, user: null });

// подключение к Redux DevTools
devtools(state, { name: 'app-state', enabled: true });
```

---

## Valtio vs Zustand

Обе библиотеки созданы одной командой (pmndrs), но решают задачи разными подходами.

| Критерий | Valtio | Zustand |
|---|---|---|
| Парадигма | Мутабельный прокси | Иммутабельный стор |
| API | `proxy()` + `useSnapshot()` | `create()` + селекторы |
| Обновление | Мутация напрямую | Через `set()` |
| Ре-рендеры | Автоматическое отслеживание | Требуют селекторы |
| Вложенные объекты | Мутируются естественно | Нужен spread/Immer |
| Размер | ~3.8 KB | ~1.1 KB |
| Ментальная модель | Ближе к MobX | Ближе к Redux |

> [!summary] Когда выбрать Valtio
> Valtio предпочтителен, когда состояние содержит глубоко вложенные объекты и частые мутации. Zustand лучше, когда важен минимальный размер бандла и явный контроль через иммутабельные обновления.

---

## Паттерны из реальных проектов

### Глобальное состояние приложения

```ts
import { proxy } from 'valtio';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  locale: string;
  notifications: Notification[];
  sidebar: {
    isOpen: boolean;
    activeTab: string;
  };
}

export const appState = proxy<AppState>({
  user: null,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  locale: navigator.language,
  notifications: [],
  sidebar: {
    isOpen: true,
    activeTab: 'home',
  },
});

export const appActions = {
  setTheme(theme: 'light' | 'dark') {
    appState.theme = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  addNotification(notification: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID();
    appState.notifications.push({ ...notification, id });

    // автоудаление через 5 секунд
    setTimeout(() => {
      const index = appState.notifications.findIndex((n) => n.id === id);
      if (index !== -1) appState.notifications.splice(index, 1);
    }, 5000);
  },

  toggleSidebar() {
    appState.sidebar.isOpen = !appState.sidebar.isOpen;
  },

  setSidebarTab(tab: string) {
    appState.sidebar.activeTab = tab;
  },
};
```

### Корзина интернет-магазина

```ts
import { proxy } from 'valtio';
import { subscribeKey } from 'valtio/utils';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export const cartState = proxy({
  items: [] as CartItem[],

  get totalPrice() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },
});

export const cartActions = {
  addItem(product: { id: string; name: string; price: number }) {
    const existing = cartState.items.find((i) => i.productId === product.id);

    if (existing) {
      existing.quantity++;
    } else {
      cartState.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
  },

  updateQuantity(productId: string, quantity: number) {
    const item = cartState.items.find((i) => i.productId === productId);
    if (!item) return;

    if (quantity <= 0) {
      cartActions.removeItem(productId);
    } else {
      item.quantity = quantity;
    }
  },

  removeItem(productId: string) {
    const index = cartState.items.findIndex((i) => i.productId === productId);
    if (index !== -1) {
      cartState.items.splice(index, 1);
    }
  },

  clear() {
    cartState.items.splice(0, cartState.items.length);
  },
};

// сохранение в localStorage
subscribe(cartState, () => {
  localStorage.setItem('cart', JSON.stringify(cartState.items));
});
```

### Форма с вложенной валидацией

```ts
import { proxy } from 'valtio';

interface FormState {
  values: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      zip: string;
    };
  };
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

const formState = proxy<FormState>({
  values: {
    name: '',
    email: '',
    address: {
      street: '',
      city: '',
      zip: '',
    },
  },
  touched: {},
  isSubmitting: false,
});

// мутация вложенного объекта - просто и естественно
function updateAddress(field: keyof FormState['values']['address'], value: string) {
  formState.values.address[field] = value;
  formState.touched[`address.${field}`] = true;
}

async function submitForm() {
  formState.isSubmitting = true;
  try {
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState.values),
    });
  } finally {
    formState.isSubmitting = false;
  }
}
```
