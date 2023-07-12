#React

## 003 Фундаментальные принципы Реакта

###### Все фундаментальные принципы реакта описаны на его главном экране

1) Реакт – имеет декларативный (что?) подход, то есть в нём мы описываем, какой результат нам нужен
Императивный (как?) полностью описывает как дойти до определённого результата – описаны конкретные шаги
2) Реакт основан на компонентах (элементы которые могут повторяться, но иметь разное содержимое)
3) На реакте построено множество других библиотек, которыми можно писать те же мобильные приложения или приложения для VR

###### Отличительные особенности React

1) Использует препроцессор JSX, который позволяет писать JS и вёрстку в одном месте
2) В нём есть механизмы сравнения, которые позволяют отследить только те участки веб-приложения, которые изменились и изменить только их, а не всё приложение полностью (==reconciliation algorithm==)
3) Виртуальное дерево. Реакт работает сначала с виртуальным деревом, которое он создаёт для себя. Потом уже изменения переносятся на основное дерево.
4) Оптимизация. Она вытекает из прошлого пункта и обеспечивается более компактным формированием информации в объектах виртуального ДОМ Реакта

Пример обычного компонента в ДОМ-дереве: огромное количество свойств и строк

![](_png/71b2f179e34acbef98e097ec9901f733.png)

И пример ДОМ-элемента в реакте. Он имеет только небольшое количество свойств, что позволяет снять нагрузку на память

![](_png/85f936733b4cea7a26ac676b422f0a47.png)
![](_png/9839c7a7d499f26916b49c88bb19d8ed.png)


## 004 Create React App - создаем свое приложение

Чтобы создать реакт-проект, можно воспользоваться утилитой `create-react-app`, которая загрузит сразу  шаблон

```bash
npx create-react-app first-react-proj
```

Это два основных файла в `src`. Всё остальное - это стили и тесты.

![](_png/1ffc46ce1216cd76ec2c3ebcee7bfa8d.png)

Это `index.html`, в котором и будет рендериться наша страница 

![](_png/c81648e10cfca6bbca8597ad7522766f.png)

И компиляцией jsx в нативный js занимается `Babel`

![](_png/f4c351447ad3f50711da2e5739fdecdc.png)

###### Официальная документация [Babel]([https://babeljs.io/docs/en/babel-plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx))

## 005 Работаем с JSX-препроцессором, ограничения в нем


При установке реакт-проекта, мы начинаем работать с `index.js`

```JSX
import React from 'react';  // импорт реакта
import ReactDOM from 'react-dom/client';// импорт его виртульного ДОМ
// Так же мы можем напрямую подключать в него стили
import './index.css';
// Этот импорт отвечает за то, что находится изначально в рендере
import App from './App';  
// Измеряет производительность нашего приложения
import reportWebVitals from './reportWebVitals'; 

// Получаем место, с которым будем работать
const root = ReactDOM.createRoot(document.getElementById('root'));  
// Это метод рендера информации на страницу
root.render(
	// Сюда изначально помещён блок из App.js
	<React.StrictMode>  
		<App />  
	</React.StrictMode>  
);
```

![](_png/0a12a2091275e9c071128a69504367dc.png)

И вот так вот выглядит препроцессор JSX в написании: мы пишем HTML прямо внутри JS и выводим его через рендер. *Рендер должен быть только один!*

```JSX
import React from 'react';  
import ReactDOM from 'react-dom/client';  
import './index.css';  
  
const elem = <h2>Hello, world!</h2>;  // !
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
  elem  // !
);
```

![](_png/22b08d8bf7a63ba5ea6399068a5844ed.png)

А это старый вариант записи, который работает под капотом у препроцессора JSX

```JSX
const elem = React.createElement('h2', {className: 'greetengs'}, 'Hello, world!');
```

![](_png/a0b482b029af6886478d53b98bbc59e5.png)

После выполнения метода выше, нам возвращается вот такой вот объект:

```JS
const elem = {
	type: 'h2',
	props: {
		className: 'greetings',
		children: 'Hello, World!'
	}
};
```

Так же нужно сказать, что в каждый файл, где используется препроцессор JSX,  **не нужно импортировать React - достаточно иметь импорт в основном файле**

![](_png/e72eebab6279dfb52bda2a7e88e933ef.png)

И нужно описать несколько правил написания такого многострочного HTML внутри JSX:
1) Все элементы нужно обернуть внутрь одного родителя `<div><div/>`
2) Теги можем записать как самозакрывающиеся - `<button />`, так и полные -  `<button></button> `

```JSX
const elem = (  
    <div>  
        <h2>Hello, world!</h2>  
        <div>some text</div>  
        <input type='text' />  
  
        <button>Click</button>  
        <button />  
    </div>  
);
```

Если не обернём элементы внутрь одного тега, то получим такую ошибку

![](_png/165a536ecf4fa8454467db8cf02f56a3.png)

Ну и так же JSX позволяет вставлять интерполяцию `{ }`, в которую можно вставлять переменные и выполнять функции

```JSX
const text = 'Hello, world!';  
const texth3 = <h3>Goodbye, world!</h3>;  
const elem = (  
    <div>  
        <h2>Текст: {text}</h2>  // 'Hello, world!'
        {texth3}  // 'Goodbye, world!'
        <div>some text</div>  
        <p>Посчитаем? 8+8 = {8+8}</p>  
        <input type='text' />  
  
        <button>Click</button>  
        <button />  
    </div>  
);  
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
  elem  
);
```
![](_png/2fb63b3b2eaf02183c8126af398da7dc.png)

Единственное исключение - **в эту интерполяцию нельзя вкладывать объекты**. На выходе мы получим ошибку, так как тут идёт конвертация объекта в строку - Object object. Делается конвертация для обеспечения безопасности сайта (чтобы не было вмешательств со стороны)

```JSX
const elem = (  
    <div>  
        <h2>Текст: {new Date()}</h2>  // !
        <input type='text' />  
        <button>Click</button>  
        <button />  
    </div>  
);
```

Все атрибуты тегов записываются в ==camelCase== и имеется два атрибута, которые имеют отличное написание от того, что есть в оригинальном HTML - это `className` = `class` и `htmlFor` = `for`

```JSX
const elem = (  
    <div>  
        <h2 className="text">Текст: {['234']}</h2>  
        <label htmlFor=""></label>  
        <input type='text' />
    </div>  
);
```

## 006 Элементы и компоненты


==Компонент== - это блок пользовательского интерфейса, который может иметь своё поведение. 
Это самостоятельная структура, которую мы можем переиспользовать в различных местах приложения.
В первую очередь, компонент представляет из себя функцию, которая возвращает JSX блок кода.

==Элемент== - это структурная часть компонента.

```JSX
<h2 className="text">Текст: {['234']}</h2>
```

И тут мы столкнёмся с другой особенностью этой библиотеки - мы не можем изменить уже отрендеренный элемент на странице. Для этого нужно поменять его **состояние**.

![](_png/4ca77bd26764343fd72d0ebc84b6bc74.png)

Компонент записывается в виде функции и используется при рендере в виде тега.
И вот пример использования компонентов в React. Компоненты в блоке рендера на странице записываются внутри:

`<Компонент/>` или `<Компонент> Вложение </Компонент>`

**Имя компонента всегда обязательно должно начинаться с заглавной буквы, а иначе babel воспримет и скомпилирует его как элемент!** 

```JSX
// App.js - хранит компоненты
const Header = () => {  
    return <h2>Hello, neighbour!</h2>  
}  
  
function App() {  
    return (  
        <div className="App">  
            <Header/> {/*Ничего в себя не вкладывает*/}  
            <Header>  
                {/* Может дать в себя что-нибудь вложить*/}  
            </Header>  
        </div>  
    );  
}  
  
export default App;
```

Тут мы вызваем рендер основного компонента `App` из корневого файла `index.js`.

![](_png/3a05c1ea3991d1efac82804955510d63.png)

Вложить в компонент можно любой элемент и так же можно запустить функцию

```JSX
import logo from './logo.svg';  
import './App.css';  
  
const Header = () => {  
    return <h2>Hello, neighbour!</h2>  
}  
  
const Field = () => {  
    return <input type="text" placeholder="Type here"/>  
}  
  
const Btn = () => {  
    const text = 'Log in';  
    const textFunc = () => {  
        return 'Log in';  
    }  
    const p = <p>man</p>;  
    return <button>{text} {textFunc()} {p}</button>;  
}  
  
function App() {  
    return (  
        <div className="App">  
            <Header/>  
            <Field/>  
            <Btn/>  
        </div>  
    );  
}  
  
export default App;
```

![](_png/97cbbde648efadd616a91f30a9722c9c.png)

Так же можно использовать любые выражения внутри `{}`. Конкретно тут, если пользователь залогинен, то он может выйти. Если не залогинен, то может войти. Кнопка вход/выход.

```JSX
const Btn = () => {  
    const logged = true;  
    const text = 'Log in';  
  
    return <button>{logged ? 'Log out' : text}</button>;  
}
```

Так же в атрибуты мы можем помещать переменные. 
Например, стили мы можем записать отдельно в виде объекта и передавать их внутрь компонента через переменную.

```JSX
const Field = () => {  
    const placeholder = "Type here";  
    const styledField = {  
        width: "300px",  
        height: "50px",
    }  
    return <input 
			    type="text" 
			    placeholder={placeholder} 
			    style={styledField}
		    />  
}
```

![](_png/c35d5070d29a21b1d1cfe8a3ea359e7d.png)

Так же мы можем записать компоненты  в виде классов. 

Первый вариант:
```JSX
import React from 'react';

class Field extends React.Component { }
```

Более короткий вариант через деструктуризацию:

```JSX
import { Component } from 'react';

class Field extends Component { }
```

В каждом классе компонента должен быть обязательный метод `render()`, который будет отрисовывать интерфейс.

```JSX
class Field extends Component {  
    render() {  
        const placeholder = "Type here";  
        const styledField = {  
            width: "300px",  
            height: "50px",  
        }  
        return <input 
			    type="text" 
			    placeholder={placeholder} 
			    style={styledField}
		    />   
    }  
}
```

Если мы используем функциональные компоненты, то они просто должны иметь директиву `return`, которая вернёт `JSX.Element`

```JSX
export const Field = () => {  
	const placeholder = "Type here";  
	const styledField = {  
		width: "300px",  
		height: "50px",  
	}  
	
	return (
		<input 
			type="text" 
			placeholder={placeholder} 
			style={styledField}
		/>   
    );
}
```


## 007 Строгий режим


Строгий режим внутри реакта подразумевает под собой проверку на актуальные конструкции, которые мы можем использовать. Обычно он используется для перевода проекта на новую версию реакта.
Если какой-то компонент или подход не будет соответствовать нынешней версии реакта или будет нерекоммендуемым к использованию, то реакт нас об этом предупредит.
Строгий режим работает только на dev-проекте. На выпущенном в продакшн стрикт уже не сработает, так как подразумевается, что мы всё отработали.

