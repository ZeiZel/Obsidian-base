---
tags:
  - cs
  - oop
  - fp
  - programming
  - paradigms
  - concurrency
  - async
---

#oop #fp #programming #concurrency #async

# Программирование: парадигмы, концепции, паттерны

Эта статья — единый справочник по базовым концепциям программирования: от парадигм ООП и ФП до управления памятью и компиляции. Связанные темы: [[principles]], [[GIT]], [[System Design]], [[Golang Basics]].

---

## 1. Парадигмы программирования

**Парадигма программирования** — это набор концепций, принципов и стиля, которые определяют, как писать и организовывать код. Парадигма задаёт модель мышления о задаче.

### Императивная vs Декларативная

Есть два глобальных подхода:

- **Императивный** → *Как* хотим получить? → Описываем действия пошагово
- **Декларативный** → *Что* хотим получить? → Описываем желаемый результат

В основе всегда стоит императивный подход, поверх которого строятся декларативные абстракции.

**Императивный пример** (явный цикл, ручное управление состоянием):

```javascript
const arr = [1, 2, 3, 4, 5, 6];

function getEvens(arr) {
  const evens = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) {
      evens.push(arr[i]);
    }
  }
  return evens;
}

console.log(getEvens(arr)); // [2, 4, 6]
```

**Декларативный пример** (говорим *что* нужно, скрываем *как*):

```javascript
const arr = [1, 2, 3, 4, 5, 6];
const evens = arr.filter(x => x % 2 === 0);
console.log(evens); // [2, 4, 6]
```

> [!NOTE] Декларативность — это свойство хорошего кода. Стремись строить абстракции поверх низкоуровневых операций.

### Процедурное программирование

Процедурное программирование — это стиль, при котором программа состоит из последовательности процедур (функций), вызываемых в определённом порядке. Данные и логика существуют раздельно.

```c
// C — процедурный стиль
int width = 5;
int height = 10;

int calcRectArea(int w, int h) {
    return w * h;
}

int main() {
    int area = calcRectArea(width, height);
    return 0;
}
```

```python
# Python — процедурный стиль
width = 5
height = 10

def calc_rect_area(w, h):
    return w * h

area = calc_rect_area(width, height)
```

Процедурный подход труднее масштабировать: при росте кодовой базы становится сложнее отслеживать, какие функции изменяют какие данные.

---

### ООП — Объектно-Ориентированное Программирование

#oop

ООП — парадигма, в которой программа строится из объектов, объединяющих данные (свойства) и поведение (методы). Ключевые принципы: инкапсуляция, наследование, полиморфизм, абстракция.

#### Классы, объекты, конструкторы

**Класс** — описание характеристик будущего объекта (шаблон/чертёж).  
**Объект** — конкретный экземпляр класса с конкретными значениями.  
**Свойства** — характеристики объекта (данные).  
**Методы** — функции, принадлежащие объекту (поведение).  
**Конструктор** — специальный метод, вызываемый при создании объекта.

```typescript
class Rectangle {
    width: number;
    height: number;

    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    calcArea(): number {
        return this.width * this.height;
    }
}

const rect = new Rectangle(5, 10);
rect.calcArea(); // 50
```

`this` — всегда ссылка на текущий объект. Можно создавать сколько угодно экземпляров одного класса.

#### Инкапсуляция и модификаторы доступа

**Инкапсуляция** — объединение данных и функций; данные внутри класса недоступны для изменения снаружи напрямую.

> [!INFO] Инкапсуляция обеспечивает сокрытие данных, но не является самим сокрытием. Механизм рефлексии в некоторых языках позволяет обойти приватность.

**Модификаторы доступа** в TypeScript:
- `private` — доступ только внутри класса
- `protected` — доступ внутри класса и наследников
- `public` — доступен везде (по умолчанию)

Для доступа к приватным полям используют **геттеры** и **сеттеры**:

```typescript
class Rectangle {
    private _width: number;
    private _height: number;

    constructor(w: number, h: number) {
        this._width = w;
        this._height = h;
    }

    public get width(): number {
        return this._width;
    }

    public set width(value: number) {
        if (value <= 0) {
            this._width = 1;
        } else {
            this._width = value;
        }
    }

    calcArea(): number {
        return this._width * this._height;
    }
}
```

Если сеттер отсутствует — свойство readonly. Если геттер отсутствует — получить значение невозможно.

#### Наследование

**Наследование** — механизм переиспользования кода через передачу его дочернему классу. Дочерний класс наследует свойства и методы родителя и может расширять или переопределять их.

```typescript
class Person {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    greet(): string {
        return `Привет, я ${this.name}`;
    }
}

class Developer extends Person {
    language: string;

    constructor(name: string, age: number, language: string) {
        super(name, age); // вызов конструктора родителя
        this.language = language;
    }

    code(): string {
        return `${this.name} пишет на ${this.language}`;
    }
}

class SeniorDeveloper extends Developer {
    yearsOfExperience: number;

    constructor(name: string, age: number, language: string, years: number) {
        super(name, age, language);
        this.yearsOfExperience = years;
    }

    mentor(): string {
        return `${this.name} менторит джунов`;
    }
}
```

> [!WARNING] Наследование может быть вредно в реальных проектах. При большом числе наследников изменение родительского класса ломает всех потомков — это называется **проблемой хрупкого базового класса**. Глубокая иерархия (3+ уровней) становится трудно понимаемой и сопровождаемой. Предпочитай **композицию** наследованию.

#### Полиморфизм

**Полиморфизм** — «один интерфейс — множество реализаций». Позволяет работать с разными типами через единый интерфейс.

Выделяют три вида:

**1. Ad Hoc полиморфизм (перегрузка методов)**  
Один и тот же метод с разными сигнатурами. В TypeScript нативная перегрузка не поддерживается, но существует через union-типы:

```typescript
class Calculator {
    add(a: number, b: number): number;
    add(a: string, b: string): string;
    add(a: any, b: any): any {
        return a + b;
    }
}

const calc = new Calculator();
calc.add(5, 5);    // 10
calc.add("5", "5"); // "55"
```

**2. Параметрический полиморфизм (Generics)**  
Код работает с любым типом через параметр типа:

