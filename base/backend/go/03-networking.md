---
tags:
  - backend
  - golang
  - go
  - networking
  - http
  - grpc
  - rest
  - websocket
---

## Работа с сетью

Сетевое программирование --- ключевая область Go. Язык создавался для построения масштабных сетевых сервисов в Google, и стандартная библиотека `net/http` считается одной из лучших среди всех языков программирования. В этой главе мы пройдём путь от простейшего HTTP-сервера до полноценного REST API с аутентификацией, WebSocket, SSE, gRPC и middleware. Каждый раздел содержит рабочий код, который можно скопировать и запустить.

> [!NOTE] Предварительные знания
> Для этой главы необходимо понимание основ Go из [[01-basics]] --- структуры, интерфейсы, горутины, каналы. Работа с базами данных рассматривается в [[04-databases]], конкурентность --- в [[05-concurrency]], а микросервисная архитектура --- в [[06-microservices]].

---

## 1. net/http: HTTP-сервер

Стандартная библиотека `net/http` предоставляет всё необходимое для создания production-ready HTTP-серверов без внешних зависимостей. Начиная с Go 1.22 появились паттерны маршрутизации с методами и параметрами пути.

### Базовый сервер

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// ServeMux --- маршрутизатор HTTP-запросов
	// В Go 1.22+ поддерживаются паттерны с методами и параметрами пути
	mux := http.NewServeMux()

	// Простой обработчик --- возвращает приветствие
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Добро пожаловать в Go HTTP-сервер!")
	})

	// Обработчик с параметром пути (Go 1.22+)
	// {id} --- именованный параметр, доступен через r.PathValue("id")
	mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id") // извлекаем параметр из URL
		fmt.Fprintf(w, "Пользователь с ID: %s\n", id)
	})

	// POST-запрос для создания пользователя
	mux.HandleFunc("POST /users", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
		fmt.Fprintln(w, "Пользователь создан")
	})

	// Wildcard-параметр {path...} захватывает весь оставшийся путь
	mux.HandleFunc("GET /files/{path...}", func(w http.ResponseWriter, r *http.Request) {
		filePath := r.PathValue("path")
		fmt.Fprintf(w, "Запрошен файл: %s\n", filePath)
	})

	log.Println("Сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

### http.Server с таймаутами

> [!WARNING] Не используйте http.ListenAndServe в продакшене
> `http.ListenAndServe` создаёт сервер без таймаутов. Клиент может открыть соединение и держать его вечно, что приведёт к исчерпанию ресурсов (Slowloris-атака). Всегда настраивайте таймауты через `http.Server`.

```go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// http.Server --- полная конфигурация сервера
	srv := &http.Server{
		Addr:    ":8080",
		Handler: mux,

		// ReadTimeout --- максимальное время на чтение всего запроса (заголовки + тело)
		// Защищает от медленных клиентов, которые отправляют данные по байту
		ReadTimeout: 5 * time.Second,

		// ReadHeaderTimeout --- время только на чтение заголовков
		// Полезно когда тело запроса может быть большим (загрузка файлов)
		ReadHeaderTimeout: 2 * time.Second,

		// WriteTimeout --- максимальное время на запись ответа
		// Если обработчик работает дольше --- соединение закрывается
		WriteTimeout: 10 * time.Second,

		// IdleTimeout --- время ожидания следующего запроса на keep-alive соединении
		// Если клиент не отправляет новый запрос за это время --- соединение закрывается
		IdleTimeout: 120 * time.Second,

		// MaxHeaderBytes --- максимальный размер заголовков запроса (по умолчанию 1 МБ)
		MaxHeaderBytes: 1 << 20, // 1 МБ
	}

	// Graceful shutdown --- корректное завершение работы
	// Сервер перестаёт принимать новые соединения, но дожидается завершения текущих
	go func() {
		log.Printf("Сервер запущен на %s", srv.Addr)
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("Ошибка сервера: %v", err)
		}
	}()

	// Ожидаем сигнал завершения (Ctrl+C или kill)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Получен сигнал завершения, останавливаем сервер...")

	// Даём серверу 30 секунд на завершение текущих запросов
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Ошибка при остановке сервера: %v", err)
	}

	log.Println("Сервер остановлен корректно")
}
```

> [!TIP] Таймауты в http.Server
> - `ReadTimeout` --- защита от Slowloris-атак
> - `WriteTimeout` --- должен быть больше, чем самый долгий обработчик
> - `IdleTimeout` --- экономия ресурсов на неактивных keep-alive соединениях
> - Для WebSocket и SSE `WriteTimeout` нужно отключить или установить очень большим

###### 🏠 Домашнее задание

1. Создайте HTTP-сервер с маршрутами: `GET /`, `GET /users/{id}`, `POST /users`, `DELETE /users/{id}`
2. Настройте все таймауты в `http.Server`
3. Реализуйте graceful shutdown с обработкой сигнала `SIGTERM`
4. Добавьте маршрут `GET /files/{path...}`, который принимает произвольный путь

---

## 2. HTTP-клиент

Go предоставляет мощный HTTP-клиент в стандартной библиотеке. Правильная настройка клиента критически важна для надёжности сервиса.

> [!WARNING] http.DefaultClient не имеет таймаута!
> `http.Get()`, `http.Post()` и другие функции пакета используют `http.DefaultClient`, у которого **нет таймаута**. Если удалённый сервер не отвечает --- ваша горутина зависнет навсегда. **Всегда** создавайте свой `http.Client` с `Timeout`.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// User --- структура пользователя из внешнего API
type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func main() {
	// Создаём клиент с настроенными таймаутами и транспортом
	client := &http.Client{
		// Timeout --- общий таймаут на весь запрос (DNS + соединение + отправка + чтение ответа)
		Timeout: 10 * time.Second,

		// Transport --- тонкая настройка сетевого уровня
		Transport: &http.Transport{
			// Максимум idle-соединений в пуле (для всех хостов)
			MaxIdleConns: 100,

			// Максимум idle-соединений на один хост
			// Увеличьте, если делаете много запросов к одному сервису
			MaxIdleConnsPerHost: 10,

			// Время жизни idle-соединения в пуле
			IdleConnTimeout: 90 * time.Second,
		},
	}

	// Создаём запрос с контекстом --- позволяет отменить запрос извне
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://jsonplaceholder.typicode.com/users/1", nil)
	if err != nil {
		log.Fatalf("Ошибка создания запроса: %v", err)
	}

	// Устанавливаем заголовки
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "MyGoApp/1.0")

	// Выполняем запрос
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Ошибка запроса: %v", err)
	}
	// ВАЖНО: всегда закрываем тело ответа, иначе соединение не вернётся в пул
	defer resp.Body.Close()

	// Проверяем статус-код
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("Неожиданный статус %d: %s", resp.StatusCode, body)
	}

	// Декодируем JSON-ответ
	var user User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		log.Fatalf("Ошибка декодирования: %v", err)
	}

	fmt.Printf("Пользователь: %s (%s)\n", user.Name, user.Email)
}
```

> [!TIP] Переиспользуйте http.Client
> Создавайте `http.Client` один раз и переиспользуйте во всём приложении. Клиент содержит пул соединений --- создание нового клиента на каждый запрос убивает производительность.

###### 🏠 Домашнее задание

1. Напишите HTTP-клиент, который загружает список пользователей с `jsonplaceholder.typicode.com/users`
2. Добавьте таймаут через контекст и обработку ошибок таймаута
3. Реализуйте функцию `fetchWithRetry`, которая повторяет запрос 3 раза с задержкой 1, 2, 4 секунды
4. Отправьте POST-запрос с JSON-телом для создания пользователя

---

## 3. encoding/json

Пакет `encoding/json` --- основа работы с JSON в Go. Он использует рефлексию для маппинга между Go-структурами и JSON.

### Marshal и Unmarshal

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// Product --- структура товара с JSON-тегами
type Product struct {
	// json:"id" --- имя поля в JSON
	ID int `json:"id"`

	// omitempty --- не включать в JSON, если значение нулевое
	Name string `json:"name,omitempty"`

	// Цена в копейках для точных вычислений
	PriceCents int `json:"price_cents"`

	// "-" --- полностью исключить поле из JSON (не сериализуется и не десериализуется)
	InternalCode string `json:"-"`

	// string --- сериализовать число как строку (полезно для ID > 2^53)
	BigID int64 `json:"big_id,string"`

	// Вложенная структура
	Category *Category `json:"category,omitempty"`

	// Время --- по умолчанию сериализуется в RFC3339
	CreatedAt time.Time `json:"created_at"`
}

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func main() {
	// --- Marshal: Go-структура -> JSON ---
	product := Product{
		ID:           1,
		Name:         "Ноутбук",
		PriceCents:   99900,
		InternalCode: "SECRET-123", // не попадёт в JSON
		BigID:        9007199254740993,
		Category:     &Category{ID: 5, Name: "Электроника"},
		CreatedAt:    time.Now(),
	}

	// MarshalIndent --- форматированный JSON (для отладки и логов)
	data, err := json.MarshalIndent(product, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(data))

	// --- Unmarshal: JSON -> Go-структура ---
	jsonStr := `{
		"id": 2,
		"name": "Клавиатура",
		"price_cents": 4500,
		"big_id": "9007199254740993",
		"created_at": "2024-01-15T10:30:00Z"
	}`

	var p Product
	if err := json.Unmarshal([]byte(jsonStr), &p); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Товар: %s, цена: %d коп.\n", p.Name, p.PriceCents)
}
```

### Streaming JSON: Decoder и Encoder

```go
package main

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Message string `json:"message"`
	Status  int    `json:"status"`
}

func handler(w http.ResponseWriter, r *http.Request) {
	// Decoder --- читает JSON прямо из io.Reader (тело запроса)
	// Эффективнее, чем io.ReadAll + json.Unmarshal для больших тел
	var input struct {
		Name string `json:"name"`
	}

	// DisallowUnknownFields --- вернёт ошибку, если в JSON есть неизвестные поля
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Encoder --- пишет JSON прямо в io.Writer (тело ответа)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(Response{
		Message: "Привет, " + input.Name,
		Status:  200,
	})
}
```

### Кастомная сериализация и json.RawMessage

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// UnixTime --- тип, который сериализует время как Unix timestamp
type UnixTime time.Time

// MarshalJSON --- кастомная сериализация в JSON
func (t UnixTime) MarshalJSON() ([]byte, error) {
	stamp := time.Time(t).Unix()
	return json.Marshal(stamp)
}

