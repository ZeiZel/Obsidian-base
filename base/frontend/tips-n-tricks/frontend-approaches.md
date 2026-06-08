---
tags:
  - frontend
---

## Формы

Формы лучше проектировать как отдельный сценарий, а не как набор инпутов. У формы должны быть понятные default values, схема валидации, преобразование данных для API и отдельная обработка ошибок.

Практики:

- хранить значения формы отдельно от server state;
- валидировать на клиенте для скорости, но не считать это заменой backend-валидации;
- показывать ошибку рядом с полем, а общую ошибку отправки рядом с submit-действием;
- блокировать только действие отправки, а не весь экран;
- не терять введённые данные при ошибке запроса;
- приводить пустые строки, даты и числа к формату API в одном adapter-файле.

```ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
	name: z.string().trim().min(1, 'Введите имя'),
	email: z.string().trim().email('Некорректный email'),
	role: z.enum(['admin', 'manager', 'viewer']),
});

export type CreateUserValues = z.infer<typeof CreateUserSchema>;

export function mapCreateUserValues(values: CreateUserValues) {
	return {
		name: values.name,
		email: values.email.toLowerCase(),
		role: values.role,
	};
}
```

## UX состояния

Для каждого интерактивного блока стоит заранее описывать состояния:

- `idle` - данные ещё не запрашивались или действие не начато;
- `loading` - первичная загрузка;
- `pending` - пользовательское действие выполняется;
- `empty` - данных нет, но ошибки нет;
- `success` - данные доступны;
- `error` - запрос или действие упали;
- `disabled` - действие сейчас недоступно.

```ts
type AsyncState<T> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'success'; data: T }
	| { status: 'empty' }
	| { status: 'error'; error: string };
```

Хороший UX не оставляет пользователя в неизвестности: после клика кнопка меняет состояние, после ошибки есть понятная причина и повтор, после успеха интерфейс показывает результат.

## Кэширование

Кэш нужен не только для скорости, но и для стабильного UX: меньше миганий, меньше повторных запросов, лучше работа back/forward и вкладок.

Что стоит кэшировать:

- справочники и редко меняющиеся данные;
- списки и карточки, которые пользователь часто открывает повторно;
- результаты фильтров и пагинации;
- текущего пользователя, права, feature flags.

Что не стоит кэшировать без осторожности:

- платежи и балансы;
- одноразовые токены;
- данные с жёсткими требованиями к свежести;
- персональные данные без понятной политики очистки.

```ts
const usersQuery = useQuery({
	queryKey: ['users', filters],
	queryFn: () => getUsers(filters),
	staleTime: 60_000,
	gcTime: 10 * 60_000,
});
```

Ключ кэша должен содержать все параметры, которые влияют на результат: фильтры, сортировку, страницу, id, локаль.

## Debounce

Debounce откладывает вызов до паузы во вводе. Подходит для поиска, autosave, resize, фильтров и expensive calculations.

```ts
function debounce<TArgs extends unknown[]>(
	callback: (...args: TArgs) => void,
	delayMs: number,
) {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return (...args: TArgs) => {
		if (timeoutId) clearTimeout(timeoutId);

		timeoutId = setTimeout(() => {
			callback(...args);
		}, delayMs);
	};
}
```

```ts
const searchUsers = debounce((query: string) => {
	void queryClient.invalidateQueries({ queryKey: ['users', query] });
}, 400);
```

## Throttling

Throttle ограничивает частоту вызова. Подходит для scroll, mousemove, drag, resize и аналитики.

```ts
function throttle<TArgs extends unknown[]>(
	callback: (...args: TArgs) => void,
	intervalMs: number,
) {
	let lastCall = 0;

	return (...args: TArgs) => {
		const now = Date.now();

		if (now - lastCall < intervalMs) return;

		lastCall = now;
		callback(...args);
	};
}
```

## Оптимистичные обновления

Оптимистичное обновление сразу показывает ожидаемый результат, а при ошибке откатывает состояние. Подходит для лайков, чекбоксов, reorder, быстрых CRUD-действий и добавления комментариев.

```tsx
function useToggleTodo() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: toggleTodo,

		onMutate: async ({ id, completed }) => {
			await queryClient.cancelQueries({ queryKey: ['todos'] });

			const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

			queryClient.setQueryData<Todo[]>(['todos'], (todos = []) =>
				todos.map((todo) => (todo.id === id ? { ...todo, completed } : todo)),
			);

			return { previousTodos };
		},

		onError: (_error, _variables, context) => {
			queryClient.setQueryData(['todos'], context?.previousTodos);
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] });
		},
	});
}
```

## Пессимистичные обновления

Пессимистичное обновление ждёт ответа сервера и только потом меняет UI. Это безопаснее для платежей, удаления аккаунта, изменения прав доступа и необратимых операций.

```tsx
const mutation = useMutation({
	mutationFn: deleteProject,
	onSuccess: () => {
		queryClient.invalidateQueries({ queryKey: ['projects'] });
	},
});

<button disabled={mutation.isPending} onClick={() => mutation.mutate(projectId)}>
	Удалить
</button>;
```

## Обработка ошибок

Ошибки лучше разделять по уровню:

- validation error - рядом с конкретным полем;
- request error - рядом с формой, кнопкой или секцией;
- empty state - не ошибка, а отдельное состояние;
- render error - Error Boundary;
- unknown error - fallback и логирование.

```ts
function toErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message;

	return 'Произошла неизвестная ошибка';
}
```

```tsx
function ErrorBlock({ error, onRetry }: { error: unknown; onRetry: () => void }) {
	return (
		<div role="alert">
			<p>{toErrorMessage(error)}</p>
			<button onClick={onRetry}>Повторить</button>
		</div>
	);
}
```

## Undo и idempotency

Для обратимых операций часто удобнее сделать действие сразу и дать отмену, чем показывать confirm-модалку.

```ts
function removeWithUndo<T>(items: T[], index: number) {
	const item = items[index];

	return {
		nextItems: items.filter((_, itemIndex) => itemIndex !== index),
		undo: (currentItems: T[]) => [
			...currentItems.slice(0, index),
			item,
			...currentItems.slice(index),
		],
	};
}
```

Для create-запросов полезно отправлять `idempotencyKey`, чтобы повторный клик или retry не создали дубликат.

```ts
function createIdempotencyKey(prefix: string) {
	return `${prefix}_${crypto.randomUUID()}`;
}
```

## Autosave

Autosave должен быть заметным и предсказуемым: пользователь видит `saving`, `saved`, `error`, а данные не исчезают при сетевой ошибке.

```ts
type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function getAutosaveLabel(status: AutosaveStatus) {
	const labels: Record<AutosaveStatus, string> = {
		idle: '',
		saving: 'Сохраняется...',
		saved: 'Сохранено',
		error: 'Не удалось сохранить',
	};

	return labels[status];
}
```
