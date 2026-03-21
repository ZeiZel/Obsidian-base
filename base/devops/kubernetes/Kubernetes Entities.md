---
tags:
  - kubernetes
  - k8s
  - devops
---

## Введение

Kubernetes оперирует набором ресурсов - сущностей, которые описывают желаемое состояние кластера. Каждый ресурс представляет собой объект в API-сервере и описывается декларативным YAML-манифестом. Контроллеры кластера непрерывно сравнивают текущее состояние с желаемым и приводят систему в соответствие.

Эта статья является справочником по всем основным типам ресурсов Kubernetes. Для каждой сущности описано назначение, внутренний механизм работы, сценарии использования и приведён готовый к продакшену манифест.

> [!info] Все манифесты в статье используют актуальные стабильные версии API. Перед применением в своём кластере проверяйте совместимость версий через `kubectl api-resources`.

---

## Workload Resources - ресурсы нагрузки

### Pod

Pod - минимальная единица деплоя в Kubernetes. Это абстракция над одним или несколькими контейнерами, которые разделяют сетевое пространство имён, хранилище и жизненный цикл.

Контейнеры внутри одного Pod видят друг друга через `localhost`, могут обмениваться данными через общие volumes и всегда планируются на одну и ту же ноду.

#### Зачем нужен Pod

Docker оперирует контейнерами напрямую. Kubernetes добавляет уровень абстракции - Pod, который позволяет группировать связанные контейнеры, управлять их совместным жизненным циклом и предоставлять единый IP-адрес для сетевого взаимодействия.

#### Жизненный цикл Pod

Pod проходит через несколько фаз:

- Pending - Pod принят кластером, но один или несколько контейнеров ещё не запущены. Включает время на скачивание образов и планирование на ноду
- Running - Pod привязан к ноде, все контейнеры созданы, хотя бы один контейнер работает или находится в процессе запуска/перезапуска
- Succeeded - все контейнеры в Pod завершились успешно и не будут перезапущены
- Failed - все контейнеры завершились, хотя бы один завершился с ошибкой
- Unknown - состояние Pod не удалось определить, обычно из-за потери связи с нодой

#### Multi-container Pods

Основной контейнер выполняет бизнес-логику. Дополнительные контейнеры решают вспомогательные задачи:

- Sidecar - работает параллельно с основным контейнером. Примеры: прокси для сервис-меша, сборщик логов, агент мониторинга
- Init container - запускается до основных контейнеров и должен завершиться успешно. Примеры: миграции БД, ожидание зависимого сервиса, загрузка конфигурации

#### Манифест Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
    version: v1.2.0
    team: backend
spec:
  restartPolicy: Always

  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          until nc -z postgres-svc 5432; do
            echo "Waiting for database..."
            sleep 2
          done

  containers:
    - name: api
      image: registry.example.com/api-server:1.2.0
      imagePullPolicy: IfNotPresent

      ports:
        - name: http
          containerPort: 8080
          protocol: TCP

      env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: api-config
              key: log-level

      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi

      livenessProbe:
        httpGet:
          path: /health/live
          port: http
        initialDelaySeconds: 30
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3

      readinessProbe:
        httpGet:
          path: /health/ready
          port: http
        initialDelaySeconds: 10
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 3

      startupProbe:
        httpGet:
          path: /health/live
          port: http
        failureThreshold: 30
        periodSeconds: 10

      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        readOnlyRootFilesystem: true
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL

      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache

    - name: log-collector
      image: fluent/fluent-bit:2.2
      resources:
        requests:
          cpu: 50m
          memory: 64Mi
        limits:
          cpu: 100m
          memory: 128Mi
      volumeMounts:
        - name: app-logs
          mountPath: /var/log/app

  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
    - name: app-logs
      emptyDir: {}

  securityContext:
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
```

> [!important] На практике Pod напрямую создают редко. Обычно Pod управляется через Deployment, StatefulSet или DaemonSet, которые обеспечивают перезапуск, масштабирование и обновление.

---

### ReplicaSet

ReplicaSet гарантирует, что заданное количество идентичных Pod работает в кластере в любой момент времени. Если Pod падает или удаляется - ReplicaSet создаёт новый. Если Pod больше, чем нужно - лишние удаляются.

#### Механизм работы

ReplicaSet использует label selector для определения, какие Pod ему принадлежат. Контроллер ReplicaSet непрерывно сравнивает текущее количество Pod, соответствующих селектору, с полем `replicas` и корректирует количество.

Это означает, что ReplicaSet может "усыновить" существующий Pod, если тот подходит по лейблам, даже если Pod был создан отдельно.

#### Почему ReplicaSet не создают напрямую

Deployment создаёт и управляет ReplicaSet автоматически. Deployment добавляет возможности rolling update, rollback и историю ревизий, которых у ReplicaSet нет. Создание ReplicaSet напрямую оправдано только в нетипичных сценариях, когда нужен кастомный контроллер обновлений.

#### Манифест ReplicaSet

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
        version: v1.2.0
    spec:
      containers:
        - name: api
          image: registry.example.com/api-server:1.2.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

---

### Deployment

Deployment - основной ресурс для запуска stateless-приложений. Он управляет ReplicaSet и обеспечивает декларативное обновление Pod. При изменении спецификации Pod - создаётся новый ReplicaSet, Pod из старого постепенно заменяются Pod из нового.

#### Стратегии обновления

RollingUpdate - стратегия по умолчанию. Новые Pod создаются постепенно, старые удаляются по мере готовности новых. Два параметра управляют процессом:

- maxSurge - максимальное количество Pod сверх replicas во время обновления. Значение 1 означает, что в процессе обновления может быть на 1 Pod больше целевого количества
- maxUnavailable - максимальное количество недоступных Pod во время обновления. Значение 0 гарантирует, что все Pod доступны на каждом шаге

Recreate - убивает все существующие Pod перед созданием новых. Вызывает даунтайм, но гарантирует, что старая и новая версии не работают одновременно. Используется для приложений, которые не поддерживают параллельную работу нескольких версий.

#### Механизм отката

Kubernetes хранит историю ревизий Deployment. Каждое изменение Pod template создаёт новую ревизию - фактически новый ReplicaSet. Старые ReplicaSet с 0 реплик сохраняются в истории. Параметр `revisionHistoryLimit` определяет, сколько старых ревизий хранить.

#### Манифест Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
    version: v1.2.0
  annotations:
    kubernetes.io/change-cause: "update api-server to v1.2.0"
spec:
  replicas: 3
  revisionHistoryLimit: 10

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  selector:
    matchLabels:
      app: api-server

  template:
    metadata:
      labels:
        app: api-server
        version: v1.2.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: api-server
      terminationGracePeriodSeconds: 30

      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - api-server
                topologyKey: kubernetes.io/hostname

      containers:
        - name: api
          image: registry.example.com/api-server:1.2.0
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 8080

          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: database-url

          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi

          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3

          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL

          volumeMounts:
            - name: tmp
              mountPath: /tmp

      volumes:
        - name: tmp
          emptyDir: {}
```

