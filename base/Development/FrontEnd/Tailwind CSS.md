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

Это расширение, которое добавит автокомплит под ==Tailwind==

![](_png/b61a7aa8615acbd5d5b3720d31dbf037.png)

Остальные два плагина нужны для нормальной работы препроцессора, который компилирует тэилвинд

![](_png/fdbf38d450fd0dedcc161251964c6cdd.png)

![](_png/2f5abbb800da341ff101233832e40939.png)

Идентифицируем файл как тэилвиндовский

![](_png/45f917b06e22b1cc7666d6d5029198f9.png)

## Отступы (margin, padding, borders) 

`m-10` - `margin:10rem`
`mx-10` - сделает марджин по оси `x`
`my-10` - сделает марджин по оси `y`
`m-auto`/ `mx-auto` /`my-auto`  - сделает автоматический марджин по всем осям, либо справа слева по центру, либо отцентрирует сверху снизу по середине

`-m-10` - отрицательный марджин
`-mx-10` - по оси `x`
`-my-10` - по оси `y`

`p-10` - делает паддинг со всех сторон
`px-10` - сделает паддинг по оси `x`
`py-10` сделает паддинг по оси `y`
`p-auto`/ `px-auto` /`py-auto` 

`-p-10` - делает отрицательный паддинг
`-px-10` - по оси `x`
`-py-10` - по оси `y`

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

![](_png/607c251b5e0442b71e440e515386db34.png)

## Шрифт (размер, цвет, жирность) 


`text-xl` - этим классом можно определять жирность текста (от `xl` до `4xl`)
`font-bold` - жирный текст
`text-center` - центрирование текста
`text-цвет-насыщенность` - изменение цвета текста

![](_png/9568843bde740709dff97954ba73339f.png)

## Ширина, высота 

`w-число` - определяет ширину объекта относительно окна
`w-screen` - `width: 100vw`
`w-full` - `width: 100%`

`h-число` - определит высоту объекта
`h-screen` - `height: 100vw`
`h-full` - `height: 100%`

![](_png/be96d2012ac0127aa89e236b713851cb.png)

## hover, focus, before, after... 

`bg-purple-500` - так же мы можем укзывать цвета для `bg`
`bg-opacity-60` - и непрозрачность тоже

- `hover:конечный-итог` - действие, которое должно происходить при наведении
`hover:bg-opacity-100` - непрозрачность фона при наведении = `100%`
- `hover/focus/before/after:конечный-итог` - так же со всеми остальными элементами

![](_png/a5827261bc2a966e372f190028f17412.png)
![](_png/bdcd3842f58c9e9be15488e53cca8d62.png)

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

`transition` - определяет переход анимации
`transition-[colors/opacity/shadow/transform]` - анимации отдельно для цветов, непрозрачности, теней и трансформации
`transition-all` - задаёт переход на все анимации, заданные для элемента

`delay-[число]` - задержка анимации

`ease-in-out` - тип анимации

![](_png/5301a859be66e678fc5dda13987908c6.png)

## Анимации 

`animate-[анимация]` - позволяет задать заранее определённую (заготовленню) анимацию
`animate-spin` - анимация кручения объекта

![](_png/e68acd8e7a2c47898dd04a53ae0564d1.png)

## Адаптация - медиа запросы

Так же мы можем написать любые изменения под определённые размеры экранов: `sm`, `md`, `lg`, `xl`, `2xl` (формат применения работает как в bootstrap - mobile-first)

```JSX
<div className='App border border-emerald-600 rounded-md m-10 p-4'>
	<h1 className='text-4xl font-bold text-center text-gray-600'>Hello Tailwind CSS</h1>
	<button className='block mt-10 mx-auto px-4 py-2 bg-green-500 bg-opacity-60 rounded-lg md:bg-purple-500'>
		Login
	</button>
</div>
```

![](_png/31298ae3c1e60b8a755a240a716aed2d.png)

![](_png/2fbc57a40c8c485f84e95797be31295d.png)

## Темный режим 

`dark:[какое-то свойство]` - применит определённые настройки, если на ПК установлена тёмная тема

![](_png/26195efec567ffea805f70f90f4be5ce.png)


## @apply и module.scss 

Сначала подключим стили к скрипту в `.module` режиме (чтобы можно было из JSX обращаться в стили в виде компонентов)
`styles.parent` - обращается к стилям `styles` и берёт оттуда стили класса `parent`

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

Дирректива `@apply` работает в `PostCSS`, которая позволяет применить стили тэилвинда прямо внутри документа `CSS`

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


![](_png/8d1513c31b22ed8f4fed6222adcabb41.png)


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

![](_png/9fea0c45f0ee6a474751168979bed118.png)

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

![](_png/7a973461566c2177d8be0c8f2b104e6b.png)

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
![](_png/314348d4a876c1d4299dd087f1c5ad86.png)

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
![](_png/ae1d1caf2c1e1069ac16045e2a120f07.png)

Так же тут мы можем указать свои маленькие значения `z-index`, если нам понадобятся (так как в тэилвинде они идут, начиная с 10)

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

Так же мы можем установить дополнительные плагины либо пользовательские с ==npm==, либо от самих разработчиков

```bash
npm i -D @tailwindcss/typography
```

Тут в плагинах они подключаются

```JS
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [require('@tailwindcss/typography')],
};
```

И в документации описывается, как они подключаются

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

Так же внутри плагинов через функцию `plugin()` можно определить компонент функцией `addComponents()`, которая принимает в себя объект с именованием и стили для него

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

Так выглядит применение плагина

```SCSS
.button {
	@apply btn-primary transition-all;

	&:hover {
		@apply bg-orange-600;
	}
}
```

## Кастомная утилита

Утилита - это небольшое дополнение, а не целый компонент, который описывается через `addUtilities()`

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