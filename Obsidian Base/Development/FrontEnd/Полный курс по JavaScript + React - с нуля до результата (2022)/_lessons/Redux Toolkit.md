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











## Redux Toolkit `createReducer()`











## Redux Toolkit `createSlice()`











## Redux Toolkit `createAsyncThunk()`











## Redux Toolkit `createEntityAdapter()`








