---
tags:
  - k8s
  - kubernetes
  - helm
  - helmfile
  - devops
---

## Кратко о Helmfile

**Helmfile** - декларативная обёртка над Helm для управления множеством релизов, окружений и секретов из единого репозитория.

Вместо ручного вызова `helm install/upgrade` для каждого чарта, helmfile позволяет описать весь стек в одном конфиге и деплоить его одной командой. Это Infrastructure as Code для Kubernetes-приложений.

---

## Зачем нужен Helmfile

Helm сам по себе управляет одним чартом. Когда в кластере десятки приложений с разными окружениями, начинаются проблемы:

- Для каждого приложения нужно помнить команды, флаги и порядок установки
- Values-файлы разбросаны по разным местам
- Секреты хранятся вне git, легко рассинхронизируются
- Нет единого обзора того, что задеплоено в кластер
- Зависимости между приложениями приходится отслеживать вручную

Helmfile решает всё это, предоставляя единую точку входа для описания, параметризации и деплоя всей инфраструктуры.

---

## Установка

```bash
# brew (macOS/Linux)
brew install helmfile

# вручную
wget -O ~/bin/helmfile https://github.com/helmfile/helmfile/releases/download/v1.1.7/helmfile_1.1.7_linux_amd64.tar.gz
chmod +x ~/bin/helmfile
```

Необходимые helm-плагины

```bash
helm plugin install https://github.com/databus23/helm-diff
helm plugin install https://github.com/jkroepke/helm-secrets
```

Или автоматическая инициализация

```bash
helmfile init --force
```

> [!info] Версии
> helm 3.19.0+, helmfile 1.1.7+, helm-diff 3.13.0+, helm-secrets 4.4.2+

---

## Основные команды

```bash
helmfile list                    # список всех релизов
helmfile apply                   # установка/обновление (идемпотентно)
helmfile sync                    # полная синхронизация
helmfile diff                    # различия между текущим и желаемым состоянием
helmfile destroy                 # удаление всех релизов
helmfile template                # рендер манифестов без деплоя
helmfile -e prod apply           # деплой конкретного окружения
helmfile -l name=redis sync      # обновить один релиз по лейблу
```

---

## Пример простой конфигурации

`helmfile.yaml`
```yaml
releases:
  - name: webapp
    namespace: default
    chart: ./charts/webapp
    version: "0.1.0"
    wait: true
    installed: true
  - name: backend
    namespace: default
    chart: ./charts/backend
    wait: true
  - name: database
    namespace: default
    chart: ./charts/database
    wait: true
```

Через `set` можно установить свои значения `values`

```yaml
  - name: backend
    namespace: default
    chart: ./backend
    wait: true
    set:
      - name: replicaCount
        value: 2
```

### Репозитории

Чарты из внешних репозиториев можно подключать через OCI-ссылку напрямую

```yaml
releases:
  - name: nginx
    namespace: default
    chart: oci://registry-1.docker.io/bitnamicharts/nginx
    version: "15.4.4"
    wait: true
    set:
      - name: service.type
        value: ClusterIP
```

Или через объявление репозитория

```yaml
repositories:
 - name: prometheus-community
   url: https://prometheus-community.github.io/helm-charts

releases:
- name: prom-norbac-ubuntu
  namespace: prometheus
  chart: prometheus-community/prometheus
  set:
  - name: rbac.create
    value: false
```

Определение OCI-репозитория

```yaml
repositories:
  - name: ocirepo
    url: registry-1.docker.io/bitnamicharts
    oci: true

releases:
  - name: nginx
    namespace: default
    chart: ocirepo/nginx
    version: 15.4.4
    wait: true
    set:
      - name: service.type
        value: ClusterIP
```

---

## Продвинутая структура проекта

Простой `helmfile.yaml` с перечислением релизов быстро перерастает в неуправляемый файл. Для production-окружений используется модульная структура с разделением ответственности.

