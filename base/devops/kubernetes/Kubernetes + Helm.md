---
tags:
    - kubernetes
    - helm
    - devops
---

---

## Введение

Как выглядит деплой современного приложения:

1. У нас есть готовый продукт, который мы билдим в приложение
2. Далее нам нужно собрать из нашего приложения контейнер
3. Сам контейнер будет попадать в наш registry, где будет сохраняться версия нашей сборки
4. Далее уже большое количество разных образов оркестрируется с помощью kubernetes, либо с помощью немного устаревшего swarm

![](_png/fe48d15405aa9c275f84cc00475757c5.png)

Swarm - это простое ручное решение для поднятия сразу нескольких контейнеров. Его проще поднять, а так же он является нативным решением. Основным его недостатком являются меньшие возможности относительно кубера и отсутсивие динамического масшатбирования проекта, если у нас будет не хватать мощностей.

Kubernetes - это более сложное решение для оркестрации большого количества контейнеров. У него есть множество готовых решений от различных провайдеров. Он чаще встречается на различных проектах, а так же он достаточно гибок в расширении и обновлении контейнеров. Он может предоставить нам инструментарий бесшовного релиза приложения без его остановки, что не может дать docker без ansible.

![](_png/bca03741f5afd10a3e17acda5bf440ea.png)

---

## Настройка окружения

То, что находится на облаках и локально - это разные вещи. Локально находится только малая база.

- Kubectl - CLI для взаимодействия
- VM driver - виртуальная машина для запуска
- minikube - запускает одну ноду на VM и управляет ей

Minikube имеет огромное количество различных драйверов, через которые можно запустить VM

![](_png/fd160b5d1ad152f56b613556ebbe9cd3.png)

Установить всё дело [можно и вручную по документации](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/), но куда проще будет через homebrew

```bash
brew install kubectl minikube qemu
```

Далее запускаем конфигурацию миникуба

```bash
minikube start --driver qemu
# либо
minikube start --driver docker
```

И получаем список всех досутпных виртуалок

```bash
$ kubectl get all

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   83d
```

---

## Знакомство с kubernetes

### Разные окружения

В рамках локальной разработки мы через kubectl обращаемся к виртуальной машине, которую мы настроили через minikube, и управляем ей.

В проде же у нас будет уже развёрнутый кластер виртуальных машин в стороннем облаке. Там уже будет находиться manage cluster, с которым мы сможем работать через kubectl. Можно и самому его настраивать, но без острой необходимости для работы большой системы - это малонеобходимо.

![](_png/6349b4d0efeb1fd342c17b8a7f0da943.png)

### Компоненты

Представим, что у нас появилась достаточно высокая нагрузка на отдельный сервис в рамках отдельной ноды

![](_png/24e6a151491c949087268a269f125ac9.png)

Если мы пойдём по классическому пути кластеризации, то мы можем поднять рядом в отдельной ноде инстанс наших микросервисов. Однако такой подход не будет эффективным, так как мы заняли много ресурсов вне нужного нам сервиса

![](_png/a70b9048395e393aa0b01ed54d2f3b82.png)

Через кубер у нас появится возможность поднять целую ноду определённого сервиса и легко отмасштабировать его, если появится большая лишняя нагрузка на сервис

![](_png/621704aad1bdcc475d1157ca86ba7b0a.png)

Pod - это самая маленькая единица в kubernetes, которая представляет из себя элемент со своим IP и является абстракцией над определённым контейнером

> Pod может из себя предствлять отдельный контейнер с NGinx, который будет отдавать статику сайта

![](_png/aed3f3c98cd4105b0695c1e0457cd9cc.png)

Service - это элемент, который позволяет обеспечить постоянный доступ к контейнеру

> Например, у контейнера всплывёт memory leak и при достижении порога потребляемой памяти, этот контейнер будет уничтожен

Каждому поду выделяется свой IP в рамках ноды и при пересоздании пода (упал/поднялся), ему переприсваивается другой IP. Отслеживанием обновления адресов и другой информации занимается сервис

![](_png/8f5196356e41317b7994df19fb9015c6.png)

Всего есть два типа сервисов, которые предоставляют доступ к внутренним объектам кластера извне:

- NodePort - обращается к контейнеру по порту (не самый удобный вариант)
- Ingress - обращается извне к поду по домену

![](_png/392840be84c7eebf36fe9363e835ec0e.png)

### Устройство kubernetes

Node - это виртуальная машина или сервер, которая выполняет одну из двух ролей:

1. Master Node - управляет работой подов
2. Worker Node - хранит поды, которые непосредственно выполняются

> В рамках minikube одна нода выполняет все функции

**Kubectl** - это одна из утилит, которая может обращаться к кубернетесу. Когда мы работаем с кластером через интерфейс, мы отправляем запросы в **мастер ноду**, которая управляет остальными подами. Через kubectl мы отправляем запросы на **API Server**, который находится в мастер ноде.

Если мы отправляем запрос на добавление ещё одного пода, наша операция попадает в **Scheduler**, который планирует размещение подов в нодах. **Планировщик** отправляет задание ноде поднять нужный нам под.

Само задание, которое мы получили из мастер ноды от **планировщика**, выполняет **kubelet**. Это процесс, который непосредственно вызывает поднятие пода с нужным контейнером.

Сам **планировщик** имеет информацию о нагрузке каждой ноды и отправляет задание в наименее нагруженную.

Кроме планировщика нам может потребоваться контроллер, который будет управлять жизненным циклом кластера. Если какой-то под упал, то его нужно будет поднять и максимально сохранять заданную конфигурацию кубера, которая была задана человеком. В этом случае нам может понадобиться **Controller Manager**, который контролирует как поды, так и целые ноды, умея перераспределять их, если какие-то из серверов вышли из строя.

Всю информацию каждый элемент не хранит в себе, а берёт и записывает в **Key-Value Storage**, в котором находится информация о нодах, подах и их метаданных.

![](_png/416e86149730065c7449e74042bab366.png)

Так же у нас имеются и другие элементы системы, как Volumes, Configs, Secrets и так далее.

Мастер нод так же может быть несколько.

### Разные подходы

При работе с Kubectl у нас есть несколько подходов к работе с ним

#### Императивный подход

Мы явно указываем то, что мы хотим сделать

Тут мы напрямую взаимодействуем с кластером и просим поднять сервер nginx, который никогда не будет перезапускаться

```bash
kubectl run nginx --image=nginx --restart=Never
```

![](_png/c59aca67f1b383936d749609b972279e.png)

#### Декларативный подход

Мы указываем конечный результат, которого хотим добиться.

В таком случае мы идём от конфига или идеального вида системы, которого хотим добиться

![](_png/7fba65585541192c61ff77258a2ab6a5.png)

#### Когда применять?

Императивный для коротких операций и тестирования, а декларативный нужно применять для поддержки IaC, историчности и для работы с командой разработчиков

![](_png/d12ab5e163efd4c5e20bd0efccc53caf.png)

### Конфигурации

Конфигурация Kubernetes делится на две части: метаданные и спецификация

1. Метаданные

- `apiVersion` - версия используемого API
- `kind` - это тип контейнера, котрый мы описываем (Pod, Service, Node)
- `metadata` - метаданные по описываемому сервису, которые нужны для связи объектов друг с другом

2. Спецификация

Её ключи зависят от типа `kind`, который мы указали, так как для каждого типа контейнера будут свои поля

- `spec` - обозначение начала спецификации
- `containers` - список объектов с описанием контейнеров
- `name` / `image` / `imagePullPolicy` - конфигурации контейнера (имя, изображение, политика пуллинга изображеия)
- `nodeSelector` - конфигурации сервера (ноды), на которых нужно запускать контейнер
- `disktype` - тип дисков, на которых должна запуститься нода

![](_png/3e3e8a0577764755f28c268ddd5bb975.png)

`apiVersion` принимает два параметра: `v1` и `apps/v1`. Второй нужен для того, чтобы управлять другими объектами.

![](_png/b7a7354e886a1cf7fa740a96c264cee7.png)

Kubernetes парсит конфиг и все настройки, которые мы описали, складывает в etcd хранилище, которое используется другими компонентами системы для построения всех нод и подов и сведение их с описанной структурой из конфигурации

![](_png/6ea09ed201c650afc95f8c9829aa8db5.png)

---

## Первый pod

### О приложении

