---
tags:
  - devops
---
## Теория CI/CD

**CI** - Continuous Integration - непрерывная интеграция.
**CD** - Continuous Delivery / Deployment - непрерывная доставка и развёртывание.

Пайплайн выглядит следующим образом:

- Планирование
- Разработка
- Сборка
- Тестирование
- Релиз
- Развёртывание
- Управление
- Мониторинг

![](_png/fc6770195d5438037b9dfae8e36de5d2.png)

Пример:

- Менеджер присылает задачу
- Создаём ветку для создания новой фичи проекта
- Пишем код
- Далее создаём `pull`/`merge` `request` и отдаём код на ревью
- Если всё ок, то код можно заливать в мастер

Однако так же нужно было прогнать все проверки и тесты - линтеры, юнит-тесты, e2e и так далее. Это процесс долгий, и выполнять его каждый раз самостоятельно - трудная задача.

И тут в дело вступает CI. Она позволяет автоматизировать проведение всех проверок перед тем, как залить определённые изменения в ветку.

![](_png/587da6e0250ff8bb518105b4d33e9635.png)

CD же представляет из себя merge всех изменений с основной веткой, сборку приложения и деплой этой сборки.

CI зачастую реализуется через сервисы по типу GitLab CI, Jenkins, BitBucket Pipelines, GitHub Actions. Далее рассмотрим GitHub Actions подробно.

## GitHub Actions - основы

Workflow описывается в YAML-файле в директории `.github/workflows/`. При push или pull request в указанную ветку GitHub запускает jobs по описанной стратегии.

Каждый шаг указывается в `steps`. Пример простого CI-пайплайна:

`.github/workflows/ci.yml`

```yaml
name: CI Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Unit tests
        run: npm run test:unit
      - name: Build
        run: npm run build
```

![](_png/b04a96c3173e5ec1afec5d623a267734.png)

Если workflow словит ошибку, GitHub покажет её в интерфейсе:

![](_png/2328eaee55a1f0cea93fd74fac0c0a45.png)

![](_png/cb368fbf07c7d206c70ea45fe6ea3851.png)

Если коммит пройдёт все проверки, рядом с ним появится зелёная галочка:

![](_png/3aa7d9639c9330d8be729300fcd0d08b.png)

![](_png/005b6ebda88b2ecbec959018d6802deb.png)

## GitHub Actions - продвинутые темы

### Triggers - события запуска

Поле `on` определяет, когда workflow запускается. Основные триггеры:

```yaml
on:
  # Push в указанные ветки
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'package.json'
    tags:
      - 'v*'

  # Pull request в указанные ветки
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

  # Ручной запуск из интерфейса GitHub
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [staging, production]
      dry_run:
        description: 'Dry run mode'
        type: boolean
        default: false

  # Запуск по расписанию (cron, UTC)
  schedule:
    - cron: '0 3 * * 1'  # каждый понедельник в 03:00 UTC

  # Запуск через API
  repository_dispatch:
    types: [deploy-trigger]
```

> [!info] Фильтрация по paths
> Фильтр `paths` позволяет запускать workflow только при изменении определённых файлов. Это экономит минуты CI, когда меняются только docs или конфиги.

### Jobs и steps - зависимости и условия

Jobs запускаются параллельно по умолчанию. Для последовательного выполнения используется `needs`:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint  # запустится только после lint
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]  # ждёт завершения обоих
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - run: echo "Deploying..."
```

Условия `if` можно применять и на уровне шагов:

```yaml
steps:
  - name: Run e2e tests
    run: npm run test:e2e
    continue-on-error: true  # не ломает весь job

  - name: Notify on failure
    if: failure()
    run: echo "Previous step failed"

  - name: Always cleanup
    if: always()
    run: rm -rf tmp/

  - name: Only on PR
    if: github.event_name == 'pull_request'
    run: echo "This is a PR"
```

### Matrix strategy - кросс-платформенное тестирование

Matrix создаёт комбинации параметров и запускает job для каждой:

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false  # не останавливать другие при ошибке одного
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18, 20, 22]
        include:
          - os: ubuntu-latest
            node-version: 22
            coverage: true  # дополнительный параметр для одной комбинации
        exclude:
          - os: windows-latest
            node-version: 18  # исключить эту комбинацию
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
      - name: Upload coverage
        if: matrix.coverage
        run: npm run test:coverage
```

