#React

## Таймкоды
[01:04:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3860s) ➝ Отрисовка по условию [01:05:30](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3930s) ➝ Сортировка. Выпадающий список [01:12:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=4320s) ➝ Поиск. Фильтрация. [01:15:10](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=4510s) ➝ useMemo. Мемоизация. Кеширование [01:23:50](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5030s) ➝ Модальное окно. Переиспользуемый UI компонент [01:30:23](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5423s) ➝ Анимации. React transition group [01:33:40](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5620s) ➝ Декомпозиция. Кастомные хуки [01:36:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5780s) ➝ Работа с сервером. Axios [01:38:40](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5920s) ➝ Жизненный цикл компонента. useEffect [01:43:08](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6188s) ➝ API. PostService [01:44:45](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6285s) ➝ Индикация загрузки данных с сервера [01:46:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6380s) ➝ Компонент Loader. Анимации [01:49:25](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6565s) ➝ Кастомный хук useFetching(). Обработка ошибок [01:54:15](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6855s)➝ Постраничный вывод. Пагинация (pagination) [02:06:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=7580s) ➝ Обьяснение механизма изменения состояния [02:12:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=7920s) ➝ React router. Постраничная навигация. BrowserRouter, Route, Switch, Redirect [02:22:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=8520s) ➝ Динамическая навигация. useHistory, useParams [02:29:30](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=8970s) ➝ Загрузка комментариев к посту [02:33:10](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=9190s) ➝ Улучшаем навигацию. Приватные и публичные маршруты [02:38:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=9480s) ➝ useContext. Глобальные данные. Авторизация пользователя [02:47:10](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=10030s) ➝ Бесконечная лента. Динамическая пагинация. useObserver

## Введение

Что будет в курсе:
- Основные концепции
- Управление состояниями + жизненный цикл компонента
- Библиотека UI компонентов
- Реализация постраничной навигации
- Сортировка и поиск
- Работа с сервером
- Модальные окна
- Постраничный вывод
- Бесконечная лента (динамическая пагинация)
- Кастомные хуки, переиспользуемый функционал


## Теория 

==React== - это библиотека по отрисовке пользовательских интерфейсов. 
В браузере отрисовкой занимается ==ReactDOM==, а на приложениях для мобильных устройств отрисовка происходит за счёт ==React Native==.
В первую очередь, React позволяет нам создать ==SPA==.

Обычный подход - это создание ==MPA== (многостраничного приложения), когда у нас создаются отдельные HTML-документы под каждую страницу. 
Основным минусом такого подхода является то, что страницы каждый раз грузятся заново.

![](_png/Pasted%20image%2020221029190138.png)

Современный подход - это создание SPA, которое представляет из себя приложение в браузере. Мы подгружаем не вёрстку, а JS-код, который и генерирует нам страницу в браузере. 
При таком подходе вес первой страницы будет больше, зато сайт будет работать куда быстрее.

![](_png/Pasted%20image%2020221029190529.png)

Реакт использует в своей основе компонентный подход в реализации продукта - внутрь одного компонента мы вкладываем другие компоненты интерфейсов

![](_png/Pasted%20image%2020221029190817.png)

При обычной работе с ДОМ-деревом нам нужно следить за большим количеством элементов. Реакт же в свою очередь сам следить за обновлениями интерфеса в зависимости от того, что мы и куда задали в этих компонентах. То есть разработчик больше времени тратит на проработку логики и распределение данных в приложении.
Мы изменяем данные - интерфейс подстраивается под эти данные.

![](_png/Pasted%20image%2020221029191000.png)

Реакт строит внутри себя ==Дерево React-элементов== (которое обычно называют VirtualDOM, что не есть правильное определение, так как такое же дерево строится и для мобильных устройств). В браузере это дерево элементов представляет из себя облегчённую копию DOM-дерева. 

При каких-либо изменениях, которые должны попасть на дерево элементов, реакт строит второе дерево реакт-элементов, которое и принимает в себя все внесённые нами изменения. Затем происходит сравнение нынешнего дерева реакт-элементов с предыдущим. А уже только потом реакт переносит эти изменения на основное дерево элементов - DOM-дерево (то есть перерендеривает новый интерфейс).
Весь вышеописанный алгоритм называется ==Алгоритмом сравнения== (Reconciliation Algorithm)

Реакт выставляет внутри себя приоритетность рендера разных элементов на странице (более приоритетные - быстрее, менее приоритетные - медленнее), чем позволяет плавно рендерить их пользователю.

За отрисовку в браузере отвечает ReactDOM, за отрисовку на мобильных устройствах React Native.

![](_png/Pasted%20image%2020221029191450.png)

## Начало разработки. Создание проекта 

Создание проекта в данной папке 

```bash
npx create-react-app . // создание реакт приложения
npm start // запуск devServer
```

Далее можем удалить все ненужные компоненты приложения и почистить его

![](_png/Pasted%20image%2020221030134636.png)

Так выглядит почищенный минимальный код для работы React 18:

