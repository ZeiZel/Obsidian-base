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

### Приведение типов

Go требует явного приведения типов - неявных конвертаций нет:

```go
// Числовые преобразования
var i int = 42
var f float64 = float64(i)   // int -> float64
var u uint = uint(i)         // int -> uint
var i32 int32 = int32(i)     // int -> int32 (возможна потеря данных!)

// Осторожно с переполнением
var big int64 = 300
var small int8 = int8(big)   // 44 (переполнение, без ошибки!)

// Строки и байты
s := "Привет"
b := []byte(s)               // string -> []byte (копирование)
s2 := string(b)              // []byte -> string (копирование)

// Строки и руны (для работы с Unicode)
r := []rune(s)               // string -> []rune
fmt.Println(len(s))          // 12 (байт)
fmt.Println(len(r))          // 6 (символов)
s3 := string(r)              // []rune -> string

// int -> string - НЕ конвертирует число в строку
wrong := string(65)          // "A" (символ Unicode 65)
right := strconv.Itoa(65)    // "65"
right2 := fmt.Sprintf("%d", 65) // "65"

// Дополнительные конвертации из strconv
strconv.FormatFloat(3.14, 'f', 2, 64)  // "3.14"
strconv.FormatBool(true)                // "true"
strconv.ParseBool("true")              // true, nil
strconv.ParseInt("FF", 16, 64)         // 255, nil (hex)
```

> [!info] В Go нет неявных приведений даже между совместимыми типами. int32 и int64 - разные типы, нужно явное преобразование. Это предотвращает целый класс багов, связанных с неожиданными конвертациями.

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

### Продвинутые паттерны

#### Rate Limiter

```go
import "golang.org/x/time/rate"

// Token bucket rate limiter
limiter := rate.NewLimiter(rate.Every(100*time.Millisecond), 10) // 10 rps, burst 10

func handleRequest(w http.ResponseWriter, r *http.Request) {
	if !limiter.Allow() {
		http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
		return
	}
	// обработка запроса
}

// Wait - блокируется до получения токена
func processItem(ctx context.Context, item Item) error {
	if err := limiter.Wait(ctx); err != nil {
		return err // context отменён
	}
	return callExternalAPI(item)
}

// Per-key rate limiting
type KeyLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
}

func (kl *KeyLimiter) Get(key string) *rate.Limiter {
	kl.mu.Lock()
	defer kl.mu.Unlock()
	if l, ok := kl.limiters[key]; ok {
		return l
	}
	l := rate.NewLimiter(rate.Every(time.Second), 5)
	kl.limiters[key] = l
	return l
}
```

#### Circuit Breaker

Паттерн предохранителя защищает от каскадных сбоев при отказе зависимости:

```go
type State int

const (
	StateClosed   State = iota // нормальная работа
	StateOpen                  // запросы блокируются
	StateHalfOpen              // пробный запрос
)

type CircuitBreaker struct {
	mu               sync.Mutex
	state            State
	failures         int
	maxFailures      int
	lastFailure      time.Time
	cooldown         time.Duration
}

func NewCircuitBreaker(maxFailures int, cooldown time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		maxFailures: maxFailures,
		cooldown:    cooldown,
	}
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
	cb.mu.Lock()
	if cb.state == StateOpen {
		if time.Since(cb.lastFailure) > cb.cooldown {
			cb.state = StateHalfOpen
		} else {
			cb.mu.Unlock()
			return fmt.Errorf("circuit breaker is open")
		}
	}
	cb.mu.Unlock()

	err := fn()

	cb.mu.Lock()
	defer cb.mu.Unlock()
	if err != nil {
		cb.failures++
		cb.lastFailure = time.Now()
		if cb.failures >= cb.maxFailures {
			cb.state = StateOpen
		}
		return err
	}

	cb.failures = 0
	cb.state = StateClosed
	return nil
}
```

> [!info] Для production-кода используйте библиотеку sony/gobreaker, которая предоставляет готовую реализацию с метриками и гибкой настройкой.

#### errgroup с ограничением параллелизма

```go
import "golang.org/x/sync/errgroup"

func fetchAllURLs(ctx context.Context, urls []string) ([]string, error) {
	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(10) // максимум 10 одновременных горутин (Go 1.20+)

	results := make([]string, len(urls))
	for i, url := range urls {
		i, url := i, url
		g.Go(func() error {
			body, err := fetchURL(ctx, url)
			if err != nil {
				return err
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

#### Or-done channel

Паттерн для раннего завершения при отмене контекста:

```go
func orDone(ctx context.Context, ch <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return
			case v, ok := <-ch:
				if !ok {
					return
				}
				select {
				case out <- v:
				case <-ctx.Done():
					return
				}
			}
		}
	}()
	return out
}
```

### Частые ошибки конкурентности

#### Утечка горутин

```go
// НЕПРАВИЛЬНО - горутина висит навсегда если никто не читает из ch
func leaky() <-chan int {
	ch := make(chan int)
	go func() {
		val := expensiveComputation()
		ch <- val // блокируется навсегда если никто не прочитает
	}()
	return ch
}

// ПРАВИЛЬНО - горутина завершается при отмене контекста
func safe(ctx context.Context) <-chan int {
	ch := make(chan int, 1) // буфер = 1, не блокируется при записи
	go func() {
		val := expensiveComputation()
		select {
		case ch <- val:
		case <-ctx.Done():
		}
	}()
	return ch
}
```

#### Замыкание на переменную цикла

```go
// НЕПРАВИЛЬНО (до Go 1.22) - все горутины видят последнее значение i
for i := 0; i < 5; i++ {
	go func() {
		fmt.Println(i) // может напечатать 5, 5, 5, 5, 5
	}()
}

// ПРАВИЛЬНО - передать как аргумент
for i := 0; i < 5; i++ {
	go func(id int) {
		fmt.Println(id)
	}(i)
}

// С Go 1.22 переменная цикла создаётся заново на каждой итерации
// и первый вариант тоже работает корректно
```

#### Забытый cancel

```go
// НЕПРАВИЛЬНО - утечка ресурсов контекста
func bad() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	// cancel никогда не вызывается - утечка
	doWork(ctx)
}

// ПРАВИЛЬНО - defer cancel() сразу после создания
func good() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel() // всегда вызывай cancel
	doWork(ctx)
}
```

#### Конкурентная запись в map

```go
// ПАНИКА в рантайме - concurrent map writes
m := make(map[string]int)
for i := 0; i < 100; i++ {
	go func(n int) {
		m[fmt.Sprintf("key%d", n)] = n // panic!
	}(i)
}

// ПРАВИЛЬНО - sync.Mutex
var mu sync.Mutex
for i := 0; i < 100; i++ {
	go func(n int) {
		mu.Lock()
		m[fmt.Sprintf("key%d", n)] = n
		mu.Unlock()
	}(i)
}

// Или sync.Map для случаев "записать один раз, читать много"
var sm sync.Map
sm.Store("key", "value")
val, ok := sm.Load("key")
```

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

### os

Пакет os предоставляет платформо-независимый интерфейс к операционной системе:

```go
import "os"

// Чтение и запись файлов (Go 1.16+)
data, err := os.ReadFile("config.json")    // читает весь файл
err = os.WriteFile("output.txt", data, 0644) // записывает файл

// Работа с файлами через хендлы
f, err := os.Create("new.txt")   // создаёт или перезаписывает
f, err = os.Open("existing.txt") // открывает для чтения
f, err = os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
defer f.Close()
f.WriteString("log line\n")

// Директории
err = os.Mkdir("dir", 0755)            // одна директория
err = os.MkdirAll("path/to/dir", 0755) // рекурсивно
entries, err := os.ReadDir(".")         // содержимое директории

