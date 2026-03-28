---
tags:
  - frontend
  - web-push
  - firebase
  - supabase
  - service-worker
  - notifications
---
## WebPush уведомления

Web Push позволяет отправлять уведомления пользователю, даже когда сайт закрыт. Архитектура состоит из трёх участников: клиент (браузер), push-сервис (FCM для Chrome, Mozilla Push для Firefox) и сервер приложения. Клиент подписывается на уведомления, сервер отправляет сообщение в push-сервис, push-сервис доставляет его в браузер, а Service Worker показывает уведомление.

```
Сервер → Push Service (FCM/Mozilla) → Браузер → Service Worker → Notification
```

## Push API и Notification API

Два отдельных API работают вместе. Push API - доставка сообщения в браузер через push-сервис. Notification API - отображение уведомления пользователю.

### Запрос разрешения

```javascript
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
```

> [!important]
> Запрашивайте разрешение на уведомления только после действия пользователя (клик на кнопку "Включить уведомления"). Браузеры блокируют автоматические запросы, а пользователи чаще соглашаются, когда понимают зачем это нужно.

### Подписка на push-уведомления

```javascript
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;

  // VAPID public key (генерируется на сервере)
  const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-...';

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true, // обязательно true - каждый push должен показывать уведомление
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  // Отправляем подписку на сервер
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  return subscription;
}

// Конвертация VAPID ключа
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
```

### Обработка push в Service Worker

```javascript
// sw.js
self.addEventListener('push', (event) => {
  let data = { title: 'Уведомление', body: '', icon: '/icons/icon-192.png' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge || '/icons/badge-72.png',
      image: data.image,
      tag: data.tag, // группировка - новое уведомление с тем же tag заменяет старое
      data: data.payload, // произвольные данные для обработки клика
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
    })
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  // Обработка кнопок действий
  if (event.action === 'open') {
    event.waitUntil(clients.openWindow(url));
    return;
  }

  if (event.action === 'dismiss') {
    return;
  }

  // Клик по телу уведомления - открыть или переключиться на вкладку
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => client.url === url);
      if (existing) {
        return existing.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// Закрытие уведомления (свайп, кнопка закрытия)
self.addEventListener('notificationclose', (event) => {
  // Аналитика: пользователь проигнорировал уведомление
  fetch('/api/push/analytics', {
    method: 'POST',
    body: JSON.stringify({
      action: 'dismissed',
      tag: event.notification.tag,
    }),
  });
});
```

## VAPID ключи

VAPID (Voluntary Application Server Identification) - протокол идентификации сервера перед push-сервисом. Генерируются один раз и используются постоянно.

```bash
# Генерация VAPID ключей через web-push CLI
npx web-push generate-vapid-keys
```

```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa...
Private Key: UUxI4O8-FbRouAevSmBQ6o18hgE...
```

Публичный ключ передаётся клиенту при подписке. Приватный ключ хранится на сервере и используется для подписи push-сообщений.

## Firebase Cloud Messaging (FCM)

FCM - push-сервис от Google, работающий как прослойка поверх Web Push API. Предоставляет SDK для клиента, серверные API для отправки, аналитику доставки и поддержку topics для групповых уведомлений.

### Настройка проекта

```bash
npm install firebase
```

Создать проект в Firebase Console, включить Cloud Messaging и получить конфигурацию.

### Клиентская часть

```javascript
// firebase-messaging.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIza...',
  authDomain: 'my-app.firebaseapp.com',
  projectId: 'my-app',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Получение FCM-токена (эквивалент push-подписки)
export async function requestFCMToken() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const token = await getToken(messaging, {
    vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa...', // из Firebase Console → Cloud Messaging → Web Push certificates
  });

  // Сохраняем токен на сервере
  await fetch('/api/push/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  return token;
}

// Приём сообщений, когда вкладка активна (foreground)
onMessage(messaging, (payload) => {
  console.log('Foreground message:', payload);

  // FCM не показывает уведомление автоматически в foreground
  // Показываем через Notification API или in-app toast
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon,
  });
});
```

### Service Worker для FCM (background)

