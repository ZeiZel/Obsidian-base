---
tags:
  - devops
  - security
  - devsecops
title: DevSecOps
---

## Концепция DevSecOps

Традиционный подход к безопасности подразумевает проверку на финальных этапах разработки. Команда security проводит аудит перед релизом, находит уязвимости, и разработка откатывается на недели назад. DevSecOps меняет этот подход радикально.

**Shift Left** - принцип переноса проверок безопасности на максимально ранние этапы. Вместо аудита перед продакшеном безопасность встраивается в каждый шаг - от написания кода до деплоя.

Ключевые принципы:

- Security as Code - политики безопасности описываются декларативно, версионируются в git, проходят code review
- Автоматизация - ручные проверки заменяются автоматическими сканерами в CI/CD
- Shared responsibility - безопасность становится ответственностью всей команды, а не отдельного отдела
- Continuous feedback - разработчик получает обратную связь о уязвимостях в течение минут, а не недель

> [!important]
> DevSecOps не добавляет новый этап в пайплайн. Он встраивает безопасность в каждый существующий этап: планирование, разработку, сборку, тестирование, деплой, мониторинг.

Типичная интеграция в CI/CD:

```
Commit → Pre-commit hooks (secrets scan) →
Build → SAST + Dependency scan →
Package → Image scan + SBOM →
Deploy → Policy check (OPA/Kyverno) →
Runtime → Falco + Audit logging
```

---

## Secrets Management

### HashiCorp Vault

Vault решает проблему хранения, доступа и ротации секретов в распределённых системах. Архитектура построена вокруг концепции sealed/unsealed состояния.

При инициализации Vault генерирует master key, который разделяется по алгоритму Shamir's Secret Sharing на N частей. Для расшифровки хранилища требуется M из N ключей. Пока Vault sealed, он не обрабатывает запросы.

```bash
# Инициализация с 5 ключами, порог расшифровки - 3
vault operator init -key-shares=5 -key-threshold=3

# Расшифровка (требуется 3 раза с разными ключами)
vault operator unseal <key-1>
vault operator unseal <key-2>
vault operator unseal <key-3>
```

Secrets Engines - подключаемые бэкенды для разных типов секретов:

- KV - хранилище пар ключ-значение с версионированием
- Database - динамическая генерация credentials для PostgreSQL, MySQL, MongoDB
- PKI - выпуск и управление TLS-сертификатами
- Transit - шифрование как сервис без хранения данных

```bash
# KV v2 - запись и чтение
vault secrets enable -path=secret kv-v2
vault kv put secret/myapp/database username="app_user" password="s3cur3-p@ss"
vault kv get secret/myapp/database

# Database engine - динамические credentials для PostgreSQL
vault secrets enable database
vault write database/config/postgres \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@db:5432/app" \
  allowed_roles="readonly" \
  username="vault_admin" password="vault_pass"

vault write database/roles/readonly \
  db_name=postgres \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" max_ttl="24h"
```

Auth Methods определяют, как клиент аутентифицируется в Vault:

```bash
# Kubernetes auth - под получает токен через ServiceAccount
vault auth enable kubernetes
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
vault write auth/kubernetes/role/myapp \
  bound_service_account_names=myapp \
  bound_service_account_namespaces=production \
  policies=myapp-policy ttl=1h

# AppRole auth - для CI/CD и автоматизации
vault auth enable approle
vault write auth/approle/role/ci-pipeline \
  secret_id_ttl=10m token_ttl=20m token_max_ttl=30m policies=ci-policy
```

Policies управляют доступом по принципу least privilege:

```hcl
# myapp-policy.hcl
path "secret/data/myapp/*" { capabilities = ["read"] }
path "database/creds/readonly" { capabilities = ["read"] }
path "pki/issue/myapp" { capabilities = ["create", "update"] }
path "secret/data/admin/*" { capabilities = ["deny"] }
```

Injection секретов в Kubernetes через Vault Agent Injector:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "myapp"
        vault.hashicorp.com/agent-inject-secret-db: "secret/data/myapp/database"
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "secret/data/myapp/database" -}}
          export DB_USER="{{ .Data.data.username }}"
          export DB_PASS="{{ .Data.data.password }}"
          {{- end }}
    spec:
      serviceAccountName: myapp
      containers:
        - name: myapp
          image: myapp:1.0.0
          command: ["sh", "-c", "source /vault/secrets/db && ./app"]
