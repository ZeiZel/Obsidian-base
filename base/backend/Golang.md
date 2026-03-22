---
tags:
  - backend
  - golang
  - go
  - microservices
---

Go - язык программирования, созданный в Google инженерами Робертом Грисемером, Робом Пайком и Кеном Томпсоном. Первый стабильный релиз вышел в 2012 году. Язык проектировался для решения инженерных задач Google - масштабных сетевых сервисов с высокими требованиями к производительности и конкурентности.

## Философия и принципы Go

Go намеренно отказался от многих фич, привычных в других языках. Нет наследования, нет исключений, нет перегрузки функций, нет дженериков (до версии 1.18). Каждое отсутствие - осознанное решение в пользу простоты.

Ключевые принципы:

- Композиция вместо наследования. Структуры встраиваются друг в друга, интерфейсы компонуются. Глубоких иерархий типов не существует.
- Явное лучше неявного. Ошибки возвращаются как значения и обрабатываются явно. Нет скрытых исключений или магического поведения.
- Один способ сделать вещь. go fmt форматирует код единственным способом. Нет споров о стиле.
- Читаемость важнее лаконичности. Код читают значительно чаще, чем пишут.
- Конкурентность как основа. Горутины и каналы встроены в язык, а не добавлены библиотекой.

> [!summary] Go Proverbs (Rob Pike)
> - Don't communicate by sharing memory, share memory by communicating
> - Concurrency is not parallelism
> - The bigger the interface, the weaker the abstraction
> - Make the zero value useful
> - A little copying is better than a little dependency
> - Clear is better than clever
> - Errors are values
> - Don't just check errors, handle them gracefully

---

## Установка и инструменты

### Установка Go

Загрузить последнюю версию с официального сайта go.dev. После установки проверить:

```go
// в терминале
// go version
// go env GOROOT GOPATH
```

### Модули и управление зависимостями

Начиная с Go 1.16 модули включены по умолчанию. GOPATH больше не является основным механизмом организации кода.

```bash
# Создание нового модуля
go mod init github.com/username/project

# Добавление зависимости
go get github.com/gin-gonic/gin@latest

# Удаление неиспользуемых зависимостей
go mod tidy

# Скачать зависимости в кеш
go mod download

# Скопировать зависимости в vendor/
go mod vendor
```

Файл `go.mod` содержит описание модуля и его зависимостей:

```go
module github.com/username/project

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/jackc/pgx/v5 v5.5.0
)
```

Файл `go.sum` содержит криптографические хеши зависимостей для воспроизводимых сборок.

### Инструменты разработки

```bash
# Форматирование кода (обязательно)
go fmt ./...

# Статический анализ
go vet ./...

# Линтер (установить отдельно)
golangci-lint run ./...

# Сборка
go build -o app ./cmd/app

# Запуск
go run ./cmd/app

# Тесты
go test ./...

# Генерация кода
go generate ./...
```

Для продуктивной разработки рекомендуется GoLand или VS Code с расширением gopls. Оба обеспечивают автодополнение, навигацию по коду, рефакторинг и интеграцию с инструментами Go.

---

## Основы синтаксиса

### Пакеты и main функция

Каждый файл Go принадлежит пакету. Исполняемая программа всегда начинается с пакета `main` и функции `main`:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	greeting := strings.ToUpper("hello, go")
	fmt.Println(greeting)
}
```

Группировка импортов в скобки - стандартная практика. Неиспользуемые импорты вызывают ошибку компиляции.

### Переменные и типы данных

Go - статически типизированный язык. Типы проверяются на этапе компиляции.

Числовые типы:

- int, int8, int16, int32, int64 - целые со знаком
- uint, uint8, uint16, uint32, uint64 - целые без знака
- float32, float64 - числа с плавающей точкой
- complex64, complex128 - комплексные числа
- byte - алиас для uint8
- rune - алиас для int32, представляет символ Unicode

Прочие типы:

- bool - логический тип (true/false)
- string - строка (неизменяемая последовательность байт)
- error - интерфейс для ошибок

```go
// Полное объявление
var name string = "Go"

// Вывод типа
var age = 30

// Короткое объявление (только внутри функций)
lang := "Golang"

// Множественное объявление
var (
	host = "localhost"
	port = 8080
	debug = false
)

// Множественное присваивание
x, y := 10, 20
x, y = y, x // swap
```

> [!info] Zero values
> В Go каждый тип имеет нулевое значение по умолчанию. Для чисел это 0, для строк - пустая строка "", для bool - false, для указателей, слайсов, map, каналов и интерфейсов - nil.

### Константы и iota

```go
const Pi = 3.14159
const AppName = "myservice"

// iota - автоинкрементный счётчик внутри const блока
type Role int

const (
	RoleGuest  Role = iota // 0
	RoleUser               // 1
	RoleAdmin              // 2
)

// Использование iota для битовых масок
type Permission int

const (
	PermRead    Permission = 1 << iota // 1
	PermWrite                          // 2
	PermExecute                        // 4
)
```

### Работа со строками

Строки в Go неизменяемы. Конкатенация через `+` создает новую строку каждый раз. Для сборки строк из множества частей используется `strings.Builder`:

```go
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func main() {
	// Форматирование
	name := "Мир"
	greeting := fmt.Sprintf("Привет, %s! Сегодня %d-й день.", name, 42)

	// Конвертация типов
	num := 42
	str := strconv.Itoa(num)          // int -> string
	parsed, _ := strconv.Atoi("100")  // string -> int
	f, _ := strconv.ParseFloat("3.14", 64)

	// Эффективная конкатенация
	var b strings.Builder
	for i := 0; i < 1000; i++ {
		b.WriteString("chunk")
	}
	result := b.String()

	// Полезные функции пакета strings
	strings.Contains("golang", "lang")    // true
	strings.HasPrefix("golang", "go")     // true
	strings.HasSuffix("main.go", ".go")   // true
	strings.Split("a,b,c", ",")           // ["a", "b", "c"]
	strings.Join([]string{"a", "b"}, "-") // "a-b"
	strings.ReplaceAll("foo bar", " ", "_")
	strings.TrimSpace("  hello  ")        // "hello"
	strings.ToLower("GO")                 // "go"
	strings.Count("hello", "l")           // 2
	strings.Index("hello", "ll")          // 2

	_ = greeting
	_ = str
	_ = parsed
	_ = f
	_ = result
}
```

### Операторы

Go поддерживает стандартный набор операторов:

- Арифметические: `+`, `-`, `*`, `/`, `%`
- Сравнения: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Логические: `&&`, `||`, `!`
- Побитовые: `&`, `|`, `^`, `<<`, `>>`, `&^`
- Присваивания: `=`, `:=`, `+=`, `-=`, `*=`, `/=`
- Адресные: `&` (взять адрес), `*` (разыменование)
- Канальные: `<-` (отправка/получение)

### Ветвления

```go
// if с инициализацией - переменная видна только внутри блока if/else
if err := doSomething(); err != nil {
	log.Fatal(err)
}

// switch без выражения - замена цепочки if/else
score := 85
switch {
case score >= 90:
	fmt.Println("отлично")
case score >= 70:
	fmt.Println("хорошо")
default:
	fmt.Println("нужно подтянуть")
}

// switch по значению
day := "monday"
switch day {
case "monday", "tuesday", "wednesday", "thursday", "friday":
	fmt.Println("рабочий день")
case "saturday", "sunday":
	fmt.Println("выходной")
}

// type switch
func describe(i interface{}) string {
	switch v := i.(type) {
	case int:
		return fmt.Sprintf("целое число: %d", v)
	case string:
		return fmt.Sprintf("строка: %s", v)
	case bool:
		return fmt.Sprintf("булево: %t", v)
	default:
		return fmt.Sprintf("неизвестный тип: %T", v)
	}
}
```

> [!info] В Go switch не требует break - каждый case завершается автоматически. Чтобы "провалиться" в следующий case, используется `fallthrough`.

### Циклы

В Go есть только одна конструкция цикла - `for`:

```go
// Классический цикл
for i := 0; i < 10; i++ {
	fmt.Println(i)
}

