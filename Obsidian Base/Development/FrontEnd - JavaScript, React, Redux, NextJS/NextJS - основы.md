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
    res.status(200).json(cards.find(card => card.id === req.query.id));  
}
```

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





## Tailwind CSS







## Практика Next.js 







## У меня не получилась сборка проекта
