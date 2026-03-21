---
tags:
  - electron
  - desktop
  - javascript
  - typescript
---

# Electron - Полное руководство

Electron - это фреймворк для создания кроссплатформенных десктопных приложений с использованием веб-технологий. Он объединяет Chromium для рендеринга интерфейса и Node.js для доступа к системным API. На нём построены VSCode, Slack, Discord, Notion, Figma Desktop и Obsidian.

Актуальная версия - Electron 39 (Chromium 142, Node.js 22.20, V8 14.2). Новая мажорная версия выходит каждые 8 недель вместе с релизом Chromium.

```
┌─────────────────────────────────────────────┐
│               Main Process                  │
│  (Node.js + Electron APIs)                  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Renderer │  │ Renderer │  │ Utility  │  │
│  │ Process  │  │ Process  │  │ Process  │  │
│  │(Chromium)│  │(Chromium)│  │ (Node.js)│  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
        ▲              ▲              ▲
        │     IPC      │     IPC      │
        └──────────────┴──────────────┘
```

---

## Архитектура и процессная модель

Electron реализует многопроцессную модель, аналогичную Chromium.

### Main Process

Точка входа приложения. Существует в единственном экземпляре. Отвечает за:

- Жизненный цикл приложения (запуск, выход, обновления)
- Создание и управление окнами (BrowserWindow)
- Системные API - меню, трей, диалоги, уведомления
- Доступ к файловой системе и нативным модулям
- IPC-хаб для коммуникации между процессами

```ts
// main.ts - точка входа Main Process
import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

### Renderer Process

Каждое окно BrowserWindow запускает свой Renderer Process. Это изолированный Chromium-контекст, в котором работает UI приложения. По умолчанию не имеет доступа к Node.js API.

### Preload Script

Мост между Main и Renderer. Выполняется в контексте рендерера, но до загрузки веб-контента. Имеет доступ к ограниченному набору Node.js API и к `contextBridge`.

```ts
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Безопасно экспонируем только конкретные методы
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveData: (data: string) => ipcRenderer.invoke('store:save', data),
  onUpdateAvailable: (callback: () => void) =>
    ipcRenderer.on('update-available', callback),
});
```

### Utility Process

Начиная с Electron 22, можно создавать вспомогательные процессы для тяжёлых вычислений, чтобы не блокировать Main Process. В отличие от `child_process.fork`, utility process интегрирован с Chromium Services API и может устанавливать связь с renderer через MessagePorts.

```ts
// main.ts
import { utilityProcess } from 'electron';
import path from 'path';

const child = utilityProcess.fork(path.join(__dirname, 'heavy-task.js'));
child.postMessage({ type: 'start', payload: data });
child.on('message', (result) => {
  console.log('Результат:', result);
});
```

```ts
// heavy-task.js
process.parentPort.on('message', (e) => {
  const result = processData(e.data);
  process.parentPort.postMessage(result);
});
```

### Service Worker Preload Scripts (Electron 35+)

Начиная с Electron 35 появилась поддержка preload-скриптов для Service Workers. Это позволяет разгрузить Main Process и строить микросервисную архитектуру внутри приложения через IPC-коммуникацию между Service Workers и preload-скриптами.

---

## Context Isolation и безопасность

> [!important]
> С Electron 28+ параметры `contextIsolation: true` и `nodeIntegration: false` установлены по умолчанию. Никогда не отключайте их в продакшене.

Context Isolation разделяет JavaScript-контексты preload-скрипта и веб-страницы. Это предотвращает доступ рендерера к Node.js API и защищает от prototype pollution.

### Что нельзя делать

```ts
// ОПАСНО - не делайте так
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,      // Даёт рендереру полный доступ к Node.js
    contextIsolation: false,     // Убирает изоляцию контекстов
  },
});
```

### Правильный паттерн: contextBridge

```ts
// preload.ts - экспонируем только то, что нужно рендереру
contextBridge.exposeInMainWorld('api', {
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (name: string) => ipcRenderer.invoke('users:create', name),
});
```

```ts
// renderer.ts - используем через window.api
const users = await window.api.getUsers();
```

---

## IPC - межпроцессное взаимодействие

IPC - основной механизм коммуникации между процессами в Electron. Существует три паттерна.

### Renderer -> Main (invoke/handle)

Рекомендуемый паттерн для запрос-ответ операций.

```ts
// main.ts
import { ipcMain, dialog } from 'electron';

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Documents', extensions: ['pdf', 'docx'] }],
  });
  return result.filePaths[0];
});
```

```ts
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
});
```

### Main -> Renderer (send/on)

Для push-уведомлений из Main в Renderer.

```ts
// main.ts
win.webContents.send('update-progress', { percent: 75 });
```

```ts
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  onProgress: (callback: (data: { percent: number }) => void) => {
    ipcRenderer.on('update-progress', (_event, data) => callback(data));
  },
});
```

### Renderer -> Renderer

Рендереры не могут общаться напрямую. Рендереры не могут общаться напрямую. Используйте Main Process как посредника через `MessagePort` или паттерн pub/sub через ipcMain.

> [!info]
> Через IPC можно передавать только сериализуемые объекты (Structured Clone Algorithm). DOM-элементы и C++-объекты передать нельзя.

```ts
// main.ts - пробрасываем сообщение между окнами
ipcMain.on('relay:message', (event, data) => {
  const targetWindow = BrowserWindow.fromId(data.targetWindowId);
  targetWindow?.webContents.send('relay:message', data.payload);
});
```

---

## Начало работы с Electron Forge

Electron Forge - официальный инструмент для создания, сборки и публикации Electron-приложений.

### Создание проекта

```bash
# Создание нового проекта с TypeScript + Webpack
npm init electron-app@latest my-app -- --template=webpack-typescript

