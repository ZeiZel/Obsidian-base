# System Design: Дополнение недостающих тем

## TL;DR

> **Quick Summary**: Добавить в существующую заметку System Design 10 отсутствующих тем/разделов, критически важных для проектирования крупных систем: WAF, инструменты проксирования, Zero Trust, Secrets Management, Disaster Recovery, расширение Service Discovery и Observability, Feature Flags, Chaos Engineering и Infrastructure as Code.
> 
> **Deliverables**:
> - 10 дополнений/новых разделов в файл `base/architecture/System Design/System Design.md`
> - Все дополнения на русском языке, в стиле существующей заметки
> - Никакой переработки существующего текста — только ДОБАВЛЕНИЕ нового
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1-3 (foundation/security) → Task 4-8 (expansions) → Task 9-11 (new sections)

---

## Context

### Original Request
Пользователь заметил, что в заметке System Design отсутствует WAF и конкретные инструменты проксирования. После анализа выявлено 10 тем, критически важных для проектирования крупных приложений, которые полностью или частично отсутствуют.

### Interview Summary
**Key Discussions**:
- WAF: полностью отсутствует, нужно добавить
- Прокси: концепции есть, инструменты отсутствуют
- K8s: не расширять — есть отдельная заметка
- Существующий текст: не перерабатывать, только добавлять
- Стиль: русский язык, без em-dash, minimal bold, Obsidian callouts

**Research Findings**:
- Metis выявил дубликаты: Blue/Green, Canary, Rolling deployments УЖЕ есть (строки 2291-2330)
- Rate Limiting алгоритмы УЖЕ есть (строки 2579-2604): Token Bucket, Leaky Bucket, Sliding Window
- Spark и Flink упомянуты в Lambda архитектуре (строки 2461-2462), но без сравнения инструментов

### Metis Review
**Identified Gaps** (addressed):
- Дублирование Deployment Strategies → Убрано, вместо этого добавляем Feature Flags в существующий раздел "Паттерны релизов"
- Дублирование Rate Limiting → Убрано, уже полностью покрыто
- Дублирование Data Processing tools → Уменьшено, вместо нового раздела — расширение существующего Lambda/Kappa добавлением Apache Beam и таблицы сравнения
- K8s исключён по требованию пользователя

---

## Work Objectives

### Core Objective
Дополнить существующую заметку System Design недостающими темами и инструментами, не нарушая структуру и стиль.

### Concrete Deliverables
- Файл `base/architecture/System Design/System Design.md` с 10 дополнениями
- Каждое дополнение — новый подраздел (`###` или `####`) в соответствующем месте
- Сравнительные таблицы для инструментов где уместно

### Definition of Done
- [ ] Все 10 дополнений добавлены в файл
- [ ] Ни одно существующее содержание не удалено или переписано
- [ ] Все дополнения на русском языке
- [ ] Стиль соответствует существующему (obsidian callouts, таблицы, минимальный bold)
- [ ] Нет em-dash (—) или двойного дефиса (--)
- [ ] `npx quartz build -d base` проходит без ошибок

### Must Have
- WAF раздел с OWASP Top 10 контекстом и инструментами
- Zero Trust и Secrets Management под безопасностью
- Disaster Recovery с RPO/RTO
- Конкретные инструменты: HAProxy, NGINX, Envoy, Traefik для прокси
- OpenTelemetry, Thanos/Cortex для Observability
- Feature Flags в существующем разделе релизов
- Chaos Engineering
- IaC (Terraform, Ansible, GitOps)

### Must NOT Have (Guardrails)
- ❌ НЕ переписывать существующие абзацы
- ❌ НЕ расширять тему Kubernetes (отдельная заметка)
- ❌ НЕ добавлять раздел про Rate Limiting алгоритмы (уже есть)
- ❌ НЕ добавлять раздел про Blue-Green/Canary/Rolling deployments (уже есть)
- ❌ НЕ использовать em-dash (—) или двойной дефис (--)
- ❌ НЕ использовать CAPS для акцента
- ❌ НЕ использовать bold более 1-2 раз на секцию
- ❌ НЕ создавать отдельную заметку — всё в один файл

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (this is a markdown knowledge base, no test framework)
- **Automated tests**: None
- **Framework**: none
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.
- **Markdown/Content**: Use Bash (grep/ast_grep) - verify content exists, no em-dash, proper structure
- **Build**: Use Bash - run `npx quartz build -d base` to verify no broken references

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - security + networking foundations):
├── Task 1: WAF раздел (under Сетевая инфраструктура) [quick]
├── Task 2: Таблица инструментов проксирования (under Проксирование) [quick]
├── Task 3: Zero Trust + Secrets Management (under Безопасность) [unspecified-high]
└── Task 4: Feature Flags (under Паттерны релизов) [quick]

