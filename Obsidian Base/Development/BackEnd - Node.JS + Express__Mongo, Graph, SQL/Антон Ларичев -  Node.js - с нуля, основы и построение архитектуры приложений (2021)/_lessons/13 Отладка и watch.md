## 073 Eslint и prettier

Установи `prettier` и `eslint` вместе с плагинами, парсерами и конфигами

```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier typescript
```

- одиночные кавычки
- висячая `,`
- использование табов
- `;` в конце
- пробелы между фигурными скобочками
- максимальная длина
- конечная строка: автоматически

`.prettierrc`
```JSON
{
	"singleQuote": true,
	"trailingComma": "all",
	"useTabs": true,
	"semi": true,
	"bracketSpacing": true,
	"printWidth": 100,
	"endOfLine": "auto"
}
```

- `no-unused-vars` - не используемые переменные (включая функции и объекты) - отключено у нас
- `explicit-function-return-type` - нужно явно указывать, что возвращает функция 
- `no-explicit-any` - запрещает использовать `any` - убираем эту настройку

`.eslintrc`
```JSON
{
	"root": true,
	"parser": "@typescript-eslint/parser",
	"plugins": [
		"@typescript-eslint"
	],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended"
	],
	"rules": {
		"@typescript-eslint/ban-types": "off",
		"@typescript-eslint/no-unused-vars": [
			"off"
		],
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/explicit-function-return-type": [
			"warn"
		],
		"prettier/prettier": [
			"error",
			{
				"singleQuote": true,
				"useTabs": true,
				"semi": true,
				"trailingComma": "all",
				"bracketSpacing": true,
				"printWidth": 100,
				"endOfLine": "auto"
			}
		]
	}
}
```

Если мы будем работать в VSCode, то нужно будет сохранить эти настройки. Тут мы устанавливаем в качестве форматтиера `eslint` и форматирование будет происходить при сохранении

`.vscode > settings.json`
```JSON
{
	"[typescript]": {
		"editor.defaultFormatter": "dbaeumer.vscode-eslint"
	},
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	}
}
```

Далее нам нужно добавить эти два скрипта линтера, чтобы он форматировал все файлы в проекте

```JSON
"scripts": {
		"lint": "eslint ./src/**",
		"lint:fix": "eslint ./src/** --fix"
	},
```

Далее нам нужно будет протипизировать возвраты функции 

```TS
export interface IBootstrapReturn {
	app: App;
	appContainer: Container;
}

function bootstrap(): IBootstrapReturn {
	const appContainer = new Container();
	appContainer.load(appBindings);
	const app = appContainer.get<App>(TYPES.Application);
	app.init();
	return { appContainer, app };
}
```

Так же нужно будет проставить все невозвратные функции `void`

```TS
useRoutes(): void {
		this.app.use('/users', this.userController.router);
	}
```

Тут уже, так как функция асинхронная `async`, то она возвращает `Promise<void>`

```TS
public async init(): Promise<void> {
		this.useRoutes();
		this.useExeptionFilters();
		this.server = this.app.listen(this.port);
		this.logger.log(`Сервер запущен на http://localhost:${this.port}`);
	}
```

## 074 Подключение nodemon

`ts-node` - это плагин, который позволяет запускать приложения непосредственно на TS (компиляция происходит уже под капотом)

`nodemon` - это плагин, который будет перезагружать node-приложение после каждого сохранения изменений (работает почти как webpack, но на стороне сайта)

```bash
npm i -D nodemon ts-node
```

- `watch` - это та папка, за которой будет следить монитор
- `ext` - это расширения, за изменениями которых будет следить плагин
- `ignore` - указывает на то, что нужно игнорировать при перезапуске
- `exec` - путь до нашего основного файла приложения (а именно для его запуска)

`nodemon.json`
```JSON
{
	"watch": [
		"src"
	],
	"ext": "ts,json",
	"ignore": [
		"src/**/*.spec.ts"
	],
	"exec": "ts-node ./src/main.ts"
}
```

Так же данная строка в скриптах будет запускать сам монитор нод-приложения:

```JSON
"scripts": {
		"dev": "nodemon"
	},
```

И теперь при каждом изменении одного из файлов проекта будет перезагружаться наш сервер

![](_png/Pasted%20image%2020221202195820.png)

## 075 Отладка



```JSON
{
	"sourceMap": true,
}
```

`.vscode > launch.json`
```JSON
{
	"version": "0.2.0",
	"configurations": [
		{
			"type": "node",
			"request": "launch",
			"name": "nodemon",
			"runtimeExecutable": "${workspaceFolder}/node_modules/nodemon/bin/nodemon.js",
			"restart": true,
			"console": "integratedTerminal",
			"internalConsoleOptions": "neverOpen"
		}
	]
}
```











## 076 Анализ памяти






## 077 Мониторинг производительности








