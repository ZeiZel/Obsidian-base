---
tags:
  - devops
  - monitoring
  - prometheus
  - grafana
title: Prometheus и Grafana
---
## Архитектура Prometheus

Prometheus - система мониторинга и алертинга с открытым исходным кодом, изначально разработанная в SoundCloud и ставшая вторым проектом Cloud Native Computing Foundation после Kubernetes. В основе лежит pull-модель сбора метрик, time-series база данных и мощный язык запросов PromQL.

### Компоненты системы

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Targets     │────>│  Prometheus      │────>│  Alertmanager│
│  (exporters) │pull │  Server          │push │              │
└──────────────┘     │  ┌────────────┐  │     └──────┬───────┘
                     │  │ TSDB       │  │            │
┌──────────────┐     │  └────────────┘  │     ┌──────▼───────┐
│  Service     │────>│  ┌────────────┐  │     │  Receivers   │
│  Discovery   │     │  │ Rule Engine│  │     │  Slack/Email │
└──────────────┘     │  └────────────┘  │     └──────────────┘
                     └────────┬─────────┘
                              │query
                     ┌────────▼─────────┐
                     │  Grafana         │
                     │  Visualization   │
                     └──────────────────┘
```

Prometheus Server - центральный компонент, который выполняет три задачи: скрейпинг метрик с целевых endpoints, хранение данных в локальной TSDB, вычисление правил алертинга и recording rules.

Targets - любые приложения или экспортёры, которые предоставляют метрики по HTTP в формате Prometheus exposition format. Каждый target имеет endpoint `/metrics`, возвращающий текстовые метрики.

Service Discovery - механизм автоматического обнаружения targets. Поддерживает Kubernetes, Consul, файловый SD, DNS, EC2 и десятки других провайдеров.

Pushgateway - промежуточный компонент для short-lived задач (batch jobs, cron jobs), которые не живут достаточно долго для скрейпинга. Job пушит метрики в Pushgateway, Prometheus скрейпит уже его.

> [!important] Pull vs Push
> Pull-модель даёт Prometheus контроль над частотой сбора, упрощает обнаружение недоступных targets и не требует конфигурации на стороне приложения. Push-модель через Pushgateway используется только для короткоживущих задач, а не для обхода pull-модели.

### Формат метрик

Каждая метрика представляет собой текстовую строку с именем, набором лейблов и значением:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET", handler="/api/users", status="200"} 1027
http_requests_total{method="POST", handler="/api/users", status="201"} 42
http_requests_total{method="GET", handler="/api/users", status="500"} 3
```

---

## Конфигурация prometheus.yml

### Базовая структура

```yaml
# prometheus.yml
global:
  scrape_interval: 15s       # как часто скрейпить targets
  evaluation_interval: 15s   # как часто вычислять rules
  scrape_timeout: 10s        # таймаут скрейпинга
  external_labels:           # лейблы для federation/remote write
    cluster: production
    region: eu-west-1

# Файлы с правилами алертинга и recording rules
rule_files:
  - "rules/*.yml"

# Конфигурация Alertmanager
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

# Конфигурация сбора метрик
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node-exporter"
    static_configs:
      - targets:
          - "node1:9100"
          - "node2:9100"
          - "node3:9100"
```

### Расширенная конфигурация scrape_configs

```yaml
scrape_configs:
  - job_name: "api-servers"
    metrics_path: /metrics          # путь к метрикам (по умолчанию /metrics)
    scheme: https                   # http или https
    scrape_interval: 10s            # переопределение глобального интервала
    scrape_timeout: 5s

    basic_auth:
      username: prometheus
      password_file: /etc/prometheus/password

    tls_config:
      ca_file: /etc/prometheus/ca.pem
      cert_file: /etc/prometheus/cert.pem
      key_file: /etc/prometheus/key.pem
      insecure_skip_verify: false

    static_configs:
      - targets: ["api1:8080", "api2:8080"]
        labels:
          environment: production
          team: backend
```

### Relabeling

Relabeling позволяет трансформировать лейблы до скрейпинга (relabel_configs) и после скрейпинга (metric_relabel_configs). Это мощный механизм фильтрации и обогащения метрик.

```yaml
scrape_configs:
  - job_name: "kubernetes-pods"
    kubernetes_sd_configs:
      - role: pod

    relabel_configs:
      # Скрейпить только поды с аннотацией prometheus.io/scrape=true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: "true"

      # Использовать аннотацию prometheus.io/path как metrics_path
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

      # Использовать аннотацию prometheus.io/port для порта
      - source_labels:
          - __address__
          - __meta_kubernetes_pod_annotation_prometheus_io_port
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__

      # Добавить лейбл namespace
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: namespace

      # Добавить лейбл pod
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: pod

    metric_relabel_configs:
      # Удалить метрики с высокой кардинальностью
      - source_labels: [__name__]
        action: drop
        regex: "go_gc_.*"

      # Удалить ненужный лейбл
      - action: labeldrop
        regex: "instance"
```

Основные действия relabeling:

| Action | Описание |
|--------|----------|
| keep | Оставить только targets, matching regex |
| drop | Удалить targets, matching regex |
| replace | Заменить значение target_label |
| labelmap | Скопировать лейблы по regex в новые лейблы |
| labeldrop | Удалить лейблы по regex |
| labelkeep | Оставить только лейблы по regex |
| hashmod | Вычислить hash для шардинга |

---

## Типы метрик

### Counter

Монотонно возрастающее значение, которое может только увеличиваться или сбрасываться в 0 при рестарте. Используется для подсчёта событий.

```go
// Go client
var httpRequestsTotal = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total number of HTTP requests",
    },
    []string{"method", "handler", "status"},
)

func handleRequest(w http.ResponseWriter, r *http.Request) {
    // ... обработка запроса
    httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, "200").Inc()
}
```

Типичные запросы:

```promql
# Запросов в секунду за последние 5 минут
rate(http_requests_total[5m])

# Общее количество ошибок за час
increase(http_requests_total{status=~"5.."}[1h])
```

### Gauge

Значение, которое может произвольно увеличиваться и уменьшаться. Отражает текущее состояние.

```go
var cpuTemperature = prometheus.NewGauge(
    prometheus.GaugeOpts{
        Name: "cpu_temperature_celsius",
        Help: "Current CPU temperature",
    },
)

var inFlightRequests = prometheus.NewGauge(
    prometheus.GaugeOpts{
        Name: "http_in_flight_requests",
        Help: "Number of HTTP requests currently being processed",
    },
)

func handleRequest(w http.ResponseWriter, r *http.Request) {
    inFlightRequests.Inc()
    defer inFlightRequests.Dec()
    // ... обработка
}
```

