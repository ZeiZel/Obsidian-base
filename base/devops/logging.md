---
tags:
  - devops
  - logging
  - elk
title: Централизованное логирование
---
## Зачем централизованное логирование

В распределённых системах приложение работает на десятках и сотнях инстансов. Каждый генерирует собственные логи. Попытка диагностировать инцидент через SSH на каждый сервер превращается в кошмар: логи разбросаны, форматы отличаются, хронология размыта.

Проблемы локальных логов:

- Невозможно искать по всем инстансам одновременно
- Логи теряются при перезапуске контейнера или пересоздании пода
- Нет единой временной шкалы для корреляции событий между сервисами
- Отсутствует контроль доступа к логам
- Невозможно строить метрики и дашборды на основе логов
- Ротация и хранение управляются вручную на каждом хосте

Требования к системе централизованного логирования:

- Сбор логов из всех источников в единое хранилище
- Парсинг и нормализация форматов
- Полнотекстовый поиск с фильтрацией по полям
- Визуализация и дашборды для команды
- Retention policies и управление жизненным циклом данных
- Масштабирование под растущий объём логов
- Контроль доступа и аудит

---

## Structured logging

Текстовые логи вида `[INFO] User logged in` удобны для чтения глазами, но крайне неудобны для машинного парсинга. Structured logging решает эту проблему - каждая запись представляет собой JSON-объект с чётко определёнными полями.

### Уровни логирования

| Уровень | Назначение |
|---------|-----------|
| TRACE | Детальная отладка, трассировка вызовов |
| DEBUG | Отладочная информация для разработки |
| INFO | Штатные события: запуск, остановка, обработка запроса |
| WARN | Потенциальные проблемы, которые пока не влияют на работу |
| ERROR | Ошибки, требующие внимания. Конкретный запрос не обработан |
| FATAL | Критическая ошибка, сервис не может продолжать работу |

### Формат JSON-лога

```json
{
  "timestamp": "2026-03-22T10:15:30.123Z",
  "level": "ERROR",
  "service": "order-service",
  "version": "1.4.2",
  "host": "order-service-7f8b9c-xk4z2",
  "trace_id": "abc123def456",
  "span_id": "789ghi",
  "request_id": "req-550e8400-e29b",
  "message": "Failed to process payment",
  "error": { "type": "PaymentGatewayTimeout", "message": "Connection timed out after 5000ms" },
  "metadata": { "order_id": "ord-1234", "amount": 99.99, "retry_count": 2 }
}
```

### Correlation ID, Request ID, Trace ID

- **Request ID** - уникальный идентификатор конкретного HTTP-запроса. Генерируется на входе в систему (API Gateway, ingress) и передаётся через все сервисы в цепочке
- Trace ID - идентификатор распределённой трассировки (OpenTelemetry). Объединяет все спаны одной операции
- Span ID - идентификатор конкретного отрезка работы внутри трассировки
- Correlation ID - бизнес-идентификатор, связывающий несколько запросов в одну бизнес-операцию

Эти идентификаторы позволяют собрать полную картину обработки запроса через десятки микросервисов. Без них диагностика в распределённой системе невозможна.

> [!important] Правило
> Каждый лог-запись должна содержать как минимум: timestamp, level, service, message и один из идентификаторов корреляции. Без этого логи превращаются в шум.

---

## ELK Stack

ELK - классический стек для централизованного логирования: Elasticsearch для хранения и поиска, Logstash для обработки, Kibana для визуализации. В современных инсталляциях к стеку добавляется Beats (Filebeat, Metricbeat) для сбора данных.

### Elasticsearch

Распределённая поисковая система на базе Apache Lucene. Хранит данные в виде JSON-документов и обеспечивает полнотекстовый поиск с низкой задержкой.

#### Архитектура

- Node - отдельный инстанс Elasticsearch. Бывают типы: master, data, coordinating, ingest
- Cluster - группа нод, объединённых общим именем кластера
- Index - логическая группа документов (аналог таблицы в РСУБД)
- Shard - горизонтальный раздел индекса. Бывают primary и replica
- Replica - копия primary shard на другой ноде для отказоустойчивости и распределения нагрузки на чтение

