
# Основы

## Введение

Его преимущества: 

1. Он крайне прост в чтении и понимании
   ![](../../_png/Pasted%20image%2020260411075722.png)
2. У него крайне широкая стандартная библиотека
   ![](../../_png/Pasted%20image%2020260411082143.png)
3. Он крайне производительный
   ![](../../_png/Pasted%20image%2020260411082204.png)
4. У него большая экосистема
   ![](../../_png/Pasted%20image%2020260411082231.png)
5. В итоге, после сборки, мы получаем маленький бинарник, в котором находится полный рантайм и рабочее приложение
   ![](../../_png/Pasted%20image%2020260411082247.png)
6. Строгая статическая типизация
   ![](../../_png/Pasted%20image%2020260411082306.png)
7. Прозрачная работа с ошибками. Является такой же переменной
   ![](../../_png/Pasted%20image%2020260411082322.png)
8. Встроенные инструменты тестирования и форматирования
   ![](../../_png/Pasted%20image%2020260411082342.png)

## Переменные и типы

### Первое приложение

Чтобы создать первое приложение, достаточно просто создать `.go` файл и в его самое начало поместить пакет `main`. 

После этого, нужно создать функцию `main`, которая является entry-поинтом приложения. 

`main.go`
```GO
package main;

import "fmt";

func main() {
	fmt.Printf("Hello!");
}
```

И далее через команду `go run` запускаем файл.

```bash
> go run main.go
Hello!
```

### Пакеты и модули

Пакеты - это способ разделения нашего приложения на разные части, что позволяет изолировать функциональность друг от друга и упростить поддержку. 

![](../../_png/Pasted%20image%2020260411082430.png)

Виды пакетов: 

- main - обязательный пакет, который является точкой входа в приложение
- `services /` `something / ` - наши собственные модули, в которые можем сложить всю переиспользуемую логику
- `import "fmt"`, `import "strings"` - это пакеты из стандартной библиотеки go
- `github.io/anybody/something` - это пакеты из внешних репозиториев. Их пакетный менеджер Go может стянуть прямо из любого доступного git-based репозитория.

Каждый файл в приложении обязан находиться в каком-либо пакете. 

![](../../_png/Pasted%20image%2020260411082459.png)

### Модули

Пакет позволяет реализовать модульность в кодовой базе, но не является сам по себе модулем. 

Модуль - это отдельная часть приложения со своими пакетами. Наше приложение - это app модуль со своими пакетами. Внешние зависимости - это отдельные модули со своими пакетами. 

![](../../_png/Pasted%20image%2020260411084647.png)

Сама сборка приложения без оборачивания текущего репозитория в модуль - упадёт. 

Поэтому, перед работой с приложением, его нужно проинициализировать, как модуль: 

```bash
# локально
go mod init demo/app-1

# если будет являться пакетом
go mod init github.com/ZeiZel/gomple
```

Имя модуля выбираем по назначению: 

- если приложение локальное, то имя может быть любым
- если приложение будет публиковаться, как пакет, то обязательно нужно указать имя репозитория, пользователя и самого пакета

В итоге получится такой файл: 

`go.mod`
```mod
module github.com/ZeiZel/gomple
  
go 1.26.1
```

И теперь мы сможем собрать наше приложение в один бинарник

```bash
go build
```

После чего получим all-in-one бинарник сразу со всем нужным рантаймом, который можно будет запустить на любой системе. 

```bash
> ./gomple       

Hello!%
```

### Переменные и значения

Напишем небольшой калькулятор ИМТ

![](../../_png/Pasted%20image%2020260411090112.png)

`var` - способ объявления переменной

`main.go`
```go
package main;

func main() {
	var userHeight = 1.8; // float64
	var userWeight = 84; // int
	var IMT = userWeight / userHeight; // error
}
```

Эта программа выведет ошибку, так как мы не можем работать сразу с разными типами данных.

### Типы

Каждая переменная автоматически при первом присвоении данных в переменную, уже будет иметь определённый тип данных и поэтому в прошлом примере на переменной IMT вылезла ошибка. 

Как можно решить эту проблему: 

```go
// 1 - сразу указать явно тип переменной
var userWeight float64 = 84;

// 2 - указать сразу правильную переменную
var userWeight = 84.0;

// 3 - привести к float64 через отдельную конструкцию
var IMT = userWeight / math.Pow(float64(userHeight), 2);
```



`main.go`
```go
package main;

import (
	"fmt"
	"math"
);

func main() {
	var userHeight = 1.8;
	var userWeight float64 = 84;
	var IMT = userWeight / math.Pow(userHeight, 2);
	fmt.Print(IMT);
}
```

Запускаем

```bash
> go run ./main.go

25.925925925925924
```


### Варианты записи переменных

`var` мы используем в нескольких случаях: 

1. Мы объявляем переменную вне `func`
2. Мы объявляем переменную без значения инициализатора `var userWeight float64`, но тогда обязательно нужно указать тип
3. Мы хотим явно протипизировать значение `var userWeight float64 = 84;`

В остальных случаях достаточно использовать быстрое присвоение через `:=`, который всегда выводит тип из значения и может находиться только в функциях

```go
package main  
  
import (  
    "fmt"  
    "math"
)  
  
func main() {  
    userHeight := 1.8  
    userWeight := 84.0  
    var IMT = userWeight / math.Pow(userHeight, 2)  
    fmt.Print(IMT)  
}
```

Ну и так же множественное присвоение доступно для любого из подхода в записи: 

```go
// множественное присвоение для var
var (  
    userHeight         = 1.8  
    userWeight float64 = 84  
)

// множественное присвоение для :=
userHeight, userWeight := 1.8, 84
```

### Константы

Когда мы пользуемся обычными переменными, мы можем переприсваивать значение, сколько захотим раз

`main.go`
```go
userHeight := 1.8  
userHeight = 1.9

userWeight := 84.0  
var IMT = userWeight / math.Pow(userHeight, 2)  
fmt.Print(IMT)  
```

Но когда мы пользуемся константами, мы получаем значение, которое не можем далее изменить по коду. Это неизменяемое значение

```go
package main  
  
import (  
    "fmt"  
    "math"
)  

const IMTHeightPower = 2
  
func main() {  
    userHeight := 1.8  
    userWeight := 84.0  
    var IMT = userWeight / math.Pow(userHeight, IMTHeightPower)  
    fmt.Print(IMT)  
}
```

Так же особенностью константы является то, что она при выводе типа, получает `untyped <type>`. То есть при присвоении значения из `int` диапазона, оно будет подстраиваться под то место, куда мы передадим это значение. 
Например, `math.Pow` принимает в качестве аргументов `float64` значения. Когда мы передадим туда константу с автовыведенным `int`, то `int` для этого вхождения заменится на `float64`.  

## Строки и функции

### Ввод

- `\n` - позволяет перенести строку
- Метод `Scan` - позволяет получить ввод от пользователя. В него нужно передавать не просто переменную, а `&` указатель на эти данные

`main.go`
```Go
package main  
  
import (  
    "fmt"  
    "math"
)  
  
func main() {  
    var userHeight float64  
    var userWeight float64  
    fmt.Print("__ Калькулятор ИМТ __ \n")  
    fmt.Print("Введите свой рост в метрах: ")  
    fmt.Scan(&userHeight)  
    fmt.Print("Введите свой вес: ")  
    fmt.Scan(&userWeight)  
    var IMT = userWeight / math.Pow(userHeight, 2)  
    fmt.Print("Ваш ИМТ: ", IMT)  
}
```

И в конце получаем приятный вывод в консоли:

```bash
> go build && ./gomple 

__ Калькулятор ИМТ __ 
Введите свой рост в метрах: 1.79
Введите свой вес: 100
Ваш ИМТ: 31.210012171904747%  
```

### Форматирование

Далее прокачаем наше приложение и доработаем его некоторым образом: 

1. Вместо использования `\n` для переноса строки, мы можем использовать `Println`, который сразу перенесёт строку
2. Метод `Printf` позволяет вывести отформатированную строку. 
	1. `%v` - это базовый шаблон в строке, который позволит вставить `v` - variable 
	2. `%.0f` - постфикс `f` отвечает за работу с `float` значениями, где мы говорим, что хотим точность в `.0` (одно) число после запятой

```go
package main  
  
import (  
    "fmt"  
    "math"
)  
  
func main() {  
    var userHeight float64  
    var userWeight float64  
    fmt.Println("__ Калькулятор ИМТ __")  
    fmt.Print("Введите свой рост в см: ")  
    fmt.Scan(&userHeight)  
    fmt.Print("Введите свой вес: ")  
    fmt.Scan(&userWeight)  
    var IMT = userWeight / math.Pow(userHeight/100, 2)  
    fmt.Printf("Ваш ИМТ: %.0f", IMT)  
}
```

```bash
> go build && ./gomple

__ Калькулятор ИМТ __
Введите свой рост в см: 190
Введите свой вес: 100
Ваш ИМТ: 28
```

### Многострочные

Многосрочные выражения записываются через использование обратной одинарной кавычки. Все табы, переносы, пробелы применяются в рамках неё as is. Модификаторы строк не применяются (`\n`). 

`main.go`
```go
    fmt.Printf(`__ Калькулятор ИМТ __  
Введите свой рост в см: %.1f `, 12.2)
```

### Создание форматированных строк

Чтобы сохранять результаты вывода и форматирования, можно пользоваться теми же самыми методами из `fmt` для вывода, но с префиксом `S`

`main.go`
```go
package main  
  
import (  
    "fmt"  
    "math")  
  
func main() {  
    var userHeight float64  
    var userWeight float64  
    fmt.Println("__ Калькулятор ИМТ __")  
    fmt.Print("Введите свой рост в см: ")  
    fmt.Scan(&userHeight)  
    fmt.Print("Введите свой вес: ")  
    fmt.Scan(&userWeight)  
    var IMT = userWeight / math.Pow(userHeight/100, 2)  
    result := fmt.Sprintf("Ваш ИМТ: %.0f", IMT)  
    fmt.Println(result)  
}
```

### Создание функции

Функция `main` является базовой в любом Go приложении и она вызывается сразу. 

Создаются новые функции аналогично `main`, только уже в них мы можем передавать аргументы. 

`main.go`
```go
package main  
  
import (  
    "fmt"  
    "math")  
  
func main() {  
    var userHeight float64  
    var userWeight float64  
    fmt.Println("__ Калькулятор ИМТ __")  
    fmt.Print("Введите свой рост в см: ")  
    fmt.Scan(&userHeight)  
    fmt.Print("Введите свой вес: ")  
    fmt.Scan(&userWeight)  
    var IMT = userWeight / math.Pow(userHeight/100, 2)  
    outputResult(IMT)  
}  

// func outputResult(imt, floatNumber float64) 
// func outputResult(imt float64, someString string) 
func outputResult(imt float64) {  
    result := fmt.Sprintf("Ваш ИМТ: %.0f", imt)  
    fmt.Println(result)  
}
```

### Возвращение значения

Чтобы вернуть значение из функции, нужно воспользоваться ключевым словом `return` и указать, какие данные должна возвращать эта функция

`main.go`
```go
package main  
  
import (  
    "fmt"  
    "math")  
  
const IMTPower = 2  
  
func main() {  
    var userHeight float64  
    var userWeight float64  
    fmt.Println("__ Калькулятор ИМТ __")  
    fmt.Print("Введите свой рост в см: ")  
    fmt.Scan(&userHeight)  
    fmt.Print("Введите свой вес: ")  
    fmt.Scan(&userWeight)  
    IMT := calculateIMT(userWeight, userHeight)  
    outputResult(IMT)  
}  
  
func outputResult(imt float64) {  
    result := fmt.Sprintf("Ваш ИМТ: %.0f", imt)  
    fmt.Println(result)  
}  
  
// возвращает float64
func calculateIMT(weight, height float64) float64 {  
    // сразу считаем и возвращаем результат
    return weight / math.Pow(height/100, IMTPower)  
}
```

```bash
> go run ./main.go 

__ Калькулятор ИМТ __
Введите свой рост в см: 128
Введите свой вес: 128
Ваш ИМТ: 78
```

#### Несколько значений возврата строки

Так же функция может вернуть сразу несколько значений. Для этого нам нужно: 

1. Объявить в результате функции несколько типов `(float64, float64)`
2. Вернуть в return значения через запятую

`main.go`
```go
package main  
  
import (  
    "fmt"  
    "math")  
  
const IMTPower = 2  
  
func main() {  
    fmt.Println("__ Калькулятор ИМТ __")  
    userWeight, userHeight := getUserInput()  
  
    IMT := calculateIMT(userWeight, userHeight)  
    outputResult(IMT)  
}  
  
func outputResult(imt float64) {  
    result := fmt.Sprintf("Ваш ИМТ: %.0f", imt)  
    fmt.Println(result)  
}  
  
func calculateIMT(weight, height float64) float64 {  
    return weight / math.Pow(height/100, IMTPower)  
}  
  
func getUserInput() (float64, float64) {  
    var userHeight float64  
    var userWeight float64  
  
    fmt.Print("Введите свой рост в см: ")  
    fmt.Scan(&userHeight)  
    fmt.Print("Введите свой вес: ")  
    fmt.Scan(&userWeight)  
  
    return userWeight, userHeight  
}
```

### Scope функций

- Скоупом функции является всё, что находится в `{}`.
- Вызывать функции можно только в рамках других функций. 

Так же в Go есть альтернативная запись возврата значения, когда мы при объявлении возвращаемого типа определяем переменную и сразу в коде меняем её значение. В конце останется просто оставить `return` без его явного использования. 

```go
func calculateIMT(weight, height float64) (IMT float64) {  
    IMT = weight / math.Pow(height/100, IMTPower)  
    return  
}
```

## Управление потоком

### Типы данных

![](../../_png/Pasted%20image%2020260411200105.png)

![](../../_png/Pasted%20image%2020260411202043.png)

![](../../_png/Pasted%20image%2020260411202204.png)

### If

Конструкция `if` позволяет реализовать нам базовое ветвление, при котором мы передаём условие и в теле условия выполняем операцию, если условие `true`

`main.go`
```Go
func main() {
	fmt.Println("__ Калькулятор ИМТ __")
	userWeight, userHeight := getUserInput()

	IMT := calculateIMT(userWeight, userHeight)

	// условие
	isLean := IMT < 16

	// если ИМТ меньше 16, то сделаем вывод в консоль
	if isLean {
		fmt.Println("У вас слишком малый вес")
	}

	outputResult(IMT)
}
```

И далее выводим оценку

```bash
> go run ./main.go

__ Калькулятор ИМТ __
Введите свой рост в см: 195
Введите свой вес: 54
У вас слишком малый вес
Ваш ИМТ: 14
```

### Булева логика

Логическое И - оба условия верны, то только тогда true

![](../../_png/Pasted%20image%2020260413164934.png)

Логическое ИЛИ - если хотя бы одно true, то вернём true

![](../../_png/Pasted%20image%2020260413165000.png)

Логическое отрицание - инвертируем ответ

![](../../_png/Pasted%20image%2020260413165021.png)

### else if

Конструкция `else if` позволяет проверить дополнительное условие в том случае, если предыдущее не выполнилось, так как там условие было false. `else if` не выполнится, если предыдущее условие выполнилось. 

`main.go`
```go
func main() {
	fmt.Println("__ Калькулятор ИМТ __")
	userWeight, userHeight := getUserInput()

	IMT := calculateIMT(userWeight, userHeight)

	if IMT < 16 {
		fmt.Println("У вас слишком малый вес")
	} else if IMT <= 18.5 {
		fmt.Println("У вас средний недостаточный вес")
	} else {
		fmt.Println("У вас избыточный вес")
	}

	outputResult(IMT)
}
```

### Switch

Конструкция `switch-case` позволяет проверить равность значения или правдивость условия и выполнить операцию внутри блока

`main.go`
```go
func main() {
	fmt.Println("__ Калькулятор ИМТ __")
	userWeight, userHeight := getUserInput()

	IMT := calculateIMT(userWeight, userHeight)

	// проверяем, если IMT = определённому значению, то выполняем операцию
	switch IMT {
	case 1:
		fmt.Println("Ваш индекс массы тела равен 1")
	case 2:
		fmt.Println("Ваш индекс массы тела равен 2")
	}

	// если в switch не указать значение, то в case можно проверять условия и выполнять код в блоке
	switch {
	case IMT < 16:
		fmt.Println("У вас слишком малый вес")
	case IMT >= 16:
		fmt.Println("Ваш ИМТ чуть лучше плохого")
	}

	if IMT < 16 {
		fmt.Println("У вас слишком малый вес")
	} else if IMT <= 18.5 {
		fmt.Println("У вас средний недостаточный вес")
	} else {
		fmt.Println("У вас избыточный вес")
	}

	outputResult(IMT)
}
```

### Циклы

В отличие от других ЯПов, в GO существует только один вид цикла - for. С помощью него можно сделать любые переборы 

![](../../_png/Pasted%20image%2020260413170601.png)

Классическая запись цикла `for`. Прямо сейчас она выведет 10 чисел: от 0 до 9. 

```go
for i := 0; i < 10; i++ {
	fmt.Printf("%d\n", i)
}
```

```bash
> go run ./main.go

0
1
2
3
4
5
6
7
8
9
```

Тут `for` будет выполняться пока условие не станет `false`. Грубо говоря, это аналог `while` из других языков.  

```go
var i int = 0; 

for i < 10 {
	fmt.Printf("%d\n", i)
	i++
}
```

А такая запись образует бесконечный цикл, так как тут нет никаких условий. 

```go
for {
	fmt.Printf("%d\n", i)
}
```

### break и continue

Так же, если нам нужно модифицировать прохождение циклов и управлять ими, то мы можем воспользоваться: 

- `continue` - оператор, который пропустит выполнение цикла в данной итерации
- `break` - остановит выполнение цикла

`main.go`
```go
for i := 0; i < 10; i++ {
	if i%2 == 0 {
		continue
	}

	fmt.Printf("%d\n", i)

	if i == 7 {
		fmt.Println("loop breaked")
		break
	}
}
```

```bash
❯ go run ./main.go
1
3
5
7
loop breaked
```

#### Повторение ввода



`main.go`
```go
package main

import (
	"fmt"
	"math"
)

const IMTPower = 2

func main() {
	fmt.Println("__ Калькулятор ИМТ __")

	for {
		userWeight, userHeight := getUserInput()
		IMT := calculateIMT(userWeight, userHeight)
		outputResult(IMT)

		isUserChoiceContinue := selectUserChice()

		if !isUserChoiceContinue {
			break
		}
	}
}

func selectUserChice() bool {
	fmt.Println("Хотите ли вы продолжить ввод? y/n")

	isContinue := ""

	for {
		fmt.Scan(&isContinue)

		if isContinue == "y" || isContinue == "Y" {
			fmt.Println("Повтор")
			return true
		} else if isContinue == "n" {
			fmt.Println("До свидания")
			return false
		} else {
			fmt.Println("Введено неверное значение")
			continue
		}
	}
}

func outputResult(imt float64) {
	switch {
	case imt < 16:
		fmt.Println()
	case imt >= 16:
		fmt.Println("Ваш ИМТ чуть лучше плохого")
	}
}

func calculateIMT(weight, height float64) (IMT float64) {
	IMT = weight / math.Pow(height/100, IMTPower)
	return IMT
}

func getUserInput() (float64, float64) {
	var userHeight float64
	var userWeight float64

	fmt.Print("Введите свой рост в см: ")
	fmt.Scan(&userHeight)
	fmt.Print("Введите свой вес: ")
	fmt.Scan(&userWeight)

	return userWeight, userHeight
}
```



```bash
> go run ./main.go

__ Калькулятор ИМТ __
Введите свой рост в см: 190
Введите свой вес: 100
Ваш ИМТ чуть лучше плохого
Хотите ли вы продолжить ввод? y/n
sdf
Введено неверное значение
dsf
Введено неверное значение
sdf
Введено неверное значение
e
Введено неверное значение
Y
Повтор
Введите свой рост в см: 190
Введите свой вес: 100
Ваш ИМТ чуть лучше плохого
Хотите ли вы продолжить ввод? y/n
y
Повтор
Введите свой рост в см: 190
Введите свой вес: 90
Ваш ИМТ чуть лучше плохого
Хотите ли вы продолжить ввод? y/n
n
До свидания
```

### Error

Ошибка в Go - это такое же значение, как и любое другое, которое возвращает функция. Его обязательно нужно обрабатывать. 

Для работы с ошибками в Go используется библиотека `errors`. С помощью неё можно создать инстанс ошибки через функцию `New`, которая принимает в себя ошибку формата UPPER_CASE. 

- `nil` - это значение, которое говорит об "отсутствии значения"
- Обычно, ошибки возвращают последним значением из функции. 

`main.go`
```Go
func main() {
	fmt.Println("__ Калькулятор ИМТ __")

	for {
		userWeight, userHeight := getUserInput()
		
		// получаем ошибку вторым аргументом
		IMT, err := calculateIMT(userWeight, userHeight)
		// обрабатываем ошибку
		if err != nil {
			fmt.Println(err)
			continue
		}

		outputResult(IMT)

		isUserChoiceContinue := selectUserChice()

		if !isUserChoiceContinue {
			break
		}
	}
}

func calculateIMT(weight, height float64) (float64, error) {
	// если пользователь ввёл не числа, а любые другие символы или значения меньше нуля
	if weight <= 0 || height <= 0 {
		// то вернём нулевой ИМТ и ошибку
		return 0, errors.New("VALUES_MUST_BE_EXISTED")
	}
	
	IMT := weight / math.Pow(height/100, IMTPower)
	
	// а если всё хорошо, то вернём nil
	return IMT, nil
}
```



```bash
> go run ./main.go

__ Калькулятор ИМТ __
Введите свой рост в см: d
Введите свой вес: d
VALUES_MUST_BE_EXISTED
Введите свой рост в см: asdasd
Введите свой вес: VALUES_MUST_BE_EXISTED
Введите свой рост в см: Введите свой вес: VALUES_MUST_BE_EXISTED
Введите свой рост в см: Введите свой вес: VALUES_MUST_BE_EXISTED
Введите свой рост в см: 190
Введите свой вес: 100
Ваш ИМТ чуть лучше плохого
Хотите ли вы продолжить ввод? y/n
```

Если нам нужно проигнорировать ошибку (или любую другую возвращаемую переменную), то мы можем просто указать её с `_` нижнего подчёркивания и она будет игнорироваться. 

```go
IMT, _ := calculateIMT(userWeight, userHeight)
```

### Panic

`panic` - это механизм экстренного выхода из приложения с nonzero stdout value. 

Таким экстренным выводом нам стоит пользоваться, когда приложение не может продолжать работу. 

Зачастую, этим стоит пользоваться в консольных утилитах. В API же достаточно обрабатывать ошибки и возвращать ответ. 

`main.go`
```go
func main() {
	fmt.Println("__ Калькулятор ИМТ __")

	for {
		userWeight, userHeight := getUserInput()
		IMT, err := calculateIMT(userWeight, userHeight)
		if err != nil {
			// fmt.Println(err)
			// continue

			panic("Произошла ошибка ввода данных")
		}

		outputResult(IMT)

		isUserChoiceContinue := selectUserChice()

		if !isUserChoiceContinue {
			break
		}
	}
}

```

В выводе мы получим ошибку с указанием `пакет.функция` места ошибки

```bash
> go run ./main.go

__ Калькулятор ИМТ __
Введите свой рост в см: asd
Введите свой вес: panic: Произошла ошибка ввода данных

goroutine 1 [running]:
main.main()
        /Users/zeizel/projects/go/main.go:21 +0x84
exit status 2
```



## Array и Slice

### Массивы

Массив - это объединение однотипных данных, которые кладутся в свою ячейку памяти и им присваивается свой определённый индекс. 

![](../../_png/Pasted%20image%2020260413191540.png)

Объявление массива происходит через присвоение конструкции `[<длина>]<тип>{<значения...>}`

```go
package main

func main() {
	var transactions [3]int
	transactions = [3]int{1, 2, 3}
	banks := [4]string{"Tinkoff", "Alfa", "Sber", "Sovcombank"}
}
```

### Работа с массивами

`Println` умеет выводить массивы. Если мы выделим больше памяти под массив, но не зададим все значения, то у нас значения будут проставлены их дефолты (для int - 0, для string - "")

`main.go`
```Go
package main

import "fmt"

func main() {
	transactions := [3]int{1, 2}
	banks := [4]string{"Tinkoff", "Alfa"}

	fmt.Println(transactions)
	fmt.Println(banks)

	// обращаемся к значению
	fmt.Println(transactions[0])

	// меняем значение
	banks[0] = "Точка"

	fmt.Println(banks)
}
```

И такой вывод будет:

```bash
> go run ./main.go

[1 2 0]
[Tinkoff Alfa  ]
1
[Точка Alfa  ]
```

### slice

Механизм slice позволяет нам взять из массива только определённый диапазон значений: 

- 1 - это начальный индекс, который мы берём
- 3 - это конечный индекс, до которого не включительно мы берём значение

![](../../_png/Pasted%20image%2020260413200042.png)

```go
func main() {
	// базовый массив
	transactions := [5]int{1, 2, 3, 4, 5}

	fmt.Println(transactions)

	// слайсы от базы
	slice := transactions[1:3]
	fromToEnd := transactions[1:]
	startTo := transactions[:4]
	all := transactions[:]

	fmt.Println(slice)
	fmt.Println(fromToEnd)
	fmt.Println(startTo)
	fmt.Println(all)
}
```

```bash
> go run ./main.go

[1 2 3 4 5]
[2 3]
[2 3 4 5]
[1 2 3 4]
[1 2 3 4 5]
```

### Cap и Len

Слайсы имеют другую природу работы с массивами в Go. 