Приложение для сокращения ссылок:

- app сокращает ссылки
- api общается с app
- postgresql занимается хранением данных о ссылках
- ресты `create` / `delete` / `getAll` - создают, удаляют и получают все ссылки
- `/<rest>` - тут уже происходит редирект

![](_png/d567fbc544c2c84952e0691b1c3b266f.png)

### Первый POD

Главное отличие pod от контейнера заключается в том, что это может быть абстракция над несколькими контейнерами. То есть мы можем запустить контейнер с PGSQL и контейнер, который будет его бэкапить.

![](_png/3769177aec801064ba68257b8f7f12bb.png)

Далее укажем такую конфигурацию, в которой будет:

- находиться наш собственный image с docker-образом приложения
- в `ports` укажем `containerPort`, который нам нужно прокинуть наружу, чтобы иметь доступ для получения статики сайта от NGINX
- обязательно указываем `resources`, в котором у нас стоят лимиты, при достижении которых, наш сервис будет перезапущен

`pod.yml`
```YAML
---
apiVersion: v1
kind: Pod
metadata:
  name: short-app
  labels:
    components: frontend
spec:
  containers:
    - name: short-app
      image: antonlarichev/short-app
      ports:
        - containerPort: 80 # прокидываем наружу порт контейнера с NGINX
      # обязательно указываем максимальные ресурсы, которые может кушать контейнер
      resources:
        limits:
          memory: "128mi" # mi - mb
          cpu: "500m" # m - miliprocessors - величина относительная к процессору, но указывает количество доступной нагрузки
```

### Сервис

Сервис позволяет держать с контейнером постоянную связь. Без сервиса нам придётся получать связь каждый раз по IP, который может в любой момент поменяться после редеплоя, если сервис уйдёт в memory leak или упадёт по любой другой причине.

Сервисы бывают 4ёх типов:

- Ingress - позволяет получить доступ к контейнеру извне (например, по домену)
- NodePort - позволяет прокинуть порт изнутри контейнера наружу
- ClusterIP - позволяет общаться сервисам между друг другом (front - back) внутри кластера
- LoadBalancer - балансирует нагрузку, предоставляя доступ к 1 из сервисов извне, который менее всего загружен

![](../../_png/Pasted%20image%2020250831151124.png)

Пользователь обращается к IP-адресу кластера, где запрос уходит на прокси, который ретранслирует через себя все запросы от кластера до определённого сервиса. Потом на сервис, который выводит порт из POD в мир.

![](_png/d25bcb098ff35984355fbe1aae0ba05e.png)

Kube-Proxy требует, чтобы в конфиге было понятно, откуда и куда какой порт проксировать. Поэтому нам нужно будет указать в спеках порты прохода запросов.

- `nodePort` говорит, что при обращении к кластеру по данному порту, мы должны прокинуть запрос в определённый сервис (в котором мы указали этот порт)
- `targetPort` говорит нам на какой порт пода мы должны стучаться, когда уже попали в сервис
- `port` - это внутренний порт для кластера, по которому другие поды смогут достучаться до нашего пода

Для доступа извне нам нужна связка `nodePort` и `targetPort`. В нашем случае, `targetPort` будет равен `containerPort` из конфига пода, так как через `targetPort` нам нужно достучаться до приложения извне кластера

![](_png/f67577d3987cc6e81548baaaa7e8d941.png)

Дальше нам останется только привязать сервис к определённому поду через селектор. В качестве селектора будет выступать заданный ранее лейбл в поде

`node-port.yml`
```YAML
---
apiVersion: v1
kind: Service
metadata:
  name: short-app-port
spec:
  type: NodePort
  # порты для доступа к контейнеру извне кластера
  ports:
   - port: 3000
     targetPort: 80
     nodePort: 31200
  # селектор для связи пода и сервиса
  selectors:
    components: frontend
```

Этот сервис `node-port.yml` позволит нам подключиться извне (то есть получить ответ вне kubernetes) по порту 31200 к сервисам, для которых он открыл доступ (к фронту). 

### Подключение к контейнеру

Через утилиту `kubectl` мы можем выполнять все операции по работе с кластером.

#### Применение конфига

Через `apply` мы можем применить определённый конфиг к нашему кластеру для выполнения.

```bash
# запускаем все файлы в папке
kubectl apply -f .

# либо можно запустить отдельный файл
kubectl apply -f pod.yml
```

#### Инспект конфига

Через `get` мы можем проинспектировать определённый элемент нашей системы.

`all` позволяет получить все возможные образы, которые были запущены ранее в определённом кластере

```bash
$ kubectl get all

NAME            READY   STATUS         RESTARTS   AGE
pod/short-app   0/1     ErrImagePull   0          13s

NAME                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
service/kubernetes       ClusterIP   10.96.0.1      <none>        443/TCP          5m25s
service/short-app-port   NodePort    10.110.44.54   <none>        3000:31200/TCP   4s
```

Так же ничто нам не мешает вывести только поды

```bash
$ kubectl get pods

NAME        READY   STATUS    RESTARTS   AGE
short-app   1/1     Running   0          3m43s
```

Ну и так же отдельно можно взглянуть на запущенные сервисы

```bash
$ kubectl get services

NAME             TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
kubernetes       ClusterIP   10.96.0.1      <none>        443/TCP          11m
short-app-port   NodePort    10.110.44.54   <none>        3000:31200/TCP  6m8s
```

#### Коннект к контейнеру

Чтобы отправить запрос в кластер, нам нужно будет получить ip кластера, который мы создали через `minikube`

```bash
$ minikube ip

192.168.58.2
```

Теперь можно по `http://192.168.58.2:31200` получить доступ к фронту, который был поднят из кубера

![](_png/4a2147e5aafac442e5801f575f7dc032.png)

### Как работает запуск

`kubectl` отправил запрос в Master ноду в API Service и передал в него конфиг

![](_png/a716994ab2d654b807d320a4d12f3ff4.png)

Дальше планировщик ищет ноду, где он сможет запустить наш конфиг `short-app`. У нас пока одна нода.

![](_png/367be4f80fcf5a6a8f31a43bc6e45037.png)

Дальше уже Controller Manager зафиксировал тот факт, что у нас должен быть один инстанс `short-app`.
Если наше приложение упадёт, то CM попросит запланировать Scheduler снова поднять контейнер в ноде.

На этом же шаге kubelet (администрирующий нашу ноду) стягивает image из dockerhub и поднимает POD

![](_png/0700f177a5e63f858d3d4df02e58ad4a.png)

Со стороны Pod у нас всего несколько этапов:

- Scheduled - запланирован
- Pull - стягивает image, если его нет локально, чтобы запустить
- Create - создаётся Pod
- Start - запускается Pod с контейнером

Чтобы получить полностью всю информацию о запуске пода, мы можем воспользоваться `kubectl describe`, где есть вся информация по подах

```bash
$ kubectl describe pods short-app

Name:             short-app
Namespace:        default
Priority:         0
Service Account:  default
Node:             minikube/192.168.58.2
Start Time:       Sun, 22 Jun 2025 16:30:10 +0300
Labels:           components=frontend
Annotations:      <none>
Status:           Running
IP:               10.244.0.3
IPs:
  IP:  10.244.0.3
Containers:
  short-app:
    Container ID:   docker://465ab518889b248c72f6aaad19df0bef319f53a7edc3d9ff4fd105e2e9b1d378
    Image:          antonlarichev/short-app
    Image ID:       docker-pullable://antonlarichev/short-app@sha256:ecf6b7afbfc7b40b27516953c5dffc7325d5fe95ce811f43faa064ed2c86dcd9
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Sun, 22 Jun 2025 16:30:39 +0300
    Ready:          True
    Restart Count:  0
    Limits:
      cpu:     500m
      memory:  128Mi
    Requests:
      cpu:        500m
      memory:     128Mi
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-jr4c4 (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True
  Initialized                 True
  Ready                       True
  ContainersReady             True
  PodScheduled                True
Volumes:
  kube-api-access-jr4c4:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   Guaranteed
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  40m                default-scheduler  Successfully assigned default/short-app to minikube
  Warning  Failed     40m                kubelet            Failed to pull image "antonlarichev/short-app": Error response from daemon: Get "https://registry-1.docker.io/v2/": tls: received record with version 857 when expecting version 303
  Warning  Failed     40m                kubelet            Error: ErrImagePull
  Normal   BackOff    40m                kubelet            Back-off pulling image "antonlarichev/short-app"
  Warning  Failed     40m                kubelet            Error: ImagePullBackOff
  Normal   Pulling    40m (x2 over 40m)  kubelet            Pulling image "antonlarichev/short-app"
  Normal   Pulled     40m                kubelet            Successfully pulled image "antonlarichev/short-app" in 14.328s (14.328s including waiting). Image size: 109145336 bytes.
  Normal   Created    40m                kubelet            Created container: short-app
  Normal   Started    40m                kubelet            Started container short-app
```

