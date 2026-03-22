---
tags:
  - devops
  - monitoring
  - datadog
title: DataDog
---

## Архитектура DataDog

DataDog - SaaS-платформа для мониторинга, трейсинга, управления логами и обеспечения наблюдаемости инфраструктуры. Платформа объединяет метрики, логи, трейсы и security-события в единый интерфейс, предоставляя полную картину состояния систем.

### Компоненты платформы

- Datadog Agent - основной процесс, который устанавливается на каждый хост. Собирает метрики, логи, трейсы и отправляет их в SaaS-бэкенд DataDog
- DogStatsD - легковесный UDP/UDS-сервер, встроенный в Agent, принимает кастомные метрики от приложений по протоколу StatsD
- Trace Agent - компонент внутри Agent, принимает трейсы от инструментированных приложений и пересылает в APM-бэкенд
- Process Agent - собирает информацию о запущенных процессах, контейнерах и live-процессах на хосте
- Cluster Agent - специальный компонент для Kubernetes, централизует взаимодействие с API-сервером и снижает нагрузку на control plane

```
┌─────────────────────────────────────────────────────────┐
│                    Datadog SaaS Backend                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Metrics  │ │   APM    │ │   Logs   │ │ Security  │  │
│  └────▲─────┘ └────▲─────┘ └────▲─────┘ └─────▲─────┘  │
└───────┼─────────────┼───────────┼──────────────┼────────┘
        │             │           │              │
┌───────┼─────────────┼───────────┼──────────────┼────────┐
│       │       Datadog Agent     │              │        │
│  ┌────┴─────┐ ┌─────┴────┐ ┌───┴──────┐ ┌─────┴─────┐  │
│  │DogStatsD │ │Trace Agt │ │ Log Agt  │ │Process Agt│  │
│  └────▲─────┘ └────▲─────┘ └────▲─────┘ └───────────┘  │
│       │            │            │                       │
└───────┼────────────┼────────────┼───────────────────────┘
        │            │            │
   Custom Metrics  Traces     Log Files/Streams
```

> [!info] Datadog Agent работает как единый бинарник, внутри которого запускаются все sub-agents. Конфигурация управляется через один файл `datadog.yaml` и набор integration-конфигов в `conf.d/`.

## Установка Agent

### Установка на хост

Для Debian/Ubuntu:

```bash
DD_API_KEY=<YOUR_API_KEY> DD_SITE="datadoghq.com" \
  bash -c "$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)"
```

Для RHEL/CentOS:

```bash
DD_API_KEY=<YOUR_API_KEY> DD_SITE="datadoghq.com" \
  bash -c "$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)"
```

После установки основной конфиг располагается в `/etc/datadog-agent/datadog.yaml`:

```yaml
api_key: <YOUR_API_KEY>
site: datadoghq.com
hostname: web-server-01

# Включение логирования
logs_enabled: true

# Включение APM
apm_config:
  enabled: true
  env: production

# Включение Process Agent
process_config:
  process_collection:
    enabled: true

# Теги для всех метрик с этого хоста
tags:
  - env:production
  - service:api
  - team:platform
```

### Docker контейнер

```bash
docker run -d --name datadog-agent \
  -e DD_API_KEY=<YOUR_API_KEY> \
  -e DD_SITE="datadoghq.com" \
  -e DD_APM_ENABLED=true \
  -e DD_LOGS_ENABLED=true \
  -e DD_PROCESS_AGENT_ENABLED=true \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc/:/host/proc/:ro \
  -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro \
  -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
  gcr.io/datadoghq/agent:7
```

### Kubernetes через Helm

Рекомендуемый способ установки в кластер - Helm chart `datadog/datadog`:

```bash
helm repo add datadog https://helm.datadoghq.com
helm repo update

helm install datadog datadog/datadog \
  --set datadog.apiKey=<YOUR_API_KEY> \
  --set datadog.site=datadoghq.com \
  -f values.yaml \
  -n datadog --create-namespace
```

Типичный `values.yaml` для production-кластера:

```yaml
datadog:
  apiKey: <YOUR_API_KEY>
  site: datadoghq.com
  clusterName: production-us-east-1

  logs:
    enabled: true
    containerCollectAll: true

  apm:
    portEnabled: true
    socketEnabled: true

  processAgent:
    enabled: true
    processCollection: true

  networkMonitoring:
    enabled: true

  tags:
    - env:production
    - cluster:us-east-1

clusterAgent:
  enabled: true
  replicas: 2
  metricsProvider:
    enabled: true  # для HPA на основе кастомных метрик

agents:
  tolerations:
    - operator: Exists  # запуск на всех нодах

  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
```

### Datadog Operator

Альтернатива Helm - Datadog Operator предоставляет CRD `DatadogAgent`:

```yaml
apiVersion: datadoghq.com/v2alpha1
kind: DatadogAgent
metadata:
  name: datadog
  namespace: datadog
spec:
  global:
    clusterName: production
    credentials:
      apiSecret:
        secretName: datadog-secret
        keyName: api-key
    tags:
      - env:production
  features:
    apm:
      enabled: true
    logCollection:
      enabled: true
      containerCollectAll: true
    npm:
      enabled: true
  override:
    nodeAgent:
      tolerations:
        - operator: Exists
```