Когда мы просто присваиваем другой переменной наш массив, мы копируем массив из одной ячейки памяти в другую. Таким образом мы удваиваем занятое место в памяти, что может быть не всегда эффективно. 

Когда мы применяем `slice`, то место мы уже используем более эффективно, так как мы создаём определённое окошко на данные, с которыми будет работать разработчик. 

Но представим такую ситуацию, что мы создадим ещё один слайс поверх нашего слайса, как в примере. `transactionsNewPartial` будет слайсом над слайсом `transactionsPartial`, в которой будет только один элемент. Сам по себе `transactionsNewPartial` работает сейчас с отдельной ячейкой от оригинального массива. Однако, если мы решим вывести вместимость (`cap`) и длину (`len`), то увидим разные значения - длина `transactionsNewPartial` будет равна 1, а вместимость `4`

`main.go`
```go
package main

import "fmt"

func main() {
	// базовый массив
	transactions := [5]int{1, 2, 3, 4, 5}

	// переприсваиваем этот массив
	transactionsNew := transactions
	transactionsNew[0] = 30 // и меняем значение

	fmt.Println(transactions)    // оригинальный массив [1 2 3 4 5]
	fmt.Println(transactionsNew) // его копия           [30 2 3 4 5]

	transactionsPartial := transactions[1:] // берём слайс
	transactionsPartial[0] = 120 // присваиваем другое значение

	fmt.Println(transactions)        // [1 120 3 4 5]
	fmt.Println(transactionsPartial) // [120 3 4 5]

	transactionsNewPartial := transactionsPartial[:1]
	transactionsNewPartial[0] = 150

	fmt.Println(transactions)           // [1 150 3 4 5]
	fmt.Println(transactionsNewPartial) // [ 150 ]
	fmt.Println("transactions", len(transactionsNewPartial), cap(transactionsNewPartial)) // 1 4
	fmt.Println("transactionsNewPartial", len(transactionsNewPartial), cap(transactionsNewPartial)) // 1 4

	// переприсвоим слайсу самого себя, но увиличим окно под capacity 
	transactionsNewPartial = transactionsNewPartial[0:4]

	fmt.Println("transactionsNewPartial: restored", len(transactionsNewPartial), cap(transactionsNewPartial)) // 4 4
}
```

```bash
> go run ./main.go

[1 2 3 4 5]
[30 2 3 4 5]
[1 120 3 4 5]
[120 3 4 5]
[1 150 3 4 5]
[150]
transactions 1 4
transactionsNewPartial 1 4
transactionsNewPartial: restored 4 4
```

По сути: 

- `len` - это длина текущего инстанса, который у нас на руках (длина окошка, длина самого массива)
- `cap` - это потенциальная вместимость данного элемента

`cap` показывает реальную вместимость данного элемента, включая слайсы. Но показывает он только вместимость, которая идёт слева направо (от стартовой точки слайса и до самого конца массива, не включая выбранный участок). 

В примере с `transactionsNewPartial`, мы смогли увеличить его окно за счёт capacity его родителя-ссылки, который хранил эту вместимость. Так как мы сделали слайс в `transactionsNewPartial` с 0 до 1 элемента, то у нашего родителя `transactionsPartial` осталась его прошлая вместимость справа (после 1 индекса) ещё в 3 элемента, что оставило нам пул, который мы смогли вернуть `transactionsNewPartial`. 

![](../../_png/Pasted%20image%2020260413201752.png)

### Динамические массивы

Динамические массивы в Go реализованы за счёт слайсов. При начальной инициализации массива, мы обязаны опустить длину массива (не указывать её). Таким образом мы создадим сразу слайс. Затем, с помощью функции `append`, мы сможем добавить новый элемент в массив. 

Сам `append` смотрит на capacity массива и, если его не хватает, то сначала увеличивает вместимость, а потом уже добавляет элемент.

```Go
package main  
  
import "fmt"  
  
func main() {  
    transactions := []int{1, 2, 3, 4, 5}  
    newTransactions := append(transactions, 4)  
  
    fmt.Println(transactions)  
    fmt.Println(newTransactions)  
}
```

```bash
> go run ./main.go 

[1 2 3 4 5]
[1 2 3 4 5 4]
```

Если мы хотим просто расширить наш массив со слайсом, то мы можем просто переприсвоить к старому массиву новый из `append`

```Go
package main  
  
import "fmt"  
  
func main() {  
    transactions := []int{1, 2, 3, 4, 5}  
    transactions = append(transactions, 4)  
  
    fmt.Println(transactions)  
}
```

Однако нужно отметить, что `append` создаёт новый указатель на новый массив в памяти, поэтому если мы через него увеличим старый массив, то ссылка оборвётся

То есть в этом примере мы создаём `temp` переменную из слайса `transactions`, где второй мы расширили через `append` и вместо того, чтобы в `temp` у нас появился новый элемент, мы получаем два разных массива. Теперь в обеих переменных указатели на разные массивы

```Go
package main  
  
import "fmt"  
  
func main() {  
    transactions := []int{1, 2, 3, 4, 5}  
    temp := transactions  
    transactions = append(transactions, 4)  
  
    fmt.Println(temp)  
    fmt.Println(transactions)  
}
```

```bash
go run ./main.go 
[1 2 3 4 5]
[1 2 3 4 5 4]
```

Так же `append` позволяет добавить сразу несколько значений

```Go
package main  
  
import "fmt"  
  
func main() {  
    transactions := []int{1, 2, 3, 4, 5}  
    transactions = append(transactions, 4, 5, 6, 7)
}
```

#### Unpack

А если нам нужно смёрджить другой слайс в наш, то тут поможет `unpack` синтаксис, который деструктуризирует массив и применит его как список аргументов через запятую

```Go

func main() {  
    transactions := []int{1, 2, 3, 4, 5}  
    transactions2 := []int{6, 7, 8}  
    transactions = append(transactions, transactions2...)
}
```

#### массив транзакций

Пример задания массива транзакций

`main.go`
```Go
package main  
  
import "fmt"  
  
func main() {  
    var transactions []float64  
  
    for {  
       transaction := scanTransaction()  
  
       if transaction == 0 {  
          break  
       }  
  
       transactions = append(transactions, transaction)  
    }  
  
    fmt.Println(transactions)  
}  
  
func scanTransaction() float64 {  
    var transaction float64  
    fmt.Print("Введите транзакцию: ")  
    fmt.Scan(&transaction)  
    return transaction  
}
```

### циклы по массивам



`main.go`
```Go
func main() {
	tr1 := []int{1,2,3,4,5}
	
	for index, value := range tr1 {
		fmt.Println(index, value)
	}
}
```

```bash
> go run ./main.go 

0 1
1 2
2 3
3 4
4 5
```

#### Рассчёт баланса



`main.go`
```Go
package main  
  
import "fmt"  
  
func main() {  
    var transactions []float64  
    var sum float64  
  
    for {  
       transaction := scanTransaction()  
  
       if transaction == 0 {  
          break  
       }  
  
       transactions = append(transactions, transaction)  
    }  
  
    for _, transaction := range transactions {  
       sum += transaction  
    }  
  
    fmt.Println(sum)  
}  
  
func scanTransaction() float64 {  
    var transaction float64  
    fmt.Print("Введите транзакцию: ")  
    fmt.Scan(&transaction)  
    return transaction  
}
```

```bash
> go run ./main.go 

Введите транзакцию: 12
Введите транзакцию: 20
Введите транзакцию: -30
Введите транзакцию: 40
Введите транзакцию: 100
Введите транзакцию: n
142
```

### Make

Операция `append` в Go каждый раз проводит операцию увеличения пространства. Она сильно медленнее, чем просто добавление нового элемента в массив. Поэтому есть метод создания массива сразу с определённым capacity, что ускоряет запись

Операция `make` позволит создать слайс с массивом, у которого уже заранее будет предопределено capacity фиксированного размера. 

Первым аргументом мы передаём тип массива, который нам нужно будет создать. Вторым аргументом определяется количество начальных значений + capacity. Дефолтно устанавливаются начальные значения под выбранный тип. Сам `make` возвращает слайс. 

```Go
tr1 := make([]string, 2) // получим ["", ""]
tr1 = append(tr1, "1") // получим ["", "", "1"], так как значения уже были 
```

Третим аргументом задаётся максимальный capacity, с которым создаётся slice

```Go
tr1 := make([]string, 0, 2) // получим [2]int{}
tr1 = append(tr1, "1") // ["1"] 
```

Однако, если мы выйдёт за пределы capacity, то наш массив станет сразу из capacity 2 в 4 из-за особенностей **увеличения cap**

```Go
package main  
  
import "fmt"  
  
func main() {  
    tr := make([]string, 0, 2)  
    fmt.Println(len(tr), cap(tr))  
    tr = append(tr, "1")  
    fmt.Println(len(tr), cap(tr))  
    tr = append(tr, "2")  
    fmt.Println(len(tr), cap(tr))  
    tr = append(tr, "3")  
    fmt.Println(len(tr), cap(tr))  
    fmt.Println(tr)  
}
```

```bash
> go run ./main.go 

0 2 # cap 2
1 2
2 2
3 4 # момент X - cap 4
[1 2 3]
```

### Увеличение cap

Увеличение cap в Go происходит с помощью функции по определённой схеме, которая в простом виде представлена в исходниках Go. 