// UnmarshalJSON --- кастомная десериализация из JSON
func (t *UnixTime) UnmarshalJSON(data []byte) error {
	var timestamp int64
	if err := json.Unmarshal(data, &timestamp); err != nil {
		return err
	}
	*t = UnixTime(time.Unix(timestamp, 0))
	return nil
}

// Event --- событие с динамической полезной нагрузкой
type Event struct {
	Type string `json:"type"`

	// json.RawMessage --- откладываем десериализацию payload до тех пор,
	// пока не узнаем тип события
	Payload json.RawMessage `json:"payload"`
}

type UserCreated struct {
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
}

type OrderPlaced struct {
	OrderID int `json:"order_id"`
	Total   int `json:"total"`
}

func main() {
	rawJSON := `{"type": "user_created", "payload": {"user_id": 42, "name": "Иван"}}`

	var event Event
	if err := json.Unmarshal([]byte(rawJSON), &event); err != nil {
		log.Fatal(err)
	}

	// Десериализуем payload в зависимости от типа события
	switch event.Type {
	case "user_created":
		var uc UserCreated
		if err := json.Unmarshal(event.Payload, &uc); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Создан пользователь: %s (ID: %d)\n", uc.Name, uc.UserID)

	case "order_placed":
		var op OrderPlaced
		if err := json.Unmarshal(event.Payload, &op); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Создан заказ: #%d на сумму %d\n", op.OrderID, op.Total)
	}
}
```

> [!INFO] json.RawMessage
> `json.RawMessage` --- это `[]byte`, который не десериализуется при первом проходе `Unmarshal`. Это мощный инструмент для работы с полиморфным JSON --- когда структура зависит от значения другого поля. Часто используется в event-driven системах, Webhook-обработчиках и конфигурационных файлах.

###### 🏠 Домашнее задание

1. Создайте структуру `Order` с полями: ID, Items (слайс), Total, CreatedAt. Сериализуйте и десериализуйте её
2. Реализуйте кастомный `UnixTime` тип, который хранит время как Unix timestamp в JSON
3. Используйте `json.RawMessage` для обработки webhook-событий с разной структурой payload
4. Напишите обработчик, который принимает JSON с `DisallowUnknownFields` и возвращает ошибку при неизвестных полях

---

## 4. Валидация входных данных

Валидация --- критический компонент любого API. Библиотека `go-playground/validator` предоставляет декларативную валидацию через теги структур.

```go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

// validate --- глобальный экземпляр валидатора (потокобезопасный)
var validate = validator.New()

// CreateUserRequest --- запрос на создание пользователя с правилами валидации
type CreateUserRequest struct {
	// required --- поле обязательно
	// min=2,max=50 --- длина строки от 2 до 50 символов
	Name string `json:"name" validate:"required,min=2,max=50"`

	// email --- проверка формата email
	Email string `json:"email" validate:"required,email"`

	// gte=18,lte=150 --- возраст от 18 до 150
	Age int `json:"age" validate:"required,gte=18,lte=150"`

	// oneof --- значение должно быть одним из перечисленных
	Role string `json:"role" validate:"required,oneof=admin user moderator"`

	// url --- проверка формата URL
	Website string `json:"website" validate:"omitempty,url"`

	// uuid --- проверка формата UUID
	TeamID string `json:"team_id" validate:"omitempty,uuid"`

	// eqfield --- значение должно совпадать с другим полем
	Password        string `json:"password" validate:"required,min=8"`
	PasswordConfirm string `json:"password_confirm" validate:"required,eqfield=Password"`
}

// ValidationError --- структура ошибки валидации для API-ответа
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// formatValidationErrors --- преобразует ошибки валидатора в читаемый формат
func formatValidationErrors(err error) []ValidationError {
	var ve validator.ValidationErrors
	if !errors.As(err, &ve) {
		return []ValidationError{{Field: "unknown", Message: err.Error()}}
	}

	result := make([]ValidationError, 0, len(ve))
	for _, fe := range ve {
		var msg string
		switch fe.Tag() {
		case "required":
			msg = "Поле обязательно для заполнения"
		case "email":
			msg = "Некорректный формат email"
		case "min":
			msg = fmt.Sprintf("Минимальная длина: %s", fe.Param())
		case "max":
			msg = fmt.Sprintf("Максимальная длина: %s", fe.Param())
		case "gte":
			msg = fmt.Sprintf("Значение должно быть >= %s", fe.Param())
		case "lte":
			msg = fmt.Sprintf("Значение должно быть <= %s", fe.Param())
		case "oneof":
			msg = fmt.Sprintf("Допустимые значения: %s", fe.Param())
		case "url":
			msg = "Некорректный формат URL"
		case "uuid":
			msg = "Некорректный формат UUID"
		case "eqfield":
			msg = fmt.Sprintf("Значение должно совпадать с полем %s", fe.Param())
		default:
			msg = fmt.Sprintf("Не прошло проверку: %s", fe.Tag())
		}
		// Преобразуем имя поля в snake_case (Field -> field)
		result = append(result, ValidationError{
			Field:   strings.ToLower(fe.Field()),
			Message: msg,
		})
	}
	return result
}

// createUserHandler --- обработчик создания пользователя с валидацией
func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest

	// Декодируем JSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Некорректный JSON: " + err.Error(),
		})
		return
	}

	// Валидируем структуру
	if err := validate.Struct(req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]any{
			"error":  "Ошибка валидации",
			"errors": formatValidationErrors(err),
		})
		return
	}

	// Валидация пройдена --- создаём пользователя
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Пользователь создан",
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /users", createUserHandler)

	log.Println("Сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

> [!TIP] Кастомные валидаторы
> Можно зарегистрировать собственные валидаторы через `validate.RegisterValidation("mycheck", myFunc)`. Например, для проверки российского номера телефона или ИНН.

###### 🏠 Домашнее задание

1. Добавьте кастомный валидатор для проверки формата российского номера телефона (`+7XXXXXXXXXX`)
2. Реализуйте валидацию для структуры `UpdateUserRequest`, где все поля опциональны
3. Напишите middleware, который автоматически декодирует и валидирует JSON-тело запроса
4. Обработайте ситуацию, когда тело запроса пустое (отдельная ошибка)

---

## 5. REST API: полноценный сервер

Соберём все предыдущие концепции в полноценный REST API сервер с правильной структурой, хелперами и обработкой ошибок.

```go
package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"
)

// --- Модели ---

type Todo struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateTodoRequest struct {
	Title string `json:"title" validate:"required,min=1,max=200"`
}

type UpdateTodoRequest struct {
	Title     *string `json:"title" validate:"omitempty,min=1,max=200"`
	Completed *bool   `json:"completed"`
}

// --- Сервер ---

// Server --- основная структура сервера
// Хранит зависимости: логгер, хранилище, конфигурацию
type Server struct {
	logger *slog.Logger
	mu     sync.RWMutex
	todos  map[string]Todo
	nextID int
}

// NewServer --- конструктор сервера
func NewServer(logger *slog.Logger) *Server {
	return &Server{
		logger: logger,
		todos:  make(map[string]Todo),
		nextID: 1,
	}
}

// --- Хелперы для ответов ---

// respond --- отправляет JSON-ответ с указанным статус-кодом
func (s *Server) respond(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			s.logger.Error("Ошибка кодирования ответа", "error", err)
		}
	}
}

// respondError --- отправляет JSON-ошибку
func (s *Server) respondError(w http.ResponseWriter, status int, message string) {
	s.respond(w, status, map[string]string{"error": message})
}

// decode --- декодирует JSON из тела запроса
func (s *Server) decode(r *http.Request, v any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}

// --- Маршруты ---

// routes --- регистрирует все маршруты сервера
func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()

	// API v1
	mux.HandleFunc("GET /api/v1/todos", s.handleListTodos)
	mux.HandleFunc("POST /api/v1/todos", s.handleCreateTodo)
	mux.HandleFunc("GET /api/v1/todos/{id}", s.handleGetTodo)
	mux.HandleFunc("PUT /api/v1/todos/{id}", s.handleUpdateTodo)
	mux.HandleFunc("DELETE /api/v1/todos/{id}", s.handleDeleteTodo)

	// Health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		s.respond(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	return mux
}

// --- Обработчики ---

// handleListTodos --- GET /api/v1/todos --- список всех задач
func (s *Server) handleListTodos(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	todos := make([]Todo, 0, len(s.todos))
	for _, t := range s.todos {
		todos = append(todos, t)
	}

	s.respond(w, http.StatusOK, todos)
}

// handleCreateTodo --- POST /api/v1/todos --- создание задачи
func (s *Server) handleCreateTodo(w http.ResponseWriter, r *http.Request) {
	var req CreateTodoRequest
	if err := s.decode(r, &req); err != nil {
		s.respondError(w, http.StatusBadRequest, "Некорректный JSON: "+err.Error())
		return
	}

	if req.Title == "" {
		s.respondError(w, http.StatusUnprocessableEntity, "Поле title обязательно")
		return
	}

	s.mu.Lock()
	id := fmt.Sprintf("%d", s.nextID)
	s.nextID++
	todo := Todo{
		ID:        id,
		Title:     req.Title,
		Completed: false,
		CreatedAt: time.Now(),
	}
	s.todos[id] = todo
	s.mu.Unlock()

	s.logger.Info("Задача создана", "id", id, "title", req.Title)
	s.respond(w, http.StatusCreated, todo)
}

// handleGetTodo --- GET /api/v1/todos/{id} --- получение задачи по ID
func (s *Server) handleGetTodo(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	s.mu.RLock()
	todo, ok := s.todos[id]
	s.mu.RUnlock()

	if !ok {
		s.respondError(w, http.StatusNotFound, "Задача не найдена")
		return
	}

	s.respond(w, http.StatusOK, todo)
}

// handleUpdateTodo --- PUT /api/v1/todos/{id} --- обновление задачи
func (s *Server) handleUpdateTodo(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req UpdateTodoRequest
	if err := s.decode(r, &req); err != nil {
		s.respondError(w, http.StatusBadRequest, "Некорректный JSON: "+err.Error())
		return
	}

	s.mu.Lock()
	todo, ok := s.todos[id]
	if !ok {
		s.mu.Unlock()
		s.respondError(w, http.StatusNotFound, "Задача не найдена")
		return
	}

	// Обновляем только переданные поля (partial update)
	if req.Title != nil {
		todo.Title = *req.Title
	}
	if req.Completed != nil {
		todo.Completed = *req.Completed
	}

	s.todos[id] = todo
	s.mu.Unlock()

	s.logger.Info("Задача обновлена", "id", id)
	s.respond(w, http.StatusOK, todo)
}

// handleDeleteTodo --- DELETE /api/v1/todos/{id} --- удаление задачи
func (s *Server) handleDeleteTodo(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	s.mu.Lock()
	_, ok := s.todos[id]
	if !ok {
		s.mu.Unlock()
		s.respondError(w, http.StatusNotFound, "Задача не найдена")
		return
	}
	delete(s.todos, id)
	s.mu.Unlock()

	s.logger.Info("Задача удалена", "id", id)
	s.respond(w, http.StatusNoContent, nil)
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	srv := NewServer(logger)

	httpSrv := &http.Server{
		Addr:         ":8080",
		Handler:      srv.routes(),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	logger.Info("Сервер запущен", "addr", httpSrv.Addr)
	if err := httpSrv.ListenAndServe(); err != nil {
		logger.Error("Ошибка сервера", "error", err)
		os.Exit(1)
	}
}
```

> [!NOTE] Паттерн Server struct
> Структура `Server` --- стандартный паттерн в Go. Вместо глобальных переменных мы храним зависимости (логгер, БД, конфиг) в структуре и передаём через замыкания обработчиков. Это упрощает тестирование --- можно подставить моки через интерфейсы.

###### 🏠 Домашнее задание

1. Добавьте пагинацию к `GET /api/v1/todos` (параметры `page` и `limit`)
2. Добавьте фильтрацию по `completed` (query-параметр `?completed=true`)
3. Реализуйте сортировку по `created_at` (параметр `sort=asc|desc`)
4. Замените in-memory хранилище на файловое (JSON-файл)
5. Добавьте API v2 с другим форматом ответа (обёртка `{"data": [...], "meta": {...}}`)

---

## 6. Middleware patterns

Middleware --- это функции, которые оборачивают обработчик, добавляя логику до и после его выполнения. В Go middleware реализуется через паттерн обёртки `http.Handler`.

```go
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"runtime/debug"
	"strings"
	"sync"
	"time"
)

// Middleware --- тип функции-обёртки над http.Handler
type Middleware func(http.Handler) http.Handler

// Chain --- объединяет несколько middleware в цепочку
// Middleware применяются в порядке передачи: первый --- внешний, последний --- ближайший к обработчику
func Chain(middlewares ...Middleware) Middleware {
	return func(next http.Handler) http.Handler {
		// Применяем в обратном порядке, чтобы первый middleware был внешним
		for i := len(middlewares) - 1; i >= 0; i-- {
			next = middlewares[i](next)
		}
		return next
	}
}

// --- Logging middleware ---

// Logging --- логирует каждый HTTP-запрос: метод, путь, статус, время выполнения
func Logging(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// responseWriter-обёртка для захвата статус-кода
			wrapped := &statusResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			// Передаём управление следующему обработчику
			next.ServeHTTP(wrapped, r)

			// Логируем после выполнения
			logger.Info("HTTP-запрос",
				"method", r.Method,
				"path", r.URL.Path,
				"status", wrapped.statusCode,
				"duration", time.Since(start).String(),
				"remote_addr", r.RemoteAddr,
			)
		})
	}
}

// statusResponseWriter --- обёртка для перехвата статус-кода
type statusResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *statusResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

// --- Recovery middleware ---

// Recovery --- перехватывает паники в обработчиках и возвращает 500 вместо падения сервера
func Recovery(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					// Логируем панику с полным стектрейсом
					logger.Error("Паника в обработчике",
						"error", fmt.Sprintf("%v", err),
						"stack", string(debug.Stack()),
						"path", r.URL.Path,
					)
					http.Error(w, `{"error":"Internal Server Error"}`, http.StatusInternalServerError)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}

// --- CORS middleware ---

// CORS --- добавляет заголовки Cross-Origin Resource Sharing
func CORS(allowedOrigins []string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Проверяем, что origin разрешён
			for _, allowed := range allowedOrigins {
				if allowed == "*" || allowed == origin {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					break
				}
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400") // кеш preflight на 24 часа

			// Preflight-запрос --- отвечаем сразу, не передавая дальше
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// --- Auth middleware ---

// ContextKey --- тип для ключей контекста (избегаем коллизий строковых ключей)
type ContextKey string

const UserIDKey ContextKey = "user_id"

// Auth --- проверяет JWT-токен в заголовке Authorization
// Полная реализация JWT --- в разделе 7
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"Отсутствует заголовок Authorization"}`, http.StatusUnauthorized)
			return
		}

		// Извлекаем токен из "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error":"Некорректный формат Authorization"}`, http.StatusUnauthorized)
			return
		}

		token := parts[1]
		// TODO: Валидация JWT-токена (см. раздел 7)
		_ = token

		userID := "user-123" // Извлечённый из токена ID

		// Сохраняем userID в контексте запроса
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// --- Rate Limiting middleware ---

