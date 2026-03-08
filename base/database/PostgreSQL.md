---
tags:
  - database
  - postgresql
  - sql
  - backend
---

## PostgreSQL

PostgreSQL (Postgres) — мощная объектно-реляционная СУБД с открытым исходным кодом. Поддерживает ACID-транзакции, сложные запросы, JSON, полнотекстовый поиск, расширения и многое другое.

---

### Установка и настройка

#### Установка

##### macOS

```bash
brew install postgresql@16
brew services start postgresql@16

# Добавить в PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
```

##### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запуск сервиса
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

##### Windows

Скачать установщик с [postgresql.org](https://www.postgresql.org/download/windows/)

```bash
docker run --name postgres -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:16
```

#### Подключение

```bash
# Подключение к локальному серверу
psql -U postgres

# Подключение к конкретной БД
psql -h localhost -U username -d database_name

# Строка подключения
psql "postgresql://user:password@localhost:5432/dbname"
```

#### psql — консольный клиент

```sql
-- Мета-команды psql
\l              -- Список баз данных
\c dbname       -- Подключиться к БД
\dt             -- Список таблиц
\d tablename    -- Структура таблицы
\di             -- Список индексов
\dv             -- Список представлений
\df             -- Список функций
\du             -- Список пользователей
\x              -- Расширенный вывод (вертикальный)
\timing         -- Показывать время выполнения
\i file.sql     -- Выполнить SQL-файл
\q              -- Выход

-- Примеры
\d+ users       -- Подробная информация о таблице
\dt public.*    -- Таблицы в схеме public
```

#### pgAdmin — графический интерфейс

pgAdmin — официальный GUI для PostgreSQL. После установки:

1. **Servers** → Add New Server
2. Указать: Name, Host (localhost), Port (5432), Username, Password
3. В дереве объектов видны: Databases → Schemas → Tables

**Что смотреть в pgAdmin:**
- **Query Tool** — выполнение SQL-запросов
- **Properties** — свойства объектов (таблицы, индексы)
- **Statistics** — статистика использования
- **Dependencies** — зависимости объектов
- **ERD Tool** — визуализация связей таблиц

---

### Основы SQL

#### Создание базы данных

```sql
-- Создание БД
CREATE DATABASE shop;

-- Создание с параметрами
CREATE DATABASE shop
    ENCODING = 'UTF8'
    LC_COLLATE = 'ru_RU.UTF-8'
    LC_CTYPE = 'ru_RU.UTF-8'
    TEMPLATE = template0;

-- Удаление БД
DROP DATABASE IF EXISTS shop;

-- Список БД
SELECT datname FROM pg_database;
```

#### Типы данных

##### Числовые

| Тип | Размер | Диапазон | Описание |
|-----|--------|----------|----------|
| `SMALLINT` | 2 байта | -32768 до 32767 | Малое целое |
| `INTEGER` / `INT` | 4 байта | -2.1 млрд до 2.1 млрд | Целое |
| `BIGINT` | 8 байт | ±9.2 квинтиллиона | Большое целое |
| `DECIMAL(p,s)` | переменный | до 131072 цифр | Точное число |
| `NUMERIC(p,s)` | переменный | то же | Синоним DECIMAL |
| `REAL` | 4 байта | 6 знаков точности | Число с плавающей точкой |
| `DOUBLE PRECISION` | 8 байт | 15 знаков точности | Двойная точность |
| `SERIAL` | 4 байта | автоинкремент | Автоматический ID |
| `BIGSERIAL` | 8 байт | автоинкремент | Большой автоматический ID |

```sql
-- Примеры
price DECIMAL(10, 2)   -- До 10 цифр, 2 после запятой
quantity INTEGER
id SERIAL PRIMARY KEY
```

##### Строковые

| Тип | Описание |
|-----|----------|
| `CHAR(n)` | Строка фиксированной длины (дополняется пробелами) |
| `VARCHAR(n)` | Строка переменной длины (до n символов) |
| `TEXT` | Строка неограниченной длины |

```sql
code CHAR(5)           -- Всегда 5 символов
name VARCHAR(100)      -- До 100 символов
description TEXT       -- Без ограничений
```

##### Дата и время

| Тип | Описание | Пример |
|-----|----------|--------|
| `DATE` | Дата | 2024-01-15 |
| `TIME` | Время | 14:30:00 |
| `TIMESTAMP` | Дата и время | 2024-01-15 14:30:00 |
| `TIMESTAMPTZ` | С временной зоной | 2024-01-15 14:30:00+03 |
| `INTERVAL` | Интервал времени | 1 year 2 months |

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMPTZ DEFAULT NOW()
duration INTERVAL
```

##### Логический и другие

| Тип | Описание |
|-----|----------|
| `BOOLEAN` | true / false / null |
| `UUID` | Универсальный уникальный идентификатор |
| `JSON` | JSON-данные (текст) |
| `JSONB` | JSON в бинарном формате (быстрее) |
| `ARRAY` | Массив значений |
| `BYTEA` | Бинарные данные |

```sql
is_active BOOLEAN DEFAULT true
id UUID DEFAULT gen_random_uuid()
metadata JSONB
tags TEXT[]            -- Массив строк
numbers INTEGER[]      -- Массив чисел
```

---

### Создание и изменение таблиц

#### CREATE TABLE

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    balance DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- С комментариями
COMMENT ON TABLE users IS 'Пользователи системы';
COMMENT ON COLUMN users.email IS 'Email пользователя (уникальный)';
```

#### Ограничения (Constraints)

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,                              -- Первичный ключ
    sku VARCHAR(50) UNIQUE,                             -- Уникальное значение
    name VARCHAR(200) NOT NULL,                         -- Обязательное поле
    price DECIMAL(10, 2) CHECK (price >= 0),            -- Проверка значения
    category_id INTEGER REFERENCES categories(id),      -- Внешний ключ

    -- Составной уникальный ключ
    UNIQUE (sku, category_id),

    -- Именованное ограничение
    CONSTRAINT positive_price CHECK (price > 0)
);

