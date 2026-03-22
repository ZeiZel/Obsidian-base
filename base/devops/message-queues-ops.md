---
tags:
  - devops
  - kafka
  - rabbitmq
title: Message Queues Operations
---
## Обзор

Системы обмена сообщениями решают задачу асинхронного взаимодействия между сервисами. Есть два фундаментально разных подхода.

**Message Broker** - посредник, который принимает сообщение от producer и доставляет его consumer. После подтверждения обработки сообщение удаляется из очереди. Типичный представитель - RabbitMQ.

**Event Streaming Platform** - распределённый лог, в который записываются события. Consumers читают лог с нужной позиции, данные хранятся заданное время независимо от потребления. Типичный представитель - Apache Kafka.

### Паттерны обмена сообщениями

Point-to-Point - одно сообщение обрабатывается ровно одним consumer. Используется для распределения задач между воркерами. Пример - обработка заказов, где каждый заказ должен быть обработан только один раз.

Publish/Subscribe - сообщение доставляется всем подписчикам. Каждый subscriber получает свою копию. Пример - рассылка уведомлений при изменении статуса заказа сразу в email-сервис, push-сервис и аналитику.

Fan-out - частный случай pub/sub, когда один producer вещает во множество очередей или партиций. В RabbitMQ реализуется через fanout exchange, в Kafka - через несколько consumer groups на одном топике.

### Когда что использовать

| Сценарий | Рекомендация |
|----------|-------------|
| Task queue с гарантией однократной обработки | RabbitMQ |
| Потоковая обработка событий в реальном времени | Kafka |
| Event sourcing и replay событий | Kafka |
| Сложная маршрутизация по атрибутам сообщения | RabbitMQ |
| Высокий throughput (миллионы msg/sec) | Kafka |
| Lightweight pub/sub с минимальной латентностью | NATS |
| Request-reply между микросервисами | RabbitMQ или NATS |

---

## Apache Kafka

### Архитектура

Kafka - распределённая платформа потоковой обработки событий. Данные организованы в топики, каждый топик разделён на партиции, партиции реплицируются между брокерами.

Основные компоненты:

- Broker - узел кластера, хранящий партиции. Один брокер является controller, управляющий назначением лидеров партиций
- Topic - логическая категория сообщений. Аналог таблицы в БД
- Partition - упорядоченная последовательность записей внутри топика. Единица параллелизма
- Replication Factor - количество копий каждой партиции. Для production минимум 3
- ISR (In-Sync Replicas) - набор реплик, синхронизированных с лидером. `min.insync.replicas=2` гарантирует, что данные записаны минимум на 2 брокера

> [!important] ZooKeeper vs KRaft
> До версии 3.3 Kafka зависела от ZooKeeper для хранения метаданных кластера и выборов контроллера. Начиная с 3.3 поддерживается режим KRaft, где метаданные хранятся в самом Kafka через внутренний топик `__cluster_metadata`. KRaft стал production-ready в 3.3, ZooKeeper объявлен deprecated с версии 3.5. Все новые кластеры следует разворачивать в режиме KRaft.

### Producers

Producer записывает сообщения в партиции топика. Ключевые настройки:

`acks` - уровень подтверждения записи:
- `acks=0` - producer не ждёт подтверждения. Максимальный throughput, возможна потеря данных
- `acks=1` - ждёт подтверждения от лидера партиции. Потеря данных при падении лидера до репликации
- `acks=all` (-1) - ждёт подтверждения от всех ISR реплик. Максимальная надёжность

Partitioner определяет, в какую партицию попадёт сообщение:
- Если указан ключ - хэш ключа определяет партицию, сообщения с одним ключом всегда попадают в одну партицию
- Без ключа - sticky partitioner, batch заполняется в одну партицию, затем переключается на следующую

Idempotent producer (`enable.idempotence=true`) гарантирует exactly-once запись на уровне партиции. Producer присваивает каждому сообщению sequence number, брокер отклоняет дубликаты. Включается автоматически при `acks=all`.

Batching для оптимизации throughput:
- `batch.size` - максимальный размер batch в байтах (default 16384)
- `linger.ms` - время ожидания накопления batch (default 0). Увеличение до 5-20ms повышает throughput за счёт латентности

