# Python

## Основы Python

### Переменные и типы данных

Python использует динамическую типизацию. Переменные не требуют явного объявления типа.

Основные типы данных:
- `int` - целые числа
- `float` - числа с плавающей точкой
- `str` - строки
- `bool` - логический тип (True/False)
- `None` - отсутствие значения

```python
age = 25
price = 19.99
name = "Alice"
is_active = True
empty = None

print(type(age))  # <class 'int'>
print(type(price))  # <class 'float'>
```

### Консольный ввод и вывод

Для вывода информации используется функция `print()`, для ввода - `input()`

```python
print("Hello, World!")
print("Привет,", "мир!")

name = input("Введите ваше имя: ")
print(f"Привет, {name}!")

# Преобразование типов при вводе
age = int(input("Введите возраст: "))
price = float(input("Введите цену: "))
```

### Арифметические операции

Python поддерживает все стандартные арифметические операции:

```python
x = 10
y = 3

print(x + y)   # 13 - сложение
print(x - y)   # 7 - вычитание
print(x * y)   # 30 - умножение
print(x / y)   # 3.333... - деление
print(x // y)  # 3 - целочисленное деление
print(x % y)   # 1 - остаток от деления
print(x ** y)  # 1000 - возведение в степень

# Сокращённые операции
x += 5  # x = x + 5
x -= 3  # x = x - 3
x *= 2  # x = x * 2
```

Встроенные математические функции:

```python
print(abs(-10))      # 10 - модуль числа
print(round(3.7))    # 4 - округление
print(pow(2, 3))     # 8 - возведение в степень
print(min(5, 2, 8))  # 2 - минимум
print(max(5, 2, 8))  # 8 - максимум
```

### Условные выражения и конструкция if

Оператор `if` используется для ветвления программы:

```python
age = 18

if age >= 18:
    print("Вы совершеннолетний")
elif age >= 14:
    print("Вы подросток")
else:
    print("Вы ребёнок")
```

Операторы сравнения:
- == - равно
- `!=` - не равно
- `>` - больше
- `<` - меньше
- `>=` - больше или равно
- `<=` - меньше или равно

Логические операторы:
- `and` - логическое И
- `or` - логическое ИЛИ
- `not` - логическое НЕ

```python
age = 25
has_license = True

if age >= 18 and has_license:
    print("Можете водить машину")
```

Тернарный оператор:

```python
age = 20
status = "Совершеннолетний" if age >= 18 else "Несовершеннолетний"
print(status)
```

### Циклы

#### Цикл while

Выполняется, пока условие истинно:

```python
count = 0
while count < 5:
    print(count)
    count += 1
```

#### Цикл for

Используется для перебора элементов:

```python
# Перебор диапазона
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

# С начальным и конечным значением
for i in range(2, 7):
    print(i)  # 2, 3, 4, 5, 6

# С шагом
for i in range(0, 10, 2):
    print(i)  # 0, 2, 4, 6, 8

# Перебор списка
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
```

#### break и continue

`break` - прерывает выполнение цикла  
`continue` - переходит к следующей итерации

```python
for i in range(10):
    if i == 5:
        break  # Выход из цикла
    print(i)

for i in range(10):
    if i % 2 == 0:
        continue  # Пропуск чётных чисел
    print(i)
```

#### else в циклах

Блок `else` выполняется, если цикл завершился без `break`:

```python
for i in range(5):
    print(i)
else:
    print("Цикл завершён")
```

### Функции и параметры

Функции определяются с помощью ключевого слова `def`:

```python
def greet():
    print("Привет!")

greet()  # Вызов функции
```

#### Параметры функции

```python
def greet(name):
    print(f"Привет, {name}!")

greet("Алиса")
```

#### Значения по умолчанию

```python
def greet(name="Гость"):
    print(f"Привет, {name}!")

greet()          # Привет, Гость!
greet("Боб")     # Привет, Боб!
```

#### Возврат значений

```python
def add(a, b):
    return a + b

result = add(5, 3)
print(result)  # 8

# Возврат нескольких значений
def get_name():
    return "Иван", "Петров"

first, last = get_name()
```

#### Именованные аргументы

```python
def display_info(name, age):
    print(f"{name} - {age} лет")

display_info(name="Алиса", age=25)
display_info(age=30, name="Боб")
```

#### Переменное количество аргументов

`*args` для позиционных аргументов:

```python
def sum_all(*numbers):
    total = 0
    for num in numbers:
        total += num
    return total

print(sum_all(1, 2, 3))        # 6
print(sum_all(1, 2, 3, 4, 5))  # 15
```

`**kwargs` для именованных аргументов:

```python
def print_info(**data):
    for key, value in data.items():
        print(f"{key}: {value}")

print_info(name="Алиса", age=25, city="Москва")
```

### Лямбда-выражения

Лямбда-функции - это анонимные функции, определяемые в одну строку:

```python
# Обычная функция
def square(x):
    return x ** 2

# Лямбда-функция
square = lambda x: x ** 2
print(square(5))  # 25

# Лямбда с несколькими аргументами
add = lambda a, b: a + b
print(add(3, 4))  # 7
```

Лямбда-функции часто используются с `map()`, `filter()`, `sorted()`:

```python
numbers = [1, 2, 3, 4, 5]

# map - применяет функцию к каждому элементу
squared = list(map(lambda x: x ** 2, numbers))
print(squared)  # [1, 4, 9, 16, 25]

# filter - фильтрует элементы
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)  # [2, 4]

# sorted с ключом
words = ["apple", "pie", "zoo", "a"]
sorted_words = sorted(words, key=lambda x: len(x))
print(sorted_words)  # ['a', 'pie', 'zoo', 'apple']
```

### Преобразование типов

Python позволяет явно преобразовывать типы данных:

