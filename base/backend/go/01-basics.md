---
tags:
  - backend
  - golang
  - go
  - basics
---

# Глава 1. Основы Go

Эта глава охватывает все базовые конструкции языка Go: от установки и первой программы до интерфейсов, обработки ошибок и финального проекта. Материал выстроен по нарастающей сложности и содержит примеры кода с подробными комментариями. #golang #backend #basics

---

## 1. Введение в Go

### История создания

Go (или Golang) был создан в компании Google в 2007 году тремя инженерами:

- **Роб Пайк** (Rob Pike) — участник создания UTF-8, Plan 9, работал в Bell Labs
- **Кен Томпсон** (Ken Thompson) — один из создателей Unix и языка C
- **Роберт Грисемер** (Robert Griesemer) — работал над V8 JavaScript engine и Java HotSpot compiler

Первый публичный релиз состоялся в 2009 году как open-source проект. Версия Go 1.0, гарантирующая обратную совместимость, вышла в **марте 2012 года**. С тех пор каждые полгода выходят новые минорные версии (1.18, 1.19, 1.20, ...), при этом весь код, написанный для Go 1.0, продолжает компилироваться и работать.

### Зачем был создан Go

В тот момент Google писал серверный код на C++ и Java. C++ компилировался долго, содержал сложные шаблоны и требовал ручного управления памятью. Java предоставлял сборку мусора, но JVM потребляла много ресурсов и требовала прогрева. Python был удобен, но медленен для высоконагруженных сервисов.

Разработчики хотели язык, который сочетает:
- Скорость компиляции, сопоставимую с Python
- Производительность на уровне C/C++
- Удобную работу с конкурентностью, встроенную в язык
- Простоту чтения и поддержки кода

### Философия Go

Go намеренно отказался от многих фич, привычных в других языках. Нет наследования, нет исключений (в традиционном понимании), нет перегрузки функций, нет дженериков (до версии 1.18). Каждое отсутствие — это осознанное решение в пользу простоты.

Ключевые принципы:

- **Композиция вместо наследования.** Структуры встраиваются друг в друга, интерфейсы компонуются. Глубоких иерархий типов не существует
- **Явное лучше неявного.** Ошибки возвращаются как значения и обрабатываются явно. Нет скрытых исключений или магического поведения
- **Один способ сделать вещь.** `go fmt` форматирует код единственным способом. Нет споров о стиле
- **Читаемость важнее лаконичности.** Код читают значительно чаще, чем пишут
- **Конкурентность как основа.** Горутины и каналы — часть языка, а не библиотечная абстракция

> [!summary] Go Proverbs (Rob Pike)
> Эти пословицы определяют дух языка:
> - **Don't communicate by sharing memory, share memory by communicating** — не общайтесь через разделяемую память, передавайте память через каналы
> - **Concurrency is not parallelism** — конкурентность это не параллелизм
> - **The bigger the interface, the weaker the abstraction** — чем больше интерфейс, тем слабее абстракция
> - **Make the zero value useful** — делайте нулевое значение полезным
> - **A little copying is better than a little dependency** — немного копирования лучше, чем немного зависимости
> - **Clear is better than clever** — понятное лучше умного
> - **Errors are values** — ошибки это значения
> - **Don't just check errors, handle them gracefully** — не просто проверяйте ошибки, обрабатывайте их элегантно
> - **Don't panic** — не паникуйте

### Где используется Go

Go стал стандартом для инфраструктурного и серверного программного обеспечения:

| Проект | Описание |
|--------|----------|
| **Docker** | Контейнеризация приложений |
| **Kubernetes** | Оркестрация контейнеров |
| **Terraform** | Infrastructure as Code |
| **Prometheus** | Мониторинг и алертинг |
| **etcd** | Распределённое хранилище ключей |
| **CockroachDB** | Распределённая SQL-база |
| **Hugo** | Генератор статических сайтов |
| **Caddy** | Веб-сервер с автоматическим HTTPS |

Go активно используется в микросервисах, CLI-утилитах, сетевых сервисах, DevOps-инструментах и облачных платформах.

### Сравнение с другими языками

| Характеристика | Go | C++ | Java | Python |
|---|---|---|---|---|
| Компиляция | Быстрая | Медленная | Средняя (JIT) | Интерпретатор |
| Память | GC | Ручная | GC (JVM) | GC |
| Конкурентность | Горутины | std::thread | Threads/Virtual Threads | asyncio/GIL |
| Типизация | Статическая | Статическая | Статическая | Динамическая |
| Бинарник | Один файл | Один файл + libs | JVM нужна | Интерпретатор нужен |
| Наследование | Нет | Да | Да | Да |
| Дженерики | Да (1.18+) | Да (шаблоны) | Да | Утиная типизация |

> [!TIP] Когда выбирать Go
> Go идеально подходит для:
> - Высоконагруженных сетевых сервисов
> - Микросервисной архитектуры
> - CLI-утилит и DevOps-инструментов
> - Системного программирования (но не ядер ОС)
> - Всего, где нужна простота развёртывания (один бинарник)

###### 🏠 Домашнее задание

