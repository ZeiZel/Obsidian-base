---
tags:
  - python
  - programming
  - backend
  - django
  - fastapi
---

## Python

Python — высокоуровневый интерпретируемый язык программирования общего назначения. Отличается читаемым синтаксисом, динамической типизацией и богатой стандартной библиотекой. Используется в web-разработке, data science, автоматизации, DevOps и многих других областях.

---

### Установка и настройка

#### Установка Python

**Windows:**
1. Скачать установщик с [python.org](https://www.python.org/downloads/)
2. При установке отметить "Add Python to PATH"
3. Проверить: `python --version`

**macOS:**
```bash
# Через Homebrew
brew install python

# Проверка
python3 --version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv

python3 --version
```

#### Виртуальные окружения

Изолируют зависимости проекта от системного Python.

```bash
# Создание
python -m venv venv

# Активация
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Деактивация
deactivate
```

#### Менеджеры пакетов

```bash
# pip — стандартный
pip install requests
pip install -r requirements.txt
pip freeze > requirements.txt

# poetry — современный (зависимости + виртуальные окружения)
pip install poetry
poetry init
poetry add requests
poetry install
```

#### Первая программа

```python
# hello.py
print("Hello, World!")
```

```bash
python hello.py
# Вывод: Hello, World!
```

#### REPL (интерактивный режим)

```bash
python
>>> 2 + 2
4
>>> print("Hello")
Hello
>>> exit()
```

---

### Основы синтаксиса

#### Переменные

В Python не нужно объявлять тип переменной — он определяется автоматически.

```python
# Присваивание
name = "Alice"      # str
age = 25            # int
height = 1.75       # float
is_active = True    # bool

# Множественное присваивание
x, y, z = 1, 2, 3
a = b = c = 0

# Правила именования
user_name = "Bob"   # snake_case — стандарт в Python
_private = "hidden" # начинается с _ — "приватная" переменная
MAX_SIZE = 100      # UPPER_CASE — константы (по соглашению)
```

#### Комментарии

```python
# Однострочный комментарий

"""
Многострочный комментарий
или docstring (документация)
"""

def greet(name):
    """Приветствует пользователя по имени."""
    return f"Hello, {name}!"
```

#### Отступы

Python использует отступы (4 пробела) для обозначения блоков кода.

```python
if True:
    print("Блок if")
    if True:
        print("Вложенный блок")

# Ошибка IndentationError при неправильных отступах
```

#### Ввод/вывод

```python
# Вывод
print("Hello")
print("a", "b", "c", sep="-")  # a-b-c
print("No newline", end="")

# Ввод
name = input("Введите имя: ")
age = int(input("Введите возраст: "))  # Преобразование в int
```

---

### Типы данных

#### Числовые типы

```python
# int — целые числа (неограниченной точности)
x = 42
big = 10 ** 100  # Очень большое число

# float — числа с плавающей точкой
pi = 3.14159
scientific = 1.5e-10  # Научная нотация

# complex — комплексные числа
z = 3 + 4j
z.real  # 3.0
z.imag  # 4.0

# Операции
print(10 / 3)   # 3.333... (деление)
print(10 // 3)  # 3 (целочисленное деление)
print(10 % 3)   # 1 (остаток)
print(2 ** 10)  # 1024 (возведение в степень)
```

#### Строки (str)

```python
# Создание
s1 = 'Одинарные кавычки'
s2 = "Двойные кавычки"
s3 = '''Многострочная
строка'''
s4 = """Тоже
многострочная"""

# Экранирование
path = "C:\\Users\\Name"
path = r"C:\Users\Name"  # raw string

# Индексация и срезы
s = "Python"
s[0]      # 'P'
s[-1]     # 'n'
s[0:3]    # 'Pyt'
s[::2]    # 'Pto' (каждый второй)
s[::-1]   # 'nohtyP' (реверс)

# Методы строк
text = "  Hello World  "
text.strip()          # "Hello World"
text.lower()          # "  hello world  "
text.upper()          # "  HELLO WORLD  "
text.replace("o", "0") # "  Hell0 W0rld  "
text.split()          # ['Hello', 'World']
"-".join(['a', 'b'])  # "a-b"
"hello".startswith("he")  # True
"hello".find("l")     # 2

# Форматирование
name, age = "Alice", 25

# f-strings (Python 3.6+) — рекомендуется
print(f"Name: {name}, Age: {age}")
print(f"2 + 2 = {2 + 2}")
print(f"{3.14159:.2f}")  # "3.14"

# format()
print("Name: {}, Age: {}".format(name, age))
print("{1} {0}".format("World", "Hello"))

# % (устаревший способ)
print("Name: %s, Age: %d" % (name, age))
```

#### Списки (list)

Изменяемая упорядоченная коллекция.

```python
# Создание
nums = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]
empty = []
from_range = list(range(5))  # [0, 1, 2, 3, 4]

# Индексация и срезы (как у строк)
nums[0]     # 1
nums[-1]    # 5
nums[1:3]   # [2, 3]

# Изменение
nums[0] = 10
nums[1:3] = [20, 30]

# Методы
nums.append(6)        # Добавить в конец
nums.insert(0, 0)     # Вставить по индексу
nums.extend([7, 8])   # Расширить списком
nums.pop()            # Удалить и вернуть последний
nums.pop(0)           # Удалить по индексу
nums.remove(3)        # Удалить первое вхождение значения
nums.clear()          # Очистить
nums.sort()           # Сортировка на месте
nums.reverse()        # Реверс на месте
nums.copy()           # Поверхностная копия
len(nums)             # Длина
3 in nums             # Проверка вхождения

# List comprehension
squares = [x ** 2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
matrix = [[i * j for j in range(3)] for i in range(3)]
```

#### Кортежи (tuple)

Неизменяемая упорядоченная коллекция.

```python
# Создание
point = (3, 4)
single = (1,)  # Кортеж из одного элемента
empty = ()
from_list = tuple([1, 2, 3])

# Распаковка
x, y = point
a, *rest, b = (1, 2, 3, 4, 5)  # a=1, rest=[2,3,4], b=5

# Named tuples
from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
print(p.x, p.y)
```

#### Множества (set)

Неупорядоченная коллекция уникальных элементов.

```python
# Создание
s = {1, 2, 3}
empty = set()  # НЕ {}, это dict
from_list = set([1, 2, 2, 3])  # {1, 2, 3}

# Методы
s.add(4)
s.remove(1)      # KeyError если нет
s.discard(10)    # Без ошибки
s.pop()          # Удалить произвольный

# Операции над множествами
a = {1, 2, 3}
b = {2, 3, 4}
a | b  # {1, 2, 3, 4} — объединение
a & b  # {2, 3} — пересечение
a - b  # {1} — разность
a ^ b  # {1, 4} — симметричная разность

# frozenset — неизменяемое множество
fs = frozenset([1, 2, 3])
```

#### Словари (dict)

Коллекция пар ключ-значение.

```python
# Создание
user = {"name": "Alice", "age": 25}
empty = {}
from_pairs = dict([("a", 1), ("b", 2)])
from_keys = dict.fromkeys(["a", "b"], 0)  # {"a": 0, "b": 0}

# Доступ
user["name"]           # "Alice"
user.get("name")       # "Alice"
user.get("email", "N/A")  # "N/A" (значение по умолчанию)

# Изменение
user["email"] = "alice@example.com"
user.update({"age": 26, "city": "NYC"})

# Методы
user.keys()    # dict_keys(['name', 'age', ...])
user.values()  # dict_values(['Alice', 25, ...])
user.items()   # dict_items([('name', 'Alice'), ...])
user.pop("age")  # Удалить и вернуть
del user["name"] # Удалить

# Итерация
for key in user:
    print(key, user[key])

for key, value in user.items():
    print(f"{key}: {value}")

# Dict comprehension
squares = {x: x ** 2 for x in range(5)}
```

#### None

Специальный тип, обозначающий отсутствие значения.

```python
result = None

if result is None:
    print("Нет результата")

# Проверка на None
x is None      # Правильно
x == None      # Работает, но не рекомендуется
```

#### Преобразование типов

```python
int("42")       # 42
float("3.14")   # 3.14
str(42)         # "42"
bool(0)         # False
bool("")        # False
bool([])        # False
list("abc")     # ['a', 'b', 'c']
tuple([1, 2])   # (1, 2)
set([1, 1, 2])  # {1, 2}
```

---

### Операторы

#### Арифметические

```python
a, b = 10, 3

a + b   # 13 — сложение
a - b   # 7 — вычитание
a * b   # 30 — умножение
a / b   # 3.333... — деление
a // b  # 3 — целочисленное деление
a % b   # 1 — остаток
a ** b  # 1000 — возведение в степень
-a      # -10 — унарный минус
```

#### Сравнения

```python
a == b  # Равно
a != b  # Не равно
a < b   # Меньше
a > b   # Больше
a <= b  # Меньше или равно
a >= b  # Больше или равно

# Цепочки сравнений
1 < x < 10  # Эквивалентно: 1 < x and x < 10
```

#### Логические

```python
True and False  # False
True or False   # True
not True        # False

# Короткое замыкание
x = None
result = x or "default"  # "default"

# Проверка на False-значения
# False, 0, "", [], {}, set(), None — все False в логическом контексте
```

#### Принадлежности и идентичности

```python
# in — проверка вхождения
"a" in "abc"        # True
1 in [1, 2, 3]      # True
"key" in {"key": 1} # True (проверяет ключи)

# is — проверка идентичности (тот же объект в памяти)
a = [1, 2, 3]
b = a
c = [1, 2, 3]
a is b  # True (тот же объект)
a is c  # False (разные объекты)
a == c  # True (равные значения)

# is обычно используется для None
x is None
```

#### Присваивания

```python
x = 10
x += 5   # x = x + 5
x -= 3   # x = x - 3
x *= 2   # x = x * 2
x /= 4   # x = x / 4
x //= 2  # x = x // 2
x %= 3   # x = x % 3
x **= 2  # x = x ** 2

# Walrus operator (Python 3.8+)
if (n := len(data)) > 10:
    print(f"Слишком много данных: {n}")
```

---

### Условные конструкции

#### if / elif / else

```python
age = 18

if age < 13:
    print("Ребёнок")
elif age < 20:
    print("Подросток")
else:
    print("Взрослый")
```

#### Тернарный оператор

```python
status = "adult" if age >= 18 else "minor"

# Эквивалентно
if age >= 18:
    status = "adult"
else:
    status = "minor"
```

#### match / case (Python 3.10+)

```python
def http_status(status):
    match status:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 500 | 502 | 503:  # Несколько значений
            return "Server Error"
        case _:  # default
            return "Unknown"

# Структурное сопоставление
def process_point(point):
    match point:
        case (0, 0):
            print("Origin")
        case (x, 0):
            print(f"On X axis at {x}")
        case (0, y):
            print(f"On Y axis at {y}")
        case (x, y):
            print(f"Point at ({x}, {y})")
        case _:
            print("Not a point")
```

---

### Циклы

#### for

Итерация по последовательности.

```python
# По списку
for item in [1, 2, 3]:
    print(item)

# По строке
for char in "Python":
    print(char)

# По range
for i in range(5):          # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2):   # 2, 4, 6, 8
    print(i)

# По словарю
for key, value in {"a": 1, "b": 2}.items():
    print(f"{key}: {value}")

# С индексом
for i, item in enumerate(["a", "b", "c"]):
    print(f"{i}: {item}")

# Параллельная итерация
names = ["Alice", "Bob"]
ages = [25, 30]
for name, age in zip(names, ages):
    print(f"{name} is {age}")
```

#### while

Цикл с условием.

```python
count = 0
while count < 5:
    print(count)
    count += 1

# Бесконечный цикл
while True:
    user_input = input("Введите 'quit' для выхода: ")
    if user_input == "quit":
        break
```

#### break, continue, else

```python
# break — выход из цикла
for i in range(10):
    if i == 5:
        break
    print(i)  # 0, 1, 2, 3, 4

# continue — переход к следующей итерации
for i in range(5):
    if i == 2:
        continue
    print(i)  # 0, 1, 3, 4

# else — выполняется, если цикл не был прерван break
for i in range(5):
    if i == 10:
        break
else:
    print("Цикл завершился нормально")  # Выполнится
```

---

### Функции

#### Определение и вызов

```python
def greet(name):
    """Приветствует пользователя."""
    return f"Hello, {name}!"

result = greet("Alice")
print(result)  # Hello, Alice!
```

#### Аргументы

```python
# Позиционные и именованные
def power(base, exponent):
    return base ** exponent

power(2, 3)          # 8
power(base=2, exponent=3)  # 8
power(2, exponent=3)       # 8

# Значения по умолчанию
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Alice")            # Hello, Alice!
greet("Alice", "Hi")      # Hi, Alice!

# ВАЖНО: не используйте изменяемые объекты как значения по умолчанию!
# Плохо:
def bad(items=[]):
    items.append(1)
    return items

# Хорошо:
def good(items=None):
    if items is None:
        items = []
    items.append(1)
    return items
```

#### *args и **kwargs

```python
# *args — произвольное число позиционных аргументов
def sum_all(*args):
    return sum(args)

sum_all(1, 2, 3, 4)  # 10

# **kwargs — произвольное число именованных аргументов
def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)

# Комбинация
def func(a, b, *args, **kwargs):
    print(a, b, args, kwargs)

func(1, 2, 3, 4, x=5, y=6)
# 1 2 (3, 4) {'x': 5, 'y': 6}

# Распаковка при вызове
args = [1, 2, 3]
kwargs = {"a": 4, "b": 5}
func(*args, **kwargs)
```

#### Аннотации типов

```python
def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}! " * times).strip()

# Сложные типы
from typing import List, Dict, Optional, Union, Callable

def process(
    items: List[int],
    config: Dict[str, str],
    callback: Optional[Callable[[int], int]] = None
) -> List[int]:
    ...
```

#### Lambda-функции

Анонимные функции для простых выражений.

```python
# Обычная функция
def square(x):
    return x ** 2

# Lambda эквивалент
square = lambda x: x ** 2

# Использование
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))
sorted_words = sorted(["banana", "apple"], key=lambda x: len(x))
```

#### Замыкания

Функция, захватывающая переменные из внешней области.

```python
def make_multiplier(n):
    def multiply(x):
        return x * n
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)

double(5)  # 10
triple(5)  # 15
```

---

### Модули и пакеты

#### Импорт модулей

```python
# Импорт всего модуля
import math
math.sqrt(16)  # 4.0

# Импорт с псевдонимом
import numpy as np
np.array([1, 2, 3])

# Импорт конкретных объектов
from math import sqrt, pi
sqrt(16)  # 4.0

# Импорт с переименованием
from math import sqrt as square_root

# Импорт всего (не рекомендуется)
from math import *
```

#### Создание модуля

```python
# mymodule.py
"""Мой модуль."""

PI = 3.14159

def greet(name):
    return f"Hello, {name}!"

class Calculator:
    def add(self, a, b):
        return a + b

# Выполняется только при запуске напрямую
if __name__ == "__main__":
    print(greet("World"))
```

```python
# main.py
import mymodule

mymodule.greet("Alice")
calc = mymodule.Calculator()
```

#### Пакеты

```
mypackage/
├── __init__.py
├── module1.py
├── module2.py
└── subpackage/
    ├── __init__.py
    └── module3.py
```

```python
# mypackage/__init__.py
from .module1 import func1
from .module2 import func2

__all__ = ["func1", "func2"]  # Что экспортировать при from package import *
```

```python
# Использование
from mypackage import func1
from mypackage.subpackage import module3
```

#### Стандартная библиотека

```python
import os          # Работа с ОС
import sys         # Системные функции
import json        # JSON
import re          # Регулярные выражения
import datetime    # Дата и время
import collections # Специальные контейнеры
import itertools   # Итераторы
import functools   # Функциональные инструменты
import pathlib     # Работа с путями
import random      # Случайные числа
import math        # Математика
import logging     # Логирование
import unittest    # Тестирование
import typing      # Аннотации типов
```

---

### Объектно-ориентированное программирование

#### Классы и объекты

```python
class Dog:
    # Атрибут класса (общий для всех экземпляров)
    species = "Canis familiaris"

    # Конструктор
    def __init__(self, name, age):
        # Атрибуты экземпляра
        self.name = name
        self.age = age

    # Метод экземпляра
    def bark(self):
        return f"{self.name} says Woof!"

    # Строковое представление
    def __str__(self):
        return f"{self.name}, {self.age} years old"

    def __repr__(self):
        return f"Dog(name='{self.name}', age={self.age})"

# Создание экземпляра
dog = Dog("Buddy", 3)
print(dog.name)    # Buddy
print(dog.bark())  # Buddy says Woof!
print(dog)         # Buddy, 3 years old
```

#### Наследование

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError("Subclass must implement")

class Dog(Animal):
    def speak(self):
        return f"{self.name} says Woof!"

class Cat(Animal):
    def speak(self):
        return f"{self.name} says Meow!"

# Использование
dog = Dog("Buddy")
cat = Cat("Whiskers")
dog.speak()  # Buddy says Woof!
cat.speak()  # Whiskers says Meow!

# Проверка наследования
isinstance(dog, Dog)     # True
isinstance(dog, Animal)  # True
issubclass(Dog, Animal)  # True
```

#### Множественное наследование

```python
class Flyable:
    def fly(self):
        return "Flying!"

class Swimmable:
    def swim(self):
        return "Swimming!"

class Duck(Animal, Flyable, Swimmable):
    def speak(self):
        return "Quack!"

duck = Duck("Donald")
duck.fly()    # Flying!
duck.swim()   # Swimming!
duck.speak()  # Quack!

# MRO (Method Resolution Order)
print(Duck.__mro__)
```

#### Инкапсуляция

```python
class BankAccount:
    def __init__(self, balance):
        self._balance = balance      # "protected" (по соглашению)
        self.__secret = "hidden"     # "private" (name mangling)

    @property
    def balance(self):
        """Геттер."""
        return self._balance

    @balance.setter
    def balance(self, value):
        """Сеттер с валидацией."""
        if value < 0:
            raise ValueError("Balance cannot be negative")
        self._balance = value

    @balance.deleter
    def balance(self):
        """Удаление."""
        del self._balance

account = BankAccount(100)
print(account.balance)    # 100 (через геттер)
account.balance = 200     # Через сеттер
account.balance = -50     # ValueError
```

#### Статические и классовые методы

```python
class MyClass:
    class_attr = 0

    def __init__(self, value):
        self.value = value

    # Обычный метод — принимает self
    def instance_method(self):
        return f"Instance: {self.value}"

    # Метод класса — принимает cls
    @classmethod
    def class_method(cls):
        return f"Class attr: {cls.class_attr}"

    # Статический метод — не принимает ни self, ни cls
    @staticmethod
    def static_method(x, y):
        return x + y

    # Альтернативный конструктор
    @classmethod
    def from_string(cls, s):
        value = int(s)
        return cls(value)

obj = MyClass(10)
obj.instance_method()     # Instance: 10
MyClass.class_method()    # Class attr: 0
MyClass.static_method(2, 3)  # 5
MyClass.from_string("42") # MyClass(value=42)
```

#### Dataclasses (Python 3.7+)

Упрощённое создание классов для хранения данных.

```python
from dataclasses import dataclass, field
from typing import List

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Person:
    name: str
    age: int
    email: str = ""  # Значение по умолчанию
    tags: List[str] = field(default_factory=list)  # Изменяемое по умолчанию

    def greet(self):
        return f"Hello, I'm {self.name}"

# Автоматически создаются __init__, __repr__, __eq__
p1 = Person("Alice", 25)
p2 = Person("Alice", 25)
p1 == p2  # True

# frozen=True делает неизменяемым
@dataclass(frozen=True)
class ImmutablePoint:
    x: float
    y: float
```

#### Абстрактные классы

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

    @abstractmethod
    def perimeter(self) -> float:
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)

# shape = Shape()  # TypeError: Can't instantiate abstract class
rect = Rectangle(3, 4)
rect.area()  # 12
```

#### Магические методы (dunder methods)

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    # Строковое представление
    def __str__(self):
        return f"Vector({self.x}, {self.y})"

    def __repr__(self):
        return f"Vector({self.x!r}, {self.y!r})"

    # Арифметика
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        return Vector(self.x * scalar, self.y * scalar)

    # Сравнение
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __lt__(self, other):
        return (self.x ** 2 + self.y ** 2) < (other.x ** 2 + other.y ** 2)

    # Длина, индексация
    def __len__(self):
        return 2

    def __getitem__(self, index):
        return (self.x, self.y)[index]

    # Вызов как функции
    def __call__(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

    # Контекст (with)
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

v1 = Vector(3, 4)
v2 = Vector(1, 2)
v1 + v2      # Vector(4, 6)
v1 * 2       # Vector(6, 8)
v1()         # 5.0 (длина вектора)
v1[0]        # 3
len(v1)      # 2
```

---

### Обработка исключений

#### try / except / else / finally

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Деление на ноль!")
except (TypeError, ValueError) as e:
    print(f"Ошибка: {e}")
except Exception as e:
    print(f"Неизвестная ошибка: {e}")
else:
    # Выполняется, если исключений не было
    print(f"Результат: {result}")
finally:
    # Выполняется всегда
    print("Завершение")
```

#### Встроенные исключения

```python
# Иерархия
BaseException
├── SystemExit
├── KeyboardInterrupt
├── GeneratorExit
└── Exception
    ├── StopIteration
    ├── ArithmeticError
    │   ├── ZeroDivisionError
    │   └── OverflowError
    ├── LookupError
    │   ├── IndexError
    │   └── KeyError
    ├── TypeError
    ├── ValueError
    ├── AttributeError
    ├── OSError
    │   └── FileNotFoundError
    └── ...
```

#### Создание исключений

```python
# raise — выбросить исключение
def divide(a, b):
    if b == 0:
        raise ValueError("Делитель не может быть нулём")
    return a / b

# Собственные исключения
class ValidationError(Exception):
    """Ошибка валидации данных."""
    pass

class UserNotFoundError(Exception):
    def __init__(self, user_id):
        self.user_id = user_id
        super().__init__(f"User {user_id} not found")

# Использование
try:
    raise UserNotFoundError(123)
except UserNotFoundError as e:
    print(e)  # User 123 not found
    print(e.user_id)  # 123
```

#### Цепочки исключений

```python
try:
    int("abc")
except ValueError as e:
    raise RuntimeError("Conversion failed") from e
```

---

### Работа с файлами

#### Чтение и запись

```python
# Запись
with open("file.txt", "w", encoding="utf-8") as f:
    f.write("Hello, World!\n")
    f.writelines(["Line 1\n", "Line 2\n"])

# Чтение всего файла
with open("file.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Чтение по строкам
with open("file.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())

# Чтение в список
with open("file.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Режимы открытия
# "r"  — чтение (по умолчанию)
# "w"  — запись (перезаписывает)
# "a"  — дозапись
# "x"  — создание (ошибка если существует)
# "b"  — бинарный режим
# "t"  — текстовый режим (по умолчанию)
# "+"  — чтение и запись
```

#### pathlib (рекомендуется)

```python
from pathlib import Path

# Создание путей
p = Path("folder/file.txt")
home = Path.home()
cwd = Path.cwd()

# Операции
p.exists()
p.is_file()
p.is_dir()
p.name        # "file.txt"
p.stem        # "file"
p.suffix      # ".txt"
p.parent      # Path("folder")

# Чтение/запись
p.read_text(encoding="utf-8")
p.write_text("content", encoding="utf-8")
p.read_bytes()
p.write_bytes(b"binary")

# Создание директорий
Path("new/nested/dir").mkdir(parents=True, exist_ok=True)

# Поиск файлов
for py_file in Path(".").glob("**/*.py"):
    print(py_file)

# Объединение путей
new_path = Path("folder") / "subfolder" / "file.txt"
```

#### JSON

```python
import json

data = {"name": "Alice", "age": 25, "skills": ["Python", "SQL"]}

# Сериализация
json_string = json.dumps(data, indent=2, ensure_ascii=False)

# В файл
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Десериализация
parsed = json.loads(json_string)

# Из файла
with open("data.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
```

#### CSV

```python
import csv

# Запись
with open("data.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "age"])
    writer.writerows([["Alice", 25], ["Bob", 30]])

# Чтение
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)

# DictReader / DictWriter
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"], row["age"])
```

---

### Итераторы и генераторы

#### Итераторы

Объект, по которому можно итерироваться.

```python
# Создание итератора
nums = [1, 2, 3]
iterator = iter(nums)

next(iterator)  # 1
next(iterator)  # 2
next(iterator)  # 3
next(iterator)  # StopIteration

# Собственный итератор
class Counter:
    def __init__(self, max_value):
        self.max = max_value
        self.current = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.max:
            raise StopIteration
        self.current += 1
        return self.current

for num in Counter(5):
    print(num)  # 1, 2, 3, 4, 5
```

#### Генераторы

Ленивые итераторы, создающие значения по требованию.

```python
# Генератор-функция
def count_up_to(n):
    i = 1
    while i <= n:
        yield i
        i += 1

for num in count_up_to(5):
    print(num)

# Генератор-выражение
squares = (x ** 2 for x in range(10))  # Не список!
print(next(squares))  # 0
print(next(squares))  # 1

# Преимущества генераторов:
# - Память: значения создаются по одному
# - Бесконечные последовательности
# - Ленивые вычисления
```

#### yield from

```python
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)  # Делегирование
        else:
            yield item

list(flatten([1, [2, 3, [4, 5]], 6]))  # [1, 2, 3, 4, 5, 6]
```

#### itertools

```python
from itertools import (
    count, cycle, repeat,           # Бесконечные
    chain, compress, dropwhile,     # Комбинирование
    takewhile, islice, groupby,
    combinations, permutations,     # Комбинаторика
    product, starmap, accumulate
)

# count — бесконечный счётчик
for i in islice(count(10, 2), 5):  # 10, 12, 14, 16, 18
    print(i)

# chain — объединение итераторов
list(chain([1, 2], [3, 4]))  # [1, 2, 3, 4]

# combinations
list(combinations("ABC", 2))  # [('A','B'), ('A','C'), ('B','C')]

# permutations
list(permutations("AB", 2))   # [('A','B'), ('B','A')]

# groupby
data = [("a", 1), ("a", 2), ("b", 3)]
for key, group in groupby(data, key=lambda x: x[0]):
    print(key, list(group))
```

---

### Декораторы

Функции, модифицирующие поведение других функций.

#### Простой декоратор

```python
def logger(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Finished {func.__name__}")
        return result
    return wrapper

@logger
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")
# Calling greet
# Hello, Alice!
# Finished greet
```

#### Декоратор с аргументами

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
def say_hello():
    print("Hello!")

say_hello()  # Hello! Hello! Hello!
```

#### functools.wraps

Сохраняет метаданные оригинальной функции.

```python
from functools import wraps

def logger(func):
    @wraps(func)  # Сохраняет __name__, __doc__ и т.д.
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

#### Встроенные декораторы

```python
class MyClass:
    @property
    def value(self):
        return self._value

    @staticmethod
    def static():
        pass

    @classmethod
    def class_method(cls):
        pass

    @abstractmethod
    def abstract(self):
        pass
```

#### Декораторы классов

```python
def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class Database:
    pass

db1 = Database()
db2 = Database()
db1 is db2  # True
```

---

### Контекстные менеджеры

Управление ресурсами с гарантированной очисткой.

#### with statement

```python
# Файлы
with open("file.txt") as f:
    content = f.read()
# Файл автоматически закрывается

# Несколько контекстов
with open("in.txt") as f_in, open("out.txt", "w") as f_out:
    f_out.write(f_in.read())
```

#### Создание через класс

```python
class Timer:
    def __enter__(self):
        import time
        self.start = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.elapsed = time.time() - self.start
        print(f"Elapsed: {self.elapsed:.2f}s")
        return False  # Не подавлять исключения

with Timer() as t:
    sum(range(10 ** 6))
# Elapsed: 0.03s
```

#### contextlib

```python
from contextlib import contextmanager, suppress

# Через генератор
@contextmanager
def timer():
    import time
    start = time.time()
    try:
        yield
    finally:
        print(f"Elapsed: {time.time() - start:.2f}s")

with timer():
    sum(range(10 ** 6))

# suppress — подавление исключений
with suppress(FileNotFoundError):
    os.remove("nonexistent.txt")
```

---

### Асинхронное программирование

#### async / await

```python
import asyncio

async def fetch_data(url: str) -> str:
    print(f"Fetching {url}")
    await asyncio.sleep(1)  # Имитация IO-операции
    return f"Data from {url}"

async def main():
    # Последовательно
    result1 = await fetch_data("url1")
    result2 = await fetch_data("url2")

    # Параллельно
    results = await asyncio.gather(
        fetch_data("url1"),
        fetch_data("url2"),
        fetch_data("url3")
    )
    print(results)

# Запуск
asyncio.run(main())
```

#### Асинхронные генераторы и контексты

```python
# Асинхронный генератор
async def async_range(n):
    for i in range(n):
        await asyncio.sleep(0.1)
        yield i

async def main():
    async for num in async_range(5):
        print(num)

# Асинхронный контекстный менеджер
class AsyncResource:
    async def __aenter__(self):
        await asyncio.sleep(0.1)
        return self

    async def __aexit__(self, *args):
        await asyncio.sleep(0.1)

async def main():
    async with AsyncResource() as r:
        pass
```

#### aiohttp (асинхронные HTTP-запросы)

```python
import aiohttp
import asyncio

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main():
    async with aiohttp.ClientSession() as session:
        urls = ["https://example.com"] * 10
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)

asyncio.run(main())
```

---

### Type Hints

Статическая типизация для Python (PEP 484).

#### Базовые типы

```python
from typing import (
    List, Dict, Set, Tuple,
    Optional, Union, Any,
    Callable, TypeVar, Generic
)

# Примитивы
name: str = "Alice"
age: int = 25
height: float = 1.75
is_active: bool = True

# Коллекции (Python 3.9+ можно list[int])
numbers: List[int] = [1, 2, 3]
mapping: Dict[str, int] = {"a": 1}
unique: Set[str] = {"a", "b"}
point: Tuple[float, float] = (3.0, 4.0)
```

#### Optional и Union

```python
# Optional[X] = Union[X, None]
def find_user(user_id: int) -> Optional[str]:
    if user_id == 1:
        return "Alice"
    return None

# Union — несколько возможных типов
def process(value: Union[int, str]) -> str:
    return str(value)

# Python 3.10+: X | Y вместо Union[X, Y]
def process(value: int | str) -> str:
    return str(value)
```

#### Callable

```python
from typing import Callable

# Callable[[ArgTypes...], ReturnType]
def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

apply(lambda x, y: x + y, 2, 3)  # 5
```

#### Generics

```python
from typing import TypeVar, Generic, List

T = TypeVar("T")

def first(items: List[T]) -> T:
    return items[0]

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: List[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

stack: Stack[int] = Stack()
stack.push(1)
```

#### Проверка типов

```bash
# mypy — статический анализатор
pip install mypy
mypy script.py

# pyright (быстрее, используется в VS Code)
pip install pyright
pyright script.py
```

---

### Тестирование

#### unittest

```python
import unittest

def add(a, b):
    return a + b

class TestAdd(unittest.TestCase):
    def setUp(self):
        """Выполняется перед каждым тестом."""
        self.data = [1, 2, 3]

    def tearDown(self):
        """Выполняется после каждого теста."""
        pass

    def test_add_positive(self):
        self.assertEqual(add(2, 3), 5)

    def test_add_negative(self):
        self.assertEqual(add(-1, 1), 0)

    def test_add_raises(self):
        with self.assertRaises(TypeError):
            add("a", 1)

if __name__ == "__main__":
    unittest.main()
```

#### pytest (рекомендуется)

```python
# test_example.py
import pytest

def add(a, b):
    return a + b

def test_add_positive():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-1, 1) == 0

# Параметризация
@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected

# Фикстуры
@pytest.fixture
def sample_data():
    return [1, 2, 3, 4, 5]

def test_sum(sample_data):
    assert sum(sample_data) == 15

# Проверка исключений
def test_raises():
    with pytest.raises(ZeroDivisionError):
        1 / 0
```

```bash
# Запуск
pytest
pytest test_example.py
pytest -v  # verbose
pytest -k "test_add"  # по имени
pytest --cov=mymodule  # с покрытием
```

---

### Полезные библиотеки

| Библиотека | Назначение |
|------------|------------|
| **requests** | HTTP-клиент |
| **httpx** | Async HTTP-клиент |
| **pydantic** | Валидация данных |
| **sqlalchemy** | ORM для баз данных |
| **pandas** | Анализ данных |
| **numpy** | Научные вычисления |
| **click** / **typer** | CLI-приложения |
| **rich** | Красивый вывод в консоль |
| **loguru** | Удобное логирование |
| **celery** | Очереди задач |
| **pytest** | Тестирование |

---

## Backend-разработка

### Django

Django — full-stack веб-фреймворк с "батарейками в комплекте". Включает ORM, админку, аутентификацию, формы и многое другое.

#### Основные концепции

```
Django Project
├── manage.py           # CLI-утилита
├── myproject/
│   ├── settings.py     # Конфигурация
│   ├── urls.py         # Маршрутизация
│   └── wsgi.py         # WSGI-точка входа
└── myapp/
    ├── models.py       # Модели (ORM)
    ├── views.py        # Представления (контроллеры)
    ├── urls.py         # URL-маршруты приложения
    ├── admin.py        # Админ-панель
    ├── forms.py        # Формы
    └── templates/      # Шаблоны
```

#### Быстрый старт

```bash
pip install django
django-admin startproject myproject
cd myproject
python manage.py startapp myapp
python manage.py runserver
```

#### Модели (ORM)

```python
# models.py
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey("User", on_delete=models.CASCADE)

    def __str__(self):
        return self.title
```

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Views и URLs

```python
# views.py
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Article

def article_list(request):
    articles = Article.objects.all()
    return render(request, "articles/list.html", {"articles": articles})

def article_detail(request, pk):
    article = get_object_or_404(Article, pk=pk)
    return render(request, "articles/detail.html", {"article": article})

# Class-Based Views
from django.views.generic import ListView, DetailView

class ArticleListView(ListView):
    model = Article
    template_name = "articles/list.html"
```

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("articles/", views.article_list, name="article_list"),
    path("articles/<int:pk>/", views.article_detail, name="article_detail"),
]
```

#### Django REST Framework

```python
# serializers.py
from rest_framework import serializers
from .models import Article

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "content", "created_at"]

