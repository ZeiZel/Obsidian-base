
## Устройство и типы volumes

Volumes - это механизм, который позволяет ссылаться на данные с хостовой машины из контейнера

Мы можем столкнуться с такой проблемой, что при удалении docker-контейнера, мы так же удаляем и данные, которые были в этом контейнере, которые могут быть нам нужны.

![](_png/Pasted%20image%2020250107145305.png)

Первы способ - Volumes

Volumes в большинстве случаев используется локально (а не в том же swarm). Она представляет собой подключение области хостовой машины к контейнеру. То есть docker создаёт в своей специальной области директорию, которая биндится к папке на системе пользователя и постоянно обновляется.

Второй способ - Bind mounts

В таком случае мы подклоючаем файловую систему к контейнеру и он будет смотреть целиково на неё.

Третий способ - tmpfs

Создаёт быструю файловую систему и помещает её полностью в память нашего устройства.

![](_png/Pasted%20image%2020250107150218.png)

Для чего можно использовать volumes

- Персистентное хранение данных (статичное распределение данных по контейнерам из БД)
- Экспортирование логов (контейнер генерирует данные, которые читает уже другой контейнер)
- Передача конфигов в контейнер
- Share данных между контейнерами

## Использование volumes

Для примера напишем сервер, который будет считывать файлы в нашей папке с данными и возвращать их

`src / index.js`
```JS
const express = require("express");
const { writeFileSync, readFileSync } = require("fs");
const fse = require("fs-extra");

const app = express();
const port = 3000;

app.get("/set", async (request, response) => {
  await fse.ensureDir("data");
  writeFileSync("./data/req", request.query.id);
  response.send("done!");
});

app.get("/get", (request, response) => {
  const res = readFileSync("./data/req");
  response.send(res.toString());
});

app.listen(port, (err) => {
  if (err) {
    return console.log("something bad happened", err);
  }
  console.log(`server is listening on ${port}`);
});
```

Докерфайл выглядит следующим образом:

```Dockerfile
FROM node:14-alpine as build
WORKDIR /opt/app
ADD *.json ./
RUN npm install
ADD . .
CMD ["node", "./src/index.js"]
```

Программа выполняет следующие операции:

![](_png/Pasted%20image%2020250107151452.png)

Далее попробуем создать с помощью команды `docker volume` новый volume для наших будущих данных. 

Как можно увидеть, все данные для этого пространства располагаются в директории volumes

```bash
$ docker volume create demo
demo

$ docker volume ls
DRIVER    VOLUME NAME
local     demo

$ docker volume inspect demo
[
    {
        "CreatedAt": "2025-01-08T12:21:30+03:00",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/demo/_data",
        "Name": "demo",
        "Options": null,
        "Scope": "local"
    }
]
```

Чтобы привязать контейнер докера к определённому пространству, нужно будет запустить следующую команду:

```bash
docker run --name volume-1 -d -v demo:/opt/app/data -p 3000:3000 demo4:latest
```

Когда мы привязываемся к пространству через `-v`, нам нужно указать через `пространство:путь_в_контейнере`, какие именно данные мы хотим связать из контейнера с нашей внешней папкой с данными на хосте. Путь в контейнере мы считаем от `WORKDIR /opt/app`, который мы указали как рабочую папку внутри контейнера. `data` непременно будет находиться в контейнере именно в `/opt/app/data`, так как у нас в проекте она располагается в `<project>/data`.

И теперь мы можем отправить запрос в докер и из пространства получить сразу данные, которые docker из контейнера положил на нашу хост-машину в `/var/lib/docker/volumes/demo/_data`. Все данные из `data` находятся тут, так как мы только их подцепили из докера.

```bash
$ curl "127.0.0.1:3000/set?id=1234"
done!%

$ curl "127.0.0.1:3000/get"
1234%

$ sudo cat /var/lib/docker/volumes/demo/_data/req
1234%
```

Если мы поднимем другой контейнер, но на порту 3001, который так же подцеплен под этот же volume и дёрнем из него запрос, то мы получим тот же самый вывод, так как оба сервера сейчас смотрят на одну и ту же хостовую директорию.

Если два контейнера подцеплены под один и тот же volume, то данные между этими двумя контейнерами будут шейриться. 

```bash
$ docker run --name volume-2 -d -v demo:/opt/app/data -p 3001:3000 demo4:latest

$ curl "127.0.0.1:3001/get"
1234%
```

Чтобы удалить volume, нужно будет сначала удалить все связанные с ним контейнеры

```bash
$ docker rm $(docker ps -a -q) -f
8a6d2f71508f

$ docker volume rm demo
demo

$ sudo ls /var/lib/docker/volumes
backingFsBlockDev  metadata.db
```

## VOLUME в Dockerfile

Так же мы можем напрямую в файле контейнера указать volume, который нам нужно будет подключить

```Dockerfile
FROM node:14-alpine AS build
WORKDIR /opt/app
ADD *.json ./
RUN npm install
ADD . .
VOLUME ["/opt/app/data"]
CMD ["node", "./src/index.js"]
```

После сборки и инспекции контейнера, тут так же можно будет увидеть место пространства и файлы, которые к нему подцеплены

```bash
$ docker build -t demo4:latest .

$ docker image inspect demo4:latest
"Volumes": {
	"/opt/app/data": {}
},
```

И теперь при создании контейнера, мы получаем сгенерированный volume со своим сложным хешем

```bash
$ docker volume ls
DRIVER    VOLUME NAME

$ docker run --name volume-3 -d -p 3000:3000 demo4

$ docker volume ls
DRIVER    VOLUME NAME
local     cb72c2cba4e40437...
```

Он так же будет хранить данные, как и созданный ранее именованный volume

```bash
$ curl "127.0.0.1:3000/set?id=1234"
done!%

$ sudo cat /var/lib/docker/volumes/cb72c2cba4e404379e2af659fa65a3ca495e0cade6aaa0df51718d5e42e45f4d/_data/req
1234%
```

Однако мы сталкиваемся с той проблемой, что при пересоздании контейнера, данные не будут биндиться и каждый раз будет создаваться новый volume, который будет занимать много места. Та же монга может просто два раза занять по 300 мб, вместо использования своего именованного участка.

Поэтому мы можем так же прибиндить наш контейнер к именованному volume.

```bash
$ docker run --name volume-4 -d -v demo:/opt/app/data -p 3000:3000 demo4
d7fdcdaa487eee48...

$ docker volume ls
DRIVER    VOLUME NAME
local     cb72c2cba4e40...
local     demo
```

Чтобы очистить неиспользуемые неименованные volume, мы можем почистить их через `prune`

```bash
$ docker volume prune
WARNING! This will remove anonymous local volumes not used by at least one container.
Are you sure you want to continue? [y/N] y
Deleted Volumes:
cb72c2cba4e404379e2af659fa65a3ca495e0cade6aaa0df51718d5e42e45f4d

Total reclaimed space: 4B
```

## Использование bind mounts

Bind mounts - это биндинг файловой системы в произвольную область нашего хоста (а не внутри докера)

```bash
docker run --name volume-5 -d -v /home/zeizel/data:/opt/app/data -p 3000:3000 demo4
```











## Использование tmpfs















## Копирование данных