В [этом файле](https://github.com/golang/go/blob/master/src/runtime/slice.go) расписана логика работы слайсов в Go. 

У нас всего есть 3 проверки: 

1. Если новое значение cap больше предыдущего в 2 раза, то ставим просто новое значение
2. Если старое значение cap меньше трешхолда (который = 256), то cap увеличится в два раза 
3. Уже далее, когда cap 256 и более, то мы плавно будем снижать до 1.25 множитель добавленных cap при увеличении slice на каждой итерации

`src / runtime / slice.go`
```Go
// nextslicecap computes the next appropriate slice length.
func nextslicecap(newLen, oldCap int) int {
	newcap := oldCap
	doublecap := newcap + newcap
	if newLen > doublecap {
		return newLen
	}

	const threshold = 256
	if oldCap < threshold {
		return doublecap
	}
	for {
		// Transition from growing 2x for small slices
		// to growing 1.25x for large slices. This formula
		// gives a smooth-ish transition between the two.
		newcap += (newcap + 3*threshold) >> 2

		// We need to check `newcap >= newLen` and whether `newcap` overflowed.
		// newLen is guaranteed to be larger than zero, hence
		// when newcap overflows then `uint(newcap) > uint(newLen)`.
		// This allows to check for both with the same comparison.
		if uint(newcap) >= uint(newLen) {
			break
		}
	}

	// Set newcap to the requested cap when
	// the newcap calculation overflowed.
	if newcap <= 0 {
		return newLen
	}
	return newcap
}
```



## Map

### Map

Map - это базовая конструкция списка ключ-значение.  

`main.go`
```Go
package main  
  
import "fmt"  
  
func main() {  
	// map[<тип_ключа>]<тип_значения>
    m := map[string]string{  
       "google": "https://google.com",  
    }  
  
    fmt.Println(m)  
}
```

```bash
> go run ./main.go 

map[google:https://google.com]
```

### Изменение Map

Изменение и добавление значений в Map выглядит подобным образом, как и для массивов. Только в качестве ключей, мы используем предопределённые по типу значения

`main.go`
```Go
package main  
  
import "fmt"  
  
func main() {  
    m := map[string]string{  
       "yahoo": "yahoo.com",  
    }  
    fmt.Println(m)  
    fmt.Println(m["yahoo"])  
    m["yahoo"] = "https://yahoo.com"  
    fmt.Println(m)  
    m["Google"] = "https://google.com"  
    m["Yandex"] = "https://yandex.ru"  
    fmt.Println(m)  
    delete(m, "Yandex")  
    delete(m, "Y")  
    fmt.Println(m["Y"])  
    fmt.Println(m)  
}
```

```bash
> go run ./main.go 

map[yahoo:yahoo.com]
yahoo.com
map[yahoo:https://yahoo.com]
map[Google:https://google.com Yandex:https://yandex.ru yahoo:https://yahoo.com]
			# пустая строка, так как получаем не существующее значение
map[Google:https://google.com yahoo:https://yahoo.com]
```

### Итерация по Map

Итерация по Map работает так же, как и с массивами

`main.go`
```go
func main() {
	m := map[string]int{ "a": 1, "b": 2 }
	
	for key, value := range m {
		fmt.Println(key, value)
	}
}
```

```bash
> go run ./main.go 

b 2
a 1
```

#### Утилита закладок



`main.go`
```Go
package main  
  
import "fmt" 
  
func main() {  
    bookmarks := map[string]string{}  
  
    fmt.Println("Приложение для закладок")  
  
    for {  
       variant := getMenu()  
  
       switch variant {  
       case 1:  
          printBookmarks(bookmarks)  
       case 2:  
          bookmarks = addBookmark(bookmarks)  
       case 3:  
          bookmarks = deleteBookmark(bookmarks)  
       case 4:  
          break  
       }  
    }  
}  
  
func getMenu() (variant int) {  
    fmt.Println("Выберите вариант: ")  
    fmt.Println("1. Посмотреть закладки")  
    fmt.Println("2. Добавить закладку")  
    fmt.Println("3. Удалить закладку")  
    fmt.Println("4. Выход")  
    fmt.Scan(&variant)  
    return variant  
}  
  
func printBookmarks(bookmarks map[string]string) {  
    if len(bookmarks) == 0 {  
       fmt.Println("Закладок пока нет")  
    }  
  
    for key, value := range bookmarks {  
       fmt.Println(key, ": ", value)  
    }  
}  
  
func addBookmark(bookmarks map[string]string) map[string]string {  
    var newBookmarkKey string  
    var newBookmarkValue string  
  
    fmt.Println("Добавление закладки")  
  
    fmt.Print("Введите ключ: ")  
    fmt.Scan(&newBookmarkKey)  
    fmt.Print("Введите значение: ")  
    fmt.Scan(&newBookmarkValue)  
  
    bookmarks[newBookmarkKey] = newBookmarkValue  
  
    return bookmarks  
}  
  
func deleteBookmark(bookmarks map[string]string) map[string]string {  
    var deleteBookmarkKey string  
  
    fmt.Println("Удаление закладки")  
  
    fmt.Print("Введите ключ: ")  
    fmt.Scan(&deleteBookmarkKey)  
  
    delete(bookmarks, deleteBookmarkKey)  
  
    return bookmarks  
}
```

```bash
> go run ./main.go 

Приложение для закладок

Выберите вариант:
1. Посмотреть закладки
2. Добавить закладку
3. Удалить закладку
4. Выход
1

Закладок пока нет

Выберите вариант:
5. Посмотреть закладки
6. Добавить закладку
7. Удалить закладку
8. Выход
2

Добавление закладки
Введите ключ: yandex
Введите значение: https://ya.ru

Выберите вариант:
9. Посмотреть закладки
10. Добавить закладку
11. Удалить закладку
12. Выход
1

yandex :  https://ya.ru

Выберите вариант:
13. Посмотреть закладки
14. Добавить закладку
15. Удалить закладку
16. Выход
3

Удаление закладки
Введите ключ: yandex

Выберите вариант:
17. Посмотреть закладки
18. Добавить закладку
19. Удалить закладку
20. Выход
1

Закладок пока нет

Выберите вариант:
21. Посмотреть закладки
22. Добавить закладку
23. Удалить закладку
24. Выход
4
```

### Labels

Когда мы запускаем `break` внутри `switch`, который находится в другой итерационной конструкции (`for` или такой же `switch`), то мы применяем остановку для дальнейшего выполнения именно этой конструкции. 

И теперь, указав Label Menu, мы сможем на него сослаться, чтобы указать, что мы прерываем не выполнение `switch`, а выполнение `for`

```Go
func main() {  
    bookmarks := map[string]string{}  
  
    fmt.Println("Приложение для закладок")  
  
Menu:  
    for {  
       variant := getMenu()  
  
    Switch:  
       switch variant {  
       case 1:  
          printBookmarks(bookmarks)  
       case 2:  
          bookmarks = addBookmark(bookmarks)  
       case 3:  
          bookmarks = deleteBookmark(bookmarks)  
       case 4:  
          break Menu  
       }  
    }  
}
```

### Type alias

Для оптимизации записи длинных типов, мы можем воспользоваться ключевым словом `type`, которое позволит в себя положить определение типа элемента. 

Это даёт эффективное переиспользование типа и более понятное обозначение бизнес-сущности, которая привязана к определённому элементу

`main.go`
```Go
type bookmarkMap = map[string]string  
  
func main() {  
    bookmarks := bookmarkMap{}  
  
    fmt.Println("Приложение для закладок")
    
// ...

func addBookmark(bookmarks bookmarkMap) bookmarkMap {
```

### Make для Map

У Map есть точно такая же проблема выделения памяти для новых элементов, как и в массивах.

У Map нет capacity. Мы можем только в моменте рассчитать длину. И, в связи с этим, `make` не будет устанавливать `capacity` - он просто выделит память под определённое количество элементов сразу. 

```Go
m := make(bookmarkMap, 3)  
m["a"] = "a"  
m["b"] = "b"  
m["c"] = "c"  
fmt.Println(m)
```



## Указатели

### Все типы данных

Типы данных в Go делятся на 4 группы: 

- Base types
- Aggregate type
- Reference type
- Interface type

![](../../_png/Pasted%20image%2020260418142800.png)

#### Передача по ссылке

Когда мы работаем с ссылочным типом данных, при передаче в функцию, мы кладём не значение, а ссылку на элемент в памяти

![](../../_png/Pasted%20image%2020260418143232.png)

Таким образом, при передаче slice в функцию, мы будем внутри неё работать с ссылкой на значения в памяти и менять напрямую их. Такой подход позволит не переприсваивать значение из функции обратно в нашу переменную, а сразу напрямую мутировать данные

```Go
func add(a []int) {  
    a[0] = 3  
}  
  
func main() {  
    a := []int{1}  
    a[0] = 2  
    add(a)  
    fmt.Println(a) // [ 3 ]
}
```

#### Передача по значению

Когда мы передаём в функцию значение, мы не меняем оригинальное значение, а работаем с новым экземпляром значения из аргумента

![](../../_png/Pasted%20image%2020260418144507.png)

А уже в этих двух случаях мы будем работать с разными элементами в памяти, так как в функцию будет передаваться значение, а не указатель на место этого значения в памяти. 

```Go
func add(a [1]int) {  
    a[0] = 3  
}  
  
func main() {  
    a := [1]int{}  
    a[0] = 2  
    add(a)  
    fmt.Println(a) // [ 2 ]
}
```

```Go
func add(a string) {  
    a = "2" 
}  
  
func main() {  
    a := "1"
    add(a)  
    fmt.Println(a) // "1"
}
```

#### Доработка bookmarks

В итоге мы можем переписать приложение закладок и убрать присваивание нового Map, так как это ссылочный тип данных и при передаче в функцию, мы будем внутри работать со ссылкой и менять значения во фрейме в памяти

`main.go`
```Go
package main  
  
import "fmt"  
  
type bookmarkMap = map[string]string  
  
func main() {  
    bookmarks := bookmarkMap{}  
  
    fmt.Println("Приложение для закладок")  
  
Menu:  
    for {  
       variant := getMenu()  
  
       switch variant {  
       case 1:  
          printBookmarks(bookmarks)  
       case 2:  
          addBookmark(bookmarks)  
       case 3:  
          deleteBookmark(bookmarks)  
       case 4:  
          break Menu  
       }  
    }  
}  
  
func getMenu() (variant int) {  
    fmt.Println("Выберите вариант: ")  
    fmt.Println("1. Посмотреть закладки")  
    fmt.Println("2. Добавить закладку")  
    fmt.Println("3. Удалить закладку")  
    fmt.Println("4. Выход")  
    fmt.Scan(&variant)  
    return variant  
}  
  
func printBookmarks(bookmarks bookmarkMap) {  
    if len(bookmarks) == 0 {  
       fmt.Println("Закладок пока нет")  
    }  
  
    for key, value := range bookmarks {  
       fmt.Println(key, ": ", value)  
    }  
}  
  
func addBookmark(bookmarks bookmarkMap) {  
    var newBookmarkKey string  
    var newBookmarkValue string  
  
    fmt.Println("Добавление закладки")  
  
    fmt.Print("Введите ключ: ")  
    fmt.Scan(&newBookmarkKey)  
    fmt.Print("Введите значение: ")  
    fmt.Scan(&newBookmarkValue)  
  
    bookmarks[newBookmarkKey] = newBookmarkValue  
}  
  
func deleteBookmark(bookmarks bookmarkMap) {  
    var deleteBookmarkKey string  
  
    fmt.Println("Удаление закладки")  
  
    fmt.Print("Введите ключ: ")  
    fmt.Scan(&deleteBookmarkKey)  
  
    delete(bookmarks, deleteBookmarkKey)  
}
```

### Что такое указатель

Указатель - это переменная, которая хранит адрес в памяти. 

![](../../_png/Pasted%20image%2020260418150427.png)

Чтобы получить адрес в памяти определённой переменной, нам нужно обратиться к ней с `&`

![](../../_png/Pasted%20image%2020260418150529.png)

Зачем это нужно: 

1. Мы избегаем лишнее копирование. Когда мы передаём значение напрямую в функцию, мы всегда её копируем. 
2. Мутирует значение. Указатель позволяет передать адрес в памяти и сразу изменять нужное значение

### Создание Указателя

Создаётся указатель через обращение к переменной оператором `&`. В переменную с указателем кладётся ссылка на область памяти, в котором на данный момент находится значение переменной 

```go
package main  
  
import "fmt"  
  
func main() {  
    a := 5  
    pointerA := &a
    res := double(a)  
    fmt.Println(res) // 10  
    fmt.Println(pointerA) // 0x3f1979206020
}  
  
func double(num int) int {  
    return num * 2  
}
```

### Использование Указателя

И для обращения к данным, на которые смотрит указатель, нам нужно добавить использовать dereference оператор `*`. Его мы вешаем на сами значения, с которыми работаем и на типы, у которых в начале так же должен идти star символ, что обозначает указатель `*int` 

```go
package main  
  
import "fmt"  
  
func main() {  
    a := 5  
    double(&a)  
    fmt.Println(a) // 10  
}  
  
func double(num *int) {  
    *num = *num * 2  
}
```

#### Reverse массива



```Go
package main  
  
import "fmt"  
  
func main() {  
    arr := [4]int{1, 2, 3, 4}  
    reverse(&arr)  
    fmt.Println(arr)  
}  
  
func reverse(arr *[4]int) {  
    for index, value := range *arr {  
       (*arr)[len(arr) - 1 - index] = value  
    }  
}
```

```bash
> go run ./main.go 

[4 3 2 1]
```



## Struct

### Зачем нужны

Когда мы работаем с большими объектами, нам приходится передавать их друг за другом в правильной последовательности. Часто это приводит к ошибкам по невнимательности. 

```Go
package main  
  
import "fmt"  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    outputPassword(login, password, url)  
}  
  
func promptData(prompt string) string {  
    fmt.Print(prompt)  
    var res string  
    fmt.Scan(&res)  
    return res  
}  
  
func outputPassword(login, password, url string) {  
    fmt.Println(login, password, url)  
}
```

### Описание struct

Описание структуры начинается с `type <имя> struct { <поле> <тип> }`

```Go
type account struct {  
    login    string  
    password string  
    url      string  
}
```

### Создание инстанса

Отличия явной и неявной передачи аргументов в структуру: 

- Неявная
	- Нужно передавать аргументы в той же последовательности, в которой и были объявлены в структуре
	- Нужно передавать все аргументы
- Явная
	- Последовательность аргументов не важна
	- Пустой аргумент будет дефолтно равен пустому значению по типу

`main.go`
```Go  
// Просто пустой account  
accountNull := account{}  
  
// неявная передача  
account1 := account{  
    login, // login  
    "",    // password  
    url,   // url  
}  
  
// явная передача  
account2 := account{  
    url:      url,  
    password: password,  
}
```

### Передача структур

Удобство структур в том, что мы можем просто указать тип аргумента функции в виде этой структуры `acc account` и работать с этими данными, как с объектом. 

При передаче структуры напрямую в функцию, мы создаём новую копию, а не работаем с ссылкой. 

`main.go`
```Go
package main  
  
import "fmt"  
  
type account struct {  
    login    string  
    password string  
    url      string  
}  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount := account{  
       url:      url,  
       login:    login,  
       password: password,  
    }  
  
    outputPassword(userAccount)  
}  
  
func promptData(prompt string) string {  
    fmt.Print(prompt + ": ")  
    var res string  
    fmt.Scan(&res)  
    return res  
}  
  
func outputPassword(acc account) {  
    fmt.Println(acc)  
    fmt.Println(acc.password)  
}
```

```bash
> go run ./main.go 

Введите логин: argver
Введите пароль: aoaoapasswrdlss
Введите URL: https://coco.co
{argver aoaoapasswrdlss https://coco.co}
aoaoapasswrdlss
```

### Использование указателей

Создаётся указатель на структуру таким же образом, как и для любого другого значения. 

Однако тут стоит отметить, что у нас есть возможность обращаться к данным структуры даже без dereference оператора. Мы можем опустить `*` и сразу обращаться к ключам структуры

Изменение структуры при передаче указателем будет работать так же, как и для других типов данных

```Go
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount := account{  
       url:      url,  
       login:    login,  
       password: password,  
    }  
  
    outputPassword(&userAccount)  
}
  
func outputPassword(acc *account) {  
    fmt.Println(acc.login, (*acc).password)  
}
```

### Rune

Rune - это тип данных, который хранит один символ.

Обе этих программы приведут к одному выводу: 

```Go
// проходимся по строке, как по массиву
str := "Привет!)"  
for _, ch := range str {  
    fmt.Println(ch, string(ch))  
}
```

```Go
// создаём массив рун из строки и проходимся по представлению этого массива в виде string()
str := []rune("Привет!)")  
for _, ch := range string(str) {  
    fmt.Println(ch, string(ch))  
}
```

```bash
> go run ./main.go 

1055 П
1088 р
1080 и
1074 в
1077 е
1090 т
33 !
41 )
```

#### Генерация пароля



```Go
package main  
  
import (  
    "fmt"  
    "math/rand/v2"
)  
  
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*!")  
  
func main() {  
    fmt.Println(generatePassword(12))
}

func generatePassword(n int) string {  
    res := make([]rune, n)  
  
    for i := range res {  
		// rand.IntN - подставляет псевнослучайное число от 0 до переданного аргумента
		res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    return string(res)  
}
```

### Методы

Методы структуры описываются через обращение к структуре после `func` в `(<имя_структуры>)`. Таким образом мы привязываем функцию к структуре и переводим её в метод. Методы мы стараемся класть рядом со структурами. Таким образом, мы позволяем сразу обращаться функциям из инстансов структуры. 

Есть две записи создания метода под структуру, но каждая из них создаёт копию. 

```go
type account struct {  
    login    string  
    password string  
    url      string  
}

// Есть две записи: 

// 1. либо так, но придётся передавать структуру аргументом
func (account) outputPassword(acc *account) {

// 2. либо так и тут мы сразу будем подхватывать данные текущего инстанса, который вызвал метод
func (acc account) outputPassword() {  
    fmt.Println(acc.login, acc.password)  
}
```

Далее применяем в коде через вызов от инстанса структуры

```go
func main() {  
    fmt.Println(generatePassword(12))  
  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount := account{  
       url:      url,  
       login:    login,  
       password: password,  
    }  
  
    userAccount.outputPassword()  
}
```

#### Мутация struct

Для того, чтобы получить структуру указателем, достаточно в типе показать, что мы получаем указатель на структуру

`main.go`
```Go
package main  
  
import (  
    "fmt"  
    "math/rand/v2")  
  
type account struct {  
    login    string  
    password string  
    url      string  
}  
  
func (acc account) outputPassword() {  
    fmt.Println(acc)  
}  
  
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*!")  

func (acc *account) generatePassword(n int) {  
    res := make([]rune, n)  
  
    for i := range res {  
       res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    (*acc).password = string(res)  
}  
  
func main() {  
    login := promptData("Введите логин")  
    url := promptData("Введите URL")  
  
    userAccount := account{  
       url:   url,  
       login: login,  
    }  
  
    userAccount.generatePassword(12)  
    userAccount.outputPassword()  
}  
  
func promptData(prompt string) string {  
    fmt.Print(prompt + ": ")  
    var res string  
    fmt.Scan(&res)  
    return res  
}
```

```bash
> go run ./main.go 

Введите логин: asdasfffffwq
Введите URL: ya.ru
{asdasfffffwq Z*FDgggyJXwN ya.ru}
```

### Функция конструктор

Функция-конструктор - это инициализатор нашей структуры. Это условная конструкция, которую принято реализовывать в Go для начального создания объектов по структурам. Тут принято сохранять логику валидации и начальных конфигураций для создания объектов. 

```Go
func newAccount(login, password, url string) *account {  
    return &account{login, password, url}  
}  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount := newAccount(login, password, url)  
  
    userAccount.generatePassword(12)  
    userAccount.outputPassword()  
}
```

### Валидация данных + перенос генерации

Валидация данных в конструкторе - это одна из важнейших его задач. 

Пример валидации значения `url` через `url.ParseRequestURI` в рамках конструктора. 

`main.go`
```Go
package main  
  
import (  
    "errors"  
    "fmt"    "math/rand/v2"    "net/url")  
  
type account struct {  
    login    string  
    password string  
    url      string  
}  
  
func (acc account) outputPassword() {  
    fmt.Println(acc)  
}  
  
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*!")  
  
func (acc *account) generatePassword(n int) {  
    res := make([]rune, n)  
  
    for i := range res {  
       res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    (*acc).password = string(res)  
}  
  
func newAccount(login, password, urlString string) (*account, error) {  
	// проверяем наличие логина
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
	// валидируем переданный URL
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  
  
    newAcc := account{login: login, password: password, url: urlString}  
  
	// проверяем ряем наличие пароля и генерируем, если отсутствует
    if newAcc.password == "" {  
       newAcc.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := newAccount(login, password, url)  
  
    if err != nil {  
		// выводим ошибку
	    fmt.Println(err)  
  
       return  
    }  
  
    userAccount.outputPassword()  
}  
  
func promptData(prompt string) string {  
    fmt.Print(prompt + ": ")  
    var res string  
	// добавляем возможность ввода пустой строки
    fmt.Scanln(&res)  
    return res  
}
```

```bash
> go run ./main.go 

Введите логин: a1a
Введите пароль: 
Введите URL: ya.ru
failed parse URL

> go run ./main.go 

Введите логин: a1a
Введите пароль: 
Введите URL: https://ya.ru
{a1a NYZNjfVc2uU* https://ya.ru}
```

### Композиция

Композиция структур в Go осуществляется за счёт вложения структуры в другую структуру

`main.go`
```Go
// базовая структура
type account struct {  
    login    string  
    password string  
    url      string  
}  
  
// новая структура на базе account
type accountWithTS struct {  
    createdAt time.Time  
    updatedAt time.Time
    // имплементируем композицию структур на базе вложения  
    account
}

// оставляем этот метод на account
func (acc *account) generatePassword(n int) {  
    res := make([]rune, n)  
  
    for i := range res {  
       res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    (*acc).password = string(res)  
}

// теперь мы работаем только с новой структурой
func newAccountWithTS(login, password, urlString string) (*accountWithTS, error) {  
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  

	// содаём новый инстанс
    newAcc := accountWithTS{  
       createdAt: time.Now(),  
       updatedAt: time.Now(),  
       // имплементируем account
       account: account{  
          login:    login,  
          password: password,  
          url:      urlString,  
       },  
    }  
  
    if newAcc.password == "" {  
       // обращаться к методам account мы можем напрямую, либо оригинальную структуру через account.
       newAcc.generatePassword(12)  
       newAcc.account.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := newAccountWithTS(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
    userAccount.outputPassword()  
}
```

Либо мы можем воспользоваться второй записью и явно указать имя для композиции. 

Тут мы указали `acc`, поэтому теперь обращаться к методам этой структуры мы можем только напрямую

`main.go`
```Go
  
type account struct {  
    login    string  
    password string  
    url      string  
}  
  
type accountWithTS struct {  
    createdAt time.Time  
    updatedAt time.Time  
    acc       account
}  
  
func (acc account) outputPassword() {  
    fmt.Println(acc)  
}  

func newAccountWithTS(login, password, urlString string) (*accountWithTS, error) {  
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  
  
    newAcc := accountWithTS{  
       createdAt: time.Now(),  
       updatedAt: time.Now(),  
       acc: account{  
          login:    login,  
          password: password,  
          url:      urlString,  
       },  
    }  
  
    if newAcc.acc.password == "" {  
	   // обращение ТОЛЬКО через acc.
       newAcc.acc.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := newAccountWithTS(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
    userAccount.acc.outputPassword()  
}
```



## Пакеты

### Разделение кода

Разделение кода на свои смысловые блоки - важна часть разработки. Хранение всех сущностей и логики в одном конкретном месте - это антипаттерн, так как возможность найти ответственные компоненты и быстро переключаться между разными сущностями - уже будет отсутствовать. 

Чтобы просто разделить код на разные файлы, достаточно вынести код в разные файлы в рамках одного пакета. В нашем случае - `package main`. 

Первый файл с полной логикой аккаунта: 

`account.go`
```Go
package main  
  
import (  
    "errors"  
    "fmt"    
    "math/rand/v2"    
    "net/url"    
    "time"
)  
  
type account struct {  
    login    string  
    password string  
    url      string  
}  
  
type accountWithTS struct {  
    createdAt time.Time  
    updatedAt time.Time  
    acc       account}  
  
func (acc account) outputPassword() {  
    fmt.Println(acc)  
}  
  
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*!")  
  
func (acc *account) generatePassword(n int) {  
    res := make([]rune, n)  
  
    for i := range res {  
       res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    (*acc).password = string(res)  
}  
  
func newAccountWithTS(login, password, urlString string) (*accountWithTS, error) {  
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  
  
    newAcc := accountWithTS{  
       createdAt: time.Now(),  
       updatedAt: time.Now(),  
       acc: account{  
          login:    login,  
          password: password,  
          url:      urlString,  
       },  
    }  
  
    if newAcc.acc.password == "" {  
       newAcc.acc.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}
```

Второй файл с основной функцией: 

`main.go`
```go
package main  
  
import "fmt"  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := newAccountWithTS(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
    userAccount.acc.outputPassword()  
}  
  
func promptData(prompt string) string {  
    fmt.Print(prompt + ": ")  
    var res string  
    fmt.Scanln(&res)  
    return res  
}
```

Теперь команды для запуска и сборки целого приложения должны будут включать не один корневой файл `./main.go`, а всё приложение `.`, чтобы компилятор подтянул все файлы `.go`

```bash
> go run .

> go build
```

### Добавление пакета

Деление на пакеты позволяет вынести переиспользуемую часть кода и расшарить его на несколько других пакетов, либо, в дальнейшем, вообще вынести этот пакет в отдельный модуль в рамках другого репозитория. 

![](../../_png/Pasted%20image%2020260419181715.png)

Как делить на пакеты: 

- по использованию (`utils`, `shared`) - отдельные переиспользуемые модули в разных пакетах
- по доменным / предметным областям (`user`, `payment`, `account`) - модули по сущностям 
- по бизнес-задачам (модули для сборка данных и отправки данных) - деление на модули по разному типу выполняемых задач 

Для создания нового пакета `account`, нам потребуется переименовать пакет и переместить все файлы, которые связаны с другими пакетами, кроме `main`, в одноимённую директорию

`account / account.go`
```Go
package account  
  
import (  
    "errors"  
    "fmt"    
    "math/rand/v2"    
    "net/url"    
    "time"
)
  
type account struct {  
    login    string  
    password string  
    url      string  
}  
  
type accountWithTS struct {  
    createdAt time.Time  
    updatedAt time.Time  
    acc       account}  
  
func (acc account) outputPassword() {  
    fmt.Println(acc)  
}  
  
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*!")  
  
func (acc *account) generatePassword(n int) {  
    res := make([]rune, n)  
  
    for i := range res {  
       res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    (*acc).password = string(res)  
}  
  
func newAccountWithTS(login, password, urlString string) (*accountWithTS, error) {  
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  
  
    newAcc := accountWithTS{  
       createdAt: time.Now(),  
       updatedAt: time.Now(),  
       acc: account{  
          login:    login,  
          password: password,  
          url:      urlString,  
       },  
    }  
  
    if newAcc.acc.password == "" {  
       newAcc.acc.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}
```

### Импорт и экспорт

#### Экспорт

Для экспорта элементов из пакета, их нужно объявлять в PascalCase (с заглавной буквы). Больше ничего для экспорта не требуется. 

Не стоит открывать в мир все методы и константы. Важно соблюдать инкапсуляцию и предоставлять понятный API для взаимодействия с пакетом

`account / account.go`
```Go
package account  
  
import (  
    "errors"  
    "fmt"    "math/rand/v2"    "net/url"    "time")  
  
type Account struct {  
    login    string  
    password string  
    url      string  
}  
  
type accountWithTS struct {  
    createdAt time.Time  
    updatedAt time.Time  
    Account}  
  
func (acc Account) OutputPassword() {  
    fmt.Println(acc)  
}  
  
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*!")  
  
func (acc *Account) generatePassword(n int) {  
    res := make([]rune, n)  
  
    for i := range res {  
       res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    (*acc).password = string(res)  
}  
  
func NewAccountWithTS(login, password, urlString string) (*accountWithTS, error) {  
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  
  
    newAcc := accountWithTS{  
       createdAt: time.Now(),  
       updatedAt: time.Now(),  
       Account: Account{  
          login:    login,  
          password: password,  
          url:      urlString,  
       },  
    }  
  
    if newAcc.password == "" {  
       newAcc.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}
```

#### Импорт

Чтобы импортировать пакет, нужно взять имя модуля

`go.mod`
```go
module github.com/ZeiZel/gomple
```

И вставить его в `import`, и в конце добавить имя вставляемого пакета. Дальше остаётся только применять экспортируемые элементы пакета с заглавной буквы

`main.go`
```Go
package main  
  
import (  
    "fmt"  

	// и далее обращаемся по имени модуля  
    "github.com/ZeiZel/gomple/account"
)  
  
func main() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := account.NewAccountWithTS(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
    userAccount.OutputPassword()  
}  
  
func promptData(prompt string) string {  
    fmt.Print(prompt + ": ")  
    var res string  
    fmt.Scanln(&res)  
    return res  
}
```

### Добавление сторонних пакетов

Все пакеты для работы с Go находятся на [pkg.go.dev](https://pkg.go.dev/)

Чтобы установить в проект новую внешнюю зависимость, нам достаточно указать ссылку на github с нужным репозиторием

```bash
go get github.com/fatih/color
```

И далее мы увидим плоское представление всех зависимостей в проекте через данный файл: 

`go.mod`
```go
module github.com/ZeiZel/gomple  
  
go 1.26  
  
require (  
    github.com/fatih/color v1.19.0 // indirect  
    github.com/mattn/go-colorable v0.1.14 // indirect  
    github.com/mattn/go-isatty v0.0.20 // indirect  
    golang.org/x/sys v0.42.0 // indirect  
)
```

> - Рядом с этим файлом будет находиться `go.sum`, который будет хранить хэши всех этих пакетов, чтобы избежать подмены
> - Оба этих файла нужно коммитить, чтобы восстановить зависимости

Когда мы будем ставить зависимости после клонирования проекта, нужно будет их стянуть через эту команду: 

```bash
go get
```

Чтобы импортировать внешнюю зависимость, нам нужно вставить в импорт установленный модуль

`main.go`
```go
import (  
    "fmt"  
  
    "github.com/ZeiZel/gomple/account"    
    // импортируем внешнюю зависимость
    "github.com/fatih/color"
)

func promptData(prompt string) string {  
    color.Cyan(prompt + ": ")  
    var res string  
    fmt.Scanln(&res)  
    return res  
}
```

![](../../_png/Pasted%20image%2020260419191346.png)

### Go mod tidy

`go mod tidy` - это крайне полезная команда, которая позволяет управлять зависимостями в проекте Go

Она: 

- Удаляет неиспользуемые пакеты (если мы вырезали их использование из кода)
- Устанавливает пакеты, которые мы используем в проекте (если мы не установили модуль, но используем его импорт в проекте, то tidy спарсит все данные и соберёт правильные зависимости)
- делит пакеты на direct (те, которые мы используем в проекте напрямую) и indirect (те, которые являются зависимостями для нашего основного используемого пакета)

`go.mod`
```go
module github.com/ZeiZel/gomple  
  
go 1.26  
  
require github.com/fatih/color v1.19.0  
  
require (  
    github.com/mattn/go-colorable v0.1.14 // indirect  
    github.com/mattn/go-isatty v0.0.20 // indirect  
    golang.org/x/sys v0.42.0 // indirect  
)
```



## Работа с ОС

### Запись в файл

Работа с файлами и самой операционной системой происходят через встроенный пакет `os`. 

Порядок: 

- Сначала мы создаём файл через `Create`, где на выходе получим инстанс файла и ошибку
- Далее мы записываем в него текстовый контент `WriteString`, где на выходе мы получим массив байтов и ошибку (можно так же записать и байты через `Write`)
- В самом конце закрываем поток работы с файлом через `Close` (возвращает ошибку)

`files / files.go`
```go
package files  
  
import (  
    "fmt"  
    "os"
)  
  
func ReadFile(path string) {  
  
}  
  
func WriteFile(content string, name string) {  
    file, err := os.Create(name)  
  
    if err != nil {  
       fmt.Println(err)  
       return  
    }  
  
    _, err = file.WriteString(content)  
  
    file.Close()  
  
    if err != nil {  
       fmt.Println(err)  
       return  
    }  
  
    fmt.Println("Файл успешно записан")  
}
```

Дальше вызываем метод записи в файл

`main.go`
```Go
files.WriteFile("Это запись в файл!", "file.txt")
```

И получаем в корне проекта файл с нашим предопределённым контентом

`file.txt`
```txt
Это запись в файл!
```

### Stack frame

Stack Frame - это определённая коробка с вызовами. Каждая отдельная функция - это новый stack frame, в рамках которого происходят вызовы операций. 

В нашей небольшой функции по записи строкового контента в файл самым первым фреймом стека вызовов будет функция `main`. В ней произойдёт вызов другого фрейма - `WriteFile`. 

В новом фрейме `WriteFile` будут происходить следующие операции: 

1. Сначала выделится память под все описанные переменные (`content` с количеством памяти под тип данных string, `name`, `file` и `err`).
   ![](../../_png/Pasted%20image%2020260420121729.png)
2. Далее эти переменные будут заполняться в результате выполнения операций
   ![](../../_png/Pasted%20image%2020260420122324.png)

Потом уже происходит удаление `WriteFile` из стека и продолжают выполняться операции в функции `main`, если они есть

### Defer

Ключевое слово `defer` добавляет операцию следующей в стеке вызовов. Таким образом, мы можем отложить выполнение операции на самый конец выполнения в функции. 

Сама последовательность операций в `defer` выполняется согласно стеку LIFO

```go
func main() {
	defer fmt.Println(1)
	defer fmt.Println(2)
}
```

```bash
> go run .

2
1
```

Добавим операцию закрытия потока записи в файл в `defer` и она выполнится после выполнения всех операций в функции. 

`files / files.go`
```go
func WriteFile(content string, name string) {  
    file, err := os.Create(name)  
  
    if err != nil {  
       fmt.Println(err)  
       return  
    }  
  
    defer file.Close()  
  
    _, err = file.WriteString(content)  
  
    if err != nil {  
       fmt.Println(err)  
       return  
    }  
  
    fmt.Println("Файл успешно записан")  
}
```

### Чтение из файла

Чтобы читать файл, мы можем воспользоваться двумя функциями: 

- `Open` - открываем файл и читаем его порционно. Первым аргументом получаем `file` и работаем с байтами
- `ReadFile` - читаем файл полностью (сразу грузим весь в память)

`files / files.go`
```Go
func ReadFile(path string) (string, error) {  
    data, err := os.ReadFile(path)  
  
    if err != nil {  
       return "", err  
  
    }  
  
    fmt.Println(data)  
    fmt.Println(string(data))  
  
    return string(data), nil  
}
```

```bash
go run .

Файл успешно записан

[208 173 209 130 208 190 32 208 183 208 176 208 191 208 184 209 129 209 140 32 208 178 32 209 132 208 176 208 185 208 187 33]

Это запись в файл!
```

### Struct tags

Структурные теги позволяют нам указать мета-информацию для типов. Мы можем ими воспользоваться, чтобы сказать другим пакетам, как нужно обрабатывать данные в структуре. Например, мы можем подсказать парсеру, какое поле и как должно выглядеть при переводе в JSON и чтении из него. 

`reflect` - это встроенная библиотека, которая позволяет работать с типами в рантайме. 

`account / account.go`
```Go
type Account struct {  
					// указываем теги `ключ1:"значение1" ключ2:"значение2"`
    login    string `json:"login" xml:"login_data"`  
    password string `json:"password"`  
    url      string `json:"url"`  
}

func NewAccountWithTS(login, password, urlString string) (*accountWithTS, error) {  
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  
  
    newAcc := accountWithTS{  
       createdAt: time.Now(),  
       updatedAt: time.Now(),  
       Account: Account{  
          login:    login,  
          password: password,  
          url:      urlString,  
       },  
    }  
  
	// получаем мета теги
    field, isExist := reflect.TypeOf(newAcc).FieldByName("login")  
    fmt.Println(string(field.Tag), isExist)  
  
    if newAcc.password == "" {  
       newAcc.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}
```

```bash
Введите логин: 
asdasd
Введите пароль: 
asfqwc
Введите URL: 
https://asd.com

json:"login" xml:"login_data" true

{asdasd asfqwc https://asd.com}
```

### Сохранение JSON

Доработаем метод записи в файл. Контент нам нужно принимать в виде массива байт. Запись контента происходит через функцию `Write`

`files / files.go`
```go
// на вход - массив байт с контентом и name - путь к файлу
func WriteFile(content []byte, name string) {  
    file, err := os.Create(name)  
  
    if err != nil {  
       fmt.Println(err)  
       return  
    }  
  
    defer file.Close()  
  
    _, err = file.Write(content)  
  
    if err != nil {  
       fmt.Println(err)  
       return  
    }  
  
    fmt.Println("Файл успешно записан")  
}
```

Назовём все функции в PascalCase, так как их нужно будет использовать вне пакета. Поля структуры мы так же будем использовать вне, поэтому их тоже переводим в PascalCase и вешаем на них теги `json`, чтобы парсер мог их перевести

`account / account.go`
```Go
package account  
  
import (  
    "encoding/json"  
    "errors"    
    "fmt"    
    "math/rand/v2"    
    "net/url"    
    "time"
)  
  
type Account struct {  
    Login     string    `json:"login" xml:"login_data"`  
    Password  string    `json:"password"`  
    Url       string    `json:"url"`  
    CreatedAt time.Time `json:"createdAt"`  
    UpdatedAt time.Time `json:"updatedAt"`  
}  
  
func (acc Account) OutputPassword() {  
    fmt.Println(acc)  
}  

// переводим структуру в байты для записи
func (acc Account) ToBytes() ([]byte, error) {  
    file, err := json.Marshal(acc)  
  
    if err != nil {  
       return nil, err  
    }  
  
    return file, nil  
}  
  
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-*!")  
  
func (acc *Account) generatePassword(n int) {  
    res := make([]rune, n)  
  
    for i := range res {  
       res[i] = letterRunes[rand.IntN(len(letterRunes))]  
    }  
  
    acc.Password = string(res)  
}  
  
func NewAccount(login, password, urlString string) (*Account, error) {  
    if login == "" {  
       return nil, errors.New("login required")  
    }  
  
    _, err := url.ParseRequestURI(urlString)  
  
    if err != nil {  
       return nil, errors.New("failed parse URL")  
    }  
  
    newAcc := Account{  
       Login:     login,  
       Password:  password,  
       Url:       urlString,  
       CreatedAt: time.Now(),  
       UpdatedAt: time.Now(),  
    }  
  
    if newAcc.Password == "" {  
       newAcc.generatePassword(12)  
    }  
  
    return &newAcc, nil  
}
```

Далее в родительской функции выносим отдельную функцию `createAccount`, которая будет отвечать за полный процесс создания и записи аккаунта. 

`main.go`
```Go
package main  
  
import (  
    "fmt"  
  
    "github.com/ZeiZel/gomple/account"    
    "github.com/ZeiZel/gomple/files"    
    "github.com/fatih/color"
)  
  
func main() {  
    createAccount()  
}  
  
func createAccount() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := account.NewAccount(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
	// переводим аккаунт в байты
    file, err := userAccount.ToBytes()  
  
    if err != nil {  
       fmt.Println(err)  
    }  
  
	// записываем аккаунт в файл
    files.WriteFile(file, "data.json")  
}  
  
func promptData(prompt string) string {  
    color.Cyan(prompt + ": ")  
    var res string  
    fmt.Scanln(&res)  
    return res  
}
```

Запускаем программу

```bash
> go run .

Введите логин: 
olegov@asd.ru
Введите пароль:    
Введите URL: 
https://some.com
Файл успешно записан
```

И на выходе мы получим сгенерированный файл

`data.json`
```JSON
{"login":"olegov@asd.ru","password":"4pWU4rqFRXMF","url":"https://some.com","createdAt":"2026-04-20T18:05:14.008917+03:00","updatedAt":"2026-04-20T18:05:14.008917+03:00"}
```

#### Меню выбора

Добавим меню для выбора операции, которую будет реализовывать приложение 

`main.go`
```Go
package main  
  
import (  
    "fmt"  
  
    "github.com/ZeiZel/gomple/account"    "github.com/ZeiZel/gomple/files"    "github.com/fatih/color")  
  
func main() {  
    fmt.Println("__Менеджер паролей__")  
      
Menu:  
    for {  
       variant := getMenu()  
       switch variant {  
       case 1:  
          createAccount()  
       case 2:  
          findAccount()  
       case 3:  
          deleteAccount()  
       default:  
          break Menu  
       }  
    }  
  
}  
  
func getMenu() int {  
    var variant int  
    fmt.Println("Выберите вариант:")  
    fmt.Println("1. Создать аккаунт")  
    fmt.Println("2. Найти аккаунт")  
    fmt.Println("3. Удалить аккаунт")  
    fmt.Println("4. Выход")  
    fmt.Scan(&variant)  
    return variant  
}  
  
func findAccount() {  
  
}  
  
func deleteAccount() {  
  
}  
  
func createAccount() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := account.NewAccount(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
    file, err := userAccount.ToBytes()  
  
    if err != nil {  
       fmt.Println(err)  
    }  
  
    files.WriteFile(file, "data.json")  
}  
  
func promptData(prompt string) string {  
    color.Cyan(prompt + ": ")  
    var res string  
    fmt.Scanln(&res)  
    return res  
}
```

### Slice struct

В рамках приложения, нам нужно реализовать возможность работать с массивом значений аккаунта. Для этого нам понадобится возможность работы со слайсами структур

Для начала создадим отдельный файл в пакете `account`, который будет отвечать за работу с хранилищем. Это будет его зоной ответственности.

Пакет `json` отвечает за работу с JSON. Функция `Marshal` переводит объекты Go в JSON. 

`account / vault.go`
```Go
package account  
  
import (  
    "encoding/json"  
    "time")  
  
// хранилище будет представлять собой массив структур аккаунта
type Vault struct {  
    Accounts  []Account `json:"accounts"`  
    UpdatedAt time.Time `json:"updatedAt"`  
}  

// создаём новое хранилище
func NewVault() *Vault {  
    return &Vault{  
       Accounts:  []Account{},  
       UpdatedAt: time.Now(),  
    }  
}  
  
// добавление аккаунта в хранилище
func (vault *Vault) AddAccount(acc Account) {  
	// добавляем новый аккаунт
    vault.Accounts = append(vault.Accounts, acc)  
    // актуализируем время обновления
    vault.UpdatedAt = time.Now()  
}  
  
// переносим сюда перевод в байты
func (acc Vault) ToBytes() ([]byte, error) {  
	// переводим структуру в JSON через Marshal
    file, err := json.Marshal(acc)  
  
    if err != nil {  
       return nil, err  
    }  
  
    return file, nil  
}
```

Затем в `createAccount` инстанциируем работу с хранилищем и переходим на запись через него

`main.go`
```Go
func createAccount() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := account.NewAccount(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
    vault := account.NewVault()  
    vault.AddAccount(*userAccount)  
    file, err := vault.ToBytes()  
  
    if err != nil {  
       fmt.Println(err)  
    }  
  
    files.WriteFile(file, "data.json")  
}
```

Добавляем аккаунт через приложение

```bash
go run .
__Менеджер паролей__
Выберите вариант:
1. Создать аккаунт
2. Найти аккаунт
3. Удалить аккаунт
4. Выход
1
Введите логин: 
asdasff
Введите пароль: 

Введите URL: 
https://asdf.com
Файл успешно записан
```

И получается такая запись

`data.json`
```JSON
{  
  "accounts": [  
    {  
      "login": "asdasff",  
      "password": "-JaOjaFVW*hl",  
      "url": "https://asdf.com",  
      "createdAt": "2026-04-21T18:34:50.049708+03:00",  
      "updatedAt": "2026-04-21T18:34:50.049708+03:00"  
    }  
  ],  
  "updatedAt": "2026-04-21T18:34:50.049713+03:00"  
}
```

### Чтение JSON

Реализуем метод для чтения файлов на базе возврата байт

`files / files.go`
```Go
func ReadFile(name string) ([]byte, error) {  
    data, err := os.ReadFile(name)  
  
    if err != nil {  
       return nil, err  
  
    }  
  
    return data, nil  
}
```

В хранилище будем проверять существование файла с данными и через `Unmarshal` переводить JSON структуру в объекты Go и потом использовать этот список

`account / vault.go`
```Go
func NewVault() *Vault {  
    data, err := os.ReadFile("data.json")  
  
    if err != nil {  
       return &Vault{  
          Accounts:  []Account{},  
          UpdatedAt: time.Now(),  
       }  
    }  
  
    var vault Vault  
    err = json.Unmarshal(data, &vault)  
  
    if err != nil {  
       color.Red(err.Error())  
    }  
  
    return &vault  
}
```

Далее в `createAccount` сократим запись и будем просто инстанциировать хранилище и передавать туда новый аккаунт пользователя

`main.go`
```Go
func createAccount() {  
    login := promptData("Введите логин")  
    password := promptData("Введите пароль")  
    url := promptData("Введите URL")  
  
    userAccount, err := account.NewAccount(login, password, url)  
  
    if err != nil {  
       fmt.Println(err)  
  
       return  
    }  
  
    vault := account.NewVault()  
    vault.AddAccount(*userAccount)  
}
```

Записываем новый аккаунт в хранилище

```bash
go run .
__Менеджер паролей__
Выберите вариант:
1. Создать аккаунт
2. Найти аккаунт
3. Удалить аккаунт
4. Выход
1 
Введите логин: 
b.sd
Введите пароль: 

Введите URL: 
https://b.com
Файл успешно записан
```

Теперь появился новый аккаунт

`data.json`
```JSON
{  
  "accounts": [  
    {  
      "login": "asdasff",  
      "password": "-JaOjaFVW*hl",  
      "url": "https://asdf.com",  
      "createdAt": "2026-04-21T18:34:50.049708+03:00",  
      "updatedAt": "2026-04-21T18:34:50.049708+03:00"  
    },  
    {  
      "login": "b.sd",  
      "password": "cJncCLl9Bx2t",  
      "url": "https://b.com",  
      "createdAt": "2026-04-21T19:43:22.334711+03:00",  
      "updatedAt": "2026-04-21T19:43:22.334711+03:00"  
    }  
  ],  
  "updatedAt": "2026-04-21T19:43:22.33651+03:00"  
}
```

#### Поиск пароля

Сначала дополним вывод этого аккаунта дополнительной информацией

`account / account.go`
```Go
func (acc *Account) Output() {
	color.Cyan(acc.Login)
	color.Cyan(acc.Password)
	color.Cyan(acc.Url)
}
```

Далее добавим в хранилище функцию, которая будет искать аккаунт по введённому url. Возвращать мы будем список аккаунтов, так как под один url может быть сразу несколько разных паролей.

`account / vault.go`
```Go
func (vault *Vault) FindAccountsByUrl(url string) []Account {
	var accounts []Account
	
	// проходимся по слайсу аккаунтов
	for _, account := range vault.Accounts {
		// Contains проверяет, включена ли строка в другую строку
		isMatched := strings.Contains(account.Url, url)
		
		if isMatched {
			accounts = append(accounts, account)
		}
	}
	
	return accounts
}
```

Далее в `main` перенесём создание хранилища. Доработаем функцию `findAccount`, в которой сначала получим url от пользователя, а потом будем искать по хранилищу аккаунты. 

`main.go`
```Go
package main

import (
	"fmt"

	"github.com/ZeiZel/gomple/account"

	"github.com/fatih/color"
)

func main() {
	fmt.Println("__Менеджер паролей__")
	vault := account.NewVault()
Menu:
	for {
		variant := getMenu()
		switch variant {
		case 1:
			createAccount(vault)
		case 2:
			findAccount(vault)
		case 3:
			deleteAccount()
		default:
			break Menu
		}
	}

}

func getMenu() int {
	var variant int
	fmt.Println("Выберите вариант:")
	fmt.Println("1. Создать аккаунт")
	fmt.Println("2. Найти аккаунт")
	fmt.Println("3. Удалить аккаунт")
	fmt.Println("4. Выход")
	fmt.Scan(&variant)
	return variant
}

func findAccount(vault *account.Vault) {
	url := promptData("Введите URL для поиска")
	
	accounts := vault.FindAccountsByUrl(url)
	
	if len(accounts) == 0 {
		color.Red("Аккаунтов не найдено")
	}
	
	for _, account := range accounts {
		account.Output()
	}
}

func deleteAccount() {

}

func createAccount(vault *account.Vault) {
	login := promptData("Введите логин")
	password := promptData("Введите пароль")
	url := promptData("Введите URL")
	myAccount, err := account.NewAccount(login, password, url)
	if err != nil {
		fmt.Println("Неверный формат URL или Логин")
		return
	}
	vault.AddAccount(*myAccount)
}

func promptData(prompt string) string {
	fmt.Print(prompt + ": ")
	var res string
	fmt.Scanln(&res)
	return res
}
```

#### Удаление пароля

Теперь нужно реализовать удаление аккаунта по URL. Для этого так же нужно будет доработать хранилище и добавить в него новый метод. 

Сначала вынесем переиспользуемую логику записи хранилища в файл через `save`. Это будет метод, инкапсулированный только в этом пакете `account` и он будет работать только с `vault`. 
`AddAccount` почти полностью переедет на `save`. 

В функции `DeleteAccountByUrl` мы так же добавим логику поиска аккаунта, но тут мы уже будем не удалять, а собирать новый слайс Accounts из всех элементов, которые НЕ совпадают по условию и потом этот список сохраним в хранилище через `save`.

`accounts / vault.go`
```Go
func (vault *Vault) DeleteAccountByUrl(url string) bool {
	var accounts []Account
	
	isDeleted := false
	
	for _, account := range vault.Accounts {
		isMatched := strings.Contains(account.Url, url)
		
		if !isMatched {
			accounts = append(accounts, account)
			continue
		}
		
		isDeleted = true
	}
	
	vault.Accounts = accounts
	
	vault.save()
	
	return isDeleted
}

// добавление аккаунта
func (vault *Vault) AddAccount(acc Account) {
	vault.Accounts = append(vault.Accounts, acc)
	vault.save()
}


// переиспользуемый метод для сохранения обновлённого состояния хранилища
func (vault *Vault) save() {
	vault.UpdatedAt = time.Now()
	data, err := vault.ToBytes()
	if err != nil {
		color.Red("Не удалось перобразовать")
	}
	files.WriteFile(data, "data.json")
}
```

Далее имплементируем новую логику в `main` функцию

`main.go`
```Go
func main() {
	fmt.Println("__Менеджер паролей__")
	vault := account.NewVault()
Menu:
	for {
		variant := getMenu()
		switch variant {
		case 1:
			createAccount(vault)
		case 2:
			findAccount(vault)
		case 3:
			deleteAccount(vault)
		default:
			break Menu
		}
	}

}

func deleteAccount(vault *account.Vault) {
	url := promptData("Введите URL для поиска")
	
	isDeleted := vault.DeleteAccountByUrl(url)
	
	if isDeleted {
		color.Green("Удалено")
	} else {
		color.Red("Не найдено")
	}
}
```

И теперь наше финальное приложение может: сохранить, найти и удалить нужный нам аккаунт

```bash
> go run .

__Менеджер паролей__
Выберите вариант:
1. Создать аккаунт
2. Найти аккаунт
3. Удалить аккаунт
4. Выход
1
Введите логин: 
geleoroner
Введите пароль: 

Введите URL: 
https://gel.com
Файл успешно записан
Выберите вариант:
1. Создать аккаунт
2. Найти аккаунт
3. Удалить аккаунт
4. Выход
2
Введите URL для поиска: 
gel
geleoroner
o!0qV3QvqjaQ
https://gel.com
Выберите вариант:                                                                                                                                                             
5. Создать аккаунт
6. Найти аккаунт
7. Удалить аккаунт
8. Выход
3
Введите URL для поиска: 
gel                                                                                                                                                                           
Файл успешно записан
Удалено
Выберите вариант:                                                                                                                                                             
9. Создать аккаунт
10. Найти аккаунт
11. Удалить аккаунт
12. Выход
2
Введите URL для поиска: 
gel                                                                                                                                                                           
Аккаунтов не найдено
Выберите вариант:                                                                                                                                                             
13. Создать аккаунт
14. Найти аккаунт
15. Удалить аккаунт
16. Выход
```



## Интерфейсы

### Изменение files

Когда мы будем расширять приложение, мы столкнёмся с той проблемой, что писать и читать мы будем из многих источников. Нам нужно будет уметь записывать в файл, в облако, в любой другой вид хранилища и так же нужно будет уметь из них читать. Сейчас мы жёстко зависимы от чтения и записи в один файл. 

Поэтому для начала создадим первый инстанс источника данных - JSON DataBase

`files / files.go`
```Go
package files

import (
	"fmt"
	"os"
)

type JsonDb struct {
	filename string
}

func NewJsonDb(name string) *JsonDb {
	return &JsonDb{
		filename: name,
	}
}

func (db *JsonDb) Read() ([]byte, error) {
	data, err := os.ReadFile(db.filename)
	// ...
}

func (db *JsonDb) Write(content []byte) {
	file, err := os.Create(db.filename)
	// ...
}
```

И применим её в хранилище

`account / vault.go`
```Go
package account  
  
import (  
    "encoding/json"  
    "strings"    "time"  
    "github.com/ZeiZel/gomple/files"    "github.com/fatih/color")  
  
type Vault struct {  
    Accounts  []Account `json:"accounts"`  
    UpdatedAt time.Time `json:"updatedAt"`  
}  
  
func NewVault() *Vault {  
    db := files.NewJsonDb("data.json")  
    file, err := db.Read()  
    // ...
}  
  
func (vault *Vault) save() {  
    // ...
  
    db := files.NewJsonDb("data.json")  
    db.Write(data)  
}
```

### Внедрение зависимостей

Внедрение зависимостей - это подход, при котором мы определяем базовую структуру объекта и по этому контракту внедряем один объект в другой. 
Таким образом мы можем создать структуру, которая принимает в себя сущность, работающую с базой данных Mongo, и передать её в Vault. Так же создать сущность, которая работает с облачной БД, и так же внедрить её в другой инстанс Vault. Но обязательным условием для сущностей, которые мы передадим в Vault, чтобы они имели одинаковые методы для функционирования (например, `Read` и `Write`).

Нашей целью будет создание Vault, который будет получать на вход объект базы и использовать его как зависимость

`account / vault.go`
```Go
package account

import (
	"demo/password/files"
	"encoding/json"
	"strings"
	"time"

	"github.com/fatih/color"
)

type Vault struct {
	Accounts  []Account `json:"accounts"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// новая структура - хранилище с базой
type VaultWithDb struct {
	Vault
	db files.JsonDb
}

// контруктор будет возвращать новый VaultWithDb и на вход получать зависимость в виде нужной базы
func NewVault(db *files.JsonDb) *VaultWithDb {
	file, err := db.Read()
	
	if err != nil {
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			// внедряем базу
			db: *db,
		}
	}
	
	var vault Vault
	err = json.Unmarshal(file, &vault)
	
	if err != nil {
		color.Red("Не удалось разобрать файл data.json")
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			db: *db,
		}
	}
	
	// создаём новый инстанс хранилища с БД из полученного vault файла 
	return &VaultWithDb{
		Vault: vault,
		db:    *db,
	}
}