Минимальный продакшн-кластер содержит 3 master-eligible ноды для формирования кворума и избежания split-brain.

#### Mappings

Mapping определяет структуру документов в индексе - типы полей и правила их индексации.

```json
PUT /logs-2026.03
{
  "mappings": {
    "properties": {
      "timestamp":  { "type": "date" },
      "level":      { "type": "keyword" },
      "service":    { "type": "keyword" },
      "message":    { "type": "text", "analyzer": "standard" },
      "trace_id":   { "type": "keyword" },
      "request_id": { "type": "keyword" },
      "host":       { "type": "keyword" },
      "response_time_ms": { "type": "integer" }
    }
  }
}
```

`keyword` используется для полей, по которым нужна точная фильтрация и агрегации. `text` - для полнотекстового поиска с анализатором.

#### Query DSL

```json
GET /logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "message": "payment failed" } }
      ],
      "filter": [
        { "term": { "level": "ERROR" } },
        { "term": { "service": "order-service" } },
        { "range": {
            "timestamp": {
              "gte": "now-1h",
              "lte": "now"
            }
        }}
      ]
    }
  },
  "sort": [{ "timestamp": "desc" }],
  "size": 50
}
```

`must` влияет на scoring (релевантность), `filter` работает в режиме бинарной фильтрации без scoring и кэшируется.

#### Index Lifecycle Management (ILM)

ILM автоматизирует управление жизненным циклом индексов. Логи проходят через фазы: hot, warm, cold, frozen, delete.

```json
PUT _ilm/policy/logs-policy
{
  "policy": {
    "phases": {
      "hot":    { "min_age": "0ms", "actions": {
        "rollover": { "max_size": "50gb", "max_age": "1d" },
        "set_priority": { "priority": 100 }
      }},
      "warm":   { "min_age": "7d", "actions": {
        "shrink": { "number_of_shards": 1 },
        "forcemerge": { "max_num_segments": 1 },
        "set_priority": { "priority": 50 }
      }},
      "cold":   { "min_age": "30d", "actions": {
        "searchable_snapshot": { "snapshot_repository": "logs-snapshots" },
        "set_priority": { "priority": 0 }
      }},
      "delete": { "min_age": "90d", "actions": { "delete": {} } }
    }
  }
}
```

#### Hot-Warm-Cold архитектура

Разные ноды используют разное оборудование в зависимости от фазы данных:

| Фаза | Оборудование | Назначение |
|------|-------------|-----------|
| Hot | NVMe SSD, много CPU/RAM | Активная запись и поиск. Свежие данные |
| Warm | SATA SSD | Только чтение. Данные за последнюю неделю-месяц |
| Cold | HDD или S3 (searchable snapshots) | Редкие запросы. Архивные данные |
| Frozen | S3 (полностью) | Минимальная стоимость. Compliance-хранение |

Ноды помечаются атрибутами (`node.attr.data: hot/warm/cold`), а ILM-политики перемещают индексы между фазами автоматически.

### Logstash

Серверный конвейер обработки данных. Принимает данные из множества источников, трансформирует и отправляет в целевые системы.

#### Архитектура пайплайна

Каждый пайплайн состоит из трёх секций: input, filter, output. Logstash может запускать несколько пайплайнов параллельно.

```ruby
# /etc/logstash/conf.d/main.conf
input {
  beats { port => 5044; ssl => true
    ssl_certificate => "/etc/logstash/certs/logstash.crt"
    ssl_key => "/etc/logstash/certs/logstash.key"
  }
  kafka {
    bootstrap_servers => "kafka-1:9092,kafka-2:9092,kafka-3:9092"
    topics => ["app-logs"]; group_id => "logstash-consumers"; codec => "json"
  }
}

filter {
  if [message] =~ /^\{/ {
    json { source => "message" }
  } else {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} \[%{DATA:service}\] %{GREEDYDATA:log_message}" }
    }
  }
  date { match => ["timestamp", "ISO8601"]; target => "@timestamp"; remove_field => ["timestamp"] }
  mutate {
    rename => { "log_message" => "message" }
    remove_field => ["agent", "ecs", "input", "tags"]
    add_field => { "environment" => "production" }
  }
  if [source_ip] { geoip { source => "source_ip"; target => "geo" } }
}

output {
  elasticsearch {
    hosts => ["https://es-node-1:9200", "https://es-node-2:9200"]
    index => "logs-%{[service]}-%{+YYYY.MM.dd}"
    user => "logstash_writer"; password => "${ES_PASSWORD}"
    ssl => true; cacert => "/etc/logstash/certs/ca.crt"
  }
}
```

