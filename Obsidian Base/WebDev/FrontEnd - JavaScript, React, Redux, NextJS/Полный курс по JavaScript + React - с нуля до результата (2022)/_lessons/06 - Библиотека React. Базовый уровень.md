## **06 - Библиотека React. Базовый уровень**

### **003 Фундаментальные принципы Реакта**

- Все фундаментальные принципы реакта описаны на его главном экране

1) Реакт – имеет декларативный (что?) подход, то есть в нём мы описываем, какой результат нам нужен

Императивный (как?) полностью описывает как дойти до определённого результата – описаны конкретные шаги

2) Реакт основан на компонентах (элементы которые могут повторяться, но иметь разное содержимое)

3) На реакте построено множество других библиотек, которыми можно писать те же мобильные приложения или приложения для VR

- Отличительные особенности React

1) Использует препроцессор JSX, который позволяет писать JS и вёрстку в одном месте

2) В нём есть механизмы сравнения, которые позволяют отследить только те участки веб-приложения, которые изменились и изменить только их, а не всё приложение полностью (reconciliation algorithm)

3) Виртуальное дерево. Реакт работает сначала с виртуальным деревом, которое он создаёт для себя. Потом уже изменения переносятся на основное дерево.

4) Оптимизация. Она вытекает из прошлого пункта и обеспечивается более компактным формированием информации в объектах виртуального ДОМ Реакта

Пример обычного компонента в ДОМ-дереве: огромное количество свойств и строк
![](../_png/Pasted%20image%2020220909181802.png)
И пример ДОМ-элемента в реакте. Он имеет только небольшое количество свойств, что позволяет снять нагрузку на память
![](../_png/Pasted%20image%2020220909181809.png)
![](../_png/Pasted%20image%2020220909181813.png)

### **004 Create React App - создаем свое приложение**

Чтобы создать Реакт-проект

Через npx устанавливаем плагин create-react-app в папку first-react-proj (можно поставить «.» и темплэйт загрузится в текущую папку)

```bash
npx create-react-app first-react-proj

cd имя_папки // переходим в папку

npm start // запускаем компиляцию через вебпак
```

Это два основных файла в срц

![](../_png/Pasted%20image%2020220909181849.png)

Это та индекс-страница, которую просто так открывать бессмысленно – запуск только через npm start покажет нам результат. Так же в носкрипте есть текст, который выйдет если отключены скрипты на странице

![](../_png/Pasted%20image%2020220909181854.png)

И компиляцией jsx в навтивный js занимается бэйбель

