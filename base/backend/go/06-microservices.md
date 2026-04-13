---
tags:
  - backend
  - golang
  - go
  - microservices
  - kafka
  - nats
  - rabbitmq
  - architecture
---

# Микросервисы на Go

Go стал одним из самых популярных языков для построения микросервисной архитектуры. Быстрая компиляция в единый бинарный файл, встроенная конкурентность, минимальное потребление ресурсов и богатая стандартная библиотека делают его идеальным выбором для создания высоконагруженных распределённых систем. В этой главе мы рассмотрим архитектурные паттерны, способы межсервисного взаимодействия, работу с брокерами сообщений и построение полноценного микросервисного приложения.

---

## 1. Архитектура микросервисов

### От монолита к микросервисам

Монолитная архитектура — это когда всё приложение представляет собой единый развёртываемый артефакт. Все модули живут в одном процессе, используют одну базу данных и деплоятся вместе. Для небольших команд и стартапов это отличный выбор — простота разработки, отладки и развёртывания.

Проблемы начинаются, когда проект растёт:

- **Масштабирование** — нужно масштабировать всё приложение, даже если нагрузка растёт только на один модуль
- **Развёртывание** — изменение в одной строке требует пересборки и деплоя всего приложения
- **Надёжность** — ошибка в одном модуле может уронить весь сервис
- **Команда** — десятки разработчиков работают в одном репозитории, конфликты при мерже, сложный code review

> [!NOTE] Закон Конвея (Conway's Law)
> Организации проектируют системы, которые копируют структуру коммуникации этой организации. Если у вас три команды — вы получите три сервиса. Микросервисная архитектура работает лучше всего, когда каждый сервис принадлежит одной команде.

Микросервисная архитектура — это подход, при котором приложение разбивается на набор небольших, независимо развёртываемых сервисов. Каждый сервис:

- Отвечает за одну бизнес-функцию (Single Responsibility)
- Имеет собственную базу данных (Database per Service)
- Общается с другими сервисами через сеть (API, сообщения)
- Развёртывается независимо от других

Подробнее о принципах проектирования распределённых систем — в [[System Design]].

### Когда переходить на микросервисы

Не стоит начинать проект сразу с микросервисов. Рекомендуемый путь:

1. **Начните с монолита** — быстрая разработка, простое тестирование
2. **Выделите чёткие модули** — хорошая модульная архитектура внутри монолита
3. **Определите границы** — когда модули стабильны, их можно выделять в отдельные сервисы
4. **Разделяйте постепенно** — по одному сервису за раз, начиная с самых независимых

> [!WARNING] Когда НЕ нужны микросервисы
> - Маленькая команда (до 5-7 человек)
> - MVP и прототипы — скорость важнее архитектуры
> - Нет DevOps-культуры и инфраструктуры (CI/CD, контейнеры, оркестрация)
> - Домен недостаточно изучен — вы не знаете, где проводить границы

### Преимущества

| Преимущество | Описание |
|---|---|
| Независимый деплой | Каждый сервис деплоится отдельно, без влияния на другие |
| Масштабирование | Масштабируем только те сервисы, которые под нагрузкой |
| Технологическое разнообразие | Разные сервисы могут использовать разные языки и БД |
| Отказоустойчивость | Падение одного сервиса не роняет всю систему |
| Организационная гибкость | Каждая команда владеет своими сервисами |

### Вызовы

| Вызов | Описание |
|---|---|
| Распределённые транзакции | Нет единой ACID-транзакции между сервисами |
| Сетевые сбои | Сеть ненадёжна, сервисы могут быть недоступны |
| Согласованность данных | Eventual consistency вместо strong consistency |
| Наблюдаемость | Сложнее отследить запрос через десяток сервисов |
| Операционная сложность | Больше сервисов = больше мониторинга, деплоев, конфигов |
| Тестирование | Интеграционные и E2E тесты значительно сложнее |

```go
// Типичная структура микросервисного проекта
// Каждый сервис — отдельный Go-модуль со своим go.mod

// project/
// ├── services/
// │   ├── user-service/          # Сервис пользователей
// │   │   ├── cmd/
// │   │   │   └── main.go        # Точка входа
// │   │   ├── internal/
// │   │   │   ├── handler/       # HTTP/gRPC обработчики
// │   │   │   ├── service/       # Бизнес-логика
// │   │   │   ├── repository/    # Доступ к данным
// │   │   │   └── model/         # Модели данных
// │   │   ├── go.mod
// │   │   └── Dockerfile
// │   ├── order-service/         # Сервис заказов
// │   │   ├── cmd/
// │   │   │   └── main.go
// │   │   ├── internal/
// │   │   ├── go.mod
// │   │   └── Dockerfile
// │   └── notification-service/  # Сервис уведомлений
// │       ├── cmd/
// │       │   └── main.go
// │       ├── internal/
// │       ├── go.mod
// │       └── Dockerfile
// ├── proto/                     # Общие protobuf-определения
// │   └── user/
// │       └── user.proto
// ├── pkg/                       # Общие библиотеки
// │   ├── logger/
// │   ├── middleware/
// │   └── events/
// └── docker-compose.yml         # Локальная среда разработки
```

###### 🏠 Домашнее задание

1. Нарисуйте диаграмму текущего или учебного проекта в виде монолита. Определите, какие модули можно было бы выделить в отдельные сервисы.
2. Для каждого потенциального сервиса определите: какие данные ему принадлежат, через какой API он общается с другими, какие зависимости у него есть.
3. Опишите, какие вызовы (из таблицы выше) возникнут при разделении, и предложите подходы к их решению.

---

## 2. Паттерны микросервисов

### API Gateway

API Gateway — единая точка входа для всех внешних клиентов. Вместо того чтобы клиент обращался к десяткам сервисов напрямую, он обращается к одному Gateway, который маршрутизирует запросы.

Обязанности API Gateway:
- **Маршрутизация** — направление запросов к нужным сервисам
- **Аутентификация** — проверка токенов, JWT-валидация
- **Rate Limiting** — ограничение частоты запросов
- **Агрегация** — объединение ответов от нескольких сервисов
- **Кеширование** — кеширование часто запрашиваемых данных
- **Трансформация** — преобразование форматов (REST → gRPC)

```go
package main

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"
	"time"
)

// RateLimiter — простой rate limiter на основе token bucket
type RateLimiter struct {
	mu       sync.Mutex
	tokens   map[string]int    // количество оставшихся токенов по IP
	lastTime map[string]time.Time
	rate     int               // максимум запросов
	interval time.Duration     // за какой период
}

// NewRateLimiter создаёт новый rate limiter
func NewRateLimiter(rate int, interval time.Duration) *RateLimiter {
	return &RateLimiter{
		tokens:   make(map[string]int),
		lastTime: make(map[string]time.Time),
		rate:     rate,
		interval: interval,
	}
}

// Allow проверяет, можно ли пропустить запрос от данного IP
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	last, exists := rl.lastTime[ip]

	// Если прошло достаточно времени — сбрасываем счётчик
	if !exists || now.Sub(last) > rl.interval {
		rl.tokens[ip] = rl.rate
		rl.lastTime[ip] = now
	}

	if rl.tokens[ip] > 0 {
		rl.tokens[ip]--
		return true
	}
	return false
}

// APIGateway — простой API Gateway с маршрутизацией и middleware
type APIGateway struct {
	routes  map[string]*httputil.ReverseProxy // маршруты к сервисам
	limiter *RateLimiter
	logger  *slog.Logger
}

// NewAPIGateway создаёт Gateway с настроенными маршрутами
func NewAPIGateway(logger *slog.Logger) *APIGateway {
	gw := &APIGateway{
		routes:  make(map[string]*httputil.ReverseProxy),
		limiter: NewRateLimiter(100, time.Minute), // 100 запросов в минуту
		logger:  logger,
	}

	// Регистрация маршрутов к внутренним сервисам
	gw.registerRoute("/api/users", "http://user-service:8081")
	gw.registerRoute("/api/orders", "http://order-service:8082")
	gw.registerRoute("/api/products", "http://product-service:8083")

	return gw
}

// registerRoute добавляет маршрут к конкретному сервису
func (gw *APIGateway) registerRoute(prefix, target string) {
	targetURL, err := url.Parse(target)
	if err != nil {
		gw.logger.Error("не удалось распарсить URL сервиса",
			"target", target, "error", err)
		return
	}

	// httputil.ReverseProxy — стандартный обратный прокси Go
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	gw.routes[prefix] = proxy
}

// ServeHTTP обрабатывает все входящие запросы
func (gw *APIGateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// 1. Rate Limiting
	clientIP := r.RemoteAddr
	if !gw.limiter.Allow(clientIP) {
		http.Error(w, `{"error": "rate limit exceeded"}`, http.StatusTooManyRequests)
		return
	}

	// 2. Аутентификация (упрощённая проверка JWT)
	token := r.Header.Get("Authorization")
	if token == "" && !strings.HasPrefix(r.URL.Path, "/api/auth") {
		http.Error(w, `{"error": "unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// 3. Маршрутизация к нужному сервису
	for prefix, proxy := range gw.routes {
		if strings.HasPrefix(r.URL.Path, prefix) {
			gw.logger.Info("проксирование запроса",
				"path", r.URL.Path,
				"target", prefix,
				"method", r.Method,
			)
			proxy.ServeHTTP(w, r)
			return
		}
	}

	// Сервис не найден
	http.Error(w, `{"error": "service not found"}`, http.StatusNotFound)
}

func main() {
	logger := slog.Default()
	gateway := NewAPIGateway(logger)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      gateway,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	logger.Info("API Gateway запущен", "addr", ":8080")
	if err := server.ListenAndServe(); err != nil {
		logger.Error("ошибка сервера", "error", err)
	}
}
```

### Service Discovery

В микросервисной архитектуре сервисы создаются и уничтожаются динамически. Жёсткое указание адресов (hardcoded URLs) не работает. Service Discovery решает задачу: как один сервис находит другой?

**Client-side discovery** — клиент сам запрашивает реестр и выбирает инстанс:

```go
package discovery

import (
	"fmt"
	"math/rand"
	"sync"
)

// ServiceInstance — информация об одном экземпляре сервиса
type ServiceInstance struct {
	ID      string // уникальный идентификатор инстанса
	Name    string // имя сервиса (например, "user-service")
	Host    string // адрес хоста
	Port    int    // порт
	Healthy bool   // флаг здоровья
}

// Addr возвращает полный адрес инстанса
func (s ServiceInstance) Addr() string {
	return fmt.Sprintf("http://%s:%d", s.Host, s.Port)
}

// Registry — простой реестр сервисов (in-memory)
// В продакшене используют Consul, etcd или DNS-based discovery
type Registry struct {
	mu       sync.RWMutex
	services map[string][]ServiceInstance // имя сервиса → список инстансов
}

// NewRegistry создаёт пустой реестр
func NewRegistry() *Registry {
	return &Registry{
		services: make(map[string][]ServiceInstance),
	}
}

// Register добавляет инстанс сервиса в реестр
func (r *Registry) Register(instance ServiceInstance) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.services[instance.Name] = append(r.services[instance.Name], instance)
}

// Deregister удаляет инстанс из реестра (при остановке сервиса)
func (r *Registry) Deregister(serviceName, instanceID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	instances := r.services[serviceName]
	for i, inst := range instances {
		if inst.ID == instanceID {
			// Удаляем элемент из слайса
			r.services[serviceName] = append(instances[:i], instances[i+1:]...)
			return
		}
	}
}

// Discover возвращает случайный здоровый инстанс (простая балансировка)
func (r *Registry) Discover(serviceName string) (ServiceInstance, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	instances := r.services[serviceName]

	// Фильтруем только здоровые инстансы
	var healthy []ServiceInstance
	for _, inst := range instances {
		if inst.Healthy {
			healthy = append(healthy, inst)
		}
	}

	if len(healthy) == 0 {
		return ServiceInstance{}, fmt.Errorf(
			"нет доступных инстансов сервиса %s", serviceName,
		)
	}

	// Случайный выбор — простейшая форма балансировки
	return healthy[rand.Intn(len(healthy))], nil
}

// DiscoverAll возвращает все здоровые инстансы сервиса
func (r *Registry) DiscoverAll(serviceName string) []ServiceInstance {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var healthy []ServiceInstance
	for _, inst := range r.services[serviceName] {
		if inst.Healthy {
			healthy = append(healthy, inst)
		}
	}
	return healthy
}
```

**Server-side discovery** — используется балансировщик нагрузки (Kubernetes Service, AWS ELB), который сам знает о доступных инстансах. Клиент обращается к фиксированному адресу, балансировщик маршрутизирует запрос.

> [!TIP] В Kubernetes
> В Kubernetes каждый Service получает DNS-имя вида `<service-name>.<namespace>.svc.cluster.local`. Это server-side discovery из коробки — не нужен отдельный реестр типа Consul.

### Circuit Breaker

Circuit Breaker — паттерн, предотвращающий каскадные сбои. Если сервис, к которому мы обращаемся, постоянно отвечает ошибками, Circuit Breaker «размыкает цепь» и перестаёт отправлять запросы, давая сервису время на восстановление.

Три состояния:
- **Closed** — запросы проходят нормально, ошибки считаются
- **Open** — все запросы немедленно отклоняются без вызова сервиса
- **Half-Open** — пропускается один тестовый запрос; если успешен — переход в Closed, если нет — обратно в Open

Подробнее о реализации конкурентных паттернов — в [[05-concurrency]].

```go
package circuitbreaker

import (
	"errors"
	"sync"
	"time"
)

// State — состояние Circuit Breaker
type State int

const (
	StateClosed   State = iota // Нормальная работа
	StateOpen                  // Запросы блокируются
	StateHalfOpen              // Тестовый режим
)

// String возвращает строковое представление состояния
func (s State) String() string {
	switch s {
	case StateClosed:
		return "CLOSED"
	case StateOpen:
		return "OPEN"
	case StateHalfOpen:
		return "HALF-OPEN"
	default:
		return "UNKNOWN"
	}
}

var (
	ErrCircuitOpen = errors.New("circuit breaker is open")
)

// CircuitBreaker реализует паттерн Circuit Breaker
type CircuitBreaker struct {
	mu               sync.Mutex
	state            State
	failureCount     int           // текущее количество последовательных ошибок
	failureThreshold int           // порог для перехода в Open
	successCount     int           // количество успехов в Half-Open
	successThreshold int           // порог для возврата в Closed
	timeout          time.Duration // время, через которое Open → Half-Open
	lastFailure      time.Time     // время последней ошибки
}

// NewCircuitBreaker создаёт Circuit Breaker с заданными параметрами
func NewCircuitBreaker(failureThreshold, successThreshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:            StateClosed,
		failureThreshold: failureThreshold,
		successThreshold: successThreshold,
		timeout:          timeout,
	}
}

// Execute выполняет функцию через Circuit Breaker
func (cb *CircuitBreaker) Execute(fn func() error) error {
	cb.mu.Lock()

	switch cb.state {
	case StateOpen:
		// Проверяем, не пора ли перейти в Half-Open
		if time.Since(cb.lastFailure) > cb.timeout {
			cb.state = StateHalfOpen
			cb.successCount = 0
			cb.mu.Unlock()
			// Пропускаем один тестовый запрос
			return cb.doRequest(fn)
		}
		cb.mu.Unlock()
		return ErrCircuitOpen

	case StateHalfOpen:
		cb.mu.Unlock()
		return cb.doRequest(fn)

	default: // StateClosed
		cb.mu.Unlock()
		return cb.doRequest(fn)
	}
}

