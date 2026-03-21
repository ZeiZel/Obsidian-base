---
tags:
  - svelte
  - sveltekit
  - frontend
  - javascript
  - typescript
---

# Svelte и SvelteKit — Полное руководство

Svelte — это современный компилятор для создания пользовательских интерфейсов. В отличие от React и Vue, Svelte не использует Virtual DOM — он компилирует компоненты в эффективный императивный JavaScript-код во время сборки.

---

## Философия Svelte

### Чем отличается от React/Vue

| Характеристика | Svelte | React | Vue |
|----------------|--------|-------|-----|
| Подход | Компилятор | Runtime библиотека | Runtime фреймворк |
| Virtual DOM | Нет | Да | Да |
| Bundle size | Минимальный | ~40KB | ~35KB |
| Реактивность | Compile-time | useState/useReducer | ref/reactive |
| Boilerplate | Минимальный | Средний | Средний |
| Стили | Scoped по умолчанию | CSS-in-JS/Modules | Scoped/Modules |

### Преимущества Svelte

1. **Меньше кода** — более лаконичный синтаксис
2. **Нет Virtual DOM** — прямые манипуляции с DOM
3. **Меньший bundle** — компилируется только нужный код
4. **Встроенная реактивность** — без хуков и оберток
5. **Встроенные анимации** — transitions и animations из коробки
6. **Scoped CSS** — стили изолированы по умолчанию

### Как работает под капотом

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  .svelte файлы  │ ──► │  Компилятор  │ ──► │  Vanilla JS     │
│                 │     │   Svelte     │     │  (оптимизир.)   │
└─────────────────┘     └──────────────┘     └─────────────────┘

Компилятор анализирует:
1. <script> — JS/TS логика
2. <style> — CSS (автоматически scoped)
3. Разметка — HTML-подобный синтаксис

И генерирует:
- create() — создание DOM
- update() — обновление при изменении данных
- destroy() — очистка
```

---

## Установка и настройка

### Создание проекта Svelte

```bash
# С использованием Vite (рекомендуется)
npm create vite@latest my-svelte-app -- --template svelte
# или с TypeScript
npm create vite@latest my-svelte-app -- --template svelte-ts

cd my-svelte-app
npm install
npm run dev
```

### Создание проекта SvelteKit

```bash
# Официальный способ
npm create svelte@latest my-sveltekit-app

cd my-sveltekit-app
npm install
npm run dev

# Сборка
npm run build

# Превью продакшен сборки
npm run preview
```

### Структура проекта SvelteKit

```
my-sveltekit-app/
├── src/
│   ├── lib/              # Библиотечные компоненты и утилиты
│   │   ├── components/   # Компоненты
│   │   ├── stores/       # Svelte stores
│   │   └── utils/        # Утилиты
│   ├── routes/           # Страницы (file-based routing)
│   │   ├── +page.svelte  # Главная страница
│   │   ├── +layout.svelte # Корневой layout
│   │   ├── +error.svelte # Страница ошибки
│   │   ├── about/
│   │   │   └── +page.svelte
│   │   └── blog/
│   │       ├── +page.svelte        # /blog
│   │       ├── +page.server.ts     # Server-side логика
│   │       └── [slug]/
│   │           ├── +page.svelte    # /blog/[slug]
│   │           └── +page.ts        # Load функция
│   ├── app.html          # HTML шаблон
│   ├── app.css           # Глобальные стили
│   └── hooks.server.ts   # Server hooks
├── static/               # Статические файлы
├── svelte.config.js      # Конфигурация Svelte
├── vite.config.ts        # Конфигурация Vite
└── tsconfig.json
```

---

## Основы Svelte

### Анатомия компонента

```svelte
<!-- UserCard.svelte -->
<script lang="ts">
  // Импорты
  import { onMount, onDestroy } from 'svelte';
  import type { User } from '$lib/types';

  // Props (входные параметры)
  export let user: User;
  export let showActions: boolean = true;

  // Локальное состояние
  let isExpanded = false;
  let clickCount = 0;

  // Реактивные вычисления (computed)
  $: fullName = `${user.firstName} ${user.lastName}`;
  $: isActive = user.status === 'active';

  // Реактивные statements (выполняются при изменении зависимостей)
  $: {
    console.log('User changed:', user.name);
    clickCount = 0; // Сброс при смене пользователя
  }

  $: if (clickCount > 10) {
    console.log('Too many clicks!');
  }

  // Методы
  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  function handleClick() {
    clickCount += 1;
  }

  // Lifecycle hooks
  onMount(() => {
    console.log('Component mounted');

    // Возвращаемая функция вызовется при unmount
    return () => {
      console.log('Cleanup on mount return');
    };
  });

  onDestroy(() => {
    console.log('Component destroyed');
  });
</script>

