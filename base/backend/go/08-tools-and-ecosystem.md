---
tags:
  - backend
  - golang
  - go
  - tools
  - ecosystem
  - linting
  - profiling
---

# Инструменты и экосистема

Go изначально проектировался не просто как язык, а как полная инструментальная среда. Утилиты форматирования, тестирования, профилирования и сборки идут в комплекте. Это глава о том, как эффективно использовать инструменты Go-экосистемы для промышленной разработки.

> [!info] Предпосылки
> Предполагается, что вы уже знакомы с основами Go из [[01-basics]] и написанием тестов из [[07-testing]]. Знание командной строки и базовые навыки работы с Git обязательны.

---

## 1. Форматирование кода

В Go нет споров о стиле кода. Форматирование стандартизировано на уровне инструментов.

### go fmt

`go fmt` -- встроенный форматтер, задающий единый стиль для всего Go-кода в мире:

```bash
# Форматирование одного файла
go fmt main.go

# Форматирование всего проекта
go fmt ./...

# Посмотреть diff без изменения файлов
gofmt -d .
```

`go fmt` -- обёртка над `gofmt`. Он применяет единственный набор правил: табуляция для отступов, определённое расположение скобок, пробелы вокруг операторов. Никаких настроек -- это принципиальное решение.

### gofumpt

`gofumpt` -- строгая версия `gofmt` от Daniel Martian. Добавляет правила, которые стандартный форматтер не покрывает:

```bash
# Установка
go install mvdan.cc/gofumpt@latest

# Запуск
gofumpt -w .
```

Дополнительные правила `gofumpt`:

- Пустая строка в начале функции удаляется
- Пустая строка перед `}` удаляется
- Лишние пустые строки между объявлениями схлопываются
- Составные литералы на одной строке, если помещаются
- Группировка объявлений `var`/`const` не разрывается пустыми строками

### goimports

`goimports` -- расширение `gofmt`, которое автоматически управляет блоком импортов:

```bash
# Установка
go install golang.org/x/tools/cmd/goimports@latest

# Запуск с группировкой по локальному модулю
goimports -w -local github.com/mycompany/myproject .
```

Правильная группировка импортов -- три группы, разделённые пустой строкой:

```go
import (
	// Стандартная библиотека
	"context"
	"fmt"
	"net/http"

	// Внешние зависимости
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"

	// Локальные пакеты проекта
	"github.com/mycompany/myproject/internal/handler"
	"github.com/mycompany/myproject/internal/service"
)
```

Флаг `-local` задаёт префикс для третьей группы. Без него `goimports` разделяет только stdlib и всё остальное.

### Настройка VS Code

Для автоматического форматирования при сохранении добавьте в `.vscode/settings.json`:

```json
{
  "go.formatTool": "goimports",
  "go.formatFlags": ["-local", "github.com/mycompany/myproject"],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "[go]": {
    "editor.defaultFormatter": "golang.go",
    "editor.tabSize": 4,
    "editor.insertSpaces": false
  },
  "gopls": {
    "formatting.gofumpt": true
  }
}
```

> [!tip] Совет
> Включение `gofumpt` через `gopls` позволяет использовать строгое форматирование прямо в IDE без отдельного запуска утилиты.

###### 🏠 Домашнее задание

1. Установите `gofumpt` и `goimports`. Отформатируйте свой проект обоими инструментами и сравните результат с `go fmt`.
2. Настройте VS Code для автоматического форматирования с группировкой импортов. Создайте файл с перемешанными импортами и убедитесь, что при сохранении они группируются правильно.
3. Создайте git pre-commit hook, который запускает `gofumpt -d .` и не позволяет коммитить неотформатированный код.

---

## 2. golangci-lint

`golangci-lint` -- агрегатор линтеров для Go. Вместо запуска десятков отдельных утилит, он управляет ими через единый конфигурационный файл, кеширует результаты и выполняет анализ параллельно.

### Установка и запуск

```bash
# Установка (рекомендуемый способ)
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.62.0

# Или через go install (менее предпочтительно, так как компиляция из исходников)
go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.62.0

# Проверка версии
golangci-lint --version

# Запуск на всём проекте
golangci-lint run ./...

# Запуск с автоисправлением (где возможно)
golangci-lint run --fix ./...

# Запуск с подробным выводом
golangci-lint run -v ./...

# Запуск только определённых линтеров
golangci-lint run --enable errcheck,govet ./...
```

### Конфигурация .golangci.yml

Полный пример конфигурации для продакшен-проекта:

```yaml
# .golangci.yml
run:
  # Таймаут на анализ (увеличьте для больших проектов)
  timeout: 5m
  # Пропустить тестовые файлы
  tests: false
  # Пропустить сгенерированные файлы
  skip-files:
    - ".*_gen\\.go$"
    - ".*_mock\\.go$"

linters:
  # Отключить все линтеры по умолчанию
  disable-all: true
  # Включить только нужные
  enable:
    # Обязательные (уровень: критический)
    - errcheck       # Необработанные ошибки
    - govet          # Подозрительные конструкции
    - staticcheck    # Комплексный статический анализ
    - unused         # Неиспользуемый код
    - gosimple       # Упрощение кода
    - ineffassign    # Неэффективные присваивания
    - typecheck      # Проверка типов

    # Рекомендуемые (уровень: важный)
    - revive         # Замена golint, расширяемый линтер стиля
    - gocritic       # Продвинутые проверки кода
    - misspell       # Орфографические ошибки в комментариях и строках
    - errorlint      # Правильное использование errors.Is/As
    - wrapcheck      # Оборачивание ошибок из внешних пакетов

    # Безопасность
    - gosec          # Проверки безопасности

    # Производительность
    - prealloc       # Предварительное выделение слайсов
    - bodyclose      # Закрытие resp.Body в HTTP-клиентах
    - noctx          # Отсутствие context в HTTP-запросах

linters-settings:
  revive:
    rules:
      - name: exported
        severity: warning
      - name: unexported-return
        severity: warning
      - name: indent-error-flow
        severity: warning
      - name: error-naming
        severity: warning

  gocritic:
    enabled-tags:
      - diagnostic
      - style
      - performance
    disabled-checks:
      - hugeParam  # Иногда передача больших структур по значению оправдана

  errcheck:
    # Проверять ошибки при type assertion
    check-type-assertions: true
    # Проверять ошибки из функций, присвоенных _ (blank identifier)
    check-blank: true

  govet:
    enable-all: true
    disable:
      - fieldalignment  # Слишком педантично для большинства проектов

  staticcheck:
    checks:
      - "all"
      - "-SA1019"  # Отключить предупреждения о deprecated (если нужно)

  gosec:
    excludes:
      - G104  # Необработанные ошибки (уже покрыто errcheck)

  misspell:
    locale: US

issues:
  # Показывать все найденные проблемы (по умолчанию лимит 50)
  max-issues-per-linter: 0
  max-same-issues: 0

  # Исключения для тестовых файлов
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck    # В тестах допустимо игнорировать ошибки
        - gosec       # Тесты не нуждаются в проверках безопасности
        - wrapcheck   # В тестах не обязательно оборачивать ошибки
        - gocritic

    # Исключить сгенерированный код
    - path: ".*_gen\\.go"
      linters:
        - revive
        - gocritic
        - errcheck

  # Директории для исключения
  exclude-dirs:
    - vendor
    - third_party
    - testdata
    - docs
```

### Ключевые линтеры подробно

#### errcheck -- необработанные ошибки

Самый важный линтер. Находит вызовы функций, возвращающих ошибку, которую вы проигнорировали:

```go
// ПЛОХО: ошибка при записи в файл проигнорирована
f, _ := os.Create("data.txt")
f.Write([]byte("данные")) // errcheck: ошибка не проверена
f.Close()                 // errcheck: ошибка не проверена

// ХОРОШО: все ошибки обработаны
f, err := os.Create("data.txt")
if err != nil {
    return fmt.Errorf("создание файла: %w", err)
}
defer func() {
    if closeErr := f.Close(); closeErr != nil {
        log.Printf("ошибка закрытия файла: %v", closeErr)
    }
}()

if _, err := f.Write([]byte("данные")); err != nil {
    return fmt.Errorf("запись в файл: %w", err)
}
```

#### govet -- подозрительные конструкции

Встроенный в Go анализатор. Находит ошибки, которые компилятор пропускает:

```go
// ПЛОХО: неверный формат в printf (govet: Printf format %d has arg of wrong type)
fmt.Printf("имя: %d\n", "Иван")

// ПЛОХО: копирование мьютекса (govet: copylocks)
type Cache struct {
    mu sync.Mutex
    data map[string]string
}

func process(c Cache) { // govet: передача Cache по значению копирует мьютекс
    c.mu.Lock()
    defer c.mu.Unlock()
}

// ХОРОШО: передача по указателю
func process(c *Cache) {
    c.mu.Lock()
    defer c.mu.Unlock()
}
```

#### staticcheck -- комплексный анализ

Самый мощный линтер. Включает сотни проверок:

```go
// SA1012: передача nil context (staticcheck)
req, _ := http.NewRequest("GET", url, nil) // нет контекста

// SA4006: значение переменной никогда не используется после присваивания
x := computeValue()
x = 42 // staticcheck: предыдущее значение x никогда не использовалось

// S1002: упрощение bool-сравнения (gosimple)
if isReady == true { // можно упростить до: if isReady {
}

// S1039: ненужный вызов fmt.Sprintf
fmt.Sprintf("%s", someString) // можно просто использовать someString
```

#### revive -- замена golint

Расширяемый линтер стиля с настраиваемыми правилами:

```go
// exported: экспортируемая функция без документации
func ProcessOrder(o *Order) error { // revive: exported function ProcessOrder should have comment
    // ...
}

// indent-error-flow: ранний возврат предпочтительнее
func validate(s string) error {
    // ПЛОХО
    if len(s) > 0 {
        // длинная логика
        return nil
    } else {
        return errors.New("пустая строка")
    }

    // ХОРОШО (ранний возврат)
    if len(s) == 0 {
        return errors.New("пустая строка")
    }
    // основная логика
    return nil
}
```

#### gocritic -- продвинутые проверки

Линтер с обширным набором проверок, разделённых на категории:

```go
// diagnostic: appendAssign -- подозрительное присваивание при append
// (если забыли присвоить результат обратно)
data := []int{1, 2, 3}
append(data, 4) // gocritic: результат append не присвоен

// style: ifElseChain -- цепочка if-else может быть switch
if x == 1 {
    // ...
} else if x == 2 {
    // ...
} else if x == 3 {
    // ...
}
// gocritic: рекомендуется switch

// performance: rangeValCopy -- копирование большой структуры в range
type Big struct {
    Data [1024]byte
}
items := []Big{{}, {}}
for _, item := range items { // gocritic: копирует 1024 байта на каждой итерации
    _ = item
}
// Исправление: for i := range items { _ = items[i] }
```

#### gosec -- безопасность

Находит потенциальные уязвимости:

```go
// G101: захардкоженные учётные данные
const password = "super_secret_123" // gosec: hardcoded credentials

// G201: SQL-инъекция
query := fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", userInput) // gosec!
db.Query(query)

// ХОРОШО: параметризованный запрос
db.Query("SELECT * FROM users WHERE name = $1", userInput)

// G304: чтение файла из пользовательского ввода
filePath := r.URL.Query().Get("file")
data, _ := os.ReadFile(filePath) // gosec: path traversal

// G401: использование слабого хеширования
h := md5.New() // gosec: use of weak cryptographic primitive
```

#### bodyclose -- утечка resp.Body

```go
// ПЛОХО: resp.Body не закрыт -- утечка соединения
resp, err := http.Get("https://api.example.com/data")
if err != nil {
    return err
}
// bodyclose: resp.Body должен быть закрыт

// ХОРОШО
resp, err := http.Get("https://api.example.com/data")
if err != nil {
    return err
}
defer resp.Body.Close()
```

#### noctx -- отсутствие контекста в HTTP

```go
// ПЛОХО: запрос без контекста -- нельзя отменить, нет таймаута
resp, err := http.Get("https://api.example.com/data") // noctx!

// ХОРОШО: запрос с контекстом
req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.example.com/data", nil)
if err != nil {
    return err
}
resp, err := http.DefaultClient.Do(req)
```

#### errorlint -- правильная работа с ошибками

```go
// ПЛОХО: сравнение ошибок напрямую
if err == sql.ErrNoRows { // errorlint: используйте errors.Is
}

// ХОРОШО
if errors.Is(err, sql.ErrNoRows) {
}

// ПЛОХО: приведение типа ошибки напрямую
if e, ok := err.(*os.PathError); ok { // errorlint: используйте errors.As
}

// ХОРОШО
var pathErr *os.PathError
if errors.As(err, &pathErr) {
}

// ПЛОХО: fmt.Errorf без %w
return fmt.Errorf("ошибка загрузки: %v", err) // errorlint: используйте %w для оборачивания
```

#### wrapcheck -- оборачивание ошибок

```go
// ПЛОХО: ошибка из внешнего пакета возвращается без оборачивания
func GetUser(id int) (*User, error) {
    user, err := db.QueryUser(id)
    if err != nil {
        return nil, err // wrapcheck: ошибка из внешнего пакета должна быть обёрнута
    }
    return user, nil
}

// ХОРОШО
func GetUser(id int) (*User, error) {
    user, err := db.QueryUser(id)
    if err != nil {
        return nil, fmt.Errorf("получение пользователя %d: %w", id, err)
    }
    return user, nil
}
```

#### prealloc -- предварительное выделение слайсов

```go
// ПЛОХО: слайс растёт динамически, вызывая множественные аллокации
func collectIDs(users []User) []int {
    var ids []int // prealloc: можно выделить заранее
    for _, u := range users {
        ids = append(ids, u.ID)
    }
    return ids
}

// ХОРОШО: слайс выделен заранее
func collectIDs(users []User) []int {
    ids := make([]int, 0, len(users))
    for _, u := range users {
        ids = append(ids, u.ID)
    }
    return ids
}
```

### Интеграция с CI/CD

Пример для GitHub Actions:

```yaml
# .github/workflows/lint.yml
name: Lint

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.62.0
          args: --timeout=5m
```

> [!warning] Важно
> Не запускайте `golangci-lint` с флагом `--enable-all`. Многие линтеры конфликтуют между собой. Лучше включить конкретный набор и постепенно расширять его.

###### 🏠 Домашнее задание

1. Установите `golangci-lint` и создайте `.golangci.yml` для своего проекта. Включите минимум 10 линтеров из описанных выше.
2. Запустите линтер на своём проекте и исправьте все найденные проблемы. Запишите, какие ошибки встречались чаще всего.
3. Добавьте `golangci-lint` в GitHub Actions. Создайте PR с намеренной ошибкой (необработанный error) и убедитесь, что CI не проходит.
4. Настройте `exclude-rules` для тестовых файлов и сгенерированного кода.

---

## 3. Профилирование: pprof

Go имеет встроенные инструменты профилирования через пакет `runtime/pprof` и его HTTP-обёртку `net/http/pprof`. Это ключевой инструмент для поиска узких мест в продакшене.

### Подключение net/http/pprof

```go
package main

import (
	"log"
	"net/http"
	_ "net/http/pprof" // Регистрирует обработчики на DefaultServeMux
)

func main() {
	// Запуск pprof-сервера на отдельном порту (не на основном!)
	go func() {
		// ВАЖНО: pprof-эндпоинт не должен быть доступен извне
		log.Println("pprof сервер запущен на :6060")
		if err := http.ListenAndServe("localhost:6060", nil); err != nil {
			log.Printf("pprof сервер: %v", err)
		}
	}()

	// Основной сервер приложения
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/users", handleUsers)
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

> [!danger] Безопасность
> Никогда не открывайте pprof на публичном адресе (`0.0.0.0`). Он позволяет читать данные из памяти процесса. Используйте `localhost:6060` и доступ через SSH-туннель или kubectl port-forward.

После запуска сервера доступны эндпоинты:

- `http://localhost:6060/debug/pprof/` -- индекс всех профилей
- `http://localhost:6060/debug/pprof/heap` -- профиль памяти
- `http://localhost:6060/debug/pprof/goroutine` -- все горутины
- `http://localhost:6060/debug/pprof/profile?seconds=30` -- CPU-профиль
- `http://localhost:6060/debug/pprof/block` -- блокировки
- `http://localhost:6060/debug/pprof/mutex` -- конкуренция за мьютексы
- `http://localhost:6060/debug/pprof/trace?seconds=5` -- трассировка выполнения