#### Управление деплоем

```bash
# Проверка статуса обновления
kubectl rollout status deployment/api-server -n production

# История ревизий
kubectl rollout history deployment/api-server -n production

# Откат к предыдущей версии
kubectl rollout undo deployment/api-server -n production

# Откат к конкретной ревизии
kubectl rollout undo deployment/api-server --to-revision=3 -n production

# Пауза и возобновление обновления
kubectl rollout pause deployment/api-server -n production
kubectl rollout resume deployment/api-server -n production

# Обновление образа без редактирования манифеста
kubectl set image deployment/api-server api=registry.example.com/api-server:1.3.0 -n production
```

---

### StatefulSet

StatefulSet предназначен для stateful-приложений, которым нужны стабильная сетевая идентичность, стабильное персистентное хранилище и упорядоченное развёртывание.

#### Отличия от Deployment

В Deployment все Pod взаимозаменяемы - они получают случайные имена и могут быть заменены в любом порядке. StatefulSet гарантирует:

- Стабильные имена Pod. Каждый Pod получает предсказуемое имя вида `{name}-0`, `{name}-1`, `{name}-2`. Это имя сохраняется при перезапуске
- Стабильное хранилище. Каждый Pod привязан к своему PersistentVolumeClaim. При перезапуске Pod он подключит тот же самый том
- Упорядоченное развёртывание. Pod создаются последовательно от 0 до N-1. Следующий Pod не запустится, пока предыдущий не станет Ready
- Упорядоченное удаление. При scale down Pod удаляются в обратном порядке от N-1 до 0

#### Когда использовать

Типичные применения - базы данных с репликацией, кластеры Kafka, ZooKeeper, Elasticsearch, Consul. Любое приложение, где каждый экземпляр имеет уникальную роль или состояние.

#### Headless Service

StatefulSet требует Headless Service - Service с `clusterIP: None`. Такой Service не балансирует трафик, а создаёт DNS-записи для каждого Pod. Pod `postgres-0` в StatefulSet `postgres` с Headless Service `postgres-svc` будет доступен по DNS-имени `postgres-0.postgres-svc.{namespace}.svc.cluster.local`.

#### Манифест StatefulSet

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: production
  labels:
    app: postgres
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
  labels:
    app: postgres
spec:
  serviceName: postgres-headless
  replicas: 3
  podManagementPolicy: OrderedReady

  selector:
    matchLabels:
      app: postgres

  template:
    metadata:
      labels:
        app: postgres
    spec:
      securityContext:
        runAsUser: 999
        fsGroup: 999

      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - name: postgres
              containerPort: 5432

          env:
            - name: POSTGRES_DB
              value: appdb
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secrets
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secrets
                  key: password
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata

          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi

          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
            initialDelaySeconds: 30
            periodSeconds: 10

          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
            initialDelaySeconds: 5
            periodSeconds: 5

          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data

  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 50Gi
```

> [!important] При удалении StatefulSet PersistentVolumeClaim не удаляются автоматически. Это защита данных от случайной потери. Удалять PVC нужно вручную.

---

### DaemonSet

DaemonSet гарантирует, что на каждой ноде кластера (или на каждой ноде, подходящей по селектору) работает ровно один экземпляр Pod. При добавлении новой ноды Pod автоматически создаётся, при удалении ноды - удаляется.

#### Типичные применения

- Агенты мониторинга - node-exporter, Datadog agent
- Сборщики логов - Fluentd, Fluent Bit, Filebeat
- Сетевые плагины - Calico, Cilium, kube-proxy
- Агенты безопасности - Falco, Sysdig
- Управление хранилищем - CSI node plugins

#### Node Affinity и Tolerations

По умолчанию DaemonSet запускает Pod на всех нодах. Через `nodeSelector` или `nodeAffinity` можно ограничить, на каких нодах будет работать Pod. Tolerations позволяют запускать Pod на нодах с определёнными taints - например, на master-нодах или на нодах со специальным оборудованием.

#### Манифест DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter

  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1

  template:
    metadata:
      labels:
        app: node-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9100"
    spec:
      hostNetwork: true
      hostPID: true

      tolerations:
        - operator: Exists

      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
          ports:
            - name: metrics
              containerPort: 9100
              hostPort: 9100

          args:
            - --path.procfs=/host/proc
            - --path.sysfs=/host/sys
            - --path.rootfs=/host/root
            - --collector.filesystem.mount-points-exclude=^/(dev|proc|sys|var/lib/docker/.+)($|/)

          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi

          securityContext:
            readOnlyRootFilesystem: true

          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true
            - name: root
              mountPath: /host/root
              mountPropagation: HostToContainer
              readOnly: true

      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
        - name: root
          hostPath:
            path: /
```

---

### Job и CronJob

#### Job

Job создаёт один или несколько Pod и гарантирует, что заданное количество из них успешно завершится. В отличие от Deployment, Job предназначен для задач, которые имеют конец - миграции БД, обработка пакетных данных, отправка уведомлений, генерация отчётов.

Ключевые параметры:

- completions - сколько Pod должны успешно завершиться. По умолчанию 1
- parallelism - сколько Pod могут работать одновременно
- backoffLimit - максимальное количество повторных попыток при ошибке
- activeDeadlineSeconds - максимальное время работы Job, после которого все Pod будут завершены
- ttlSecondsAfterFinished - через сколько секунд после завершения Job будет автоматически удалён

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-v42
  namespace: production
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 600
  ttlSecondsAfterFinished: 3600

  template:
    spec:
      restartPolicy: Never

      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command:
            - sh
            - -c
            - until nc -z postgres-headless 5432; do sleep 2; done

      containers:
        - name: migration
          image: registry.example.com/api-server:1.2.0
          command:
            - npm
            - run
            - migrate

          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: database-url

          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

#### CronJob

CronJob создаёт Job по расписанию в формате cron. Используется для регулярных задач - очистка устаревших данных, формирование отчётов, периодическое резервное копирование.

Параметр `concurrencyPolicy` определяет поведение при наложении запусков:

- Allow - разрешает параллельные запуски. По умолчанию
- Forbid - пропускает новый запуск, если предыдущий ещё работает
- Replace - останавливает текущий запуск и начинает новый

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
  namespace: production
spec:
  schedule: "0 3 * * *"
  timeZone: "Europe/Moscow"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  startingDeadlineSeconds: 300

  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 3600
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: registry.example.com/backup-tool:1.0.0
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump $DATABASE_URL | gzip > /backup/db-$(date +%Y%m%d).sql.gz
                  aws s3 cp /backup/ s3://backups/postgres/ --recursive

              env:
                - name: DATABASE_URL
                  valueFrom:
                    secretKeyRef:
                      name: postgres-secrets
                      key: connection-string
                - name: AWS_ACCESS_KEY_ID
                  valueFrom:
                    secretKeyRef:
                      name: aws-secrets
                      key: access-key
                - name: AWS_SECRET_ACCESS_KEY
                  valueFrom:
                    secretKeyRef:
                      name: aws-secrets
                      key: secret-key

              resources:
                requests:
                  cpu: 200m
                  memory: 256Mi
                limits:
                  cpu: 1000m
                  memory: 1Gi

              volumeMounts:
                - name: backup-volume
                  mountPath: /backup

          volumes:
            - name: backup-volume
              emptyDir:
                sizeLimit: 5Gi
```

---

## Service Discovery и сетевые сущности

### Service

Service обеспечивает стабильную сетевую точку доступа к набору Pod. Pod эфемерны - они создаются и умирают, меняют IP-адреса. Service предоставляет постоянный виртуальный IP и DNS-имя, абстрагируя клиентов от жизненного цикла отдельных Pod.

#### Механизм работы

Service использует label selector для определения целевых Pod. Контроллер Endpoints отслеживает Pod, соответствующие селектору, и обновляет объект Endpoints - список IP-адресов и портов всех готовых Pod. Компонент kube-proxy на каждой ноде настраивает правила пересылки трафика.

kube-proxy работает в одном из режимов:

- iptables - создаёт правила iptables для перенаправления трафика. Работает на уровне ядра, быстро обрабатывает пакеты. Выбор Pod случайный
- IPVS - использует модуль ядра IPVS для балансировки нагрузки. Поддерживает алгоритмы round-robin, least connections, destination hashing. Эффективнее iptables при большом количестве сервисов
- nftables - современная замена iptables, используется в новых версиях Kubernetes

#### ClusterIP

Тип по умолчанию. Создаёт виртуальный IP, доступный только изнутри кластера. Подходит для взаимодействия между сервисами.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
spec:
  type: ClusterIP
  selector:
    app: api-server
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
    - name: grpc
      port: 9090
      targetPort: 9090
      protocol: TCP
```

Сервис будет доступен внутри кластера по DNS-имени `api-server.production.svc.cluster.local` или сокращённо `api-server` из того же namespace.

#### NodePort

Открывает фиксированный порт на каждой ноде кластера в диапазоне 30000-32767. Трафик на этот порт перенаправляется на Service. NodePort автоматически создаёт ClusterIP.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-server-nodeport
  namespace: production
spec:
  type: NodePort
  selector:
    app: api-server
  ports:
    - name: http
      port: 80
      targetPort: 8080
      nodePort: 30080
```

> [!info] NodePort используется в dev-окружениях или для интеграции с внешними балансировщиками. В продакшене предпочтительнее LoadBalancer или Ingress.

#### LoadBalancer

Запрашивает у облачного провайдера внешний балансировщик нагрузки. Провайдер создаёт L4-балансировщик с внешним IP-адресом, который направляет трафик на NodePort. LoadBalancer автоматически создаёт NodePort и ClusterIP.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
    - name: https
      port: 443
      targetPort: 8443
```

#### ExternalName

Создаёт CNAME-запись в DNS, перенаправляя запросы на внешний домен. Не имеет selector и не проксирует трафик. Используется для интеграции внешних сервисов в DNS-систему кластера.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-database
  namespace: production
spec:
  type: ExternalName
  externalName: db-primary.rds.amazonaws.com
```

Теперь из кластера можно обращаться к `external-database.production.svc.cluster.local`, и DNS вернёт CNAME на `db-primary.rds.amazonaws.com`.

---

### Ingress

Ingress управляет внешним HTTP/HTTPS-доступом к сервисам в кластере. В отличие от LoadBalancer, который работает на L4 и создаёт отдельный балансировщик для каждого сервиса, Ingress работает на L7 и маршрутизирует трафик на основе хоста и пути URL.

#### Ingress Controller

Сам по себе объект Ingress ничего не делает. Для его работы в кластере должен быть установлен Ingress Controller - реализация, которая читает объекты Ingress и настраивает реальный прокси-сервер.

Популярные контроллеры:

- ingress-nginx - основан на NGINX, наиболее распространён
- Traefik - автоматическое обнаружение сервисов, встроенный Let's Encrypt
- HAProxy Ingress - высокопроизводительный, гибкая конфигурация
- AWS ALB Ingress Controller - интеграция с AWS Application Load Balancer
- Istio Ingress Gateway - часть сервис-меша Istio

#### Маршрутизация

Ingress поддерживает два типа маршрутизации:

- Host-based - маршрутизация по имени хоста. Запросы к `api.example.com` идут на один сервис, к `app.example.com` - на другой
- Path-based - маршрутизация по пути URL. Запросы к `/api` идут на backend, к `/` - на frontend

#### Манифест Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx

  tls:
    - hosts:
        - app.example.com
        - api.example.com
      secretName: example-com-tls

  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80

    - host: api.example.com
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: api-server
                port:
                  number: 80
          - path: /health
            pathType: Exact
            backend:
              service:
                name: api-server
                port:
                  number: 80
```

> [!info] Параметр `pathType` определяет способ сопоставления пути. `Prefix` - совпадение по префиксу (`/api` матчит `/api`, `/api/users`, `/api/items`). `Exact` - точное совпадение. `ImplementationSpecific` - поведение определяется контроллером.

---

### Gateway API

Gateway API - следующее поколение спецификации для управления входящим трафиком, разработанное как замена Ingress. Основное преимущество - разделение ответственности между ролями: инфраструктурный инженер управляет GatewayClass и Gateway, разработчик приложения управляет HTTPRoute.

#### Ключевые ресурсы

- GatewayClass - определяет тип контроллера. Аналог IngressClass. Создаётся инфраструктурной командой
- Gateway - экземпляр шлюза, привязанный к GatewayClass. Определяет слушатели, порты и TLS-конфигурацию
- HTTPRoute - правила маршрутизации HTTP-трафика. Привязывается к Gateway и направляет трафик на Service