Типичные запросы:

```promql
# Текущее значение
cpu_temperature_celsius

# Средняя температура за 10 минут
avg_over_time(cpu_temperature_celsius[10m])

# Предсказание: когда диск заполнится (линейная экстраполяция)
predict_linear(node_filesystem_avail_bytes[6h], 3600 * 24)
```

### Histogram

Распределяет наблюдения по настраиваемым бакетам. Создаёт три временных ряда: `_bucket` (кумулятивные счётчики), `_count` (количество наблюдений), `_sum` (сумма значений).

```go
var requestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "HTTP request latency distribution",
        Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
    },
    []string{"method", "handler"},
)

func handleRequest(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    // ... обработка
    duration := time.Since(start).Seconds()
    requestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
}
```

Пример данных, которые попадают в TSDB:

```
http_request_duration_seconds_bucket{method="GET",handler="/api",le="0.005"} 24054
http_request_duration_seconds_bucket{method="GET",handler="/api",le="0.01"} 33444
http_request_duration_seconds_bucket{method="GET",handler="/api",le="0.025"} 100392
http_request_duration_seconds_bucket{method="GET",handler="/api",le="+Inf"} 144320
http_request_duration_seconds_sum{method="GET",handler="/api"} 53423.21
http_request_duration_seconds_count{method="GET",handler="/api"} 144320
```

Типичные запросы:

```promql
# 99-й перцентиль задержки за последние 5 минут
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Средняя задержка
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 50-й перцентиль с группировкой по handler
histogram_quantile(0.5,
  sum by (handler, le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

### Summary

Похож на histogram, но вычисляет квантили на стороне клиента. Нельзя агрегировать квантили между инстансами.

```go
var requestDuration = prometheus.NewSummaryVec(
    prometheus.SummaryOpts{
        Name:       "http_request_duration_seconds",
        Help:       "HTTP request latency",
        Objectives: map[float64]float64{0.5: 0.05, 0.9: 0.01, 0.99: 0.001},
        MaxAge:     10 * time.Minute,
    },
    []string{"method"},
)
```

> [!summary] Histogram vs Summary
> Histogram предпочтительнее в большинстве случаев: квантили вычисляются на сервере Prometheus, можно агрегировать данные между инстансами, бакеты настраиваются один раз и не создают нагрузку на клиент. Summary полезен только когда нужна высокая точность квантилей для одного инстанса и нет необходимости в агрегации.

---

## PromQL

### Типы данных

PromQL оперирует четырьмя типами данных:

- Instant vector - набор временных рядов с единственным значением для каждого на момент времени
- Range vector - набор временных рядов с диапазоном значений за период
- Scalar - числовое значение с плавающей точкой
- String - строковое значение (используется редко)

### Селекторы и Label matchers

```promql
# Instant vector selector
http_requests_total

# С фильтрацией по лейблам
http_requests_total{job="api-server"}

# Операторы матчинга:
# =   точное совпадение
# !=  не равно
# =~  regex совпадение
# !~  regex не совпадает
http_requests_total{status=~"5..", method!="OPTIONS"}
http_requests_total{handler=~"/api/v[12]/.*"}

# Range vector selector (значения за последние 5 минут)
http_requests_total{job="api-server"}[5m]

# Offset modifier (значение час назад)
http_requests_total offset 1h

# @ modifier (значение на конкретный timestamp)
http_requests_total @ 1609459200
```

### Агрегация

```promql
# sum - суммировать значения
sum(http_requests_total)
sum by (method) (http_requests_total)
sum without (instance) (http_requests_total)

# avg - среднее значение
avg(node_cpu_seconds_total{mode="idle"})
avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]))

# count - количество временных рядов
count(up == 1)
count by (job) (up)

# min / max
max(node_memory_MemTotal_bytes)
min by (instance) (node_filesystem_avail_bytes)

# topk / bottomk - top N
topk(5, rate(http_requests_total[5m]))

# quantile - вычислить квантиль по значениям рядов
quantile(0.95, rate(http_requests_total[5m]))

# stddev / stdvar - стандартное отклонение и дисперсия
stddev by (method) (rate(http_request_duration_seconds_sum[5m]))

# count_values - группировка по значению
count_values("version", build_info)

# group - возвращает 1 для каждой группы (полезно для group_left)
group by (instance) (up)
```

### Функции

```promql
# rate - per-second rate для counters (сглаженный)
rate(http_requests_total[5m])

# irate - мгновенный rate (по двум последним точкам)
irate(http_requests_total[5m])

# increase - абсолютное увеличение за период
increase(http_requests_total[1h])

# histogram_quantile - вычислить квантиль из histogram buckets
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# delta - разница для gauge за период
delta(cpu_temperature_celsius[1h])

# deriv - производная (скорость изменения gauge)
deriv(node_memory_MemFree_bytes[1h])

# predict_linear - линейная экстраполяция gauge
predict_linear(node_filesystem_avail_bytes[6h], 3600 * 24 * 7)

# changes - количество изменений значения за период
changes(process_start_time_seconds[1h])

# resets - количество сбросов counter
resets(http_requests_total[1h])

# absent / absent_over_time - 1 если ряд отсутствует
absent(up{job="critical-service"})
absent_over_time(up{job="critical-service"}[5m])

# ceil / floor / round
ceil(rate(http_requests_total[5m]))
round(avg(rate(http_requests_total[5m])), 0.1)

# clamp / clamp_min / clamp_max
clamp(cpu_usage_percent, 0, 100)

# label_replace / label_join - манипуляция лейблами
label_replace(up, "short_instance", "$1", "instance", "(.*):.*")
label_join(up, "full_id", "-", "job", "instance")

# time() - текущий timestamp
time() - process_start_time_seconds  # uptime в секундах

# vector() - скалярное значение как вектор
vector(1)

# sort / sort_desc
sort_desc(rate(http_requests_total[5m]))
```

### Бинарные операторы

```promql
# Арифметические: + - * / % ^
node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes

# Сравнение: == != > < >= <=
# Как фильтр (возвращает только matching ряды)
http_requests_total > 100

# Как bool (возвращает 0 или 1)
http_requests_total > bool 100

# Логические: and or unless
up{job="api"} == 1 and on(instance) changes(process_start_time_seconds[5m]) > 0