`public` > `index.html`
```HTML
<!DOCTYPE html>  
<html lang="en">  
   <head>  
      <meta charset="UTF-8" />  
      <meta  
         name="viewport"  
         content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"  
      />  
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />  
      <title>Document</title>  
   </head>  
   <body>  
      <noscript>   
Включите JavaScript в браузере, чтобы приложение  
         заработало  
      </noscript>  
      <div id="root">  
         <!-- Сюда будет монтироваться всё реакт-приложение  -->  
      </div>  
   </body>  
</html>
```

`src` > `App.js`
```JSX
import React from 'react';  
  
function App() {  
   return (  
      <div className='App'>  
         <h1>Привет</h1>  
         // Тут уже будет срабатывать функция при нажатии на кнопку
         <button onClick={() => console.log('Привет')}><button/>
      </div>  
   );  
}  
  
export default App;
```
`src`  > `index.js`
```JSX
import React from 'react';  
import ReactDOM from 'react-dom/client';  
import App from './App';  
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(<App />);
```


## Что такое JSX? 

Для написания кода в React используется препроцессор JSX, который позволяет писать HTML-подобную вёрстку внутри его функций. Справа показан пример создания элементов React через его внутренний синтаксис.

![](_png/Pasted%20image%2020221030133539.png)

Весь код, который мы пишем внутри `render` должен содержаться внутри одного `div`. Так выглядит подключение в рендер компонента и созданных элементов 

```JSX
root.render(  
   <div>  
      <h1>Это чистый код</h1>  
      <button>Кнопка</button>  
      <App />   
	</div>,  
);
```
![](_png/Pasted%20image%2020221030134841.png)

И вот так записываются элементы в классическом виде: длинными вложениями друг в друга

```JSX
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
   React.createElement('div', {},  
      React.createElement(  
         'button',  
         {  
            disabled: true,  
         },  
         'Нажми на меня',  
      ),  
   ),  
);
```
![](_png/Pasted%20image%2020221030135401.png)

Аргумент-объект `props` представляет из себя набор атрибутов, которые передаются в элемент реакта

![](_png/Pasted%20image%2020221030135625.png)

## Компонент App. Работа с состоянием. UseState 

Каждый компонент в реакте имеет собственное состояние. Чтобы менять компонент и обновлять в нём информацию, нужно указать нашему дереву, что внутри его компонента меняется состояние - то есть меняется какое-то значение его элемента внутри компонента

![](_png/Pasted%20image%2020221030140411.png)

И так выглядит само задание стейта. Мы передаём в переменную функцию `useState`, которая возвращает какое-то значение первым параметром (само состояние объекта) и функцию, которая позволяет изменять состояние вложенного в стейт значения

```JSX
const state = useState(0);  
console.log(state);
```
![](_png/Pasted%20image%2020221030140917.png)

И так как мы знаем теперь, что такое стейт, то мы можем деструктурировать получаемые значения и забрать их отдельными констанами. 

```JSX
const [count, setCount] = useState(5);  
console.log(count);  // 5
console.log(setCount); // функция изменения значения этого состояния
```
![](_png/Pasted%20image%2020221030141236.png)

И теперь конкретно тут, используя состояние объекта, мы меняем его значение

```JSX
import React, { useState } from 'react';  
  
function App() {  
	// достаём значения
   const [likes, setLikes] = useState(0);  

	// изменяем значение через функцию
   function increment() {  
	   // тут нельзя пользовать инкрементом - только прямое добавление
      setLikes(likes + 1);  
   }  
   const decrement = () => {  
	   // тут нельзя пользовать декрементом - только прямое вычитание
      setLikes(likes - 1);  
   };  
  
   return (  
      <div className='App'>  
	      // сюда передаём через '{}' само значение
         <h2>{likes}</h2>  
         // сюда просто вкладываем функцию без вызова и вызываем непосредственно при самом нажатии
         <button onClick={increment}>increment</button>  
         <hr />         
         <button onClick={decrement}>decrement</button>  
      </div>  
   );  
}  
  
export default App;
```
![](_png/Pasted%20image%2020221030141826.png)

## Управляемый инпут 

Значение в инпуте всегда совпадает с состоянием и состояние совпадает со значением в инпуте. Такие компоненты называются ==управляемыми компонентами==. В них мы всегда можем изменить значение компонента, изменив состояние.

```JSX
import React, { useState } from 'react';  
  
function App() {  
   const [value, setValue] = useState('Текст в инпуте');
  
   return (  
		<div className='App'>  
			<h1>{value}</h1>  
			<input            
				type='text' 
				// значение инпута = значение состояния 
				value={value}  
				// тут происходит связывание состояния по значению таргета, так как каждый раз при изменении значения, мы получаем значение ивента
				onChange={e => setValue(e.target.value)}  
			/>      
		</div>  
   );  
}  
  
export default App;
```
![](_png/Pasted%20image%2020221030142958.png)
![](_png/Pasted%20image%2020221030143001.png)

## Первый функциональный компонент 

Быстро создать базовый компонент можно через шорткат `rsc`

```JSX
import React from 'react';  
  
const Counter = () => {  
   return <div></div>;  
};  
  
export default Counter;
```

И вот наш компонент счётчика, который мы расположили в папке с компонентами. Желательно именовать компоненты с заглавной буквы и явно указывать препроцессор `.jsx`

