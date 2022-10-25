#Tools #Webpack

## Решение частых ошибок

**Первая ошибка**
Если не работает Dev-server на текущей версии вебпака:
```JSON
devServer: { 
	static: { 
		directory: path.join(__dirname, 'src'), 
	}, 
	compress: true, 
	port: 9000, 
	open: true, 
},
```
Команда в package.json тоже немного другая: 
```JSON
"start": "webpack serve"
```


## Написание базового приложения 

Этот скрипт реализует функционал отправки сообщения в JSON-формате

`Post.js`
```JS
class Post {  
   constructor(title) {  
      this.title = title;  
      this.date = new Date();  
   }  
  
   toString() {  
      return JSON.stringify({  
         title: this.title,  
         date: this.date.toJSON(),  
      });  
   }  
}
```

Этот скрипт инициализирует новую отправку сообщения и вывод в консоль 

`index.js`
```JS
const post = new Post("Webpack Post Title");  
  
console.log("post to string", post.toString);
```

Уже этот скрипт не связан с работой самого сайта - он считает клики на странице и позволяет нам их вывести в нужный момент

`Analytics.js`
```JS
function createAnalytics() {  
   let counter = 0;  
   let isDestroyed = false;  
  
   const listener = () => counter++;  
  
   document.addEventListener("click", listener);  
  
   return {  
      destroy() {  
         document.addEventListener("click", listener);  
         isDestroyed = true;  
      },  
      getClicks() {  
         if (isDestroyed) {  
            return "Analytics is destroyed";  
         }  
         return counter;  
      },   
    };  
}  
  
window.analytics = createAnalytics();
```
![](_png/Pasted%20image%2020221025125259.png)

Тут уже в ==правильном порядке== подключаем скрипты и создаём основу сайта

`index.html`
```HTML
<!DOCTYPE html>  
<html lang="en">  
  
<head>  
   <meta charset="UTF-8">  
   <meta http-equiv="X-UA-Compatible" content="IE=edge">  
   <meta name="viewport" content="width=device-width, initial-scale=1.0">  
   <title>Webpack</title>  
   <script src="analytics.js"></script>  
</head>  
  
<body>  
   <div class="container">  
      <h1>WP Course</h1>  
   </div>  
  
   <script src="Post.js"></script>  
   <script src="index.js"></script>  
</body>  
  
</html>
```


>[!warning] А теперь попробуем понять, что с этим приложением не так:
> - Нам нужно подключать очень много скриптов в наш `index.html`
> - Нам нужно обязательно учитывать последовательность подключенных скриптов к странице (потому что в неправильном порядке вылезет ошибка)

## Инициализация приложения 

Инициализируем ==node==, через который и установится ==Webpack==

```bash
npm init
```

## Установка Webpack



## Базовая настройка Webpack 



## Паттерны 



## Плагины 


## Работа с HTML 


## Очистка папки проекта 
## Сборка проекта 
## Контекст
## CSS-лоадеры
## Работа с JSON 
## Работа с файлами 
## Работа со шрифтами
## Подключение CSS-библиотек 
## Защита от публикации пакета 
## Работа с XML-файлами 
## Работа с CSV-файлами 
## Дополнительные настройки 
## Подключение JS-библиотек 
## Оптимизация 
## Webpack-dev-server
## Копирования статических файлов 
## Сжатие CSS, HTML, JS 
## Компиляция Less 
## Компиляция Sass 
## Оптимизация 
## Babel 
## Добавление плагинов для Babel 
## Компиляция TypeScript 
## Компиляция React JSX 
## Devtool
## ESLint 
## Динамические импорты
## Анализ финальной сборки

