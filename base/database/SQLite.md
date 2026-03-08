---
tags:
  - sqlite
  - database
  - sql
  - mobile
  - embedded
  - nodejs
  - react-native
  - expo
---

## SQLite

**SQLite** — встраиваемая реляционная СУБД, которая хранит всю базу данных в одном файле. Не требует отдельного сервера, работает как библиотека внутри приложения.

---

### Что такое SQLite

SQLite — самая распространённая база данных в мире. Она встроена в каждый смартфон (iOS, Android), браузер, и миллионы приложений.

**Ключевые характеристики:**

| Характеристика | Описание |
|----------------|----------|
| **Serverless** | Нет отдельного процесса, работает in-process |
| **Zero-config** | Не требует установки и настройки |
| **Single file** | Вся БД в одном файле (`.sqlite`, `.db`) |
| **Cross-platform** | Файл переносим между платформами |
| **ACID** | Полная поддержка транзакций |
| **Размер** | Библиотека ~600KB |

```
┌─────────────────────────────────────────────────────────┐
│                    Ваше приложение                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │              SQLite Library                      │    │
│  │         (встроена в приложение)                  │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│              ┌─────────────────┐                        │
│              │   database.db   │  ← Один файл           │
│              └─────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

### Преимущества SQLite

#### Простота

- **Нулевая конфигурация** — нет сервера, пользователей, прав доступа
- **Один файл** — легко бэкапить, копировать, переносить
- **Самодостаточность** — всё в одной библиотеке

#### Надёжность

- **ACID-транзакции** — атомарность, согласованность, изоляция, долговечность
- **Crash-safe** — защита от сбоев питания и краша
- **Тестирование** — 100% покрытие тестами, миллионы тестов

#### Производительность

- **Быстрые чтения** — часто быстрее клиент-серверных БД для простых запросов
- **Нет сетевого overhead** — данные читаются напрямую с диска
- **Кэширование** — эффективное использование page cache

#### Универсальность

- **Любая платформа** — Windows, macOS, Linux, iOS, Android, embedded
- **Любой язык** — биндинги для всех популярных языков
- **SQL** — стандартный SQL с расширениями

---

### Недостатки SQLite

#### Ограничения масштабирования

| Ограничение | Описание |
|-------------|----------|
| **Один writer** | Только один процесс может писать одновременно |
| **Нет сетевого доступа** | Не подходит для распределённых систем |
| **Размер БД** | До 281 TB теоретически, практически — до нескольких GB |
| **Конкурентность** | Блокировка на уровне файла при записи |

#### Функциональные ограничения

- **Нет пользователей/ролей** — безопасность на уровне файловой системы
- **Ограниченный ALTER TABLE** — нельзя удалить/переименовать колонки (до версии 3.35)
- **Нет RIGHT JOIN, FULL OUTER JOIN** — только LEFT JOIN
- **Динамическая типизация** — тип колонки не строго проверяется

#### Когда НЕ использовать

- Высокая конкурентность записи (много пишущих клиентов)
- Клиент-серверная архитектура с множеством подключений
- Очень большие базы данных (>100GB)
- Требуется репликация и высокая доступность

---

### Сценарии использования

#### Идеально подходит

| Сценарий | Примеры |
|----------|---------|
| **Мобильные приложения** | iOS, Android — локальное хранение данных |
| **Desktop приложения** | Electron, Tauri — настройки, кэш, данные |
| **Embedded системы** | IoT, роутеры, умные устройства |
| **Прототипирование** | Быстрый старт без настройки БД |
| **Тестирование** | In-memory БД для тестов |
| **Кэш** | Локальный кэш данных с сервера |
| **Edge computing** | Локальные данные на устройствах |
| **Браузеры** | IndexedDB, Web SQL (устарел) |

#### Примеры использования в production

- **Браузеры** — Chrome, Firefox, Safari хранят историю, куки, кэш
- **Мессенджеры** — WhatsApp, Telegram, Signal хранят сообщения локально
- **Операционные системы** — iOS, Android системные данные
- **Приложения** — Skype, iTunes, Dropbox, Adobe Lightroom

---

### Основы работы с SQLite

#### Установка CLI

```bash
# macOS
brew install sqlite

# Ubuntu/Debian
sudo apt install sqlite3

# Windows — скачать с sqlite.org
```

#### Базовые команды CLI

```bash
# Создание/открытие базы
sqlite3 mydb.sqlite