```

### External Secrets Operator

ESO синхронизирует секреты из внешних провайдеров в Kubernetes Secrets. Единый интерфейс для Vault, AWS Secrets Manager, GCP Secret Manager.

```yaml
# SecretStore - подключение к Vault
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: production
spec:
  provider:
    vault:
      server: "https://vault.internal:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "myapp"
          serviceAccountRef:
            name: myapp
---
# ExternalSecret - декларация нужного секрета
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-db-creds
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: myapp-db-secret
    creationPolicy: Owner
  data:
    - secretKey: username
      remoteRef:
        key: myapp/database
        property: username
    - secretKey: password
      remoteRef:
        key: myapp/database
        property: password
```

### Sealed Secrets

SealedSecret шифруется публичным ключом контроллера и расшифровывается только внутри кластера. Безопасно хранить в git.

```bash
# Установка контроллера
helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system

# Шифрование секрета
kubectl create secret generic myapp-secret \
  --from-literal=password=s3cret \
  --dry-run=client -o yaml | \
  kubeseal --format yaml > sealed-secret.yaml
# Контроллер автоматически ротирует ключи каждые 30 дней
```

### SOPS

SOPS шифрует значения в YAML/JSON, оставляя ключи в открытом виде. Видна структура секретов, но не содержимое.

```bash
sops --encrypt --age age1... secrets.yaml > secrets.enc.yaml
sops --decrypt secrets.enc.yaml
```

```yaml
# .sops.yaml - конфигурация шифрования по окружениям
creation_rules:
  - path_regex: production/.*\.yaml$
    age: age1...production-key...
  - path_regex: staging/.*\.yaml$
    age: age1...staging-key...
```

Интеграция с Helm через helm-secrets и с Kustomize через ksops:

```bash
helm plugin install https://github.com/jkroepke/helm-secrets
helm upgrade myapp ./chart -f values.yaml -f secrets://secrets.enc.yaml
```

---

## Container Security

### Image Scanning

Trivy - наиболее распространённый сканер, покрывающий уязвимости, секреты, misconfigurations и SBOM:

```bash
trivy image --severity HIGH,CRITICAL myapp:latest
trivy fs --security-checks vuln,secret,misconfig .
trivy config --severity HIGH,CRITICAL ./k8s/
trivy image --format spdx-json --output sbom.json myapp:latest
trivy image --ignorefile .trivyignore myapp:latest
```

Grype как альтернатива с поддержкой SBOM-based сканирования:

```bash
grype myapp:latest --fail-on high
syft myapp:latest -o spdx-json > sbom.json
grype sbom:sbom.json
```

### Безопасные базовые образы

Выбор базового образа напрямую влияет на attack surface:

```dockerfile
FROM ubuntu:22.04                         # Плохо - полный дистрибутив
FROM alpine:3.19                          # Лучше - минимальный
FROM gcr.io/distroless/static-debian12    # Ещё лучше - без shell
FROM scratch                              # Идеально для Go/Rust
```

> [!info]
> Distroless-образы не содержат shell. Для отладки используйте debug-варианты: `gcr.io/distroless/static-debian12:debug`.

### Dockerfile Best Practices

```dockerfile
# === Build stage ===
FROM golang:1.22-alpine AS builder
RUN adduser -D -u 10001 appuser
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

# === Runtime stage ===
FROM gcr.io/distroless/static-debian12
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /app/server /server
USER 10001
EXPOSE 8080
ENTRYPOINT ["/server"]
```

Ключевые правила:

- Multi-stage builds - отделять сборку от runtime
- Копировать файлы зависимостей до исходного кода для кэширования слоёв
- Запускать от non-root пользователя
- Пиннить версии базовых образов
- Использовать `.dockerignore` для исключения лишнего
- Read-only root filesystem

---

## Kubernetes Security

### Pod Security Standards и Pod Security Admission

Kubernetes определяет три уровня безопасности: Privileged, Baseline, Restricted.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted
```

Под, соответствующий restricted-уровню:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: myapp:1.0.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

### OPA Gatekeeper

Gatekeeper определяет политики через ConstraintTemplate на языке Rego и Constraint для их применения:

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing required labels: %v", [missing])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
    namespaces: ["production"]
  parameters:
    labels: ["app", "team", "version"]
```

### Kyverno

Kyverno использует нативный Kubernetes YAML вместо Rego, что снижает порог входа. Поддерживает три типа правил: validate, mutate, generate.

```yaml
# Validate - запрет latest тега
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-image-tag
      match:
        any:
          - resources:
              kinds: ["Pod"]
      validate:
        message: "Image tag 'latest' is not allowed."
        pattern:
          spec:
            containers:
              - image: "!*:latest"