### CPU-профилирование

CPU-профиль показывает, на какие функции тратится процессорное время:

```bash
# Собрать CPU-профиль за 30 секунд
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Откроется интерактивная консоль pprof
# Основные команды:

(pprof) top 20          # Топ-20 функций по потреблению CPU
(pprof) top -cum        # Топ по кумулятивному времени (включая вызовы)
(pprof) list handleUsers # Показать код функции с аннотациями времени
(pprof) web             # Открыть граф вызовов в браузере (нужен graphviz)
(pprof) png > cpu.png   # Сохранить граф в PNG
```

Пример вывода `top`:

```
Showing nodes accounting for 2.5s, 83.33% of 3s total
      flat  flat%   sum%        cum   cum%
     1.2s 40.00% 40.00%      1.5s 50.00%  encoding/json.Marshal
     0.5s 16.67% 56.67%      0.5s 16.67%  runtime.mallocgc
     0.4s 13.33% 70.00%      2.2s 73.33%  main.handleUsers
     0.2s  6.67% 76.67%      0.2s  6.67%  runtime.memmove
     0.2s  6.67% 83.33%      0.3s 10.00%  database/sql.(*DB).Query
```

- `flat` -- время, проведённое непосредственно в этой функции
- `cum` -- кумулятивное время (функция + все вызванные ею функции)

### Профилирование памяти

```bash
# Собрать heap-профиль
go tool pprof http://localhost:6060/debug/pprof/heap

(pprof) top              # Кто больше всего выделяет памяти
(pprof) top -inuse_space # По текущему использованию (не по аллокациям)
(pprof) list processData # Код с аннотациями по памяти
```

Два режима анализа памяти:

- `inuse_space` / `inuse_objects` -- что сейчас в памяти (ищем утечки)
- `alloc_space` / `alloc_objects` -- что было аллоцировано суммарно (ищем нагрузку на GC)

```bash
# Переключение режима
(pprof) sample_index = inuse_space
(pprof) sample_index = alloc_space
```

### Профилирование горутин

Горутинный профиль показывает все текущие горутины и их стеки -- незаменимый инструмент для поиска утечек:

```bash
# Посмотреть все горутины
go tool pprof http://localhost:6060/debug/pprof/goroutine

(pprof) top              # Группировка по стекам вызовов
(pprof) traces           # Полные стектрейсы всех горутин

# Или в текстовом формате через curl
curl http://localhost:6060/debug/pprof/goroutine?debug=2
```

> [!tip] Обнаружение утечки горутин
> Если число горутин растёт со временем -- у вас утечка. Сравните профили:
> ```bash
> # Сохранить профиль сейчас
> curl -o goroutines_before.prof http://localhost:6060/debug/pprof/goroutine
> # Подождать и сохранить снова
> curl -o goroutines_after.prof http://localhost:6060/debug/pprof/goroutine
> # Сравнить
> go tool pprof -base goroutines_before.prof goroutines_after.prof
> ```

### Block-профилирование

Показывает, где горутины блокируются на синхронизации (каналы, мьютексы, select):

```go
// Нужно явно включить в коде
runtime.SetBlockProfileRate(1) // 1 = записывать каждое событие блокировки
```

```bash
go tool pprof http://localhost:6060/debug/pprof/block

(pprof) top    # Где чаще всего блокируются горутины
```

### Визуализация: веб-интерфейс и flame graphs

```bash
# Открыть интерактивный веб-интерфейс
go tool pprof -http=:8081 http://localhost:6060/debug/pprof/profile?seconds=30

# Откроется в браузере с несколькими представлениями:
# - Graph: граф вызовов
# - Flame Graph: стековая диаграмма (flame graph)
# - Top: таблица топ функций
# - Source: исходный код с аннотациями
# - Peek: контекст вызовов функции
```

Flame graph -- самый наглядный инструмент. Ширина прямоугольника пропорциональна времени. Ищите широкие блоки -- это узкие места.

### Практический пример: поиск узкого места

```go
// Медленный обработчик -- попробуем найти, где тормозит
func handleReport(w http.ResponseWriter, r *http.Request) {
	// Получаем данные из БД
	rows, err := db.QueryContext(r.Context(),
		"SELECT id, name, data FROM reports WHERE status = 'active'")
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	var reports []Report
	for rows.Next() {
		var rpt Report
		if err := rows.Scan(&rpt.ID, &rpt.Name, &rpt.Data); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		// Тяжёлая обработка каждого отчёта
		rpt.Summary = generateSummary(rpt.Data) // <-- узкое место
		reports = append(reports, rpt)
	}

	// Сериализация в JSON
	data, err := json.Marshal(reports)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
```

Профилирование покажет, что `generateSummary` занимает 70% CPU-времени. Дальше смотрим `list generateSummary` и видим конкретную строку.

###### 🏠 Домашнее задание

1. Подключите `net/http/pprof` к своему проекту. Нагрузите приложение (например, с помощью `hey` или `ab`) и соберите CPU-профиль. Найдите топ-5 горячих функций.
2. Соберите heap-профиль и определите, какие объекты занимают больше всего памяти.
3. Создайте намеренную утечку горутин (горутина, которая ждёт на канале, куда никто не пишет) и обнаружьте её через goroutine-профиль.
4. Визуализируйте CPU-профиль с помощью flame graph (`go tool pprof -http=:8081`).

---

## 4. go tool trace

Если `pprof` показывает, _сколько_ времени потрачено в каждой функции, то `go tool trace` показывает, _когда_ и _как_ выполнялись горутины во времени.

### Сбор трассировки

```go
package main

import (
	"os"
	"runtime/trace"
)

func main() {
	// Вариант 1: Программный сбор трассировки
	f, err := os.Create("trace.out")
	if err != nil {
		panic(err)
	}
	defer f.Close()

	if err := trace.Start(f); err != nil {
		panic(err)
	}
	defer trace.Stop()

	// ... ваш код ...
}
```

```bash
# Вариант 2: Сбор через HTTP (если подключён net/http/pprof)
curl -o trace.out http://localhost:6060/debug/pprof/trace?seconds=5

# Вариант 3: Сбор при запуске тестов
go test -trace=trace.out ./...
```

### Визуализация

```bash
# Открыть трассировку в браузере
go tool trace trace.out
```

В браузере открывается интерфейс со следующими представлениями:

- **Goroutine analysis** -- группировка горутин по функции создания, время жизни каждой горутины
- **Network blocking profile** -- блокировки на сетевых операциях
- **Synchronization blocking profile** -- блокировки на синхронизации (мьютексы, каналы)
- **Syscall blocking profile** -- блокировки на системных вызовах
- **Scheduler latency profile** -- задержки планировщика
- **View trace** -- интерактивная временная диаграмма (самый полезный вид)

### Что видно в View trace

На временной диаграмме видно:

- На каких потоках ОС выполняются горутины
- Когда горутина блокируется и просыпается
- События GC (сборка мусора): STW-паузы, маркировка, очистка
- Сетевые вызовы и системные вызовы
- Создание новых горутин

> [!tip] Когда использовать trace вместо pprof
> - Задержки (latency) сложно объяснить -- нагрузка на CPU низкая, но запросы медленные
> - Проблемы с GC -- частые или длинные паузы
> - Планировщик горутин -- горутины ждут в очереди на выполнение
> - Конкуренция за ресурсы -- горутины блокируют друг друга

###### 🏠 Домашнее задание

1. Соберите трассировку своего HTTP-сервера под нагрузкой. Откройте View trace и найдите самую длинную горутину.
2. Создайте программу с интенсивной аллокацией памяти и визуализируйте GC-паузы через trace.
3. Сравните результаты `pprof` и `trace` для одного и того же сценария. Объясните, какую информацию даёт каждый инструмент.

---

## 5. Отладка: delve (dlv)

`delve` -- отладчик, разработанный специально для Go. Он понимает горутины, каналы, интерфейсы и другие конструкции языка.

### Установка

```bash
go install github.com/go-delve/delve/cmd/dlv@latest

# Проверка
dlv version
```

### Базовая отладка

```bash
# Запуск программы под отладчиком
dlv debug ./cmd/server

# Запуск с аргументами
dlv debug ./cmd/server -- --port 8080

# Запуск тестов под отладчиком
dlv test ./internal/service/...
```

