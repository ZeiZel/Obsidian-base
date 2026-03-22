---
tags:
  - frontend
  - microfrontends
  - nx
  - module-federation
---

## Микрофронтенды

Микрофронтенды - архитектурный подход, при котором фронтенд-приложение разбивается на независимые модули, каждый из которых разрабатывается, тестируется и деплоится отдельной командой. По сути это перенос идеи микросервисов на клиентскую часть.

Когда стоит использовать микрофронтенды:

- Несколько команд работают над одним продуктом и блокируют друг друга при общем релизном цикле
- Приложение выросло до такого размера, что время сборки и тестирования стало критичным
- Нужна возможность деплоить отдельные части UI независимо
- Команды используют разные фреймворки или версии одного фреймворка

Когда микрофронтенды не нужны:

- Маленькая команда из 3-5 разработчиков
- Простое приложение с несколькими страницами
- Нет потребности в независимом деплое

> [!important]
> Микрофронтенды добавляют существенную сложность в инфраструктуру и DX. Если проблема решается разделением на библиотеки внутри монорепозитория - это почти всегда лучший вариант.

### Подходы к реализации

| Подход | Изоляция | Производительность | Сложность | Шаринг зависимостей |
|--------|----------|-------------------|-----------|---------------------|
| iframe | Полная | Низкая | Низкая | Невозможен |
| Module Federation | Частичная | Высокая | Средняя | Встроен |
| Import Maps | Частичная | Средняя | Средняя | Ручной |
| Web Components | Полная (Shadow DOM) | Средняя | Высокая | Ручной |

iframe - самый простой вариант. Каждый микрофронтенд загружается в отдельный iframe. Полная изоляция стилей и JS, но крайне плохой UX: проблемы с навигацией, перформансом, адаптивностью. Подходит только для встраивания полностью автономных виджетов.

Module Federation - на сегодня стандарт индустрии. Позволяет загружать JS-модули из другого приложения в рантайме, делиться общими зависимостями. Интегрирован в Webpack 5 и Rspack.

Import Maps - нативный браузерный механизм маппинга имён модулей на URL. Хорошо работает с single-spa, но требует ручного управления версиями.

Web Components - создание изолированных компонентов через Custom Elements и Shadow DOM. Фреймворко-агностичный подход, но сложная интеграция с React/Vue и проблемы с SSR.

---

## Module Federation

**Module Federation** - плагин для Webpack 5 и Rspack, позволяющий одному JavaScript-приложению динамически загружать код из другого приложения в рантайме. Каждое приложение собирается независимо и может экспортировать/импортировать модули без пересборки потребителя.

### Ключевые концепции

Host (consumer) - приложение, которое загружает модули из других приложений. Обычно это shell-приложение с общим layout, навигацией и маршрутизацией.

Remote (producer) - приложение, которое экспортирует свои модули для использования другими. Каждый remote собирается отдельно и деплоится на свой URL.

Shared dependencies - библиотеки, которые используются и host, и remote. Module Federation позволяет загрузить их один раз вместо дублирования в каждом бандле. Типичные shared: `react`, `react-dom`, `react-router-dom`.

Exposed modules - конкретные модули, которые remote делает доступными для потребителей. Определяются в конфигурации через ключ `exposes`.

### Как это работает

1. Remote собирается и генерирует `remoteEntry.js` - манифест, описывающий доступные модули и их зависимости
2. Host загружает `remoteEntry.js` при инициализации
3. Когда host запрашивает модуль из remote, Module Federation проверяет shared-зависимости и загружает только недостающий код
4. Загруженный модуль интегрируется в граф зависимостей host-приложения как обычный import

```
Host App                    Remote App
┌─────────────────┐        ┌─────────────────┐
│  Shell / Layout  │        │  Products Page   │
│  Router          │        │  components/     │
│  Auth            │◄───────│  remoteEntry.js  │
│                  │  load  │                  │
│  shared: react   │◄──────►│  shared: react   │
│          router  │  skip  │          router  │
└─────────────────┘        └─────────────────┘
```

### Module Federation 2.0

Начиная с версии 2.0, Module Federation получил новую runtime-архитектуру, отвязанную от конкретного сборщика. Поддерживается и Webpack, и Rspack из коробки.

Нововведения v2.0:

