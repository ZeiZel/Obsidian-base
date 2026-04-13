---
tags:
  - backend
  - golang
  - go
  - concurrency
  - goroutines
  - channels
---

# Горутины и конкурентность

Конкурентность - одна из ключевых причин популярности Go. В отличие от большинства языков, где конкурентность добавлена через библиотеки или фреймворки, в Go она встроена в сам язык. Горутины, каналы и оператор `select` - примитивы первого класса, которые делают написание конкурентного кода естественным. Эта глава охватывает всё от базовых горутин до продвинутых паттернов, применяемых в production-системах.

> [!summary] Что вы изучите в этой главе
> - Разницу между конкурентностью и параллелизмом
> - Горутины и внутреннее устройство планировщика Go (GMP модель)
> - Каналы: буферизованные, небуферизованные, направленные
> - Оператор select для мультиплексирования каналов
> - Пакеты sync и sync/atomic
> - Паттерны: Worker Pool, Fan-out/Fan-in, Pipeline, Semaphore, Rate Limiter, Circuit Breaker
> - Пакет context для управления жизненным циклом горутин
> - errgroup и singleflight
> - Модель памяти Go и профилирование

Связанные заметки: [[01-basics]], [[Golang]], [[03-networking]], [[04-databases]]

---

## 1. Конкурентность vs параллелизм

Роб Пайк в своём знаменитом докладе "Concurrency is not Parallelism" чётко разделил эти понятия:

> [!NOTE] Определения
> **Конкурентность (Concurrency)** — это *структура* программы. Способ организации кода, при котором несколько задач могут находиться в процессе выполнения одновременно, но не обязательно исполняются параллельно.
>
> **Параллелизм (Parallelism)** — это *исполнение*. Физическое одновременное выполнение нескольких операций на разных ядрах процессора.

Аналогия Роба Пайка: представьте одного сусликов (gopher), который носит книги из одной кучи в другую. Это последовательное выполнение. Теперь представьте двух сусликов с двумя тележками - они работают параллельно. Но можно организовать работу и иначе: один суслик загружает книги в тележку, другой разгружает. Это конкурентная структура - задачи разделены, но могут выполняться и одним процессором.

```go
// Конкурентность: две задачи СТРУКТУРИРОВАНЫ для независимого выполнения
// Но на одном ядре они будут чередоваться, а не выполняться параллельно

package main

import (
	"fmt"
	"runtime"
)

func main() {
	// Ограничиваем количество потоков ОС одним — параллелизма нет,
	// но конкурентность остаётся: горутины по-прежнему чередуются
	runtime.GOMAXPROCS(1)

	go func() {
		for i := 0; i < 5; i++ {
			fmt.Println("Горутина A:", i)
		}
	}()

	go func() {
		for i := 0; i < 5; i++ {
			fmt.Println("Горутина B:", i)
		}
	}()

	// Без ожидания main завершится раньше горутин
	// (пока используем Sleep, позже узнаем о WaitGroup)
	select {}
}
```

Go намеренно делает конкурентность дешёвой. Создание горутины стоит ~2 КБ памяти на стек (который растёт по мере необходимости), тогда как создание потока ОС требует ~1 МБ стека и системного вызова. Это позволяет запускать сотни тысяч горутин в одном процессе.

> [!TIP] Подход Go к конкурентности
> "Don't communicate by sharing memory; share memory by communicating." — Go Proverb
>
> Вместо блокировок и разделяемой памяти (как в C++ или Java), Go предлагает передавать данные между горутинами через каналы. Это делает конкурентный код безопаснее и проще для понимания.

```go
// GOMAXPROCS управляет количеством потоков ОС,
// на которых исполняются горутины
package main

import (
	"fmt"
	"runtime"
)

func main() {
	// По умолчанию равен количеству логических ядер CPU
	fmt.Println("Количество ядер:", runtime.NumCPU())
	fmt.Println("GOMAXPROCS:", runtime.GOMAXPROCS(0)) // 0 = запросить текущее значение

	// Установить вручную (обычно не нужно)
	runtime.GOMAXPROCS(4)

	// Количество активных горутин
	fmt.Println("Горутин:", runtime.NumGoroutine())
}
```

###### 🏠 Домашнее задание

1. Напишите программу, которая запускает 3 горутины, каждая печатает числа от 1 до 10 с указанием своего номера. Запустите с `GOMAXPROCS(1)` и `GOMAXPROCS(4)` — сравните порядок вывода.
2. Используя `runtime.NumGoroutine()`, покажите, как количество горутин меняется при их запуске и завершении.
3. Прочитайте доклад Rob Pike "Concurrency is not Parallelism" и напишите своими словами 3 ключевых вывода.

---

## 2. Горутины

Горутина — это легковесный поток выполнения, управляемый runtime Go, а не операционной системой. Для запуска горутины используется ключевое слово `go` перед вызовом функции.

```go
package main

import (
	"fmt"
	"time"
)

// greet — обычная функция, которую мы запустим как горутину
func greet(name string) {
	for i := 0; i < 3; i++ {
		fmt.Printf("Привет, %s! (итерация %d)\n", name, i)
		time.Sleep(100 * time.Millisecond)
	}
}

func main() {
	// Запуск горутин — ключевое слово go перед вызовом функции
	go greet("Алиса")   // горутина 1
	go greet("Боб")     // горутина 2

	// Анонимная горутина
	go func() {
		fmt.Println("Анонимная горутина выполняется")
	}()

	// ВАЖНО: main() не ждёт завершения горутин!
	// Если main завершится, все горутины будут убиты
	time.Sleep(500 * time.Millisecond)
	fmt.Println("main завершается")
}
```

> [!WARNING] main не ждёт горутины
> Когда функция `main()` завершается, программа завершается целиком, убивая все запущенные горутины. Позже мы рассмотрим `sync.WaitGroup` и каналы для корректного ожидания.

### Сколько горутин можно запустить?

Горутины невероятно дешёвые. Начальный стек горутины — всего ~2 КБ (он автоматически растёт до максимума, по умолчанию 1 ГБ). Сравните: поток ОС обычно получает 1-8 МБ стека.

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	const numGoroutines = 100_000

	var wg sync.WaitGroup
	wg.Add(numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func(id int) {
			defer wg.Done()
			// Каждая горутина делает минимальную работу
			_ = id * id
		}(i)
	}

	wg.Wait()

	// Проверяем пиковое потребление памяти
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("Запущено горутин: %d\n", numGoroutines)
	fmt.Printf("Потребление памяти: %.2f МБ\n", float64(m.TotalAlloc)/1024/1024)
}
```

> [!INFO] Характеристики горутин
> | Характеристика | Горутина | Поток ОС |
> |---|---|---|
> | Начальный стек | ~2 КБ | ~1-8 МБ |
> | Создание | ~0.3 мкс | ~10-30 мкс |
> | Переключение контекста | ~0.2 мкс | ~1-10 мкс |
> | Управление | Go runtime | ОС |
> | Количество | сотни тысяч | тысячи |

###### 🏠 Домашнее задание

1. Запустите 1 миллион горутин и измерьте потребление памяти с помощью `runtime.MemStats`.
2. Напишите функцию, которая запускает N горутин, каждая из которых выполняет вычисление (например, сумму чисел до 1000). Измерьте время выполнения для N = 1, 100, 10000, 100000.
3. Объясните, почему этот код не выводит ничего, и исправьте его:
```go
func main() {
    go fmt.Println("Привет из горутины!")
}
```

---

## 3. GMP модель планировщика

Планировщик Go — один из ключевых компонентов runtime. Он управляет распределением горутин по потокам ОС, используя модель, известную как GMP.

> [!NOTE] Компоненты GMP
> - **G (Goroutine)** — горутина. Содержит стек, указатель инструкции, ссылку на канал, по которому заблокирована, и другие метаданные.
> - **M (Machine)** — поток ОС. Реальный поток, который исполняет код. M всегда привязан к одному P.
> - **P (Processor)** — логический процессор. Контекст выполнения, содержащий локальную очередь горутин. Количество P = GOMAXPROCS.

### ASCII-диаграмма планировщика

```
                     ┌─────────────────────────┐
                     │     Global Run Queue     │
                     │  ┌───┐ ┌───┐ ┌───┐      │
                     │  │ G │ │ G │ │ G │ ...   │
                     │  └───┘ └───┘ └───┘      │
                     └────────────┬────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
         ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
         │   P0    │        │   P1    │        │   P2    │
         │ ┌─────┐ │        │ ┌─────┐ │        │ ┌─────┐ │
         │ │Local│ │        │ │Local│ │        │ │Local│ │
         │ │Queue│ │        │ │Queue│ │        │ │Queue│ │
         │ │G G G│ │        │ │G G  │ │        │ │G    │ │
         │ └─────┘ │        │ └─────┘ │        │ └─────┘ │
         └────┬────┘        └────┬────┘        └────┬────┘
              │                   │                   │
         ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
         │   M0    │        │   M1    │        │   M2    │
         │ (thread)│        │ (thread)│        │ (thread)│
         └────┬────┘        └────┬────┘        └────┬────┘
              │                   │                   │
    ══════════╧═══════════════════╧═══════════════════╧════════
                        Ядра CPU (hardware)
```

### Как работает планировщик

```
Алгоритм выбора следующей горутины для M:

1. Проверить локальную очередь P (Local Run Queue)
   └── Есть G? → Взять и выполнить
2. Проверить глобальную очередь (Global Run Queue)
   └── Есть G? → Забрать пачку в локальную очередь
3. Проверить netpoller (готовые I/O операции)
   └── Есть готовые G? → Взять
4. Work Stealing: украсть половину G из очереди другого P
   └── Есть G у соседа? → Забрать половину
5. Если ничего нет → M паркуется (засыпает)
```

### Work Stealing

Когда локальная очередь P пуста, планировщик крадёт половину горутин из очереди другого P. Это обеспечивает балансировку нагрузки:

```
До work stealing:
  P0: [G1, G2, G3, G4, G5, G6]    P1: []

После work stealing:
  P0: [G1, G2, G3]                 P1: [G4, G5, G6]