### Управление брейкпоинтами

```bash
# Установить брейкпоинт по имени функции
(dlv) break main.main
(dlv) break github.com/myapp/internal/service.(*UserService).Create

# Установить по файлу и строке
(dlv) break ./internal/handler/user.go:42

# Условный брейкпоинт -- остановиться только если условие истинно
(dlv) break ./internal/handler/user.go:42
(dlv) condition 1 userID == 15

# Список брейкпоинтов
(dlv) breakpoints

# Удалить брейкпоинт
(dlv) clear 1

# Удалить все брейкпоинты
(dlv) clearall
```

### Навигация по коду

```bash
# Продолжить до следующего брейкпоинта
(dlv) continue   # или: c

# Следующая строка (не заходя в вызываемые функции)
(dlv) next        # или: n

# Шаг внутрь функции
(dlv) step        # или: s

# Выйти из текущей функции
(dlv) stepout

# Выполнить до указанной строки
(dlv) break ./handler.go:50
(dlv) continue
```

### Инспекция состояния

```bash
# Вывести значение переменной
(dlv) print userID
(dlv) print user.Name
(dlv) print len(users)
(dlv) print users[0]

# Все локальные переменные
(dlv) locals

# Аргументы текущей функции
(dlv) args

# Текущий стек вызовов
(dlv) stack

# Переключиться на другой фрейм стека
(dlv) frame 2

# Список всех горутин
(dlv) goroutines

# Переключиться на другую горутину
(dlv) goroutine 15

# Стек конкретной горутины
(dlv) goroutine 15 stack
```

### Подключение к запущенному процессу

```bash
# Найти PID процесса
ps aux | grep myserver

# Подключиться
dlv attach 12345

# После отладки -- отсоединиться (процесс продолжит работу)
(dlv) detach
```

### Удалённая отладка в контейнерах

```dockerfile
# Dockerfile для отладки
FROM golang:1.23

RUN go install github.com/go-delve/delve/cmd/dlv@latest

WORKDIR /app
COPY . .
RUN go build -gcflags="all=-N -l" -o server ./cmd/server

# Запуск через delve в headless-режиме
CMD ["dlv", "exec", "./server", "--headless", "--listen=:2345", "--api-version=2", "--accept-multiclient"]
```

```bash
# Запуск контейнера с открытым портом отладчика
docker run -p 2345:2345 -p 8080:8080 myapp-debug

# Подключение с хоста
dlv connect localhost:2345
```

> [!important] Флаги компиляции для отладки
> Флаг `-gcflags="all=-N -l"` отключает оптимизации компилятора (`-N`) и инлайнинг (`-l`). Без этих флагов отладчик может показывать некорректные значения переменных, потому что компилятор оптимизирует их.

### Интеграция с VS Code

Создайте `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Запуск сервера",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/cmd/server",
      "args": ["--config", "config.local.yaml"],
      "env": {
        "APP_ENV": "development"
      },
      "buildFlags": "-gcflags='all=-N -l'"
    },
    {
      "name": "Тесты текущего пакета",
      "type": "go",
      "request": "launch",
      "mode": "test",
      "program": "${fileDirname}",
      "buildFlags": "-gcflags='all=-N -l'"
    },
    {
      "name": "Подключение к контейнеру",
      "type": "go",
      "request": "attach",
      "mode": "remote",
      "remotePath": "/app",
      "port": 2345,
      "host": "127.0.0.1"
    }
  ]
}
```

После настройки: ставим брейкпоинты кликом по полю слева от номера строки, запускаем через F5, инспектируем переменные в панели Variables.

###### 🏠 Домашнее задание

1. Установите `delve`. Запустите свой проект под отладчиком, установите брейкпоинт в обработчике HTTP-запроса и отправьте запрос. Исследуйте стек вызовов и значения переменных.
2. Создайте условный брейкпоинт, который срабатывает только для определённого ID пользователя.
3. Настройте удалённую отладку в Docker-контейнере и подключитесь к ней из VS Code.
4. Используйте команду `goroutines` для исследования всех активных горутин в работающем сервере.

---

## 6. Генерация кода: go generate

`go generate` запускает команды, указанные в специальных комментариях в Go-файлах. Это механизм для кодогенерации -- создания Go-кода на основе других источников.

### Директива //go:generate

```go
// Синтаксис: //go:generate команда аргументы
// ВАЖНО: между // и go:generate нет пробела!

//go:generate stringer -type=Status
//go:generate mockgen -source=repository.go -destination=mock_repository.go
//go:generate protoc --go_out=. --go-grpc_out=. proto/api.proto
```

```bash
# Запуск генерации для всего проекта
go generate ./...

# Запуск для конкретного пакета
go generate ./internal/model/...

# Показать команды без выполнения (dry run)
go generate -n ./...

# С выводом выполняемых команд
go generate -v ./...
```

### stringer: генерация String() для перечислений

```go
package model

//go:generate stringer -type=OrderStatus

// OrderStatus представляет статус заказа
type OrderStatus int

const (
	OrderStatusPending    OrderStatus = iota // В ожидании
	OrderStatusConfirmed                     // Подтверждён
	OrderStatusProcessing                    // В обработке
	OrderStatusShipped                       // Отправлен
	OrderStatusDelivered                     // Доставлен
	OrderStatusCancelled                     // Отменён
)
```

```bash
# Установка stringer
go install golang.org/x/tools/cmd/stringer@latest

# Генерация
go generate ./internal/model/...
```

Создаётся файл `orderstatus_string.go`:

```go
// Code generated by "stringer -type=OrderStatus"; DO NOT EDIT.

package model

func (i OrderStatus) String() string {
    switch i {
    case OrderStatusPending:
        return "OrderStatusPending"
    case OrderStatusConfirmed:
        return "OrderStatusConfirmed"
    // ... и так далее
    }
    return fmt.Sprintf("OrderStatus(%d)", i)
}
```

### mockgen: генерация моков из интерфейсов

```go
package service

//go:generate mockgen -source=user_service.go -destination=mock_user_service.go -package=service

// UserRepository определяет операции с хранилищем пользователей
type UserRepository interface {
	GetByID(ctx context.Context, id int64) (*User, error)
	Create(ctx context.Context, user *User) error
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filter UserFilter) ([]User, error)
}
```

```bash
# Установка mockgen
go install go.uber.org/mock/mockgen@latest

# Два режима генерации:
# 1. Source mode -- из файла с интерфейсом
mockgen -source=repository.go -destination=mock_repository.go -package=service

# 2. Reflect mode -- по имени пакета и интерфейса
mockgen -destination=mock_repository.go -package=service \
  github.com/myapp/internal/service UserRepository
```

Подробнее об использовании моков -- в [[07-testing]].

### sqlc: генерация Go из SQL

```sql
-- queries/user.sql
-- name: GetUser :one
SELECT id, name, email, created_at
FROM users
WHERE id = $1;

-- name: ListUsers :many
SELECT id, name, email, created_at
FROM users
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateUser :one
INSERT INTO users (name, email)
VALUES ($1, $2)
RETURNING id, name, email, created_at;
```

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "queries/"
    schema: "migrations/"
    gen:
      go:
        package: "db"
        out: "internal/db"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_empty_slices: true
```

```bash
# Установка и генерация
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
sqlc generate
```

### protoc-gen-go: генерация из proto-файлов

```protobuf
// proto/user/v1/user.proto
syntax = "proto3";

package user.v1;

option go_package = "github.com/myapp/gen/user/v1;userv1";

message User {
  int64 id = 1;
  string name = 2;
  string email = 3;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
}
```

```bash
# Установка плагинов
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Генерация
protoc --go_out=. --go-grpc_out=. proto/user/v1/user.proto
```

### oapi-codegen: генерация из OpenAPI

```bash
# Установка
go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest

# Генерация серверного кода (Gin)
oapi-codegen -generate gin -package api -o internal/api/server.gen.go api/openapi.yaml

# Генерация типов
oapi-codegen -generate types -package api -o internal/api/types.gen.go api/openapi.yaml

