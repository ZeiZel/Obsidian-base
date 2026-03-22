---
tags:
  - frontend
  - tailwind
  - css
---
##### [Документация](https://tailwindcss.com/docs)

## Tailwind CSS v4

Tailwind CSS - это utility-first CSS-фреймворк, который предоставляет набор низкоуровневых утилитарных классов для построения интерфейсов прямо в разметке. Вместо написания кастомного CSS создаются композиции из атомарных классов вроде `flex`, `pt-4`, `text-center`, `rounded-lg`.

Четвертая версия - это полная переработка фреймворка. Конфигурация перенесена из JavaScript в CSS, движок переписан на Rust для значительного ускорения сборки, а многие паттерны упрощены.

Основные изменения в v4:

- CSS-first конфигурация через директиву `@theme` вместо `tailwind.config.js`
- Единая точка входа `@import "tailwindcss"` вместо трех директив `@tailwind`
- Новый высокопроизводительный движок на Rust (Oxide)
- Автоматическое обнаружение контента без настройки `content`
- Нативная поддержка каскадных слоев CSS
- Встроенная поддержка container queries
- Директива `@utility` для создания кастомных утилит
- Директива `@custom-variant` для кастомных вариантов

## Установка

### Vite (рекомендуемый способ)

Установка пакетов:

```bash
npm install tailwindcss @tailwindcss/vite
```

Подключение плагина в `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

CSS-файл (например `app.css`):

```css
@import "tailwindcss";
```

Этого достаточно. Никакого `tailwind.config.js`, никакого PostCSS-конфига, никакой настройки `content`. Tailwind v4 сам обнаруживает файлы с классами.

### PostCSS

Для проектов без Vite (Webpack, Turbopack и др.):

```bash
npm install tailwindcss @tailwindcss/postcss autoprefixer
```

`postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### CLI

Для проектов без сборщика:

```bash
npx @tailwindcss/cli -i input.css -o output.css --watch
```

## CSS-First конфигурация

### Директива @theme

Вся кастомизация темы происходит в CSS через директиву `@theme`. Переменные, определенные внутри `@theme`, автоматически генерируют соответствующие утилитарные классы.

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --font-display: "Inter", sans-serif;
  --breakpoint-3xl: 1920px;
}
```

Эта конфигурация создаст утилиты `bg-primary`, `text-secondary`, `font-display` и вариант `3xl:`, а также CSS-переменные `var(--color-primary)` и т.д.

> [!info] Разница между @theme и :root
> Переменные в `@theme` генерируют утилитарные классы. Переменные в `:root` - это обычные CSS-переменные без привязки к утилитам. Для дизайн-токенов используйте `@theme`.

### Пространства имен переменных

| Пространство имен | Что генерирует | Пример |
|---|---|---|
| `--color-*` | Утилиты цветов | `bg-red-500`, `text-sky-300` |
| `--font-*` | Семейство шрифтов | `font-sans`, `font-mono` |
| `--text-*` | Размер шрифта | `text-xl`, `text-2xl` |
| `--font-weight-*` | Жирность шрифта | `font-bold`, `font-semibold` |
| `--spacing-*` | Отступы и размеры | `px-4`, `max-h-16`, `gap-3` |
| `--radius-*` | Скругление | `rounded-sm`, `rounded-lg` |
| `--shadow-*` | Тени | `shadow-md`, `shadow-lg` |
| `--breakpoint-*` | Адаптивные варианты | `sm:flex`, `lg:hidden` |

### Расширение темы

По умолчанию новые переменные добавляются к существующим значениям. Все дефолтные утилиты остаются:

```css
@theme {
  --color-brand: #6366f1;
  --font-heading: "Montserrat", sans-serif;
  --spacing-18: 4.5rem;
}
```

### Замена дефолтных значений

Чтобы убрать все значения определенного пространства имен, используется `initial`:

```css
@theme {
  --color-*: initial;

  --color-white: #fff;
  --color-black: #000;
  --color-brand: #6366f1;
  --color-muted: #94a3b8;
}
```

Теперь доступны только указанные цвета. Все стандартные `red-500`, `blue-300` и т.д. удалены.

Для полного сброса всей темы:

```css
@theme {
  --*: initial;
  /* далее определяются только нужные значения */
}
```

### Переопределение конкретных значений

Можно точечно изменить конкретные дефолтные переменные:

```css
@theme {
  --breakpoint-sm: 30rem;
  --spacing: 0.25rem;
}
```

Базовый `--spacing` задает единицу для всей шкалы отступов. Значение `0.25rem` означает, что `p-4` будет равен `1rem` (4 * 0.25rem).

### Использование переменных темы в CSS

Все переменные из `@theme` доступны как обычные CSS-переменные:

```css
.custom-heading {
  font-size: var(--text-2xl);
  color: var(--color-gray-700);
  font-weight: var(--font-weight-semibold);
}
```

## Утилитарные классы

### Отступы (margin, padding)

```html
<!-- margin -->
<div class="m-4">margin: 1rem со всех сторон</div>
<div class="mx-4">margin по оси X</div>
<div class="my-4">margin по оси Y</div>
<div class="mt-4 mr-2 mb-4 ml-2">margin по отдельным сторонам</div>
<div class="mx-auto">центрирование по горизонтали</div>
<div class="-mt-4">отрицательный margin</div>