// doRequest выполняет запрос и обновляет состояние
func (cb *CircuitBreaker) doRequest(fn func() error) error {
	err := fn()

	cb.mu.Lock()
	defer cb.mu.Unlock()

	if err != nil {
		cb.failureCount++
		cb.lastFailure = time.Now()

		// Если ошибок слишком много — размыкаем цепь
		if cb.failureCount >= cb.failureThreshold {
			cb.state = StateOpen
		}
		return err
	}

	// Запрос успешен
	if cb.state == StateHalfOpen {
		cb.successCount++
		// Если достаточно успешных запросов — замыкаем цепь
		if cb.successCount >= cb.successThreshold {
			cb.state = StateClosed
			cb.failureCount = 0
		}
	} else {
		// В Closed-состоянии сбрасываем счётчик ошибок при успехе
		cb.failureCount = 0
	}

	return nil
}

// State возвращает текущее состояние
func (cb *CircuitBreaker) GetState() State {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	return cb.state
}
```

> [!TIP] Библиотека sony/gobreaker
> В продакшене рекомендуется использовать готовую библиотеку `github.com/sony/gobreaker`, которая предоставляет настраиваемый Circuit Breaker с поддержкой колбэков и метрик.

### Retry с экспоненциальной задержкой и jitter

При временных сбоях (таймаут сети, 503) имеет смысл повторить запрос. Но делать это нужно с увеличивающимися интервалами и добавлением случайного отклонения (jitter), чтобы избежать «thundering herd» — когда все клиенты повторяют запросы одновременно.

```go
package retry

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"time"
)

// Config — настройки политики повторов
type Config struct {
	MaxRetries  int           // максимальное количество попыток
	BaseDelay   time.Duration // начальная задержка
	MaxDelay    time.Duration // максимальная задержка
	Multiplier  float64       // множитель для экспоненциального роста
	JitterRatio float64       // доля случайного отклонения (0.0–1.0)
}

// DefaultConfig возвращает стандартную конфигурацию
func DefaultConfig() Config {
	return Config{
		MaxRetries:  3,
		BaseDelay:   100 * time.Millisecond,
		MaxDelay:    10 * time.Second,
		Multiplier:  2.0,
		JitterRatio: 0.3, // ±30% к вычисленной задержке
	}
}

// Do выполняет функцию с повторами при ошибке
func Do(ctx context.Context, cfg Config, fn func() error) error {
	var lastErr error

	for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
		// Выполняем функцию
		lastErr = fn()
		if lastErr == nil {
			return nil // Успех — выходим
		}

		// Если это последняя попытка — не ждём
		if attempt == cfg.MaxRetries {
			break
		}

		// Вычисляем задержку: base * multiplier^attempt
		delay := float64(cfg.BaseDelay) * math.Pow(cfg.Multiplier, float64(attempt))
		if delay > float64(cfg.MaxDelay) {
			delay = float64(cfg.MaxDelay)
		}

		// Добавляем jitter — случайное отклонение
		jitter := delay * cfg.JitterRatio * (rand.Float64()*2 - 1)
		actualDelay := time.Duration(delay + jitter)

		fmt.Printf("Попытка %d/%d не удалась: %v. Повтор через %v\n",
			attempt+1, cfg.MaxRetries+1, lastErr, actualDelay)

		// Ждём с учётом контекста (можно отменить извне)
		select {
		case <-ctx.Done():
			return fmt.Errorf("повторы отменены: %w", ctx.Err())
		case <-time.After(actualDelay):
			// Продолжаем следующую попытку
		}
	}

	return fmt.Errorf("все %d попыток исчерпаны: %w", cfg.MaxRetries+1, lastErr)
}
```

### Bulkhead

Паттерн Bulkhead изолирует разные части системы, чтобы отказ одной не затронул другие. Аналогия с переборками на корабле — если одна секция затоплена, остальные защищены.

В Go это реализуется через ограничение конкурентных запросов с помощью семафоров:

```go
package bulkhead

import (
	"context"
	"errors"
	"time"
)

var ErrBulkheadFull = errors.New("bulkhead: все слоты заняты")

// Bulkhead ограничивает количество параллельных запросов к ресурсу
type Bulkhead struct {
	semaphore chan struct{} // буферизированный канал как семафор
	timeout   time.Duration
}

// NewBulkhead создаёт Bulkhead с ограничением на maxConcurrent запросов
func NewBulkhead(maxConcurrent int, timeout time.Duration) *Bulkhead {
	return &Bulkhead{
		semaphore: make(chan struct{}, maxConcurrent),
		timeout:   timeout,
	}
}

// Execute выполняет функцию, если есть свободный слот
func (b *Bulkhead) Execute(ctx context.Context, fn func() error) error {
	// Пытаемся занять слот с таймаутом
	select {
	case b.semaphore <- struct{}{}:
		// Слот получен — выполняем функцию
		defer func() { <-b.semaphore }() // освобождаем слот после выполнения
		return fn()

	case <-time.After(b.timeout):
		return ErrBulkheadFull

	case <-ctx.Done():
		return ctx.Err()
	}
}

// Пример использования: разные Bulkhead для разных сервисов
// userBulkhead := bulkhead.NewBulkhead(20, 5*time.Second)  // макс 20 запросов к user-service
// orderBulkhead := bulkhead.NewBulkhead(10, 5*time.Second) // макс 10 запросов к order-service
//
// Если order-service тормозит, он займёт только свои 10 слотов,
// а user-service продолжит работать с 20 свободными слотами.
```

### Sidecar-паттерн

Sidecar — это вспомогательный процесс, который развёртывается рядом с основным сервисом (в одном Pod в Kubernetes). Он берёт на себя сквозные задачи: логирование, мониторинг, mTLS, прокси. Пример — Envoy proxy в Istio service mesh. Основной сервис общается с sidecar по localhost, а sidecar уже маршрутизирует трафик, проверяет сертификаты и собирает метрики.

> [!INFO] Service Mesh
> Service Mesh (Istio, Linkerd) — это инфраструктурный слой, который реализует Sidecar-паттерн для всех сервисов. Он обеспечивает: mTLS между сервисами, маршрутизацию трафика, circuit breakers, retry, наблюдаемость — без изменения кода самих сервисов.

###### 🏠 Домашнее задание

1. Реализуйте обёртку HTTP-клиента, которая комбинирует Circuit Breaker, Retry и Bulkhead. При вызове внешнего сервиса должны последовательно применяться все три паттерна.
2. Добавьте к Circuit Breaker колбэк `OnStateChange(from, to State)`, который логирует переходы между состояниями.
3. Реализуйте Round-Robin балансировку в `Registry.Discover()` вместо случайного выбора.

---

## 3. Межсервисная коммуникация

Сервисы общаются друг с другом двумя основными способами: синхронно и асинхронно. Выбор зависит от требований к задержке, надёжности и связанности сервисов.

### Синхронная коммуникация

При синхронном вызове клиент отправляет запрос и ждёт ответа. Это просто, но создаёт временнУю связанность — если вызываемый сервис медленный или недоступен, вызывающий заблокирован.

**REST (HTTP/JSON)** — самый простой и распространённый способ. Широко поддерживается, легко отлаживается (curl, Postman), человекочитаемый формат.

**gRPC (HTTP/2 + Protocol Buffers)** — бинарный протокол с типизированными контрактами. Быстрее REST за счёт бинарной сериализации, поддержка стриминга, автогенерация клиентов. Подробнее о gRPC и REST — в [[03-networking]].

### Асинхронная коммуникация

При асинхронном взаимодействии отправитель не ждёт ответа. Он публикует сообщение в брокер, а получатель забирает его когда готов. Это обеспечивает:

- **Развязанность** — сервисы не знают друг о друге
- **Надёжность** — сообщения сохраняются в брокере при недоступности получателя
- **Обработка пиков** — брокер буферизирует нагрузку

### Сравнительная таблица

| Характеристика | REST | gRPC | Брокер сообщений |
|---|---|---|---|
| Тип связи | Синхронная | Синхронная | Асинхронная |
| Формат | JSON (текст) | Protobuf (бинарный) | Любой |
| Производительность | Средняя | Высокая | Зависит от брокера |
| Типизация | Нет (OpenAPI) | Строгая (.proto) | Нужна схема |
| Стриминг | Нет (WebSocket) | Да | Да |
| Связанность | Высокая | Высокая | Низкая |
| Отладка | Простая | Нужны инструменты | Нужны инструменты |
| Когда использовать | CRUD API, простые запросы | Внутренняя связь, streaming | События, фоновые задачи |

> [!summary] Правило выбора
> - Нужен немедленный ответ → синхронный вызов (REST/gRPC)
> - Можно обработать позже → асинхронный (брокер сообщений)
> - Внутренняя коммуникация с высокими требованиями к скорости → gRPC
> - Публичный API → REST
> - Событийная архитектура → брокер сообщений

###### 🏠 Домашнее задание

1. Реализуйте простой HTTP-клиент для вызова другого сервиса с retry (3 попытки), таймаутом (5 секунд) и логированием. Используйте `context.Context` для управления отменой.
2. Подумайте, какие вызовы в вашем проекте можно сделать асинхронными (отправка email, генерация отчётов, обновление кеша).

---

## 4. RabbitMQ (amqp091-go)

RabbitMQ — это классический брокер сообщений, реализующий протокол AMQP. Он отлично подходит для задач, где важна гарантия доставки, маршрутизация сообщений по правилам и управление очередями. Подробнее о работе с сетевыми протоколами — в [[03-networking]].

### Основные концепции

- **Connection** — TCP-соединение с брокером (тяжёлый ресурс, одно на приложение)
- **Channel** — виртуальное соединение внутри Connection (лёгкий, один на горутину)
- **Exchange** — маршрутизатор сообщений. Принимает сообщение и направляет в очереди по правилам
- **Queue** — буфер, хранящий сообщения до обработки потребителем
- **Binding** — правило, связывающее Exchange и Queue
- **Routing Key** — ключ, по которому Exchange решает, в какую очередь направить сообщение

### Типы Exchange

| Тип | Маршрутизация |
|---|---|
| **direct** | Точное совпадение routing key с binding key |
| **topic** | Паттерн с подстановочными символами (* — одно слово, # — ноль и более слов) |
| **fanout** | Отправка во все привязанные очереди (broadcast) |
| **headers** | Маршрутизация по заголовкам сообщения |

### Подключение и настройка

```go
package rabbitmq

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Connection — обёртка над AMQP-соединением с переподключением
type Connection struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	logger  *slog.Logger
	url     string
}

// NewConnection устанавливает соединение с RabbitMQ
func NewConnection(url string, logger *slog.Logger) (*Connection, error) {
	// Устанавливаем TCP-соединение
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("не удалось подключиться к RabbitMQ: %w", err)
	}

	// Открываем канал — лёгкое виртуальное соединение
	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("не удалось открыть канал: %w", err)
	}

	// Устанавливаем prefetch — сколько сообщений брокер отправит
	// потребителю до получения подтверждения (ack)
	// Это контролирует нагрузку на потребителя
	err = ch.Qos(
		10,    // prefetch count — не более 10 неподтверждённых сообщений
		0,     // prefetch size — без ограничения по размеру
		false, // global — применяется к каналу, а не ко всему соединению
	)
	if err != nil {
		return nil, fmt.Errorf("не удалось установить QoS: %w", err)
	}

	logger.Info("подключение к RabbitMQ установлено", "url", url)

	return &Connection{
		conn:    conn,
		channel: ch,
		logger:  logger,
		url:     url,
	}, nil
}

// DeclareExchange создаёт exchange, если он не существует
func (c *Connection) DeclareExchange(name, kind string) error {
	return c.channel.ExchangeDeclare(
		name,  // имя exchange
		kind,  // тип: "direct", "topic", "fanout", "headers"
		true,  // durable — exchange переживёт перезапуск RabbitMQ
		false, // autoDelete — не удалять, когда нет привязанных очередей
		false, // internal — можно публиковать напрямую
		false, // noWait — ждать подтверждения от сервера
		nil,   // args — дополнительные параметры
	)
}

// DeclareQueue создаёт очередь и возвращает её имя
func (c *Connection) DeclareQueue(name string, args amqp.Table) (amqp.Queue, error) {
	return c.channel.QueueDeclare(
		name,  // имя очереди (пустая строка — сервер сгенерирует уникальное)
		true,  // durable — очередь переживёт перезапуск
		false, // autoDelete — не удалять, когда нет потребителей
		false, // exclusive — не эксклюзивная (доступна из других соединений)
		false, // noWait — ждать подтверждения
		args,  // аргументы (например, для Dead Letter Queue)
	)
}

// BindQueue привязывает очередь к exchange с routing key
func (c *Connection) BindQueue(queueName, routingKey, exchangeName string) error {
	return c.channel.QueueBind(
		queueName,    // имя очереди
		routingKey,   // routing key для маршрутизации
		exchangeName, // имя exchange
		false,        // noWait
		nil,          // args
	)
}

// Close закрывает канал и соединение
func (c *Connection) Close() {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		c.conn.Close()
	}
	c.logger.Info("соединение с RabbitMQ закрыто")
}
```

### Публикация сообщений

```go
// Message — структура сообщения для отправки
type Message struct {
	Type      string      `json:"type"`       // тип события
	Payload   interface{} `json:"payload"`    // данные
	Timestamp time.Time   `json:"timestamp"`  // время создания
	MessageID string      `json:"message_id"` // уникальный идентификатор
}

// Publish отправляет сообщение в exchange с указанным routing key
func (c *Connection) Publish(ctx context.Context, exchange, routingKey string, msg Message) error {
	// Сериализуем сообщение в JSON
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("ошибка сериализации сообщения: %w", err)
	}

	// Публикуем сообщение
	err = c.channel.PublishWithContext(ctx,
		exchange,   // exchange — куда отправляем
		routingKey, // routing key — по какому ключу маршрутизировать
		false,      // mandatory — вернуть сообщение, если не удалось маршрутизировать
		false,      // immediate — доставить немедленно или вернуть
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,      // сообщение сохраняется на диск
			MessageId:    msg.MessageID,         // для дедупликации
			Timestamp:    msg.Timestamp,
			Body:         body,
		},
	)
	if err != nil {
		return fmt.Errorf("ошибка публикации сообщения: %w", err)
	}

	c.logger.Info("сообщение опубликовано",
		"exchange", exchange,
		"routing_key", routingKey,
		"message_id", msg.MessageID,
	)
	return nil
}
```

### Потребление сообщений

```go
// MessageHandler — функция-обработчик входящих сообщений
type MessageHandler func(ctx context.Context, msg Message) error

