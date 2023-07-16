
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

Пакет для подключения SVG в приложение

```bash
npm install @svgr/webpack --save-dev
```

Пакет для подключения изображений и файлов в приложение

```bash
npm install file-loader --save-dev
```

В лоадеры нужно добавить правила для svg и файлов остальных изображений

`config > build > buildLoaders.ts`
```TS
export function buildLoaders({ isDev }: BuildOptions): RuleSetRule[] {
	// так как порядок некоторых лоадеров важен, то важные лоадеры можно выносить в отдельные переменные
	const typescriptLoader = {
		test: /\.tsx?$/,
		use: 'ts-loader',
		exclude: /node_modules/,
	};

	// лоадер для SVG изображений
	const svgLoader = {
		test: /\.svg$/,
		use: ['@svgr/webpack'],
	};

	// лоадер для добавления изображений в проект
	const fileLoader = {
		test: /\.(png|jpe?g|gif)$/i,
		use: [
			{
				loader: 'file-loader',
			},
		],
	};

	const stylesLoader = {
		test: /\.s[ac]ss$/i,
		use: [
			// в зависимости от режима разработки будет применяться разный лоадер
			isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
			// так же лоадеры можно передавать в виде объектов, если нужно к ним добавить опции
			{
				loader: 'css-loader',
				options: {
					// включаем поддержку модулей у лоадера
					modules: {
						// включаем модульные стили (классы с именами asdWQSsaQ) только если они содержат в названии module
						auto: (resPath: string) => !!resPath.includes('.module.'),
						localIdentName: isDev
							? '[path][name]__[local]--[hash:base64:8]'
							: '[hash:base64:8]',
					},
				},
			},
			'sass-loader',
		],
	};

	return [typescriptLoader, stylesLoader, svgLoader, fileLoader];
}
```

Так же нужно добавить типы для подключаемых файлов 

`src > app > types > global.d.ts`
```TS
declare module '*.svg' {
	const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
	export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
```

Кастомный компонент кнопки

`src > shared > ui > Button > Button.tsx`
```TSX
import React, { FC } from 'react';
import { classNames } from 'shared/lib/classNames/classNames';
import styles from './Button.module.scss';
import { IButtonProps } from 'shared/ui/Button/Button.props';

export const Button: FC<IButtonProps> = ({ theme, className, children, ...props }) => {
	return (
		<button className={classNames(styles.button, {}, [className, styles[theme]])} {...props}>
			{children}
		</button>
	);
};
```
`src > shared > ui > Button > Button.props.ts`
```TS
import { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';

export enum ThemeButton {
	CLEAR = 'clear',
}

export interface IButtonProps
	extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
	children: ReactNode;
	theme?: ThemeButton;
}
```
`src > shared > ui > Button > Button.module.scss`
```SCSS
.button {
	cursor: pointer;
}

.clear {
	padding: 0;
	margin: 0;
	border: none;
	background: none;
}
```

Кастомный компонент переключателя темы

`src > widgets > ThemeSwitcher > ui > ThemeSwitcher.tsx`
```TSX
export const ThemeSwitcher: FC<IThemeSwitcherProps> = ({ className }) => {
	const { toggleTheme, theme } = useTheme();

	return (
		<Button
			theme={ThemeButton.CLEAR}
			className={classNames(styles.button, {}, [className])}
			onClick={toggleTheme}
		>
			{theme === Theme.LIGHT ? <LightIcon /> : <DarkIcon />}
		</Button>
	);
};
```
`src > widgets > ThemeSwitcher > ui > ThemeSwitcher.props.ts`
```TS
import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export interface IThemeSwitcherProps
	extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {}
```
`src > widgets > ThemeSwitcher > index.ts`
```TS
export { ThemeSwitcher } from './ui/ThemeSwitcher';
```

Добавляем компонент переключения тем в навигационное меню