```JSX
import React, { useState } from 'react';  
  
const Counter = () => {  
   const [counter, setLikes] = useState(0);  
  
   function increment() {  
      setLikes(counter + 1);  
   }  
   const decrement = () => {  
      setLikes(counter - 1);  
   };  
  
   return (  
      <div className='App'>  
         <h2>{counter}</h2>  
         <button onClick={increment}>increment</button>  
         <hr />         <button onClick={decrement}>decrement</button>  
      </div>  
   );  
};  
  
export default Counter;
```
![](_png/Pasted%20image%2020221030145208.png)

Мы можем создать сколько угодно копий компонента и они будут независимы друг от друга. Так же нужно сказать, что так как они независимы, то и располагать их можно в любом месте приложения. 

![](_png/Pasted%20image%2020221030145433.png)


## Первый классовый компонент 

При использовании классовых компонентов, стейты мы прописываем внутри конструкторов `this.state`, который хранит значения стейтов. 

```JSX
// Необходимо импортировать компонент  
import React, { Component } from 'react';  
  
// Создать расширяемый от компонента класс  
class ClassCounter extends Component {  
   // Создаём конструктор класса, который принимает по умолчанию атрибуты (пропсы)  
   constructor(props) {  
      super(props);  
      // И тут уже инициализируется стейт  
      this.state = {  
         count: 0,  
      };  
   }  

	// Используем стрелочные функции, которые перенимают контекст вызова родителя
   increment = () => {  
      this.setState({  
         count: this.state.count + 1,  
      });  
   };  
  
   decrement = () => {  
      this.setState({  
         count: this.state.count - 1,  
      });  
   };  
  
   // Через функцию render будет монтироваться наш компонент  
   render() {  
      return (  
         <div className='App'>  
            <h2>{this.state.count}</h2>  
            <button onClick={this.increment}>increment</button>  
            <hr />            
            <button onClick={this.decrement}>decrement</button>  
         </div>  
      );  
   }  
}  
  
export default ClassCounter;
```
![](_png/Pasted%20image%2020221030152117.png)

Так же мы можем использовать обычные функции, которые в качестве контекста хранят только себя. Чтобы решить проблему нужно как выше использовать либо стрелочную функцию, либо можно самостоятельно в стейте (`state`) забиндить (`bind`) область видимости

```JSX
constructor(props) {  
	super(props);  
		// И тут уже инициализируется стейт  
		this.state = {  
		count: 0,  
	};

	// Тут мы биндим контекст вызова функции
	this.increment = this.increment.bind(this);  
	this.decrement = this.decrement.bind(this);  
   }  

	// Уже эти функции не сохраняют контекст
   increment() {  
      this.setState({  
         count: this.state.count + 1,  
      });  
   };  
  
   decrement() {  
      this.setState({  
         count: this.state.count - 1,  
      });  
   };  
```

Подключение идёт ровно так же как и при использование функциональных компонентов:

```JSX
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
   <React.StrictMode>  
      <App />  
      <ClassCounter />   
	</React.StrictMode>,  
);
```

## Что такое хуки? useState, useEffect 

==Хуки== - это функции React, которые позволяют использовать состояние и другие возможности React без написания ==классов==.

Основные ==хуки==:
- `useState()`
- `useEffect()`
- `useRef()`
- `useMemo()`
- `useCallback()`
- `useContext()`

>[!info] Особенности хуков:
> - Так же можно делать свои же хуки на основе тех хуков, которые уже представлены в реакте
> - Хуки можно использовать только на верхнем уровне вложенности (нельзя использовать в циклах, условиях и так далее)

## Стили. CSS. Классы 

Вместо `class` используем `className`, так как `class` уже зарезервирован под классы.
 
`App.jsx`
```JSX
import React from 'react';  
// подключаем стили в основной файл
import './styles/App.css';  
import PostItem from './components/post-item';  
  
function App() {  
   return (  
	<div className='App'>  
         <PostItem />  
         <PostItem />         
         <PostItem />      
	</div>  
   );  
}  
  
export default App;
```

`App.css`
```CSS
* {  
   margin: 0;  
   padding: 0;  
   box-sizing: border-box;  
}  
  
#root {  
   display: flex;  
   justify-content: center;  
}  
  
.App {  
   width: 350px;  
   margin: 10px;  
}  
  
.post {  
   display: flex;  
   justify-content: space-between;  
   align-items: center;  
   padding: 15px;  
   margin-top: 15px;  
   border: 2px solid orange;  
}
```
![](_png/Pasted%20image%2020221030173857.png)

`post-item.jsx`
```JSX
import React from 'react';  
  
const PostItem = () => {  
   return (  
      <div className='post'>  
         <div className='post__content'>  
            <strong>1. C#</strong>  
            <div>  
               <p>C# - это язык программирования</p>  
            </div>  
         </div>  
         <div className='post__buttons'>  
            <button>Удалить</button>  
         </div>  
      </div>  
   );  
};  
  
export default PostItem;
```
![](_png/Pasted%20image%2020221030173908.png)

## Props. Аргументы компонента. 

Мы можем написать имя компонента `<PostItem>` в `App.jsx` и внутрь него передать атрибуты, имя которым можем задать самостоятельно. Значения этим атрибутам можем задавать самостоятельно. 
В самом компоненте можно получить значения из аргумента `props`, через который можно будет обратиться к полученным значениям и непосредственно воспользоваться полученными данными.