```properties
# Production producer config
acks=all
enable.idempotence=true
max.in.flight.requests.per.connection=5
batch.size=32768
linger.ms=10
compression.type=lz4
retries=2147483647
delivery.timeout.ms=120000
```

### Consumers

Consumer читает сообщения из партиций топика. Consumers объединяются в consumer groups для параллельной обработки.

Consumer Groups - каждая партиция назначается ровно одному consumer внутри группы. Если consumers больше, чем партиций, лишние простаивают. Несколько consumer groups могут независимо читать один и тот же топик.

Offset management - каждый consumer отслеживает свою позицию в партиции:
- `auto.offset.reset=earliest` - начать с самого начала при первом подключении
- `auto.offset.reset=latest` - читать только новые сообщения
- `enable.auto.commit=true` - автоматический коммит offset каждые `auto.commit.interval.ms`
- Manual commit через `commitSync()` / `commitAsync()` для точного контроля

> [!info] Ручной коммит offset
> В production рекомендуется manual commit. Паттерн: прочитать batch, обработать все сообщения, закоммитить offset. Если consumer упадёт до коммита - сообщения обработаются повторно. Обработка должна быть идемпотентной.

Rebalancing strategies - перераспределение партиций при добавлении/удалении consumers:
- Eager (default до 2.4) - все consumers отдают партиции, затем происходит полное переназначение. Вызывает паузу в обработке
- Cooperative (Incremental) - партиции передаются инкрементально, без полной остановки. Настраивается через `partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor`

```properties
# Production consumer config
group.id=order-processing-service
auto.offset.reset=earliest
enable.auto.commit=false
max.poll.records=500
max.poll.interval.ms=300000
session.timeout.ms=45000
heartbeat.interval.ms=15000
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

### Operations

Управление топиками:

```bash
# Создать топик
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic orders \
  --partitions 12 --replication-factor 3

# Описание топика - партиции, лидеры, ISR
kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --topic orders

# Увеличить количество партиций (уменьшить нельзя)
kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic orders --partitions 24

# Список всех топиков
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Удалить топик
kafka-topics.sh --bootstrap-server localhost:9092 \
  --delete --topic orders
```

Управление consumer groups:

```bash
# Описание consumer group - lag по каждой партиции
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group order-processing-service

# Список всех consumer groups
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

# Сбросить offset на начало (group должна быть остановлена)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processing-service --topic orders \
  --reset-offsets --to-earliest --execute

# Сбросить offset на конкретную дату
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processing-service --topic orders \
  --reset-offsets --to-datetime 2026-03-20T00:00:00.000 --execute

# Сбросить offset на определённое значение
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processing-service --topic orders \
  --reset-offsets --to-offset 1000 --execute
```

Управление конфигурацией:

```bash
# Посмотреть конфигурацию топика
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name orders --describe

# Изменить retention
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name orders \
  --alter --add-config retention.ms=604800000

# Конфигурация брокера
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type brokers --entity-name 0 --describe
```

### Retention

Политики хранения определяют, как долго Kafka хранит сообщения:

Time-based - удаление сообщений старше заданного времени:
- `retention.ms` - время хранения (default 7 дней)
- `retention.minutes`, `retention.hours` - альтернативные единицы

Size-based - удаление при превышении размера:
- `retention.bytes` - максимальный размер партиции. При превышении удаляются старые сегменты
- Работает в комбинации с time-based, сообщение удаляется при наступлении любого из условий

Log Compaction - для топиков с `cleanup.policy=compact`:
- Kafka сохраняет только последнее значение для каждого ключа
- Используется для changelog-топиков, KTable-материализации, хранения состояния
- Tombstone - сообщение с null value удаляет ключ после `delete.retention.ms`

```properties
# Retention конфигурация топика
# 30 дней хранения
retention.ms=2592000000
# Максимум 100GB на партицию
retention.bytes=107374182400
# Компактификация для справочных данных
cleanup.policy=compact
# Минимум 1 час до компактификации сегмента
min.compaction.lag.ms=3600000
```

### Performance Tuning

Broker-level настройки:

```properties
# I/O и сетевые потоки
num.io.threads=8
num.network.threads=3
# Для NVMe-дисков можно увеличить num.io.threads до 16

