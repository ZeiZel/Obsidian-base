
## 03:15 ➝ Теория

Реакт - это библиотека для создания пользовательских интерфейсов. То есть это означает, что мы можем писать интерфейсы на нём не только для браузера, но и для мобилок, так как он использует свой виртуальный DOM. 

Мы имеем две основные концепции сайтов:
- MPA (Multi Page Application) - сайт состоит из нескольких страниц, при переходе на которые мы подгружаем их данные целиком
- SPA (Single Page Application) - весь сайт располагается на одной странице и при переходе на другую страницу в нём меняются только конкретные данные

![](_png/33a3aabbe7c7b40ad68c0c62d81d7cd0.png)

Реакт основан на компонентном подходе, когда страница строится из отдельных кирпичиков, которые мы можем повторно использовать. Так же он позволяет сосредоточиться на написании логики приложения без работы со слушателями событий, непосредственной работы с DOM (`querySelector` и подобные операции) - реакт берёт эту работу на себя.

![](_png/29cbb4f770a6269be5856df2b083bf28.png)

Во время своей работы реакт строит два своих дерева и переносят изменения на конечное третье:
- Первое - дерево элементов реакта - когда в нём происходят изменения, они попадают на второе дерево, между которыми происходит сравнение
- Второе - виртуальное дерево для сравнения
- Третье - это конечный DOM браузера, в которое и вносятся изменения после сравнения (фаза рендеринга, за которую отвечает React DOM или React Native)

Механизм согласования (Reconciliation) осуществляет сравнение элементов дерева реакта.
Так же реакт делит операции по приоритетности и более приоритеные задачи он выполняет быстрее.

![](_png/bab662718cbda445aec5ab66bc94f2a2.png)

## 11:40 ➝ Начало разработки. Создание проекта

Создание реакт-приложения

```bash
npx create-react-app .
```

Запуск компиляции приложения

```bash
npm start
```

Начальной страницей, которая запускает весь рендер приложения является `index.js`, который рендерится в root диве `index.html` документа

`public > index.html`
```HTML
<body>
  <noscript>
	  You need to enable JavaScript to run this app.
  </noscript>
  <div id="root"></div>
</body>
```

`src > index.js`
```TSX
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
    <App/>,
  document.getElementById('root')
);
```

## 16:10 ➝ Что такое JSX?

==JSX== - это препроцессор, который ==babel== переводит в обычный ==JS==

![](_png/60755a97a97d753ff325948840f8eb9c.png)

## 18:11 ➝ Компонент App. Работа с состоянием. UseState

Задача: нам нужно сделать счётчик, который при нажатии на кнопку будет увеличивать значение. 

В примере ниже Реакт не понимает, что нужно обновлять значение в определённом компоненте, так как мы подобной функцией отправляем изменение значения в JS (`clg` покажет, что значение меняется внутри JS), а не в дерево Реакта.

Нам нужно будет вызвать в реакте перерендер нужного нам значения на странице.

![](_png/ca57abef4d8d87003d9d2af569ed60be.png)

Хук `useState()` возвращает значение с состоянием и функцию для его обновления.

Во время первоначального рендеринга возвращаемое состояние (`state`) совпадает со значением, переданным в качестве первого аргумента (`initialState`).

Функция `setState` используется для обновления состояния. Она принимает новое значение состояния и ставит в очередь повторный рендер компонента.

```TSX
export const State = (): JSX.Element => {
	let [counter, setCounter] = useState<number>(0);

	return (
		<div>
			<Link href={'/'}>
				<Button buttonType={'ghost'}>Обратно</Button>
			</Link>
			<div className={styles.wrapper}>
				<h2 className={styles.title}>Счётчик:</h2>
				<h1 className={styles.num}>{counter}</h1>
				<Button
					buttonType={'gray'}
					className={styles.reduce}
					onClick={() => setCounter(counter--)}
				>
					Уменьшить
				</Button>
				<Button
					buttonType={'purple'}
					className={styles.increase}
					onClick={() => setCounter(counter++)}
				>
					Увеличить
				</Button>
			</div>
		</div>
	);
};
```

При увеличении значения счётчика, число увеличивается, а при уменьшении - уменьшается.

![](_png/833927339f8c8ecf264d88aa25200c1c.png)

## 22:25 ➝ Управляемый инпут

Управляемый компонент - это компонент, значение которого мы можем изменить, изменив состояние

```TSX
export const ControlledInput = (): JSX.Element => {
	let [value, setValue] = useState<string>('Значение');

	return (
		<div>
			<Link href={'/'}>
				<Button buttonType={'ghost'}>Обратно</Button>
			</Link>
			<div className={styles.wrapper}>
				<h1>{value}</h1>
				<Input
					value={value}
					placeholder={'Пиши в меня:)'}
					onChange={e => setValue(e.target.value)}
				/>
			</div>
		</div>
	);
};
```

Мы связали состояние `<h1>` с тем, что находится в инпуте

![](_png/3e26fda7068158f07cca93bba42dade2.png)

## 24:07 ➝ Первый функциональный компонент

- Компоненты мы создаём в папке `components`
- Файл компонента и функция компонента всегда именуются в ==PascalCase==
- Компоненты всегда должны возвращать `JSX.Element`

![](_png/babcf972cf88f92865f18a470f9066ab.png)

И теперь данный функциональный компонент `<Button>` можно использовать в любом месте проекта. Этих компонентов можно навставлять сколько угодно и они будут независимыми друг от друга

```TSX
import { Button } from '@/components';  // импортируем кнопку
  
function Home() {  
   return (  
      <div className={styles.wrapper}>  
         <h1>React фундаментальный</h1>  
         <div className={styles.links}>  
            <Link href={'fundamentals/state'}>  
               <Button buttonType={'purple'}>Состояния React</Button>  
            </Link>  
            <Link href={'fundamentals/controlledInput'}>  
	            {/* добавляем кнопку на страницу */}
	            <Button buttonType={'purple'}>Управляемый инпут</Button>  
				<Button buttonType={'purple'}>Управляемый инпут</Button>  
				<Button buttonType={'purple'}>Управляемый инпут</Button>  
				<Button buttonType={'purple'}>Управляемый инпут</Button>  
				<Button buttonType={'purple'}>Управляемый инпут</Button>
            </Link>  
         </div>  
      </div>  
   );  
}
```

![](_png/5d4371e5ce5f16db56f48bd99f728996.png)

## 26:40 ➝ Первый классовый компонент

Классовый компонент использует внутри себя методы

```TSX
import React, { Component } from 'react';
import styles from './ClassCounter.module.scss';
import cn from 'classnames';
import { ClassCounterProps } from './ClassCounter.props';
import { Button } from '@/components';

export class ClassCounter extends Component<any, any> {
	constructor(props: ClassCounter) {
		super(props);
		this.state = {
			count: 0,
		};

		// здесь мы должны вернуть потерянный контекст выполнения для методов
		this.increment = this.increment.bind(this);
		this.decrement = this.decrement.bind(this);
	}

	increment(): void {
		this.setState({
			count: this.state.count + 1,
		});
	}

	decrement(): void {
		this.setState({
			count: this.state.count - 1,
		});
	}

	render() {
		return (
			<div>
				<h1>{this.state.count}</h1>
				<Button buttonType={'purple'} onClick={this.increment}>
					inc
				</Button>
				<Button buttonType={'gray'} onClick={this.decrement}>
					dec
				</Button>
			</div>
		);
	}
}
```

И так выглядит каунтер:

![](_png/98ac183cb0f9192b8df07d268d9b7c1e.png)


## Сокращение путей импортов до компонентов

Так же ну нужно забывать, что при создании компонента в папке `components`, мы можем экспортировать удобно эти компоненты из папки, чтобы использовать в других папках (`pages` или `page-components`)

`components / index.ts`
```TS
export * from './Button/Button';  
export * from './Divider/Divider';  
export * from './Input/Input';  
export * from './Select/Select';  
export * from './Paragraph/Paragraph';  
export * from './ClassCounter/ClassCounter';  
export * from './PostItem/PostItem';  
export * from './PostForm/PostForm';  
export * from './PostFilter/PostFilter';  
export * from './PostList/PostList';
```

После подобного экспорта, мы сможем получать доступ к данным компонентам, просто обратившись через: `import { нужный_компонент } from './components'` 

## 30:25 ➝ Что такое хуки? useState, useEffect

==Хук== - это функция, которую предоставляет React для использования в функциональных компонентах или в своих собственных хуках

- Хуки используются только на верхнем уровне вложенности. Их нельзя вкладывать в условия, циклы и другие функции.

## 31:10 ➝ Стили. CSS. Классы

Для наименования классов в React используют атрибут `className`, так как слово `class` уже зарезервировано под классы.

Мы можем просто именовать классы стилей наших элементов стандартным способом

![](_png/3a972f5907462687bbdedf442b2a758f.png)

А можем использовать модули для описания стилей. В этом случае нужно:
- В названии файла стилей указать `.module`
- В `className` указать класс через точку от импортированных стилей

![](_png/26d94558272eddbef2cb257bd7d37d0e.png)

Так же стили можно указывать через атрибут `style`, внутрь которого мы передаём объект со стилями

![](_png/4a4c19f86bde3c08c6b0a0e13d2567ff.png)

## 34:30 ➝ Props. Аргументы компонента. 

Свойства, которые мы передаём в компонент, называются `props`

В рамках ==React== при использовании его вместе с TS мы обязаны использовать интерфейсы для наших получаемых пропсов (чтобы всегда понимать, что компонент получает). 

Интерфейсы для компонентов мы обычно расширяем с помощью `DetailedHTMLProps` и уточняем, какие атрибуты он должен принимать через `HTMLAttributes`. 

В данном случае, мы расширяем компонент от дива, чтобы была возможность в него передать `className`. 

Так же мы указываем `children` с типом `ReactNode` - это те данные, которые мы вкладываем между открывающим и закрывающим тегом

`PostItem.props.ts`
```TSX
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';  
  
export interface PostItemProps  
   extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {  
   children: ReactNode;  
   title: string;  
}
```

