
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

Мы имеем 10 типов данных:

- bool (логический тип)
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

Так же можно определить те значения, которые будет возвращать оператор `yield`, через оператор `from`. Конкретно тут `yield` возьмёт значения из массива `[2, 3, 4]`

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
echo $name; // так написать нельзя, так как переменная $name существует только внутри функции showName
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

Для определения константы применяется оператор `const`, при этом в названии константы знак доллара `$` (в отличие от переменных) не используется.

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

Функция `empty()` проверяет переменную на "пустоту". "Пустая" переменная - это переменная, значение которой равно `null`, `0`, `false` или пустой строке - в этом случае функция `empty()` возвращает `true`

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

Функция `shuffle` перемешивает элементы массивы случайным образом:

```php
$users = ["Tom", "Bob", "Sam", "Alice"];
shuffle($users);
print_r($users);
// один из возможных вариантов
//Array ( [0] => Bob [1] => Tom [2] => Alice [3] => Sam )
```

Функция `compact` позволяет создать из набора переменных ассоциативный массив, где ключами будут имена переменных:

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

`implode` — Объединяет элементы массива в строку

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

Чтобы избежать подобных проблем с безопасностью, рекомендуется применять функцию `htmlentities()` (так же есть похожая на неё `htmlspecialchars()`)

```php
$name = "не определено";
$age = "не определен";
if(isset($_POST["name"])){
  
    $name = htmlentities($_POST["name"]);
}
if(isset($_POST["age"])){
  
    $age = htmlentities($_POST["age"]);
}
echo "Имя: $name <br> Возраст: $age";
```

Еще одна функция - функция `strip_tags()` позволяет полностью исключить теги html

## Отправка массивов

Чтобы отправить массив, нам нужно в атрибуте `name` указать целевой массив и ключ отправляемого значения

`index.php`
```php
<?php
if(isset($_POST["users"])){

	$firstUser = $_POST["users"]["first"];
	$secondUser = $_POST["users"]["second"];
	$thirdUser = $_POST["users"]["third"];
	echo "$firstUser<br>$secondUser<br>$thirdUser";
}
?>
<h3>Форма ввода данных</h3>
<form method="POST">
	<label for="users[first]">
		User 1: <input type="text" name="users[first]" />
	</label>
	<label for="users[second]">
		User 2: <input type="text" name="users[second]" /></label>
	<label for="users[third]">
		User 3: <input type="text" name="users[third]" />
	</label>
	<button>Отправить</button>
</form>
```

## Работа с полями ввода форм

### Checkbox

Чтобы отправить данные по чекбоксу на сервер, нужно задать атрибут `name`. Чтобы отправить кастомное значение от чекбокса, то нам нужно использовать `value` (то значение, которое пойдёт на сервер)

```php
<?php
if (isset($_POST["technologies"])) {

    $technologies = $_POST["technologies"];
    foreach ($technologies as $item) echo "$item<br />";
}
?>
<h3>Форма ввода данных</h3>
<form method="POST">
	<label for="technologies[1]">ASP.NET: <input type="checkbox" id="technologies[1]" name="technologies[]" value="ASP.NET" /></label>
	<label for="technologies[2]">PHP: <input type="checkbox" id="technologies[2]" name="technologies[]" value="PHP" /></label>
	<label for="technologies[3]">Node.js: <input type="checkbox" id="technologies[3]" name="technologies[]" value="Node.js" /></label>
	<input type="submit" value="Отправить">
</form>
```

![](_png/Pasted%20image%2020230729140401.png)

### radiobutton

```php
<?php
if(isset($_POST["course"]))
{
    $course = $_POST["course"];
    echo $course;
}
?>
<h3>Форма ввода данных</h3>
<form method="POST">
    <input type="radio" name="course" value="ASP.NET" />ASP.NET <br>
    <input type="radio" name="course" value="PHP" />PHP <br>
    <input type="radio" name="course" value="Node.js" />Node.js <br>
    <input type="submit" value="Отправить">
</form>
```

![](_png/Pasted%20image%2020230729140651.png)

### Select

Если нам нужно отправить одно значение из списка `select`

```php
<?php
if(isset($_POST["course"]))
{
    $course = $_POST["course"];
    echo $course;
}
?>
<h3>Форма ввода данных</h3>
<form method="POST">
    <select name="course" size="1">
        <option value="ASP.NET">ASP.NET</option>
        <option value="PHP">PHP</option>
        <option value="Ruby">RUBY</option>
        <option value="Python">Python</option>
    </select>
    <input type="submit" value="Отправить">
</form>
```

![](_png/Pasted%20image%2020230729140944.png)

Если нам нужно будет отправить массив значений:

```php
<?php
if(isset($_POST["courses"]))
{
    $courses = $_POST["courses"];
    foreach($courses as $item) echo "$item<br>";
}
?>
<h3>Форма ввода данных</h3>
<form method="POST">
    <select name="courses[]" size="4" multiple="multiple">
        <option value="ASP.NET">ASP.NET</option>
        <option value="PHP">PHP</option>
        <option value="Ruby">RUBY</option>
        <option value="Python">Python</option>
    </select><br>
    <input type="submit" value="Отправить">
</form>
```

## Практика