> [!important] fail-fast
> По умолчанию `fail-fast: true` - при ошибке в одной комбинации остальные отменяются. Для полного отчёта по совместимости выставляй `false`.

### Reusable workflows - переиспользуемые пайплайны

Reusable workflow определяется через `workflow_call` и вызывается из других workflow. Это позволяет стандартизировать пайплайны между репозиториями.

Определение переиспользуемого workflow:

`.github/workflows/reusable-deploy.yml`

```yaml
name: Reusable Deploy
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      image_tag:
        required: true
        type: string
    secrets:
      KUBE_CONFIG:
        required: true
    outputs:
      deploy_url:
        description: 'Deployed URL'
        value: ${{ jobs.deploy.outputs.url }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to ${{ inputs.environment }}
        id: deploy
        run: |
          echo "Deploying ${{ inputs.image_tag }} to ${{ inputs.environment }}"
          echo "url=https://${{ inputs.environment }}.example.com" >> "$GITHUB_OUTPUT"
```

Вызов из другого workflow:

```yaml
jobs:
  deploy-staging:
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      image_tag: ${{ github.sha }}
    secrets:
      KUBE_CONFIG: ${{ secrets.KUBE_CONFIG_STAGING }}
```

### Composite actions - собственные actions

Composite action объединяет несколько шагов в переиспользуемое действие. Размещается в отдельной директории с `action.yml`:

`.github/actions/setup-and-build/action.yml`

```yaml
name: 'Setup and Build'
description: 'Install deps, lint, test, build'
inputs:
  node-version:
    description: 'Node.js version'
    default: '20'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'
    - run: npm ci
      shell: bash
    - run: npm run lint
      shell: bash
    - run: npm test
      shell: bash
    - run: npm run build
      shell: bash
```

Использование:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/setup-and-build
    with:
      node-version: '22'
```

### Environments - окружения и approval

Environments позволяют настроить правила защиты и ручное подтверждение для деплоя:

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - run: echo "Deploying to production"
```

В настройках репозитория для environment можно задать: required reviewers, wait timer, branch restrictions и environment-specific secrets.

### OIDC - аутентификация без секретов

OIDC позволяет получить короткоживущие токены для облачных провайдеров без хранения долгосрочных credentials в секретах:

```yaml
jobs:
  deploy-aws:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # обязательно для OIDC
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions
          aws-region: eu-west-1
      - run: aws s3 ls  # работает без AWS_ACCESS_KEY_ID
```

> [!summary] Преимущества OIDC
> - Нет долгоживущих секретов для ротации
> - Токены живут минуты, а не месяцы
> - Можно ограничить доступ по repo, branch, environment
> - Поддерживается AWS, GCP, Azure, HashiCorp Vault

### Caching - кэширование зависимостей

Кэширование ускоряет workflow, сохраняя зависимости между запусками:

```yaml
steps:
  - uses: actions/checkout@v4

  # Встроенный cache в setup-node
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'

  # Или ручной cache для более сложных случаев
  - uses: actions/cache@v4
    with:
      path: |
        ~/.npm
        node_modules
      key: deps-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        deps-${{ runner.os }}-

  - run: npm ci
```

Ключи кэша для разных экосистем: Go - `hashFiles('**/go.sum')` + путь `~/go/pkg/mod`, Python - `hashFiles('**/requirements.txt')` + путь `~/.cache/pip`, Docker - `cache-from: type=gha` в `docker/build-push-action`.

### Artifacts - передача данных между jobs

Artifacts позволяют сохранить файлы из одного job и использовать в другом:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 5

  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: ls -la dist/
```

### Self-hosted runners

Self-hosted runners запускаются на собственной инфраструктуре. Это полезно для доступа к приватным сетям, специфическому железу или экономии минут.

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64, gpu]  # labels для выбора runner
    steps:
      - uses: actions/checkout@v4
      - run: nvidia-smi  # доступ к GPU
```

Важно: не используй self-hosted runners в публичных репозиториях - любой PR может выполнить произвольный код. Изолируй runners в VM или контейнеры, очищай рабочую директорию между запусками.

### Concurrency - управление параллельными запусками

Concurrency предотвращает одновременные деплои и экономит ресурсы при быстрых последовательных пушах:

