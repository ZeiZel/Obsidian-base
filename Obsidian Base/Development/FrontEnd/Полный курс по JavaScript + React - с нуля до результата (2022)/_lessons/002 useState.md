




```JS
import { Component, useState } from 'react';
import { Container } from 'react-bootstrap';
import './App.css';

// классовая версия компонента
class SliderClass extends Component {
	constructor(props) {
		super(props);
		this.state = {
			autoplay: false,
			slide: 0,
		};
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

// функциональная версия компонента
const SliderFunction = (props) => {
	// первая возможная запись элемента состояния
	const slideStateArray = useState(0);
	console.log(slideStateArray);

	// вторая запись, которую мы сразу деструктурируем
	const [slide, setSlide] = useState(0);

	// так же можно вынести изменение состояния в отдельную функцию
	function changeSlide(i) {
		setSlide((slide) => slide + i);
	}

	const [autoplay, setAutoplay] = useState(false);

	function toggleAutoplay() {
		// так же функция изменения значения может выглядить таким образом
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
					<button
						className='btn btn-primary me-2'
						// изменяем состояние слайдера через внешнюю
						onClick={() => changeSlide(-1)}
					>
						-1
					</button>
					<button
						className='btn btn-primary me-2'
						// изменяем состояние слайдера через встроенную функцию
						onClick={() => setSlide(slide + 1)}
					>
						+1
					</button>
					<button 
						className='btn btn-primary me-2' 
						// изменяем состояние на обратное
						onClick={() => setAutoplay(!autoplay)}
					>
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



![](_png/Pasted%20image%2020230307164849.png)



```JS
function changeSlide(i) {
	setSlide(slide + i);
	setSlide(slide + i);
}
```

![](_png/Pasted%20image%2020230307183022.png)

Однако при таком подходе, когда мы изменяем состояние через колбэк-функцию, стейт будет меняться два раза подряд и при передаче аргумента `1` стейт увеличится на `2`

```JS
function changeSlide(i) {
	setSlide((slide) => slide + i);
	setSlide((slide) => slide + i);
}
```

![](_png/Pasted%20image%2020230307183409.png)








