## 014 Коммуникация между процессами [IPC](https://www.electronjs.org/docs/latest/api/ipc-main)

Электрон предоставляет нам глобальную шину IPC (Item Process Communication), которая реализует общение серверной и клиентской части приложения. Практически любой процесс может открыть канал, который будут слушать все подписанные на этот канал процессы

Сообщения с бэка в рендерер-процесс могут быть посланы через `webContents.send`. Уже через `ipcRenderer` можно отправить запрос из рендерер-процесса на бэк (в основной процесс) либо слушать сообщения по какому-то каналу.

Попробуем отправить сообщение из мэин-процесса в рендерер-процесс:

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



## 015 Модуль remote



## 016 Preload Script



## 017 API Браузера







