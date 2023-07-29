
## Знакомство с языком Ruby

Проверка версии ruby

```bash
ruby -v
```

Обновление ruby

```bash
curl -L https://get.rvm.io | bash -s stable
```

Установка нужной версии ruby

```bash
rvm install ruby-2.4.2
```

Вывод сообщений в консоль

`print` - выводит строку без переносов (можно в конце указать `\n`)
`puts` - выводит строку и ставит перенос на следующую строку

```rb
print "Привет, мир!\n"
print "Привет, мир!\n"
puts "Привет, мир!"
puts "Привет, мир!"
```

![](_png/Pasted%20image%2020230727163255.png)


## Переменные и типы данных

В ruby присутствует 5 типов данных: 
- int
- float
- string
- boolean
- nil

```rb
age = 29
puts(age) # 29

money = 29.80
puts(money) # 29.80

name = 'Олег'
isValid = true
none = nil # это отсутствие значения
```

##  Строки и математические действия

- `downcase` - приводит в нижний регистр
- `upcase` - приводит в верхний регистр
- `strip` - убирает пробелы
- `length` - выводит длину
- `include`? - позволяет проверить, включает ли переменная данное значение

```rb
words = 'Это очень '
word = '\'Мило\''
puts(words.downcase() + word.upcase())

nothing = '    Ничего    '
puts(nothing.strip())

length = 'Длина'
puts(length.length())

name = 'Валера'
puts(name.include? 'Ва')
```

![](_png/Pasted%20image%2020230727170528.png)

У нас есть все основные операции, которые есть и в других языках. 

Стоит отметить, что в puts мы складываем сейчас два разных типа данных, поэтому второй аргумент мы приводим к строке через `to_s`

```rb
x = 5
y = 11

res = x + y
res = x - y
res = x * y
res = x / y
res = x ** y
res = y % x

puts("Результат остатка от деления: " + res.to_s)

number = 14.55

puts(number.abs()) # выведет то же число
puts(number.round()) # округлит в большую сторону
puts(Math.sqrt(144)) # вычислит квадратный корень из 144
```

![](_png/Pasted%20image%2020230727171142.png)

## Получение данных от пользователя

С помощью функции `gets` мы можем в консоли получить текст от пользователя

```rb
puts('Hello, what\'s your name:');
name = gets;
puts("Asking for you," + name + ", man");

puts('Hello, what\'s your name:');
name = gets.chomp(); # отменит перевод на новую строку
puts("Asking for you," + name + ", man")
```

![](_png/Pasted%20image%2020230729165636.png)

И тут мы сразу получаем значения и переводим их в числа через `to_i` или `to_f`

```rb
print("Первое число: ");
x = gets.chomp();
print("Второе число: ");
y = gets.chomp().to_i; # если нам нужны дробные числа, то переводим через to_f
puts(x.to_i + y);
```

![](_png/Pasted%20image%2020230729170106.png)

## Массивы и ассоциативные массивы

Массивы создаются через ключевое слово `Array`. 

Ассоциативные массивы создаются внутри `{}` и пары ключ-значение заносятся через `=>`

```rb
arr = Array[1, 2, 3, 4, true, "Oleg"];
arrNames = Array['Oleg', 'Anton', 'Vladislav'];

puts(arr); # выведет весь массив
puts(arrNames[0]); # выведет один элемент
puts(arrNames[1, 2]); # выведет диапазон

list = Array.new; # создаём пустой массив без элементов
list[0] = 1;
list[4] = 4;
puts list.length(); # длина массива
puts list.reverse(); # выведет массив в обратном порядке
puts list.include? 1; # будет искать элемент в массиве

#ассоциативный массив
countries = {
    "RU" => "Russia",
    1 => "Australia",
    :US => "United States"
};

puts countries["RU"]; # выводим ассоциативное значение
puts countries[1];
puts countries[:US];
```

![](_png/Pasted%20image%2020230729173632.png)

## Методы и оператор return































