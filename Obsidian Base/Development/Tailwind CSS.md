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

![](_png/Pasted%20image%2020221215195516.png)

## hover, focus, before, after... 

`bg-purple-500` - так же мы можем укзывать цвета для `bg`
`bg-opacity-60` - и непрозрачность тоже

- `hover:конечный-итог` - действие, которое должно происходить при наведении
`hover:bg-opacity-100`
- `hover/focus/before/after:конечный-итог` - так же со всеми остальными элементами

![](_png/Pasted%20image%2020221215195830.png)
![](_png/Pasted%20image%2020221215195831.png)

```JSX
function App() {
	return (
		<div className='App border border-emerald-600 rounded-md m-10 p-4'>
			<h1 className='text-4xl font-bold text-center text-gray-600'>
				Hello Tailwind CSS
			</h1>
			<button 
				className='block mt-10 mx-auto px-4 py-2 
				bg-purple-500 bg-opacity-60 rounded-lg 
				hover:bg-opacity-100'
			>
				Login
			</button>
		</div>
	);
}
```


## Transition 

`transition`
`transition-[colors/opacity/shadow/transform]`
`transition-all`

`delay-[число]` - задержка анимации

`ease-in-out` - тип анимации

![](_png/Pasted%20image%2020221220161739.png)



## Анимации 


`animate-[анимация]`
`animate-spin`

![](_png/Pasted%20image%2020221220162015.png)


## Адаптация - медиа запросы



```JSX
<div className='App border border-emerald-600 rounded-md m-10 p-4'>
	<h1 className='text-4xl font-bold text-center text-gray-600'>Hello Tailwind CSS</h1>
	<button className='block mt-10 mx-auto px-4 py-2 bg-green-500 bg-opacity-60 rounded-lg md:bg-purple-500'>
		Login
	</button>
</div>
```

![](_png/Pasted%20image%2020221220162335.png)

![](_png/Pasted%20image%2020221220162341.png)




## Темный режим 


`dark:[какое-то свойство]` - применит определённые настройки, если на ПК установлена тёмная тема

![](_png/Pasted%20image%2020221220162517.png)


## @apply и module.scss 




`App.js`
```JSX
import styles from './App.module.scss';

function App() {
	return (
		<div className={`App ${styles.parent}`}>
			<h1 className={styles.heading}>Hello Tailwind CSS</h1>
			<button className={styles.button}>Login</button>
		</div>
	);
}

export default App;
```



`App.module.scss`
```SCSS
.parent {
	@apply border border-emerald-600 rounded-md m-10 p-4;

	.heading {
		@apply text-4xl font-bold text-center text-gray-600;
	}

	.button {
		@apply block mt-10 mx-auto px-4 py-2 bg-green-500 bg-opacity-60 rounded-lg md:bg-purple-500 dark:bg-rose-500 transition-all;

		&:hover {
			@apply bg-green-900;
		}
	}
}
```


## Пример на верстке формы авторизации 



`App.js`
```JSX
import { useState } from 'react';
import styles from './App.module.scss';

function App() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	return (
		<div className={`App ${styles.parent}`}>
			<h1 className={styles.heading}>Hello Tailwind CSS</h1>
			<div>
				<input
					className={styles.input}
					placeholder='Login'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<input
					className={styles.input}
					placeholder='Password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<button className={styles.button}>Login</button>
			</div>
		</div>
	);
}

export default App;
```


`App.module.scss`
```SCSS
.parent {
	@apply mx-auto mt-0 w-80;

	.heading {
		@apply text-2xl font-bold text-center text-white my-6;
	}

	> div {
		@apply shadow-2xl rounded-sm overflow-hidden;

		.input {
			@apply block w-full py-3 px-4 bg-white bg-opacity-10 border-r-2 border-transparent placeholder:text-slate-500 outline-none text-slate-50 transition-all;

			&:focus {
				@apply border-slate-400;
			}
		}

		.button {
			@apply block w-full py-2.5 bg-orange-500 text-white transition-all font-bold text-lg;

			&:hover {
				@apply bg-orange-600;
			}
		}
	}
}
```

![](_png/Pasted%20image%2020221220185019.png)


## Tailwind Config 

Первым делом, мы можем указать значения в `theme`, которые должны присутствовать в нашем проекте. Если мы начнём их указывать прямо в теме, то других значений этой группы присутствовать больше не будет

