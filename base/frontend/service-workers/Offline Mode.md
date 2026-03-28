---
tags:
  - frontend
  - offline
  - service-worker
  - pwa
---
## Offline Mode

Offline mode позволяет приложению работать без интернета. Основа реализации - Service Worker для кэширования ресурсов и IndexedDB для хранения данных. Подход универсален и не зависит от фреймворка, потому что Service Worker работает на уровне браузера, ниже любого фреймворка.

React, Next.js, Angular, Vue, Svelte - все используют один и тот же Service Worker API. Различия есть только в интеграции с билд-системой (как подключить SW к проекту), но сам offline-функционал реализуется одинаково.

> [!summary]
> Фреймворк-специфичной реализации offline mode не существует. Service Worker, Cache API и IndexedDB - это browser API, которые одинаково работают независимо от фреймворка. Ниже - универсальный подход, применимый к любому проекту.

## Архитектура offline-приложения

```
┌─────────────────────────────────────────────────┐
│  Приложение (React/Vue/Angular/Svelte/Next.js)  │
├─────────────────────────────────────────────────┤
│  IndexedDB (данные, очередь offline-запросов)     │
├─────────────────────────────────────────────────┤
│  Service Worker (кэш ресурсов, перехват запросов)│
├─────────────────────────────────────────────────┤
│  Cache API (статика, API-ответы)                 │
└─────────────────────────────────────────────────┘
```

## Полная реализация

### 1. Service Worker с offline-стратегиями

```javascript
// sw.js
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Ресурсы для предварительного кэширования (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/app.js',
  '/offline.html',
  '/icons/icon-192.png',
];

// Установка: кэшируем app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Активация: чистим устаревшие кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.endsWith(CACHE_VERSION) === false)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: маршрутизация по типу запроса
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Навигация (HTML) - Network First с offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // API запросы - Network First, сохраняем последний успешный ответ
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (request.method === 'GET') {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.method === 'GET') {
            return caches.match(request);
          }
          // POST/PUT/DELETE offline - сохраняем в очередь
          return new Response(
            JSON.stringify({ offline: true, queued: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Статика (JS, CSS, изображения) - Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
```

### 2. Очередь offline-запросов через IndexedDB

Когда пользователь отправляет данные без сети, запросы сохраняются в IndexedDB и выполняются при восстановлении соединения.

```javascript
// offline-queue.js
class OfflineQueue {
  constructor(dbName = 'offline-queue') {
    this.dbName = dbName;
    this.dbPromise = this.openDB();
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('requests')) {
          db.createObjectStore('requests', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async enqueue(request) {
    const db = await this.dbPromise;
    const tx = db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');

    store.add({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.clone().text() : null,
      timestamp: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }

  async flush() {
    const db = await this.dbPromise;
    const tx = db.transaction('requests', 'readonly');
    const store = tx.objectStore('requests');

    return new Promise((resolve) => {
      store.getAll().onsuccess = async (event) => {
        const requests = event.target.result;

        for (const req of requests) {
          try {
            await fetch(req.url, {
              method: req.method,
              headers: req.headers,
              body: req.body,
            });
            await this.remove(req.id);
          } catch {
            break; // сеть снова упала - прекращаем
          }
        }

        resolve();
      };
    });
  }

  async remove(id) {
    const db = await this.dbPromise;
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').delete(id);
  }
}
```

### 3. Детекция online/offline и хук для приложения

Универсальный модуль, который работает в любом фреймворке:

```javascript
// network-status.js
class NetworkStatus {
  constructor() {
    this.listeners = new Set();
    this.online = navigator.onLine;

    window.addEventListener('online', () => this.update(true));
    window.addEventListener('offline', () => this.update(false));
  }

  update(status) {
    this.online = status;
    this.listeners.forEach((fn) => fn(status));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  isOnline() {
    return this.online;
  }
}

export const networkStatus = new NetworkStatus();
```

Интеграция с фреймворком - тонкая обёртка поверх универсального модуля:

```typescript
// React: useNetworkStatus.ts
import { useSyncExternalStore } from 'react';
import { networkStatus } from './network-status';

export function useNetworkStatus() {
  return useSyncExternalStore(
    (cb) => networkStatus.subscribe(cb),
    () => networkStatus.isOnline()
  );
}

// Использование
function App() {
  const isOnline = useNetworkStatus();

  return (
    <div>
      {!isOnline && <OfflineBanner />}
      <MainContent />
    </div>
  );
}
```

```typescript
// Vue: useNetworkStatus.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { networkStatus } from './network-status';

export function useNetworkStatus() {
  const online = ref(networkStatus.isOnline());
  let unsub: () => void;

  onMounted(() => {
    unsub = networkStatus.subscribe((status) => {
      online.value = status;
    });
  });
  onUnmounted(() => unsub?.());

  return online;
}
```

```typescript
// Angular: network-status.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService implements OnDestroy {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  readonly online$ = this.onlineSubject.asObservable();

  private onOnline = () => this.onlineSubject.next(true);
  private onOffline = () => this.onlineSubject.next(false);

  constructor() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}
```

```typescript
// Svelte: network-status.svelte.ts
import { networkStatus } from './network-status';

export function createNetworkStatus() {
  let online = $state(networkStatus.isOnline());

  $effect(() => {
    return networkStatus.subscribe((status) => {
      online = status;
    });
  });

  return {
    get online() { return online; },
  };
}
```

