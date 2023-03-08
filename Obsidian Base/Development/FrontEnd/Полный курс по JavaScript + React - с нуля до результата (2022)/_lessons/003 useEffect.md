
`useEffect()` - это хук, который выполняет эффекты на определённых этапах жизненного состояния компонента

Побочными действиями (эффектами) обычно являются:
- дозагрузка данных
- использования сторонних модулей
- запуск таймаутов
- логирование 
- изменение ДОМ-структуры

И далее нам нужно обновлять заголовок страницы в зависимости от состояния слайда

И тут показан пример использования хуков жизненного состояния `componentDidMount` и `componentDidUpdate` в классовом компоненте. Основная проблема такого подхода заключается в повторении кода.

И в функциональном компоненте эту же самую операцию выполняет одна функция `useEffect()`

```JS
import { Component, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import './App.css';

class SliderClass extends Component {
	constructor(props) {
		super(props);
		this.state = {
			autoplay: false,
			slide: 0,
		};
	}

	// при монтировании компонента, будет показываться элемент
	componentDidMount() {
		document.title = `Slide: ${this.state.slide}`;
	}

	// при обновлении компонента, будет показываться слайд
	componentDidUpdate() {
		document.title = `Slide: ${this.state.slide}`;
	}

	changeSlide = (i) => {
		this.setState(({ slide }) => ({
			slide: slide + i,
		}));
	};

	toggleAutoplay = () => {
		this.setState(({ autoplay }) => ({
			autoplay: !autoplay,
		}));
	};

	render() {
		return (
			<Container className='wrapper'>
				<div className='slider w-50 m-auto'>
					<img
						className='d-block w-100'
						src='https://www.planetware.com/wpimages/2020/02/france-in-pictures-beautiful-places-to-photograph-eiffel-tower.jpg'
						alt='slide'
					/>
					<div className='text-center mt-5'>
						Active slide {this.state.slide} <br /> {this.state.autoplay ? 'auto' : null}
					</div>
					<div className='buttons mt-3'>
						<button
							className='btn btn-primary me-2'
							onClick={() => this.changeSlide(-1)}
						>
							-1
						</button>
						<button
							className='btn btn-primary me-2'
							onClick={() => this.changeSlide(1)}
						>
							+1
						</button>
						<button className='btn btn-primary me-2' onClick={this.toggleAutoplay}>
							toggle autoplay
						</button>
					</div>
				</div>
			</Container>
		);
	}
}

const SliderFunction = (props) => {
	const [slide, setSlide] = useState(0);
	const [autoplay, setAutoplay] = useState(false);

	// и сейчас мы будем каждый раз вызывать перерендер данного элемента
	useEffect(() => {
		document.title = `Slide: ${slide}`;
	});

	function changeSlide(i) {
		setSlide((slide) => slide + i);
	}

	function toggleAutoplay() {
		setAutoplay((autoplay) => !autoplay);
	}

	return (
		<Container className='wrapper'>
			<div className='slider w-50 m-auto'>
				<img
					className='d-block w-100'
					src='https://www.planetware.com/wpimages/2020/02/france-in-pictures-beautiful-places-to-photograph-eiffel-tower.jpg'
					alt='slide'
				/>
				<div className='text-center mt-5'>
					Active slide {slide} <br /> {autoplay ? 'auto' : null}
				</div>
				<div className='buttons mt-3'>
					<button className='btn btn-primary me-2' onClick={() => changeSlide(-1)}>
						-1
					</button>
					<button className='btn btn-primary me-2' onClick={() => setSlide(slide + 1)}>
						+1
					</button>
					<button className='btn btn-primary me-2' onClick={toggleAutoplay}>
						toggle autoplay
					</button>
				</div>
			</div>
		</Container>
	);
};

function App() {
	return (
		<div>
			<SliderClass />
			<SliderFunction />
		</div>
	);
}

export default App;
```

И теперь оба компонента выполняют свои функции одинаково

![](_png/Pasted%20image%2020230308092343.png)

И так же нужно сказать про разные состояния работы хука `useEffect`

При такой записи эффект будет выполняться каждый раз при обновлении компонента

![](_png/Pasted%20image%2020230308095616.png)

При такой записи функция сработает ровно один раз 

![](_png/Pasted%20image%2020230308095646.png)



![](_png/Pasted%20image%2020230308095719.png)







