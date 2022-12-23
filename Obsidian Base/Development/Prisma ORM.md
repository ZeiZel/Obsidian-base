#ORM #Prisma 

## Решение проблем

###### Если редактор не видит обновлённые типы после generate

Если слово `data` подчёркнуто и не показываются новые типы, то нужно с *ctrl* тыкнуть по функции `create()`, чтобы редактор подгрузил типы и увидел обновления модели

![](_png/Pasted%20image%2020221223142845.png)

Так выглядит конечный файл

![](_png/Pasted%20image%2020221223142848.png)

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

Далее нам нужно инициализировать миграцию. Миграция - это процесс подключения к базе и создания в ней статичной модели (создание таблиц и связей между ними), которую мы описали в призме. Этот процесс обязателен после добавления новых моделей.

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

###### Атрибуты полей
Если установить для поля атрибут `@unique`, то это поле будет всегда уникальным

Если для поля `updatedAt` установить атрибут `@updatedAt`, то значение всегда будет всегда равно своему значению

Атрибут `@default()` всегда устанавливает значение по умолчанию. Конкретно если написать  `@default(now())` для `createdAt`, то для этого поля всегда будет устанавливаться значение времени на сейчас

###### Атрибуты блока
Записываются они через `@@` и пишутся в самом конце. 
Конкретно в приведённом ниже примере мы указали, что не может быть двоих пользователей с одинаковым возрастом и именем через `@@unique([])`. Так же через атрибут `@@index` мы добавляем таблицу с индексом для электронной почты

```TS
model User {
  id              String           @id @default(uuid())
  name            String
  age             Int
  email           String?
  isAdmin         Boolean
  writtenPosts    Post[]           @relation("WrittenPosts")
  favouritePosts  Post[]           @relation("FavoritePosts")
  UserPreferences UserPreferences?

  @@unique([age, name])
  @@index([email])
}
```

Так же мы можем сделать составной идентификатор для таблицы вместо использования `id`. Конкретно тут будет создана новая таблица, в которой будет реализован составной идентификатор, указывающий на определённую запись в этой таблице постов 

```TS
model Post {
  // id             String     @id @default(uuid())
  title          String
  averageRating  Float
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  author         User       @relation("WrittenPosts", fields: [authorId], references: [id])
  authorId       String
  favouritedBy   User?      @relation("FavoritePosts", fields: [favouritedById], references: [id])
  favouritedById String?
  categories     Category[]

  @@id([title, authorId])
}
```

## Enums 

Объект `enum` представляет из себя статичный набор данных, которые мы можем положить в качестве значений в поле. То есть положить мы можем в поле только то, что указали в `enum`. Тип поля определяется как название `enum` и так же можно присвоить дефолтное значение из этого перечисления

```TS
model User {
  id              String           @id @default(uuid())
  name            String
  age             Int
  email           String?
  role            Role             @default(BASIC)
  writtenPosts    Post[]           @relation("WrittenPosts")
  favouritePosts  Post[]           @relation("FavoritePosts")
  UserPreferences UserPreferences?

  @@unique([age, name])
  @@index([email])
}

enum Role {
  BASIC
  ADMIN
}
```

## Client Create Operations 

Производим небольшие изменения в таблице, чтобы пользователь сам ссылался на свой настройки и чтобы в настройках хранилось только `id` пользователя

`prisma.scheme`
```TS
model User {
  id                String           @id @default(uuid())
  name              String
  age               Int
  email             String?
  role              Role             @default(BASIC)
  writtenPosts      Post[]           @relation("WrittenPosts")
  favouritePosts    Post[]           @relation("FavoritePosts")
  userPreferences   UserPreferences? @relation(fields: [userPreferencesId], references: [id])
  userPreferencesId String?          @unique

  @@unique([age, name])
  @@index([email])
}

model UserPreferences {
  id           String  @id @default(uuid())
  emailUpdates Boolean
  user         User?
}
```

Функция `deleteMany()` удаляет все записи из таблицы выделенной модели. 
Функция `create()` позволяет создать нам нового пользователя. Вложенное в неё свойство `create`, которое помещается внутри полей других таблиц, позволяет создать новую запись другой таблицы и связать их сразу. Свойство `include` позволяет вывести вместе с самим объектом, который мы выводим в консоль ещё и данные по связанным с ним объектам.

`script.ts`
```TS
// импортируем клиент призмы
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
	// очищаем базу данных
	prisma.user.deleteMany();

	// добавляем нового пользователя
	const user: User = await prisma.user.create({
		data: {
			age: 19,
			email: 'valera2003lvov@yandex.ru',
			name: 'Valery',
			role: 'ADMIN',
			// так же тут мы можем создать отсюда новый объект, связанный с основным
			userPreferences: {
				// через объект create
				create: {
					emailUpdates: true,
				},
			},
		},
		// включаем в вывод эти данные
		include: {
			userPreferences: true,
		},
	});

	console.log(user);
};

main()
	.catch((e) => console.error(e.message))
	.finally(async () => await prisma.$disconnect());
```

![](_png/Pasted%20image%2020221223175834.png)

Так же мы имеем свойство `select`, которое позволяет вывести отдельные части данных моделей. 
Можно пользоваться только `include` или `select` и только в функции `create()`

```TS
const main = async (): Promise<void> => {
	// очищаем базу данных
	prisma.user.deleteMany();

	// добавляем нового пользователя
	const userModel: User = await prisma.user.create({
		data: {
			age: 19,
			email: 'valera2003lvov@yandex.ru',
			name: 'Valery',
			role: 'ADMIN',
			// так же тут мы можем создать отсюда новый объект, связанный с основным
			userPreferences: {
				// через объект create
				create: {
					emailUpdates: true,
				},
			},
		},
		// включаем в вывод эти данные
		select: {
			name: true,
			userPreferences: {
				select: {
					id: true,
				},
			},
		},
	});

	console.log(userModel);
};
```

![](_png/Pasted%20image%2020221223180815.png)

Так же мы можем выводить дополнительные данные по производимым запросам в нашу базу

```TS
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query'] });
```

![](_png/Pasted%20image%2020221223181252.png)








## Client Read Operations









## Advanced Filtering 









## Relationship Filtering 









## Client Update Operations 









## Connect Existing Relationships 









## Client Delete Operations













