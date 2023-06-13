
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
    "jsx": "react",
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



```bash
npm i -D webpack-dev-server @types/webpack-dev-server
```




### 4 Подключаем React и настраиваем css в webpack метка







### 5 Настраиваем css modules






### 6 Роутинг Code splitting Lazy Suspence метка






### 7 Организация стилей. Добавляем темы






### 8 classNames создаем git репозиторий






### 9 Архитектура. введение. Теория






### 10 Архитектура. Начинаем внедрять. Основы метка