Wave 2 (After Wave 1 - expansions of existing sections):
├── Task 5: Расширение Service Discovery (etcd, Zookeeper) [quick]
├── Task 6: Расширение Observability (OpenTelemetry, Thanos/Cortex, Datadog) [unspecified-high]
├── Task 7: Disaster Recovery (RPO/RTO, стратегии бэкапа) [unspecified-high]
└── Task 8: Расширение Data Processing (Apache Beam, таблица сравнения) [quick]

Wave 3 (After Wave 2 - new sections):
├── Task 9: Chaos Engineering [quick]
└── Task 10: Infrastructure as Code + GitOps [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Content quality review (unspecified-high)
├── Task F3: Build + style verification (unspecified-high)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

---

## TODOs

- [x] 1. WAF (Web Application Firewall)

  **What to do**:
  - Добавить раздел `#### WAF` после подраздела `### API Gateway` (после строки ~574) и перед `### Service Mesh`
  - Описать концепцию: WAF работает на L7 (Application layer), фильтрует HTTP-трафик по правилам, защищает от OWASP Top 10 (SQL-инъекции, XSS, CSRF, RCE, file inclusion)
  - Привести таблицу инструментов: AWS WAF, Cloudflare WAF, ModSecurity, Imperva, Akamai Kona
  - Добавить Obsidian callout `> [!info] WAF не заменяет другие виды защиты, а дополняет их. Используется вместе с сетевыми файрволами (L3/L4) и IDS/IPS.`
  - Кратко описать отличие WAF от сетевого файрвола (L3/L4) и от Rate Limiting

  **Must NOT do**:
  - НЕ переписывать существующий текст вокруг API Gateway или Service Mesh
  - НЕ углубляться в K8s Ingress и Network Policies

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`knowledge-writer`]
    - `knowledge-writer`: Специализированный навык написания заметок для Obsidian vault

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Nothing
  - **Blocked By**: None (can start immediately)

  **References**:
  - `base/architecture/System Design/System Design.md:546-607` - Секция "Сетевая инфраструктура", место вставки после API Gateway (строка ~574)
  - `base/architecture/System Design/System Design.md:183-225` - Существующая секция "Безопасность" с OAuth, JWT, mTLS - для понимания стиля
  - `base/architecture/System Design/System Design.md:518-543` - Секция "Проксирование" - понять глубину описания
  - CLAUDE.md - правила стиля: no em-dash, minimal bold, use callouts

  **Acceptance Criteria**:
  - [ ] Раздел `#### WAF` добавлен после API Gateway и перед Service Mesh
  - [ ] Таблица с минимум 4 инструментами (AWS WAF, Cloudflare WAF, ModSecurity, +1)
  - [ ] Упоминание OWASP Top 10
  - [ ] Callout с важным замечанием
  - [ ] Нет em-dash или двойного дефиса в тексте

  **QA Scenarios**:

  ```
  Scenario: WAF раздел корректно добавлен
    Tool: Bash (grep)
    Preconditions: Файл существует
    Steps:
      1. grep -c "WAF" "base/architecture/System Design/System Design.md" → результат > 0
      2. grep -c "OWASP" "base/architecture/System Design/System Design.md" → результат > 0
      3. grep -c "Cloudflare WAF" "base/architecture/System Design/System Design.md" → результат > 0
      4. grep -c "ModSecurity" "base/architecture/System Design/System Design.md" → результат > 0
    Expected Result: Все grep возвращают > 0
    Failure Indicators: Любой grep возвращает 0
    Evidence: .sisyphus/evidence/task-1-waf-section.txt

  Scenario: Стиль заметки не нарушен
    Tool: Bash (grep)
    Preconditions: Файл существует
    Steps:
      1. grep -Pn "—" "base/architecture/System Design/System Design.md" | wc -l → проверить, что новых em-dash нет (старые были до изменений)
      2. grep -n "#### WAF" "base/architecture/System Design/System Design.md" → заголовок существует
    Expected Result: Em-dash проверки только на старых строках, новый заголовок WAF найден
    Evidence: .sisyphus/evidence/task-1-style-check.txt
  ```

  **Commit**: YES (groups with all Wave 1 tasks)
  - Message: `docs(system-design): add WAF, proxy tools, zero trust, secrets mgmt, feature flags`
  - Files: `base/architecture/System Design/System Design.md`
  - Pre-commit: `npx quartz build -d base`