Вместо принимаемого объекта десутруктуризации `{ language, children }` мы бы могли просто написать `props`, но вытащить сразу нужные значения - это самый оптимальный способ взаимодействия, чтобы сразу видеть получаемые параметры

Так же, чтобы передать сразу все остальные пропсы, которые мы вложим в компонент, можно использовать `...props` при получении `props` и в самом JSX указать, что мы выкладываем все пропсы в этот элемент: `<div {...props}>`. Такой подход более актуален, когда мы создаём свои компоненты кнопок, инпутов и остальных простых элементов.

`PostItem.tsx`
```TSX
export const PostItem = ({ title, children, className, ...props }: PostItemProps) => {  
   return (  
      <div className={cn(styles.wrapper, className)} {...props}>  
         <div className={styles.post}>  
            <div className={styles.post__content}>  
               <h2>{title}</h2>  
               <Paragraph size={'l'}>{children}</Paragraph>  
            </div>  
            <Button buttonType={'purple'} className={styles.post__button}>  
               Удалить пост  
            </Button>  
         </div>  
      </div>  
   );  
};
```

Передаются пропсы ровно таким же образом, как и атрибуты. В случае с ==TS== компилятор нам подскажет, какие значения мы можем вставить в данный элемент компонент

`PostList.tsx`
```TSX
export const Posts = () => {  
   const [postsData, setPostsData] = useState([
		{ id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },
		{ id: 'adsgsa2', title: 'C#', body: 'Лучший язык на Земле' },
		{ id: 'fsdagha3', title: 'Python', body: 'Лучший язык на Земле' },
	]); 
  
   return (  
      <div>  
         {postsData.map(p => (  
            <PostItem key={p.id} title={p.title}>  
               {p.body}  
            </PostItem>  
         ))}  
      </div>  
   );  
};
```

Так же мы можем вывести `props` в консоль и увидим, что это просто объект с данными, которые мы передали в компонент извне

![](_png/c121bd518ba3c2ef874f7c451645a1bf.png)

## 36:55 ➝ Работы со списками. Преобразование массива объектов в массив React элементов

Когда нам нужно вывести массив элементов с определённой структурой, мы можем воспользоваться функциями JS внутри JSX. Для этого функции нужно вписать внутрь `{ }` скобок. 

Для перебора массива можно воспользоваться функцией `map()`.

Когда мы создаём списки, обязательно для всех элементов нужно указать уникальный ключ и передать его через атрибут `key`. Для ключа обычно не стоит использовать индекс элемента в массиве - это плохая практика, так как он может поменяться после изменения размера массива. Рекомендуется использовать какой-либо статичный индекс. Это поможет реакту запомнить элемент массива и не перерисовывать все выведенные элементы.

`PostList.tsx`
```TSX
export const Posts = () => {
	const [postsData, setPostsData] = useState([
		{ id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },
		{ id: 'adsgsa2', title: 'C#', body: 'Лучший язык на Земле' },
		{ id: 'fsdagha3', title: 'Python', body: 'Лучший язык на Земле' },
	]);

	return (
		<div>
			{postsData.map(p => (
				<PostItem key={p.id} title={p.title}>
					{p.body}
				</PostItem>
			))}
		</div>
	);
};
```

И примерно так мы получим итоговый массив наших элементов

![](_png/2068cbf81ca2530f3e0d1cfad73d839a.png)

## 42:30 ➝ Создание UI библиотеки. Первые компоненты. CSS модули. Пропс children

Обычно в своей работе придётся часто создавать свою UI-библиотеку под каждый сайт, который мы будем реализовывать.

Компонент кнопки:

`Button.tsx`
```TSX
import React from 'react';
import styles from './Button.module.scss';
import cn from 'classnames';
import { ButtonProps } from './Button.props';

export const Button = ({
	buttonType = 'gray',
	className,
	children,
	...props
}: ButtonProps): JSX.Element => {
	return (
		<button
			{/* в зависимости от переданного атрибута стиля, будет присваиваться свой стиль для кнопки */}
			className={cn(styles.button, className, {
				[styles.gray]: buttonType == 'gray',
				[styles.ghost]: buttonType == 'ghost',
				[styles.purple]: buttonType == 'purple',
			})}
			
		{/* сюда будут передаваться все остальные пропсы, которые мы припишем к кнопке */}
			{...props}
		>
			{/* тут будет находиться значение переданное между тегами компонента */}
			{children}
		</button>
	);
};
```

Тут мы опишем те параметры, которые должна принимать в себя кнопка. Чтобы описать получаемые атрибуты, мы должны расширить интерфейс от `DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>`, где мы расширяемся от `Button`.

`Button.props.ts`
```TS
import { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';

export interface ButtonProps
	extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	children: ReactNode;
	buttonType: 'gray' | 'purple' | 'ghost';
}
```

Стили кнопки:

`Button.module.css`
```CSS
.button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;

	padding: 20px;

	width: 100%;

	border: none;
	border-radius: 8px;

	font-size: 16px;
	font-weight: 700;

	color: white;

	cursor: pointer;
}

.gray {
	grid-area: reduce;
	background: var(--anti-accent);
	transition: all 0.2s;

	&:hover {
		background: var(--anti-accent-hover);
		transform: translateY(-4px);
	}

	&:active {
		background: var(--anti-accent-clicked);
		transform: translateY(4px);
	}
}

.purple {
	grid-area: increase;
	background: var(--primary);
	transition: all 0.2s;

	&:hover {
		background: var(--primary-hover);
		transform: translateY(-4px);
	}

	&:active {
		background: var(--primary-clicked);
		transform: translateY(4px);
	}
}

.ghost {
	position: absolute;
	top: 20px;
	left: 20px;

	width: 100px;
	height: 20px;

	grid-area: increase;
	background: none;
	transition: all 0.2s;

	border: 2px dashed var(--anti-accent);
	border-radius: 2px;

	&:hover {
		background: var(--anti-accent-hover);
		transform: translateY(-4px);
	}

	&:active {
		transform: translateY(4px);
	}
}
```

## 50:00 ➝ Предотвращаем обновление страницы при submit формы

Чтобы предотвратить срабатывание дефолтной перезагрузки страницы, нужно использовать на ивенте данного элемента отключение поведения браузера `preventDefault()`

```TS
const addNewPost = (event): void => {  
   event.preventDefault();  
};
```

## 50:45 ➝ хук useRef. Доступ к DOM элементу. Неуправляемый компонент

Ниже приведены примеры управляемого и неуправляемого компонента:

1) Управляемый:
- Управляемый компонент имеет подконтрольное значение
- Это состояние связано с компонентом через значение

2) Неуправляемый компонент:
- Не имеет подконтрольного значения
- Для получения доступа к нему используется отдельный хук `useRef`

Порядок использования рефа:
- Инициализируем `useRef`
- Передаём в атриьбут `ref` проинициализированный `useRef`
- Оборачиваем сам компонент в своей внутренней реализации в  `forwardRef`
- Прокидываем `ref` внутрь реализации компонента

```TSX
export const PostList = () => {
	const [postsData, setPostsData] = useState([
		{ id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },
		{ id: 'adsgsa2', title: 'C#', body: 'Лучший язык на Земле' },
		{ id: 'fsdagha3', title: 'Python', body: 'Лучший язык на Земле' },
	]);

	const [title, setTitle] = useState<string>('');

	// хук референса на объект DOM-дерева
	const bodyInputRef = useRef<HTMLInputElement>(null);

	const addNewPost = (event: any): void => {
		event.preventDefault();

		// выводим текущий объект, если он есть ?
		console.log(bodyInputRef.current?.value);
	};

	return (
		<div className={styles.wrapper}>
			<div className={styles.formBlock}>
				<form className={styles.form}>




					{/* управляемый компонент */}
					<Input
						value={title}
						onChange={e => setTitle(e.target.value)}
						className={styles.form__input}
						type='text'
						placeholder={'Название поста'}
					/>
					{/* неуправляемый компонент */}
					<Input
						// навешиваем ссылку рефа
						ref={bodyInputRef}
						className={styles.form__input}
						type='text'
						placeholder={'Описание поста'}
					/>




					<Button
						className={styles.form__button}
						buttonType={'purple'}
						onClick={addNewPost}
					>
						Добавить пост
					</Button>
				</form>
			</div>
			<div className={styles.list}>
				{postsData.map(p => (
					<PostItem key={p.id} title={p.title}>
						{p.body}
					</PostItem>
				))}
			</div>
		</div>
	);
};
```

Далее сам компонент `<Input>` нужно обернуть в `forwardRef` полностью (всю функцию обернуть внутрь `( )` скобок) и передать внутрь компонента дополнительное свойство `ref`. Само свойство `ref` нужно вложить в качестве атрибута внутрь нашего компонента 

`Input.tsx`
```TSX
// оборачиваем функцию полностью в forwardRef и вкладываем дополнительный параметр ref
export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, ...props }: InputProps, ref: ForwardedRef<HTMLInputElement>): JSX.Element => {
		// здесь передаём в качестве атрибута ссылку рефа ref={ref}
		return <input ref={ref} className={cn(className, styles.input)} {...props} />;
	},
);

```

И по итогу, мы сможем увидеть в консоли, что реф даёт нам доступ к значению данного инпута

![](_png/6b1d7fa2ba45d82cf68eca90e3b1d67a.png)

И поэтому вернём обратно обычное взаимодействие с деревом. Однако тут сохраняется проблема в том, что мы используем два разных `useState`, хотя могли бы сократить запись