`App.jsx`
```JSX
import React from 'react';  
import './styles/App.css';  
import PostItem from './components/post-item';  
  
function App() {  
   return (  
	<div className='App'>  
         <PostItem  
            post={{  
               id: 1,  
               title: 'Javascript',  
               text: 'JS - это ЯП',  
            }}  
         />         
         <PostItem            
	         post={{  
               id: 2,  
               title: 'C#',  
               text: 'C# - это уже язык',  
            }}  
         />      
	</div>  
   );  
}  
  
export default App;
```

`post-item.jsx`
```JSX
import React from 'react';  
  
const PostItem = props => {  
   console.log(props); // выведет объект, переданный через пропс  
   return (  
      <div className='post'>  
         <div className='post__content'>  
            <strong>  
               {props.post.id}. {props.post.title}  
            </strong>  
            <div>  
               <p>{props.post.text}</p>  
            </div>  
         </div>  
         <div className='post__buttons'>  
            <button>Удалить</button>  
         </div>  
      </div>  
   );  
};  
  
export default PostItem;
```

![](_png/Pasted%20image%2020221030175307.png)

## Работы со списками. Преобразование массива объектов в массив React элементов 

Создать массив объектов можно так же через `useState` и в него занести все нужные данные. Далее уже можем передать весь массив объектов в рендер и проциклить его через `map()` 

Когда мы создаём списки, обязательным условием является передача ключа (атрибут `key`), который всегда должен хранить уникальное значение.
В качестве уникального значения может выступать любое значение изнутри массива. Не стоит пользоваться индексом элемента для указания уникальности значения, так как это вызовет трудности при удалении нужного нам компонента из структуры дерева

`App.jsx`
```JSX
import React, { useState } from 'react';  
import './styles/App.css';  
import PostItem from './components/post-item';  
  
function App() {  
   const [posts, setPosts] = useState([  
      { id: 1, title: 'Javascript', text: 'JS - это ЯП' },  
      { id: 2, title: 'C#', text: 'C# - это уже язык' },  
      { id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },  
   ]);  
  
   return (  
      <div className='App'>  
         {posts.map(post => (  
            <PostItem post={post} key={post.id} />  
         ))}  
      </div>  
   );  
}  
  
export default App;
```

![](_png/Pasted%20image%2020221030181415.png)

Стили для компонента или элемента можно назначить через атрибут `style={}`

```JSX
return (  
   <div className='App'>  
      <h1 style={{ textAlign: 'center' }}>Список постов</h1>  
      {posts.map(post => (  
         <PostItem post={post} key={post.id} />  
      ))}  
   </div>  
);
```

![](_png/Pasted%20image%2020221030181441.png)

Так же мы можем список ещё раз разбить на отдельные компоненты и добавить больше автономности для наших списков. Теперь мы можем добавить новый массив и одной дополнительной строчкой создавать ещё один список элементов

`posts-list.jsx` - это отдельный компонент для вывода списка 
```JSX
import React from 'react';  
import PostItem from './post-item';  
  
const PostsList = ({ posts, title }) => {  
   return (  
      <div>  
         <h1 style={{ textAlign: 'center' }}>{title}</h1>  
         {posts.map(post => (  
            <PostItem post={post} key={post.id} />  
         ))}  
      </div>  
   );  
};  
  
export default PostsList;
```

`App.jsx`
```JSX
import React, { useState } from 'react';  
import './styles/App.css';  
import PostItem from './components/post-item';  
import PostsList from './components/posts-list';  
  
function App() {  
   const [posts, setPosts] = useState([  
      { id: 1, title: 'Javascript', text: 'JS - это ЯП' },  
      { id: 2, title: 'C#', text: 'C# - это уже язык' },  
      { id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },  
   ]);  
  
   const [posts2, setPosts2] = useState([  
      { id: 1, title: 'Python', text: 'JS - это ЯП' },  
      { id: 2, title: 'Python#', text: 'C# - это уже язык' },  
      {  
         id: 3,  
         title: 'Python++',  
         text: 'C++ - это уже язык программирования',  
      },  
   ]);  
  
   return (  
      <div className='App'>  
         <PostsList posts={posts} title={'Список ЯП'} />  
         <PostsList posts={posts2} title={'Список Python'} />  
      </div>  
   );  
}  
  
export default App;
```

![](_png/Pasted%20image%2020221030182340.png)

## Управляемые и неуправляемые компоненты 

*Неуправляемый компонент*.
```JSX
// Получаем доступ к DOM-элементу через useRef()
const bodyInputRef = useRef();

// Получение значения из инпута
console.log(bodyInputRef.current.value);

// Тут объявляется доступ в элемент ДОМ-дерева
<Input
	ref={bodyInputRef}
	type='text'
	placeholder='Введите текст поста'
/>
```

*Управляемый компонент*.
`App.jsx`
```JSX
// тут храним значения из нашего инпута
const [title, setTitle] = useState('');

// выводим значение этого компонента
console.log(e.target.value);

// Это сам управляемый компонент
<Input
	value={title}
	onChange={e => setTitle(e.target.value)}
	type='text'
	placeholder='Введите имя поста'
/>
```


