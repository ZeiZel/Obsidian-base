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
import { createAction, nanoid } from '@reduxjs/toolkit'

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

> Тут так же стоит отметить, что в **RTK** была добавлена функция `nanoid`, которая генерирует уникальный идентификатор для объекта

## Redux Toolkit `createReducer()`

Функция `reducer` зачастую представляет из себя очень много блоков `switch-case` и много вложенных конструкций, которые нужно редактировать в глубине, что усложняет разработку

Для упрощения создания `reducer` была добавлена функция `createReducer`, которая принимает в себя:
- начальное состояние
- `builder`, который позволяет строить `reducer` за счёт встроенных в него трёх функций

`builder` использует три функции:
- `addCase` - добавляет кейс в свитчер редьюсера
- `addDefaultCase` - устанавливает дефолтный кейс выполнения
- `addMatcher` - позволяет фильтровать входящие экшены

И так выглядит реализация нашего редьюсера героев через `createReducer`:

`reducers > heroes.js`
```JS
import { createReducer } from '@reduxjs/toolkit';

import {
	heroesFetching,
	heroesFetched,
	heroesFetchingError,
	heroCreated,
	heroDeleted,
} from '../actions';

const initialState = {
	heroes: [],
	heroesLoadingStatus: 'idle',
};

export const heroes = createReducer(initialState, (builder) => {
	// вызываем объект билдера
	builder
		// создаём отдельный кейс как в switch-case
		.addCase(
			// action кейса
			heroesFetching,
			// reducer
			(state, action) => {
				// меняем состояние напрямую
				state.heroesLoadingStatus = 'loading';
			},
		)
		.addCase(heroesFetched, (state, action) => {
			state.heroes = action.payload;
			state.heroesLoadingStatus = 'idle';
		})
		.addCase(heroesFetchingError, (state, action) => {
			state.heroesLoadingStatus = 'error';
		})
		.addCase(heroCreated, (state, action) => {
			state.heroes.push(action.payload);
		})
		.addCase(heroDeleted, (state, action) => {
			state.heroes = state.heroes.filter((item) => item.id !== action.payload);
		})
		.addDefaultCase(() => {});
});
```

> Так же нужно отметить, что внутри функций `builder` используется библиотека `ImmerJS`, которая сама отвечает за сохранение логики иммутабельности в проекте. То есть мы можем писать визуально проект с мутациями, а библиотека сама переведёт код в иммутабельные сущности.
> Такой подход будет работать ровно до тех пор, пока мы ничего не возвращаем из этих функций через `return`

Однако функция `createReducer` требует для работы, чтобы все экшены были написаны с помощью `createAction`

`actions > index.js`
```JS
import { createAction } from '@reduxjs/toolkit';

export const fetchHeroes = (request) => (dispatch) => {
	dispatch(heroesFetching());
	request('http://localhost:3001/heroes')
		.then((data) => dispatch(heroesFetched(data)))
		.catch(() => dispatch(heroesFetchingError()));
};

export const heroesFetching = createAction('HEROES_FETCHING');
export const heroesFetched = createAction('HEROES_FETCHED');
export const heroesFetchingError = createAction('HEROES_FETCHING_ERROR');
export const heroCreated = createAction('HERO_CREATED');
export const heroDeleted = createAction('HERO_DELETED');
```

Так же у нас есть вариант использовать более короткий способ создания редьюсеров через объект. Такой способ уже не работает с TS.

`reducers > heroes.js`
```JS
export const heroes = createReducer(
	// начальное состояние
	initialState,
	// карта действий (кейсы)
	{
		[heroesFetching]: (state) => {
			state.heroesLoadingStatus = 'loading';
		},
		[heroesFetched]: (state, action) => {
			state.heroes = action.payload;
			state.heroesLoadingStatus = 'idle';
		},
		[heroesFetchingError]: (state, action) => {
			state.heroesLoadingStatus = 'error';
		},
		[heroCreated]: (state, action) => {
			state.heroes.push(action.payload);
		},
		[heroDeleted]: (state, action) => {
			state.heroes = state.heroes.filter((item) => item.id !== action.payload);
		},
	},
	// массив функций сравнения
	[],
	// действие по умолчанию
	() => {},
);
```

## Redux Toolkit `createSlice()`

