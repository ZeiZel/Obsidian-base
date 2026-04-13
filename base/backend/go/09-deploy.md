---
tags:
  - backend
  - golang
  - go
  - deploy
  - docker
  - kubernetes
  - helm
  - cicd
---

# Деплой Go приложений

Написать код — это половина дела. Вторая половина — доставить его до продакшена надёжно, безопасно и воспроизводимо. В этой главе разберём весь путь Go-приложения от `go build` до работающего кластера Kubernetes с мониторингом, автоскейлингом и CI/CD пайплайном.

Go идеально подходит для контейнеризации: статический бинарник без зависимостей можно запустить в минимальном образе размером несколько мегабайт. Это даёт преимущества в скорости деплоя, потреблении ресурсов и безопасности.

> [!info] Предварительные знания
> Эта глава предполагает знакомство с [[03-networking]] (HTTP-серверы, маршрутизация), [[06-microservices]] (архитектура сервисов) и [[08-tools-and-ecosystem]] (инструменты Go-разработчика).

---

## 1. Сборка Go приложений

### Базовая сборка

Go компилирует код в единый бинарный файл. Это главное преимущество для деплоя — не нужно устанавливать runtime, виртуальные машины или интерпретаторы.

```bash
# Простая сборка
go build -o ./bin/myapp ./cmd/myapp

# Запуск
./bin/myapp
```

### Статическая сборка

По умолчанию Go может линковать некоторые системные библиотеки динамически (через CGO). Для контейнеров лучше собирать полностью статический бинарник:

```bash
# Отключаем CGO для полностью статического бинарника
CGO_ENABLED=0 go build -o ./bin/myapp ./cmd/myapp
```

> [!warning] CGO_ENABLED=0
> Если ваш код или зависимости используют CGO (например, SQLite через `mattn/go-sqlite3`), отключение CGO сломает сборку. В таком случае используйте `alpine` с `musl` или собирайте с `CGO_ENABLED=1` и `--static` флагами линковщика.

### Флаги линковщика

Флаги `-ldflags` позволяют уменьшить размер бинарника и встроить информацию о сборке:

```bash
# -s убирает таблицу символов
# -w убирает DWARF отладочную информацию
# Результат: бинарник на 20-30% меньше
CGO_ENABLED=0 go build \
  -ldflags="-s -w" \
  -o ./bin/myapp ./cmd/myapp
```

Встраивание информации о версии через `-X`:

```go
// internal/version/version.go
package version

// Переменные, которые будут установлены при сборке
var (
	Version   = "dev"     // версия приложения
	BuildTime = "unknown" // время сборки
	GitCommit = "unknown" // хеш коммита
)
```

```bash
# Устанавливаем переменные при сборке
CGO_ENABLED=0 go build \
  -ldflags="-s -w \
    -X github.com/myorg/myapp/internal/version.Version=1.2.3 \
    -X github.com/myorg/myapp/internal/version.BuildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
    -X github.com/myorg/myapp/internal/version.GitCommit=$(git rev-parse --short HEAD)" \
  -o ./bin/myapp ./cmd/myapp
```

```go
// cmd/myapp/main.go
package main

import (
	"fmt"
	"github.com/myorg/myapp/internal/version"
)

func main() {
	// Выводим информацию о сборке
	fmt.Printf("Version: %s\n", version.Version)
	fmt.Printf("Build:   %s\n", version.BuildTime)
	fmt.Printf("Commit:  %s\n", version.GitCommit)
}
```

### Кросс-компиляция

Go поддерживает кросс-компиляцию «из коробки» — можно собирать бинарники для любой платформы с любой машины:

```bash
# Сборка под Linux (для Docker/серверов)
GOOS=linux GOARCH=amd64 go build -o ./bin/myapp-linux ./cmd/myapp

# Сборка под macOS (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o ./bin/myapp-darwin ./cmd/myapp

# Сборка под Windows
GOOS=windows GOARCH=amd64 go build -o ./bin/myapp.exe ./cmd/myapp
```

#### Таблица популярных комбинаций GOOS/GOARCH

| GOOS      | GOARCH   | Описание                                  |
| --------- | -------- | ----------------------------------------- |
| `linux`   | `amd64`  | Серверы, Docker (x86-64)                  |
| `linux`   | `arm64`  | AWS Graviton, Raspberry Pi 4              |
| `linux`   | `arm`    | Raspberry Pi 3 и старше                   |
| `darwin`  | `amd64`  | macOS (Intel)                             |
| `darwin`  | `arm64`  | macOS (Apple Silicon M1/M2/M3)            |
| `windows` | `amd64`  | Windows x86-64                            |
| `windows` | `arm64`  | Windows on ARM                            |
| `freebsd` | `amd64`  | FreeBSD серверы                           |
| `js`      | `wasm`   | WebAssembly (запуск в браузере)           |
| `wasip1`  | `wasm`   | WASI (серверный WebAssembly)              |

### Build tags

Build tags позволяют включать или исключать файлы из сборки по условию:

```go
//go:build linux && amd64

package mypackage

// Этот файл компилируется только для linux/amd64
func platformSpecific() string {
	return "Linux AMD64"
}
```

```go
//go:build !production

package mypackage

// Этот файл НЕ включается при сборке с тегом production
func debugInfo() {
	fmt.Println("Debug mode enabled")
}
```

```bash
# Сборка с тегом production
go build -tags production -o ./bin/myapp ./cmd/myapp
```

### Makefile для сборки

На практике команды сборки выносят в `Makefile`:

```makefile
# Переменные
APP_NAME := myapp
VERSION := $(shell git describe --tags --always --dirty)
BUILD_TIME := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
GIT_COMMIT := $(shell git rev-parse --short HEAD)
LDFLAGS := -s -w \
  -X github.com/myorg/$(APP_NAME)/internal/version.Version=$(VERSION) \
  -X github.com/myorg/$(APP_NAME)/internal/version.BuildTime=$(BUILD_TIME) \
  -X github.com/myorg/$(APP_NAME)/internal/version.GitCommit=$(GIT_COMMIT)

# Сборка для текущей платформы
.PHONY: build
build:
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o ./bin/$(APP_NAME) ./cmd/$(APP_NAME)

# Сборка для Linux (для Docker)
.PHONY: build-linux
build-linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o ./bin/$(APP_NAME)-linux-amd64 ./cmd/$(APP_NAME)

# Сборка для всех платформ
.PHONY: build-all
build-all:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o ./bin/$(APP_NAME)-linux-amd64 ./cmd/$(APP_NAME)
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -o ./bin/$(APP_NAME)-linux-arm64 ./cmd/$(APP_NAME)
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o ./bin/$(APP_NAME)-darwin-amd64 ./cmd/$(APP_NAME)
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -o ./bin/$(APP_NAME)-darwin-arm64 ./cmd/$(APP_NAME)

# Очистка
.PHONY: clean
clean:
	rm -rf ./bin
```

###### 🏠 Домашнее задание

1. Создайте пакет `internal/version` с переменными `Version`, `BuildTime`, `GitCommit`. Напишите `Makefile`, который устанавливает их при сборке. Добавьте endpoint `/version`, который возвращает эту информацию в JSON.
2. Соберите бинарник с `CGO_ENABLED=0 -ldflags="-s -w"` и без флагов. Сравните размеры (`ls -lh`). Запустите `file` на обоих — в чём разница?
3. Реализуйте build tag `//go:build debug`, который включает дополнительное логирование. Соберите с `-tags debug` и без — проверьте поведение.

---

## 2. Dockerfile для Go

### Multi-stage build

Multi-stage build — стандартный паттерн для Go. Первый этап (builder) содержит Go toolchain и компилирует код. Второй этап (runtime) содержит только готовый бинарник.

### Вариант 1: Alpine (рекомендуется для начала)

```dockerfile
# ===== Этап сборки =====
FROM golang:1.22-alpine AS builder

# Устанавливаем необходимые инструменты
RUN apk add --no-cache git ca-certificates

# Рабочая директория
WORKDIR /app

# Копируем файлы зависимостей отдельно для кеширования слоёв
# Docker кеширует слои — если go.mod не изменился, зависимости не скачиваются заново
COPY go.mod go.sum ./
RUN go mod download

# Копируем весь исходный код
COPY . .

# Собираем статический бинарник
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/bin/myapp ./cmd/myapp

# ===== Этап выполнения =====
FROM alpine:3.19

# Устанавливаем корневые сертификаты для HTTPS-запросов
RUN apk add --no-cache ca-certificates tzdata

# Создаём непривилегированного пользователя
RUN adduser -D -g '' appuser

# Копируем бинарник из этапа сборки
COPY --from=builder /app/bin/myapp /usr/local/bin/myapp

# Копируем конфигурацию (если есть)
# COPY --from=builder /app/configs /etc/myapp

# Переключаемся на непривилегированного пользователя
USER appuser

# Порт приложения
EXPOSE 8080

# Точка входа
ENTRYPOINT ["myapp"]
```

> [!tip] Кеширование слоёв Docker
> Порядок инструкций `COPY` критически важен. Сначала копируем `go.mod` и `go.sum`, затем запускаем `go mod download`. Если зависимости не изменились, Docker использует кеш. Только потом копируем исходный код. Это экономит минуты при каждой сборке.

