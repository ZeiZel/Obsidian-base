## 068 Разбор DI и IOC

==DI - dependency injection==
==IOC - inversion of control==

Само явление внедрения зависимостей избавляет нас от потребности инстанциирования объекта внутри самого класса. Таким образом, мы можем внедрять разный функционал по заранее определённому интерфейсу.
Такой подход так же позволяет отделить программный компонент, чтобы его отдельно протестировать

![](_png/Pasted%20image%2020221127183336.png)

Совершить самое простое внедрение зависимостей можно:
1) Через конструктор
2) Либо через метод

![](_png/Pasted%20image%2020221127202735.png)

==Composition root== - это одна точка, в которой собираются все зависимости с приложения

![](_png/Pasted%20image%2020221127203034.png)

Это схема простого DI, который мы можем повторить в любом языке

![](_png/Pasted%20image%2020221127203215.png)

А это схема с типизируемыми языками, в которой можно определить конкретный интерфейс той зависимости, которую мы будем внедрять
Интерфейс выступает в данном случае неким контрактом, который определяет то, что должно присутствовать в классе

![](_png/Pasted%20image%2020221127203246.png)

И вот тут можно увидеть пример, что наш интерфейс представляет из себя контракт того, что должно присутствовать в классе

`logger.interface.ts`
```TS
import { Logger } from "tslog";

export interface ILogger {
	logger: unknown;

	log: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
}
```

А тут мы по контракту реализуем методы, которые должны будут присутствовать в классе обязательно

`logger.service.ts`
```TS
import { Logger } from "tslog";
import { ILogger } from "./logger.interface";

export class LoggerService implements ILogger {
	public logger: Logger<string>;

	constructor() {
		this.logger = new Logger();
	}

	log(...args: unknown[]) {
		this.logger.info(...args);
	}

	error(...args: unknown[]) {
		this.logger.error(...args);
	}

	warn(...args: unknown[]) {
		this.logger.warn(...args);
	}
}
```

И теперь в главном классе можно поменять входной инстанс не на сам класс логгера, а на интерфейс, которому должен удовлетворять передаваемый внутрь `app` логгер

`app.ts`
```TS
export class App {
	private app: Express;
	private server: Server;
	private port: number;
	// принимает в себя логгер по интерфейсу
	private logger: ILogger;
	private userController: UserController;
	private exceptionFilter: ExceptionFilter;

	constructor(
		// принимает в себя логгер по интерфейсу
		logger: ILogger,
		userController: UserController,
		exceptionFilter: ExceptionFilter
	) {
		this.app = express();
		this.port = 8000;
		this.logger = logger;
		this.userController = userController;
		this.exceptionFilter = exceptionFilter;
	}
	
	// код...
}
```

Первый принцип говорит о том, что все наши компоненты должны быть максимально изолированны друг от друга. Связываем все компоненты через абстракции и интерфейсы, которые предоставляют определённый контракт на функциональность, которая должна присутствовать в другом компоненте:
*Мы создали в классе приложения переменную, которая принимает в себя интерфейс логгера, в котором должны присутствовать методы: `log`, `error` и `warn` - сам логгер мы не принимаем, но в нём должны быть методы, которые мы описали в интерфейсе.*

Второй принцип говорит нам о том, что нам нельзя прокидывать в более мелкие модули (те же сервисы) модули более высокого уровня:
*Нам нельзя прокидывать инстанс `app` внутрь того же `exception`, `logger` или `router`.*

![](_png/Pasted%20image%2020221127205032.png)

Конкретно мы имеем:
- Принципы, которым мы должны следовать
- Паттерн, по которому эти принципы можно реализовать
- И сама реализация

![](_png/Pasted%20image%2020221127205734.png)

При регистрации приложения наш класс А регистрируется в контейнере: мы понимаем, что он заинтсанциирован и что он удовлетворяет какому-либо интерфейсу
То же самое происходит с классом Б
Контейнер - это центральная точка управления, которая за нас создаёт наши классы, при этом он понимает, какие зависимости ему нужны, создаёт эти зависимости и передаёт их внутрь. 
Таким образом мы избавляемся от самостоятельного создания ==Agregation Root== - теперь он создаётся автоматически и его реализация от нас скрыта, что упрощает наш DI, уменьшая строчки нужного кода

