---
tags:
  - tanstack-query
  - react
  - frontend
---

TanStack Query (ранее React Query) - библиотека для управления серверным состоянием в React-приложениях. Она берет на себя кэширование, синхронизацию, фоновое обновление и дедупликацию запросов, позволяя полностью отказаться от ручного управления состоянием загрузки через `useEffect` + `useState`.

Ключевые преимущества:
- Автоматическое кэширование и инвалидация данных
- Дедупликация одинаковых запросов
- Фоновое обновление устаревших данных
- Встроенная поддержка пагинации и бесконечной подгрузки
- Оптимистичные обновления
- Offline-режим
- Встроенные DevTools для отладки

## Установка

```bash
npm i @tanstack/react-query @tanstack/react-query-devtools
```

## Setup

Для работы библиотеки необходимо создать экземпляр `QueryClient` и обернуть приложение в `QueryClientProvider`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';

const queryClient = new QueryClient();

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Сервисный слой

Перед работой с хуками стоит организовать слой запросов. Типичный сервис на axios:

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
});

export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export interface CreatePostDto {
  title: string;
  body: string;
  userId: number;
}

export const postService = {
  async getAll() {
    const { data } = await api.get<Post[]>('/posts');
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<Post>(`/posts/${id}`);
    return data;
  },

  async create(dto: CreatePostDto) {
    const { data } = await api.post<Post>('/posts', dto);
    return data;
  },

  async update(id: number, dto: Partial<CreatePostDto>) {
    const { data } = await api.patch<Post>(`/posts/${id}`, dto);
    return data;
  },

  async delete(id: number) {
    await api.delete(`/posts/${id}`);
  },
};
```

## useQuery

Основной хук для получения данных. В v5 принимает единственный объект с параметрами.

```tsx
import { useQuery } from '@tanstack/react-query';
import { postService } from './services/post.service';

function PostList() {
  const {
    data: posts,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: postService.getAll,
  });

  if (isPending) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Параметры useQuery

Основные опции, которые принимает хук:

```tsx
const query = useQuery({
  // уникальный ключ запроса - массив, описывающий зависимости
  queryKey: ['posts', { status: 'active', page: 1 }],

  // функция получения данных, должна вернуть промис
  queryFn: ({ queryKey }) => {
    const [, params] = queryKey;
    return postService.getAll(params);
  },

  // время в мс, в течение которого данные считаются свежими
  staleTime: 5 * 60 * 1000,

  // время хранения неактивных данных в кэше (в v5 переименован из cacheTime)
  gcTime: 10 * 60 * 1000,

  // автоматический рефетч через заданный интервал
  refetchInterval: 30_000,

  // условное выполнение запроса
  enabled: !!userId,

  // трансформация данных перед возвратом
  select: (data) => data.filter((post) => post.userId === 1),

  // данные-заглушка до завершения первого запроса (в v5 вместо keepPreviousData)
  placeholderData: (previousData) => previousData,
});
```

### Статусы запроса

В v5 статусы разделены на две оси - status (состояние данных) и fetchStatus (состояние сетевого запроса).

Состояние данных:
- `isPending` - данных ещё нет, запрос выполняется впервые. В v5 заменяет устаревший `isLoading`
- `isError` - запрос завершился ошибкой
- `isSuccess` - данные получены успешно

Состояние сетевого запроса:
- `isFetching` - сетевой запрос выполняется прямо сейчас. Может быть `true` одновременно с `isSuccess`, когда происходит фоновое обновление
- `fetchStatus` - `'fetching'` | `'paused'` | `'idle'`

> [!important]
> В v5 `isLoading` удалён. Используйте `isPending` для проверки отсутствия данных и `isFetching` для проверки активного сетевого запроса.

## useMutation

Хук для операций изменения данных - создание, обновление, удаление. В v5 строковый ключ мутации убран, используется только объект параметров.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService, CreatePostDto } from './services/post.service';

function CreatePostForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dto: CreatePostDto) => postService.create(dto),

    onSuccess: (newPost) => {
      // инвалидация кэша - запросы с этим ключом будут перезапрошены
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },

    onError: (error) => {
      console.error('Failed to create post:', error);
    },

    onSettled: () => {
      // выполнится и при успехе, и при ошибке
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    mutation.mutate({
      title: formData.get('title') as string,
      body: formData.get('body') as string,
      userId: 1,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" />
      <textarea name="body" placeholder="Body" />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create Post'}
      </button>
      {mutation.isError && <p>Error: {mutation.error.message}</p>}
    </form>
  );
}
```

## Оптимистичные обновления

Паттерн, при котором UI обновляется мгновенно, не дожидаясь ответа сервера. Если запрос завершится ошибкой - данные откатятся к предыдущему состоянию.

```tsx
const mutation = useMutation({
  mutationFn: (dto: CreatePostDto) => postService.create(dto),

  onMutate: async (newPostDto) => {
    // отменяем исходящие запросы, чтобы они не перезаписали оптимистичное обновление
    await queryClient.cancelQueries({ queryKey: ['posts'] });

    // сохраняем предыдущее состояние для отката
    const previousPosts = queryClient.getQueryData<Post[]>(['posts']);

    // оптимистично обновляем кэш
    queryClient.setQueryData<Post[]>(['posts'], (old) => [
      ...(old ?? []),
      { ...newPostDto, id: Date.now() },
    ]);

    // возвращаем контекст для отката
    return { previousPosts };
  },

  onError: (_error, _variables, context) => {
    // откатываем к предыдущему состоянию при ошибке
    if (context?.previousPosts) {
      queryClient.setQueryData(['posts'], context.previousPosts);
    }
  },

  onSettled: () => {
    // всегда синхронизируем с сервером после мутации
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});
```

## useInfiniteQuery

Хук для реализации бесконечной подгрузки данных.

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

interface PaginatedResponse<T> {
  items: T[];
  nextCursor: number | null;
}

function InfinitePostList() {
  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam }): Promise<PaginatedResponse<Post>> => {
      const response = await api.get('/posts', {
        params: { cursor: pageParam, limit: 20 },
      });
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  if (isPending) return <div>Loading...</div>;
  if (isError) return <div>Error loading posts</div>;

  return (
    <div>
      {data.pages.map((page, i) => (
        <div key={i}>
          {page.items.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
            ? 'Load more'
            : 'Nothing more to load'}
      </button>
    </div>
  );
}
```

## Параллельные запросы

Несколько вызовов `useQuery` в одном компоненте выполняются параллельно автоматически.

```tsx
function Dashboard() {
  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: postService.getAll,
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  if (postsQuery.isPending || usersQuery.isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PostList posts={postsQuery.data} />
      <UserList users={usersQuery.data} />
    </div>
  );
}
```

## Зависимые запросы

Запросы, которые должны выполняться последовательно, управляются через опцию `enabled`.

```tsx
function UserPosts({ userId }: { userId: number }) {
  // первый запрос - получаем пользователя
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getById(userId),
  });

  // второй запрос - выполнится только когда первый завершится
  const postsQuery = useQuery({
    queryKey: ['posts', { authorId: userQuery.data?.id }],
    queryFn: () => postService.getByAuthor(userQuery.data!.id),
    enabled: !!userQuery.data?.id,
  });

  if (userQuery.isPending) return <div>Loading user...</div>;

  return (
    <div>
      <h2>{userQuery.data.name}</h2>
      {postsQuery.isPending ? (
        <div>Loading posts...</div>
      ) : (
        postsQuery.data?.map((post) => <div key={post.id}>{post.title}</div>)
      )}
    </div>
  );
}
```

## Инвалидация запросов

`invalidateQueries` помечает данные как устаревшие и перезапрашивает их, если соответствующий запрос активен.

```tsx
const queryClient = useQueryClient();

// инвалидировать все запросы с ключом ['posts']
queryClient.invalidateQueries({ queryKey: ['posts'] });

// инвалидировать конкретный запрос
queryClient.invalidateQueries({ queryKey: ['posts', postId] });

// инвалидировать все запросы, начинающиеся с ['posts']
queryClient.invalidateQueries({ queryKey: ['posts'], exact: false });

// инвалидировать вообще все запросы
queryClient.invalidateQueries();
```

> [!info]
> Ключи сравниваются по принципу prefix matching. Инвалидация `['posts']` затронет и `['posts', 1]`, и `['posts', { page: 2 }]`. Чтобы инвалидировать только точное совпадение, используйте `exact: true`.

## Prefetching

Предварительная загрузка данных позволяет заполнить кэш до того, как пользователь перейдёт на страницу.

```tsx
const queryClient = useQueryClient();

// предзагрузка при наведении на ссылку
function PostLink({ postId }: { postId: number }) {
  function handleMouseEnter() {
    queryClient.prefetchQuery({
      queryKey: ['posts', postId],
      queryFn: () => postService.getById(postId),
      staleTime: 60_000,
    });
  }

  return (
    <a href={`/posts/${postId}`} onMouseEnter={handleMouseEnter}>
      View Post
    </a>
  );
}
```

## useQueryClient

Хук для доступа к экземпляру `QueryClient` из любого компонента внутри провайдера.

```tsx
import { useQueryClient } from '@tanstack/react-query';

function CacheControls() {
  const queryClient = useQueryClient();

  return (
    <div>
      <button onClick={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}>
        Refresh Posts
      </button>
      <button onClick={() => queryClient.clear()}>
        Clear Cache
      </button>
    </div>
  );
}
```

## Кастомные хуки

Оборачивание запросов в кастомные хуки инкапсулирует ключи, параметры и трансформации. Это основной паттерн для production-кода.

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService, Post, CreatePostDto } from './services/post.service';

// ключи запросов как фабричные функции
const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
};

