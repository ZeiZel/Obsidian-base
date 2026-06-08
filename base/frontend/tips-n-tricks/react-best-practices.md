---
tags:
  - frontend
---

## Компоненты

Хороший компонент имеет одну основную причину для изменения. Если компонент одновременно грузит данные, хранит форму, рендерит таблицу, управляет модалкой и форматирует даты, его стоит разделить.

Практичный разрез:

- `Page` - собирает экран, роутинг, крупные блоки;
- `Feature` - бизнес-сценарий: фильтр, форма, список, wizard;
- `Entity` - отображение доменной сущности;
- `Shared UI` - переиспользуемые кнопки, поля, модалки;
- `lib` - чистые функции, адаптеры, форматтеры.

```tsx
function UsersPage() {
	return (
		<main>
			<UsersToolbar />
			<UsersTable />
		</main>
	);
}
```

## Состояние

Перед добавлением глобального store стоит определить тип состояния:

- local UI state - открыта ли модалка, выбранная вкладка, значение инпута;
- server state - данные, полученные с API, кеш, статус запроса;
- url state - фильтры, сортировка, пагинация, выбранная сущность;
- global client state - авторизация, тема, feature flags, межстраничный UI.

Server state лучше хранить в TanStack Query, RTK Query, Apollo или аналогичном инструменте. Фильтры и пагинацию часто лучше держать в URL, чтобы работали back/forward, шаринг ссылки и восстановление страницы.

```ts
const searchParams = new URLSearchParams(location.search);

const page = Number(searchParams.get('page') ?? 1);
const status = searchParams.get('status') ?? 'all';
```

## Эффекты

`useEffect` нужен для синхронизации с внешней системой: DOM API, подписки, timers, аналитика, сторонний SDK. Если код только вычисляет значение из props/state, нужен не effect, а обычное вычисление или `useMemo`.

```tsx
const visibleUsers = users.filter((user) => user.status === selectedStatus);
```

```tsx
useEffect(() => {
	const controller = new AbortController();

	void fetchUsers({ signal: controller.signal });

	return () => controller.abort();
}, []);
```

## Не дублировать derived state

Если значение можно вычислить из уже существующего состояния, не стоит хранить его отдельно.

```tsx
const completedCount = todos.filter((todo) => todo.completed).length;
```

Плохой сигнал - `useEffect`, который при каждом изменении одного state пересчитывает и записывает другой state.

## Compound components

Для связанного UI можно использовать compound-подход: внешне API остаётся читаемым, а внутреннее состояние скрыто внутри компонента.

```tsx
<Tabs defaultValue="profile">
	<Tabs.List>
		<Tabs.Trigger value="profile">Профиль</Tabs.Trigger>
		<Tabs.Trigger value="billing">Оплата</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Panel value="profile">...</Tabs.Panel>
	<Tabs.Panel value="billing">...</Tabs.Panel>
</Tabs>
```

## Custom hooks

Хук должен инкапсулировать поведение, а не просто прятать две строки кода. Хорошие кандидаты: работа с URL-параметрами, подписки, autosave, keyboard shortcuts, медиа-запросы, синхронизация с localStorage.

```ts
function useBoolean(defaultValue = false) {
	const [value, setValue] = useState(defaultValue);

	return {
		value,
		setTrue: () => setValue(true),
		setFalse: () => setValue(false),
		toggle: () => setValue((current) => !current),
	};
}
```

## Стабильные props

Не нужно механически оборачивать всё в `useMemo` и `useCallback`. Они полезны, когда:

- значение передаётся в memoized-компонент;
- зависимость используется в тяжёлом вычислении;
- ссылка важна для подписки или внешнего API;
- профилирование показало лишние перерендеры.

```tsx
const columns = useMemo(() => createUserColumns({ onEdit }), [onEdit]);
```

## Формы

Для больших форм лучше разделять:

- schema - правила и типы;
- default values - начальное состояние;
- submit adapter - преобразование формы в API payload;
- UI components - поля и layout.

```ts
import { z } from 'zod';

export const userFormSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	role: z.enum(['admin', 'manager', 'viewer']),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
```

## Ошибки

Ошибка запроса, ошибка валидации и неожиданный exception - разные случаи. Для них должны быть разные места обработки:

- validation error - рядом с полем;
- request error - рядом с действием или секцией;
- render error - Error Boundary;
- unknown error - fallback и логирование.

```tsx
function toErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message;

	return 'Произошла неизвестная ошибка';
}
```

## Тестируемость

Чем меньше бизнес-логики в JSX, тем проще тестировать. Форматирование, фильтрацию, сортировку, нормализацию и доступы лучше выносить в чистые функции.

```ts
function canEditUser(currentUser: User, targetUser: User) {
	return currentUser.role === 'admin' && currentUser.id !== targetUser.id;
}
```