1. Прочитайте статью "Go at Google: Language Design in the Service of Software Engineering" (Rob Pike, 2012)
2. Изучите Go Proverbs: [go-proverbs.github.io](https://go-proverbs.github.io/)
3. Сравните Hello World на Go, Python и Java. Какие отличия в структуре программы вы заметили?

---

## 2. Установка Go

### Загрузка и установка

Официальная страница загрузки: [https://go.dev/dl/](https://go.dev/dl/)

Для Linux:

```bash
# Скачиваем архив (замените версию на актуальную)
wget https://go.dev/dl/go1.22.2.linux-amd64.tar.gz

# Удаляем старую версию (если есть) и распаковываем
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.22.2.linux-amd64.tar.gz

# Добавляем Go в PATH (добавить в ~/.bashrc или ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin
```

Для macOS:

```bash
# Через Homebrew (рекомендуется)
brew install go

# Или скачать .pkg с go.dev и установить
```

Для Windows: скачать `.msi` установщик с go.dev и запустить.

### Проверка установки

```bash
# Проверяем версию Go
go version
# go version go1.22.2 linux/amd64

# Проверяем основные переменные окружения
go env GOROOT GOPATH GOBIN
```

- `GOROOT` — директория, где установлен Go (обычно `/usr/local/go`)
- `GOPATH` — рабочая директория для хранения скачанных зависимостей и собранных бинарников (обычно `~/go`)
- `GOBIN` — куда устанавливаются бинарники через `go install` (обычно `$GOPATH/bin`)

### GOPATH vs Go Modules

> [!WARNING] GOPATH — устаревший подход
> До Go 1.11 все проекты обязаны были располагаться внутри `$GOPATH/src/`. Это было неудобно и ограничивало структуру проектов. Начиная с Go 1.11 появились **Go Modules** — современный подход к управлению зависимостями, который стал стандартом с Go 1.16.
> 
> Все новые проекты должны использовать **модули**. GOPATH используется только для хранения кеша зависимостей.

Структура `$GOPATH`:

```
~/go/
├── bin/        # скомпилированные бинарники (go install)
├── pkg/        # кеш зависимостей модулей
│   └── mod/    # скачанные модули
└── src/        # (устаревшее) исходники при работе без модулей
```

### Настройка редактора

Рекомендуемые редакторы:

- **VS Code** + расширение "Go" (gopls) — самый популярный вариант
- **GoLand** от JetBrains — полноценная IDE для Go
- **Neovim** + gopls — для любителей терминала

Все эти редакторы используют **gopls** (Go language server) для автодополнения, навигации по коду, рефакторинга и диагностики.

###### 🏠 Домашнее задание

1. Установите Go последней версии на свою систему
2. Убедитесь, что `go version` возвращает корректный результат
3. Изучите вывод `go env` — какие переменные окружения настроены?

---

## 3. Первая программа Hello World

Создадим минимальную программу на Go.

### Инициализация модуля

```bash
# Создаём директорию проекта
mkdir hello && cd hello

# Инициализируем Go-модуль
go mod init hello
```

Это создаст файл `go.mod`:

```
module hello

go 1.22
```

### Файл main.go

```go
// package main — обязательный пакет для исполняемых программ.
// Именно из этого пакета Go ищет функцию main() как точку входа.
package main

// import подключает пакеты из стандартной библиотеки или внешние зависимости.
// Пакет "fmt" (format) предоставляет функции форматированного ввода-вывода.
import "fmt"

// func main() — точка входа в программу.
// Программа начинает выполнение с этой функции.
// Она не принимает аргументов и не возвращает значений.
// Для работы с аргументами командной строки используйте os.Args или пакет flag.
func main() {
	// Println выводит строку и добавляет перенос строки в конце
	fmt.Println("Привет, мир!")

	// Другие варианты вывода:
	// fmt.Print("без переноса строки")
	// fmt.Printf("форматированный вывод: %s, число: %d\n", "текст", 42)
}
```

### Запуск и сборка

```bash
# Запуск без сборки (компилирует во временную директорию и сразу запускает)
go run main.go
# Привет, мир!

# Сборка бинарника (создаёт исполняемый файл в текущей директории)
go build
# создаётся файл ./hello (или hello.exe на Windows)

# Запуск собранного бинарника
./hello
# Привет, мир!

# Сборка с указанием имени выходного файла
go build -o myapp main.go

# Кросс-компиляция для другой платформы
GOOS=linux GOARCH=amd64 go build -o myapp-linux
GOOS=windows GOARCH=amd64 go build -o myapp.exe
GOOS=darwin GOARCH=arm64 go build -o myapp-mac
```

> [!NOTE] go run vs go build
> `go run` удобен для разработки — он компилирует и запускает программу за один шаг. `go build` создаёт бинарный файл, который можно перенести на другую машину и запустить без установки Go. В продакшене всегда используется `go build`.

> [!INFO] Кросс-компиляция
> Go позволяет собирать бинарники для любой поддерживаемой платформы с помощью переменных `GOOS` и `GOARCH`. Это одно из главных преимуществ Go — один и тот же код может быть собран под Linux, macOS, Windows, ARM и другие архитектуры без изменений.

###### 🏠 Домашнее задание

1. Создайте проект и выведите своё имя и текущую дату с помощью пакета `time`
2. Соберите бинарник и запустите его
3. Попробуйте кросс-компиляцию для другой ОС и проверьте размер файла

---

## 4. Пакеты и модули

### Пакеты — организация кода

Пакет — это директория с `.go` файлами, имеющими одинаковое объявление `package`. Пакеты — основной механизм организации и переиспользования кода в Go.

```
myproject/
├── go.mod
├── main.go              # package main
├── internal/
│   └── config/
│       └── config.go    # package config
├── pkg/
│   └── validator/
│       └── validator.go # package validator
└── handler/
    ├── user.go          # package handler
    └── order.go         # package handler
```

Виды пакетов:

- `main` — обязательный пакет для исполняемых программ, содержит функцию `main()`
- Пользовательские пакеты — ваш код, разбитый по функциональности
- Стандартная библиотека — `fmt`, `strings`, `net/http`, `os`, `io` и др.
- Внешние зависимости — `github.com/gin-gonic/gin`, `github.com/jackc/pgx` и др.

### Правила экспорта (видимости)

В Go нет ключевых слов `public` / `private`. Видимость определяется регистром первой буквы:

```go
package user

// User — экспортированная структура (доступна из других пакетов)
// Имя начинается с заглавной буквы
type User struct {
	Name  string // экспортированное поле
	Email string // экспортированное поле
	age   int    // неэкспортированное поле (только внутри пакета user)
}

// NewUser — экспортированная функция-конструктор
func NewUser(name, email string, age int) *User {
	return &User{
		Name:  name,
		Email: email,
		age:   age,
	}
}

// validate — неэкспортированная функция (только внутри пакета)
func validate(email string) bool {
	return strings.Contains(email, "@")
}
```

> [!TIP] Соглашение об именовании
> - Экспортированные имена: `UserService`, `NewRouter`, `ErrNotFound` — заглавная буква
> - Неэкспортированные: `validate`, `userRepo`, `defaultTimeout` — строчная буква
> - Это не конвенция, а часть языка. Компилятор запретит доступ к строчным именам из другого пакета.

### Go Modules

Модуль — это набор пакетов с общим корнем и файлом `go.mod`. Каждый Go-проект является модулем.

```bash
# Инициализация модуля для локального проекта
go mod init myapp

# Инициализация модуля, который будет опубликован как библиотека
go mod init github.com/username/mylib
```

Файл `go.mod`:

```
module github.com/username/myapp

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/jackc/pgx/v5 v5.5.0
)

require (
    // indirect — транзитивные зависимости (зависимости ваших зависимостей)
    golang.org/x/crypto v0.17.0 // indirect
)
```

Файл `go.sum` автоматически генерируется и содержит криптографические хеши зависимостей. Это обеспечивает воспроизводимые сборки.

### Команды для работы с модулями

```bash
# Добавить зависимость
go get github.com/gin-gonic/gin@latest

# Добавить зависимость конкретной версии
go get github.com/gin-gonic/gin@v1.9.1

# Удалить неиспользуемые зависимости и добавить недостающие
go mod tidy

# Скопировать зависимости в директорию vendor/ (для офлайн-сборки)
go mod vendor

# Скачать зависимости в локальный кеш (без vendor)
go mod download

# Проверить целостность зависимостей
go mod verify
```

### Семантическое версионирование

Go следует стандарту [Semantic Versioning](https://semver.org/):

```
v1.9.1
│ │ │
│ │ └── PATCH — исправление багов (обратно совместимо)
│ └──── MINOR — новая функциональность (обратно совместимо)
└────── MAJOR — ломающие изменения (НЕ обратно совместимо)
```

> [!WARNING] Мажорные версии v2+
> Начиная с v2, путь модуля должен содержать суффикс версии:
> ```
> github.com/jackc/pgx/v5
> ```
> Это позволяет использовать несколько мажорных версий одной библиотеки одновременно.

### Директория internal/

Директория `internal/` имеет особую семантику в Go. Код внутри неё доступен только для пакетов родительского модуля. Это самый надёжный способ скрыть реализацию:

```
myapp/
├── internal/
│   ├── database/     # доступен только внутри myapp
│   └── middleware/    # доступен только внутри myapp
├── pkg/
│   └── validator/    # доступен для всех (публичный API)
└── main.go
```

Если кто-то попытается импортировать `github.com/username/myapp/internal/database` из другого модуля, компилятор выдаст ошибку.

###### 🏠 Домашнее задание

1. Создайте модуль с двумя пакетами: `main` и `mathutil`. В `mathutil` реализуйте экспортированную функцию `Add(a, b int) int` и неэкспортированную `validate(a, b int) error`
2. Импортируйте `mathutil` в `main` и вызовите `Add`. Убедитесь, что `validate` недоступна из `main`
3. Попробуйте `go mod tidy` — что он делает, если у вас нет внешних зависимостей?

---

## 5. Типы данных

Go — статически типизированный язык. Каждая переменная имеет тип, определённый на этапе компиляции.

### Целые числа

```go
package main

import "fmt"

func main() {
	// Целые числа со знаком (signed)
	var a int8 = 127         // от -128 до 127
	var b int16 = 32767      // от -32768 до 32767
	var c int32 = 2147483647 // ~2.1 млрд
	var d int64 = 9223372036854775807 // ~9.2 * 10^18

	// Целые без знака (unsigned) — только положительные
	var e uint8 = 255        // от 0 до 255
	var f uint16 = 65535     // от 0 до 65535
	var g uint32 = 4294967295
	var h uint64 = 18446744073709551615

	// int и uint — размер зависит от платформы (32 или 64 бита)
	var i int = 42
	var j uint = 42

	fmt.Println(a, b, c, d, e, f, g, h, i, j)
}
```

### Числа с плавающей точкой и комплексные числа

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	// float32 — ~7 значащих десятичных цифр
	var f32 float32 = 3.14

	// float64 — ~15 значащих десятичных цифр (рекомендуется по умолчанию)
	var f64 float64 = 3.141592653589793

	// Комплексные числа (редко используются)
	var c64 complex64 = 1 + 2i
	var c128 complex128 = complex(3.0, 4.0)

	fmt.Println(f32, f64)
	fmt.Println(c64, c128)
	fmt.Println("Мнимая часть:", imag(c128)) // 4
	fmt.Println("Реальная часть:", real(c128)) // 3
	fmt.Println("Pi:", math.Pi)
}
```

### byte, rune, bool, string, error

```go
package main

import "fmt"

func main() {
	// byte — алиас для uint8, используется при работе с байтами
	var b byte = 'A' // ASCII-код символа A = 65

	// rune — алиас для int32, представляет Unicode code point
	var r rune = 'Ы' // код символа Ы в Unicode

	// bool — логический тип
	var flag bool = true

	// string — неизменяемая последовательность байт (UTF-8)
	var s string = "Привет, Go!"

	// error — встроенный интерфейс для ошибок
	// var err error = nil // нулевое значение error = nil (ошибки нет)

	fmt.Printf("byte: %d (%c)\n", b, b)   // 65 (A)
	fmt.Printf("rune: %d (%c)\n", r, r)   // 1067 (Ы)
	fmt.Printf("bool: %t\n", flag)         // true
	fmt.Printf("string: %s\n", s)          // Привет, Go!
}
```

### Нулевые значения (Zero Values)

> [!NOTE] Zero Values — нулевые значения по умолчанию
> В Go **не бывает** неинициализированных переменных. Если вы объявили переменную без присвоения значения, она получит **нулевое значение** своего типа:
>
> | Тип | Zero value |
> |-----|-----------|
> | `int`, `int8`...`int64` | `0` |
> | `uint`, `uint8`...`uint64` | `0` |
> | `float32`, `float64` | `0.0` |
> | `complex64`, `complex128` | `(0+0i)` |
> | `bool` | `false` |
> | `string` | `""` (пустая строка) |
> | `byte` | `0` |
> | `rune` | `0` |
> | `error` | `nil` |
> | pointer, slice, map, channel, interface, func | `nil` |

```go
package main

import "fmt"

func main() {
	var i int
	var f float64
	var b bool
	var s string
	var p *int
	var sl []int
	var m map[string]int

	fmt.Printf("int: %d\n", i)       // 0
	fmt.Printf("float64: %f\n", f)   // 0.000000
	fmt.Printf("bool: %t\n", b)      // false
	fmt.Printf("string: %q\n", s)    // ""
	fmt.Printf("pointer: %v\n", p)   // <nil>
	fmt.Printf("slice: %v\n", sl)    // []
	fmt.Printf("map: %v\n", m)       // map[]
}
```

> [!TIP] Размер int и uint
> Типы `int` и `uint` имеют платформо-зависимый размер:
> - На 32-битных системах: 32 бита (4 байта)
> - На 64-битных системах: 64 бита (8 байт)
> 
> Если вам нужен гарантированный размер, используйте `int32`, `int64` и т.д. Особенно это важно при сериализации данных (JSON, protobuf) и работе с бинарными протоколами.

###### 🏠 Домашнее задание

1. Объявите переменные каждого базового типа и выведите их нулевые значения
2. Попробуйте выйти за пределы типа: присвоить 256 переменной `uint8`. Что произойдёт?
3. Выведите размер каждого типа с помощью `unsafe.Sizeof()` (импортируйте пакет `unsafe`)

---

## 6. Объявление переменных

Go предлагает несколько способов объявления переменных. Каждый подходит для своей ситуации.

### var с явным типом

```go
package main

import "fmt"

// Переменные на уровне пакета — только через var
var globalConfig string = "production"

func main() {
	// Полное объявление: var имя тип = значение
	var name string = "Gopher"
	var age int = 10
	var pi float64 = 3.14159

	// Объявление без значения — получает zero value
	var count int       // 0
	var message string  // ""
	var active bool     // false

	fmt.Println(name, age, pi, count, message, active)
}
```

### var с выводом типа

```go
func main() {
	// Компилятор определяет тип по значению
	var name = "Gopher"   // string
	var age = 10           // int
	var pi = 3.14          // float64
	var flag = true        // bool

	fmt.Printf("name: %T, age: %T, pi: %T, flag: %T\n",
		name, age, pi, flag)
	// name: string, age: int, pi: float64, flag: bool
}
```

### Короткое объявление :=

```go
func main() {
	// := — объявление + присваивание с выводом типа
	// Работает ТОЛЬКО внутри функций
	name := "Gopher"
	age := 10
	pi := 3.14

	fmt.Println(name, age, pi)

	// Повторное использование := допустимо, если хотя бы одна
	// переменная слева новая:
	age, email := 11, "gopher@go.dev" // age переприсваивается, email создаётся
	fmt.Println(age, email)
}
```

### Множественное объявление

```go
package main

import "fmt"

// Группировка через var() — удобно для связанных переменных
var (
	host  = "localhost"
	port  = 8080
	debug = false
)

func main() {
	// Множественное присваивание в одну строку
	x, y := 10, 20
	fmt.Println(x, y) // 10 20

	// Обмен значениями без временной переменной
	x, y = y, x
	fmt.Println(x, y) // 20 10

	// Множественный возврат из функции
	name, age := getUserInfo()
	fmt.Println(name, age)
}

func getUserInfo() (string, int) {
	return "Gopher", 10
}
```

> [!WARNING] Неиспользуемые переменные
> Go не компилируется, если в функции есть неиспользуемая переменная. Это осознанное решение — неиспользуемый код должен быть удалён. Если значение нужно проигнорировать, используйте blank identifier `_`:
> ```go
> name, _ := getUserInfo() // игнорируем второе значение
> ```

###### 🏠 Домашнее задание

1. Объявите переменные всеми тремя способами (`var` с типом, `var` с выводом типа, `:=`) и выведите их тип через `%T`
2. Попробуйте использовать `:=` вне функции. Какую ошибку вы получите?
3. Напишите функцию, которая возвращает 3 значения. Вызовите её и проигнорируйте одно из значений через `_`

---

## 7. Константы и iota

### Константы

Константы — это значения, известные на этапе компиляции. Они не могут быть изменены во время выполнения программы.

```go
package main

import "fmt"

// Константы на уровне пакета
const Pi = 3.14159265358979
const AppName = "myservice"
const MaxRetries = 3

// Группировка констант
const (
	StatusOK    = 200
	StatusError = 500
	Version     = "1.0.0"
)

func main() {
	fmt.Println(AppName, Version)

	// Константы нельзя изменить:
	// Pi = 3.0 // ошибка компиляции: cannot assign to Pi

	// Константы нельзя объявить через :=
	// const name := "test" // ошибка синтаксиса
}
```

### Нетипизированные константы

Особенность Go — константы могут быть **нетипизированными** (untyped). Их тип определяется в момент использования:

```go
package main

import (
	"fmt"
	"math"
)

const Value = 2 // untyped int — тип определится при использовании

func main() {
	// Value используется как float64 (аргумент math.Pow)
	result := math.Pow(10, Value)
	fmt.Println(result) // 100

	// Value используется как int
	var x int = Value
	fmt.Println(x) // 2

	// Value используется как float64
	var y float64 = Value
	fmt.Println(y) // 2

	// А вот переменная всегда имеет фиксированный тип:
	var z int = 2
	// var w float64 = z // ошибка: cannot use z (variable of type int) as float64
	_ = z
}
```

### iota — автоинкремент

`iota` — это специальный идентификатор, который автоматически увеличивается на 1 для каждой строки внутри блока `const`:

```go
package main

import "fmt"

// iota начинается с 0 и увеличивается на 1 в каждой строке
type Weekday int

const (
	Sunday    Weekday = iota // 0
	Monday                   // 1
	Tuesday                  // 2
	Wednesday                // 3
	Thursday                 // 4
	Friday                   // 5
	Saturday                 // 6
)

// Пропуск значения с помощью blank identifier
type LogLevel int

const (
	_         LogLevel = iota // 0 — пропускаем
	LevelInfo                // 1
	LevelWarn                // 2
	LevelError               // 3
)

// Практический пример: роли пользователей
type Role int

const (
	RoleGuest Role = iota // 0
	RoleUser              // 1
	RoleModerator         // 2
	RoleAdmin             // 3
	RoleSuperAdmin        // 4
)

func main() {
	fmt.Println("Sunday:", Sunday)       // 0
	fmt.Println("Saturday:", Saturday)   // 6
	fmt.Println("LevelInfo:", LevelInfo) // 1
	fmt.Println("Admin:", RoleAdmin)     // 3
}
```

### iota для битовых масок

Одно из самых мощных применений `iota` — создание битовых флагов:

```go
package main

import "fmt"

// Каждый флаг занимает один бит
type Permission uint8

const (
	PermRead    Permission = 1 << iota // 1   (00000001)
	PermWrite                          // 2   (00000010)
	PermExecute                        // 4   (00000100)
	PermDelete                         // 8   (00001000)
	PermAdmin                          // 16  (00010000)
)

func main() {
	// Комбинирование разрешений через побитовое ИЛИ
	userPerms := PermRead | PermWrite // 3 (00000011)
	adminPerms := PermRead | PermWrite | PermExecute | PermDelete | PermAdmin

	fmt.Printf("User: %08b (%d)\n", userPerms, userPerms)   // 00000011 (3)
	fmt.Printf("Admin: %08b (%d)\n", adminPerms, adminPerms) // 00011111 (31)

	// Проверка наличия разрешения через побитовое И
	if userPerms&PermRead != 0 {
		fmt.Println("У пользователя есть право на чтение")
	}

	if userPerms&PermAdmin == 0 {
		fmt.Println("У пользователя НЕТ прав администратора")
	}

	// Добавление разрешения
	userPerms |= PermExecute
	fmt.Printf("User + Execute: %08b (%d)\n", userPerms, userPerms)

	// Удаление разрешения через &^ (bit clear)
	userPerms &^= PermWrite
	fmt.Printf("User - Write: %08b (%d)\n", userPerms, userPerms)
}
```

> [!INFO] Размеры файлов через iota
> Классический пример из реальных проектов:
> ```go
> const (
> 	_  = iota             // игнорируем 0
> 	KB = 1 << (10 * iota) // 1 << 10 = 1024
> 	MB                    // 1 << 20 = 1048576
> 	GB                    // 1 << 30 = 1073741824
> 	TB                    // 1 << 40
> 	PB                    // 1 << 50
> )
> ```

###### 🏠 Домашнее задание

1. Создайте enum для HTTP-методов (GET, POST, PUT, DELETE, PATCH) с помощью `iota`
2. Реализуйте битовые флаги для прав файловой системы (чтение, запись, выполнение для владельца, группы, остальных — аналог `chmod`)
3. Напишите функцию `HasPermission(perms, check Permission) bool`, которая проверяет наличие разрешения

---

## 8. Работа со строками

Строки в Go — это неизменяемые последовательности байт в кодировке **UTF-8**.

### Основы строк

```go
package main

import "fmt"

func main() {
	// Строка — неизменяемая (immutable) последовательность байт
	s := "Привет, Go!"

	// len() возвращает количество БАЙТ, а не символов!
	fmt.Println(len(s)) // 19 (а не 11, потому что кириллица = 2 байта на символ)

	// Для подсчёта символов нужно преобразовать в []rune
	runes := []rune(s)
	fmt.Println(len(runes)) // 11 символов

	// Итерация по байтам
	for i := 0; i < len(s); i++ {
		fmt.Printf("%d: %x ", i, s[i])
	}
	fmt.Println()

	// Итерация по символам (рунам) — правильный способ
	for i, r := range s {
		fmt.Printf("%d: %c (U+%04X) ", i, r, r)
	}
	fmt.Println()
}
```

> [!WARNING] len() возвращает байты, а не символы!
> Это самая частая ошибка новичков. Для кириллицы `len("Привет")` вернёт 12, а не 6. Для подсчёта символов используйте `utf8.RuneCountInString()` или `len([]rune(s))`.

### Ещё одна частая ошибка: string(число)

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	// ОШИБКА НОВИЧКОВ: string(65) — это НЕ строка "65"!
	// string(65) преобразует число в символ с этим Unicode-кодом
	fmt.Println(string(65))  // "A" (символ с кодом 65)
	fmt.Println(string(1067)) // "Ы" (символ с кодом 1067)

	// Правильный способ — strconv.Itoa
	fmt.Println(strconv.Itoa(65)) // "65"
}
```

### Конкатенация строк

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	// 1. Оператор + (простые случаи, НЕ для циклов)
	greeting := "Hello" + ", " + "World"
	fmt.Println(greeting)

	// 2. fmt.Sprintf — форматированная строка
	name := "Gopher"
	age := 10
	info := fmt.Sprintf("Имя: %s, Возраст: %d", name, age)
	fmt.Println(info)

	// 3. strings.Builder — эффективная конкатенация в циклах
	// ВСЕГДА используйте Builder, когда склеиваете строки в цикле
	var sb strings.Builder
	for i := 0; i < 1000; i++ {
		sb.WriteString("Go ")
	}
	result := sb.String()
	fmt.Println(len(result)) // 3000

	// 4. strings.Join — объединение слайса строк
	parts := []string{"Go", "is", "awesome"}
	joined := strings.Join(parts, " ")
	fmt.Println(joined) // "Go is awesome"
}
```

> [!TIP] Почему strings.Builder, а не + в циклах?
> Строки в Go неизменяемы. Каждое сложение `+` создаёт новую строку и копирует все данные. В цикле из N итераций это O(N^2) по памяти. `strings.Builder` использует внутренний буфер и растёт амортизированно за O(N).

### Пакет strconv — конвертация

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	// Число -> Строка
	s1 := strconv.Itoa(42)            // "42"
	s2 := strconv.FormatFloat(3.14, 'f', 2, 64) // "3.14"
	s3 := strconv.FormatBool(true)     // "true"
	fmt.Println(s1, s2, s3)

	// Строка -> Число
	n, err := strconv.Atoi("42")
	if err != nil {
		fmt.Println("Ошибка:", err)
	} else {
		fmt.Println("Число:", n) // 42
	}

	// ParseFloat: строка -> float64
	f, err := strconv.ParseFloat("3.14", 64)
	if err != nil {
		fmt.Println("Ошибка:", err)
	} else {
		fmt.Println("Float:", f) // 3.14
	}

	// ParseBool: строка -> bool
	b, _ := strconv.ParseBool("true") // true
	fmt.Println("Bool:", b)

	// ParseInt с основанием системы счисления
	hex, _ := strconv.ParseInt("FF", 16, 64) // 255
	bin, _ := strconv.ParseInt("1010", 2, 64) // 10
	fmt.Println("Hex:", hex, "Bin:", bin)
}
```

### Пакет strings — операции со строками

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	s := "  Hello, World! Hello, Go!  "

	// Поиск
	fmt.Println(strings.Contains(s, "World"))     // true
	fmt.Println(strings.HasPrefix(s, "  Hello"))   // true
	fmt.Println(strings.HasSuffix(s, "Go!  "))     // true
	fmt.Println(strings.Index(s, "World"))          // 9
	fmt.Println(strings.Count(s, "Hello"))          // 2

	// Преобразование
	fmt.Println(strings.ToLower(s))                // "  hello, world! hello, go!  "
	fmt.Println(strings.ToUpper(s))                // "  HELLO, WORLD! HELLO, GO!  "
	fmt.Println(strings.TrimSpace(s))              // "Hello, World! Hello, Go!"
	fmt.Println(strings.Trim(s, " !"))             // "Hello, World! Hello, Go"

	// Замена
	fmt.Println(strings.ReplaceAll(s, "Hello", "Hi"))
	// "  Hi, World! Hi, Go!  "
	fmt.Println(strings.Replace(s, "Hello", "Hi", 1))
	// "  Hi, World! Hello, Go!  " (заменяет только первое вхождение)

	// Разделение и объединение
	parts := strings.Split("a,b,c,d", ",")
	fmt.Println(parts) // [a b c d]

	joined := strings.Join(parts, " | ")
	fmt.Println(joined) // "a | b | c | d"

	// Fields — разделение по пробелам (любому количеству)
	words := strings.Fields("  Go   is   awesome  ")
	fmt.Println(words) // [Go is awesome]

	// Repeat — повторение строки
	fmt.Println(strings.Repeat("Go! ", 3)) // "Go! Go! Go! "
}
```

### Многострочные строки (raw strings)

```go
func main() {
	// Обычная строка — поддерживает escape-последовательности
	s1 := "Строка\nс переносом\tи табуляцией"

	// Raw string (обратные кавычки) — все символы как есть
	s2 := `Это raw string.
Переносы строк сохраняются.
\n — это буквально обратный слеш и n, а не перенос.
Удобно для regex, SQL, JSON.`

	fmt.Println(s1)
	fmt.Println(s2)
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `WordCount(s string) map[string]int`, которая считает количество вхождений каждого слова в строке
2. Реализуйте функцию `ReverseString(s string) string`, которая корректно разворачивает строку с Unicode-символами
3. Напишите программу, которая читает число из аргументов командной строки (`os.Args`), конвертирует его в `int` через `strconv.Atoi` и выводит его квадрат

---

## 9. Операторы

### Арифметические операторы

```go
package main

import "fmt"

func main() {
	a, b := 17, 5

	fmt.Println(a + b)  // 22  сложение
	fmt.Println(a - b)  // 12  вычитание
	fmt.Println(a * b)  // 85  умножение
	fmt.Println(a / b)  // 3   целочисленное деление (остаток отбрасывается)
	fmt.Println(a % b)  // 2   остаток от деления

	// Для деления с дробной частью нужны float
	c, d := 17.0, 5.0
	fmt.Println(c / d) // 3.4
}
```

### Операторы сравнения

```go
func main() {
	a, b := 10, 20

	fmt.Println(a == b)  // false — равно
	fmt.Println(a != b)  // true  — не равно
	fmt.Println(a < b)   // true  — меньше
	fmt.Println(a > b)   // false — больше
	fmt.Println(a <= b)  // true  — меньше или равно
	fmt.Println(a >= b)  // false — больше или равно
}
```

### Логические операторы

```go
func main() {
	a, b := true, false

	fmt.Println(a && b) // false — логическое И (AND)
	fmt.Println(a || b) // true  — логическое ИЛИ (OR)
	fmt.Println(!a)     // false — логическое НЕ (NOT)

	// Short-circuit evaluation (ленивое вычисление):
	// В a && b, если a == false, то b не вычисляется
	// В a || b, если a == true, то b не вычисляется
}
```

### Побитовые операторы

```go
package main

import "fmt"

func main() {
	a := uint8(0b11001010) // 202
	b := uint8(0b10110110) // 182

	fmt.Printf("a:    %08b\n", a)
	fmt.Printf("b:    %08b\n", b)

	// Побитовое И (AND) — 1 только если оба бита = 1
	fmt.Printf("a&b:  %08b\n", a&b)   // 10000010

	// Побитовое ИЛИ (OR) — 1 если хотя бы один бит = 1
	fmt.Printf("a|b:  %08b\n", a|b)   // 11111110

	// Побитовое исключающее ИЛИ (XOR) — 1 если биты различны
	fmt.Printf("a^b:  %08b\n", a^b)   // 01111100

	// Сдвиг влево — умножение на 2^n
	fmt.Printf("a<<1: %08b (%d)\n", a<<1, a<<1) // 148 (с переполнением uint8)

	// Сдвиг вправо — деление на 2^n
	fmt.Printf("a>>1: %08b (%d)\n", a>>1, a>>1) // 01100101 (101)

	// Bit clear (AND NOT) — очищает биты
	// a &^ b: в результате 1 только если в a = 1 И в b = 0
	fmt.Printf("a&^b: %08b\n", a&^b) // 01001000
}
```

> [!INFO] Оператор &^ (bit clear / AND NOT)
> Оператор `&^` уникален для Go — в других языках его нет как отдельного оператора. Он очищает в левом операнде те биты, которые установлены в правом. Это эквивалентно `a & (^b)` в других языках.

### Операторы адреса и канала

```go
func main() {
	// Операторы работы с указателями
	x := 42
	p := &x  // & — получить адрес переменной (указатель)
	fmt.Println(*p) // * — разыменовать указатель (получить значение)
	// Подробнее в разделе [[#15. Указатели]]

	// Оператор канала <- (подробнее в [[05-concurrency]])
	// ch := make(chan int)
	// ch <- 42    // отправить значение в канал
	// val := <-ch // получить значение из канала
}
```

###### 🏠 Домашнее задание

1. Напишите программу, которая проверяет, является ли число степенью двойки, используя побитовые операторы (`n & (n-1) == 0`)
2. Реализуйте функцию `SetBit`, `ClearBit`, `ToggleBit`, `HasBit` для работы с битовыми флагами
3. Объясните, почему `a &^ b` полезнее, чем `a & (^b)` в контексте типобезопасности

---

## 10. Приведение типов

В Go **нет неявного приведения типов**. Все конвертации должны быть явными.

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	// Явное приведение числовых типов
	var i int = 42
	var f float64 = float64(i) // int -> float64
	var u uint = uint(f)       // float64 -> uint

	fmt.Println(i, f, u) // 42 42 42

	// Потеря точности при конвертации
	var bigFloat float64 = 3.999
	var truncated int = int(bigFloat) // дробная часть ОТБРАСЫВАЕТСЯ (не округляется)
	fmt.Println(truncated) // 3

	// Для округления используйте math.Round
	rounded := int(math.Round(bigFloat))
	fmt.Println(rounded) // 4

	// Переполнение при конвертации (без ошибки!)
	var big int64 = 256
	var small uint8 = uint8(big)
	fmt.Println(small) // 0 (256 % 256 = 0)

	var negative int = -1
	var unsigned uint8 = uint8(negative)
	fmt.Println(unsigned) // 255 (переполнение)
}
```

> [!WARNING] Переполнение при конвертации
> Go НЕ выдаёт ошибку при переполнении. `uint8(256)` молча даст 0, а `uint8(-1)` даст 255. Всегда проверяйте диапазон вручную, если данные приходят извне.

### Строки, байты и руны

```go
package main

