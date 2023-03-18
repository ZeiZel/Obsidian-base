




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



![](_png/Pasted%20image%2020230318171707.png)