```JSX
import React, {StrictMode} from 'react'; // ! 
import ReactDOM from 'react-dom/client';  
import './index.css';  
import App, {Btn, Field, Header} from './App';  
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
  <StrictMode> {/* ! */}
      <App/>  
  </StrictMode>  
);
```

Так же этот режим можно использовать в отдельных компонентах, чтобы проверять только их

```JSX
function App() {  
    return (  
        <div className="App">  
            <StrictMode>  {/* ! */}
                <Header/>  
            </StrictMode>  
            <Field/>  
            <Btn/>  
        </div>  
    );  
}
```

## 009 Создание нового проекта


**CRUD** — акроним, обозначающий четыре базовые функции, используемые при работе с базами данных: создание (create), чтение (read), модификация (update), удаление (delete). Это стандартная классификация функций по манипуляции данными.
В [SQL](https://ru.wikipedia.org/wiki/SQL "SQL") этим функциям, операциям соответствуют операторы [Insert](https://ru.wikipedia.org/wiki/Insert_(SQL) "Insert (SQL)") (создание записей), [Select](https://ru.wikipedia.org/wiki/Select_(SQL) "Select (SQL)") (чтение записей), [Update](https://ru.wikipedia.org/wiki/Update_(SQL) "Update (SQL)") (редактирование записей), [Delete](https://ru.wikipedia.org/wiki/Delete_(SQL) "Delete (SQL)") (удаление записей).

Конкретно будет реализовываться проект, который позволит добавлять, удалять, изменять и читать сотрудников и как-то с этими данными взаимодействовать

И в самом начале нам нужно поделить макет на отдельные составные части - компоненты, которые будут представлять собой интерфейс приложения

![](_png/eb6cac024ff38107591888688b03c548.png)

Первым делом, нужно добавить определённые библиотеки в HTML для стилизации приложения: bootstrap и font-awesome

```HTML
<!-- Head -->

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.1/css/bootstrap.min.css"/>  
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"/>  

<title>React App</title>  
```

![](_png/ab938159472a178d75d139943aed263b.png)

Для начала определимся со структурой. В папке src храним все исходники проекта. Внутри этой папки нужно хранить два основных файла index js и css. Там же создадим папку components, которая будет хранить все реакт-файлы. Все компоненты делим по папкам, которые именуем в порядке ==cebab-case==. Основной папкой тут будет App и его JS-файл

![](_png/22992de2412be6be28ca828de973237d.png)

Сразу нужно сказать, что без разницы, будем мы писать JS или JSX расширение файла - вебпак всё соберёт

Основной файл рендера: 

`index.js`
```JSX
import React, {StrictMode} from 'react';  
import ReactDOM from 'react-dom/client';  
import './index.css';  
  
import App from './components/app/app';  
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
    <StrictMode>  
        <App/>  
    </StrictMode>  
);
```

Основной файл для компонентов, который отправляется на рендер:

`app.js`
```JSX
// Импорты компонентов
import AppInfo from '../app-info/app-info';  
import SearchPanel from '../search-panel/search-panel';  
import AppFilter from '../app-filter/app-filter';  
import EmployeesList from '../employees-list/employees-list';  
import EmployeesAddForm from '../employees-add-form/employees-add-form';  
// Импорты стилей
import './app.css';  

// Сборная рендер-функция, которая отображает все компоненты
function App() {  
    return (  
        <div className="app">  
            <AppInfo/>  
  
            <div className="search-panel">  
                <SearchPanel/>  
                <AppFilter/>  
            </div>  
  
            <EmployeesList/>  
  
            <EmployeesAddForm/>  
        </div>  
    );  
}  

// Экспорт рендер-функции
export default App;
```

Пример компонента, который хранит в себе другой компонент:

`employees-list.js`
```JSX
import EmployeesListItem from '../employees-list-item/employees-list-item';  // импорт другого компонента
import './employees-list.css';  // импорт стилей
  
const EmployeesList = () => {  
    return (  
        <ul className="app-list list-group">  
            <EmployeesListItem/>  
            <EmployeesListItem/>  
            <EmployeesListItem/>  
        </ul>  
    );  
}  

// Экспорт компонента 
export default EmployeesList;
```

Стили компонента:

`employees-list.css`
```CSS
.app-list {  
    margin-top: 30px;  
    background-color: #3D5A80;  
    border-radius: 4px;  
    box-shadow: 15px 15px 15px rgba(0, 0, 0, .15);  
    color: #fff;  
}
```

Пример полноценного компонента со стилями:

`employees-list-item.js`
```JSX
import './employees-list-item.css';  
  
const EmployeesListItem = () => {  
    return (  
        <li className="list-group-item d-flex justify-content-between">  
            <span className="list-group-item-label">  
                John Smith  
            </span>  
            <input type="text" className="list-group-item-input" defaultValue="1000$"/>  
            <div className="d-flex justify-content-center align-items-center">  
                <button type="button" className="btn-cookie btn-sm">  
                    <i className="fas fa-cookie"></i>  
                </button>  
                <button type="button" className="btn-trash btn-sm">  
                    <i className="fas fa-trash"></i>  
                </button>  
                <i className="fas fa-star"></i>  
            </div>  
        </li>  
    );  
}  
  
export default EmployeesListItem;
```

`defaultValue` - это атрибут инпута, который задаёт начальное значение по умолчанию

## 010 Свойства компонентов


Свойства компонентов (properties - пропсы) - это объект, который передаётся в компонент из вызова компонента на рендер. Сами значения пропса хранятся в атрибутах компонента.
Значения атрибутов неизменяемые - они только на чтение. Кроме как отобразить на странице и прочесть значение - больше ничего не получится.
Пропсы используются в компоненте. А менять пропсы в компонентах - нельзя.

`app.js`
```JSX
import './App.css';  
  
function WhoAmI(props) {  // !
    return (  
        <div>  
            <h1>My name is {props.name}, surname - {props.surname}</h1>  
            <a href={props.link}>My profile</a>  
        </div>  
    );  
}  
  
function App() {  
    return (  
        <div className="App">  
            <WhoAmI  // !
                name="John"  
                surname="Smith"  
                link="google.com"  
            />  
            <WhoAmI  // !
                name="Angela"  
                surname="Coose"  
                link="facebook.com"  
            />        
        </div>  
    );  
}  
  
export default App;
```

![](_png/f2a18a092ba6f9b06f58b736a1cbb1e1.png)

Однако чаще используется деструктуризация пропса

```JSX
function WhoAmI({name, surname, link}) {  
    return (  
        <div>  
            <h1>My name is {name}, surname - {surname}</h1>  
            <a href={link}>My profile</a>  
        </div>  
    );  
}
```

Ну и так же подобный вариант передачи значения - в виде объекта. Мы можем положить в атрибут объект с определёнными свойствами и эти свойства вызвать в функции

```JSX
function WhoAmI({name, surname, link}) {  
    return (  
        <div>  
					        // !
            <h1>My name is {name.firstName}, surname - {surname}</h1>  
            <a href={link}>My profile</a>  
        </div>  
    );  
}  
  
function App() {  
    return (  
        <div className="App">  
            <WhoAmI  
                name={{firstName: 'John'}}  // !
                surname="Smith"  
                link="google.com"  
            />  
            <WhoAmI  
                name={{firstName: 'Angela'}}  
                surname="Coose"  
                link="facebook.com"  
            />        
        </div>  
    );  
}
```

Однако нужно быть с этим способом аккуратнее, так как если не указать свойство объекта, то мы получим ошибку

```JSX
// name === Object - Error
<h1>My name is {name}, surname - {surname}</h1>
//...
<WhoAmI name={{firstName: 'John'}} />
```

Так же при вызове компонента мы можем вызвать функцию и такой функционал у нас тоже отработает

```JSX
function WhoAmI({name, surname, link}) {  
    return (  
        <div>  
						     // !
            <h1>My name is {name()}, surname - {surname}</h1>  
            <a href={link}>My profile</a>  
        </div>  
    );  
}  
  
function App() {  
    return (  
        <div className="App">  
					        // !
            <WhoAmI name={() => { return 'John' }} surname="Smith" link="google.com" />  
            <WhoAmI name={() => { return 'Angela' }} surname="Coose" link="facebook.com" />  
        </div>  
    );  
}
```

## 011 Практика свойств на проекте


Нам нужно вывести разных пользователей

Первый вариант:
```JSX
const EmployeesList = () => {  
    return (  
        <ul className="app-list list-group">  
            <EmployeesListItem name="Johnathan" salary={800} />  
            <EmployeesListItem name="Cloose" salary={1800} />  
            <EmployeesListItem name="Angela" salary={300} />  
        </ul>  
    );  
}
```
```JSX
const EmployeesListItem = ({name, salary}) => {  
    return (  
        <li className="list-group-item d-flex justify-content-between">  
            <span className="list-group-item-label">  
                {name}  
            </span>  
            <input type="text" className="list-group-item-input" defaultValue={`${salary}$`}/>
            // ...
```
![](_png/ec8409c6bca1e9626018ba40b1efd099.png)

Второй вариант:
Тут мы уже передаём массив объектов в компонент в качестве пропса и внутри компонента срабатывает логика генерации массива дочерних компонентов, которые представляю из себя вёрстку
```JSX
function App() {  

	// Сохраняем наших пользователей в конкретную базу
    const data = [  
        {name: "Johnathan", salary: 800},  
        {name: "Cloose", salary: 1800},  
        {name: "Angela", salary: 300},  
    ]  
  
    return (  
        <div className="app">  
            <AppInfo/>  
  
            <div className="search-panel">  
                <SearchPanel/>  
                <AppFilter/>  
            </div>  

			// Передаём базу пользователей в виде пропса
            <EmployeesList data={data}/>  
  
            <EmployeesAddForm/>  
        </div>  
    );  
}
```
```JSX
import EmployeesListItem from '../employees-list-item/employees-list-item';  
import './employees-list.css';  
  
const EmployeesList = ({data}) => {  
    // Генерируем вёрстку через перебор элементов массива
    const elements = data.map((item) => {  
        return (  
          <EmployeesListItem name={item.name} salary={item.salary}/>  
        );  
    }); 
     
	// Помещаем сюда сгенерированную вёрстку
    return (  
        <ul className="app-list list-group">  
            {elements}  
        </ul>  
    );  
}  
  
export default EmployeesList;
```

Модифицируем через spread-оператор:
Запись через `{...item}` равна `name={item.name} salary={item.salary}`
```JSX
const EmployeesList = ({data}) => {  
    const elements = data.map((item) => {  
        return (  
            <EmployeesListItem {...item} />  
        );  
    });
    //...
```

Если нам нужно модифицировать класс:
Тут уже нужно реализовать реагирование элемента на повышение зарплаты
```JSX
function App() {  
    const data = [  
										    // !
        {name: "Johnathan", salary: 800, increase: false},  
        {name: "Cloose", salary: 1800, increase: true},  
        {name: "Angela", salary: 300, increase: false},  
    ]
```
```JSX
const EmployeesListItem = ({name, salary, increase}) => {  
  
    let classNames = `list-group-item d-flex justify-content-between`;  // Стоковый класс
    
    if (increase) {  // если повышение = true
        classNames += ' increase';  // то добавляем класс стилей
    }  
    
    return (  
        <li className={classNames}> // Сюда передаём переменную
        //...
```
![](_png/b647526eecf723faed986adebef2fd71.png)

## 012 Работа со списками и алгоритм согласования


Современные веб-приложения представляют из себя динамически-меняющиеся документы, которые представляются в вебе. То есть мы можем динамически менять элементы на странице в зависимости от действий пользователя.

При изменении структуры документа в реакте, начинает работать алгоритм реконцеляции или [Reconciliation](https://reactjs.org/docs/reconciliation.html). Он представляет из себя полное перерендеривание элемента на странице, что сильно упрощает работу с изменением элементов и их обновлением. 
Этот алгоритм работает рекурсивно и обновляет как сам элемент, так и все вложенные внутри него.
Реакт сохраняет прошлую версию дерева и новую версию дерева (всё находится внутри ==Virtual DOM==). Производит сравнение внутри себя каждого элемента друг с другом и если находит отличия, то производит перерисовку элемента в реальном ДОМ-дереве. То есть перерисовка происходит ровно у тех элементов, которые изменились - остальные остаются нетронутыми. 

Первый вариант:
```JSX
return (  
    <ul className="app-list list-group">  
        {elements}  
    </ul>  
);
```
Пример изменения, при котором произойдёт перерендер:
```JSX
return (  
        <div className="app-list list-group">  
            {elements}  
        </div>  
    );  
}
```

Однако из такого подхода вытекает следующий минус: 
Если мы можем в конец этого же массива добавить новый элемент и реакт его просто дорисует, то если добавить новую строчку в начало массива, то реакт перерисует всё, так как порядок нумерации элементов в его дереве был сбит

Стоковый массив работников:
```JSX
const data = [  
   { name: "Johnathan", salary: 800, increase: false },  
   { name: "Cloose", salary: 1800, increase: true },  
   { name: "Angela", salary: 300, increase: false },  
];
```
Без полного перерендера:
```JSX
const data = [  
   { name: "Johnathan", salary: 800, increase: false },  
   { name: "Cloose", salary: 1800, increase: true },  
   { name: "Angela", salary: 300, increase: false },
   // новый тут  
   { name: "Valentine", salary: 500, increase: false }, 
];
```
С полным перерендером:
```JSX
const data = [ 
   // новый тут  
   { name: "Valentine", salary: 500, increase: false }, 
   { name: "Johnathan", salary: 800, increase: false },  
   { name: "Cloose", salary: 1800, increase: true },  
   { name: "Angela", salary: 300, increase: false },  
];
```

И чтобы реакт не перерендеривал одинаковые элементы постоянно, нужно добавить в качестве атрибута тегу уникальный `key` 

```JSX
// employers-list-item.js
//...
const EmployeesList = ({data}) => {  
	
	//--- Этот блок нужно модифицировать
    const elements = data.map((item) => {  
        return (  
            <EmployeesListItem {...item} />  
        );  
    });  
    //---
  
    return (  
        <ul className="app-list list-group">  
            {elements}  
        </ul>  
    );  
}
//...
```
Добавляем в объект деструктуризацию и передаём не весь `item`, а все его свойства по отдельности и `id` (который поместим в атрибут `key`):
```JSX
const elements = data.map((item) => {  
    const {id, ...itemProps} = item;  
    return (  
        <EmployeesListItem key={id} {...itemProps} />  
    );  
});
```
Либо подойдёт такой вариант:
```JSX
const elements = data.map((item, i) => {  
    const {...itemProps} = item;  
    return (  
        <EmployeesListItem key={i} {...itemProps} />  
    );  
});
```

И теперь в девтулзе мы можем увидеть атрибут `key`, который будет помечать для реакта повторяющийся компонент и не давать ему его перерендеривать, если тот не изменён

Важный момент: мы должны понимать, что порядок элементов у нас не поменяется, а не иначе смысла в этих атрибутах практического не будет

![](_png/d9b93fcd1964ff9a8682773f76516b38.png)


>[!info] Особенности быстрой работы реакта:
> - Реакт обновляет только те элементы интерфейса, которые действительно изменились
> - В этом ему помогает алгоритм согласования, который сравнивает старую и новую копию ДОМ-дерева
> - При работе со списком одинаковых сущностей лучше использовать атрибут `key`, чтобы реакт не перерендеривал страницу и работал ещё быстрее

## 013 Состояния компонентов


Перепишем немного приложение из первых уроков под классы с использованием компонентов:

```JSX
// Импортим сам компонент
import { Component } from 'react';  
import './App.css';  

// Экстендим класс от компонента
class WhoAmI extends Component {  

	// Так же конструктор можно тут удалить, если в нём кроме super() ничего не вызывается
    constructor(props) {  
        super(props);  
    }
      
    render() {  
        const {name, surname, link} = this.props;  
        return (  
            <div>  
                <h1>My name is {name}, surname - {surname}</h1>  
                <a href={link}>My profile</a>  
            </div>  
        );  
    };  
}  
  
function App() {  
    return (  
        <div className="App">  
            <WhoAmI name='John' surname="Smith" link="google.com" />  
            <WhoAmI name='Angela' surname="Coose" link="facebook.com" />  
        </div>  
    );  
}  
  
export default App;
```
![](_png/43419521780a85f60c4aef618056c7d9.png)

И конкретно в React мы можем прописать переменную, которая будет хранить в себе значения определённых состояний. Состояния - это динамически изменяемые объекты на странице. Мы не можем их изменять напрямую, но можем попробовать поменять особым образом

```JSX
class WhoAmI extends Component {  
    constructor(props) {  
        super(props);  
        this.state = {  
            years: 27,  
        }    
    }  
  
    render() {  
        const {name, surname, link} = this.props;  
        return (  
            <div>  
                <h1>My name is {name}, surname - {surname}, age - {this.state.years}</h1>  
                <a href={link}>My profile</a>  
            </div>  
        );  
    };  
}
```
![](_png/687197dffe9065e17f7f85adcc7e2362.png)

И в этом примере в метод рендера мы закинули кнопку, которая будет вызвать метод для смены состояния и написали сам метод для смены состояния. 

Для смены состояний обязательно нужно использовать стрелочные функции, чтобы наследовать контекст. 

Сам объект мы не мутируем - нужно передавать внутри `setState()` новый объект с нужным значением. 

`setState()` - при запуске активирует перерисовку всего компонента с новым состоянием

```JSX
class WhoAmI extends Component {  
    constructor(props) {  
        super(props);  
        this.state = {  
            years: 27,  
        }    
    }  

	// -- Метод смены состояний
    // Обязательно нужно тут использовать стрелочную функцию  
    nextYear = () => {  
        console.log('+++');  
        // Правильная смена состояния  
        this.setState({  
            // Делать через инкремент ("++") не стоит, так как это мутирует состояние объекта  
            years: this.state.years + 1,  
        });  
    }  
  
    render() {  
        const {name, surname, link} = this.props;  
        return (  
            <div>  
	            {// А тут добавили кнопку, которая вызовет метод}
                <button onClick={this.nextYear}>+++</button>  
                <h1>My name is {name}, surname - {surname}, age - {this.state.years}</h1>  
                <a href={link}>My profile</a>  
            </div>  
        );  
    };  
}
```
![](_png/e0eadecac5572a347f9516cc71f762eb.png)

>[!warning] Особенности работы хуков:
> - Функция `setState` асинхронна, поэтому когда мы её очень быстро выполняем, она может не успеть поменять состояние объекта и мы можем пропустить изменения.
> - В React есть механизмы для объединения сразу нескольких изменений состояний в одно изменение состояния. 
> - Чтобы избежать проблем с асинхронным изменением состояния, нужно использовать для изменения объекта колбэк-функцию

Тут уже нужно отметить несколько моментов. 
1) Сейчас в метод `setState` мы передаём коллбэк-функцию, которая заставит Реакт сначала выполнить текущее изменение состояния, а уже только потом изменять новое состояние. 
2) Сам объект `{}`, который передаётся через коллбэк оборачивается в скобки, чтобы не вызвать внутри `return`, поэтому получается такая конструкция: `state => ({})`
3) `setState` меняет состояние только тех свойств объекта state, которые мы в него передали. То есть свойство `text` (которое мы отображаем в качестве текста кнопки) меняться не будет и перезагружаться на странице тоже, что снижает потребление ресурсов

