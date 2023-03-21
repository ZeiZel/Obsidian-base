#RTK #Redux #ReduxToolkit


Проблемы больших проектов на обычном редакса:
- очень много *boilerplates* при создании `actionCreators` и `reducers`
- при большом количестве `enhancers` и `middlewares` функция по созданию `store` сильно разрастается 

**Redux Toolkit** включает в себя набор инструментов для более простой и быстрой работы с `states` и `store`. 

Та же функция `createSelector` была переэкспортирована из модуля **Reselect** в **RTK** 

## Redux Toolkit `configureStore()`

Функция `configureStore` предназначена для того, чтобы удобно автоматически регулировать `reducers`, подключать `middlewares` или `enhancers` и автоматически подключать **redux devtools** без дополнительных строк кода  

В тулкит так же включены изначально самые популярные `middlewares`:
- *Serializability Middlweware* - проверяет, чтобы в стейте были только те значения, которые должны быть в сторе
- *Immutability Middlweware* - предназначен для обнаружения мутаций, которые могут быть в сторе
- *Thunk Middlweware* - позволяет в экшены автоматически получать `dispatch`

И уже так будет выглядеть создание нового `store` с использованием **RTK** 

`store > index.js`
```JS
import { heroes } from '../reducers/heroes';
import { filters } from '../reducers/filters';
import { configureStore } from '@reduxjs/toolkit';

const stringMiddleware = () => (next) => (action) => {
	if (typeof action === 'string') {
		return next({ type: action });
	}

	return next(action);
};

const store = configureStore({
	// подключаем редьюсеры
	reducer: { heroes, filters },
	// подключаем девтулз
	devTools: process.env.NODE_ENV === 'development',
	// подключаем все стандартные middleware (включая thunk) и наши собственные
	middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(stringMiddleware),
});

export default store;
```

## Redux Toolkit `createAction()`

Функция `createAction()` позволяет автоматически выполнять операцию по созданию экшена

Функция принимает в себя:
- тип действия 
- вспомогательную функцию

И далее тут нужно сказать, что данная функция автоматически обрабатывает поступающие в неё данные. Т.е. если вызвать `heroesFetched` и передать в него аргумент, то он автоматически отправится в поле `payload`

Ниже представлены две реализации экшенов - классическая и через `createAction` и обе из них работают полностью взаимозаменяемо

```JS
export const heroesFetching = () => {
	return {
		type: 'HEROES_FETCHING',
	};
};

export const heroesFetched = (heroes) => {
	return {
		type: 'HEROES_FETCHED',
		payload: heroes,
	};
};

// ИЛИ ...

export const heroesFetching = createAction('HEROES_FETCHING');
export const heroesFetched = createAction('HEROES_FETCHED');
```

> Тут уже стоит отметить, что в `reducer` стоит передавать только одно поле payload. Таким образом будет проще читать код и воспринимать его. Остальные побочные действия лучше делать вне `reducer`.

И вот пример, когда мы вторым аргументом передаём дополнительную функцию, которая осуществляет возврат обогащённого `payload`, который уже будет содержать не просто переданные данные, а ещё и сгенерированные нами

```JS
const addTodo = createAction('todos/add', function prepare(text) {
  return {
    payload: {
      text,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    },
  }
})
```

## Redux Toolkit `createReducer()`











## Redux Toolkit `createSlice()`

Данная функция объединяет функции `createAction` и `createReducer` в одно









## Redux Toolkit `createAsyncThunk()`











## Redux Toolkit `createEntityAdapter()`








