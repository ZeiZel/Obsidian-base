---
tags:
  - devops
  - gitops
  - argocd
  - kubernetes
title: ArgoCD и GitOps
---

## Концепция GitOps

GitOps - операционная модель для Kubernetes, где Git-репозиторий выступает единственным источником истины для декларативного описания инфраструктуры и приложений.

Принципы GitOps:

- Декларативность - система описана в виде YAML/JSON манифестов, а не набором императивных скриптов
- Версионирование - желаемое состояние хранится в Git с полной историей изменений и возможностью отката
- Автоматическое применение - одобренные изменения применяются к инфраструктуре без ручного вмешательства
- Непрерывная сверка - агент постоянно сравнивает текущее состояние кластера с желаемым и устраняет расхождения

> [!important]
> GitOps превращает операционные задачи в задачи разработки. Вместо `kubectl apply` инженер делает Pull Request, проходит code review и merge. Откат - это `git revert`.

### Push-based vs Pull-based

В push-модели CI-система после сборки образа выполняет деплой напрямую в кластер. Проблемы: CI нуждается в credentials к кластеру, нет механизма обнаружения drift, нет автоматической сверки.

В pull-модели агент внутри кластера отслеживает Git-репозиторий и самостоятельно применяет изменения. CI только собирает образы и обновляет манифесты в Git. Кластер не требует входящих соединений.

```
Push-based:
  Developer → Git Push → CI Build → CI Deploy → Cluster
  (CI имеет credentials к кластеру)

Pull-based:
  Developer → Git Push → CI Build → Update manifests in Git
  ArgoCD Agent (in cluster) → Watch Git → Apply changes
  (кластер сам забирает изменения)
```

### Drift Detection

**Drift** - расхождение между желаемым состоянием в Git и фактическим состоянием кластера. Причины: ручные изменения через `kubectl edit`, внешние контроллеры, сбои при применении манифестов. GitOps-контроллер обнаруживает drift и автоматически восстанавливает желаемое состояние.

---

## Архитектура ArgoCD

ArgoCD - декларативный GitOps-контроллер для Kubernetes, реализующий pull-based модель непрерывной доставки.

Компоненты:

- API Server - gRPC/REST-сервер для Web UI, CLI и автоматизации. Управляет аутентификацией, RBAC, webhook-событиями
- Repo Server - сервис без состояния для клонирования Git-репозиториев и генерации манифестов из Helm, Kustomize, Jsonnet, plain YAML
- Application Controller - reconciliation loop, сравнивающий текущее состояние кластера с желаемым из Git
- Redis - кэш состояния приложений и результатов Repo Server
- Dex - встроенный OIDC-провайдер для интеграции с LDAP, SAML, GitHub, GitLab, Google
- ApplicationSet Controller - автогенерация Application-ресурсов по шаблонам и генераторам
- Notifications Controller - уведомления о событиях жизненного цикла приложений

```
┌─────────────────────────────────────────────┐
│              Kubernetes Cluster              │
│                                              │
│  ┌──────────┐ ┌───────────┐ ┌─────────────┐ │
│  │ API      │←│ Repo      │←│ Application │ │
│  │ Server   │→│ Server    │→│ Controller  │ │
│  └────┬─────┘ └─────┬─────┘ └──────┬──────┘ │
│  ┌────┴─────┐ ┌─────┴─────┐ ┌──────┴──────┐ │
│  │ Dex      │ │ Redis     │ │ K8s API     │ │
│  └──────────┘ └───────────┘ └─────────────┘ │
│                     ↑                        │
│               ┌─────┴─────┐                  │
│               │ Git Repo  │                  │
│               └───────────┘                  │
└─────────────────────────────────────────────┘
```

---

## Установка

### Helm Chart

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

helm install argocd argo/argo-cd \
  --namespace argocd --create-namespace \
  -f values.yaml --version 7.7.x
```

```yaml
# values.yaml - production
configs:
  params:
    server.insecure: false
    reposerver.parallelism.limit: 10
  cm:
    timeout.reconciliation: 180s
  rbac:
    policy.csv: |
      p, role:developer, applications, get, */*, allow
      p, role:developer, applications, sync, */*, allow
      g, dev-team, role:developer

