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







## Типизация событий. MouseEvents, DragEvents, ChangeEvents







## Типизация хука useRef. Неуправляемый компонент







## Типизация react-router-dom. UseHistory, useParams, BrowserRouter






## Типизация Redux Toolkit



## Типизация асинхронного Redux Toolkit

