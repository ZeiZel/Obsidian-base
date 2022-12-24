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
	await prisma.user.deleteMany();

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
	await prisma.user.deleteMany();

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

Функция `createMany()` позволяет создать сразу несколько пользователей

```TS
const main = async () => {
	await prisma.user.deleteMany();

	const user = await prisma.user.createMany({
		data: [
			{
				age: 19,
				email: 'valera2003lvov@yandex.ru',
				name: 'Valery',
				role: 'ADMIN',
			},
			{
				age: 22,
				email: 'alaera@yandex.ru',
				name: 'Sal',
				role: 'BASIC',
			},
		],
	});

	console.log(user);
};
```

И тут нам выходит число созданных записей

![](_png/Pasted%20image%2020221223185311.png)

## Client Read Operations

Выполнение операций по поиску клиентов

`findQunique()` - выполняет поиск по базе данных на основе ключа

```TS
const main = async () => {
	// поиск одного пользователя
	const user = await prisma.user.findUnique({
		// поиск пользователя по заданным параметрам
		where: {
			email: 'alaera@yandex.ru',
		},
		// так же сюда можно вставить select или include
	});

	console.log(user);
};
```

Так же так как мы указали в модели `@@unique([age, name])`, то мы сможем найти по уникальным значениям определённую запись в базе по уникальной сгенерированной записи `age_name`

```TS
const main = async () => {
	const user = await prisma.user.findUnique({
		where: {
			age_name: {
				age: 19,
				name: 'Valery',
			},
		},
	});

	console.log(user);
};
```

Функция `findFirst` находит первую попавшуюся запись

```TS
const main = async () => {
	const user = await prisma.user.findFirst({
		where: {
			name: 'Sal',
		},
	});

	console.log(user);
};
```

![](_png/Pasted%20image%2020221224145611.png)

Функция `findMany()` найдёт все записи, которые соответствуют условию (возвращает массив)

```TS
const user = await prisma.user.findMany({
	where: {
		name: 'Sally',
	},
});
```
![](_png/Pasted%20image%2020221224150424.png)

Свойство `distinct` позволяет нам выводить только уникальные значения по определённым полям

```TS
const user = await prisma.user.findMany({
	where: {
		name: 'Sally',
	},
	distinct: ['name'],
});
```
![](_png/Pasted%20image%2020221224150617.png)

Так же мы имеем дополнительно три свойства для сортировки наших полученных результатов:
- `orderBy` - сортирует полученные записи по определённому полю в выбранном порядке
- свойство `take` берёт первое определённое количество из полученных записей
- `skip` - пропускает первую запись

```TS
const user = await prisma.user.findMany({
	where: {
		name: 'Sally',
	},
	// отсортировать
	orderBy: {
		// возраст
		age: 'asc', // по возрастанию
	},
	take: 2, // получаем первых двух пользователей
	skip: 1, // и пропускаем первого одного
});
```

## Advanced Filtering 

Так же мы можем искать значения, которые мы можем передавать в качестве значений-объектов для более продвинутого поиска нужных нам данных

`equals` будет искать значения равные введённому

```TS
const user = await prisma.user.findMany({
	where: {
		// ищет значение, которое равно данному
		name: { equals: 'Sally' }, // 2
	},
});

console.log(user.length);
```

`not` ищет значения не равные введённому

```TS
const user = await prisma.user.findMany({
	where: {
		// ищет значение, которое не равно данному
		name: { not: 'Sally' }, // 3
	},
});

console.log(user.length);
```

`in` ищет значения ровно в данном диапазоне, который мы ввели

```TS
const user = await prisma.user.findMany({
	where: {
		// ищет значение, которое входит в данный диапазон значений 
		name: { in: ['Sally', 'Sal', 'Valery'] }, // 5
	},
});

console.log(user.length);
```

`notIn` ищет значения, которые не входят в данный диапазон

```TS
const user = await prisma.user.findMany({
	where: {
		// ищет значение, которое не входит в данный диапазон значений 
		name: { notIn: ['Sally', 'Sal', 'Valery'] }, // 0
	},
});

console.log(user.length);
```

`lt` ищет значения меньше введённого

```TS
const user = await prisma.user.findMany({
	where: {
		name: 'Sal',
		// ищет значение, которое меньше...
		age: { lt: 20 }, // 1
	},
});

console.log(user.length);
```

```TS
const user = await prisma.user.findMany({
	where: {
		name: 'Sal',
		// значение больше, чем...
		age: { gt: 20 }, // 1
	},
});

console.log(user.length);
```

```TS
const user = await prisma.user.findMany({
	where: {
		name: 'Sal',
		// значение, которое больше или равно данному
		age: { gte: 20 }, // 1
	},
});

console.log(user.length);
```

```TS
const user = await prisma.user.findMany({
	where: {
		name: 'Sal',
		// значение, которое меньше или равно данному
		age: { lte: 20 }, // 1
	},
});

console.log(user.length);
```

