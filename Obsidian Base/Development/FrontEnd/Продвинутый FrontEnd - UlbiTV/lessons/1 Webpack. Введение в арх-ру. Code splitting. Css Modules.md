
### 1 Начало разработки Основы Webpack. Добавляем TypeScript Метка

Первым делом нужно инициализировать проект 

```bash
 npm init -y
```

Далее нужно будет установить вебпак и первый плагин к нему

```bash
npm install webpack webpack-cli --save-dev
npm i -D html-webpack-plugin
```

Далее идёт настройка конфига вебпака

В `output` свойство `filename` отвечает за название того файла, который будет генерироваться. Конкретно тут используются шаблоны, конфигурирующие стандартное имя для файла и хеш: 
- `[name]` - выберет дефолтное имя по пути
- `[contenthash]` - будет добавлять хеш в название, чтобы браузер не сохранял закешированный файл

`webpack.config.js`
```JS
const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	// режим сборки проекта - для разработки
	mode: 'development',
	// входная точка в приложение
	entry: path.resolve(__dirname, 'src', 'index.ts'),
	// настройки того куда и как будет производиться сборка приложения
	output: {
		// имя файла для запуска собранного приложения
		// [name] - выберет дефолтное имя по пути
		// [contenthash] - будет добавлять хеш в название, чтобы браузер не сохранял закешированный файл
		filename: '[name].[contenthash].js',
		// тут будет находиться скомпилированный файл
		path: path.resolve(__dirname, 'build'),
		// очищает неиспользуемые файлы
		clean: true,
	},
	// плагины для сборки вебпака
	plugins: [
		// то плагин, который будет показывать прогресс сборки
		new webpack.ProgressPlugin(),
		// это плагин, который будет добавлять самостоятельно скрипт в наш index.html
		new HTMLWebpackPlugin({
	// указываем путь до базового шаблона той вёрстки, которая нужна в нашем проекте
			template: path.resolve(__dirname, 'public', 'index.html'),
		}),
	],
};
```

Тут сразу стоит сказать, что входных точек в проект может быть несколько

![](_png/17403e3683d44576452a428186eb653e.png)

Далее нам нужно будет добавить typescript и его лоадер, чтобы вебпак смог его обработать

```bash
npm install --save-dev typescript ts-loader
```

Добавим типы и обработчик ноды

```bash
npm install --save-dev typescript ts-node @types/node @types/webpack
```

Далее меняем расширение конфига и меняем входной файл на `.ts`. Добавляем `resolve` и `module`, в который поместим лоадер для обработки ts файлов

`webpack.config.ts`
```TS
import path from 'path';
import webpack from 'webpack';
import HTMLWebpackPlugin from 'html-webpack-plugin';

const webpackConfig: webpack.Configuration = {
	// режим сборки проекта - для разработки
	mode: 'development',
	// входная точка в приложение
	entry: path.resolve(__dirname, 'src', 'index.ts'),
	// настройки того куда и как будет производиться сборка приложения
	output: {
		// имя файла для запуска собранного приложения
		// [name] - выберет дефолтное имя по пути
		// [contenthash] - будет добавлять хеш в название, чтобы браузер не сохранял закешированный файл
		filename: '[name].[contenthash].js',
		// тут будет находиться скомпилированный файл
		path: path.resolve(__dirname, 'build'),
		// очищает неиспользуемые файлы
		clean: true,
	},
	// тут находятся подключения дополнительных модулей
	module: {
		// тут будут добавляться лоадеры, которые обрабатывают файлы вне js (ts, png, jpeg, svg...)
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	// тут мы указываем те файлы, при импорте которых мы не будем указывать расширения
	// import Component from './component'
	resolve: {
		// указываем расширения
		extensions: ['.tsx', '.ts', '.js'],
	},
	// плагины для сборки вебпака
	plugins: [
		// то плагин, который будет показывать прогресс сборки
		new webpack.ProgressPlugin(),
		// это плагин, который будет добавлять самостоятельно скрипт в наш index.html
		new HTMLWebpackPlugin({
			// указываем путь до базового шаблона той вёрстки, которая нужна в нашем проекте
			template: path.resolve(__dirname, 'public', 'index.html'),
		}),
	],
};

export default webpackConfig;
```