```javascript
// firebase-messaging-sw.js (обязательное имя для Firebase SDK)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIza...',
  projectId: 'my-app',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
});

const messaging = firebase.messaging();

// Обработка push в background
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: icon || '/icons/icon-192.png',
    data: payload.data,
  });
});
```

> [!info]
> Firebase SDK ожидает файл `firebase-messaging-sw.js` в корне сайта. Если ваш SW имеет другое имя или путь, укажите его при инициализации: `getToken(messaging, { serviceWorkerRegistration: registration })`.

### Серверная отправка через Firebase Admin SDK

```javascript
// server.js (Node.js)
import admin from 'firebase-admin';
import serviceAccount from './firebase-service-account.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Отправка одному устройству
async function sendPushNotification(token, title, body, data = {}) {
  const message = {
    token,
    notification: { title, body },
    data, // произвольные key-value строки
    webpush: {
      fcmOptions: { link: 'https://my-app.com/notifications' },
      notification: {
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        actions: [
          { action: 'open', title: 'Открыть' },
          { action: 'dismiss', title: 'Закрыть' },
        ],
      },
    },
  };

  const response = await admin.messaging().send(message);
  console.log('Sent:', response);
}

// Отправка по теме (topic) - все подписанные устройства
async function sendToTopic(topic, title, body) {
  await admin.messaging().send({
    topic,
    notification: { title, body },
  });
}

// Подписка на тему
async function subscribeToTopic(tokens, topic) {
  await admin.messaging().subscribeToTopic(tokens, topic);
}

// Массовая отправка (до 500 за раз)
async function sendMultiple(tokens, title, body) {
  const messages = tokens.map((token) => ({
    token,
    notification: { title, body },
  }));

  const response = await admin.messaging().sendEach(messages);
  console.log(`Success: ${response.successCount}, Failure: ${response.failureCount}`);
}
```

### Управление подписками на клиенте

```javascript
import { getToken, deleteToken } from 'firebase/messaging';

// Отписка
async function unsubscribe() {
  await deleteToken(messaging);
  await fetch('/api/push/unregister', { method: 'POST' });
}

// Обновление токена (токены могут протухать)
// Firebase SDK делает это автоматически, но сервер нужно уведомить
export function setupTokenRefresh() {
  // Вызывается при каждой загрузке страницы
  getToken(messaging, { vapidKey: '...' }).then((currentToken) => {
    if (currentToken) {
      // Отправляем актуальный токен на сервер
      fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      });
    }
  });
}
```

## Supabase и Push-уведомления

Supabase не имеет встроенного push-сервиса. Есть два подхода: использовать Edge Functions для отправки push через стандартный Web Push протокол, или использовать Supabase Realtime для in-app уведомлений.

### Подход 1: Edge Functions + Web Push (VAPID)

Supabase Edge Functions работают на Deno. Для отправки Web Push без Firebase используется библиотека `@negrel/webpush` из JSR - она написана для Web-совместимых рантаймов (Deno, Cloudflare Workers) и не зависит от Node.js crypto.

```typescript
// supabase/functions/send-push/index.ts
import {
  ApplicationServer,
  ApplicationServerKeys,
} from 'jsr:@negrel/webpush';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const keys = await ApplicationServerKeys.fromJSON({
  subject: 'mailto:admin@example.com',
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
});

const appServer = new ApplicationServer(keys);

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { userId, title, body, url } = await req.json();

  // Получаем подписки пользователя из БД
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  const payload = JSON.stringify({ title, body, url });

  // Отправляем каждой подписке через Web Push протокол
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscriber = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      return appServer.pushMessage(subscriber, {}, payload);
    })
  );

  // Удаляем протухшие подписки (410 Gone)
  const expired = results
    .map((r, i) => (r.status === 'rejected' && r.reason?.status === 410 ? subscriptions[i].id : null))
    .filter(Boolean);

  if (expired.length) {
    await supabase.from('push_subscriptions').delete().in('id', expired);
  }

  return new Response(JSON.stringify({ sent: results.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Таблица для хранения подписок в Supabase:

```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

-- RLS: пользователь управляет своими подписками
alter table push_subscriptions enable row level security;

