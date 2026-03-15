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

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16

# Добавить в PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запуск сервиса
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Скачать установщик с [postgresql.org](https://www.postgresql.org/download/windows/)

**Docker:**
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

```
┌─────────────────┐     ┌─────────────────┐
│    products     │     │   categories    │
├─────────────────┤     ├─────────────────┤
│ id=1, cat_id=1  │◄───►│ id=1, name=...  │  ✓ Совпадение
│ id=2, cat_id=2  │◄───►│ id=2, name=...  │  ✓ Совпадение
│ id=3, cat_id=99 │     │                 │  ✗ Нет совпадения
└─────────────────┘     └─────────────────┘
```

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

```
┌─────────────────┐     ┌─────────────────┐
│    products     │     │   categories    │
├─────────────────┤     ├─────────────────┤
│ id=1, cat_id=1  │◄───►│ id=1            │  ✓
│ id=2, cat_id=2  │◄───►│ id=2            │  ✓
│ id=3, cat_id=99 │────►│ NULL            │  ✓ (LEFT сохраняет)
└─────────────────┘     └─────────────────┘
```

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

```
┌─────────────┐       ┌─────────────┐
│    users    │       │  addresses  │
├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │
│ email       │   │   │ user_id(FK) │───┘
│ name        │   │   │ city        │
└─────────────┘   │   │ street      │
                  │   └─────────────┘
                  │
                  │   ┌─────────────┐
                  └──►│   orders    │
                      ├─────────────┤      ┌─────────────┐
                      │ id (PK)     │◄────►│ order_items │
                      │ user_id(FK) │      ├─────────────┤
                      │ status      │      │ order_id(FK)│
                      └─────────────┘      │product_id   │
                                           └──────┬──────┘
                                                  │
┌─────────────┐       ┌─────────────┐             │
│ categories  │       │  products   │◄────────────┘
├─────────────┤       ├─────────────┤
│ id (PK)     │◄─────►│ id (PK)     │
│ name        │       │ name        │
│ parent_id   │───┘   │category_id  │
└─────────────┘       │ price       │
                      └─────────────┘
```

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

### ENUM типы

ENUM — перечисляемый тип с фиксированным набором значений.

```sql
-- Создание ENUM типа
CREATE TYPE order_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user', 'guest');

-- Использование в таблице
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Вставка
INSERT INTO orders (status) VALUES ('pending');
INSERT INTO orders (status) VALUES ('shipped');

-- Ошибка: значение не из списка
INSERT INTO orders (status) VALUES ('unknown');  -- ERROR!

-- Фильтрация
SELECT * FROM orders WHERE status = 'pending';
SELECT * FROM orders WHERE status IN ('pending', 'processing');

-- Сравнение (по порядку определения)
SELECT * FROM orders WHERE status > 'processing';  -- shipped, delivered, cancelled

-- Добавление нового значения
ALTER TYPE order_status ADD VALUE 'refunded';
ALTER TYPE order_status ADD VALUE 'on_hold' BEFORE 'processing';
ALTER TYPE order_status ADD VALUE 'returned' AFTER 'delivered';

-- Переименование значения (PostgreSQL 10+)
ALTER TYPE order_status RENAME VALUE 'cancelled' TO 'canceled';

-- Просмотр всех значений ENUM
SELECT unnest(enum_range(NULL::order_status));

SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;

-- Удаление ENUM типа
DROP TYPE order_status;  -- Ошибка, если используется
DROP TYPE order_status CASCADE;  -- Удалит зависимые колонки
```

#### ENUM vs Lookup Table

```sql
-- Подход 1: ENUM
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Подход 2: Lookup Table (справочник)
CREATE TABLE priorities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    sort_order INTEGER,
    color VARCHAR(7),
    description TEXT
);

INSERT INTO priorities (name, sort_order, color) VALUES
    ('low', 1, '#00ff00'),
    ('medium', 2, '#ffff00'),
    ('high', 3, '#ff8800'),
    ('critical', 4, '#ff0000');

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    priority_id INTEGER REFERENCES priorities(id)
);
```

| Критерий | ENUM | Lookup Table |
|----------|------|--------------|
| **Производительность** | Быстрее (хранится как integer) | JOIN для получения имени |
| **Гибкость** | Сложно изменить/удалить | Легко добавить/изменить |
| **Дополнительные данные** | Нет (только имя) | Любые поля |
| **Миграции** | Сложнее | Просто INSERT/UPDATE |
| **Когда использовать** | Статичные, редко меняющиеся | Часто меняющиеся данные |

---

### Составные типы (Composite Types)

```sql
-- Создание составного типа
CREATE TYPE address AS (
    street VARCHAR(200),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100)
);

CREATE TYPE money_amount AS (
    amount DECIMAL(15, 2),
    currency CHAR(3)
);

-- Использование в таблице
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    headquarters address,
    annual_revenue money_amount
);

-- Вставка
INSERT INTO companies (name, headquarters, annual_revenue) VALUES (
    'Acme Corp',
    ROW('123 Main St', 'New York', '10001', 'USA'),
    ROW(1000000.00, 'USD')
);

-- Альтернативный синтаксис
INSERT INTO companies (name, headquarters, annual_revenue) VALUES (
    'Tech Inc',
    ('456 Oak Ave', 'San Francisco', '94102', 'USA')::address,
    (5000000.00, 'EUR')::money_amount
);

-- Доступ к полям
SELECT
    name,
    (headquarters).city,
    (headquarters).country,
    (annual_revenue).amount,
    (annual_revenue).currency
FROM companies;

-- Обновление одного поля
UPDATE companies
SET headquarters.city = 'Los Angeles'
WHERE id = 1;

-- Обновление всего типа
UPDATE companies
SET headquarters = ROW('789 Pine St', 'Boston', '02101', 'USA')
WHERE id = 1;

-- Функция, возвращающая составной тип
CREATE FUNCTION get_default_address() RETURNS address AS $$
    SELECT ROW('Unknown', 'Unknown', '00000', 'Unknown')::address;
$$ LANGUAGE SQL;
```

---

### Domain типы

Domain — пользовательский тип на основе существующего с добавлением ограничений.

```sql
-- Email с валидацией
CREATE DOMAIN email AS VARCHAR(255)
    CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Положительное число
CREATE DOMAIN positive_int AS INTEGER
    CHECK (VALUE > 0);

-- Процент (0-100)
CREATE DOMAIN percentage AS DECIMAL(5, 2)
    CHECK (VALUE >= 0 AND VALUE <= 100);

-- Телефон
CREATE DOMAIN phone_number AS VARCHAR(20)
    CHECK (VALUE ~ '^\+?[0-9\s\-\(\)]+$');

-- URL
CREATE DOMAIN url AS TEXT
    CHECK (VALUE ~* '^https?://[^\s]+$');

-- Непустая строка
CREATE DOMAIN non_empty_string AS VARCHAR(1000)
    CHECK (LENGTH(TRIM(VALUE)) > 0);

-- Использование
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email email NOT NULL UNIQUE,
    phone phone_number,
    age positive_int,
    website url
);

-- Вставка
INSERT INTO users (email, phone, age) VALUES
    ('alice@example.com', '+1-555-123-4567', 25);

-- Ошибка валидации
INSERT INTO users (email, age) VALUES ('invalid-email', -5);  -- ERROR!

-- Изменение domain
ALTER DOMAIN positive_int ADD CONSTRAINT min_age CHECK (VALUE >= 18);
ALTER DOMAIN positive_int DROP CONSTRAINT min_age;

-- Удаление
DROP DOMAIN email;
DROP DOMAIN email CASCADE;  -- Удалит зависимые колонки
```

---

### Sequences (Последовательности)

```sql
-- Создание последовательности
CREATE SEQUENCE order_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 10;  -- Кеширование для производительности

-- Циклическая последовательность
CREATE SEQUENCE rotation_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 100
    CYCLE;  -- Начнёт сначала после 100

-- Использование
SELECT nextval('order_number_seq');  -- 1000
SELECT nextval('order_number_seq');  -- 1001
SELECT currval('order_number_seq');  -- 1001 (текущее значение в сессии)

-- В INSERT
INSERT INTO orders (order_number) VALUES (nextval('order_number_seq'));

-- Связывание с колонкой (как SERIAL)
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY DEFAULT nextval('order_number_seq'),
    amount DECIMAL(10, 2)
);

-- Установка значения
SELECT setval('order_number_seq', 5000);  -- Следующий будет 5001
SELECT setval('order_number_seq', 5000, false);  -- Следующий будет 5000

-- Информация о последовательности
SELECT * FROM order_number_seq;
\d order_number_seq

-- Изменение
ALTER SEQUENCE order_number_seq RESTART WITH 10000;
ALTER SEQUENCE order_number_seq INCREMENT BY 10;
ALTER SEQUENCE order_number_seq OWNED BY invoices.id;

-- Удаление
DROP SEQUENCE order_number_seq;

-- IDENTITY (PostgreSQL 10+, стандарт SQL)
CREATE TABLE products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200)
);

CREATE TABLE products_v2 (
    id INTEGER GENERATED BY DEFAULT AS IDENTITY (START WITH 100 INCREMENT BY 10),
    name VARCHAR(200)
);
```

---

### Блокировки (Locks)

PostgreSQL использует MVCC и различные уровни блокировок.

#### Типы блокировок таблиц

```sql
-- Явная блокировка таблицы
LOCK TABLE users IN ACCESS SHARE MODE;        -- Разрешает SELECT
LOCK TABLE users IN ROW SHARE MODE;           -- SELECT FOR UPDATE
LOCK TABLE users IN ROW EXCLUSIVE MODE;       -- UPDATE, DELETE, INSERT
LOCK TABLE users IN SHARE UPDATE EXCLUSIVE MODE;  -- VACUUM, CREATE INDEX CONCURRENTLY
LOCK TABLE users IN SHARE MODE;               -- Блокирует изменения
LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE; -- Как SHARE, но только один
LOCK TABLE users IN EXCLUSIVE MODE;           -- Блокирует всё кроме ACCESS SHARE
LOCK TABLE users IN ACCESS EXCLUSIVE MODE;    -- Полная блокировка (ALTER TABLE, DROP)

-- Блокировка с таймаутом
SET lock_timeout = '5s';
LOCK TABLE users IN EXCLUSIVE MODE;
```

#### Блокировки строк

```sql
-- SELECT FOR UPDATE — блокирует строки до конца транзакции
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
-- Другие транзакции ждут
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- FOR UPDATE NOWAIT — ошибка если заблокировано
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;

-- FOR UPDATE SKIP LOCKED — пропустить заблокированные строки
-- Отлично для очередей!
SELECT * FROM tasks
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- FOR SHARE — разделяемая блокировка (другие могут читать)
SELECT * FROM products WHERE id = 1 FOR SHARE;

-- FOR KEY SHARE — только блокировка ключа (для FK)
SELECT * FROM products WHERE id = 1 FOR KEY SHARE;
```

#### Advisory Locks (Рекомендательные блокировки / Мьютексы)

Для координации на уровне приложения.

```sql
-- Сессионные блокировки (до конца сессии или явного освобождения)
SELECT pg_advisory_lock(12345);      -- Блокировка по числу
SELECT pg_advisory_lock(1, 2);       -- Блокировка по паре чисел
SELECT pg_advisory_unlock(12345);    -- Освобождение
SELECT pg_advisory_unlock_all();     -- Освободить все

-- Транзакционные блокировки (автоматически освобождаются при COMMIT/ROLLBACK)
SELECT pg_advisory_xact_lock(12345);

-- Попытка без ожидания
SELECT pg_try_advisory_lock(12345);  -- Возвращает true/false
SELECT pg_try_advisory_xact_lock(12345);

-- Разделяемые (shared) блокировки
SELECT pg_advisory_lock_shared(12345);
SELECT pg_advisory_xact_lock_shared(12345);

-- Пример: синглтон-джоб (только один процесс)
DO $$
BEGIN
    IF pg_try_advisory_lock(hashtext('daily_report_job')) THEN
        -- Выполняем работу
        RAISE NOTICE 'Running daily report...';
        PERFORM pg_sleep(10);  -- Имитация работы
        PERFORM pg_advisory_unlock(hashtext('daily_report_job'));
    ELSE
        RAISE NOTICE 'Job already running, skipping';
    END IF;
END $$;

-- Пример: блокировка по сущности
-- Блокируем пользователя 42 для обновления
SELECT pg_advisory_xact_lock(hashtext('user'), 42);
UPDATE users SET balance = balance - 100 WHERE id = 42;
COMMIT;  -- Автоматическое освобождение

-- Просмотр текущих advisory locks
SELECT * FROM pg_locks WHERE locktype = 'advisory';

-- Мониторинг ожиданий
SELECT
    blocked.pid AS blocked_pid,
    blocked.usename AS blocked_user,
    blocking.pid AS blocking_pid,
    blocking.usename AS blocking_user,
    blocked.query AS blocked_query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON blocked.pid = bl.pid
JOIN pg_locks lock ON bl.locktype = lock.locktype
    AND bl.relation = lock.relation
    AND bl.pid != lock.pid
JOIN pg_stat_activity blocking ON lock.pid = blocking.pid
WHERE NOT bl.granted;
```

#### Deadlock Detection

```sql
-- PostgreSQL автоматически обнаруживает deadlock и прерывает одну транзакцию

-- Настройка времени обнаружения
SET deadlock_timeout = '1s';  -- По умолчанию

-- Логирование deadlock
-- В postgresql.conf:
-- log_lock_waits = on
-- deadlock_timeout = 1s

-- Пример deadlock:
-- Сессия 1:
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- ждёт...
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- DEADLOCK!

-- Сессия 2:
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 2;
-- ждёт...
UPDATE accounts SET balance = balance + 50 WHERE id = 1;  -- DEADLOCK!

-- Предотвращение: всегда обновляйте в одинаковом порядке
-- Например, ORDER BY id
```

---

### MVCC (Multi-Version Concurrency Control)

PostgreSQL не блокирует данные при чтении благодаря MVCC.

```sql
-- Каждая строка имеет системные колонки
SELECT
    xmin,        -- ID транзакции, создавшей строку
    xmax,        -- ID транзакции, удалившей/обновившей (0 если активна)
    ctid,        -- Физическое расположение (страница, позиция)
    *
FROM users
LIMIT 5;

-- Как работает UPDATE под капотом:
-- 1. Создаётся новая версия строки (INSERT)
-- 2. Старая версия помечается как удалённая (xmax)
-- 3. Обе версии существуют до VACUUM

-- Снимок (snapshot) — какие данные видит транзакция
-- Транзакция видит:
-- - Свои изменения
-- - Зафиксированные изменения других транзакций (на момент снимка)
-- Не видит:
-- - Незафиксированные изменения других транзакций
-- - Изменения, зафиксированные после начала (для REPEATABLE READ)
```

---

### VACUUM и ANALYZE

VACUUM очищает "мёртвые" версии строк.

```sql
-- Обычный VACUUM — освобождает место для переиспользования
VACUUM users;
VACUUM VERBOSE users;  -- С подробностями

-- VACUUM FULL — полная перезапись таблицы (блокирует!)
VACUUM FULL users;  -- Освобождает место на диске

-- VACUUM ANALYZE — VACUUM + обновление статистики
VACUUM ANALYZE users;

-- Только ANALYZE — обновление статистики для планировщика
ANALYZE users;
ANALYZE users(email, created_at);  -- Конкретные колонки

-- Автоматический VACUUM (autovacuum)
-- Настройки в postgresql.conf:
-- autovacuum = on
-- autovacuum_vacuum_threshold = 50
-- autovacuum_vacuum_scale_factor = 0.2
-- autovacuum_analyze_threshold = 50
-- autovacuum_analyze_scale_factor = 0.1

-- Настройки для конкретной таблицы
ALTER TABLE logs SET (
    autovacuum_vacuum_threshold = 1000,
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_enabled = true
);

-- Мониторинг "раздутия" (bloat)
SELECT
    relname AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC;

-- Активность autovacuum
SELECT
    schemaname,
    relname,
    last_autovacuum,
    autovacuum_count,
    last_autoanalyze,
    autoanalyze_count
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;
```

---

### Партиционирование (Partitioning)

Разделение больших таблиц на части для производительности.

#### Range Partitioning

```sql
-- Главная (partitioned) таблица
CREATE TABLE logs (
    id BIGSERIAL,
    created_at TIMESTAMP NOT NULL,
    level VARCHAR(10),
    message TEXT
) PARTITION BY RANGE (created_at);

-- Партиции по месяцам
CREATE TABLE logs_2024_01 PARTITION OF logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE logs_2024_02 PARTITION OF logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE logs_2024_03 PARTITION OF logs
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Default партиция (для значений вне диапазонов)
CREATE TABLE logs_default PARTITION OF logs DEFAULT;

-- INSERT автоматически направляется в нужную партицию
INSERT INTO logs (created_at, level, message)
VALUES ('2024-02-15', 'ERROR', 'Something went wrong');
-- Попадёт в logs_2024_02

-- Индексы создаются на каждой партиции
CREATE INDEX ON logs (created_at);

-- Отключение партиции (для архивации)
ALTER TABLE logs DETACH PARTITION logs_2024_01;

-- Подключение партиции
ALTER TABLE logs ATTACH PARTITION logs_old
    FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');
```

#### List Partitioning

```sql
CREATE TABLE orders (
    id BIGSERIAL,
    region VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2),
    created_at TIMESTAMP
) PARTITION BY LIST (region);

CREATE TABLE orders_europe PARTITION OF orders
    FOR VALUES IN ('UK', 'DE', 'FR', 'IT', 'ES');

CREATE TABLE orders_asia PARTITION OF orders
    FOR VALUES IN ('JP', 'CN', 'KR', 'IN');

CREATE TABLE orders_americas PARTITION OF orders
    FOR VALUES IN ('US', 'CA', 'BR', 'MX');

CREATE TABLE orders_other PARTITION OF orders DEFAULT;
```

#### Hash Partitioning

```sql
-- Равномерное распределение по хешу
CREATE TABLE events (
    id BIGSERIAL,
    user_id INTEGER NOT NULL,
    event_type VARCHAR(50),
    data JSONB
) PARTITION BY HASH (user_id);

-- 4 партиции
CREATE TABLE events_0 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE events_1 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE events_2 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE events_3 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

#### Автоматизация партиционирования

```sql
-- Функция для создания месячных партиций
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name TEXT,
    year INTEGER,
    month INTEGER
) RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_name := format('%s_%s_%s', table_name, year, LPAD(month::TEXT, 2, '0'));
    start_date := make_date(year, month, 1);
    end_date := start_date + INTERVAL '1 month';

    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        table_name,
        start_date,
        end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Использование
