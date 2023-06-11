#ReactQuery #React

TanStack Query - это библиотека для управления стейтом и кэширования данных в приложении React. Она предоставляет набор хуков, которые помогают работать с асинхронными запросами и кэшированием данных.

Вот перечень основных хуков TanStack Query:

- `useQuery`: позволяет получить данные из асинхронного источника (например, API) и автоматически кэширует их. Этот хук также обрабатывает ошибки и отменяет запросы при размонтировании компонента.
- `useMutation`: позволяет отправлять асинхронные запросы для создания/обновления/удаления данных на сервере. Возвращает объект с методом mutate, который можно вызвать для выполнения запроса.
- `usePaginatedQuery`: позволяет загружать данные постранично. Возвращает объект со страницами данных и методами для переключения между страницами.
- `useInfiniteQuery`: позволяет загружать данные пачками (например, при бесконечной подгрузке новых записей). Похож на usePaginatedQuery, но загружает данные динамически по мере прокрутки.
- `useQueryClient`: позволяет получить экземпляр клиента TanStack Query, который содержит информацию о кэшах, запросах и других внутренних состояниях.
- `useIsFetching`: позволяет отслеживать количество активных запросов на странице.

## Setup

Для начала нам нужно установить сам модуль и его девтулзы, которые позволят детально отследить его работу

```bash
npm i @tanstack/react-query
npm i @tanstack/react-query-devtools
```

Далее нам нужно обернуть в данный модуль всё приложение, чтобы оно отслеживало запросы

`index.ts`
```TSX
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</React.StrictMode>,
);
```

## Basic Example




## useQuery Basics



## useMutation Basics




## Пагинация




## Бесконечный скролл



## useQueries Hook



## Prefetching




## Initial/Placeholder Data