cd my-app
npm start
```

### Структура проекта Forge

```
my-app/
├── src/
│   ├── main.ts           # Main Process
│   ├── preload.ts         # Preload Script
│   ├── renderer.ts        # Renderer entry
│   └── index.html         # HTML шаблон
├── forge.config.ts        # Конфигурация Forge
├── tsconfig.json
├── webpack.main.config.ts
├── webpack.renderer.config.ts
└── package.json
```

### Конфигурация Forge

```ts
// forge.config.ts
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
  },
  makers: [
    new MakerSquirrel({}),      // Windows (.exe)
    new MakerDMG({}),           // macOS (.dmg)
    new MakerDeb({}),           // Linux (.deb)
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.ts',
        renderer: {
          config: './webpack.renderer.config.ts',
          entryPoints: [{
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: { js: './src/preload.ts' },
          }],
        },
      },
    },
  ],
};

export default config;
```

### Сборка и публикация

```bash
# Запуск в режиме разработки
npm start

# Сборка без установщиков
npm run package

# Создание установщиков для текущей платформы
npm run make

# Публикация (GitHub Releases, S3 и др.)
npm run publish
```

---

## Интеграция с фронтенд-фреймворками

### React + Vite + Electron

Для работы с React/Vue/Svelte удобнее использовать electron-vite - инструмент, который интегрирует Vite как бандлер для всех процессов Electron.

```bash
npm create @quick-start/electron my-app -- --template react-ts
```

Структура проекта electron-vite:

```
my-app/
├── electron/
│   ├── main/
│   │   └── index.ts       # Main Process
│   └── preload/
│       └── index.ts        # Preload Script
├── src/                     # React-приложение (Renderer)
│   ├── App.tsx
│   ├── main.tsx
│   └── components/
├── electron.vite.config.ts
└── package.json
```

```ts
// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
  },
});
```

---

## Интеграция SQLite и Prisma

### better-sqlite3

Синхронная SQLite-библиотека, оптимальная для Electron. Требует нативной пересборки.

```bash
npm install better-sqlite3
npm install -D electron-rebuild

# Пересборка нативных модулей под версию Electron
npx electron-rebuild
```

```ts
// main.ts - работа с SQLite в Main Process
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'app.db');
const db = new Database(dbPath);

// WAL-режим для лучшей производительности
db.pragma('journal_mode = WAL');

