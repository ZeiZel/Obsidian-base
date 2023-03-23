
RTK Qeury и React Query концептуально меняют подход к использованию данных в приложении. Они предлагают не изменять глобальные состояния, а оперировать загруженными данными

Сейчас наше взаимодействие выглядит так:
- мы отправляем запрос на сервер
- мы получаем данные с сервера
- отправляем изменение состояния в стейт

![](_png/Pasted%20image%2020230323152622.png)

Далее потребуются две основные функции для работы с Query:
- `createApi` - полностью описывает поведение RTK Query
- `fetchBaseQuery` - модифицированная функция `fetch()`

Чтобы начать работать с данной библиотекой, нужно будет написать будущее АПИ общения с RTK Query:
- Пишем функцию `createApi`, которая описывает взаимодействие с библиотекой и передаём в неё объект
	- `reducerPath` будет указывать то пространство имён, в котором происходят все запросы
	- `baseQuery` описывает полностью базовые параметры запроса на сервер
		- функция `fetchBaseQuery` выполняет функцию фетча, но хранит дополнительные параметры для ртк
		- `baseUrl` принимает строку для обращения к серверу
	- `endpoints` хранит функцию, которая возвращает объект с теми запросами и изменениями, что мы можем вызвать
		- свойство объекта будет входить в имя хука, который будет сгенерирован. Если мы имеем имя `getHeroes`, то библиотека сформирует хук `useGetHeroes[Query/Mutation]` (суффикс уже будет зависеть от типа того, что делает хук - просто запрос или мутация данных)

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

Далее нужно сконфигурировать хранилище:
- чтобы добавить новый reduce, нужно в качестве свойства указать динамическую строку `apiSlice.reducerPath` и указать значение переменной самого редьюсера `apiSlice.reducer`
- далее добавляем `middleware` для обработки специфических запросов RTK Query

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

И уже тут мы можем воспользоваться хуком, который сгенерировал Query. Через хук `useGetHeroesQuery` мы получаем все те промежуточные состояния, которые могут быть присвоены запросы, который приходит с сервера

> Так же нужно упомянуть, что все те данные, что мы получили с сервера будут кешироваться в браузере на определённое время

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

	// получаем доступ к выбранному пользователем фильтру
	const activeFilter = useSelector((state) => state.filters.activeFilter);

	// это фильтр героев, которых мы получили с сервера
	const filteredHeroes = useMemo(() => {
		// создаём копию массива персонажей
		const filteredHeroes = heroes.slice();

		if (activeFilter === 'all') {
			return filteredHeroes;
		} else {
			return filteredHeroes.filter((item) => item.element === activeFilter);
		}
	}, [heroes, activeFilter]);

	/// CODE ...

	if (isLoading) {
		return <Spinner />;
	} else if (isError) {
		return <h5 className='text-center mt-5'>Ошибка загрузки</h5>;
	}

	/// CODE ...

	// и сюда подставляем отсортированных персонажей  
	const elements = renderHeroesList(filteredHeroes);
	return <TransitionGroup component='ul'>{elements}</TransitionGroup>;
};

export default HeroesList;
```

И наше приложение работает теперь так же, как и до изменений - список героев нормально получается с сервера

![](_png/Pasted%20image%2020230323174138.png)



`api > apiSlice.js`
```JS
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: 'http://localhost:3001',
	}),
	endpoints: (builder) => ({
		getHeroes: builder.query({
			query: () => '/heroes',
		}),
		createHero: builder.mutation({
			query: (hero) => ({
				url: '/heroes',
				method: 'POST',
				body: hero,
			}),
		}),
	}),
});

export const { useGetHeroesQuery, useCreateHeroMutation } = apiSlice;
```

И далее можно будет применить данный хук мутации в коде:
- хук возвращает массив из двух объектов:
	- функция отправки мутации данных
	- объект со статусом обработки запроса (тот же объект, что и у `query`)
- далее можно будет применить функцию отправки героя на сервер и передать в него нового героя
- и для нормальной работы всех обработчиков (объект из второго аргумента) используется функция `unwrap()`

![](_png/Pasted%20image%2020230323182350.png)

Однако после отправки запроса на сервер, мы не получаем на главной странице нового списка персонажей с нашим созданным героем.

Чтобы исправить данную ситуацию, нам нужно будет использовать наш стейт `api` и обновлять стейт на фронте, когда мы получаем актуальные данные с сервера

Чтобы подвязать выполнение одних запросов под другие, нужно использовать теги в `createApi`

![](_png/Pasted%20image%2020230323182901.png)



`api > apiSlice.js`
```JS
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: 'http://localhost:3001',
	}),
	// тут мы задаём, какие метки (теги) существуют
	tagTypes: ['Heroes'],
	endpoints: (builder) => ({
		getHeroes: builder.query({
			query: () => '/heroes',
			// указываем, когда данные запрашиваются при помощи обычного запроса
			providesTags: ['Heroes'], // а тут мы подцепляемся к тегам - функция триггерится от тегов
		}),
		createHero: builder.mutation({
			query: (hero) => ({
				url: '/heroes',
				method: 'POST',
				body: hero,
			}),
			// если мы мутировали эти данные, то по какой метке мы должны получить эти данные
			invalidatesTags: ['Heroes'], // а тут мы указываем, что именно нужно обновить повторно, когда данные изменились
		}),
	}),
});

export const { useGetHeroesQuery, useCreateHeroMutation } = apiSlice;
```

И теперь всё работает - при создании нового персонажа триггерится функция обновления списка персонажей на фронте

![](_png/Pasted%20image%2020230323184202.png)















