
## Что такое image

### Состав изображения

Для начала скачаем образ nginx с docker hub с помощью docker daemon

```bash
docker pull nginx
```

Как можно заметить, докер скачивает не целиковый образ, а отдельные слои (aka *layers*, из которых состоит образ). Каждый образ подписан уникальным идентификатором. Такой подход позволяет экономить пространство на диске.

![](_png/Pasted%20image%2020240811190542.png)

По-факту, каждый слой - это отдельный образ, который доступен только на Read (чтение). После создания контейнера из image, у нас создастся тонкий слой, который будет доступен для записи информации (ReadWrite).

Это приводит к тому, что сколько бы мы не запустили разных контейнеров изображения, image, на котором (например) nginx будет базироваться, останется всегда один.

![](_png/Pasted%20image%2020240811191349.png)

### Внутрянка image

Теперь мы можем посмотреть, что находится внутри изображения в докере.

Для начала просмотрим список изображений

```bash
docker images
```

![](_png/Pasted%20image%2020240811191415.png)

Чтобы сохранить архив с внутренними файлами изображения, можно воспользоваться следующей командой

> Сразу можно сказать, что данный способ может пригодиться, когда наша машина не имеет доступа в интернет и в неё можно передать изображение только таким образом.

```bash
docker save --output nginx.tar nginx
mkdir nginx
tar xvf nginx.tar -C nginx
```

Ну и в манифесте можно просмотреть все ссылки на остальные слои изображения.

Структура каждого слоя выглядит похожим образом. Даже можно сказать, что layer - это тоже image, который содержит определённую информацию.

Такая иерархия очень похожа на стандартную работу пакетного менеджера, который собирается из других пакетов.

![](_png/Pasted%20image%2020240811192302.png)

Так же в отдельном слое может находиться и внутренность его файловой системы

![](_png/Pasted%20image%2020240811192908.png)

Так же мы можем вывести историю,  по которой мы можем понять, как был собран тот или иной image. История снизу вверх идёт и отображает последовательность операций сборки

```bash
docker history <package>
```

![](_png/Pasted%20image%2020240811193104.png)

Эффективным это переиспользование является потому, что мы не занимаем на диске место несколькими разными контейнерами. У нас поднимаются отдельные верхние слои, которые используют свои модули и пакеты в процессе работы, а так же ссылаются на общие слои.

![](_png/Pasted%20image%2020240812184645.png)

`/var/lib/docker/overlay2` - это группа слоёв изображений, который смёрдживается в одну файловую систему, которая используется в разных контейнерах. Сама по себе она весит немного, так как использует слоёную архитектуру

`/var/lib/docker/containers` - содержит образы контейнеров, которые мы пульнули из хаба. Сейчас тут 54 килобайта nginx

```bash
sudo du -sh /var/lib/docker/overlay2
sudo ls /var/lib/docker/overlay2
```

![](_png/Pasted%20image%2020240812193355.png)

![](_png/Pasted%20image%2020240812194249.png)

После создания отдельного контейнера, мы создаём на базе изображения nginx второй верхний слой, который будет занимать не так много места

То есть прошлое изображение и новое с 56кб начали весить 120кб

```bash
docker run -d --name nginx2 nginx
```

![](_png/Pasted%20image%2020240812195039.png)

Деление оверлея файловой системы:
- Нижний слой
	- link - ссылка на слой
	- diff - изменения файловой системы образа
- Верхний слой
	- lower - ссылается на нижний слой и может вернуть информацию о том, что там лежит
	- link - ссылка для того, чтобы на этот слой мог ссылаться другой слой, который будет выше
	- diff - показывает разницу относительно прошлого слоя
	- merged - слитый diff с предыдущей файловой системой (diff из нижнего и верхнего слоя). Позволяет собрать правильный слепок файловой системы, на которой будет работать образ
	- work - папка для хранения внутренних данных для оверлея

![](_png/Pasted%20image%2020240812195407.png)

Собственно, все эти папки можно вывести из определённого изображения

![](_png/Pasted%20image%2020240812200843.png)