- Runtime Plugins - расширение поведения federation через плагины на уровне рантайма, без пересборки
- Dynamic Type Hints - автоматическая генерация TypeScript-типов для remote-модулей в директорию `@mf-types`
- Chrome DevTools - расширение для отладки federation-графа
- Preloading - предзагрузка remote-модулей до их фактического использования
- Decoupled Runtime - единый рантайм для Webpack и Rspack, можно мигрировать без переписывания конфигов

Для использования v2.0 необходим пакет `@module-federation/enhanced`:

```bash
npm install @module-federation/enhanced
```

> [!info]
> Rspack обеспечивает 5-10x ускорение сборки federated-приложений по сравнению с Webpack. При использовании Nx 22+ Rspack является бандлером по умолчанию для React-проектов с Module Federation.

---

## NX 22 Workspace

Nx - система сборки для монорепозиториев с первоклассной поддержкой Module Federation. Nx берёт на себя генерацию конфигурации, настройку dev-сервера, кеширование сборок и оркестрацию remote-приложений.

Что даёт Nx для микрофронтендов:

- Генераторы для создания host и remote приложений одной командой
- Автоматическая настройка Module Federation, роутинга и shared-зависимостей
- Dev-сервер, который поднимает host и все remotes одновременно
- Affected-команды для CI - пересобираются только изменённые приложения
- Кеширование сборок локально и удалённо через Nx Cloud
- Type safety между host и remote через автогенерацию типов

### Предварительные требования

- Node.js 20+
- npm, yarn или pnpm

### Создание workspace

```bash
npx create-nx-workspace@latest my-mfe --preset=apps
```

Preset `apps` создаёт пустой workspace без привязки к фреймворку. Далее устанавливаем плагин для React:

```bash
cd my-mfe
npm install -D @nx/react @nx/rspack
```

### Структура workspace

```
my-mfe/
├── apps/                  # host и remote приложения
├── libs/                  # shared библиотеки
├── nx.json                # конфигурация Nx
├── tsconfig.base.json     # общие настройки TypeScript
└── package.json
```

### nx.json

Минимальная конфигурация для Module Federation проекта:

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "serve": {
      "dependsOn": ["^build"]
    }
  },
  "defaultBase": "main",
  "plugins": [
    "@nx/rspack/plugin"
  ]
}
```

Плагин `@nx/rspack/plugin` автоматически определяет targets `build` и `serve` для приложений с `rspack.config.ts`.

---

## Создание Host-приложения

### Генерация host с remotes

Самый быстрый способ - создать host и все remotes одной командой:

```bash
npx nx g @nx/react:host apps/shell --remotes=products,cart
```

Эта команда создаст три приложения: `shell` (host), `products` и `cart` (remotes). Nx автоматически настроит Module Federation, маршрутизацию и порты dev-серверов.

### Структура host-приложения

```
apps/shell/
├── src/
│   ├── app/
│   │   ├── app.tsx            # корневой компонент с роутингом
│   │   └── nx-welcome.tsx
│   ├── bootstrap.tsx          # асинхронная инициализация для MF
│   ├── main.ts                # точка входа
│   └── remotes.d.ts           # типы для remote-модулей
├── module-federation.config.ts
├── rspack.config.ts
├── rspack.config.prod.ts
└── project.json
```

### module-federation.config.ts (host)

```typescript
import { ModuleFederationConfig } from '@nx/rspack/module-federation';

const config: ModuleFederationConfig = {
  name: 'shell',
  remotes: ['products', 'cart'],
};

export default config;
```

### rspack.config.ts (host)

```typescript
import { composePlugins, withNx, withReact } from '@nx/rspack';
import {
  withModuleFederation,
} from '@nx/rspack/module-federation';
import baseConfig from './module-federation.config';

export default composePlugins(
  withNx(),
  withReact(),
  withModuleFederation(baseConfig)
);
```

> [!info]
> Начиная с Nx 21+, доступен `NxModuleFederationPlugin` - Rspack-плагин, заменяющий `withModuleFederation`. Он добавляется напрямую в `plugins: []` в rspack.config и обеспечивает более стандартную конфигурацию.

### Настройка shell layout

Файл `apps/shell/src/app/app.tsx` - корневой компонент host-приложения. Здесь размещается общий layout и маршрутизация к remote-приложениям:

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

const Products = lazy(() => import('products/Module'));
const Cart = lazy(() => import('cart/Module'));

export function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/cart">Cart</Link>
      </nav>

      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<h1>Shell Home</h1>} />
            <Route path="/products/*" element={<Products />} />
            <Route path="/cart/*" element={<Cart />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}

export default App;
```

