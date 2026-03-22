---
tags:
  - devops
title: Аудит DevOps документации - Gap Analysis
---

## Текущее состояние

19 файлов, ~18 400 строк. Основной контент покрывает Docker, Kubernetes, Helm, Helmfile, базовые сети, базовый Linux.

| Файл | Строк | Уровень |
|------|-------|---------|
| docker/docker.md | 7757 | Полный (Docker, Compose, Registry, Ansible, Vagrant, Swarm) |
| kubernetes/Kubernetes + Helm.md | 4273 | Полный (K8s + Helm от основ до продвинутого) |
| kubernetes/Kubernetes Entities.md | 3257 | Отличный справочник по всем ресурсам K8s |
| kubernetes/Helmfile.md | 804 | Хороший (prod-конфиги, SOPS, мультитенант) |
| networks.md | 1162 | Хороший (OSI до BGP/MPLS, диагностика) |
| NGINX.md | 138 | Базовый - только конфиг и виртхосты |
| CI-CD.md | 114 | Очень базовый - теория + простой GitHub Actions |
| linux/bash/bash.md | 194 | Только скриншоты, почти нет текста |
| linux/os/_lessons/ (9 файлов) | ~700 | Базовый Linux (файлы, пакеты, службы) |
| devops.md | 1 | Пустой |

---

## Критические пробелы (MUST HAVE для Senior DevOps)

### 1. GitLab CI - полностью отсутствует

Самый популярный CI/CD инструмент в enterprise. Нужен отдельный файл `gitlab-ci.md` с:

- Структура `.gitlab-ci.yml` - stages, jobs, scripts
- Пайплайны - parent-child, multi-project, merge request pipelines, DAG
- Rules и workflow - условия запуска, ветвление логики
- Переменные - project/group variables, predefined, masked, protected
- Артефакты - paths, expire_in, reports (junit, coverage, SAST)
- Кэш - key, paths, policy (push/pull), fallback keys, distributed cache
- Docker-in-Docker - сборка образов в CI, kaniko как альтернатива
- Runners - shared/group/project, tags, executor types (docker, shell, k8s)
- Environments и deployments - review apps, dynamic environments, stop environments
- Include и extends - переиспользование конфигов, шаблоны
- Services - PostgreSQL, Redis, Elasticsearch в CI
- Parallel и matrix - параллельные джобы, кросс-платформенное тестирование
- Security scanning - SAST, DAST, dependency scanning, container scanning, secret detection
- Releases и Auto DevOps
- Примеры production pipeline для монорепо и микросервисов

### 2. Мониторинг и Observability - полностью отсутствует

Без мониторинга нет production. Нужны файлы:

**prometheus-grafana.md** (must have)
- Архитектура Prometheus - pull model, targets, scraping
- PromQL - selectors, aggregation, rate, histogram_quantile
- Типы метрик - counter, gauge, histogram, summary
- Service discovery - kubernetes_sd, consul_sd, file_sd
- Alerting rules и Alertmanager - routing, grouping, silencing, inhibition
- Recording rules для оптимизации запросов
- Grafana - datasources, dashboards, provisioning as code, variables, annotations
- Grafana Loki - log aggregation для Kubernetes
- Thanos/Mimir - long-term storage для Prometheus

**datadog.md** (must have)
- Архитектура - Agent, DogStatsD, APM
- Установка агента - host, Docker, Kubernetes (Helm chart, Operator)
- Метрики - custom metrics, таги, агрегация
- APM и distributed tracing - инструментация, service map
- Log management - сбор, парсинг, индексация, pipelines
- Dashboards и monitors - types, alerting, SLO/SLI
- Synthetics - API tests, browser tests
- Infrastructure monitoring - integrations, host maps
- Security monitoring

**opentelemetry.md** (nice to have)
- Единый стандарт observability - traces, metrics, logs
- SDK, Collector, экспортёры
- Интеграция с Prometheus, Jaeger, DataDog
- Auto-instrumentation

### 3. GitOps - полностью отсутствует

