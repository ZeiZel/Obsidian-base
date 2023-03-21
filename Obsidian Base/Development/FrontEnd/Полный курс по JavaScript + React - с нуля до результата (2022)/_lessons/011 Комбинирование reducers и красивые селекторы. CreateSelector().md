
При разрастании приложения увеличивается и количество действий, которые должен контролировать реакт. Если экшены можно спокойно разделить по папкам и обращаться конкретно к нужным, то данное разрастание не позволит спокойно поделить функцию-редьюсер

В нашем приложении достаточно логичным будет отделить логику работы с персонажами и фильтрами. Однако мы сталкиваемся с тем, что фильтры так же используют состояние персонажей, чтобы контролировать их список.

![](_png/Pasted%20image%2020230321081841.png)

Чтобы сократить код и разбить логику, можно:
- разделить логику редьюсера через функцию `combineReducers`
- вынести фильтрацию внутрь компонента, чтобы разбить логику стейтов

Тут мы выносим фильтрацию полученных данных из стейта и теперь её не нужно проводить внутри редьюсера

`components > heroesList > HeroesList.js`
```JS
const HeroesList = () => {
	const filteredHeroes = useSelector((state) => {
		if (state.activeFilter === 'all') {
			return state.heroes;
		} else {
			return state.heroes.filter((item) => state.heroes === state.activeFilter);
		}
	});

	// сейчас отсюда достаём просто статус загрузки
	const heroesLoadingStatus = useSelector((state) => state.heroesLoadingStatus);

	/// CODE ...
```

Теперь нам не нужно данное состояние

![](_png/Pasted%20image%2020230321084033.png)

И данная фильтрация в редьюсере

![](_png/Pasted%20image%2020230321084029.png)

Вынесем из главного `reducer` логику по работе с персонажами и его стейты в отдельный файл

`reducers > heroes.js`
```JS
const initialState = {
	heroes: [],
	heroesLoadingStatus: 'idle',
};

export const heroes = (state = initialState, action) => {
	switch (action.type) {
		case 'HEROES_FETCHING':
			return {
				...state,
				heroesLoadingStatus: 'loading',
			};
		case 'HEROES_FETCHED':
			return {
				...state,
				heroes: action.payload,
				heroesLoadingStatus: 'idle',
			};
		case 'HEROES_FETCHING_ERROR':
			return {
				...state,
				heroesLoadingStatus: 'error',
			};
		// Самая сложная часть - это показывать новые элементы по фильтрам
		// при создании или удалении
		case 'HERO_CREATED':
			return {
				...state,
				heroes: [...state.heroes, action.payload],
			};
		case 'HERO_DELETED':
			return {
				...state,
				heroes: state.heroes.filter((item) => item.id !== action.payload),
			};
		default:
			return state;
	}
};
```

Тут уже будем хранить логику фильтрации

`reducers > filters.js`
```JS
const initialState = {
	filters: [],
	filtersLoadingStatus: 'idle',
	activeFilter: 'all',
};

export const filters = (state = initialState, action) => {
	switch (action.type) {
		case 'FILTERS_FETCHING':
			return {
				...state,
				filtersLoadingStatus: 'loading',
			};
		case 'FILTERS_FETCHED':
			return {
				...state,
				filters: action.payload,
				filtersLoadingStatus: 'idle',
			};
		case 'FILTERS_FETCHING_ERROR':
			return {
				...state,
				filtersLoadingStatus: 'error',
			};
		case 'ACTIVE_FILTER_CHANGED':
			return {
				...state,
				activeFilter: action.payload,
			};
		default:
			return state;
	}
};
```

И тут через функцию `combineReducers` объединяем две функции редьюсера в один внутри объекта. Теперь обычный `reducer` не нужен и его можно будет удалить

`store > index.js`
```JS
import { createStore, combineReducers } from 'redux';
import { heroes } from '../reducers/heroes';
import { filters } from '../reducers/filters';

const store = createStore(
	combineReducers({ heroes, filters }),
	window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);

export default store;
```

И теперь, после манипуляций с объединением редьюсеров, нужно будет вытаскивать нужные объекты из объектов, которые были названы и переданы в `combineReducers`

![](_png/Pasted%20image%2020230321090505.png)

И вот уже с таким синтаксисом мы можем импортировать поля из нескольких объектов
Однако такой подход приводит к тому, что компонент будет перерисовываться при каждом изменении стейта
*Такой вариант не стоит использовать в проекте, так как он не оптимизирован*

```JS
const someState = useSelector((state) => ({  
   activeFilter: state.filters.activeFilter,  
   heroes: state.heroes.heroes,  
}));
```