// RateLimiter --- простой rate limiter на основе token bucket
type RateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientLimiter
	rate     int           // запросов в период
	interval time.Duration // период
}

type clientLimiter struct {
	tokens    int
	lastReset time.Time
}

func NewRateLimiter(rate int, interval time.Duration) *RateLimiter {
	return &RateLimiter{
		clients:  make(map[string]*clientLimiter),
		rate:     rate,
		interval: interval,
	}
}

// Limit --- middleware для ограничения частоты запросов
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Определяем клиента по IP
		clientIP := r.RemoteAddr

		rl.mu.Lock()
		cl, exists := rl.clients[clientIP]
		if !exists {
			cl = &clientLimiter{tokens: rl.rate, lastReset: time.Now()}
			rl.clients[clientIP] = cl
		}

		// Сбрасываем счётчик, если прошёл интервал
		if time.Since(cl.lastReset) > rl.interval {
			cl.tokens = rl.rate
			cl.lastReset = time.Now()
		}

		if cl.tokens <= 0 {
			rl.mu.Unlock()
			w.Header().Set("Retry-After", fmt.Sprintf("%d", int(rl.interval.Seconds())))
			http.Error(w, `{"error":"Too Many Requests"}`, http.StatusTooManyRequests)
			return
		}

		cl.tokens--
		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}

// RequestID --- добавляет уникальный ID к каждому запросу
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := fmt.Sprintf("%d", time.Now().UnixNano())
		w.Header().Set("X-Request-ID", id)
		ctx := context.WithValue(r.Context(), ContextKey("request_id"), id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	limiter := NewRateLimiter(100, time.Minute) // 100 запросов в минуту

	mux := http.NewServeMux()
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(UserIDKey)
		fmt.Fprintf(w, "Привет, %v!\n", userID)
	})

	// Собираем цепочку middleware
	// Порядок важен: Recovery (внешний) -> Logging -> CORS -> RateLimit -> Auth -> Handler
	stack := Chain(
		Recovery(logger),
		Logging(logger),
		CORS([]string{"http://localhost:3000", "https://myapp.com"}),
		limiter.Limit,
		RequestID,
		Auth,
	)

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      stack(mux),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	logger.Info("Сервер запущен", "addr", srv.Addr)
	srv.ListenAndServe()
}
```

> [!summary] Порядок middleware
> ```
> Запрос → Recovery → Logging → CORS → RateLimit → RequestID → Auth → Handler
> Ответ  ← Recovery ← Logging ← CORS ← RateLimit ← RequestID ← Auth ← Handler
> ```
> Recovery должен быть внешним, чтобы перехватить паники из любого middleware. Logging --- вторым, чтобы логировать все запросы, включая отклонённые.

###### 🏠 Домашнее задание

1. Напишите middleware `MaxBodySize`, который ограничивает размер тела запроса (с `http.MaxBytesReader`)
2. Создайте middleware `Timeout`, который отменяет контекст запроса через N секунд
3. Реализуйте middleware `BasicAuth` для HTTP Basic-аутентификации
4. Добавьте middleware, который устанавливает заголовки безопасности (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`)

---

## 7. JWT аутентификация

JSON Web Token (JWT) --- стандартный механизм аутентификации для REST API. Токен содержит информацию о пользователе и подписан секретным ключом.

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Секретный ключ для подписи JWT
// В продакшене --- из переменных окружения или Vault
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

// Claims --- пользовательские claims в JWT
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken --- генерирует JWT-токен для пользователя
func GenerateToken(userID, email, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			// Время жизни токена --- 24 часа
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			// Время выпуска
			IssuedAt: jwt.NewNumericDate(time.Now()),
			// Издатель
			Issuer: "my-app",
		},
	}

	// Создаём токен с алгоритмом HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Подписываем токен секретным ключом
	return token.SignedString(jwtSecret)
}

// ValidateToken --- валидирует JWT-токен и возвращает claims
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		// ВАЖНО: проверяем метод подписи!
		// Атакующий может подменить alg на "none" и пропустить проверку подписи
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("ошибка парсинга токена: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("невалидный токен")
	}

	return claims, nil
}

// AuthMiddleware --- middleware для проверки JWT
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Извлекаем токен из заголовка Authorization: Bearer <token>
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Отсутствует заголовок Authorization",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Формат: Authorization: Bearer <token>",
			})
			return
		}

		// Валидируем токен
		claims, err := ValidateToken(parts[1])
		if err != nil {
			respondJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Невалидный токен: " + err.Error(),
			})
			return
		}

		// Сохраняем claims в контексте запроса
		ctx := context.WithValue(r.Context(), claimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

type contextKey string

const claimsKey contextKey = "claims"

// GetClaims --- извлекает claims из контекста (вызывать после AuthMiddleware)
func GetClaims(ctx context.Context) *Claims {
	claims, _ := ctx.Value(claimsKey).(*Claims)
	return claims
}

// RequireRole --- middleware, требующий определённую роль
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetClaims(r.Context())
			if claims == nil || claims.Role != role {
				respondJSON(w, http.StatusForbidden, map[string]string{
					"error": "Недостаточно прав",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// --- Обработчики ---

// loginHandler --- POST /login --- генерация JWT
func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Некорректный JSON"})
		return
	}

	// TODO: Проверка email/password в базе данных
	// Здесь для примера захардкожено
	if req.Email != "admin@example.com" || req.Password != "secret" {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Неверные учётные данные"})
		return
	}

	// Генерируем токен
	token, err := GenerateToken("user-1", req.Email, "admin")
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Ошибка генерации токена"})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"token": token,
	})
}