```

### Вытесняющее планирование (Go 1.14+)

До Go 1.14 горутина, выполняющая tight loop без вызовов функций, могла монополизировать поток:

```go
// До Go 1.14 этот код блокировал M навсегда
// С Go 1.14 планировщик использует сигналы ОС (SIGURG)
// для вытеснения таких горутин
go func() {
	for {
		// tight loop без вызовов функций
		// до 1.14: никогда не отдаст управление
		// с 1.14: будет вытеснена через ~10мс
	}
}()
```

> [!INFO] Когда горутина отдаёт управление планировщику
> - **Операции с каналами** — отправка/получение из канала
> - **Системные вызовы** — файловый I/O, сетевые операции
> - **Вызовы функций** — при входе в функцию проверяется, нужен ли рост стека (stack check)
> - **runtime.Gosched()** — явная передача управления
> - **Блокировка на mutex** — sync.Mutex, sync.RWMutex
> - **time.Sleep** — горутина паркуется до срабатывания таймера
> - **Вытесняющий сигнал (Go 1.14+)** — SIGURG каждые ~10мс для tight loops

### Системные вызовы и M

Когда горутина выполняет блокирующий системный вызов (например, файловый I/O), поток M блокируется вместе с ней. Планировщик отсоединяет P от заблокированного M и привязывает к свободному (или создаёт новый M):

```
До syscall:           Во время syscall:         После syscall:
  P ─── M               P ─── M_new             P ─── M
  │                      │                       │
  G (работает)           G' (работает)           G (продолжает)
                         M_old ← заблокирован
                         │
                         G (ждёт syscall)
```

###### 🏠 Домашнее задание

1. Используя `runtime.GOMAXPROCS()`, `runtime.NumGoroutine()`, `runtime.NumCPU()` напишите программу, которая выводит информацию о текущем состоянии планировщика.
2. Запустите программу с `GODEBUG=schedtrace=1000` и проанализируйте вывод планировщика.
3. Напишите tight loop горутину и убедитесь, что она вытесняется (Go 1.14+), добавив `runtime.Gosched()` для версий до 1.14.

---

## 4. Каналы

Каналы — основной механизм коммуникации между горутинами в Go. Канал — это типизированный трубопровод, через который можно отправлять и получать значения.

### Небуферизованные каналы

Небуферизованный канал — это канал без буфера. Отправка блокирует горутину, пока другая горутина не прочитает значение, и наоборот. Это обеспечивает синхронный обмен данными.

```go
package main

import "fmt"

func main() {
	// Создание небуферизованного канала
	ch := make(chan string)

	// Горутина-отправитель
	go func() {
		fmt.Println("Отправитель: готовлю данные...")
		ch <- "Привет из горутины!" // блокируется до получения
		fmt.Println("Отправитель: данные отправлены")
	}()

	// Получатель в main (блокируется до отправки)
	msg := <-ch
	fmt.Println("Получатель:", msg)
}
```

```
Визуализация небуферизованного канала:

Горутина A                   Канал                   Горутина B
    │                          │                          │
    ├─── ch <- value ──────►   │   (A блокируется)        │
    │                          │                          │
    │                          │   ◄────── val := <-ch ───┤
    │                          │          (B получает)     │
    ├─── (A разблокирована) ◄──┤                          │
    │                          │                          │
```

### Буферизованные каналы

Буферизованный канал имеет внутренний буфер. Отправка блокируется только когда буфер полон. Получение блокируется только когда буфер пуст.

```go
package main

import "fmt"

func main() {
	// Буферизованный канал на 3 элемента
	ch := make(chan int, 3)

	// Можно отправить 3 значения без блокировки
	ch <- 10 // буфер: [10]
	ch <- 20 // буфер: [10, 20]
	ch <- 30 // буфер: [10, 20, 30]

	// ch <- 40 // ЗАБЛОКИРУЕТСЯ! Буфер полон

	// Чтение из буфера — FIFO порядок
	fmt.Println(<-ch) // 10, буфер: [20, 30]
	fmt.Println(<-ch) // 20, буфер: [30]
	fmt.Println(<-ch) // 30, буфер: []

	// <-ch // ЗАБЛОКИРУЕТСЯ! Буфер пуст

	// Длина и ёмкость канала
	ch <- 42
	fmt.Println("Длина:", len(ch))  // 1 — текущее количество элементов
	fmt.Println("Ёмкость:", cap(ch)) // 3 — размер буфера
}
```

> [!TIP] Когда использовать буферизованные каналы
> - **Небуферизованные** — когда нужна синхронизация (гарантия, что отправитель дождётся получателя)
> - **Буферизованные** — когда отправитель не должен ждать получателя (асинхронный режим), или для ограничения конкурентности (семафор)

### Направленные каналы

В сигнатурах функций можно указывать направление канала — только для отправки или только для получения:

```go
package main

import "fmt"

// producer принимает канал только для отправки
func producer(ch chan<- int) {
	for i := 0; i < 5; i++ {
		ch <- i * i
	}
	close(ch) // закрываем канал, когда данные закончились
}

// consumer принимает канал только для чтения
func consumer(ch <-chan int) {
	for val := range ch { // range читает до закрытия канала
		fmt.Println("Получено:", val)
	}
}

func main() {
	ch := make(chan int) // двунаправленный канал

	// Go автоматически преобразует двунаправленный канал
	// в однонаправленный при передаче в функцию
	go producer(ch) // chan int → chan<- int
	consumer(ch)    // chan int → <-chan int
}
```

### Закрытие каналов

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 5)

	// Отправляем данные
	ch <- 1
	ch <- 2
	ch <- 3

	// Закрываем канал — больше отправлять нельзя
	close(ch)

	// ch <- 4 // PANIC: send on closed channel

	// Чтение из закрытого канала возвращает zero value
	fmt.Println(<-ch) // 1 (из буфера)
	fmt.Println(<-ch) // 2 (из буфера)
	fmt.Println(<-ch) // 3 (из буфера)
	fmt.Println(<-ch) // 0 (канал закрыт, буфер пуст)
	fmt.Println(<-ch) // 0 (повторное чтение — снова zero value)

	// Comma-ok идиома — проверяем, открыт ли канал
	ch2 := make(chan string, 1)
	ch2 <- "данные"
	close(ch2)

	val, ok := <-ch2
	fmt.Println(val, ok) // "данные" true

	val, ok = <-ch2
	fmt.Println(val, ok) // "" false — канал закрыт и пуст
}
```

> [!WARNING] Правила закрытия каналов
> - Закрывать канал должен **только отправитель**, никогда получатель
> - Закрытие уже закрытого канала вызывает **panic**
> - Отправка в закрытый канал вызывает **panic**
> - Чтение из закрытого канала возвращает zero value (используйте comma-ok для проверки)

### Range по каналу

```go
package main

import "fmt"

func fibonacci(n int, ch chan<- int) {
	a, b := 0, 1
	for i := 0; i < n; i++ {
		ch <- a
		a, b = b, a+b
	}
	close(ch) // ОБЯЗАТЕЛЬНО закрыть, иначе range заблокируется навсегда
}

func main() {
	ch := make(chan int)
	go fibonacci(10, ch)

	// range автоматически читает до закрытия канала
	for num := range ch {
		fmt.Print(num, " ")
	}
	// Вывод: 0 1 1 2 3 5 8 13 21 34
}
```

### nil канал

Чтение или запись в nil канал блокирует горутину навсегда. Это полезно в `select` для отключения ветвей:

```go
package main

import "fmt"

func main() {
	var ch chan int // nil канал

	// Это заблокирует навсегда (deadlock если нет других горутин):
	// ch <- 1    // блокировка навсегда
	// <-ch       // блокировка навсегда

	// Полезное применение — отключение case в select
	a := make(chan int, 1)
	a <- 42

	var b chan int // nil — этот case никогда не выполнится

	select {
	case val := <-a:
		fmt.Println("Из a:", val) // всегда выберется этот case
	case val := <-b:
		fmt.Println("Из b:", val) // никогда — b == nil
	}
}
```

###### 🏠 Домашнее задание

1. Реализуйте пинг-понг между двумя горутинами через небуферизованный канал. Горутины обмениваются сообщениями 10 раз.
2. Создайте генератор простых чисел через канал: горутина отправляет простые числа, main читает первые 20.
3. Напишите функцию `merge`, которая принимает два канала `<-chan int` и возвращает один канал, объединяющий значения из обоих.
4. Объясните разницу между `ch := make(chan int)` и `ch := make(chan int, 1)` — приведите пример, где они ведут себя по-разному.

---

## 5. Select

Оператор `select` позволяет горутине ожидать несколько операций с каналами одновременно. Он похож на `switch`, но каждый `case` — это операция отправки или получения через канал.

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch1 := make(chan string)
	ch2 := make(chan string)

	// Горутина, отвечающая через 1 секунду
	go func() {
		time.Sleep(1 * time.Second)
		ch1 <- "Ответ от сервиса A"
	}()

	// Горутина, отвечающая через 2 секунды
	go func() {
		time.Sleep(2 * time.Second)
		ch2 <- "Ответ от сервиса B"
	}()

	// select ждёт первый готовый канал
	for i := 0; i < 2; i++ {
		select {
		case msg := <-ch1:
			fmt.Println("ch1:", msg)
		case msg := <-ch2:
			fmt.Println("ch2:", msg)
		}
	}
}
```

### Таймаут с time.After

```go
package main

import (
	"fmt"
	"time"
)

func slowOperation() <-chan string {
	ch := make(chan string)
	go func() {
		time.Sleep(3 * time.Second) // долгая операция
		ch <- "результат"
	}()
	return ch
}

func main() {
	result := slowOperation()

	select {
	case val := <-result:
		fmt.Println("Получен результат:", val)
	case <-time.After(2 * time.Second):
		fmt.Println("Таймаут! Операция заняла слишком много времени")
	}
}
```

> [!WARNING] time.After создаёт утечку
> В цикле `time.After` создаёт новый таймер на каждой итерации, который не будет собран GC до истечения. Для циклов используйте `time.NewTimer` с `Reset()`:
> ```go
> timer := time.NewTimer(timeout)
> defer timer.Stop()
> for {
>     timer.Reset(timeout)
>     select {
>     case <-ch:
>         // обработка
>     case <-timer.C:
>         // таймаут
>     }
> }
> ```

### Non-blocking операции с default

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 1)

	// Non-blocking отправка
	select {
	case ch <- 42:
		fmt.Println("Отправлено 42")
	default:
		fmt.Println("Канал полон, пропускаем")
	}

	// Non-blocking чтение
	select {
	case val := <-ch:
		fmt.Println("Получено:", val)
	default:
		fmt.Println("Канал пуст, продолжаем")
	}
}
```

### Мультиплексирование: слияние двух каналов

