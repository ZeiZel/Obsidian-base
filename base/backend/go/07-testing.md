---
tags:
  - backend
  - golang
  - go
  - testing
  - benchmarks
  - fuzzing
---

# 07. Тестирование в Go

> [!summary] Содержание главы
> Полное руководство по тестированию в Go: от модульных тестов до интеграционных, от бенчмарков до фаззинга. Научимся писать надёжные тесты, использовать моки, testcontainers, httptest и инструменты покрытия кода.

> [!NOTE] Предварительные знания
> Перед изучением этой главы рекомендуется ознакомиться с [[01-basics]], [[03-networking]] и [[04-databases]]. Также полезно знать основы HTTP и работы с базами данных.

---

## 1. Основы тестирования в Go

Go имеет встроенную систему тестирования — пакет `testing` из стандартной библиотеки. Никаких внешних фреймворков не нужно для начала работы.

### Соглашения по именованию

```go
// Файл: math.go — основной код
package math

// Add складывает два числа
func Add(a, b int) int {
    return a + b
}

// Divide выполняет деление с проверкой делителя
func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("деление на ноль")
    }
    return a / b, nil
}
```

```go
// Файл: math_test.go — тесты (суффикс _test.go обязателен!)
package math

import "testing"

// Имя функции ДОЛЖНО начинаться с Test и принимать *testing.T
func TestAdd(t *testing.T) {
    // Вызываем тестируемую функцию
    result := Add(2, 3)

    // Проверяем результат
    if result != 5 {
        // t.Errorf — сообщает об ошибке, но продолжает тест
        t.Errorf("Add(2, 3) = %d; ожидалось 5", result)
    }
}

func TestDivide(t *testing.T) {
    // Тест успешного деления
    result, err := Divide(10, 2)
    if err != nil {
        // t.Fatalf — сообщает об ошибке и ОСТАНАВЛИВАЕТ тест
        t.Fatalf("неожиданная ошибка: %v", err)
    }
    if result != 5.0 {
        t.Errorf("Divide(10, 2) = %f; ожидалось 5.0", result)
    }

    // Тест деления на ноль
    _, err = Divide(10, 0)
    if err == nil {
        t.Error("ожидалась ошибка при делении на ноль")
    }
}

func TestAddLogging(t *testing.T) {
    // t.Log выводит сообщение только при -v флаге
    t.Log("запускаем тест сложения с логированием")
    result := Add(100, 200)
    t.Logf("результат: %d", result) // Logf — форматированный вывод
    if result != 300 {
        t.Errorf("Add(100, 200) = %d; ожидалось 300", result)
    }
}
```

### Запуск тестов

```bash
# Запуск всех тестов в текущем пакете
go test

# Запуск с подробным выводом (-v = verbose)
go test -v

# Запуск конкретного теста по имени (-run принимает регулярное выражение)
go test -run TestAdd

# Запуск тестов во всех подпакетах
go test ./...

# Запуск с флагом -run и регулярным выражением
go test -run "TestDivide" -v
```

### Black-box vs White-box тестирование

```go
// White-box тестирование: тест в том же пакете
// Файл: math_test.go
package math // <-- тот же пакет, доступ к приватным функциям

func TestInternalHelper(t *testing.T) {
    // Можем вызывать неэкспортированные функции
    result := internalHelper(42)
    if result != 84 {
        t.Errorf("internalHelper(42) = %d; ожидалось 84", result)
    }
}
```

```go
// Black-box тестирование: тест в отдельном пакете
// Файл: math_external_test.go
package math_test // <-- пакет с суффиксом _test

import (
    "testing"
    "myproject/math" // Импортируем тестируемый пакет
)

func TestAddBlackBox(t *testing.T) {
    // Доступ только к экспортированным функциям — как у обычного пользователя
    result := math.Add(2, 3)
    if result != 5 {
        t.Errorf("math.Add(2, 3) = %d; ожидалось 5", result)
    }
}
```

> [!TIP] Когда использовать какой подход
> **Black-box тесты** (`package_test`) — предпочтительны, так как тестируют публичный API. Используйте их по умолчанию.
> **White-box тесты** (`package`) — когда нужно проверить внутреннюю логику или приватные функции.

###### 🏠 Домашнее задание

1. Создайте пакет `calculator` с функциями `Add`, `Subtract`, `Multiply`, `Divide`.
2. Напишите white-box тесты для каждой функции.
3. Напишите black-box тесты в пакете `calculator_test`.
4. Убедитесь, что все тесты проходят с `go test -v`.
5. Используйте `t.Fatalf` для критичных проверок и `t.Errorf` для некритичных.

---

## 2. Table-driven tests

Table-driven tests — каноничный паттерн тестирования в Go. Вместо множества отдельных функций мы описываем набор тестовых случаев в виде слайса структур.

```go
package math

import (
    "fmt"
    "testing"
)

func TestAdd_TableDriven(t *testing.T) {
    // Определяем структуру тестового случая
    tests := []struct {
        name     string // имя подтеста — обязательно для читаемости
        a, b     int    // входные данные
        expected int    // ожидаемый результат
    }{
        {
            name:     "положительные числа",
            a:        2,
            b:        3,
            expected: 5,
        },
        {
            name:     "отрицательные числа",
            a:        -2,
            b:        -3,
            expected: -5,
        },
        {
            name:     "ноль",
            a:        0,
            b:        0,
            expected: 0,
        },
        {
            name:     "положительное и отрицательное",
            a:        5,
            b:        -3,
            expected: 2,
        },
        {
            name:     "большие числа",
            a:        1000000,
            b:        2000000,
            expected: 3000000,
        },
    }

    // Итерируемся по тестовым случаям
    for _, tt := range tests {
        // t.Run создаёт подтест — каждый случай запускается отдельно
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; ожидалось %d",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

func TestDivide_TableDriven(t *testing.T) {
    tests := []struct {
        name      string
        a, b      float64
        expected  float64
        expectErr bool // флаг: ожидаем ли мы ошибку
    }{
        {
            name:     "обычное деление",
            a:        10,
            b:        2,
            expected: 5,
        },
        {
            name:     "деление с остатком",
            a:        7,
            b:        2,
            expected: 3.5,
        },
        {
            name:      "деление на ноль",
            a:         10,
            b:         0,
            expectErr: true,
        },
        {
            name:     "деление отрицательных",
            a:        -10,
            b:        -2,
            expected: 5,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Divide(tt.a, tt.b)

            // Проверяем ошибку
            if tt.expectErr {
                if err == nil {
                    t.Fatal("ожидалась ошибка, но её нет")
                }
                return // если ожидали ошибку и получили — тест пройден
            }

            if err != nil {
                t.Fatalf("неожиданная ошибка: %v", err)
            }

            if result != tt.expected {
                t.Errorf("Divide(%f, %f) = %f; ожидалось %f",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

### Запуск отдельного подтеста

```bash
# Запуск конкретного подтеста (имя через /)
go test -run "TestDivide_TableDriven/деление_на_ноль" -v

# Запуск нескольких подтестов по паттерну
go test -run "TestDivide_TableDriven/деление" -v
```

> [!INFO] Почему table-driven тесты популярны в Go
> 1. **Меньше дублирования** — логика проверки написана один раз
> 2. **Легко добавить новый случай** — просто добавьте элемент в слайс
> 3. **Наглядность** — все случаи видны в одном месте
> 4. **Подтесты** — каждый случай можно запустить отдельно через `-run`

###### 🏠 Домашнее задание

1. Напишите table-driven тесты для функции `Fibonacci(n int) int`.
2. Включите краевые случаи: n=0, n=1, n=2, отрицательные числа.
3. Добавьте подтест с большим числом (n=20) и проверьте результат.
4. Запустите конкретный подтест через `-run`.

---

## 3. Test helpers

Хелперы помогают избежать дублирования кода в тестах и улучшают читаемость сообщений об ошибках.

### t.Helper()

```go
package user

import "testing"

// assertEqual — пользовательский хелпер для сравнения
func assertEqual(t *testing.T, got, want interface{}) {
    // t.Helper() помечает функцию как хелпер:
    // при ошибке Go покажет строку ВЫЗЫВАЮЩЕГО кода, а не хелпера
    t.Helper()
    if got != want {
        t.Errorf("получено %v; ожидалось %v", got, want)
    }
}

func TestUserAge(t *testing.T) {
    user := NewUser("Алексей", 30)
    // Если тест упадёт — ошибка укажет на ЭТУ строку, а не на assertEqual
    assertEqual(t, user.Age(), 30)
}
```

### t.Cleanup()

```go
func TestWithTempFile(t *testing.T) {
    // Создаём временный файл
    f, err := os.CreateTemp("", "test-*.txt")
    if err != nil {
        t.Fatalf("не удалось создать временный файл: %v", err)
    }

    // t.Cleanup регистрирует функцию, которая выполнится
    // ПОСЛЕ завершения теста (аналог defer, но для тестов)
    t.Cleanup(func() {
        os.Remove(f.Name())
        t.Log("временный файл удалён")
    })

    // Работаем с файлом...
    _, err = f.WriteString("тестовые данные")
    if err != nil {
        t.Fatalf("не удалось записать в файл: %v", err)
    }
    f.Close()

    // Читаем и проверяем
    data, err := os.ReadFile(f.Name())
    if err != nil {
        t.Fatalf("не удалось прочитать файл: %v", err)
    }
    if string(data) != "тестовые данные" {
        t.Errorf("содержимое файла: %q; ожидалось %q", string(data), "тестовые данные")
    }
}
```

### Паттерн setupTestDB

```go
package repository

import (
    "database/sql"
    "testing"
    _ "github.com/lib/pq"
)