# Vector matching
# on() - использовать только указанные лейблы для match
# ignoring() - игнорировать указанные лейблы при match
rate(http_requests_total[5m])
  / on(method, handler)
rate(http_request_duration_seconds_count[5m])

# group_left / group_right - many-to-one join
rate(http_requests_total[5m])
  * on(instance) group_left(version)
build_info
```

### Практические запросы

```promql
# Процент использования CPU
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Процент использования памяти
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Процент ошибок (error rate)
sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
sum(rate(http_requests_total[5m])) * 100

# Сетевой трафик в Mbps
rate(node_network_receive_bytes_total{device="eth0"}[5m]) * 8 / 1024 / 1024

# Saturation диска (IOPS utilization)
rate(node_disk_io_time_seconds_total[5m])

# Availability (процент времени up)
avg_over_time(up{job="api-server"}[24h]) * 100

# Apdex score (Application Performance Index)
(
  sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m]))
  +
  sum(rate(http_request_duration_seconds_bucket{le="1.2"}[5m]))
) / 2
/ sum(rate(http_request_duration_seconds_count[5m]))
```

---

## Service Discovery

### Kubernetes SD

```yaml
scrape_configs:
  # Мониторинг самих нод
  - job_name: "kubernetes-nodes"
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token

    kubernetes_sd_configs:
      - role: node

    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)

  # Мониторинг endpoints сервисов
  - job_name: "kubernetes-service-endpoints"
    kubernetes_sd_configs:
      - role: endpoints

    relabel_configs:
      - source_labels:
          - __meta_kubernetes_service_annotation_prometheus_io_scrape
        action: keep
        regex: "true"
      - source_labels:
          - __meta_kubernetes_service_annotation_prometheus_io_scheme
        action: replace
        target_label: __scheme__
        regex: (https?)
      - source_labels:
          - __meta_kubernetes_service_annotation_prometheus_io_path
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels:
          - __address__
          - __meta_kubernetes_service_annotation_prometheus_io_port
        action: replace
        target_label: __address__
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: namespace
      - source_labels: [__meta_kubernetes_service_name]
        action: replace
        target_label: service
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: pod
```

### Consul SD

```yaml
scrape_configs:
  - job_name: "consul-services"
    consul_sd_configs:
      - server: "consul:8500"
        services: []  # пустой = все сервисы
        tags:
          - "prometheus"

    relabel_configs:
      - source_labels: [__meta_consul_tags]
        regex: .*,production,.*
        action: keep
      - source_labels: [__meta_consul_service]
        target_label: service
      - source_labels: [__meta_consul_dc]
        target_label: datacenter
```

### File SD

Для среды без сервис-дискавери. Prometheus автоматически перечитывает файлы при изменении.

```yaml
scrape_configs:
  - job_name: "file-sd-targets"
    file_sd_configs:
      - files:
          - "/etc/prometheus/targets/*.json"
        refresh_interval: 30s
```

```json
[
  {
    "targets": ["host1:9100", "host2:9100"],
    "labels": {
      "env": "production",
      "team": "platform"
    }
  },
  {
    "targets": ["host3:9100"],
    "labels": {
      "env": "staging",
      "team": "backend"
    }
  }
]
```

---

## Alerting Rules

### Структура правил алертинга

```yaml
# rules/alerts.yml
groups:
  - name: instance-health
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Instance {{ $labels.instance }} is down"
          description: >-
            {{ $labels.instance }} of job {{ $labels.job }}
            has been down for more than 5 minutes.
          runbook_url: https://wiki.example.com/runbooks/instance-down

  - name: node-resources
    rules:
      - alert: HighCPUUsage
        expr: |
          100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: >-
            CPU usage is {{ printf "%.1f" $value }}% on {{ $labels.instance }}.

      - alert: HighMemoryUsage
        expr: |
          (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: >-
            Memory usage is {{ printf "%.1f" $value }}% on {{ $labels.instance }}.

      - alert: DiskSpaceLow
        expr: |
          (1 - node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes) * 100 > 85
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: >-
            Partition {{ $labels.mountpoint }} is {{ printf "%.1f" $value }}% full
            on {{ $labels.instance }}.

      - alert: DiskWillFillIn24Hours
        expr: |
          predict_linear(node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"}[6h], 24 * 3600) < 0
        for: 30m
        labels:
          severity: critical
        annotations:
          summary: "Disk on {{ $labels.instance }} predicted to fill within 24h"

  - name: application-slos
    rules:
      - alert: HighErrorRate
        expr: |
          sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum by (service) (rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 1% for {{ $labels.service }}"
          description: >-
            Error rate is {{ printf "%.2f" $value | float64 }}%
            for service {{ $labels.service }}.

      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99,
            sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))
          ) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency above 1s for {{ $labels.service }}"