<!-- padding -->
<div class="p-4">padding: 1rem со всех сторон</div>
<div class="px-6 py-3">padding по осям</div>
```

Произвольные значения задаются в квадратных скобках:

```html
<div class="p-[13px]">padding: 13px</div>
<div class="mt-[2.5rem]">margin-top: 2.5rem</div>
```

### Типографика

```html
<!-- размер шрифта -->
<p class="text-sm">14px</p>
<p class="text-base">16px</p>
<p class="text-lg">18px</p>
<p class="text-2xl">24px</p>
<p class="text-[22px]">произвольный размер</p>

<!-- жирность -->
<p class="font-normal">400</p>
<p class="font-medium">500</p>
<p class="font-semibold">600</p>
<p class="font-bold">700</p>

<!-- выравнивание -->
<p class="text-left">по левому краю</p>
<p class="text-center">по центру</p>
<p class="text-right">по правому краю</p>

<!-- межстрочный интервал -->
<p class="leading-tight">1.25</p>
<p class="leading-normal">1.5</p>
<p class="leading-relaxed">1.625</p>

<!-- межбуквенный интервал -->
<p class="tracking-tight">-0.025em</p>
<p class="tracking-wide">0.025em</p>
```

### Цвета и фоны

В v4 прозрачность задается через модификатор `/` вместо отдельного класса `bg-opacity`:

```html
<!-- фон -->
<div class="bg-blue-500">сплошной фон</div>
<div class="bg-blue-500/50">фон с 50% прозрачностью</div>
<div class="bg-gradient-to-r from-blue-500 to-purple-500">градиент</div>

<!-- цвет текста -->
<p class="text-gray-700">цвет текста</p>
<p class="text-gray-700/80">текст с 80% прозрачностью</p>
```

### Flexbox

```html
<div class="flex items-center justify-between gap-4">
  <div class="shrink-0">не сжимается</div>
  <div class="grow">растягивается</div>
  <div class="basis-1/3">треть ширины</div>
</div>

<div class="flex flex-col gap-2">
  <div>вертикальный</div>
  <div>стек</div>
</div>

<div class="inline-flex items-center gap-1">
  <span>инлайновый flex</span>
</div>
```

### Grid

```html
<div class="grid grid-cols-3 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>

<div class="grid grid-cols-12 gap-6">
  <div class="col-span-8">основной контент</div>
  <div class="col-span-4">сайдбар</div>
</div>

