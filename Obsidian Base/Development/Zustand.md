
## Введение

Zustand - это стейт-менеджер, в котором под каждую новую сущность создаётся отдельный стор, что сплиттит код и облегчает начальный бандл

![](_png/Pasted%20image%2020240830195706.png)

## Старт проекта

```bash
npm create vite@latest .
npm i antd zustand react-router-dom
```

## Основы работы

### Slice

Создание слайса выглядит следующим образом:

`model / counterSlice.ts`
```ts
import { create, StateCreator } from "zustand";

// тип
type counterState = {
  counter: number;
};

// функция-инициализатор / слайс
const counterSlice: StateCreator<counterState> = () => ({
  counter: 0,
});

// хук для использования стора
export const useCounterStore = create<counterState>(counterSlice);
```

### Получение данных из state

Чтобы использовать данные из стейта, мы импортируем наш хук и вставляем из него данные в компонент

`App.tsx`
```TSX
import "./App.css";
import { useCounterStore } from "./model/counterStore";

function App() {  
  const { counter } = useCounterStore();
  
  return (
    <div className="wrapper">
      <span>{counter}</span>
    </div>
  );
}

export default App;
```

### Использование actions

**Основные пункты видео:**

1. **Введение в экшены:**
    - Экшены - функции для изменения состояний в Store.
    - Всю логику работы с данными (получение из API, отправка запросов) рекомендуется выносить в Store.
2. **Цель урока:**
    - Научиться создавать экшены для увеличения и уменьшения счетчика.
3. **Типизация экшенов:**
    - Создание типа `CounterActions` для типизации экшенов `increment` и `decrement`.
4. **Работа с экшенами в Store:**
    - Использование функций `set` и `get` для взаимодействия с экшенами и стейтом.
5. **Изменение счетчика:**
    - Создание и типизация экшенов для увеличения (`increment`) и уменьшения (`decrement`) значения счетчика.
    - Примеры упрощенной записи для изменения значения счетчика.
6. **Интеграция экшенов в UI:**
    - Получение экшенов в компоненте через хук.
    - Создание кнопок и присвоение им обработчиков `onClick` для выполнения экшенов `increment` и `decrement`.
7. **Результат:**
    - Демонстрация работы кнопок в браузере - нажатие изменяет значение счетчика.



`model / counterSlice.ts`
```TS
import { create, StateCreator } from "zustand";

// отдельно поля стора
type counterState = {
  counter: number;
};

// отдельно экшены, которые провайдит стор
type counterActions = {
  increment: () => void;
  decrement: () => void;
};

// слайс, в котором мы задали начальное значение
const counterSlice: StateCreator<counterState & counterActions> = (
  // параметры получения и установки нового значения
  set,
  get
) => ({
  // начальное значение
  counter: 0,
  // изменение значения
  decrement: () => {
    // получаем значение из стора
    const { counter } = get();
    // устанавливаем новое значение
    set({ counter: counter - 1 });
  },
  increment: () => {
    const { counter } = get();
    set({ counter: counter + 1 });
  },
});

export const useCounterStore = create<counterState & counterActions>(
  counterSlice
);
```

И теперь тут мы просто получаем наши экшены вместе со значением в сторе

`App.tsx`
```TSX
import "./App.css";
import { useCounterStore } from "./model/counterStore";

function App() {
  const { counter, decrement, increment } = useCounterStore();
  
  return (
    <div className="wrapper">
      <button onClick={increment}>+</button>
      <span>{counter}</span>
      <button onClick={decrement}>-</button>
    </div>
  );
}

export default App;
```

### Использование вне компонента

#### Цель:

Получение и изменение Store вне компонентов React.

#### Шаги реализации:

1. **Создание Вспомогательной Функции:**
    - Создайте папку `helpers` c файлом `addTen.ts` в корне проекта.
    - В `addTen.ts`, определите функцию, изменяющую значение счётчика на 10 в зависимости от его текущего состояния (минус 10, если меньше нуля и плюс 10, если больше или равно нулю).
2. **Ограничения Хуков:**
    - Хуки React не могут использоваться вне компонентов, условных выражениях, и после условных return. Создание прямого доступа к состоянию и действиям Store обходит эти ограничения.
3. **Экспорт Стейта и Экшенов из Store:**
    - Вернитесь к `CounterStore` и создайте новый экшен `changeByAmount` для изменения счетчика на переданное значение.
    - Используйте метод `getState` из `useCounterStore` для получения доступа к созданному экшену и стейту. Для актуализации данных счетчика, используйте функцию-геттер.
4. **Использование Вспомогательной Функции:**
    - Уберите лишние вызовы хуков и импорты.
    - В функции `addTem`, используйте геттер для получения текущего значения счетчика и измените его значение с помощью `changeByAmount` в зависимости от условий.
5. **Тестирование Результатов:**
    - Добавление кнопки в UI для вызова функции `addTem`.
    - Проверка в браузере: счетчик должен уменьшаться на 10, если меньше нуля, и увеличиваться на 10, если равно нулю или больше.




Иногда перед нами может появиться такая ситуация, когда нам нужно использовать стор-значения вне компонента и менять его данные так же извне. Для этого мы можем сделать отдельный хелпер, который внутри себя будет выполнять операции над стором



`model / counterSlice.ts
```TSX
import { create, StateCreator } from "zustand";

type counterState = {
  counter: number;
};

type counterActions = {
  increment: () => void;
  decrement: () => void;
  // +
  incrementByAmount: (value: number) => void;
};

const initialState: counterState = {
  counter: 0,
};