// setupTestDB — хелпер для подготовки тестовой базы данных
// Возвращает подключение к БД; очистка происходит автоматически через t.Cleanup
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper() // помечаем как хелпер для корректного отчёта об ошибках

    // Подключаемся к тестовой базе данных
    db, err := sql.Open("postgres",
        "postgres://test:test@localhost:5432/testdb?sslmode=disable")
    if err != nil {
        t.Fatalf("не удалось подключиться к БД: %v", err)
    }

    // Проверяем подключение
    if err := db.Ping(); err != nil {
        t.Fatalf("не удалось пропинговать БД: %v", err)
    }

    // Создаём таблицы для тестов
    _, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS users_test (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `)
    if err != nil {
        t.Fatalf("не удалось создать таблицу: %v", err)
    }

    // Регистрируем очистку — выполнится после теста
    t.Cleanup(func() {
        db.Exec("DROP TABLE IF EXISTS users_test")
        db.Close()
        t.Log("тестовая БД очищена")
    })

    return db
}

func TestCreateUser(t *testing.T) {
    db := setupTestDB(t) // хелпер подготовит БД и зарегистрирует очистку

    repo := NewUserRepository(db)
    user, err := repo.Create("Иван", "ivan@example.com")
    if err != nil {
        t.Fatalf("не удалось создать пользователя: %v", err)
    }

    if user.Name != "Иван" {
        t.Errorf("имя пользователя: %q; ожидалось %q", user.Name, "Иван")
    }
}
```

> [!WARNING] Важно
> Всегда используйте `t.Helper()` в хелпер-функциях. Без него при падении теста Go укажет на строку внутри хелпера, а не на строку вызывающего теста — это затрудняет поиск проблемы.

###### 🏠 Домашнее задание

1. Создайте хелпер `assertNoError(t *testing.T, err error)` с использованием `t.Helper()`.
2. Создайте хелпер `setupTempDir(t *testing.T) string`, который создаёт временную директорию и регистрирует очистку через `t.Cleanup()`.
3. Напишите тест, использующий оба хелпера.

---

## 4. Библиотека testify

`testify` — самая популярная библиотека для тестирования в Go. Она предоставляет удобные функции для проверок (assertions) и организации тестов в наборы (suites).

```bash
# Установка
go get github.com/stretchr/testify
```

### assert vs require

```go
package user

import (
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestUser_Assert(t *testing.T) {
    user := NewUser("Мария", "maria@example.com")

    // assert — при ошибке тест ПРОДОЛЖАЕТ выполняться
    // Полезно, когда хотим увидеть ВСЕ ошибки сразу
    assert.Equal(t, "Мария", user.Name)          // проверка равенства
    assert.NotEmpty(t, user.Email)                 // проверка непустоты
    assert.True(t, user.IsActive())                // проверка истинности
    assert.Contains(t, user.Email, "@")            // проверка вхождения подстроки
    assert.Len(t, user.Roles, 0)                   // проверка длины
    assert.Nil(t, user.DeletedAt)                  // проверка на nil
    assert.NotNil(t, user.CreatedAt)               // проверка на не-nil
}

func TestUser_Require(t *testing.T) {
    user, err := CreateUser("Алексей", "alex@example.com")

    // require — при ошибке тест ОСТАНАВЛИВАЕТСЯ (аналог t.Fatalf)
    // Используйте для критичных проверок, без которых дальше нет смысла
    require.NoError(t, err)       // если ошибка — тест сразу падает
    require.NotNil(t, user)       // если nil — дальше будет паника

    // После require можно безопасно работать с user
    assert.Equal(t, "Алексей", user.Name)
    assert.Equal(t, "alex@example.com", user.Email)
}

func TestCreateUser_Errors(t *testing.T) {
    tests := []struct {
        name      string
        username  string
        email     string
        wantErr   bool
        errMsg    string
    }{
        {
            name:     "пустое имя",
            username: "",
            email:    "test@example.com",
            wantErr:  true,
            errMsg:   "имя не может быть пустым",
        },
        {
            name:     "невалидный email",
            username: "Тест",
            email:    "invalid-email",
            wantErr:  true,
            errMsg:   "невалидный email",
        },
        {
            name:     "успешное создание",
            username: "Тест",
            email:    "test@example.com",
            wantErr:  false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            user, err := CreateUser(tt.username, tt.email)
            if tt.wantErr {
                // assert.Error проверяет, что ошибка не nil
                assert.Error(t, err)
                // assert.ErrorContains проверяет текст ошибки
                assert.ErrorContains(t, err, tt.errMsg)
                assert.Nil(t, user)
            } else {
                assert.NoError(t, err)
                assert.NotNil(t, user)
            }
        })
    }
}
```

### Паттерн Suite с testify/suite

```go
package user

import (
    "database/sql"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/stretchr/testify/suite"
)

// UserServiceTestSuite — набор тестов для UserService
type UserServiceTestSuite struct {
    suite.Suite              // встраиваем базовый тип Suite
    db      *sql.DB          // подключение к БД (общее для всех тестов набора)
    service *UserService     // тестируемый сервис
}

// SetupSuite выполняется ОДИН РАЗ перед всеми тестами набора
func (s *UserServiceTestSuite) SetupSuite() {
    var err error
    s.db, err = sql.Open("postgres", "postgres://test:test@localhost/testdb?sslmode=disable")
    require.NoError(s.T(), err)
    s.T().Log("подключение к БД установлено")
}

// TearDownSuite выполняется ОДИН РАЗ после всех тестов набора
func (s *UserServiceTestSuite) TearDownSuite() {
    s.db.Close()
    s.T().Log("подключение к БД закрыто")
}

// SetupTest выполняется ПЕРЕД КАЖДЫМ тестом
func (s *UserServiceTestSuite) SetupTest() {
    // Очищаем таблицу перед каждым тестом
    _, err := s.db.Exec("TRUNCATE TABLE users CASCADE")
    require.NoError(s.T(), err)
    // Создаём новый экземпляр сервиса
    s.service = NewUserService(s.db)
}

// TearDownTest выполняется ПОСЛЕ КАЖДОГО теста
func (s *UserServiceTestSuite) TearDownTest() {
    s.T().Log("тест завершён")
}

// Тесты — методы с префиксом Test
func (s *UserServiceTestSuite) TestCreateUser() {
    user, err := s.service.Create("Иван", "ivan@test.com")
    // s.Require() — аналог require
    s.Require().NoError(err)
    s.Require().NotNil(user)
    // s.Assert() — аналог assert
    s.Assert().Equal("Иван", user.Name)
    s.Assert().Equal("ivan@test.com", user.Email)
}

func (s *UserServiceTestSuite) TestGetUser() {
    // Подготавливаем данные
    created, err := s.service.Create("Пётр", "petr@test.com")
    s.Require().NoError(err)

    // Тестируем получение
    found, err := s.service.GetByID(created.ID)
    s.Require().NoError(err)
    s.Assert().Equal(created.ID, found.ID)
    s.Assert().Equal("Пётр", found.Name)
}

func (s *UserServiceTestSuite) TestDeleteUser() {
    created, err := s.service.Create("Удаляемый", "delete@test.com")
    s.Require().NoError(err)

    err = s.service.Delete(created.ID)
    s.Assert().NoError(err)

    // Проверяем, что пользователь удалён
    _, err = s.service.GetByID(created.ID)
    s.Assert().Error(err)
}

// Запуск набора тестов — обязательная функция
func TestUserServiceTestSuite(t *testing.T) {
    suite.Run(t, new(UserServiceTestSuite))
}
```

> [!TIP] Когда использовать assert, а когда require
> - **`require`** — для проверок, без которых дальнейшее выполнение теста бессмысленно (подключение к БД, создание объекта, отсутствие ошибки)
> - **`assert`** — для проверок полей, значений, когда хотим увидеть все ошибки сразу

###### 🏠 Домашнее задание

1. Установите testify: `go get github.com/stretchr/testify`.
2. Перепишите тесты из раздела 1 с использованием `assert` и `require`.
3. Создайте `suite` для тестирования сервиса заказов (`OrderService`).
4. Реализуйте `SetupTest` с очисткой данных и `SetupSuite` с подключением к БД.

---

## 5. Мок-объекты

Моки (mock-объекты) позволяют заменить реальные зависимости на управляемые заглушки при тестировании. Это ключевой приём для изоляции тестируемого кода.

### Ручные моки через интерфейсы

```go
// Файл: repository.go — определяем интерфейс
package user

import "context"

// User — модель пользователя
type User struct {
    ID    int64
    Name  string
    Email string
}

// UserRepository — интерфейс для работы с хранилищем пользователей
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    FindByID(ctx context.Context, id int64) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
    FindByEmail(ctx context.Context, email string) (*User, error)
}
```

```go
// Файл: service.go — сервис зависит от интерфейса
package user

import (
    "context"
    "fmt"
)

type UserService struct {
    repo UserRepository // зависимость через интерфейс
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

func (s *UserService) Register(ctx context.Context, name, email string) (*User, error) {
    // Проверяем, нет ли пользователя с таким email
    existing, _ := s.repo.FindByEmail(ctx, email)
    if existing != nil {
        return nil, fmt.Errorf("пользователь с email %s уже существует", email)
    }

    user := &User{Name: name, Email: email}
    if err := s.repo.Create(ctx, user); err != nil {
        return nil, fmt.Errorf("ошибка создания пользователя: %w", err)
    }
    return user, nil
}
```

```go
// Файл: service_test.go — ручной мок
package user

import (
    "context"
    "fmt"
    "testing"
)

// mockUserRepository — ручной мок, реализующий интерфейс UserRepository
type mockUserRepository struct {
    // Функции-заглушки — настраиваются в каждом тесте
    createFn      func(ctx context.Context, user *User) error
    findByIDFn    func(ctx context.Context, id int64) (*User, error)
    updateFn      func(ctx context.Context, user *User) error
    deleteFn      func(ctx context.Context, id int64) error
    findByEmailFn func(ctx context.Context, email string) (*User, error)
}

// Реализуем интерфейс — каждый метод делегирует вызов функции-заглушке
func (m *mockUserRepository) Create(ctx context.Context, user *User) error {
    if m.createFn != nil {
        return m.createFn(ctx, user)
    }
    return nil
}

func (m *mockUserRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    if m.findByIDFn != nil {
        return m.findByIDFn(ctx, id)
    }
    return nil, fmt.Errorf("пользователь не найден")
}

func (m *mockUserRepository) Update(ctx context.Context, user *User) error {
    if m.updateFn != nil {
        return m.updateFn(ctx, user)
    }
    return nil
}

func (m *mockUserRepository) Delete(ctx context.Context, id int64) error {
    if m.deleteFn != nil {
        return m.deleteFn(ctx, id)
    }
    return nil
}

func (m *mockUserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
    if m.findByEmailFn != nil {
        return m.findByEmailFn(ctx, email)
    }
    return nil, nil
}

// Тест с использованием ручного мока
func TestUserService_Register(t *testing.T) {
    // Настраиваем мок
    mock := &mockUserRepository{
        findByEmailFn: func(ctx context.Context, email string) (*User, error) {
            // Имитируем: пользователь не найден
            return nil, nil
        },
        createFn: func(ctx context.Context, user *User) error {
            // Имитируем успешное создание, присваиваем ID
            user.ID = 1
            return nil
        },
    }

    // Создаём сервис с моком
    service := NewUserService(mock)

    // Тестируем
    user, err := service.Register(context.Background(), "Иван", "ivan@test.com")
    if err != nil {
        t.Fatalf("неожиданная ошибка: %v", err)
    }
    if user.ID != 1 {
        t.Errorf("ID = %d; ожидалось 1", user.ID)
    }
}

func TestUserService_Register_DuplicateEmail(t *testing.T) {
    mock := &mockUserRepository{
        findByEmailFn: func(ctx context.Context, email string) (*User, error) {
            // Имитируем: пользователь уже существует
            return &User{ID: 1, Email: email}, nil
        },
    }

    service := NewUserService(mock)
    _, err := service.Register(context.Background(), "Дубликат", "exists@test.com")
    if err == nil {
        t.Fatal("ожидалась ошибка дублирования email")
    }
}
```

### gomock / uber/mock

```bash
# Установка uber/mock (форк gomock с активной поддержкой)
go install go.uber.org/mock/mockgen@latest
```

```go
// Генерация мока из интерфейса
//go:generate mockgen -source=repository.go -destination=mock_repository_test.go -package=user

// Файл: service_gomock_test.go
package user

import (
    "context"
    "testing"

    "go.uber.org/mock/gomock"
)

func TestUserService_Register_GoMock(t *testing.T) {
    // Создаём контроллер gomock
    ctrl := gomock.NewController(t)
    // ctrl.Finish() вызывается автоматически через t.Cleanup (Go 1.14+)

    // Создаём мок-объект (сгенерирован mockgen)
    mockRepo := NewMockUserRepository(ctrl)

    // Настраиваем ожидания (expectations)
    // EXPECT() — определяем, какие методы должны быть вызваны
    mockRepo.EXPECT().
        FindByEmail(gomock.Any(), "ivan@test.com"). // gomock.Any() — любой контекст
        Return(nil, nil).                           // возвращаем: не найден
        Times(1)                                     // ожидаем ровно 1 вызов

    mockRepo.EXPECT().
        Create(gomock.Any(), gomock.Any()). // любые аргументы
        DoAndReturn(func(ctx context.Context, user *User) error {
            user.ID = 42 // устанавливаем ID при "создании"
            return nil
        }).
        Times(1)

    // Тестируем
    service := NewUserService(mockRepo)
    user, err := service.Register(context.Background(), "Иван", "ivan@test.com")
    if err != nil {
        t.Fatalf("ошибка: %v", err)
    }
    if user.ID != 42 {
        t.Errorf("ID = %d; ожидалось 42", user.ID)
    }
    // gomock автоматически проверит, что все ожидания выполнены
}

func TestUserService_Register_GoMock_Error(t *testing.T) {
    ctrl := gomock.NewController(t)
    mockRepo := NewMockUserRepository(ctrl)

    // Настраиваем: Create возвращает ошибку
    mockRepo.EXPECT().
        FindByEmail(gomock.Any(), gomock.Any()).
        Return(nil, nil).
        AnyTimes() // AnyTimes — допускаем любое количество вызовов

    mockRepo.EXPECT().
        Create(gomock.Any(), gomock.Any()).
        Return(fmt.Errorf("ошибка БД")).
        Times(1)

    service := NewUserService(mockRepo)
    _, err := service.Register(context.Background(), "Ошибка", "error@test.com")
    if err == nil {
        t.Fatal("ожидалась ошибка")
    }
}
```

### mockery как альтернатива

```bash
# Установка mockery
go install github.com/vektra/mockery/v2@latest

# Генерация моков для всех интерфейсов
mockery --all --with-expecter

# Генерация для конкретного интерфейса
mockery --name=UserRepository --output=mocks
```

> [!INFO] Когда использовать моки, а когда реальные зависимости
> **Моки подходят для:**
> - Юнит-тестов сервисного слоя
> - Тестирования обработки ошибок
> - Изоляции от внешних сервисов (API, БД, очереди)
>
> **Реальные зависимости лучше для:**
> - Интеграционных тестов
> - Тестирования SQL-запросов
> - Проверки совместимости с реальной БД

###### 🏠 Домашнее задание

1. Определите интерфейс `OrderRepository` с методами `Create`, `FindByID`, `ListByUser`.
2. Создайте ручной мок для этого интерфейса.
3. Напишите тесты `OrderService` с использованием ручного мока.
4. Установите `mockgen` и сгенерируйте мок автоматически. Перепишите тесты с `gomock`.

---

## 6. Интеграционные тесты с testcontainers-go

`testcontainers-go` позволяет запускать Docker-контейнеры прямо из тестов. Это идеальный подход для интеграционного тестирования с реальными базами данных.

```bash
# Установка
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
go get github.com/testcontainers/testcontainers-go/modules/redis
```

### Build tag для интеграционных тестов

```go
//go:build integration

// Файл: user_repository_integration_test.go
// Этот файл компилируется ТОЛЬКО с тегом integration
package repository
```

### PostgreSQL с testcontainers

```go
//go:build integration

package repository

import (
    "context"
    "database/sql"
    "testing"
    "time"

    _ "github.com/lib/pq"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
    "github.com/testcontainers/testcontainers-go/wait"
)

// setupPostgresContainer запускает PostgreSQL в Docker-контейнере
func setupPostgresContainer(t *testing.T) *sql.DB {
    t.Helper()
    ctx := context.Background()

    // Запускаем PostgreSQL контейнер
    pgContainer, err := postgres.Run(ctx,
        "postgres:16-alpine", // образ Docker
        postgres.WithDatabase("testdb"),       // имя базы данных
        postgres.WithUsername("testuser"),      // имя пользователя
        postgres.WithPassword("testpass"),      // пароль
        testcontainers.WithWaitStrategy(
            // Стратегия ожидания: ждём, пока PostgreSQL будет готов
            wait.ForLog("database system is ready to accept connections").
                WithOccurrence(2). // PostgreSQL логирует это дважды при старте
                WithStartupTimeout(30*time.Second),
        ),
    )
    require.NoError(t, err)

    // Регистрируем остановку контейнера после теста
    t.Cleanup(func() {
        if err := pgContainer.Terminate(ctx); err != nil {
            t.Logf("ошибка при остановке контейнера: %v", err)
        }
    })

    // Получаем строку подключения
    connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
    require.NoError(t, err)
    t.Logf("строка подключения: %s", connStr)

    // Подключаемся к базе
    db, err := sql.Open("postgres", connStr)
    require.NoError(t, err)

    // Проверяем подключение
    require.NoError(t, db.Ping())

    // Создаём схему для тестов
    _, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `)
    require.NoError(t, err)

    t.Cleanup(func() {
        db.Close()
    })

    return db
}