// Удаление
os.Remove("file.txt")      // один файл/пустая директория
os.RemoveAll("temp_dir")   // рекурсивно

// Информация о файле
info, err := os.Stat("file.txt")
if os.IsNotExist(err) {
	fmt.Println("файл не существует")
}
fmt.Println(info.Size(), info.ModTime(), info.IsDir())

// Переменные окружения
home := os.Getenv("HOME")         // пустая строка если нет
port, ok := os.LookupEnv("PORT")  // ok == false если нет
os.Setenv("APP_MODE", "production")
allEnv := os.Environ()             // []string{"KEY=value", ...}

// Аргументы командной строки
args := os.Args // [0] = путь к программе, [1:] = аргументы

// Завершение программы
os.Exit(1) // deferred функции НЕ выполняются
```

### path/filepath

Работа с путями файловой системы платформо-независимым способом:

```go
import "path/filepath"

// Построение путей
full := filepath.Join("home", "user", "docs", "file.txt")
// Linux: "home/user/docs/file.txt"
// Windows: "home\\user\\docs\\file.txt"

// Разбор пути
dir := filepath.Dir("/home/user/file.txt")   // "/home/user"
base := filepath.Base("/home/user/file.txt")  // "file.txt"
ext := filepath.Ext("archive.tar.gz")         // ".gz"

// Абсолютный путь
abs, err := filepath.Abs("relative/path")

// Обход дерева файлов (Go 1.16+, быстрее чем Walk)
filepath.WalkDir(".", func(path string, d fs.DirEntry, err error) error {
	if err != nil {
		return err
	}
	if d.IsDir() && d.Name() == "node_modules" {
		return filepath.SkipDir // пропустить директорию
	}
	if filepath.Ext(path) == ".go" {
		fmt.Println(path)
	}
	return nil
})

// Поиск по шаблону
matches, err := filepath.Glob("*.go")              // все .go файлы
matches, err = filepath.Glob("internal/**/*.go")    // рекурсивно
```

### regexp

Регулярные выражения в Go используют синтаксис RE2 (без обратных ссылок, гарантированно линейное время):

```go
import "regexp"

// Компиляция (MustCompile паникует при ошибке - для инициализации)
re := regexp.MustCompile(`\b[A-Z][a-z]+\b`)

// Проверка на соответствие
matched := re.MatchString("Hello World") // true

// Поиск первого совпадения
first := re.FindString("Hello World Beautiful Day") // "Hello"

// Поиск всех совпадений
all := re.FindAllString("Hello World Beautiful Day", -1)
// ["Hello", "World", "Beautiful", "Day"]

// Замена
result := re.ReplaceAllString("Hello World", "***") // "*** ***"

// Именованные группы
re = regexp.MustCompile(`(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})`)
match := re.FindStringSubmatch("2024-01-15")
for i, name := range re.SubexpNames() {
	if name != "" {
		fmt.Printf("%s: %s\n", name, match[i])
	}
}
// year: 2024, month: 01, day: 15

// Замена с функцией
re = regexp.MustCompile(`\d+`)
result = re.ReplaceAllStringFunc("price: 100, tax: 20", func(s string) string {
	n, _ := strconv.Atoi(s)
	return strconv.Itoa(n * 2)
})
// "price: 200, tax: 40"
```

### sort и slices (Go 1.21+)

```go
import (
	"sort"
	"slices"
	"maps"
)

// sort.Slice - сортировка через функцию сравнения
users := []User{{Name: "Charlie", Age: 30}, {Name: "Alice", Age: 25}, {Name: "Bob", Age: 35}}
sort.Slice(users, func(i, j int) bool {
	return users[i].Age < users[j].Age
})

// sort.SliceStable - стабильная сортировка (сохраняет порядок равных элементов)
sort.SliceStable(users, func(i, j int) bool {
	return users[i].Name < users[j].Name
})

// slices (Go 1.21+) - типобезопасные функции для слайсов
nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
slices.Sort(nums)                          // [1, 1, 2, 3, 4, 5, 6, 9]
slices.SortFunc(users, func(a, b User) int {
	return strings.Compare(a.Name, b.Name)
})

slices.Contains(nums, 5)                   // true
idx := slices.Index(nums, 4)               // индекс элемента
slices.Reverse(nums)                       // на месте
compact := slices.Compact(nums)            // убирает последовательные дубли
min := slices.Min(nums)                    // минимум
max := slices.Max(nums)                    // максимум

// Бинарный поиск (слайс должен быть отсортирован)
idx, found := slices.BinarySearch(nums, 5)

// maps (Go 1.21+) - утилиты для map
m := map[string]int{"a": 1, "b": 2, "c": 3}
keys := slices.Sorted(maps.Keys(m))     // отсортированные ключи
values := slices.Collect(maps.Values(m)) // все значения
```

### math и math/rand

```go
import (
	"math"
	"math/rand/v2" // Go 1.22+
	"crypto/rand"
)

// math - математические функции
math.Abs(-3.14)     // 3.14
math.Ceil(2.3)      // 3
math.Floor(2.7)     // 2
math.Round(2.5)     // 3
math.Max(1.0, 2.0)  // 2
math.Min(1.0, 2.0)  // 1
math.Pow(2, 10)     // 1024
math.Sqrt(144)      // 12
math.Log(math.E)    // 1
math.Log2(1024)     // 10

// Константы
math.Pi             // 3.141592653589793
math.MaxInt64       // 9223372036854775807
math.MaxFloat64     // 1.7976931348623157e+308

// math/rand/v2 (Go 1.22+) - автоматически сеется, не нужен Seed()
n := rand.IntN(100)              // [0, 100)
f := rand.Float64()              // [0.0, 1.0)
rand.Shuffle(len(items), func(i, j int) {
	items[i], items[j] = items[j], items[i]
})

// crypto/rand - криптографически стойкие случайные числа
b := make([]byte, 32)
_, err := crypto_rand.Read(b) // для токенов, ключей, нонсов
```

### net/url

Работа с URL и query-параметрами:

```go
import "net/url"

// Парсинг URL
u, err := url.Parse("https://api.example.com:8080/users?page=2&limit=10#section")
fmt.Println(u.Scheme)   // "https"
fmt.Println(u.Host)     // "api.example.com:8080"
fmt.Println(u.Hostname()) // "api.example.com"
fmt.Println(u.Port())   // "8080"
fmt.Println(u.Path)     // "/users"
fmt.Println(u.RawQuery) // "page=2&limit=10"
fmt.Println(u.Fragment) // "section"

// Работа с query-параметрами
q := u.Query()            // url.Values (map[string][]string)
page := q.Get("page")     // "2"
q.Set("page", "3")
q.Add("sort", "name")
u.RawQuery = q.Encode()   // "limit=10&page=3&sort=name"

// Построение URL
u = &url.URL{
	Scheme: "https",
	Host:   "api.example.com",
	Path:   "/users/search",
}
q = u.Query()
q.Set("name", "John Doe")
u.RawQuery = q.Encode()
fmt.Println(u.String()) // "https://api.example.com/users/search?name=John+Doe"

// Кодирование/декодирование
encoded := url.QueryEscape("hello world & more") // "hello+world+%26+more"
decoded, _ := url.QueryUnescape(encoded)
pathEncoded := url.PathEscape("path/with spaces") // "path%2Fwith%20spaces"
```

### flag

Разбор аргументов командной строки:

```go
import "flag"

