---
tags:
  - vue
  - vue3
  - pinia
  - nuxt
  - frontend
  - typescript
---

# Vue.js — Полное руководство

Vue.js — это прогрессивный JavaScript-фреймворк для создания пользовательских интерфейсов. Поддерживает инкрементальное внедрение — от простого подключения скрипта до полноценного SPA с роутингом и стейт-менеджментом.

---

## Философия Vue

### Сравнение Vue 2 и Vue 3

| Характеристика | Vue 2 | Vue 3 |
|----------------|-------|-------|
| Reactivity | Object.defineProperty | Proxy |
| API | Options API | Options + Composition API |
| TypeScript | Ограниченная поддержка | Полная поддержка |
| Bundle size | ~23KB | ~13KB |
| Performance | Хорошая | Лучше на 20-50% |
| Fragments | Нет (1 root element) | Да |
| Teleport | Нет | Да |
| Suspense | Нет | Да |

### Преимущества Vue

1. **Низкий порог входа** — понятный синтаксис, хорошая документация
2. **Single File Components** — HTML, CSS, JS в одном файле
3. **Реактивность** — автоматическое отслеживание зависимостей
4. **Гибкость** — Options API для простоты, Composition API для сложных случаев
5. **Экосистема** — Vue Router, Pinia, Nuxt, Vue DevTools

### Как работает реактивность

```
Vue 2 (Object.defineProperty):
┌─────────────────────────────────────┐
│  const data = { count: 0 }          │
│                                     │
│  Object.defineProperty(data, 'count', { │
│    get() { track() },               │
│    set(v) { trigger(); value = v }  │
│  })                                 │
└─────────────────────────────────────┘
Ограничения:
- Не отслеживает добавление/удаление свойств
- Требует Vue.set() для массивов

Vue 3 (Proxy):
┌─────────────────────────────────────┐
│  const data = reactive({ count: 0 }) │
│                                     │
│  new Proxy(data, {                  │
│    get(target, key) { track() },    │
│    set(target, key, value) {        │
│      trigger()                      │
│      target[key] = value            │
│    }                                │
│  })                                 │
└─────────────────────────────────────┘
Преимущества:
- Отслеживает любые операции
- Нативная поддержка Map, Set, WeakMap
```

---

## Установка и настройка

### Создание проекта Vue 3

```bash
# С использованием create-vue (официальный способ)
npm create vue@latest my-vue-app

# Ответы на вопросы:
# ✔ TypeScript? Yes
# ✔ JSX Support? No
# ✔ Vue Router? Yes
# ✔ Pinia? Yes
# ✔ Vitest? Yes
# ✔ ESLint? Yes
# ✔ Prettier? Yes

cd my-vue-app
npm install
npm run dev
```

### С использованием Vite

```bash
npm create vite@latest my-vue-app -- --template vue-ts
cd my-vue-app
npm install
npm run dev
```

### Структура проекта

```
my-vue-app/
├── public/              # Статические файлы
│   └── favicon.ico
├── src/
│   ├── assets/          # Ассеты (обрабатываются Vite)
│   ├── components/      # Компоненты
│   │   └── HelloWorld.vue
│   ├── composables/     # Composition API хуки
│   │   └── useCounter.ts
│   ├── stores/          # Pinia stores
│   │   └── counter.ts
│   ├── views/           # Страницы (для роутинга)
│   │   ├── HomeView.vue
│   │   └── AboutView.vue
│   ├── router/          # Vue Router
│   │   └── index.ts
│   ├── types/           # TypeScript типы
│   │   └── index.ts
│   ├── App.vue          # Корневой компонент
│   └── main.ts          # Точка входа
├── index.html           # HTML шаблон
├── vite.config.ts       # Конфигурация Vite
├── tsconfig.json        # TypeScript конфиг
└── package.json
```

---

## Options API (Vue 2/3)

Options API — классический подход к написанию компонентов Vue.

### Полная анатомия компонента