![](_png/Pasted%20image%2020221127205819.png)

Так же в контейнере обычно реализуется сервис локатор, в котором мы регистрируем все наши сервисы, а потом уже можем вытащить конкретный инстанс этого сервиса, чтобы его в дальнейшем использовать
*Такой паттерн не стоит использовать в реальной работе - это просто схожесть с контейнером, который будет использоваться в данной системе - в нашем случае это полезно для тестов и запуска самого приложения*

![](_png/Pasted%20image%2020221127210210.png)

## 069 Декораторы

Всю информацию о декораторах можно найти тут: [Декораторы](../../../TypeScript/_lessons/10%20Декораторы.md)

Сам декоратор представляет из себя обёртку, которая получает тот объект, над которым будут проводиться манипуляции и далее модифицирует поведение этого объекта

Декоратор класса. Он принимает в себя таргет - сам класс и позволяет выполнить какие-либо манипуляции над классом или же просто выполнить что-то вместе с классом. 

```TS
function Component(target: Function) {
	console.log(target);
}

@Component
export class User {
	id: number;

	updateId(newId: number): number {
		this.id = newId;
		return this.id;
	}
}
```

![](_png/Pasted%20image%2020221128100946.png)

И чтобы мы могли изменять свойства нашего класса, мы можем получить функцию и вернуть её же обратно, но модифицированную, как показано ниже в примере. 
Тут мы поменяли внутреннее свойство класса на переданное в декоратор. Декоратор так же сейчас записывается не через `@Component`, а через `@Component(значение)`

```TS
function Component(id: number) {
	console.log("init");
	return (target: Function) => {
		console.log("run");
		target.prototype.id = id;
	};
}

@Component(1)
export class User {
	id: number;

	updateId(newId: number): number {
		this.id = newId;
		return this.id;
	}
}

console.log(new User().id);
```

![](_png/Pasted%20image%2020221128101453.png)

Так же мы можем оборачивать наши объекты сразу в несколько декораторов. Будет идти порядок выполнения снизу вверх в случае классов.
В остальных случаях - сверху вниз

```TS
function Component(id: number) {
	console.log("init Component");
	return (target: Function) => {
		console.log("run Component");
		target.prototype.id = id;
	};
}

function Logger() {
	console.log("init Logger");
	return (target: Function) => {
		console.log("run Logger");
	};
}

@Logger()
@Component(1)
export class User {
	id: number;

	updateId(newId: number): number {
		this.id = newId;
		return this.id;
	}
}

console.log(new User().id);
```

![](_png/Pasted%20image%2020221128101632.png)

Декоратор методов. Так же мы можем вовсе переопределить логику работы методов внутри классов. Декоратор позволяет сохранить изначальную работу метода и просто её дополнить, либо переопределить вовсе.

```TS

// код ...

// это декоратор метода
function Method(
	// сам объект
	target: Object,
	// имя метода
	propertyKey: string,
	propertyDescriptor: PropertyDescriptor
) {
	// тут выводим название метода
	console.log(propertyKey);
	// тут мы сохраняем старый метод
	const oldValue = propertyDescriptor.value;
	// тут уже мы можем поменять работу функции
	propertyDescriptor.value = function (...args: unknown[]) {
		// oldValue(); // таким образом мы можем вызвать исходный метод

		// умножит переданный id на 10, если он является числом
		if (typeof args[0] === "number") {
			return args[0] * 10;
		}
		return args;
	};
}

@Logger()
@Component(1)
export class User {
	id: number;

	@Method
	updateId(newId: number): number {
		this.id = newId;
		return this.id;
	}
}

console.log(new User().id);
console.log(new User().updateId(2)); // 20
```

![](_png/Pasted%20image%2020221128103112.png)

Тут уже представлена работа всех декораторов, включая декораторы свойства и параметра метода 