-- Внешний ключ с действиями
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE      -- Удалить заказы при удалении пользователя
        ON UPDATE CASCADE      -- Обновить при изменении id
);

-- Варианты ON DELETE / ON UPDATE:
-- CASCADE    — каскадное действие
-- SET NULL   — установить NULL
-- SET DEFAULT — установить значение по умолчанию
-- RESTRICT   — запретить (по умолчанию)
-- NO ACTION  — отложенная проверка
```

#### ALTER TABLE

```sql
-- Добавление колонки
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Удаление колонки
ALTER TABLE users DROP COLUMN phone;

-- Изменение типа
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(200);

-- Установка/удаление DEFAULT
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE users ALTER COLUMN is_active DROP DEFAULT;

-- NOT NULL
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Переименование
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users RENAME TO customers;

-- Добавление ограничения
ALTER TABLE users ADD CONSTRAINT email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Удаление ограничения
ALTER TABLE users DROP CONSTRAINT email_format;

-- Добавление внешнего ключа
ALTER TABLE orders ADD FOREIGN KEY (user_id) REFERENCES users(id);
```

#### DROP TABLE

```sql
-- Удаление таблицы
DROP TABLE users;

-- Если существует
DROP TABLE IF EXISTS users;

-- Каскадное удаление (удалит зависимые объекты)
DROP TABLE users CASCADE;
```

---

### CRUD-операции

#### INSERT — вставка данных

```sql
-- Вставка одной записи
INSERT INTO users (email, name, age)
VALUES ('alice@example.com', 'Alice', 25);

-- Вставка нескольких записей
INSERT INTO users (email, name, age) VALUES
    ('bob@example.com', 'Bob', 30),
    ('carol@example.com', 'Carol', 28),
    ('dave@example.com', 'Dave', 35);

-- Вставка с возвратом данных
INSERT INTO users (email, name)
VALUES ('eve@example.com', 'Eve')
RETURNING id, email, created_at;

-- Вставка из другой таблицы
INSERT INTO users_archive (email, name)
SELECT email, name FROM users WHERE is_active = false;

-- Вставка с обработкой конфликтов (UPSERT)
INSERT INTO users (email, name)
VALUES ('alice@example.com', 'Alice Updated')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- Игнорировать конфликт
INSERT INTO users (email, name)
VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO NOTHING;
```

#### SELECT — выборка данных

```sql
-- Все колонки
SELECT * FROM users;

-- Конкретные колонки
SELECT id, email, name FROM users;

-- С псевдонимами
SELECT
    id,
    email AS user_email,
    name AS user_name,
    age * 12 AS age_in_months
FROM users;

-- DISTINCT — уникальные значения
SELECT DISTINCT role FROM users;
SELECT DISTINCT ON (role) * FROM users;

-- Вычисляемые поля
SELECT
    name,
    price,
    quantity,
    price * quantity AS total
FROM products;
```

#### WHERE — фильтрация

```sql
-- Операторы сравнения
SELECT * FROM users WHERE age > 25;
SELECT * FROM users WHERE age >= 25;
SELECT * FROM users WHERE age < 30;
SELECT * FROM users WHERE age <= 30;
SELECT * FROM users WHERE age = 25;
SELECT * FROM users WHERE age <> 25;  -- Не равно
SELECT * FROM users WHERE age != 25;  -- Не равно (альтернатива)