```vue
<!-- UserProfile.vue -->
<template>
  <div class="user-profile" :class="{ active: isActive }">
    <img :src="avatarUrl" :alt="fullName" />

    <h2>{{ fullName }}</h2>
    <p>{{ user.email }}</p>

    <p v-if="user.bio">{{ user.bio }}</p>
    <p v-else class="no-bio">No bio provided</p>

    <ul>
      <li v-for="skill in user.skills" :key="skill">
        {{ skill }}
      </li>
    </ul>

    <button @click="toggleActive">
      {{ isActive ? 'Deactivate' : 'Activate' }}
    </button>

    <button @click="$emit('edit', user)">Edit</button>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',

  // Входные параметры от родителя
  props: {
    user: {
      type: Object,
      required: true,
      validator(value) {
        return value.id && value.name;
      }
    },
    showEmail: {
      type: Boolean,
      default: true
    }
  },

  // События, которые эмитит компонент
  emits: ['edit', 'delete', 'activate'],

  // Локальное реактивное состояние
  data() {
    return {
      isActive: false,
      localCounter: 0
    };
  },

  // Вычисляемые свойства (кешируются)
  computed: {
    fullName() {
      return `${this.user.firstName} ${this.user.lastName}`;
    },
    avatarUrl() {
      return this.user.avatar || '/default-avatar.png';
    }
  },

  // Наблюдатели за изменениями
  watch: {
    // Простой watcher
    isActive(newValue, oldValue) {
      console.log(`Active changed from ${oldValue} to ${newValue}`);
      this.$emit('activate', newValue);
    },

    // Deep watcher для объектов
    user: {
      handler(newUser) {
        console.log('User changed:', newUser);
      },
      deep: true,
      immediate: true // Вызвать сразу при создании
    },

    // Watcher на вложенное свойство
    'user.email'(newEmail) {
      console.log('Email changed:', newEmail);
    }
  },

  // Lifecycle Hooks
  beforeCreate() {
    // data и methods ещё недоступны
    console.log('beforeCreate');
  },

  created() {
    // data и methods доступны, DOM — нет
    console.log('created');
    this.fetchAdditionalData();
  },

  beforeMount() {
    // Перед монтированием в DOM
    console.log('beforeMount');
  },

  mounted() {
    // Компонент в DOM
    console.log('mounted');
    this.$refs.input?.focus();
  },

  beforeUpdate() {
    // Перед обновлением DOM
    console.log('beforeUpdate');
  },

  updated() {
    // После обновления DOM
    console.log('updated');
  },

  beforeUnmount() {
    // Перед удалением из DOM (beforeDestroy в Vue 2)
    console.log('beforeUnmount');
    this.cleanup();
  },

  unmounted() {
    // После удаления из DOM (destroyed в Vue 2)
    console.log('unmounted');
  },

  // Методы
  methods: {
    toggleActive() {
      this.isActive = !this.isActive;
    },

    async fetchAdditionalData() {
      try {
        const response = await fetch(`/api/users/${this.user.id}/details`);
        this.additionalData = await response.json();
      } catch (error) {
        console.error('Failed to fetch:', error);
      }
    },

    cleanup() {
      // Очистка подписок, таймеров и т.д.
    }
  }
};
</script>

<style scoped>
.user-profile {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.user-profile.active {
  border-color: green;
}

.no-bio {
  color: #999;
  font-style: italic;
}
</style>
```

### Использование компонента

```vue
<template>
  <div>
    <UserProfile
      v-for="user in users"
      :key="user.id"
      :user="user"
      :show-email="showEmails"
      @edit="handleEdit"
      @delete="handleDelete"
      @activate="handleActivate"
    />
  </div>
</template>

<script>
import UserProfile from './components/UserProfile.vue';

export default {
  components: {
    UserProfile
  },

  data() {
    return {
      users: [],
      showEmails: true
    };
  },

  methods: {
    handleEdit(user) {
      console.log('Edit user:', user);
    },
    handleDelete(userId) {
      this.users = this.users.filter(u => u.id !== userId);
    },
    handleActivate(isActive) {
      console.log('User activation:', isActive);
    }
  }
};
</script>
```

---

## Composition API (Vue 3)

Composition API — новый способ организации логики компонентов, решающий проблемы Options API:
- Логика разбросана по options (data, computed, methods, watch)
- Сложность переиспользования логики
- Ограниченная поддержка TypeScript

### Setup function

```vue
<script>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';

export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },

  emits: ['update', 'delete'],

  setup(props, { emit, attrs, slots, expose }) {
    // Реактивные данные
    const count = ref(0);
    const state = reactive({
      name: '',
      items: []
    });

    // Computed
    const doubleCount = computed(() => count.value * 2);

    // Watch
    watch(
      () => props.user,
      (newUser) => {
        console.log('User changed:', newUser);
      },
      { deep: true, immediate: true }
    );

    // Lifecycle
    onMounted(() => {
      console.log('Mounted');
    });

    onUnmounted(() => {
      console.log('Unmounted');
    });

    // Methods
    function increment() {
      count.value++;
    }

    function updateUser() {
      emit('update', { ...props.user, name: state.name });
    }

    // Expose для доступа через ref из родителя
    expose({
      count,
      increment
    });

    // Возвращаем всё, что нужно в template
    return {
      count,
      state,
      doubleCount,
      increment,
      updateUser
    };
  }
};
</script>
```

### Script Setup (рекомендуемый способ)

```vue
<!-- UserProfile.vue -->
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';

// ===== PROPS =====
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface Props {
  user: User;
  showEmail?: boolean;
}

// defineProps с дефолтами
const props = withDefaults(defineProps<Props>(), {
  showEmail: true
});

// ===== EMITS =====
interface Emits {
  (e: 'update', user: User): void;
  (e: 'delete', id: number): void;
  (e: 'activate', status: boolean): void;
}

const emit = defineEmits<Emits>();

// ===== REACTIVE STATE =====

// ref для примитивов
const isActive = ref(false);
const count = ref(0);

// reactive для объектов
const state = reactive({
  loading: false,
  error: null as string | null,
  data: [] as any[]
});

// ===== COMPUTED =====

// Кешируется, пересчитывается только при изменении зависимостей
const fullName = computed(() => {
  return `${props.user.firstName} ${props.user.lastName}`;
});

// Writable computed
const uppercaseName = computed({
  get: () => props.user.firstName.toUpperCase(),
  set: (value: string) => {
    emit('update', { ...props.user, firstName: value.toLowerCase() });
  }
});

// ===== WATCH =====

// Watch ref
watch(isActive, (newValue, oldValue) => {
  console.log(`isActive: ${oldValue} → ${newValue}`);
  emit('activate', newValue);
});

// Watch computed или props
watch(
  () => props.user.email,
  (newEmail) => {
    console.log('Email changed:', newEmail);
  }
);

// Watch multiple sources
watch(
  [isActive, () => props.user.id],
  ([newActive, newId], [oldActive, oldId]) => {
    console.log('Multiple values changed');
  }
);

// watchEffect — автоматически отслеживает зависимости
import { watchEffect } from 'vue';

watchEffect(() => {
  // Автоматически отслеживает count и isActive
  console.log(`Count: ${count.value}, Active: ${isActive.value}`);
});

// watchEffect с cleanup
watchEffect((onCleanup) => {
  const controller = new AbortController();

  fetch(`/api/users/${props.user.id}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => state.data = data);

  // Вызывается перед следующим выполнением или unmount
  onCleanup(() => {
    controller.abort();
  });
});

