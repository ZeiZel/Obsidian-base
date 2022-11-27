## 068 Разбор DI и IOC

DI - dependency injection
IOC - inversion of control

Само явление внедрения зависимостей избавляет нас от потребности инстанциирования объекта внутри самого класса. Таким образом, мы можем внедрять разный функционал по заранее определённому интерфейсу.
Такой подход так же позволяет отделить программный компонент, чтобы его отдельно протестировать

![](_png/Pasted%20image%2020221127183336.png)

Совершить самое простое внедрение зависимостей можно:
1) Через конструктор
2) Либо через метод

![](_png/Pasted%20image%2020221127202735.png)

Composition root - это одна точка, в которой собираются все зависимости с приложения

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



`app.ts`
```TS
export class App {
	private app: Express;
	private server: Server;
	private port: number;
	// принимает в себя 
	private logger: ILogger;
	private userController: UserController;
	private exceptionFilter: ExceptionFilter;

	constructor(
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

















## 069 Декораторы







## 070 Metadata Reflection







## 071 Внедряем InversifyJS







## 072 Упражнение - Улучшаем DI






