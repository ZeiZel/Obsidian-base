
Далее попробуем разбить приложение на отдельные файлы

Экшены вынесем в отдельный файл

`actions.js`
```JS
export const inc = () => ({ type: 'INC' });
export const dec = () => ({ type: 'DEC' });
export const rnd = (value) => ({ type: 'RND', payload: value });
```

Сам редьюсер уберём в другой файл

`reducer.js`
```JS
const initialState = { value: 0 };

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

export default reducer;
```

И далее основную логику приложения оптимизируем:
- деструктуризируем и достанем из стора повторяющиеся функции `dispatch`, `subscribe` и `getState`
- Ивентлистенеры повторяют одну и ту же вложенную функцию - вызывают экшен-функцию внутри `dispatch`. Это поведение можно оптимизировать и вынести в отдельную функцию-диспэтчер (`incDispatch` и так далее) 

`index.js`
```JS
import { createStore } from 'redux';
import reducer from './reducer';
import { dec, inc, rnd } from './actions';

const store = createStore(reducer);
const { dispatch, subscribe, getState } = store;

const updateCounter = () => {
	document.getElementById('counter').textContent = getState().value;
};

subscribe(updateCounter);

const incDispatch = () => dispatch(inc());
const decDispatch = () => dispatch(dec());
const rndDispatch = (value) => dispatch(rnd(value));

document.getElementById('inc').addEventListener('click', incDispatch);
document.getElementById('dec').addEventListener('click', decDispatch);
document.getElementById('rnd').addEventListener('click', () => {
	const value = Math.floor(Math.random() * 10);
	rndDispatch(value);
});
```

Однако очень часто разработчики для простоты использования кода создавали функцию `bindActionCreator`, которая возвращала уже сбинженную функцию диспэтча для вызова в других местах

`index.js`
```JS
const store = createStore(reducer);
const { dispatch, subscribe, getState } = store;

const updateCounter = () => {
	document.getElementById('counter').textContent = getState().value;
};

subscribe(updateCounter);

const bindActionCreator =
	(creator, dispatch) =>
	(...args) =>
		dispatch(creator(...args));

const incDispatch = bindActionCreator(inc, dispatch);
const decDispatch = bindActionCreator(dec, dispatch);
const rndDispatch = bindActionCreator(rnd, dispatch);

document.getElementById('inc').addEventListener('click', incDispatch);
document.getElementById('dec').addEventListener('click', decDispatch);
document.getElementById('rnd').addEventListener('click', () => {
	const value = Math.floor(Math.random() * 10);
	rndDispatch(value);
});
```

Однако в редаксе уже есть подобная функция `bindActionCreators`, которая за нас создаёт подобный связыватель

`index.js`
```JS
import { createStore, bindActionCreators } from 'redux';

const incDispatch = bindActionCreators(inc, dispatch);
const decDispatch = bindActionCreators(dec, dispatch);
const rndDispatch = bindActionCreators(rnd, dispatch);
```

Так же мы можем сделать привязку нескольких функций через одну функцию `bindActionCreators`, но уже через объект

`index.js`
```JS
const { incDispatch, decDispatch, rndDispatch } = bindActionCreators(
	{
		incDispatch: inc,
		decDispatch: dec,
		rndDispatch: rnd,
	},
	dispatch,
);

document.getElementById('inc').addEventListener('click', incDispatch);
document.getElementById('dec').addEventListener('click', decDispatch);
document.getElementById('rnd').addEventListener('click', () => {
	const value = Math.floor(Math.random() * 10);
	rndDispatch(value);
});
```

Можно ещё сильнее сократить запись, если импортировать не все именованные импорты по отдельность, а импортировать целый объект и его вложить первым аргументом

`index.js`
```JS
// import { dec, inc, rnd } from './actions';
import * as actions from './actions';

const { inc, dec, rnd } = bindActionCreators(actions, dispatch);
```

![](_png/b9acfef5b2151f52493c0eb34a8d5b05.png)