### Вариант 2: Scratch (минимальный размер)

```dockerfile
# ===== Этап сборки =====
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Важно: статическая сборка обязательна для scratch
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/bin/myapp ./cmd/myapp

# ===== Этап выполнения =====
# scratch — пустой образ, ничего не содержит
FROM scratch

# Копируем сертификаты из builder (нужны для HTTPS)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Копируем информацию о часовых поясах
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Копируем passwd для USER nobody
COPY --from=builder /etc/passwd /etc/passwd

# Копируем бинарник
COPY --from=builder /app/bin/myapp /myapp

# Запускаем от nobody
USER nobody

EXPOSE 8080

ENTRYPOINT ["/myapp"]
```

> [!warning] Ограничения scratch
> В scratch-образе нет шелла, нет пакетного менеджера, нет утилит. Нельзя зайти внутрь контейнера через `docker exec -it ... sh`. Отладка затруднена. Используйте scratch только когда уверены в стабильности приложения.

### Вариант 3: Distroless (компромисс)

```dockerfile
# ===== Этап сборки =====
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/bin/myapp ./cmd/myapp

# ===== Этап выполнения =====
# Distroless: минимальный образ от Google с базовыми файлами
FROM gcr.io/distroless/static-debian12

# Копируем бинарник
COPY --from=builder /app/bin/myapp /myapp

# Distroless уже использует nonroot пользователя
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/myapp"]
```

#### Сравнение размеров образов

| Базовый образ          | Размер  | Shell | Пакетный менеджер | Отладка |
| ---------------------- | ------- | ----- | ------------------ | ------- |
| `alpine:3.19`          | ~15 MB  | Да    | apk                | Удобная |
| `scratch`              | ~0 MB   | Нет   | Нет                | Нет     |
| `distroless/static`    | ~2 MB   | Нет   | Нет                | Ограничена |
| `ubuntu:22.04`         | ~77 MB  | Да    | apt                | Удобная |

### Файл .dockerignore

Создайте `.dockerignore`, чтобы не копировать лишние файлы в контекст сборки:

```dockerignore
# Бинарники
bin/
dist/

# Git
.git
.gitignore

# IDE
.idea/
.vscode/
*.swp
*.swo

# Docker
Dockerfile
docker-compose*.yml
.dockerignore

# Тесты и документация
*_test.go
docs/
README.md

# Переменные окружения
.env
.env.*

# Временные файлы
tmp/
*.tmp
```

###### 🏠 Домашнее задание

1. Напишите три варианта `Dockerfile` (alpine, scratch, distroless) для своего Go-приложения. Соберите все три образа и сравните размеры через `docker images`.
2. Попробуйте зайти в каждый контейнер через `docker exec -it <id> sh`. В каких случаях это работает?
3. Намеренно уберите `COPY go.mod go.sum ./` и `RUN go mod download` — копируйте всё сразу. Измените один `.go` файл и пересоберите. Заметьте разницу во времени сборки.

---

## 3. Docker Compose для локальной разработки

Docker Compose позволяет запустить всё окружение одной командой: приложение, базу данных, кеш, брокер сообщений.

### Полный docker-compose.yml

```yaml
# docker-compose.yml
version: "3.8"

services:
  # ===== Приложение =====
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"  # HTTP API
      - "9090:9090"  # Метрики Prometheus
    environment:
      - APP_ENV=development
      - APP_PORT=8080
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=myapp
      - DB_PASSWORD=secret
      - DB_NAME=myapp_dev
      - DB_SSLMODE=disable
      - REDIS_URL=redis://redis:6379/0
      - NATS_URL=nats://nats:4222
      - LOG_LEVEL=debug
    depends_on:
      postgres:
        condition: service_healthy  # Ждём, пока БД будет готова
      redis:
        condition: service_healthy
      nats:
        condition: service_started
    restart: unless-stopped
    networks:
      - app-network

  # ===== PostgreSQL =====
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp_dev
    volumes:
      - postgres-data:/var/lib/postgresql/data  # Данные сохраняются между перезапусками
      - ./migrations/init.sql:/docker-entrypoint-initdb.d/init.sql  # Начальная схема
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myapp -d myapp_dev"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - app-network

  # ===== Redis =====
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - app-network

  # ===== NATS =====
  nats:
    image: nats:2.10-alpine
    ports:
      - "4222:4222"   # Клиентский порт
      - "8222:8222"   # Мониторинг
    command: ["--js", "--sd", "/data"]  # Включаем JetStream
    volumes:
      - nats-data:/data
    networks:
      - app-network

  # ===== Миграции =====
  migrate:
    image: migrate/migrate:v4.17.0
    volumes:
      - ./migrations:/migrations
    command: [
      "-path", "/migrations",
      "-database", "postgres://myapp:secret@postgres:5432/myapp_dev?sslmode=disable",
      "up"
    ]
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    # Миграция запускается один раз и завершается
    restart: "no"

# Именованные тома для персистентности данных
volumes:
  postgres-data:
  redis-data:
  nats-data:

# Общая сеть для всех сервисов
networks:
  app-network:
    driver: bridge
```

### Команды Docker Compose

```bash
# Запуск всех сервисов в фоне
docker compose up -d

# Запуск с пересборкой образа
docker compose up -d --build

# Просмотр логов всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f app

# Остановка всех сервисов
docker compose down

# Остановка с удалением данных (томов)
docker compose down -v

# Перезапуск одного сервиса
docker compose restart app

# Выполнение команды внутри контейнера
docker compose exec postgres psql -U myapp -d myapp_dev

# Статус сервисов
docker compose ps
```

### Hot-reload с Air

Для разработки удобно использовать [[08-tools-and-ecosystem|Air]] — утилиту, которая автоматически перезапускает приложение при изменении файлов:

```yaml
# docker-compose.dev.yml — переопределение для разработки
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev  # Отдельный Dockerfile для разработки
    volumes:
      - .:/app  # Монтируем исходный код для hot-reload
    command: ["air", "-c", ".air.toml"]  # Запускаем через Air
```

```dockerfile
# Dockerfile.dev — для разработки с Air
FROM golang:1.22-alpine

RUN apk add --no-cache git

# Устанавливаем Air для hot-reload
RUN go install github.com/air-verse/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

# Не копируем исходники — они монтируются через volume
EXPOSE 8080

CMD ["air", "-c", ".air.toml"]
```

```toml
# .air.toml — конфигурация Air
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/main ./cmd/myapp"
  bin = "./tmp/main"
  delay = 1000  # миллисекунды задержки перед перезапуском
  exclude_dir = ["tmp", "vendor", "node_modules", "bin"]
  exclude_regex = ["_test\\.go$"]
  include_ext = ["go", "toml", "yaml"]

[log]
  time = false

[misc]
  clean_on_exit = true
```

```bash
# Запуск dev-окружения с hot-reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

###### 🏠 Домашнее задание

1. Напишите полный `docker-compose.yml` для своего приложения с PostgreSQL, Redis и миграциями. Убедитесь, что `depends_on` с `condition: service_healthy` работает корректно.
2. Настройте hot-reload с Air. Измените файл и убедитесь, что приложение перезапустилось автоматически.
3. Добавьте сервис `adminer` (веб-интерфейс для БД) в docker-compose. Подключитесь к базе через браузер.

---

## 4. Kubernetes

Kubernetes (K8s) — платформа оркестрации контейнеров. Она управляет запуском, масштабированием и восстановлением приложений.

### Основные концепции

- **Pod** — минимальная единица деплоя, содержит один или несколько контейнеров
- **Deployment** — управляет подами: количество реплик, стратегия обновления, откат
- **Service** — стабильный сетевой адрес для группы подов
- **ConfigMap** — конфигурация (не секретная)
- **Secret** — секреты (пароли, ключи)
- **HPA** — горизонтальный автоскейлер
- **Ingress** — маршрутизация внешнего трафика

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
    version: v1
spec:
  # Количество реплик (подов)
  replicas: 3

  # Стратегия обновления
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1      # Максимум 1 под может быть недоступен при обновлении
      maxSurge: 1             # Максимум 1 дополнительный под при обновлении

  # Селектор для выбора подов
  selector:
    matchLabels:
      app: myapp

  template:
    metadata:
      labels:
        app: myapp
        version: v1
      annotations:
        prometheus.io/scrape: "true"    # Prometheus будет скрейпить метрики
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      # Время на graceful shutdown
      terminationGracePeriodSeconds: 30

      containers:
        - name: myapp
          image: registry.example.com/myapp:1.2.3
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP

          # Переменные окружения из ConfigMap и Secret
          envFrom:
            - configMapRef:
                name: myapp-config
            - secretRef:
                name: myapp-secrets

          # Дополнительные переменные
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP

          # Ресурсы: запросы и лимиты
          resources:
            requests:
              cpu: 100m       # 0.1 ядра — гарантированный минимум
              memory: 128Mi   # 128 МБ — гарантированный минимум
            limits:
              cpu: 500m       # 0.5 ядра — максимум
              memory: 256Mi   # 256 МБ — при превышении OOMKill

          # Проверка готовности (readiness)
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3

          # Проверка живости (liveness)
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 3
            failureThreshold: 3

          # Проверка запуска (startup)
          startupProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 0
            periodSeconds: 5
            failureThreshold: 30  # 30 * 5 = 150 секунд на запуск

      # Секреты для доступа к Docker registry
      imagePullSecrets:
        - name: registry-credentials
```

