---
tags:
  - devops
  - ci-cd
  - gitlab
title: GitLab CI/CD
---

## Основы GitLab CI/CD

GitLab CI/CD - встроенная система непрерывной интеграции и доставки, которая работает на основе файла `.gitlab-ci.yml` в корне репозитория. В отличие от Jenkins или GitHub Actions, GitLab предоставляет полный цикл DevOps в единой платформе - от планирования до мониторинга.

Пайплайн состоит из stages, которые выполняются последовательно. Внутри каждого stage jobs выполняются параллельно. Если хотя бы один job в stage завершается с ошибкой, следующий stage не запускается.

> [!info] Версионирование
> GitLab CI активно развивается. Актуальные ключевые слова и их поведение могут меняться между мажорными версиями GitLab. Всегда проверяй совместимость с версией своего инстанса.

## Структура .gitlab-ci.yml

Минимальный пайплайн содержит определение stages и хотя бы один job.

```yaml
stages:
  - build
  - test
  - deploy

build-app:
  stage: build
  image: node:20-alpine
  before_script:
    - npm ci --cache .npm
  script:
    - npm run build
  after_script:
    - echo "Build completed with exit code $CI_JOB_STATUS"
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

unit-tests:
  stage: test
  image: node:20-alpine
  before_script:
    - npm ci --cache .npm
  script:
    - npm run test:ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: reports/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

deploy-staging:
  stage: deploy
  script:
    - ./deploy.sh staging
  environment:
    name: staging
    url: https://staging.example.com
```

Каждый job наследует `before_script` и `after_script` из глобального определения, если они указаны на верхнем уровне. Локальное определение в job перезаписывает глобальное.

```yaml
default:
  before_script:
    - echo "Global before_script"
  after_script:
    - echo "Global after_script"
  image: alpine:3.19
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
  timeout: 30m
```

Блок `default` задает значения по умолчанию для всех jobs. Это удобнее, чем дублировать одни и те же параметры в каждом job.

## Пайплайны

### Базовый пайплайн

Стандартный линейный пайплайн, где stages идут последовательно.

```yaml
stages:
  - build
  - test
  - security
  - deploy
```

### DAG с использованием needs

Ключевое слово `needs` позволяет строить направленный ациклический граф зависимостей. Job запускается сразу, как только завершатся все его зависимости, не дожидаясь окончания всего stage.

```yaml
stages:
  - build
  - test
  - deploy

build-frontend:
  stage: build
  script: npm run build:frontend
  artifacts:
    paths: [dist/frontend/]

build-backend:
  stage: build
  script: go build -o app ./cmd/server
  artifacts:
    paths: [app]

test-frontend:
  stage: test
  needs: [build-frontend]
  script: npm run test:frontend

test-backend:
  stage: test
  needs: [build-backend]
  script: go test ./...

test-integration:
  stage: test
  needs: [build-frontend, build-backend]
  script: ./run-integration-tests.sh

deploy:
  stage: deploy
  needs: [test-frontend, test-backend, test-integration]
  script: ./deploy.sh
```

В этом примере `test-frontend` стартует сразу после `build-frontend`, не дожидаясь `build-backend`. Это существенно ускоряет пайплайн.

> [!important] Ограничение needs
> По умолчанию job с `needs` получает артефакты только от перечисленных зависимостей, а не от всех jobs предыдущего stage. Если артефакты не нужны, укажи `needs: [{job: "build-app", artifacts: false}]`.

### Parent-Child Pipelines

Позволяют разбить монолитный `.gitlab-ci.yml` на независимые пайплайны. Родительский пайплайн вызывает дочерние через `trigger`.

```yaml
# .gitlab-ci.yml (родительский)
stages:
  - triggers

trigger-frontend:
  stage: triggers
  trigger:
    include: frontend/.gitlab-ci.yml
    strategy: depend
  rules:
    - changes:
        - frontend/**/*

trigger-backend:
  stage: triggers
  trigger:
    include: backend/.gitlab-ci.yml
    strategy: depend
  rules:
    - changes:
        - backend/**/*

trigger-infra:
  stage: triggers
  trigger:
    include: infra/.gitlab-ci.yml
    strategy: depend
  rules:
    - changes:
        - terraform/**/*
        - ansible/**/*
```

`strategy: depend` заставляет родительский пайплайн ждать завершения дочернего и отражать его статус.

### Multi-Project Pipelines

Запуск пайплайна в другом проекте. Полезно для координации деплоя нескольких микросервисов.

```yaml
deploy-downstream:
  stage: deploy
  trigger:
    project: team/infrastructure
    branch: main
    strategy: depend
  variables:
    UPSTREAM_VERSION: $CI_COMMIT_SHORT_SHA
    UPSTREAM_PROJECT: $CI_PROJECT_NAME
```

### Merge Request Pipelines

Пайплайны, которые запускаются только для merge request. Используют переменные `CI_MERGE_REQUEST_*` и выполняются в контексте MR.

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG

lint:
  stage: test
  script: npm run lint
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Rules и Workflow

### Rules

`rules` заменяют устаревшие `only`/`except` и предоставляют гибкую логику запуска jobs.

```yaml
deploy-production:
  stage: deploy
  script: ./deploy.sh production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
      allow_failure: false
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
      when: on_success
    - when: never

run-expensive-tests:
  stage: test
  script: ./heavy-tests.sh
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - src/core/**/*
        - src/database/**/*
    - when: never
```

Правила вычисляются сверху вниз. Первое совпавшее правило определяет поведение job. Если ни одно правило не совпало и нет `when: never` в конце, job добавляется по умолчанию.

### Workflow Rules