```python
# В целое число
x = int(3.7)      # 3
y = int("10")     # 10

# В число с плавающей точкой
a = float(5)      # 5.0
b = float("3.14") # 3.14

# В строку
s1 = str(100)     # "100"
s2 = str(3.14)    # "3.14"

# В логический тип
bool(1)           # True
bool(0)           # False
bool("")          # False
bool("text")      # True
bool([])          # False
bool([1, 2])      # True
```

### Область видимости переменных

#### Локальные и глобальные переменные

```python
x = 10  # Глобальная переменная

def func():
    x = 5  # Локальная переменная
    print(x)  # 5

func()
print(x)  # 10
```

#### Ключевое слово global

Для изменения глобальной переменной внутри функции используется `global`:

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

#### Ключевое слово nonlocal

Используется для доступа к переменным из внешней (но не глобальной) области:

```python
def outer():
    x = 10
    
    def inner():
        nonlocal x
        x = 20
    
    inner()
    print(x)  # 20

outer()
```

### Замыкания

Замыкание - это функция, которая запоминает значения из внешней области видимости:

```python
def outer(x):
    def inner(y):
        return x + y
    return inner

add_5 = outer(5)
print(add_5(3))  # 8
print(add_5(7))  # 12
```

Практический пример:

```python
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

times_3 = make_multiplier(3)
times_5 = make_multiplier(5)

print(times_3(10))  # 30
print(times_5(10))  # 50
```

### Декораторы

Декораторы - это функции, которые изменяют поведение других функций:

```python
def my_decorator(func):
    def wrapper():
        print("До вызова функции")
        func()
        print("После вызова функции")
    return wrapper

@my_decorator
def say_hello():
    print("Привет!")

say_hello()
# До вызова функции
# Привет!
# После вызова функции
```

Декоратор с аргументами:

```python
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Привет, {name}!")

greet("Алиса")
# Привет, Алиса!
# Привет, Алиса!
# Привет, Алиса!
```

Практический декоратор для измерения времени:

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"Время выполнения: {end - start:.4f} сек")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)

slow_function()
```

## Объектно-ориентированное программирование

### Классы и объекты

Классы определяются с помощью ключевого слова `class`:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        print(f"Привет, я {self.name}, мне {self.age} лет")

# Создание объектов
person1 = Person("Алиса", 25)
person2 = Person("Боб", 30)

person1.greet()  # Привет, я Алиса, мне 25 лет
person2.greet()  # Привет, я Боб, мне 30 лет
```

Метод `__init__` - это конструктор класса, который вызывается при создании объекта. `self` - это ссылка на текущий экземпляр класса.

### Инкапсуляция, атрибуты и свойства

#### Приватные атрибуты

В Python нет строгой инкапсуляции, но есть соглашения:
- `_attribute` - защищённый атрибут (одно подчёркивание)
- `__attribute` - приватный атрибут (два подчёркивания)

```python
class BankAccount:
    def __init__(self, balance):
        self.__balance = balance  # Приватный атрибут
    
    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
    
    def get_balance(self):
        return self.__balance

account = BankAccount(1000)
account.deposit(500)
print(account.get_balance())  # 1500
# print(account.__balance)  # Ошибка!
```

#### Свойства (properties)

Декоратор `@property` позволяет создавать геттеры и сеттеры:

```python
class Person:
    def __init__(self, name, age):
        self._name = name
        self._age = age
    
    @property
    def name(self):
        return self._name
    
    @name.setter
    def name(self, value):
        if len(value) > 0:
            self._name = value
    
    @property
    def age(self):
        return self._age
    
    @age.setter
    def age(self, value):
        if 0 <= value <= 120:
            self._age = value

person = Person("Алиса", 25)
print(person.name)  # Алиса
person.age = 26
print(person.age)  # 26
```

### Наследование

Класс может наследовать атрибуты и методы другого класса:

```python
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        print(f"{self.name} издаёт звук")

class Dog(Animal):
    def speak(self):
        print(f"{self.name} лает")

class Cat(Animal):
    def speak(self):
        print(f"{self.name} мяукает")

dog = Dog("Рекс")
cat = Cat("Мурка")

dog.speak()  # Рекс лает
cat.speak()  # Мурка мяукает
```

#### Вызов методов родительского класса

Используется функция `super()`:

```python
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary
    
    def display_info(self):
        print(f"Сотрудник: {self.name}, зарплата: {self.salary}")

class Manager(Employee):
    def __init__(self, name, salary, department):
        super().__init__(name, salary)
        self.department = department
    
    def display_info(self):
        super().display_info()
        print(f"Отдел: {self.department}")

manager = Manager("Иван", 50000, "IT")
manager.display_info()
# Сотрудник: Иван, зарплата: 50000
# Отдел: IT
```

#### Множественное наследование

Python поддерживает множественное наследование:

```python
class Flyable:
    def fly(self):
        print("Летает")

class Swimmable:
    def swim(self):
        print("Плавает")

class Duck(Flyable, Swimmable):
    def quack(self):
        print("Кря-кря")

duck = Duck()
duck.fly()    # Летает
duck.swim()   # Плавает
duck.quack()  # Кря-кря
```

### Статические методы и методы класса

#### Статические методы

Статические методы не имеют доступа к `self` или `cls`:

```python
class Math:
    @staticmethod
    def add(a, b):
        return a + b
    
    @staticmethod
    def multiply(a, b):
        return a * b

print(Math.add(5, 3))       # 8
print(Math.multiply(5, 3))  # 15
```

#### Методы класса

Методы класса получают класс в качестве первого аргумента (`cls`):

```python
class Person:
    count = 0
    
    def __init__(self, name):
        self.name = name
        Person.count += 1
    
    @classmethod
    def get_count(cls):
        return cls.count
    
    @classmethod
    def create_anonymous(cls):
        return cls("Аноним")

person1 = Person("Алиса")
person2 = Person("Боб")
print(Person.get_count())  # 2

anon = Person.create_anonymous()
print(anon.name)  # Аноним
```

### Перегрузка операторов

Python позволяет переопределять поведение операторов:

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)
    
    def __sub__(self, other):
        return Vector(self.x - other.x, self.y - other.y)
    
    def __str__(self):
        return f"Vector({self.x}, {self.y})"
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