// ===== LIFECYCLE HOOKS =====

onMounted(() => {
  console.log('Component mounted');
  fetchData();
});

onUnmounted(() => {
  console.log('Component unmounted');
});

// Другие lifecycle hooks
import {
  onBeforeMount,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onActivated,    // для keep-alive
  onDeactivated,  // для keep-alive
  onErrorCaptured // перехват ошибок
} from 'vue';

onErrorCaptured((err, instance, info) => {
  console.error('Error captured:', err);
  return false; // Предотвращает всплытие
});

// ===== METHODS =====

function toggleActive() {
  isActive.value = !isActive.value;
}

async function fetchData() {
  state.loading = true;
  state.error = null;

  try {
    const response = await fetch(`/api/users/${props.user.id}/details`);
    if (!response.ok) throw new Error('Failed to fetch');
    state.data = await response.json();
  } catch (e) {
    state.error = (e as Error).message;
  } finally {
    state.loading = false;
  }
}

function handleDelete() {
  emit('delete', props.user.id);
}

// ===== TEMPLATE REFS =====

const inputRef = ref<HTMLInputElement | null>(null);
const childComponentRef = ref<InstanceType<typeof ChildComponent> | null>(null);

onMounted(() => {
  inputRef.value?.focus();
});

// ===== EXPOSE =====
// Определяет, что доступно родителю через ref
defineExpose({
  count,
  toggleActive,
  focusInput: () => inputRef.value?.focus()
});
</script>

<template>
  <div class="user-profile" :class="{ active: isActive }">
    <img :src="props.user.avatar || '/default-avatar.png'" :alt="fullName" />
    <h2>{{ fullName }}</h2>

    <p v-if="showEmail">{{ props.user.email }}</p>

    <input ref="inputRef" v-model="uppercaseName" />

    <div v-if="state.loading">Loading...</div>
    <div v-else-if="state.error" class="error">{{ state.error }}</div>
    <div v-else>
      <!-- content -->
    </div>

    <button @click="toggleActive">
      {{ isActive ? 'Deactivate' : 'Activate' }}
    </button>

    <button @click="handleDelete">Delete</button>
  </div>
</template>

<style scoped>
.user-profile {
  padding: 1rem;
}

.user-profile.active {
  border: 2px solid green;
}

.error {
  color: red;
}
</style>
```

---

## Composables (Vue Hooks)

Composables — функции для переиспользования логики с Composition API.

### useCounter

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);

  const doubleCount = computed(() => count.value * 2);
  const isPositive = computed(() => count.value > 0);

  function increment() {
    count.value++;
  }

  function decrement() {
    count.value--;
  }

  function reset() {
    count.value = initialValue;
  }

  function set(value: number) {
    count.value = value;
  }

  return {
    count,
    doubleCount,
    isPositive,
    increment,
    decrement,
    reset,
    set
  };
}
```

### useFetch

```typescript
// composables/useFetch.ts
import { ref, watchEffect, type Ref } from 'vue';

interface UseFetchOptions {
  immediate?: boolean;
}

interface UseFetchReturn<T> {
  data: Ref<T | null>;
  error: Ref<Error | null>;
  loading: Ref<boolean>;
  execute: () => Promise<void>;
}

export function useFetch<T = any>(
  url: string | Ref<string>,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const { immediate = true } = options;

  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | null>(null);
  const loading = ref(false);

  async function execute() {
    loading.value = true;
    error.value = null;

    try {
      const urlValue = typeof url === 'string' ? url : url.value;
      const response = await fetch(urlValue);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data.value = await response.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  // Автоматический fetch при изменении URL
  if (typeof url !== 'string') {
    watchEffect(() => {
      execute();
    });
  } else if (immediate) {
    execute();
  }

  return {
    data,
    error,
    loading,
    execute
  };
}
```

### useLocalStorage

```typescript
// composables/useLocalStorage.ts
import { ref, watch, type Ref } from 'vue';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): Ref<T> {
  // Получаем начальное значение
  const storedValue = localStorage.getItem(key);
  const initialValue = storedValue ? JSON.parse(storedValue) : defaultValue;

  const data = ref<T>(initialValue) as Ref<T>;

  // Синхронизация с localStorage
  watch(
    data,
    (newValue) => {
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    },
    { deep: true }
  );

  return data;
}
```

### useDebounce

```typescript
// composables/useDebounce.ts
import { ref, watch, type Ref } from 'vue';

export function useDebounce<T>(value: Ref<T>, delay: number = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>;

  let timeout: ReturnType<typeof setTimeout>;

  watch(value, (newValue) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}

// Использование
// const searchQuery = ref('');
// const debouncedQuery = useDebounce(searchQuery, 500);
```

### useEventListener