Определяют, должен ли пайплайн вообще создаваться. Вычисляются до всех jobs.

```yaml
workflow:
  rules:
    # Не создавать пайплайн для черновых MR
    - if: $CI_MERGE_REQUEST_TITLE =~ /^Draft:/
      when: never
    # MR пайплайны
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    # Пайплайны для default branch
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    # Пайплайны для тегов
    - if: $CI_COMMIT_TAG
    # Scheduled пайплайны
    - if: $CI_PIPELINE_SOURCE == "schedule"
    # Все остальное - не создавать
    - when: never
```

> [!important] Дублирование пайплайнов
> Без `workflow:rules` при создании MR могут запуститься два пайплайна - один для ветки, другой для MR. Используй `workflow:rules` чтобы этого избежать.

### Сравнение условий rules

| Условие | Назначение | Пример |
|---------|-----------|--------|
| `if` | Проверка переменных | `$CI_COMMIT_BRANCH == "main"` |
| `changes` | Изменения в файлах | `changes: [src/**/*]` |
| `exists` | Наличие файла в репо | `exists: [Dockerfile]` |
| `when` | Режим запуска | `manual`, `on_success`, `never`, `delayed` |
| `allow_failure` | Разрешить провал | `allow_failure: true` |
| `variables` | Переопределить переменные | `variables: { DEPLOY_ENV: "staging" }` |

## Переменные

### Типы переменных

GitLab поддерживает несколько уровней переменных. Приоритет идет от высшего к низшему.

| Уровень | Где задается | Приоритет |
|---------|-------------|-----------|
| Job-level | В `.gitlab-ci.yml` внутри job | Высший |
| Pipeline-level | В `.gitlab-ci.yml` на верхнем уровне | |
| Trigger variables | При вызове API или trigger | |
| Project CI/CD settings | Settings > CI/CD > Variables | |
| Group CI/CD settings | Group > Settings > CI/CD | |
| Instance-level | Admin > CI/CD > Variables | Низший |

### Определение в .gitlab-ci.yml

```yaml
variables:
  DOCKER_REGISTRY: registry.example.com
  APP_NAME: my-service
  GOLANG_VERSION: "1.22"

build:
  stage: build
  variables:
    CGO_ENABLED: "0"
    GOOS: linux
    GOARCH: amd64
  script:
    - go build -ldflags "-X main.version=$CI_COMMIT_SHORT_SHA" -o $APP_NAME
```

### Predefined Variables

GitLab предоставляет большой набор встроенных переменных. Наиболее используемые.

| Переменная | Описание |
|-----------|----------|
| `CI_COMMIT_SHA` | Полный SHA коммита |
| `CI_COMMIT_SHORT_SHA` | Короткий SHA (8 символов) |
| `CI_COMMIT_BRANCH` | Имя ветки |
| `CI_COMMIT_TAG` | Имя тега |
| `CI_COMMIT_REF_NAME` | Ветка или тег |
| `CI_PIPELINE_ID` | ID пайплайна |
| `CI_PROJECT_NAME` | Имя проекта |
| `CI_PROJECT_NAMESPACE` | Namespace проекта |
| `CI_REGISTRY_IMAGE` | Путь к образу в Container Registry |
| `CI_MERGE_REQUEST_IID` | IID merge request |
| `CI_DEFAULT_BRANCH` | Default branch (обычно main) |
| `CI_ENVIRONMENT_NAME` | Имя окружения |
| `CI_JOB_TOKEN` | Токен для API-вызовов в рамках job |

### Protected и Masked переменные

В настройках проекта переменные можно пометить как protected и masked.

Protected переменные доступны только в пайплайнах для protected branches и tags. Masked переменные скрываются в логах job.

```yaml
deploy-production:
  stage: deploy
  script:
    # $KUBE_CONFIG_PROD - protected + masked variable из Settings
    - echo "$KUBE_CONFIG_PROD" | base64 -d > /tmp/kubeconfig
    - export KUBECONFIG=/tmp/kubeconfig
    - kubectl apply -f k8s/
  after_script:
    - rm -f /tmp/kubeconfig
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### File-type переменные

Переменные типа File создают временный файл с содержимым переменной. Путь к файлу передается через переменную окружения.

```yaml
deploy:
  script:
    # $GOOGLE_APPLICATION_CREDENTIALS - file type variable
    # GitLab автоматически создаёт файл и подставляет путь
    - gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
    - gcloud app deploy
```

## Артефакты

Артефакты - это файлы, которые сохраняются после завершения job и могут передаваться между jobs.

```yaml
build:
  stage: build
  script:
    - npm run build
    - npm run test:ci
  artifacts:
    paths:
      - dist/
      - coverage/
    exclude:
      - dist/**/*.map
    expire_in: 1 week
    when: always
    reports:
      junit: reports/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      codequality: gl-code-quality-report.json
      sast: gl-sast-report.json
      dependency_scanning: gl-dependency-scanning-report.json
```

### Типы отчётов

| Тип отчёта | Назначение | Отображение |
|-----------|-----------|------------|
| `junit` | Результаты тестов | Вкладка Tests в MR |
| `coverage_report` | Покрытие кода | Diff view в MR |
| `codequality` | Качество кода | MR widget |
| `sast` | Статический анализ безопасности | Security dashboard |
| `dependency_scanning` | Уязвимости зависимостей | Security dashboard |
| `container_scanning` | Уязвимости образов | Security dashboard |
| `dast` | Динамический анализ безопасности | Security dashboard |
| `license_scanning` | Лицензии зависимостей | MR widget |
| `metrics` | Пользовательские метрики | MR widget |
| `dotenv` | Переменные окружения | Доступны в последующих jobs |

### dependencies

По умолчанию job скачивает артефакты всех предыдущих stages. Ключевое слово `dependencies` ограничивает список.

```yaml
test-unit:
  stage: test
  dependencies: []  # Не скачивать никакие артефакты
  script:
    - npm ci
    - npm run test:unit