## Infrastructure Monitoring

### Host Map

Host Map визуализирует все хосты в инфраструктуре, группируя их по тегам. Каждый хост отображается как шестиугольник, цвет которого показывает значение выбранной метрики.

Типичные группировки:
- По окружению: `env:production`, `env:staging`
- По сервису: `service:api`, `service:worker`
- По облачному провайдеру: `availability-zone`, `region`
- По Kubernetes: `kube_namespace`, `kube_deployment`

### Live Containers

Раздел позволяет в реальном времени видеть все контейнеры, их ресурсы и состояние. Для Kubernetes доступна визуализация по подам, деплойментам и другим ресурсам.

### Интеграции

DataDog поддерживает более 750 интеграций. Конфигурация интеграции размещается в `/etc/datadog-agent/conf.d/<integration>.d/conf.yaml`.

Пример интеграции с PostgreSQL:

```yaml
# /etc/datadog-agent/conf.d/postgres.d/conf.yaml
init_config:

instances:
  - host: localhost
    port: 5432
    username: datadog
    password: <PASSWORD>
    dbname: myapp_production
    tags:
      - env:production
      - service:database
    collect_activity_metrics: true
    collect_database_size_metrics: true
    query_metrics:
      enabled: true
    query_samples:
      enabled: true
```

Пример интеграции с NGINX:

```yaml
# /etc/datadog-agent/conf.d/nginx.d/conf.yaml
init_config:

instances:
  - nginx_status_url: http://localhost:8080/nginx_status
    tags:
      - env:production
      - service:nginx
```

Пример интеграции с Redis:

```yaml
# /etc/datadog-agent/conf.d/redisdb.d/conf.yaml
init_config:

instances:
  - host: localhost
    port: 6379
    password: <PASSWORD>
    tags:
      - env:production
      - service:cache
    keys:
      - user_sessions:*
      - rate_limit:*
```

### Auto-Discovery в Kubernetes

Agent автоматически обнаруживает сервисы в Kubernetes через аннотации подов:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  template:
    metadata:
      annotations:
        ad.datadoghq.com/redis.checks: |
          {
            "redisdb": {
              "instances": [
                {
                  "host": "%%host%%",
                  "port": "6379",
                  "password": "%%env_REDIS_PASSWORD%%"
                }
              ]
            }
          }
        ad.datadoghq.com/redis.logs: |
          [{"source": "redis", "service": "redis"}]
    spec:
      containers:
        - name: redis
          image: redis:7
```

> [!important] Шаблонные переменные `%%host%%`, `%%port%%`, `%%env_VAR%%` позволяют динамически подставлять значения из контейнера при auto-discovery.

## Метрики

### Типы метрик

- Count - количество событий за интервал. Пример: число HTTP-запросов. Agent отправляет значение как есть, нормализация происходит на бэкенде
- Rate - количество событий за секунду. Agent делит count на интервал сбора перед отправкой
- Gauge - текущее значение в момент сбора. Пример: использование памяти, количество активных соединений
- Histogram - статистическое распределение значений. Вычисляет avg, count, median, max и перцентили на стороне Agent
- Distribution - аналог histogram, но агрегация перцентилей происходит на сервере, что даёт точные значения по любым комбинациям тегов

### Custom Metrics через DogStatsD

DogStatsD слушает на UDP порту 8125. Пример отправки метрик из приложения на Go:

```go
package main

import (
    "github.com/DataDog/datadog-go/v5/statsd"
    "log"
)

func main() {
    client, err := statsd.New("127.0.0.1:8125",
        statsd.WithNamespace("myapp."),
        statsd.WithTags([]string{"env:production", "service:api"}),
    )
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Increment counter
    client.Incr("requests.count", []string{"endpoint:/users", "method:GET"}, 1)

    // Gauge
    client.Gauge("queue.size", 42, []string{"queue:emails"}, 1)

    // Histogram
    client.Histogram("request.duration", 0.235, []string{"endpoint:/users"}, 1)

    // Distribution
    client.Distribution("payment.amount", 99.50, []string{"currency:usd"}, 1)
}
```

Пример на Python:

```python
from datadog import DogStatsd

statsd = DogStatsd(host="127.0.0.1", port=8125)

statsd.increment("myapp.page.views", tags=["page:home"])
statsd.gauge("myapp.active_users", 150, tags=["region:us"])
statsd.histogram("myapp.request.latency", 0.320, tags=["service:api"])
```

### Теги и агрегация

Теги - ключевой инструмент для группировки и фильтрации метрик. Формат: `key:value`.

Зарезервированные теги:
- `env` - окружение
- `service` - имя сервиса
- `version` - версия приложения
- `host` - имя хоста

### Query Syntax

Синтаксис запросов метрик в DataDog:

```
<aggregation>:<metric_name>{<filter>} by {<group>}.<rollup>(<method>, <interval>)
```

Примеры:

```
# Средний CPU по всем хостам в production
avg:system.cpu.user{env:production}

