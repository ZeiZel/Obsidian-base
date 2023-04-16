
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

![](_png/ab43c66008dc18cdee71c6de7645cb64.png)

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

![](_png/dde820134b8651b1028b5159d0f4b6a1.png)

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

![](_png/7f88bed5d6451057bc1ea84cdc649a16.png)

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

![](_png/74b1417834efbe320877ead56dc58ec0.png)

>[!info] Важные правила работы с Reducer:
> - Эта функция должна быть чистой и зависеть только от приходящего в неё стейта и экшена
> - Она должна вовзвращать один и тот же результат при одинаковых аргументах и не иметь никаких побочных эффектов (никаких логов, запросов на сервер, генераций случайных чисел и никакой работы с ДОМ-деревом)

Вёрстка кнопок

```HTML
<div id="rooter" class="jumbotron">
	<h1 id="counter">0</h1>
	<button id="dec" class="btn btn-primary1">DEC</button>
	<button id="inc" class="btn btn-primary1">INC</button>
	<button id="rnd" class="btn btn-primary1">RND</button>
</div>
```

Стили

```CSS
.jumbotron {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 99vh;
  height: 99vh;
}
```

И использование редакса на странице:

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
		case 'RND':
			return state * action.payload;
		default:
			return state;
	}

	return 0;
};

// это стор, который хранит функцию-редьюсер и все стейты
const store = createStore(reducer);

const updateCounter = () => {
	document.getElementById('counter').textContent = store.getState();
};

// подписка позволяет вызывать функцию, которая будет срабатывать каждый раз при изменении стейта внутри стора
store.subscribe(updateCounter);

document.getElementById('inc').addEventListener('click', () => {
	store.dispatch({ type: 'INC' });
});

document.getElementById('dec').addEventListener('click', () => {
	store.dispatch({ type: 'DEC' });
});

document.getElementById('rnd').addEventListener('click', () => {
	const value = Math.floor(Math.random() * 10);
	store.dispatch({ type: 'RND', payload: value });
});
```

![](_png/59b8e06e97f57749d1982d8beb20803e.png)

Отдельно нужно сказать, что так делать нельзя и выше было показано, что мы передали это значение через свойство `payload` (полезная нагрузка)

![](_png/866661b40865d1766a802050ac507f36.png)

И так же в ==Redux== используется `actionCreator` функция, которая генерирует экшены. Они используются для более безопасного применения редьюсера, чтобы он возвращает не стейт по дефолтному проходу, а ошибку, если мы передали неправильный объект

```JS
// actionCreater'ы, которые создают экшены для редьюсера
const inc = () => ({ type: 'INC' });
const dec = () => ({ type: 'DEC' });
const rnd = (value) => ({ type: 'RND', payload: value });

document.getElementById('inc').addEventListener('click', () => {
	store.dispatch(inc());
});

document.getElementById('dec').addEventListener('click', () => {
	store.dispatch(dec());
});

document.getElementById('rnd').addEventListener('click', () => {
	const value = Math.floor(Math.random() * 10);
	store.dispatch(rnd(value));
});
```

Но так же мы будем часто работать с данными в виде объекта, поэтому и писать придётся код соблюдая иммутабельность:
- переводим начальный стейт в объект
- меняем редьюсер на работу со стейтом по принципу иммутабельности (разворачиваем старый объект и добавляем новые данные)
- далее из стора нужно будет получить не целый объект, а одно значение `store.getState().value` 

```JS
// начальное состояние
const initialState = { value: 0 };

// функция изменения стейта
const reducer = (state = initialState, action) => {
	switch (action.type) {
		case 'INC':
			return { ...state, value: state.value + 1 };
		case 'DEC':
			return { ...state, value: state.value - 1 };
		case 'RND':
			return { ...state, value: state.value * action.payload };
		default:
			return state;
	}

	return 0;
};

// это стор, который хранит функцию-редьюсер и все стейты
const store = createStore(reducer);

const updateCounter = () => {
	document.getElementById('counter').textContent = store.getState().value;
};

// подписка позволяет вызывать функцию, которая будет срабатывать каждый раз при изменении стейта внутри стора
store.subscribe(updateCounter);

// actionCreater'ы, которые создают экшены для редьюсера
const inc = () => ({ type: 'INC' });
const dec = () => ({ type: 'DEC' });
const rnd = (value) => ({ type: 'RND', payload: value });

document.getElementById('inc').addEventListener('click', () => {
	store.dispatch(inc());
});

document.getElementById('dec').addEventListener('click', () => {
	store.dispatch(dec());
});

document.getElementById('rnd').addEventListener('click', () => {
	const value = Math.floor(Math.random() * 10);
	store.dispatch(rnd(value));
});
```

Итог: мы имеем каунтер построенный на базе отслеживания состояния через редакс даже без использования **React** на чистом **JS** 

![](_png/7b7c0276df02f1babc736f34b6b03bc6.png)