// profileHandler --- GET /profile --- защищённый маршрут
func profileHandler(w http.ResponseWriter, r *http.Request) {
	claims := GetClaims(r.Context())
	respondJSON(w, http.StatusOK, map[string]any{
		"user_id": claims.UserID,
		"email":   claims.Email,
		"role":    claims.Role,
	})
}

// adminHandler --- GET /admin --- только для администраторов
func adminHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Добро пожаловать в админ-панель",
	})
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	mux := http.NewServeMux()

	// Публичные маршруты
	mux.HandleFunc("POST /login", loginHandler)

	// Защищённые маршруты (требуют JWT)
	mux.Handle("GET /profile", AuthMiddleware(http.HandlerFunc(profileHandler)))

	// Маршрут только для админов
	adminChain := AuthMiddleware(RequireRole("admin")(http.HandlerFunc(adminHandler)))
	mux.Handle("GET /admin", adminChain)

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	logger.Info("Сервер запущен", "addr", srv.Addr)
	srv.ListenAndServe()
}
```

> [!WARNING] Безопасность JWT
> - **Всегда** проверяйте алгоритм подписи в `ParseWithClaims`. Атака "alg: none" позволяет отправить неподписанный токен.
> - Храните секрет в переменных окружения, **никогда** не в коде.
> - Используйте короткое время жизни токена (15-60 минут) + refresh-токены.
> - Для отзыва токенов используйте чёрный список или версию токена в БД.

###### 🏠 Домашнее задание

1. Добавьте refresh-токен с отдельным эндпоинтом `POST /refresh`
2. Реализуйте чёрный список отозванных токенов (in-memory или Redis)
3. Добавьте поддержку ролевой модели с несколькими ролями (`admin`, `user`, `moderator`)
4. Напишите тесты для `GenerateToken` и `ValidateToken`

---

## 8. WebSockets

WebSocket --- протокол полнодуплексной связи поверх TCP. В отличие от HTTP, обе стороны могут отправлять данные в любой момент. Идеально подходит для чатов, реал-тайм уведомлений, онлайн-игр.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

// --- Сообщение ---

type Message struct {
	Type    string `json:"type"`    // "chat", "join", "leave"
	From    string `json:"from"`
	Content string `json:"content"`
	Time    string `json:"time"`
}

// --- Hub: центр управления соединениями ---

// Hub --- координирует всех подключённых клиентов
// Паттерн Hub (или Broker) --- стандартный подход для WebSocket-серверов
type Hub struct {
	mu      sync.RWMutex
	clients map[*Client]struct{}
}

type Client struct {
	conn *websocket.Conn
	name string
	hub  *Hub
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*Client]struct{}),
	}
}

// Register --- добавляет клиента в хаб
func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	h.clients[client] = struct{}{}
	h.mu.Unlock()

	// Уведомляем всех о новом участнике
	h.Broadcast(Message{
		Type:    "join",
		From:    "system",
		Content: fmt.Sprintf("%s присоединился к чату", client.name),
		Time:    time.Now().Format(time.RFC3339),
	})
}

// Unregister --- удаляет клиента из хаба
func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	delete(h.clients, client)
	h.mu.Unlock()

	h.Broadcast(Message{
		Type:    "leave",
		From:    "system",
		Content: fmt.Sprintf("%s покинул чат", client.name),
		Time:    time.Now().Format(time.RFC3339),
	})
}

// Broadcast --- отправляет сообщение всем подключённым клиентам
func (h *Hub) Broadcast(msg Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		// Отправляем каждому клиенту в отдельной горутине, чтобы медленный клиент
		// не блокировал остальных
		go func(c *Client) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			if err := wsjson.Write(ctx, c.conn, msg); err != nil {
				log.Printf("Ошибка отправки %s: %v", c.name, err)
			}
		}(client)
	}
}

// --- WebSocket-обработчик ---

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Принимаем WebSocket-соединение
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		// В продакшене укажите конкретные origins
		InsecureSkipVerify: true,
	})
	if err != nil {
		log.Printf("Ошибка принятия WebSocket: %v", err)
		return
	}
	defer conn.CloseNow()

	// Получаем имя из query-параметра
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "Аноним"
	}

	client := &Client{conn: conn, name: name, hub: h}
	h.Register(client)
	defer h.Unregister(client)

	// Цикл чтения сообщений от клиента
	for {
		var msg Message
		err := wsjson.Read(r.Context(), conn, &msg)
		if err != nil {
			// Нормальное закрытие соединения --- не ошибка
			if websocket.CloseStatus(err) == websocket.StatusNormalClosure {
				break
			}
			log.Printf("Ошибка чтения от %s: %v", name, err)
			break
		}

		// Заполняем метаданные
		msg.From = name
		msg.Time = time.Now().Format(time.RFC3339)
		msg.Type = "chat"

		// Рассылаем всем
		h.Broadcast(msg)
	}

	// Корректно закрываем соединение
	conn.Close(websocket.StatusNormalClosure, "соединение закрыто")
}

func main() {
	hub := NewHub()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", hub.HandleWebSocket)

	// Простая HTML-страница для тестирования
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, `<!DOCTYPE html>
<html><body>
<h1>WebSocket Чат</h1>
<div id="messages" style="height:300px;overflow:auto;border:1px solid #ccc;padding:10px;"></div>
<input id="input" type="text" placeholder="Сообщение..." style="width:300px;">
<button onclick="send()">Отправить</button>
<script>
const ws = new WebSocket("ws://localhost:8080/ws?name=User");
ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    document.getElementById("messages").innerHTML += "<p><b>" + msg.from + ":</b> " + msg.content + "</p>";
};
function send() {
    const input = document.getElementById("input");
    ws.send(JSON.stringify({content: input.value}));
    input.value = "";
}
</script>
</body></html>`)
	})

	log.Println("WebSocket-сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

> [!INFO] Когда использовать WebSocket
> - **Чат** --- двунаправленный обмен сообщениями
> - **Онлайн-игры** --- обновление состояния в реальном времени
> - **Совместное редактирование** --- синхронизация изменений
> - **Торговые платформы** --- поток котировок
>
> Если данные идут только от сервера к клиенту --- рассмотрите SSE (раздел 9).

###### 🏠 Домашнее задание

1. Добавьте в Hub список комнат (rooms) и возможность отправлять сообщения только в конкретную комнату
2. Реализуйте ping/pong для обнаружения отключённых клиентов
3. Добавьте аутентификацию через JWT при установке WebSocket-соединения
4. Ограничьте максимальное количество подключений (например, 1000)

---

## 9. Server-Sent Events (SSE)

SSE --- механизм однонаправленной отправки событий от сервера к клиенту через HTTP. Проще WebSocket, работает через стандартный HTTP, автоматически переподключается.

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// SSEClient --- подключённый клиент SSE
type SSEClient struct {
	events chan string
}

// SSEBroker --- управляет подписчиками SSE
type SSEBroker struct {
	clients    map[*SSEClient]struct{}
	register   chan *SSEClient
	unregister chan *SSEClient
	broadcast  chan string
}

func NewSSEBroker() *SSEBroker {
	b := &SSEBroker{
		clients:    make(map[*SSEClient]struct{}),
		register:   make(chan *SSEClient),
		unregister: make(chan *SSEClient),
		broadcast:  make(chan string, 100),
	}
	go b.run()
	return b
}

// run --- основной цикл брокера (работает в отдельной горутине)
func (b *SSEBroker) run() {
	for {
		select {
		case client := <-b.register:
			b.clients[client] = struct{}{}
			log.Printf("SSE: клиент подключён, всего: %d", len(b.clients))

		case client := <-b.unregister:
			delete(b.clients, client)
			close(client.events)
			log.Printf("SSE: клиент отключён, всего: %d", len(b.clients))

		case msg := <-b.broadcast:
			for client := range b.clients {
				select {
				case client.events <- msg:
				default:
					// Клиент не успевает --- отключаем
					delete(b.clients, client)
					close(client.events)
				}
			}
		}
	}
}

// HandleSSE --- обработчик SSE-соединения
func (b *SSEBroker) HandleSSE(w http.ResponseWriter, r *http.Request) {
	// Проверяем поддержку streaming (http.Flusher)
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming не поддерживается", http.StatusInternalServerError)
		return
	}

	// Устанавливаем заголовки SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	// CORS --- если клиент на другом домене
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Создаём клиента
	client := &SSEClient{events: make(chan string, 10)}
	b.register <- client

	// При закрытии соединения --- отписываемся
	defer func() {
		b.unregister <- client
	}()

	// Отправляем начальное событие
	fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"connected\"}\n\n")
	flusher.Flush()

	// Цикл отправки событий
	for {
		select {
		case <-r.Context().Done():
			// Клиент отключился
			return

		case event, ok := <-client.events:
			if !ok {
				return
			}
			// Формат SSE: "data: <содержимое>\n\n"
			// Каждое событие может иметь id, event и data
			fmt.Fprintf(w, "data: %s\n\n", event)
			flusher.Flush()
		}
	}
}

func main() {
	broker := NewSSEBroker()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /events", broker.HandleSSE)

	// Эндпоинт для отправки событий (для тестирования)
	mux.HandleFunc("POST /send", func(w http.ResponseWriter, r *http.Request) {
		msg := r.URL.Query().Get("msg")
		if msg == "" {
			msg = "Тестовое сообщение"
		}
		broker.broadcast <- fmt.Sprintf(`{"message":"%s","time":"%s"}`, msg, time.Now().Format(time.RFC3339))
		w.Write([]byte("Отправлено"))
	})

	// HTML-страница для тестирования
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, `<!DOCTYPE html>
<html><body>
<h1>SSE Demo</h1>
<div id="events" style="height:300px;overflow:auto;border:1px solid #ccc;padding:10px;"></div>
<script>
const es = new EventSource("/events");
es.onmessage = (e) => {
    document.getElementById("events").innerHTML += "<p>" + e.data + "</p>";
};
es.addEventListener("connected", (e) => {
    document.getElementById("events").innerHTML += "<p><i>Подключено</i></p>";
});
es.onerror = () => console.log("SSE: переподключение...");
</script>
</body></html>`)
	})

	log.Println("SSE-сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

> [!TIP] SSE vs WebSocket
> | Характеристика | SSE | WebSocket |
> |---|---|---|
> | Направление | Сервер -> Клиент | Двунаправленный |
> | Протокол | HTTP | WS (поверх TCP) |
> | Переподключение | Автоматическое | Ручное |
> | Бинарные данные | Нет (только текст) | Да |
> | Прокси/CDN | Легко проходит | Могут блокировать |
> | Простота | Проще | Сложнее |
>
> **Используйте SSE** для: уведомлений, обновления ленты, мониторинга, стриминга логов.
> **Используйте WebSocket** для: чатов, игр, совместного редактирования.

###### 🏠 Домашнее задание

1. Добавьте именованные события (`event: notification\ndata: ...\n\n`)
2. Реализуйте ID событий и восстановление после переподключения (`Last-Event-ID`)
3. Добавьте heartbeat (пустое сообщение каждые 30 секунд) для поддержания соединения
4. Интегрируйте SSE с REST API --- при создании задачи отправляйте событие всем подписчикам

---

## 10. gRPC

gRPC --- фреймворк удалённого вызова процедур от Google. Использует Protocol Buffers для сериализации и HTTP/2 для транспорта. Значительно быстрее REST+JSON для межсервисного взаимодействия.

### Определение сервиса в Protocol Buffers

```protobuf
// proto/todo/v1/todo.proto
syntax = "proto3";