Для работы нодовских пакетов, нормальных импортов и модулей в целом, нужно добавить такой конфиг в проект:

`tsconfig.json`
```JSON
{  
    "compilerOptions": {  
       // постановка всех путей от начала папки проекта  
       "baseUrl": ".",  
       "paths": {  
          "@/*": ["./src/*"]  
       },  
       "outDir": "./dist/",  
       "noImplicitAny": true,  
       // современные модули  
       "module": "ESNext",  
       "target": "es5",  
       // устанавливаем данное значение, чтобы не было необходимости импортировать React  
       "jsx": "react-jsx",  
       "allowJs": true,  
       "strict": true,  
       "moduleResolution": "node",  
       "esModuleInterop": true,  
       // позволяет использовать обычные импорты вместо CommonJS  
       "isolatedModules": true,  
       // убирает потребность писать * as для импорта нодовских пакетов  
       "allowSyntheticDefaultImports": true  
    },  
    "include": [  
       "./src/**/*.ts",  
       "./src/**/*.tsx"  
    ],  
    // настройки импортов нодовских плагинов  
    "ts-node": {  
       "compilerOptions": {  
          "module": "CommonJS"  
       }  
    }  
}
```

И примерно так выглядит итоговый проект

![](_png/62f6a672c563123733be022d3da9b2ae.png)

### 2 Декомпозиция конфига. Опции конфигурации

Далее перед нами встанет задача разбить конфигурацию вебпака на несколько разных файлов, чтобы было проще поддерживать разрастающийся конфиг

Первым делом нужно будет описать типы тех данных, что будет принимать в себя конфиг:
- типы режима (разработка | продакшн)
- пути

`config > build > types > config.ts`
```TS
// режим, в котором мы находимся
export type BuildMode = 'production' | 'development';

// это будет объект со строками путей
export interface BuildPaths {
	entry: string;
	build: string;
	html: string;
}

// опции, которые будет принимать вебпак
export interface BuildOptions {
	mode: BuildMode;
	paths: BuildPaths;
	isDev: boolean;
}
```

Далее нам нужно будет вынести плагины в отдельную функцию, которая будет принимать в себя объект конфига и брать из него пути, чтобы сослаться на html

`config > build > buildPlugins.ts`
```TS
import { WebpackPluginInstance, ProgressPlugin } from 'webpack';
import HTMLWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { BuildOptions } from './types/config';

export function buildPlugins({ paths }: BuildOptions): WebpackPluginInstance[] {
	return [
		// то плагин, который будет показывать прогресс сборки
		new ProgressPlugin(),
		// это плагин, который будет добавлять самостоятельно скрипт в наш index.html
		new HTMLWebpackPlugin({
			// указываем путь до базового шаблона той вёрстки, которая нужна в нашем проекте
			template: paths.html,
		}),
	];
}
```

Далее нужно будет вынести лоадеры в отдельный файл, так как их будет много. 

Некоторые лоадеры нужно будет вынести в константы, чтобы было проще отслеживать последовательность их выполнения (потому что это может играть роль в работе приложения)

`config > build > buildLoaders.ts`
```TS
import { RuleSetRule } from 'webpack';

export function buildLoaders(): RuleSetRule[] {
	
	const typescriptLoader = {
		test: /\.tsx?$/,
		use: 'ts-loader',
		exclude: /node_modules/,
	};

	return [typescriptLoader];
}
```

Далее выносим резолверы в отдельную функцию

`config > build > buildResolvers.ts`
```TS
import { ResolveOptions } from 'webpack';

export function buildResolvers(): ResolveOptions {
	return {
		// указываем расширения
		extensions: ['.tsx', '.ts', '.js'],
	};
}
```

Выносим остальную часть конфига в отдельную функцию, которая будет принимать в себя опции конфига. Тут же и вызываем все функции для сборки остальных частей конфига вебпака