```JSX
constructor(props) {  
    super(props);  
    this.state = {  
        years: 27,  
        text: '+++',  
    }
}  
  
nextYear = () => {  
    console.log('+++');  
    this.setState((state) => ({  
        years: state.years + 1,  
    }));  
}  
  
render() {  
    const {name, surname, link} = this.props;  
    return (  
        <div>  
            <button onClick={this.nextYear}>{this.state.text}</button>  
            <h1>My name is {name}, surname - {surname}, age - {this.state.years}</h1>  
            <a href={link}>My profile</a>  
        </div>  
    );  
};
```
![](_png/b050294f2179aa340774448d784c5808.png)


>[!info] Итог:
> - У компонента может быть своё внутреннее состояние, которое динамически меняется
> - Состояние может быть как у классовых, так и у функциональных компонентов
> - Состояние напрямую менять ==нельзя== - только через команду `setState` 
> - `setState` и какое-либо изменение состояния - это асинхронная операция и если мы хотим сохранить точность и последовательность данных, нужно передавать коллбек-функцию
> - В команде `setState` мы можем менять только те свойства объекта, которые нам нужны - остальные останутся без изменений
 
## 014 Самостоятельное задание на работу с состояниями


>[!faq] Задание:
 > 1) Начальное значение счетчика должно передаваться через props
 > 2) INC и DEC увеличивают и уменьшают счетчик соответственно на 1. Без ограничений, но можете добавить границу в -50/50. По достижению границы ничего не происходит
 > 3) RND изменяет счетчик в случайное значение от -50 до 50. Конструкцию можете прогуглить за 20 секунд :) Не зависит от предыдущего состояния
 > 4) RESET сбрасывает счетчик в 0 или в начальное значение из пропсов. Выберите один из вариантов

Начальный код:

```HTML
<div id="app">
</div>
```