```TSX
export const PostList = () => {
	const [postsData, setPostsData] = useState([
		{ id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },
		{ id: 'adsgsa2', title: 'C#', body: 'Лучший язык на Земле' },
		{ id: 'fsdagha3', title: 'Python', body: 'Лучший язык на Земле' },
	]);

	const [title, setTitle] = useState<string>('');
	const [body, setBody] = useState<string>('');

	const addNewPost = (event: any): void => {
		event.preventDefault();

		// получаем текущие значения из useState
		const newPost = {
			id: `${Date.now()}`,
			title,
			body,
		};

		// не мутируем массив - вставляем старый массив и добавляем новый элемент
		setPostsData([...postsData, newPost]);

		// Очищаем инпуты
		setTitle('');
		setBody('');
	};

	return (
		<div className={styles.wrapper}>
			<div className={styles.formBlock}>
				<form className={styles.form}>
					<Input
						value={title}
						onChange={e => setTitle(e.target.value)}
						className={styles.form__input}
						type='text'
						placeholder={'Название поста'}
					/>
					<Input
						value={body}
						onChange={e => setBody(e.target.value)}
						className={styles.form__input}
						type='text'
						placeholder={'Описание поста'}
					/>
					<Button
						className={styles.form__button}
						buttonType={'purple'}
						onClick={addNewPost}
					>
						Добавить пост
					</Button>
				</form>
			</div>
			<div className={styles.list}>
				{postsData.map(p => (
					<PostItem key={p.id} title={p.title}>
						{p.body}
					</PostItem>
				))}
			</div>
		</div>
	);
};
```

Тут представлена более лаконичная запись с использованием одного `useState` и сокращённой функцией `addNewPost`

```TSX
import React, { useRef, useState } from 'react';
import styles from './PostList.module.scss';
import { PostItem } from '@/components/PostItem/PostItem';
import { Input } from '@/components/Input/Input';
import { Button } from '@/components';

export const PostList = () => {
	const [postsData, setPostsData] = useState([
		{ id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },
		{ id: 'adsgsa2', title: 'C#', body: 'Лучший язык на Земле' },
		{ id: 'fsdagha3', title: 'Python', body: 'Лучший язык на Земле' },
	]);

	const [post, setPost] = useState<{ title: string; body: string }>({
		title: '',
		body: '',
	});

	const addNewPost = (event: any): void => {
		event.preventDefault();

		// добавляем новое значение
		setPostsData([...postsData, { ...post, id: `${Date.now()}` }]);

		// очищаем инпуты
		setPost({
			title: '',
			body: '',
		});
	};

	return (
		<div className={styles.wrapper}>
			<div className={styles.formBlock}>
				<form className={styles.form}>
					<Input
						value={post.title}
						// сюда закидываем старый пост и перезатираем нужное поле
						onChange={e => setPost({ ...post, title: e.target.value })}
						className={styles.form__input}
						type='text'
						placeholder={'Название поста'}
					/>
					<Input
						value={post.body}
						// сюда закидываем старый пост и перезатираем нужное поле
						onChange={e => setPost({ ...post, body: e.target.value })}
						className={styles.form__input}
						type='text'
						placeholder={'Описание поста'}
					/>
					<Button
						className={styles.form__button}
						buttonType={'purple'}
						onClick={addNewPost}
					>
						Добавить пост
					</Button>
				</form>
			</div>
			<div className={styles.list}>
				{postsData.map(p => (
					<PostItem key={p.id} title={p.title}>
						{p.body}
					</PostItem>
				))}
			</div>
		</div>
	);
};
```

Итог: добавление нового поста работает

![](_png/61a45e4d27c8829adf6118a3a3d870e8.png)

## 57:35 ➝ React Devtools. Инструменты разработчика React

React DevTools - необходимый плагин в работе, который позволит просмотреть дерево элементов страницы, влияние изменения стейта компонентов 

![](_png/36feb1b975b5f56aea7f075c98c17273.png)

## 59:15 ➝ Обмен данными между компонентами. От родителя к ребенку. От ребенка к родителю.

Мы можем передавать функции четырьмя разными способами:
- Самый простой стандартный - это от родителя к ребёнку
- От ребёнка к родителю выполняется через callback-фукнцию
- Между дочерними компонентами (через родительский)
- И глобально в различные компоненты проекта (зачастую через контекст) 

![](_png/5fe6ac8f3bcb39b34d29b102b260767f.png)

Первым делом, нужно выделить форму добавления нового поста в отдельный компонент. И тут нам понадобится реализовать передачу пропсов от дочернего элемента к родительскому. 

Передаём через `create={createPost}` функцию от родительского элемента к дочерней форме на добавление поста.

И передаём функцию `remove={removePost}` для удаления поста, но уже непосредственно в айтем поста

`PostList.tsx`
```TSX
export const PostList = () => {  
   const [postsData, setPostsData] = useState<IPost[]>([
		{ id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },
		{ id: 'adsgsa2', title: 'C#', body: 'Лучший язык на Земле' },
		{ id: 'fsdagha3', title: 'Python', body: 'Лучший язык на Земле' },
	]); 
  
   // коллбэк функция для создания поста, которую передаём в дочерний элемент  
   const createPost = (newPost: IPost): void => {  
      setPostsData([...postsData, newPost]);  
   };  
  
   // коллбэк функция для удаления поста, которую передаём в дочерний элемент  
   const removePost = (post: IPost): void => {  
      // в стейт вернём новый массив, который будет отфильтрован через filter  
      setPostsData(postsData.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <PostForm create={createPost} />  
         <div className={styles.list}>  
            {postsData.map(p => (  
               <PostItem remove={removePost} key={p.id} post={p} />  
            ))}  
         </div>  
      </div>  
   );  
};
```

Тут представлен интерфейс поста в отдельном файле

`PostList.interface.ts`
```TS
export interface IPost {
	id: string;
	title: string;
	body: string;
}
```

Сейчас нужно разбить логику так, чтобы можно было передать внутрь дочернего компонента функцию от родительского компонента

`PostForm.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';
import { IPost } from '@/page-components/PostList/PostList.interface';

export interface PostFormProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	create: (newPost: IPost) => void;
}
```

Уже сам отдельный элемент будет в себя принимать функцию удаления поста по полученному посту и сам пост

`PostItem.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';
import { IPost } from '@/page-components/PostList/PostList.interface';

export interface PostItemProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	post: IPost;
	remove: (post: IPost) => void;
}
```

Далее тут вызваем функцию из родительского компонента `create()` в дочернем элементе

`PostForm.tsx`
```TSX
import React, { useState } from 'react';
import styles from './PostForm.module.scss';
import { Input } from '@/components/Input/Input';
import { Button } from '@/components';
import { PostFormProps } from '@/components/PostForm/PostForm.props';

export const PostForm = ({ create }: PostFormProps) => {
	const [post, setPost] = useState<{ title: string; body: string }>({
		title: '',
		body: '',
	});

	const addNewPost = (event: any): void => {
		event.preventDefault();

		const newPost = {
			...post,
			id: `${Date.now()}`,
		};

		// вызываем функцию родителя, в которую передаём новый пост
		create(newPost);

		setPost({
			title: '',
			body: '',
		});
	};

	return (
		<div className={styles.formBlock}>
			<form className={styles.form}>
				<Input
					value={post.title}
					onChange={e => setPost({ ...post, title: e.target.value })}
					className={styles.form__input}
					type='text'
					placeholder={'Название поста'}
				/>
				<Input
					value={post.body}
					onChange={e => setPost({ ...post, body: e.target.value })}
					className={styles.form__input}
					type='text'
					placeholder={'Описание поста'}
				/>
				<Button className={styles.form__button} buttonType={'purple'} onClick={addNewPost}>
					Добавить пост
				</Button>
			</form>
		</div>
	);
};
```

Далее переходим в элемент отдельного поста. Тут кнопкой вызываем функцию удаления поста, передавая в неё полный пост: `() => remove(post)`

`PostItem.tsx`
```TSX
export const PostItem = ({ remove, post, className, ...props }: PostItemProps) => {
	return (
		<div className={cn(styles.wrapper, className)} {...props}>
			<div className={styles.post}>
				<div className={styles.post__content}>
					<h2>{post.title}</h2>
					<Paragraph size={'l'}>{post.body}</Paragraph>
				</div>
				<Button
					onClick={() => remove(post)}
					buttonType={'purple'}
					className={styles.post__button}
				>
					Удалить пост
				</Button>
			</div>
		</div>
	);
};
```

Новые посты всё так же добавляются!

![](_png/3742480103471e32461568c8aa8ac5ba.png)

Удаление поста так же работает:

![](_png/16616b4f3d8c5a04dae3e6bcfdb6a305.png)


## 01:04:20 ➝ Отрисовка по условию

Отрисовка по условию выполняется крайне просто - через тернарный оператор:

`PostList.tsx`
```TSX
return (
	<div className={styles.wrapper}>
		<PostForm create={createPost} />
		<div className={styles.list}>
			{postsData.length ? (
				postsData.map(p => <PostItem remove={removePost} key={p.id} post={p} />)
			) : (
				<h2 style={{ textAlign: 'center' }}>Посты не добавлены</h2>
			)}
		</div>
	</div>
);
```

При удалении всех постов, у нас вылезет надпись:

![](_png/3620ad4c8a15f5a713a4c8a373af2403.png)

## 01:05:30 ➝ Сортировка. Выпадающий список

Первым делом, нужно реализовать компонент сортировки. Он будет в себя принимать массив опций, дефолтную опцию и определённое выбранное значение пользователем 

`Select.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes } from 'react';  
  
export interface SelectProps  
   extends DetailedHTMLProps<HTMLAttributes<HTMLSelectElement>, HTMLSelectElement> {  
   options: { value: string; name: string }[];  
   defaultValue: string;  
   value: string;  
}
```

Компонент селекта выводит массив переданных в него опций и триггерит переданную в него функцию `onChange` при выборе определённого селекта

`Select.tsx`
```TSX
import React from 'react';  
import cn from 'classnames';  
import styles from './Select.module.scss';  
import { SelectProps } from '@/components/Select/Select.props';  
  
export const Select = ({  
   defaultValue,  
   options,  
   className,  
   value,  
   onChange,  
   ...props  
}: SelectProps): JSX.Element => {  
   return (  
      <select  
         value={value}  
         onChange={event => onChange(event.target.value)}  
         className={styles.select}  
      >         
	    <option disabled value=''>  
            {defaultValue}  
		</option>  
         {options.map(option => (  
            <option key={option.value} value={option.value}>  
               {option.name}  
            </option>  
         ))}  
      </select>  
   );  
};
```

В главном компоненте мы создали функцию `sortPosts`, которую и передаём в дочерний компонент селекта. Внутри функции мы устанавливаем тип селекшена  `setSelectedSort` и производим сравнение списков через `localeCompare`.