server:
  replicas: 2
  ingress:
    enabled: true
    ingressClassName: nginx
    hosts: [argocd.example.com]
    tls:
      - secretName: argocd-tls
        hosts: [argocd.example.com]

controller:
  resources:
    requests: { cpu: 500m, memory: 512Mi }
    limits: { cpu: "2", memory: 2Gi }

repoServer:
  replicas: 2
  resources:
    requests: { cpu: 250m, memory: 256Mi }
    limits: { cpu: "1", memory: 1Gi }
```

### HA vs Non-HA

Non-HA подходит для dev/staging - один инстанс каждого компонента, минимальные ресурсы.

HA для production: API Server и Repo Server масштабируются горизонтально, Application Controller работает с leader election, Redis заменяется на Redis HA с sentinel.

```bash
# HA-установка через kustomize
kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/ha/install.yaml

# Получение начального пароля
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Вход и смена пароля
argocd login argocd.example.com --grpc-web
argocd account update-password
kubectl -n argocd delete secret argocd-initial-admin-secret
```

---

## Application CRD

Application - основной ресурс ArgoCD, связывающий Git-источник с целевым кластером.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/org/k8s-manifests.git
    targetRevision: main
    path: apps/myapp/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - ServerSideApply=true
    retry:
      limit: 5
      backoff: { duration: 5s, factor: 2, maxDuration: 3m }
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers: [/spec/replicas]
```

Для Helm-чартов source выглядит иначе:

```yaml
source:
  repoURL: https://charts.example.com
  chart: myapp
  targetRevision: 1.2.3
  helm:
    releaseName: myapp
    valueFiles: [values-production.yaml]
    parameters:
      - name: image.tag
        value: "v1.5.0"
```

Multiple Sources позволяют разделить Helm-чарт и values по разным репозиториям:

```yaml
sources:
  - repoURL: https://charts.example.com
    chart: myapp
    targetRevision: 1.2.3
    helm:
      valueFiles:
        - $values/apps/myapp/values-production.yaml
  - repoURL: https://github.com/org/config-repo.git
    targetRevision: main
    ref: values
```

---

## Sync Strategies

### Automated Sync

- `selfHeal: true` - ручные изменения в кластере будут откачены к желаемому состоянию
- `prune: true` - ресурсы, удалённые из Git, удаляются из кластера
- `allowEmpty: false` - защита от случайного удаления всех ресурсов

> [!important]
> Для production включайте `selfHeal` и `prune` только после стабилизации приложения. На начальном этапе используйте ручную синхронизацию.

### Sync Waves

Управляют порядком применения ресурсов. Меньший номер wave применяется первым:

```yaml
# wave 0 - Namespace, ConfigMap (по умолчанию)
# wave 1 - Secrets, PVC
# wave 2 - Database Deployment
# wave 3 - Application Deployment
# wave 4 - Ingress

metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "2"
```

### Sync Hooks

Хуки выполняют действия на определённых этапах синхронизации:

| Hook | Когда | Пример |
|------|-------|--------|
| PreSync | Перед синхронизацией | Миграции БД, бэкапы |
| Sync | Во время синхронизации | Параллельно с основными ресурсами |
| PostSync | После успешной синхронизации | Smoke tests, уведомления |
| SyncFail | При ошибке | Оповещение, rollback |

```yaml
# PreSync - миграция БД
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: myapp:v1.5.0
          command: ["./migrate", "up"]
      restartPolicy: Never
  backoffLimit: 3
```

Политики удаления: `BeforeHookCreation` - удалить предыдущий перед созданием нового, `HookSucceeded` - удалить после успеха, `HookFailed` - удалить после неудачи.

---

## Health Checks

ArgoCD автоматически определяет здоровье стандартных ресурсов: Deployment, StatefulSet, DaemonSet, Ingress, Service, PVC.

Статусы: Healthy, Progressing, Degraded, Suspended, Missing, Unknown.

### Custom Health Checks

Для CRD определяются пользовательские проверки на Lua в ConfigMap `argocd-cm`:

```yaml
data:
  resource.customizations.health.cert-manager.io_Certificate: |
    hs = {}
    if obj.status ~= nil and obj.status.conditions ~= nil then
      for _, condition in ipairs(obj.status.conditions) do
        if condition.type == "Ready" and condition.status == "True" then
          hs.status = "Healthy"
          hs.message = "Certificate is ready"
          return hs
        end
        if condition.type == "Ready" and condition.status == "False" then
          hs.status = "Degraded"
          hs.message = condition.message
          return hs
        end
      end
    end
    hs.status = "Progressing"
    hs.message = "Waiting for certificate"
    return hs
```

