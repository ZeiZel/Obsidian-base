#MVP #MVC #MVVM

Основная суть MV-образных паттернов заключается в разделении бизнес-логики от интерфейса.

## MVC

### Что такое MVC

Представим такую ситуацию, что у нас есть приложение, которому нужно будет заменить интерфейс и сохранить как прошлое, так и новое отображение интерфейса. Но до этого мы реализовывали приложение в полной связности с бизнес-логикой. То есть BL находится прямо внутри UI и неразрывно с ним связана. 

![](_png/Pasted%20image%2020241027100458.png)

MVC же подразумевает то, что мы заранее выделили логику подсчёта всех значений (cos, sin, pow) в отедльной сущности (aka ==model==), а уже будем вызывать эту логику из самого интерфейса (aca ==view==) через связующее звено (aka ==controller==) 

![](_png/Pasted%20image%2020241027103524.png)

Если приводить пример из реальной жизни, то когда мы взаимодействуем с банком, то обращение идёт не напрямую с деньгами, а через определённых посредников.

- View - сотрудник банка или банкомат, через который мы делаем определённые запросы на операции в банке
- Controller - посредник для банкомата или сотрудника банка, через которых они отправляют запросы на выполнение операций 
	- банкомат вызывает заранее подгтовленные функции по выполнению операций над нашим счётом
	- работник обращается к корпоративному приложению для выполнения операции
- Model - внутреннее устройство банка, которое выполняет все операции над счётом клиента 

![](_png/Pasted%20image%2020241027104602.png)
 
MVC подход используется у нас на любом этапе приложения. Начиная от клиент-серверного взаимодействия и бэкэнда, заканчивая архитектурой приложения на клиенте (web, мобильного, декстопного)

![](_png/Pasted%20image%2020241027105158.png)

### Пример MVC на NodeJS

Реализуем приложение на Express и шаблонизаторе HandleBars

```bash
bun install express hbs
```

Первое, что мы сделаем - это во view напишем логику отображения в шаблонизаторе.

`view / user.hbs`
```html
<!DOCTYPE html>
<html>
<head>
    <title>Пользователи</title>
    <meta charset="utf-8" />
</head>
<body>
<h1>Создать нового пользователя</h1>
<form action="/users/create" method="POST">
    <label>Имя</label>
    <input name="username" /><br><br>
    <label>Возраст</label>
    <input name="age" type="number" min="1" max="110" /><br><br>
    <input type="submit" value="Отправить" />
</form>
<h1>Список пользователей</h1>
{{#each users}}
    <div style="border: 1px solid green; padding: 15px">
        <h3>Username - {{this.username}}</h3>
        <p>Возраст - {{this.age}}</p>
        <button onclick="removeById({{this.id}})">
            Удалить
        </button>
    </div>
{{/each}}
<script>
    function removeById(id)  {
        fetch(`http://localhost:5000/users/remove?id=${id}`, {
            method: 'DELETE'
        }).then(() => window.location.reload())
    }
</script>
</body>
<html>
```

`view / user-error.hbs`
```HTML
<!DOCTYPE html>
<html>
<head>
    <title>Пользователи</title>
    <meta charset="utf-8" />
</head>
<body>
<h1>Произошла ошибка. {{message}}</h1>
<a href="/users">Вернуться на страницу пользователей</a>
</body>
<html>
```

Далее нам нужно будет описать модель пользователя, в которой находится интерфейс этого пользователя и прямые методы для работы с ним. Тут находится только логика работы с пользователем.

`domain / user / model.js`
```JS
// aka DB
let users = [
    { id: '1', username: 'Ulbi TV', age: 23 }
]

// Методы для работы конкретно с пользователем
module.exports = {
	// создаём пользователя
    create: ({ username, age }) => {
        const newUser = {
            username,
            age,
            id: String(Date.now())
        }

        if(!users.find(user => user.username === users)) {
            users.push(newUser)
        } else {
            throw new Error('Пользователь уже существует')
        }

        return newUser;
    },
    // удаление по ID
    removeById: ({ id }) => {
        const userIndex = users.findIndex(user => user.id === String(id));

        if(userIndex === -1) {
            throw new Error('Пользователь не найден')
        }

        users.splice(userIndex, 1);

        return id;
    },
    // удаление по имени пользователя
    removeByUsername: ({ id }) => {},
    // Получаем всех
    getAll: () => {
        return users;
    },
    // получаем по ID
    getById: ({id}) => {
        return users.find(user => user.id === id);
    },
}
```

Далее опишем контроллер для работы с моделью. Он будет давать нам контролируемую обёртку над моделью, в которой будут находиться все проверки и взаимодействие с внешним миром.

`domain / user / controller.js`
```JS
// использует в себе модель
const userModel = require('./model');

/**
 * все методы контроллера принимают в себя Reqest и Response
 * Так как он работает непосредственно с запросами
 */
module.exports = {
	// получение всех пользователей
    getAll: (req, res) => {
        return res.render('users.hbs', {
            users: userModel.getAll()
        })
    },
    // создание пользователей с валидацией и проверкой
    create: (req, res) => {
        try {
            const { age, username} = req.body;

            if(!age || !username) {
                throw new Error('Не указан username или возраст');
            }

            userModel.create({ age, username })

            return res.redirect('/users')
        } catch (e) {
            return res.render('users-error.hbs', {
                message: e.message
            });
        }

    },
    // удаление пользователя с валидацией и проверкой
    removeById: (req, res) => {
        try {
            const id = req.query.id;

            if(!id) {
                throw new Error('id не указан');
            }

            userModel.removeById({ id })

            res.render('users-view.hbs', {
                users: userModel.getAll()
            })
        } catch (e) {
            return res.render('users-error.hbs', {
                message: e.message
            });
        }
    }
}
```

Это контроллер для работы с соап-запросами

`domain / user / soap-controller.js`
```JS
const userModel = require('./model');

module.exports = {
    getAll: (req, res) => {
        const xmlUsers = XML.parse(userModel.getAll());
        return res.send(xmlUsers);
    },
}
```

Это контроллер для работы с рест-запросами

`domain / user / rest-controller.js`
```JS
const userModel = require('./model');

module.exports = {
    getAll: (req, res) => {
        return res.json(userModel.getAll())
    },
}
```

Ну и далее нам остаётся только поднять сервер

`server.js`
```TS
const express = require('express')
const path = require('path');
const userController = require('./domain/users/controller')

const PORT = 5000;

const app = express();

app.set("view engine", "hbs");
app.set('views', path.resolve(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));

app.get('/users', userController.getAll)
app.post('/users/create', userController.create)
app.delete('/users/remove', userController.removeById)

app.listen(PORT,() => console.log('server started on PORT = ' + PORT))
```

### Пример клиентского приложения с MVC