Уже ближе к концу виднеется поле Events, в котором описаны все операции и ошибки, которые могли произойти во время сборки. Тут можно заметить, что первые несколько операций прошли с ошибкой и не получилось сразу стянуть с registry валидные данные. Потом уже только после бэк-оффа произошёл пуллинг.

Так же мы можем проинспектировать и сервис. Тут уже меньше информации по айтему, но всё же тут указаны открытые порты, тип, имя и остальные параметры, по которым можно определить точки доступа для запроса

```bash
$ kubectl describe service short-app-port

Name:                     short-app-port
Namespace:                default
Labels:                   <none>
Annotations:              <none>
Selector:                 components=frontend
Type:                     NodePort
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.110.44.54
IPs:                      10.110.44.54
Port:                     <unset>  3000/TCP
TargetPort:               80/TCP
NodePort:                 <unset>  31200/TCP
Endpoints:                10.244.0.3:80
Session Affinity:         None
External Traffic Policy:  Cluster
Internal Traffic Policy:  Cluster
Events:                   <none>
```



---

## Работа с объектами

### Императивный подход

Если нам нужно что-то быстро протестировать или изменить быстро в кластере, то можно воспользоваться императивным подходом и накатить изменения в архитектуру через командную строку командой

```bash
kubectl run my-pod --image=antonlarichev/short-app --labels="component=backend"
```

Командой `delete` мы можем удалить ненужный нам Pod

```bash
$ kubectl delete pod my-pod

pod "my-pod" deleted
```

>[!warning] Использовать такой подход на настоящей инфраструктуре нельзя, так как эта команда останется только в истории наших команд в терминале и не более

### Обновление объектов

В K8s доступно лёгкое обновление наших сервисов посредством изменения конфигурации

Проверим, что у нас остался старый сервис и его `Image` имеет старый формат

```bash
$ kubectl describe pods short-app

IPs:
  IP:  10.244.0.4
Containers:
  short-app:
    Container ID:   docker://da7564c24bc48ff4e841296ef9be550a128a1ebce36c5b1730dc01a3caf860d0
    Image:          antonlarichev/short-app
    Image ID:       docker-pullable://antonlarichev/short-app@sha256:ecf6b7afbfc7b40b27516953c5dffc7325d5fe95ce811f43faa064ed2c86dcd9
    Port:           80/TCP
```

Заменим на другое изображение

`pod.yml`
```YML
spec:
  containers:
    - name: short-app
      image: antonlarichev/short-api
```

Переприменим команду `apply` и в наш планировщик попадёт задача об изменении изображения в поде

```bash
$ kubectl apply -f .

service/short-app-port unchanged
pod/short-app configured
```

И теперь можно опять запросить описание пода. Тут описаны все ивенты, которые произошли с ним. Перед обновлением изображения, под был убит, чтобы стянуть новый image и запустить заново контейнер внутри пода

`Image` так же поменялся на `api`

```bash
$ kubectl describe pods short-app

Containers:
  short-app:
    Container ID:   docker://da7564c24bc48ff4e841296ef9be550a128a1ebce36c5b1730dc01a3caf860d0
    Image:          antonlarichev/short-api

Events:
  Type    Reason     Age    From               Message
  ----    ------     ----   ----               -------
  Normal  Scheduled  7m14s  default-scheduler  Successfully assigned default/short-app to minikube
  Normal  Pulling    7m13s  kubelet            Pulling image "antonlarichev/short-app"
  Normal  Pulled     6m59s  kubelet            Successfully pulled image "antonlarichev/short-app" in 14.64s (14.64s including waiting). Image size: 109145336 bytes.
  Normal  Created    6m59s  kubelet            Created container: short-app
  Normal  Started    6m59s  kubelet            Started container short-app
  Normal  Killing    4m9s   kubelet            Container short-app definition changed, will be restarted
  Normal  Pulling    4m9s   kubelet            Pulling image "antonlarichev/short-api"

```

Обновление происходит следующим образом:
1. Мы применили в первый раз конфигурацию
2. Kube API по metadata сначала пошёл искать существующий под, ничего не нашёл и создал новый под с нашей описанной конфигурацией
3. Изменили конфигурацию и поменяли в ней, например, `image`
4. Применили новую конфигурацию
5. Новая конфигурация попала в Kube. Он по metadata понял, что такой pod уже существует. Далее он сравнивает изменения, которые произошли в конфигурации и применяет эти изменения для выделенного пода

![](../../_png/Pasted%20image%2020250828211537.png)

Однако, у обновлений есть некоторые ограничения. Например, мы не можем изменить `containerPort` и должны будем завязаться на заранее определённом порту, либо переподнимать отдельно этот под, чтобы изменения вступили в силу

`pod.yml`
```YML
      ports:
        - containerPort: 81
```

```bash
$ kubectl apply -f .

service/short-app-port unchanged
The Pod "short-app" is invalid: spec: Forbidden: pod updates may not change fields other than `spec.containers[*].image`,`spec.initContainers[*].image`,`spec.activeDeadlineSeconds`,`spec.tolerations` (only additions to existing tolerations),`spec.terminationGracePeriodSeconds` (allow it to be set to 1 if it was previously negative)
  core.PodSpec{
        Volumes:        {{Name: "kube-api-access-drpmm", VolumeSource: {Projected: &{Sources: {{ServiceAccountToken: &{ExpirationSeconds: 3607, Path: "token"}}, {ConfigMap: &{LocalObjectReference: {Name: "kube-root-ca.crt"}, Items: {{Key: "ca.crt", Path: "ca.crt"}}}}, {DownwardAPI: &{Items: {{Path: "namespace", FieldRef: &{APIVersion: "v1", FieldPath: "metadata.namespace"}}}}}}, DefaultMode: &420}}}},
        InitContainers: nil,
        Containers: []core.Container{
                {
                        ... // 3 identical fields
                        Args:       nil,
                        WorkingDir: "",
                        Ports: []core.ContainerPort{
                                {
                                        Name:          "",
                                        HostPort:      0,
-                                       ContainerPort: 80,
+                                       ContainerPort: 81,
                                        Protocol:      "TCP",
                                        HostIP:        "",
                                },
                        },
                        EnvFrom: nil,

```

>[!info] Порты можно не указывать. K8s автоматически выводит наружу открытые порты. Однако указание портов является хорошей практикой для ведения ясной конфигурации. 

### Deployments

Управление pods напрямую - это более низкоуровневый кейс использования k8s. Чаще всего такие изменения происходят через механизм deployments, который контролирует сразу несколько подов

![](../../_png/Pasted%20image%2020250828213728.png)

1. Эта сущность описывается, как `kind: Deloyment`
2. `replicas` - количество реплик этих деплойментов, которые будут дефолтно созданы
3. `selector` - это селекторы, по которым деплой сможет определить поды, которыми он будет рулить
4. `template` - это раздел, в который мы можем поместить шаблон пода, которым будет управлять деплой. Конкретно здесь находится полное описание сущности типа `kind: Pod`, т.е. интерфейс описания `template` = `kind: Pod`

`app-deployment.yml`
```YML
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: short-app-demo
spec:
  # количество реплик подов
  replicas: 1
  # селекторы, по которым будет происходить связывание с подами
  selector:
    matchLabels:
      components: frontend
  # шаблон, который описывает то, что мы хотим запустить
  template:
    # тут находится всё то же самое, что и в pod
    metadata:
      labels:
        components: frontend
    spec:
      containers:
        - name: short-app
          image: antonlarichev/short-api
          ports:
            - containerPort: 81
          resources:
            limits:
              memory: 128Mi
              cpu: 500m
```

### Использование Deployments

Поднимаем деплой

