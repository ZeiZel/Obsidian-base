
Первым делом нужно установить библиотеки редакса в приложение

```bash
npm i redux react-redux
```

Дальше распишем базовую схему, которая будет соответствовать архитектуре работы редакса:
- начальное состояние
- функция-редьюсер
- стейт

```JS
// начальное состояние
const initialState = 0;

// функция изменения стейта
const reducer = (state, action) => {
	if (action.type === 'INC') {
		return state + 1;
	}
	return 0;
};

// стейт
const state = reducer(initialState, { type: 'INC' });

console.log('State after reducer = ' + state);
```

![](_png/Pasted%20image%2020230318112333.png)

Уже таким образом функция редьюсера будет написана лаконичнее, так как действий может быть множество

```JS
const reducer = (state = 0, action) => {
	switch (action.type) {
		case 'INC':
			return state + 1;
		case 'DEC':
			return state - 1;
		default:
			return state;
	}

	return 0;
};
```

И тут нужно сказать, что стоит установить дефолтное значение, так как в функцию может попасть `undefined`, что может привести к ошибке

![](_png/Pasted%20image%2020230318114754.png)

Ну и далее создадим единый стор, который уже принимает в себя функцию-редьюсер. Обычно в приложении располагается только один стор 

```JS
import { createStore } from 'redux';

// начальное состояние
const initialState = 0;

// функция изменения стейта
const reducer = (state = 0, action) => {
	switch (action.type) {
		case 'INC':
			return state + 1;
		case 'DEC':
			return state - 1;
		default:
			return state;
	}

	return 0;
};

// это стор, который хранит функцию-редьюсер и все стейты
const store = createStore(reducer);

// вызываем функцию reducer и передаём в неё значение
store.dispatch({ type: 'INC' });

console.log('Value in state = ' + store.getState());
```

![](_png/Pasted%20image%2020230318115711.png)

Так же мы можем реализовать подписку на изменения в сторе, что позволит контролировать изменение состояний в приложении

```JS
// начальное состояние
const initialState = 0;

// функция изменения стейта
const reducer = (state = 0, action) => {
	switch (action.type) {
		case 'INC':
			return state + 1;
		case 'DEC':
			return state - 1;
		default:
			return state;
	}

	return 0;
};

// это стор, который хранит функцию-редьюсер и все стейты
const store = createStore(reducer);

// подписка позволяет вызывать функцию, которая будет срабатывать каждый раз при изменении стейта внутри стора
store.subscribe(() => {
	console.log('Value in state = ' + store.getState());
});

// вызываем функцию reducer и передаём в неё значение
store.dispatch({ type: 'INC' });
store.dispatch({ type: 'INC' });
```

![](_png/Pasted%20image%2020230318120916.png)

>[!info] Важные правила работы с Reducer:
> - Эта функция должна быть чистой и зависеть только от приходящего в неё стейта и экшена
> - Она должна вовзвращать один и тот же результат при одинаковых аргументах и не иметь никаких побочных эффектов (никаких логов, запросов на сервер, генераций случайных чисел и никакой работы с ДОМ-деревом)