// Полный интеграционный тест для UserRepository
func TestUserRepository_Integration(t *testing.T) {
    // Пропускаем, если запущены в коротком режиме
    if testing.Short() {
        t.Skip("пропускаем интеграционный тест в коротком режиме")
    }

    db := setupPostgresContainer(t)
    repo := NewUserRepository(db)
    ctx := context.Background()

    // === CREATE ===
    t.Run("Create", func(t *testing.T) {
        user := &User{Name: "Иван Петров", Email: "ivan@example.com"}
        err := repo.Create(ctx, user)
        require.NoError(t, err)
        assert.NotZero(t, user.ID, "ID должен быть присвоен после создания")
        t.Logf("создан пользователь с ID: %d", user.ID)
    })

    // === FindByID ===
    t.Run("FindByID", func(t *testing.T) {
        // Сначала создаём
        user := &User{Name: "Мария Сидорова", Email: "maria@example.com"}
        err := repo.Create(ctx, user)
        require.NoError(t, err)

        // Ищем по ID
        found, err := repo.FindByID(ctx, user.ID)
        require.NoError(t, err)
        assert.Equal(t, user.Name, found.Name)
        assert.Equal(t, user.Email, found.Email)
    })

    // === FindByID — не найден ===
    t.Run("FindByID_NotFound", func(t *testing.T) {
        _, err := repo.FindByID(ctx, 99999)
        assert.Error(t, err, "должна быть ошибка для несуществующего ID")
    })

    // === Update ===
    t.Run("Update", func(t *testing.T) {
        user := &User{Name: "Обновляемый", Email: "update@example.com"}
        err := repo.Create(ctx, user)
        require.NoError(t, err)

        // Обновляем имя
        user.Name = "Обновлённый"
        err = repo.Update(ctx, user)
        require.NoError(t, err)

        // Проверяем обновление
        found, err := repo.FindByID(ctx, user.ID)
        require.NoError(t, err)
        assert.Equal(t, "Обновлённый", found.Name)
    })

    // === Delete ===
    t.Run("Delete", func(t *testing.T) {
        user := &User{Name: "Удаляемый", Email: "delete@example.com"}
        err := repo.Create(ctx, user)
        require.NoError(t, err)

        // Удаляем
        err = repo.Delete(ctx, user.ID)
        require.NoError(t, err)

        // Проверяем, что удалён
        _, err = repo.FindByID(ctx, user.ID)
        assert.Error(t, err)
    })
}
```

### Redis с testcontainers

```go
//go:build integration

package cache

import (
    "context"
    "testing"
    "time"

    "github.com/redis/go-redis/v9"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/testcontainers/testcontainers-go"
    tcRedis "github.com/testcontainers/testcontainers-go/modules/redis"
)

func setupRedisContainer(t *testing.T) *redis.Client {
    t.Helper()
    ctx := context.Background()

    // Запускаем Redis контейнер
    redisContainer, err := tcRedis.Run(ctx,
        "redis:7-alpine",
    )
    require.NoError(t, err)

    t.Cleanup(func() {
        if err := redisContainer.Terminate(ctx); err != nil {
            t.Logf("ошибка при остановке Redis: %v", err)
        }
    })

    // Получаем строку подключения
    endpoint, err := redisContainer.Endpoint(ctx, "")
    require.NoError(t, err)

    // Создаём клиент Redis
    client := redis.NewClient(&redis.Options{
        Addr: endpoint,
    })

    require.NoError(t, client.Ping(ctx).Err())

    t.Cleanup(func() {
        client.Close()
    })

    return client
}

func TestRedisCache_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("пропускаем интеграционный тест")
    }

    client := setupRedisContainer(t)
    cache := NewRedisCache(client)
    ctx := context.Background()

    t.Run("Set_and_Get", func(t *testing.T) {
        err := cache.Set(ctx, "key1", "value1", 5*time.Minute)
        require.NoError(t, err)

        val, err := cache.Get(ctx, "key1")
        require.NoError(t, err)
        assert.Equal(t, "value1", val)
    })

    t.Run("Get_NotFound", func(t *testing.T) {
        _, err := cache.Get(ctx, "nonexistent")
        assert.Error(t, err)
    })

    t.Run("Delete", func(t *testing.T) {
        err := cache.Set(ctx, "to_delete", "value", time.Minute)
        require.NoError(t, err)

        err = cache.Delete(ctx, "to_delete")
        require.NoError(t, err)

        _, err = cache.Get(ctx, "to_delete")
        assert.Error(t, err)
    })
}
```

### Запуск интеграционных тестов

```bash
# Запуск интеграционных тестов (нужен Docker!)
go test -tags=integration -v ./...