SELECT create_monthly_partition('logs', 2024, 4);
SELECT create_monthly_partition('logs', 2024, 5);
```

---

### Репликация

#### Streaming Replication (физическая)

```bash
# На мастере (postgresql.conf)
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB

# На мастере (pg_hba.conf)
host replication replicator replica_ip/32 scram-sha-256

# На мастере — создание пользователя
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secret';

# На реплике — базовый бэкап
pg_basebackup -h master_ip -U replicator -D /var/lib/postgresql/data -P -R

# -R создаёт standby.signal и настраивает primary_conninfo
```

#### Logical Replication (логическая)

```sql
-- На публикующем сервере
CREATE PUBLICATION my_pub FOR TABLE users, orders;
-- Или все таблицы
CREATE PUBLICATION all_tables FOR ALL TABLES;

-- На подписывающем сервере
CREATE SUBSCRIPTION my_sub
    CONNECTION 'host=master_ip dbname=mydb user=replicator password=secret'
    PUBLICATION my_pub;

-- Управление
ALTER PUBLICATION my_pub ADD TABLE products;
ALTER SUBSCRIPTION my_sub REFRESH PUBLICATION;

-- Мониторинг
SELECT * FROM pg_stat_replication;      -- На мастере
SELECT * FROM pg_stat_subscription;      -- На реплике
```

---

### Connection Pooling

#### PgBouncer

```ini
# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction  # session, transaction, statement
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
```

```sql
-- Подключение через PgBouncer
psql -h localhost -p 6432 -U myuser -d mydb

