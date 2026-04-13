---
tags:
  - backend
  - golang
  - go
  - advanced
  - generics
  - patterns
  - architecture
---

# 10. Advanced темы

> [!summary] О чём эта глава
> Эта глава охватывает продвинутые возможности Go: рефлексию, дженерики, unsafe-операции, CGO, оптимизацию производительности, паттерны проектирования, чистую архитектуру, DDD и глубокое погружение в стандартную библиотеку и внутреннее устройство Go. Это завершающая глава курса, объединяющая знания из [[01-basics]], [[03-networking]], [[04-databases]], [[05-concurrency]], [[06-microservices]] и [[07-testing]].

---

## 1. Reflection (пакет reflect)

Рефлексия позволяет программе исследовать и изменять свою структуру во время выполнения. В Go рефлексия реализована через пакет `reflect`. Каждое значение в Go имеет два свойства: **тип** и **значение**. Пакет `reflect` предоставляет доступ к обоим.

### reflect.TypeOf и reflect.ValueOf

Два фундаментальных вызова, с которых начинается любая работа с рефлексией:

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	// reflect.TypeOf возвращает тип значения
	var x int = 42
	t := reflect.TypeOf(x)
	fmt.Println("Тип:", t)           // int
	fmt.Println("Kind:", t.Kind())   // int (базовый вид типа)

	// reflect.ValueOf возвращает обёртку над значением
	v := reflect.ValueOf(x)
	fmt.Println("Значение:", v)       // 42
	fmt.Println("Int():", v.Int())    // 42 (преобразование к int64)

	// Для пользовательских типов Kind и Type отличаются
	type UserID int
	var id UserID = 7
	tid := reflect.TypeOf(id)
	fmt.Println("Type:", tid)        // main.UserID
	fmt.Println("Kind:", tid.Kind()) // int (базовый вид — всё равно int)
}
```

### Инспекция полей структуры и тегов

Одно из главных применений рефлексии — чтение структурных тегов (struct tags), которые используют библиотеки JSON, ORM, валидаторы:

```go
package main

import (
	"fmt"
	"reflect"
)

// Структура с тегами для JSON и валидации
type User struct {
	Name  string `json:"name" validate:"required,min=2"`
	Email string `json:"email" validate:"required,email"`
	Age   int    `json:"age" validate:"gte=0,lte=150"`
}

func inspectStruct(v interface{}) {
	// Получаем тип значения
	t := reflect.TypeOf(v)

	// Если передан указатель — разыменовываем
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	fmt.Printf("Структура: %s\n", t.Name())
	fmt.Printf("Количество полей: %d\n\n", t.NumField())

	// Перебираем все поля структуры
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		fmt.Printf("Поле: %s\n", field.Name)
		fmt.Printf("  Тип: %s\n", field.Type)
		fmt.Printf("  JSON тег: %s\n", field.Tag.Get("json"))
		fmt.Printf("  Validate тег: %s\n", field.Tag.Get("validate"))
		fmt.Printf("  Экспортируемое: %v\n\n", field.IsExported())
	}
}

func main() {
	u := User{Name: "Иван", Email: "ivan@example.com", Age: 30}
	inspectStruct(u)
}
```

### Чтение значений

```go
package main

import (
	"fmt"
	"reflect"
)

type Config struct {
	Host    string
	Port    int
	Debug   bool
	Timeout float64
}

func printValues(v interface{}) {
	val := reflect.ValueOf(v)
	typ := reflect.TypeOf(v)

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		name := typ.Field(i).Name

		// Interface() возвращает значение как interface{}
		fmt.Printf("%s = %v (тип: %s)\n", name, field.Interface(), field.Type())

		// Также можно получить типизированные значения
		switch field.Kind() {
		case reflect.String:
			fmt.Printf("  String(): %q\n", field.String())
		case reflect.Int:
			fmt.Printf("  Int(): %d\n", field.Int())
		case reflect.Bool:
			fmt.Printf("  Bool(): %v\n", field.Bool())
		case reflect.Float64:
			fmt.Printf("  Float(): %f\n", field.Float())
		}
	}
}

func main() {
	cfg := Config{Host: "localhost", Port: 8080, Debug: true, Timeout: 30.5}
	printValues(cfg)
}
```

### Изменение значений через указатель

Для изменения значений через рефлексию необходимо передавать указатель:

```go
package main

import (
	"fmt"
	"reflect"
)

type Settings struct {
	Host    string
	Port    int
	Debug   bool
}

func main() {
	s := Settings{Host: "localhost", Port: 8080, Debug: false}
	fmt.Println("До:", s)

	// ВАЖНО: передаём указатель, иначе изменить нельзя
	v := reflect.ValueOf(&s)

	// Elem() разыменовывает указатель — получаем саму структуру
	elem := v.Elem()

	// Изменяем поля по имени
	elem.FieldByName("Host").SetString("0.0.0.0")
	elem.FieldByName("Port").SetInt(3000)
	elem.FieldByName("Debug").SetBool(true)

	fmt.Println("После:", s)
	// Вывод: {0.0.0.0 3000 true}
}
```

### Практический пример: кастомный валидатор

```go
package main

import (
	"fmt"
	"reflect"
	"strings"
)

// Ошибка валидации
type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// Простой валидатор на основе тегов
func Validate(v interface{}) []ValidationError {
	var errors []ValidationError

	val := reflect.ValueOf(v)
	typ := reflect.TypeOf(v)

	// Обработка указателей
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
		typ = typ.Elem()
	}

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		typeField := typ.Field(i)
		tag := typeField.Tag.Get("validate")

		if tag == "" {
			continue
		}

		rules := strings.Split(tag, ",")
		for _, rule := range rules {
			switch rule {
			case "required":
				// Проверяем, что значение не нулевое
				if field.IsZero() {
					errors = append(errors, ValidationError{
						Field:   typeField.Name,
						Message: "обязательное поле",
					})
				}
			case "email":
				// Простейшая проверка email
				if field.Kind() == reflect.String {
					if !strings.Contains(field.String(), "@") {
						errors = append(errors, ValidationError{
							Field:   typeField.Name,
							Message: "некорректный email",
						})
					}
				}
			}

			// Проверка минимальной длины: min=N
			if strings.HasPrefix(rule, "min=") {
				var minLen int
				fmt.Sscanf(rule, "min=%d", &minLen)
				if field.Kind() == reflect.String && len(field.String()) < minLen {
					errors = append(errors, ValidationError{
						Field:   typeField.Name,
						Message: fmt.Sprintf("минимальная длина: %d", minLen),
					})
				}
			}
		}
	}

	return errors
}

type Registration struct {
	Name  string `validate:"required,min=2"`
	Email string `validate:"required,email"`
	Phone string `validate:"required"`
}

func main() {
	reg := Registration{Name: "A", Email: "bad-email", Phone: ""}
	errs := Validate(reg)
	for _, e := range errs {
		fmt.Println("Ошибка:", e)
	}
}
```

### Практический пример: конвертер структуры в map

```go
// StructToMap преобразует структуру в map[string]interface{}
// используя JSON-теги для имён ключей
func StructToMap(v interface{}) map[string]interface{} {
	result := make(map[string]interface{})

	val := reflect.ValueOf(v)
	typ := reflect.TypeOf(v)

	if val.Kind() == reflect.Ptr {
		val = val.Elem()
		typ = typ.Elem()
	}

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)

		// Пропускаем неэкспортируемые поля
		if !field.IsExported() {
			continue
		}

		// Используем JSON-тег как ключ, если есть
		key := field.Tag.Get("json")
		if key == "" || key == "-" {
			key = field.Name
		}
		// Убираем опции вроде omitempty
		if idx := strings.Index(key, ","); idx != -1 {
			key = key[:idx]
		}

		result[key] = val.Field(i).Interface()
	}

	return result
}
```

> [!WARNING] Рефлексия — медленная и хрупкая
> Рефлексия в 10-100 раз медленнее прямого доступа. Она теряет типобезопасность: ошибки обнаруживаются только в runtime, не при компиляции. Используйте рефлексию только когда нет альтернативы — для библиотек сериализации, ORM, валидаторов. В прикладном коде почти всегда можно обойтись без неё.

### Сравнение производительности: рефлексия vs прямой доступ

```go
// Бенчмарк: прямой доступ
func BenchmarkDirect(b *testing.B) {
	u := User{Name: "Ivan", Email: "ivan@test.com", Age: 25}
	for i := 0; i < b.N; i++ {
		_ = u.Name // ~0.3 ns/op
	}
}

// Бенчмарк: доступ через рефлексию
func BenchmarkReflect(b *testing.B) {
	u := User{Name: "Ivan", Email: "ivan@test.com", Age: 25}
	for i := 0; i < b.N; i++ {
		v := reflect.ValueOf(u)
		_ = v.Field(0).String() // ~50-80 ns/op
	}
}

// Результат: рефлексия в ~100-200 раз медленнее
```

> [!TIP] Когда использовать рефлексию
> - Библиотеки сериализации / десериализации (encoding/json и т.д.)
> - ORM и маппинг данных (gorm, sqlx)
> - Валидаторы (go-playground/validator)
> - Dependency injection фреймворки
> - Генерация документации из структур
>
> Во всех остальных случаях — предпочитайте кодогенерацию (`go generate`) или дженерики.

###### 🏠 Домашнее задание

1. Напишите функцию `StructToJSON(v interface{}) string`, которая с помощью рефлексии преобразует любую структуру в JSON-строку (без использования `encoding/json`). Поддержите типы `string`, `int`, `bool`, `float64`.
2. Напишите функцию `FillDefaults(v interface{})`, которая заполняет нулевые поля структуры значениями из тега `default:"значение"`.
3. Реализуйте функцию `Compare(a, b interface{}) []string`, которая возвращает список имён полей, которые отличаются в двух структурах одного типа.

---

## 2. Generics (Go 1.18+)

Дженерики — одно из самых значительных изменений в Go, добавленное в версии 1.18. Они позволяют писать функции и типы, которые работают с разными типами данных без потери типобезопасности и без рефлексии.

### Параметры типов

```go
package main

import "fmt"

// Map применяет функцию fn к каждому элементу слайса
// T — тип входных элементов, R — тип результата
func Map[T any, R any](s []T, fn func(T) R) []R {
	result := make([]R, len(s))
	for i, v := range s {
		result[i] = fn(v)
	}
	return result
}

// Filter возвращает элементы, удовлетворяющие предикату
func Filter[T any](s []T, pred func(T) bool) []T {
	var result []T
	for _, v := range s {
		if pred(v) {
			result = append(result, v)
		}
	}
	return result
}

// Reduce свёртка слайса в одно значение
func Reduce[T any, R any](s []T, initial R, fn func(R, T) R) R {
	result := initial
	for _, v := range s {
		result = fn(result, v)
	}
	return result
}

// Contains проверяет наличие элемента в слайсе
func Contains[T comparable](s []T, target T) bool {
	for _, v := range s {
		if v == target {
			return true
		}
	}
	return false
}

func main() {
	nums := []int{1, 2, 3, 4, 5}

	// Map: удваиваем каждое число
	doubled := Map(nums, func(n int) int { return n * 2 })
	fmt.Println("Удвоенные:", doubled) // [2 4 6 8 10]

	// Map: число -> строка
	strs := Map(nums, func(n int) string {
		return fmt.Sprintf("item_%d", n)
	})
	fmt.Println("Строки:", strs) // [item_1 item_2 ...]

	// Filter: только чётные
	even := Filter(nums, func(n int) bool { return n%2 == 0 })
	fmt.Println("Чётные:", even) // [2 4]

	// Reduce: сумма
	sum := Reduce(nums, 0, func(acc, n int) int { return acc + n })
	fmt.Println("Сумма:", sum) // 15

	// Contains
	fmt.Println("Содержит 3:", Contains(nums, 3))   // true
	fmt.Println("Содержит 99:", Contains(nums, 99))  // false
}
```

### Ограничения (Constraints)

Ограничения определяют, какие типы могут быть подставлены в параметр типа:

```go
package main

import (
	"cmp"
	"fmt"
)

// any — любой тип (alias для interface{})
func Print[T any](v T) {
	fmt.Println(v)
}

// comparable — типы, которые можно сравнивать через == и !=
func Equal[T comparable](a, b T) bool {
	return a == b
}

// cmp.Ordered (Go 1.21) — числа и строки, поддерживающие < > <= >=
// Заменяет устаревший constraints.Ordered из golang.org/x/exp
func Max[T cmp.Ordered](a, b T) T {
	if a > b {
		return a
	}
	return b
}

func Min[T cmp.Ordered](a, b T) T {
	if a < b {
		return a
	}
	return b
}

// С Go 1.21 есть встроенные min() и max()
func main() {
	fmt.Println(Max(10, 20))     // 20
	fmt.Println(Max("abc", "z")) // z

	// Встроенные min/max (Go 1.21+)
	fmt.Println(min(3, 7))       // 3
	fmt.Println(max(3, 7))       // 7
}
```

### Пользовательские ограничения с union types

```go
package main

import "fmt"

// Number — ограничение для числовых типов
// Символ ~ означает "этот тип и все типы, основанные на нём"
type Number interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}

// Signed — только знаковые числа
type Signed interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64
}

// Sum — работает с любыми числовыми типами и их производными
func Sum[T Number](nums []T) T {
	var total T
	for _, n := range nums {
		total += n
	}
	return total
}