const counterSlice: StateCreator<counterState & counterActions> = (
  set,
  get
) => ({
  counter: initialState.counter,
  decrement: () => {
    const { counter } = get();
    set({ counter: counter - 1 });
  },
  increment: () => {
    const { counter } = get();
    set({ counter: counter + 1 });
  },
  // +
  incrementByAmount: (value: number) => {
    const { counter } = get();
    set({ counter: counter + value });
  },
});

export const useCounterStore = create<counterState & counterActions>(
  (...args) => ({
    ...counterSlice(...args),
  })
);

// + отдельно выносим экшен изменения значения в функцию
export const incrementByAmount = (value: number) => {
  useCounterStore.getState().incrementByAmount(value);
};

// + и отдельно выносим функцию для получения определённого значчения
export const getCounter = () => useCounterStore.getState().counter;
```

Далее в отдельной функции получаем наше значение и выполняем любые логические операции, которые нам понадобятся

`helpers / addTen.ts`
```TS
import { getCounter, incrementByAmount } from "../model/counterStore";

export const addTen = () => {
  const counter = getCounter();
  
  console.log(counter);
  
  if (counter >= 0) {
    incrementByAmount(10);
  } else {
    incrementByAmount(-10);
  }
};
```

И теперь можем в любой части приложения выполнить этот код, который мы вынесли в отдельный участок приложения

`App.tsx`
```TSX
import "./App.css";
import { addTen } from "./helpers/addTen";
import { useCounterStore } from "./model/counterStore";

function App() {
  const { counter, decrement, increment } = useCounterStore();

  return (
    <div className="wrapper">
      <button onClick={increment}>+</button>
      <span>{counter}</span>
      <button onClick={decrement}>-</button>
      <button onClick={addTen}>add 10</button>
    </div>
  );
}

export default App;
```

### Отладка

В реальных проектах часто приходится работать с большим количеством сторов и экшенов. Для отладки кода размерным методом является использование консоли или дебаггера.

- **Решение:**
    - Предложено использовать Redux DevTools для отладки, что значительно упрощает процесс.
    - Установка Redux DevTools совершается через добавление расширения в браузер.
- **Подключение Middleware:**
    - Middleware требуется для работы с Redux DevTools.
    - Импорт `devtools` из Zustand Middleware и его подключение к приложению.
- **Настройка:**
    - Добавление Middleware в список дженериков типа StateCreator через массив типов.
    - Исправление потенциальной ошибки путём коррирования функции создания стора (`Create`) с использованием Middleware.
- **Работа с Redux DevTools:**
    - После подключения Middleware, при открытии Redux DevTools видно состояние сторов, выполненные экшены и таймлайн изменений.
    - Для лучшей отладки важно добавлять названия экшенов при их вызове для удобства отслеживания в DevTools.
- **Дополнительные настройки:**
    - В экшенах можно указать параметр `replace`, определяющий, будет ли изменяемая часть стора полностью заменена на новую после выполнения экшена.
    - Подписывание каждого экшена специфическим образом позволяет лучше ориентироваться в выполненных действиях при просмотре через DevTools.





Отладка в Zustand происходит за счёт использования ReduxDevtools, который работают очень костыльно и требуют дополнительного бойлерплейта, чтобы подтянуться к ним

Сейчас у нас представлен код маленького todo-листа



`model / todoStore.ts
```TS
import { create, StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

type ToDoType = {
  title: string;
  isCompleted: boolean;
};

type ToDoState = {
  todos: ToDoType[];
};

type ToDoActions = {
  addTodo: (title: string) => void;
  changeIsCompleted: (index: number) => void;
};

const toDoSlice: StateCreator<
  ToDoState & ToDoActions,
  [["zustand/devtools", never]]
> = (set, get) => ({
  todos: [],
  addTodo: (title: string) => {
    const { todos } = get();

    set(
      { todos: [...todos, { title, isCompleted: false }] },
      false,
      `add ${title}`
    );
  },
  changeIsCompleted: (index: number) => {
    const { todos } = get();
    const newTodos = [
      ...todos.slice(0, index),
      { ...todos[index], isCompleted: !todos[index].isCompleted },
      ...todos.slice(index + 1),
    ];
    set(
      {
        todos: newTodos,
      },
      false,
      `chengeStatus of ${todos[index].title} to ${!todos[index].isCompleted}`
    );
  },
});

// `chengeStatus of ${todos[index].title} to ${!todos[index].isCompleted}`

export const useToDoStore = create<ToDoState & ToDoActions>()(
  devtools((...args) => ({
    ...toDoSlice(...args),
  }))
);

export const markAsCompleted = (index: number) => {
  const todos = useToDoStore.getState().todos;
  useToDoStore.setState(
    {
      todos: [
        ...todos.slice(0, index),
        { ...todos[index], isCompleted: !todos[index].isCompleted },
        ...todos.slice(index + 1),
      ],
    },
    false,
    `chengeStatus of ${todos[index].title} to ${!todos[index].isCompleted}`
  );
};
```



`App.tsx`
```TSX
import "./App.css";
import { Card, Checkbox, Input } from "antd";
import { markAsCompleted, useToDoStore } from "./model/todoStore";
import { useState } from "react";

function App() {
  const { todos, addTodo } = useToDoStore();
  const [value, setValue] = useState<string>("");
  return (
    <div className="wrapper">
      <Input
        style={{ width: 300 }}
        onChange={(e) => setValue(e.target.value)}
        value={value}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addTodo(value);
            setValue("");
          }
        }}
      />
      {todos.map((todo, index) => (
        <Card className="card" key={todo.title}>
          <Checkbox
            checked={todo.isCompleted}
            onChange={() => markAsCompleted(index)}
          />
          <span>{todo.title}</span>
        </Card>
      ))}
    </div>
  );
}

export default App;
```