-- Административная консоль PgBouncer
psql -h localhost -p 6432 -U pgbouncer pgbouncer

SHOW POOLS;
SHOW CLIENTS;
SHOW SERVERS;
SHOW STATS;
RELOAD;
```

---

### Extensions (Расширения)

```sql
-- Список доступных расширений
SELECT * FROM pg_available_extensions;

-- Установленные расширения
SELECT * FROM pg_extension;

-- Установка расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Удаление
DROP EXTENSION pg_trgm;

-- Популярные расширения:

-- uuid-ossp: генерация UUID
CREATE EXTENSION "uuid-ossp";
SELECT uuid_generate_v4();  -- Случайный UUID

-- pgcrypto: криптография
CREATE EXTENSION pgcrypto;
SELECT crypt('password', gen_salt('bf'));  -- bcrypt
SELECT encode(digest('data', 'sha256'), 'hex');  -- SHA-256

-- pg_trgm: нечёткий поиск (триграммы)
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_users_name_trgm ON users USING GIN (name gin_trgm_ops);
SELECT * FROM users WHERE name % 'Jonh';  -- Найдёт John
SELECT similarity('hello', 'helo');  -- 0.5

-- hstore: key-value хранилище
CREATE EXTENSION hstore;
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    attributes hstore
);
INSERT INTO products (attributes) VALUES ('color => red, size => large');
SELECT attributes->'color' FROM products;