`index.php`
```php
<form action="input.php" method="POST">
	<label for='firstname'>Введите имя:<br>
		<input type="text" name="firstname" id='firstname' />
	</label>
	<label for='eduform'>Форма обучения: <br>
		<input type="radio" name="eduform" id="eduform" value="очно" />очно <br>
		<input type="radio" name="eduform" id="eduform" value="заочно" />заочно <br>
	</label>
	<label for='hostel'>Требуется общежитие:<br>
		<input type="checkbox" name="hostel" id='hostel' />Да <br>
	</label>
	<label for='courses[]'>Выберите курсы: <br>
		<select id='courses[]' name="courses[]" size="5" multiple="multiple">
			<option value="ASP.NET">ASP.NET</option>
			<option value="PHP">PHP</option>
			<option value="Ruby">RUBY</option>
			<option value="Python">Python</option>
			<option value="Java">Java</option>
		</select><br>
	</label>
	<label for='comment'>Краткий комментарий: <br>
		<textarea name="comment" id="comment" maxlength="200"></textarea><br>
	</label>
	<button>Отправить</button>
</form>
```

`input.php`
```php
<?php
if (isset($_POST["firstname"])
    && isset($_POST["eduform"])
    && isset($_POST["courses"])
    && isset($_POST["comment"])
) {
    $name = htmlentities($_POST["firstname"]);
    $eduform = htmlentities($_POST["eduform"]);
    $hostel = "нет";
    if (isset($_POST["hostel"])) $hostel = "да";
    $comment = htmlentities($_POST["comment"]);
    $courses = $_POST["courses"];

    $output = "
    Имя: $name
    Форма обучения: $eduform
    Общежитие: $hostel
    Комментарий: $comment
    <ul>
    ";

    foreach ($courses as $item) {
        $output .= "<li>Запись на курс $item</li>";
    }

    $output .= "</ul>";

    echo $output;
} else {
    echo "Введённые данные некорректны";
}
```

## Отправка файлов на сервер

Чтобы загрузить файл на сервер, нам надо использовать форму с параметром `enctype="multipart/form-data"` и массив `$_FILES`

Массив `$_FILES` является двухмерным

Так как элемент для загрузки файла на форме имеет name="filename", то данный файл мы можем получить с помощью выражения `$_FILES["filename"]`

- `$_FILES["file"]["name"]`: имя файла
- `$_FILES["file"]["type"]`: тип содержимого файла, например, image/jpeg
- `$_FILES["file"]["size"]:` размер файла в байтах
- `$_FILES["file"]["tmp_name"]`: имя временного файла, сохраненного на сервере
- `$_FILES["file"]["error"]:` код ошибки при загрузке

```php
<?php
if ($_FILES && $_FILES["filename"]["error"] == UPLOAD_ERR_OK)
{
    $name = $_FILES["filename"]["name"];
    move_uploaded_file($_FILES["filename"]["tmp_name"], $name);
    echo "Файл загружен";
}
?>
<h2>Загрузка файла</h2>
<form method="post" enctype="multipart/form-data">
	Выберите файл: <input type="file" name="filename" size="10" /><br /><br />
	<input type="submit" value="Загрузить" />
</form>
```

Также мы можем указать другой путь, например, допустим, на сервере есть папка "upload", тогда, чтобы загружать в нее файлы, необходимо указать соответствующий путь

```php
if ($_FILES && $_FILES["filename"]["error"]== UPLOAD_ERR_OK)
{
    $name = "upload/" . $_FILES["filename"]["name"];
    move_uploaded_file($_FILES["filename"]["tmp_name"], $name);
    echo "Файл загружен";
}
```

Данный код позволит загрузить нам сразу несколько файлов

```php
if($_FILES)
{
    foreach ($_FILES["uploads"]["error"] as $key => $error) {
        if ($error == UPLOAD_ERR_OK) {
            $tmp_name = $_FILES["uploads"]["tmp_name"][$key];
            $name = $_FILES["uploads"]["name"][$key];
            move_uploaded_file($tmp_name, "$name");
        }
    }
    echo "Файлы загружены";
}
?>
<h2>Загрузка файла</h2>
<form method="post" enctype="multipart/form-data">
    <input type="file" name="uploads[]" /><br />
    <input type="file" name="uploads[]" /><br />
    <input type="file" name="uploads[]" /><br />
    <input type="submit" value="Загрузить" />
</form>
```


# Объектно-ориентированное программирование

## Объекты и классы

Классы создаются через ключевое слово `class`, а методы записываются так же через `function`. Так же мы можем определять публичные и приватные поля. Чтобы обратиться к значению данного класса, мы должны воспользоваться `$this`, который через оператор связывания `->` укажет нужное поле класса.

Для вызова и обращения ко всем свойствам и методам класса извне нужно так же использовать `->` 

Заранее нужно сказать, что если мы создадим два класса с одинаковыми значениями, то они будут равны, но так как это два разных инстанса, то они будут не эквивалентны 

```php
class Person {
	public $name, $age = 20;

	function showPerson() {
		echo "Hello! I'm $this->name. And I $this->age years old" . "<br>";
	}
}

$tom = new Person();
$tom -> name = "Tom";
$tom -> showPerson();

$tomas = new Person();
$tomas -> name = "Tom";
$tomas -> showPerson();

if($tom == $tomas) {
	echo "переменные tom и tomas равны<br>";
} else {
	echo "переменные tom и tomas НЕ равны<br>";
}

if($tom === $tomas) {
	echo "переменные tom и tomas эквивалентны";
} else {
	echo "переменные tom и tomas НЕ эквивалентны";
}
```

Уже тут значения будут и равны и эквивалентны, так как они будут ссылаться на один и тот же объект