<div class="grid grid-rows-[auto_1fr_auto] min-h-screen">
  <header>шапка</header>
  <main>контент</main>
  <footer>подвал</footer>
</div>
```

### Размеры (width, height)

```html
<div class="w-full">width: 100%</div>
<div class="w-screen">width: 100vw</div>
<div class="w-64">width: 16rem</div>
<div class="w-1/2">width: 50%</div>
<div class="max-w-md">max-width: 28rem</div>
<div class="min-w-0">min-width: 0</div>

<div class="h-screen">height: 100vh</div>
<div class="h-dvh">height: 100dvh (dynamic viewport)</div>
<div class="min-h-screen">min-height: 100vh</div>

<!-- size задает и width, и height одновременно -->
<div class="size-10">width: 2.5rem; height: 2.5rem</div>
<div class="size-full">width: 100%; height: 100%</div>
```

### Рамки и скругления

В v4 шкала скруглений переименована. `rounded-sm` из v3 стал `rounded-xs`, а `rounded` стал `rounded-sm`:

```html
<div class="border border-gray-200">рамка 1px</div>
<div class="border-2 border-blue-500">рамка 2px</div>
<div class="border-b border-gray-200">только нижняя рамка</div>

<div class="rounded-sm">небольшое скругление</div>
<div class="rounded-lg">большое скругление</div>
<div class="rounded-full">полный круг</div>
<div class="rounded-t-lg">скругление только сверху</div>
```

### Тени и эффекты

Шкала теней также переименована. `shadow` из v3 стал `shadow-sm`, `shadow-sm` стал `shadow-xs`:

```html
<div class="shadow-xs">минимальная тень</div>
<div class="shadow-sm">маленькая тень</div>
<div class="shadow-md">средняя тень</div>
<div class="shadow-lg">большая тень</div>

<div class="opacity-50">50% прозрачности</div>
<div class="backdrop-blur-sm">размытие фона</div>
```

### Переходы и анимации

```html
<button class="bg-blue-500 transition-colors hover:bg-blue-600">
  плавная смена цвета
</button>

<button class="transition-all duration-300 ease-in-out">
  плавный переход всех свойств за 300ms
</button>

<div class="transition-transform hover:scale-105">
  увеличение при наведении
</div>

<div class="animate-spin">вращение</div>
<div class="animate-pulse">пульсация</div>
<div class="animate-bounce">прыжок</div>
```

## Адаптивный дизайн

### Брейкпоинты

Tailwind использует подход mobile-first. Префикс применяет стиль начиная с указанной ширины и выше:

| Префикс | Минимальная ширина | CSS |
|---|---|---|
| `sm` | 640px | `@media (min-width: 640px)` |
| `md` | 768px | `@media (min-width: 768px)` |
| `lg` | 1024px | `@media (min-width: 1024px)` |
| `xl` | 1280px | `@media (min-width: 1280px)` |
| `2xl` | 1536px | `@media (min-width: 1536px)` |

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 1 колонка на мобильных, 2 на планшетах, 3 на десктопе -->
</div>

<p class="text-sm md:text-base lg:text-lg">
  размер шрифта растет с шириной экрана
</p>
```

### Кастомные брейкпоинты

```css
@theme {
  --breakpoint-3xl: 1920px;
  --breakpoint-tablet: 860px;
}
```

```html
<div class="hidden 3xl:block">видно только на широких экранах</div>
```

### Container queries

В v4 container queries встроены и не требуют отдельного плагина:

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @lg:gap-8">
    <!-- layout зависит от ширины контейнера, а не окна -->
  </div>
</div>
```

Именованные контейнеры:

```html
<div class="@container/sidebar">
  <div class="@md/sidebar:hidden">
    скрывается когда sidebar достаточно широкий
  </div>
</div>
```

## Состояния и псевдоклассы

### Интерактивные состояния

```html
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
  кнопка
