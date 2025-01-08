
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

#### Заключение

docker compose - это удобный инструмент для оркестрирования сразу несколькими контейнерами. Он позволяет делать почти всё то же самое, что мы делали, когда собирали, запускали, останавливали и перезапускали образы самостоятельно.

## Оркестрация сервисов

Docker compose позволяет нам удобно оркестрировать множеством сервисов, которые будут подняты одновременно и взаимодействовать друг с другом по описанным нами правилами.

- Здесь нам нужны volumes, так как через них мы будем добавлять `.env` файл в билд приложения. В рамках композа на одной ноде - это хороший вариант. Если мы будем поднимать в swarm, то там уже энвы распространяются через механизм секретов.
- Когда мы запускаем образ через `docker run`, мы можем передать через `-e ENV_NAME=value -e ENV_NAME_2=value_2` переменные окружения. Так же мы можем сделать и внутри compose ключом `environment`
- Для каждого сервиса обязательно нужно **указать либо build, либо image** из которых будет собираться проект. Image мы берём из registry нашей кома

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



## Профили







## Переменные окружения







## Упражнение - Выкладываем полное приложение







## Shared конфигурации








