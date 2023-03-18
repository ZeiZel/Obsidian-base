
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
const rndDispatch = () => dispatch(rnd(value));

document.getElementById('inc').addEventListener('click', incDispatch);
document.getElementById('dec').addEventListener('click', decDispatch);
document.getElementById('rnd').addEventListener('click', () => {
	const value = Math.floor(Math.random() * 10);
	rndDispatch(value);
});
```