test-e2e:
  stage: test
  dependencies:
    - build  # Скачать артефакты только из build
  script:
    - npm run test:e2e
```

### dotenv артефакты

Позволяют передавать динамические переменные между jobs.

```yaml
generate-version:
  stage: build
  script:
    - VERSION=$(git describe --tags --always)
    - echo "APP_VERSION=$VERSION" >> build.env
    - echo "BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> build.env
  artifacts:
    reports:
      dotenv: build.env

deploy:
  stage: deploy
  needs: [generate-version]
  script:
    # $APP_VERSION и $BUILD_DATE доступны автоматически
    - echo "Deploying version $APP_VERSION built at $BUILD_DATE"
    - helm upgrade --set image.tag=$APP_VERSION myapp ./chart
```

## Кэш

Кэш ускоряет пайплайны, сохраняя файлы между запусками. В отличие от артефактов, кэш не гарантирует наличие и используется как оптимизация.

```yaml
variables:
  NPM_CONFIG_CACHE: "$CI_PROJECT_DIR/.npm"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"

build-node:
  stage: build
  image: node:20-alpine
  cache:
    key:
      files:
        - package-lock.json
      prefix: $CI_COMMIT_REF_SLUG
    paths:
      - .npm/
      - node_modules/
    policy: pull-push
    fallback_keys:
      - ${CI_DEFAULT_BRANCH}-npm-
      - npm-
  script:
    - npm ci
    - npm run build

build-python:
  stage: build
  image: python:3.12-slim
  cache:
    key:
      files:
        - requirements.txt
        - requirements-dev.txt
    paths:
      - .pip-cache/
      - venv/
    policy: pull-push
  script:
    - python -m venv venv
    - source venv/bin/activate
    - pip install -r requirements.txt
```

### Cache Policy

| Policy | Поведение |
|--------|----------|
| `pull-push` | Скачать кэш в начале, загрузить обновлённый в конце. Значение по умолчанию |
| `pull` | Только скачать, не обновлять. Используй в jobs, которые не меняют кэш |
| `push` | Только загрузить, не скачивать. Используй для первоначального создания кэша |

### Distributed Cache

Для кэша, доступного всем runner'ам, настрой S3-совместимое хранилище.

```toml
# /etc/gitlab-runner/config.toml
[[runners]]
  [runners.cache]
    Type = "s3"
    Shared = true
    [runners.cache.s3]
      ServerAddress = "s3.amazonaws.com"
      BucketName = "gitlab-runner-cache"
      BucketLocation = "eu-west-1"
      AccessKey = "AKIAIOSFODNN7EXAMPLE"
      SecretKey = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

> [!summary] Кэш vs Артефакты
> Кэш - для зависимостей, которые можно переустановить. Не гарантирует наличие. Артефакты - для результатов сборки, которые нужны другим jobs. Гарантируют наличие.

### Стратегия ключей кэша

```yaml
# Кэш привязан к lock-файлу - обновляется только при изменении зависимостей
cache:
  key:
    files:
      - go.sum
    prefix: go-modules
  paths:
    - .go-cache/

# Кэш привязан к ветке - каждая ветка имеет свой кэш
cache:
  key: $CI_COMMIT_REF_SLUG
  paths:
    - build/

# Кэш общий для всего проекта
cache:
  key: global-cache
  paths:
    - vendor/
```

## Docker-in-Docker

### DinD через сервис

Классический подход - запуск Docker daemon как service.

```yaml
build-image:
  stage: build
  image: docker:27
  services:
    - docker:27-dind
  variables:
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_CERTDIR: "/certs"
    DOCKER_CERT_PATH: "/certs/client"
    DOCKER_TLS_VERIFY: "1"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build
        --cache-from $CI_REGISTRY_IMAGE:latest
        --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
        --tag $CI_REGISTRY_IMAGE:latest
        .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
```

### Kaniko - безопасная альтернатива

Kaniko не требует привилегированного режима и Docker daemon. Это рекомендуемый подход для shared runner'ов.

```yaml
build-image-kaniko:
  stage: build
  image:
    name: gcr.io/kaniko-project/executor:v1.23.0-debug
    entrypoint: [""]
  script:
    - /kaniko/executor
        --context $CI_PROJECT_DIR
        --dockerfile $CI_PROJECT_DIR/Dockerfile
        --destination $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
        --destination $CI_REGISTRY_IMAGE:latest
        --cache=true
        --cache-repo $CI_REGISTRY_IMAGE/cache
        --snapshot-mode=redo
        --compressed-caching=false
  rules:
    - changes:
        - Dockerfile
        - src/**/*
        - go.mod
        - go.sum
```

### Docker Layer Caching

Для ускорения сборки образов используй BuildKit с inline cache или registry cache.

```yaml
build-image-buildkit:
  stage: build
  image: docker:27
  services:
    - docker:27-dind
  variables:
    DOCKER_BUILDKIT: "1"
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker buildx create --use
    - docker buildx build
        --cache-from type=registry,ref=$CI_REGISTRY_IMAGE:buildcache
        --cache-to type=registry,ref=$CI_REGISTRY_IMAGE:buildcache,mode=max
        --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
        --push
        .
```