# Генерация клиента
oapi-codegen -generate client -package api -o internal/api/client.gen.go api/openapi.yaml
```

### Когда коммитить сгенерированные файлы

| Сценарий | Коммитить? | Причина |
|----------|-----------|---------|
| Моки для тестов | Да | CI должен уметь запускать тесты без codegen-зависимостей |
| Protobuf / gRPC | Да | Не все среды имеют protoc установленным |
| sqlc | Да | Прозрачность -- виден код, который реально исполняется |
| stringer | Да | Простая зависимость, но файл маленький |
| OpenAPI-клиенты | Да | Стабильность сборки |

### Конвенция: пометка сгенерированных файлов

Все Go-генераторы добавляют маркер в первую строку:

```go
// Code generated by <tool>; DO NOT EDIT.
```

Этот маркер:
- Линтеры (`golangci-lint`) автоматически пропускают такие файлы
- IDE показывает предупреждение при попытке редактирования
- `go generate` знает, что файл можно перезаписать

###### 🏠 Домашнее задание

1. Создайте enum `Role` (Admin, Manager, User, Guest) и сгенерируйте для него `String()` с помощью `stringer`.
2. Определите интерфейс `OrderRepository` и сгенерируйте мок с помощью `mockgen`. Напишите тест с использованием сгенерированного мока.
3. Напишите SQL-запросы для CRUD-операций с таблицей `products` и сгенерируйте Go-код через `sqlc`.
4. Создайте `Makefile`-таргет `generate`, который запускает `go generate ./...`.

---

## 7. Swagger/OpenAPI: swaggo

`swaggo` -- инструмент для генерации Swagger/OpenAPI-документации из аннотаций в Go-коде. Он позволяет поддерживать документацию API рядом с реализацией.

### Установка

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

### Аннотации главного файла

```go
// @title           API Интернет-магазина
// @version         1.0
// @description     REST API для управления товарами и заказами
// @termsOfService  http://swagger.io/terms/

// @contact.name   Команда разработки
// @contact.email  dev@mycompany.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Введите токен в формате: Bearer <token>

func main() {
	// ...
}
```

### Аннотации обработчиков

```go
// CreateOrder создаёт новый заказ
// @Summary      Создание заказа
// @Description  Создаёт новый заказ для авторизованного пользователя
// @Tags         orders
// @Accept       json
// @Produce      json
// @Param        request body    CreateOrderRequest true "Данные заказа"
// @Success      201     {object} OrderResponse      "Заказ создан"
// @Failure      400     {object} ErrorResponse       "Невалидные данные"
// @Failure      401     {object} ErrorResponse       "Не авторизован"
// @Failure      500     {object} ErrorResponse       "Внутренняя ошибка"
// @Security     BearerAuth
// @Router       /orders [post]
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}
	// ...
}

// GetOrder возвращает заказ по ID
// @Summary      Получение заказа
// @Description  Возвращает полную информацию о заказе
// @Tags         orders
// @Produce      json
// @Param        id   path      int  true  "ID заказа" minimum(1)
// @Success      200  {object}  OrderResponse
// @Failure      404  {object}  ErrorResponse "Заказ не найден"
// @Security     BearerAuth
// @Router       /orders/{id} [get]
func (h *OrderHandler) GetOrder(c *gin.Context) {
	// ...
}

// ListOrders возвращает список заказов с пагинацией
// @Summary      Список заказов
// @Description  Возвращает список заказов текущего пользователя
// @Tags         orders
// @Produce      json
// @Param        page      query    int     false "Номер страницы"     default(1)  minimum(1)
// @Param        per_page  query    int     false "Элементов на странице" default(20) minimum(1) maximum(100)
// @Param        status    query    string  false "Фильтр по статусу"  Enums(pending, confirmed, shipped, delivered)
// @Success      200       {object} ListOrdersResponse
// @Security     BearerAuth
// @Router       /orders [get]
func (h *OrderHandler) ListOrders(c *gin.Context) {
	// ...
}
```

### Модели для Swagger

```go
// CreateOrderRequest -- запрос на создание заказа
type CreateOrderRequest struct {
	// Список товаров в заказе
	Items []OrderItem `json:"items" binding:"required,min=1" example:"[]"`
	// Адрес доставки
	Address string `json:"address" binding:"required" example:"ул. Пушкина, д. 10"`
	// Комментарий к заказу
	Comment string `json:"comment,omitempty" example:"Позвонить за час до доставки"`
} // @name CreateOrderRequest

// OrderResponse -- ответ с данными заказа
type OrderResponse struct {
	// Уникальный идентификатор
	ID int64 `json:"id" example:"42"`
	// Статус заказа
	Status string `json:"status" example:"pending"`
	// Итоговая сумма
	Total float64 `json:"total" example:"1599.99"`
	// Дата создания
	CreatedAt time.Time `json:"created_at" example:"2025-01-15T10:30:00Z"`
} // @name OrderResponse

// ErrorResponse -- стандартный ответ об ошибке
type ErrorResponse struct {
	// Описание ошибки
	Message string `json:"message" example:"заказ не найден"`
	// Код ошибки для программной обработки
	Code string `json:"code,omitempty" example:"ORDER_NOT_FOUND"`
} // @name ErrorResponse
```

### Генерация и публикация

```bash
# Генерация документации (из корня проекта)
swag init -g cmd/server/main.go -o docs

# С парсингом зависимостей
swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal

# Форматирование аннотаций
swag fmt
```

Создаётся директория `docs/` с файлами:
- `docs.go` -- Go-файл с встроенной спецификацией
- `swagger.json` -- OpenAPI-спецификация в JSON
- `swagger.yaml` -- OpenAPI-спецификация в YAML

### Подключение Swagger UI

```go
import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/myapp/docs" // Импорт сгенерированной документации
)

func setupRouter() *gin.Engine {
	r := gin.Default()

	// Swagger UI доступен по /swagger/index.html
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	v1 := r.Group("/api/v1")
	{
		v1.POST("/orders", orderHandler.CreateOrder)
		v1.GET("/orders/:id", orderHandler.GetOrder)
		v1.GET("/orders", orderHandler.ListOrders)
	}

	return r
}
```

> [!warning] Swagger в продакшене
> Отключайте Swagger UI в продакшен-среде или защищайте его аутентификацией. Он раскрывает структуру вашего API и может быть использован для атак.

###### 🏠 Домашнее задание

1. Добавьте swaggo-аннотации ко всем обработчикам в своём проекте. Не забудьте главный файл с `@title`, `@version`, `@securityDefinitions`.
2. Сгенерируйте документацию (`swag init`) и подключите Swagger UI. Убедитесь, что можно отправлять запросы из браузера.
3. Добавьте валидацию параметров в аннотации: `minimum`, `maximum`, `Enums`.
4. Настройте Bearer-аутентификацию в Swagger и протестируйте защищённые эндпоинты.

---

## 8. Dependency Injection

Dependency Injection (DI) -- паттерн, при котором зависимости передаются объекту извне, а не создаются внутри. В Go существует три основных подхода.

### Ручной DI (предпочтительный подход)

В Go-сообществе ручной DI считается идиоматичным. Зависимости конструируются в `main()` и передаются через конструкторы:

```go
func main() {
	// Конфигурация
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	// Инфраструктура
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal(err)
	}
	defer logger.Sync()

	db, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	redisClient := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})
	defer redisClient.Close()

	// Репозитории
	userRepo := postgres.NewUserRepository(db)
	orderRepo := postgres.NewOrderRepository(db)
	productRepo := postgres.NewProductRepository(db)

	// Кеш
	cache := rediscache.New(redisClient, logger)

	// Сервисы (зависят от репозиториев)
	userService := service.NewUserService(userRepo, cache, logger)
	productService := service.NewProductService(productRepo, cache, logger)
	orderService := service.NewOrderService(orderRepo, userService, productService, logger)

	// Обработчики (зависят от сервисов)
	userHandler := handler.NewUserHandler(userService, logger)
	orderHandler := handler.NewOrderHandler(orderService, logger)
	productHandler := handler.NewProductHandler(productService, logger)

	// Роутер
	router := api.NewRouter(userHandler, orderHandler, productHandler, logger)

	// Сервер
	srv := &http.Server{
		Addr:    cfg.Addr,
		Handler: router,
	}

	log.Printf("Сервер запущен на %s", cfg.Addr)
	log.Fatal(srv.ListenAndServe())
}
```

> [!tip] Преимущества ручного DI
> - Весь граф зависимостей виден в одном месте
> - Ошибки компиляции, если зависимость не создана
> - Нет магии -- код читается линейно
> - Легко рефакторить

Недостаток: при 50+ зависимостях `main()` становится длинным. Можно разбить на вспомогательные функции:

```go
func main() {
	cfg := mustLoadConfig()
	infra := mustInitInfra(cfg)
	defer infra.Close()

	repos := initRepositories(infra.DB)
	services := initServices(repos, infra)
	handlers := initHandlers(services, infra.Logger)
	router := initRouter(handlers, infra.Logger)

	startServer(cfg, router)
}
```

### wire (Google): DI на этапе компиляции

`wire` -- генератор кода от Google. Вы описываете провайдеры и инжекторы, а `wire` генерирует конструктор:

```go
// wire.go (инструкции для wire, не компилируется напрямую)
//go:build wireinject

