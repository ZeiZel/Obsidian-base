---
tags:
  - backend
  - golang
  - go
  - course
---

# Полный курс по Go — от 0 до Senior

Этот курс охватывает язык Go от самых основ до продвинутых тем уровня Senior. Каждый раздел содержит теорию, подробные примеры кода с комментариями на русском языке и домашние задания.

## Сквозной проект

Через весь курс проходит единый проект, который эволюционирует вместе с изучаемыми темами:

1. **CLI Todo-приложение** → базовые команды через терминал ([[01-basics]])
2. **Сохранение в файл** → JSON-файл как хранилище ([[02-os-and-fs]])
3. **REST API** → HTTP-сервер с полным CRUD ([[03-networking]])
4. **PostgreSQL** → подключение БД через GORM + миграции ([[04-databases]])
5. **Воркер-пул** → фоновая обработка задач ([[05-concurrency]])
6. **Микросервисы** → todo-service + notification-service через NATS ([[06-microservices]])
7. **Тесты** → unit, integration, HTTP-тесты для всего приложения ([[07-testing]])
8. **Kubernetes** → деплой микросервисов с Helm ([[09-deploy]])
9. **Clean Architecture** → рефакторинг с generics и чистой архитектурой ([[10-advanced]])

---

## Содержание курса

### 1. [[01-basics]] — Основы Go

- Введение в Go: история, философия, Go Proverbs
- Установка Go, workspace, GOPATH vs Go modules
- Первая программа Hello World
- Пакеты и модули (`go mod init`, `go.mod`, `go.sum`)
- Типы данных: `int`, `float`, `string`, `bool`, `byte`, `rune`
- Объявление переменных: `var`, `:=`, `const`, `iota`
- Работа со строками и пакет `strconv`
- Приведение типов (type casting)
- Операторы (арифметические, логические, побитовые, канальные)
- Ветвления: `if/else`, `switch`, `type switch`
- Циклы: `for`, `range`, `break`, `continue`, метки
- Функции: множественный возврат, именованные возвраты, variadic, замыкания
- `defer`, `panic`, `recover`, `init()`
- Указатели (pointers)
- Массивы, слайсы, maps
- Структуры: теги, встраивание, методы (value vs pointer receiver)
- Интерфейсы: неявная реализация, композиция, `any`, type assertion
- Обработка ошибок: `errors.Is`, `errors.As`, sentinel errors, wrapping
- Инструменты: `go vet`, `go fmt`, `go build`, `go run`, `go test`
- 🛠 Сквозной проект: CLI Todo-приложение

### 2. [[02-os-and-fs]] — Работа с ОС и файловой системой

- Пакет `os`: переменные окружения, аргументы, exit codes
- Работа с файлами: создание, чтение, запись, удаление
- Директории: создание, обход, `os.Stat`
- Пакеты `io` и `bufio`: потоки, буферизация, `Scanner`
- `path/filepath`: платформо-независимая работа с путями
- Работа с процессами: `os/exec`
- Сигналы: `os/signal`, `syscall`
- Временные файлы и директории
- Конфигурация приложения: `flag`, env, cobra/viper
- Потоковая обработка файлов, CSV, JSON
- `embed` (Go 1.16+): встраивание файлов в бинарник
- 🛠 Сквозной проект: сохранение Todo в JSON-файл

### 3. [[03-networking]] — Работа с сетью

- `net/http`: HTTP-сервер, роутинг, handlers (Go 1.22+ паттерны)
- HTTP-клиент: таймауты, кастомный Transport, retry
- `encoding/json`: marshal/unmarshal, теги, кастомная сериализация
- Валидация: `go-playground/validator`
- REST API: полноценный CRUD сервер, версионирование
- Middleware: logging, recovery, CORS, auth, rate limiting
- JWT аутентификация: генерация, верификация, middleware
- WebSockets (`nhooyr.io/websocket`)
- Server-Sent Events (SSE)
- gRPC: proto файлы, генерация, сервер/клиент, interceptors
- Swagger/OpenAPI: `swaggo`
- Фреймворки: Gin, Chi, Echo, Fiber — сравнение
- 🛠 Сквозной проект: Todo CLI → HTTP REST API

### 4. [[04-databases]] — Работа с базами данных

- `database/sql`: подключение, пул соединений, запросы, транзакции
- PostgreSQL с `pgx`: batch-запросы, COPY, connection pooling
- `sqlx`: автоматический маппинг структур
- Миграции: `golang-migrate`, `goose`
- GORM: модели, CRUD, ассоциации, хуки, scopes, транзакции
- `sqlc`: генерация типобезопасного кода из SQL
- Redis: `go-redis`, кеширование (Cache-Aside), pub/sub, распределённые блокировки
- Паттерны: Repository, оптимистичная блокировка, cursor-пагинация
- 🛠 Сквозной проект: PostgreSQL + GORM для Todo API

