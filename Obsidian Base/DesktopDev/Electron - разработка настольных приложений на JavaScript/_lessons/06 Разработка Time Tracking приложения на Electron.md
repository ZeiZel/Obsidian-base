
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

В процессе реализации интерфейса нам понадобится лоадер для обработки svg-иконок

```bash
 npm install react-svg-loader --save-dev
```

Тут подключаем лоадер для svg-иконок

`webpack.config.js`
```JS
module.exports = {
	renderer: {
		entry: "./src/renderer/javascripts/index.js",
		module: {
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
				// Добавляем обработчик svg
				{
					test: /\.svg$/,
					use: [
						{
							loader: "babel-loader",
						},
						{
							loader: "react-svg-loader",
						},
					],
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

Убираем возможность менять размер нашего приложения, а так же скрываем стандартный тайтлбар, так как мы сделаем свой

`main > app > index.js`
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

Тут добавим наш тайтлбар с названием приложения

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

Это основной файл стилей, в котором нужно будет подключить как отдельные стили, так и стили для наших компонентов

`application.css`
```CSS
@import url("layout.css");

@import url("components/new-entry.css");
@import url("components/entries.css");
```

Вынесем стили лейаута в отдельный файл. В лейауте приложения нужно будет применить стили шрифта приложения не только для всей страницы, но и в частности для поля текста. Так же нужно будет застилизировать `titlebar`. Свойство `-webkit-app-region: drag;` даст нам возможность перетягивать приложение за этот участок

`layout.css`
```CSS
html,
body {
	padding: 0;
	margin: 0;
	height: 100%;
	overflow: hidden;
}