`PostList.tsx`
```TSX
export const PostList = () => {  
   const [postsData, setPostsData] = useState<IPost[]>([  
      { id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },  
      { id: 'adsgsa2', title: 'C#', body: 'Хроший язык' },  
      { id: 'fsdagha3', title: 'Python', body: 'Почему бы и нет?' },  
   ]);  
  
   // состояние для элемента сортировки select  
   const [selectedSort, setSelectedSort] = useState<'title' | 'body' | ''>('');  
  
   // коллбэк функция для создания поста, которую передаём в дочерний элемент  
   const createPost = (newPost: IPost): void => {  
      setPostsData([...postsData, newPost]);  
   };  
  
   // коллбэк функция для удаления поста, которую передаём в дочерний элемент  
   const removePost = (post: IPost): void => {  
      // в стейт вернём новый массив, который будет отфильтрован через filter  
      setPostsData(postsData.filter(p => p.id !== post.id));  
   };  
  
   // функция для сортировки постов  
   const sortPosts = (sort: 'title' | 'body'): void => {  
      setSelectedSort(sort);  
  
      // тут мы сортируем массив, не мутируя его состояние напрямую  
      setPostsData([...postsData].sort((a, b) => a[sort].localeCompare(b[sort])));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <PostForm create={createPost} />  
  
         <Divider />  
         <Select  
            value={selectedSort}  
            onChange={sortPosts}  
            defaultValue={'Сортировка'}  
            options={[  
               { value: 'title', name: 'По заголовку' },  
               { value: 'body', name: 'По описанию' },  
            ]}  
         />  
  
         <div className={styles.list}>  
            {postsData.length ? (  
               postsData.map(p => <PostItem remove={removePost} key={p.id} post={p} />)  
            ) : (  
               <h2 style={{ textAlign: 'center' }}>Посты не добавлены</h2>  
            )}  
         </div>  
      </div>  
   );  
};
```

Оба вида сортировки:

![](_png/3bfa96bbd5e99bdf1aa83f3d3b9bfe11.png)

![](_png/dd8af079db3adf040bd33670522e2e6f.png)


## 01:15:10 ➝ useMemo. Мемоизация. Кеширование. Поиск. Фильтрация.

Хук `useMemo` возвращает мемоизированное значение.

Первым параметром хук принимает в себя функцию, которая высчитывает определённое значение. Вторым параметром принимает в себя массив зависимостей. Если какая-либо из зависимостей изменилась, то хук заново пересчитывает значение.

Если массив зависимостей не был передан, новое значение будет вычисляться при каждом рендере.

Эта оптимизация помогает избежать дорогостоящих вычислений при каждом рендере.

Нужно помнить, что функция, переданная `useMemo`, запускается во время рендеринга. Не нужно делать там ничего, что обычно не делается во время рендеринга. Например, все побочные эффекты должен выполнять `useEffect`, а не `useMemo`.

`example:`
```TSX
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

>[!warning] Далее структура проекта была немного реорганизована и теперь главным компонентом будет компонен страницы  `Posts.tsx`

В самом компоненте `Posts.tsx` мы создадим общее состояние под поиск, где `filter` будет отвечать за строку запроса `query` и компонент селекта `sort`.

Далее используется две функции `sortPosts` и `sortedAndSearchedPosts`, которые фильтруют массив (первый по селекту, второй по запросу) и кешируют эту сортировку. Функция `sortPosts` удалена, так как её заменяют две вышеописанные функции.

Далее мы вызваем три компонента: форму, фильтр и генерацию списка постов.

`page-components / Posts.tsx`
```TSX
import React, { useMemo, useRef, useState } from 'react';  
import styles from './Posts.module.scss';  
import { PostFilter } from '@/components';  
import { PostForm } from '@/components';  
import { PostList } from '@/components';  
import { IPost } from '@/page-components/Posts/Posts.interface';  
import { IFilter } from '@/components/PostFilter/PostFilter.props';  
  
export const Posts = () => {  
   const [posts, setPosts] = useState<IPost[]>([  
      { id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },  
      { id: 'adsgsa2', title: 'C#', body: 'Хроший язык' },  
      { id: 'fsdagha3', title: 'Python', body: 'Почему бы и нет?' },  
   ]);  
  
   // состояние селекта и строки поиска  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
  
   // получаем отсортированный массив  
   const sortedPosts = useMemo<IPost[]>(() => {  
      return [...posts].sort((a, b) => a[filter.sort].localeCompare(b[filter.sort]));  
   }, [filter.sort, posts]);  
  
   // сортируем массив по строке поиска  
   const sortedAndSearchedPosts = useMemo<IPost[]>(() => {  
      return sortedPosts.filter(post =>  
         post.title.toLowerCase().includes(filter.query.toLowerCase()),  
      );  
   }, [filter.query, sortedPosts]);  
  
   const createPost = (newPost: IPost): void => {  
      setPosts([...posts, newPost]);  
   };  
  
   const removePost = (post: IPost): void => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <PostForm create={createPost} />  
         <PostFilter filter={filter} setFilter={setFilter} />  
         <PostList className={styles.list} posts={sortedAndSearchedPosts} remove={removePost} />  
      </div>  
   );  
};
```

Далее идёт компонент `PostList`, который принимает в себя функцию для удаления поста и массив постов.

`components / PostList / PostList.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';  
import { IPost } from '@/page-components/Posts/Posts.interface';  
  
export interface PostListProps  
   extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {  
   remove: (post: IPost) => void;  
   posts: IPost[];  
}
```

Тут выводится список постов, в каждый из которых передаётся своя функция для их удаления

`components / PostList / PostList.tsx`
```TSX
export const PostList = ({ remove, posts, className, ...props }: PostListProps) => {  
   return (  
      <div className={cn(styles.wrapper, className)} {...props}>  
         {/* выводим полностью отфильтрованный конечный массив */}  
         {posts.length ? (  
            posts.map(p => <PostItem remove={remove} key={p.id} post={p} />)  
         ) : (  
            <h2 style={{ textAlign: 'center' }}>Посты не добавлены</h2>  
         )}  
      </div>  
   );  
};
```

Далее идёт фильтр постов, который в себя принимает пропс фильтра по интерфейсу `IFilter` и функцию `setFilter`, которая устанавливает новый фильтр.

Сам интерфейс `IFilter` представляет из себя интерфейс стейта фильтра из главного компонента

`components / PostFilter / PostFilter.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';  
import { IPost } from '@/page-components/Posts/Posts.interface';  
  
export interface IPostFilterProps  
   extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {  
   filter: IFilter;  
   setFilter: (filter: IFilter) => void;  
}  
  
export interface IFilter {  
   sort: 'title' | 'body';  
   query: string;  
}
```

Данный компонент выполняет фильтрацию по инпуту и по селекту

`components / PostFilter / PostFilter.tsx`
```TSX
export const PostFilter = ({ filter, setFilter }: IPostFilterProps) => {  
   return (  
      <div className={styles.wrapper}>  
         <Input  
            className={styles.search}  
            placeholder={'Поиск...'}  
            value={filter.query}  
            onChange={e => setFilter({ ...filter, query: e.target.value })}  
         />  
  
         <Divider />  
  
         <Select  
            value={filter.sort}  
            onChange={(selectedSort: 'title' | 'body') =>  
               setFilter({ ...filter, sort: selectedSort })  
            }  
            defaultValue={'Сортировка'}  
            options={[  
               { value: 'title', name: 'По заголовку' },  
               { value: 'body', name: 'По описанию' },  
            ]}  
         />  
      </div>  
   );  
};
```

Сделаем поиск по ширине экрана

`components / PostFilter / PostFilter.module.css`
```CSS
.search {  
   width: 100%;  
}
```

Итог: теперь работает поиск по строке запроса 

![](_png/7130d7a046740e25898b3560d25f4985.png)


## 01:23:50 ➝ Модальное окно. Переиспользуемый UI компонент

Чтобы добавить ещё один стиль или несколько стилей, можно воспользоваться такой конструкцией: `[массив_классов].join(' ')`, где мы объединяем весь массив через функцию `join()`

![](_png/72be914956c1af92dd7383d1c358ff6e.png)

Если нам нужно добавить класс по условию, то можно создать такую проверку:

![](_png/f0e8fd560aabb7334d8b133f208b64c1.png)

Компонент модального окна принимает в себя дочерние элементы, состояние видимости и функцию установки этой видимости 

`components / Modal / Modal.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';  
  
export interface IModalProps  
   extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {  
   children: ReactNode;  
   visible: boolean;  
   setVisible: (visible: boolean) => void;  
}
```

Тут уже представлен компонент `Modal`, который и реализует под собой открытие модального окна по состоянию, переданному от родителя.

Так же тут показано, как можно воспользоваться функцией `cn()` из внешнего модуля `classnames`, которая упростит взаимодействие с навешиванием классов на элементы.

Тут нужно сказать, что функция `e.stopPropagation()` (которая вложена в дочерний элемент обёртки) предотвращает выполнение остальных функций, срабатывание которых повешено на данный элемент или его родителей. Конкретно в данном случае, он не даёт закрыться модальному окну при клике на него (функция закрытия работает не только на родителе изначально, но и на ребёнке)

`components / Modal / Modal.tsx`
```TSX
import React from 'react';  
import styles from './Modal.module.scss';  
import cn from 'classnames';  
import { IModalProps } from '@/components/Modal/Modal.props';  
  
