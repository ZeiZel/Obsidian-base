
SEO - Search Engine Optimization - это отрасль оптимизации поисковых запросов за счёт выполнения сайтом определённых требований  

Основные показатели, влияющие на СЕО положительно:
- Валидность вёрстки
- Использования семантической вёрстки и валидность тегов
- Скорость загрузки
- Заполнены для каждой страницы правильно метатеги и тайтл (они будут отображаться в поиске), а так же использование OG-тегов

Основной проблемой современных SPA является то, что они не отображают никакого контента, даже когда на них зайдёт робот (он видит только пустой `div`), что приводит к снижению СЕО-оптимизации.

Обычно, чтобы бороться с такой проблемой, используют фреймворки с SSR (рендерингом страницы на стороне сервера), который сразу отдаёт отрендеренную страницу любому пользователю или роботу. Самый популярный из имеющихся - NextJS. Он хранит в себе все возможности для оптимизации страницы (сам конвертирует изображения, предоставляет роутинг, рендеринг на сервере, общение с сервером через пропсы и даёт настроить метатеги на всех страницах)

Однако подход с SSR требует много вычислительных ресурсов, что приводит к сильной нагрузке на сервера. Поэтому обычно используется пререндеринг страницы через тот же `react-snap`, который будет отдавать боту готовую страницу  

Чтобы настроить метатеги на странице можно воспользоваться модулем `react-helmet`, который будет работать как на клиенте, так и на сервере

```bash
npm i react-helmet
```

Добавление мета-тегов на страницу выглядит просто: 
- Добавляем тег `Helmet` в компонент
- Внутрь него вставляем нужные мета-теги либо можем передавать их в качестве атрибутов компонента

![](_png/Pasted%20image%2020230317160806.png)

Вставим мету на страницу со списком комиксов

`components > pages > ComicsPage.js`
```JS
import ComicsList from '../comicsList/ComicsList';
import AppBanner from '../appBanner/AppBanner';
import { Helmet } from 'react-helmet';

const ComicsPage = () => {
	return (
		<>
			<Helmet>
				<meta name={'description'} content={'Comics Marvel'} />
				<title>Marvel comics</title>
			</Helmet>
			<AppBanner />
			<ComicsList />
		</>
	);
};

export default ComicsPage;
```

Вставим мету на страницу комиксов

`components > pages > SingleComicLayout.js`
```JS
const SingleComicLayout = ({ data }) => {
	const { title, description, pageCount, thumbnail, language, price } = data;

	return (
		<div className='single-comic'>
			<Helmet>
				<meta name={'description'} content={`${title} comics``} />
				<title>{title}</title>
			</Helmet>
			<img src={thumbnail} alt={title} className='single-comic__img' />
			<div className='single-comic__info'>
				<h2 className='single-comic__name'>{title}</h2>
				<p className='single-comic__descr'>{description}</p>
				<p className='single-comic__descr'>{pageCount}</p>
				<p className='single-comic__descr'>Language: {language}</p>
				<div className='single-comic__price'>{price}</div>
			</div>
			<Link to='/comics' className='single-comic__back'>
				Back to all
			</Link>
		</div>
	);
};
```

Вставим мету на страницу персонажей

`components > pages > SingleCharacterLayout.js`
```JS
const SingleCharacterLayout = ({ data }) => {
	const { name, description, thumbnail } = data;

	return (
		<div className='single-comic'>
			<Helmet>
				<meta name={'description'} content={description} />
				<title>{name}</title>
			</Helmet>
			<img src={thumbnail} alt={name} className='single-comic__char-img' />
			<div className='single-comic__info'>
				<h2 className='single-comic__name'>{name}</h2>
				<p className='single-comic__descr'>{description}</p>
			</div>
		</div>
	);
};
```

И так же можно убрать мета-теги из хтмлки

`index.html`
```HTML
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

И теперь на всех страницах имеются свои мета-теги

![](_png/Pasted%20image%2020230317160404.png)