## Создание UI библиотеки. Первые компоненты. CSS модули. Пропс children 

В первую очередь, расположим элементы таким образом и создадим отдельный компонент-кнопку, внутрь которого и поместим модуль ==CSS==. Импортнуть можно классы через их имя `classes.имяКласса`

```JSX
// Button.jsx
import React from 'react';
import classes from './button.module.css';

const Button = props => {
	return (
		<button className={classes.myButton}>
		</button>
	);
};

export default Button;
```
`button.module.css`
```CSS
.myButton {
	padding: 5px 15px;
	font-size: 14px;
	color: teal;
	background: transparent;
	border: 1px solid teal;
	cursor: pointer;
}
```

![](_png/Pasted%20image%2020221104151705.png)

Тут уже подключаем компонент к основному файлу через вписание его в тег `<Button>`

```JSX
// App.jsx

import Button from './components/UI/button/button';
return (
		<div className='App'>
			<form>
				<input type='text' placeholder='Введите имя поста' />
				<input type='text' placeholder='Введите текст поста' />
				<Button>Создать пост</Button>
			</form>
			<PostsList posts={posts} title={'Список ЯП'} />
		</div>
	);
```

По поводу текста внутри кнопки. Изначально реакт не знает, куда и как его вставлять, поэтому нужно указать конкретно через пропс, куда попадёт текст

![](_png/Pasted%20image%2020221104151258.png)

```JSX
import React from 'react';
import classes from './button.module.css';

const Button = props => {
	return (
		<button className={classes.myButton}>
			{props.children}
		</button>
	);
};

export default Button;
```

![](_png/Pasted%20image%2020221104151428.png)

Так же, чтобы передавать все пропсы (атрибуты и их значения) в компонент кнопки, можно просто передавать деструктурированную кнопку

`button.jsx`
```JSX
// отделяем children
const Button = ({ children, ...props }) => {
	return (
		// Передаём {...props}, что позволит нам сюда вставить все пропсы, вписанные в инстанс этого компонента (в app.jsx)
		<button {...props} className={classes.myButton}>
			{/*оставляем просто children*/}
			{children}
		</button>
	);
};
```

`app.jsx`
```JSX
return (
		<div className='App'>
			<form>
				<input type='text' placeholder='Введите имя поста' />
				<input type='text' placeholder='Введите текст поста' />
				{/* исюда спокойно передаём любые атрибуты - они перенесутся дальше вниз по иерархии в сам компонент */}
				<Button disabled>Создать пост</Button>
			</form>
			<PostsList posts={posts} title={'Список ЯП'} />
		</div>
	);
```

## Предотвращаем обновление страницы при submit формы 

По умолчанию кнопка в браузере всегда имеет значение `type="submit"`. Нам нужно предотвратить такое поведение, чтобы страница не перезагружалась при нажатии кнопки.

```JSX
// Это функция, которая предотвращает перезагрузку страницы
const addNewPost = e => {
	// Предотвращаем: перезагрузку страницы / стандартное поведение кнопки
		e.preventDefault();
	};

// При клике у нас будет срабатывать функция добавления поста
<Button onClick={addNewPost}>Создать пост</Button>
```

## хук useRef. Доступ к DOM элементу. Неуправляемый компонент 

Хук `useRef` позволяет напрямую получать доступ к элементу DOM-дерева. Функция `React.forwardRef()`, в которую оборачивают компонент, позволяет прокинуть внутрь компонента свою уникальную ссылку. Данный хук позволяет нам создать неуправляемый компонент React и получать из него данные. Создавать неуправляемые компоненты - это не самая желательная практика.

`input.jsx`
```JSX
import React from 'react';
import classes from './input.module.css';

const Input = React.forwardRef((props, ref) => {
	return <input ref={ref} {...props} className={classes.myInput} />;
});

export default Input;
```

`App.jsx`
```JSX
// Получаем доступ к DOM-элементу через useRef()
const bodyInputRef = useRef();

{/* Неуправляемый компонент */}
<Input
	ref={bodyInputRef}
	type='text'
	placeholder='Введите текст поста'
/>
```

#### Реализация функционала создания постов

`App.jsx`
```JSX
function App() {
	// тут находятся сами данные и метод, который эти данные изменяет
	const [posts, setPosts] = useState([
		{ id: 1, title: 'Javascript', text: 'JS - это ЯП' },
		{ id: 2, title: 'C#', text: 'C# - это уже язык' },
		{ id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },
	]);

	const [title, setTitle] = useState('');
	const [text, setText] = useState('');

	// ! ФУНКЦИЯ Добавления нового поста
	const addNewPost = e => {
		// отключаем перезагрузку страницы при нажатии на кнопку
		e.preventDefault();

		// создаём объект, который добавим в массив
		const newPost = {
			id: Date.now(),
			title,
			text,
		};

		// Деструктурируем массив и при пересоздании в его конец добавляем новый элемент
		setPosts([...posts, newPost]);

		// Очищаем инпуты
		setTitle('');
		setText('');
	};

	return (
		<div className='App'>
			<form>
				<Input
					value={title}
					onChange={e => setTitle(e.target.value)}
					type='text'
					placeholder='Введите имя поста'
				/>
				<Input
					value={text}
					onChange={e => setText(e.target.value)}
					type='text'
					placeholder='Введите текст поста'
				/>
				{/* ! ВЕШАЕМ ФУНКЦИЮ НА КНОПКУ */}
				<Button onClick={addNewPost}>Создать пост</Button>
			</form>
			{/* ! ЗДЕСЬ ПЕРЕДАЁТСЯ МАССИВ С КНОПКОЙ */}
			<PostsList posts={posts} title={'Список ЯП'} />
		</div>
	);
}

export default App;
```