```go
package main

import (
	"fmt"
	"sync"
)

// merge объединяет несколько каналов в один
func merge(channels ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup

	// Для каждого входного канала запускаем горутину-читатель
	for _, ch := range channels {
		wg.Add(1)
		go func(c <-chan int) {
			defer wg.Done()
			for val := range c {
				out <- val
			}
		}(ch)
	}

	// Закрываем выходной канал, когда все входные закрыты
	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

func generate(start, count int) <-chan int {
	ch := make(chan int)
	go func() {
		for i := start; i < start+count; i++ {
			ch <- i
		}
		close(ch)
	}()
	return ch
}

func main() {
	ch1 := generate(0, 5)   // 0, 1, 2, 3, 4
	ch2 := generate(10, 5)  // 10, 11, 12, 13, 14

	for val := range merge(ch1, ch2) {
		fmt.Print(val, " ")
	}
	fmt.Println()
}
```

### Отключение case через nil канал

```go
package main

import "fmt"

func main() {
	ch1 := make(chan int, 3)
	ch2 := make(chan int, 3)

	// Наполняем каналы
	ch1 <- 1
	ch1 <- 2
	close(ch1)

	ch2 <- 10
	ch2 <- 20
	close(ch2)

	// Читаем из обоих каналов, отключая закрытые
	for ch1 != nil || ch2 != nil {
		select {
		case val, ok := <-ch1:
			if !ok {
				ch1 = nil // присваиваем nil → этот case больше не выбирается
				fmt.Println("ch1 закрыт")
				continue
			}
			fmt.Println("ch1:", val)

		case val, ok := <-ch2:
			if !ok {
				ch2 = nil // отключаем этот case
				fmt.Println("ch2 закрыт")
				continue
			}
			fmt.Println("ch2:", val)
		}
	}

	fmt.Println("Оба канала закрыты")
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `first`, которая запускает N горутин с разными задачами и возвращает результат первой завершившейся (остальные отменяются через context).
2. Реализуйте heartbeat: горутина каждые 500мс отправляет сигнал в канал. Если сигнал не приходит 2 секунды — выведите предупреждение.
3. Реализуйте rate limiter через `time.Ticker` и select — обрабатывайте не более 5 запросов в секунду.

---

## 6. Пакет sync

Пакет `sync` предоставляет низкоуровневые примитивы синхронизации. Хотя Go продвигает каналы как основной механизм конкурентности, бывают случаи, когда мьютексы и другие примитивы sync проще и эффективнее.

### sync.WaitGroup

`WaitGroup` ожидает завершения группы горутин. Это самый частый способ дождаться завершения работы.

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func worker(id int, wg *sync.WaitGroup) {
	defer wg.Done() // ВСЕГДА в defer — гарантия вызова даже при panic

	fmt.Printf("Воркер %d начал работу\n", id)
	time.Sleep(time.Duration(id) * 100 * time.Millisecond)
	fmt.Printf("Воркер %d завершил работу\n", id)
}

func main() {
	var wg sync.WaitGroup

	for i := 1; i <= 5; i++ {
		wg.Add(1) // ВАЖНО: Add вызывается ДО запуска горутины
		go worker(i, &wg)
	}

	wg.Wait() // блокируется до wg.Counter == 0
	fmt.Println("Все воркеры завершены")
}
```

> [!WARNING] Типичные ошибки с WaitGroup
> ```go
> // ОШИБКА 1: Add после go (гонка!)
> go func() {
>     wg.Add(1) // может выполниться после Wait!
>     defer wg.Done()
>     // ...
> }()
>
> // ОШИБКА 2: передача по значению (копия, не оригинал)
> go worker(i, wg) // wg — копия, Done() не уменьшит оригинал
>
> // ПРАВИЛЬНО: передача по указателю
> go worker(i, &wg)
> ```

### sync.Mutex

Мьютекс обеспечивает исключительный доступ к разделяемому ресурсу. Только одна горутина может удерживать блокировку в любой момент.

```go
package main

import (
	"fmt"
	"sync"
)

// SafeCounter — потокобезопасный счётчик
type SafeCounter struct {
	mu    sync.Mutex
	count int
}

func (c *SafeCounter) Increment() {
	c.mu.Lock()
	defer c.mu.Unlock() // ВСЕГДА defer Unlock — защита от panic
	c.count++
}

func (c *SafeCounter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.count
}

func main() {
	counter := &SafeCounter{}
	var wg sync.WaitGroup

	// 1000 горутин инкрементируют счётчик
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Increment()
		}()
	}

	wg.Wait()
	fmt.Println("Счётчик:", counter.Value()) // всегда 1000
}
```

### sync.RWMutex

`RWMutex` позволяет нескольким горутинам читать одновременно, но запись блокирует всех. Идеален для read-heavy нагрузок.

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// Cache — кеш с поддержкой конкурентного чтения
type Cache struct {
	mu   sync.RWMutex
	data map[string]string
}

func NewCache() *Cache {
	return &Cache{data: make(map[string]string)}
}

// Get — читатели не блокируют друг друга
func (c *Cache) Get(key string) (string, bool) {
	c.mu.RLock()         // блокировка на чтение — множественная
	defer c.mu.RUnlock()
	val, ok := c.data[key]
	return val, ok
}

// Set — писатель блокирует всех (и читателей, и других писателей)
func (c *Cache) Set(key, value string) {
	c.mu.Lock()          // блокировка на запись — исключительная
	defer c.mu.Unlock()
	c.data[key] = value
}

func main() {
	cache := NewCache()
	var wg sync.WaitGroup

	// Писатель
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 10; i++ {
			key := fmt.Sprintf("key_%d", i)
			cache.Set(key, fmt.Sprintf("value_%d", i))
			time.Sleep(10 * time.Millisecond)
		}
	}()

	// Множество читателей
	for r := 0; r < 5; r++ {
		wg.Add(1)
		go func(readerID int) {
			defer wg.Done()
			for i := 0; i < 10; i++ {
				key := fmt.Sprintf("key_%d", i)
				if val, ok := cache.Get(key); ok {
					_ = val // используем значение
				}
				_ = readerID
			}
		}(r)
	}

	wg.Wait()
	fmt.Println("Кеш заполнен")
}
```

### sync.Once

`Once` гарантирует, что функция выполнится ровно один раз, даже при конкурентных вызовах. Идеален для ленивой инициализации.

```go
package main

import (
	"fmt"
	"sync"
)

type Database struct {
	connection string
}

var (
	dbInstance *Database
	dbOnce     sync.Once
)

// GetDB — ленивый синглтон: подключение создаётся при первом вызове
func GetDB() *Database {
	dbOnce.Do(func() {
		fmt.Println("Подключение к БД... (вызывается только один раз)")
		dbInstance = &Database{connection: "postgres://localhost:5432"}
	})
	return dbInstance
}

func main() {
	var wg sync.WaitGroup

	// 10 горутин одновременно запрашивают подключение
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			db := GetDB()
			_ = db
		}()
	}

	wg.Wait()
	// "Подключение к БД..." выведется только ОДИН раз
}
```

### sync.OnceFunc, OnceValue, OnceValues (Go 1.21+)

Go 1.21 добавил удобные обёртки над `sync.Once`:

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	// OnceFunc — функция без аргументов и возврата, вызывается один раз
	init := sync.OnceFunc(func() {
		fmt.Println("Инициализация (один раз)")
	})

	init() // выполняется
	init() // пропускается
	init() // пропускается

	// OnceValue — функция, возвращающая одно значение
	getConfig := sync.OnceValue(func() map[string]string {
		fmt.Println("Загрузка конфигурации...")
		return map[string]string{
			"host": "localhost",
			"port": "8080",
		}
	})

	config1 := getConfig() // загружает
	config2 := getConfig() // возвращает кешированное
	fmt.Println(config1["host"], config2["port"])

	// OnceValues — функция, возвращающая два значения (T, error)
	loadData := sync.OnceValues(func() ([]byte, error) {
		fmt.Println("Загрузка данных...")
		return []byte("данные"), nil
	})

	data, err := loadData() // загружает
	_, _ = loadData()       // возвращает кешированное
	fmt.Println(string(data), err)
}
```

### sync.Map

`sync.Map` — конкурентно-безопасная map, оптимизированная для двух сценариев: (1) ключ записывается один раз и читается многократно; (2) множество горутин работают с непересекающимися наборами ключей.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var m sync.Map

	// Store — сохранить значение
	m.Store("name", "Go")
	m.Store("version", 1.22)

	// Load — прочитать значение
	if val, ok := m.Load("name"); ok {
		fmt.Println("name:", val) // name: Go
	}

	// LoadOrStore — загрузить или сохранить если отсутствует
	actual, loaded := m.LoadOrStore("name", "Rust")
	fmt.Println(actual, loaded) // Go true (уже был)

	actual, loaded = m.LoadOrStore("lang", "Go")
	fmt.Println(actual, loaded) // Go false (был сохранён)

	// LoadAndDelete — прочитать и удалить атомарно
	val, loaded := m.LoadAndDelete("lang")
	fmt.Println(val, loaded) // Go true

	// Range — итерация (порядок не гарантирован)
	m.Range(func(key, value any) bool {
		fmt.Printf("%v: %v\n", key, value)
		return true // false прерывает итерацию
	})
}
```

> [!TIP] sync.Map vs map + Mutex
> Используйте `sync.Map` когда:
> - Ключи стабильные (запись одного раза, чтение многократное)
> - Горутины работают с разными ключами (не пересекаются)
>
> Используйте `map + sync.RWMutex` когда:
> - Нужен типизированный доступ (sync.Map хранит `any`)
> - Частая запись в одни и те же ключи
> - Нужна итерация с гарантией целостности снимка

### sync.Pool

`sync.Pool` — пул переиспользуемых объектов для снижения нагрузки на GC. Объекты могут быть удалены GC в любой момент.

```go
package main

import (
	"bytes"
	"fmt"
	"sync"
)

// Пул буферов — избегаем частого выделения памяти
var bufPool = sync.Pool{
	New: func() any {
		fmt.Println("Создаём новый буфер")
		return new(bytes.Buffer)
	},
}

func processRequest(data string) string {
	// Берём буфер из пула (или создаём новый)
	buf := bufPool.Get().(*bytes.Buffer)

	// ОБЯЗАТЕЛЬНО очищаем перед использованием
	buf.Reset()

	// Используем буфер
	buf.WriteString("Обработано: ")
	buf.WriteString(data)

	result := buf.String()

	// Возвращаем буфер в пул для переиспользования
	bufPool.Put(buf)

	return result
}

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			result := processRequest(fmt.Sprintf("запрос_%d", id))
			fmt.Println(result)
		}(i)
	}

	wg.Wait()
	// "Создаём новый буфер" выведется гораздо меньше 10 раз
}
```

### sync.Cond

`sync.Cond` — условная переменная для ожидания наступления условия. Используется редко, обычно каналы удобнее.

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var mu sync.Mutex
	cond := sync.NewCond(&mu)
	ready := false

	// Ожидающая горутина
	go func() {
		mu.Lock()
		for !ready { // ВСЕГДА проверяйте условие в цикле (spurious wakeup)
			cond.Wait() // атомарно: Unlock → wait → Lock
		}
		fmt.Println("Данные готовы, обрабатываем!")
		mu.Unlock()
	}()

	// Подготовка данных
	time.Sleep(1 * time.Second)
	mu.Lock()
	ready = true
	mu.Unlock()
	cond.Signal() // разбудить одну горутину
	// cond.Broadcast() // разбудить все ожидающие горутины

	time.Sleep(100 * time.Millisecond)
}
```