### bootstrap.tsx

Module Federation требует асинхронной загрузки приложения. Nx генерирует этот файл автоматически:

```typescript
// src/main.ts
import('./bootstrap');

// src/bootstrap.tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Разделение на `main.ts` и `bootstrap.tsx` необходимо для корректной инициализации shared-зависимостей перед рендерингом.

### Запуск

```bash
# Все remotes собираются статически, host с HMR
npx nx serve shell

# Products поднимается с HMR, остальные - статически
npx nx serve shell --devRemotes=products
```

---

## Создание Remote-приложения

### Генерация remote

Если remote не был создан вместе с host, его можно добавить отдельно:

```bash
npx nx g @nx/react:remote apps/checkout --host=shell
```

Флаг `--host=shell` автоматически зарегистрирует новый remote в конфигурации host-приложения.

### Структура remote-приложения

```
apps/products/
├── src/
│   ├── app/
│   │   ├── app.tsx
│   │   └── nx-welcome.tsx
│   ├── bootstrap.tsx
│   ├── main.ts
│   └── remote-entry.ts       # точка входа для federation
├── module-federation.config.ts
├── rspack.config.ts
└── project.json
```

### module-federation.config.ts (remote)

```typescript
import { ModuleFederationConfig } from '@nx/rspack/module-federation';

const config: ModuleFederationConfig = {
  name: 'products',
  exposes: {
    './Module': './src/remote-entry.ts',
  },
};

export default config;
```

Ключ `exposes` определяет, какие модули будут доступны host-приложению. `./Module` - это алиас, по которому host обращается к remote.

### remote-entry.ts

```typescript
import App from './app/app';

export default App;
```

### Компоненты remote-приложения

Внутри remote разрабатываются обычные React-компоненты. Пример страницы продуктов:

```tsx
// apps/products/src/app/app.tsx
import { Route, Routes } from 'react-router-dom';
import { ProductList } from './product-list';
import { ProductDetail } from './product-detail';

export function App() {
  return (
    <Routes>
      <Route index element={<ProductList />} />
      <Route path=":id" element={<ProductDetail />} />
    </Routes>
  );
}

export default App;
```

### Независимая разработка

Каждый remote можно запустить как standalone-приложение:

```bash
npx nx serve products
```

Remote запустится на своём порту и будет доступен как отдельное приложение. Это позволяет команде, отвечающей за products, разрабатывать свой модуль без зависимости от shell.

### Независимый деплой

Remote собирается отдельно и деплоится на свой URL:

```bash
npx nx build products
```

Host загрузит `remoteEntry.js` с этого URL в рантайме. Обновление remote не требует пересборки host.

---

## Shared State и Communication

### Shared-библиотеки в NX

Nx позволяет создавать shared-библиотеки, доступные всем приложениям в workspace:

```bash
# Библиотека общих типов и утилит
npx nx g @nx/react:library libs/shared/types --buildable

# Библиотека UI-компонентов
npx nx g @nx/react:library libs/shared/ui --buildable

# Библиотека для работы с состоянием
npx nx g @nx/react:library libs/shared/state --buildable
```

Флаг `--buildable` позволяет собирать библиотеку отдельно и кешировать результат. Для публикации в npm используется `--publishable`.

Структура shared-библиотек:

```
libs/
├── shared/
│   ├── types/           # общие TypeScript-типы и интерфейсы
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── product.ts
│   │       │   └── user.ts
│   │       └── index.ts
│   ├── ui/              # дизайн-система, общие компоненты
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── button.tsx
│   │       │   └── modal.tsx
│   │       └── index.ts
│   └── state/           # shared state management
│       └── src/
│           ├── lib/
│           │   └── auth-store.ts
│           └── index.ts
```

Импорт через path aliases, настроенные в `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@my-mfe/shared/types": ["libs/shared/types/src/index.ts"],
      "@my-mfe/shared/ui": ["libs/shared/ui/src/index.ts"],
      "@my-mfe/shared/state": ["libs/shared/state/src/index.ts"]
    }
  }
}
```

### Cross-app State Management

Для управления состоянием между микрофронтендами есть несколько паттернов. Выбор зависит от того, насколько тесно связаны приложения.

Shared Zustand Store - подходит когда все микрофронтенды на React:

```typescript
// libs/shared/state/src/lib/auth-store.ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