// Пример с тильдой (~)
type Celsius float64   // Celsius основан на float64
type Fahrenheit float64

// Без ~ этот тип не подошёл бы под float64
// С ~float64 подходят: float64, Celsius, Fahrenheit
// и любой другой тип, определённый как type X float64
func ConvertToString[T ~float64](v T) string {
	return fmt.Sprintf("%.2f", v)
}

func main() {
	ints := []int{1, 2, 3}
	fmt.Println(Sum(ints)) // 6

	// Работает и с пользовательскими типами благодаря ~
	type Score int
	scores := []Score{100, 200, 300}
	fmt.Println(Sum(scores)) // 600

	var temp Celsius = 36.6
	fmt.Println(ConvertToString(temp)) // 36.60
}
```

> [!INFO] Зачем нужна тильда ~
> Тильда `~` в ограничениях означает "данный тип или любой тип, определённый на его основе". Без тильды `int` означает строго `int`, и пользовательский `type MyInt int` не подойдёт. С тильдой `~int` подходят оба. На практике почти всегда нужна тильда.

### Дженерик-типы (Generic Types)

```go
package main

import "fmt"

// Stack — универсальный стек на основе слайса
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

func (s *Stack[T]) Peek() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	return s.items[len(s.items)-1], true
}

func (s *Stack[T]) Len() int {
	return len(s.items)
}

// Set — множество на основе map
type Set[T comparable] struct {
	items map[T]struct{}
}

func NewSet[T comparable]() *Set[T] {
	return &Set[T]{items: make(map[T]struct{})}
}

func (s *Set[T]) Add(item T) {
	s.items[item] = struct{}{}
}

func (s *Set[T]) Contains(item T) bool {
	_, ok := s.items[item]
	return ok
}

func (s *Set[T]) Remove(item T) {
	delete(s.items, item)
}

func (s *Set[T]) Len() int {
	return len(s.items)
}

func (s *Set[T]) Values() []T {
	result := make([]T, 0, len(s.items))
	for item := range s.items {
		result = append(result, item)
	}
	return result
}

// Optional — контейнер, который может содержать или не содержать значение
type Optional[T any] struct {
	value T
	valid bool
}

func Some[T any](v T) Optional[T] {
	return Optional[T]{value: v, valid: true}
}

func None[T any]() Optional[T] {
	return Optional[T]{}
}

func (o Optional[T]) Get() (T, bool) {
	return o.value, o.valid
}

func (o Optional[T]) OrElse(defaultVal T) T {
	if o.valid {
		return o.value
	}
	return defaultVal
}

func main() {
	// Stack
	stack := &Stack[int]{}
	stack.Push(10)
	stack.Push(20)
	stack.Push(30)
	if v, ok := stack.Pop(); ok {
		fmt.Println("Pop:", v) // 30
	}

	// Set
	set := NewSet[string]()
	set.Add("Go")
	set.Add("Rust")
	set.Add("Go") // дубликат — игнорируется
	fmt.Println("Содержит Go:", set.Contains("Go"))     // true
	fmt.Println("Содержит Java:", set.Contains("Java"))  // false
	fmt.Println("Размер:", set.Len())                     // 2

	// Optional
	opt := Some(42)
	fmt.Println(opt.OrElse(0)) // 42

	empty := None[int]()
	fmt.Println(empty.OrElse(-1)) // -1
}
```

### Дженерик-интерфейсы

```go
// Entity — базовое ограничение для доменных сущностей
type Entity interface {
	GetID() string
}

// Repository — дженерик-интерфейс репозитория
// T должен реализовывать Entity
type Repository[T Entity] interface {
	GetByID(id string) (T, error)
	GetAll() ([]T, error)
	Create(entity T) error
	Update(entity T) error
	Delete(id string) error
}

// Конкретная сущность
type User struct {
	ID    string
	Name  string
	Email string
}

func (u User) GetID() string { return u.ID }

// Конкретная реализация репозитория
type InMemoryRepository[T Entity] struct {
	data map[string]T
}

func NewInMemoryRepository[T Entity]() *InMemoryRepository[T] {
	return &InMemoryRepository[T]{
		data: make(map[string]T),
	}
}

func (r *InMemoryRepository[T]) GetByID(id string) (T, error) {
	entity, ok := r.data[id]
	if !ok {
		var zero T
		return zero, fmt.Errorf("сущность с id %s не найдена", id)
	}
	return entity, nil
}

func (r *InMemoryRepository[T]) GetAll() ([]T, error) {
	result := make([]T, 0, len(r.data))
	for _, entity := range r.data {
		result = append(result, entity)
	}
	return result, nil
}

func (r *InMemoryRepository[T]) Create(entity T) error {
	r.data[entity.GetID()] = entity
	return nil
}

func (r *InMemoryRepository[T]) Update(entity T) error {
	if _, ok := r.data[entity.GetID()]; !ok {
		return fmt.Errorf("сущность с id %s не найдена", entity.GetID())
	}
	r.data[entity.GetID()] = entity
	return nil
}

func (r *InMemoryRepository[T]) Delete(id string) error {
	delete(r.data, id)
	return nil
}
```

### Когда использовать дженерики

> [!TIP] Когда дженерики полезны
> - **Контейнеры**: Stack, Queue, Set, LinkedList, Tree
> - **Утилитарные функции**: Map, Filter, Reduce, Contains, Sort
> - **Устранение дублирования**: когда один и тот же алгоритм повторяется для разных типов
> - **Типобезопасные абстракции**: Repository[T], Cache[K, V], Result[T]

> [!WARNING] Когда дженерики НЕ нужны
> - **Простой полиморфизм**: если достаточно обычного интерфейса — используйте интерфейс
> - **Когда добавляют сложность без пользы**: `func PrintAnything[T any](v T)` не лучше `func PrintAnything(v any)`
> - **Один конкретный тип**: если функция реально работает только с одним типом — не обобщайте
> - **Rob Pike's правило**: не добавляйте параметры типов преждевременно. Начните с конкретного кода, обобщите когда появится реальное дублирование.

### Подводные камни дженериков

```go
// ПРОБЛЕМА: comparable и интерфейсы
// comparable позволяет ==, но интерфейсы, содержащие слайсы, вызовут панику
type Wrapper struct {
	Data []int // слайсы нельзя сравнивать через ==
}

// Этот код скомпилируется, но вызовет панику при вызове:
// Equal(Wrapper{[]int{1}}, Wrapper{[]int{1}}) — PANIC!

// РЕШЕНИЕ: используйте cmp.Ordered для числовых сравнений
// или пишите собственные предикаты для сложных типов

// Пакет cmp (Go 1.21) — безопасное сравнение
import "cmp"

func CompareOrdered[T cmp.Ordered](a, b T) int {
	return cmp.Compare(a, b) // -1, 0, или 1
}
```

### Range over func / Итераторы (Go 1.23)

Go 1.23 добавил поддержку итераторов через `range` по функциям. Это позволяет создавать ленивые последовательности и кастомные итераторы:

```go
package main

import (
	"fmt"
	"iter"
	"slices"
)

// iter.Seq[V] — итератор, возвращающий одно значение
// Определение: type Seq[V any] func(yield func(V) bool)

// iter.Seq2[K, V] — итератор, возвращающий два значения (ключ, значение)
// Определение: type Seq2[K, V any] func(yield func(K, V) bool)

// FilterIter создаёт ленивый итератор с фильтрацией
func FilterIter[T any](seq iter.Seq[T], pred func(T) bool) iter.Seq[T] {
	return func(yield func(T) bool) {
		for v := range seq {
			if pred(v) {
				if !yield(v) {
					return // Ранний выход: потребитель больше не хочет данных
				}
			}
		}
	}
}

// MapIter преобразует элементы итератора
func MapIter[T any, R any](seq iter.Seq[T], fn func(T) R) iter.Seq[R] {
	return func(yield func(R) bool) {
		for v := range seq {
			if !yield(fn(v)) {
				return
			}
		}
	}
}

// Range генерирует последовательность чисел
func Range(start, end int) iter.Seq[int] {
	return func(yield func(int) bool) {
		for i := start; i < end; i++ {
			if !yield(i) {
				return
			}
		}
	}
}

// Enumerate добавляет индексы к итератору
func Enumerate[T any](seq iter.Seq[T]) iter.Seq2[int, T] {
	return func(yield func(int, T) bool) {
		i := 0
		for v := range seq {
			if !yield(i, v) {
				return
			}
			i++
		}
	}
}

func main() {
	// Range over func — ленивая последовательность
	for v := range Range(1, 10) {
		fmt.Print(v, " ") // 1 2 3 4 5 6 7 8 9
	}
	fmt.Println()

	// Composing итераторов: фильтр + преобразование
	seq := FilterIter(Range(1, 20), func(n int) bool {
		return n%2 == 0 // только чётные
	})
	doubled := MapIter(seq, func(n int) int {
		return n * 2
	})

	// slices.Collect (Go 1.23) — собирает итератор в слайс
	result := slices.Collect(doubled)
	fmt.Println(result) // [4 8 12 16 20 24 28 32 36]

	// Enumerate — итерация с индексом
	names := slices.Values([]string{"Go", "Rust", "Python"})
	for i, name := range Enumerate(names) {
		fmt.Printf("%d: %s\n", i, name)
	}
}
```

### Итерация по дереву с итераторами

```go
// Бинарное дерево с итератором in-order обхода
type TreeNode[T cmp.Ordered] struct {
	Value T
	Left  *TreeNode[T]
	Right *TreeNode[T]
}

// InOrder возвращает итератор для обхода дерева in-order
func (n *TreeNode[T]) InOrder() iter.Seq[T] {
	return func(yield func(T) bool) {
		if n == nil {
			return
		}
		// Рекурсивный обход: лево → корень → право
		for v := range n.Left.InOrder() {
			if !yield(v) {
				return
			}
		}
		if !yield(n.Value) {
			return
		}
		for v := range n.Right.InOrder() {
			if !yield(v) {
				return
			}
		}
	}
}

func main() {
	// Создаём дерево:    5
	//                   / \
	//                  3   7
	//                 / \   \
	//                1   4   9
	root := &TreeNode[int]{
		Value: 5,
		Left: &TreeNode[int]{
			Value: 3,
			Left:  &TreeNode[int]{Value: 1},
			Right: &TreeNode[int]{Value: 4},
		},
		Right: &TreeNode[int]{
			Value: 7,
			Right: &TreeNode[int]{Value: 9},
		},
	}

	// In-order обход через range
	for v := range root.InOrder() {
		fmt.Print(v, " ") // 1 3 4 5 7 9
	}
	fmt.Println()

	// Собираем в слайс
	sorted := slices.Collect(root.InOrder())
	fmt.Println(sorted) // [1 3 4 5 7 9]
}
```

###### 🏠 Домашнее задание

1. Реализуйте дженерик-функцию `GroupBy[T any, K comparable](items []T, keyFn func(T) K) map[K][]T`.
2. Реализуйте тип `Result[T any]` с методами `Ok(T)`, `Err(error)`, `Unwrap() (T, error)`, `UnwrapOr(T) T`, `Map(func(T) T) Result[T]`.
3. Реализуйте дженерик `LRUCache[K comparable, V any]` с методами `Get(K) (V, bool)`, `Put(K, V)`, ограничением по размеру и вытеснением наиболее давно использованных элементов.
4. Создайте итератор `Chunk[T any](seq iter.Seq[T], size int) iter.Seq[[]T]`, который разбивает последовательность на чанки заданного размера.

---

## 3. Unsafe пакет

Пакет `unsafe` предоставляет низкоуровневые операции, обходящие систему типов Go. Его использование допустимо только в редких случаях, когда нужна максимальная производительность или интеграция с C.

### Базовые функции

```go
package main

import (
	"fmt"
	"unsafe"
)

type Example struct {
	A bool    // 1 байт
	B int64   // 8 байт
	C bool    // 1 байт
	D int32   // 4 байта
}

// Оптимизированная версия — поля упорядочены по размеру
type ExampleOptimized struct {
	B int64   // 8 байт
	D int32   // 4 байта
	A bool    // 1 байт
	C bool    // 1 байт
	// padding: 2 байта
}