### 5. [[05-concurrency]] — Горутины и конкурентность

- Конкурентность vs параллелизм
- Горутины: `go` keyword, планировщик, GOMAXPROCS
- GMP модель планировщика Go
- Каналы: направленные, буферизованные, `close`, `range`
- `select`: мультиплексирование, таймауты, non-blocking
- `sync`: Mutex, RWMutex, WaitGroup, Once, Map, Pool
- `sync/atomic`: lock-free операции
- Паттерны: Worker Pool, Fan-out/Fan-in, Pipeline, Semaphore
- Rate Limiter, Circuit Breaker, Or-done channel
- `context`: WithCancel, WithTimeout, WithDeadline, WithValue
- `errgroup`, `singleflight`
- Race detector: `go test -race`
- Модель памяти Go: happens-before
- Частые ошибки: утечки горутин, замыкание переменной цикла, забытый cancel
- 🛠 Сквозной проект: воркер-пул для фоновой обработки

### 6. [[06-microservices]] — Микросервисы на Go

- Архитектура: монолит → микросервисы (связь с [[System Design]])
- Паттерны: API Gateway, Service Discovery, Circuit Breaker, Retry, Bulkhead
- Межсервисная коммуникация: REST, gRPC, message brokers
- RabbitMQ (`amqp091-go`): exchanges, queues, ack/nack
- Apache Kafka (`kafka-go`): producer, consumer groups, offsets
- NATS (`nats.go`): pub/sub, request/reply, JetStream
- Saga паттерн: Choreography vs Orchestration
- Outbox pattern
- CQRS и Event Sourcing основы
- Observability: structured logging, OpenTelemetry, Prometheus
- 🛠 Сквозной проект: todo-service + notification-service через NATS

### 7. [[07-testing]] — Тестирование

- `testing` пакет: unit tests, table tests, подтесты (`t.Run`)
- `testify`: assert, require, suite
- Мок-объекты: ручные моки, `gomock`, `mockery`
- Интеграционные тесты: `testcontainers-go`
- HTTP-тесты: `httptest`
- Фаззинг (`go test -fuzz`)
- Бенчмарки (`BenchmarkXxx`, `-benchmem`)
- Покрытие кода (`go test -cover`)
- Продвинутое: `t.Parallel`, `TestMain`, golden files
- 🛠 Сквозной проект: полное тестирование Todo приложения

### 8. [[08-tools-and-ecosystem]] — Инструменты и экосистема

- Форматирование: `go fmt`, `gofumpt`, `goimports`
- Линтеры: `golangci-lint` (подробная настройка)
- Profiling: `pprof` (CPU, memory, goroutine)
- Tracing: `go tool trace`
- Отладка: `delve` (dlv)
- Генерация кода: `go generate`, `stringer`, `mockgen`
- Swagger: `swaggo`
- DI: ручной, `wire`, `fx`
- Библиотеки: `lo`, `cobra`, `viper`, `Air`
- Makefile и воркфлоу разработки

### 9. [[09-deploy]] — Деплой Go приложений

- Сборка: `CGO_ENABLED=0`, linker flags, кросс-компиляция
- Dockerfile: multi-stage builds (alpine, scratch, distroless)
- Docker Compose для локальной разработки
- Kubernetes: Deployment, Service, ConfigMap, Secret, HPA, Ingress
- Helm chart для Go приложения
- CI/CD: GitHub Actions, GitLab CI
- Observability в проде: Prometheus + Grafana, Jaeger
- Health checks: `/health`, `/ready`
- Graceful shutdown
- Безопасность: TLS, CORS, security headers, secret management
- 🛠 Сквозной проект: деплой Todo микросервисов в Kubernetes

### 10. [[10-advanced]] — Advanced темы

- Reflection (`reflect` пакет)
- Generics (Go 1.18+): type parameters, constraints, generic types
- Range over func / итераторы (Go 1.23)
- `unsafe` пакет
- CGO: вызов C из Go
- Plugin система
- Оптимизация: escape analysis, inlining, memory layout, GC tuning
- Паттерны: Functional Options, Builder, Strategy, Observer
- Чистая архитектура (Clean Architecture) в Go
- DDD основы в Go
- Внутренности Go: компиляция, GMP, модель памяти, GC
- Экосистема Go: обзор ключевых библиотек
- 🛠 Сквозной проект: generics + clean architecture для Todo

---

## Дополнительные материалы

- [[Temporal Go]] — Temporal workflow engine для Go
- [[Selfgo]] — Конспект по основам Go (альтернативный формат)

## Ресурсы

- [Официальная документация Go](https://go.dev/doc/)
- [Go by Example](https://gobyexample.com/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go Proverbs](https://go-proverbs.github.io/)
- [Go Wiki](https://go.dev/wiki/)
- [Awesome Go](https://awesome-go.com/)