```

> [!info] Параметр `for`
> Параметр `for` определяет, сколько времени выражение должно оставаться истинным, прежде чем алерт перейдёт из состояния `pending` в `firing`. Это защищает от false-positive при кратковременных всплесках. Для критических алертов ставьте 1-5 минут, для warning - 10-30 минут.

---

## Alertmanager

### Архитектура

Alertmanager получает алерты от Prometheus, группирует их, дедуплицирует, применяет silences и inhibitions, маршрутизирует в receivers. Поддерживает кластерный режим с gossip-протоколом для HA.

### Конфигурация

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  smtp_smarthost: "smtp.example.com:587"
  smtp_from: "alertmanager@example.com"
  smtp_auth_username: "alertmanager@example.com"
  smtp_auth_password_file: /etc/alertmanager/smtp_password
  slack_api_url_file: /etc/alertmanager/slack_webhook

# Шаблоны уведомлений
templates:
  - "/etc/alertmanager/templates/*.tmpl"

# Дерево маршрутизации
route:
  receiver: "default-slack"
  group_by: ["alertname", "cluster", "service"]
  group_wait: 30s         # время ожидания перед первой отправкой группы
  group_interval: 5m      # интервал между отправками одной группы
  repeat_interval: 4h     # интервал повторной отправки

  routes:
    # Критические алерты - PagerDuty + Slack
    - receiver: "pagerduty-critical"
      matchers:
        - severity = critical
      group_wait: 10s
      repeat_interval: 1h
      continue: true       # продолжить matching (отправить и в Slack)

    - receiver: "slack-critical"
      matchers:
        - severity = critical

    # Warning - только Slack
    - receiver: "slack-warnings"
      matchers:
        - severity = warning
      repeat_interval: 12h

    # Алерты от конкретной команды - в их канал
    - receiver: "slack-backend-team"
      matchers:
        - team = backend
      routes:
        - receiver: "pagerduty-backend"
          matchers:
            - severity = critical

    # Тихие часы для некритичных алертов
    - receiver: "email-digest"
      matchers:
        - severity =~ "info|warning"
      mute_time_intervals:
        - outside-business-hours

# Определение временных интервалов
time_intervals:
  - name: outside-business-hours
    time_intervals:
      - weekdays: ["saturday", "sunday"]
      - times:
          - start_time: "00:00"
            end_time: "09:00"
          - start_time: "18:00"
            end_time: "24:00"

# Inhibition rules - подавление зависимых алертов
inhibit_rules:
  # Если инстанс недоступен, подавить все warning алерты для него
  - source_matchers:
      - alertname = InstanceDown
      - severity = critical
    target_matchers:
      - severity = warning
    equal: ["instance"]

  # Если весь кластер упал, подавить алерты отдельных сервисов
  - source_matchers:
      - alertname = ClusterDown
    target_matchers:
      - severity =~ "warning|critical"
    equal: ["cluster"]

# Receivers
receivers:
  - name: "default-slack"
    slack_configs:
      - channel: "#alerts"
        send_resolved: true
        title: '{{ .GroupLabels.alertname }}'
        text: >-
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}

  - name: "slack-critical"
    slack_configs:
      - channel: "#alerts-critical"
        send_resolved: true
        color: '{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}'

  - name: "slack-warnings"
    slack_configs:
      - channel: "#alerts-warnings"
        send_resolved: true

  - name: "slack-backend-team"
    slack_configs:
      - channel: "#backend-alerts"
        send_resolved: true

  - name: "pagerduty-critical"
    pagerduty_configs:
      - service_key_file: /etc/alertmanager/pagerduty_key
        severity: critical
        description: "{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}"

  - name: "pagerduty-backend"
    pagerduty_configs:
      - service_key_file: /etc/alertmanager/pagerduty_backend_key

  - name: "email-digest"
    email_configs:
      - to: "ops-team@example.com"
        send_resolved: true

  - name: "webhook"
    webhook_configs:
      - url: "https://hooks.example.com/alertmanager"
        send_resolved: true
        max_alerts: 10
```

### Silences

Silences временно подавляют алерты по набору matchers. Управляются через UI или API.

```bash
# Создать silence через amtool
amtool silence add \
  --alertmanager.url=http://localhost:9093 \
  --author="oncall@example.com" \
  --comment="Planned maintenance window" \
  --duration=2h \
  alertname=InstanceDown instance=~"node[12]:.*"

# Просмотреть активные silences
amtool silence query --alertmanager.url=http://localhost:9093

# Удалить silence
amtool silence expire <silence-id>
```

---

## Recording Rules

Recording rules предвычисляют дорогие или часто используемые выражения и сохраняют результат как новый временной ряд. Это ускоряет дашборды и алерты.

```yaml
# rules/recording.yml
groups:
  - name: node-recording-rules
    interval: 30s
    rules:
      # CPU usage per instance
      - record: instance:node_cpu_utilization:ratio
        expr: |
          1 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]))

      # Memory usage per instance
      - record: instance:node_memory_utilization:ratio
        expr: |
          1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes

      # Disk usage per instance per mountpoint
      - record: instance:node_filesystem_utilization:ratio
        expr: |
          1 - node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"}
            / node_filesystem_size_bytes

  - name: http-recording-rules
    interval: 30s
    rules:
      # Request rate by service
      - record: service:http_requests:rate5m
        expr: |
          sum by (service) (rate(http_requests_total[5m]))

      # Error rate by service
      - record: service:http_errors:ratio_rate5m
        expr: |
          sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum by (service) (rate(http_requests_total[5m]))

      # P99 latency by service
      - record: service:http_request_duration_seconds:p99
        expr: |
          histogram_quantile(0.99,
            sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))
          )

      # P50 latency by service
      - record: service:http_request_duration_seconds:p50
        expr: |
          histogram_quantile(0.50,
            sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))
          )

      # Availability (success rate)
      - record: service:http_availability:ratio_rate5m
        expr: |
          sum by (service) (rate(http_requests_total{status!~"5.."}[5m]))
          /
          sum by (service) (rate(http_requests_total[5m]))
```

> [!important] Naming convention для recording rules
> Следуй формату `level:metric_name:operations`. Level - уровень агрегации (instance, service, cluster). Metric_name - имя исходной метрики. Operations - список применённых операций (rate5m, ratio, p99). Пример: `service:http_requests:rate5m`.

---

## Grafana

### Datasources

```yaml
# provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: POST
      exemplarTraceIdDestinations:
        - name: traceID
          datasourceUid: tempo

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
      derivedFields:
        - name: TraceID
          matcherRegex: '"traceID":"(\w+)"'
          url: "$${__value.raw}"
          datasourceUid: tempo

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    uid: tempo
```

### Dashboard Provisioning