</button>
```

### Группы и соседи

`group` позволяет стилизовать дочерние элементы в зависимости от состояния родителя:

```html
<div class="group rounded-lg p-4 hover:bg-gray-100">
  <h3 class="group-hover:text-blue-600">заголовок</h3>
  <p class="group-hover:text-gray-900">описание</p>
</div>
```

`peer` работает аналогично, но для соседних элементов:

```html
<input class="peer" type="email" placeholder="Email" />
<p class="hidden peer-invalid:block text-red-500">
  Некорректный email
</p>
```

### Структурные псевдоклассы

```html
<ul>
  <li class="first:pt-0 last:pb-0 odd:bg-gray-50 even:bg-white">
    элемент списка
  </li>
</ul>
```

### Псевдоэлементы

```html
<label class="after:content-['*'] after:text-red-500 after:ml-0.5">
  Обязательное поле
</label>

<blockquote class="before:content-['\201C'] before:text-4xl before:text-gray-300">
  цитата
</blockquote>
```

### Темный режим

По умолчанию `dark:` реагирует на системную тему через `prefers-color-scheme`:

```html
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-gray-900 dark:text-white">заголовок</h1>
  <p class="text-gray-600 dark:text-gray-400">текст</p>
</div>
```

Для ручного переключения темы через CSS-класс нужно переопределить вариант:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

Тогда темная тема активируется классом `dark` на корневом элементе:

```html
<html class="dark">
  <body class="bg-white dark:bg-gray-900">...</body>
</html>
```

Для переключения через data-атрибут:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

## Composability

### @apply

Директива `@apply` позволяет использовать утилитарные классы внутри CSS:

```css
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
  @apply btn bg-blue-500 text-white hover:bg-blue-600;
}
```

> [!important] Рекомендация
> В v4 использование `@apply` не рекомендуется. Предпочтительный подход - компонентная экстракция на уровне фреймворка (React-компонент, Vue-компонент и т.д.), где классы живут в разметке.

### @utility

Директива `@utility` создает кастомные утилиты, которые работают с вариантами (hover, responsive и т.д.):

```css
@utility tab-4 {
  tab-size: 4;
}
```

Теперь `tab-4`, `hover:tab-4`, `lg:tab-4` работают как встроенные утилиты.

Функциональные утилиты с произвольными значениями:

```css
@utility scrollbar-hidden {
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
}
```

### @custom-variant

Регистрирует кастомный вариант:

```css
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
```

```html
<div class="theme-midnight:bg-black theme-midnight:text-white">
  стили для полуночной темы
</div>
```

### @variant

Применяет вариант Tailwind к обычному CSS:

```css
.my-element {
  background: white;
  @variant dark {
    background: black;
  }
  @variant hover {
    background: gray;
  }
}
```

### @reference

Позволяет использовать `@apply` в компонентных `<style>` блоках без дублирования CSS:

```vue
<style>
  @reference "tailwindcss";
  h1 {
    @apply text-2xl font-bold text-red-500;
  }
</style>
```

## Плагины

### @plugin

Плагины подключаются через директиву `@plugin` прямо в CSS вместо массива `plugins` в JS-конфиге:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

### Официальные плагины

Typography - стилизация прозаического контента:

```css
@plugin "@tailwindcss/typography";
```

```html
<article class="prose lg:prose-xl">
  <h1>Заголовок статьи</h1>
  <p>Текст статьи с хорошей типографикой из коробки.</p>