v1 = Vector(1, 2)
v2 = Vector(3, 4)
v3 = v1 + v2
print(v3)  # Vector(4, 6)
```

Основные магические методы:
- `__str__` - строковое представление
- `__repr__` - представление для разработчика
- `__len__` - длина объекта
- `__add__`, `__sub__`, `__mul__`, `__truediv__` - арифметические операции
- `__eq__`, `__lt__`, `__gt__` - операции сравнения
- `__getitem__`, `__setitem__` - индексация

### Абстрактные классы

Абстрактные классы используются как базовые классы и не могут быть инстанцированы:

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass
    
    @abstractmethod
    def perimeter(self):
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height
    
    def area(self):
        return self.width * self.height
    
    def perimeter(self):
        return 2 * (self.width + self.height)

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius
    
    def area(self):
        return 3.14 * self.radius ** 2
    
    def perimeter(self):
        return 2 * 3.14 * self.radius

# shape = Shape()  # Ошибка! Нельзя создать экземпляр абстрактного класса
rect = Rectangle(5, 3)
print(rect.area())  # 15

circle = Circle(5)
print(circle.area())  # 78.5
```

## Обработка ошибок и исключений

### Конструкция try...except...finally

Блок `try-except` используется для обработки исключений:

```python
try:
    x = int(input("Введите число: "))
    result = 10 / x
    print(f"Результат: {result}")
except ValueError:
    print("Ошибка: введено не число")
except ZeroDivisionError:
    print("Ошибка: деление на ноль")
```

#### Блок finally

Блок `finally` выполняется всегда, независимо от наличия исключений:

```python
try:
    file = open("data.txt", "r")
    content = file.read()
    print(content)
except FileNotFoundError:
    print("Файл не найден")
finally:
    print("Завершение работы")
```

#### Блок else

Блок `else` выполняется, если исключение не возникло:

```python
try:
    x = int(input("Введите число: "))
except ValueError:
    print("Ошибка ввода")
else:
    print(f"Вы ввели: {x}")
finally:
    print("Конец программы")
```

### Обработка разных типов исключений

#### Получение информации об исключении

```python
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"Произошла ошибка: {e}")
    print(f"Тип ошибки: {type(e).__name__}")
```

#### Обработка нескольких исключений одним блоком

```python
try:
    x = int(input("Введите число: "))
    result = 10 / x
except (ValueError, ZeroDivisionError) as e:
    print(f"Ошибка: {e}")
```

#### Обработка всех исключений

```python
try:
    # Опасный код
    pass
except Exception as e:
    print(f"Произошла ошибка: {e}")
```

Иерархия встроенных исключений:
- `BaseException` - базовый класс всех исключений
  - `Exception` - базовый класс большинства исключений
    - `ValueError` - неверное значение
    - `TypeError` - неверный тип
    - `KeyError` - ключ не найден в словаре
    - `IndexError` - индекс вне диапазона
    - `ZeroDivisionError` - деление на ноль
    - `FileNotFoundError` - файл не найден

### Генерация исключений

#### Ключевое слово raise

Можно самостоятельно генерировать исключения:

```python
def check_age(age):
    if age < 0:
        raise ValueError("Возраст не может быть отрицательным")
    if age > 120:
        raise ValueError("Возраст не может быть больше 120")
    return age

try:
    check_age(-5)
except ValueError as e:
    print(e)  # Возраст не может быть отрицательным
```

#### Создание собственных исключений

```python
class InvalidAgeError(Exception):
    def __init__(self, age, message="Недействительный возраст"):
        self.age = age
        self.message = f"{message}: {age}"
        super().__init__(self.message)

class Person:
    def __init__(self, name, age):
        if age < 0 or age > 120:
            raise InvalidAgeError(age)
        self.name = name
        self.age = age

try:
    person = Person("Алиса", -5)
except InvalidAgeError as e:
    print(e)  # Недействительный возраст: -5
```

#### Перебрасывание исключений

```python
def process_data(data):
    try:
        return int(data)
    except ValueError:
        print("Ошибка преобразования")
        raise  # Перебрасываем исключение дальше

try:
    result = process_data("abc")
except ValueError:
    print("Обработка на внешнем уровне")
```

## Списки, кортежи и словари

### Списки

Список - это изменяемая упорядоченная коллекция элементов:

```python
# Создание списков
fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5]
mixed = [1, "text", 3.14, True]
empty = []

# Доступ к элементам
print(fruits[0])   # apple
print(fruits[-1])  # cherry (последний элемент)

# Срезы
print(numbers[1:4])   # [2, 3, 4]
print(numbers[:3])    # [1, 2, 3]
print(numbers[2:])    # [3, 4, 5]
print(numbers[::2])   # [1, 3, 5] (с шагом 2)
```

#### Изменение списков

```python
fruits = ["apple", "banana", "cherry"]

# Изменение элемента
fruits[0] = "orange"

# Добавление элементов
fruits.append("grape")        # в конец
fruits.insert(1, "kiwi")      # по индексу
fruits.extend(["mango", "pear"])  # несколько элементов

# Удаление элементов
fruits.remove("banana")       # по значению
deleted = fruits.pop()        # последний элемент
deleted = fruits.pop(0)       # по индексу
del fruits[1]                 # по индексу
fruits.clear()                # очистить список
```

#### Операции со списками

```python
numbers = [3, 1, 4, 1, 5, 9, 2, 6]

print(len(numbers))        # 8 - длина списка
print(max(numbers))        # 9 - максимум
print(min(numbers))        # 1 - минимум
print(sum(numbers))        # 31 - сумма
print(numbers.count(1))    # 2 - количество вхождений

# Проверка наличия
print(4 in numbers)        # True
print(10 not in numbers)   # True

# Сортировка
numbers.sort()             # изменяет список
sorted_nums = sorted(numbers)  # возвращает новый список
numbers.reverse()          # переворачивает список

# Поиск индекса
index = numbers.index(5)   # индекс первого вхождения
```

