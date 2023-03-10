
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



![](_png/Pasted%20image%2020230310080546.png)



