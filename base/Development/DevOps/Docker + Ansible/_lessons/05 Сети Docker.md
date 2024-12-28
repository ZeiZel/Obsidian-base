

## Устройство сети Docker

За управление сетями в докере отвечает библиотека Libnetwork. Она пользуется функционалом, доступным в Linux для работы с сетями внутри него.

![](_png/Pasted%20image%2020240822083247.png)

- Она утилизирует неймспейсы сети
- использует виртуальные мосты для соединения одного образа с другим
- виртуализация интернет-подключений
- управляет правилами iptables

![](_png/Pasted%20image%2020240822083349.png)

Контейнер, при поднятии, создаёт виртуальный интернет-адаптер. Этот адаптер подключается к виртуальному мосту и уже сам мост получает доступ в интернет. Через мост несколько контейнеров могут общаться в рамках одного хоста.

![](_png/Pasted%20image%2020240822091246.png)

Так как библиотека для работы с сетью достаточно гибкая, то она может предоставить нам возможность работать с несколькими драйверами, которые определяют поведение работы сети.

- `bridge` - изолирует сеть между всеми контейнерами
- `host` - контейнер будет работать напрямую с сетью компьютера без дополнительных слоёв
- `overlay` - соединяет множество хост-машин в одну сеть для взаимодействия контейнеров
- `macvlan` - создаёт новое физическое устройство со своим mac (сильно влияет на перфоманс сети)
- `null` - не даёт сеть контейнеру

![](_png/Pasted%20image%2020240822091506.png)

Управляется сеть достаточно просто самыми базовыми командами
- `connect`
- `create` - создаст сеть по определённому типу драйвера
- `disconnect`
- `inspect`
- `ls` - отображает сети
- `rm` - удаляет сеть
- `prune` - удаляет неиспользуемые

![](_png/Pasted%20image%2020240822091934.png)

Выведем список доступных сетей докера, которые созданы по-умолчанию

```bash
docker network ls
```

![](_png/Pasted%20image%2020240822092906.png)

Ну и далее можем проинспектировать любую

- `scope` - текущая область сети (локальная, удалённая)
- `driver` - текущий драйвер
- `EnableIPv6` - так же можно подключить ipv6 на сеть
- `IPAM` - хранит список подсетей и их драйверов для всех контейнеров
- `Containers` - хранит список контейнеров, которые подключены к этой сети. По указанному внутри `IPv4Address` можно пингануть контейнер

```bash
docker network inspect bridge
```

```JSON
[
    {
        "Name": "bridge",
        "Id": "ad9007015b1d9bf9dfd4bddf86c95e3ea89d007de5863818083177ae8ded1288",
        "Created": "2024-08-21T18:55:22.413658685+03:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "623903f47a64bf7c3add8bad48d8cbfcfdcfcb73a5fa9262da787e137ddafcc3": {
                "Name": "xenodochial_ptolemy",
                "EndpointID": "b77ee64683f51c83a6249fd2258321607ca632e10c91e21edf9ae054a56b005c",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

## Драйвер bridge


















## Драйвера host и null
















## DNS






