**argocd.md** (must have)
- Концепция GitOps - single source of truth, declarative, pull-based
- Архитектура ArgoCD - API Server, Repo Server, Application Controller
- Application CRD - source, destination, sync policy
- Sync strategies - automated, manual, self-heal, prune
- App of Apps pattern - управление множеством приложений
- ApplicationSet - generators (git, cluster, matrix, merge)
- RBAC и SSO - проекты, роли, OIDC/LDAP
- Multi-cluster management
- Secrets management - Vault plugin, External Secrets, Sealed Secrets
- Notifications - Slack, email, webhooks
- Image Updater - автоматическое обновление образов
- Rollbacks и progressive delivery
- Интеграция с Helm и Kustomize

### 4. Infrastructure as Code - полностью отсутствует

**terraform.md** (must have)
- HCL синтаксис - resources, data sources, variables, outputs, locals
- Провайдеры - AWS, GCP, Azure, Kubernetes, Helm
- State management - remote backends (S3, GCS), state locking, state import
- Модули - создание, registry, versioning, composition
- Workspaces - разделение окружений
- Lifecycle - create_before_destroy, prevent_destroy, ignore_changes
- Provisioners и их ограничения
- Terraform Cloud/Enterprise
- Terragrunt - DRY конфигурации для больших проектов
- Best practices - directory structure, naming, tagging
- CI/CD интеграция - plan в MR, apply после approve

### 5. Cloud (AWS) - полностью отсутствует

**aws.md** (must have - хотя бы базово)
- IAM - users, roles, policies, assume role, OIDC federation
- VPC - subnets, route tables, NAT gateway, security groups, NACLs, peering
- EC2 - instance types, AMI, launch templates, auto scaling groups
- EKS - managed node groups, Fargate, IRSA, add-ons
- S3 - buckets, lifecycle, versioning, replication, presigned URLs
- RDS/Aurora - multi-AZ, read replicas, parameter groups, backups
- Route53 - hosted zones, record types, routing policies
- CloudFront - distributions, behaviors, cache invalidation
- ELB/ALB/NLB - target groups, health checks, SSL termination
- SQS/SNS - queues, topics, dead letter queues
- CloudWatch - metrics, logs, alarms, dashboards
- Secrets Manager / Parameter Store

### 6. DevSecOps - почти отсутствует

**devsecops.md** (must have)
- Secrets management - HashiCorp Vault (архитектура, secrets engines, auth methods, policies)
- External Secrets Operator - интеграция K8s с Vault/AWS SM/GCP SM
- Container security - Trivy, Snyk, image scanning в CI
- Pod Security Standards / Pod Security Admission
- OPA Gatekeeper / Kyverno - policy enforcement в K8s
- Network Policies - ограничение трафика между подами
- RBAC в Kubernetes - принцип least privilege
- Supply chain security - Cosign, SBOM, Sigstore, SLSA framework
- SAST/DAST в CI/CD pipeline
- Secret scanning - GitLeaks, TruffleHog (pre-commit hooks)
- CIS Benchmarks - Kubernetes, Docker, Linux
- Falco - runtime security detection

### 7. SRE практики - полностью отсутствует

**sre.md** (must have)
- SLI / SLO / SLA - определение, выбор метрик, error budgets
- Toil reduction - автоматизация рутинных задач
- Incident management - blameless postmortems, on-call rotation
- Capacity planning и load testing
- Chaos Engineering - Chaos Monkey, Litmus, steady state hypothesis
- Runbooks и playbooks для инцидентов
- PagerDuty / OpsGenie интеграция

---

## Значительные пробелы (важно для Senior)

### 8. GitHub Actions продвинутый - текущий CI-CD.md слишком базовый

Дополнить CI-CD.md или создать `github-actions.md`:
- Reusable workflows и composite actions
- Matrix strategy - кросс-платформенное тестирование
- Environments и deployment protection rules
- OIDC для безсекретной аутентификации в облаках
- Self-hosted runners - настройка, безопасность
- Caching - actions/cache, dependency caching
- Artifacts - upload/download между джобами
- Concurrency - отмена дублирующих запусков
- Custom actions - JavaScript, Docker container
- Secrets management и environments
- Workflow dispatch - ручной запуск с параметрами

### 9. NGINX продвинутый - текущий файл базовый