#### Копирование списков

```python
original = [1, 2, 3]

# Поверхностная копия
copy1 = original.copy()
copy2 = original[:]
copy3 = list(original)

# Глубокая копия (для вложенных списков)
import copy
nested = [[1, 2], [3, 4]]
deep = copy.deepcopy(nested)
```

### Кортежи

Кортеж - это неизменяемая упорядоченная коллекция:

```python
# Создание кортежей
point = (10, 20)
colors = ("red", "green", "blue")
single = (5,)  # кортеж из одного элемента
empty = ()

# Доступ к элементам
print(point[0])     # 10
print(colors[-1])   # blue

# Срезы (как у списков)
print(colors[1:])   # ('green', 'blue')

# Операции
print(len(colors))  # 3
print("red" in colors)  # True

# Распаковка кортежей
x, y = point
print(x, y)  # 10 20

# Кортежи можно использовать как ключи словаря (списки нельзя)
locations = {(0, 0): "origin", (1, 1): "point"}
```

Кортежи быстрее списков и занимают меньше памяти. Используйте их для неизменяемых данных.

### Словари

Словарь - это неупорядоченная коллекция пар ключ-значение:

```python
# Создание словарей
person = {"name": "Алиса", "age": 25, "city": "Москва"}
empty = {}
alt_syntax = dict(name="Боб", age=30)

# Доступ к элементам
print(person["name"])         # Алиса
print(person.get("age"))      # 25
print(person.get("phone", "Не указан"))  # Не указан (значение по умолчанию)

# Изменение словаря
person["age"] = 26            # изменение значения
person["phone"] = "123-456"   # добавление нового ключа

# Удаление элементов
del person["phone"]
removed = person.pop("city")  # удалить и вернуть значение
```

#### Операции со словарями

```python
person = {"name": "Алиса", "age": 25, "city": "Москва"}

# Проверка наличия ключа
print("name" in person)       # True
print("phone" in person)      # False

# Получение ключей, значений, пар
keys = person.keys()          # dict_keys(['name', 'age', 'city'])
values = person.values()      # dict_values(['Алиса', 25, 'Москва'])
items = person.items()        # dict_items([('name', 'Алиса'), ...])

# Перебор
for key in person:
    print(key, person[key])

for key, value in person.items():
    print(f"{key}: {value}")

# Объединение словарей
defaults = {"theme": "dark", "lang": "ru"}
settings = {"lang": "en"}
merged = {**defaults, **settings}  # {'theme': 'dark', 'lang': 'en'}

# Или через update
defaults.update(settings)
```

### Множества

Множество - это неупорядоченная коллекция уникальных элементов:

```python
# Создание множеств
fruits = {"apple", "banana", "cherry"}
numbers = {1, 2, 3, 4, 5}
empty = set()  # Не {}, это словарь!

# Добавление и удаление
fruits.add("orange")
fruits.remove("banana")        # ошибка, если элемента нет
fruits.discard("banana")       # без ошибки
popped = fruits.pop()          # удалить и вернуть случайный элемент

# Операции с множествами
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # {1, 2, 3, 4, 5, 6} - объединение
print(a & b)   # {3, 4} - пересечение
print(a - b)   # {1, 2} - разность
print(a ^ b)   # {1, 2, 5, 6} - симметричная разность

# Методы
print(a.union(b))
print(a.intersection(b))
print(a.difference(b))
print(a.symmetric_difference(b))

# Проверки
print(3 in a)               # True
print({1, 2}.issubset(a))   # True
```

### List comprehension

List comprehension - это краткий способ создания списков:

```python
# Обычный способ
squares = []
for i in range(10):
    squares.append(i ** 2)

# List comprehension
squares = [i ** 2 for i in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# С условием
evens = [i for i in range(20) if i % 2 == 0]
print(evens)  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# Вложенные циклы
pairs = [(x, y) for x in range(3) for y in range(3)]
print(pairs)  # [(0,0), (0,1), (0,2), (1,0), ...]

# С условием if-else
result = [i if i % 2 == 0 else -i for i in range(10)]
```

#### Dictionary comprehension

```python
# Словари из списков
squares = {i: i ** 2 for i in range(6)}
print(squares)  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Фильтрация словаря
person = {"name": "Алиса", "age": 25, "city": "Москва"}
filtered = {k: v for k, v in person.items() if k != "age"}
```

#### Set comprehension

```python
# Множества
squares = {i ** 2 for i in range(10)}
print(squares)  # {0, 1, 64, 4, 36, 9, 16, 49, 81, 25}
```

### Упаковка и распаковка

#### Распаковка последовательностей

```python
# Распаковка списков и кортежей
point = (10, 20)
x, y = point
print(x, y)  # 10 20

# Распаковка с * (остальные элементы)
numbers = [1, 2, 3, 4, 5]
first, *rest, last = numbers
print(first)  # 1
print(rest)   # [2, 3, 4]
print(last)   # 5

# Обмен значений
a, b = 5, 10
a, b = b, a
print(a, b)  # 10 5
```

#### Распаковка в функциях

```python
def sum_three(a, b, c):
    return a + b + c

numbers = [1, 2, 3]
result = sum_three(*numbers)  # Распаковка списка
print(result)  # 6

# Распаковка словаря
def greet(name, age):
    print(f"{name} - {age} лет")

person = {"name": "Алиса", "age": 25}
greet(**person)  # Алиса - 25 лет
```

#### Упаковка аргументов

```python
def sum_all(*args):
    return sum(args)

print(sum_all(1, 2, 3))        # 6
print(sum_all(1, 2, 3, 4, 5))  # 15

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Алиса", age=25, city="Москва")
```

## Модули и пакеты

### Определение и подключение модулей

#### Создание модуля

Модуль - это файл Python с расширением `.py`:

`mymodule.py`:
```python
def greet(name):
    return f"Привет, {name}!"

def add(a, b):
    return a + b

PI = 3.14159
```

