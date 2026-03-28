---
tags:
  - frontend
  - service-worker
  - caching
  - pwa
---
## Service Worker

Service Worker - это скрипт, который браузер запускает в фоне, отдельно от веб-страницы. Он работает как прокси между приложением и сетью, перехватывая сетевые запросы, управляя кэшем и обеспечивая работу push-уведомлений и фоновой синхронизации.

Service Worker не имеет доступа к DOM. Он общается с основной страницей через `postMessage` и работает полностью асинхронно - все API внутри основаны на промисах.

> [!important]
> Service Worker работает только по HTTPS (за исключением localhost для разработки). Это требование безопасности, так как SW перехватывает сетевые запросы и может модифицировать ответы.

## Жизненный цикл

Service Worker проходит три фазы: установка, активация и работа. Понимание жизненного цикла критично для корректного обновления кэша и предотвращения конфликтов между версиями.

```
Регистрация → Installing → Installed (waiting) → Activating → Activated → Fetch/Push/Sync
```

При первой регистрации SW скачивается, парсится и запускается событие `install`. В этот момент обычно кэшируют статические ресурсы. После установки SW переходит в состояние `waiting` - он ждёт, пока все вкладки со старым SW будут закрыты. Событие `activate` срабатывает, когда SW получает контроль - здесь обычно чистят устаревшие кэши.

```javascript
// sw.js
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/offline.html',
];

// Установка: кэшируем статические ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Активация: чистим старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

`event.waitUntil()` принимает промис и не даёт браузеру завершить фазу, пока промис не разрешится. Без него браузер может прервать установку до завершения кэширования.

Чтобы новый SW сразу получил контроль, не дожидаясь закрытия вкладок:

```javascript
self.addEventListener('install', (event) => {
  self.skipWaiting(); // пропустить фазу ожидания
  event.waitUntil(/* ... */);
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim() // захватить контроль над всеми вкладками
  );
});
```

> [!info]
> `skipWaiting()` + `clients.claim()` - агрессивное обновление. Используйте его осторожно: если формат кэша изменился, старые страницы могут получить несовместимые ответы из нового кэша. Безопаснее показать пользователю уведомление "Доступно обновление" и перезагрузить страницу.

## Регистрация

```javascript
// main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/', // по умолчанию - директория, где лежит sw.js
      });

      console.log('SW registered, scope:', registration.scope);

      // Отслеживание обновлений
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Есть старый SW - доступно обновление
              showUpdateBanner();
            } else {
              // Первая установка
              console.log('Content cached for offline use');
            }
          }
        });
      });
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}
```

Scope определяет, какие запросы SW будет перехватывать. По умолчанию scope равен директории, в которой находится файл sw.js. Файл `/sw.js` имеет scope `/`, а `/scripts/sw.js` имеет scope `/scripts/`. Расширить scope выше расположения файла нельзя без специального HTTP-заголовка `Service-Worker-Allowed`.

## Коммуникация: страница → Service Worker

`postMessage` - основной способ двусторонней связи между страницей и SW.

Отправка сообщения в SW:

```javascript
// Из страницы в Service Worker
navigator.serviceWorker.controller.postMessage({
  type: 'CACHE_URLS',
  payload: ['/api/data', '/api/config'],
});

// В sw.js
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }
});
```

## Коммуникация: Service Worker → страница

SW может отправлять сообщения всем контролируемым клиентам или конкретному клиенту:

```javascript
// sw.js: отправка сообщения всем вкладкам
self.clients.matchAll().then((clients) => {
  clients.forEach((client) => {
    client.postMessage({
      type: 'CACHE_UPDATED',
      payload: { url: '/api/data', timestamp: Date.now() },
    });
  });
});

// sw.js: ответить конкретному отправителю
self.addEventListener('message', (event) => {
  // event.source - клиент, отправивший сообщение
  event.source.postMessage({
    type: 'RESPONSE',
    payload: 'received',
  });
});
```

Приём сообщений на странице:

```javascript
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_UPDATED') {
    console.log('Cache updated:', event.data.payload);
    refreshUI();
  }
});
```

## MessageChannel для двусторонней связи

MessageChannel создаёт пару связанных портов для прямого обмена сообщениями:

```javascript
// Страница: создаём канал и отправляем один порт в SW
function sendMessageToSW(message) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();

    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
  });
}

// Использование
const response = await sendMessageToSW({ type: 'GET_CACHE_SIZE' });
console.log('Cache size:', response.size);

// sw.js: ответ через переданный порт
self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_CACHE_SIZE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({ size: keys.length });
      });
    });
  }
});
```

## BroadcastChannel для межвкладочной связи

BroadcastChannel позволяет передавать сообщения между всеми контекстами (вкладки, iframe, SW) на одном origin:

```javascript
// В sw.js
const channel = new BroadcastChannel('app-updates');
channel.postMessage({ type: 'NEW_VERSION', version: '2.0.0' });

// На странице
const channel = new BroadcastChannel('app-updates');
channel.addEventListener('message', (event) => {
  if (event.data.type === 'NEW_VERSION') {
    showUpdateNotification(event.data.version);
  }
});
```

## Cache API и стратегии кэширования

Cache API позволяет хранить пары Request/Response. Основные методы:

```javascript
// Открыть/создать кэш
const cache = await caches.open('my-cache');

