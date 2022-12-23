#ORM #Prisma 

## Project Setup 

Первым делом, нужно установить все нужные модули для нашего проекта

```bash
npm i -D typescript ts-node @types/node nodemon prisma 
```

Далее настраиваем конфиг ==ТСки==

`tsconfig.json`
```JSON
{
  "compilerOptions": {
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "lib": ["ESNext"],
    "esModuleInterop": true
  }
}
```


## Prisma Setup

Дальше нужно инициализировать призму в проекте, чтобы ей можно было начать пользоваться. 
`--datasource-provider` позволяет выбрать, к какой базе данных мы сейчас будем подключаться

```bash
npx prisma init --datasource-provider postgresql
```

После инициализации будут сгенерированы файлы схемы и `.env`

![](_png/Pasted%20image%2020221221190044.png)

Так же нужно установить плагин в наш редактор, который будет подсвечивать синтаксис и форматировать код призмы

![](_png/Pasted%20image%2020221221190022.png)

Так же в глобальных настройках VSCode можно добавить данную инструкцию, которая будет форматировать код призмы при сохранении

```JSON
"[prisma]": {
	"editor.defaultFormatter": "Prisma.prisma",
	"editor.formatOnSave": true
},
```

Первым делом, мы можем определить любой для нашего проекта генератор. Их можно найти на ==npm==. Генератор определяет как будет сгенерирован код ==SQL==

```JS
generator client {
  provider = "prisma-client-js"
  output   = "./generated/prisma-client-js"
}
```

В файле `.env` указываются глобальные переменные, к которым мы можем обращаться внутри проекта. Конкретно нам нужно указать ссылку для подключения к базе данных 

`postgres` - имя пользователя
`0000` - пароль от подключения к серверу (нужно вводить при каждом заходе в базу)
`@localhost:5432` - хост подключения
`/test` - имя базы

`.env`
```md
DATABASE_URL="postgresql://postgres:0000@localhost:5432/test"
```

![](_png/Pasted%20image%2020221221191644.png)

## Basic Prisma Model Setup 

Далее создадим базовую модель 

`id` - имя домена (столбца)
`Int` - тип домена
`@id` - его обозначение как айдишника
`@default` - присваиваем значение по умолчанию для данного типа
`autoincrement()` - автоинкрементирование значения под каждую новую запись 

`schema.prisma`
```js
model User {
  id Int @id @default(autoincrement())
}
```

## Prisma Migration Basics 

Далее нам нужно инициализировать миграцию. Миграция - это процесс подключения к базе и создания в ней статичной модели (создание таблиц и связей между ними), которую мы описали в призме

`migrate` - функция, которая осуществляет миграцию
`dev` - тут мы определяем, что миграция осуществляется в режиме разработчика
`--name` - этот флаг позволяет задать имя миграции
`init` - само наше заданное имя миграции

```bash
npx prisma migrate dev --name init 
```

После миграции у нас генерируется лог с именем и кодом `sql`, который написан на языке той базы, к которой мы подключились

![](_png/Pasted%20image%2020221221200218.png)

## Prisma Client Basics 

Функция `generate` генерирует типы и интерфейсы тех объектов, к которым мы будем обращаться из кода 

```bash
npx prisma generate
```

Тут мы инициализируем призму в проекте

`script.ts`
```TS
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

Конкретно сейчас мы сможем совершать действия над нашим сервером - например, подключиться к нему, отключиться, получить модель базы 

![](_png/Pasted%20image%2020221221200543.png)

И уже тут представлен код, где мы инициализируем призму, создаём нового пользователя внутри нашей сгенерированной модели, выводим все записи из определённой таблицы, а так же дисконнектимся от базы 

```TS
// импортируем клиент призмы
import { PrismaClient } from '@prisma/client';

// инициализируем инстанс призмы
const prisma = new PrismaClient();

// тут совершаем действия внутри призмы
const main = async () => {
	// создаём нового пользователя
	const user = await prisma.user.create({
		data: {
			name: 'Sally',
		},
	});

	// выведет всех пользователей системы
	const users = await prisma.user.findMany();

	console.log(user);
	console.log(users);
};

main()
	.catch((e) => console.error(e.message)) // при ошибке
	.finally(async () => await prisma.$disconnect()); // отключение от призмы
```

Каждый раз, если мы будем менять имя пользователя внутри `name: "имя"` у нас будет создаваться новый пользователь с инкрементированным идентификатором

![](_png/Pasted%20image%2020221222185731.png)

## Datasources and Generators 

`Datasources` - это источники наших данных. Первым делом указывается провайдер - база данных. Далее идёт ссылка на получение доступа к БД. Сама ссылка находится в глобальном environment пространстве, которая хранит эти глобальные переменные с данными 

```TS
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

