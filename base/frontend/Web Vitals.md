---
tags:
  - frontend
  - performance
  - web-vitals
---
## Web Vitals

Web Vitals - инициатива Google, определяющая набор метрик для измерения реального пользовательского опыта на веб-страницах. Из всего набора выделяется подмножество Core Web Vitals - три ключевые метрики, которые Google считает критически важными для любой веб-страницы.

Core Web Vitals напрямую влияют на ранжирование в поисковой выдаче Google. С 2021 года они являются официальным фактором SEO-ранкинга. Помимо SEO, метрики отражают реальные проблемы UX - медленная загрузка, неотзывчивый интерфейс и визуальная нестабильность приводят к оттоку пользователей.

> [!important]
> Google использует данные реальных пользователей из Chrome UX Report для оценки Core Web Vitals. Лабораторные замеры в Lighthouse полезны для отладки, но не влияют на ранжирование.

---
## Core Web Vitals метрики

### LCP - Largest Contentful Paint

Измеряет время отрисовки самого крупного видимого элемента контента в viewport - изображения, видео, текстового блока или элемента с фоновым изображением.

| Хорошо | Нужно улучшить | Плохо |
|--------|----------------|-------|
| <= 2.5s | <= 4.0s | > 4.0s |

LCP отражает воспринимаемую скорость загрузки. Пользователь считает страницу загруженной, когда видит основной контент. Типичные LCP-элементы - hero-изображение, заголовок статьи, превью видео.

Этапы, из которых складывается LCP:
1. TTFB - время до первого байта ответа сервера
2. Загрузка ресурса - скачивание изображения или шрифта
3. Рендеринг элемента - парсинг, layout, paint

### INP - Interaction to Next Paint

Измеряет задержку между действием пользователя и визуальным обновлением интерфейса. Учитывает все взаимодействия за сессию - клики, тапы, нажатия клавиш - и берет наихудшее значение с учетом статистической корректировки.

| Хорошо | Нужно улучшить | Плохо |
|--------|----------------|-------|
| <= 200ms | <= 500ms | > 500ms |

INP заменил FID в марте 2024 года. Ключевое отличие - FID измерял только задержку первого взаимодействия, а INP учитывает все взаимодействия за весь жизненный цикл страницы.

Из чего складывается INP:
1. Input delay - время ожидания в очереди, пока main thread занят
2. Processing time - выполнение обработчиков событий
3. Presentation delay - рендеринг обновленного UI

### CLS - Cumulative Layout Shift

Измеряет визуальную стабильность страницы - насколько элементы смещаются после начальной отрисовки без действий пользователя. Рассчитывается как сумма отдельных layout shift scores в рамках session windows.

| Хорошо | Нужно улучшить | Плохо |
|--------|----------------|-------|
| <= 0.1 | <= 0.25 | > 0.25 |

CLS - безразмерная величина. Каждый layout shift score вычисляется как произведение impact fraction на distance fraction. Impact fraction - доля viewport, затронутая смещением. Distance fraction - расстояние смещения, нормированное по viewport.

Типичные причины CLS - изображения без указанных размеров, динамически вставляемые баннеры, поздняя подгрузка шрифтов.

---
## Дополнительные метрики

TTFB (Time to First Byte) - время от начала навигации до получения первого байта ответа сервера. Хорошее значение - менее 800ms. Включает DNS-lookup, TCP-handshake, TLS-negotiation и обработку на сервере. Напрямую влияет на все последующие метрики.

FCP (First Contentful Paint) - время до первой отрисовки любого контента - текста, изображения, SVG, canvas. Хорошее значение - менее 1.8s. Отражает момент, когда пользователь впервые видит ответ от страницы.

TBT (Total Blocking Time) - суммарное время блокировки main thread между FCP и TTI. Считается как сумма "хвостов" long tasks, превышающих 50ms. Хорошее значение - менее 200ms. Лабораторный аналог INP, доступный в Lighthouse.

TTI (Time to Interactive) - время до момента, когда страница полностью интерактивна - main thread свободен от long tasks в течение 5 секунд. Хорошее значение - менее 3.8s.

SI (Speed Index) - визуальная скорость заполнения viewport контентом. Рассчитывается по видеозаписи загрузки. Хорошее значение - менее 3.4s. Чем быстрее контент появляется в viewport, тем ниже индекс.

> [!info]
> TBT и TTI - лабораторные метрики, недоступные в field data. TBT хорошо коррелирует с INP и полезен для отладки в Lighthouse.

