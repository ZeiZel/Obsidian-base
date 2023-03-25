# React + TypeScript
#React #TypeScript 

## Первый компонент. Типизация пропсов. Interface CardProps

Для типизации пропсов создаётся отдельный файл, в котором находятся все типы компонента

Конкретно тут мы описываем тот объект с пропсами, который попадает в наш компонент с помощью интерфейса

Для описания того объекта, который передаётся между тегами (`<Tag>Этот объект</Tag>`) используется типизация свойства `children`, который имеет тип `ReactNode` 

`components > Card > CardProps.ts`
```TS
import { ReactChild, ReactNode } from 'react';

export interface ICardProps {
	children: ReactNode | ReactChild;
	width: string;
	height: string;
}
```

Далее при создании компонента нужно просто тому объекту, который передаётся деструктуризированным в качестве пропса присвоить тип в виде имени интерфейса

`components > Card > Card.tsx`
```TSX
import React from 'react';
import { ICardProps } from './CardProps';

const Card = ({ children, width, height }: ICardProps) => {
	return (
		<div style={{width, height, backgroundColor: 'cyan'}}>
			{children}
		</div>
	);
};

export default Card;
```

И теперь компилятор будет подсказывать, какие свойства обязательно должны быть переданы в компонент

`components > App > App.tsx`
```TSX
import React from 'react';
import Card from '../Card/Card';

const App = () => {
	return (
		<div>
			<Card width={'400px'} height={'400px'}>
				<button>Workink!</button>
			</Card>
		</div>
	);
};

export default App;
```

![](_png/Pasted%20image%2020230324172016.png)


## React.FunctionComponent. React.FC

Если передаваемое свойство пропса имеет всего несколько фиксированных значений, то под них стоит выделить `enum` (перечисление). 

Типизация пропса-функции выглядит просто как: `(arg: type) => returnType`

`components > Card > CardProps.ts`
```TS
import { ReactChild, ReactNode } from 'react';

export enum CardVariant {
	OUTLINED = 'outlined',
	PRIMARY = 'primary',
}

export interface ICardProps {
	children: ReactNode | ReactChild;
	width: string;
	height: string;
	variant: CardVariant;
	onClick: () => void;
}
```

И более правильным вариантом для типизации самой функции и пропса, который она принимает, является использование `FunctionComponent<IПропс>` - эта запись покажет, что константа хранит функцию компонента с дженериком в виде его пропсов

`components > Card > Card.tsx`
```TSX
import React, { FunctionComponent } from 'react';
import { CardVariant, ICardProps } from './CardProps';

const Card: FunctionComponent<ICardProps> = ({ children, width, height, variant, onClick }) => {
	return (
		<div
			style={{
				width,
				height,
				backgroundColor: variant === CardVariant.OUTLINED ? 'lightgray' : 'cyan',
				border: variant === CardVariant.OUTLINED ? '1px solid black' : 'none',
			}}
			onClick={onClick}
		>
			{children}
		</div>
	);
};

export default Card;
```

Так же `FunctionComponent` имеет сокращённый вариант записи в виде `FC<>`

Ну и так же сама функция возвращает `JSX.Element` - это тоже можно указать

`components > App > App.tsx`
```TSX
import React from 'react';
import Card from '../Card/Card';
import { CardVariant } from '../Card/CardProps';

const App: FC = (): JSX.Element => {
	return (
		<div>
			<Card
				width={'400px'}
				height={'400px'}
				variant={CardVariant.OUTLINED}
				onClick={() => console.log('Card')}
			>
				<button>Workink!</button>
			</Card>
		</div>
	);
};

export default App;
```

![](_png/Pasted%20image%2020230324173039.png)


## Компонент UserList. IUser, IAddress

Так же все глобальные сущности, которые используются сразу в нескольких компонентах, принято выносить отдельно в папку `types` 

`types > index.ts`
```TS
export interface IAddress {
	street: string;
	city: string;
	zipcode: string;
}

export interface IUser {
	id: number;
	name: string;
	email: string;
	address: IAddress;
}
```

И в одних интерфейсах спокойно можно использовать другие интерфейсы для описания принимаемых значений

`components > UserList > UserListProps.ts`
```TS
import { IUser } from '../../types';

export interface IUserList {
	users: IUser[];
}
```

И так выглядит вывод нескольких персонажей

`components > UserList > UserList.tsx`
```TSX
import React, { FC } from 'react';
import { IUserList } from './UserListProps';

const UserList: FC<IUserList> = ({ users }) => {
	return (
		<div>
			{users.map((user) => (
				<div key={user.id} style={{ padding: 15, border: '1px solid gray' }}>
					{user.id}. {user.name} ({user.email}) проживает в {user.address.city}/
					{user.address.street}
				</div>
			))}
		</div>
	);
};

export default UserList;
```

А тут происходит передача моковых данных в компонент списка пользователей