// Аналог while
n := 1
for n < 100 {
	n *= 2
}

// Бесконечный цикл
for {
	// используется с break или return
	break
}

// range - итерация по коллекциям
nums := []int{10, 20, 30}
for i, v := range nums {
	fmt.Printf("index=%d value=%d\n", i, v)
}

// Пропуск индекса или значения
for _, v := range nums { /* только значения */ }
for i := range nums   { /* только индексы */ }

// range по map
m := map[string]int{"a": 1, "b": 2}
for key, value := range m {
	fmt.Printf("%s: %d\n", key, value)
}

// range по строке итерирует руны
for i, ch := range "Привет" {
	fmt.Printf("byte=%d rune=%c\n", i, ch)
}

// range по каналу
ch := make(chan int)
for val := range ch {
	fmt.Println(val) // до закрытия канала
}
```

Метки позволяют управлять вложенными циклами:

```go
outer:
	for i := 0; i < 5; i++ {
		for j := 0; j < 5; j++ {
			if i*j > 6 {
				break outer
			}
		}
	}
```

---

## Функции

### Объявление и множественные возвращаемые значения

```go
// Простая функция
func add(a, b int) int {
	return a + b
}

// Множественные возвращаемые значения
func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, fmt.Errorf("деление на ноль")
	}
	return a / b, nil
}

// Именованные возвращаемые значения
func parseConfig(path string) (host string, port int, err error) {
	// host, port, err уже объявлены
	host = "localhost"
	port = 8080
	return // naked return - возвращает именованные значения
}
```

### Variadic функции

```go
func sum(nums ...int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

// Вызов
sum(1, 2, 3)

// Распаковка слайса
values := []int{1, 2, 3, 4, 5}
sum(values...)
```

### Функции как значения и замыкания

Функции в Go - first-class citizens. Их можно присваивать переменным, передавать как аргументы и возвращать из других функций.

```go
// Функция как значение
multiply := func(a, b int) int {
	return a * b
}
fmt.Println(multiply(3, 4))

// Замыкание - захват переменных из внешней области видимости
func counter() func() int {
	count := 0
	return func() int {
		count++
		return count
	}
}

c := counter()
fmt.Println(c()) // 1
fmt.Println(c()) // 2
fmt.Println(c()) // 3

// Функция высшего порядка
func apply(nums []int, transform func(int) int) []int {
	result := make([]int, len(nums))
	for i, n := range nums {
		result[i] = transform(n)
	}
	return result
}

doubled := apply([]int{1, 2, 3}, func(n int) int { return n * 2 })
```

### Defer, panic, recover

```go
// defer выполняет функцию при выходе из текущей функции
// Порядок выполнения - LIFO (стек)
func processFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close() // гарантированно закроет файл

	// работа с файлом...
	return nil
}

// defer вычисляет аргументы в момент объявления, не выполнения
func demo() {
	x := 10
	defer fmt.Println(x) // напечатает 10, не 20
	x = 20
}

// panic останавливает нормальное выполнение
// recover перехватывает панику (только внутри defer)
func safeOperation() (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r)
		}
	}()

	// код, который может вызвать панику
	riskyFunction()
	return nil
}
```

> [!important] panic следует использовать только в исключительных ситуациях - неисправимые ошибки инициализации, нарушение инвариантов программы. Для штатных ошибок используется возврат error.

### init() функция

Функция `init()` вызывается автоматически при инициализации пакета, до вызова main(). В одном файле может быть несколько init(). Порядок вызова - по порядку объявления.

```go
package main

var config Config

func init() {
	// Загрузка конфигурации при старте
	config = loadConfig()
}

func main() {
	// config уже загружена
}
```

Порядок инициализации: переменные пакета -> init() импортированных пакетов (в порядке импорта) -> init() текущего пакета -> main().

---

## Составные типы данных

### Массивы

Массив в Go имеет фиксированный размер, который является частью его типа. `[3]int` и `[5]int` - разные типы:

```go
// Объявление
var a [5]int                    // [0, 0, 0, 0, 0]
b := [3]string{"go", "rust", "python"}
c := [...]int{1, 2, 3, 4, 5}   // размер выводится из количества элементов

// Массивы передаются по значению (копируются)
func modifyArray(arr [3]int) {
	arr[0] = 999 // не изменит оригинал
}
```

На практике массивы используются редко. Почти всегда предпочтительнее слайсы.

### Слайсы

Слайс - динамический массив. Внутри это структура из трёх полей: указатель на массив, длина (len) и ёмкость (cap).

```go
// Создание слайсов
s1 := []int{1, 2, 3}             // литерал
s2 := make([]int, 5)             // len=5, cap=5, заполнен нулями
s3 := make([]int, 0, 100)        // len=0, cap=100

// Добавление элементов
s1 = append(s1, 4, 5)
s1 = append(s1, []int{6, 7}...)  // append другого слайса

// Срез среза (slice expression)
original := []int{0, 1, 2, 3, 4, 5}
sub := original[2:4]  // [2, 3] - разделяют один массив!
```

> [!important] Gotcha: слайсы разделяют подлежащий массив
> При создании среза из среза оба указывают на один и тот же массив. Модификация одного может повлиять на другой. Используйте copy() или полный срез с тремя индексами для безопасности.

```go
// Опасность - разделённый массив
a := []int{1, 2, 3, 4, 5}
b := a[1:3]    // [2, 3] - указывает на тот же массив
b[0] = 999     // a теперь [1, 999, 3, 4, 5]

// Безопасное копирование
c := make([]int, len(a))
copy(c, a) // c - независимая копия

// Трёхиндексный срез ограничивает cap
d := a[1:3:3] // len=2, cap=2 - append создаст новый массив

// Удаление элемента из середины
s := []int{1, 2, 3, 4, 5}
i := 2 // удалить элемент с индексом 2
s = append(s[:i], s[i+1:]...) // [1, 2, 4, 5]

// Фильтрация без аллокации
func filter(s []int, fn func(int) bool) []int {
	result := s[:0] // переиспользует тот же массив
	for _, v := range s {
		if fn(v) {
			result = append(result, v)
		}
	}
	return result
}
```

При append, если cap недостаточна, Go выделяет новый массив. Стратегия роста: для малых слайсов cap удваивается, для больших растёт на ~25%.

### Maps

Map - хеш-таблица, связывающая ключи со значениями:

```go
// Создание
m1 := map[string]int{
	"alice": 30,
	"bob":   25,
}
m2 := make(map[string]int)    // пустая map
m3 := make(map[string]int, 100) // с подсказкой ёмкости

// Операции
m1["charlie"] = 35            // запись
age := m1["alice"]             // чтение (0 если нет ключа)
age, ok := m1["dave"]         // проверка существования
delete(m1, "bob")              // удаление
fmt.Println(len(m1))          // количество элементов

// Идиома проверки существования
if val, ok := m1["key"]; ok {
	fmt.Println("found:", val)
}