-- Логические операторы
SELECT * FROM users WHERE age > 25 AND is_active = true;
SELECT * FROM users WHERE age < 20 OR age > 60;
SELECT * FROM users WHERE NOT is_active;

-- BETWEEN — диапазон
SELECT * FROM users WHERE age BETWEEN 20 AND 30;
SELECT * FROM orders WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- IN — список значений
SELECT * FROM users WHERE role IN ('admin', 'moderator');
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- NULL
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;

-- LIKE — поиск по шаблону
SELECT * FROM users WHERE name LIKE 'A%';      -- Начинается с A
SELECT * FROM users WHERE name LIKE '%son';    -- Заканчивается на son
SELECT * FROM users WHERE name LIKE '%ali%';   -- Содержит ali
SELECT * FROM users WHERE name LIKE 'A_ice';   -- A + любой символ + ice

-- ILIKE — без учёта регистра
SELECT * FROM users WHERE name ILIKE '%alice%';

-- Регулярные выражения
SELECT * FROM users WHERE email ~ '^[a-z]+@';
SELECT * FROM users WHERE email ~* '^[a-z]+@';  -- Без учёта регистра
```

#### ORDER BY — сортировка

```sql
-- По возрастанию (по умолчанию)
SELECT * FROM users ORDER BY name;
SELECT * FROM users ORDER BY name ASC;

-- По убыванию
SELECT * FROM users ORDER BY created_at DESC;

-- По нескольким полям
SELECT * FROM users ORDER BY role ASC, name ASC;

-- NULL в начале/конце
SELECT * FROM users ORDER BY phone NULLS FIRST;
SELECT * FROM users ORDER BY phone NULLS LAST;

-- По порядковому номеру колонки
SELECT name, age FROM users ORDER BY 2 DESC;
```

#### LIMIT и OFFSET — пагинация

```sql
-- Первые 10 записей
SELECT * FROM users LIMIT 10;

-- Пропустить 20, взять 10 (страница 3)
SELECT * FROM users LIMIT 10 OFFSET 20;

-- Альтернативный синтаксис
SELECT * FROM users OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;
```

#### UPDATE — обновление

```sql
-- Обновление одного поля
UPDATE users SET is_active = false WHERE id = 1;

-- Обновление нескольких полей
UPDATE users
SET
    name = 'Alice Smith',
    email = 'alice.smith@example.com',
    updated_at = NOW()
WHERE id = 1;

-- Обновление с возвратом
UPDATE users
SET balance = balance + 100
WHERE id = 1
RETURNING id, balance;

-- Обновление по подзапросу
UPDATE products
SET price = price * 1.1
WHERE category_id IN (SELECT id FROM categories WHERE name = 'Electronics');

-- Обновление из другой таблицы
UPDATE users u
SET total_orders = (
    SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id
);
```

#### DELETE — удаление

```sql
-- Удаление по условию
DELETE FROM users WHERE id = 1;

-- Удаление нескольких записей
DELETE FROM users WHERE is_active = false;

-- Удаление с возвратом
DELETE FROM users WHERE id = 1 RETURNING *;

-- Удаление всех записей (медленнее TRUNCATE)
DELETE FROM users;

-- TRUNCATE — быстрое удаление всех записей
TRUNCATE TABLE users;
TRUNCATE TABLE users RESTART IDENTITY;  -- Сбросить SERIAL
TRUNCATE TABLE users, orders CASCADE;   -- Каскадно
```

---

### Агрегатные функции

```sql
-- COUNT — количество
SELECT COUNT(*) FROM users;
SELECT COUNT(phone) FROM users;  -- Не считает NULL
SELECT COUNT(DISTINCT role) FROM users;

-- SUM — сумма
SELECT SUM(price) FROM products;
SELECT SUM(price * quantity) AS total FROM order_items;

-- AVG — среднее
SELECT AVG(age) FROM users;
SELECT ROUND(AVG(price), 2) AS avg_price FROM products;

-- MIN / MAX
SELECT MIN(price), MAX(price) FROM products;
SELECT MIN(created_at), MAX(created_at) FROM orders;

-- STRING_AGG — конкатенация строк
SELECT STRING_AGG(name, ', ') FROM users;
SELECT STRING_AGG(name, ', ' ORDER BY name) FROM users;

-- ARRAY_AGG — в массив
SELECT ARRAY_AGG(name) FROM users;
```

#### GROUP BY — группировка

```sql
-- Количество пользователей по ролям
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;

-- Сумма заказов по пользователям
SELECT
    user_id,
    COUNT(*) as order_count,
    SUM(total) as total_amount
FROM orders
GROUP BY user_id;

-- Группировка по нескольким полям
SELECT
    EXTRACT(YEAR FROM created_at) as year,
    EXTRACT(MONTH FROM created_at) as month,
    COUNT(*) as orders_count
