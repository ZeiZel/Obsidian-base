#React

## Таймкоды

 [41:50](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=2510s) ➝ Форма создания поста. Управляемые и неуправляемые компоненты [42:30](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=2550s) ➝ Создание UI библиотеки. Первые компоненты. CSS модули. Пропс children [50:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3000s) ➝ Предотвращаем обновление страницы при submit формы [50:45](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3045s) ➝ хук useRef. Доступ к DOM элементу. Неуправляемый компонент [57:35](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3455s) ➝ React Devtools. Инструменты разработчика React [59:15](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3555s) ➝ Обмен данными между компонентами. От родителя к ребенку. От ребенка к родителю. [01:04:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3860s) ➝ Отрисовка по условию [01:05:30](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=3930s) ➝ Сортировка. Выпадающий список [01:12:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=4320s) ➝ Поиск. Фильтрация. [01:15:10](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=4510s) ➝ useMemo. Мемоизация. Кеширование [01:23:50](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5030s) ➝ Модальное окно. Переиспользуемый UI компонент [01:30:23](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5423s) ➝ Анимации. React transition group [01:33:40](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5620s) ➝ Декомпозиция. Кастомные хуки [01:36:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5780s) ➝ Работа с сервером. Axios [01:38:40](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=5920s) ➝ Жизненный цикл компонента. useEffect [01:43:08](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6188s) ➝ API. PostService [01:44:45](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6285s) ➝ Индикация загрузки данных с сервера [01:46:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6380s) ➝ Компонент Loader. Анимации [01:49:25](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6565s) ➝ Кастомный хук useFetching(). Обработка ошибок [01:54:15](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=6855s)➝ Постраничный вывод. Пагинация (pagination) [02:06:20](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=7580s) ➝ Обьяснение механизма изменения состояния [02:12:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=7920s) ➝ React router. Постраничная навигация. BrowserRouter, Route, Switch, Redirect [02:22:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=8520s) ➝ Динамическая навигация. useHistory, useParams [02:29:30](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=8970s) ➝ Загрузка комментариев к посту [02:33:10](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=9190s) ➝ Улучшаем навигацию. Приватные и публичные маршруты [02:38:00](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=9480s) ➝ useContext. Глобальные данные. Авторизация пользователя [02:47:10](https://www.youtube.com/watch?v=GNrdg3PzpJQ&t=10030s) ➝ Бесконечная лента. Динамическая пагинация. useObserver

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

## Форма создания поста. Управляемые и неуправляемые компоненты 


`App.jsx`
```JSX
return (
		<div className='App'>
			<form>
				<input type='text' placeholder='Введите имя поста' />
				<input type='text' placeholder='Введите текст поста' />
				<button>Создать пост</button>
			</form>
			<PostsList posts={posts} title={'Список ЯП'} />
		</div>
	);
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




## хук useRef. Доступ к DOM элементу. Неуправляемый компонент 




## React Devtools. Инструменты разработчика React 




## Обмен данными между компонентами. От родителя к ребенку. От ребенка к родителю. 




## Отрисовка по условию 




## Сортировка. Выпадающий список 




## Поиск. Фильтрация. 




## useMemo. Мемоизация. Кеширование 




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