import "fmt"

func main() {
	// string -> []byte (копирование данных)
	s := "Hello"
	bytes := []byte(s)
	fmt.Println(bytes) // [72 101 108 108 111]

	// []byte -> string (копирование данных)
	s2 := string(bytes)
	fmt.Println(s2) // "Hello"

	// string -> []rune (для работы с Unicode)
	s3 := "Привет"
	runes := []rune(s3)
	fmt.Println(len(s3))    // 12 (байт)
	fmt.Println(len(runes)) // 6 (символов)

	// rune -> string
	r := rune('Г')
	fmt.Println(string(r)) // "Г"

	// int -> string — ВНИМАНИЕ: это НЕ число в строку!
	fmt.Println(string(65))   // "A" (Unicode code point 65)
	fmt.Println(string(1067)) // "Ы"
	// Для числа в строку: strconv.Itoa(65) -> "65"
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `SafeUint8(n int) (uint8, error)`, которая безопасно конвертирует `int` в `uint8`, возвращая ошибку при переполнении
2. Конвертируйте строку `"Привет"` в `[]byte`, измените первый символ и конвертируйте обратно. Что произойдёт с кириллическим символом? Почему?

---

## 11. Ветвления

### if / else

```go
package main

import "fmt"

func main() {
	age := 25

	// Простой if — скобки вокруг условия НЕ нужны, фигурные скобки ОБЯЗАТЕЛЬНЫ
	if age >= 18 {
		fmt.Println("Совершеннолетний")
	}

	// if / else
	if age >= 18 {
		fmt.Println("Взрослый")
	} else {
		fmt.Println("Несовершеннолетний")
	}

	// if / else if / else
	if age < 13 {
		fmt.Println("Ребёнок")
	} else if age < 18 {
		fmt.Println("Подросток")
	} else if age < 65 {
		fmt.Println("Взрослый")
	} else {
		fmt.Println("Пенсионер")
	}
}
```

### if с инициализацией

Уникальная для Go конструкция — объявление переменной прямо в условии `if`. Переменная доступна только внутри блока `if/else`:

```go
package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {
	// Переменная err доступна только внутри if/else
	if err := doSomething(); err != nil {
		fmt.Println("Ошибка:", err)
	}
	// err здесь уже недоступна

	// Практический пример: чтение переменной окружения
	if port, ok := os.LookupEnv("PORT"); ok {
		fmt.Println("Порт:", port)
	} else {
		fmt.Println("PORT не задан, используем 8080")
	}

	// Конвертация строки в число с проверкой
	if n, err := strconv.Atoi("42"); err != nil {
		fmt.Println("Ошибка конвертации:", err)
	} else {
		fmt.Println("Число:", n)
	}
}

func doSomething() error {
	return nil
}
```

### switch

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	// Базовый switch — break НЕ нужен (Go автоматически выходит из case)
	day := "Monday"
	switch day {
	case "Monday":
		fmt.Println("Понедельник")
	case "Tuesday":
		fmt.Println("Вторник")
	case "Saturday", "Sunday": // несколько значений в одном case
		fmt.Println("Выходной!")
	default:
		fmt.Println("Рабочий день")
	}

	// switch с инициализацией
	switch os := runtime.GOOS; os {
	case "linux":
		fmt.Println("Linux")
	case "darwin":
		fmt.Println("macOS")
	case "windows":
		fmt.Println("Windows")
	default:
		fmt.Println("Другая ОС:", os)
	}
}
```

> [!NOTE] switch без break
> В Go **не нужен `break`** в конце каждого case. Это отличие от C/C++/Java, где без `break` выполнение "проваливается" в следующий case.
> 
> Если вам НУЖНО провалиться в следующий case, используйте `fallthrough`:
> ```go
> switch n {
> case 1:
>     fmt.Println("один")
>     fallthrough // провалиться в следующий case
> case 2:
>     fmt.Println("два или один")
> }
> ```
> Однако `fallthrough` используется крайне редко. Если вам нужна эта логика, скорее всего, стоит пересмотреть архитектуру.

### switch без выражения

```go
func classify(n int) string {
	// switch без выражения — аналог цепочки if/else if
	// Каждый case содержит условие
	switch {
	case n < 0:
		return "отрицательное"
	case n == 0:
		return "ноль"
	case n < 100:
		return "маленькое"
	case n < 1000:
		return "среднее"
	default:
		return "большое"
	}
}
```

### Type switch

Type switch позволяет проверить конкретный тип значения интерфейса. Подробнее об интерфейсах в разделе [[#19. Интерфейсы (введение)]].

```go
package main