// Добавить ресурс (fetch + put)
await cache.add('/api/data');
await cache.addAll(['/style.css', '/app.js']);

// Положить конкретный ответ
await cache.put('/api/data', new Response(JSON.stringify(data)));

// Найти в кэше
const response = await cache.match('/api/data');
const response = await caches.match('/api/data'); // искать во всех кэшах

// Удалить
await cache.delete('/api/data');

// Получить все ключи
const keys = await cache.keys();
```

### Cache First (Cache Falling Back to Network)

Сначала ищем в кэше. Если нет - идём в сеть и кэшируем ответ. Подходит для статических ресурсов, которые редко меняются: шрифты, изображения, библиотеки.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Клонируем, потому что response можно прочитать только один раз
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
```

### Network First (Network Falling Back to Cache)

Сначала пробуем сеть. Если сеть недоступна - отдаём из кэша. Подходит для контента, который часто обновляется: API-ответы, HTML-страницы.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
```

### Stale While Revalidate

Отдаёт из кэша сразу (быстрый ответ), одновременно обновляя кэш из сети. Баланс между скоростью и актуальностью. Подходит для ресурсов, где допустима краткосрочная неактуальность: аватарки, списки, контент который обновляется не критично часто.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });

        return cached || networkFetch;
      });
    })
  );
});
```

### Cache Only и Network Only

```javascript
// Cache Only: только кэш, без сети
// Для ресурсов, закэшированных при установке
event.respondWith(caches.match(event.request));

// Network Only: только сеть, без кэша
// Для запросов, которые всегда должны быть свежими (аналитика, POST)
event.respondWith(fetch(event.request));
```

### Комбинированная стратегия

На практике разные типы ресурсов требуют разных стратегий:

```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.destination === 'image') {
    // Изображения: Cache First
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API: Network First
    event.respondWith(networkFirst(request));
  } else if (request.destination === 'style' || request.destination === 'script') {
    // Статика: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // HTML: Network First с offline fallback
    event.respondWith(
      networkFirst(request).then(
        (response) => response || caches.match('/offline.html')
      )
    );
  }
});
```

## Возможности Service Worker

### Background Sync

Позволяет отложить действие до появления стабильного соединения. Если пользователь отправил форму offline, запрос выполнится автоматически при восстановлении сети.

```javascript
// Страница: регистрируем sync
async function submitForm(data) {
  // Сохраняем данные в IndexedDB
  await saveToIndexedDB('pending-submissions', data);

  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('submit-form');
}

// sw.js: обрабатываем sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'submit-form') {
    event.waitUntil(processPendingSubmissions());
  }
});

async function processPendingSubmissions() {
  const pending = await getFromIndexedDB('pending-submissions');

  for (const data of pending) {
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await removeFromIndexedDB('pending-submissions', data.id);
  }
}
```

### Periodic Background Sync

Позволяет периодически обновлять данные в фоне. Браузер сам решает, когда запускать синхронизацию, учитывая батарею, тип соединения и частоту использования сайта.

```javascript
// Регистрация периодической синхронизации
const registration = await navigator.serviceWorker.ready;
const status = await navigator.permissions.query({ name: 'periodic-background-sync' });

if (status.state === 'granted') {
  await registration.periodicSync.register('update-content', {
    minInterval: 24 * 60 * 60 * 1000, // минимум раз в сутки
  });
}

// sw.js
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateCachedContent());
  }
});
```

> [!info]
> Periodic Background Sync доступен только в Chromium-браузерах и требует, чтобы сайт был установлен как PWA или часто посещался. Браузер может регулировать частоту синхронизации.

### Navigation Preload

Позволяет делать сетевой запрос параллельно с загрузкой SW, вместо последовательного ожидания. Устраняет задержку при первом запросе после пробуждения SW.

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.navigationPreload.enable()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // preloadResponse доступен пока SW просыпается
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;

          return await fetch(event.request);
        } catch {
          return caches.match('/offline.html');
        }
      })()
    );
  }
});
```

## Обновление Service Worker

При каждом посещении сайта браузер проверяет sw.js на изменения (побайтовое сравнение). Если файл изменился, запускается установка нового SW. Можно ускорить проверку:

```javascript
// Проверка обновлений каждый час
const registration = await navigator.serviceWorker.ready;
setInterval(() => {
  registration.update();
}, 60 * 60 * 1000);
```

Паттерн уведомления пользователя об обновлении:

```javascript
let refreshing = false;

navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!refreshing) {
    refreshing = true;
    window.location.reload();
  }
});

// При обнаружении нового SW в состоянии waiting
function showUpdateBanner(registration) {
  const banner = document.getElementById('update-banner');
  banner.style.display = 'block';

  banner.querySelector('button').addEventListener('click', () => {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  });
}

// sw.js
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

## Ограничения

- Нет доступа к DOM - общение только через postMessage
- Работает только по HTTPS (кроме localhost)
- Асинхронный - нет синхронных API (localStorage недоступен, используйте IndexedDB или Cache API)
- Scope ограничен - SW на `/app/sw.js` не может перехватывать запросы к `/other/`
- Время жизни непредсказуемо - браузер может остановить SW в любой момент для экономии ресурсов. Не храните состояние в переменных, используйте IndexedDB
- Первый визит без SW - при первом посещении SW только устанавливается, перехват запросов начинается со второго визита (если не использовать `clients.claim()`)