# Запуск только юнит-тестов (пропускаем интеграционные)
go test -short -v ./...

# Запуск с указанием таймаута (контейнеры могут запускаться долго)
go test -tags=integration -v -timeout 5m ./...
```

> [!WARNING] Требования для testcontainers
> Для работы testcontainers нужен **запущенный Docker** на машине. В CI/CD убедитесь, что Docker-in-Docker доступен или используйте сервис Docker.

###### 🏠 Домашнее задание

1. Установите `testcontainers-go` и модуль для PostgreSQL.
2. Напишите интеграционный тест для `ProductRepository` с операциями CRUD.
3. Добавьте `//go:build integration` тег.
4. Запустите тесты с `go test -tags=integration -v`.
5. Добавьте Redis-контейнер для тестирования кэширования. Смотрите [[04-databases]] для моделей данных.

---

## 7. HTTP-тесты: httptest

Пакет `net/http/httptest` из стандартной библиотеки позволяет тестировать HTTP-обработчики без запуска реального сервера. См. также [[03-networking]] для основ HTTP в Go.

### Тестирование обработчиков

```go
package handler

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// UserHandler — HTTP-обработчик для пользователей
type UserHandler struct {
    service UserService
}

// GetUser обрабатывает GET /users/{id}
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id") // Go 1.22+
    user, err := h.service.GetByID(r.Context(), id)
    if err != nil {
        http.Error(w, "пользователь не найден", http.StatusNotFound)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

// CreateUser обрабатывает POST /users
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "невалидный JSON", http.StatusBadRequest)
        return
    }

    user, err := h.service.Create(r.Context(), req.Name, req.Email)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

// === ТЕСТЫ ===

func TestGetUser_Success(t *testing.T) {
    // Создаём мок сервиса
    mockService := &mockUserService{
        getByIDFn: func(ctx context.Context, id string) (*User, error) {
            return &User{ID: 1, Name: "Иван", Email: "ivan@test.com"}, nil
        },
    }
    handler := &UserHandler{service: mockService}

    // httptest.NewRequest создаёт тестовый запрос
    req := httptest.NewRequest(http.MethodGet, "/users/1", nil)
    req.SetPathValue("id", "1") // Go 1.22+

    // httptest.NewRecorder создаёт "записывающий" ResponseWriter
    rec := httptest.NewRecorder()

    // Вызываем обработчик
    handler.GetUser(rec, req)

    // Проверяем ответ
    assert.Equal(t, http.StatusOK, rec.Code)
    assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))

    // Декодируем тело ответа
    var user User
    err := json.NewDecoder(rec.Body).Decode(&user)
    require.NoError(t, err)
    assert.Equal(t, "Иван", user.Name)
    assert.Equal(t, "ivan@test.com", user.Email)
}

func TestGetUser_NotFound(t *testing.T) {
    mockService := &mockUserService{
        getByIDFn: func(ctx context.Context, id string) (*User, error) {
            return nil, fmt.Errorf("не найден")
        },
    }
    handler := &UserHandler{service: mockService}

    req := httptest.NewRequest(http.MethodGet, "/users/999", nil)
    req.SetPathValue("id", "999")
    rec := httptest.NewRecorder()

    handler.GetUser(rec, req)

    assert.Equal(t, http.StatusNotFound, rec.Code)
    assert.Contains(t, rec.Body.String(), "не найден")
}

func TestCreateUser_Success(t *testing.T) {
    mockService := &mockUserService{
        createFn: func(ctx context.Context, name, email string) (*User, error) {
            return &User{ID: 1, Name: name, Email: email}, nil
        },
    }
    handler := &UserHandler{service: mockService}

    // Формируем JSON-тело запроса
    body := `{"name": "Новый", "email": "new@test.com"}`
    req := httptest.NewRequest(http.MethodPost, "/users",
        strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    handler.CreateUser(rec, req)

    assert.Equal(t, http.StatusCreated, rec.Code)

    var user User
    err := json.NewDecoder(rec.Body).Decode(&user)
    require.NoError(t, err)
    assert.Equal(t, "Новый", user.Name)
}

func TestCreateUser_InvalidJSON(t *testing.T) {
    handler := &UserHandler{service: &mockUserService{}}

    // Отправляем невалидный JSON
    req := httptest.NewRequest(http.MethodPost, "/users",
        strings.NewReader("это не json"))
    rec := httptest.NewRecorder()

    handler.CreateUser(rec, req)

    assert.Equal(t, http.StatusBadRequest, rec.Code)
}
```

### httptest.NewServer для тестирования клиентов

```go
package client

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// APIClient — HTTP-клиент для внешнего API
type APIClient struct {
    baseURL    string
    httpClient *http.Client
}

func (c *APIClient) GetUser(id string) (*User, error) {
    resp, err := c.httpClient.Get(c.baseURL + "/users/" + id)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("статус: %d", resp.StatusCode)
    }

    var user User
    err = json.NewDecoder(resp.Body).Decode(&user)
    return &user, err
}

func TestAPIClient_GetUser(t *testing.T) {
    // Создаём тестовый HTTP-сервер
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Проверяем, что запрос корректный
        assert.Equal(t, "/users/42", r.URL.Path)
        assert.Equal(t, http.MethodGet, r.Method)

        // Отвечаем JSON
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(User{
            ID:    42,
            Name:  "Тестовый",
            Email: "test@test.com",
        })
    }))
    defer server.Close() // обязательно закрываем сервер

    // Создаём клиент, указывающий на тестовый сервер
    client := &APIClient{
        baseURL:    server.URL, // URL тестового сервера (например, http://127.0.0.1:54321)
        httpClient: server.Client(),
    }

    user, err := client.GetUser("42")
    require.NoError(t, err)
    assert.Equal(t, "Тестовый", user.Name)
    assert.Equal(t, int64(42), user.ID)
}

func TestAPIClient_GetUser_ServerError(t *testing.T) {
    // Сервер, возвращающий ошибку
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusInternalServerError)
    }))
    defer server.Close()

    client := &APIClient{
        baseURL:    server.URL,
        httpClient: server.Client(),
    }

    _, err := client.GetUser("42")
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "500")
}
```

### Тестирование middleware

```go
package middleware

import (
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/assert"
)

// AuthMiddleware — middleware для проверки авторизации
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "требуется авторизация", http.StatusUnauthorized)
            return
        }
        if token != "Bearer valid-token" {
            http.Error(w, "невалидный токен", http.StatusForbidden)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func TestAuthMiddleware(t *testing.T) {
    // Внутренний обработчик — будет вызван только если middleware пропустит
    innerHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("успех"))
    })

    // Оборачиваем middleware
    handler := AuthMiddleware(innerHandler)

    tests := []struct {
        name       string
        authHeader string
        wantCode   int
        wantBody   string
    }{
        {
            name:       "без токена",
            authHeader: "",
            wantCode:   http.StatusUnauthorized,
            wantBody:   "требуется авторизация",
        },
        {
            name:       "невалидный токен",
            authHeader: "Bearer invalid",
            wantCode:   http.StatusForbidden,
            wantBody:   "невалидный токен",
        },
        {
            name:       "валидный токен",
            authHeader: "Bearer valid-token",
            wantCode:   http.StatusOK,
            wantBody:   "успех",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest(http.MethodGet, "/protected", nil)
            if tt.authHeader != "" {
                req.Header.Set("Authorization", tt.authHeader)
            }
            rec := httptest.NewRecorder()

            handler.ServeHTTP(rec, req)

            assert.Equal(t, tt.wantCode, rec.Code)
            assert.Contains(t, rec.Body.String(), tt.wantBody)
        })
    }
}
```

###### 🏠 Домашнее задание

1. Напишите обработчик `ListUsers` (GET /users) с пагинацией (`?page=1&limit=10`).
2. Протестируйте его с `httptest.NewRequest` и `httptest.NewRecorder`.
3. Напишите тест для middleware логирования (проверьте, что middleware передаёт запрос дальше).
4. Создайте `httptest.NewServer` для тестирования клиента внешнего API (например, погоды).

---

## 8. Фаззинг (Go 1.18+)

Фаззинг (fuzzing) — техника автоматического тестирования, при которой Go генерирует случайные входные данные для поиска крашей, паник и неожиданного поведения.

```go
package parser

import (
    "encoding/json"
    "testing"
    "unicode/utf8"
)

// ParseName извлекает имя из JSON-строки
func ParseName(data []byte) (string, error) {
    var result struct {
        Name string `json:"name"`
    }
    if err := json.Unmarshal(data, &result); err != nil {
        return "", err
    }
    if result.Name == "" {
        return "", fmt.Errorf("поле name пустое")
    }
    return result.Name, nil
}

// Фаззинг-функция — имя ДОЛЖНО начинаться с Fuzz
func FuzzParseName(f *testing.F) {
    // Seed corpus — начальные значения для генератора
    // f.Add добавляет "зёрна" — примеры входных данных
    f.Add([]byte(`{"name": "Иван"}`))
    f.Add([]byte(`{"name": ""}`))
    f.Add([]byte(`{}`))
    f.Add([]byte(`невалидный json`))
    f.Add([]byte(``))
    f.Add([]byte(`{"name": "a"}`))
    f.Add([]byte(`{"name": 123}`))    // name — не строка
    f.Add([]byte(`null`))

    // f.Fuzz — основная функция фаззинга
    // Go будет генерировать случайные []byte и передавать сюда
    f.Fuzz(func(t *testing.T, data []byte) {
        // Вызываем тестируемую функцию с произвольными данными
        name, err := ParseName(data)

        // Если ошибки нет — проверяем инварианты
        if err == nil {
            // Имя не должно быть пустым (это наш контракт)
            if name == "" {
                t.Error("ParseName вернул пустое имя без ошибки")
            }
            // Имя должно быть валидным UTF-8
            if !utf8.ValidString(name) {
                t.Errorf("имя содержит невалидный UTF-8: %q", name)
            }
        }

        // Главное: функция не должна паниковать!
        // Если ParseName вызовет panic — фаззер это поймает автоматически
    })
}

// Фаззинг для функции валидации email
func FuzzValidateEmail(f *testing.F) {
    // Начальные значения
    f.Add("user@example.com")
    f.Add("invalid-email")
    f.Add("")
    f.Add("@")
    f.Add("user@")
    f.Add("@domain.com")
    f.Add("very.long.email." + strings.Repeat("x", 1000) + "@domain.com")

    f.Fuzz(func(t *testing.T, email string) {
        // Вызываем валидатор
        err := ValidateEmail(email)

        // Если email валиден — проверяем базовые свойства
        if err == nil {
            if !strings.Contains(email, "@") {
                t.Error("валидный email должен содержать @")
            }
            if len(email) == 0 {
                t.Error("валидный email не может быть пустым")
            }
        }
    })
}
```