# Команды SQLite CLI (начинаются с точки)
sqlite> .help              # Справка
sqlite> .databases         # Список баз
sqlite> .tables            # Список таблиц
sqlite> .schema users      # Схема таблицы
sqlite> .headers on        # Показывать заголовки
sqlite> .mode column       # Табличный вывод
sqlite> .quit              # Выход

# Экспорт/импорт
sqlite> .dump              # Дамп всей базы
sqlite> .dump users        # Дамп таблицы
sqlite> .read backup.sql   # Выполнить SQL-файл
sqlite> .output result.txt # Вывод в файл
```

#### Создание таблиц

```sql
-- Создание таблицы
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    age INTEGER CHECK(age >= 0),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    published INTEGER DEFAULT 0,  -- Boolean как INTEGER
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индексы
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

#### Типы данных

SQLite использует динамическую типизацию с 5 классами хранения:

| Storage Class | Описание |
|---------------|----------|
| `NULL` | Отсутствие значения |
| `INTEGER` | Целое число (1, 2, 4, 6 или 8 байт) |
| `REAL` | Число с плавающей точкой (8 байт) |
| `TEXT` | Строка (UTF-8, UTF-16) |
| `BLOB` | Бинарные данные |

```sql
-- SQLite гибко интерпретирует типы
CREATE TABLE example (
    id INTEGER,           -- Строго INTEGER для PRIMARY KEY
    name VARCHAR(100),    -- Хранится как TEXT
    price DECIMAL(10,2),  -- Хранится как REAL или TEXT
    data BLOB,
    active BOOLEAN        -- Хранится как INTEGER (0/1)
);
```

#### CRUD-операции

```sql
-- INSERT
INSERT INTO users (email, name, age) VALUES ('john@example.com', 'John', 30);
INSERT INTO users (email, name) VALUES ('jane@example.com', 'Jane');

-- SELECT
SELECT * FROM users;
SELECT id, name FROM users WHERE age > 25;
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- UPDATE
UPDATE users SET age = 31 WHERE email = 'john@example.com';

-- DELETE
DELETE FROM users WHERE id = 1;

-- UPSERT (INSERT OR REPLACE)
INSERT OR REPLACE INTO users (id, email, name) VALUES (1, 'new@example.com', 'New');

-- INSERT OR IGNORE
INSERT OR IGNORE INTO users (email, name) VALUES ('existing@example.com', 'Existing');
```

#### Транзакции

```sql
-- Явная транзакция
BEGIN TRANSACTION;
INSERT INTO users (email, name) VALUES ('user1@example.com', 'User 1');
INSERT INTO posts (user_id, title) VALUES (last_insert_rowid(), 'First Post');
COMMIT;

-- Откат
BEGIN;
UPDATE users SET age = 100;
-- Что-то пошло не так...
ROLLBACK;

-- Режимы транзакций
BEGIN DEFERRED;    -- Блокировка при первой операции (по умолчанию)
BEGIN IMMEDIATE;   -- Блокировка сразу (рекомендуется для записи)
BEGIN EXCLUSIVE;   -- Эксклюзивная блокировка
```

#### Pragma (настройки)

```sql
-- Включить внешние ключи (по умолчанию отключены!)
PRAGMA foreign_keys = ON;

-- WAL mode (рекомендуется для конкурентности)
PRAGMA journal_mode = WAL;

-- Синхронизация (NORMAL — баланс скорости и надёжности)
PRAGMA synchronous = NORMAL;

-- Размер кэша (в страницах, по умолчанию 2000)
PRAGMA cache_size = 10000;

-- Информация о базе
PRAGMA database_list;
PRAGMA table_info(users);
PRAGMA index_list(users);
```

---

### SQLite в Node.js

#### better-sqlite3 (синхронный, рекомендуется)

Самая быстрая библиотека для Node.js, синхронный API.

```bash
npm install better-sqlite3
```

```javascript
import Database from 'better-sqlite3';

// Открытие базы
const db = new Database('mydb.sqlite', {
  verbose: console.log,  // Логирование запросов
  fileMustExist: false   // Создать если не существует
});

// Настройки производительности
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Создание таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Prepared statements (рекомендуется)
const insertUser = db.prepare(`
  INSERT INTO users (email, name) VALUES (@email, @name)
`);

const getUser = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

const getAllUsers = db.prepare(`
  SELECT * FROM users ORDER BY created_at DESC
`);

const getUserPosts = db.prepare(`
  SELECT p.*, u.name as author_name
  FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE p.user_id = ?