```php
$person = new Person();
 
$tom = $person;
$tom -> name = "Tom";
$tom -> age = 36;
 
$tomas = $person;
 
if($tom == $tomas) echo "переменные tom и tomas равны<br>";
else echo "переменные tom и tomas НЕ равны<br>";
 
if($tom === $tomas) echo "переменные tom и tomas эквивалентны";
else echo "переменные tom и tomas НЕ эквивалентны";
```

## Конструкторы и деструкторы

Конструктор в php обозначается как `__construct` и позволяет задать значения для полей при инициализации конструктора

Деструктор `__destruct` вызывается, когда на объект в программе не остаётся ссылок и он удаляется сборщиком мусора.

```php
<?php
class Person
{ 
    public $name, $age;
    function __construct($name="Том", $age=36)
    {
        $this->name = $name;
        $this->age = $age;
    }
     
    function displayInfo()
    {
        echo "Name: $this->name; Age: $this->age<br>";
    }
	
	function __destruct()
    {
        echo "Вызов деструктора";
    }
}
$tom = new Person();
$tom -> displayInfo();
 
$bob = new Person("Bob");
$bob -> displayInfo();
 
$sam = new Person("Sam", 29);
$sam -> displayInfo();
?>
```

## Анонимные классы

Анонимные классы - это классы, которые не имеют имени. Обычно такие классы полезны, если нам необходимо один раз создать объект подобного класса. И больше этот класс не будет использоваться.

```php
<?php
$person = new class("Bob", 34) {
     
    function __construct(public $name, public $age)
    {
        $this->name = $name;
    }
    function displayInfo()
    {
        echo "Name: $this->name; Age: $this->age<br>";
    }
};
$person -> displayInfo();
?>
```

## Наследование

PHP так же предоставляет возможность экстендить классы через ключевое слово `extends`. От родительского класса будут передаваться методы и поля. 

Чтобы переопределить нужный метод, мы можем просто написать этот же метод ещё раз в дочернем классе и переписать его функционал.

Если нам нужно вызвать срабатывание метода родительского класса, то мы можем прописать `parent::нужный_метод` - так же будет вызваться и конструктор.

```php
class Person
{ 
    public $name;
    function __construct($name)
    {
        $this->name = $name;
    }
    function displayInfo()
    {
        echo "Имя: $this->name<br>";
    }
}

class Employee extends Person 
{
    public $company;
    function __construct($name, $company)
    {
        Person::__construct($name);
        $this->company = $company;
    }
    function displayInfo()
    {
        Person::displayInfo();
        echo "Работает в $this->company<br>";
    }
}
class Manager{}
 
$tom = new Employee("Tom", "Microsoft");
 
$tom instanceof Employee;   // true
$tom instanceof Person;     // true
$tom instanceof Manager;    // false
```

## Модификаторы доступа

С помощью специальных модификаторов можно задать область видимости для свойств и методов класса. В PHP есть три таких модификатора:

- `public`: можно обращаться извне к свойствам и методам
- `protected`: доступ только в текущем классе и наследникам
- `private`: доступ только в текущем классе

Вот базовый класс, который имеет у себя методы с разными модификаторами:

```php
class Person
{
    private $privateA ="private";
    public  $publicA = "public";
    protected $protectedA = "protected";
     
    private function getPrivateMethod()
    {
        echo "private method <br />";
    }
      
    protected function getProtectedMethod()
    {
        echo "protected method <br />";
    }
      
    public function getPublicMethod()
    {
        echo "public method <br />";
    }
    function test()
    {
        $this->getPrivateMethod();
        $this->getProtectedMethod();
        $this->getPublicMethod();
         
        echo "$this->privateA <br />";
        echo "$this->protectedA <br />";
        echo "$this->publicA <br />";
    }
}
```

И тут представлена возможность использования данных методов:

```php
class Employee extends Person
{
    function test()
    {
        //echo $this->privateA; // нельзя, так как privateA - private в классе-родителе
        echo $this->protectedA;
        echo $this->publicA; 
        //$this->getPrivateMethod(); // нельзя, так как private в классе-родителе
        $this->getProtectedMethod();
        $this->getPublicMethod();
    }
}
```

Использование вне классов:

```php
$person = new Person;
// $person->getPrivateMethod(); // недоступно, так как private
// $person->getProtectedMethod(); // недоступно, так как protected
$person->getPublicMethod(); 
// echo $person->privateA; // недоступно, так как private
// echo $person->protectedA; // недоступно, так как protected
echo $person->publicA;
```

## Статические методы и свойства

Статические методы и свойства начинаются с ключевого слова `static` 

При обращении к статическим методам и свойствам используется имя класса и оператор `::`, вместо операции доступа `->`, так как статический метод относится ко всему классу, а не к конкретному объекту этого класса.

Стоит отметить, что в статических методах мы можем обращаться только к статическим свойствам и методам. Но не можем обращаться к НЕстатическим свойствам и методам через `$this`

```php
<?php
class MyClass {
    public static $staticProperty = 'Static Property';

    public $nonStaticProperty = 'Non-Static Property';

    public static function staticMethod() {
        echo self::$staticProperty; // Обращение к статическому свойству
        echo "<br>";
        
        $obj = new self();
        echo $obj->nonStaticProperty; // Обращение к нестатическому свойству
        echo "<br>";
    }
}

MyClass::staticMethod(); // Вызов статического метода класса
?>
```

## Интерфейсы

 Интерфейс - это контракт, который говорит, что класс обязательно реализует определенный функционал