`src > widgets > Navbar > ui > Navbar.tsx`
```TSX
export const Navbar = ({ className }: INavbarProps) => {
	return (
		<nav className={classNames(styles.navbar, {}, [className])}>
			<ThemeSwitcher />
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

И теперь так чисто выглядит корневой компонент приложения

`src > app > App.tsx`
```TSX
export const App = () => {
	const { theme } = useTheme();

	return (
		<div className={classNames('app', {}, [theme])}>
			<Navbar className={'navbar'} />
			<AppRouter />
		</div>
	);
};
```

![](_png/Pasted%20image%2020230622103421.png)

### 14 Sidebar. Layout приложения Метка

Добавляем компонент сайдбара и перемещаем в него кнопку смены темы. Так же анимируем скрытие сайдбара через накладываемый стиль коллапса

`src > widgets > Sidebar > ui > Sidebar > Sidebar.tsx`
```TSX
import React, { useState } from 'react';
import { classNames } from 'shared/lib/classNames/classNames';
import styles from './Sidebar.module.scss';
import { ISidebarProps } from './Sidebar.props';
import { ThemeSwitcher } from 'widgets/ThemeSwitcher';

export const Sidebar = ({ className }: ISidebarProps) => {
	const [collapsed, setCollapsed] = useState<boolean>(false);

	const onToggle = () => setCollapsed((prev) => !prev);

	return (
		<div className={classNames(styles.sidebar, { [styles.collapsed]: collapsed }, [className])}>
			<button onClick={onToggle}>toggle</button>
			<div className={styles.switchers}>
				<ThemeSwitcher />
				{/* LanguageSwitcher */}
			</div>
		</div>
	);
};
```
`src > widgets > Sidebar > ui > Sidebar > Sidebar.props.ts`
```TS
import { DetailedHTMLProps, HTMLAttributes } from 'react';

export interface ISidebarProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}
```
`src > widgets > Sidebar > ui > Sidebar > Sidebar.module.scss`
```SCSS
.sidebar {
	position: relative;

	height: calc(100vh - var(--navbar-height));
	width: var(--sidebar-width);

	background: var(--inverted-bg-color);

	transition: all .3s ease;
}

.collapsed {
	width: var(--sidebar-width-collpased);
}

.switchers {
	position: absolute;
	bottom: 29px;

	display: flex;
	justify-content: center;

	width: 100%;
}
```
`src > widgets > Sidebar > index.ts`
```TS
export { Sidebar } from './ui/Sidebar/Sidebar';
```

В роутере приложения элемент нужно обернуть во враппер страницы, который имеет свойство `flex-grow`, чтобы он занимал полностью размер своей флекс-колонки

`src > app > providers > router > ui > AppRouter.tsx
```TSX
export const AppRouter = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Routes>
				{Object.values(routeConfig).map(({ path, element }) => (
					<Route
						key={path}
						path={path}
						element={
							<Suspense fallback={<div>Loading...</div>}>
								<div className={'page-wrapper'}>{element}</div>
							</Suspense>
						}
					/>
				))}
			</Routes>
		</Suspense>
	);
};
```

Добавляем переменные размеров сайдбара

`src > app > variables > global.scss`
```SCSS
:root {
	--font-family-main: Montserrat, Roboto, sans-serif;

	--font-size-m: 16px;
	--font-line-m: 24px;
	--font-m: var(--font-size-m) / var(--font-line-m) var(--font-family-main);

	--font-size-l: 24px;
	--font-line-l: 32px;
	--font-l: var(--font-size-l) / var(--font-line-l) var(--font-family-main);

	--navbar-height: 50px;
	--sidebar-width: 300px;
	--sidebar-width-collpased: 80px;
}
```

Добавляем стили для отображения сайдбара и деления страницы на 2 части

`src > app > index.scss`
```SCSS
.content-page {
	display: flex;
}

.page-wrapper {
	flex-grow: 1;

	width: 100%;

	padding: 20px;
}
```

![](_png/Pasted%20image%2020230716113955.png)

### 15 i18n Интернационализация. Define plugin. Плагин для переводов





### 16 Webpack hot module replacement





### 17 Babel. Extract plugin [optional]





### 18 Настраиваем EsLint. Исправляем ошибки





### 19 Stylelint. Plugin for i18next





### 20 Тестовая среда. Настраиваем Jest. Пишем первый тест Метка





### 21 Несуществующие маршруты. Лоадер для загрузки страниц





### 22 Дополнение к модулю