---

## App of Apps Pattern

Корневой Application указывает на директорию с манифестами дочерних Application:

```
gitops-repo/
├── bootstrap/
│   └── root-app.yaml        # Создаётся вручную
├── apps/
│   ├── myapp.yaml            # Application для myapp
│   ├── redis.yaml
│   └── monitoring.yaml
└── manifests/
    ├── myapp/
    ├── redis/
    └── monitoring/
```

```yaml
# bootstrap/root-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/gitops-repo.git
    targetRevision: main
    path: apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated: { selfHeal: true, prune: true }
```

> [!info]
> Finalizer `resources-finalizer.argocd.argoproj.io` на дочерних Application обеспечивает каскадное удаление при удалении корневого приложения.

---

## ApplicationSet

ApplicationSet автоматизирует создание Application на основе шаблонов и генераторов.

### Git Directory Generator

Создаёт Application для каждой директории:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: microservices
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/org/gitops-repo.git
        revision: main
        directories:
          - path: "apps/*"
          - path: "apps/experimental-*"
            exclude: true
  template:
    metadata:
      name: "{{path.basename}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/org/gitops-repo.git
        targetRevision: main
        path: "{{path}}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{path.basename}}"
      syncPolicy:
        automated: { selfHeal: true, prune: true }
        syncOptions: [CreateNamespace=true]
```

### Git File Generator

Создаёт Application на основе JSON/YAML-файлов в репозитории. Каждый файл содержит параметры конкретного деплоя.

### Cluster Generator

Создаёт Application для каждого зарегистрированного кластера по label selector:

```yaml
generators:
  - clusters:
      selector:
        matchLabels:
          env: production
```

### Matrix Generator

Декартово произведение нескольких генераторов - например, все сервисы на все production-кластеры:

```yaml
generators:
  - matrix:
      generators:
        - git:
            repoURL: https://github.com/org/gitops-repo.git
            revision: main
            directories: [{ path: "apps/*" }]
        - clusters:
            selector:
              matchLabels: { env: production }
```

### Pull Request Generator

Создаёт preview-окружения для открытых PR:

```yaml
generators:
  - pullRequest:
      github:
        owner: org
        repo: myapp
        tokenRef: { secretName: github-token, key: token }
        labels: [preview]
      requeueAfterSeconds: 60
template:
  metadata:
    name: "preview-{{branch_slug}}"
  spec:
    project: previews
    source:
      repoURL: https://github.com/org/myapp.git
      targetRevision: "{{head_sha}}"
      path: k8s/preview
    destination:
      server: https://kubernetes.default.svc
      namespace: "preview-pr-{{number}}"
    syncPolicy:
      automated: { selfHeal: true, prune: true }
      syncOptions: [CreateNamespace=true]
```

Также доступны Merge Generator для объединения с переопределением и List Generator для статического списка параметров.

---

## Projects (AppProject)

AppProject обеспечивает мультитенантность, ограничивая доступ к репозиториям, кластерам и namespace:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: backend
  namespace: argocd
spec:
  sourceRepos:
    - "https://github.com/org/backend-*"
    - "https://charts.example.com"
  destinations:
    - server: https://kubernetes.default.svc
      namespace: "backend-*"
    - server: https://kubernetes.default.svc
      namespace: production
  clusterResourceWhitelist:
    - group: ""
      kind: Namespace
  namespaceResourceBlacklist:
    - group: ""
      kind: ResourceQuota
  roles:
    - name: developer
      policies:
        - p, proj:backend:developer, applications, get, backend/*, allow
        - p, proj:backend:developer, applications, sync, backend/*, allow
      groups: [backend-developers]
  syncWindows:
    - kind: allow
      schedule: "0 8-18 * * 1-5"
      duration: 10h
      applications: ["*"]
      timeZone: "Europe/Moscow"
    - kind: deny
      schedule: "0 0 25 12 *"
      duration: 48h
      applications: ["*"]
```

