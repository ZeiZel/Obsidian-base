
## 03:15 ➝ Теория

Реакт - это библиотека для создания пользовательских интерфейсов. То есть это означает, что мы можем писать интерфейсы на нём не только для браузера, но и для мобилок, так как он использует свой виртуальный DOM. 

Мы имеем две основные концепции сайтов:
- MPA (Multi Page Application) - сайт состоит из нескольких страниц, при переходе на которые мы подгружаем их данные целиком
- SPA (Single Page Application) - весь сайт располагается на одной странице и при переходе на другую страницу в нём меняются только конкретные данные

![](_png/Pasted%20image%2020230209082823.png)

Реакт основан на компонентном подходе, когда страница строится из отдельных кирпичиков, которые мы можем повторно использовать. Так же он позволяет сосредоточиться на написании логики приложения без работы со слушателями событий, непосредственной работы с DOM (`querySelector` и подобные операции) - реакт берёт эту работу на себя.

![](_png/Pasted%20image%2020230209083336.png)

Во время своей работы реакт строит два своих дерева и переносят изменения на конечное третье:
- Первое - дерево элементов реакта - когда в нём происходят изменения, они попадают на второе дерево, между которыми происходит сравнение
- Второе - виртуальное дерево для сравнения
- Третье - это конечный DOM браузера, в которое и вносятся изменения после сравнения (фаза рендеринга, за которую отвечает React DOM или React Native)

Механизм согласования (Reconciliation) осуществляет сравнение элементов дерева реакта.
Так же реакт делит операции по приоритетности и более приоритеные задачи он выполняет быстрее.

![](_png/Pasted%20image%2020230209083806.png)

## 11:40 ➝ Начало разработки. Создание проекта



```bash
npx create-react-app .
```



```bash
npm start
```

## 16:10 ➝ Что такое JSX?

==JSX== - это препроцессор, который ==babel== переводит в обычный ==JS==

![](_png/Pasted%20image%2020230209095251.png)

## 18:11 ➝ Компонент App. Работа с состоянием. UseState

Задача: нам нужно сделать счётчик, который при нажатии на кнопку будет увеличивать значение. 

В примере ниже Реакт не понимает, что нужно обновлять значение в определённом компоненте, так как мы подобной функцией отправляем изменение значения в JS (`clg` покажет, что значение меняется внутри JS), а не в дерево Реакта.

Нам нужно будет вызвать в реакте перерендер нужного нам значения на странице.

![](_png/Pasted%20image%2020230209100002.png)

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

![](_png/Pasted%20image%2020230209095936.png)

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

![](_png/Pasted%20image%2020230209103422.png)

## 24:07 ➝ Первый функциональный компонент

- Компоненты мы создаём в папке `components`
- Файл компонента и функция компонента всегда именуются в ==PascalCase==
- Компоненты всегда должны возвращать `JSX.Element`

![](_png/Pasted%20image%2020230209103714.png)

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

![](_png/Pasted%20image%2020230209110019.png)

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

![](_png/Pasted%20image%2020230209113714.png)

## 30:25 ➝ Что такое хуки? useState, useEffect

==Хук== - это функция, которую предоставляет React для использования в функциональных компонентах или в своих собственных хуках

- Хуки используются только на верхнем уровне вложенности. Их нельзя вкладывать в условия, циклы и другие функции.

## 31:10 ➝ Стили. CSS. Классы

Для наименования классов в React используют атрибут `className`, так как слово `class` уже зарезервировано под классы.

Мы можем просто именовать классы стилей наших элементов стандартным способом

![](_png/Pasted%20image%2020230209121509.png)

А можем использовать модули для описания стилей. В этом случае нужно:
- В названии файла стилей указать `.module`
- В `className` указать класс через очку от импортированных стилей

![](_png/Pasted%20image%2020230209121529.png)

Так же стили можно указывать через атрибут `style`, внутрь которого мы передаём объект со стилями

![](_png/Pasted%20image%2020230209125215.png)

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

![](_png/Pasted%20image%2020230209123659.png)

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

![](_png/Pasted%20image%2020230209124444.png)

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

![](_png/Pasted%20image%2020230209140300.png)

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

![](_png/Pasted%20image%2020230209142928.png)

## 57:35 ➝ React Devtools. Инструменты разработчика React

React DevTools - необходимый плагин в работе, который позволит просмотреть дерево элементов страницы, влияние изменения стейта компонентов 

![](_png/Pasted%20image%2020230209143449.png)

## 59:15 ➝ Обмен данными между компонентами. От родителя к ребенку. От ребенка к родителю.

Мы можем передавать функции четырьмя разными способами:
- Самый простой стандартный - это от родителя к ребёнку
- От ребёнка к родителю выполняется через callback-фукнцию
- Между дочерними компонентами (через родительский)
- И глобально в различные компоненты проекта (зачастую через контекст) 

![](_png/Pasted%20image%2020230209144317.png)

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

![](_png/Pasted%20image%2020230209145631.png)

Удаление поста так же работает:

![](_png/Pasted%20image%2020230209152231.png)


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

![](_png/Pasted%20image%2020230209152926.png)

## 01:05:30 ➝ Сортировка. Выпадающий список



`Select.props.ts`
```TS

```



`Select.tsx`
```TSX

```



`PostList.tsx`
```TSX

```

1:10:03

## 01:12:00 ➝ Поиск. Фильтрация.







## 01:15:10 ➝ useMemo. Мемоизация. Кеширование







## 01:23:50 ➝ Модальное окно. Переиспользуемый UI компонент







## 01:30:23 ➝ Анимации. React transition group







## 01:33:40 ➝ Декомпозиция. Кастомные хуки







## 01:36:20 ➝ Работа с сервером. Axios







## 01:38:40 ➝ Жизненный цикл компонента. useEffect







## 01:43:08 ➝ API. PostService







## 01:44:45 ➝ Индикация загрузки данных с сервера







## 01:46:20 ➝ Компонент Loader. Анимации







## 01:49:25 ➝ Кастомный хук useFetching(). Обработка ошибок







## 01:54:15➝ Постраничный вывод. Пагинация (pagination)







## 02:06:20 ➝ Обьяснение механизма изменения состояния







## 02:12:00 ➝ React router. Постраничная навигация. BrowserRouter, Route, Switch, Redirect







## 02:22:00 ➝ Динамическая навигация. useHistory, useParams







## 02:29:30 ➝ Загрузка комментариев к посту







## 02:33:10 ➝ Улучшаем навигацию. Приватные и публичные маршруты







## 02:38:00 ➝ useContext. Глобальные данные. Авторизация пользователя







## 02:47:10 ➝ Бесконечная лента. Динамическая пагинация. useObserver








