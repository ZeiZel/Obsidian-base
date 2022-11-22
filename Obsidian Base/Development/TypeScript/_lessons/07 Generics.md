## **07 Generics**

### **058 Вводное видео**

Дженерики - это определённая функция с плейсходлдером, в которую мы можем подставить определённый тип. Он позволяет сохранить типовую динамичность функции (как в нативном JS) и сохраняет type safety в проектах. 
Мы используем дженерики для эффективного переиспользования кода.

![](_png/ea9fae282b521923c45f83963bc64abc.png)

### **059 Пример встроенных generic**

Встроенные дженерики в ТС отчётливо показывают нам, какие типы должны возвращать и хранить объекты. Если создать тот же массив чисел мы можем через *number[]*, то уже определить возвращаемый из промиса тип у нас просто так не получится. 
Чтобы реализовать типизацию у промиса, можно прописать Promise<возвращаемый_тип>

```TS
const numArr: Array<number> = [1, 2, 3];  
  
async function promiseFrom() {  
    const promiseA = await new Promise<number>((resolve, reject) => {  
        resolve(1);  
    })  
}
```

И вот пример создания записной книжки через объект (а не интерфейс), которая принимает в себя ключ(строку) - значение(булеан). 

```TS
 const recorder: Record<string, boolean> = {  
    drive: true,  
    ride: true  
}
```

### **060 Пишем функцию с generic**

Дженерики могут нам пригодиться ровно в тех случаях, когда нам нужно реализовать функцию, которая в себя может принять и обработать любой тип данных (либо какие-то определённые)
Конкретно в этом случае, мы передаём пока один тип значения - дженерик тут не нужен

```TS
function dataMiddleWare(data: string): string {  
    console.log(`Return middleware ${data}`);  
    return data;  
}  
  
const res = dataMiddleWare("str");
```

Но если у нас появится потребность добавить ещё один тип в качестве передаваемого значения, то нам нужно будет реализовывать сужение под каждый из принимаемых типов

```TS
function dataMiddleWare(data: string | number): string | number {  
    console.log(`Return middleware ${data}`);      
if (typeof data === "string") {  
        return data + " string";  
    } else {  
        return data;  
    }  
}  
  
const res = dataMiddleWare("str");
```

И вот на помощь нам приходят дженерики. Они позволяют сделать некую обобщённую функцию, которая позволит работать с любым передаваемым типом 
Главный признак таких функций - *они могут работать с **any***

```TS
function dataMiddleWare<T>(data: T): T {  
    console.log(`Return middleware ${data}`);  
    return data;  
}  
  
const res = dataMiddleWare("str");
```

И теперь мы видим, что наша функция универсальна для любых типов данных

![](_png/aa40e210b96290710e5bd7de6dc241f8.png)

Так же хочется отметить, что мы можем валидировать типы данных, получаемых из дженериков
Нам нужно получить строку из дженерика - укажем этот тип

![](_png/880b7c2d93b6d25be546993082b6250e.png)

Далее нам нужно создать функцию, которая будет принимать в себя массив и возвращать половину от него. 
Создадим обобщённый дженерик и сталкиваемся с проблемой, что компилятор нам говорит - не у всех передаваемых значений будет значение длины (которое нам нужно от массива)
Но тут наша функция не может работать с *any* данными

```TS
function getHalfFromMassive<T>(data: T): T {  
    const lengthHalfedMassive = data.length / 2;  // Error
    return data.slice(0, lengthHalfedMassive);   
}
```

А вот уже в данном случае, мы сможем обратиться к свойству массива, так как data имеет тип: *Массив<любой_тип_данных>*. И возвращаем тут тоже массив любого типа данных 

```TS
function getHalfFromMassive<T>(data: Array<T>): Array<T> {  
    const lengthHalfedMassive = data.length / 2;  
    return data.slice(0, lengthHalfedMassive);  
}

getHalfFromMassive<number>([1, 2, 3, 4]);
```

Таким образом мы можем записать стрелочную функцию

```TS
const func = <T>(data: Array<T>): Array<T> => { return data; }
```

Так же дженерикам можно задать *значение по умолчанию*

```TS
type Constructor = new (...args: any[]) => {};  
type GConstructor<T = {}> = new (...args: any[]) => T;
```

### **061 Упражнение - Функция преобразования в строку**

Нам нужно реализовать функцию toString, которая будет выводить либо строку, либо undefined (если значение не передано)

```TS
function toString<T>(data: T): string | undefined {  
    if (Array.isArray(data)) {  
        return data.toString();  
    }  
  
    switch (typeof data) {  // на каждый тип - своя реализация
        case "string":  
            return data;  
        case "bigint":  
        case "number":  
        case "boolean":  
        case "function":  
            return data.toString();  
        case "object":  
            return JSON.stringify(data);  
        default:  
            return undefined;  
    }  
}  
  
console.log(toString([1, 2, 3]));  
console.log(toString({ a: 123, b: "Logan"}));  
// можно определить самостоятельно передаваемый тип в <>
console.log(toString<boolean>(true)); 
```