func main() {
	// unsafe.Sizeof — размер типа в байтах (без учёта того, на что указывают указатели)
	fmt.Println("Sizeof(bool):", unsafe.Sizeof(bool(false)))     // 1
	fmt.Println("Sizeof(int64):", unsafe.Sizeof(int64(0)))       // 8
	fmt.Println("Sizeof(string):", unsafe.Sizeof(""))             // 16 (указатель + длина)
	fmt.Println("Sizeof([]int):", unsafe.Sizeof([]int{}))         // 24 (указатель + длина + ёмкость)

	// Размер структуры с учётом выравнивания (padding)
	fmt.Println("Sizeof(Example):", unsafe.Sizeof(Example{}))              // 24 (с padding)
	fmt.Println("Sizeof(ExampleOptimized):", unsafe.Sizeof(ExampleOptimized{})) // 16 (без лишнего padding)

	// unsafe.Alignof — требования к выравниванию
	fmt.Println("Alignof(bool):", unsafe.Alignof(bool(false)))   // 1
	fmt.Println("Alignof(int64):", unsafe.Alignof(int64(0)))     // 8

	// unsafe.Offsetof — смещение поля от начала структуры
	var ex Example
	fmt.Println("Offsetof A:", unsafe.Offsetof(ex.A)) // 0
	fmt.Println("Offsetof B:", unsafe.Offsetof(ex.B)) // 8 (выравнивание по 8)
	fmt.Println("Offsetof C:", unsafe.Offsetof(ex.C)) // 16
	fmt.Println("Offsetof D:", unsafe.Offsetof(ex.D)) // 20
}
```

### unsafe.Pointer: универсальный указатель

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	// Преобразование типов через unsafe.Pointer
	var x int64 = 42
	// int64* -> unsafe.Pointer -> float64*
	p := unsafe.Pointer(&x)
	f := (*float64)(p)
	fmt.Printf("int64: %d -> float64 bits: %f\n", x, *f)

	// Доступ к полю структуры через смещение
	type Point struct {
		X int
		Y int
	}
	pt := Point{10, 20}
	// Получаем указатель на поле Y через Offsetof
	yPtr := (*int)(unsafe.Pointer(
		uintptr(unsafe.Pointer(&pt)) + unsafe.Offsetof(pt.Y),
	))
	*yPtr = 99
	fmt.Println("Point:", pt) // {10 99}
}
```

### Zero-copy конвертация []byte <-> string

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	// Go 1.20+: безопасные функции для zero-copy конвертации
	b := []byte("Привет, мир!")

	// unsafe.String — создаёт строку без копирования из []byte
	s := unsafe.String(unsafe.SliceData(b), len(b))
	fmt.Println(s) // Привет, мир!

	// unsafe.StringData — получает указатель на данные строки
	str := "Hello"
	ptr := unsafe.StringData(str)
	fmt.Printf("Первый байт: %c\n", *ptr) // H

	// unsafe.Slice — создаёт слайс из указателя и длины
	arr := [5]int{1, 2, 3, 4, 5}
	sl := unsafe.Slice(&arr[1], 3) // слайс arr[1:4]
	fmt.Println(sl)                 // [2 3 4]
}
```

> [!WARNING] Пакет unsafe опасен
> - Результат зависит от платформы (размер int, выравнивание)
> - Код может сломаться при обновлении версии Go
> - Обходит сборщик мусора — можно получить dangling pointer
> - Нарушает гарантии memory safety
> - Используйте только когда производительность критична и измерена бенчмарками

###### 🏠 Домашнее задание

1. Напишите функцию, которая выводит memory layout любой структуры: имя поля, смещение, размер, выравнивание.
2. Сравните производительность `string([]byte)` (обычная конвертация) и `unsafe.String` на бенчмарке с большими строками (1MB).
3. Оптимизируйте порядок полей в структуре `Event{Active bool, Timestamp int64, Priority uint8, UserID int64, Score float32}` для минимального размера.

---

## 4. CGO: вызов C из Go

CGO позволяет вызывать C-функции из Go и наоборот. Это необходимо при использовании системных библиотек (SQLite, OpenSSL, специализированные драйверы).

### Базовый пример

```go
package main

// #include <stdlib.h>
// #include <string.h>
import "C" // ВАЖНО: этот import должен идти сразу после комментария с #include

import (
	"fmt"
	"unsafe"
)

func main() {
	// C.CString выделяет строку в памяти C (нужно вручную освобождать!)
	cStr := C.CString("Привет из Go")
	defer C.free(unsafe.Pointer(cStr)) // ОБЯЗАТЕЛЬНО: освобождаем память C

	// C.strlen — вызов стандартной C-функции
	length := C.strlen(cStr)
	fmt.Printf("Длина C-строки: %d байт\n", length)

	// C.GoString — конвертация из C-строки обратно в Go-строку
	goStr := C.GoString(cStr)
	fmt.Println("Go-строка:", goStr)
}
```

### Вызов пользовательских C-функций

```go
package main

/*
#include <math.h>

// Собственная C-функция прямо в комментарии
static int add(int a, int b) {
    return a + b;
}

static double circle_area(double radius) {
    return M_PI * radius * radius;
}
*/
import "C"

import "fmt"

func main() {
	// Вызов C-функции add
	result := C.add(C.int(10), C.int(20))
	fmt.Println("10 + 20 =", int(result)) // 30

	// Вызов circle_area
	area := C.circle_area(C.double(5.0))
	fmt.Printf("Площадь круга r=5: %.2f\n", float64(area))
}
```

> [!WARNING] Стоимость CGO
> - Каждый вызов C-функции через CGO стоит ~50-100ns (vs ~5ns для Go-функции)
> - CGO-код не может использовать горутины напрямую
> - Cборка с CGO медленнее и требует C-компилятор
> - Кросс-компиляция усложняется
>
> Для чистых Go-сборок: `CGO_ENABLED=0 go build`

### Когда CGO необходим

```go
// Типичные случаи использования CGO:

// 1. SQLite — C-библиотека, нет чистой Go-реализации (производительной)
// import "github.com/mattn/go-sqlite3" (использует CGO)

// 2. Системные библиотеки
// import "github.com/miekg/pkcs11" (работа с HSM через PKCS#11)

// 3. GPU/CUDA
// Вызов CUDA-ядер для вычислений

// Альтернативы CGO:
// - CGO_ENABLED=0 + чистые Go-реализации (modernc.org/sqlite)
// - Вызов через subprocess
// - Связь через сокеты/gRPC
```

###### 🏠 Домашнее задание

1. Напишите Go-программу, которая через CGO вызывает C-функцию `qsort` для сортировки массива int.
2. Измерьте разницу в производительности между `math.Sqrt` (Go) и `C.sqrt` (CGO) на миллионе вызовов.
3. Соберите свою программу с `CGO_ENABLED=0` и убедитесь, что она не использует CGO.

---

## 5. Plugin система

Go поддерживает динамическую загрузку плагинов через пакет `plugin`. Это позволяет расширять программу без перекомпиляции.

### Создание и загрузка плагина

```go
// === plugin/greeter.go ===
// Компилируется как: go build -buildmode=plugin -o greeter.so plugin/greeter.go
package main

import "fmt"

// Экспортируемая переменная — символ плагина
var Name = "Greeter Plugin"

// Экспортируемая функция
func Greet(name string) string {
	return fmt.Sprintf("Привет, %s! Я плагин.", name)
}

// === main.go ===
package main

import (
	"fmt"
	"plugin"
)

func main() {
	// Открываем плагин
	p, err := plugin.Open("greeter.so")
	if err != nil {
		panic(err)
	}

	// Ищем символ по имени
	nameSym, err := p.Lookup("Name")
	if err != nil {
		panic(err)
	}
	// Type assertion к нужному типу
	name := nameSym.(*string)
	fmt.Println("Имя плагина:", *name)

	// Ищем функцию
	greetSym, err := p.Lookup("Greet")
	if err != nil {
		panic(err)
	}
	greet := greetSym.(func(string) string)
	fmt.Println(greet("Мир"))
}
```

> [!WARNING] Ограничения plugin
> - Работает только на Linux и macOS (не Windows)
> - Плагин и основная программа должны быть собраны одной версией Go
> - Все зависимости должны совпадать по версиям
> - Плагин нельзя выгрузить из памяти
> - Нет поддержки в `CGO_ENABLED=0`

### Альтернативы плагинам

```go
// 1. RPC-плагины через hashicorp/go-plugin
// Плагин запускается как отдельный процесс, общение через gRPC
// Преимущества: изоляция, любой язык, можно перезапускать

// 2. Скриптовые движки (Lua, JavaScript)
// Встраивание интерпретатора для расширения логики
// github.com/yuin/gopher-lua — Lua VM для Go

// 3. WebAssembly
// Плагины в формате WASM — кроссплатформенные и безопасные
// github.com/tetratelabs/wazero — WASM runtime для Go
```

###### 🏠 Домашнее задание

1. Создайте систему плагинов, где каждый плагин реализует интерфейс `Processor` с методом `Process(data []byte) ([]byte, error)`. Основная программа загружает плагины из директории и применяет их последовательно.
2. Сравните подход с `plugin.Open` и подход с RPC (net/rpc или gRPC): плагин как отдельный процесс.

---

## 6. Оптимизация производительности

Производительность Go-программ зависит от понимания того, как компилятор и рантайм работают с памятью, стеком и сборщиком мусора.

### Escape analysis: стек vs куча

```go
package main

// go build -gcflags="-m" показывает решения escape analysis
// go build -gcflags="-m -m" — более подробный вывод

// Значение ОСТАЁТСЯ на стеке — быстрое выделение
func stackAlloc() int {
	x := 42 // x не "убегает" из функции
	return x
}

// Значение УБЕГАЕТ на кучу — нужна сборка мусора
func heapAlloc() *int {
	x := 42
	return &x // Возвращаем указатель → x должен жить дольше функции → куча
}

// Ещё причины escape на кучу:
func escapeExamples() {
	// 1. Возврат указателя (как выше)

	// 2. Передача в interface{} / any
	var i interface{} = 42 // Boxing: int → interface{} → heap

	// 3. Замыкание, захватывающее переменную
	x := 10
	fn := func() { _ = x } // x может утечь, если fn утечёт
	_ = fn

	// 4. Слишком большой объект (зависит от версии Go, обычно >64KB)
	big := make([]byte, 100_000) // слишком большой для стека
	_ = big

	// 5. Слайс с неизвестной длиной на этапе компиляции
	n := 10
	s := make([]int, n) // n может быть любым → куча
	_ = s
	_ = i
}
```

### Уменьшение аллокаций

```go
package main

import (
	"fmt"
	"strings"
	"sync"
)

// ПЛОХО: аллокация на каждой итерации
func concatBad(items []string) string {
	result := ""
	for _, item := range items {
		result += item + ", " // Каждая конкатенация — новая аллокация
	}
	return result
}

// ХОРОШО: strings.Builder с предварительным Grow
func concatGood(items []string) string {
	var totalLen int
	for _, item := range items {
		totalLen += len(item) + 2
	}

	var sb strings.Builder
	sb.Grow(totalLen) // Одна аллокация нужного размера
	for i, item := range items {
		if i > 0 {
			sb.WriteString(", ")
		}
		sb.WriteString(item)
	}
	return sb.String()
}

// ПЛОХО: слайс растёт, перевыделяя память
func collectBad(n int) []int {
	var result []int // начальная ёмкость 0
	for i := 0; i < n; i++ {
		result = append(result, i) // Многократное перевыделение
	}
	return result
}

// ХОРОШО: preallocated слайс
func collectGood(n int) []int {
	result := make([]int, 0, n) // Ёмкость задана заранее
	for i := 0; i < n; i++ {
		result = append(result, i) // Без перевыделений
	}
	return result
}

// sync.Pool — переиспользование объектов для снижения давления на GC
var bufPool = sync.Pool{
	New: func() interface{} {
		buf := make([]byte, 0, 4096)
		return &buf
	},
}

func processWithPool(data []byte) []byte {
	// Берём буфер из пула (или создаём новый)
	bufPtr := bufPool.Get().(*[]byte)
	buf := (*bufPtr)[:0] // Сброс длины, сохраняя ёмкость

	// Используем буфер
	buf = append(buf, data...)
	buf = append(buf, '\n')
	result := make([]byte, len(buf))
	copy(result, buf)

	// Возвращаем буфер в пул
	*bufPtr = buf
	bufPool.Put(bufPtr)

	return result
}

func main() {
	items := []string{"Go", "Rust", "Python", "Java"}
	fmt.Println(concatGood(items))
}
```

### Memory layout: порядок полей структуры

```go
// Компилятор Go добавляет padding для выравнивания полей
// Неоптимальный порядок приводит к пустым байтам

// ПЛОХО: 32 байта (много padding)
type BadLayout struct {
	A bool    // 1 байт + 7 байт padding
	B int64   // 8 байт
	C bool    // 1 байт + 3 байт padding
	D int32   // 4 байт
	E bool    // 1 байт + 7 байт padding
}

// ХОРОШО: 24 байта (минимум padding)
type GoodLayout struct {
	B int64   // 8 байт
	D int32   // 4 байта
	A bool    // 1 байт
	C bool    // 1 байт
	E bool    // 1 байт + 1 байт padding
}

// Правило: располагайте поля от большего к меньшему
// Инструмент: fieldalignment (из golang.org/x/tools)
// go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest
// fieldalignment -fix ./...
```

### Инлайнинг и компиляторные оптимизации

```go
// Компилятор Go автоматически инлайнит маленькие функции
// go build -gcflags="-m" показывает, что инлайнится

// Эта функция будет инлайнена — она достаточно маленькая
func add(a, b int) int {
	return a + b
}

// Эта функция НЕ будет инлайнена — слишком сложная
func complexFunc(data []int) int {
	sum := 0
	for _, v := range data {
		if v > 0 {
			sum += v * v
		} else {
			sum -= v
		}
	}
	return sum
}