> [!info]
> Sync Windows задают временные окна для синхронизации. `allow` разрешает sync только в указанное время, `deny` запрещает в указанный период.

---

## RBAC и SSO

### Встроенный RBAC

ArgoCD использует Casbin-модель. Политики задаются в ConfigMap `argocd-rbac-cm`:

```yaml
data:
  policy.default: role:readonly
  scopes: "[groups, email]"
  policy.csv: |
    p, role:readonly, applications, get, */*, allow
    p, role:readonly, logs, get, */*, allow
    p, role:developer, applications, get, */*, allow
    p, role:developer, applications, sync, */*, allow
    p, role:developer, exec, create, */*, allow
    p, role:admin, *, *, */*, allow
    g, platform-team, role:admin
    g, backend-team, role:developer
```

### OIDC и Dex

Прямая OIDC-конфигурация в `argocd-cm`:

```yaml
data:
  oidc.config: |
    name: Keycloak
    issuer: https://keycloak.example.com/realms/argocd
    clientID: argocd
    clientSecret: $oidc.keycloak.clientSecret
    requestedScopes: [openid, profile, email, groups]
```

Dex-коннекторы для GitHub, LDAP и других провайдеров:

```yaml
data:
  dex.config: |
    connectors:
      - type: github
        id: github
        name: GitHub
        config:
          clientID: $dex.github.clientID
          clientSecret: $dex.github.clientSecret
          orgs:
            - name: my-org
              teams: [platform, backend]
      - type: ldap
        id: ldap
        name: LDAP
        config:
          host: ldap.example.com:636
          bindDN: cn=admin,dc=example,dc=com
          bindPW: $dex.ldap.bindPW
          userSearch:
            baseDN: ou=users,dc=example,dc=com
            username: uid
          groupSearch:
            baseDN: ou=groups,dc=example,dc=com
```

---

## Multi-cluster Management

ArgoCD управляет приложениями в нескольких кластерах из одной инсталляции.

```bash
# Добавление через CLI
argocd cluster add production-cluster \
  --name production --label env=production

# Или через Secret
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: production-cluster
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: cluster
stringData:
  name: production
  server: https://production.k8s.example.com
  config: |
    {
      "bearerToken": "<service-account-token>",
      "tlsClientConfig": {
        "insecure": false,
        "caData": "<base64-ca-cert>"
      }
    }
```

> [!important]
> В production ограничьте права ServiceAccount минимально необходимым набором вместо полного cluster-admin.

---

## Secrets Management

ArgoCD не управляет секретами напрямую. Основные подходы:

### External Secrets Operator (ESO)

Синхронизирует секреты из внешних хранилищ в Kubernetes:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "argocd"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secrets
spec:
  refreshInterval: 1h
  secretStoreRef: { name: vault-backend, kind: SecretStore }
  target:
    name: myapp-secrets
    template:
      data:
        DATABASE_URL: "postgresql://{{ .db_user }}:{{ .db_pass }}@postgres:5432/myapp"
  data:
    - secretKey: db_user
      remoteRef: { key: myapp/database, property: username }
    - secretKey: db_pass
      remoteRef: { key: myapp/database, property: password }
```

### Sealed Secrets

Bitnami Sealed Secrets хранят зашифрованные секреты прямо в Git:

```bash
kubeseal --controller-name=sealed-secrets \
  --controller-namespace=kube-system \
  --format yaml < secret.yaml > sealed-secret.yaml
```

### ArgoCD Vault Plugin (AVP)

Подставляет значения из Vault/AWS Secrets Manager прямо в манифесты через плейсхолдеры:

```yaml
apiVersion: v1
kind: Secret
metadata:
  annotations:
    avp.kubernetes.io/path: "secret/data/myapp"
stringData:
  DATABASE_URL: <db_url>
  API_KEY: <api_key>