```typescript
class Repository<T> {
    private items: T[] = [];

    add(item: T): void {
        this.items.push(item);
    }

    getAll(): T[] {
        return this.items;
    }
}

const userRepo = new Repository<User>();
const carRepo = new Repository<Car>();
```

**3. Полиморфизм подтипов (переопределение)**  
Дочерний класс переопределяет метод родителя. Объекты разных типов обрабатываются единообразно:

```typescript
class Animal {
    speak(): string {
        return "...";
    }
}

class Dog extends Animal {
    speak(): string {
        return "Гав!";
    }
}

class Cat extends Animal {
    speak(): string {
        return "Мяу!";
    }
}

const animals: Animal[] = [new Dog(), new Cat(), new Dog()];
animals.forEach(a => console.log(a.speak()));
// Гав! Мяу! Гав!
```

#### Абстракция

**Абстракция** — выделение существенных характеристик объекта, скрытие деталей реализации. Реализуется через **интерфейсы** и **абстрактные классы**.

```typescript
// Интерфейс — только контракт, без реализации
interface UserRepository {
    getUsers: () => User[];
    getUserById: (id: number) => User | null;
}

// Абстрактный класс — контракт + частичная реализация
abstract class BaseRepository<T> {
    abstract findAll(): T[];
    abstract findById(id: number): T | null;

    // Конкретный метод — общий для всех
    exists(id: number): boolean {
        return this.findById(id) !== null;
    }
}
```

- Интерфейс: только "оглавление" — что должно быть. Один класс может реализовывать несколько интерфейсов.
- Абстрактный класс: схема + базовая логика. Нельзя создать экземпляр напрямую.

#### Агрегация, Композиция, Ассоциация

| Отношение | Суть | Жизненный цикл | Пример |
|-----------|------|----------------|--------|
| **Ассоциация** | Объекты знают друг о друге | Независимый | Учитель ↔ Ученик |
| **Агрегация** | Объект содержит другой, но тот может жить отдельно | Независимый | Машина → Ёлочка-освежитель |
| **Композиция** | Объект владеет другим, тот не может существовать отдельно | Зависимый | Машина → Двигатель, Колёса |

```typescript
// Композиция: Engine и Wheel создаются внутри Car
class Wheel {
    drive(): void { console.log("Колесо едет"); }
}

class Engine {
    start(): void { console.log("Двигатель заведён"); }
}

class Car {
    private engine: Engine;
    private wheels: Wheel[];

    constructor() {
        this.engine = new Engine();  // создаётся вместе с Car
        this.wheels = Array.from({ length: 4 }, () => new Wheel());
    }

    drive(): void {
        this.engine.start();
        this.wheels.forEach(w => w.drive());
    }
}

// Агрегация: AirFreshener живёт независимо
class AirFreshener {
    smell(): void { console.log("Пахнет ёлкой"); }
}

class CarWithFreshener {
    private freshener: AirFreshener;

    constructor(freshener: AirFreshener) {  // передаётся снаружи
        this.freshener = freshener;
    }
}

const freshener = new AirFreshener();
const car = new CarWithFreshener(freshener);
// freshener живёт и после удаления car
```

#### Внедрение зависимостей (Dependency Injection)

DI — передача зависимостей снаружи, а не создание внутри. Позволяет подменять реализации через интерфейс:

```typescript
// Интерфейс-абстракция
interface UserRepository {
    getUsers: () => User[];
}

// Разные реализации одного интерфейса
class MongoDBRepository implements UserRepository {
    getUsers(): User[] {
        console.log("Get users from MongoDB");
        return [];
    }
}

class PostgresRepository implements UserRepository {
    getUsers(): User[] {
        console.log("Get users from PostgreSQL");
        return [];
    }
}

// Сервис зависит от абстракции, а не от конкретной реализации
class UserService {
    constructor(private userRepository: UserRepository) {}

    filterUserByAge(age: number): User[] {
        const users = this.userRepository.getUsers();
        return users.filter(u => u.age === age);
    }
}

const service = new UserService(new MongoDBRepository());
// или
const service2 = new UserService(new PostgresRepository());
```

#### Паттерн Singleton

Гарантирует создание только одного экземпляра класса:

```typescript
class Database {
    private static instance: Database;
    private url: string;

    private constructor() {
        this.url = `db://localhost/${Math.random()}`;
    }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true — один и тот же объект
```

#### Критика ООП

- **Проблема хрупкого базового класса**: изменение родителя ломает всех потомков
- **Глубокая иерархия**: 4-5 уровней наследования — признак плохого дизайна
- **Состояние**: мутабельный стейт объектов затрудняет параллелизм и тестирование
- **Гибкость**: интерфейсы и DI решают большинство проблем без наследования

> [!TIP] "Предпочитай композицию наследованию" — один из ключевых принципов GoF.

---

### Функциональное программирование

#fp

ФП — парадигма, при которой программа строится из математических функций. Функции — это значения первого класса: их можно передавать, возвращать и хранить в переменных.

#### Процедуры vs Функции vs Методы

| Понятие | Возвращает значение | Имеет побочные эффекты | Принадлежит объекту |
|---------|---------------------|------------------------|---------------------|
| **Процедура** | Нет (void) | Да | Нет |
| **Функция** | Да (детерминировано) | Нет (в идеале) | Нет |
| **Метод** | Может | Может | Да |

```javascript
// Процедура — выполняет действие, ничего не возвращает
function printUser(user) {
    console.log(user.name); // побочный эффект — вывод в консоль
}

// Функция — вычисляет и возвращает результат
function add(a, b) {
    return a + b; // детерминировано, нет побочных эффектов
}

// Метод — принадлежит объекту
class Counter {
    count = 0;
    increment() { this.count++; } // метод с побочным эффектом
    getValue() { return this.count; } // метод-геттер
}
```

#### Чистые функции

**Чистая функция** — функция, которая:
1. При одинаковых аргументах всегда возвращает одинаковый результат (детерминированность)
2. Не имеет побочных эффектов (не изменяет внешние переменные, не пишет в консоль, не делает сетевых запросов)

```javascript
// Чистые функции
function add(a, b) { return a + b; }
function multiplyBy2(arr) { return arr.map(x => x * 2); }
function isEven(n) { return n % 2 === 0; }

