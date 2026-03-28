---
tags:
  - frontend
  - web-workers
  - performance
---
## Web Workers

Web Workers позволяют запускать JavaScript в отдельном потоке, не блокируя основной поток (main thread) и UI. Это критично для тяжёлых вычислений: парсинг больших JSON, обработка изображений, криптография, сортировка массивов.

Основной поток в браузере один - он отвечает за рендеринг, обработку событий и выполнение JS. Если тяжёлая операция занимает main thread больше 50мс, пользователь заметит подтормаживание интерфейса. Web Workers решают эту проблему, вынося вычисления в фоновый поток.

## Типы воркеров

Dedicated Worker - привязан к одной странице. Самый распространённый тип. Создаётся через `new Worker()`.

Shared Worker - разделяется между несколькими страницами (вкладками) одного origin. Полезен для общего WebSocket-соединения или синхронизации состояния между вкладками.

Service Worker - работает как сетевой прокси, не привязан к конкретной странице. Описан в отдельной заметке.

## Dedicated Worker

### Создание и базовая коммуникация

```javascript
// main.js
const worker = new Worker('/workers/heavy-calc.js');

// Отправляем данные в воркер
worker.postMessage({ type: 'CALCULATE', data: largeDataset });

// Получаем результат
worker.addEventListener('message', (event) => {
  console.log('Result:', event.data);
  updateUI(event.data);
});

// Обработка ошибок
worker.addEventListener('error', (event) => {
  console.error('Worker error:', event.message, event.filename, event.lineno);
});

// Завершение воркера
worker.terminate();
```

```javascript
// workers/heavy-calc.js
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'CALCULATE') {
    const result = performHeavyCalculation(data);
    self.postMessage(result);
  }
});

function performHeavyCalculation(data) {
  // тяжёлая синхронная операция, не блокирует main thread
  return data.reduce((acc, item) => {
    // ... сложные вычисления
    return acc + processItem(item);
  }, 0);
}
```

### Создание из Blob (inline worker)

Когда не хочется создавать отдельный файл, можно создать воркер из строки:

```javascript
function createInlineWorker(fn) {
  const blob = new Blob(
    [`self.onmessage = function(e) { (${fn.toString()})(e) }`],
    { type: 'application/javascript' }
  );
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  // Очистка URL после создания
  URL.revokeObjectURL(url);
  return worker;
}

const worker = createInlineWorker((event) => {
  const result = event.data.map((n) => n * n);
  self.postMessage(result);
});

worker.postMessage([1, 2, 3, 4, 5]);
worker.onmessage = (e) => console.log(e.data); // [1, 4, 9, 16, 25]
```

### Воркер с модулями (ES Modules)

Современный способ - воркеры с поддержкой ES-модулей:

```javascript
const worker = new Worker('/workers/calc.js', { type: 'module' });
```

```javascript
// workers/calc.js
import { processData } from './utils.js';

self.addEventListener('message', (event) => {
  const result = processData(event.data);
  self.postMessage(result);
});
```

> [!info]
> `type: 'module'` поддерживается во всех современных браузерах. Позволяет использовать `import/export` внутри воркера, разбивая логику на модули.

## Transferable Objects

По умолчанию `postMessage` клонирует данные через structured clone algorithm. Для больших данных (ArrayBuffer, ImageBitmap, OffscreenCanvas) клонирование дорогое. Transferable objects передают владение данными без копирования - исходный контекст теряет доступ к ним.

```javascript
// Медленно: клонирование 100MB буфера
const buffer = new ArrayBuffer(100 * 1024 * 1024);
worker.postMessage(buffer); // копируется

// Быстро: transfer без копирования
const buffer = new ArrayBuffer(100 * 1024 * 1024);
worker.postMessage(buffer, [buffer]); // передаётся мгновенно
console.log(buffer.byteLength); // 0 - буфер больше недоступен

// С объектом (transfer указанных полей)
const pixels = new Uint8Array(width * height * 4);
worker.postMessage(
  { type: 'PROCESS_IMAGE', pixels: pixels.buffer, width, height },
  [pixels.buffer]
);
```

Transferable типы: ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas, ReadableStream, WritableStream, TransformStream.

## SharedArrayBuffer для разделяемой памяти

SharedArrayBuffer позволяет нескольким потокам работать с одной и той же памятью. В отличие от transfer, оба контекста имеют доступ к данным одновременно. Для синхронизации используется `Atomics`.

```javascript
// main.js
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

worker.postMessage({ buffer: sharedBuffer });

// Атомарная запись
Atomics.store(sharedArray, 0, 42);

// Ожидание изменения от воркера
Atomics.wait(sharedArray, 1, 0); // блокирует до изменения (только в воркерах)

// workers/calc.js
self.addEventListener('message', (event) => {
  const sharedArray = new Int32Array(event.data.buffer);

  // Атомарное чтение
  const value = Atomics.load(sharedArray, 0);

  // Атомарная запись
  Atomics.store(sharedArray, 1, value * 2);
  Atomics.notify(sharedArray, 1); // пробудить ожидающий поток
});
```

> [!important]
> SharedArrayBuffer требует HTTPS и специальных заголовков: `Cross-Origin-Opener-Policy: same-origin` и `Cross-Origin-Embedder-Policy: require-corp`. Без них `SharedArrayBuffer` недоступен.

## Shared Worker