```CSS
* {
  box-sizing: border-box;
}
html, body {
  height: 100%;
}

body {
  background: rgb(131,58,180);
background: linear-gradient(90deg, rgba(131,58,180,1) 0%, rgba(253,29,29,1) 50%, rgba(252,176,69,1) 100%);
}

.app {
  width: 350px;
  height: 250px;
  background-color: #fff;
  margin: 50px auto 0 auto;
  padding: 40px;
  border-radius: 5px;
  box-shadow: 5px 5px 10px rgba(0,0,0, .2);
}

.counter {
  width: 100px;
  height: 100px;
  border-radius: 5px;
  box-shadow: 5px 5px 10px rgba(0,0,0, .2);
  background-color: #e6e6e6;
  text-align: center;
  line-height: 100px;
  font-size: 34px;
  margin: 0 auto;
}

.controls {
  display: flex;
  justify-content: space-around;
  margin-top: 40px;
}

.controls button {
  padding: 7px 12px;
  cursor: pointer;
  background-color: #6B7A8F;
  color: white;
}
```

```JSX
class App extends React.Component {
  constructor(props) {
    super(props);
  }
  
  // Используйте только стрелочную форму методов
  // Почему? Подробный ответ будет в следующем уроке
  
  render() {
    return (
      <div class="app">
        <div class="counter">10</div>
        <div class="controls">
          <button>INC</button>
          <button>DEC</button>
          <button>RND</button>
          <button>RESET</button>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App counter={0}/>, document.getElementById('app'));

```

Результат:

```JSX
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      counter: 10,
    }
  }
  
  // Используйте только стрелочную форму методов
  // Почему? Подробный ответ будет в следующем уроке

  increment = () => {
    this.setState(state => ({
      counter: state.counter + 1,
    }));
  }
  
  decrement = () => {
    this.setState(state => ({
      counter: state.counter - 1,
    }));
  }
  
  randomize = () => {
    this.setState(state => ({
      counter: Math.floor(Math.random() * (50 - (-50)) + (-50)),
    }));
  }
  
  reset = () => {
    this.setState(state => ({
      counter: 10,
    }));
  }
  
  render() {
    return (
      <div class="app">
        <div class="counter">{this.state.counter}</div>
        <div class="controls">
          <button onClick = {this.increment}>INC</button>
          <button onClick = {this.decrement}>DEC</button>
          <button onClick = {this.randomize}>RND</button>
          <button onClick = {this.reset}>RESET</button>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App counter={0}/>, document.getElementById('app'));
```

All is works!@!!
![](_png/698aac43c53d9a813566646b4477d672.png)

## 015 События в React и вспоминаем this


Сейчас нужно поговорить о том, почему мы используем коллбэк-функции вместо обычных, когда нам нужно работать в реакте. 

Причина крайне проста: методы,  которые мы вызываем в другом методе, при использовании обычных функций, не сохраняют контекст вызова. Коллбэк-функция `nextYear` сохраняет контекст вызова и обращается к классу, в котором находится метод `render`. Обычная функция не сохраняет контекст и `this` внутри неё будет = `undefined`

![](_png/ef41e26e94f9cee3496e60143aa345ba.png)

Решить проблему мы можем не только коллбэк-функцией, но и другими способами:

Первый способ: привязка контекста через `bind`  
```JSX
constructor(props) {  
    super(props);  
    this.state = {  
        years: 27,  
        text: '+++',  
        position: '',  
    }  
    // Функция привязки контекста вызова
    this.nextYear = this.nextYear.bind(this);  
}  
  
nextYear() {  
    this.setState((state) => ({  
        years: state.years + 1,  
    }));  
}
```

Второй способ: непосредственное использование классов с вложенными в них коллбэк-функциями 
```JSX
nextYear = () => {  
    console.log('+++');  
    this.setState((state) => ({  
        years: state.years + 1,  
    }));  
}
```

Третий способ: использование анонимной стрелочной функции. Тут мы вызываем функцию `nextYear` внутри стрелочной функции, которая позволяет сохранить контекст вызова.
Проблемным этот способ может быть, если мы соберёмся передавать такой вызов в качестве пропсов в другие вложенные компоненты 
```JSX
<button onClick={() => this.nextYear()}>{text}</button>
```

Если нам нужно передать в функцию значения, то мы должны воспользоваться анонимной стрелочной функцией `(e) => this.commitInputChanges(e, 'red')`, которая и позволит передать значения.

>[!info] Если нам нужно задать триггер функции для тега `input` стоит пользоваться атрибутом `onChange` 

```JSX
// Функция, которая принимает в себя значения
commitInputChanges = (e, color) => {  
    console.log(color);  
    this.setState(state => ({  
        position: e.target.value,  
    }));  
}  
  
render() {  
    const {name, surname, link} = this.props;  
    const {text, years, position} = this.state;  
    return (  
        <div>  
            <button onClick={() => this.nextYear()}>{text}</button>  
            <h1>My name is {name}, surname - {surname}, age - {years} <br/> profession - {position}</h1>  
            <a href={link}>My profile</a>  

			//Форма с данными

            <form>  
                <label htmlFor={`profession${name}`}>Введите вашу профессию</label>  
                <input type="text" id={`profession${name}`} onChange={(e) => this.commitInputChanges(e, 'red')}/>  
            </form>  
        </div>  
    );  
};
```

Так же нужно отметить, что `event` передаётся в функцию по умолчанию и нам не нужно передавать его отдельно, поэтому для вызова функции для нас доступна такая запись: `this.commitInputChanges`

```JSX
// Это метод
commitInputChanges = (e) => {  
    this.setState(state => ({  
        position: e.target.value,  
    }));  
}  

// Это в рендере
<input type="text" id={`profession${name}`} onChange={this.commitInputChanges}/>  
```

## 016 Практика состояний на проекте


Конкретно сейчас нам нужно реализовать добавление звёздочек на работников, которым назначена премия

```JSX
class EmployeesListItem extends Component {  
    constructor(props) {  
        super(props);  
        this.state = {  
            increase: false,  
            liked: false  
        }  
    }  
  
    onIncrease = () => {  
        // Получаем state.increase  
        this.setState(({increase}) => ({  
            // Возвращает свойство противоположное тому, что было до этого  
            increase: !increase,  
        }))  
    }  

	// Так же добавляем булеан проверку состояния и для установки нового класса
    setLike = () => {  
        this.setState(({liked}) => ({  
            liked: !liked,  
        }))  
    }  
  
    render() {  
        const {name, salary} = this.props;  
        
        // получаем деструктурированные значения увеличения и лайка из стейта
        const {increase, liked} = this.state;  
		
		// стандартные стили для объекта списка сотрудника
        let classNames = `list-group-item d-flex justify-content-between`;  
		
		// функция добавления класса премии сотруднику
        if (increase) {  
            classNames += ' increase';  
        }  

		// Тут добавляем класс лайка на пользователя
		if (liked) {  
            classNames += ' like';  
        }  
        
        return (  
            <li className={classNames}>  
            <span  
                className="list-group-item-label"  
                onClick={this.setLike}>  
                {name}  
            </span>  
                <input type="text" className="list-group-item-input" defaultValue={`${salary}$`}/>  
                <div className="d-flex justify-content-center align-items-center">  
                    <button type="button"  
                            className="btn-cookie btn-sm"  
                            onClick={this.onIncrease}>  
                        <i className="fas fa-cookie"></i>  
                    </button>  
  
                    <button type="button" className="btn-trash btn-sm">  
                        <i className="fas fa-trash"></i>  
                    </button>  
                    <i className="fas fa-star"></i>  
                </div>  
            </li>  
        );  
    }  
}  
  
export default EmployeesListItem;
```

Тут полетели стили, но всё работает именно так, как должно было

![](_png/6f9e35f68bffb844f4404b7aeaa859ce.png)

## 017 Работа с формами, управляемые и неуправляемые компоненты


Конкретно тут мы сделали запись значения из инпута в стейт кмопонента, тем самым сделав его управляемым.

```JSX
import { Component } from 'react';  
import './emploees-add-form.css';  
  
class EmployeesAddForm extends Component {  
    constructor(props) {  
        super(props);  
        this.state = {  
            name: '',  
            salary: ''  
        }  
    }  

	// Этот метод изменяет состояние и записывает его в state
    onValueChange = (e) => {  
        this.setState({  
            [e.target.name]: e.target.value,  
        })  
    }  
  
    render() {  
        const {name, salary} = this.state;  
  
        return (  
            <div className="app-add-form">  
                <h3>Добавьте нового сотрудника</h3>  
                <form className="add-form d-flex">  
                    <input type="text"  
                           className="form-control new-post-label"  
                           placeholder="Имя"  
                           //--
                           name="name"  // Имя элемента
                           value={name}  // Значение элемента
                           //--
                           onChange={this.onValueChange}  
                    />                    
                    <input type="number"  
                           className="form-control new-post-label"  
                           placeholder="ЗП $" 
                           //-- 
                           name="salary"  // Имя элемента
                           value={salary} // Значение элемента
                           //-- 
                           onChange={this.onValueChange}  
                    />                    
                    <button className="btn btn-outline-light" type="submit">Добавить</button>  
                </form>  
            </div>  
        );  
    }  
}  
  
export default EmployeesAddForm;
```

![](_png/670ce42c4cef63880ef52ab7f87c295c.png)

>[!note] Если метод связан с определёнными действиями пользователя, то наименование стоит начинать с ==on== (например `onValueChange` - см. пример выше в коде)

Конкретно, если в атрибуте стоит  `value={определённое_значение}`, то мы всегда будем иметь актуальный стейт. То есть значение `value` формы инпута будет контролироваться реактом. Сам такой элемент будет называться ==управляемым компонентом/элементом==.

Главным преймуществом такого подхода заключается в том, что стейт синхронизирован с интерфейсом, что позволяет интерфейсу мгновенно реагировать на все изменения

```JSX
<input type="text"  
	   className="form-control new-post-label"  
	   placeholder="Имя"  
	   name="name"  
	   value={name}  
	   onChange={this.onValueChange}  
/> 
```

У ==неуправляемых компонентов/элементов== значения полей хранятся прямо в DOM-дереве
Неуправляемые компоненты менее предпочтительны, так как их функционал куда беднее, чем у управляемых.
Единственный компонент, который всегда будет неуправляемым - это инпут `typefile`, когда пользователь должен загрузить в него какой-то файл.

## 018 Иммутабельность состояния и собственные события

>[!info] Что такое иммутабельность?
>Иммутабельность - это свойство объекта, при котором его нельзя изменить - как он был создан, таким и остаётся.
> - Такой подход сохраняется и в React, потому как обычно все наши объекты неизменны. Чтобы поменять отображение объекта на странице, нужно создать его копию и изменить уже её.
> - Такой подход очень сильно облегчает работу программиста и он обеспечивает работу reconciliation-алгоритма  
> - Однако немного падает производительность за счёт того, что нужно сохранять прошлое состояние объекта

#деструктуризация
Тут нужно сказать, что  при таком способе записи `{...old}` все последующие свойства, которые будут после деструктуризации, будут перезатираться. Запись в блоке кода говорит, что свойство `increase` будет иметь обратное значение тому, что передали через `old`