###### 🏠 Домашнее задание

1. Реализуйте потокобезопасный `Set[T comparable]` с методами `Add`, `Contains`, `Remove`, `Len` используя `sync.RWMutex`.
2. Создайте пул HTTP-клиентов с помощью `sync.Pool`, измерьте разницу в аллокациях с `testing.B` бенчмарком.
3. Реализуйте ленивую инициализацию конфигурации с помощью `sync.OnceValues`, где конфигурация может возвращать ошибку.
4. Напишите rate-limited logger, который использует `sync.Mutex` для защиты буфера и сбрасывает его раз в секунду.

---

## 7. sync/atomic

Пакет `sync/atomic` предоставляет low-level атомарные операции. Они быстрее мьютексов для простых операций (инкремент, загрузка, сохранение).

```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	// Атомарные типы (Go 1.19+) — удобный API
	var counter atomic.Int64
	var flag atomic.Bool
	var name atomic.Value // для произвольных типов

	var wg sync.WaitGroup

	// 1000 горутин атомарно инкрементируют счётчик
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Add(1) // атомарный инкремент
		}()
	}
	wg.Wait()

	fmt.Println("Счётчик:", counter.Load()) // 1000 — всегда точно

	// atomic.Bool
	flag.Store(true)
	fmt.Println("Флаг:", flag.Load()) // true

	// Swap — установить новое значение, получить старое
	old := flag.Swap(false)
	fmt.Println("Старое:", old, "Новое:", flag.Load())

	// CompareAndSwap — установить если текущее значение совпадает
	// CAS — основа lock-free алгоритмов
	swapped := counter.CompareAndSwap(1000, 0) // если 1000, то заменить на 0
	fmt.Println("CAS успех:", swapped)
	fmt.Println("Счётчик после CAS:", counter.Load())

	// atomic.Value — для произвольных типов (конфигурация, состояние)
	type Config struct {
		Host string
		Port int
	}

	name.Store(Config{Host: "localhost", Port: 8080})
	cfg := name.Load().(Config)
	fmt.Printf("Конфиг: %s:%d\n", cfg.Host, cfg.Port)
}
```

> [!TIP] atomic vs Mutex
> Используйте **atomic** когда:
> - Одна переменная (счётчик, флаг, указатель)
> - Простые операции (Load, Store, Add, CompareAndSwap)
>
> Используйте **Mutex** когда:
> - Нужно защитить группу связанных переменных
> - Нужна сложная логика внутри критической секции

###### 🏠 Домашнее задание

1. Реализуйте потокобезопасный счётчик тремя способами: Mutex, atomic.Int64, канал. Сравните производительность с бенчмарком.
2. Используя `atomic.Value`, реализуйте горячую перезагрузку конфигурации: одна горутина периодически обновляет конфиг, остальные читают.
3. Реализуйте spin-lock с помощью `atomic.CompareAndSwap` (для учебных целей, не для production).

---

## 8. Паттерны конкурентности

### Worker Pool

Worker Pool — фиксированное количество воркеров, обрабатывающих задачи из общего канала. Один из самых востребованных паттернов.

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// Job описывает задачу для обработки
type Job struct {
	ID      int
	Payload string
}

// Result описывает результат обработки
type Result struct {
	JobID  int
	Output string
}

// worker — горутина-обработчик, читает задачи из jobs, пишет результаты в results
func worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
	defer wg.Done()

	for job := range jobs { // range завершится, когда jobs закроется
		fmt.Printf("Воркер %d обрабатывает задачу %d\n", id, job.ID)
		time.Sleep(100 * time.Millisecond) // имитация работы

		results <- Result{
			JobID:  job.ID,
			Output: fmt.Sprintf("Результат задачи %d: %s обработано", job.ID, job.Payload),
		}
	}
}

func main() {
	const numWorkers = 3
	const numJobs = 10

	jobs := make(chan Job, numJobs)       // буфер для всех задач
	results := make(chan Result, numJobs) // буфер для всех результатов

	// Запускаем пул воркеров
	var wg sync.WaitGroup
	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	// Отправляем задачи
	for j := 1; j <= numJobs; j++ {
		jobs <- Job{ID: j, Payload: fmt.Sprintf("данные_%d", j)}
	}
	close(jobs) // сигнализируем воркерам, что задач больше не будет

	// Ждём завершения всех воркеров и закрываем results
	go func() {
		wg.Wait()
		close(results)
	}()

	// Собираем результаты
	for result := range results {
		fmt.Println(result.Output)
	}
}
```

### Fan-out / Fan-in

**Fan-out** — распределение работы от одного источника к нескольким воркерам. **Fan-in** — объединение результатов от нескольких источников в один канал.

```go
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// source — генератор данных (один источник)
func source(count int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for i := 0; i < count; i++ {
			out <- rand.Intn(100)
		}
	}()
	return out
}

// fanOut — запускает n воркеров, каждый читает из in и пишет в свой out
func fanOut(in <-chan int, n int) []<-chan int {
	channels := make([]<-chan int, n)
	for i := 0; i < n; i++ {
		ch := make(chan int)
		channels[i] = ch
		go func() {
			defer close(ch)
			for val := range in {
				// Тяжёлая обработка
				time.Sleep(time.Duration(rand.Intn(50)) * time.Millisecond)
				ch <- val * val // возводим в квадрат
			}
		}()
	}
	return channels
}

// fanIn — объединяет несколько каналов в один
func fanIn(channels ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup

	for _, ch := range channels {
		wg.Add(1)
		go func(c <-chan int) {
			defer wg.Done()
			for val := range c {
				out <- val
			}
		}(ch)
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

func main() {
	// Источник: 20 чисел
	data := source(20)

	// Fan-out: 4 воркера обрабатывают данные
	workers := fanOut(data, 4)

	// Fan-in: объединяем результаты
	results := fanIn(workers...)

	// Собираем все результаты
	var total int
	for val := range results {
		total += val
	}
	fmt.Println("Сумма квадратов:", total)
}
```

### Pipeline

Pipeline — цепочка стадий обработки, соединённых каналами. Каждая стадия — горутина, которая читает из входного канала и пишет в выходной.

```go
package main

import "fmt"

// generate — первая стадия: генерирует числа
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

// square — вторая стадия: возводит в квадрат
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

// filter — третья стадия: пропускает только значения > threshold
func filter(in <-chan int, threshold int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			if n > threshold {
				out <- n
			}
		}
	}()
	return out
}

// sum — финальная стадия: суммирует все значения
func sum(in <-chan int) int {
	total := 0
	for n := range in {
		total += n
	}
	return total
}

func main() {
	// Строим пайплайн: generate → square → filter → sum
	//
	// generate(1,2,3,4,5) → square → filter(>5) → sum
	// 1,2,3,4,5           → 1,4,9,16,25       → 9,16,25 → 50

	nums := generate(1, 2, 3, 4, 5)
	squared := square(nums)
	filtered := filter(squared, 5)
	result := sum(filtered)

	fmt.Println("Результат пайплайна:", result) // 50
}
```

### Семафор через буферизованный канал

Буферизованный канал — простейший способ ограничить конкурентность.

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	const maxConcurrent = 3 // максимум 3 одновременных операции

	// Семафор — буферизованный канал ёмкостью maxConcurrent
	sem := make(chan struct{}, maxConcurrent)
	var wg sync.WaitGroup

	for i := 1; i <= 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			sem <- struct{}{} // захватываем слот (блокируемся если все заняты)
			defer func() { <-sem }() // освобождаем слот

			fmt.Printf("Задача %d начала работу (активных: %d)\n", id, len(sem))
			time.Sleep(500 * time.Millisecond)
			fmt.Printf("Задача %d завершена\n", id)
		}(i)
	}

	wg.Wait()
}
```

### Rate Limiter

Ограничение частоты операций — критически важный паттерн для API и внешних сервисов.

```go
package main

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/time/rate"
)

func main() {
	// Создаём rate limiter: 5 запросов в секунду, burst до 10
	// rate.Every(200*time.Millisecond) = 5 запросов в секунду
	limiter := rate.NewLimiter(rate.Every(200*time.Millisecond), 10)

	ctx := context.Background()

	// Имитация 20 запросов
	for i := 1; i <= 20; i++ {
		// Wait блокирует до получения токена
		if err := limiter.Wait(ctx); err != nil {
			fmt.Printf("Запрос %d: ошибка rate limit: %v\n", i, err)
			continue
		}

		fmt.Printf("Запрос %d обработан в %s\n", i, time.Now().Format("15:04:05.000"))
	}
}

// Простой rate limiter через time.Ticker (без внешних зависимостей)
func simpleLimiter() {
	// 5 запросов в секунду
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	requests := make(chan int, 100)
	for i := 1; i <= 20; i++ {
		requests <- i
	}
	close(requests)

	for req := range requests {
		<-ticker.C // ждём тик — ограничиваем частоту
		fmt.Printf("Обработан запрос %d\n", req)
	}
}
```

### Circuit Breaker

Circuit Breaker предотвращает каскадные отказы, прерывая вызовы к неработающему сервису.