```typescript
// composables/useEventListener.ts
import { onMounted, onUnmounted, type Ref } from 'vue';

export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | HTMLElement | Ref<HTMLElement | null>,
  event: K,
  callback: (event: WindowEventMap[K]) => void
) {
  onMounted(() => {
    const el = 'value' in target ? target.value : target;
    el?.addEventListener(event, callback as EventListener);
  });

  onUnmounted(() => {
    const el = 'value' in target ? target.value : target;
    el?.removeEventListener(event, callback as EventListener);
  });
}
```

### useMouse

```typescript
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useMouse() {
  const x = ref(0);
  const y = ref(0);

  function update(event: MouseEvent) {
    x.value = event.clientX;
    y.value = event.clientY;
  }

  onMounted(() => {
    window.addEventListener('mousemove', update);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', update);
  });

  return { x, y };
}
```

### Использование composables

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCounter } from '@/composables/useCounter';
import { useFetch } from '@/composables/useFetch';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useDebounce } from '@/composables/useDebounce';
import { useMouse } from '@/composables/useMouse';

// Counter
const { count, increment, decrement, doubleCount } = useCounter(10);

// Fetch
const userId = ref(1);
const userUrl = computed(() => `/api/users/${userId.value}`);
const { data: user, loading, error, execute: refetch } = useFetch(userUrl);

// LocalStorage
const theme = useLocalStorage('theme', 'light');

// Mouse
const { x, y } = useMouse();

// Debounced search
const searchQuery = ref('');
const debouncedQuery = useDebounce(searchQuery, 300);
</script>

<template>
  <div>
    <h2>Counter: {{ count }} (doubled: {{ doubleCount }})</h2>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>

    <div v-if="loading">Loading user...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else-if="user">User: {{ user.name }}</div>

    <button @click="theme = theme === 'light' ? 'dark' : 'light'">
      Theme: {{ theme }}
    </button>

    <p>Mouse: {{ x }}, {{ y }}</p>

    <input v-model="searchQuery" placeholder="Search..." />
    <p>Debounced: {{ debouncedQuery }}</p>
  </div>
</template>
```

---

## Template Syntax

### Интерполяция и выражения

```vue
<template>
  <!-- Интерполяция -->
  <p>{{ message }}</p>
  <p>{{ user.name }}</p>

  <!-- Выражения -->
  <p>{{ count + 1 }}</p>
  <p>{{ ok ? 'YES' : 'NO' }}</p>
  <p>{{ message.split('').reverse().join('') }}</p>

  <!-- Вызов методов -->
  <p>{{ formatDate(date) }}</p>

  <!-- HTML (осторожно с XSS!) -->
  <div v-html="rawHtml"></div>

  <!-- Однократное связывание -->
  <p v-once>This will never change: {{ staticMessage }}</p>
</template>
```

### Директивы

```vue
<template>
  <!-- v-bind — привязка атрибутов -->
  <img v-bind:src="imageUrl" v-bind:alt="imageAlt" />
  <!-- Сокращение -->
  <img :src="imageUrl" :alt="imageAlt" />

  <!-- Динамический атрибут -->
  <button :[attributeName]="value">Click</button>

  <!-- Привязка объекта атрибутов -->
  <div v-bind="objectOfAttrs"></div>
  <!-- Где objectOfAttrs = { id: 'container', class: 'wrapper' } -->

  <!-- v-on — обработка событий -->
  <button v-on:click="handleClick">Click</button>
  <!-- Сокращение -->
  <button @click="handleClick">Click</button>

  <!-- Модификаторы событий -->
  <form @submit.prevent="onSubmit">
    <button @click.stop="onClick">Stop propagation</button>
    <input @keyup.enter="onEnter" />
    <input @keydown.ctrl.s="onSave" />
    <button @click.once="onClickOnce">Click once</button>
  </form>

  <!-- v-model — двусторонняя привязка -->
  <input v-model="message" />
  <!-- Модификаторы -->
  <input v-model.trim="message" />
  <input v-model.number="age" type="number" />
  <input v-model.lazy="message" /> <!-- Обновляется по blur -->

  <!-- v-if / v-else-if / v-else -->
  <div v-if="type === 'A'">A</div>
  <div v-else-if="type === 'B'">B</div>
  <div v-else>C</div>

  <!-- v-show (toggle display, элемент остаётся в DOM) -->
  <div v-show="isVisible">Visible</div>

  <!-- v-for — итерация -->
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>

  <!-- v-for с индексом -->
  <li v-for="(item, index) in items" :key="item.id">
    {{ index }}: {{ item.name }}
  </li>

  <!-- v-for по объекту -->
  <li v-for="(value, key, index) in object" :key="key">
    {{ index }}. {{ key }}: {{ value }}
  </li>

  <!-- v-for с range -->
  <span v-for="n in 10" :key="n">{{ n }}</span>

  <!-- v-for на template (без лишнего элемента) -->
  <template v-for="item in items" :key="item.id">
    <h3>{{ item.title }}</h3>
    <p>{{ item.description }}</p>
  </template>
</template>
```

### Привязка классов и стилей

```vue
<template>
  <!-- Объект классов -->
  <div :class="{ active: isActive, 'text-danger': hasError }"></div>

  <!-- Массив классов -->
  <div :class="[activeClass, errorClass]"></div>

  <!-- Комбинация -->
  <div :class="[{ active: isActive }, errorClass]"></div>

  <!-- Объект стилей -->
  <div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>

  <!-- Массив стилей -->
  <div :style="[baseStyles, overridingStyles]"></div>

  <!-- Авто-префиксы -->
  <div :style="{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }"></div>