`Generators` - генераторы определяют нашу генерацию кода. Их может быть несколько штук: отдельно для определённого поставщика и того же `GraphQL`

```TS
generator client {
  provider = "prisma-client-js"
}
```

## Model Fields 

Поля в моделях внутри призмы состоят из четырёх разных частей: 
- Имя поля, которое мы задаём своё
- Тип поля. Внутри него так же можно указать обязательность поля через `?` (обязательно ли поле для заполнения или нет)
- Атрибуты. Они уже начинаются с `@`

Мы имеем достаточное количество разных типов данных, чтобы описать нашу базу:
- `Int` - целое число
- `String` - строка
- `Boolean` - булевое значение
- `Float` - строка с плавающей точкой
- `Decimal` - более точное значение, чем `float`
- `BigInt` - большое целое число
- `Bytes` - очень маленькое значение 
- `DateTime` - дата
- `Json` - json-объект
- `Unsupported("")` - любой другой тип, который не поддерживается в призме. Может пригодиться, если мы добавляем существующую базу данных   
- Так же поддерживается тип данных, который представляет из себя другой объект базы данных

```TS
model User {
  id_user     Int             @id @default(autoincrement())
  name        String
  email       String?
  isAdmin     Boolean
  bidNumber   BigInt?
  preferences Json
  blob        Bytes
  unsupType   Unsupported("")
}

model Post {
  id_post     Int      @id
  rating1     Float
  rating2     Decimal
  createdAt   DateTime
  updatedAt   DateTime
}
```

## Model Relationships 

Модификаторы типов полей:
- `Тип?` - необязательное поле
- `Объект[]` - много объектов

Атрибут `uuid()` позволяет сгенерировать порядковый id для конкретного поля

1) **Отношения один ко многим**

Конкретно тут для создания связи пользователя и его постов используются поля `writtenPosts` и `favouritePosts`, которые имеют тип `Posts[]` - массив постов.
Чтобы связать пользователя и его посты, нужно создать поле для связи, в котором нужно указать поле кода внутри модели (`fields: [поле]`) и ссылку на поле в модели, с которой мы связываемся 
(`references:[внешнее_поле]`)

```TS
model User {
  id             String  @id @default(uuid())
  name           String
  email          String?
  isAdmin        Boolean
  writtenPosts   Post[]  @relation("WrittenPosts")
  favouritePosts Post[]  @relation("FavoritePosts")
}

model Post {
  id             String   @id @default(uuid())
  rating1        Float
  createdAt      DateTime
  updatedAt      DateTime
  author         User     @relation("WrittenPosts", fields: [authorId], references: [id])
  authorId       String
  favouritedBy   User?     @relation("FavoritePosts", fields: [favouritedById], references: [id])
  favouritedById String?
}
```

2) **Отношения многие ко многим**

Если нужно будет делать отношение многие ко многим, то нам не нужно будет выстраивать ссылки с отношениями. Тут мы просто указываем массив одних объектов, которые ссылаются на массив других объектов.
При реализации таких отношений создаётся отдельная таблица, которая связывает данные сущности.

```TS
model Post {
  id             String     @id @default(uuid())
  categories     Category[]
}

model Category {
  id    String @id @default(uuid())
  posts Post[]
}
```

3) **Отношения один к одному**

Далее вместо использования `json` для сохранения пользовательских настроек, сделаем отдельную таблицу, которая будет сохранять эти значения. 
Сделаем для настроек отдельную модель.
Теперь нам нужно для каждого пользователя связать его одни настройки.

При автоматическом создании наш `UserPreferences` будет иметь модификатор `[]` - его заменяем на `?`, чтобы связь осталась только `1 к 1`. Так же `userId` имеет атрибут `@unique`, так как одни настройки пользователя должны иметь ровно одного уникального пользователя 

```TS
model User {
  id              String           @id @default(uuid())
  name            String
  email           String?
  isAdmin         Boolean
  writtenPosts    Post[]           @relation("WrittenPosts")
  favouritePosts  Post[]           @relation("FavoritePosts")
  UserPreferences UserPreferences?
}

model UserPreferences {
  id           String  @id @default(uuid())
  emailUpdates Boolean
  user         User    @relation(fields: [userId], references: [id])
  userId       String  @unique
}
```

## Model Attributes 

26:19







## Enums 









## Client Create Operations 









## Client Read Operations









## Advanced Filtering 









## Relationship Filtering 









## Client Update Operations 









## Connect Existing Relationships 









## Client Delete Operations