Zustand-стор подключается через shared-библиотеку. Module Federation обеспечивает, что все приложения используют один экземпляр zustand через механизм singleton shared dependencies.

### Event Bus

Для фреймворко-агностичной коммуникации - паттерн Event Bus через Custom Events:

```typescript
// libs/shared/state/src/lib/event-bus.ts
type EventHandler<T = unknown> = (payload: T) => void;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);

    // Возвращаем функцию отписки
    return () => {
      this.handlers.get(event)?.delete(handler as EventHandler);
    };
  }

  emit<T>(event: string, payload: T): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

// Singleton - один экземпляр на всё приложение
export const eventBus = new EventBus();
```

Использование в компонентах:

```tsx
// В remote "products"
import { eventBus } from '@my-mfe/shared/state';

function AddToCartButton({ product }: { product: Product }) {
  const handleClick = () => {
    eventBus.emit('cart:add', { productId: product.id, quantity: 1 });
  };

  return <button onClick={handleClick}>Add to cart</button>;
}

// В remote "cart"
import { useEffect, useState } from 'react';
import { eventBus } from '@my-mfe/shared/state';

function CartWidget() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const unsubscribe = eventBus.on<CartEvent>('cart:add', (payload) => {
      setItems((prev) => [...prev, payload]);
    });

    return unsubscribe;
  }, []);

  return <span>Cart: {items.length} items</span>;
}
```

### Shared Authentication

Аутентификация реализуется в host-приложении и транслируется в remotes через shared-библиотеку:

```typescript
// libs/shared/state/src/lib/auth-provider.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from './auth-store';

const AuthContext = createContext<ReturnType<typeof useAuthStore> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

Host оборачивает всё приложение в `AuthProvider`, а remotes используют `useAuth()` для доступа к данным пользователя и токену.

---

## Deployment и CI/CD

### Стратегия независимого деплоя

Каждый remote деплоится отдельно и доступен по своему URL. Host знает URL каждого remote и загружает `remoteEntry.js` в рантайме.

```
CDN / Static Hosting
├── shell.example.com       → shell (host)
├── products.example.com    → products remote
├── cart.example.com        → cart remote
└── checkout.example.com    → checkout remote
```

### NX Affected

Nx определяет, какие приложения затронуты изменениями, и запускает сборку/тесты только для них:

```bash
# Показать затронутые проекты
npx nx affected --target=build --base=main --head=HEAD

# Собрать только изменённые
npx nx affected --target=build

# Протестировать только изменённые
npx nx affected --target=test
```

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - uses: nrwl/nx-set-shas@v4

      - run: npx nx affected --target=lint
      - run: npx nx affected --target=test
      - run: npx nx affected --target=build
```

Шаг `nx-set-shas` определяет базовый коммит для вычисления affected. Это обеспечивает правильное сравнение на CI, где не всегда доступна полная история git.

### Docker

Каждый remote собирается в свой Docker-образ:

```dockerfile
# apps/products/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nx build products

FROM nginx:alpine
COPY --from=builder /app/dist/apps/products /usr/share/nginx/html
COPY apps/products/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# apps/products/nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Access-Control-Allow-Origin *;
    }

    location ~* \.(?:js|css|woff2?|svg|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> [!important]
> Для Module Federation необходимы правильные CORS-заголовки. Host загружает `remoteEntry.js` с другого домена, поэтому remote-сервер должен отдавать `Access-Control-Allow-Origin`.

### Environment Configuration

URL remote-приложений передаются через переменные окружения:

```typescript
// apps/shell/src/environments/environment.ts
export const environment = {
  production: false,
  remotes: {
    products: 'http://localhost:4201',
    cart: 'http://localhost:4202',
  },
};

// apps/shell/src/environments/environment.prod.ts
export const environment = {
  production: true,
  remotes: {
    products: 'https://products.example.com',
    cart: 'https://cart.example.com',
  },
};
```

---

## Продвинутые паттерны

### Dynamic Remotes

Вместо указания remotes на этапе сборки можно загружать их динамически в рантайме. Это позволяет добавлять новые remotes без пересборки host.

```typescript
// apps/shell/src/utils/load-remote.ts
import { init, loadRemote } from '@module-federation/enhanced/runtime';

