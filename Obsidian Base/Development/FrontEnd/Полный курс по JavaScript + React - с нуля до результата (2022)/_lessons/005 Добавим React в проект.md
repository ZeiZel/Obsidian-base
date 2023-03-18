
Сначала выделим компонент счётчика в отдельный реакт-компонент

`Counter.js`
```JS
import React from 'react';
import './counter.css';

const Counter = ({ counter, inc, dec, rnd }) => {
	const styles = {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		width: '99vh',
		height: '99vh',
	};

	return (
		<div style={styles}>
			<h1>{counter}</h1>
			<button className='btn' onClick={dec}>
				DEC
			</button>
			<button className='btn' onClick={inc}>
				INC
			</button>
			<button className='btn' onClick={rnd}>
				RND
			</button>
		</div>
	);
};

export default Counter;
```

Далее передадим все функции, которые нужны для работы компонента и обернём рендер реакт-компонента в функцию `update`, которая будет вызваться через `subscribe`, когда у нас обновится значение в редаксе

*Тут нужно отметить, что такой подход не используется в реальных проектах*

`index.js`
```JS
const store = createStore(reducer);
const { dispatch, subscribe, getState } = store;
const { inc, dec, rnd } = bindActionCreators(actions, dispatch);

const root = ReactDOM.createRoot(document.getElementById('root'));

const update = () => {
	root.render(
		<React.StrictMode>
			<Counter
				counter={getState().value}
				dec={dec}
				inc={inc}
				rnd={() => {
					const value = Math.floor(Math.random() * 10);
					rnd(value);
				}}
			/>
		</React.StrictMode>,
	);
};

update();

subscribe(update);
```

И счётчик работает

![](_png/Pasted%20image%2020230318171707.png)

И сейчас подготовим проект для того, чтобы он мог работать вместе с редаксом:

Первым делом нужно убрать все импорты и экспорты разных функций и экшенов. Единственное, что нам нужно - это создать глобальное хранилище `createStore` и закинуть в него `reducer`. Далее нам нужно вложить все компоненты приложения в `Provider`, который отслеживает все изменения стора и распространяет данные по приложению. В провайдер нужно передать будет и сам `store`

Тут нужно упомянуть, что провайдер сам отслеживает изменения и сам сигнализирует компонентам, что данные были изменены

`index.js`
```JS
import React from 'react';
import ReactDOM from 'react-dom/client';

import { createStore, bindActionCreators } from 'redux';
import { Provider } from 'react-redux';

import reducer from './reducer';
import App from './components/App';
import './index.css';

// глобальное хранилище
const store = createStore(reducer);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</React.StrictMode>,
);
```

И далее нужно просто вызвать компонент счётчика внутри `App`

`components > App.js`
```JS
import React from 'react';
import Counter from './Counter';

const App = () => {
	return <Counter />;
};

export default App;
```

> Далее, чтобы приложение заработало, нужно будет с помощью `connect` распространить данные по всем компонентам приложения. Это позволит прокинуть в `Counter` нужные функции и данные для работы со счётчиком. Пока же компонент не работает без данных манипуляций.