```bash
$ kubectl apply -f ./app-deployment.yml

$ kubectl get all

NAME                                  READY   STATUS      RESTARTS      AGE
pod/short-app-demo-7fc4f85f64-dlqkn   0/1     OOMKilled   1 (11s ago)   17s

NAME                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
service/kubernetes       ClusterIP   10.96.0.1        <none>        443/TCP          24h
service/short-app-port   NodePort    10.105.253.142   <none>        3000:31200/TCP   21h

NAME                             READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/short-app-demo   0/1     1            0           17s

NAME                                        DESIRED   CURRENT   READY   AGE
replicaset.apps/short-app-demo-7fc4f85f64   1         1         0       17s
```

И теперь после вывода пода, у нас появляется наше приложение с уникальным идентификатором

```bash
$ kubectl get pod
NAME                              READY   STATUS             RESTARTS      AGE
short-app-demo-7fc4f85f64-dlqkn   0/1     CrashLoopBackOff   4 (23s ago) 2m12s
```

Так же мы можем вывести сущность `deployment.apps`, которая будет нам отображать наши деплои. Она является более высокоуровневой по отношению к pod. 

```bash
$ kubectl get deployments.apps
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
short-app-demo   0/1     1            0           3h19m
```

Если мы запросим описание нашего деплоя, то тут мы увидим подробную информацию по его контейнерам и портам, а так же количеству реплик, которые созданы для определённого приложения

```bash
$ kubectl describe deployments.apps

OldReplicaSets:  <none>
NewReplicaSet:   short-app-demo-7fc4f85f64 (1/1 replicas created)
Events:          <none>
```

> Теперь приложение работает ровно так же, как и раньше, когда мы его поднимали через pod. 

### Масштабирование Deployments

Основным преимуществом использования Deplyment по отношению к поднятию Pod является возможность простого масштабирования сервисов

#### Работа с подами

Изменим немного нашу конфигурацию деплоёмента и поменяем там изображение

```YML
    spec:
      containers:
        - name: short-app
          image: antonlarichev/short-api
```

Далее применим его ещё раз

```bash
$ kubectl apply -f ./app-deployment.yml

deployment.apps/short-app-demo configured
```

Если успеть быстро вывести все поды, то мы заметим, что у нас будет сразу несколько подов одного нашего сервиса. 

Сейчас происходит безопасная замена одного пода на другой и старый pod k8s удалит, когда новый pod перейдёт в статус Running

```bash
$ kubectl get pods

NAME                              READY   STATUS              RESTARTS   AGE
short-app-demo-6f486d58b9-px5dm   1/1     Running             0          27s
short-app-demo-7fc4f85f64-cdr6k   0/1     ContainerCreating   0          1s
```

Теперь попробуем изменить порт, который не удалось изменить в старом случае, когда мы работали только с подом

```YML
  template:
    # тут находится всё то же самое, что и в pod
    metadata:
      labels:
        components: frontend
    spec:
      containers:
        - name: short-app
          image: antonlarichev/short-app
          ports:
            - containerPort: 3000
```

Далее переприменяем конфиг и при вызове описания подов деплоя, мы получим информацию о том, что под запущен на новом порту

```bash
$ kubectl apply -f ./old/app-deployment.yml

deployment.apps/short-app-demo configured

$ kubectl get pods                         

NAME                              READY   STATUS    RESTARTS   AGE
short-app-demo-745dcbb6cc-87v55   1/1     Running   0          10s

$ kubectl describe deployments.apps

Pod Template:
  Labels:  components=frontend
  Containers:
   short-app:
    Image:      antonlarichev/short-app
    Port:       3000/TCP
    Host Port:  0/TCP
```

#### Работа с репликами

Сейчас нам стоит почистить деплой перед тем как начать работать с выделением новых ресурсов.

```bash
$ kubectl delete deployments.apps short-app-demo 

deployment.apps "short-app-demo" deleted
```

А теперь заменим количество процессорных мощностей с 500 микропроцессоров (50% загрузки процессора) до 100 (10% загрузки), а так же увеличим количество реплик с 1 до 5 штук

`app-deployment.yml`
```YML
spec:
  replicas: 5
  selector:
    matchLabels:
      components: frontend
  template:
    metadata:
      labels:
        components: frontend
    spec:
      containers:
        - name: short-app
          image: antonlarichev/short-app
          ports:
            - containerPort: 3000
          resources:
            limits:
              memory: 128Mi
              cpu: 100m
```

И теперь у нас мгновенно стало доступно 5 реплик нашего приложения. Количество необходимых реплик в конфиге мы можем менять на лету в зависимости от наших потребностей (включая автоматическую подстройку).

```bash
$ kubectl get pods                         

NAME                             READY   STATUS    RESTARTS   AGE
short-app-demo-665974dd9-nz6lx   1/1     Running   0          10s
short-app-demo-665974dd9-p9sh9   1/1     Running   0          10s
short-app-demo-665974dd9-r7bmw   1/1     Running   0          10s
short-app-demo-665974dd9-rt7n2   1/1     Running   0          10s
short-app-demo-665974dd9-vsc4m   1/1     Running   0          10s

$ kubectl get deployments.apps

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
short-app-demo   5/5     5            5           23s
```

### Обновление Image

Представим такую ситуацию: 
- у нас есть `app-deployment.yml` с сервисом типа `Deployment`
- в нём используется `image` с тегом `latest` (как сейчас `antonlarichev/short-app:latest`)
- нам нужно обновить образ, который соответствует этому тегу (прошлый image с тегом latest и залили новый с тем же самым тегом)

Так как deployment остаётся неизменным, то применение `apply` на конфиге не даст никакого эффекта и новый image не будет загружен.

#### Неправильный вариант

Первый вариант, который является неверным - это удаление деплоймента и пересоздание сервиса

```bash
kubectl delete deployments.apps short-app-demo
kubectl apply -f app-deployment.yml
```

#### Правильный вариант

Самым верным вариантом для обновления изображения в кубере - это будет использование изображения Docker не с тегом `latest`, а с определённой версией 

![](../../_png/Pasted%20image%2020250831125223.png)

Тогда команда `apply` будет применяться, так как мы изменили изображение в самом конфиге

```YML
    spec:
      containers:
        - name: short-app
          image: antonlarichev/short-app:v1.0
```

```bash
kubectl apply -f app-deployment.yml
```

### Rollout

Команда `rollout` предоставляет доступ к...

#### История изменений

Группа `history` позволяет получить доступ к определённым операциям в сервисах `deployment`, `daemonset`, `statefulset`. Конкретно тут мы можем взглянуть на историю дейплоймента определённого сервиса. 

В истории у нас отображается номер ревизии и причина изменения, которую мы можем указать командой после применения конфига

```bash
$ kubectl rollout history deployment short-app-demo                              
deployment.apps/short-app-demo 
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

Сейчас для примера изменим `image` ад-хоком в деплойменте

```bash
kubectl set image deployment.apps/short-app-demo short-app=antonlarichev/short-app:latest 
```
И количество элементов в истории изменится
```bash
$ kubectl rollout history deployment short-app-demo
deployment.apps/short-app-demo 
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
3         <none>
```

#### Редеплой

И решением проблемы из прошлого урока, когда у нас изображение с тегом `latest`, так же может являться `rollout`

Установим последнюю сборку `latest` и установим параметр `imagePullPolicy` в `Always`, чтобы k8s всегда запрашивал новое изображение при перезапуске конфигурации  

`app-deployment.yml`
```YML
    spec:
      containers:
        - name: short-app
          image: antonlarichev/short-app:latest
          imagePullPolicy: Always