### Service

```yaml
# k8s/service.yaml
---
# ClusterIP — доступен только внутри кластера
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 80            # Порт сервиса
      targetPort: http    # Порт контейнера (ссылка на имя порта)
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: metrics
      protocol: TCP
  selector:
    app: myapp

---
# NodePort — доступен извне через порт на каждом узле
apiVersion: v1
kind: Service
metadata:
  name: myapp-nodeport
  namespace: production
spec:
  type: NodePort
  ports:
    - name: http
      port: 80
      targetPort: http
      nodePort: 30080     # Порт на каждом узле кластера (30000-32767)
  selector:
    app: myapp

---
# LoadBalancer — создаёт внешний балансировщик (в облаке)
apiVersion: v1
kind: Service
metadata:
  name: myapp-lb
  namespace: production
  annotations:
    # Аннотации зависят от облака
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  ports:
    - name: http
      port: 80
      targetPort: http
  selector:
    app: myapp
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
  namespace: production
data:
  # Несекретная конфигурация
  APP_ENV: "production"
  APP_PORT: "8080"
  DB_HOST: "postgres.production.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "myapp"
  DB_SSLMODE: "require"
  REDIS_URL: "redis://redis.production.svc.cluster.local:6379/0"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
```

### Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
  namespace: production
type: Opaque
data:
  # Значения в base64: echo -n "value" | base64
  DB_USER: bXlhcHA=             # myapp
  DB_PASSWORD: c3VwZXJzZWNyZXQ=  # supersecret
  JWT_SECRET: bXktand0LXNlY3JldC1rZXk=  # my-jwt-secret-key
```

> [!warning] Секреты в Kubernetes
> `Secret` в K8s хранит данные в base64 — это НЕ шифрование. Любой, кто имеет доступ к кластеру, может прочитать секреты. Для продакшена используйте Sealed Secrets, HashiCorp Vault или AWS Secrets Manager.

### HPA (Horizontal Pod Autoscaler)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  
  # Границы масштабирования
  minReplicas: 2
  maxReplicas: 10
  
  # Метрики для автоскейлинга
  metrics:
    # По CPU — если среднее использование > 70%
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    
    # По памяти — если среднее использование > 80%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    
    # По пользовательской метрике (requests per second)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"

  # Поведение скейлинга
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # Ждать 60 сек перед увеличением
      policies:
        - type: Percent
          value: 50                     # Увеличивать не более чем на 50%
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # Ждать 5 минут перед уменьшением
      policies:
        - type: Percent
          value: 25                     # Уменьшать не более чем на 25%
          periodSeconds: 60
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  namespace: production
  annotations:
    # Nginx Ingress Controller
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    # Cert-Manager для автоматических TLS-сертификатов
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: myapp-tls  # Cert-Manager создаст этот Secret автоматически
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp
                port:
                  name: http
```

### Команды kubectl

```bash
# Применение манифестов
kubectl apply -f k8s/

# Или по одному
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Просмотр ресурсов
kubectl get pods -n production
kubectl get deployments -n production
kubectl get services -n production
kubectl get hpa -n production

# Детальная информация о поде
kubectl describe pod myapp-abc123 -n production

# Логи пода
kubectl logs myapp-abc123 -n production
kubectl logs -f myapp-abc123 -n production           # Следить в реальном времени
kubectl logs myapp-abc123 -n production --previous    # Логи предыдущего контейнера

# Проброс порта для отладки
kubectl port-forward svc/myapp 8080:80 -n production

# Вход в контейнер
kubectl exec -it myapp-abc123 -n production -- sh

# Масштабирование вручную
kubectl scale deployment myapp --replicas=5 -n production

# Откат к предыдущей версии
kubectl rollout undo deployment myapp -n production

# История деплоев
kubectl rollout history deployment myapp -n production

# Статус обновления
kubectl rollout status deployment myapp -n production
```

###### 🏠 Домашнее задание

1. Напишите полный набор K8s-манифестов (Deployment, Service, ConfigMap, Secret, HPA, Ingress) для своего приложения. Задеплойте в minikube.
2. Проверьте, что HPA работает: создайте нагрузку (`hey -z 60s -c 100 http://...`) и наблюдайте за масштабированием через `kubectl get hpa -w`.
3. Выполните rolling update: измените версию образа и наблюдайте процесс через `kubectl rollout status`. Затем выполните откат через `kubectl rollout undo`.

---

## 5. Helm chart для Go приложения

Helm — пакетный менеджер для Kubernetes. Вместо нескольких YAML-файлов создаётся один chart с шаблонами и параметрами.

### Структура Helm chart

```
helm/myapp/
├── Chart.yaml          # Метаданные чарта
├── values.yaml         # Параметры по умолчанию
├── templates/
│   ├── _helpers.tpl    # Вспомогательные шаблоны
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   └── NOTES.txt       # Сообщение после установки
└── .helmignore         # Файлы для игнорирования
```

### Chart.yaml

```yaml
# helm/myapp/Chart.yaml
apiVersion: v2
name: myapp
description: Go микросервис для управления задачами
type: application
version: 0.1.0        # Версия чарта
appVersion: "1.2.3"   # Версия приложения
maintainers:
  - name: DevTeam
    email: dev@example.com
```

### values.yaml

```yaml
# helm/myapp/values.yaml

# Количество реплик
replicaCount: 2

# Образ
image:
  repository: registry.example.com/myapp
  tag: "latest"         # Переопределяется при деплое
  pullPolicy: IfNotPresent

# Секреты для Docker registry
imagePullSecrets:
  - name: registry-credentials

# Имя сервиса (переопределение)
nameOverride: ""
fullnameOverride: ""

# Конфигурация приложения
config:
  appEnv: production
  appPort: "8080"
  logLevel: info
  logFormat: json
  dbHost: postgres.production.svc.cluster.local
  dbPort: "5432"
  dbName: myapp
  dbSSLMode: require
  redisURL: "redis://redis.production.svc.cluster.local:6379/0"

# Секреты
secrets:
  dbUser: myapp
  dbPassword: ""         # Устанавливается при деплое через --set
  jwtSecret: ""

# Сервис
service:
  type: ClusterIP
  port: 80
  metricsPort: 9090

# Ingress
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - api.example.com

# Ресурсы
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

# Автоскейлинг
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

# Пробы
probes:
  liveness:
    path: /health
    initialDelaySeconds: 10
    periodSeconds: 15
  readiness:
    path: /ready
    initialDelaySeconds: 5
    periodSeconds: 10
  startup:
    path: /health
    failureThreshold: 30
    periodSeconds: 5

# Дополнительные аннотации подов
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"

# Node selector
nodeSelector: {}

# Tolerations
tolerations: []

# Affinity
affinity: {}
```

### templates/_helpers.tpl