func main() {
	// Определение флагов
	host := flag.String("host", "localhost", "адрес сервера")
	port := flag.Int("port", 8080, "порт сервера")
	verbose := flag.Bool("verbose", false, "подробный вывод")
	
	// Привязка к существующей переменной
	var configPath string
	flag.StringVar(&configPath, "config", "config.yaml", "путь к конфигу")

	// Кастомный usage
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: %s [options]\n\nOptions:\n", os.Args[0])
		flag.PrintDefaults()
	}

	flag.Parse()

	// Оставшиеся аргументы (после флагов)
	args := flag.Args() // []string

	fmt.Printf("Server: %s:%d, verbose: %t\n", *host, *port, *verbose)
	fmt.Printf("Config: %s, args: %v\n", configPath, args)
}
```

```bash
# Использование
./app -host=0.0.0.0 -port=9090 -verbose -config=/etc/app.yaml arg1 arg2
./app --host 0.0.0.0 --port 9090  # можно и через --
```

> [!info] Для сложных CLI с подкомандами (git-style) стандартный flag недостаточен. Используйте cobra или urfave/cli.

### html/template и text/template

Go имеет два пакета шаблонов: text/template для произвольного текста и html/template для HTML с автоматическим экранированием (защита от XSS):

```go
import "html/template"

// Базовый шаблон
const tmpl = `
<!DOCTYPE html>
<html>
<body>
  <h1>{{.Title}}</h1>
  {{if .Items}}
  <ul>
    {{range .Items}}
    <li>{{.Name}} - {{.Price | printf "%.2f"}} руб.</li>
    {{end}}
  </ul>
  {{else}}
  <p>Нет товаров</p>
  {{end}}
  <p>Всего: {{len .Items}} позиций</p>
</body>
</html>`

type PageData struct {
	Title string
	Items []Item
}

type Item struct {
	Name  string
	Price float64
}

func renderPage(w http.ResponseWriter, data PageData) error {
	t := template.Must(template.New("page").Parse(tmpl))
	return t.Execute(w, data)
}

// FuncMap - пользовательские функции в шаблонах
funcMap := template.FuncMap{
	"upper": strings.ToUpper,
	"formatDate": func(t time.Time) string {
		return t.Format("02.01.2006")
	},
}

t := template.Must(template.New("page").Funcs(funcMap).Parse(`
	<p>{{.Name | upper}}</p>
	<p>{{.CreatedAt | formatDate}}</p>
`))

// Композиция шаблонов (define/template)
const layout = `
{{define "base"}}
<!DOCTYPE html>
<html>
<head><title>{{template "title" .}}</title></head>
<body>{{template "content" .}}</body>
</html>
{{end}}`

const page = `
{{define "title"}}Главная{{end}}
{{define "content"}}<h1>Привет, {{.User}}!</h1>{{end}}`
```

> [!info] html/template автоматически экранирует данные в зависимости от контекста (HTML, CSS, JS, URL). Это защищает от XSS-атак без дополнительных усилий. text/template не экранирует - используйте его только для генерации неHTML-контента (конфиги, email, код).

### crypto

```go
import (
	"crypto/sha256"
	"crypto/hmac"
	"crypto/rand"
	"encoding/hex"
	"golang.org/x/crypto/bcrypt"
)

// SHA-256 хеширование
hash := sha256.Sum256([]byte("hello world"))
hashHex := hex.EncodeToString(hash[:])
// "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"

// Хеширование потока (большие файлы)
h := sha256.New()
io.Copy(h, file) // хешируем не загружая весь файл в память
sum := h.Sum(nil)

// HMAC - подпись данных ключом
mac := hmac.New(sha256.New, []byte("secret-key"))
mac.Write([]byte("message"))
signature := mac.Sum(nil)

// Проверка HMAC (constant-time comparison)
valid := hmac.Equal(signature, expectedSignature)

// bcrypt - хеширование паролей (golang.org/x/crypto)
hashed, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
err = bcrypt.CompareHashAndPassword(hashed, []byte("password123")) // nil = совпадает

// Генерация криптографически стойких токенов
token := make([]byte, 32)
rand.Read(token)
tokenStr := hex.EncodeToString(token) // 64-символьный hex-токен
```

### embed (Go 1.16+)

Директива `//go:embed` встраивает файлы в бинарник на этапе компиляции:

```go
import "embed"

// Встраивание одного файла
//go:embed config/defaults.json
var defaultConfig []byte

// Встраивание одного файла как строки
//go:embed version.txt
var version string

// Встраивание директории (embed.FS реализует fs.FS)
//go:embed static/*
var staticFiles embed.FS

// Использование с http.FileServer
mux.Handle("/static/", http.FileServer(http.FS(staticFiles)))

// Использование с html/template
//go:embed templates/*.html
var templateFS embed.FS

tmpl := template.Must(template.ParseFS(templateFS, "templates/*.html"))

// Чтение конкретного файла из embed.FS
data, err := staticFiles.ReadFile("static/index.html")

// Обход файлов
fs.WalkDir(staticFiles, ".", func(path string, d fs.DirEntry, err error) error {
	fmt.Println(path)
	return nil
})
```

> [!info] embed удобен для встраивания шаблонов, статических файлов, конфигов по умолчанию, SQL-миграций. Файлы включаются в бинарник - деплой остаётся одним файлом.

### reflect

Пакет reflect позволяет инспектировать и модифицировать типы и значения в рантайме:

```go
import "reflect"

type User struct {
	Name  string `json:"name" validate:"required"`
	Email string `json:"email" validate:"required,email"`
	Age   int    `json:"age" validate:"gte=0"`
}

u := User{Name: "Alice", Email: "alice@example.com", Age: 30}

// Информация о типе
t := reflect.TypeOf(u)
fmt.Println(t.Name())       // "User"
fmt.Println(t.NumField())   // 3

// Итерация по полям и чтение тегов
for i := 0; i < t.NumField(); i++ {
	field := t.Field(i)
	jsonTag := field.Tag.Get("json")
	validateTag := field.Tag.Get("validate")
	fmt.Printf("%s: json=%s validate=%s\n", field.Name, jsonTag, validateTag)
}

// Чтение значений через reflect.Value
v := reflect.ValueOf(u)
for i := 0; i < v.NumField(); i++ {
	fmt.Printf("%s = %v\n", t.Field(i).Name, v.Field(i).Interface())
}

// Модификация (нужен указатель)
v = reflect.ValueOf(&u).Elem()
v.FieldByName("Name").SetString("Bob")

// Проверка типа и kind
fmt.Println(t.Kind())        // reflect.Struct
fmt.Println(reflect.TypeOf(42).Kind()) // reflect.Int
```

> [!important] reflect работает медленно и лишает код типобезопасности. Используйте его только когда нет альтернативы: написание ORM, сериализация, валидация по тегам, dependency injection. Для обычного прикладного кода предпочитайте интерфейсы и дженерики.

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

## Внутренности Go

### Компиляция и линковка

Go компилирует код в нативные бинарники. Процесс компиляции проходит через несколько фаз:

1. Лексический анализ и парсинг - исходный код преобразуется в AST (Abstract Syntax Tree)
2. Type checking - проверка типов на основе AST
3. SSA (Static Single Assignment) - промежуточное представление для оптимизаций
4. Генерация машинного кода - платформо-зависимый код

По умолчанию Go линкует статически - бинарник содержит всё необходимое и не зависит от системных библиотек. Если используется CGO, линковка становится динамической:

```bash
# Полностью статический бинарник (без CGO)
CGO_ENABLED=0 go build -o app ./cmd/api

# Кросс-компиляция для разных платформ
GOOS=linux GOARCH=amd64 go build -o app-linux
GOOS=darwin GOARCH=arm64 go build -o app-mac
GOOS=windows GOARCH=amd64 go build -o app.exe

# Уменьшение размера бинарника
go build -ldflags="-s -w" -o app  # -s убирает таблицу символов, -w - DWARF

# Внедрение переменных при сборке
go build -ldflags="-X main.version=1.0.0 -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

Build tags позволяют включать/исключать файлы из компиляции:

```go
//go:build linux && amd64
// +build linux,amd64