```

С помощью `restart` мы можем перезапустить деплоймент с новой конфигурацией

```bash
kubectl rollout restart deployment short-app-demo
```

>[!warning] `rollout restart` в качестве обновления `latest` - плохая практика
>Такой подход работы с деплоями так же является опасным, потому что последняя сборка может содержать множество багов, а откат к предыдущей версии окажется невозможным. Поэтому лучшим вариантом так же останется обновление `image` через указание версий, чтобы была возможность сделать быстрый откат до нужной версии (`v1.0` -> `v1.1`). 



---

## Работа с сетью

### ClusterIP

Сейчас мы попробуем развернуть приложение подобного вида: 
- У нас будет кластер с доступом в него по ingress-контроллеру
- Внутри будут крутиться по два инстанса наших сервисов, которые будут объеденены друг с другом по ClusterIP
- api будет связан с pgsql так же по clusterip

![](../../_png/Pasted%20image%2020250831133242.png)

Тут нам понадобится NodePort, так как доступ по ip нам нужен будет внутри, чтобы туда не смогли постучаться снаружи

![](../../_png/Pasted%20image%2020250831143046.png)

NodePort на production нам не нужен и доступ в сервисы по портам 80/443 по портам будет предоставлять Ingress

Сущность ClusterIP будет скрывать под собой любое количество нашего отдельного сервиса, тем самым объединяя их

![](../../_png/Pasted%20image%2020250831143534.png)

Доступа к этой сущности извне не будет

![](../../_png/Pasted%20image%2020250831143648.png)

Для проброса запросов нам понадобится отдельный Ingress сервис

![](../../_png/Pasted%20image%2020250831143719.png)

Сам Ingress обеспечивает доступ по домену, позволяя безопасно предоставить доступ к системе

![](../../_png/Pasted%20image%2020250831143746.png)

### Пишем ClusterIP

Очистим перед началом все прошлые сервисы

```bash
kubectl delete deployments.apps short-app-demo
kubectl delete service short-app-port
```

Создаём полностью новое окружение, в котором будет наш деплой. Реплика сервисов будет только одна.

```YML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: short-app-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: frontend
  template:
    metadata:
      labels:
        components: frontend
    spec:
      containers:
        - name: short-app
          image: antonlarichev/short-app:v1.0
          ports:
            - containerPort: 80
          resources:
            limits:
              memory: "128Mi"
```

И поднимем новый тип сервиса `ClusterIP`, который будет доступен по 80 порту и будет содержать в себе (по селекторам) компоненты `frontend`

`app-service.yml`
```YML
# тут будет просто v1, так как мы работаем с сервисом
apiVersion: v1
kind: Service
metadata:
  name: short-app-clusterip
spec:
  # поменяем тип
  type: ClusterIP
  ports:
	# значение порта соответствует тому, что задано в спеке контейнеров приложения фронта
    - port: 80
      protocol: TCP
  selector:
    components: frontend
```

>[!fail] Для запуска на маке потребовалось добавить `targetPort: 3000` в объект вместе с `port: 80`

Применим обе конфигурации

```bash
kubectl apply -f ./app-deployment.yml
kubectl apply -f ./app-service.yml
```

И теперь из-за отсутствия NodePort мы потеряли доступ к нашим сервисам. Через curl видно, что мы не сможем подключиться извне никак к нашим сервисам  

![](../../_png/Pasted%20image%2020250831150006.png)

### Ingress

Ingress - это сервис, который предоставляет нам входную точку в наше приложение aka Gateway. Он обеспечивает вход по домену в наш кластер и управляет логикой распределения входящего трафика в зависимости от паттерна общения, url и хоста

Использование LoadBalancer заместо Ingress валидно в меньшем числе случаев, так как множество реализованных сервисов под Ingress как раз могут иметь под собой балансировку нагрузки через NGINX

Что происходит при входе клиента по домену:
- Как только пользователь переходит на наш домен `demo.test`
- Запрос переходит на связанный через DNS наш IP
- По этому IP располагается доступ к нашему кластеру 

Требования: 
- При переходе на `/` мы должны получать наш фронт
- При отправке запроса на `/api`, он должен лететь на сервер

![](../../_png/Pasted%20image%2020250831143746.png)

Типов Ingress контроллеров сразу несколько, но проще всего будет пользоваться NGINX, который сразу присутствует в k8s

Разные провайдеры могут по-разному реализовать этот контроллер: через AWS, Google Cloud и так далее

![](../../_png/Pasted%20image%2020250831153633.png)

Конфигурация Ingress представляет из себя конфиг как и любого другого сервиса. 

В самом дефолтном случае, у нас в minikube будет использоваться дефолтный NGINX, который и будет проксировать все наши запросы

![](../../_png/Pasted%20image%2020250831153828.png)

Но если мы развернём нашу конфигурацию, например, в Google Cloud, то он добавит от себя ещё объект балансировщика, который будет так же обрабатывать и пропускать через себя запросы

![](../../_png/Pasted%20image%2020250831154013.png)

По-сути для реализации полного доступа к нашей системе, нам нужно будет только поднять ClusterIP (для общения сервисов внутри кластера и обеспечения корневого доступа сразу ко всем сервисам под этим IP) и Ingress (для Gateway доступа)

### Подготовка minikube

Контроллер Ingress доступен в minikube через аддоны, которые мы можем дополнительно установить

#### Включение ingress

Выведем список аддонов

```bash
minikube addons list
```

И тут отображён список включенных и выключенных аддонов

![](../../_png/Pasted%20image%2020250831154558.png)

Включим аддон ingress. У нас скачается аддон ingress-nginx, после установки которого будет доступны наши сервисы по localhost ip `127.0.0.1`

```bash
minikube addons enable ingress
```

#### Создание локального домена

Сначала получим актуальный ip нашего minikube

```bash
$ minikube ip

192.168.49.2
```

Дальше нам нужно будет поднять отдельный домен для разработки внутри нашего ПК

```bash
sudo nvim /etc/hosts
```

И добавим строку `ip domain` в нашу конфигурацию хостов

>[!info] Желательно в наименовании домена добавить `.dev`, `.test` или использовать `localhost`, чтобы форсированно не ловить редиректы на `https` от хромиумных браузеров

```
192.168.49.2		demo.test
```

>[!fail] Для запуска на маке потребовалось поменять на `127.0.0.1 localhost demo.test`

### Настройка Ingress

Далее опишем Ingress контроллер в виде конфигурации k8s

`ingress.yml`
```YML
# используем последнюю версию API для Ingress сервисов
apiVersion: networking.k8s.io/v1
# тут напрямую укажем Ingress
kind: Ingress
metadata:
  name: myingress
  # annotations представляет собой дополнительные конфигурации контроллера
  # конкретно тут будут храниться дополнительные конфигурации самого NGINX
  annotations:
	# этой настройкой мы добавляем базовый url
    nginx.ingress.kubernetes.io/add-base-url: "true" 
spec:
  # имя класса ingress контроллера будет содержать nginx
  ingressClassName: nginx
  # описание правил редиректов
  rules:
  - host: demo.test # корневой домен, с которого нужно обрабатывать запросы
    http:
	  # правила путей в виде массива
      paths:
      - pathType: Prefix # смотрим на префикс запроса
        path: "/" # при попадании на "/" корень домена
        backend: # то, куда мы перенаправляем
          # перенаправим запрос на сервис
          service:  
	        # с ClusterIP по имени (из app-service.yml)
            name: short-app-clusterip
	        # и с портом 80 
	        # (который указан как прослушиваемый в app-service.yml)
            port: 
              number: 80
```

И получаем объект ingress

```bash
$ kubectl get ingress
NAME        CLASS   HOSTS       ADDRESS   PORTS   AGE
myingress   nginx   demo.test             80      9s
```

Теперь по домену `demo.test` у нас будет доступен фронт без обращения по ip и порту

![](../../_png/Pasted%20image%2020250831172100.png)



---

## Volumes

### Deployment базы

Так будет выглядеть деплой PGSQL. Тут мы укажем конкретную версию PGSQL и задефайним выходящий наружу порт 5432

`postgres-deployment.yml`
```bash
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: postgres
  template:
    metadata:
      labels:
        components: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16.0
          ports:
            - containerPort: 5432
          resources:
            limits:
              memory: "500Mi"
              cpu: "300m"
```

И всё под собой закрывать будет ClusterIP с коннектом по порту 5432 из деплоя и связыванием по компоненту указанным, так же в деплое postgres

`postgres-service.yml`
```YML
apiVersion: v1
kind: Service
metadata:
  name: postgres-clusterip
spec:
  type: ClusterIP
  ports:
    - port: 5432
      protocol: TCP
  selector:
    components: postgres
```

### Env

Переменные окружения передаются в параметр `env` отдельного контейнера. Это, преимущественно, публичные данные, которые не являются секретами. 

Представляют собой массив объектов с именем переменной и значением.

`postgres-deployment.yml`
```YML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: postgres
  template:
    metadata:
      labels:
        components: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16.0
          ports:
            - containerPort: 5432
          # env переменные
          env:
            - name: POSTGRES_DB
              value: demo
            - name: POSTGRES_USER
              value: demo
            - name: POSTGRES_PASSWORD
              value: demo
          resources:
            limits:
              memory: "500Mi"
              cpu: "300m"