Shared Worker разделяется между всеми вкладками и iframe одного origin. Каждое подключение получает свой MessagePort.

```javascript
// main.js (на каждой вкладке)
const shared = new SharedWorker('/workers/shared.js');

shared.port.addEventListener('message', (event) => {
  console.log('From shared worker:', event.data);
});

shared.port.start(); // обязательно для addEventListener (не нужно для onmessage)
shared.port.postMessage({ type: 'JOIN', tabId: crypto.randomUUID() });
```

```javascript
// workers/shared.js
const connections = new Set();

self.addEventListener('connect', (event) => {
  const port = event.ports[0];
  connections.add(port);

  port.addEventListener('message', (event) => {
    if (event.data.type === 'BROADCAST') {
      // Отправить всем подключённым вкладкам
      connections.forEach((p) => {
        p.postMessage(event.data.payload);
      });
    }
  });

  port.start();

  port.addEventListener('close', () => {
    connections.delete(port);
  });
});
```

Применения Shared Worker:
- Единственное WebSocket-соединение, разделяемое между вкладками
- Синхронизация состояния между вкладками (корзина, авторизация)
- Общий пул соединений к базе данных (IndexedDB)

## Comlink: упрощение API

Comlink от Google абстрагирует postMessage, позволяя вызывать функции воркера как обычные async-функции:

```bash
npm install comlink
```

```javascript
// workers/math.js
import * as Comlink from 'comlink';

const mathService = {
  fibonacci(n) {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  },

  async processLargeDataset(data) {
    // тяжёлая обработка
    return data.map((item) => /* ... */);
  },
};

Comlink.expose(mathService);
```

```javascript
// main.js
import * as Comlink from 'comlink';

const worker = new Worker('/workers/math.js', { type: 'module' });
const math = Comlink.wrap(worker);

// Вызываем как обычную async-функцию
const result = await math.fibonacci(40);
console.log(result); // 102334155

// Передача callback через Comlink.proxy
await math.processWithProgress(
  data,
  Comlink.proxy((progress) => {
    updateProgressBar(progress);
  })
);
```

## Пул воркеров

Для задач, которые приходят часто, имеет смысл переиспользовать воркеров вместо создания нового на каждый запрос:

```typescript
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: unknown;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];
  private available: Worker[] = [];

  constructor(
    private scriptUrl: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.scriptUrl, { type: 'module' });
      this.workers.push(worker);
      this.available.push(worker);
    }
  }

  execute<T>(data: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.available.pop();

      if (worker) {
        this.runTask(worker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private runTask(
    worker: Worker,
    data: unknown,
    resolve: (value: unknown) => void,
    reject: (reason: unknown) => void
  ) {
    worker.onmessage = (event) => {
      resolve(event.data);
      this.releaseWorker(worker);
    };
    worker.onerror = (event) => {
      reject(event.message);
      this.releaseWorker(worker);
    };
    worker.postMessage(data);
  }

  private releaseWorker(worker: Worker) {
    const next = this.queue.shift();
    if (next) {
      this.runTask(worker, next.data, next.resolve, next.reject);
    } else {
      this.available.push(worker);
    }
  }

  terminate() {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.available = [];
  }
}

// Использование
const pool = new WorkerPool('/workers/image-processor.js', 4);

const results = await Promise.all(
  images.map((img) => pool.execute({ type: 'RESIZE', image: img }))
);
```

## Воркеры с бандлерами

### Vite / Rollup

```javascript
// Vite понимает ?worker суффикс
import MyWorker from './worker.js?worker';

const worker = new MyWorker();
worker.postMessage('hello');
```

### Webpack 5

```javascript
// Webpack 5 понимает new Worker() с динамическим import
const worker = new Worker(
  new URL('./worker.js', import.meta.url)
);
```

## Практические сценарии

Обработка изображений:

```javascript
// workers/image-processor.js
self.addEventListener('message', async (event) => {
  const { imageData, width, height, filter } = event.data;
  const pixels = new Uint8ClampedArray(imageData);

  if (filter === 'grayscale') {
    for (let i = 0; i < pixels.length; i += 4) {
      const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = avg;     // R
      pixels[i + 1] = avg; // G
      pixels[i + 2] = avg; // B
    }
  }

  self.postMessage({ pixels: pixels.buffer, width, height }, [pixels.buffer]);
});
```

Парсинг больших CSV/JSON:

```javascript
// workers/parser.js
self.addEventListener('message', (event) => {
  const { csv } = event.data;
  const lines = csv.split('\n');
  const headers = lines[0].split(',');

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx]?.trim();
    });
    results.push(row);

    // Отчёт о прогрессе каждые 10000 строк
    if (i % 10000 === 0) {
      self.postMessage({ type: 'PROGRESS', current: i, total: lines.length });
    }
  }

  self.postMessage({ type: 'DONE', data: results });
});
```

## Ограничения Web Workers

- Нет доступа к DOM (document, window, parent)
- Нет доступа к `localStorage` и `sessionStorage` (используйте IndexedDB)
- Ограниченные API: доступны fetch, XMLHttpRequest, IndexedDB, WebSocket, crypto, но нет alert, confirm, DOM-манипуляций
- Стоимость создания - создание воркера имеет overhead, для коротких задач используйте пул или inline worker
- Same-origin policy - скрипт воркера должен быть с того же origin (для inline - Blob URL)
