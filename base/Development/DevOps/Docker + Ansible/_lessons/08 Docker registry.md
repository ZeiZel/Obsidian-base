
## Работа docker-registry

Docker registry - это приложение, которое предоставляет API, с которым можно взаимодействовать для того, чтобы стянуть или положить на него образ.

Когда мы с нашей локальной машины (host) используем изображение для нашего образа без указанного registry, мы дефолтно обращаемся в dockerhub, где стягиваем (pull) по `<image>:<tag>` изображение к нам.

Когда к нашей конструкции образа `registry/image:tag` добавляется `registry`, мы добавляем указание, куда этот образ полетит при пуше и откуда стянется при пулле.

![](_png/Pasted%20image%2020250111120306.png)

Чтобы опубликовать registry, мы можем:

- залить его на github (+ там имеется возможность залить приватно)
- залить на gitlab (на селфхост решении из коробки есть registry)
- залить на dockerhub
- развернуть registry локально

Сложности в локальном использовании заключаются в том, что нужно: 
- покупать доменное имя либо настраивать его локально у себя самому
- иметь подписанные серты для домена

```bash
# запуллит определённый образ
docker pull <image>
# запушит определённый образ
docker push <image>
# тегнет определённый образ
docker tag <image> <tag>

# запуллит все образы, которые описаны в docker-compse.yml
docker compose pull
# опубликует описанные образы
docker compose push

# поиск образов по докерхабу
docker search --no-trunc <image>
```

## GitHub registry

Чтобы у docker была возможность работать с registry, нам нужно создать токен для GH с нужными привилегиями и сохранить его на компьютере

![](_png/Pasted%20image%2020250111124936.png)

Сохраняем в любом месте хоста, где будет удобно дёрнуть токен

```bash
nvim ~/TOKEN.txt
```

Для авторизации используем вывод токена через pipe и передачу его в `login` докера с флагом `--password-stdin`, который принимает в себя pipe данные 

```bash
cat ~/TOKEN.txt | docker login https://ghcr.io -u <github_username> --password-stdin
```

И теперь мы можем позволить себе спуллить из gh любой публичный образ либо наш приватный

```bash
$ docker pull ghcr.io/alaricode/top-api-demo/top-api-test:latest

latest: Pulling from alaricode/top-api-demo/top-api-test
ddad3d7c1e96: Downloading  785.6kB/2.816MB
f845e0f7d73a: Downloading  7.159MB/36.12MB
47d471c4d820: Downloading  801.9kB/2.24MB
1a88008f9c83: Waiting
f7a72abda4da: Waiting
6106deb0d93a: Waiting
0ef759e161b4: Waiting
0ea68650b52d: Waiting
```





## Поднимаем свой registry


