// Подсказка компилятору (Go 1.22+):
//
//go:noinline  — запретить инлайнинг
func mustNotInline(x int) int { return x + 1 }
```

### Настройка сборщика мусора

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	// GOGC (по умолчанию 100) — процент роста кучи перед следующим GC
	// GOGC=200 — GC запускается реже, больше потребление памяти
	// GOGC=50  — GC запускается чаще, меньше потребление памяти
	// GOGC=off — GC выключен (опасно!)

	// GOMEMLIMIT (Go 1.19+) — мягкий лимит памяти
	// Позволяет задать: "используй не больше X памяти"
	// Пример: GOMEMLIMIT=1GiB

	// Чтение статистики GC
	var stats runtime.MemStats
	runtime.ReadMemStats(&stats)

	fmt.Printf("Alloc: %d MB\n", stats.Alloc/1024/1024)          // Текущие аллокации
	fmt.Printf("TotalAlloc: %d MB\n", stats.TotalAlloc/1024/1024) // Всего аллоцировано
	fmt.Printf("Sys: %d MB\n", stats.Sys/1024/1024)               // Память от ОС
	fmt.Printf("NumGC: %d\n", stats.NumGC)                         // Количество циклов GC
	fmt.Printf("GCPause: %v\n", stats.PauseNs[(stats.NumGC+255)%256]) // Последняя пауза
}
```

### Стеки горутин

```go
// Стек горутины начинается с 2KB (vs 1-8MB для потока ОС)
// При нехватке места Go автоматически:
// 1. Выделяет новый стек в 2 раза больше
// 2. Копирует старый стек в новый
// 3. Обновляет все указатели на стековые данные
// 4. Освобождает старый стек

// При уменьшении использования стек также сжимается (shrink)

// Это позволяет создавать миллионы горутин:
// 1 000 000 горутин × 2KB = ~2GB (начальный стек)
// 1 000 000 потоков × 1MB = ~1TB (нереально)
```

### GC: внутреннее устройство

```go
// Go использует concurrent tri-color mark-and-sweep GC:
//
// Три цвета:
// - Белый: объект ещё не посещён (кандидат на удаление)
// - Серый: объект посещён, но его ссылки ещё не проверены
// - Чёрный: объект посещён и все его ссылки проверены
//
// Фазы:
// 1. Mark Setup (STW) — кратчайшая пауза (<1μs), включает write barrier
// 2. Marking (concurrent) — обходит граф объектов, работая параллельно с приложением
// 3. Mark Termination (STW) — кратчайшая пауза, выключает write barrier
// 4. Sweep (concurrent) — освобождает белые объекты
//
// Write barrier: при каждой записи указателя GC получает уведомление,
// чтобы не пропустить новые ссылки, созданные во время marking
//
// Целевая пауза STW: <1ms (обычно <100μs)
//
// Отладка: GODEBUG=gctrace=1 go run main.go
```

### Бенчмаркинг

```go
package main

import (
	"strings"
	"testing"
)

// Правильный бенчмарк — цикл b.N
func BenchmarkConcatPlus(b *testing.B) {
	strs := []string{"hello", "world", "from", "Go"}
	b.ResetTimer() // Сбрасываем таймер после подготовки данных

	for i := 0; i < b.N; i++ {
		result := ""
		for _, s := range strs {
			result += s
		}
		_ = result
	}
}

func BenchmarkConcatBuilder(b *testing.B) {
	strs := []string{"hello", "world", "from", "Go"}
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		var sb strings.Builder
		for _, s := range strs {
			sb.WriteString(s)
		}
		_ = sb.String()
	}
}

// Запуск: go test -bench=. -benchmem -count=5
// Пример вывода:
// BenchmarkConcatPlus-8       5000000   280 ns/op   64 B/op   3 allocs/op
// BenchmarkConcatBuilder-8   10000000   120 ns/op   48 B/op   1 allocs/op
//
// -benchmem показывает аллокации (B/op — байт на операцию, allocs/op — количество)
// -count=5 запускает каждый бенчмарк 5 раз для статистической значимости
```

> [!TIP] Инструменты профилирования
> - `go test -bench=. -cpuprofile=cpu.out -memprofile=mem.out` — сбор профилей
> - `go tool pprof cpu.out` — анализ CPU-профиля
> - `go tool pprof -http=:8080 mem.out` — веб-интерфейс для memory-профиля
> - `go tool trace trace.out` — визуализация runtime событий
> - `runtime/pprof` или `net/http/pprof` — профилирование в production
>
> Подробнее о тестировании и бенчмарках — [[07-testing]].

###### 🏠 Домашнее задание

1. Запустите `go build -gcflags="-m"` на своём проекте и определите, какие переменные утекают на кучу. Попробуйте исправить хотя бы 3 случая.
2. Напишите бенчмарки, сравнивающие: (a) `fmt.Sprintf` vs `strconv.Itoa` для конвертации int→string; (b) `map[string]bool` vs `map[string]struct{}` для множества.
3. Оптимизируйте структуру с 10 полями разных типов для минимального размера. Проверьте с помощью `unsafe.Sizeof`.
4. Настройте `GOGC` и `GOMEMLIMIT` для программы с высоким потреблением памяти. Измерьте влияние на latency и throughput.

---

## 7. Паттерны проектирования на Go

Go не имеет классов и наследования, поэтому классические паттерны (GoF) адаптированы к идиомам языка: интерфейсы, функции первого класса и композиция.

### Functional Options

Самый популярный Go-паттерн для конфигурации объектов. Позволяет задавать только нужные параметры, сохраняя разумные значения по умолчанию.

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// Server — HTTP-сервер с настраиваемыми параметрами
type Server struct {
	host         string
	port         int
	timeout      time.Duration
	maxConns     int
	tlsCertFile  string
	tlsKeyFile   string
	logger       *log.Logger
}

// Option — функция, модифицирующая конфигурацию сервера
type Option func(*Server)

// WithHost задаёт хост
func WithHost(host string) Option {
	return func(s *Server) {
		s.host = host
	}
}

// WithPort задаёт порт
func WithPort(port int) Option {
	return func(s *Server) {
		s.port = port
	}
}

// WithTimeout задаёт таймаут
func WithTimeout(d time.Duration) Option {
	return func(s *Server) {
		s.timeout = d
	}
}

// WithMaxConns задаёт максимальное количество соединений
func WithMaxConns(n int) Option {
	return func(s *Server) {
		s.maxConns = n
	}
}

// WithTLS включает TLS
func WithTLS(certFile, keyFile string) Option {
	return func(s *Server) {
		s.tlsCertFile = certFile
		s.tlsKeyFile = keyFile
	}
}

// WithLogger задаёт кастомный логгер
func WithLogger(l *log.Logger) Option {
	return func(s *Server) {
		s.logger = l
	}
}

// NewServer создаёт сервер со значениями по умолчанию
// и применяет переданные опции
func NewServer(opts ...Option) *Server {
	// Значения по умолчанию
	s := &Server{
		host:     "localhost",
		port:     8080,
		timeout:  30 * time.Second,
		maxConns: 1000,
	}

	// Применяем каждую опцию
	for _, opt := range opts {
		opt(s)
	}

	return s
}

func (s *Server) Addr() string {
	return fmt.Sprintf("%s:%d", s.host, s.port)
}

func main() {
	// Минимальная конфигурация — значения по умолчанию
	srv1 := NewServer()
	fmt.Println("Server 1:", srv1.Addr()) // localhost:8080

	// Кастомная конфигурация — только нужные параметры
	srv2 := NewServer(
		WithHost("0.0.0.0"),
		WithPort(443),
		WithTimeout(60*time.Second),
		WithTLS("cert.pem", "key.pem"),
	)
	fmt.Println("Server 2:", srv2.Addr()) // 0.0.0.0:443
}
```

### Builder

Паттерн Builder полезен для пошагового построения сложных объектов, особенно когда порядок операций имеет значение:

```go
package main

import (
	"fmt"
	"strings"
)

// QueryBuilder — построитель SQL-запросов
type QueryBuilder struct {
	table      string
	columns    []string
	conditions []string
	args       []interface{}
	orderBy    string
	limit      int
	offset     int
}

func NewQueryBuilder(table string) *QueryBuilder {
	return &QueryBuilder{
		table:   table,
		columns: []string{"*"},
		limit:   -1,
	}
}

func (qb *QueryBuilder) Select(columns ...string) *QueryBuilder {
	qb.columns = columns
	return qb // Возвращаем *QueryBuilder для chain-вызовов
}

func (qb *QueryBuilder) Where(condition string, args ...interface{}) *QueryBuilder {
	qb.conditions = append(qb.conditions, condition)
	qb.args = append(qb.args, args...)
	return qb
}

func (qb *QueryBuilder) OrderBy(field string) *QueryBuilder {
	qb.orderBy = field
	return qb
}

func (qb *QueryBuilder) Limit(n int) *QueryBuilder {
	qb.limit = n
	return qb
}

func (qb *QueryBuilder) Offset(n int) *QueryBuilder {
	qb.offset = n
	return qb
}

func (qb *QueryBuilder) Build() (string, []interface{}) {
	var sb strings.Builder

	// SELECT
	sb.WriteString("SELECT ")
	sb.WriteString(strings.Join(qb.columns, ", "))

	// FROM
	sb.WriteString(" FROM ")
	sb.WriteString(qb.table)

	// WHERE
	if len(qb.conditions) > 0 {
		sb.WriteString(" WHERE ")
		sb.WriteString(strings.Join(qb.conditions, " AND "))
	}

	// ORDER BY
	if qb.orderBy != "" {
		sb.WriteString(" ORDER BY ")
		sb.WriteString(qb.orderBy)
	}

	// LIMIT
	if qb.limit >= 0 {
		sb.WriteString(fmt.Sprintf(" LIMIT %d", qb.limit))
	}

	// OFFSET
	if qb.offset > 0 {
		sb.WriteString(fmt.Sprintf(" OFFSET %d", qb.offset))
	}

	return sb.String(), qb.args
}

func main() {
	query, args := NewQueryBuilder("users").
		Select("id", "name", "email").
		Where("age > $1", 18).
		Where("active = $2", true).
		OrderBy("created_at DESC").
		Limit(10).
		Offset(20).
		Build()

	fmt.Println("SQL:", query)
	fmt.Println("Args:", args)
	// SQL: SELECT id, name, email FROM users WHERE age > $1 AND active = $2
	//      ORDER BY created_at DESC LIMIT 10 OFFSET 20
	// Args: [18 true]
}
```

### Strategy

Паттерн Strategy реализуется через интерфейсы — Go-way подход:

```go
package main

import "fmt"

// PaymentProcessor — интерфейс стратегии оплаты
type PaymentProcessor interface {
	ProcessPayment(amount float64) error
	Name() string
}

// StripeProcessor — реализация для Stripe
type StripeProcessor struct {
	apiKey string
}

func (s *StripeProcessor) ProcessPayment(amount float64) error {
	fmt.Printf("[Stripe] Обработка платежа: $%.2f\n", amount)
	// Реальный вызов Stripe API
	return nil
}

func (s *StripeProcessor) Name() string { return "Stripe" }

// PayPalProcessor — реализация для PayPal
type PayPalProcessor struct {
	clientID string
	secret   string
}

func (p *PayPalProcessor) ProcessPayment(amount float64) error {
	fmt.Printf("[PayPal] Обработка платежа: $%.2f\n", amount)
	return nil
}

func (p *PayPalProcessor) Name() string { return "PayPal" }

// PaymentService — использует стратегию
type PaymentService struct {
	processor PaymentProcessor
}

func NewPaymentService(processor PaymentProcessor) *PaymentService {
	return &PaymentService{processor: processor}
}

func (ps *PaymentService) Checkout(amount float64) error {
	fmt.Printf("Оплата через %s...\n", ps.processor.Name())
	return ps.processor.ProcessPayment(amount)
}

func main() {
	// Выбор стратегии в runtime
	stripe := &StripeProcessor{apiKey: "sk_test_xxx"}
	paypal := &PayPalProcessor{clientID: "xxx", secret: "yyy"}

	// Один и тот же сервис, разные стратегии
	svc := NewPaymentService(stripe)
	svc.Checkout(99.99)

	svc = NewPaymentService(paypal)
	svc.Checkout(49.99)
}
```

### Observer

Паттерн Observer через каналы и callback-регистрацию:

```go
package main

import (
	"fmt"
	"sync"
)

// Event — доменное событие
type Event struct {
	Type    string
	Payload interface{}
}

// EventBus — шина событий
type EventBus struct {
	mu       sync.RWMutex
	handlers map[string][]func(Event)
}

func NewEventBus() *EventBus {
	return &EventBus{
		handlers: make(map[string][]func(Event)),
	}
}

// Subscribe регистрирует обработчик для типа события
func (eb *EventBus) Subscribe(eventType string, handler func(Event)) {
	eb.mu.Lock()
	defer eb.mu.Unlock()
	eb.handlers[eventType] = append(eb.handlers[eventType], handler)
}

// Publish отправляет событие всем подписчикам
func (eb *EventBus) Publish(event Event) {
	eb.mu.RLock()
	defer eb.mu.RUnlock()

	for _, handler := range eb.handlers[event.Type] {
		handler(event)
	}
}

