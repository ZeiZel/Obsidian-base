
### 11 AppRouter. Конфиг для роутера

Первым делом нужно реализовать конфиг для роутера, который будет содержать пути и элементы роутов

`src > shared > config > routeConfig > routeConfig.tsx`
```TSX
import { RouteProps } from 'react-router-dom';
import { MainPage } from 'pages/MainPage';
import { AboutPage } from 'pages/AboutPage';

// ключи путей
export enum AppRoutes {
	MAIN = 'main',
	ABOUT = 'about',
}

// роуты по ключам
export const RoutePath: Record<AppRoutes, string> = {
	[AppRoutes.MAIN]: '/',
	[AppRoutes.ABOUT]: '/about',
};

// тут содержится информация о пропсах, которые будут попадать в роутер
export const routeConfig: Record<AppRoutes, RouteProps> = {
	[AppRoutes.MAIN]: {
		path: RoutePath.main,
		element: <MainPage />,
	},
	[AppRoutes.ABOUT]: {
		path: RoutePath.about,
		element: <AboutPage />,
	},
};
```

Далее нужно реализовать отдельный провайдер с роутером, который будет генерировать массив роутов приложения

`src > app > providers > router > ui > AppRouter.tsx`
```TSX
import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routeConfig } from 'shared/config/routeConfig/routeConfig';

export const AppRouter = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Routes>
				{Object.values(routeConfig).map(({ path, element }) => (
					<Route key={path} path={path} element={element} />
				))}
			</Routes>
		</Suspense>
	);
};
```

Экспортируем роутер

`src > app > providers > router > index.ts`
```TS
export { AppRouter } from './ui/AppRouter';
```

И просто используем роуты в корневом файле

`src > app > App.tsx`
```TSX
export const App = () => {
	const { toggleTheme, theme } = useTheme();

	return (
		<div className={classNames('app', {}, [theme])}>
			<button className={'button'} onClick={toggleTheme}>
				toggle
			</button>
			<Link to={'/'}>Главная</Link>
			<Link to={'/about'}>О нас</Link>
			<AppRouter />
		</div>
	);
};
```

### 12 Navbar. Шаблоны для разработки. Первый UI Kit компонент

В перечислении будут храниться названия стилей, которые будут применяться на ссылку. 

Сами пропсы будут расширяться от пропсов ссылки 

`src > shared > ui > AppLink > AppLink.props.ts`
```TS
import { LinkProps } from 'react-router-dom';
import { ReactNode } from 'react';

export enum AppLinkTheme {
	PRIMARY = 'primary',
	SECONDARY = 'secondary',
}

export interface IAppLinkProps extends LinkProps {
	children: ReactNode;
	theme?: AppLinkTheme;
}
```

Компонент ссылки выглядит следующим образом и располагается в папке `shared`, так как он не имеет никакой бизнес-логики

`src > shared > ui > AppLink > AppLink.tsx`
```TSX
import React, { ReactNode } from 'react';
import { classNames } from 'shared/lib/classNames/classNames';
import styles from './AppLink.module.scss';
import { Link, LinkProps } from 'react-router-dom';
import { AppLinkTheme, IAppLinkProps } from 'shared/ui/AppLink/AppLink.props';

export const AppLink = ({
	theme = AppLinkTheme.PRIMARY,
	to,
	children,
	className,
	...props
}: IAppLinkProps) => {
	return (
		<Link
			to={to}
			className={classNames(styles.appLink, {}, [className, styles[theme]])}
			{...props}
		>
			{children}
		</Link>
	);
};
```

Стили, которые позволяют менять цвета ссылок

`src > shared > ui > AppLink > AppLink.module.scss`
```SCSS
.applink {
	color: var(--primary-color);
}

.primary {
	color: var(--primary-color);
}

.secondary {
	color: var(--secondary-color);
}
```

Пропсы навбара

`src > widgets > Navbar > ui > Navbar.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes } from 'react';

export interface INavbarProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}
```

`Navbar` использует ссылки `AppLink`

`src > widgets > Navbar > ui > Navbar.tsx`
```TSX
import React from 'react';
import { INavbarProps } from 'widgets/Navbar/ui/Navbar.props';
import { classNames } from 'shared/lib/classNames/classNames';
import styles from './Navbar.module.scss';
import { AppLink } from 'shared/ui/AppLink/AppLink';
import { AppLinkTheme } from 'shared/ui/AppLink/AppLink.props';

export const Navbar = ({ className }: INavbarProps) => {
	return (
		<nav className={classNames(styles.navbar, {}, [className])}>
			<div className={styles.navbar__links}>
				<AppLink theme={AppLinkTheme.SECONDARY} to={'/'}>
					Главная
				</AppLink>
				<AppLink theme={AppLinkTheme.SECONDARY} to={'/about'}>
					О нас
				</AppLink>
			</div>
		</nav>
	);
};
```

Стили навигационного меню

`src > widgets > Navbar > ui > Navbar.module.scss`
```SCSS
.navbar {
	display: flex;
	align-items: center;

	width: 100%;
	height: var(--navbar-height);

	padding: 20px;

	background: var(--inverted-bg-color);

	&__links {
		display: flex;
		gap: 15px;
		
		margin-left: auto;
	}
}
```

Подключаем навигационное меню к приложению

`src > app > App.tsx`
```TSX
export const App = () => {
	const { toggleTheme, theme } = useTheme();

	return (
		<div className={classNames('app', {}, [theme])}>
			<Navbar className={'navbar'} />
			<AppRouter />
			<button className={'button'} onClick={toggleTheme}>
				toggle
			</button>
		</div>
	);
};
```

Добавляем инвертированные цвета в глобальные стили цветов

![](_png/Pasted%20image%2020230620143436.png)

И навбар так же теперь меняет цвета на противоположные

![](_png/Pasted%20image%2020230620143504.png)

### 13 Svg loader. File loader. Button UI kit





### 14 Sidebar. Layout приложения Метка





### 15 i18n Интернационализация. Define plugin. Плагин для переводов





### 16 Webpack hot module replacement





### 17 Babel. Extract plugin [optional]





### 18 Настраиваем EsLint. Исправляем ошибки





### 19 Stylelint. Plugin for i18next





### 20 Тестовая среда. Настраиваем Jest. Пишем первый тест Метка





### 21 Несуществующие маршруты. Лоадер для загрузки страниц





### 22 Дополнение к модулю