```yaml
# helm/myapp/templates/_helpers.tpl
{{- /* Полное имя ресурса */ -}}
{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- /* Имя чарта */ -}}
{{- define "myapp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- /* Общие метки */ -}}
{{- define "myapp.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- /* Метки для selector */ -}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

### templates/deployment.yaml

```yaml
# helm/myapp/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        {{- toYaml .Values.podAnnotations | nindent 8 }}
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      terminationGracePeriodSeconds: 30
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.config.appPort }}
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP
          envFrom:
            - configMapRef:
                name: {{ include "myapp.fullname" . }}
            - secretRef:
                name: {{ include "myapp.fullname" . }}
          livenessProbe:
            httpGet:
              path: {{ .Values.probes.liveness.path }}
              port: http
            initialDelaySeconds: {{ .Values.probes.liveness.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.liveness.periodSeconds }}
          readinessProbe:
            httpGet:
              path: {{ .Values.probes.readiness.path }}
              port: http
            initialDelaySeconds: {{ .Values.probes.readiness.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.readiness.periodSeconds }}
          startupProbe:
            httpGet:
              path: {{ .Values.probes.startup.path }}
              port: http
            failureThreshold: {{ .Values.probes.startup.failureThreshold }}
            periodSeconds: {{ .Values.probes.startup.periodSeconds }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### templates/service.yaml

```yaml
# helm/myapp/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - name: http
      port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
    - name: metrics
      port: {{ .Values.service.metricsPort }}
      targetPort: metrics
      protocol: TCP
  selector:
    {{- include "myapp.selectorLabels" . | nindent 4 }}
```

### templates/configmap.yaml

```yaml
# helm/myapp/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
data:
  APP_ENV: {{ .Values.config.appEnv | quote }}
  APP_PORT: {{ .Values.config.appPort | quote }}
  LOG_LEVEL: {{ .Values.config.logLevel | quote }}
  LOG_FORMAT: {{ .Values.config.logFormat | quote }}
  DB_HOST: {{ .Values.config.dbHost | quote }}
  DB_PORT: {{ .Values.config.dbPort | quote }}
  DB_NAME: {{ .Values.config.dbName | quote }}
  DB_SSLMODE: {{ .Values.config.dbSSLMode | quote }}
  REDIS_URL: {{ .Values.config.redisURL | quote }}
```

### templates/secret.yaml

```yaml
# helm/myapp/templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
type: Opaque
data:
  DB_USER: {{ .Values.secrets.dbUser | b64enc | quote }}
  DB_PASSWORD: {{ .Values.secrets.dbPassword | b64enc | quote }}
  JWT_SECRET: {{ .Values.secrets.jwtSecret | b64enc | quote }}
```

### templates/hpa.yaml

```yaml
# helm/myapp/templates/hpa.yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "myapp.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
```

### templates/ingress.yaml

```yaml
# helm/myapp/templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "myapp.fullname" $ }}
                port:
                  name: http
          {{- end }}
    {{- end }}
{{- end }}
```

### Команды Helm

```bash
# Установка чарта
helm install myapp ./helm/myapp \
  --namespace production \
  --create-namespace \
  --set secrets.dbPassword=supersecret \
  --set secrets.jwtSecret=my-jwt-key \
  --set image.tag=1.2.3

# Обновление (upgrade)
helm upgrade myapp ./helm/myapp \
  --namespace production \
  --set image.tag=1.2.4

# Просмотр установленных релизов
helm list -n production

# Откат к предыдущей версии
helm rollback myapp 1 -n production

# Удаление
helm uninstall myapp -n production

# Проверка шаблонов без установки
helm template myapp ./helm/myapp \
  --set secrets.dbPassword=test \
  --set secrets.jwtSecret=test

# Валидация чарта
helm lint ./helm/myapp

# Использование отдельного файла values
helm install myapp ./helm/myapp \
  -f values-production.yaml \
  --namespace production
```

###### 🏠 Домашнее задание

1. Создайте полный Helm chart для своего Go-приложения. Проверьте через `helm template` и `helm lint`.
2. Установите chart в minikube. Обновите версию через `helm upgrade --set image.tag=v2`. Выполните `helm rollback`.
3. Создайте отдельный `values-staging.yaml` с другими параметрами (1 реплика, debug логирование). Установите в отдельный namespace.

---

## 6. CI/CD с GitHub Actions

CI/CD (Continuous Integration / Continuous Deployment) автоматизирует процесс проверки, сборки и деплоя кода.

### Полный пайплайн

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    tags: ["v*"]           # Запуск при создании тега версии
  pull_request:
    branches: [main]

# Переменные окружения для всех шагов
env:
  GO_VERSION: "1.22"
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

# Отменяем предыдущие запуски для того же PR/ветки
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ===== Линтинг =====
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true    # Кешируем Go модули

      - name: Run golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: latest
          args: --timeout=5m

  # ===== Тесты =====
  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint   # Запускаем после линтинга

    # Поднимаем сервисы для интеграционных тестов
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: myapp_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Run migrations
        run: |
          go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
          migrate -path ./migrations -database "postgres://test:test@localhost:5432/myapp_test?sslmode=disable" up
        env:
          GOFLAGS: "-mod=mod"

      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: test
          DB_PASSWORD: test
          DB_NAME: myapp_test
          DB_SSLMODE: disable
          REDIS_URL: redis://localhost:6379/0

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.out
          token: ${{ secrets.CODECOV_TOKEN }}

  # ===== Сборка бинарника =====
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Build binary
        run: |
          CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
            -ldflags="-s -w \
              -X github.com/myorg/myapp/internal/version.Version=${{ github.ref_name }} \
              -X github.com/myorg/myapp/internal/version.BuildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
              -X github.com/myorg/myapp/internal/version.GitCommit=${{ github.sha }}" \
            -o ./bin/myapp ./cmd/myapp

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: myapp-binary
          path: ./bin/myapp

  # ===== Сборка и публикация Docker образа =====
  docker:
    name: Docker Build & Push
    runs-on: ubuntu-latest
    needs: build
    # Только для main ветки и тегов
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')

    permissions:
      contents: read
      packages: write   # Для публикации в GHCR

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha     # Используем GitHub Actions кеш
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64  # Multi-arch сборка

  # ===== Деплой =====
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: docker
    # Только для тегов версий
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production   # Требуется одобрение для production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Helm
        uses: azure/setup-helm@v3

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBECONFIG }}

      - name: Deploy with Helm
        run: |
          helm upgrade --install myapp ./helm/myapp \
            --namespace production \
            --create-namespace \
            --set image.tag=${{ github.ref_name }} \
            --set secrets.dbPassword=${{ secrets.DB_PASSWORD }} \
            --set secrets.jwtSecret=${{ secrets.JWT_SECRET }} \
            --wait \
            --timeout 5m

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/myapp -n production --timeout=300s
          kubectl get pods -n production -l app.kubernetes.io/name=myapp
```

> [!tip] Секреты GitHub Actions
> Храните чувствительные данные в **Settings > Secrets and variables > Actions**. Секреты маскируются в логах и недоступны для форков.

###### 🏠 Домашнее задание

1. Настройте GitHub Actions для своего Go-проекта. Добейтесь зелёной галочки на каждый пуш.
2. Добавьте публикацию Docker-образа в GitHub Container Registry (GHCR). Проверьте, что образ появляется в разделе Packages.
3. Настройте Environment Protection Rules для production — требуйте ручное одобрение перед деплоем.

---

## 7. CI/CD с GitLab CI

### Полный пайплайн

```yaml
# .gitlab-ci.yml

# Этапы пайплайна
stages:
  - lint
  - test
  - build
  - docker
  - deploy

# Глобальные переменные
variables:
  GO_VERSION: "1.22"
  DOCKER_REGISTRY: registry.gitlab.com
  IMAGE_NAME: $CI_REGISTRY_IMAGE
  # Для Docker-in-Docker
  DOCKER_HOST: tcp://docker:2376
  DOCKER_TLS_CERTDIR: "/certs"
  DOCKER_TLS_VERIFY: 1
  DOCKER_CERT_PATH: "$DOCKER_TLS_CERTDIR/client"

# Глобальный кеш Go модулей
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .go/pkg/mod/
    - .go/cache/

# Перед каждым шагом настраиваем переменные Go
.go-setup: &go-setup
  image: golang:${GO_VERSION}-alpine
  before_script:
    - export GOPATH=$CI_PROJECT_DIR/.go
    - export GOCACHE=$CI_PROJECT_DIR/.go/cache
    - mkdir -p $GOPATH $GOCACHE

# ===== Линтинг =====
lint:
  stage: lint
  <<: *go-setup
  script:
    - go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
    - golangci-lint run --timeout=5m ./...
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

# ===== Тесты =====
test:
  stage: test
  <<: *go-setup
  # Сервисы для интеграционных тестов
  services:
    - name: postgres:16-alpine
      alias: postgres
      variables:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: myapp_test
    - name: redis:7-alpine
      alias: redis
  variables:
    DB_HOST: postgres
    DB_PORT: "5432"
    DB_USER: test
    DB_PASSWORD: test
    DB_NAME: myapp_test
    DB_SSLMODE: disable
    REDIS_URL: "redis://redis:6379/0"
  script:
    # Ждём, пока PostgreSQL будет готов
    - apk add --no-cache postgresql-client
    - until pg_isready -h postgres -U test; do sleep 2; done
    # Запускаем миграции
    - go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
    - migrate -path ./migrations -database "postgres://test:test@postgres:5432/myapp_test?sslmode=disable" up
    # Запускаем тесты
    - go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
    - go tool cover -func=coverage.out
  coverage: '/total:\s+\(statements\)\s+(\d+\.\d+)%/'  # Извлечение покрытия для GitLab
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.out
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

# ===== Сборка бинарника =====
build:
  stage: build
  <<: *go-setup
  script:
    - |
      CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
        -ldflags="-s -w \
          -X github.com/myorg/myapp/internal/version.Version=${CI_COMMIT_TAG:-dev} \
          -X github.com/myorg/myapp/internal/version.BuildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
          -X github.com/myorg/myapp/internal/version.GitCommit=${CI_COMMIT_SHORT_SHA}" \
        -o ./bin/myapp ./cmd/myapp
  artifacts:
    paths:
      - bin/myapp
    expire_in: 1 hour
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_TAG

# ===== Docker образ =====
docker:
  stage: docker
  image: docker:24
  services:
    - docker:24-dind    # Docker-in-Docker
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    # Сборка с кешированием
    - docker pull $IMAGE_NAME:latest || true
    - |
      docker build \
        --cache-from $IMAGE_NAME:latest \
        --tag $IMAGE_NAME:$CI_COMMIT_SHORT_SHA \
        --tag $IMAGE_NAME:latest \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        .
    - docker push $IMAGE_NAME:$CI_COMMIT_SHORT_SHA
    - docker push $IMAGE_NAME:latest
    # Тегируем версию, если есть тег
    - |
      if [ -n "$CI_COMMIT_TAG" ]; then
        docker tag $IMAGE_NAME:$CI_COMMIT_SHORT_SHA $IMAGE_NAME:$CI_COMMIT_TAG
        docker push $IMAGE_NAME:$CI_COMMIT_TAG
      fi
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_TAG