```JS
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	// если будем писать прямо тут, то мы заменяем функционал
	theme: {
		// заменяем все цвета на подставленные
		colors: {
			primary: 'red',
		},
		extend: {},
	},
	plugins: [],
};
```

![](_png/Pasted%20image%2020221220190011.png)

Однако, если писать не просто в темы, а в `extend`, то все дефолтные значения останутся

```JS
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],

	theme: {
		// расширяем функционал
		extend: {
			colors: {
				primary: 'red',
			},
			spacing: {
				0.5: '0.12rem',
			},
		},
	},
	plugins: [],
};
```

![](_png/Pasted%20image%2020221220190213.png)

Так же мы можем заменять дефолтные значения на свои, прописав это значение и поменяв свойство `DEFAULT`

```JS
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],

	theme: {
		extend: {
			transitionTimingFunction: {
				DEFAULT: 'ease-in-out',
			},
			transitionDuration: {
				DEFAULT: '400ms',
			},
		},
	},
	plugins: [],
};
```
![](_png/Pasted%20image%2020221220190954.png)

А уже таким образом мы можем добавлять шаблоны для наших значений

```JS
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],

	theme: {
		extend: {
			transitionTimingFunction: {
				DEFAULT: 'ease-in-out',
			},
			transitionDuration: {
				DEFAULT: '400ms',
			},
			// значение по точкам
			keyframes: {
				// название шаблона
				fadeIn: {
					from: {
						opacity: 0,
					},
					to: {
						opacity: 1,
					},
				},
			},
			// тут уже добавим к группе animation ...
			animation: {
				// ... новое значение fade
				fade: 'fadeIn 0.5s ease-in-out'
			}
		},
	},
	plugins: [],
};
```
![](_png/Pasted%20image%2020221220192254.png)



```JS
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],

	theme: {
		extend: {
			zIndex: {
				1: '1',
				2: '2',
			},
		},
	},
	plugins: [],
};
```


## Плагины 


```bash
npm i -D @tailwindcss/typography
```

```JS
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [require('@tailwindcss/typography')],
};
```

```HTML
<article class='prose lg:prose-xl'>
	<h1>Garlic bread with cheese: What the science tells us</h1>
	<p>
		For years parents have espoused the health benefits of eating garlic bread with cheese to
		their children, with the food earning such an iconic status in our culture that kids will
		often dress up as warm, cheesy loaf for Halloween.
	</p>
	<p>
		But a recent study shows that the celebrated appetizer may be linked to a series of rabies
		cases springing up around the country.
	</p>
</article>
```



## Компонент кнопки 



```JS
/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [
		plugin(({ addComponents, theme, addUtilities }) => {
			// тут мы инициализируем компонент
			addComponents({
				'.btn-primary': {
					// пишем стили
					// тут мы берём стили из tailwind
					backgroundColor: theme('colors.orange.500'),

					// а тут пишем стили самостоятельно
					color: 'white',
					padding: '10px 0',
					display: 'block',
					width: '100%',
					fontSize: 18,
					fontWeight: 'bold',

					// это стиль-псевдокласс
					'&:hover': {
						backgroundColor: theme('colors.orange.600'),
					},
				},
			});
		}),
	],
};
```

```SCSS
.button {
	@apply btn-primary transition-all;

	&:hover {
		@apply bg-orange-600;
	}
}
```

## Кастомная утилита

Утилита - это небольшое дополнение, а не целый компонент

```JS
plugins: [
		plugin(({ addComponents, theme, addUtilities }) => {
			// тут мы инициализируем компонент
			addComponents({
				'.btn-primary': {
					// пишем стили
					// тут мы берём стили из tailwind
					backgroundColor: theme('colors.orange.500'),

					// а тут пишем стили самостоятельно
					color: 'white',
					padding: '10px 0',
					display: 'block',
					width: '100%',
					fontSize: 18,
					fontWeight: 'bold',

					// это стиль-псевдокласс
					'&:hover': {
						backgroundColor: theme('colors.orange.600'),
					},
				},
			});
			// тут уже мы добавляем утилитку
			addUtilities({
				'.textShadow': {
					textShadow: '1px 1px rgba(0, 0, 0, 0.4)',
				},
			});
		}),
	],
```