#### Grok patterns

Grok разбирает неструктурированные логи в именованные поля с помощью паттернов:

```ruby
# Nginx access log
grok {
  match => {
    "message" => '%{IPORHOST:remote_addr} - %{DATA:remote_user} \[%{HTTPDATE:time}\] "%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}" %{NUMBER:status} %{NUMBER:body_bytes_sent} "%{DATA:http_referer}" "%{DATA:http_user_agent}"'
  }
}

# Custom application log
grok {
  match => {
    "message" => "\[%{TIMESTAMP_ISO8601:timestamp}\] \[%{LOGLEVEL:level}\] \[%{DATA:thread}\] %{JAVACLASS:class} - %{GREEDYDATA:log_message}"
  }
}
```

#### pipelines.yml

Файл `pipelines.yml` позволяет запускать несколько изолированных пайплайнов в одном инстансе Logstash:

```yaml
# /etc/logstash/pipelines.yml
- pipeline.id: app-logs
  path.config: "/etc/logstash/conf.d/app-logs.conf"
  pipeline.workers: 4
  pipeline.batch.size: 250

- pipeline.id: audit-logs
  path.config: "/etc/logstash/conf.d/audit-logs.conf"
  pipeline.workers: 2
  pipeline.batch.size: 125

- pipeline.id: metrics
  path.config: "/etc/logstash/conf.d/metrics.conf"
  pipeline.workers: 2
```

### Kibana

Веб-интерфейс для визуализации и анализа данных из Elasticsearch.

#### Основные инструменты

- Discover - интерактивный поиск и просмотр логов. Поддерживает KQL (Kibana Query Language) и Lucene-синтаксис. Фильтрация по полям, временным диапазонам, сохранение поисковых запросов
- Dashboards - наборы визуализаций на одном экране. Интерактивные фильтры, drill-down, автообновление
- Visualizations - графики, таблицы, карты, гистограммы. Lens для быстрого создания, TSVB для временных рядов
- Saved searches - повторно используемые поисковые запросы, которые можно вставлять в дашборды

#### Spaces и RBAC

Spaces разделяют Kibana на изолированные рабочие пространства. Каждая команда или проект получает свой набор дашбордов, индекс-паттернов и сохранённых объектов.

RBAC настраивается через роли в Elasticsearch:

```json
POST /_security/role/logs-reader
{
  "indices": [{ "names": ["logs-order-service-*"], "privileges": ["read", "view_index_metadata"] }],
  "applications": [{
    "application": "kibana-.kibana",
    "privileges": ["feature_discover.read", "feature_dashboard.read"],
    "resources": ["space:order-team"]
  }]
}
```

### Filebeat

Легковесный агент для сбора и отправки логов. Потребляет минимум ресурсов, гарантирует at-least-once доставку через реестр обработанных файлов.

#### Конфигурация

```yaml
# /etc/filebeat/filebeat.yml
filebeat.inputs:
  - type: filestream
    id: app-logs
    paths: ["/var/log/app/*.log"]
    parsers:
      - ndjson: { keys_under_root: true, overwrite_keys: true }
    fields: { environment: production, service: order-service }
    fields_under_root: true
  - type: filestream
    id: nginx-logs
    paths: ["/var/log/nginx/access.log"]
    parsers:
      - multiline: { type: pattern, pattern: '^\d{4}-\d{2}-\d{2}', negate: true, match: after }

processors:
  - add_host_metadata: ~
  - add_kubernetes_metadata:
      host: ${NODE_NAME}
      matchers:
        - logs_path: { logs_path: "/var/log/containers/" }

output.elasticsearch:
  hosts: ["https://es-node-1:9200", "https://es-node-2:9200"]
  username: "filebeat_writer"
  password: "${ES_PASSWORD}"
  ssl.certificate_authorities: ["/etc/filebeat/certs/ca.crt"]
  indices:
    - index: "logs-nginx-%{+yyyy.MM.dd}"
      when.contains: { log.file.path: "nginx" }
    - index: "logs-app-%{+yyyy.MM.dd}"
```