// Consume начинает потребление сообщений из очереди
func (c *Connection) Consume(ctx context.Context, queueName string, handler MessageHandler) error {
	// Запускаем потребление
	deliveries, err := c.channel.Consume(
		queueName,  // имя очереди
		"",         // consumer tag (пустой — сервер сгенерирует)
		false,      // autoAck — НЕ автоматическое подтверждение
		false,      // exclusive
		false,      // noLocal
		false,      // noWait
		nil,        // args
	)
	if err != nil {
		return fmt.Errorf("ошибка подписки на очередь: %w", err)
	}

	c.logger.Info("начато потребление сообщений", "queue", queueName)

	// Обрабатываем сообщения в цикле
	for {
		select {
		case <-ctx.Done():
			c.logger.Info("потребление остановлено", "queue", queueName)
			return nil

		case delivery, ok := <-deliveries:
			if !ok {
				return fmt.Errorf("канал доставки закрыт")
			}

			// Десериализуем сообщение
			var msg Message
			if err := json.Unmarshal(delivery.Body, &msg); err != nil {
				c.logger.Error("ошибка десериализации",
					"error", err,
					"body", string(delivery.Body),
				)
				// Nack без requeue — сообщение уйдёт в Dead Letter Queue
				delivery.Nack(false, false)
				continue
			}

			// Обрабатываем сообщение
			if err := handler(ctx, msg); err != nil {
				c.logger.Error("ошибка обработки сообщения",
					"error", err,
					"message_id", msg.MessageID,
				)
				// Nack с requeue — сообщение вернётся в очередь
				// для повторной обработки
				delivery.Nack(false, true)
				continue
			}

			// Подтверждаем успешную обработку
			delivery.Ack(false)
			c.logger.Debug("сообщение обработано",
				"message_id", msg.MessageID,
			)
		}
	}
}
```

### Dead Letter Queue

Dead Letter Queue (DLQ) — это очередь для «мёртвых» сообщений, которые не удалось обработать. Это позволяет не терять проблемные сообщения и анализировать их позже.

```go
// SetupWithDLQ создаёт основную очередь с привязкой к Dead Letter Queue
func (c *Connection) SetupWithDLQ(exchangeName, queueName, routingKey string) error {
	// 1. Создаём DLQ exchange и очередь
	dlxName := exchangeName + ".dlx"
	dlqName := queueName + ".dlq"

	if err := c.DeclareExchange(dlxName, "direct"); err != nil {
		return fmt.Errorf("ошибка создания DLX: %w", err)
	}

	if _, err := c.DeclareQueue(dlqName, nil); err != nil {
		return fmt.Errorf("ошибка создания DLQ: %w", err)
	}

	if err := c.BindQueue(dlqName, routingKey, dlxName); err != nil {
		return fmt.Errorf("ошибка привязки DLQ: %w", err)
	}

	// 2. Создаём основной exchange
	if err := c.DeclareExchange(exchangeName, "direct"); err != nil {
		return fmt.Errorf("ошибка создания exchange: %w", err)
	}

	// 3. Создаём основную очередь с привязкой к DLX
	// При Nack (без requeue) сообщение автоматически уйдёт в DLQ
	args := amqp.Table{
		"x-dead-letter-exchange":    dlxName,    // куда отправлять отклонённые
		"x-dead-letter-routing-key": routingKey, // с каким routing key
		"x-message-ttl":             int32(60000), // TTL в миллисекундах (60 сек)
	}

	if _, err := c.DeclareQueue(queueName, args); err != nil {
		return fmt.Errorf("ошибка создания очереди: %w", err)
	}

	if err := c.BindQueue(queueName, routingKey, exchangeName); err != nil {
		return fmt.Errorf("ошибка привязки очереди: %w", err)
	}

	c.logger.Info("очередь с DLQ настроена",
		"queue", queueName,
		"dlq", dlqName,
		"exchange", exchangeName,
	)
	return nil
}
```

### Полный пример Producer/Consumer

```go
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/google/uuid"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))

	// Подключаемся к RabbitMQ
	rabbitURL := "amqp://guest:guest@localhost:5672/"
	conn, err := NewConnection(rabbitURL, logger)
	if err != nil {
		logger.Error("ошибка подключения", "error", err)
		os.Exit(1)
	}
	defer conn.Close()

	// Настраиваем exchange, очередь и DLQ
	exchangeName := "orders"
	queueName := "order.processing"
	routingKey := "order.created"

	if err := conn.SetupWithDLQ(exchangeName, queueName, routingKey); err != nil {
		logger.Error("ошибка настройки очередей", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Запускаем Consumer в отдельной горутине
	go func() {
		err := conn.Consume(ctx, queueName, func(ctx context.Context, msg Message) error {
			logger.Info("получено сообщение",
				"type", msg.Type,
				"message_id", msg.MessageID,
				"payload", msg.Payload,
			)
			// Здесь бизнес-логика обработки заказа
			return nil
		})
		if err != nil {
			logger.Error("ошибка потребителя", "error", err)
		}
	}()

	// Публикуем тестовые сообщения
	for i := 0; i < 5; i++ {
		msg := Message{
			Type: "order.created",
			Payload: map[string]interface{}{
				"order_id": fmt.Sprintf("ORD-%d", i+1),
				"amount":   99.99 * float64(i+1),
				"user_id":  "USR-001",
			},
			Timestamp: time.Now(),
			MessageID: uuid.New().String(),
		}

		if err := conn.Publish(ctx, exchangeName, routingKey, msg); err != nil {
			logger.Error("ошибка публикации", "error", err)
		}
		time.Sleep(500 * time.Millisecond)
	}

	// Ожидаем сигнал завершения
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	logger.Info("получен сигнал завершения, останавливаем...")
	cancel()
	time.Sleep(time.Second) // Даём время на graceful shutdown
}
```

> [!WARNING] Важно: подтверждения (ack/nack)
> Никогда не используйте `autoAck: true` в продакшене. Если потребитель упадёт после получения сообщения, но до его обработки — сообщение будет потеряно навсегда. Всегда подтверждайте (`Ack`) вручную после успешной обработки и отклоняйте (`Nack`) при ошибке.

###### 🏠 Домашнее задание

1. Реализуйте паттерн с topic exchange: публикатор отправляет события `order.created`, `order.paid`, `order.shipped`; один потребитель подписан на `order.*`, другой — только на `order.paid`.
2. Добавьте обработку DLQ: отдельный потребитель читает сообщения из Dead Letter Queue и логирует их с деталями ошибки.
3. Реализуйте механизм повторных попыток с задержкой через TTL и DLQ: при ошибке обработки сообщение уходит в DLQ с TTL=30s, после чего возвращается в основную очередь.

---

## 5. Apache Kafka (segmentio/kafka-go)

Apache Kafka — это распределённая платформа для потоковой обработки данных. В отличие от RabbitMQ, Kafka хранит все сообщения на диске и позволяет перечитывать их. Это делает Kafka идеальным для event sourcing, аналитики и потоковой обработки.

### Основные концепции

- **Topic** — именованный канал для сообщений (аналог таблицы в БД). Подробнее о хранении данных — в [[04-databases]].
- **Partition** — раздел внутри топика. Сообщения внутри одной партиции строго упорядочены.
- **Offset** — порядковый номер сообщения внутри партиции. Потребитель отслеживает, до какого offset он прочитал.
- **Consumer Group** — группа потребителей, которая делит партиции между собой. Каждая партиция обрабатывается ровно одним потребителем в группе.
- **Broker** — один сервер Kafka. Кластер состоит из нескольких брокеров.
- **Replication Factor** — сколько копий каждой партиции хранится на разных брокерах (для отказоустойчивости).

```
Topic: "orders" (3 партиции)

Partition 0: [msg0, msg1, msg2, msg3, msg4, ...]  ← Consumer A
Partition 1: [msg0, msg1, msg2, ...]                ← Consumer B
Partition 2: [msg0, msg1, msg2, msg3, ...]          ← Consumer C

Consumer Group "order-processor" — каждый потребитель
читает из своей партиции
```

### Producer (Писатель)

```go
package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/segmentio/kafka-go"
)

// Event — структура события для Kafka
type Event struct {
	Type      string      `json:"type"`       // тип события
	Key       string      `json:"key"`        // ключ для партиционирования
	Payload   interface{} `json:"payload"`    // данные
	Timestamp time.Time   `json:"timestamp"`  // время создания
	EventID   string      `json:"event_id"`   // уникальный идентификатор
}

// Producer — писатель сообщений в Kafka
type Producer struct {
	writer *kafka.Writer
	logger *slog.Logger
}

// NewProducer создаёт нового продюсера для указанного топика
func NewProducer(brokers []string, topic string, logger *slog.Logger) *Producer {
	writer := &kafka.Writer{
		Addr:  kafka.TCP(brokers...),  // адреса брокеров
		Topic: topic,                   // топик для записи

		// Стратегия партиционирования по ключу сообщения
		// Сообщения с одинаковым ключом попадут в одну партицию
		// Это гарантирует порядок для связанных событий
		Balancer: &kafka.Hash{},

		// Батчинг — накапливаем сообщения перед отправкой
		BatchSize:    100,                    // максимум сообщений в батче
		BatchTimeout: 10 * time.Millisecond,  // максимальная задержка

		// Подтверждения от брокеров
		// RequireAll — ждём подтверждения от всех реплик
		// RequireOne — только от лидера
		// RequireNone — не ждём (самый быстрый, но ненадёжный)
		RequiredAcks: kafka.RequireAll,

		// Сжатие сообщений — экономим трафик и место на диске
		Compression: kafka.Snappy,

		// Логирование
		Logger: kafka.LoggerFunc(func(msg string, args ...interface{}) {
			logger.Debug(fmt.Sprintf(msg, args...))
		}),
		ErrorLogger: kafka.LoggerFunc(func(msg string, args ...interface{}) {
			logger.Error(fmt.Sprintf(msg, args...))
		}),
	}

	return &Producer{
		writer: writer,
		logger: logger,
	}
}

// Publish отправляет событие в Kafka
func (p *Producer) Publish(ctx context.Context, event Event) error {
	// Сериализуем payload в JSON
	value, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("ошибка сериализации события: %w", err)
	}

	// Создаём сообщение Kafka
	msg := kafka.Message{
		Key:   []byte(event.Key),  // ключ определяет партицию
		Value: value,              // данные сообщения
		Headers: []kafka.Header{
			{Key: "event_type", Value: []byte(event.Type)},
			{Key: "event_id", Value: []byte(event.EventID)},
		},
		Time: event.Timestamp,
	}

	// Отправляем сообщение
	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("ошибка записи в Kafka: %w", err)
	}

	p.logger.Info("событие опубликовано",
		"topic", p.writer.Topic,
		"event_type", event.Type,
		"event_id", event.EventID,
		"key", event.Key,
	)
	return nil
}

// PublishBatch отправляет несколько событий одним батчем
func (p *Producer) PublishBatch(ctx context.Context, events []Event) error {
	messages := make([]kafka.Message, 0, len(events))

	for _, event := range events {
		value, err := json.Marshal(event)
		if err != nil {
			return fmt.Errorf("ошибка сериализации: %w", err)
		}

		messages = append(messages, kafka.Message{
			Key:   []byte(event.Key),
			Value: value,
			Headers: []kafka.Header{
				{Key: "event_type", Value: []byte(event.Type)},
				{Key: "event_id", Value: []byte(event.EventID)},
			},
			Time: event.Timestamp,
		})
	}

	// WriteMessages в батч-режиме — эффективнее, чем по одному
	if err := p.writer.WriteMessages(ctx, messages...); err != nil {
		return fmt.Errorf("ошибка батчевой записи: %w", err)
	}

	p.logger.Info("батч событий опубликован", "count", len(events))
	return nil
}

// Close закрывает writer и дожидается отправки оставшихся сообщений
func (p *Producer) Close() error {
	return p.writer.Close()
}
```

### Consumer (Потребитель)

```go
// Consumer — потребитель сообщений из Kafka с consumer group
type Consumer struct {
	reader *kafka.Reader
	logger *slog.Logger
}

// NewConsumer создаёт нового потребителя
func NewConsumer(brokers []string, topic, groupID string, logger *slog.Logger) *Consumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: brokers,
		Topic:   topic,
		GroupID: groupID,  // Consumer Group — координация между потребителями

		// Стратегия начального чтения
		// FirstOffset — читаем с самого начала (если нет сохранённого offset)
		// LastOffset — читаем только новые сообщения
		StartOffset: kafka.FirstOffset,

		// Размер батча при чтении
		MinBytes: 1,          // минимум 1 байт — получаем сразу
		MaxBytes: 10e6,       // максимум 10 МБ за один fetch

		// Таймаут ожидания новых сообщений
		MaxWait: 1 * time.Second,

		// Автоматическая перебалансировка при добавлении/удалении потребителей
		// В consumer group каждая партиция назначается одному потребителю
		// При изменении состава группы — происходит ребалансировка
	})

	return &Consumer{
		reader: reader,
		logger: logger,
	}
}

// EventHandler — функция-обработчик событий
type EventHandler func(ctx context.Context, event Event) error

// Consume запускает бесконечный цикл потребления сообщений
func (c *Consumer) Consume(ctx context.Context, handler EventHandler) error {
	c.logger.Info("потребитель запущен",
		"topic", c.reader.Config().Topic,
		"group", c.reader.Config().GroupID,
	)

	for {
		// FetchMessage читает следующее сообщение, но НЕ коммитит offset
		// Это даёт нам at-least-once семантику — если потребитель упадёт
		// до коммита, сообщение будет прочитано повторно
		msg, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return nil // Контекст отменён — штатное завершение
			}
			c.logger.Error("ошибка чтения сообщения", "error", err)
			continue
		}

		// Десериализуем событие
		var event Event
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			c.logger.Error("ошибка десериализации",
				"error", err,
				"partition", msg.Partition,
				"offset", msg.Offset,
			)
			// Коммитим offset даже для некорректных сообщений,
			// чтобы не застрять на одном месте
			c.reader.CommitMessages(ctx, msg)
			continue
		}

		// Обрабатываем событие
		if err := handler(ctx, event); err != nil {
			c.logger.Error("ошибка обработки события",
				"error", err,
				"event_id", event.EventID,
				"event_type", event.Type,
			)
			// При ошибке можно: повторить, отправить в DLQ, или пропустить
			// В данном примере — пропускаем и коммитим
			// В продакшене стоит реализовать retry или DLQ
		}

		// Коммитим offset — подтверждаем обработку
		if err := c.reader.CommitMessages(ctx, msg); err != nil {
			c.logger.Error("ошибка коммита offset", "error", err)
		}

		c.logger.Debug("сообщение обработано",
			"topic", msg.Topic,
			"partition", msg.Partition,
			"offset", msg.Offset,
			"event_type", event.Type,
		)
	}
}

// Close закрывает reader
func (c *Consumer) Close() error {
	return c.reader.Close()
}
```

### Идемпотентная обработка сообщений

В Kafka гарантируется at-least-once доставка — это значит, что одно и то же сообщение может быть получено повторно (при ребалансировке, перезапуске). Нужно обеспечить идемпотентность обработки.

```go
package dedup

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Deduplicator предотвращает повторную обработку сообщений
// Использует Redis для хранения обработанных ID
type Deduplicator struct {
	client *redis.Client
	ttl    time.Duration // время хранения записей
	prefix string        // префикс ключа в Redis
}

// NewDeduplicator создаёт дедупликатор с Redis-бэкендом
func NewDeduplicator(client *redis.Client, prefix string, ttl time.Duration) *Deduplicator {
	return &Deduplicator{
		client: client,
		ttl:    ttl,
		prefix: prefix,
	}
}