`config > build > buildWebpackConfig.ts`
```TS
import { Configuration } from 'webpack';
import { BuildOptions } from './types/config';
import { buildLoaders } from './buildLoaders';
import { buildResolvers } from './buildResolvers';
import { buildPlugins } from './buildPlugins';

export function buildWebpackConfig(options: BuildOptions): Configuration {
	const { mode, paths } = options;

	return {
		// режим сборки проекта - для разработки
		mode: mode,
		// входная точка в приложение
		entry: paths.entry,
		// настройки того куда и как будет производиться сборка приложения
		output: {
			// имя файла для запуска собранного приложения
			// [name] - выберет дефолтное имя по пути
			// [contenthash] - будет добавлять хеш в название, чтобы браузер не сохранял закешированный файл
			filename: '[name].[contenthash].js',
			// тут будет находиться скомпилированный файл
			path: paths.build,
			// очищает неиспользуемые файлы
			clean: true,
		},
		// тут находятся подключения дополнительных модулей
		module: {
			// тут будут добавляться лоадеры, которые обрабатывают файлы вне js (ts, png, jpeg, svg...)
			rules: buildLoaders(),
		},
		// тут мы указываем те файлы, при импорте которых мы не будем указывать расширения
		// import Component from './component'
		resolve: buildResolvers(),
		// плагины для сборки вебпака
		plugins: buildPlugins(options),
	};
}
```

В основном файле конфига добавляем переменные путей и разработки, чтобы можно было их контролировать из одного места и вызываем `buildWebpackConfig()`, чтобы собрать вебпак конфиг

`webpack.config.ts`
```TS
import path from 'path';
import { Configuration } from 'webpack';
import { buildWebpackConfig } from './config/build/buildWebpackConfig';
import { BuildPaths } from './config/build/types/config';

const paths: BuildPaths = {
	build: path.resolve(__dirname, 'build'),
	entry: path.resolve(__dirname, 'src', 'index.ts'),
	html: path.resolve(__dirname, 'public', 'index.html'),
};

const mode = 'development';
const isDev = mode === 'development';

const webpackConfig: Configuration = buildWebpackConfig({
	mode,
	paths,
	isDev,
});

export default webpackConfig;
```

И примерно так выглядит проект в конце:

![](_png/456fad7191148ca56fd9a891ab4445b0.png)

### 3 Webpack-dev-server. Переменные окружения (env)

Установим модуль девсервера для вебпака

```bash
npm i -D webpack-dev-server @types/webpack-dev-server
```

Далее нужно будет создать отдельную функцию конфига под сервер

`config > build > buildDevServer.ts`
```TS
import { BuildOptions } from './types/config';
import { Configuration } from 'webpack-dev-server'; // импортируем конфигурацию отсюда

export function buildDevServer(options: BuildOptions): Configuration {
	return {
		port: options.port, // порт
		// open: true // автоматически будет открывать страницу в браузере
	};
}
```

Добавляем в основной конфиг два свойства:
- devtool - будет формировать мэпы внутри файлов 
- devServer - хранит конфиг для девсервера. Если мы находимся в продакшене, то нам не нужен конфиг

`config > build > buildWebpackConfig.ts`
```TS
import { Configuration } from 'webpack';
import { BuildOptions } from './types/config';
import { buildLoaders } from './buildLoaders';
import { buildResolvers } from './buildResolvers';
import { buildPlugins } from './buildPlugins';
import { buildDevServer } from './buildDevServer';

export function buildWebpackConfig(options: BuildOptions): Configuration {
	const { mode, paths, isDev } = options;

	return {
		mode: mode,
		entry: paths.entry,
		output: {
			filename: '[name].[contenthash].js',
			path: paths.build,
			clean: true,
		},
		module: {
			rules: buildLoaders(),
		},
		resolve: buildResolvers(),
		plugins: buildPlugins(options),
		// позволяет показать, где в коде произошла ошибка
		devtool: isDev ? 'inline-source-map' : undefined,
		// будет запускать девсервер, который будет рефрешить страницу
		devServer: isDev ? buildDevServer(options) : undefined,
	};
}
```

Добавим в конфиг `BuildEnv`, который будет отвечать за попадаемые переменные окружения и добавим порт в `BuildOptions`, на котором будет запускаться приложение

`config > build > types > config.ts`
```TS
// режим, в котором мы находимся
export type BuildMode = 'production' | 'development';

// это будет объект со строками путей
export interface BuildPaths {
	entry: string;
	build: string;
	html: string;
}

// интерфейс переменных окружения, которые будут попадать в конфиг
export interface BuildEnv {
	mode: BuildMode;
	port: number;
}

// опции, которые будет принимать вебпак
export interface BuildOptions {
	mode: BuildMode;
	paths: BuildPaths;
	isDev: boolean;
	port: number;
}
```