#### Импорт модуля

```python
# Импорт всего модуля
import mymodule

print(mymodule.greet("Алиса"))
print(mymodule.PI)

# Импорт с псевдонимом
import mymodule as mm

print(mm.add(5, 3))

# Импорт конкретных функций
from mymodule import greet, PI

print(greet("Боб"))
print(PI)

# Импорт с псевдонимом
from mymodule import greet as hello

print(hello("Мир"))

# Импорт всего (не рекомендуется)
from mymodule import *
```

#### Структура пакета

Пакет - это папка с файлом `__init__.py`:

```
mypackage/
    __init__.py
    module1.py
    module2.py
    subpackage/
        __init__.py
        module3.py
```

Импорт из пакета:

```python
from mypackage import module1
from mypackage.subpackage import module3
```

### Установка пакетов и pip

#### Использование pip

```bash
# Установка пакета
pip install package_name

# Установка конкретной версии
pip install package_name==1.0.0

# Обновление пакета
pip install --upgrade package_name

# Удаление пакета
pip uninstall package_name

# Список установленных пакетов
pip list

# Сохранение зависимостей
pip freeze > requirements.txt

# Установка из файла зависимостей
pip install -r requirements.txt
```

#### Виртуальное окружение

```bash
# Создание виртуального окружения
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (Linux/Mac)
source venv/bin/activate

# Деактивация
deactivate
```

### Основные модули

#### Модуль random

```python
import random

# Случайное число
print(random.random())           # от 0.0 до 1.0
print(random.randint(1, 10))     # от 1 до 10 включительно
print(random.uniform(1.0, 5.0))  # float от 1.0 до 5.0

# Случайный выбор
colors = ["red", "green", "blue"]
print(random.choice(colors))     # один элемент
print(random.choices(colors, k=3))  # k элементов (с повторениями)
print(random.sample(colors, k=2))   # k элементов (без повторений)

# Перемешивание
numbers = [1, 2, 3, 4, 5]
random.shuffle(numbers)
print(numbers)
```

#### Модуль math

```python
import math

print(math.pi)          # 3.141592653589793
print(math.e)           # 2.718281828459045

print(math.sqrt(16))    # 4.0 - квадратный корень
print(math.pow(2, 3))   # 8.0 - возведение в степень
print(math.factorial(5))  # 120 - факториал

print(math.ceil(3.2))   # 4 - округление вверх
print(math.floor(3.8))  # 3 - округление вниз

print(math.sin(math.pi/2))  # 1.0
print(math.cos(0))          # 1.0
print(math.log(10))         # 2.302... - натуральный логарифм
print(math.log10(100))      # 2.0 - логарифм по основанию 10
```

#### Модуль datetime

```python
from datetime import datetime, date, time, timedelta

# Текущие дата и время
now = datetime.now()
print(now)  # 2024-01-17 15:30:45.123456

today = date.today()
print(today)  # 2024-01-17

# Создание конкретной даты
birthday = date(1990, 5, 15)
meeting = datetime(2024, 1, 20, 14, 30)

# Компоненты даты
print(now.year, now.month, now.day)
print(now.hour, now.minute, now.second)

# Форматирование
formatted = now.strftime("%d.%m.%Y %H:%M:%S")
print(formatted)  # 17.01.2024 15:30:45

# Парсинг строки
date_str = "2024-01-20"
parsed = datetime.strptime(date_str, "%Y-%m-%d")

# Операции с датами
tomorrow = today + timedelta(days=1)
week_ago = today - timedelta(weeks=1)
in_3_hours = now + timedelta(hours=3)

# Разница между датами
diff = today - birthday
print(diff.days)  # количество дней
```

#### Модуль os

```python
import os

# Текущая директория
print(os.getcwd())

# Смена директории
os.chdir("/path/to/directory")

# Список файлов
files = os.listdir(".")
print(files)

# Проверка существования
print(os.path.exists("file.txt"))
print(os.path.isfile("file.txt"))
print(os.path.isdir("folder"))

# Путь к файлу
path = os.path.join("folder", "subfolder", "file.txt")
dirname = os.path.dirname(path)
basename = os.path.basename(path)

# Создание и удаление директорий
os.mkdir("new_folder")
os.makedirs("parent/child/grandchild")
os.rmdir("folder")

# Переменные окружения
print(os.environ.get("PATH"))
os.environ["MY_VAR"] = "value"
```

#### Модуль sys

```python
import sys

# Версия Python
print(sys.version)

# Аргументы командной строки
print(sys.argv)

# Выход из программы
# sys.exit(0)

# Путь поиска модулей
print(sys.path)
```

## Строки

### Работа со строками

#### Создание строк

```python
# Обычные строки
text1 = "Hello, World!"
text2 = 'Hello, World!'

# Многострочные строки
text3 = """Первая строка
Вторая строка
Третья строка"""

# Экранирование
text4 = "Он сказал: \"Привет!\""
text5 = 'It\'s a beautiful day'

# Raw-строки (без экранирования)
path = r"C:\Users\name\Documents"

# Конкатенация
greeting = "Hello" + " " + "World"
repeated = "Ha" * 3  # "HaHaHa"
```

#### Доступ к символам

```python
text = "Python"

print(text[0])     # P - первый символ
print(text[-1])    # n - последний символ
print(text[2:5])   # tho - срез
print(text[:3])    # Pyt
print(text[3:])    # hon
print(text[::2])   # Pto - с шагом 2
print(text[::-1])  # nohtyP - реверс строки

# Длина строки
print(len(text))   # 6
```

### Основные методы строк

#### Регистр

```python
text = "Hello, World!"

print(text.upper())       # HELLO, WORLD!
print(text.lower())       # hello, world!
print(text.capitalize())  # Hello, world!
print(text.title())       # Hello, World!
print(text.swapcase())    # hELLO, wORLD!
```

#### Поиск и проверка