<!-- Разметка -->
<div class="user-card" class:expanded={isExpanded} class:active={isActive}>
  <img src={user.avatar} alt={fullName} />

  <div class="info">
    <h3>{fullName}</h3>
    <p>{user.email}</p>
    <span>Clicks: {clickCount}</span>
  </div>

  <button on:click={toggleExpand}>
    {isExpanded ? 'Collapse' : 'Expand'}
  </button>

  {#if showActions}
    <div class="actions">
      <button on:click={handleClick}>Click me</button>
    </div>
  {/if}
</div>

<!-- Стили (автоматически scoped) -->
<style>
  .user-card {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .user-card.expanded {
    background: #f5f5f5;
  }

  .user-card.active {
    border-color: green;
  }

  h3 {
    margin: 0;
    color: #333;
  }

  /* Глобальные стили */
  :global(.some-global-class) {
    color: red;
  }
</style>
```

### Использование компонента

```svelte
<!-- App.svelte -->
<script lang="ts">
  import UserCard from './UserCard.svelte';
  import type { User } from '$lib/types';

  let users: User[] = [
    { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', status: 'inactive' }
  ];

  let selectedUser: User | null = null;

  function handleSelect(user: User) {
    selectedUser = user;
  }
</script>

<main>
  {#each users as user (user.id)}
    <UserCard
      {user}
      showActions={user.status === 'active'}
      on:click={() => handleSelect(user)}
    />
  {/each}

  {#if selectedUser}
    <p>Selected: {selectedUser.firstName}</p>
  {/if}
</main>
```

---

## Реактивность

### Реактивные присваивания

```svelte
<script>
  let count = 0;
  let items = ['apple', 'banana'];

  // Простое присваивание — реактивно
  function increment() {
    count += 1; // Триггерит обновление
  }

  // Для массивов и объектов нужно присваивание
  function addItem() {
    // ❌ Не работает — мутация без присваивания
    // items.push('cherry');

    // ✅ Работает — новый массив
    items = [...items, 'cherry'];

    // ✅ Или так
    items.push('cherry');
    items = items; // Триггерим обновление
  }

  // Для объектов
  let user = { name: 'John', age: 25 };

  function updateUser() {
    // ✅ Spread для обновления
    user = { ...user, age: 26 };

    // ✅ Или присваивание после мутации
    user.age = 26;
    user = user;
  }
</script>
```

### Реактивные декларации ($:)

```svelte
<script>
  let width = 10;
  let height = 20;

  // Реактивное вычисляемое значение
  $: area = width * height;

  // Реактивный statement (выполняется при изменении зависимостей)
  $: console.log(`Area is now ${area}`);

  // Блок с несколькими statements
  $: {
    const perimeter = 2 * (width + height);
    console.log('Perimeter:', perimeter);
  }

  // Условные реактивные statements
  $: if (area > 100) {
    console.log('Large area!');
  }

  // Деструктуризация
  let obj = { x: 1, y: 2 };
  $: ({ x, y } = obj);

  // Зависимость от нескольких переменных
  $: combined = `${width}x${height} = ${area}`;
</script>

<input type="number" bind:value={width} />
<input type="number" bind:value={height} />
<p>Area: {area}</p>
```

### Сравнение с React/Vue

```svelte
<!-- Svelte -->
<script>
  let count = 0;
  $: doubled = count * 2;
</script>

<button on:click={() => count++}>
  {count} (doubled: {doubled})
</button>
```

```jsx
// React
function Counter() {
  const [count, setCount] = useState(0);
  const doubled = useMemo(() => count * 2, [count]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count} (doubled: {doubled})
    </button>
  );
}
```

```vue
<!-- Vue 3 -->
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <button @click="count++">
    {{ count }} (doubled: {{ doubled }})
  </button>
</template>
```

---

## Шаблонный синтаксис

### Условный рендеринг

```svelte
<script>
  let loggedIn = false;
  let user = { role: 'admin' };
  let status = 'loading'; // 'loading' | 'success' | 'error'
</script>

<!-- if -->
{#if loggedIn}
  <p>Welcome back!</p>
{/if}

<!-- if/else -->
{#if loggedIn}
  <p>Welcome back!</p>
{:else}
  <p>Please log in</p>
{/if}

<!-- if/else if/else -->
{#if user.role === 'admin'}
  <AdminPanel />
{:else if user.role === 'user'}
  <UserPanel />
{:else}
  <GuestPanel />
{/if}

<!-- Вложенные условия -->
{#if loggedIn}
  {#if user.role === 'admin'}
    <AdminTools />
  {/if}
{/if}

<!-- Switch-подобная логика -->
{#if status === 'loading'}
  <Spinner />
{:else if status === 'error'}
  <Error />
{:else if status === 'success'}
  <Content />
{/if}
```

### Циклы

```svelte
<script>
  let items = [
    { id: 1, name: 'Apple', color: 'red' },
    { id: 2, name: 'Banana', color: 'yellow' },
    { id: 3, name: 'Cherry', color: 'red' }
  ];

  let numbers = [1, 2, 3, 4, 5];
</script>

<!-- Простой цикл -->
{#each items as item}
  <div>{item.name}</div>
{/each}

<!-- С индексом -->
{#each items as item, index}
  <div>{index + 1}. {item.name}</div>
{/each}

<!-- С ключом (важно для анимаций и оптимизации) -->
{#each items as item (item.id)}
  <div>{item.name}</div>
{/each}

<!-- Деструктуризация -->
{#each items as { id, name, color } (id)}
  <div style="color: {color}">{name}</div>
{/each}

<!-- С else для пустого списка -->
{#each items as item (item.id)}
  <div>{item.name}</div>
{:else}
  <p>No items found</p>
{/each}

<!-- Вложенные циклы -->
{#each categories as category}
  <h2>{category.name}</h2>
  {#each category.items as item (item.id)}
    <p>{item.name}</p>
  {/each}
{/each}
```

### Await блоки

```svelte
<script>
  async function fetchUser(id) {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }

  let userId = 1;
  $: userPromise = fetchUser(userId);
</script>

<!-- Полный синтаксис -->
{#await userPromise}
  <p>Loading user...</p>
{:then user}
  <p>Hello, {user.name}!</p>
{:catch error}
  <p class="error">{error.message}</p>
{/await}

<!-- Без состояния загрузки -->
{#await userPromise then user}
  <p>Hello, {user.name}!</p>
{/await}

<!-- Только обработка ошибок -->
{#await userPromise}
  <p>Loading...</p>
{:then user}
  <p>{user.name}</p>
{:catch}
  <p>Something went wrong</p>
{/await}
```

### Key блоки

```svelte
<script>
  import Timer from './Timer.svelte';
  let key = 0;

  function resetTimer() {
    key += 1; // Пересоздаёт компонент
  }
</script>

<!-- Компонент пересоздаётся при изменении key -->
{#key key}
  <Timer />
{/key}

<button on:click={resetTimer}>Reset Timer</button>

<!-- Полезно для анимаций при смене данных -->
{#key user.id}
  <div in:fade>
    <UserProfile {user} />
  </div>
{/key}
```

---

## Привязки данных (Bindings)

### Привязка значений

```svelte
<script>
  let name = '';
  let age = 25;
  let agreed = false;
  let color = '#ff0000';
  let selected = 'a';
  let multiSelected = [];
  let volume = 50;
</script>

<!-- Text input -->
<input type="text" bind:value={name} />

<!-- Number input -->
<input type="number" bind:value={age} />

<!-- Checkbox -->
<input type="checkbox" bind:checked={agreed} />

<!-- Color picker -->
<input type="color" bind:value={color} />

<!-- Range slider -->
<input type="range" min="0" max="100" bind:value={volume} />

<!-- Select -->
<select bind:value={selected}>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
  <option value="c">Option C</option>
</select>

<!-- Multi-select -->
<select multiple bind:value={multiSelected}>
  <option value="a">A</option>
  <option value="b">B</option>
  <option value="c">C</option>
</select>

<!-- Radio buttons -->
<label>
  <input type="radio" bind:group={selected} value="a" />
  Option A
</label>
<label>
  <input type="radio" bind:group={selected} value="b" />
  Option B
</label>

<!-- Checkbox group -->
<label>
  <input type="checkbox" bind:group={multiSelected} value="a" />
  A
</label>
<label>
  <input type="checkbox" bind:group={multiSelected} value="b" />
  B
</label>

<!-- Textarea -->
<textarea bind:value={content}></textarea>

<!-- Contenteditable -->
<div contenteditable bind:innerHTML={html}></div>
<div contenteditable bind:textContent={text}></div>
```

### Привязка к DOM элементам

```svelte
<script>
  import { onMount } from 'svelte';

  let inputElement;
  let divElement;
  let canvasElement;

  onMount(() => {
    inputElement.focus();

    // Работа с canvas
    const ctx = canvasElement.getContext('2d');
    ctx.fillRect(0, 0, 100, 100);
  });
</script>

<!-- bind:this для получения ссылки на DOM элемент -->
<input bind:this={inputElement} />
<div bind:this={divElement}>Content</div>
<canvas bind:this={canvasElement}></canvas>
```

### Привязка размеров

```svelte
<script>
  let width;
  let height;
  let top;
  let left;
</script>

<!-- Привязка размеров (readonly) -->
<div
  bind:clientWidth={width}
  bind:clientHeight={height}
  bind:offsetWidth
  bind:offsetHeight
>
  Size: {width}x{height}
</div>

<!-- Привязка позиции скролла -->
<div
  bind:scrollX
  bind:scrollY
>
  <!-- content -->
</div>

<!-- Или для window -->
<svelte:window
  bind:scrollY
  bind:innerWidth
  bind:innerHeight
  bind:outerWidth
  bind:outerHeight
/>
```

### Привязка к компонентам

```svelte
<!-- Counter.svelte -->
<script>
  export let count = 0;

  export function reset() {
    count = 0;
  }
</script>

<button on:click={() => count++}>{count}</button>
```

```svelte
<!-- App.svelte -->
<script>
  import Counter from './Counter.svelte';

  let counterValue;
  let counterComponent;
</script>

<!-- Двусторонняя привязка к prop -->
<Counter bind:count={counterValue} />

<!-- Привязка к экземпляру компонента -->
<Counter bind:this={counterComponent} />

<button on:click={() => counterComponent.reset()}>
  Reset
</button>

<p>Counter value: {counterValue}</p>
```

---

## События

### DOM события

```svelte
<script>
  function handleClick(event) {
    console.log('Clicked!', event);
  }

  function handleInput(event) {
    console.log('Input:', event.target.value);
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      console.log('Enter pressed');
    }
  }
</script>

<!-- Базовое событие -->
<button on:click={handleClick}>Click me</button>

<!-- Inline handler -->
<button on:click={() => console.log('clicked')}>Click</button>

<!-- С event object -->
<button on:click={(e) => console.log(e.clientX, e.clientY)}>
  Click
</button>

<!-- События ввода -->
<input on:input={handleInput} />
<input on:change={handleInput} />
<input on:keydown={handleKeydown} />
<input on:focus={() => console.log('focused')} />
<input on:blur={() => console.log('blurred')} />

<!-- События мыши -->
<div
  on:mouseenter={() => console.log('enter')}
  on:mouseleave={() => console.log('leave')}
  on:mousemove={(e) => console.log(e.clientX, e.clientY)}
>
  Hover me
</div>

<!-- Событие формы -->
<form on:submit|preventDefault={handleSubmit}>
  <button type="submit">Submit</button>
</form>
```

### Модификаторы событий

```svelte
<!-- preventDefault -->
<form on:submit|preventDefault={handleSubmit}>

<!-- stopPropagation -->
<button on:click|stopPropagation={handleClick}>

<!-- passive (улучшает производительность скролла) -->
<div on:scroll|passive={handleScroll}>

<!-- capture (фаза захвата) -->
<div on:click|capture={handleClick}>

<!-- once (один раз) -->
<button on:click|once={handleClick}>

<!-- self (только если target === currentTarget) -->
<div on:click|self={handleClick}>

<!-- Комбинация модификаторов -->
<form on:submit|preventDefault|stopPropagation={handleSubmit}>

<!-- trusted (только user-initiated события) -->
<button on:click|trusted={handleClick}>
```

### Кастомные события компонента

```svelte
<!-- Button.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let disabled = false;

  function handleClick() {
    dispatch('click', { timestamp: Date.now() });
  }

  function handleSpecialAction() {
    dispatch('special', {
      message: 'Something special happened!',
      data: { foo: 'bar' }
    });
  }
</script>

<button
  {disabled}
  on:click={handleClick}
  on:dblclick={() => dispatch('dblclick')}
>
  <slot />
</button>

<button on:click={handleSpecialAction}>
  Special Action
</button>
```

```svelte
<!-- App.svelte -->
<script>
  import Button from './Button.svelte';

  function handleClick(event) {
    console.log('Button clicked at:', event.detail.timestamp);
  }

  function handleSpecial(event) {
    console.log('Special event:', event.detail);
  }
</script>

<Button
  on:click={handleClick}
  on:special={handleSpecial}
>
  Click me
</Button>
```

### Пробрасывание событий (Event Forwarding)

```svelte
<!-- Inner.svelte -->
<button on:click>
  <slot />
</button>
```

```svelte
<!-- Outer.svelte -->
<script>
  import Inner from './Inner.svelte';
</script>

<!-- on:click без значения пробрасывает событие выше -->
<Inner on:click>
  <slot />
</Inner>
```

```svelte
<!-- App.svelte -->
<script>
  import Outer from './Outer.svelte';
</script>

<Outer on:click={() => console.log('clicked')}>
  Click me
</Outer>
```

---

## Слоты (Slots)

### Базовый слот

```svelte
<!-- Card.svelte -->
<div class="card">
  <slot />
</div>

<style>
  .card {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
</style>
```

```svelte
<!-- App.svelte -->
<Card>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>
```

### Слот по умолчанию (Fallback)

```svelte
<!-- Button.svelte -->
<button>
  <slot>
    <!-- Fallback content если слот пустой -->
    Default Button Text
  </slot>
</button>
```

```svelte
<Button /> <!-- Покажет "Default Button Text" -->
<Button>Custom Text</Button> <!-- Покажет "Custom Text" -->
```

### Именованные слоты

```svelte
<!-- Layout.svelte -->
<div class="layout">
  <header>
    <slot name="header">Default Header</slot>
  </header>

  <main>
    <slot /> <!-- Дефолтный слот -->
  </main>

  <footer>
    <slot name="footer">Default Footer</slot>
  </footer>
</div>
```

```svelte
<!-- App.svelte -->
<Layout>
  <h1 slot="header">My App</h1>

  <p>Main content here</p>
  <p>More content</p>

  <span slot="footer">
    Copyright 2024
  </span>
</Layout>

<!-- Или с svelte:fragment для множества элементов -->
<Layout>
  <svelte:fragment slot="header">
    <h1>Title</h1>
    <nav>Navigation</nav>
  </svelte:fragment>

  <p>Content</p>
</Layout>
```

### Slot Props (передача данных из слота)

```svelte
<!-- List.svelte -->
<script>
  export let items = [];
</script>

<ul>
  {#each items as item, index (item.id)}
    <li>
      <!-- Передаём данные в слот -->
      <slot {item} {index} isFirst={index === 0} isLast={index === items.length - 1} />
    </li>
  {/each}
</ul>
```

```svelte
<!-- App.svelte -->
<script>
  let users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];
</script>

<!-- Получаем данные через let: -->
<List items={users} let:item let:index let:isFirst>
  <span class:first={isFirst}>
    {index + 1}. {item.name}
  </span>
</List>

<!-- Для именованных слотов -->
<Component>
  <div slot="content" let:data>
    {data.value}
  </div>
</Component>
```

### Проверка наличия слота

```svelte
<!-- Card.svelte -->
<script>
  // $$slots — объект с информацией о переданных слотах
</script>

<div class="card">
  {#if $$slots.header}
    <header class="card-header">
      <slot name="header" />
    </header>
  {/if}

  <div class="card-body">
    <slot />
  </div>

  {#if $$slots.footer}
    <footer class="card-footer">
      <slot name="footer" />
    </footer>
  {/if}
</div>
```

---

## Жизненный цикл

### Lifecycle функции

```svelte
<script>
  import {
    onMount,
    onDestroy,
    beforeUpdate,
    afterUpdate,
    tick
  } from 'svelte';

  let data = null;
  let element;

  // onMount — после первого рендера в DOM
  onMount(() => {
    console.log('Component mounted');

    // Загрузка данных
    fetchData();

    // Можно вернуть cleanup функцию
    return () => {
      console.log('Cleanup from onMount');
    };
  });

  // onMount с async
  onMount(async () => {
    const response = await fetch('/api/data');
    data = await response.json();
  });

  // onDestroy — перед удалением из DOM
  onDestroy(() => {
    console.log('Component will be destroyed');
    // Очистка: таймеры, подписки, listeners
  });

  // beforeUpdate — перед обновлением DOM
  beforeUpdate(() => {
    console.log('Before DOM update');
    // Сохранение состояния перед обновлением
  });

  // afterUpdate — после обновления DOM
  afterUpdate(() => {
    console.log('After DOM update');
    // Работа с обновлённым DOM
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  });

  async function handleClick() {
    data = 'new value';

    // tick — ждёт применения изменений к DOM
    await tick();

    // DOM уже обновлён
    console.log('DOM updated');
  }
</script>

<div bind:this={element}>
  {data}
</div>
```

### Порядок вызова

```
1. <script> выполняется
2. onMount (после первого рендера)
3. beforeUpdate (перед каждым обновлением)
4. afterUpdate (после каждого обновления)
5. onDestroy (перед уничтожением)

При изменении данных:
beforeUpdate → DOM обновляется → afterUpdate
```

### tick()

```svelte
<script>
  import { tick } from 'svelte';

  let text = '';
  let inputElement;

  async function selectAllText() {
    text = 'New text that we want to select';

    // Ждём обновления DOM
    await tick();

    // Теперь можем работать с обновлённым DOM
    inputElement.select();
  }
</script>

<input bind:this={inputElement} bind:value={text} />
<button on:click={selectAllText}>Set and Select</button>
```

---

## Stores (Стейт-менеджмент)

### Writable Store

```typescript
// stores/counter.ts
import { writable } from 'svelte/store';

// Создание store
export const count = writable(0);

// Store с начальным значением
export const user = writable({
  name: '',
  email: ''
});

// Store с кастомной логикой
function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0),
    set: (value: number) => set(value)
  };
}

export const counter = createCounter();
```

```svelte
<!-- Component.svelte -->
<script>
  import { count, counter } from './stores/counter';

  // Подписка с автоотпиской ($)
  // $count — автоматически подписывается и отписывается
</script>

<p>Count: {$count}</p>
<button on:click={() => $count++}>Increment</button>
<button on:click={() => $count = 0}>Reset</button>

<p>Counter: {$counter}</p>
<button on:click={counter.increment}>+</button>
<button on:click={counter.decrement}>-</button>
<button on:click={counter.reset}>Reset</button>
```

### Readable Store

```typescript
// stores/time.ts
import { readable } from 'svelte/store';

// Store только для чтения
export const time = readable(new Date(), function start(set) {
  // Функция вызывается при первой подписке
  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  // Cleanup при последней отписке
  return function stop() {
    clearInterval(interval);
  };
});

// Пример: позиция мыши
export const mousePosition = readable({ x: 0, y: 0 }, (set) => {
  function handleMouseMove(event) {
    set({ x: event.clientX, y: event.clientY });
  }

  document.addEventListener('mousemove', handleMouseMove);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
  };
});
```

```svelte
<script>
  import { time, mousePosition } from './stores/time';
</script>

<p>Current time: {$time.toLocaleTimeString()}</p>
<p>Mouse: {$mousePosition.x}, {$mousePosition.y}</p>
```

### Derived Store

```typescript
// stores/derived.ts
import { writable, derived } from 'svelte/store';

export const firstName = writable('John');
export const lastName = writable('Doe');

// Derived от одного store
export const upperFirstName = derived(
  firstName,
  $firstName => $firstName.toUpperCase()
);

// Derived от нескольких stores
export const fullName = derived(
  [firstName, lastName],
  ([$firstName, $lastName]) => `${$firstName} ${$lastName}`
);

// Async derived
export const user = writable({ id: 1 });

export const userData = derived(
  user,
  ($user, set) => {
    fetch(`/api/users/${$user.id}`)
      .then(res => res.json())
      .then(data => set(data));

    // Начальное значение
    return { loading: true };
  },
  { loading: true } // Initial value
);

// С cleanup
export const delayedValue = derived(
  someStore,
  ($value, set) => {
    const timeout = setTimeout(() => set($value), 1000);
    return () => clearTimeout(timeout);
  }
);
```

### Custom Stores

```typescript
// stores/todos.ts
import { writable, derived } from 'svelte/store';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function createTodoStore() {
  const { subscribe, set, update } = writable<Todo[]>([]);

  return {
    subscribe,

    add: (text: string) => {
      const todo: Todo = {
        id: Date.now(),
        text,
        completed: false
      };
      update(todos => [...todos, todo]);
    },

    toggle: (id: number) => {
      update(todos =>
        todos.map(todo =>
          todo.id === id
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      );
    },

    remove: (id: number) => {
      update(todos => todos.filter(todo => todo.id !== id));
    },

    clear: () => set([])
  };
}

export const todos = createTodoStore();

// Derived stores
export const completedCount = derived(
  todos,
  $todos => $todos.filter(t => t.completed).length
);

export const remainingCount = derived(
  todos,
  $todos => $todos.filter(t => !t.completed).length
);
```

```svelte
<script>
  import { todos, completedCount, remainingCount } from './stores/todos';

  let newTodo = '';

  function addTodo() {
    if (newTodo.trim()) {
      todos.add(newTodo);
      newTodo = '';
    }
  }
</script>

<input bind:value={newTodo} on:keydown={(e) => e.key === 'Enter' && addTodo()} />
<button on:click={addTodo}>Add</button>

<ul>
  {#each $todos as todo (todo.id)}
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        on:change={() => todos.toggle(todo.id)}
      />
      <span class:completed={todo.completed}>{todo.text}</span>
      <button on:click={() => todos.remove(todo.id)}>×</button>
    </li>
  {/each}
</ul>

<p>Completed: {$completedCount} / Remaining: {$remainingCount}</p>
<button on:click={todos.clear}>Clear all</button>
```

### Store в контексте

```svelte
<!-- Parent.svelte -->
<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';

  const theme = writable('light');
  setContext('theme', theme);
</script>
```

```svelte
<!-- Child.svelte -->
<script>
  import { getContext } from 'svelte';

  const theme = getContext('theme');
</script>

<div class:dark={$theme === 'dark'}>
  Current theme: {$theme}
  <button on:click={() => $theme = $theme === 'light' ? 'dark' : 'light'}>
    Toggle
  </button>
</div>
```

---

## Transitions и Animations

### Встроенные transitions

```svelte
<script>
  import { fade, fly, slide, scale, blur, draw } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  let visible = true;
  let items = [1, 2, 3, 4, 5];
</script>

<!-- fade -->
{#if visible}
  <div transition:fade>Fades in/out</div>
{/if}

<!-- fade с параметрами -->
{#if visible}
  <div transition:fade={{ delay: 100, duration: 300 }}>
    Customized fade
  </div>
{/if}

<!-- fly -->
{#if visible}
  <div transition:fly={{ x: 200, y: 0, duration: 500 }}>
    Flies in from right
  </div>
{/if}

<!-- slide -->
{#if visible}
  <div transition:slide={{ duration: 300 }}>
    Slides down
  </div>
{/if}

<!-- scale -->
{#if visible}
  <div transition:scale={{ start: 0.5, opacity: 0.5 }}>
    Scales up
  </div>
{/if}

<!-- blur -->
{#if visible}
  <div transition:blur={{ amount: 10 }}>
    Blurs in/out
  </div>
{/if}

<!-- Разные transitions для in/out -->
{#if visible}
  <div in:fly={{ y: -200 }} out:fade>
    Different enter/exit
  </div>
{/if}

<!-- draw для SVG paths -->
<svg>
  {#if visible}
    <path
      transition:draw={{ duration: 1000 }}
      d="M0,0 L100,100"
    />
  {/if}
</svg>
```

### Animate (flip)

```svelte
<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  let items = [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' },
    { id: 3, name: 'Third' }
  ];

  function shuffle() {
    items = items.sort(() => Math.random() - 0.5);
  }

  function remove(id) {
    items = items.filter(item => item.id !== id);
  }
</script>

<button on:click={shuffle}>Shuffle</button>

<ul>
  {#each items as item (item.id)}
    <li
      animate:flip={{ duration: 300 }}
      in:fade
      out:fade
    >
      {item.name}
      <button on:click={() => remove(item.id)}>×</button>
    </li>
  {/each}
</ul>
```

### Кастомные transitions

```typescript
// transitions.ts
import type { TransitionConfig } from 'svelte/transition';

export function typewriter(node: Element, { speed = 1 }): TransitionConfig {
  const valid = node.childNodes.length === 1 &&
                node.childNodes[0].nodeType === Node.TEXT_NODE;

  if (!valid) {
    throw new Error('This transition only works on elements with a single text node child');
  }

  const text = node.textContent!;
  const duration = text.length / (speed * 0.01);

  return {
    duration,
    tick: (t) => {
      const i = Math.trunc(text.length * t);
      node.textContent = text.slice(0, i);
    }
  };
}

// Пример с CSS
export function spin(node: Element, { duration = 300 }): TransitionConfig {
  return {
    duration,
    css: (t) => {
      const eased = t; // можно применить easing
      return `
        transform: rotate(${eased * 360}deg) scale(${eased});
        opacity: ${eased};
      `;
    }
  };
}
```

```svelte
<script>
  import { typewriter, spin } from './transitions';

  let visible = false;
</script>

<button on:click={() => visible = !visible}>Toggle</button>

{#if visible}
  <p transition:typewriter={{ speed: 2 }}>
    This text types itself out!
  </p>
{/if}

{#if visible}
  <div transition:spin>
    Spinning!
  </div>
{/if}
```

### Easing функции

```svelte
<script>
  import { fade } from 'svelte/transition';
  import { cubicOut, elasticOut, bounceOut } from 'svelte/easing';

  let visible = true;
</script>

{#if visible}
  <div transition:fade={{ duration: 500, easing: cubicOut }}>
    Cubic easing
  </div>
{/if}

{#if visible}
  <div transition:fade={{ duration: 800, easing: elasticOut }}>
    Elastic easing
  </div>
{/if}
```

### Transition events

```svelte
<script>
  let visible = true;

  function handleIntroStart(event) {
    console.log('Intro started');
  }

  function handleIntroEnd(event) {
    console.log('Intro ended');
  }
</script>

{#if visible}
  <div
    transition:fade
    on:introstart={handleIntroStart}
    on:introend={handleIntroEnd}
    on:outrostart={() => console.log('Outro started')}
    on:outroend={() => console.log('Outro ended')}
  >
    Content
  </div>
{/if}
```

---

## Actions (Директивы)

Actions — это функции, вызываемые при монтировании элемента в DOM.

### Создание action

```typescript
// actions/clickOutside.ts
export function clickOutside(node: HTMLElement, callback: () => void) {
  function handleClick(event: MouseEvent) {
    if (!node.contains(event.target as Node)) {
      callback();
    }
  }

  document.addEventListener('click', handleClick, true);

  return {
    // Cleanup при удалении элемента
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}
```

```svelte
<script>
  import { clickOutside } from './actions/clickOutside';

  let showDropdown = false;
</script>

{#if showDropdown}
  <div use:clickOutside={() => showDropdown = false}>
    Dropdown content
  </div>
{/if}
```

### Action с параметрами

```typescript
// actions/tooltip.ts
interface TooltipOptions {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function tooltip(node: HTMLElement, options: TooltipOptions) {
  let tooltipElement: HTMLElement | null = null;

  function showTooltip() {
    tooltipElement = document.createElement('div');
    tooltipElement.className = `tooltip tooltip-${options.position || 'top'}`;
    tooltipElement.textContent = options.text;
    document.body.appendChild(tooltipElement);

    const rect = node.getBoundingClientRect();
    tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
    tooltipElement.style.top = `${rect.top - 10}px`;
  }

  function hideTooltip() {
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }
  }

  node.addEventListener('mouseenter', showTooltip);
  node.addEventListener('mouseleave', hideTooltip);

  return {
    // Вызывается при изменении параметров
    update(newOptions: TooltipOptions) {
      options = newOptions;
    },

    destroy() {
      hideTooltip();
      node.removeEventListener('mouseenter', showTooltip);
      node.removeEventListener('mouseleave', hideTooltip);
    }
  };
}
```

```svelte
<script>
  import { tooltip } from './actions/tooltip';

  let tooltipText = 'Hello!';
</script>

<button use:tooltip={{ text: tooltipText, position: 'top' }}>
  Hover me
</button>

<input bind:value={tooltipText} placeholder="Change tooltip text" />
```

### Полезные actions

```typescript
// actions/longpress.ts
export function longpress(node: HTMLElement, duration = 500) {
  let timer: ReturnType<typeof setTimeout>;

  function handleMouseDown() {
    timer = setTimeout(() => {
      node.dispatchEvent(new CustomEvent('longpress'));
    }, duration);
  }

  function handleMouseUp() {
    clearTimeout(timer);
  }

  node.addEventListener('mousedown', handleMouseDown);
  node.addEventListener('mouseup', handleMouseUp);

  return {
    update(newDuration: number) {
      duration = newDuration;
    },
    destroy() {
      clearTimeout(timer);
      node.removeEventListener('mousedown', handleMouseDown);
      node.removeEventListener('mouseup', handleMouseUp);
    }
  };
}

// actions/intersection.ts
export function inview(node: HTMLElement, params = {}) {
  let observer: IntersectionObserver;

  const handleIntersect: IntersectionObserverCallback = (entries) => {
    const entry = entries[0];
    if (entry.isIntersecting) {
      node.dispatchEvent(new CustomEvent('enter'));
    } else {
      node.dispatchEvent(new CustomEvent('leave'));
    }
  };

  observer = new IntersectionObserver(handleIntersect, params);
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}

// actions/portal.ts
export function portal(node: HTMLElement, target: string | HTMLElement = 'body') {
  const targetEl = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (targetEl) {
    targetEl.appendChild(node);
  }

  return {
    destroy() {
      node.remove();
    }
  };
}
```

```svelte
<script>
  import { longpress, inview, portal } from './actions';
</script>

<button
  use:longpress={1000}
  on:longpress={() => alert('Long pressed!')}
>
  Long press me
</button>

<div
  use:inview
  on:enter={() => console.log('In view')}
  on:leave={() => console.log('Out of view')}
>
  Observed element
</div>

<!-- Рендерится в body -->
<div use:portal>
  <div class="modal">Modal content</div>
</div>
```

---

## Context API

### setContext и getContext

```svelte
<!-- ThemeProvider.svelte -->
<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';

  const theme = writable('light');
  const toggleTheme = () => {
    theme.update(t => t === 'light' ? 'dark' : 'light');
  };

  // Устанавливаем контекст для дочерних компонентов
  setContext('theme', {
    theme,
    toggleTheme
  });
</script>

<div class="theme-provider">
  <slot />
</div>
```

```svelte
<!-- Child.svelte -->
<script>
  import { getContext } from 'svelte';

  // Получаем контекст
  const { theme, toggleTheme } = getContext('theme');
</script>

<div class:dark={$theme === 'dark'}>
  Current theme: {$theme}
  <button on:click={toggleTheme}>Toggle Theme</button>
</div>
```

```svelte
<!-- App.svelte -->
<script>
  import ThemeProvider from './ThemeProvider.svelte';
  import Child from './Child.svelte';
</script>

<ThemeProvider>
  <Child />
  <Child />
</ThemeProvider>
```

### hasContext

```svelte
<script>
  import { hasContext, getContext } from 'svelte';

  // Проверка наличия контекста
  const hasTheme = hasContext('theme');

  let theme;
  if (hasTheme) {
    theme = getContext('theme');
  }
</script>
```

### Типизация контекста

```typescript
// context.ts
import { getContext, setContext } from 'svelte';
import type { Writable } from 'svelte/store';

interface ThemeContext {
  theme: Writable<'light' | 'dark'>;
  toggleTheme: () => void;
}

const THEME_KEY = Symbol('theme');

export function setThemeContext(context: ThemeContext) {
  setContext(THEME_KEY, context);
}

export function getThemeContext(): ThemeContext {
  return getContext(THEME_KEY);
}
```

---

## SvelteKit

### File-based Routing

```
src/routes/
├── +page.svelte          # /
├── +layout.svelte        # Layout для всех страниц
├── +error.svelte         # Страница ошибки
├── about/
│   └── +page.svelte      # /about
├── blog/
│   ├── +page.svelte      # /blog
│   ├── +page.ts          # Load функция для /blog
│   └── [slug]/
│       ├── +page.svelte  # /blog/[slug]
│       └── +page.ts      # Load функция
├── users/
│   ├── +page.svelte      # /users
│   └── [id]/
│       ├── +page.svelte  # /users/[id]
│       └── settings/
│           └── +page.svelte  # /users/[id]/settings
├── api/
│   └── posts/
│       └── +server.ts    # API endpoint: /api/posts
└── (auth)/               # Route group (не влияет на URL)
    ├── login/
    │   └── +page.svelte  # /login
    └── register/
        └── +page.svelte  # /register
```

### Page компонент

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>{data.post.title}</title>
  <meta name="description" content={data.post.excerpt} />
</svelte:head>

<article>
  <h1>{data.post.title}</h1>
  <p class="date">{data.post.date}</p>
  <div class="content">
    {@html data.post.content}
  </div>
</article>
```

### Load функции

```typescript
// src/routes/blog/[slug]/+page.ts
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

// Выполняется на сервере и клиенте (universal load)
export const load: PageLoad = async ({ params, fetch }) => {
  const response = await fetch(`/api/posts/${params.slug}`);

  if (!response.ok) {
    throw error(404, 'Post not found');
  }

  const post = await response.json();

  return {
    post
  };
};
```

```typescript
// src/routes/blog/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/database';

// Выполняется ТОЛЬКО на сервере
export const load: PageServerLoad = async ({ params, locals }) => {
  const post = await db.posts.findUnique({
    where: { slug: params.slug }
  });

  if (!post) {
    throw error(404, 'Post not found');
  }

  // Можно работать с секретами, базой данных напрямую
  return {
    post,
    user: locals.user
  };
};
```

### Layouts

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<nav>
  <a href="/" class:active={$page.url.pathname === '/'}>Home</a>
  <a href="/about" class:active={$page.url.pathname === '/about'}>About</a>

  {#if data.user}
    <span>Welcome, {data.user.name}</span>
    <a href="/logout">Logout</a>
  {:else}
    <a href="/login">Login</a>
  {/if}
</nav>

<main>
  <slot />
</main>

<footer>
  &copy; 2024 My App
</footer>

<style>
  nav a.active {
    font-weight: bold;
  }
</style>
```

```typescript
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user
  };
};
```

### Form Actions

```typescript
// src/routes/login/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/database';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, '/dashboard');
  }
};

export const actions: Actions = {
  // Default action
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    // Валидация
    if (!email || !password) {
      return fail(400, {
        email,
        error: 'Email and password are required'
      });
    }

    // Аутентификация
    const user = await db.users.authenticate(email, password);

    if (!user) {
      return fail(401, {
        email,
        error: 'Invalid credentials'
      });
    }

    // Установка cookie
    cookies.set('session', user.sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    throw redirect(303, '/dashboard');
  },

  // Named action
  register: async ({ request }) => {
    const data = await request.formData();
    // ... registration logic
  }
};
```

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<h1>Login</h1>

{#if form?.error}
  <p class="error">{form.error}</p>
{/if}

<!-- use:enhance для progressive enhancement -->
<form method="POST" use:enhance>
  <label>
    Email
    <input
      type="email"
      name="email"
      value={form?.email ?? ''}
      required
    />
  </label>

  <label>
    Password
    <input type="password" name="password" required />
  </label>

  <button type="submit">Login</button>
</form>

<!-- Named action -->
<form method="POST" action="?/register">
  <!-- ... -->
</form>
```

### API Routes

```typescript
// src/routes/api/posts/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/database';

// GET /api/posts
export const GET: RequestHandler = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const offset = Number(url.searchParams.get('offset') ?? 0);

  const posts = await db.posts.findMany({
    take: limit,
    skip: offset
  });

  return json(posts);
};

// POST /api/posts
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const data = await request.json();

  const post = await db.posts.create({
    data: {
      ...data,
      authorId: locals.user.id
    }
  });

  return json(post, { status: 201 });
};
```

```typescript
// src/routes/api/posts/[id]/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/database';

// GET /api/posts/[id]
export const GET: RequestHandler = async ({ params }) => {
  const post = await db.posts.findUnique({
    where: { id: params.id }
  });

  if (!post) {
    throw error(404, 'Post not found');
  }

  return json(post);
};

// PUT /api/posts/[id]
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const post = await db.posts.findUnique({
    where: { id: params.id }
  });

  if (!post) {
    throw error(404, 'Post not found');
  }

  if (post.authorId !== locals.user?.id) {
    throw error(403, 'Forbidden');
  }

  const data = await request.json();

  const updated = await db.posts.update({
    where: { id: params.id },
    data
  });

  return json(updated);
};

// DELETE /api/posts/[id]
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const post = await db.posts.findUnique({
    where: { id: params.id }
  });

  if (!post) {
    throw error(404, 'Post not found');
  }

  if (post.authorId !== locals.user?.id) {
    throw error(403, 'Forbidden');
  }

  await db.posts.delete({
    where: { id: params.id }
  });

  return new Response(null, { status: 204 });
};
```

### Hooks

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/database';

// Выполняется для каждого запроса
export const handle: Handle = async ({ event, resolve }) => {
  // Получение сессии из cookie
  const sessionToken = event.cookies.get('session');

  if (sessionToken) {
    const user = await db.users.findBySession(sessionToken);
    if (user) {
      event.locals.user = user;
    }
  }

  // Продолжение обработки запроса
  const response = await resolve(event);

  // Можно модифицировать response
  return response;
};

// Обработка ошибок
export const handleError = async ({ error, event }) => {
  console.error('Server error:', error);

  return {
    message: 'Something went wrong',
    code: 'INTERNAL_ERROR'
  };
};
```

```typescript
// src/hooks.client.ts
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error, event }) => {
  console.error('Client error:', error);

  return {
    message: 'Something went wrong',
    code: 'CLIENT_ERROR'
  };
};
```

### Навигация

```svelte
<script>
  import { goto, invalidate, invalidateAll } from '$app/navigation';
  import { page, navigating } from '$app/stores';

  async function handleClick() {
    // Программная навигация
    await goto('/dashboard');

    // С параметрами
    await goto('/search?q=svelte', { replaceState: true });

    // Без прокрутки
    await goto('/page', { noScroll: true });
  }

  async function refreshData() {
    // Перезагрузка данных текущей страницы
    await invalidateAll();

    // Или конкретного load
    await invalidate('app:posts');
  }
</script>

<!-- Статус навигации -->
{#if $navigating}
  <div class="loading-bar">Loading...</div>
{/if}

<!-- Текущий URL -->
<p>Current path: {$page.url.pathname}</p>
<p>Query: {$page.url.searchParams.get('q')}</p>

<!-- Ссылки -->
<a href="/about">About</a>
<a href="/blog/{post.slug}">Read more</a>

<!-- Preloading -->
<a href="/heavy-page" data-sveltekit-preload-data="hover">
  Preloads on hover
</a>
```

### SSR и CSR режимы

```typescript
// src/routes/+page.ts
// SSR выключен для этой страницы
export const ssr = false;

// CSR выключен (только SSR)
export const csr = false;

// Prerender
export const prerender = true;

// Trailing slash
export const trailingSlash = 'always';
```

```typescript
// src/routes/+layout.ts
// Применяется ко всем дочерним страницам
export const ssr = true;
export const prerender = false;
```

### Environment Variables

```bash
# .env
PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgres://...
SECRET_KEY=supersecret
```

```typescript
// Публичные (доступны на клиенте)
import { PUBLIC_API_URL } from '$env/static/public';

// Приватные (только сервер)
import { DATABASE_URL, SECRET_KEY } from '$env/static/private';

// Динамические
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
```

---

## Best Practices

### 1. Структура проекта

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/           # Базовые UI компоненты
│   │   │   ├── Button.svelte
│   │   │   ├── Input.svelte
│   │   │   └── Modal.svelte
│   │   └── features/     # Feature компоненты
│   │       ├── UserCard.svelte
│   │       └── PostList.svelte
│   ├── stores/           # Svelte stores
│   │   ├── auth.ts
│   │   └── theme.ts
│   ├── utils/            # Утилиты
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── types/            # TypeScript типы
│   │   └── index.ts
│   ├── actions/          # Svelte actions
│   │   └── clickOutside.ts
│   └── server/           # Серверный код
│       └── database.ts
├── routes/
└── app.html
```

### 2. Компоненты

```svelte
<!-- ✅ Хорошо: Props с дефолтами и типами -->
<script lang="ts">
  export let variant: 'primary' | 'secondary' = 'primary';
  export let disabled: boolean = false;
  export let onClick: () => void = () => {};
</script>

<!-- ✅ Хорошо: Деструктуризация $$restProps -->
<button
  class="btn btn-{variant}"
  {disabled}
  on:click={onClick}
  {...$$restProps}
>
  <slot />
</button>
```

### 3. Реактивность

```svelte
<script>
  // ✅ Хорошо: Использование $: для computed значений
  $: fullName = `${firstName} ${lastName}`;

  // ✅ Хорошо: Использование $: для side effects
  $: if (count > 10) {
    console.log('Count exceeded 10');
  }

  // ❌ Плохо: Мутация без присваивания
  // items.push(newItem);

  // ✅ Хорошо: Новый массив
  items = [...items, newItem];
</script>
```

### 4. Stores

```typescript
// ✅ Хорошо: Кастомный store с методами
function createTodoStore() {
  const { subscribe, set, update } = writable<Todo[]>([]);

  return {
    subscribe,
    add: (text: string) => update(todos => [...todos, createTodo(text)]),
    remove: (id: number) => update(todos => todos.filter(t => t.id !== id)),
    clear: () => set([])
  };
}

// ❌ Плохо: Экспорт writable напрямую без инкапсуляции логики
export const todos = writable<Todo[]>([]);
```

### 5. Типизация

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

// +page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const users: User[] = await fetch('/api/users').then(r => r.json());
  return { users };
};
```

---

## Полезные ресурсы

- [Svelte Documentation](https://svelte.dev/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://learn.svelte.dev/)
- [Svelte REPL](https://svelte.dev/repl)
- [Svelte Society](https://sveltesociety.dev/)
- [Awesome Svelte](https://github.com/TheComputerM/awesome-svelte)