func main() {
	bus := NewEventBus()

	// Подписчик 1: логирование
	bus.Subscribe("user.created", func(e Event) {
		fmt.Printf("[LOG] Создан пользователь: %v\n", e.Payload)
	})

	// Подписчик 2: отправка email
	bus.Subscribe("user.created", func(e Event) {
		fmt.Printf("[EMAIL] Отправка приветственного письма: %v\n", e.Payload)
	})

	// Публикация события
	bus.Publish(Event{
		Type:    "user.created",
		Payload: "user@example.com",
	})
}
```

### Middleware / Decorator

Middleware — основной паттерн в HTTP-обработке Go. См. также [[03-networking]]:

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// Middleware — функция, оборачивающая http.Handler
type Middleware func(http.Handler) http.Handler

// LoggingMiddleware — логирует запросы
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// AuthMiddleware — проверяет авторизацию
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RecoveryMiddleware — восстанавливается после паники
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("PANIC: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// Chain — компонует middleware в цепочку
func Chain(handler http.Handler, middlewares ...Middleware) http.Handler {
	// Применяем в обратном порядке, чтобы первый middleware был внешним
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

func main() {
	// Обработчик
	hello := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Привет!")
	})

	// Компонуем middleware
	handler := Chain(hello,
		RecoveryMiddleware, // 1. внешний — ловит паники
		LoggingMiddleware,  // 2. логирует время
		AuthMiddleware,     // 3. внутренний — проверяет авторизацию
	)

	http.Handle("/hello", handler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Factory

Фабричные конструкторы — идиоматический Go-подход:

```go
// Logger — интерфейс логгера
type Logger interface {
	Info(msg string)
	Error(msg string)
}

// ConsoleLogger — вывод в консоль
type ConsoleLogger struct{}

func (l *ConsoleLogger) Info(msg string)  { fmt.Println("[INFO]", msg) }
func (l *ConsoleLogger) Error(msg string) { fmt.Println("[ERROR]", msg) }

// FileLogger — вывод в файл
type FileLogger struct {
	file *os.File
}

func (l *FileLogger) Info(msg string)  { fmt.Fprintln(l.file, "[INFO]", msg) }
func (l *FileLogger) Error(msg string) { fmt.Fprintln(l.file, "[ERROR]", msg) }

// NewLogger — фабричный конструктор
// Возвращает интерфейс, скрывая конкретную реализацию
func NewLogger(logType string, opts ...interface{}) (Logger, error) {
	switch logType {
	case "console":
		return &ConsoleLogger{}, nil
	case "file":
		if len(opts) == 0 {
			return nil, fmt.Errorf("для file-логгера нужен путь к файлу")
		}
		path, ok := opts[0].(string)
		if !ok {
			return nil, fmt.Errorf("путь должен быть строкой")
		}
		f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return nil, err
		}
		return &FileLogger{file: f}, nil
	default:
		return nil, fmt.Errorf("неизвестный тип логгера: %s", logType)
	}
}
```

###### 🏠 Домашнее задание

1. Реализуйте паттерн Functional Options для конфигурации HTTP-клиента: `NewHTTPClient(opts ...ClientOption)` с опциями `WithBaseURL`, `WithTimeout`, `WithRetries`, `WithHeader`, `WithAuth`.
2. Напишите Builder для создания HTML-элементов: `NewElement("div").Class("container").ID("main").Child(NewElement("p").Text("Hello")).Build()`.
3. Реализуйте EventBus с поддержкой асинхронных обработчиков (через горутины) и возможностью отписки.
4. Создайте цепочку из 3 middleware для gRPC (логирование, метрики, recovery) используя unary interceptor паттерн.

---

## 8. Чистая архитектура (Clean Architecture) в Go

Чистая архитектура организует код в слои с чёткими границами ответственности. Внутренние слои не знают о внешних, зависимости направлены внутрь.

### Слои архитектуры

```
┌─────────────────────────────────────────┐
│           Infrastructure                │  Конфигурация, БД, логгеры
│  ┌─────────────────────────────────┐    │
│  │         Adapter                 │    │  HTTP-хендлеры, репозитории, gRPC
│  │  ┌─────────────────────────┐    │    │
│  │  │       Usecase           │    │    │  Бизнес-логика, сервисы
│  │  │  ┌─────────────────┐    │    │    │
│  │  │  │    Domain        │    │    │    │  Сущности, интерфейсы
│  │  │  └─────────────────┘    │    │    │
│  │  └─────────────────────────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Правило зависимостей**: Внутренние слои НЕ импортируют внешние. Domain не знает о HTTP. Usecase не знает о PostgreSQL.

### Структура проекта

```
service/
├── cmd/
│   └── api/
│       └── main.go              # Точка входа, сборка зависимостей
├── internal/
│   ├── domain/                  # Ядро: сущности + интерфейсы
│   │   ├── user.go              # Сущность User
│   │   ├── order.go             # Сущность Order
│   │   └── repository.go        # Интерфейсы репозиториев
│   ├── usecase/                 # Бизнес-логика
│   │   ├── user_service.go      # UserService
│   │   └── order_service.go     # OrderService
│   ├── adapter/
│   │   ├── repository/          # Реализации репозиториев
│   │   │   ├── postgres/
│   │   │   │   ├── user_repo.go
│   │   │   │   └── order_repo.go
│   │   │   └── redis/
│   │   │       └── cache_repo.go
│   │   ├── handler/             # HTTP/gRPC обработчики
│   │   │   ├── http/
│   │   │   │   ├── user_handler.go
│   │   │   │   └── router.go
│   │   │   └── grpc/
│   │   │       └── user_server.go
│   │   └── gateway/             # Клиенты внешних сервисов
│   │       ├── email_gateway.go
│   │       └── payment_gateway.go
│   └── infrastructure/          # Инфраструктура
│       ├── config/
│       │   └── config.go
│       ├── database/
│       │   └── postgres.go
│       └── logger/
│           └── logger.go
├── go.mod
└── go.sum
```

### Реализация слоёв

```go
// =============================================
// internal/domain/user.go — Доменная сущность
// =============================================
package domain

import (
	"errors"
	"time"
)

// User — доменная сущность (чистая, без зависимостей)
type User struct {
	ID        string
	Name      string
	Email     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Валидация — часть домена
func (u *User) Validate() error {
	if u.Name == "" {
		return errors.New("имя не может быть пустым")
	}
	if u.Email == "" {
		return errors.New("email не может быть пустым")
	}
	return nil
}

// =============================================
// internal/domain/repository.go — Интерфейсы
// =============================================
package domain

import "context"

// UserRepository — интерфейс определён в домене,
// реализация — в adapter/repository
type UserRepository interface {
	GetByID(ctx context.Context, id string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	List(ctx context.Context, limit, offset int) ([]*User, error)
	Create(ctx context.Context, user *User) error
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
}

// =============================================
// internal/usecase/user_service.go — Бизнес-логика
// =============================================
package usecase

import (
	"context"
	"fmt"
	"time"

	"service/internal/domain"
)

// UserService содержит бизнес-логику для работы с пользователями
type UserService struct {
	repo domain.UserRepository // Зависит от ИНТЕРФЕЙСА, не реализации
}

// NewUserService — конструктор с инъекцией зависимости
func NewUserService(repo domain.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) CreateUser(ctx context.Context, name, email string) (*domain.User, error) {
	// Проверяем, что email не занят
	existing, _ := s.repo.GetByEmail(ctx, email)
	if existing != nil {
		return nil, fmt.Errorf("пользователь с email %s уже существует", email)
	}

	user := &domain.User{
		ID:        generateID(), // вспомогательная функция
		Name:      name,
		Email:     email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := user.Validate(); err != nil {
		return nil, fmt.Errorf("валидация: %w", err)
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("создание пользователя: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUser(ctx context.Context, id string) (*domain.User, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("получение пользователя: %w", err)
	}
	return user, nil
}

// =============================================
// internal/adapter/repository/postgres/user_repo.go
// =============================================
package postgres

import (
	"context"
	"database/sql"

	"service/internal/domain"
)

// UserRepo — реализация domain.UserRepository для PostgreSQL
type UserRepo struct {
	db *sql.DB
}

func NewUserRepo(db *sql.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	err := r.db.QueryRowContext(ctx,
		"SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("пользователь не найден: %s", id)
	}
	return &user, err
}

func (r *UserRepo) Create(ctx context.Context, user *domain.User) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT INTO users (id, name, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
		user.ID, user.Name, user.Email, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

// ... остальные методы аналогично

// =============================================
// internal/adapter/handler/http/user_handler.go
// =============================================
package http

import (
	"encoding/json"
	"net/http"

	"service/internal/usecase"
)

// UserHandler — HTTP-обработчик, адаптер для usecase
type UserHandler struct {
	userService *usecase.UserService
}

func NewUserHandler(us *usecase.UserService) *UserHandler {
	return &UserHandler{userService: us}
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "невалидный JSON", http.StatusBadRequest)
		return
	}

	user, err := h.userService.CreateUser(r.Context(), req.Name, req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id") // Go 1.22+ routing

	user, err := h.userService.GetUser(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
```

### Dependency Injection: сборка графа зависимостей

```go
// cmd/api/main.go — точка входа, где собираются все зависимости
package main

import (
	"database/sql"
	"log"
	"net/http"

	_ "github.com/lib/pq"

	pgRepo "service/internal/adapter/repository/postgres"
	httpHandler "service/internal/adapter/handler/http"
	"service/internal/usecase"
)

func main() {
	// 1. Infrastructure: подключение к БД
	db, err := sql.Open("postgres", "postgres://user:pass@localhost:5432/mydb?sslmode=disable")
	if err != nil {
		log.Fatal("Ошибка подключения к БД:", err)
	}
	defer db.Close()

	// 2. Adapter: создаём репозиторий
	userRepo := pgRepo.NewUserRepo(db)

	// 3. Usecase: создаём сервис, внедряем репозиторий
	userService := usecase.NewUserService(userRepo)

	// 4. Adapter: создаём HTTP-обработчик, внедряем сервис
	userHandler := httpHandler.NewUserHandler(userService)

	// 5. Настраиваем маршруты
	mux := http.NewServeMux()
	mux.HandleFunc("POST /users", userHandler.Create)
	mux.HandleFunc("GET /users/{id}", userHandler.GetByID)

	// 6. Запускаем сервер
	log.Println("Сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

// Граф зависимостей:
// main → handler → usecase → repository(interface)
//                              ↑
//                   postgres.UserRepo (реализация)
//
// Domain ничего не импортирует.
// Usecase импортирует только domain.
// Adapter импортирует domain и usecase.
// Main собирает всё вместе.
```

> [!NOTE] Dependency Injection в Go
> **Ручной DI** (как выше) — самый распространённый подход. Простой, понятный, без магии.
>
> **wire** (google/wire) — кодогенерация DI на этапе компиляции. Проверяет граф зависимостей при `go generate`.
>
> **fx** (uber-go/fx) — runtime DI-контейнер. Мощнее, но добавляет магию и усложняет отладку.
>
> Для большинства проектов ручного DI достаточно. Подробнее о структуре проектов — [[06-microservices]].

###### 🏠 Домашнее задание

1. Перестройте свой Todo-проект из предыдущих глав по чистой архитектуре: domain, usecase, adapter, infrastructure.
2. Добавьте второй adapter для хранения: in-memory (для тестов) и PostgreSQL (для production). Оба должны реализовывать один интерфейс.
3. Напишите unit-тесты для usecase-слоя, мокая репозиторий через интерфейс (см. [[07-testing]]).

---

## 9. DDD основы в Go

Domain-Driven Design (DDD) — подход к разработке, в котором структура кода отражает предметную область бизнеса. Go хорошо подходит для DDD благодаря интерфейсам и композиции.

### Value Objects

Value Objects — неизменяемые объекты, определяемые своим значением, а не идентификатором. Два Value Object с одинаковыми значениями считаются равными.

```go
package domain

import (
	"errors"
	"regexp"
	"strings"
)

// Email — Value Object с валидацией
type Email struct {
	value string
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// NewEmail — конструктор с валидацией
func NewEmail(raw string) (Email, error) {
	normalized := strings.ToLower(strings.TrimSpace(raw))
	if !emailRegex.MatchString(normalized) {
		return Email{}, errors.New("невалидный email")
	}
	return Email{value: normalized}, nil
}

func (e Email) String() string { return e.value }

// Два Email равны, если их значения совпадают
func (e Email) Equals(other Email) bool {
	return e.value == other.value
}

// Money — Value Object для денежных сумм
type Money struct {
	amount   int64  // Храним в копейках/центах для точности
	currency string
}

func NewMoney(amount int64, currency string) (Money, error) {
	if currency == "" {
		return Money{}, errors.New("валюта не может быть пустой")
	}
	return Money{amount: amount, currency: currency}, nil
}

func (m Money) Amount() int64    { return m.amount }
func (m Money) Currency() string { return m.currency }

func (m Money) Add(other Money) (Money, error) {
	if m.currency != other.currency {
		return Money{}, errors.New("нельзя складывать разные валюты")
	}
	return Money{amount: m.amount + other.amount, currency: m.currency}, nil
}

func (m Money) Multiply(factor int) Money {
	return Money{amount: m.amount * int64(factor), currency: m.currency}
}

func (m Money) String() string {
	whole := m.amount / 100
	cents := m.amount % 100
	return fmt.Sprintf("%d.%02d %s", whole, cents, m.currency)
}
```

### Entities

Entities — объекты с уникальной идентичностью. Два Entity с разным ID — разные объекты, даже если все остальные поля совпадают.