# ===== Деплой в staging =====
deploy_staging:
  stage: deploy
  image: alpine/helm:3.14
  before_script:
    - apk add --no-cache kubectl
    - echo "$KUBECONFIG_STAGING" | base64 -d > /tmp/kubeconfig
    - export KUBECONFIG=/tmp/kubeconfig
  script:
    - |
      helm upgrade --install myapp ./helm/myapp \
        --namespace staging \
        --create-namespace \
        --set image.tag=$CI_COMMIT_SHORT_SHA \
        --set config.appEnv=staging \
        --set autoscaling.enabled=false \
        --set replicaCount=1 \
        --wait \
        --timeout 5m
    - kubectl rollout status deployment/myapp -n staging --timeout=300s
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ===== Деплой в production =====
deploy_production:
  stage: deploy
  image: alpine/helm:3.14
  before_script:
    - apk add --no-cache kubectl
    - echo "$KUBECONFIG_PRODUCTION" | base64 -d > /tmp/kubeconfig
    - export KUBECONFIG=/tmp/kubeconfig
  script:
    - |
      helm upgrade --install myapp ./helm/myapp \
        --namespace production \
        --create-namespace \
        --set image.tag=$CI_COMMIT_TAG \
        --set secrets.dbPassword=$DB_PASSWORD \
        --set secrets.jwtSecret=$JWT_SECRET \
        --wait \
        --timeout 5m
    - kubectl rollout status deployment/myapp -n production --timeout=300s
  environment:
    name: production
    url: https://api.example.com
  rules:
    - if: $CI_COMMIT_TAG   # Только при теге
  when: manual              # Ручной запуск
```

###### 🏠 Домашнее задание

1. Настройте GitLab CI для своего проекта. Убедитесь, что пайплайн проходит через все стадии.
2. Сравните GitHub Actions и GitLab CI: какие преимущества и недостатки у каждого? Какой подходит лучше для вашей команды?
3. Добавьте стадию `security` с `govulncheck` для проверки уязвимостей в зависимостях.

---

## 8. Observability в проде

Наблюдаемость (observability) — это три столпа: метрики, трейсинг и логи. Без них продакшен-система — чёрный ящик.

### Метрики: Prometheus + Grafana

Prometheus собирает метрики с эндпоинта `/metrics`, Grafana визуализирует их.

```go
// internal/metrics/metrics.go
package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Счётчик HTTP-запросов
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Общее количество HTTP-запросов",
		},
		[]string{"method", "path", "status"}, // Метки
	)

	// Гистограмма времени ответа
	HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Время обработки HTTP-запроса",
			Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
		},
		[]string{"method", "path"},
	)

	// Gauge — текущее количество активных соединений
	ActiveConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_connections",
			Help: "Текущее количество активных соединений",
		},
	)

	// Gauge — размер пула соединений БД
	DBPoolSize = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "db_pool_connections",
			Help: "Количество соединений в пуле БД",
		},
		[]string{"state"}, // idle, in_use, total
	)
)
```

```go
// internal/middleware/metrics.go
package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/myorg/myapp/internal/metrics"
)

// MetricsMiddleware записывает метрики для каждого HTTP-запроса
func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Обёртка для перехвата статус-кода
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(wrapped.statusCode)

		// Записываем метрики
		metrics.HTTPRequestsTotal.WithLabelValues(r.Method, r.URL.Path, status).Inc()
		metrics.HTTPRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
```

```go
// Регистрация эндпоинта метрик
import "github.com/prometheus/client_golang/prometheus/promhttp"

// На отдельном порту (рекомендуется)
metricsMux := http.NewServeMux()
metricsMux.Handle("/metrics", promhttp.Handler())
go http.ListenAndServe(":9090", metricsMux)
```

### Distributed Tracing: Jaeger / OpenTelemetry

```go
// internal/tracing/tracing.go
package tracing

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// InitTracer инициализирует OpenTelemetry трейсер
func InitTracer(ctx context.Context, serviceName, jaegerEndpoint string) (*sdktrace.TracerProvider, error) {
	// Создаём экспортер для отправки трейсов в Jaeger
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(jaegerEndpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, fmt.Errorf("создание экспортера: %w", err)
	}

	// Ресурс описывает наш сервис
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.ServiceVersion("1.0.0"),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("создание ресурса: %w", err)
	}

	// Создаём TracerProvider
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.AlwaysSample()), // В проде используйте TraceIDRatioBased
	)

	// Устанавливаем глобально
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	return tp, nil
}
```

### Alert Rules (Prometheus)

```yaml
# prometheus/alert-rules.yml
groups:
  - name: myapp-alerts
    rules:
      # Высокий процент ошибок
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Высокий процент ошибок (> 5%)"
          description: "Сервис {{ $labels.instance }} возвращает {{ $value | humanizePercentage }} ошибок 5xx"

      # Высокая задержка
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Высокая задержка (p95 > 1s)"
          description: "95-й перцентиль задержки: {{ $value }}s"

      # Частые перезапуски подов
      - alert: PodRestarts
        expr: |
          increase(kube_pod_container_status_restarts_total{container="myapp"}[1h]) > 3
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Частые перезапуски пода"
          description: "Под {{ $labels.pod }} перезапустился {{ $value }} раз за последний час"

      # Приложение недоступно
      - alert: AppDown
        expr: up{job="myapp"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Приложение недоступно"
          description: "Инстанс {{ $labels.instance }} не отвечает"
```

### Логирование

```go
// Структурированные JSON-логи → stdout → сборщик (Loki/ELK)
import "log/slog"

// Настройка JSON-логгера
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	Level: slog.LevelInfo,
}))
slog.SetDefault(logger)

// Использование
slog.Info("запрос обработан",
	"method", r.Method,
	"path", r.URL.Path,
	"status", status,
	"duration_ms", duration.Milliseconds(),
	"trace_id", traceID,
	"request_id", requestID,
)
```

> [!info] Три столпа наблюдаемости
> - **Метрики** (Prometheus): числовые показатели, агрегации, алерты. Отвечают на вопрос "что происходит?"
> - **Трейсы** (Jaeger): путь запроса через микросервисы. Отвечают на вопрос "где тормозит?"
> - **Логи** (Loki/ELK): детальная информация о событиях. Отвечают на вопрос "почему так произошло?"

###### 🏠 Домашнее задание

1. Добавьте Prometheus-метрики в своё приложение: счётчик запросов, гистограмму задержек, gauge активных соединений. Проверьте через `curl localhost:9090/metrics`.
2. Настройте Prometheus + Grafana в Docker Compose. Создайте дашборд с графиками RPS, латентности (p50, p95, p99) и процента ошибок.
3. Напишите alert rule, который срабатывает, если p99 задержка превышает 2 секунды в течение 5 минут.

---

## 9. Health checks

Health checks позволяют Kubernetes понимать состояние приложения и автоматически реагировать на проблемы.

### Три типа проб

| Проба       | Путь       | Назначение                          | При неудаче                    |
| ----------- | ---------- | ----------------------------------- | ------------------------------ |
| Liveness    | `/health`  | Процесс жив и не завис             | Контейнер перезапускается      |
| Readiness   | `/ready`   | Готов обрабатывать трафик           | Трафик перестаёт поступать     |
| Startup     | `/health`  | Приложение успешно запустилось      | Ждёт или перезапускает         |

> [!important] Разница между liveness и readiness
> - **Liveness** отвечает на вопрос: "Процесс вообще работает?" Если нет — Kubernetes убивает под и создаёт новый. Не проверяйте здесь зависимости — иначе при падении БД все поды будут бесконечно перезапускаться.
> - **Readiness** отвечает на вопрос: "Готов ли я принимать трафик?" Если нет — под убирается из Service (балансировщика). Когда зависимость восстановится, под снова получит трафик.

### Реализация в Go

```go
// internal/health/health.go
package health

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// Checker проверяет здоровье приложения и его зависимостей
type Checker struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

// NewChecker создаёт новый экземпляр Checker
func NewChecker(db *pgxpool.Pool, redis *redis.Client) *Checker {
	return &Checker{
		db:    db,
		redis: redis,
	}
}

// HealthResponse — ответ проверки здоровья
type HealthResponse struct {
	Status    string                     `json:"status"`              // "ok" или "error"
	Timestamp string                     `json:"timestamp"`
	Checks    map[string]ComponentStatus `json:"checks,omitempty"`    // Статусы компонентов
}

// ComponentStatus — статус отдельного компонента
type ComponentStatus struct {
	Status   string `json:"status"`             // "up" или "down"
	Message  string `json:"message,omitempty"`
	Duration string `json:"duration,omitempty"` // Время проверки
}