FROM orders
GROUP BY year, month
ORDER BY year, month;

-- HAVING — фильтрация групп
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
HAVING COUNT(*) > 5;

-- Разница WHERE и HAVING
SELECT category_id, AVG(price) as avg_price
FROM products
WHERE is_active = true           -- Фильтрация ДО группировки
GROUP BY category_id
HAVING AVG(price) > 100;         -- Фильтрация ПОСЛЕ группировки
```

#### GROUPING SETS, ROLLUP, CUBE

```sql
-- GROUPING SETS — несколько группировок
SELECT category_id, brand, SUM(price)
FROM products
GROUP BY GROUPING SETS (
    (category_id, brand),
    (category_id),
    (brand),
    ()
);

-- ROLLUP — иерархическая группировка
SELECT
    EXTRACT(YEAR FROM created_at) as year,
    EXTRACT(MONTH FROM created_at) as month,
    SUM(total) as total
FROM orders
GROUP BY ROLLUP (year, month);

-- CUBE — все комбинации
SELECT category_id, brand, SUM(price)
FROM products
GROUP BY CUBE (category_id, brand);
```

---

### JOIN — соединение таблиц

```sql
-- Пример таблиц
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2),
    category_id INTEGER REFERENCES categories(id)
);
```

#### INNER JOIN

Возвращает только совпадающие записи из обеих таблиц.

```sql
SELECT
    p.id,
    p.name AS product_name,
    p.price,
    c.name AS category_name
FROM products p
INNER JOIN categories c ON p.category_id = c.id;

-- Сокращённая запись
SELECT p.*, c.name AS category
FROM products p
JOIN categories c ON p.category_id = c.id;
```

![[_canvas/inner-join.canvas]]

#### LEFT JOIN (LEFT OUTER JOIN)

Все записи из левой таблицы + совпадающие из правой.

```sql
SELECT
    p.name AS product,
    c.name AS category
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Продукты без категории
SELECT p.*
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.id IS NULL;
```

![[_canvas/left-join.canvas]]

#### RIGHT JOIN (RIGHT OUTER JOIN)

Все записи из правой таблицы + совпадающие из левой.

```sql
SELECT
    p.name AS product,
    c.name AS category
FROM products p
RIGHT JOIN categories c ON p.category_id = c.id;

-- Категории без продуктов
SELECT c.*
FROM products p
RIGHT JOIN categories c ON p.category_id = c.id
WHERE p.id IS NULL;
```

#### FULL OUTER JOIN

Все записи из обеих таблиц.

```sql
SELECT
    p.name AS product,
    c.name AS category
FROM products p
FULL OUTER JOIN categories c ON p.category_id = c.id;
```

#### CROSS JOIN

Декартово произведение (каждая запись с каждой).

```sql
SELECT
    p.name AS product,
    c.name AS color
FROM products p
CROSS JOIN colors c;

-- Эквивалентно
SELECT p.name, c.name
FROM products p, colors c;
```

#### Самосоединение (Self Join)

```sql
-- Сотрудники и их менеджеры
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    manager_id INTEGER REFERENCES employees(id)
);

SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

#### Множественные JOIN

```sql
SELECT
    o.id AS order_id,
    u.name AS customer,
    p.name AS product,
    oi.quantity,
    oi.price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.created_at > '2024-01-01';
```

---

### Подзапросы

#### В WHERE

```sql
-- Скалярный подзапрос
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- С IN
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- С NOT IN (осторожно с NULL!)
SELECT * FROM users
WHERE id NOT IN (
    SELECT user_id FROM orders WHERE user_id IS NOT NULL
);

-- С EXISTS (обычно быстрее IN)
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- С NOT EXISTS
SELECT * FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- Сравнение с ANY/ALL
SELECT * FROM products
WHERE price > ANY (SELECT price FROM products WHERE category_id = 1);

SELECT * FROM products
WHERE price > ALL (SELECT price FROM products WHERE category_id = 1);
```

#### В FROM (производные таблицы)

```sql
SELECT
    category_name,
    avg_price
FROM (
    SELECT
        c.name AS category_name,
        AVG(p.price) AS avg_price
    FROM products p
    JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
) AS category_stats
WHERE avg_price > 100;
```

#### В SELECT

```sql
SELECT
    p.name,
    p.price,
    (SELECT AVG(price) FROM products) AS avg_price,
    p.price - (SELECT AVG(price) FROM products) AS diff_from_avg
FROM products p;
```

#### Коррелированные подзапросы

Ссылаются на внешний запрос.

```sql
-- Последний заказ каждого пользователя
SELECT *
FROM orders o1
WHERE created_at = (
    SELECT MAX(created_at)
    FROM orders o2
    WHERE o2.user_id = o1.user_id
);

-- Продукты дороже среднего в своей категории
SELECT *
FROM products p1
WHERE price > (
    SELECT AVG(price)
    FROM products p2
    WHERE p2.category_id = p1.category_id
);
```