`components > App > App.tsx`
```TSX
import React, { useState } from 'react';
import Card from '../Card/Card';
import { CardVariant } from '../Card/CardProps';
import UserList from '../UserList/UserList';
import { IUser } from '../../types';

const App: FC = (): JSX.Element => {
	const users: IUser[] = [
		{
			id: 1,
			name: 'Antony',
			email: 'slice@ya.ru',
			address: { city: 'Penza', street: 'Value Street', zipcode: '123' },
		},
		{
			id: 2,
			name: 'Alexy',
			email: 'alexy.su@ya.ru',
			address: { city: 'Penza', street: 'Value Street', zipcode: '321' },
		},
	];

	return (
		<div>
			<Card
				width={'400px'}
				height={'400px'}
				variant={CardVariant.OUTLINED}
				onClick={() => console.log('Card')}
			>
				<button>Workink!</button>
			</Card>
			<UserList users={users} />
		</div>
	);
};

export default App;
```

![](_png/Pasted%20image%2020230324180442.png)

## Компонент UserItem.

Тут мы создаём отдельный `UserItem`, который используется для вывода в `UserList`

`components > UserItem > UserItemProps.tsx`
```TS
import { IUser } from '../../types';

export interface IUserItemProps {
	user: IUser;
}
```

`components > UserItem > UserItem.tsx`
```TSX
import React, { FC } from 'react';
import { IUserItemProps } from './UserItemProps';

const UserItem: FC<IUserItemProps> = ({ user }) => {
	return (
		<div key={user.id} style={{ padding: 15, border: '1px solid gray' }}>
			{user.id}. {user.name} ({user.email}) проживает в {user.address.city}/
			{user.address.street}
		</div>
	);
};

export default UserItem;
```

`components > UserList > UserList.tsx`
```TSX
const UserList: FC<IUserList> = ({ users }) => {
	return (
		<div>
			{users.map((user) => (
				<UserItem user={user} />
			))}
		</div>
	);
};
```

## Типизация запроса axios. Типизация хука UseState()

Все запросы axios типизируются через дженерик `axios.get<Тип>()`

Примерно таким же образом выглядит типизация хука состояния, однако тут ещё в него нужно заранее поместить смежный с данными тип (`null`, `[]`): `useState<IUsers[]>([])`

`components > App > App.tsx`
```TSX
import React, { FC, useEffect, useState } from 'react';
import Card from '../Card/Card';
import { CardVariant } from '../Card/CardProps';
import UserList from '../UserList/UserList';
import { IUser } from '../../types';
import axios from 'axios';

const App: FC = (): JSX.Element => {
	const [users, setUsers] = useState<IUser[]>([]);

	async function fetchUsers() {
		try {
			const response = await axios.get<IUser[]>('https://jsonplaceholder.typicode.com/users');
			setUsers(response.data);
		} catch (e) {
			console.error(e);
		}
	}

	useEffect(() => {
		fetchUsers();
	}, []);

	return (
		<div>
			<Card
				width={'400px'}
				height={'400px'}
				variant={CardVariant.OUTLINED}
				onClick={() => console.log('Card')}
			>
				<button>Workink!</button>
			</Card>
			<UserList users={users} />
		</div>
	);
};

export default App;
```

![](_png/Pasted%20image%2020230324191212.png)

## Переиспользуемый компонент List. Generics, Обобщенные типы в typescript

Создадим ещё один глобальный интерфейс тудушки

`types > index.ts`
```TS
export interface ITodo {
	id: number;
	title: string;
	completed: boolean;
}
```

И создадим общий компонент, который будет принимать в себя массив элементов динамического типа `<T>` и будет принимать в себя функцию для рендера одного элемента 

Данный компонент `List` будет рендерить любой массив элементов, который в него передали. Таким образом, мы создаём компонент с использованием обобщённых типов

`components > List > ListProps.ts`
```TS
import { ReactNode } from 'react';

export interface IListProps<T> {
	items: T[];
	renderItem: (item: T) => ReactNode;
}
```

`components > List > List.tsx`
```TSX
import React, { FC } from 'react';
import { IListProps } from './ListProps';

export default function List<T>(props: IListProps<T>) {
	return <div>{props.items.map(props.renderItem)}</div>;
}
```

Тут мы создаём компонент с отдельной тудушкой

`components > TodoItem > TodoItemProps.tsx`
```TS
import { ITodo } from '../../types';

export interface ITodoItemProps {
	todo: ITodo;
}
```

`components > TodoItem > TodoItem.tsx`
```TSX
import React, { FC } from 'react';
import { ITodoItemProps } from './TodoItemProps';

const TodoItem: FC<ITodoItemProps> = ({ todo }) => {
	return (
		<div>
			<input type='checkbox' checked={todo.completed} />
			{todo.id}. {todo.title}
		</div>
	);
};

export default TodoItem;
```

А тут уже подставляем компонент `List` для обоих массивов списков (персонажей и тудушек)