```php
<?php
interface Messenger
{
    function send();
}
interface EmailMessenger extends Messenger
{
     
}
class SimpleEmailMessenger implements EmailMessenger 
{
    function send()
    {
        echo "Отправка сообщения на email.";
    }
}
$outlook = new SimpleEmailMessenger();
$outlook->send();
?>
```

Конкретно в классе мы должны реализовать весь функционал из интерфейсов. Интерфейсы можно расширять от других интерфейсов. Классы могут имплементировать в себя несколько интерфейсов.

```php
interface Person {
	function Work();
}

interface Programmer extends Person {
	function writeCode();
}

interface Devops extends Person {
	function deploy();
}

class ProgrammerWorker implements Programmer, Devops {
	public function Work()
	{
		// TODO: Implement Work() method.
	}

	public function writeCode()
	{
		// TODO: Implement writeCode() method.
	}

	public function deploy()
	{
		// TODO: Implement deploy() method.
	}
}
```

## Абстрактные классы и методы

Абстрактный класс представляет частичную реализацию для классов-наследников.

Абстрактный класс определяется с помощью модификатора `abstract`, который ставится перед именем класса

```php
<?php
	abstract class Messenger
	{
	    protected $name;
	    function __construct($name)
	    { 
	        $this->name = $name;
	    }
	    abstract function send($message);
	    function close()
	    {
	        echo "Выход из мессенджера...";
	    }
	}
	 
	class EmailMessenger extends Messenger 
	{
	    function send($message)
	    {
	        echo "$this->name отправляет сообщение: $message<br>";
	    }
	}
	$outlook = new EmailMessenger("Outlook");
	$outlook->send("Hello PHP 8");
	$outlook -> close();
?>
```

## Traits

Трейты - это группа с методами, которые мы можем использовать внутри классов. Обозначается группа через использование `trait`. Применяется внутри класса через использование оператора `use` 

```php
trait Printer
{
    public function printSimpleText($text) { echo "$text<br>"; }
    public function printHeaderText($text) { echo "<h2>$text<h2>"; }
}
 
class Message
{
    use Printer;
}

$myMessage = new Message();
$myMessage->printSimpleText("Hello World!");
$myMessage->printHeaderText("Hello PHP 8");
```

Так же трейты перезатирают наследуемые методы от других классов

```php
class Data
{
    function print() { echo "Print from Data"; }
}
trait Printer
{
    function print() { echo "Print from Printer"; }
}
 
class Message extends Data
{
    use Printer;
}

$myMessage = new Message();
$myMessage->print();     // Print from Printer
```

## Копирование объектов классов

При присваивании объекта класса другой переменной создается новая ссылка на тот же объект

```php
class Person{     
    public $name;
    function __construct($name){
         
        $this->name = $name;
    }
}

$tom = new Person("Tom");
$bob = $tom;
$bob->name = "Bob";
echo $tom->name; // Bob
```

Однако такое поведение может быть нежелательным, если мы хотим, чтобы после копирования переменные представляли независимые друг от друга объекты. И для этого PHP предоставляет оператор `clone`

```php
class Person{
     
    public $name;
    function __construct($name){
         
        $this->name = $name;
    }
}
$tom = new Person("Tom");
$bob = clone $tom;      // копируем объект из $tom в переменную $bob
$bob->name = "Bob";
echo $tom->name; // Tom
```

Так же мы можем копировать и вложенные внутрь объекты через задание специального метода внутри класса `__clone`, который стриггерится во время клонирования класса

```php
class Company{
     
    public $name;
    function __construct($name){ $this->name = $name; }
}
class Person{
     
    public $name, $company;
    function __construct($name, $company)
    { 
        $this->name = $name; 
        $this->company = $company;
    }
    function __clone()
    {
        $this->company = clone $this->company;
    }
}
$microsoft = new Company("Microsoft");
$tom = new Person("Tom", $microsoft);
 
$bob = clone $tom;      // копируем объект из $tom в переменную $bob
$bob->name = "Bob";
$bob->company->name = "Google";   // изменяем у Боба название компании
$bob->languages[0] = "french";
echo $tom->company->name; // Microsoft - у Тома НЕ изменилась компания
```

## Свойства и классы для чтения

>[!warning] Это функционал PHP версии 8.1 - 8.2

Иногда необходимы свойства, которые не должны менять своего значения. Подобные свойства предваряются ключевым словом readonly. Это позволяет гарантировать, что значение свойства не изменится.

 Таким свойствам можно передать значение только один раз внутри класса, в котором они определены (обычно это делается в конструкторе класса)

```php
class Person
{ 
    public readonly string $name;
    public $age;
       
    public function __construct($name, $age)
    {
        $this->name = $name;
        $this->age = $age;
    }
}
$tom = new Person("Tom", 38);
$tom->age = 22;             // значение свойства $age можно поменять
 
// $tom->name = "Bob";     // значение свойства $name нельзя поменять, так как оно только для чтения
 
echo "Name: $tom->name";  // получить значение свойства $name можно
```

Начиная с версии 8.2 PHP позволяет определять классы для чтения. Такой класс определяется с помощью ключевого слова readonly. Свойства таких классов по умолчанию являются свойствами, доступными только для чтения. Это гарантирует, что никакое из свойств объекта не сможет изменить значение. 

При этом для свойств класса для чтения также надо явным образом указывать тип данных. Кроме того, при наследовании производный класс также должен быть классом только для чтения.

