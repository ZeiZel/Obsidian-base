---
tags:
  - frontend
---

## React

### usehooks-ts

Набор готовых React hooks для типовых задач: localStorage, media queries, click outside, debounce, event listener, copy to clipboard.

```ts
import { useLocalStorage, useOnClickOutside } from 'usehooks-ts';
```

```tsx
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

Когда полезно:

- не хочется писать и поддерживать однотипные hooks;
- нужен быстрый прототип;
- команда договорилась брать типовые hooks из одного места.

### TanStack Query

Server state: кеширование, refetch, retry, optimistic updates, pagination, infinite queries, mutation lifecycle.

```ts
const { data, isLoading, error } = useQuery({
	queryKey: ['users', filters],
	queryFn: () => getUsers(filters),
});
```

### React Hook Form

Формы с минимальным количеством лишних перерендеров. Хорошо сочетается с Zod через resolver.

```ts
const form = useForm<UserFormValues>({
	resolver: zodResolver(userFormSchema),
});
```

### Zustand

Лёгкий client state для случаев, когда Context уже неудобен, а Redux избыточен.

```ts
const useSidebarStore = create<{
	isOpen: boolean;
	toggle: () => void;
}>((set) => ({
	isOpen: false,
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
```

### Radix UI

Headless-компоненты с фокусом на доступность: Dialog, Popover, Dropdown, Tooltip, Tabs. Подходит, когда нужна своя визуальная система без реализации сложного поведения с нуля.

## JavaScript и TypeScript

### lodash / lodash-es

Утилиты для коллекций, объектов и функций. В современных проектах часто лучше импортировать точечно или использовать `lodash-es`.

```ts
import groupBy from 'lodash-es/groupBy';
import debounce from 'lodash-es/debounce';
import uniqBy from 'lodash-es/uniqBy';
```

```ts
const usersByRole = groupBy(users, 'role');
const uniqueUsers = uniqBy(users, 'id');
const saveDraft = debounce((value: Draft) => api.saveDraft(value), 600);
```

Частые функции:

- `debounce`, `throttle` - ограничение частоты вызовов;
- `groupBy`, `keyBy` - группировка и индексация коллекций;
- `uniqBy` - удаление дублей по ключу;
- `sortBy`, `orderBy` - сортировка;
- `pick`, `omit` - выбор полей объекта;
- `isEqual` - глубокое сравнение.

### ts-pattern

Pattern matching для TypeScript. Удобен для discriminated unions, состояний загрузки и сложных switch.

```ts
const label = match(status)
	.with('idle', () => 'Ожидает')
	.with('loading', () => 'Загрузка')
	.with('success', () => 'Готово')
	.with('error', () => 'Ошибка')
	.exhaustive();
```

## Даты

### date-fns

Функциональный набор для дат: форматирование, сравнение, интервалы, add/sub, parse. Удобен тем, что функции импортируются отдельно.

```ts
import { addDays, format, isAfter } from 'date-fns';
import { ru } from 'date-fns/locale';
```

```ts
const deadline = addDays(new Date(), 7);
const label = format(deadline, 'd MMMM yyyy', { locale: ru });
const isExpired = isAfter(new Date(), deadline);
```

### Day.js

Небольшая библиотека с API, похожим на Moment.js. Удобна, если команде нужен chain-style API.

```ts
const label = dayjs(date).add(7, 'day').format('DD.MM.YYYY');
```

## Валидация

### Zod

Runtime-валидация и вывод TypeScript-типов из схемы. Полезен на границах системы: формы, API responses, env config, query params.

```ts
import { z } from 'zod';

const UserSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	role: z.enum(['admin', 'manager', 'viewer']),
});

type User = z.infer<typeof UserSchema>;

const user = UserSchema.parse(payload);
```

### Valibot

Альтернатива Zod с фокусом на модульность и размер bundle. Имеет смысл смотреть для frontend-приложений, где критичен вес.

## Angular

### RxJS

База для реактивной работы в Angular: `Observable`, `Subject`, `switchMap`, `combineLatest`, `debounceTime`, `catchError`.

```ts
this.users$ = this.searchControl.valueChanges.pipe(
	debounceTime(300),
	distinctUntilChanged(),
	switchMap((query) => this.usersApi.searchUsers(query)),
);
```

### NgRx

Экосистема для Angular state management: Store, Effects, Entity, Router Store, DevTools, Signals. Подходит для больших приложений со сложным shared state и сайд-эффектами.

```ts
export const loadUsers = createAction('[Users] Load Users');
export const loadUsersSuccess = createAction(
	'[Users] Load Users Success',
	props<{ users: User[] }>(),
);
```

### Angular CDK

Низкоуровневые building blocks: overlay, portal, drag and drop, virtual scroll, a11y helpers. Полезен даже без Angular Material.

## UI и стили

### Tailwind CSS

Утилитарная стилизация. Хорошо работает с дизайн-токенами, быстрыми прототипами и компонентным подходом.

### class-variance-authority

Описание вариантов компонентов через типизированную конфигурацию. Часто используется вместе с Tailwind.

```ts
const buttonVariants = cva('inline-flex items-center', {
	variants: {
		variant: {
			primary: 'bg-blue-600 text-white',
			secondary: 'bg-gray-100 text-gray-900',
		},
		size: {
			sm: 'h-8 px-3',
			md: 'h-10 px-4',
		},
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md',
	},
});
```

### clsx

Удобная сборка классов по условиям.

```ts
const className = clsx('button', isActive && 'button_active', isDisabled && 'opacity-50');
```

## Таблицы, графики, виртуализация

### TanStack Table

Headless-таблицы: сортировка, фильтры, пагинация, grouping, row selection. Подходит, когда визуальный слой должен быть своим.

### TanStack Virtual

Виртуализация длинных списков и таблиц.

### Recharts / ECharts

Графики и диаграммы. Recharts проще для React-интерфейсов, ECharts мощнее для сложной аналитики.

## Тестирование и качество

### Testing Library

Тестирование поведения интерфейса через пользовательские сценарии, а не внутреннюю структуру компонентов.

### MSW

Mock Service Worker перехватывает network-запросы и подходит для тестов, Storybook и локальной разработки без backend.

### Storybook

Изолированная разработка UI-компонентов, визуальные состояния, документация props, regression testing.

## Выбор по задаче

| Задача | Библиотеки |
|---|---|
| Server state | TanStack Query, RTK Query, Apollo |
| Client state | Zustand, Jotai, Redux Toolkit, NgRx |
| Формы | React Hook Form, Formik, Angular Reactive Forms |
| Валидация | Zod, Valibot, Yup |
| Даты | date-fns, Day.js, Luxon |
| Утилиты | lodash-es, remeda, radash |
| UI primitives | Radix UI, Base UI, Angular CDK |
| Таблицы | TanStack Table, AG Grid |
| Виртуализация | TanStack Virtual, react-window |
| Запросы | fetch, ky, axios |
| Тесты API | MSW |
| E2E | Playwright, Cypress |
