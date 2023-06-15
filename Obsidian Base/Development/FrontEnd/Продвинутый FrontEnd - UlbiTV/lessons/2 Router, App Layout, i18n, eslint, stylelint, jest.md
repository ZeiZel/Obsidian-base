
### 11 AppRouter. Конфиг для роутера

Первым делом нужно реализовать конфиг для роутера, который будет содержать пути 

`src > shared > config > routeConfig > routeConfig.tsx`
```TSX
import { RouteProps } from 'react-router-dom';
import { MainPage } from 'pages/MainPage';
import { AboutPage } from 'pages/AboutPage';

export enum AppRoutes {
	MAIN = 'main',
	ABOUT = 'about',
}

export const RoutePath: Record<AppRoutes, string> = {
	[AppRoutes.MAIN]: '/',
	[AppRoutes.ABOUT]: '/about',
};

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



`src > app > providers > ui > AppRouter.tsx`
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



`src > app > providers > index.ts`
```TS
export { AppRouter } from './ui/AppRouter';
```


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