```yaml
# provisioning/dashboards/dashboards.yml
apiVersion: 1

providers:
  - name: "default"
    orgId: 1
    folder: "Infrastructure"
    type: file
    disableDeletion: false
    editable: true
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

### Dashboard JSON Model

```json
{
  "dashboard": {
    "title": "Service Overview",
    "uid": "service-overview",
    "tags": ["production", "services"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "templating": {
      "list": [
        {
          "name": "service",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(http_requests_total, service)",
          "refresh": 2,
          "sort": 1,
          "includeAll": true,
          "multi": true,
          "current": {
            "text": "All",
            "value": "$__all"
          }
        },
        {
          "name": "interval",
          "type": "interval",
          "query": "1m,5m,15m,30m,1h",
          "current": {
            "text": "5m",
            "value": "5m"
          }
        }
      ]
    },
    "panels": [
      {
        "title": "Request Rate",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum by (service) (rate(http_requests_total{service=~\"$service\"}[$interval]))",
            "legendFormat": "{{ service }}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "fillOpacity": 10
            }
          }
        }
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "gridPos": { "h": 4, "w": 6, "x": 12, "y": 0 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{service=~\"$service\",status=~\"5..\"}[$interval])) / sum(rate(http_requests_total{service=~\"$service\"}[$interval])) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 0.5 },
                { "color": "red", "value": 1 }
              ]
            }
          }
        }
      },
      {
        "title": "P99 Latency",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum by (service, le) (rate(http_request_duration_seconds_bucket{service=~\"$service\"}[$interval])))",
            "legendFormat": "{{ service }} p99"
          },
          {
            "expr": "histogram_quantile(0.50, sum by (service, le) (rate(http_request_duration_seconds_bucket{service=~\"$service\"}[$interval])))",
            "legendFormat": "{{ service }} p50"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s"
          }
        }
      },
      {
        "title": "Request Duration Heatmap",
        "type": "heatmap",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum by (le) (increase(http_request_duration_seconds_bucket{service=~\"$service\"}[$interval]))",
            "format": "heatmap",
            "legendFormat": "{{ le }}"
          }
        ]
      }
    ]
  }
}
```

### Annotations

```json
{
  "annotations": {
    "list": [
      {
        "name": "Deployments",
        "datasource": "Prometheus",
        "enable": true,
        "expr": "changes(process_start_time_seconds{job=\"api-server\"}[1m]) > 0",
        "tagKeys": "job",
        "titleFormat": "Deployment",
        "textFormat": "{{ $labels.instance }} restarted"
      },
      {
        "name": "Alerts",
        "datasource": "-- Grafana --",
        "enable": true,
        "type": "alert"
      }
    ]
  }
}
```

---

## Grafana Loki

### Архитектура

Loki - система агрегации логов, вдохновлённая Prometheus. В отличие от Elasticsearch, Loki не индексирует содержимое логов, а индексирует только лейблы (метаданные). Сами логи хранятся в сжатом виде в объектном хранилище (S3, GCS, MinIO).

```
┌─────────┐     ┌──────────┐     ┌─────────────┐
│ Promtail │────>│ Loki     │────>│ Grafana     │
│ Fluentbit│push │ ┌──────┐ │     │ (Explore)   │
│ Alloy    │     │ │Index │ │     └─────────────┘
└─────────┘     │ │(BoltDB)│ │
                │ └──────┘ │
                │ ┌──────┐ │
                │ │Chunks│ │
                │ │(S3)  │ │
                │ └──────┘ │
                └──────────┘
```

Компоненты Loki:

- Distributor - принимает логи, валидирует, распределяет по ingester-ам
- Ingester - буферизует логи в памяти, записывает chunks в хранилище
- Querier - выполняет LogQL запросы, объединяет данные из ingester и storage
- Compactor - оптимизирует индексы, выполняет retention

### Promtail

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080

positions:
  filename: /var/lib/promtail/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Сбор логов из файлов
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: syslog
          host: ${HOSTNAME}
          __path__: /var/log/syslog

  # Сбор логов из Kubernetes pods
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod

    pipeline_stages:
      - cri: {}  # парсинг CRI формата логов
      - json:
          expressions:
            level: level
            msg: msg
            trace_id: traceID
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: RFC3339Nano

    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - source_labels: [__meta_kubernetes_container_name]
        target_label: container
```

### LogQL

```logql
# Базовый stream selector (по лейблам)
{job="api-server"}
{namespace="production", app=~"frontend|backend"}

# Line filter expressions
{job="api-server"} |= "error"          # содержит "error"
{job="api-server"} != "healthcheck"    # не содержит
{job="api-server"} |~ "status=5\\d{2}" # regex match
{job="api-server"} !~ "debug|trace"    # regex не совпадает

# Цепочка фильтров
{job="api-server"} |= "error" != "healthcheck" |~ "user_id=\\d+"

# Parser expressions
# JSON parser
{job="api-server"} | json
{job="api-server"} | json | level="error" | status >= 500

# Logfmt parser
{job="api-server"} | logfmt
{job="api-server"} | logfmt | duration > 1s | method="POST"

# Pattern parser (извлечение полей по шаблону)
{job="nginx"} | pattern `<ip> - - [<timestamp>] "<method> <uri> <_>" <status> <size>`
{job="nginx"} | pattern `<ip> - - [<timestamp>] "<method> <uri> <_>" <status> <size>` | status >= 400

# Regexp parser
{job="api-server"} | regexp `(?P<timestamp>\S+) (?P<level>\S+) (?P<msg>.+)`

# Label filter после парсинга
{job="api-server"} | json | status_code >= 400 | duration > 100ms
{job="api-server"} | logfmt | level =~ "error|warn" | caller != "healthcheck.go"

# Line format (переформатирование строки)
{job="api-server"} | json | line_format "{{.level}} {{.method}} {{.path}} {{.status}} {{.duration}}"

# Label format
{job="api-server"} | json | label_format duration_ms="{{divide .duration_ns 1000000}}"

# Metric queries (из логов в метрики)
# Количество строк в секунду
rate({job="api-server"} |= "error" [5m])

# Количество строк
count_over_time({job="api-server"} |= "error" [1h])

# Среднее значение из лога
avg_over_time({job="api-server"} | json | unwrap duration [5m])

# Квантили из значений в логах
quantile_over_time(0.99,
  {job="api-server"} | json | unwrap response_time [5m]
) by (endpoint)

# Top endpoints по количеству ошибок
topk(10,
  sum by (endpoint) (rate({job="api-server"} | json | level="error" [5m]))
)

# Bytes rate (объём логов)
bytes_rate({job="api-server"} [5m])
sum by (namespace) (bytes_rate({namespace=~".+"} [5m]))
```

> [!important] Лейблы в Loki
> Количество уникальных комбинаций лейблов определяет количество streams. Каждый stream хранится отдельно. Высокая кардинальность лейблов (user_id, request_id, trace_id) приводит к огромному количеству streams и деградации производительности. Используйте лейблы только для данных с низкой кардинальностью: namespace, service, level. Все остальные поля извлекайте через парсеры в query time.

---

## Thanos и Mimir

### Проблемы Prometheus в продакшене

Prometheus хранит данные локально. Это создаёт ограничения: данные привязаны к одному инстансу, нет долгосрочного хранения, нет глобального view при нескольких кластерах, HA через дублирование данных.

### Thanos

```
┌───────────┐  ┌───────────┐  ┌───────────┐
│Prometheus │  │Prometheus │  │Prometheus │
│+ Sidecar  │  │+ Sidecar  │  │+ Sidecar  │
│ (cluster1)│  │ (cluster2)│  │ (cluster3)│
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │               │               │
      ▼               ▼               ▼
┌──────────────────────────────────────────┐
│              Object Storage (S3)         │
└────────────────────┬─────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌──────────┐
    │ Store   │ │ Query   │ │ Compactor│
    │ Gateway │ │ Frontend│ │          │
    └─────────┘ └─────────┘ └──────────┘
```

Компоненты Thanos:

- Sidecar - устанавливается рядом с Prometheus, загружает блоки данных в объектное хранилище, проксирует запросы к локальным данным
- Store Gateway - предоставляет доступ к историческим данным из объектного хранилища
- Query (Querier) - единая точка запросов, объединяет данные из Sidecar и Store Gateway, дедуплицирует HA-реплики
- Query Frontend - кеширование и разбиение запросов
- Compactor - уплотнение блоков и downsampling (5m, 1h)
- Ruler - вычисление recording rules и алертов на долгосрочных данных

### Mimir (Grafana)

Grafana Mimir - горизонтально масштабируемое хранилище метрик. В отличие от Thanos, использует remote write и не требует sidecar.

```yaml
# Prometheus remote_write в Mimir
remote_write:
  - url: http://mimir:9009/api/v1/push
    headers:
      X-Scope-OrgID: tenant-1
    queue_config:
      max_samples_per_send: 1000
      batch_send_deadline: 5s
      max_shards: 200
```

Ключевые отличия:

| Характеристика | Thanos | Mimir |
|---------------|--------|-------|
| Архитектура | Sidecar + pull | Remote write + push |
| Multi-tenancy | Через external_labels | Нативный (X-Scope-OrgID) |
| Компоненты | 6 отдельных | Monolith или microservices |
| Downsampling | Встроенный (5m, 1h) | Нет (полагается на retention) |
| Совместимость | Любой Prometheus | Любой remote_write source |

---

## Экспортёры

### Node Exporter

Системные метрики Linux/Unix хостов: CPU, память, диск, сеть, файловые системы.

```bash
# Запуск
docker run -d \
  --name node-exporter \
  --net host \
  --pid host \
  -v /:/host:ro,rslave \
  quay.io/prometheus/node-exporter:latest \
  --path.rootfs=/host \
  --collector.filesystem.mount-points-exclude="^/(sys|proc|dev|host|etc)($$|/)"
```

Основные метрики:

```promql
# CPU
rate(node_cpu_seconds_total{mode="idle"}[5m])
node_load1, node_load5, node_load15

# Память
node_memory_MemTotal_bytes
node_memory_MemAvailable_bytes
node_memory_Buffers_bytes
node_memory_Cached_bytes

# Диск
node_filesystem_avail_bytes
node_filesystem_size_bytes
rate(node_disk_read_bytes_total[5m])
rate(node_disk_written_bytes_total[5m])
rate(node_disk_io_time_seconds_total[5m])

# Сеть
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])
node_network_up
```

### Blackbox Exporter

Проверка доступности внешних сервисов: HTTP, TCP, DNS, ICMP.

```yaml
# blackbox.yml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: [200]
      method: GET
      follow_redirects: true
      preferred_ip_protocol: ip4
      tls_config:
        insecure_skip_verify: false

  http_post_2xx:
    prober: http
    http:
      method: POST
      headers:
        Content-Type: application/json
      body: '{"healthcheck": true}'

  tcp_connect:
    prober: tcp
    timeout: 5s

  dns_resolution:
    prober: dns
    dns:
      query_name: example.com
      query_type: A
      valid_rcodes:
        - NOERROR

  icmp:
    prober: icmp
    timeout: 5s
```

```yaml
# prometheus.yml - scrape config for blackbox
scrape_configs:
  - job_name: "blackbox-http"
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://api.example.com/health
          - https://web.example.com
          - https://admin.example.com/login
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

Полезные метрики blackbox:

```promql
# Доступность endpoint
probe_success

# Время ответа
probe_duration_seconds

# SSL сертификат истекает через N дней
(probe_ssl_earliest_cert_expiry - time()) / 86400

# HTTP статус код
probe_http_status_code
```

### Kube-State-Metrics

Метрики состояния объектов Kubernetes: Deployments, Pods, Nodes, Services.

```promql
# Desired vs available replicas
kube_deployment_spec_replicas
kube_deployment_status_available_replicas

# Pod status
kube_pod_status_phase{phase="Running"}
kube_pod_status_ready{condition="true"}

# Container restarts
kube_pod_container_status_restarts_total

# Resource requests vs limits
kube_pod_container_resource_requests{resource="cpu"}
kube_pod_container_resource_limits{resource="memory"}

# Node status
kube_node_status_condition{condition="Ready", status="true"}
kube_node_status_allocatable
```

### Custom Exporter

```go
package main

import (
	"net/http"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	ordersProcessed = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "myapp",
			Subsystem: "orders",
			Name:      "processed_total",
			Help:      "Total number of processed orders",
		},
		[]string{"status", "payment_method"},
	)

	orderAmount = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "myapp",
			Subsystem: "orders",
			Name:      "amount_dollars",
			Help:      "Order amount distribution in dollars",
			Buckets:   []float64{10, 25, 50, 100, 250, 500, 1000, 5000},
		},
		[]string{"payment_method"},
	)

	activeConnections = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "myapp",
			Subsystem: "database",
			Name:      "active_connections",
			Help:      "Number of active database connections",
		},
	)
)