# P99 латентности по сервисам
p99:trace.http.request.duration{env:production} by {service}

# Rate ошибок 5xx за последние 5 минут
sum:nginx.requests{status:5xx}.as_rate().rollup(sum, 300)

# Top 10 эндпоинтов по количеству запросов
top(sum:myapp.requests.count{*} by {endpoint}, 10, 'sum', 'desc')
```

## APM

**Application Performance Monitoring** позволяет трейсить запросы от входа в систему до ответа, проходя через все микросервисы.

### Инструментация

Для Go:

```go
package main

import (
    "net/http"
    httptrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/net/http"
    "gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
)

func main() {
    tracer.Start(
        tracer.WithService("api-gateway"),
        tracer.WithEnv("production"),
        tracer.WithServiceVersion("1.2.3"),
        tracer.WithAgentAddr("localhost:8126"),
    )
    defer tracer.Stop()

    mux := httptrace.NewServeMux()
    mux.HandleFunc("/users", usersHandler)
    http.ListenAndServe(":8080", mux)
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    span, ctx := tracer.StartSpanFromContext(r.Context(), "users.fetch",
        tracer.ResourceName("GET /users"),
    )
    defer span.Finish()

    // Вложенный span для вызова БД
    dbSpan, _ := tracer.StartSpanFromContext(ctx, "db.query",
        tracer.ResourceName("SELECT * FROM users"),
        tracer.SpanType("sql"),
    )
    // ... выполнение запроса к БД
    dbSpan.Finish()
}
```

Для Python:

```python
from ddtrace import tracer, patch_all

# Автоматическая инструментация популярных библиотек
patch_all()

tracer.configure(
    hostname="localhost",
    port=8126,
)

# Ручная инструментация
@tracer.wrap(service="user-service", resource="get_user")
def get_user(user_id):
    with tracer.trace("db.query", service="postgres") as span:
        span.set_tag("db.type", "postgresql")
        span.set_tag("db.statement", "SELECT * FROM users WHERE id = %s")
        # ... запрос к БД
```

Для Node.js:

```javascript
const tracer = require('dd-trace').init({
  service: 'api-service',
  env: 'production',
  version: '1.0.0',
  logInjection: true,
});

// Автоматически инструментирует express, pg, redis и другие
```

### Service Map

Service Map строится автоматически на основе трейсов. Показывает все сервисы, их зависимости, RPS, латентность и error rate. Позволяет быстро найти проблемный сервис в цепочке вызовов.

### Error Tracking

DataDog автоматически группирует ошибки по fingerprint и позволяет:
- Видеть трейс, в котором произошла ошибка
- Группировать одинаковые ошибки
- Назначать ответственных
- Отслеживать регрессии после деплоя

### Service Catalog

Каталог сервисов объединяет метрики, логи, трейсы и ownership в единый реестр. Определяется через `service.datadog.yaml` в репозитории:

```yaml
schema-version: v2.2
dd-service: api-gateway
team: platform-team
contacts:
  - type: slack
    contact: "#platform-oncall"
  - type: email
    contact: platform@company.com
links:
  - name: Runbook
    type: runbook
    url: https://wiki.company.com/api-gateway-runbook
  - name: Source Code
    type: repo
    url: https://github.com/company/api-gateway
integrations:
  pagerduty:
    service-url: https://company.pagerduty.com/services/P123ABC