// IsProcessed проверяет, было ли сообщение уже обработано
func (d *Deduplicator) IsProcessed(ctx context.Context, messageID string) (bool, error) {
	key := fmt.Sprintf("%s:%s", d.prefix, messageID)

	// SETNX (SET if Not eXists) — атомарная операция
	// Возвращает true, если ключ был установлен (сообщение новое)
	// Возвращает false, если ключ уже существовал (дубликат)
	wasSet, err := d.client.SetNX(ctx, key, "1", d.ttl).Result()
	if err != nil {
		return false, fmt.Errorf("ошибка проверки дедупликации: %w", err)
	}

	// wasSet=true → ключ создан → сообщение НОВОЕ → NOT processed
	// wasSet=false → ключ уже был → сообщение ДУБЛИКАТ → processed
	return !wasSet, nil
}

// ProcessWithDedup оборачивает обработчик с проверкой на дубликаты
func ProcessWithDedup(
	ctx context.Context,
	dedup *Deduplicator,
	messageID string,
	handler func() error,
) error {
	processed, err := dedup.IsProcessed(ctx, messageID)
	if err != nil {
		return fmt.Errorf("ошибка дедупликации: %w", err)
	}

	if processed {
		// Сообщение уже обработано — пропускаем
		return nil
	}

	// Обрабатываем сообщение
	return handler()
}
```

### Когда использовать Kafka vs RabbitMQ vs NATS

| Характеристика | Kafka | RabbitMQ | NATS |
|---|---|---|---|
| Модель | Лог (append-only) | Очередь (FIFO) | Pub/Sub + очереди |
| Хранение | На диске, configurable retention | До подтверждения | JetStream — на диске |
| Пропускная способность | Очень высокая (миллионы msg/s) | Высокая (десятки тысяч) | Очень высокая |
| Перечитывание | Да (по offset) | Нет | JetStream — да |
| Порядок | В пределах партиции | В пределах очереди | В пределах stream |
| Сложность | Высокая (ZooKeeper/KRaft) | Средняя | Низкая |
| Лучше всего для | Event sourcing, аналитика, стримы | Task queues, RPC, маршрутизация | Микросервисы, IoT, realtime |

###### 🏠 Домашнее задание

1. Реализуйте продюсера, который генерирует 10 000 событий с разными ключами. Проверьте, как распределяются сообщения по партициям.
2. Запустите 3 потребителя в одной consumer group и наблюдайте за распределением партиций. Остановите одного — что произойдёт при ребалансировке?
3. Реализуйте DLQ для Kafka: при ошибке обработки сообщение отправляется в отдельный топик `<topic>.dlq`.
4. Добавьте дедупликацию через Redis и проверьте, что при повторной обработке одного и того же сообщения обработчик не вызывается дважды.

---

## 6. NATS (nats.go)

NATS — это лёгкий, высокопроизводительный брокер сообщений, идеально подходящий для микросервисной архитектуры. Он прост в развёртывании (один бинарник), быстр (миллионы сообщений в секунду) и поддерживает несколько моделей коммуникации.

### Core NATS: Publish/Subscribe

Базовый NATS — это «огонь и забудь» (fire-and-forget). Сообщения не сохраняются: если подписчика нет в момент публикации — сообщение потеряно.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"time"

	"github.com/nats-io/nats.go"
)

// Event — универсальная структура события
type Event struct {
	Type      string          `json:"type"`
	Source    string          `json:"source"`     // какой сервис отправил
	Data      json.RawMessage `json:"data"`       // данные в формате JSON
	EventID   string          `json:"event_id"`
	Timestamp time.Time       `json:"timestamp"`
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// Подключаемся к NATS-серверу
	nc, err := nats.Connect(
		nats.DefaultURL,                       // nats://localhost:4222
		nats.Name("my-service"),               // имя клиента для мониторинга
		nats.ReconnectWait(2*time.Second),     // интервал переподключения
		nats.MaxReconnects(60),                // максимум попыток
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			logger.Warn("отключение от NATS", "error", err)
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			logger.Info("переподключение к NATS", "url", nc.ConnectedUrl())
		}),
	)
	if err != nil {
		logger.Error("ошибка подключения к NATS", "error", err)
		os.Exit(1)
	}
	defer nc.Close()

	logger.Info("подключено к NATS", "url", nc.ConnectedUrl())

	// --- Подписка на события ---

	// Простая подписка — получаем все сообщения по субъекту
	sub, err := nc.Subscribe("orders.created", func(msg *nats.Msg) {
		var event Event
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			logger.Error("ошибка десериализации", "error", err)
			return
		}
		logger.Info("получено событие",
			"type", event.Type,
			"event_id", event.EventID,
		)
	})
	if err != nil {
		logger.Error("ошибка подписки", "error", err)
		os.Exit(1)
	}
	defer sub.Unsubscribe()

	// Подписка с wildcard — * заменяет одно слово
	// orders.* → orders.created, orders.updated, orders.deleted
	nc.Subscribe("orders.*", func(msg *nats.Msg) {
		logger.Info("все события заказов", "subject", msg.Subject)
	})

	// Подписка с wildcard — > заменяет одно или более слов
	// events.> → events.order.created, events.user.registered и т.д.
	nc.Subscribe("events.>", func(msg *nats.Msg) {
		logger.Debug("любое событие", "subject", msg.Subject)
	})

	// --- Публикация события ---
	event := Event{
		Type:      "order.created",
		Source:    "order-service",
		Data:      json.RawMessage(`{"order_id":"ORD-001","amount":150.00}`),
		EventID:   "evt-001",
		Timestamp: time.Now(),
	}

	data, _ := json.Marshal(event)
	if err := nc.Publish("orders.created", data); err != nil {
		logger.Error("ошибка публикации", "error", err)
	}

	// Ожидаем сигнал завершения
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	<-ctx.Done()
}
```

### Request/Reply (Запрос/Ответ)

NATS поддерживает паттерн «запрос-ответ» — аналог синхронного вызова, но через брокер. Это удобно для service-to-service RPC.

```go
package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/nats-io/nats.go"
)

// UserRequest — запрос информации о пользователе
type UserRequest struct {
	UserID string `json:"user_id"`
}

// UserResponse — ответ с данными пользователя
type UserResponse struct {
	UserID string `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Error  string `json:"error,omitempty"` // пустое, если ошибки нет
}

func main() {
	logger := slog.Default()
	nc, _ := nats.Connect(nats.DefaultURL)
	defer nc.Close()

	// --- Сервер (обработчик запросов) ---
	nc.Subscribe("users.get", func(msg *nats.Msg) {
		var req UserRequest
		if err := json.Unmarshal(msg.Data, &req); err != nil {
			resp, _ := json.Marshal(UserResponse{Error: "invalid request"})
			msg.Respond(resp) // Отвечаем с ошибкой
			return
		}

		// Имитация поиска пользователя в БД
		logger.Info("обработка запроса пользователя", "user_id", req.UserID)

		resp := UserResponse{
			UserID: req.UserID,
			Name:   "Иван Петров",
			Email:  "ivan@example.com",
		}
		data, _ := json.Marshal(resp)

		// msg.Respond — отправляет ответ обратно запрашивающему
		// NATS автоматически создаёт уникальный reply-subject
		msg.Respond(data)
	})

	// --- Клиент (отправитель запроса) ---

	// Формируем запрос
	reqData, _ := json.Marshal(UserRequest{UserID: "USR-001"})

	// Request — отправляем запрос и ждём ответа с таймаутом
	reply, err := nc.Request("users.get", reqData, 5*time.Second)
	if err != nil {
		logger.Error("таймаут ожидания ответа", "error", err)
		os.Exit(1)
	}

	// Десериализуем ответ
	var userResp UserResponse
	json.Unmarshal(reply.Data, &userResp)

	fmt.Printf("Пользователь: %s (%s)\n", userResp.Name, userResp.Email)
}
```

### Queue Groups (Балансировка нагрузки)

Queue Group — это механизм распределения сообщений между подписчиками. Каждое сообщение доставляется ровно одному подписчику в группе (аналог consumer group в Kafka).

```go
// Три экземпляра одного сервиса подписываются на одну группу
// NATS автоматически распределяет сообщения между ними

// Экземпляр 1
nc.QueueSubscribe("orders.process", "order-workers", func(msg *nats.Msg) {
	fmt.Println("worker-1 обрабатывает:", string(msg.Data))
})

// Экземпляр 2
nc.QueueSubscribe("orders.process", "order-workers", func(msg *nats.Msg) {
	fmt.Println("worker-2 обрабатывает:", string(msg.Data))
})

// Экземпляр 3
nc.QueueSubscribe("orders.process", "order-workers", func(msg *nats.Msg) {
	fmt.Println("worker-3 обрабатывает:", string(msg.Data))
})

// Публикация — каждое сообщение попадёт только к ОДНОМУ worker
for i := 0; i < 9; i++ {
	nc.Publish("orders.process", []byte(fmt.Sprintf("order-%d", i)))
}
// Результат: worker-1 получит ~3, worker-2 ~3, worker-3 ~3
```

### NATS JetStream (Персистентные сообщения)

JetStream — расширение NATS для гарантированной доставки. Сообщения сохраняются в потоках (streams) и могут быть перечитаны.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

func main() {
	logger := slog.Default()

	// Подключаемся к NATS
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		logger.Error("ошибка подключения", "error", err)
		os.Exit(1)
	}
	defer nc.Close()

	// Создаём JetStream-контекст
	js, err := jetstream.New(nc)
	if err != nil {
		logger.Error("ошибка JetStream", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()

	// --- Настройка Stream ---
	// Stream — хранилище сообщений для одного или нескольких субъектов
	stream, err := js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:     "ORDERS",                    // имя потока
		Subjects: []string{"orders.>"},        // какие субъекты захватывать
		Storage:  jetstream.FileStorage,       // хранение на диске (надёжнее)
		// Можно также jetstream.MemoryStorage — быстрее, но пропадёт при перезапуске

		Retention: jetstream.LimitsPolicy,     // удаление по лимитам
		MaxAge:    7 * 24 * time.Hour,         // хранить 7 дней
		MaxMsgs:   1_000_000,                  // максимум 1 млн сообщений
		MaxBytes:  1 << 30,                    // максимум 1 ГБ

		Replicas: 1,                           // количество реплик (для кластера)
	})
	if err != nil {
		logger.Error("ошибка создания stream", "error", err)
		os.Exit(1)
	}
	logger.Info("stream создан", "name", stream.CachedInfo().Config.Name)

	// --- Публикация сообщений ---
	for i := 0; i < 5; i++ {
		event := map[string]interface{}{
			"order_id": fmt.Sprintf("ORD-%03d", i+1),
			"amount":   float64(i+1) * 99.99,
			"status":   "created",
		}
		data, _ := json.Marshal(event)

		// Publish в JetStream — ждём подтверждения записи
		ack, err := js.Publish(ctx, "orders.created", data)
		if err != nil {
			logger.Error("ошибка публикации", "error", err)
			continue
		}
		logger.Info("опубликовано",
			"stream", ack.Stream,
			"sequence", ack.Sequence,
		)
	}

	// --- Consumer (Pull-based) ---
	// Pull Consumer — потребитель сам запрашивает сообщения
	consumer, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Name:          "order-processor",       // имя потребителя
		Durable:       "order-processor",       // durable — сохраняет позицию между перезапусками
		AckPolicy:     jetstream.AckExplicitPolicy, // явное подтверждение
		FilterSubject: "orders.created",        // фильтр по субъекту
		MaxDeliver:    5,                       // максимум повторных доставок
		AckWait:       30 * time.Second,        // время на обработку до повторной доставки
	})
	if err != nil {
		logger.Error("ошибка создания consumer", "error", err)
		os.Exit(1)
	}

	// Потребляем сообщения через итератор
	msgs, err := consumer.Messages()
	if err != nil {
		logger.Error("ошибка получения сообщений", "error", err)
		os.Exit(1)
	}

	// Обработка в горутине
	go func() {
		for msg := range msgs.Messages() {
			logger.Info("получено сообщение",
				"subject", msg.Subject(),
				"data", string(msg.Data()),
			)

			// Подтверждаем обработку
			msg.Ack()
		}
	}()

	// Ожидаем 5 секунд и завершаем (для демонстрации)
	time.Sleep(5 * time.Second)
	msgs.Stop()
}
```

> [!TIP] Push vs Pull Consumer
> - **Pull Consumer** — потребитель сам запрашивает сообщения. Лучше контролирует нагрузку.
> - **Push Consumer** — NATS сам отправляет сообщения потребителю. Проще в использовании, но нужно следить за backpressure.
> Для микросервисов обычно предпочтительнее Pull Consumer.

###### 🏠 Домашнее задание

1. Реализуйте систему уведомлений через NATS: один сервис публикует события `notifications.email`, `notifications.sms`, `notifications.push`; три разных потребителя обрабатывают свой тип уведомлений.
2. Используйте JetStream для гарантированной доставки: при остановке потребителя и последующем запуске — он должен получить все пропущенные сообщения.
3. Реализуйте Request/Reply для получения статуса заказа: клиент отправляет ID заказа, сервис отвечает текущим статусом из своей БД.

---

## 7. Saga-паттерн

### Проблема распределённых транзакций

В монолите у нас есть ACID-транзакции: начали транзакцию, выполнили несколько операций, закоммитили — всё атомарно. В микросервисах каждый сервис имеет свою базу данных (подробнее в [[04-databases]]), и единой транзакции нет.

Пример: оформление заказа требует:
1. Создать заказ (order-service)
2. Списать деньги (payment-service)
3. Зарезервировать товар (inventory-service)
4. Отправить уведомление (notification-service)

Если оплата прошла, но товара нет на складе — нужно вернуть деньги. Saga решает эту проблему.

### Два подхода

**Choreography (Хореография)** — каждый сервис слушает события и реагирует. Нет центрального координатора.

```
order-service → "order.created" →
    payment-service → "payment.completed" →
        inventory-service → "inventory.reserved" →
            notification-service → "notification.sent"

При ошибке — обратная цепочка:
    inventory-service → "inventory.reservation_failed" →
        payment-service → "payment.refunded" →
            order-service → "order.cancelled"
```

**Orchestration (Оркестрация)** — центральный координатор (оркестратор) управляет шагами и компенсациями.

```
Orchestrator:
    1. POST /orders → order-service
    2. POST /payments → payment-service
    3. POST /inventory/reserve → inventory-service
    4. Если шаг 3 fail:
        POST /payments/refund → payment-service
        POST /orders/cancel → order-service
```

> [!INFO] Хореография vs Оркестрация
> **Хореография** — проще для 2-3 шагов, но сложнее отслеживать flow при большом количестве сервисов. Сервисы связаны через события.
> **Оркестрация** — централизованная логика, проще отлаживать, но оркестратор — единая точка отказа. Для сложных саг (5+ шагов) обычно выбирают оркестрацию. Смотрите также [[System Design]] для паттернов распределённых систем.

### Реализация хореографии через NATS