// LivenessHandler — проверка живости (liveness).
// Только проверяет, что процесс жив. НЕ проверяет зависимости!
func (c *Checker) LivenessHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := HealthResponse{
			Status:    "ok",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

// ReadinessHandler — проверка готовности (readiness).
// Проверяет доступность всех зависимостей.
func (c *Checker) ReadinessHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		checks := make(map[string]ComponentStatus)
		allHealthy := true

		var mu sync.Mutex
		var wg sync.WaitGroup

		// Проверяем PostgreSQL
		wg.Add(1)
		go func() {
			defer wg.Done()
			status := c.checkPostgres(ctx)
			mu.Lock()
			checks["postgres"] = status
			if status.Status != "up" {
				allHealthy = false
			}
			mu.Unlock()
		}()

		// Проверяем Redis
		wg.Add(1)
		go func() {
			defer wg.Done()
			status := c.checkRedis(ctx)
			mu.Lock()
			checks["redis"] = status
			if status.Status != "up" {
				allHealthy = false
			}
			mu.Unlock()
		}()

		wg.Wait()

		resp := HealthResponse{
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Checks:    checks,
		}

		if allHealthy {
			resp.Status = "ok"
			w.WriteHeader(http.StatusOK)
		} else {
			resp.Status = "error"
			w.WriteHeader(http.StatusServiceUnavailable)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

// checkPostgres проверяет доступность PostgreSQL
func (c *Checker) checkPostgres(ctx context.Context) ComponentStatus {
	start := time.Now()

	if err := c.db.Ping(ctx); err != nil {
		return ComponentStatus{
			Status:   "down",
			Message:  err.Error(),
			Duration: time.Since(start).String(),
		}
	}

	return ComponentStatus{
		Status:   "up",
		Duration: time.Since(start).String(),
	}
}

// checkRedis проверяет доступность Redis
func (c *Checker) checkRedis(ctx context.Context) ComponentStatus {
	start := time.Now()

	if err := c.redis.Ping(ctx).Err(); err != nil {
		return ComponentStatus{
			Status:   "down",
			Message:  err.Error(),
			Duration: time.Since(start).String(),
		}
	}

	return ComponentStatus{
		Status:   "up",
		Duration: time.Since(start).String(),
	}
}
```

```go
// Регистрация хендлеров
checker := health.NewChecker(db, redisClient)

mux.HandleFunc("GET /health", checker.LivenessHandler())
mux.HandleFunc("GET /ready", checker.ReadinessHandler())
```

### Конфигурация проб в Kubernetes

```yaml
# Liveness — не проверяет зависимости, только процесс
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10     # Подождать 10 секунд после запуска
  periodSeconds: 15            # Проверять каждые 15 секунд
  timeoutSeconds: 3            # Таймаут 3 секунды
  failureThreshold: 3          # 3 неудачи = перезапуск
  successThreshold: 1          # 1 успех = здоров

# Readiness — проверяет зависимости
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
  successThreshold: 1

# Startup — для медленного запуска
startupProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30         # 30 * 5 = 150 секунд на запуск
```

###### 🏠 Домашнее задание

1. Реализуйте `/health` и `/ready` эндпоинты в своём приложении. `/ready` должен проверять БД и Redis параллельно (goroutines).
2. Задеплойте в minikube с настроенными пробами. Остановите PostgreSQL (`kubectl delete pod postgres-...`) и наблюдайте: поды должны стать NotReady, но НЕ перезапускаться.
3. Добавьте `/startup` пробу с `failureThreshold: 60` и `periodSeconds: 2` — это даст 2 минуты на запуск.

---

## 10. Graceful shutdown

При остановке пода Kubernetes отправляет сигнал `SIGTERM`. Приложение должно корректно завершить работу: дообработать текущие запросы, закрыть соединения с БД, остановить консьюмеры сообщений.

### Почему это важно

1. **In-flight запросы** — если убить процесс мгновенно, клиенты получат обрыв соединения
2. **Kubernetes pod termination** — K8s убирает под из Service (перестаёт направлять трафик), затем отправляет SIGTERM. Если приложение не завершится за `terminationGracePeriodSeconds`, K8s отправит SIGKILL
3. **Консистентность данных** — незавершённые транзакции БД, недоотправленные сообщения

### Полная реализация

```go
// cmd/myapp/main.go
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Настраиваем логгер
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Запускаем приложение
	if err := run(); err != nil {
		slog.Error("приложение завершилось с ошибкой", "error", err)
		os.Exit(1)
	}
}

func run() error {
	// Контекст с отменой по сигналу SIGINT/SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// ===== Инициализация зависимостей =====

	// PostgreSQL
	dbPool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return fmt.Errorf("подключение к БД: %w", err)
	}
	defer dbPool.Close()
	slog.Info("подключение к PostgreSQL установлено")

	// Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_URL"),
	})
	defer redisClient.Close()

	if err := redisClient.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("подключение к Redis: %w", err)
	}
	slog.Info("подключение к Redis установлено")

	// ===== HTTP-сервер =====

	mux := http.NewServeMux()
	// ... регистрация маршрутов ...

	httpServer := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// ===== Сервер метрик =====

	metricsMux := http.NewServeMux()
	// metricsMux.Handle("/metrics", promhttp.Handler())

	metricsServer := &http.Server{
		Addr:    ":9090",
		Handler: metricsMux,
	}

	// ===== Канал ошибок =====
	// Собираем ошибки от всех горутин
	errCh := make(chan error, 1)

	// Запускаем HTTP-сервер
	go func() {
		slog.Info("HTTP-сервер запущен", "addr", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- fmt.Errorf("HTTP-сервер: %w", err)
		}
	}()

	// Запускаем сервер метрик
	go func() {
		slog.Info("сервер метрик запущен", "addr", metricsServer.Addr)
		if err := metricsServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- fmt.Errorf("сервер метрик: %w", err)
		}
	}()

	// ===== Ожидание завершения =====

	select {
	case err := <-errCh:
		// Одна из горутин вернула ошибку
		return err

	case <-ctx.Done():
		// Получен сигнал SIGINT/SIGTERM
		slog.Info("получен сигнал завершения, начинаем graceful shutdown...")
	}

	// ===== Graceful Shutdown =====

	// Контекст с таймаутом на завершение
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()

	// Останавливаем HTTP-сервер (дожидается завершения активных запросов)
	slog.Info("останавливаем HTTP-сервер...")
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		slog.Error("ошибка остановки HTTP-сервера", "error", err)
	}

	// Останавливаем сервер метрик
	slog.Info("останавливаем сервер метрик...")
	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		slog.Error("ошибка остановки сервера метрик", "error", err)
	}

	// Закрываем Redis
	slog.Info("закрываем соединение с Redis...")
	if err := redisClient.Close(); err != nil {
		slog.Error("ошибка закрытия Redis", "error", err)
	}

	// Закрываем пул соединений с БД
	slog.Info("закрываем пул соединений с БД...")
	dbPool.Close()

	slog.Info("приложение корректно остановлено")
	return nil
}
```

### Последовательность завершения в Kubernetes

```
1. Pod помечается как Terminating
2. Pod убирается из Service endpoints (новый трафик не приходит)
3. Выполняется preStop hook (если настроен)
4. Отправляется SIGTERM
5. Приложение дообрабатывает текущие запросы
6. Приложение закрывает соединения
7. Приложение завершается с кодом 0
8. Если не завершилось за terminationGracePeriodSeconds → SIGKILL
```

> [!tip] preStop hook
> Между шагами 2 и 4 есть гонка: Kubernetes может отправить SIGTERM раньше, чем endpoints обновятся. Добавьте `preStop` hook с небольшой задержкой:
> ```yaml
> lifecycle:
>   preStop:
>     exec:
>       command: ["sh", "-c", "sleep 5"]
> ```
> Это даёт 5 секунд на обновление endpoints, прежде чем приложение начнёт завершение.

###### 🏠 Домашнее задание

1. Реализуйте `run()` функцию с graceful shutdown в своём приложении. Проверьте через `kill -SIGTERM <pid>` — приложение должно корректно завершиться.
2. Добавьте длинный запрос (endpoint с `time.Sleep(10 * time.Second)`) и отправьте SIGTERM во время его выполнения. Убедитесь, что запрос дообрабатывается.
3. Настройте `terminationGracePeriodSeconds: 30` в Deployment и `preStop` hook с `sleep 5`. Задеплойте и проверьте корректное завершение при обновлении.

---

## 11. Безопасность

### HTTPS/TLS

```go
// cmd/myapp/tls.go
package main

import (
	"crypto/tls"
	"log/slog"
	"net/http"

	"golang.org/x/crypto/acme/autocert"
)

// Запуск с автоматическими сертификатами Let's Encrypt
func startWithAutocert(handler http.Handler) error {
	manager := &autocert.Manager{
		Prompt:     autocert.AcceptTOS,
		HostPolicy: autocert.HostWhitelist("api.example.com"),
		Cache:      autocert.DirCache("/var/lib/certs"), // Кеш сертификатов
	}

	server := &http.Server{
		Addr:    ":443",
		Handler: handler,
		TLSConfig: &tls.Config{
			GetCertificate: manager.GetCertificate,
			MinVersion:     tls.VersionTLS12, // Минимум TLS 1.2
			CipherSuites: []uint16{
				tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
				tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
				tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
				tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			},
		},
	}

	// HTTP → HTTPS редирект
	go http.ListenAndServe(":80", manager.HTTPHandler(nil))

	slog.Info("HTTPS-сервер запущен", "addr", server.Addr)
	return server.ListenAndServeTLS("", "") // Сертификаты от autocert
}

// Запуск с готовыми сертификатами
func startWithCerts(handler http.Handler, certFile, keyFile string) error {
	server := &http.Server{
		Addr:    ":443",
		Handler: handler,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
	}

	return server.ListenAndServeTLS(certFile, keyFile)
}
```

### Security Headers Middleware

```go
// internal/middleware/security.go
package middleware

import "net/http"