```go
package main

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

// Состояния Circuit Breaker
type State int

const (
	StateClosed   State = iota // нормальная работа, запросы проходят
	StateOpen                  // сервис недоступен, запросы отклоняются
	StateHalfOpen              // пробный запрос для проверки восстановления
)

func (s State) String() string {
	switch s {
	case StateClosed:
		return "CLOSED"
	case StateOpen:
		return "OPEN"
	case StateHalfOpen:
		return "HALF-OPEN"
	}
	return "UNKNOWN"
}

// CircuitBreaker — реализация паттерна
type CircuitBreaker struct {
	mu              sync.Mutex
	state           State
	failures        int           // счётчик последовательных ошибок
	maxFailures     int           // порог для открытия
	resetTimeout    time.Duration // время до перехода в half-open
	lastFailureTime time.Time     // время последней ошибки
}

var ErrCircuitOpen = errors.New("circuit breaker is open")

func NewCircuitBreaker(maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:        StateClosed,
		maxFailures:  maxFailures,
		resetTimeout: resetTimeout,
	}
}

// Execute выполняет функцию через circuit breaker
func (cb *CircuitBreaker) Execute(fn func() error) error {
	cb.mu.Lock()

	switch cb.state {
	case StateOpen:
		// Проверяем, не пора ли перейти в half-open
		if time.Since(cb.lastFailureTime) > cb.resetTimeout {
			cb.state = StateHalfOpen
			fmt.Println("[CB] Переход в HALF-OPEN")
		} else {
			cb.mu.Unlock()
			return ErrCircuitOpen
		}
	}
	cb.mu.Unlock()

	// Выполняем функцию
	err := fn()

	cb.mu.Lock()
	defer cb.mu.Unlock()

	if err != nil {
		cb.failures++
		cb.lastFailureTime = time.Now()

		if cb.failures >= cb.maxFailures {
			cb.state = StateOpen
			fmt.Printf("[CB] Переход в OPEN (ошибок: %d)\n", cb.failures)
		}
		return err
	}

	// Успех — сбрасываем счётчик
	cb.failures = 0
	if cb.state == StateHalfOpen {
		cb.state = StateClosed
		fmt.Println("[CB] Переход в CLOSED (сервис восстановлен)")
	}
	return nil
}

func main() {
	cb := NewCircuitBreaker(3, 2*time.Second)

	// Имитация вызовов к нестабильному сервису
	callCount := 0
	unstableService := func() error {
		callCount++
		if callCount <= 5 { // первые 5 вызовов — ошибка
			return errors.New("service unavailable")
		}
		return nil // потом восстанавливается
	}

	for i := 1; i <= 10; i++ {
		err := cb.Execute(unstableService)
		fmt.Printf("Вызов %d: err=%v\n", i, err)
		time.Sleep(500 * time.Millisecond)
	}
}
```

> [!TIP] Готовые решения Circuit Breaker
> В production рекомендуется использовать библиотеку [sony/gobreaker](https://github.com/sony/gobreaker), которая предоставляет полноценную реализацию с настройками, метриками и callback-функциями.

### Or-done канал

Паттерн для безопасного чтения из канала с поддержкой отмены через context:

```go
package main

import (
	"context"
	"fmt"
	"time"
)

// orDone оборачивает чтение из канала с поддержкой отмены
func orDone(ctx context.Context, ch <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return // контекст отменён
			case val, ok := <-ch:
				if !ok {
					return // канал закрыт
				}
				// Двойной select: отправляем с проверкой отмены
				select {
				case out <- val:
				case <-ctx.Done():
					return
				}
			}
		}
	}()
	return out
}

func main() {
	// Бесконечный генератор
	gen := make(chan int)
	go func() {
		i := 0
		for {
			gen <- i
			i++
			time.Sleep(100 * time.Millisecond)
		}
	}()

	// Читаем с таймаутом 500мс
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	for val := range orDone(ctx, gen) {
		fmt.Println("Значение:", val)
	}
	fmt.Println("Завершено по таймауту")
}
```

###### 🏠 Домашнее задание

1. Реализуйте Worker Pool с возможностью динамического масштабирования — добавление и удаление воркеров без остановки.
2. Создайте pipeline для обработки текстовых файлов: чтение строк → фильтрация → трансформация → запись результата.
3. Реализуйте Circuit Breaker с экспоненциальным backoff для retry в состоянии half-open.
4. Напишите per-key rate limiter: каждый уникальный ключ (например, IP-адрес) имеет свой лимит.

---

## 9. Context

Пакет `context` — стандартный механизм Go для управления жизненным циклом операций: отмена, таймауты, передача метаданных. Контекст пронизывает весь стек вызовов.

> [!NOTE] Правила использования context
> 1. Context — **всегда первый параметр** функции: `func DoSomething(ctx context.Context, ...)`
> 2. Не храните контекст в структурах (кроме исключительных случаев)
> 3. Всегда вызывайте `cancel()` через defer
> 4. Не передавайте nil context — используйте `context.TODO()` если не уверены

### context.Background() и context.TODO()

```go
package main

import "context"

func main() {
	// Background — корневой контекст, никогда не отменяется
	// Используется как отправная точка в main(), init(), тестах
	ctx := context.Background()

	// TODO — заглушка "я добавлю правильный контекст позже"
	// Используется при рефакторинге, когда пока неясно какой контекст нужен
	ctxTodo := context.TODO()

	_ = ctx
	_ = ctxTodo
}
```

### WithCancel — ручная отмена

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done(): // канал закрывается при отмене
			fmt.Printf("Воркер %d остановлен: %v\n", id, ctx.Err())
			return
		default:
			fmt.Printf("Воркер %d работает...\n", id)
			time.Sleep(200 * time.Millisecond)
		}
	}
}

func main() {
	// WithCancel возвращает дочерний контекст и функцию отмены
	ctx, cancel := context.WithCancel(context.Background())

	// Запускаем воркеров
	for i := 1; i <= 3; i++ {
		go worker(ctx, i)
	}

	time.Sleep(1 * time.Second)

	// Отменяем контекст — ВСЕ дочерние горутины получат сигнал
	cancel() // ВСЕГДА вызывайте cancel(), обычно через defer

	time.Sleep(100 * time.Millisecond) // даём горутинам время завершиться
	fmt.Println("Все воркеры остановлены")
}
```

### WithTimeout и WithDeadline

```go
package main

import (
	"context"
	"fmt"
	"time"
)

// slowOperation имитирует долгую операцию
func slowOperation(ctx context.Context) (string, error) {
	select {
	case <-time.After(3 * time.Second): // операция занимает 3 секунды
		return "результат", nil
	case <-ctx.Done():
		return "", ctx.Err() // context.DeadlineExceeded или context.Canceled
	}
}

func main() {
	// WithTimeout — отменяется автоматически через указанное время
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel() // ВСЕГДА defer cancel(), даже если таймаут сработает раньше

	result, err := slowOperation(ctx)
	if err != nil {
		fmt.Println("Ошибка:", err) // context deadline exceeded
		return
	}
	fmt.Println("Результат:", result)

	// WithDeadline — отменяется в конкретный момент времени
	deadline := time.Now().Add(2 * time.Second)
	ctxDl, cancelDl := context.WithDeadline(context.Background(), deadline)
	defer cancelDl()

	// Проверяем дедлайн
	if dl, ok := ctxDl.Deadline(); ok {
		fmt.Println("Дедлайн:", dl.Format(time.RFC3339))
	}
}
```

### WithValue — передача данных

```go
package main

import (
	"context"
	"fmt"
	"net/http"
)

// ПРАВИЛЬНО: используйте пользовательский тип для ключей,
// чтобы избежать конфликтов между пакетами
type contextKey string

const (
	requestIDKey contextKey = "request_id"
	userIDKey    contextKey = "user_id"
)

func middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Добавляем request ID в контекст
		ctx := context.WithValue(r.Context(), requestIDKey, "req-12345")
		ctx = context.WithValue(ctx, userIDKey, 42)

		// Передаём обогащённый контекст дальше
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func handler(w http.ResponseWriter, r *http.Request) {
	// Извлекаем значения из контекста
	reqID, _ := r.Context().Value(requestIDKey).(string)
	userID, _ := r.Context().Value(userIDKey).(int)

	fmt.Fprintf(w, "Request: %s, User: %d\n", reqID, userID)
}

func main() {
	mux := http.NewServeMux()
	mux.Handle("/", middleware(http.HandlerFunc(handler)))
	// http.ListenAndServe(":8080", mux)
}
```

> [!WARNING] Не злоупотребляйте WithValue
> `WithValue` предназначен для **request-scoped** данных: request ID, trace ID, аутентифицированный пользователь.
> НЕ используйте его для:
> - Передачи обязательных параметров функции (используйте аргументы)
> - Конфигурации или зависимостей (используйте dependency injection)
> - Больших объектов (значения копируются при создании дочерних контекстов)

### WithoutCancel (Go 1.21) — для фоновых задач

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// Создаём контекст запроса с таймаутом
	reqCtx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	// WithoutCancel создаёт контекст с теми же значениями,
	// но НЕ отменяемый при отмене родителя
	// Полезно для фоновых задач: логирование, метрики, аудит
	bgCtx := context.WithoutCancel(reqCtx)

	// Запускаем фоновую задачу, которая переживёт запрос
	go func() {
		// bgCtx не отменится, когда reqCtx будет отменён
		time.Sleep(2 * time.Second)
		fmt.Println("Фоновая задача завершена, ctx.Err():", bgCtx.Err()) // nil
	}()

	time.Sleep(3 * time.Second)
}
```

### context.AfterFunc (Go 1.21) — callback при отмене

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)

	// AfterFunc вызывает функцию в отдельной горутине при отмене контекста
	stop := context.AfterFunc(ctx, func() {
		fmt.Println("Контекст отменён! Выполняем очистку...")
	})

	// stop() можно вызвать, чтобы отменить callback до срабатывания
	_ = stop

	time.Sleep(2 * time.Second)
	cancel() // можно вызвать и после таймаута для порядка
}
```

### Context в HTTP-обработчиках

```go
package main

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

func fetchData(ctx context.Context, url string) (string, error) {
	// Создаём HTTP-запрос с контекстом
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err // если контекст отменён, ошибка будет context.Canceled
	}
	defer resp.Body.Close()

	return fmt.Sprintf("Status: %d", resp.StatusCode), nil
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	// r.Context() автоматически отменяется, когда клиент отключается
	ctx := r.Context()

	// Добавляем свой таймаут поверх (но не больше оставшегося)
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	result, err := fetchData(ctx, "https://api.example.com/data")
	if err != nil {
		http.Error(w, err.Error(), http.StatusGatewayTimeout)
		return
	}

	fmt.Fprint(w, result)
}
```

Связанные заметки: [[03-networking]], [[04-databases]]

###### 🏠 Домашнее задание

1. Напишите функцию, которая делает HTTP-запрос с таймаутом через context. Если запрос не завершился за 2 секунды, верните ошибку.
2. Реализуйте цепочку контекстов: parent → child1 (таймаут 5с) → child2 (таймаут 2с). Покажите, как отмена parent отменяет всех потомков.
3. Используя `context.AfterFunc`, реализуйте уведомление (запись в лог) при отмене контекста запроса.
4. Реализуйте middleware, добавляющее request-ID и trace-ID в контекст, и обработчик, который логирует эти значения.

---

## 10. errgroup

Пакет `golang.org/x/sync/errgroup` — удобная обёртка над `sync.WaitGroup` с поддержкой ошибок и автоматической отменой контекста при первой ошибке.

```go
package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"golang.org/x/sync/errgroup"
)