```

Запускаем конфиг

```bash
kubectl apply -f ./old/postgres-deployment.yml
kubectl apply -f ./old/postgres-service.yml
```

### Port forwarding

Сейчас нам нужно будет напрямую поработать с нашей базой данных через 

Для этого нам нужно будет прокинуть порт из pod наружу на наш компьютер. Сделать это можно с помощью механизма port-forwarding

```bash
$ kubectl port-forward pods/postgres-deployment-5c6b78897c-cbqgb 5432:5432

Forwarding from 127.0.0.1:5432 -> 5432
Forwarding from [::1]:5432 -> 5432
```

Далее, с помощью любого интерфейса, мы сможем подключиться извне к нашей БД

![](../../_png/Pasted%20image%2020250901100218.png)

Далее создаём таблицу Link с нужными для нашего API сервиса полями

```SQL
CREATE TABLE "Link" (
  "id" SERIAL NOT NULL,
  "url" TEXT NOT NULL,
  "hash" TEXT NOT NULL,

  CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);
```

![](../../_png/Pasted%20image%2020250901100613.png)

#### Проблема

Перезапустим наш деплой с postgres

```bash
kubectl rollout restart deployment postgres-deployment
kubectl port-forward pods/postgres-deployment-fd49bc75-qdbqn 5432:5432
```

И можно заметить, что все данные из нашей базы пропали, так как под с базой пересоздался

![](../../_png/Pasted%20image%2020250901100948.png)

Далее нам нужно будет создать персистентное хранилище для нашей базы

### Volumes

Volume в Docker и k8s - это немного разные сущности

Сейчас данные, которые генерирует контейнер, хранятся прямо рядом с сервисом внутри контейнера. Поэтому при перезапуске PGSQL у нас терялись данные базы. 

![](../../_png/Pasted%20image%2020250901101158.png)

Для решения проблемы в k8s существуют данные объекты: 
- Volume
- Persistent Volume
- Persistent Volume Claim

![](../../_png/Pasted%20image%2020250901103036.png)

#### Volume

Volume - это контейнер, который находится рядом с контейнером сервиса. Он сможет сохранить данные после перезагрузки, но потеряет их, если мы пересоздадим под.

![](../../_png/Pasted%20image%2020250901101621.png)

Плюсом данного Volume является возможность шарить данные между несколькими контейнерами внутри одного пода

#### Persistent Volume

Persistent Volume (PV) - это объект, который так же находится внутри k8s, но с той разницей, что он уже находится вне pod и к нему может подключиться pod после перезагрузки или обновления

![](../../_png/Pasted%20image%2020250901101937.png)

Такой подход позволяет создать Stateless Pod, то есть сколько бы раз нам не пришлось перезапустить Pod, он всегда сможет восстановить своё состояние, так как его данные находятся вне его контейнера.

##### Persistent Volume Claim

Persistent Volume Claim (PVC) - это сущность, которая предоставляет Persisted Volume хранилище для пода. 

Pod запрашивает у PVC хранилище на 100 гб, которое второй ему должен предоставить по запросу

![](../../_png/Pasted%20image%2020250901102333.png)

Мы можем создать несколько статичных PV на определённое количество пространства. Это **Static PV**. 

Если Pod потребует Volume другого размера, то PVC создасть **Dynamic PV** на нужное количество места для пода. 

### Персистентность

Мы задеплоили pod с нашим контейнером. Внутри этого контейнера хранятся данные, которые нужны для работы сервиса. 

![](../../_png/Pasted%20image%2020250901103924.png)

После перезапуска pod, его внутренние данные, с которыми он работал, стираются

![](../../_png/Pasted%20image%2020250901104036.png)

И новый pod теперь не буедт работать ни с какими старыми данными

![](../../_png/Pasted%20image%2020250901104055.png)

Первое возможное решение этой проблемы - создание Persisted Volume. Новый объект, который находится вне Pod и сохраняет его данные между пересозданием основного сервиса. 

![](../../_png/Pasted%20image%2020250901104150.png)

Теперь после пересоздания Pod, его данные не будут теряться, а новый Pod с нашим сервисом будет тянуть старые данные из PV

![](../../_png/Pasted%20image%2020250901104350.png)

Теперь новый Pod работает так, как мы и ожидали

![](../../_png/Pasted%20image%2020250901104605.png)

Но тут мы можем столкнуться с такой проблемой, что два разных инстанса нашего сервиса (например pgsql) могут тянуть данные из одного volume (т.е. данные будут шариться между подами)

Доступ к данным БД должна иметь только один инстанс БД, иначе это приведёт к конфликтам и коллизиям в итоговых данных

![](../../_png/Pasted%20image%2020250901104722.png)

Для правильной работы PV с pgsql, нам нужно будет под каждую реплику pgsql поднять свой PV. Иначе, если одна база запишет данные, а другая их прочитает и увидит неконсистентность, то наш сервис с БД ляжет. 

В целом, когда мы работаем с PV, нам нужно всегда понимать и держать в голове, сколько разных инстансов Pod будет работать с этим PV, чтобы не иметь проблем с конфликтами данных.

### PersistentVolumeClaim

Опишем конфигурацию сервиса PVC, который должен выдавать на запрос пода пространство равное 1 гигабайту памяти под один сервис

`postgres-pvc.yml`
```YML
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  resources:
    requests:
      storage: 1Gi # пространство 1ГБ
  accessModes:
    - ReadWriteOnce # использовать может только один инстанс postgres
```

Режимов доступа к сервису у нас сразу несколько: 

![](../../_png/Pasted%20image%2020250901130124.png)

### StorageClass

Когда мы описываем PVC, то кубер (локально minikube) сразу определяет себе пространство, которое он будет занимать и при запросе от сервиса выделить из этого пространства кусочек для пользования сервисами

![](../../_png/Pasted%20image%2020250901131059.png)

Но когда мы говорим про удалённый запуск, у нас уже реализации будут немного отличаться друг от друга. 

В облаке кубер без конфигурации не имеет представления, откуда брать пространство, которое нужно выделить для сервиса. Однако облачные провайдеры преконфигурируют кубер так, чтобы он понимал, откуда нужно брать пространство для подов. 

![](../../_png/Pasted%20image%2020250901131240.png)

Узнать, какой тип пространства у нас выделен для k8s на данном устройстве, можно через:

```bash
kubectl get storageclasses.storage.k8s.io
```

StorageClass - это обозначение того, как мы должны взаимодействовать с определённым пространством. Он взаимодействует с разными типами пространств с помощью плагинов.

![](../../_png/Pasted%20image%2020250901131815.png)

Параметры, которые выводит нам команда: 

- NAME - имя пространства
- PROVISIONER - поставщик пространства (плагин)
- RECLAIM POLICY - метод восполнения пространства обратно (когда PVC удалён)
- VOLUME BINDING MODE - ивент, когда выделяется пространство (Immediate - выделяется сразу)
- ALLOW VOLUME EXPANSION - доступно ли расширение пространства
- AGE - возраст пространства

![](../../_png/Pasted%20image%2020250901132329.png)

За определение типа пространства в конфигурации PVC отвечает поле `storageValueClass`. В нашей локальной конфигурации достаточно оставить дефолтное значение, которое задано по умолчанию.

### Mount в deployment

Дополним конфигурацию деплоя полями `volumes` и `volumeMounts`, в которых опишем сами пространства и их связи

`postgres-deployment.yml`
```YML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: postgres
  template:
    metadata:
      labels:
        components: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16.0
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: demo
            - name: POSTGRES_USER
              value: demo
            - name: POSTGRES_PASSWORD
              value: demo
          resources:
            limits:
              memory: "500Mi"
              cpu: "300m"
		  # описываем точки монтирования в поде, которые будем маунтить в volume
          volumeMounts:
		      # имя пространства, куда мы будем монтироваться
            - name: postgres-data
              # точка монтирование
              mountPath: /var/lib/postgresql/data
              # наименование подпапки, которая будет хранить данные из точки монтирования в volume
              subPath: postgres
      # тут мы определяем список наших volumes
      volumes:
	    # сссылаемся на pvc сервис, который будет выделять volumes
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
```

>[!warning] Сейчас в postgres есть баг, что без созданной `subPath` (т.е. в корне volume) стягивание данных работать не будет. Поэтому нам нужно указать подпапку `subPath`, куда будут помещены данные из `mountPath`. 

Далее поднимаем PVC и обновляем деплой postgres

```bash
kubectl apply -f ./old/postgres-pvc.yml
kubectl apply -f ./old/postgres-deployment.yml
```

И глянем на созданные PVC в системе

```bash
kubectl get persistentvolumeclaims
```

![](../../_png/Pasted%20image%2020250901143747.png)

### Проверка работы

Применяем ещё раз скрипт создания таблицы из прошлого урока

Рестартим сервис и подключаемся к нему

```bash
kubectl rollout restart deployment postgres-deployment
kubectl port-forward pods/postgres-deployment-65b9746778-vjpfq 5432:5432
```

Теперь можно заметить, что наш сервис сохранил свои данные и не потерял созданную таблицу

![](../../_png/Pasted%20image%2020250901144427.png)



---

## Секреты

### Секреты

Дефолтно, мы описали переменные окружения прямо внутри наших конфигураций. Это крайне плохая практика. Все эти секьюрные данные полетят прямо к нам в гит и могут быть подспорьем для свободного доступа в нашу систему. 

![](../../_png/Pasted%20image%2020250903154418.png)

Для решения проблем с безопасным хранением данных, нужно использовать механизм **секретов**, которые заставят нас хранить нужные для подключения данные локально

![](../../_png/Pasted%20image%2020250903155056.png)

#### Императивный подход

Есть несколько типов секретов: 

- generic - любой тип данных
- tls - ключи / сертификаты
- docker-registry - для конфигурации docker registry

Так же есть ещё несколько типов, которые больше нужны для конфигурации прода

Командой мы будем создавать секрет дженерик-типа

Мы можем создать
- plain-строку с переменными, которые нужно передать к нам
- ссылкой на файл, в котором хранятся переменные

```bash
kubectl create secret generic pg-secret --from-literal PASSWORD=demo
```

И получить созданные секреты для подов можем командой `get`

```bash
$ kubectl get secrets