```go
package domain

import (
	"time"
)

// User — Entity (определяется по ID, а не по значениям полей)
type User struct {
	id        string
	name      string
	email     Email // Value Object
	createdAt time.Time
	updatedAt time.Time
}

func NewUser(id, name string, email Email) (*User, error) {
	if id == "" {
		return nil, errors.New("ID не может быть пустым")
	}
	if name == "" {
		return nil, errors.New("имя не может быть пустым")
	}

	now := time.Now()
	return &User{
		id:        id,
		name:      name,
		email:     email,
		createdAt: now,
		updatedAt: now,
	}, nil
}

// Геттеры — контролируемый доступ к полям
func (u *User) ID() string        { return u.id }
func (u *User) Name() string      { return u.name }
func (u *User) Email() Email      { return u.email }
func (u *User) CreatedAt() time.Time { return u.createdAt }

// Мутация — через методы с валидацией
func (u *User) ChangeName(name string) error {
	if name == "" {
		return errors.New("имя не может быть пустым")
	}
	u.name = name
	u.updatedAt = time.Now()
	return nil
}

func (u *User) ChangeEmail(email Email) {
	u.email = email
	u.updatedAt = time.Now()
}
```

### Aggregates

Aggregate — группа связанных Entity и Value Object, управляемых через Aggregate Root. Весь доступ — через корневой объект.

```go
package domain

import (
	"errors"
	"time"
)

// OrderStatus — перечисление статусов
type OrderStatus string

const (
	OrderStatusDraft     OrderStatus = "draft"
	OrderStatusConfirmed OrderStatus = "confirmed"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusCancelled OrderStatus = "cancelled"
)

// OrderItem — Entity внутри агрегата
type OrderItem struct {
	ProductID string
	Name      string
	Price     Money
	Quantity  int
}

// Order — Aggregate Root
// Вся работа с OrderItem идёт ТОЛЬКО через Order
type Order struct {
	id        string
	userID    string
	items     []OrderItem
	status    OrderStatus
	createdAt time.Time
	events    []DomainEvent // Собранные доменные события
}

func NewOrder(id, userID string) *Order {
	return &Order{
		id:        id,
		userID:    userID,
		status:    OrderStatusDraft,
		createdAt: time.Now(),
	}
}

func (o *Order) ID() string          { return o.id }
func (o *Order) Status() OrderStatus { return o.status }

// Бизнес-логика: добавление товара
func (o *Order) AddItem(productID, name string, price Money, qty int) error {
	if o.status != OrderStatusDraft {
		return errors.New("нельзя добавлять товары в подтверждённый заказ")
	}
	if qty <= 0 {
		return errors.New("количество должно быть положительным")
	}

	o.items = append(o.items, OrderItem{
		ProductID: productID,
		Name:      name,
		Price:     price,
		Quantity:  qty,
	})
	return nil
}

// Бизнес-логика: подтверждение заказа
func (o *Order) Confirm() error {
	if o.status != OrderStatusDraft {
		return errors.New("можно подтвердить только черновик")
	}
	if len(o.items) == 0 {
		return errors.New("нельзя подтвердить пустой заказ")
	}

	o.status = OrderStatusConfirmed
	// Регистрируем доменное событие
	o.events = append(o.events, OrderConfirmedEvent{
		OrderID: o.id,
		UserID:  o.userID,
		Total:   o.Total(),
	})
	return nil
}

// Total — подсчёт итоговой суммы
func (o *Order) Total() Money {
	total, _ := NewMoney(0, "RUB")
	for _, item := range o.items {
		itemTotal := item.Price.Multiply(item.Quantity)
		total, _ = total.Add(itemTotal)
	}
	return total
}

// PopEvents извлекает и очищает собранные доменные события
func (o *Order) PopEvents() []DomainEvent {
	events := o.events
	o.events = nil
	return events
}
```

### Domain Events

Доменные события уведомляют о значимых изменениях состояния:

```go
package domain

import "time"

// DomainEvent — интерфейс доменного события
type DomainEvent interface {
	EventName() string
	OccurredAt() time.Time
}

// OrderConfirmedEvent — событие подтверждения заказа
type OrderConfirmedEvent struct {
	OrderID    string
	UserID     string
	Total      Money
	occurredAt time.Time
}

func (e OrderConfirmedEvent) EventName() string    { return "order.confirmed" }
func (e OrderConfirmedEvent) OccurredAt() time.Time { return e.occurredAt }

// UserRegisteredEvent — событие регистрации пользователя
type UserRegisteredEvent struct {
	UserID     string
	Email      Email
	occurredAt time.Time
}

func (e UserRegisteredEvent) EventName() string    { return "user.registered" }
func (e UserRegisteredEvent) OccurredAt() time.Time { return e.occurredAt }
```

### Repository Pattern

```go
// Интерфейс — в domain (внутренний слой)
package domain

import "context"

type OrderRepository interface {
	GetByID(ctx context.Context, id string) (*Order, error)
	Save(ctx context.Context, order *Order) error
	ListByUser(ctx context.Context, userID string) ([]*Order, error)
}

// Реализация — в adapter (внешний слой)
// См. adapter/repository/postgres/order_repo.go
```

> [!INFO] DDD в Go: минимализм
> Go-сообщество предпочитает минималистичный подход к DDD:
> - Не все концепции DDD нужны в каждом проекте
> - Value Objects и Repository — используются почти всегда
> - Aggregates — для сложных бизнес-правил
> - Domain Events — когда нужна реакция на изменения между bounded contexts
> - Не усложняйте код ради паттерна. Если простая структура с методами решает задачу — этого достаточно.

###### 🏠 Домашнее задание

1. Создайте Value Object `Password` с хешированием (bcrypt), валидацией минимальной длины и метод `Verify(plain string) bool`.
2. Реализуйте Aggregate `ShoppingCart` с методами `AddItem`, `RemoveItem`, `ApplyDiscount`, `Checkout`. Генерируйте доменные события `CartCheckedOut`.
3. Опишите Bounded Context для системы заказов: какие Entities, Value Objects, Aggregates и Events вы выделите?

---

## 10. Стандартная библиотека: продвинутое использование

Стандартная библиотека Go — одна из самых богатых среди языков программирования. Здесь рассмотрены продвинутые возможности, которые часто упускают из виду. Базовое использование см. в [[01-basics]].

### time: форматирование и таймеры

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()

	// ВАЖНО: Go использует "reference time" для форматирования
	// Это конкретная дата: Mon Jan 2 15:04:05 MST 2006
	// Каждое число уникально: 1=месяц, 2=день, 3=час(PM), 4=мин, 5=сек, 6=год
	fmt.Println(now.Format("2006-01-02 15:04:05"))          // 2024-03-15 14:30:45
	fmt.Println(now.Format("02.01.2006"))                    // 15.03.2024
	fmt.Println(now.Format(time.RFC3339))                    // 2024-03-15T14:30:45+03:00
	fmt.Println(now.Format("Monday, January 2, 2006"))       // Friday, March 15, 2024

	// Парсинг строки в time.Time
	t, _ := time.Parse("2006-01-02", "2024-12-31")
	fmt.Println(t) // 2024-12-31 00:00:00 +0000 UTC

	// Duration — длительность
	d := 2*time.Hour + 30*time.Minute
	fmt.Println(d)                  // 2h30m0s
	fmt.Println(d.Seconds())       // 9000
	fmt.Println(d.Milliseconds())  // 9000000

	// Timer — однократный таймер
	timer := time.NewTimer(100 * time.Millisecond)
	<-timer.C // Блокируется до срабатывания
	fmt.Println("Таймер сработал")

	// Ticker — периодический тикер
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop() // ВАЖНО: всегда останавливайте тикер

	count := 0
	for t := range ticker.C {
		fmt.Println("Тик:", t.Format("15:04:05.000"))
		count++
		if count >= 3 {
			break
		}
	}
}
```

### regexp: регулярные выражения

```go
package main

import (
	"fmt"
	"regexp"
)

func main() {
	// MustCompile — паникует при невалидном regex (используйте для констант)
	emailRe := regexp.MustCompile(`^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$`)

	// Проверка совпадения
	fmt.Println(emailRe.MatchString("user@example.com")) // true
	fmt.Println(emailRe.MatchString("invalid"))           // false

	// Извлечение подгрупп
	matches := emailRe.FindStringSubmatch("user@example.com")
	fmt.Println("Полное совпадение:", matches[0]) // user@example.com
	fmt.Println("Имя:", matches[1])                // user
	fmt.Println("Домен:", matches[2])              // example.com

	// Именованные группы
	re := regexp.MustCompile(`(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})`)
	match := re.FindStringSubmatch("2024-03-15")
	for i, name := range re.SubexpNames() {
		if name != "" {
			fmt.Printf("%s = %s\n", name, match[i])
		}
	}
	// year = 2024, month = 03, day = 15

	// ReplaceAllStringFunc — замена с пользовательской функцией
	re2 := regexp.MustCompile(`\b[a-z]`)
	result := re2.ReplaceAllStringFunc("hello world foo", func(s string) string {
		return strings.ToUpper(s) // Первая буква каждого слова → заглавная
	})
	fmt.Println(result) // Hello World Foo

	// FindAll — все совпадения
	numRe := regexp.MustCompile(`\d+`)
	nums := numRe.FindAllString("port 8080 and port 3000", -1)
	fmt.Println(nums) // [8080 3000]
}
```

> [!NOTE] RE2 синтаксис
> Go использует RE2 — безопасный движок без backtracking. Это гарантирует линейное время выполнения, но не поддерживает lookahead/lookbehind (`(?=...)`, `(?!...)`).

### sort/slices (Go 1.21+)

```go
package main

import (
	"cmp"
	"fmt"
	"slices"
)

func main() {
	nums := []int{5, 3, 8, 1, 9, 2}

	// slices.Sort — сортировка для Ordered типов
	slices.Sort(nums)
	fmt.Println(nums) // [1 2 3 5 8 9]

	// slices.SortFunc — с кастомным компаратором
	type Person struct {
		Name string
		Age  int
	}
	people := []Person{
		{"Анна", 30},
		{"Борис", 25},
		{"Вика", 35},
	}
	slices.SortFunc(people, func(a, b Person) int {
		return cmp.Compare(a.Age, b.Age)
	})
	fmt.Println(people) // [{Борис 25} {Анна 30} {Вика 35}]

	// slices.Contains — проверка наличия
	fmt.Println(slices.Contains(nums, 5))  // true
	fmt.Println(slices.Contains(nums, 99)) // false

	// slices.BinarySearch — бинарный поиск (слайс должен быть отсортирован)
	idx, found := slices.BinarySearch(nums, 5)
	fmt.Printf("Индекс: %d, найдено: %v\n", idx, found)

	// slices.Compact — удаление дубликатов подряд (слайс должен быть отсортирован)
	dupes := []int{1, 1, 2, 2, 3, 3, 3}
	unique := slices.Compact(dupes)
	fmt.Println(unique) // [1 2 3]

	// slices.Min / slices.Max (Go 1.21+)
	fmt.Println(slices.Min(nums)) // 1
	fmt.Println(slices.Max(nums)) // 9

	// slices.Reverse
	slices.Reverse(nums)
	fmt.Println(nums) // [9 8 5 3 2 1]
}
```

### maps (Go 1.21+)

```go
package main

import (
	"fmt"
	"maps"
)

func main() {
	m := map[string]int{"Go": 1, "Rust": 2, "Python": 3}

	// maps.Keys — все ключи
	keys := maps.Keys(m) // возвращает iter.Seq[string]
	// Для получения слайса: slices.Collect(maps.Keys(m))

	// maps.Values — все значения
	values := maps.Values(m) // iter.Seq[int]

	// maps.Clone — поверхностная копия
	clone := maps.Clone(m)
	clone["Java"] = 4
	fmt.Println("Оригинал:", m)    // без Java
	fmt.Println("Копия:", clone)   // с Java

	// maps.Equal — сравнение
	m2 := map[string]int{"Go": 1, "Rust": 2, "Python": 3}
	fmt.Println(maps.Equal(m, m2)) // true

	// maps.DeleteFunc — удаление по условию
	maps.DeleteFunc(clone, func(k string, v int) bool {
		return v > 2 // Удаляем элементы со значением > 2
	})
	fmt.Println(clone) // map[Go:1 Rust:2]
}
```

### crypto: хеширование, HMAC, bcrypt

```go
package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// SHA-256 хеширование
	data := "секретные данные"
	hash := sha256.Sum256([]byte(data))
	fmt.Println("SHA-256:", hex.EncodeToString(hash[:]))

	// HMAC — Hash-based Message Authentication Code
	key := []byte("super-secret-key")
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte("сообщение для подписи"))
	signature := mac.Sum(nil)
	fmt.Println("HMAC:", hex.EncodeToString(signature))

	// Проверка HMAC
	mac2 := hmac.New(sha256.New, key)
	mac2.Write([]byte("сообщение для подписи"))
	expected := mac2.Sum(nil)
	fmt.Println("HMAC валиден:", hmac.Equal(signature, expected))

	// bcrypt — хеширование паролей (из golang.org/x/crypto)
	password := "myP@ssw0rd"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	fmt.Println("bcrypt:", string(hashed))

	// Проверка пароля
	err := bcrypt.CompareHashAndPassword(hashed, []byte(password))
	fmt.Println("Пароль верный:", err == nil) // true

	err = bcrypt.CompareHashAndPassword(hashed, []byte("wrong"))
	fmt.Println("Неверный пароль:", err != nil) // true

	// Генерация криптографически стойкого токена
	token := make([]byte, 32)
	rand.Read(token)
	fmt.Println("Токен:", hex.EncodeToString(token))
}
```

### html/template: безопасные шаблоны

```go
package main