#### LATERAL

Позволяет ссылаться на предыдущие FROM.

```sql
-- Топ-3 заказа для каждого пользователя
SELECT u.name, top_orders.*
FROM users u
CROSS JOIN LATERAL (
    SELECT o.id, o.total
    FROM orders o
    WHERE o.user_id = u.id
    ORDER BY o.total DESC
    LIMIT 3
) AS top_orders;
```

---

### CTE (Common Table Expressions)

Именованные подзапросы для читаемости и переиспользования.

```sql
-- Простой CTE
WITH active_users AS (
    SELECT * FROM users WHERE is_active = true
)
SELECT * FROM active_users WHERE age > 25;

-- Несколько CTE
WITH
    active_users AS (
        SELECT * FROM users WHERE is_active = true
    ),
    user_orders AS (
        SELECT user_id, COUNT(*) as order_count
        FROM orders
        GROUP BY user_id
    )
SELECT
    u.name,
    COALESCE(uo.order_count, 0) as orders
FROM active_users u
LEFT JOIN user_orders uo ON u.id = uo.user_id;

-- Рекурсивный CTE
WITH RECURSIVE subordinates AS (
    -- Начальное условие
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Рекурсивная часть
    SELECT e.id, e.name, e.manager_id, s.level + 1
    FROM employees e
    JOIN subordinates s ON e.manager_id = s.id
)
SELECT * FROM subordinates ORDER BY level, name;
```

---

### Оконные функции

Вычисления по группам без агрегации строк.

```sql
-- ROW_NUMBER — порядковый номер
SELECT
    name,
    price,
    category_id,
    ROW_NUMBER() OVER (ORDER BY price DESC) as row_num,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) as row_in_category
FROM products;

-- RANK / DENSE_RANK
SELECT
    name,
    price,
    RANK() OVER (ORDER BY price DESC) as rank,        -- Пропускает при равенстве
    DENSE_RANK() OVER (ORDER BY price DESC) as dense  -- Не пропускает
FROM products;

-- LAG / LEAD — предыдущее/следующее значение
SELECT
    name,
    price,
    LAG(price) OVER (ORDER BY id) as prev_price,
    LEAD(price) OVER (ORDER BY id) as next_price,
    price - LAG(price) OVER (ORDER BY id) as price_diff
FROM products;

-- FIRST_VALUE / LAST_VALUE
SELECT
    name,
    price,
    FIRST_VALUE(price) OVER (
        PARTITION BY category_id ORDER BY price
    ) as min_in_category
FROM products;

-- SUM / AVG / COUNT с окном
SELECT
    name,
    price,
    SUM(price) OVER () as total,
    SUM(price) OVER (PARTITION BY category_id) as category_total,
    SUM(price) OVER (ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total
FROM products;

-- NTILE — разбиение на N групп
SELECT
    name,
    price,
    NTILE(4) OVER (ORDER BY price) as quartile
FROM products;
```

#### Рамки окна (Frame)

```sql
-- ROWS BETWEEN
SUM(price) OVER (
    ORDER BY id
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW  -- Текущая + 2 предыдущих
)

SUM(price) OVER (
    ORDER BY id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- Все до текущей (running total)
)

SUM(price) OVER (
    ORDER BY id
    ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING  -- Скользящее среднее по 3
)
```

---

### Индексы

Ускоряют поиск, замедляют запись.

#### Создание индексов

```sql
-- B-tree (по умолчанию) — для =, <, >, BETWEEN
CREATE INDEX idx_users_email ON users(email);

-- Уникальный индекс
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Составной индекс
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Частичный индекс (только часть данных)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- Индекс на выражение
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- GIN — для массивов и JSONB
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_metadata ON products USING GIN(metadata);

-- GiST — для геоданных, полнотекстового поиска
CREATE INDEX idx_locations_point ON locations USING GIST(coordinates);

-- BRIN — для больших таблиц с упорядоченными данными
CREATE INDEX idx_logs_created ON logs USING BRIN(created_at);

-- Конкурентное создание (без блокировки)
CREATE INDEX CONCURRENTLY idx_users_name ON users(name);
```

#### Управление индексами

```sql
-- Удаление индекса
DROP INDEX idx_users_email;
DROP INDEX CONCURRENTLY idx_users_email;

-- Перестроение
REINDEX INDEX idx_users_email;
REINDEX TABLE users;

-- Просмотр индексов таблицы
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- Размер индексов
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE tablename = 'users';
```

#### Когда использовать индексы

