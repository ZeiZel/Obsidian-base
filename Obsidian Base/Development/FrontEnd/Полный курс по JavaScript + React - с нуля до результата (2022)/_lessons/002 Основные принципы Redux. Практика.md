


```bash
npm i redux react-redux
```




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

// глобальный стейт
const state = reducer(initialState, { type: 'INC' });

console.log('State after reducer = ' + state);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<div></div>
	</React.StrictMode>
);
```

![](_png/Pasted%20image%2020230318112333.png)