// fetchURL загружает URL и возвращает размер ответа
func fetchURL(ctx context.Context, url string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, fmt.Errorf("создание запроса для %s: %w", url, err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, fmt.Errorf("загрузка %s: %w", url, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("чтение %s: %w", url, err)
	}

	return len(body), nil
}

func main() {
	urls := []string{
		"https://go.dev",
		"https://pkg.go.dev",
		"https://blog.golang.org",
	}

	// WithContext: при первой ошибке контекст отменяется,
	// что отменит остальные HTTP-запросы
	g, ctx := errgroup.WithContext(context.Background())

	// Результаты (потокобезопасный доступ, т.к. каждый индекс уникален)
	results := make([]int, len(urls))

	for i, url := range urls {
		i, url := i, url // копия для замыкания (до Go 1.22)

		g.Go(func() error {
			size, err := fetchURL(ctx, url)
			if err != nil {
				return err
			}
			results[i] = size
			return nil
		})
	}

	// Wait ожидает все горутины и возвращает первую ошибку
	if err := g.Wait(); err != nil {
		fmt.Println("Ошибка:", err)
		return
	}

	for i, url := range urls {
		fmt.Printf("%s: %d байт\n", url, results[i])
	}
}
```

### SetLimit — ограничение конкурентности (Go 1.20+)

```go
package main

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/sync/errgroup"
)

func main() {
	g, ctx := errgroup.WithContext(context.Background())

	// Ограничиваем до 3 одновременных горутин
	g.SetLimit(3)

	for i := 1; i <= 10; i++ {
		i := i

		// g.Go автоматически блокируется, если лимит достигнут
		g.Go(func() error {
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
			}

			fmt.Printf("Задача %d начата\n", i)
			time.Sleep(500 * time.Millisecond)
			fmt.Printf("Задача %d завершена\n", i)
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		fmt.Println("Ошибка:", err)
	}
}
```

> [!TIP] errgroup vs sync.WaitGroup
> Используйте **errgroup** когда:
> - Горутины возвращают ошибки, и вы хотите получить первую ошибку
> - Нужна автоматическая отмена остальных горутин при ошибке
> - Нужен лимит конкурентности (SetLimit)
>
> Используйте **sync.WaitGroup** когда:
> - Горутины не возвращают ошибок (fire-and-forget)
> - Не нужна автоматическая отмена

###### 🏠 Домашнее задание

1. Используя `errgroup`, напишите параллельный загрузчик, который скачивает 5 URL одновременно и возвращает суммарный размер. При ошибке в любом запросе остальные должны отмениться.
2. Добавьте `SetLimit(2)` и сравните время выполнения с неограниченной версией.
3. Реализуйте параллельную проверку здоровья нескольких сервисов с таймаутом 3 секунды.

---

## 11. singleflight

Пакет `golang.org/x/sync/singleflight` гарантирует, что для одного и того же ключа одновременно выполняется только один вызов функции. Все остальные горутины ждут и получают тот же результат. Идеален для предотвращения cache stampede.

```go
package main

import (
	"fmt"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

// Имитация медленного запроса к БД
func fetchFromDB(key string) (string, error) {
	fmt.Printf("[DB] Загрузка данных для ключа: %s\n", key)
	time.Sleep(1 * time.Second) // долгий запрос
	return fmt.Sprintf("данные_для_%s", key), nil
}

type CacheService struct {
	cache map[string]string
	mu    sync.RWMutex
	group singleflight.Group
}

func NewCacheService() *CacheService {
	return &CacheService{
		cache: make(map[string]string),
	}
}

func (s *CacheService) Get(key string) (string, error) {
	// Шаг 1: проверяем кеш
	s.mu.RLock()
	if val, ok := s.cache[key]; ok {
		s.mu.RUnlock()
		return val, nil
	}
	s.mu.RUnlock()

	// Шаг 2: кеш промах — используем singleflight
	// Все горутины с одинаковым key будут ждать один запрос к БД
	val, err, shared := s.group.Do(key, func() (any, error) {
		result, err := fetchFromDB(key)
		if err != nil {
			return nil, err
		}

		// Обновляем кеш
		s.mu.Lock()
		s.cache[key] = result
		s.mu.Unlock()

		return result, nil
	})

	if err != nil {
		return "", err
	}

	fmt.Printf("[Cache] key=%s shared=%v\n", key, shared) // shared=true если результат разделён
	return val.(string), nil
}

func main() {
	service := NewCacheService()
	var wg sync.WaitGroup

	// 10 горутин одновременно запрашивают один ключ
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			val, err := service.Get("user:123")
			if err != nil {
				fmt.Printf("Горутина %d: ошибка %v\n", id, err)
				return
			}
			fmt.Printf("Горутина %d: %s\n", id, val)
		}(i)
	}

	wg.Wait()
	// "[DB] Загрузка данных для ключа: user:123" выведется ТОЛЬКО ОДИН РАЗ!
}
```

> [!INFO] Cache stampede (стемпид кеша)
> Когда запись в кеше истекает, и 1000 горутин одновременно обнаруживают промах кеша, все 1000 пойдут в БД. Это может перегрузить базу данных.
>
> **singleflight** решает эту проблему: только одна горутина пойдёт в БД, остальные 999 дождутся её результата.

###### 🏠 Домашнее задание

1. Реализуйте кеш с singleflight и TTL (время жизни записи). Когда TTL истекает, первый запрос обновляет кеш, остальные ждут.
2. Используйте метод `DoChan` вместо `Do` для неблокирующего вызова с поддержкой context.
3. Объясните, почему singleflight не подходит для мутирующих операций (запись, удаление).

---

## 12. Ошибки в горутинах

### panic в горутине убивает всю программу

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	go func() {
		panic("что-то пошло не так!") // убьёт ВСЮ программу, не только горутину
	}()

	time.Sleep(1 * time.Second) // не доберёмся сюда
	fmt.Println("Этот код не выполнится")
}
```

> [!WARNING] Panic в горутине
> `panic` в горутине, если не перехвачен через `recover`, **убивает весь процесс**, а не только горутину. `recover()` работает **только** в deferred-функции **той же горутины**, где произошёл panic.

### Безопасный запуск горутин

```go
package main

import (
	"fmt"
	"log"
	"sync"
)

// safeGo — обёртка для безопасного запуска горутины
func safeGo(fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				// Логируем panic вместо падения всей программы
				log.Printf("RECOVERED panic в горутине: %v", r)
			}
		}()
		fn()
	}()
}

// safeGoWithError — обёртка с возвратом ошибки через канал
func safeGoWithError(fn func() error) <-chan error {
	errCh := make(chan error, 1)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				errCh <- fmt.Errorf("panic: %v", r)
			}
		}()
		errCh <- fn()
	}()
	return errCh
}

func main() {
	var wg sync.WaitGroup

	// Безопасный запуск — panic не убьёт программу
	wg.Add(1)
	safeGo(func() {
		defer wg.Done()
		panic("ой!")
	})

	// Запуск с возвратом ошибки
	errCh := safeGoWithError(func() error {
		panic("паника в функции с ошибкой!")
	})

	wg.Wait()

	if err := <-errCh; err != nil {
		fmt.Println("Получена ошибка:", err)
	}

	fmt.Println("Программа продолжает работать!")
}
```

### recover только в defer той же горутины

```go
package main

import "fmt"

func main() {
	// ОШИБКА: recover в main не поймает panic в другой горутине
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Поймали:", r) // НЕ СРАБОТАЕТ для panic в горутине
		}
	}()

	go func() {
		panic("panic в горутине") // убьёт программу
	}()

	select {} // ждём
}
```

###### 🏠 Домашнее задание

1. Напишите `SafeRunner`, который запускает набор функций в горутинах, перехватывает panic каждой, и возвращает slice ошибок.
2. Реализуйте retry-обёртку: если горутина паникует, перезапустить её до 3 раз.
3. Объясните, почему `defer recover()` (без анонимной функции) не работает.

---

## 13. Race conditions

Race condition (состояние гонки) — ситуация, когда результат программы зависит от порядка выполнения горутин. Go предоставляет встроенный детектор гонок.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	// ПРИМЕР ГОНКИ: несколько горутин пишут в одну переменную
	counter := 0
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter++ // DATA RACE! Чтение и запись без синхронизации
		}()
	}

	wg.Wait()
	fmt.Println("Счётчик:", counter) // НЕ гарантировано 1000
}
```

### Детектор гонок

```bash
# Запуск с детектором гонок
go run -race main.go

# Тесты с детектором
go test -race ./...

# Сборка с детектором (для тестовых окружений)
go build -race -o myapp .
```

> [!WARNING] Детектор гонок в production
> Детектор гонок замедляет программу в **5-10 раз** и увеличивает потребление памяти в **5-10 раз**. Используйте его в тестах и CI/CD, но **НИКОГДА в production**.

### Типичные примеры гонок и исправления

```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	// ПРИМЕР 1: Гонка при чтении/записи map
	// НЕПРАВИЛЬНО:
	// m := make(map[int]int)
	// go func() { m[1] = 1 }()
	// go func() { m[2] = 2 }()
	// PANIC: concurrent map writes

	// ПРАВИЛЬНО: sync.RWMutex
	var mu sync.RWMutex
	m := make(map[int]int)
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			mu.Lock()
			m[n] = n * n
			mu.Unlock()
		}(i)
	}
	wg.Wait()
	fmt.Println("Map size:", len(m))

	// ПРИМЕР 2: Гонка при чтении bool-флага
	// НЕПРАВИЛЬНО:
	// done := false
	// go func() { done = true }()
	// for !done {} // busy wait — data race + может не увидеть изменение

	// ПРАВИЛЬНО: atomic.Bool
	var done atomic.Bool
	wg.Add(1)
	go func() {
		defer wg.Done()
		done.Store(true)
	}()
	wg.Wait()
	fmt.Println("Done:", done.Load())
}
```

###### 🏠 Домашнее задание

1. Напишите программу с намеренной гонкой данных и запустите с `-race`. Проанализируйте вывод детектора.
2. Исправьте гонку тремя способами: mutex, atomic, канал. Сравните производительность.
3. Запустите свои тесты из предыдущих глав с `-race` и исправьте найденные гонки.

---

## 14. Частые ошибки

### Утечка горутин (goroutine leak)

Горутина, заблокированная навсегда — это утечка. Она потребляет память и никогда не освободит ресурсы.

```go
package main

import (
	"context"
	"fmt"
	"runtime"
	"time"
)

func leakyFunction() {
	ch := make(chan int) // небуферизованный канал

	go func() {
		val := <-ch // НАВСЕГДА заблокируется — никто не отправит в ch
		fmt.Println(val)
	}()

	// Функция возвращается, но горутина живёт вечно
}