## Асинхронные операции

### Асинхронные операции + Запрос на сервер

1. **Проблема Размещения Асинхронных Операций в Компонентах:**
    - Размещение запросов к API и других асинхронных операций в компонентах размазывает логику обработки данных по всему приложению.
    - Это увеличивает сложность компонентов и делает код труднее для понимания.
2. **Преимущества Использования Store:**
    - Централизация асинхронных операций в Store упрощает управление состоянием и взаимодействие с API.
    - Обеспечивает возможность переиспользования логики запросов без дублирования кода.
    - Содействует поддержанию компонентов максимально простыми и фокусированными на представлении.
3. **Преимущества Zustand как State Manager:**
    - Несмотря на простоту и легкость, Zustand предоставляет мощные возможности для управления состоянием.
    - Помогает в оптимизации и предотвращении ненужных ререндеров.


#### Подготовка:

1. **Очистка проекта**: Удаление неактуальных элементов.
2. **Создание структуры**:
    - `coffeeStore.ts` в папке models для описания стора.
    - `coffeeTypes.ts` в папке types для типизации работы с API.
    - **URL для API**: [`https://purpleschool.ru/coffee-api`](https://purpleschool.ru/coffee-api).

#### Создание Компонентов:

1. **Разметка**:
    - Переменная для хранения списка напитков.
    - Элементы UI: контейнер и карточки напитков (с информацией о напитке, рейтингом, изображением, и кнопкой покупки).
2. **Стилизация**:
    - Определены стили для контейнера и карточек.

#### Настройка Store (Zustand):

1. **Данные и Экшены**:
    - State для списка напитков.
    - Экшен `getCoffeeList` для получения списка напитков.
2. **Создание слайса**:
    - Использование `StateCreator` для создания слайса.
    - Конфигурация middleware (DevTools).
3. **Асинхронный запрос**:
    - Асинхронная функция в экшене для загрузки данных из API.
    - Обработка ошибок и обновление состояния с полученными данными.

#### Работа с Компонентами:

1. **Получение и отображение данных**:
    - Удаление заглушек, использование хука для доступа к состоянию.
    - Запрос данных при первой загрузке с помощью `useEffect`.




`types / coffeTypes.ts`
```TS
export enum CoffeeTypeEnum {
  cappuccino = "cappuccino",
  latte = "latte",
  macchiato = "macchiato",
  americano = "americano",
}

export type CoffeeQueryParams = {
  text?: string;
  type?: CoffeeTypeEnum;
};

export type CoffeeType = {
  id: number;
  name: string;
  subTitle: string;
  type: CoffeeTypeEnum;
  price: number;
  image: string;
  description: string;
  rating: number;
};
```




`model / coffeeStore.ts`
```TS
import { create, StateCreator } from "zustand";
import { CoffeeQueryParams, CoffeeType } from "../types/coffeTypes";
import axios, { AxiosError } from "axios";
import { devtools } from "zustand/middleware";

const BASE_URL = "https://purpleschool.ru/coffee-api/";

type CoffeeState = {
  coffeeList?: CoffeeType[];
  controller?: AbortController;
};

type CoffeeActions = {
  getCoffeeList: (params?: CoffeeQueryParams) => void;
};

const coffeeSlice: StateCreator<
  CoffeeActions & CoffeeState,
  [["zustand/devtools", never]]
> = (set, get) => ({
  coffeeList: undefined,
  controller: undefined,

  getCoffeeList: async (params?: CoffeeQueryParams) => {
    const { controller } = get();

    if (controller) {
      controller.abort();
    }

    const newController = new AbortController();
    set({ controller: newController });
    const { signal } = newController;

    try {
      const { data } = await axios.get<CoffeeType[]>(BASE_URL, {
        params,
        signal,
      });
      set({ coffeeList: data }, false, "setCoffeeListWithSearch");
    } catch (error) {
      if (axios.isCancel(error)) return;

      if (error instanceof AxiosError) {
        console.log(error);
      }
    }
  },
});

export const useCoffeeStore = create<CoffeeActions & CoffeeState>()(
  devtools(coffeeSlice)
);
```



`App.tsx`
```TSX
import "./App.css";
import { Button, Card, Input, Rate, Tag } from "antd";
import { useCoffeeStore } from "./model/coffeeStore";
import { useEffect, useState } from "react";
import { ShoppingCartOutlined } from "@ant-design/icons";

function App() {
  const { getCoffeeList, coffeeList } = useCoffeeStore();
  const [text, setText] = useState<string>("");
  const handleSearch = (text: string) => {
    setText(text);
    getCoffeeList({ text });
  };
  useEffect(() => {
    getCoffeeList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="wrapper">
      <Input
        placeholder="Search"
        value={text}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {coffeeList && (
        <div className="cardsContainer">
          {coffeeList.map((coffee) => (
            <Card
              hoverable
              key={coffee.id}
              cover={<img src={coffee.image} />}
              actions={[
                <Button icon={<ShoppingCartOutlined />} key={coffee.name}>
                  {coffee.price}
                </Button>,
              ]}
            >
              <Card.Meta title={coffee.name} description={coffee.subTitle} />
              <Tag style={{ marginTop: "24px" }} color="purple">
                {coffee.type}
              </Tag>
              <Rate
                defaultValue={coffee.rating}
                disabled
                allowHalf
                style={{ marginTop: "24px" }}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
```




### Persist

#### Цель:

Обучить сохранению состояния в Zustand при помощи Middleware Persist чтобы избежать потери данных при перезагрузке страницы, например, для токенов аутентификации, пользовательского ввода, пагинации, фильтров и т.д.

#### Основные шаги:

1. **Введение в Проблему**:
    - При перезагрузке страницы данные, хранящиеся в Zustand, теряются. Это проблема, например, при необходимости сохранять пользовательскую сессию или введенные данные.
2. **Решение с Middleware Persist**:
    - Zustand предоставляет инструмент Middleware Persist для сохранения состояния при перезагрузке.
3. **Применение на Практике**:
    - На примере простого приложения с счетчиком показано, как подключить Middleware Persist. Сначала закомментирован код не относящийся к счетчику, затем добавлен каунтер в разметку.
4. **Настройка Middleware**:
    - В CounterStore типизирована работа с Middleware. Добавлен Middleware Persist, обернут вызов CounterSlice. Параметрами указано название стора.
5. **Результат**:
    - После изменений в браузере и перезагрузки страницы состояние каунтера сохраняется, благодаря автоматическому сохранению в LocalStorage.
6. **Настройка Сохраняемых Данных**:
    - Добавлен второй счетчик для демонстрации возможности сохранения только определенных данных, используя параметр Partialize в Persist, что позволяет указывать, какие данные сохранять.
7. **Использование Разных Хранилищ**:
    - Можно использовать различные хранилища, не ограничиваясь LocalStorage. Будет также показано создание кастомного хранилища.








`model / counterStore.ts`
```TS
import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";

type counterState = {
  counter: number;
  persistedCounter: number;
};

type counterActions = {
  increment: () => void;
  decrement: () => void;
  incrementByAmount: (value: number) => void;
};

const initialState: counterState = {
  counter: 0,
  persistedCounter: 0,
};

const counterSlice: StateCreator<
  counterState & counterActions,
  [["zustand/persist", unknown]]
> = (set, get) => ({
  counter: initialState.counter,
  persistedCounter: initialState.persistedCounter,
  decrement: () => {
    const { counter, persistedCounter } = get();
    set({ counter: counter - 1, persistedCounter: persistedCounter - 1 });
  },
  increment: () => {
    const { counter, persistedCounter } = get();
    set({ counter: counter + 1, persistedCounter: persistedCounter + 1 });
  },
  incrementByAmount: (value: number) => {
    const { counter } = get();
    set({ counter: counter + value });
  },
});

export const useCounterStore = create<counterState & counterActions>()(
  persist((...args) => ({ ...counterSlice(...args) }), {
    name: "counterStore",
    partialize: (state) => ({ persistedCounter: state.persistedCounter }),
  })
);

export const incrementByAmount = (value: number) => {
  useCounterStore.getState().incrementByAmount(value);
};

export const getCounter = () => useCounterStore.getState().counter;
```



`App.tsx`
```TSX
import "./App.css";
import { Button, Card, Input, Rate, Tag } from "antd";
import { useCoffeeStore } from "./model/coffeeStore";
import { useEffect, useState } from "react";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useCounterStore } from "./model/counterStore";
import { addTen } from "./helpers/addTen";

function App() {
  const { getCoffeeList, coffeeList } = useCoffeeStore();
  const [text, setText] = useState<string>("");
  const handleSearch = (text: string) => {
    setText(text);
    getCoffeeList({ text });
  };

  useEffect(() => {
    getCoffeeList();
  }, []);

  const { counter, decrement, increment, persistedCounter } = useCounterStore();
  return (
    <div className="wrapper">
      <button onClick={decrement}>-</button>
      <span>{counter}</span>
      <span>{persistedCounter}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}

export default App;
```



### Reset состояния

**Основная идея**: Обучающее видео о том, как создавать хранилища для управления состояниями в приложении и как реализовать сброс к изначальным состояниям.

#### Часть 1: Основы сброса состояний

- Рассмотрена необходимость не только установки и хранения значений в Store, но и сбрасывания к изначальным состояниям.
- Показан простой способ создания метода для сброса состояний, возвращающий значения переменных к исходным (например, в 0).
- Пример добавления кнопки "Reset" для вызова метода сброса.

#### Часть 2: Сброс состояний в нескольких хранилищах

- Введена проблематика сброса состояний в нескольких Store одновременно.
- Объяснена необходимость кастомизации функции создания Store (`Create` функции) для решения вышеупомянутой проблемы.

#### Часть 3: Кастомизация функции создания Store

1. **Создание файла для кастомной функции** `Create`:
    - Функция собирает методы сброса из каждого Store и вызывает их всего одним действием.
    - Для хранения методов сброса используется `Set`, предотвращая повторения.
2. **Реализация кастомной функции** `Create`:
    - Написание функции, аналогичной оригинальной, но с дополнительной логикой для сброса нескольких состояний одновременно.
    - Внедрение возможности получения изначального состояния Store и создание общего метода сброса, добавляемого в `Set`.
3. **Применение кастомной функции**:
    - Переопределение импорта функции `Create` в Store на кастомную версию.
    - Демонстрация работы сброса состояний через новую кнопку "Reset".


`src/helpers/create.ts`
```TS
import { create as _create } from "zustand";
import type { StateCreator } from "zustand";

const resetStoreFnSet = new Set<() => void>();

export const resetAllStores = () => {
  resetStoreFnSet.forEach((resetFn) => {
    resetFn();
  });
};

export const create = (<T>() => {
  return (stateCreator: StateCreator<T>) => {
    const store = _create(stateCreator);
    const initialState = store.getInitialState();
    const resetState = () => {
      store.setState(initialState, true);
    };
    resetStoreFnSet.add(resetState);
    return store;
  };
}) as typeof _create;
```


`src/model/counterStore.ts`
```TS
import { StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { create } from "../helpers/create";

type counterState = {
  counter: number;
  persistedCounter: number;
};

type counterActions = {
  increment: () => void;
  decrement: () => void;
  incrementByAmount: (value: number) => void;
  reset: () => void;
};

const initialState: counterState = {
  counter: 0,
  persistedCounter: 0,
};

const counterSlice: StateCreator<
  counterState & counterActions,
  [["zustand/persist", unknown]]
> = (set, get) => ({
  counter: initialState.counter,
  persistedCounter: initialState.persistedCounter,
  decrement: () => {
    const { counter, persistedCounter } = get();
    set({ counter: counter - 1, persistedCounter: persistedCounter - 1 });
  },
  increment: () => {
    const { counter, persistedCounter } = get();
    set({ counter: counter + 1, persistedCounter: persistedCounter + 1 });
  },
  incrementByAmount: (value: number) => {
    const { counter } = get();
    set({ counter: counter + value });
  },
  reset: () => {
    set(initialState);
  },
});

export const useCounterStore = create<counterState & counterActions>()(
  persist((...args) => ({ ...counterSlice(...args) }), {
    name: "counterStore",
    partialize: (state) => ({ persistedCounter: state.persistedCounter }),
  })
);

export const incrementByAmount = (value: number) => {
  useCounterStore.getState().incrementByAmount(value);
};

export const getCounter = () => useCounterStore.getState().counter;
```


`App.tsx`
```TSX
import "./App.css";
import { Button, Card, Input, Rate, Tag } from "antd";
import { useCoffeeStore } from "./model/coffeeStore";
import { useEffect, useState } from "react";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useCounterStore } from "./model/counterStore";
import { addTen } from "./helpers/addTen";
import { resetAllStores } from "./helpers/create";
import { useToDoStore } from "./model/todoStore";

function App() {
  const { getCoffeeList, coffeeList } = useCoffeeStore();
  const [text, setText] = useState<string>("");
  const handleSearch = (text: string) => {
    setText(text);
    getCoffeeList({ text });
  };
  useEffect(() => {
    getCoffeeList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { counter, decrement, increment, persistedCounter } = useCounterStore();
  const { addTodo, todos } = useToDoStore();
  return (
    <div className="wrapper">
      <button onClick={decrement}>-</button>
      <span>{counter}</span>
      <span>{persistedCounter}</span>
      <button onClick={increment}>+</button>
      <button onClick={resetAllStores}>reset</button>
      <hr />
      <button onClick={() => addTodo("some")}>addTodo</button>
      {todos && todos.map((todo) => <div key={todo.title}>{todo.title}</div>)}
    </div>
  );
}

export default App;
```



## Продвинутые техники

### Подписки на store

#### Цели:

- Улучшить читаемость и производительность кода
- Осуществить сохранение пользовательского ввода в URL-параметрах

#### Шаги:

1. **Введение в проблему сохранения состояния**
    - Текущая реализация поиска теряет данные при перезагрузке страницы
    - Целесообразно сохранять такие данные в параметрах URL
2. **Создание отдельного стора для поиска**
    - Удаление ненужных сторов и хелперов (CounterStore, TodoStore)
    - Создание нового стора `SearchStore` с состоянием для поиска
3. **Структура SearchStore**
    - `SearchState`: хранит текст поиска как необязательный параметр типа `string`
    - `SearchActions`: включает действие `setText` для обновления текста поиска
4. **Работа с подписками в Zustand**
    - Введение в использование `subscribe` для отслеживания изменений стейта
    - Пример подписки на изменения в `searchStore` и связывание его с другими сторами
5. **Стратегия работы с подписками**
    - Использование подписок для реагирования на изменения состояний
    - Пример: автоматическое обновление списка напитков при изменении состояния поиска









### Кастомные хранилища

#### Цель:

Разработать систему, позволяющую сохранять и восстанавливать состояние приложения через параметры URL.

#### Шаги реализации:

1. **Создание hashStorage**:
    - Создать хранилище (`hashStorage`) в директории `helpers`, используя пример из документации.
    - Объявить тип хранилища как `StateStorage`.
2. **Настройка Middleware Persist**:
    - Подключить `Middleware Persist` в `SearchStore` и `CoffeeStore`.
    - Для `SearchStore`, настроить использование `hashStorage` вместо стандартного `localStorage`.
3. **Кастомизация хранилища**:
    - Для использования других типов хранилищ, например, `SessionStorage`, написать функции `getItem`, `setItem`, и `removeItem`.
    - Показать, как данные сохраняются и восстанавливаются при перезагрузке страницы и при открытии в новой вкладке.
4. **Сохранение состояния в URL**:
    - Иллюстрация того, как параметры сохраняются в URL, позволяя перезагрузить страницу без потери информации.
5. **Улучшение UX**:
    - Внедрение механизма, позволяющего сохранить текст запроса при перезагрузке страницы для последующего использования при инициализации.






`App.tsx`
```TSX
import { Route, Routes } from "react-router-dom";
import { OrderPage } from "./pages/OrderPage";
import { AboutPage } from "./pages/AboutPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<OrderPage />} />
      <Route path="about" element={<AboutPage />} />
    </Routes>
  );
}

export default App;
```


### Улучшенный стор в URL

**Проблема изначального решения:**

- Хранение стейта поиска в hash URL, плохо масштабируется при усложнении (например, добавлении пагинации, фильтров).
- Сильная связанность компонентов и сторов, усложняющая поддержку и развитие.
- Неудобство работы с несколькими сторами из-за ограничений `persist` функции.

**Подход к улучшению:**

1. **Создание кастомного хука для работы с URL Storage (**`useURLStorage.ts`**):**
    - Использовать ReactRouterDOM для взаимодействия с URL.
    - Использование типизации для удобства работы c параметрами.
    - Перенос логики из компонентов для повторного использования и упрощения компонентной структуры.
2. **Логика работы хука:**
    - Извлекаем параметры из URL и синхронизируем с внутренним стором приложения.
    - Обновление URL параметров при изменении стейта приложения для отражения текущего состояния.
    - Упрощение строки запроса в URL для удобства пользователей.
3. **Преимущества подхода:**
    - Улучшенная масштабируемость и поддерживаемость кода.
    - Уменьшение связанности компонентов и сторов.
    - Упрощение работы с URL и облегчение навигации для пользователя.
4. **Практическое применение:**
    - Обернуть приложение в браузер роутер из ReactRouterDOM для корректной работы.
    - Использование созданного хука в главном компоненте `app.tsx` для обработки параметров поиска и пагинации.


```TSX
import "../App.css";
import { Button, Card, Input, Rate, Tag } from "antd";
import { useCoffeeStore } from "./model/coffeeStore";
import { ShoppingCartOutlined } from "@ant-design/icons";

import { useUrlParamsStore } from "./helpers/useUrlStorage";

// import { useSearchStore } from "../model/searchStore";

function App() {
  const {
    params,
    setParams,
    coffeeList,
    cart,
    addToCart,
    orderCoffee,
    setAddress,
    address,
    clearCart,
  } = useCoffeeStore();
  const handleSearch = (text: string) => {
    setParams({ text });
  };

  //   useEffect(() => {
  //     setParams(params);
  //   }, []);

  //   useEffect(() => {
  //     setParams({ text: queryParams.get("text") || undefined });
  //   }, [queryParams]);

  //   useCoffeeStore.subscribe((state, prev) => {
  //     if (state.params?.text) {
  //       console.log(state.params.text);
  //       queryParams.set("text", state.params.text);
  //       setQueryParams(queryParams);
  //     }

  //     if (state.params?.text !== prev.params?.text && !state.params?.text) {
  //       queryParams.delete("text");
  //       setQueryParams(queryParams);
  //     }
  //   });

  useUrlParamsStore(params, setParams);

  return (
    <div className="wrapper">
      <a href="/about">About</a>
      <Input
        placeholder="Search"
        value={params?.text}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="container">
        {coffeeList ? (
          <div className="cardsContainer">
            {coffeeList.map((coffee) => (
              <Card
                hoverable
                key={coffee.id}
                cover={<img src={coffee.image} />}
                actions={[
                  <Button
                    icon={<ShoppingCartOutlined />}
                    key={coffee.name}
                    onClick={() => addToCart(coffee)}
                  >
                    {coffee.price}
                  </Button>,
                ]}
              >
                <Card.Meta title={coffee.name} description={coffee.subTitle} />
                <Tag style={{ marginTop: "24px" }} color="purple">
                  {coffee.type}
                </Tag>
                <Rate
                  defaultValue={coffee.rating}
                  disabled
                  allowHalf
                  style={{ marginTop: "24px" }}
                />
              </Card>
            ))}
          </div>
        ) : (
          <span>По запросу не нашлось ни одного напитка</span>
        )}

        <aside className="sider">
          <h1>Cart</h1>
          {cart ? (
            <>
              {cart.map((item) => (
                <span key={item.id}>{item.name}</span>
              ))}
              <Input
                placeholder="Adress"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button onClick={orderCoffee} disabled={!address} type="primary">
                Order coffee
              </Button>
              <Button onClick={clearCart}>Clear cart</Button>
            </>
          ) : (
            <span>Your cart is empty</span>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
```

### Slice паттерн

**I. Введение в компонентный подход**

1. Проблема: Приложение разрослось, все в одном файле.
2. Решение: Переход к компонентному подходу - разбиение на несколько файлов.

**II. Декомпозиция компонентов**

1. Создание папки `components`.
2. Вынос карточки напитка
3. Экспорт необходимых компонентов и функций из AntDesign и Store.

**III. Декомпозиция State Management**

1. Проблема: `CoffeeStore` становится слишком большим.
2. Решение: Разделение на несколько файлов или слайсов для упрощения управления и поддержки.

**IV. Создание отдельных слайсов**

1. Удаление ненужных Store и создание новых слайсов, например, `CartSlice` и `ListSlice`.
2. Использование `StateCreator` для определения типов и состояний.
3. Декомпозиция типов и экшенов для точечного использования в слайсах.

**V. Консолидация и оптимизация типов**

1. Создание файла `StoreTypes` для удобного экспорта и импорта типов.
2. Внесение необходимых изменений в слайсы для корректной работы и типизации.

**VI. Финальная интеграция и рефакторинг**

1. Упрощение `CoffeeStore` путем удаления дубликатов и лишних типов.
2. Создание общего Store, объединяющего `CartSlice` и `ListSlice`.
3. Описание только необходимой логики в файле `store`, что облегчает поддержку приложения.

**VII. Заключение: Преимущества подхода**

1. Улучшение читаемости кода и облегчение его поддержки.
2. Более эффективная работа в команде за счет четкого разделения логики и компонентов.
3. Повышение продуктивности разработки за счет декомпозиции и оптимизации структуры приложения.




### Предотвращение рендеров

#### Цель:

Уменьшить количество ненужных ререндеров в приложении для улучшения производительности.

#### Инструменты:

- React DevTools для визуализации ререндеров.
- Хук `useShallow` для оптимизации доступа к данным.

#### Шаги оптимизации:

1. **Визуализация Ререндеров:**
    - Установите расширение React DevTools.
    - Во вкладке разработчика, активируйте опцию "Highlight Updates when component re-render" для визуальной отметки ререндеров.
2. **Проблема:**
    - Вся страница перерендеривается при любом изменении данных, так как стор связан с каждым компонентом.
3. **Решение Проблемы Через** `useShallow`**:**
    - Избавьтесь от глобального вызова стора (`useCoffeeStore`) в верхнем уровне приложения.
    - Разделите компоненты, использующие данные из стора, на отдельные модули.
    - Для каждого компонента, вызывайте стор только там, где это необходимо.
4. **Примеры Имплементации:**
    - **Поиск:** В `searchInput.tsx`, получите доступ к методам и параметрам стора, используя `useShallow`.
    - **Список Кофе:** Аналогично, изолируйте компоненты, работающие со списком кофе и данными корзины.
    - **Методы и Параметры:** Перенесите логику `useEffect` и другие взаимодействия со стором в соответствующие компоненты.
5. **Результаты:**
    - Изменение параметров поиска изменяет только список кофе, не вызывая ререндер всей страницы.
    - Добавление кофе в корзину не приводит к ререндеру других компонентов страницы, за исключением самой корзины.




### Работа с TanStack Query

TanStack Query - это мощная библиотека для контроля запросов на клиентской части приложения. Она принимает, инвалидирует и кэширует запросы.

Добавляем кл

`main.tsx`
```TSX
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={true} />
        <App />
      </QueryClientProvider>
    </BrowserRouter>
    //{" "}
  </React.StrictMode>
);
```



`helpers / useCustomQuery.ts`
```TS
import { useQuery } from "@tanstack/react-query";
import { getCoffeeList } from "../model/coffeeStore";

import { CoffeeQueryParams } from "../types/coffeTypes";

export const useCustomQuery = (params: CoffeeQueryParams) => {
  const { status, isLoading } = useQuery({
    queryKey: ["params", params],
    queryFn: () => getCoffeeList(params),
  });

  return { status, isLoading };
};
```



`components / SearchInput.tsx`
```TSX
import { Input } from "antd";
import { setParams, useCoffeeStore } from "../model/coffeeStore";
import { useUrlParamsStore } from "../helpers/useUrlStorage";

import { useShallow } from "zustand/react/shallow";

import { useCustomQuery } from "../helpers/useCustomQuery";

export const SearchInput = () => {
  const [params] = useCoffeeStore(useShallow((s) => [s.params]));

  useUrlParamsStore(params, setParams);
  useCustomQuery(params);

  return (
    <Input
      placeholder="Search"
      value={params?.text}
      onChange={(e) => setParams({ text: e.target.value })}
    />
  );
};
```



`src/helpers/useUrlStorage.tsx`
```TSX
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useUrlParamsStore = <T extends Record<string, string>>(
  params: T,
  setParams: (params: T) => void
) => {
  const [queryParams, setQueryParams] = useSearchParams();
  
  const setParamsFromUrl = () => {
    const paramsFromUrl: Partial<T> = Object.keys(params).reduce((acc, key) => {
      const value = queryParams.get(key);
      if (typeof value === "string") {
        acc[key as keyof T] = value as T[keyof T];
      }
      return acc;
    }, {} as Partial<T>);
    if (paramsFromUrl) {
      setParams(paramsFromUrl as T);
    }
  };

  useEffect(setParamsFromUrl, [queryParams]);

  useEffect(() => {
    const newQueryParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value) {
        newQueryParams.set(key, value);
      }
    });
    setQueryParams(newQueryParams);
  }, [params]);
};
```



`model / listSlice.ts`
```TS
import { StateCreator } from "zustand";
import {
  CoffeeCartActions,
  CoffeeCartState,
  CoffeeListActions,
  CoffeeListState,
} from "./storeTypes";
import { CoffeeQueryParams, CoffeeType } from "../types/coffeTypes";
import axios from "axios";
import { BASE_URL } from "../api/CoreApi";

export const listSlice: StateCreator<
  CoffeeListActions & CoffeeListState & CoffeeCartActions & CoffeeCartState,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [["zustand/devtools", never]],
  CoffeeListActions & CoffeeListState
> = (set, get) => ({
  coffeeList: undefined,
  controller: undefined,
  params: { text: undefined, type: undefined },

  setParams: (params) => {
    set({ params: { ...get().params, ...params } });
  },

  getCoffeeList: async (params?: CoffeeQueryParams) => {
    const { controller } = get();

    if (controller) {
      controller.abort();
    }

    const newController = new AbortController();
    set({ controller: newController });
    const { signal } = newController;
    const { data } = await axios.get<CoffeeType[]>(BASE_URL, {
      params,
      signal,
    });
    set({ coffeeList: data });
    return data;
  },
});
```

Теперь `getCoffeeList` возвращает `Promise` от типа кофе

`model/storeTypes.ts`
```TS
import { CoffeItem, CoffeeQueryParams, CoffeeType } from "../types/coffeTypes";

export type CoffeeCartState = {
  cart?: CoffeItem[];
  address?: string;
};

export type CoffeeCartActions = {
  setAddress: (address: string) => void;
  addToCart: (item: CoffeeType) => void;
  orderCoffee: () => void;
  clearCart: () => void;
};

export type CoffeeListState = {
  coffeeList?: CoffeeType[];
  controller?: AbortController;
  params: CoffeeQueryParams;
};

export type CoffeeListActions = {
  getCoffeeList: (params?: CoffeeQueryParams) => Promise<CoffeeType[]>;
  setParams: (params?: CoffeeQueryParams) => void;
};
```

### Immer middleware

Что мы хотим сделать? Нам нужно выводить один и тот же напиток не друг за другом, а считать их количество и выводить его сбоку, чтобы не раздувать слишком сильно список.

В этом деле, чтобы не мутировать объекты в нашем сторе, мы можем воспользоваться прослойкой в виде *immer*, который позволяет не мутировать объекты, но задавать им новые значения просто указывая целевое поле для изменения.

Устанавливаем *immer*

```bash
npm i immer
```

Дополняем наш `persist` небольшой конфигурацией `immer`

`model/coffeeStore.ts`
```TS
import { create } from "zustand";
import { CoffeeQueryParams, CoffeeType } from "../types/coffeTypes";

import { devtools, persist } from "zustand/middleware";

import {
  CoffeeCartActions,
  CoffeeCartState,
  CoffeeListActions,
  CoffeeListState,
} from "./storeTypes";
import { listSlice } from "./listSlice";
import { cartSlice } from "./cartSlice";
import { immer } from "zustand/middleware/immer";

export const useCoffeeStore = create<
  CoffeeListActions & CoffeeListState & CoffeeCartActions & CoffeeCartState
>()(
  devtools(
    persist(
      // Просто оборачиваем стейты в immer
      immer((...args) => ({ ...listSlice(...args), ...cartSlice(...args) })),
      {
        name: "coffeeStore",
        partialize: (state) => ({ cart: state.cart, address: state.address }),
      }
    ),
    {
      name: "coffeeStore",
    }
  )
);

export const getCoffeeList = (params?: CoffeeQueryParams) =>
  useCoffeeStore.getState().getCoffeeList(params);

export const addToCart = (item: CoffeeType) =>
  useCoffeeStore.getState().addToCart(item);

export const orderCoffee = () => useCoffeeStore.getState().orderCoffee();

export const setAddress = (address: string) =>
  useCoffeeStore.getState().setAddress(address);

export const clearCart = () => useCoffeeStore.getState().clearCart();

export const setParams = (params: CoffeeQueryParams) =>
  useCoffeeStore.getState().setParams(params);
```

И теперь нам нужно будет заменить код в функции `set`, вставив туда `produce` из *immer*. Теперь мы можем себе позволить не деструктуризировать проект, а сразу мутировать то, что нам прилетает.

В общем работа выглядит следующим образом: мы получаем в `produce` определённый `draft` нашего состояния, который мы изменяем. Потом `immer` подставит этот draft в наш стейт. Вторым аргументом мы получаем немутированные данные в state для изменения нашего черновика, который пойдёт в стор.

Так же в `StateCreator` нужно передать дополнительное обозначение типа `["zustand/immer", unknown]`

`src/model/cartSlice.ts`
```TS
import { StateCreator } from "zustand";
import {
  CoffeeCartActions,
  CoffeeCartState,
  CoffeeListActions,
  CoffeeListState,
} from "./storeTypes";
import {
  CoffeItem,
  CoffeSizeEnum,
  OrderCoffeeReq,
  OrderCoffeeRes,
} from "../types/coffeTypes";
import axios, { AxiosError } from "axios";
import { BASE_URL } from "../api/CoreApi";
import { produce } from "immer";

export const cartSlice: StateCreator<
  CoffeeListActions & CoffeeListState & CoffeeCartActions & CoffeeCartState,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", unknown]
  ],
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", unknown]
  ],
  CoffeeCartState & CoffeeCartActions
> = (set, get) => ({
  cart: undefined,
  address: undefined,

  clearCart: () => set({ cart: undefined }),

  setAddress: (address) => set({ address }),

  addToCart: (item) => {
    const preparedItem: CoffeItem = {
      id: item.id,
      name: `${item.name} ${item.subTitle}`,
      quantity: 1,
      size: CoffeSizeEnum.M,
    };

    set(
      // Используем produce
      produce<CoffeeCartState>((draft) => {
        if (!draft.cart) draft.cart = [];

        const itemIndex = draft.cart.findIndex(
          (cartItem) => cartItem.id === preparedItem.id
        );
        
        if (itemIndex !== -1) {
          draft.cart[itemIndex].quantity += 1;
          return;
        }
        
        draft.cart.push(preparedItem);
      })
    );
  },

  orderCoffee: async () => {
    const { cart, address } = get();
    const order: OrderCoffeeReq = {
      address: address!,
      orderItems: cart!,
    };
    try {
      const { data } = await axios.post<OrderCoffeeRes>(
        BASE_URL + "order",
        order
      );
      if (data.success) {
        alert(data.message);
        get().clearCart();
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error);
      }
    }
  },
});
```

Выведем количество кофе в корзине

`src/components/Cart.tsx`
```TSX
import { useCoffeeStore } from "../model/coffeeStore";
import { useShallow } from "zustand/react/shallow";

export const Cart = () => {
  const [cart] = useCoffeeStore(useShallow((state) => [state.cart]));

  return (
    <>
      {cart ? (
        <>
          {cart.map((item, index) => (
            <span key={item.id + index + item.name}>{`${item.name}${
              item.quantity > 1 ? ` x ${item.quantity}` : ""
            }`}</span>
          ))}
        </>
      ) : (
        <span>Your cart is empty</span>
      )}
    </>
  );
};
```




