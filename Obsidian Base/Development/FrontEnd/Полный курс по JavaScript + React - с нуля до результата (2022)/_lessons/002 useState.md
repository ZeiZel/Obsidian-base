
И далее представим два компонента, которые будут рендерить одну и ту же картинку, но будут иметь два разных подхода реализации: функциональный и классовый

Для построения функционального компонента нужно уже будет писать все состояния используя хуки. Конкретно в данном случае пригодиться `useState()`

`useState()` - это хук, который отвечает за управлением состояниями в приложении. Он возвращает массив из двух элементов: `[состояние, функцияУстановкиСостояния]`. Для установки нового состояния нельзя мутировать старое и поэтому в функцию нужно передавать стейт + новое изменённое значение

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

И далее мы имеем два одинаковых компонента на странице:
- классовый
- функциональный

![](_png/fcaeefb3dd0f3ba0d1c89c23dca9ecc7.png)

Вот как выглядит возврат `useState()`

![](_png/5cf27d4526f5e1ea62f4b94a621478ff.png)

Если мы попытаемся вызывать функцию установки нового состояния дважды просто через передачу внутрь аргумента, у нас сработают обе функции асинхронно. Это приведёт к тому, что значение состояния будет меняться ровно один раз, потому что оба аргумента (состояние) функции ссылаются на одно и то же значение

То есть тут произойдёт увеличение состояния `slide` ровно на 1

```JS
function changeSlide(i) {
	setSlide(slide + i);
	setSlide(slide + i);
}
```

![](_png/b032c8a38dc066d646a2cf0e0cc989b0.png)

Однако при таком подходе, когда мы изменяем состояние через колбэк-функцию, стейт будет меняться два раза подряд и при передаче аргумента `1` стейт увеличится на `2`

```JS
function changeSlide(i) {
	setSlide((slide) => slide + i);
	setSlide((slide) => slide + i);
}
```

![](_png/cf93c668bc8086b97e85923066f924de.png)

Так же мы можем вынести несколько состояний в одну переменную и хранить в ней объект с несколькими значениями.
Особенность заключается в том, что в отличие от классов объекты автоматически не складываются 
- `this.setState(({ slide }) => ({ slide: slide + i }))` - в классах будет работать и свойство `autoplay` не потеряется
- `setState((state) => ({ ...state, slide: state.slide + value }))` - нужно использовать в функциях деструктуризацию, потому что состояния в них иммутабельны и нужно вставлять полностью новые значения

```JS
const [state, setState] = useState({ slide: 0, autoplay: false });

function changeSlide(value) {
	setState((state) => ({ ...state, slide: state.slide + value }));
}

function toggleAutoplay() {
	setState((state) => ({ ...state, autoplay: !state.autoplay }));
}
```

Так же, если мы передадим в качестве начального значения состояния функцию, то она вызовется ровно один раз - при сборке компонента

![](_png/0a178fc6515456f6a0030f0b006cf281.png)

![](_png/5493037d7d53d47f80139a52217dfa6a.png)

Так же будет себя вести функция, если мы передадим колбэк-функцию

![](_png/298d5711f6eac3c0643512d8f6356553.png)

![](_png/7130d6093fc2269986cf7b3a8ebd739d.png)

Если функцию просто вызвать внутри установки стейта, то она будет вызваться каждый раз при перерендере 

![](_png/9fdf243f56af071c43d105bed6702e7f.png)

![](_png/0397b8bcd9479d8fa938e2a22a5dc46c.png)