package main

import "github.com/google/wire"

// InitializeApp создаёт полностью собранное приложение
func InitializeApp(cfg *config.Config) (*App, error) {
	wire.Build(
		// Инфраструктура
		provideLogger,
		provideDB,
		provideRedis,

		// Репозитории
		postgres.NewUserRepository,
		postgres.NewOrderRepository,

		// Сервисы
		service.NewUserService,
		service.NewOrderService,

		// Обработчики
		handler.NewUserHandler,
		handler.NewOrderHandler,

		// Приложение
		NewApp,
	)
	return nil, nil // wire заменит эту реализацию
}
```

```bash
# Установка
go install github.com/google/wire/cmd/wire@latest

# Генерация
wire ./...
```

`wire` создаст `wire_gen.go` с реальным кодом конструирования -- как если бы вы написали ручной DI, но без повторений.

### fx (Uber): DI во время выполнения

`fx` -- фреймворк от Uber для runtime DI с управлением жизненным циклом:

```go
package main

import (
	"go.uber.org/fx"
	"go.uber.org/zap"
)

func main() {
	app := fx.New(
		// Провайдеры: функции, создающие зависимости
		fx.Provide(
			config.Load,
			zap.NewProduction,
			provideDB,
			provideRedis,

			postgres.NewUserRepository,
			postgres.NewOrderRepository,

			service.NewUserService,
			service.NewOrderService,

			handler.NewUserHandler,
			handler.NewOrderHandler,

			NewRouter,
		),

		// Invoke: функции, которые запускаются при старте
		fx.Invoke(startServer),
	)

	app.Run() // Блокирует до SIGTERM/SIGINT
}

// provideDB создаёт пул соединений с БД и регистрирует cleanup
func provideDB(lc fx.Lifecycle, cfg *config.Config) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	// Lifecycle hooks: fx сам вызовет OnStop при завершении
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return pool.Ping(ctx)
		},
		OnStop: func(ctx context.Context) error {
			pool.Close()
			return nil
		},
	})

	return pool, nil
}
```

> [!note] Когда что использовать
> | Подход | Когда применять |
> |--------|----------------|
> | Ручной DI | Малые и средние проекты (до 30-40 зависимостей). Это стандартный Go-подход |
> | wire | Большие проекты, где ручной DI становится утомительным. Нет runtime-оверхеда |
> | fx | Микросервисы с плагинной архитектурой, когда нужен lifecycle management |

###### 🏠 Домашнее задание

1. Перепишите `main()` своего проекта, используя ручной DI. Убедитесь, что все зависимости передаются через конструкторы, а не создаются внутри функций.
2. Попробуйте `wire`: опишите провайдеры для своих зависимостей и сгенерируйте `wire_gen.go`. Сравните результат с ручным подходом.
3. Создайте минимальное приложение на `fx` с lifecycle hooks для БД и HTTP-сервера. Убедитесь, что graceful shutdown работает.

---

## 9. Популярные библиотеки

### lo (samber/lo): lodash для Go

Коллекция утилит для работы с коллекциями, использует дженерики (Go 1.18+):

```go
import "github.com/samber/lo"

// Map -- трансформация элементов
names := lo.Map(users, func(u User, _ int) string {
	return u.Name
})

// Filter -- фильтрация
adults := lo.Filter(users, func(u User, _ int) bool {
	return u.Age >= 18
})

// Reduce -- свёртка
totalAge := lo.Reduce(users, func(acc int, u User, _ int) int {
	return acc + u.Age
}, 0)

// Contains -- проверка наличия
hasAdmin := lo.Contains(roles, "admin")

// Uniq -- уникальные элементы
unique := lo.Uniq([]int{1, 2, 2, 3, 3, 3}) // [1, 2, 3]

// GroupBy -- группировка
byDepartment := lo.GroupBy(employees, func(e Employee) string {
	return e.Department
})

// Chunk -- разбиение на части
batches := lo.Chunk(items, 100) // по 100 элементов

// Find -- поиск первого подходящего
admin, found := lo.Find(users, func(u User) bool {
	return u.Role == "admin"
})

// Keys / Values -- ключи и значения из map
keys := lo.Keys(myMap)
vals := lo.Values(myMap)

// Ternary -- тернарный оператор
status := lo.Ternary(isActive, "active", "inactive")
```

### spf13/cobra: создание CLI-приложений

`cobra` -- стандарт де-факто для CLI в Go (используется в kubectl, hugo, gh):

```bash
# Установка CLI-генератора
go install github.com/spf13/cobra-cli@latest

# Инициализация проекта
cobra-cli init
cobra-cli add serve
cobra-cli add migrate
cobra-cli add seed
```

```go
// cmd/root.go -- корневая команда
package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string

var rootCmd = &cobra.Command{
	Use:   "myapp",
	Short: "Сервер интернет-магазина",
	Long:  `Серверное приложение для управления товарами, заказами и пользователями.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	// Глобальные флаги (доступны всем подкомандам)
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "путь к файлу конфигурации")
	rootCmd.PersistentFlags().String("log-level", "info", "уровень логирования (debug, info, warn, error)")

	// Привязка флагов к viper
	viper.BindPFlag("log_level", rootCmd.PersistentFlags().Lookup("log-level"))
}

// cmd/serve.go -- команда запуска сервера
var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Запуск HTTP-сервера",
	RunE: func(cmd *cobra.Command, args []string) error {
		port, _ := cmd.Flags().GetInt("port")
		fmt.Printf("Сервер запущен на :%d\n", port)
		return startServer(port)
	},
}

func init() {
	serveCmd.Flags().IntP("port", "p", 8080, "порт сервера")
	rootCmd.AddCommand(serveCmd)
}

// cmd/migrate.go -- команда миграций с подкомандами
var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Управление миграциями БД",
}

var migrateUpCmd = &cobra.Command{
	Use:   "up",
	Short: "Применить все миграции",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runMigrations("up")
	},
}

var migrateDownCmd = &cobra.Command{
	Use:   "down",
	Short: "Откатить последнюю миграцию",
	RunE: func(cmd *cobra.Command, args []string) error {
		steps, _ := cmd.Flags().GetInt("steps")
		return rollbackMigrations(steps)
	},
}

func init() {
	migrateDownCmd.Flags().Int("steps", 1, "количество миграций для отката")
	migrateCmd.AddCommand(migrateUpCmd, migrateDownCmd)
	rootCmd.AddCommand(migrateCmd)
}
```

Результат -- CLI с иерархическими командами:

```bash
myapp serve --port 9090
myapp migrate up
myapp migrate down --steps 2
myapp --help
```

### spf13/viper: управление конфигурацией

```go
package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	JWT      JWTConfig      `mapstructure:"jwt"`
}

type ServerConfig struct {
	Port         int    `mapstructure:"port"`
	Host         string `mapstructure:"host"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DBName   string `mapstructure:"dbname"`
	SSLMode  string `mapstructure:"sslmode"`
}

func Load() (*Config, error) {
	// Имя файла и пути поиска
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/etc/myapp")

	// Значения по умолчанию
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.read_timeout", 15)
	viper.SetDefault("server.write_timeout", 15)

	// Переменные окружения
	viper.SetEnvPrefix("APP")         // APP_SERVER_PORT, APP_DATABASE_HOST и т.д.
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Чтение файла конфигурации
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("ошибка чтения конфигурации: %w", err)
		}
		// Файл не найден -- используем defaults и env vars
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("ошибка парсинга конфигурации: %w", err)
	}

	return &cfg, nil
}
```

Файл конфигурации:

```yaml
# config.yaml
server:
  port: 8080
  host: "0.0.0.0"
  read_timeout: 15
  write_timeout: 15