</template>

<script setup>
const isActive = ref(true);
const hasError = ref(false);
const activeClass = ref('active');
const errorClass = ref('text-danger');
const activeColor = ref('red');
const fontSize = ref(14);
const baseStyles = reactive({ color: 'blue', fontSize: '14px' });
const overridingStyles = reactive({ color: 'red' });
</script>
```

### Template Refs

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ChildComponent from './ChildComponent.vue';

// Ref на DOM элемент
const inputRef = ref<HTMLInputElement | null>(null);

// Ref на компонент
const childRef = ref<InstanceType<typeof ChildComponent> | null>(null);

// Refs в v-for
const itemRefs = ref<HTMLElement[]>([]);

onMounted(() => {
  inputRef.value?.focus();
  childRef.value?.someMethod();
});

function setItemRef(el: HTMLElement, index: number) {
  itemRefs.value[index] = el;
}
</script>

<template>
  <input ref="inputRef" />

  <ChildComponent ref="childRef" />

  <ul>
    <li
      v-for="(item, index) in items"
      :key="item.id"
      :ref="(el) => setItemRef(el, index)"
    >
      {{ item.name }}
    </li>
  </ul>
</template>
```

---

## Компоненты

### Props с типами

```vue
<script setup lang="ts">
// Простое определение
const props = defineProps<{
  title: string;
  count?: number;
  items: string[];
}>();

// С дефолтами
const props = withDefaults(defineProps<{
  title: string;
  count?: number;
  disabled?: boolean;
}>(), {
  count: 0,
  disabled: false
});

// Runtime declaration (альтернатива)
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  items: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  user: {
    type: Object as PropType<User>,
    required: true,
    validator(value: User) {
      return value.id > 0;
    }
  }
});
</script>
```

### Events (Emits)

```vue
<script setup lang="ts">
// Type-based
const emit = defineEmits<{
  (e: 'update', value: string): void;
  (e: 'delete', id: number): void;
  (e: 'submit'): void;
}>();

// Или runtime
const emit = defineEmits({
  update: (value: string) => typeof value === 'string',
  delete: (id: number) => typeof id === 'number',
  submit: null // Без валидации
});

// Использование
function handleClick() {
  emit('update', 'new value');
  emit('delete', 123);
  emit('submit');
}
</script>

<template>
  <button @click="emit('submit')">Submit</button>
</template>
```

### v-model на компоненте

```vue
<!-- Parent.vue -->
<template>
  <!-- Один v-model -->
  <CustomInput v-model="searchText" />

  <!-- Несколько v-model -->
  <UserName v-model:first-name="first" v-model:last-name="last" />
</template>
```

```vue
<!-- CustomInput.vue -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

```vue
<!-- UserName.vue -->
<script setup lang="ts">
defineProps<{
  firstName: string;
  lastName: string;
}>();

defineEmits<{
  (e: 'update:firstName', value: string): void;
  (e: 'update:lastName', value: string): void;
}>();
</script>

<template>
  <input
    type="text"
    :value="firstName"
    @input="$emit('update:firstName', ($event.target as HTMLInputElement).value)"
  />
  <input
    type="text"
    :value="lastName"
    @input="$emit('update:lastName', ($event.target as HTMLInputElement).value)"
  />
</template>
```

### Slots

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <!-- Default slot -->
    <slot />

    <!-- Named slots -->
    <header v-if="$slots.header">
      <slot name="header" />
    </header>

    <main>
      <slot />
    </main>

    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>

    <!-- Slot с fallback -->
    <slot name="actions">
      <button>Default action</button>
    </slot>

    <!-- Scoped slot -->
    <ul>
      <li v-for="item in items" :key="item.id">
        <slot name="item" :item="item" :index="index">
          {{ item.name }}
        </slot>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue';

defineProps<{
  items: Array<{ id: number; name: string }>;
}>();

const slots = useSlots();

// Проверка наличия слота
const hasHeader = !!slots.header;
</script>
```

```vue
<!-- Parent.vue -->
<template>
  <Card :items="items">
    <!-- Default slot content -->
    <p>Main content</p>

    <!-- Named slot -->
    <template #header>
      <h1>Card Title</h1>
    </template>

    <!-- v-slot альтернатива -->
    <template v-slot:footer>
      <p>Footer content</p>
    </template>

    <!-- Scoped slot -->
    <template #item="{ item, index }">
      <span>{{ index + 1 }}. {{ item.name }}</span>
    </template>
  </Card>
</template>
```

### Provide / Inject

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { provide, ref, readonly } from 'vue';

const theme = ref('light');
const user = ref({ name: 'John' });

// Простое значение
provide('theme', theme);

// Readonly (рекомендуется для предотвращения мутаций)
provide('user', readonly(user));

// С функцией для изменения
provide('theme', {
  theme,
  toggleTheme: () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }
});
</script>
```

```vue
<!-- DeepChild.vue -->
<script setup lang="ts">
import { inject, type Ref } from 'vue';

// Простой inject
const theme = inject<Ref<string>>('theme');

// С дефолтом
const theme = inject('theme', ref('light'));

// С типизацией через InjectionKey
import type { InjectionKey } from 'vue';