---
# Mutate - автоматическое добавление securityContext
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-security-context
spec:
  rules:
    - name: add-security-context
      match:
        any:
          - resources:
              kinds: ["Pod"]
      mutate:
        patchStrategicMerge:
          spec:
            securityContext:
              runAsNonRoot: true
              seccompProfile:
                type: RuntimeDefault
---
# Generate - default deny NetworkPolicy для каждого нового namespace
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: default-deny-network
spec:
  rules:
    - name: generate-default-deny
      match:
        any:
          - resources:
              kinds: ["Namespace"]
      generate:
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        name: default-deny-all
        namespace: "{{request.object.metadata.name}}"
        data:
          spec:
            podSelector: {}
            policyTypes: ["Ingress", "Egress"]
```

### Network Policies

```yaml
# Default deny all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes: ["Ingress", "Egress"]
---
# Разрешить ingress от frontend к backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: ["Ingress"]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
---
# Egress к DNS и PostgreSQL
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: ["Egress"]
  egress:
    - ports:
        - { protocol: UDP, port: 53 }
        - { protocol: TCP, port: 53 }
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - { protocol: TCP, port: 5432 }
```

Cilium Network Policies расширяют стандартные возможности L7-фильтрацией - можно ограничивать HTTP-методы и пути запросов.

### RBAC

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: staging
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec"]
    verbs: ["get", "create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: staging
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: developer
subjects:
  - kind: Group
    name: developers
    apiGroup: rbac.authorization.k8s.io
```

> [!important]
> Устанавливайте `automountServiceAccountToken: false` по умолчанию. Монтируйте токен явно только для подов, которым нужен доступ к Kubernetes API.

---

## CI/CD Security

### SAST

Semgrep - быстрый и расширяемый анализатор кода с поддержкой кастомных правил:

```bash
semgrep --config=p/security-audit --config=p/secrets --config=p/owasp-top-ten .
```

CodeQL для глубокого анализа через GitHub:

```bash
codeql database create mydb --language=go
codeql database analyze mydb --format=sarif-latest --output=results.sarif
```

### DAST

```bash
# OWASP ZAP - базовое сканирование
docker run -t zaproxy/zap-stable zap-baseline.py \
  -t https://staging.example.com -r report.html

# Nuclei - сканирование по шаблонам уязвимостей
nuclei -u https://staging.example.com \
  -t cves/ -t vulnerabilities/ -severity high,critical
```

### Dependency Scanning

Renovate автоматически обновляет зависимости и создаёт PR при обнаружении уязвимостей. Dependabot от GitHub выполняет аналогичную задачу. Snyk добавляет глубокий анализ транзитивных зависимостей.

### Secret Scanning

```bash
gitleaks detect --source=. --verbose --report-path=gitleaks-report.json
trufflehog git file://. --only-verified --json > trufflehog-report.json
```

Pre-commit hook для блокировки коммитов с секретами:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

### Container Scanning в Pipeline

```yaml
# GitHub Actions
- name: Scan image with Trivy
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    format: sarif
    output: trivy-results.sarif
    severity: CRITICAL,HIGH
    exit-code: "1"

- name: Upload scan results
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: trivy-results.sarif
  if: always()
```

---

## Supply Chain Security

### SBOM

**SBOM** - полный перечень компонентов, из которых состоит софт. Форматы - SPDX и CycloneDX.

```bash
syft myapp:latest -o spdx-json > sbom.spdx.json   # генерация через Syft
trivy image --format spdx-json --output sbom.json myapp:latest  # или Trivy
grype sbom:sbom.spdx.json                          # анализ на уязвимости
```

### Image Signing (Cosign/Sigstore)

Cosign подписывает образы, гарантируя целостность и происхождение:

```bash
cosign generate-key-pair
cosign sign --key cosign.key myregistry/myapp:1.0.0
cosign verify --key cosign.pub myregistry/myapp:1.0.0

# Keyless signing через Sigstore (рекомендуется) - OIDC идентификация
cosign sign myregistry/myapp:1.0.0
```

Проверка подписи при деплое через Kyverno:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
spec:
  validationFailureAction: Enforce
  rules:
    - name: check-signature
      match:
        any:
          - resources:
              kinds: ["Pod"]
      verifyImages:
        - imageReferences: ["myregistry/myapp:*"]
          attestors:
            - entries:
                - keys:
                    publicKeys: |-
                      -----BEGIN PUBLIC KEY-----
                      MFkwEwYHKoZIzj0CAQ...
                      -----END PUBLIC KEY-----
