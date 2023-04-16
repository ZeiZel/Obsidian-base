
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