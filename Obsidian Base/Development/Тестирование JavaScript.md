# Тестирование JavaScript от А до Я (Jest, React Testing Library, e2e, screenshot)
#Testing #End2End #Jest #ReactTestingLibrary #Screenshot 

## Введение. Теория. Пирамида тестирования. Квадрат допустимых значений

Тесты позволяют явно увидеть нам изменения в поведении приложения при изменении его логики (тест выдаст ошибку, если наши изменения в приложении ломают логику другой функции). 

> Цель тестирования - проверка соответствия ПО предъявляемым требованиям

Виды тестирования:
- Функциональное
	- ==Модульное (unit)== (70%)
	- ==Интеграционное== (20%)
	- ==end-to-end== (10%)
- Нефункциональное
	- нагрузочное тестирование
	- регрессионное (тестирование старого функционала)
	- тестирование безопасности

![](_png/Pasted%20image%2020230329100050.png)

==Unit-тесты==. Они пишутся на отдельные, независимые, маленькие кусочки системы (например, на методы). Они выполняют простую функцию - проверить работу отдельного маленького кусочка.

![](_png/Pasted%20image%2020230329100640.png)

==Screenshot-тесты==. Они уже позволяют нам проверять интерфейс приложения. 

Если мы поменяем шрифт в одном месте и он поменятся в другом, то такой тест нам сообщит, что изменения произошли в разных местах и выдаст результат.

![](_png/Pasted%20image%2020230329100412.png)

==Integration-тестирование==. Оно уже позволяет просмотреть работу нескольких методов в связке: один компонент рендерит внутри себя список других компонентов по запросу

![](_png/Pasted%20image%2020230329101737.png)

==E2E-тестирование==. Оно уже предназначено для проверки важных модулей системы:
- авторизация
- оплата
- создание сущностей
- удаление записи

![](_png/Pasted%20image%2020230329102003.png)

Квадрат тестирования - это квадрат, который описывает валидные значения, которые может вернуть функция:
- Валидные значения
- Пограничные значения
- Невалидные значения

![](_png/Pasted%20image%2020230329161022.png)

И вот пример использования квадрата:

![](_png/Pasted%20image%2020230329102900.png)

Технологии тестирования:
- `Jest` - самая популярная библиотека для написания любых тестов
- `React-testing-library` - библиотека для тестрования React-приложений
- `WebdriverIO` - E2E-тесты
- `Storybook` + `Loki` - скриншотные-тесты

## Практика. unit тесты с JEST

Устанавливаем в проект библиотеку для тестирования Jest

```bash
npm i -D jest
```

Далее напишем функцию, которую нужно проверить

`validateValue.js`
```JS
const validateValue = (value) => {  
    if (value < 0 || value > 100) {  
        return false;  
    }  
  
    return true;  
}  
  
module.exports = validateValue;
```

И далее нам нужно написать сами тесты для функции:
- `test()` (мы так же можем писать `it()` который является алиасом для `test()`) принимает в себя имя и функцию, которая будет исполнять тестирование
- `expect()` - основная функция, которая используется в тестах - в ней мы описываем, что мы ожидаем от выполнения операции. Внутрь неё передаём операцию и дальше по чейну нужно выбрать одну из функций-проверки
- `toBe()` принимает в себя то значение, которое должно оказаться в expect для успешного прохождения проверки

`validateValue.spec.js`
```JS
const validateValue = require('./validateValue');  
  
test('Валидация значения', () => {  
    expect(validateValue(50)).toBe(true);  
});
```

![](_png/Pasted%20image%2020230407143051.png)

Так же мы можем описать сразу несколько тестов для нужного нам функционала:

`validateValue.spec.js`
```JS
const validateValue = require('./validateValue');

describe('validateValue', () => {
    test('Валидация значения', () => {
        expect(validateValue(50)).toBe(true);
    });

    it('Валидация значения - -1 - fail', () => {
        expect(validateValue(-1)).toBe(false);
    });

    it('Валидация значения - 101 - fail', () => {
        expect(validateValue(101)).toBe(false);
    });
});
```

![](_png/Pasted%20image%2020230407143945.png)

Так же проверяем пограничные значения

![](_png/Pasted%20image%2020230407144333.png)

Так же дальше мы можем попробовать сравнить массивы:

`mapArrToString.js`
```JS
const mapArrToString = (arr) => {
	return arr.filter((item) => Number.isInteger(item)).map(String);
};

module.exports = mapArrToString;
```