- [x] 2. Таблица инструментов проксирования

  **What to do**:
  - Добавить подраздел `#### Инструменты проксирования` после `#### Reverse-proxy` (после строки ~543) и перед `### CDN`
  - Создать сравнительную таблицу reverse-proxy / load balancer инструментов:
    - **NGINX** - Reverse proxy, LB, кэширование, TLS termination. Самый популярный выбор
    - **HAProxy** - Профессиональный L4/L7 балансировщик, высокая производительность, TCP/HTTP
    - **Envoy** - L7 proxy от Lyft, xDS API, gRPC support, observability из коробки
    - **Traefik** - Cloud-native, автоконфигурация через labels/Docker/K8s, LetsEncrypt
    - **Caddy** - Простой reverse proxy с автоматическим HTTPS (LetsEncrypt)
  - Таблица с колонками: Инструмент | Тип | L4/L7 | Ключевая особенность | Лучше для
  - Добавить callout `> [!info] Выбор инструмента зависит от контекста: NGINX/HAProxy для классических инфраструктур, Envoy для service mesh и gRPC, Traefik/Caddy для cloud-native с автоконфигурацией.`

  **Must NOT do**:
  - НЕ переписывать существующие описания forward/reverse proxy
  - НЕ дублировать информацию из Service Mesh раздела

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Nothing
  - **Blocked By**: None (can start immediately)

  **References**:
  - `base/architecture/System Design/System Design.md:518-543` - Существующая секция "Проксирование" - понять стиль и глубину
  - `base/architecture/System Design/System Design.md:559-574` - API Gateway с инструментами (Kong, NGINX, AWS API Gateway, Envoy, Traefik) - НЕ дублировать
  - `base/architecture/System Design/System Design.md:576-591` - Service Mesh описание с инструментами - НЕ дублировать

  **Acceptance Criteria**:
  - [ ] Подраздел `#### Инструменты проксирования` добавлен после Reverse-proxy
  - [ ] Сравнительная таблица с минимум 5 инструментами (NGINX, HAProxy, Envoy, Traefik, Caddy)
  - [ ] Callout с рекомендацией по выбору
  - [ ] Нет дублирования с API Gateway или Service Mesh секциями

  **QA Scenarios**:

  ```
  Scenario: Таблица прокси инструментов добавлена
    Tool: Bash (grep)
    Steps:
      1. grep -c "HAProxy" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "Инструменты проксирования" "base/architecture/System Design/System Design.md" → > 0
      3. grep -c "Caddy" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-2-proxy-tools.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `docs(system-design): add WAF, proxy tools, zero trust, secrets mgmt, feature flags`
  - Files: `base/architecture/System Design/System Design.md`

- [x] 3. Zero Trust Architecture + Secrets Management

  **What to do**:
  - Добавить два подраздела в секцию `#### Безопасность` (после mTLS, строка ~224):
  
  **3a. Zero Trust Architecture:**
  - Концепция: "never trust, always verify" - каждый запрос аутентифицируется и авторизуется, независимо от сетевого расположения
  - Принципы: verify explicitly (аутентификация + авторизация на каждом запросе), least privilege access (минимальные права), assume breach (предполагаем взлом)
  - Отличие от периметральной безопасности (castle-and-moat)
  - Инструменты и реализации: OPA (Open Policy Agent) для policy-as-code, Istio/Linkerd для mTLS между сервисами, BeyondCorp (Google), Zero Trust Network Access (ZTNA)
  - Callout `> [!warning] Zero Trust не заменяет сетевую безопасность, а дополняет её. Сетевые файрволы (L3/L4) по-прежнему нужны для ограничения поверхностей атаки.`
  
  **3b. Secrets Management:**
  - Концепция: централизованное хранение, ротация и доступ к секретам (пароли, API-ключи, сертификаты)
  - Проблема: хранение секретов в env-файлах, конфигах и коде - главная уязвимость
  - Static secrets vs Dynamic secrets (автоматическая генерация и ротация, TTL)
  - Инструменты: HashiCorp Vault, AWS Secrets Manager + Parameter Store, Azure Key Vault, Sealed Secrets (K8s)
  - Таблица: Инструмент | Тип секретов | Dynamic secrets | Интеграция с K8s | Использование
  
  - Краткая связь с существующим mTLS подразделом

  **Must NOT do**:
  - НЕ переписывать существующие подразделы OAuth 2.0, JWT, mTLS
  - НЕ углубляться в K8s Sealed Secrets (отдельная заметка)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Nothing
  - **Blocked By**: None (can start immediately)

  **References**:
  - `base/architecture/System Design/System Design.md:183-225` - Существующая секция безопасности с OAuth, JWT, mTLS - вставить ПОСЛЕ mTLS
  - `base/architecture/System Design/System Design.md:224-225` - Конец секции mTLS - точка вставки

  **Acceptance Criteria**:
  - [ ] Подраздел `##### Zero Trust Architecture` добавлен после mTLS
  - [ ] Подраздел `##### Secrets Management` добавлен после Zero Trust
  - [ ] Упомянуты OPA, Vault, AWS Secrets Manager, Sealed Secrets
  - [ ] Сравнительная таблица секрет-менеджеров с минимум 4 инструментами
  - [ ] Two callouts (warning для Zero Trust и info для Secrets)

  **QA Scenarios**:

  ```
  Scenario: Zero Trust и Secrets Management добавлены
    Tool: Bash (grep)
    Steps:
      1. grep -c "Zero Trust" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "Secrets Management" "base/architecture/System Design/System Design.md" → > 0
      3. grep -c "HashiCorp Vault" "base/architecture/System Design/System Design.md" → > 0
      4. grep -c "OPA" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-3-zero-trust-secrets.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `docs(system-design): add WAF, proxy tools, zero trust, secrets mgmt, feature flags`

- [x] 4. Feature Flags

  **What to do**:
  - Добавить подраздел `#### Feature Flags` после `#### Canary Release` (после строки ~2330) в секции `### Паттерны релизов`
  - Описать концепцию: флаги функций позволяют включать и выключать функционал без передеплоя, управлять релизами и A/B тестами
  - Типы флагов: Release flags (управление доступностью фичи), Ops flags (kill switch для отключения проблемного функционала), Experiment flags (A/B тестирование), Permission flags (доступ по ролям/регионам)
  - Инструменты: LaunchDarkly, Unleash, Flagsmith, OpenFeature (стандартизированный интерфейс)
  - Связь с Canary Release: feature flags позволяют точечно давать новый функционал проценту пользователей
  - Callout `> [!info] Feature Flags упрощают Canary Release - вместо переключения всего трафика через роутер, можно включать фичу для 5% пользователей прямо в коде.`

  **Must NOT do**:
  - НЕ переписывать существующие Rolling, Blue/Green, Canary Release описания
  - НЕ создавать отдельный раздел - это дополнение к существующему

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Nothing
  - **Blocked By**: None (can start immediately)

  **References**:
  - `base/architecture/System Design/System Design.md:2291-2330` - Существующая секция "Паттерны релизов" - вставить Feature Flags ПОСЛЕ Canary Release
  - `base/architecture/System Design/System Design.md:2324-2330` - Canary Release - связать с feature flags

  **Acceptance Criteria**:
  - [ ] Подраздел `#### Feature Flags` добавлен после Canary Release
  - [ ] Описаны минимум 3 типа флагов
  - [ ] Упомянуты LaunchDarkly, Unleash, OpenFeature
  - [ ] Callout с связью к Canary Release

  **QA Scenarios**:

  ```
  Scenario: Feature Flags добавлены
    Tool: Bash (grep)
    Steps:
      1. grep -c "Feature Flags" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "LaunchDarkly" "base/architecture/System Design/System Design.md" → > 0
      3. grep -c "OpenFeature" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-4-feature-flags.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `docs(system-design): add WAF, proxy tools, zero trust, secrets mgmt, feature flags`

- [x] 5. Расширение Service Discovery

  **What to do**:
  - Расширить существующий раздел `### Service Discovery` (строки ~593-607)
  - Добавить ПОСЛЕ существующего контента (не переписывая):
    - Подробности по etcd: distributed KV store, используется в K8s для хранения состояния кластера, watch API для уведомлений об изменениях
    - Подробности по Zookeeper: иерархическое хранение, используется в Kafka для координации, leader election
    - Более подробное сравнение client-side vs server-side discovery с плюсами/минусами каждого
    - Таблица инструментов: Инструмент | Тип discovery | Ключевая особенность | Производит. при большом кол-ве сервисов
      - Consul, Eureka, etcd, Zookeeper, K8s DNS
    - Связь с Load Balancing: discovery feeding endpoints to LB

  **Must NOT do**:
  - НЕ переписывать существующие 2 абзаца о Service Discovery
  - НЕ углубляться в K8s internals (отдельная заметка)

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Nothing
  - **Blocked By**: None (can start immediately, but logically in Wave 2)

  **References**:
  - `base/architecture/System Design/System Design.md:593-607` - Существующая секция Service Discovery - РАСШИРИТЬ после неё
  - `base/architecture/System Design/System Design.md:446-487` - Секция балансировки - связать с discovery

  **Acceptance Criteria**:
  - [ ] Существующий текст Service Discovery НЕ изменён
  - [ ] Добавлены etcd и Zookeeper с описанием
  - [ ] Сравнительная таблица инструментов discovery с минимум 5 инструментами
  - [ ] Более подробное сравнение client-side vs server-side

  **QA Scenarios**:

  ```
  Scenario: Service Discovery расширен
    Tool: Bash (grep)
    Steps:
      1. grep -c "etcd" "base/architecture/System Design/System Design.md" → увеличилось (было только в KV БД)
      2. grep -c "Zookeeper" "base/architecture/System Design/System Design.md" → > 1 (было только в KV)
      3. grep -c "Consul" "base/architecture/System Design/System Design.md" → > 0
      4. grep -c "client-side discovery" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-5-service-discovery.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `docs(system-design): expand service discovery, observability, disaster recovery, data processing`
  - Files: `base/architecture/System Design/System Design.md`

- [x] 6. Расширение Observability (OpenTelemetry, Thanos/Cortex, Datadog)

  **What to do**:
  - Расширить секцию `## Observability` добавив новые подразделы ПОСЛЕ существующего контента (после алертинга, ~строка 2926):
  
  **6a. OpenTelemetry:**
  - Концепция: единый стандарт инструментирования для сбора трейсов, метрик и логов
  - Зачем: vendor lock-in mitigation, единый SDK вместо разных агентов (Prometheus + Jaeger + Fluentd)
  - Компоненты: OTel SDK, Collector, экспорт в разные бэкенды (Prometheus, Jaeger, Loki)
  - Callout `> [!success] OpenTelemetry стал индустриальным стандартом. Если стартуете новый проект - начинайте с OTel, а не с россыпи vendor-specific агентов.`
  
  **6b. Long-term storage для метрик:**
  - Thanos - расширение Prometheus для глобального view и долговременного хранения
  - Cortex / Mimir - horizontally scalable long-term storage для Prometheus
  - VictoriaMetrics (уже упомянут) - single-node и cluster варианты
  
  **6c. Managed решения:**
  - Таблица сравнения: Datadog, New Relic, Grafana Cloud vs self-hosted стек (Prometheus + Grafana + Loki + Jaeger)
  - Колонки: Решение | Тип | Плюсы | Минусы | Для кого

  **Must NOT do**:
  - НЕ переписывать существующие подразделы (метрики, трейсинг, логирование, алертинг)
  - НЕ удалять существующие упоминания Prometheus, Jaeger, ELK и т.д.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8)
  - **Blocks**: Nothing
  - **Blocked By**: None

  **References**:
  - `base/architecture/System Design/System Design.md:2822-2926` - Существующая секция Observability - ВСТАВИТЬ ПОСЛЕ алертинга
  - `base/architecture/System Design/System Design.md:2844-2853` - Основные метрики - НЕ трогать
  - `base/architecture/System Design/System Design.md:2854-2870` - Трейсинг (Jaeger/Zipkin) - НЕ переписывать
  - `base/architecture/System Design/System Design.md:2872-2888` - Логирование (ELK) - НЕ переписывать

  **Acceptance Criteria**:
  - [ ] Подраздел OpenTelemetry добавлен
  - [ ] Подраздел Long-term storage (Thanos/Cortex/Mimir) добавлен
  - [ ] Таблица сравнения managed vs self-hosted решений
  - [ ] Существующий Observability контент НЕ изменён

  **QA Scenarios**:

  ```
  Scenario: Observability расширен
    Tool: Bash (grep)
    Steps:
      1. grep -c "OpenTelemetry" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "Thanos" "base/architecture/System Design/System Design.md" → > 0
      3. grep -c "Datadog" "base/architecture/System Design/System Design.md" → > 0
      4. grep -c "Mimir" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-6-observability.txt
  ```

  **Commit**: YES (groups with Wave 2)