`components > App > App.tsx`
```TSX
import React, { FC, useEffect, useState } from 'react';
import Card from '../Card/Card';
import { CardVariant } from '../Card/CardProps';
import { ITodo, IUser } from '../../types';
import axios from 'axios';
import List from '../List/List';
import UserItem from '../UserItem/UserItem';
import TodoItem from '../TodoItem/TodoItem';
import './App.css';

const App: FC = (): JSX.Element => {
	const [users, setUsers] = useState<IUser[]>([]);
	const [todos, setTodos] = useState<ITodo[]>([]);

	async function fetchUsers() {
		try {
			const response = await axios.get<IUser[]>('https://jsonplaceholder.typicode.com/users');
			setUsers(response.data);
		} catch (e) {
			console.error(e);
		}
	}

	async function fetchTodos() {
		try {
			const response = await axios.get<ITodo[]>(
				'https://jsonplaceholder.typicode.com/todos?_limit=10',
			);
			setTodos(response.data);
		} catch (e) {
			console.error(e);
		}
	}

	useEffect(() => {
		fetchUsers();
		fetchTodos();
	}, []);

	return (
		<div className={'wrapper'}>
			<Card
				width={'400px'}
				height={'400px'}
				variant={CardVariant.OUTLINED}
				onClick={() => console.log('Card')}
			>
				<button>Workink!</button>
			</Card>
			<List
				items={users}
				renderItem={(user: IUser) => <UserItem user={user} key={user.id} />}
			/>
			<List
				items={todos}
				renderItem={(todo: ITodo) => <TodoItem todo={todo} key={todo.id} />}
			/>
		</div>
	);
};

export default App;
```


![](_png/Pasted%20image%2020230325132146.png)

## Типизация событий. MouseEvents, DragEvents, ChangeEvents

>[!warning] Очень важно в начале указать, что все ивенты нужно доставать из **React**, потому что зачастую по умолчанию они достаются из **DOM**

Для атрибута `onChange` в TS присвоен тип `ChangeEvent<T>`, который в качестве дженерик-типа принимает тот тег, к которому применяется типизация

Для всех событий drag и drop используется один тип:
- `onDrag` - `DragEvent`
- `onDrop` - `DragEvent`
- `onDragOver` - `DragEvent`
- `onDragLeave` - `DragEvent`

`components > EventsEx > EventsEx.tsx`
```TSX
import React, { ChangeEvent, EventHandler, FC, useState } from 'react';

const EventsEx: FC = (): JSX.Element => {
	const [value, setValue] = useState<string>('');
	const [isDrag, setIsDrag] = useState<boolean>(false);

	// будет записывать в стейт значение из инпута
	const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
	};

	// будет выводить стейт в консоль
	const clickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
		console.log(value);
	};

	// при попытке драга, будет выводиться лог в консоль
	const dragHandler = (e: React.DragEvent<HTMLDivElement>) => {
		console.log('DRAG');
	};

	// будет срабатывать при 
	const dropHandler = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDrag(false);
		console.log('DROP');
	};

	const leaveHandler = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDrag(false);
		console.log('LEAVE');
	};

	const dragWithPreventHandler = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDrag(true);
		console.log('DRAG OVER');
	};

	return (
		<div>
			<input type='text' value={value} onChange={changeHandler} />
			<button onClick={clickHandler}>Button</button>
			<div
				onDrag={dragHandler}
				draggable
				style={{
					width: 200,
					height: 200,
					backgroundColor: 'pink',
					margin: '15px 0px 15px 0px',
				}}
			></div>
			<div
				// сработает при попытке дропа в блок
				onDrop={dropHandler}
				// сработает, когда мы покинем блок
				onDragLeave={leaveHandler}
				// при нахождении внутри блока
				onDragOver={dragWithPreventHandler}
				style={{ width: 200, height: 200, backgroundColor: isDrag ? 'pink' : 'blue' }}
			></div>
		</div>
	);
};

export default EventsEx;
```

Введённая строка из инпута при нажатии на кнопку попадает в консоль

![](_png/Pasted%20image%2020230325142206.png)

А уже тут при драге первого блока на второй меняется цвет последнего 

![](_png/Pasted%20image%2020230325153242.png)

![](_png/Pasted%20image%2020230325153245.png)


## Типизация хука useRef. Неуправляемый компонент

`useRef` принимает внутрь дженерика тип элемента, с которым он взаимодействует

`components > EventsEx > EventsEx.tsx`
```TSX
import React, { ChangeEvent, EventHandler, FC, useRef, useState } from 'react';

const EventsEx: FC = (): JSX.Element => {
	const [value, setValue] = useState<string>('');
	const [isDrag, setIsDrag] = useState<boolean>(false);

	const inputRef = useRef<HTMLInputElement>(null);

	// будет выводить стейт в консоль
	const clickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
		console.log(inputRef.current?.value);
	};

	/// CODE ...

	return (
		<div>
			<input ref={inputRef} type='text' placeholder={'Неуправляемый'} />
			<input type='text' value={value} onChange={changeHandler} placeholder={'Управляемый'} />
			
			/// CODE ...

		</div>
	);
};
```

![](_png/Pasted%20image%2020230325154842.png)


## Типизация react-router-dom. UseHistory, useParams, BrowserRouter






## Типизация Redux Toolkit



## Типизация асинхронного Redux Toolkit