Чтобы переменные окружения попадали в конфиг, его нужно обернуть в функцию, которая будет принимать в себя `env`. После уже можно будет воспользоваться данными переменными и задать порт для приложения

`webpack.config.ts`
```TS
import path from 'path';
import { Configuration } from 'webpack';
import { buildWebpackConfig } from './config/build/buildWebpackConfig';
import { BuildEnv, BuildPaths } from './config/build/types/config';

export default (env: BuildEnv) => {
	const paths: BuildPaths = {
		build: path.resolve(__dirname, 'build'),
		entry: path.resolve(__dirname, 'src', 'index.ts'),
		html: path.resolve(__dirname, 'public', 'index.html'),
	};

	const mode = env.mode || 'development';
	const isDev = mode === 'development';
	const PORT = env.port || 3000;

	const webpackConfig: Configuration = buildWebpackConfig({
		mode,
		paths,
		isDev,
		port: PORT,
	});

	return webpackConfig;
};
```

Теперь можно добавить три команды, которые будут выполнять разную сборку проекта

`package.json`
```JSON
"scripts": {
	"start": "webpack serve --env port=3000",
	"build:prod": "webpack --env mode=production",
	"build:dev": "webpack --env mode=development"
},
```

### 4 Подключаем React и настраиваем css в webpack метка

Устанавливаем зависимости реакта

```bash
npm i react react-dom
npm i -D @types/react @types/react-dom
```

Устанавливаем зависимости лоадеров

```bash
npm install sass-loader sass webpack style-loader css-loader --save-dev
```

Далее нужно добавить правила для лоадеров в конфиг `buildLoaders()`

`config > build > buildLoaders.ts`
```TS
import { RuleSetRule } from 'webpack';

export function buildLoaders(): RuleSetRule[] {
	// так как порядок некоторых лоадеров важен, то важные лоадеры можно выносить в отдельные переменные
	const typescriptLoader = {
		test: /\.tsx?$/,
		use: 'ts-loader',
		exclude: /node_modules/,
	};

	const stylesLoader = {
		test: /\.s[ac]ss$/i,
		use: [
			// Creates `style` nodes from JS strings
			'style-loader',
			// Translates CSS into CommonJS
			'css-loader',
			// Compiles Sass to CSS
			'sass-loader',
		],
	};

	return [typescriptLoader, stylesLoader];
}
```

Корневой компонент, которому мы поменяли расширение на TSX

`src > index.tsx`
```TSX
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/app/App';

const root = createRoot(document.getElementById('root'));
root.render(
	<StrictMode>
		<App />
	</StrictMode>,
);
```

Так же нужно не забывать менять путь к entry-файлу в приложении

![](_png/02c0360671600143178f51dbc3110aaf.png)

Сам компонент с подключенными стилями

`src > components > app > App.tsx`
```TSX
import React from 'react';
import './App.scss';

export const App = () => {
	return (
		<div>
			<h1>Hello, world!</h1>
		</div>
	);
};
```

Стили

`src > components > app > App.scss`
```SCSS
h1 {
	font-size: 74px;
}
```

![](_png/46fca3ed49da3c62fc9f1ac7d598498e.png)

### 5 Настраиваем css modules

Цель: реализовать подключение модульных и глобальных стилей

```TSX
import React from 'react';
import styles from './App.module.scss';

export const App = () => {
	return (
		<div className='app'>
			<h1 className={styles.title}>Hello, world!~~~~~</h1>
		</div>
	);
};
```

![](_png/1904bb4dc5d213fdb322965780eb4e13.png)

Первым делом нужно установить экстрактор, который будет отделять чанки 

```bash
npm install --save-dev mini-css-extract-plugin
```

Далее в конфигурацию плагинов нужно добавить `MiniCssExtractPlugin`, внутри которого нужно будет определить наименования собранных css-файлов