# Socket буферы
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# Log segment
log.segment.bytes=1073741824
log.segment.delete.delay.ms=60000

# Репликация
num.replica.fetchers=4
replica.fetch.max.bytes=1048576

# Общие
message.max.bytes=10485760
default.replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
```

Producer tuning:

```properties
batch.size=65536
linger.ms=10
compression.type=lz4
buffer.memory=67108864
max.block.ms=60000
```

Consumer tuning:

```properties
fetch.min.bytes=1024
fetch.max.wait.ms=500
max.partition.fetch.bytes=1048576
max.poll.records=500
```

> [!summary] Рекомендации по партициям
> Количество партиций определяет максимальный параллелизм обработки. Формула: `target throughput / consumer throughput per partition`. Для большинства сценариев 6-12 партиций на топик достаточно. Увеличение партиций повышает нагрузку на ZooKeeper/KRaft и время rebalancing. Уменьшить количество партиций нельзя без пересоздания топика.

### Мониторинг

Ключевые метрики для мониторинга Kafka кластера.

JMX метрики брокера:
- `kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec` - входящие сообщения в секунду
- `kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec` - входящий трафик
- `kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions` - партиции с отстающими репликами. В норме 0
- `kafka.server:type=ReplicaManager,name=IsrShrinksPerSec` - частота уменьшения ISR. Частые shrinks - проблема с дисками или сетью
- `kafka.controller:type=KafkaController,name=OfflinePartitionsCount` - недоступные партиции. Критическая метрика, всегда должна быть 0

Consumer lag:
- `kafka.consumer:type=consumer-fetch-manager-metrics,client-id=*,records-lag-max` - максимальный lag consumer

Prometheus экспортер (kafka_exporter):

```yaml
# docker-compose фрагмент
kafka-exporter:
  image: danielqsj/kafka-exporter:latest
  command:
    - --kafka.server=kafka-1:9092
    - --kafka.server=kafka-2:9092
    - --kafka.server=kafka-3:9092
  ports:
    - "9308:9308"
```

Ключевые метрики в Prometheus:

```promql
# Consumer lag по group и topic
kafka_consumergroup_lag{consumergroup="order-service",topic="orders"}

# Сумма lag по всем партициям
sum by (consumergroup, topic) (kafka_consumergroup_lag)

# Скорость входящих сообщений
rate(kafka_topic_partition_current_offset{topic="orders"}[5m])