---
## Измерение Web Vitals

### Библиотека web-vitals

Официальная библиотека Google для сбора метрик в production:

```bash
npm i web-vitals
```

Базовый сбор Core Web Vitals:

```ts
import { onCLS, onINP, onLCP } from 'web-vitals';

onCLS(console.log);
onINP(console.log);
onLCP(console.log);
```

Расширенный сбор всех метрик с типизацией:

```ts
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

function sendMetric(metric: Metric): void {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  } else {
    fetch('/api/vitals', { body, method: 'POST', keepalive: true });
  }
}

onCLS(sendMetric);
onINP(sendMetric);
onLCP(sendMetric);
onFCP(sendMetric);
onTTFB(sendMetric);
```

> [!info]
> `navigator.sendBeacon` надежнее fetch для отправки метрик - данные гарантированно отправляются даже при закрытии вкладки.

### Chrome DevTools

Performance panel в Chrome DevTools - основной инструмент для лабораторной отладки. Записывает профиль загрузки и взаимодействий, визуализирует long tasks, layout shifts и LCP-элемент.

Workflow:
1. Открыть DevTools, вкладка Performance
2. Включить Screenshots и Web Vitals
3. Нажать Record, выполнить сценарий, остановить запись
4. Проанализировать timeline - long tasks отмечены красными полосами

### Lighthouse

Лабораторный инструмент аудита, доступный в Chrome DevTools, как CLI и npm-пакет. Измеряет Performance, Accessibility, Best Practices, SEO.

```bash
npx lighthouse https://example.com --output=json --output-path=./report.json
```

Lighthouse использует симулированный throttling по умолчанию. Для более точных замеров - DevTools throttling или реальное устройство.

### Chrome UX Report (CrUX)

Field data из реальных Chrome-браузеров. Агрегируется за 28 дней. Именно эти данные Google использует для ранжирования. Доступ через BigQuery, CrUX API или PageSpeed Insights.

```bash
# CrUX API запрос
curl "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=API_KEY" \
  -d '{"url": "https://example.com"}'
```

### PageSpeed Insights

Комбинирует lab data из Lighthouse с field data из CrUX на одной странице. Показывает оценку для мобильных и десктопных устройств. Удобен для быстрой проверки без настройки инструментов.

### Web Vitals Extension

Chrome-расширение, показывающее Core Web Vitals в реальном времени при навигации. Полезно для быстрого визуального контроля метрик во время разработки и тестирования.

---
## Настройка мониторинга

### Attribution build для отладки

Web-vitals предоставляет attribution build с детальной информацией о причинах метрик:

```ts
import { onINP } from 'web-vitals/attribution';

onINP((metric) => {
  const { eventTarget, eventType, loadState } = metric.attribution;

  console.log(`INP: ${metric.value}ms`);
  console.log(`Element: ${eventTarget}`);
  console.log(`Event: ${eventType}`);
  console.log(`State: ${loadState}`);

  // Для INP доступна информация о каждом этапе задержки
  const { inputDelay, processingDuration, presentationDelay } =
    metric.attribution;
  console.log(`Input delay: ${inputDelay}ms`);
  console.log(`Processing: ${processingDuration}ms`);
  console.log(`Presentation: ${presentationDelay}ms`);
});
```

### PerformanceObserver API

Низкоуровневый браузерный API для наблюдения за performance entries:

```ts
// Наблюдение за layout shifts
const clsObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const layoutShift = entry as PerformanceEntry & {
      hadRecentInput: boolean;
      value: number;
    };
    if (!layoutShift.hadRecentInput) {
      console.log('Layout shift:', layoutShift.value, entry);
    }
  }
});
clsObserver.observe({ type: 'layout-shift', buffered: true });

// Наблюдение за long tasks
const ltObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long task:', entry.duration, 'ms');
  }
});
ltObserver.observe({ type: 'longtask', buffered: true });

// Наблюдение за largest-contentful-paint
const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP candidate:', lastEntry);
});
lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
```

### Отправка в аналитику

Отправка в Google Analytics 4:

```ts
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

function sendToGA4(metric: Metric): void {
  gtag('event', metric.name, {
    value: Math.round(
      metric.name === 'CLS' ? metric.delta * 1000 : metric.delta
    ),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}

onCLS(sendToGA4);
onINP(sendToGA4);
onLCP(sendToGA4);
```