#### Преимущества над Ingress

Gateway API выразительнее Ingress. Поддерживает: взвешенный трафик между версиями, заголовочные манипуляции, зеркалирование трафика, TCP/UDP/gRPC маршрутизацию. Избавляет от нестандартных аннотаций, которые различаются между контроллерами.

#### Манифесты Gateway API

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: production-gateway-class
spec:
  controllerName: gateway.nginx.org/nginx-gateway-controller

---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  namespace: production
spec:
  gatewayClassName: production-gateway-class
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: example-com-tls
      allowedRoutes:
        namespaces:
          from: Same

---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
  namespace: production
spec:
  parentRefs:
    - name: production-gateway

  hostnames:
    - api.example.com

  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1
      backendRefs:
        - name: api-server-v1
          port: 80
          weight: 90
        - name: api-server-v2
          port: 80
          weight: 10

    - matches:
        - path:
            type: PathPrefix
            value: /v2
      backendRefs:
        - name: api-server-v2
          port: 80
```

В примере выше трафик на `/v1` распределяется между двумя версиями API - 90% на v1 и 10% на v2. Это позволяет реализовать canary-деплой на уровне маршрутизации.

---

### NetworkPolicy

NetworkPolicy определяет правила сетевого доступа между Pod. По умолчанию в Kubernetes все Pod могут общаться друг с другом. NetworkPolicy позволяет ограничить этот доступ.

#### Принцип работы

NetworkPolicy реализуется сетевым плагином (CNI). Не все CNI поддерживают NetworkPolicy - например, Flannel не поддерживает. Calico, Cilium, Weave Net поддерживают полностью.

Правила действуют аддитивно: если к Pod применяются несколько NetworkPolicy, итоговый набор разрешённых соединений - объединение всех правил.

Если к Pod не применяется ни одна NetworkPolicy - весь трафик разрешён. Как только хотя бы одна NetworkPolicy применяется - весь трафик, не разрешённый явно, блокируется.

#### Манифест NetworkPolicy

```yaml
# Запрет всего входящего трафика по умолчанию
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
# Разрешить трафик от frontend к api-server
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080

---
# Разрешить api-server обращаться только к postgres и redis
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
    - Egress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
    # Разрешить DNS-запросы
    - to: []
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

> [!important] Всегда разрешайте DNS (порт 53) в egress-политиках, иначе Pod не сможет разрешать имена сервисов.

---

## Конфигурация и секреты

### ConfigMap

ConfigMap хранит неконфиденциальные конфигурационные данные в формате ключ-значение. Позволяет отделить конфигурацию от образа контейнера, чтобы один и тот же образ можно было использовать в разных окружениях.

#### Способы использования ConfigMap в Pod

- Переменные окружения - данные из ConfigMap становятся переменными окружения контейнера
- Аргументы командной строки - через подстановку переменных
- Файлы в volume - каждый ключ ConfigMap становится файлом в примонтированной директории

#### Манифест ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: production
  labels:
    app: api-server
data:
  log-level: "info"
  max-connections: "100"
  cache-ttl: "3600"

  # Многострочное значение - будет файлом при монтировании как volume
  nginx.conf: |
    server {
      listen 80;
      server_name _;

      location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
      }

      location /health {
        return 200 'ok';
        add_header Content-Type text/plain;
      }
    }
```

#### Использование ConfigMap в Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-server
spec:
  containers:
    - name: api
      image: registry.example.com/api-server:1.2.0

      # Отдельные значения как переменные окружения
      env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: api-config
              key: log-level

      # Все ключи ConfigMap как переменные окружения
      envFrom:
        - configMapRef:
            name: api-config

      # ConfigMap как файлы в volume
      volumeMounts:
        - name: config-volume
          mountPath: /etc/nginx/conf.d
          readOnly: true

  volumes:
    - name: config-volume
      configMap:
        name: api-config
        items:
          - key: nginx.conf
            path: default.conf
```

> [!info] При монтировании ConfigMap как volume - изменения в ConfigMap автоматически отражаются в файлах внутри Pod. Задержка обновления зависит от настроек kubelet, обычно до 60 секунд. Переменные окружения не обновляются автоматически - нужен перезапуск Pod.

---

### Secret

Secret хранит конфиденциальные данные - пароли, токены, ключи, сертификаты. По структуре Secret похож на ConfigMap, но с отличиями в обработке: значения хранятся в base64, Kubernetes может ограничивать доступ через RBAC, секреты можно шифровать в etcd.

#### Типы Secret

- Opaque - произвольные данные. Тип по умолчанию
- kubernetes.io/dockerconfigjson - учётные данные для Docker registry
- kubernetes.io/tls - TLS-сертификат и ключ
- kubernetes.io/basic-auth - логин и пароль
- kubernetes.io/ssh-auth - SSH-ключ
- kubernetes.io/service-account-token - токен ServiceAccount

> [!important] Base64 - это кодирование, не шифрование. Любой, кто имеет доступ к etcd или API-серверу, может прочитать секреты. Для реальной защиты включайте EncryptionConfiguration для etcd и используйте внешние решения - HashiCorp Vault, AWS Secrets Manager, External Secrets Operator.

#### Манифест Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: production
  labels:
    app: api-server
type: Opaque
data:
  # Значения в base64: echo -n 'value' | base64
  database-url: cG9zdGdyZXM6Ly91c2VyOnBhc3NAcG9zdGdyZXMtaGVhZGxlc3M6NTQzMi9hcHBkYg==
  jwt-secret: c3VwZXItc2VjcmV0LWp3dC1rZXktMjAyNQ==
  redis-password: cmVkaXMtcGFzc3dvcmQtMTIz

---
apiVersion: v1
kind: Secret
metadata:
  name: registry-credentials
  namespace: production
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJyZWdpc3RyeS5leGFtcGxlLmNvbSI6eyJhdXRoIjoiZFhObGNqcHdZWE56In19fQ==

---
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: production
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTi... # base64 сертификата
  tls.key: LS0tLS1CRUdJTi... # base64 ключа
```

#### Использование Secret в Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-server
spec:
  imagePullSecrets:
    - name: registry-credentials

  containers:
    - name: api
      image: registry.example.com/api-server:1.2.0

      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret

      volumeMounts:
        - name: tls-certs
          mountPath: /etc/tls
          readOnly: true

  volumes:
    - name: tls-certs
      secret:
        secretName: tls-secret
```