func fixedWithBuffer() {
	ch := make(chan int, 1) // буферизованный канал

	go func() {
		select {
		case val := <-ch:
			fmt.Println(val)
		case <-time.After(5 * time.Second):
			fmt.Println("Таймаут, горутина завершается")
			return
		}
	}()
}

func fixedWithContext() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	ch := make(chan int)

	go func() {
		select {
		case val := <-ch:
			fmt.Println(val)
		case <-ctx.Done():
			fmt.Println("Контекст отменён, горутина завершается")
			return
		}
	}()
}

func main() {
	fmt.Println("Горутин до утечки:", runtime.NumGoroutine())

	for i := 0; i < 100; i++ {
		leakyFunction()
	}

	time.Sleep(100 * time.Millisecond)
	fmt.Println("Горутин после утечки:", runtime.NumGoroutine()) // ~101 — утечка!
}
```

### Захват переменной цикла (до Go 1.22)

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup

	// ОШИБКА (до Go 1.22): все горутины видят последнее значение i
	// for i := 0; i < 5; i++ {
	// 	wg.Add(1)
	// 	go func() {
	// 		defer wg.Done()
	// 		fmt.Println(i) // все выведут 5
	// 	}()
	// }

	// ИСПРАВЛЕНИЕ 1: передать через параметр
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			fmt.Println("Вариант 1:", n) // правильные значения
		}(i)
	}

	// ИСПРАВЛЕНИЕ 2: локальная копия
	for i := 0; i < 5; i++ {
		i := i // создаём новую переменную i в каждой итерации
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Println("Вариант 2:", i) // правильные значения
		}()
	}

	wg.Wait()

	// Начиная с Go 1.22, переменная цикла создаётся заново
	// на каждой итерации — проблема решена на уровне языка
}
```

> [!INFO] Go 1.22 исправил захват переменных цикла
> С Go 1.22 каждая итерация `for` создаёт новую переменную. Старый код теперь работает корректно. Но для совместимости с Go < 1.22 рекомендуется явно копировать переменную.

### Забытый cancel — утечка контекста

```go
package main

import (
	"context"
	"fmt"
	"runtime"
)

func main() {
	// ОШИБКА: забыли вызвать cancel
	for i := 0; i < 1000; i++ {
		_, _ = context.WithCancel(context.Background())
		// cancel() НЕ вызван — утечка горутин таймеров
	}
	fmt.Println("Горутин:", runtime.NumGoroutine()) // может быть больше ожидаемого

	// ПРАВИЛЬНО: всегда defer cancel()
	ctx, cancel := context.WithTimeout(context.Background(), 0)
	defer cancel()
	_ = ctx
}
```

### Конкурентная запись в map — panic (не data race!)

```go
package main

import "sync"

func main() {
	m := make(map[int]int)
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			// PANIC: concurrent map writes
			// Это не data race (детектор может не поймать),
			// а runtime panic — Go проверяет конкурентный доступ к map
			m[n] = n
		}(i)
	}

	wg.Wait()
}

// ИСПРАВЛЕНИЕ: sync.RWMutex или sync.Map
func fixed() {
	var mu sync.Mutex
	m := make(map[int]int)
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			mu.Lock()
			m[n] = n
			mu.Unlock()
		}(i)
	}

	wg.Wait()
}
```

###### 🏠 Домашнее задание

1. Напишите функцию `detectLeaks()`, которая сравнивает `runtime.NumGoroutine()` до и после выполнения кода и предупреждает об утечке.
2. Найдите и исправьте все goroutine leaks в следующем коде:
```go
func process(urls []string) {
    for _, url := range urls {
        ch := make(chan string)
        go func() { ch <- fetch(url) }()
    }
}
```
3. Напишите unit-тест, который проверяет отсутствие утечек горутин после вызова вашей функции.

---

## 15. Модель памяти Go

Модель памяти Go определяет, при каких условиях чтение переменной в одной горутине гарантированно увидит значение, записанное в другой горутине.

> [!NOTE] Happens-before
> Отношение **happens-before** определяет порядок видимости операций между горутинами. Если операция A happens-before операции B, то эффекты A гарантированно видны B.

### Гарантии happens-before

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	// 1. Операции с каналами — синхронизация
	ch := make(chan int)
	x := 0

	go func() {
		x = 42      // запись в x
		ch <- 1     // отправка happens-before получения
	}()

	<-ch            // получение
	fmt.Println(x)  // ГАРАНТИРОВАННО 42

	// 2. sync.Mutex — Lock/Unlock как точка синхронизации
	var mu sync.Mutex
	y := 0

	go func() {
		mu.Lock()
		y = 100     // запись под мьютексом
		mu.Unlock() // Unlock happens-before следующего Lock
	}()

	mu.Lock()       // ждёт Unlock в горутине выше
	fmt.Println(y)  // ГАРАНТИРОВАННО 100
	mu.Unlock()

	// 3. sync.WaitGroup — Done happens-before Wait возвращает
	var wg sync.WaitGroup
	z := 0

	wg.Add(1)
	go func() {
		z = 200
		wg.Done() // Done happens-before Wait return
	}()

	wg.Wait()
	fmt.Println(z) // ГАРАНТИРОВАННО 200
}
```

### НЕПРАВИЛЬНО: busy wait без синхронизации

```go
package main

import "fmt"

func main() {
	done := false
	value := 0

	go func() {
		value = 42
		done = true // БЕЗ синхронизации: main может НИКОГДА не увидеть true
	}()

	// НЕПРАВИЛЬНО: busy wait на bool без синхронизации
	// 1. Компилятор может оптимизировать цикл (done никогда не меняется с точки зрения main)
	// 2. CPU может кешировать done, не видя изменения из другого потока
	// 3. Нет гарантии happens-before для value
	for !done {
	}

	fmt.Println(value) // НЕ ГАРАНТИРОВАННО 42!
}
```

### ПРАВИЛЬНО: канал как точка синхронизации

```go
package main

import "fmt"

func main() {
	done := make(chan struct{})
	value := 0

	go func() {
		value = 42
		close(done) // close happens-before receive из закрытого канала
	}()

	<-done         // ждёт закрытия канала
	fmt.Println(value) // ГАРАНТИРОВАННО 42
}
```

> [!WARNING] Правило: нет синхронизации — нет гарантий
> Без явной синхронизации (канал, мьютекс, atomic) **нет никаких гарантий** относительно порядка видимости изменений между горутинами. Даже `time.Sleep` НЕ является синхронизацией!

###### 🏠 Домашнее задание

1. Объясните, почему `time.Sleep(1*time.Second)` не является достаточной синхронизацией.
2. Найдите ошибку в следующем коде и исправьте:
```go
var config *Config
go func() { config = loadConfig() }()
time.Sleep(time.Second)
useConfig(config) // безопасно?
```
3. Нарисуйте граф happens-before для программы с двумя горутинами, каналом и мьютексом.

---

## 16. Профилирование конкурентного кода

### pprof: профиль горутин

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	_ "net/http/pprof" // регистрирует обработчики pprof
	"time"
)

func leakyWorker(id int) {
	ch := make(chan int) // навсегда заблокируется
	<-ch
	_ = id
}

func main() {
	// Запускаем pprof HTTP-сервер
	go func() {
		log.Println(http.ListenAndServe("localhost:6060", nil))
	}()

	// Создаём утечку горутин для демонстрации
	for i := 0; i < 50; i++ {
		go leakyWorker(i)
	}

	fmt.Println("pprof доступен на http://localhost:6060/debug/pprof/")
	fmt.Println("Профиль горутин: http://localhost:6060/debug/pprof/goroutine?debug=1")

	time.Sleep(1 * time.Hour)
}
```

### Команды для анализа

```bash
# Профиль горутин — показывает стеки всех горутин
go tool pprof http://localhost:6060/debug/pprof/goroutine

# В интерактивном режиме pprof:
# top       — топ функций по количеству горутин
# web       — граф вызовов в браузере
# list func — исходный код с аннотациями

# Детектирование утечек горутин
# Сравниваем два снимка:
curl http://localhost:6060/debug/pprof/goroutine?debug=1 > goroutines_before.txt
# ... подождать ...
curl http://localhost:6060/debug/pprof/goroutine?debug=1 > goroutines_after.txt
diff goroutines_before.txt goroutines_after.txt
```

### GODEBUG трассировка

```bash
# Трассировка планировщика (каждую секунду)
GODEBUG=schedtrace=1000 ./myapp

# Вывод:
# SCHED 0ms: gomaxprocs=4 idleprocs=2 threads=5 spinningthreads=1
#   idlethreads=0 runqueue=0 [0 0 0 0]
#
# gomaxprocs    — количество P
# idleprocs     — P без работы
# threads       — общее количество M
# runqueue      — глобальная очередь
# [0 0 0 0]     — локальные очереди каждого P

# Расширенная трассировка GC
GODEBUG=gctrace=1 ./myapp
```

### Тест на утечки горутин

```go
package main

import (
	"runtime"
	"testing"
	"time"
)

func TestNoGoroutineLeak(t *testing.T) {
	before := runtime.NumGoroutine()

	// Вызываем тестируемую функцию
	doWork()

	// Даём горутинам время завершиться
	time.Sleep(100 * time.Millisecond)

	after := runtime.NumGoroutine()

	if after > before+1 { // допускаем +1 на runtime горутины
		t.Errorf("Утечка горутин! До: %d, После: %d", before, after)
	}
}

func doWork() {
	// тестируемая функция
}
```

