### 001 Основные концепции

![](_png/cdca731aaf95c835a9649e1f6ddf61f6.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image002.jpg)

Файл-серверные СУБД не могут предоставить высокую надёжность данных и доступность. Они позволяют разгрузить нагрузку на сервер с данными, но от него высока нагрузка на локальную сеть. Такие СУБД не способы справляться с большой нагрузкой

Клиент-серверные используются по концепции сервер-пльзователь. Сервер принимает всю нагрузку во время работы.

Встраиваемые СУБД обычно используются в мобильных приложениях в качестве системы поиска и хранения данных пользователя. Представляет собой библиотеку
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image004.jpg)
![](_png/1dadd7afa71270baf216b8f9ee2e9cf5.png)
![](_png/01b30da0d9f97cf09ebfa3e051610502.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image006.jpg)
![](_png/f99c416059b2b94b9128669b56de6aea.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image008.jpg)

011 -Northwind - https://1drv.ms/u/s!AqtQeAOHZEjQuqteZmactYPQo1--Gg?e=waXi8e

### 002 Реляционная модель и SQL

![](_png/f41efee72fee4e830d2974959aef843a.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image010.jpg)
![](_png/2a1b8c85362f3eb44f62157ca8fe86cf.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image012.jpg)
![](_png/da6bc258503a3ffff44fb1c9a8b49c39.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image014.jpg)

- SQL-запросы делятся на данные группы по своему назначению.

В каждой СУБД используется свой диалект SQL. Однако они все придерживаются стандарта ANSI-92. Так же разница присутствует и в процедурных расширениях

![](_png/14e29fa0b7f0cc9e4005c67eb85efe01.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image016.jpg)

### 003 Почему PostgreSQL
-
![](_png/ce61b98ada6dc4bf06dc8f13ff1a27ce.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image018.jpg)

### 005 Типы данных в PostgreSQL

![](_png/00a4532d7cb20ca88e9f9392807f3763.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image020.jpg)

- serial-значения будут инкрементироваться автоматически в БД и их изменять не надо. Это, грубо говоря, индексы. Они начинаются в БД с 1

Char представляет из себя фиксированное значение. Например, если мы уже знаем какой длинны будет строка, то чар выделит только нужное количество памяти. Если ввести строку меньшего размера, то она добьётся пробелами. Varchar не добивает строку пробелами. Text поддерживает любой размер строки (в прошлые типы данных в n подставляется длина строки)

![](_png/da7c208cee60b1f4a9dc18502a8a20a5.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image022.jpg)
![](_png/a2efe5dc85052d7ec12a105db4ed09fe.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image024.jpg)
![](_png/755abe4e9ba6900eaecbc58de808bc0b.png)

![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image026.jpg)
### 006 Создание БД

![](_png/01023ff7482c8ad66a99ce4294615e18.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image027.png)
![](_png/ea06bb0e68b66765eb71fa84f7007f6b.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image029.jpg)

- Далее пойдёт речь про удаление БД.

Удалять БД можно только если к ней нет никаких подключений. Если они есть, то их придётся удалять.

Чтобы удалить БД, нужно встать на другую БД и через неё произвести удаление нужной нам БД

На рисунке отцепление БД:

![](_png/7d10525da439552ccb48b9bf1e1bf9ec.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image031.jpg)

Такой код позволяет удалить БД

![](_png/46d278c104fcdf0a1c2feee7442cfbeb.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image033.jpg)

Создание БД тоже производится через другую БД

![](_png/d952ef15b8b58d5d6e686b31352601ca.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image035.jpg)

### 007 Создание таблиц

- И вот примерно так выглядит синтаксис создания таблиц.

Мы так же открываем редактор нужной нам БД. Первая строка отвечает за создание самой таблицы. В следующих строках у нас идут инструкции внутри «()», которые ограничиваются запятой. Внутри инструкции мы прописываем наименование столбца, далее тип принимаемого в него значения и определённый модификатор.

Primary Key говорит нам, что данный столбец будет ключевым и будет содержать число строки.

NOT NULL запрещает помещать отсутствующее значение в строку.

Чтобы написать второй блок инструкций, нам нужно отделить блоки кода «;»

![](_png/4ac106a8aa3e22d3b6c6fd2fe12737a2.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image037.jpg)

Таким способом мы можем удалять ненужные таблицы

```SQL
DROP TABLE Pusblisher;
DROP TABLE Books;
```
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image038.png)

Так же мы можем создавать таблицы посредством инструментария самой СУБД

![](_png/d0e90935a6e10de6ad005aa1d17ddee1.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image040.jpg)

Для начала задём имя

![](_png/0a83fbeb10f187cc6d8bd85f443f1fae.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image042.jpg)

Потом создаём столбцы

![](_png/cdf3aa8a475016e735ad026c85af1ecf.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image044.jpg)

И в констрэинтах создаём имя для праймари кея. Дело в том, что по соглашениям наименование ПК должно начинаться на «pk_»