```

## Log Management

### Сбор логов

Agent собирает логи из файлов, Docker-контейнеров и Kubernetes. Включение сбора логов в `datadog.yaml`:

```yaml
logs_enabled: true
```

Конфигурация для сбора из файлов:

```yaml
# /etc/datadog-agent/conf.d/myapp.d/conf.yaml
logs:
  - type: file
    path: /var/log/myapp/*.log
    service: myapp
    source: go
    tags:
      - env:production
```

Для Docker настраивается через лейблы:

```yaml
# docker-compose.yml
services:
  api:
    image: myapp:latest
    labels:
      com.datadoghq.ad.logs: >-
        [{
          "source": "go",
          "service": "api",
          "log_processing_rules": [{
            "type": "multi_line",
            "name": "go_stacktrace",
            "pattern": "^\\d{4}"
          }]
        }]
```

В Kubernetes - через аннотации подов:

```yaml
metadata:
  annotations:
    ad.datadoghq.com/api.logs: >-
      [{
        "source": "go",
        "service": "api",
        "tags": ["team:platform"]
      }]
```

### Processing Pipelines

Pipelines обрабатывают входящие логи, извлекая структурированные атрибуты из текста.

Grok Parser - извлекает поля из неструктурированных логов:

```
# Правило для парсинга access-лога NGINX
access.common %{_client_ip} %{_ident} %{_auth} \[%{_date_access}\] "%{_method} %{_url} HTTP/%{_version}" %{_status_code} %{_bytes_written}
```

Attribute Remapper - переименовывает атрибуты для стандартизации:

```
# Преобразовать status_code -> http.status_code
# Преобразовать client_ip -> network.client.ip
```

Category Processor - классифицирует логи по правилам:

```
# severity:error, если status_code >= 500
# severity:warning, если status_code >= 400 AND status_code < 500
```

### Indexes

Indexes определяют, какие логи хранятся и как долго. Фильтры позволяют направлять логи в разные индексы с разным retention:

- Production errors - 30 дней retention
- Production access logs - 15 дней retention
- Debug logs - 3 дня retention

### Logging without Limits

Концепция, при которой все логи проходят через processing pipelines и генерируют метрики, но только отфильтрованные логи попадают в indexes для хранения. Это позволяет получить метрики из 100% логов, храня при этом только нужные.

### Log-based Metrics

Генерация метрик из потока логов без необходимости хранить сами логи:

```
# Создать метрику count ошибок по сервису
count:logs("status:error") by {service}.as_count()

# Метрика из значения поля в логе
avg:logs("@duration") by {endpoint}
```

### Archives

Логи можно архивировать в S3, GCS или Azure Storage для долгосрочного хранения и compliance. Rehydration позволяет вернуть архивные логи в DataDog для анализа.

```yaml
# Конфигурация архива в Terraform
resource "datadog_logs_archive" "production" {
  name  = "production-logs-archive"
  query = "env:production"

  s3_archive {
    bucket     = "company-datadog-archives"
    path       = "/production"
    account_id = "123456789012"
    role_name  = "DatadogLogsArchiveRole"
  }
}
```

## Dashboards

### Типы виджетов

- Timeseries - график метрики во времени, поддерживает линии, бары и области
- Top List - ранжированный список значений по тегам
- Table - табличное представление метрик
- Query Value - одно числовое значение, удобно для текущего статуса
- Heatmap - распределение значений по времени, идеально для визуализации латентности
- SLO - виджет отображения текущего SLO и error budget
- Log Stream - поток логов в реальном времени
- Trace Map - визуализация топологии сервисов

### Template Variables

Переменные шаблона позволяют создавать интерактивные дашборды:

```json
{
  "template_variables": [
    {
      "name": "env",
      "prefix": "env",
      "default": "production"
    },
    {
      "name": "service",
      "prefix": "service",
      "default": "*"
    },
    {
      "name": "region",
      "prefix": "region",
      "default": "*"
    }
  ]
}
```

Пример запроса с template variables:

```
avg:system.cpu.user{env:$env, service:$service, region:$region} by {host}
```

### Пример production-дашборда

Стандартный service overview дашборд включает:

```
Row 1: Golden Signals
  - Query Value: RPS (requests per second)
  - Query Value: Error Rate (%)
  - Query Value: P50 Latency (ms)
  - Query Value: P99 Latency (ms)

Row 2: Request Metrics
  - Timeseries: Request rate by status code
  - Timeseries: Error rate by endpoint

Row 3: Latency
  - Timeseries: Latency percentiles (p50, p90, p95, p99)
  - Heatmap: Latency distribution

Row 4: Infrastructure
  - Timeseries: CPU usage by host
  - Timeseries: Memory usage by host

Row 5: Dependencies
  - Timeseries: Database query duration
  - Timeseries: Cache hit rate
  - Top List: Slowest endpoints
```

## Monitors и Alerting

### Типы мониторов

Metric Monitor - алерт при пересечении порога:

```yaml
# Terraform
resource "datadog_monitor" "high_error_rate" {
  name    = "[Production] High Error Rate on {{service.name}}"
  type    = "query alert"
  message = <<-EOF
    Error rate exceeded 5% on {{service.name}}.

    Current value: {{value}}%

    @slack-platform-alerts
    @pagerduty-platform-oncall
  EOF

  query = "sum(last_5m):sum:trace.http.request.errors{env:production} by {service}.as_count() / sum:trace.http.request.hits{env:production} by {service}.as_count() * 100 > 5"

  monitor_thresholds {
    critical          = 5
    critical_recovery = 3
    warning           = 2
    warning_recovery  = 1
  }

  notify_no_data    = true
  no_data_timeframe = 10
  renotify_interval = 60

  tags = ["env:production", "team:platform"]
}
```

Anomaly Monitor - определяет аномалии на основе исторических данных:

```
avg(last_4h):anomalies(avg:system.cpu.user{env:production} by {host}, 'agile', 3, direction='above') >= 1
```

Forecast Monitor - предсказывает будущие значения на основе тренда:

```
# Алерт, если диск заполнится через 48 часов
forecast(avg:system.disk.in_use{env:production} by {host}, 'linear', 2d) > 0.9
```

Outlier Monitor - определяет хосты, которые ведут себя иначе, чем группа:

```
avg(last_30m):outliers(avg:system.cpu.user{env:production} by {host}, 'DBSCAN', 3) > 0
```

Composite Monitor - комбинация нескольких мониторов:

```yaml
resource "datadog_monitor" "composite_service_health" {
  name    = "[Production] Service Degraded"
  type    = "composite"
  message = "Service is experiencing both high latency AND elevated errors. @pagerduty-oncall"
  query   = "${datadog_monitor.high_latency.id} && ${datadog_monitor.high_error_rate.id}"
}
```

### Notify Channels

DataDog поддерживает множество каналов уведомлений:

```
# В поле message монитора
@slack-platform-alerts          # Slack канал
@pagerduty-platform-oncall      # PagerDuty
@teams-devops-channel            # Microsoft Teams
@opsgenie-platform               # OpsGenie
@email-oncall@company.com        # Email
@webhook-custom-handler          # Custom webhook
```

### Downtime

Запланированное подавление алертов:

```yaml
resource "datadog_downtime" "maintenance_window" {
  scope      = ["env:production", "service:api"]
  start      = 1700000000
  end        = 1700003600
  message    = "Planned maintenance window for API service"
  monitor_id = datadog_monitor.high_error_rate.id

  recurrence {
    type   = "weeks"
    period = 1
    week_days = ["Sat"]
  }
}
```

## SLO/SLI

### Создание SLO в DataDog

SLO в DataDog бывает двух типов:

Monitor-based SLO - использует существующий монитор как индикатор:

```yaml
resource "datadog_service_level_objective" "api_availability" {
  name        = "API Availability"
  type        = "monitor"
  description = "API должен быть доступен 99.9% времени"

  monitor_ids = [
    datadog_monitor.api_health.id,
  ]

  thresholds {
    timeframe = "30d"
    target    = 99.9
    warning   = 99.95
  }

  thresholds {
    timeframe = "90d"
    target    = 99.9
    warning   = 99.95
  }

  tags = ["service:api", "team:platform"]
}
```

Metric-based SLO - вычисляет SLI из метрик:

```yaml
resource "datadog_service_level_objective" "api_latency" {
  name        = "API Latency P99 < 500ms"
  type        = "metric"
  description = "99% запросов к API должны выполняться быстрее 500мс"

  query {
    numerator   = "sum:trace.http.request.hits{env:production,service:api}.as_count() - sum:trace.http.request.duration.by.service.99p{env:production,service:api,upper_bound:500}.as_count()"
    denominator = "sum:trace.http.request.hits{env:production,service:api}.as_count()"
  }

  thresholds {
    timeframe = "30d"
    target    = 99.0
    warning   = 99.5
  }

  tags = ["service:api", "team:platform"]
}
```

### Error Budgets

Error budget показывает, сколько допустимого времени простоя или ошибок осталось за период. Виджет SLO на дашборде отображает:
- Текущий SLI
- Таргет SLO
- Оставшийся error budget в процентах и абсолютных значениях
- Burn rate - скорость расходования error budget

> [!summary] Если burn rate превышает 1x, error budget будет исчерпан до конца периода. Burn rate 14.4x означает, что бюджет будет потрачен за 1 час при 30-дневном окне - критическая ситуация, требующая немедленной реакции.

### SLO Monitors

Мониторы, привязанные к SLO, алертят при быстром расходовании error budget:

```yaml
resource "datadog_monitor" "slo_burn_rate" {
  name    = "[SLO] API Availability - High Burn Rate"
  type    = "slo alert"
  message = "Error budget is burning too fast. @pagerduty-oncall"

  query = "burn_rate(\"${datadog_service_level_objective.api_availability.id}\").over(\"1h\").long_window(\"1h\").short_window(\"5m\") > 14.4"

  monitor_thresholds {
    critical = 14.4
  }
}
```

## Synthetics

### API Tests

Синтетические тесты проверяют доступность и корректность эндпоинтов из разных точек мира.

HTTP Test:

```yaml
resource "datadog_synthetics_test" "api_health" {
  name      = "API Health Check"
  type      = "api"
  subtype   = "http"
  status    = "live"
  locations = ["aws:us-east-1", "aws:eu-west-1", "aws:ap-southeast-1"]
  message   = "API health check failed. @slack-platform-alerts"

  request_definition {
    method = "GET"
    url    = "https://api.company.com/health"
  }

  request_headers = {
    "Accept" = "application/json"
  }

  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }

  assertion {
    type     = "responseTime"
    operator = "lessThan"
    target   = "2000"
  }

  assertion {
    type     = "body"
    operator = "validatesJSONPath"
    targetjsonpath {
      jsonpath    = "$.status"
      operator    = "is"
      targetvalue = "healthy"
    }
  }

  options_list {
    tick_every       = 60
    min_failure_duration = 120
    min_location_failed  = 2
    retry {
      count    = 2
      interval = 500
    }
  }

  tags = ["env:production", "team:platform"]
}
```

SSL Test - проверка срока действия сертификата:

```yaml
resource "datadog_synthetics_test" "ssl_check" {
  name    = "SSL Certificate Check"
  type    = "api"
  subtype = "ssl"
  status  = "live"

  request_definition {
    host = "api.company.com"
    port = 443
  }

  assertion {
    type     = "certificate"
    operator = "isInMoreThan"
    target   = "30"  # дней до истечения
  }

  options_list {
    tick_every           = 86400  # раз в день
    accept_self_signed   = false
  }
}
```

### Browser Tests

Browser Tests эмулируют действия пользователя через headless-браузер. Записываются через Datadog Recorder - расширение для браузера. Поддерживают:
- Навигация по страницам
- Заполнение форм
- Клики по элементам
- Валидация контента на странице
- Загрузка файлов
- Мультишаговые сценарии

### Private Locations

Для тестирования внутренних сервисов, недоступных из интернета, используются Private Locations - контейнеры, которые запускаются внутри вашей сети:

```bash
docker run -d --name datadog-synthetics-worker \
  -e DATADOG_API_KEY=<API_KEY> \
  -e DATADOG_ACCESS_KEY=<ACCESS_KEY> \
  -e DATADOG_SECRET_ACCESS_KEY=<SECRET_KEY> \
  -e DATADOG_PRIVATE_KEY=<PRIVATE_KEY> \
  datadog/synthetics-private-location-worker:latest
```

### CI/CD интеграция

Запуск синтетических тестов в CI pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Run Datadog Synthetics tests
  uses: DataDog/synthetics-ci-github-action@v1
  with:
    api_key: ${{ secrets.DD_API_KEY }}
    app_key: ${{ secrets.DD_APP_KEY }}
    test_search_query: "tag:ci"
    tunnel: true  # для тестирования staging-окружения
```

## Security Monitoring

### Cloud SIEM

DataDog Cloud SIEM анализирует логи в реальном времени для обнаружения угроз безопасности. Поддерживает логи из AWS CloudTrail, Azure Activity Log, GCP Audit Log и других источников.

### Threat Detection Rules

Правила обнаружения угроз можно создавать как из коробки, так и кастомные:

```yaml
resource "datadog_security_monitoring_rule" "brute_force" {
  name    = "Brute Force Login Attempt"
  message = "Multiple failed login attempts detected. @slack-security"
  enabled = true

  query {
    name            = "failed_logins"
    query           = "source:auth @action:login @status:failed"
    aggregation     = "count"
    group_by_fields = ["@usr.id"]
  }

  case {
    name      = "high"
    status    = "high"
    condition = "failed_logins > 10"
  }

  options {
    evaluation_window  = 300
    keep_alive         = 3600
    max_signal_duration = 86400
  }

  tags = ["security:authentication", "tactic:credential-access"]
}
```

### Security Signals

При срабатывании правила создаётся Security Signal, который содержит:
- Детали угрозы и сработавшего правила
- Связанные логи и трейсы
- Информацию о затронутых ресурсах
- Рекомендуемые действия по реагированию

## RUM

**Real User Monitoring** собирает данные о реальных пользователях браузерного приложения.

### Browser SDK

```html
<script>
  (function(h,o,u,n,d) {
    h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
    d=o.createElement(u);d.async=1;d.src=n
    n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
  })(window,document,'script','https://www.datadoghq-browser-agent.com/us1/v5/datadog-rum.js','DD_RUM')

  window.DD_RUM.onReady(function() {
    window.DD_RUM.init({
      clientToken: '<CLIENT_TOKEN>',
      applicationId: '<APPLICATION_ID>',
      site: 'datadoghq.com',
      service: 'web-app',
      env: 'production',
      version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });
  })
</script>
```

### Session Replay

Session Replay записывает DOM-изменения в сессии пользователя, позволяя воспроизвести его действия. Полезно для:
- Воспроизведения багов
- Анализа UX-проблем
- Понимания поведения пользователей при ошибках

> [!important] Конфигурация `defaultPrivacyLevel: 'mask-user-input'` маскирует ввод пользователя в session replay. Для полной приватности используйте `mask` - все текстовые данные на странице будут скрыты.

### Core Web Vitals

RUM автоматически собирает метрики Core Web Vitals:
- LCP - Largest Contentful Paint - время загрузки основного контента
- FID - First Input Delay - задержка при первом взаимодействии
- CLS - Cumulative Layout Shift - визуальная стабильность
- INP - Interaction to Next Paint - отзывчивость интерфейса

Эти метрики можно использовать в дашбордах и мониторах для отслеживания фронтенд-перформанса.

## CI Visibility

### Test Performance

CI Visibility отслеживает выполнение тестов в CI pipeline:
- Время выполнения каждого теста
- Flaky-тесты - тесты с нестабильными результатами
- Тренды по test suite duration
- Группировка провалов по ветке, коммиту, автору

Интеграция с тест-фреймворками:

```bash
# Jest
DD_ENV=ci DD_SERVICE=myapp \
  npx jest --reporters=default --reporters=jest-datadog-reporter

# pytest
DD_ENV=ci DD_SERVICE=myapp \
  pytest --ddtrace
```

### Pipeline Visibility

Отслеживание CI/CD пайплайнов:
- Время выполнения каждого stage
- Частота ошибок по стадиям
- Queue time - время ожидания раннера
- Тренды по длительности пайплайнов

Поддержка GitHub Actions, GitLab CI, Jenkins, CircleCI и других.

## Cost Management

### Billing Model

DataDog использует модель ценообразования на основе потребления:

- Infrastructure - за хост в месяц. Включает 750 custom metrics на хост
- APM - за хост с APM в месяц. Включает 1M traced spans
- Log Management - за GB ingested + за миллион indexed events
- Synthetics - за 10K API test runs / 1K browser test runs
- RUM - за 10K sessions
- Custom Metrics - за каждые 100 custom metrics сверх включённых

### Оптимизация затрат

Метрики:
- Используйте `exclude_metrics` в конфигах интеграций для отключения ненужных метрик
- Применяйте Metrics without Limits для снижения количества custom metrics через агрегацию тегов
- Удаляйте неиспользуемые кастомные метрики

```yaml
# Исключение ненужных метрик в интеграции
init_config:
instances:
  - host: localhost
    exclude_metrics:
      - system.disk.read_time
      - system.disk.write_time
```

Логи:
- Настройте exclusion filters на уровне index для отсечения шума
- Используйте Log-based Metrics вместо хранения всех логов
- Архивируйте в S3/GCS для долгосрочного хранения вместо Datadog retention
- Используйте sampling для debug-логов

APM:
- Настройте ingestion controls для семплирования трейсов
- Используйте head-based sampling для снижения объёма

```yaml
# В datadog.yaml
apm_config:
  max_traces_per_second: 200  # лимит трейсов в секунду

  # Правила семплирования по сервисам
  filter_tags:
    require: ["env:production"]
```

> [!important] Контролируйте количество unique tag combinations для custom metrics. Каждая уникальная комбинация тегов создаёт отдельный таймсерис и тарифицируется отдельно. Метрика с тегами `{endpoint, status, method, user_id}` может генерировать миллионы комбинаций.

## Terraform Provider

Управление ресурсами DataDog как кодом через Terraform provider `datadog/datadog`.

### Конфигурация провайдера

```hcl
terraform {
  required_providers {
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.38"
    }
  }
}

provider "datadog" {
  api_key = var.datadog_api_key
  app_key = var.datadog_app_key
  api_url = "https://api.datadoghq.com/"
}
```

### Dashboard as Code

```hcl
resource "datadog_dashboard" "service_overview" {
  title       = "Service Overview - API"
  description = "Production API service dashboard"
  layout_type = "ordered"

  template_variable {
    name    = "env"
    prefix  = "env"
    default = "production"
  }

  template_variable {
    name    = "service"
    prefix  = "service"
    default = "api"
  }

  widget {
    group_definition {
      title       = "Golden Signals"
      layout_type = "ordered"

      widget {
        query_value_definition {
          title = "Request Rate"
          request {
            q          = "sum:trace.http.request.hits{env:$env,service:$service}.as_rate()"
            aggregator = "avg"
          }
          autoscale  = true
          precision  = 1
          text_align = "center"
        }
      }

      widget {
        query_value_definition {
          title = "Error Rate (%)"
          request {
            q          = "100 * sum:trace.http.request.errors{env:$env,service:$service}.as_count() / sum:trace.http.request.hits{env:$env,service:$service}.as_count()"
            aggregator = "avg"
            conditional_formats {
              comparator = ">"
              value      = 5
              palette    = "white_on_red"
            }
            conditional_formats {
              comparator = ">"
              value      = 1
              palette    = "white_on_yellow"
            }
            conditional_formats {
              comparator = "<="
              value      = 1
              palette    = "white_on_green"
            }
          }
          precision = 2
        }
      }

      widget {
        timeseries_definition {
          title = "Latency Percentiles"
          request {
            q            = "p50:trace.http.request.duration{env:$env,service:$service}"
            display_type = "line"
            style {
              palette = "cool"
            }
          }
          request {
            q            = "p90:trace.http.request.duration{env:$env,service:$service}"
            display_type = "line"
          }
          request {
            q            = "p99:trace.http.request.duration{env:$env,service:$service}"
            display_type = "line"
            style {
              palette = "warm"
            }
          }
          yaxis {
            include_zero = false
          }
        }
      }
    }
  }

  widget {
    timeseries_definition {
      title = "Request Rate by Status"
      request {
        q            = "sum:trace.http.request.hits{env:$env,service:$service} by {http.status_code}.as_rate()"
        display_type = "bars"
        style {
          palette = "semantic"
        }
      }
    }
  }
}
```

### Monitor as Code

```hcl
resource "datadog_monitor" "cpu_high" {
  name    = "[{{env}}] High CPU on {{host.name}}"
  type    = "metric alert"
  message = <<-EOF
    CPU usage is above {{threshold}}% on {{host.name}}.

    Current value: {{value}}%
    Environment: {{env}}

    Runbook: https://wiki.company.com/runbooks/high-cpu

    {{#is_alert}}
    @pagerduty-platform-oncall
    {{/is_alert}}
    {{#is_warning}}
    @slack-platform-alerts
    {{/is_warning}}
  EOF

  query = "avg(last_10m):avg:system.cpu.user{env:production} by {host} > 90"

  monitor_thresholds {
    critical = 90
    warning  = 75
  }

  notify_no_data    = true
  no_data_timeframe = 10
  renotify_interval = 30

  tags = ["env:production", "team:platform", "managed:terraform"]
}
```

### Организация Terraform-кода

Рекомендуемая структура для управления DataDog через Terraform:

```
datadog-terraform/
├── modules/
│   ├── service-monitor/      # Переиспользуемый модуль мониторов
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── service-dashboard/    # Переиспользуемый модуль дашбордов
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── production/
│   │   ├── main.tf
│   │   ├── monitors.tf
│   │   ├── dashboards.tf
│   │   ├── slos.tf
│   │   └── synthetics.tf
│   └── staging/
│       ├── main.tf
│       └── monitors.tf
├── global/
│   ├── downtimes.tf
│   └── users.tf
└── terragrunt.hcl
```

Пример переиспользуемого модуля для service monitors:

```hcl
# modules/service-monitor/variables.tf
variable "service_name" {
  type = string
}

variable "env" {
  type    = string
  default = "production"
}

variable "error_rate_threshold" {
  type    = number
  default = 5
}

variable "latency_p99_threshold" {
  type    = number
  default = 500
}

variable "notification_channels" {
  type    = list(string)
  default = ["@slack-platform-alerts"]
}

# modules/service-monitor/main.tf
resource "datadog_monitor" "error_rate" {
  name    = "[${var.env}] High Error Rate - ${var.service_name}"
  type    = "query alert"
  message = "Error rate on ${var.service_name} exceeded ${var.error_rate_threshold}%. ${join(" ", var.notification_channels)}"
  query   = "sum(last_5m):sum:trace.http.request.errors{env:${var.env},service:${var.service_name}}.as_count() / sum:trace.http.request.hits{env:${var.env},service:${var.service_name}}.as_count() * 100 > ${var.error_rate_threshold}"

  monitor_thresholds {
    critical = var.error_rate_threshold
  }

  tags = ["env:${var.env}", "service:${var.service_name}", "managed:terraform"]
}

resource "datadog_monitor" "latency" {
  name    = "[${var.env}] High P99 Latency - ${var.service_name}"
  type    = "query alert"
  message = "P99 latency on ${var.service_name} exceeded ${var.latency_p99_threshold}ms. ${join(" ", var.notification_channels)}"
  query   = "percentile(last_5m):p99:trace.http.request.duration{env:${var.env},service:${var.service_name}} > ${var.latency_p99_threshold}"

  monitor_thresholds {
    critical = var.latency_p99_threshold
  }

  tags = ["env:${var.env}", "service:${var.service_name}", "managed:terraform"]
}
```

Применение модуля:

```hcl
# environments/production/monitors.tf
module "api_monitors" {
  source = "../../modules/service-monitor"

  service_name          = "api-gateway"
  env                   = "production"
  error_rate_threshold  = 3
  latency_p99_threshold = 300
  notification_channels = [
    "@pagerduty-platform-oncall",
    "@slack-platform-alerts",
  ]
}

module "payment_monitors" {
  source = "../../modules/service-monitor"

  service_name          = "payment-service"
  env                   = "production"
  error_rate_threshold  = 1
  latency_p99_threshold = 1000
  notification_channels = [
    "@pagerduty-payments-oncall",
    "@slack-payments-alerts",
  ]
}
```

## Практики внедрения

### Unified Service Tagging

Единая стратегия тегирования связывает метрики, логи и трейсы. Три обязательных тега:

```yaml
# В env vars приложения
DD_ENV: production
DD_SERVICE: api-gateway
DD_VERSION: 1.2.3
```

```yaml
# В Kubernetes labels
labels:
  tags.datadoghq.com/env: production
  tags.datadoghq.com/service: api-gateway
  tags.datadoghq.com/version: "1.2.3"
```

Unified Service Tagging позволяет автоматически коррелировать данные между разными продуктами DataDog и переходить от метрики к трейсу и логу в пару кликов.

### Стратегия алертинга

Подход к алертингу на основе severity:

```
P1 (Critical) - сервис полностью недоступен
  → PagerDuty oncall + Slack
  → Время реакции: 5 минут
  → Пример: error rate > 50%, все health checks failed

P2 (High) - значительная деградация
  → PagerDuty oncall + Slack
  → Время реакции: 15 минут
  → Пример: error rate > 10%, P99 > 2x baseline

P3 (Medium) - незначительная деградация
  → Slack канал команды
  → Время реакции: 1 час
  → Пример: error rate > 5%, SLO burn rate elevated

P4 (Low) - информационный
  → Slack канал + тикет
  → Время реакции: next business day
  → Пример: disk usage > 70%, certificate expires in 30 days
```

> [!summary] Главное правило алертинга - каждый алерт должен требовать действия. Если алерт не требует реакции, он превращается в шум. Лучше 10 точных алертов, чем 100 информационных.