### Запуск фаззинга

```bash
# Запуск фаззинга (будет работать непрерывно, пока не найдёт ошибку или не остановите)
go test -fuzz=FuzzParseName

# Запуск на определённое время
go test -fuzz=FuzzParseName -fuzztime=30s

# Запуск с указанием количества итераций
go test -fuzz=FuzzParseName -fuzztime=10000x

# Краши сохраняются в testdata/fuzz/FuzzParseName/
# Go автоматически создаст файл с входными данными, вызвавшими краш
```

### Структура testdata/fuzz

```
testdata/
  fuzz/
    FuzzParseName/
      corpus/                  # seed corpus (начальные значения)
      846af907f5a3b...        # файл с данными, вызвавшими краш
```

> [!TIP] Практические советы по фаззингу
> 1. Добавляйте разнообразные seed-значения через `f.Add()` — это ускоряет поиск багов.
> 2. Проверяйте **инварианты** — свойства, которые должны выполняться всегда.
> 3. Не проверяйте конкретные значения — проверяйте свойства (непустота, валидность UTF-8).
> 4. Найденные краши автоматически становятся тестами — они запустятся при обычном `go test`.

###### 🏠 Домашнее задание

1. Напишите функцию `ParseConfig(data []byte) (*Config, error)`, парсящую YAML.
2. Создайте фаззинг-тест `FuzzParseConfig` с разнообразными seed-значениями.
3. Запустите фаззинг на 1 минуту: `go test -fuzz=FuzzParseConfig -fuzztime=1m`.
4. Если найдены краши — исправьте функцию и перезапустите тесты.

---

## 9. Бенчмарки

Бенчмарки измеряют производительность кода. Go имеет встроенную поддержку бенчмаркинга в пакете `testing`.

```go
package benchmark

import (
    "fmt"
    "strings"
    "testing"
)

// ConcatWithPlus — конкатенация строк через +
func ConcatWithPlus(strs []string) string {
    result := ""
    for _, s := range strs {
        result += s // каждая операция создаёт новую строку!
    }
    return result
}

// ConcatWithBuilder — конкатенация через strings.Builder
func ConcatWithBuilder(strs []string) string {
    var builder strings.Builder
    for _, s := range strs {
        builder.WriteString(s) // пишет в буфер без аллокаций
    }
    return builder.String()
}

// ConcatWithJoin — конкатенация через strings.Join
func ConcatWithJoin(strs []string) string {
    return strings.Join(strs, "")
}

// Бенчмарк — имя ДОЛЖНО начинаться с Benchmark
func BenchmarkConcatWithPlus(b *testing.B) {
    strs := make([]string, 100)
    for i := range strs {
        strs[i] = fmt.Sprintf("строка_%d", i)
    }

    // b.ResetTimer() — сбрасываем таймер после подготовки данных
    // Время подготовки не будет учтено в результатах
    b.ResetTimer()

    // b.N — количество итераций, определяемое Go автоматически
    // Go подбирает N так, чтобы бенчмарк занял достаточно времени
    for i := 0; i < b.N; i++ {
        ConcatWithPlus(strs)
    }
}

func BenchmarkConcatWithBuilder(b *testing.B) {
    strs := make([]string, 100)
    for i := range strs {
        strs[i] = fmt.Sprintf("строка_%d", i)
    }

    b.ResetTimer()
    // b.ReportAllocs() — включает отчёт об аллокациях
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        ConcatWithBuilder(strs)
    }
}

func BenchmarkConcatWithJoin(b *testing.B) {
    strs := make([]string, 100)
    for i := range strs {
        strs[i] = fmt.Sprintf("строка_%d", i)
    }

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        ConcatWithJoin(strs)
    }
}

// Бенчмарк с подбенчмарками для разных размеров
func BenchmarkConcat(b *testing.B) {
    sizes := []int{10, 100, 1000}

    for _, size := range sizes {
        strs := make([]string, size)
        for i := range strs {
            strs[i] = "test"
        }

        b.Run(fmt.Sprintf("Plus_%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                ConcatWithPlus(strs)
            }
        })

        b.Run(fmt.Sprintf("Builder_%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                ConcatWithBuilder(strs)
            }
        })

        b.Run(fmt.Sprintf("Join_%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                ConcatWithJoin(strs)
            }
        })
    }
}

// Бенчмарк с b.StopTimer / b.StartTimer
func BenchmarkWithSetup(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Останавливаем таймер на время подготовки
        b.StopTimer()
        data := prepareTestData() // дорогая подготовка
        b.StartTimer()

        // Измеряем только эту часть
        processData(data)
    }
}
```

### Запуск бенчмарков

```bash
# Запуск всех бенчмарков в пакете
go test -bench=.

# Запуск с отчётом по памяти (-benchmem)
go test -bench=. -benchmem

# Запуск конкретного бенчмарка
go test -bench=BenchmarkConcatWithBuilder -benchmem

# Указание времени работы каждого бенчмарка
go test -bench=. -benchtime=5s

# Несколько прогонов для статистической достоверности
go test -bench=. -benchmem -count=5
```

### Чтение результатов

```
BenchmarkConcatWithPlus-8       5000      234567 ns/op    524288 B/op    99 allocs/op
BenchmarkConcatWithBuilder-8    200000     8901 ns/op      2048 B/op     4 allocs/op
BenchmarkConcatWithJoin-8       300000     5678 ns/op      1024 B/op     1 allocs/op
```

| Поле | Описание |
|------|----------|
| `-8` | Количество используемых CPU (GOMAXPROCS) |
| `5000` | Количество итераций (b.N) |
| `234567 ns/op` | Наносекунд на одну операцию |
| `524288 B/op` | Байт памяти на одну операцию |
| `99 allocs/op` | Аллокаций памяти на одну операцию |

> [!WARNING] Частые ошибки при бенчмаркинге
> 1. **Не используйте результат** — компилятор может оптимизировать вызов. Сохраняйте результат в переменную пакетного уровня.
> 2. **Включайте подготовку данных в замер** — используйте `b.ResetTimer()`.
> 3. **Одного прогона недостаточно** — используйте `-count=5` или больше.
> 4. **Закройте лишние программы** — фоновые процессы влияют на результаты.

```go
// Правильный способ предотвращения оптимизации компилятором
var benchResult string // переменная пакетного уровня

func BenchmarkConcatCorrect(b *testing.B) {
    strs := []string{"a", "b", "c"}
    var r string
    for i := 0; i < b.N; i++ {
        r = ConcatWithBuilder(strs)
    }
    benchResult = r // сохраняем результат, чтобы компилятор не удалил вызов
}
```

###### 🏠 Домашнее задание

1. Напишите бенчмарки для сравнения: `fmt.Sprintf` vs `strconv.Itoa` vs ручное преобразование числа в строку.
2. Запустите с `-benchmem` и проанализируйте аллокации.
3. Напишите бенчмарк с подбенчмарками для разных размеров слайса.
4. Сравните `map[string]struct{}` vs `map[string]bool` для проверки наличия элемента.

---

## 10. Покрытие кода

Покрытие кода (code coverage) показывает, какой процент кода выполняется при запуске тестов.

```bash
# Показать процент покрытия
go test -cover ./...

# Вывод:
# ok  myproject/user     0.5s  coverage: 78.3% of statements

# Сохранить профиль покрытия в файл
go test -coverprofile=coverage.out ./...

# Открыть HTML-отчёт в браузере
go tool cover -html=coverage.out

# Показать покрытие по функциям
go tool cover -func=coverage.out

# Покрытие с учётом нескольких пакетов
go test -coverprofile=coverage.out -coverpkg=./... ./...
```

### Пример вывода -func

```
myproject/user/service.go:15:    Create          100.0%
myproject/user/service.go:35:    GetByID         85.7%
myproject/user/service.go:52:    Update          60.0%
myproject/user/service.go:78:    Delete          0.0%
total:                           (statements)    62.5%
```

### Какой процент покрытия стремиться достичь

> [!INFO] Рекомендации по покрытию
> - **80%+** — хороший уровень для бизнес-логики
> - **90%+** — для критичного кода (финансы, авторизация)
> - **100%** — нереалистично и не нужно для всего проекта
> - **Не гонитесь за цифрой** — 80% осмысленных тестов лучше, чем 95% формальных

### Что исключать из покрытия

```go
// Сгенерированный код — не нужно покрывать
//go:generate mockgen ...

// Файлы с main() — обычно исключаются
// Код интеграции с внешними сервисами — тестируется отдельно
// Модели данных без логики — простые структуры

// Можно использовать build tags для исключения
//go:build !coverage
```

```bash
# Исключение конкретных пакетов при подсчёте покрытия
go test -coverprofile=coverage.out \
    -coverpkg=./internal/service/...,./internal/handler/... \
    ./...

# В CI/CD можно задать минимальный порог
go test -cover ./... | grep -E "coverage: [0-9.]+" | \
    awk '{if ($NF+0 < 80) exit 1}'
```

###### 🏠 Домашнее задание

1. Запустите `go test -cover ./...` для своего проекта.
2. Сгенерируйте HTML-отчёт и изучите, какие строки не покрыты.
3. Добавьте тесты для непокрытых путей.
4. Настройте в CI/CD проверку минимального покрытия (например, 75%).

---

## 11. Продвинутые паттерны

### t.Parallel() для параллельных тестов

```go
func TestParallel(t *testing.T) {
    tests := []struct {
        name  string
        input int
        want  int
    }{
        {"case1", 1, 2},
        {"case2", 2, 4},
        {"case3", 3, 6},
    }

    for _, tt := range tests {
        // ВАЖНО: создаём локальную копию переменной цикла
        // (В Go 1.22+ это не нужно, но для совместимости — лучше делать)
        tt := tt
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel() // помечаем подтест как параллельный

            // Эти подтесты будут выполняться одновременно
            result := Double(tt.input)
            if result != tt.want {
                t.Errorf("Double(%d) = %d; ожидалось %d",
                    tt.input, result, tt.want)
            }
        })
    }
}
```

> [!WARNING] Осторожно с параллельными тестами
> - Не используйте общие мутабельные данные между параллельными тестами
> - Каждый параллельный тест должен работать с собственными данными
> - Тесты с `t.Parallel()` ждут завершения родительского теста, потом запускаются вместе
> - Не используйте `t.Parallel()` с тестами, которые пишут в общую БД без изоляции

### TestMain для глобального setup/teardown