// зависимость от нового Vault
func (vault *VaultWithDb) DeleteAccountByUrl(url string) bool {
	var accounts []Account
	isDeleted := false
	for _, account := range vault.Accounts {
		isMatched := strings.Contains(account.Url, url)
		if !isMatched {
			accounts = append(accounts, account)
			continue
		}
		isDeleted = true
	}
	vault.Accounts = accounts
	vault.save()
	return isDeleted
}

// зависимость от нового Vault
func (vault *VaultWithDb) FindAccountsByUrl(url string) []Account {
	var accounts []Account
	for _, account := range vault.Accounts {
		isMatched := strings.Contains(account.Url, url)
		if isMatched {
			accounts = append(accounts, account)
		}
	}
	return accounts
}

// зависимость от нового Vault
func (vault *VaultWithDb) AddAccount(acc Account) {
	vault.Accounts = append(vault.Accounts, acc)
	vault.save()
}

// остаётся работать с Vault, так как сохраняем мы только данные хранилища
func (vault *Vault) ToBytes() ([]byte, error) {
	file, err := json.Marshal(vault)
	if err != nil {
		return nil, err
	}
	return file, nil
}

// зависимость от нового Vault
func (vault *VaultWithDb) save() {
	vault.UpdatedAt = time.Now()
	
	// переводим данные через внедрённый Vault
	data, err := vault.Vault.ToBytes()
	
	if err != nil {
		color.Red("Не удалось перобразовать")
	}
	
	// сохраняем данные через внедрённый db
	vault.db.Write(data)
}
```

И далее нам остаётся только внедрить зависимость от внешней структуры базы 

`main.go`
```go
package main  
  
import (  
    "fmt"  
  
    "github.com/ZeiZel/gomple/account"    
    "github.com/ZeiZel/gomple/files"    
    "github.com/fatih/color"
)  
  
func main() {  
    fmt.Println("__Менеджер паролей__")  
  
    db := files.NewJsonDb("data.json")  
    vault := account.NewVault(db)  
  
Menu:  
    for {  
       variant := getMenu()  
       switch variant {  
       case 1:  
          createAccount(vault)  
       case 2:  
          findAccount(vault)  
       case 3:  
          deleteAccount(vault)  
       default:  
          break Menu  
       }  
    }  
  
}

func findAccount(vault *account.VaultWithDb) {
		// ..
}

func deleteAccount(vault *account.VaultWithDb) {
		// ..
}

func createAccount(vault *account.VaultWithDb) {
	// ..
}
```

### Второй провайдер

Далее создадим второй провайдер данных - облачная база данных. Она будет иметь ровно такие же методы `Read` и `Write`, как и уже существующая JSON DB

`cloud/cloud.go`
```Go
package cloud

type CloudDb struct {
	url string
}

func NewCloudDb(url string) *CloudDb {
	return &CloudDb{
		url: url,
	}
}

func (db *CloudDb) Read() ([]byte, error) {
	return []byte{}, nil
}

func (db *CloudDb) Write(content []byte) {
}
```

Однако тут мы уже сталкиваемся с проблемой, что мы не можем имплементировать одновременно и эту CloudDb, и JsonDb. У нас есть возможность явно описать только одину из этих структур в качестве зависимости

### Создание интерфейса

Интерфейс - это абстрактная единица, которая позволяет нам описать принимаемую структуру просто описывая типы без конкретной реализации.

`account / vault.go`
```Go
package account

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/fatih/color"
)


// интерфейс базы даннх
type Db interface {
	// можно записать интерфейс с именем переменной 
	Read() (arg []byte, err error)
	// и без имени переменной - просто передав типы
	Write([]byte) // после () пишем возврат функции
}

