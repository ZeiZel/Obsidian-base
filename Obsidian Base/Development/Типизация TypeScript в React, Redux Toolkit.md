# React + TypeScript
#React #TypeScript 

## Первый компонент. Типизация пропсов. Interface CardProps


`components > Card > CardProps.ts`
```TS
import { ReactChild, ReactNode } from 'react';

export interface ICardProps {
	children: ReactNode | ReactChild;
	width: string;
	height: string;
}
```


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



`components > App > App.tsx`
```TSX
import React from 'react';
import Card from '../Card/Card';
import { CardVariant } from '../Card/CardProps';

const App = () => {
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



`components > UserList > UserListProps.ts`
```TS
import { IUser } from '../../types';

export interface IUserList {
	users: IUser[];
}
```



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



`components > App > App.tsx`
```TSX
import React, { useState } from 'react';
import Card from '../Card/Card';
import { CardVariant } from '../Card/CardProps';
import UserList from '../UserList/UserList';
import { IUser } from '../../types';

const App = () => {
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







## Типизация запроса axios. Типизация хука UseState()







## Переиспользуемый компонент List. Generics, Обобщенные типы в typescript







## Типизация событий. MouseEvents, DragEvents, ChangeEvents







## Типизация хука useRef. Неуправляемый компонент







## Типизация react-router-dom. UseHistory, useParams, BrowserRouter






## Типизация Redux Toolkit



## Типизация асинхронного Redux Toolkit