NAME        TYPE     DATA   AGE
pg-secret   Opaque   1      11s
```

И описание сохранённых переменных окружения

```bash
$ kubectl describe secrets

Name:         pg-secret
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
PASSWORD:  4 bytes
```

### Безопасность секретов

К сожалению, сохранение секретов напрямую не является безопасной практикой, так как несмотря на то, что они хранятся где-то в кластере, они всё равно лежат в определённом месте в base64

Мы можем напрямую получить наш секрет сохранённый в кубере с помощью определения go-template на получение данных

```bash
$ kubectl get secrets pg-secret --template={{.data.PASSWORD}}

ZGVtbw==%
```

Но по-факту это просто окажется base64 зашифрованная строка

```bash
$ kubectl get secrets pg-secret --template={{.data.PASSWORD}} | base64 -D

demo%
```

>[!warning] Секрет в кубере не является панацеей и сохранение секретов в другие сервисы так же не улучшат ситуацию. Лучший вариант защиты - чёткое разграничение зон ответственности и доступа к кубер-кластеру.

### Конфиг секрета

Далее мы можем описать хранение наших секретов декларативным образом через создание сервиса секретов.

Переведём сначала ручками наш секрет из строки demo в base64 строку

```bash
$ echo -n demo | base64

ZGVtbw==
```

Опишем сервис типа Secret, в который поместим наши данные зашифрованные в формате base64

`postgres-secret.yml`
```YML
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
data:
  POSTGRES_DB: ZGVtbw==
  POSTGRES_USER: ZGVtbw==
  POSTGRES_PASSWORD: ZGVtbw==
```

Далее нам нужно будет применить эти секреты из сервиса секретов

`postgres-deployment.yml`
```YML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: postgres
  template:
    metadata:
      labels:
        components: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16.0
          ports:
            - containerPort: 5432
          # блок переменных окружения
          env:
            - name: POSTGRES_DB
              # указываем, откуда хотим подтянуть секрет
              valueFrom:
	            # описываем референс, откуда тянем секрет
                secretKeyRef:
	              # указываем имя сервиса, откуда возьмём секрет
                  name: postgres-secret
                  # имя секрета
                  key: POSTGRES_DB
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
          resources:
            limits:
              memory: "500Mi"
              cpu: "300m"
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
              subPath: postgres
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
```

И далее создаём наш сервис секретов и переприменяем деплой постгреса

```bash
$ kubectl apply -f ./old/postgres-secret.yml
$ kubectl apply -f ./old/postgres-deployment.yml
```

### Упражнение - пишем второй сервис

Дополняем нашу архитектуру проекта: 
- добавим сюда два сервиса секретов (api и postgres)
- опишем PersistentVolume для сервиса postgres

![](../../_png/Pasted%20image%2020250903183033.png)

Описываем отдельно сервис бэкэнда, который будет выглядеть подобно фронтовому

`api-deployment.yml`
```YML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: short-api-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: backend
  template:
    metadata:
      labels:
        components: backend
    spec:
      containers:
        - name: short-api
          image: antonlarichev/short-api:v1.0
          ports:
            - containerPort: 3000
          resources:
            limits:
              memory: "128Mi"
              cpu: "100m"
```

Теперь нужно описать ClusterIP, который под собой скроет все сервисы нашего бэкэнда

`api-service.yml`
```YML
apiVersion: v1
kind: Service
metadata:
  name: short-api-clusterip
spec:
  type: ClusterIP
  ports:
    - port: 3000
      protocol: TCP
  selector:
    components: backend
```

И отдельно обновим тег приложения фронта до последней версии

`app-deployment.yml`
```YML
image: antonlarichev/short-app:v1.4
```

### Упражнение - секрет для сервиса

Сейчас нам нужно собрать передать переменную окружения `DATABASE_URL` в наш api-service, которая будет собой представлять ссылку на подключение к postgres

Из особенностей можно выделить: 
- у нас все параметры определены как `demo`
- ссылкой на подключение (`url`) будет являться наименование сервиса ClusterIP нашего postgres сервиса (`metadata.name` из `postgres-service.yml`)

>[!note] `name` ClusterIP сервиса автоматически попадает в DNS k8s и позволяет разрезолвить ip этого сервиса

```
# шаблон строки подключения
postgresql://user:password@url:5432/db

# реализация в нашем кластере
postgresql://demo:demo@postgres-clusterip:5432/demo
```

Переводим строку подключения в base64

```bash
echo -n postgresql://demo:demo@postgres-clusterip:5432/demo | base64
```

Опишем секрет, который будет хранить ссылку на подключение к нашей БД

`api-secret.yml`
```bash
apiVersion: v1
kind: Secret
metadata:
  name: short-api-secret
type: Opaque
data:
  DATABASE_URL: cG9zdGdyZXNxbDovL2RlbW86ZGVtb0Bwb3N0Z3Jlcy1jbHVzdGVyaXA6NTQzMi9kZW1v
```

Дальше остаётся только передать сюда переменную с URL для подключения к БД

`api-deployment.yml`
```bash
apiVersion: apps/v1
kind: Deployment
metadata:
  name: short-api-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: backend
  template:
    metadata:
      labels:
        components: backend
    spec:
      containers:
        - name: short-api
          image: antonlarichev/short-api:v1.0
          ports:
            - containerPort: 3000
          resources:
            limits:
              memory: "512Mi"
              cpu: "200m"
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: short-api-secret
                  key: DATABASE_URL
```

### Отладка проекта

Поднимем сервисы бэка и секретов

```bash
$ kubectl apply -f ./old/api-secret.yml
secret/short-api-secret created

$ kubectl apply -f ./old/api-deployment.yml
deployment.apps/short-api-deployment created
```

Собрать логи можно командой `logs`

```bash
$ kubectl logs pods/postgres-deployment-5bfbcc7857-kpfkz

PostgreSQL Database directory appears to contain a database; Skipping initialization

2025-09-03 14:52:43.357 UTC [1] LOG:  starting PostgreSQL 16.0 (Debian 16.0-1.pgdg120+1) on aarch64-unknown-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
2025-09-03 14:52:43.357 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
2025-09-03 14:52:43.357 UTC [1] LOG:  listening on IPv6 address "::", port 5432
2025-09-03 14:52:43.358 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
2025-09-03 14:52:43.359 UTC [29] LOG:  database system was shut down at 2025-09-03 14:51:43 UTC
2025-09-03 14:52:43.361 UTC [1] LOG: 