```python
text = "Hello, World!"

# Поиск подстроки
print(text.find("World"))     # 7 - индекс начала
print(text.find("Python"))    # -1 - не найдено
print(text.index("World"))    # 7 - как find, но ошибка если не найдено

print(text.count("l"))        # 3 - количество вхождений

# Проверки
print(text.startswith("Hello"))  # True
print(text.endswith("!"))        # True
print("World" in text)           # True

# Проверка типа символов
print("123".isdigit())      # True - только цифры
print("abc".isalpha())      # True - только буквы
print("abc123".isalnum())   # True - буквы и цифры
print("   ".isspace())      # True - только пробелы
```

#### Изменение строк

```python
text = "  Hello, World!  "

# Удаление пробелов
print(text.strip())   # "Hello, World!"
print(text.lstrip())  # "Hello, World!  "
print(text.rstrip())  # "  Hello, World!"

# Замена
print(text.replace("World", "Python"))  # "  Hello, Python!  "
print(text.replace("l", "L", 2))  # заменить первые 2 вхождения

# Разделение и объединение
words = "apple,banana,cherry".split(",")
print(words)  # ['apple', 'banana', 'cherry']

lines = "line1\nline2\nline3".splitlines()
print(lines)  # ['line1', 'line2', 'line3']

joined = " ".join(words)
print(joined)  # "apple banana cherry"
```

#### Выравнивание

```python
text = "Python"

print(text.center(20, "*"))  # *******Python*******
print(text.ljust(20, "-"))   # Python--------------
print(text.rjust(20, "-"))   # --------------Python
print("42".zfill(5))         # 00042
```

### Форматирование

#### f-строки (Python 3.6+)

```python
name = "Алиса"
age = 25

# Базовое использование
print(f"Меня зовут {name}, мне {age} лет")

# Выражения
print(f"Через год мне будет {age + 1}")

# Форматирование чисел
pi = 3.14159
print(f"Pi = {pi:.2f}")  # Pi = 3.14

# Выравнивание
print(f"{name:>10}")  # выравнивание вправо
print(f"{name:<10}")  # выравнивание влево
print(f"{name:^10}")  # по центру

# Дата и время
from datetime import datetime
now = datetime.now()
print(f"Сейчас: {now:%d.%m.%Y %H:%M}")
```

#### Метод format()

```python
# Позиционные аргументы
print("Меня зовут {}, мне {} лет".format("Боб", 30))

# Именованные аргументы
print("Меня зовут {name}, мне {age} лет".format(name="Боб", age=30))

# По индексу
print("{0} + {1} = {2}".format(5, 3, 8))

# Форматирование
print("{:.2f}".format(3.14159))  # 3.14
print("{:>10}".format("text"))   # выравнивание
```

#### Старый стиль (%)

```python
name = "Алиса"
age = 25

print("Меня зовут %s, мне %d лет" % (name, age))
print("Pi = %.2f" % 3.14159)
```

## Pattern matching

Pattern matching (сопоставление с образцом) появился в Python 3.10.

### Конструкция match

Базовый синтаксис:

```python
def http_status(status):
    match status:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 500:
            return "Internal Server Error"
        case _:
            return "Unknown status"

print(http_status(200))  # OK
print(http_status(403))  # Unknown status
```

#### Множественные значения

```python
def weekday(day):
    match day:
        case "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday":
            return "Рабочий день"
        case "Saturday" | "Sunday":
            return "Выходной"
        case _:
            return "Неизвестный день"

print(weekday("Monday"))    # Рабочий день
print(weekday("Saturday"))  # Выходной
```

### Различные паттерны

#### Сопоставление списков и кортежей

```python
def describe_point(point):
    match point:
        case (0, 0):
            return "Начало координат"
        case (0, y):
            return f"На оси Y: y={y}"
        case (x, 0):
            return f"На оси X: x={x}"
        case (x, y):
            return f"Точка ({x}, {y})"

print(describe_point((0, 0)))   # Начало координат
print(describe_point((0, 5)))   # На оси Y: y=5
print(describe_point((3, 4)))   # Точка (3, 4)
```

#### Сопоставление с распаковкой

```python
def describe_list(data):
    match data:
        case []:
            return "Пустой список"
        case [x]:
            return f"Один элемент: {x}"
        case [x, y]:
            return f"Два элемента: {x}, {y}"
        case [first, *rest]:
            return f"Первый: {first}, остальные: {rest}"

print(describe_list([]))           # Пустой список
print(describe_list([1]))          # Один элемент: 1
print(describe_list([1, 2, 3, 4])) # Первый: 1, остальные: [2, 3, 4]
```

#### Сопоставление словарей

```python
def process_user(user):
    match user:
        case {"name": name, "age": age, "role": "admin"}:
            return f"Администратор {name}, {age} лет"
        case {"name": name, "age": age}:
            return f"Пользователь {name}, {age} лет"
        case {"name": name}:
            return f"Пользователь {name}"
        case _:
            return "Неизвестный пользователь"

print(process_user({"name": "Алиса", "age": 25, "role": "admin"}))
# Администратор Алиса, 25 лет
```

#### Сопоставление классов

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

def describe_point(point):
    match point:
        case Point(x=0, y=0):
            return "Начало координат"
        case Point(x=0, y=y):
            return f"На оси Y: {y}"
        case Point(x=x, y=0):
            return f"На оси X: {x}"
        case Point(x=x, y=y):
            return f"Точка ({x}, {y})"

p = Point(3, 4)
print(describe_point(p))  # Точка (3, 4)
```

#### Guards (ограничения)

```python
def categorize_number(x):
    match x:
        case n if n < 0:
            return "Отрицательное"
        case n if n == 0:
            return "Ноль"
        case n if n < 10:
            return "Однозначное положительное"
        case n if n < 100:
            return "Двузначное"
        case _:
            return "Большое число"