// Итерация (порядок не гарантирован)
for key, value := range m1 {
	fmt.Printf("%s: %d\n", key, value)
}
```

> [!important] Map не безопасна для конкурентного доступа. Одновременное чтение и запись из разных горутин вызовет panic. Используйте sync.RWMutex или sync.Map.

### Структуры

```go
type User struct {
	ID        int64     `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	isActive  bool      // неэкспортируемое поле (строчная буква)
}

// Создание экземпляров
u1 := User{ID: 1, Email: "user@example.com", Name: "Alice"}
u2 := User{} // все поля имеют zero values
u3 := &User{Email: "bob@example.com"} // указатель на структуру

// Конструктор (идиома Go)
func NewUser(email, name string) *User {
	return &User{
		Email:     email,
		Name:      name,
		CreatedAt: time.Now(),
		isActive:  true,
	}
}
```

Теги структур используются библиотеками для кастомизации поведения - JSON-сериализация, маппинг на колонки БД, валидация.

### Встраивание структур

```go
type Address struct {
	City    string
	Country string
}

type Employee struct {
	User           // встраивание - поля User доступны напрямую
	Address        // встраивание Address
	Department string
}

emp := Employee{
	User:       User{Name: "Alice", Email: "alice@corp.com"},
	Address:    Address{City: "Moscow", Country: "RU"},
	Department: "Engineering",
}

// Поля доступны напрямую благодаря встраиванию
fmt.Println(emp.Name)    // "Alice" - из User
fmt.Println(emp.City)    // "Moscow" - из Address
```

### Методы

```go
// Value receiver - работает с копией
func (u User) FullName() string {
	return u.Name
}

// Pointer receiver - работает с оригиналом
func (u *User) Deactivate() {
	u.isActive = false
}
```

Правила выбора receiver:

- Pointer receiver если метод модифицирует поля
- Pointer receiver если структура большая (избежать копирования)
- Если хотя бы один метод использует pointer receiver, все методы должны использовать pointer receiver (консистентность)
- Value receiver для маленьких неизменяемых структур

---

## Указатели

Указатель хранит адрес памяти переменной. Go не поддерживает арифметику указателей в отличие от C:

```go
x := 42
p := &x         // p - указатель на x
fmt.Println(*p) // 42 - разыменование
*p = 100        // x теперь 100

// new() выделяет память и возвращает указатель
ptr := new(int) // *int, указывает на 0
*ptr = 10

// nil pointer
var np *int     // nil
// *np = 5     // panic: nil pointer dereference
```

Когда использовать указатели:

- Нужно модифицировать значение в вызываемой функции
- Структура большая и копирование дорого
- Нужно явно обозначить отсутствие значения через nil
- Методы с pointer receiver

Когда не нужны указатели:

- Маленькие неизменяемые типы (int, string, bool, маленькие struct)
- Слайсы, map, каналы - уже содержат указатель внутри
- Интерфейсы - уже содержат указатель на данные

---

## Интерфейсы

Интерфейс в Go - набор сигнатур методов. Тип реализует интерфейс неявно, просто имея все необходимые методы. Не нужно явное объявление `implements`:

```go
type Writer interface {
	Write(p []byte) (n int, err error)
}

type ConsoleWriter struct{}

// ConsoleWriter реализует Writer неявно
func (cw ConsoleWriter) Write(p []byte) (int, error) {
	return fmt.Print(string(p))
}

// Любой тип с методом Write([]byte)(int, error) - Writer
func writeData(w Writer, data []byte) error {
	_, err := w.Write(data)
	return err
}
```

### Пустой интерфейс и any

```go
// interface{} и any (с Go 1.18) - одно и то же
// Может хранить значение любого типа
func printAnything(v any) {
	fmt.Printf("type=%T value=%v\n", v, v)
}

printAnything(42)
printAnything("hello")
printAnything([]int{1, 2, 3})
```

### Type assertion и type switch

```go
var i interface{} = "hello"

// Type assertion
s, ok := i.(string)
if ok {
	fmt.Println(s)
}

// Type switch
switch v := i.(type) {
case string:
	fmt.Println("string:", v)
case int:
	fmt.Println("int:", v)
case error:
	fmt.Println("error:", v.Error())
default:
	fmt.Printf("unknown: %T\n", v)
}
```

### Композиция интерфейсов

```go
type Reader interface {
	Read(p []byte) (n int, err error)
}

type Writer interface {
	Write(p []byte) (n int, err error)
}

type Closer interface {
	Close() error
}

// Композиция
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
// fmt.Stringer - кастомное строковое представление
type User struct {
	Name string
	Age  int
}

func (u User) String() string {
	return fmt.Sprintf("%s (%d лет)", u.Name, u.Age)
}

// error - интерфейс ошибки
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation failed for %s: %s", e.Field, e.Message)
}

// sort.Interface
type ByAge []User

func (a ByAge) Len() int           { return len(a) }
func (a ByAge) Less(i, j int) bool { return a[i].Age < a[j].Age }
func (a ByAge) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
```

> [!summary] Золотое правило интерфейсов
> Accept interfaces, return structs. Принимай интерфейсы, возвращай конкретные типы. Интерфейсы должны быть маленькими - 1-2 метода. Чем больше интерфейс, тем слабее абстракция.

---

## Generics (Go 1.18+)

Дженерики позволяют писать функции и типы, работающие с разными типами данных без потери типобезопасности:

```go
// Обобщённая функция
func Map[T any, R any](s []T, fn func(T) R) []R {
	result := make([]R, len(s))
	for i, v := range s {
		result[i] = fn(v)
	}
	return result
}

names := Map([]int{1, 2, 3}, func(n int) string {
	return fmt.Sprintf("item_%d", n)
})

// Ограничения типов (constraints)
func Min[T constraints.Ordered](a, b T) T {
	if a < b {
		return a
	}
	return b
}

// Кастомное ограничение
type Number interface {
	~int | ~int32 | ~int64 | ~float32 | ~float64
}

func Sum[T Number](nums []T) T {
	var total T
	for _, n := range nums {
		total += n
	}
	return total
}

// Обобщённый тип
type Stack[T any] struct {
	items []T
}

func (s *Stack[T]) Push(item T) {
	s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	item := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return item, true
}
```

Когда использовать дженерики:

- Контейнеры и структуры данных (стеки, очереди, множества)
- Утилитарные функции над слайсами и map (Map, Filter, Reduce)
- Когда тот же код дублируется для разных типов

Когда не использовать:

- Если interface{} или конкретный тип достаточен
- Для простого полиморфизма - интерфейсы лучше
- Когда это добавляет сложность без ощутимой пользы

---

## Обработка ошибок

### Базовые паттерны

```go
// error - встроенный интерфейс
// type error interface { Error() string }

// Создание ошибок
err1 := errors.New("something went wrong")
err2 := fmt.Errorf("failed to process item %d: %w", 42, err1)

// Стандартный паттерн обработки
result, err := doSomething()
if err != nil {
	return fmt.Errorf("doSomething: %w", err)
}
```

### Sentinel errors

```go
// Определяются как переменные пакета
var (
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrConflict     = errors.New("conflict")
)

func FindUser(id int64) (*User, error) {
	// ...
	if user == nil {
		return nil, ErrNotFound
	}
	return user, nil
}

// Проверка sentinel error
user, err := FindUser(123)
if errors.Is(err, ErrNotFound) {
	// пользователь не найден
}
```

### Кастомные типы ошибок

```go
type AppError struct {
	Code    int
	Message string
	Err     error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// Оборачивание ошибки
func processOrder(id int64) error {
	err := validateOrder(id)
	if err != nil {
		return &AppError{
			Code:    400,
			Message: "invalid order",
			Err:     err,
		}
	}
	return nil
}

// errors.As - извлечение конкретного типа ошибки
var appErr *AppError
if errors.As(err, &appErr) {
	fmt.Printf("код ошибки: %d\n", appErr.Code)
}
```

### Wrapping errors

```go
// Оборачивание с %w - сохраняет цепочку ошибок
func readConfig(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("readConfig %s: %w", path, err)
	}
	return data, nil
}

// errors.Is проходит по всей цепочке обёрнутых ошибок
if errors.Is(err, os.ErrNotExist) {
	// файл не найден - даже если ошибка обёрнута
}
```

> [!important] Не используйте panic для штатных ошибок. Panic - для неисправимых ситуаций: нарушение инвариантов, ошибки инициализации, баги в коде. Для всего остального - return error.

---

## Конкурентность

Конкурентность - ключевая особенность Go. Горутины работают на виртуальных потоках, управляемых рантаймом Go. Планировщик (scheduler) мультиплексирует горутины на потоки ОС.

### Горутины

```go
// Запуск горутины
go func() {
	fmt.Println("выполняется конкурентно")
}()

// Горутина - это очень дёшево: ~2-8 KB стека
// Можно запускать сотни тысяч одновременно
for i := 0; i < 100_000; i++ {
	go func(id int) {
		// обработка
	}(i) // передаём i как аргумент, чтобы избежать замыкания на переменную цикла
}
```

### Каналы

```go
// Небуферизованный - синхронный обмен
ch := make(chan int)
go func() {
	ch <- 42 // блокируется, пока не прочитают
}()
val := <-ch // блокируется, пока не запишут

// Буферизованный - асинхронный до заполнения буфера
buffered := make(chan string, 10)
buffered <- "message" // не блокируется, если буфер не полон

// Направленные каналы в сигнатурах функций
func producer(out chan<- int) { // только запись
	out <- 1
}
func consumer(in <-chan int) { // только чтение
	val := <-in
}

// Закрытие канала - сигнал "данных больше не будет"
close(ch)

// Чтение из закрытого канала возвращает zero value
val, ok := <-ch // ok == false если канал закрыт и пуст
```

### Select

Select позволяет ожидать операции на нескольких каналах одновременно:

```go
func processWithTimeout(data <-chan int, timeout time.Duration) (int, error) {
	select {
	case val := <-data:
		return val, nil
	case <-time.After(timeout):
		return 0, fmt.Errorf("timeout after %v", timeout)
	}
}

// Non-blocking операция с default
select {
case msg := <-ch:
	process(msg)
default:
	// канал пуст, делаем что-то другое
}

// Мультиплексирование нескольких каналов
func merge(ch1, ch2 <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for ch1 != nil || ch2 != nil {
			select {
			case v, ok := <-ch1:
				if !ok {
					ch1 = nil
					continue
				}
				out <- v
			case v, ok := <-ch2:
				if !ok {
					ch2 = nil
					continue
				}
				out <- v
			}
		}
	}()
	return out
}
```

### Паттерны конкурентности

#### Worker Pool

```go
func workerPool(jobs <-chan Job, results chan<- Result, numWorkers int) {
	var wg sync.WaitGroup
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for job := range jobs {
				result := process(job)
				results <- result
			}
		}(i)
	}
	wg.Wait()
	close(results)
}
```

#### Fan-out / Fan-in

```go
// Fan-out - распределение работы по нескольким горутинам
func fanOut(input <-chan int, workers int) []<-chan int {
	channels := make([]<-chan int, workers)
	for i := 0; i < workers; i++ {
		channels[i] = work(input)
	}
	return channels
}

// Fan-in - объединение результатов из нескольких каналов в один
func fanIn(channels ...<-chan int) <-chan int {
	var wg sync.WaitGroup
	merged := make(chan int)

	for _, ch := range channels {
		wg.Add(1)
		go func(c <-chan int) {
			defer wg.Done()
			for v := range c {
				merged <- v
			}
		}(ch)
	}

	go func() {
		wg.Wait()
		close(merged)
	}()

	return merged
}
```

#### Pipeline

```go
func generate(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			out <- n
		}
	}()
	return out
}

func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			out <- n * n
		}
	}()
	return out
}

func filter(in <-chan int, predicate func(int) bool) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			if predicate(n) {
				out <- n
			}
		}
	}()
	return out
}

// Использование pipeline
nums := generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
squared := square(nums)
even := filter(squared, func(n int) bool { return n%2 == 0 })

for v := range even {
	fmt.Println(v) // 4, 16, 36, 64, 100
}
```

#### Semaphore

```go
// Ограничение конкурентности через буферизованный канал
type Semaphore chan struct{}

func NewSemaphore(max int) Semaphore {
	return make(Semaphore, max)
}

func (s Semaphore) Acquire() { s <- struct{}{} }
func (s Semaphore) Release() { <-s }

// Использование
sem := NewSemaphore(10) // максимум 10 одновременных операций
for _, url := range urls {
	sem.Acquire()
	go func(u string) {
		defer sem.Release()
		fetch(u)
	}(url)
}
```

### Примитивы синхронизации

```go
// WaitGroup - ожидание завершения группы горутин
var wg sync.WaitGroup
for i := 0; i < 5; i++ {
	wg.Add(1)
	go func(id int) {
		defer wg.Done()
		// работа
	}(i)
}
wg.Wait() // блокируется до wg.Done() 5 раз

// Mutex - эксклюзивная блокировка
type SafeCounter struct {
	mu    sync.Mutex
	count int
}

func (c *SafeCounter) Increment() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.count++
}

// RWMutex - множественные читатели, один писатель
type Cache struct {
	mu   sync.RWMutex
	data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.data[key]
	return val, ok
}

func (c *Cache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = value
}

// Once - выполнить действие ровно один раз
var once sync.Once
var instance *Database

func GetDB() *Database {
	once.Do(func() {
		instance = connectToDB()
	})
	return instance
}

// sync.Pool - пул переиспользуемых объектов
var bufferPool = sync.Pool{
	New: func() any {
		return new(bytes.Buffer)
	},
}

func processRequest() {
	buf := bufferPool.Get().(*bytes.Buffer)
	defer func() {
		buf.Reset()
		bufferPool.Put(buf)
	}()
	// использование buf
}

// Атомарные операции
var counter atomic.Int64

func increment() {
	counter.Add(1)
}

func getCount() int64 {
	return counter.Load()
}
```

### Context

Context передаёт дедлайны, сигналы отмены и request-scoped данные между функциями и горутинами:

```go
// WithCancel - ручная отмена
ctx, cancel := context.WithCancel(context.Background())
defer cancel() // важно вызвать для освобождения ресурсов

go func() {
	select {
	case <-ctx.Done():
		fmt.Println("отменено:", ctx.Err())
		return
	case result := <-doWork():
		fmt.Println("результат:", result)
	}
}()

// WithTimeout - автоматическая отмена по таймауту
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

result, err := fetchWithContext(ctx, url)
if errors.Is(err, context.DeadlineExceeded) {
	log.Println("таймаут запроса")
}

// WithValue - передача данных (использовать с осторожностью)
type ctxKey string

const requestIDKey ctxKey = "requestID"

ctx = context.WithValue(ctx, requestIDKey, "req-12345")

// Извлечение значения
if reqID, ok := ctx.Value(requestIDKey).(string); ok {
	log.Printf("request: %s\n", reqID)
}
```

### errgroup

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string) ([]string, error) {
	g, ctx := errgroup.WithContext(ctx)
	results := make([]string, len(urls))

	for i, url := range urls {
		i, url := i, url // capture
		g.Go(func() error {
			body, err := fetchURL(ctx, url)
			if err != nil {
				return fmt.Errorf("fetch %s: %w", url, err)
			}
			results[i] = body
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}
	return results, nil
}
```

### Race detector

```bash
# Запуск с детектором гонок
go test -race ./...
go run -race main.go
```

Race detector обнаруживает конкурентные обращения к памяти без синхронизации. Всегда включайте его в тестах и CI.

---

## Пакеты и модули

### Организация кода

```
project/
  go.mod
  go.sum
  cmd/
    api/
      main.go           # точка входа для API сервера
    worker/
      main.go           # точка входа для worker-а
  internal/             # приватные пакеты - нельзя импортировать извне модуля
    config/
      config.go
    domain/
      user.go
      order.go
    repository/
      user_repo.go
    service/
      user_service.go
    handler/
      user_handler.go
  pkg/                  # публичные пакеты - можно импортировать
    httputil/
      response.go
    validate/
      validator.go
```

### Экспортируемость

В Go видимость определяется регистром первой буквы:

- Заглавная буква - экспортируемый (public): `User`, `NewUser`, `MaxRetries`
- Строчная буква - неэкспортируемый (private): `user`, `newUser`, `maxRetries`

Это правило действует для типов, функций, методов, переменных и констант.

### Семантическое версионирование

Модули Go следуют semver. Для мажорных версий v2+ путь модуля должен содержать суффикс:

```go
module github.com/user/project/v2

import "github.com/user/project/v2/pkg"
```

---

## Тестирование

### Основы

```go
// user_test.go
package user_test

import (
	"testing"
)

func TestAdd(t *testing.T) {
	result := Add(2, 3)
	if result != 5 {
		t.Errorf("Add(2, 3) = %d; want 5", result)
	}
}
```

### Table-driven tests

Стандартный паттерн тестирования в Go:

```go
func TestDivide(t *testing.T) {
	tests := []struct {
		name      string
		a, b      float64
		want      float64
		wantErr   bool
	}{
		{name: "positive", a: 10, b: 2, want: 5},
		{name: "negative", a: -10, b: 2, want: -5},
		{name: "float", a: 7, b: 3, want: 2.3333333333333335},
		{name: "zero divisor", a: 10, b: 0, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Divide(tt.a, tt.b)
			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("Divide(%v, %v) = %v; want %v", tt.a, tt.b, got, tt.want)
			}
		})
	}
}
```

### Test helpers

```go
func TestUserService(t *testing.T) {
	db := setupTestDB(t) // helper создаёт тестовую БД

	// тесты...
}

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper() // при ошибке покажет строку вызова, а не строку внутри helper

	db, err := sql.Open("postgres", testDSN)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	t.Cleanup(func() {
		db.Close()
	})

	return db
}
```

### Benchmarks

```go
func BenchmarkConcat(b *testing.B) {
	for i := 0; i < b.N; i++ {
		var s string
		for j := 0; j < 100; j++ {
			s += "x"
		}
	}
}