# views.py
from rest_framework import viewsets
from .serializers import ArticleSerializer

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
```

**Когда использовать Django:**
- Полноценные веб-приложения с админкой
- Быстрый старт с готовыми решениями
- Монолитная архитектура
- Когда нужны "батарейки" из коробки

---

### FastAPI

FastAPI — современный асинхронный фреймворк для создания API. Основан на Pydantic и Starlette.

#### Основные концепции

```
FastAPI Project
├── main.py             # Точка входа
├── routers/            # Маршруты
├── models/             # Pydantic-модели
├── services/           # Бизнес-логика
├── repositories/       # Работа с БД
└── core/
    ├── config.py       # Конфигурация
    └── dependencies.py # Зависимости
```

#### Быстрый старт

```bash
pip install fastapi uvicorn
```

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
```

```bash
uvicorn main:app --reload
# Docs: http://localhost:8000/docs
```

#### Pydantic-модели

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    created_at: datetime

    class Config:
        from_attributes = True  # Для ORM
```

#### CRUD-операции

```python
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session

app = FastAPI()

@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

#### Dependency Injection

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@app.get("/me")
async def read_me(user: User = Depends(get_current_user)):
    return user
```

#### Асинхронность

```python
import httpx

@app.get("/external")
async def fetch_external():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        return response.json()
```

**Когда использовать FastAPI:**
- REST API и микросервисы
- Высокая производительность и асинхронность
- Автогенерация документации (OpenAPI/Swagger)
- Type hints и валидация из коробки

---

### Django vs FastAPI

| Критерий | Django | FastAPI |
|----------|--------|---------|
| **Тип** | Full-stack | API-first |
| **Асинхронность** | Частичная (Django 4+) | Нативная |
| **Админка** | Встроенная | Нет |
| **ORM** | Django ORM | SQLAlchemy / Tortoise |
| **Валидация** | Forms / DRF Serializers | Pydantic |
| **Документация API** | DRF + drf-yasg | Встроенная (Swagger) |
| **Кривая обучения** | Выше | Ниже |
| **Производительность** | Хорошая | Отличная |

---

## Практические задания

### Уровень 1: Основы

1. **FizzBuzz**: Напишите программу, которая выводит числа от 1 до 100. Для кратных 3 — "Fizz", для кратных 5 — "Buzz", для кратных 15 — "FizzBuzz".

2. **Палиндром**: Напишите функцию, проверяющую, является ли строка палиндромом (без учёта регистра и пробелов).

3. **Факториал**: Реализуйте вычисление факториала рекурсивно и итеративно.

4. **Фибоначчи**: Напишите генератор чисел Фибоначчи.

5. **Анаграммы**: Напишите функцию, проверяющую, являются ли две строки анаграммами.

### Уровень 2: Коллекции и функции

6. **Частота слов**: Посчитайте частоту каждого слова в тексте. Выведите топ-10.

7. **Flatten**: Напишите функцию, которая "разворачивает" вложенные списки любой глубины.

8. **Группировка**: Сгруппируйте список словарей по заданному ключу.

9. **Декоратор retry**: Напишите декоратор, который повторяет вызов функции N раз при возникновении исключения.

10. **Кэширующий декоратор**: Реализуйте мемоизацию (кэширование результатов функции).

### Уровень 3: ООП

11. **Банковский счёт**: Создайте класс `BankAccount` с методами deposit, withdraw, transfer. Добавьте историю операций.

12. **Фигуры**: Создайте иерархию классов геометрических фигур с методами area() и perimeter().

13. **Singleton**: Реализуйте паттерн Singleton тремя способами (декоратор, метакласс, `__new__`).

14. **Связный список**: Реализуйте односвязный список с методами append, prepend, delete, find.

15. **Итератор**: Создайте класс-итератор для обхода бинарного дерева (in-order, pre-order, post-order).

### Уровень 4: Продвинутое

16. **Контекстный менеджер БД**: Напишите контекстный менеджер для управления соединением с SQLite.

17. **Пул потоков**: Реализуйте простой пул потоков с очередью задач.

18. **Async scraper**: Напишите асинхронный скрейпер, который загружает N страниц параллельно.

19. **CLI-утилита**: Создайте CLI-утилиту с использованием `argparse` или `click` (например, конвертер файлов).

20. **REST API**: Создайте простое REST API на FastAPI с CRUD-операциями и SQLite.

### Решения

Решения к заданиям можно найти в репозитории: [Python Practice Solutions](https://github.com/topics/python-exercises)

---

## Ссылки

- [Официальная документация Python](https://docs.python.org/3/)
- [Real Python](https://realpython.com/)
- [Python Tutorial — W3Schools](https://www.w3schools.com/python/)
- [Django Documentation](https://docs.djangoproject.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [[AI Instruments#Python|Python в AI]]