// НЕ чистая функция — зависит от внешнего состояния
let counter = 0;
function increment() {
    counter += 1; // изменяет внешнюю переменную
    return counter;
}
```

Чистые функции легко тестировать, кэшировать (мемоизация) и выполнять параллельно.

#### Иммутабельность

**Иммутабельность** — данные после создания не изменяются; вместо мутации создаётся копия с изменениями.

```javascript
// Мутабельный подход (опасно)
const arr = [1, 2, 3];
arr.push(4);    // изменяет оригинал!
arr.sort();     // изменяет оригинал!

// Иммутабельный подход
const arr = [1, 2, 3];
const newArr = [...arr, 4];        // [1, 2, 3, 4], arr не изменился
const sorted = [...arr].sort();    // копируем перед сортировкой

// Для объектов
const user = { name: "Анна", age: 25 };
const updatedUser = { ...user, age: 26 }; // новый объект
```

Опасные методы в JS: `sort`, `splice`, `push`, `pop`, `reverse` — мутируют массив.  
Безопасные: `map`, `filter`, `reduce`, `slice`, `toSorted` (ES2023), `toReversed` (ES2023).

#### Функции высшего порядка

**Функции высшего порядка** — функции, которые принимают другую функцию как аргумент или возвращают функцию.

```javascript
// map — применяет функцию к каждому элементу
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2); // [2, 4, 6, 8, 10]

// filter — оставляет элементы, удовлетворяющие условию
const evens = numbers.filter(x => x % 2 === 0); // [2, 4]

// reduce — сворачивает массив в одно значение
const sum = numbers.reduce((acc, x) => acc + x, 0); // 15

// Своя функция высшего порядка
function withLogging(fn) {
    return function(...args) {
        console.log(`Вызов с аргументами: ${args}`);
        const result = fn(...args);
        console.log(`Результат: ${result}`);
        return result;
    };
}

const loggedAdd = withLogging(add);
loggedAdd(2, 3); // логирует и возвращает 5
```

#### Каррирование

**Каррирование** — преобразование функции с несколькими аргументами в последовательность функций, каждая из которых принимает один аргумент.

```javascript
// Обычная функция
const userHasRole = (user, role) => user.roles.includes(role);

// Каррированная версия
const userHasRoleCurried = user => role => user.roles.includes(role);

const operator = { name: "Анна", roles: ["USER", "ADMIN"] };

// Фиксируем первый аргумент
const clientHasRole = userHasRoleCurried(operator);

clientHasRole("ADMIN");   // true
clientHasRole("MANAGER"); // false
```

**Автокаррирование** — универсальная функция-обёртка:

```javascript
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        } else {
            return function(...nextArgs) {
                return curried.apply(this, args.concat(nextArgs));
            };
        }
    };
}

const curriedAdd = curry((a, b, c) => a + b + c);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
curriedAdd(1)(2, 3); // 6
```

#### Частичное применение

**Частичное применение** — фиксация части аргументов функции для создания новой функции с меньшим числом аргументов.

```javascript
const userHasRole = (user, role) => user.roles.includes(role);

const operator = { name: "Анна", roles: ["USER", "ADMIN"] };

// Вариант 1: замыкание
const clientHasRole = role => userHasRole(operator, role);

// Вариант 2: bind (нативный способ)
const clientHasRoleBound = userHasRole.bind(null, operator);

// Дальнейшее применение
const isClientAdmin = () => clientHasRole("ADMIN");

// Цепочка упрощений:
userHasRole(operator, "ADMIN")
// → clientHasRole("ADMIN")
// → isClientAdmin()
```

#### Композиция функций

**Композиция** — применение одной функции к результату другой.

```javascript
// Базовая композиция: fn1(fn2(fn3(x)))
fn1(fn2(fn3("hello")));

// Функция-композитор (выполнение справа налево)
const compose = (...funcs) => (initialValue) =>
    funcs.reduceRight((acc, fn) => fn(acc), initialValue);

const upperCase = str => str.toUpperCase();
const exclaim = str => str + "!";
const repeat = str => `${str} `.repeat(2).trim();

const transform = compose(repeat, exclaim, upperCase);
transform("hello"); // "HELLO! HELLO!"

// Pipe (слева направо — более читаемо)
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const double = x => x * 2;
const increment = x => x + 1;
const square = x => x * x;