// Создание таблицы
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Подготовленные запросы
const insertNote = db.prepare(
  'INSERT INTO notes (title, content) VALUES (@title, @content)'
);
const getAllNotes = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC');
const getNote = db.prepare('SELECT * FROM notes WHERE id = ?');
```

### Prisma в Electron

Prisma работает в Electron через driver adapter для better-sqlite3.

```bash
npm install @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3
npm install -D prisma @types/better-sqlite3
npx prisma init --datasource-provider sqlite
```

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = "file:./data.db"
}

model Note {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```ts
// main.ts - инициализация Prisma через driver adapter
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { app } from 'electron';
import path from 'path';

function getDatabasePath(): string {
  if (!app.isPackaged) {
    return path.join(__dirname, '../../prisma/data.db');
  }
  return path.join(app.getPath('userData'), 'data.db');
}

const sqliteDb = new Database(getDatabasePath());
const adapter = new PrismaBetterSQLite3(sqliteDb);
const prisma = new PrismaClient({ adapter });

// IPC-обработчики
ipcMain.handle('notes:getAll', async () => {
  return prisma.note.findMany({ orderBy: { updatedAt: 'desc' } });
});

ipcMain.handle('notes:create', async (_event, data: { title: string; content: string }) => {
  return prisma.note.create({ data });
});

ipcMain.handle('notes:update', async (_event, id: number, data: Partial<Note>) => {
  return prisma.note.update({ where: { id }, data });
});
```

> [!warning] Упаковка Prisma для продакшена
> - Prisma Query Engine бинарники должны быть распакованы из asar
> - Типы `Bytes` и `BigInt` не сериализуются через IPC
> - Путь к БД определяется динамически через `app.getPath('userData')`

```json
// package.json или forge.config - extraResources для Prisma
{
  "build": {
    "extraResources": [
      { "from": "prisma/data.db", "to": "data.db" },
      { "from": "node_modules/.prisma/client/query_engine-*", "to": "prisma-engines/" }
    ],
    "asarUnpack": ["node_modules/.prisma/**"]
  }
}
```

---

## Работа с десктопными возможностями

### System Tray

```ts
import { Tray, Menu, nativeImage } from 'electron';

let tray: Tray | null = null;

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть', click: () => win?.show() },
    { label: 'Свернуть в трей', click: () => win?.hide() },
    { type: 'separator' },
    { label: 'Выход', click: () => app.quit() },
  ]);

  tray.setToolTip('My App');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => win?.show());
}
```

### Нативные меню

```ts
import { Menu, MenuItem } from 'electron';

const menu = Menu.buildFromTemplate([
  {
    label: 'Файл',
    submenu: [
      {
        label: 'Новый файл',
        accelerator: 'CmdOrCtrl+N',
        click: () => createNewFile(),
      },
      {
        label: 'Открыть',
        accelerator: 'CmdOrCtrl+O',
        click: () => openFileDialog(),
      },
      { type: 'separator' },
      { role: 'quit', label: 'Выход' },
    ],
  },
  {
    label: 'Редактирование',
    submenu: [
      { role: 'undo', label: 'Отменить' },
      { role: 'redo', label: 'Повторить' },
      { type: 'separator' },
      { role: 'cut', label: 'Вырезать' },
      { role: 'copy', label: 'Копировать' },
      { role: 'paste', label: 'Вставить' },
    ],
  },
]);

Menu.setApplicationMenu(menu);
```

### Диалоги (выбор файлов, сохранение)

```ts
import { dialog } from 'electron';

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Выберите файл',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Изображения', extensions: ['jpg', 'png', 'gif'] },
      { name: 'Все файлы', extensions: ['*'] },
    ],
  });
  return result.filePaths;
});

ipcMain.handle('dialog:saveFile', async (_event, content: string) => {
  const result = await dialog.showSaveDialog({
    title: 'Сохранить файл',
    defaultPath: 'document.txt',
  });

  if (!result.canceled && result.filePath) {
    await fs.promises.writeFile(result.filePath, content, 'utf-8');
    return result.filePath;
  }
  return null;
});
```

### Уведомления

```ts
import { Notification } from 'electron';

function showNotification(title: string, body: string) {
  new Notification({ title, body }).show();
}
```

### Clipboard

```ts
import { clipboard } from 'electron';