```go
package saga

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
)

// SagaStatus — статус саги
type SagaStatus string

const (
	SagaStarted    SagaStatus = "started"
	SagaCompleted  SagaStatus = "completed"
	SagaFailed     SagaStatus = "failed"
	SagaCompensating SagaStatus = "compensating"
)

// SagaEvent — событие саги
type SagaEvent struct {
	SagaID    string          `json:"saga_id"`    // ID саги для корреляции
	Step      string          `json:"step"`       // текущий шаг
	Status    SagaStatus      `json:"status"`     // статус
	Data      json.RawMessage `json:"data"`       // данные
	Error     string          `json:"error,omitempty"`
	Timestamp time.Time       `json:"timestamp"`
}

// --- Order Service ---

// OrderService — сервис заказов
type OrderService struct {
	nc     *nats.Conn
	logger *slog.Logger
}

// NewOrderService создаёт сервис заказов и подписывается на события
func NewOrderService(nc *nats.Conn, logger *slog.Logger) *OrderService {
	svc := &OrderService{nc: nc, logger: logger}

	// Подписка на запрос компенсации — отмена заказа
	nc.Subscribe("saga.order.compensate", func(msg *nats.Msg) {
		var event SagaEvent
		json.Unmarshal(msg.Data, &event)
		svc.compensateOrder(event)
	})

	return svc
}

// CreateOrder начинает сагу — создаёт заказ и публикует событие
func (s *OrderService) CreateOrder(ctx context.Context, orderData map[string]interface{}) error {
	sagaID := uuid.New().String()
	s.logger.Info("создание заказа", "saga_id", sagaID)

	// Создаём заказ в локальной БД
	orderData["order_id"] = uuid.New().String()
	orderData["status"] = "pending"

	data, _ := json.Marshal(orderData)

	// Публикуем событие — запускаем сагу
	event := SagaEvent{
		SagaID:    sagaID,
		Step:      "order_created",
		Status:    SagaStarted,
		Data:      data,
		Timestamp: time.Now(),
	}

	eventData, _ := json.Marshal(event)
	return s.nc.Publish("saga.order.created", eventData)
}

// compensateOrder — компенсирующая транзакция: отмена заказа
func (s *OrderService) compensateOrder(event SagaEvent) {
	s.logger.Warn("компенсация: отмена заказа", "saga_id", event.SagaID)
	// Обновляем статус заказа в БД на "cancelled"
	// UPDATE orders SET status = 'cancelled' WHERE saga_id = ?
}

// --- Payment Service ---

// PaymentService — сервис оплаты
type PaymentService struct {
	nc     *nats.Conn
	logger *slog.Logger
}

// NewPaymentService создаёт сервис оплаты и подписывается на события
func NewPaymentService(nc *nats.Conn, logger *slog.Logger) *PaymentService {
	svc := &PaymentService{nc: nc, logger: logger}

	// Слушаем событие создания заказа — пытаемся провести оплату
	nc.Subscribe("saga.order.created", func(msg *nats.Msg) {
		var event SagaEvent
		json.Unmarshal(msg.Data, &event)
		svc.processPayment(event)
	})

	// Слушаем запрос компенсации — делаем возврат
	nc.Subscribe("saga.payment.compensate", func(msg *nats.Msg) {
		var event SagaEvent
		json.Unmarshal(msg.Data, &event)
		svc.compensatePayment(event)
	})

	return svc
}

// processPayment — обработка оплаты
func (s *PaymentService) processPayment(event SagaEvent) {
	s.logger.Info("обработка оплаты", "saga_id", event.SagaID)

	// Имитация обработки платежа
	// В реальности — вызов платёжного шлюза
	paymentSuccess := true // Изменить на false для тестирования компенсации

	if !paymentSuccess {
		s.logger.Error("оплата не удалась", "saga_id", event.SagaID)

		// Оплата не прошла — запускаем компенсацию заказа
		failEvent := SagaEvent{
			SagaID:    event.SagaID,
			Step:      "payment_failed",
			Status:    SagaFailed,
			Error:     "insufficient funds",
			Timestamp: time.Now(),
		}
		data, _ := json.Marshal(failEvent)
		s.nc.Publish("saga.order.compensate", data)
		return
	}

	// Оплата прошла — публикуем событие для следующего шага
	successEvent := SagaEvent{
		SagaID:    event.SagaID,
		Step:      "payment_completed",
		Status:    SagaStarted,
		Data:      event.Data,
		Timestamp: time.Now(),
	}
	data, _ := json.Marshal(successEvent)
	s.nc.Publish("saga.payment.completed", data)
}

// compensatePayment — компенсирующая транзакция: возврат средств
func (s *PaymentService) compensatePayment(event SagaEvent) {
	s.logger.Warn("компенсация: возврат средств", "saga_id", event.SagaID)
	// Возвращаем деньги пользователю
	// В реальности — вызов API платёжного шлюза для refund

	// После возврата — компенсируем заказ
	compensateEvent := SagaEvent{
		SagaID:    event.SagaID,
		Step:      "payment_refunded",
		Status:    SagaCompensating,
		Timestamp: time.Now(),
	}
	data, _ := json.Marshal(compensateEvent)
	s.nc.Publish("saga.order.compensate", data)
}

// --- Notification Service ---

// NotificationService — сервис уведомлений
type NotificationService struct {
	nc     *nats.Conn
	logger *slog.Logger
}

// NewNotificationService создаёт сервис уведомлений
func NewNotificationService(nc *nats.Conn, logger *slog.Logger) *NotificationService {
	svc := &NotificationService{nc: nc, logger: logger}

	// Слушаем успешную оплату — отправляем уведомление
	nc.Subscribe("saga.payment.completed", func(msg *nats.Msg) {
		var event SagaEvent
		json.Unmarshal(msg.Data, &event)
		svc.sendNotification(event)
	})

	// Слушаем события компенсации — уведомляем об отмене
	nc.Subscribe("saga.order.compensate", func(msg *nats.Msg) {
		var event SagaEvent
		json.Unmarshal(msg.Data, &event)
		svc.sendCancellationNotification(event)
	})

	return svc
}

// sendNotification — отправка уведомления об успехе
func (s *NotificationService) sendNotification(event SagaEvent) {
	s.logger.Info("отправка уведомления: заказ оплачен",
		"saga_id", event.SagaID,
	)
	// Отправляем email/SMS/push
}

// sendCancellationNotification — уведомление об отмене
func (s *NotificationService) sendCancellationNotification(event SagaEvent) {
	s.logger.Warn("отправка уведомления: заказ отменён",
		"saga_id", event.SagaID,
		"reason", event.Error,
	)
}

// --- Запуск всех сервисов ---

func main() {
	logger := slog.Default()

	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		logger.Error("ошибка подключения к NATS", "error", err)
		return
	}
	defer nc.Close()

	// Запускаем все сервисы
	orderSvc := NewOrderService(nc, logger)
	NewPaymentService(nc, logger)
	NewNotificationService(nc, logger)

	// Создаём тестовый заказ — запускаем сагу
	orderSvc.CreateOrder(context.Background(), map[string]interface{}{
		"user_id": "USR-001",
		"amount":  299.99,
		"items":   []string{"item-1", "item-2"},
	})

	// Ждём обработки
	fmt.Println("Нажмите Enter для выхода...")
	fmt.Scanln()
}
```

###### 🏠 Домашнее задание

1. Добавьте в сагу шаг `inventory-service` (резервирование товара) между payment и notification. Реализуйте компенсацию при нехватке товара.
2. Реализуйте Saga Orchestrator — центральный координатор, который последовательно вызывает шаги и при ошибке запускает компенсации в обратном порядке.
3. Добавьте персистентное хранение состояния саги (в PostgreSQL): saga_id, текущий шаг, статус, время создания. Это позволит восстановить незавершённые саги после перезапуска.

---

## 8. Outbox-паттерн

### Проблема двойной записи (Dual Write Problem)

Представьте: сервис должен сохранить данные в БД **и** опубликовать событие в брокер сообщений. Если сначала записать в БД, а потом в брокер — брокер может быть недоступен, и событие потеряется. Если сначала в брокер, потом в БД — БД может упасть, и данные не сохранятся.

Это и есть проблема двойной записи — нет атомарной операции, которая одновременно запишет в два разных хранилища.

### Решение: Outbox Pattern

Идея: пишем **всё** в одну БД в рамках одной транзакции — и данные, и событие (в специальную таблицу outbox). Отдельный процесс (relay/publisher) читает из outbox и отправляет в брокер.

```
1. BEGIN TRANSACTION
   INSERT INTO orders (...)
   INSERT INTO outbox (event_type, payload, ...)
   COMMIT

2. Outbox Relay (отдельная горутина):
   SELECT * FROM outbox WHERE published = false
   → Публикует в Kafka/NATS/RabbitMQ
   → UPDATE outbox SET published = true WHERE id = ?
```

### Схема таблицы Outbox

```sql
-- Таблица для хранения исходящих событий
CREATE TABLE outbox (
    id          BIGSERIAL PRIMARY KEY,
    -- Тип агрегата (например, "order", "user", "payment")
    aggregate_type VARCHAR(255) NOT NULL,
    -- ID агрегата (например, ID заказа)
    aggregate_id   VARCHAR(255) NOT NULL,
    -- Тип события (например, "order.created")
    event_type     VARCHAR(255) NOT NULL,
    -- Данные события в формате JSON
    payload        JSONB NOT NULL,
    -- Метаданные (trace_id, user_id и т.д.)
    metadata       JSONB DEFAULT '{}',
    -- Было ли событие опубликовано
    published      BOOLEAN DEFAULT FALSE,
    -- Время создания
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    -- Время публикации
    published_at   TIMESTAMPTZ
);

-- Индекс для быстрого поиска неопубликованных событий
CREATE INDEX idx_outbox_unpublished ON outbox (created_at)
    WHERE published = FALSE;
```

### Реализация на Go

```go
package outbox

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"
)

// OutboxEvent — событие в таблице outbox
type OutboxEvent struct {
	ID            int64           `json:"id"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   string          `json:"aggregate_id"`
	EventType     string          `json:"event_type"`
	Payload       json.RawMessage `json:"payload"`
	Metadata      json.RawMessage `json:"metadata"`
	Published     bool            `json:"published"`
	CreatedAt     time.Time       `json:"created_at"`
}

// Repository — работа с outbox через БД
type Repository struct {
	db     *sql.DB
	logger *slog.Logger
}

// NewRepository создаёт репозиторий outbox
func NewRepository(db *sql.DB, logger *slog.Logger) *Repository {
	return &Repository{db: db, logger: logger}
}

// SaveWithOutbox сохраняет данные и событие в одной транзакции
// execFn — функция, выполняющая основную бизнес-логику внутри транзакции
func (r *Repository) SaveWithOutbox(
	ctx context.Context,
	execFn func(tx *sql.Tx) error,
	event OutboxEvent,
) error {
	// Начинаем транзакцию
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("ошибка начала транзакции: %w", err)
	}
	defer tx.Rollback() // Rollback если не был Commit

	// Выполняем основную бизнес-логику (INSERT/UPDATE в бизнес-таблицу)
	if err := execFn(tx); err != nil {
		return fmt.Errorf("ошибка бизнес-операции: %w", err)
	}

	// Сохраняем событие в outbox — в той же транзакции!
	_, err = tx.ExecContext(ctx, `
		INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload, metadata)
		VALUES ($1, $2, $3, $4, $5)
	`, event.AggregateType, event.AggregateID, event.EventType,
		event.Payload, event.Metadata)
	if err != nil {
		return fmt.Errorf("ошибка записи в outbox: %w", err)
	}

	// Коммитим — обе записи атомарно
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("ошибка коммита: %w", err)
	}

	r.logger.Info("данные и событие сохранены",
		"aggregate_type", event.AggregateType,
		"aggregate_id", event.AggregateID,
		"event_type", event.EventType,
	)
	return nil
}

// FetchUnpublished возвращает неопубликованные события (для relay)
func (r *Repository) FetchUnpublished(ctx context.Context, limit int) ([]OutboxEvent, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, aggregate_type, aggregate_id, event_type, payload, metadata, created_at
		FROM outbox
		WHERE published = FALSE
		ORDER BY created_at ASC
		LIMIT $1
		FOR UPDATE SKIP LOCKED
	`, limit)
	// FOR UPDATE SKIP LOCKED — блокируем строки, чтобы другие relay не взяли те же события
	// SKIP LOCKED — пропускаем уже заблокированные строки
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения outbox: %w", err)
	}
	defer rows.Close()

	var events []OutboxEvent
	for rows.Next() {
		var e OutboxEvent
		err := rows.Scan(&e.ID, &e.AggregateType, &e.AggregateID,
			&e.EventType, &e.Payload, &e.Metadata, &e.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("ошибка сканирования: %w", err)
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

// MarkPublished помечает событие как опубликованное
func (r *Repository) MarkPublished(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE outbox SET published = TRUE, published_at = NOW() WHERE id = $1
	`, id)
	return err
}

// Publisher — интерфейс публикации событий в брокер
type Publisher interface {
	Publish(ctx context.Context, event OutboxEvent) error
}

// Relay — процесс, который читает из outbox и публикует в брокер
type Relay struct {
	repo      *Repository
	publisher Publisher
	logger    *slog.Logger
	interval  time.Duration // интервал опроса
	batchSize int           // размер батча
}

// NewRelay создаёт outbox relay
func NewRelay(repo *Repository, publisher Publisher, logger *slog.Logger) *Relay {
	return &Relay{
		repo:      repo,
		publisher: publisher,
		logger:    logger,
		interval:  500 * time.Millisecond, // опрашиваем каждые 500мс
		batchSize: 100,
	}
}

// Start запускает бесконечный цикл публикации
func (r *Relay) Start(ctx context.Context) {
	ticker := time.NewTicker(r.interval)
	defer ticker.Stop()

	r.logger.Info("outbox relay запущен", "interval", r.interval)

	for {
		select {
		case <-ctx.Done():
			r.logger.Info("outbox relay остановлен")
			return

		case <-ticker.C:
			r.processBatch(ctx)
		}
	}
}

// processBatch обрабатывает один батч неопубликованных событий
func (r *Relay) processBatch(ctx context.Context) {
	events, err := r.repo.FetchUnpublished(ctx, r.batchSize)
	if err != nil {
		r.logger.Error("ошибка чтения из outbox", "error", err)
		return
	}

	for _, event := range events {
		// Публикуем в брокер
		if err := r.publisher.Publish(ctx, event); err != nil {
			r.logger.Error("ошибка публикации события",
				"error", err,
				"event_id", event.ID,
				"event_type", event.EventType,
			)
			continue // Пропускаем — попробуем в следующем цикле
		}

		// Помечаем как опубликованное
		if err := r.repo.MarkPublished(ctx, event.ID); err != nil {
			r.logger.Error("ошибка пометки события", "error", err, "event_id", event.ID)
			// Это не критично — в худшем случае событие опубликуется повторно
			// Потребитель должен обеспечить идемпотентность
		}

		r.logger.Debug("событие опубликовано из outbox",
			"event_id", event.ID,
			"event_type", event.EventType,
		)
	}
}
```

> [!WARNING] Гарантии outbox-паттерна
> Outbox обеспечивает **at-least-once** доставку. Если relay упадёт после публикации, но до пометки `published=true`, событие опубликуется повторно. Поэтому потребители **обязаны** обрабатывать сообщения идемпотентно (см. раздел дедупликации в секции Kafka).

###### 🏠 Домашнее задание

1. Реализуйте полный цикл: сервис создаёт заказ с outbox, relay публикует в NATS, потребитель обрабатывает событие.
2. Добавьте очистку старых опубликованных событий: `DELETE FROM outbox WHERE published = TRUE AND published_at < NOW() - INTERVAL '7 days'`.
3. Замените polling (опрос по таймеру) на PostgreSQL LISTEN/NOTIFY: при вставке в outbox — отправлять уведомление, relay реагирует мгновенно.

---

## 9. CQRS и Event Sourcing основы

### CQRS (Command Query Responsibility Segregation)

CQRS — это разделение модели для записи (Command) и модели для чтения (Query). Вместо одной модели, которая обслуживает и записи, и чтения, мы используем две.

Зачем:
- **Чтение** обычно требует денормализованных данных (JOIN'ы тормозят)
- **Запись** требует нормализованных данных (целостность, валидация)
- Нагрузка на чтение часто в 10-100 раз выше, чем на запись
- Разные модели можно масштабировать независимо

```go
package cqrs