# Under-replicated partitions
kafka_topic_partition_under_replicated_partition
```

Burrow - специализированный инструмент для мониторинга consumer lag. Отслеживает динамику lag и определяет, растёт ли он, стабилен или уменьшается. Интегрируется с системами алертинга.

CMAK (Cluster Manager for Apache Kafka) - веб-интерфейс для управления кластером. Позволяет просматривать топики, партиции, consumer groups, перераспределять партиции между брокерами.

### Kafka Connect

Фреймворк для потоковой интеграции Kafka с внешними системами.

Source Connectors - читают данные из внешних систем в Kafka:
- `io.debezium.connector.postgresql.PostgresConnector` - CDC из PostgreSQL
- `io.confluent.connect.jdbc.JdbcSourceConnector` - polling из RDBMS
- `io.confluent.connect.s3.source.S3SourceConnector` - чтение из S3

Sink Connectors - записывают данные из Kafka во внешние системы:
- `io.confluent.connect.elasticsearch.ElasticsearchSinkConnector` - индексация в Elasticsearch
- `io.confluent.connect.s3.S3SinkConnector` - архивация в S3
- `io.confluent.connect.jdbc.JdbcSinkConnector` - запись в RDBMS

```json
{
  "name": "postgres-cdc-orders",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres",
    "database.port": "5432",
    "database.user": "replicator",
    "database.password": "${file:/opt/kafka/secrets/db.properties:password}",
    "database.dbname": "orders_db",
    "database.server.name": "orders",
    "table.include.list": "public.orders,public.order_items",
    "plugin.name": "pgoutput",
    "slot.name": "orders_cdc_slot",
    "publication.name": "orders_pub",
    "topic.prefix": "cdc.orders",
    "transforms": "route",
    "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
    "transforms.route.regex": "([^.]+)\\.([^.]+)\\.([^.]+)",
    "transforms.route.replacement": "$3",
    "errors.tolerance": "all",
    "errors.deadletterqueue.topic.name": "dlq.cdc.orders",
    "errors.deadletterqueue.topic.replication.factor": 3,
    "errors.deadletterqueue.context.headers.enable": true
  }
}
```

Distributed Mode - запуск Connect Workers кластером для отказоустойчивости:

```properties
# connect-distributed.properties
bootstrap.servers=kafka-1:9092,kafka-2:9092,kafka-3:9092
group.id=connect-cluster
key.converter=org.apache.kafka.connect.json.JsonConverter
value.converter=io.confluent.connect.avro.AvroConverter
value.converter.schema.registry.url=http://schema-registry:8081
config.storage.topic=connect-configs
offset.storage.topic=connect-offsets
status.storage.topic=connect-status
config.storage.replication.factor=3
offset.storage.replication.factor=3
status.storage.replication.factor=3
```

Dead Letter Queue - при ошибке обработки сообщение отправляется в отдельный DLQ-топик вместо остановки коннектора. Настройки `errors.tolerance=all` и `errors.deadletterqueue.topic.name` включают этот механизм.

### Schema Registry

Centralized хранилище схем для сериализации/десериализации сообщений.

Поддерживаемые форматы:
- Avro - компактный бинарный формат, наиболее популярный в экосистеме Kafka
- Protobuf - бинарный формат от Google, хорошая поддержка в gRPC
- JSON Schema - для команд, привыкших к JSON

Compatibility Modes определяют, какие изменения схемы допустимы:
- BACKWARD (default) - новая схема может читать данные, записанные старой. Можно удалять поля, добавлять optional
- FORWARD - старая схема может читать данные, записанные новой. Можно добавлять поля, удалять optional
- FULL - backward + forward одновременно. Самый строгий режим
- NONE - без проверки совместимости

```bash
# Зарегистрировать схему
curl -X POST http://schema-registry:8081/subjects/orders-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema": "{\"type\":\"record\",\"name\":\"Order\",\"fields\":[{\"name\":\"id\",\"type\":\"string\"},{\"name\":\"amount\",\"type\":\"double\"},{\"name\":\"status\",\"type\":\"string\"}]}"}'

# Проверить совместимость
curl -X POST http://schema-registry:8081/compatibility/subjects/orders-value/versions/latest \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema": "{...}"}'

# Получить последнюю версию схемы
curl http://schema-registry:8081/subjects/orders-value/versions/latest

# Установить уровень совместимости
curl -X PUT http://schema-registry:8081/config/orders-value \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"compatibility": "FULL"}'
```

### Kafka в Kubernetes

Strimzi Operator - стандартный способ запуска Kafka в Kubernetes. Управляет жизненным циклом кластера через CRD.

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: production-cluster
  namespace: kafka
spec:
  kafka:
    version: 3.7.0
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
      - name: tls
        port: 9093
        type: internal
        tls: true
      - name: external
        port: 9094
        type: loadbalancer
        tls: true
    config:
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
      transaction.state.log.min.isr: 2
      default.replication.factor: 3
      min.insync.replicas: 2
      inter.broker.protocol.version: "3.7"
      log.retention.hours: 168
    storage:
      type: jbod
      volumes:
        - id: 0
          type: persistent-claim
          size: 500Gi
          class: gp3
          deleteClaim: false
    resources:
      requests:
        memory: 4Gi
        cpu: "2"
      limits:
        memory: 8Gi
        cpu: "4"
    jvmOptions:
      -Xms: 2048m
      -Xmx: 4096m
    metricsConfig:
      type: jmxPrometheusExporter
      valueFrom:
        configMapKeyRef:
          name: kafka-metrics
          key: kafka-metrics-config.yml
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 50Gi
      class: gp3
    resources:
      requests:
        memory: 1Gi
        cpu: "0.5"
  entityOperator:
    topicOperator: {}
    userOperator: {}
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: orders
  namespace: kafka
  labels:
    strimzi.io/cluster: production-cluster
spec:
  partitions: 12
  replicas: 3
  config:
    retention.ms: 604800000
    min.insync.replicas: 2
    cleanup.policy: delete
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaUser
metadata:
  name: order-service
  namespace: kafka
  labels:
    strimzi.io/cluster: production-cluster
spec:
  authentication:
    type: tls
  authorization:
    type: simple
    acls:
      - resource:
          type: topic
          name: orders
          patternType: literal
        operations: [Read, Write, Describe]
      - resource:
          type: group
          name: order-processing-service
          patternType: literal
        operations: [Read]
```