-- pg_stat_statements: статистика запросов
CREATE EXTENSION pg_stat_statements;
SELECT
    query,
    calls,
    total_exec_time / 1000 as total_seconds,
    mean_exec_time as avg_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- tablefunc: crosstab (pivot tables)
CREATE EXTENSION tablefunc;

-- citext: регистронезависимый текст
CREATE EXTENSION citext;
CREATE TABLE users (email CITEXT UNIQUE);
-- 'Alice@Example.com' = 'alice@example.com'
```

---

### Row-Level Security (RLS)

Ограничение доступа к строкам на уровне БД.

```sql
-- Включение RLS для таблицы
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Создание политики
CREATE POLICY user_documents ON documents
    FOR ALL  -- SELECT, INSERT, UPDATE, DELETE
    TO app_user  -- Роль
    USING (owner_id = current_setting('app.current_user_id')::INTEGER);

-- Раздельные политики для разных операций
CREATE POLICY select_own ON documents
    FOR SELECT
    USING (owner_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY insert_own ON documents
    FOR INSERT
    WITH CHECK (owner_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY update_own ON documents
    FOR UPDATE
    USING (owner_id = current_setting('app.current_user_id')::INTEGER)
    WITH CHECK (owner_id = current_setting('app.current_user_id')::INTEGER);

-- Политика для админов (видят всё)
CREATE POLICY admin_all ON documents
    FOR ALL
    TO admin_role
    USING (true);

-- Установка контекста в приложении
SET app.current_user_id = '42';
SELECT * FROM documents;  -- Видит только свои

-- Принудительное применение даже для owner таблицы
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

-- Отключение RLS
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Удаление политики
DROP POLICY user_documents ON documents;

-- Просмотр политик
\d documents
SELECT * FROM pg_policies WHERE tablename = 'documents';
```

---

### LISTEN / NOTIFY (Pub/Sub)

Асинхронные уведомления между сессиями.

```sql
-- Сессия 1: подписка на канал
LISTEN order_events;
LISTEN user_events;

-- Сессия 2: отправка уведомления
NOTIFY order_events, 'New order #123';
NOTIFY user_events;  -- Без payload

-- Использование в триггере
CREATE OR REPLACE FUNCTION notify_order_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'order_events',
        json_build_object(
            'action', TG_OP,
            'order_id', COALESCE(NEW.id, OLD.id),
            'timestamp', NOW()
        )::TEXT
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_notify_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_change();

-- Отмена подписки
UNLISTEN order_events;
UNLISTEN *;  -- Все каналы
```

Использование в Python:
```python
import psycopg2
import select

conn = psycopg2.connect(dsn)
conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)

cur = conn.cursor()
cur.execute("LISTEN order_events;")

while True:
    if select.select([conn], [], [], 5) == ([], [], []):
        print("Timeout")
    else:
        conn.poll()
        while conn.notifies:
            notify = conn.notifies.pop(0)
            print(f"Got: {notify.channel} - {notify.payload}")
```

---

### Foreign Data Wrappers (FDW)

Доступ к внешним источникам данных как к таблицам.

```sql
-- postgres_fdw — другой PostgreSQL сервер
CREATE EXTENSION postgres_fdw;

CREATE SERVER remote_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'remote.host', port '5432', dbname 'remotedb');