import (
	"context"
	"encoding/json"
	"time"
)

// --- Command Side (Запись) ---

// CreateOrderCommand — команда на создание заказа
type CreateOrderCommand struct {
	UserID string         `json:"user_id"`
	Items  []OrderItem    `json:"items"`
}

type OrderItem struct {
	ProductID string  `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

// CommandHandler обрабатывает команды записи
type CommandHandler struct {
	eventStore EventStore       // хранилище событий
	publisher  EventPublisher   // публикация в брокер
}

// HandleCreateOrder обрабатывает команду создания заказа
func (h *CommandHandler) HandleCreateOrder(ctx context.Context, cmd CreateOrderCommand) error {
	// Валидация
	if len(cmd.Items) == 0 {
		return ErrEmptyOrder
	}

	// Вычисляем сумму
	var total float64
	for _, item := range cmd.Items {
		total += item.Price * float64(item.Quantity)
	}

	// Создаём событие (не записываем напрямую в «текущее состояние»)
	event := Event{
		Type:        "OrderCreated",
		AggregateID: generateID(),
		Data: OrderCreatedData{
			UserID: cmd.UserID,
			Items:  cmd.Items,
			Total:  total,
		},
		Timestamp: time.Now(),
	}

	// Сохраняем событие
	if err := h.eventStore.Save(ctx, event); err != nil {
		return err
	}

	// Публикуем для обновления модели чтения
	return h.publisher.Publish(ctx, event)
}

// --- Query Side (Чтение) ---

// OrderView — денормализованное представление заказа для чтения
type OrderView struct {
	OrderID    string    `json:"order_id"`
	UserID     string    `json:"user_id"`
	UserName   string    `json:"user_name"`  // денормализовано (не нужен JOIN)
	Items      []string  `json:"items"`      // названия товаров
	Total      float64   `json:"total"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

// QueryHandler обрабатывает запросы чтения
type QueryHandler struct {
	readDB ReadDatabase  // отдельная БД/таблица для чтения
}

// GetOrderByID — быстрое чтение без JOIN'ов
func (h *QueryHandler) GetOrderByID(ctx context.Context, orderID string) (*OrderView, error) {
	// Читаем из денормализованной модели — быстрый SELECT без JOIN
	return h.readDB.FindOrder(ctx, orderID)
}

// GetUserOrders — все заказы пользователя
func (h *QueryHandler) GetUserOrders(ctx context.Context, userID string) ([]OrderView, error) {
	return h.readDB.FindOrdersByUser(ctx, userID)
}

// --- Проекция (синхронизация модели чтения) ---

// Projector слушает события и обновляет модель чтения
type Projector struct {
	readDB ReadDatabase
}

// HandleEvent обрабатывает событие и обновляет представление
func (p *Projector) HandleEvent(ctx context.Context, event Event) error {
	switch event.Type {
	case "OrderCreated":
		var data OrderCreatedData
		json.Unmarshal(event.Data.(json.RawMessage), &data)

		// Создаём денормализованное представление
		view := OrderView{
			OrderID:   event.AggregateID,
			UserID:    data.UserID,
			Total:     data.Total,
			Status:    "created",
			CreatedAt: event.Timestamp,
		}
		return p.readDB.SaveOrder(ctx, view)

	case "OrderPaid":
		return p.readDB.UpdateOrderStatus(ctx, event.AggregateID, "paid")

	case "OrderShipped":
		return p.readDB.UpdateOrderStatus(ctx, event.AggregateID, "shipped")

	default:
		return nil // Неизвестное событие — игнорируем
	}
}
```

> [!NOTE] Eventual Consistency
> В CQRS модель чтения обновляется **асинхронно** после записи. Это значит, что после создания заказа при немедленном чтении вы можете не увидеть его. Это нормально — «eventual consistency». Данные станут согласованными через короткий промежуток времени.

### Event Sourcing

Event Sourcing — это хранение **событий** вместо текущего состояния. Текущее состояние объекта восстанавливается путём «проигрывания» всех его событий с начала.

```go
package eventsourcing

import (
	"context"
	"fmt"
	"time"
)

// Event — базовое событие
type Event struct {
	ID          string      `json:"id"`
	Type        string      `json:"type"`
	AggregateID string      `json:"aggregate_id"`
	Data        interface{} `json:"data"`
	Version     int         `json:"version"`     // версия для оптимистичной блокировки
	Timestamp   time.Time   `json:"timestamp"`
}

// --- Агрегат Order ---

// Order — агрегат заказа. Текущее состояние восстанавливается из событий
type Order struct {
	ID     string
	UserID string
	Items  []OrderItem
	Total  float64
	Status string
	Version int  // текущая версия для конкурентного контроля
}

// Apply применяет событие к агрегату, обновляя его состояние
func (o *Order) Apply(event Event) {
	switch event.Type {
	case "OrderCreated":
		data := event.Data.(OrderCreatedData)
		o.ID = event.AggregateID
		o.UserID = data.UserID
		o.Items = data.Items
		o.Total = data.Total
		o.Status = "created"

	case "OrderPaid":
		o.Status = "paid"

	case "OrderShipped":
		o.Status = "shipped"

	case "OrderCancelled":
		o.Status = "cancelled"
	}
	o.Version = event.Version
}

// --- Event Store ---

// EventStore — хранилище событий
type EventStore interface {
	// Save сохраняет новые события для агрегата
	Save(ctx context.Context, events []Event) error
	// Load загружает все события для агрегата
	Load(ctx context.Context, aggregateID string) ([]Event, error)
}

// LoadOrder восстанавливает состояние заказа из событий
func LoadOrder(ctx context.Context, store EventStore, orderID string) (*Order, error) {
	// Загружаем все события для этого заказа
	events, err := store.Load(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("ошибка загрузки событий: %w", err)
	}

	if len(events) == 0 {
		return nil, fmt.Errorf("заказ %s не найден", orderID)
	}

	// Создаём пустой агрегат и проигрываем все события
	order := &Order{}
	for _, event := range events {
		order.Apply(event)
	}

	return order, nil
}

// Пример последовательности событий для заказа ORD-001:
//
// Version 1: OrderCreated  { user_id: "U1", items: [...], total: 500 }
// Version 2: OrderPaid     { payment_id: "PAY-001" }
// Version 3: OrderShipped  { tracking: "TRACK-001" }
//
// LoadOrder("ORD-001") → Order{ Status: "shipped", Total: 500, ... }
//
// Преимущества:
// - Полная история изменений (аудит)
// - Можно восстановить состояние на любой момент времени
// - Можно добавить новые проекции задним числом
//
// Недостатки:
// - Сложнее реализовать
// - Загрузка длинной цепочки событий может быть медленной (решается снэпшотами)
// - Eventual consistency
```

###### 🏠 Домашнее задание

1. Реализуйте простой EventStore на PostgreSQL: таблица `events` с полями `id`, `aggregate_id`, `event_type`, `data` (JSONB), `version`, `created_at`.
2. Добавьте механизм снэпшотов: после каждых 100 событий сохраняйте текущее состояние агрегата. При загрузке — начинайте с последнего снэпшота.
3. Реализуйте две проекции для одного потока событий: одна для REST API (денормализованная), другая для отчётов (агрегированная).

---

## 10. Observability (Наблюдаемость)

Observability — это способность понять внутреннее состояние системы по её внешним выходам. В микросервисной архитектуре это критически важно, потому что один пользовательский запрос проходит через множество сервисов.

Три столпа наблюдаемости: **Логирование**, **Трейсинг**, **Метрики**.

### Структурированное логирование

Используем `log/slog` из стандартной библиотеки Go (с версии 1.21). Структурированные логи в формате JSON легко парсить и индексировать (ELK, Loki).

```go
package logging

import (
	"context"
	"log/slog"
	"os"
)

// contextKey — тип для ключей контекста
type contextKey string

const (
	requestIDKey contextKey = "request_id"
	traceIDKey   contextKey = "trace_id"
	userIDKey    contextKey = "user_id"
)

// SetupLogger создаёт настроенный логгер
func SetupLogger(env string) *slog.Logger {
	var handler slog.Handler

	switch env {
	case "production":
		// JSON-формат для продакшена — парсится ELK/Loki
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
			// Добавляем source (файл и строку) для отладки
			AddSource: true,
		})
	default:
		// Текстовый формат для разработки — читается человеком
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}

	return slog.New(handler)
}

// WithRequestID добавляет request_id в контекст
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey, requestID)
}

// WithTraceID добавляет trace_id в контекст
func WithTraceID(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, traceIDKey, traceID)
}

// LoggerFromContext создаёт логгер с полями из контекста
// Каждое лог-сообщение будет автоматически содержать request_id, trace_id
func LoggerFromContext(ctx context.Context, base *slog.Logger) *slog.Logger {
	logger := base

	if requestID, ok := ctx.Value(requestIDKey).(string); ok {
		logger = logger.With("request_id", requestID)
	}
	if traceID, ok := ctx.Value(traceIDKey).(string); ok {
		logger = logger.With("trace_id", traceID)
	}
	if userID, ok := ctx.Value(userIDKey).(string); ok {
		logger = logger.With("user_id", userID)
	}

	return logger
}

// LoggerWithTrace создаёт логгер с trace_id для корреляции
// логов, трейсов и метрик
func LoggerWithTrace(base *slog.Logger, traceID, spanID string) *slog.Logger {
	return base.With(
		"trace_id", traceID,
		"span_id", spanID,
	)
}

// Пример использования:
//
// logger := SetupLogger("production")
// ctx = WithRequestID(ctx, "req-123")
// ctx = WithTraceID(ctx, "trace-abc")
//
// log := LoggerFromContext(ctx, logger)
// log.Info("обработка заказа",
//     "order_id", "ORD-001",
//     "amount", 299.99,
// )
//
// Результат в JSON:
// {"time":"2024-01-15T10:30:00Z","level":"INFO","msg":"обработка заказа",
//  "request_id":"req-123","trace_id":"trace-abc",
//  "order_id":"ORD-001","amount":299.99}
```

> [!TIP] Альтернативы slog
> Для высоконагруженных систем можно использовать `zerolog` (zero allocation) или `zap` (от Uber). Они быстрее `slog`, но `slog` — стандарт, и для большинства проектов его достаточно.

### Трейсинг (OpenTelemetry)

Distributed Tracing позволяет отследить путь запроса через все сервисы. OpenTelemetry — стандарт для сбора трейсов.

```go
package tracing

import (
	"context"
	"fmt"
	"net/http"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
)

// InitTracer инициализирует OpenTelemetry tracer
func InitTracer(ctx context.Context, serviceName, collectorURL string) (func(), error) {
	// Экспортёр — куда отправлять трейсы (Jaeger, Tempo, Zipkin)
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(collectorURL),
		otlptracegrpc.WithInsecure(), // для локальной разработки
	)
	if err != nil {
		return nil, fmt.Errorf("ошибка создания экспортёра: %w", err)
	}

	// Ресурс — метаданные о сервисе
	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String(serviceName),
			attribute.String("environment", "production"),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("ошибка создания ресурса: %w", err)
	}

	// TracerProvider — фабрика трейсеров
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),   // батч-отправка трейсов
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.AlwaysSample()), // сэмплируем все запросы
	)

	// Устанавливаем глобальный TracerProvider
	otel.SetTracerProvider(tp)

	// Propagator — распространяет контекст трейса между сервисами
	// через HTTP-заголовки (traceparent, tracestate)
	otel.SetTextMapPropagator(
		propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		),
	)

	// Функция завершения — вызвать при остановке сервиса
	shutdown := func() {
		tp.Shutdown(ctx)
	}

	return shutdown, nil
}

// TracingMiddleware — middleware для HTTP-сервера, создаёт span для каждого запроса
func TracingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tracer := otel.Tracer("http-server")

		// Извлекаем trace context из входящих заголовков
		ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))

		// Создаём span для этого запроса
		ctx, span := tracer.Start(ctx, fmt.Sprintf("%s %s", r.Method, r.URL.Path),
			trace.WithAttributes(
				semconv.HTTPMethodKey.String(r.Method),
				semconv.HTTPURLKey.String(r.URL.String()),
				attribute.String("http.client_ip", r.RemoteAddr),
			),
		)
		defer span.End()

		// Передаём контекст с трейсом дальше
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// PropagateTrace добавляет trace context в исходящие HTTP-заголовки
// Вызывается при запросе к другому сервису
func PropagateTrace(ctx context.Context, req *http.Request) {
	otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))
}

// Пример: создание span внутри обработчика
//
// func (h *Handler) CreateOrder(ctx context.Context, order Order) error {
//     tracer := otel.Tracer("order-service")
//
//     // Span для бизнес-логики
//     ctx, span := tracer.Start(ctx, "CreateOrder")
//     defer span.End()
//
//     span.SetAttributes(
//         attribute.String("order.user_id", order.UserID),
//         attribute.Float64("order.total", order.Total),
//     )
//
//     // Вложенный span для запроса к БД
//     ctx, dbSpan := tracer.Start(ctx, "db.InsertOrder")
//     err := h.repo.Save(ctx, order)
//     dbSpan.End()
//
//     if err != nil {
//         span.RecordError(err) // записываем ошибку в span
//         return err
//     }
//
//     return nil
// }
```

### Метрики (Prometheus)

Prometheus — стандарт де-факто для сбора метрик в микросервисах. Сервис экспортирует метрики по HTTP, Prometheus периодически их собирает (pull-model).

**RED-метод** — три ключевые метрики для каждого сервиса:
- **R**ate — количество запросов в секунду
- **E**rrors — процент ошибок
- **D**uration — время обработки запросов

```go
package metrics

import (
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics — набор метрик для HTTP-сервиса
type Metrics struct {
	// Counter — счётчик запросов (только растёт)
	RequestsTotal *prometheus.CounterVec

	// Histogram — распределение времени ответа
	// Позволяет считать перцентили (p50, p95, p99)
	RequestDuration *prometheus.HistogramVec

	// Gauge — текущее значение (может расти и уменьшаться)
	ActiveConnections prometheus.Gauge

	// Counter ошибок
	ErrorsTotal *prometheus.CounterVec
}

// NewMetrics создаёт и регистрирует метрики
func NewMetrics(serviceName string) *Metrics {
	return &Metrics{
		// Количество HTTP-запросов с разбивкой по методу, пути и коду ответа
		RequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: serviceName + "_http_requests_total",
				Help: "Общее количество HTTP-запросов",
			},
			[]string{"method", "path", "status_code"},
		),

		// Время обработки запросов (гистограмма)
		// Бакеты определяют границы интервалов
		RequestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name: serviceName + "_http_request_duration_seconds",
				Help: "Время обработки HTTP-запросов в секундах",
				// Бакеты: 5мс, 10мс, 25мс, 50мс, 100мс, 250мс, 500мс, 1с, 2.5с, 5с, 10с
				Buckets: prometheus.DefBuckets,
			},
			[]string{"method", "path"},
		),

		// Текущее количество активных соединений
		ActiveConnections: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: serviceName + "_active_connections",
				Help: "Количество активных соединений",
			},
		),

		// Счётчик ошибок
		ErrorsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: serviceName + "_errors_total",
				Help: "Общее количество ошибок",
			},
			[]string{"type"}, // db_error, timeout, validation и т.д.
		),
	}
}

