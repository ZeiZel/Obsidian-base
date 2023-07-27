
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

