```

### SOPS

Mozilla SOPS шифрует значения с помощью age, PGP или cloud KMS. Интеграция с ArgoCD через KSOPS - kustomize plugin.

---

## Notifications

ArgoCD Notifications отправляет уведомления о событиях через Slack, email, webhook.

```yaml
# argocd-notifications-cm
data:
  service.slack: |
    token: $slack-token

  template.app-deployed: |
    slack:
      attachments: |
        [{"color":"#18be52","title":"{{.app.metadata.name}} deployed",
          "fields":[
            {"title":"Revision","value":"{{.app.status.sync.revision | trunc 7}}","short":true},
            {"title":"Namespace","value":"{{.app.spec.destination.namespace}}","short":true}
          ]}]

  template.app-sync-failed: |
    slack:
      attachments: |
        [{"color":"#E96D76","title":"{{.app.metadata.name}} - Sync Failed",
          "text":"{{.app.status.operationState.message}}"}]

  trigger.on-deployed: |
    - send: [app-deployed]
      when: app.status.operationState.phase in ['Succeeded'] and
            app.status.health.status == 'Healthy'

  trigger.on-sync-failed: |
    - send: [app-sync-failed]
      when: app.status.operationState.phase in ['Error', 'Failed']
```

Подписка через аннотации Application:

```yaml
annotations:
  notifications.argoproj.io/subscribe.on-deployed.slack: "#deploys"
  notifications.argoproj.io/subscribe.on-sync-failed.slack: "#alerts"
```

---

## Image Updater

ArgoCD Image Updater автоматически обновляет теги образов, отслеживая container registry.

```yaml
annotations:
  argocd-image-updater.argoproj.io/image-list: myapp=ghcr.io/org/myapp
  argocd-image-updater.argoproj.io/myapp.update-strategy: semver
  argocd-image-updater.argoproj.io/myapp.allow-tags: "regexp:^v[0-9]+\\.[0-9]+\\.[0-9]+$"
  argocd-image-updater.argoproj.io/write-back-method: git:secret:argocd/git-creds
  argocd-image-updater.argoproj.io/write-back-target: kustomization
```

Стратегии обновления:

| Стратегия | Описание |
|-----------|----------|
| semver | Наибольшая semver-версия: v1.2.3 → v1.3.0 |
| latest | Самый новый образ по дате создания |
| digest | Новый digest для того же тега |
| name | Сортировка по имени тега: build-100 → build-101 |

---

## Argo Rollouts

Контроллер прогрессивной доставки, расширяющий стандартный Deployment.

### Blue-Green

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: myapp
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: myapp-active
      previewService: myapp-preview
      autoPromotionEnabled: false
      autoPromotionSeconds: 300
      prePromotionAnalysis:
        templates: [{ templateName: smoke-test }]
      postPromotionAnalysis:
        templates: [{ templateName: success-rate }]
  template:
    spec:
      containers:
        - name: myapp
          image: ghcr.io/org/myapp:v1.5.0
          ports: [{ containerPort: 8080 }]
          resources:
            requests: { cpu: 200m, memory: 256Mi }
            limits: { cpu: "1", memory: 512Mi }
```

### Canary

```yaml
strategy:
  canary:
    canaryService: myapp-canary
    stableService: myapp-stable
    trafficRouting:
      nginx:
        stableIngress: myapp-ingress
    steps:
      - setWeight: 10
      - analysis:
          templates: [{ templateName: success-rate }]
      - pause: { duration: 5m }
      - setWeight: 30
      - pause: { duration: 5m }
      - setWeight: 50
      - analysis:
          templates: [{ templateName: latency-check }, { templateName: error-rate }]
      - pause: { duration: 10m }
      - setWeight: 80
      - pause: { duration: 5m }
      - setWeight: 100
```

### Analysis Templates

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 60s
      count: 5
      successCondition: result[0] >= 0.95
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service-name}}",status=~"2.."}[5m]))
            / sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
```

```bash
# Управление через CLI
kubectl argo rollouts status myapp -n production
kubectl argo rollouts promote myapp -n production
kubectl argo rollouts abort myapp -n production
kubectl argo rollouts undo myapp -n production
```

---

## Best Practices

### Структура репозитория

Monorepo - все манифесты в одном репозитории:

```
gitops-repo/
├── apps/                     # App definitions
├── infrastructure/           # cert-manager, ingress, monitoring
├── services/
│   └── myapp/
│       ├── base/             # deployment, service, hpa, pdb
│       └── overlays/
│           ├── dev/
│           ├── staging/
│           └── production/
├── projects/                 # AppProject definitions
└── clusters/                 # Cluster-specific config
```

Poly-repo - отдельные репозитории для инфраструктуры и команд. Масштабируется лучше при независимых командах.

> [!summary]
> Monorepo проще для небольших команд, обеспечивает единый обзор. Poly-repo масштабируется для больших организаций с разными уровнями доступа.

### Environment Promotion

```bash
# Kustomize overlays - обновить image tag в каждом overlay
cd services/myapp/overlays/dev
kustomize edit set image myapp=ghcr.io/org/myapp:v1.5.0

