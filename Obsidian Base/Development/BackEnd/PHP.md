
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
- int
- float
- string
- boolean

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




