```JSX
// формируем массив из значения по индексу  
const old = data[index];  
// формируем объект из массива  
const newItem = {...old, increase: !old.increase};
```

#findIndex
Так же метод `findIndex` позволяет нам найти одно определённое значение из массива по нужному нам параметру. Этот метод принимает коллбэк-функцию с условием внутри

```JSX
onToggleIncrease = (id) => {  
   this.setState(({data}) => {  
      // Ищем значение массива по id  
      const index = data.findIndex(elem => elem.id === id);
   })  
}
```

Нам нужно реализовать метод для удаления сотрудников из списка сотрудников. Чтобы удалять сотрудников, нам нужно удалять их физически: из данных (например, в БД).

В первую очередь нам нужно создать сам метод для удаления:

```JSX
function App() {  
   const data = [  
      { name: 'Johnathan', salary: 800, increase: false, id: 1 },  
      { name: "Cloose", salary: 1800, increase: true, id: 2 },  
      { name: "Angela", salary: 300, increase: false, id: 3 },  
   ];  
  
   return (  
      <div className="app">  
         <AppInfo />  
  
         <div className="search-panel">  
            <SearchPanel />  
            <AppFilter />  
         </div>  
  
         <EmployeesList  
            data={data}  
            // Сам метод удаления будет представлять из себя функцию, которая будет возвращать нам id пользователя в консоль (определяем элемент для удаления)
            onDelete={id => console.log(id)}  
         />  
         <EmployeesAddForm />  
      </div>  
   );  
}
```

В самого работника нам нужно поместить срабатывание метода onDeleted, который будет вызывать его при клике

```JSX
render() {  
	// Добавляем сюда метод onDeleted
    const {name, salary, onDeleted} = this.props;  
    const {increase, liked} = this.state;  
  
    let classNames = `list-group-item d-flex justify-content-between`;  
  
    if (increase) {  
        classNames += ' increase';  
    }  
    if (liked) {  
        classNames += ' like';  
    }  
    return (  
        <li className={classNames}>  
        <span  
            className="list-group-item-label"  
            onClick={this.setLike}>  
            {name}  
        </span>  
            <input type="text" className="list-group-item-input" defaultValue={`${salary}$`}/>  
            <div className="d-flex justify-content-center align-items-center">  
                <button type="button"  
                        className="btn-cookie btn-sm"  
                        onClick={this.onIncrease}>  
                    <i className="fas fa-cookie"></i>  
                </button>  
  
                <button type="button"  
                        className="btn-trash btn-sm"  
                        // И вызваем onDeleted при клике на этот значок
                        onClick={onDeleted}  
                >                    
                <i className="fas fa-trash"></i>  
                </button>  
                <i className="fas fa-star"></i>  
            </div>  
        </li>  
    );  
}
```

И в самом списке работников мы завершаем функционал идентификации определённого элемента списка

```JSX
const EmployeesList = ({data, onDelete}) => {  
    const elements = data.map((item) => {  
        const {id, ...itemProps} = item;  
        return (  
            <EmployeesListItem  
                key={id} {...itemProps}  
                // Сюда в Delete мы уже спокойно передаём id нашего элемента, чтобы обращаться к нему
                onDeleted={() => onDelete(id)}  
            />  
        );  
    });  
  
    return (  
        <ul className="app-list list-group">  
            {elements}  
        </ul>  
    );  
}
```

И теперь при клике на корзинку, мы можем увидеть индекс работника в списке

![](_png/f952024abadb3891a5225b0339d6b27f.png)

Дальше нам нужно реализовать непосредственно работу с данными. Самый правильный способ работы с данными - это менять их через стейт.

```JSX
class App extends Component {  
   constructor(props) {  
      super(props);  
      this.state = {  
         data: [  
            {name: 'Johnathan', salary: 800, increase: false, id: 1},  
            {name: "Cloose", salary: 1800, increase: true, id: 2},  
            {name: "Angela", salary: 300, increase: false, id: 3},  
         ],  
      }   };  
  
   deleteItem = (id) => {  
      this.setState(({data}) => {  
         const index = data.findIndex((elem) => {  
            return elem.id === id;  
         });  
  
         console.log(index);  
  
         return index;  
      });  
   }  
  
   render() {  
      return (  
         <div className="app">  
            <AppInfo />  
  
            <div className="search-panel">  
               <SearchPanel />  
               <AppFilter />  
            </div>  
  
            <EmployeesList  
               data={this.state.data}  
               onDelete={this.deleteItem}  
            />  
            <EmployeesAddForm />  
         </div>  
      );  
   }  
}
```

![](_png/96c7c441df7bc82f3c485a24ed5d2c0a.png)

Далее нам нужно реализовать само удаление элемента со страницы. Сразу нужно повториться: ==менять напрямую стейт нельзя==

Это пример неправильной реализации, так как тут меняется стейт напрямую

```JSX
deleteItem = (id) => {  
   this.setState(({data}) => {  
      const index = data.findIndex(elem => elem.id === id);  

	  // Напрямую изменять стейт вот так - нельзя!
      data.splice(index, 1);  
  
      return {  
         data: data
      };  
   });  
}
```

Уже подход представленный ниже является ==верным==, так как тут не модифицируется наш стейт, а создаётся новый без удаляемого элемента 

```JSX
deleteItem = (id) => {  
   this.setState(({data}) => {  
      const index = data.findIndex(elem => elem.id === id);  
  
      // Получаем все элементы от начала массива до того, который получать нам не нужно  
      const before = data.slice(0, index);  
      // Получаем все элементы массива после искомого  
      const after = data.slice(index + 1);  
      // Объединяем оба массива в один (теперь тут нет удалённого элемента)  
      const newArr = [...before, ...after];  
  
      return {  
         data: newArr  
      };  
   });  
}
```

![](_png/b7d25f011f50449134c1c15166f61f78.png)

Либо можно воспользоваться более коротким вариантом:
Мы сформируем новый массив, в котором будут все элементы, идентификатор которых не равен тому, что передали аргументом в функцию

```JSX
deleteItem = (id) => {  
   this.setState(({data}) => {    
      return {  
         data: data.filter(elem => elem.id !== id)  
      };  
   });  
}
```

**Практика. Добавление нового сотрудника.**

`App.js`
```JSX
constructor(props) {  
   super(props);  
   this.state = {  
      data: [  
	    {name: 'Johnathan', salary: 800, increase: false, liked: true, id: 1},  
         {name: "Cloose", salary: 1800, increase: true, liked: false, id: 2},  
         {name: "Angela", salary: 300, increase: false, liked: false, id: 3},  
      ],  
      // Добавляем новое свойство в стейт, у которого будет последнее максимальное значение
      maxId: 4  
   }  
};

// Это метод добавления нового пользователя
addItem = (name, salary) => {  
   // Создаём объект со значениями нового пользователя
   const newItem = {  
      name: name,  
      salary: salary,  
      increase: false,  
      id: this.maxId++  
   }  
   // Тут мы меняем стейт и в новый массив добавляем нового пользователя
   this.setState(({data}) => {  
      const newArr = [...data, newItem];  
      return {  
         data: newArr  
      }  
   });  
}  
  
render() {  
   return (  
      <div className="app">  
         <AppInfo />  
  
         <div className="search-panel">  
            <SearchPanel />  
            <AppFilter />  
         </div>  
  
         <EmployeesList  
            // Это и есть пропсы  
            data={this.state.data}  
            onDelete={this.deleteItem}  
            // А это те методы, которые передадутся в качестве props  
            onToggleIncrease={this.onToggleIncrease}  
            onToggleRise={this.onToggleRise}  
         />  

         <EmployeesAddForm  
	         // Тут уже в качестве пропсов передаём метод из App.js в EmployeesAddForm
            onAdd={this.addItem}  
         />  
      </div>  
   );
```

`employees-add-form.js`
```JSX
class EmployeesAddForm extends Component {  
    constructor(props) {  
        super(props);  
        this.state = {  
            name: '',  
            salary: ''  
        }  
    }  
  
    onValueChange = (e) => {  
        this.setState({  
            [e.target.name]: e.target.value,  
        })  
    }  

	// ! Это сам метод подтверждения добавления нового пользователя
    onSubmit = (e) => {  
	    // Всегда сбрасываем стандартное поведение браузера при ивентах
        e.preventDefault(); 

		// если длина имени меньше 3 или нет зарплаты, то отменяем функцию
        if (this.state.name.length < 3 || !this.state.salary) return;  

		// 
        this.props.onAdd(this.state.name, this.state.salary);  

		// устанавливаем состояние
        this.setState({  
            name: '',  
            salary: ''  
        })  
    }  
  
    render() {  
        const {name, salary} = this.state;  
  
        return (  
            <div className="app-add-form">  
                <h3>Добавьте нового сотрудника</h3>  
                <form className="add-form d-flex"  
	// Запускаем срабатывание метода при нажатии на кнопку, которая имеет тип "submit"
                      onSubmit = {this.onSubmit}  
                >  
                    <input type="text"  
                           className="form-control new-post-label"  
                           placeholder="Имя"  
                           name="name"  
                           value={name}  
                           onChange={this.onValueChange}  
                    />                    
                    <input type="number"  
                           className="form-control new-post-label"  
                           placeholder="ЗП $"  
                           name="salary"  
                           value={salary}  
                           onChange={this.onValueChange}  
                    />                    
                    <button  
                        className="btn btn-outline-light" 
                    // добавляем кнопке тип "submit", чтобы реагировала форма при нажатии 
                        type="submit"  
                    >Добавить</button>  
                </form>  
            </div>  
        );  
    }  
}
```

![](_png/a23bc4c17a61a2270de708581591ad4c.png)