`post-list.jsx`
```JSX
const PostsList = ({ posts, title }) => {
	return (
		<div>
			<h1 style={{ textAlign: 'center' }}>{title}</h1>
			{/* добавляем индекс для поста и рендерим все посты из массива постов */}
			{posts.map((post, index) => (
				// передаём его в сам пост
				<PostItem number={index + 1} post={post} key={post.id} />
			))}
		</div>
	);
};
```

`post-item.jsx`
```JSX
const PostItem = props => {
	console.log(props);
	return (
		<div className='post'>
			<div className='post__content'>
				<strong>
					{/* И сюда передаём порядковый номер поста */}
					{props.number}. {props.post.title}
				</strong>
				<div>
					<p>{props.post.text}</p>
				</div>
			</div>
			<div className='post__buttons'>
				<button>Удалить</button>
			</div>
		</div>
	);
};
```


![](_png/Pasted%20image%2020221104182334.png)

Так же можно воспользоваться вторым вариантом создания поста, при котором у нас будет только одна точка изменения данных (не делим на `title` и `text`, а сразу имеем `post`)

```JSX
function App() {
	const [posts, setPosts] = useState([
		{ id: 1, title: 'Javascript', text: 'JS - это ЯП' },
		{ id: 2, title: 'C#', text: 'C# - это уже язык' },
		{ id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },
	]);

	// объединяем все данные в один объект
	const [post, setPost] = useState({ title: '', text: '' });

	const addNewPost = e => {
		e.preventDefault();

		// добавляем новый пост в массив через объект
		setPosts([...posts, { ...post, id: Date.now() }]);

		// очищаем через объект
		setPost({ title: '', text: '' });
	};

	return (
		<div className='App'>
			<form>
				<Input
					value={post.title}
					// Тут уже конкретно изменяем одно поле и весь объект оставляем в неизменном виде
					onChange={e => setPost({ ...post, title: e.target.value })}
					type='text'
					placeholder='Введите имя поста'
				/>
				<Input
					value={post.text}
					onChange={e => setPost({ ...post, text: e.target.value })}
					type='text'
					placeholder='Введите текст поста'
				/>
				<Button onClick={addNewPost}>Создать пост</Button>
			</form>
			<PostsList posts={posts} title={'Список ЯП'} />
		</div>
	);
}

export default App;
```

![](_png/Pasted%20image%2020221104183045.png)

## React Devtools. Инструменты разработчика React 

Для реакта существуют отдельные инструменты разработки, которые позволяют: просматривать сами компоненты, из чего и каких пропсов они образованы, менять значения пропсов и так далее

![](_png/Pasted%20image%2020221104183723.png)


## Обмен данными между компонентами. От родителя к ребенку. От ребенка к родителю. 

Реализация обмена данными выглядит примерно следующим образом:
1) Передаём данные мы между компонентами через пропсы. Пропсы всегда передаются от родителя к ребёнку - по другому никак не передать внутри компонентов
2) Чтобы передать пропсы от ребёнка к родителю, нужно реализовать функцию, которая будет родителю возвращать данные от ребёнка (снизу вверх)

#### Реализация создания поста
Сначала выводим форму наших постов в отдельный компонент. Дальше уже нам нужно прокинуть функцию `createPost` в дочерний элемент компонента `App`, а именно в `PostForm`, который и будет сообщать родительскому компоненту (`App`), что нужно будет создать новый пост.

`app.jsx` - тут находится новая функция
```JSX
function App() {
	const [posts, setPosts] = useState([
		{ id: 1, title: 'Javascript', text: 'JS - это ЯП' },
		{ id: 2, title: 'C#', text: 'C# - это уже язык' },
		{ id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },
	]);

	// Эта функция будет добавлять новый пост
	const createPost = newPost => {
		setPosts([...posts, newPost]);
	};

	return (
		<div className='App'>
			{/* и сюда мы передаём функцию, которая должна будет получать новое значение от дочернего элемента */}
			<PostForm create={createPost} />
			<PostsList posts={posts} title={'Список ЯП'} />
		</div>
	);
}
```