- Данная функция объединяет функции `createAction` и `createReducer` в одно
- Обычно она располагается рядом с файлом, к которому она и относится
- В конец названия файла обычно добавляется суффикс `Slice` 

Функция `createSlice` принимает в себя 4 аргумента:
- `name` - пространство имён создаваемых действий (имя среза). Это имя *будет являться префиксом для всех имён экшенов*, которые мы будем передавать в качестве ключа внутри объекта `reducers`
- `initialState` - начальное состояние
- `reducers` - объект с обработчиками
- `extraReducers` - объект с редьюсерами другого среза (обычно используется для обновления объекта, относящегося к другому слайсу)

Конкретно тут был создан срез `actionCreators` и `reducer` для героев в одном файле рядом с самим компонентом 

`components > heroesList > HeroesList.js`
```JS
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	heroes: [],
	heroesLoadingStatus: 'idle',
};

const heroesSlice = createSlice({
	// пространство имён, в котором будут происходить все экшены
	name: 'heroes',
	// начальное состояние
	initialState,
	reducers: {
		// свойство генерирует экшен
		// а значение генерирует действие редьюсера
		heroesFetching: (state) => {
			state.heroesLoadingStatus = 'loading';
		},
		heroesFetched: (state, action) => {
			state.heroes = action.payload;
			state.heroesLoadingStatus = 'idle';
		},
		heroesFetchingError: (state, action) => {
			state.heroesLoadingStatus = 'error';
		},
		heroCreated: (state, action) => {
			state.heroes.push(action.payload);
		},
		heroDeleted: (state, action) => {
			state.heroes = state.heroes.filter((item) => item.id !== action.payload);
		},
	},
});

const { actions, reducer } = heroesSlice;

export const { heroCreated, heroDeleted, heroesFetched, heroesFetchingError, heroesFetching } =
	actions;
export default reducer;
```

И далее импортируем наш `reducer` в `store`

`store > index.js`
```JS
import heroes from '../components/heroesList/heroesSlice';

const store = configureStore({
	reducer: { heroes, filters },
	devTools: process.env.NODE_ENV === 'development',
	middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(stringMiddleware),
});
```

Теперь всё то, что относится к `actionCreators` героев можно удалить из файла экшенов и импортировать нужные зависимости для работы функции `fetchHeroes`

`actions > index.js`
```JS
import {
	heroCreated,
	heroDeleted,
	heroesFetched,
	heroesFetchingError,
	heroesFetching,
} from '../components/heroesList/heroesSlice';

export const fetchHeroes = (request) => (dispatch) => {
	dispatch(heroesFetching());
	request('http://localhost:3001/heroes')
		.then((data) => dispatch(heroesFetched(data)))
		.catch(() => dispatch(heroesFetchingError()));
};

/// CODE ...
```

Далее нужно поправить некоторые импорты в `HeroesList` и в `HeroesAddForm`

И теперь мы имеем работающее приложение, которое мы переписали на более коротком синтаксисе.

Однако тут стоит сказать, что теперь наши действия были переименованы под образ `createSlice`, где обозначается пространство выполняемых действий экшеном (`heroes`) и сам `actionCreator` (`heroesFetching`) 

![](_png/Pasted%20image%2020230322095937.png)

Если нам нужно будет не только получить, но и обогатить `payload`, то можно будет добавить передать в экшен два объекта:
- `reducer` - это сам обработчик
- `prepare` - обработчик, который обогащает `payload`

```JS
import { createSlice, nanoid } from '@reduxjs/toolkit'

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: {
      // это та стандартная функция, которую мы просто помещаем в экшен
      // тут мы получаем и стейт и экшен для передачи payload
      reducer: (state, action) => {
        state.push(action.payload)
      },
      // а это дополнительное действие для формирования самого payload
      prepare: (text) => {
        const id = nanoid()
        return { payload: { id, text } }
      },
    },
  },
})
```

Если нам нужно изменить стейт уже в другом компоненте из нашего, то мы можем воспользоваться для этого `extraReducers`

```JS
import { createAction, createSlice } from '@reduxjs/toolkit'
import { incrementBy, decrement } from './actions'

function isRejectedAction(action) {
  return action.type.endsWith('rejected')
}

createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(incrementBy, (state, action) => {
      })
      .addCase(decrement, (state, action) => {})
      .addMatcher(
        isRejectedAction,
        (state, action) => {}
      )
      .addDefaultCase((state, action) => {})
  },
})
```