- [x] 7. Disaster Recovery (RPO/RTO, стратегии бэкапа)

  **What to do**:
  - Добавить новый раздел `### Disaster Recovery` ПОСЛЕ секции `## Распределённое хранение данных` (после строки ~2283, перед `## Паттерны и приёмы проектирования`)
  - Определить критические метрики:
    - RPO (Recovery Point Objective) - максимально допустимая потеря данных (время)
    - RTO (Recovery Time Objective) - максимально допустимое время восстановления
    - Визуальная связь: RPO = сколько данных потеряем, RTO = сколько времени будет недоступна система
  - Стратегии бэкапа:
    - Full backup - полная копия, требует больше места, быстрее восстановление
    - Incremental backup - только изменения с последнего бэкапа, мало места, долгое восстановление
    - Differential backup - изменения с последнего full бэкапа, баланс места и скорости
  - Стратегии восстановления:
    - Active-Active - обе ноды обслуживают трафик, нет downtime
    - Active-Passive - одна нода в hot standby, переключение при сбое
    - Pilot Light - минимальная версия всегда работает, масштабируется при сбое
  - Multi-region strategies: warm standby, hot standby
  - Таблица стратегий: Стратегия | RPO | RTO | Стоимость
  - Callout `> [!warning] Disaster Recovery нужно регулярно тестировать. План, который никогда не запускался, скорее всего не сработает в реальной аварии.`
  - Упомянуть инструменты: AWS Backup, Velero (K8s), pg_dump/pg_basebackup (PostgreSQL)

  **Must NOT do**:
  - НЕ переписывать существующие разделы о репликации (строки ~1744+)
  - НЕ углубляться в K8s backup (отдельная заметка)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 8)
  - **Blocks**: Nothing
  - **Blocked By**: None

  **References**:
  - `base/architecture/System Design/System Design.md:64-74` - Таблица доступности (SLA/SLO/SLI) - логично связать с RPO/RTO
  - `base/architecture/System Design/System Design.md:1744-1906` - Секция репликации - НЕ переписывать, но DR логически следует после

  **Acceptance Criteria**:
  - [ ] Раздел `### Disaster Recovery` добавлен после "Распределённое хранение данных"
  - [ ] Определены RPO и RTO
  - [ ] Описаны минимум 3 стратегии бэкапа
  - [ ] Описаны стратегии восстановления (Active-Active, Active-Passive, Pilot Light)
  - [ ] Сравнительная таблица
  - [ ] Callout с предупреждением о тестировании DR

  **QA Scenarios**:

  ```
  Scenario: Disaster Recovery добавлен
    Tool: Bash (grep)
    Steps:
      1. grep -c "Disaster Recovery" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "RPO" "base/architecture/System Design/System Design.md" → > 0
      3. grep -c "RTO" "base/architecture/System Design/System Design.md" → > 0
      4. grep -c "Active-Active" "base/architecture/System Design/System Design.md" → > 0
      5. grep -c "Pilot Light" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-7-disaster-recovery.txt
  ```

  **Commit**: YES (groups with Wave 2)