package mypackage

// Этот файл будет скомпилирован только для linux/amd64
```

### Планировщик Go (GMP модель)

Планировщик Go мультиплексирует горутины на потоки ОС. Модель состоит из трёх сущностей:

```
 G - горутина (единица выполнения, ~2-8 KB стека)
 M - машинный поток (OS thread)
 P - логический процессор (контекст выполнения, привязан к M)

         ┌─────────────────────────────────────────────┐
         │          Global Run Queue (GRQ)              │
         │   [G] [G] [G]                               │
         └──────────────┬──────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
  ┌─┴──┐             ┌─┴──┐             ┌─┴──┐
  │ P0 │             │ P1 │             │ P2 │
  ├────┤             ├────┤             ├────┤
  │LRQ:│             │LRQ:│             │LRQ:│
  │[G] │             │[G] │             │    │  <- пустая очередь
  │[G] │             │[G] │             │    │     (work stealing)
  │[G] │             │    │             │    │
  └─┬──┘             └─┬──┘             └─┬──┘
    │                   │                   │
  ┌─┴──┐             ┌─┴──┐             ┌─┴──┐
  │ M0 │             │ M1 │             │ M2 │
  └────┘             └────┘             └────┘
   OS Thread          OS Thread          OS Thread
```

- P (логический процессор) содержит локальную очередь горутин (LRQ). Количество P определяется GOMAXPROCS (по умолчанию = количество ядер CPU)
- M (машинный поток) выполняет горутины из очереди P, к которому привязан
- Если LRQ процессора P пуста, он "крадёт" горутины из очереди другого P (work stealing)
- Если горутина делает системный вызов (syscall), M блокируется, P отсоединяется и привязывается к другому M

Вытесняющая многозадачность (с Go 1.14): горутины вытесняются даже без явных точек переключения (вызовы функций, операции с каналами). Это предотвращает блокировку планировщика "тяжёлыми" вычислениями в одной горутине.

```bash
# Установка количества логических процессоров
GOMAXPROCS=4 ./myapp

# В коде
runtime.GOMAXPROCS(4)
fmt.Println(runtime.NumGoroutine()) // текущее количество горутин
```

### Модель памяти Go

Модель памяти определяет условия, при которых чтение переменной в одной горутине гарантированно увидит значение, записанное другой горутиной. Ключевое понятие - happens-before.

Гарантированные точки синхронизации (happens-before):
- Запись в канал happens-before чтения из этого канала
- Закрытие канала happens-before чтения, которое возвращает zero value
- Отправка в небуферизованный канал happens-before завершения получения
- sync.Mutex.Unlock() happens-before следующего Lock()
- sync.Once.Do(f) - вызов f happens-before возврата любого Do()
- Запуск горутины go f() happens-before начала выполнения f()
- Операции sync/atomic обеспечивают happens-before

```go
// НЕПРАВИЛЬНО - нет гарантии что горутина увидит done == true
var done bool
var result string

go func() {
	result = "hello"
	done = true
}()

for !done {} // busy-wait, может зависнуть навсегда
fmt.Println(result)

// ПРАВИЛЬНО - канал обеспечивает happens-before
ch := make(chan struct{})

go func() {
	result = "hello"
	close(ch) // happens-before чтения из ch
}()

<-ch
fmt.Println(result) // гарантированно "hello"
```

> [!important] Без явной синхронизации компилятор и процессор могут переупорядочивать операции. Даже если в исходном коде запись в переменную стоит до записи в флаг, другая горутина может увидеть их в обратном порядке. Всегда используйте каналы, мьютексы или атомарные операции для межгорутинного обмена данными.

### Сборщик мусора (GC)

Go использует concurrent tri-color mark-and-sweep GC. "Concurrent" означает, что GC работает одновременно с приложением, минимизируя паузы (STW - stop-the-world).

Три цвета объектов:
- Белый - не посещён (потенциальный мусор)
- Серый - посещён, но его ссылки ещё не проверены
- Чёрный - посещён, все ссылки проверены (достижим)

Фазы GC:
1. Mark Setup (STW) - включение write barrier, подготовка к маркировке. Пауза < 1 мс
2. Marking (concurrent) - обход графа объектов, маркировка достижимых. Работает параллельно с приложением
3. Mark Termination (STW) - завершение маркировки, отключение write barrier. Пауза < 1 мс
4. Sweeping (concurrent) - освобождение памяти белых объектов

Write barrier гарантирует корректность: если приложение создаёт новую ссылку на белый объект из чёрного объекта во время маркировки, write barrier перекрашивает объект в серый.

```bash
# Диагностика GC
GODEBUG=gctrace=1 ./myapp

# Вывод: gc 1 @0.012s 2%: 0.021+1.2+0.014 ms clock, 0.17+0.8/1.1/0+0.11 ms cpu, 4->4->1 MB, 4 MB goal, 8 P
#   gc 1     - номер запуска GC
#   @0.012s  - время с момента старта программы
#   2%       - процент времени CPU, потраченный на GC
#   4->4->1  - heap до GC -> heap в конце GC -> live heap
```

Настройка GC:

```go
import "runtime/debug"

// GOGC - порог запуска GC (процент роста heap с последнего GC)
// По умолчанию 100 (GC запускается когда heap удваивается)
debug.SetGCPercent(200) // GC реже, больше потребление памяти
debug.SetGCPercent(-1)  // отключить GC (осторожно!)

// GOMEMLIMIT - мягкий лимит памяти (Go 1.19+)
debug.SetMemoryLimit(1 << 30) // 1 GiB

// Чтение статистики
var stats runtime.MemStats
runtime.ReadMemStats(&stats)
fmt.Printf("Alloc: %d MB\n", stats.Alloc/1024/1024)
fmt.Printf("NumGC: %d\n", stats.NumGC)
fmt.Printf("PauseTotalNs: %d ms\n", stats.PauseTotalNs/1e6)
```

### Стек горутин

Каждая горутина начинает с маленького стека (2-8 KB). При необходимости Go автоматически увеличивает стек:

1. Компилятор вставляет проверку стека в пролог каждой функции
2. Если стека недостаточно, рантайм выделяет новый стек в 2 раза больше
3. Данные копируются в новый стек, указатели обновляются
4. Старый стек освобождается

Это называется contiguous stacks (с Go 1.4). До этого использовались segmented stacks, которые вызывали "hot split" проблему - частое переключение между сегментами.

Стек может также уменьшаться - если после GC стек используется менее чем на 1/4, он сжимается вдвое. Максимальный размер стека по умолчанию - 1 GB (настраивается через runtime/debug.SetMaxStack).

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

HTTP-клиенты:
- resty - декларативный HTTP-клиент с retry, middleware, auto-unmarshal
- hashicorp/go-retryablehttp - HTTP-клиент с автоматическими повторами

Аутентификация:
- golang-jwt/jwt - создание и верификация JWT токенов
- casbin - гибкая библиотека авторизации (RBAC, ABAC, ACL)

Очереди задач:
- asynq - простая и надёжная очередь на Redis
- machinery - распределённая очередь задач

Workflow:
- temporal - движок durable execution для сложных бизнес-процессов (подробнее ниже)

Документация API:
- swaggo/swag - генерация Swagger/OpenAPI из комментариев

Миграции:
- golang-migrate - миграции через CLI и библиотеку
- goose - миграции с поддержкой Go-функций
- atlas - декларативные миграции от Ariga

Обработка ошибок:
- cockroachdb/errors - расширенные ошибки со стектрейсами и sentinel wrapping

---

## Популярные библиотеки с примерами

### cobra - CLI приложения

Cobra используется в kubectl, Hugo, GitHub CLI и десятках других инструментов:

```go
package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