```go
package repository

import (
    "database/sql"
    "fmt"
    "os"
    "testing"
)

var testDB *sql.DB // глобальная переменная для всех тестов пакета

// TestMain — точка входа для ВСЕХ тестов пакета
// Вызывается ВМЕСТО обычного запуска тестов
func TestMain(m *testing.M) {
    // === SETUP === (выполняется перед всеми тестами)
    var err error
    testDB, err = sql.Open("postgres", os.Getenv("TEST_DATABASE_URL"))
    if err != nil {
        fmt.Fprintf(os.Stderr, "не удалось подключиться к БД: %v\n", err)
        os.Exit(1)
    }

    // Применяем миграции
    if err := runMigrations(testDB); err != nil {
        fmt.Fprintf(os.Stderr, "ошибка миграции: %v\n", err)
        os.Exit(1)
    }

    // === ЗАПУСК ТЕСТОВ ===
    code := m.Run() // запускаем все тесты; code — exit code

    // === TEARDOWN === (выполняется после всех тестов)
    testDB.Close()
    fmt.Println("тестовая БД закрыта")

    os.Exit(code)
}

// Теперь все тесты в пакете могут использовать testDB
func TestSomething(t *testing.T) {
    // testDB доступна здесь
    row := testDB.QueryRow("SELECT 1")
    var result int
    if err := row.Scan(&result); err != nil {
        t.Fatal(err)
    }
}
```

### Паттерн Golden Files

```go
package template

import (
    "flag"
    "os"
    "path/filepath"
    "testing"
)

// Флаг -update для обновления golden-файлов
var update = flag.Bool("update", false, "обновить golden-файлы")

func TestRenderTemplate(t *testing.T) {
    tests := []struct {
        name     string
        template string
        data     interface{}
    }{
        {
            name:     "simple",
            template: "Hello, {{.Name}}!",
            data:     map[string]string{"Name": "Мир"},
        },
        {
            name:     "list",
            template: "{{range .Items}}{{.}} {{end}}",
            data:     map[string][]string{"Items": {"a", "b", "c"}},
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Рендерим шаблон
            result := renderTemplate(tt.template, tt.data)

            // Путь к golden-файлу
            goldenPath := filepath.Join("testdata", tt.name+".golden")

            if *update {
                // Режим обновления: записываем результат в golden-файл
                err := os.MkdirAll("testdata", 0o755)
                if err != nil {
                    t.Fatal(err)
                }
                err = os.WriteFile(goldenPath, []byte(result), 0o644)
                if err != nil {
                    t.Fatal(err)
                }
                return
            }

            // Обычный режим: сравниваем с golden-файлом
            expected, err := os.ReadFile(goldenPath)
            if err != nil {
                t.Fatalf("не удалось прочитать golden-файл: %v\n"+
                    "Запустите с -update для создания: go test -run %s -update",
                    err, tt.name)
            }

            if result != string(expected) {
                t.Errorf("результат не совпадает с golden-файлом\n"+
                    "получено:\n%s\nожидалось:\n%s", result, string(expected))
            }
        })
    }
}
```

```bash
# Создание/обновление golden-файлов
go test -run TestRenderTemplate -update

# Обычный запуск — сравнение с golden-файлами
go test -run TestRenderTemplate
```

### Build tags для разделения тестов

```go
// Файл: service_unit_test.go
//go:build unit

package service
// ... юнит-тесты ...
```

```go
// Файл: service_integration_test.go
//go:build integration

package service
// ... интеграционные тесты ...
```

```go
// Файл: service_e2e_test.go
//go:build e2e

package service
// ... end-to-end тесты ...
```

```bash
# Запуск только юнит-тестов
go test -tags=unit ./...

# Запуск интеграционных
go test -tags=integration ./...

# Запуск всех
go test -tags="unit integration e2e" ./...
```

### t.Setenv (Go 1.17+)

```go
func TestWithEnv(t *testing.T) {
    // t.Setenv устанавливает переменную окружения ТОЛЬКО на время теста
    // После теста она автоматически восстанавливается
    t.Setenv("DATABASE_URL", "postgres://test:test@localhost/testdb")
    t.Setenv("APP_ENV", "test")

    // Используем переменные
    cfg := LoadConfig()
    if cfg.DatabaseURL != "postgres://test:test@localhost/testdb" {
        t.Errorf("неверный DATABASE_URL: %s", cfg.DatabaseURL)
    }
    if cfg.AppEnv != "test" {
        t.Errorf("неверный APP_ENV: %s", cfg.AppEnv)
    }
}
```

> [!NOTE] t.Setenv и t.Parallel()
> `t.Setenv` **нельзя** использовать вместе с `t.Parallel()` — это вызовет панику. Переменные окружения — глобальное состояние, и параллельное изменение небезопасно.

###### 🏠 Домашнее задание

1. Добавьте `t.Parallel()` к table-driven тестам из раздела 2.
2. Создайте `TestMain` с глобальной настройкой тестовой БД.
3. Реализуйте golden-file тест для генератора отчётов.
4. Разделите тесты на `unit` и `integration` с помощью build tags.
5. Используйте `t.Setenv` для тестирования конфигурации.

---

## 12. Полезные флаги go test

Полная справка по флагам команды `go test`. Также см. [[08-tools-and-ecosystem]] для инструментов экосистемы Go.

| Флаг | Описание | Пример |
|------|----------|--------|
| `-v` | Подробный вывод (verbose) | `go test -v` |
| `-run` | Запуск тестов по регулярному выражению | `go test -run TestUser` |
| `-bench` | Запуск бенчмарков по паттерну | `go test -bench=.` |
| `-benchmem` | Показывать аллокации в бенчмарках | `go test -bench=. -benchmem` |
| `-benchtime` | Время работы каждого бенчмарка | `go test -bench=. -benchtime=5s` |
| `-cover` | Показать процент покрытия | `go test -cover` |
| `-coverprofile` | Сохранить профиль покрытия | `go test -coverprofile=c.out` |
| `-coverpkg` | Пакеты для подсчёта покрытия | `go test -coverpkg=./...` |
| `-count` | Количество прогонов каждого теста | `go test -count=5` |
| `-race` | Детектор гонок данных (data race) | `go test -race` |
| `-short` | Короткий режим (пропуск долгих тестов) | `go test -short` |
| `-shuffle` | Случайный порядок тестов | `go test -shuffle=on` |
| `-timeout` | Таймаут для всех тестов | `go test -timeout=5m` |
| `-fuzz` | Запуск фаззинга | `go test -fuzz=FuzzXxx` |
| `-fuzztime` | Время работы фаззинга | `go test -fuzz=. -fuzztime=30s` |
| `-cpuprofile` | Профилирование CPU | `go test -cpuprofile=cpu.out` |
| `-memprofile` | Профилирование памяти | `go test -memprofile=mem.out` |
| `-tags` | Build tags для компиляции | `go test -tags=integration` |
| `-parallel` | Макс. параллельных тестов | `go test -parallel=4` |
| `-failfast` | Остановка при первой ошибке | `go test -failfast` |
| `-json` | JSON-вывод результатов | `go test -json` |
| `-list` | Список тестов по паттерну (без запуска) | `go test -list Test` |

### Примеры комбинаций

```bash
# Полный прогон: race detector + покрытие + verbose
go test -race -cover -v ./...

# CI/CD: детектор гонок, покрытие, таймаут
go test -race -coverprofile=coverage.out -timeout=5m ./...

# Отладка: один конкретный тест, подробно
go test -run "TestUserService_Register" -v -count=1

# Профилирование: бенчмарк с CPU и memory профилем
go test -bench=BenchmarkProcess -benchmem \
    -cpuprofile=cpu.out -memprofile=mem.out

# После профилирования — анализ
go tool pprof cpu.out
go tool pprof mem.out

# Перемешивание тестов для выявления скрытых зависимостей
go test -shuffle=on -v ./...

# Отключение кеширования тестов
go test -count=1 ./...
```

> [!TIP] Флаг -count=1
> По умолчанию Go кеширует результаты тестов. Если тесты не менялись — они не перезапускаются. `-count=1` отключает кеширование и гарантирует запуск.

###### 🏠 Домашнее задание

1. Запустите тесты с флагом `-race` и исправьте все обнаруженные гонки данных.
2. Запустите с `-shuffle=on` — убедитесь, что порядок тестов не влияет на результат.
3. Настройте CI/CD pipeline с командой: `go test -race -cover -timeout=5m -count=1 ./...`.
4. Создайте CPU-профиль бенчмарка и проанализируйте его через `go tool pprof`.

---

## 13. Сквозной проект: тесты для Todo-приложения

Применим все изученные техники для тестирования полноценного Todo-приложения. Здесь мы объединяем знания из [[01-basics]], [[03-networking]] и [[04-databases]].

### Модели и интерфейсы

```go
// Файл: internal/model/todo.go
package model

import "time"

// Todo — модель задачи
type Todo struct {
    ID          int64     `json:"id" db:"id"`
    Title       string    `json:"title" db:"title"`
    Description string    `json:"description" db:"description"`
    Completed   bool      `json:"completed" db:"completed"`
    Priority    int       `json:"priority" db:"priority"` // 1=низкий, 2=средний, 3=высокий
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreateTodoRequest — запрос на создание задачи
type CreateTodoRequest struct {
    Title       string `json:"title"`
    Description string `json:"description"`
    Priority    int    `json:"priority"`
}

// Validate проверяет корректность запроса
func (r *CreateTodoRequest) Validate() error {
    if r.Title == "" {
        return fmt.Errorf("название задачи обязательно")
    }
    if len(r.Title) > 200 {
        return fmt.Errorf("название задачи слишком длинное (макс. 200 символов)")
    }
    if r.Priority < 0 || r.Priority > 3 {
        return fmt.Errorf("приоритет должен быть от 0 до 3")
    }
    return nil
}
```

```go
// Файл: internal/repository/repository.go
package repository

import "context"

// TodoRepository — интерфейс репозитория задач
type TodoRepository interface {
    Create(ctx context.Context, todo *model.Todo) error
    FindByID(ctx context.Context, id int64) (*model.Todo, error)
    List(ctx context.Context, limit, offset int) ([]*model.Todo, error)
    Update(ctx context.Context, todo *model.Todo) error
    Delete(ctx context.Context, id int64) error
    MarkCompleted(ctx context.Context, id int64) error
}
```

### Unit-тесты для сервисного слоя

