---
tags:
  - frontend
---

## Feature-first структура

Для прикладных проектов удобнее группировать код вокруг фич, а не вокруг технических типов файлов. Так проще удалять, переносить и понимать сценарии.

```txt
src/
	app/
		providers/
		router/
	pages/
		users-page/
		settings-page/
	features/
		create-user/
		update-user-role/
	entities/
		user/
		project/
	shared/
		api/
		config/
		lib/
		ui/
```

## Слои

Пример правил зависимостей:

- `app` может импортировать всё;
- `pages` собирают `features`, `entities`, `shared`;
- `features` используют `entities` и `shared`;
- `entities` используют только `shared`;
- `shared` не знает про бизнес-домен.

Такой порядок снижает циклические зависимости и не даёт утилитам превращаться в свалку бизнес-логики.

## Public API

У модуля должен быть понятный внешний вход через `index.ts`. Внутренние файлы остаются деталями реализации.

```txt
features/create-user/
	index.ts
	ui/create-user-button.tsx
	model/use-create-user.ts
	api/create-user.ts
	lib/map-form-to-payload.ts
```

```ts
export { CreateUserButton } from './ui/create-user-button';
export { useCreateUser } from './model/use-create-user';
```

## Разделение внутри фичи

```txt
feature-name/
	api/      // запросы и DTO конкретной фичи
	model/    // hooks, store, selectors, state machine
	lib/      // чистые функции
	ui/       // компоненты
	types.ts  // локальные типы фичи
```

Если папка содержит один файл, не нужно заранее создавать все подпапки. Структура должна помогать, а не быть ритуалом.

## API boundary

Данные с backend лучше не пускать напрямую во весь UI. На границе API удобно валидировать, нормализовать и преобразовывать DTO в доменную модель.

```ts
type UserDto = {
	id: string;
	full_name: string;
	created_at: string;
};

type User = {
	id: string;
	fullName: string;
	createdAt: Date;
};

function mapUserDto(dto: UserDto): User {
	return {
		id: dto.id,
		fullName: dto.full_name,
		createdAt: new Date(dto.created_at),
	};
}
```

## Именование

Хорошие имена показывают роль:

- `getUser` - запрос или чтение;
- `createUser` - команда;
- `mapUserDto` - преобразование структуры;
- `formatUserName` - представление;
- `selectActiveUsers` - selector;
- `useCreateUser` - React hook;
- `UserCard` - UI-компонент.

Плохие универсальные имена: `helpers`, `utils`, `common`, `data`, `misc`. Их можно использовать только на нижнем уровне `shared/lib`, когда функция действительно доменно-нейтральная.

## Shared не должен знать о фичах

Если `shared/ui/button` импортирует `features/auth`, архитектура перевёрнута. Общий UI должен принимать данные и callbacks через props.

```tsx
type ButtonProps = PropsWithChildren<{
	isLoading?: boolean;
	onClick?: () => void;
}>;
```

## Config

Конфигурацию лучше держать отдельно от компонентов и читать через один слой.

```ts
export const config = {
	apiUrl: import.meta.env.VITE_API_URL,
	sentryDsn: import.meta.env.VITE_SENTRY_DSN,
} as const;
```

## Точки роста

Когда проект растёт, полезно добавить:

- path aliases для стабильных импортов;
- ESLint rules на запрет импортов между слоями;
- code owners для крупных областей;
- Storybook для shared UI;
- contract tests или schema validation для API boundary.
