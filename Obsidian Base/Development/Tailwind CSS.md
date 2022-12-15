##### [Документация](https://tailwindcss.com/docs/installation)

## Установка Tailwind 

Первым делом нам нужно установить пакет фронт-энд приложения 

```bash
npx create-react-app my-project
cd my-project
```

Далее нужно установить сами модули и инициализировать конфигурацию тэилвинда

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Начальный конфиг выглядит примерно таким образом

`tailwind.config.js`
```JS
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [],
};
```

И эти строки нужно будет вставить в основной файл стилей

`index.css`
```SCSS
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Расширение Tailwind VS code 



![](_png/Pasted%20image%2020221215191401.png)


![](_png/Pasted%20image%2020221215191329.png)


![](_png/Pasted%20image%2020221215191650.png)

Идентифицируем файл как тэилвиндовский

![](_png/Pasted%20image%2020221215192327.png)


## Отступы (margin, padding, borders) 


`m-10`
`mx-10`
`my-10`
`m-auto`/ `mx-auto` /`my-auto` 

`-m-10`
`-mx-10`
`-my-10`

`p-10`
`px-10`
`py-10`
`p-auto`/ `px-auto` /`py-auto` 

`-p-10`
`-px-10`
`-py-10`

```JSX
function App() {
	return (
		<div className='App'>
			<h1 className="m-10">Tailwind CSS</h1>
			<button className='mx-10'>Login</button>
		</div>
	);
}
```

`border` - создаст границу толщиной 1 пиксель
`border-цвет-насыщенность` - создаст рамку определённого цвета
`rounded-модификатор` - скруглит рамку

![](_png/Pasted%20image%2020221215193015.png)



## Шрифт (размер, цвет, жирность) 


`text-xl` - этим классом можно определять жирность текста (от `xl` до `4xl`)
`font-bold` - жирный текст
`text-center` - центрирование текста
`text-цвет-насыщенность` - изменение цвета текста

![](_png/Pasted%20image%2020221215193604.png)





## Ширина, высота 

`w-число`
`w-screen` - `width: 100vw`
`w-full` - `width: 100%`

`h-число`
`h-screen` - `height: 100vw`
`h-full` - `height: 100%`



## hover, focus, before, after... 








## Transition 








## Анимации 








## Адаптация - медиа запросы








## Темный режим 








## @apply и module.scss 








## Пример на верстке формы авторизации 








## Tailwind Config 








## Плагины 








## Компонент кнопки 








## Кастомная утилита








## Нововведения в 3 версии







