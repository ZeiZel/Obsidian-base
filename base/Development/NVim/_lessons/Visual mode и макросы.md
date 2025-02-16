
### Visual Mode

Визуальный режим позволяет нам выделять в своих рамках текст.

![](_png/Pasted%20image%2020240915182231.png)

Всего сущесвует несколько типов разных визуальных режимов:

1. `v` - простой визуальный режим. Текст выделяется при перемещении курсора.
2. `V` - реэим выделения строк.

![](_png/Pasted%20image%2020240918200418.png)

3. `ctrl + shift + v` - визуальный блок-режим. Выделяется прямоугольный блок текста. Зачастую нужен для столбцеобразных данных.

![](_png/Pasted%20image%2020240918200848.png)

В визуальном режиме работают так же все команды и удобно комбинировать `d` / `dw`, `y` / `yy`, `c` / `cw`

Весь текст, поверх которого мы вставляем наш текст, будет попадать в регистр

![](_png/Pasted%20image%2020240918200710.png)

Самый сэмпловый пример использования: скопировал слово `yw`, вставил поверх `vwp`

### Изменение регистра

`u` - в обычном режиме отменяет изменения. В режиме выделения он меняет регистр букв.

- `U` - меняет на верхний регистр.
- `u` - меняет на нижний регистр.

`veU` - поменяет регистр на верхний

![](_png/Pasted%20image%2020240918202826.png)

![](_png/Pasted%20image%2020240918202821.png)

`~` - также меняет регистр, но без дополнительного выделения. Просто переходим на нужный символ без выделения и используем.

![](_png/Pasted%20image%2020240918203235.png)

### V-Line Mode

`V` - включает режим выделения строк. Этот режим позволяет выделать нам сразу целые группы строк и так же позволяет рабоатать с `d`, `y`, `p`. 

Обычно, для перемещения строк мы используем удаление и вставку `dd + P`. Этот режим имеет особенную синергию с командой `:m`, которая позволяет перемещать выделенные строки туда, куда мы укажем.

`:m10` - переместит на десятую строку
`:m+10` - переместит на 10 строк вниз (так же можно указать и `-`)

![](_png/Pasted%20image%2020240918204231.png)

![](_png/Pasted%20image%2020240918204226.png)

Сама по себе команда `:m` работает и без режима выделения, но она здорово помогает с переносом большого количества строк.

### V-Block Mode

`ctrl + v` / `ctrl + V` переводит нас в режим визуального блочного выделения. Этот режим повзоляет выбирать многострочным образом, но не захватывая строки целиком, а в радиусе блока

![](_png/Pasted%20image%2020240919202150.png)

Удобен он тем, что его можно использовать как:
- Мультикурсор - редактирование одинаковым образом сразу нескольких строк
- Выделение блока - выделение по параллелепипеду

Чтобы пе6рейти к редактированию на том блоке, который мы выделили, мы должны:
- выделить блок
- нажать на `I`
- начать вводить первую строку
- выйти из режима, чтобы принять изменения из одной строки сразу во все выделенные

![](_png/Pasted%20image%2020240919202544.png)

Удаление уже работает проще и оно просто на `d` удаляет выделенный участок. 

Вставка через `p`/`P` сразу будет многострочной.

### Макросы

Макрос - это инструмент Vim, который позволяет в одно движение выполнять однотипные действия.

Очень удобны макросы для того, чтобы в одно движение модифицировать большое колчиество текста aka кода.

Например, у нас есть много обычных функций, которые мы хотим перевести в стрелочные:

```TS
const myFn = () => {
}

function myFn() {
}

function newFn() {
}

function anotherFn() {
}
```

Начать записывать макрос можно на `q`. Далее нам нужно указать ячейку, в которую будем записывать макрос - тоже можно `q`. И теперь все наши действия записываются до тех пор, пока мы ещё раз не нажмём `q`, чтобы зафиксировать эти изменения.

`cw const esc f( i = esc f{ i =>` - этим небольшим набором действий мы превратили из обычной функции в стрелочную

```TS
const newFn = () => {
}
```

И теперь мы можем применить этот макрос сочетанием `@q`, где второе значение - ячейка макроса

![](_png/Pasted%20image%2020240919204630.png)
