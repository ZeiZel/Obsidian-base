---
tags:
  - devops
  - kubernetes
  - service-mesh
title: Service Mesh
---
## Концепция Service Mesh

В микросервисной архитектуре каждый сервис взаимодействует с десятками других по сети. Управление межсервисным трафиком порождает набор сквозных задач: маршрутизация, шифрование, аутентификация, observability, retry/timeout/circuit breaker. Реализовывать их в каждом сервисе вручную - путь к дублированию и ошибкам.

**Service Mesh** - инфраструктурный слой, который берёт на себя управление сетевым взаимодействием между сервисами, вынося эту логику из прикладного кода в прокси.

### Data Plane и Control Plane

Любой service mesh состоит из двух плоскостей:

- Data Plane - набор прокси, через которые проходит весь трафик между сервисами. Каждый прокси перехватывает входящие и исходящие запросы, применяет политики маршрутизации, шифрование, сбор метрик
- Control Plane - централизованный компонент, управляющий конфигурацией прокси: раздаёт сертификаты, распространяет правила маршрутизации, собирает телеметрию

```
┌─────────────────────────────────────────────────┐
│                 Control Plane                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Discovery │  │   CA     │  │ Config/Policy│  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────┬───────────────────────────┘
                      │ xDS / gRPC
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐┌──────────────┐┌──────────────┐
│  Pod A       ││  Pod B       ││  Pod C       │
│ ┌──────────┐ ││ ┌──────────┐ ││ ┌──────────┐ │
│ │  App     │ ││ │  App     │ ││ │  App     │ │
│ └────┬─────┘ ││ └────┬─────┘ ││ └────┬─────┘ │
│ ┌────▼─────┐ ││ ┌────▼─────┐ ││ ┌────▼─────┐ │
│ │  Proxy   │ ││ │  Proxy   │ ││ │  Proxy   │ │
│ └──────────┘ ││ └──────────┘ ││ └──────────┘ │
└──────────────┘└──────────────┘└──────────────┘
        Data Plane (sidecar proxies)
```

### Sidecar Pattern

Sidecar - контейнер, запущенный в том же поде, что и основное приложение. Прокси перехватывает весь сетевой трафик через iptables-правила (init-контейнер настраивает redirect). Приложение отправляет запрос на localhost, sidecar перехватывает его и направляет к прокси целевого сервиса.

Преимущества:
- Приложение не знает о mesh - нулевые изменения в коде
- Единообразная политика безопасности и observability для всего кластера
- Языко- и фреймворко-независимое решение

Недостатки:
- Дополнительные ресурсы (CPU/RAM) на каждый под
- Увеличение latency на каждый hop (обычно 1-3 мс)
- Усложнение дебага сетевых проблем

### Когда использовать Service Mesh

Mesh оправдан при:
- Десятках и сотнях микросервисов с интенсивным межсервисным общением
- Требованиях к mTLS между всеми сервисами (compliance, zero trust)
- Необходимости canary/blue-green деплоев на уровне инфраструктуры
- Потребности в единой observability без изменения кода сервисов

Mesh избыточен при:
- Менее 5-10 сервисов - overhead превышает выгоду
- Монолитной архитектуре
- Команде без опыта работы с Kubernetes

---

## Istio

Istio - наиболее feature-rich и распространённый service mesh. Построен на Envoy Proxy, предоставляет полный набор возможностей: traffic management, security, observability.

### Архитектура

Control plane представлен единым бинарником `istiod`, объединяющим:

- Pilot - преобразует правила маршрутизации в конфигурацию Envoy, раздаёт через xDS API
- Citadel - управляет сертификатами, выпускает и ротирует mTLS-сертификаты для каждого прокси
- Galley - валидирует конфигурацию, обеспечивает согласованность

Data plane состоит из Envoy sidecar-прокси в каждом поде. `istio-ingressgateway` - специальный Envoy на границе mesh.

### Установка

```bash
# istioctl - рекомендуемый способ
istioctl install --set profile=demo
# Профили: minimal, default, demo, empty, ambient

# Helm
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm install istio-base istio/base -n istio-system --create-namespace
helm install istiod istio/istiod -n istio-system
helm install istio-ingress istio/gateway -n istio-ingress --create-namespace

# Включение sidecar injection для namespace
kubectl label namespace default istio-injection=enabled
```

### Traffic Management

#### VirtualService

Определяет правила маршрутизации: route, timeout, retry, fault injection, traffic splitting.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  # Маршрутизация по заголовку
  - match:
    - headers:
        end-user:
          exact: qa-team
    route:
    - destination:
        host: reviews
        subset: v3

  # Weighted routing (canary) + resilience
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v2
      weight: 10
    timeout: 3s
    retries:
      attempts: 3
      perTryTimeout: 1s
      retryOn: 5xx,reset,connect-failure
    # Fault injection для тестирования
    fault:
      delay:
        percentage:
          value: 5
        fixedDelay: 3s
      abort:
        percentage:
          value: 1
        httpStatus: 500