func BenchmarkBuilder(b *testing.B) {
	for i := 0; i < b.N; i++ {
		var sb strings.Builder
		for j := 0; j < 100; j++ {
			sb.WriteString("x")
		}
		_ = sb.String()
	}
}
```

```bash
go test -bench=. -benchmem ./...
```

### Fuzzing (Go 1.18+)

```go
func FuzzParseJSON(f *testing.F) {
	// Seed corpus
	f.Add([]byte(`{"name":"test"}`))
	f.Add([]byte(`{}`))

	f.Fuzz(func(t *testing.T, data []byte) {
		var v map[string]any
		if err := json.Unmarshal(data, &v); err != nil {
			return // невалидный JSON - это нормально
		}
		// Если парсинг успешен, маршалинг не должен падать
		_, err := json.Marshal(v)
		if err != nil {
			t.Errorf("Marshal failed after successful Unmarshal: %v", err)
		}
	})
}
```

### Testify

```go
import (
	"testing"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUser(t *testing.T) {
	user, err := NewUser("alice@example.com", "Alice")
	require.NoError(t, err)           // остановит тест при ошибке
	assert.Equal(t, "Alice", user.Name)
	assert.NotEmpty(t, user.ID)
	assert.True(t, user.IsActive)
}
```

### httptest

```go
func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	healthHandler(w, req)

	res := w.Result()
	defer res.Body.Close()

	assert.Equal(t, http.StatusOK, res.StatusCode)

	body, _ := io.ReadAll(res.Body)
	assert.JSONEq(t, `{"status":"ok"}`, string(body))
}