```yaml
# На уровне всего workflow
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true  # отменить предыдущий при новом запуске

# Или на уровне job
jobs:
  deploy:
    concurrency:
      group: production-deploy
      cancel-in-progress: false  # для production - дождаться завершения
```

> [!info] Типичная стратегия
> Для CI-проверок - `cancel-in-progress: true` - экономит ресурсы, отменяя устаревшие запуски. Для production deploy - `cancel-in-progress: false` - гарантирует завершение текущего деплоя.

### Secrets и variables

GitHub поддерживает три уровня секретов и переменных:

- Repository - доступны всем workflows в репозитории
- Environment - доступны только в конкретном environment
- Organization - доступны всем репозиториям организации

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy
        env:
          # Секреты - зашифрованы, маскируются в логах
          API_KEY: ${{ secrets.API_KEY }}
          # Переменные - не зашифрованы, видны в логах
          API_URL: ${{ vars.API_URL }}
        run: curl -H "Authorization: $API_KEY" "$API_URL/deploy"
```

> [!important] Правила работы с секретами
> - Секреты не передаются в workflows из форков
> - Секреты маскируются в логах автоматически
> - Environment secrets имеют приоритет над repository secrets
> - Для ротации используй GitHub API или CLI

### Container jobs и services

Jobs можно запускать внутри Docker-контейнеров. Services поднимают зависимости - базы данных, кэши:

```yaml
jobs:
  integration-test:
    runs-on: ubuntu-latest
    container:
      image: node:20-slim

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://test:test@postgres:5432/testdb
          REDIS_URL: redis://redis:6379
        run: npm run test:integration
```

> [!info] Сетевые имена сервисов
> Когда job запускается в контейнере, сервисы доступны по имени - `postgres`, `redis`. Без контейнера используй `localhost` и проброшенные порты.

### Workflow dispatch - ручной запуск с параметрами

`workflow_dispatch` позволяет запускать workflow вручную с параметрами из UI, CLI или API. Поддерживаемые типы inputs: `string`, `choice`, `boolean`, `number`, `environment`.

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version'
        required: true
        type: string
      environment:
        description: 'Deploy target'
        required: true
        type: choice
        options: [staging, production]
      skip_tests:
        type: boolean
        default: false

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm version ${{ inputs.version }} --no-git-tag-version
      - if: ${{ !inputs.skip_tests }}
        run: npm test
      - run: echo "Deploying ${{ inputs.version }} to ${{ inputs.environment }}"
```

Запуск через CLI: `gh workflow run release.yml -f version=1.2.3 -f environment=staging`

## Production pipeline - полный пример

Пример production-ready пайплайна с lint, тестами, сборкой образа, security-сканированием и деплоем через environments:

```yaml
name: Production Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: pipeline-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ── Lint и статический анализ ──
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  # ── Тесты ──
  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: ci
          POSTGRES_PASSWORD: ci
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Unit tests
        run: npm run test:unit -- --coverage
      - name: Integration tests
        env:
          DATABASE_URL: postgresql://ci:ci@localhost:5432/testdb
        run: npm run test:integration
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  # ── Сборка Docker-образа ──
  build:
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix={{branch}}-
            type=ref,event=branch
            type=semver,pattern={{version}}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name == 'push' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ── Security scan ──
  security:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Trivy - scan filesystem
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          severity: CRITICAL,HIGH
          exit-code: '1'
      - name: Gitleaks - scan for secrets
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ── Deploy to staging ──
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        env:
          IMAGE_TAG: ${{ needs.build.outputs.image_tag }}
        run: |
          echo "Deploying $IMAGE_TAG to staging"
          # kubectl set image deployment/app app=$IMAGE_TAG -n staging
          # kubectl rollout status deployment/app -n staging --timeout=5m
      - name: Smoke test
        run: curl -f https://staging.example.com/health || exit 1

  # ── Deploy to production (с approval) ──
  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production  # reviewers настраиваются в Settings > Environments
      url: https://example.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        env:
          IMAGE_TAG: ${{ needs.build.outputs.image_tag }}
        run: |
          echo "Deploying $IMAGE_TAG to production"
          # kubectl set image deployment/app app=$IMAGE_TAG -n production
          # kubectl rollout status deployment/app -n production --timeout=5m
      - name: Verify deployment
        run: curl -f https://example.com/health || exit 1
      - name: Notify team
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deploy: ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Настраиваем CD - деплой через Netlify

Задеплоить фронтенд-приложение можно через [Netlify](https://app.netlify.com/).

Добавляем новый проект с нашего GitHub и подключаем его в Netlify:

![](_png/d13fe44fa4ebdf2421ac4679b2e10c6b.png)

Netlify берёт доступ к проекту на GitHub и отслеживает его изменения, чтобы деплоить проект автоматически.

![](_png/df0772b75972ac2f5715d5d58ba7c589.png)

И по ссылке можно просмотреть приложение:

![](_png/994af9402604e8e53a6fbf2b6e7a2697.png)

## Jenkins

Jenkins - один из старейших CI/CD инструментов с открытым исходным кодом. Работает по принципу master-agent: master управляет пайплайнами, agents выполняют задачи.

### Jenkinsfile - пайплайн как код

Declarative pipeline описывается в `Jenkinsfile` в корне репозитория:

```groovy
pipeline {
    agent any

    environment {
        REGISTRY = 'registry.example.com'
        IMAGE = "${REGISTRY}/myapp:${BUILD_NUMBER}"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint & Test') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit'
                        junit 'reports/**/*.xml'
                    }
                }
            }
        }

        stage('Build Docker') {
            steps {
                sh "docker build -t ${IMAGE} ."
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh "docker push ${IMAGE}"
                sh "./scripts/deploy.sh staging ${IMAGE}"
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message 'Deploy to production?'
                ok 'Deploy'
            }
            steps {
                sh "docker push ${IMAGE}"
                sh "./scripts/deploy.sh production ${IMAGE}"
            }
        }
    }

    post {
        failure {
            slackSend channel: '#ci-alerts',
                      message: "Build FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        success {
            slackSend channel: '#ci-alerts',
                      message: "Build SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        always {
            cleanWs()
        }
    }
}
```

### Shared Libraries

Shared Libraries позволяют переиспользовать логику между Jenkinsfile разных проектов. Библиотека хранится в отдельном git-репозитории со структурой `vars/` для глобальных функций и `src/` для классов.

Использование в Jenkinsfile проекта:

```groovy
@Library('my-shared-lib') _
buildApp(image: 'registry.example.com/myapp')
```

> [!important] Jenkins в современном стеке
> Jenkins мощный, но требует значительных усилий на поддержку - обновление плагинов, управление agents, бэкапы. Для новых проектов GitHub Actions или GitLab CI часто проще в эксплуатации. Jenkins выбирают при сложных on-premise требованиях или когда уже есть развитая инфраструктура.

## Сравнение CI/CD платформ

| Критерий | GitHub Actions | GitLab CI | Jenkins |
|---|---|---|---|
| Хостинг | SaaS + self-hosted runners | SaaS + self-hosted runners | Только self-hosted |
| Конфигурация | YAML в `.github/workflows/` | YAML в `.gitlab-ci.yml` | Jenkinsfile (Groovy) |
| Начало работы | Мгновенно для GitHub-проектов | Мгновенно для GitLab-проектов | Требует установки и настройки |
| Marketplace | 20000+ готовых actions | Шаблоны CI/CD | 1800+ плагинов |
| Container registry | GitHub Packages (GHCR) | Встроенный | Через плагин |
| Environments | Встроенные с approvals | Встроенные с approvals | Через плагины |
| OIDC | Встроенный | Встроенный | Через плагин |
| Секреты | Repository / Env / Org | Project / Group / Instance | Credentials plugin |
| Стоимость | Бесплатно для public repos, лимиты для private | Бесплатно 400 мин/мес | Бесплатный, но нужен сервер |
| Масштабирование | Авто, managed runners | Авто, managed runners | Ручное управление agents |
| Review apps | Через actions | Встроенные | Через плагины |
| Кривая обучения | Низкая | Низкая | Средняя-высокая |
| Гибкость | Высокая | Высокая | Максимальная |

> [!summary] Как выбрать
> - GitHub Actions - проект на GitHub, команда до 50 человек, стандартные пайплайны
> - GitLab CI - нужен self-hosted git, review apps, встроенный registry, DevSecOps из коробки
> - Jenkins - сложные on-premise требования, нестандартные интеграции, уже существующая инфраструктура Jenkins