![](../_png/Pasted%20image%2020220909181859.png)
[https://babeljs.io/docs/en/babel-plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx)

### **005 Работаем с JSX-препроцессором, ограничения в нем**

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
![](_png/Pasted%20image%2020220930145856.png)

И вот так вот выглядит препроцессор JSX в написании: мы пишем HTML прямо внутри JS и выводим его через рендер
**Рендер должен быть только один**

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
![](_png/Pasted%20image%2020220930150015.png)

А это старый вариант записи, который работает под копотом у препроцессора JSX

```JSX
const elem = React.createElement('h2', {className: 'greetengs'}, 'Hello, world!');
```
![](_png/Pasted%20image%2020220930153842.png)
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

![](_png/Pasted%20image%2020220930154422.png)

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
![](_png/Pasted%20image%2020220930161755.png)

Ну и так же в эту запись HTML можно вставлять интерполяцию `{ }`, внутри которой мы можем выводить переменные и совершать определённые операции

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
![](_png/Pasted%20image%2020220930163202.png)

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

### **006 Элементы и компоненты**

Компонент - это блок пользовательского интерфейса, который может иметь своё поведение. 
Это самостоятельная структура, которую мы можем переиспользовать в различных местах приложения
В первую очередь, компонент представляет из себя функцию, которая возвращает JSX блок кода 

Элемент - это структурная часть компонента.
```JSX
<h2 className="text">Текст: {['234']}</h2>
```

И дальше мы столкнёмся с другой особенностью этой библиотеки - мы не можем изменить уже отрендеренный элемент на странице. Для этого его нужно создать и заменить через код

![](_png/Pasted%20image%2020221001084545.png)

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
![](_png/Pasted%20image%2020221001090315.png)

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
![](_png/Pasted%20image%2020221001101834.png)

Так же можно использовать любые выражения внутри `{}`. Конкретно тут, если пользователь залогинен, то он может выйти. Если не залогинен, то может войти. Кнопка вход/выход.

```JSX
const Btn = () => {  
    const logged = true;  
    const text = 'Log in';  
  
    return <button>{logged ? 'Log out' : text}</button>;  
}
```

Так же в атрибуты мы можем помещать переменные. Стили мы можем записывать в виде объектов и передавать их внутрь компонента простой передачей переменной

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
![](_png/Pasted%20image%2020221001103010.png)

Так же мы можем записать компоненты  в виде классов. 

Первый вариант:
```JSX
import React from 'react';

class Field extends React.Component {  
}
```
Более короткий вариант через деструктуризацию:
```JSX
import {Component} from 'react';

class Field extends Component {  
}
```

В каждом классе компонента должен быть обязательный метод `render()`, который будет отрисовывать интерфейс

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

### **007 Строгий режим**

Строгий режим внутри реакта подразумевает под собой проверку на актуальные конструкции, которые мы можем использовать. Обычно он используется для перевода проекта на новую версию реакта.
Если какой-то компонент или подход не будет соответствовать нынешней версии реакта или будет нерекоммендуем к использованию, то реакт нас об этом предупредит.
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

### **009 Создание нового проекта**

**CRUD** — акроним, обозначающий четыре базовые функции, используемые при работе с базами данных: создание (create), чтение (read), модификация (update), удаление (delete). Это стандартная классификация функций по манипуляции данными.
В [SQL](https://ru.wikipedia.org/wiki/SQL "SQL") этим функциям, операциям соответствуют операторы [Insert](https://ru.wikipedia.org/wiki/Insert_(SQL) "Insert (SQL)") (создание записей), [Select](https://ru.wikipedia.org/wiki/Select_(SQL) "Select (SQL)") (чтение записей), [Update](https://ru.wikipedia.org/wiki/Update_(SQL) "Update (SQL)") (редактирование записей), [Delete](https://ru.wikipedia.org/wiki/Delete_(SQL) "Delete (SQL)") (удаление записей).

Конкретно будет реализовываться проект, который позволит добавлять, удалять, изменять и читать сотрудников и как-то с этими данными взаимодействовать

И в самом начале нам нужно поделить макет на отдельные составные части - компоненты, которые будут представлять собой интерфейс приложения
![](_png/Pasted%20image%2020221001145618.png)

Первым делом, нужно добавить определённые библиотеки в HTML для стилизации приложения: bootstrap и font-awesome

```HTML
<!-- Head -->

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.1/css/bootstrap.min.css"/>  
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"/>  
  
    <title>React App</title>  
```
![](_png/Pasted%20image%2020221001113642.png)

Для начала определимся со структурой. В папке src храним все исходники проекта. Внутри этой папки нужно хранить два основных файла index js и css. Там же создадим папку components, которая будет хранить все реакт-файлы. Все компоненты делим по папкам, которые именуем в порядке ==cebab-case==. Основной папкой тут будет App и его JS-файл

![](_png/Pasted%20image%2020221001144008.png)

Сразу нужно сказать, что без разницы, будем мы писать JS или JSX расширение файла - вебпак всё соберёт

Основной файл рендера: 
```JSX
// index.js
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
```JSX
// app.js

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
```JSX
// employees-list.js

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

Пример стилей :
```CSS
// employees-list.css
.app-list {  
    margin-top: 30px;  
    background-color: #3D5A80;  
    border-radius: 4px;  
    box-shadow: 15px 15px 15px rgba(0, 0, 0, .15);  
    color: #fff;  
}
```

Пример полноценного компонента со стилями:
```JSX
// employees-list-item.js
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

`defaultValue` - это атрибут реакта, который задаёт начальное значение по умолчанию

### **010 Свойства компонентов**

Свойства компонентов (properties - пропсы) - это объект, который передаётся в компонент из вызова компонента на рендер. Сами значения пропса хранятся в атрибутах компонента.
Значения атрибутов неизменяемые - они только на чтение. Кроме как отобразить на странице и прочесть значение - больше ничего не получится.
Пропсы используются в компоненте. А менять пропсы в компонентах - нельзя.

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
![](_png/Pasted%20image%2020221001154258.png)

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

### **011 Практика свойств на проекте**

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
![](_png/Pasted%20image%2020221001163508.png)

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
![](_png/Pasted%20image%2020221001170356.png)

### **012 Работа со списками и алгоритм согласования**
















### **013 Состояния компонентов**



### **014 Самостоятельное задание на работу с состояниями**



### **015 События в React и вспоминаем this**



### **016 Практика состояний на проекте**



### **017 Работа с формами, управляемые и неуправляемые компоненты**



### **018 Иммутабельность состояния и собственные события**



### **019 Практика. Подъём состояния**



### **020 React-фрагменты**



### **021 Практика. Реализуем поиск и фильтры**



### **022 Семантика и доступность контента**



### **023 Стили в React.** **Inline Styles**



### **024** **Стили** **в** **React.** **CSS и SASSSCSS**



### **025 Стили в React. Динамические классы и стили**



### **026 Стили в React.** **Styled Components**



### **027** **Стили** **в** **React.** **Готовые библиотеки компонентов со стилями**



### **028 Поля классов и static**



### **029 Заключение модуля**

