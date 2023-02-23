
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

![|500](_png/Pasted%20image%2020221023174358.png)

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