import (
	"html/template"
	"os"
)

// FuncMap позволяет добавлять кастомные функции в шаблоны
var funcMap = template.FuncMap{
	"upper": strings.ToUpper,
	"add":   func(a, b int) int { return a + b },
}

// Композиция шаблонов
const baseTemplate = `
{{define "base"}}
<!DOCTYPE html>
<html>
<head><title>{{template "title" .}}</title></head>
<body>
  <nav>Навигация</nav>
  {{template "content" .}}
  <footer>Подвал</footer>
</body>
</html>
{{end}}`

const pageTemplate = `
{{define "title"}}{{.Title}}{{end}}
{{define "content"}}
<h1>{{.Title | upper}}</h1>
<p>Привет, {{.Name}}!</p>
<p>Итого: {{add .Price .Tax}} руб.</p>
{{end}}`

func main() {
	// html/template автоматически экранирует HTML
	// Это защищает от XSS-атак
	tmpl := template.Must(
		template.New("base").Funcs(funcMap).Parse(baseTemplate),
	)
	template.Must(tmpl.Parse(pageTemplate))

	data := struct {
		Title string
		Name  string
		Price int
		Tax   int
	}{
		Title: "Каталог",
		Name:  "<script>alert('xss')</script>", // Будет экранировано!
		Price: 100,
		Tax:   20,
	}

	tmpl.ExecuteTemplate(os.Stdout, "base", data)
}
```

### sync.OnceFunc / OnceValue / OnceValues (Go 1.21)

```go
package main

import (
	"fmt"
	"sync"
)

// sync.OnceFunc — выполняет функцию ровно один раз
var initialize = sync.OnceFunc(func() {
	fmt.Println("Инициализация выполнена (один раз)")
})

// sync.OnceValue — выполняет функцию один раз и кеширует результат
var getConfig = sync.OnceValue(func() map[string]string {
	fmt.Println("Загрузка конфигурации...")
	return map[string]string{
		"host": "localhost",
		"port": "8080",
	}
})

// sync.OnceValues — то же, но возвращает два значения (результат + error)
var connectDB = sync.OnceValues(func() (*sql.DB, error) {
	fmt.Println("Подключение к БД...")
	return sql.Open("postgres", "...")
})

func main() {
	// Вызываем несколько раз — выполняется только первый раз
	initialize()
	initialize() // Ничего не происходит
	initialize() // Ничего не происходит

	// Каждый вызов возвращает закешированное значение
	cfg := getConfig()
	fmt.Println(cfg["host"]) // localhost

	cfg2 := getConfig() // Повторный вызов — без повторной загрузки
	fmt.Println(cfg2["port"]) // 8080
}
```

### context: продвинутые возможности (Go 1.21+)

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// context.WithoutCancel (Go 1.21) — создаёт контекст,
	// который НЕ отменяется при отмене родительского
	parent, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	// Дочерний контекст не будет отменён при отмене parent
	// Полезно для фоновых задач, которые должны завершиться
	independent := context.WithoutCancel(parent)

	cancel() // Отменяем parent

	fmt.Println("Parent cancelled:", parent.Err() != nil) // true
	fmt.Println("Independent cancelled:", independent.Err() != nil) // false

	// context.AfterFunc (Go 1.21) — вызывает функцию после отмены контекста
	ctx, cancel2 := context.WithCancel(context.Background())

	context.AfterFunc(ctx, func() {
		fmt.Println("Контекст отменён — запускаем cleanup")
	})

	cancel2() // Вызовет AfterFunc
	time.Sleep(10 * time.Millisecond) // Ждём выполнения
}
```

###### 🏠 Домашнее задание

1. Напишите HTTP-обработчик, который рендерит шаблон со списком товаров, используя `html/template` с `FuncMap` для форматирования цены.
2. Реализуйте кеш конфигурации через `sync.OnceValues` с автоматической перезагрузкой при ошибке.
3. Напишите утилиту для парсинга логов с помощью `regexp`: извлеките timestamp, level, message из строки формата `[2024-03-15 14:30:45] ERROR: connection refused`.
4. Используйте `context.AfterFunc` для реализации graceful shutdown HTTP-сервера.

---

## 11. Go внутренности

Понимание внутреннего устройства Go помогает писать более эффективный код и лучше отлаживать проблемы.

### Фазы компиляции

```
Исходный код (.go)
       │
       ▼
┌──────────────┐
│    Lexer     │  Разбиение на токены (keywords, identifiers, literals)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Parser    │  Построение AST (Abstract Syntax Tree)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Type Checker │  Проверка типов, вывод типов, разрешение имён
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  SSA Build   │  Static Single Assignment — промежуточное представление
└──────┬───────┘  (каждая переменная присваивается ровно один раз)
       │
       ▼
┌──────────────┐
│ Optimizations│  Escape analysis, inlining, dead code elimination,
└──────┬───────┘  bounds check elimination, constant folding
       │
       ▼
┌──────────────┐
│ Code Gen     │  Генерация машинного кода для целевой платформы
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Linker     │  Компоновка в единый бинарный файл
└──────────────┘
```

```go
// Посмотреть AST:
// go build -gcflags="-W" main.go

// Посмотреть SSA:
// GOSSAFUNC=main go build main.go
// (Создаёт ssa.html — визуализация всех фаз SSA)

// Посмотреть ассемблер:
// go build -gcflags="-S" main.go
// или: go tool compile -S main.go
```

### Memory Model

Go Memory Model определяет, когда чтение переменной в одной горутине гарантированно видит значение, записанное другой горутиной.

```go
// Гарантии happens-before:
//
// 1. Операции с каналами:
//    - Отправка в канал happens-before получение из канала
//    - Закрытие канала happens-before получение zero value из закрытого канала
//    ch <- v  happens-before  v = <-ch

// 2. sync.Mutex:
//    - Unlock() happens-before следующий Lock() на том же мьютексе
//    mu.Unlock()  happens-before  mu.Lock() (другая горутина)

// 3. sync.Once:
//    - Функция в once.Do(f) happens-before возврат из any once.Do()

// 4. sync.WaitGroup:
//    - wg.Done() happens-before wg.Wait() возвращает

// 5. Инициализация:
//    - init() пакета A happens-before вызовы из пакета, импортирующего A

// БЕЗ СИНХРОНИЗАЦИИ нет гарантий порядка!
// Пример гонки данных:
var x int

go func() { x = 1 }()    // горутина 1
go func() { fmt.Println(x) }() // горутина 2
// Горутина 2 может увидеть 0 ИЛИ 1 — это data race

// Всегда используйте каналы, мьютексы или atomic для межгорутинного доступа
// Подробнее о конкурентности — [[05-concurrency]]
```

### GC подробности

```go
// Tri-color mark-and-sweep:
//
// 1. Все объекты начинаются как белые (not visited)
// 2. Корневые объекты (стек, глобальные переменные) помечаются серыми
// 3. Пока есть серые объекты:
//    a. Берём серый объект
//    b. Помечаем все объекты, на которые он ссылается, серыми
//    c. Помечаем сам объект чёрным
// 4. Все оставшиеся белые объекты — мусор
//
// Write barrier:
// Когда приложение создаёт новую ссылку (черный → белый),
// write barrier перекрашивает белый объект в серый,
// предотвращая его преждевременное удаление.
//
// Отладка GC:
// GODEBUG=gctrace=1 go run main.go
//
// Формат вывода gctrace:
// gc 1 @0.123s 2%: 0.045+1.234+0.034 ms clock, 0.180+0.456/1.100/0.023+0.136 ms cpu, 4->5->1 MB, 5 MB goal, 4 P
//
// Расшифровка:
// gc 1          — номер цикла GC
// @0.123s       — время с начала программы
// 2%            — процент CPU, потраченный на GC
// 4->5->1 MB    — размер кучи: до маркировки -> после маркировки -> живые объекты
// 5 MB goal     — целевой размер кучи
// 4 P           — количество используемых процессоров
```

### Стеки горутин: подробности

```go
// Начальный размер стека горутины: 2KB (с Go 1.4)
// (ранее было 8KB, ещё раньше — сегментированные стеки)
//
// Рост стека:
// 1. Каждая функция проверяет, достаточно ли места на стеке (stack check)
// 2. Если нет — вызывается runtime.morestack
// 3. Выделяется новый стек в 2 раза больше
// 4. Старый стек полностью копируется в новый
// 5. Все указатели на стековые данные обновляются (stack map)
// 6. Старый стек освобождается
//
// Сжатие стека:
// Во время GC, если стек использует меньше 1/4 своего размера,
// он копируется в стек меньшего размера
//
// Максимальный размер стека: 1GB (настраивается через runtime.SetMaxStack)
//
// Это позволяет запускать сотни тысяч горутин:
// 100 000 горутин × 2KB = 200MB (начальное потребление)
// vs
// 100 000 потоков × 1MB = 100GB (невозможно)
```

###### 🏠 Домашнее задание

1. Запустите `GOSSAFUNC=main go build main.go` на простой программе и изучите SSA-представление в ssa.html.
2. Запустите `GODEBUG=gctrace=1` на программе с высокими аллокациями и проанализируйте вывод GC.
3. Напишите программу, которая определяет размер стека горутины с помощью `runtime.Stack` при разных уровнях рекурсии.

---

## 12. Экосистема Go

Обзор основных библиотек Go-экосистемы, организованных по категориям. Используйте эту секцию как справочник при выборе инструментов для проекта.

### Web-фреймворки

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **net/http** (std) | Стандартная библиотека, Go 1.22+ с routing | Простые API, микросервисы |
| **gin** | Самый популярный, быстрый router | Когда нужна скорость и middleware |
| **echo** | Минималистичный, хорошая документация | REST API с удобным binding |
| **chi** | Совместим с net/http, композиция middleware | Когда важна совместимость со std |
| **fiber** | Fasthttp-based, Express-like API | Максимальная производительность |

Подробнее о HTTP-фреймворках — [[03-networking]].

### ORM и работа с БД

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **database/sql** (std) | Стандартный интерфейс | Простые запросы, полный контроль |
| **sqlx** | Расширение database/sql | Named params, StructScan |
| **pgx** | Нативный PostgreSQL драйвер | PostgreSQL-specific фичи |
| **sqlc** | Кодогенерация из SQL | Типобезопасные запросы |
| **gorm** | Full ORM | Rapid prototyping, CRUD |
| **ent** | Entity framework (Facebook) | Граф-ориентированные модели |

Подробнее о работе с БД — [[04-databases]].

### Логирование

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **log/slog** (std, Go 1.21+) | Структурированное логирование | Новые проекты, стандарт |
| **zerolog** | Zero-allocation JSON logger | Высоконагруженные сервисы |
| **zap** (Uber) | Быстрый структурированный логгер | Enterprise, высокая нагрузка |

### Тестирование

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **testing** (std) | Стандартный пакет тестирования | Всегда (базовый уровень) |
| **testify** | Assert/Require/Mock/Suite | Удобные утверждения и моки |
| **gomock** | Кодогенерация моков из интерфейсов | Строгое мокирование |
| **testcontainers-go** | Docker-контейнеры для тестов | Интеграционные тесты с БД |

Подробнее о тестировании — [[07-testing]].

### CLI

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **cobra** | Мощный CLI-фреймворк | Сложные CLI с подкомандами |
| **urfave/cli** | Простой CLI-фреймворк | Простые CLI-приложения |

### Конфигурация

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **viper** | Конфигурация из файлов/ENV/flags | Сложная конфигурация |
| **caarlos0/env** | Конфигурация из ENV | Микросервисы, 12-factor |
| **koanf** | Лёгкая альтернатива viper | Когда viper слишком тяжёлый |

### Валидация

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **go-playground/validator** | Tag-based валидация структур | REST API, form validation |

### Message Brokers

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **kafka-go** (segmentio) | Kafka клиент | Event streaming |
| **nats.go** | NATS клиент | Лёгкий messaging |
| **amqp091-go** | RabbitMQ клиент | Классический message broker |

### Observability

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **opentelemetry-go** | Traces, metrics, logs | Distributed tracing |
| **prometheus client** | Метрики для Prometheus | Мониторинг, алерты |

### gRPC

| Библиотека | Описание | Когда использовать |
|---|---|---|
| **grpc-go** | Официальный gRPC для Go | Межсервисная коммуникация |
| **buf** | Линтер/генератор для protobuf | Управление proto-файлами |

Подробнее о микросервисной архитектуре — [[06-microservices]].

###### 🏠 Домашнее задание

1. Создайте новый проект и подключите slog с JSON-обработчиком. Настройте уровни логирования через переменные окружения.
2. Напишите CLI-утилиту на cobra с подкомандами `serve` (запуск HTTP-сервера) и `migrate` (миграции БД).
3. Подключите go-playground/validator и реализуйте валидацию для 5 разных структур запросов.

---

## 13. Сквозной проект: Todo-приложение с дженериками и чистой архитектурой

Применим знания из этой главы к рефакторингу Todo-проекта, который мы развивали на протяжении курса. Объединяем дженерики, чистую архитектуру, functional options и DDD.

### Структура проекта

