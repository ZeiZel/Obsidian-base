
RTK Qeury и React Query концептуально меняют подход к использованию данных в приложении. Они предлагают не изменять глобальные состояния, а оперировать загруженными данными

Сейчас наше взаимодействие выглядит так:
- мы отправляем запрос на сервер
- мы получаем данные с сервера
- отправляем изменение состояния в стейт

![](_png/Pasted%20image%2020230323152622.png)

Далее потребуются две основные функции для работы с Query:
- `createApi` - полностью описывает поведение RTK Query
- `fetchBaseQuery` - модифицированная функция `fetch()`



`api > apiSlice.js`
```JS
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// эта функция генерирует хуки (эндпоинты) на каждое наше действие
// так же она генерирует и редьюсер (как createSlice)
export const apiSlice = createApi({
	// путь к редьюсеру
	reducerPath: 'api',
	// формирование базового запроса
	baseQuery: fetchBaseQuery({
		// тут указываем ссылку до сервера
		baseUrl: 'http://localhost:3001',
	}),
	// тут указываем те операции, которые будем проводить по базовому адресу (получение, отправка, удаление данных)
	// query - запросы, которые получают данные и сохраняют их
	// mutation - запросы на изменение данных на сервере
	endpoints: (builder) => ({
		// тут мы просто хотим получить героев с сервера
		getHeroes: builder.query({
			query: () => '/heroes',
		}),
	}),
});

export const { useGetHeroesQuery } = apiSlice;
```



`store > index.js`
```JS
import { apiSlice } from '../api/apiSlice';

const store = configureStore({
	reducer: { 
		heroes, 
		filters, 
		// добавляем reducer, сформированный через RTK Query
		[apiSlice.reducerPath]: apiSlice.reducer 
	},
	devTools: process.env.NODE_ENV === 'development',
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			stringMiddleware, 
			// передаём сюда middleware для обработки запросов RTK Query
			apiSlice.middleware
		),
});
```



`components > heroesList > HeroesList.js`
```JS
import { heroDeleted, fetchHeroes, filteredHeroesSelector } from './heroesSlice';
import { useGetHeroesQuery } from '../../api/apiSlice';

const HeroesList = () => {
	const {
		// тут нужно установить значение по умолчанию, так как это асинхронный код
		data: heroes = [], // получаем данные, которые запишем в переменную heroes
		isUninitialized, // если true, то запрос вообще не был отправлен
		isFetching, // состояние отправленного запроса
		isLoading, // состояние загрузки
		isError, // состояние ошибки
		error, // переменная с ошибкой
	} = useGetHeroesQuery();

	/// CODE ...

	if (isLoading) {
		return <Spinner />;
	} else if (isError) {
		return <h5 className='text-center mt-5'>Ошибка загрузки</h5>;
	}

	/// CODE ...

	// и сюда подставляем переменную из
	const elements = renderHeroesList(heroes);
	return <TransitionGroup component='ul'>{elements}</TransitionGroup>;
};

export default HeroesList;
```






