
## 018 Планирование Time Tracking Приложения

В процессе этого модуля будет разрабатываться приложение отслеживания времени, затраченного на выполнение разных задач.

Задачи:
- Мы будем вписывать задачу и нажимать на плей
- Будет срабатывать таймер при нажатии на кнопку, который будет считать время, которое мы тратим на задачу
- После завершения задачи отключаем таймер на кнопку и задача записывается в журнал выполненных
- Все данные будут сохраняться на диск пользователя

![](_png/Pasted%20image%2020221114202410.png)

## 019 Начинаем Новое Приложение

Для начала мы должны запустить команды для генерации электрон-приложения, установки реакта, бабеля и нужно перекинуть WP в зависимости разработки

```bash
bozon new timer-react-app
npm install react react-dom
npm i babel-loader @babel/core @babel/preset-env @babel/preset-react --save-dev
npm i webpack --save-dev
```

И примерно так должен выглядеть наш `package.json`:

```JSON
{
  "name": "ElectronReactTimer",
  "version": "0.1.0",
  "description": "ElectronReactTimer application build with Electron",
  "author": {
    "name": "Lvov Valery",
    "email": ""
  },
  "repository": {},
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "license": "ISC",
  "devDependencies": {
    "@babel/core": "^7.20.2",
    "@babel/preset-env": "^7.20.2",
    "@babel/preset-react": "^7.18.6",
    "babel-loader": "^9.1.0",
    "bozon": "1.3.5",
    "jest": "29.3.1",
    "spectron": "19.0.0",
    "webpack": "^5.75.0"
  },
  "build": {
    "appId": "com.electron.electronreacttimer",
    "win": {
      "publish": null
    },
    "mac": {
      "publish": null,
      "category": "your.app.category.type"
    }
  }
}

```

Далее мы устанавливаем параметры для размеров окошка нашего приложения 

![](_png/Pasted%20image%2020221115180258.png)

Устанавливаем такие настройки для вебпака, чтобы бабель спокойно компилировал наш реакт-код

```JS
module.exports = {
	renderer: {
		entry: "./src/renderer/javascripts/index.js",
		module: {
			// Добавляем правило на преобразование бабелем наших файлов
			rules: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: {
						loader: "babel-loader",
						options: {
							presets: ["@babel/react", "@babel/preset-env"],
						},
					},
				},
			],
		},
	},
	preload: {
		entry: "./src/preload/index.js",
	},
	main: {
		entry: "./src/main/index.js",
	},
};

```

Делаем именно такой код HTML:
1) В `HEAD` нельзя ничего двигать
2) Будем реактом генерировать весь код в `div.root`

```HTML
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title></title>
  <script src="index.js" type="text/javascript"></script>
  <meta http-equiv="Content-Security-Policy" content="script-src 'self'">
</head>

<body>
  <div class="root" id="root"></div>
</body>

</html>
```

В файле основного процесса нашего приложения, можно реализовать импорт самого создания нашего таймера (так скажем - декомпозировать приложение) 

`main > index.js`
```JS
import TimerApp from "./app";

new TimerApp();
```

И всю логику по созданию приложения перенести в другой файл, а именно в `index.js` внутри другой папки - `app`

`main > app > index.js`
```JS
import { app, BrowserWindow } from "electron";

// Создаём класс, из которого и будем выполнять все вызовы функций
export default class TimerApp {
	// конструктор будет запускать окно браузера, когда приложение загрузится
	constructor() {
		this.subscribeForAppEvents();
		app.whenReady().then(() => this.createWindow());
	}

	// тут мы генерируем окно браузера
	createWindow() {
		// задаём настройки
		this.window = new BrowserWindow({
			title: CONFIG.name,
			width: CONFIG.width,
			height: CONFIG.height,
			webPreferences: {
				nodeIntegration: true,
				// worldSafeExecuteJavaScript: true,
				// preload: path.join(app.getAppPath(), "preload", "index.js"),
			},
		});

		// подгружаем index-файл
		this.window.loadFile("renderer/index.html");

		this.window.openDevTools({ mode: "detach" });

		// если окно закроется, то его не будет
		this.window.on("closed", () => {
			window = null;
		});
	}

	// подписываемся на события приложения
	subscribeForAppEvents() {
		app.on("window-all-closed", () => {
			if (process.platform !== "darwin") {
				app.quit();
			}
		});

		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				this.createWindow();
			}
		});
	}
}
```

Так выглядит структура папок основного приложения

![](_png/Pasted%20image%2020221115192616.png)

Дальше нам нужно реализовать файл ==React==-файл, который будет запускать нам реакт в нашем приложении

`renderer > javascripts > index.js`
```JSX
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
require("application.css");

window.onload = () => {
	const root = ReactDOM.createRoot(document.querySelector(".root"));
	root.render(<App />);
};
```

И в той же папке с основным файлом создаём папку `components/`, в который будем класть наши компоненты

`renderer > javascripts > components > App.js`
```JS
import React from "react";

const App = () => {
	return (
		<div>
			<h1>Привет, мир!</h1>
		</div>
	);
};

export default App;
```

И в итоге видим приложение, которое вполне себе поддерживает ==React==

![](_png/Pasted%20image%2020221115192845.png)

## 020 Интерфейс Создания Новой Записи



```JS
this.window = new BrowserWindow({
	title: CONFIG.name,
	width: CONFIG.width,
	height: CONFIG.height,
	// ограничиваем изменение размеров приложения
	minWidth: CONFIG.width,
	minHeight: CONFIG.height,
	maxWidth: CONFIG.width,
	maxHeight: CONFIG.height,
	// скрывает меню
	autoHideMenuBar: true,
	// убирает стоковый тайтл-бар системы
	titleBarStyle: "hidden",
	webPreferences: {
		nodeIntegration: true,
		// worldSafeExecuteJavaScript: true,
		// preload: path.join(app.getAppPath(), "preload", "index.js"),
	},
});
```

`index.html`
```HTML
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title></title>
  <script src="index.js" type="text/javascript"></script>
  <meta http-equiv="Content-Security-Policy" content="script-src 'self'">
</head>

<body>
  <div class="titlebar">Timer App</div>
  <div class="root" id="root"></div>
</body>

</html>
```

`layout.css`
```CSS
html,
body {
	padding: 0;
	margin: 0;
	height: 100%;
	overflow: hidden;
}

body {
	font-family: -apple-system, "Helvetica Neue", Helvetica, sans-serif;
}

.root {
	margin-top: 30px;
}

.titlebar {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 30px;
	line-height: 30px;
	background: #34495e;
	color: white;
	text-align: center;
	-webkit-app-region: drag;
}
```

`application.css`
```CSS
@import url("layout.css");
```





## 021 Интерфейс Списка Записей



## 022 Сохранение Данных на Жестком Диске



## 023 Реализация Таймера



## 024 Запуск Таймера в Интерфейсе Приложения



## 025 Вывод Списка Записей в Интерфейсе



## 026 Исправляем Баги Приложения