```

#### DestinationRule

Политики после маршрутизации: load balancing, connection pool, circuit breaker (outlier detection).

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  trafficPolicy:
    loadBalancer:
      simple: LEAST_REQUEST  # ROUND_ROBIN, RANDOM, PASSTHROUGH
    connectionPool:
      tcp:
        maxConnections: 100
        connectTimeout: 30ms
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
    # Circuit breaker
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s        # время исключения хоста
      maxEjectionPercent: 50       # не более 50% хостов исключены
      minHealthPercent: 30         # ниже 30% здоровых - отключить ejection
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

#### Gateway

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: app-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: app-tls-cert
    hosts:
    - "app.example.com"
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "app.example.com"
    tls:
      httpsRedirect: true
```

### Security

#### mTLS - PeerAuthentication

```yaml
# Strict mTLS для всего mesh
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system  # mesh-wide scope
spec:
  mtls:
    mode: STRICT  # STRICT | PERMISSIVE | DISABLE
```

> [!important] Миграция на STRICT mTLS
> Рекомендуемый путь: сначала PERMISSIVE на mesh-wide уровне, затем namespace за namespace переводить в STRICT. Мониторить ошибки через `istioctl proxy-status` и метрики Envoy. Только после полного перехода выставлять STRICT глобально.

#### AuthorizationPolicy

```yaml
# Deny all по умолчанию
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  {}  # Пустой spec = deny all

---
# Разрешить доступ от конкретных сервисов
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend-to-api
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/frontend"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/v1/*"]
```

#### RequestAuthentication (JWT)

```yaml
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  jwtRules:
  - issuer: "https://auth.example.com"
    jwksUri: "https://auth.example.com/.well-known/jwks.json"
    audiences:
    - "api.example.com"
    forwardOriginalToken: true

---
# Требовать валидный JWT с определённой ролью
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-jwt
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  action: ALLOW
  rules:
  - from:
    - source:
        requestPrincipals: ["https://auth.example.com/*"]
    when:
    - key: request.auth.claims[role]
      values: ["admin", "editor"]
```

### Observability

Istio автоматически генерирует метрики, логи и трейсы без изменений в коде приложений.

Ключевые метрики Envoy (порт 15090):

| Метрика | Описание |
|---------|----------|
| `istio_requests_total` | Общее количество запросов |
| `istio_request_duration_milliseconds` | Latency (histogram) |
| `istio_request_bytes` / `istio_response_bytes` | Размер запросов/ответов |
| `istio_tcp_connections_opened_total` | TCP-соединения |

Distributed tracing настраивается через meshConfig:

```yaml
meshConfig:
  enableTracing: true
  defaultConfig:
    tracing:
      sampling: 10.0  # 10% в production
      zipkin:
        address: jaeger-collector.observability:9411
  accessLogFile: /dev/stdout
  accessLogEncoding: JSON
```

> [!info] Propagation заголовков
> Для distributed tracing приложение должно пробрасывать заголовки: `x-request-id`, `x-b3-traceid`, `x-b3-spanid`, `x-b3-parentspanid`, `x-b3-sampled`, `traceparent`, `tracestate`. Это единственное требование к прикладному коду.

Kiali визуализирует топологию mesh, трафик между сервисами, ошибки и latency:

```bash
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/addons/kiali.yaml
istioctl dashboard kiali
```

### Canary Deployments

Traffic splitting через VirtualService (weight в примере выше) - основной механизм canary. Процесс: деплой новой версии с отдельным subset, постепенное увеличение weight (10% -> 25% -> 50% -> 100%), мониторинг error rate и latency на каждом шаге.

> [!summary] Автоматизация canary
> Для автоматизации используйте Flagger или Argo Rollouts. Они анализируют метрики и автоматически увеличивают вес canary или откатывают при деградации.

### Ambient Mesh

Архитектура Istio без sidecar-контейнеров с двумя компонентами:

- **ztunnel** (zero-trust tunnel) - DaemonSet на каждом узле, обеспечивает L4: mTLS, телеметрия, авторизация на уровне identity. Минимальный overhead
- Waypoint Proxy - опциональный Envoy per-namespace для L7: HTTP routing, retries, header-based авторизация

```bash
# Установка в ambient mode
istioctl install --set profile=ambient

# Включение для namespace
kubectl label namespace default istio.io/dataplane-mode=ambient

# Waypoint proxy для L7
istioctl waypoint apply --for service -n production
```

Преимущества: снижение ресурсного overhead, не нужен restart подов для обновления прокси, инкрементальное внедрение (L4 сразу, L7 по необходимости).