`config > build > buildPlugins.ts`
```TS
import { WebpackPluginInstance, ProgressPlugin } from 'webpack';
import HTMLWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { BuildOptions } from './types/config';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export function buildPlugins({ paths }: BuildOptions): WebpackPluginInstance[] {
	return [
		// то плагин, который будет показывать прогресс сборки
		new ProgressPlugin(),
		// это плагин, который будет добавлять самостоятельно скрипт в наш index.html
		new HTMLWebpackPlugin({
			// указываем путь до базового шаблона той вёрстки, которая нужна в нашем проекте
			template: paths.html,
		}),
		// этот плагин будет отвечать за отделение чанков с css от файлов JS
		new MiniCssExtractPlugin({
			filename: 'css/[name].[contenthash:8].css',
			chunkFilename: 'css/[name].[contenthash:8].css',
		}),
	];
}
```

В лоадерах нужно настроить `style-loader` и экстрактор, чтобы они работали в разное время (прод/дев) и нужно настроить `css-loader`, чтобы он поддерживал модули в названиях файлов и транспилировал их в объекты, которые поддерживаются JS

`config > build > buildLoaders.ts`
```TS
import { RuleSetRule } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { BuildOptions } from './types/config';

export function buildLoaders({ isDev }: BuildOptions): RuleSetRule[] {
	// так как порядок некоторых лоадеров важен, то важные лоадеры можно выносить в отдельные переменные
	const typescriptLoader = {
		test: /\.tsx?$/,
		use: 'ts-loader',
		exclude: /node_modules/,
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

	return [typescriptLoader, stylesLoader];
}
```

Так же нужно добавить глобальные типы, которые определят то, что находится внутри импортируемых модулей стилей - без этого TS не поймёт, что импортируется из модульных стилей

`src > global.d.ts`
```TS
declare module '*.scss' {
	interface IClassNames {
		[className: string]: string;
	}
	const classNames: IClassNames;
	export = classNames;
}
```

И теперь работают все стили приложения

![](_png/9bdc26becf60b47778c2edab930756da.png)

### 6 Роутинг Code splitting Lazy Suspence метка

Первым делом нужно установить роутер и его 

```bash
npm i react-router-dom
npm i -D @types/react-router-dom
```

Code Splitting, Lazy Loading, Async Chunks - это всё механизмы подгрузки данных на страницу по необходимости. 

Конкретно мы имеем SPA и несколько страниц в рамках него и их всех стоило бы подгружать ровно тогда, когда он на них перейдёт. 

В обычном случае у нас генерируется один бандл со всеми страницами, а нужно, чтобы генерировалось несколько 

![](_png/8f36c962d16b40aa00f7f204db8d33ed.png)

Оборачиваем всё приложение в `BrowserRouter`, чтобы работали роуты 

`src > index.tsx`
```TSX
import { BrowserRouter } from 'react-router-dom';

const root = createRoot(document.getElementById('root'));
root.render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</StrictMode>,
);
```

Далее нужно добавить опцию `historyApiFallback`, чтобы проксировать все запросы через index. Это нужно, чтобы страница не выдавала ошибку при перезагрузке, если это не стартовая страница

`config > build > buildDevServer.ts
```TS
import { BuildOptions } from './types/config';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';

export function buildDevServer(options: BuildOptions): DevServerConfiguration {
	return {
		port: options.port, // порт
		// open: true, // автоматически будет открывать страницу в браузере
		// данная команда позволяет проксиовать запросы через index страницу, чтобы при обновлении страницы не выпадала ошибка
		historyApiFallback: true,
	};
}
```

Далее нужно реализовать две страницы в приложении

`src > pages > AboutPage.tsx`
```TSX
import React from 'react';

const AboutPage = () => {
	return <div>AboutPage</div>;
};

export default AboutPage;
```

`src > pages > MainPage.tsx`
```TSX
import React from 'react';

const MainPage = () => {
	return <div>MainPage</div>;
};

export default MainPage;
```

И тут же мы создадим их lazy-варианты, чтобы они подгружались только тогда, когда мы на них заходим

Такой подход будет говорить webpack, что мы хотим выделить эти страницы в отдельные бандлы, чтобы они подгружались только при необходимости

`src > pages > AboutPage.async.tsx`
```TSX
import { lazy } from 'react';

export const AboutPageAsync = lazy(() => import('./AboutPage'));
```

`src > pages > MainPage.async.tsx`
```TSX
import { lazy } from 'react';

