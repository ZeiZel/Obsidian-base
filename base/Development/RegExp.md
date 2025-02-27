
>[!info] Для более глубокого изучения, можно воспользоваться [статьёй](https://rexegg.com/) по RegExp - RexEgg

**Регулярное выражение** — это последовательность селекторов, которые можно использовать для поиска слов по определённым правилам.

## Основные символы в регулярных выражениях

1. Символы текста - просто символы букв алфавита. Регулярное выражение `оса` найдет совпадение даже в слове «авт**оса**лон»
2. Начала и конца строки - каретка `^` используется для обозначения начала строки, а доллар `$` — для конца. Если мы напишем `^оса$`, то совпадением будет только со словом «оса»
3. Классы символов - с их помощью указываются диапазоны символов.

То есть вы можете уточнить, какие буквы, цифры или знаки могут встречаться в регулярном выражении, а какие нет.

`[^]` — отрицание диапазона символов. Если коротко, вы можете исключить поиск конкретных символов. Например, `[^оса]` не найдёт совпадений со словом «оса», а вот с «**оса**дками» совпадение будет.

Цифры:

- `[0-9]` — любая цифра от нуля до девяти;
- `\d` — тоже любая цифра, это эквивалент `[0-9]`.

Буквы:

- `[а-яё]` — любая буква кириллицы в нижнем регистре;
- `[а-яёА-ЯЁ]` — любая буква кириллицы в нижнем и верхнем регистре;
- `[a-z]` — любая буква на латинице в нижнем регистре;
- `[a-zA-Z]` — любая буква на латинице в нижнем и верхнем регистре;
- `\w` — любая цифра, латинская буква или знак подчёркивания.

Символы и знаки препинания:

- `[.,:;?!-]` — знаки препинания.
- `\s` — пробел.

4. Квантификаторы - эти селекторы проверяют количество повторений предыдущего символа или группы символов

- `{n}` — совпадение с точным количеством, где `n` — это положительное целое число. Например, конструкция `[1-3]{1}` будет искать одну цифру от одного до трёх.
- `{min,max}` — диапазон совпадений от минимального до максимального. Например, так можно указать минимальное и максимальное количество символов для ввода — `{2,15}`. А ещё одно из значений можно пропустить — `{min,}` или `{,max}`.
- `— одно или бесконечное количество совпадений. Этот селектор равнозначен записи``.
- `+` — одно или более повторений. Этот селектор равнозначен записи `{1,}`.
- `?` — ни одного или одно повторение. Селектор равнозначен записи `{0,1}`.

5. Модификаторы - это определённые параметры, которые задают настройки для поиска или замены текста

Самые популярные модификаторы:

- `i` — не учитывать регистр букв;
- `g` — искать все совпадения;
- `u` — поддержка юникод-символов.

6. Альтернация - это условие.

Она обозначается символом `|` и указывает несколько вариантов, которые могут соответствовать регулярному выражению. Например, регулярное выражение `(яблоко|банан)` будет искать строки, содержащие либо слово «яблоко», либо «банан».

**Символы группируются в скобках**. При этом вы можете добавить условие «или» для любого количества символов: `(a|b|c|d)`.

## Как составить регулярное выражение

1. Нужно **сформулировать условие**.

Мы хотим составить RegExp для проверки логина, который должен соотвествовать следующим условиям:
- длиннее трёх символов
- содержит буквы на кириллице и латиннице
- регистр нам не важен

2. Нужно **составить выражение.**

- Логин содержит буквы или цифры — `/^[a-zа-яё0-9]/`.
- Слово должно быть не короче трёх символов, максимальной длины нет — `/^[a-zа-яё0-9]{3,}/`.
- Регистр неважен — `/^[a-zа-яё0-9]{3``,}$/i`.

3. Нужно **протестировать регулярное выражение**. 

Для проверки регулярного выражения можно воспользоваться [regex101.](https://regex101.com/)

## Примеры регулярных выражений

 1. Регулярное выражение для номера телефона

Допустим, мы хотим проверить, что пользователь ввёл телефон в формате `(XXX) XXX-XXXX`. Можно составить следующее регулярное выражение: `/^\d{3}-\d{3}-\d{4}$/`. Здесь `\d` соответствует любой цифре, а фигурные скобки `{` и `}` указывают количество повторений.

Такое регулярное выражение будет соответствовать строкам, которые начинаются с открывающей скобки. За скобкой следуют три цифры, затем пробел, ещё три цифры, дефис и четыре цифры. Последним идёт символ конца строки.

>[!info] При проверке `123-456-7890` будет соответствовать шаблону, а `(123) 456 7890` — нет.

2. Регулярное выражение для электронной почты

Составим регулярное выражение, которое проверяет формат почты `username@domain.com` — `/^\w+([.-]?\w+)@\w+([.-]?\w+)(.\w)$/`. Выражение сложное, поэтому давайте посимвольно разбирать, что здесь происходит:

- `^` — начало строки.
- `\w` — любая буква, цифра или символ подчёркивания.
- `+` — указывает, что предыдущий символ (любая буква, цифра или символ подчёркивания) должен повторяться один или более раз.
- `([.-]?\w+)*` — группа символов. Она начинается с точки, дефиса или ни одного из них (`?`). За ними следует одна или более буквы, цифры или символы подчёркивания (`\w+`). Звёздочка указывает, что эта группа может встречаться нуль или более раз.
- `@` — символ собаки, он обязателен в адресе электронной почты.
- `\w` — любая буква, цифра или символ подчёркивания.
- `([.-]?\w+)*` — аналогичная группа символов, как описано выше.
- `.` — просто точка.
- `\w` — любые буквы, цифры или символ подчёркивания.
- `$` — конец строки.

Если коротко, это регулярное выражение будет соответствовать строкам, которые начинаются с одной или более буквы, цифры или символа подчёркивания. За ними следует символ `@`. Затем идёт одна или более группа символов — она состоит из букв, цифр или подчёркивания, разделённых точкой. В конце — буквы, цифры или знак подчёркивания.

>[!info] При проверке `example.email@mail.com` будет соответствовать этому шаблону, а `example.emailmail.com` — нет.

3. Регулярное выражение для проверки имени человека

Предположим, мы хотим проверить, что введённое имя содержит только буквы и начинается с заглавной буквы. Для этого можно составить такое выражение: `/^[А-Я][а-яё]*$/`. Здесь `[А-Я]` соответствует любой заглавной букве, а `[а-яё]` — любой букве в нижнем регистре. Звёздочка указывает, что предыдущий символ может повторяться нуль или более раз.

>[!info] При проверке имя `Иван` будет соответствовать шаблону, а `иван` — нет.
