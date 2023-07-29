
# Основы PHP

## Локальный сервер. Вывод информации и комментарии

В PhpStorm есть свой сервер, который запускается, если мы укажем путь до интерпретатора php, который можно скачать [тут](https://windows.php.net/download#php-8.2)

![](_png/Pasted%20image%2020230727191454.png)

Весь php-код оборачивается внутрь тега `<?php ?>`.
С помощью `echo` мы можем вернуть на фронт нужную строку или переменную. В качестве возвращаемого значения может быть и вёрстка - она обработается браузером правильно

`index.php`
```php
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <?php
        // my name
        $name = '<h1>Valery</h1>'; # my name
        echo $name;
        echo '\'No Name\''

        /*
         * Way
         * Of
         * */
    ?>
</body>
</html>
```

![](_png/Pasted%20image%2020230727193450.png)


## Переменные и типы данных

Все переменные мы начинаем записывать с `$`. 

Мы имеем 4 основных типа данных:
bool (логический тип)

- int (целые числа)
- float (дробные числа)
- string (строки)
- array (массивы)
- object (объекты)
- callable (функции)
- mixed (любой тип)
- resource (ресурсы)
- null (отсутствие значения)

В PHP присутствует динамическая типизация, когда в определённых моментах тип данных переменной может подстроиться под операцию. Так же int переменной можно присвоить string данные.

Чтобы обозначить константу, можно воспользоваться функцией `define()` или синтаксисом `const`

`index.php`
```php
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <?php
        define('VALUE', 20);
        const VALUE_AGE = 30;
        echo VALUE . '<br>';
        echo VALUE_AGE . '<br>';

        $number = 5; // int
        $number = 45;
        $num = 0;
        $name = 'Valery'; // string
        $cof = 0.891; // float
        $bool = true; // boolean

        echo $number . ' ' . $num;

        $a = 0.5;
        $b = "0.5";

        echo $a + $b; // 1 - нет строгой типизации, поэтому строка переведётся в число
        echo $a + floatval($b); // 1 - перевод в float
    ?>
</body>
</html>
```


## Математические действия

Основные математические операции, которые можно выполнять в php:

`index.php`
```php
<?php
	$x = 20;
	$y = 10;
	
	echo $x + $y . '<br>'; // сложение
	echo $x - $y . '<br>'; // вычитание
	echo $x * $y . '<br>'; // умножение
	echo $x / $y . '<br>'; // деление
	echo $x % $y . '<br>'; // остаток от деления
	
	$x = $x + 10; // прибавляем к базе
	$x += 10; // прибавит 10
	$x++; // прибавит 1
	
	echo $x . '<br>';
	
	$y = $y - 10;
	$y -= 10;
	
	echo $y;
	
	echo M_PI . '<br>'; // число PI
	echo M_E . '<br>'; // число e
	echo abs(-50) . '<br>'; // находит модуль числа
	echo ceil(14.5) . '<br>'; // округляет число к большему
	echo floor(14.5) . '<br>'; // округляет число к меньшему
	echo round(14.5345345, 2) . '<br>'; // округляет число по законам математики - через , указываем, сколько чисел нужно вывести
	echo mt_rand(1, 20) . '<br>'; // выведет рандомное число от 1 до 20 включительно
	echo min(1, 0, 2, 10, 15, 20) . '<br>'; // выведет минимальное число
	echo max(1, 0, 2, 10, 15, 20) . '<br>'; // выведет максимальное число
?>
```


## Строковые операции

На обработку текста в одинарных кавычках уходит в два раза меньше памяти, чем на двойные 

`index.php`
```php
<?php  
	$string = 'Hello';  
	  
	echo "vars: " . $string . '<br>';  
	echo "vars: $string" . '<br>';  
	echo 'vars: $string' . '<br>'; // в '' переменные не будут работать  
	echo "<input type=\"text\" />" . '<br>'; //  
	echo strlen($string) . '<br>'; // выведет длину строки  
	echo trim(" saviour ") . '<br>'; // уберёт все лишние пробелы 
	echo strtolower($string) . '<br>'; // приводит к нижнему регистру - если есть кириллица, то стоит использовать mb_strtolower  
	echo strtoupper($string) . '<br>'; // приводит к верхнему регистру - если есть кириллица, то стоит использовать mb_strtoupper  
	echo md5("some string") // кеширует строку (лучше применять для паролей)  
?>
```

![](_png/Pasted%20image%2020230728165302.png)

## Условные операторы

Операции сравнения:
- ==
- ===
- !=
- !==
- >
- <
- >=
- <=

Логические операции:
- && или and - если оба true, то true
- || или or - если хотя бы один true
- ! - отрицание
- xor - возвращает true только тогда, когда одно из условий true

стандартный условный оператор выглядит следующим образом:

```php
$a = 5;
if($a>0){
    echo "Переменная a больше нуля";
}
elseif($a < 0){
    echo "Переменная a меньше нуля";
}
else{
    echo "Переменная a равна нулю";
}
```

Так же есть и определения условий, когда дефолтные значения будут принимать `true` или `false`

```php
if (0) {}       // false
if (-0.0) {}    // false
if (-1) {}      // true 
if ("") {}      // false (пустая строка)
if ("a") {}     // true (непустая строка)
if (null) {}    // false (значие отсутствует)
```

Так же мы можем встраивать выполнение определённого кода через комбинированный режим HTML и PHP, где мы храним HTML между вложенными тегами `php`

```php
<!DOCTYPE html>
<html>
	<head>
		<title>METANIT.COM</title>
		<meta charset="utf-8" />
	</head>
	<body>
		<?php
		$a = -5;
		?>
		 
		<?php if ($a > 0) { ?>
		<h2>Переменная a больше нуля</h2>
		<?php } elseif($a < 0) { ?>
		<h2>Переменная a меньше нуля</h2>
		<?php } else { ?>
		<h2>Переменная a равна нулю</h2>
		<?php } ?>
	</body>
</html>
```

Тернарное условие

```php
$a = 1;
$b = 2;
$z = $a < $b ? $a + $b : $a - $b;
echo $z;
```


## Конструкции switch и match

Конструкция switch-case:

```php
$a = 3;
switch($a)
{
    case 1: 
        echo "сложение";
        break;
    case 2: 
        echo "вычитание";
        break;
    default: 
        echo "действие по умолчанию";
        break;
}
```

Альтернативная конструкция `matches`, которая является более оптимизированным вариантом (появилась в версии 8.0):

```php
$a = 2;
$operation = match($a)
{
    1 => "сложение",
    2 => "вычитание",
    default => "действие по умолчанию",
};
echo $operation; // вычитание
```

```php
$a = 2;
match($a)
{
    1 => $operation = "сложение",
    2 => $operation = "вычитание",
    default => $operation = "действие по умолчанию",
};
echo $operation;
```

>[!info] Стоит отметить важное отличие конструкции switch от match: switch сравнивает только значение, но не учитывает тип выражения. Тогда как match также учитывает тип сравниваемого выражения. 

```php
switch (8.0) {
  case "8.0":
    $result = "строка";
    break;
  case 8.0:
    $result = "число";
    break;
}
echo $result; // строка
```


## Циклы

### for

Стандартный цикл:

```php
<?php
	for ($i = 1; $i < 10; $i++)
	{
	    echo "Квадрат числа $i равен " . $i * $i . "<br/>";
	}
?>
```

Так же можно объявлять и использовать сразу несколько переменных в цикле

```php
for ($i =1, $j=1; $i + $j < 10; $i++, $j+=2)
{
    echo "$i + $j = " . $i + $j . "<br>";
}
```

### while

выполняет цикл пока условие `true`

```php
<?php
$counter = 1;
while($counter<10)
{
    echo $counter * $counter . "<br />";
    $counter++;
}
?>
```

### do-while

Сначала выполняет хотя бы один раз

```php
<?php
$counter = 1;
do
{
    echo $counter * $counter . "<br />";
    $counter++;
}
while($counter<10)
?>
```

### continue / break

`continue` - пропускает итерацию цикла
`break`  - прекращает выполнение цикла

```php
<?php
for ($i = 1; $i < 10; $i++)
{
    if($i==5)
    {
        continue;
    }
    echo "Квадрат числа $i равен " . $i * $i . "<br/>";
}
?>

<?php
for ($i = 1; $i < 10; $i++)
{
    $result = $i * $i;
    if($result>80)
    {
        break;
    }
    echo "Квадрат числа $i равен $result <br/>";
}
?>
```

## Вложенные циклы

попробуем вывести таблицу со значениями

```php
<table>
<?php
for ($i = 1; $i < 10; $i++)
{
    echo "<tr>";
    for ($j = 1; $j < 10; $j++)
    {
        echo "<td>" . $i * $j . "</td>";
    }
    echo "</tr>";
}
?>
</table>
```

![](_png/Pasted%20image%2020230729092755.png)


## Массивы

Таким образом мы можем задать массив

```php
$numbers = [1, 2, 3, 4];
$numbers = array(1, 2, 3, 4);
```

Таким образом заменить и вывести элемент

```php
<?php
	$numbers = [1, 4, 9, 16];
	$numbers[1] = 6;
	echo $numbers[1];   // 6
?>
```

Добавление нового элемента в конец массива

```php
<?php
	$numbers = [1, 4, 9, 16];
	$numbers[] = 25;
	echo $numbers[4];   // 25
?>
```

Оператор `=>` позволяет сопоставить ключ со значением

```php
$numbers = [1, 4, 9, 16];
$numbers = [0=>1, 1=>4, 2=>9, 3=>16];

// тут индекс пойдёт с 4
$numbers = [4=> 16, 25, 36, 49, 64];
```

### Перебор массива

Перебрать массив можно через стандартный цикл `for`

```php
<?php
	$users = ["Tom", "Sam", "Bob", "Alice"];
	$num = count($users);
	for($i=0; $i < $num; $i++)
	{
	    echo "$users[$i] <br />";
	}
?>
```

И так же существует специальный `foreach`, который пройдётся по любому массиву (самый надёжный вариант)

```php
<?php
	$users = [1 => "Tom", 4 => "Sam", 5 => "Bob", 21 => "Alice"];
	foreach($users as $element)
	{
	    echo "$element<br />";
	}
?>
```

Так же мы можем достать ключи значений

```php
<?php
$users = [1 => "Tom", 4 => "Sam", 5 => "Bob", 21 => "Alice"];
foreach($users as $key => $value)
{
    echo "$key - $value<br />";
}
?>
```

### Ассоциативный массив

Данный вид массивов подразумевает под собой использование в качестве ключа строки

```php
$countries = ["Germany" => "Berlin", "France" => "Paris", "Spain" => "Madrid"];
$countries["Italy"] = "Rome";   // определяем новый элемент с ключом "Italy"
echo $countries["Italy"]; // Rome
```

Перебирать такой массив так же можно через `foreach`

```php
<?php
$words = ["red" => "красный", "blue" => "синий", "green" => "зеленый"];
 
foreach($words as $english => $russian)
{
    echo "$english : $russian<br />";
}
?>
```

### Смешанные массивы

Так же мы можем использовать сразу и строки и числа для задания массива

```php
$data = [1=> "Tom", "id132" => "Sam", 56 => "Bob"];
echo $data[1];  // Tom
echo "<br />";
echo $data["id132"];    // Sam
```

### Многомерные массивы

Данные массивы представляют из себя массив в массиве

```php
$families = [["Tom", "Alice"], ["Bob", "Kate"]];
echo $families[0][0] . "<br />";  //Tom
echo $families[0][1] . "<br />";  //Alice
echo $families[1][0] . "<br />";  //Bob
echo $families[1][1];   //Kate
```

Перебор данного массива выглядит следующим образом:

```php
<table>
<?php
	$families = [["Tom", "Alice"], ["Bob", "Kate"], ["Sam", "Mary"]];
	foreach ($families as $family)
	{
	    echo "<tr>";
	    foreach ($family as $user)
	    {
	        echo "<td>$user</td>";
	    }
	    echo "</tr>";
	}
?>
</table>
```

![](_png/Pasted%20image%2020230729094821.png)

Пример многомерного ассоциативного массива:

```php
<?php
    $gadgets = array(
        "phones" => array("apple" => "iPhone 12",
            "samsung" => "Samsung S20",
            "nokia" => "Nokia 8.3"),
        "tablets" => array("lenovo" => "Lenovo Yoga Smart Tab",
            "samsung" => "Samsung Galaxy Tab S5",
            "apple" => "Apple iPad Pro"));

    foreach ($gadgets as $gadget => $items) {
        echo "<h1>" . strtoupper($gadget) . "</h1>";

        echo '<ul>';

        foreach ($items as $key => $value) {
            echo "<li>$key: $value</li>";
        }

        echo '</ul>';
    }
?>
```

![](_png/Pasted%20image%2020230729095906.png)


## Функции

### Создание функции

```php
<?php
	function hello()
	{
	    echo "Hello PHP";
	}
	 
	hello();    // вызов функции
?>
```

### Параметры функции

Так же после `=` мы можем указать дефолтное значение для параметра функции

```php
<?php
function displayInfo($name, $age = 18)
{
    echo "<div>Имя: $name <br />Возраст: $age</div><hr>";
}
 
displayInfo("Tom", 36);
displayInfo("Bob");
displayInfo("Sam", 28);
?>
```

### Именованные параметры

Так же при передаче параметра в функцию, мы можем не добавлять их по позиции, а просто написать имя параметра и передать его внутрь

```php
<?php
	function displayInfo($name, $age = 18)
	{
	    echo "<div>Имя: $name <br />Возраст: $age</div><hr>";
	}
	 
	displayInfo(age: 23, name: "Bob");
	displayInfo(name: "Tom", age: 36);
	displayInfo(name: "Alice");
?>
```

### Переменное количество параметров

Создаём функцию, которая будет принимать студента и его оценки - выводим студента и средний балл

```php
function getAverageScore($name, ...$scores)
{
    $result = 0.0;
    foreach($scores as $score) {
        $result += $score;
    }
    $result = $result / count($scores);
    echo "<p>$name: $result</p>";
}
getAverageScore("Tom", 5, 5, 4, 5);
getAverageScore("Bob", 4, 3, 4, 4, 4);
```

### Возвращение значений и оператор return

Если в функции нет оператора `return`, то она в любом случае вернёт `null`

```php
<?php
function add($a, $b)
{
    return $a + $b;
}
 
$result = add(5, 6);
echo $result;           // 11
?>
```

### Анонимные функции

Анонимная функция объявляется без обозначения имени. Её так же можно присвоить к определённой переменной, чтобы использовать

```php
<?php
	$sum = function($a, $b)
	{
	    return $a + $b;
	};
	$number = $sum(5, 11);  //16
	echo $number;
?>
```

Зачастую, анонимные функции используют для передачи внутрь других функций

```php
<?php
	function welcome($message)
	{
	    $message();
	}
	$goodMorning = function() { echo "<h3>Доброе утро</h3>"; };
	$goodEvening = function() { echo "<h3>Добрый вечер</h3>"; };
	 
	welcome($goodMorning);          // Доброе утро
	welcome($goodEvening);          // Добрый вечер
	welcome(function(){ echo "<h3>Привет</h3>"; }); // Привет
?>
```

### Замыкания / Closure

Тут мы пытаемся использовать внешнюю переменную внутри анонимной функции. У нас это не получится, так как этой переменной нет внутри функции. 

```php
<?php
	$number = 89;
	 
	$showNumber = function()
	{
	    echo $number;
	};
	 
	$showNumber(); // ERROR
?>
```

Для решения проблемы с замыканием, нужно использовать выражение `use()`, в котором мы укажем те переменные, которые мы хотим использовать внутри функции

```php
$a = 8; 
$b = 10;
 
$closure = function($c) use($a, $b)
{
    return $a + $b + $c;
};
 
$result = $closure(22); // 40
echo $result;
```

### Стрелочные функции

Стрелочные функции (arrow function) позволяют упростить запись анонимных функций, которые возвращают некоторое значение. И при этом стрелочные функции автоматически имеют доступ к переменным из внешнего окружения.

```php
$a = 8; 
$b = 10;
 
$closure = fn($c) => $a + $b + $c;
 
$result = $closure(22); // 40
```

### Генераторы

Для возвращения значения из функции применяется оператор `yield`. Но в отличие от `return` оператор `yield` сохраняет состояние функции, позволяя ей продолжать работу с того места, когда остановилось ее выполнение.

```php
<?php
function generateNumbers()
{
    for ($i = 10; $i <= 15; $i++) {
         
        yield $i;
    }
}
 
foreach(generateNumbers() as $index => $number)
{
    echo "$index - $number<br/>"; // 012345
}
?>
```

![](_png/Pasted%20image%2020230729105725.png)

Так же можно определить те значения, из которых будет оператор `yield` брать значения, через оператор `from`. Конкретно тут `yield` возьмёт значения из массива `[2, 3, 4]`

```php
function generateNumbers()
{
    yield 1;
    yield from [2, 3, 4];
    yield 5;
}
 
foreach(generateNumbers() as $number)
{
    echo $number; // 12345
}
```

>[!info] Генераторы извлекают только одно значение одномоментно при обращении к функции, экономя тем самым вычислительные ресурсы. Это больше нужно для высоконагруженных сервисов.

## Ссылки

Рассмотрим классический способ передачи значения в другую переменную:

В этом примере мы присвоили переменной `$sam` значение из переменной `$tom`. Далее мы опять переприсвоили переменную и видим, что в этих переменных разные значения

```php
<?php
	$tom = "Tom";
	$sam = $tom;
	$sam = "Sam";
	echo "tom = $tom <br>";   // tom = Tom
	echo "sam = $sam";              // sam = Sam
?>
```

Ссылки в PHP позволяют ссылаться на область памяти, где расположено значение переменной или параметра. Для создания ссылки перед переменной указывается символ амперсанда - `&`

Обе переменных будут указывать на один и тот же адрес в памяти. Это приведет к тому, что изменение значения одной из этих переменных приведет к изменению значения другой переменной. Потому что они ссылаются на один и тот же участок в памяти и соответственно имеют одно общее значение

Конкретно тут `$sam` ссылается на `$tom`, что приведёт к тому, что изменение `$sam` изменят значение в `$tom`

```php
<?php
	$tom = "Tom";
	$sam = &$tom;   // передача ссылки
	$sam = "Sam";
	echo "tom = $tom <br>";   // tom = Sam
	echo "sam = $sam";              // sam = Sam
?>
```

В этом примере мы свяжем передаваемое значение в функцию и результат её выполнения

```php
<?php
function square(&$a)
{
    $a *= $a;
    echo "a = $a";
}
 
$number = 5; 
square($number);
echo "<br />number = $number"; // $numbder = 25
?>
```

Функция так же может возвращать ссылку

В данном случае функция `checkName()` получает параметр по ссылке и возвращает ссылку - фактически ссылку, которая передается в функции. Для этого перед определением функции указан символ амперсанда:

`function &checkName(&$name)`

Для имитации работы функция проверяет имя пользователя и изменяет его на некоторое стандартное, если оно равно "admin".

При вызове функции перед ее именем указывается символ амерсанда:

`$checkedName = &checkName($userName)`

После выполнения функции переменная `$checkedName` фактически будет содержать ссылку на переменную `$userName`.

```php
<?php
	function &checkName(&$name)
	{
	    if($name === "admin") $name = "Tom";
	    return $name;
	}
	  
	$userName = "admin"; 
	$checkedName = &checkName($userName);
	echo "<br />userName: $userName";
	echo "<br />checkedName: $checkedName";
?>
```


## Область видимости переменной

### Переменные в блоках цикла и условных конструкций

Блоки циклов и условных конструкций не образуют отдельной области видимости, и переменные, определенные в этих блоках, мы можем использовать вне этих блоков:

```php
$condition = true;
if($condition){
     
    $name = "Tom";
}
echo $name; // Tom
```

### Локальные переменные

Локальные переменные создаются внутри функции. К таким переменным можно обратиться только изнутри данной функции. Например:

```php
<?php
function showName(){
    $name = "Tom";
    echo $name;
}
 
showName();
echo $name; // так написать нельзя, так как переменная $name существует только внутри функции showName(
?>
```

### Статические переменные

Статические переменные похожи на локальные, однако их значение не пропадает при окончании использования функции 

```php
<?php
	function getCounter()
	{
	    static $counter = 0;
	    $counter++;
	    echo $counter;
	}
	getCounter(); // counter=1
	getCounter(); // counter=2
	getCounter(); // counter=3
?>
```

### Глобальные переменные

Изначально, внутри функции мы не можем обратиться к переменной, которая находится во внешнем скоупе. Однако, чтобы не пользоваться оператором `use()`, мы можем обратиться к переменной глобально через оператор `global`

```php
<?php
	$name = "Tom";
	function hello()
	{
	    global $name;
	    echo "Hello " . $name;
	}
	hello();    // Hello Tom
?>
```


## Константы

Для определения константы применяется оператор const, при этом в названии константы знак доллара $ (в отличие от переменных) не используется.

```php
<?php
const PI = 3.14;
echo PI;
?>
```

Так же мы можем воспользоваться функцией `define()`

```php
<?php
define("NUMBER", 22);
echo NUMBER;    // 22
?>
```

Так же в языке есть следующие константы:
- __FILE__: хранит полный путь и имя текущего файла
- __LINE__: хранит текущий номер строки, которую обрабатывает интерпретатор
- __DIR__: хранит каталог текущего файла
- __FUNCTION__: название обрабатываемой функции
- __CLASS__: название текущего класса
- __TRAIT__: название текущего трейта
- __METHOD__: название обрабатываемого метода
- __NAMESPACE__: название текущего пространства имен
- **::class/span>:** полное название текущего класса

```php
<?php
	echo "Cтрока " . __LINE__ . " в файле " . __FILE__;
?>
```

Так же мы можем проверить существование константы так же через метод `define`

```php
<?php
const PI = 3.14; 
if (!defined("PI"))
    define("PI", 3.14);
else
    echo "Константа PI уже определена";
?>
```


## Проверка существования переменной

Функция `isset()` позволяет определить, инициализирована ли переменная или нет

```php
$message = "Hello PHP";
if(isset($message))
    echo $message;
else
    echo "переменная message не определена";
```

Функция `empty()` проверяет переменную на "пустоту". "Пустая" переменная - это переменная, значение которой равно `null`, `0`, `false` или пустой строке - в этом случае функция `empty()` возвращает true

```php
<?php
$message = "";
if(empty($message))
    echo "переменная message не определена";
else
    echo $message;
?>
```

С помощью функции `unset()` мы можем уничтожить переменную:

```php
<?php
	$a=20;
	echo $a; // 20
	unset($a);
	echo $a; // ошибка, переменная не определена
?>
```


## Получение и установка типа переменной. Преобразование типов

Для получения типа переменной применяется функция `gettype()`, которая возвращает название типа переменной

```php
<?php
	$a = 10;
	$b = "10";
	echo gettype($a); // integer
	echo "<br>";
	echo gettype($b);  // string
?>
```

Так же есть специальные функции, которые проверяют значение на соответствие определённым типам данных:

- `is_integer($a)`
- `is_string($a)`
- `is_double($a)`
- `is_numeric($a)`
- `is_bool($a)`
- `is_scalar($a)`
- `is_null($a)`
- `is_array($a)
- `is_object($a)`

С помощью функции `settype()` можно установить для переменной определенный тип. Если удалось установить тип, то функция возвращает `true`, если нет - то значение `false`.

```php
<?php
	$a = 10.7;
	settype($a, "integer");
	echo $a; // 10
?>
```

Так же мы можем явно преобразовывать типы

```php
$boolVar = false;
$intVar = (int)$boolVar; // 0
echo "boolVar = $boolVar<br>intVar = $intVar";
```

В PHP могут применяться следующие преобразования:

- (int), (integer): преобразование в int (в целое число)
- (bool), (boolean): преобразование в bool
- (float), (double), (real): преобразование в float
- (string): преобразование в строку
- (array): преобразование в массив
- (object): преобразование в object

## Операции с массивами

Функция `is_array()` проверяет, является ли переменная массивом, и если является, то возвращает true, иначе возвращает false.

```php
$users = ["Tom", "Bob", "Sam"];
$isArray = is_array($users);
echo ($isArray==true)?"это массив":"это не массив";
```

Функция count() и sizeof() получают количество элементов массива

```php
$users = ["Tom", "Bob", "Sam"];
$number = count($users);
// то же самое, что
// $number = sizeof($users);
echo "В массиве users $number элемента/ов";
```

Функция shuffle перемешивает элементы массивы случайным образом:

```php
$users = ["Tom", "Bob", "Sam", "Alice"];
shuffle($users);
print_r($users);
// один из возможных вариантов
//Array ( [0] => Bob [1] => Tom [2] => Alice [3] => Sam )
```

Функция compact позволяет создать из набора переменных ассоциативный массив, где ключами будут имена переменных:

```php
<?php
 
$model = "Apple II";
$producer = "Apple";
$year = 1978;
 
$data = compact("model", "producer", "year");
print_r($data);
// получится следующий вывод
// Array ( [model] => Apple II [producer] => Apple [year] => 1978 ) 
?>
```

Для сортировки по возрастанию используется функция `asort()`. Эта функция сортирует автоматически по порядку возрастания (или по алфавиту)

Так же мы можем определить варианты сортировки:
- `SORT_REGULAR`: автоматический выбор сортировки
- `SORT_NUMERIC`: числовая сортировка
- `SORT_STRING`: сортировка по алфавиту

```php
$users = ["Tom", "Bob", "Sam", "Alice"];
asort($users);
print_r($users);
// вывод отсортированного массива
// Array ( [3] => Alice [1] => Bob [2] => Sam [0] => Tom )

asort($users, SORT_STRING); // выбираем сортировку по алфавит
```

Функция `asort` производит сортировку по значениям элементов, но также существует и еще и сортировка по ключам. Она представлена функцией `ksort`

```php
$states = ["Spain" => "Madrid", "France" => "Paris", "Germany" => "Berlin", ];
asort($states);
print_r($states);
// массив после asort   - сортировка по значениям элементов
// Array ( [Germany] => Berlin [Spain] => Madrid [France] => Paris ) 
 
ksort($states);
print_r($states);
// массив после ksort - сортировка по ключам элементов
//  Array ( [France] => Paris [Germany] => Berlin [Spain] => Madrid )
```

Функция `natsort()` выполняет естественную сортировку, проверяя значение полностью, а не первый символ

```php
<?php
$os = array("Windows 7", "Windows 8", "Windows 10");
natsort($os);
print_r($os);
// результат
// Array ( [0] => Windows 7 [1] => Windows 8 [2] => Windows 10) 
?>
```

implode — Объединяет элементы массива в строку

```php
$array = ['имя', 'почта', 'телефон'];
var_dump(implode(",", $array)); // string(32) "имя,почта,телефон"
```


# Отправка данных на сервер

## Получение данных из строки запроса

Строка запроса представляет набор параметров, которые помещаются в адресе после вопросительного знака. При этом каждый параметр определяет название и значение. Например, в адресе:

`http://localhost/user.php?name=Tom&age=36`

Из вышеописанного запросы мы можем получить нужные нам параметры через использование глобального ассоциативного массива `$_GET`, который хранит параметры адресной строки

```php
<?php
$name = "не определено";
$age = "не определен";
if(isset($_GET["name"])){
    $name = $_GET["name"];
}
if(isset($_GET["age"])){
    $age = $_GET["age"];
}
echo "Имя: $name <br> Возраст: $age";
?>
```

![](_png/Pasted%20image%2020230729125433.png)


## Отправка форм

Чтобы отправить данные из формы, нужно указать первым делом:
- в `form` action с папкой, где хранится скрипт и method, который описывает тип запроса
- в `input` нужно указать атрибут name

`index.php`
```php
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <form action="user.php" method="POST">
        <label for="name">
            <input type="text" id="name" name="name" placeholder="Имя">
        </label>
        <label for="age">
            <input type="text" id="age" name="age" placeholder="Возраст">
        </label>
        <button>
            Отправить
        </button>
    </form>
</body>
</html>
```

В самом скрипте с запросом, нужно воспользоваться глобальным массивом `$_POST`, который хранит данные, отправленные через POST-запрос

`user.php`
```php
<?php
$name = "Не определено";
$age = "Не определено";

if(isset($_POST["name"])) {
    $name = $_POST["name"];
}

if(isset($_POST["age"])) {
    $age = $_POST["age"];
}

echo '<h2>' . "Имя: $name </br> Возраст: $age" . '</h2>';
?>
```

![](_png/Pasted%20image%2020230729130859.png)

![](_png/Pasted%20image%2020230729130902.png)

## Безопасность данных

Наша прошлая форма позволяет встраивать JS-скрипты в наш документ и воспроизводить их. Это очень опасно, так как может быть встроен вредоносный код.

![](_png/Pasted%20image%2020230729131850.png)



























































































