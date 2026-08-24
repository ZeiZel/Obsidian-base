---
tags:
  - database
  - postgresql
  - sql
  - backend
---

## Руководство по PostgreSQL

### Глава 1. Введение в PostgreSQL

#### Что такое PostgreSQL. Установка сервера

PostgreSQL — свободная объектно-реляционная СУБД с транзакциями, ограничениями целостности, расширяемой системой типов, индексами, JSON, полнотекстовым поиском и средствами конкурентной работы. Она работает по клиент-серверной модели: сервер хранит данные и выполняет запросы, а `psql`, pgAdmin и приложения подключаются к нему по сети или через локальный Unix-сокет.

Актуальные установочные пакеты публикуются на [официальной странице загрузки](https://www.postgresql.org/download/). Для учебного компьютера достаточно локального сервера и клиента; pgAdmin необязателен.

**Ubuntu/Debian.** Версия в системном репозитории может отставать. Если нужна именно ветка 18, сначала подключают официальный PGDG-репозиторий по инструкции PostgreSQL, затем устанавливают пакет:

```bash
sudo apt update
sudo apt install postgresql-18 postgresql-client-18
sudo systemctl enable --now postgresql
```

**Fedora/RHEL-подобные системы.** После подключения официального репозитория PGDG устанавливают сервер и инициализируют кластер:

```bash
sudo dnf install postgresql18-server postgresql18
sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
sudo systemctl enable --now postgresql-18
```

**macOS.** Один из простых вариантов — Homebrew:

```bash
brew install postgresql@18
brew services start postgresql@18
```

В Windows удобнее использовать графический установщик EnterpriseDB: он предлагает выбрать компоненты, каталог данных, пароль административной роли, порт и локаль.

![Выбор дистрибутива PostgreSQL для Windows](https://metanit.com/sql/postgresql/pics/postgres10.png)

![Запуск установщика PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres1.png)

![Выбор каталога установки PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres2.png)

![Выбор устанавливаемых компонентов PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres3.png)

![Выбор каталога данных PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres4.png)

![Настройка пароля административной роли postgres](https://metanit.com/sql/postgresql/pics/postgres5.png)

![Настройка порта PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres6.png)

![Выбор локали кластера PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres7.png)

![Сводка параметров установки PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres8.png)

![Процесс установки PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres11.png)

![Завершение установки PostgreSQL](https://metanit.com/sql/postgresql/pics/postgres9.png)

Стандартный TCP-порт PostgreSQL — `5432`. Основные параметры находятся в `postgresql.conf`, а правила аутентификации — в `pg_hba.conf`; точное расположение файлов зависит от ОС и способа установки. Узнать используемые сервером пути можно запросами:

```sql
show config_file;
show hba_file;
show data_directory;
show port;
```

Проверка клиента, сервера и готовности подключения:

```bash
psql --version
pg_isready -h localhost -p 5432
sudo -u postgres psql
```

```sql
show server_version;
select version();
```

Роль `postgres` обладает широкими правами и предназначена для администрирования, а не для повседневной работы приложения. Разделим владельца объектов, роль миграций и runtime-роль. Пароли не передаём в аргументах командной строки: `\password` запросит значение интерактивно и не оставит его в истории shell. Миграции входят как `app_migrator`, затем делают `set role app_owner`; поэтому default privileges, настроенные для `app_owner`, применяются к создаваемым объектам.

```sql
create role app_owner nologin;
create role app_migrator login noinherit nosuperuser nocreatedb nocreaterole;
\password app_migrator
grant app_owner to app_migrator;

create role app_runtime login noinherit nosuperuser nocreatedb nocreaterole noreplication;
\password app_runtime

create database app_db owner app_owner;
revoke all on database app_db from public;
grant connect on database app_db to app_migrator, app_runtime;
```

После подключения к `app_db` миграции выполняются с `set role app_owner`, а runtime получает только нужные приложению права:

```sql
revoke create on schema public from public;
grant usage on schema public to app_runtime;
grant select, insert, update, delete on all tables in schema public to app_runtime;
grant usage, select on all sequences in schema public to app_runtime;

alter default privileges for role app_owner in schema public
grant select, insert, update, delete on tables to app_runtime;

alter default privileges for role app_owner in schema public
grant usage, select on sequences to app_runtime;
```

Это учебная основа принципа наименьших привилегий. В реальном проекте права часто делят ещё точнее: отдельно для миграций, runtime-приложения и аналитического чтения.

#### Графический клиент pgAdmin

pgAdmin — графический клиент и средство администрирования PostgreSQL. Он позволяет регистрировать серверы, просматривать базы, схемы и таблицы, выполнять SQL, изучать планы запросов и управлять ролями. Это отдельное приложение: установка pgAdmin не означает установку сервера PostgreSQL, и наоборот.

В Linux pgAdmin устанавливают из [официального репозитория проекта](https://www.pgadmin.org/download/). После запуска локальный сервер регистрируют через `Servers` → `Register` → `Server`.

![Регистрация сервера в pgAdmin на Ubuntu](https://metanit.com/sql/postgresql/pics/pgadmin12.png)

На вкладке `General` задаётся произвольное понятное имя подключения.

![Имя подключения в pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin13.png)

На вкладке `Connection` для локального сервера обычно указывают `localhost`, порт `5432`, служебную базу `postgres` или рабочую базу и имя роли. Пароль вводят в интерфейсе, а не записывают в заметку или команду.

![Параметры подключения к PostgreSQL в pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin14.png)

В Windows pgAdmin обычно можно выбрать как компонент графического установщика PostgreSQL.

![Запуск pgAdmin в Windows](https://metanit.com/sql/postgresql/pics/pgadmin1.png)

![Ввод пароля подключения в pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin3.png)

После подключения дерево объектов показывает базы данных, роли и табличные пространства. Внутри базы находятся схемы, а уже внутри схем — таблицы, представления, функции и другие объекты. Имя `public` — лишь схема по умолчанию, а не сама база данных.

![Дерево баз данных и ролей в pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin4.png)

Базу можно создать через контекстное меню `Databases` → `Create` → `Database`.

![Открытие формы создания базы данных в pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin5.png)

![Заполнение параметров новой базы данных](https://metanit.com/sql/postgresql/pics/pgadmin6.png)

![Созданная база данных в дереве pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin7.png)

Для повторяемой настройки окружения предпочтительнее хранить DDL в миграциях, а не создавать объекты вручную: так изменения можно проверить, применить на другом стенде и откатить предусмотренным проектом способом.

#### Запросы SQL в pgAdmin

Query Tool выполняет SQL в контексте выбранной базы данных. Перед запуском всегда проверяйте активное подключение: один и тот же запрос в разных базах изменит разные данные.

![Открытие Query Tool для выбранной базы](https://metanit.com/sql/postgresql/pics/pgadmin8.png)

Создадим небольшую таблицу и добавим строку. Современный PostgreSQL предлагает `generated ... as identity` вместо исторического псевдотипа `serial`: identity явно связывает генерацию значения со столбцом и лучше выражает намерение схемы.

```sql
create table users (
    id bigint generated always as identity primary key,
    name text not null,
    age integer check (age >= 0)
);

insert into users (name, age)
values ('Tom', 33)
returning id, name, age;
```

![Создание таблицы и строки через Query Tool](https://metanit.com/sql/postgresql/pics/pgadmin9.png)

Таблица создаётся в текущей схеме, обычно `public`. К объекту можно обращаться полным именем `public.users`; это особенно полезно, если в базе несколько схем.

![Таблица в схеме public в pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin10.png)

Получим только необходимые столбцы:

```sql
select id, name, age
from users;
```

![Результат SELECT в Data Output pgAdmin](https://metanit.com/sql/postgresql/pics/pgadmin11.png)

Query Tool выполняет выделенный фрагмент либо весь редактор. Команды DDL и DML можно объединять в явную транзакцию, чтобы либо применить изменения вместе, либо отменить их:

```sql
begin;

update users
set age = age + 1
where id = 1;

rollback;
```

#### Консольный клиент psql

`psql` — штатный интерактивный клиент PostgreSQL. Он выполняет SQL и собственные метакоманды, начинающиеся с обратной косой черты. Такой клиент удобен для серверов без графической оболочки, диагностики и автоматизируемых сценариев.

![Запуск консольного клиента psql](https://metanit.com/sql/postgresql/pics/psql1.png)

Подключение к локальной базе. Флаг `-W` запрашивает пароль интерактивно; пароль не следует помещать в URI или аргументы процесса. Для автоматизации используют защищённый файл `.pgpass` с правами `0600` либо менеджер секретов.

```bash
psql -h localhost -p 5432 -U app_runtime -d app_db -W
```

![Диалог подключения psql](https://metanit.com/sql/postgresql/pics/psql2.png)

Полезные метакоманды:

```text
\conninfo          текущее подключение
\l                 список баз данных
\c app_db          подключиться к другой базе
\dn                список схем
\dt public.*       список таблиц схемы public
\d public.users    описание таблицы
\timing on         измерять время запросов
\q                 выйти
```

SQL завершается точкой с запятой, а метакоманды `psql` — нет:

```sql
create database playground;
```

```text
\c playground
```

```sql
create table users (
    id bigint generated always as identity primary key,
    name text not null,
    age integer
);

insert into users (name, age)
values ('Tom', 33)
returning id;
```

![Создание базы и таблицы в psql](https://metanit.com/sql/postgresql/pics/psql3.png)

```sql
select id, name, age
from users;
```

![Добавление и чтение данных в psql](https://metanit.com/sql/postgresql/pics/psql4.png)

Для файлов со скриптами применяют `psql -f migration.sql`, а внутри интерактивной сессии — `\i migration.sql`. Для CI полезен режим остановки при первой ошибке:

```bash
psql -X -v ON_ERROR_STOP=1 -d app_db -f migration.sql
```

### Глава 2. Определение структуры данных

#### Создание и удаление базы данных

База данных в PostgreSQL — изолированное пространство объектов внутри одного кластера сервера. Соединение всегда открывается с конкретной базой; обычный SQL-запрос не обращается к таблице другой базы напрямую.

В pgAdmin Query Tool нужно открыть из любой уже существующей базы, например `postgres`.

![Выбор Query Tool для создания базы](https://metanit.com/sql/postgresql/pics/2.1.png)

Создадим базу с явным владельцем. Выполнять это должна роль с правом `createdb` или суперпользователь:

```sql
create database users_db owner app_owner;
```

![Выполнение CREATE DATABASE в pgAdmin](https://metanit.com/sql/postgresql/pics/2.2.png)

После обновления узла `Databases` новая база появляется в дереве.

![Обновление списка баз данных в pgAdmin](https://metanit.com/sql/postgresql/pics/2.3.png)

![Созданная база данных в pgAdmin](https://metanit.com/sql/postgresql/pics/2.4.png)

У `create database` есть параметры кодировки, локали, шаблона и табличного пространства, но менять их следует осознанно: часть параметров определяется шаблоном и не изменяется после создания. Для большинства проектов подходят UTF-8 и настройки локали, выбранные при инициализации кластера.

Удаление базы необратимо и требует завершить активные соединения. Подключаться при этом нужно к другой базе:

```sql
drop database users_db with (force);
```

`with (force)` разрывает доступные серверу соединения, но не превращает операцию в безопасную: перед удалением всё равно проверяют имя окружения, наличие резервной копии и владельца данных. Если база нужна временно, часто безопаснее создать отдельную тестовую базу и удалять только её автоматизированным скриптом.

#### Создание и удаление таблиц

Таблица задаёт структуру строк: для каждого столбца определяются имя, тип и ограничения. В production-схеме имена обычно пишут в `snake_case` без кавычек: PostgreSQL приводит некавыченные идентификаторы к нижнему регистру, тогда как `"MixedCase"` придётся всегда заключать в кавычки.

![Открытие Query Tool для создания таблицы](https://metanit.com/sql/postgresql/pics/2.5.png)

```sql
create table customers (
    id bigint generated always as identity primary key,
    first_name text not null,
    last_name text not null,
    email text,
    age integer check (age >= 0)
);
```

![Созданная таблица customers в pgAdmin](https://metanit.com/sql/postgresql/pics/2.6.png)

`create table if not exists` подавляет ошибку существования, но не проверяет совпадение уже имеющейся структуры с ожидаемой. Для последовательного изменения схемы используют миграции.

```sql
create table if not exists audit_events (
    id bigint generated always as identity primary key,
    payload jsonb not null,
    created_at timestamptz not null default now()
);
```

Удаление таблицы уничтожает её данные, индексы и принадлежащие ей ограничения:

```sql
drop table customers;
```

`drop table ... cascade` дополнительно удаляет зависимые объекты. Применять `cascade` без просмотра зависимостей опасно; в миграциях лучше перечислять ожидаемые изменения явно.

#### Типы данных в PostgreSQL

Тип ограничивает допустимые значения и определяет операции, индексы и формат хранения. Чем точнее тип соответствует предметной области, тем меньше проверок остаётся приложению.

**Целые и вещественные числа.** `smallint`, `integer` и `bigint` хранят целые числа размером 2, 4 и 8 байт. `real` и `double precision` используют двоичную плавающую точку и подходят для приближённых вычислений. Для денег и других точных десятичных величин обычно применяют `numeric(p, s)`, где `p` — общая точность, а `s` — масштаб. Тип `money` зависит от локали вывода и часто неудобен для обмена данными.

**Автогенерируемые ключи.** `smallserial`, `serial` и `bigserial` — исторические псевдотипы, создающие последовательность и `default nextval(...)`. В новой схеме предпочтительнее стандартный identity-столбец:

```sql
create table products (
    id bigint generated always as identity primary key,
    name text not null,
    stock integer not null default 0 check (stock >= 0),
    price numeric(12, 2) not null check (price >= 0)
);
```

`generated always` запрещает случайную ручную подстановку идентификатора; при осознанном импорте её можно разрешить через `overriding system value`. Вариант `generated by default` допускает ручное значение сразу.

**Строки и байты.** `text` хранит строку произвольной длины. `varchar(n)` добавляет проверку максимальной длины, но обычно не быстрее `text`. `char(n)` дополняет значение пробелами до фиксированной длины и нужен редко. `bytea` хранит двоичные данные; крупные файлы часто выгоднее держать в объектном хранилище, оставляя в БД метаданные и ссылку.

**Дата и время.** `date` хранит дату, `time` — время суток, `interval` — длительность. `timestamp without time zone` не обозначает временную зону и подходит для «настенных» значений вроде времени открытия. `timestamptz` хранит конкретный момент времени, нормализованный внутренне; исходное имя зоны (`Europe/Moscow`) он не сохраняет, а выводит момент в зоне текущей сессии. Для событий обычно выбирают `timestamptz`:

```sql
create table events (
    id bigint generated always as identity primary key,
    starts_at timestamptz not null,
    created_at timestamptz not null default now()
);

set timezone = 'Europe/Moscow';

insert into events (starts_at)
values ('2026-08-23 18:00:00+03:00');
```

**Логические значения.** `boolean` хранит `true`, `false` или `null`, если столбец допускает отсутствие значения.

**Сетевые типы.** `inet` хранит IPv4/IPv6-адрес и при необходимости длину маски, сохраняя биты узла. `cidr` представляет именно сеть и требует, чтобы биты узла были нулевыми. Также доступны `macaddr` и `macaddr8`.

```sql
select
    '192.168.1.15/24'::inet as host_address,
    '192.168.1.0/24'::cidr as network;
```

**UUID.** `uuid` занимает 16 байт и проверяет формат. В PostgreSQL 18 функция `uuidv7()` создаёт UUID версии 7, удобный для новых распределённых идентификаторов; `gen_random_uuid()` создаёт UUID версии 4.

```sql
create table api_keys (
    id uuid primary key default uuidv7(),
    label text not null
);
```

**JSON.** `json` сохраняет исходный текст почти без преобразования. `jsonb` хранит разобранное бинарное представление, не сохраняет пробелы и порядок ключей, а при повторяющихся ключах оставляет одно значение. Для запросов и индексации обычно выбирают `jsonb`:

```sql
create table documents (
    id bigint generated always as identity primary key,
    body jsonb not null check (jsonb_typeof(body) = 'object')
);

create index documents_body_gin_idx
on documents using gin (body);
```

PostgreSQL также поддерживает массивы, диапазоны, геометрические, полнотекстовые, XML, перечислимые и пользовательские типы. Выбор типа должен следовать смыслу данных, а не только их внешнему виду: телефон — `text`, сумма — `numeric`, IP-адрес — `inet`, структурированный документ для запросов — `jsonb`.

#### Ограничения столбцов и таблиц

Ограничения защищают инварианты независимо от того, какое приложение записывает данные. Им полезно давать устойчивые имена: это упрощает миграции и диагностику.

`primary key` одновременно требует уникальность и `not null`; ключ может состоять из нескольких столбцов. Identity отвечает только за генерацию числа и сам по себе не делает столбец ключом.

```sql
create table order_lines (
    order_id bigint not null,
    product_id bigint not null,
    quantity integer not null check (quantity > 0),
    unit_price numeric(12, 2) not null check (unit_price >= 0),
    constraint order_lines_pk primary key (order_id, product_id)
);
```

`unique` запрещает дубли значений, но в PostgreSQL по умолчанию считает `null` не равным другому `null`, поэтому допускает несколько строк без значения. Если отсутствие значения тоже должно встречаться один раз, используйте `nulls not distinct`:

```sql
create table customers (
    id bigint generated always as identity,
    email text,
    phone text,
    constraint customers_pk primary key (id),
    constraint customers_email_uq unique nulls not distinct (email),
    constraint customers_phone_uq unique (phone)
);
```

`not null` требует наличие значения. `default` вычисляет значение, когда столбец отсутствует в `insert` или указан оператор `default`; явный `null` значение по умолчанию не включает.

```sql
create table tasks (
    id bigint generated always as identity primary key,
    title text not null,
    status text not null default 'new',
    created_at timestamptz not null default now()
);
```

`check` принимает строку, если условие равно `true` **или** `unknown`. Поэтому проверка `check (age >= 0)` сама по себе допускает `null`; если значение обязательно, дополнительно нужен `not null`.

```sql
create table profiles (
    user_id bigint primary key,
    age integer not null,
    email text not null,
    constraint profiles_age_ck check (age between 0 and 130),
    constraint profiles_email_ck check (email <> '')
);
```

Ограничения видны в pgAdmin и системных каталогах.

![Список ограничений таблицы в pgAdmin](https://metanit.com/sql/postgresql/pics/2.7.png)

Получить определения ограничений программно:

```sql
select
    conname,
    pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass
order by conname;
```

#### Внешние ключи

Внешний ключ требует, чтобы значение в дочерней таблице соответствовало первичному или уникальному ключу родительской таблицы. Он предотвращает «осиротевшие» ссылки, но не создаёт индекс на дочерних столбцах автоматически.

```sql
create table customers (
    id bigint generated always as identity primary key,
    name text not null
);

create table orders (
    id bigint generated always as identity primary key,
    customer_id bigint not null,
    quantity integer not null check (quantity > 0),
    constraint orders_customer_fk
        foreign key (customer_id)
        references customers (id)
        on delete restrict
);

create index orders_customer_id_idx
on orders (customer_id);
```

Индекс на `orders.customer_id` ускоряет соединения и проверку зависимых строк при изменении или удалении клиента. Для маленькой таблицы он может быть несущественным, но в рабочей схеме такой индекс обычно нужен.

Действия при изменении родительской строки:

- `no action` — вариант по умолчанию; проверка может быть отложенной у deferrable-ограничения;
- `restrict` — запрещает действие без возможности отложить эту проверку;
- `cascade` — переносит обновление ключа или удаляет зависимые строки;
- `set null` — записывает `null`, поэтому дочерний столбец должен его допускать;
- `set default` — записывает значение по умолчанию, которое всё равно должно ссылаться на существующую родительскую строку.

Каскадное удаление удобно для объектов, не имеющих смысла без владельца, но способно удалить большой граф данных. Выбор действия — часть бизнес-модели, а не техническая формальность.

```sql
create table order_items (
    order_id bigint not null,
    line_no integer not null,
    product_name text not null,
    constraint order_items_pk primary key (order_id, line_no),
    constraint order_items_order_fk
        foreign key (order_id)
        references orders (id)
        on delete cascade
);

create index order_items_order_id_idx
on order_items (order_id);
```

Для циклической загрузки данных ограничение можно сделать `deferrable initially deferred`, чтобы оно проверялось в конце транзакции. Отключать внешние ключи ради обычного импорта не следует.

#### Изменение таблиц

`alter table` добавляет, удаляет и переименовывает столбцы, меняет типы, значения по умолчанию и ограничения. В рабочей базе изменение оценивают не только синтаксически: операция может переписать таблицу, долго удерживать блокировку или перестать помещаться в допустимое окно обслуживания.

Добавление nullable-столбца:

```sql
alter table customers
add column phone text;
```

Если существующие строки должны получить обязательное значение, безопасный многошаговый вариант удобнее одной тяжёлой миграции:

```sql
alter table customers
add column status text;

update customers
set status = 'active'
where status is null;

alter table customers
alter column status set default 'active';

alter table customers
alter column status set not null;
```

Удаление и переименование:

```sql
alter table customers
drop column phone;

alter table customers
rename column status to account_status;

alter table customers
rename to users;
```

При изменении типа PostgreSQL пытается выполнить неявное преобразование. Если его нет или нужна особая логика, задают `using`:

```sql
alter table users
alter column age type smallint
using age::smallint;
```

Именованные ограничения проще удалять и заменять:

```sql
alter table users
add constraint users_age_ck check (age between 0 and 130) not valid;

alter table users
validate constraint users_age_ck;

alter table users
drop constraint users_age_ck;
```

`not valid` позволяет добавить `check` или внешний ключ без немедленного полного сканирования старых строк; новые изменения уже проверяются. Затем `validate constraint` отдельно проверяет накопленные данные с более мягким профилем блокировок. Конкретный план миграции всё равно нужно испытывать на объёме, близком к production.

### Глава 3. Операции с данными

#### Добавление данных. Команда Insert

`insert` создаёт строки. Почти всегда следует явно перечислять столбцы: тогда добавление нового столбца или изменение физического порядка не ломает запрос.

```sql
create table products (
    id bigint generated always as identity primary key,
    product_name text not null,
    manufacturer text not null,
    product_count integer not null default 0 check (product_count >= 0),
    price numeric(12, 2) not null check (price >= 0),
    constraint products_name_manufacturer_uq
        unique (product_name, manufacturer)
);

insert into products (
    product_name,
    manufacturer,
    product_count,
    price
)
values ('Galaxy S9', 'Samsung', 4, 63000.00);
```

![Результат INSERT в pgAdmin](https://metanit.com/sql/postgresql/pics/3.1.png)

Несколько строк передаются одним списком `values`. Это сокращает сетевые обращения и обычно эффективнее последовательности одиночных вставок:

```sql
insert into products (
    product_name,
    manufacturer,
    product_count,
    price
)
values
    ('iPhone 6', 'Apple', 3, 36000.00),
    ('Galaxy S8', 'Samsung', 2, 46000.00),
    ('Galaxy S8 Plus', 'Samsung', 1, 56000.00)
returning id, product_name;
```

`returning` отдаёт фактически записанные значения, включая identity, defaults и изменения триггеров. Это надёжнее отдельного запроса «последнего идентификатора».

![Возвращение созданного идентификатора через RETURNING](https://metanit.com/sql/postgresql/pics/3.2.png)

Для конфликта с уникальным ограничением PostgreSQL поддерживает атомарный upsert:

```sql
insert into products (
    product_name,
    manufacturer,
    product_count,
    price
)
values ('Galaxy S9', 'Samsung', 2, 62000.00)
on conflict (product_name, manufacturer)
do update
set
    product_count = products.product_count + excluded.product_count,
    price = excluded.price
returning id, product_count, price;
```

`on conflict` привязан к уникальному индексу или ограничению и специально решает конкурентный конфликт вставки. `merge` поддерживает более общую ветвящуюся синхронизацию источника и цели, но не является механической заменой upsert: его конкурентное поведение и подходящее уникальное ограничение нужно анализировать отдельно.

```sql
merge into products as target
using (
    values ('Pixel 10', 'Google', 5, 79900.00)
) as source (product_name, manufacturer, product_count, price)
on target.product_name = source.product_name
and target.manufacturer = source.manufacturer
when matched then
    update set
        product_count = source.product_count,
        price = source.price
when not matched then
    insert (product_name, manufacturer, product_count, price)
    values (
        source.product_name,
        source.manufacturer,
        source.product_count,
        source.price
    );
```

Для массовой загрузки предназначен `copy`. Серверный `copy from '/path/file.csv'` читает файл от имени ОС-пользователя сервера и требует серверных прав. Метакоманда `\copy` читает локальный файл клиента и обычно удобнее:

```text
\copy products (product_name, manufacturer, product_count, price) from './products.csv' with (format csv, header true)
```

Импорт выполняют в контролируемой транзакции, проверяют кодировку, разделители, `null` и ограничения. Для недоверенных данных полезна staging-таблица, из которой валидные строки затем переносятся в основную схему.

#### Получение данных. Команда Select

`select` формирует результирующий набор. Для прикладного кода лучше перечислять нужные столбцы: `select *` затрудняет контроль контракта и может переносить лишние данные.

```sql
select
    id,
    product_name,
    manufacturer,
    product_count,
    price
from products;
```

![Выбор всех данных таблицы products](https://metanit.com/sql/postgresql/pics/3.3.png)

```sql
select product_name, price
from products;
```

![Выбор отдельных столбцов таблицы](https://metanit.com/sql/postgresql/pics/3.4.png)

В списке `select` разрешены выражения. Псевдоним `as` задаёт имя вычисляемого столбца в результате:

```sql
select
    product_name,
    manufacturer,
    product_count,
    price,
    price * product_count as total_value
from products;
```

![Псевдонимы и вычисляемые столбцы SELECT](https://metanit.com/sql/postgresql/pics/3.5.png)

SQL не гарантирует порядок строк без `order by`. Даже если результат сегодня выглядит отсортированным по `id`, план выполнения или состояние таблицы может изменить порядок.

```sql
select id, product_name, price
from products
order by price desc, id asc;
```

В реальном приложении значения не склеивают со строкой SQL: параметры передаются средствами драйвера. Это сохраняет типизацию протокола и предотвращает SQL-инъекции.

#### Фильтрация. WHERE

`where` оставляет строки, для которых условие истинно. Основные сравнения: `=`, `<>` или `!=`, `<`, `>`, `<=`, `>=`.

```sql
select id, product_name, manufacturer, price
from products
where manufacturer = 'Apple';
```

![Фильтрация товаров по производителю](https://metanit.com/sql/postgresql/pics/3.6.png)

Строковые сравнения зависят от collation и чувствительны к регистру в обычном `=`. Для нечувствительного поиска часто применяют `lower(...)`, `ilike` или специализированный тип/индекс, но способ должен соответствовать правилам конкретной предметной области.

```sql
select id, product_name, price
from products
where price < 39000.00;

select id, product_name, price, product_count
from products
where price * product_count > 90000.00;
```

![Фильтрация по вычисляемому условию](https://metanit.com/sql/postgresql/pics/3.7.png)

Условия соединяются операторами `and`, `or` и `not`. У `and` приоритет выше, чем у `or`, поэтому смешанные условия лучше явно группировать скобками.

```sql
select id, product_name, manufacturer, price
from products
where manufacturer = 'Samsung'
  and price > 50000.00;
```

![Логическое условие AND](https://metanit.com/sql/postgresql/pics/3.8.png)

```sql
select id, product_name, manufacturer, price
from products
where manufacturer = 'Samsung'
   or price > 50000.00;
```

![Логическое условие OR](https://metanit.com/sql/postgresql/pics/3.9.png)

```sql
select id, product_name, manufacturer
from products
where manufacturer <> 'Samsung';
```

![Логическое отрицание условия](https://metanit.com/sql/postgresql/pics/3.10.png)

`null` означает неизвестное или отсутствующее значение. Сравнения `column = null` и `column <> null` дают `unknown`, а не `true`; нужны `is null` и `is not null`:

```sql
select id, product_name
from products
where product_count is null;

select id, product_name
from products
where product_count is not null;
```

Это проявление трёхзначной логики SQL: условие может быть `true`, `false` или `unknown`. Оператор `is distinct from` полезен, когда `null` требуется сравнивать как обычное сопоставимое состояние:

```sql
select id, product_name
from products
where manufacturer is distinct from 'Samsung';
```

#### Обновление данных. Команда UPDATE

`update` изменяет существующие строки. Без `where` обновляются все строки таблицы, поэтому перед массовой операцией полезно выполнить `select` с тем же условием и проверить ожидаемое количество. Ниже показан учебный откат: `commit` выполняют только после проверки результата.

```sql
begin;

update products
set price = price + 3000.00
returning id, product_name, price;

rollback;
```

![Массовое обновление цен через UPDATE](https://metanit.com/sql/postgresql/pics/3.11.png)

Ограниченное обновление:

```sql
update products
set manufacturer = 'Samsung Inc.'
where manufacturer = 'Samsung'
returning id, product_name, manufacturer;
```

![Обновление строк с условием WHERE](https://metanit.com/sql/postgresql/pics/3.12.png)

Одним запросом можно изменить несколько столбцов. Выражения справа вычисляются по исходной версии строки, а `returning` показывает итог:

```sql
update products
set
    manufacturer = 'Samsung',
    product_count = product_count + 3
where manufacturer = 'Samsung Inc.'
returning id, manufacturer, product_count;
```

Критичное изменение выполняют в транзакции. Сначала можно проверить строки и заблокировать их от конкурентного изменения:

```sql
begin;

select id, product_name, price
from products
where manufacturer = 'Apple'
for update;

update products
set price = round(price * 1.05, 2)
where manufacturer = 'Apple'
returning id, price;

commit;
```

Долгая транзакция удерживает блокировки и старые версии строк, поэтому пользовательскую проверку нельзя оставлять открытой на неопределённое время.

#### Удаление данных. Команда DELETE

`delete` удаляет строки, соответствующие `where`. Как и у `update`, отсутствие условия означает действие над всей таблицей.

```sql
delete from products
where manufacturer = 'Apple'
returning id, product_name;
```

![Удаление строк через DELETE](https://metanit.com/sql/postgresql/pics/3.13.png)

Составное условие:

```sql
delete from products
where manufacturer = 'HTC'
  and price < 15000.00
returning id, product_name;
```

Удаление всех строк сохраняет саму таблицу. В учебном примере используем транзакцию и откат; `commit` допустим только после проверки возвращённых идентификаторов:

```sql
begin;

delete from products
returning id;

rollback;
```

`truncate table products;` обычно быстрее для полной очистки большой таблицы, но имеет другие блокировки, поведение триггеров и правила внешних ключей. `restart identity` дополнительно сбрасывает принадлежащие таблице последовательности, а `cascade` затрагивает зависимые таблицы; эти параметры нельзя подставлять автоматически вместо `delete`.

Если удаление должно быть обратимым с точки зрения продукта, часто применяют soft delete — например, `deleted_at timestamptz`. Это не бесплатная замена физическому удалению: все запросы, уникальные ограничения, индексы, аудит и политика хранения должны учитывать удалённое состояние.

```sql
alter table products
add column deleted_at timestamptz;

update products
set deleted_at = now()
where id = 42
  and deleted_at is null
returning id, deleted_at;
```

### Глава 4. Запросы

В примерах этой главы используется таблица товаров:

```sql
create table products (
    id bigint generated always as identity primary key,
    product_name varchar(80) not null,
    company varchar(80) not null,
    product_count integer not null default 0 check (product_count >= 0),
    price numeric(12, 2) not null check (price >= 0),
    is_discounted boolean
);

insert into products (product_name, company, product_count, price, is_discounted)
values
    ('iPhone X', 'Apple', 3, 76000, false),
    ('iPhone 8', 'Apple', 2, 71000, true),
    ('iPhone 7', 'Apple', 5, 42000, true),
    ('Galaxy S9', 'Samsung', 2, 46000, false),
    ('Galaxy S8 Plus', 'Samsung', 1, 56000, true),
    ('Desire 12', 'HTC', 5, 28000, true),
    ('Nokia 9', 'HMD Global', 6, 38000, null);
```

#### DISTINCT. Выборка уникальных значений

`distinct` удаляет повторяющиеся строки из результата. Уникальность проверяется по всей комбинации выражений после `select`, а не по каждому столбцу отдельно.

```sql
select distinct company
from products
order by company;

select distinct company, is_discounted
from products
order by company, is_discounted nulls last;
```

![DISTINCT и выбор уникальных значений в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.1.png)

PostgreSQL также поддерживает `distinct on`: он оставляет первую строку каждой группы. Какая именно строка станет первой, обязательно задают детерминированным `order by`. Выражения `distinct on` должны совпадать с первыми выражениями сортировки.

```sql
select distinct on (company)
    company,
    product_name,
    price
from products
order by company, price desc, id;
```

Здесь для каждой компании выбирается самый дорогой товар; `id` разрешает ничью цен. Без достаточного `order by` выбор строки внутри группы не определён. Обычный `distinct` полезен для результата без дублей, но не заменяет исправление ошибочного соединения, которое само породило лишние строки.

#### ORDER BY. Сортировка

SQL не гарантирует порядок строк без `order by`. Сортировать можно по столбцу, выражению, псевдониму результата и нескольким критериям. `asc` используется по умолчанию, `desc` задаёт убывание; положение `null` лучше указывать явно.

```sql
select product_name, product_count, price
from products
order by product_count, id;
```

![ORDER BY и сортировка в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.2.png)

```sql
select
    product_name,
    product_count * price as stock_value
from products
order by stock_value desc, product_name, id;
```

![Сортировка по вычисляемому столбцу в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.3.png)

Выражение необязательно выводить в результирующем наборе:

```sql
select product_name, price, product_count
from products
order by price * product_count desc, id;
```

![Выражение в ORDER BY в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.6.png)

Сортировка по убыванию:

```sql
select product_name, company
from products
order by company desc, id;
```

![Сортировка по убыванию в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.4.png)

При нескольких критериях PostgreSQL сравнивает следующий критерий только для строк, равных по предыдущему:

```sql
select product_name, price, company
from products
order by company asc, product_name desc, id;
```

![Сортировка по нескольким столбцам в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.5.png)

Для воспроизводимого результата добавляйте уникальный последний критерий, обычно первичный ключ. Это особенно важно перед `limit`, `offset`, оконными функциями и `distinct on`.

#### Получение диапазона строк. LIMIT и OFFSET

`limit` ограничивает число строк, а `offset` пропускает заданное число. Пагинация осмысленна только с детерминированной сортировкой.

```sql
select id, product_name, price
from products
order by product_name, id
limit 4;
```

![Оператор LIMIT в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.7.png)

```sql
select id, product_name, price
from products
order by product_name, id
limit 3 offset 2;
```

![LIMIT и OFFSET в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.8.png)

`limit all` равнозначен отсутствию ограничения. Большой `offset` дорог: сервер всё равно должен найти и отбросить предыдущие строки, а параллельные вставки и удаления могут сдвигать страницы. Для длинных лент обычно применяют keyset pagination — продолжают выборку после последнего увиденного ключа:

```sql
select id, product_name, price
from products
where (price, id) < (56000, 5)
order by price desc, id desc
limit 20;
```

Кортеж в `where` должен повторять направление и смысл сортировки; значения курсора передаёт клиент. Смешанные направления, `null` и изменяемые ключи требуют отдельной логики, поэтому нельзя механически заменять любой `offset` этим шаблоном.

#### Операторы фильтрации

`in` проверяет принадлежность набору, `between` — попадание в замкнутый диапазон, `like` — соответствие строковому шаблону. Эти выражения применяются внутри `where` или `having`.

```sql
select id, product_name, company
from products
where company in ('Samsung', 'HTC', 'Huawei')
order by id;
```

![Оператор IN в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.9.png)

```sql
select id, product_name, price
from products
where price between 20000 and 50000
order by price, id;
```

![Оператор BETWEEN в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.10.png)

Обе границы `between` включаются. Для полуинтервала дат часто понятнее писать `created_at >= ... and created_at < ...`.

В `like` знак `%` означает любое число символов, а `_` — ровно один. `ilike` выполняет регистронезависимое сопоставление по правилам текущей локали.

```sql
select id, product_name
from products
where product_name like 'iPhone%'
order by id;
```

![Оператор LIKE в PostgreSQL](https://metanit.com/sql/postgresql/pics/5.11.png)

`null` означает неизвестное значение и подчиняется трёхзначной логике: сравнения `= null` и `<> null` не возвращают `true`. Проверяйте `is null`, `is not null`, а для безопасного сравнения, где два `null` считаются равными, используйте `is not distinct from`.

```sql
select id, product_name
from products
where is_discounted is null;

select id, product_name
from products
where is_discounted is distinct from true
order by id;
```

Особенно осторожно применяйте `not in` к подзапросу: один `null` в его результате может сделать условие неизвестным для всех строк. Для антисоединения надёжнее коррелированный `not exists`:

```sql
select p.id, p.product_name
from products as p
where not exists (
    select 1
    from products as other
    where other.company = p.company
      and other.is_discounted is true
)
order by p.id;
```

Этот запрос выбирает товары компаний, у которых нет ни одной модели с подтверждённой скидкой.

#### Агрегатные функции

Агрегатная функция сворачивает набор строк в одно значение. Основные функции: `count`, `sum`, `avg`, `min`, `max`, `bool_and`, `bool_or`, `string_agg`. Почти все агрегаты игнорируют `null` и на пустом наборе возвращают `null`; исключение — `count`, возвращающий `0`. `count(*)` считает строки, а `count(expression)` — только строки с ненулевым результатом выражения.

```sql
select avg(price) as average_price
from products;
```

![Функция AVG в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.1.png)

```sql
select
    count(*) as row_count,
    count(is_discounted) as known_discount_count,
    count(distinct company) as company_count
from products;
```

![Функция COUNT в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.2.png)

`min` и `max` находят крайние значения, `sum` — сумму. Для пустого набора сумму при необходимости заменяют нулём через `coalesce`.

```sql
select
    min(price) as min_price,
    max(price) as max_price,
    coalesce(sum(product_count), 0) as units,
    coalesce(sum(product_count * price), 0) as stock_value
from products;
```

`filter` позволяет считать несколько условных метрик за один проход:

```sql
select
    count(*) as all_products,
    count(*) filter (where is_discounted) as discounted_products,
    avg(price) filter (where company = 'Apple') as apple_average_price
from products;
```

`bool_or` отвечает, истинно ли условие хотя бы для одной ненулевой строки, а `bool_and` — истинно ли оно для всех ненулевых строк.

```sql
select
    bool_or(is_discounted) as has_discount,
    bool_and(is_discounted) as all_known_rows_discounted
from products;
```

`string_agg` объединяет строки. Порядок внутри агрегата не гарантируется общим `order by` запроса, поэтому его задают в аргументах функции:

```sql
select string_agg(product_name, ', ' order by product_name) as product_names
from products;
```

![Функция STRING_AGG в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.4.png)

```sql
select string_agg(distinct company, ', ' order by company) as companies
from products;
```

Несколько агрегатов можно вычислять одновременно:

```sql
select
    count(*) as model_count,
    sum(product_count) as unit_count,
    min(price) as min_price,
    max(price) as max_price,
    avg(price) as average_price
from products;
```

![Несколько агрегатных функций в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.3.png)

#### Группировка

`group by` разделяет входные строки на группы, после чего агрегаты вычисляются для каждой группы. В `select` можно выводить агрегаты и столбцы группировки; остальные столбцы допустимы лишь когда PostgreSQL может доказать их функциональную зависимость от сгруппированного первичного ключа.

```sql
select company, count(*) as model_count
from products
group by company
order by company;
```

![Группировка и GROUP BY в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.5.png)

```sql
select company, count(*) as model_count
from products
where price > 30000
group by company
order by model_count desc, company;
```

![GROUP BY и сортировка в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.6.png)

`where` фильтрует отдельные строки до группировки, а `having` — уже сформированные группы после неё.

```sql
select company, count(*) as model_count
from products
group by company
having count(*) > 1
order by company;
```

![HAVING в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.7.png)

```sql
select
    company,
    count(*) as model_count,
    sum(product_count) as unit_count
from products
where price * product_count > 80000
group by company
having sum(product_count) > 2
order by unit_count desc, company;
```

![Фильтрация и сортировка сгруппированных данных](https://metanit.com/sql/postgresql/pics/6.8.png)

`grouping sets` вычисляет несколько явно перечисленных вариантов группировки одним запросом. Пустой набор `()` означает общий итог. Функция `grouping` помогает отличить итоговый `null` от настоящего `null` в данных.

```sql
select
    company,
    is_discounted,
    count(*) as product_count,
    grouping(company, is_discounted) as grouping_mask
from products
group by grouping sets (
    (company, is_discounted),
    (company),
    ()
)
order by company nulls last, is_discounted nulls last;
```

На исходной странице рядом с `grouping sets` повторно использовано то же изображение `6.8.png`; здесь оно приведено один раз выше и не рассматривается как иллюстрация результата `grouping sets`.

`rollup(a, b)` создаёт иерархические наборы `(a, b)`, `(a)` и `()`, поэтому удобен для промежуточных и общих итогов.

```sql
select
    company,
    count(*) as model_count,
    sum(product_count) as unit_count
from products
group by rollup (company)
order by company nulls last;
```

![Оператор ROLLUP в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.9.png)

```sql
select
    company,
    product_count,
    count(*) as model_count,
    sum(product_count) as unit_count
from products
group by rollup (company, product_count)
order by company nulls last, product_count nulls last;
```

![ROLLUP по нескольким критериям в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.10.png)

`cube(a, b)` создаёт все комбинации: `(a, b)`, `(a)`, `(b)` и `()`. Число наборов растёт как `2^n`, поэтому много измерений может резко увеличить результат.

```sql
select
    company,
    product_name,
    sum(product_count * price) as total_value,
    grouping(company, product_name) as grouping_mask
from products
group by cube (company, product_name)
order by company nulls last, product_name nulls last;
```

![Оператор CUBE в PostgreSQL](https://metanit.com/sql/postgresql/pics/6.11.png)

![Детальные группы CUBE](https://metanit.com/sql/postgresql/pics/6.11.1.png)

![Итоги CUBE по компаниям](https://metanit.com/sql/postgresql/pics/6.11.2.png)

![Итоги CUBE по товарам](https://metanit.com/sql/postgresql/pics/6.11.3.png)

#### Подзапросы

Подзапрос — `select`, вложенный в другое выражение. Он может вернуть одно значение, одну строку, столбец или таблицу. Скалярный подзапрос обязан вернуть не более одной строки: ноль строк превращается в `null`, а несколько вызывают ошибку.

Для примеров с зависимыми сущностями определим покупателей и заказы:

```sql
create table customers (
    id bigint generated always as identity primary key,
    first_name text not null
);

create table orders (
    id bigint generated always as identity primary key,
    product_id bigint not null references products (id) on delete restrict,
    customer_id bigint not null references customers (id) on delete restrict,
    created_at date not null,
    product_count integer not null default 1 check (product_count > 0),
    price numeric(12, 2) not null check (price >= 0)
);
```

```sql
select id, product_name, price
from products
where price = (
    select min(price)
    from products
)
order by id;

select id, product_name, price
from products
where price > (
    select avg(price)
    from products
)
order by price desc, id;
```

![Подзапросы в PostgreSQL](https://metanit.com/sql/postgresql/pics/7.1.png)

Коррелированный подзапрос ссылается на текущую строку внешнего запроса. Например, следующий запрос выводит товары дороже средней цены своей компании:

```sql
select
    p.id,
    p.product_name,
    p.company,
    p.price
from products as p
where p.price > (
    select avg(other.price)
    from products as other
    where other.company = p.company
)
order by p.company, p.price desc, p.id;
```

![Коррелированный подзапрос в PostgreSQL](https://metanit.com/sql/postgresql/pics/7.2.png)

![Сравнение со средним значением коррелированным подзапросом](https://metanit.com/sql/postgresql/pics/7.3.png)

Логически коррелированный подзапрос зависит от внешней строки, но не следует считать, что PostgreSQL буквально запускает его заново для каждой строки: планировщик может преобразовать запрос в соединение или выбрать иной план. Реальное выполнение проверяют через `explain (analyze, buffers)` на репрезентативных данных.

Для проверки наличия строк используйте `exists`: база может остановить поиск после первого совпадения. `not exists` безопаснее `not in`, когда подзапрос способен вернуть `null`.

```sql
select c.id, c.first_name
from customers as c
where exists (
    select 1
    from orders as o
    where o.customer_id = c.id
)
order by c.id;

select c.id, c.first_name
from customers as c
where not exists (
    select 1
    from orders as o
    where o.customer_id = c.id
)
order by c.id;
```

Подзапрос в `from` образует производную таблицу и должен иметь псевдоним. `lateral` разрешает такой таблице ссылаться на предыдущие элементы `from`; это удобно, например, для нескольких лучших строк на каждую группу.

```sql
select c.id, c.first_name, recent.created_at, recent.price
from customers as c
left join lateral (
    select o.created_at, o.price
    from orders as o
    where o.customer_id = c.id
    order by o.created_at desc, o.id desc
    limit 2
) as recent on true
order by c.id, recent.created_at desc nulls last;
```

CTE через `with` даёт имя промежуточному запросу. В современных версиях PostgreSQL не рекурсивный CTE обычно может быть встроен планировщиком; `materialized` принудительно вычисляет его отдельно, а `not materialized` просит встроить. Это инструмент управления планом, а не универсальная оптимизация.

```sql
with company_stats as (
    select company, avg(price) as average_price
    from products
    group by company
)
select p.product_name, p.company, p.price, s.average_price
from products as p
join company_stats as s using (company)
where p.price > s.average_price
order by p.company, p.price desc, p.id;
```

Оконная функция вычисляет значение по связанным строкам, но не сворачивает их в одну строку, как `group by`:

```sql
select
    id,
    product_name,
    company,
    price,
    avg(price) over (partition by company) as company_average_price,
    row_number() over (
        partition by company
        order by price desc, id
    ) as price_position
from products
order by company, price_position;
```

### Глава 5. Составные типы данных

#### Массивы

PostgreSQL позволяет хранить в одном столбце массив значений одного типа. Тип обозначается квадратными скобками: `text[]`, `integer[]`. Индексация массива по умолчанию начинается с `1`, хотя PostgreSQL технически допускает другие нижние границы.

```sql
create table posts (
    id bigint generated always as identity primary key,
    title text not null,
    body text not null,
    tags text[] not null default '{}'
);

insert into posts (title, body, tags)
values (
    'PostgreSQL arrays',
    'Short article text',
    array['sql', 'postgres', 'database', 'plpgsql']
);
```

![Массивы в PostgreSQL](https://metanit.com/sql/postgresql/pics/4.1.png)

Можно извлечь элемент или срез. В срезе обе границы включаются:

```sql
select tags, tags[1], tags[1:3]
from posts
where id = 1;
```

![Чтение массива в PostgreSQL](https://metanit.com/sql/postgresql/pics/4.2.png)

Массив обновляется целиком либо по индексу:

```sql
update posts
set tags = array['sql', 'postgres', 'database']
where id = 1;

update posts
set tags[2] = 'postgresql'
where id = 1;
```

![Обновление массива в PostgreSQL](https://metanit.com/sql/postgresql/pics/4.3.png)

Операторы `@>` и `<@` проверяют включение массивов, `&&` — пересечение, `= any(array)` — присутствие значения. `unnest` превращает элементы массива в строки.

```sql
select id, title
from posts
where tags @> array['postgres']
order by id;

select p.id, p.title, tag
from posts as p
cross join lateral unnest(p.tags) as tag
order by p.id, tag;
```

Для поиска по массивам можно создать GIN-индекс:

```sql
create index posts_tags_gin_idx
on posts using gin (tags);
```

Массив удобен для небольшого атомарного списка, который обычно читается и изменяется вместе с владельцем. Если элементы имеют собственные атрибуты, ссылки, права, часто обновляются отдельно или требуют строгой уникальности между строками, нормализованная дочерняя таблица обычно проще. Размерность массива в объявлении вроде `integer[3]` не обеспечивает фиксированную длину без отдельного `check`.

#### Перечисления enum

Enum задаёт закрытый упорядоченный набор строковых меток. Столбец такого типа принимает только объявленные значения; регистр имеет значение.

```sql
create type request_state as enum (
    'created',
    'approved',
    'finished'
);

create table requests (
    id bigint generated always as identity primary key,
    title text not null,
    status request_state not null default 'created'
);

insert into requests (title, status)
values ('Request 1', 'created');

update requests
set status = 'approved'
where id = 1;
```

![Перечисления в PostgreSQL](https://metanit.com/sql/postgresql/pics/4.4.png)

Новую метку можно добавить и при необходимости расположить относительно существующей:

```sql
alter type request_state
add value 'blocked' after 'approved';
```

Переименовать метку можно через `alter type ... rename value`. Удаление или произвольное переупорядочивание меток не является простым изменением: обычно создают новый тип, преобразуют столбцы и удаляют старый тип после проверки зависимостей.

```sql
create type request_state_v2 as enum (
    'created',
    'approved',
    'done'
);

alter table requests
alter column status drop default;

alter table requests
alter column status type request_state_v2
using status::text::request_state_v2;

alter table requests
alter column status set default 'created';

drop type request_state;
```

Преимущество enum — строгая доменная проверка в самой БД. Цена — более тяжёлые миграции и связь всех использующих столбцов с одним типом. Для часто меняющегося справочника с дополнительными атрибутами лучше отдельная таблица и внешний ключ; для простого ограничения иногда достаточно `text` с `check`.

### Глава 6. Соединение таблиц

Примеры используют определённые выше таблицы покупателей, товаров и заказов. В реальной схеме таблицы связываются внешними ключами; псевдонимы делают запросы короче и снимают неоднозначность одинаковых имён столбцов.

#### Неявное соединение таблиц

Исторический синтаксис перечисляет таблицы через запятую. Без условия он создаёт декартово произведение: каждая строка первой таблицы соединяется с каждой строкой второй.

```sql
select o.id as order_id, c.id as customer_id
from orders as o, customers as c;
```

![Неявное соединение без условия в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.1.png)

Условие в `where` превращает произведение в эквисоединение:

```sql
select o.id, o.created_at, c.first_name
from orders as o, customers as c
where o.customer_id = c.id
order by o.id;
```

![Неявное соединение таблиц с условием](https://metanit.com/sql/postgresql/pics/8.2.png)

Для трёх таблиц понадобятся две связи:

```sql
select c.first_name, p.product_name, o.created_at
from orders as o, customers as c, products as p
where o.customer_id = c.id
  and o.product_id = p.id
order by o.id;
```

![Неявное соединение трёх таблиц](https://metanit.com/sql/postgresql/pics/8.3.png)

Этот синтаксис полезно уметь читать, но в новом коде используйте явный `join ... on`: он отделяет условия связи от фильтров и снижает риск забыть одно условие. Если декартово произведение действительно нужно, намерение лучше выразить через `cross join`.

#### INNER JOIN

`join` и `inner join` эквивалентны. В результат попадают только пары строк, удовлетворяющие условию `on`.

```sql
select o.created_at, o.product_count, p.product_name
from orders as o
join products as p on p.id = o.product_id
order by o.id;
```

![JOIN ON в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.4.png)

Соединения можно строить цепочкой:

```sql
select o.created_at, c.first_name, p.product_name
from orders as o
join products as p on p.id = o.product_id
join customers as c on c.id = o.customer_id
order by o.created_at, o.id;
```

![Соединение нескольких таблиц в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.5.png)

Условие связи обычно находится в `on`, а фильтр итоговых строк — в `where`. Для `inner join` планировщик часто может перенести равносильный предикат, но такое разделение лучше показывает намерение:

```sql
select o.created_at, c.first_name, p.product_name
from orders as o
join products as p on p.id = o.product_id
join customers as c on c.id = o.customer_id
where p.price > 45000
order by c.first_name, o.id;
```

Если обе стороны связи не уникальны по ключу соединения, строки могут размножаться. Это нормальная семантика соединения; прежде чем добавлять `distinct`, проверьте кардинальность и ключи.

#### OUTER JOIN и CROSS JOIN

Внешнее соединение сохраняет несовпавшие строки: `left join` — из левой таблицы, `right join` — из правой, `full join` — из обеих. Недостающие столбцы другой стороны получают `null`. Слово `outer` необязательно.

```sql
select c.id, c.first_name, o.id as order_id, o.created_at
from customers as c
left join orders as o on o.customer_id = c.id
order by c.id, o.id;
```

![Левое внешнее соединение в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.6.png)

`inner join` исключит покупателя без заказов, а `left join` сохранит его:

```sql
select c.id, c.first_name, o.id as order_id
from customers as c
join orders as o on o.customer_id = c.id
order by c.id, o.id;

select c.id, c.first_name, o.id as order_id
from customers as c
left join orders as o on o.customer_id = c.id
order by c.id, o.id;
```

![Сравнение INNER JOIN и LEFT JOIN](https://metanit.com/sql/postgresql/pics/8.7.png)

`right join` логически симметричен `left join`; на практике запрос часто легче читать, если поменять таблицы местами и использовать `left join`.

```sql
select c.first_name, o.created_at, o.product_count
from orders as o
right join customers as c on o.customer_id = c.id
order by c.id, o.id;
```

![Правое внешнее соединение в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.8.png)

`full join` сохраняет несовпавшие строки обеих сторон:

```sql
select c.id as customer_id, o.id as order_id
from customers as c
full join orders as o on o.customer_id = c.id
order by customer_id nulls last, order_id nulls last;
```

Можно соединять несколько таблиц:

```sql
select c.first_name, o.created_at, p.product_name, p.company
from orders as o
left join customers as c on c.id = o.customer_id
left join products as p on p.id = o.product_id
order by o.id;
```

![Цепочка LEFT JOIN в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.9.png)

Размещение фильтра критично для внешнего соединения. Предикат правой таблицы в `where` удаляет строки с `null` и фактически превращает соответствующую часть `left join` во внутреннюю. Если нужно сохранить все строки слева и присоединить только подходящие строки справа, условие размещают в `on`:

```sql
select c.id, c.first_name, o.id as order_id
from customers as c
left join orders as o
    on o.customer_id = c.id
   and o.price > 55000
order by c.id, o.id;
```

![LEFT JOIN с фильтрацией и сортировкой](https://metanit.com/sql/postgresql/pics/8.10.png)

Покупателей без заказов можно найти антисоединением. Проверять лучше ненулевой ключ правой таблицы:

```sql
select c.id, c.first_name
from customers as c
left join orders as o on o.customer_id = c.id
where o.id is null
order by c.id;
```

Часто ещё яснее эквивалентный `not exists`.

`cross join` явно создаёт декартово произведение и не принимает `on`:

```sql
select o.id as order_id, c.id as customer_id
from orders as o
cross join customers as c
order by o.id, c.id;
```

![CROSS JOIN в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.11.png)

Он полезен для генерации всех комбинаций, календарных сеток и параметров, но результат имеет произведение размеров входов и может быстро стать огромным. `full join` нужен, когда требуется сохранить несовпавшие строки обеих сторон; для заполнения общего ключа в таком результате часто применяют `coalesce(left_id, right_id)`.

#### Группировка в соединениях

Соединение сначала формирует набор строк, затем `group by` агрегирует его. Внутреннее соединение показывает только покупателей с заказами:

```sql
select c.id, c.first_name, count(o.id) as order_count
from customers as c
join orders as o on o.customer_id = c.id
group by c.id, c.first_name
order by c.id;
```

![Группировка в INNER JOIN](https://metanit.com/sql/postgresql/pics/8.12.png)

Левое соединение сохраняет покупателей без заказов. Здесь важно считать `o.id`, а не `*`: для покупателя без заказов соединение всё равно создаёт одну строку, но `o.id` в ней равен `null`, поэтому `count(o.id)` даст `0`.

```sql
select c.id, c.first_name, count(o.id) as order_count
from customers as c
left join orders as o on o.customer_id = c.id
group by c.id, c.first_name
order by c.id;
```

![Группировка в LEFT JOIN](https://metanit.com/sql/postgresql/pics/8.13.png)

Сумма по отсутствующим строкам равна `null`, поэтому для нуля применяют `coalesce`:

```sql
select
    p.id,
    p.product_name,
    p.company,
    coalesce(sum(o.product_count * o.price), 0) as order_total
from products as p
left join orders as o on o.product_id = p.id
group by p.id, p.product_name, p.company
order by p.id;
```

![GROUP BY и JOIN в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.14.png)

Если нужно агрегировать несколько независимых связей «один ко многим», прямое соединение обеих дочерних таблиц способно перемножить строки и завысить суммы. В таком случае сначала агрегируйте каждую дочернюю таблицу отдельно, затем присоединяйте готовые итоги.

#### Объединение множеств. UNION

`union` располагает результаты запросов друг под другом, а не рядом, как `join`. Все ветви должны возвращать одинаковое число столбцов с совместимыми типами. Имена результата берутся из первой ветви.

Для примеров операций над множествами создадим отдельные таблицы клиентов и сотрудников банка:

```sql
create table bank_customers (
    id bigint generated always as identity primary key,
    first_name text not null,
    last_name text not null,
    account_sum numeric(12, 2) not null default 0
);

create table employees (
    id bigint generated always as identity primary key,
    first_name text not null,
    last_name text not null
);

insert into bank_customers (first_name, last_name, account_sum)
values
    ('Tom', 'Smith', 2000),
    ('Sam', 'Brown', 3000),
    ('Paul', 'Ins', 4200),
    ('Mark', 'Adams', 2500);

insert into employees (first_name, last_name)
values
    ('Homer', 'Simpson'),
    ('Tom', 'Smith'),
    ('Mark', 'Adams'),
    ('Nick', 'Svensson');
```

```sql
select first_name, last_name
from bank_customers
union
select first_name, last_name
from employees
order by first_name, last_name;
```

![Объединение выборок оператором UNION](https://metanit.com/sql/postgresql/pics/8.15.png)

`union` удаляет дубли, что требует дополнительной работы. `union all` сохраняет их и обычно быстрее; используйте его по умолчанию, если дедупликация не является частью требования.

```sql
select first_name, last_name
from bank_customers
union all
select first_name, last_name
from employees
order by first_name, last_name;
```

![Оператор UNION ALL в PostgreSQL](https://metanit.com/sql/postgresql/pics/8.17.png)

Общий `order by` пишется после последней ветви и обращается к именам или номерам столбцов итогового набора:

```sql
select first_name || ' ' || last_name as full_name
from bank_customers
union
select first_name || ' ' || last_name as full_name
from employees
order by full_name;
```

![Сортировка результата UNION](https://metanit.com/sql/postgresql/pics/8.16.png)

Ветви могут читать одну таблицу, но взаимоисключающие условия часто проще выразить одним `case`:

```sql
select
    first_name,
    last_name,
    case
        when account_sum < 3000 then account_sum * 1.1
        else account_sum * 1.3
    end as total_sum
from bank_customers
order by first_name, last_name;
```

![Объединение выборок одной таблицы](https://metanit.com/sql/postgresql/pics/8.18.png)

Если типы неоднозначны, приводите их явно. `limit` или локальная сортировка отдельной ветви требуют скобок; итоговый порядок всё равно задаётся внешним `order by`.

#### Разность множеств. EXCEPT

`except` возвращает строки первой выборки, которых нет во второй, и удаляет дубли. Число столбцов и их типы должны быть совместимы, как у `union`.

```sql
select first_name, last_name
from bank_customers
except
select first_name, last_name
from employees
order by first_name, last_name;
```

![Разность множеств через EXCEPT](https://metanit.com/sql/postgresql/pics/8.19.png)

Порядок операндов важен:

```sql
select first_name, last_name
from employees
except
select first_name, last_name
from bank_customers
order by first_name, last_name;
```

![Обратная разность множеств через EXCEPT](https://metanit.com/sql/postgresql/pics/8.20.png)

`except all` учитывает кратность: если строка встречается слева `m` раз, а справа `n` раз, результат содержит `max(m - n, 0)` копий. Обычный `except` возвращает каждую оставшуюся строку один раз.

```sql
select value
from (values (1), (1), (2)) as left_values (value)
except all
select value
from (values (1)) as right_values (value);
```

Для антисоединения таблиц по ключу часто понятнее `not exists`, особенно если нужно вернуть дополнительные столбцы левой таблицы. В отличие от `not in`, `except` имеет собственную семантику множеств и сопоставляет `null` при дедупликации как одинаковые значения.

#### Пересечение множеств. INTERSECT

`intersect` возвращает строки, присутствующие в обеих выборках, и удаляет дубли.

```sql
select first_name, last_name
from employees
intersect
select first_name, last_name
from bank_customers
order by first_name, last_name;
```

![Пересечение множеств через INTERSECT](https://metanit.com/sql/postgresql/pics/8.21.png)

`intersect all` сохраняет минимальную кратность строки в двух наборах: `min(m, n)` копий. Как и другие операции над множествами, он требует одинакового количества совместимых по типу столбцов.

```sql
select value
from (values (1), (1), (2)) as first_values (value)
intersect all
select value
from (values (1), (1), (1), (3)) as second_values (value);
```

У `intersect` приоритет выше, чем у `union` и `except`. В сложной цепочке используйте скобки, чтобы порядок вычисления был очевиден. Финальный `order by` относится ко всему составному запросу.

---
### Дополнение 1. Индексы, статистика и планы запросов

#### Индексы и их цена

Индекс — отдельная структура данных, которая ускоряет подходящие условия поиска, соединения и сортировку, но не делает таблицу «быстрой вообще». PostgreSQL 18.6 по умолчанию создаёт B-tree: он подходит для равенства, диапазонов, `order by` и проверки уникальности. Первичный ключ и ограничения `unique` уже создают уникальные индексы, а внешний ключ на дочерней таблице — нет; индекс на его столбцах часто нужен для соединений и для быстрых `update`/`delete` родительской строки.

Каждый индекс занимает место, вытесняет данные из кэша и удорожает `insert`, `update`, `delete`, `vacuum`, резервное копирование и репликацию. Индекс добавляют под измеренный запрос, а не под каждый столбец. На загруженной production-таблице обычно рассматривают `create index concurrently`: он меньше мешает записи, но работает дольше, выполняет больше работы и не допускается внутри блока транзакции.

```sql
create table app.orders (
    order_id bigint generated always as identity primary key,
    customer_id bigint not null references app.customers (customer_id),
    created_at timestamptz not null default now()
);

create index idx_orders_customer_id
    on app.orders (customer_id);
```

#### Составные, частичные и покрывающие индексы

В составном B-tree порядок столбцов важен: равенства по левым столбцам и затем условие диапазона обычно сильнее всего сужают сканирование. Частичный индекс хранит только строки, удовлетворяющие предикату; планировщик применит его, только если сможет доказать, что условие запроса подразумевает этот предикат. Индекс выражения полезен, когда запрос использует ровно такое выражение, например `lower(email)`.

`include` добавляет неключевые значения в листья индекса и иногда позволяет index-only scan. Эти столбцы не участвуют в поиске и уникальности, зато увеличивают индекс; широкие или часто изменяемые поля следует включать осторожно. Один индекс под реальный шаблон запроса обычно лучше нескольких почти одинаковых.

```sql
create index idx_orders_customer_created_paid
    on app.orders (customer_id, created_at desc)
    include (total_amount)
    where status = 'paid';

create unique index idx_users_email_normalized
    on app.users (lower(email));
```

#### GIN, GiST, BRIN и специализированные индексы

Помимо B-tree PostgreSQL предоставляет hash, GiST, SP-GiST, GIN и BRIN. Hash обслуживает равенство, но B-tree часто универсальнее. GIN — инвертированный индекс для массивов, `jsonb` и полнотекстового поиска; он хорошо читает составные значения, но может быть дорогим при записи. GiST — каркас для диапазонов, геометрии, пересечений и поиска ближайших значений, а SP-GiST полезен для естественно разбиваемых пространств вроде префиксов и точек.

BRIN хранит сводки по диапазонам физических блоков. Он очень мал и особенно полезен на огромных таблицах, где значение коррелирует с порядком строк, например время в append-only журнале, но возвращает кандидатов с последующей перепроверкой. Тип индекса выбирают по операторам запроса и доступному operator class, а результат подтверждают планом и нагрузочным измерением.

```sql
create index idx_articles_tags_gin
    on app.articles using gin (tags);

create index idx_bookings_period_gist
    on app.bookings using gist (booked_during);

create index idx_events_created_brin
    on app.events using brin (created_at)
    with (pages_per_range = 128);
```

#### EXPLAIN, ANALYZE и статистика

`explain` показывает предполагаемый план, а `explain analyze` действительно выполняет запрос и дополняет план фактическими строками и временем. Сравнивайте прежде всего оценённое и фактическое число строк: большой разрыв часто указывает на устаревшую статистику, зависимые столбцы или неудачный предикат. `buffers` показывает обращения к буферам, но один запуск не заменяет измерения на репрезентативных данных с учётом прогретого и холодного кэша.

`analyze` собирает статистику, обычно этим занимается autovacuum. После большой загрузки данных ручной `analyze` может помочь раньше. Важно: `explain analyze` для `insert`, `update`, `delete` и `merge` выполняет изменения. Транзакция с `rollback` отменит обычные изменения БД, но всё равно выполнит триггеры и функции; внешние побочные эффекты могут оказаться необратимыми.

```sql
analyze app.orders;

explain (analyze, buffers, settings)
select order_id, total_amount
from app.orders
where customer_id = 42
  and status = 'paid'
order by created_at desc
limit 20;

begin;
explain (analyze, buffers, wal)
update app.orders
set status = 'archived'
where created_at < current_date - interval '1 year';
rollback;
```

### Дополнение 2. Транзакции, MVCC и конкурентный доступ

#### Транзакции и точки сохранения

Без явного `begin` каждый SQL-оператор выполняется в собственной неявной транзакции. Явная транзакция объединяет связанные изменения по принципу «всё или ничего». Точка сохранения позволяет отменить только часть работы; это особенно полезно, потому что после ошибки PostgreSQL считает транзакцию прерванной до `rollback` или `rollback to savepoint`.

Последовательности стоят отдельно от обычного отката: значение, выданное `nextval`, не возвращается при `rollback`, поэтому у `identity` допустимы пропуски. Они обеспечивают уникальные номера, но не непрерывную юридическую нумерацию.

```sql
begin;

update app.orders
set status = 'processing'
where order_id = 10;

savepoint before_optional_note;

insert into app.order_notes (order_id, note)
values (10, 'started by worker');

rollback to savepoint before_optional_note;
commit;
```

#### Уровни изоляции и повтор операций

В PostgreSQL `read uncommitted` ведёт себя как `read committed`. При `read committed` каждый оператор получает новый снимок на начало оператора; два `select` в одной транзакции могут увидеть разные зафиксированные данные. `repeatable read` использует один снимок на транзакцию и в PostgreSQL не допускает фантомных чтений, но конфликтующие изменения могут закончиться ошибкой сериализации. `serializable` добавляет Serializable Snapshot Isolation и гарантирует результат, эквивалентный некоторому последовательному выполнению, ценой возможного отката.

Приложение должно повторять целую транзакцию при SQLSTATE `40001` (`serialization_failure`) и обычно при `40P01` (`deadlock_detected`): заново читать данные и повторять бизнес-решение, а не только последний запрос. Число попыток ограничивают, между ними используют экспоненциальную задержку со случайным разбросом, а необратимые внешние эффекты выносят за повторяемую секцию или защищают идемпотентностью.

```sql
begin transaction isolation level serializable;

select balance
from app.accounts
where account_id = 10;

update app.accounts
set balance = balance - 100
where account_id = 10;

commit;
```

#### MVCC, VACUUM и ANALYZE

MVCC даёт запросу снимок видимых версий строк: обычное чтение не блокирует обычную запись, а запись не блокирует обычное чтение. `update` и `delete` оставляют старые версии, пока они потенциально видимы активным транзакциям. Такие dead tuples занимают место; долгие транзакции и забытые idle-in-transaction сессии удерживают старые снимки и мешают очистке.

Autovacuum освобождает версии для повторного использования, поддерживает visibility map и предотвращает переполнение идентификаторов транзакций; `analyze` обновляет статистику планировщика. Его обычно настраивают для особенно активно изменяемых таблиц, а не отключают. Обычный `vacuum` работает параллельно с большинством операций, тогда как `vacuum full` переписывает таблицу и требует сильной блокировки.

```sql
select relname, n_live_tup, n_dead_tup, last_autovacuum, last_autoanalyze
from pg_stat_user_tables
order by n_dead_tup desc;

vacuum (analyze, verbose) app.orders;
```

#### Блокировки строк и очереди

`select ... for update` блокирует выбранные строки для конкурирующих изменений, а `for no key update` — более слабый режим, подходящий, когда ключевые значения не меняются. `nowait` сразу возвращает ошибку вместо ожидания. Захватывайте строки в устойчивом порядке и держите транзакции короткими, чтобы уменьшить ожидания и вероятность взаимной блокировки.

`skip locked` пропускает уже захваченные строки и потому даёт несогласованный срез. Это плохой выбор для обычных пользовательских выборок, но полезный шаблон для нескольких обработчиков очереди. Блокировка живёт до завершения транзакции, поэтому получение задания и перевод его в состояние обработки должны быть одной короткой транзакцией.

```sql
begin;

with next_job as (
    select job_id
    from app.jobs
    where status = 'ready'
    order by job_id
    for update skip locked
    limit 1
)
update app.jobs as job
set status = 'running', started_at = clock_timestamp()
from next_job
where job.job_id = next_job.job_id
returning job.*;

commit;

select account_id
from app.accounts
where account_id = 10
for update nowait;
```

### Дополнение 3. Роли, права и безопасное подключение

#### Роли и принцип наименьших привилегий

Роль приложения не должна быть superuser, владельцем таблиц или создателем ролей и баз. Практичная схема разделяет владельца объектов без права входа, роль миграций, runtime-роль сервиса и групповую роль только для чтения. Миграции временно делают `set role app_owner`, runtime получает лишь необходимые DML-права, а человеку или отчётному сервису назначают членство в `app_readonly`.

Пароли и сертификаты не записывают в SQL-файлы, командную строку или репозиторий. Их передаёт доверенное хранилище через механизм драйвера или защищённый файл с корректными правами.

Следующий блок — самостоятельный фрагмент целевой конфигурации. Он предполагает, что `app_db` и схема `app` уже существуют; если настройка из главы 1 уже выполнена, `create role` повторно не запускают: роли уже соответствуют этой модели.

```sql
create role app_owner nologin;
create role app_migrator login noinherit nosuperuser nocreatedb nocreaterole;
create role app_runtime login noinherit nosuperuser nocreatedb nocreaterole noreplication;
create role app_readonly nologin;

grant app_owner to app_migrator;
alter database app_db owner to app_owner;
alter schema app owner to app_owner;
```

#### GRANT, REVOKE и права по умолчанию

Проверяйте права на каждом уровне: подключение к базе, `usage` на схему, операции над таблицами, последовательностями и функциями. Права владельца нельзя ограничить обычным `revoke`, поэтому runtime не должен владеть объектами. После отзыва стандартных прав у `public` выдавайте только необходимое; владельцу схемы отдельно остаётся право создавать объекты.

`alter default privileges` действует только на будущие объекты и только для указанной роли-создателя. Если миграции не делают `set role app_owner`, настроенные для `app_owner` значения не сработают. Существующие объекты требуют отдельного `grant` или `revoke`.

```sql
revoke all on database app_db from public;
revoke create on schema public from public;

grant connect on database app_db to app_runtime, app_readonly;
grant usage on schema app to app_runtime, app_readonly;
grant select, insert, update, delete on all tables in schema app to app_runtime;
grant select on all tables in schema app to app_readonly;
grant usage, select on all sequences in schema app to app_runtime;

alter default privileges for role app_owner in schema app
    grant select, insert, update, delete on tables to app_runtime;
alter default privileges for role app_owner in schema app
    grant select on tables to app_readonly;
alter default privileges for role app_owner in schema app
    grant usage, select on sequences to app_runtime;
alter default privileges for role app_owner
    revoke execute on functions from public;
alter default privileges for role app_owner in schema app
    grant execute on functions to app_runtime;
```

#### pg_hba.conf, SCRAM и TLS

`pg_hba.conf` проверяется сверху вниз: применяется первая строка, совпавшая по типу соединения, базе, роли и адресу; при неудачной аутентификации поиск следующей строки не продолжается. Поэтому правила делают узкими и располагают от наиболее конкретных к более общим; если совпадения нет, подключение отклоняется. Не используйте `trust` для сетевого доступа и не открывайте рабочую базу всему `0.0.0.0/0`; `listen_addresses`, firewall и HBA решают разные части задачи.

Для парольной аутентификации используйте `scram-sha-256`; изменение `password_encryption` не преобразует старые пароли, их нужно безопасно заменить. Для сетевого подключения сервер включает TLS и `hostssl`, а клиент использует `sslmode=verify-full` с доверенным корневым сертификатом: проверяются и цепочка сертификатов, и имя сервера. При поддержке инфраструктурой полезно требовать SCRAM channel binding.

```conf
hostssl app_db app_runtime 10.20.0.0/24 scram-sha-256
hostssl app_db app_readonly 10.20.1.0/24 scram-sha-256
```

```bash
psql "host=db.example.internal dbname=app_db user=app_runtime sslmode=verify-full sslrootcert=/etc/ssl/certs/company_ca.pem channel_binding=require"
```

#### Безопасность схем, search_path и RLS

Любая схема с правом `create`, попавшая в `search_path`, фактически считается доверенной: пользователь может создать одноимённую функцию, оператор или таблицу. У runtime отзывают создание объектов, критичные запросы квалифицируют именем схемы, а `security definer`-функции фиксируют безопасный `search_path` из доверенных схем с `pg_temp` в конце. Значения передают параметрами драйвера, а не конкатенацией SQL.

RLS ограничивает строки после обычных `grant`: без подходящей политики действует default deny. Владелец таблицы обычно обходит политики, superuser и роль с `bypassrls` обходят их всегда; при необходимости владельца проверяют через `force row level security`. Контекст арендатора должен задаваться проверенным кодом приложения локально для транзакции, а не приниматься на веру из произвольного пользовательского ввода.

```sql
alter role app_runtime in database app_db
    set search_path = pg_catalog, app;

create function app.account_balance(p_account_id bigint)
returns numeric
language sql
security definer
set search_path = pg_catalog, app, pg_temp
as $$
    select balance
    from app.accounts
    where account_id = p_account_id;
$$;

revoke all on function app.account_balance(bigint) from public;
grant execute on function app.account_balance(bigint) to app_runtime;

alter table app.orders enable row level security;

create policy orders_by_tenant on app.orders
using (tenant_id = current_setting('app.tenant_id', true)::uuid)
with check (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

### Дополнение 4. Резервное копирование и восстановление

#### Логические дампы pg_dump

`pg_dump` делает согласованный логический снимок одной базы без остановки сервера, но не сохраняет общие для кластера роли и tablespace. Plain-формат — читаемый SQL для `psql`. Custom (`-Fc`) и directory (`-Fd`) предназначены для `pg_restore`, позволяют выбирать объекты и менять порядок; directory поддерживает параллельный dump, а custom и directory — параллельное восстановление. Такие копии удобны для переноса между архитектурами и обычно на более новую версию PostgreSQL.

Проверяйте stderr и код завершения команды. Directory-цель не должна существовать до запуска, а параллельный dump создаёт несколько подключений и увеличивает нагрузку.

```bash
pg_dump --format=plain --file=/srv/backups/app_db.sql app_db
pg_dump --format=custom --file=/srv/backups/app_db.dump app_db
pg_dump --format=directory --jobs=4 --file=/srv/backups/app_db_dir app_db
```

#### Восстановление через psql и pg_restore

Plain SQL восстанавливают через `psql`, архивы — через `pg_restore`. Восстановление проверяют в заранее созданной чистой базе и останавливают при первой ошибке. `--clean` удаляет объекты в целевой базе, поэтому его применяют только к точно выбранной disposable-среде или по проверенному runbook.

Архив сначала можно просмотреть через `pg_restore --list`, восстановить выборочно и распараллелить. `--no-owner` полезен, когда исходных ролей нет, но после него нужно явно проверить нового владельца и права.

```bash
createdb app_restore
psql -X --set ON_ERROR_STOP=on --dbname=app_restore --file=/srv/backups/app_db.sql

pg_restore --list /srv/backups/app_db.dump
pg_restore --exit-on-error --no-owner --jobs=4 --dbname=app_restore /srv/backups/app_db.dump
```

#### Глобальные объекты, физические копии и PITR

Роли, tablespace и другие общие объекты сохраняют отдельно через `pg_dumpall --globals-only`; такой файл может содержать чувствительные хэши паролей и требует строгой защиты. Физическая копия охватывает кластер целиком и привязана к формату данных версии PostgreSQL. Нельзя просто копировать работающий `pgdata`: используйте согласованный snapshot при остановленном сервере либо `pg_basebackup` и документированный механизм PostgreSQL.

PITR требует базовой физической копии и непрерывной цепочки архивированных WAL до нужной точки. Одного `pg_dump` для PITR недостаточно. Настраивают `wal_level = replica` или выше, надёжное архивирование с контролем ошибок, `restore_command` и ровно одну цель восстановления; конкретную процедуру обязательно репетируют для своей платформы и версии.

```bash
pg_dumpall --globals-only --file=/srv/backups/globals.sql
pg_basebackup --pgdata=/srv/backups/base --format=plain --wal-method=stream
```

```conf
restore_command = 'cp /srv/wal_archive/%f %p'
recovery_target_time = '2026-08-23 10:15:00+03'
recovery_target_action = 'promote'
```

```bash
# Выполнять только на остановленной восстановленной копии;
# PGDATA должен указывать на её data_directory.
touch "$PGDATA/recovery.signal"
```

#### Проверка восстановления и политика хранения

Копия становится доказанным backup только после успешного тестового восстановления и проверки данных, ограничений, расширений, владельцев и прав. Дамп из недоверенного источника опасен: при восстановлении сервер может выполнить произвольный SQL, выбранный superuser исходной системы. Plain-файл анализируют как код, а архив сначала превращают в SQL через `pg_restore --file` и проверяют в изолированной среде с минимальными привилегиями.

Политика хранения исходит из RPO и RTO: задаёт частоту, срок жизни полных и инкрементальных копий, непрерывность WAL для всего окна PITR, шифрование, неизменяемую/offsite-копию и контролируемое удаление. Регулярная репетиция должна включать потерю основной площадки и доступность ключей расшифрования; результаты и фактическое время восстановления фиксируют.

```bash
shasum -a 256 /srv/backups/app_db.dump
pg_restore --file=/srv/backups/review.sql /srv/backups/app_db.dump

createdb app_restore_check
pg_restore --exit-on-error --no-owner --dbname=app_restore_check /srv/backups/app_db.dump
psql -X --dbname=app_restore_check --command='select count(*) from app.orders;'
```
