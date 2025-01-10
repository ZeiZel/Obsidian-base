
## YAML

YAML (yaml ain't markup language) - это надмножество JSON, которое позволяет в более понятном формате писать людям конфиги

![](_png/0553235311f1b8feadb8910a81f62fea.png)

И так примерно мы можем заполнять файл:

`main.yml`
```YAML
# Строки
firstname: 'Olegov'
name: Oleg
surname: "Olegovich \n"

# Числа
version: 1.2.3
age: 23

# boolean
isDev: true
isTest: off # on
isProd: no # yes

# объект
user:
  name: Oleg
  age: 23

# список
users:
  - name: Oleg
    age: 24
  - name: Vera
    age: 22

# список значений
userList:
  - Oleg
  - Vera

# запись в виде массива
userNames: [Oleg, Vera, 1.2.3]

# YML является надмножеством над JSON поэтому такая запись тоже валидна
myObject: {
    "key": "value",
    string: 1.2.3
}

# так же мы можем писать многострочные строки
multiline: |
  Эта строка
  пойдёт на
  несколько 
  строк.
  Вопросы?

# если нам нужно записать большую многострочную запись в виде одной строки, мы можем воспользоваться данной конструкцией
singleline: >
  Сколько бы тут не было текста,
  он всегда будет считаться одной строкой

# Такая черта позволит отделить одно описание ямла от другого (создаётся новое пространство имён)
---
name: Oleg
```

## Установка docker compose

Для установки достаточно повторить шаги из [документации](https://docs.docker.com/compose/install/linux/#install-the-plugin-manually). Желательно установить его отдельным плагином Docker, а не standalone.

```bash
docker compose --help
```

## Docker compose

Docker compose - это утилита, которая позволяет заранее описать всё нужное состояние контейнера и запустить его из под конфига

![](_png/Pasted%20image%2020250108180307.png)

#### Конфигурация

- version - это описание версии текущего композа, фичи которого будут поддерживаться. Сейчас писать эту строку необязательно.
- services - это ключ описания сервисов, которые мы будем поднимать. Внутри него мы создаём объект с сервисами, в которых нужно будет указать параметры для запуска образов.
- networks - описание сетей, которые нужно создать или подключиться к ним
- volumes - описание пространств, которые нужно подготовить для сервисов

`docker-compose.yml`
```yaml
# версия compose
version: '3'

# описание сервисов
services:
  api: # сервис с именем api
    image: demo4 # наше изображение или из registry
    container_name: my-name # имя контейнера, которое не будет работать в swarm
    ports:
      - "3000:3000" # указание проброса портов
    networks:
      - servers # доступные сети
    volumes:
      - data:/opt/app/data # пространства с маппингом

# описание сетей, которые нужно будет создать
networks:
  servers:
    driver: bridge
# ЛИБО можно не создавать, а подключиться к существующей сети
networks:
  default:
    external: true
    name: servers

# описание пространств данных
volumes:
  data:
```

#### Команды

Далее мы можем одной командой поднять все сервисы, описанные в `docker-compose.yml`:

```bash
# поднимает текущий compose
docker compose up

# остановит текущий compose
docker compose stop

# стартанёт обратно текущий compose
docker compose start

# остановит и удалит неиспользуемые элементы (удалит контейнер и сеть, но оставит volume, так как он персистентен)
docker compose down
```

>[!important] Важно понимать, что команды compose - контекстозависимы!
> То есть все операции будут выполняться в первую очередь для текущей папки, опираясь на `docker-compose.yml`

Так же команды:
- restart - перезапуск
- pull / push - пулит и пушит image с registry
- port - выведет занятые порты
- logs - выведет логи из всех контейнеров. Может быть полезно, когда у нас запущены в `-d`.
- images - выведет список используемых образов
- top - покажет запущенные в текущий момент процессы

```bash
[$] docker compose up -d           
[+] Running 1/1
 ✔ Container my-name  Started  0.2s
  
[$] docker compose top
my-name
UID    PID       PPID      C    STIME   TTY   TIME       CMD
root   1210000   1209978   1    18:55   ?     00:00:00   node ./src/index.js   

[$] docker compose images
CONTAINER           REPOSITORY          TAG                 IMAGE ID            SIZE
my-name             demo4               latest              1fc568913222        122MB
```

Если нам нужно следить за логами поднятого через `-d` контейнера, нам нужно воспользоваться `-f`

```YML
docker compose logs <контейнер> -f
```

#### Заключение

docker compose - это удобный инструмент для оркестрирования сразу несколькими контейнерами. Он позволяет делать почти всё то же самое, что мы делали, когда собирали, запускали, останавливали и перезапускали образы самостоятельно.

## Оркестрация сервисов

Docker compose позволяет нам удобно оркестрировать множеством сервисов, которые будут подняты одновременно и взаимодействовать друг с другом по описанным нами правилами.

В примере будет использоваться монорепозиторий, где в apps будут находиться проекты: api, app, converter. Каждый из этих проектов содержит в себе Dockerfile, который all-in-one собирает в себе проект. Отдельно серверные сервисы общаются через rabbitmq, который нужно будет поднять отдельным docker-контейнером, чтобы происходило общение внутри compose.

- Здесь нам нужны volumes, так как через них мы будем добавлять `.env` файл в билд приложения. В рамках композа на одной ноде - это хороший вариант. Если мы будем поднимать в swarm, то там уже энвы распространяются через механизм секретов.
- Когда мы запускаем образ через `docker run`, мы можем передать через `-e ENV_NAME=value -e ENV_NAME_2=value_2` переменные окружения. Так же мы можем сделать и внутри compose ключом `environment`
- Для каждого сервиса обязательно нужно **указать либо build, либо image** из которых будет собираться проект. Image мы берём из registry нашей компании или dockerhub. Build принимает в себя множество параметров, основными из которых являются: context (область, которая будет использоваться для создания образа) и dockerfile (сам файл для сборки приложения).

`docker-compose.yml`
```yml
---
# описываем все сервисы
services:
  # сервис апишки
  api:
    container_name: api
	# указываем откуда будем собирать образ
    build:
      context: . # за контекст берём всю директорию проекта
      dockerfile: apps/api/Dockerfile # укаызваем путь до проекта в монорепе
    # перезапускаем всегда при падении
    restart: always
    # указываем путь до .env файла
    volumes: [./.env:/opt/app/.env]
    # укаызваем сеть, в которой будет находиться контейнер
    networks: [my-network]
    # образ зависим от RMQ и запустится уже после него
    depends_on: [rmq]
  app:
    container_name: app
    build:
      context: .
      dockerfile: apps/app/Dockerfile
    restart: always
    volumes: [./.env:/opt/app/.env]
    networks: [my-network]
  converter:
    container_name: converter
    build:
      context: .
      dockerfile: apps/converter/Dockerfile
    restart: always
    volumes: [./.env:/opt/app/.env]
    networks: [my-network]
    depends_on: [rmq]
  # сервис брокера сообщений между сервисами
  rmq:
	# указываем image из registry docker hub
    image: rabbitmq:3-management
    networks: [my-network]
    restart: always
	# передаём переменные окружения для входа
    environment: 
	    - RABBITMQ_DEFAULT_USER=admin
	    - RABBITMQ_DEFAULT_PASS=admin

networks:
  my-network:
    driver: bridge

volumes:
  data:
```

После запуска, у нас поднимаются сразу все нужные сервисы

```bash
docker compose up
```

![](_png/Pasted%20image%2020250108205818.png)

## Профили

Профили - это список в конфиге, котрый позволяет нам группировать контейнеры

```YML
---
services:
  api:
    container_name: api
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    volumes: [./.env:/opt/app/.env]
    networks: [my-network]
    depends_on: [rmq]
    profiles: [backend]
```

Указание профилей позволит нам запускать только те сервисы, которые нам нужны из командной строки. То есть все backend сервисы поднимутся, когда мы укажем `--profile <профиль>`

> Важно указать флаги до `up`

```bash
$ docker compose --profile backend --profile frontend up

# либо можно вызывать нужные профили так
COMPOSE_PROFILES=backend,frontend docker compose up
```

![](_png/Pasted%20image%2020250109180309.png)

Так же мы можем поднять отдельно выбранный сервис. Поднимется только он и все остальные сервисы, которые мы указали в `depends_on`.

`run` вызывает профили неявно просто благодаря его запуску.

Такой подход может быть полезен, когда нам нужно запустить образы с какой-нибудь миграцией или отдельными скриптами с операциями.

```bash
docker compose run api
```

Однако, если у одного из контейнеров одного профиля есть зависимость из другого профиля, то мы столкнёмся с проблемой 

![](_png/Pasted%20image%2020250109180444.png)

## Переменные окружения

Ко всему прямо внутри файла с конфигом композа, мы можем использовать переменные окружения. Вставлять их можно в строки через `'{$<переменная>}'` либо просто вставляя `$<переменная>`

```YML
services:
  api:
    container_name: '{$API_CONTAINER_NAME}'
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    volumes: [./.env:/opt/app/.env]
    networks: [my-network]
    depends_on: [rmq]
    profiles: [backend]
```

Для этого дела создадим отдельный файл

`.env.compose`
```env
API_CONTAINER_NAME=api
```

И через флаг `--env-file` можно указать путь до энва, который будет использоваться для конфига.

Можно и не указывать флаг и тогда будет использоваться дефолтный файл `.env`.

```bash
docker compose --env-file .env.compose --profile backend up
```

Так же нужно указать возможность вызвать `docker compose config`, который позволяет нам взглянуть на итоговый конфиг, который попдаёт в композ и будет крутиться.

К нему нужно добавить `--env`, чтобы взглянуть на переменные, которые он подставит и обязательно указать `--profile`, если мы задали его для наших контейнеров

```bash
$ docker compose --env-file .env.compose --profile queue config

name: docker-demo
services:
  rmq:
    profiles:
      - queue
    environment:
      RABBITMQ_DEFAULT_PASS: admin
      RABBITMQ_DEFAULT_USER: admin
    image: rabbitmq:3-management
    networks:
      my-network: null
    restart: always
networks:
  my-network:
    name: docker-demo_my-network
    driver: bridge

```

Так же нужно отдельно упомянуть тот факт, что мы можем в сам контейнер передать переменные окружения не только через `environment`, но и через указания файла с энвами в ключе `env_file`

```YML
rmq:
    image: rabbitmq:3-management
    networks: [my-network]
    restart: always
    env_file: [.env.rmq]
    environment: 
	    - RABBITMQ_DEFAULT_USER=admin
	    - RABBITMQ_DEFAULT_PASS=admin
    profiles: [queue]
```

Так же мы можем передать переменную окружения `COMPOSE_PROJECT_NAME`, которая заменит название проекта в билде композа с названия папки, в которой находится `docker-compose.yml` на наш, который мы задали

```bash
COMPOSE_PROJECT_NAME=mycompose docker compose --env-file .env.compose --profile backend --profile queue up
```

![](_png/Pasted%20image%2020250109184352.png)

## Упражнение - Выкладываем полное приложение

Схема нашего прилоежния:
- на хосте запущен только браузер
- на иммитации сервера (virtualbox) располагается композ со всеми контейнерами
- браузер долбится по порту 3001 на порт 3001 сервера, а сервер выводит через 3001 порт фронта, который запущен в контейнере на 80 порту
- из браузерного клиента мы отправляем запрос в VB на порт 3002, порт 3002 на сервере смотрит на 3000 порт из контейнера
- API общается с RMQ
- RMQ передаёт сообщения между API и Converter
- API возвращает в браузер ответы, с которыми работает App фронта

![](_png/Pasted%20image%2020250109184609.png)

Образ -> Настройки -> Сеть -> Дополнительно -> Проброс портов -> указываем нужные порты

![](_png/Pasted%20image%2020250110183238.png)

Далее описываем вслед за схемой все нужные порты для наших контейнеров. Для конвертера нам порты не нужны, потому что он общается только с нашим api, который находится в локальной сети.

`docker-compose.yml`
```YML
services:

  app:
    container_name: app
    build:
      context: .
      dockerfile: apps/app/Dockerfile
    restart: always
    ports: [3001:80]
    networks: [my-network]

  api:
    container_name: api
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    ports: [3002:3000]
    volumes: [./.env:/opt/app/.env]
    networks: [my-network]
    depends_on: [rmq]
  
  converter:
    container_name: converter
    build:
      context: .
      dockerfile: apps/converter/Dockerfile
    restart: always
    volumes: [./.env:/opt/app/.env]
    networks: [my-network]
    depends_on: [rmq]

  rmq:
    image: rabbitmq:3-management
    networks: [my-network]
    restart: always
    env_file: [.env.rmq]
    environment: 
	    - RABBITMQ_DEFAULT_USER=admin
	    - RABBITMQ_DEFAULT_PASS=admin

networks:
  my-network:
    driver: bridge

volumes:
  data:
```

## Shared конфигурации