func init() {
	prometheus.MustRegister(ordersProcessed)
	prometheus.MustRegister(orderAmount)
	prometheus.MustRegister(activeConnections)
}

func main() {
	http.Handle("/metrics", promhttp.Handler())
	http.ListenAndServe(":2112", nil)
}
```

---

## Kubernetes мониторинг

### kube-prometheus-stack

Helm chart, который разворачивает полный стек мониторинга: Prometheus Operator, Grafana, Alertmanager, Node Exporter, kube-state-metrics, готовые дашборды и алерты.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values values.yaml
```

```yaml
# values.yaml
prometheus:
  prometheusSpec:
    retention: 30d
    retentionSize: 50GB

    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: gp3
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi

    resources:
      requests:
        cpu: 500m
        memory: 2Gi
      limits:
        cpu: 2
        memory: 8Gi

    # Выбор ServiceMonitor по лейблам
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
    ruleSelectorNilUsesHelmValues: false

    # Remote write в Thanos/Mimir
    # remoteWrite:
    #   - url: http://mimir:9009/api/v1/push

    # Thanos sidecar
    # thanos:
    #   objectStorageConfig:
    #     secret:
    #       type: S3
    #       config:
    #         bucket: thanos-metrics
    #         endpoint: s3.amazonaws.com

alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: gp3
          resources:
            requests:
              storage: 10Gi

  config:
    route:
      receiver: "slack"
      group_by: ["alertname", "namespace"]
      routes:
        - receiver: "pagerduty"
          matchers:
            - severity = critical
    receivers:
      - name: "slack"
        slack_configs:
          - api_url_secret:
              name: alertmanager-slack
              key: webhook-url
            channel: "#alerts"
      - name: "pagerduty"
        pagerduty_configs:
          - service_key_secret:
              name: alertmanager-pagerduty
              key: service-key

grafana:
  adminPassword: ""  # use existing secret
  admin:
    existingSecret: grafana-admin
    userKey: admin-user
    passwordKey: admin-password

  persistence:
    enabled: true
    size: 10Gi

  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
        - name: "custom"
          orgId: 1
          folder: "Custom"
          type: file
          options:
            path: /var/lib/grafana/dashboards/custom

  dashboardsConfigMaps:
    custom: grafana-custom-dashboards

  sidecar:
    dashboards:
      enabled: true
      label: grafana_dashboard
      searchNamespace: ALL
    datasources:
      enabled: true
      label: grafana_datasource

  ingress:
    enabled: true
    ingressClassName: nginx
    hosts:
      - grafana.example.com
    tls:
      - secretName: grafana-tls
        hosts:
          - grafana.example.com

nodeExporter:
  enabled: true

kubeStateMetrics:
  enabled: true
```