Отправка на свой endpoint с батчингом:

```ts
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

const metricsQueue: Metric[] = [];

function queueMetric(metric: Metric): void {
  metricsQueue.push(metric);
}

function flushMetrics(): void {
  if (metricsQueue.length === 0) return;

  const body = JSON.stringify(metricsQueue);
  navigator.sendBeacon('/api/vitals', body);
  metricsQueue.length = 0;
}

// Отправка при закрытии страницы
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flushMetrics();
  }
});

onCLS(queueMetric);
onINP(queueMetric);
onLCP(queueMetric);
onFCP(queueMetric);
onTTFB(queueMetric);
```

### RUM-сервисы

Sentry Performance - интегрируется с error tracking, показывает Web Vitals на дашборде транзакций. Datadog RUM - корпоративное решение с глубокой аналитикой. Vercel Analytics - zero-config для проектов на Vercel. SpeedCurve и Calibre - специализированные инструменты для performance monitoring.

---
## Оптимизация LCP

### Оптимизация серверного ответа

Снижение TTFB - первый шаг к хорошему LCP. Используйте CDN для статических ресурсов, кэширование ответов, edge computing для динамического контента. Для SSR-приложений - streaming response вместо полной буферизации.

### Предзагрузка критических ресурсов

```html
<!-- Preconnect к origin критических ресурсов -->
<link rel="preconnect" href="https://cdn.example.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />

<!-- Preload LCP-изображения -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />

<!-- Preload критического шрифта -->
<link
  rel="preload"
  as="font"
  href="/fonts/Inter.woff2"
  type="font/woff2"
  crossorigin
/>
```

> [!important]
> Атрибут `fetchpriority="high"` на LCP-изображении сообщает браузеру о приоритете загрузки. Ставьте его на hero-изображение или главный визуальный элемент.

### Оптимизация изображений

```html
<!-- Responsive images с modern formats -->
<picture>
  <source srcset="/hero.avif" type="image/avif" />
  <source srcset="/hero.webp" type="image/webp" />
  <img
    src="/hero.jpg"
    alt="Hero"
    width="1200"
    height="600"
    loading="eager"
    fetchpriority="high"
    decoding="async"
  />
</picture>
```

LCP-изображение не должно иметь `loading="lazy"`. Используйте `loading="eager"` явно или не указывайте атрибут. Для изображений ниже fold - `loading="lazy"`.

### Оптимизация CSS

```html
<!-- Inline critical CSS -->
<style>
  /* Только стили above-the-fold */
</style>

<!-- Async загрузка некритического CSS -->
<link
  rel="preload"
  href="/styles/non-critical.css"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
<noscript><link rel="stylesheet" href="/styles/non-critical.css" /></noscript>
```

### Оптимизация шрифтов

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-display: swap; /* Показать fallback сразу, заменить при загрузке */
  unicode-range: U+0000-00FF; /* Subset для Latin */
}
```

`font-display: swap` предотвращает FOIT - текст рендерится системным шрифтом и заменяется при загрузке кастомного. Для заголовков допустим `font-display: optional` - если шрифт не успел загрузиться, используется fallback без замены.

### SSR и SSG

Server-Side Rendering и Static Site Generation выдают готовый HTML, сокращая время до LCP. При SSR используйте streaming для отправки HTML по мере генерации:

```ts
// Next.js App Router автоматически использует streaming
// Suspense boundary для неблокирующей загрузки
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      <HeroSection /> {/* Рендерится сразу */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent /> {/* Стримится позже */}
      </Suspense>
    </>
  );
}
```

---
## Оптимизация INP

### Минимизация long tasks

Long tasks - задачи на main thread продолжительностью более 50ms. Они блокируют обработку пользовательского ввода.

```ts
// Разбиение long task с помощью scheduler.yield()
async function processLargeList(items: string[]): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);

    // Каждые 5 элементов - уступить main thread
    if (i % 5 === 0 && i > 0) {
      await scheduler.yield();
    }
  }
}

// Fallback для браузеров без scheduler.yield()
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
```

### Code splitting

Загружайте только необходимый JS для текущей страницы:

```ts
// Dynamic import для тяжелых модулей
const Chart = lazy(() => import('./components/Chart'));