> [!important] Безопасность DinD
> Docker-in-Docker с `--privileged` режимом дает контейнеру полный доступ к хосту. Для shared runner'ов используй Kaniko или Buildah. DinD допустим только на dedicated runner'ах в контролируемой среде.

## Runners

### Типы runner'ов

| Тип | Область | Управление |
|-----|---------|-----------|
| Shared | Все проекты инстанса | Администратор GitLab |
| Group | Все проекты группы | Владелец группы |
| Project | Один проект | Maintainer проекта |

### Executor Types

| Executor | Изоляция | Скорость | Использование |
|----------|---------|---------|--------------|
| Docker | Хорошая | Средняя | Универсальный, рекомендуемый |
| Kubernetes | Хорошая | Средняя | Кластерная среда |
| Shell | Нет | Высокая | Простые задачи, legacy |
| Docker Machine | Хорошая | Варьируется | Auto-scaling в облаке |
| VirtualBox | Полная | Низкая | Максимальная изоляция |

### Регистрация Runner

```bash
# Установка runner
curl -L --output /usr/local/bin/gitlab-runner \
  https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64
chmod +x /usr/local/bin/gitlab-runner

# Регистрация с Docker executor
gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.example.com/" \
  --token "$RUNNER_TOKEN" \
  --executor "docker" \
  --docker-image "alpine:3.19" \
  --docker-privileged=false \
  --docker-volumes "/cache" \
  --tag-list "docker,linux,amd64" \
  --run-untagged="false" \
  --locked="true"
```

### Конфигурация Runner

```toml
# /etc/gitlab-runner/config.toml
concurrent = 10
check_interval = 3

[[runners]]
  name = "docker-runner-prod"
  url = "https://gitlab.example.com/"
  token = "TOKEN"
  executor = "docker"

  [runners.docker]
    image = "alpine:3.19"
    privileged = false
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"]
    shm_size = 268435456  # 256MB
    memory = "2g"
    cpus = "2"
    pull_policy = ["if-not-present"]

    # Allowed images - ограничение используемых образов
    allowed_images = ["ruby:*", "python:*", "node:*", "golang:*"]

  [runners.cache]
    Type = "s3"
    Shared = true
    [runners.cache.s3]
      BucketName = "runner-cache"
      BucketLocation = "eu-west-1"
```

### Kubernetes Executor

```toml
[[runners]]
  name = "k8s-runner"
  url = "https://gitlab.example.com/"
  token = "TOKEN"
  executor = "kubernetes"

  [runners.kubernetes]
    namespace = "gitlab-ci"
    image = "alpine:3.19"
    privileged = false
    cpu_request = "500m"
    cpu_limit = "2"
    memory_request = "256Mi"
    memory_limit = "2Gi"
    service_cpu_request = "100m"
    service_cpu_limit = "1"
    service_memory_request = "128Mi"
    service_memory_limit = "1Gi"
    poll_interval = 5
    poll_timeout = 3600

    [runners.kubernetes.node_selector]
      "node-role" = "ci"

    [runners.kubernetes.node_tolerations]
      "ci-workload=true" = "NoSchedule"
```

### Autoscaling с Docker Machine

```toml
[[runners]]
  name = "autoscaler"
  executor = "docker+machine"

  [runners.machine]
    IdleCount = 1
    IdleTime = 600
    MaxBuilds = 50
    MachineDriver = "amazonec2"
    MachineName = "gitlab-runner-%s"

    [[runners.machine.autoscaling]]
      Periods = ["* * 9-17 * * mon-fri *"]
      Timezone = "Europe/Moscow"
      IdleCount = 5
      IdleTime = 1200

    [[runners.machine.autoscaling]]
      Periods = ["* * * * * sat,sun *"]
      Timezone = "Europe/Moscow"
      IdleCount = 0
      IdleTime = 60

    [runners.machine.MachineOptions]
      amazonec2-instance-type = "m5.large"
      amazonec2-region = "eu-west-1"
      amazonec2-vpc-id = "vpc-12345"
      amazonec2-subnet-id = "subnet-12345"
      amazonec2-zone = "a"
      amazonec2-use-private-address = "true"
      amazonec2-tags = "runner-manager,gitlab-ci"
```

### Tags и выбор Runner

```yaml
build-arm:
  stage: build
  tags:
    - arm64
    - docker
  script:
    - make build-arm

build-amd64:
  stage: build
  tags:
    - amd64
    - docker
  script:
    - make build-amd64
```

## Environments и Deployments

### Определение окружений

```yaml
deploy-staging:
  stage: deploy
  script:
    - helm upgrade --install myapp ./chart
        --namespace staging
        --set image.tag=$CI_COMMIT_SHORT_SHA
        --values chart/values-staging.yaml
        --wait --timeout 5m
  environment:
    name: staging
    url: https://staging.example.com
    on_stop: stop-staging
    auto_stop_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"

stop-staging:
  stage: deploy
  script:
    - helm uninstall myapp --namespace staging
  environment:
    name: staging
    action: stop
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
      when: manual
  allow_failure: true
```

### Review Apps

Динамические окружения для каждого merge request.

```yaml
deploy-review:
  stage: deploy
  script:
    - helm upgrade --install myapp-$CI_MERGE_REQUEST_IID ./chart
        --namespace review
        --set image.tag=$CI_COMMIT_SHORT_SHA
        --set ingress.host=$CI_MERGE_REQUEST_IID.review.example.com
        --values chart/values-review.yaml
        --wait
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    url: https://$CI_MERGE_REQUEST_IID.review.example.com
    on_stop: stop-review
    auto_stop_in: 3 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

stop-review:
  stage: deploy
  variables:
    GIT_STRATEGY: none
  script:
    - helm uninstall myapp-$CI_MERGE_REQUEST_IID --namespace review || true
    - kubectl delete namespace review-$CI_MERGE_REQUEST_IID --ignore-not-found
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    action: stop
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
  allow_failure: true
```

