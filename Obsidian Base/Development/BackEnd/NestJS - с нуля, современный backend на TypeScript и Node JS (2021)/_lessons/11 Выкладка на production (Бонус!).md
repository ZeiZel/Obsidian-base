
## 001 Сборка Docker

Файл `Dockerfile` описывает то, какие шаги нужно сделать, чтобы успешно собрать проект внутри образа докера

Конкретно тут будет запрос написан так, чтобы сборка была быстрее, когда мы меняем просто код без изменения зависимостей

Список всех версий ноды на алпайн линкусе можно глянуть [тут](https://hub.docker.com/_/node)

Первый вариант для создания нового образа (не самый оптимальный):
- берём ОС на базе алпайна с нодой 19 версии
- выбираем рабочую директорию
- добавляем все файлы из нашей папки
- запускаем установку зависимостей
- запускаем сборку
- запускаем основной файл сервера

`Dockerfile`
```Dockerfile
FROM node:19-alpine
WORKDIR /opt/app
ADD . .
RUN npm install
RUN npm run build
CMD ["node", "./dist/main.js"]
```

Уже более оптимальная версия выглядит так:
- сначала добавляем пакейдж и запускаем установку его зависимостей
- затем уже копируем проект в образ
- потом удаляем все зависимости кроме тех, что нужны для продакшена
- далее запускаем сервер

`Dockerfile`
```Dockerfile
FROM node:19-alpine
WORKDIR /opt/app
ADD package.json package.json
RUN npm install
ADD . .
RUN npm run build
RUN npm prune --production
CMD ["node", "./dist/main.js"]
```

Далее нужно на сервере запустить данную команду:
- `build` - собрать
- `-t top-api` - добавляем тег, чтобы прочитать название нашего билда
- `.` - `Dockerfile` находится в одной папке с проектом

```bash
docker build -t top-api .
```

## 002 Docker-compose

Тут мы описываем тот композ, который нужно будет развернуть на сервере, где мы запускали прошлый билд, описанный через `Dockerfile`

`docker-compose.yml`
```YML
version: '3'
services:
  top.api:
    image: top-api:latest
    container_name: top-api
    restart: always
    ports:
      - 3000:3000
    volumes:
      - ./.env:/opt/app/.env
```

Далее запускаем отдельным процессом наш контейнер

```bash
docker-compose up -d 
```

## 003 GitHub actions