Дополнить NGINX.md:
- Load balancing - upstream, алгоритмы (round-robin, least_conn, ip_hash, consistent hashing)
- Rate limiting - limit_req, limit_conn, burst
- Caching - proxy_cache, cache zones, purge
- SSL/TLS - сертификаты, OCSP stapling, HSTS, HTTP/2, HTTP/3
- Security headers - CSP, X-Frame-Options, X-Content-Type-Options
- Reverse proxy - proxy_pass, proxy_set_header, WebSocket proxying
- Stream module - TCP/UDP load balancing
- Logging - custom formats, conditional logging, JSON logs
- Performance tuning - worker_processes, worker_connections, buffers
- Health checks
- Мониторинг - stub_status, Prometheus exporter

### 10. Linux администрирование продвинутый

Текущие lessons очень базовые. Нужен `linux-admin.md`:
- Performance troubleshooting - top, htop, vmstat, iostat, sar, dstat, perf
- Memory management - swap, OOM killer, cgroups v2, memory limits
- Disk I/O - ionice, fio, RAID levels, LVM расширение
- Network tuning - sysctl (net.core.somaxconn, tcp_tw_reuse, etc.)
- systemd продвинутый - создание unit файлов, timers vs cron, journalctl фильтрация
- Process management - nice/renice, ulimits, /proc filesystem
- SELinux/AppArmor - modes, policies, troubleshooting
- Kernel parameters - sysctl.conf, tuning для high-load
- Troubleshooting runbook - алгоритм диагностики проблем на сервере

### 11. Bash scripting - текущий файл пустой (только скриншоты)

Полностью переписать `bash.md` с текстовым контентом:
- Переменные, типы данных, массивы, ассоциативные массивы
- Условия, циклы, case
- Функции, return codes, local variables
- Работа с файлами - read, test operators
- Текстовая обработка - grep, sed, awk, cut, sort, uniq, tr
- Регулярные выражения в bash
- Process substitution, command substitution
- Trap и обработка сигналов
- Debugging - set -x, set -e, set -o pipefail
- Practical scripts - log rotation, backup, health check, deployment

---

## Дополнительные пробелы (nice to have для Senior+)

### 12. Service Mesh

**service-mesh.md**
- Концепция и зачем нужен (mTLS, observability, traffic management)
- Istio - VirtualService, DestinationRule, Gateway, AuthorizationPolicy
- Linkerd - lightweight альтернатива (Rust-based proxy, mTLS по умолчанию)
- Cilium service mesh - eBPF-based, без sidecar overhead
- Envoy как data plane proxy

### 13. Load Balancers и Proxy

**load-balancing.md**
- HAProxy - конфигурация, ACL, health checks, stats
- Traefik - автоматическое обнаружение в Docker/K8s
- Envoy - xDS API, filters, observability
- Сравнение NGINX vs HAProxy vs Traefik vs Envoy

### 14. Logging (централизованное)

**logging.md**
- ELK Stack - Elasticsearch, Logstash, Kibana (архитектура, index patterns, ILM)
- Fluentd/Fluent Bit - сбор логов в K8s
- Grafana Loki - LogQL, storage
- Structured logging - JSON logs, correlation IDs
- Log rotation - logrotate конфигурация

### 15. Database Administration (DevOps perspective)

**database-ops.md**
- PostgreSQL ops - backup (pg_dump, pg_basebackup, WAL archiving, pgBackRest)
- Replication - streaming, logical, patroni для HA
- Connection pooling - PgBouncer, pgpool
- Мониторинг БД - pg_stat_statements, pg_stat_activity, pgwatch2
- Database migrations в CI/CD - Flyway, Liquibase, golang-migrate
- Redis ops - persistence, sentinel, cluster

### 16. Message Queues Operations

**message-queues-ops.md**
- Kafka - архитектура (brokers, topics, partitions, consumer groups), мониторинг, operations
- RabbitMQ - exchanges, queues, bindings, clustering, management UI, мониторинг
- NATS - lightweight messaging

### 17. Container Runtime и Registry

**container-advanced.md**
- containerd vs CRI-O - container runtimes
- BuildKit - advanced Docker builds, layer caching, multi-platform
- Harbor - enterprise registry, vulnerability scanning, replication
- Distroless images - минимизация attack surface
- OCI стандарты - image spec, runtime spec