`post-form.jsx` - тут эта функция вызывается и сообщает родителю, что нужно вызваться и создаться
```JSX
// получаем от родителя из пропсов функцию для приёма данных
const PostForm = ({create}) => {
	const [post, setPost] = useState({ title: '', text: '' });

	const addNewPost = e => {
		e.preventDefault();

		// Конкретно этот пост нужно будет передавать снизу вверх
		const newPost = { ...post, id: Date.now() };

		// И передаём в эту функцию сам пост
		create(newPost);

		setPost({ title: '', text: '' });
	};

	return (
		<form>
			<Input
				value={post.title}
				onChange={e => setPost({ ...post, title: e.target.value })}
				type='text'
				placeholder='Введите имя поста'
			/>
			<Input
				value={post.text}
				onChange={e => setPost({ ...post, text: e.target.value })}
				type='text'
				placeholder='Введите текст поста'
			/>
			<Button onClick={addNewPost}>Создать пост</Button>
		</form>
	);
};

export default PostForm;
```


#### Реализация удаления объекта
Тут мы прокидываем вызваемую функцию в дочерние элементы вниз по иерархии.
Создаём функцию `removePost`, которую передаём вниз через `PostsList` в компонент `PostItem`, где уже и вызываем `removePost()`, который находится в в данный момент времени в `app.jsx`

`app.jsx`
```JSX
function App() {  
   const [posts, setPosts] = useState([  
      { id: 1, title: 'Javascript', text: 'JS - это ЯП' },  
      { id: 2, title: 'C#', text: 'C# - это уже язык' },  
      { id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },  
   ]);  

	// метод создания поста
   const createPost = post => {  
      setPosts([...posts, post]);  
   };  

	// Метод удаления поста
   const removePost = post => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className='App'>  
         <PostForm create={createPost} />  
         <PostsList 
	         posts={posts} 
	         title={'Список ЯП'} 
	         // прокидываем метод удаления в PostsList
	         remove={removePost} 
         />  
      </div>  
   );  
}  
  
export default App;
```

`post-list.jsx`
```JSX
// принимаем функцию удаления из app.jsx
const PostsList = ({ posts, title, remove }) => {  
   return (  
      <div>  
         <h1 style={{ textAlign: 'center' }}>{title}</h1>  
         {posts.map((post, index) => (  
            <PostItem  
               number={index + 1}  
               post={post}  
               key={post.id}  
               // прокидываем функцию удаления дальше вниз к самому элементу списка
               remove={remove}  
            />  
         ))}  
      </div>  
   );  
};
```

`post-item.jsx`
```JSX
const PostItem = props => { 
   return (  
      <div className='post'>  
         <div className='post__content'>  
            <strong>  
               {props.number}. {props.post.title}  
            </strong>  
            <div>  
               <p>{props.post.text}</p>  
            </div>  
         </div>  
         <div className='post__buttons'>  
	         {/* и уже конкретно тут вызваем функцию удаления поста */}
            <Button onClick={() => props.remove(props.post)}>  
               Удалить  
            </Button>  
         </div>  
      </div>  
   );  
};
```

## Отрисовка по условию 

Дальше нам нужно реализовать вывод надписи при условии, что в списке нет больше никаких постов. Реализовать это просто с помощью тернарных операторов.
Используем тернарный оператор для реализации вывода сообщения:

```JSX
return (  
   <div className='App'>  
      <PostForm create={createPost} />  
      {/* Если длина массива не равна 0, то... */}
      {posts.length !== 0 ? (
	      {/* ... выводим посты */}  
         <PostsList  
            posts={posts}  
            title={'Список ЯП'}  
            remove={removePost}  
         />  
      ) : ( 
	      {/* ... или выводим сообщение об их отсутствии */} 
         <h1 style={{ textAlign: 'center' }}> Посты не найдены! </h1>  
      )}   
    </div>  
);
```
![](_png/Pasted%20image%2020221105104741.png)

## Сортировка. Выпадающий список 

Реализация массива с постами осуществляется полностью на стороне компонента `App`

`app.jsx`
```JSX
function App() {  
   const [posts, setPosts] = useState([  
      { id: 1, title: 'Javascript', text: 'JS - это ЯП' },  
      { id: 2, title: 'C#', text: 'C# - это уже язык' },  
      { id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },  
   ]);  
  
   // Создаём состояние для сортировки, чтобы реализовать двустороннее связывание  
   const [selectedSort, setSelectedSort] = useState('');  
  
   // Сортируем массивы по пользовательскому запросу  
   const sortPosts = sort => {  
      console.log(sort);  
      // определяем, какая у нас будет сортировка
      setSelectedSort(sort);  
  
      // нельзя мутировать состояние напрямую, поэтому сортируем копию массива  
      setPosts([...posts].sort((a, b) => a[sort].localeCompare(b[sort])));  
   };  
  
   const createPost = post => {  
      setPosts([...posts, post]);  
   };  
  
   const removePost = post => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className='App'>  
         <PostForm create={createPost} /> 
         {/* Этот элемент отодвинет тег селекта опшенов */} 
         <hr style={{ margin: '15px 0' }} />  
         {/* Этот компонент у нас будет отвечать за реализацию опшенов для сортировки */}
         <Select  
	         // значение сортировки
            value={selectedSort}  
            // сортировка при смене типа сортировки
            onChange={sortPosts}  
            // значение по умолчанию
            defaultValue='Сортировка по'  
            // какие значения сортировки у нас будут
            options={[  
               { value: 'title', name: 'По названию' },  
               { value: 'text', name: 'По описанию' },  
            ]}  
         />         
         {posts.length ? (  
            <PostsList 
	            posts={posts} 
	            title={'Список ЯП'} 
	            remove={removePost} />  
         ) : (  
            <h1 style={{ textAlign: 'center' }}> Посты не найдены! </h1>  
         )}      
	</div>  
   );  
}  
  
export default App;
```