export const MainPageAsync = lazy(() => import('./MainPage'));
```

И в корневом компоненте `App` нужно реализовать сам роутинг. 

Вместо обычных страниц, нужно использовать их асинхронные версии, чтобы они уходили в отдельный бандл.

Реакт обязует нас использовать компонент `Suspense` вместе с асинхронными компонентами, чтобы пользователь знал, что идёт подзагрузка страницы. 

`src > components > app > App.tsx`
```TSX
import React, { Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import styles from './App.module.scss';
import { MainPageAsync } from '../../pages/MainPage/MainPage.async';
import { AboutPageAsync } from '../../pages/AboutPage/AboutPage.async';

export const App = () => {
	return (
		<div className='app'>
			<Link to={'/'}>Главная</Link>
			<Link to={'/about'}>О нас</Link>
			<Suspense fallback={<div>Loading...</div>}>
				<Routes>
					<Route path={'/'} element={<MainPageAsync />} />
					<Route path={'/about'} element={<AboutPageAsync />} />
				</Routes>
			</Suspense>
		</div>
	);
};
```

И теперь у нас подгружается только те страницы, на которые мы зашли

![](_png/741b063975eda5e50626c2c37c407f40.png)

### 7 Организация стилей. Добавляем темы

Цель: нам нужно организовать стили между разными файлами, организовать быструю смену тем

В приложении будут использоватся css-переменные вместо переменных SASS.

Стили будут распределены подобным образом (reset.scss находится [тут](../../../Tips&Tricks/Reset&Reboot.md)):

`src > styles > index.scss`
```SCSS
@import "./variables/global";

@import "./default/base";
@import "./default/reset";

@import "./themes/dark";
@import "./themes/light";

.app {
	font: var(--font-m);

	background: var(--bg-color);
	color: var(--primary-color);

	min-height: 100vh;
}

.button {
	padding: 10px;

	border: 1px solid black;
}
```

`src > styles > variables > global.scss`
```SCSS
:root {
	--font-family-main: Montserrat, Roboto, sans-serif;

	--font-size-m: 16px;
	--font-line-m: 24px;
	--font-m: var(--font-size-m) / var(--font-line-m) var(--font-family-main);

	--font-size-l: 24px;
	--font-line-l: 32px;
	--font-l: var(--font-size-l) / var(--font-line-l) var(--font-family-main);
}
```

`src > styles > themes > light.scss`
```SCSS
.app.light {
	--bg-color: #fff;

	--accent-color: #d4c17f;
	--primary-color: #242b33;
	--secondary-color: #e7e7e7;
}
```

`src > styles > themes > dark.scss`
```SCSS
.app.dark {
	--bg-color: #242b33;

	--accent-color: #d4c17f;
	--primary-color: #fff;
	--secondary-color: #e7e7e7;
}
```

И первым делом, что нужно сделать для глобального сохранения состояния темы - это создать контекст, который будет в себе хранить функцию смены темы и само значение темы 

`src > theme > ThemeContext.ts`
```TS
import { createContext } from 'react';

// перечисление возможных вариантов темы
export enum Theme {
	LIGHT = 'light',
	DARK = 'dark',
}

export interface IThemeContextProps {
	theme?: Theme;
	setTheme?: (theme: Theme) => void;
}

// глобальный контекст
export const ThemeContext = createContext<IThemeContextProps>({});

// ключ, по которому будем доставать тему из локального хранилища
export const LOCAL_STORAGE_THEME_KEY = 'theme';
```

Далее нужно будет реализовать провайдер контекста, в который мы обернём всё приложение

`src > theme > ThemeProvider.ts`
```TSX
import React, { DetailedHTMLProps, FC, HTMLAttributes, ReactNode, useMemo, useState } from 'react';
import { LOCAL_STORAGE_THEME_KEY, Theme, ThemeContext } from './ThemeContext';

// тут мы получаем саму тему из локального хранилища, и если её нет, то устанавливается светлая по умолчанию
const defaultTheme = (localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme) || Theme.LIGHT;

export interface ThemeProviderProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	children: ReactNode;
}

const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
	const [theme, setTheme] = useState<Theme>(defaultTheme);

	// мемоизируем объект, чтобы каждый раз при перерендере он не соаздавался заново
	const defaultProps = useMemo(() => ({
			theme,
			setTheme: setTheme,
		}),
		[theme],
	);

	return (
		<ThemeContext.Provider value={defaultProps}>
			{children}
		</ThemeContext.Provider>
	);
};