### 18. Сетевые практические сценарии

Дополнить networks.md:
- CNI plugins в K8s - Calico, Cilium, Flannel (сравнение)
- Cloud networking - VPC peering, Transit Gateway, PrivateLink
- CoreDNS - конфигурация в K8s, custom DNS
- External-DNS - автоматическое управление DNS записями
- Cert-Manager - автоматические TLS сертификаты через Let's Encrypt
- Практические сценарии troubleshooting: "сервис не отвечает", "DNS не резолвится", "потеря пакетов"

---

## Структурные улучшения

### devops.md - индексная страница
Сейчас пустая. Должна стать навигационной страницей со ссылками на все темы (как `os.md` для Linux).

### Ansible - выделить из docker.md
Ansible сейчас живёт внутри огромного docker.md (строки 2050-5442). Это ~3400 строк, которые логичнее вынести в отдельный файл `ansible.md`.

### Bash - переписать
Текущий bash.md содержит только скриншоты без текста. Нужна полная переработка.

---

## Приоритеты реализации

### Фаза 1 - Критические пробелы (закрывает 80% вопросов на собеседованиях)
1. `gitlab-ci.md` - GitLab CI продвинутый
2. `prometheus-grafana.md` - Мониторинг и алертинг
3. `terraform.md` - Infrastructure as Code
4. `argocd.md` - GitOps
5. Дополнить `CI-CD.md` (GitHub Actions продвинутый)
6. `sre.md` - SRE практики, SLI/SLO/SLA

### Фаза 2 - Важные темы
7. `aws.md` - Cloud платформа
8. `datadog.md` - APM и observability
9. `devsecops.md` - Безопасность
10. Дополнить `NGINX.md` - продвинутая конфигурация
11. `linux-admin.md` - Linux troubleshooting

### Фаза 3 - Структурные улучшения
12. Переписать `bash.md` - bash scripting с текстом
13. Выделить Ansible из docker.md в `ansible.md`
14. Заполнить `devops.md` как индексную страницу

### Фаза 4 - Дополнительные темы
15. `logging.md` - ELK, Loki, Fluentd
16. `service-mesh.md` - Istio, Linkerd, Cilium
17. `database-ops.md` - DB operations
18. `message-queues-ops.md` - Kafka, RabbitMQ ops
19. Дополнить `networks.md` - CNI, практические сценарии

---

## Топ тем на собеседованиях Senior DevOps (2025-2026)

По анализу 500+ вопросов с собеседований, самые частые темы:

1. **System design** - спроектировать CI/CD pipeline, мониторинг стек, HA и DR
2. **Kubernetes troubleshooting** - Pod crashes, networking, resource constraints
3. **Terraform state management** - state locking, drift detection, модули
4. **Incident response** - как обработал production outage (acknowledge, diagnose, fix, postmortem)
5. **Security integration** - shift left, secrets management, vulnerability scanning
6. **Networking** - DNS resolution, L4 vs L7 load balancing, troubleshooting connectivity
7. **Container internals** - namespaces, cgroups, Docker build optimization, multi-stage
8. **GitOps workflows** - Git as source of truth, ArgoCD sync, secrets в Git
9. **Cloud architecture** - VPC design, IAM least privilege, cost optimization
10. **Automation philosophy** - идемпотентность, IaC vs configuration management

---

## Tech Radar 2026

| Категория | Изучать сейчас | Продолжать использовать | Снижать приоритет |
|-----------|---------------|------------------------|-------------------|
| IaC | Crossplane | Terraform / OpenTofu | Ручная настройка |
| CI/CD | Dagger | GitHub Actions / GitLab CI | Jenkins (self-hosted) |
| Security | Cosign / Kyverno | Trivy / Snyk | Ручные аудиты |
| Observability | OpenTelemetry | Prometheus / Grafana | Проприетарные агенты |
| Developer Experience | Backstage (IDP) | Docs as code | Wiki-based onboarding |
| Cost Management | Infracost (FinOps) | Resource quotas | Безлимитные бюджеты |
