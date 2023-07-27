
## #1 - Знакомство с языком Ruby

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


## #2 - Переменные и типы данных

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

##  #3 - Строки и математические действия

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