// Тестовый HTTP сервер
func TestAPIClient(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))
	defer server.Close()

	client := NewAPIClient(server.URL)
	status, err := client.GetStatus()
	require.NoError(t, err)
	assert.Equal(t, "ok", status)
}
```

### Мок-объекты через интерфейсы

```go
// Интерфейс для зависимости
type UserRepository interface {
	FindByID(ctx context.Context, id int64) (*User, error)
	Save(ctx context.Context, user *User) error
}

// Мок
type mockUserRepo struct {
	users map[int64]*User
}

func (m *mockUserRepo) FindByID(_ context.Context, id int64) (*User, error) {
	user, ok := m.users[id]
	if !ok {
		return nil, ErrNotFound
	}
	return user, nil
}

func (m *mockUserRepo) Save(_ context.Context, user *User) error {
	m.users[user.ID] = user
	return nil
}

// Тест
func TestUserService_GetUser(t *testing.T) {
	repo := &mockUserRepo{
		users: map[int64]*User{
			1: {ID: 1, Name: "Alice"},
		},
	}
	service := NewUserService(repo)

	user, err := service.GetUser(context.Background(), 1)
	require.NoError(t, err)
	assert.Equal(t, "Alice", user.Name)
}
```

### Полезные флаги go test

```bash
go test -race ./...          # детектор гонок
go test -cover ./...         # покрытие кода
go test -count=1 ./...       # отключить кеширование
go test -v ./...             # подробный вывод
go test -short ./...         # пропустить долгие тесты
go test -run TestUser ./...  # запуск по имени
go test -coverprofile=c.out ./... && go tool cover -html=c.out
```

---

## Стандартная библиотека

### net/http

```go
// HTTP-сервер
mux := http.NewServeMux()

// Go 1.22+ - паттерны с методами и параметрами
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id})
})

server := &http.Server{
	Addr:         ":8080",
	Handler:      mux,
	ReadTimeout:  10 * time.Second,
	WriteTimeout: 10 * time.Second,
	IdleTimeout:  60 * time.Second,
}

log.Fatal(server.ListenAndServe())

// HTTP-клиент
client := &http.Client{
	Timeout: 10 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	},
}

req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
if err != nil {
	return err
}
req.Header.Set("Authorization", "Bearer "+token)

resp, err := client.Do(req)
if err != nil {
	return err
}
defer resp.Body.Close()

body, err := io.ReadAll(resp.Body)
```

> [!important] Всегда создавайте http.Client с Timeout. http.DefaultClient не имеет таймаута и может блокировать навсегда. Всегда закрывайте resp.Body.

### Middleware pattern

```go
type Middleware func(http.Handler) http.Handler

func Logging(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			next.ServeHTTP(w, r)
			logger.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"duration", time.Since(start),
			)
		})
	}
}