**Создавать:**
- Первичные ключи (создаются автоматически)
- Внешние ключи
- Поля в WHERE, ORDER BY, JOIN
- Уникальные поля

**Не создавать:**
- Маленькие таблицы (< 1000 строк)
- Часто обновляемые колонки
- Колонки с низкой кардинальностью (пол, статус)

---

### Анализ запросов (EXPLAIN)

```sql
-- План выполнения
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';

-- С реальным временем выполнения
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';

-- Подробный вывод
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM users WHERE email = 'alice@example.com';

-- JSON-формат
EXPLAIN (ANALYZE, FORMAT JSON)
SELECT * FROM users WHERE id = 1;
```

#### Чтение плана

```
Seq Scan on users  (cost=0.00..35.50 rows=1 width=100) (actual time=0.015..0.250 rows=1 loops=1)
  Filter: (email = 'alice@example.com'::text)
  Rows Removed by Filter: 999
```

| Операция | Описание |
|----------|----------|
| **Seq Scan** | Полный перебор таблицы (плохо для больших таблиц) |
| **Index Scan** | Поиск по индексу + чтение таблицы |
| **Index Only Scan** | Только индекс (лучший вариант) |
| **Bitmap Index Scan** | Для нескольких условий |
| **Nested Loop** | Вложенный цикл (для маленьких таблиц) |
| **Hash Join** | Хэш-соединение (для средних) |
| **Merge Join** | Слияние (для отсортированных) |

**cost** — относительная стоимость (startup..total)
**rows** — ожидаемое/реальное количество строк
**width** — размер строки в байтах

---

### Представления (Views)

Виртуальные таблицы на основе запроса.

```sql
-- Создание представления
CREATE VIEW active_users AS
SELECT id, email, name
FROM users
WHERE is_active = true;

-- Использование как таблицы
SELECT * FROM active_users WHERE name LIKE 'A%';

-- Создание или замена
CREATE OR REPLACE VIEW active_users AS
SELECT id, email, name, created_at
FROM users
WHERE is_active = true;

-- Удаление
DROP VIEW active_users;
DROP VIEW IF EXISTS active_users CASCADE;
```

#### Материализованные представления

Сохраняют результат запроса физически.

```sql
-- Создание
CREATE MATERIALIZED VIEW mv_sales_by_month AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    SUM(total) as total_sales,
    COUNT(*) as order_count
FROM orders
GROUP BY month;

-- Использование
SELECT * FROM mv_sales_by_month;

-- Обновление данных
REFRESH MATERIALIZED VIEW mv_sales_by_month;

-- Конкурентное обновление (без блокировки)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_month;
-- Требует уникальный индекс
CREATE UNIQUE INDEX ON mv_sales_by_month(month);
```

---

### Транзакции

ACID-гарантии: Atomicity, Consistency, Isolation, Durability.

```sql
-- Начало транзакции
BEGIN;
-- или
START TRANSACTION;

-- Операции
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Фиксация
COMMIT;

-- Откат
ROLLBACK;

-- Точки сохранения
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
SAVEPOINT transfer_started;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
-- Ошибка? Откат к точке
ROLLBACK TO SAVEPOINT transfer_started;
COMMIT;
```

#### Уровни изоляции

```sql
-- Установка уровня
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

BEGIN ISOLATION LEVEL SERIALIZABLE;
-- ...
COMMIT;
```

| Уровень | Dirty Read | Non-repeatable Read | Phantom Read |
|---------|------------|---------------------|--------------|
| **READ UNCOMMITTED** | Да | Да | Да |
| **READ COMMITTED** (default) | Нет | Да | Да |
| **REPEATABLE READ** | Нет | Нет | Да |
| **SERIALIZABLE** | Нет | Нет | Нет |

---

### Функции и процедуры

#### Функции (возвращают значение)

```sql
-- Простая функция
CREATE OR REPLACE FUNCTION add_numbers(a INTEGER, b INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN a + b;
END;
$$ LANGUAGE plpgsql;

SELECT add_numbers(2, 3);  -- 5

-- Функция с запросом
CREATE OR REPLACE FUNCTION get_user_orders(p_user_id INTEGER)
RETURNS TABLE(order_id INTEGER, total DECIMAL, created_at TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.total, o.created_at
    FROM orders o
    WHERE o.user_id = p_user_id
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_user_orders(1);

-- SQL-функция (проще и быстрее)
CREATE OR REPLACE FUNCTION get_active_users_count()
RETURNS BIGINT AS $$
    SELECT COUNT(*) FROM users WHERE is_active = true;
$$ LANGUAGE SQL;
```

#### Процедуры (без возврата, с транзакциями)