```bash
# Создание секрета из командной строки
kubectl create secret generic api-secrets \
  --from-literal=database-url='postgres://user:pass@host:5432/db' \
  --from-literal=jwt-secret='my-secret-key' \
  -n production

# Создание TLS-секрета из файлов
kubectl create secret tls tls-secret \
  --cert=tls.crt \
  --key=tls.key \
  -n production

# Создание секрета для Docker registry
kubectl create secret docker-registry registry-credentials \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass \
  -n production
```

---

## Storage - хранилище

### PersistentVolume

PersistentVolume (PV) - ресурс хранилища на уровне кластера, предоставленный администратором или динамически через StorageClass. PV существует независимо от Pod и имеет собственный жизненный цикл.

#### Access Modes

- ReadWriteOnce (RWO) - том может быть примонтирован одной нодой на чтение и запись. Подходит для БД
- ReadOnlyMany (ROX) - том может быть примонтирован многими нодами только на чтение. Подходит для статики
- ReadWriteMany (RWX) - том может быть примонтирован многими нодами на чтение и запись. Требует NFS или распределённую файловую систему
- ReadWriteOncePod (RWOP) - том может быть примонтирован только одним Pod. Наиболее строгий режим

#### Reclaim Policies

Определяют, что происходит с PV после удаления привязанного PVC:

- Retain - PV сохраняется, данные остаются. Администратор должен вручную очистить и сделать PV доступным
- Delete - PV и связанный ресурс хранилища удаляются автоматически
- Recycle - устаревший вариант. Очищает данные через `rm -rf /volume/*` и делает PV доступным

#### Манифест PersistentVolume

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
  labels:
    type: fast-ssd
    app: postgres
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: fast-ssd
  mountOptions:
    - noatime
    - nodiratime

  # Пример для AWS EBS
  csi:
    driver: ebs.csi.aws.com
    volumeHandle: vol-0abc123def456789
    fsType: ext4
```

---

### PersistentVolumeClaim

PersistentVolumeClaim (PVC) - запрос пользователя на хранилище. PVC описывает требования к хранилищу - размер, access mode, storage class. Контроллер Kubernetes ищет подходящий PV и привязывает PVC к нему.

Если подходящего PV нет и указан StorageClass с provisioner - PV создаётся динамически.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 50Gi
```

#### Использование PVC в Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: postgres
spec:
  containers:
    - name: postgres
      image: postgres:16-alpine
      volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: postgres-data
```

---

### StorageClass

StorageClass описывает класс хранилища с определённым provisioner и параметрами. Когда PVC ссылается на StorageClass, provisioner автоматически создаёт PV.

```yaml
# Быстрое SSD-хранилище
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "4000"
  throughput: "250"
  encrypted: "true"
reclaimPolicy: Retain
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer

---
# Стандартное хранилище
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer

---
# NFS-хранилище для ReadWriteMany
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-shared
provisioner: nfs.csi.k8s.io
parameters:
  server: nfs-server.example.com
  share: /exports/shared
reclaimPolicy: Retain
```

> [!info] Параметр `volumeBindingMode: WaitForFirstConsumer` откладывает создание PV до момента, когда Pod, использующий PVC, будет запланирован на конкретную ноду. Это важно для зональных cloud-дисков, которые привязаны к availability zone.

---

## Управление доступом

### ServiceAccount

ServiceAccount предоставляет идентичность процессам, работающим в Pod. Каждый namespace имеет ServiceAccount по умолчанию (`default`). Рекомендуется создавать отдельный ServiceAccount для каждого приложения и настраивать минимальные необходимые привилегии.

Начиная с Kubernetes 1.24, токены ServiceAccount больше не создаются автоматически как Secret. Вместо этого используется TokenRequest API, выдающий краткосрочные токены.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
  annotations:
    # Для AWS IRSA
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/api-server-role
automountServiceAccountToken: true
```

---

### RBAC - Role, ClusterRole, RoleBinding, ClusterRoleBinding

RBAC (Role-Based Access Control) управляет доступом к ресурсам кластера. Модель строится на четырёх объектах:

- Role - набор разрешений в рамках одного namespace
- ClusterRole - набор разрешений на уровне всего кластера
- RoleBinding - привязывает Role или ClusterRole к пользователю/группе/ServiceAccount в namespace
- ClusterRoleBinding - привязывает ClusterRole к субъекту на уровне кластера

Каждое правило определяет: какие ресурсы (resources) и какие действия (verbs) разрешены.

Основные verbs: get, list, watch, create, update, patch, delete.

```yaml
# Role: доступ к подам и сервисам в namespace production
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-reader
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log", "services", "endpoints"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch"]

---
# RoleBinding: привязка Role к ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: api-server-reader
  namespace: production
subjects:
  - kind: ServiceAccount
    name: api-server
    namespace: production
roleRef:
  kind: Role
  name: app-reader
  apiGroup: rbac.authorization.k8s.io

---
# ClusterRole: доступ к нодам и неймспейсам на уровне кластера
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-reader
rules:
  - apiGroups: [""]
    resources: ["nodes", "nodes/metrics", "namespaces"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["metrics.k8s.io"]
    resources: ["nodes", "pods"]
    verbs: ["get", "list"]

---
# ClusterRoleBinding: привязка ClusterRole к ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: monitoring-reader-binding
subjects:
  - kind: ServiceAccount
    name: prometheus
    namespace: monitoring
roleRef:
  kind: ClusterRole
  name: monitoring-reader
  apiGroup: rbac.authorization.k8s.io
```

> [!important] Следуйте принципу наименьших привилегий. Создавайте отдельный ServiceAccount для каждого приложения. Используйте Role вместо ClusterRole, где это возможно. Избегайте wildcards (`*`) в rules.

---

## Масштабирование

### HorizontalPodAutoscaler

HorizontalPodAutoscaler (HPA) автоматически масштабирует количество Pod в Deployment, ReplicaSet или StatefulSet на основе наблюдаемых метрик. HPA периодически проверяет метрики и вычисляет нужное количество реплик.

#### Формула расчёта

```
desiredReplicas = ceil(currentReplicas * (currentMetricValue / targetMetricValue))
```

Если текущее потребление CPU 80%, а target 50%, и текущих реплик 3:

```
desiredReplicas = ceil(3 * (80 / 50)) = ceil(4.8) = 5
```

#### Стабилизация

HPA поддерживает окна стабилизации, чтобы избежать flapping - частого масштабирования вверх-вниз:

- scaleUp.stabilizationWindowSeconds - за какой период берётся максимальное рекомендуемое значение при масштабировании вверх
- scaleDown.stabilizationWindowSeconds - аналогично при масштабировании вниз. По умолчанию 300 секунд