export const Modal = ({ children, className, visible, setVisible, ...props }: IModalProps): JSX.Element => {  
   return (  
      <div  
         className={cn(styles.modal, className, {  
            [styles.active]: visible,  
            [styles.disabled]: !visible,  
         })}  
         onClick={() => setVisible(false)}  
      >         
         <div 
	         className={styles.modal__content} 
	         onClick={e => e.stopPropagation()}
	    > 		 
            {children}  
         </div>  
      </div>  
   );  
};
```

- В родительский компонент нужно добавить состояние, которое будет контролировать видимость модального окна.
- Далее в функцию `createPost()` добавим закрытие модального окна при добавлении нового поста
-  В рендере передаём дополнительную кнопку, которая будет проявлять модальное окно
- Внутрь модалки переложим форму для создания нового поста

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState<IPost[]>([  
      { id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },  
      { id: 'adsgsa2', title: 'C#', body: 'Хроший язык' },  
      { id: 'fsdagha3', title: 'Python', body: 'Почему бы и нет?' },  
   ]);  
  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
  
   // состояние модального окна  
   const [modal, setModal] = useState(false);  
  
   const sortedPosts = useMemo<IPost[]>(() => {  
      return [...posts].sort((a, b) => a[filter.sort].localeCompare(b[filter.sort]));  
   }, [filter.sort, posts]);  
  
   const sortedAndSearchedPosts = useMemo<IPost[]>(() => {  
      return sortedPosts.filter(post =>  
         post.title.toLowerCase().includes(filter.query.toLowerCase()),  
      );  
   }, [filter.query, sortedPosts]);  
  
   const createPost = (newPost: IPost): void => {  
      setPosts([...posts, newPost]);  
  
      // после создания модалки, оно закроется  
      setModal(false);  
   };  
  
   const removePost = (post: IPost): void => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <Button 
	         className={styles.button} 
	         buttonType={'purple'} 
	         onClick={() => setModal(true)}
	     >  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  
  
         <PostList className={styles.list} posts={sortedAndSearchedPosts} remove={removePost} />  
      </div>  
   );  
};
```

Итог:

![](_png/997361d35579ece72bb248ed475d0001.png)


## 01:30:23 ➝ Анимации. React transition group

Одним из способов добавить анимацию в реакт является `react-transition-group`, который мы можем использовать как компоненты реакта

```bash
npm install react-transition-group --save &&
npm install --save @types/react-transition-group
```

Тут нужно обернуть группу элементов в `TransitionGroup` а каждый отдельный элемент в `CSSTransition` (в этот же элемент нужно передать свойство ключа, так как он располагается выше, чем `PostItem`)

`components / PostList / PostList.tsx`
```TSX
import { TransitionGroup, CSSTransition } from 'react-transition-group';  
  
export const PostList = ({ remove, posts, className, ...props }: PostListProps) => {  
   return (  
      <div className={cn(styles.wrapper, className)} {...props}>  
         {posts.length ? (  
            <TransitionGroup className='post-list'>  
               {posts.map(p => (  
                  <CSSTransition key={p.id} timeout={500} classNames='post'>  
                     <PostItem remove={remove} post={p} />  
                  </CSSTransition>  
               ))}  
            </TransitionGroup>  
         ) : (  
            <h2 style={{ textAlign: 'center' }}>Посты не добавлены</h2>  
         )}  
      </div>  
   );  
};
```

Стили компонента: 
`CSSTransition` мы наименовали как `post` и поэтому в определённых состояниях нужно наименовать начальный элемент как `post`

```CSS
.post-enter {  
   opacity: 0;  
}  
.post-enter-active {  
   opacity: 1;  
   transition: all 0.2s ease-in;  
}  
.post-exit {  
   opacity: 1;  
}  
.post-exit-active {  
   opacity: 0;  
   transform: rotateY(-350deg);  
   transition: all 0.2s ease-in;  
}
```


## 01:33:40 ➝ Декомпозиция. Кастомные хуки

Когда наш компонент начинает хранить большое количество логики, нужно его декомпозировать и выделять его функции в хелперы или даже отдельные хуки.

Тут будут храниться отдельные хуки, которые мы выцепили из основного компонента создания постов.

`hooks / usePosts.ts`
```TS
import { useMemo } from 'react';  
import { IPost } from '@/page-components/Posts/Posts.interface';  
  
const useSortedPosts = (posts: IPost[], sort: 'title' | 'body') => {  
   return useMemo<IPost[]>(() => {  
      return [...posts].sort((a, b) => a[sort].localeCompare(b[sort]));  
   }, [sort, posts]);  
};  
  
export const usePosts = (posts: IPost[], sort: 'title' | 'body', query: string) => {  
   const sortedPosts = useSortedPosts(posts, sort);  
  
   return useMemo<IPost[]>(() => {  
      return sortedPosts.filter(post => post.title.toLowerCase().includes(query.toLowerCase()));  
   }, [query, sortedPosts]);  
};
```

В самом компоненте мы просто вызваем сортировку постов

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState<IPost[]>([  
      { id: 'asd1', title: 'Javascript', body: 'Лучший язык на Земле' },  
      { id: 'adsgsa2', title: 'C#', body: 'Хроший язык' },  
      { id: 'fsdagha3', title: 'Python', body: 'Почему бы и нет?' },  
   ]);  
  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
  
   const [modal, setModal] = useState(false);  
  
   // сортировка массива постов  
   const sortedAndSearchedPosts = usePosts(posts, filter.sort, filter.query);  
  
   const createPost = (newPost: IPost): void => {  
      setPosts([...posts, newPost]);  
  
      setModal(false);  
   };  
  
   const removePost = (post: IPost): void => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <Button className={styles.button} buttonType={'purple'} onClick={() => setModal(true)}>  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  
  
         <PostList className={styles.list} posts={sortedAndSearchedPosts} remove={removePost} />  
      </div>  
   );  
};
```


## 01:36:20 ➝ Работа с сервером. Axios

Первым делом, установим модуль по работе с сервером `axios`, который позволит просто отправлять запросы на получение данных на сервер

```bash
npm i axios 
```


## 01:38:40 ➝ Жизненный цикл компонента. useEffect

Жизненный цикл компонента React делится на 4 части:
- Инициализация (компонент получает пропсы и состояния)
- Монтирование (вешаем слушатели события, генерим компонент)
- Обновление (производим какие-либо действия над компонентом)
- Размонтирование (удаляем компонент / отписываемся от слушателей события, очищаем глобальное хранилище)

![](_png/5a0bc6f2c35fa08b6118338f164e11d6.png)

И тут мы подходим к использованию хука `useEffect`, который позволит выполнять действия под определённые стадии монтировки компонента

![](_png/f681c08ac5c565f2d4e72dc2d630862e.png)

В главном компоненте получим массив постов с сервера через `fetchPosts` и сохраним его в стейт наших постов. Вызвана эта функция будет через `useEffect`, который в представленном сетапе будет выполнять действие ровно один раз - при загрузке компонента

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState('');  
  
   const fetchPosts = async () => {  
      const posts = await axios.get('https://jsonplaceholder.typicode.com/posts');  
      setPosts(posts.data);  
   };  
  
   useEffect(() => {  
      fetchPosts();  
   }, []);  
  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
  
   const [modal, setModal] = useState(false);  
  
   const sortedAndSearchedPosts = usePosts(posts, filter.sort, filter.query);  
  
   const createPost = (newPost: IPost): void => {  
      setPosts([...posts, newPost]);  
  
      setModal(false);  
   };  
  
   const removePost = (post: IPost): void => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <Button className={styles.button} buttonType={'purple'} onClick={() => setModal(true)}>  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  
  
         <PostList className={styles.list} posts={sortedAndSearchedPosts} remove={removePost} />  
      </div>  
   );  
};
```

Итог: мы получили посты с сервера и сразу их отрендерили, так как через `useEffect` вызвали функцию получения постов

![](_png/e91d33e72d9d763993665a4c533a1c19.png)

## 01:43:08 ➝ API. PostService

Чтобы упростить свою работу с сервером через внесение дополнительной абстракции, можно сделать отдельное API на фронте, которое будет получать наши посты с сервера.

Создадим класс со статичной функцией и будем уже использовать эту конструкцию для работы с сервером

Заранее стоит сказать, что обрабатывать ошибку тут - плохой подход, поэтому переловим ошибку в другом месте кода ->

`API / post.service.ts`
```TS
import axios from 'axios';  
  
export default class PostService {  
   static async getAll() {  
      const posts = await axios.get('https://jsonplaceholder.typicode.com/posts');  
      return posts.data;  
   }  
}
```

И теперь мы можем получить посты более лаконичным и понятным способом

`page-components / Posts.tsx`
```TSX
const fetchPosts = async () => {
	const posts = await PostService.getAll();
	setPosts(posts);
};
```

## 01:44:45 ➝ Индикация загрузки данных с сервера

Мы создали состояние `isPostLoading`, которое будет отвечать за состояние загрузки постов. В функции `fetchPosts` добавим изменение этого состояния (так как через него идёт получение данных с сервера). И далее в `render` укажем, что отображать сообщение о загрузке нужно пока его состояние не перейдёт в `false`

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState('');  
   // состояние для загрузки постов  
   const [isPostLoading, setIsPostLoading] = useState(false);  
  
   const fetchPosts = async () => {  
      // сейчас посты только начнут загрузку, поэтому нужно показать загрузку  
      setIsPostLoading(true);  
      const posts = await PostService.getAll();  
      setPosts(posts);  
  
      // здесь уже посты загружены  
      setIsPostLoading(false);  
   };  
  
   useEffect(() => {  
      fetchPosts();  
   }, []);  
    
   /// CODE ...
  
   return (  
      <div className={styles.wrapper}>  
         <Button className={styles.button} buttonType={'purple'} onClick={() => setModal(true)}>  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  
  
         {isPostLoading ? (  
            <h1>Идёт загрузка...</h1>  
         ) : (  
            <PostList  
               className={styles.list}  
               posts={sortedAndSearchedPosts}  
               remove={removePost}  
            />         
	    )}  
      </div>  
   );  
};
```

Итог:

![](_png/91f7f327e1c061443782aac10e149fa2.png)


## 01:46:20 ➝ Компонент Loader. Анимации

Компонент лоадера будет представлять из себя обычный `<div>`

`components / Loader / Loader.tsx`
```TSX
export const Loader = ({ children, className }: ILoaderProps) => {
	return <div className={cn(styles.loader, className)}>{children}</div>;
};
```

А анимация будет бесконечной и реализованной через обычный ==CSS==

`components / Loader / Loader.module.SCSS`
```SCSS
.loader {  
   display: flex;  
   align-items: center;  
   justify-items: center;  
  
   text-align: center;  
  
   width: 100px;  
   height: 100px;  
  
   border-radius: 50%;  
   border: 3px dashed var(--primary);  
  
   animation: rotate 1s linear infinite;  
   transition: all 0.2s;  
}  
  