</article>
```

Forms - сброс и стилизация элементов форм:

```css
@plugin "@tailwindcss/forms";
```

Container queries (в v4 встроены, плагин не нужен для базового использования).

### Кастомные плагины

Плагины пишутся как JS-модули и подключаются через путь:

```css
@plugin "./plugins/custom-utilities.js";
```

```js
// plugins/custom-utilities.js
export default function ({ addUtilities, theme }) {
  addUtilities({
    ".text-shadow": {
      textShadow: "1px 1px rgba(0, 0, 0, 0.4)",
    },
    ".text-shadow-lg": {
      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
    },
  });
}
```

## Миграция с v3

### Автоматическая миграция

```bash
npx @tailwindcss/upgrade
```

> [!info] Требования
> Node.js 20 или выше. Утилита автоматически обновит зависимости, перенесет конфигурацию в CSS и изменит шаблоны.

### Основные изменения

Точка входа CSS:

```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import "tailwindcss";
```

Переименованные утилиты:

| v3 | v4 |
|---|---|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `outline-none` | `outline-hidden` |
| `ring` | `ring-3` |

Удаленные утилиты:

| v3 | v4 |
|---|---|
| `bg-opacity-50` | `bg-black/50` |
| `text-opacity-50` | `text-black/50` |
| `border-opacity-50` | `border-black/50` |
| `flex-shrink-*` | `shrink-*` |
| `flex-grow-*` | `grow-*` |

Произвольные значения с переменными:

```html
<!-- v3 -->
<div class="bg-[--brand-color]"></div>

<!-- v4 -->
<div class="bg-(--brand-color)"></div>
```

Кастомные утилиты:

```css
/* v3 */
@layer utilities {
  .tab-4 {
    tab-size: 4;
  }
}

/* v4 */
@utility tab-4 {
  tab-size: 4;
}
```

### Чек-лист миграции

- Обновить зависимости или запустить `npx @tailwindcss/upgrade`
- Заменить `@tailwind` директивы на `@import "tailwindcss"`
- Перенести `tailwind.config.js` в `@theme` в CSS
- Обновить переименованные утилиты
- Заменить `bg-opacity-*` на модификатор `/`
- Заменить `@layer utilities` на `@utility`
- Заменить `plugins: [require(...)]` на `@plugin`
- Обновить конфиг PostCSS на `@tailwindcss/postcss` или перейти на Vite-плагин
- Удалить `tailwind.config.js` после миграции
- Протестировать во всех браузерах (минимум Safari 16.4+, Chrome 111+, Firefox 128+)

## Интеграция с фреймворками

### React / Next.js

Next.js с App Router и Turbopack использует PostCSS:

```bash
npm install tailwindcss @tailwindcss/postcss autoprefixer
```

`postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

`app/globals.css`:

```css
@import "tailwindcss";
```

Для Next.js с Vite (экспериментально) можно использовать `@tailwindcss/vite`.

### Vue / Nuxt

Nuxt 3 с Vite:

```bash
npm install tailwindcss @tailwindcss/vite
```

`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  vite: {
    plugins: [require("@tailwindcss/vite").default()],
  },
});
```

Для использования `@apply` в компонентных `<style>` блоках:

```vue
<style scoped>
  @reference "tailwindcss";
  .heading {
    @apply text-2xl font-bold;
  }
</style>
```

### Angular

Angular использует PostCSS:

```bash
npm install tailwindcss @tailwindcss/postcss autoprefixer
```

`.postcssrc.json`:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

## Инструменты

### VS Code

Расширение Tailwind CSS IntelliSense дает автодополнение, подсветку цветов, линтинг классов и документацию при наведении. Устанавливается из маркетплейса VS Code.

### Сортировка классов

Prettier-плагин для автоматической сортировки классов в рекомендованном порядке:

```bash
npm install -D prettier-plugin-tailwindcss
```

`.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Объединение классов

Утилита `cn` на основе `clsx` и `tailwind-merge` для условного применения классов без конфликтов:

```bash
npm install clsx tailwind-merge
```

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Использование:

```tsx
function Button({ variant, className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        variant === "primary" && "bg-blue-500 text-white hover:bg-blue-600",
        variant === "outline" && "border border-gray-300 hover:bg-gray-50",
        className,
      )}
      {...props}
    />
  );
}
```

`tailwind-merge` корректно разрешает конфликты. Например, `cn("px-4", "px-6")` вернет `"px-6"`, а не `"px-4 px-6"`.