#### Autodiscover в Kubernetes

Filebeat автоматически обнаруживает новые поды и настраивает сбор логов на основе аннотаций:

```yaml
filebeat.autodiscover:
  providers:
    - type: kubernetes
      node: ${NODE_NAME}
      hints.enabled: true
      hints.default_config:
        type: container
        paths: ["/var/log/containers/*-${data.kubernetes.container.id}.log"]
```

Поды управляют сбором логов через аннотации: `co.elastic.logs/enabled: "true"`, `co.elastic.logs/json.keys_under_root: "true"`.

---

## Grafana Loki

Loki - система агрегации логов от Grafana Labs, вдохновлённая Prometheus. Главное отличие от Elasticsearch - Loki не индексирует содержимое логов, а индексирует только метаданные (labels).

### Архитектура

Loki состоит из нескольких компонентов, которые могут работать в одном процессе (monolithic mode) или деплоиться отдельно (microservices mode):

- Distributor - принимает входящие потоки логов, валидирует и распределяет по ingester-ам с помощью consistent hashing
- Ingester - буферизует логи в памяти, формирует chunks и записывает в long-term storage
- Querier - выполняет запросы LogQL, читая данные из ingester-ов (свежие) и object storage (исторические)
- Compactor - сжимает и дедуплицирует index-файлы в object storage, выполняет retention
- Query Frontend - опциональный компонент для кэширования и параллелизации запросов

#### Хранение данных

Loki хранит два типа данных: index (метаданные и labels) и chunks (сжатые строки логов).

| Backend | Index | Chunks | Подходит для |
|---------|-------|--------|-------------|
| Filesystem | BoltDB | Файлы | Локальная разработка |
| S3 + DynamoDB | DynamoDB | S3 | AWS продакшн |
| S3 (TSDB) | TSDB (S3) | S3 | Рекомендуемый вариант |
| GCS | TSDB (GCS) | GCS | GCP продакшн |
| MinIO | TSDB (MinIO) | MinIO | On-premise продакшн |

```yaml
# loki-config.yaml
schema_config:
  configs:
    - from: "2024-01-01"
      store: tsdb
      object_store: s3
      schema: v13
      index: { prefix: loki_index_, period: 24h }

storage_config:
  tsdb_shipper: { active_index_directory: /loki/index, cache_location: /loki/index_cache }
  aws: { s3: "s3://us-east-1/loki-logs-bucket", region: us-east-1 }

compactor: { working_directory: /loki/compactor, retention_enabled: true, retention_delete_delay: 2h }
limits_config: { retention_period: 90d, ingestion_rate_mb: 16, ingestion_burst_size_mb: 32 }
```

### Labels vs full-text indexing

> [!summary] Почему Loki дешевле ELK
> Elasticsearch индексирует каждое слово в каждой строке лога. Это обеспечивает мгновенный полнотекстовый поиск, но требует огромного объёма хранилища и CPU.
>
> Loki индексирует только labels (service, namespace, pod, level) и хранит строки логов в сжатых chunks. Поиск по содержимому выполняется brute-force через chunks, что медленнее, но стоимость хранения и эксплуатации ниже в 5-10 раз.
>
> Для большинства рабочих нагрузок скорость поиска Loki достаточна, если labels выбраны правильно и временные диапазоны запросов разумны.

Правила выбора labels:

- Низкая кардинальность - namespace, service, level, environment. Не более 10-20 уникальных значений
- Не используй как labels: request_id, user_id, trace_id. Высокая кардинальность приводит к взрывному росту индекса
- Динамические данные извлекай из содержимого лога через парсеры LogQL в момент запроса

### LogQL

Язык запросов Loki, синтаксически похож на PromQL. Делится на log queries (возвращают строки логов) и metric queries (возвращают числовые значения).

#### Log queries