`);

// Использование
const result = insertUser.run({ email: 'john@example.com', name: 'John' });
console.log(result.lastInsertRowid); // ID нового пользователя

const user = getUser.get(1);  // Одна строка
const users = getAllUsers.all();  // Все строки
const posts = getUserPosts.all(1);

// Транзакции
const createUserWithPosts = db.transaction((user, posts) => {
  const { lastInsertRowid: userId } = insertUser.run(user);

  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)
  `);

  for (const post of posts) {
    insertPost.run(userId, post.title, post.content);
  }

  return userId;
});

// Использование транзакции
const userId = createUserWithPosts(
  { email: 'jane@example.com', name: 'Jane' },
  [
    { title: 'First Post', content: 'Hello!' },
    { title: 'Second Post', content: 'World!' }
  ]
);

// Batch insert (очень быстро)
const insertMany = db.transaction((users) => {
  for (const user of users) {
    insertUser.run(user);
  }
});

insertMany([
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
  { email: 'user3@example.com', name: 'User 3' }
]);

// Итератор для больших результатов
for (const user of getAllUsers.iterate()) {
  console.log(user.name);
}

// Закрытие
db.close();
```

#### sql.js (WebAssembly, браузер/Node.js)

SQLite скомпилированный в WebAssembly, работает в браузере и Node.js.

```bash
npm install sql.js
```

```javascript
import initSqlJs from 'sql.js';

// Инициализация
const SQL = await initSqlJs({
  locateFile: file => `https://sql.js.org/dist/${file}`
});

// Создание БД в памяти
const db = new SQL.Database();

// Или загрузка из файла
const fileBuffer = fs.readFileSync('mydb.sqlite');
const db = new SQL.Database(fileBuffer);

// Выполнение запросов
db.run(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
  INSERT INTO users VALUES (1, 'John');
  INSERT INTO users VALUES (2, 'Jane');
`);

// Получение данных
const result = db.exec('SELECT * FROM users');
console.log(result);
// [{ columns: ['id', 'name'], values: [[1, 'John'], [2, 'Jane']] }]

// Prepared statements
const stmt = db.prepare('SELECT * FROM users WHERE id = $id');
stmt.bind({ $id: 1 });

while (stmt.step()) {
  const row = stmt.getAsObject();
  console.log(row); // { id: 1, name: 'John' }
}
stmt.free();

// Экспорт базы
const data = db.export();
const buffer = Buffer.from(data);
fs.writeFileSync('backup.sqlite', buffer);

db.close();
```

#### Drizzle ORM (Type-safe, современный)

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

```typescript
// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content')
});

// db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('mydb.sqlite');
export const db = drizzle(sqlite, { schema });

// Использование
import { db } from './db';
import { users, posts } from './schema';
import { eq } from 'drizzle-orm';

// Insert
const newUser = await db.insert(users).values({
  email: 'john@example.com',
  name: 'John'
}).returning();

// Select
const allUsers = await db.select().from(users);

const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: true
  }
});

// Update
await db.update(users)
  .set({ name: 'John Doe' })
  .where(eq(users.id, 1));

// Delete
await db.delete(users).where(eq(users.id, 1));
```

---

### SQLite в React Native + Expo

#### expo-sqlite (Expo SDK 50+)

Официальная библиотека Expo для SQLite.

```bash
npx expo install expo-sqlite
```

##### Базовое использование

```typescript
// database.ts
import * as SQLite from 'expo-sqlite';

// Открытие базы (асинхронно, Expo SDK 50+)
const db = await SQLite.openDatabaseAsync('myapp.db');

// Настройки
await db.execAsync('PRAGMA journal_mode = WAL');
await db.execAsync('PRAGMA foreign_keys = ON');

// Создание таблиц
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
`);

export { db };
```

##### CRUD-операции

```typescript
// userService.ts
import { db } from './database';

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  created_at: string;
}

// Получение всех пользователей
export async function getAllUsers(): Promise<User[]> {
  return await db.getAllAsync<User>('SELECT * FROM users ORDER BY created_at DESC');
}

// Получение одного пользователя
export async function getUserById(id: number): Promise<User | null> {
  return await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', id);
}

// Создание пользователя
export async function createUser(email: string, name?: string): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO users (email, name) VALUES (?, ?)',
    email,
    name ?? null
  );
  return result.lastInsertRowId;
}

// Обновление пользователя
export async function updateUser(id: number, data: Partial<User>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(data.avatar);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );
}