# После проверки в dev - продвинуть в staging и production через PR
```

### Рекомендации

- Никогда не храните незашифрованные секреты в Git
- Используйте ApplicationSet вместо ручного создания Application
- Настройте resource exclusions для ресурсов, которые ArgoCD не должен отслеживать
- Включите audit logging для отслеживания изменений
- Увеличьте реплики Repo Server при большом количестве приложений
- Ограничивайте reconciliation interval для снижения нагрузки

---

## Сравнение ArgoCD vs FluxCD

| Критерий | ArgoCD | FluxCD |
|----------|--------|--------|
| Архитектура | Централизованный сервер с UI | Распределённые контроллеры |
| Web UI | Встроенный полнофункциональный | Нет, нужен Weave GitOps |
| Multi-cluster | Нативная поддержка из одной инсталляции | Свой Flux в каждом кластере |
| RBAC | Встроенный Dex, гибкий RBAC | Через Kubernetes RBAC |
| Helm | Template рендеринг на стороне сервера | Нативный Helm install |
| ApplicationSet | Мощные генераторы | Kustomization с зависимостями |
| Progressive delivery | Argo Rollouts | Flagger |
| Image automation | argocd-image-updater | Image reflector + automation |
| Сложность | Средняя, UI упрощает работу | Низкая, минималистичный подход |

> [!info]
> ArgoCD лучше при необходимости визуального контроля, централизованного управления множеством кластеров и сложного RBAC. FluxCD предпочтительнее для минималистичного GitOps без централизованного сервера.

---

## Практический пример: GitOps workflow для микросервисов

### Структура

```
# Код сервиса (per service)
org/user-service/
├── src/
├── Dockerfile
└── .github/workflows/ci.yaml

# GitOps-репозиторий (общий)
org/gitops-platform/
├── bootstrap/root.yaml
├── projects/
├── apps/
│   ├── api-gateway.yaml
│   ├── user-service.yaml
│   └── order-service.yaml
└── services/
    ├── api-gateway/
    │   ├── base/
    │   └── overlays/{dev,staging,production}/
    ├── user-service/
    └── order-service/
```

### CI Pipeline

```yaml
# org/user-service/.github/workflows/ci.yaml
name: CI
on:
  push:
    branches: [main]
    tags: ["v*"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make test

  build-push:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/org/user-service:${{ github.sha }}
          cache-from: type=gha

  update-gitops:
    needs: build-push
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: org/gitops-platform
          token: ${{ secrets.GITOPS_TOKEN }}
      - run: |
          cd services/user-service/overlays/dev
          kustomize edit set image user-service=ghcr.io/org/user-service:${GITHUB_REF_NAME}
          git add . && git commit -m "deploy user-service ${GITHUB_REF_NAME} to dev"
          git push
```

### Полный цикл деплоя

```
1. Разработчик мерджит PR в user-service
   → CI собирает Docker-образ, пушит в registry

2. Разработчик создаёт тег v1.5.0
   → CI обновляет image tag в gitops-platform (dev overlay)
   → ArgoCD автоматически синхронизирует dev

3. После проверки в dev
   → Инженер создаёт PR в gitops-platform для staging/production overlays
   → Code review, merge

4. ArgoCD в production
   → PreSync: миграция БД
   → Sync: обновление Deployment
   → PostSync: smoke tests
   → Notification в Slack

5. При drift или деградации
   → ArgoCD self-heal восстанавливает состояние
   → Alert в Slack через Notifications
```

Альтернативный путь с Image Updater: CI собирает образ с semver-тегом, Image Updater обнаруживает новый тег и коммитит обновление в gitops-repo, ArgoCD синхронизирует.

> [!summary]
> GitOps с ArgoCD обеспечивает полную аудируемость через Git-историю, автоматическое обнаружение и устранение drift, декларативное управление. Production-ready setup включает App of Apps или ApplicationSet, External Secrets Operator, Argo Rollouts для прогрессивной доставки, Notifications для информирования команды.