func main() {
	var verbose bool

	rootCmd := &cobra.Command{
		Use:   "mytool",
		Short: "Инструмент для управления сервисами",
	}

	// Глобальный флаг для всех подкоманд
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "подробный вывод")

	// Подкоманда deploy
	var env string
	deployCmd := &cobra.Command{
		Use:   "deploy [service]",
		Short: "Деплой сервиса",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			service := args[0]
			fmt.Printf("Деплой %s в %s\n", service, env)
			if verbose {
				fmt.Println("Подробный режим включён")
			}
			return nil
		},
	}
	deployCmd.Flags().StringVarP(&env, "env", "e", "staging", "окружение")

	// Подкоманда status
	statusCmd := &cobra.Command{
		Use:   "status",
		Short: "Статус сервисов",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Все сервисы работают")
		},
	}

	rootCmd.AddCommand(deployCmd, statusCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
```

### go-playground/validator

Валидация структур через теги:

```go
import "github.com/go-playground/validator/v10"

type CreateUserInput struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Age      int    `json:"age" validate:"required,gte=18,lte=150"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"required,oneof=user admin moderator"`
	Website  string `json:"website" validate:"omitempty,url"`
}

var validate = validator.New()

func validateInput(input *CreateUserInput) error {
	if err := validate.Struct(input); err != nil {
		// Извлечение конкретных ошибок валидации
		for _, e := range err.(validator.ValidationErrors) {
			fmt.Printf("Поле %s не прошло проверку %s\n", e.Field(), e.Tag())
		}
		return err
	}
	return nil
}

// Кастомный валидатор
validate.RegisterValidation("nowhitespace", func(fl validator.FieldLevel) bool {
	return !strings.Contains(fl.Field().String(), " ")
})
```

### golang-jwt/jwt

Создание и верификация JWT-токенов:

```go
import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Создание токена
func generateToken(userID int64, email, role, secret string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "myservice",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// Парсинг и верификация
func parseToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{},
		func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
```

### sqlc - генерация кода из SQL

sqlc генерирует типобезопасный Go-код из SQL-запросов. Конфигурация `sqlc.yaml`:

```yaml
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
```

SQL-запросы с аннотациями:

```sql
-- queries/users.sql

-- name: GetUser :one
SELECT id, email, name, created_at FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT id, email, name, created_at FROM users ORDER BY id LIMIT $1 OFFSET $2;

-- name: CreateUser :one
INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;
```

Использование сгенерированного кода:

```go
// sqlc генерирует: internal/db/users.sql.go
pool, _ := pgxpool.New(ctx, databaseURL)
queries := db.New(pool)

// Типобезопасные вызовы
user, err := queries.GetUser(ctx, 42)
users, err := queries.ListUsers(ctx, db.ListUsersParams{Limit: 10, Offset: 0})
newUser, err := queries.CreateUser(ctx, db.CreateUserParams{
	Email: "alice@example.com",
	Name:  "Alice",
})
```

### lo - утилиты с дженериками

lo предоставляет набор типобезопасных хелперов, аналогичных lodash:

```go
import "github.com/samber/lo"

// Map - трансформация элементов
names := lo.Map(users, func(u User, _ int) string {
	return u.Name
})

// Filter - фильтрация
adults := lo.Filter(users, func(u User, _ int) bool {
	return u.Age >= 18
})

// Reduce - свёртка
totalAge := lo.Reduce(users, func(acc int, u User, _ int) int {
	return acc + u.Age
}, 0)

// GroupBy - группировка
byRole := lo.GroupBy(users, func(u User) string {
	return u.Role
})

// Chunk - разбиение на части
batches := lo.Chunk(items, 100) // [][]Item по 100 элементов

// Uniq - уникальные элементы
unique := lo.Uniq([]int{1, 2, 2, 3, 3, 3}) // [1, 2, 3]

// Must - паника при ошибке (для инициализации)
cfg := lo.Must(loadConfig()) // паника если err != nil
```

### testcontainers-go

Интеграционные тесты с реальными зависимостями в Docker:

```go
import (
	"testing"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func setupPostgres(t *testing.T) string {
	t.Helper()
	ctx := context.Background()

	pgContainer, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2),
		),
	)
	require.NoError(t, err)

	t.Cleanup(func() {
		require.NoError(t, pgContainer.Terminate(ctx))
	})

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)
	return connStr
}

func TestUserRepository(t *testing.T) {
	dsn := setupPostgres(t) // поднимает реальный Postgres в Docker

	db, err := sql.Open("pgx", dsn)
	require.NoError(t, err)

	// Применить миграции, создать репозиторий, выполнить тесты
	repo := NewUserRepository(db)
	// ...
}
```

### asynq - очереди задач

Простая очередь на базе Redis:

```go
import "github.com/hibiken/asynq"

// Определение задачи
const TypeEmailSend = "email:send"

type EmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

// Создание задачи (клиент)
func enqueueEmail(client *asynq.Client, payload EmailPayload) error {
	data, _ := json.Marshal(payload)
	task := asynq.NewTask(TypeEmailSend, data,
		asynq.MaxRetry(3),
		asynq.Timeout(30*time.Second),
		asynq.Queue("emails"),
	)
	_, err := client.Enqueue(task)
	return err
}

// Обработка задачи (worker)
func handleEmailSend(ctx context.Context, t *asynq.Task) error {
	var p EmailPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("unmarshal: %w", err)
	}
	return sendEmail(p.To, p.Subject, p.Body)
}

// Запуск worker
func main() {
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: "localhost:6379"},
		asynq.Config{
			Concurrency: 10,
			Queues:      map[string]int{"emails": 6, "default": 3},
		},
	)

	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeEmailSend, handleEmailSend)

	if err := srv.Run(mux); err != nil {
		log.Fatal(err)
	}
}
```

---

## Полный пример приложения

Сервис сокращения URL, демонстрирующий основные паттерны Go - clean architecture, graceful shutdown, структурированное логирование, работа с PostgreSQL.

### Структура проекта

```
urlshort/
  cmd/api/main.go
  internal/
    domain/url.go
    usecase/shortener.go
    repository/postgres/url_repo.go
    handler/http/url_handler.go
  migrations/
    000001_create_urls.up.sql
  go.mod
  Dockerfile
  docker-compose.yml
```

### domain/url.go

```go
package domain

import (
	"context"
	"time"
)