init({
  name: 'shell',
  remotes: [],
});

export async function loadDynamicRemote(
  remoteName: string,
  remoteUrl: string,
  modulePath: string
) {
  // Регистрируем remote в рантайме
  __FEDERATION__.__INSTANCES__[0].moduleCache.clear();

  return loadRemote(`${remoteName}/${modulePath}`);
}
```

Практичнее - загрузка конфигурации remotes из API:

```tsx
// apps/shell/src/app/dynamic-remote-loader.tsx
import { lazy, Suspense, useEffect, useState, ComponentType } from 'react';

interface RemoteConfig {
  name: string;
  url: string;
  module: string;
}

function useDynamicRemote(config: RemoteConfig) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const container = await loadRemoteContainer(config.url, config.name);
        const factory = await container.get(config.module);
        const module = factory();
        setComponent(() => module.default);
      } catch (err) {
        setError(err as Error);
      }
    }
    load();
  }, [config]);

  return { Component, error };
}

async function loadRemoteContainer(url: string, scope: string) {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });

  const container = (window as Record<string, unknown>)[scope] as {
    init: (shared: unknown) => Promise<void>;
    get: (module: string) => Promise<() => { default: ComponentType }>;
  };

  await container.init(__webpack_share_scopes__.default);
  return container;
}
```

### Fallback UI

Когда remote недоступен, приложение должно деградировать грациозно, а не падать:

```tsx
// libs/shared/ui/src/lib/remote-boundary.tsx
import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  fallback: ReactNode;
  remoteName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class RemoteBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `Remote "${this.props.remoteName}" failed to load:`,
      error,
      info
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

Использование в host:

```tsx
import { lazy, Suspense } from 'react';
import { RemoteBoundary } from '@my-mfe/shared/ui';

const Products = lazy(() => import('products/Module'));

function ProductsRoute() {
  return (
    <RemoteBoundary
      remoteName="products"
      fallback={
        <div>
          <p>Products service is temporarily unavailable</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      }
    >
      <Suspense fallback={<div>Loading products...</div>}>
        <Products />
      </Suspense>
    </RemoteBoundary>
  );
}
```

### Shared Design System

Дизайн-система выносится в отдельную shared-библиотеку, которая автоматически шарится через Module Federation:

```bash
npx nx g @nx/react:library libs/shared/design-system --buildable
```

```typescript
// libs/shared/design-system/src/index.ts
export { Button } from './lib/button';
export { Input } from './lib/input';
export { Modal } from './lib/modal';
export { theme } from './lib/theme';
export type { Theme } from './lib/theme';
```

Module Federation автоматически пометит эту библиотеку как shared singleton, если она импортируется в нескольких приложениях.

### Monorepo vs Polyrepo

| Критерий | Monorepo (Nx) | Polyrepo |
|----------|--------------|----------|
| Shared code | Через библиотеки и path aliases | Через npm-пакеты |
| Версионирование | Единая версия, atomic commits | Независимые версии |
| CI/CD | Nx affected, единый пайплайн | Отдельные пайплайны |
| Рефакторинг | Проще, всё в одном месте | Сложнее, несколько репозиториев |
| Масштабирование команд | До 10-15 команд | Без ограничений |
| Onboarding | Сложнее (большая кодовая база) | Проще (изолированный контекст) |

> [!summary]
> Для большинства проектов monorepo с Nx - оптимальный выбор. Polyrepo имеет смысл при полной автономии команд с разными tech stack и отсутствии shared-кода. На практике начинать лучше с monorepo и разделять только когда появятся реальные проблемы масштабирования.

### Performance

Оптимизация загрузки:

- Предзагрузка remoteEntry.js через `<link rel="preload">` в HTML host-приложения
- Prefetch remote-модулей при hover на ссылки навигации
- Разделение remote на чанки - не загружать весь remote целиком при первом обращении
- Shared dependencies с `eager: true` для критических библиотек (react, react-dom), чтобы избежать лишнего round-trip

Мониторинг:

- Отслеживание времени загрузки каждого remote через Performance API
- Настройка алертов на увеличение размера remoteEntry.js
- Web Vitals для каждого route, привязанного к конкретному remote

```typescript
// Замер загрузки remote
const start = performance.now();
const Products = await import('products/Module');
const loadTime = performance.now() - start;

console.log(`Products remote loaded in ${loadTime.toFixed(0)}ms`);
```
