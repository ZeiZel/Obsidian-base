
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