```php
<?php
readonly class Person
{ 
    public function __construct(public string $name, public int $age)
    {}
}
$tom = new Person("Tom", 38);
// получить значения свойств можно
echo "Name: $tom->name  Age: $tom->age";  // Name: Tom Age: 38
// изменить значения свойств нельзя
// $tom->name = "Tomas";  // !ошибка
?>
```


# Базовые возможности PHP

## Подключение внешних файлов

Подключением внешних файлов занимается 5 разных инструкций:
- `include` - подключает полностью весь файл
- `include_once` - позволяет подключить файл только единожды, чтобы не было ошибки с повторными импортами
- `require` - подключает полностью весь файл, но если файла не окажется, то программа перестанет работать
- `require_once` - выполняет require, но подключает файл только один раз
- `spl_autoload_register()` - это функция для автоматической загрузки нужного нам модуля

`welcome.php`
```php
<?php
$greeting = "Welcome!";
```

`index.php`
```php
<?php
	include "welcome.php";
	echo $greeting;
?>
```

## Пространства имен

Пространства имен позволяют избежать конфликта имен и сгруппировать функционал. Внутри пространства имен могут быть размещены классы, интерфейсы, функции и константы.

Если какая-та конструкция (например, класс или функция) определена вне любого пространства имен, то считается, что она расположена в глобальном пространстве имен.

Стоит учитывать, что определение пространства имен должно быть расположено выше любого другого кода или разметки html.

```php
<?php
namespace base;
class Person
{
    public $name;
    function __construct($name) { $this->name = $name; }
}
?>
<!DOCTYPE html>
<html>
<head>
<title>METANIT.COM</title>
<meta charset="utf-8" />
</head>
<body>
<?php
$tom = new Person("Tom");
echo $tom->name;
?>
</body>
</html>
```

Тут находится пример использования класса из одного пространства имён в другом. Делается это через обращение `\пространсто\Класс`

`person.php`
```php
<?php
namespace base;
class Person
{
    public $name;
    function __construct($name) { $this->name = $name; }
}
?>
```
`index.php`
```php
<?php
namespace work;
include "Person.php";
$tom = new \base\Person("Tom");
echo $tom->name;
?>
```

Так же пространства имён могут быть вложенными

```php
<?php
namespace base\classes;
class Person
{
    public $name;
    function __construct($name) { $this->name = $name; }
}
?>
```

```php
<?php
namespace work;
include "Person.php";
$tom = new \base\classes\Person("Tom");
echo $tom->name;
?>
```

Так же мы можем указать псевдоним для определённого объекта из пространства имён через конструкцию `use`. Через запятую можно указать несколько подобных импортов

```php
<?php
namespace work;
include "Person.php";
 
use \base\classes\Person as User, \base\classes\Employee as Employee;
 
$tom = new User("Tom");
echo $tom->name . "<br>";
$sam = new Employee("Sam");
echo $sam->name;
?>
```

Чтобы подключить константы и функции из другого пространства имён, нужно указать это в `use const / function`

```php
<?php
namespace work;
include "Person.php";
 
use \base\classes\Person;
use const \base\classes\adminName;
use function \base\classes\printPerson;
 
$tom = new Person(adminName);
printPerson($tom);  // Odmen
?>
```

## Типизация данных

- `bool`: допустимые значения true и false
- `float`: значение должно число с плавающей точкой
- `int`: значение должно представлять целое число
- `string`: значение должно представлять строку
- `mixed`: любое значение
- `callable`: значение должно представлять функцию
- `array`: значение должно представлять массив
- `iterable`: значение должно представлять массив или класс, который реализует интерфейс Traversable. Применяется при переборе в цикле foreach
- Имя класса: объект должен представлять данный класс или его производные классы
- Имя интерфейса: объект должен представлять класс, который реализует данный интерфейс
- `Self`: объект должен представлять тот же класс или его производный класс. Может использоваться только внутри класса.
- `parent`: объект должен представлять родительский класс данного класса. Может использоваться только внутри класса.

Типизация функции (принимает массив, функцию и возвращает число): 

```php
function sum(array $numbers, callable $condition) : int
{
    $result = 0;
    foreach($numbers as $number){
        if($condition($number))
        {
            $result += $number; 
        }
    }
    return $result;
}
 
 
$isPositive = function($n){ return $n > 0;};
 
$myNumbers = [-2, -1, 0, 1, 2, 3, 4, 5];
$positiveSum = sum($myNumbers, $isPositive);
echo $positiveSum;  // 15
```

Типизация полей класса

```php
class Person {    
    public $name;
    public int $age;
}
```

>[!warning] PHP 8 

Так же в PHP присутствует union тип, который позволяет через `|` передать в качестве аргумента функции один из двух типов

```php
function sum(int|float $n1, int|float $n2,): int|float
{
    return $n1 + $n2;
}
echo sum(4, 5);         // 9
echo "<br>";
echo sum(2.5, 3.7);     // 6.2
```

## Работа со строками

Запись `<<< МЕТКА ... МЕТКА;` позволяет вывести многострочный текст

```php
$name = "Tom";
$age = 36;
$s = <<< USER
Name = $name
Age = $age
USER;
echo $s; // Name = Tom Age = 36
```

Обращение к символам строки

```php
$str = "Hello Tom";
 
echo $str[0];// получим первый символ - H
```

Функция `strpos($str, $search)` возвращает позицию подстроки или символа `$search` в строке `$str` или значение `false`, если строка `$str` не содержит подстроки `$search`