```

```
$ $kubectl logs pods/short-api-deployment-57657f58d6-85f5d

> short-api@0.0.1 start
> nest start

[Nest] 31  - 09/03/2025, 4:21:56 PM     LOG [NestFactory] Starting Nest application...
[Nest] 31  - 09/03/2025, 4:21:56 PM     LOG [InstanceLoader] DatabaseModule dependencies initialized +294ms
[Nest] 31  - 09/03/2025, 4:21:56 PM     LOG [InstanceLoader] AppModule dependencies initialized +6ms
[Nest] 31  - 09/03/2025, 4:21:57 PM     LOG [RoutesResolver] AppController {/api}: +204ms
[Nest] 31  - 09/03/2025, 4:21:57 PM     LOG [RouterExplorer] Mapped {/api, GET} route +90ms
[Nest] 31  - 09/03/2025, 4:21:57 PM     LOG [RouterExplorer] Mapped {/api/:hash, GET} route +2ms
[Nest] 31  - 09/03/2025, 4:21:57 PM     LOG [RouterExplorer] Mapped {/api, POST} route +4ms
[Nest] 31  - 09/03/2025, 4:21:57 PM     LOG [RouterExplorer] Mapped {/api/:id, DELETE} route +2ms
[Nest] 31  - 09/03/2025, 4:22:00 PM     LOG [NestApplication] Nest application successfully started +3595ms
```

### Изменение ingress

Сейчас добавим префикс `/api`, который будет перенаправлять запросы на имя `short-api-clusterip`, которое под собой крутит нашу апишку

`ingress.yml`
```bash
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myingress
  annotations:
    nginx.ingress.kubernetes.io/add-base-url: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: demo.test
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: short-app-clusterip
            port: 
              number: 80
      - pathType: Prefix
        path: "/api"
        backend:
          service:
            name: short-api-clusterip
            port:
              number: 3000
```

Далее применяем изменения в ингрессе

```bash
kubectl apply -f ./ingress.yml
```

И все три сервиса теперь доступны извне, работают и взаимодействуют друг с другом. Проверить можно посредством вывода сервиса на `127.0.0.1` через `minikube tunnel` 

![](../../_png/Pasted%20image%2020250903195429.png)



---

## Эксплуатация

### Dashboard

Мы можем вывести общий дашборд по всем развёрнутым локально проектам через плагин миникуба

```bash
minikube dashboard
```

Тут будет находиться вся информация о кластере с: объектами, загрузкой, джобами и всеми остальными объектами

![](../../_png/Pasted%20image%2020250903202648.png)

Так же тут мы можем ручками заскейлить сервис, перезапустить, переименовать или удалить

![](../../_png/Pasted%20image%2020250903202938.png)

>[!warning] Менять конфигурации, обновлять изображения или просто дополнять конфиг через dashboard не стоит, так как изменения инфры он не сохранит

### Подключение к Pod

Подключение к контейнеру внутри k8s происходит аналогично тому, как это происходит в Docker 

Такая команда позволит нам прейти в интерактивный режим работы с контейнером

```bash
kubectl exec -it short-api-deployment-57657f58d6-85f5d -- /bin/bash
```

Эта команда позволит нам прямо внутри проверить все элементы, которые могут вызвать у нас вопросы

![](../../_png/Pasted%20image%2020250904135734.png)

Попадаем мы в сам контейнер по достаточно сложному механизму, который реализован в k8s. Наш `kubectl` не может напрямую залезть в контейнер. 

Порядок выполнения команды exec: 
- `kubectl` вызывает API, которое находится в мастер ноде
- Мастер нода ищет контейнер и делегирует задачу из `kubectl` в `kubelet` найденной ноды
- `kubelet` передаёт задачу в `container runtime`
- `container runtime` через `kernel-runtime` просит исполнить операцию над определённым контейнером внутри пода

![](../../_png/Pasted%20image%2020250904135648.png)

### ConfigMap

Представим такую ситуацию, что нам нужно подложить `postgresql.conf` файл, который будет детально описывать работу нашей базы, внутрь pod контейнера

![](../../_png/Pasted%20image%2020250904141539.png)

ConfigMap - это отдельная сущность, которая позволяет подложить определённые данные внутрь нашего пода с помощью volume

![](../../_png/Pasted%20image%2020250904141354.png)

Создадим конфиг с параметрами

`demo-config.yml`
```YML
apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-config
data:
  key: value
```



`api-deployment.yml`
```YML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: short-api-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: backend
  template:
    metadata:
      labels:
        components: backend
    spec:
      containers:
        - name: short-api
          image: antonlarichev/short-api:v1.0
          ports:
            - containerPort: 3000
          resources:
            limits:
              memory: "500Mi"
              cpu: "200m"
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: short-api-secret
                  key: DATABASE_URL
	      # опишем маунт для контейнера пространства test
          volumeMounts:
            - name: test
              mountPath: /etc/test
              readOnly: true
      # пространства
      volumes:
        - name: test # имя пространства
          # описываем тут карту конфигураций
          configMap:
            name: demo-config
```

Применим новые конфигурации

```bash
$ kubectl apply -f ./demo-config.yml
$ kubectl apply -f ./api-deployment.yml
```

Внутри пода создастся папка test с файлом key

```bash
$ kubectl exec -it short-api-deployment-57657f58d6-85f5d -- /bin/bash
$ cat /etc/test/key
value
```

### Rollout

Чтобы заставить смотреть за изменениями объектов k8s, мы можем передать флаг `--watch`

```bash
kubectl get pod --watch
```

В одном терминале запустим отслеживание подов, а в другом выведем ревизии и изменим деплой

```bash
kubectl rollout history deployment short-api-deployment
```

![](../../_png/Pasted%20image%2020250904191400.png)

rollout имеет несколько объектов для отображения: 
- history - история деплоев
- pause - остановить деплой
- restart - перезапустить деплой
- resume - продолжить деплой
- status - статус деплоя
- undo - отменить ревизию обновления

![](../../_png/Pasted%20image%2020250904193032.png)

Чтобы отменить деплой, который мы только что сделали и вернуться на прошлую ревизию, мы можем воспользоваться `undo` и указать конкретную ревизию `--to-revision`

```bash
kubectl rollout undo deployment short-api-deployment --to-revision=2
```

>[!info] Это очень удобный вариант в том случае, когда мы сделали очень много новых деплоев, но откатывать каждый будет крайне неээфективно и можно точечно откатить нужный нам сервис

>[!warning] Однако этот механизм работает только с `deployment`

### Healthckeck


`api-deployment.yml`
```YML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: short-api-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      components: backend
  template:
    metadata:
      labels:
        components: backend
    spec:
      containers:
        - name: short-api
          image: antonlarichev/short-api:v1.0
          ports:
            - containerPort: 3000
          resources:
            limits:
              memory: "500Mi"
              cpu: "200m"
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: short-api-secret
                  key: DATABASE_URL
          volumeMounts:
            - name: test
              mountPath: /etc/test
              readOnly: true
          # healthcheck
          livenessProbe:
            exec: # выполняем 
              command: # команду
                - curl
                - --fail
                - http://localhost:3000/api
            # максимальна задержка ответа в 30 секунд
            initialDelaySeconds: 30
            # отправляем раз в 5 секунд
            periodSeconds: 5
            # сервис может вернуть только одну ошибку
            failureThreshold: 1
      volumes:
        - name: test
          configMap:
            name: demo-config
```






### Namespace



`app-namespace.yml`
```YML
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
```






---

## Знакомство с Helm

### Зачем нужен







### Установка







### Компоненты







### Поиск charts







### Создание chart








---

## Шаблоны

### Перенос deployment








### Встроенные объекты








### Задание переменных








### Функции и pipelines








### Упражнение - Шаблон для app








### Упражнение - Функции














---

## Продвинутые шаблоны

### if-else









### width









### range









### переменные









### tuple









### template









### include









### Упражнение - API









### Оптимизация chart









### Упражнение - PostgreSQL












---

## Управление репозиторием

### Notes txt






### Развёртка приложения






### Создание репозитория






### Использование репозитория







---

## Использование Charts

### Uninstall











### Rollback











### Отладка релиза











### Тесты











### Шифрование секретов











### Использование секретов











### Разные окружения


















---

## Заключение

- Конфигурация кластера k8s вручную
- Работа с kubeconfig