#### Манифест HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server

  minReplicas: 3
  maxReplicas: 20

  metrics:
    # По CPU
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # По памяти
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

    # По кастомной метрике - RPS
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 5
          periodSeconds: 30
      selectPolicy: Max

    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 25
          periodSeconds: 60
      selectPolicy: Min
```

> [!info] Для работы HPA по метрикам CPU/memory в кластере должен быть установлен Metrics Server. Для кастомных метрик нужен Prometheus Adapter или KEDA.

---

### VerticalPodAutoscaler

VerticalPodAutoscaler (VPA) автоматически подбирает значения `resources.requests` и `resources.limits` для контейнеров на основе фактического потребления.

#### Режимы работы

- Off - VPA только рекомендует значения, но не применяет их. Рекомендации можно посмотреть в статусе VPA-объекта
- Initial - VPA задаёт значения только при создании Pod. Существующие Pod не перезапускаются
- Auto - VPA может перезапускать Pod для применения новых значений

#### Когда использовать

VPA полезен, когда сложно определить правильные значения requests/limits заранее. Особенно актуален для stateful-сервисов, где горизонтальное масштабирование неприменимо - базы данных, кеши с определённым набором данных.

VPA и HPA не рекомендуется использовать одновременно для одного и того же ресурса (CPU/memory), так как они могут конфликтовать. Допустимая комбинация - HPA по кастомным метрикам и VPA по CPU/memory.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-server-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server

  updatePolicy:
    updateMode: Auto

  resourcePolicy:
    containerPolicies:
      - containerName: api
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 4000m
          memory: 4Gi
        controlledResources:
          - cpu
          - memory
```

---

## Полноценный деплой сложного приложения

Рассмотрим деплой микросервисного приложения из пяти компонентов:

- Frontend - React/Next.js приложение, 3 реплики
- Backend API - Go-сервис, 3 реплики
- PostgreSQL - база данных, StatefulSet с персистентным хранилищем
- Redis - кеш, один инстанс с персистентностью
- Worker - фоновые задачи, 2 реплики

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
  labels:
    name: myapp
    environment: production
```

### ConfigMap и Secret

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: myapp
data:
  NODE_ENV: production
  LOG_LEVEL: info
  REDIS_HOST: redis-svc
  REDIS_PORT: "6379"
  DB_HOST: postgres-headless
  DB_PORT: "5432"
  DB_NAME: myapp
  FRONTEND_URL: https://app.example.com
  API_URL: https://api.example.com

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: myapp
type: Opaque
data:
  db-username: bXlhcHB1c2Vy
  db-password: c2VjdXJlLXBhc3N3b3JkLTIwMjU=
  redis-password: cmVkaXMtcGFzc3dvcmQ=
  jwt-secret: and0LXNlY3JldC1rZXktcHJvZHVjdGlvbg==

---
apiVersion: v1
kind: Secret
metadata:
  name: registry-credentials
  namespace: myapp
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJyZWdpc3RyeS5leGFtcGxlLmNvbSI6eyJhdXRoIjoiZFhObGNqcHdZWE56In19fQ==
```

### Frontend Deployment и Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: myapp
  labels:
    app: frontend
    component: web
spec:
  replicas: 3
  revisionHistoryLimit: 5

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  selector:
    matchLabels:
      app: frontend

  template:
    metadata:
      labels:
        app: frontend
        component: web
    spec:
      serviceAccountName: frontend
      imagePullSecrets:
        - name: registry-credentials

      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: frontend
                topologyKey: kubernetes.io/hostname

      containers:
        - name: frontend
          image: registry.example.com/myapp-frontend:1.0.0
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 3000

          env:
            - name: API_URL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: API_URL

          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi

          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 15
            periodSeconds: 10

          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5

          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL

          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: nextjs-cache
              mountPath: /app/.next/cache

      volumes:
        - name: tmp
          emptyDir: {}
        - name: nextjs-cache
          emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
  namespace: myapp
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - name: http
      port: 80
      targetPort: 3000

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend
  namespace: myapp
automountServiceAccountToken: false
```

### Backend API Deployment и Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: myapp
  labels:
    app: api-server
    component: backend
spec:
  replicas: 3
  revisionHistoryLimit: 5

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  selector:
    matchLabels:
      app: api-server

  template:
    metadata:
      labels:
        app: api-server
        component: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: api-server
      imagePullSecrets:
        - name: registry-credentials
      terminationGracePeriodSeconds: 30

      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: api-server
                topologyKey: kubernetes.io/hostname

      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command:
            - sh
            - -c
            - until nc -z postgres-headless 5432; do echo "waiting for postgres..."; sleep 2; done

        - name: run-migrations
          image: registry.example.com/myapp-api:1.0.0
          command: ["./migrate", "up"]
          env:
            - name: DATABASE_URL
              value: "postgres://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-username
            - name: DB_PASS
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-password
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: DB_HOST
            - name: DB_PORT
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: DB_PORT
            - name: DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: DB_NAME

      containers:
        - name: api
          image: registry.example.com/myapp-api:1.0.0
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 8080
            - name: metrics
              containerPort: 9090

          env:
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-username
            - name: DB_PASS
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-password
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: jwt-secret
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: redis-password

          envFrom:
            - configMapRef:
                name: app-config

          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi

          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3

          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL

          volumeMounts:
            - name: tmp
              mountPath: /tmp

      volumes:
        - name: tmp
          emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: api-svc
  namespace: myapp
spec:
  type: ClusterIP
  selector:
    app: api-server
  ports:
    - name: http
      port: 80
      targetPort: 8080
    - name: metrics
      port: 9090
      targetPort: 9090

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-server
  namespace: myapp
automountServiceAccountToken: false
```

### PostgreSQL StatefulSet

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: myapp
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-svc
  namespace: myapp
spec:
  type: ClusterIP
  selector:
    app: postgres
    role: primary
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: myapp
  labels:
    app: postgres
spec:
  serviceName: postgres-headless
  replicas: 1
  podManagementPolicy: OrderedReady

  selector:
    matchLabels:
      app: postgres

  template:
    metadata:
      labels:
        app: postgres
        role: primary
    spec:
      securityContext:
        runAsUser: 999
        fsGroup: 999

      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - name: postgres
              containerPort: 5432

          env:
            - name: POSTGRES_DB
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: DB_NAME
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-password
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata

          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi

          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - myappuser
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3

          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - myappuser
            initialDelaySeconds: 5
            periodSeconds: 5

          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data

  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 50Gi
