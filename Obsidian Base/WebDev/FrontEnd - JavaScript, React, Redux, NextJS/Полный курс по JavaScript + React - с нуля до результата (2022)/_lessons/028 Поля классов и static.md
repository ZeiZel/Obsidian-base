
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
