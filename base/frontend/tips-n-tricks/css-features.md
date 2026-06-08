---
tags:
  - frontend
  - css
---

## Container queries

Container queries позволяют адаптировать компонент под размер родительского контейнера, а не всего viewport. Это полезно для карточек, виджетов, сайдбаров и сеток, где один и тот же компонент живёт в разных местах.

```css
.profile-card {
	container-type: inline-size;
	container-name: profile-card;
}

@container profile-card (min-width: 420px) {
	.profile-card__content {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 16px;
	}
}
```

## CSS custom properties

CSS-переменные удобны для темизации, состояний и локальной настройки компонента.

```css
.button {
	--button-bg: #1d4ed8;
	--button-fg: #ffffff;

	background: var(--button-bg);
	color: var(--button-fg);
}

.button[data-variant='danger'] {
	--button-bg: #b91c1c;
}
```

## Стабильные классы

Стили должны опираться на стабильные классы, data-атрибуты и semantic state. Не стоит завязывать CSS на случайную структуру DOM, автогенерированные классы или текст внутри элемента.

```css
.tabs [data-state='active'] {
	color: var(--color-accent);
	border-bottom-color: currentColor;
}
```

## Динамические классы

Если сторонняя библиотека создаёт класс с динамическим суффиксом, можно искать стабильную часть имени.

```css
[class*='copyrights-pane'] {
	opacity: 0;
	transition: opacity 0.2s ease-in;
}

.map:hover [class*='copyrights-pane'] {
	opacity: 1;
}
```

Это лучше держать рядом с интеграцией и комментировать, потому что такие селекторы зависят от внутренней реализации библиотеки.

## before и after

Псевдоэлементы хорошо подходят для декоративных слоёв, маркеров, разделителей, иконок без интерактивности и расширения hit area.

```css
.field-label::after {
	content: '*';
	margin-left: 4px;
	color: var(--color-danger);
}
```

```css
.link {
	position: relative;
}

.link::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	bottom: -2px;
	height: 1px;
	background: currentColor;
	transform: scaleX(0);
	transform-origin: left;
	transition: transform 160ms ease;
}

.link:hover::after {
	transform: scaleX(1);
}
```

Не стоит класть важный текст в `content`, если его должны читать скринридеры, копировать пользователи или индексировать поиск.

## Interaction states

У интерактивного элемента должны быть состояния `hover`, `focus-visible`, `active`, `disabled`, `aria-disabled` и loading-state, если действие асинхронное.

```css
.button:hover {
	background: var(--button-bg-hover);
}

.button:focus-visible {
	outline: 2px solid var(--color-focus);
	outline-offset: 2px;
}

.button:disabled,
.button[aria-disabled='true'] {
	cursor: not-allowed;
	opacity: 0.56;
}
```

## Cascade layers

Cascade layers помогают управлять порядком CSS без роста специфичности.

```css
@layer reset, tokens, base, components, utilities;

@layer components {
	.card {
		border: 1px solid var(--color-border);
	}
}

@layer utilities {
	.hidden {
		display: none;
	}
}
```

## Debug styles

Для поиска layout-багов полезно временно включать диагностические стили.

```css
* {
	outline: 1px solid rgb(255 0 0 / 20%);
}
```

```css
img,
svg,
video,
canvas {
	background: rgb(255 255 0 / 15%);
}
```

```css
[style],
[class=''],
[id=''] {
	outline: 2px dashed rgb(255 0 255 / 60%);
}
```

## Поиск CSS-багов

Порядок проверки:

1. Отключить подозрительное правило в DevTools.
2. Проверить computed styles, а не только matched rules.
3. Посмотреть box model: размеры, padding, border, margin.
4. Проверить overflow и stacking context.
5. Проверить media/container queries.
6. Проверить, не перебивает ли стиль более специфичный selector или inline style.

Частые причины:

- родитель имеет `overflow: hidden`;
- элемент находится в новом stacking context из-за `transform`, `filter`, `opacity`, `isolation`, `position` + `z-index`;
- `min-width: auto` ломает flex-children;
- изображение не ограничено `max-width: 100%`;
- текст не переносится из-за `white-space: nowrap`;
- CSS Module класс не применился из-за неверного import.

## Полезные snippets

```css
.truncate {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
```

```css
.scroll-area {
	overflow: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
}
```

```css
.center {
	display: grid;
	place-items: center;
}
```

```css
.stack {
	display: flex;
	flex-direction: column;
	gap: var(--stack-gap, 16px);
}
```