package todo.v1;

option go_package = "github.com/myapp/gen/todo/v1;todov1";

// Сообщение (message) --- аналог структуры в Go
message Todo {
  string id = 1;          // Номер поля (не значение!) --- используется для сериализации
  string title = 2;
  bool completed = 3;
  int64 created_at = 4;   // Unix timestamp
}

// Запросы и ответы
message CreateTodoRequest {
  string title = 1;
}

message CreateTodoResponse {
  Todo todo = 1;
}

message GetTodoRequest {
  string id = 1;
}

message GetTodoResponse {
  Todo todo = 1;
}

message ListTodosRequest {
  int32 page_size = 1;
  string page_token = 2;
}

message ListTodosResponse {
  repeated Todo todos = 1;         // repeated = слайс
  string next_page_token = 2;
}

message DeleteTodoRequest {
  string id = 1;
}

message DeleteTodoResponse {}

// Сервис --- определяет RPC-методы
service TodoService {
  // Унарный RPC --- один запрос, один ответ
  rpc CreateTodo(CreateTodoRequest) returns (CreateTodoResponse);
  rpc GetTodo(GetTodoRequest) returns (GetTodoResponse);
  rpc DeleteTodo(DeleteTodoRequest) returns (DeleteTodoResponse);

  // Server streaming --- один запрос, поток ответов
  rpc ListTodos(ListTodosRequest) returns (ListTodosResponse);
}
```

### Генерация Go-кода

```bash
# Установка инструментов
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Генерация Go-кода из proto-файла
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/todo/v1/todo.proto
```

### Реализация gRPC-сервера

```go
package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	todov1 "github.com/myapp/gen/todo/v1"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// todoServer --- реализация gRPC-сервиса
type todoServer struct {
	// Встраиваем UnimplementedTodoServiceServer для forward-совместимости
	// Если добавить новый метод в proto --- сервер скомпилируется без его реализации
	todov1.UnimplementedTodoServiceServer

	mu     sync.RWMutex
	todos  map[string]*todov1.Todo
	nextID int
}

func newTodoServer() *todoServer {
	return &todoServer{
		todos:  make(map[string]*todov1.Todo),
		nextID: 1,
	}
}

// CreateTodo --- реализация RPC-метода
func (s *todoServer) CreateTodo(ctx context.Context, req *todov1.CreateTodoRequest) (*todov1.CreateTodoResponse, error) {
	// Валидация входных данных
	if req.Title == "" {
		// gRPC использует свои коды ошибок вместо HTTP-статусов
		return nil, status.Error(codes.InvalidArgument, "title обязателен")
	}

	s.mu.Lock()
	id := fmt.Sprintf("%d", s.nextID)
	s.nextID++
	todo := &todov1.Todo{
		Id:        id,
		Title:     req.Title,
		Completed: false,
		CreatedAt: time.Now().Unix(),
	}
	s.todos[id] = todo
	s.mu.Unlock()

	return &todov1.CreateTodoResponse{Todo: todo}, nil
}

// GetTodo --- получение задачи по ID
func (s *todoServer) GetTodo(ctx context.Context, req *todov1.GetTodoRequest) (*todov1.GetTodoResponse, error) {
	s.mu.RLock()
	todo, ok := s.todos[req.Id]
	s.mu.RUnlock()

	if !ok {
		return nil, status.Errorf(codes.NotFound, "задача %s не найдена", req.Id)
	}

	return &todov1.GetTodoResponse{Todo: todo}, nil
}

// ListTodos --- список всех задач
func (s *todoServer) ListTodos(ctx context.Context, req *todov1.ListTodosRequest) (*todov1.ListTodosResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	todos := make([]*todov1.Todo, 0, len(s.todos))
	for _, t := range s.todos {
		todos = append(todos, t)
	}

	return &todov1.ListTodosResponse{Todos: todos}, nil
}

// DeleteTodo --- удаление задачи
func (s *todoServer) DeleteTodo(ctx context.Context, req *todov1.DeleteTodoRequest) (*todov1.DeleteTodoResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.todos[req.Id]; !ok {
		return nil, status.Errorf(codes.NotFound, "задача %s не найдена", req.Id)
	}

	delete(s.todos, req.Id)
	return &todov1.DeleteTodoResponse{}, nil
}

// --- gRPC Interceptor (аналог middleware) ---

// loggingInterceptor --- логирует каждый RPC-вызов
func loggingInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	start := time.Now()

	// Вызываем обработчик
	resp, err := handler(ctx, req)

	// Логируем результат
	duration := time.Since(start)
	if err != nil {
		log.Printf("RPC %s [%v] ERROR: %v", info.FullMethod, duration, err)
	} else {
		log.Printf("RPC %s [%v] OK", info.FullMethod, duration)
	}

	return resp, err
}

// recoveryInterceptor --- перехватывает паники
func recoveryInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (resp any, err error) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Паника в %s: %v", info.FullMethod, r)
			err = status.Errorf(codes.Internal, "внутренняя ошибка сервера")
		}
	}()
	return handler(ctx, req)
}

func main() {
	// Слушаем TCP-порт
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Ошибка прослушивания порта: %v", err)
	}

	// Создаём gRPC-сервер с interceptors
	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			recoveryInterceptor,
			loggingInterceptor,
		),
	)

	// Регистрируем сервис
	todov1.RegisterTodoServiceServer(grpcServer, newTodoServer())

	log.Printf("gRPC-сервер запущен на :50051")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Ошибка gRPC-сервера: %v", err)
	}
}
```

### gRPC-клиент

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	todov1 "github.com/myapp/gen/todo/v1"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	// Подключаемся к gRPC-серверу
	conn, err := grpc.NewClient("localhost:50051",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("Ошибка подключения: %v", err)
	}
	defer conn.Close()

	// Создаём клиент сервиса
	client := todov1.NewTodoServiceClient(conn)

	// Контекст с таймаутом
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Создаём задачу
	createResp, err := client.CreateTodo(ctx, &todov1.CreateTodoRequest{
		Title: "Изучить gRPC",
	})
	if err != nil {
		log.Fatalf("Ошибка создания: %v", err)
	}
	fmt.Printf("Создана задача: %+v\n", createResp.Todo)

	// Получаем задачу
	getResp, err := client.GetTodo(ctx, &todov1.GetTodoRequest{
		Id: createResp.Todo.Id,
	})
	if err != nil {
		log.Fatalf("Ошибка получения: %v", err)
	}
	fmt.Printf("Получена задача: %+v\n", getResp.Todo)

	// Список задач
	listResp, err := client.ListTodos(ctx, &todov1.ListTodosRequest{})
	if err != nil {
		log.Fatalf("Ошибка списка: %v", err)
	}
	fmt.Printf("Всего задач: %d\n", len(listResp.Todos))
}
```

> [!INFO] gRPC vs REST
> | Характеристика | gRPC | REST |
> |---|---|---|
> | Протокол | HTTP/2 | HTTP/1.1 или HTTP/2 |
> | Формат данных | Protocol Buffers (бинарный) | JSON (текстовый) |
> | Контракт | .proto файлы (строгая типизация) | OpenAPI (опционально) |
> | Скорость | Быстрее (бинарная сериализация) | Медленнее |
> | Streaming | Нативный (4 типа) | Ограниченный |
> | Браузер | Через gRPC-Web | Нативно |
> | Отладка | Сложнее (бинарный формат) | Проще (curl, Postman) |
>
> **Используйте gRPC** для межсервисного взаимодействия внутри системы.
> **Используйте REST** для публичных API, мобильных и веб-клиентов.
> Подробнее о микросервисной архитектуре --- в [[06-microservices]].

###### 🏠 Домашнее задание

1. Определите proto-файл для сервиса пользователей (`UserService`) с CRUD-операциями
2. Реализуйте server streaming для отслеживания изменений (метод `WatchTodos`)
3. Добавьте аутентификацию через metadata (аналог HTTP-заголовков) и interceptor
4. Напишите interceptor для метрик (подсчёт количества вызовов и времени выполнения)

---

## 11. Swagger/OpenAPI

Swagger (OpenAPI) --- стандарт документирования REST API. Библиотека `swaggo` генерирует спецификацию из комментариев в коде.

```go
package main

import (
	"encoding/json"
	"net/http"

	_ "github.com/myapp/docs" // Импорт сгенерированной документации

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// @title Todo API
// @version 1.0
// @description REST API для управления задачами
// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Введите JWT-токен в формате: Bearer <token>

type Todo struct {
	ID        string `json:"id" example:"1"`
	Title     string `json:"title" example:"Купить молоко"`
	Completed bool   `json:"completed" example:"false"`
}

type CreateTodoRequest struct {
	Title string `json:"title" example:"Купить молоко" binding:"required"`
}

type ErrorResponse struct {
	Error string `json:"error" example:"Задача не найдена"`
}

// listTodos godoc
// @Summary Список задач
// @Description Получить список всех задач с пагинацией
// @Tags todos
// @Accept json
// @Produce json
// @Param page query int false "Номер страницы" default(1)
// @Param limit query int false "Записей на странице" default(20)
// @Success 200 {array} Todo
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /todos [get]
func listTodos(w http.ResponseWriter, r *http.Request) {
	todos := []Todo{
		{ID: "1", Title: "Изучить Go", Completed: true},
		{ID: "2", Title: "Написать API", Completed: false},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todos)
}

// createTodo godoc
// @Summary Создать задачу
// @Description Создать новую задачу
// @Tags todos
// @Accept json
// @Produce json
// @Param request body CreateTodoRequest true "Данные задачи"
// @Success 201 {object} Todo
// @Failure 400 {object} ErrorResponse
// @Failure 422 {object} ErrorResponse
// @Security BearerAuth
// @Router /todos [post]
func createTodo(w http.ResponseWriter, r *http.Request) {
	// ... реализация
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/v1/todos", listTodos)
	mux.HandleFunc("POST /api/v1/todos", createTodo)

	// Swagger UI доступен по адресу /swagger/index.html
	mux.Handle("GET /swagger/", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	http.ListenAndServe(":8080", mux)
}
```

