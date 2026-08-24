---
tags:
  - sqlite
  - database
  - sql
  - embedded
  - python
---

## SQLite

SQLite — встраиваемая реляционная СУБД: библиотека внутри приложения, обычно с базой в одном файле. Отдельный сервер, сетевой протокол и демон не нужны. Это полноценный SQL-движок с транзакциями ACID, индексами, внешними ключами, представлениями и триггерами.

### Что такое SQLite и как она встраивается

Приложение вызывает API SQLite, а библиотека читает и изменяет файл. Поэтому нет сетевой задержки и отдельного сервера для администрирования. Файл можно переносить и открывать через `sqlite3`, а журнал отката или WAL защищает транзакции от сбоев.

Можно выбрать файл, временную базу или `:memory:`. Последняя живёт только внутри одного соединения: два подключения не видят общую память, а данные исчезают при закрытии. Для общего локального состояния используйте файл.

SQLite удобна для desktop- и мобильных приложений, CLI, локального кэша, тестов, прототипов и edge-устройств. Она работает офлайн и доступна из большинства языков; ниже используется стандартный Python `sqlite3`.

### Когда использовать SQLite, а когда выбрать серверную СУБД

SQLite подходит, если данные локальны, приложение разворачивается как один процесс или несколько процессов на одной машине, а простой backup файла важнее репликации. Она хороша без постоянного администратора БД и при offline-first подходе.

PostgreSQL, MySQL и другие серверные СУБД выбирайте, когда много независимых клиентов пишут в одну базу, нужны сеть, роли, репликация, failover, централизованный аудит или распределённое масштабирование. У SQLite только одна write-транзакция одновременно. В WAL читатели могут работать параллельно с одним писателем, но WAL рассчитан на локальную файловую систему, не на network FS.

У SQLite нет универсального ограничения вроде «после N гигабайт она непригодна». Решение зависит от нагрузки, конкуренции, требований к доступности и управлению.

### Отличия SQLite от привычных SQL-СУБД

SQLite использует динамическую типизацию: storage classes — `NULL`, `INTEGER`, `REAL`, `TEXT`, `BLOB`. Объявленный тип задаёт affinity, то есть предпочтительное преобразование, а не всегда жёсткую проверку. `NUMERIC` affinity старается хранить число как `INTEGER` или `REAL`. Для строгой схемы есть таблицы `STRICT` (зависит от версии).

Внешние ключи включаются для каждого соединения: `PRAGMA foreign_keys = ON`; это не глобальная настройка файла. `INTEGER PRIMARY KEY` — алиас `rowid` и обычно лучше `AUTOINCREMENT`; последний нужен лишь для гарантии не переиспользовать удалённые идентификаторы.

Возможности `ALTER TABLE`, `RIGHT JOIN` и `FULL OUTER JOIN` зависят от версии SQLite. Сложную миграцию иногда делают через новую таблицу и перенос данных. Для UPSERT используйте `INSERT ... ON CONFLICT DO UPDATE`: `INSERT OR REPLACE` удаляет конфликтующую строку и вставляет новую, поэтому может изменить `id`, запустить каскады и потерять поля.

### Минимум CLI и SQL

После установки CLI откройте или создайте файл базы:

```bash
sqlite3 app.db
```

Команды с точкой относятся к CLI:

```text
.tables
.schema users
.headers on
.mode column
.databases
.quit
```

Пример схемы:

```sql
PRAGMA foreign_keys = ON;
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL
);
CREATE INDEX posts_user_id_idx ON posts(user_id);
INSERT INTO users(email) VALUES ('ada@example.com');
INSERT INTO posts(user_id, title) VALUES (1, 'Первый пост');
SELECT users.email, posts.title FROM users JOIN posts ON posts.user_id = users.id;
```

Параметры передавайте через API драйвера, а не конкатенацией строк: это защищает от SQL-инъекций и корректно обрабатывает типы.

### Транзакции, конкурентность и WAL

Несколько связанных изменений объединяйте в транзакцию: либо фиксируются все, либо выполняется rollback. `BEGIN DEFERRED` откладывает блокировку, `BEGIN IMMEDIATE` заранее заявляет намерение писать. Делайте write-транзакции короткими и настраивайте timeout.

`PRAGMA journal_mode = WAL` позволяет читателям видеть согласованный снимок, пока один writer пишет. Это не даёт нескольким писателям работать одновременно. Долгие read-транзакции задерживают checkpoint и могут увеличивать WAL-файл.