// Удаление пользователя
export async function deleteUser(id: number): Promise<void> {
  await db.runAsync('DELETE FROM users WHERE id = ?', id);
}
```

##### Транзакции

```typescript
// noteService.ts
import { db } from './database';

interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

// Создание заметки с тегами (транзакция)
export async function createNoteWithTags(
  userId: number,
  title: string,
  content: string,
  tagIds: number[]
): Promise<number> {
  return await db.withTransactionAsync(async () => {
    // Создаём заметку
    const result = await db.runAsync(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      userId,
      title,
      content
    );

    const noteId = result.lastInsertRowId;

    // Добавляем теги
    for (const tagId of tagIds) {
      await db.runAsync(
        'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)',
        noteId,
        tagId
      );
    }

    return noteId;
  });
}

// Получение заметок с пагинацией
export async function getNotes(
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<Note[]> {
  const offset = (page - 1) * limit;

  return await db.getAllAsync<Note>(
    `SELECT * FROM notes
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    userId,
    limit,
    offset
  );
}

// Поиск заметок
export async function searchNotes(userId: number, query: string): Promise<Note[]> {
  return await db.getAllAsync<Note>(
    `SELECT * FROM notes
     WHERE user_id = ?
       AND (title LIKE ? OR content LIKE ?)
     ORDER BY updated_at DESC`,
    userId,
    `%${query}%`,
    `%${query}%`
  );
}
```

##### React Hook для SQLite

```typescript
// hooks/useDatabase.ts
import { useEffect, useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function useDatabase() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initDatabase() {
      if (dbInstance) {
        setDb(dbInstance);
        setIsReady(true);
        return;
      }

      try {
        const database = await SQLite.openDatabaseAsync('myapp.db');

        // Миграции
        await database.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT
          );

          CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );
        `);

        dbInstance = database;
        setDb(database);
        setIsReady(true);
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    }

    initDatabase();
  }, []);

  return { db, isReady };
}

// hooks/useNotes.ts
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';

interface Note {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
}

export function useNotes(userId: number) {
  const { db, isReady } = useDatabase();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!db) return;

    setLoading(true);
    try {
      const result = await db.getAllAsync<Note>(
        'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
        userId
      );
      setNotes(result);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, [db, userId]);

  useEffect(() => {
    if (isReady) {
      fetchNotes();
    }
  }, [isReady, fetchNotes]);

  const addNote = useCallback(async (title: string, content: string) => {
    if (!db) return;

    await db.runAsync(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      userId,
      title,
      content
    );
    await fetchNotes();
  }, [db, userId, fetchNotes]);

  const deleteNote = useCallback(async (noteId: number) => {
    if (!db) return;

    await db.runAsync('DELETE FROM notes WHERE id = ?', noteId);
    await fetchNotes();
  }, [db, fetchNotes]);

  return { notes, loading, addNote, deleteNote, refetch: fetchNotes };
}
```

##### Использование в компонентах

```tsx
// screens/NotesScreen.tsx
import { View, FlatList, Text, Button, ActivityIndicator } from 'react-native';
import { useNotes } from '../hooks/useNotes';

export function NotesScreen({ userId }: { userId: number }) {
  const { notes, loading, addNote, deleteNote } = useNotes(userId);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Button
        title="Add Note"
        onPress={() => addNote('New Note', 'Content...')}
      />

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
            <Text>{item.content}</Text>
            <Button
              title="Delete"
              onPress={() => deleteNote(item.id)}
              color="red"
            />
          </View>
        )}
      />
    </View>
  );
}
```

##### Миграции базы данных

```typescript
// migrations.ts
import * as SQLite from 'expo-sqlite';

interface Migration {
  version: number;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT
      );
    `
  },
  {
    version: 2,
    up: `
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `
  },
  {
    version: 3,
    up: `
      ALTER TABLE notes ADD COLUMN is_favorite INTEGER DEFAULT 0;
      CREATE INDEX idx_notes_favorite ON notes(is_favorite);
    `
  }
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Создаём таблицу миграций
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Получаем текущую версию
  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM migrations'
  );
  const currentVersion = result?.version ?? 0;

  // Применяем новые миграции
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Applying migration ${migration.version}...`);

      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.up);
        await db.runAsync(
          'INSERT INTO migrations (version) VALUES (?)',
          migration.version
        );
      });
    }
  }
}

