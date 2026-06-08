---
tags:
  - frontend
  - css
---

## Reset and reboot

Базовый reset убирает различия браузеров, задаёт предсказуемую box model и делает медиа-элементы безопасными для responsive layout.

```css
@layer reset {
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	* {
		margin: 0;
	}

	html {
		-webkit-text-size-adjust: 100%;
		text-size-adjust: 100%;
	}

	body {
		min-height: 100vh;
		line-height: 1.5;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
	}

	img,
	picture,
	video,
	canvas,
	svg {
		display: block;
		max-width: 100%;
	}

	input,
	button,
	textarea,
	select {
		font: inherit;
		color: inherit;
	}

	button {
		cursor: pointer;
		background: transparent;
		border: 0;
	}

	button:disabled {
		cursor: not-allowed;
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	ul,
	ol {
		padding: 0;
		list-style: none;
	}

	table {
		border-collapse: collapse;
		border-spacing: 0;
	}
}
```

## Visually hidden

Класс скрывает элемент визуально, но оставляет его доступным для скринридеров. Полезно для скрытых заголовков секций, label-текста и дополнительного контекста.

```css
.visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	white-space: nowrap;
	border: 0;
	clip: rect(0 0 0 0);
	clip-path: inset(50%);
}
```

## Focus ring

```css
:focus {
	outline: none;
}

:focus-visible {
	outline: 2px solid var(--color-focus, #2563eb);
	outline-offset: 2px;
}
```

## Theme tokens

```css
:root {
	color-scheme: light;

	--color-bg: #ffffff;
	--color-fg: #111827;
	--color-muted: #6b7280;
	--color-border: #d1d5db;
	--color-focus: #2563eb;
	--color-danger: #dc2626;

	--radius-sm: 4px;
	--radius-md: 8px;

	--space-1: 4px;
	--space-2: 8px;
	--space-3: 12px;
	--space-4: 16px;
	--space-6: 24px;
}

[data-theme='dark'] {
	color-scheme: dark;

	--color-bg: #111827;
	--color-fg: #f9fafb;
	--color-muted: #9ca3af;
	--color-border: #374151;
}
```

## Layout helpers

```css
.container {
	width: min(100% - 32px, var(--container-width, 1120px));
	margin-inline: auto;
}

.cluster {
	display: flex;
	flex-wrap: wrap;
	gap: var(--cluster-gap, 12px);
	align-items: center;
}

.stack {
	display: flex;
	flex-direction: column;
	gap: var(--stack-gap, 16px);
}

.center {
	display: grid;
	place-items: center;
}
```

## Text helpers

```css
.truncate {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.line-clamp-2 {
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.text-balance {
	text-wrap: balance;
}
```

## Safe media

```css
.media-cover {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.media-contain {
	width: 100%;
	height: 100%;
	object-fit: contain;
}
```

## Motion preferences

```css
@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		scroll-behavior: auto !important;
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
	}
}
```

## Form base

```css
.field {
	display: grid;
	gap: 6px;
}

.field__label {
	font-weight: 500;
}

.field__control {
	width: 100%;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
	padding: 8px 10px;
	background: var(--color-bg);
}

.field__control[aria-invalid='true'] {
	border-color: var(--color-danger);
}

.field__error {
	color: var(--color-danger);
	font-size: 0.875rem;
}
```