func Recovery() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if r := recover(); r != nil {
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// Цепочка middleware
func Chain(handler http.Handler, middlewares ...Middleware) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

// Использование
handler := Chain(mux, Logging(logger), Recovery())
```

### encoding/json

```go
type User struct {
	ID        int64      `json:"id"`
	Email     string     `json:"email"`
	Name      string     `json:"name,omitempty"` // omitempty - пропускать пустые
	Password  string     `json:"-"`              // не сериализовать
	CreatedAt time.Time  `json:"created_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

// Маршалинг
user := User{ID: 1, Email: "alice@example.com"}
data, err := json.Marshal(user)
data, err = json.MarshalIndent(user, "", "  ") // с отступами

// Анмаршалинг
var u User
err = json.Unmarshal(data, &u)

// Работа с потоками (io.Reader/io.Writer)
err = json.NewDecoder(r.Body).Decode(&u)
err = json.NewEncoder(w).Encode(u)

// Кастомный маршалинг
type Status int

const (
	StatusActive   Status = 1
	StatusInactive Status = 2
)

func (s Status) MarshalJSON() ([]byte, error) {
	switch s {
	case StatusActive:
		return json.Marshal("active")
	case StatusInactive:
		return json.Marshal("inactive")
	default:
		return json.Marshal("unknown")
	}
}

func (s *Status) UnmarshalJSON(data []byte) error {
	var str string
	if err := json.Unmarshal(data, &str); err != nil {
		return err
	}
	switch str {
	case "active":
		*s = StatusActive
	case "inactive":
		*s = StatusInactive
	default:
		return fmt.Errorf("unknown status: %s", str)
	}
	return nil
}

// Работа с динамическим JSON
var raw map[string]json.RawMessage
json.Unmarshal(data, &raw)
```

### log/slog (Go 1.21+)

Структурированное логирование, встроенное в стандартную библиотеку:

```go
// Текстовый формат
logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
	Level: slog.LevelDebug,
}))

// JSON формат (для production)
logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	Level: slog.LevelInfo,
}))

// Использование
logger.Info("server started", "port", 8080)
logger.Error("failed to connect", "err", err, "host", dbHost)

// Группировка полей
logger.Info("request processed",
	slog.Group("request",
		slog.String("method", "GET"),
		slog.String("path", "/users"),
	),
	slog.Duration("duration", elapsed),
)

// Логгер с предустановленными полями
reqLogger := logger.With("request_id", requestID, "user_id", userID)
reqLogger.Info("order created", "order_id", orderID)

// Установка как глобальный
slog.SetDefault(logger)
slog.Info("using default logger")
```

### time

```go
now := time.Now()
future := now.Add(24 * time.Hour)
elapsed := time.Since(now)

// Парсинг и форматирование - в Go используется reference time
// Mon Jan 2 15:04:05 MST 2006
t, err := time.Parse("2006-01-02", "2024-01-15")
s := t.Format("02.01.2006 15:04")

// Таймеры и тикеры
timer := time.NewTimer(5 * time.Second)
<-timer.C // блокировка на 5 секунд

ticker := time.NewTicker(1 * time.Second)
defer ticker.Stop()
for tick := range ticker.C {
	fmt.Println("tick at", tick)
}

// Длительность
d := 5*time.Minute + 30*time.Second
fmt.Println(d) // 5m30s
```

### io и bufio

```go
// io.Reader и io.Writer - фундаментальные интерфейсы
// Копирование между reader и writer
n, err := io.Copy(dst, src)

// Чтение всего содержимого
data, err := io.ReadAll(reader)

// bufio - буферизованный ввод/вывод
scanner := bufio.NewScanner(file)
for scanner.Scan() {
	line := scanner.Text()
	// обработка строки
}
if err := scanner.Err(); err != nil {
	log.Fatal(err)
}

// Буферизованный writer
w := bufio.NewWriter(file)
w.WriteString("buffered data")
w.Flush() // не забыть сбросить буфер
```

---

## Веб-разработка

### REST API с net/http

```go
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
)

type Server struct {
	logger *slog.Logger
	router *http.ServeMux
}

func NewServer(logger *slog.Logger) *Server {
	s := &Server{
		logger: logger,
		router: http.NewServeMux(),
	}
	s.routes()
	return s
}

func (s *Server) routes() {
	s.router.HandleFunc("GET /health", s.handleHealth)
	s.router.HandleFunc("GET /users/{id}", s.handleGetUser)
	s.router.HandleFunc("POST /users", s.handleCreateUser)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.respond(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleGetUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	// получение пользователя из БД...
	s.respond(w, http.StatusOK, map[string]string{"id": id})
}

func (s *Server) handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		s.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	// создание пользователя...
	s.respond(w, http.StatusCreated, input)
}

func (s *Server) respond(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (s *Server) respondError(w http.ResponseWriter, status int, message string) {
	s.respond(w, status, map[string]string{"error": message})
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	srv := NewServer(logger)

	httpServer := &http.Server{
		Addr:         ":8080",
		Handler:      srv.router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Graceful shutdown
	go func() {
		logger.Info("server starting", "addr", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != http.ErrServerClosed {
			logger.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		logger.Error("shutdown error", "err", err)
	}
	logger.Info("server stopped")
}
```

### Популярные фреймворки

Gin - самый популярный фреймворк, высокая производительность:

```go
r := gin.Default()

r.GET("/users/:id", func(c *gin.Context) {
	id := c.Param("id")
	c.JSON(200, gin.H{"id": id})
})

r.POST("/users", func(c *gin.Context) {
	var input CreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, input)
})

r.Run(":8080")
```

Chi - легковесный роутер, совместимый с net/http:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Use(middleware.Timeout(60 * time.Second))

r.Route("/users", func(r chi.Router) {
	r.Get("/", listUsers)
	r.Post("/", createUser)
	r.Route("/{id}", func(r chi.Router) {
		r.Get("/", getUser)
		r.Put("/", updateUser)
		r.Delete("/", deleteUser)
	})
})

http.ListenAndServe(":8080", r)
```

Echo и Fiber также популярны. Echo предоставляет развитую систему middleware. Fiber построен на fasthttp и оптимизирован для максимальной производительности.

---

## Работа с базами данных

### database/sql

```go
import (
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib" // регистрация драйвера
)

func NewDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	// Настройка пула соединений
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return db, nil
}
```

### Запросы

```go
// QueryRow - одна строка
var user User
err := db.QueryRowContext(ctx,
	"SELECT id, email, name FROM users WHERE id = $1", id,
).Scan(&user.ID, &user.Email, &user.Name)

if errors.Is(err, sql.ErrNoRows) {
	return nil, ErrNotFound
}

// Query - множество строк
rows, err := db.QueryContext(ctx,
	"SELECT id, email, name FROM users WHERE active = $1 ORDER BY id LIMIT $2",
	true, 100,
)
if err != nil {
	return nil, err
}
defer rows.Close()

var users []User
for rows.Next() {
	var u User
	if err := rows.Scan(&u.ID, &u.Email, &u.Name); err != nil {
		return nil, err
	}
	users = append(users, u)
}
if err := rows.Err(); err != nil {
	return nil, err
}

// Exec - INSERT, UPDATE, DELETE
result, err := db.ExecContext(ctx,
	"INSERT INTO users (email, name) VALUES ($1, $2)",
	email, name,
)
rowsAffected, _ := result.RowsAffected()

// Prepared statements
stmt, err := db.PrepareContext(ctx,
	"SELECT id, email FROM users WHERE email = $1")
defer stmt.Close()

var u User
err = stmt.QueryRowContext(ctx, email).Scan(&u.ID, &u.Email)
```

### Транзакции

```go
func (r *UserRepo) TransferBalance(ctx context.Context, fromID, toID int64, amount int) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelSerializable,
	})
	if err != nil {
		return err
	}
	defer tx.Rollback() // безопасно вызывать после Commit

	// Операции в транзакции
	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID)
	if err != nil {
		return fmt.Errorf("debit: %w", err)
	}

	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID)
	if err != nil {
		return fmt.Errorf("credit: %w", err)
	}

	return tx.Commit()
}
```

### sqlx

sqlx расширяет database/sql удобными методами:

```go
import "github.com/jmoiron/sqlx"

type User struct {
	ID    int64  `db:"id"`
	Email string `db:"email"`
	Name  string `db:"name"`
}

// Get - одна строка в структуру
var user User
err := db.GetContext(ctx, &user, "SELECT * FROM users WHERE id = $1", id)

// Select - множество строк в слайс
var users []User
err := db.SelectContext(ctx, &users, "SELECT * FROM users WHERE active = true")

// NamedExec - именованные параметры
_, err := db.NamedExecContext(ctx,
	"INSERT INTO users (email, name) VALUES (:email, :name)",
	User{Email: "alice@example.com", Name: "Alice"},
)
```

### pgx

pgx - нативный PostgreSQL драйвер с расширенной функциональностью:

```go
import "github.com/jackc/pgx/v5/pgxpool"

pool, err := pgxpool.New(ctx, databaseURL)
defer pool.Close()

// Batch запросы
batch := &pgx.Batch{}
batch.Queue("SELECT * FROM users WHERE id = $1", 1)
batch.Queue("SELECT * FROM orders WHERE user_id = $1", 1)

br := pool.SendBatch(ctx, batch)
defer br.Close()

// Чтение результатов в порядке добавления
var user User
br.QueryRow().Scan(&user.ID, &user.Email)

rows, _ := br.Query()
// ...

// COPY для массовой вставки
rows := [][]any{
	{1, "alice@example.com", "Alice"},
	{2, "bob@example.com", "Bob"},
}

copyCount, err := pool.CopyFrom(ctx,
	pgx.Identifier{"users"},
	[]string{"id", "email", "name"},
	pgx.CopyFromRows(rows),
)
```

### Паттерн Repository

```go
type UserRepository interface {
	FindByID(ctx context.Context, id int64) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	Create(ctx context.Context, user *User) error
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filter UserFilter) ([]User, int, error)
}

type postgresUserRepo struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &postgresUserRepo{db: db}
}