Для кириллицы стоит использовать `mb_strpos()`

```php
$input = "This is the end"; 
$search = "is";
$position = strpos($input, $search); // 2
if($position!==false)
{
    echo "Позиция подстроки '$search' в строке '$input': $position";
}
```

Функция `strrpos()` во многом аналогична функции `strpos()`, только ищет позицию не первого, а последнего вхождения подстроки в строку (опять же для кириллицы стоит использовать `mb_strrpos()`)

```php
$input = "This is the end"; 
$search = "is";
$position = strrpos($input, $search); // 5
```

Дополнительные операции:

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

Применяя функцию `substr($str, $start [, $length])`, можно получить из одной строки ее определенную часть. Данная функция обрезает строку `$str`, начиная c символа в позиции `$start` до конца строки. С помощью дополнительного необязательного параметра `$length` можно задать количество вырезаемых символов

```php
$input = "The world is mine!"; 
$subinput1 = substr($input, 2);
$subinput2 = substr($input, 2, 6);
echo $subinput1;
echo "<br>";
echo $subinput2;
```

Для замены определенной части строки применяется функция `str_replace($old, $new, $input)`. Эта функция заменяет в строке `$input` все вхождения подстроки `$old` на подстроку `$new` с учетом регистра

```php
$input = "Мама мыла раму"; 
$input = str_replace("мы", "ши", $input);
echo $input;
```

`explode` разделяет строку в массив (аналог функции `split` в javascript),  
`implode` объединяет массив в строку (аналог функции `join` в javascript).

```php
<?php
	$string = "Oleg is coming soon";

	foreach (explode(" ", $string) as $item) {
		echo "$item <br>";
	}

	$fruits = ["apple", "banana"];
	echo implode(", ", $fruits);
?>
```

![](_png/Pasted%20image%2020230801182040.png)

## Работа с cookie

Cookie (куки) представляют небольшие наборы данных (не более 4 кБайт), с помощью которых веб-сайт может сохранить на компьютере пользователя любую информацию. С помощью куки можно отслеживать активность пользователя на сайте: залогинен пользователь на сайте или нет, отслеживать историю его визитов и т.д.

### Сохранение cookie 

Для сохранения куки используется функция `setcookie()`

```PHP
bool setcookie(string $name, string $value, int $expire, 
    string $path, string $domain, bool $secure, bool $httponly);
```

- `name`: имя cookie, которое будет использоваться для доступа к его значению
- `value`: значение или содержимое cookie - любой алфавитно-цифровой текст не более 4 кБайт
- `expire` (необязательный параметр): срок действия в секундах, после которого cookie уничтожаются. Если данный параметр не установлен или равен 0, то уничтожение cookie происходит после закрытия браузера. Обычно устанавливается относительно текущего времени, которое можно получить с помощью функции time()
- `path` (необязательный параметр): путь к каталогу на сервере, для которого будут доступны cookie. Если задать "/", cookie будут доступны для всего сайта. Если задать, например, "/mydir/", cookie будут доступны только из каталога /mydir/ и всех его подкаталогов. По умолчанию значением является текущий каталог, в котором устанавливаются cookie.
- `domain` (необязательный параметр): задает домен, для которого будут доступны cookie. Если это домен второго уровня, например, localhost.com, то cookie доступны для всего сайта localhost.com, в том числе и для его поддоменов типа blog.localhost.com.
- Если задан поддомен blog.localhost.com, то cookie доступны только внутри этого поддомена.
- `secure` (необязательный параметр): указывает на то, что значение cookie должно передаваться по протоколу HTTPS. Если задано true, cookie от клиента будет передано на сервер, только если установлено защищенное соединение. По умолчанию равно false.
- `httponly` (необязательный параметр): если равно true, cookie будут доступны только через http протокол. То есть cookie в этом случае не будут доступны скриптовым языкам, например, JavaScript. По умолчанию параметр равен false

Пример установки кукисов:

```php
<?php
$name = "Tom";
$age = 36;
setcookie("name", $name);
setcookie("age", $age, time() + 3600);  // срок действия - 1 час (3600 секунд)
echo "Куки установлены";
?>
```

### Получение cookie 

Чтобы получить куки, нужно обратиться к массиву `$_COOKIE`

```php
<?php
if (isset($_COOKIE["name"])) echo "Name: " . $_COOKIE["name"] . "<br>";
if (isset($_COOKIE["age"])) echo "Age: " . $_COOKIE["age"] . "<br>";
?>
```

### Сохранение массивов в cookie

```php
setcookie("lang[1]", "PHP");
setcookie("lang[2]", "C#");
setcookie("lang[3]", "Java");
```

```php
if (isset($_COOKIE["lang"])) {
    foreach ($_COOKIE["lang"] as $name => $value) {
        $name = htmlspecialchars($name);
        $value = htmlspecialchars($value);
        echo "$name. $value <br />";
    }
}
```
### Удаление cookie 

Для удаления cookie достаточно в качестве срока действия указать какое-либо время в прошлом:

```php
setcookie ("name", "", time() - 3600);
```

## Сессии

Сессии представляют набор переменных, которые хранятся на сервере (либо часть на сервере, а часть - в cookie браузера) и которые относятся только к текущему пользователю. В какой-то степени сессии являются альтернативой кукам в плане сохранения данных о пользователе.