### **062 Использование в типах**

Таким образом мы можем присвоить функцию в другую переменную, описав её тип дженериком

```TS
const split: <T>(data: Array<T>) => Array<T> = getHalfFromMassive;
```

> Дженерики можно использовать не только в функциях, но и в рамках описания любого типа объектов  в рамках интерфейсов или типов (а так же классов)

```TS
interface ILogLine<T> {  // Interface Generic
    name: string,  
    data: T  
}  
  
type LogLineType<T> = {  // Type Generic
    name: string,  
    data: T  
}  
						  // Тип дженерика интерфейса
const logLineInterface: ILogLine<{a: number}> = {  
    name: "Lossy",  
    data: {  
        a: 19  
    }  
}  
						  // Тип дженерика тайпа
const logLineType: LogLineType<{a: number}> = {  
    name: "Lossy",  
    data: {  
        a: 19  
    }  
}
```

### **063 Ограничение generic**

В ТС есть возможность ограничить получаемые значения дженерика через extends этого дженерика типами, классами, интерфейсами или тайпами

```TS
function kmToMiles<T extends Vehicle>(vehicle: T): T { 
```

И тут мы видим пример, когда мы ограничиваем передаваемые типы в дженерик-функцию, тип которой экстендится от класса  Vehicle

```TS
class Vehicle {  
    run: number;  
}  
  
class SCV extends Vehicle {  
    capacity: number;  
}  
  
function kmToMiles<T extends Vehicle>(vehicle: T): T { // Расширение  
    vehicle.run = vehicle.run / 0.62;  
    console.log(vehicle);  
    return vehicle;  
}  
  
kmToMiles(new Vehicle());  
kmToMiles(new SCV());  
kmToMiles({run: 143});  
  
kmToMiles({a: 123123}); // Error
```
![](_png/c9b57fa83fd9715c7ee5310ba244a4a1.png)

Так же экстенд работает и с интерфейсами

```TS
interface Vehicle {  
    run: number;  
}  
  
interface SCV extends Vehicle {  
    capacity: number;  
}  
  
function kmToMiles<T extends Vehicle>(vehicle: T): T { // Расширение  
    vehicle.run = vehicle.run / 0.62;  
    console.log(vehicle);  
    return vehicle;  
}  
```

Так же дженерики можно экстендить юнион типами

```TS
function logId(id: number | string) {  
    if (typeof id === 'string') {  
        console.log(id);  
        return id;   
	} else {  
        return id + 302;  
    }    
}
```

```TS
function logId<T extends number | string>(id: T): T {  
    console.log(id);  
    return id;  
}
```

Но так же мы можем добавлять в код сразу несколько дженериков
Например, тут T дженерик, ограниченный юнион-типом и Y дженерик без ограничения 

```TS
function logId<T extends number | string, Y>(id: T, additionalData: Y): { id: T, data: Y } {  
    console.log(id);  
    return { id, data: additionalData };  
}
```

### **064 Упражнение - Функция сортировки id**

Нужно написать функцию, которая будет сортировать любые объекты с id по возрастанию и убыванию.

Конкретно тут мы имеем определённые данные. Создаём интерфейс, где говорим, что у нас должно присутствовать свойство id. Далее в функции нужно указать, что мы экстендим наш дженерик интерфейсом, который содержит нужное нам свойство. Аргументом и возвращаемым типом является массив от дженерика. Внутри функции реализована сортировка через свитч-кейс, который выбирает реализацию из указанной нами (asc-desc)

```TS
const data = [  
    {id: 1, name: 'John'},  
    {id: 1, name: 'Lusy'},  
    {id: 1, name: 'Andrew'},  
];  
  
interface ID {  
    id: number  
}  
  
function sort<T extends ID>(data: T[], type: "asc" | "desc" = "asc"): T[] {  
    return data.sort((a, b) => {  
        switch (type) {  
            case "asc":  
                return a.id - b.id;  
            case "desc":  
                return b.id - a.id;  
        }    
    });  
}  
  
console.log(sort(data));  
console.log(sort(data, "desc"));
```


### **065 Generic классы**

Мы можем так же спокойно задавать дженерики для классов. Они будут определять какие типы данных мы будем передавать в конструктор класса.

```TS
class Resp<D, E> {  
    data?: D;  
    error?: E;  
  
    constructor(data?: D, error?: E) {  
        if (data) {  
            this.data = data;  
        }        if (error) {  
            this.error = error;  
        }    
    }  
}  
  
const resp = new Resp<string, number>("data", 0);
```