@keyframes rotate {  
   from {  
      transform: rotate(0deg) scale(1);  
   }  
  
   to {      transform: rotate(360deg) scale(1.2);  
   }  
}
```

Теперь останется только вставить крутилку на страницу

`page-components / Posts.tsx`
```TSX
{isPostLoading ? (
	<div className={styles.loadPosition}>
		<Loader>Идёт загрузка...</Loader>
	</div>
) : (
	<PostList
		className={styles.list}
		posts={sortedAndSearchedPosts}
		remove={removePost}
	/>
)}
```

Итог: получена крутилка, которая оповещает о загрузке

![](_png/1ce1c523978e4e0b14cf3f8d1ff03330.png)

## 01:49:25 ➝ Кастомный хук useFetching(). Обработка ошибок

Далее нам нужно сделать хук, который будет получать функцию и выполнять её, а так же будет контролировать состояние спиннера загрузки и перехватывать ошибку, если таковая придёт на страницу

`hooks / useFetching.ts`
```TS
import { useState } from 'react';  
  
export const useFetching = (callback: Function): [Function, boolean, string] => {  
   const [isLoading, setIsLoading] = useState<boolean>(false);  
   const [error, setError] = useState<string>('');  
  
   const fetching = async (): Promise<void> => {  
      try {  
         setIsLoading(true);  
         await callback();  
      } catch (e: unknown) {  
         setError(e.message as string);  
      } finally {  
         setIsLoading(false);  
      }  
   };  
  
   return [fetching, isLoading, error];  
};
```

И теперь в родительском компоненте используем хук `useFetching`, который позволит нам убрать отслеживание состояния загрузки внутри родительского компонента

Так же сделаем вывод ошибки, если таковая будет иметься через `postsError`

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState('');  

	// Используем хук для 
   const [fetchPosts, isPostLoading, postsError] = useFetching(async () => {  
      const posts = await PostService.getAll();  
      setPosts(posts);  
   });  
  
   useEffect(() => {  
      fetchPosts();  
   }, []);  
  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
  
   const [modal, setModal] = useState(false);  
  
   const sortedAndSearchedPosts = usePosts(posts, filter.sort, filter.query);  
  
   const createPost = (newPost: IPost): void => {  
      setPosts([...posts, newPost]);  
  
      setModal(false);  
   };  
  
   const removePost = (post: IPost): void => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <Button className={styles.button} buttonType={'purple'} onClick={() => setModal(true)}>  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  

		{postsError && <h1>Произошла ошибка {postsError}</h1>}

         {isPostLoading ? (  
            <div className={styles.loadPosition}>  
               <Loader>Идёт загрузка...</Loader>  
            </div>  
         ) : (  
            <PostList  
               className={styles.list}  
               posts={sortedAndSearchedPosts}  
               remove={removePost}  
            />         )}  
      </div>  
   );  
};
```

Если мы не сможем получить посты с сервера, то увидим вот такую ошибку:

![](_png/a6042458062262708205435c4085c678.png)


## 01:54:15➝ Постраничный вывод. Пагинация (pagination)

Выводить сразу на одной странице 100 постов - это не самая лучшая идея. Если данные посты будут иметь ещё и фотографии, то загрузка страницы будет долгой и устройство пользователя так же будет сильно нагружено. 

Сейчас стоит воспользоваться пагинацией - постраничной загрузкой страниц. 

Домен `jsonplaceholder` позволяет по определённым параметрам выводить лимитированное количество постов и менять страницу. В хедере (`x-total-count`) так же указывается максимальное количество постов, которое может выдать запрос

![](_png/90fc90640054f05d12fb5aff9db1b2a2.png)


`API / post.service.ts`
```TS
import axios from 'axios';  
  
export default class PostService {  
   static async getAll(limit: number = 10, page: number = 1) {  
      return await axios.get('https://jsonplaceholder.typicode.com/posts', {  
         params: {  
            _limit: limit,  
            _page: page,  
         },  
      });  
   }  
}
```


`utilities / pages.utilities.ts`
```TS
// тут мы получаем количество страниц в зависимости от общего количества постов и их максимального количества на странице  
export const getPageCount = (totalCount: number, limit: number): number => {  
   // вернём число страниц, округлённое в большую сторону  
   return Math.ceil(totalCount / limit);  
};  
  
// тут мы создадим массив страниц, которые будут выводить посты  
export const getPagesArray = (totalPages: number) => {  
   let result: number[] = [];  
   for (let i = 0; i < totalPages; i++) {  
      result.push(i + 1);  
   }  
   return result;  
};
```

Уже в основном компоненте страницы мы создаём три новых состояния, которые будут отвечать за общее количество страниц, лимит постов на странице и за саму страницу.

В хуке `useFetching` мы так же получаем заголовок от ответа и вызываем функцию `getPageCount`, которая делит заголовок на лимит и получает количество страниц, а уже дальше `setTotalPages` устанавливает это количество в качестве количества страниц.

Потом в `pagesArray` мы получаем массив страниц (1, 2, 3...).

И уже в функции `changePage` мы осуществляем фетчинг новых постов на странице. Эту функцию вызывает компонент `Button`. 
Кнопки рендерятся в зависимости от количества элементов в массиве `pagesArray`.

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState('');  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
   const [modal, setModal] = useState(false);  
  
   // состояние, которое хранит общее колчиество постов  
   const [totalPages, setTotalPages] = useState<number>(0);  
   // состояние лимита постов  
   const [limit, setLimit] = useState<number>(10);  
   // состояние страницы постов  
   const [page, setPage] = useState<number>(1);  
  
   const [fetchPosts, isPostLoading, postsError] = useFetching(async () => {  
      const response = await PostService.getAll(limit, page);  
      setPosts(response.data);  
  
      // общее количество постов получаем из хедера запроса  
      const totalCount = response.headers['x-total-count'];  
  
      // получаем общее количество страниц  
      setTotalPages(getPageCount(totalCount, limit));  
   });  
  
   // получаем массив номеров страниц  
   let pagesArray: number[] = getPagesArray(totalPages);  
  
   // тут мы будем устанавливать в состояние выбранную страницу пользователя  
   const changePage = (page: number) => {  
      setPage(page);  
      fetchPosts();  
   };  
  
   useEffect(() => {  
      fetchPosts();  
   }, []);  
  
   /// CODE ... 
  
   return (  
      <div className={styles.wrapper}>  
         <Button className={styles.button} buttonType={'purple'} onClick={() => setModal(true)}>  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  
  
         {postsError && <h1>Произошла ошибка {postsError}</h1>}  
  
         {isPostLoading ? (  
            <div className={styles.loadPosition}>  
               <Loader>Идёт загрузка...</Loader>  
            </div>  
         ) : (  
            <PostList  
               className={styles.list}  
               posts={sortedAndSearchedPosts}  
               remove={removePost}  
            />         
        )}  


		{/* тут уже мы выводим кнопки со страницами */}
         <div className={styles.buttonBlock}>  
            {pagesArray.map(p => (  
               <Button  
                  onClick={() => changePage(p)}  
                  key={p}  
                  className={cn(styles.buttonPage, {  
                     [styles.buttonPage__current]: page === p,  
                  })}  
                  buttonType={'gray'}  
               >  
                  {p}  
               </Button>  
            ))}  
         </div>  
      </div>  
   );  
};
```

Мы реализовали подгрузку новых постов на странице, но тут мы столкнулись с проблемой, что при переходе на разные страницы, у нас загружается прошлая выбранная страница

![](_png/8da325f149f2e8d270422f42b2ebb5a2.png)


## 02:06:20 ➝ Обьяснение механизма изменения состояния

Тут нужно сказать, что хуки - это асинхронный процесс, который происходит внутри реакта не сразу. Функции по типу сеттеров `useState` копятся и выполняются разом, отчего и наше изменение страниц выше и не работает сразу. Это сделано для того, чтобы избежать повторных манипуляций с DOM-деревом

![](_png/dc6ff7273eded58071e19bf37df9ffcc.png)

Самый простой способ решить данную проблему - это закинуть изменяющееся значение в `useEffect` и изменять страницу только через него.
И теперь можно из функции `changePage` убрать функцию фетчинга постов, так как это делает `useEffect`.

`page-components / Posts.tsx`
```TSX
const changePage = (page: number) => {  
   setPage(page);  
};  
  
useEffect(() => {  
   fetchPosts();  
}, [page]);
```

![](_png/98a06008139ce07fc26ee39d98753788.png)

И так же можно декомпозировать постраничный вывод в отдельный компонент.

Компонент пагинации будет в себя принимать общее количество страниц, страницу, на которой мы сейчас находимся и функцию изменения страницы 

`components / Pagination / Pagination.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';  
  