- [x] 8. Расширение Data Processing (Apache Beam, таблица сравнения)

  **What to do**:
  - Расширить существующую секцию `#### Lambda / Kappa архитектура` (строки ~2453-2479)
  - Добавить ПОСЛЕ существующего контента:
    - Apache Beam: унифицированная модель для batch и stream обработки (batch = runners: Spark, Flink, Dataflow)
    - Таблица сравнения инструментов потоковой и пакетной обработки:
      - Spark | Batch + Micro-batch | Зрелый, широкая экосистема | Высокая задержка для streaming
      - Flink | True Streaming + Batch | Низкая задержка, exactly-once | Сложная эксплуатация
      - Beam | Модель (не движок) | Пишешь один раз, запускаешь на любом runner | Abstraction overhead
      - Kafka Streams | Lightweight Streaming | Встроен в Kafka экосистему | Только streaming, нет batch
    - Kappa архитектура (если ещё не подробно описана) - уточнить, что Kappa упрощает Lambda, убирая batch layer и используя один потоковый движок

  **Must NOT do**:
  - НЕ переписывать существующее описание Lambda/Kappa
  - НЕ дублировать Spark и Flink (уже упомянуты строка 2461-2462)

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Nothing
  - **Blocked By**: None

  **References**:
  - `base/architecture/System Design/System Design.md:2453-2479` - Существующая секция Lambda/Kappa - РАСШИРИТЬ после неё
  - `base/architecture/System Design/System Design.md:2461-2462` - Spark и Flink уже упомянуты - НЕ дублировать

  **Acceptance Criteria**:
  - [ ] Apache Beam описан как унифицированная модель
  - [ ] Сравнительная таблица streaming/batch инструментов (Spark, Flink, Beam, Kafka Streams)
  - [ ] Существующее описание Lambda/Kappa НЕ изменено

  **QA Scenarios**:

  ```
  Scenario: Data Processing расширен
    Tool: Bash (grep)
    Steps:
      1. grep -c "Apache Beam" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "Kafka Streams" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-8-data-processing.txt
  ```

  **Commit**: YES (groups with Wave 2)

