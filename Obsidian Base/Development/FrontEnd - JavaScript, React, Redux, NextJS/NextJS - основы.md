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
				<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin />
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


```bash
npm i sass
```

```JS
import styles from '../styles/Home.module.scss';
```

![|400](_png/Pasted%20image%2020221225181206.png)

## Создание своего API на next.js 







## getServerSideProps 







## getStaticProps







## getStaticPaths 







## Tailwind CSS







## Практика Next.js 







## У меня не получилась сборка проекта