### ServiceMonitor

ServiceMonitor - CRD Prometheus Operator, который определяет как скрейпить метрики с Kubernetes сервисов.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-server
  namespace: monitoring
  labels:
    release: monitoring  # должен совпадать с selector Prometheus
spec:
  namespaceSelector:
    matchNames:
      - production

  selector:
    matchLabels:
      app: api-server

  endpoints:
    - port: http-metrics
      path: /metrics
      interval: 15s
      scrapeTimeout: 10s

      # Basic auth
      basicAuth:
        username:
          name: api-metrics-auth
          key: username
        password:
          name: api-metrics-auth
          key: password

      # TLS
      tlsConfig:
        insecureSkipVerify: false
        ca:
          secret:
            name: metrics-tls
            key: ca.crt

      # Relabeling
      relabelings:
        - sourceLabels: [__meta_kubernetes_pod_label_version]
          targetLabel: version

      metricRelabelings:
        - sourceLabels: [__name__]
          regex: "go_gc_.*"
          action: drop
```

### PodMonitor

PodMonitor - аналог ServiceMonitor для подов, которые не имеют Service.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: batch-jobs
  namespace: monitoring
spec:
  namespaceSelector:
    matchNames:
      - batch

  selector:
    matchLabels:
      monitoring: "true"

  podMetricsEndpoints:
    - port: metrics
      path: /metrics
      interval: 30s
```

### PrometheusRule

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: api-server-alerts
  namespace: monitoring
  labels:
    release: monitoring
