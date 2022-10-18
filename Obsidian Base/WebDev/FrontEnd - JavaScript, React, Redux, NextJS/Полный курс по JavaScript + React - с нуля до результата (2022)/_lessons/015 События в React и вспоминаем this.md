
Сейчас нужно поговорить о том, почему мы используем коллбэк-функции вместо обычных, когда нам нужно работать в реакте. 

Причина крайне проста: методы,  которые мы вызываем в другом методе, при использовании обычных функций, не сохраняют контекст вызова. Коллбэк-функция `nextYear` сохраняет контекст вызова и обращается к классу, в котором находится метод `render`. Обычная функция не сохраняет контекст и `this` внутри неё будет = `undefined`

![](_png/Pasted%20image%2020221018192920.png)

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

Если нам нужно передать в функцию значения, то нам опять же нужно воспользоваться анонимной стрелочной функцией `(e) => this.commitInputChanges(e, 'red')`, которая и позволит передать значения.

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

Так же нужно отметить, что `event` передаётся в функцию по умолчанию и нам не нужно передавать его отдельно

```JSX
// Это метод
commitInputChanges = (e) => {  
    this.setState(state => ({  
        position: e.target.value,  
    }));  
}  

// Это в рендере
<input type="text" id={`profession${name}`} onChange={ this.commitInputChanges}/>  
```