export interface IPaginationProps  
   extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {  
   totalPages: number;  
   page: number;  
   changePage: (page: number) => void;  
}
```

В сам компонент так же перенесём вызов функции получения массива страниц

`components / Pagination / Pagination.tsx`
```TSX
export const Pagination = ({ totalPages, page, changePage }: IPaginationProps) => {  
   let pagesArray: number[] = getPagesArray(totalPages);  
  
   return (  
      <div className={styles.buttonBlock}>  
         {pagesArray.map(p => (  
            <Button  
               onClick={() => changePage(p)}  
               key={p}  
               className={cn(styles.buttonPage, {  
                  [styles.buttonPage__current]: page === p,  
               })}  
               buttonType={'gray'}  
            >               
			{p}  
            </Button>  
         ))}  
      </div>  
   );  
};
```

Родительский компонент на данный момент выглядит подобным образом:

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState('');  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
   const [modal, setModal] = useState(false);  
  
   // состояние, которое хранит общее колчиество постов  
   const [totalPages, setTotalPages] = useState<number>(0);  
   // состояние лимита постов  
   const [limit, setLimit] = useState<number>(10);  
   // состояние страницы постов  
   const [page, setPage] = useState<number>(1);  
  
   const [fetchPosts, isPostLoading, postsError] = useFetching(async () => {  
      const response = await PostService.getAll(limit, page);  
      setPosts(response.data);  
  
      // общее количество постов получаем из хедера запроса  
      const totalCount = response.headers['x-total-count'];  
  
      // получаем общее количество страниц  
      setTotalPages(getPageCount(totalCount, limit));  
   });  
  
   // тут мы будем устанавливать в состояние выбранную страницу пользователя  
   const changePage = (page: number) => {  
      setPage(page);  
   };  
  
   useEffect(() => {  
      fetchPosts();  
   }, [page]);  
  
   const sortedAndSearchedPosts = usePosts(posts, filter.sort, filter.query);  
  
   const createPost = (newPost: IPost): void => {  
      setPosts([...posts, newPost]);  
  
      setModal(false);  
   };  
  
   const removePost = (post: IPost): void => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <Button className={styles.button} buttonType={'purple'} onClick={() => setModal(true)}>  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  
  
         {postsError && <h1>Произошла ошибка {postsError}</h1>}  
  
         {isPostLoading ? (  
            <div className={styles.loadPosition}>  
               <Loader>Идёт загрузка...</Loader>  
            </div>  
         ) : (  
            <PostList  
               className={styles.list}  
               posts={sortedAndSearchedPosts}  
               remove={removePost}  
            />         )}  
  
         <Pagination totalPages={totalPages} page={page} changePage={changePage} />  
      </div>  
   );  
};
```


## 02:12:00 ➝ React router. Постраничная навигация. BrowserRouter, Route, Switch, Redirect

Устанавливаем роутер для реакта

```bash
npm i react-router-dom
```

Теперь мы немного переструктурируем приложение:
- Создадим папку `pages`, которая будет хранить не отдельные компоненты, а целые страницы, которые будут располагаться в приложении
- Компонент `App`, который является стартовой точкой приложения, будет хранить в себе `BrowserRouter`, который будет отслеживать все роуты в приложении
- Чтобы определить страницу в качестве отдельного роута, нужно поместить компонент страницы в компонент отдельного роута `Route`. Сам `Route` внутрь себя принимает компонент для роутинга и путь, по которому страница должна отрисовываться

![](_png/7d96398b9ca1d2b958aa27ab38a7204a.png)
![](_png/a9f7c1192618264485967650fc9c2e82.png)

Теперь, чтобы реализовать полноценный роутинг и переход между страницами, нужно использовать компонент `Link`, который принимает путь `to`, который, в свою очередь, определяет, куда нужно перейти на странице.

Уже представленная реализация позволит нам переходить со страницы на страницу без перезагрузки страницы

![](_png/195734de1f7d70df03a2893992ffa876.png)
![](_png/7d03e5fd78dc0926ddf92ba90055f9bc.png)

Далее, чтобы мы могли перемещаться по роутам и обрабатывать несуществующие страницы, нужно добавить компонент `Switch`, в котором передать компонент `Redirect`, который уже будет перенаправлять нас на другую страницу, если та, на которую мы переходим, не будет существовать

![](_png/4ba3d16c75d87a68ed2bf1a717a48119.png)

И так выглядит страница ошибки при переходе не несуществующую страницу

`pages > Error.jsx`
```JSX
import React from 'react';

const Error = () => {
    return (
        <div>
            <h1 style={{color: 'red'}}>
                Вы перешли на несуществующую страницу!
            </h1>
        </div>
    );
};

export default Error;
```

Так же можно перенести всю логику роутинга в отдельный компонент

![](_png/00610adf30860c143ddd0ca269fbc4b9.png)

![](_png/224ded00080444fd1d8491820d3b43ce.png)

## 02:22:00 ➝ Динамическая навигация. useHistory, useParams. Загрузка комментариев к посту

И далее нам нужно реализовать роуты под каждый отдельный пост, чтобы можно было просмотреть по нему детальную информацию

Тут нужно уже воспользоваться хуком `useHistory`, который предоставляет реакт-роутер-дом. Этот хук позволяет нам реализовать переход по страницам без компонента `Link`. Конкретно мы можем воспользоваться методом `push` для генерации роутов по нашим постам. Переход будет осуществляться без помощи ссылок - мы нажали на кнопку и перешли на нужную страницу 

`components / PostItem.jsx`
```JSX
const PostItem = (props) => {
    const router = useHistory()

    return (
        <div className="post">
            <div className="post__content">
                <strong>{props.post.id}. {props.post.title}</strong>
                <div>
                    {props.post.body}
                </div>
            </div>
            <div className="post__btns">
                <MyButton onClick={() => router.push(`/posts/${props.post.id}`)}>
                    Открыть
                </MyButton>
                <MyButton onClick={() => props.remove(props.post)}>
                    Удалить
                </MyButton>
            </div>
        </div>
    );
};
```

И сейчас наш роут заносится в поисковую строку, но ничего не происходит, так как роут поста не был создан

![](_png/46864fc3cc6b305329f660977220271d.png)

Создадим временную страницу отдельного поста

![](_png/72ce7088571cc1a864e6d2146e153611.png)

И далее в компоненте с роутами нужно реализовать переход на динамическую страницу. Чтобы указать, что параметр страницы динамический, нужно в ссылке указать `:id` двоеточие. 

Так же у нас используется два роута, которые начинаются на `/posts`. Чтобы избежать конфликтов, нужно передать атрибут `exact`

![](_png/40b9d47eff4310f585bc15acfe4d1cb7.png)

Далее нам нужно подгружать информацию по посту (его имя, текст и так далее)

Первым делом, нужно добавить в API метод, который будет получать один определённый пост с сервера `getById` и его комментарии `getCommentsByPostId`, которые будут получать `id` поста

`src > API > PostService.js`
```JSX
import axios from "axios";

export default class PostService {
    static async getAll(limit = 10, page = 1) {
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts', {
            params: {
                _limit: limit,
                _page: page
            }
        })
        return response;
    }

    static async getById(id) {
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts/' + id)
        return response;
    }

    static async getCommentsByPostId(id) {
        const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}/comments`)
        return response;
    }
}
```

Сейчас временную страницу поста переделаем под полноценную страницу, которая будет получать информацию по посту с сервера

Далее идёт хук `useParams`, который тоже идёт из реакт-роутер-дом и позволяет получать пропсы определённого элемента по ссылке (например, при переходе на страницу поста данный хук возвращает id поста, так как в ссылке этот параметр динамический)

Ниже представлена реализация отдельной страницы с постом и его комментариями

```JSX
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFetching } from '../hooks/useFetching';
import PostService from '../API/PostService';
import Loader from '../components/UI/Loader/Loader';

