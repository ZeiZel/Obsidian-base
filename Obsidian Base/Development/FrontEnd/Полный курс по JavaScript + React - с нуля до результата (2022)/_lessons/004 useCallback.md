
Представим такую ситуацию: нам нужно получать изображения со стороннего ресурса

```JS
// функция получения изображений (вне компонента)
const getSomeImg = () => {
	console.log('fetching');

	return [
		'https://www.planetware.com/i/home-promo-italy.jpg',
		'https://www.planetware.com/wpimages/2023/02/scotland-isle-of-arran-top-things-to-do-intro-paragraph-goat-fell.jpg',
	];
};

// return компонента
return (
	<Container className='wrapper'>
		<div className='slider w-50 m-auto'>
			
			// формируем массив изображений 
			{getSomeImg().map((url, i) => (
				<img key={i} className='d-block w-100' src={url} alt='slide' />
			))}
			
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
```

Но теперь перед нами встаёт проблема, что после каждого изменения стейта, у нас вызывается функция отправки запроса на сервер 

![](_png/Pasted%20image%2020230310075539.png)

И тут на помощь к нам приходит хук `useCallback()`. Он принимает в себя функцию и мемоизирует её ответ. Функция будет возвращать новое значение только после того, как у нас поменяется значение.

![](_png/Pasted%20image%2020230310080546.png)

Чтобы правильно воспользоваться функцией, нужно создать новый компонент, который будет иметь своё состояние. Внутри неё нужно и отображать те изменения, данные для которых возвращает `useCallback()`. 

Конкретно тут мы через `useCallback` реализовали возврат новой ссылки на функцию, если изменится состояние слайда (если слайд не будет меняться, то ссылаться хук будет на старую версию функции, которая закеширована) 

```JS
const SliderFunction = (props) => {
	const [slide, setSlide] = useState(0);

	useEffect(() => {
		document.title = `Slide: ${slide}`;
	}, [slide]);

	// чтобы закешировать выполнение функции, нужно обернуть его в хук
	const getSomeImg = useCallback(() => {
		console.log('fetching');

		return [
			'https://www.planetware.com/i/home-promo-italy.jpg',
			'https://www.planetware.com/wpimages/2023/02/scotland-isle-of-arran-top-things-to-do-intro-paragraph-goat-fell.jpg',
		];
	}, [slide]);

	const [autoplay, setAutoplay] = useState(false);

	function changeSlide(i) {
		setSlide((slide) => slide + i);
	}

	function toggleAutoplay() {
		setAutoplay((autoplay) => !autoplay);
	}

	return (
		<Container className='wrapper'>
			<div className='slider w-50 m-auto'>
			
				{/* тут уже просто вызываем наш компонент слайдов */}
				<Slide getSomeImg={getSomeImg} />

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

// компонент отдельного слайда
const Slide = ({ getSomeImg }) => {
	const [images, setImages] = useState([]);

	useEffect(() => {
		setImages(getSomeImg());
	}, [getSomeImg]);

	return (
		<div>
			{images.map((url, i) => (
				<img key={i} className='d-block w-100' src={url} alt='slide' />
			))}
		</div>
	);
};
```

И теперь каждый раз мы будем вызвать мемоизированную функцию. При перезагрузке страницы те изображения, которые возвращает функция, будут закешированы в браузере. 

![](_png/Pasted%20image%2020230310083405.png)