- [x] 9. Chaos Engineering

  **What to do**:
  - Добавить новый раздел `### Chaos Engineering` в секции `## Observability` (после алертинга и новых подразделов observability, ПЕРЕД секцией `## Методология проектирования`)
  - Описать концепцию: проактивное внесение контролируемых сбоев для проверки устойчивости системы
  - Принципы: начать с малого (blast radius), наблюдать в production (или staging), формировать гипотезы до эксперимента, автоматизировать
  - Типичные эксперименты: убить случайный под/ноду, добавить задержку сети, выключить зону доступности,重启ить БД
  - Инструменты: Chaos Monkey (Netflix), Gremlin (коммерческий), LitmusChaos (K8s-native), Chaos Mesh
  - Связь с существующей таблицей доступности (SLA) - chaos engineering подтверждает, что система действительно обеспечивает заявленный SLA
  - Callout `> [!important] Chaos Engineering не создаёт хаос. Он контролируемо выявляет слабые места до того, как они приведут к реальному сбою.`

  **Must NOT do**:
  - НЕ переписывать существующую секцию Observability
  - НЕ повторять содержание таблицы SLA/SLO/SLI

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Nothing
  - **Blocked By**: None (but logically after Wave 2)

  **References**:
  - `base/architecture/System Design/System Design.md:64-74` - Таблица SLA/SLO/SLI - связать с Chaos Engineering
  - `base/architecture/System Design/System Design.md:2909-2926` - Алертинг - Chaos Engineering логически после observability

  **Acceptance Criteria**:
  - [ ] Раздел `### Chaos Engineering` добавлен
  - [ ] Описаны принципы (blast radius, гипотезы)
  - [ ] Упомянуты Chaos Monkey, Gremlin, LitmusChaos
  - [ ] Callout с важным замечанием
  - [ ] Связь с SLA/SLO из существующей таблицы

  **QA Scenarios**:

  ```
  Scenario: Chaos Engineering добавлен
    Tool: Bash (grep)
    Steps:
      1. grep -c "Chaos Engineering" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "Chaos Monkey" "base/architecture/System Design/System Design.md" → > 0
      3. grep -c "Gremlin" "base/architecture/System Design/System Design.md" → > 0
      4. grep -c "LitmusChaos" "base/architecture/System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-9-chaos-engineering.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `docs(system-design): add chaos engineering, IaC and gitops`

  - [x] 10. Infrastructure as Code + GitOps

  **What to do**:
  - Добавить новый раздел `### Infrastructure as Code` в конце заметки, ПЕРЕД `## Дизайн популярных систем`
  - IaC концепция: управление инфраструктурой через код, а не через ручные действия в консоли
  - Подходы: declarative (Terraform, Pulumi) vs imperative (Ansible, Chef)
  - Таблица инструментов: Инструмент | Подход | Язык | Ключевая особенность
    - Terraform | Declarative | HCL | Самый популярный, огромное количество провайдеров
    - Pulumi | Declarative | Python/Go/TS | Реальный код вместо DSL
    - Ansible | Imperative | YAML | Configuration Management, простота
    - Crossplane | Declarative | YAML | K8s-native IaC
  - GitOps раздел как подраздел:
    - Концепция: Git как single source of truth для инфраструктуры и деплоя
    - Инструменты: ArgoCD, Flux
    - Как работает: push в Git → controller видит diff → применяет изменения к кластеру
    - Callout `> [!info] GitOps не заменяет IaC, а дополняет. Terraform создаёт инфраструктуру, ArgoCD деплоит приложение в кластер.`

  **Must NOT do**:
  - НЕ углубляться в K8s манифесты и операторы
  - НЕ создавать отдельную заметку

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`knowledge-writer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: Nothing
  - **Blocked By**: None

  **References**:
  - `base/architecture/System Design/System Design.md:3152-3168` - Секция "Дизайн популярных систем" - вставить ПЕРЕД ней
  - CLAUDE.md - правила стиля

  **Acceptance Criteria**:
  - [ ] Раздел `### Infrastructure as Code` добавлен
  - [ ] Подраздел GitOps с ArgoCD и Flux
  - [ ] Сравнительная таблица IaC инструментов с минимум 4 инструментами
  - [ ] Callout с связью IaC и GitOps

  **QA Scenarios**:

  ```
  Scenario: IaC + GitOps добавлены
    Tool: Bash (grep)
    Steps:
      1. grep -c "Infrastructure as Code" "base/architecture/System Design/System Design.md" → > 0
      2. grep -c "Terraform" "base/architecture/System Design/System Design.md" → > 0
      3. grep -c "ArgoCD" "base/architecture/System Design/System Design.md" → > 0
      4. grep -c "GitOps" "base/architecture/System Design/System Design.md" → > 0
      5. grep -c "Pulumi" "base/architecture System Design/System Design.md" → > 0
    Expected Result: Все grep > 0
    Evidence: .sisyphus/evidence/task-10-iac-gitops.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `docs(system-design): add chaos engineering, IaC and gitops`

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle` — APPROVE (11/11 Must Have)
  Read the plan end-to-end. Verify every "Must Have" is implemented. Verify no existing content was rewritten. Check evidence files exist in `.sisyphus/evidence/`.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Content Quality Review** — `unspecified-high` — APPROVE (стиль консистентен, русский корректен)
  Review all added sections for: Russian language correctness, consistent terminology with rest of note, accuracy of technical claims, no em-dash or double dash, minimal bold usage, proper Obsidian callout format. Compare style against 3 random existing sections.
  Output: `Style [CONSISTENT/INCONSISTENT] | Accuracy [N/N claims verified] | Russian [CORRECT/ISSUES] | VERDICT`