// SecurityHeaders добавляет заголовки безопасности
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Запрещает браузеру угадывать Content-Type
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// Запрещает встраивание страницы во фреймы (защита от clickjacking)
		w.Header().Set("X-Frame-Options", "DENY")

		// Включает XSS-фильтр в старых браузерах
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		// HSTS — принудительное использование HTTPS
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// Content Security Policy — ограничивает источники ресурсов
		w.Header().Set("Content-Security-Policy", "default-src 'self'")

		// Не отправлять Referer при переходе на HTTP
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Запрещает доступ к камере, микрофону и т.д.
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		next.ServeHTTP(w, r)
	})
}
```

### CORS Middleware

```go
// internal/middleware/cors.go
package middleware

import "net/http"

// CORSConfig — конфигурация CORS
type CORSConfig struct {
	AllowedOrigins []string // Разрешённые домены
	AllowedMethods []string // Разрешённые методы
	AllowedHeaders []string // Разрешённые заголовки
	MaxAge         int      // Время кеширования preflight (секунды)
}

// CORS возвращает middleware для обработки CORS-запросов
func CORS(config CORSConfig) func(http.Handler) http.Handler {
	originsSet := make(map[string]bool)
	for _, o := range config.AllowedOrigins {
		originsSet[o] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Проверяем, разрешён ли origin
			if originsSet[origin] || originsSet["*"] {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", joinStrings(config.AllowedMethods))
				w.Header().Set("Access-Control-Allow-Headers", joinStrings(config.AllowedHeaders))
				w.Header().Set("Access-Control-Max-Age", fmt.Sprintf("%d", config.MaxAge))
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}

			// Preflight-запрос
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
```

### Защита от SQL-инъекций

```go
// НЕПРАВИЛЬНО — SQL-инъекция!
query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)
rows, err := db.Query(ctx, query)

// ПРАВИЛЬНО — параметризованный запрос
rows, err := db.Query(ctx, "SELECT * FROM users WHERE email = $1", email)

// ПРАВИЛЬНО — с Query Builder (squirrel)
query, args, err := sq.
    Select("id", "email", "name").
    From("users").
    Where(sq.Eq{"email": email}).
    PlaceholderFormat(sq.Dollar).
    ToSql()
rows, err := db.Query(ctx, query, args...)
```

> [!danger] SQL-инъекция
> Никогда не подставляйте пользовательский ввод напрямую в SQL-запрос через `fmt.Sprintf`. Всегда используйте параметризованные запросы (`$1`, `$2`) или query builder. Это защищает от SQL-инъекций на уровне драйвера.

### Управление секретами

```go
// НЕПРАВИЛЬНО — секреты в коде
const dbPassword = "supersecret123"

// ПРАВИЛЬНО — из переменных окружения
dbPassword := os.Getenv("DB_PASSWORD")
if dbPassword == "" {
	log.Fatal("DB_PASSWORD не установлен")
}

// ЕЩЁ ЛУЧШЕ — из vault
// Используйте HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager
```

### Безопасность контейнера

```dockerfile
# Запускаем от непривилегированного пользователя
USER nobody

# Read-only файловая система
# (в Kubernetes)
```

```yaml
# Kubernetes: SecurityContext
spec:
  containers:
    - name: myapp
      securityContext:
        runAsNonRoot: true              # Запрет запуска от root
        runAsUser: 65534                # nobody
        readOnlyRootFilesystem: true    # Read-only файловая система
        allowPrivilegeEscalation: false # Запрет повышения привилегий
        capabilities:
          drop:
            - ALL                       # Убираем все Linux capabilities
      volumeMounts:
        - name: tmp
          mountPath: /tmp               # Записываемая директория для временных файлов
  volumes:
    - name: tmp
      emptyDir: {}
```

###### 🏠 Домашнее задание

1. Добавьте `SecurityHeaders` middleware в своё приложение. Проверьте заголовки через `curl -I http://localhost:8080`.
2. Настройте CORS для конкретного домена (не `*`). Проверьте через fetch из консоли браузера с другого домена.
3. Проведите аудит безопасности контейнера: добавьте `securityContext` с `runAsNonRoot`, `readOnlyRootFilesystem` и `drop ALL capabilities`. Убедитесь, что приложение работает.

---

## 12. Сквозной проект: деплой Todo-микросервисов

Применим все знания на практике. Задеплоим два микросервиса из [[06-microservices]] — `todo-service` и `user-service` — в Kubernetes с Helm и CI/CD.

### Структура проекта

```
todo-platform/
├── services/
│   ├── todo-service/
│   │   ├── cmd/todo-service/main.go
│   │   ├── internal/
│   │   ├── Dockerfile
│   │   ├── go.mod
│   │   └── go.sum
│   └── user-service/
│       ├── cmd/user-service/main.go
│       ├── internal/
│       ├── Dockerfile
│       ├── go.mod
│       └── go.sum
├── helm/
│   ├── todo-service/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   └── user-service/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile
└── .github/workflows/ci.yml
```

### Dockerfile для todo-service

```dockerfile
# services/todo-service/Dockerfile
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Кеширование зависимостей
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Сборка с информацией о версии
ARG VERSION=dev
ARG GIT_COMMIT=unknown

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w \
      -X github.com/myorg/todo-platform/services/todo-service/internal/version.Version=${VERSION} \
      -X github.com/myorg/todo-platform/services/todo-service/internal/version.GitCommit=${GIT_COMMIT}" \
    -o /app/bin/todo-service ./cmd/todo-service

# Минимальный runtime
FROM gcr.io/distroless/static-debian12

COPY --from=builder /app/bin/todo-service /todo-service

USER nonroot:nonroot

EXPOSE 8081

ENTRYPOINT ["/todo-service"]
```

### Dockerfile для user-service

```dockerfile
# services/user-service/Dockerfile
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG GIT_COMMIT=unknown

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w \
      -X github.com/myorg/todo-platform/services/user-service/internal/version.Version=${VERSION} \
      -X github.com/myorg/todo-platform/services/user-service/internal/version.GitCommit=${GIT_COMMIT}" \
    -o /app/bin/user-service ./cmd/user-service

FROM gcr.io/distroless/static-debian12

COPY --from=builder /app/bin/user-service /user-service

USER nonroot:nonroot

EXPOSE 8082

ENTRYPOINT ["/user-service"]
```

### docker-compose.yml для локальной разработки

```yaml
# docker-compose.yml
version: "3.8"

services:
  # ===== Todo Service =====
  todo-service:
    build:
      context: ./services/todo-service
      dockerfile: Dockerfile
    ports:
      - "8081:8081"
      - "9091:9090"    # Метрики
    environment:
      - APP_PORT=8081
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=todo
      - DB_PASSWORD=todo_secret
      - DB_NAME=todo_db
      - DB_SSLMODE=disable
      - REDIS_URL=redis://redis:6379/0
      - NATS_URL=nats://nats:4222
      - USER_SERVICE_URL=http://user-service:8082
      - LOG_LEVEL=debug
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      nats:
        condition: service_started
    restart: unless-stopped
    networks:
      - platform

  # ===== User Service =====
  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile
    ports:
      - "8082:8082"
      - "9092:9090"    # Метрики
    environment:
      - APP_PORT=8082
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=users
      - DB_PASSWORD=users_secret
      - DB_NAME=users_db
      - DB_SSLMODE=disable
      - REDIS_URL=redis://redis:6379/1
      - JWT_SECRET=local-dev-jwt-secret
      - LOG_LEVEL=debug
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - platform

  # ===== PostgreSQL =====
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin_secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - platform

  # ===== Redis =====
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - platform

  # ===== NATS =====
  nats:
    image: nats:2.10-alpine
    ports:
      - "4222:4222"
      - "8222:8222"
    command: ["--js", "--sd", "/data", "--name", "todo-nats"]
    volumes:
      - nats-data:/data
    networks:
      - platform

  # ===== Миграции todo-service =====
  migrate-todo:
    image: migrate/migrate:v4.17.0
    volumes:
      - ./services/todo-service/migrations:/migrations
    command: [
      "-path", "/migrations",
      "-database", "postgres://todo:todo_secret@postgres:5432/todo_db?sslmode=disable",
      "up"
    ]
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - platform
    restart: "no"

  # ===== Миграции user-service =====
  migrate-users:
    image: migrate/migrate:v4.17.0
    volumes:
      - ./services/user-service/migrations:/migrations
    command: [
      "-path", "/migrations",
      "-database", "postgres://users:users_secret@postgres:5432/users_db?sslmode=disable",
      "up"
    ]
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - platform
    restart: "no"

volumes:
  postgres-data:
  redis-data:
  nats-data:

networks:
  platform:
    driver: bridge
```

```sql
-- scripts/init-databases.sql
-- Создание баз данных и пользователей для каждого сервиса

-- Todo Service
CREATE USER todo WITH PASSWORD 'todo_secret';
CREATE DATABASE todo_db OWNER todo;

-- User Service
CREATE USER users WITH PASSWORD 'users_secret';
CREATE DATABASE users_db OWNER users;
```

### Helm chart для todo-service

```yaml
# helm/todo-service/Chart.yaml
apiVersion: v2
name: todo-service
description: Микросервис управления задачами
type: application
version: 0.1.0
appVersion: "1.0.0"
```

```yaml
# helm/todo-service/values.yaml
replicaCount: 2

image:
  repository: ghcr.io/myorg/todo-service
  tag: "latest"
  pullPolicy: IfNotPresent

config:
  appPort: "8081"
  logLevel: info
  dbHost: postgres.production.svc.cluster.local
  dbPort: "5432"
  dbName: todo_db
  dbSSLMode: require
  redisURL: "redis://redis.production.svc.cluster.local:6379/0"
  natsURL: "nats://nats.production.svc.cluster.local:4222"
  userServiceURL: "http://user-service.production.svc.cluster.local"

secrets:
  dbUser: todo
  dbPassword: ""
  jwtSecret: ""

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.example.com
      paths:
        - path: /api/v1/todos
          pathType: Prefix
  tls:
    - secretName: todo-tls
      hosts:
        - api.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### Helm chart для user-service

```yaml
# helm/user-service/Chart.yaml
apiVersion: v2
name: user-service
description: Микросервис управления пользователями
type: application
version: 0.1.0
appVersion: "1.0.0"
```

```yaml
# helm/user-service/values.yaml
replicaCount: 2

image:
  repository: ghcr.io/myorg/user-service
  tag: "latest"
  pullPolicy: IfNotPresent

config:
  appPort: "8082"
  logLevel: info
  dbHost: postgres.production.svc.cluster.local
  dbPort: "5432"
  dbName: users_db
  dbSSLMode: require
  redisURL: "redis://redis.production.svc.cluster.local:6379/1"

secrets:
  dbUser: users
  dbPassword: ""
  jwtSecret: ""

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.example.com
      paths:
        - path: /api/v1/users
          pathType: Prefix
        - path: /api/v1/auth
          pathType: Prefix
  tls:
    - secretName: users-tls
      hosts:
        - api.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 8
  targetCPUUtilizationPercentage: 70
```

### GitHub Actions CI/CD для всей платформы

```yaml
# .github/workflows/ci.yml
name: Todo Platform CI/CD

on:
  push:
    branches: [main]
    tags: ["v*"]
  pull_request:
    branches: [main]

env:
  GO_VERSION: "1.22"
  REGISTRY: ghcr.io

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ===== Определяем, какие сервисы изменились =====
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      todo-service: ${{ steps.changes.outputs.todo-service }}
      user-service: ${{ steps.changes.outputs.user-service }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            todo-service:
              - 'services/todo-service/**'
              - 'helm/todo-service/**'
            user-service:
              - 'services/user-service/**'
              - 'helm/user-service/**'

  # ===== Линтинг и тесты для todo-service =====
  todo-service-ci:
    name: Todo Service CI
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.todo-service == 'true' || github.ref == 'refs/heads/main'

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: todo_test
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5

    defaults:
      run:
        working-directory: services/todo-service

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache-dependency-path: services/todo-service/go.sum

      - name: Lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: latest
          working-directory: services/todo-service

      - name: Test
        run: go test -v -race -coverprofile=coverage.out ./...
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: test
          DB_PASSWORD: test
          DB_NAME: todo_test
          REDIS_URL: redis://localhost:6379/0

  # ===== Линтинг и тесты для user-service =====
  user-service-ci:
    name: User Service CI
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.user-service == 'true' || github.ref == 'refs/heads/main'

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: users_test
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5

    defaults:
      run:
        working-directory: services/user-service

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache-dependency-path: services/user-service/go.sum

      - name: Lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: latest
          working-directory: services/user-service

      - name: Test
        run: go test -v -race -coverprofile=coverage.out ./...
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: test
          DB_PASSWORD: test
          DB_NAME: users_test
          REDIS_URL: redis://localhost:6379/1

  # ===== Docker Build & Push =====
  docker-build:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: [todo-service-ci, user-service-ci]
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [todo-service, user-service]
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push ${{ matrix.service }}
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ matrix.service }}:latest
          build-args: |
            VERSION=${{ github.ref_name }}
            GIT_COMMIT=${{ github.sha }}
          cache-from: type=gha,scope=${{ matrix.service }}
          cache-to: type=gha,scope=${{ matrix.service }},mode=max

  # ===== Деплой =====
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: docker-build
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: azure/setup-helm@v3

      - uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBECONFIG }}

      - name: Deploy todo-service
        run: |
          helm upgrade --install todo-service ./helm/todo-service \
            --namespace production \
            --create-namespace \
            --set image.tag=${{ github.sha }} \
            --set secrets.dbPassword=${{ secrets.TODO_DB_PASSWORD }} \
            --set secrets.jwtSecret=${{ secrets.JWT_SECRET }} \
            --wait --timeout 5m

      - name: Deploy user-service
        run: |
          helm upgrade --install user-service ./helm/user-service \
            --namespace production \
            --create-namespace \
            --set image.tag=${{ github.sha }} \
            --set secrets.dbPassword=${{ secrets.USERS_DB_PASSWORD }} \
            --set secrets.jwtSecret=${{ secrets.JWT_SECRET }} \
            --wait --timeout 5m

      - name: Verify deployments
        run: |
          kubectl rollout status deployment/todo-service -n production --timeout=300s
          kubectl rollout status deployment/user-service -n production --timeout=300s
          echo "=== Pods ==="
          kubectl get pods -n production
          echo "=== Services ==="
          kubectl get svc -n production