### Troubleshooting

Under-Replicated Partitions - реплика отстаёт от лидера:
- Проверить дисковое I/O на брокерах с отстающими репликами
- Проверить сетевую связность между брокерами
- Проверить `replica.lag.time.max.ms` и `num.replica.fetchers`
- Команда: `kafka-topics.sh --describe --under-replicated-partitions`

Consumer Lag растёт:
- Увеличить количество consumers в группе (не более числа партиций)
- Увеличить `max.poll.records` и оптимизировать обработку
- Проверить, нет ли долгих блокирующих операций в consumer loop
- Проверить rebalancing - частые rebalance вызывают паузы

Broker Disk Full:
- Уменьшить `retention.ms` или `retention.bytes` для крупных топиков
- Удалить неиспользуемые топики
- Добавить диски через JBOD конфигурацию
- Перебалансировать партиции через `kafka-reassign-partitions.sh`

Partition Skew - неравномерное распределение данных:
- Проверить ключи партиционирования, один горячий ключ перегружает партицию
- Использовать `kafka-log-dirs.sh` для анализа размеров партиций
- Перераспределить партиции между брокерами через reassignment

> [!important] Runbook-чеклист при инцидентах
> 1. Проверить `OfflinePartitionsCount` и `UnderReplicatedPartitions` в метриках
> 2. Проверить состояние дисков: `df -h` на всех брокерах
> 3. Проверить сетевую связность между брокерами
> 4. Посмотреть логи: `journalctl -u kafka` или `kubectl logs`
> 5. Проверить consumer lag: `kafka-consumer-groups.sh --describe`
> 6. Проверить controller: `kafka-metadata.sh --snapshot` (KRaft)

---

## RabbitMQ

### Архитектура

RabbitMQ реализует протокол AMQP 0-9-1. Сообщение от producer проходит через exchange, который по routing key и bindings направляет его в одну или несколько очередей.

Типы Exchange:

- Direct - маршрутизация по точному совпадению routing key. Сообщение с key=`order.created` попадает в очередь, привязанную с таким же binding key
- Topic - маршрутизация по паттерну. `order.*` матчит `order.created` и `order.updated`. `order.#` матчит `order.created.v2`
- Fanout - сообщение копируется во все привязанные очереди. Routing key игнорируется
- Headers - маршрутизация по заголовкам сообщения вместо routing key. Используется редко

```
Producer → Exchange → Binding (routing key) → Queue → Consumer
```

### Типы очередей

Classic Queues - стандартные очереди, данные хранятся на одном узле. Не рекомендуются для production с версии 3.13.

Quorum Queues - распределённые очереди на основе алгоритма Raft:
- Данные реплицируются на нечётное количество узлов (3, 5, 7)
- Автоматический выбор лидера при падении узла
- Гарантия сохранности данных при отказе меньшинства узлов
- Рекомендованный тип для production

Stream Queues - append-only лог, аналогичный Kafka:
- Поддержка нескольких consumers без удаления сообщений
- Offset-based чтение
- Высокий throughput
- Подходит для event streaming сценариев на базе RabbitMQ

```bash
# Создание quorum queue через rabbitmqadmin
rabbitmqadmin declare queue name=orders queue_type=quorum \
  durable=true arguments='{"x-quorum-initial-group-size": 3}'

# Создание stream queue
rabbitmqadmin declare queue name=events queue_type=stream \
  durable=true arguments='{"x-max-length-bytes": 10737418240}'
```