create policy "Users manage own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id);
```

Клиентская подписка через стандартный Push API (без Firebase):

```javascript
// Используем стандартный Push API, не Firebase
async function subscribeWithSupabase(supabase) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const { endpoint, keys } = subscription.toJSON();

  // Сохраняем в Supabase
  await supabase.from('push_subscriptions').upsert({
    user_id: (await supabase.auth.getUser()).data.user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });
}
```

### Подход 2: Database Webhooks для автоматической отправки

Supabase Database Webhooks вызывают Edge Function при изменении данных. Это позволяет автоматически отправлять push при создании записи:

```sql
-- Webhook: при вставке в таблицу notifications вызывается Edge Function
create trigger on_notification_created
  after insert on notifications
  for each row
  execute function supabase_functions.http_request(
    'https://your-project.supabase.co/functions/v1/send-push',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '1000'
  );
```

### Подход 3: Supabase Realtime для in-app уведомлений

Если push-уведомления в системном трее не нужны, Supabase Realtime - более простая альтернатива. Работает через WebSocket, уведомления приходят пока вкладка открыта.

Два варианта: Postgres Changes (проще, подходит для прототипов) и Broadcast через `realtime.broadcast_changes()` (рекомендуется для продакшена - RLS проверяется только при подключении, поддерживает многопоточную доставку).

Postgres Changes (простой вариант):

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Подписка на новые уведомления для текущего пользователя
function subscribeToNotifications(userId, onNotification) {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new);
      }
    )
    .subscribe();
}

// Использование
const channel = subscribeToNotifications(user.id, (notification) => {
  showToast(notification.title, notification.body);
});

// Отписка
supabase.removeChannel(channel);
```

Broadcast (продакшен-вариант):

```sql
-- Триггер для broadcast через realtime.messages
create or replace function notify_via_broadcast()
returns trigger as $$
begin
  perform realtime.broadcast_changes(
    'notifications:' || NEW.user_id,  -- топик = канал для конкретного юзера
    TG_TABLE_NAME,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return NEW;
end;
$$ language plpgsql;

create trigger on_notification_broadcast
  after insert on notifications
  for each row
  execute function notify_via_broadcast();
```

```javascript
// Клиент подписывается на broadcast-канал
function subscribeViaBroadcast(userId, onNotification) {
  return supabase
    .channel(`notifications:${userId}`)
    .on('broadcast', { event: 'notifications' }, (payload) => {
      onNotification(payload.new);
    })
    .subscribe();
}
```

> [!info]
> Supabase рекомендует Broadcast вместо Postgres Changes для продакшена. Postgres Changes проверяет RLS на каждое событие для каждого подписчика и обрабатывает в одном потоке. Broadcast проверяет RLS только при подключении к каналу и масштабируется лучше.

## Сравнение подходов

Firebase FCM:
- Готовый SDK, минимум кода
- Бесплатный push-сервис
- Topics для групповой рассылки
- Аналитика доставки
- Привязка к экосистеме Google

Supabase + Web Push:
- Стандартный Web Push протокол, без привязки к вендору
- Полный контроль над инфраструктурой
- Данные подписок в своей БД
- Нужно реализовать отправку самостоятельно (через web-push или ручную криптографию)
- Нет встроенных topics - реализуются через запросы к БД

Supabase Realtime:
- Простейшая реализация
- Работает только при открытой вкладке
- Не настоящий push - это WebSocket
- Подходит для in-app уведомлений (тосты, бейджи, колокольчик)

## Отладка

Chrome DevTools → Application → Service Workers: просмотр зарегистрированных SW, возможность отправить тестовый push.

Chrome DevTools → Application → Push Messaging: информация о подписке.

Push тестирование через DevTools:

```javascript
// В консоли DevTools (вкладка Application → Service Workers → Push)
// Ввести JSON в поле "Push" и нажать кнопку
{"title": "Test", "body": "Hello from DevTools"}
```

Тестирование на сервере через curl:

```bash
# Отправка через Firebase HTTP v1 API
curl -X POST \
  'https://fcm.googleapis.com/v1/projects/MY_PROJECT/messages:send' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": {
      "token": "DEVICE_TOKEN",
      "notification": {
        "title": "Test",
        "body": "Hello"
      }
    }
  }'
```