func (r *postgresUserRepo) FindByID(ctx context.Context, id int64) (*User, error) {
	var user User
	err := r.db.GetContext(ctx, &user, "SELECT * FROM users WHERE id = $1", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &user, err
}

func (r *postgresUserRepo) Create(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (email, name, created_at)
		VALUES ($1, $2, $3)
		RETURNING id`
	return r.db.QueryRowContext(ctx, query,
		user.Email, user.Name, time.Now(),
	).Scan(&user.ID)
}
```

### Миграции

golang-migrate и goose - основные инструменты для миграций.

```bash
# golang-migrate
migrate create -ext sql -dir migrations -seq create_users
migrate -path migrations -database "postgres://localhost/mydb?sslmode=disable" up
migrate -path migrations -database "postgres://localhost/mydb?sslmode=disable" down 1

# goose
goose -dir migrations postgres "postgres://localhost/mydb?sslmode=disable" up
goose -dir migrations postgres "postgres://localhost/mydb?sslmode=disable" down
```

Файл миграции:

```sql
-- migrations/000001_create_users.up.sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

---

## gRPC и Protocol Buffers

### Определение proto-файла

```protobuf
// proto/user/v1/user.proto
syntax = "proto3";

package user.v1;

option go_package = "github.com/user/project/gen/user/v1";

message User {
  int64 id = 1;
  string email = 2;
  string name = 3;
}

message GetUserRequest {
  int64 id = 1;
}

message GetUserResponse {
  User user = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
}

message ListUsersResponse {
  repeated User users = 1;
  string next_page_token = 2;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc StreamUsers(ListUsersRequest) returns (stream User); // server streaming
}
```

### Генерация кода

```bash
protoc --go_out=. --go-grpc_out=. proto/user/v1/user.proto
```

### Реализация сервера

```go
type userServer struct {
	userv1.UnimplementedUserServiceServer
	repo UserRepository
}

func (s *userServer) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
	user, err := s.repo.FindByID(ctx, req.GetId())
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, status.Error(codes.NotFound, "user not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &userv1.GetUserResponse{
		User: &userv1.User{
			Id:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	}, nil
}

// Запуск gRPC сервера
lis, err := net.Listen("tcp", ":50051")
if err != nil {
	log.Fatal(err)
}

grpcServer := grpc.NewServer(
	grpc.UnaryInterceptor(loggingInterceptor),
)
userv1.RegisterUserServiceServer(grpcServer, &userServer{repo: repo})

log.Println("gRPC server on :50051")
grpcServer.Serve(lis)
```

### Interceptors

```go
func loggingInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	start := time.Now()
	resp, err := handler(ctx, req)
	slog.Info("gRPC call",
		"method", info.FullMethod,
		"duration", time.Since(start),
		"error", err,
	)
	return resp, err
}
```

> [!info] gRPC vs REST
> gRPC использует HTTP/2, поддерживает streaming, генерирует типобезопасный клиент из proto-файлов. Лучше подходит для межсервисной коммуникации. REST лучше для публичных API и работы с браузерами. Подробнее о REST - [REST](REST/REST.md).

---

## Микросервисная архитектура на Go

Подробнее о паттернах микросервисов - [Микросервисы](Microservices/Микросервисы.md).

### Структура проекта (Clean Architecture)

```
service/
  cmd/
    api/main.go
    worker/main.go
  internal/
    domain/            # бизнес-сущности и интерфейсы
      user.go
      order.go
      errors.go
    usecase/           # бизнес-логика (application layer)
      user_service.go
      order_service.go
    adapter/
      repository/      # реализация хранилищ
        postgres/
          user_repo.go
      handler/         # HTTP/gRPC обработчики
        http/
          user_handler.go
        grpc/
          user_handler.go
      gateway/         # внешние сервисы
        payment/
          stripe.go
    infrastructure/    # инфраструктурный код
      config/
        config.go
      database/
        postgres.go
      logger/
        logger.go
  migrations/
  proto/
  Dockerfile
  Makefile
```

### Dependency Injection

Ручной DI (предпочтительнее для Go):

```go
func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		logger.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	// Слой за слоем - от инфраструктуры к бизнес-логике
	userRepo := postgres.NewUserRepository(db)
	orderRepo := postgres.NewOrderRepository(db)

	userService := usecase.NewUserService(userRepo, logger)
	orderService := usecase.NewOrderService(orderRepo, userRepo, logger)

	handler := handler.NewHandler(userService, orderService, logger)

	// Запуск сервера...
}
```

Для больших проектов можно использовать wire (compile-time DI) или fx (runtime DI от Uber).

### Конфигурация

```go
type Config struct {
	Port        int    `env:"PORT" envDefault:"8080"`
	DatabaseURL string `env:"DATABASE_URL,required"`
	RedisURL    string `env:"REDIS_URL" envDefault:"localhost:6379"`
	LogLevel    string `env:"LOG_LEVEL" envDefault:"info"`
	JWTSecret   string `env:"JWT_SECRET,required"`
}

func Load() (*Config, error) {
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}
	return &cfg, nil
}
```

### Message Brokers

Kafka (с библиотекой segmentio/kafka-go):

```go
// Продюсер
writer := &kafka.Writer{
	Addr:     kafka.TCP("localhost:9092"),
	Topic:    "orders",
	Balancer: &kafka.LeastBytes{},
}
defer writer.Close()

err := writer.WriteMessages(ctx,
	kafka.Message{
		Key:   []byte(orderID),
		Value: data,
	},
)

// Консьюмер
reader := kafka.NewReader(kafka.ReaderConfig{
	Brokers:  []string{"localhost:9092"},
	Topic:    "orders",
	GroupID:  "order-processor",
	MinBytes: 10e3, // 10KB
	MaxBytes: 10e6, // 10MB
})
defer reader.Close()