### Clustering

Кластер RabbitMQ - несколько узлов, объединённых через Erlang distribution protocol. Метаданные (exchanges, bindings, users, vhosts) реплицируются на все узлы. Данные очередей хранятся в зависимости от типа очереди.

Типы узлов:
- Disc - метаданные на диске, переживает перезагрузку
- RAM - метаданные только в памяти, быстрый старт, но теряет метаданные при перезагрузке. Используется редко, в кластере хотя бы один узел должен быть disc

Network Partitions - при разрыве сети между узлами кластер оказывается в split-brain. Стратегии обработки:

- `ignore` - узлы продолжают работать независимо, возможна потеря данных при восстановлении. Не для production
- `pause_minority` - узлы в меньшинстве останавливаются, автовосстановление при починке сети. Рекомендуется для 3+ узлов
- `autoheal` - при восстановлении связности узел с меньшим количеством клиентов перезапускается

```ini
# rabbitmq.conf
cluster_partition_handling = pause_minority
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_k8s
cluster_formation.k8s.host = kubernetes.default.svc.cluster.local
cluster_formation.k8s.address_type = hostname
```

### High Availability

Quorum Queues на основе Raft - рекомендованный подход:

```bash
# Декларация quorum queue с 5 репликами
rabbitmqctl set_policy ha-quorum "^orders\." \
  '{"queue-mode":"default"}' \
  --apply-to queues
```

Mirrored Queues (classic HA) объявлены deprecated с версии 3.13. Используйте quorum queues вместо них.

Delivery guarantees:
- Publisher Confirms - брокер подтверждает получение сообщения. Без подтверждения publisher повторяет отправку
- Consumer Acknowledgments - consumer подтверждает обработку. Без подтверждения сообщение возвращается в очередь
- `mandatory` flag - если exchange не может маршрутизировать сообщение ни в одну очередь, оно возвращается producer

### Federation и Shovel

Federation - асинхронная репликация сообщений между независимыми кластерами. Каждый кластер остаётся автономным, федеративная связь работает через AMQP.

- Federation Exchange - сообщения из upstream exchange копируются в downstream
- Federation Queue - сообщения перетягиваются из upstream queue по мере потребления downstream consumers

Shovel - простой механизм перемещения сообщений между очередями/кластерами:
- Static Shovel - конфигурируется в `rabbitmq.conf`
- Dynamic Shovel - управляется через HTTP API или Management Plugin
- Используется для миграции данных, cross-DC messaging, интеграции с legacy-системами

```bash
# Создать dynamic shovel через HTTP API
curl -u admin:password -X PUT \
  http://localhost:15672/api/parameters/shovel/%2f/dc1-to-dc2 \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "src-protocol": "amqp091",
      "src-uri": "amqp://user:pass@dc1-rabbit:5672",
      "src-queue": "orders",
      "dest-protocol": "amqp091",
      "dest-uri": "amqp://user:pass@dc2-rabbit:5672",
      "dest-queue": "orders-replica"
    }
  }'
```

### Dead Letter Exchanges

DLX - exchange для сообщений, которые не удалось обработать:
- Consumer отклонил (nack/reject) сообщение без requeue
- TTL сообщения истёк
- Очередь переполнена (x-max-length)

```bash
# Создать DLX exchange и очередь
rabbitmqadmin declare exchange name=dlx.orders type=direct durable=true
rabbitmqadmin declare queue name=dlq.orders durable=true queue_type=quorum

rabbitmqadmin declare binding source=dlx.orders \
  destination=dlq.orders routing_key=orders

# Основная очередь с DLX
rabbitmqadmin declare queue name=orders durable=true queue_type=quorum \
  arguments='{"x-dead-letter-exchange": "dlx.orders", "x-dead-letter-routing-key": "orders"}'
```

Retry pattern с TTL:

```
orders (main queue)
  ↓ nack
dlx.orders → dlq.orders.retry.30s (TTL=30s, DLX=amq.direct)
  ↓ TTL expired
orders (повторная обработка)
  ↓ nack (после N попыток)
dlq.orders.failed (финальная DLQ для ручного разбора)
```