/* textarea не наследует шрифт от body, поэтому его нужно будет сюда вставить */
body, textarea {
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

Тут мы стилизируем компонент, в котором мы создаём новые *entry*-записи

`stylesheets > components > new-entry.css`
```CSS
.new-entry {
	display: flex;
	padding: 15px 10px;
	border-bottom: 1px solid #f0f0f0;
}

.new-entry .details {
	/* займёт 2/3 пространства */
	flex: 2;
}

.new-entry .actions {
	/* займёт 1/3 пространства */
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.new-entry .trigger {
	margin-top: 5px;
	margin-left: 10px;
	cursor: pointer;
}

.new-entry textarea {
	border: none;
	outline: none;
	/* Запрещаем менять масштаб textarea */
	resize: none;

	font-size: 16px;
	padding: 5px;
}
```

Вывод реакт-приложения

`renderer > javascripts > index.js`
```JS
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
require("application.css");

window.onload = () => {
	const root = ReactDOM.createRoot(document.querySelector(".root"));
	root.render(<App />);
};
```


`renderer > javascripts > components > App.js`
```JS
import React from "react";
import New from "./new";
import Entries from "./entries";

const App = () => {
	return (
		<>
			<New/>
			<Entries/>
		</>
	);
};

export default App;
```

Тут мы будем реализовывать новый *entry* при каждом нажатии на кнопку создания нового действия

`renderer > javascripts > components > new > index.js`
```JS
import React from "react";
import Title from "./title";
import Actions from "./actions";

const New = () => {
	return (
		<div className="new-entry">
			<Title />
			<Actions />
		</div>
	);
};

export default New;
```

Это сам компонент `Title`, который вызвается в `new-entry` и представляет из себя текстовое поле, в которое мы вводим задачу

`renderer > javascripts > components > new > title.js`
```JS
import React from "react";

const Title = () => {
	return (
		<div className="details">
			<textarea
				value=""
				id=""
				cols="0"
				rows="1"
				placeholder="Start new activity"
			></textarea>
		</div>
	);
};

export default Title;
```

Это сам компонент `Actions`, который вызвается в `new-entry` и представляет из себя кнопку, которая запускает таймер и будет создавать нам новый *entry* 

`renderer > javascripts > components > new > actions.js`
```JS
import React from "react";
import PlayIcon from "play.svg";
import StopIcon from "stop.svg";

const Actions = () => {
	return (
		<div className="actions">
			<div className="time">00:00:00</div>
			<div className="trigger">
				<PlayIcon width="24" height="24" />
			</div>
		</div>
	);
};

export default Actions;
```

Это уже непосредственно сам созданный прошлым компонентом *entry*

`renderer > javascripts > components > entries > index.js`
```JS
import React from "react";

const Entries = () => {
	return <div className="entries">List of Entries</div>;
};

export default Entries;
```

На данном этапе разработки наша структура файлов и папок выглядит примерно так:

![](_png/Pasted%20image%2020221115210355.png)

И вот так выглядит само приложение:

![](_png/Pasted%20image%2020221115210649.png)

## 021 Интерфейс Списка Записей

Для начала, нужно в отдельный компонент выделить нашу отдельную запись. Основной компонент `entries` будет содержать много записей, которые будут отдельными `item`

`javascripts > components > entries > index.js`
```JS
import React from "react";
import Item from './item';

const Entries = () => {
	return (
		<div className="entries">
			<Item />
		</div>
	);
};

export default Entries;
```

Это сам компонент записи

`javascripts > components > entries > item.js`
```JS
import React from "react";

const Item = () => {
	return (
		<div className="entry">
			<div className="details">
				<div className="primary">Primary</div>
				<div className="secondary">Secondary</div>
			</div>
			<div className="actions">
				<div className="time">00:00:00</div>
			</div>
		</div>
	);
};

export default Item;
```

Стили для наших записей

`stylesheets > components > entries.css`
```CSS
.entry {
	display: flex;
	flex-direction: row;
	padding: 10px 15px;
	border-bottom: 1px solid #fafafa;
}

.entry:hover {
	background-color: rgba(96, 131, 247, 0.452);
	transition: 0.3s all ease;
	cursor: default;
}

.entry .details {
	display: flex;
	flex-direction: column;
	flex: 2;
}

.entry .actions {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	flex: 1;
}

.entry .primary {
	margin-bottom: 8px;
}

.entry .secondary {
	font-size: 14px;
	color: #a8a8a8;
}

.entry .time {
	color: #777;
}
```

И теперь мы имеем стилизованный компонент записи

![](_png/Pasted%20image%2020221116102622.png)

## 022 Сохранение Данных на Жестком Диске



`main > app > storage.js`
```JS
import { app } from "electron";
// Дальше будем импортировать стандартные нодовские модули
import path from "path";
// первый модуль позволяет создать новую директорию
// второй проверяет, существует ли эта директория
import { mkdirSync, existsSync } from "fs";

export default class Storage {
	constructor() {
		this.directory = path.join(app.getPath("userData"), "storage");
		if (!existsSync(this.directory)) { 
			mkdirSync(this.directory);
		}
	}
}
```

`main > index.js`
```JS
	createWindow() {
		this.window = new BrowserWindow({
			title: CONFIG.name,
			width: CONFIG.width,
			height: CONFIG.height,
			minWidth: CONFIG.width,
			minHeight: CONFIG.height,
			maxWidth: CONFIG.width,
			maxHeight: CONFIG.height,
			autoHideMenuBar: true,
			titleBarStyle: "hidden",
			webPreferences: {
				nodeIntegration: true,
			},
		});

		this.window.loadFile("renderer/index.html");

		this.window.openDevTools({ mode: "detach" });

		// если окно закроется, то его не будет
		this.window.on("closed", () => {
			window = null;
		});

		const storage = new Storage();
		// А тут ставим точку останова
		debugger;
	}
```

И сейчас подключаемся к девтулзу, чтобы посмотреть на тот функционал, который мы получаем

```bash
bozon start --inspect-brk 3456
```

По данному пути мы можем перейти и получить доступ к папке:

![](_png/Pasted%20image%2020221116104251.png)



`main > app > storage.js`
```JS
import { app } from "electron";
// Дальше будем импортировать стандартные нодовские модули
import path from "path";
// первый модуль позволяет создать новую директорию
// второй проверяет, существует ли эта директория
// третий позволяет читать определённые данные из файлов
// четвёртый создаёт новый файл и записывает в него нужные данные
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";

export default class Storage {
	constructor() {
		this.directory = path.join(app.getPath("userData"), "storage");
		if (!existsSync(this.directory)) {
			mkdirSync(this.directory);
		}
	}

	get(key) {
		return this.read(key);
	}

	set(key, data) {
		return this.write(key, data);
	}

	read(key) {
		// file - это путь файла, который будет зависеть от того ключа, по которому мы хотим прочитать данные
		return JSON.parse(readFileSync(this.file(key)).toString("utf8"));
	}

	write(key, data) {
		return writeFileSync(this.file(key), JSON.stringify(data));
	}

	file(key) {
		const file = path.join(this.directory, `${key}.json`);
		if (!existsSync(file)) { // почеу то программа работает только с этим кодом: if (!existsSync(this.directory))
			writeFileSync(file, null, { flag: "wx" });
		}
		return file;
	}
}
```

Опять запускаем приложение в режиме дебаггера. После реализации хранения данных, мы теперь можем выполнять создание, запись и изменение данных 

![](_png/Pasted%20image%2020221116110029.png)

Тут мы реализуем подписку на канал из основного процесса

`main`
```JS
import path from "path";
import { app, BrowserWindow } from "electron";
import Storage from "./storage";

export default class TimerApp {
	constructor() {
		this.storage = new Storage();
		console.log(this.storage);
		this.subscribeForAppEvents();
		app.whenReady().then(() => this.createWindow());
	}

	createWindow() {
		this.window = new BrowserWindow({
			title: CONFIG.name,
			width: CONFIG.width,
			height: CONFIG.height,
			minWidth: CONFIG.width,
			minHeight: CONFIG.height,
			maxWidth: CONFIG.width,
			maxHeight: CONFIG.height,
			autoHideMenuBar: true,
			titleBarStyle: "hidden",
			webPreferences: {
				preload: path.join(app.getAppPath(), "preload", "index.js"),
			},
		});

		this.window.loadFile("renderer/index.html");

		this.window.openDevTools({ mode: "detach" });

		// тут мы реализуем отправку данных из хранилища в renderer процесс
		this.window.webContents.on("did-finish-load", () => {
			this.window.webContents.send("entires", {
				entries: this.storage.get("entries"),
			});
		});

		this.window.on("closed", () => {
			window = null;
		});
	}

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

Тут мы передадим в рендерер наш процесс, который подпишет нас на канал с основного процесса и передаст информацию в рендерер

`preload`
```JS
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
	subscribeForEntries: (callback) => ipcRenderer.on("entries", callback),
});
```

Тут нам нужно получить данные из основного процесса и передать их в компонент App.

`renderer`
```JS
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
require("application.css");

api.subscribeForEntries((event, data) => {
	renderApp(data.entries);
});

const renderApp = (entries) => {
	const root = ReactDOM.createRoot(document.querySelector(".root"));
	root.render(<App entries={entries} />);
};

```



12:20




## 023 Реализация Таймера



## 024 Запуск Таймера в Интерфейсе Приложения



## 025 Вывод Списка Записей в Интерфейсе



## 026 Исправляем Баги Приложения










