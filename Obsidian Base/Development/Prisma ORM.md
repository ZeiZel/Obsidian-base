## Project Setup 


```bash
npm i -D typescript ts-node @types/node nodemon prisma 
```

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



```bash
npx prisma init --datasource-provider postgresql
```




![](_png/Pasted%20image%2020221221190044.png)



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

`id` - 
`Int` - 
`@id` - 
`@default` - 
`autoincrement()` - 

`schema.prisma`
```js
model User {
  id Int @id @default(autoincrement())
}
```





## Prisma Migration Basics 


`migrate` - функция, которая осуществляет миграцию
`dev` - тут мы определяем, что миграция осуществляется в режиме разработчика
`--name` - этот флаг позволяет задать имя миграции
`init` - само наше заданное имя миграции

```bash
npx prisma migrate dev --name init 
```








## Prisma Client Basics 







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