```bash
# Установка swag CLI
go install github.com/swaggo/swag/cmd/swag@latest

# Генерация документации из комментариев
swag init

# Сгенерирует папку docs/ с файлами:
# - docs.go
# - swagger.json
# - swagger.yaml
```

> [!TIP] Автоматическая генерация
> Добавьте `swag init` в `Makefile` или `go generate`, чтобы документация обновлялась автоматически при сборке. Также рассмотрите `oapi-codegen` --- генератор серверного и клиентского кода из OpenAPI-спецификации.

###### 🏠 Домашнее задание

1. Добавьте Swagger-аннотации ко всем эндпоинтам Todo API из раздела 5
2. Настройте Swagger UI с аутентификацией (кнопка "Authorize" для JWT)
3. Сгенерируйте клиент на Go из OpenAPI-спецификации с помощью `oapi-codegen`

---

## 12. HTTP-клиент с retry

При работе с внешними сервисами запросы могут падать из-за временных проблем с сетью. Retry с экспоненциальным откатом (exponential backoff) --- стандартный подход к повышению надёжности.

### Ручная реализация

```go
package main

import (
	"context"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"time"
)

// RetryConfig --- конфигурация retry-логики
type RetryConfig struct {
	MaxRetries  int           // Максимальное количество повторов
	BaseDelay   time.Duration // Начальная задержка
	MaxDelay    time.Duration // Максимальная задержка
	RetryOn     []int         // HTTP-статусы, при которых повторяем
}

// DefaultRetryConfig --- конфигурация по умолчанию
var DefaultRetryConfig = RetryConfig{
	MaxRetries: 3,
	BaseDelay:  1 * time.Second,
	MaxDelay:   30 * time.Second,
	RetryOn:    []int{408, 429, 500, 502, 503, 504},
}

// DoWithRetry --- выполняет HTTP-запрос с повторами
func DoWithRetry(client *http.Client, req *http.Request, cfg RetryConfig) (*http.Response, error) {
	var lastErr error

	for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
		// Клонируем запрос (тело может быть прочитано только один раз)
		reqClone := req.Clone(req.Context())

		resp, err := client.Do(reqClone)
		if err != nil {
			lastErr = err
			// Если контекст отменён --- не повторяем
			if req.Context().Err() != nil {
				return nil, fmt.Errorf("контекст отменён: %w", err)
			}
			waitBeforeRetry(attempt, cfg)
			continue
		}

		// Проверяем, нужно ли повторять по статус-коду
		if shouldRetry(resp.StatusCode, cfg.RetryOn) && attempt < cfg.MaxRetries {
			resp.Body.Close() // Закрываем тело перед повтором
			lastErr = fmt.Errorf("статус %d", resp.StatusCode)
			waitBeforeRetry(attempt, cfg)
			continue
		}

		return resp, nil
	}

	return nil, fmt.Errorf("все %d попыток исчерпаны: %w", cfg.MaxRetries+1, lastErr)
}

// shouldRetry --- проверяет, нужно ли повторять запрос
func shouldRetry(statusCode int, retryOn []int) bool {
	for _, code := range retryOn {
		if statusCode == code {
			return true
		}
	}
	return false
}

// waitBeforeRetry --- ожидание перед повтором с экспоненциальным откатом и jitter
func waitBeforeRetry(attempt int, cfg RetryConfig) {
	// Экспоненциальный откат: 1s, 2s, 4s, 8s, ...
	delay := time.Duration(math.Pow(2, float64(attempt))) * cfg.BaseDelay

	// Jitter --- случайный разброс, чтобы избежать "стада" повторов
	jitter := time.Duration(rand.Int63n(int64(delay) / 2))
	delay = delay + jitter

	// Не превышаем максимальную задержку
	if delay > cfg.MaxDelay {
		delay = cfg.MaxDelay
	}

	time.Sleep(delay)
}

func main() {
	client := &http.Client{Timeout: 10 * time.Second}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "https://httpbin.org/status/500", nil)

	resp, err := DoWithRetry(client, req, DefaultRetryConfig)
	if err != nil {
		fmt.Printf("Ошибка: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Статус: %d, Тело: %s\n", resp.StatusCode, body)
}
```

### hashicorp/go-retryablehttp

```go
package main

import (
	"fmt"
	"io"
	"log"
	"time"

	"github.com/hashicorp/go-retryablehttp"
)

func main() {
	// retryablehttp --- production-ready HTTP-клиент с retry
	client := retryablehttp.NewClient()

	// Настройка retry
	client.RetryMax = 3                        // Максимум повторов
	client.RetryWaitMin = 1 * time.Second      // Минимальная задержка
	client.RetryWaitMax = 30 * time.Second     // Максимальная задержка
	client.HTTPClient.Timeout = 10 * time.Second // Таймаут одного запроса

	// Тихий режим --- без логов retry (по умолчанию логирует каждый повтор)
	client.Logger = nil

	// Кастомная проверка --- повторять или нет
	client.CheckRetry = retryablehttp.DefaultRetryPolicy

	resp, err := client.Get("https://httpbin.org/get")
	if err != nil {
		log.Fatalf("Ошибка: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Ответ: %s\n", body)
}
```

> [!NOTE] Jitter
> Jitter (случайный разброс) критически важен. Без него при сбое сервиса все клиенты будут повторять запросы одновременно, создавая "thundering herd" --- волну запросов, которая повалит сервис снова. Jitter распределяет повторы во времени.

###### 🏠 Домашнее задание

1. Добавьте логирование каждой попытки с номером и задержкой
2. Реализуйте circuit breaker: после N последовательных ошибок прекращайте попытки на M секунд
3. Добавьте поддержку заголовка `Retry-After` от сервера (для 429 Too Many Requests)

---

## 13. Ограничение размера тела запроса

Без ограничения размера тела запроса злоумышленник может отправить гигабайтный запрос и исчерпать память сервера.

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// maxBodySize --- максимальный размер JSON-тела (1 МБ)
const maxBodySize = 1 << 20 // 1 МБ

// maxUploadSize --- максимальный размер загружаемого файла (10 МБ)
const maxUploadSize = 10 << 20 // 10 МБ

// jsonHandler --- обработчик с ограничением размера JSON-тела
func jsonHandler(w http.ResponseWriter, r *http.Request) {
	// MaxBytesReader оборачивает Body и возвращает ошибку при превышении лимита
	// Также закрывает соединение, чтобы клиент не продолжал отправлять данные
	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)

	var input struct {
		Name string `json:"name"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&input); err != nil {
		// Проверяем, была ли ошибка из-за превышения лимита
		if err.Error() == "http: request body too large" {
			http.Error(w, `{"error":"Тело запроса слишком большое (макс. 1 МБ)"}`, http.StatusRequestEntityTooLarge)
			return
		}
		http.Error(w, `{"error":"Некорректный JSON"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Привет, " + input.Name})
}

// uploadHandler --- обработчик загрузки файла
func uploadHandler(w http.ResponseWriter, r *http.Request) {
	// Ограничиваем размер всего запроса (включая заголовки multipart)
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	// ParseMultipartForm загружает файл в память (до maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		http.Error(w, `{"error":"Файл слишком большой (макс. 10 МБ)"}`, http.StatusRequestEntityTooLarge)
		return
	}

	// Получаем файл
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error":"Файл не найден в запросе"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Проверяем расширение файла
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{".jpg": true, ".png": true, ".pdf": true}
	if !allowedExts[ext] {
		http.Error(w, `{"error":"Недопустимый тип файла"}`, http.StatusBadRequest)
		return
	}

	// Проверяем MIME-тип по содержимому (не доверяем Content-Type от клиента)
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	contentType := http.DetectContentType(buf[:n])

	allowedMIME := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"application/pdf": true,
	}
	if !allowedMIME[contentType] {
		http.Error(w, `{"error":"Недопустимый MIME-тип файла"}`, http.StatusBadRequest)
		return
	}

	// Возвращаем указатель в начало файла после проверки
	file.Seek(0, io.SeekStart)

	// Сохраняем файл
	dst, err := os.Create(filepath.Join("/tmp/uploads", header.Filename))
	if err != nil {
		http.Error(w, `{"error":"Ошибка сохранения файла"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, `{"error":"Ошибка записи файла"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Файл загружен",
		"filename": header.Filename,
		"size":     fmt.Sprintf("%d байт", header.Size),
	})
}