export function usePosts(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: filters ? postKeys.list(filters) : postKeys.lists(),
    queryFn: postService.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postService.getById(id),
    enabled: id > 0,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePostDto) => postService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => postService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
```

Использование в компоненте:

```tsx
function PostPage({ postId }: { postId: number }) {
  const { data: post, isPending } = usePost(postId);
  const deletePost = useDeletePost();

  if (isPending) return <div>Loading...</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <button
        onClick={() => deletePost.mutate(postId)}
        disabled={deletePost.isPending}
      >
        Delete
      </button>
    </article>
  );
}
```

## Глобальные настройки

Значения по умолчанию задаются при создании `QueryClient`.

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

> [!info]
> В v5 параметр `cacheTime` переименован в `gcTime` (garbage collection time). Это время, в течение которого неактивные данные хранятся в памяти перед удалением.

## DevTools

DevTools отображают состояние всех запросов: свежие, устаревшие, активные и неактивные. Через панель можно вручную инвалидировать, сбросить или удалить любой запрос из кэша.

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      {/* DevTools автоматически скрываются в production-сборке */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
```

## TypeScript

TanStack Query v5 полностью типизирован. Типы выводятся автоматически из `queryFn`.

```tsx
// типы выводятся из возвращаемого значения queryFn
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: postService.getAll,
});
// data имеет тип Post[] | undefined

// явное указание типов при необходимости
const { data } = useQuery<Post[], Error>({
  queryKey: ['posts'],
  queryFn: postService.getAll,
});

// типизация select
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: postService.getAll,
  select: (posts): string[] => posts.map((p) => p.title),
});
// data имеет тип string[] | undefined

// типизация ошибок
const { error } = useQuery<Post[], AxiosError<{ message: string }>>({
  queryKey: ['posts'],
  queryFn: postService.getAll,
});
// error имеет тип AxiosError<{ message: string }> | null
```

> [!summary]
> Основные изменения в v5 по сравнению с v4: `isLoading` заменён на `isPending`, `cacheTime` переименован в `gcTime`, строковые ключи мутаций удалены, `keepPreviousData` заменён на `placeholderData`, все хуки принимают единственный объект параметров, `onSuccess`/`onError` колбэки в `useQuery` удалены - используйте `useEffect` или обрабатывайте в компоненте.