```sql
-- Процедура (PostgreSQL 11+)
CREATE OR REPLACE PROCEDURE transfer_money(
    from_account INTEGER,
    to_account INTEGER,
    amount DECIMAL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE accounts SET balance = balance - amount WHERE id = from_account;
    UPDATE accounts SET balance = balance + amount WHERE id = to_account;
    COMMIT;
END;
$$;

CALL transfer_money(1, 2, 100.00);
```

#### Переменные и управляющие конструкции

```sql
CREATE OR REPLACE FUNCTION process_order(p_order_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_total DECIMAL;
    v_status TEXT;
    v_user_name TEXT;
BEGIN
    -- Присваивание из запроса
    SELECT o.total, u.name INTO v_total, v_user_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = p_order_id;

    -- Условия
    IF v_total > 1000 THEN
        v_status := 'VIP';
    ELSIF v_total > 500 THEN
        v_status := 'Premium';
    ELSE
        v_status := 'Standard';
    END IF;

    -- Цикл
    FOR i IN 1..5 LOOP
        RAISE NOTICE 'Iteration: %', i;
    END LOOP;

    -- Цикл по запросу
    FOR record IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
        RAISE NOTICE 'Item: %, Qty: %', record.product_id, record.quantity;
    END LOOP;

    RETURN format('Order %s for %s: %s', p_order_id, v_user_name, v_status);

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'Order not found';
    WHEN OTHERS THEN
        RETURN format('Error: %', SQLERRM);
END;
$$ LANGUAGE plpgsql;
```

---

### Триггеры

Автоматический запуск функции при событиях.

```sql
-- Триггерная функция
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер
CREATE TRIGGER trigger_update_modified
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at();

-- Триггер с условием
CREATE TRIGGER trigger_log_price_change
    AFTER UPDATE OF price ON products
    FOR EACH ROW
    WHEN (OLD.price IS DISTINCT FROM NEW.price)
    EXECUTE FUNCTION log_price_change();
```

#### Типы триггеров

| Параметр | Варианты |
|----------|----------|
| **Время** | BEFORE, AFTER, INSTEAD OF |
| **Событие** | INSERT, UPDATE, DELETE, TRUNCATE |
| **Уровень** | FOR EACH ROW, FOR EACH STATEMENT |

```sql
-- OLD и NEW в триггерах
-- OLD — старое значение (UPDATE, DELETE)
-- NEW — новое значение (INSERT, UPDATE)

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (action, new_data)
        VALUES ('INSERT', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (action, old_data, new_data)
        VALUES ('UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (action, old_data)
        VALUES ('DELETE', row_to_json(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

### Нормализация и проектирование БД

#### Нормальные формы

##### 1NF (Первая нормальная форма)
- Атомарность: каждая ячейка содержит одно значение
- Нет повторяющихся групп

```sql
-- Плохо (нарушает 1NF)
CREATE TABLE orders_bad (
    id INTEGER,
    products TEXT  -- "Product1, Product2, Product3"
);

-- Хорошо
CREATE TABLE orders (
    id SERIAL PRIMARY KEY
);

CREATE TABLE order_items (
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER
);
```

##### 2NF (Вторая нормальная форма)
- Соответствует 1NF
- Все неключевые атрибуты зависят от всего ключа

```sql
-- Плохо (нарушает 2NF)
CREATE TABLE order_items_bad (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    product_name TEXT,  -- Зависит только от product_id
    PRIMARY KEY (order_id, product_id)
);

-- Хорошо
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)
);
```

##### 3NF (Третья нормальная форма)
- Соответствует 2NF
- Нет транзитивных зависимостей

```sql
-- Плохо (нарушает 3NF)
CREATE TABLE employees_bad (
    id SERIAL PRIMARY KEY,
    name TEXT,
    department_id INTEGER,
    department_name TEXT  -- Зависит от department_id, не от id
);

-- Хорошо
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name TEXT,
    department_id INTEGER REFERENCES departments(id)
);
```

#### Типичная структура интернет-магазина

```sql
-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Адреса (один пользователь — много адресов)
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    street VARCHAR(200) NOT NULL,
    building VARCHAR(20),
    apartment VARCHAR(20),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT false
);

-- Категории (иерархия)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- Бренды
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT
);

-- Продукты
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    brand_id INTEGER REFERENCES brands(id),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Изображения продуктов
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

-- Заказы
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    address_id INTEGER REFERENCES addresses(id),
    status VARCHAR(20) DEFAULT 'pending',
    total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')
    )
);

-- Позиции заказа
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,  -- Цена на момент заказа

    UNIQUE (order_id, product_id)
);

-- Индексы
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

#### ER-диаграмма (связи)

![[_canvas/ecommerce-schema.canvas]]

---

### Работа с JSON