```go
// Файл: internal/service/todo_service_test.go
package service

import (
    "context"
    "fmt"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "myproject/internal/model"
)

// --- Ручной мок репозитория ---

type mockTodoRepository struct {
    createFn        func(ctx context.Context, todo *model.Todo) error
    findByIDFn      func(ctx context.Context, id int64) (*model.Todo, error)
    listFn          func(ctx context.Context, limit, offset int) ([]*model.Todo, error)
    updateFn        func(ctx context.Context, todo *model.Todo) error
    deleteFn        func(ctx context.Context, id int64) error
    markCompletedFn func(ctx context.Context, id int64) error
}

func (m *mockTodoRepository) Create(ctx context.Context, todo *model.Todo) error {
    if m.createFn != nil {
        return m.createFn(ctx, todo)
    }
    return nil
}

func (m *mockTodoRepository) FindByID(ctx context.Context, id int64) (*model.Todo, error) {
    if m.findByIDFn != nil {
        return m.findByIDFn(ctx, id)
    }
    return nil, fmt.Errorf("не найдено")
}

func (m *mockTodoRepository) List(ctx context.Context, limit, offset int) ([]*model.Todo, error) {
    if m.listFn != nil {
        return m.listFn(ctx, limit, offset)
    }
    return nil, nil
}

func (m *mockTodoRepository) Update(ctx context.Context, todo *model.Todo) error {
    if m.updateFn != nil {
        return m.updateFn(ctx, todo)
    }
    return nil
}

func (m *mockTodoRepository) Delete(ctx context.Context, id int64) error {
    if m.deleteFn != nil {
        return m.deleteFn(ctx, id)
    }
    return nil
}

func (m *mockTodoRepository) MarkCompleted(ctx context.Context, id int64) error {
    if m.markCompletedFn != nil {
        return m.markCompletedFn(ctx, id)
    }
    return nil
}

// --- Тесты сервиса ---

func TestTodoService_Create(t *testing.T) {
    tests := []struct {
        name      string
        req       model.CreateTodoRequest
        setupMock func(*mockTodoRepository)
        wantErr   bool
        errMsg    string
    }{
        {
            name: "успешное создание",
            req: model.CreateTodoRequest{
                Title:       "Купить продукты",
                Description: "Молоко, хлеб, яйца",
                Priority:    2,
            },
            setupMock: func(m *mockTodoRepository) {
                m.createFn = func(ctx context.Context, todo *model.Todo) error {
                    todo.ID = 1
                    todo.CreatedAt = time.Now()
                    todo.UpdatedAt = time.Now()
                    return nil
                }
            },
            wantErr: false,
        },
        {
            name: "пустое название",
            req: model.CreateTodoRequest{
                Title:    "",
                Priority: 1,
            },
            wantErr: true,
            errMsg:  "название задачи обязательно",
        },
        {
            name: "слишком длинное название",
            req: model.CreateTodoRequest{
                Title:    string(make([]byte, 201)), // 201 символ
                Priority: 1,
            },
            wantErr: true,
            errMsg:  "слишком длинное",
        },
        {
            name: "невалидный приоритет",
            req: model.CreateTodoRequest{
                Title:    "Тест",
                Priority: 5,
            },
            wantErr: true,
            errMsg:  "приоритет",
        },
        {
            name: "ошибка базы данных",
            req: model.CreateTodoRequest{
                Title:    "Тест",
                Priority: 1,
            },
            setupMock: func(m *mockTodoRepository) {
                m.createFn = func(ctx context.Context, todo *model.Todo) error {
                    return fmt.Errorf("ошибка подключения к БД")
                }
            },
            wantErr: true,
            errMsg:  "ошибка подключения",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Настраиваем мок
            mock := &mockTodoRepository{}
            if tt.setupMock != nil {
                tt.setupMock(mock)
            }

            // Создаём сервис
            svc := NewTodoService(mock)

            // Вызываем метод
            todo, err := svc.Create(context.Background(), tt.req)

            if tt.wantErr {
                assert.Error(t, err)
                if tt.errMsg != "" {
                    assert.Contains(t, err.Error(), tt.errMsg)
                }
                assert.Nil(t, todo)
            } else {
                require.NoError(t, err)
                require.NotNil(t, todo)
                assert.Equal(t, tt.req.Title, todo.Title)
                assert.Equal(t, tt.req.Description, todo.Description)
                assert.Equal(t, tt.req.Priority, todo.Priority)
                assert.False(t, todo.Completed)
                assert.NotZero(t, todo.ID)
            }
        })
    }
}

func TestTodoService_MarkCompleted(t *testing.T) {
    t.Run("успешное завершение", func(t *testing.T) {
        mock := &mockTodoRepository{
            findByIDFn: func(ctx context.Context, id int64) (*model.Todo, error) {
                return &model.Todo{ID: id, Title: "Тест", Completed: false}, nil
            },
            markCompletedFn: func(ctx context.Context, id int64) error {
                return nil
            },
        }

        svc := NewTodoService(mock)
        err := svc.MarkCompleted(context.Background(), 1)
        assert.NoError(t, err)
    })

    t.Run("задача уже завершена", func(t *testing.T) {
        mock := &mockTodoRepository{
            findByIDFn: func(ctx context.Context, id int64) (*model.Todo, error) {
                return &model.Todo{ID: id, Title: "Тест", Completed: true}, nil
            },
        }

        svc := NewTodoService(mock)
        err := svc.MarkCompleted(context.Background(), 1)
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "уже завершена")
    })

    t.Run("задача не найдена", func(t *testing.T) {
        mock := &mockTodoRepository{
            findByIDFn: func(ctx context.Context, id int64) (*model.Todo, error) {
                return nil, fmt.Errorf("не найдено")
            },
        }

        svc := NewTodoService(mock)
        err := svc.MarkCompleted(context.Background(), 999)
        assert.Error(t, err)
    })
}
```

### Интеграционные тесты с testcontainers