interface ThemeContext {
  theme: Ref<string>;
  toggleTheme: () => void;
}

const themeKey: InjectionKey<ThemeContext> = Symbol('theme');

// В родителе
provide(themeKey, { theme, toggleTheme });

// В потомке
const themeContext = inject(themeKey);
</script>

<template>
  <div :class="theme">
    Current theme: {{ theme }}
    <button @click="themeContext?.toggleTheme()">Toggle</button>
  </div>
</template>
```

### Async Components

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

// Простой async компонент
const AsyncComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
);

// С опциями
const AsyncWithOptions = defineAsyncComponent({
  loader: () => import('./components/HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200, // Задержка перед показом loading
  timeout: 3000 // Таймаут загрузки
});
</script>

<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

### Teleport

```vue
<template>
  <!-- Рендерит содержимое в body -->
  <Teleport to="body">
    <div class="modal" v-if="showModal">
      <h2>Modal Title</h2>
      <p>Modal content</p>
      <button @click="showModal = false">Close</button>
    </div>
  </Teleport>

  <!-- В конкретный элемент -->
  <Teleport to="#modals-container">
    <Notification />
  </Teleport>

  <!-- Disabled teleport -->
  <Teleport to="body" :disabled="isMobile">
    <Sidebar />
  </Teleport>
</template>
```

---

## Pinia (State Management)

Pinia — официальный стейт-менеджер для Vue 3.

### Установка

```bash
npm install pinia
```

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
```

### Option Store

```typescript
// stores/counter.ts
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  // State
  state: () => ({
    count: 0,
    name: 'Counter',
    items: [] as string[]
  }),

  // Getters (computed)
  getters: {
    doubleCount: (state) => state.count * 2,

    // С использованием this
    doubleCountPlusOne(): number {
      return this.doubleCount + 1;
    },

    // С параметром
    getItemById: (state) => {
      return (id: number) => state.items[id];
    }
  },

  // Actions (methods)
  actions: {
    increment() {
      this.count++;
    },

    decrement() {
      this.count--;
    },

    async fetchItems() {
      try {
        const response = await fetch('/api/items');
        this.items = await response.json();
      } catch (error) {
        console.error('Failed to fetch items:', error);
      }
    },

    // Можно вызывать другие actions
    reset() {
      this.count = 0;
      this.items = [];
    }
  }
});
```

### Setup Store (рекомендуется)

```typescript
// stores/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface User {
  id: number;
  name: string;
  email: string;
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userName = computed(() => user.value?.name ?? 'Guest');

  // Actions
  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      user.value = await response.json();
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
  }

  async function updateProfile(data: Partial<User>) {
    if (!user.value) return;

    const response = await fetch(`/api/users/${user.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    user.value = await response.json();
  }

  // Возвращаем всё публичное
  return {
    // State
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    userName,
    // Actions
    login,
    logout,
    updateProfile
  };
});
```

### Использование Store

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

// Получение store
const counterStore = useCounterStore();
const userStore = useUserStore();

// Деструктуризация с сохранением реактивности
const { count, doubleCount } = storeToRefs(counterStore);

// Actions можно деструктурировать напрямую
const { increment, decrement } = counterStore;

// Подписка на изменения
counterStore.$subscribe((mutation, state) => {
  console.log('Store changed:', mutation.type, state);
});

// Подписка на actions
counterStore.$onAction(({ name, args, after, onError }) => {
  console.log(`Action ${name} called with args:`, args);

  after((result) => {
    console.log(`Action ${name} finished with result:`, result);
  });

  onError((error) => {
    console.error(`Action ${name} failed:`, error);
  });
});

// Сброс к начальному состоянию
function resetStore() {
  counterStore.$reset();
}

// Patch state
function patchState() {
  counterStore.$patch({
    count: 10,
    name: 'Updated Counter'
  });

  // Или с функцией
  counterStore.$patch((state) => {
    state.count++;
    state.items.push('new item');
  });
}
</script>

<template>
  <div>
    <h2>{{ counterStore.name }}: {{ count }}</h2>
    <p>Double: {{ doubleCount }}</p>

    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="resetStore">Reset</button>

    <div v-if="userStore.isAuthenticated">
      Welcome, {{ userStore.userName }}!
      <button @click="userStore.logout">Logout</button>
    </div>
    <div v-else>
      <button @click="userStore.login('test@test.com', 'password')">
        Login
      </button>
    </div>
  </div>
</template>
```

### Plugins для Pinia

```typescript
// plugins/persistedState.ts
import type { PiniaPluginContext } from 'pinia';

export function persistedStatePlugin(context: PiniaPluginContext) {
  const { store } = context;

  // Загрузка из localStorage
  const savedState = localStorage.getItem(store.$id);
  if (savedState) {
    store.$patch(JSON.parse(savedState));
  }

  // Сохранение при изменениях
  store.$subscribe((_, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state));
  });
}

// main.ts
const pinia = createPinia();
pinia.use(persistedStatePlugin);
```

---

## Vue Router

### Установка и настройка

```bash
npm install vue-router@4
```