### Мониторинг

Management Plugin - встроенный веб-интерфейс (порт 15672). Показывает очереди, exchanges, connections, channels, message rates.

Prometheus Plugin (`rabbitmq_prometheus`) - экспорт метрик на порту 15692:

```yaml
# prometheus scrape config
- job_name: rabbitmq
  static_configs:
    - targets:
        - rabbit-1:15692
        - rabbit-2:15692
        - rabbit-3:15692
  metrics_path: /metrics
```

Ключевые метрики:

```promql
# Глубина очереди - сколько сообщений ждут обработки
rabbitmq_queue_messages{queue="orders"}

# Скорость публикации
rate(rabbitmq_queue_messages_published_total{queue="orders"}[5m])

# Скорость доставки
rate(rabbitmq_queue_messages_delivered_total{queue="orders"}[5m])

# Количество подключений
rabbitmq_connections

# Использование памяти
rabbitmq_process_resident_memory_bytes

# Файловые дескрипторы
rabbitmq_process_open_fds / rabbitmq_process_max_fds
```

> [!important] Алерты для RabbitMQ
> - Queue depth > 10000 - consumers не справляются
> - Memory alarm triggered - брокер блокирует publishers
> - Disk alarm triggered - свободное место на диске ниже порога
> - Network partition detected - split-brain кластера
> - Connection churn > 100/min - приложения постоянно переподключаются

### Operations

```bash
# Статус кластера
rabbitmqctl cluster_status

# Список очередей с глубиной
rabbitmqctl list_queues name messages consumers type

# Список connections
rabbitmqctl list_connections user peer_host state

# Диагностика узла
rabbitmq-diagnostics status
rabbitmq-diagnostics check_running
rabbitmq-diagnostics check_local_alarms
rabbitmq-diagnostics check_port_connectivity

# Управление policies
rabbitmqctl set_policy ttl-policy "^temp\." \
  '{"message-ttl": 86400000}' --apply-to queues

# Принудительная синхронизация quorum queue
rabbitmqctl force_boot

# Удаление узла из кластера
rabbitmqctl forget_cluster_node rabbit@node3

# Export/Import definitions
rabbitmqctl export_definitions /tmp/definitions.json
rabbitmqctl import_definitions /tmp/definitions.json
```

### RabbitMQ в Kubernetes

RabbitMQ Cluster Operator - официальный оператор для Kubernetes:

```yaml
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: production-rabbit
  namespace: rabbitmq
spec:
  replicas: 3
  image: rabbitmq:3.13-management
  resources:
    requests:
      cpu: "1"
      memory: 2Gi
    limits:
      cpu: "2"
      memory: 4Gi
  persistence:
    storageClassName: gp3
    storage: 100Gi
  rabbitmq:
    additionalConfig: |
      cluster_partition_handling = pause_minority
      vm_memory_high_watermark.relative = 0.7
      disk_free_limit.absolute = 2GB
      consumer_timeout = 3600000
      queue_leader_locator = balanced
    additionalPlugins:
      - rabbitmq_prometheus
      - rabbitmq_shovel
      - rabbitmq_shovel_management
  override:
    statefulSet:
      spec:
        template:
          spec:
            topologySpreadConstraints:
              - maxSkew: 1
                topologyKey: topology.kubernetes.io/zone
                whenUnsatisfiable: DoNotSchedule
                labelSelector:
                  matchLabels:
                    app.kubernetes.io/name: production-rabbit
```

---

## NATS

NATS - легковесная система обмена сообщениями с фокусом на простоте и низкой латентности.

Core NATS - at-most-once delivery, без персистентности. Если subscriber не подключён, сообщение теряется. Идеален для сценариев, где допустима потеря отдельных сообщений, но важна скорость.

JetStream - persistence layer поверх NATS:
- At-least-once и exactly-once семантика
- Stream-based хранение с retention policies
- Pull и push consumers
- Дедупликация сообщений

Key-Value Store - распределённое key-value хранилище на базе JetStream:
- Watch для отслеживания изменений
- TTL для ключей
- История значений