> [!TIP] Библиотека goleak от Uber
> Для автоматического обнаружения утечек горутин в тестах используйте [go.uber.org/goleak](https://github.com/uber-go/goleak):
> ```go
> func TestMain(m *testing.M) {
> 	goleak.VerifyTestMain(m)
> }
> ```

###### 🏠 Домашнее задание

1. Добавьте `net/http/pprof` в ваш Todo API и проанализируйте горутины через `go tool pprof`.
2. Запустите программу с `GODEBUG=schedtrace=1000` и опишите, что показывают числа в выводе.
3. Напишите тест с `goleak.VerifyNone(t)` для проверки отсутствия утечек горутин.

---

## 17. Сквозной проект: Worker Pool для Todo API

Добавим к Todo API из предыдущих глав систему фоновой обработки задач. При создании todo горутинный пул обрабатывает уведомления асинхронно.

Связанные заметки: [[03-networking]], [[04-databases]], [[06-microservices]]

### Структура проекта

```
todo-api/
├── main.go
├── handler.go
├── worker/
│   └── pool.go         # Worker Pool
├── notification/
│   └── service.go      # Сервис уведомлений
└── go.mod
```

### Worker Pool

```go
// worker/pool.go
package worker

import (
	"context"
	"fmt"
	"log"
	"sync"
)

// Job — задание для обработки
type Job struct {
	ID      string
	Type    string // "email", "push", "webhook"
	Payload any
}

// Pool — пул воркеров для фоновой обработки
type Pool struct {
	jobs       chan Job       // канал заданий (входная очередь)
	numWorkers int           // количество воркеров
	wg         sync.WaitGroup
	handler    func(ctx context.Context, job Job) error // обработчик
}

// NewPool создаёт пул воркеров
func NewPool(numWorkers int, queueSize int, handler func(ctx context.Context, job Job) error) *Pool {
	return &Pool{
		jobs:       make(chan Job, queueSize), // буферизованный канал — очередь
		numWorkers: numWorkers,
		handler:    handler,
	}
}

// Start запускает воркеров. ctx используется для graceful shutdown
func (p *Pool) Start(ctx context.Context) {
	for i := 0; i < p.numWorkers; i++ {
		p.wg.Add(1)
		go p.worker(ctx, i)
	}
	log.Printf("Worker pool запущен: %d воркеров, очередь на %d заданий\n",
		p.numWorkers, cap(p.jobs))
}

// worker — горутина-обработчик
func (p *Pool) worker(ctx context.Context, id int) {
	defer p.wg.Done()
	log.Printf("Воркер %d запущен\n", id)

	for {
		select {
		case <-ctx.Done():
			// Graceful shutdown: обрабатываем оставшиеся задания в очереди
			log.Printf("Воркер %d: получен сигнал остановки, обрабатываю остаток\n", id)
			for {
				select {
				case job, ok := <-p.jobs:
					if !ok {
						log.Printf("Воркер %d остановлен\n", id)
						return
					}
					p.processJob(context.Background(), id, job)
				default:
					log.Printf("Воркер %d: очередь пуста, остановка\n", id)
					return
				}
			}

		case job, ok := <-p.jobs:
			if !ok {
				log.Printf("Воркер %d: канал закрыт, остановка\n", id)
				return
			}
			p.processJob(ctx, id, job)
		}
	}
}

// processJob безопасно обрабатывает задание с recover от panic
func (p *Pool) processJob(ctx context.Context, workerID int, job Job) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Воркер %d: PANIC при обработке задания %s: %v\n",
				workerID, job.ID, r)
		}
	}()

	log.Printf("Воркер %d: обрабатываю задание %s (тип: %s)\n",
		workerID, job.ID, job.Type)

	if err := p.handler(ctx, job); err != nil {
		log.Printf("Воркер %d: ошибка обработки задания %s: %v\n",
			workerID, job.ID, err)
		return
	}

	log.Printf("Воркер %d: задание %s обработано успешно\n", workerID, job.ID)
}

// Submit отправляет задание в очередь. Неблокирующий — возвращает ошибку если очередь полна
func (p *Pool) Submit(job Job) error {
	select {
	case p.jobs <- job:
		return nil
	default:
		return fmt.Errorf("очередь заданий полна (ёмкость: %d)", cap(p.jobs))
	}
}

// Shutdown выполняет graceful shutdown: закрывает канал и ждёт завершения всех воркеров
func (p *Pool) Shutdown() {
	log.Println("Worker pool: начинаю graceful shutdown...")
	close(p.jobs) // сигнализируем воркерам, что новых заданий не будет
	p.wg.Wait()   // ждём завершения всех воркеров
	log.Println("Worker pool: все воркеры остановлены")
}
```

### Сервис уведомлений

```go
// notification/service.go
package notification

import (
	"context"
	"fmt"
	"log"
	"time"
)

// NotificationService обрабатывает уведомления
type NotificationService struct{}

// SendEmail имитирует отправку email
func (s *NotificationService) SendEmail(ctx context.Context, to, subject, body string) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(100 * time.Millisecond): // имитация сетевого вызова
		log.Printf("[Email] Отправлено: to=%s subject=%s\n", to, subject)
		return nil
	}
}

// SendPush имитирует push-уведомление
func (s *NotificationService) SendPush(ctx context.Context, userID, message string) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(50 * time.Millisecond):
		log.Printf("[Push] Отправлено: user=%s msg=%s\n", userID, message)
		return nil
	}
}

// SendWebhook имитирует вызов webhook
func (s *NotificationService) SendWebhook(ctx context.Context, url string, payload any) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(200 * time.Millisecond):
		log.Printf("[Webhook] Отправлено: url=%s payload=%v\n", url, payload)
		return nil
	}
}

// ProcessNotification маршрутизирует уведомление по типу
func (s *NotificationService) ProcessNotification(ctx context.Context, notifType string, payload any) error {
	switch notifType {
	case "email":
		data, ok := payload.(map[string]string)
		if !ok {
			return fmt.Errorf("неверный формат payload для email")
		}
		return s.SendEmail(ctx, data["to"], data["subject"], data["body"])

	case "push":
		data, ok := payload.(map[string]string)
		if !ok {
			return fmt.Errorf("неверный формат payload для push")
		}
		return s.SendPush(ctx, data["user_id"], data["message"])

	case "webhook":
		data, ok := payload.(map[string]string)
		if !ok {
			return fmt.Errorf("неверный формат payload для webhook")
		}
		return s.SendWebhook(ctx, data["url"], payload)

	default:
		return fmt.Errorf("неизвестный тип уведомления: %s", notifType)
	}
}
```

### Интеграция в main.go

```go
// main.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"todo-api/notification"
	"todo-api/worker"
)

func main() {
	// Инициализация сервиса уведомлений
	notifService := &notification.NotificationService{}

	// Создаём Worker Pool: 5 воркеров, очередь на 100 заданий
	ctx, cancel := context.WithCancel(context.Background())
	pool := worker.NewPool(5, 100, func(ctx context.Context, job worker.Job) error {
		return notifService.ProcessNotification(ctx, job.Type, job.Payload)
	})
	pool.Start(ctx)

	// HTTP обработчик создания todo
	mux := http.NewServeMux()
	mux.HandleFunc("POST /todos", func(w http.ResponseWriter, r *http.Request) {
		// ... создание todo в БД (опущено для краткости) ...

		todoID := fmt.Sprintf("todo_%d", time.Now().UnixNano())

		// Отправляем уведомления через Worker Pool (неблокирующий)
		err := pool.Submit(worker.Job{
			ID:   todoID + "_email",
			Type: "email",
			Payload: map[string]string{
				"to":      "user@example.com",
				"subject": "Новая задача создана",
				"body":    "Задача " + todoID + " добавлена в список",
			},
		})
		if err != nil {
			log.Printf("Не удалось отправить email уведомление: %v\n", err)
		}

		err = pool.Submit(worker.Job{
			ID:   todoID + "_push",
			Type: "push",
			Payload: map[string]string{
				"user_id": "user_123",
				"message": "Новая задача: " + todoID,
			},
		})
		if err != nil {
			log.Printf("Не удалось отправить push уведомление: %v\n", err)
		}

		w.WriteHeader(http.StatusCreated)
		fmt.Fprintf(w, `{"id": "%s", "status": "created"}`, todoID)
	})

	// HTTP сервер
	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		log.Printf("Получен сигнал %v, начинаю graceful shutdown...\n", sig)

		// 1. Останавливаем приём новых HTTP-запросов
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("Ошибка shutdown HTTP-сервера: %v\n", err)
		}

		// 2. Отменяем контекст воркеров (они обработают остаток очереди)
		cancel()

		// 3. Ждём завершения всех воркеров
		pool.Shutdown()

		log.Println("Graceful shutdown завершён")
	}()

	log.Println("Todo API запущен на :8080")
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("Ошибка HTTP-сервера: %v\n", err)
	}
}
```

### Graceful shutdown — последовательность

```
1. Получен SIGINT/SIGTERM
   │
2. HTTP Server.Shutdown() — перестаём принимать новые запросы,
   │                         ждём завершения текущих
3. cancel() — отменяем контекст воркеров
   │
4. Воркеры получают <-ctx.Done(), обрабатывают оставшиеся задания из канала
   │
5. pool.Shutdown() → close(jobs) + wg.Wait()
   │
6. Все горутины завершены, процесс выходит корректно
```

> [!TIP] Ключевые принципы graceful shutdown
> 1. **Перестать принимать новую работу** (закрыть HTTP-сервер)
> 2. **Дождаться завершения текущей работы** (обработать очередь)
> 3. **Освободить ресурсы** (закрыть подключения к БД, файлы)
> 4. **Установить таймаут** — если shutdown занимает слишком долго, принудительно завершить

###### 🏠 Домашнее задание

1. Добавьте метрики к Worker Pool: количество обработанных заданий, среднее время обработки, количество ошибок. Используйте `atomic.Int64` для счётчиков.
2. Реализуйте retry с экспоненциальным backoff для неудачных заданий (максимум 3 попытки).
3. Добавьте dead letter queue — задания, которые не удалось обработать после всех retry, сохраняются в отдельную очередь.
4. Реализуйте динамическое масштабирование пула: если очередь растёт — добавляем воркеров, если пустеет — убираем.
5. Напишите integration-тест, который проверяет graceful shutdown: отправляет задания, инициирует shutdown и проверяет, что все задания обработаны.

---

## Итого

> [!summary] Ключевые выводы главы
> 1. **Конкурентность != параллелизм**. Конкурентность — структура программы, параллелизм — исполнение
> 2. **Горутины дешёвые** (~2 КБ стек). Используйте их свободно, но всегда обеспечивайте завершение
> 3. **Каналы для коммуникации**, мьютексы для защиты состояния. Выбирайте по ситуации
> 4. **Всегда используйте context** для управления жизненным циклом горутин
> 5. **defer cancel()** — всегда вызывайте cancel для контекстов
> 6. **go test -race** — запускайте детектор гонок в CI/CD
> 7. **Горутина-утечка** — самая частая проблема. Используйте goleak в тестах
> 8. **Graceful shutdown** — обрабатывайте SIGINT/SIGTERM, дожидайтесь завершения горутин

### Рекомендуемая литература

- Rob Pike: "Concurrency is not Parallelism" (доклад)
- Go Blog: "Go Concurrency Patterns"
- Go Blog: "Advanced Go Concurrency Patterns"
- Go Blog: "Share Memory By Communicating"
- Go Memory Model: go.dev/ref/mem
- Bryan C. Mills: "Rethinking Classical Concurrency Patterns" (GopherCon 2018)

Далее: [[06-microservices]] — микросервисы, gRPC, брокеры сообщений и распределённые системы.