import "fmt"

func describe(i interface{}) string {
	switch v := i.(type) {
	case int:
		return fmt.Sprintf("целое число: %d", v)
	case string:
		return fmt.Sprintf("строка: %q", v)
	case bool:
		return fmt.Sprintf("булево: %t", v)
	case []int:
		return fmt.Sprintf("слайс int, длина: %d", len(v))
	default:
		return fmt.Sprintf("неизвестный тип: %T", v)
	}
}

func main() {
	fmt.Println(describe(42))        // целое число: 42
	fmt.Println(describe("hello"))   // строка: "hello"
	fmt.Println(describe(true))      // булево: true
	fmt.Println(describe([]int{1}))  // слайс int, длина: 1
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `FizzBuzz(n int) string`, которая для чисел кратных 3 возвращает "Fizz", кратных 5 — "Buzz", кратных 15 — "FizzBuzz", иначе само число как строку
2. Реализуйте калькулятор с помощью switch, принимающий два числа и оператор (+, -, *, /)
3. Напишите функцию, которая принимает `any` (пустой интерфейс) и с помощью type switch возвращает строковое описание типа и значения

---

## 12. Циклы

В Go существует **только один** оператор цикла — `for`. Он покрывает все варианты: классический цикл, while-цикл, бесконечный цикл и итерацию по коллекциям.

### Классический for

```go
package main

import "fmt"

func main() {
	// Классический for: инициализация; условие; пост-действие
	for i := 0; i < 5; i++ {
		fmt.Println(i) // 0, 1, 2, 3, 4
	}

	// Все три части опциональны
	// Только условие (аналог while в других языках)
	n := 1
	for n < 100 {
		n *= 2
	}
	fmt.Println(n) // 128

	// Бесконечный цикл (аналог while true)
	counter := 0
	for {
		counter++
		if counter >= 5 {
			break // выход из цикла
		}
	}
	fmt.Println("Counter:", counter) // 5
}
```

### range — итерация по коллекциям

```go
package main

import "fmt"

func main() {
	// range по слайсу — возвращает индекс и значение
	fruits := []string{"яблоко", "банан", "вишня"}
	for i, fruit := range fruits {
		fmt.Printf("%d: %s\n", i, fruit)
	}

	// Если индекс не нужен
	for _, fruit := range fruits {
		fmt.Println(fruit)
	}

	// Если нужен только индекс
	for i := range fruits {
		fmt.Println(i)
	}

	// range по map — возвращает ключ и значение
	ages := map[string]int{
		"Алиса": 25,
		"Боб":   30,
	}
	for name, age := range ages {
		fmt.Printf("%s: %d\n", name, age)
	}

	// range по строке — возвращает индекс байта и руну
	for i, r := range "Привет" {
		fmt.Printf("byte %d: %c\n", i, r)
	}

	// range по каналу (подробнее в [[05-concurrency]])
	// for val := range ch {
	//     fmt.Println(val)
	// }
}
```

> [!WARNING] Порядок итерации по map
> Порядок итерации по `map` в Go **намеренно рандомизирован**. При каждом запуске программы порядок может быть разным. Не полагайтесь на порядок ключей! Если нужен определённый порядок, сортируйте ключи отдельно.

### break, continue и labels

```go
package main

import "fmt"

func main() {
	// break — выход из цикла
	for i := 0; i < 10; i++ {
		if i == 5 {
			break
		}
		fmt.Println(i) // 0, 1, 2, 3, 4
	}

	// continue — пропуск текущей итерации
	for i := 0; i < 10; i++ {
		if i%2 == 0 {
			continue
		}
		fmt.Println(i) // 1, 3, 5, 7, 9
	}

	// Labels — именованные циклы для выхода из вложенных циклов
outer:
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if i == 1 && j == 1 {
				break outer // выходим из ВНЕШНЕГО цикла
			}
			fmt.Printf("(%d, %d) ", i, j)
		}
	}
	fmt.Println()
	// (0, 0) (0, 1) (0, 2) (1, 0)

	// continue с label — пропуск итерации внешнего цикла
outer2:
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if j == 1 {
				continue outer2 // пропускаем оставшиеся j для текущего i
			}
			fmt.Printf("(%d, %d) ", i, j)
		}
	}
	fmt.Println()
	// (0, 0) (1, 0) (2, 0)
}
```

### Итерация по целым числам (Go 1.22+)

```go
// Начиная с Go 1.22 можно итерировать по целым числам
for i := range 5 {
	fmt.Println(i) // 0, 1, 2, 3, 4
}
```

###### 🏠 Домашнее задание

1. Напишите программу, которая выводит таблицу умножения от 1 до 10 с помощью вложенных циклов
2. Реализуйте поиск простых чисел до N с помощью решета Эратосфена
3. Напишите программу, которая угадывает число (бинарный поиск) от 1 до 100, заданное в коде

---

## 13. Функции

Функции — основной строительный блок программ на Go. Функции в Go являются **объектами первого класса** (first-class citizens): их можно присваивать переменным, передавать как аргументы и возвращать из других функций.

### Объявление функций

```go
package main

import "fmt"

// Простая функция с двумя аргументами и одним возвращаемым значением
func add(a int, b int) int {
	return a + b
}

// Если аргументы одного типа, тип можно указать один раз
func multiply(a, b int) int {
	return a * b
}

// Функция без возвращаемого значения
func greet(name string) {
	fmt.Printf("Привет, %s!\n", name)
}

func main() {
	fmt.Println(add(2, 3))      // 5
	fmt.Println(multiply(4, 5)) // 20
	greet("Gopher")             // Привет, Gopher!
}
```

### Множественные возвращаемые значения

```go
package main

import (
	"errors"
	"fmt"
)

// Go-идиома: возвращаем результат и ошибку
func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("деление на ноль")
	}
	return a / b, nil
}

// Можно возвращать и три значения
func minMax(numbers []int) (min, max int, err error) {
	if len(numbers) == 0 {
		return 0, 0, errors.New("пустой слайс")
	}
	min, max = numbers[0], numbers[0]
	for _, n := range numbers[1:] {
		if n < min {
			min = n
		}
		if n > max {
			max = n
		}
	}
	return min, max, nil
}

func main() {
	result, err := divide(10, 3)
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	fmt.Printf("10 / 3 = %.2f\n", result)

	min, max, err := minMax([]int{3, 1, 4, 1, 5, 9, 2, 6})
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	fmt.Printf("Min: %d, Max: %d\n", min, max)
}
```

### Именованные возвращаемые значения

```go
// Именованные возвращаемые значения создают переменные с zero value
func rectangleProps(length, width float64) (area, perimeter float64) {
	area = length * width
	perimeter = 2 * (length + width)
	// Можно использовать "голый" return — возвращает именованные значения
	return
	// Но лучше указывать явно для читаемости:
	// return area, perimeter
}
```

> [!TIP] Naked return — голый return
> Именованные возвращаемые значения позволяют использовать `return` без аргументов. Это удобно для коротких функций, но в длинных функциях затрудняет чтение. Рекомендация: в функциях длиннее 10 строк всегда указывайте возвращаемые значения явно.

### Вариативные функции (variadic)

```go
package main

import "fmt"

// ... перед типом означает, что функция принимает произвольное количество аргументов
func sum(numbers ...int) int {
	total := 0
	for _, n := range numbers {
		total += n
	}
	return total
}

func main() {
	fmt.Println(sum(1, 2, 3))       // 6
	fmt.Println(sum(1, 2, 3, 4, 5)) // 15
	fmt.Println(sum())               // 0

	// Передача слайса в вариативную функцию через ...
	nums := []int{10, 20, 30}
	fmt.Println(sum(nums...)) // 60
}
```

### Функции как значения и анонимные функции

```go
package main

import (
	"fmt"
	"sort"
)

func main() {
	// Функция как значение — присвоение переменной
	add := func(a, b int) int {
		return a + b
	}
	fmt.Println(add(3, 4)) // 7

	// Немедленно вызываемая анонимная функция (IIFE)
	result := func(x int) int {
		return x * x
	}(5)
	fmt.Println(result) // 25

	// Функция как аргумент (higher-order function)
	numbers := []int{5, 3, 8, 1, 9}
	sort.Slice(numbers, func(i, j int) bool {
		return numbers[i] < numbers[j]
	})
	fmt.Println(numbers) // [1 3 5 8 9]
}
```

### Замыкания (closures)

Замыкание — это функция, которая захватывает переменные из окружающей области видимости:

```go
package main

import "fmt"

// counter возвращает функцию-счётчик
// Каждый вызов возвращённой функции увеличивает внутренний счётчик
func counter(start int) func() int {
	count := start
	return func() int {
		count++ // замыкание захватывает переменную count
		return count
	}
}

// adder возвращает функцию, которая прибавляет фиксированное значение
func adder(x int) func(int) int {
	return func(y int) int {
		return x + y
	}
}

func main() {
	// Каждый вызов counter() создаёт независимый счётчик
	c1 := counter(0)
	c2 := counter(100)

	fmt.Println(c1()) // 1
	fmt.Println(c1()) // 2
	fmt.Println(c1()) // 3
	fmt.Println(c2()) // 101
	fmt.Println(c2()) // 102

	add5 := adder(5)
	fmt.Println(add5(3))  // 8
	fmt.Println(add5(10)) // 15
}
```

### Функции высшего порядка

```go
package main

import "fmt"

// apply принимает функцию и применяет её к каждому элементу слайса
func apply(numbers []int, fn func(int) int) []int {
	result := make([]int, len(numbers))
	for i, n := range numbers {
		result[i] = fn(n)
	}
	return result
}

// filter возвращает элементы, удовлетворяющие предикату
func filter(numbers []int, predicate func(int) bool) []int {
	var result []int
	for _, n := range numbers {
		if predicate(n) {
			result = append(result, n)
		}
	}
	return result
}

func main() {
	nums := []int{1, 2, 3, 4, 5}

	doubled := apply(nums, func(n int) int { return n * 2 })
	fmt.Println(doubled) // [2 4 6 8 10]

	even := filter(nums, func(n int) bool { return n%2 == 0 })
	fmt.Println(even) // [2 4]
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `Map[T, U](slice []T, fn func(T) U) []U` с использованием дженериков (Go 1.18+)
2. Реализуйте функцию `Compose(f, g func(int) int) func(int) int`, которая возвращает композицию двух функций
3. Создайте генератор чисел Фибоначчи с помощью замыкания: `fib := fibonacci()`, `fib()` = 0, `fib()` = 1, `fib()` = 1, `fib()` = 2, ...

---

## 14. Defer, panic, recover

### defer — отложенное выполнение

`defer` откладывает выполнение функции до момента выхода из текущей функции. Это гарантирует освобождение ресурсов даже при ошибках.

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// defer выполняется при выходе из функции
	fmt.Println("Начало")
	defer fmt.Println("Конец (defer)") // выполнится последним
	fmt.Println("Середина")
	// Вывод:
	// Начало
	// Середина
	// Конец (defer)
}

// Практический пример: закрытие файла
func readFile(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close() // файл гарантированно закроется при выходе из функции

	// ... работа с файлом ...
	return nil
}
```

### defer выполняется в порядке LIFO

```go
func main() {
	// Несколько defer выполняются в обратном порядке (стек — LIFO)
	for i := 0; i < 5; i++ {
		defer fmt.Printf("%d ", i)
	}
	// Вывод: 4 3 2 1 0
}
```

> [!WARNING] Аргументы defer вычисляются немедленно
> Аргументы отложенной функции вычисляются в момент объявления `defer`, а не в момент выполнения:
> ```go
> x := 10
> defer fmt.Println(x) // выведет 10, а не 20
> x = 20
> ```
> Если нужно захватить актуальное значение, используйте замыкание:
> ```go
> x := 10
> defer func() { fmt.Println(x) }() // выведет 20
> x = 20
> ```

### panic — паника

`panic` немедленно прерывает нормальное выполнение функции. Все отложенные (`defer`) функции выполняются, затем паника передаётся вверх по стеку вызовов.

```go
package main

import "fmt"

func main() {
	fmt.Println("Начало")
	defer fmt.Println("defer в main") // выполнится даже при панике

	riskyFunction()
	fmt.Println("Эта строка не выполнится")
}

func riskyFunction() {
	defer fmt.Println("defer в riskyFunction")
	panic("что-то пошло не так!")
	// Код после panic недостижим
}
// Вывод:
// Начало
// defer в riskyFunction
// defer в main
// panic: что-то пошло не так!
```

> [!WARNING] Не используйте panic для обычных ошибок
> `panic` предназначена только для действительно фатальных ситуаций: нарушение инвариантов, невозможность инициализации критического ресурса. Для всех остальных случаев используйте возвращаемые ошибки (`error`). Подробнее в разделе [[#20. Обработка ошибок]].

### recover — восстановление после паники

`recover` позволяет перехватить панику и продолжить выполнение. Работает **только внутри отложенной функции**:

```go
package main

import "fmt"

func safeDiv(a, b int) (result int, err error) {
	// recover перехватывает панику
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("паника перехвачена: %v", r)
		}
	}()

	// Эта строка вызовет панику при b == 0
	return a / b, nil
}

func main() {
	result, err := safeDiv(10, 0)
	if err != nil {
		fmt.Println("Ошибка:", err)
	} else {
		fmt.Println("Результат:", result)
	}
	// Программа продолжает работать после перехваченной паники
	fmt.Println("Программа продолжает работу")
}
```

### Функция init()

Каждый пакет может содержать функцию `init()`, которая вызывается автоматически при импорте пакета:

```go
package main

import "fmt"

// init вызывается автоматически перед main
// Можно иметь несколько init() в одном файле и в разных файлах пакета
func init() {
	fmt.Println("init() выполнена")
}

func main() {
	fmt.Println("main() выполнена")
}
// Вывод:
// init() выполнена
// main() выполнена
```

> [!INFO] Порядок инициализации
> 1. Сначала инициализируются импортированные пакеты (рекурсивно)
> 2. Затем переменные уровня пакета
> 3. Затем функции `init()` (в порядке их появления в файле)
> 4. Наконец, `main()`
> 
> Избегайте сложной логики в `init()`. Предпочитайте явную инициализацию через конструкторы.

###### 🏠 Домашнее задание

1. Напишите функцию, которая открывает файл, пишет в него данные и закрывает, используя `defer`. Убедитесь, что файл закрывается даже при ошибке записи
2. Реализуйте `safeExecute(fn func()) (err error)`, которая перехватывает любую панику внутри `fn` и возвращает ошибку
3. Создайте пакет с `init()`, который проверяет наличие переменной окружения и паникует, если её нет

---

## 15. Указатели

Указатели хранят адрес переменной в памяти. В отличие от C/C++, в Go нет арифметики указателей, что делает их безопасными.

### Основы

```go
package main

import "fmt"

func main() {
	x := 42

	// & — получить адрес переменной
	p := &x
	fmt.Println(p)  // 0xc000012088 (адрес в памяти)
	fmt.Println(*p) // 42 (значение по адресу — разыменование)

	// Изменение значения через указатель
	*p = 100
	fmt.Println(x) // 100 — значение x изменилось

	// Объявление указателя с типом
	var ptr *int // нулевой указатель (nil)
	fmt.Println(ptr) // <nil>

	// new() — создаёт переменную и возвращает указатель
	q := new(int) // *int, значение *q = 0 (zero value)
	*q = 55
	fmt.Println(*q) // 55
}
```

### Указатели в функциях

```go
package main

import "fmt"

// Без указателя — функция работает с КОПИЕЙ
func doubleValue(n int) {
	n *= 2 // изменяется только локальная копия
}

// С указателем — функция изменяет ОРИГИНАЛ
func doublePointer(n *int) {
	*n *= 2 // изменяется значение по адресу
}

func main() {
	x := 10

	doubleValue(x)
	fmt.Println(x) // 10 — не изменилось

	doublePointer(&x)
	fmt.Println(x) // 20 — изменилось
}
```

### Когда использовать указатели

```go
// 1. Когда нужно изменить значение аргумента
func increment(count *int) {
	*count++
}

// 2. Когда структура большая и копирование дорого
type BigStruct struct {
	Data [1024]byte
	// ... много полей
}

func process(s *BigStruct) {
	// работаем с указателем, не копируя 1024+ байт
}

// 3. Когда нужна семантика nil (значение может отсутствовать)
type Config struct {
	Timeout *int // nil означает "использовать значение по умолчанию"
}

// 4. При реализации интерфейсов через pointer receiver
type Service struct {
	counter int
}

func (s *Service) Increment() { // pointer receiver
	s.counter++
}
```

> [!TIP] Когда НЕ нужны указатели
> - Маленькие типы (`int`, `bool`, `float64`) — копирование дешевле разыменования
> - `slice`, `map`, `channel` — уже содержат внутренний указатель
> - `string` — неизменяемая, передача по значению не копирует данные
> - Когда не нужно изменять аргумент — передавайте по значению (безопаснее)

> [!WARNING] nil pointer dereference
> Разыменование nil-указателя вызывает панику:
> ```go
> var p *int // nil
> fmt.Println(*p) // panic: runtime error: invalid memory address
> ```
> Всегда проверяйте указатель на nil перед разыменованием.

###### 🏠 Домашнее задание

1. Напишите функцию `Swap(a, b *int)`, которая меняет значения двух переменных местами через указатели
2. Создайте структуру `Counter` с методом `Increment()` на pointer receiver и `Value()` на value receiver. Объясните, почему `Increment` должен быть на pointer receiver
3. Напишите функцию, которая принимает `*int` и возвращает ошибку, если указатель nil

---

## 16. Массивы и слайсы

### Массивы

Массив — это коллекция фиксированного размера. Размер является частью типа: `[3]int` и `[5]int` — это разные типы.

```go
package main

import "fmt"

func main() {
	// Объявление массива
	var a [5]int // [0, 0, 0, 0, 0]
	a[0] = 10
	a[1] = 20
	fmt.Println(a) // [10 20 0 0 0]

	// Инициализация при создании
	b := [3]string{"Go", "Rust", "Python"}
	fmt.Println(b) // [Go Rust Python]

	// Размер определяется автоматически
	c := [...]int{1, 2, 3, 4, 5}
	fmt.Println(len(c)) // 5

	// Массивы передаются по ЗНАЧЕНИЮ (копируются)
	d := [3]int{1, 2, 3}
	e := d   // e — это копия d
	e[0] = 100
	fmt.Println(d) // [1 2 3] — не изменился
	fmt.Println(e) // [100 2 3]
}
```

### Слайсы — динамические массивы

Слайс (срез) — это ссылка на подмассив. Он состоит из трёх компонентов: указатель на массив, длина (len) и ёмкость (cap).

```go
package main

import "fmt"

func main() {
	// Создание слайса
	s1 := []int{1, 2, 3, 4, 5} // литерал слайса (без размера в скобках)
	fmt.Println(s1, len(s1), cap(s1)) // [1 2 3 4 5] 5 5

	// make — создание слайса с заданной длиной и ёмкостью
	s2 := make([]int, 3)    // длина 3, ёмкость 3, заполнен нулями
	s3 := make([]int, 3, 10) // длина 3, ёмкость 10

	fmt.Println(s2, len(s2), cap(s2)) // [0 0 0] 3 3
	fmt.Println(s3, len(s3), cap(s3)) // [0 0 0] 3 10

	// Нулевой слайс (nil)
	var s4 []int
	fmt.Println(s4 == nil)    // true
	fmt.Println(len(s4))      // 0
	fmt.Println(cap(s4))      // 0
	// s4 = append(s4, 1) // nil слайс можно использовать с append
}
```

### append — добавление элементов

```go
package main

import "fmt"

func main() {
	var s []int

	// append возвращает новый слайс (может переаллоцировать)
	s = append(s, 1)
	s = append(s, 2, 3)
	s = append(s, []int{4, 5, 6}...) // добавление другого слайса через ...
	fmt.Println(s) // [1 2 3 4 5 6]

	// Стратегия роста: ёмкость примерно удваивается
	s2 := make([]int, 0)
	for i := 0; i < 10; i++ {
		s2 = append(s2, i)
		fmt.Printf("len=%d cap=%d %v\n", len(s2), cap(s2), s2)
	}
}
```

### Slice expressions — срезы от слайсов

```go
package main

import "fmt"

func main() {
	s := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

	// s[low:high] — элементы от low до high-1
	fmt.Println(s[2:5])  // [2 3 4]
	fmt.Println(s[:3])   // [0 1 2]    (от начала)
	fmt.Println(s[7:])   // [7 8 9]    (до конца)
	fmt.Println(s[:])    // [0 1 2 ... 9] (копия ссылки)

	// Three-index slice: s[low:high:max]
	// Ограничивает ёмкость результирующего слайса
	sub := s[2:5:5] // len=3, cap=3 (а не cap=8, как было бы с s[2:5])
	fmt.Println(sub, len(sub), cap(sub)) // [2 3 4] 3 3
}
```

### Общий базовый массив — важная ловушка

> [!WARNING] Слайсы разделяют базовый массив!
> Несколько слайсов могут ссылаться на один и тот же массив. Изменение одного слайса может повлиять на другой. Это одна из самых частых ошибок в Go.
> 
> ```go
> a := []int{1, 2, 3, 4, 5}
> b := a[1:3] // b = [2, 3], но b ссылается на тот же массив, что и a
> b[0] = 99
> fmt.Println(a) // [1 99 3 4 5] — a изменился!
> ```
> 
> Чтобы получить независимую копию, используйте `copy()` или three-index slice.

### copy — копирование слайсов

```go
package main

import "fmt"

func main() {
	src := []int{1, 2, 3, 4, 5}

	// copy создаёт независимую копию данных
	dst := make([]int, len(src))
	copied := copy(dst, src) // возвращает количество скопированных элементов
	fmt.Println(dst, copied) // [1 2 3 4 5] 5

	// Теперь dst независим от src
	dst[0] = 100
	fmt.Println(src) // [1 2 3 4 5] — не изменился
}
```

### Удаление элементов из слайса

```go
package main

import "fmt"

func main() {
	s := []int{1, 2, 3, 4, 5}

	// Удаление элемента по индексу i (с сохранением порядка)
	i := 2
	s = append(s[:i], s[i+1:]...)
	fmt.Println(s) // [1 2 4 5]

	// Быстрое удаление (без сохранения порядка) — O(1)
	s2 := []int{1, 2, 3, 4, 5}
	j := 2
	s2[j] = s2[len(s2)-1] // заменяем удаляемый на последний
	s2 = s2[:len(s2)-1]    // отсекаем последний
	fmt.Println(s2)         // [1 2 5 4]
}
```

### Фильтрация без аллокации

```go
// Фильтрация слайса, переиспользуя тот же массив (без аллокации нового)
func filterInPlace(s []int, keep func(int) bool) []int {
	n := 0
	for _, v := range s {
		if keep(v) {
			s[n] = v
			n++
		}
	}
	return s[:n]
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `Unique(s []int) []int`, которая возвращает слайс без дубликатов
2. Реализуйте стек на базе слайса с методами `Push`, `Pop`, `Peek`, `IsEmpty`
3. Продемонстрируйте проблему разделяемого массива: создайте два слайса от одного массива и покажите, как изменение одного влияет на другой. Затем исправьте проблему с помощью `copy`

---

## 17. Maps

Map (карта/словарь) — это неупорядоченная коллекция пар ключ-значение. Аналог HashMap в Java или dict в Python.

### Создание и основные операции

```go
package main

import "fmt"

func main() {
	// Создание через литерал
	ages := map[string]int{
		"Алиса": 25,
		"Боб":   30,
		"Карл":  35,
	}
	fmt.Println(ages) // map[Алиса:25 Боб:30 Карл:35]

	// Создание через make
	scores := make(map[string]int)

	// Запись
	scores["математика"] = 95
	scores["физика"] = 88

	// Чтение
	fmt.Println(scores["математика"]) // 95

	// Чтение несуществующего ключа возвращает zero value
	fmt.Println(scores["химия"]) // 0 (zero value для int)

	// Удаление
	delete(ages, "Карл")
	fmt.Println(ages) // map[Алиса:25 Боб:30]

	// Размер
	fmt.Println(len(ages)) // 2
}
```

### comma-ok идиома

```go
func main() {
	ages := map[string]int{
		"Алиса": 25,
		"Боб":   0, // Бобу 0 лет? Или ключа нет?
	}

	// Проблема: ages["Неизвестный"] тоже вернёт 0
	// Как отличить "ключ есть, значение 0" от "ключа нет"?

	// Решение: comma-ok идиома
	age, ok := ages["Боб"]
	if ok {
		fmt.Println("Боб найден, возраст:", age) // 0
	}

	age, ok = ages["Неизвестный"]
	if !ok {
		fmt.Println("Неизвестный не найден") // этот вариант
	}

	// Часто используется в одну строку:
	if age, ok := ages["Алиса"]; ok {
		fmt.Println("Алиса:", age)
	}
}
```

### Итерация по map

```go
func main() {
	m := map[string]int{"a": 1, "b": 2, "c": 3}

	// Итерация — порядок НЕ гарантирован
	for key, value := range m {
		fmt.Printf("%s: %d\n", key, value)
	}

	// Только ключи
	for key := range m {
		fmt.Println(key)
	}
}
```

> [!WARNING] Maps не безопасны для конкурентного доступа!
> Одновременное чтение и запись в map из разных горутин вызовет **panic**:
> ```
> fatal error: concurrent map read and map write
> ```
> Для конкурентного доступа используйте `sync.RWMutex` или `sync.Map`. Подробнее в [[05-concurrency]].

### Практические паттерны

```go
package main

import (
	"fmt"
	"sort"
)

func main() {
	// Map как множество (set)
	seen := make(map[string]bool)
	words := []string{"go", "rust", "go", "python", "go"}
	for _, w := range words {
		seen[w] = true
	}
	fmt.Println(seen) // map[go:true python:true rust:true]

	// Или через struct{} (экономит память)
	set := make(map[string]struct{})
	for _, w := range words {
		set[w] = struct{}{}
	}
	if _, exists := set["go"]; exists {
		fmt.Println("go is in set")
	}

	// Итерация в отсортированном порядке
	ages := map[string]int{"Карл": 35, "Алиса": 25, "Боб": 30}
	keys := make([]string, 0, len(ages))
	for k := range ages {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		fmt.Printf("%s: %d\n", k, ages[k])
	}

	// Группировка данных
	students := []struct {
		Name  string
		Grade string
	}{
		{"Алиса", "A"},
		{"Боб", "B"},
		{"Карл", "A"},
		{"Дана", "B"},
	}

	byGrade := make(map[string][]string)
	for _, s := range students {
		byGrade[s.Grade] = append(byGrade[s.Grade], s.Name)
	}
	fmt.Println(byGrade) // map[A:[Алиса Карл] B:[Боб Дана]]
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `InvertMap(m map[string]int) map[int][]string`, которая инвертирует map (значения становятся ключами, ключи — значениями)
2. Реализуйте простой кеш на базе map с методами `Get`, `Set`, `Delete`
3. Напишите программу, которая считает частоту символов в строке, используя `map[rune]int`

---

## 18. Структуры

Структуры — основной способ создания пользовательских типов в Go. В отличие от классов в ООП-языках, структуры не поддерживают наследование, но поддерживают **композицию** через встраивание.

### Определение и создание

```go
package main

import (
	"encoding/json"
	"fmt"
)

// Определение структуры
type User struct {
	ID        int    `json:"id" db:"id"`
	Name      string `json:"name" db:"name"`
	Email     string `json:"email" db:"email"`
	Age       int    `json:"age,omitempty" db:"age"` // omitempty — не включать в JSON если 0
	isActive  bool   // неэкспортированное поле (строчная буква)
}

func main() {
	// Создание экземпляра — все поля
	u1 := User{
		ID:    1,
		Name:  "Алиса",
		Email: "alice@example.com",
		Age:   25,
	}
	fmt.Println(u1)

	// Создание экземпляра — по порядку полей (НЕ рекомендуется)
	// u2 := User{2, "Боб", "bob@example.com", 30, true}

	// Zero value — все поля получают нулевые значения
	var u3 User
	fmt.Println(u3) // {0  "" "" 0 false}

	// Указатель на структуру
	u4 := &User{Name: "Карл", Email: "carl@example.com"}

	// Доступ к полям через . (автоматическое разыменование для указателей)
	fmt.Println(u4.Name) // Карл (не нужно (*u4).Name)

	// Структурные теги и JSON
	data, _ := json.Marshal(u1)
	fmt.Println(string(data))
	// {"id":1,"name":"Алиса","email":"alice@example.com","age":25}
}
```

### Функции-конструкторы

В Go нет конструкторов в привычном смысле. Вместо этого используют функции с префиксом `New`:

```go
package main

import (
	"errors"
	"fmt"
	"strings"
)

type User struct {
	ID    int
	Name  string
	Email string
}

// NewUser — функция-конструктор с валидацией
func NewUser(id int, name, email string) (*User, error) {
	if name == "" {
		return nil, errors.New("имя не может быть пустым")
	}
	if !strings.Contains(email, "@") {
		return nil, errors.New("некорректный email")
	}

	return &User{
		ID:    id,
		Name:  name,
		Email: email,
	}, nil
}

func main() {
	user, err := NewUser(1, "Алиса", "alice@example.com")
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	fmt.Println(user)
}
```

### Методы — value receiver vs pointer receiver

```go
package main

import "fmt"

type Rectangle struct {
	Width  float64
	Height float64
}

// Value receiver — метод получает КОПИЮ структуры
// Используйте, когда метод не изменяет структуру
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// Value receiver — метод для строкового представления
func (r Rectangle) String() string {
	return fmt.Sprintf("Rectangle(%.1f x %.1f)", r.Width, r.Height)
}

// Pointer receiver — метод получает УКАЗАТЕЛЬ на структуру
// Используйте, когда метод изменяет структуру
func (r *Rectangle) Scale(factor float64) {
	r.Width *= factor
	r.Height *= factor
}

func main() {
	rect := Rectangle{Width: 10, Height: 5}
	fmt.Println(rect.Area())   // 50
	fmt.Println(rect.String()) // Rectangle(10.0 x 5.0)

	rect.Scale(2)
	fmt.Println(rect) // Rectangle(20.0 x 10.0)
}
```

> [!TIP] Когда какой receiver использовать?
> **Pointer receiver (*T):**
> - Метод изменяет состояние структуры
> - Структура большая и копирование дорого
> - Нужна согласованность — если хотя бы один метод на pointer receiver, делайте все методы на pointer receiver
>
> **Value receiver (T):**
> - Метод не изменяет состояние
> - Структура маленькая (int, small struct)
> - Типы-значения: time.Time, net.IP и подобные

### Встраивание структур (composition)

```go
package main

import "fmt"

// Базовая структура
type Address struct {
	City    string
	Country string
}

func (a Address) FullAddress() string {
	return fmt.Sprintf("%s, %s", a.City, a.Country)
}

// Employee встраивает Address — это композиция, НЕ наследование
type Employee struct {
	Name    string
	Address // встроенная структура (embedded field)
	Salary  float64
}

func main() {
	emp := Employee{
		Name: "Алиса",
		Address: Address{
			City:    "Москва",
			Country: "Россия",
		},
		Salary: 150000,
	}

	// Поля встроенной структуры доступны напрямую
	fmt.Println(emp.City)           // Москва (не emp.Address.City)
	fmt.Println(emp.FullAddress())  // Москва, Россия

	// Но можно и явно:
	fmt.Println(emp.Address.City)   // Москва
}
```

> [!NOTE] Композиция вместо наследования
> В Go нет наследования. Вместо него используется **встраивание** (embedding). Встроенная структура — это не родитель, а компонент. Employee не является Address, но содержит Address. Это важное архитектурное отличие от Java/C++/Python.
> Подробнее о проектировании с композицией — в [[Selfgo]].

###### 🏠 Домашнее задание

1. Создайте структуру `Product` с полями Name, Price, Quantity и тегами для JSON. Напишите конструктор `NewProduct` с валидацией (цена > 0, количество >= 0)
2. Реализуйте методы `TotalCost()` (value receiver) и `ApplyDiscount(percent float64)` (pointer receiver)
3. Создайте структуру `Order`, которая встраивает `Customer` и содержит слайс `Product`. Реализуйте метод `GrandTotal()`

---

## 19. Интерфейсы (введение)

Интерфейс в Go — это набор сигнатур методов. Тип реализует интерфейс **неявно** — достаточно реализовать все методы интерфейса. Не нужно объявлять `implements`. Подробнее об интерфейсах — в [[02-os-and-fs]] и [[03-networking]].

### Базовое использование

```go
package main

import (
	"fmt"
	"math"
)

// Интерфейс — набор сигнатур методов
type Shape interface {
	Area() float64
	Perimeter() float64
}

// Circle реализует Shape неявно
type Circle struct {
	Radius float64
}

func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

// Rectangle тоже реализует Shape
type Rectangle struct {
	Width, Height float64
}

func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// Функция принимает интерфейс — работает с любой фигурой
func printShapeInfo(s Shape) {
	fmt.Printf("Площадь: %.2f, Периметр: %.2f\n", s.Area(), s.Perimeter())
}

func main() {
	c := Circle{Radius: 5}
	r := Rectangle{Width: 10, Height: 3}

	printShapeInfo(c) // Площадь: 78.54, Периметр: 31.42
	printShapeInfo(r) // Площадь: 30.00, Периметр: 26.00

	// Слайс интерфейсов — полиморфизм
	shapes := []Shape{c, r, Circle{Radius: 1}}
	for _, s := range shapes {
		printShapeInfo(s)
	}
}
```

### Пустой интерфейс (any)

```go
func main() {
	// interface{} (или any с Go 1.18) принимает ЛЮБОЙ тип
	var x any = 42
	fmt.Println(x)

	x = "hello"
	fmt.Println(x)

	x = []int{1, 2, 3}
	fmt.Println(x)
}
```

### Type assertion — утверждение типа

```go
func main() {
	var i interface{} = "hello"

	// Type assertion — утверждаем, что i содержит string
	s := i.(string)
	fmt.Println(s) // "hello"

	// Безопасная проверка с comma-ok
	n, ok := i.(int)
	if !ok {
		fmt.Println("i — это не int") // этот вариант
	}
	_ = n

	// Type switch — проверка нескольких типов
	switch v := i.(type) {
	case string:
		fmt.Println("string:", v)
	case int:
		fmt.Println("int:", v)
	default:
		fmt.Println("неизвестный тип:", v)
	}
}
```

### Композиция интерфейсов

```go
// Маленькие интерфейсы — лучшая практика в Go
type Reader interface {
	Read(p []byte) (n int, err error)
}

type Writer interface {
	Write(p []byte) (n int, err error)
}

type Closer interface {
	Close() error
}

// Композиция интерфейсов
type ReadWriter interface {
	Reader
	Writer
}

type ReadWriteCloser interface {
	Reader
	Writer
	Closer
}
```

### Стандартные интерфейсы

```go
package main

import "fmt"

// fmt.Stringer — строковое представление
type User struct {
	Name string
	Age  int
}

func (u User) String() string {
	return fmt.Sprintf("%s (%d лет)", u.Name, u.Age)
}

// error — встроенный интерфейс для ошибок
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("поле %s: %s", e.Field, e.Message)
}

func main() {
	u := User{Name: "Алиса", Age: 25}
	fmt.Println(u) // Алиса (25 лет) — используется Stringer

	var err error = &ValidationError{Field: "email", Message: "некорректный формат"}
	fmt.Println(err) // поле email: некорректный формат
}
```

> [!summary] Принцип: "Accept interfaces, return structs"
> Один из важнейших принципов Go: функции должны принимать интерфейсы (для гибкости) и возвращать конкретные типы (для ясности).
> ```go
> // Хорошо: принимаем io.Reader (можно подставить файл, HTTP body, буфер...)
> func process(r io.Reader) (*Result, error) { ... }
> 
> // Плохо: принимаем конкретный тип
> func process(f *os.File) (*Result, error) { ... }
> ```

###### 🏠 Домашнее задание

1. Создайте интерфейс `Storage` с методами `Save(key string, value any) error` и `Load(key string) (any, error)`. Реализуйте его для хранения в памяти (`MemoryStorage`) и в файле (`FileStorage`)
2. Реализуйте интерфейс `sort.Interface` (Len, Less, Swap) для сортировки слайса структур по разным полям
3. Напишите функцию, которая принимает `fmt.Stringer` и возвращает строку в верхнем регистре

---

## 20. Обработка ошибок

Обработка ошибок — одна из центральных тем в Go. Ошибки — это обычные значения, которые возвращаются из функций.

### Интерфейс error

```go
// Встроенный интерфейс (определён в пакете builtin)
type error interface {
	Error() string
}
```

### Базовые способы создания ошибок

```go
package main

import (
	"errors"
	"fmt"
)

func main() {
	// errors.New — простая ошибка
	err1 := errors.New("что-то пошло не так")
	fmt.Println(err1)

	// fmt.Errorf — форматированная ошибка
	name := "config.yaml"
	err2 := fmt.Errorf("файл %s не найден", name)
	fmt.Println(err2)
}
```

### Паттерн "if err != nil"

```go
package main

import (
	"fmt"
	"os"
	"strconv"
)

func readConfig(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("readConfig: %w", err) // оборачиваем ошибку
	}
	return string(data), nil
}

func main() {
	// Стандартный паттерн обработки ошибок в Go
	config, err := readConfig("config.yaml")
	if err != nil {
		fmt.Println("Ошибка:", err)
		// Решаем, что делать: выходить, использовать значение по умолчанию и т.д.
		return
	}
	fmt.Println("Конфиг:", config)

	// Конвертация с проверкой ошибки
	n, err := strconv.Atoi("not-a-number")
	if err != nil {
		fmt.Println("Ошибка конвертации:", err)
		return
	}
	fmt.Println(n)
}
```

### Sentinel errors — именованные ошибки

```go
package main

import (
	"errors"
	"fmt"
)

// Sentinel errors — объявляются как переменные пакета
// По конвенции начинаются с Err
var (
	ErrNotFound     = errors.New("не найдено")
	ErrUnauthorized = errors.New("не авторизован")
	ErrForbidden    = errors.New("доступ запрещён")
)

type UserStore struct {
	users map[int]string
}

func (s *UserStore) GetUser(id int) (string, error) {
	user, ok := s.users[id]
	if !ok {
		return "", ErrNotFound
	}
	return user, nil
}

func main() {
	store := &UserStore{users: map[int]string{1: "Алиса"}}

	user, err := store.GetUser(999)
	if err != nil {
		// Проверка конкретной ошибки через errors.Is
		if errors.Is(err, ErrNotFound) {
			fmt.Println("Пользователь не найден")
		} else {
			fmt.Println("Неизвестная ошибка:", err)
		}
		return
	}
	fmt.Println(user)
}
```

### Оборачивание ошибок (wrapping)

```go
package main

import (
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("не найдено")

func getFromDB(id int) error {
	return ErrNotFound
}

func getUser(id int) error {
	err := getFromDB(id)
	if err != nil {
		// %w оборачивает ошибку — сохраняет цепочку
		return fmt.Errorf("getUser(id=%d): %w", id, err)
	}
	return nil
}

func handleRequest() error {
	err := getUser(42)
	if err != nil {
		return fmt.Errorf("handleRequest: %w", err)
	}
	return nil
}

func main() {
	err := handleRequest()
	if err != nil {
		fmt.Println(err)
		// handleRequest: getUser(id=42): не найдено

		// errors.Is проходит по всей цепочке обёрток
		if errors.Is(err, ErrNotFound) {
			fmt.Println("Причина: не найдено")
		}
	}
}
```

### Кастомные ошибки

```go
package main

import (
	"errors"
	"fmt"
)

// Кастомный тип ошибки
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("валидация поля %q: %s", e.Field, e.Message)
}

// Кастомная ошибка с Unwrap для цепочки
type AppError struct {
	Code    int
	Message string
	Err     error // вложенная ошибка
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func validate(email string) error {
	if email == "" {
		return &ValidationError{Field: "email", Message: "не может быть пустым"}
	}
	return nil
}

func createUser(email string) error {
	err := validate(email)
	if err != nil {
		return &AppError{
			Code:    400,
			Message: "ошибка создания пользователя",
			Err:     err,
		}
	}
	return nil
}

func main() {
	err := createUser("")
	if err != nil {
		fmt.Println(err)
		// [400] ошибка создания пользователя: валидация поля "email": не может быть пустым

		// errors.As — извлечение конкретного типа ошибки из цепочки
		var validErr *ValidationError
		if errors.As(err, &validErr) {
			fmt.Printf("Поле с ошибкой: %s\n", validErr.Field)
		}

		var appErr *AppError
		if errors.As(err, &appErr) {
			fmt.Printf("Код ошибки: %d\n", appErr.Code)
		}
	}
}
```

### errors.Join (Go 1.20+)

```go
package main

import (
	"errors"
	"fmt"
)

func validateForm(name, email string) error {
	var errs []error

	if name == "" {
		errs = append(errs, errors.New("имя обязательно"))
	}
	if email == "" {
		errs = append(errs, errors.New("email обязателен"))
	}

	// errors.Join объединяет несколько ошибок в одну
	return errors.Join(errs...)
}

func main() {
	err := validateForm("", "")
	if err != nil {
		fmt.Println(err)
		// имя обязательно
		// email обязателен
	}
}
```

> [!WARNING] Не используйте panic для обычных ошибок
> `panic` предназначена для по-настоящему фатальных ситуаций (нарушение инвариантов, невозможность запуска). Для бизнес-логики, ввода-вывода, сети и любых ожидаемых ошибок используйте `error`. Подробнее в разделе [[#14. Defer, panic, recover]].

###### 🏠 Домашнее задание

1. Создайте свой тип ошибки `HTTPError` с полями `StatusCode`, `Message` и методом `Error()`. Оберните его через `%w` в другую ошибку и извлеките обратно через `errors.As`
2. Напишите функцию, которая валидирует структуру `User` (имя не пустое, возраст > 0, email содержит @) и возвращает объединённую ошибку через `errors.Join`
3. Реализуйте цепочку вызовов (handler -> service -> repository), где каждый уровень оборачивает ошибку с добавлением контекста. Проверьте, что `errors.Is` находит корневую ошибку через все обёртки

---

## 21. Инструменты

Go поставляется с богатым набором встроенных инструментов. Подробнее об инструментах и CI/CD — в [[08-tools]].

### Основные команды

```bash
# Форматирование кода — ОБЯЗАТЕЛЬНО, единый стиль для всего Go-кода
go fmt ./...

# Статический анализ — находит подозрительные конструкции
go vet ./...

# Сборка
go build                          # собрать текущий модуль
go build -o myapp ./cmd/server    # собрать с указанием выходного файла

# Запуск без сборки
go run main.go
go run ./cmd/server

# Тесты (подробнее в отдельной главе)
go test ./...                     # запустить все тесты
go test -v ./...                  # с подробным выводом
go test -race ./...               # с детектором гонок
go test -cover ./...              # с покрытием кода

# Управление зависимостями
go mod tidy                       # очистка и синхронизация зависимостей
go mod download                   # скачать зависимости
go mod vendor                     # копировать зависимости в vendor/

# Генерация кода
go generate ./...                 # выполнить директивы //go:generate

# Установка утилит
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### golangci-lint

`golangci-lint` — агрегатор линтеров, который запускает десятки проверок за один проход. Это стандарт индустрии для Go-проектов:

```bash
# Установка
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Запуск
golangci-lint run ./...

# С авто-исправлением (где возможно)
golangci-lint run --fix ./...
```

> [!TIP] Рекомендуемый минимум для проекта
> 1. `go fmt` — форматирование (обязательно, обычно в pre-commit hook)
> 2. `go vet` — базовый статический анализ
> 3. `golangci-lint` — расширенный анализ
> 4. `go test -race` — тесты с детектором гонок
> 
> В CI/CD все эти команды должны выполняться автоматически.

###### 🏠 Домашнее задание

1. Установите `golangci-lint` и запустите его на своём проекте. Исправьте все найденные замечания
2. Настройте `go vet` и `go fmt` для автоматического запуска (например, через Makefile или pre-commit hook)
3. Изучите вывод `go test -cover` — какой процент покрытия у вашего кода?

---

## 22. Сквозной проект: CLI Todo-приложение

Применим все полученные знания для создания полноценного CLI-приложения для управления задачами (todo list). Проект использует: структуры, слайсы, map, ошибки, файловый ввод-вывод, пакет `flag`.

### Структура проекта

```
todo-cli/
├── go.mod
├── main.go
└── todo/
    └── todo.go
```

### Инициализация модуля

```bash
mkdir todo-cli && cd todo-cli
go mod init todo-cli
mkdir todo
```

### Файл todo/todo.go — бизнес-логика

```go
// Пакет todo содержит бизнес-логику для работы с задачами.
// Этот пакет не знает о CLI, файлах или базах данных —
// он только работает со структурами данных.
package todo

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"
)

// Sentinel errors — ошибки, которые можно проверить через errors.Is
var (
	ErrNotFound     = errors.New("задача не найдена")
	ErrEmptyTitle   = errors.New("название задачи не может быть пустым")
	ErrAlreadyDone  = errors.New("задача уже выполнена")
)

// Status — статус задачи (используем iota)
type Status int

const (
	StatusPending    Status = iota // 0 — ожидает выполнения
	StatusInProgress               // 1 — в работе
	StatusDone                     // 2 — выполнена
)

// String реализует fmt.Stringer для красивого вывода
func (s Status) String() string {
	switch s {
	case StatusPending:
		return "ожидает"
	case StatusInProgress:
		return "в работе"
	case StatusDone:
		return "выполнена"
	default:
		return "неизвестно"
	}
}

// Todo — структура задачи с JSON-тегами для сериализации
type Todo struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Status    Status    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	DoneAt    time.Time `json:"done_at,omitempty"`
}

// String реализует fmt.Stringer
func (t Todo) String() string {
	mark := "[ ]"
	if t.Status == StatusDone {
		mark = "[x]"
	} else if t.Status == StatusInProgress {
		mark = "[~]"
	}
	return fmt.Sprintf("%s #%d: %s (%s)", mark, t.ID, t.Title, t.Status)
}

// Store хранит задачи и управляет ими
type Store struct {
	todos    []Todo
	nextID   int
	filePath string
}

// NewStore создаёт хранилище задач с привязкой к файлу
func NewStore(filePath string) *Store {
	return &Store{
		todos:    make([]Todo, 0),
		nextID:   1,
		filePath: filePath,
	}
}

// Add добавляет новую задачу
func (s *Store) Add(title string) (*Todo, error) {
	// Валидация
	if title == "" {
		return nil, ErrEmptyTitle
	}

	todo := Todo{
		ID:        s.nextID,
		Title:     title,
		Status:    StatusPending,
		CreatedAt: time.Now(),
	}

	s.todos = append(s.todos, todo)
	s.nextID++

	return &todo, nil
}

// List возвращает все задачи
func (s *Store) List() []Todo {
	// Возвращаем копию, чтобы внешний код не мог изменить внутренний слайс
	result := make([]Todo, len(s.todos))
	copy(result, s.todos)
	return result
}

// Complete отмечает задачу как выполненную
func (s *Store) Complete(id int) error {
	for i := range s.todos {
		if s.todos[i].ID == id {
			if s.todos[i].Status == StatusDone {
				return ErrAlreadyDone
			}
			s.todos[i].Status = StatusDone
			s.todos[i].DoneAt = time.Now()
			return nil
		}
	}
	return fmt.Errorf("задача #%d: %w", id, ErrNotFound)
}

// Delete удаляет задачу по ID
func (s *Store) Delete(id int) error {
	for i := range s.todos {
		if s.todos[i].ID == id {
			// Удаление с сохранением порядка
			s.todos = append(s.todos[:i], s.todos[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("задача #%d: %w", id, ErrNotFound)
}

// Save сохраняет задачи в файл (JSON)
func (s *Store) Save() error {
	data, err := json.MarshalIndent(s.todos, "", "  ")
	if err != nil {
		return fmt.Errorf("сериализация: %w", err)
	}

	err = os.WriteFile(s.filePath, data, 0644)
	if err != nil {
		return fmt.Errorf("запись файла %s: %w", s.filePath, err)
	}

	return nil
}

// Load загружает задачи из файла
func (s *Store) Load() error {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// Файла нет — это нормально, начинаем с пустого списка
			return nil
		}
		return fmt.Errorf("чтение файла %s: %w", s.filePath, err)
	}

	if len(data) == 0 {
		return nil
	}

	var todos []Todo
	err = json.Unmarshal(data, &todos)
	if err != nil {
		return fmt.Errorf("десериализация: %w", err)
	}

	s.todos = todos

	// Восстанавливаем nextID
	for _, t := range s.todos {
		if t.ID >= s.nextID {
			s.nextID = t.ID + 1
		}
	}

	return nil
}
```

### Файл main.go — CLI интерфейс

```go
// Пакет main — точка входа CLI-приложения.
// Разбирает аргументы командной строки и вызывает бизнес-логику.
package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"strings"
	"todo-cli/todo"
)

const dataFile = "todos.json"

func main() {
	// Определяем подкоманды как FlagSet (набор флагов)
	addCmd := flag.NewFlagSet("add", flag.ExitOnError)
	listCmd := flag.NewFlagSet("list", flag.ExitOnError)
	completeCmd := flag.NewFlagSet("complete", flag.ExitOnError)
	deleteCmd := flag.NewFlagSet("delete", flag.ExitOnError)

	// Флаги для подкоманд
	addTitle := addCmd.String("title", "", "Название задачи")
	completeID := completeCmd.Int("id", 0, "ID задачи")
	deleteID := deleteCmd.Int("id", 0, "ID задачи")

	// Проверяем, что передана подкоманда
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	// Инициализируем хранилище
	store := todo.NewStore(dataFile)
	if err := store.Load(); err != nil {
		fmt.Fprintf(os.Stderr, "Ошибка загрузки данных: %v\n", err)
		os.Exit(1)
	}

	// Разбираем подкоманду
	switch os.Args[1] {
	case "add":
		addCmd.Parse(os.Args[2:])
		title := *addTitle
		// Если --title не указан, берём оставшиеся аргументы
		if title == "" {
			title = strings.Join(addCmd.Args(), " ")
		}
		if err := runAdd(store, title); err != nil {
			fmt.Fprintf(os.Stderr, "Ошибка: %v\n", err)
			os.Exit(1)
		}

	case "list":
		listCmd.Parse(os.Args[2:])
		runList(store)

	case "complete":
		completeCmd.Parse(os.Args[2:])
		if err := runComplete(store, *completeID); err != nil {
			fmt.Fprintf(os.Stderr, "Ошибка: %v\n", err)
			os.Exit(1)
		}

	case "delete":
		deleteCmd.Parse(os.Args[2:])
		if err := runDelete(store, *deleteID); err != nil {
			fmt.Fprintf(os.Stderr, "Ошибка: %v\n", err)
			os.Exit(1)
		}

	default:
		fmt.Fprintf(os.Stderr, "Неизвестная команда: %s\n", os.Args[1])
		printUsage()
		os.Exit(1)
	}
}

func runAdd(store *todo.Store, title string) error {
	t, err := store.Add(title)
	if err != nil {
		return err
	}

	if err := store.Save(); err != nil {
		return fmt.Errorf("сохранение: %w", err)
	}

	fmt.Printf("Задача добавлена: %s\n", t)
	return nil
}

func runList(store *todo.Store) {
	todos := store.List()
	if len(todos) == 0 {
		fmt.Println("Список задач пуст.")
		return
	}

	fmt.Println("Задачи:")
	fmt.Println(strings.Repeat("-", 50))
	for _, t := range todos {
		fmt.Println(t)
	}
	fmt.Println(strings.Repeat("-", 50))
	fmt.Printf("Всего: %d\n", len(todos))
}

func runComplete(store *todo.Store, id int) error {
	if id <= 0 {
		return fmt.Errorf("укажите корректный ID задачи (--id=N)")
	}

	err := store.Complete(id)
	if err != nil {
		if errors.Is(err, todo.ErrAlreadyDone) {
			fmt.Println("Задача уже была выполнена.")
			return nil
		}
		return err
	}

	if err := store.Save(); err != nil {
		return fmt.Errorf("сохранение: %w", err)
	}

	fmt.Printf("Задача #%d отмечена как выполненная.\n", id)
	return nil
}

func runDelete(store *todo.Store, id int) error {
	if id <= 0 {
		return fmt.Errorf("укажите корректный ID задачи (--id=N)")
	}

	err := store.Delete(id)
	if err != nil {
		return err
	}

	if err := store.Save(); err != nil {
		return fmt.Errorf("сохранение: %w", err)
	}

	fmt.Printf("Задача #%d удалена.\n", id)
	return nil
}

func printUsage() {
	fmt.Println("Todo CLI — менеджер задач")
	fmt.Println()
	fmt.Println("Использование:")
	fmt.Println("  todo-cli add <название>       Добавить задачу")
	fmt.Println("  todo-cli list                  Показать все задачи")
	fmt.Println("  todo-cli complete --id=N       Отметить задачу выполненной")
	fmt.Println("  todo-cli delete --id=N         Удалить задачу")
}
```

### Запуск и тестирование

```bash
# Сборка
go build -o todo-cli

# Добавляем задачи
./todo-cli add Изучить основы Go
./todo-cli add Написать первый HTTP-сервер
./todo-cli add Изучить горутины и каналы

# Список задач
./todo-cli list
# Задачи:
# --------------------------------------------------
# [ ] #1: Изучить основы Go (ожидает)
# [ ] #2: Написать первый HTTP-сервер (ожидает)
# [ ] #3: Изучить горутины и каналы (ожидает)
# --------------------------------------------------
# Всего: 3

# Выполняем задачу
./todo-cli complete --id=1
# Задача #1 отмечена как выполненная.

# Снова смотрим список
./todo-cli list
# Задачи:
# --------------------------------------------------
# [x] #1: Изучить основы Go (выполнена)
# [ ] #2: Написать первый HTTP-сервер (ожидает)
# [ ] #3: Изучить горутины и каналы (ожидает)
# --------------------------------------------------

# Удаляем задачу
./todo-cli delete --id=2
```

> [!NOTE] Что мы применили в проекте
> - **Пакеты и модули** — разделение на `main` и `todo`
> - **Структуры** — `Todo`, `Store` с тегами JSON
> - **Методы** — value и pointer receivers
> - **Интерфейсы** — `fmt.Stringer` для `Todo` и `Status`
> - **Ошибки** — sentinel errors, оборачивание через `%w`, `errors.Is`
> - **Слайсы** — хранение задач, удаление из середины
> - **iota** — перечисление статусов
> - **Defer** (неявно через `os.WriteFile`) — безопасная работа с файлами
> - **Пакет flag** — разбор CLI-аргументов

###### 🏠 Домашнее задание

1. Добавьте подкоманду `edit --id=N --title="Новое название"` для редактирования задачи
2. Добавьте фильтрацию в `list`: `list --status=done` показывает только выполненные задачи
3. Добавьте подкоманду `stats`, которая выводит статистику: сколько задач в каждом статусе
4. Напишите тесты для пакета `todo` (функции `Add`, `Complete`, `Delete`). Подробнее о тестировании — в следующих главах
5. Замените хранение в файле на SQLite с помощью пакета `modernc.org/sqlite` (без CGO). Подробнее о работе с БД — в [[03-networking]]

---

## Дополнительные ссылки

- Официальная документация Go: [https://go.dev/doc/](https://go.dev/doc/)
- A Tour of Go (интерактивный учебник): [https://go.dev/tour/](https://go.dev/tour/)
- Effective Go: [https://go.dev/doc/effective_go](https://go.dev/doc/effective_go)
- Go Proverbs: [https://go-proverbs.github.io/](https://go-proverbs.github.io/)
- Go by Example: [https://gobyexample.com/](https://gobyexample.com/)
- Спецификация языка: [https://go.dev/ref/spec](https://go.dev/ref/spec)
- Стандартная библиотека: [https://pkg.go.dev/std](https://pkg.go.dev/std)

**Следующая глава:** [[02-os-and-fs]] — Работа с операционной системой и файловой системой
**Конкурентность:** [[05-concurrency]] — Горутины, каналы и паттерны конкурентности
**Сетевое программирование:** [[03-networking]] — HTTP, TCP, работа с сетью
**Инструменты:** [[08-tools]] — Линтеры, профилирование, CI/CD
**Дополнительные примеры:** [[Selfgo]]