> [!important] Зрелость Ambient Mesh
> Ambient mesh стал GA в Istio 1.22. Для новых инсталляций стоит рассмотреть ambient как основной режим. Миграция существующих sidecar-инсталляций возможна поэтапно.

---

## Linkerd

Linkerd - lightweight service mesh, ориентированный на простоту и минимальный overhead. Data plane proxy написан на Rust, что обеспечивает низкое потребление ресурсов и предсказуемую latency.

### Архитектура

Control plane:
- destination - service discovery, маршрутизация, конфигурация policy
- identity - CA для mTLS-сертификатов (автоматическая ротация каждые 24 часа)
- proxy-injector - webhook, внедряющий linkerd2-proxy в поды

Data plane:
- linkerd2-proxy - порядка 10-20 МБ RAM, менее 1% CPU на pod, sub-millisecond overhead на p99

### Установка

```bash
linkerd check --pre
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -
linkerd check

# Включение для namespace
kubectl annotate namespace production linkerd.io/inject=enabled
kubectl rollout restart deployment -n production

# Observability extension
linkerd viz install | kubectl apply -f -
linkerd viz dashboard
```

### Features

#### Automatic mTLS

mTLS включён по умолчанию для всего трафика внутри mesh. Не требует конфигурации:

```bash
linkerd viz edges deployment -n production  # столбец SECURED
linkerd viz tap deployment/api -n production  # tls=true
```

#### Retries, Timeouts, Rate Limiting

```yaml
apiVersion: policy.linkerd.io/v1beta3
kind: HTTPRoute
metadata:
  name: api-route
  namespace: production
spec:
  parentRefs:
  - name: api
    kind: Service
    group: core
    port: 80
  rules:
  - matches:
    - path:
        value: /api/v1/
        type: PathPrefix
    timeouts:
      request: 5s
      backendRequest: 3s
```

#### Load Balancing (EWMA)

Linkerd использует EWMA (Exponentially Weighted Moving Average). В отличие от round-robin, учитывает фактическую latency каждого endpoint и направляет трафик к наименее загруженным экземплярам. Эффективно при неоднородных экземплярах и bursty нагрузках.

#### Service Profiles

```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: api.production.svc.cluster.local
  namespace: production
spec:
  routes:
  - name: GET /api/v1/users
    condition:
      method: GET
      pathRegex: /api/v1/users
    isRetryable: true
    timeout: 3s
  - name: POST /api/v1/users
    condition:
      method: POST
      pathRegex: /api/v1/users
    isRetryable: false  # POST не retryable
    timeout: 5s
```

### SMI (Service Mesh Interface)

Linkerd поддерживает SMI - стандартизированный API для service mesh: TrafficSplit (canary/blue-green), TrafficMetrics, TrafficAccess.

```yaml
apiVersion: split.smi-spec.io/v1alpha4
kind: TrafficSplit
metadata:
  name: api-canary
  namespace: production
spec:
  service: api
  backends:
  - service: api-stable
    weight: 900
  - service: api-canary
    weight: 100
```

---

## Cilium Service Mesh

Cilium - networking, observability и security платформа для Kubernetes на базе eBPF. Service mesh без sidecar-прокси, с обработкой трафика на уровне ядра Linux.

### eBPF-based Networking

**eBPF** - технология ядра Linux, позволяющая запускать sandbox-программы в kernel space. Cilium перехватывает и обрабатывает сетевые пакеты без прохождения через userspace-прокси.

```
Sidecar:  App → iptables → Envoy (userspace) → kernel → network
Cilium:   App → kernel (eBPF program) → network
```

Преимущества: нет sidecar overhead, обработка в kernel без context switch, нативная интеграция с Linux networking stack.

### Features

#### L7 Policy

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-l7-policy
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: api
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: frontend
    toPorts:
    - ports:
      - port: "8080"
        protocol: TCP
      rules:
        http:
        - method: GET
          path: "/api/v1/public/.*"
        - method: POST
          path: "/api/v1/data"
```

#### mTLS и Encryption

Cilium поддерживает mTLS через SPIFFE и шифрование через WireGuard или IPsec:

```yaml
# Helm values при установке
encryption:
  enabled: true
  type: wireguard