>[!note] Для чуть большего ознакомления с иммутабельными объектами, стоит ознакомиться с [этой статьёй](https://habr.com/ru/company/developersoft/blog/302118/)

## 019 Практика. Подъём состояния


>[!info] Подъём состояния (statelifting) - это поднятие внутреннего состояния одного компонента выше по иерархии
> - В нынешнем варианте, компонент `App.js` является источником истины, так как данные находятся в нём
> - Так же данные могут храниться в отдельной сущности или располагаться внутри компонентов

Покажем пример проброса методов вниз:

Создаём методы `onToggleIncrease` и `onToggleRise`, которые в качестве пропсов передадим внутрь `EmployeesList`, откуда мы и сможем получить к ним доступ

`App.js`
```JSX
class App extends Component {  
   constructor(props) {  
      super(props);  
      this.state = {  
         data: [  
            {name: 'Johnathan', salary: 800, increase: false, id: 1},  
            {name: "Cloose", salary: 1800, increase: true, id: 2},  
            {name: "Angela", salary: 300, increase: false, id: 3},  
         ],  
      }   };  
  
   // Первый метод, который хотим передать вниз  
   onToggleIncrease = (id) => {  
      console.log(`Increase this ${id}`);  
   }  
  
   // Второй метод, который хотим передать вниз  
   onToggleRise = (id) => {  
      console.log(`Rise this ${id}`);  
   }  
  
   deleteItem = (id) => {  
      this.setState(({data}) => {  
         return { data: data.filter(elem => elem.id !== id) };  
      });  
   }  
  
   render() {  
      return (  
         <div className="app">  
            <AppInfo />  
  
            <div className="search-panel">  
               <SearchPanel />  
               <AppFilter />  
            </div>  
  
            <EmployeesList  
               // Это и есть пропсы  
               data={this.state.data}  
               onDelete={this.deleteItem}  
               // А это те методы, которые передадутся в качестве props  
               onToggleIncrease={this.onToggleIncrease}  
               onToggleRise={this.onToggleRise}  
            />  
            <EmployeesAddForm />  
         </div>  
      );  
   }  
}
```

`EmployeesList`
```JSX
// Передаём в параметры функции пропсы, которые мы передали в тег <EmployeesList> в App.js  
const EmployeesList = ({data, onDelete, onToggleIncrease, onToggleRise}) => {  
    const elements = data.map((item) => {  
        const {id, ...itemProps} = item;  
        return (  
            <EmployeesListItem  
        // Тут мы передали data, который вложили через data={this.state.data} в App.js  
                key={id} {...itemProps}  
                // Тут мы запускаем метод для удаления, который вложили в App.js (onDelete={this.deleteItem})  
                onDeleted={() => onDelete(id)}  
                // Тут запускаем методы, которые вложили так же в App.js  
                onToggleIncrease={() => onToggleIncrease(id)}  
                onToggleRise={() => onToggleRise(id)}  
            />  
        );  
    });  
  
    return (  
        <ul className="app-list list-group">  
            {elements}  
        </ul>  
    );  
}
```

`employees-list-item` - этот компонент переведём в функцию и закинем все данные пропсов из нашего компонента выше сюда в этот компонент

```JSX
const EmployeesListItem = (props) => {  
    // Тут получаем пропсы из EmployeesList, которые являются атрибутами тега  
    const {name, salary, onDeleted, onToggleIncrease, onToggleRise, increase, liked} = props;  
  
    let classNames = `list-group-item d-flex justify-content-between`;  
  
    if (increase) {  
        classNames += ' increase';  
    }  
  
    if (liked) {  
        classNames += ' like';  
    }  
  
    return (  
        <li className={classNames}>  
        <span  
            className="list-group-item-label"  
            // Заменяем метод setLike методом, который передали из App.js  
            onClick={onToggleRise}>  
            {name}  
        </span>  
            <input type="text" className="list-group-item-input" defaultValue={`${salary}$`}/>  
            <div className="d-flex justify-content-center align-items-center">  
                <button type="button"  
                        className="btn-cookie btn-sm"  
                        // Сюда вставляем метод, который вложили в EmployeesList  
                        onClick={onToggleIncrease}>  
                    <i className="fas fa-cookie"></i>  
                </button>  
  
                <button type="button"  
                        className="btn-trash btn-sm"  
                        onClick={onDeleted}  
                >  
                    <i className="fas fa-trash"></i>  
                </button>  
                <i className="fas fa-star"></i>  
            </div>  
        </li>  
    );  
}
```

Теперь была восстановлена работа печеньки на повышение З/П
Это более сложный и объёмный, но зато более понятный способ создания нового массива

`App.js`
```JSX
// Первый метод, который хотим передать вниз  
onToggleIncrease = (id) => {  
   this.setState(({data}) => {  
      // Ищем значение массива по id  
      const index = data.findIndex(elem => elem.id === id);  
  
      // формируем массив из значения по индексу  
      const old = data[index];  
      // формируем объект из массива  
      const newItem = {...old, increase: !old.increase};  
      // Тут уже формируем новый массив с вложенным новым объектом  
      const newArr = [...data.slice(0, index), newItem, ...data.slice(index+1)];  
  
      return {  
         data: newArr  
      }  
   })  
}
```

![](_png/eae4f3b61c30f24d437a1c897ff3ffb9.png)

А вот второй более простой вариант:

`App.js`
```JSX
onToggleIncrease = (id) => {
   this.setState(({data}) => ({  
      data: data.map(item => {  
         // Если id айтема равен id искомого объекта, то  
         if (item.id === id) {  
            // ... мы возвращаем новый объект со свойствами, которые было до и инвертированный increase  
            return {...item, increase: !item.increase}  
         }  
         return item;  
      })  
   }))  
}
```

#tips
Эти обе записи идентичны и вернут один и тот же результат

```JSX
// 1
const incresed = this.state.data.filter(item => item.increase === true).length;

//2
const incresed = this.state.data.filter(item => item.increase).length;
```

Дальше нам нужно реализовать блок подсчёта сотрудников. Для этого нам нужно подсчитать количество записей в массиве. Количество сотрудников с премией можно подсчитать через фильтр

`App.js`
```JSX
//...
render() {  
   // Считаем количество сотрудников  
   const employees = this.state.data.length;  
   // Количество сотрудников, идущих на повышение  
   const incresed = this.state.data.filter(item => item.increase === true).length;  
  
   return (  
      <div className="app">  
         <AppInfo
	         // Передаём props в AppInfo    
			employees={employees}  
            incresed={incresed}  
         />
	{/* CODE ...*/}
```

Это уже сам компонент с общей информацией по сотрудникам (шапка)

`app-info.js`
```JSX
// Принимаем props переданные в App.js
const AppInfo = ({employees, increased}) => {  
    return (  
        <div className="app-info">  
            <h1> Учёт сотрудников в компании</h1>  
            // Вставляем значения
            <h2>Общее число сотрудников: {employees}</h2>  
            <h2>Премию получат: {increased}</h2>  
        </div>  
    );  
}
```

Второй метод `onToggleRise` работает почти идентично тому, что был чуть выше. Нам стоит заняться оптимизацией этих методов, так как внутри них отличается только 2 слова.

`App.js`
```JSX
// Первый метод, который хотим передать вниз  
onToggleIncrease = (id) => {  
   this.setState(({data}) => ({  
      data: data.map(item => {  
         // Если id айтема равен id искомого объекта, то  
         if (item.id === id) {  
            // ... мы возвращаем новый объект со свойствами, которые было до и инвертированный increase  
            return {...item, increase: !item.increase}  
         }  
         return item;  
      })  
   }))  
}  
  
// Второй метод, который хотим передать вниз  
onToggleRise = (id) => {  
   this.setState(({data}) => ({  
      data: data.map(item => {  
         if (item.id === id) {  
            return {...item, liked: !item.liked}  
         }  
         return item;  
      })  
   }))  
}
```

Объединяем метод в один, используя подстановку через props  и передаём в `EmployeesList` этот метод

`App.js`
```JSX
onToggleProp = (id, prop) => {  
   this.setState(({data}) => ({  
      data: data.map(item => {  
         // Если id айтема равен id искомого объекта, то  
         if (item.id === id) {  
            // ... мы возвращаем новый объект со свойствами, которые было до и инвертированный increase  
            return {...item, [prop]: !item[prop]}  
         }  
         return item;  
      })  
   }))  
}

// Внутри render
<EmployeesList  
   // Это и есть пропсы  
   data={this.state.data}  
   onDelete={this.deleteItem}  
   // это объединённый метод переключения нашего списка
   onToggleProp={this.onToggleProp}  
/>
```

Дальше в списке сотрудников нам нужно дата-атрибуты, которые в реакте записываются через `data-toggle`

`employees-list-item`
```JSX
const EmployeesListItem = (props) => {  
    // Меняем на onToggleProp 
    const {name, salary, onDeleted, onToggleProp, increase, liked} = props;  
  
    let classNames = `list-group-item d-flex justify-content-between`;  
  
    if (increase) {  
        classNames += ' increase';  
    }  
  
    if (liked) {  
        classNames += ' like';  
    }  
  
    return (  
        <li className={classNames}>  
        <span  
            className="list-group-item-label"  
            // Меняем метод в в onClick
            onClick={onToggleProp}  
            // Этот атрибут должен будет попасть вторым аргументом в onToggleProp  
            data-toggle="liked"  
        >            
	        {name}  
        </span>  
            <input type="text" className="list-group-item-input" defaultValue={`${salary}$`}/>  
            <div className="d-flex justify-content-center align-items-center">  
                <button type="button"  
                        className="btn-cookie btn-sm"  
                        // Меняем методв в onClick
                        onClick={onToggleProp}  
                        // И этот атрибут должен будет попасть вторым аргументом в onToggleProp  
                        data-toggle="increase"  
                >
			
			{/* CODE ...*/}
```

Тут уже нам нужно передать как сам метод, так и атрибут. Атрибут можно передать через ивент, передав в него от текущего таргета атрибут с именем `'data-toggle'`

`employees-list-item.js`
```JSX
//...
const EmployeesList = ({data, onDelete, onToggleProp}) => {  
    const elements = data.map((item) => {  
        const {id, ...itemProps} = item;  
        return (  
            <EmployeesListItem 
                key={id} {...itemProps}  
                onDeleted={() => onDelete(id)}  
                // Тут 
                onToggleProp={(e) => onToggleProp(id, e.currentTarget.getAttribute('data-toggle'))}  
            />  
        );  
    });
//...
```

## 020 React-фрагменты


Очень часто при работе с вёрсткой нам может понадобиться удалить лишний `div`, в который по правилам ==JSX== мы должны обернуть все элементы возвращаемые из `return`.
Помешать может лишний див, когда нам нужно использовать компонент при вёрстке как `flex-box` компонентов, так и `grid` 

Для исправления этой ситуации используют ==React-фрагменты==

![](_png/e38fca953c573ccbb939cb4815574a0d.png)

Первый способ создания и использования фрагмента подразумевает под собой его импорт и использование в качестве тега:

```JSX
// 1 - импортируем Fragment
import { Component, Fragment } from 'react';

//2 - оборачиваем во Fragment
render() {  
    const {name, surname, link} = this.props;  
    const {text, years, position} = this.state;  
    return (  
	    // И оборачиваем не в <div>, а во <Fragment>
        <Fragment>  
            <button onClick={() => this.nextYear()}>{text}</button>  
            <h1>My name is {name}, surname - {surname}, age - {years} <br/> profession - {position}</h1>  
            <a href={link}>My profile</a>  
            <form>  
                <label htmlFor={`profession${name}`}>Введите вашу профессию</label>  
                <input type="text" id={`profession${name}`} onChange={(e) => this.commitInputChanges(e, 'red')}/>  
            </form>  
        </Fragment>  
    );  
};
```

И теперь можно увидеть, что у нас нет того лишнего дива

![](_png/29fbb6ec87141bc08a0441fc181a450a.png)

Второй способ подразумевает под собой просто использование пустых скобок без импортов фрагмента 

```JSX
render() {  
    const {name, surname, link} = this.props;  
    const {text, years, position} = this.state;  
    return ( 
	    // Пустые скобки 
        <>  
            <button onClick={() => this.nextYear()}>{text}</button>  
            <h1>My name is {name}, surname - {surname}, age - {years} <br/> profession - {position}</h1>  
            <a href={link}>My profile</a>  
            <form>  
                <label htmlFor={`profession${name}`}>Введите вашу профессию</label>  
                <input type="text" id={`profession${name}`} onChange={(e) => this.commitInputChanges(e, 'red')}/>  
            </form>  
        </>  
    );  
};
```

>[!note] Первый способ используется обычно только тогда, когда нам нужно в обёртку передавать какие-либо атрибуты - например, индекс элемента списка 

## 021 Практика. Реализуем поиск и фильтры



###### Реализация поиска

`app.js`
```JSX
class App extends Component {  
   constructor(props) {  
      super(props);  
      this.state = {  
         data: [  
            {name: 'Johnathan', salary: 800, increase: false, liked: true, id: 1},  
            {name: "Cloose", salary: 1800, increase: true, liked: false, id: 2},  
            {name: "Angela", salary: 300, increase: false, liked: false, id: 3},  
         ],  
         maxId: 4,  
         term: '', // Строчка, по которой будет происходить поиск сотрудника  
      }  
   };  
  
   onToggleProp = (id, prop) => {  
      this.setState(({data}) => ({  
         data: data.map(item => {  
            if (item.id === id) {  
               return {...item, [prop]: !item[prop]}  
            }  
            return item;  
         })  
      }))  
   }  
  
   deleteItem = (id) => {  
      this.setState(({data}) => {  
         return { data: data.filter(elem => elem.id !== id) };  
      });  
   }  
  
   addItem = (name, salary) => {  
      const newItem = {  
         name: name,  
         salary: salary,  
         increase: false,  
         liked: false,  
         id: this.maxId++  
      }  
      this.setState(({data}) => {  
         const newArr = [...data, newItem];  
         return {  
            data: newArr  
         }  
      });  
   }  
  
   searchEmployee = (items, term) => {  
      // Если ничего не введено в поиск, то показываем все объекты  
      if (term.length === 0) return items;  
  
      return items.filter(item => {  
         // indexOf() - поиск подстроки  
         // Возвращаем только те элементы, где присутствует term         
         return item.name.indexOf(term) > -1;  
      });  
   }  
  
   onUpdateSearch = (term) => {  
      // сокращённая замена записи {term: term}  
      this.setState({term});  
   }  
  
   render() {  

      // Данные для реализации фильтрации на странице  
      const {term, data} = this.state;  
      // Сразу передаём только те данные, которые подходят по поиску  
      const visibleData = this.searchEmployee(data, term);  

      // Считаем количество сотрудников  
      const employees = this.state.data.length;  
      // Количество сотрудников, идущих на повышение  
      const increased = this.state.data.filter(item => item.increase === true).length;  
  
      return (  
         <div className="app">  
            <AppInfo  
               employees={employees}  
               increased={increased}  
            />  
  
            <div className="search-panel">  
               <SearchPanel onUpdateSearch={this.onUpdateSearch}/>  
               <AppFilter />  
            </div>  
  
            <EmployeesList  
               // Сюда передаём отфильтрованные данные               
               data={visibleData}  
               onDelete={this.deleteItem}  
               onToggleProp={this.onToggleProp}  
            />  
            <EmployeesAddForm  
               onAdd={this.addItem}  
            />  
         </div>  
      );  
   }  
}
```

`search-panel.js`
```JSX
import {Component} from "react";  
import './search-panel.css';  
  
class SearchPanel extends Component {  
    constructor(props) {  
        super(props);  
        this.state = {  
            term: ''  
        }  
    }  
  
    // Установка локального состояния term  
    onUpdateSearch = (e) => {  
        const term = e.target.value;  
        this.setState({term});  
        this.props.onUpdateSearch(term);  
    }  
  
    render() {  
        return (  
            <input type="text"  
                   className="form-control search-input"  
                   placeholder="Найти сотрудника"  
                   // передаём значение и при изменении вызываем функцию
                   value={this.state.term}  
                   onChange={this.onUpdateSearch}  
            />  
        );  
    }  
}  
  
export default SearchPanel;
```

![](_png/ac7b28bad01c83d1819b5e84ab2e0181.png)

###### Реализация фильтров на странице

`App.js`
```JSX
import {Component} from "react";  
  
import AppInfo from "../app-info/app-info";  
import SearchPanel from "../search-panel/search-panel";  
import AppFilter from "../app-filter/app-filter";  
import EmployeesList from "../employees-list/employees-list";  
import EmployeesAddForm from "../employees-add-form/employees-add-form";  
  
import "./app.css";  
  
class App extends Component {  
   constructor(props) {  
      super(props);  
      this.state = {  
         data: [  
            {name: 'Johnathan', salary: 800, increase: false, liked: true, id: 1},  
            {name: "Cloose", salary: 1800, increase: true, liked: false, id: 2},  
            {name: "Angela", salary: 300, increase: false, liked: false, id: 3},  
         ],  
         maxId: 4,  
         term: '', // Строчка, по которой будет происходить поиск сотрудника  
         filter: 'all' // Сюда запишем выбранный фильтр  
      }  
   };  
  
   // Объединённый метод, который хотим передать вниз  
   onToggleProp = (id, prop) => {  
      this.setState(({data}) => ({  
         data: data.map(item => {  
            // Если id айтема равен id искомого объекта, то  
            if (item.id === id) {  
               // ... мы возвращаем новый объект со свойствами, которые было до и инвертированный increase  
               return {...item, [prop]: !item[prop]}  
            }  
            return item;  
         })  
      }))  
   }  
  
   deleteItem = (id) => {  
      this.setState(({data}) => {  
         return { data: data.filter(elem => elem.id !== id) };  
      });  
   }  
  
   addItem = (name, salary) => {  
      const newItem = {  
         name: name,  
         salary: salary,  
         increase: false,  
         liked: false,  
         id: this.maxId++  
      }  
      this.setState(({data}) => {  
         const newArr = [...data, newItem];  
         return {  
            data: newArr  
         }  
      });  
   }  
  
   searchEmployee = (items, term) => {  
      // Если ничего не введено в поиск, то показываем все объекты  
      if (term.length === 0) return items;  
  
      return items.filter(item => {  
         // indexOf() - поиск подстроки  
         // Возвращаем только те элементы, где присутствует term         
         return item.name.indexOf(term) > -1;  
      });  
   }  
  
   // Метод, который будет регистрировать изменения стейта данных  
   onUpdateSearch = (term) => {  
      // {term: term}  
      this.setState({term});  
   }  
  
   // Выбор фильтра  
   filterPost = (items, filter) => {  
      switch (filter) {  
         case 'onIncrease':  
            return items.filter(item => item.liked);  
         case 'moreSalary':  
            return items.filter(item => item.salary > 1000);  
         default:  
            return items;  
	    }   
	}  
  
   onFilterSelect = (filter) => {  
      // {filter: filter}  
      this.setState({filter});  
   }  
  
   render() {  
      // Данные для реализации фильтрации на странице  
      const {term, data, filter} = this.state;  
      // Сразу передаём только те данные, которые подходят по поиску  
      const visibleData = this.filterPost(this.searchEmployee(data, term), filter);  
  
      // Считаем количество сотрудников  
      const employees = this.state.data.length;  
      // Количество сотрудников, идущих на повышение  
      const increased = this.state.data.filter(item => item.increase === true).length;  
  
      return (  
         <div className="app">  
            <AppInfo  
               employees={employees}  
               increased={increased}  
            />  
  
            <div className="search-panel">  
               <SearchPanel onUpdateSearch={this.onUpdateSearch}/>  
               {/*Чтобы сделать анимацию кнопки, нужно передать фильтр*/}  
               <AppFilter  
                  onFilterSelect={this.onFilterSelect}  
                  filter={filter}  
               />            
            </div>  
  
            <EmployeesList  
               // Это и есть пропсы  
               // Сюда передаём отфильтрованные данные               
               data={visibleData}  
               onDelete={this.deleteItem}  
               // А это те методы, которые передадутся в качестве props  
               onToggleProp={this.onToggleProp}  
            />  
            <EmployeesAddForm  
               onAdd={this.addItem}  
            />  
         </div>  
      );  
   }  
}  
  
export default App;
```

`app-filter.js`
```JSX
import {Component} from "react";  
import './app-filter.css';  
  
class AppFilter extends Component {  
    render() {  
        // Выносим данные о кнопках в отдельный элемент  
        const buttonsData = [  
            {name: 'all', label: 'Все сотрудники'},  
            {name: 'onIncrease', label: 'На повышение'},  
            {name: 'moreSalary', label: 'ЗП больше 1000$'},  
        ];  
  
        const buttons = buttonsData.map(({name, label}) => {  
            // ! Класс активности будем назначать только той кнопке, которая отвечает за нужный фильтр  
            const active = this.props.filter === name;  
            const clazz = active ? 'btn-light' : 'btn-outline-light';  
  
            // Сохраняем кнопки в массив  
            return (  
                <button className={`btn ${clazz}`}  
                        type="button"  
                        key={name}  
                        // Вкладываем функцию, которую передали сюда в качестве пропсов  
                        onClick={() => this.props.onFilterSelect(name)}  
                >  
                    {label}  
                </button>  
            );  
        })  
  
        return (  
            <div className="btn-group">  
                {/*И отображаем массив с кнопками*/}  
                {buttons}  
            </div>  
        );  
    }  
}  
  
export default AppFilter;
```

![](_png/aa6ee384e1f354a3eb212ec10df1561e.png)

![](_png/9c4946af0c8f0c3e9c55f96fd8405f3d.png)
![](_png/ff2e0694c0faf5a6f6dbbfa2cbbfbcab.png)

## 022 Семантика и доступность контента (ARIA)


==Accessible Rich Internet Applications (ARIA)== определяет способ сделать веб контент и веб приложения (особенно те, которые разработаны с помощью ==Ajax== и ==JavaScript==) более доступными для людей с ограниченными возможностями.

Мы должны строить правильную семантическую структуру документа на HTML, чтобы её могли адекватно прочитать скринридеры или, чтобы по ним можно осуществлять навигацию без мышки.

ARIA представляет из себя набор тегов и атрибутов, которые упрощают взаимодействие ограниченных людей с нашим приложением:
https://prgssr.ru/development/ispolzovanie-aria-v-html5.html


Так же очень важным является атрибут [tabIndex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex), который позволяет навесить таб на те элементы, до которых по умолчанию табом мы не можем добраться

Так же есть видео-доклад по [правильной организации интерфейса](https://www.youtube.com/watch?v=KAK-WAb9vow) для людей.
Ну и видео по [правильной семантике](https://www.youtube.com/watch?v=bDYEnNzprzE).

## 023 Стили в React. Inline Styles


==Инлайн-стили== в ==React== представляют из себя один большой объект, который мы вкладываем в атрибут `style`. 
Их особенности:
- Они, в первую очередь, записываются в один объект
- Единицы измерения в них прописываются автоматически (только `px`)
- Все наименования так же идут в ==camelCase==
- Вебкиты начинаются с разных регистров букв

![](_png/b1ecc7749284d2aa6252b59a2e51f500.png)

>[!info] Предпочтительнее менять для элементов уже готовые CSS-классы, нежели чем постоянно писать инлайн-стили

## 024 Стили в React. CSS и SASSSCSS


В первую очередь нам нужно научить вебпак компилировать SCSS, установив плагин

```bash
npm install sass

// или

npm i -D sass-loader node-sass
```

Чтобы подключить sass-файл со стилями, нам нужно его непосредственно подключить к компоненту реакта

```JSX
// И вместо этого импорта
import './emploees-add-form.css';  
// Используем этот
import './emploees-add-form.scss';
```

Ну и нужно отметить, что если нам нужно импортировать в scss те же переменные из другого scss, то нам придётся импорты делать в каждый файл, а не только в основной

![](_png/015e1a5fedfd6ac3f51b8e518c932109.png)

## 025 Стили в React. Динамические классы и стили


Динамическими классами и стилями называются те классы и стили, которые мы добавили через условие (например, тернарный оператор)

```JSX
const buttonsData = [  
	// Добавим условие colored, по которому будем проверять цветность
    {name: 'all', label: 'Все сотрудники', colored: false},  
    {name: 'onIncrease', label: 'На повышение', colored: true},  
    {name: 'moreSalary', label: 'ЗП больше 1000$', colored: false},  
];  
  
const buttons = buttonsData.map(({name, label, colored}) => {  
    const active = this.props.filter === name;  
    const clazz = active ? 'btn-light' : 'btn-outline-light';  
  
    // Сохраняем кнопки в массив  
    return (  
        <button className={`btn ${clazz}`}  
                type="button"  
                key={name}  
                onClick={() => this.props.onFilterSelect(name)}  

				// Так выглядят динамические стили
                style={colored ? {color: 'red'} : null}  
        >  
            {label}  
        </button>  
    );  
})
```

![|500](_png/d16edd9c7590c18328e0203f70bae723.png)

Желательно такие условия выносить в отдельную переменную, чтобы не портить код

```JSX
const buttons = buttonsData.map(({name, label, colored}) => {  
    const active = this.props.filter === name;  
    const clazz = active ? 'btn-light' : 'btn-outline-light';  

	// Тут мы будем хранить условие, которое передадим в рендер объекта
	const styled = colored ? {color: 'red'} : null;
  
    // Сохраняем кнопки в массив  
    return (  
        <button className={`btn ${clazz}`}  
                type="button"  
                key={name}  
                onClick={() => this.props.onFilterSelect(name)}  

				// Результат условия будет находиться тут
                style={styled}  
        >  
            {label}  
        </button>  
    );  
})
```

## 026 Стили в React. Styled Components


[Styled Components](https://styled-components.com/) в ==React== позволяют писать CSS код ==прямо== внутри реакт-компонентов

Устанавливаются через:

```bash
npm install --save styled-components
```

Дальше для реализации компонента с логикой и его стилями используются ==[тэгированные шаблонные строки](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)==
Конкретно тут мы сделаем компонент `Button`, который будет представлять из себя ссылку `a` с определёнными стилями внутри кавычек

```JSX
const Button = styled.a`
  /* This renders the buttons above... Edit me! */
  display: inline-block;
  border-radius: 3px;
  padding: 0.5rem 0;
  margin: 0.5rem 1rem;
  width: 11rem;
  background: transparent;
  color: white;
  border: 2px solid white;

  /* The GitHub button is a primary button
   * edit this to target it specifically! */
  ${props => props.primary && css`
    background: white;
    color: black;
  `}
`
```

И вот пример использования стилевых компонентов в ==React==:
Так же эти компоненты можно экспортировать в другие компоненты

```JSX
// импорт стилевых компонентов
import styled from 'styled-components';

// Создание стилевых компонентов
export const Wrapper = styled.div`  
    width: 600px;    
    margin: 80px auto 0 auto;
`;  

function App() {  
    return (  
	    // Использование стилевых компонентов
        <Wrapper>  
            <WhoAmI name='John' surname="Smith" link="google.com" />  
            <WhoAmI name='Angela' surname="Coose" link="facebook.com" />  
        </Wrapper>  
    );  
}
```

Так же компоненты стилей можно наследовать и переопределять для других элементов:

`App.js`
```JSX
export const Button = styled.button`  
  display: block;  
  padding: 5px 15px;  
  background-color: gold;  
  border: 1px solid rgba(0, 0, 0, 0.2);  
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);  
`;
```

`index.js`
```JSX
import App, {Btn, Field, Header, Button} from './App';  
import styled from 'styled-components';  

// В () указываем элемент, который мы переписываем
const BigButton = styled(Button)`  
  margin: 0 auto;  
  width: 245px;  
  height: 50px;
`;  
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
    <StrictMode>  
        <App/>  
        {/* Непосредственное использование переопределённой кнопки */}
        <BigButton>Some Text</BigButton>  
    </StrictMode>  
);
```

![](_png/c13abdac9e7a3b311997a39ae5b41339.png)

Так же мы можем заменить выводимый тег. То есть если мы создавали компонент стилей `div`, то мы можем его поменять на `a` или на любой другой тег через `as="тег"`

`index.js`
```JSX
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
    <StrictMode>  
        <App/>  
        {/* меняем тег 'div' на 'a' */}
        <BigButton as="a">Some Text</BigButton>  
    </StrictMode>  
);
```

![](_png/e9bd1b8cf10216a32f0988be05dd443b.png)

Так же синтаксис поддерживает вкладывание обращений к элементам

`App.js`
```JSX
const EmpItem = styled.div`  
    padding: 20px;    
    margin-bottom: 15px;    
    border-radius: 5px;    
    box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);  
    a {  
        display: block;        
        margin: 10px 0px 10px 0px;        
        color: black;  
    }    
    input {  
        display: block;        
        margin-top: 10px;    
    }
`;
```

![](_png/527a5198c81893cc3ca8110574eeaa15.png)

Так же мы можем использовать выражения внутри наших CSS-свойств (те же тернарные операторы, которые будут подставлять нужное значение свойства в зависимости от значения атрибута, которое передаётся через `props`)

`App.js`
```JSX
//...
const EmpItem = styled.div`  
    padding: 20px;    
    margin-bottom: 15px;    
    border-radius: 5px;    
    box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);  
    a {  
        display: block;        
        margin: 10px 0px 10px 0px;  
        
        /*тут мы использем условие, опираясь на значение пропса*/      
        color: ${props => props.active ? 'orange' : 'black'};  
    }    
    input {  
        display: block;        
        margin-top: 10px;    
    }
`;

//...
render() {  
    const {name, surname, link} = this.props;  
    const {text, years, position} = this.state;  
    return (  
    
	    // В качестве пропса передаём атрибут активности (по умолчанию true)
        <EmpItem active>  
            <Button onClick={() => this.nextYear()}>{text}</Button>  
            <Header>My name is {name}, surname - {surname}, age - {years} <br/> profession - {position}</Header>  
            <a href={link}>My profile</a>  
            <form>  
                <label htmlFor={`profession${name}`}>Введите вашу профессию</label>  
                <input type="text" id={`profession${name}`} onChange={(e) => this.commitInputChanges(e, 'red')}/>  
            </form>  
        </EmpItem>  
    );  
};
```

![](_png/c939a8970ebc6eb3997a85898abcbe15.png)

>[!summary] Несколько важных фактов:
> - Вендорные префиксы ставятся автоматически - их не требуется писать
> - Отношения пишутся и работают как в обычном CSS
> - Псевдоселекторы и псевдоэлементы работают точно так же
> - Так же можно создавать тут же CSS-анимации

>[!success] Преймущества:
> - Инкапсулирование стилей - они нигде друг с другом не пересекаются и нет необходимости писать лишние классы
> - Так же отпадает необходимость пользоваться БЭМом
> - Возможность использования пропсов и условий
> - Вендорные префиксы ставятся автоматически

>[!warning] Минусы:
> - К такому синтаксису нужно привыкнуть
> - Очень легко запутаться в тегах, если написано очень много стилизованных компонентов
> - Названия стилей внутри devtools превращены в кашу (так как идёт динамическая генерация имён классов)
> - CSS и JS вместе до конца - их не получится отдельно закэшировать

## 027 Стили в React. Готовые библиотеки компонентов со стилями


Для ==React== существует отдельный и подогнанный под него ==[Bootstrap](https://react-bootstrap.github.io/getting-started/introduction)==

```bash
npm install react-bootstrap bootstrap
```

Дальше в `index.js` (самый основной JS-файл) нужно запихнуть файл стилей

```JSX
import 'bootstrap/dist/css/bootstrap.min.css';
```

И далее в побочных файлах только остаётся импортировать определённые компоненты бутстрапа (из документации)

```JSX
import {Container, Row, Col} from 'react-bootstrap';  
  
const BootstrapTest = () => {  
    return (  
        <Container>  
            <Row>  
                <Col>1 of 2</Col>  
                <Col>2 of 2</Col>  
            </Row>  
        </Container>  
    );  
}  
  
export default BootstrapTest;
```

![](_png/f3c43af364c21433e33ec71645bb9a22.png)

Использование в основном файле:

```JSX
import React, {StrictMode} from 'react';  
import ReactDOM from 'react-dom/client';  
import './index.css';  
import App, {Btn, Field, Header} from './App';  
import styled from 'styled-components';  

// Импорты бутстрапа и примера
import 'bootstrap/dist/css/bootstrap.min.css';  
import BootstrapTest from './BootstrapTest';  
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
  <StrictMode>  
      <App/>  
      <BootstrapTest/>  {/* использование */}
  </StrictMode>  
);
```

## 028 Поля классов и static


`static` поля классов:
- Вызываются просто через имя класса без инициализации
- Можно получить и вывести их значения
- Позволяют задать стейт как поле класса (без инициализации через конструктор и ключевого слова `static`) 

```JS
class EmployeesAddForm extends Component {  
  
    state = {  
        name: '',  
        salary: ''  
    }  
    
    static onLog = () => {  
        console.log('Hey!');  
    }

	static logged = 'logged';
}

EmployeesAddForm.onLog();
console.log(EmployeesAddForm.logged);

// Hey
// logged
```

## 029 Заключение модуля

Попробовать сверстать на ==React== *Cofee Shop* по макету (уже скопирован в драфты):

https://www.figma.com/file/Iu4Lul87WvzdM5CXFwE4qtZ6/Coffee-shop?node-id=0%3A1