- [x] F3. **Build + Style Verification** — `unspecified-high` — APPROVE (em-dash=0, double-dash=0, все разделы найдены)
  Run `npx quartz build -d base` and verify no errors. Use grep to verify no em-dash (—) or double dash (--) in added content. Verify all section headers use proper `###` or `####` levels. Check that no existing content was modified (use git diff to show only additions).
  Output: `Build [PASS/FAIL] | Em-dash [NONE/FOUND] | Structure [CORRECT/BROKEN] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep` — APPROVE (0 удалений, нет дублирования, нет расширения K8s)
  For each task: read "What to do", verify only additions were made (no rewrites of existing). Check NO K8s expansion, NO Rate Limiting duplication, NO deployment strategy duplication. Verify all 10 additions are present.
  Output: `Tasks [N/N compliant] | Duplications [NONE/FOUND] | VERDICT`

---

## Commit Strategy

- **Single commit**: `docs(system-design): add WAF, zero trust, secrets mgmt, disaster recovery, chaos engineering, IaC and more`
- Files: `base/architecture/System Design/System Design.md`
- Pre-commit: `npx quartz build -d base`

---

## Success Criteria

### Verification Commands
```bash
# Build verification
npx quartz build -d base  # Expected: successful build, no errors

# No em-dash or double dash in added content
grep -n — "base/architecture/System Design/System Design.md"  # Expected: no results
grep -n -- "base/architecture/System Design/System Design.md"  # Expected: no double-dash in prose (only in flags/paths)

# All new sections present
grep -c "WAF" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "Zero Trust" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "Secrets Management" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "Disaster Recovery" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "Feature Flag" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "Chaos Engineering" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "Infrastructure as Code" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "OpenTelemetry" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "HAProxy" "base/architecture/System Design/System Design.md"  # Expected: > 0
grep -c "RPO" "base/architecture/System Design/System Design.md"  # Expected: > 0
```

### Final Checklist
- [ ] Все "Must Have" присутствуют
- [ ] Все "Must NOT Have" отсутствуют
- [ ] Стиль соответствует существующему
- [ ] Build проходит без ошибок