```logql
# Все ERROR-логи order-service за последний час
{service="order-service", level="ERROR"}

# Поиск по содержимому
{namespace="production"} |= "connection refused"

# Отрицание
{service="api-gateway"} != "health check"

# Регулярное выражение
{service=~"order-.*"} |~ "timeout|deadline exceeded"
```

#### Парсеры

```logql
# JSON parser - извлекает поля из JSON-логов
{service="order-service"} | json | status_code >= 500

# Regexp parser
{service="nginx"} | regexp `(?P<method>\w+) (?P<path>\S+) HTTP/(?P<version>[\d.]+)" (?P<status>\d+)`
  | status >= 400

# Pattern parser - упрощённый синтаксис
{service="nginx"} | pattern `<ip> - - [<_>] "<method> <path> <_>" <status> <size>`
  | status = "500"

# line_format - переформатирование вывода
{service="order-service"} | json
  | line_format "{{.level}} | {{.trace_id}} | {{.message}}"
```

#### Metric queries

```logql
# Частота ошибок за 5 минут
rate({service="order-service", level="ERROR"}[5m])

# Количество логов по уровням
sum by (level) (count_over_time({namespace="production"}[1h]))

# 99-й перцентиль времени ответа (из JSON-поля)
{service="api-gateway"} | json | unwrap response_time_ms
  | quantile_over_time(0.99, [5m])

# Процент ошибок
sum(rate({service="order-service", level="ERROR"}[5m]))
/
sum(rate({service="order-service"}[5m])) * 100
```

### Promtail

Агент для сбора логов и отправки в Loki. Аналог Filebeat для ELK.

```yaml
# promtail-config.yaml
server: { http_listen_port: 9080 }
positions: { filename: /tmp/positions.yaml }
clients:
  - url: http://loki:3100/loki/api/v1/push
    tenant_id: production

scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs: [{ role: pod }]
    relabel_configs:
      - { source_labels: [__meta_kubernetes_pod_label_app], target_label: app }
      - { source_labels: [__meta_kubernetes_namespace], target_label: namespace }
      - { source_labels: [__meta_kubernetes_pod_name], target_label: pod }
    pipeline_stages:
      - docker: {}
      - json: { expressions: { level: level, trace_id: trace_id, service: service } }
      - labels: { level: null, service: null }
      - timestamp: { source: timestamp, format: RFC3339Nano }
      - output: { source: message }