```

### Redis Deployment и Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: myapp
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis

  template:
    metadata:
      labels:
        app: redis
    spec:
      securityContext:
        runAsUser: 999
        fsGroup: 999

      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - name: redis
              containerPort: 6379

          command:
            - redis-server
            - --requirepass
            - $(REDIS_PASSWORD)
            - --appendonly
            - "yes"
            - --maxmemory
            - 512mb
            - --maxmemory-policy
            - allkeys-lru

          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: redis-password

          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 640Mi

          livenessProbe:
            exec:
              command:
                - redis-cli
                - -a
                - $(REDIS_PASSWORD)
                - ping
            initialDelaySeconds: 15
            periodSeconds: 10

          readinessProbe:
            exec:
              command:
                - redis-cli
                - -a
                - $(REDIS_PASSWORD)
                - ping
            initialDelaySeconds: 5
            periodSeconds: 5

          volumeMounts:
            - name: redis-data
              mountPath: /data

      volumes:
        - name: redis-data
          persistentVolumeClaim:
            claimName: redis-pvc

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: myapp
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard
  resources:
    requests:
      storage: 5Gi

---
apiVersion: v1
kind: Service
metadata:
  name: redis-svc
  namespace: myapp
spec:
  type: ClusterIP
  selector:
    app: redis
  ports:
    - name: redis
      port: 6379
      targetPort: 6379
```

### Worker Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: myapp
  labels:
    app: worker
    component: background
spec:
  replicas: 2
  revisionHistoryLimit: 5

  selector:
    matchLabels:
      app: worker

  template:
    metadata:
      labels:
        app: worker
        component: background
    spec:
      serviceAccountName: worker
      imagePullSecrets:
        - name: registry-credentials
      terminationGracePeriodSeconds: 60

      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        seccompProfile:
          type: RuntimeDefault

      initContainers:
        - name: wait-for-services
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              until nc -z postgres-headless 5432; do sleep 2; done
              until nc -z redis-svc 6379; do sleep 2; done

      containers:
        - name: worker
          image: registry.example.com/myapp-api:1.0.0
          command: ["./worker"]

          env:
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-username
            - name: DB_PASS
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db-password
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: redis-password

          envFrom:
            - configMapRef:
                name: app-config

          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi

          livenessProbe:
            httpGet:
              path: /health
              port: 8081
            initialDelaySeconds: 15
            periodSeconds: 10

          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL

          volumeMounts:
            - name: tmp
              mountPath: /tmp

      volumes:
        - name: tmp
          emptyDir: {}

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: worker
  namespace: myapp
automountServiceAccountToken: false
```

### Ingress с TLS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: myapp
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx

  tls:
    - hosts:
        - app.example.com
        - api.example.com
      secretName: myapp-tls

  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80

    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 80
```

### HPA для Frontend и Backend

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: myapp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
  namespace: myapp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 25
          periodSeconds: 60
```

### PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: frontend-pdb
  namespace: myapp
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: frontend

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server-pdb
  namespace: myapp
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api-server
```

### NetworkPolicy

```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: myapp
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
# Frontend: принимает трафик от Ingress Controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-ingress
  namespace: myapp
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000

---
# API: принимает трафик от Ingress и frontend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-ingress
  namespace: myapp
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
      ports:
        - protocol: TCP
          port: 9090

---
# PostgreSQL: принимает трафик только от api-server и worker
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-ingress
  namespace: myapp
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-server
        - podSelector:
            matchLabels:
              app: worker
      ports:
        - protocol: TCP
          port: 5432

---
# Redis: принимает трафик только от api-server и worker
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: redis-ingress
  namespace: myapp
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-server
        - podSelector:
            matchLabels:
              app: worker
      ports:
        - protocol: TCP
          port: 6379

---
# Egress: разрешить DNS для всех
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: myapp
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to: []
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

---

### То же самое через Helm

Все манифесты выше можно упаковать в Helm chart - шаблонизированный пакет для Kubernetes. Helm позволяет параметризовать манифесты, управлять версиями деплоя и откатывать изменения.

#### Структура чарта

```
myapp-chart/
  Chart.yaml
  values.yaml
  templates/
    _helpers.tpl
    namespace.yaml
    configmap.yaml
    secret.yaml
    frontend-deployment.yaml
    frontend-service.yaml
    api-deployment.yaml
    api-service.yaml
    postgres-statefulset.yaml
    postgres-service.yaml
    redis-deployment.yaml
    redis-service.yaml
    worker-deployment.yaml
    ingress.yaml
    hpa.yaml
    pdb.yaml
    networkpolicy.yaml
```

#### Chart.yaml

```yaml
apiVersion: v2
name: myapp
description: Microservices application with frontend, API, PostgreSQL, Redis and worker
type: application
version: 1.0.0
appVersion: "1.0.0"
maintainers:
  - name: Platform Team
    email: platform@example.com
```

#### values.yaml

```yaml
global:
  namespace: myapp
  environment: production
  imagePullSecrets:
    - name: registry-credentials

frontend:
  enabled: true
  replicaCount: 3
  image:
    repository: registry.example.com/myapp-frontend
    tag: "1.0.0"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 80
    targetPort: 3000
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 256Mi
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilization: 70

api:
  enabled: true
  replicaCount: 3
  image:
    repository: registry.example.com/myapp-api
    tag: "1.0.0"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
    metricsPort: 9090
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 512Mi
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 15
    targetCPUUtilization: 70
    targetMemoryUtilization: 80

postgres:
  enabled: true
  image:
    repository: postgres
    tag: "16-alpine"
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 4Gi
  storage:
    size: 50Gi
    storageClass: fast-ssd
  auth:
    database: myapp

redis:
  enabled: true
  image:
    repository: redis
    tag: "7-alpine"
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 640Mi
  storage:
    size: 5Gi
    storageClass: standard
  config:
    maxmemory: 512mb
    maxmemoryPolicy: allkeys-lru

worker:
  enabled: true
  replicaCount: 2
  image:
    repository: registry.example.com/myapp-api
    tag: "1.0.0"
    pullPolicy: IfNotPresent
  command: ["./worker"]
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 512Mi

ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: app.example.com
      service: frontend
    - host: api.example.com
      service: api
  tls:
    - secretName: myapp-tls
      hosts:
        - app.example.com
        - api.example.com

networkPolicy:
  enabled: true