CREATE USER MAPPING FOR local_user
    SERVER remote_server
    OPTIONS (user 'remote_user', password 'secret');

-- Импорт таблиц
IMPORT FOREIGN SCHEMA public
    LIMIT TO (users, orders)
    FROM SERVER remote_server
    INTO local_schema;

-- Или создание вручную
CREATE FOREIGN TABLE remote_users (
    id INTEGER,
    name VARCHAR(100),
    email VARCHAR(255)
) SERVER remote_server
OPTIONS (schema_name 'public', table_name 'users');

-- Запросы как к обычной таблице
SELECT * FROM remote_users WHERE id = 1;

-- file_fdw — чтение CSV/текстовых файлов
CREATE EXTENSION file_fdw;
CREATE SERVER file_server FOREIGN DATA WRAPPER file_fdw;

CREATE FOREIGN TABLE csv_data (
    id INTEGER,
    name TEXT,
    value NUMERIC
) SERVER file_server
OPTIONS (filename '/path/to/data.csv', format 'csv', header 'true');
```

---

### Мониторинг и диагностика

#### Системные представления

```sql
-- Активные сессии
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start AS duration,
    LEFT(query, 100) AS query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Долгие запросы (> 5 минут)
SELECT
    pid,
    NOW() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
  AND NOW() - query_start > INTERVAL '5 minutes';