for {
	msg, err := reader.ReadMessage(ctx)
	if err != nil {
		break
	}
	processMessage(msg)
}
```

### Health Checks

```go
func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	s.respond(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleReadyz(w http.ResponseWriter, r *http.Request) {
	if err := s.db.PingContext(r.Context()); err != nil {
		s.respondError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	s.respond(w, http.StatusOK, map[string]string{"status": "ready"})
}
```

### OpenTelemetry

```go
import (
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

var tracer = otel.Tracer("user-service")

func (s *UserService) GetUser(ctx context.Context, id int64) (*User, error) {
	ctx, span := tracer.Start(ctx, "UserService.GetUser",
		trace.WithAttributes(attribute.Int64("user.id", id)),
	)
	defer span.End()

	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	return user, nil
}
```

---

## Паттерны проектирования в Go

### Functional Options

Элегантный способ конфигурации с опциональными параметрами:

```go
type Server struct {
	host    string
	port    int
	timeout time.Duration
	logger  *slog.Logger
}

type Option func(*Server)

func WithHost(host string) Option {
	return func(s *Server) { s.host = host }
}

func WithPort(port int) Option {
	return func(s *Server) { s.port = port }
}

func WithTimeout(d time.Duration) Option {
	return func(s *Server) { s.timeout = d }
}

func WithLogger(l *slog.Logger) Option {
	return func(s *Server) { s.logger = l }
}

func NewServer(opts ...Option) *Server {
	s := &Server{
		host:    "0.0.0.0",
		port:    8080,
		timeout: 30 * time.Second,
		logger:  slog.Default(),
	}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

// Использование
srv := NewServer(
	WithPort(9090),
	WithTimeout(60*time.Second),
	WithLogger(myLogger),
)
```

### Builder

```go
type QueryBuilder struct {
	table      string
	conditions []string
	args       []any
	orderBy    string
	limit      int
}

func NewQuery(table string) *QueryBuilder {
	return &QueryBuilder{table: table}
}

func (q *QueryBuilder) Where(condition string, args ...any) *QueryBuilder {
	q.conditions = append(q.conditions, condition)
	q.args = append(q.args, args...)
	return q
}

func (q *QueryBuilder) OrderBy(field string) *QueryBuilder {
	q.orderBy = field
	return q
}

func (q *QueryBuilder) Limit(n int) *QueryBuilder {
	q.limit = n
	return q
}

func (q *QueryBuilder) Build() (string, []any) {
	query := "SELECT * FROM " + q.table
	if len(q.conditions) > 0 {
		query += " WHERE " + strings.Join(q.conditions, " AND ")
	}
	if q.orderBy != "" {
		query += " ORDER BY " + q.orderBy
	}
	if q.limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", q.limit)
	}
	return query, q.args
}

// Использование
query, args := NewQuery("users").
	Where("active = $1", true).
	Where("age > $2", 18).
	OrderBy("created_at DESC").
	Limit(10).
	Build()
```

### Strategy (через интерфейсы)

```go
type PaymentProcessor interface {
	Process(ctx context.Context, amount int64) (string, error)
}

type StripeProcessor struct {
	apiKey string
}

func (s *StripeProcessor) Process(ctx context.Context, amount int64) (string, error) {
	// вызов Stripe API
	return "ch_stripe_123", nil
}

type PayPalProcessor struct {
	clientID string
}

func (p *PayPalProcessor) Process(ctx context.Context, amount int64) (string, error) {
	// вызов PayPal API
	return "pp_paypal_456", nil
}

// Сервис использует интерфейс
type OrderService struct {
	payment PaymentProcessor
}

func NewOrderService(payment PaymentProcessor) *OrderService {
	return &OrderService{payment: payment}
}
```

### Middleware chain

```go
type Handler func(ctx context.Context, req any) (any, error)
type Middleware func(Handler) Handler

func WithLogging(logger *slog.Logger) Middleware {
	return func(next Handler) Handler {
		return func(ctx context.Context, req any) (any, error) {
			start := time.Now()
			resp, err := next(ctx, req)
			logger.Info("handled",
				"duration", time.Since(start),
				"error", err,
			)
			return resp, err
		}
	}
}

func WithRecovery() Middleware {
	return func(next Handler) Handler {
		return func(ctx context.Context, req any) (resp any, err error) {
			defer func() {
				if r := recover(); r != nil {
					err = fmt.Errorf("panic: %v", r)
				}
			}()
			return next(ctx, req)
		}
	}
}

func ChainMiddleware(handler Handler, mws ...Middleware) Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		handler = mws[i](handler)
	}
	return handler
}
```

---

## Производительность и профилирование

### pprof

```go
import _ "net/http/pprof"

// Добавить в main для включения pprof
go func() {
	log.Println(http.ListenAndServe("localhost:6060", nil))
}()
```

```bash
# CPU профиль
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Профиль памяти (heap)
go tool pprof http://localhost:6060/debug/pprof/heap

# Горутины
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Визуализация
go tool pprof -http=:8081 cpu.prof
```

### Escape analysis

Компилятор Go решает, где выделить переменную - на стеке или в куче. Аллокации на куче создают нагрузку на GC:

```bash
go build -gcflags="-m" ./...
```

Переменная "убегает" в кучу если: возвращается указатель на локальную переменную, переменная слишком велика для стека, компилятор не может определить размер на этапе компиляции.

```go
// Выделение на стеке (быстро)
func stackAlloc() int {
	x := 42
	return x
}

// Выделение на куче (указатель "убегает")
func heapAlloc() *int {
	x := 42
	return &x
}
```

### Оптимизация аллокаций

```go
// Преаллокация слайсов
users := make([]User, 0, expectedCount) // указываем cap

// sync.Pool для часто создаваемых объектов
var bufPool = sync.Pool{
	New: func() any { return new(bytes.Buffer) },
}

// strings.Builder вместо конкатенации
var sb strings.Builder
sb.Grow(estimatedSize) // преаллокация

// Избегать интерфейсов в горячих путях (boxing)
// Передавать структуры по указателю, если они большие
```

### Memory management и GC

Go использует concurrent mark-and-sweep GC. Настройки:

```bash
# Целевой процент GC (по умолчанию 100)
GOGC=200 ./myapp  # GC будет работать реже

# Мягкий лимит памяти (Go 1.19+)
GOMEMLIMIT=1GiB ./myapp
```

---

## Production best practices

### Dockerfile (multi-stage build)

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/api

# Runtime stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

USER nobody:nobody
ENTRYPOINT ["./server"]
```

### Makefile

```makefile
.PHONY: build run test lint migrate

APP_NAME := myservice
BUILD_DIR := ./bin

build:
	go build -ldflags="-s -w" -o $(BUILD_DIR)/$(APP_NAME) ./cmd/api

run:
	go run ./cmd/api

test:
	go test -race -cover -count=1 ./...

lint:
	golangci-lint run ./...

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down 1

generate:
	go generate ./...

docker-build:
	docker build -t $(APP_NAME):latest .
```

### golangci-lint

Файл `.golangci.yml`:

```yaml
run:
  timeout: 5m

linters:
  enable:
    - errcheck
    - govet
    - staticcheck
    - unused
    - gosimple
    - ineffassign
    - revive
    - gocritic
    - gosec
    - prealloc
    - misspell

linters-settings:
  revive:
    rules:
      - name: exported
        severity: warning
  gocritic:
    enabled-tags:
      - diagnostic
      - performance
      - style

issues:
  exclude-dirs:
    - vendor
    - gen
```

### Graceful shutdown

```go
func run(ctx context.Context) error {
	ctx, cancel := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// Инициализация ресурсов
	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		return err
	}

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: handler,
	}

	// Запуск сервера в горутине
	errCh := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	// Ожидание сигнала или ошибки
	select {
	case err := <-errCh:
		return fmt.Errorf("server error: %w", err)
	case <-ctx.Done():
		slog.Info("shutting down")
	}

	// Graceful shutdown с таймаутом
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}

	db.Close()
	slog.Info("server stopped gracefully")
	return nil
}

func main() {
	if err := run(context.Background()); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}
```

### Логирование

Для production рекомендуется slog (стандартная библиотека, Go 1.21+), zerolog или zap.

```go
// slog - стандартная библиотека
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	Level:     slog.LevelInfo,
	AddSource: true,
}))

// zerolog - максимальная производительность
logger := zerolog.New(os.Stdout).With().Timestamp().Caller().Logger()
logger.Info().Str("service", "api").Int("port", 8080).Msg("server started")

// zap - от Uber, очень популярен
logger, _ := zap.NewProduction()
defer logger.Sync()
logger.Info("server started", zap.Int("port", 8080))
```

---

## Экосистема Go

Ключевые библиотеки по категориям:

Веб-фреймворки:
- gin - самый популярный, высокая производительность
- echo - минималистичный с хорошим middleware
- chi - легковесный роутер, совместим с net/http
- fiber - построен на fasthttp, API похож на Express.js

ORM и работа с БД:
- sqlx - расширение database/sql
- pgx - нативный PostgreSQL драйвер
- gorm - полноценный ORM
- sqlc - генерация Go-кода из SQL-запросов
- ent - entity framework от Facebook

Логирование:
- slog - стандартная библиотека (Go 1.21+)
- zerolog - zero allocation JSON logger
- zap - от Uber, высокая производительность

Тестирование:
- testify - assert, require, mock, suite
- gomock - моки через кодогенерацию
- testcontainers-go - интеграционные тесты с Docker

CLI:
- cobra - создание CLI приложений (используется в kubectl, Hugo)
- urfave/cli - альтернатива cobra

Конфигурация:
- viper - работа с конфигами (YAML, TOML, env)
- caarlos0/env - парсинг переменных окружения в структуры
- koanf - легковесная альтернатива viper

Валидация:
- go-playground/validator - валидация через теги

Message brokers:
- segmentio/kafka-go - Kafka клиент
- nats.go - NATS клиент
- amqp091-go - RabbitMQ клиент

Observability:
- opentelemetry-go - tracing и metrics
- prometheus/client_golang - метрики Prometheus

gRPC:
- grpc-go - gRPC для Go
- buf - инструментарий для Protocol Buffers
- grpc-gateway - REST to gRPC proxy

Утилиты:
- lo - lodash-подобные утилиты с дженериками
- samber/do - DI контейнер
- golang.org/x/sync/errgroup - группы горутин с ошибками

---

## Ссылки

- [Микросервисы](Microservices/Микросервисы.md)
- [REST](REST/REST.md)