Дальше идут свойства, которые ищут не полностью всё значение, а только совпадения
- `contains` - ищет поля, где имеющиеся данные схожи с введёнными 
- `endsWith` - ищет поля, где данные заканчиваются данной строкой
- `startsWith` - ищет поля, где данные начинаются с данной строки

```TS
const user = await prisma.user.findMany({
	where: {
		// ищет по содержимому, которое может находиться в определённом поле таблицы 
		email: { contains: '@yandex.ru' },
	},
});

console.log(user.length);
```

```TS
const user = await prisma.user.findMany({
	where: {
		// ищет строку, которая кончается данным содержимым
		email: { endsWith: '@yandex.ru' }, // 4
	},
});
```

```TS
const user = await prisma.user.findMany({
	where: {
		// ищет строку, которая начинается данным содержимым
		email: { startsWith: '@yandex.ru' }, // 0
	},
});
```

Дальше идут свойства условий:
- `AND` - ищет значения, которые удовлетворяют всем фильтрам
- `OR` - ищет значения, которые могут удовлетворять одному из фильтров
- `NOT` - ищет значения, которые не совпадают фильтру поиска

```TS
const user = await prisma.user.findMany({
	where: {
		// вернёт пересечение условий - выполняются оба
		AND: [ // 3
			{ email: { endsWith: '@yandex.ru' } }, 
			{ name: { contains: 'Sal' } }
		],
	},
});
```

```TS
const user = await prisma.user.findMany({
	where: {
		// вернёт пересечение условий - выполняется одно из двух
		OR: [ // 5
			{ email: { endsWith: '@yandex.ru' } }, 
			{ name: { contains: 'Sal' } }
		],
	},
});

/// Или так

const user = await prisma.user.findMany({
	where: {
		OR: [
			{ email: { endsWith: '@yandex.ru' } }, 
			{ email: { startsWith: 'alaera' } }
		],
	},
});
```

```TS
const user = await prisma.user.findMany({
	where: {
		// вернёт только обратные значения введённому
		NOT: { email: { endsWith: '@yandex.ru' } }, // 0
	},
});
```

## Relationship Filtering 

Так же мы можем искать значения по связям, которые реализованы в наших моделях

```TS
const main = async () => {
	const user = await prisma.user.findMany({
		where: {
			// ищем пользователей с полем userPreferences
			userPreferences: {
				// в котором включены уведомления
				emailUpdates: true,
			},
		},
	});

	console.log(user.length);
};
```

Так же мы имеем свойства для поиска определённых значений внутри связанных полей:
- `every` - ищет значения, где каждая связь имеет определённое значение
- `none` - ищет значения, которые не равны введённым 
- `some` - выведет некоторые 

Данный пример выведет всех пользователей, так как у всех пользователей нет постов. Так же если написать `none`, то выйдут опять все пользователи, так как ни у кого нет такого поста с таким именем. Но если вписать `some`, то ничего не вернётся, так как нигде нет нужного значения

```TS
// выведет пользователей, если в каждом его написанном сообщении есть тайтл Test
const user = await prisma.user.findMany({
	where: {
		writtenPosts: {
			every: {
				title: 'Test',
			},
		},
	},
});
```

А уже тут мы выводим посты, пользователям которых 27 лет и не 40 

```TS
const user = await prisma.post.findMany({
	where: {
		author: { // 0
			is: {
				age: 27
			},
			isNot: {
				age: 40
			}
		}
	},
});
```

## Client Update Operations 

Так же нам обязательно нужна будет операция для изменения данных

```TS
const main = async () => {
	// обновляем одну запись
	const user = await prisma.user.update({
		// которая удовлетворяет данным условиям
		where: {
			email: 'sally@test3.com',
		},
		// устанавливаем новые данные
		data: {
			email: 'sally@test4.com',
		},
		// так же тут можно дописать select или include 
	});

	console.log(user);
};
```

![](_png/Pasted%20image%2020221224172527.png)



```TS
const main = async () => {
	// обновляем все записи
	const user = await prisma.user.updateMany({ // { count: 2 }
		// которые удовлетворяют заданным условиям
		where: {
			name: 'Sally',
		},
		// устанавливаем новые данные
		data: {
			name: 'newSally',
		},
		// тут уже нельзя дописать select и include 
	});

	console.log(user);
};
```



```TS
const main = async () => {
	// обновляем одну запись
	const user = await prisma.user.updateMany({
		// { count: 2 }
		// которая удовлетворяет данным условиям
		where: {
			name: 'Valery',
		},
		// устанавливаем новые данные
		data: {
			age: {
				increment: 1,
			},
		},
	});

	console.log(user);
};
```



```TS
const main = async () => {
	// обновляем одну запись
	const user = await prisma.user.update({
		// { count: 2 }
		// которая удовлетворяет данным условиям
		where: {
			email: 'valera2003lvov@yandex.ru',
		},
		// устанавливаем новые данные
		data: {
			age: {
				increment: 1,
			},
		},
	});

	console.log(user);
};
```





## Connect Existing Relationships 









## Client Delete Operations