WAL и основной файл должны находиться на локальном диске. На network FS блокировки и shared memory могут работать неправильно. Для активной базы используйте backup API или согласованный dump: простое копирование одного файла может не включить данные из `-wal`.

### Интеграция с Python через sqlite3

Пример стандартной библиотеки создаёт файлы во временном каталоге и не удаляет пользовательские данные. `PRAGMA foreign_keys` выполняется сразу после подключения, до транзакции.

```python
from contextlib import closing
from pathlib import Path
import sqlite3
import tempfile

with tempfile.TemporaryDirectory() as tmp:
    db_path = Path(tmp) / "app.db"
    backup_path = Path(tmp) / "app.backup.db"
    with closing(sqlite3.connect(db_path, timeout=5.0)) as db:
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
        db.execute("PRAGMA journal_mode = WAL")
        db.executescript("""
            CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
            CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL);
        """)
        with db:
            user_id = db.execute(
                "INSERT INTO users(email, name) VALUES (?, ?)",
                ("ada@example.com", "Ada"),
            ).lastrowid
            db.execute(
                "INSERT INTO posts(user_id, title) VALUES (?, ?)",
                (user_id, "SQLite из Python"),
            )
            db.execute(
                """INSERT INTO users(id, email, name) VALUES (?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET name = excluded.name""",
                (user_id, "ada@example.com", "Ada Lovelace"),
            )
        rows = db.execute("""
            SELECT users.id, users.name, posts.title
            FROM users JOIN posts ON posts.user_id = users.id
        """).fetchall()
        print([dict(row) for row in rows])
        try:
            with db:
                db.execute(
                    "INSERT INTO posts(user_id, title) VALUES (?, ?)",
                    (999, "Невозможный пост"),
                )
        except sqlite3.IntegrityError as error:
            print(f"Ожидаемая ошибка внешнего ключа: {error}")
        with closing(sqlite3.connect(backup_path, timeout=5.0)) as backup:
            db.backup(backup)
            print("Проверка backup:", backup.execute("PRAGMA integrity_check").fetchone()[0])
```

`with db:` коммитит успешный блок и откатывает его при исключении, но не закрывает соединение; для закрытия используется `closing`. `Row` даёт доступ к полям по именам. Значения параметризуются, а имена таблиц и колонок нельзя безопасно подставлять тем же механизмом.

### Миграции, тестирование и резервные копии

Храните схему в последовательных миграциях с номером и таблицей применённых версий. `CREATE TABLE IF NOT EXISTS` полезен для первого запуска, но не заменяет изменение существующей схемы. Тестируйте миграции, ограничения, индексы и внешние ключи на временной копии.

Для unit-тестов используйте один `:memory:`-connection или временный файл, если нужно проверить несколько соединений. Помните, что `:memory:` исчезает при закрытии и не является общей базой.

Активную базу копируйте через `Connection.backup()`/Backup API либо согласованный dump. После backup выполняйте `PRAGMA integrity_check` и проверяйте реальное восстановление. В WAL-режиме нельзя бездумно копировать только основной файл: состояние может быть в `-wal` и `-shm`.

### Практический чек-лист и официальные источники

- Определите, локальны ли данные и нужна ли серверная конкурентность.
- Для каждого соединения включите `PRAGMA foreign_keys = ON`.
- Используйте `INTEGER PRIMARY KEY`, если не нужна особая семантика `AUTOINCREMENT`.
- Пишите параметризованные запросы и настоящий `ON CONFLICT DO UPDATE`.
- Делайте короткие транзакции; при конкуренции рассмотрите WAL и timeout.
- Не размещайте WAL-базу на network FS.
- Введите миграции, временные тестовые базы и проверяемые backup-и.
- Проверьте версию SQLite перед новыми возможностями SQL.

Официальные источники:

- [SQLite Documentation](https://sqlite.org/docs.html)
- [SQLite Transactions](https://sqlite.org/lang_transaction.html)
- [SQLite WAL](https://sqlite.org/wal.html)
- [SQLite Datatypes and Affinity](https://sqlite.org/datatype3.html)
- [SQLite Foreign Keys](https://sqlite.org/foreignkeys.html)
- [SQLite Backup API](https://sqlite.org/backup.html)
- [Python sqlite3](https://docs.python.org/3/library/sqlite3.html)