const process = pipe(double, increment, square);
process(3); // ((3 * 2) + 1)² = 49
```

#### Замыкания (Closures)

**Замыкание** — функция, которая "запоминает" переменные из своего лексического окружения (из области видимости, где она была создана), даже после того, как это окружение перестало существовать.

```javascript
// Счётчик через замыкание
function makeCounter(initialValue = 0) {
    let count = initialValue; // переменная "захвачена" замыканием

    return {
        increment: () => ++count,
        decrement: () => --count,
        getValue: () => count,
    };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.getValue();  // 12

// Мемоизация через замыкание
function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

const expensiveCalc = memoize((n) => {
    // тяжёлые вычисления
    return n * n;
});
```

#### Рекурсия vs Итерация

```javascript
// Итерация (цикл)
function factorialIterative(n) {
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Рекурсия
function factorialRecursive(n) {
    if (n <= 1) return 1;           // базовый случай
    return n * factorialRecursive(n - 1); // рекурсивный случай
}

// Хвостовая рекурсия (TCO — оптимизация стека)
function factorialTail(n, acc = 1) {
    if (n <= 1) return acc;
    return factorialTail(n - 1, n * acc); // хвостовой вызов
}
```

> [!NOTE] JavaScript не гарантирует оптимизацию хвостовой рекурсии. Для глубокой рекурсии предпочитай итерацию или trampolining.

#### Монады

**Монада** — структура-обёртка с методом `flatMap` (или `chain`), позволяющим строить цепочки вычислений без вложенных структур.

Иерархия: **Контейнер → Функтор (map) → Монада (flatMap)**

```typescript
// Функтор: map применяет функцию к значению внутри
class Box<T> {
    private constructor(private readonly value: T) {}

    static of<T>(value: T): Box<T> {
        return new Box(value);
    }

    // Функтор: применяет функцию, возвращает новый Box
    map<U>(fn: (x: T) => U): Box<U> {
        return Box.of(fn(this.value));
    }

    // Монада: функция возвращает Box, не оборачиваем повторно
    flatMap<U>(fn: (x: T) => Box<U>): Box<U> {
        return fn(this.value);
    }

    fold<U>(fn: (x: T) => U): U {
        return fn(this.value);
    }
}

Box.of(10)
    .map(x => x + 5)       // Box(15)
    .map(x => x * 2)       // Box(30)
    .fold(x => `Результат: ${x}`); // "Результат: 30"

Box.of(8)
    .flatMap(x => Box.of(x * 2))       // Box(16), не Box(Box(16))
    .flatMap(x => Box.of(`box:${x}`)); // Box("box:16")
```

**Практические монады:**

| Монада | Назначение | Пример |
|--------|-----------|--------|
| `Maybe/Option` | Безопасная работа с null | `user?.address?.city` |
| `Either` | Результат или ошибка | `Result<T, E>` в Rust |
| `Promise` | Асинхронные вычисления | `fetch().then().then()` |
| `Array` | Список значений | `flatMap` разворачивает массивы |

```typescript
// Maybe-монада для безопасной работы с null
class Maybe<T> {
    private constructor(private readonly value: T | null) {}

    static of<T>(value: T | null): Maybe<T> {
        return new Maybe(value);
    }

    map<U>(fn: (x: T) => U): Maybe<U> {
        if (this.value === null) return Maybe.of<U>(null);
        return Maybe.of(fn(this.value));
    }

    flatMap<U>(fn: (x: T) => Maybe<U>): Maybe<U> {
        if (this.value === null) return Maybe.of<U>(null);
        return fn(this.value);
    }

    getOrElse(defaultValue: T): T {
        return this.value !== null ? this.value : defaultValue;
    }
}

const city = Maybe.of(getUser())
    .flatMap(user => Maybe.of(user.address))
    .map(addr => addr.city)
    .getOrElse("Неизвестный город");
```

---

### Мультипарадигменность

Большинство современных языков поддерживают несколько парадигм:

| Язык | ООП | ФП | Процедурное | Особенности |
|------|-----|----|-------------|-------------|
| **JavaScript** | ✓ | ✓ | ✓ | Прототипное наследование, замыкания |
| **TypeScript** | ✓ | ✓ | ✓ | Статическая типизация поверх JS |
| **Python** | ✓ | ✓ | ✓ | Множественное наследование, list comprehensions |
| **Go** | частично | ✓ | ✓ | Интерфейсы (без наследования), горутины |
| **Rust** | ✓ | ✓ | ✓ | Ownership, трейты вместо классов |
| **Kotlin** | ✓ | ✓ | ✓ | Data classes, extension functions |

```go
// Go — интерфейсы как утиная типизация, без наследования
type Speaker interface {
    Speak() string
}

type Dog struct{ Name string }
func (d Dog) Speak() string { return "Гав!" }

type Cat struct{ Name string }
func (c Cat) Speak() string { return "Мяу!" }

func makeNoise(s Speaker) {
    fmt.Println(s.Speak())
}

// Работает для Dog и Cat без явного implements
makeNoise(Dog{Name: "Бобик"})
makeNoise(Cat{Name: "Мурзик"})
```

---

## 2. Базовые строительные блоки

### Процедуры vs Функции vs Методы

| | Процедура | Функция | Метод |
|--|-----------|---------|-------|
| **Возвращает значение** | Нет | Да | Может |
| **Побочные эффекты** | Обычно да | Нет (чистая) | Может |
| **Принадлежит** | Глобальная/модуль | Глобальная/модуль | Объекту/классу |
| **Примеры** | `void print(x)` | `int add(a, b)` | `obj.save()` |

```python
# Процедура (Python)
def print_report(data):
    print(data)  # нет return, есть побочный эффект

# Функция (Python)
def calculate_tax(income, rate):
    return income * rate  # детерминировано

# Метод (Python)
class BankAccount:
    def deposit(self, amount):    # метод с побочным эффектом
        self.balance += amount
    def get_balance(self):         # метод-геттер
        return self.balance
```

```go
// Go
func printReport(data string) {  // процедура (возвращает void)
    fmt.Println(data)
}

func add(a, b int) int {  // функция
    return a + b
}

type Counter struct{ count int }
func (c *Counter) Increment() { c.count++ }  // метод
```

### Лямбды / Анонимные функции

Функции без имени, часто используемые как аргументы.

```javascript
// JavaScript
const double = x => x * 2;
const add = (a, b) => a + b;
[1, 2, 3].map(x => x * 2);

// Многострочная
const process = (arr) => {
    const filtered = arr.filter(x => x > 0);
    return filtered.reduce((sum, x) => sum + x, 0);
};
```

```python
# Python
double = lambda x: x * 2
add = lambda a, b: a + b
sorted_items = sorted(items, key=lambda x: x.name)
```

```go
// Go
double := func(x int) int { return x * 2 }
result := double(5) // 10

// Как аргумент
apply := func(nums []int, fn func(int) int) []int {
    result := make([]int, len(nums))
    for i, n := range nums { result[i] = fn(n) }
    return result
}
apply([]int{1, 2, 3}, func(x int) int { return x * x })
```

### Дженерики / Generics

Дженерики позволяют писать код, работающий с любым типом, обеспечивая типобезопасность.

```typescript
// TypeScript Generics
function identity<T>(arg: T): T {
    return arg;
}

// Ограничения типа
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

// Generic-класс
class Stack<T> {
    private items: T[] = [];

    push(item: T): void { this.items.push(item); }
    pop(): T | undefined { return this.items.pop(); }
    peek(): T | undefined { return this.items[this.items.length - 1]; }
    isEmpty(): boolean { return this.items.length === 0; }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
numStack.pop(); // 2
```

```go
// Go 1.18+ Generics
func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice { result[i] = fn(v) }
    return result
}

Map([]int{1, 2, 3}, func(x int) string {
    return fmt.Sprintf("%d", x*x)
}) // ["1", "4", "9"]
```

### Перегрузка vs Переопределение

| | Перегрузка (Overloading) | Переопределение (Overriding) |
|--|--------------------------|------------------------------|
| **Уровень** | Один класс | Родитель + потомок |
| **Что меняется** | Сигнатура (параметры) | Реализация метода |
| **Когда** | Compile-time | Runtime |
| **Полиморфизм** | Ad Hoc | Подтипов |

```typescript
// Перегрузка (overloading)
class StringProcessor {
    process(input: string): string;
    process(input: string[]): string[];
    process(input: any): any {
        if (Array.isArray(input)) return input.map(s => s.toUpperCase());
        return input.toUpperCase();
    }
}

// Переопределение (overriding)
class Shape {
    area(): number { return 0; }
}

class Circle extends Shape {
    constructor(private radius: number) { super(); }
    area(): number { return Math.PI * this.radius ** 2; } // переопределяем
}
```

### Область видимости (Scope)

| Тип Scope | Описание | Пример |
|-----------|---------|--------|
| **Global** | Доступно везде | `var x = 1` в корне модуля |
| **Local/Function** | Внутри функции | `let` внутри `function` |
| **Block** | Внутри `{}` | `let`/`const` внутри `if`, `for` |
| **Lexical** | Дочерние функции видят переменные родителя | Замыкания |

```javascript
// Block scope
{
    let blockVar = "блок";
    const blockConst = "константа";
    var functionVar = "функция"; // всплывает до функции!
}
// blockVar и blockConst здесь недоступны
// functionVar доступна

// Lexical scope
function outer() {
    const x = 10;
    function inner() {
        console.log(x); // видит x из outer — лексическое замыкание
    }
    return inner;
}
```

### Типизация

| Тип | Описание | Примеры языков |
|-----|---------|----------------|
| **Статическая** | Типы проверяются при компиляции | TypeScript, Java, Go, Rust |
| **Динамическая** | Типы проверяются в рантайме | JavaScript, Python, Ruby |
| **Строгая** | Неявные преобразования запрещены | Python, Rust |
| **Слабая** | Неявные преобразования разрешены | JavaScript, PHP |
| **Duck typing** | "Если крякает — утка" | Python, JavaScript |
| **Структурная** | Совместимость по структуре, а не имени | TypeScript, Go |

```typescript
// Структурная типизация в TypeScript
interface Flyable {
    fly(): void;
}

class Bird {
    fly() { console.log("Птица летит"); }
    sing() { console.log("Чирик"); }
}

class Airplane {
    fly() { console.log("Самолёт летит"); }
}

function makeItFly(obj: Flyable) {
    obj.fly();
}

// Оба подходят, даже без явного implements Flyable
makeItFly(new Bird());
makeItFly(new Airplane());
```

```python
# Duck typing в Python
class Duck:
    def quack(self): print("Кря!")

class Person:
    def quack(self): print("Я человек-утка")

def make_it_quack(duck):  # нет типа — работает для любого с quack()
    duck.quack()

make_it_quack(Duck())    # Кря!
make_it_quack(Person())  # Я человек-утка
```

---

## 3. Процессы и потоки

#concurrency

### Процесс

**Процесс** — запущенная программа со своим изолированным адресным пространством.

- Каждый процесс имеет свою копию памяти (стек, хип, код, данные)
- **PCB (Process Control Block)** — структура ОС для хранения состояния процесса (PID, регистры, таблица файлов)
- `fork()` — системный вызов для создания дочернего процесса (копия родителя)
- Процессы изолированы: крах одного не убивает другой
- Взаимодействие через IPC: pipe, socket, shared memory, message queue

### Поток (Thread)

**Поток** — единица выполнения внутри процесса. Потоки одного процесса разделяют память (heap, глобальные переменные), но имеют собственный стек и регистры.

| | Процесс | Поток |
|--|---------|-------|
| **Память** | Изолированная | Разделяемая внутри процесса |
| **Создание** | Медленно (fork) | Быстро |
| **Переключение** | Дорого | Дешевле |
| **Падение** | Изолировано | Может убить весь процесс |
| **IPC** | Сложнее | Проще (общая память) |

### Stack vs Heap

| | Stack | Heap |
|--|-------|------|
| **Управление** | Автоматическое (LIFO) | Ручное / GC |
| **Размер** | Ограниченный (~1-8 МБ) | Практически не ограничен |
| **Скорость** | Быстрее | Медленнее (аллокация) |
| **Что хранится** | Локальные переменные, вызовы функций | Объекты, динамические данные |
| **Жизненный цикл** | До конца функции | Управляется явно или GC |

### Многопоточность: проблемы

> [!WARNING] **Race Condition** — ситуация, когда несколько потоков одновременно читают и изменяют общие данные, и результат зависит от порядка выполнения. Это один из самых сложных для отладки багов.

```python
# Race condition пример
import threading

counter = 0

def increment():
    global counter
    for _ in range(100000):
        counter += 1  # НЕ атомарная операция! Три шага: read, add, write

threads = [threading.Thread(target=increment) for _ in range(10)]
for t in threads: t.start()
for t in threads: t.join()

print(counter)  # Ожидаем 1_000_000, но может быть меньше!
```

| Проблема | Описание | Пример |
|----------|---------|--------|
| **Race Condition** | Результат зависит от порядка выполнения потоков | Два потока читают `counter = 5`, оба инкрементируют, оба пишут `6` вместо `7` |
| **Deadlock** | Два потока ждут ресурсы друг друга бесконечно | A ждёт lock B, B ждёт lock A |
| **Livelock** | Потоки активно реагируют друг на друга, не продвигаясь | Два человека в узком коридоре — вечно уступают |
| **Starvation** | Поток не получает CPU из-за постоянной занятости другими | Низкоприоритетный поток никогда не запускается |

### Примитивы синхронизации

| Примитив | Что делает | Когда использовать |
|----------|-----------|-------------------|
| **Mutex** | Взаимное исключение — только один поток в критической секции | Защита разделяемого ресурса |
| **Semaphore** | Счётчик — ограничивает число одновременных обращений | Пул соединений, ограничение concurrent-запросов |
| **Monitor** | Mutex + условные переменные (wait/notify) | Producer-consumer, ожидание условия |
| **RWMutex** | Много читателей, один писатель | Read-heavy данные (кэш, конфиг) |

```go
// Mutex в Go
import "sync"

type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++ // теперь атомарно
}
```

### Thread Pool

**Thread Pool** — заранее созданный набор потоков, которые берут задачи из очереди. Избегает накладных расходов на создание/уничтожение потоков для каждой задачи.

```
[Task Queue] → [Thread 1]
             → [Thread 2]
             → [Thread 3]
             → [Thread N]
```

Применение: HTTP-серверы, обработка файлов, CPU-bound вычисления.

---

## 4. Асинхронность

#async

### Синхронный vs Асинхронный vs Параллельный

| | Синхронный | Асинхронный | Параллельный |
|--|-----------|------------|--------------|
| **Выполнение** | Последовательно, ждём | Не ждём, продолжаем | Одновременно |
| **Потоков** | 1 | 1 (event loop) | N |
| **Подходит для** | Простая логика | I/O-bound задачи | CPU-bound задачи |
| **Пример** | `fs.readFileSync` | `fetch()` | Web Workers, goroutines |

### Event Loop

Event Loop — механизм выполнения асинхронного кода в однопоточных средах (Node.js, браузер).

```
┌─────────────────────────────────┐
│          Call Stack             │  ← Выполняемый код
│  (main, setTimeout callback...) │
└─────────────────┬───────────────┘
                  │ пуст?
                  ↓
┌─────────────────────────────────┐
│       Microtask Queue           │  ← Promise.then, queueMicrotask
│   (выполняется ДО macrotasks)   │
└─────────────────┬───────────────┘
                  │ пуст?
                  ↓
┌─────────────────────────────────┐
│        Macrotask Queue          │  ← setTimeout, setInterval, I/O
│                                 │
└─────────────────────────────────┘
```

Event Loop постоянно проверяет: если Call Stack пуст — берёт следующую задачу из очереди.

```javascript
console.log("1");                          // синхронно

setTimeout(() => console.log("2"), 0);     // macrotask

Promise.resolve().then(() => console.log("3")); // microtask

console.log("4");                          // синхронно

// Вывод: 1, 4, 3, 2
// Microtasks выполняются раньше macrotasks!
```

### I/O-bound vs CPU-bound

| | I/O-bound | CPU-bound |
|--|-----------|-----------|
| **Узкое место** | Ожидание ввода/вывода | Вычисления |
| **Примеры** | HTTP-запросы, БД, файлы | Шифрование, видео, ML |
| **Решение** | Async/await, Event Loop | Threads, Workers, goroutines |
| **Async помогает?** | Да (основной use case) | Нет (нужны потоки/процессы) |

### Callbacks → Promises → Async/Await

Эволюция асинхронного кода:

```javascript
// 1. Callbacks (callback hell)
getUser(userId, (err, user) => {
    if (err) handleError(err);
    getOrders(user.id, (err, orders) => {
        if (err) handleError(err);
        getProducts(orders[0].id, (err, products) => {
            if (err) handleError(err);
            // "Callback hell" / "Pyramid of Doom"
        });
    });
});

// 2. Promises (цепочка)
getUser(userId)
    .then(user => getOrders(user.id))
    .then(orders => getProducts(orders[0].id))
    .then(products => console.log(products))
    .catch(err => handleError(err));

// 3. Async/Await (синхронно выглядящий код)
async function loadUserData(userId) {
    try {
        const user = await getUser(userId);
        const orders = await getOrders(user.id);
        const products = await getProducts(orders[0].id);
        return products;
    } catch (err) {
        handleError(err);
    }
}

// Параллельное выполнение через Promise.all
async function loadParallel(ids) {
    const [users, orders] = await Promise.all([
        getUsers(ids),
        getOrders(ids)
    ]);
    return { users, orders };
}
```

### Реактивное программирование

Реактивное программирование — работа с потоками данных и их трансформациями.

```typescript
// RxJS — потоки данных
import { fromEvent, interval } from 'rxjs';
import { map, filter, debounceTime, switchMap } from 'rxjs/operators';

// Поток событий поиска с дебаунсом
const searchInput = document.getElementById('search');

fromEvent(searchInput, 'input').pipe(
    map(event => (event.target as HTMLInputElement).value),
    debounceTime(300),           // ждём 300мс после последнего ввода
    filter(query => query.length > 2),  // только длинные запросы
    switchMap(query => fetch(`/api/search?q=${query}`)) // отменяем предыдущий
).subscribe(results => renderResults(results));
```

---

## 5. Легковесные потоки

#concurrency

### Горутины (Go)

**Горутина** — легковесный поток, управляемый планировщиком Go (не ОС). Использует модель M:N: M горутин на N системных потоков.

- Стартовый стек ~2-8 КБ (vs ~1-8 МБ у потока ОС)
- GOMAXPROCS — количество OS-потоков для параллельного выполнения
- Планировщик Go: work-stealing, кооперативно-вытесняющий

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Printf("Worker %d начал\n", id)
    time.Sleep(time.Second) // симулируем работу
    fmt.Printf("Worker %d завершил\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go worker(i, &wg) // запускаем горутину
    }

    wg.Wait() // ждём все горутины
}

// Горутины с каналом
func main() {
    ch := make(chan int, 10) // буферизированный канал

    go func() {
        for i := 0; i < 10; i++ {
            ch <- i // отправка в канал
        }
        close(ch)
    }()

    for v := range ch { // чтение из канала
        fmt.Println(v)
    }
}
```

### Корутины (Python/Kotlin)

**Корутина** — функция, которую можно приостановить и возобновить. Кооперативная многозадачность: переключение только в явных точках.

```python
# Python asyncio
import asyncio

async def fetch_data(url: str) -> str:
    print(f"Начинаем загрузку {url}")
    await asyncio.sleep(1)  # точка приостановки
    print(f"Загрузка {url} завершена")
    return f"data from {url}"

async def main():
    # Запускаем параллельно
    results = await asyncio.gather(
        fetch_data("https://api.example.com/1"),
        fetch_data("https://api.example.com/2"),
        fetch_data("https://api.example.com/3"),
    )
    print(results)

asyncio.run(main())
```

```kotlin
// Kotlin Coroutines
import kotlinx.coroutines.*

suspend fun fetchUser(id: Int): String {
    delay(1000) // приостановка без блокировки потока
    return "User $id"
}

fun main() = runBlocking {
    val user1 = async { fetchUser(1) }
    val user2 = async { fetchUser(2) }
    println("${user1.await()}, ${user2.await()}")
}
```

### Файберы (Ruby)

**Файбер** — кооперативный легковесный поток с ручным переключением. Контроль над переключением у программиста, не у планировщика.

```ruby
# Ruby Fiber
fiber = Fiber.new do
    puts "Шаг 1"
    Fiber.yield          # приостановка, возврат управления
    puts "Шаг 2"
    Fiber.yield
    puts "Шаг 3"
end

fiber.resume  # "Шаг 1"
fiber.resume  # "Шаг 2"
fiber.resume  # "Шаг 3"

# Бесконечный генератор через Fiber
counter = Fiber.new do
    i = 0
    loop do
        Fiber.yield i
        i += 1
    end
end

5.times { print "#{counter.resume} " }  # 0 1 2 3 4
```

### Зелёные потоки (Green Threads)

**Зелёные потоки** — потоки, управляемые runtime/VM в userspace, а не ОС. ОС видит один системный поток.

- **JVM Project Loom** (Java 21+): виртуальные потоки — дешёвые, блокирующие API, управляемые JVM
- Позволяют писать синхронный код, который не блокирует OS-поток

```java
// Java 21 Virtual Threads (Project Loom)
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1)); // блокирует virtual thread, не OS thread
            System.out.println("Task " + i);
        });
    });
}
// Запускаем 10 000 виртуальных потоков без проблем
```

### Акторы (Erlang/Elixir/Akka)

**Акторная модель** — каждый актор имеет изолированное состояние и общается только через сообщения. Нет разделяемой памяти — нет race condition.

```elixir
# Elixir/Erlang ActorModel
defmodule Counter do
    def start(initial), do: spawn(fn -> loop(initial) end)

    defp loop(count) do
        receive do
            {:increment, from} ->
                send(from, count + 1)
                loop(count + 1)
            {:get, from} ->
                send(from, count)
                loop(count)
        end
    end
end

pid = Counter.start(0)
send(pid, {:increment, self()})
receive do count -> IO.puts("Count: #{count}") end
```

### Сравнительная таблица

| | OS Thread | Горутина (Go) | Корутина (Python) | Файбер (Ruby) | Актор (Erlang) |
|--|-----------|---------------|-------------------|---------------|----------------|
| **Планировщик** | ОС | Go runtime (M:N) | Event loop | Ручное | VM/OTP |
| **Стек** | 1-8 МБ | 2-8 КБ (растущий) | Минимальный | Минимальный | ~300 байт |
| **Переключение** | Вытесняющее | Кооперативно-вытесняющее | Кооперативное | Ручное | По сообщению |
| **Overhead** | Высокий | Низкий | Очень низкий | Очень низкий | Низкий |
| **Состояние** | Разделяемое | Разделяемое+каналы | Разделяемое | Разделяемое | Изолированное |
| **Языки** | Все | Go | Python, Kotlin, JS | Ruby, Lua | Erlang, Elixir, Akka |

---

## 6. Обработка ошибок

### Исключения (Exceptions)

```typescript
// TypeScript / Java-стиль
async function fetchUser(id: number): Promise<User> {
    try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
            throw new HttpError(response.status, "User not found");
        }
        return await response.json();
    } catch (err) {
        if (err instanceof HttpError) {
            console.error(`HTTP ошибка: ${err.status}`);
            throw err; // пробрасываем
        }
        throw new Error(`Неизвестная ошибка: ${err}`);
    } finally {
        console.log("Запрос завершён"); // выполняется всегда
    }
}

// Иерархия ошибок
class AppError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = "AppError";
    }
}

class ValidationError extends AppError {
    constructor(field: string, message: string) {
        super(message, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}

class HttpError extends AppError {
    constructor(public readonly status: number, message: string) {
        super(message, "HTTP_ERROR");
        this.name = "HttpError";
    }
}
```

```python
# Python
try:
    result = risky_operation()
except ValueError as e:
    print(f"Ошибка значения: {e}")
except (TypeError, KeyError) as e:
    print(f"Ошибка типа или ключа: {e}")
except Exception as e:
    raise RuntimeError("Обёрнутая ошибка") from e  # error chaining
finally:
    cleanup()
```

### Ошибки как значения (Go, Rust)

```go
// Go: error — это интерфейс
func readFile(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("readFile: %w", err) // wrapping
    }
    return data, nil
}

func main() {
    data, err := readFile("config.json")
    if err != nil {
        // errors.Is — проверка по цепочке wrapped ошибок
        if errors.Is(err, os.ErrNotExist) {
            log.Fatal("Файл не найден")
        }
        // errors.As — извлечение конкретного типа ошибки
        var pathErr *os.PathError
        if errors.As(err, &pathErr) {
            log.Fatalf("Ошибка пути: %s", pathErr.Path)
        }
        log.Fatal(err)
    }
    _ = data
}
```

```rust
// Rust: Result<T, E> и Option<T>
use std::fs;
use std::num::ParseIntError;

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    let n = s.trim().parse::<i32>()?; // ? — ранний возврат ошибки
    Ok(n * 2)
}

fn read_number(path: &str) -> Result<i32, Box<dyn std::error::Error>> {
    let content = fs::read_to_string(path)?;
    let n = parse_and_double(&content)?;
    Ok(n)
}

// Option<T> для nullable значений
fn find_user(id: u32) -> Option<User> {
    users.iter().find(|u| u.id == id).cloned()
}

match find_user(42) {
    Some(user) => println!("{}", user.name),
    None => println!("Пользователь не найден"),
}

// unwrap — паника при None/Err (только для прототипов!)
let value = risky().unwrap();
// expect — паника с сообщением
let value = risky().expect("Должно работать в данном контексте");
```

### Паника: Go panic/recover

```go
// Go panic/recover
func safeDivide(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic recovered: %v", r)
        }
    }()

    if b == 0 {
        panic("division by zero") // генерируем панику
    }
    return a / b, nil
}

result, err := safeDivide(10, 0)
// err = "panic recovered: division by zero"
```

### Best Practices

> [!TIP] Связанные материалы: [[Golang Basics]] — подробные примеры обработки ошибок в Go.

- **Никогда не игнорируй ошибки**: `_ = err` — это технический долг
- **Оборачивай ошибки** с контекстом: `fmt.Errorf("userService.GetUser: %w", err)`
- **Используй типизированные ошибки** для разной обработки в зависимости от типа
- **Логируй на границах** (entry point), а не везде — иначе одна ошибка залогируется 10 раз
- **Fail fast**: при критической ошибке лучше упасть сразу, чем работать с некорректными данными

---

## 7. Управление памятью

### Ручное управление (C)

```c
// C: malloc/free
int* arr = malloc(10 * sizeof(int));  // выделяем память
if (arr == NULL) { /* обработка ошибки */ }

arr[0] = 42;
free(arr);  // обязательно освободить!

// Типичные ошибки:
// use-after-free: обращение к памяти после free()
// double-free: free() одного адреса дважды → UB
// memory leak: забыли вызвать free()
// buffer overflow: выход за границы массива
```

### Garbage Collector (GC)

GC автоматически освобождает память, на которую нет ссылок.

**Mark-and-Sweep** (Go, Java, Python):
1. **Mark**: обходит граф объектов от корней (стек, глобальные переменные), помечает живые
2. **Sweep**: проходит всю кучу, освобождает непомеченные (мусор)

**Generational GC** (Java HotSpot, Python):
- Молодые объекты умирают быстро → собираются чаще (Young/Eden → Survivor)
- Старые объекты собираются редко (Old Generation)

```go
// Go — GC с tracing, concurrent, низкими паузами
// Можно настроить через GOGC (по умолчанию 100 — увеличение heap на 100%)
import "runtime"

runtime.GC()          // явный вызов GC (редко нужен)
debug.SetGCPercent(200) // увеличиваем threshold до 200%
```

### Ownership + Borrowing (Rust)

Rust управляет памятью без GC через систему владения, проверяемую при компиляции:

```rust
// Ownership: каждое значение имеет одного владельца
let s1 = String::from("hello");
let s2 = s1;      // s1 перемещён в s2, s1 больше не валиден
// println!("{}", s1); // ошибка компиляции!

// Borrowing: временное заимствование
fn print_len(s: &String) {    // неизменяемое заимствование
    println!("len = {}", s.len());
}
let s3 = String::from("world");
print_len(&s3);   // передаём ссылку, s3 остаётся валидным
println!("{}", s3);

// Mutable borrowing: только один изменяемый заёмщик одновременно
let mut s4 = String::from("hello");
let r = &mut s4;
r.push_str(", world!");
println!("{}", r);
```

### ARC (Swift, Objective-C)

**ARC (Automatic Reference Counting)** — подсчёт ссылок: объект живёт, пока на него ссылается хотя бы одна переменная.

```swift
class User {
    let name: String
    init(name: String) { self.name = name }
    deinit { print("\(name) освобождён") }
}

var user1: User? = User(name: "Анна")  // retain count = 1
var user2 = user1                       // retain count = 2
user1 = nil                             // retain count = 1
user2 = nil                             // retain count = 0 → deinit вызван

// Retain cycle → утечка памяти
// Решение: weak / unowned ссылки
class Node {
    var next: Node?
    weak var prev: Node?  // weak — не увеличивает счётчик
}
```

### Escape Analysis

**Escape Analysis** — компилятор определяет, куда разместить объект: на стек (быстро, автоматически освобождается) или на heap (медленнее, нужен GC).

```go
// Go — escape analysis
func createUser() *User {
    u := User{Name: "Анна"} // u "убегает" в heap — возвращаем указатель
    return &u
}

func processLocally() {
    u := User{Name: "Иван"} // u остаётся на стеке — не убегает
    fmt.Println(u.Name)
}

// Проверить: go build -gcflags="-m" ./...
```

---

## 8. Компиляция и интерпретация

| Язык | Тип исполнения | Артефакт | Особенности |
|------|---------------|---------|-------------|
| C, C++ | AOT-компиляция | Нативный бинарник | Максимальная производительность |
| Go | AOT-компиляция | Нативный бинарник | Быстрая компиляция, статическая линковка |
| Rust | AOT-компиляция | Нативный бинарник | Zero-cost abstractions, LLVM backend |
| Java | Компиляция в bytecode + JIT | JVM bytecode (.class) | JIT HotSpot — оптимизирует hot paths |
| JavaScript | Интерпретация + JIT | — | V8 JIT, TurboFan — компилирует горячий код |
| Python | Интерпретация + bytecode | .pyc | CPython интерпретирует bytecode |
| Dart | AOT (Flutter) + JIT (dev) | Нативный / JS | AOT для prod, JIT для hot reload |

### Компилятор (AOT)

Переводит исходный код в машинный код (или IR) **до** запуска.

```
Исходный код → Лексер → Парсер (AST) → Семантика → IR → Оптимизация → Нативный код
```

- **LLVM IR** — промежуточное представление для Rust, Clang, Swift
- **JVM bytecode** — платформонезависимый байткод для Java, Kotlin, Scala
- **WASM** — WebAssembly, платформонезависимый бинарный формат для браузера

### Интерпретатор

Выполняет код построчно/пошагово **во время** запуска.

```python
# Python CPython
# .py → bytecode (.pyc) → интерпретация CPython VM
```

### JIT (Just-In-Time)

JIT-компилятор компилирует **горячие** (часто выполняемые) участки кода в нативный во время выполнения.

```
Bytecode → Профилировщик (hot paths?) → JIT-компиляция → Нативный код
                                     ↓ (если нет)
                                  Интерпретация
```

- **V8 (JavaScript)**: Ignition (интерпретатор) → TurboFan (оптимизирующий JIT)
- **JVM HotSpot**: Interpreter → C1 (быстрая компиляция) → C2 (оптимизирующая компиляция)

### AOT (Ahead-of-Time)

AOT — компиляция в нативный код заранее, без JIT в рантайме:
- Flutter/Dart: AOT для релизных сборок
- Java: GraalVM Native Image — компилирует JVM-приложение в нативный бинарник

---

*Связанные статьи: [[principles]] — SOLID, YAGNI, KISS, DRY | [[GIT]] — система контроля версий | [[System Design]] — проектирование систем | [[Golang Basics]] — Go в деталях*