database:
  host: "localhost"
  port: 5432
  user: "app"
  password: "secret"
  dbname: "myapp"
  sslmode: "disable"

redis:
  addr: "localhost:6379"

jwt:
  secret: "change-me"
  expiration: 3600
```

### Air: горячая перезагрузка

`Air` -- инструмент для автоматической перекомпиляции и перезапуска при изменении файлов:

```bash
# Установка
go install github.com/air-verse/air@latest

# Инициализация конфигурации
air init
```

```toml
# .air.toml
root = "."
tmp_dir = "tmp"

[build]
  # Команда сборки
  cmd = "go build -o ./tmp/main ./cmd/server"
  # Бинарник для запуска
  bin = "tmp/main"
  # Аргументы запуска
  args_bin = ["--config", "config.local.yaml"]
  # Отслеживаемые расширения
  include_ext = ["go", "tpl", "tmpl", "html", "yaml"]
  # Исключить директории
  exclude_dir = ["assets", "tmp", "vendor", "testdata", "docs"]
  # Задержка перед перезапуском (мс)
  delay = 1000

[log]
  time = false

[color]
  main = "magenta"
  watcher = "cyan"
  build = "yellow"
  runner = "green"
```

```bash
# Запуск (из корня проекта)
air
```

### Task (taskfile.dev): современная альтернатива Make

```bash
# Установка
go install github.com/go-task/task/v3/cmd/task@latest
```

```yaml
# Taskfile.yml
version: "3"

vars:
  BINARY_NAME: myapp
  BUILD_DIR: ./bin

tasks:
  build:
    desc: "Сборка приложения"
    cmds:
      - go build -o {{.BUILD_DIR}}/{{.BINARY_NAME}} ./cmd/server
    sources:
      - ./**/*.go
    generates:
      - "{{.BUILD_DIR}}/{{.BINARY_NAME}}"

  run:
    desc: "Запуск с hot-reload"
    cmds:
      - air

  test:
    desc: "Запуск тестов"
    cmds:
      - go test -race -count=1 ./...

  lint:
    desc: "Линтинг"
    cmds:
      - golangci-lint run ./...

  check:
    desc: "Полная проверка (lint + test)"
    deps: [lint, test]

  docker:up:
    desc: "Запуск Docker-инфраструктуры"
    cmds:
      - docker compose up -d

  docker:down:
    desc: "Остановка Docker-инфраструктуры"
    cmds:
      - docker compose down
```

```bash
# Использование
task build
task test
task check       # lint и test параллельно
task docker:up
```

> [!note] Task vs Make
> Task поддерживает кросс-платформенность (Windows), YAML-синтаксис, зависимости задач с параллельным выполнением, инкрементальные сборки через `sources`/`generates`. Make остаётся стандартом в Go-сообществе, но Task набирает популярность.

###### 🏠 Домашнее задание

1. Добавьте `samber/lo` в проект и перепишите циклы обработки коллекций с использованием `Map`, `Filter`, `GroupBy`.
2. Создайте CLI-приложение на `cobra` с командами `serve`, `migrate up`, `migrate down`, `seed`. Добавьте глобальный флаг `--config`.
3. Настройте `viper` для чтения конфигурации из файла, переменных окружения и флагов одновременно. Проверьте приоритет: флаги > env > файл > defaults.
4. Настройте `Air` для горячей перезагрузки. Измените обработчик и убедитесь, что сервер перезапустился автоматически.

---

## 10. Makefile

`Makefile` -- центральная точка входа для всех операций с проектом. Хорошо написанный `Makefile` документирует, как собирать, тестировать и запускать проект.

### Полный Makefile для Go-проекта

```makefile
# Makefile для Go-проекта
.PHONY: build run test test-integration test-coverage lint fmt check \
        migrate-up migrate-down migrate-create \
        docker-build docker-up docker-down \
        generate swagger deps tools help

# Переменные
APP_NAME := myapp
BUILD_DIR := ./bin
MAIN_PATH := ./cmd/server
MIGRATION_DIR := ./migrations
DOCKER_COMPOSE := docker compose

# Версия из git
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS := -ldflags "-X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME)"

# Настройки линтера
GOLANGCI_LINT_VERSION := v1.62.0

# ==================== Сборка ====================

## build: Сборка бинарника
build:
	@echo "Сборка $(APP_NAME)..."
	go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_PATH)
	@echo "Бинарник: $(BUILD_DIR)/$(APP_NAME)"

## run: Запуск с hot-reload через Air
run:
	@air

## run-binary: Запуск скомпилированного бинарника
run-binary: build
	$(BUILD_DIR)/$(APP_NAME) --config config.local.yaml

# ==================== Тестирование ====================

## test: Запуск unit-тестов
test:
	go test -race -count=1 -short ./...

## test-integration: Запуск интеграционных тестов (требует запущенной БД)
test-integration:
	go test -race -count=1 -run Integration ./...

## test-coverage: Тесты с отчётом покрытия
test-coverage:
	go test -race -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -func=coverage.out
	@echo ""
	@echo "HTML-отчёт: go tool cover -html=coverage.out -o coverage.html"

## test-coverage-html: Тесты с HTML-отчётом покрытия
test-coverage-html: test-coverage
	go tool cover -html=coverage.out -o coverage.html
	@echo "Отчёт сохранён в coverage.html"

# ==================== Качество кода ====================

## lint: Запуск golangci-lint
lint:
	golangci-lint run ./...

## lint-fix: Запуск golangci-lint с автоисправлением
lint-fix:
	golangci-lint run --fix ./...

## fmt: Форматирование кода
fmt:
	gofumpt -w .
	goimports -w -local github.com/mycompany/$(APP_NAME) .

## check: Полная проверка (fmt + lint + test)
check: fmt lint test
	@echo "Все проверки пройдены!"

## vet: Запуск go vet
vet:
	go vet ./...

# ==================== Миграции ====================

## migrate-up: Применить все миграции
migrate-up:
	goose -dir $(MIGRATION_DIR) postgres "$(DATABASE_URL)" up

## migrate-down: Откатить последнюю миграцию
migrate-down:
	goose -dir $(MIGRATION_DIR) postgres "$(DATABASE_URL)" down

## migrate-status: Статус миграций
migrate-status:
	goose -dir $(MIGRATION_DIR) postgres "$(DATABASE_URL)" status

## migrate-create: Создать новую миграцию (usage: make migrate-create NAME=create_users)
migrate-create:
	@if [ -z "$(NAME)" ]; then \
		echo "Ошибка: укажите NAME=имя_миграции"; \
		exit 1; \
	fi
	goose -dir $(MIGRATION_DIR) create $(NAME) sql

# ==================== Docker ====================

## docker-build: Сборка Docker-образа
docker-build:
	docker build -t $(APP_NAME):$(VERSION) .

## docker-up: Запуск инфраструктуры (postgres, redis и т.д.)
docker-up:
	$(DOCKER_COMPOSE) up -d

## docker-down: Остановка инфраструктуры
docker-down:
	$(DOCKER_COMPOSE) down

## docker-logs: Логи контейнеров
docker-logs:
	$(DOCKER_COMPOSE) logs -f

# ==================== Кодогенерация ====================

## generate: Запуск go generate
generate:
	go generate ./...

## swagger: Генерация Swagger-документации
swagger:
	swag init -g $(MAIN_PATH)/main.go -o docs --parseDependency --parseInternal
	swag fmt

## proto: Генерация из protobuf
proto:
	protoc --go_out=. --go-grpc_out=. proto/**/*.proto

## sqlc: Генерация из SQL-запросов
sqlc:
	sqlc generate

# ==================== Зависимости ====================

## deps: Скачать и привести в порядок зависимости
deps:
	go mod download
	go mod tidy
	go mod verify

## tools: Установка необходимых инструментов
tools:
	go install mvdan.cc/gofumpt@latest
	go install golang.org/x/tools/cmd/goimports@latest
	go install github.com/air-verse/air@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install go.uber.org/mock/mockgen@latest
	go install golang.org/x/tools/cmd/stringer@latest
	go install github.com/pressly/goose/v3/cmd/goose@latest
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(shell go env GOPATH)/bin $(GOLANGCI_LINT_VERSION)
	@echo "Все инструменты установлены!"

# ==================== Помощь ====================

## help: Показать список доступных команд
help:
	@echo "Доступные команды:"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