Однако если мы не передадим второе значение (опциональное) и не определим типы, то второе значение дженерика будет unknown

![](_png/f40f3047e5a9640dd101b13e26b5d638.png)

Так же нужно сказать, что мы не можем напрямую наследоваться от класса с его дженериками. Мы можем наследоваться от класса и определить дженерики конкретными типами

![](_png/7b144d6f484e24db2a88baaa6b1947c1.png)
![](_png/17bf4d9df44ccfc0867a8ff4cc93f382.png)

Так же мы можем указать свои дженерики для наследуемого класса. Однако именам дженериков нельзя совпадать с родительскими

```TS
class HTTPResp<F> extends Resp<string, number> {  
    private _code?: F;  
  
    set code(code: F) {  
        this._code = code;  
    }  
}
```

Дженерики для классов обычно задают, когда у нас свойства зависят от реализации

### **066 Mixins**

Три типа наследования: 
- Через extends
- Композиция
- Прямое наследование

![](_png/a7db5265e9aa7001b75d8dcfeea3872b.png)

Это обычный подход при добавлении нового функционала в классы. Им мы обычно и пользуемся. Конкретно в этом примере такой подход оптимален.

```TS
class List {  
    constructor(public items: string[]) {}  
}  
  
type ListType = GConstructor<List>;  
  
class ExtendedListClass extends List {  
    first() {  
        return this.items[0];  
    }  
}
```

И вот пример миксина. Сразу нужно сказать, что миксины используются редко и обычно используются в подходе DCI.
Что из себя представляет миксин? Миксин - это функция, которая возвращает класс, который мы расширили нужным нам классом.
Конкретно в нашем примере, TBase (дженерик) мы расширили через ListType и этот TBase определили как тип значения, которое мы передаём в функцию. ***Аргумент функции** - это класс, которым мы будем расширять возвращаемый из функции класс.* 

```TS
type Constructor = new (...args: any[]) => {};  
type GConstructor<T = {}> = new (...args: any[]) => T;  
  
class List {  
    constructor(public items: string[]) {}  
}  
  
type ListType = GConstructor<List>;  
  
class ExtendedListClass extends List {  
    first() {  
        return this.items[0];  
    }  
}  
  // И вот реализация миксина
function ExtendedList<TBase extends ListType>(Base: TBase) {  
    return class ExtendedList extends Base {  
        first() {  
            return this.items[0];  
        }    
    }  
}
```

Чтобы воспользоваться данной конструкцией, нам нужно сначала присвоить класс какой-то переменной, потом из этой переменной инстанциировать класс

```TS
const list = ExtendedList(List);  
const res = new list(["first---", "second"]);  
console.log(res.first()); // first---
```

Так же главной фишкой такого подхода является то, что мы можем заэкстендить дженерик сразу от нескольких тайпов
Связующим звеном для использования является AccordionList - он содержит конструктор List и свойство isOpen (делается это так из-за того, что нам нужно передать класс, который имеет реализацию обоих тайпов -> которые были сделаны из этих классов)

```TS
type Constructor = new (...args: any[]) => {};  
type GConstructor<T = {}> = new (...args: any[]) => T;  // Тайп-Дженерик-Конструктор
  
class List {  // Класс
    constructor(public items: string[]) {}  
}  
  
class Accordion {  // Класс
    isOpen: boolean;  
}  
  
type ListType = GConstructor<List>; // Тайп из класса
type AccordionType = GConstructor<Accordion>;  // Тайп из класса
  
class ExtendedListClass extends List {  
    first() {  
        return this.items[0];  
    }  
}  
  
//                              Собственно, экстенд тайпов:  
function ExtendedList<TBase extends ListType & AccordionType>(Base: TBase) {  
    return class ExtendedList extends Base {  
        first() {  
            this.isOpen = true;  
            return this.items[0];  
        }    }  
}  

// Класс, который имеет в себе реализацию обоих классовых тайпов
class AccordionList { // Для связки двух тайпов  
    isOpen: boolean;  
    constructor(public items: string[]) {}  
}  
  
const list = ExtendedList(AccordionList);  
const res = new list(["first", "second"]);  
console.log(res.first() + " " + res.isOpen);
```

>[!info] Преймущества миксинов:
> 1) Он позволяет перенести функциональность сразу нескольких классов в один
> 2) Позволяет примиксовать так же функциональность к исходному классу
> 3) Тайпчекинг экстендедов класса

>[!important] Когда использовать миксины?
Обычно миксины не используются и вместо них применяют композицию, чтобы перенести функциональность из класса в класс. Однако, если нам нужно будет перенести и функциональность из нескольких классов и свойства этих классов, то тут уже нужно будет использовать миксины