```bash
# Создание stream
nats stream add ORDERS \
  --subjects "orders.>" \
  --retention limits \
  --max-msgs -1 \
  --max-bytes 10GB \
  --max-age 168h \
  --storage file \
  --replicas 3 \
  --discard old

# Создание consumer
nats consumer add ORDERS order-processor \
  --filter "orders.created" \
  --ack explicit \
  --deliver all \
  --max-deliver 5 \
  --max-pending 1000 \
  --pull

# Мониторинг
nats server report jetstream
nats stream info ORDERS
nats consumer info ORDERS order-processor
```

NATS в Kubernetes разворачивается через Helm chart:

```bash
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm install nats nats/nats \
  --set nats.jetstream.enabled=true \
  --set nats.jetstream.memStorage.size=1Gi \
  --set nats.jetstream.fileStorage.size=10Gi \
  --set cluster.enabled=true \
  --set cluster.replicas=3
```

---

## Managed сервисы

Для команд без выделенных специалистов по Kafka/RabbitMQ managed-решения снижают операционную нагрузку.

Amazon MSK (Managed Streaming for Apache Kafka):
- Полностью управляемый Kafka кластер в AWS
- Автоматическое обновление, патчинг, мониторинг
- Интеграция с IAM, CloudWatch, S3
- MSK Serverless - автоскейлинг без управления брокерами
- MSK Connect - управляемый Kafka Connect

Confluent Cloud:
- Полностью управляемый Kafka от создателей Kafka
- Schema Registry, ksqlDB, Kafka Connect как managed сервисы
- Multi-cloud (AWS, GCP, Azure)
- Cluster Linking для multi-region репликации

CloudAMQP:
- Managed RabbitMQ в облаке
- Поддержка AWS, GCP, Azure
- Автоматические backups и мониторинг
- Бесплатный tier для разработки

Amazon MQ:
- Managed ActiveMQ и RabbitMQ
- Для миграции legacy-приложений с ActiveMQ
- Ограниченная конфигурируемость по сравнению с self-hosted

> [!info] Выбор между self-hosted и managed
> Self-hosted оправдан при: специфических требованиях к конфигурации, высоком трафике (managed дорого), требованиях data residency, наличии команды с экспертизой. Managed оправдан при: малой команде, быстром старте, отсутствии экспертизы, стандартных сценариях использования.

---

## Сравнение

| Характеристика | Apache Kafka | RabbitMQ | NATS |
|---------------|-------------|----------|------|
| Модель | Distributed log | Message broker | Messaging system |
| Протокол | Kafka Protocol (binary) | AMQP 0-9-1 | NATS Protocol (text) |
| Throughput | Миллионы msg/sec | Десятки тысяч msg/sec | Миллионы msg/sec |
| Латентность | 2-10ms | 1-5ms | < 1ms |
| Ordering | В рамках партиции | В рамках очереди | В рамках subject (JetStream) |
| Retention | Время/размер/compaction | До подтверждения consumer | JetStream: время/размер |
| Replay | Да, offset-based | Нет (кроме stream queues) | JetStream: да |
| Routing | Topic/Partition | Exchange/Binding/Routing Key | Subject hierarchy |
| Масштабирование | Горизонтальное (партиции) | Вертикальное + quorum | Горизонтальное (cluster) |
| Persistence | По умолчанию на диск | По умолчанию на диск | Core: нет, JetStream: да |
| Exactly-once | Transactional API | Нет (at-least-once) | JetStream: дедупликация |
| Операционная сложность | Высокая | Средняя | Низкая |
| Экосистема | Connect, Streams, ksqlDB | Plugins, Federation | Встроенный KV, Object Store |
| Use case | Event streaming, CDC, analytics | Task queues, RPC, routing | IoT, edge, microservices |

> [!summary] Рекомендации по выбору
> Kafka - когда нужен event sourcing, replay событий, высокий throughput, потоковая аналитика, CDC. RabbitMQ - когда нужна сложная маршрутизация, task queues, RPC, интеграция через AMQP. NATS - когда приоритет в простоте, низкой латентности, edge-сценариях, или нужен lightweight pub/sub для микросервисов.