-- Завершение запроса
SELECT pg_cancel_backend(pid);      -- Мягкое (отмена запроса)
SELECT pg_terminate_backend(pid);   -- Жёсткое (убить сессию)

-- Блокировки
SELECT
    l.pid,
    l.locktype,
    l.mode,
    l.granted,
    a.usename,
    a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;

-- Размеры таблиц
SELECT
    relname AS table_name,
    pg_size_pretty(pg_table_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Размер базы данных
SELECT pg_size_pretty(pg_database_size('mydb'));

-- Использование индексов
SELECT
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Неиспользуемые индексы
SELECT
    relname AS table_name,
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid NOT IN (SELECT conindid FROM pg_constraint);

-- Статистика по таблицам
SELECT
    relname,
    seq_scan,           -- Последовательные сканирования
    seq_tup_read,       -- Строки прочитаны seq scan
    idx_scan,           -- Индексные сканирования
    idx_tup_fetch,      -- Строки прочитаны через индекс
    n_tup_ins,          -- Вставки
    n_tup_upd,          -- Обновления
    n_tup_del,          -- Удаления
    n_live_tup,         -- Живые строки
    n_dead_tup          -- Мёртвые строки
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Cache hit ratio (должен быть > 99%)
SELECT
    SUM(blks_hit) * 100.0 / SUM(blks_hit + blks_read) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = current_database();

-- Временные файлы (признак нехватки work_mem)
SELECT
    datname,
    temp_files,
    pg_size_pretty(temp_bytes) AS temp_size
FROM pg_stat_database
WHERE temp_files > 0;

-- Статистика WAL
SELECT * FROM pg_stat_wal;

-- Статистика репликации
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag
FROM pg_stat_replication;
```

---

### Generated Columns

Автоматически вычисляемые колонки (PostgreSQL 12+).

```sql
-- STORED — физически хранится
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    price DECIMAL(10, 2),
    quantity INTEGER,
    total DECIMAL(10, 2) GENERATED ALWAYS AS (price * quantity) STORED
);