```sql
-- JSON vs JSONB
-- JSON: хранит как текст, сохраняет форматирование
-- JSONB: бинарный, быстрее запросы, поддерживает индексы

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL
);

-- Вставка
INSERT INTO events (data) VALUES
('{"type": "click", "page": "/home", "user_id": 1}'),
('{"type": "purchase", "amount": 99.99, "items": [1, 2, 3]}');

-- Доступ к полям
SELECT
    data->>'type' AS event_type,          -- Как текст
    data->'user_id' AS user_id,           -- Как JSON
    (data->>'amount')::DECIMAL AS amount  -- С преобразованием
FROM events;

-- Путь к вложенным элементам
SELECT data #>> '{items, 0}' AS first_item FROM events;

-- Фильтрация
SELECT * FROM events WHERE data->>'type' = 'click';
SELECT * FROM events WHERE data @> '{"type": "click"}';  -- Содержит

-- Проверка ключа
SELECT * FROM events WHERE data ? 'user_id';        -- Есть ключ
SELECT * FROM events WHERE data ?| ARRAY['a', 'b']; -- Любой из ключей
SELECT * FROM events WHERE data ?& ARRAY['a', 'b']; -- Все ключи

-- Индексы для JSONB
CREATE INDEX idx_events_data ON events USING GIN(data);
CREATE INDEX idx_events_type ON events ((data->>'type'));

-- Функции работы с JSON
SELECT jsonb_pretty(data) FROM events;
SELECT jsonb_array_elements(data->'items') FROM events WHERE data ? 'items';
SELECT jsonb_object_keys(data) FROM events;
```

---

### Полнотекстовый поиск

```sql
-- Создание колонки для поиска
ALTER TABLE products ADD COLUMN search_vector TSVECTOR;

-- Обновление вектора
UPDATE products SET search_vector =
    setweight(to_tsvector('russian', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(description, '')), 'B');

-- Индекс
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Поиск
SELECT name, description
FROM products
WHERE search_vector @@ to_tsquery('russian', 'телефон & samsung');

-- С ранжированием
SELECT
    name,
    ts_rank(search_vector, query) AS rank
FROM products, to_tsquery('russian', 'телефон') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Автоматическое обновление через триггер
CREATE FUNCTION products_search_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('russian', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_search
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION products_search_update();
```

---

### Бэкап и восстановление

```bash
# pg_dump — создание бэкапа
pg_dump -U postgres dbname > backup.sql
pg_dump -U postgres -Fc dbname > backup.dump  # Сжатый формат
pg_dump -U postgres -t users dbname > users.sql  # Одна таблица

# pg_restore — восстановление
pg_restore -U postgres -d dbname backup.dump
psql -U postgres -d dbname < backup.sql

# Только схема
pg_dump -U postgres --schema-only dbname > schema.sql

# Только данные
pg_dump -U postgres --data-only dbname > data.sql

# pg_dumpall — все базы данных
pg_dumpall -U postgres > all_databases.sql
```

---

### Права доступа

```sql
-- Создание пользователя
CREATE USER app_user WITH PASSWORD 'secret';
CREATE ROLE readonly;

-- Права на БД
GRANT CONNECT ON DATABASE shop TO app_user;

-- Права на схему
GRANT USAGE ON SCHEMA public TO app_user;

-- Права на таблицы
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT ALL PRIVILEGES ON products TO app_user;

-- Права на последовательности (для SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Права по умолчанию
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly;

-- Отзыв прав
REVOKE INSERT ON users FROM app_user;

-- Просмотр прав
\dp users
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'users';
```

---

### Практические задания

#### Уровень 1: Основы

1. Создайте базу данных `library` с таблицами `authors`, `books`, `genres`. Установите связи между ними.

2. Заполните таблицы тестовыми данными (минимум 10 авторов, 30 книг, 5 жанров).

3. Напишите запросы:
   - Все книги определённого автора
   - Количество книг по жанрам
   - Авторы, у которых больше 3 книг

4. Добавьте таблицу `readers` и `borrowed_books` для учёта выдачи книг.

#### Уровень 2: JOIN и подзапросы

5. Выведите книги, которые никогда не брали читатели.

6. Найдите самого активного читателя (по количеству взятых книг).

7. Выведите авторов, все книги которых относятся к одному жанру.

8. Напишите запрос с рангом книг по популярности (сколько раз брали).

#### Уровень 3: Продвинутое

9. Создайте представление `popular_books` с книгами, взятыми более 5 раз.

10. Напишите функцию `get_recommendations(reader_id)`, которая возвращает книги на основе предпочтений читателя.

11. Создайте триггер, который не позволяет выдать книгу, если все экземпляры на руках.

12. Реализуйте полнотекстовый поиск по названиям и описаниям книг.

---

## Ссылки

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [[Python#SQLAlchemy|Python SQLAlchemy]]
- [[backend/Database|Databases Overview]]
