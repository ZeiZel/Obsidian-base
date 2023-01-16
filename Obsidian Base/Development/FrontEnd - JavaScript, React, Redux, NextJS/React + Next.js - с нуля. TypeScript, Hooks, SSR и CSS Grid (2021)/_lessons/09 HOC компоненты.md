
## 001 Что такое HOC

==HOC== - ==High order component== - это компонент, который принимает в себя компонент и возвращает новый компонент

![](_png/Pasted%20image%2020221227174615.png)

Простой `HOC` принимает в себя в качестве пропса другой компонент и возвращает из себя модифицированный компонент (по желанию с пропсами)

![](_png/Pasted%20image%2020221227174840.png)

И примерно так выглядит `HOC` с использованием типов

![](_png/Pasted%20image%2020221227175006.png)

> [!Warning] Важно!
> - Менять сам компонент нельзя
> - Всегда нужно передавать `props` внутрь оборачиваемого компонента
> - Необходимо для отладки задавать `displayName`
> - Нельзя использовать `HOC` внутри отрисовки

## 002 Layout

Определимся с тем, что у нас есть  макете:
- Боковая панель (которая скрывается на мобильной версии сайта)
- основная контентная панель
- Футер
- Хедер (который показывается на мобилке)

Чтобы поддерживать одинаковый макет на всех страницах, мы можем создать отдальный компонент, который будет определять, как уже будет выглядеть наш макет. Конкретно: он отобразит, как элементы должны будут располагаться на странице.

![](_png/Pasted%20image%2020230116103605.png)

Элементы лейаута можно расположить в отдельной папке, а не складировать вместе с компонентами

![](_png/Pasted%20image%2020230116110821.png)

Так выглядят компоненты, которые будут располагаться на странице:
- Футер
- Хедер
- Сайдбар

Отдельно для них были сделаны стили, которые впоследствии уже определят расположение элементов на странице

```TSX
/// Footer props
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

export interface IFooterProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

/// Footer .tsx
import React from 'react';
import styles from 'Header.module.css';
import cn from 'classnames';
import { IFooterProps } from './Footer.props';

export const Footer = ({ ...props }: IFooterProps) => {
	return <div {...props}>Footer</div>;
};



/// Header props
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';
export interface IHeaderProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

/// Header .tsx
import React from 'react';
import styles from 'Header.module.css';
import cn from 'classnames';
import { IHeaderProps } from './Header.props';

export const Header = ({ ...props }: IHeaderProps) => {
	return <div {...props}>Header</div>;
};



/// Sidebar props
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

export interface ISidebarProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

/// Sidebar .tsx
import React from 'react';
import styles from 'Sidebar.module.css';
import cn from 'classnames';
import { ISidebarProps } from './Sidebar.props';

export const Sidebar = ({ ...props }: ISidebarProps) => {
	return <div {...props}>Sidebar</div>;
};
```

А уже так выглядит сам `Layout`:

Экстендить данные пропсы див-элементами мы не будем, чтобы сохранять относительную прозрачность данного компонента

`Layout.props.ts`
```TS
import { ReactNode } from 'react';

export interface ILayoutProps {
	children: ReactNode;
}
```

Конкретно тут в качестве параметра `children` будут приниматься все компоненты и вставляться в `div`
 
`Layout.tsx`
```TSX
import React from 'react';
import styles from 'Layout.module.css';
import cn from 'classnames';
import { ILayoutProps } from './Layout.props';
import { Header } from './Header/Header';
import { Footer } from './Footer/Footer';
import { Sidebar } from './Sidebar/Sidebar';

export const Layout = ({ children }: ILayoutProps) => {
	return (
		<>
			<Header />
			<div>
				<Sidebar />
				<div>{children}</div>
			</div>
			<Footer />
		</>
	);
};
```

И теперь мы можем обернуть наш основной код в `Layout` компонент, который принимает в себя все остальные компоненты системы

`index.tsx`
```TSX
export default function Home(): JSX.Element {
	const [rating, setRating] = useState<number>(4);

	return (
		<Layout>
			<Htag tag='h1'>Заголовок</Htag>
			<Button appearance='primary' arrow='right'>
				Кнопка
			</Button>
			<Button appearance='ghost' arrow='down'>
				Кнопка
			</Button>
			<P size='l'>Большой</P>
			<P>Средний</P>
			<P size='s'>Маленький</P>
			<Tag size='s'>Ghost</Tag>
			<Tag size='m' color='red'>
				Red
			</Tag>
			<Tag size='s' color='green'>
				Green
			</Tag>
			<Tag color='primary'>Green</Tag>
			<Rating rating={rating} isEditable setRating={setRating} />
		</Layout>
	);
}
```

![](_png/Pasted%20image%2020230116110734.png)

## 003 Пишем HOC withLayout