// Route-level splitting в React Router
const routes = [
  {
    path: '/dashboard',
    lazy: () => import('./pages/Dashboard'),
  },
];
```

### Избегание layout thrashing

Layout thrashing возникает, когда код чередует чтение и запись DOM-свойств, вызывая принудительный reflow на каждом чтении:

```ts
// Плохо - forced synchronous layout на каждой итерации
items.forEach((item) => {
  const height = item.offsetHeight; // чтение - forced reflow
  item.style.height = height * 2 + 'px'; // запись
});

// Хорошо - batch read, then batch write
const heights = items.map((item) => item.offsetHeight);
items.forEach((item, i) => {
  item.style.height = heights[i] * 2 + 'px';
});
```

### Web Workers

Вынесение тяжелых вычислений в отдельный поток:

```ts
// worker.ts
self.addEventListener('message', (e: MessageEvent<number[]>) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
});

// main.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url));

worker.postMessage(largeDataset);
worker.addEventListener('message', (e) => {
  updateUI(e.data);
});
```

### Debouncing и throttling

```ts
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Поиск - debounce 300ms
const handleSearch = debounce((query: string) => {
  fetchResults(query);
}, 300);

// Scroll handler - requestAnimationFrame throttle
function onScroll(): void {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollPosition();
      ticking = false;
    });
    ticking = true;
  }
}
```

---
## Оптимизация CLS

### Явные размеры для медиа-элементов

```html
<!-- Всегда указывайте width и height -->
<img src="/photo.webp" alt="Photo" width="800" height="600" />

<!-- Для responsive - aspect-ratio через CSS -->
<style>
  .responsive-img {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
</style>

<!-- Iframe с зарезервированным пространством -->
<iframe
  src="https://www.youtube.com/embed/..."
  width="560"
  height="315"
  style="aspect-ratio: 16/9; width: 100%; height: auto;"
></iframe>
```

### Резервирование места для динамического контента

```css
/* Skeleton для рекламного блока */
.ad-slot {
  min-height: 250px;
  background: var(--skeleton-bg);
}

/* Контейнер для lazy-loaded контента */
.lazy-section {
  min-height: 400px;
  contain: layout;
}
```

`contain: layout` изолирует элемент от влияния на layout остальной страницы.

### Контент не должен вставляться выше видимой области

Вставка баннеров, уведомлений или динамического контента выше viewport вызывает смещение всего контента вниз. Решения:
- Использовать фиксированные или sticky элементы, не влияющие на flow
- Резервировать пространство заранее
- Использовать CSS-анимацию для плавного появления

### Стратегия загрузки шрифтов

```css
/* size-adjust для минимизации CLS при замене шрифта */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: 'Inter', 'Inter Fallback', sans-serif;
}
```

> [!summary]
> `size-adjust`, `ascent-override`, `descent-override` и `line-gap-override` подгоняют метрики fallback-шрифта под кастомный, минимизируя layout shift при замене. Next.js делает это автоматически через `next/font`.

---
## Интеграция в приложения

### React и Next.js

```ts
// app/vitals.ts (Next.js App Router)
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

export function reportWebVitals(): void {
  onCLS(sendMetric);
  onINP(sendMetric);
  onLCP(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}

function sendMetric(metric: Metric): void {
  fetch('/api/vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    keepalive: true,
  });
}
```

```ts
// app/layout.tsx
'use client';

import { useEffect } from 'react';

export function VitalsReporter(): JSX.Element | null {
  useEffect(() => {
    import('./vitals').then((mod) => mod.reportWebVitals());
  }, []);

  return null;
}
```

Next.js с `@vercel/analytics` предоставляет zero-config мониторинг Web Vitals при деплое на Vercel.

### Angular

```ts
// app.component.ts
import { Component, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor() {
    afterNextRender(async () => {
      const { onCLS, onINP, onLCP } = await import('web-vitals');
      onCLS(console.log);
      onINP(console.log);
      onLCP(console.log);
    });
  }
}
```

### Vue и Nuxt

```ts
// plugins/web-vitals.client.ts (Nuxt 3)
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
      onCLS(console.log);
      onINP(console.log);
      onLCP(console.log);
    });
  }
});
```

### Performance budgets в CI/CD

Lighthouse CI позволяет задавать пороговые значения и блокировать merge при их нарушении:

```bash
npm i -D @lhci/cli
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/about"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

```yaml
# GitHub Actions
- name: Lighthouse CI
  run: |
    npm run build
    npx @lhci/cli autorun
```

> [!important]
> Performance budgets в CI - единственный надежный способ предотвратить деградацию метрик. Без автоматизированных проверок регрессии накапливаются незаметно.