func main() {
	os.MkdirAll("/tmp/uploads", 0755)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/data", jsonHandler)
	mux.HandleFunc("POST /api/upload", uploadHandler)

	http.ListenAndServe(":8080", mux)
}
```

> [!WARNING] Всегда ограничивайте размер тела
> Без `http.MaxBytesReader` атакующий может отправить запрос размером в несколько гигабайт, что приведёт к OOM (Out of Memory) и падению сервиса. Это одна из самых распространённых уязвимостей в Go-сервисах.

###### 🏠 Домашнее задание

1. Напишите middleware `MaxBodySize`, который автоматически применяет `MaxBytesReader` ко всем запросам
2. Реализуйте загрузку нескольких файлов одновременно (multipart)
3. Добавьте генерацию уникальных имён файлов (UUID) для предотвращения перезаписи
4. Реализуйте проверку на вирусы через внешний сервис (ClamAV) перед сохранением

---

## 14. Streaming response

Streaming --- отправка ответа частями, не дожидаясь формирования полного ответа. Используется для больших данных, реал-тайм логов, прогресса загрузки.

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// streamHandler --- отправляет данные частями
func streamHandler(w http.ResponseWriter, r *http.Request) {
	// Проверяем поддержку http.Flusher
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming не поддерживается", http.StatusInternalServerError)
		return
	}

	// Устанавливаем заголовки для chunked transfer
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Transfer-Encoding", "chunked")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// Отправляем данные порциями
	for i := 1; i <= 10; i++ {
		// Проверяем, не отключился ли клиент
		select {
		case <-r.Context().Done():
			log.Println("Клиент отключился")
			return
		default:
		}

		data := map[string]any{
			"chunk":     i,
			"total":     10,
			"message":   fmt.Sprintf("Обработка элемента %d из 10", i),
			"timestamp": time.Now().Format(time.RFC3339),
		}

		// Пишем JSON + newline (NDJSON --- Newline Delimited JSON)
		if err := json.NewEncoder(w).Encode(data); err != nil {
			log.Printf("Ошибка записи: %v", err)
			return
		}

		// Flush --- немедленно отправляет буфер клиенту
		// Без Flush данные будут копиться в буфере и отправятся только в конце
		flusher.Flush()

		time.Sleep(500 * time.Millisecond) // Имитация работы
	}
}

// progressHandler --- отправляет прогресс длительной операции
func progressHandler(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming не поддерживается", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")

	steps := []string{
		"Подключение к базе данных...",
		"Загрузка данных...",
		"Обработка записей...",
		"Генерация отчёта...",
		"Сохранение результатов...",
		"Готово!",
	}

	for i, step := range steps {
		fmt.Fprintf(w, "[%d/%d] %s\n", i+1, len(steps), step)
		flusher.Flush()
		time.Sleep(1 * time.Second) // Имитация работы
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /stream", streamHandler)
	mux.HandleFunc("GET /progress", progressHandler)

	log.Println("Сервер запущен на :8080")
	// ВАЖНО: для streaming WriteTimeout должен быть 0 или очень большим
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 0, // Без таймаута для streaming
	}
	log.Fatal(srv.ListenAndServe())
}
```

> [!TIP] NDJSON (Newline Delimited JSON)
> NDJSON --- формат, в котором каждая строка --- отдельный JSON-объект. Удобен для streaming, потому что клиент может обрабатывать данные построчно, не дожидаясь всего ответа. Используется в Elasticsearch Bulk API, Docker API, GitHub API.

###### 🏠 Домашнее задание

1. Реализуйте streaming-экспорт большой таблицы из базы данных в JSON (построчно)
2. Добавьте streaming-загрузку файла с отображением прогресса (% выполнения)
3. Реализуйте прокси, который стримит ответ от upstream-сервера клиенту

---

## 15. Версионирование API

Версионирование позволяет вносить несовместимые изменения в API, не ломая существующих клиентов.

### URL-based версионирование

```go
package main

import (
	"encoding/json"
	"net/http"
)

type TodoV1 struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

// V2 --- расширенный формат с метаданными
type TodoV2 struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Completed bool     `json:"completed"` // переименовано из "done"
	Priority  string   `json:"priority"`
	Tags      []string `json:"tags"`
}

// API v1 --- старый формат
func listTodosV1(w http.ResponseWriter, r *http.Request) {
	todos := []TodoV1{
		{ID: "1", Title: "Изучить Go", Done: true},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todos)
}

// API v2 --- новый формат
func listTodosV2(w http.ResponseWriter, r *http.Request) {
	todos := []TodoV2{
		{ID: "1", Title: "Изучить Go", Completed: true, Priority: "high", Tags: []string{"education"}},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"data":  todos,
		"total": len(todos),
	})
}

func main() {
	mux := http.NewServeMux()

	// URL-based: /api/v1/..., /api/v2/...
	mux.HandleFunc("GET /api/v1/todos", listTodosV1)
	mux.HandleFunc("GET /api/v2/todos", listTodosV2)

	http.ListenAndServe(":8080", mux)
}
```

### Header-based версионирование

```go
package main

import (
	"encoding/json"
	"net/http"
)

// versionRouter --- маршрутизация по заголовку API-Version
func versionRouter(w http.ResponseWriter, r *http.Request) {
	version := r.Header.Get("API-Version")

	switch version {
	case "2", "2.0":
		// Логика v2
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"data":    []string{"элемент в формате v2"},
			"version": "2.0",
		})

	default:
		// По умолчанию --- v1 (обратная совместимость)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]string{"элемент в формате v1"})
	}
}

// Accept header: application/vnd.myapp.v2+json
func acceptHeaderRouter(w http.ResponseWriter, r *http.Request) {
	accept := r.Header.Get("Accept")

	w.Header().Set("Content-Type", "application/json")

	switch accept {
	case "application/vnd.myapp.v2+json":
		json.NewEncoder(w).Encode(map[string]string{"format": "v2"})
	default:
		json.NewEncoder(w).Encode(map[string]string{"format": "v1"})
	}
}

func main() {
	mux := http.NewServeMux()

	// Header-based: определяем версию по заголовку
	mux.HandleFunc("GET /api/todos", versionRouter)

	// Accept header-based: Content Negotiation
	mux.HandleFunc("GET /api/items", acceptHeaderRouter)

	// Query-parameter: /api/todos?version=2
	mux.HandleFunc("GET /api/tasks", func(w http.ResponseWriter, r *http.Request) {
		version := r.URL.Query().Get("version")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"version": version,
			"message": "Задачи в формате v" + version,
		})
	})

	http.ListenAndServe(":8080", mux)
}
```

> [!summary] Сравнение подходов к версионированию
> | Подход | Плюсы | Минусы |
> |---|---|---|
> | URL (`/api/v1/`) | Простой, наглядный, кешируемый | Дублирование маршрутов |
> | Header (`API-Version: 2`) | Чистые URL | Сложнее тестировать (curl -H) |
> | Query (`?version=2`) | Простой | Засоряет URL |
> | Accept (`vnd.myapp.v2+json`) | Стандарт HTTP | Самый сложный |
>
> **Рекомендация**: используйте URL-based для публичных API. Это самый распространённый и простой подход.

###### 🏠 Домашнее задание

1. Реализуйте middleware, который определяет версию API из заголовка и добавляет её в контекст
2. Создайте маршрутизатор, который направляет запрос к нужной версии обработчика на основе контекста
3. Реализуйте deprecation: старые версии возвращают заголовок `Deprecation: true` и `Sunset: <date>`

---

## 16. Фреймворки

Стандартная библиотека `net/http` покрывает большинство потребностей. Но для больших проектов фреймворки могут ускорить разработку.

### Gin

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Todo struct {
	ID    string `json:"id"`
	Title string `json:"title" binding:"required,min=1,max=200"`
	Done  bool   `json:"done"`
}

func main() {
	// gin.Default() включает Logger и Recovery middleware
	r := gin.Default()

	// Группа маршрутов с общим префиксом
	api := r.Group("/api/v1")
	{
		// Middleware для группы
		api.Use(func(c *gin.Context) {
			c.Header("X-API-Version", "1.0")
			c.Next() // Передаём управление следующему обработчику
		})

		api.GET("/todos", func(c *gin.Context) {
			todos := []Todo{
				{ID: "1", Title: "Изучить Gin", Done: false},
			}
			c.JSON(http.StatusOK, todos)
		})

		api.POST("/todos", func(c *gin.Context) {
			var todo Todo
			// ShouldBindJSON --- декодирует JSON и валидирует через binding-теги
			if err := c.ShouldBindJSON(&todo); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, todo)
		})

		api.GET("/todos/:id", func(c *gin.Context) {
			id := c.Param("id") // Параметр пути
			c.JSON(http.StatusOK, gin.H{"id": id})
		})
	}

	r.Run(":8080")
}
```

### Chi

```go
package main

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	r := chi.NewRouter()

	// Chi middleware --- полностью совместимы с net/http
	r.Use(middleware.Logger)       // Логирование запросов
	r.Use(middleware.Recoverer)    // Перехват паник
	r.Use(middleware.RequestID)    // Уникальный ID запроса
	r.Use(middleware.RealIP)       // Реальный IP за прокси
	r.Use(middleware.Compress(5))  // gzip-сжатие

	// Группа маршрутов
	r.Route("/api/v1", func(r chi.Router) {
		// Middleware только для этой группы
		r.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("X-API-Version", "1.0")
				next.ServeHTTP(w, r)
			})
		})

		r.Get("/todos", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]string{"todo1", "todo2"})
		})

		r.Post("/todos", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
		})

		r.Get("/todos/{id}", func(w http.ResponseWriter, r *http.Request) {
			id := chi.URLParam(r, "id") // Параметр пути
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"id": id})
		})
	})

	http.ListenAndServe(":8080", r)
}
```

### Echo и Fiber (краткое сравнение)

```go
// Echo --- минималистичный фреймворк с хорошей производительностью
// import "github.com/labstack/echo/v4"
//
// e := echo.New()
// e.GET("/users/:id", func(c echo.Context) error {
//     id := c.Param("id")
//     return c.JSON(http.StatusOK, map[string]string{"id": id})
// })

// Fiber --- фреймворк, вдохновлённый Express.js, на основе fasthttp
// import "github.com/gofiber/fiber/v2"
//
// app := fiber.New()
// app.Get("/users/:id", func(c *fiber.Ctx) error {
//     id := c.Params("id")
//     return c.JSON(fiber.Map{"id": id})
// })
```

> [!summary] Сравнение фреймворков
> | Фреймворк | Совместимость с net/http | Производительность | Middleware | Документация |
> |---|---|---|---|---|
> | **net/http** (1.22+) | Нативный | Высокая | Ручная | Стандартная |
> | **Chi** | Полная | Высокая | Богатый набор | Хорошая |
> | **Gin** | Частичная | Очень высокая | Встроенные | Отличная |
> | **Echo** | Частичная | Высокая | Встроенные | Хорошая |
> | **Fiber** | Нет (fasthttp) | Самая высокая | Встроенные | Хорошая |
>
> **Рекомендация**: начинайте с `net/http` (Go 1.22+). Если нужны группы маршрутов и встроенные middleware --- используйте Chi (полная совместимость с net/http). Gin --- для максимальной скорости разработки. Fiber --- осторожно, несовместим с net/http.

###### 🏠 Домашнее задание

1. Перепишите Todo API из раздела 5 с использованием Chi
2. Перепишите его же с использованием Gin
3. Сравните количество кода и удобство каждого подхода
4. Напишите бенчмарк, сравнивающий производительность net/http vs Chi vs Gin

---

## 17. Сквозной проект: Todo HTTP API

Соберём все знания из этой главы в полноценный HTTP REST API сервис. Трансформируем консольное Todo-приложение из [[01-basics]] в HTTP-сервер с middleware, валидацией, корректной обработкой ошибок и graceful shutdown.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"runtime/debug"
	"sync"
	"syscall"
	"time"
)

// ==================== Модели ====================

// Todo --- модель задачи
type Todo struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateTodoRequest --- запрос на создание задачи
type CreateTodoRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// UpdateTodoRequest --- запрос на обновление задачи
type UpdateTodoRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Completed   *bool   `json:"completed"`
}

// APIResponse --- обёртка для API-ответов
type APIResponse struct {
	Data  any    `json:"data,omitempty"`
	Error string `json:"error,omitempty"`
	Meta  *Meta  `json:"meta,omitempty"`
}

type Meta struct {
	Total int `json:"total"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