print(categorize_number(-5))   # Отрицательное
print(categorize_number(5))    # Однозначное положительное
print(categorize_number(50))   # Двузначное
```

#### Псевдонимы (as)

```python
def process_data(data):
    match data:
        case [1, 2, 3] as exact:
            return f"Точное совпадение: {exact}"
        case [x, y, z] as triple:
            return f"Три элемента: {triple}"
        case _:
            return "Другое"

print(process_data([1, 2, 3]))  # Точное совпадение: [1, 2, 3]
print(process_data([4, 5, 6]))  # Три элемента: [4, 5, 6]
```

## Работа с файлами

### Открытие и закрытие файлов

#### Функция open()

Файлы открываются функцией `open()` с указанием режима:

- `'r'` - чтение (по умолчанию)
- `'w'` - запись (перезаписывает файл)
- `'a'` - добавление в конец
- `'x'` - создание нового файла (ошибка если существует)
- `'b'` - бинарный режим
- `'t'` - текстовый режим (по умолчанию)
- `'+'` - чтение и запись

```python
# Открытие и закрытие
file = open("data.txt", "r")
content = file.read()
file.close()
```

#### Контекстный менеджер with

Рекомендуемый способ - использовать `with`, который автоматически закрывает файл:

```python
with open("data.txt", "r") as file:
    content = file.read()
    print(content)
# Файл автоматически закрыт
```

### Текстовые файлы

#### Чтение файлов

```python
# Чтение всего файла
with open("data.txt", "r", encoding="utf-8") as file:
    content = file.read()
    print(content)

# Чтение по строкам
with open("data.txt", "r", encoding="utf-8") as file:
    for line in file:
        print(line.strip())  # strip() убирает \n

# Чтение всех строк в список
with open("data.txt", "r", encoding="utf-8") as file:
    lines = file.readlines()
    print(lines)

# Чтение одной строки
with open("data.txt", "r", encoding="utf-8") as file:
    first_line = file.readline()
    second_line = file.readline()
```

#### Запись в файлы

```python
# Запись (перезаписывает файл)
with open("output.txt", "w", encoding="utf-8") as file:
    file.write("Привет, мир!\n")
    file.write("Вторая строка\n")

# Запись списка строк
lines = ["Строка 1\n", "Строка 2\n", "Строка 3\n"]
with open("output.txt", "w", encoding="utf-8") as file:
    file.writelines(lines)

# Добавление в конец файла
with open("output.txt", "a", encoding="utf-8") as file:
    file.write("Новая строка\n")
```

#### Работа с позицией в файле

```python
with open("data.txt", "r") as file:
    print(file.tell())  # Текущая позиция
    file.seek(0)        # Переход в начало
    file.seek(10)       # Переход на позицию 10
```

### Бинарные файлы

#### Чтение и запись бинарных данных

```python
# Чтение бинарного файла
with open("image.jpg", "rb") as file:
    data = file.read()
    print(type(data))  # <class 'bytes'>

# Запись бинарного файла
with open("copy.jpg", "wb") as file:
    file.write(data)

# Копирование бинарного файла
with open("source.jpg", "rb") as source:
    with open("destination.jpg", "wb") as dest:
        dest.write(source.read())
```

### Работа с файловой системой

#### Модуль os.path

```python
import os

# Проверка существования
print(os.path.exists("file.txt"))    # True/False
print(os.path.isfile("file.txt"))    # Это файл?
print(os.path.isdir("folder"))       # Это директория?

# Информация о файле
print(os.path.getsize("file.txt"))   # Размер в байтах
print(os.path.getmtime("file.txt"))  # Время изменения

# Работа с путями
print(os.path.abspath("file.txt"))   # Абсолютный путь
print(os.path.dirname("/path/to/file.txt"))   # /path/to
print(os.path.basename("/path/to/file.txt"))  # file.txt
print(os.path.split("/path/to/file.txt"))     # ('/path/to', 'file.txt')
print(os.path.splitext("file.txt"))  # ('file', '.txt')

# Объединение путей
path = os.path.join("folder", "subfolder", "file.txt")
```

#### Модуль pathlib (современный подход)

```python
from pathlib import Path

# Создание объекта пути
path = Path("folder/file.txt")

# Проверки
print(path.exists())
print(path.is_file())
print(path.is_dir())

# Информация
print(path.name)        # file.txt
print(path.stem)        # file
print(path.suffix)      # .txt
print(path.parent)      # folder

# Чтение и запись
content = path.read_text(encoding="utf-8")
path.write_text("Новое содержимое", encoding="utf-8")

# Создание директорий
Path("new_folder").mkdir(exist_ok=True)
Path("parent/child").mkdir(parents=True, exist_ok=True)

# Перебор файлов
for file in Path(".").glob("*.txt"):
    print(file)

for file in Path(".").rglob("*.py"):  # Рекурсивно
    print(file)
```

#### Операции с файлами и директориями

```python
import os
import shutil

# Переименование/перемещение
os.rename("old.txt", "new.txt")
shutil.move("file.txt", "folder/file.txt")

# Копирование
shutil.copy("source.txt", "destination.txt")       # Копирует файл
shutil.copy2("source.txt", "destination.txt")      # + метаданные
shutil.copytree("source_folder", "dest_folder")    # Копирует папку

# Удаление
os.remove("file.txt")           # Удалить файл
os.rmdir("empty_folder")        # Удалить пустую папку
shutil.rmtree("folder")         # Удалить папку с содержимым

# Создание директорий
os.mkdir("new_folder")
os.makedirs("parent/child/grandchild")

# Список файлов
files = os.listdir(".")
for file in files:
    print(file)

# Обход дерева директорий
for root, dirs, files in os.walk("."):
    print(f"Директория: {root}")
    for file in files:
        print(f"  Файл: {file}")
```

#### Временные файлы

```python
import tempfile

# Временный файл
with tempfile.TemporaryFile(mode="w+") as temp:
    temp.write("Временные данные")
    temp.seek(0)
    print(temp.read())
# Файл автоматически удалён