```

#### Pipeline stages

Pipeline stages позволяют трансформировать лог-записи до отправки в Loki:

| Stage | Назначение |
|-------|-----------|
| docker / cri | Парсинг формата контейнерного runtime |
| json | Извлечение полей из JSON |
| regex | Извлечение полей по регулярному выражению |
| labels | Промоутинг извлечённых полей в labels Loki |
| timestamp | Установка timestamp из поля лога |
| output | Выбор поля как основного содержимого строки |
| metrics | Экспорт Prometheus-метрик из логов |
| drop | Отбрасывание записей по условию |
| multiline | Склейка многострочных записей |

---

## Fluentd и Fluent Bit

### Fluentd

Унифицированный сборщик логов от CNCF. Написан на Ruby/C, поддерживает сотни плагинов для input, filter, output.

#### Архитектура

Fluentd использует тегированную систему маршрутизации. Каждое событие имеет tag, time и record. Теги определяют, через какие фильтры и в какие output-ы попадёт событие.

```xml
<!-- /etc/fluentd/fluent.conf -->
<source>
  @type tail
  path /var/log/containers/*.log
  pos_file /var/log/fluentd/containers.pos
  tag kubernetes.*
  <parse>
    @type json
    time_key time
    time_format %Y-%m-%dT%H:%M:%S.%NZ
  </parse>
</source>

<filter kubernetes.**>
  @type kubernetes_metadata
</filter>

<match kubernetes.**>
  @type elasticsearch
  host elasticsearch.logging.svc
  port 9200
  scheme https
  user fluentd_writer
  password "#{ENV['ES_PASSWORD']}"
  logstash_format true
  logstash_prefix k8s-logs
  <buffer>
    @type file
    path /var/log/fluentd/buffer/es
    flush_interval 5s
    chunk_limit_size 8MB
    total_limit_size 2GB
    retry_forever true
  </buffer>
</match>
```

#### Buffer

Buffer - ключевой механизм надёжности Fluentd. Буферизует события перед отправкой, обеспечивая at-least-once доставку даже при сбоях destination.

Типы буферов:

- memory - быстрый, но данные теряются при крэше
- file - медленнее, но переживает перезапуски

### Fluent Bit

Легковесная альтернатива Fluentd, написанная на C. Потребляет на порядок меньше памяти, что делает его идеальным для Kubernetes DaemonSet.

```yaml
# fluent-bit.conf
service: { flush: 1, log_level: info, daemon: off, parsers_file: parsers.conf }
pipeline:
  inputs:
    - name: tail
      tag: kube.*
      path: /var/log/containers/*.log
      parser: cri
      db: /var/log/flb_kube.db
      mem_buf_limit: 5MB
  filters:
    - name: kubernetes
      match: kube.*
      merge_log: on
      keep_log: off
      k8s-logging.parser: on
    - name: grep
      match: kube.*
      exclude: { key: "$kubernetes['namespace_name']", regex: "^(kube-system|monitoring)$" }
  outputs:
    - name: es
      match: kube.*
      host: elasticsearch.logging.svc
      port: 9200
      tls: on
      http_user: fluent_writer
      http_passwd: ${ES_PASSWORD}
      logstash_format: on
      logstash_prefix: k8s
    - name: loki
      match: kube.*
      host: loki.logging.svc
      port: 3100
      labels: job=fluent-bit, cluster=production
      auto_kubernetes_labels: on
```

#### Kubernetes DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels: { app: fluent-bit }
  template:
    metadata:
      labels: { app: fluent-bit }
    spec:
      serviceAccountName: fluent-bit
      tolerations: [{ operator: Exists }]
      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:3.2
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits: { cpu: 200m, memory: 128Mi }
          volumeMounts:
            - { name: varlog, mountPath: /var/log, readOnly: true }
            - { name: containers, mountPath: /var/log/containers, readOnly: true }
            - { name: config, mountPath: /fluent-bit/etc/ }
          env:
            - name: ES_PASSWORD
              valueFrom:
                secretKeyRef: { name: logging-secrets, key: es-password }
      volumes:
        - { name: varlog, hostPath: { path: /var/log } }
        - { name: containers, hostPath: { path: /var/log/containers } }
        - { name: config, configMap: { name: fluent-bit-config } }
```

### Сравнение Fluentd vs Fluent Bit

| Параметр | Fluentd | Fluent Bit |
|----------|---------|-----------|
| Язык | Ruby + C | C |
| Потребление памяти | 60-100 MB | 5-15 MB |
| Плагины | 1000+ | 100+ (основные) |
| Роль | Агрегатор, центральный коллектор | Лёгкий агент на каждой ноде |
| Буферизация | Продвинутая (file/memory) | Базовая (memory) |
| Конфигурация | Собственный DSL | INI-подобный или YAML |
| Продакшн паттерн | Fluent Bit (агент) → Fluentd (агрегатор) → Storage |

> [!info] Типичная архитектура
> В Kubernetes Fluent Bit деплоится как DaemonSet на каждой ноде, собирает логи контейнеров и отправляет в центральный Fluentd. Fluentd выполняет тяжёлую обработку, обогащение и маршрутизацию в конечные хранилища.

---

## Log rotation

На хостах, где логи пишутся в файлы, logrotate предотвращает заполнение диска.

```bash
# /etc/logrotate.d/app-logs
/var/log/app/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    dateext
    dateformat -%Y%m%d
    maxsize 100M
    sharedscripts
    postrotate
        /usr/bin/systemctl reload app.service > /dev/null 2>&1 || true
    endscript
    create 0640 app app
}
```

Ключевые директивы:

| Директива | Назначение |
|-----------|-----------|
| daily/weekly/monthly | Периодичность ротации |
| rotate N | Количество архивных копий |
| compress | Сжатие архивных файлов (gzip) |
| delaycompress | Не сжимать предпоследний файл (для tail -f) |
| dateext | Добавлять дату в имя файла вместо номера |
| maxsize | Ротировать при достижении размера, независимо от периодичности |
| sharedscripts | Выполнять postrotate один раз для всех файлов |
| postrotate | Команда после ротации, обычно сигнал приложению переоткрыть файл |
| copytruncate | Копирование и обрезка вместо переименования. Для приложений, не умеющих переоткрывать файлы |

> [!important] copytruncate vs postrotate
> `copytruncate` может потерять строки, записанные между копированием и обрезкой. Предпочтительнее научить приложение обрабатывать сигнал SIGHUP и переоткрывать лог-файл, используя `postrotate` с отправкой сигнала.

---

## Kubernetes logging

### Архитектуры сбора логов

В Kubernetes контейнерные логи (stdout/stderr) записываются container runtime в файлы на ноде. Существует три основных подхода к их сбору.

#### Node-level logging agent (DaemonSet)

Самый распространённый подход. Агент (Fluent Bit, Filebeat, Promtail) запускается как DaemonSet на каждой ноде и собирает логи всех контейнеров.

Преимущества: минимальное влияние на приложения, один агент на ноду, простая конфигурация через autodiscover. Недостатки: доступны только stdout/stderr, нет изоляции между подами.

#### Sidecar контейнер

Sidecar-контейнер в том же поде перенаправляет логи из файлов в stdout или напрямую в backend.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts: [{ name: logs, mountPath: /var/log/app }]
    - name: log-shipper
      image: fluent/fluent-bit:3.2
      volumeMounts:
        - { name: logs, mountPath: /var/log/app, readOnly: true }
        - { name: config, mountPath: /fluent-bit/etc/ }
      resources:
        requests: { cpu: 10m, memory: 16Mi }
        limits: { cpu: 50m, memory: 64Mi }
  volumes:
    - { name: logs, emptyDir: {} }
    - { name: config, configMap: { name: sidecar-fluent-bit } }
```

Преимущества: доступ к файлам внутри контейнера, изоляция конфигурации. Недостатки: дополнительное потребление ресурсов на каждый под.

#### Direct to backend

Приложение отправляет логи напрямую в backend через HTTP API или SDK. Используется редко из-за жёсткой связи с инфраструктурой и потери логов при недоступности backend-а.

### Kubernetes Audit Logs

Audit logs фиксируют все запросы к Kubernetes API Server: кто, что, когда и с каким результатом.

#### Audit Policy

```yaml
# /etc/kubernetes/audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: None                              # health checks
    users: ["system:kube-probe"]
  - level: None                              # шумные ресурсы
    resources: [{ group: "", resources: ["endpoints", "events"] }]
  - level: Metadata                          # read-операции
    verbs: ["get", "list", "watch"]
  - level: Request                           # запись секретов
    resources: [{ group: "", resources: ["secrets", "configmaps"] }]
    verbs: ["create", "update", "patch"]
  - level: RequestResponse                   # критичные ресурсы
    resources:
      - { group: "", resources: ["pods", "services"] }
      - { group: "apps", resources: ["deployments", "daemonsets", "statefulsets"] }
      - { group: "rbac.authorization.k8s.io", resources: ["roles", "clusterroles", "rolebindings", "clusterrolebindings"] }
    verbs: ["create", "update", "patch", "delete"]
  - level: Metadata                          # всё остальное
    omitStages: ["RequestReceived"]
```

#### Уровни аудита

| Уровень | Что записывается |
|---------|-----------------|
| None | Ничего |
| Metadata | Метаданные запроса: пользователь, ресурс, verb, timestamp |
| Request | Metadata + тело запроса |
| RequestResponse | Metadata + тело запроса + тело ответа |

Аудит-логи отправляются через webhook backend в систему централизованного логирования для анализа и alerting.

---

## Log pipeline design

Полный пайплайн обработки логов состоит из последовательных этапов. Каждый этап можно масштабировать и заменять независимо.

```
Collection → Buffering → Parsing → Enrichment → Routing → Storage → Visualization → Retention
```

- Collection - агенты (Filebeat, Fluent Bit, Promtail) собирают логи из файлов, stdout/stderr, syslog и обеспечивают at-least-once доставку
- Buffering - буферный слой (Kafka, Redis) между агентами и обработчиками. Защищает от потери данных при пиковых нагрузках. Kafka полезна для fan-out в несколько систем
- Parsing - преобразование сырых строк в структурированные записи через grok, regex, json parsers
- Enrichment - добавление контекста: Kubernetes metadata, GeoIP, маппинг service в team
- Routing - направление логов в разные хранилища. Audit-логи в отдельный индекс с длинным retention, debug - в дешёвое хранилище, error - дублируются в alerting
- Storage - Elasticsearch для полнотекстового поиска, Loki для label-based запросов, S3 для архивов
- Retention - автоматическое удаление старых данных. ILM в Elasticsearch, compactor в Loki, lifecycle rules в S3

---

## Best practices

### Что логировать

- Входящие HTTP-запросы: метод, путь, статус, длительность, request_id
- Исходящие запросы к внешним сервисам и базам данных
- Ошибки с полным стек-трейсом и контекстом
- Бизнес-события: оформление заказа, платёж, регистрация
- Изменения состояния системы: запуск, остановка, переподключение
- События аутентификации и авторизации
- Медленные запросы (свыше порогового значения)

### Что не логировать

- Пароли, токены, API-ключи, session cookies
- Персональные данные (PII): email, телефон, адрес, номер карты
- Полное содержимое тела запроса/ответа с чувствительными данными
- Health check запросы (забивают шумом)
- Бинарные данные

> [!important] PII и compliance
> GDPR, PCI DSS и другие стандарты требуют маскирования персональных данных в логах. Настройте фильтры для маскирования на уровне pipeline (Logstash mutate, Fluent Bit modify) ещё до записи в хранилище.

### Retention policies

| Тип логов | Retention | Обоснование |
|-----------|-----------|------------|
| Application (INFO) | 14-30 дней | Операционная диагностика |
| Application (ERROR) | 30-90 дней | Анализ трендов, отложенная отладка |
| Audit logs | 1-7 лет | Compliance, security forensics |
| Access logs | 30-90 дней | Traffic analysis, debugging |
| Debug logs | 3-7 дней | Только для активной отладки |

### Cost management

- Используй hot-warm-cold архитектуру для оптимизации стоимости хранения
- Фильтруй шум на этапе сбора, а не после записи в хранилище
- Устанавливай ingestion rate limits для защиты от log storms
- Мониторь объём и стоимость логов по сервисам и командам
- Сэмплируй debug-логи в продакшне вместо полного отключения
- Используй Loki вместо ELK для рабочих нагрузок, не требующих полнотекстового поиска

---

## Сравнение решений

| Критерий | ELK Stack | Grafana Loki | Datadog Logs | CloudWatch Logs |
|----------|-----------|-------------|-------------|----------------|
| Тип | Self-hosted / Elastic Cloud | Self-hosted / Grafana Cloud | SaaS | AWS managed |
| Индексация | Full-text (inverted index) | Labels only | Full-text | Full-text |
| Язык запросов | Query DSL, KQL | LogQL | Proprietary | CloudWatch Insights |
| Стоимость хранения | Высокая (полный индекс) | Низкая (только labels) | Высокая (per GB ingestion) | Средняя |
| Скорость поиска | Быстрая | Зависит от labels и диапазона | Быстрая | Средняя |
| Масштабирование | Горизонтальное (shards) | Горизонтальное (microservices) | Автоматическое | Автоматическое |
| Интеграция с Grafana | Через data source | Нативная | Через плагин | Через плагин |
| Интеграция с Prometheus | Нет | Нативная (одни labels) | Встроенные метрики | CloudWatch Metrics |
| Kubernetes support | Filebeat/Fluentd | Promtail/Fluent Bit | Datadog Agent | CloudWatch Agent |
| Операционная сложность | Высокая | Средняя | Минимальная | Минимальная |
| Подходит для | Полнотекстовый поиск, крупные команды | Kubernetes-native, бюджетные проекты | Команды без DevOps, SaaS-ориентированные | AWS-native инфраструктура |

> [!summary] Как выбрать
> Для Kubernetes-native стека с Prometheus/Grafana - Loki. Для сложных поисковых запросов по неструктурированным логам - ELK. Для минимальных операционных затрат при бюджете на SaaS - Datadog. Для AWS-only инфраструктуры с простыми потребностями - CloudWatch.