```

### Объяснение ключевых таргетов

| Таргет | Назначение |
|--------|-----------|
| `build` | Компилирует бинарник с вшитой версией из git tag |
| `run` | Запускает Air для hot-reload при разработке |
| `test` | Unit-тесты с race detector и без кеширования |
| `test-integration` | Интеграционные тесты (отдельно, так как требуют инфраструктуру) |
| `test-coverage` | Тесты с отчётом покрытия кода |
| `lint` | Запускает golangci-lint с конфигурацией из `.golangci.yml` |
| `fmt` | Форматирование `gofumpt` + сортировка импортов `goimports` |
| `check` | Последовательно: fmt, lint, test -- полная проверка перед коммитом |
| `migrate-*` | Управление миграциями через goose |
| `docker-*` | Управление Docker-инфраструктурой |
| `generate` | Вся кодогенерация: моки, stringer, sqlc |
| `swagger` | Генерация Swagger-документации из аннотаций |
| `deps` | Скачивание и валидация зависимостей |
| `tools` | Установка всех необходимых CLI-инструментов |
| `help` | Автоматически генерирует список команд из комментариев `##` |

> [!important] .PHONY
> Все таргеты объявлены как `.PHONY`, потому что они не создают файлы с такими именами. Без этого Make мог бы пропустить выполнение, если случайно существует файл `test` или `build`.

###### 🏠 Домашнее задание

1. Создайте `Makefile` для своего проекта, адаптировав пример выше. Добавьте вшивание версии через `LDFLAGS`.
2. Реализуйте таргет `help`, который парсит комментарии `##` и выводит красивый список команд.
3. Добавьте таргет `check` и убедитесь, что он проходит локально перед каждым коммитом.
4. Настройте `make tools` для установки всех инструментов, необходимых новому разработчику.

---

## 11. Воркфлоу разработки

Полный цикл разработки Go-проекта -- от клонирования до деплоя. Этот процесс стандартизирован для большинства Go-команд.

### Начальная настройка

```bash
# 1. Клонирование репозитория
git clone git@github.com:mycompany/myapp.git
cd myapp

# 2. Установка инструментов (один раз)
make tools

# 3. Запуск инфраструктуры (PostgreSQL, Redis, Kafka и т.д.)
make docker-up

# 4. Применение миграций
make migrate-up

# 5. Копирование конфигурации для локальной разработки
cp config.example.yaml config.local.yaml
# Отредактировать config.local.yaml при необходимости

# 6. Запуск в режиме разработки (с hot-reload)
make run
```

### Цикл разработки

```bash
# 1. Создание ветки
git checkout -b feature/add-payment-service

# 2. Написание кода
# ... редактирование файлов ...

# 3. Если добавили/изменили интерфейсы -- обновить моки
make generate

# 4. Если изменили API -- обновить Swagger
make swagger

# 5. Проверка перед коммитом
make check    # fmt + lint + test

# 6. Коммит и пуш
git add -A
git commit -m "feat: add payment service integration"
git push -u origin feature/add-payment-service

# 7. Создание Pull Request
gh pr create --fill
```

### Pre-commit hooks

Автоматическая проверка кода перед каждым коммитом:

```bash
#!/bin/bash
# .githooks/pre-commit

set -e

echo "=== Pre-commit проверки ==="

# Форматирование
echo "Проверка форматирования..."
UNFORMATTED=$(gofumpt -l . 2>&1)
if [ -n "$UNFORMATTED" ]; then
    echo "Следующие файлы не отформатированы:"
    echo "$UNFORMATTED"
    echo "Запустите: make fmt"
    exit 1
fi

# Линтинг (только изменённые файлы для скорости)
echo "Линтинг..."
golangci-lint run --new-from-rev=HEAD ./...

# Тесты
echo "Тесты..."
go test -race -short -count=1 ./...

echo "=== Все проверки пройдены ==="
```

```bash
# Установка хуков
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

### CI/CD Pipeline

Полный пайплайн для GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.62.0
          args: --timeout=5m

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"

      - name: Unit-тесты
        run: go test -race -count=1 -short ./...

      - name: Интеграционные тесты
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/testdb?sslmode=disable
        run: go test -race -count=1 -run Integration ./...

      - name: Покрытие
        run: |
          go test -coverprofile=coverage.out ./...
          go tool cover -func=coverage.out

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
      - name: Сборка
        run: make build

  check-generated:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
      - name: Проверка сгенерированного кода
        run: |
          make generate
          git diff --exit-code || (echo "Сгенерированный код не закоммичен. Запустите: make generate" && exit 1)
```

### Структура проекта

Типичная структура Go-проекта, в котором применяются все инструменты из этой главы:

```
myapp/
├── .air.toml                 # Конфигурация hot-reload
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD пайплайн
├── .githooks/
│   └── pre-commit            # Pre-commit хуки
├── .golangci.yml             # Конфигурация линтера
├── .vscode/
│   ├── launch.json           # Конфигурация отладки
│   └── settings.json         # Настройки IDE
├── Dockerfile
├── Makefile
├── cmd/
│   └── server/
│       └── main.go           # Точка входа, Swagger-аннотации
├── config.example.yaml
├── docker-compose.yml
├── docs/                     # Сгенерированная Swagger-документация
│   ├── docs.go
│   ├── swagger.json
│   └── swagger.yaml
├── go.mod
├── go.sum
├── internal/
│   ├── config/
│   ├── handler/
│   ├── middleware/
│   ├── model/
│   ├── repository/
│   │   └── postgres/
│   └── service/
├── migrations/               # SQL-миграции
├── proto/                    # Protobuf-определения
├── queries/                  # SQL-запросы для sqlc
└── sqlc.yaml
```

### Чеклист перед деплоем

> [!checklist] Деплой-чеклист
> - [ ] `make check` проходит без ошибок
> - [ ] Все тесты (unit + integration) зелёные
> - [ ] Сгенерированный код актуален (`make generate && git diff --exit-code`)
> - [ ] Swagger-документация обновлена (`make swagger`)
> - [ ] Миграции включены в PR
> - [ ] `go mod tidy` выполнен
> - [ ] Нет секретов в коде (gosec)
> - [ ] CI пайплайн пройден
> - [ ] PR прошёл code review

Подробнее о деплое и контейнеризации -- в [[09-deploy]].

###### 🏠 Домашнее задание

1. Настройте полный воркфлоу для своего проекта: `Makefile`, `.golangci.yml`, `.air.toml`, pre-commit hook.
2. Создайте GitHub Actions пайплайн, который запускает lint, test и build на каждый PR.
3. Добавьте проверку сгенерированного кода в CI (задача `check-generated` из примера выше).
4. Напишите скрипт `setup.sh`, который новый разработчик запускает один раз для полной настройки окружения.
5. Выполните полный цикл: создайте ветку, напишите фичу с тестами, прогоните `make check`, создайте PR.

---

## Итоги

> [!summary] Ключевые инструменты Go-разработчика
> - **Форматирование**: `gofumpt` + `goimports` -- единый стиль без споров
> - **Линтинг**: `golangci-lint` -- агрегатор 50+ линтеров с единой конфигурацией
> - **Профилирование**: `pprof` -- CPU, память, горутины, блокировки
> - **Трассировка**: `go tool trace` -- визуализация выполнения горутин
> - **Отладка**: `delve` -- полноценный отладчик с поддержкой горутин
> - **Кодогенерация**: `go generate` -- stringer, mockgen, sqlc, protoc
> - **API-документация**: `swaggo` -- Swagger из аннотаций в коде
> - **DI**: ручной подход в `main()`, `wire` для больших проектов, `fx` для микросервисов
> - **Библиотеки**: `lo`, `cobra`, `viper`, `Air`, `Task`
> - **Автоматизация**: `Makefile` -- единая точка входа для всех команд

> [!quote] Rob Pike
> "The key point here is our programmers are Googlers, they're not researchers. They're typically, fairly young, fresh out of school, probably learned Java, maybe learned C or C++, probably learned Python. They're not able to understand a brilliant language but we want to use them to build good software. So, the language that we give them has to be easy for them to understand and easy to adopt."
> -- Инструменты Go отражают эту философию: они просты, предсказуемы и работают из коробки.

---

Навигация: [[01-basics]] | [[07-testing]] | **08-tools-and-ecosystem** | [[09-deploy]]