`полный листинг`
```TS
// Декоратор класса
function Component(id: number) {
	console.log("init Component");

	// чтобы поменять значение свойства класса, нужно вернуть функцию этого класса
	return (target: Function) => {
		console.log("run Component");
		// передаём значение во внутреннее свойство класса
		target.prototype.id = id;
	};
}

// это второй декоратор класса - логгер
function Logger() {
	console.log("init Logger");

	// возвращает сам класс и выводит лог
	return (target: Function) => {
		console.log("run Logger");
	};
}

// это декоратор метода
function Method(
	// сам объект
	target: Object,
	// имя метода
	propertyKey: string,
	propertyDescriptor: PropertyDescriptor
) {
	// тут выводим название метода
	console.log(propertyKey);
	// тут мы сохраняем старый метод
	const oldValue = propertyDescriptor.value;
	// тут уже мы можем поменять работу функции
	propertyDescriptor.value = function (...args: unknown[]) {
		// oldValue(); // таким образом мы можем вызвать исходный метод

		// умножит переданный id на 10, если он является числом
		if (typeof args[0] === "number") {
			return args[0] * 10;
		}
		return args;
	};
}

// декоратор для свойства класса
function Prop(target: Object, propertyKey: string) {
	let value: number;

	// геттер для проперти
	const getter = () => {
		console.log("get");
		return value;
	};

	// сеттер для проперти
	const setter = (newValue: number) => {
		console.log("set");
		value = newValue;
	};

	// переопределяем геттер и сеттер для значения
	Object.defineProperty(target, propertyKey, {
		get: getter,
		set: setter,
	});
}

// декоратор для параметра функции
function Param(
	target: Object,
	propertyKey: string,
	// индекс конкретного параметра функции
	index: number
) {
	console.log(propertyKey, index);
}

@Logger() // срабатывает вторым
@Component(1) // срабатывает первым
export class User {
	// декоратор свойства
	@Prop id: number;

	// декоратор метода + декоратор параметра метода
	@Method
	updateId(@Param newId: number): number {
		this.id = newId;
		return this.id;
	}
}

console.log(new User().id);
console.log(new User().updateId(2)); // 20
```

Это декоратор для свойства класса

![](_png/Pasted%20image%2020221128115216.png)

А тут работа декоратора для аргумента метода

![](_png/Pasted%20image%2020221128115455.png)

## 070 Metadata Reflection

Мы можем осуществлять хранение метаданных наших объектов с помощью библиотеки `Reflect`. 
В ней присутствует метод `defineMetadata()`, которая позволяет присвоить определённый ключ с определённым значением к определённому объекту.
Так же методом `getMetadata()` мы можем по этому ключу получить метаинформацию по объекту 

![](_png/Pasted%20image%2020221128120917.png)



```bash
npm i reflect-metadata
```



```TS
import "reflect-metadata";

function Test(target: Function) {
	// сохранение метадаты под ключом "a" значение 1 под нашим классом
	Reflect.defineMetadata("a", 1, target);

	// получение метаданных под ключом "a" от нашего класса
	const meta = Reflect.getMetadata("a", target);

	console.log(meta);
}

@Test
export class C {}
```

![](_png/Pasted%20image%2020221130150042.png)

Вкупе с этой настройкой компилятора ТС, у нас будет переноситься проверка типов и в наш рантайм (будет работать после компиляции)

`tsconfig.json`
```JSON
"emitDecoratorMetadata": true,
```

Ну и сейчас нужно объяснить связь декораторов и метаданных. Дело в том, что мы можем вызвать декораторы под определённый инстанс класса и делать DI с помощью вызова декоратора, который инджектит инстанс класса при получении конструктором другого класса. То есть идёт связывание классов друг с другом через метаданные, которые сохраняются при вызове декоратора, вызываемого под параметры конструктора или под класс.   

```TS
import "reflect-metadata";

// Pseudocode

function Injectable(key: string) {
	return (target: Function) => {
		Reflect.defineMetadata(key, 1, target);
		const meta = Reflect.getMetadata(key, target);
		console.log(meta);
	};
}

function Inject(key: string) {}

function Prop(target: Object, name: string) {}

// обозначаем класс "C"
@Injectable("C")
export class C {
	@Prop prop: number;
}

// обозначаем класс "D"
@Injectable("D")
export class D {
	// тут идёт связывание инстанса класса "C" с параметром, который передаётся в конструктор
	constructor(@Inject('C') c: C) {}
}
```

## 071 Внедряем InversifyJS


```bash
npm i inversify
```





## 072 Упражнение - Улучшаем DI