При запуске сессии с помощью функции `session_start()`, если пользователь первый раз заходит на сайт, PHP назначает ему уникальный идентификатор сессии. Этот идентификатор с помощью cookie, которые по умолчанию называются "PHPSESSID", сохраняется в браузере пользователя. С помощью этого идентификатора пользователь ассоциируется с данными сессии. Если для пользователя уже установлена сессия, то данная функция продлевает текущую сессию вместо установки новой.

```php
<php session_start(); ?>
```

Получаем данные по сессии с помощью определённых функций

```php
session_start();
echo session_id(); // идентификатор сессии
echo session_name();  // имя - PHPSESSID
```

Затем для сохранения или получения данных в сессии надо использовать глобальный ассоциативный массив `$_SESSION`

```php
$_SESSION["имя_переменной"] = значение; // задание значения
$переменная = $_SESSION["имя_переменной"]; // получение значения
```

### Сохранение данных в сессии

```php
<php
session_start();
$_SESSION["name"] = "Sam";
$_SESSION["age"] = 41;
echo "Данные сохранены в сессии";
?>
```

![](_png/Pasted%20image%2020230802104511.png)

### Получение данных из сессии

```php
if (isset($_SESSION["name"]) && isset($_SESSION["age"])) {
	$name = $_SESSION["name"];
	$age = $_SESSION["age"];
	echo "Name: $name <br> Age: $age";
}
```

![](_png/Pasted%20image%2020230802104452.png)

### Удаление данных из сессии

Сессия удаляется с закрытием вкладки браузера, но мы можем определить как отдельные данные для удаления, так и удалить самостоятельно всю сессию

```php
unset($_SESSION["age"]);    // удаляем из сессии переменную "age"
session_destroy();          // удалит все данные сессии
```

# Обработка исключений

## Конструкция try catch finally

В конструкцию try-catch мы можем обернуть код, который может выдать ошибку. В параметры блока `catch` мы передаём тип ошибки и саму ошибку 

```php
try
{
    // код, который может вызвать исключение
    $a = 5;
    $b = 0;
    $result = $a / $b;
    echo $result;
}
catch(DivisionByZeroError $ex)
{
    // обработка исключения
    echo "Произошло исключение:<br>";
    echo $ex . "<br>";
}
echo "Конец работы программы";
```

### Типы ошибок

Сразу нужно сказать, что в PHP существует множество ошибок, которые разделены по определённым интерфейсам. Мы можем конкретизировать ошибки продвигаясь ниже вглубь реализаций ошибок

![](_png/Pasted%20image%2020230801171421.png)

### Чейн catch

Конструкция try..catch позволяет определить несколько блоков catch - для обработки различных типов ошибок и исключений

Блоки catch с более конкретными типами ошибок и исключений должны идти в начале, а более с более общими типа - в конце

```php
try
{
    $result = 5 / 0;
    echo $result;
}
catch(DivisionByZeroError $ex)
{
    echo "На ноль делить нельзя";
}
catch(ArithmeticError $ex)
{
    echo "Ошибка при выполнении арифметической операции";
}
catch(Error $ex)
{
    echo "Произошла ошибка";
}
catch(Throwable $ex)
{
    echo "Ошибка при выполнении программы";
}
```

### Получение информации об ошибках и исключениях

Интерфейс Throwable предоставляет ряд методов, которые позволяют получить некоторую информацию о возникшем исключении:

- `getMessage()`: возвращает сообщение об ошибке
- `getCode()`: возвращает код исключения
- `getFile()`: возвращает название файла, в котором возникла ошибка
- `getLine()`: возвращает номер строки, в которой возникла ошибка
- `getTrace()`: возвращает трассировку стека
- `getTraceAsString()`: возвращает трассировку стека в виде строки

```php
try
{
    $result = 5 / 0;
    echo $result;
}
catch(DivisionByZeroError $ex)
{
    echo "Сообщение об ошибке: " . $ex->getMessage() . "<br>";
    echo "Файл: " . $ex->getFile() . "<br>";
    echo "Номер строки: " . $ex->getLine() . "<br>";
}
```

### finally

Данный блок выполняется всегда

```php
try
{
    $result = 5 / 0;
    echo $result . "<br>";
}
catch(Throwable $ex)
{
    echo "Ошибка при выполнении программы<br>";
}
finally
{
    echo "Блок finally<br>";
}
echo "Конец работы программы";
```

## Генерация исключений

Генерировать исключения самостоятельно можно через `throw new Exception`

```php
class Person
{
    private $name, $age;
    function __construct($name, $age)
    {
        if($age < 0)
        {
            throw new Exception("Недействительный возраст");
        }
        $this->name = $name;
        $this->age = $age;
    }
    function printInfo()
    {
        echo "Name: $this->name<br>Age: $this->age";
    }
}
$tom = new Person("Tom", -105);
$tom->printInfo();
```

Так же мы можем сделать свой класс ошибки, который будет экстендится от класса ошибки. Это можно применять для специфических ошибок и переиспользования кода

```php
class PersonInvalidAgeException extends Exception
{
    function __construct($age)
    {
        $this -> message = "Недействительный возраст: $age. Возраст должен быть в диапазоне от 0 до 120";
    }
}
class Person
{
    private $name, $age;
    function __construct($name, $age)
    {
        $this->name = $name;
        if($age < 0)
        {
            throw new PersonInvalidAgeException($age);
        }
        $this->age = $age;
    }
    function printInfo()
    {
        echo "Name: $this->name<br>Age: $this->age";
    }
}
 
try
{
    $tom = new Person("Tom", -105);
    $tom->printInfo();
}
catch(PersonInvalidAgeException $ex)
{
    echo $ex -> getMessage();
}
```


