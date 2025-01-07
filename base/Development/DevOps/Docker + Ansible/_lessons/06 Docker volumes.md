
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








## VOLUME в Dockerfile















## Использование bind mounts















## Использование tmpfs















## Копирование данных