```

#### Observability (Hubble)

Hubble предоставляет visibility в сетевой трафик на уровне eBPF: flow logs с L3/L4/L7 информацией, метрики Prometheus, service dependency map, DNS visibility.

```bash
cilium hubble enable --ui
hubble observe --namespace production
hubble observe --namespace production --protocol http --http-status 500
```

---

## Envoy Proxy

Envoy - высокопроизводительный L4/L7 прокси на C++. Data plane для Istio, широко используется standalone.

### Архитектура

```
Downstream ──▶ Listeners ──▶ Filter Chains ──▶ Routes ──▶ Clusters ──▶ Upstream
(clients)      (IP:port)     (L4/L7 filters)  (routing)  (backends)   (servers)
```

- Listeners - точки приёма соединений, содержат цепочки фильтров
- Filter Chains - L4-фильтры (TCP proxy, rate limit), L7-фильтры (HTTP connection manager, gRPC, router)
- Routes - правила маршрутизации к clusters
- Clusters - группы upstream-хостов с load balancing, health checks, circuit breakers
- Endpoints - конкретные адреса backend-сервисов

### xDS API

Набор discovery API для динамической конфигурации Envoy через gRPC-стриминг, без рестарта прокси:

| API | Назначение |
|-----|-----------|
| LDS | Listeners |
| RDS | Routes |
| CDS | Clusters |
| EDS | Endpoints |
| SDS | TLS-сертификаты |
| ADS | Агрегированный поток всех xDS |

Istio Pilot реализует xDS и является control plane для всех Envoy sidecar в mesh.

### Use Cases

- Sidecar proxy в service mesh (Istio, Consul Connect)
- Ingress proxy на входе в кластер (Envoy Gateway, Contour, Ambassador)
- Standalone front proxy для observability, rate limiting, auth
- Edge proxy для терминации TLS, HTTP/2, gRPC-Web transcoding

---

## Сравнение Service Mesh решений

| Критерий | Istio | Linkerd | Cilium |
|----------|-------|---------|--------|
| Data Plane | Envoy (C++) | linkerd2-proxy (Rust) | eBPF (kernel) |
| Sidecar | Да (+ ambient mode) | Да | Нет |
| RAM на proxy | ~50-100 МБ | ~10-20 МБ | ~0 (kernel) |
| Latency overhead (p99) | 2-5 мс | < 1 мс | < 0.5 мс |
| mTLS | Да | Да (по умолчанию) | Да (WireGuard/IPsec) |
| L7 policy | Полная | Базовая | Через Envoy CRD |
| Traffic management | Продвинутое | Базовое | Базовое |
| Observability | Prometheus, Jaeger, Kiali | Prometheus, Grafana | Hubble |
| Canary | VirtualService weight | TrafficSplit (SMI) | Gateway API |
| Circuit breaker | outlierDetection | Нет | Нет |
| JWT auth | Да | Нет | Нет |
| Multi-cluster | Да | Да | Да (Cluster Mesh) |
| Complexity | Высокая | Низкая | Средняя |
| CNCF Status | Graduated | Graduated | Graduated |

> [!summary] Выбор решения
> Istio - максимум функций, подходит для JWT auth, advanced traffic management, fault injection. Linkerd - mesh с минимальным overhead и простой операционной моделью. Cilium - оптимален когда уже используется как CNI и нужен mesh без sidecar overhead.

---

## Когда НЕ нужен Service Mesh

### Overhead

- Sidecar на каждый под потребляет ресурсы. При 200 подах Istio добавит 10-20 ГБ RAM
- Latency увеличивается на каждый hop. Для latency-sensitive приложений дополнительные 2-5 мс могут быть неприемлемы
- Control plane требует выделенных ресурсов. istiod рекомендуется запускать с не менее 2 ГБ RAM

### Complexity

- Новый слой абстракции для понимания, дебага и поддержки
- Обновление mesh требует координации - control plane и data plane обновляются раздельно
- Сетевые проблемы усложняются - iptables redirect, прокси, mTLS добавляют точки отказа
- Обучение команды занимает недели

### Альтернативы

| Задача | Альтернатива без mesh |
|--------|----------------------|
| mTLS | cert-manager + application-level TLS |
| Retry/timeout | Библиотеки в коде (resilience4j, go-retrier) |
| Circuit breaker | Библиотеки (Hystrix, gobreaker) |
| Load balancing | Kubernetes Service (kube-proxy, IPVS) |
| Observability | OpenTelemetry SDK в приложениях |
| Canary | Argo Rollouts, Flagger (без mesh) |
| Rate limiting | Ingress-level (NGINX, Envoy Gateway) |
| Authorization | OPA/Gatekeeper + NetworkPolicy |

> [!important] Правило принятия решения
> Если команда не может сформулировать три конкретные проблемы, которые решит service mesh - скорее всего он не нужен. Начинайте с NetworkPolicy + cert-manager + OpenTelemetry. Внедряйте mesh когда эти инструменты перестанут справляться.

### Пошаговый путь к mesh

1. Kubernetes NetworkPolicy для сегментации трафика
2. cert-manager для управления сертификатами
3. OpenTelemetry для observability
4. Ingress controller с rate limiting и auth
5. Service mesh когда предыдущие инструменты исчерпали возможности