type URL struct {
	ID        int64     `json:"id" db:"id"`
	ShortCode string    `json:"short_code" db:"short_code"`
	Original  string    `json:"original" db:"original_url"`
	Clicks    int64     `json:"clicks" db:"clicks"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type URLRepository interface {
	Create(ctx context.Context, url *URL) error
	FindByCode(ctx context.Context, code string) (*URL, error)
	IncrementClicks(ctx context.Context, code string) error
}
```

### usecase/shortener.go

```go
package usecase

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log/slog"

	"urlshort/internal/domain"
)

type Shortener struct {
	repo   domain.URLRepository
	logger *slog.Logger
}

func NewShortener(repo domain.URLRepository, logger *slog.Logger) *Shortener {
	return &Shortener{repo: repo, logger: logger}
}

func (s *Shortener) Shorten(ctx context.Context, originalURL string) (*domain.URL, error) {
	code, err := generateCode(6)
	if err != nil {
		return nil, fmt.Errorf("generate code: %w", err)
	}

	url := &domain.URL{
		ShortCode: code,
		Original:  originalURL,
	}

	if err := s.repo.Create(ctx, url); err != nil {
		return nil, fmt.Errorf("create url: %w", err)
	}

	s.logger.Info("url shortened", "code", code, "original", originalURL)
	return url, nil
}

func (s *Shortener) Resolve(ctx context.Context, code string) (string, error) {
	url, err := s.repo.FindByCode(ctx, code)
	if err != nil {
		return "", fmt.Errorf("find url: %w", err)
	}

	_ = s.repo.IncrementClicks(ctx, code)
	return url.Original, nil
}

func generateCode(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b)[:length], nil
}
```

### repository/postgres/url_repo.go

```go
package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"urlshort/internal/domain"
)

type URLRepo struct {
	db *sql.DB
}

func NewURLRepo(db *sql.DB) *URLRepo {
	return &URLRepo{db: db}
}

func (r *URLRepo) Create(ctx context.Context, url *domain.URL) error {
	query := `INSERT INTO urls (short_code, original_url) VALUES ($1, $2)
		RETURNING id, created_at`
	return r.db.QueryRowContext(ctx, query, url.ShortCode, url.Original).
		Scan(&url.ID, &url.CreatedAt)
}

func (r *URLRepo) FindByCode(ctx context.Context, code string) (*domain.URL, error) {
	var url domain.URL
	query := `SELECT id, short_code, original_url, clicks, created_at
		FROM urls WHERE short_code = $1`
	err := r.db.QueryRowContext(ctx, query, code).
		Scan(&url.ID, &url.ShortCode, &url.Original, &url.Clicks, &url.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("url not found: %s", code)
	}
	return &url, err
}

func (r *URLRepo) IncrementClicks(ctx context.Context, code string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1`, code)
	return err
}
```

### handler/http/url_handler.go

```go
package http

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"urlshort/internal/usecase"
)

type Handler struct {
	shortener *usecase.Shortener
	logger    *slog.Logger
}

func NewHandler(shortener *usecase.Shortener, logger *slog.Logger) *Handler {
	return &Handler{shortener: shortener, logger: logger}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /shorten", h.handleShorten)
	mux.HandleFunc("GET /{code}", h.handleRedirect)
	mux.HandleFunc("GET /health", h.handleHealth)
}

func (h *Handler) handleShorten(w http.ResponseWriter, r *http.Request) {
	var input struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	url, err := h.shortener.Shorten(r.Context(), input.URL)
	if err != nil {
		h.logger.Error("shorten failed", "err", err)
		http.Error(w, `{"error":"internal"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(url)
}

func (h *Handler) handleRedirect(w http.ResponseWriter, r *http.Request) {
	code := r.PathValue("code")

	original, err := h.shortener.Resolve(r.Context(), code)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	http.Redirect(w, r, original, http.StatusTemporaryRedirect)
}

func (h *Handler) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}
```

### cmd/api/main.go

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	handler "urlshort/internal/handler/http"
	"urlshort/internal/repository/postgres"
	"urlshort/internal/usecase"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	db, err := sql.Open("pgx", os.Getenv("DATABASE_URL"))
	if err != nil {
		logger.Error("db open failed", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	repo := postgres.NewURLRepo(db)
	shortener := usecase.NewShortener(repo, logger)
	h := handler.NewHandler(shortener, logger)

	mux := http.NewServeMux()
	h.Register(mux)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", envOrDefault("PORT", "8080")),
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			logger.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	logger.Info("server stopped")
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

### docker-compose.yml

```yaml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/urlshort?sslmode=disable
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: urlshort
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d urlshort"]
      interval: 2s
      timeout: 5s
      retries: 5
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

> [!summary] Этот пример демонстрирует: clean architecture с разделением на слои, работу с PostgreSQL через database/sql, HTTP-сервер на стандартном net/http (Go 1.22+), graceful shutdown, структурированное логирование через slog, Docker multi-stage build.

---

## Temporal

Temporal - движок durable execution, который гарантирует завершение бизнес-процессов даже при сбоях инфраструктуры. В отличие от обычных очередей задач, Temporal сохраняет полное состояние выполнения и автоматически восстанавливает процессы после перезапуска.

Ключевые отличия от очередей (RabbitMQ, Kafka, asynq):
- Состояние workflow сохраняется на сервере Temporal, а не в коде приложения
- Встроенные таймеры, ретраи, саги, сигналы и запросы
- Детерминистичное воспроизведение - при перезапуске worker восстанавливает состояние, "проигрывая" историю событий
- Видимость - можно в любой момент запросить состояние workflow

### Основные концепции

```
┌─────────────────────────────────────────────┐
│              Temporal Server                  │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ History │  │ Matching │  │ Frontend  │  │
│  │ Service │  │ Service  │  │ Service   │  │
│  └─────────┘  └──────────┘  └───────────┘  │
│              ↕ Task Queues                   │
└─────────────────────────────────────────────┘
         ↕                    ↕
   ┌───────────┐        ┌──────────┐
   │  Worker   │        │  Client  │
   │ (Workflow │        │ (запуск, │
   │  Activity)│        │  сигналы,│
   │           │        │  запросы)│
   └───────────┘        └──────────┘
```

- **Workflow** - детерминистичная функция, описывающая бизнес-процесс. Оркестрирует activities, обрабатывает сигналы, может длиться от миллисекунд до месяцев
- **Activity** - единица работы с побочными эффектами (HTTP-запрос, запись в БД, отправка email). Может автоматически ретраиться
- **Worker** - процесс, который подключается к Temporal Server и выполняет workflows и activities
- **Task Queue** - именованная очередь, через которую Temporal Server распределяет задачи по workers
- **Workflow ID** - уникальный бизнес-идентификатор процесса (например, order-12345)
- **Run ID** - UUID конкретного запуска workflow

### Workflows

Workflow в Temporal - детерминистичная функция. Это означает строгие ограничения на то, что можно делать внутри:

```go
import (
	"time"
	"go.temporal.io/sdk/workflow"
)

// Внутри workflow НЕЛЬЗЯ:
// - вызывать time.Now(), time.Sleep()     -> использовать workflow.Now(), workflow.Sleep()
// - делать HTTP-запросы, обращаться к БД  -> выносить в activities
// - использовать math/rand               -> использовать workflow.SideEffect()
// - работать с файловой системой          -> выносить в activities
// - использовать горутины Go              -> использовать workflow.Go()
// - использовать каналы Go               -> использовать workflow.Channel

func OrderWorkflow(ctx workflow.Context, order Order) (OrderResult, error) {
	logger := workflow.GetLogger(ctx)
	logger.Info("order workflow started", "orderID", order.ID)

	// Настройка activity options
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:    time.Second,
			BackoffCoefficient: 2.0,
			MaximumAttempts:    3,
		},
	})

	// Последовательное выполнение activities
	var validated OrderValidation
	if err := workflow.ExecuteActivity(actCtx, ValidateOrder, order).Get(ctx, &validated); err != nil {
		return OrderResult{}, fmt.Errorf("validate: %w", err)
	}

	var payment PaymentResult
	if err := workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &payment); err != nil {
		return OrderResult{}, fmt.Errorf("charge: %w", err)
	}

	// Таймер - workflow "засыпает", но Temporal помнит и разбудит
	workflow.Sleep(ctx, 24*time.Hour) // не блокирует worker

	var shipment ShipmentResult
	if err := workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, &shipment); err != nil {
		return OrderResult{}, fmt.Errorf("ship: %w", err)
	}

	return OrderResult{
		PaymentID:  payment.ID,
		TrackingNo: shipment.TrackingNo,
	}, nil
}
```

> [!important] Детерминизм workflow критически важен. Temporal восстанавливает состояние, воспроизводя историю событий. Если код workflow изменился между запусками (например, добавилась новая activity), это приведёт к non-determinism error. Для изменений используйте версионирование через workflow.GetVersion().

### Activities

Activities содержат код с побочными эффектами - всё то, что нельзя делать в workflow:

```go
import (
	"context"
	"go.temporal.io/sdk/activity"
)

