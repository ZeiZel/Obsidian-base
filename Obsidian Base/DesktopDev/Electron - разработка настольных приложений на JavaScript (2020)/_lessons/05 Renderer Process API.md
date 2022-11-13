## 014 Коммуникация между процессами [IPC](https://www.electronjs.org/docs/latest/api/ipc-main)

#### Реализуем получение данных на фронте от мэин-процесса 

Электрон предоставляет нам глобальную шину IPC (Item Process Communication), которая реализует общение серверной и клиентской части приложения. Практически любой процесс может открыть канал, который будут слушать все подписанные на этот канал процессы

Сообщения с бэка в рендерер-процесс могут быть посланы через `webContents.send`. Уже через `ipcRenderer` можно отправить запрос из рендерер-процесса на бэк (в основной процесс) либо слушать сообщения по какому-то каналу.

Попробуем отправить сообщение из мэин-процесса в рендерер-процесс:
Тут нужно отметить, что мы создаём канал для конкретного окна `window.webContents.send` - тут окно `window`

`main > index.js`
```JS
import { app, BrowserWindow } from "electron";

app.on("ready", () => {
	let window = new BrowserWindow({
		width: 1280,
		height: 720,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	window.webContents.loadFile("renderer/index.html");

	// отправляем сообщение по нашему каналу
	window.webContents.on("did-finish-load", () => {
		window.webContents.send("mainchannel", { message: "App is running" });
	});

	window.on("ready-to-show", () => {
		window.show();
	});
});
```

`ipcRenderer` тут принимает в себя два аргумента: `event` - информация о самом событии (сообщении) и `data` - само переданное сообщение 

`renderer > index.js`
```JS
import { ipcRenderer } from "electron";
require("application.css");

ipcRenderer.on("mainchannel", (event, data) => {
	alert(data.message);
});
```

![](_png/Pasted%20image%2020221113131100.png)

#### Реализуем получение данных от рендерер-процесса на мэин-процессе 

Тут нам уже понадобится общая шина на все рендерер-процессы, из которой можно будет подписаться в мэйне. Конкретно этим модулем будет `ipcMain`

Тут уже главное отличие заключается в том, что мы создаём канал через `ipcRenderer`

Создаём канал в рендерер-процессе, из которого отправим данные на "сервер"
`renderer > index.js`
```JS
import { ipcRenderer } from "electron";
require("application.css");

ipcRenderer.on("mainchannel", (event, data) => {
	alert(data.message);
});

// срабатывание функции при загрузке приложения
window.onload = () => {
	const action = document.querySelector(".login");
	action.addEventListener("click", () => {
		ipcRenderer.send("action", { message: "hello!" });
	});
};
```

`main > index.js`
```JS
import { app, BrowserWindow, ipcMain } from "electron";

ipcMain.on("action", (event, data) => {
	console.log("Message from Renderer Process" + data.message);
});
```

![](_png/Pasted%20image%2020221113174824.png)

#### Реализуем систему запросов и ответов между основным и рендерер-процессом

Конкретно нам нужно:
- с фронта отправить запрос на бэк 
- чтобы бэк обработал информацию 
- и вернул нам этот запрос обратно 
- на фронте мы должны получить и вывести эти данные пользователю 

В коде ниже представлена реализация отправки данных. По нажатию на кнопку мы вызываем метод `loadAndDisplayData`, внутри которого данные отправятся и примутся через определённый промежуток времени. Внутри `loadAndDisplayData` мы вызываем `loadData` и тут сталкиваемся с проблемой, что нам нужно получить данные, которые приходят в метод листенера - а именно в `ipcRenderer.once()`. 

```JS
import { ipcRenderer } from "electron";
require("application.css");

ipcRenderer.on("mainchannel", (event, data) => {
	alert(data.message);
});

const loadAndDisplayData = () => {
	loadData();
};

const loadData = () => {
	// создаём канал loaddata
	ipcRenderer.send("loaddata");
	// получаем данные только однажды, так как срабатывание происходит при нажатии кнопки
	// мы так же могли использовать по отдельности методы: on и removeListener, но так как срабатывание нам нужно однажды, то используем once
	ipcRenderer.once("data", (event, data) => {
		//// return data // мы не можем так вернуть данные в loadAndDisplayData
	});
};

// срабатывание функции при загрузке приложения
window.onload = () => {
	const action = document.querySelector(".login");
	action.addEventListener("click", () => {
		ipcRenderer.send("action", loadAndDisplayData);
	});
};

```

Чтобы решить проблему, нам нужно воспользоваться `Promise API`, который и вернёт нам вызванные данные

```JS

```







## 015 Модуль remote



## 016 Preload Script



## 017 API Браузера