INSERT INTO products (price, quantity) VALUES (10.00, 5);
SELECT * FROM products;  -- total = 50.00

-- Полнотекстовый поиск
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title TEXT,
    body TEXT,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(body, '')), 'B')
    ) STORED
);

CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Хеш для дедупликации
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    content BYTEA,
    content_hash TEXT GENERATED ALWAYS AS (encode(sha256(content), 'hex')) STORED
);

-- Нормализованные данные
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    email_normalized VARCHAR(255) GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED
);
```

---

### Exclusion Constraints

Запрет пересекающихся данных (бронирования, расписания).

```sql
-- Требует расширения btree_gist
CREATE EXTENSION btree_gist;

-- Бронирование комнат: нельзя забронировать одну комнату в пересекающееся время
CREATE TABLE room_bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    during TSTZRANGE NOT NULL,  -- Временной диапазон

    EXCLUDE USING GIST (
        room_id WITH =,         -- room_id должен быть равен
        during WITH &&          -- И диапазоны пересекаются
    )
);

-- Работает!
INSERT INTO room_bookings (room_id, during) VALUES
    (1, '[2024-03-15 10:00, 2024-03-15 12:00)');

INSERT INTO room_bookings (room_id, during) VALUES
    (1, '[2024-03-15 14:00, 2024-03-15 16:00)');  -- OK, не пересекается

-- Ошибка!
INSERT INTO room_bookings (room_id, during) VALUES
    (1, '[2024-03-15 11:00, 2024-03-15 13:00)');  -- Пересекается с первым

-- IP диапазоны без пересечений
CREATE TABLE ip_allocations (
    id SERIAL PRIMARY KEY,
    network INET,
    owner_id INTEGER,

    EXCLUDE USING GIST (network inet_ops WITH &&)
);
```

---

### Массивы (подробно)

```sql
-- Объявление
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    tags TEXT[],
    scores INTEGER[]
);

-- Вставка
INSERT INTO posts (title, tags, scores) VALUES
    ('PostgreSQL Tips', ARRAY['database', 'sql', 'postgresql'], ARRAY[5, 4, 5]),
    ('Web Development', '{"html", "css", "javascript"}', '{4, 3, 4}');

-- Доступ к элементам (индексация с 1!)
SELECT tags[1] FROM posts;  -- Первый элемент
SELECT tags[2:3] FROM posts;  -- Срез (slice)

-- Операторы
SELECT * FROM posts WHERE 'sql' = ANY(tags);  -- Содержит элемент
SELECT * FROM posts WHERE tags @> ARRAY['sql'];  -- Содержит все элементы
SELECT * FROM posts WHERE tags && ARRAY['sql', 'html'];  -- Пересекается
SELECT * FROM posts WHERE tags <@ ARRAY['sql', 'database', 'postgresql'];  -- Подмножество