## Redux Toolkit `createAsyncThunk()`

Функция `createAsyncThunk()` позволяет сделать асинхронный `actionCreator`, который будет вести себя ровно так же, как и при использовании обычного `redux-thunk`. 
Использование данной функции является приоритетным, так как при таком запросе `heroes/fetchHeroes` функция возвращает нам три экшена, которые поделены на:
-   `pending`: `'heroes/fetchHeroes/pending'`
-   `fulfilled`: `'heroes/fetchHeroes/fulfilled'`
-   `rejected`: `'heroes/fetchHeroes/rejected'`
Такой подход позволит нам не обрабатывать три разных состояния функции самостоятельно, а перекладывать это на функционал тулкита.

> Тут нужно отметить, что из данной функции мы должны возвращать `Promise`, который функция сама и обработает по трём состояниям

Сам `reducer`, который мы создали через `createAsyncThunk` будет передаваться в основной `reducer` уже как четвёртый аргумент - объект `extraReducers`

Тут мы создали функцию `fetchHeroes`, которая заменит `fetchHeroes` находящийся в `actions`. Далее нужно будет обработать три состояния `fetchHeroes` уже внутри самого `heroesSlice`, передав внутрь `extraReducers`

`components > heroesList > heroesSlice.js``
```JS
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { useHttp } from '../../hooks/http.hook';

const initialState = {
	heroes: [],
	heroesLoadingStatus: 'idle',
};

export const fetchHeroes = createAsyncThunk(
	// название среза / тип действия
	'heroes/fetchHeroes',
	// асинхронная функция
	// 1 арг - то, что приходит при диспетче
	// 2 арг - thunkAPI (dispatch, getState)
	async () => {
		const { request } = useHttp();
		return await request('http://localhost:3001/heroes');
	},
);

const heroesSlice = createSlice({
	name: 'heroes',
	initialState,
	reducers: {
		// а тут мы удалим heroesFetching, heroesFetched, heroesFetchingError, так как функционал перенесён в fetchHeroes
		heroCreated: (state, action) => {
			state.heroes.push(action.payload);
		},
		heroDeleted: (state, action) => {
			state.heroes = state.heroes.filter((item) => item.id !== action.payload);
		},
	},
	extraReducers: (builder) => {
		builder
			// добавляем формирование запроса
			.addCase(fetchHeroes.pending, (state) => {
				state.heroesLoadingStatus = 'loading'; // состояние загрузки
			})
			// запрос выполнен
			.addCase(fetchHeroes.fulfilled, (state, action) => {
				state.heroes = action.payload; // данные, полученные с сервера попадут сюда
				state.heroesLoadingStatus = 'idle'; // состояние ожидания
			})
			// запрос отклонён
			.addCase(fetchHeroes.rejected, (state, action) => {
				state.heroesLoadingStatus = 'error'; //
			});
	},
});

const { actions, reducer } = heroesSlice;

export const { heroCreated, heroDeleted, heroesFetched, heroesFetchingError, heroesFetching } =
	actions;
export default reducer;
```

Теперь тут меняем импорты

`components > heroesList > HeroesList.js`
```JS
import { heroDeleted, fetchHeroes } from './heroesSlice';
```

Ну и так же из нашего хука `useHttp` нужно убрать `useCallback`, так как это приведёт к ошибке

![](_png/Pasted%20image%2020230322171400.png)

```JS
export const useHttp = () => {
	// убрать useCallback
	const request = async (
		url,
		method = 'GET',
		body = null,
		headers = { 'Content-Type': 'application/json' },
	) => {
		try {
			const response = await fetch(url, { method, body, headers });

			if (!response.ok) {
				throw new Error(`Could not fetch ${url}, status: ${response.status}`);
			}

			const data = await response.json();

			return data;
		} catch (e) {
			throw e;
		}
	};

	return {
		request,
	};
};
```

И теперь всё работает и функция за нас реализовала сразу три состояния стейта

![](_png/Pasted%20image%2020230322171929.png)

## Redux Toolkit `createEntityAdapter()`

Функция `createEntityAdapter()` позволит создавать готовый объект с часто-выполняемыми CRUD-операциями в `reducer`



