```

### Makefile для удобства

```makefile
# Makefile
.PHONY: help dev dev-down build test lint docker-build deploy

help: ## Показать справку
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ===== Локальная разработка =====

dev: ## Запуск dev-окружения
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

dev-down: ## Остановка dev-окружения
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

dev-logs: ## Логи dev-окружения
	docker compose logs -f

dev-ps: ## Статус сервисов
	docker compose ps

# ===== Сборка =====

build: ## Сборка всех сервисов
	cd services/todo-service && CGO_ENABLED=0 go build -ldflags="-s -w" -o ../../bin/todo-service ./cmd/todo-service
	cd services/user-service && CGO_ENABLED=0 go build -ldflags="-s -w" -o ../../bin/user-service ./cmd/user-service

# ===== Тесты =====

test: ## Запуск всех тестов
	cd services/todo-service && go test -v -race ./...
	cd services/user-service && go test -v -race ./...

lint: ## Линтинг всех сервисов
	cd services/todo-service && golangci-lint run ./...
	cd services/user-service && golangci-lint run ./...

# ===== Docker =====

docker-build: ## Сборка Docker-образов
	docker build -t todo-service:latest ./services/todo-service
	docker build -t user-service:latest ./services/user-service

# ===== Деплой =====

deploy-staging: ## Деплой в staging
	helm upgrade --install todo-service ./helm/todo-service \
		--namespace staging --create-namespace \
		-f helm/todo-service/values-staging.yaml
	helm upgrade --install user-service ./helm/user-service \
		--namespace staging --create-namespace \
		-f helm/user-service/values-staging.yaml

deploy-production: ## Деплой в production
	@echo "ВНИМАНИЕ: деплой в production! Продолжить? [y/N]" && read ans && [ $${ans:-N} = y ]
	helm upgrade --install todo-service ./helm/todo-service \
		--namespace production --create-namespace \
		-f helm/todo-service/values-production.yaml
	helm upgrade --install user-service ./helm/user-service \
		--namespace production --create-namespace \
		-f helm/user-service/values-production.yaml
```

###### 🏠 Домашнее задание

1. Реализуйте полный сквозной проект: два микросервиса с Dockerfile, docker-compose для локальной разработки, Helm charts и GitHub Actions CI/CD.
2. Задеплойте в minikube. Проверьте, что оба сервиса работают и общаются друг с другом.
3. Выполните полный цикл: измените код → push → CI проходит → Docker образ собирается → Helm обновляет деплой. Проследите весь путь от коммита до работающего пода.
4. Добавьте мониторинг: Prometheus + Grafana в docker-compose. Создайте дашборд с метриками обоих сервисов.

---

## Итоги главы

В этой главе мы прошли весь путь Go-приложения от сборки до продакшена:

> [!summary] Ключевые навыки
> 1. **Сборка** — статические бинарники с `CGO_ENABLED=0`, оптимизация размера через `-ldflags`, кросс-компиляция
> 2. **Docker** — multi-stage builds, выбор базового образа (alpine/scratch/distroless), кеширование слоёв
> 3. **Docker Compose** — полное dev-окружение одной командой, healthcheck, hot-reload с Air
> 4. **Kubernetes** — Deployment, Service, ConfigMap, Secret, HPA, Ingress — полный набор ресурсов
> 5. **Helm** — шаблонизация K8s-манифестов, параметризация, управление релизами
> 6. **CI/CD** — автоматические пайплайны в GitHub Actions и GitLab CI
> 7. **Observability** — метрики (Prometheus), трейсинг (Jaeger), логи (JSON → Loki/ELK)
> 8. **Health checks** — liveness, readiness, startup пробы
> 9. **Graceful shutdown** — корректное завершение с обработкой in-flight запросов
> 10. **Безопасность** — TLS, security headers, CORS, защита от SQL-инъекций, минимальные контейнеры

> [!tip] Следующие шаги
> - Изучите GitOps (ArgoCD, Flux) для декларативного управления деплоем
> - Попробуйте service mesh (Istio, Linkerd) для управления трафиком между микросервисами
> - Настройте canary deployments для безопасного выкатывания новых версий
> - Изучите eBPF для глубокого наблюдения за приложениями в Kubernetes

---

**Связанные заметки:** [[03-networking]] | [[06-microservices]] | [[08-tools-and-ecosystem]]
