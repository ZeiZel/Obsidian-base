

## Установка

Установка Composer

```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
```

Установка проекта через `composer`

```bash
composer create-project --prefer-dist yiisoft/yii2-app-basic папка
```

И далее нужно будет для композера указать сгенерированный токен

![](_png/Pasted%20image%2020230805105729.png)
## Структура

В качестве входного скрипта выступает фронт-контроллер, который находится в `web/index.php`, в котором подгружается конфигурация, фреймворк Yii и собирается объект приложения

Далее запрос попадает в приложение, где определяется маршрут и создаётся контроллер, по которому пойдёт запрос

Внутри контроллера запрос проходит проверки на валидность, выполняется загрузка данных из базы (данные определяются их моделью) и далее эти данные преобразуются в тот ответ, который ожидает увидеть пользователь - вид (например, нам нужно получить от полей с созданным пользователем ещё и обогащённые данные в нужном формате - отправили все данные по пользователю в разнобой, но получили полный ответ, где идут его комментарии, место работы и так далее)

![](_png/Pasted%20image%2020230805112857.png)

- web - это публичная папка, которая представляет доступ к страницам, стилям, изображениям. Её не стоит закрывать от пользователей.
- widgets - это папка с переиспользуемым кодом внутри приложения
- assets - папка с пакетами ресурсов для приложения
- commands - команды для работы из консоли с приложением
- config - папка с конфигами, в которой можно настроить подключение к базе или работу с web
- **controllers** - папка с контроллерами приложения
- mail - папка с шаблонами писем для отправки пользователям
- **models** - папка с моделями данных
- runtime - папка с логами и кешем
- test - папка с тестами приложения
- vendor - папка с зависимостями
- **views** - папка с шаблонами и видами (layout хранит шаблоны, site хранит виды)

## Контроллеры

### Создание контроллера

В папке с контроллерами нам нужно создавать одноимённые контроллеры, которые будут обозначать определённый маршрут. В них мы вкладываем функции, которые начинаются с `action` и уже дальше будет идти имя роута, который мы вызываем в url-строке

`controllers / PostCommentController.php`
```PHP
<?php

namespace app\controllers;

use yii\web\Controller;

class PostCommentController extends Controller
{
    public function actionIndex() {
        return __METHOD__;
    }
}
```

![](_png/Pasted%20image%2020230821095015.png)

Так же мы можем отделять контроллеры в отдельные модули. Тут нам нужно будет указать папку дополнительно в неймспейсе `\admin`

`controllers / admin / MyController.php`
```PHP
<?php

namespace app\controllers\admin;

use yii\web\Controller;

class MyController extends Controller
{

    public function actionIndex() {
        return __METHOD__;
    }

}
```

![](_png/Pasted%20image%2020230821100024.png)

Так же мы можем не указывать имя метода контроллера, если он `Index` или если мы запишем в качестве дефолтного контроллера другой через `$defaultAction` 

`controllers / TestController.php`
```PHP
<?php

namespace app\controllers;

use yii\web\Controller;

class TestController extends Controller {

    public $defaultAction = 'my-test';

    public function actionIndex() {
        return 'Main Worker';
    }

    public function actionMyTest() {
        return __METHOD__;
    }

}
```

![](_png/Pasted%20image%2020230821100632.png)

Таким образом мы можем просто передавать параметры в контроллер через Get-запрос

`controllers / TestController.php`
```PHP
<?php

namespace app\controllers;

use yii\web\Controller;

class TestController extends Controller {

    public $defaultAction = 'my-test';

    public function actionIndex($name, $age = 30) {
        return $name . ' ' . $age;
    }

    public function actionMyTest() {
        return __METHOD__;
    }

}
```

![](_png/Pasted%20image%2020230821115222.png)

### Вызов экшенов

Так же внутри контролерров в методе `actions()` мы можем присваивать определённым роутам контроллеров выполнение определённых функций. Тут в контроллере `test` по роуту `test` будет выводиться текст `'Action runner'`

`components / HelloAction.php`
```PHP
<?php

namespace components;

use yii\base\Action;

class HelloAction extends Action
{
    public function run() {
        return 'Action runner';
    }
}
```

`controllers / TestController.php`
```PHP
<?php

namespace app\controllers;

use yii\web\Controller;

class TestController extends Controller {

    public $defaultAction = 'my-test';

    public function actions() {
        return [
            'test' => 'app\components\HelloAction'
        ];
    }

    public function actionIndex($name, $age = 30) {
        return $name . ' ' . $age;
    }

    public function actionMyTest() {
        return __METHOD__;
    }

}
```

## Представления (Виды - View)











## Ресурсы




## Работа с форамами




## Валидация










## AJAX







## Модели (Model)







## Active Record







## Связи моделей







## Виджеты







## ЧПУ
