spec:
  groups:
    - name: api-server.rules
      rules:
        - alert: APIServerHighErrorRate
          expr: |
            sum(rate(http_requests_total{job="api-server",status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{job="api-server"}[5m])) > 0.01
          for: 5m
          labels:
            severity: critical
            service: api-server
          annotations:
            summary: "API Server error rate is above 1%"
            runbook_url: "https://wiki.example.com/runbooks/api-errors"

        - alert: APIServerHighLatency
          expr: |
            histogram_quantile(0.99,
              sum by (le) (rate(http_request_duration_seconds_bucket{job="api-server"}[5m]))
            ) > 2
          for: 10m
          labels:
            severity: warning
            service: api-server
          annotations:
            summary: "API Server P99 latency is above 2s"
```

---

## Best Practices

### Naming Conventions

```
# Формат: namespace_subsystem_name_unit
# Единицы в базовых значениях: seconds, bytes, total

http_request_duration_seconds         # histogram/summary
http_requests_total                    # counter (суффикс _total)
http_request_size_bytes               # histogram
http_in_flight_requests               # gauge (без суффикса)
node_memory_MemAvailable_bytes        # gauge
process_cpu_seconds_total             # counter
```

Правила:

- Имена метрик в snake_case
- Суффикс `_total` для counters
- Суффикс единицы измерения: `_seconds`, `_bytes`, `_ratio`, `_percent`, `_info`
- Префикс namespace для приложения: `myapp_orders_processed_total`
- Не используй лейблы в имени метрики: `requests_GET_total` - неправильно, `requests_total{method="GET"}` - правильно

### Cardinality Management

Кардинальность - количество уникальных комбинаций лейблов. Высокая кардинальность приводит к росту потребления памяти и замедлению запросов.

```
# Опасно: user_id создаёт миллионы рядов
http_requests_total{user_id="12345", method="GET"} = 10M+ рядов

# Безопасно: ограниченный набор значений
http_requests_total{method="GET", status="200", handler="/api/users"} = сотни рядов
```

Рекомендации:

- Лейблы только с ограниченным набором значений (десятки, не тысячи)
- Никогда не используй в лейблах: user_id, request_id, email, IP-адреса
- Мониторь кардинальность: `prometheus_tsdb_head_series` и `scrape_series_added`
- Используй metric_relabel_configs для фильтрации дорогих метрик
- Устанавливай лимиты: `sample_limit` в scrape_config

```yaml
# Защита от cardinality explosion
scrape_configs:
  - job_name: "app"
    sample_limit: 10000        # максимум сэмплов с одного target
    target_limit: 100          # максимум targets в job
    label_limit: 30            # максимум лейблов на метрику
    label_name_length_limit: 200
    label_value_length_limit: 500
```

### Dashboard Design

Принципы проектирования дашбордов:

- Начинай с USE Method (Utilization, Saturation, Errors) для ресурсов
- Начинай с RED Method (Rate, Errors, Duration) для сервисов
- Группируй панели логически: overview сверху, детали снизу
- Используй variables для фильтрации (namespace, service, instance)
- Устанавливай thresholds для визуальной индикации (зелёный, жёлтый, красный)
- Добавляй annotations для деплоев и инцидентов
- Не более 20-25 панелей на дашборд

### Alert Fatigue Prevention

> [!summary] Принципы здорового алертинга
> - Каждый алерт должен быть actionable - если получивший алерт не может ничего сделать, это не алерт
> - Алертить на симптомы (SLO нарушен), а не причины (CPU высокий)
> - Использовать `for` duration для фильтрации мимолётных всплесков
> - Группировать связанные алерты через group_by
> - Inhibition rules для подавления зависимых алертов
> - Регулярно ревьюить алерты: если алерт игнорируется - удалить или починить
> - Severity levels определяют канал доставки: critical = page, warning = ticket, info = log

---

## Практический пример: полный стек для K8s

### Архитектура

```
                    ┌─────────────────────────────────────────────┐
                    │              Kubernetes Cluster              │
                    │                                             │
                    │  ┌───────────┐  ┌───────────┐              │
                    │  │ App Pods  │  │ App Pods  │              │
                    │  │ /metrics  │  │ /metrics  │              │
                    │  └─────┬─────┘  └─────┬─────┘              │
                    │        │               │                    │
                    │  ┌─────▼───────────────▼─────┐             │
                    │  │   Prometheus Operator      │             │
                    │  │   ┌─────────────────────┐  │             │
                    │  │   │ Prometheus (HA x2)  │  │             │
                    │  │   └──────────┬──────────┘  │             │
                    │  │              │              │             │
                    │  │   ┌──────────▼──────────┐  │             │
                    │  │   │  Alertmanager (x3)  │  │             │
                    │  │   └─────────────────────┘  │             │
                    │  └────────────────────────────┘             │
                    │                                             │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
                    │  │  Node    │  │  kube-   │  │ Blackbox │  │
                    │  │ Exporter │  │  state-  │  │ Exporter │  │
                    │  │ (DaemonS)│  │  metrics │  │          │  │
                    │  └──────────┘  └──────────┘  └──────────┘  │
                    │                                             │
                    │  ┌──────────────────────────────┐          │
                    │  │  Grafana                      │          │
                    │  │  ├─ Prometheus datasource     │          │
                    │  │  ├─ Loki datasource           │          │
                    │  │  └─ Tempo datasource          │          │
                    │  └──────────────────────────────┘          │
                    │                                             │
                    │  ┌──────────────────────────────┐          │
                    │  │  Loki (StatefulSet)           │          │
                    │  │  + Promtail (DaemonSet)       │          │
                    │  └──────────────────────────────┘          │
                    │                                             │
                    │  ┌──────────────────────────────┐          │
                    │  │  Mimir / Thanos               │          │
                    │  │  (long-term storage)           │          │
                    │  └──────────────────────────────┘          │
                    └─────────────────────────────────────────────┘
```

### Развёртывание

```bash
# 1. Namespace
kubectl create namespace monitoring

# 2. Secrets
kubectl create secret generic alertmanager-slack \
  --namespace monitoring \
  --from-literal=webhook-url="https://hooks.slack.com/services/xxx"

kubectl create secret generic grafana-admin \
  --namespace monitoring \
  --from-literal=admin-user="admin" \
  --from-literal=admin-password="$(openssl rand -base64 24)"

# 3. kube-prometheus-stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values values.yaml \
  --wait

# 4. Loki
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=50Gi \
  --set promtail.enabled=true \
  --set grafana.enabled=false  # уже установлена

# 5. Проверка
kubectl get pods -n monitoring
kubectl get servicemonitors -n monitoring
kubectl get prometheusrules -n monitoring
```

### ServiceMonitor для приложения

```yaml
# app-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
spec:
  selector:
    app: api-server
  ports:
    - name: http
      port: 8080
    - name: http-metrics
      port: 9090
---
# app-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-server
  namespace: monitoring
spec:
  namespaceSelector:
    matchNames: [production]
  selector:
    matchLabels:
      app: api-server
  endpoints:
    - port: http-metrics
      interval: 15s
      path: /metrics
---
# app-prometheusrule.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: api-server-slos
  namespace: monitoring
spec:
  groups:
    - name: api-server-slos
      rules:
        # Recording rules
        - record: api_server:http_requests:rate5m
          expr: sum(rate(http_requests_total{job="api-server"}[5m]))

        - record: api_server:http_errors:ratio_rate5m
          expr: |
            sum(rate(http_requests_total{job="api-server",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{job="api-server"}[5m]))

        - record: api_server:http_latency:p99_5m
          expr: |
            histogram_quantile(0.99,
              sum by (le) (rate(http_request_duration_seconds_bucket{job="api-server"}[5m])))

        # Alerts
        - alert: APIServerSLOErrorBudgetBurn
          expr: api_server:http_errors:ratio_rate5m > 0.001 * 14.4
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "API error budget burning too fast (14.4x burn rate)"

        - alert: APIServerSLOLatencyBudgetBurn
          expr: api_server:http_latency:p99_5m > 0.5
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "API P99 latency exceeds 500ms SLO"
---
# grafana-dashboard-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-custom-dashboards
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  api-overview.json: |
    {
      "dashboard": {
        "title": "API Server Overview",
        "uid": "api-overview",
        "panels": [
          {
            "title": "Request Rate",
            "type": "timeseries",
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
            "targets": [{"expr": "api_server:http_requests:rate5m"}]
          },
          {
            "title": "Error Rate",
            "type": "stat",
            "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
            "targets": [{"expr": "api_server:http_errors:ratio_rate5m * 100"}],
            "fieldConfig": {"defaults": {"unit": "percent"}}
          },
          {
            "title": "P99 Latency",
            "type": "stat",
            "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0},
            "targets": [{"expr": "api_server:http_latency:p99_5m"}],
            "fieldConfig": {"defaults": {"unit": "s"}}
          }
        ]
      }
    }
```

### Чеклист production-ready мониторинга

- Prometheus в HA режиме (2 реплики с одинаковой конфигурацией)
- Alertmanager в кластерном режиме (3 инстанса)
- Persistent storage для Prometheus и Alertmanager
- Long-term storage через Thanos или Mimir
- ServiceMonitor для каждого сервиса
- Recording rules для дорогих запросов
- Алерты на SLO/SLI, не на симптомы
- Grafana с provisioned datasources и dashboards
- Loki для централизованного сбора логов
- Blackbox exporter для внешних проверок
- Node exporter на каждой ноде (DaemonSet)
- Kube-state-metrics для состояния K8s объектов
- Resource limits для всех компонентов мониторинга
- Network policies для ограничения доступа к метрикам
- RBAC для Grafana с SSO интеграцией
- Backup стратегия для Grafana dashboards (GitOps)
- Runbooks для каждого критического алерта
- Регулярный аудит алертов (удаление неактуальных)
