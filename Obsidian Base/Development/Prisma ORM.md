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
`@default` - 
`autoincrement()` - автоувеличение значения под каждую новую запись 

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


## Datasources and Generators 









## Model Fields 









## Model Relationships 









## Model Attributes 









## Enums 









## Client Create Operations 









## Client Read Operations









## Advanced Filtering 









## Relationship Filtering 









## Client Update Operations 









## Connect Existing Relationships 









## Client Delete Operations













