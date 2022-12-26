#NextJS #React #FrontEnd #Framework 

## Что такое Next.js? 

==NextJS== - это фреймворк, построенный на базе React, который генерирует код заранее на сервере, чтобы отобразить его пользователю. Так же он правит сео-оптимизацию.

## Преимущества 

- Тег `<Img>`, в который некст принимает изображение и на выходе генерирует оптимизированное изображение
- Удобный роутинг с хранением всех страниц в одной папке и лёгким перемещением через тег `<Link>`
- SSR и SSG генерации
- Так же можно поднять серверное API внутри маленького проекта
- Контроль мета-тегов через компонент `<HEAD>`

## Установка проекта 

```bash
npx create-next-app@latest
```

## Разбор структуры 

- `pages` - папка с API проекта и его страницами
- `public` - папка с ресурсами проекта
- `styles` - стили проекта

![](_png/Pasted%20image%2020221224200400.png)

## Проект, который будем делать

![](_png/Pasted%20image%2020221224200143.png)

## Роутинг 

Первым делом можно отметить возможность создания динамических страниц. В страницу подкладывается переменная для генерации её под определённый подставленный объект.
Шаблон записывается в `[]` скобочках

![](_png/Pasted%20image%2020221224200801.png)

Пропсы компонент `App` получает из кастомного документа `_document.jsx`, который можно создать для определения метаданных наших страниц

`_app.js`
```JSX
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
```

## Компонент Head 

Для создания `Head` под каждую страницу, можно выделить компонент, который будет сохранять в себе метаданные

Примерно в этом месте мы можем реализовать все сторонние компоненты и дополнения для системы

![](_png/Pasted%20image%2020221225175250.png)

Это сам компонент метаданных в приложении

`meta.jsx`
```JSX
import Head from 'next/head';

const Meta = ({ title, description }) => {
	return (
		<Head>
			<title>{title}</title>
			<meta name='description' content={description} />
		</Head>
	);
};

export default Meta;
```

И так применяем в приложении

```JSX
export default function Home() {
	return (
		<>
			<Meta title='Главная' description='Описание страницы' />

			{ /// CODE ... }
		</>
	);
}
```

![](_png/Pasted%20image%2020221225174943.png)

## Кастомный document.js

Создаём в качестве страниц наше представление документа. Оно показывает, в каком порядке будут располагаться элементы на странице

![](_png/Pasted%20image%2020221225180801.png)

Здесь сначала располагается начальная структура документа, а уже затем можно добавлять остальные элементы страницы (те же шрифты)

`_document.js`
```JSX
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang='en'>
			<Head>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin="true" />
				<link
					href='https://fonts.googleapis.com/css2?family=Sevillana&display=swap'
					rel='stylesheet'
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
```

И так же поменяем шрифт на странице в глобальных стилях

```CSS
:root {
	--max-width: 1100px;
	--border-radius: 12px;
	--font-mono: Sevillana, monospace;

	/* CODE ... */
}
```

![](_png/Pasted%20image%2020221225180522.png)

## Установка SCSS 

Просто устанавливаем модуль сасс

```bash
npm i sass
```

Переименовываем файлы в `scss`

![|400](_png/Pasted%20image%2020221225181206.png)

И далее меняем импорты

```JS
import styles from '../styles/Home.module.scss';
```

## Создание своего API на next.js 


![](_png/Pasted%20image%2020221225192726.png)


`data.js`
```JS
export const cards = [
    {
        _id: "first-card",
        balance: 44_834_342,
        number: "4568 6456 7875 6567",
        color: "Black",
    },
    {
        _id: "second-card",
        balance: 44_834,
        number: "4567 3456 9875 4567",
        color: "0095FF",
    }
];
```

Это общий запрос, который выполняется при запросе без определённого `id` карточки

`index.js`
```JS
import {cards} from "../../../app/data";  
  
export default function handler(req, res) {  
    res.status(200).json(cards);  
}
```

Сейчас мы можем себе позволить проверить получаемый `id` карточки

`[id].js`
```JS
import {cards} from "../../../app/data";  
  
export default function handler(req, res) {  
    console.log(req.query.id)  
  
    res.status(200).json(cards);  
}
```

В ответе мы получаем:

```md
// Ссылка на запрос
http://localhost:3000/api/cards

// ответ от сервера
[{"_id":"first-card","balance":44834342,"number":"4568 6456 7875 6567","color":"Black"},{"_id":"second-card","balance":44834,"number":"4567 3456 9875 4567","color":"0095FF"}]
```

В логе мы получаем: 

![](_png/Pasted%20image%2020221225191340.png)

И вот так будет выглядеть выполняемый запрос при вводе карточки. Он будет возвращать только данные по карточке

`[id].js`
```JS
import {cards} from "../../../app/data";  
  
export default function handler(req, res) {  
    res.status(200).json(cards.find(card => card._id === req.query.id));  
}
```

![](_png/Pasted%20image%2020221225202102.png)

## getServerSideProps 

Мы можем получать через `getServerSideProps` свойства с сервера, чтобы применять их у себя на странице. Это не самый эффективный вариант для работы приложения, так как на каждый запрос пользователя будет напрягаться сервер. 
Более актуальным вариантом взаимодействия с сервером является `getStaticProps`

```JSX
export default function Home({cards}) {

	console.log(cards) // выводим карточки в консоль

	return (
		<>
			{ /// CODE ... }
		</>
	);
}

// получение пропсов с сервера
export const getServerSideProps = async () => {
	const response = await fetch('http://localhost:3000/api/cards');
	const cards = await response.json();

	return {
		props: {
			cards
		}
	};
}
```

![](_png/Pasted%20image%2020221225194445.png)

## getStaticProps