ipcMain.handle('clipboard:read', () => clipboard.readText());
ipcMain.handle('clipboard:write', (_event, text: string) => clipboard.writeText(text));
```

### Deep Linking (протокол-обработчик)

```ts
// Регистрация кастомного протокола myapp://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('myapp', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('myapp');
}

// Обработка URL на macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Обработка URL на Windows/Linux (single instance)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith('myapp://'));
    if (url) handleDeepLink(url);
    if (win?.isMinimized()) win.restore();
    win?.focus();
  });
}
```

### Auto-Updater

```ts
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = false;

autoUpdater.on('update-available', (info) => {
  win?.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', () => {
  win?.webContents.send('update-downloaded');
});

ipcMain.handle('update:check', () => autoUpdater.checkForUpdates());
ipcMain.handle('update:download', () => autoUpdater.downloadUpdate());
ipcMain.handle('update:install', () => autoUpdater.quitAndInstall());
```

### Screen Capture

```ts
import { desktopCapturer } from 'electron';

ipcMain.handle('capture:sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 240 },
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
  }));
});
```

---

## Архитектура Electron-приложения

### Организация по Feature-Sliced Design

FSD хорошо ложится на Electron-проекты, разделяя код по слоям ответственности.

```
src/
├── main/                           # Main Process
│   ├── app/                        # Инициализация, жизненный цикл
│   │   ├── index.ts
│   │   └── lifecycle.ts
│   ├── features/                   # Бизнес-логика по фичам
│   │   ├── notes/
│   │   │   ├── notes.service.ts    # Логика работы с заметками
│   │   │   ├── notes.repository.ts # Доступ к данным
│   │   │   └── notes.ipc.ts        # IPC-обработчики
│   │   ├── files/
│   │   │   ├── files.service.ts
│   │   │   └── files.ipc.ts
│   │   └── updater/
│   │       └── updater.service.ts
│   ├── shared/                     # Общие утилиты Main Process
│   │   ├── database.ts
│   │   ├── logger.ts
│   │   └── store.ts
│   └── index.ts                    # Entry point
│
├── preload/                        # Preload Scripts
│   ├── index.ts                    # Основной preload
│   └── api.ts                      # Типизированный API
│
├── renderer/                       # Renderer Process (React/Vue/Svelte)
│   ├── app/                        # Инициализация UI
│   ├── pages/                      # Страницы
│   ├── features/                   # UI-фичи
│   │   ├── notes/
│   │   │   ├── ui/
│   │   │   ├── model/
│   │   │   └── api/                # Вызовы через window.electronAPI
│   │   └── settings/
│   ├── shared/                     # UI-компоненты, хуки
│   │   ├── ui/
│   │   └── lib/
│   └── index.tsx
│
└── shared/                         # Общие типы для всех процессов
    ├── types/
    │   ├── ipc.ts                  # Типы IPC-каналов
    │   └── models.ts               # Доменные модели
    └── constants.ts
```

### Типизированный IPC

Ключевая практика - строгая типизация IPC-каналов, общая для Main и Renderer.

```ts
// shared/types/ipc.ts - контракт между процессами
export interface IpcChannels {
  'notes:getAll': { args: []; return: Note[] };
  'notes:create': { args: [{ title: string; content: string }]; return: Note };
  'notes:update': { args: [number, Partial<Note>]; return: Note };
  'notes:delete': { args: [number]; return: void };
  'dialog:openFile': { args: []; return: string | null };
  'app:getVersion': { args: []; return: string };
}

// Хелперы для типобезопасных вызовов
export type IpcChannel = keyof IpcChannels;
export type IpcArgs<T extends IpcChannel> = IpcChannels[T]['args'];
export type IpcReturn<T extends IpcChannel> = IpcChannels[T]['return'];
```

```ts
// preload.ts - типобезопасный preload
import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannel, IpcArgs, IpcReturn } from '../shared/types/ipc';

function createInvoker<T extends IpcChannel>(channel: T) {
  return (...args: IpcArgs<T>): Promise<IpcReturn<T>> =>
    ipcRenderer.invoke(channel, ...args);
}