```

### SLSA Framework

SLSA определяет уровни зрелости supply chain security:

- Level 1 - сборка задокументирована, генерирует provenance
- Level 2 - сборка на hosted сервисе, provenance подписан
- Level 3 - изолированная сборка, полный контроль source и build

---

## Runtime Security

### Falco

Falco отслеживает поведение контейнеров в runtime через системные вызовы:

```yaml
- rule: Terminal Shell in Container
  desc: Detect shell opened in a container
  condition: >
    spawned_process and container and
    proc.name in (bash, sh, zsh) and
    not proc.pname in (cron, supervisord)
  output: >
    Shell opened (user=%user.name container=%container.name
    image=%container.image.repository shell=%proc.name)
  priority: WARNING
  tags: [container, shell]

- rule: Unexpected Outbound Connection
  desc: Detect outbound connections from restricted containers
  condition: >
    outbound and container and
    container.image.repository in (myregistry/worker) and
    not fd.sip in (10.0.0.0/8)
  output: >
    Unexpected outbound from %container.name to %fd.sip:%fd.sport
  priority: ERROR
  tags: [network, container]
```

Falcosidekick маршрутизирует алерты в Slack, PagerDuty, Prometheus и другие системы.

### Seccomp и AppArmor

Seccomp ограничивает системные вызовы, доступные процессу. AppArmor контролирует доступ к файловой системе и сети.

```yaml
# Применение seccomp в поде
spec:
  securityContext:
    seccompProfile:
      type: RuntimeDefault  # достаточно для большинства приложений
```

> [!summary]
> Для большинства приложений достаточно `RuntimeDefault` seccomp-профиля. Кастомные профили нужны при блокировке конкретных syscalls или разрешении отсутствующих в default-профиле.

---

## CIS Benchmarks и Compliance as Code

### kube-bench и Docker Bench

```bash
kube-bench run --targets master    # CIS Kubernetes Benchmark для мастер-нод
kube-bench run --targets node      # для worker-нод
kube-bench run --json --outputfile results.json  # JSON для автоматизации

# Docker Bench for Security
docker run --rm --net host --pid host --userns host --cap-add audit_control \
  -v /var/lib:/var/lib:ro -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /etc:/etc:ro docker/docker-bench-security
```

### Checkov, tfsec, Prowler

```bash
# Checkov - анализ IaC
checkov -d ./terraform/ --framework terraform
checkov -d ./k8s/ --framework kubernetes
checkov --file Dockerfile --framework dockerfile

# tfsec - Terraform-специфичный сканер
tfsec ./terraform/ --format sarif --out results.sarif

# Prowler - аудит AWS аккаунта
prowler aws --group cis_level1
prowler aws --security-hub --output-formats json-asff
```

---

## Практический пример: полный Security Pipeline

```yaml
name: Security Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: read
  security-events: write
  packages: write
  id-token: write

jobs:
  # Stage 1: Code Quality & Secrets
  pre-build-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Secret scanning
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: SAST with Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: "p/security-audit p/secrets p/owasp-top-ten"
      - name: Dependency vulnerability scan
        run: npm audit --audit-level=high

  # Stage 2: IaC Scanning
  iac-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: ./k8s/
          framework: kubernetes
      - name: Trivy IaC
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: config
          scan-ref: .
          severity: HIGH,CRITICAL

  # Stage 3: Build, Scan & Sign Image
  build-and-scan:
    runs-on: ubuntu-latest
    needs: [pre-build-checks, iac-scanning]
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: "1"
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: spdx-json
          output-file: sbom.spdx.json
      - uses: sigstore/cosign-installer@v3
      - name: Sign image (keyless)
        run: cosign sign --yes ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}
      - name: Attest SBOM
        run: |
          cosign attest --yes --predicate sbom.spdx.json --type spdxjson \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}

  # Stage 4: Deploy with Policy Check
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-scan
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v3
      - name: Verify signature before deploy
        run: |
          cosign verify \
            --certificate-identity-regexp="https://github.com/${{ github.repository }}/" \
            --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
      - name: Deploy
        run: |
          kubectl set image deployment/myapp \
            myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} -n staging
          kubectl rollout status deployment/myapp -n staging --timeout=5m
      - name: DAST scan
        run: |
          docker run --rm zaproxy/zap-stable zap-baseline.py \
            -t https://staging.example.com -J zap-report.json || true
      - name: Post-deploy verification
        run: curl -sf https://staging.example.com/health || exit 1
```

> [!summary]
> Полноценный security pipeline включает пять ключевых этапов: сканирование секретов и SAST до сборки, проверка IaC, сканирование и подпись образа, DAST на staging. Каждый этап блокирует пайплайн при критических проблемах. Supply chain security обеспечивается через SBOM и image signing.
