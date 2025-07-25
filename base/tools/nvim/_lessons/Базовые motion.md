
### Режимы

>[!danger] NVim не воспринимает русскую раскладку во время работы с коммандами! Нужно перключаться на английскую.

Сама работа в симе поделена на несколько режимов, которые определяют доступный пул действий, которые мы можем выполнять в редакторе.

В Vim существует 5 режимов:
- *normal* - просмотр кода. Это основной режим для навигации, который является стандартным и используется для перемещения по файлу.
- *insert* - вставка. Позволяет вводить текст.
	- `i` - войдёт в режим вставки перед текущей позицией курсора.
	- `I` - войдёт в режим вставки в начале строки.
	- `a` - войдёт в режим вставки после текущей позиции курсора.
	- `A` - войдёт в режим вставки в конце строки.
	- `o` - создаст новую строку ниже текущей и войдите в режим вставки.
	- `O` - создаст новую строку выше текущей и войдёт в режим вставки.
	- `r` - заменит текущий символ (без перехода в режим вставки).
	- `R` - войдёт в режим замены, где можно будет заменять символы непосредственно.
- *visual* - выделение кода
	- `v` - войдёт в режим визуального выделения для выделения текста.
	- `V` - войдёт в режим визуального выделения для выделения строк.
	- `Ctrl + v` - войдёт в режим блочного выделения для выделения прямоугольных областей текста.
- *replace* - ввод с перезаписью существующего текста.
- *command* - позволяет работать с коммандами vim
	- `:` - вызывает режим команд

![](_png/c3af97912940c2dc530bba17a285d9dc.png)

### Базовые перемещения

`ctrl + o` - отменит любое движение и действие, которое было выполнено.

#### Базовые движения

Для базовых перемещений по коду:
- `j/k` - вверх-вниз
- `h/l` - влево-вправо

#### Горизонтальные перемещения:

- `0` - перемещает в начало строки
- `$` - перемещает в конец строки
- `w/b` - переход вперёд/назад по словам с учётом пробелов
- `W/B` - переход по словам без учёта пробелов (помогает, если перемещаемся по большому количеству спецсимволов `<title>Слова внутри тега</title>`)
- `e` - переходит в конец текщего слова
- `E` - игнорирует символы, кроме пробела, перемещаясь к концу слова.

#### Вертикальные перемещения:

- `число + G` - перемещение на определённую строку (перейдёт на выбранную по числу строку)
- `число + jk` - перемещение вверх/вниз на определённое число строк
- `gg` - перемещение в начало файла
- `G` - перемещение в конец файла

### Как практиковаться

Даже если пока не получается сидеть в виме, можно установить плагин для работы с Vim Motions в любом редакторе

![](_png/9cdaa957d48271c88d7d49ee11b17956.png)

### Комбинации движений

Комбинации - это последовательность действий. которые мы можем выполнить за счёт объединения сочетаний в виме

Operator - это действие, которое нужно выполнить над текстом
Count - это количество Motion (так же есть альтернатива в виде указания места)
Motion - это действие передвижения, в рамках которой будет выполнен оператор

![](_png/2c74151b9d7481eb18dd72419ccbb743.png)

`d3w` удалит 3 слова (aka *delete 3 words*)

![](_png/df25b507ae2b0c2f6af3bf11748731e5.png)

`d3j` удалит уже 3 строки вниз

![](_png/24a65bd6dc2c439180d7ed648d075268.png)

`di(` - удалит текст внутри скобок

![](_png/68d6af456df8ace7b31d87eace251f00.png)

Все те движения, что мы совершаем в виме - мы можем откатить. Если нам нужно будет откатиться на прошлое движение, то мы можем воспользоваться `ctrl + o`. Может это быть полезно, например, если мы зашли внутрь типа и нам нужно быстро вернуться обратно либо в случае, когда мы перешли не в ту часть файла. 

### Продвинутое перемещние

`$` - переход в начало строки
`0` - переход в начало строки
`gg` - переход в начало файла
`G` - переход в конец файла

`:set nu` вызовет номера строк

![](_png/995aacf59c51f47ae1839359378a03ba.png)

`:set relativenumber` вызовет относительные номера строк, которые позволят нам не считать количество строк, на которое мы можем переместиться, например, той же командой `5j`

![](_png/1c6345e5710317571802ee9c435a5ce9.png)

`f` ищет определённую букву в строке вперёд, а `shift+f` ищёт назад

`f` + `o` - найдёт первую найденную букву `o` в строке
`2fo` - перейдёт сразу ко второй названной `o` в строке

![](_png/15cf27ecbacfc7c95a65fd3196452611.png)

Если нужно продолжать передвигаться дальше по найденной букве, то мы нажимаем `;`

![](_png/9265fdd14432504666790112c4bc5dcd.png)

### Перемещение по блокам

`{` / `}` - позволяют перемещаться между разрывами строк

![](_png/6ac42d47444c90e7f5abfc9e041961cf.png)

`%` - позволяет нам передвигаться между открывающей и закрывающей скобками (любыми)

![](_png/7fa15ca94c0438f6bad17477107b125f.png)

![](_png/8cc92ac09ccb25ccbb38d65b924d84db.png)

![](_png/9bfd7b02ca2bcd572b5fef8db3b6196f.png)

`[` / `]` + определённый тип скобки - позволит переместиться к ближайшей скобке

`[}` переместит изнутри блока к ближайшей фигурной скобке. А уже комбинация `]}` сделает то же самое, но к закрывающей скобке. Так же это работает и с любыми другими скобками.

![](_png/3b553bd8e58e8185e9337970197196d6.png)

`ctrl + d` / `ctrl + u` - перемещение на страницу вниз/вверх

`_` - позволит нам перейти к первому символу строки. В отличе от `0`, который переносит нас в целом в начало строки (даже включая табы).

![](_png/3f635f03b3871d503c6bf2d9eb627f07.png)

`-` / `+` уже будут переводить к началу/концу следующей строки

![](_png/ef73e5d272e8b3c21e7c16ea27a35afc.png)

### Файлы и buffers

Как уже и упоминалось ранее, vim работает с буфферами - он загружает файл в ОЗУ и редактирует его в нём.

Открыть файл мы можем через команду `:edit <file>`

Открыть директорию с файлами мы можем через `:edit .`. Тут у нас появится напрямую файловый менеджер из вима. Все команды указаны сверху и, например, `R` позволит переименовать файл.

![](_png/a439449f875c7ae2d4d0c7eb9b98e095.png)

Команда `:buffers` позволит выписать список буфферов. В первом столбце идёт идентификатор буффера. Для перехода в определённый буффер, мы можем воспользоваться `:buffer <id_буфера>` для перехода в нужный 

`:bnext` / `:bprevious` позволят переместиться к следующему/предыдущему буферу

![](_png/d1c7129afb56d3b1fb1cf2b1433d6a01.png)

`:buffer {` позволяет перейти в доку и узнать, что делает определённое сочетание на случай того, если мы забыли, что делает определённая команда 

![](_png/5701fa0d3dd0b650a97d1abab3b7959f.png)