type Vault struct {
	Accounts  []Account `json:"accounts"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type VaultWithDb struct {
	Vault
	// принимаем интерфейс
	db Db
}

// конструктор принимает интерфейс, но не в виде указателя
func NewVault(db Db) *VaultWithDb {
	file, err := db.Read()
	if err != nil {
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			db: db,
		}
	}
	var vault Vault
	err = json.Unmarshal(file, &vault)
	if err != nil {
		color.Red("Не удалось разобрать файл data.json")
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			db: db,
		}
	}
	return &VaultWithDb{
		Vault: vault,
		db:    db,
	}
}
```

И далее мы можем передать сюда любой из ранее созданных провайдеров, так как они соответствуют требуемуму интефрейсу 

`main.go`
```Go
func main() {
	fmt.Println("__Менеджер паролей__")
	// vault := account.NewVault(files.NewJsonDb("data.json"))
	vault := account.NewVault(cloud.NewCloudDb("https://a.ru"))
```

### Встроенный интерфейс

Так же мы можем разбивать большие интерфейсы на отдельные части, чтобы объединять их или переиспользовать в отдельных участках

`account / vault.go`
```Go
package account

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/fatih/color"
)

// интерфейс для чтения
type ByteReader interface {
	Read() ([]byte, error)
}

// интерфейс для записи
type ByteWriter interface {
	Write([]byte)
}

// применение embedded интерфейсов и составление одного
type Db interface {
	ByteReader // эти интерфейсы вставит все свои описанные методы
	ByteWriter
}

type Vault struct {
	Accounts  []Account `json:"accounts"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type VaultWithDb struct {
	Vault
	db Db
}
```

### Any тип

Для того чтобы обозначить, что функция принимает любой тип, мы должны описать принимаемое значение, как `interface{}` или его более простым и быстрым алиасом `any`. 

`any` используется всегда, когда мы не знаем, какой тип данных мы получим. Например `fmt.Print` принимает в себя `any`

Реализуем функцию, которая будет выводить ошибку

`output / errors.go`
```Go
package output

func PrintError(value any) {
	// color.Red(value)
}
```

И теперь в созданную функцию мы можем передать любой тип данных

`main.go`
```Go
import (
	"github.com/ZeiZel/gomple/output"
	"fmt"

	"github.com/fatih/color"
)

func main() {
	output.PrintError(1)
	output.PrintError("sd")
```

### Type switch

Механизм сужения типов в Go можно реализовать за счёт использования switch-case + типа из значения. 

С помощью конструкции `value.(type)`, мы получаем из значения его тип. Таким образом, мы можем пройтись по switch-case со значениями типов и выполнить определённую логику. 

Важно учесть, что конструкция `t := value.(type)` работает только в рамках switch

`output / errors.go`
```Go
package output

import "github.com/fatih/color"

func PrintError(value any) {
	switch t := value.(type) {
	case string:
		color.Red(t)
	case int:
		color.Red("Код ошибки: %d", t)
	case error:
		color.Red(t.Error())
	default:
		color.Red("Неизвестный тип ошибки")
	}
}
```

Далее имплементируем эту функцию

`account/vault.go`
```Go
func NewVault(db Db) *VaultWithDb {
	// ..
	if err != nil {
		// color.Red("Не удалось разобрать файл data.json")
		
		output.PrintError("Не удалось разобрать файл data.json") // свежая ошибка
		
		// ..
	}
	// ..
}

func (vault *VaultWithDb) save() {
	vault.UpdatedAt = time.Now()
	data, err := vault.Vault.ToBytes()
	if err != nil {
		// color.Red("Не удалось перобразовать")
		output.PrintError(err) // теперь выводим свежую ошибку
	}
	vault.db.Write(data)
}
```

`files/files.go`
```Go
func (db *JsonDb) Write(content []byte) {
	file, err := os.Create(db.filename)
	if err != nil {
		// - fmt.Println(err)
		output.PrintError(err)
	}
	defer file.Close()
	_, err = file.Write(content)
	if err != nil {
		// - fmt.Println(err)
		output.PrintError(err)
		return
	}
	fmt.Println("Запись успешна")
}
```

`main.go`
```Go
func deleteAccount(vault *account.VaultWithDb) {
	url := promptData("Введите URL для поиска")
	isDeleted := vault.DeleteAccountByUrl(url)
	if isDeleted {
		color.Green("Удалено")
	} else {
		// - color.Red("Не найдено")
		output.PrintError("Не найдено")
	}
}

func createAccount(vault *account.VaultWithDb) {
	login := promptData("Введите логин")
	password := promptData("Введите пароль")
	url := promptData("Введите URL")
	myAccount, err := account.NewAccount(login, password, url)
	if err != nil {
		// - fmt.Println("Неверный формат URL или Логин")
		output.PrintError("Неверный формат URL или Логин")
		return
	}
	vault.AddAccount(*myAccount)
}
```

### Получение типа

Так же альтернативно мы можем проверять определённый тип значения с помощью конструкции `value.(<type>)`. Первым аргументом вернёт преобразованное из `any` значение в нужный тип данных, а вторым его статус (может ли оно быть переведено или нет в этот тип данных из `any`). 
Эта конструкция так же нужна именно для сужения типов и может подойти, когда у нас крайне ветвистая структура и много логики проверок 

`output / errors.go`
```Go
package output

import "github.com/fatih/color"

func PrintError(value any) {
	intValue, ok := value.(int)
	if ok {
		color.Red("Код ошибки: %d", intValue)
		return
	}
	
	strValue, ok := value.(string)
	if ok {
		color.Red(strValue)
		return
	}
	
	errorValue, ok := value.(error)
	if ok {
		color.Red(errorValue.Error())
		return
	}
	
	color.Red("Неизвестный тип ошибки")
}
```

### Generic

Очень часто такое бывает, что нам нужно передавать в качестве аргумента какую-то определённую группу аргументов, тип которых различается, но функционал - нет. Без такой возможности, мы будем писать одинаковые функции под каждый тип:

```Go
func sumInt(a, b int) int {
	return a + b
}

func sumFloat32(a, b float32) float32 {
	return a + b
}

func sumFloat64(a, b float64) float64 {
	return a + b
}
```

И вместо того, чтобы разделять функции по типам, мы можем задать центральный Generic, в рамках которого мы сможем выполнять операции доступные для переданного перечня типа данных

```Go
func sum[T int | float32 | float64 | int16 | int32 | string](a, b T) T {
	return a + b
}
```

Мы можем передать несколько дженериков через запятую и определить для них разные типы. Однако мы не можем передавать структуры и интерфейсы в качестве значений типов дженериков

### Ограничения Generic

Мы не можем сужать типы по дженерикам. Единственный способ реализовать сужение - это насильно привести значение к `any`

```Go
func sum[T int | float32 | float64 | int16 | int32 | string](a, b T) T {
	switch t := a.(type) { // не можем
	}
	
	switch t := any(a).(type) { // можем
	case string:
		fmt.Println(t)
	}
}
```

Мы не можем вернуть какое-то одно цельное значение из union по дженерику. 
Если у нас в типах есть строка и число, то вернуть только строку мы не можем. Мы можем вернуть только результат операции переменных.

```Go
func sum[T int | float32 | float64 | int16 | int32 | string](a, b T) T {
	return "" // не можем
	return 1 // не можем
}

func sum[T int | float32 | float64 | int16 | int32](a, b T) T {
	return 1 // можем
}
```

Мы Не можем использовать интерфейсы в дженериках

```Go
func sum[T int | float32 | float64 | error](a, b T) T { // ошибка
	return 1
}
```

Мы можем использовать дженерики в функциях, но не можем их использовать в методах структур

```Go
// эта запись будет невалидной, так как дженерик в методах невозможен
func (vault *VaultWithDb) FindAccountsByUrl[V any](url string) []Account {
```

Однако мы Можем использовать в качестве дженерика структуру 

```Go
package output

import (
	"github.com/ZeiZel/gomple/account"
	"github.com/fatih/color"
)

func sum[T account.Account](a T) T {  
    return a  
}
```

### Generic Structs

Мы можем использовать дженерики в структурах, чтобы передавать динамические значения

```Go
type List[T any] struct {
	elements []T
}

func (l *List[T]) addElement() {
}
```

#### Generic ввода

Функция `promptData` принимает в качестве аргумента слайс строк и выводит их друг под другом последовательно. Справа от последнего переданного элемента, мы должны вывести `:`

`main.go`
```Go
func main() {
	fmt.Println("__Менеджер паролей__")
	vault := account.NewVault(files.NewJsonDb("data.json"))
	// vault := account.NewVault(cloud.NewCloudDb("https://a.ru"))
Menu:
	for {
		// передаём сюда слайс со всеми опциями
		variant := promptData([]string{
			"1. Создать аккаунт",
			"2. Найти аккаунт",
			"3. Удалить аккаунт",
			"4. Выход",
			"Выберите вариант",
		})
		
		switch variant {
		case "1":
			createAccount(vault)
		case "2":
			findAccount(vault)
		case "3":
			deleteAccount(vault)
		default:
			break Menu
		}
	}

}

func findAccount(vault *account.VaultWithDb) {
	url := promptData([]string{"Введите URL для поиска"})
	accounts := vault.FindAccountsByUrl(url)
	if len(accounts) == 0 {
		color.Red("Аккаунтов не найдено")
	}
	for _, account := range accounts {
		account.Output()
	}
}

func deleteAccount(vault *account.VaultWithDb) {
	url := promptData([]string{"Введите URL для поиска"})
	isDeleted := vault.DeleteAccountByUrl(url)
	if isDeleted {
		color.Green("Удалено")
	} else {
		output.PrintError("Не найдено")
	}
}

func createAccount(vault *account.VaultWithDb) {
	// передаём сюда слайс от строки
	login := promptData([]string{"Введите логин"})
	password := promptData([]string{"Введите пароль"})
	url := promptData([]string{"Введите URL"})
	
	myAccount, err := account.NewAccount(login, password, url)
	if err != nil {
		output.PrintError("Неверный формат URL или Логин")
		return
	}
	vault.AddAccount(*myAccount)
}

// принимает дженерик от слайса
func promptData[T any](prompt []T) string {
	for i, line := range prompt {
		if i == len(prompt)-1 {
			fmt.Printf("%v: ", line)
		} else {
			fmt.Println(line)
		}
	}
	var res string
	fmt.Scanln(&res)
	return res
}
```



## Продвинутые функции

### Тип функции

Запись типа функции выглядит почти так же, как это выглядело бы в интефрейсе

```Go
var menu = map[string]func(string, int)(int, error){}
```

И далее реализуем выбор списка меню не через switch, а через получение функции из мапы

`main.go`
```go
// методы списка меню
var menu = map[string]func(*account.VaultWithDb){
	"1": createAccount,
	"2": findAccount,
	"3": deleteAccount,
}

func main() {
	fmt.Println("__Менеджер паролей__")
	vault := account.NewVault(files.NewJsonDb("data.json"))
	// vault := account.NewVault(cloud.NewCloudDb("https://a.ru"))
Menu:
	for {
		variant := promptData([]string{
			"1. Создать аккаунт",
			"2. Найти аккаунт",
			"3. Удалить аккаунт",
			"4. Выход",
			"Выберите вариант",
		})
		
		// получаем функцию из списка
		menuFunc := menu[variant]
		
		// проверяем существование
		if menuFunc == nil {
			break Menu
		}
		
		// вызываем
		menuFunc(vault)
	}

}
```

### Передача функции

Так же мы можем передавать функции, как аргумент, в другую функцию

Например, нам нужно универсонализировать функцию `FindAccountsByUrl`, которую мы переименуем в `FindAccounts`. Вместо посика по URL, она будет передавать в `checker` полностью всю сущность `Account` и строку для поиска, а возвращать по интерфейсу `bool` с результатом поиска. 

`account / vault.go`
```Go
func (vault *VaultWithDb) FindAccounts(
	str string, 
	checker func(Account, string) bool
) []Account {
	var accounts []Account
	
	for _, account := range vault.Accounts {
		isMatched := checker(account, str)
		if isMatched {
			accounts = append(accounts, account)
		}
	}
	
	return accounts
}
```

Далее в `findAccount` мы вызываем `FindAccounts`, в который передаём искомый url и саму функцию `checkUrl`, по которой будет происходить поиск. Искать мы будем так же по url. 
Но теперь у нас есть возможность создавать вне основной функции сколько угодно функций для поиска по разным параметрам нашей сущности. 

`main.go`
```Go
func checkUrl(acc account.Account, str string) bool {
	return strings.Contains(acc.Url, str)
}

func findAccount(vault *account.VaultWithDb) {
	url := promptData([]string{"Введите URL для поиска"})
	
	accounts := vault.FindAccounts(url, checkUrl)
	
	if len(accounts) == 0 {
		color.Red("Аккаунтов не найдено")
	}
	for _, account := range accounts {
		account.Output()
	}
}
```

### Анонимные функции

Так же для экономии места мы можем передать анонимную функцию с той же самой сигнатурой, только без имени. Таким образом мы сразу создадим и передадим функцию в качестве аргумента

`main.go`
```Go
func findAccount(vault *account.VaultWithDb) {
	url := promptData([]string{"Введите URL для поиска"})
	// - accounts := vault.FindAccounts(url, checkUrl)
	accounts := vault.FindAccounts(
		url, 
		func(acc account.Account, str string) bool {
			return strings.Contains(acc.Url, str)
		}
	)
	
	if len(accounts) == 0 {
		color.Red("Аккаунтов не найдено")
	}
	
	for _, account := range accounts {
		account.Output()
	}
}

// эту функцию удаляем
// func checkUrl(acc account.Account, str string) bool {
// 	return strings.Contains(acc.Url, str)
// }
```

#### Поиск по логину

Нужно реализовать отдельный метод поиска аккаунта по логину

`main.go`
```Go
package main

import (
	"demo/password/account"
	"demo/password/files"
	"demo/password/output"
	"fmt"
	"strings"

	"github.com/fatih/color"
)

var menu = map[string]func(*account.VaultWithDb){
	"1": createAccount,
	"2": findAccountByUrl,
	"3": findAccountByLogin,
	"4": deleteAccount,
}

func main() {
	fmt.Println("__Менеджер паролей__")
	vault := account.NewVault(files.NewJsonDb("data.json"))
	// vault := account.NewVault(cloud.NewCloudDb("https://a.ru"))
Menu:
	for {
		variant := promptData([]string{
			"1. Создать аккаунт",
			"2. Найти аккаунт по URL",
			"3. Найти аккаунт по логину",
			"4. Удалить аккаунт",
			"5. Выход",
			"Выберите вариант",
		})
		menuFunc := menu[variant]
		if menuFunc == nil {
			break Menu
		}
		menuFunc(vault)
	}

}

func findAccountByUrl(vault *account.VaultWithDb) {
	url := promptData([]string{"Введите URL для поиска"})
	accounts := vault.FindAccounts(url, func(acc account.Account, str string) bool {
		return strings.Contains(acc.Url, str)
	})
	outputResult(&accounts)
}

func findAccountByLogin(vault *account.VaultWithDb) {
	login := promptData([]string{"Введите логин для поиска"})
	accounts := vault.FindAccounts(login, func(acc account.Account, str string) bool {
		return strings.Contains(acc.Login, str)
	})
	outputResult(&accounts)
}

// переиспользуемый метод для вывода аккаунтов
func outputResult(accounts *[]account.Account) {
	if len(*accounts) == 0 {
		color.Red("Аккаунтов не найдено")
	}
	
	for _, account := range *accounts {
		account.Output()
	}
}
```

### Динамическое число аргументов

Динамическое число аргументов описывается через `...<тип>`, что говорит нам о том, что функция получит все аргументы, которые мы передадим просто через запятую, в виде слайса. 

То есть заменив передачу аргументов в `promptData` из `[]string` на `...string`, мы избавляем себя от необходимости передавать аргументы в виде массива. Сама функция в итоге не изменит своей логики, так как все промпты в неё попадут в виде слайса. 

Объявлять такую запись можно только в конце после всех аргументов функции, а до неё число аргументов не ограничено. 

Так же мы можем деструктуризировать уже имеющийся массив в список аргументов через запятую, если добавим оператор деструктуризации `<массив>...`

`main.go`
```Go
var menu = map[string]func(*account.VaultWithDb){
	"1": createAccount,
	"2": findAccountByUrl,
	"3": findAccountByLogin,
	"4": deleteAccount,
}

// выносим массив вариантом
var menuVariants = []string{
	"1. Создать аккаунт",
	"2. Найти аккаунт по URL",
	"3. Найти аккаунт по логину",
	"4. Удалить аккаунт",
	"5. Выход",
	"Выберите вариант",
}

func main() {
	fmt.Println("__Менеджер паролей__")
	vault := account.NewVault(files.NewJsonDb("data.json"))
Menu:
	for {
		// деструктуризируем и вкладываем сюда массив вариантов
		variant := promptData(menuVariants...)
		menuFunc := menu[variant]
		if menuFunc == nil {
			break Menu
		}
		menuFunc(vault)
	}

}

func findAccountByUrl(vault *account.VaultWithDb) {
	// оставляем здесь строку
	url := promptData("Введите URL для поиска")
	// ...
}

func findAccountByLogin(vault *account.VaultWithDb) {
	// оставляем здесь строку
	login := promptData("Введите логин для поиска")
	// ...
}

func deleteAccount(vault *account.VaultWithDb) {
	// оставляем здесь строку
	url := promptData("Введите URL для поиска")
	// ...
}

func createAccount(vault *account.VaultWithDb) {
	// оставляем здесь строку
	login := promptData("Введите логин")
	password := promptData("Введите пароль")
	url := promptData("Введите URL")
	// ...
}

// и сюда мы передаём деструктуризированный массив строк
func promptData(prompts ...string) string {  
    for i, line := range prompts {  
       if i == len(prompts)-1 {  
          fmt.Printf("%v: ", line)  
       } else {  
          fmt.Println(line)  
       }  
    }  
    var res string  
    fmt.Scan(&res)  
    return res  
}
```

### Замыкание

Замыкание - это механизм языка, который подразумевает сохранение и использование контекста вызова и создания функции. 

В данном примере мы создали из родительской функции - дочернюю. Дочерняя функция сохраняет контекст родительской, если первая использует данные из второй. 

`main.go`
```Go
func menuCounter(label string) func(int) {  
    i := 0  
    return func(outer int) {  
       i++  
       fmt.Printf("[%s] - [%d] - Количество вызовов: %d", label, outer, i)  
    }  
}  
  
func main() {  
    fmt.Println("__Менеджер паролей__")  
    vault := account.NewVault(files.NewJsonDb("data.json"))  
  
    counter := menuCounter("first")  
    counter2 := menuCounter("second")  
  
Menu:  
    for {  
       counter(1)  
       counter2(2)  
       variant := promptData(menuVariants...)
```



## Env и шифрование

### Получение env

С помощью `Getenv` мы получаем определённую переменную.
С помощью `Environ` мы получаем все переменные, которые нам доступны, в окружении. 

`main.go`
```go
func main() {
	fmt.Println("__Менеджер паролей__")
	res := os.Getenv("VAR")
	fmt.Println(res)

	for _, e := range os.Environ() {
		// разбиваем строку на 2 по разделителю =
		pair := strings.SplitN(e, "=", 2)
		fmt.Println(pair[0])
	}
}
```

### Чтение env

Env файлы - это основной формат хранения секретов во время локальной разработки. Этот стандарт применяется при разработке любого приложения на любом языке. 

`.env`
```
KEY=23523242574376835675
```

Он всегда должен добавляться в `.gitignore`. 

`.gitignore`
```
data.json
/.env*
```

Для автоматизации чтения переменных окружения для приложения из `.env` во время разработки, стоит установить библиотеку `godotenv`

```bash
go get github.com/joho/godotenv
```

Применяется она крайне просто: нам достаточно вызвать `godotenv.Load` и все переменные из `.env` будут доступны в окружении приложения. 

`maing.go`
```go

func main() {
	fmt.Println("__Менеджер паролей__")
	
	// загружаем переменную в окружение
	err := godotenv.Load()
	
	// обрабатываем отсутстве хоть какого-либо .env.*
	if err != nil {
		output.PrintError("Не удалось найти env файл")
	}
	
	// получаем переменную из .env
	res := os.Getenv("VAR")
	fmt.Println(res)

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		fmt.Println(pair[0])
	}
}
```

И теперь сохраним зависимость `godotenv` в приложении, как прямую

```bash
go mod tidy
```

### Encrypter struct

Создаём отдельный пакет, который будет заниматься шифрованием и дешифрованием данных на основе ключа из переменной окружения. 

`encrypter / encrypter.go`
```Go
package encrypter

import "os"

type Encrypter struct {
	Key string
}

func NewEncrypter() *Encrypter {
	// получаем ключ
	key := os.Getenv("KEY")
	
	// если его нет, то паникуем
	if key == "" {
		panic("Не передан параметр KEY в переменные окружения")
	}
	
	return &Encrypter{
		Key: key,
	}
}

func (enc *Encrypter) Encrypt(plainStr []byte) []byte {
	return ""
}

func (enc *Encrypter) Decrypt(encryptedStr []byte) []byte {
	return ""
}
```

Далее добавляем в структуру зависимость от энкриптера

`account / vault.go`
```Go
package account

import (
	"demo/password/encrypter"
	"demo/password/output"
	"encoding/json"
	"strings"
	"time"
)

type VaultWithDb struct {
	Vault
	db  Db
	// добавляем внедрение энкриптера
	enc encrypter.Encrypter
}

// внедряем encrypter в структуру
func NewVault(db Db, enc encrypter.Encrypter) *VaultWithDb {
	file, err := db.Read()
	
	if err != nil {
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			db:  db,
			enc: enc,
		}
	}
	
	var vault Vault
	err = json.Unmarshal(file, &vault)
	
	if err != nil {
		output.PrintError("Не удалось разобрать файл data.json")
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			db:  db,
			enc: enc,
		}
	}
	
	return &VaultWithDb{
		Vault: vault,
		db:    db,
		enc:   enc,
	}
}
```

Далее в основной функции просто инжектируем энкриптер

`main.go`
```Go
func main() {
	fmt.Println("__Менеджер паролей__")
	
	// загружаем окружение
	err := godotenv.Load()
	
	if err != nil {
		output.PrintError("Не удалось найти env файл")
	}
	
	vault := account.NewVault(
		files.NewJsonDb("data.json"), 
		// внедряем созданный энкриптер
		*encrypter.NewEncrypter()
	)

Menu:
	for {
		variant := promptData(menuVariants...)
		menuFunc := menu[variant]
		if menuFunc == nil {
			break Menu
		}
		menuFunc(vault)
	}

}
```

### Шифрование данных

Далее реализуем метод для шифрования данных: 

1. Сначала мы создаём блочный шифр AES из нашего key
	1. AES - блочный шифр, работает с блоками по 128 бит.
	2. Наш секретный ключ `Key` должен быть 16, 24 или 32 байта → AES-128/192/256
2. Далее мы должны обернуть AES в режим GCM
	1. GCM (Galois/Counter Mode) — режим работы блочного шифра. Переход в этот режим два свойства одновременно:
		1. Шифрование (конфиденциальность)
		2. Аутентификацию (целостность + защита от подмены данных)
	2. Все вышеописанные свойства называются AEAD - Authenticated Encryption with Associated Data.
3. Генерируем Nonce
	1. Nonce (Number used ONCE) — одноразовое случайное число, 12 байт для GCM.
	2. Это даёт нам возможность гарантировать, что одни и те же данные, зашифрованные одним ключом, каждый раз дают РАЗНЫЙ шифротекст
4. Шифруем через Seal
	1. Seal(dst, nonce, plaintext, additionalData) → зашифрованные байты + тег аутентификации.
		1. Первый аргумент dst=nonce означает: PREPEND nonce прямо перед шифротекстом.
		2. Итоговый результат: `[ nonce (12 байт) | ciphertext | auth tag (16 байт) ]`

>[!warning] Повторное использование nonce с тем же ключом — критическая уязвимость!

`encrypter/encrypter.go`
```Go
package encrypter

import (
    "crypto/aes"    // AES — симметричный блочный шифр 
    "crypto/cipher" // Интерфейсы для режимов блочного шифрования
    "crypto/rand"   // Криптографически безопасный генератор случайных чисел
    "io"            // Для io.ReadFull — гарантирует полное чтение буфера
    "os"
)

func (enc *Encrypter) Encrypt(plainStr []byte) []byte {
    // 1
    block, err := aes.NewCipher([]byte(enc.Key))
    if err != nil {
        panic(err.Error())
    }

    // 2
    aesGCM, err := cipher.NewGCM(block)
    if err != nil {
        panic(err.Error())
    }

    // 3
    nonce := make([]byte, aesGCM.NonceSize()) // обычно 12 байт
    _, err = io.ReadFull(rand.Reader, nonce)  // заполняем случайными байтами из ОС
    if err != nil {
        panic(err.Error())
    }

    // 4
    // При расшифровке: сначала читаем первые 12 байт как nonce, остальное — данные.
    return aesGCM.Seal(nonce, nonce, plainStr, nil)
}
```

| Термин       | Расшифровка                                   | Суть                                                 |
| ------------ | --------------------------------------------- | ---------------------------------------------------- |
| **AES**      | Advanced Encryption Standard                  | Симметричный блочный шифр (стандарт шифрования NIST) |
| **GCM**      | Galois/Counter Mode                           | Режим шифрования + аутентификации                    |
| **Nonce**    | Number used ONCE                              | Одноразовое случайное число (12 байт)                |
| **AEAD**     | Authenticated Encryption with Associated Data | Гарантирует и конфиденциальность, и целостность      |
| **Auth tag** | Authentication tag                            | 16-байтная «подпись» шифротекста                     |
| **Seal**     | —                                             | Зашифровать и приклеить auth tag                     |

### Расшифровка данных

Расшифровка текста всю первую половину операций будет выглядеть точно так же, как и шифрование. Во всём остальном всё куда проще: 

1. Достаём длину nonce
2. Далее разбиваем зашифрованный текст на две части, где первой будет nonce, а второй  зашифрованный текст
3. Далее, через GCM с помощью nonce расшифровываем текст

`encrypter / encrypter.go`
```Go
func (enc *Encrypter) Decrypt(encryptedStr []byte) []byte {
	block, err := aes.NewCipher([]byte(enc.Key))
	
	if err != nil {
		panic(err.Error())
	}
	
	aesGCM, err := cipher.NewGCM(block)
	
	if err != nil {
		panic(err.Error())
	}
	
	// 1
	nonceSize := aesGCM.NonceSize()
	// 2
	nonce, cipherText := encryptedStr[:nonceSize], encryptedStr[nonceSize:]
	// 3
	plainText, err := aesGCM.Open(nil, nonce, cipherText, nil)
	
	if err != nil {
		panic(err.Error())
	}
	
	return plainText
}
```

#### Применение шифрования

Сначала нам нужно сгенерировать правильный ключ по стандартам AES на любом из доступных ресурсов

```bash
KEY=2a042ae034904841deda1723bd014546
```

Далее мы будем сохранять наши данные уже не в `.json`, а в `.vault`, так как теперь у нас будет хранится в зашифрованном формате

`.gitignore`
```
/.env*
/*.vault
```

Далее нам остаётся только интегрировать шифрование в `save` и дешифрование при создании `Vault` в конструкторе

`account / vault.go`
```Go
func NewVault(db Db, enc encrypter.Encrypter) *VaultWithDb {
	file, err := db.Read()
	if err != nil {
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			db:  db,
			enc: enc,
		}
	}
	
	// для получения данных сразу их декриптим
	data := enc.Decrypt(file)
	var vault Vault
	
	// достаём JSON из data
	err = json.Unmarshal(data, &vault)
	// логируем найденные
	color.Cyan("Найдено %d аккаунтов", len(vault.Accounts))
	
	if err != nil {
		output.PrintError("Не удалось разобрать файл data.vault")
		return &VaultWithDb{
			Vault: Vault{
				Accounts:  []Account{},
				UpdatedAt: time.Now(),
			},
			db:  db,
			enc: enc,
		}
	}
	return &VaultWithDb{
		Vault: vault,
		db:    db,
		enc:   enc,
	}
}

func (vault *VaultWithDb) save() {
	vault.UpdatedAt = time.Now()
	data, err := vault.Vault.ToBytes()
	
	// шифруем байты
	encData := vault.enc.Encrypt(data)
	if err != nil {
		output.PrintError(err)
	}
	
	// сохраняем шифрованные данные в байтах
	vault.db.Write(encData)
}
```

Далее переименовываем файл, в который мы будем записывать данные

`main.go`
```Go
func main() {
	// ..
	
	// пакуем все данные в файл data.vault
	vault := account.NewVault(files.NewJsonDb("data.vault"), *encrypter.NewEncrypter())
	
	// ...
}

```

Теперь у нас работает и запись, и чтение шифрованных данных

```bash
> go run .

Выберите вариант: 1
Введите URL: https://ya.ru          
Введите логин: olegooloft
Введите пароль: asdfqw32wwwwwc3a3
Файл успешно записан

Выберите вариант: 2
Введите URL для поиска: ya
olegooloft
asdfqw32wwwwwc3a3
https://ya.ru
```



## HTTP запросы

### Создание нового проекта



`go.mod`
```Go
module demo/weather

go 1.22.1
```



`main.go`
```Go
package main

import "fmt"

func main() {
	fmt.Println("Новый проект")
}
```

### План проекта






### CLI флаги



`maing.go`
```Go
import (
	"flag"
	"fmt"
)

func main() {
	fmt.Println("Новый проект")
	city := flag.String("city", "", "Город пользователя")
	format := flag.Int("format", 1, "Формат вывода погоды")

	flag.Parse()

	fmt.Println(*city)
	fmt.Println(*format)
}
```

### Readers



`main.go`
```Go
package main

import (
	"flag"
	"fmt"
	"io"
	"strings"
)

func main() {
	fmt.Println("Новый проект")
	city := flag.String("city", "", "Город пользователя")
	format := flag.Int("format", 1, "Формат вывода погоды")

	flag.Parse()

	fmt.Println(*city)
	fmt.Println(*format)

	r := strings.NewReader("Привет! Я поток данных")
	block := make([]byte, 4)
	for {
		_, err := r.Read(block)
		fmt.Printf("%q\n", block)
		if err == io.EOF {
			break
		}
	}
}
```

### Первый HTTP запрос



`geo / geo.go`
```Go
package geo

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

type GeoData struct {
	City string `json:"city"`
}

func GetMyLocation(city string) (*GeoData, error) {
	if city != "" {
		return &GeoData{
			City: city,
		}, nil
	}
	resp, err := http.Get("https://ipapi.co/json/")
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, errors.New("NOT200")
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var geo GeoData
	json.Unmarshal(body, &geo)
	return &geo, nil
}
```



`main.go`
```Go
package main

import (
	"demo/weather/geo"
	"flag"
	"fmt"
)

func main() {
	fmt.Println("Новый проект")
	city := flag.String("city", "", "Город пользователя")

	flag.Parse()

	fmt.Println(*city)
	geoData, err := geo.GetMyLocation(*city)
	if err != nil {
		fmt.Println(err.Error())
	}
	fmt.Println(geoData)
}
```

### Query параметры



`weather/weather.go`
```Go
package weather

import (
	"demo/weather/geo"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

func GetWeather(geo geo.GeoData, format int) string {
	baseUrl, err := url.Parse("https://wttr.in/" + geo.City)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}
	params := url.Values{}
	params.Add("format", string(format))
	baseUrl.RawQuery = params.Encode()
	resp, err := http.Get(baseUrl.String())
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}
	return string(body)
}
```



`main.go`
```Go
package main

import (
	"demo/weather/geo"
	"demo/weather/weather"
	"flag"
	"fmt"
)

func main() {
	fmt.Println("Новый проект")
	city := flag.String("city", "", "Город пользователя")
	format := flag.Int("format", 1, "Формат вывода погоды")

	flag.Parse()

	fmt.Println(*city)
	geoData, err := geo.GetMyLocation(*city)
	if err != nil {
		fmt.Println(err.Error())
	}
	weatherData := weather.GetWeather(*geoData, *format)
	fmt.Println(weatherData)
}
```

### Debug приложения



`weather / weather.go`
```Go
func GetWeather(geo geo.GeoData, format int) string {
	baseUrl, err := url.Parse("https://wttr.in/" + geo.City)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}
	params := url.Values{}
	// params.Add("format", string(format))
	// 
	params.Add("format", fmt.Sprint(format))
	baseUrl.RawQuery = params.Encode()
	resp, err := http.Get(baseUrl.String())
```

### Post запрос



`geo/geo.go`
```Go
package geo

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

type GeoData struct {
	City string `json:"city"`
}

type CityPopulationResponce struct {
	Error bool `json:"error"`
}

func GetMyLocation(city string) (*GeoData, error) {
	if city != "" {
		isCity := checkCity(city)
		if !isCity {
			panic("Такого города нет")
		}
		return &GeoData{
			City: city,
		}, nil
	}
	resp, err := http.Get("https://ipapi.co/json/")
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, errors.New("NOT200")
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var geo GeoData
	json.Unmarshal(body, &geo)
	return &geo, nil
}

func checkCity(city string) bool {
	postBody, _ := json.Marshal(map[string]string{
		"city": city,
	})
	resp, err := http.Post("https://countriesnow.space/api/v0.1/countries/population/cities", "application/json", bytes.NewBuffer(postBody))
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false
	}
	var populationResponce CityPopulationResponce
	json.Unmarshal(body, &populationResponce)
	return !populationResponce.Error
}
```



`weather / weather.go`
```Go
func GetWeather(geo geo.GeoData, format int) string {
	// ...
	defer resp.Body.Close()
	// ...
}
```



## Тесты

### Arrange act Assert



`geo / geo_test.go`
```Go
package geo_test

import "testing"

func TestGetMyLocation(t *testing.T) {
	// Arange - подготовка, expected результат, данные для функции

	// Act - выполняем функцию

	// Assert - проверка результата с expected

}
```

### Первый тест



`geo/geo.go`
```Go
func GetMyLocation(city string) (*GeoData, error) {
	if city != "" {
		isCity := checkCity(city)
		if !isCity {
			// - panic("Такого города нет")
			return nil, errors.New("NOCITY")
		}
		return &GeoData{
			City: city,
		}, nil
	}
```



`geo / geo_test.go`
```Go
package geo_test

import (
	"demo/weather/geo"
	"testing"
)

func TestGetMyLocation(t *testing.T) {
	// Arange - подготовка, expected результат, данные для функции
	city := "London"
	expected := geo.GeoData{
		City: "London",
	}
	// Act - выполняем функцию
	got, err := geo.GetMyLocation(city)
	// Assert - проверка результата с expected
	if err != nil {
		t.Error(err)
	}
	if got.City != expected.City {
		t.Errorf("Ожидалось %v, получение %v", expected, got)
	}
}
```

### Debug теста



`geo/geo_test.go`
```Go
package geo_test

import (
	"demo/weather/geo"
	"testing"
)

func TestGetMyLocation(t *testing.T) {
	// Arrange - подготовка, expected результат, данные для функции
	city := "Moscow"
	expected := geo.GeoData{
		City: "Moscow",
	}
	// Act - выполняем функцию
	got, err := geo.GetMyLocation(city)
	// Assert - проверка результата с expected
	if err != nil {
		t.Error(err)
	}
	if got.City != expected.City {
		t.Errorf("Ожидалось %v, получение %v", expected, got)
	}
}
```

### Негативный тест



`geo / geo.go`
```Go
var ErrNoCity = errors.New("NOCITY")
var ErrNot200 = errors.New("NOT200")

func GetMyLocation(city string) (*GeoData, error) {
	if city != "" {
		isCity := checkCity(city)
		if !isCity {
			return nil, ErrNoCity
		}
		return &GeoData{
			City: city,
		}, nil
	}
	resp, err := http.Get("https://ipapi.co/json/")
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, ErrNot200
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var geo GeoData
	json.Unmarshal(body, &geo)
	return &geo, nil
}
```



`geo/geo_test.go`
```Go
package geo_test

import (
	"demo/weather/geo"
	"testing"
)

func TestGetMyLocation(t *testing.T) {
	// Arrange - подготовка, expected результат, данные для функции
	city := "London"
	expected := geo.GeoData{
		City: "London",
	}
	// Act - выполняем функцию
	got, err := geo.GetMyLocation(city)
	// Assert - проверка результата с expected
	if err != nil {
		t.Error(err)
	}
	if got.City != expected.City {
		t.Errorf("Ожидалось %v, получение %v", expected, got)
	}
}

func TestGetMyLocationNoCity(t *testing.T) {
	city := "Londonasdsf"
	_, err := geo.GetMyLocation(city)
	if err != geo.ErrNoCity {
		t.Errorf("Ожидалось %v, получение %v", geo.ErrNoCity, err)
	}
}
```

#### Тест погоды



`weather / weather_test.go`
```Go
package weather_test

import (
	"demo/weather/geo"
	"demo/weather/weather"
	"strings"
	"testing"
)

func TestGetWeather(t *testing.T) {
	expected := "Moscow"
	geoData := geo.GeoData{
		City: expected,
	}
	format := 3
	result := weather.GetWeather(geoData, format)
	if !strings.Contains(result, expected) {
		t.Errorf("Ожидалось %v, получение %v", expected, result)
	}
}
```

#### Ошибки



`weather/weather.go`
```Go
package weather

import (
	"demo/weather/geo"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// не подходящий формат
var ErrWrongFormat = errors.New("WRONG_FORMAT")

// добавляем в возврат вторым параметром ошибку
func GetWeather(geo geo.GeoData, format int) (string, error) {
	if format < 1 || format > 4 {
		return "", ErrWrongFormat
	}
	
	baseUrl, err := url.Parse("https://wttr.in/" + geo.City)
	if err != nil {
		fmt.Println(err.Error())
		return "", errors.New("ERROR_URL")
	}
	params := url.Values{}
	params.Add("format", fmt.Sprint(format))
	baseUrl.RawQuery = params.Encode()
	resp, err := http.Get(baseUrl.String())
	if err != nil {
		fmt.Println(err.Error())
		return "", errors.New("ERROR_HTTP")
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err.Error())
		return "", errors.New("ERROR_READBODY")
	}
	return string(body), nil
}
```



`maing.go`
```Go
package main

import (
	"demo/weather/geo"
	"demo/weather/weather"
	"flag"
	"fmt"
)

func main() {
	fmt.Println("Новый проект")
	city := flag.String("city", "", "Город пользователя")
	format := flag.Int("format", 1, "Формат вывода погоды")

	flag.Parse()

	fmt.Println(*city)
	geoData, err := geo.GetMyLocation(*city)
	if err != nil {
		fmt.Println(err.Error())
	}

	// возвращаем ошибку
	weatherData, _ := weather.GetWeather(*geoData, *format)
	fmt.Println(weatherData)
}
```



`weather/weather_test.go`
```Go
package weather_test

import (
	"demo/weather/geo"
	"demo/weather/weather"
	"strings"
	"testing"
)

func TestGetWeather(t *testing.T) {
	expected := "Moscow"
	geoData := geo.GeoData{
		City: expected,
	}
	format := 3
	
	result, err := weather.GetWeather(geoData, format)
	
	if err != nil {
		t.Errorf("Пришла ошибка %v", err)
	}
	if !strings.Contains(result, expected) {
		t.Errorf("Ожидалось %v, получение %v", expected, result)
	}
}

func TestGetWeatherWrongFormat(t *testing.T) {
	expected := "Moscow"
	geoData := geo.GeoData{
		City: expected,
	}
	format := 124
	_, err := weather.GetWeather(geoData, format)
	if err != weather.ErrWrongFormat {
		t.Errorf("Ожидалось %v, получение %v", weather.ErrWrongFormat, err)
	}
}
```

### Группы тестов

С помощью `testing.Run` мы можем запустить функцию с тестом. Это сильно может нам помочь, чтобы сразу занести все пограничные значения определённых данных

`weather / weather_test.go`
```Go
package weather_test

import (
	"demo/weather/geo"
	"demo/weather/weather"
	"strings"
	"testing"
)

func TestGetWeather(t *testing.T) {
	expected := "Moscow"
	geoData := geo.GeoData{
		City: expected,
	}
	format := 3
	result, err := weather.GetWeather(geoData, format)
	if err != nil {
		t.Errorf("Пришла ошибка %v", err)
	}
	if !strings.Contains(result, expected) {
		t.Errorf("Ожидалось %v, получение %v", expected, result)
	}
}

var testCases = []struct {
	name   string
	format int
}{
	{name: "Big format", format: 147},
	{name: "0 format", format: 0},
	{name: "Minus format", format: -1},
}

func TestGetWeatherWrongFormat(t *testing.T) {
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			expected := "Moscow"
			geoData := geo.GeoData{
				City: expected,
			}
			_, err := weather.GetWeather(geoData, tc.format)
			if err != weather.ErrWrongFormat {
				t.Errorf("Ожидалось %v, получение %v", weather.ErrWrongFormat, err)
			}
		})
	}
}
```



---
# Эксперт

## Введение

Почему выбирают разработку бэкэнда на GO?

1. Он крайне производителен
   ![](../../_png/Pasted%20image%2020260412172740.png)
2. У него широкая стандартная библиотека и множество удобных инструментов, которые включают: валидацию, ORM, работу с env, криптографию, горутины и http
   ![](../../_png/Pasted%20image%2020260412172854.png)
3. Достаточно простое определение роутинга
   ![](../../_png/Pasted%20image%2020260412172959.png)
4. Горутины
   ![](../../_png/Pasted%20image%2020260412173043.png)

## Работа под капотом

### Что внутри программмы Go



`go.mod`
```Go
module go/adv-demo

go 1.23
```

`main.go`
```Go
package main

import "fmt"

func main() {
	fmt.Println("Привет")
}
```



![](../../_png/Pasted%20image%2020260412192351.png)


![](../../_png/Pasted%20image%2020260412192413.png)





### Модель памяти



![](../../_png/Pasted%20image%2020260412192448.png)


- константы
- инструкции

- heap
	- неограниченный размер
	- хранит struct, array и прочее (и некоторые pointers)
	- имеет неограниченный размер
- stack
	- хранит текущий процесс выполнения кода
	- стек эластичен
	- он может дополнять свою память из heap
	- Так же их может быть несколько - на каждую горутину по одному стеку
	  ![](../../_png/Pasted%20image%2020260412193109.png)

### Stack frames
### Heap



`main.go`
```Go
package main

import "fmt"

type User struct {
	Name string
}

func main() {
	user := &User{
		Name: "Вася",
	}
	fmt.Println(user)
}
```

### Pointer на heap



`main.go`
```Go
package main

type User struct {
	Name string
}

func main() {
	age := getAge()
	canDrink(age)
}

func canDrink(age *int) bool {
	return *age >= 18
}

func getAge() *int {
	age := 18
	return &age
}
```

### Go allocator
### Пример с Reader



`main.go`
```Go
package main

type Reader interface {
	Read(p []byte) (n int, err error)
}

type Reader2 interface {
	Read() (p []byte, err error)
}
```

### Работа GC









## Concurrency

### Что такое Gorutine
### Запуск Gorutine



`main.go`
```Go
package main

import (
	"fmt"
	"time"
)

func main() {
	go printHi()
	go fmt.Println("Привет из main 2")
	go fmt.Println("Привет из main")
	time.Sleep(time.Second)
}

func printHi() {
	fmt.Println("Привет из gr")
}
```

#### Ускорение работы



`main.go`
```Go
package main

import (
	"fmt"
	"net/http"
	"time"
)

// 10 конкурентных запросов на GET по адресу google.com
// Вывести в консоль 10 StatusCode

func main() {
	t := time.Now()
	for i := 0; i < 10; i++ {
		go getHttpCode()
	}
	time.Sleep(time.Millisecond * 1100)
	fmt.Println(time.Since(t))
}

func getHttpCode() {
	resp, err := http.Get("https://google.com")
	if err != nil {
		fmt.Printf("Ошибка %s", err.Error())
	}
	fmt.Printf("Код: %d\n", resp.StatusCode)
}
```

### WaitGroup



`main.go`
```Go
package main

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

// 10 конкурентных запросов на GET по адресу google.com
// Вывести в консоль 10 StatusCode

func main() {
	t := time.Now()
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			getHttpCode()
			wg.Done()
		}()
	}
	wg.Wait()
	fmt.Println(time.Since(t))
}

func getHttpCode() {
	resp, err := http.Get("https://google.com")
	if err != nil {
		fmt.Printf("Ошибка %s", err.Error())
	}
	fmt.Printf("Код: %d\n", resp.StatusCode)
}
```

### Планировщик
### Цикл планировщика
### Channels
### Создание канала



`main.go`
```Go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	code := make(chan int)
	go getHttpCode(code)
	<-code
}

func getHttpCode(codeCh chan int) {
	resp, err := http.Get("https://google.com")
	if err != nil {
		fmt.Printf("Ошибка %s", err.Error())
	}
	fmt.Printf("Код: %d\n", resp.StatusCode)
	codeCh <- resp.StatusCode
}
```

### Чтение данных



`main.go`
```Go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	code := make(chan int)
	for i := 0; i < 10; i++ {
		go getHttpCode(code)
	}
	for res := range code {
		fmt.Printf("Код: %d\n", res)
	}
}

func getHttpCode(codeCh chan int) {
	resp, err := http.Get("https://google.com")
	if err != nil {
		fmt.Printf("Ошибка %s", err.Error())
	}
	codeCh <- resp.StatusCode
}
```

### Закрытие канала



`main.go`
```Go
package main

import (
	"fmt"
	"net/http"
	"sync"
)

func main() {
	code := make(chan int)
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			getHttpCode(code)
			wg.Done()
		}()
	}
	go func() {
		wg.Wait()
		close(code)
	}()
	for res := range code {
		fmt.Printf("Код: %d\n", res)
	}
}

func getHttpCode(codeCh chan int) {
	resp, err := http.Get("https://google.com")
	if err != nil {
		fmt.Printf("Ошибка %s", err.Error())
	}
	codeCh <- resp.StatusCode
}
```

#### Сумма Slice



`main.go`
```Go
package main

import "fmt"

func sumPart(arr []int, ch chan int) {
	sum := 0
	for _, num := range arr {
		sum += num
	}
	ch <- sum
}

func main() {
	arr := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
	numGoroutines := 3
	ch := make(chan int, numGoroutines)

	partSize := len(arr) / numGoroutines

	for i := 0; i < numGoroutines; i++ {
		start := i * partSize
		end := start + partSize
		go sumPart(arr[start:end], ch)
	}

	totalSum := 0
	for i := 0; i < numGoroutines; i++ {
		totalSum += <-ch
	}
	fmt.Println("Total sum: ", totalSum)
}
```

### Обработка ошибок



`url.txt`
```txt
https://google.com
https://purpleschool.ru
htts://ya.ru
```



`main.go`
```Go
package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"
)

func ping(url string, respCh chan int, errCh chan error) {
	resp, err := http.Get(url)
	if err != nil {
		errCh <- err
		return
	}
	respCh <- resp.StatusCode
}

func main() {
	path := flag.String("file", "url.txt", "path to URL file")
	flag.Parse()
	file, err := os.ReadFile(*path)
	if err != nil {
		panic(err.Error())
	}
	urlSlice := strings.Split(string(file), "\n")
	respCh := make(chan int)
	errCh := make(chan error)
	for _, url := range urlSlice {
		go ping(url, respCh, errCh)
	}
	for i := 0; i < len(urlSlice); i++ {
		errRes := <-errCh
		fmt.Println(errRes)
		res := <-respCh
		fmt.Println(res)
	}
}
```

### Select



`main.go`
```Go
func main() {
	path := flag.String("file", "url.txt", "path to URL file")
	flag.Parse()
	file, err := os.ReadFile(*path)
	if err != nil {
		panic(err.Error())
	}
	urlSlice := strings.Split(string(file), "\n")
	respCh := make(chan int)
	errCh := make(chan error)
	for _, url := range urlSlice {
		go ping(url, respCh, errCh)
	}
	for range urlSlice {
		select {
		case err := <-errCh:
			fmt.Println(err)
		case res := <-respCh:
			fmt.Println(res)
		}
	}
}
```



## HTTP сервер

### Выбор HTTP сервера






### Простейший сервер



`main.go`
```Go
package main

import (
	"fmt"
	"net/http"
)

func hello(w http.ResponseWriter, req *http.Request) {
	fmt.Println("Hello")
}

func main() {
	http.HandleFunc("/hello", hello)
	fmt.Println("Server is listening on port 8081")
	http.ListenAndServe(":8081", nil)
}
```

### Как работают запросы






### Свой ServerMux



`main.go`
```Go
package main

import (
	"fmt"
	"net/http"
)

func hello(w http.ResponseWriter, req *http.Request) {
	fmt.Println("Hello")
}

func main() {
	router := http.NewServeMux()
	router.HandleFunc("/hello", hello)

	server := http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```

### Методы и коды ответа






### Handler



`handler.go`
```Go
package main

import (
	"fmt"
	"net/http"
)

type HelloHandler struct{}

func NewHelloHandler(router *http.ServeMux) {
	handler := &HelloHandler{}
	router.HandleFunc("/hello", handler.Hello())
}

func (handler *HelloHandler) Hello() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println("Hello")
	}
}
```



```Go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	router := http.NewServeMux()
	
	// применяем хэндлер
	NewHelloHandler(router)

	server := http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```




## Архитектура

### Структура приложения



`internal / hello / handler.go`
```Go
package hello

import (
	"fmt"
	"net/http"
)
```



`cmd / main.go`
```Go
package main

import (
	"fmt"
	"go/adv-demo/internal/hello"
	"net/http"
)

func main() {
	router := http.NewServeMux()
	hello.NewHelloHandler(router)

	server := http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```

### Конфигурация



`.env`
```
DSN=""
```



`configs/config.go`
```Go
package configs

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Db DbConfig
}

type DbConfig struct {
	Dsn string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using default config")
	}
	return &Config{
		Db: DbConfig{
			Dsn: os.Getenv("DSN"),
		},
	}
}
```



`cmd / main.go`
```Go
package main

import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/internal/hello"
	"net/http"
)

func main() {
	conf := configs.LoadConfig()
	// ...
}
```

### Обзор приложения







### Декомпозиция модуля







#### Модуль авторизация



`internal/auth/handler.go`
```Go
package auth

import (
	"fmt"
	"net/http"
)

type AuthHandler struct{}

func NewAuthHandler(router *http.ServeMux) {
	handler := &AuthHandler{}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println("Login")
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println("Register")
	}
}
```



`cmd / main.go`
```Go
package main

import (
	"fmt"
	"go/adv-demo/internal/auth"
	"net/http"
)

func main() {
	router := http.NewServeMux()
	auth.NewAuthHandler(router)

	server := http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```

### Передача зависимостей



`.env`
```
DSN=""
TOKEN="123"
```



`configs/config.go`
```Go
package configs

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Db   DbConfig
	Auth AuthConfig
}

type DbConfig struct {
	Dsn string
}

type AuthConfig struct {
	Secret string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using default config")
	}
	return &Config{
		Db: DbConfig{
			Dsn: os.Getenv("DSN"),
		},
		Auth: AuthConfig{
			Secret: os.Getenv("TOKEN"),
		},
	}
}
```



`internal/auth/handler.go`
```Go
package auth

import (
	"fmt"
	"go/adv-demo/configs"
	"net/http"
)

type AuthHandlerDeps struct {
	*configs.Config
}

type AuthHandler struct {
	*configs.Config
}

func NewAuthHandler(router *http.ServeMux, deps AuthHandlerDeps) {
	handler := &AuthHandler{
		Config: deps.Config,
	}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println(handler.Config.Auth.Secret)
		fmt.Println("Login")
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println("Register")
	}
}
```



`cmd / main.go`
```Go
package main

import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/internal/auth"
	"net/http"
)

func main() {
	conf := configs.LoadConfig()
	router := http.NewServeMux()
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config: conf,
	})

	server := http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```

### Ответ от API



`internal/auth/payload.go`
```Go
package auth

type LoginResponse struct {
	Token string `json:"token"`
}
```



`internal/auth/handler.go`
```Go
package auth

import (
	"encoding/json"
	"fmt"
	"go/adv-demo/configs"
	"net/http"
)

type AuthHandlerDeps struct {
	*configs.Config
}

type AuthHandler struct {
	*configs.Config
}

func NewAuthHandler(router *http.ServeMux, deps AuthHandlerDeps) {
	handler := &AuthHandler{
		Config: deps.Config,
	}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println(handler.Config.Auth.Secret)
		fmt.Println("Login")
		res := LoginResponse{
			Token: "123",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(201)
		json.NewEncoder(w).Encode(res)
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println("Register")
	}
}
```

#### Пакет ответа



`pkg/res/res.go`
```Go
package res

import (
	"encoding/json"
	"net/http"
)

func Json(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}
```



`internal/auth/handler.go`
```Go
package auth

import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/pkg/res"
	"net/http"
)

type AuthHandlerDeps struct {
	*configs.Config
}

type AuthHandler struct {
	*configs.Config
}

func NewAuthHandler(router *http.ServeMux, deps AuthHandlerDeps) {
	handler := &AuthHandler{
		Config: deps.Config,
	}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println(handler.Config.Auth.Secret)
		fmt.Println("Login")
		data := LoginResponse{
			Token: "123",
		}
		res.Json(w, data, 200)
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println("Register")
	}
}
```



## Запрос и валидация

### Чтение body



`internal/auth/payload.go`
```Go
package auth

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}
```



`internal/auth/handler.go`
```Go
package auth

import (
	"encoding/json"
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/pkg/res"
	"net/http"
)

type AuthHandlerDeps struct {
	*configs.Config
}

type AuthHandler struct {
	*configs.Config
}

func NewAuthHandler(router *http.ServeMux, deps AuthHandlerDeps) {
	handler := &AuthHandler{
		Config: deps.Config,
	}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		// Прочитать body
		var payload LoginRequest
		err := json.NewDecoder(req.Body).Decode(&payload)
		if err != nil {
			res.Json(w, err.Error(), 402)
		}
		fmt.Println(payload)
		data := LoginResponse{
			Token: "123",
		}
		res.Json(w, data, 200)
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fmt.Println("Register")
	}
}
```

#### Простая валидация



`internal/auth/handler.go`
```Go
func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		// Прочитать body
		var payload LoginRequest
		err := json.NewDecoder(req.Body).Decode(&payload)
		if err != nil {
			res.Json(w, err.Error(), 402)
			return
		}
		if payload.Email == "" {
			res.Json(w, "Email required", 402)
			return
		}
		if payload.Password == "" {
			res.Json(w, "Password required", 402)
			return
		}
		fmt.Println(payload)
		data := LoginResponse{
			Token: "123",
		}
		res.Json(w, data, 200)
	}
}
```

### Regexp



`internal/auth/handler.go`
```Go
func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		// Прочитать body
		var payload LoginRequest
		err := json.NewDecoder(req.Body).Decode(&payload)
		if err != nil {
			res.Json(w, err.Error(), 402)
			return
		}
		if payload.Email == "" {
			res.Json(w, "Email required", 402)
			return
		}
		_, err = mail.ParseAddress(payload.Email)
		if err != nil {
			res.Json(w, "Wrong email", 402)
			return
		}
		if payload.Password == "" {
			res.Json(w, "Password required", 402)
			return
		}
		fmt.Println(payload)
		data := LoginResponse{
			Token: "123",
		}
		res.Json(w, data, 200)
	}
}
```

### Go validator



`go.mod`
```
module go/adv-demo

go 1.22.5

require (
	github.com/gabriel-vasile/mimetype v1.4.3 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-playground/validator/v10 v10.22.0 // indirect
	github.com/joho/godotenv v1.5.1 // indirect
	github.com/leodido/go-urn v1.4.0 // indirect
	golang.org/x/crypto v0.19.0 // indirect
	golang.org/x/net v0.21.0 // indirect
	golang.org/x/sys v0.17.0 // indirect
	golang.org/x/text v0.14.0 // indirect
)
```



`internal/auth/payload.go`
```Go
package auth

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
}
```



`internal/auth/handler.go`
```Go
package auth

import (
	"encoding/json"
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/pkg/res"
	"net/http"

	"github.com/go-playground/validator/v10"
)

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		// Прочитать body
		var payload LoginRequest
		err := json.NewDecoder(req.Body).Decode(&payload)
		if err != nil {
			res.Json(w, err.Error(), 402)
			return
		}
		validate := validator.New()
		err = validate.Struct(payload)
		if err != nil {
			res.Json(w, err.Error(), 402)
			return
		}
		fmt.Println(payload)
		data := LoginResponse{
			Token: "123",
		}
		res.Json(w, data, 200)
	}
}
```

### Вынос обработчика



`pkg/req/validate.go`
```Go
package req

import (
	"github.com/go-playground/validator/v10"
)

func IsValid[T any](payload T) error {
	validate := validator.New()
	err := validate.Struct(payload)
	return err
}
```



`pkg/req/handle.go`
```Go
package req

import (
	"go/adv-demo/pkg/res"
	"net/http"
)

func HandleBody[T any](w *http.ResponseWriter, r *http.Request) (*T, error) {
	body, err := Decode[T](r.Body)
	if err != nil {
		res.Json(*w, err.Error(), 402)
		return nil, err
	}
	err = IsValid(body)
	if err != nil {
		res.Json(*w, err.Error(), 402)
		return nil, err
	}
	return &body, nil
}
```



`pkg/req/decode.go`
```Go
package req

import (
	"encoding/json"
	"io"
)

func Decode[T any](body io.ReadCloser) (T, error) {
	var payload T
	err := json.NewDecoder(body).Decode(&payload)
	if err != nil {
		return payload, err
	}
	return payload, nil
}
```

#### Регистрация



`internal/auth/payload.go`
```Go
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
	Name     string `json:"name" validate:"required"`
}

type RegisterResponse struct {
	Token string `json:"token"`
}
```



`internal/auth/handler.go`
```Go
package auth

import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/pkg/req"
	"go/adv-demo/pkg/res"
	"net/http"
)

type AuthHandlerDeps struct {
	*configs.Config
}

type AuthHandler struct {
	*configs.Config
}

func NewAuthHandler(router *http.ServeMux, deps AuthHandlerDeps) {
	handler := &AuthHandler{
		Config: deps.Config,
	}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LoginRequest](&w, r)
		if err != nil {
			return
		}
		fmt.Println(body)
		data := LoginResponse{
			Token: "123",
		}
		res.Json(w, data, 200)
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[RegisterRequest](&w, r)
		if err != nil {
			return
		}
		fmt.Println(body)
	}
}
```



## Подключение к БД

### Развёртывание PgSQL



`.gitignore`
```
/.env
/postgres-data
```



`docker-compose.yml`
```YML
services:
  postgres:
    container_name: postgres_go
    image: postgres:16.4
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: my_pass
      PGDATA: /data/postgres
    volumes:
      - ./postgres-data:/data/postgres
    ports:
      - "5432:5432"
```

### Подключение к базе







### Выбор ORM



### Подключение к GORM



`pkg/db/db.go`
```Go
package db

import (
	"go/adv-demo/configs"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Db struct {
	*gorm.DB
}

func NewDb(conf *configs.Config) *Db {
	db, err := gorm.Open(postgres.Open(conf.Db.Dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	return &Db{db}
}
```



`cmd / main.go`
```Go
import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/internal/auth"
	"go/adv-demo/pkg/db"
	"net/http"
)

func main() {
	conf := configs.LoadConfig()
	_ = db.NewDb(conf)
	router := http.NewServeMux()
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config: conf,
	})
```

### Описание модели



`go.mod`
```
require (
	github.com/go-playground/validator/v10 v10.22.0
	github.com/joho/godotenv v1.5.1
	gorm.io/driver/postgres v1.5.9
	gorm.io/gorm v1.25.11
)
```



`internal/link/model.go`
```Go
package link

import (
	"math/rand"

	"gorm.io/gorm"
)

type Link struct {
	gorm.Model
	Url  string `json:"url"`
	Hash string `json:"hash" gorm:"uniqueIndex"`
}

func NewLink(url string) *Link {
	return &Link{
		Url:  url,
		Hash: RandStringRunes(6),
	}
}

var letterRunes = []rune("abcdefghijklmnoprstuvwxyzABCDEFGHIJKLMNOPRSTUVWXYZ")

func RandStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}
```

### Автомиграции



`migrations/auto.go`
```Go
package main

import (
	"go/adv-demo/internal/link"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		panic(err)
	}
	db, err := gorm.Open(postgres.Open(os.Getenv("DSN")), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	db.AutoMigrate(&link.Link{})
}
```



## CRUD

#### Handler ссылок



`internal/link/handler.go`
```Go
package link

import (
	"net/http"
)

type LinkHandlerDeps struct {
}

type LinkHandler struct {
}

func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{}
	router.HandleFunc("POST /link", handler.Create())
	router.HandleFunc("PATCH /link/{id}", handler.Update())
	router.HandleFunc("DELETE /link/{id}", handler.Delete())
	router.HandleFunc("GET /{alias}", handler.GoTo())
}

func (handler *LinkHandler) Create() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (handler *LinkHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (handler *LinkHandler) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (handler *LinkHandler) GoTo() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
```



`cmd/main.go`
```Go
package main

import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/internal/auth"
	"go/adv-demo/internal/link"
	"go/adv-demo/pkg/db"
	"net/http"
)

func main() {
	conf := configs.LoadConfig()
	_ = db.NewDb(conf)
	router := http.NewServeMux()

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config: conf,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{})

	server := http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```

### Параметр запроса



`internal/link/handler.go`
```Go
package link

import (
	"fmt"
	"net/http"
)

type LinkHandlerDeps struct {
}

type LinkHandler struct {
}

func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{}
	router.HandleFunc("POST /link", handler.Create())
	router.HandleFunc("PATCH /link/{id}", handler.Update())
	router.HandleFunc("DELETE /link/{id}", handler.Delete())
	router.HandleFunc("GET /{hash}", handler.GoTo())
}

func (handler *LinkHandler) Create() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (handler *LinkHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (handler *LinkHandler) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		fmt.Println(id)
	}
}

func (handler *LinkHandler) GoTo() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
```

### Паттерн репозитория



`internal/link/repository.go`
```Go
package link

import "go/adv-demo/pkg/db"

type LinkRepository struct {
	Database *db.Db
}

func NewLinkRepository(database *db.Db) *LinkRepository {
	return &LinkRepository{
		Database: database,
	}
}

func (repo *LinkRepository) Create(link *Link) {

}
```



`internal/link/handler.go`
```Go
type LinkHandlerDeps struct {
	LinkRepository *LinkRepository
}

type LinkHandler struct {
	LinkRepository *LinkRepository
}

func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{
		LinkRepository: deps.LinkRepository,
	}
```



`cmd/main.go`
```Go
func main() {
	conf := configs.LoadConfig()
	db := db.NewDb(conf)
	router := http.NewServeMux()

	// Repositories
	linkRepository := link.NewLinkRepository(db)

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config: conf,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{
		LinkRepository: linkRepository,
	})
```

### Создание ссылки



`internal/link/payload.go`
```Go
package link

type LinkCreateRequest struct {
	Url string `json:"url" validate:"required,url"`
}
```



`internal/link/repository.go`
```Go
func (repo *LinkRepository) Create(link *Link) (*Link, error) {
	result := repo.Database.DB.Create(link)
	if result.Error != nil {
		return nil, result.Error
	}
	return link, nil
}
```



`internal/link/handler.go`
```Go
func (handler *LinkHandler) Create() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LinkCreateRequest](&w, r)
		if err != nil {
			return
		}
		link := NewLink(body.Url)
		createdLink, err := handler.LinkRepository.Create(link)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		res.Json(w, createdLink, 201)

	}
}
```

### Получение ссылки



`internal/link/repository.go`
```Go
func (repo *LinkRepository) GetByHash(hash string) (*Link, error) {
	var link Link
	result := repo.Database.DB.First(&link, "hash = ?", hash)
	if result.Error != nil {
		return nil, result.Error
	}
	return &link, nil
}
```



`internal/link/handler.go`
```Go
func (handler *LinkHandler) GoTo() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		hash := r.PathValue("hash")
		link, err := handler.LinkRepository.GetByHash(hash)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Redirect(w, r, link.Url, http.StatusTemporaryRedirect)
	}
}
```

#### Проверка hash



`internal/link/handler.go`
```Go
func (handler *LinkHandler) Create() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LinkCreateRequest](&w, r)
		if err != nil {
			return
		}
		link := NewLink(body.Url)
		for {
			existedLink, _ := handler.LinkRepository.GetByHash(link.Hash)
			if existedLink == nil {
				break
			}
			link.GenerateHash()
		}
		createdLink, err := handler.LinkRepository.Create(link)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		res.Json(w, createdLink, 201)

	}
}
```



`internal/link/model.go`
```Go
func NewLink(url string) *Link {
	link := &Link{
		Url: url,
	}
	link.GenerateHash()
	return link
}

func (link *Link) GenerateHash() {
	link.Hash = RandStringRunes(6)
}
```

### Изменение ссылки



`internal/link/payload.go`
```Go
package link

type LinkCreateRequest struct {
	Url string `json:"url" validate:"required,url"`
}
type LinkUpdateRequest struct {
	Url  string `json:"url" validate:"required,url"`
	Hash string `json:"hash,omitempty"`
}
```



`internal/link/repository.go`
```Go
import (
	"go/adv-demo/pkg/db"

	"gorm.io/gorm/clause"
)

func (repo *LinkRepository) Update(link *Link) (*Link, error) {
	result := repo.Database.DB.Clauses(clause.Returning{}).Updates(link)
	if result.Error != nil {
		return nil, result.Error
	}
	return link, nil
}
```



`internal/link/handler.go`
```Go
import (
	"fmt"
	"go/adv-demo/pkg/req"
	"go/adv-demo/pkg/res"
	"net/http"
	"strconv"

	"gorm.io/gorm"
)


func (handler *LinkHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LinkUpdateRequest](&w, r)
		if err != nil {
			return
		}
		idString := r.PathValue("id")
		id, err := strconv.ParseUint(idString, 10, 32)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		link, err := handler.LinkRepository.Update(&Link{
			Model: gorm.Model{ID: uint(id)},
			Url:   body.Url,
			Hash:  body.Hash,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		res.Json(w, link, 201)
	}
}
```

### Удаление ссылки



`internal/link/handler.go`
```Go
func (handler *LinkHandler) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idString := r.PathValue("id")
		id, err := strconv.ParseUint(idString, 10, 32)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		err = handler.LinkRepository.Delete(uint(id))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		res.Json(w, nil, 200)
	}
}
```



`internal/link/repository.go`
```Go
func (repo *LinkRepository) Delete(id uint) error {
	result := repo.Database.DB.Delete(&Link{}, id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
```

#### Проверка наличия



`internal/link/repository.go`
```Go
func (repo *LinkRepository) GetById(id uint) (*Link, error) {
	var link Link
	result := repo.Database.DB.First(&link, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &link, nil
}
```



`internal/link/handler.go`
```Go
func (handler *LinkHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LinkUpdateRequest](&w, r)
		if err != nil {
			return
		}
		idString := r.PathValue("id")
		id, err := strconv.ParseUint(idString, 10, 32)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		link, err := handler.LinkRepository.Update(&Link{
			Model: gorm.Model{ID: uint(id)},
			Url:   body.Url,
			Hash:  body.Hash,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		res.Json(w, link, 201)
	}
}

func (handler *LinkHandler) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idString := r.PathValue("id")
		id, err := strconv.ParseUint(idString, 10, 32)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		_, err = handler.LinkRepository.GetById(uint(id))
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		err = handler.LinkRepository.Delete(uint(id))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		res.Json(w, nil, 200)
	}
}
```



## Middleware

### Что такое middleware



### Первый обработчик



`pkg/middleware/logs.go`
```Go
package middleware

import (
	"fmt"
	"net/http"
)

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Logging")
		next.ServeHTTP(w, r)
		fmt.Println("After")
	})
}
```



`cmd/main.go`
```Go
server := http.Server{
	Addr:    ":8081",
	// - Handler: router,
	Handler: middleware.Logging(router),
}

```

### Wrapper Writer



`pkg/middleware/common.go`
```Go
package middleware

import "net/http"

type WrapperWriter struct {
	http.ResponseWriter
	StatusCode int
}

func (w *WrapperWriter) WriteHeader(statusCode int) {
	w.ResponseWriter.WriteHeader(statusCode)
	w.StatusCode = statusCode
}
```



`pkg/middleware/logs.go`
```Go
package middleware

import (
	"log"
	"net/http"
	"time"
)

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapper := &WrapperWriter{
			ResponseWriter: w,
			StatusCode:     http.StatusOK,
		}
		next.ServeHTTP(wrapper, r)
		log.Println(wrapper.StatusCode, r.Method, r.URL.Path, time.Since(start))
	})
}
```

### CORS



`pkg/middleware/cors.go`
```Go
package middleware

import "net/http"

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			next.ServeHTTP(w, r)
			return
		}
		header := w.Header()
		header.Set("Access-Control-Allow-Origin", origin)
		header.Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			header.Set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,HEAD,PATCH")
			header.Set("Access-Control-Allow-Headers", "authorization,content-type,content-length")
			header.Set("Access-Control-Max-Age", "86400")
			return
		}
		next.ServeHTTP(w, r)
	})
}
```



`cmd/main.go`
```Go
server := http.Server{
	Addr:    ":8081",
	// - Handler: middleware.Logging(router),
	Handler: middleware.CORS(middleware.Logging(router)),
}
```

### Stack middleware



`pkg/middleware/chain.go`
```Go
package middleware

import "net/http"

type Middleware func(http.Handler) http.Handler

func Chain(middlewares ...Middleware) Middleware {
	return func(next http.Handler) http.Handler {
		for i := len(middlewares) - 1; i >= 0; i-- {
			next = middlewares[i](next)
		}
		return next
	}
}
```



`cmd/main.go`
```Go
// Middlewares
stack := middleware.Chain(
	middleware.CORS,
	middleware.Logging,
)

server := http.Server{
	Addr:    ":8081",
	// - Handler: middleware.CORS(middleware.Logging(router)),
	Handler: stack(router),
}
```

#### Получение bearer



`pkg/middleware/auth.go`
```Go
package middleware

import (
	"fmt"
	"net/http"
	"strings"
)

func IsAuthed(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authedHeader := r.Header.Get("Authorization")
		token := strings.TrimPrefix(authedHeader, "Bearer ")
		fmt.Println(token)
		next.ServeHTTP(w, r)
	})
}
```



`cmd/main.go`
```Go
stack := middleware.Chain(
	middleware.CORS,
	middleware.Logging,
	middleware.IsAuthed,
)
```

### Middleware для роутеров



`cmd / main.go`
```Go
stack := middleware.Chain(
	middleware.CORS,
	middleware.Logging,
)
```



`internal/link/handler.go`
```Go
func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{
		LinkRepository: deps.LinkRepository,
	}
	router.HandleFunc("POST /link", handler.Create())
	router.Handle("PATCH /link/{id}", middleware.IsAuthed(handler.Update()))
	router.HandleFunc("DELETE /link/{id}", handler.Delete())
	router.HandleFunc("GET /{hash}", handler.GoTo())
}
```




## Авторизация

### Что такое JWT



`internal/user/model.go`
```Go
package user

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Email    string `gorm:"index"`
	Password string
	Name     string
}
```



`migrations/auto.go`
```Go
func main() {
	err := godotenv.Load(".env")
	if err != nil {
		panic(err)
	}
	db, err := gorm.Open(postgres.Open(os.Getenv("DSN")), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	
								// передаём указатель на пользователя 
	db.AutoMigrate(&link.Link{}, &user.User{})
}
```

#### Модель пользователя



`internal/user/repository.go`
```Go
package user

import "go/adv-demo/pkg/db"

type UserRepository struct {
	database *db.Db
}

func NewUserRepository(database *db.Db) *UserRepository {
	return &UserRepository{database: database}
}

func (repo *UserRepository) Create(user *User) (*User, error) {
	result := repo.database.DB.Create(user)
	if result.Error != nil {
		return nil, result.Error
	}
	return user, nil
}

func (repo *UserRepository) FindByEmail(email string) (*User, error) {
	var user User
	result := repo.database.DB.First(&user, "email = ?", email)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}
```

#### Репозиторий пользователей




### Сервис авторизации



`internal/auth/errors.go`
```Go
ackage auth

const (
	ErrUserExists = "user exists"
)
```



`internal/auth/service.go`
```Go
package auth

import (
	"errors"
	"go/adv-demo/internal/user"
)

type AuthService struct {
	UserRepository *user.UserRepository
}

func NewAuthService(userRepository *user.UserRepository) *AuthService {
	return &AuthService{UserRepository: userRepository}
}

func (service *AuthService) Register(email, password, name string) (string, error) {
	existedUser, _ := service.UserRepository.FindByEmail(email)
	if existedUser != nil {
		return "", errors.New(ErrUserExists)
	}
	user := &user.User{
		Email:    email,
		Password: "",
		Name:     name,
	}
	_, err := service.UserRepository.Create(user)
	if err != nil {
		return "", err
	}
	return user.Email, nil
}
```



`internal/auth/handler.go`
```Go
ype AuthHandlerDeps struct {
	*configs.Config
	*AuthService
}

type AuthHandler struct {
	*configs.Config
	*AuthService
}

func NewAuthHandler(router *http.ServeMux, deps AuthHandlerDeps) {
	handler := &AuthHandler{
		Config:      deps.Config,
		AuthService: deps.AuthService,
	}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[RegisterRequest](&w, r)
		if err != nil {
			return
		}
		handler.AuthService.Register(body.Email, body.Password, body.Name)
	}
}
```



`cmd / main.go`
```Go
func main() {
	conf := configs.LoadConfig()
	db := db.NewDb(conf)
	router := http.NewServeMux()

	// Repositories
	linkRepository := link.NewLinkRepository(db)
	userRepository := user.NewUserRepository(db)

	// Services
	authService := auth.NewAuthService(userRepository)

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config:      conf,
		AuthService: authService,
	})
```

### Bcrypt



`internal/auth/service.go`
```Go
import (
	"errors"
	"go/adv-demo/internal/user"

	"golang.org/x/crypto/bcrypt"
)

func (service *AuthService) Register(email, password, name string) (string, error) {
	existedUser, _ := service.UserRepository.FindByEmail(email)
	
	if existedUser != nil {
		return "", errors.New(ErrUserExists)
	}
	
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	
	if err != nil {
		return "", err
	}
	user := &user.User{
		Email:    email,
		Password: string(hashedPassword),
		Name:     name,
	}
	
	_, err = service.UserRepository.Create(user)
	
	if err != nil {
		return "", err
	}
	
	return user.Email, nil
}
```

#### Логин пользователя


`internal/auth/errors.go`
```Go
package auth

const (
	ErrUserExists      = "user exists"
	ErrWrongCredetials = "wrong email or password"
)
```



`internal/auth/service.go`
```Go
func (service *AuthService) Login(email, password string) (string, error) {
	existedUser, _ := service.UserRepository.FindByEmail(email)
	if existedUser == nil {
		return "", errors.New(ErrWrongCredetials)
	}
	err := bcrypt.CompareHashAndPassword([]byte(existedUser.Password), []byte(password))
	if err != nil {
		return "", errors.New(ErrWrongCredetials)
	}
	return existedUser.Email, nil
}
```



`internal/auth/handler.go`
```Go
func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LoginRequest](&w, r)
		if err != nil {
			return
		}
		email, err := handler.AuthService.Login(body.Email, body.Password)
		fmt.Println(email, err)
		data := LoginResponse{
			Token: "123",
		}
		res.Json(w, data, 200)
	}
}
```

### Создание JWT



```bash
go get github.com/golang-jwt/jwt/v5 
```



`pkg/jwt/jwt.go`
```Go
package jwt

import "github.com/golang-jwt/jwt/v5"

type JWT struct {
	Secret string
}

func NewJWT(secret string) *JWT {
	return &JWT{
		Secret: secret,
	}
}

func (j *JWT) Create(email string) (string, error) {
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": email,
	})
	s, err := t.SignedString([]byte(j.Secret))
	if err != nil {
		return "", err
	}
	return s, nil
}
```

#### Финал авторизации



`configs/config.go`
```Go
func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using default config")
	}
	return &Config{
		Db: DbConfig{
			Dsn: os.Getenv("DSN"),
		},
		Auth: AuthConfig{
			Secret: os.Getenv("SECRET"),
		},
	}
}
```



`internal/auth/handler.go`
```Go
package auth

import (
	"go/adv-demo/configs"
	"go/adv-demo/pkg/jwt"
	"go/adv-demo/pkg/req"
	"go/adv-demo/pkg/res"
	"net/http"
)

type AuthHandlerDeps struct {
	*configs.Config
	*AuthService
}

type AuthHandler struct {
	*configs.Config
	*AuthService
}

func NewAuthHandler(router *http.ServeMux, deps AuthHandlerDeps) {
	handler := &AuthHandler{
		Config:      deps.Config,
		AuthService: deps.AuthService,
	}
	router.HandleFunc("POST /auth/login", handler.Login())
	router.HandleFunc("POST /auth/register", handler.Register())
}

func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LoginRequest](&w, r)
		if err != nil {
			return
		}
		email, err := handler.AuthService.Login(body.Email, body.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		token, err := jwt.NewJWT(handler.Config.Auth.Secret).Create(email)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		data := LoginResponse{
			Token: token,
		}
		res.Json(w, data, 200)
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[RegisterRequest](&w, r)
		if err != nil {
			return
		}
		email, err := handler.AuthService.Register(body.Email, body.Password, body.Name)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		token, err := jwt.NewJWT(handler.Config.Auth.Secret).Create(email)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		data := RegisterResponse{
			Token: token,
		}
		res.Json(w, data, 200)
	}
}
```




## Контекст

### Что такое контекст








### WithTimeout



`cmd/main.go`
```Go
func main() {
	ctx := context.Background()
	ctxWithTimeout, cencel := context.WithTimeout(ctx, 4*time.Second)
	defer cencel()

	done := make(chan struct{})
	go func() {
		time.Sleep(3 * time.Second)
		close(done)
	}()

	select {
	case <-done:
		fmt.Println("Done task")
	case <-ctxWithTimeout.Done():
		fmt.Println("Timeout")
	}
}
```

### WithValue



`cmd/main.go`
```Go
func main() {
	type key int
	const EmailKey key = 0
	ctx := context.Background()
	ctxWithValue := context.WithValue(ctx, EmailKey, "a@a.ru")

	if userEmail, ok := ctxWithValue.Value(EmailKey).(string); ok {
		fmt.Println(userEmail)
	} else {
		fmt.Println("No value")
	}

}
```

### WithCancel



`cmd/main.go`
```Go
func tickOperation(ctx context.Context) {
	ticker := time.NewTicker(200 * time.Millisecond)
	for {
		select {
		case <-ticker.C:
			fmt.Println("Tick")
		case <-ctx.Done():
			fmt.Println("Cancel")
			return
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	go tickOperation(ctx)

	time.Sleep(2 * time.Second)
	cancel()
	time.Sleep(2 * time.Second)
}
```

### Получение email из JWT



`pkg/jwt/jwt.go`
```Go
package jwt

import "github.com/golang-jwt/jwt/v5"

type JWTData struct {
	Email string
}

type JWT struct {
	Secret string
}

func NewJWT(secret string) *JWT {
	return &JWT{
		Secret: secret,
	}
}

func (j *JWT) Create(data JWTData) (string, error) {
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": data.Email,
	})
	s, err := t.SignedString([]byte(j.Secret))
	if err != nil {
		return "", err
	}
	return s, nil
}

func (j *JWT) Parse(token string) (bool, *JWTData) {
	t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return []byte(j.Secret), nil
	})
	if err != nil {
		return false, nil
	}
	email := t.Claims.(jwt.MapClaims)["email"]
	return t.Valid, &JWTData{
		Email: email.(string),
	}
}
```



`cmd/main.go`
```Go
func main() {
	conf := configs.LoadConfig()
	db := db.NewDb(conf)
	router := http.NewServeMux()

	// Repositories
	linkRepository := link.NewLinkRepository(db)
	userRepository := user.NewUserRepository(db)

	// Services
	authService := auth.NewAuthService(userRepository)

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config:      conf,
		AuthService: authService,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{
		LinkRepository: linkRepository,
		Config:         conf,
	})
```



`internal/auth/handler.go`
```Go
func (handler *AuthHandler) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[LoginRequest](&w, r)
		if err != nil {
			return
		}
		email, err := handler.AuthService.Login(body.Email, body.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		
		// 
		token, err := jwt.NewJWT(handler.Config.Auth.Secret).Create(jwt.JWTData{
			Email: email,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		data := LoginResponse{
			Token: token,
		}
		res.Json(w, data, 200)
	}
}

func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[RegisterRequest](&w, r)
		if err != nil {
			return
		}
		email, err := handler.AuthService.Register(body.Email, body.Password, body.Name)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		
		// 
		token, err := jwt.NewJWT(handler.Config.Auth.Secret).Create(jwt.JWTData{
			Email: email,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		data := RegisterResponse{
			Token: token,
		}
		res.Json(w, data, 200)
	}
}
```



`internal/link/handler.go`
```Go
type LinkHandlerDeps struct {
	LinkRepository *LinkRepository
	Config         *configs.Config
}

type LinkHandler struct {
	LinkRepository *LinkRepository
}

func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{
		LinkRepository: deps.LinkRepository,
	}
	router.HandleFunc("POST /link", handler.Create())

	// 
	router.Handle("PATCH /link/{id}", middleware.IsAuthed(handler.Update(), deps.Config))
	router.HandleFunc("DELETE /link/{id}", handler.Delete())
	router.HandleFunc("GET /{hash}", handler.GoTo())
}
```

### Запись в контекст



`pkg/middleware/auth.go`
```Go
package middleware

import (
	"context"
	"go/adv-demo/configs"
	"go/adv-demo/pkg/jwt"
	"net/http"
	"strings"
)

type key string

const (
	ContextEmailKey key = "ContextEmailKey"
)

func IsAuthed(next http.Handler, config *configs.Config) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authedHeader := r.Header.Get("Authorization")
		token := strings.TrimPrefix(authedHeader, "Bearer ")
		_, data := jwt.NewJWT(config.Auth.Secret).Parse(token)
		ctx := context.WithValue(r.Context(), ContextEmailKey, data.Email)
		req := r.WithContext(ctx)
		next.ServeHTTP(w, req)
	})
}
```

#### Чтение из контекста



`internal/link/handler.go`
```Go
func (handler *LinkHandler) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// получаем email из контекста
		email, ok := r.Context().Value(middleware.ContextEmailKey).(string)
		if ok {
			fmt.Println(email)
		}
		
		body, err := req.HandleBody[LinkUpdateRequest](&w, r)
		if err != nil {
			return
		}
		idString := r.PathValue("id")
		id, err := strconv.ParseUint(idString, 10, 32)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		link, err := handler.LinkRepository.Update(&Link{
			Model: gorm.Model{ID: uint(id)},
			Url:   body.Url,
			Hash:  body.Hash,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		res.Json(w, link, 201)
	}
}
```

### Unauthed



`pkg/middleware/auth.go`
```Go

func writeUnauthed(w http.ResponseWriter) {
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(http.StatusText(http.StatusUnauthorized)))
}

func IsAuthed(next http.Handler, config *configs.Config) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authedHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authedHeader, "Bearer ") {
			writeUnauthed(w)
			return
		}
		token := strings.TrimPrefix(authedHeader, "Bearer ")
		isValid, data := jwt.NewJWT(config.Auth.Secret).Parse(token)
		if !isValid {
			writeUnauthed(w)
			return
		}
		ctx := context.WithValue(r.Context(), ContextEmailKey, data.Email)
		req := r.WithContext(ctx)
		next.ServeHTTP(w, req)
	})
}
```



## Продвинутая работа с БД

### Формирование запроса



`internal/link/repository.go`
```Go
func (repo *LinkRepository) GetLinks(limit, offset int) []Link {
	var links []Link
	repo.Database.
		Table("links").
		Where("deleted_at is null").
		Order("id asc").
		Limit(limit).
		Offset(offset).
		Scan(&links)
	return links
}
```

### Limit и offset



`internal/link/repository.go`
```Go
func (repo *LinkRepository) Count() int64 {
	var count int64
	repo.Database.
		Table("links").
		Where("deleted_at is null").
		Count(&count)
	return count
}

func (repo *LinkRepository) GetAll(limit, offset int) []Link {
	var links []Link
	repo.Database.
		Table("links").
		Where("deleted_at is null").
		Order("id asc").
		Limit(limit).
		Offset(offset).
		Scan(&links)
	return links
}
```

### Count



`internal/link/handler.go`
```Go
func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{
		LinkRepository: deps.LinkRepository,
	}
	router.HandleFunc("POST /link", handler.Create())
	router.Handle("PATCH /link/{id}", middleware.IsAuthed(handler.Update(), deps.Config))
	router.HandleFunc("DELETE /link/{id}", handler.Delete())
	router.HandleFunc("GET /{hash}", handler.GoTo())
	router.Handle("GET /link", middleware.IsAuthed(handler.GetAll(), deps.Config))
}

func (handler *LinkHandler) GetAll() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
		if err != nil {
			http.Error(w, "Invalid limit", http.StatusBadRequest)
			return
		}
	}
}
```

### Query параметры



`internal/link/payload.go`
```Go
package link

type LinkCreateRequest struct {
	Url string `json:"url" validate:"required,url"`
}

type LinkUpdateRequest struct {
	Url  string `json:"url" validate:"required,url"`
	Hash string `json:"hash,omitempty"`
}

type GetAllLinksResponse struct {
	Links []Link `json:"links"`
	Count int64  `json:"count"`
}
```



`internal/link/handler.go`
```Go
func (handler *LinkHandler) GetAll() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
		if err != nil {
			http.Error(w, "Invalid limit", http.StatusBadRequest)
			return
		}
		offset, err := strconv.Atoi(r.URL.Query().Get("offset"))
		if err != nil {
			http.Error(w, "Invalid offset", http.StatusBadRequest)
			return
		}
		links := handler.LinkRepository.GetAll(limit, offset)
		count := handler.LinkRepository.Count()
		res.Json(w, GetAllLinksResponse{
			Links: links,
			Count: count,
		}, 200)
	}
}
```

#### Список ссылок








### Один ко многим



`internal/link/model.go`
```Go
import (
	"go/adv-demo/internal/stat"
	"math/rand"

	"gorm.io/gorm"
)

type Link struct {
	gorm.Model
	Url   string      `json:"url"`
	Hash  string      `json:"hash" gorm:"uniqueIndex"`
	Stats []stat.Stat `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}
```



`internal/stat/model.go`
```Go
package stat

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Stat struct {
	gorm.Model
	LinkId uint           `json:"link_id"`
	Clicks int            `json:"clicks"`
	Date   datatypes.Date `json:"date"`
}
```



`migrations/auto.go`
```Go
func main() {
	err := godotenv.Load(".env")
	if err != nil {
		panic(err)
	}
	db, err := gorm.Open(postgres.Open(os.Getenv("DSN")), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	
	// 
	db.AutoMigrate(&link.Link{}, &user.User{}, &stat.Stat{})
}
```


### Добавление клика



`internal/stat/repository.go`
```Go
package stat

import (
	"go/adv-demo/pkg/db"
	"time"

	"gorm.io/datatypes"
)

type StatRepository struct {
	*db.Db
}

func NewStatRepository(db *db.Db) *StatRepository {
	return &StatRepository{
		Db: db,
	}
}

func (repo *StatRepository) AddClick(linkId uint) {
	var stat Stat
	currentDate := datatypes.Date(time.Now())
	repo.Db.Find(&stat, "link_id = ? and date = ?", linkId, currentDate)
	if stat.ID == 0 {
		repo.Db.Create(&Stat{
			LinkId: linkId,
			Clicks: 1,
			Date:   currentDate,
		})
	} else {
		stat.Clicks += 1
		repo.Db.Save(&stat)
	}
}
```

#### Простое добавление



`cmd/main.go`
```Go
func main() {
	conf := configs.LoadConfig()
	db := db.NewDb(conf)
	router := http.NewServeMux()

	// Repositories
	linkRepository := link.NewLinkRepository(db)
	userRepository := user.NewUserRepository(db)
	statRepository := stat.NewStatRepository(db)

	// Services
	authService := auth.NewAuthService(userRepository)

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config:      conf,
		AuthService: authService,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{
		LinkRepository: linkRepository,
		StatRepository: statRepository,
		Config:         conf,
	})
```



`internal/link/handler.go`
```Go
import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/internal/stat"
	"go/adv-demo/pkg/middleware"
	"go/adv-demo/pkg/req"
	"go/adv-demo/pkg/res"
	"net/http"
	"strconv"

	"gorm.io/gorm"
)

type LinkHandlerDeps struct {
	LinkRepository *LinkRepository
	StatRepository *stat.StatRepository
	Config         *configs.Config
}

type LinkHandler struct {
	LinkRepository *LinkRepository
	StatRepository *stat.StatRepository
}

func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{
		LinkRepository: deps.LinkRepository,
		
		// 
		StatRepository: deps.StatRepository,
	}
	router.HandleFunc("POST /link", handler.Create())
	router.Handle("PATCH /link/{id}", middleware.IsAuthed(handler.Update(), deps.Config))
	router.HandleFunc("DELETE /link/{id}", handler.Delete())
	router.HandleFunc("GET /{hash}", handler.GoTo())
	router.Handle("GET /link", middleware.IsAuthed(handler.GetAll(), deps.Config))
}

func (handler *LinkHandler) GoTo() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		hash := r.PathValue("hash")
		link, err := handler.LinkRepository.GetByHash(hash)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		
		// 
		handler.StatRepository.AddClick(link.ID)
		http.Redirect(w, r, link.Url, http.StatusTemporaryRedirect)
	}
}

```

### Правильный DI



`pkg/di/interfaces.go`
```Go
package di

type IStatRepository interface {
	AddClick(linkId uint)
}
```



`internal/link/handler.go`
```Go
ype LinkHandlerDeps struct {
	LinkRepository *LinkRepository
	StatRepository di.IStatRepository
	Config         *configs.Config
}

type LinkHandler struct {
	LinkRepository *LinkRepository
	StatRepository di.IStatRepository
}
```

### Eventbus



`pkg/event/eventbus.go`
```Go
package event

type Event struct {
	Type string
	Data any
}

type EventBus struct {
	bus chan Event
}

func NewEventBus() *EventBus {
	return &EventBus{
		bus: make(chan Event),
	}
}

func (e *EventBus) Publush(event Event) {
	e.bus <- event
}

func (e *EventBus) Subscribe() <-chan Event {
	return e.bus
}
```

### Отправка события



`pkg/event/eventbus.go`
```Go
ackage event

const (
	EventLinkVisited = "link.visited"
)
```



`internal/link/handler.go`
```Go
type LinkHandlerDeps struct {
	LinkRepository *LinkRepository
	Config         *configs.Config
	EventBus       *event.EventBus
}

type LinkHandler struct {
	LinkRepository *LinkRepository
	EventBus       *event.EventBus
}

func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{
		LinkRepository: deps.LinkRepository,
		EventBus:       deps.EventBus,
	}
	router.HandleFunc("POST /link", handler.Create())
	router.Handle("PATCH /link/{id}", middleware.IsAuthed(handler.Update(), deps.Config))
	router.HandleFunc("DELETE /link/{id}", handler.Delete())
	router.HandleFunc("GET /{hash}", handler.GoTo())
	router.Handle("GET /link", middleware.IsAuthed(handler.GetAll(), deps.Config))
}

func (handler *LinkHandler) GoTo() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		hash := r.PathValue("hash")
		
		link, err := handler.LinkRepository.GetByHash(hash)
		
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		go handler.EventBus.Publush(event.Event{
			Type: event.EventLinkVisited,
			Data: link.ID,
		})
		
		http.Redirect(w, r, link.Url, http.StatusTemporaryRedirect)
	}
}
```



`cmd/main.go`
```Go
func main() {
	conf := configs.LoadConfig()
	db := db.NewDb(conf)
	router := http.NewServeMux()
	eventBus := event.NewEventBus()

	// Repositories
	linkRepository := link.NewLinkRepository(db)
	userRepository := user.NewUserRepository(db)

	// Services
	authService := auth.NewAuthService(userRepository)

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config:      conf,
		AuthService: authService,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{
		LinkRepository: linkRepository,
		Config:         conf,
		EventBus:       eventBus,
	})
```

### Получение события



`internal/stat/service.go`
```Go
package stat

import (
	"go/adv-demo/pkg/event"
	"log"
)

type StatServiceDeps struct {
	EventBus       *event.EventBus
	StatRepository *StatRepository
}

type StatService struct {
	EventBus       *event.EventBus
	StatRepository *StatRepository
}

func NewStatService(deps *StatServiceDeps) *StatService {
	return &StatService{
		EventBus:       deps.EventBus,
		StatRepository: deps.StatRepository,
	}
}

func (s *StatService) AddClick() {
	for msg := range s.EventBus.Subscribe() {
		if msg.Type == event.EventLinkVisited {
			id, ok := msg.Data.(uint)
			if !ok {
				log.Fatalln("Bad EventLinkVisited Data: ", msg.Data)
				continue
			}
			s.StatRepository.AddClick(id)
		}
	}
}
```

#### Финал Eventbus



`cmd/main.go`
```Go
func main() {
	conf := configs.LoadConfig()
	db := db.NewDb(conf)
	router := http.NewServeMux()
	eventBus := event.NewEventBus()

	// Repositories
	linkRepository := link.NewLinkRepository(db)
	userRepository := user.NewUserRepository(db)
	statRepository := stat.NewStatRepository(db)

	// Services
	authService := auth.NewAuthService(userRepository)
	statService := stat.NewStatService(&stat.StatServiceDeps{
		EventBus:       eventBus,
		StatRepository: statRepository,
	})

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config:      conf,
		AuthService: authService,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{
		LinkRepository: linkRepository,
		Config:         conf,
		EventBus:       eventBus,
	})

	// Middlewares
	stack := middleware.Chain(
		middleware.CORS,
		middleware.Logging,
	)

	server := http.Server{
		Addr:    ":8081",
		Handler: stack(router),
	}

	go statService.AddClick()

	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```

#### Handler статистики



`internal/stat/handler.go`
```Go
package stat

import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/pkg/middleware"
	"net/http"
	"time"
)

const (
	FilterByDay   = "day"
	FilterByMonth = "month"
)

type StatHandlerDeps struct {
	StatRepository *StatRepository
	Config         *configs.Config
}

type StatHandler struct {
	StatRepository *StatRepository
}

func NewStatHandler(router *http.ServeMux, deps StatHandlerDeps) {
	handler := &StatHandler{
		StatRepository: deps.StatRepository,
	}
	router.Handle("GET /stat", middleware.IsAuthed(handler.GetStat(), deps.Config))
}

func (h *StatHandler) GetStat() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		from, err := time.Parse("2006-01-02", r.URL.Query().Get("from"))
		if err != nil {
			http.Error(w, "Invalid from param", http.StatusBadRequest)
			return
		}
		to, err := time.Parse("2006-01-02", r.URL.Query().Get("to"))
		if err != nil {
			http.Error(w, "Invalid to param", http.StatusBadRequest)
			return
		}
		by := r.URL.Query().Get("by")
		if by != FilterByDay && by != FilterByMonth {
			http.Error(w, "Invalid by param", http.StatusBadRequest)
			return
		}
		fmt.Println(from, to, by)
	}
}
```



`main.go`
```Go
	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config:      conf,
		AuthService: authService,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{
		LinkRepository: linkRepository,
		Config:         conf,
		EventBus:       eventBus,
	})
	
	// 
	stat.NewStatHandler(router, stat.StatHandlerDeps{
		StatRepository: statRepository,
		Config:         conf,
	})
```

### Group by



`internal/stat/payload.go`
```Go
package stat

type GetStatResponse struct {
	Period string `json:"period"`
	Sum    int    `json:"sum"`
}
```



`internal/stat/repository.go`
```Go
func (repo *StatRepository) GetStats(by string, from, to time.Time) []GetStatResponse {
	var stats []GetStatResponse
	var selectQuery string
	switch by {
	case GroupByDay:
		selectQuery = "to_char(date, 'YYYY-MM-DD') as period, sum(clicks)"
	case GroupByMonth:
		selectQuery = "to_char(date, 'YYYY-MM') as period, sum(clicks)"
	}
	repo.DB.Table("stats").
		Select(selectQuery).
		Where("date BETWEEN ? AND ?", from, to).
		Group("period").
		Order("period").
		Scan(&stats)
	return stats
}
```



`internal/stat/handler.go`
```Go
const (
	GroupByDay   = "day"
	GroupByMonth = "month"
)

func (h *StatHandler) GetStat() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		from, err := time.Parse("2006-01-02", r.URL.Query().Get("from"))
		if err != nil {
			http.Error(w, "Invalid from param", http.StatusBadRequest)
			return
		}
		to, err := time.Parse("2006-01-02", r.URL.Query().Get("to"))
		if err != nil {
			http.Error(w, "Invalid to param", http.StatusBadRequest)
			return
		}

		by := r.URL.Query().Get("by")
		if by != GroupByDay && by != GroupByMonth {
			http.Error(w, "Invalid by param", http.StatusBadRequest)
			return
		}

		stats := h.StatRepository.GetStats(by, from, to)
		res.Json(w, stats, 200)
	}
}
```

### Group by в GORM



### GORM Session




### Изменение приложения



`cmd/main.go`
```Go
package main

import (
	"fmt"
	"go/adv-demo/configs"
	"go/adv-demo/internal/auth"
	"go/adv-demo/internal/link"
	"go/adv-demo/internal/stat"
	"go/adv-demo/internal/user"
	"go/adv-demo/pkg/db"
	"go/adv-demo/pkg/event"
	"go/adv-demo/pkg/middleware"
	"net/http"
)

func App() http.Handler {
	conf := configs.LoadConfig()
	db := db.NewDb(conf)
	router := http.NewServeMux()
	eventBus := event.NewEventBus()

	// Repositories
	linkRepository := link.NewLinkRepository(db)
	userRepository := user.NewUserRepository(db)
	statRepository := stat.NewStatRepository(db)

	// Services
	authService := auth.NewAuthService(userRepository)
	statService := stat.NewStatService(&stat.StatServiceDeps{
		EventBus:       eventBus,
		StatRepository: statRepository,
	})

	// Handler
	auth.NewAuthHandler(router, auth.AuthHandlerDeps{
		Config:      conf,
		AuthService: authService,
	})
	link.NewLinkHandler(router, link.LinkHandlerDeps{
		LinkRepository: linkRepository,
		Config:         conf,
		EventBus:       eventBus,
	})
	stat.NewStatHandler(router, stat.StatHandlerDeps{
		StatRepository: statRepository,
		Config:         conf,
	})

	go statService.AddClick()

	// Middlewares
	stack := middleware.Chain(
		middleware.CORS,
		middleware.Logging,
	)
	return stack(router)
}

func main() {
	app := App()
	server := http.Server{
		Addr:    ":8081",
		Handler: app,
	}
	fmt.Println("Server is listening on port 8081")
	server.ListenAndServe()
}
```



## Тестирование API

### Виды тестирования









### Изменение приложения









### E2E тест



`.gitignore`
```
/postgres-data
/.env
/cmd/.env
```



`cmd/auth_test.go`
```Go
package main

import (
	"bytes"
	"encoding/json"
	"go/adv-demo/internal/auth"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLoginSuccess(t *testing.T) {
	ts := httptest.NewServer(App())
	defer ts.Close()

	data, _ := json.Marshal(&auth.LoginRequest{
		Email:    "a2@a.ru",
		Password: "1",
	})

	res, err := http.Post(ts.URL+"/auth/login", "application/json", bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 200 {
		t.Fatalf("Expected %d got %d", 200, res.StatusCode)
	}
}
```

#### Отрицательный тест



`cmd/auth_test.go`
```Go
package main

import (
	"bytes"
	"encoding/json"
	"go/adv-demo/internal/auth"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLoginSuccess(t *testing.T) {
	ts := httptest.NewServer(App())
	defer ts.Close()

	data, _ := json.Marshal(&auth.LoginRequest{
		Email:    "a2@a.ru",
		Password: "1",
	})

	res, err := http.Post(ts.URL+"/auth/login", "application/json", bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 200 {
		t.Fatalf("Expected %d got %d", 200, res.StatusCode)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	var resData auth.LoginResponse
	err = json.Unmarshal(body, &resData)
	if err != nil {
		t.Fatal(err)
	}
	if resData.Token == "" {
		t.Fatal("Token empty")
	}
}

func TestLoginFail(t *testing.T) {
	ts := httptest.NewServer(App())
	defer ts.Close()

	data, _ := json.Marshal(&auth.LoginRequest{
		Email:    "a2@a.ru",
		Password: "2",
	})

	res, err := http.Post(ts.URL+"/auth/login", "application/json", bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 401 {
		t.Fatalf("Expected %d got %d", 401, res.StatusCode)
	}
}
```

### Подготовка тестового окружения



`cmd/auth_test.go`
```Go
package main

import (
	"bytes"
	"encoding/json"
	"go/adv-demo/internal/auth"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func initDb() *gorm.DB {
	err := godotenv.Load("cmd/.env")
	if err != nil {
		panic(err)
	}
	db, err := gorm.Open(postgres.Open(os.Getenv("DSN")), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	return db
}

func TestLoginSuccess(t *testing.T) {
	// Prepare
	db := initDb()

	ts := httptest.NewServer(App())
	defer ts.Close()
```

### Предварительные данные



`cmd/auth_test.go`
```Go
func initDb() *gorm.DB {
	err := godotenv.Load(".env")
	if err != nil {
		panic(err)
	}

	// ...

	return db
}

func initData(db *gorm.DB) {
	db.Create(&user.User{
		Email:    "a2@a.ru",
		Password: "$2a$10$fOFzfotZx.uhK2BkJTy4AuVb6ejteFYEUkREKD/nBR6fZx4afcmYS",
		Name:     "Вася",
	})
}

func TestLoginSuccess(t *testing.T) {
	// Prepare
	db := initDb()
	initData(db)
```

### Очистка данных



`cmd/auth_test.go`
```Go
// функция для очистки данных
func removeData(db *gorm.DB) {
	db.Unscoped().
		Where("email = ?", "a2@a.ru").
		Delete(&user.User{})
}

func TestLoginSuccess(t *testing.T) {
	// Prepare
	db := initDb()
	initData(db)

	ts := httptest.NewServer(App())
	defer ts.Close()

	data, _ := json.Marshal(&auth.LoginRequest{
		Email:    "a2@a.ru",
		Password: "1",
	})

	res, err := http.Post(ts.URL+"/auth/login", "application/json", bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 200 {
		t.Fatalf("Expected %d got %d", 200, res.StatusCode)
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	var resData auth.LoginResponse
	err = json.Unmarshal(body, &resData)
	if err != nil {
		t.Fatal(err)
	}
	if resData.Token == "" {
		t.Fatal("Token empty")
	}
	removeData(db)
}

func TestLoginFail(t *testing.T) {
	db := initDb()
	initData(db)
	ts := httptest.NewServer(App())
	defer ts.Close()

@@ -86,4 +95,5 @@
	if res.StatusCode != 401 {
		t.Fatalf("Expected %d got %d", 401, res.StatusCode)
	}
	removeData(db)
}
```

### Unit тесты



`pkg/jwt/jwt_test.go`
```Go
package jwt_test

import (
	"go/adv-demo/pkg/jwt"
	"testing"
)

func TestJWTCreate(t *testing.T) {
	const email = "a@a.ru"
	jwtService := jwt.NewJWT("/2+XnmJGz1j3ehIVI/5P9kl+CghrE3DcS7rnT+qar5w=")
	token, err := jwtService.Create(jwt.JWTData{
		Email: email,
	})
	if err != nil {
		t.Fatal(err)
	}
	isValid, data := jwtService.Parse(token)
	if !isValid {
		t.Fatal("Token is invalid")
	}
	if data.Email != email {
		t.Fatalf("Email %s not equal %s", data.Email, email)
	}
}
```

### Mock данных



`internal/auth/service_test.go`
```Go
package auth_test

import (
	"go/adv-demo/internal/auth"
	"go/adv-demo/internal/user"
	"testing"
)

type MockUserRepository struct{}

func (repo *MockUserRepository) Create(u *user.User) (*user.User, error) {
	return &user.User{
		Email: "a@a.ru",
	}, nil
}

func (repo *MockUserRepository) FindByEmail(email string) (*user.User, error) {
	return nil, nil
}

func TestRegisterSuccess(t *testing.T) {
	const initialEmail = "a@a.ru"
	authService := auth.NewAuthService(&MockUserRepository{})
	email, err := authService.Register(initialEmail, "1", "Вася")
	if err != nil {
		t.Fatal(err)
	}
	if email != initialEmail {
		t.Fatalf("Email %s do not math %s", email, initialEmail)
	}
}
```



`pkg/di/interfaces.go`
```Go
package di

import "go/adv-demo/internal/user"

type IStatRepository interface {
	AddClick(linkId uint)
}

type IUserRepository interface {
	Create(user *user.User) (*user.User, error)
	FindByEmail(email string) (*user.User, error)
}
```



`internal/auth/service.go`
```Go
package auth

import (
	"errors"
	"go/adv-demo/internal/user"
	"go/adv-demo/pkg/di"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	UserRepository di.IUserRepository
}

func NewAuthService(userRepository di.IUserRepository) *AuthService {
	return &AuthService{UserRepository: userRepository}
}
```

### Mock базы



`internal/auth/handler_test.go`
```Go
package auth_test

import (
	"go/adv-demo/configs"
	"go/adv-demo/internal/auth"
	"go/adv-demo/internal/user"
	"go/adv-demo/pkg/db"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestLoginSuccess(t *testing.T) {
	database, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal("Failed init mock db")
		return
	}
	gormDb, err := gorm.Open(postgres.New(postgres.Config{
		Conn: database,
	}))
	if err != nil {
		t.Fatal("Failed init gorm")
		return
	}
	userRepo := user.NewUserRepository(&db.Db{
		DB: gormDb,
	})
	handler := auth.AuthHandler{
		Config: &configs.Config{
			Auth: configs.AuthConfig{
				Secret: "secret",
			},
		},
		AuthService: auth.NewAuthService(userRepo),
	}
}
```

### HTTPTest



`internal/auth/handler_test.go`
```Go
package auth_test

import (
	"bytes"
	"encoding/json"
	"go/adv-demo/configs"
	"go/adv-demo/internal/auth"
	"go/adv-demo/internal/user"
	"go/adv-demo/pkg/db"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func bootstrap() (*auth.AuthHandler, sqlmock.Sqlmock, error) {
	database, mock, err := sqlmock.New()
	if err != nil {
		return nil, nil, err
	}
	gormDb, err := gorm.Open(postgres.New(postgres.Config{
		Conn: database,
	}))
	if err != nil {
		return nil, nil, err
	}
	userRepo := user.NewUserRepository(&db.Db{
		DB: gormDb,
	})
	handler := auth.AuthHandler{
		Config: &configs.Config{
			Auth: configs.AuthConfig{
				Secret: "secret",
			},
		},
		AuthService: auth.NewAuthService(userRepo),
	}
	return &handler, mock, nil
}

func TestLoginSuccess(t *testing.T) {
	handler, _, err := bootstrap()
	if err != nil {
		t.Fatal(err)
		return
	}
	data, _ := json.Marshal(&auth.LoginRequest{
		Email:    "a2@a.ru",
		Password: "1",
	})
	reader := bytes.NewReader(data)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/login", reader)
	handler.Login()(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("got %d, expected %d", w.Code, 200)
	}
}
```

### Mock запросов



`internal/auth/handler_test.go`
```Go
func TestLoginSuccess(t *testing.T) {
	handler, mock, err := bootstrap()
	rows := sqlmock.NewRows([]string{"email", "password"}).
		AddRow("a2@a.ru", "$2a$10$fOFzfotZx.uhK2BkJTy4AuVb6ejteFYEUkREKD/nBR6fZx4afcmYS")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	if err != nil {
		t.Fatal(err)
		return
	}
	data, _ := json.Marshal(&auth.LoginRequest{
		Email:    "a2@a.ru",
		Password: "1",
	})
	reader := bytes.NewReader(data)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/login", reader)
	handler.Login()(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("got %d, expected %d", w.Code, 200)
	}
}
```

#### Тест регистрации



`internal/auth/handler.go`
```Go
func (handler *AuthHandler) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := req.HandleBody[RegisterRequest](&w, r)
		if err != nil {
			return
		}
		email, err := handler.AuthService.Register(body.Email, body.Password, body.Name)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		token, err := jwt.NewJWT(handler.Config.Auth.Secret).Create(jwt.JWTData{
			Email: email,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		data := RegisterResponse{
			Token: token,
		}
		res.Json(w, data, 201)
	}
}
```



`internal/auth/handler_test.go`
```Go
func TestLoginHandlerSuccess(t *testing.T) {
	handler, mock, err := bootstrap()
	rows := sqlmock.NewRows([]string{"email", "password"}).
		AddRow("a2@a.ru", "$2a$10$fOFzfotZx.uhK2BkJTy4AuVb6ejteFYEUkREKD/nBR6fZx4afcmYS")
@@ -62,3 +62,28 @@ func TestLoginSuccess(t *testing.T) {
		t.Errorf("got %d, expected %d", w.Code, 200)
	}
}

func TestRegisterHandlerSuccess(t *testing.T) {
	handler, mock, err := bootstrap()
	rows := sqlmock.NewRows([]string{"email", "password", "name"})
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT").WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()
	if err != nil {
		t.Fatal(err)
		return
	}
	data, _ := json.Marshal(&auth.RegisterRequest{
		Email:    "a2@a.ru",
		Password: "1",
		Name:     "Вася",
	})
	reader := bytes.NewReader(data)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/register", reader)
	handler.Register()(w, req)
	if w.Code != http.StatusCreated {
		t.Errorf("got %d, expected %d", w.Code, 201)
	}
}
```

### Отладка тестов















### Финал проекта

Переводим обновление и удаление на хэндлеры с middlewares

`main.go`
```Go
func NewLinkHandler(router *http.ServeMux, deps LinkHandlerDeps) {
	handler := &LinkHandler{
		LinkRepository: deps.LinkRepository,
		EventBus:       deps.EventBus,
	}
	router.Handle("POST /link", middleware.IsAuthed(handler.Create(), deps.Config))
	
	// 
	router.Handle("PATCH /link/{id}", middleware.IsAuthed(handler.Update(), deps.Config))
	
	// 
	router.Handle("DELETE /link/{id}", middleware.IsAuthed(handler.Delete(), deps.Config))
	router.HandleFunc("GET /{hash}", handler.GoTo())
	router.Handle("GET /link", middleware.IsAuthed(handler.GetAll(), deps.Config))
}
```


