
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

![](_png/Pasted%20image%2020230613112643.png)

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
    "outDir": "./dist/",
    "noImplicitAny": true,
    // современные модули
    "module": "ESNext",
    "target": "es5",
    // устанавливаем данное значение, чтобы не было необходимости импортировать React
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "node",
    // позволяет использовать обычные импорты вместо CommonJS
    "esModuleInterop": true,
    // убирает потребность писать * as для импорта нодовских пакетов
    "allowSyntheticDefaultImports": true
  },
  // настройки импортов нодовских плагинов
  "ts-node": {
    "compilerOptions": {
      "module": "CommonJS"
    }
  }
}
```

И примерно так выглядит итоговый проект

![](_png/Pasted%20image%2020230613122038.png)

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

![](_png/Pasted%20image%2020230613134205.png)

### 3 Webpack-dev-server. Переменные окружения (env)

Установим модуль девсервера для вебпака

```bash
npm i -D webpack-dev-server @types/webpack-dev-server
```

Далее нужно будет создать отдельную функцию конфига под сервер

`config > build > buildDevServer.ts`
```TS
import { BuildOptions } from './types/config';
import { Configuration } from 'webpack-dev-server';

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

![](_png/Pasted%20image%2020230613163119.png)

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

`src > components > app > App.scss
```SCSS
h1 {
	font-size: 74px;
}
```

![](_png/Pasted%20image%2020230613162855.png)

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

![](_png/Pasted%20image%2020230613181223.png)

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

В лоадерах нужно настроить `style-loader` и экстрактор, чтобы они работали в разно время (прод/дев) и нужно настроить `css-loader`, чтобы он поддерживал модули в названиях файлов и транспилировал их в объекты, которые поддерживаются JS

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

![](_png/Pasted%20image%2020230613181243.png)

### 6 Роутинг Code splitting Lazy Suspence метка

Первым делом нужно установить роутер и его 

```bash
npm i react-router-dom
npm i -D @types/react-router-dom
```

Code Splitting, Lazy Loading, Async Chunks - это всё механизмы подгрузки данных на страницу по необходимости. 

Конкретно мы имеем SPA и несколько страниц в рамках него и их всех стоило бы подгружать ровно тогда, когда он на них перейдёт. 

В обычном случае у нас генер 

![](_png/Pasted%20image%2020230614074324.png)




### 7 Организация стилей. Добавляем темы






### 8 classNames создаем git репозиторий






### 9 Архитектура. введение. Теория






### 10 Архитектура. Начинаем внедрять. Основы метка