// Использование при инициализации
const db = await SQLite.openDatabaseAsync('myapp.db');
await runMigrations(db);
```

##### Синхронизация с сервером

```typescript
// sync.ts
import * as SQLite from 'expo-sqlite';

interface SyncableEntity {
  id: number;
  updated_at: string;
  synced_at: string | null;
  deleted: number;
}

export async function syncNotes(
  db: SQLite.SQLiteDatabase,
  userId: number
): Promise<void> {
  // 1. Получаем локальные изменения
  const localChanges = await db.getAllAsync<SyncableEntity>(
    `SELECT * FROM notes
     WHERE user_id = ?
       AND (synced_at IS NULL OR updated_at > synced_at)`,
    userId
  );

  // 2. Отправляем на сервер
  const response = await fetch('https://api.example.com/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      changes: localChanges,
      lastSync: await getLastSyncTime(db, userId)
    })
  });

  const { serverChanges, syncTime } = await response.json();

  // 3. Применяем изменения с сервера
  await db.withTransactionAsync(async () => {
    for (const change of serverChanges) {
      if (change.deleted) {
        await db.runAsync('DELETE FROM notes WHERE id = ?', change.id);
      } else {
        await db.runAsync(
          `INSERT OR REPLACE INTO notes
           (id, user_id, title, content, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          change.id,
          change.user_id,
          change.title,
          change.content,
          change.updated_at,
          syncTime
        );
      }
    }

    // Обновляем synced_at для локальных изменений
    for (const local of localChanges) {
      await db.runAsync(
        'UPDATE notes SET synced_at = ? WHERE id = ?',
        syncTime,
        local.id
      );
    }
  });
}
```

---

### Оптимизация производительности

#### Индексы

```sql
-- Создание индексов для частых запросов
CREATE INDEX idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX idx_notes_favorite ON notes(is_favorite) WHERE is_favorite = 1;

-- Анализ использования индексов
EXPLAIN QUERY PLAN SELECT * FROM notes WHERE user_id = 1 ORDER BY updated_at DESC;
```

#### WAL mode

```sql
-- Включить WAL (Write-Ahead Logging)
PRAGMA journal_mode = WAL;

-- Преимущества:
-- + Параллельное чтение и запись
-- + Лучшая производительность
-- + Атомарный checkpoint

-- Недостатки:
-- - Дополнительные файлы (-wal, -shm)
-- - Не работает на сетевых дисках
```

#### Batch operations

```typescript
// Плохо: много отдельных INSERT
for (const note of notes) {
  await db.runAsync('INSERT INTO notes (title) VALUES (?)', note.title);
}

// Хорошо: одна транзакция
await db.withTransactionAsync(async () => {
  for (const note of notes) {
    await db.runAsync('INSERT INTO notes (title) VALUES (?)', note.title);
  }
});

// Ещё лучше: batch INSERT (если поддерживается)
const placeholders = notes.map(() => '(?)').join(', ');
await db.runAsync(
  `INSERT INTO notes (title) VALUES ${placeholders}`,
  ...notes.map(n => n.title)
);
```

---

### Best Practices

#### Безопасность

```typescript
// НИКОГДА не делайте так (SQL injection!)
const query = `SELECT * FROM users WHERE name = '${userInput}'`;

// ВСЕГДА используйте параметризованные запросы
const result = await db.getAllAsync(
  'SELECT * FROM users WHERE name = ?',
  userInput
);
```

#### Рекомендации

| Практика | Описание |
|----------|----------|
| **PRAGMA foreign_keys = ON** | Включать в каждом подключении |
| **WAL mode** | Использовать для мобильных приложений |
| **Prepared statements** | Использовать для повторяющихся запросов |
| **Транзакции** | Группировать связанные операции |
| **Индексы** | Создавать для WHERE и JOIN колонок |
| **VACUUM** | Периодически выполнять для оптимизации |
| **Бэкапы** | Копировать файл БД при закрытом подключении |

---

### Альтернативы

| Библиотека | Описание |
|------------|----------|
| **expo-sqlite** | Официальная для Expo |
| **react-native-sqlite-storage** | Для bare React Native |
| **WatermelonDB** | ORM с lazy loading, синхронизация |
| **Realm** | Альтернатива SQLite, своя БД |
| **MMKV** | Для простых key-value (быстрее AsyncStorage) |

---

### Ссылки

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Drizzle ORM](https://orm.drizzle.team/)
- [SQLite Performance Tips](https://www.sqlite.org/queryplanner.html)