```go
// Файл: internal/repository/postgres/todo_repository_integration_test.go
//go:build integration

package postgres

import (
    "context"
    "database/sql"
    "testing"
    "time"

    _ "github.com/lib/pq"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
    "github.com/testcontainers/testcontainers-go/wait"

    "myproject/internal/model"
)

func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    ctx := context.Background()

    pgContainer, err := postgres.Run(ctx,
        "postgres:16-alpine",
        postgres.WithDatabase("todo_test"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
        testcontainers.WithWaitStrategy(
            wait.ForLog("database system is ready to accept connections").
                WithOccurrence(2).
                WithStartupTimeout(30*time.Second),
        ),
    )
    require.NoError(t, err)

    t.Cleanup(func() {
        pgContainer.Terminate(ctx)
    })

    connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
    require.NoError(t, err)

    db, err := sql.Open("postgres", connStr)
    require.NoError(t, err)
    require.NoError(t, db.Ping())

    // Создаём схему
    _, err = db.Exec(`
        CREATE TABLE todos (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT DEFAULT '',
            completed BOOLEAN DEFAULT FALSE,
            priority INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `)
    require.NoError(t, err)

    t.Cleanup(func() { db.Close() })

    return db
}

func TestTodoRepository_Integration_CRUD(t *testing.T) {
    if testing.Short() {
        t.Skip("пропускаем интеграционный тест")
    }

    db := setupTestDB(t)
    repo := NewTodoRepository(db)
    ctx := context.Background()

    // CREATE
    todo := &model.Todo{
        Title:       "Интеграционный тест",
        Description: "Проверяем работу с реальной БД",
        Priority:    2,
    }
    err := repo.Create(ctx, todo)
    require.NoError(t, err)
    assert.NotZero(t, todo.ID)
    t.Logf("создана задача с ID: %d", todo.ID)

    // READ
    found, err := repo.FindByID(ctx, todo.ID)
    require.NoError(t, err)
    assert.Equal(t, todo.Title, found.Title)
    assert.Equal(t, todo.Description, found.Description)
    assert.Equal(t, todo.Priority, found.Priority)
    assert.False(t, found.Completed)

    // UPDATE
    found.Title = "Обновлённый тест"
    found.Priority = 3
    err = repo.Update(ctx, found)
    require.NoError(t, err)

    updated, err := repo.FindByID(ctx, found.ID)
    require.NoError(t, err)
    assert.Equal(t, "Обновлённый тест", updated.Title)
    assert.Equal(t, 3, updated.Priority)

    // MARK COMPLETED
    err = repo.MarkCompleted(ctx, todo.ID)
    require.NoError(t, err)

    completed, err := repo.FindByID(ctx, todo.ID)
    require.NoError(t, err)
    assert.True(t, completed.Completed)

    // LIST
    // Создаём ещё несколько задач
    for i := 0; i < 5; i++ {
        err := repo.Create(ctx, &model.Todo{
            Title:    fmt.Sprintf("Задача %d", i+1),
            Priority: i % 3,
        })
        require.NoError(t, err)
    }

    todos, err := repo.List(ctx, 10, 0)
    require.NoError(t, err)
    assert.GreaterOrEqual(t, len(todos), 6) // 1 + 5 = 6

    // LIST с пагинацией
    page, err := repo.List(ctx, 3, 0) // первые 3
    require.NoError(t, err)
    assert.Len(t, page, 3)

    // DELETE
    err = repo.Delete(ctx, todo.ID)
    require.NoError(t, err)

    _, err = repo.FindByID(ctx, todo.ID)
    assert.Error(t, err, "задача должна быть удалена")
}
```

### HTTP handler тесты

```go
// Файл: internal/handler/todo_handler_test.go
package handler

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "myproject/internal/model"
)

// mockTodoService — мок сервиса для тестирования обработчиков
type mockTodoService struct {
    createFn        func(ctx context.Context, req model.CreateTodoRequest) (*model.Todo, error)
    getByIDFn       func(ctx context.Context, id int64) (*model.Todo, error)
    listFn          func(ctx context.Context, limit, offset int) ([]*model.Todo, error)
    markCompletedFn func(ctx context.Context, id int64) error
    deleteFn        func(ctx context.Context, id int64) error
}

func (m *mockTodoService) Create(ctx context.Context, req model.CreateTodoRequest) (*model.Todo, error) {
    if m.createFn != nil {
        return m.createFn(ctx, req)
    }
    return nil, fmt.Errorf("не реализовано")
}

func (m *mockTodoService) GetByID(ctx context.Context, id int64) (*model.Todo, error) {
    if m.getByIDFn != nil {
        return m.getByIDFn(ctx, id)
    }
    return nil, fmt.Errorf("не найдено")
}

func (m *mockTodoService) List(ctx context.Context, limit, offset int) ([]*model.Todo, error) {
    if m.listFn != nil {
        return m.listFn(ctx, limit, offset)
    }
    return nil, nil
}

func (m *mockTodoService) MarkCompleted(ctx context.Context, id int64) error {
    if m.markCompletedFn != nil {
        return m.markCompletedFn(ctx, id)
    }
    return nil
}

func (m *mockTodoService) Delete(ctx context.Context, id int64) error {
    if m.deleteFn != nil {
        return m.deleteFn(ctx, id)
    }
    return nil
}

// --- Тесты обработчиков ---

func TestTodoHandler_Create(t *testing.T) {
    tests := []struct {
        name       string
        body       interface{}
        setupMock  func(*mockTodoService)
        wantStatus int
        wantBody   map[string]interface{}
    }{
        {
            name: "успешное создание",
            body: model.CreateTodoRequest{
                Title:       "Новая задача",
                Description: "Описание",
                Priority:    2,
            },
            setupMock: func(m *mockTodoService) {
                m.createFn = func(ctx context.Context, req model.CreateTodoRequest) (*model.Todo, error) {
                    return &model.Todo{
                        ID:          1,
                        Title:       req.Title,
                        Description: req.Description,
                        Priority:    req.Priority,
                    }, nil
                }
            },
            wantStatus: http.StatusCreated,
        },
        {
            name:       "невалидный JSON",
            body:       "это не json",
            wantStatus: http.StatusBadRequest,
        },
        {
            name: "ошибка сервиса",
            body: model.CreateTodoRequest{
                Title:    "Тест",
                Priority: 1,
            },
            setupMock: func(m *mockTodoService) {
                m.createFn = func(ctx context.Context, req model.CreateTodoRequest) (*model.Todo, error) {
                    return nil, fmt.Errorf("ошибка валидации: название задачи обязательно")
                }
            },
            wantStatus: http.StatusBadRequest,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            mock := &mockTodoService{}
            if tt.setupMock != nil {
                tt.setupMock(mock)
            }
            handler := NewTodoHandler(mock)

            // Формируем тело запроса
            var bodyBytes []byte
            switch v := tt.body.(type) {
            case string:
                bodyBytes = []byte(v)
            default:
                var err error
                bodyBytes, err = json.Marshal(v)
                require.NoError(t, err)
            }

            req := httptest.NewRequest(http.MethodPost, "/todos",
                bytes.NewReader(bodyBytes))
            req.Header.Set("Content-Type", "application/json")
            rec := httptest.NewRecorder()

            handler.Create(rec, req)

            assert.Equal(t, tt.wantStatus, rec.Code)

            if tt.wantStatus == http.StatusCreated {
                var todo model.Todo
                err := json.NewDecoder(rec.Body).Decode(&todo)
                require.NoError(t, err)
                assert.NotZero(t, todo.ID)
                assert.Equal(t, "Новая задача", todo.Title)
            }
        })
    }
}

func TestTodoHandler_List(t *testing.T) {
    mock := &mockTodoService{
        listFn: func(ctx context.Context, limit, offset int) ([]*model.Todo, error) {
            return []*model.Todo{
                {ID: 1, Title: "Задача 1", Priority: 1},
                {ID: 2, Title: "Задача 2", Priority: 2},
                {ID: 3, Title: "Задача 3", Priority: 3},
            }, nil
        },
    }
    handler := NewTodoHandler(mock)

    req := httptest.NewRequest(http.MethodGet, "/todos?limit=10&offset=0", nil)
    rec := httptest.NewRecorder()

    handler.List(rec, req)

    assert.Equal(t, http.StatusOK, rec.Code)

    var todos []*model.Todo
    err := json.NewDecoder(rec.Body).Decode(&todos)
    require.NoError(t, err)
    assert.Len(t, todos, 3)
    assert.Equal(t, "Задача 1", todos[0].Title)
    assert.Equal(t, "Задача 3", todos[2].Title)
}

func TestTodoHandler_GetByID(t *testing.T) {
    t.Run("найдена", func(t *testing.T) {
        mock := &mockTodoService{
            getByIDFn: func(ctx context.Context, id int64) (*model.Todo, error) {
                return &model.Todo{ID: id, Title: "Тестовая задача"}, nil
            },
        }
        handler := NewTodoHandler(mock)

        req := httptest.NewRequest(http.MethodGet, "/todos/1", nil)
        req.SetPathValue("id", "1")
        rec := httptest.NewRecorder()

        handler.GetByID(rec, req)

        assert.Equal(t, http.StatusOK, rec.Code)

        var todo model.Todo
        err := json.NewDecoder(rec.Body).Decode(&todo)
        require.NoError(t, err)
        assert.Equal(t, "Тестовая задача", todo.Title)
    })

    t.Run("не найдена", func(t *testing.T) {
        mock := &mockTodoService{
            getByIDFn: func(ctx context.Context, id int64) (*model.Todo, error) {
                return nil, fmt.Errorf("задача не найдена")
            },
        }
        handler := NewTodoHandler(mock)

        req := httptest.NewRequest(http.MethodGet, "/todos/999", nil)
        req.SetPathValue("id", "999")
        rec := httptest.NewRecorder()

        handler.GetByID(rec, req)

        assert.Equal(t, http.StatusNotFound, rec.Code)
    })
}
```

### Table-driven тесты для валидации

```go
// Файл: internal/model/todo_test.go
package model

import (
    "strings"
    "testing"

    "github.com/stretchr/testify/assert"
)

func TestCreateTodoRequest_Validate(t *testing.T) {
    tests := []struct {
        name    string
        req     CreateTodoRequest
        wantErr bool
        errMsg  string
    }{
        {
            name:    "валидный запрос",
            req:     CreateTodoRequest{Title: "Задача", Priority: 2},
            wantErr: false,
        },
        {
            name:    "пустое название",
            req:     CreateTodoRequest{Title: "", Priority: 1},
            wantErr: true,
            errMsg:  "название задачи обязательно",
        },
        {
            name: "слишком длинное название",
            req: CreateTodoRequest{
                Title:    strings.Repeat("а", 201),
                Priority: 1,
            },
            wantErr: true,
            errMsg:  "слишком длинное",
        },
        {
            name:    "название ровно 200 символов — ОК",
            req:     CreateTodoRequest{Title: strings.Repeat("а", 200), Priority: 1},
            wantErr: false,
        },
        {
            name:    "приоритет 0 — ОК",
            req:     CreateTodoRequest{Title: "Тест", Priority: 0},
            wantErr: false,
        },
        {
            name:    "приоритет 3 — ОК",
            req:     CreateTodoRequest{Title: "Тест", Priority: 3},
            wantErr: false,
        },
        {
            name:    "приоритет отрицательный",
            req:     CreateTodoRequest{Title: "Тест", Priority: -1},
            wantErr: true,
            errMsg:  "приоритет",
        },
        {
            name:    "приоритет больше 3",
            req:     CreateTodoRequest{Title: "Тест", Priority: 4},
            wantErr: true,
            errMsg:  "приоритет",
        },
        {
            name:    "только пробелы в названии",
            req:     CreateTodoRequest{Title: "   Задача   ", Priority: 1},
            wantErr: false, // пробелы допустимы
        },
        {
            name:    "Unicode в названии",
            req:     CreateTodoRequest{Title: "Задача 日本語 🎉", Priority: 1},
            wantErr: false,
        },
        {
            name: "описание без названия",
            req: CreateTodoRequest{
                Title:       "",
                Description: "Есть описание, но нет названия",
                Priority:    1,
            },
            wantErr: true,
            errMsg:  "название задачи обязательно",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := tt.req.Validate()

            if tt.wantErr {
                assert.Error(t, err)
                if tt.errMsg != "" {
                    assert.Contains(t, err.Error(), tt.errMsg)
                }
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### Бенчмарк для горячего пути

```go
// Файл: internal/model/todo_bench_test.go
package model

import (
    "fmt"
    "testing"
)

// Бенчмарк валидации — горячий путь, вызывается на каждый запрос
func BenchmarkCreateTodoRequest_Validate(b *testing.B) {
    req := CreateTodoRequest{
        Title:       "Купить продукты",
        Description: "Молоко, хлеб, яйца, масло",
        Priority:    2,
    }

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        req.Validate()
    }
}

// Бенчмарк с разными размерами
func BenchmarkCreateTodoRequest_Validate_Sizes(b *testing.B) {
    sizes := []int{10, 50, 100, 200}

    for _, size := range sizes {
        b.Run(fmt.Sprintf("title_%d_chars", size), func(b *testing.B) {
            req := CreateTodoRequest{
                Title:    string(make([]byte, size)),
                Priority: 1,
            }

            b.ResetTimer()
            b.ReportAllocs()

            for i := 0; i < b.N; i++ {
                req.Validate()
            }
        })
    }
}

// Бенчмарк сериализации Todo в JSON
func BenchmarkTodo_JSON_Marshal(b *testing.B) {
    todo := &Todo{
        ID:          1,
        Title:       "Бенчмарк задача",
        Description: "Описание для бенчмарка сериализации",
        Completed:   false,
        Priority:    2,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        json.Marshal(todo)
    }
}

// Бенчмарк десериализации JSON в Todo
func BenchmarkTodo_JSON_Unmarshal(b *testing.B) {
    data := []byte(`{
        "id": 1,
        "title": "Бенчмарк задача",
        "description": "Описание",
        "completed": false,
        "priority": 2,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }`)

    b.ResetTimer()
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var todo Todo
        json.Unmarshal(data, &todo)
    }
}
```

### Запуск всех тестов проекта

```bash
# Юнит-тесты
go test -v -race -cover ./internal/...

# Интеграционные тесты (нужен Docker)
go test -v -tags=integration -timeout=5m ./internal/repository/...

# Бенчмарки
go test -bench=. -benchmem ./internal/model/...

# Полный прогон в CI/CD
go test -v -race -cover -coverprofile=coverage.out -timeout=5m ./...
go tool cover -func=coverage.out

# Фаззинг валидации
go test -fuzz=FuzzCreateTodoRequest_Validate -fuzztime=30s ./internal/model/...
```

> [!summary] Итоги раздела
> В сквозном проекте мы использовали:
> - **Ручные моки** для изоляции сервисного слоя от БД
> - **Table-driven тесты** для валидации и обработчиков
> - **testcontainers** для интеграционных тестов с PostgreSQL
> - **httptest** для тестирования HTTP-обработчиков
> - **Бенчмарки** для проверки производительности горячего пути
> - **testify** (assert/require) для читаемых проверок

###### 🏠 Домашнее задание

1. Расширьте Todo-приложение: добавьте поле `DueDate` (срок выполнения) и напишите тесты для валидации дат.
2. Добавьте фаззинг-тест `FuzzCreateTodoRequest_Validate`.
3. Напишите интеграционный тест для `List` с фильтрацией по приоритету.
4. Добавьте тест middleware для логирования запросов.
5. Достигните покрытия 80%+ для пакетов `service` и `handler`.
6. Настройте CI/CD pipeline: `go test -race -cover -count=1 -timeout=5m ./...`.

---

> [!NOTE] Что дальше
> В следующей главе [[08-tools-and-ecosystem]] мы рассмотрим инструменты экосистемы Go: линтеры, форматирование кода, управление зависимостями и полезные утилиты для разработки.