# Работа с файловой системой

## Чтение и запись файлов

### Открытие и закрытие файлов

Для открытия файлов в PHP определена функция `fopen()`. Она имеет следующее определение: `resource fopen(string $filename, string $mode)`. Первый параметр `$filename` представляет путь к файлу, а второй - режим открытия. 

В зависимости от цели открытия и типа файла данный параметр может принимать следующие значения:

- 'r': файл открывается только для чтения. Если файла не существует, возвращает false
- 'r+': файл открывается только для чтения с возможностью записи. Если файла не существует, возвращает false
- 'w': файл открывается для записи. Если такой файл уже существует, то он перезаписывается, если нет - то он создается
- 'w+': файл открывается для записи с возможностью чтения. Если такой файл уже существует, то он перезаписывается, если нет - то он создается
- 'a': файл открывается для записи. Если такой файл уже существует, то данные записываются в конец файла, а старые данные остаются. Если файл не существует, то он создается
- 'a+': файл открывается для чтения и записи. Если файл уже существует, то данные дозаписываются в конец файла. Если файла нет, то он создается

После окончания работы с файлом, нужно закрыть поток через `fclose(имя_потока)`

Конструкция `or die("текст ошибки")` позволяет прекратить работу скрипта и вывесте некоторое сообщение об ошибке, если функция fopen не смогла открыть файл.

```php
$fd = fopen("form.php", 'r') or die("не удалось открыть файл");
fclose($fd);
```

### Чтение файла

Для построчного чтения используется функция `fgets()`, которая получает дескриптор файла и возвращает одну считанную строку. Чтобы проследить окончание файла, используется функция `feof()`, которая возвращает `true` при завершении файла.

```php
<?php
	$fd = fopen("form.php", 'r') or die("не удалось открыть файл");
	while(!feof($fd))
	{
	    $str = htmlentities(fgets($fd));
	    echo $str;
	}
	fclose($fd);
?>
```

#### Чтение файла полностью

`file_get_contents` - получает всё содержимое файла

```php
<?php
	$str = htmlentities(file_get_contents("form.php"));
	echo $str;
?>
```

#### Поблочное считывание

`fread` - считывает определённое количество байт из файла

```php
<?php
$fd = fopen("form.php", 'r') or die("не удалось открыть файл");
while(!feof($fd))
{
    $str = htmlentities(fread($fd, 600));
    echo $str;
}
fclose($fd);
?>
```

### Запись файла

Есть две аналогичных функции для записи `fwrite()` и `fputs()` 

```php
<?php
	$fd = fopen("hello.txt", 'w') or die("не удалось создать файл");
	$str = "Привет мир";
	fwrite($fd, $str);
	fclose($fd);
?>
```

```php
<?php
	$fd = fopen("hello.txt", 'w') or die("не удалось создать файл");
	$str = "Привет мир";
	fputs($fd, $str);
	fclose($fd);
?>
```

### Работа с указателем файла

Так же мы можем двигать указатель по файлу, чтобы вносить изменения в разные места через функцию `fseek()`

```php
$fd = fopen("hello.txt", 'w+') or die("не удалось открыть файл");
$str = "Привет мир!"; // строка для записи
fwrite($fd, $str); // запишем строку в начало
fseek($fd, 0); // поместим указатель файла в начало
fwrite($fd, "Хрю"); // запишем в начало строку
fseek($fd, 0, SEEK_END); // поместим указатель в конец
fwrite($fd, $str); // запишем в конце еще одну строку
fclose($fd);
```

## Управление файлами и каталогами

### Перемещение файла

```php
<?php
// если имеется папка subdir(), то функция rename переместит файл в неё
if (!rename("hello.txt", "subdir/hello.txt")) {
    echo "Ошибка перемещения файла";
} else {
	echo "Файл перемещен";
}
?>
```

### Копирование файла

```php
<?php
// функция copy() копирует файл с одним именем в другое имя
if (copy("hello.txt", "hello_copy.txt"))
    echo "Копия файла создана";
else echo "Ошибка копирования файла";
?>
```

### Удаление файла

```php
<?php
// функция unlink() удаляет файл
if (unlink("hello_copy.txt"))
    echo "Файл удален";
else echo "Ошибка при удалении файла";
?>
```

### Создание каталога

```php
// функция mkdir() создаёт новый каталог
if(mkdir("newdir"))
    echo "Каталог создан";
else
    echo "Ошибка при создании каталога";
```

### Операции с каталогами

`getcwd()` получает абсолютный путь до каталога

```php
$path = getcwd();
echo $path; // C:\localhost
```

`opendir()` - открывает определенный каталог для считывания из него информации о файлах и каталогах
`closedir()` - закрывает каталог
`readdir()` - считывает имя отдельного файла в открытом каталоге

```php
<?php
$dir = getcwd(); // получаем текущий каталог
 
if (is_dir($dir)) // является ли путь каталогом
{
    if ($dh = opendir($dir)) // открываем каталог
    {
        // считываем по одному файл или подкаталогу
        // пока не дойдем до конца
        while (($file = readdir($dh)) !== false) 
        {
            // пропускаем символы .. и .
            if($file=='.' || $file=='..') continue;
            // если каталог или файл
            if(is_dir($file)) echo "каталог: $file <br>";
            else echo "файл:    $file <br>";
        }
        closedir($dh); // закрываем каталог
    }
}
?>
```

![](_png/Pasted%20image%2020230802114236.png)