### 4. Регистрация SW и Background Sync

```javascript
// register-sw.js
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.register('/sw.js');

  // Регистрируем Background Sync для offline-очереди
  if ('sync' in registration) {
    navigator.serviceWorker.ready.then((reg) => {
      // Sync сработает при восстановлении сети
      reg.sync.register('flush-offline-queue');
    });
  }

  return registration;
}

// sw.js (дополнение)
self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-offline-queue') {
    event.waitUntil(flushOfflineQueue());
  }
});

async function flushOfflineQueue() {
  // Открываем IndexedDB и отправляем накопленные запросы
  const db = await openDB();
  const tx = db.transaction('requests', 'readonly');
  const store = tx.objectStore('requests');

  const requests = await getAllFromStore(store);

  for (const req of requests) {
    try {
      await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      await removeFromDB(req.id);
    } catch {
      break;
    }
  }
}
```

### 5. Offline-страница

```html
<!-- offline.html -->
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Offline</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: system-ui, sans-serif;
      background: #f5f5f5;
      margin: 0;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; color: #333; }
    p { color: #666; }
    button {
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 4px;
      background: #4a90d9;
      color: white;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Нет подключения к интернету</h1>
    <p>Контент из кэша может быть доступен на других страницах</p>
    <button onclick="window.location.reload()">Попробовать снова</button>
  </div>
</body>
</html>
```

## Workbox: промышленная реализация

Workbox от Google - библиотека, которая упрощает работу с Service Worker. Вместо ручного написания стратегий кэширования, Workbox предоставляет готовые модули.

```bash
npm install workbox-webpack-plugin  # для Webpack
# или
npm install workbox-build            # для любого билдера
```

### Workbox с ручным SW

```javascript
// sw.js с Workbox
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Прекэширование статики (инжектится билдером)
precacheAndRoute(self.__WB_MANIFEST);

// Изображения: Cache First, до 100 штук, до 30 дней
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// API GET: Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

// API POST/PUT/DELETE: Background Sync
const bgSyncPlugin = new BackgroundSyncPlugin('api-mutations', {
  maxRetentionTime: 24 * 60, // хранить запросы до 24 часов
});

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method !== 'GET',
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'POST' // метод маршрута
);

// Шрифты: Cache First с долгим сроком
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);
```

### Интеграция Workbox с билдерами

Для Vite:

```bash
npm install vite-plugin-pwa -D
```

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      manifest: {
        name: 'My App',
        short_name: 'App',
        theme_color: '#ffffff',
      },
    }),
  ],
};
```

> [!info]
> `vite-plugin-pwa` работает одинаково для React (Vite), Vue (Vite), Svelte (SvelteKit с Vite) и любого другого фреймворка на базе Vite. Это ещё раз подтверждает, что offline-реализация не зависит от фреймворка.

Для Next.js с next-pwa:

```bash
npm install @ducanh2912/next-pwa
```

```javascript
// next.config.js
const withPWA = require('@ducanh2912/next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.example\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
      },
    },
  ],
});

module.exports = withPWA({
  // остальной next.config
});
```

Для Angular:

```bash
ng add @angular/pwa
```

Angular CLI автоматически создаст `ngsw-config.json` и зарегистрирует SW. Конфигурация кэширования:

```json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/assets/**", "/*.(png|jpg|svg)"]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api",
      "urls": ["/api/**"],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "1d",
        "strategy": "freshness"
      }
    }
  ]
}
```

## IndexedDB для offline-данных

Для хранения структурированных данных в offline-режиме используется IndexedDB. Обёртка `idb` от Jake Archibald упрощает работу:

```bash
npm install idb
```

```typescript
import { openDB, DBSchema } from 'idb';

interface MyDB extends DBSchema {
  articles: {
    key: number;
    value: { id: number; title: string; content: string; synced: boolean };
    indexes: { 'by-synced': boolean };
  };
}

const db = await openDB<MyDB>('my-app', 1, {
  upgrade(db) {
    const store = db.createObjectStore('articles', { keyPath: 'id' });
    store.createIndex('by-synced', 'synced');
  },
});

// Сохранить статью для offline
await db.put('articles', {
  id: 1,
  title: 'Offline Article',
  content: '...',
  synced: false,
});

// Получить все несинхронизированные
const unsynced = await db.getAllFromIndex('articles', 'by-synced', false);

// Синхронизация при восстановлении сети
window.addEventListener('online', async () => {
  const unsynced = await db.getAllFromIndex('articles', 'by-synced', false);
  for (const article of unsynced) {
    await fetch('/api/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    });
    await db.put('articles', { ...article, synced: true });
  }
});
```

## Manifest для PWA

Для полноценного offline-режима с установкой приложения нужен web app manifest:

```json
{
  "name": "My Application",
  "short_name": "MyApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4a90d9",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#4a90d9" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## Чеклист для offline mode

- Service Worker зарегистрирован и кэширует app shell при установке
- Стратегии кэширования настроены по типам ресурсов
- GET-запросы к API кэшируются через Network First
- Мутации (POST/PUT/DELETE) сохраняются в очередь и отправляются при восстановлении сети
- Есть offline fallback страница
- Приложение отображает статус сети пользователю
- IndexedDB используется для данных, которые нужны offline
- Устаревшие кэши очищаются при активации нового SW
- Manifest добавлен для возможности установки как PWA
