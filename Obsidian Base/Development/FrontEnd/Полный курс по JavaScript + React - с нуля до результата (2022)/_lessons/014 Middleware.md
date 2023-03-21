
==Middleware== - это `enhancer`, который занимается улучшением только `dispatch`

`store > index.js`
```JS
// функция-посредник, которая работает только на dispatch
// сюда автоматически будет попадать две сущности из store - dispatch, getState
const stringMiddleware =
	({ dispatch, getState }) =>
	// потом здесь мы буем принимать dispatch
	(dispatch) =>
	// а это уже по-факту и есть новая функция dispatch с изменением функционала
	(action) => {
		if (typeof action === 'string') {
			return dispatch({ type: action });
		}

		return dispatch(action);
	};
```

- первым аргументом можно так же ничего не передавать, потому что нам не всегда нужен `store`
- обычно, функцию `dispatch` называют `next`, так как будет вызываться следующая функция из `middleware`

`store > index.js`
```JS
const stringMiddleware =
	() =>
	(next) =>
	(action) => {
		if (typeof action === 'string') {
			return next({ type: action });
		}

		return next(action);
	};
```

Чтобы применять middleware в 

`store > index.js`
```JS
const store = createStore(
	combineReducers({ heroes, filters }),
	compose(
		applyMiddleware(stringMiddleware),
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
	),
);
```