Уже `getStaticProps` подгружает данные для клиента при загрузке страницы ровно один раз и выдаёт ему уже сформированные данные.

## getStaticPaths 

Вкупе с методом выше так же используют `getStaticPaths`, который подгружает пути данных  

Вот так выглядит структура:
![](_png/Pasted%20image%2020221225202548.png)

Первым делом заменим в индексе `getServerSideProps` на `getStaticProps` и добавим параметр `revalidate`, чтобы производить валидацю данных

`index.js`
```JSX
export const getStaticProps = async () => {
	const response = await fetch('http://localhost:3000/api/cards');
	const cards = await response.json();

	return {
		props: {
			cards
		},
		revalidate: 10
	};
}
```

И теперь создадим страницу, которая будет генерироваться на основании переданных нами данных. 
То есть по запросу `id`, который будет возвращать определённую карту, будет выводиться страница, которая выведет данную карту

`[id].jsx`
```JSX
import React from 'react';

const Card = ({card}) => {
    return (
        <div>
            {card.number}
        </div>
    );
};

export const getStaticPaths = async () => {
    const response = await fetch('http://localhost:3000/api/cards');
    const cards = await response.json();

    const paths = cards.map(c => ({params: {id: c._id}}))

    return {paths, fallback: "blocking"}
}

export const getStaticProps = async ({params}) => {
    const response = await fetch(`http://localhost:3000/api/cards/${params.id}`);
    const card = await response.json();

    return {
        props: {
            card
        },
        revalidate: 10
    };
}

export default Card;
```

И теперь по запросу `http://localhost:3000/card/first-card` минуя `api` мы можем получить интересующие нас данные

![](_png/Pasted%20image%2020221225202345.png)

## Tailwind CSS


```bash
npm i -D tailwindcss postcss autoprefixer

npx tailwindcss init -p
```

`tailwind.config.js`
```JS
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`globals.scss`
```SCSS
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Практика Next.js 

Так выглядит структура:

![](_png/Pasted%20image%2020221226104347.png)

Это компонент отдельной карточки. Тут используются:
- Стили как через `className`, так и через `style`
- Тег некста `<Link>`
- Тег некста `<Image>`

`app > cards > CardItem.jsx`
```JSX
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const CardItem = ({ card }) => {
	return (
		// тут находится вся наша карточка
		<div
			className="w-5/6 mx-auto rounded-xl p-5 mb-3 text-white overflow-hidden bg-sky-700"
			style={{
				background: card.color,
			}}
		>
			{/* а тут всю карточку делаем ссылкой */}
			{/* тут используется тег некста - Link */}
			<Link href={`/card/${card.id}`}>
				{/* Это уже тег некста - Image, который позволяет нам вставить нормально изображение. Так же некст сам преобразует нужным образом изображение */}
				<Image
					src={
						'https://www.seekpng.com/png/detail/136-1366968_mastercard-download-png-mastercard-credit-card-png.png'
					}
					alt="Mastercard Download Png - Mastercard Credit Card Png@seekpng.com"
					width={40}
					height={30}
				/>

				<div
					className="mt-6 mb-1 opacity-50"
					style={{
						fontSize: 11,
					}}
				>
					Current Balance
				</div>
				<div>
					{/* Эта настройка преобразует полученное число в денежную валюту - рубли */}
					{card.balance.toLocaleString('ru-Ru', {
						currency: 'RUB',
						style: 'currency',
					})}
				</div>

				<div className="mt-6 text-xs">{card.number}</div>
			</Link>
		</div>
	);
};

export default CardItem;
```

Тут уже мы будем выводить страницу по переходу на отдельную определённую карточку по клику

`pages > card > [id].jsx`
```JSX
import Link from 'next/link';
import React from 'react';
import CardItem from '../../app/cards/CardItem';

const Card = ({ card }) => {
	return (
		<div>
			<Meta title={`Карточка ${card._id}`} description="" />

			<main className="w-1/2 mx-auto mt-10">
				<CardItem card={card} />
			</main>

			<Link href="/">
				<p>Back home</p>
			</Link>
		</div>
	);
};

export const getStaticPaths = async () => {
	const response = await fetch('http://localhost:3000/api/cards');
	const cards = await response.json();

	const paths = cards.map((c) => ({ params: { id: c._id } }));

	return { paths, fallback: 'blocking' };
};

export const getStaticProps = async ({ params }) => {
	const response = await fetch(`http://localhost:3000/api/cards/${params.id}`);
	const card = await response.json();

	return {
		props: {
			card,
		},
		revalidate: 10,
	};
};

export default Card;
```

Чтобы мы могли загружать с помощью тега `<Image>` изображения со сторонних ресурсов, нужно добавить их в домены внутри конфига
*Чтобы увидеть изменения на сайте при изменениях в конфиге, нужно перезапустить сборку в консоли*

`next.config.js`
```JS
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['www.seekpng.com'],
  },
}

module.exports = nextConfig
```

Тут мы выводим все наши карты на страницу из массива переданных карт в компонент `Home`

`pages > index.js`
```JSX
export default function Home({ cards }) {
	return (
		<>
			<Meta title="Главная" description="Описание страницы" />

			<main className="w-1/2 mx-auto mt-10">
				{cards.map((card) => (
					<CardItem key={card._id} card={card} />
				))}
			</main>
		</>
	);
}

export const getStaticProps = async () => {
	const response = await fetch('http://localhost:3000/api/cards');
	const cards = await response.json();

	return {
		props: {
			cards,
		},
		revalidate: 10,
	};
};

```


И вот так будет выглядеть итоговая страница:
- Выводятся все карточки, которые добавим в `data.js`
- Переход по карточкам работать не будет (для этого нужно пилить отдельно бэк)

![](_png/Pasted%20image%2020221226104211.png)