`select.jsx`
```JSX
const Select = ({ options, defaultValue, value, onChange }) => {  
   return (  
	   // в функции onChange будет определяться выбранный способ сортировки
      <select value={value} onChange={e => onChange(e.target.value)}>  
         {/* это опция-лейбл (дефолтное значение) */}
         <option value='' disabled>  
            {defaultValue}  
         </option>  
         {/* тут будут выводиться массив опций */}
         {options.map(option => (  
	         {/* в качестве ключа можно вставить значение */}
            <option key={option.value} value={option.value}>  
               {option.name}  
            </option>  
         ))}  
      </select>  
   );  
};  
  
export default Select;
```

![|400](_png/Pasted%20image%2020221105113442.png)![|400](_png/Pasted%20image%2020221105113444.png)

## Поиск. Фильтрация. 

Фильтрация будет осуществляться отдельной функцией 

```JSX
function App() {  
   const [posts, setPosts] = useState([  
      { id: 1, title: 'Javascript', text: 'JS - это ЯП' },  
      { id: 2, title: 'C#', text: 'C# - это уже язык' },  
      { id: 3, title: 'C++', text: 'C++ - это уже язык программирования' },  
   ]);  
  
   const [selectedSort, setSelectedSort] = useState('');  
   // выведем переменную поиска и функцию установки в отдельный стейт
   const [searchQuery, setSearchQuery] = useState('');  
  
   // Конкретно эта функция будет проверять наличие сортировки  
   function getSortedPosts() {  
      console.log('отработала getSortedPosts');  
      // и будет производить сортировку, если та существует  
      if (selectedSort) {  
         return [...posts].sort((a, b) => a[selectedSort].localeCompare(b[selectedSort]));  
      }      // или возвращать чистый массив постов  
      return posts;  
   }  
   // Саму сортировку перенесём в отдельную переменную  
   const sortedPosts = getSortedPosts();  
  
   const sortPosts = sort => {  
      console.log(sort);  
      setSelectedSort(sort);  
   };  
  
   const createPost = post => {  
      setPosts([...posts, post]);  
   };  
  
   const removePost = post => {  
      setPosts(posts.filter(p => p.id !== post.id));  
   };  
  
   return (  
      <div className='App'>  
         <PostForm create={createPost} />  
         <hr style={{ margin: '15px 0' }} />  
         <Input  
            value={searchQuery}  
            onChange={e => setSearchQuery(e.target.value)}  
            placeholder='Поиск...'  
         />         <Select  
            value={selectedSort}  
            onChange={sortPosts}  
            defaultValue='Сортировка по'  
            options={[  
               { value: 'title', name: 'По названию' },  
               { value: 'text', name: 'По описанию' },  
            ]}  
         />         {posts.length ? (  
            // Сюда передаём сразу отсортированные посты  
            <PostsList posts={sortedPosts} title={'Список ЯП'} remove={removePost} />  
         ) : (  
            <h1 style={{ textAlign: 'center' }}> Посты не найдены! </h1>  
         )}      
	</div>  
   );  
}  
  
export default App;
```

И тут мы можем заметить, что наша функция будет срабатывать и перерисовывать масиив каждый раз, как мы поменяем значение сортировки или введём новое значение в инпуте. Это жуткий удар по производительности, что не даст нормально существовать нашему приложению.

![](_png/Pasted%20image%2020221105125402.png)


## useMemo. Мемоизация. Кеширование 

Функция `useMemo()` принимает в себя коллбэк функцию, которая производит какие-то вычисления и возвращает результат этих вычислений и вторым параметром принимает в себя массив переменных и полей объектов.
Сама функция после получения результатов запоминает результат вычисления и кэширует их. Кэширование значений происходит, чтобы каждый раз не производить операцию вычисления значений - берутся просто результаты.
Кэшируются значения ровно до тех пор, пока не поменяется одна из тех зависимостей, которые мы передали вторым аргументом. Если они меняются, то хук опять пересчитывает значения в первом аргументе (колбэк функции).
Если зависимости мы не передадим, то хук просчитает значения ровно один раз и запомнит их.

![](_png/Pasted%20image%2020221122135319.png)







## Модальное окно. Переиспользуемый UI компонент 




## Анимации. React transition group 




## Декомпозиция. Кастомные хуки 




## Работа с сервером. Axios 




## Жизненный цикл компонента. useEffect 




## API. PostService 




## Индикация загрузки данных с сервера




## Компонент Loader. Анимации 




## Кастомный хук useFetching(). Обработка ошибок 




## Постраничный вывод. Пагинация (pagination) 




## Обьяснение механизма изменения состояния 




## React router. Постраничная навигация. BrowserRouter, Route, Switch, Redirect 




## Динамическая навигация. useHistory, useParams 




## Загрузка комментариев к посту  




## Улучшаем навигацию. Приватные и публичные маршруты 




## useContext. Глобальные данные. Авторизация пользователя 




## Бесконечная лента. Динамическая пагинация. useObserver