# Именованный временный файл
with tempfile.NamedTemporaryFile(mode="w+", delete=False) as temp:
    print(temp.name)  # Путь к файлу
    temp.write("Данные")

# Временная директория
with tempfile.TemporaryDirectory() as tmpdir:
    print(tmpdir)  # Путь к директории
    # Работа с файлами в tmpdir
# Директория автоматически удалена
```

## Работа с датами и временем

### Модуль datetime

#### Класс date

```python
from datetime import date

# Текущая дата
today = date.today()
print(today)  # 2024-01-17

# Создание конкретной даты
birthday = date(1990, 5, 15)
print(birthday)  # 1990-05-15

# Компоненты даты
print(today.year)   # 2024
print(today.month)  # 1
print(today.day)    # 17

# День недели (0 = понедельник, 6 = воскресенье)
print(today.weekday())  # 2

# ISO формат
print(today.isoformat())  # 2024-01-17
```

#### Класс time

```python
from datetime import time

# Создание времени
morning = time(9, 30, 0)
print(morning)  # 09:30:00

afternoon = time(14, 45, 30, 123456)  # часы, минуты, секунды, микросекунды
print(afternoon)  # 14:45:30.123456

# Компоненты
print(morning.hour)    # 9
print(morning.minute)  # 30
print(morning.second)  # 0
```

#### Класс datetime

```python
from datetime import datetime

# Текущие дата и время
now = datetime.now()
print(now)  # 2024-01-17 15:30:45.123456

# Создание конкретной даты и времени
meeting = datetime(2024, 1, 20, 14, 30)
print(meeting)  # 2024-01-20 14:30:00

# Компоненты
print(now.year, now.month, now.day)
print(now.hour, now.minute, now.second)

# Получение даты и времени отдельно
print(now.date())  # 2024-01-17
print(now.time())  # 15:30:45.123456

# Комбинирование date и time
from datetime import date, time
d = date(2024, 1, 20)
t = time(14, 30)
dt = datetime.combine(d, t)
print(dt)  # 2024-01-20 14:30:00
```

### Операции с датами

#### Класс timedelta

```python
from datetime import datetime, timedelta

now = datetime.now()

# Создание временного интервала
one_day = timedelta(days=1)
one_week = timedelta(weeks=1)
two_hours = timedelta(hours=2)
combined = timedelta(days=1, hours=3, minutes=30)

# Арифметика с датами
tomorrow = now + timedelta(days=1)
yesterday = now - timedelta(days=1)
next_week = now + timedelta(weeks=1)
in_3_hours = now + timedelta(hours=3)

print(tomorrow)
print(next_week)

# Разница между датами
birthday = datetime(1990, 5, 15)
age_delta = now - birthday
print(age_delta.days)  # Количество дней
print(age_delta.total_seconds())  # Общее количество секунд

# Сравнение дат
date1 = datetime(2024, 1, 15)
date2 = datetime(2024, 1, 20)
print(date1 < date2)  # True
print(date1 == date2)  # False
```

#### Форматирование дат

```python
from datetime import datetime

now = datetime.now()

# Преобразование в строку (strftime)
print(now.strftime("%d.%m.%Y"))           # 17.01.2024
print(now.strftime("%d/%m/%Y %H:%M:%S"))  # 17/01/2024 15:30:45
print(now.strftime("%A, %d %B %Y"))       # Wednesday, 17 January 2024
print(now.strftime("%Y-%m-%d"))           # 2024-01-17 (ISO)

# Парсинг строки в datetime (strptime)
date_string = "2024-01-20 14:30:00"
parsed = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
print(parsed)  # 2024-01-20 14:30:00

# Основные коды форматирования:
# %Y - год (4 цифры)
# %m - месяц (01-12)
# %d - день (01-31)
# %H - час (00-23)
# %M - минута (00-59)
# %S - секунда (00-59)
# %A - день недели (полное название)
# %a - день недели (сокращённо)
# %B - месяц (полное название)
# %b - месяц (сокращённо)
```

#### Часовые пояса

```python
from datetime import datetime, timezone, timedelta

# UTC время
utc_now = datetime.now(timezone.utc)
print(utc_now)

# Создание часового пояса
moscow_tz = timezone(timedelta(hours=3))
moscow_time = datetime.now(moscow_tz)
print(moscow_time)

# Преобразование между часовыми поясами
utc_time = datetime.now(timezone.utc)
tokyo_tz = timezone(timedelta(hours=9))
tokyo_time = utc_time.astimezone(tokyo_tz)
print(tokyo_time)

# Для более сложной работы с часовыми поясами используйте библиотеку pytz
# pip install pytz
```

#### Модуль time

```python
import time

# Текущее время (секунды с начала эпохи Unix)
timestamp = time.time()
print(timestamp)  # 1705501845.123456

# Задержка
time.sleep(2)  # Пауза на 2 секунды

# Измерение времени выполнения
start = time.time()
# ... какой-то код ...
end = time.time()
print(f"Время выполнения: {end - start:.4f} секунд")

# Более точное измерение производительности
start = time.perf_counter()
# ... код для замера ...
end = time.perf_counter()
print(f"Время: {end - start:.6f} секунд")
```

#### Практические примеры

```python
from datetime import datetime, timedelta

# Получить возраст по дате рождения
def calculate_age(birth_date):
    today = datetime.now().date()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age

birthday = datetime(1990, 5, 15).date()
print(f"Возраст: {calculate_age(birthday)} лет")

# Найти ближайший понедельник
def next_monday():
    today = datetime.now()
    days_until_monday = (7 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7
    return today + timedelta(days=days_until_monday)

print(f"Ближайший понедельник: {next_monday().strftime('%d.%m.%Y')}")

# Подсчитать рабочие дни между датами
def count_weekdays(start_date, end_date):
    count = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # 0-4 это пн-пт
            count += 1
        current += timedelta(days=1)
    return count

start = datetime(2024, 1, 1)
end = datetime(2024, 1, 31)
print(f"Рабочих дней: {count_weekdays(start, end)}")
```