// MetricsMiddleware — middleware для автоматического сбора метрик
func MetricsMiddleware(m *Metrics, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Увеличиваем счётчик активных соединений
		m.ActiveConnections.Inc()
		defer m.ActiveConnections.Dec()

		// Оборачиваем ResponseWriter для перехвата status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Выполняем запрос
		next.ServeHTTP(rw, r)

		// Записываем метрики
		duration := time.Since(start).Seconds()
		statusCode := http.StatusText(rw.statusCode)

		m.RequestsTotal.WithLabelValues(r.Method, r.URL.Path, statusCode).Inc()
		m.RequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
	})
}

// responseWriter — обёртка для перехвата status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// SetupMetricsEndpoint регистрирует endpoint для Prometheus
func SetupMetricsEndpoint(mux *http.ServeMux) {
	// /metrics — эндпоинт, который Prometheus будет опрашивать
	mux.Handle("/metrics", promhttp.Handler())
}

// Пример prometheus.yml для сбора метрик:
//
// scrape_configs:
//   - job_name: 'order-service'
//     scrape_interval: 15s
//     static_configs:
//       - targets: ['order-service:8080']
//
//   - job_name: 'user-service'
//     scrape_interval: 15s
//     static_configs:
//       - targets: ['user-service:8081']
```

### Корреляция логов, трейсов и метрик

Ключ к эффективной отладке — связать все три столпа через `trace_id`. Когда вы видите аномалию в метриках, вы находите соответствующие трейсы, а через `trace_id` — логи всех сервисов, участвовавших в обработке.

```go
package observability

import (
	"context"
	"log/slog"

	"go.opentelemetry.io/otel/trace"
)

// LoggerWithTrace создаёт логгер с trace_id и span_id
// Это позволяет искать логи по trace_id из трейсинга
func LoggerWithTrace(ctx context.Context, logger *slog.Logger) *slog.Logger {
	spanCtx := trace.SpanContextFromContext(ctx)

	if spanCtx.HasTraceID() {
		logger = logger.With(
			"trace_id", spanCtx.TraceID().String(),
			"span_id", spanCtx.SpanID().String(),
		)
	}

	return logger
}

// Пример использования в обработчике:
//
// func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
//     ctx := r.Context()
//     log := LoggerWithTrace(ctx, h.logger)
//
//     log.Info("создание заказа", "user_id", "USR-001")
//     // Вывод: {"trace_id":"abc123","span_id":"def456","msg":"создание заказа","user_id":"USR-001"}
//
//     // Этот trace_id совпадает с трейсом в Jaeger/Tempo
//     // и с метрикой в Prometheus (если добавить exemplar)
// }
```

> [!summary] Три столпа наблюдаемости
> 1. **Логи** — что произошло (детали). slog → JSON → Loki/ELK
> 2. **Трейсы** — как запрос прошёл через сервисы (путь). OpenTelemetry → Jaeger/Tempo
> 3. **Метрики** — как система работает в целом (здоровье). Prometheus → Grafana
> Связывайте их через `trace_id` для быстрой отладки.

###### 🏠 Домашнее задание

1. Настройте slog с JSON-выводом и добавьте middleware, которое логирует каждый запрос с `method`, `path`, `status_code`, `duration`, `request_id`.
2. Добавьте Prometheus-метрики в ваш сервис: `requests_total`, `request_duration_seconds`, `active_connections`. Визуализируйте в Grafana.
3. Настройте OpenTelemetry с экспортом в Jaeger. Создайте span для HTTP-обработчика и вложенный span для запроса к БД.
4. Реализуйте `LoggerWithTrace` и убедитесь, что `trace_id` из логов совпадает с трейсом в Jaeger.

---

## 11. Конфигурация микросервисов

### 12-Factor App: Конфигурация из окружения

Принцип [12-Factor App](https://12factor.net) гласит: конфигурация должна храниться в переменных окружения, а не в коде. Это позволяет использовать один и тот же артефакт (Docker-образ) в разных средах (dev, staging, production).

Подробнее о развёртывании — в [[09-deploy]].

```go
package config

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/caarlos0/env/v10"
)

// Config — конфигурация микросервиса
// Все поля заполняются из переменных окружения
type Config struct {
	// Сервер
	ServerHost string        `env:"SERVER_HOST" envDefault:"0.0.0.0"`
	ServerPort int           `env:"SERVER_PORT" envDefault:"8080"`
	ReadTimeout  time.Duration `env:"SERVER_READ_TIMEOUT" envDefault:"10s"`
	WriteTimeout time.Duration `env:"SERVER_WRITE_TIMEOUT" envDefault:"30s"`

	// База данных
	DatabaseURL       string `env:"DATABASE_URL,required"`           // обязательное поле
	DatabaseMaxConns  int    `env:"DATABASE_MAX_CONNS" envDefault:"20"`
	DatabaseMinConns  int    `env:"DATABASE_MIN_CONNS" envDefault:"5"`

	// Redis
	RedisURL      string        `env:"REDIS_URL" envDefault:"redis://localhost:6379"`
	RedisTTL      time.Duration `env:"REDIS_TTL" envDefault:"1h"`

	// NATS
	NatsURL       string `env:"NATS_URL" envDefault:"nats://localhost:4222"`
	NatsClusterID string `env:"NATS_CLUSTER_ID" envDefault:"my-cluster"`

	// Kafka
	KafkaBrokers []string `env:"KAFKA_BROKERS" envSeparator:"," envDefault:"localhost:9092"`
	KafkaGroupID string   `env:"KAFKA_GROUP_ID" envDefault:"my-service"`

	// Наблюдаемость
	LogLevel     string `env:"LOG_LEVEL" envDefault:"info"`
	OtelEndpoint string `env:"OTEL_ENDPOINT" envDefault:"localhost:4317"`

	// Приложение
	Environment string `env:"ENVIRONMENT" envDefault:"development"`
	ServiceName string `env:"SERVICE_NAME" envDefault:"my-service"`
}

// Addr возвращает адрес для прослушивания
func (c Config) Addr() string {
	return fmt.Sprintf("%s:%d", c.ServerHost, c.ServerPort)
}

// Load загружает конфигурацию из переменных окружения
func Load() (*Config, error) {
	cfg := &Config{}

	// env.Parse заполняет структуру из переменных окружения
	// Если обязательное поле не найдено — возвращает ошибку
	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("ошибка загрузки конфигурации: %w", err)
	}

	return cfg, nil
}

// LogConfig логирует текущую конфигурацию (без секретов)
func LogConfig(logger *slog.Logger, cfg *Config) {
	logger.Info("конфигурация загружена",
		"server_addr", cfg.Addr(),
		"environment", cfg.Environment,
		"log_level", cfg.LogLevel,
		"db_max_conns", cfg.DatabaseMaxConns,
		"redis_ttl", cfg.RedisTTL,
		"nats_url", cfg.NatsURL,
		"kafka_brokers", cfg.KafkaBrokers,
		// НЕ логируем DATABASE_URL и другие секреты!
	)
}
```

> [!WARNING] Безопасность конфигурации
> Никогда не логируйте секреты (пароли, API-ключи, connection strings с паролями). В продакшене используйте Vault, AWS Secrets Manager или Kubernetes Secrets для хранения чувствительных данных.

###### 🏠 Домашнее задание

1. Создайте конфигурацию для вашего сервиса с помощью `caarlos0/env`. Добавьте валидацию: порт должен быть в диапазоне 1024-65535, `environment` — только `development`, `staging`, `production`.
2. Реализуйте загрузку конфигурации из YAML-файла с помощью `viper`, с возможностью перезаписи значений через переменные окружения.

---

## 12. Health Checks

В микросервисной архитектуре (особенно в Kubernetes) критически важно, чтобы каждый сервис сообщал о своём состоянии. Kubernetes использует два типа проверок:

- **Liveness Probe** (`/health`) — сервис жив? Если нет — Kubernetes перезапустит контейнер.
- **Readiness Probe** (`/ready`) — сервис готов принимать трафик? Если нет — Kubernetes перестанет направлять запросы.

```go
package health

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Status — статус здоровья
type Status string

const (
	StatusUp   Status = "UP"
	StatusDown Status = "DOWN"
)

// HealthResponse — ответ на health check
type HealthResponse struct {
	Status  Status                  `json:"status"`
	Checks  map[string]CheckResult  `json:"checks,omitempty"`
	Uptime  string                  `json:"uptime"`
}

// CheckResult — результат проверки одной зависимости
type CheckResult struct {
	Status   Status `json:"status"`
	Message  string `json:"message,omitempty"`
	Duration string `json:"duration"`
}

// Checker — интерфейс для проверки здоровья зависимости
type Checker interface {
	Name() string
	Check(ctx context.Context) CheckResult
}

// HealthHandler — обработчик health check запросов
type HealthHandler struct {
	startTime time.Time
	checkers  []Checker
}

// NewHealthHandler создаёт обработчик с набором проверок
func NewHealthHandler(checkers ...Checker) *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
		checkers:  checkers,
	}
}