Ниже - разбор реальной продакшен-конфигурации на базе репозитория [zzamzam-k8s](https://github.com/zam-zam/zzamzam-k8s), где helmfile управляет 20+ приложениями (ingress-nginx, cert-manager, postgresql, gitea, velero, wikijs, oauth2-proxy и т.д.).

### Файловая структура

```
.
├── helmfile.yaml                   # точка входа
├── .sops.yaml                      # конфигурация шифрования
├── .helmfile/
│   ├── environments.yaml.gotmpl   # шаблон окружений
│   ├── releases.yaml.gotmpl       # генерация релизов из apps
│   └── repositories.yaml          # helm-репозитории
├── apps/
│   └── _others.yaml               # реестр всех приложений
├── releases/
│   ├── _override.yaml.gotmpl      # механизм переопределения values
│   ├── ingress-nginx.yaml.gotmpl  # общие values для ingress-nginx
│   ├── cert-manager.yaml.gotmpl   # общие values для cert-manager
│   ├── velero.yaml.gotmpl         # общие values для velero
│   └── ...                        # по файлу на каждый релиз
├── envs/
│   └── k8s/                       # окружение "k8s"
│       ├── env.yaml               # installed/needs для каждого app
│       ├── values/
│       │   └── _all.yaml.gotmpl   # переопределения values
│       └── secrets/
│           └── _all.yaml          # зашифрованные секреты (SOPS)
└── charts/
    └── remark42/                  # собственный helm-чарт
        ├── Chart.yaml
        ├── templates/
        └── values.yaml
```

---

### Точка входа - helmfile.yaml

```yaml
bases:
  - .helmfile/environments.yaml.gotmpl
---
bases:
  - .helmfile/repositories.yaml
  - .helmfile/releases.yaml.gotmpl
helmDefaults:
  wait: true
  atomic: true
  devel: true
  createNamespace: true
```

Файл разделён на два YAML-документа (через `---`). Это требование helmfile - окружения загружаются первым проходом, а затем подключаются репозитории и релизы.

`helmDefaults` задаёт поведение по умолчанию для всех релизов:
- `wait: true` - ждать, пока все ресурсы перейдут в Ready
- `atomic: true` - при ошибке автоматический откат
- `createNamespace: true` - автоматическое создание namespace

---

### Окружения - .helmfile/environments.yaml.gotmpl

```yaml
templates:
  .default: &default
    missingFileHandler: Info
    values:
      # Реестр приложений
      - apps/*.*
      # Настройки окружения
      - envs/{{ .Environment.Name }}/*.*
      # Values для helm-релизов
      - envs/{{ .Environment.Name }}/values/*.*
    secrets:
      # Зашифрованные секреты
      - envs/{{ .Environment.Name }}/secrets/*.*

environments:
  k8s:
    <<: *default
```

Здесь задана цепочка загрузки переменных. Каждое окружение наследует шаблон `&default` через YAML-якорь. Helmfile загружает values и secrets по слоям, и более поздние слои переопределяют ранние:

1. `apps/*.*` - описания всех приложений (какой чарт, версия, репозиторий)
2. `envs/k8s/*.*` - какие приложения установлены и их зависимости
3. `envs/k8s/values/*.*` - переопределения values для этого окружения
4. `envs/k8s/secrets/*.*` - зашифрованные секреты

`missingFileHandler: Info` означает, что если файл не найден - helmfile просто пропустит его, а не упадёт с ошибкой. Это позволяет не создавать пустые файлы для каждого слоя.

Добавить новое окружение (например, staging) - одна строка:

```yaml
environments:
  k8s:
    <<: *default
  staging:
    <<: *default
```

И создать папку `envs/staging/` с `env.yaml`, `values/`, `secrets/`.

---

### Реестр приложений - apps/

```yaml
apps:
  ingress-nginx:
    repo: ingress-nginx
    chart: ingress-nginx
    version: 4.0.16
    namespace: ingress-nginx
  cert-manager:
    repo: jetstack
    chart: cert-manager
    version: v1.7.0
    namespace: cert-manager
  postgresql:
    repo: bitnami
    chart: postgresql
    version: 11.0.1
    namespace: postgresql
  gitea:
    repo: gitea-charts
    chart: gitea
    version: 5.0.1
    namespace: gitea
  velero:
    repo: vmware-tanzu
    chart: velero
    version: 6.0.0
    namespace: velero
  remark42:
    repo: charts
    chart: remark42
    namespace: remark42
  pairdrop:
    repo: zzamtools
    version: 1.2.0
    chart: base-deployment
    namespace: pairdrop
```

Это словарь `apps` - единое место, где описаны все приложения: имя, helm-репозиторий, чарт, версия и namespace. Здесь не указывается, установлено ли приложение - это решает конкретное окружение.

Разделение между "что может быть установлено" (apps) и "что установлено" (env.yaml) позволяет переиспользовать один реестр для множества окружений.

---

### Динамическая генерация релизов - .helmfile/releases.yaml.gotmpl

```yaml
releases:
{{- range $release, $v := .Values.apps }}
- name: {{ $release }}
  labels:
    app: {{ $release }}
  chart: {{ $v.repo }}/{{ $v.chart }}
  {{- if $v | getOrNil "version" }}
  version: {{ $v.version }}
  {{- end }}
  {{- if $v | getOrNil "namespace" }}
  namespace: {{ $v.namespace }}
  {{- end }}
  missingFileHandler: Info
  values:
    {{- if $v | getOrNil "valueFiles" }}
    {{- range $valueFile := $v.valueFiles }}
    - releases/{{ $valueFile }}
    {{- end }}
    {{- else }}
    - releases/{{ $release }}.yaml.gotmpl
    {{- end }}
    - releases/_override.yaml.gotmpl
  {{- if ($v | getOrNil "installed") }}
  installed: true
  {{- else }}
  installed: false
  {{- end }}
  {{- if ($v | getOrNil "needs") }}
  needs:
    {{- toYaml $v.needs | trim | nindent 4 }}
  {{- end }}
{{- end }}
```

Это ключевой элемент архитектуры. Вместо ручного перечисления каждого release, шаблон итерируется по словарю `.Values.apps` и генерирует helmfile-releases автоматически.

Для каждого приложения шаблон:
- Формирует `chart` из `repo/chart`
- Подключает values из `releases/<имя>.yaml.gotmpl`
- Добавляет `_override.yaml.gotmpl` для переопределений из окружения
- Устанавливает `installed: true/false` на основе env.yaml
- Прописывает `needs` для управления порядком деплоя

Например, запись из apps

```yaml
apps:
  gitea:
    repo: gitea-charts
    chart: gitea
    version: 5.0.1
    namespace: gitea
```

вместе с env.yaml

```yaml
apps:
  gitea:
    installed: true
    needs:
    - postgresql/postgresql
    - gitea/gitea-secrets
```

превратится в release

```yaml
releases:
- name: gitea
  labels:
    app: gitea
  chart: gitea-charts/gitea
  version: 5.0.1
  namespace: gitea
  missingFileHandler: Info
  values:
    - releases/gitea.yaml.gotmpl
    - releases/_override.yaml.gotmpl
  installed: true
  needs:
    - postgresql/postgresql
    - gitea/gitea-secrets
```

---

### Конфигурация окружения - envs/k8s/env.yaml

```yaml
apps:
  ingress-nginx:
    installed: true
  cert-manager:
    installed: true
  cert-manager-issuers:
    installed: true
    needs:
    - cert-manager/cert-manager
  postgresql-configmaps:
    installed: true
  postgresql:
    installed: true
    needs:
    - postgresql/postgresql-configmaps
  gitea:
    installed: true
    needs:
    - postgresql/postgresql
    - gitea/gitea-secrets
  keycloak:
    installed: false
    needs:
    - postgresql/postgresql
  velero:
    installed: true
  pairdrop:
    installed: true
  kavita:
    installed: true
```

Этот файл определяет, какие приложения установлены в данном окружении и в каком порядке. Values из apps и env.yaml мержатся - apps задаёт "что" (чарт, версия), а env.yaml - "где" (installed, зависимости).

Формат `needs` использует синтаксис `namespace/release-name` для определения зависимостей. Helmfile деплоит зависимости раньше зависимых релизов.

---

### Общие values для релиза - releases/

Каждый файл `releases/<имя>.yaml.gotmpl` содержит values, общие для всех окружений.

`releases/ingress-nginx.yaml.gotmpl`
```yaml
controller:
  resources:
    requests:
      cpu: 10m
      memory: 256Mi
  kind: DaemonSet
  hostNetwork: true
  service:
    type: ""
  metrics:
    enabled: false
  config:
    enable-real-ip: "true"
    use-forwarded-headers: "false"
```

`releases/velero.yaml.gotmpl`
```yaml
initContainers:
  - name: velero-plugin-for-aws
    image: velero/velero-plugin-for-aws:v1.9.2
    imagePullPolicy: IfNotPresent
    volumeMounts:
      - mountPath: /target
        name: plugins

backupsEnabled: true
snapshotsEnabled: false
deployNodeAgent: true

resources:
  requests:
    cpu: 10m
    memory: 128Mi
```

`releases/cert-manager.yaml.gotmpl`
```yaml
installCRDs: true
crds:
  enabled: true
prometheus:
  enabled: false
```

Минимальные releases могут содержать только `fullnameOverride`

```yaml
# releases/kavita.yaml.gotmpl
fullnameOverride: kavita
```

---

### Механизм переопределения - releases/_override.yaml.gotmpl

```yaml
{{- if (.Values | getOrNil .Release.Name) }}
{{ .Values | getOrNil .Release.Name | toYaml }}
{{- end }}
```

Этот шаблон проверяет, есть ли в values текущего окружения ключ с именем текущего релиза, и если есть - подставляет его содержимое как дополнительные values.

Это позволяет переопределять параметры любого приложения в одном файле `envs/<env>/values/_all.yaml.gotmpl`:

```yaml
# envs/k8s/values/_all.yaml.gotmpl

gitea:
  gitea:
    config:
      database:
        DB_TYPE: postgres
        HOST: postgresql.postgresql.svc.cluster.local:5432

ingress-nginx:
  controller:
    metrics:
      enabled: true

velero:
  configuration:
    backupStorageLocation:
      - name: default
        provider: aws
        bucket: my-backups
```

Вместо создания отдельного values-файла для каждого приложения, все переопределения для окружения собраны в одном месте. Когда в окружении десяток приложений, это значительно удобнее.

---

### Helm-репозитории - .helmfile/repositories.yaml

```yaml
repositories:
  - name: ingress-nginx
    url: https://kubernetes.github.io/ingress-nginx
  - name: jetstack
    url: https://charts.jetstack.io
  - name: gitea-charts
    url: https://dl.gitea.io/charts/
  - name: bitnami
    url: https://raw.githubusercontent.com/bitnami/charts/archive-full-index/bitnami
  - name: oauth2-proxy
    url: https://oauth2-proxy.github.io/manifests
  - name: vmware-tanzu
    url: https://vmware-tanzu.github.io/helm-charts
  - name: zzamtools
    url: https://zzamtools.github.io/helm-charts
```

Имена репозиториев используются в `apps/` при указании `repo`.

---

### Собственные чарты - charts/

Если для приложения нет готового helm-чарта, можно разместить свой в папке `charts/`. В примере выше для remark42 используется собственный чарт:

```yaml
# apps/_others.yaml
apps:
  remark42:
    repo: charts      # папка charts/ в корне проекта
    chart: remark42
    namespace: remark42
```

Helmfile автоматически подхватит чарт из `charts/remark42/`.

---

## Шифрование секретов через SOPS

Helmfile интегрируется с helm-secrets и SOPS для безопасного хранения секретов в git.

`.sops.yaml`
```yaml
creation_rules:
  - age: age1q2f4expgz8f2cfrk56cmaeset3f0flwggzhnmrx2yr9pkhasq9qs6ftlty
```

Секреты хранятся зашифрованными в `envs/<env>/secrets/*.yaml` и автоматически расшифровываются при деплое.

Редактирование секретов

```bash
helm secrets edit envs/k8s/secrets/_all.yaml
```

Для генерации ключей используется утилита [age](https://github.com/FiloSottile/age):

```bash
age-keygen -o ~/.config/sops/age/keys.txt
```

Публичный ключ прописывается в `.sops.yaml`, приватный хранится на машинах, с которых происходит деплой.

---

## Мультитенантная конфигурация

Та же архитектура масштабируется для деплоя одних и тех же приложений в разные окружения с разными параметрами. Пример из [helmfile-examples](https://github.com/zam-zam/helmfile-examples):

```
envs/
├── clusters/
│   └── k0s/              # кластерные аддоны
│       └── env.yaml
├── client-a/
│   └── prod/
│       ├── env.yaml
│       ├── values/
│       │   └── _all.yaml.gotmpl
│       └── secrets/
│           └── _all.yaml
├── client-b/
│   └── prod/
│       ├── env.yaml
│       ├── values/
│       └── secrets/
└── client-c/
    └── prod/
        ├── env.yaml
        ├── values/
        └── secrets/
```

`.helmfile/environments.yaml`
```yaml
environments:
  clusters/k0s:
    <<: *default
  client-a/prod:
    <<: *default
  client-b/prod:
    <<: *default
  client-c/prod:
    <<: *default
```

Каждый клиент получает свою конфигурацию

`envs/client-a/prod/env.yaml`
```yaml
global:
  ingressDomain: client-a-prod.example.com

apps:
  simple-python-web-app:
    installed: true
```

`envs/client-a/prod/values/_all.yaml.gotmpl`
```yaml
simple-python-web-app:
  env:
    CLIENT_ID: "Client A"
```

Деплой каждого окружения отдельно

```bash
helmfile -e client-a/prod -n client-a-prod apply
helmfile -e client-b/prod -n client-b-prod apply
helmfile -e client-c/prod -n client-c-prod apply
```

Приложение наследует общие values из `releases/simple-python-web-app.yaml.gotmpl`, а клиентские переопределения подтягиваются через `_override.yaml.gotmpl`.

---

## Как работает цепочка values

Порядок приоритета (от низшего к высшему):

1. `releases/<app>.yaml.gotmpl` - общие defaults для всех окружений
2. `releases/_override.yaml.gotmpl` - подтягивает переопределения из values окружения
3. `envs/<env>/values/_all.yaml.gotmpl` - values конкретного окружения (источник для _override)
4. `envs/<env>/secrets/_all.yaml` - зашифрованные секреты (высший приоритет)

> [!important] Принцип наследования
> Общие значения задаются один раз в `releases/`, а каждое окружение переопределяет только то, что отличается. Это DRY-подход - не нужно дублировать полную конфигурацию для каждого окружения.

---

## Как добавить новое приложение

1. Добавить описание в `apps/`

```yaml
apps:
  my-app:
    repo: bitnami
    chart: my-app
    version: 1.0.0
    namespace: my-app
```

2. Создать файл общих values

```yaml
# releases/my-app.yaml.gotmpl
replicas: 1
resources:
  requests:
    cpu: 10m
    memory: 128Mi
```

3. Включить в нужном окружении

```yaml
# envs/k8s/env.yaml
apps:
  my-app:
    installed: true
    needs:
    - postgresql/postgresql
```

4. При необходимости - переопределить values для окружения

```yaml
# envs/k8s/values/_all.yaml.gotmpl
my-app:
  replicas: 3
  ingress:
    enabled: true
    host: my-app.example.com
```

---

## Как добавить новое окружение

1. Добавить окружение в `.helmfile/environments.yaml.gotmpl`

```yaml
environments:
  k8s:
    <<: *default
  staging:
    <<: *default
```

2. Создать структуру папок

```
envs/staging/
├── env.yaml       # какие apps установлены
├── values/
│   └── _all.yaml.gotmpl
└── secrets/
    └── _all.yaml
```

3. Описать нужные приложения и их параметры

4. Деплоить

```bash
helmfile -e staging apply
```

---

## CI/CD интеграция

Пример GitLab CI для helmfile

```yaml
deploy:
  stage: deploy
  image: alpine/helmfile
  script:
    - helmfile init --force
    - helmfile -e ${CI_ENVIRONMENT_NAME} apply
```

> [!summary] TL;DR
> Helmfile описывает всю Kubernetes-инфраструктуру как код. Приложения, параметры, секреты, зависимости, окружения - всё управляется одной командой из единого git-репозитория.

## Samples

- https://github.com/zam-zam/zzamzam-k8s - production-конфигурация с 20+ приложениями
- https://github.com/zam-zam/helmfile-examples - обучающий пример с мультитенантным деплоем