### Deployment Approvals

Для production окружений можно настроить ручное подтверждение через Protected Environments.

```yaml
deploy-production:
  stage: deploy
  script:
    - helm upgrade --install myapp ./chart
        --namespace production
        --set image.tag=$CI_COMMIT_SHORT_SHA
        --values chart/values-production.yaml
        --wait --timeout 10m
  environment:
    name: production
    url: https://example.com
    deployment_tier: production
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
      allow_failure: false
  resource_group: production
```

`resource_group` гарантирует, что одновременно в production деплоится только один job. Остальные встают в очередь.

## Include и Extends

### Include

Подключение внешних конфигураций для переиспользования.

```yaml
include:
  # Локальный файл из того же репозитория
  - local: ci/templates/docker-build.yml

  # Файл из другого проекта
  - project: devops/ci-templates
    ref: v2.1.0
    file:
      - /templates/security-scanning.yml
      - /templates/deploy-helm.yml

  # Удалённый файл по URL
  - remote: https://example.com/ci/templates/notify.yml

  # Предопределённый шаблон GitLab
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml

  # CI/CD Component (GitLab 16.0+)
  - component: gitlab.example.com/components/deploy@1.0.0
    inputs:
      environment: staging
      cluster: eu-west-1
```

### Extends

Наследование конфигурации для DRY.

```yaml
.base-deploy:
  image: bitnami/kubectl:1.29
  before_script:
    - echo "$KUBE_CONFIG" | base64 -d > /tmp/kubeconfig
    - export KUBECONFIG=/tmp/kubeconfig
  after_script:
    - rm -f /tmp/kubeconfig

deploy-staging:
  extends: .base-deploy
  stage: deploy
  script:
    - kubectl apply -f k8s/ --namespace=staging
  environment:
    name: staging

deploy-production:
  extends: .base-deploy
  stage: deploy
  script:
    - kubectl apply -f k8s/ --namespace=production
  environment:
    name: production
  when: manual
```

Jobs с именем, начинающимся с точки, считаются скрытыми и не выполняются. Они служат базовыми шаблонами для `extends`.

### !reference tag

Позволяет ссылаться на отдельные секции из других jobs.

```yaml
.setup-docker:
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY

.teardown:
  after_script:
    - docker logout $CI_REGISTRY

.notify:
  after_script:
    - 'curl -X POST -H "Content-Type: application/json"
       -d "{\"text\": \"Job $CI_JOB_NAME finished with status $CI_JOB_STATUS\"}"
       $SLACK_WEBHOOK_URL'

build-and-push:
  stage: build
  image: docker:27
  services:
    - docker:27-dind
  before_script:
    - !reference [.setup-docker, before_script]
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  after_script:
    - !reference [.teardown, after_script]
    - !reference [.notify, after_script]
```

`!reference` гибче, чем `extends`, так как позволяет комбинировать фрагменты из разных шаблонов.

## Services

Services - это Docker-контейнеры, которые запускаются вместе с job и доступны по сети. Типичное использование - базы данных и кэши для тестов.

```yaml
test-integration:
  stage: test
  image: golang:1.22-alpine
  services:
    - name: postgres:16-alpine
      alias: db
      variables:
        POSTGRES_DB: testdb
        POSTGRES_USER: testuser
        POSTGRES_PASSWORD: testpass

    - name: redis:7-alpine
      alias: cache

    - name: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
      alias: elasticsearch
      variables:
        discovery.type: single-node
        xpack.security.enabled: "false"
        ES_JAVA_OPTS: "-Xms512m -Xmx512m"
      command: ["elasticsearch"]

  variables:
    DATABASE_URL: "postgres://testuser:testpass@db:5432/testdb?sslmode=disable"
    REDIS_URL: "redis://cache:6379"
    ELASTICSEARCH_URL: "http://elasticsearch:9200"
  script:
    - go test -v -count=1 ./internal/... -tags=integration
```

> [!info] Имя хоста сервиса
> По умолчанию хост сервиса формируется из имени образа. Для `postgres:16-alpine` хост будет `postgres`. Если в имени есть registry path, используй `alias` для простого имени. Можно также использовать подчёркивание вместо дефиса в зависимости от переменной `FF_NETWORK_PER_BUILD`.

### Health-check ожидание

```yaml
test-with-db:
  stage: test
  image: node:20-alpine
  services:
    - name: postgres:16-alpine
      alias: db
      variables:
        POSTGRES_DB: app_test
        POSTGRES_USER: app
        POSTGRES_PASSWORD: secret
  before_script:
    - apk add --no-cache postgresql-client
    - until pg_isready -h db -p 5432 -U app; do
        echo "Waiting for PostgreSQL...";
        sleep 2;
      done
    - npm ci
  script:
    - npm run test:integration
```

## Parallel и Matrix

### Простой параллелизм

```yaml
test:
  stage: test
  parallel: 5
  script:
    - npm run test -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

Job разбивается на 5 параллельных экземпляров. Переменные `CI_NODE_INDEX` и `CI_NODE_TOTAL` позволяют распределить нагрузку.

### Matrix

Создает комбинации переменных для кросс-платформенного тестирования.

```yaml
test-matrix:
  stage: test
  image: $IMAGE
  parallel:
    matrix:
      - IMAGE: [node:18-alpine, node:20-alpine, node:22-alpine]
        DB: [postgres:15, postgres:16]
      - IMAGE: [node:20-alpine]
        DB: [mysql:8.0]
  services:
    - name: $DB
      alias: db
  script:
    - echo "Testing on $IMAGE with $DB"
    - npm run test:integration