```

#### templates/_helpers.tpl

```yaml
{{- define "myapp.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

#### templates/api-deployment.yaml

```yaml
{{- if .Values.api.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-api
  namespace: {{ .Values.global.namespace }}
  labels:
    app: api-server
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.api.replicaCount }}
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
        {{- include "myapp.selectorLabels" . | nindent 8 }}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "{{ .Values.api.service.targetPort }}"
    spec:
      serviceAccountName: api-server
      {{- with .Values.global.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: api
          image: "{{ .Values.api.image.repository }}:{{ .Values.api.image.tag }}"
          imagePullPolicy: {{ .Values.api.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.api.service.targetPort }}
            - name: metrics
              containerPort: {{ .Values.api.service.metricsPort }}
          envFrom:
            - configMapRef:
                name: {{ .Release.Name }}-config
          env:
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: {{ .Release.Name }}-secrets
                  key: db-username
            - name: DB_PASS
              valueFrom:
                secretKeyRef:
                  name: {{ .Release.Name }}-secrets
                  key: db-password
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ .Release.Name }}-secrets
                  key: jwt-secret
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Release.Name }}-secrets
                  key: redis-password
          resources:
            {{- toYaml .Values.api.resources | nindent 12 }}
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
{{- end }}
```

#### Команды Helm

```bash
# Установка чарта
helm install myapp ./myapp-chart \
  --namespace myapp \
  --create-namespace \
  --values values-production.yaml

# Обновление с новыми значениями
helm upgrade myapp ./myapp-chart \
  --namespace myapp \
  --values values-production.yaml \
  --set api.image.tag=1.1.0

# Откат к предыдущей ревизии
helm rollback myapp 1 --namespace myapp

# Список ревизий
helm history myapp --namespace myapp

# Проверка шаблонов без установки
helm template myapp ./myapp-chart --values values-production.yaml

# Проверка чарта на ошибки
helm lint ./myapp-chart

# Просмотр diff перед обновлением (нужен плагин helm-diff)
helm diff upgrade myapp ./myapp-chart --values values-production.yaml

# Удаление релиза
helm uninstall myapp --namespace myapp
```

---

## Полезные команды kubectl

### Информация о кластере

```bash
# Версия клиента и сервера
kubectl version

# Информация о кластере
kubectl cluster-info

# Список нод
kubectl get nodes -o wide

# Ресурсы ноды
kubectl describe node <node-name>

# Доступные API-ресурсы
kubectl api-resources

# Все объекты в namespace
kubectl get all -n <namespace>
```

### Работа с Pod

```bash
# Список Pod с расширенной информацией
kubectl get pods -n <namespace> -o wide

# Описание Pod - события, состояние, причины ошибок
kubectl describe pod <pod-name> -n <namespace>

# Логи контейнера
kubectl logs <pod-name> -n <namespace>

# Логи конкретного контейнера в multi-container Pod
kubectl logs <pod-name> -c <container-name> -n <namespace>

# Логи в реальном времени
kubectl logs -f <pod-name> -n <namespace>

# Логи предыдущего инстанса (после перезапуска)
kubectl logs <pod-name> --previous -n <namespace>

# Выполнение команды в контейнере
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh

# Проброс порта
kubectl port-forward <pod-name> 8080:8080 -n <namespace>

# Проброс порта на сервис
kubectl port-forward svc/<service-name> 8080:80 -n <namespace>
```

### Деплой и обновление

```bash
# Применение манифеста
kubectl apply -f manifest.yaml

# Применение всех манифестов из директории
kubectl apply -f ./manifests/ --recursive

# Удаление ресурса
kubectl delete -f manifest.yaml

# Масштабирование
kubectl scale deployment <name> --replicas=5 -n <namespace>

# Обновление образа
kubectl set image deployment/<name> <container>=<image>:<tag> -n <namespace>

# Статус обновления
kubectl rollout status deployment/<name> -n <namespace>

# История обновлений
kubectl rollout history deployment/<name> -n <namespace>

# Откат
kubectl rollout undo deployment/<name> -n <namespace>

# Перезапуск всех Pod в Deployment
kubectl rollout restart deployment/<name> -n <namespace>
```

### Отладка

```bash
# Запуск отладочного Pod
kubectl run debug --rm -it --image=busybox:1.36 -- /bin/sh

# Запуск Pod с curl для проверки сервисов
kubectl run curl --rm -it --image=curlimages/curl -- sh

# DNS-отладка
kubectl run dns-debug --rm -it --image=busybox:1.36 -- nslookup <service-name>

# Проверка endpoints сервиса
kubectl get endpoints <service-name> -n <namespace>

# Просмотр событий в namespace
kubectl get events -n <namespace> --sort-by=.lastTimestamp

# Ресурсы Pod (CPU и память)
kubectl top pods -n <namespace>

# Ресурсы нод
kubectl top nodes
```

### Конфигурация и секреты

```bash
# Просмотр ConfigMap
kubectl get configmap <name> -n <namespace> -o yaml

# Просмотр Secret (base64)
kubectl get secret <name> -n <namespace> -o yaml

# Декодирование значения Secret
kubectl get secret <name> -n <namespace> -o jsonpath='{.data.password}' | base64 -d

# Редактирование ConfigMap
kubectl edit configmap <name> -n <namespace>
```

### Контексты и namespaces

```bash
# Текущий контекст
kubectl config current-context

# Список контекстов
kubectl config get-contexts

# Переключение контекста
kubectl config use-context <context-name>

# Установка namespace по умолчанию для текущего контекста
kubectl config set-context --current --namespace=<namespace>

# Список namespaces
kubectl get namespaces
```

### Форматирование вывода

```bash
# JSON-вывод
kubectl get pod <name> -o json

# YAML-вывод
kubectl get pod <name> -o yaml

# Кастомные колонки
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP

# JSONPath
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# Сортировка
kubectl get pods --sort-by=.status.startTime
```

---

## Итого

Kubernetes предоставляет набор декларативных ресурсов, каждый из которых решает конкретную задачу. Workload-ресурсы (Pod, Deployment, StatefulSet, DaemonSet, Job) управляют жизненным циклом контейнеров. Service, Ingress и Gateway API обеспечивают сетевой доступ. ConfigMap и Secret отделяют конфигурацию от кода. PV, PVC и StorageClass управляют хранилищем. RBAC контролирует доступ. HPA и VPA автоматизируют масштабирование.

Ключевой принцип - декларативность. Вы описываете желаемое состояние, контроллеры Kubernetes приводят кластер в это состояние и поддерживают его. При проектировании деплоя стоит начинать с определения всех необходимых ресурсов, настроить security context и resource limits, добавить health probes и network policies, а затем упаковать всё в Helm chart для управления версиями и параметризации.