```typescript
// router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/AboutView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/UsersView.vue'),
    children: [
      {
        path: '',
        name: 'UserList',
        component: () => import('@/views/UserListView.vue')
      },
      {
        path: ':id',
        name: 'UserDetail',
        component: () => import('@/views/UserDetailView.vue'),
        props: true // Передаёт params как props
      },
      {
        path: ':id/edit',
        name: 'UserEdit',
        component: () => import('@/views/UserEditView.vue'),
        props: true,
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
    beforeEnter: (to, from) => {
      // Route guard
      console.log('Entering dashboard');
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    // Redirect
    path: '/home',
    redirect: '/'
  },
  {
    // Alias
    path: '/profile',
    alias: '/me',
    component: () => import('@/views/ProfileView.vue')
  },
  {
    // Catch-all 404
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0 };
  }
});

// Global navigation guard
router.beforeEach((to, from) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    };
  }
});

router.afterEach((to, from) => {
  // Аналитика, обновление title и т.д.
  document.title = (to.meta.title as string) || 'My App';
});

export default router;
```

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
```

### Использование Router

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// Текущие параметры
console.log(route.params.id);
console.log(route.query.search);
console.log(route.hash);
console.log(route.meta);
console.log(route.fullPath);

// Программная навигация
function goToUser(id: number) {
  router.push({ name: 'UserDetail', params: { id } });
}

function goToSearch(query: string) {
  router.push({ path: '/search', query: { q: query } });
}

function goBack() {
  router.back();
}

function replaceRoute() {
  router.replace('/new-path'); // Без добавления в history
}
</script>

<template>
  <nav>
    <!-- Declarative navigation -->
    <RouterLink to="/">Home</RouterLink>
    <RouterLink :to="{ name: 'About' }">About</RouterLink>
    <RouterLink :to="{ name: 'UserDetail', params: { id: 1 } }">
      User 1
    </RouterLink>
    <RouterLink
      :to="{ path: '/search', query: { q: 'vue' } }"
      active-class="active"
      exact-active-class="exact-active"
    >
      Search
    </RouterLink>
  </nav>

  <!-- Route view -->
  <RouterView />

  <!-- Named views -->
  <RouterView name="sidebar" />

  <!-- С transition -->
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>

  <!-- С keep-alive -->
  <RouterView v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
```

### Navigation Guards в компоненте

```vue
<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

const hasUnsavedChanges = ref(false);

// Перед уходом со страницы
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Leave anyway?');
    if (!answer) return false;
  }
});

// При изменении параметров маршрута (тот же компонент)
onBeforeRouteUpdate((to, from) => {
  // Например, при переходе /users/1 → /users/2
  console.log('Route params changed:', from.params, '→', to.params);
});
</script>
```

---

## Nuxt 3

Nuxt — мета-фреймворк на базе Vue для создания SSR/SSG приложений.

### Установка

```bash
npx nuxi@latest init my-nuxt-app
cd my-nuxt-app
npm install
npm run dev
```

### Структура проекта

```
my-nuxt-app/
├── .nuxt/                    # Генерируется автоматически
├── assets/                   # CSS, шрифты и т.д.
├── components/               # Авто-импорт компонентов
│   ├── AppHeader.vue
│   └── ui/
│       └── Button.vue        # <UiButton />
├── composables/              # Авто-импорт composables
│   └── useAuth.ts
├── layouts/                  # Layouts
│   ├── default.vue
│   └── admin.vue
├── middleware/               # Route middleware
│   └── auth.ts
├── pages/                    # File-based routing
│   ├── index.vue             # /
│   ├── about.vue             # /about
│   ├── users/
│   │   ├── index.vue         # /users
│   │   └── [id].vue          # /users/:id
│   └── [...slug].vue         # Catch-all
├── plugins/                  # Plugins
│   └── analytics.ts
├── public/                   # Статические файлы
├── server/                   # Server routes (API)
│   ├── api/
│   │   └── users.ts          # /api/users
│   └── middleware/
│       └── log.ts
├── stores/                   # Pinia stores
├── app.vue                   # Корневой компонент
├── nuxt.config.ts            # Конфигурация
└── error.vue                 # Страница ошибки
```

### Pages и Routing

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <h1>Home Page</h1>
    <NuxtLink to="/about">About</NuxtLink>
    <NuxtLink :to="{ name: 'users-id', params: { id: 1 } }">User 1</NuxtLink>
  </div>
</template>
```

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const userId = computed(() => route.params.id);

// Data fetching
const { data: user, pending, error } = await useFetch(`/api/users/${userId.value}`);
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <h1>{{ user?.name }}</h1>
    <p>{{ user?.email }}</p>
  </div>
</template>
```

### Data Fetching

```vue
<script setup lang="ts">
// useFetch — для запросов к API
const { data, pending, error, refresh } = await useFetch('/api/users', {
  // Опции
  method: 'GET',
  query: { page: 1 },
  headers: { 'Authorization': 'Bearer token' },
  // Трансформация ответа
  transform: (data) => data.users,
  // Ключ для кеширования
  key: 'users-list',
  // Lazy — не блокирует навигацию
  lazy: true,
  // Server-only
  server: true,
  // Только на клиенте
  client: true
});

// useAsyncData — для произвольных async операций
const { data: posts } = await useAsyncData('posts', () => {
  return $fetch('/api/posts');
});

// useLazyFetch — не блокирует навигацию
const { data, pending } = useLazyFetch('/api/data');

// $fetch — простой fetch wrapper
async function createUser(userData: User) {
  const user = await $fetch('/api/users', {
    method: 'POST',
    body: userData
  });
  return user;
}
</script>
```

### Layouts

```vue
<!-- layouts/default.vue -->
<template>
  <div class="layout-default">
    <AppHeader />

    <main>
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
```

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="layout-admin">
    <AdminSidebar />

    <div class="content">
      <slot />
    </div>
  </div>