// ==================== Хранилище ====================

// TodoStore --- потокобезопасное хранилище задач
type TodoStore struct {
	mu     sync.RWMutex
	todos  map[string]Todo
	nextID int
}

func NewTodoStore() *TodoStore {
	return &TodoStore{
		todos:  make(map[string]Todo),
		nextID: 1,
	}
}

func (s *TodoStore) Create(title, description string) Todo {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	id := fmt.Sprintf("%d", s.nextID)
	s.nextID++

	todo := Todo{
		ID:          id,
		Title:       title,
		Description: description,
		Completed:   false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.todos[id] = todo
	return todo
}

func (s *TodoStore) GetByID(id string) (Todo, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	todo, ok := s.todos[id]
	return todo, ok
}

func (s *TodoStore) GetAll() []Todo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	todos := make([]Todo, 0, len(s.todos))
	for _, t := range s.todos {
		todos = append(todos, t)
	}
	return todos
}

func (s *TodoStore) Update(id string, req UpdateTodoRequest) (Todo, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo, ok := s.todos[id]
	if !ok {
		return Todo{}, false
	}

	if req.Title != nil {
		todo.Title = *req.Title
	}
	if req.Description != nil {
		todo.Description = *req.Description
	}
	if req.Completed != nil {
		todo.Completed = *req.Completed
	}
	todo.UpdatedAt = time.Now()

	s.todos[id] = todo
	return todo, true
}

func (s *TodoStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, ok := s.todos[id]
	if !ok {
		return false
	}
	delete(s.todos, id)
	return true
}

// ==================== Сервер ====================

// Server --- HTTP-сервер с зависимостями
type Server struct {
	store  *TodoStore
	logger *slog.Logger
}

func NewServer(store *TodoStore, logger *slog.Logger) *Server {
	return &Server{store: store, logger: logger}
}

// --- Хелперы ---

func (s *Server) respond(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			s.logger.Error("Ошибка сериализации ответа", "error", err)
		}
	}
}

func (s *Server) respondOK(w http.ResponseWriter, data any) {
	s.respond(w, http.StatusOK, APIResponse{Data: data})
}

func (s *Server) respondCreated(w http.ResponseWriter, data any) {
	s.respond(w, http.StatusCreated, APIResponse{Data: data})
}

func (s *Server) respondError(w http.ResponseWriter, status int, message string) {
	s.respond(w, status, APIResponse{Error: message})
}

func (s *Server) decode(r *http.Request, v any) error {
	r.Body = http.MaxBytesReader(nil, r.Body, 1<<20) // 1 МБ
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}

// --- Middleware ---

// loggingMiddleware --- логирует каждый запрос
func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		s.logger.Info("HTTP запрос",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.statusCode,
			"duration_ms", time.Since(start).Milliseconds(),
			"remote_addr", r.RemoteAddr,
			"user_agent", r.UserAgent(),
		)
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

// recoveryMiddleware --- перехватывает паники
func (s *Server) recoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				s.logger.Error("Паника в обработчике",
					"error", fmt.Sprintf("%v", err),
					"stack", string(debug.Stack()),
					"method", r.Method,
					"path", r.URL.Path,
				)
				s.respondError(w, http.StatusInternalServerError, "Внутренняя ошибка сервера")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// corsMiddleware --- добавляет CORS-заголовки
func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// --- Обработчики ---

// handleListTodos --- GET /api/v1/todos
func (s *Server) handleListTodos(w http.ResponseWriter, r *http.Request) {
	todos := s.store.GetAll()
	s.respond(w, http.StatusOK, APIResponse{
		Data: todos,
		Meta: &Meta{
			Total: len(todos),
			Page:  1,
			Limit: len(todos),
		},
	})
}

// handleGetTodo --- GET /api/v1/todos/{id}
func (s *Server) handleGetTodo(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	todo, ok := s.store.GetByID(id)
	if !ok {
		s.respondError(w, http.StatusNotFound, fmt.Sprintf("Задача с ID %s не найдена", id))
		return
	}
	s.respondOK(w, todo)
}

// handleCreateTodo --- POST /api/v1/todos
func (s *Server) handleCreateTodo(w http.ResponseWriter, r *http.Request) {
	var req CreateTodoRequest
	if err := s.decode(r, &req); err != nil {
		s.respondError(w, http.StatusBadRequest, "Некорректный JSON: "+err.Error())
		return
	}

	// Валидация
	if req.Title == "" {
		s.respondError(w, http.StatusUnprocessableEntity, "Поле title обязательно")
		return
	}
	if len(req.Title) > 200 {
		s.respondError(w, http.StatusUnprocessableEntity, "Максимальная длина title --- 200 символов")
		return
	}

	todo := s.store.Create(req.Title, req.Description)
	s.logger.Info("Задача создана", "id", todo.ID, "title", todo.Title)
	s.respondCreated(w, todo)
}

// handleUpdateTodo --- PUT /api/v1/todos/{id}
func (s *Server) handleUpdateTodo(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req UpdateTodoRequest
	if err := s.decode(r, &req); err != nil {
		s.respondError(w, http.StatusBadRequest, "Некорректный JSON: "+err.Error())
		return
	}

	// Валидация
	if req.Title != nil && len(*req.Title) > 200 {
		s.respondError(w, http.StatusUnprocessableEntity, "Максимальная длина title --- 200 символов")
		return
	}

	todo, ok := s.store.Update(id, req)
	if !ok {
		s.respondError(w, http.StatusNotFound, fmt.Sprintf("Задача с ID %s не найдена", id))
		return
	}

	s.logger.Info("Задача обновлена", "id", id)
	s.respondOK(w, todo)
}

// handleDeleteTodo --- DELETE /api/v1/todos/{id}
func (s *Server) handleDeleteTodo(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	if !s.store.Delete(id) {
		s.respondError(w, http.StatusNotFound, fmt.Sprintf("Задача с ID %s не найдена", id))
		return
	}

	s.logger.Info("Задача удалена", "id", id)
	w.WriteHeader(http.StatusNoContent)
}

// --- Маршруты ---

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	// API v1 маршруты
	mux.HandleFunc("GET /api/v1/todos", s.handleListTodos)
	mux.HandleFunc("GET /api/v1/todos/{id}", s.handleGetTodo)
	mux.HandleFunc("POST /api/v1/todos", s.handleCreateTodo)
	mux.HandleFunc("PUT /api/v1/todos/{id}", s.handleUpdateTodo)
	mux.HandleFunc("DELETE /api/v1/todos/{id}", s.handleDeleteTodo)

	// Health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		s.respondOK(w, map[string]string{"status": "healthy"})
	})

	// Применяем middleware (порядок: Recovery -> CORS -> Logging -> Handler)
	var handler http.Handler = mux
	handler = s.loggingMiddleware(handler)
	handler = s.corsMiddleware(handler)
	handler = s.recoveryMiddleware(handler)

	return handler
}

// ==================== Main ====================

func main() {
	// Настройка логгера
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// Создаём сервер
	store := NewTodoStore()
	srv := NewServer(store, logger)

	// Конфигурация HTTP-сервера
	httpSrv := &http.Server{
		Addr:              ":8080",
		Handler:           srv.Routes(),
		ReadTimeout:       5 * time.Second,
		ReadHeaderTimeout: 2 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	// Запускаем сервер в горутине
	go func() {
		logger.Info("Сервер запущен",
			"addr", httpSrv.Addr,
			"read_timeout", httpSrv.ReadTimeout,
			"write_timeout", httpSrv.WriteTimeout,
		)
		if err := httpSrv.ListenAndServe(); err != http.ErrServerClosed {
			logger.Error("Ошибка сервера", "error", err)
			os.Exit(1)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit

	logger.Info("Получен сигнал завершения", "signal", sig.String())

	// Даём 30 секунд на завершение текущих запросов
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpSrv.Shutdown(ctx); err != nil {
		logger.Error("Ошибка graceful shutdown", "error", err)
		os.Exit(1)
	}

	logger.Info("Сервер остановлен корректно")
}
```

> [!summary] Что мы использовали в сквозном проекте
> - **net/http** с Go 1.22+ паттернами маршрутизации
> - **Server struct** --- паттерн для хранения зависимостей
> - **Middleware** --- logging, recovery, CORS
> - **JSON** --- encoding/decoding с DisallowUnknownFields
> - **Валидация** --- проверка входных данных
> - **http.MaxBytesReader** --- ограничение размера тела запроса
> - **Graceful shutdown** --- корректное завершение работы
> - **slog** --- структурированное логирование
> - **Таймауты** --- защита от медленных клиентов
>
> В следующих главах мы добавим:
> - Базу данных PostgreSQL --- [[04-databases]]
> - Конкурентную обработку запросов --- [[05-concurrency]]
> - Разделение на микросервисы --- [[06-microservices]]

###### 🏠 Домашнее задание

1. Добавьте JWT-аутентификацию из раздела 7 к Todo API
2. Подключите базу данных PostgreSQL вместо in-memory хранилища (см. [[04-databases]])
3. Добавьте Swagger-документацию из раздела 11
4. Реализуйте SSE-уведомления: при создании/обновлении/удалении задачи отправляйте событие подписчикам
5. Напишите интеграционные тесты с `httptest.NewServer`
6. Добавьте rate limiting из раздела 6
7. Реализуйте пагинацию, фильтрацию и сортировку
8. Деплойте сервис в Docker (Dockerfile + docker-compose.yaml)

---

> [!NOTE] Итоги главы
> В этой главе мы прошли путь от базового HTTP-сервера до полноценного REST API с аутентификацией, WebSocket, SSE и gRPC. Все примеры используют стандартную библиотеку Go и минимум внешних зависимостей. В [[04-databases]] мы подключим PostgreSQL и Redis, в [[05-concurrency]] --- разберём конкурентные паттерны для высоконагруженных сервисов, а в [[06-microservices]] --- построим распределённую систему из нескольких сервисов.