Тут мы уже используем другие функции jest:
- `toEqual` проводит глубокое сравнение объектов и позволяет сравнить массивы и объекты (если попробовать через `toBe`, то он выдаст феил, так как он будет сравнивать ссылки, а не значения)
- чейн `not` инвертирует результат следующей операции (если у нас значения не эквивалентны, то `not` выдаст, что они эквивалентны)

`mapArrToString.spec.js`
```JS
const mapArrToString = require('./mapArrToString');

describe('mapArrToString', () => {
	it('Переданы корректные значения - success', () => {
		expect(mapArrToString([1, 2, 3])).toEqual(['1', '2', '3']);
	});

	it('Сместь из значений - fail', () => {
		expect(mapArrToString([1, 2, 3, null, undefined, 'asdasd'])).toEqual(['1', '2', '3']);
	});

	it('Пустой массив - success', () => {
		expect(mapArrToString([])).toEqual([]);
	});

	it('Генерация значений - fail', () => {
		expect(mapArrToString([])).not.toEqual([1, 2, 3]);
	});
});
```

Далее реализуем функционал возведения в степень

`square.js`
```JS
const square = (value) => {
	return value * value;
};

module.exports = square;
```

Так же условий сравнения в методе `expect` крайне большое количество и все из них можно посмотреть в [документации](https://jestjs.io/ru/docs/expect)

Так же jest предоставляет нам 4 функции, которые выполняют побочные действия между тестами:
- `beforeAll` 
- `beforeEach` 
- `afterAll`  
- `afterEach`

`square.spec.js`
```JS
const square = require('./square');

describe('validateValue', () => {
	let mockValue;

	// выполняется перед всеми тестами
	beforeAll(() => {
		mockValue = 3;
		console.log(mockValue);
	});

	// выполняется перед каждым тестом
	beforeEach(() => {
		mockValue++;
		console.log(mockValue);
	});

	it('Успешное значение - success', () => {
		expect(square(2)).toBe(4);
	});

	it('Три теста - success', () => {
		expect(square(2)).toBeLessThan(5);
		expect(square(2)).toBeGreaterThan(3);
		expect(square(2)).not.toBeUndefined();
	});

	// выполняется после всех тестов
	afterEach(() => {
		mockValue++;
		console.log(mockValue);
	});

	// выполняется после всех тестов
	afterAll(() => {
		mockValue = 0;
		console.log(mockValue);
	});
});
```

И теперь каждый тест триггерит изменение нашего значения вышеописанными методами

![](_png/Pasted%20image%2020230407154600.png)

###### Моковые данные

Модифицируем нашу функцию таким образом, чтобы она возводила числов в степень через метод и могла не вызвать эту функцию, если число = 1 

`square.js`
```JS
const square = (value) => {
	if (value === 1) return 1;
	return Math.pow(value, 2);
};

module.exports = square;
```

Для того, чтобы посмотреть сколько раз вызовется определённая функция, мы можем:
- воспользоваться `jest.spyOn`, куда мы передадим библиотеку, за которой следим и её метод
- далее нам нужно вызвать целевую функцию
- и далее в `expect` передать наше моковое значение, где чейном проверяем количество вызовов

`square.spec.js`
```JS
const square = require('./square');  
  
describe('validateValue', () => {  
   it('Успешное значение - success', () => {  
      const spyMathPow = jest.spyOn(Math, 'pow');  
      square(2);  
      expect(spyMathPow).toBeCalledTimes(1);  
   });  
});
```

![](_png/Pasted%20image%2020230407160412.png)

Однако тут нужно сказать, что моковые значения в Jest копятся и не делятся на тесты, поэтому второй шан тест уже выдал ошибку 

`square.spec.js`
```JS
const square = require('./square');  
  
describe('validateValue', () => {  
   it('Успешное значение - success', () => {  
      const spyMathPow = jest.spyOn(Math, 'pow');  
      square(2);  
      expect(spyMathPow).toBeCalledTimes(1);  
   });  
  
   it('Успешное значение - success', () => {  
      const spyMathPow = jest.spyOn(Math, 'pow');  
      square(1);  
      expect(spyMathPow).toBeCalledTimes(0);  
   });  
});
```

![](_png/Pasted%20image%2020230407160452.png)

Чтобы определить нормальное поведение, нужно будет после каждого теста чистить моковые данные с помощью `jest.clearAllMocks()` 

`square.spec.js`
```JS
const square = require('./square');  
  
describe('validateValue', () => {  
   it('Успешное значение - success', () => {  
      const spyMathPow = jest.spyOn(Math, 'pow');  
      square(2);  
      expect(spyMathPow).toBeCalledTimes(1);  
   });  
  
   it('Успешное значение - success', () => {  
      const spyMathPow = jest.spyOn(Math, 'pow');  
      square(1);  
      expect(spyMathPow).toBeCalledTimes(0);  
   });  
  
   afterEach(() => {  
      jest.clearAllMocks();  
   });  
});
```

![](_png/Pasted%20image%2020230407160704.png)

## Юнит тестирование асинхронных функций. Мокаем данные. Snapshots

Реализуем функцию, которая принимает в себя колбэк и время ожидания

`delay.js`
```JS
const delay = (callback, ms) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(callback());
		}, ms);
	});
};

module.exports = delay;
```

И чтобы протестировать её достаточно просто воспользоваться async/await операторами

`delay.spec.js`
```JS
const delay = require('./delay');

describe('mapArrToString', () => {
	it('delay - success', async () => {
		const sum = await delay(() => 4 + 4, 1000);
		expect(sum).toBe(8);
	});
});
```

![](_png/Pasted%20image%2020230407163326.png)

Дальше уже пойдёт функция получения данных с сервера, выделения из них id и перевода их в строки

`getData.js`
```JS
const axios = require('axios');
const mapArrToString = require('../mapArrToString/mapArrToString');

const getData = async () => {
	try {
		const response = await axios.get('https://jsonplaceholder.typicode.com/users');
		const userIds = response.data.map((user) => user.id);
		return mapArrToString(userIds);
	} catch (e) {
		console.error(e);
	}
};

module.exports = getData;
```

Тут нам потребуется уже замокать результат выполнения функции:
- `jest.mock()` - мокает модуль, котрый мы используем
- `mockReturnValue()` - передаёт те данные, которые должна вернуть вызываемая нами функция

Конкретно в данном примере
- сначала мокаем модуль `axios`, 
- затем вызываем его до выполнения нашей функции, которую мы проверяем с передачей замоканных данных
- вызываем функцию, которую мы проверяем
- экспектим данные

`getData.spec.js`
```JS
const axios = require('axios');
const getData = require('./getData');

// мокаем использование модуля аксиоса
jest.mock('axios');

describe('Тесты', () => {
	let response;

	beforeEach(() => {
		response = {
			data: [
				{
					id: 1,
					name: 'Leanne Graham',
					username: 'Bret',
					email: 'Sincere@april.biz',
					address: {
						street: 'Kulas Light',
						suite: 'Apt. 556',
						city: 'Gwenborough',
						zipcode: '92998-3874',
						geo: {
							lat: '-37.3159',
							lng: '81.1496',
						},
					},
					phone: '1-770-736-8031 x56442',
					website: 'hildegard.org',
					company: {
						name: 'Romaguera-Crona',
						catchPhrase: 'Multi-layered client-server neural-net',
						bs: 'harness real-time e-markets',
					},
				},
				{
					id: 2,
					name: 'Ervin Howell',
					username: 'Antonette',
					email: 'Shanna@melissa.tv',
					address: {
						street: 'Victor Plains',
						suite: 'Suite 879',
						city: 'Wisokyburgh',
						zipcode: '90566-7771',
						geo: {
							lat: '-43.9509',
							lng: '-34.4618',
						},
					},
					phone: '010-692-6593 x09125',
					website: 'anastasia.net',
					company: {
						name: 'Deckow-Crist',
						catchPhrase: 'Proactive didactic contingency',
						bs: 'synergize scalable supply-chains',
					},
				},
			],
		};
	});

	it('Корректный результат', async () => {
		// вставляем в результат работы функции моковые данные
		axios.get.mockReturnValue(response);

		// вызываем саму функцию getData
		const data = await getData();

		// проверям количество раз срабатываний функции axios внутри getData
		expect(axios.get).toBeCalledTimes(1);

		// проверяем полученные данные
		expect(data).toEqual(['1', '2']);
	});
});
```


![](_png/Pasted%20image%2020230408101549.png)




![](_png/Pasted%20image%2020230408102126.png)

![](_png/Pasted%20image%2020230408102054.png)

![](_png/Pasted%20image%2020230408102207.png)

## Тестирование React приложений. React Testing library





## findBy, getBy, queryBy. Пример с useEffect. Асинхронный код





## Тестирование событий. onClick, onChange, onInput. FireEvent, userEvent





## Тестирование компонента с асинхронной загрузкой данных с сервера





## Интеграционное тестирование в связке с react router dom v6





## Хелпер для удобного тестирования роутинга





## Интеграционное тестирование в связке с Redux toolkit





## Тестируем селектор





## Хелпер для удобного тестирования компонентов, в которых используется Redux





## e2e тесты с WebdriverIO





## PageObject паттерн





## Пример е2е теста с асинхронным кодом





## Скриншотные тесты storybook и loki js