```

Этот пример создает 7 jobs - 6 комбинаций Node.js с PostgreSQL и 1 комбинация с MySQL.

### Matrix для мультиархитектурной сборки

```yaml
build-multiarch:
  stage: build
  image: docker:27
  services:
    - docker:27-dind
  parallel:
    matrix:
      - PLATFORM: [linux/amd64, linux/arm64]
  tags:
    - $PLATFORM
  script:
    - docker build --platform $PLATFORM
        -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA-${PLATFORM//\//-}
        --push .
```

## Security Scanning

GitLab предоставляет набор шаблонов для security scanning. Их можно подключить через `include`.

### SAST - Static Application Security Testing

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml

variables:
  SAST_EXCLUDED_PATHS: "vendor/,node_modules/,test/"
  SAST_EXCLUDED_ANALYZERS: "spotbugs"
  SEARCH_MAX_DEPTH: 10
```

SAST автоматически определяет языки проекта и запускает соответствующие анализаторы - semgrep, gosec, brakeman, eslint security plugin и другие.

### Dependency Scanning

```yaml
include:
  - template: Security/Dependency-Scanning.gitlab-ci.yml

variables:
  DS_EXCLUDED_PATHS: "test/,spec/"
```

Сканирует lock-файлы зависимостей на известные уязвимости. Поддерживает npm, pip, Maven, Go modules, Composer и другие.

### Container Scanning

```yaml
include:
  - template: Security/Container-Scanning.gitlab-ci.yml

container_scanning:
  variables:
    CI_APPLICATION_REPOSITORY: $CI_REGISTRY_IMAGE
    CI_APPLICATION_TAG: $CI_COMMIT_SHORT_SHA
    CS_SEVERITY_THRESHOLD: HIGH
```

### Secret Detection

```yaml
include:
  - template: Security/Secret-Detection.gitlab-ci.yml

variables:
  SECRET_DETECTION_HISTORIC_SCAN: "true"
  SECRET_DETECTION_EXCLUDED_PATHS: "test/"
```

### DAST - Dynamic Application Security Testing

```yaml
include:
  - template: DAST.gitlab-ci.yml

dast:
  variables:
    DAST_WEBSITE: https://staging.example.com
    DAST_FULL_SCAN_ENABLED: "true"
    DAST_BROWSER_SCAN: "true"
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
```

### Собственная конфигурация security scanning

Вместо шаблонов можно настроить сканирование вручную для большего контроля.

```yaml
trivy-scan:
  stage: security
  image:
    name: aquasec/trivy:0.49.0
    entrypoint: [""]
  script:
    # Сканирование файловой системы
    - trivy fs --exit-code 1 --severity HIGH,CRITICAL
        --format json --output gl-sast-report.json
        --scanners vuln,secret,misconfig .

    # Сканирование Docker образа
    - trivy image --exit-code 1 --severity HIGH,CRITICAL
        --format json --output gl-container-scanning-report.json
        $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  artifacts:
    reports:
      sast: gl-sast-report.json
      container_scanning: gl-container-scanning-report.json
    when: always
  allow_failure: true

gitleaks:
  stage: security
  image:
    name: zricethezav/gitleaks:v8.18.0
    entrypoint: [""]
  script:
    - gitleaks detect --source . --report-format json
        --report-path gl-secret-detection-report.json
  artifacts:
    reports:
      secret_detection: gl-secret-detection-report.json
    when: always
  allow_failure: true
```

## Releases и Auto DevOps

### Releases

Создание релиза при push тега.

```yaml
release:
  stage: deploy
  image: registry.gitlab.com/gitlab-org/release-cli:latest
  script:
    - echo "Creating release for $CI_COMMIT_TAG"
  release:
    tag_name: $CI_COMMIT_TAG
    name: "Release $CI_COMMIT_TAG"
    description: |
      ## Changes
      $(git log $(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo HEAD~10)..HEAD --pretty=format:"- %s (%h)" --no-merges)
    assets:
      links:
        - name: Docker Image
          url: https://$CI_REGISTRY_IMAGE:$CI_COMMIT_TAG
          link_type: image
        - name: Helm Chart
          url: https://charts.example.com/myapp-${CI_COMMIT_TAG#v}.tgz
          link_type: package
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
```

### Auto DevOps

Auto DevOps - набор предопределённых шаблонов, автоматически реализующих полный CI/CD пайплайн. Включается в Settings > CI/CD > Auto DevOps.

```yaml
# Минимальная конфигурация - Auto DevOps сделает остальное
include:
  - template: Auto-DevOps.gitlab-ci.yml

variables:
  POSTGRES_ENABLED: "true"
  AUTO_DEVOPS_DEPLOY_DEBUG: "false"
  KUBE_INGRESS_BASE_DOMAIN: example.com
```

Auto DevOps автоматически определяет язык проекта, собирает Docker образ, запускает тесты, выполняет security scanning и деплоит в Kubernetes. Для серьёзных проектов рекомендуется писать собственный пайплайн вместо Auto DevOps - он даёт полный контроль над каждым этапом.

## Практический пример - Production Pipeline

Полный пайплайн для Go микросервиса с PostgreSQL.

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - build
  - test
  - security
  - publish
  - deploy

variables:
  GOPATH: "$CI_PROJECT_DIR/.go"
  GOFLAGS: "-mod=vendor"
  CGO_ENABLED: "0"
  APP_NAME: order-service
  DOCKER_REGISTRY: $CI_REGISTRY_IMAGE
  HELM_CHART_PATH: deploy/helm/order-service

default:
  image: golang:1.22-alpine
  cache:
    key:
      files:
        - go.sum
    paths:
      - .go/pkg/mod/
    policy: pull

# ============================================================
# VALIDATE
# ============================================================

lint:
  stage: validate
  image: golangci/golangci-lint:v1.57-alpine
  script:
    - golangci-lint run --timeout 5m ./...
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

check-migrations:
  stage: validate
  image: arigaio/atlas:latest
  script:
    - atlas migrate lint
        --dir "file://migrations"
        --dev-url "sqlite://dev?mode=memory"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - migrations/**/*

# ============================================================
# BUILD
# ============================================================

build-binary:
  stage: build
  cache:
    key:
      files:
        - go.sum
    paths:
      - .go/pkg/mod/
    policy: pull-push
  script:
    - apk add --no-cache git
    - VERSION=$(git describe --tags --always --dirty)
    - BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    - go build
        -ldflags "-s -w
          -X main.version=$VERSION
          -X main.buildTime=$BUILD_TIME
          -X main.commitHash=$CI_COMMIT_SHORT_SHA"
        -o bin/$APP_NAME
        ./cmd/server
    - echo "APP_VERSION=$VERSION" >> build.env
  artifacts:
    paths:
      - bin/
    reports:
      dotenv: build.env
    expire_in: 1 hour

# ============================================================
# TEST
# ============================================================

test-unit:
  stage: test
  needs:
    - job: build-binary
      artifacts: false
  script:
    - go test -race -coverprofile=coverage.out -covermode=atomic
        ./internal/...
    - go tool cover -func=coverage.out
  coverage: '/total:\s+\(statements\)\s+(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    expire_in: 1 day
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

test-integration:
  stage: test
  needs:
    - job: build-binary
      artifacts: true
  services:
    - name: postgres:16-alpine
      alias: db
      variables:
        POSTGRES_DB: orders_test
        POSTGRES_USER: app
        POSTGRES_PASSWORD: testpassword
    - name: redis:7-alpine
      alias: cache
  variables:
    DATABASE_URL: "postgres://app:testpassword@db:5432/orders_test?sslmode=disable"
    REDIS_URL: "redis://cache:6379/0"
  before_script:
    - apk add --no-cache postgresql-client
    - until pg_isready -h db -p 5432 -U app; do sleep 1; done
    - for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
  script:
    - go test -v -count=1 -tags=integration
        -timeout 10m ./tests/integration/...
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# ============================================================
# SECURITY
# ============================================================

gosec:
  stage: security
  needs: []
  image:
    name: securego/gosec:2.19.0
    entrypoint: [""]
  script:
    - gosec -fmt json -out gl-sast-report.json -severity medium ./...
  artifacts:
    reports:
      sast: gl-sast-report.json
    when: always
  allow_failure: true

trivy-fs:
  stage: security
  needs: []
  image:
    name: aquasec/trivy:0.49.0
    entrypoint: [""]
  script:
    - trivy fs --exit-code 0 --severity HIGH,CRITICAL
        --format json --output gl-dependency-report.json .
  artifacts:
    reports:
      dependency_scanning: gl-dependency-report.json
    when: always
  allow_failure: true

# ============================================================
# PUBLISH
# ============================================================

build-and-push-image:
  stage: publish
  needs:
    - job: build-binary
      artifacts: true
    - job: test-unit
    - job: test-integration
  image:
    name: gcr.io/kaniko-project/executor:v1.23.0-debug
    entrypoint: [""]
  script:
    - /kaniko/executor
        --context $CI_PROJECT_DIR
        --dockerfile $CI_PROJECT_DIR/Dockerfile
        --destination $DOCKER_REGISTRY:$CI_COMMIT_SHORT_SHA
        --destination $DOCKER_REGISTRY:latest
        --cache=true
        --cache-repo $DOCKER_REGISTRY/cache
        --label org.opencontainers.image.revision=$CI_COMMIT_SHA
        --label org.opencontainers.image.source=$CI_PROJECT_URL
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG =~ /^v\d+/

trivy-image:
  stage: publish
  needs: [build-and-push-image]
  image:
    name: aquasec/trivy:0.49.0
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL
        --ignore-unfixed
        $DOCKER_REGISTRY:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG =~ /^v\d+/

# ============================================================
# DEPLOY
# ============================================================

.deploy-base:
  image: alpine/helm:3.14
  before_script:
    - echo "$KUBE_CONFIG" | base64 -d > /tmp/kubeconfig
    - export KUBECONFIG=/tmp/kubeconfig
  after_script:
    - rm -f /tmp/kubeconfig

deploy-staging:
  extends: .deploy-base
  stage: deploy
  needs:
    - job: build-and-push-image
    - job: build-binary
      artifacts: true
  script:
    - helm upgrade --install $APP_NAME $HELM_CHART_PATH
        --namespace staging
        --create-namespace
        --set image.repository=$DOCKER_REGISTRY
        --set image.tag=$CI_COMMIT_SHORT_SHA
        --set app.version=$APP_VERSION
        --values $HELM_CHART_PATH/values-staging.yaml
        --wait --timeout 5m
        --atomic
  environment:
    name: staging
    url: https://staging-orders.example.com
    on_stop: stop-staging
    auto_stop_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

stop-staging:
  extends: .deploy-base
  stage: deploy
  variables:
    GIT_STRATEGY: none
  script:
    - helm uninstall $APP_NAME --namespace staging || true
  environment:
    name: staging
    action: stop
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
  allow_failure: true

deploy-production:
  extends: .deploy-base
  stage: deploy
  needs:
    - job: deploy-staging
    - job: trivy-image
    - job: build-binary
      artifacts: true
  script:
    - helm upgrade --install $APP_NAME $HELM_CHART_PATH
        --namespace production
        --set image.repository=$DOCKER_REGISTRY
        --set image.tag=$CI_COMMIT_SHORT_SHA
        --set app.version=$APP_VERSION
        --values $HELM_CHART_PATH/values-production.yaml
        --wait --timeout 10m
        --atomic
  environment:
    name: production
    url: https://orders.example.com
    deployment_tier: production
  resource_group: production-deploy
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
      allow_failure: false

# ============================================================
# REVIEW APPS (Merge Requests)
# ============================================================

deploy-review:
  extends: .deploy-base
  stage: deploy
  needs:
    - job: build-and-push-image
  script:
    - helm upgrade --install $APP_NAME-mr-$CI_MERGE_REQUEST_IID $HELM_CHART_PATH
        --namespace review
        --create-namespace
        --set image.repository=$DOCKER_REGISTRY
        --set image.tag=$CI_COMMIT_SHORT_SHA
        --set ingress.host=mr-$CI_MERGE_REQUEST_IID.review.example.com
        --set replicaCount=1
        --values $HELM_CHART_PATH/values-review.yaml
        --wait --timeout 5m
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    url: https://mr-$CI_MERGE_REQUEST_IID.review.example.com
    on_stop: stop-review
    auto_stop_in: 3 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

stop-review:
  extends: .deploy-base
  stage: deploy
  variables:
    GIT_STRATEGY: none
  script:
    - helm uninstall $APP_NAME-mr-$CI_MERGE_REQUEST_IID --namespace review || true
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    action: stop
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
  allow_failure: true
```

Dockerfile для этого сервиса.

```dockerfile
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
RUN adduser -D -u 1000 appuser
COPY bin/order-service /usr/local/bin/order-service
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
ENTRYPOINT ["order-service"]
```

## Оптимизация пайплайнов

### Interruptible

Автоматическая отмена устаревших пайплайнов при новом push.

```yaml
workflow:
  auto_cancel:
    on_new_commit: interruptible

default:
  interruptible: true

deploy-production:
  interruptible: false  # Деплой нельзя прерывать
  script: ./deploy.sh
```

### Условные jobs через changes

Запуск jobs только при изменении релевантных файлов.

```yaml
test-frontend:
  stage: test
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        paths:
          - frontend/**/*
          - package.json
          - package-lock.json
        compare_to: refs/heads/main
  script:
    - cd frontend && npm test
```

### Уменьшение времени через GIT_STRATEGY

```yaml
# Не клонировать репозиторий, если он не нужен
notify-slack:
  variables:
    GIT_STRATEGY: none
  script:
    - 'curl -X POST -H "Content-Type: application/json"
       -d "{\"text\": \"Pipeline $CI_PIPELINE_ID finished\"}"
       $SLACK_WEBHOOK_URL'

# Использовать fetch вместо clone для ускорения
default:
  variables:
    GIT_STRATEGY: fetch
    GIT_DEPTH: 20  # Shallow clone
```

### Parallel и разбиение тестов

```yaml
test-jest:
  stage: test
  parallel: 4
  script:
    - npx jest --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL

test-go:
  stage: test
  parallel: 3
  script:
    - |
      # Разбить пакеты на $CI_NODE_TOTAL групп
      PACKAGES=$(go list ./... | awk "NR % $CI_NODE_TOTAL == ($CI_NODE_INDEX - 1)")
      go test -v $PACKAGES
```

### Retry и timeout

```yaml
flaky-integration-test:
  stage: test
  retry:
    max: 2
    when:
      - script_failure
      - runner_system_failure
  timeout: 15m
  script:
    - npm run test:e2e
```

### Сравнение стратегий оптимизации

| Стратегия | Экономия времени | Сложность | Когда применять |
|----------|-----------------|-----------|----------------|
| `needs` (DAG) | 20-50% | Низкая | Всегда, если jobs не зависят друг от друга |
| `changes` | 30-70% | Низкая | Монорепо, редко меняющиеся модули |
| `parallel` | 50-80% | Низкая | Тесты, линтинг |
| Cache | 20-60% | Средняя | Зависимости, node_modules, vendor |
| `interruptible` | Косвенная | Низкая | Все MR пайплайны |
| Parent-child | Организационная | Средняя | Крупные монорепо |
| Docker layer cache | 30-70% | Средняя | Сборка Docker образов |
| `GIT_DEPTH` | 5-15% | Низкая | Всегда |

### Мониторинг пайплайнов

GitLab предоставляет метрики CI/CD в разделе Analytics > CI/CD Analytics. Ключевые метрики для отслеживания.

| Метрика | Целевое значение | Действие при нарушении |
|---------|-----------------|----------------------|
| Pipeline duration | < 15 мин | Добавить параллелизм, оптимизировать кэш |
| Pipeline success rate | > 95% | Найти flaky тесты, улучшить retry стратегию |
| Time to first failure | < 3 мин | Перенести быстрые проверки в ранние stages |
| Runner queue time | < 30 сек | Добавить runner'ы или настроить autoscaling |

> [!summary] Ключевые принципы
> Fail fast - линтинг и быстрые тесты в первых stages. Используй DAG через `needs` для параллелизма. Кэшируй зависимости с привязкой к lock-файлу. Security scanning - в каждом пайплайне. Manual approval для production. Review apps для каждого MR.