```
todo-service/
├── cmd/
│   └── api/
│       └── main.go                  # Точка входа, сборка зависимостей
├── internal/
│   ├── domain/
│   │   ├── todo.go                  # Сущность Todo
│   │   ├── repository.go           # Generic Repository[T] интерфейс
│   │   └── errors.go               # Доменные ошибки
│   ├── usecase/
│   │   └── todo_service.go         # Бизнес-логика
│   ├── adapter/
│   │   ├── repository/
│   │   │   ├── memory/
│   │   │   │   └── generic_repo.go # In-memory реализация Repository[T]
│   │   │   └── postgres/
│   │   │       └── todo_repo.go    # PostgreSQL реализация
│   │   └── handler/
│   │       └── http/
│   │           ├── todo_handler.go
│   │           └── server.go       # Сервер с functional options
│   └── infrastructure/
│       └── config/
│           └── config.go
├── go.mod
└── go.sum
```

### Domain: Entity и Generic Repository

```go
// internal/domain/todo.go
package domain

import (
	"errors"
	"time"
)

type TodoStatus string

const (
	TodoStatusPending    TodoStatus = "pending"
	TodoStatusInProgress TodoStatus = "in_progress"
	TodoStatusDone       TodoStatus = "done"
)

// Todo — доменная сущность
type Todo struct {
	ID          string
	Title       string
	Description string
	Status      TodoStatus
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewTodo(id, title, description string) (*Todo, error) {
	if title == "" {
		return nil, errors.New("заголовок не может быть пустым")
	}

	now := time.Now()
	return &Todo{
		ID:          id,
		Title:       title,
		Description: description,
		Status:      TodoStatusPending,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// GetID реализует интерфейс Entity
func (t *Todo) GetID() string { return t.ID }

// MarkInProgress переводит задачу в статус "в работе"
func (t *Todo) MarkInProgress() error {
	if t.Status != TodoStatusPending {
		return errors.New("можно начать только задачу в статусе pending")
	}
	t.Status = TodoStatusInProgress
	t.UpdatedAt = time.Now()
	return nil
}

// MarkDone переводит задачу в статус "готово"
func (t *Todo) MarkDone() error {
	if t.Status == TodoStatusDone {
		return errors.New("задача уже завершена")
	}
	t.Status = TodoStatusDone
	t.UpdatedAt = time.Now()
	return nil
}
```

```go
// internal/domain/repository.go
package domain

import "context"

// Entity — ограничение для доменных сущностей
type Entity interface {
	GetID() string
}

// Repository — дженерик-интерфейс репозитория
type Repository[T Entity] interface {
	GetByID(ctx context.Context, id string) (T, error)
	GetAll(ctx context.Context) ([]T, error)
	Create(ctx context.Context, entity T) error
	Update(ctx context.Context, entity T) error
	Delete(ctx context.Context, id string) error
}

// TodoRepository — специфичный интерфейс с дополнительными методами
type TodoRepository interface {
	Repository[*Todo]
	GetByStatus(ctx context.Context, status TodoStatus) ([]*Todo, error)
}
```

```go
// internal/domain/errors.go
package domain

import "errors"

var (
	ErrNotFound      = errors.New("сущность не найдена")
	ErrAlreadyExists = errors.New("сущность уже существует")
	ErrValidation    = errors.New("ошибка валидации")
)
```

### Adapter: In-Memory Generic Repository

```go
// internal/adapter/repository/memory/generic_repo.go
package memory

import (
	"context"
	"fmt"
	"sync"

	"todo-service/internal/domain"
)

// GenericRepo — универсальная in-memory реализация Repository[T]
type GenericRepo[T domain.Entity] struct {
	mu   sync.RWMutex
	data map[string]T
}

func NewGenericRepo[T domain.Entity]() *GenericRepo[T] {
	return &GenericRepo[T]{
		data: make(map[string]T),
	}
}

func (r *GenericRepo[T]) GetByID(_ context.Context, id string) (T, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	entity, ok := r.data[id]
	if !ok {
		var zero T
		return zero, fmt.Errorf("%w: id=%s", domain.ErrNotFound, id)
	}
	return entity, nil
}

func (r *GenericRepo[T]) GetAll(_ context.Context) ([]T, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]T, 0, len(r.data))
	for _, entity := range r.data {
		result = append(result, entity)
	}
	return result, nil
}

func (r *GenericRepo[T]) Create(_ context.Context, entity T) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	id := entity.GetID()
	if _, exists := r.data[id]; exists {
		return fmt.Errorf("%w: id=%s", domain.ErrAlreadyExists, id)
	}
	r.data[id] = entity
	return nil
}

func (r *GenericRepo[T]) Update(_ context.Context, entity T) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	id := entity.GetID()
	if _, exists := r.data[id]; !exists {
		return fmt.Errorf("%w: id=%s", domain.ErrNotFound, id)
	}
	r.data[id] = entity
	return nil
}

func (r *GenericRepo[T]) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.data[id]; !exists {
		return fmt.Errorf("%w: id=%s", domain.ErrNotFound, id)
	}
	delete(r.data, id)
	return nil
}
```

```go
// In-memory TodoRepository с дополнительным методом GetByStatus
package memory

import (
	"context"

	"todo-service/internal/domain"
)

type TodoRepo struct {
	*GenericRepo[*domain.Todo]
}

func NewTodoRepo() *TodoRepo {
	return &TodoRepo{
		GenericRepo: NewGenericRepo[*domain.Todo](),
	}
}

func (r *TodoRepo) GetByStatus(_ context.Context, status domain.TodoStatus) ([]*domain.Todo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.Todo
	for _, todo := range r.data {
		if todo.Status == status {
			result = append(result, todo)
		}
	}
	return result, nil
}
```

### Usecase: бизнес-логика

```go
// internal/usecase/todo_service.go
package usecase

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"todo-service/internal/domain"
)

type TodoService struct {
	repo domain.TodoRepository
}

func NewTodoService(repo domain.TodoRepository) *TodoService {
	return &TodoService{repo: repo}
}

func (s *TodoService) Create(ctx context.Context, title, description string) (*domain.Todo, error) {
	id := uuid.New().String()
	todo, err := domain.NewTodo(id, title, description)
	if err != nil {
		return nil, fmt.Errorf("создание todo: %w", err)
	}

	if err := s.repo.Create(ctx, todo); err != nil {
		return nil, fmt.Errorf("сохранение todo: %w", err)
	}

	return todo, nil
}

func (s *TodoService) GetByID(ctx context.Context, id string) (*domain.Todo, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TodoService) GetAll(ctx context.Context) ([]*domain.Todo, error) {
	return s.repo.GetAll(ctx)
}

func (s *TodoService) MarkDone(ctx context.Context, id string) error {
	todo, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := todo.MarkDone(); err != nil {
		return fmt.Errorf("смена статуса: %w", err)
	}

	return s.repo.Update(ctx, todo)
}

func (s *TodoService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *TodoService) GetByStatus(ctx context.Context, status domain.TodoStatus) ([]*domain.Todo, error) {
	return s.repo.GetByStatus(ctx, status)
}
```

### Adapter: HTTP-сервер с Functional Options

```go
// internal/adapter/handler/http/server.go
package http

import (
	"log/slog"
	"net/http"
	"time"
)

// Server — HTTP-сервер с настройками через Functional Options
type Server struct {
	host         string
	port         string
	readTimeout  time.Duration
	writeTimeout time.Duration
	logger       *slog.Logger
	mux          *http.ServeMux
}

type ServerOption func(*Server)

func WithHost(host string) ServerOption {
	return func(s *Server) { s.host = host }
}

func WithPort(port string) ServerOption {
	return func(s *Server) { s.port = port }
}

func WithReadTimeout(d time.Duration) ServerOption {
	return func(s *Server) { s.readTimeout = d }
}

func WithWriteTimeout(d time.Duration) ServerOption {
	return func(s *Server) { s.writeTimeout = d }
}

func WithLogger(l *slog.Logger) ServerOption {
	return func(s *Server) { s.logger = l }
}

func NewServer(opts ...ServerOption) *Server {
	s := &Server{
		host:         "0.0.0.0",
		port:         "8080",
		readTimeout:  15 * time.Second,
		writeTimeout: 15 * time.Second,
		logger:       slog.Default(),
		mux:          http.NewServeMux(),
	}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

func (s *Server) RegisterRoutes(todoHandler *TodoHandler) {
	s.mux.HandleFunc("GET /todos", todoHandler.GetAll)
	s.mux.HandleFunc("POST /todos", todoHandler.Create)
	s.mux.HandleFunc("GET /todos/{id}", todoHandler.GetByID)
	s.mux.HandleFunc("PATCH /todos/{id}/done", todoHandler.MarkDone)
	s.mux.HandleFunc("DELETE /todos/{id}", todoHandler.Delete)
}

func (s *Server) Run() error {
	addr := s.host + ":" + s.port
	s.logger.Info("Запуск сервера", "addr", addr)

	srv := &http.Server{
		Addr:         addr,
		Handler:      s.mux,
		ReadTimeout:  s.readTimeout,
		WriteTimeout: s.writeTimeout,
	}

	return srv.ListenAndServe()
}
```

### Точка входа: сборка зависимостей

```go
// cmd/api/main.go
package main

import (
	"log"
	"log/slog"
	"os"
	"time"

	memoryRepo "todo-service/internal/adapter/repository/memory"
	httpAdapter "todo-service/internal/adapter/handler/http"
	"todo-service/internal/usecase"
)

func main() {
	// Настройка логирования
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// 1. Adapter: репозиторий (in-memory для демонстрации)
	todoRepo := memoryRepo.NewTodoRepo()

	// 2. Usecase: бизнес-логика
	todoService := usecase.NewTodoService(todoRepo)

	// 3. Adapter: HTTP-обработчик
	todoHandler := httpAdapter.NewTodoHandler(todoService)

	// 4. Сервер с functional options
	server := httpAdapter.NewServer(
		httpAdapter.WithHost("0.0.0.0"),
		httpAdapter.WithPort("8080"),
		httpAdapter.WithReadTimeout(30*time.Second),
		httpAdapter.WithWriteTimeout(30*time.Second),
		httpAdapter.WithLogger(logger),
	)

	// 5. Регистрация маршрутов
	server.RegisterRoutes(todoHandler)

	// 6. Запуск
	logger.Info("Todo-сервис запущен")
	if err := server.Run(); err != nil {
		log.Fatal("Ошибка запуска:", err)
	}
}

// Зависимости:
// main.go
//   └─ memoryRepo.NewTodoRepo()    → domain.TodoRepository
//   └─ usecase.NewTodoService(repo) → usecase.TodoService
//   └─ httpAdapter.NewTodoHandler(svc)
//   └─ httpAdapter.NewServer(opts...)
//
// Чтобы переключиться на PostgreSQL — заменяем ОДНУ строку:
// todoRepo := postgresRepo.NewTodoRepo(db)
// Остальной код не меняется.
```

> [!summary] Итог: что мы применили в сквозном проекте
> - **Чистая архитектура**: domain → usecase → adapter → infrastructure
> - **DDD**: Entity (Todo), Value Objects (TodoStatus), Repository pattern
> - **Generics**: `Repository[T Entity]`, `GenericRepo[T]` — переиспользуемый in-memory репозиторий
> - **Functional Options**: конфигурация HTTP-сервера через `WithHost`, `WithPort`, etc.
> - **Dependency Injection**: ручная сборка в `main.go`
> - **Идиоматический Go**: интерфейсы для абстракций, конструкторы `NewXxx`, обработка ошибок

###### 🏠 Домашнее задание

1. Добавьте PostgreSQL-реализацию `TodoRepository` с использованием `pgx`. Подключите через переменную окружения `DATABASE_URL`.
2. Напишите полный набор unit-тестов для `TodoService`, мокая `TodoRepository` (используйте in-memory реализацию или gomock).
3. Добавьте middleware: logging, recovery, request-id. Используйте паттерн Middleware/Decorator.
4. Реализуйте пагинацию и фильтрацию: `GET /todos?status=pending&page=1&limit=10`. Добавьте метод `List(ctx, filter Filter) (Page[Todo], error)` в репозиторий с дженерик-типом `Page[T]`.
5. Добавьте graceful shutdown с `context.AfterFunc` и `signal.NotifyContext`.

---

> [!summary] Заключение главы
> Эта глава завершает курс по Go. Мы рассмотрели:
> - **Рефлексия** — мощный, но медленный механизм для runtime-инспекции типов
> - **Дженерики** — типобезопасное обобщённое программирование без рефлексии
> - **Итераторы (Go 1.23)** — ленивые последовательности через `range` по функциям
> - **Unsafe и CGO** — низкоуровневые инструменты для особых случаев
> - **Оптимизация** — escape analysis, аллокации, GC, бенчмарки
> - **Паттерны** — Functional Options, Builder, Strategy, Observer, Middleware, Factory
> - **Чистая архитектура** — слои, зависимости, DI
> - **DDD** — Value Objects, Entities, Aggregates, Domain Events
> - **Стандартная библиотека** — продвинутые возможности time, regexp, slices, maps, crypto, sync
> - **Внутренности Go** — компиляция, memory model, GC, стеки
> - **Экосистема** — библиотеки для web, DB, logging, testing, CLI, messaging
>
> Ключевой принцип Go: **простота**. Используйте продвинутые инструменты только когда простые не справляются. Начинайте с конкретного кода, обобщайте по мере необходимости. Читаемость важнее лаконичности.