Раньше использовались драйверы OverlayFS1 (предыдущая, менее эффективная версия) и AUFS (этот был устроен сложнее, но выполнял всё то же самое, хоть и медленнее)

## 002 Работа с image

Команды `docker image`: 
- `history` - выведет историю по определённому image со всеми командами для сборки образа

![](_png/Pasted%20image%2020240817140114.png)

- `inspect` - выведет подробную спеку по image. 

`LowerDir` - хранит дифы (blob'ы связанных слоёв)
`MergedDir` - мёрдж всех слоёв с FS текущей системы
`UpperDir` - дифф текущей системы
`WorkDir` - необходимая для OverlayFS директория

![](_png/Pasted%20image%2020240817140149.png)

- `import` - это операция, которая позволит руками импортировать image (нужно для систем, у которых нет доступа к интернету)
- `pull` - находит registry с нужным образом docker
- `push` - позволит запушить собранный локально image для того, чтобы потом его скачать
- `ls` - выведет все изображения. Так же он имеет флаги:
	-  `--format {{.Tag}}`, который выведет сформатированный ответ
	- `--filter "before=node"`, который отфильтрует по параметрам (изображения, которые идут до ноды)

![](_png/Pasted%20image%2020240817140808.png)

- `rm <image name/id>` - позволит удалить определённый image

Если в удаляемом контейнере используются слои, которые используются в других образах, то докер нас об этом предупредит и даст удалить image только с `--force` флагом либо удалить все контейнеры, которые ссылаются на этот image

![](_png/Pasted%20image%2020240817141808.png)

Так же частым бывает случай, когда мы встречаемся с `dangling image` - это изображение без тэга. Такое получается, когда мы меняем тег одного image на другой.

![](_png/Pasted%20image%2020240817142137.png)

Чтобы решить эту проблему, можно воспользоваться следующей командой:

- `prune` - очистит все image без тэгов

## 003 Dockerfile

### Сам файл

Dockerfile представляет из себя файл с инструкциями докеру, что он должен сделать, чтобы собрать образ с нашим приложением.

Сразу нужно сказать, что каждая новая команда - это слой. Стоит оптимизировать свои команды, чтобы этих слоёв было минимум. Сам докер имеет ограничение в 127 строк в своём файле. Обходится это multistaged билдами.

![](_png/Pasted%20image%2020240817143736.png)

### Контекст сборки

Во время сборки, мы имеем дело с контекстом сборки. Контекст сборки - это набор файлов, к которым сборка может получить доступ. Когда билд собирает контекст, то он собирает все вложенные файлы нашего проекта, которые нужны для запуска приложения.

Сам контекст поднять нельзя. Если нам нужно будет собрать файл из папки вверх, то нам нужно будет подняться по пути самого билда на папку выше.

`.dockerignore` позволит удалить некоторые файлы из контекста.

### Команды

- `ARG` - аргументы - это дополнительные параметры, которые можно передать при сборке. Можно передать как заранее определённую переменную со своим значеннием, так и неопределённую, значение которой мы передадим из вне внутри команды `docker build --build-arg`. Второй вариант нужен, когда нам нужно, чтобы значение существовало только в рамках билда, но не попало на прод 
- `FROM` - это старт нашего образа. Всегда и все образы базируются на каком-либо другом образе. Если образ не требуется ни на чём базировать, то мы его базируем на `scratch`. Так же через `as` мы задаём alias для билда, чтобы использовать его в последовательности внутри другого билда
- `ONBUILD` - это команда, которая будет выполняться только тогда, когда другой image базируется на этом image, то есть только внутри другого билда во время сборки другого изображения
- `LABEL` - хранит в себе мета-информацию об образе, в котором можно указать версию, автора, компанию и так далее
- `USER` - определяет пользователя, который будет выполнять команды
- `WORKDIR` - рабочая директория, относительно которой будут выполняться команды
- `ADD` - добавляет файлы с хостовой машины в образ. Однако эта команда так же умеет в побочные действия в виде разархивирования в определённую папку и скачивания файла по урлу
- `COPY` - просто копирует файлы в образ. Из побочных действий он умеет копировать файлы из прошлых образов во время multistage-сборки

![](_png/Pasted%20image%2020240817145333.png)

- `SHELL` - установка нужного нам shell
- `RUN` - выполнение команды из оболочки. Самая частая в использовании команда. Для поднятия и сборки билда
- `ENV` - переменная окружения сборки. Чтобы обратиться к переменной, нужно написать `$ПЕРЕМЕННАЯ`. Она будет так же находиться и в финальном образе, поэтому хранить в ней секреты и токены - несекьюрно. Чтобы не сохранять переменную, её можно будет записать с помощью `RUN VAR=data`.
- `VOLUME` -  
- `ENTRYPOINT` - это инструкции, которые нужно выполнить после того, как запустится контейнер из этого изображения
- `CMD` - то же самое, что и прошлая команда, но...
- `STOPSIGNAL` - вызов стопсигнала для остановки контейнера
- `EXPOSE` - это документация о том, какой порт мы прокинули и можем получить снаружи вне нашего контейнера. Сама команда пробросом портов не занимается.
- `#` - комментарий внутри изображения. Так же можно туда записать инструкцию для парсера по тому же экранированию

![](_png/Pasted%20image%2020240817151253.png)

`CMD` и `ENTRYPOINT` вляют друг на друга и ведут себя по-разному в разных обстоятельствах. Если нет ниодного из них, то ничего не произойдёт. Если есть только cmd, то выполнится команда и её аргументы. Если мы запишем только энтрипоинт в виде строки, то он покроет выполнение cmd полностью и будет просто выполняться со своей строкой. Если энтри массив, а cmd строка, то выполнится обе операции. Если этри массив и cmd массив, то cmd будет представлять из себя просто уточняющие операции для entry.

![](_png/Pasted%20image%2020240817153200.png)

## 004 Создаем свой image

Команда `docker build` собирает нам приложение. 

И она принимает в себя несколько флагов:
- `-q` - подавляет вывод сгенерированных файлов докером
- `-f` - позволяет указать путь до Dockerfile. Изначально, билд ищет этот файл в корне контекста, но если его не будет, то вылезет ошибка, поэтому нам и нужно
- `-t` - определяет название и тэг для нашего образа

Опишем проект. Это монорепозиторий с бэкэндом (`api`) и фронтендом (`app`). 

![](_png/Pasted%20image%2020240817185221.png)

Опишем простой докерфайл, который просто позволит поднять проект. Нам понадобится образ 14 ноды, укажем рабочую директорию как `/opt/app`, добавим туда весь проект, установим все скрипты, сбилдим проект, запустим его через `node` 

`apps / api / Dockerfile`
```bash
FROM node:14
WORKDIR /opt/app
ADD . .
RUN npm i
RUN npm run build api
CMD ["node", "./dist/apps/api/main.js"]
```

И тут мы должны будем указать путь до Dockerfile, указать тег, чтобы не потерять образ и указать контекст `.`, чтобы работать со всем проектом

```bash
docker build -f ./apps/api/Dockerfile -t test:latest .
```

Далее нам нужно поднять наш образ с запущенным образом. Отцепляем работу от текущей сессии терминала, указываем имя образа, указываем тег проекта, к которому мы подключились.

```bash
docker run -d --name api test:latest
```

![](_png/Pasted%20image%2020240817190824.png)

## 005 Улучшаем сборку

Сам образ правильный, он работает и запускается, но вес для обычного маленького проекта - очень большой.

![](_png/Pasted%20image%2020240817191224.png)

Можно оптимизировать вес образа за счёт правильного использования слоёв.

Сейчас у нас такая ситуация. При повторной сборке, у нас она выполняется за несколько секунд благодаря кэшированию всех этапов.

![](_png/Pasted%20image%2020240817192509.png)

Однако если мы изменим каким-либо образом код, то у нас слетит кэш на этапе установки зависимостей и их придётся ставить в проект заново.

![](_png/Pasted%20image%2020240817192419.png)

Код у нас меняется чаще, чем зависимости, поэтому нам нужно немного поменять подход к их установке.

Первым делом, нам нужно скопировать `package.json`, затем установить зависимости, а уже только потом собирать проект. Так же более лёгкой версией ноды будет являться не версия на классическом дистрибутиве, а alpine, который весит менее 100 мегабайт. Он отлично подходит для разворачивания приложения

```bash
FROM node:14-alpine3.10
WORKDIR /opt/app
ADD *.json ./
RUN npm i
ADD . .
RUN npm run build api
CMD ["node", "./dist/apps/api/main.js"]
```

И теперь наше изображение стало весить в два раза меньше при тех же вводных, а так же у нас закэшировались все шаги до билда, что позволит пропустить этап с установкой зависимостей при каждой новой сборке приложения.

![](_png/Pasted%20image%2020240817201804.png)

## 006 Анализируем image

Для анализа образов можно воспользоваться утилитой [dive](https://github.com/wagoodman/dive), которая позволяет залезть внутрь образов на каждом этапе сборки.

Эта команда, которая возьмёт наш тестовый образ и построит по его файловой системе граф

```bash
dive test:latest
```

Тут у нас есть информация по каждому слою и отображение Image Details, в котором есть общая информация по возможной оптимизиации образа

![](_png/Pasted%20image%2020240819185017.png)

Под каждый шаг мы получаем новые данные о новых файлах

Так из каждого шага мы можем для себя определить, какие слои могут быть больше оптимизированы и урезаны от лишних файлов

![](_png/Pasted%20image%2020240819185351.png)

## 007 Многоэтапная сборка

Многоэтапная сборка позволяет нам собрать в одном Dockerfile сразу несколько образов.

Основные плюсы:
1. Позволяет иметь более сжатый конечный билд
2. Позволяет скрыть секреты, которые использовались на первом этапе, но на втором их уже не будет

Поэтому сейчас мы сделаем первый образ, который в себе соберёт приложение. А во втором образе мы возьмём собранное приложение с помощью обращения через `--from=<алиас_сборки>` и установим только prod-зависимости

Так же в команде `COPY` мы можем поменять немного путь расположения

```Dockerfile
FROM node:14-alpine3.10 as build
WORKDIR /opt/app
ADD *.json ./
RUN npm i
ADD . .
RUN npm run build api


FROM node:14-alpine3.10
WORKDIR /opt/app
ADD package.json ./
RUN npm i --only=prod
COPY --from=build /opt/app/dist/apps/api ./dist
CMD ["node", "./dist/main.js"]
```

![](_png/Pasted%20image%2020240819192118.png)

## 008 Упражнение - Сборка go проекта

Сейчас завернём приложение на Go, которое просто выводит сообщение о своём запуске на определённом порту

`go.mod`
```go
module docker-demo-2

go 1.15
```
`main.go`
```go
package main

import (
	"fmt"
	"net/http"
)
func main() {
	fmt.Print("Go проект запущенный в Docker слушает на 9000 порту")
		handler := HttpHandler{}
		http.ListenAndServe(":9000", handler)
}

type HttpHandler struct{}
func (h HttpHandler) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	data := []byte("Hello World!")
	res.Write(data)
}
```

Для начала просто соберём приложение

```bash
brew install go
go build
./docker-demo-2
```

![](_png/Pasted%20image%2020240819193321.png)

Далее нужно будет его перенести в докер, там собрать и запустить. Для этого воспользуемся `golang:alpine` системой для поднятия образа и уже внутри неё соберём бинарник. Сам по себе бинарник мы собираем под определённую систему, поэтому ничего страшного не будет, если следующий билд мы соберём из `scratch` и в нём просто запустим наш бинарник

```Dockerfile
FROM golang:alpine as build
WORKDIR /go/bin
ADD . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build

FROM scratch
COPY --from=build ./go/bin/docker-demo-2 ./go/bin/docker-demo-2
ENTRYPOINT ["./go/bin/docker-demo-2"]
EXPOSE 9000
```

Далее остаётся только сбилдить и запустить образ

```bash
docker build -t go-api:latest .
docker run --name go-api-demo -d go-api
```
