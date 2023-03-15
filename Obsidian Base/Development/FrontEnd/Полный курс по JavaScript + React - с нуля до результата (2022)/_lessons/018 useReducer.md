
`useReducer` - это функция, которая управляет ограниченным набором состояний. Она заменяет `useState` и позволяет нам предсказывать определённые наборы состояний компонента. 
Хук возвращает само состояние и функцию `dispatch`, которая вызывает изменение состояния.
`dispatch` принимает в себя объект с одним обязательным свойством `type`, которое хранит в себе тип операции

Хук принимает в себя три аргумента:
- Функцию-reducer, которая отвечает за изменение состояния
- Начальное состояние 
- Ленивое создание начального состояния



```JS
import { useReducer, useState } from 'react';
import { Container } from 'react-bootstrap';
import './App.css';

// это функция изменения состояния
const reducer = (state, action) => {
	switch (action.type) {
		case 'toggle':
			return { autoplay: !state.autoplay };
		case 'slow':
			return { autoplay: 300 };
		case 'fast':
			return { autoplay: 1500 };
		default:
			throw new Error('Reducer is not compatible');
			break;
	}
};

const Slider = (props) => {
	const [slide, setSlide] = useState(0);
	// const [autoplay, setAutoplay] = useState(false);

	// тут создаётся редьюсер и передаётся функция изменения состояния и начальное значение состояния
	// возвращается изначение состояния и функция вызова изменения состояния
	const [autoplay, dispatch] = useReducer(reducer, { autoplay: false });

	function changeSlide(i) {
		setSlide((slide) => slide + i);
	}

	return (
		<Container>
			<div className='slider w-50 m-auto'>
				<img
					className='d-block w-100'
					src='https://www.planetware.com/wpimages/2020/02/france-in-pictures-beautiful-places-to-photograph-eiffel-tower.jpg'
					alt='slide'
				/>
				<div className='text-center mt-5'>
					Active slide {slide} <br />
					{/* тут немного меняем условие, чтобы достучаться до булеана */}
					{autoplay.autoplay ? 'auto' : null}
				</div>
				<div className='buttons mt-3'>
					<button className='btn btn-primary me-2' onClick={() => changeSlide(-1)}>
						-1
					</button>
					<button className='btn btn-primary me-2' onClick={() => changeSlide(1)}>
						+1
					</button>
					<button
						className='btn btn-primary me-2'
						// тут вызвается dispatch-функция редьюсера
						onClick={() => dispatch({ type: 'toggle' })}
					>
						toggle autoplay
					</button>
					<button
						className='btn btn-primary me-2'
						// тут вызвается dispatch-функция редьюсера
						onClick={() => dispatch({ type: 'slow' })}
					>
						slow autoplay
					</button>
					<button
						className='btn btn-primary me-2'
						// тут вызвается dispatch-функция редьюсера
						onClick={() => dispatch({ type: 'fast' })}
					>
						fast autoplay
					</button>
				</div>
			</div>
		</Container>
	);
};

function App() {
	return <Slider />;
}

export default App;
```



![](_png/Pasted%20image%2020230315143400.png)










