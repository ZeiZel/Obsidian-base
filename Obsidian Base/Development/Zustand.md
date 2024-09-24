
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

### Асинхронные операции

### Запрос на сервер

### Persist

### Reset состояния




## Продвинутые техники

### Подписки на store

### Кастомные хранилища

### Улучшенный стор в URL

### Slice паттерн

### Предотвращение рендеров

### Работа с TanStack Query

### Immer middleware