![](_png/34abf0232d29354fdc5660ae7ce41b85.png)
![](file:///C:/Users/836D~1/AppData/Local/Temp/msohtmlclip1/01/clip_image046.jpg)

### 008 Отношение 'один ко многим'

С помощью синтаксиса `INSERT INTO таблица VALUES(значения_1),(значения_2);` мы можем добавить нужные нам значения в поля таблицы

```SQL
INSERT INTO books
VALUES
(1, 'The diary of a yong girl', '12931293'),
(2, 'Lord of the rings', '12314245');
```

Чтобы заэкранировать кавычку в слове, нужно её написать дважды

```SQL
INSERT INTO publisher 
VALUES
(1, 'Evryman''s library', 'NY'); // экранирование
```

Через команду SELECT мы можем вывести нужные нам данные по определённому запросу

![](_png/3a7ecb1fbe91a769b5e9a2e0d042cd70.png)

Конкретно в нашем примере мы имеем две сущности - издатель и книга. Нам нужно показать, что один издатель может выпустить несколько книг. 
Тут показан пример связи один ко многим

![](_png/2ab6a6160ef5c662e2fcea8aac11d9b1.png)

Уже таким способом мы можем попробовать добавить зависимость в таблицу книг (через создание внешнего ключа, который будет зависимостью от паблишера)

```SQL
ALTER TABLE books
ADD COLUMN fk_publisher_id;

ALTER TABLE books 
ADD CONSTRAINT fk_book_publisher 
FOREIGN KEY(fk_publisher_id) REFERENCES publisher(publisher_id);
```

Или же мы можем добавлять зависимости при создании таблицы
Так же когда мы создаём колонку ==(при создании таблицы)== с внешним ключом, нам не нужно указывать, что это внешний ключ (`FOREIGN KEY`). Нам просто нужно указать `REFERENCES` ==(на что ссылается)==

```SQL
CREATE TABLE book (
	book_id integer PRIMARY KEY,
	title text NOT NULL,
	isbn varchar(32) NOT NULL,
	fk_publisher_id integer REFERENCES publisher(publisher_id) NOT NULL
);
```

Что нам даёт такая реализация связей?
Например, нам нужно найти книги, которые выпустило издательство Oxford University Press. Мы просто смотрим на таблицу с id нашего издателя и по этому id ищем записи в таблице
Конкретно тут под `один ко многим` имеется ввиду, что одно издательство может опубликовать несколько книг 

### 009 Отношение 'один к одному'

Пример отношений один к одному:

![](_png/f547c31062289cec9e7cb1d62b499810.png)

Конкретно тут мы создали условия, когда один паспорт связан с одним человеком

Создали таблицы с персонами и паспортами
```SQL
CREATE TABLE person 
(
	person_id int PRIMARY KEY,
	first_name varchar(64) NOT NULL,
	last_name varchar(64) NOT NULL
);

CREATE TABLE passport 
(
	passport_id int PRIMARY KEY,
	serial_number int NOT NULL,
	fk_passport_person int REFERENCES person(person_id)
);
```
Добавили забытый столбец с регистрацией в паспорте
```SQL
ALTER TABLE passport 
ADD COLUMN registration text NOT NULL
```
Добавили значение персоны
```SQL
INSERT INTO person VALUES  (1, 'John', 'Snow');
```
Добавили паспорт
```SQL
INSERT INTO passport VALUES (1, 123421, 1, 'WFell')
```

### 010 Отношение 'многие ко многим'

Конкретно тут нам представлена область отношений авторов к их книгам: 
1) Мы можем попробовать найти все книги за авторством кого-то
2) Мы можем найти все книги, за авторством которой стояли определённые люди

![](_png/19babcb0be0830cacd951be020d46db3.png)

Отношения многие ко многим всегда моделируется с помощью третьей таблицы, которая их связывает. Простым `FOREIGN KEY` тут не получится обойтись

![](_png/b0778c2336a8a6cf447b5ba95cfab312.png)

В SQL есть условие `IF EXISTS`, которое позволяет запустить команду, если существует определённое значение.

```SQL
-- удалит таблицу book и author, если они существуют 
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS author;
```

Тут создаём таблицы книг и авторов

```SQL
CREATE TABLE book (
	book_id int PRIMARY KEY,
	title text NOT NULL,
	isbn text NOT NULL
);

CREATE TABLE author (
	author_id int PRIMARY KEY,
	full_name text NOT NULL,
	rating real
);
```

Тут уже связываем таблицы друг с другом. Через `CONSTRAINT` задаём ограничение в виде ==составного (composite) первичного ключа== 

```SQL
CREATE TABLE book_author (
	book_id int REFERENCES book(book_id),
	author_id int REFERENCES author(author_id),
	
	-- задаём ограничение/первичный ключ
	CONSTRAINT pk_book_author PRIMARY KEY (book_id, author_id) -- composite key
);
```