</template>
```

```vue
<!-- pages/dashboard.vue -->
<script setup>
// Использование layout
definePageMeta({
  layout: 'admin'
});
</script>

<template>
  <div>Admin Dashboard</div>
</template>
```

### Server Routes (API)

```typescript
// server/api/users.ts
export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    // Получение query params
    const query = getQuery(event);
    const page = Number(query.page) || 1;

    const users = await db.users.findMany({
      skip: (page - 1) * 10,
      take: 10
    });

    return users;
  }

  if (method === 'POST') {
    // Получение body
    const body = await readBody(event);

    const user = await db.users.create({
      data: body
    });

    return user;
  }
});
```

```typescript
// server/api/users/[id].ts
export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);

  const user = await db.users.findUnique({
    where: { id }
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    });
  }

  return user;
});
```

### Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUserStore();

  if (!user.isAuthenticated) {
    return navigateTo('/login');
  }
});
```

```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  middleware: 'auth'
  // или inline
  // middleware: [(to, from) => { ... }]
});
</script>
```

### Composables в Nuxt

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState<User | null>('user', () => null);

  const isAuthenticated = computed(() => !!user.value);

  async function login(email: string, password: string) {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    user.value = data.user;
  }

  function logout() {
    user.value = null;
    navigateTo('/login');
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  };
};
```

### SEO и Meta

```vue
<script setup>
// Статический title
useHead({
  title: 'My Page Title',
  meta: [
    { name: 'description', content: 'Page description' }
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/page' }
  ]
});

// Динамический title
const title = computed(() => `${user.value?.name} - Profile`);

useHead({
  title
});

// SEO
useSeoMeta({
  title: 'My Page',
  ogTitle: 'My Page',
  description: 'Description',
  ogDescription: 'Description',
  ogImage: 'https://example.com/image.png',
  twitterCard: 'summary_large_image'
});
</script>
```

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Modules
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt'
  ],

  // Runtime config (доступен через useRuntimeConfig())
  runtimeConfig: {
    // Только сервер
    apiSecret: process.env.API_SECRET,
    // Публичные (доступны на клиенте)
    public: {
      apiBase: process.env.API_BASE_URL
    }
  },

  // App config
  app: {
    head: {
      title: 'My Nuxt App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // Vite config
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/variables" as *;'
        }
      }
    }
  },

  // TypeScript
  typescript: {
    strict: true
  },

  // Prerender pages
  nitro: {
    prerender: {
      routes: ['/sitemap.xml']
    }
  }
});
```

---

## Best Practices

### 1. Структура проекта

```
src/
├── assets/           # Статические ресурсы
├── components/
│   ├── ui/           # Базовые UI компоненты
│   │   ├── BaseButton.vue
│   │   ├── BaseInput.vue
│   │   └── BaseModal.vue
│   └── features/     # Feature компоненты
│       └── UserCard.vue
├── composables/      # Composition API хуки
├── stores/           # Pinia stores
├── views/            # Страницы
├── router/           # Vue Router
├── services/         # API сервисы
├── types/            # TypeScript типы
└── utils/            # Утилиты
```

### 2. Naming Conventions

```vue
<!-- Компоненты: PascalCase -->
<template>
  <UserProfile />
  <BaseButton />
</template>

<!-- Props: camelCase в JS, kebab-case в template -->
<UserCard :user-name="name" :is-active="active" />

<!-- Events: kebab-case -->
<UserCard @update-user="handleUpdate" />

<!-- Composables: use prefix -->
useAuth, useFetch, useCounter

<!-- Stores: use + Store suffix -->
useUserStore, useCartStore
```

### 3. TypeScript

```typescript
// Всегда типизируйте props
const props = defineProps<{
  user: User;
  loading?: boolean;
}>();

// Типизируйте emits
const emit = defineEmits<{
  (e: 'update', user: User): void;
}>();

// Типизируйте composables
function useUser(id: number): {
  user: Ref<User | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
} {
  // ...
}
```

### 4. Производительность

```vue
<script setup>
// v-once для статического контента
// v-memo для мемоизации
// shallowRef/shallowReactive для больших данных
const largeList = shallowRef([]);

// Используйте key в v-for
// Используйте computed вместо методов для кешированных вычислений
// Lazy loading компонентов
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);
</script>

<template>
  <!-- v-memo для оптимизации -->
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.updated]">
    {{ item.name }}
  </div>
</template>
```

### 5. Реактивность

```typescript
// ✅ Правильно
const user = ref<User | null>(null);
user.value = newUser;

// ❌ Неправильно — теряется реактивность
let user = reactive({ name: 'John' });
user = { name: 'Jane' }; // НЕ РАБОТАЕТ

// ✅ Правильно для reactive
const user = reactive({ name: 'John' });
Object.assign(user, { name: 'Jane' });
// или
user.name = 'Jane';

// Деструктуризация с сохранением реактивности
const { count } = storeToRefs(store); // ✅
const { count } = store; // ❌ Теряет реактивность
```

---

## Полезные ресурсы

- [Vue.js Documentation](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Nuxt 3](https://nuxt.com/)
- [VueUse](https://vueuse.org/) — Коллекция composables
- [Vue DevTools](https://devtools.vuejs.org/)
- [Awesome Vue](https://github.com/vuejs/awesome-vue)