export default ThemeProvider;
```

И уже потом оборачиваем всё приложение в провайдер

`src > index.tsx`
```TSX
const root = createRoot(document.getElementById('root'));
root.render(
	<StrictMode>
		<BrowserRouter>
			<ThemeProvider>
				<App />
			</ThemeProvider>
		</BrowserRouter>
	</StrictMode>,
);
```

Тут реализован хук получения функции изменения темы и самой темы

`src > theme > useTheme.tsx
```TSX
import { LOCAL_STORAGE_THEME_KEY, Theme, ThemeContext } from './ThemeContext';
import { useContext } from 'react';

export interface IUseTheme {
	toggleTheme: () => void;
	theme: Theme;
}

export function useTheme(): IUseTheme {
	const { theme, setTheme } = useContext(ThemeContext);

	const toggleTheme = () => {
		const newTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
		setTheme(newTheme);
		localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
	};

	return { toggleTheme, theme };
}
```

И далее просто получаем функцию смены темы и саму тему в корневом компоненте приложения 

`src > components > app > App.tsx`
```TSX
import React, { Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import cn from 'classnames';
import styles from './App.module.scss';
import '../../styles/index.scss';
import { MainPageAsync } from '../../pages/MainPage/MainPage.async';
import { AboutPageAsync } from '../../pages/AboutPage/AboutPage.async';
import { Theme } from '../../theme/ThemeContext';
import { useTheme } from '../../theme/useTheme';

export const App = () => {
	const { toggleTheme, theme } = useTheme();

	return (
		<div
			className={cn('app', {
				['light']: theme === Theme.LIGHT,
				['dark']: theme === Theme.DARK,
			})}
		>
			<button className={'button'} onClick={toggleTheme}>
				toggle
			</button>
			<Link to={'/'}>Главная</Link>
			<Link to={'/about'}>О нас</Link>
			<Suspense fallback={<div>Loading...</div>}>
				<Routes>
					<Route path={'/'} element={<MainPageAsync />} />
					<Route path={'/about'} element={<AboutPageAsync />} />
				</Routes>
			</Suspense>
		</div>
	);
};
```

В итоге мы имеем смену темы по кнопке и сохранение её в локальном хранилище

![](_png/c4f2cc181f3ffd77f57c8b0a6337d9d3.png)

### 8 classNames создаем git репозиторий

Цель: реализовать свой хелпер для добавления нескольких классов

Ниже представлена реализация замены библиотеке `classnames` (или `clsx`), которая будет принимать в себя классы по условию и массив различных классов

`src > helpers > classNames > classNames.ts`
```TS
/** тип объекта с классами */  
type ClassObject = {  
    [key: string]: boolean;  
};  
  
/** аргументы функции cn */  
type TClassValue = string | number | boolean | null | undefined | ClassObject;  
  
/**  
 * функция для сборки классов * @param {Array} args - аргументы для билда классов  
 * @returns {String} string - результирующая строка  
 * */export const cn = (...args: TClassValue[]): string => {  
    const classes: string[] = [];  
  
    args.forEach((arg: TClassValue) => {  
       if (Array.isArray(arg)) {  
          classes.push(...arg.filter(Boolean).map(String));  
       } else if (typeof arg === 'string') {  
          classes.push(arg);  
       } else if (typeof arg === 'object' && arg !== null) {  
          Object.keys(arg).forEach((key) => {  
             if (arg[key]) {  
                classes.push(key);  
             }  
          });  
       }  
    });  
  
    return classes.join(' ');  
};
```

Тут представлено использование функции

`src > components > app > App.tsx
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
			<Suspense fallback={<div>Loading...</div>}>
				<Routes>
					<Route path={'/'} element={<MainPageAsync />} />
					<Route path={'/about'} element={<AboutPageAsync />} />
				</Routes>
			</Suspense>
		</div>
	);
};
```

### 9 Архитектура. введение. Теория