-- Функции
SELECT array_length(tags, 1) FROM posts;  -- Длина
SELECT array_dims(tags) FROM posts;  -- Размерность
SELECT array_upper(tags, 1) FROM posts;  -- Верхняя граница
SELECT unnest(tags) FROM posts;  -- Развернуть в строки
SELECT array_agg(tag) FROM unnest(ARRAY['a', 'b', 'c']) AS tag;  -- Свернуть в массив

-- Добавление элемента
UPDATE posts SET tags = array_append(tags, 'new_tag') WHERE id = 1;
UPDATE posts SET tags = tags || 'new_tag' WHERE id = 1;  -- Альтернатива
UPDATE posts SET tags = array_prepend('first_tag', tags) WHERE id = 1;

-- Удаление элемента
UPDATE posts SET tags = array_remove(tags, 'sql') WHERE id = 1;

-- Замена элемента
UPDATE posts SET tags = array_replace(tags, 'sql', 'SQL') WHERE id = 1;

-- Позиция элемента
SELECT array_position(tags, 'sql') FROM posts;

-- Конкатенация
SELECT array_cat(ARRAY[1, 2], ARRAY[3, 4]);  -- {1,2,3,4}

-- Индекс для массивов
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Многомерные массивы
CREATE TABLE matrix (
    data INTEGER[][]
);
INSERT INTO matrix VALUES ('{{1,2,3},{4,5,6}}');
SELECT data[1][2] FROM matrix;  -- 2
```

---

### Оптимизация запросов (Tips)

```sql
-- 1. Используйте EXISTS вместо COUNT для проверки существования
-- Плохо
SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
FROM orders WHERE user_id = 1;

-- Хорошо
SELECT EXISTS (SELECT 1 FROM orders WHERE user_id = 1);

-- 2. Используйте ANY вместо множества OR
-- Плохо
SELECT * FROM users WHERE id = 1 OR id = 2 OR id = 3;

-- Хорошо
SELECT * FROM users WHERE id = ANY(ARRAY[1, 2, 3]);

-- 3. Используйте LIMIT с ORDER BY
-- Плохо (сортирует всё)
SELECT * FROM logs ORDER BY created_at DESC;

-- Хорошо (останавливается раньше с индексом)
SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;

-- 4. Избегайте SELECT *
-- Плохо
SELECT * FROM users WHERE id = 1;

-- Хорошо (особенно с covering index)
SELECT id, email, name FROM users WHERE id = 1;

-- 5. Используйте covering indexes
CREATE INDEX idx_users_email_covering ON users(email) INCLUDE (name, created_at);
-- Index Only Scan без обращения к таблице

-- 6. Partial indexes для частых условий
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- 7. Expression indexes
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- 8. Используйте UNION ALL вместо UNION если не нужна уникальность
SELECT id FROM table1
UNION ALL
SELECT id FROM table2;

-- 9. Batch INSERT
INSERT INTO logs (message) VALUES
    ('log1'), ('log2'), ('log3'), ...;  -- Одним запросом

-- 10. Используйте COPY для массовой загрузки
COPY users(email, name) FROM '/path/to/file.csv' WITH CSV HEADER;
```

---

### Настройки производительности

```sql
-- Ключевые параметры (postgresql.conf)

-- Память
shared_buffers = '4GB'          -- 25% RAM для выделенного сервера
effective_cache_size = '12GB'    -- 75% RAM (для планировщика)
work_mem = '256MB'               -- Память для сортировки/хеширования
maintenance_work_mem = '1GB'     -- Для VACUUM, CREATE INDEX

-- Параллелизм
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_worker_processes = 8

-- WAL
wal_buffers = '64MB'
checkpoint_completion_target = 0.9
max_wal_size = '4GB'
min_wal_size = '1GB'

-- Планировщик
random_page_cost = 1.1           -- Для SSD (по умолчанию 4.0 для HDD)
effective_io_concurrency = 200   -- Для SSD

-- Логирование медленных запросов
log_min_duration_statement = 1000  -- Логировать запросы > 1 секунды

-- Статистика
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all

-- Просмотр текущих настроек
SHOW shared_buffers;
SHOW work_mem;
SELECT name, setting, unit, context FROM pg_settings WHERE name LIKE '%mem%';

-- Изменение на лету (если context = user)
SET work_mem = '512MB';
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