const api = {
  notes: {
    getAll: createInvoker('notes:getAll'),
    create: createInvoker('notes:create'),
    update: createInvoker('notes:update'),
    delete: createInvoker('notes:delete'),
  },
  dialog: {
    openFile: createInvoker('dialog:openFile'),
  },
  app: {
    getVersion: createInvoker('app:getVersion'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
```

```ts
// renderer - типизация window.electronAPI
// global.d.ts
import type { api } from '../preload';

declare global {
  interface Window {
    electronAPI: typeof api;
  }
}
```

### Паттерн Service/Repository в Main Process

Main Process организуется как бэкенд-приложение с разделением на сервисы и репозитории.

```ts
// main/features/notes/notes.repository.ts
import { db } from '../../shared/database';
import type { Note } from '../../../shared/types/models';

export class NotesRepository {
  getAll(): Note[] {
    return db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as Note[];
  }

  getById(id: number): Note | undefined {
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
  }

  create(data: { title: string; content: string }): Note {
    const stmt = db.prepare('INSERT INTO notes (title, content) VALUES (?, ?)');
    const result = stmt.run(data.title, data.content);
    return this.getById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: Partial<Note>): Note {
    const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE notes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`)
      .run({ ...data, id });
    return this.getById(id)!;
  }

  delete(id: number): void {
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }
}
```

```ts
// main/features/notes/notes.service.ts
import { NotesRepository } from './notes.repository';

export class NotesService {
  private repo = new NotesRepository();

  getAllNotes() {
    return this.repo.getAll();
  }

  createNote(title: string, content: string) {
    if (!title.trim()) throw new Error('Title cannot be empty');
    return this.repo.create({ title: title.trim(), content });
  }

  updateNote(id: number, data: Partial<{ title: string; content: string }>) {
    const existing = this.repo.getById(id);
    if (!existing) throw new Error(`Note ${id} not found`);
    return this.repo.update(id, data);
  }

  deleteNote(id: number) {
    return this.repo.delete(id);
  }
}
```

```ts
// main/features/notes/notes.ipc.ts
import { ipcMain } from 'electron';
import { NotesService } from './notes.service';

const service = new NotesService();

export function registerNotesIpc() {
  ipcMain.handle('notes:getAll', () => service.getAllNotes());
  ipcMain.handle('notes:create', (_e, data) => service.createNote(data.title, data.content));
  ipcMain.handle('notes:update', (_e, id, data) => service.updateNote(id, data));
  ipcMain.handle('notes:delete', (_e, id) => service.deleteNote(id));
}
```

### IPC Channel Naming и библиотеки для type-safe IPC

Формат именования каналов: `domain:entity:action`

```ts
// shared/ipc-channels.ts
export const IPC_CHANNELS = {
  DB_USERS_GET_ALL: 'db:users:getAll',
  DB_USERS_CREATE:  'db:users:create',
  DIALOG_OPEN_FILE: 'dialog:openFile',
  APP_GET_VERSION:  'app:getVersion',
  UPDATE_AVAILABLE: 'update:available',
  FS_READ_FILE:     'fs:readFile',
} as const;
```

Библиотеки для типизированного IPC:

| Библиотека | Подход |
|-----------|--------|
| `@electron-toolkit/typed-ipc` | Минимальные обёртки поверх нативного API |
| `electron-trpc` | tRPC-подобный подход для Electron |
| `interprocess` | Полное решение с автовыводом типов |

### Что экспонировать через contextBridge

> [!important]
> Preload-скрипт - это граница безопасности. Экспонируйте только конкретные действия, а не общие механизмы.

Правильно:
- Конкретные бизнес-операции: `notes.getAll()`, `notes.create(data)`
- Подписки на события: `onUpdateAvailable(callback)`
- Системные действия: `openFile()`, `getVersion()`

Неправильно:
- Прямой `ipcRenderer.send()` или `ipcRenderer.invoke()` - это позволит рендереру вызывать любой канал
- `require()` или `process` - даёт полный доступ к Node.js
- Общий `eval()` или `executeQuery(sql)` - SQL-инъекции

```ts
// ПЛОХО - слишком широкий доступ
contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

// ХОРОШО - только конкретные операции
contextBridge.exposeInMainWorld('api', {
  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    create: (data: CreateNoteDto) => ipcRenderer.invoke('notes:create', data),
  },
});
```

---

## Примеры из архитектуры популярных приложений

### VSCode

- Основная логика работает в Main Process (Extension Host)
- Каждое расширение запускается в отдельном процессе через UtilityProcess
- Рендерер отвечает только за UI (Monaco Editor)
- IPC-сообщения типизированы через protocol buffers
- Файловая система абстрагирована через провайдеры - позволяет работать с локальными файлами и Remote SSH одинаково

### Notion

- Использует offline-first подход с локальной SQLite-базой
- Синхронизация данных через Main Process
- Рендерер получает данные через типизированный IPC
- Кэширование страниц на диске для мгновенной загрузки

### Discord

- Разделение на несколько окон (чат, оверлей, попапы) - каждое в своём Renderer Process
- Голосовые вызовы обрабатываются нативными модулями через Main Process
- Обновления через electron-updater с дельта-патчами

---

## Плюсы и минусы Electron

### Преимущества

| Аспект | Описание |
|--------|----------|
| Кроссплатформенность | Один код для Windows, macOS и Linux |
| Веб-стек | HTML, CSS, JS/TS - огромная экосистема и пул разработчиков |
| Node.js доступ | Полноценная работа с файловой системой, сетью, нативными модулями |
| Экосистема | electron-forge, electron-builder, electron-updater, electron-store |
| Chromium | Последняя версия движка - не нужно думать о кросс-браузерности |
| Быстрый старт | От идеи до рабочего приложения за часы, а не недели |

### Недостатки

| Аспект | Описание |
|--------|----------|
| Размер бандла | Минимум ~150 MB из-за встроенного Chromium |
| Потребление RAM | ~250 MB на старте - каждый Renderer это отдельный процесс Chromium |
| CPU | Выше расход ресурсов по сравнению с нативными приложениями |
| Безопасность | Требует аккуратной настройки (CSP, context isolation, sandbox) |
| Startup time | Медленнее нативных приложений при холодном старте |

### Альтернативы

- Tauri

- Rust
- Neutralinojs - лёгкий, использует системный WebView
- Flutter Desktop - Dart, свой рендеринг
- .NET MAUI - C#, нативные контролы

> [!tip] Когда выбирать Electron
> - Команда с сильным JS/TS-бэкграундом
> - Нужен быстрый выход на рынок на всех платформах
> - Сложный UI с вебовскими требованиями
> - Уже есть веб-приложение и нужна десктопная версия

> [!warning] Когда рассмотреть альтернативы
> - Размер приложения и потребление ресурсов критичны - Tauri
> - Нужна максимальная производительность - нативная разработка
> - Минимальный размер установщика - Neutralinojs или Tauri

---

## Распространённые ошибки и решения

### 1. "require is not defined"

Возникает, когда в Renderer пытаются использовать Node.js модули при `contextIsolation: true`.

Решение: используйте preload-скрипт и contextBridge для передачи нужных функций в рендерер.

```ts
// ОШИБКА - в renderer.ts
const fs = require('fs'); // require is not defined

// РЕШЕНИЕ - через preload
// preload.ts
contextBridge.exposeInMainWorld('fs', {
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
});
```

### 2. Нативные модули не работают после сборки

Нативные модули (better-sqlite3, sharp, node-pty) требуют пересборки под конкретную версию Electron.

```bash
# Пересборка нативных модулей
npx electron-rebuild

# Для конкретного модуля
npx electron-rebuild -f -w better-sqlite3

# В package.json для автоматической пересборки
{
  "scripts": {
    "postinstall": "electron-rebuild"
  }
}
```

### 3. Memory Leak в BrowserWindow

Утечки памяти происходят при хранении ссылок на закрытые окна.

```ts
let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({ /* ... */ });

  // Обязательно обнуляйте ссылку при закрытии
  win.on('closed', () => {
    win = null;
  });
}

// Для массива окон
const windows = new Set<BrowserWindow>();

function createChildWindow() {
  const child = new BrowserWindow({ /* ... */ });
  windows.add(child);
  child.on('closed', () => windows.delete(child));
}
```

### 4. Белый экран при загрузке

Причины: неправильный путь к файлам, ошибка загрузки renderer, CORS-проблемы.

```ts
// Показывайте окно только после загрузки контента
const win = new BrowserWindow({
  show: false,  // Скрыть окно при создании
  webPreferences: { preload: path.join(__dirname, 'preload.js') },
});

win.loadFile('index.html');

win.once('ready-to-show', () => {
  win.show();  // Показать только когда контент готов
});

// Для отладки
win.webContents.on('did-fail-load', (_event, errorCode, errorDesc) => {
  console.error(`Failed to load: ${errorCode} - ${errorDesc}`);
});
```

### 5. CORS-ошибки при запросах к API

Renderer Process подчиняется тем же CORS-ограничениям, что и браузер.

```ts
// Решение 1: Проксировать запросы через Main Process
ipcMain.handle('api:fetch', async (_event, url: string, options: RequestInit) => {
  const response = await fetch(url, options);
  return response.json();
});

// Решение 2: Настроить webRequest для модификации заголовков
session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
  details.requestHeaders['Origin'] = 'https://myapp.com';
  callback({ requestHeaders: details.requestHeaders });
});
```

### 6. Auto-Updater не работает на macOS

macOS требует подписи кода для auto-updater. Без подписи обновления не установятся.

```ts
// Для разработки используйте проверку без подписи
if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true;
}
```

> [!info]
> Для продакшена на macOS необходим Apple Developer Certificate. Подписывайте приложение через `electron-builder` с параметрами `mac.identity` и `mac.notarize`.

### 7. Приложение не запускается после `npm run make`

Частая проблема - неправильные пути к ресурсам в собранном приложении.

```ts
// Используйте app.isPackaged для определения режима
import { app } from 'electron';

function getAssetPath(asset: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', asset);
  }
  return path.join(__dirname, '..', 'assets', asset);
}
```

### 8. Горячая перезагрузка ломает IPC

При использовании HMR в рендерере обработчики IPC в Main Process не перезагружаются.

```ts
// Защита от дублирования обработчиков
function safeHandle(channel: string, handler: (...args: any[]) => any) {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}
```

---

## Оптимизация производительности

Стратегии из официальной документации Electron:

1. Профилируйте перед оптимизацией - Chrome DevTools, Chrome Tracing
2. Будьте избирательны с зависимостями - проверяйте размер и стоимость модулей
3. Откладывайте загрузку некритичного кода - ленивый `require()` / динамические `import()`
4. Не блокируйте main process - используйте UtilityProcess, async I/O, worker threads
5. Оптимизируйте renderer - `requestIdleCallback()`, Web Workers, 60fps анимации
6. Уберите ненужные полифилы - Electron включает современный Chromium
7. Минимизируйте сетевые запросы - бандлите статику с приложением
8. Бандлите код - один файл вместо множества мелких `require()`

```ts
// Ленивая загрузка тяжёлых модулей
async function processImage() {
  const sharp = require('sharp'); // загружается только при вызове
  return sharp(buffer).resize(800).toBuffer();
}

// Показ окна только после готовности контента
const win = new BrowserWindow({ show: false });
win.loadFile('index.html');
win.once('ready-to-show', () => win.show());
```

---

## Полезные библиотеки

| Библиотека | Назначение |
|------------|-----------|
| electron-store | Хранение настроек (JSON, автосохранение, миграции) |
| electron-updater | Автообновления (GitHub, S3, generic server) |
| electron-log | Логирование с ротацией файлов |
| electron-is-dev | Определение режима разработки |
| electron-context-menu | Контекстное меню для рендерера |
| electron-dl | Скачивание файлов с прогрессом |
| electron-unhandled | Глобальная обработка необработанных ошибок |

---

## Чеклист безопасности

- [ ] `contextIsolation: true` включён
- [ ] `nodeIntegration: false` установлен
- [ ] `sandbox: true` включён для всех окон
- [ ] Preload экспонирует только конкретные операции, не общие механизмы
- [ ] Content Security Policy настроен в HTML
- [ ] `webSecurity: true` не отключён
- [ ] Пользовательский ввод валидируется в Main Process
- [ ] `shell.openExternal()` проверяет URL перед открытием
- [ ] Загрузка удалённого контента происходит только с доверенных источников
- [ ] Регулярное обновление Electron до последней стабильной версии