В данном проекте будет использоваться архитектура [FSD](https://feature-sliced.design/ru/docs/get-started/overview), которая предоставляет оптимальную организацию проекта фронтенд приложения

[FSD](../../../Architecture/FSD.md) предоставляет архитектуру, которая делит приложение на 7 компонентов, каждое из которых делится на слайсы:
1. `shared` — переиспользуемый код, не имеющий отношения к специфике приложения/бизнеса.(например, UIKit, libs, API)
2. `entities` (сущности) — бизнес-сущности.(например, User, Product, Order)
3. `features` (фичи) — взаимодействия с пользователем, действия, которые несут бизнес-ценность для пользователя.(например, SendComment, AddToCart, UsersSearch)
4. `widgets` (виджеты) — композиционный слой для соединения сущностей и фич в самостоятельные блоки(например, IssuesList, UserProfile).
5. `pages` (страницы) — композиционный слой для сборки полноценных страниц из сущностей, фич и виджетов.
6. `processes` (процессы, устаревший слой) — сложные сценарии, покрывающие несколько страниц.(например, авторизация)
7. `app` — настройки, стили и провайдеры для всего приложения.

### 10 Архитектура. Начинаем внедрять. Основы метка

Первым делом, нужно настроить абсолютные пути в самом конфиге TS

`tsconfig.json`
```JSON
// постановка всех путей от начала папки проекта
"baseUrl": ".",
// настраивает абсолютный импорт начиная с папки src
"paths": {
	"*": [
		"./src/*"
	]
},
```

Далее нужно добавить в интерфейс свойство базового пути конфига

`config > build > types > config.ts
```TS
export interface BuildPaths {
	entry: string;
	build: string;
	html: string;
	src: string;
}
```

И далее добавим путь до папки `src`

`webpack.config.ts
```TS
export default (env: BuildEnv) => {
	const paths: BuildPaths = {
		build: path.resolve(__dirname, 'build'),
		entry: path.resolve(__dirname, 'src', 'index.tsx'),
		html: path.resolve(__dirname, 'public', 'index.html'),
		src: path.resolve(__dirname, 'src'),
	};

	const mode = env.mode || 'development';
	const isDev = mode === 'development';
	const PORT = env.port || 3000;

	const webpackConfig: Configuration = buildWebpackConfig({
		mode,
		paths,
		isDev,
		port: PORT,
	});

	return webpackConfig;
};
```

Этот путь нужен был для настройки конфига `buildResolvers`, в котором нужно указать настройки абсолютных путей (`preferAbsolute`, `modules`, `mainFields`, `alias`)

`config > build > buildResolvers.ts`
```TS
import { ResolveOptions } from 'webpack';
import { BuildOptions } from './types/config';

export function buildResolvers(options: BuildOptions): ResolveOptions {
	return {
		// указываем расширения файлов, которые не нужно будет указывать при импорте
		extensions: ['.tsx', '.ts', '.js', '.scss'],
		// абсолютные пути будут приоритетнее
		preferAbsolute: true,
		// абсолютные пути, от которых идут импорты
		modules: [options.paths.src, 'node_modules'],
		// основной файл для каждой папки
		// mainFields: ['index'], // не работает react-router из-за этого свойства
		// настройки обозначений абсолютных путей - тут просто будет путь
		alias: {},
	};
}
```

Далее нужно перекомпоновать проект следующим образом:

![](_png/996fc3600fa46a23000adcd30a07c130.png)

Все компоненты страниц, которые связаны с отображением, идут в папку `ui`. Из неё экспортируем асинхронный компонент, который будем использовать в `App`

`pages > MainPage > index.ts`
```TS
export { MainPageAsync as MainPage } from './ui/MainPage.async';
```

`pages > AboutPage > index.ts`
```TS
export { AboutPageAsync as AboutPage } from './ui/AboutPage.async';
```

И далее редактируем импорты и имена компонентов

`src > app > App.tsx`
```TSX
import { MainPage } from 'pages/MainPage';
import { AboutPage } from 'pages/AboutPage';

export const App = () => {
	const { toggleTheme, theme } = useTheme();

	return (
		<div className={classNames('app', {}, [theme])}>
			<button className={'button'} onClick={toggleTheme}>
				toggle
			</button>
			<Link to={'/'}>Главная</Link>
			<Link to={'/about'}>О нас</Link>
			<Suspense fallback={<div>Loading...</div>}>
				<Routes>
					<Route path={'/'} element={<MainPage />} />
					<Route path={'/about'} element={<AboutPage />} />
				</Routes>
			</Suspense>
		</div>
	);
};
```
