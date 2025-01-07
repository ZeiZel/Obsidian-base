
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

Bridge позволяет нам объединить в одну сеть несколько контейнеров в рамках одного хоста.

- Очень прост в конфигурации
- Обеспечивает локальный service discovery (обращение одного контейнера к другому по имени)
- работают только на одной хост-машине

Очень удобно поднимать фронт+бэк на одной машине и на продакшенах, где один хост.

### Схема работы

Контейнер подключается к своему виртуальному интернету, который подклчюается к мостовой сети. Каждый контейнер имеет свой ip. А уже сама мостовая сеть смотрит в мир через один ip. 

![](_png/Pasted%20image%2020250107004128.png)

Так же можно выделять связи контейнеров несколькиим бриджами, чтобы разделять их друг от друга. Однако bridge всё так же будет виден из одного ip.

Контейнеры 1 и 2, а так же 2 и 3 - видят друг друга. Контейнеры 1 и 3 никак не могут достучаться друг до друга.

![](_png/Pasted%20image%2020250107004325.png)

Уже на двух машинах это не будет работать. Только в том случае, если мы напрямую через сеть будем обращаться по определённому ip бриджа на другой локалке.

![](_png/Pasted%20image%2020250107004528.png)

Если нам потребуется получить доступ к определённому порту извне, то мы сможем переадресовать через Port Mapping нас на определённый порт.

![](_png/Pasted%20image%2020250107004741.png)

Далее напишем простую утилиту, которая будет выводить список портов ipv4 на устройстве компьютера

```JS
const http = require('http');
const { networkInterfaces } = require('os');

const port = 3000;
const requestHandler = (request, response) => {
	const IPs = getIPs();
	response.end(JSON.stringify(IPs));
}
const server = http.createServer(requestHandler)
server.listen(port, (err) => {
	if (err) {
		return console.log('Ошибка', err)
	}
	console.log(`Сервер запущен на порту ${port}`)
});

const getIPs = () => {
	const nets = networkInterfaces();
	const results = {};

	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			if (net.family === 'IPv4' && !net.internal) {
				if (!results[name]) {
					results[name] = [];
				}
				results[name].push(net.address);
			}
		}
	}
	return results;
}
```

И такой простой докер нам понадобится, в которы мы добавим возможность курлиться

```Dockerfile
FROM node:14-alpine
RUN apk add curl
WORKDIR /opt/app
ADD index.js .
CMD ["node", "./index.js"]
```













## Драйвера host и null
















## DNS






































