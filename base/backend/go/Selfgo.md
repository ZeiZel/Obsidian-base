
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
### Изменение Map
### Итерация по Map
#### Утилита закладок
### Labels
### Type alias
### Make для Map






## Указатели

### Все типы данных





### Что такое указатель





### Создание Указателя





### Использование Указателя





#### Reverse массива



## Struct

### Зачем нужны
### Функция конструктор
### Валидация данных
#### Перенос генерации
### Композиция
### Описание struct
### Создание инстанса
### Передача структур
### Использование указателей
### Rune
#### Генерация пароля
### Методы
### Сутация struct










## Пакеты

### Разделение кода
### Добавление пакета
### Импорт и экспорт
### Добавление сторонних пакетов
#### Package файлов
### Go mod tidy













## Работа с ОС

### Запись в файл
### Чтение JSON
#### Поиск пароля
#### Удаление пароля
### Stack frame
### Defer
### Чтение из файла
### JSON
### Struct tags
### Сохранение JSON
#### Меню выбора
### Slice struct









## Интерфейсы

### Изменение files
### Ограничения Generic
### Generic Structs
#### Generic ввода
### Внедрение зависимостей
### Второй провайдер
### Создание интерфейса
### Встроенный интерфейс
### Any тип
### Type switch
### Получение типа
### Generic





## Продвинутые функции

### Тип функции
### Передача функции
### Анонимные функции
#### Поиск по логину
### Динамическое число аргументов
### Замыкание



## Env и шифрование

### Получение env
### чтение env
### Encrypter struct
### Шифрование данных
### Расшифровка данных
#### Применение шифрования


## HTTP запросы

### Создание нового проекта
### План проекта
### CLI флаги
### Readers
### Первый HTTP запрос
### Query параметры
### Debug приложения
### Post запрос







## Тесты

### Arrange act Assert
### Первый тест
### Debug теста
### Негативный тест
#### Тест погоды
#### Ошибки
### Группы тестов






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
### Pointer на heap
### Go allocator
### Пример с Reader
### Работа GC









## Concurrency

### Что такое Gorutine
### Запуск Gorutine
#### Ускорение работы
### WaitGroup
### Планировщик
### Цикл планировщика
### Channels
### Создание канала
### Чтение данных
### Закрытие канала
#### Сумма Slice
### Обработка ошибок
### Select


## HTTP сервер

### Выбор HTTP сервера
### Простейший сервер
### Как работают запросы
### Свой ServerMux
### Методы и коды ответа
### Handler




## Архитектура

### Структура приложения
### Конфигурация
### Обзор приложения
### Декомпозиция модуля
#### Модуль авторизация
### Передача зависимостей
### Ответ от API
#### Пакет ответа


## Запрос и валидация

### Чтение body
#### Простая валидация
### Regexp
### Go validator
### Вынос обработчика
#### Регистрация


## Подключение к БД

### Развёртывание PgSQL
### Подключение к базе
### Выбор ORM
### Подключение к GORM
### Описание модели
### Автомиграции


## CRUD

#### Handler ссылок
### Параметр запроса
### Паттерн репозитория
### Создание ссылки
### Получение ссылки
#### Проверка hash
### Изменение ссылки
### Удаление ссылки
#### Проверка наличия


## Middleware

### Что такое middleware
### Первый обработчик
### Wrapper Writer
### CORS
### Stack middleware
#### Получение bearer
### Middleware для роутеров


## Авторизация

### Что такое JWT
#### Модель пользователя
#### Репозиторий пользователей
### Сервис авторизации
### Bcrypt
#### Логин пользователя
### Создание JWT
#### Финал авторизации


## Контекст

### Что такое контекст
### WithTimeout
### WithValue
### WithCancel
### Получение email из JWT
### Запись в контекст
#### Чтение из контекста
### Unauthed


## Продвинутая работа с БД

### Формирование запроса
### Limit и offset
### Count
### Query параметры
#### Список ссылок
### Один ко многим
### Добавление клика
#### Простое добавление
### Правильный DI
### Eventbus
### Отправка события
### Получение события
#### Финал Eventbus
#### Handler статистики
### Group by
### Group by в GORM
### GORM Session


## Тестирование API

### Виды тестирования
### Изменение приложения
### E2E тест
#### Отрицательный тест
### Подготовка тестового окружения
### Предварительные данные
### Очистка данных
### Unit тесты
### Mock данных
### Mock базы
### HTTPTest
### Mock запросов
#### Тест регистрации
### Отладка тестов
### Финал проекта