// LivenessHandler — /health — сервис жив?
// Простая проверка — если процесс отвечает, он жив
func (h *HealthHandler) LivenessHandler(w http.ResponseWriter, r *http.Request) {
	resp := HealthResponse{
		Status: StatusUp,
		Uptime: time.Since(h.startTime).String(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// ReadinessHandler — /ready — сервис готов принимать трафик?
// Проверяет все зависимости (БД, Redis, брокер)
func (h *HealthHandler) ReadinessHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checks := make(map[string]CheckResult)
	overallStatus := StatusUp

	// Параллельная проверка всех зависимостей
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, checker := range h.checkers {
		wg.Add(1)
		go func(c Checker) {
			defer wg.Done()
			result := c.Check(ctx)

			mu.Lock()
			checks[c.Name()] = result
			if result.Status == StatusDown {
				overallStatus = StatusDown
			}
			mu.Unlock()
		}(checker)
	}

	wg.Wait()

	resp := HealthResponse{
		Status: overallStatus,
		Checks: checks,
		Uptime: time.Since(h.startTime).String(),
	}

	w.Header().Set("Content-Type", "application/json")
	if overallStatus == StatusDown {
		w.WriteHeader(http.StatusServiceUnavailable) // 503
	} else {
		w.WriteHeader(http.StatusOK) // 200
	}
	json.NewEncoder(w).Encode(resp)
}

// --- Реализации Checker ---

// PostgresChecker проверяет подключение к PostgreSQL
type PostgresChecker struct {
	db *sql.DB
}

func NewPostgresChecker(db *sql.DB) *PostgresChecker {
	return &PostgresChecker{db: db}
}

func (c *PostgresChecker) Name() string { return "postgresql" }

func (c *PostgresChecker) Check(ctx context.Context) CheckResult {
	start := time.Now()

	if err := c.db.PingContext(ctx); err != nil {
		return CheckResult{
			Status:   StatusDown,
			Message:  err.Error(),
			Duration: time.Since(start).String(),
		}
	}

	return CheckResult{
		Status:   StatusUp,
		Duration: time.Since(start).String(),
	}
}

// RedisChecker проверяет подключение к Redis
type RedisChecker struct {
	client *redis.Client
}

func NewRedisChecker(client *redis.Client) *RedisChecker {
	return &RedisChecker{client: client}
}

func (c *RedisChecker) Name() string { return "redis" }

func (c *RedisChecker) Check(ctx context.Context) CheckResult {
	start := time.Now()

	if err := c.client.Ping(ctx).Err(); err != nil {
		return CheckResult{
			Status:   StatusDown,
			Message:  err.Error(),
			Duration: time.Since(start).String(),
		}
	}

	return CheckResult{
		Status:   StatusUp,
		Duration: time.Since(start).String(),
	}
}

// Пример регистрации:
//
// healthHandler := health.NewHealthHandler(
//     health.NewPostgresChecker(db),
//     health.NewRedisChecker(redisClient),
// )
//
// mux.HandleFunc("/health", healthHandler.LivenessHandler)
// mux.HandleFunc("/ready", healthHandler.ReadinessHandler)
//
// Ответ /ready:
// {
//   "status": "UP",
//   "checks": {
//     "postgresql": { "status": "UP", "duration": "1.2ms" },
//     "redis": { "status": "UP", "duration": "0.5ms" }
//   },
//   "uptime": "2h30m15s"
// }
```

> [!INFO] Kubernetes Probes
> В Kubernetes health checks настраиваются в манифесте деплоймента:
> ```yaml
> livenessProbe:
>   httpGet:
>     path: /health
>     port: 8080
>   initialDelaySeconds: 5
>   periodSeconds: 10
> readinessProbe:
>   httpGet:
>     path: /ready
>     port: 8080
>   initialDelaySeconds: 10
>   periodSeconds: 5
> ```
> Подробнее о развёртывании в Kubernetes — в [[09-deploy]].

###### 🏠 Домашнее задание

1. Добавьте `NATSChecker`, который проверяет подключение к NATS-серверу.
2. Реализуйте `/health/detailed` — эндпоинт, доступный только для внутренних запросов (проверка по IP или токену), который возвращает расширенную информацию: количество горутин, потребление памяти, время работы.
3. Добавьте graceful shutdown: при получении SIGTERM сервис отвечает `503` на `/ready`, дожидается завершения текущих запросов и только потом останавливается.

---

## 13. Сквозной проект: Todo-сервис на микросервисах

Разобьём Todo-приложение из предыдущих глав на два микросервиса, общающихся через NATS. Подробнее о работе с базами данных — в [[04-databases]], о конкурентности — в [[05-concurrency]], о тестировании микросервисов — в [[07-testing]].

### Структура проекта

```
todo-microservices/
├── docker-compose.yml
├── todo-service/                 # Сервис управления задачами
│   ├── cmd/
│   │   └── main.go               # Точка входа
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go          # Конфигурация
│   │   ├── handler/
│   │   │   └── todo.go            # HTTP-обработчики
│   │   ├── model/
│   │   │   └── todo.go            # Модели данных
│   │   ├── repository/
│   │   │   └── postgres.go        # Доступ к PostgreSQL
│   │   ├── service/
│   │   │   └── todo.go            # Бизнес-логика
│   │   └── events/
│   │       └── publisher.go       # Публикация событий в NATS
│   ├── migrations/
│   │   └── 001_create_todos.sql
│   ├── go.mod
│   └── Dockerfile
├── notification-service/         # Сервис уведомлений
│   ├── cmd/
│   │   └── main.go
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go
│   │   └── handler/
│   │       └── notification.go    # Обработка событий
│   ├── go.mod
│   └── Dockerfile
└── proto/                         # Общие определения событий
    └── events.go
```

### Общие определения событий

```go
// proto/events.go
package proto

import "time"

// TodoEvent — событие, связанное с задачей
type TodoEvent struct {
	EventID   string    `json:"event_id"`
	EventType string    `json:"event_type"`  // todo.created, todo.updated, todo.deleted
	Timestamp time.Time `json:"timestamp"`
	Data      TodoData  `json:"data"`
}

// TodoData — данные задачи
type TodoData struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Completed   bool      `json:"completed"`
	UserID      string    `json:"user_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Субъекты NATS для событий
const (
	SubjectTodoCreated = "todo.events.created"
	SubjectTodoUpdated = "todo.events.updated"
	SubjectTodoDeleted = "todo.events.deleted"
	SubjectTodoAll     = "todo.events.>"
)
```

### Todo Service

```go
// todo-service/cmd/main.go
package main

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"

	"todo-service/internal/config"
	"todo-service/internal/events"
	"todo-service/internal/handler"
	"todo-service/internal/repository"
	"todo-service/internal/service"
)

func main() {
	// Логгер
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// Конфигурация
	cfg, err := config.Load()
	if err != nil {
		logger.Error("ошибка загрузки конфигурации", "error", err)
		os.Exit(1)
	}

	// PostgreSQL
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Error("ошибка подключения к БД", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	db.SetMaxOpenConns(cfg.DatabaseMaxConns)
	db.SetMaxIdleConns(cfg.DatabaseMinConns)

	if err := db.Ping(); err != nil {
		logger.Error("БД недоступна", "error", err)
		os.Exit(1)
	}
	logger.Info("подключение к PostgreSQL установлено")

	// NATS
	nc, err := nats.Connect(cfg.NatsURL,
		nats.Name("todo-service"),
		nats.ReconnectWait(2*time.Second),
		nats.MaxReconnects(-1), // переподключаться бесконечно
	)
	if err != nil {
		logger.Error("ошибка подключения к NATS", "error", err)
		os.Exit(1)
	}
	defer nc.Close()
	logger.Info("подключение к NATS установлено")

	// Слои приложения
	repo := repository.NewPostgresRepository(db)
	pub := events.NewPublisher(nc, logger)
	svc := service.NewTodoService(repo, pub, logger)
	h := handler.NewTodoHandler(svc, logger)

	// HTTP-маршруты
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/todos", h.List)
	mux.HandleFunc("POST /api/todos", h.Create)
	mux.HandleFunc("GET /api/todos/{id}", h.GetByID)
	mux.HandleFunc("PUT /api/todos/{id}", h.Update)
	mux.HandleFunc("DELETE /api/todos/{id}", h.Delete)

	// Health checks
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"UP"}`))
	})
	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(); err != nil {
			http.Error(w, `{"status":"DOWN"}`, http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"UP"}`))
	})

	// HTTP-сервер
	server := &http.Server{
		Addr:         cfg.Addr(),
		Handler:      mux,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}

	// Graceful shutdown
	go func() {
		logger.Info("todo-service запущен", "addr", cfg.Addr())
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			logger.Error("ошибка сервера", "error", err)
			os.Exit(1)
		}
	}()

	// Ждём сигнал завершения
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("завершение работы...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	server.Shutdown(ctx)
	logger.Info("todo-service остановлен")
}
```

### Публикация событий

```go
// todo-service/internal/events/publisher.go
package events

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"

	"todo-microservices/proto"
)

// Publisher публикует события в NATS
type Publisher struct {
	nc     *nats.Conn
	logger *slog.Logger
}

// NewPublisher создаёт публикатор событий
func NewPublisher(nc *nats.Conn, logger *slog.Logger) *Publisher {
	return &Publisher{nc: nc, logger: logger}
}

// PublishTodoCreated публикует событие создания задачи
func (p *Publisher) PublishTodoCreated(todo proto.TodoData) error {
	return p.publish(proto.SubjectTodoCreated, "todo.created", todo)
}

// PublishTodoUpdated публикует событие обновления задачи
func (p *Publisher) PublishTodoUpdated(todo proto.TodoData) error {
	return p.publish(proto.SubjectTodoUpdated, "todo.updated", todo)
}

// PublishTodoDeleted публикует событие удаления задачи
func (p *Publisher) PublishTodoDeleted(todo proto.TodoData) error {
	return p.publish(proto.SubjectTodoDeleted, "todo.deleted", todo)
}

// publish — внутренний метод публикации
func (p *Publisher) publish(subject, eventType string, data proto.TodoData) error {
	event := proto.TodoEvent{
		EventID:   uuid.New().String(),
		EventType: eventType,
		Timestamp: time.Now(),
		Data:      data,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("ошибка сериализации события: %w", err)
	}

	if err := p.nc.Publish(subject, payload); err != nil {
		return fmt.Errorf("ошибка публикации события %s: %w", eventType, err)
	}

	p.logger.Info("событие опубликовано",
		"subject", subject,
		"event_type", eventType,
		"event_id", event.EventID,
		"todo_id", data.ID,
	)
	return nil
}
```

### Бизнес-логика (Service Layer)

```go
// todo-service/internal/service/todo.go
package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"todo-service/internal/events"
	"todo-service/internal/model"
	"todo-service/internal/repository"
	"todo-microservices/proto"
)

// TodoService — бизнес-логика управления задачами
type TodoService struct {
	repo      *repository.PostgresRepository
	publisher *events.Publisher
	logger    *slog.Logger
}

// NewTodoService создаёт сервис
func NewTodoService(
	repo *repository.PostgresRepository,
	publisher *events.Publisher,
	logger *slog.Logger,
) *TodoService {
	return &TodoService{repo: repo, publisher: publisher, logger: logger}
}

// Create создаёт задачу и публикует событие
func (s *TodoService) Create(ctx context.Context, input model.CreateTodoInput) (*model.Todo, error) {
	todo := &model.Todo{
		ID:          uuid.New().String(),
		Title:       input.Title,
		Description: input.Description,
		Completed:   false,
		UserID:      input.UserID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Сохраняем в БД
	if err := s.repo.Create(ctx, todo); err != nil {
		return nil, fmt.Errorf("ошибка создания задачи: %w", err)
	}

	// Публикуем событие (асинхронно, ошибка не критична)
	go func() {
		if err := s.publisher.PublishTodoCreated(toProtoData(todo)); err != nil {
			s.logger.Error("ошибка публикации события todo.created",
				"error", err, "todo_id", todo.ID)
		}
	}()

	return todo, nil
}

// Update обновляет задачу и публикует событие
func (s *TodoService) Update(ctx context.Context, id string, input model.UpdateTodoInput) (*model.Todo, error) {
	todo, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("задача не найдена: %w", err)
	}

	// Обновляем поля
	if input.Title != nil {
		todo.Title = *input.Title
	}
	if input.Description != nil {
		todo.Description = *input.Description
	}
	if input.Completed != nil {
		todo.Completed = *input.Completed
	}
	todo.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, todo); err != nil {
		return nil, fmt.Errorf("ошибка обновления: %w", err)
	}

	go func() {
		if err := s.publisher.PublishTodoUpdated(toProtoData(todo)); err != nil {
			s.logger.Error("ошибка публикации события todo.updated",
				"error", err, "todo_id", todo.ID)
		}
	}()

	return todo, nil
}

// Delete удаляет задачу и публикует событие
func (s *TodoService) Delete(ctx context.Context, id string) error {
	todo, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("задача не найдена: %w", err)
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("ошибка удаления: %w", err)
	}

	go func() {
		if err := s.publisher.PublishTodoDeleted(toProtoData(todo)); err != nil {
			s.logger.Error("ошибка публикации события todo.deleted",
				"error", err, "todo_id", todo.ID)
		}
	}()

	return nil
}

// List возвращает все задачи пользователя
func (s *TodoService) List(ctx context.Context, userID string) ([]model.Todo, error) {
	return s.repo.ListByUser(ctx, userID)
}

// GetByID возвращает задачу по ID
func (s *TodoService) GetByID(ctx context.Context, id string) (*model.Todo, error) {
	return s.repo.GetByID(ctx, id)
}

// toProtoData конвертирует внутреннюю модель в формат события
func toProtoData(todo *model.Todo) proto.TodoData {
	return proto.TodoData{
		ID:          todo.ID,
		Title:       todo.Title,
		Description: todo.Description,
		Completed:   todo.Completed,
		UserID:      todo.UserID,
		CreatedAt:   todo.CreatedAt,
		UpdatedAt:   todo.UpdatedAt,
	}
}
```

### Notification Service

```go
// notification-service/cmd/main.go
package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nats-io/nats.go"

	"todo-microservices/proto"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}

	// Подключаемся к NATS
	nc, err := nats.Connect(natsURL,
		nats.Name("notification-service"),
		nats.ReconnectWait(2*time.Second),
		nats.MaxReconnects(-1),
	)
	if err != nil {
		logger.Error("ошибка подключения к NATS", "error", err)
		os.Exit(1)
	}
	defer nc.Close()
	logger.Info("notification-service подключён к NATS")

	// Подписываемся на ВСЕ события задач через wildcard
	sub, err := nc.Subscribe(proto.SubjectTodoAll, func(msg *nats.Msg) {
		var event proto.TodoEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			logger.Error("ошибка десериализации события", "error", err)
			return
		}

		// Обрабатываем событие в зависимости от типа
		switch event.EventType {
		case "todo.created":
			logger.Info("УВЕДОМЛЕНИЕ: Создана новая задача",
				"todo_id", event.Data.ID,
				"title", event.Data.Title,
				"user_id", event.Data.UserID,
				"event_id", event.EventID,
			)
			// В реальности: отправка email, push-уведомления, SMS
			sendNotification(logger, "create", event.Data)

		case "todo.updated":
			logger.Info("УВЕДОМЛЕНИЕ: Задача обновлена",
				"todo_id", event.Data.ID,
				"title", event.Data.Title,
				"completed", event.Data.Completed,
				"event_id", event.EventID,
			)
			sendNotification(logger, "update", event.Data)

		case "todo.deleted":
			logger.Info("УВЕДОМЛЕНИЕ: Задача удалена",
				"todo_id", event.Data.ID,
				"title", event.Data.Title,
				"event_id", event.EventID,
			)
			sendNotification(logger, "delete", event.Data)

		default:
			logger.Warn("неизвестный тип события", "type", event.EventType)
		}
	})
	if err != nil {
		logger.Error("ошибка подписки", "error", err)
		os.Exit(1)
	}
	defer sub.Unsubscribe()

	// Health check endpoint
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		status := "UP"
		if !nc.IsConnected() {
			status = "DOWN"
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		w.Write([]byte(`{"status":"` + status + `"}`))
	})

	server := &http.Server{Addr: ":8081", Handler: mux}
	go server.ListenAndServe()

	logger.Info("notification-service запущен, ожидание событий...")

	// Ждём сигнал завершения
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("notification-service остановлен")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	server.Shutdown(ctx)
}

// sendNotification имитирует отправку уведомления
func sendNotification(logger *slog.Logger, action string, data proto.TodoData) {
	// В реальном приложении здесь был бы вызов:
	// - SMTP для email
	// - Firebase/APNs для push
	// - Twilio для SMS
	logger.Info("уведомление отправлено",
		"action", action,
		"user_id", data.UserID,
		"todo_id", data.ID,
		"channel", "log", // пока просто логируем
	)
}
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  # --- Инфраструктура ---

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: todos
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Автоматическое создание таблиц при первом запуске
      - ./todo-service/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  nats:
    image: nats:2.10-alpine
    ports:
      - "4222:4222"   # Клиентский порт
      - "8222:8222"   # HTTP мониторинг
    command: ["--jetstream", "--http_port", "8222"]
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8222/healthz"]
      interval: 5s
      timeout: 5s
      retries: 5

  # --- Сервисы ---

  todo-service:
    build:
      context: ./todo-service
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      SERVER_PORT: "8080"
      DATABASE_URL: "postgres://postgres:postgres@postgres:5432/todos?sslmode=disable"
      DATABASE_MAX_CONNS: "20"
      DATABASE_MIN_CONNS: "5"
      NATS_URL: "nats://nats:4222"
      LOG_LEVEL: "info"
      ENVIRONMENT: "development"
      SERVICE_NAME: "todo-service"
    depends_on:
      postgres:
        condition: service_healthy
      nats:
        condition: service_healthy
    restart: unless-stopped

  notification-service:
    build:
      context: ./notification-service
      dockerfile: Dockerfile
    ports:
      - "8081:8081"
    environment:
      NATS_URL: "nats://nats:4222"
      LOG_LEVEL: "info"
      SERVICE_NAME: "notification-service"
    depends_on:
      nats:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### Dockerfile (пример для todo-service)

```dockerfile
# todo-service/Dockerfile

# --- Этап сборки ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum для кеширования зависимостей
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем бинарник
# CGO_ENABLED=0 — статическая линковка (не нужен libc в alpine)
RUN CGO_ENABLED=0 GOOS=linux go build -o /todo-service ./cmd/main.go

# --- Этап запуска ---
FROM alpine:3.19

# Сертификаты для HTTPS-запросов
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Копируем только бинарник из этапа сборки
COPY --from=builder /todo-service .

# Непривилегированный пользователь
RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

CMD ["./todo-service"]
```

### Миграция БД

```sql
-- todo-service/migrations/001_create_todos.sql

CREATE TABLE IF NOT EXISTS todos (
    id          VARCHAR(36) PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    completed   BOOLEAN DEFAULT FALSE,
    user_id     VARCHAR(36) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos (user_id);

-- Индекс для фильтрации по статусу
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos (completed);
```

> [!summary] Запуск проекта
> ```bash
> # Запуск всей инфраструктуры и сервисов
> docker-compose up --build
>
> # Тестирование API
> curl -X POST http://localhost:8080/api/todos \
>   -H "Content-Type: application/json" \
>   -d '{"title":"Изучить микросервисы","user_id":"USR-001"}'
>
> # В логах notification-service появится:
> # {"level":"INFO","msg":"УВЕДОМЛЕНИЕ: Создана новая задача","todo_id":"...","title":"Изучить микросервисы"}
>
> # Мониторинг NATS
> curl http://localhost:8222/connz
> ```

###### 🏠 Домашнее задание

1. Реализуйте полностью рабочий проект из этого раздела. Убедитесь, что при создании/обновлении/удалении задачи в логах notification-service появляются соответствующие сообщения.
2. Добавьте третий сервис — `analytics-service`, который подсчитывает статистику: сколько задач создано, сколько завершено, среднее время выполнения. Используйте NATS JetStream для гарантированной доставки.
3. Добавьте Outbox-паттерн в todo-service: вместо прямой публикации в NATS — записывайте событие в таблицу outbox в одной транзакции с бизнес-данными.
4. Добавьте Prometheus-метрики в оба сервиса и настройте сбор через docker-compose (добавьте контейнер Prometheus + Grafana).
5. Реализуйте трейсинг через OpenTelemetry: установите Jaeger в docker-compose, добавьте middleware для трейсинга в todo-service и пробросьте trace context через NATS-события в notification-service.
6. Напишите интеграционные тесты с использованием `testcontainers-go`: поднимите PostgreSQL и NATS в контейнерах и проверьте полный цикл: создание задачи → публикация события → получение уведомления. Подробнее о тестировании — в [[07-testing]].
