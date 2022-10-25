#Tools #Webpack

## таймкоды

 [51:50](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=3110s) – CSS-лоадеры [58:56](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=3536s) – Работа с JSON [1:02:50](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=3770s) – Работа с файлами [1:09:02](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=4142s) – Работа со шрифтами [1:13:21](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=4401s) – Подключение CSS-библиотек [1:14:51](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=4491s) – Защита от публикации пакета [1:15:32](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=4532s) – Работа с XML-файлами [1:17:44](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=4664s) – Работа с CSV-файлами [1:20:06](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=4806s) – Дополнительные настройки [1:24:54](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=5094s) – Подключение JS-библиотек [1:28:56](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=5336s) – Оптимизация [1:33:40](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=5620s) – Webpack-dev-server [1:39:14](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=5954s) –  Копирования статических файлов [1:42:32](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=6152s) – Сжатие CSS, HTML, JS [1:59:37](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=7177s) – Компиляция Less [2:06:08](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=7568s) – Компиляция Sass [2:03:57](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=7437s) – Оптимизация [2:10:21](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=7821s) – Babel [2:22:35](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=8555s) – Добавление плагинов для Babel [2:24:28](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=8668s) – Компиляция TypeScript [2:27:20](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=8840s) – Компиляция React JSX [2:33:38](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=9218s) – Devtool [2:36:14](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=9374s) – ESLint [2:43:00](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=9780s) – Динамические импорты [2:44:52](https://www.youtube.com/watch?v=eSaF8NXeNsA&t=9892s) – Анализ финальной сборки

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

Инициализируем ==node==, через который и установим в дальнейшем ==Webpack==

```bash
npm init
```

## Установка Webpack

Устанавливаем ==webpack== для разработки (`-D`)

```bash
npm install -D webpack webpack-cli
```

- webpack - это сам основной функционал webpack
- webpack-cli - это его команды в консоли


## Базовая настройка Webpack 

Это минимальный конфиг для запуска webpack

`webpack.config.js`
```JS
// Это модуль, который хранит в себе путь до нашего проекта  
const path = require("path");  
  
// WP принимает в себя те опции, которые мы сюда вставим и по ним будет собирать наш проект  
module.exports = {  
   // Указываем начальный файл нашего проекта, в который и будет всё импортироваться  
   entry: "./src/index.js",  
   // Параметры вывода webpack  
   output: {  
      // Имя выводимого файла  
      filename: "bundle.js",  
      // тут уже указываем: путь до проекта и имя папки, в которую будут компилироваться файлы  
      path: path.resolve(__dirname, "dist"), //__dirname - системная переменная, которая указывает на текущее положение  
   },  
};
```

Команда для единоразового вызова компиляции ==webpack==

```bash
webpack
```

И теперь после подключения выходного файла к `index.html` webpack скомпилирует файл со всеми экспортами и импортами. Первыми в выходном файле всегда идут иммитации экспортов и импортов и сами exports/imports, которые мы делали. Уже только потом идёт сам код.

`index.html`
```HTML
<script src="bundle.js"></script>
```
![](_png/Pasted%20image%2020221025160833.png)

## Паттерны 

Но в прошлом варианте у нас выпадал файл `Analytics.js`, так как он не был никак связан через импорты с основной точкой входа. Чтобы исправить ситуацию, можно назначить несколько точек входа (определить несколько чанков) и задать паттерн для имени выводимых файлов

`webpack.config.js`
```JS
module.exports = {  
   mode: "development",  
   entry: {  
      // так же может быть несколько точек входа в приложение  
      main: "./src/index.js", // основной чанк  
      analytics: "./src/analytics.js", // побочный чанк  
   },  
   output: {  
		// Тут уже задаётся паттерн [name]
		filename: "[name].bundle.js",  
		path: path.resolve(__dirname, "dist"),  
   },  
};
```

И так же нужно будет немного подправить импорты скриптов в HTML-файл

![](_png/Pasted%20image%2020221025162008.png)

Однако мы можем столкнуться с той проблемой, что мы обновили скрипт, а он со своим именем уже захэшировался у пользователя в браузере и уже не обновляется - это может привести к неожиданным поломкам, поэтому стоит добавить ещё один паттерн, который будет основываться на внутреннем содержимом файла

`[contenthash]` - будет давать имя, основываясь на его хэше

`webpack.config.js`
```JS
output: {  
   filename: "[name].[contenthash].js",  
   path: path.resolve(__dirname, "dist"),  
},
```

И теперь при каждом обновлении мы будем получать новый файл

![](_png/Pasted%20image%2020221025164039.png)

## Плагины 

Для примера установим плагин, который позволяет вебпаку компилировать не только JS-файлы, но и HTML со всеми нужными входными данными

Установка плагина:
```bash
npm install -D html-webpack-plugin
```
Подключение плагина:
`webpack.config.js`
```JS
const path = require("path");  

// подключение плагина в вебпак  
const HTMLWebpackPlugin = require("html-webpack-plugin"); 
  
module.exports = {  
   mode: "development",  
   entry: {  
      // так же может быть несколько точек входа в приложение  
      main: "./src/index.js", // основной чанк  
      analytics: "./src/analytics.js", // побочный чанк  
   },  
   output: {  
      filename: "[name].[contenthash].js",  
      path: path.resolve(__dirname, "dist"),  
   },  
   // Здесь мы задаём список плагинов, которые мы подключаем в вебпак  
   plugins: [  
      new HTMLWebpackPlugin() // инициализируем плагин в вебпаке  
   ]  
};
```

Как можно увидеть, сам плагин генерирует новый `index.html` из имеющегося в `src` и подставляет все нужные импорты скриптов, которые в свою очередь компилируются со своим хешем 

![](_png/Pasted%20image%2020221025165504.png)

Так же мы можем настраивать внутренности тегов в HTML

`webpack.config.js`
```JS
plugins: [  
   new HTMLWebpackPlugin({  
      title: 'webpack valery' // дали тайтл 
   })
]
```


## Работа с HTML 

Так же мы можем указать плагину, который компилирует HTML, какой файл будет являться для него темплейтом, который будет являться отображением сайта.
Свойство `template` определяет, на примере какого файла генерировать основной HTML. *Так же в основной HTML будут вложены все нужные импорты*

`webpack.config.js`
```JS
const path = require("path");  
const HTMLWebpackPlugin = require("html-webpack-plugin");  
  
module.exports = {  
   mode: "development",  
   entry: {  
      main: "./src/index.js",  
      analytics: "./src/analytics.js",  
   },  
   output: {  
      filename: "[name].[contenthash].js",  
      path: path.resolve(__dirname, "dist"),  
   },  
   plugins: [  
      new HTMLWebpackPlugin({  
         template: "./src/index.html", // можем указать основной HTML
      })  
   ]
};
```

Оригинальный HTML в `src` (без каких-либо импортов)
```HTML
<!DOCTYPE html>  
<html lang="en">  
<head>  
   <meta charset="UTF-8">  
   <meta http-equiv="X-UA-Compatible" content="IE=edge">  
   <meta name="viewport" content="width=device-width, initial-scale=1.0">  
   <title>Webpack</title>  
</head>  
<body>  
   <div class="container">  
      <h1>WP Course</h1>  
   </div>  
</body>  
</html>
```
То , что сгенерировал ==webpack== (вебпак сам добавил импорты на актуальные скрипты)
```HTML
<!DOCTYPE html>  
<html lang="en">  
<head>  
   <meta charset="UTF-8">  
   <meta http-equiv="X-UA-Compatible" content="IE=edge">  
   <meta name="viewport" content="width=device-width, initial-scale=1.0">  
   <title>Webpack</title>  
<script defer src="main.a4fbcc6c859c6c9cd2a2.js"></script><script defer src="analytics.b0d68796ad2563de4d6c.js"></script></head>  
<body>  
   <div class="container">  
      <h1>WP Course</h1>  
   </div>  
</body>  
</html>
```

## Очистка папки проекта 

Устанавливаем плагин, который чистит проект от неиспользуемых файлов

```bash
npm i -D clean-webpack-plugin 
```

Подключаем его

`webpack.config.js`
```JS
const path = require("path");  
const HTMLWebpackPlugin = require("html-webpack-plugin");  

// подключаем плагин-очиститель
const {CleanWebpackPlugin} = require("clean-webpack-plugin");  
  
module.exports = {  
   mode: "development",  
   entry: {  
      main: "./src/index.js",  
      analytics: "./src/analytics.js",  
   },  
   output: {  
      filename: "[name].[contenthash].js",  
      path: path.resolve(__dirname, "dist"),  
   },  
   plugins: [  
      new HTMLWebpackPlugin({  
         template: "./src/index.html",  
      }),  
      // Новый плагин
      new CleanWebpackPlugin(), // инициализируем плагин
   ]  
};
```

И теперь в папке проекта чистятся неиспользуемые файлы

![](_png/Pasted%20image%2020221025172213.png)

## Сборка проекта 

Так же мы можем задать свои собственные консольные команды, которые мы можем забиндить под короткие алиасы. Конкретно в файле `package.json` мы можем в свойстве `"scripts"` задать свои алисасы и им присвоить консольную команду

`package.json`
```JS
"scripts": {  
	"dev": "webpack --mode development",  
	"build": "webpack --mode production"  
},
```

И через команду `npm run` мы вызываем запуск определённого скрипта (тут - компиляция в `development` режиме)

```bash
npm run dev
```

## Контекст

Конкретно свойство `context` позволяет нам указать самостоятельно, от какой точки будет идти ориентирование в проекте. По умолчанию вебпак ориентируется от начальной папки нашего проекта. Если мы добавим контекст, то все пути, нам нужно будет прописывать относительно этого контекста. Это удобно, так как почти все пути до файлов мы прописываем внутри той же папки `src`

`webpack.config.js`
```JS
const path = require("path");  
const HTMLWebpackPlugin = require("html-webpack-plugin");  
const {CleanWebpackPlugin} = require("clean-webpack-plugin");  
  
module.exports = {  
   // говорит, где находятся исходники  
   context: path.resolve(__dirname, "src"),  
   mode: "development",  
   entry: {  
      main: "./index.js",  
      analytics: "./analytics.js",  
   },  
   output: {  
      filename: "[name].[contenthash].js",  
      path: path.resolve(__dirname, "dist"),  
   },  
   plugins: [  
      new HTMLWebpackPlugin({  
         template: "./index.html",  
      }),  
      new CleanWebpackPlugin(),  
   ]  
};
```

## CSS-лоадеры

Лоадеры - это сущноси, которые добавляют дополнительный функционал вебпаку, который позволяет работать с другими видами файлов

Устанавливаем первым делом два лоадера
- `css-loader` позволяет импортировать стили в ==JS==
- `style-loader` добавляет стили в секцию `HEAD` в ==HTML== 

```bash
npm i -D style-loader css-loader 
```

`webpack.config.js`
```JS
module.exports = {  
   context: path.resolve(__dirname, "src"),  
   mode: "development",  
   entry: {  
      main: "./index.js",  
      analytics: "./analytics.js",  
   },  
   output: {  
      filename: "[name].[contenthash].js",  
      path: path.resolve(__dirname, "dist"),  
   },  
   plugins: [  
      new HTMLWebpackPlugin({  
         template: "./index.html",  
      }),  
      new CleanWebpackPlugin(),  
   ],  
   
   // Задаём лоадеры  
   module: {  
      rules: [  
         {  
			// Тут задаётся паттерн поиска файла 
            // если нам попадаются файлы с таким расширением  
            test: /\.css$/,  
            // то нам нужно использовать такие лоадеры  
            // лоадеры срабатывают справа-налево            
            // первый лоадер позволяет импортировать стили, второй добавляет стили в секцию HEAD в HTML            
            use: ['style-loader', 'css-loader'],  
         }  
      ],  
   }  
   
};
```

`index.html`
```JS
import Post from './Post';  
import './styles/style.css';  // подключение стилей
  
const post = new Post("Webpack Post Title");  
  
console.log("post to string", post.toString);
```

`style.css`
```CSS
.container {  
    padding-top: 2rem;  
    max-width: 1000px;  
    margin: 0 auto;  
}  
  
h1 {  
    text-align: center;  
    color: red;  
    font-weight: 700;  
    font-size: 60px;  
}
```

![](_png/Pasted%20image%2020221025185419.png)

## Работа с JSON 

59:10

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