const PostIdPage = () => {
	// хук получения пропсов
	const params = useParams();
	// это состояние будет хранить то, что нам вернёт сервер
	const [post, setPost] = useState({});

	// тут уже будут располагаться комментарии поста
	const [comments, setComments] = useState([]);

	// этот хук вернёт нам один пост по переданному id
	const [fetchPostById, isLoading, error] = useFetching(async (id) => {
		// получаем пост с сервера
		const response = await PostService.getById(id);
		// устанавливаем данные поста в состояние поста
		setPost(response.data);
	});

	// тут мы фетчим комментарии поста
	const [fetchComments, isComLoading, comError] = useFetching(async (id) => {
		// получаем пост с сервера
		const response = await PostService.getCommentsByPostId(id);
		// устанавливаем комментарии в состояние
		setComments(response.data);
	});

	// эффект будет фетчить нужные нам данные при первой загрузке страницы
	useEffect(() => {
		// тут он будет получать данные по посту
		fetchPostById(params.id);
		// тут мы будем получить данные по комментариям к посту
		fetchComments(params.id);
	}, []);

	return (
		<div>
			<h1>Вы открыли страницу поста c ID = {params.id}</h1>

			{/* так же нужно обработать загрузку поста */}
			{isLoading ? (
				<Loader />
			) : (
				<div>
					{post.id}. {post.title}
				</div>
			)}
			<h1>Комментарии</h1>

			{/* и загрузку комментариев к посту */}
			{isComLoading ? (
				<Loader />
			) : (
				<div>
					{comments.map((comm) => (
						<div key={comm.id} style={{ marginTop: 15 }}>
							<h5>{comm.email}</h5>
							<div>{comm.body}</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default PostIdPage;
```

![](_png/f0efe706cde70b030b1ecdd52da58c68.png)

## 02:33:10 ➝ Улучшаем навигацию. Приватные и публичные маршруты

Первым делом, чтобы сократить количество описанных роутов в ретёрне компонента роутинга, можно вынести определённые данные, которые принимает `Route` в отдельный массив объектов

![](_png/099ab9380429b4b90df1bc5d2e596f1e.png)

Далее в компоненте с роутингом просто вывести все роуты через мапу

![](_png/d4270dc644b65a2d6611e75a05ebc96c.png)

Сейчас нужно описать все приватные и публичные маршруты на странице

`src > router > index.js`
```JSX
import About from "../pages/About";
import Posts from "../pages/Posts";
import PostIdPage from "../pages/PostIdPage";
import Login from "../pages/Login";


export const privateRoutes = [
    {path: '/about', component: About, exact: true},
    {path: '/posts', component: Posts, exact: true},
    {path: '/posts/:id', component: PostIdPage, exact: true},
]

export const publicRoutes = [
    {path: '/login', component: Login, exact: true},
]
```

И чтобы выводить только публичные или только приватные маршруты, мы можем по тернарному оператору выводить разные конструкции с разными роутами 

Если `isAuth = false`, то будет рендериться только один маршрут - `Login`

![](_png/261c625e25469e79417edf8a3b88dc45.png)

## 02:38:00 ➝ useContext. Глобальные данные. Авторизация пользователя

Далее у нас идёт хук `useContext`, который позволяет из любой точки приложения получить определённые данные. 

Потребность в нём появилась, когда появились сложности с передачей пропсов между большой вложенностью компонентов в приложении

![](_png/99b1445e9557053792280d873281cac0.png)

Чтобы начать использовать контекст, нам нужно для начала создать сам контекст, к которому мы буем обращаться:

`src > context > index.js`
```JS
import {createContext} from 'react'

export const AuthContext = createContext(null);
```

Далее в главном компоненте приложения нужно обернуть всё последующее приложение в контекст `AuthContext`, который и будет распространять определённые данные на все компоненты. Самим распространением занимается `Provider` этого контекста. В атрибут `value` мы передаём значения, которые хотим распространять.

И теперь при обновлении страницы с отдельным постом мы можем встретить проблему, что мы выбрасываемся на страницу с постами. Это происходит по следующей причине:
- изначально аутентификация стоит как `false`
- у нас грузится страница логина
- потом мы получаем данные с локального хранилища, что мы авторизованы
- у нас загружается один из доступных роутов - посты

Чтобы поправить проблему, нужно создать состояние `isLoading`, которое не даст нам выбрасываться обратно, а просто будет отображать компонент загрузки

`src > App.jsx`
```JSX
function App() {
    // состояние зарегистрированности пользователя
    const [isAuth, setIsAuth] = useState(false);
    // состояние полной загрузки приложения
    const [isLoading, setLoading] = useState(true);

    // эффект будет получать один раз при загрузке состояние пользователя - есть вход или нет его
    useEffect(() => {
        if (localStorage.getItem('auth')) {
            setIsAuth(true)
        }

        // так же загрузка сейчас отключается
        setLoading(false);
    }, [])

    return (
        // далее создаём тут провайдер от контекста и оборачиваем в него всё приложение
        // в атрибут value указываем, какие данные будет хранить в себе контекст
        <AuthContext.Provider value={{
            isAuth,
            setIsAuth,
            isLoading
        }}>
            <BrowserRouter>
                <Navbar/>
                <AppRouter/>
            </BrowserRouter>
        </AuthContext.Provider>
    )
}

export default App;
```

И далее в компоненте роутинга мы можем спокойно получить состояние входа и загрузки. Если мы находимся в загрузке, то можем просто вернуть лоадер, который покажет, что данные загружаются

Далее по состоянию аутентификации будут подгружаться определённые роуты

`src > components > AppRouter.jsx`
```JSX
const AppRouter = () => {
    // получаем из глобального контекста состояние входа пользователя и состояние загрузки
	const { isAuth, isLoading } = useContext(AuthContext);

    // идёт загрузка, если страница до сих пор загружается
	if (isLoading) {
		return <Loader />;
	}

	return isAuth ? (
		<Switch>
			{privateRoutes.map((route) => (
				<Route component={route.component} path={route.path} exact={route.exact} key={route.path} />
			))}
			<Redirect to='/posts' />
		</Switch>
	) : (
		<Switch>
			{publicRoutes.map((route) => (
				<Route component={route.component} path={route.path} exact={route.exact} key={route.path} />
			))}
			<Redirect to='/login' />
		</Switch>
	);
};

export default AppRouter;
```

И так выглядит подгрузка данных по постам

![](_png/b030f7dc276b2147c7d2b956d929eb98.png)

На странице логина, мы будем устанавливать айтем `auth` в локальное хранилище, который и будет отвечать за аутентификацию пользователя в системе

`src > page > Login.jsx`
```JSX
import React, {useContext} from 'react';
import MyInput from "../components/UI/input/MyInput";
import MyButton from "../components/UI/button/MyButton";
import {AuthContext} from "../context";

const Login = () => {
    // состояние входа в систему мы получаем из глобального контекста
    const {isAuth, setIsAuth} = useContext(AuthContext);

    // эта функция будет определять, что пользователь залогинен
    const login = event => {
        // предотвращаем перезагрузку от формы
        event.preventDefault();

        // устанавливаем состояние
        setIsAuth(true);

        // в локальне хранилище помещаем true
        localStorage.setItem('auth', 'true')
    }

    return (
        <div>
            <h1>Страница для логина</h1>
            {/* форма логина */}
            <form onSubmit={login}>
                <MyInput type="text" placeholder="Введите логин"/>
                <MyInput type="password" placeholder="Введите пароль"/>
                <MyButton>Войти</MyButton>
            </form>
        </div>
    );
};

export default Login;
```

Далее в навигационном баре можно сделать функцию выхода из приложения, которая удалить айтем аутентификации из локального хранилища

`src > components > Navbar.jsx`
```JSX
import React, {useContext} from 'react';
import {Link} from "react-router-dom";
import MyButton from "../button/MyButton";
import {AuthContext} from "../../../context";

const Navbar = () => {
    const {isAuth, setIsAuth} = useContext(AuthContext);

    // при выходе с сайта аутентификация тоже слетает
    const logout = () => {
        setIsAuth(false);
        localStorage.removeItem('auth')
    }

    return (
        <div className="navbar">
            <MyButton onClick={logout}>
                Выйти
            </MyButton>
            <div className="navbar__links">
                <Link to="/about">О сайте</Link>
                <Link to="/posts">Посты</Link>
            </div>
        </div>
    );
};

export default Navbar;
```

Итог: мы имеем страницу входа, с которой мы не можем пройти ни на какие приватные роуты / логин создаёт отметку в локальном хранилище о входе пользователя

![](_png/88b314b88c92f268157c66415bb891fb.png)

и так же мы можем выйти из системы

![](_png/f688f0bc52520b6e3a28519c0d977148.png)

## 02:47:10 ➝ Бесконечная лента. Динамическая пагинация. useObserver

Сейчас нужно написать хук, который позволит нам наблюдать, дошли ли мы до определённого блока на странице, чтобы спокойно загрузить следующую порцию контента.

Свойство `isIntersecting` у `observer` отвечает за то, в зоне видимости ли наш элемент

`hooks / useObserver.ts`
```TS
import { useEffect, useRef } from 'react';  
  
export const useObserver = (ref, canLoad: boolean, isLoading: boolean, callback: Function) => {  
   // тут будет храниться сам обзёрвер  
   const observer = useRef();  
  
   // второй эффект будет отвечать за отслеживание элемента, который будет триггерить загрузку постов  
   useEffect(() => {  
      // если мы загружаемся, то новый обзёрвер создавать сейчас не нужно  
      if (isLoading) return;  
  
      // если обзёрвер за чем-то уже следит, то нужно убрать с него все слежки на данный момент времени  
      if (observer.current) observer.current?.disconnect();  
  
      const callbackObserver = (entries, observer) => {  
         // если объект в зоне видимости и если номер текущей страницы меньше общего количества страниц  
         if (entries[0].isIntersecting && canLoad) {  
            // то изменяем номер страницы  
            callback();  
         }  
      };  
  
      // инициализируем новый обзёрвер  
      observer.current = new IntersectionObserver(callbackObserver);  
      // выбираем отслеживаемый элемент  
      observer.current.observe(ref.current);  
  
      // срабатывать эффект должен только тогда, когда изменилось состояние загрузки страницы  
   }, [isLoading]);  
};
```

В `return` добавляем див-пустышку, который будет просто иметь в себе референс `lastElement`, за которым и будет следить обзёрвер. Далее нам просто нужно вызвать самописный хук `useObserver` и передать в него нужные параметры

`page-components / Posts.tsx`
```TSX
export const Posts = () => {  
   const [posts, setPosts] = useState('');  
   const [filter, setFilter] = useState<IFilter>({ query: '', sort: 'title' });  
   const [modal, setModal] = useState(false);  
  
   const [totalPages, setTotalPages] = useState<number>(0);  
   const [limit, setLimit] = useState<number>(10);  
   const [page, setPage] = useState<number>(1);  
  
   // тут мы будем хранить ссылку на последний элемент страницы, чтобы при достижении его, у нас подгружались новые посты  
   const lastElement = useRef<HTMLDivElement>();  
  
   const [fetchPosts, isPostLoading, postsError] = useFetching(async () => {  
      const response = await PostService.getAll(limit, page);  
  
      // подгружает не просто новые посты, а добавляет подгруженные в общий массив постов  
      setPosts([...posts, ...response.data]);  
  
      const totalCount = response.headers['x-total-count'];  
  
      setTotalPages(getPageCount(totalCount, limit));  
   });  
  
   const changePage = (page: number) => {  
      setPage(page);  
   };  
  
   // тут воспользуемся кастомным хуком для отслеживания конца страницы  
   useObserver(lastElement, page < totalPages, isPostLoading, () => {  
      setPage(page + 1);  
   });  
  
   useEffect(() => {  
      fetchPosts();  
   }, [page, limit]);  
  
   const sortedAndSearchedPosts = usePosts(posts, filter.sort, filter.query);  
  
   const createPost = (newPost: IPost): void => {  
      setPosts([...posts, newPost]);  
  
      setModal(false);  
   };  
  
   const removePost = (post: IPost): void => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className={styles.wrapper}>  
         <Button className={styles.button} buttonType={'purple'} onClick={() => setModal(true)}>  
            Создать пост  
         </Button>  
  
         <Modal visible={modal} setVisible={setModal}>  
            <PostForm create={createPost} />  
         </Modal>  
  
         <PostFilter filter={filter} setFilter={setFilter} />  
  
         <Select  
            defaultValue={'Количество элементов на странице'}  
            options={[  
               { value: 5, name: '5' },  
               { value: 10, name: '10' },  
               { value: 25, name: '25' },  
               { value: -1, name: 'Все' },  
            ]}  
            value={limit}  
            onChange={value => setLimit(value)}  
         />  
  
         {postsError && <h1>Произошла ошибка {postsError}</h1>}  
  
         <PostList className={styles.list} posts={sortedAndSearchedPosts} remove={removePost} />  
  
         {/* это наблюдаемый div */}  
         <div ref={lastElement} style={{ height: 1 }} />  
  
         {isPostLoading && (  
            <div className={styles.loadPosition}>  
               <Loader>Идёт загрузка...</Loader>  
            </div>  
         )}  
  
         <Pagination totalPages={totalPages} page={page} changePage={changePage} />  
      </div>  
   );  
};
```


При достижении невидимого `div`, у нас срабатывает функция закинутая в `observer`

![](_png/26f9dc71e89436b29873bc3dd2e6de7c.png)

Теперь, при достижении низа страницы, у нас автоматически подгружаются новые посты и перелистываются страницы

![](_png/a097c4c1795771fa8900df2cc3f372be.png)