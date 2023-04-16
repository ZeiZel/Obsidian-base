
Подключить Redux к React можно двумя способами:
- функция `connect`, которая используется в классовых компонентах и в старых проектах 
- хук `useSelector`

[Преимущества и недостатки](https://www.samdawson.dev/article/react-redux-use-selector-vs-connect) использования хука:
- меньше бойлерплейта
- сложнее тестировать, чем обычный коннект
- проще в понимании
- может быть баг с [**"Зомби детьми"**](https://vadim-budarin.medium.com/react-%D0%BF%D0%BE%D0%BD%D1%8F%D1%82%D0%BD%D0%BE-%D0%BE-zombie-children-and-stale-props-d31247ea08)
- более корректен в плане написания кода, но менее производительный

Далее нужно реализовать контроль состояния в нашем каунтере

Для начала, можно перенести логику по генерации рандомного значения прямо в `actionCreator`-функцию 

`actions.js`
```JS
export const inc = () => ({ type: 'INC' });
export const dec = () => ({ type: 'DEC' });
export const rnd = () => ({ type: 'RND', payload: Math.floor(Math.random() * 10) });
```

Первым делом, нужно обернуть вывод компонента в функцию `connect`, получаемую из реакт-редакса. Передаётся функция во вторые скобочки (аргументы вложенного ретёрна). В первые скобки уже будут приниматься аргументы самого коннекта

Работает `connect` по следующей цепочке:
- внутри приложения какой-либо компонент задиспетчил (изменил стейт) какое-либо действие
-  глобальное состояние изменилось
- провайдер отлавливает изменение и даёт сигнал всем компонентам, которые находятся внутри
- дальше запускается `connect` от провайдера
- запускается функция `mapStateToProps`
- и если пропсы компонента поменялись, то весь компонент будет перерисован

И далее создадим две функции `mapStateToProps` и `mapDispatchToProps`, чтобы получить:
- из первой функции значение из стора
- с помощью второй функции сгенерировать три функции-диспэтча

`Counter.js`
```JS
import React from 'react';
import './counter.css';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';

const Counter = ({ counter, inc, dec, rnd }) => {
	return (
		<div className='wrapper'>
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

// эта функция будет вытаскивать нужные пропсы для нашего компонента и передавать их в него
// она принимает в себя глобальный стейт, который описан в index.js
const mapStateToProps = (state) => {
	// возвращает объект со свойствами, которые нужно вытащить из стейта
	return { counter: state.value };
};

// данная функция передаёт внутрь коннекта функции-диспетчи
const mapDispatchToProps = (dispatch) => {
	return bindActionCreators(actions, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

Функция коннекта принимает в себя 4 необязательных значения:
- `mapStateToProps` в виде функции, которая запросит данные из стейта
- `mapDispatchToProps` в виде функции, которая сгенерирует объект с диспетчами или в виде объекта (коннект сам распарсит объект и сделает из него нужные функции)
- `mergeProps` и `options` используются для оптимизации работы функции `connect`

```JS
function connect(mapStateToProps?, mapDispatchToProps?, mergeProps?, options?)
```

Функция `mapStateToProps` применяется для получения данных из стейта и используется внутри коннектора. Она должна быть чистой и синхронной, как функция-редьюсер

То есть функция будет получать данное начальное установленное значение

![](_png/1fa07a3b516072f4ab32e05d0707024d.png)

Функция `mapDispatchToProps` уже имеет предназначение формировать в себе нужные диспэтчи под определённые компоненты

Тут так же нужно сказать, что у нас есть 4 варианта реализации данной функции в зависимости от степени абстракции (первые три функции реализованы с учётом неизменённого `actionCreator`а вше):

```JS
import { inc, dec, rnd } from '../actions';

// данная функция передаёт внутрь коннекта функции-диспетчи
const mapDispatchToProps = (dispatch) => {
	return {
		inc: () => dispatch(inc()),
		dec: () => dispatch(dec()),
		rnd: () => {
			const value = Math.floor(Math.random() * 10);
			dispatch(rnd(value));
		},
	};
};

/// ИЛИ ...

import * as actions from '../actions';
import { bindActionCreators } from 'redux';

const mapDispatchToProps = (dispatch) => {
	const { inc, dec, rnd } = bindActionCreators(actions, dispatch);

	return {
		inc,
		dec,
		rnd: () => {
			const value = Math.floor(Math.random() * 10);
			rnd(value);
		},
	};
};

/// ИЛИ ...
import * as actions from '../actions';
import { bindActionCreators } from 'redux';

const mapDispatchToProps = (dispatch) => {
	const { inc, dec, rnd } = bindActionCreators(actions, dispatch);

	return {
		inc,
		dec,
		rnd,
	};
};

/// ИЛИ...
const mapDispatchToProps = (dispatch) => {
	return bindActionCreators(actions, dispatch);
};
```

Однако дальше нужно сказать, что вторым аргументом `connect` может получить не только функцию, где мы сами разбиваем `actionCreator'ы`, а просто передать объект, который уже функция коннекта сама разберёт

Однако такой подход работает только тогда, когда нам не нужно проводить дополнительные манипуляции над `actionCreator`ами

`Counter.js`
```JS
import * as actions from '../actions';

export default connect(mapStateToProps, actions)(Counter);
```

Итог: каунтер наконец-то работает

![](_png/e12d92fafa10e54a1c58754f22f60dbf.png)

Ну и так выглядит функция с использованием классового компонента:

![](_png/a49dd5e847f7e232cf59e1b30cf9b0ed.png)