func ValidateOrder(ctx context.Context, order Order) (OrderValidation, error) {
	// Обычный Go-код - HTTP-вызовы, БД, файлы
	logger := activity.GetInfo(ctx).ActivityType.Name
	// ...
	return OrderValidation{Valid: true}, nil
}

func ChargePayment(ctx context.Context, order Order) (PaymentResult, error) {
	// Вызов платёжного API
	result, err := stripeClient.Charge(order.Amount, order.Currency)
	if err != nil {
		return PaymentResult{}, err
	}
	return PaymentResult{ID: result.ID}, nil
}

// Долгая activity с heartbeat
func ProcessLargeFile(ctx context.Context, path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineCount := 0
	for scanner.Scan() {
		lineCount++
		if lineCount%1000 == 0 {
			// Heartbeat сообщает Temporal что activity жива
			// Если worker упадёт, Temporal перезапустит activity на другом worker
			activity.RecordHeartbeat(ctx, lineCount)
		}
		// обработка строки...
	}
	return scanner.Err()
}
```

Activity options контролируют поведение:

- StartToCloseTimeout - максимальное время выполнения одной попытки
- ScheduleToCloseTimeout - максимальное время от постановки в очередь до завершения
- HeartbeatTimeout - если heartbeat не приходит за это время, activity считается зависшей
- RetryPolicy - стратегия повторных попыток

### Сигналы (Signals)

Сигналы позволяют отправлять данные в работающий workflow извне:

```go
// Workflow принимает сигнал
func ApprovalWorkflow(ctx workflow.Context, request Request) (string, error) {
	// Создание канала для сигнала
	approvalCh := workflow.GetSignalChannel(ctx, "approval-signal")

	// Выполнить предварительную проверку
	var checkResult CheckResult
	workflow.ExecuteActivity(ctx, PreCheck, request).Get(ctx, &checkResult)

	// Ожидание сигнала одобрения (с таймаутом)
	var approval ApprovalDecision
	timerCtx, cancelTimer := workflow.WithCancel(ctx)

	selector := workflow.NewSelector(ctx)

	selector.AddReceive(approvalCh, func(ch workflow.ReceiveChannel, more bool) {
		ch.Receive(ctx, &approval)
		cancelTimer()
	})

	selector.AddFuture(workflow.NewTimer(timerCtx, 72*time.Hour), func(f workflow.Future) {
		approval = ApprovalDecision{Approved: false, Reason: "timeout"}
	})

	selector.Select(ctx)

	if !approval.Approved {
		return "", fmt.Errorf("rejected: %s", approval.Reason)
	}

	// Продолжение после одобрения
	workflow.ExecuteActivity(ctx, ExecuteRequest, request).Get(ctx, nil)
	return "completed", nil
}

// Клиент отправляет сигнал
func sendApproval(c client.Client, workflowID string, decision ApprovalDecision) error {
	return c.SignalWorkflow(context.Background(), workflowID, "", "approval-signal", decision)
}
```

### Запросы (Queries)

Запросы позволяют читать состояние workflow без побочных эффектов:

```go
func OrderTrackingWorkflow(ctx workflow.Context, order Order) error {
	status := "created"
	var trackingNo string

	// Регистрация query handler
	err := workflow.SetQueryHandler(ctx, "get-status", func() (OrderStatus, error) {
		return OrderStatus{
			Status:     status,
			TrackingNo: trackingNo,
		}, nil
	})
	if err != nil {
		return err
	}

	status = "processing"
	workflow.ExecuteActivity(ctx, ProcessOrder, order).Get(ctx, nil)

	status = "shipped"
	workflow.ExecuteActivity(ctx, ShipOrder, order).Get(ctx, &trackingNo)

	status = "delivered"
	return nil
}

// Клиент делает запрос
resp, err := c.QueryWorkflow(ctx, workflowID, "", "get-status")
var status OrderStatus
resp.Get(&status)
fmt.Printf("Статус: %s, Трекинг: %s\n", status.Status, status.TrackingNo)
```

### Дочерние Workflows

Workflow может запускать другие workflows как дочерние:

```go
func ParentWorkflow(ctx workflow.Context, orders []Order) error {
	// Запуск дочерних workflows для каждого заказа
	var futures []workflow.ChildWorkflowFuture
	for _, order := range orders {
		childCtx := workflow.WithChildOptions(ctx, workflow.ChildWorkflowOptions{
			WorkflowID:        fmt.Sprintf("order-%d", order.ID),
			ParentClosePolicy: enums.PARENT_CLOSE_POLICY_TERMINATE, // или ABANDON, REQUEST_CANCEL
		})

		future := workflow.ExecuteChildWorkflow(childCtx, OrderWorkflow, order)
		futures = append(futures, future)
	}

	// Ожидание завершения всех дочерних workflows
	for i, f := range futures {
		var result OrderResult
		if err := f.Get(ctx, &result); err != nil {
			workflow.GetLogger(ctx).Error("child workflow failed",
				"orderID", orders[i].ID, "err", err)
			continue
		}
	}
	return nil
}
```

ParentClosePolicy определяет что происходит с дочерним workflow при завершении родителя:
- TERMINATE - немедленно завершить
- ABANDON - оставить работать независимо
- REQUEST_CANCEL - запросить отмену

### Таймеры и ожидание

```go
// workflow.Sleep - приостановка на указанное время
workflow.Sleep(ctx, 24*time.Hour) // не блокирует worker, Temporal разбудит

// workflow.NewTimer - создание таймера для использования в selector
timer := workflow.NewTimer(ctx, 5*time.Minute)

// workflow.Await - ожидание условия
var approved bool
workflow.Await(ctx, func() bool { return approved })

// Selector - мультиплексирование каналов и таймеров (аналог select)
selector := workflow.NewSelector(ctx)

selector.AddReceive(signalCh, func(ch workflow.ReceiveChannel, more bool) {
	var data SignalData
	ch.Receive(ctx, &data)
	// обработка сигнала
})

selector.AddFuture(workflow.NewTimer(ctx, 10*time.Minute), func(f workflow.Future) {
	// таймаут
})

selector.Select(ctx) // блокируется до одного из событий
```

### Повторные попытки (Retries)

RetryPolicy настраивается для activities и child workflows:

```go
retryPolicy := &temporal.RetryPolicy{
	InitialInterval:        time.Second,       // начальная задержка
	BackoffCoefficient:     2.0,               // множитель задержки
	MaximumInterval:        time.Minute,       // максимальная задержка
	MaximumAttempts:        5,                 // максимум попыток (0 = бесконечно)
	NonRetryableErrorTypes: []string{          // ошибки, которые не ретраить
		"InvalidInput",
		"InsufficientFunds",
	},
}

actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
	StartToCloseTimeout: 30 * time.Second,
	RetryPolicy:         retryPolicy,
})
```

Для маркировки ошибки как non-retryable внутри activity:

```go
func ChargePayment(ctx context.Context, order Order) error {
	err := gateway.Charge(order.Amount)
	if errors.Is(err, ErrInsufficientFunds) {
		// Эта ошибка не будет ретраиться
		return temporal.NewNonRetryableApplicationError(
			"insufficient funds", "InsufficientFunds", err)
	}
	return err
}
```

### Saga Pattern

Saga в Temporal реализуется через компенсационные действия при ошибках:

```go
func OrderSagaWorkflow(ctx workflow.Context, order Order) error {
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy:         &temporal.RetryPolicy{MaximumAttempts: 3},
	})

	// Список компенсаций (выполняются в обратном порядке при ошибке)
	var compensations []func(workflow.Context) error

	// Шаг 1: Резервирование товара
	var reservation ReservationResult
	err := workflow.ExecuteActivity(actCtx, ReserveInventory, order).Get(ctx, &reservation)
	if err != nil {
		return fmt.Errorf("reserve: %w", err)
	}
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, ReleaseInventory, reservation.ID).Get(ctx, nil)
	})

	// Шаг 2: Списание оплаты
	var payment PaymentResult
	err = workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &payment)
	if err != nil {
		compensate(ctx, compensations)
		return fmt.Errorf("charge: %w", err)
	}
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, RefundPayment, payment.ID).Get(ctx, nil)
	})

	// Шаг 3: Отправка
	err = workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, nil)
	if err != nil {
		compensate(ctx, compensations)
		return fmt.Errorf("ship: %w", err)
	}

	// Шаг 4: Уведомление
	_ = workflow.ExecuteActivity(actCtx, NotifyCustomer, order).Get(ctx, nil)

	return nil
}

func compensate(ctx workflow.Context, compensations []func(workflow.Context) error) {
	// Выполнение компенсаций в обратном порядке
	for i := len(compensations) - 1; i >= 0; i-- {
		if err := compensations[i](ctx); err != nil {
			workflow.GetLogger(ctx).Error("compensation failed", "err", err)
		}
	}
}
```

> [!info] Если на шаге ChargePayment произошла ошибка, saga автоматически вызовет ReleaseInventory (компенсация шага 1). Если ошибка на ShipOrder - вызовутся RefundPayment и ReleaseInventory в обратном порядке.

### Worker

Worker - процесс, который подключается к Temporal Server и выполняет workflow и activity функции:

```go
package main

import (
	"log"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

func main() {
	// Подключение к Temporal Server
	c, err := client.Dial(client.Options{
		HostPort:  "localhost:7233",
		Namespace: "default",
	})
	if err != nil {
		log.Fatal("unable to create client", err)
	}
	defer c.Close()

	// Создание worker для конкретной task queue
	w := worker.New(c, "order-processing", worker.Options{
		MaxConcurrentActivityExecutionSize:     10,
		MaxConcurrentWorkflowTaskExecutionSize: 5,
	})

	// Регистрация workflows и activities
	w.RegisterWorkflow(OrderWorkflow)
	w.RegisterWorkflow(OrderSagaWorkflow)
	w.RegisterWorkflow(ApprovalWorkflow)
	w.RegisterActivity(ValidateOrder)
	w.RegisterActivity(ChargePayment)
	w.RegisterActivity(RefundPayment)
	w.RegisterActivity(ReserveInventory)
	w.RegisterActivity(ReleaseInventory)
	w.RegisterActivity(ShipOrder)
	w.RegisterActivity(NotifyCustomer)

	if err := w.Run(worker.InterruptCh()); err != nil {
		log.Fatal("unable to start worker", err)
	}
}
```

### Полный пример - Order Processing

Пример объединяет все концепции: workflow с сигналами одобрения, activities, saga-компенсации, query для статуса:

```go
// === Типы ===

type Order struct {
	ID       string
	UserID   string
	Amount   int64
	Currency string
	Items    []OrderItem
}

type OrderItem struct {
	ProductID string
	Quantity  int
}

type OrderStatus struct {
	Phase      string
	Approved   bool
	PaymentID  string
	TrackingNo string
}

// === Workflow ===

func OrderProcessingWorkflow(ctx workflow.Context, order Order) (OrderStatus, error) {
	status := OrderStatus{Phase: "validating"}

	// Query handler для отслеживания статуса
	workflow.SetQueryHandler(ctx, "status", func() (OrderStatus, error) {
		return status, nil
	})

	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy:         &temporal.RetryPolicy{MaximumAttempts: 3},
	})

	// Валидация заказа
	if err := workflow.ExecuteActivity(actCtx, ValidateOrder, order).Get(ctx, nil); err != nil {
		status.Phase = "validation_failed"
		return status, err
	}

	// Ожидание одобрения менеджером (для заказов > 10000)
	if order.Amount > 10000 {
		status.Phase = "awaiting_approval"

		approvalCh := workflow.GetSignalChannel(ctx, "manager-approval")
		selector := workflow.NewSelector(ctx)

		var approved bool
		selector.AddReceive(approvalCh, func(ch workflow.ReceiveChannel, more bool) {
			ch.Receive(ctx, &approved)
		})
		selector.AddFuture(workflow.NewTimer(ctx, 48*time.Hour), func(f workflow.Future) {
			approved = false
		})
		selector.Select(ctx)

		status.Approved = approved
		if !approved {
			status.Phase = "rejected"
			return status, fmt.Errorf("order not approved")
		}
	} else {
		status.Approved = true
	}

	// Saga: резервирование -> оплата -> отправка
	var compensations []func(workflow.Context) error

	status.Phase = "reserving"
	var reservationID string
	if err := workflow.ExecuteActivity(actCtx, ReserveInventory, order).Get(ctx, &reservationID); err != nil {
		status.Phase = "reservation_failed"
		return status, err
	}
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, ReleaseInventory, reservationID).Get(ctx, nil)
	})

	status.Phase = "charging"
	var paymentID string
	if err := workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &paymentID); err != nil {
		compensate(ctx, compensations)
		status.Phase = "payment_failed"
		return status, err
	}
	status.PaymentID = paymentID
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, RefundPayment, paymentID).Get(ctx, nil)
	})

	status.Phase = "shipping"
	var trackingNo string
	if err := workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, &trackingNo); err != nil {
		compensate(ctx, compensations)
		status.Phase = "shipping_failed"
		return status, err
	}
	status.TrackingNo = trackingNo

	// Уведомление (не критично, ошибка не откатывает процесс)
	_ = workflow.ExecuteActivity(actCtx, NotifyCustomer, order).Get(ctx, nil)

	status.Phase = "completed"
	return status, nil
}

// === Запуск workflow (клиент) ===

func startOrder(c client.Client, order Order) (string, error) {
	options := client.StartWorkflowOptions{
		ID:        fmt.Sprintf("order-%s", order.ID),
		TaskQueue: "order-processing",
	}

	we, err := c.ExecuteWorkflow(context.Background(), options,
		OrderProcessingWorkflow, order)
	if err != nil {
		return "", err
	}

	fmt.Printf("Workflow started: ID=%s RunID=%s\n", we.GetID(), we.GetRunID())
	return we.GetID(), nil
}

// === Одобрение заказа (клиент) ===

func approveOrder(c client.Client, orderID string, approved bool) error {
	return c.SignalWorkflow(context.Background(),
		fmt.Sprintf("order-%s", orderID), "",
		"manager-approval", approved)
}

// === Запрос статуса (клиент) ===

func getOrderStatus(c client.Client, orderID string) (OrderStatus, error) {
	resp, err := c.QueryWorkflow(context.Background(),
		fmt.Sprintf("order-%s", orderID), "", "status")
	if err != nil {
		return OrderStatus{}, err
	}

	var status OrderStatus
	if err := resp.Get(&status); err != nil {
		return OrderStatus{}, err
	}
	return status, nil
}
```

> [!summary] Temporal workflow гарантирует, что заказ будет обработан до конца даже при падении worker-ов, перезапусках серверов или сетевых проблемах. Состояние (фаза, paymentID, trackingNo) восстанавливается автоматически через replay истории событий.

---

## Ссылки

- [Микросервисы](Microservices/Микросервисы.md)
- [REST](REST/REST.md)
- [Temporal Go SDK](https://docs.temporal.io/develop/go)
- [Go Standard Library](https://pkg.go.dev/std)
- [Effective Go](https://go.dev/doc/effective_go)
