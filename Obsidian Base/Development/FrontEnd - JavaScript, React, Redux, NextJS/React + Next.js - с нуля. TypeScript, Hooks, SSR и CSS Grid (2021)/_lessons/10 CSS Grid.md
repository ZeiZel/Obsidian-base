#CSS #CSSGrid 

## 001 Обзор модуля

>[!info] Плюсы `CSS Grid`:
> - Легко адаптировать сайты, написанные на гридах
> - Макеты верстаются куда быстрее, чем на `flexbox` (особенно быстрее, чем на `float` или таблицах)
> - Элементы можно гибко располагать на странице (в отличие от того же определённого потока, что мы задали в `flexbox`)

## 002 Template и gap

Код `HTML` ячеек:

```HTML
<body>
	<div class="container">
		<div class="c1">1</div>
		<div class="c2">2</div>
		<div class="c3">3</div>
		<div class="c4">4</div>
		<div class="c5">5</div>
		<div class="c6">6</div>
		<div class="c7">7</div>
		<div class="c8">8</div>
		<div class="c9">9</div>
	</div>
</body>
```

Стандартные свойства для страницы:

```CSS
body {
	background: linear-gradient(107.32deg, #804bd8 5.53%, #544ad8 97.3%);
}

.container {
}

.container > div {
	font-weight: bold;
	font-size: 20px;
	color: white;
	border: 2px solid #fe7a71;
	display: flex;
	align-items: center;
	justify-content: center;
}
```

Так выглядит страница без гридов:

![](_png/Pasted%20image%2020230118103706.png)

Первым делом, мы должны установить дисплей в значение `grid`. 
Свойство `grid-template-columns` позволит нам установить ширину наших колонок на странице. 

```CSS
.container {
	display: grid;
	grid-template-columns: 100px 100px;
}
```

Так же можно нажать на кнопку в девтулзе, который отобразит, как выглядит и работает грид на странице

![](_png/Pasted%20image%2020230118103743.png)

Так же в системе `grid` присутствует единица измерения `fr` (фракции), которые равномерно заполняют всё доступное пространство и делят его с остальными столбцами

```CSS
.container {
	display: grid;
	grid-template-columns: 1fr 1fr;
}
```

![](_png/Pasted%20image%2020230118103818.png)

Так же мы можем использовать проценты для описания размера ячеек, но проще сделать это было бы фракциями

```CSS
.container {
	display: grid;
	grid-template-columns: 33% 33% 33%;
}
```

![](_png/Pasted%20image%2020230118115338.png)

Так же можно указать автозаполнение всего оставшегося пространства для колонок 

```CSS
.container {
	display: grid;
	grid-template-columns: 10% auto 10%;
}
```

![](_png/Pasted%20image%2020230118115434.png)

Так же существует функция `repeat()`, которая повторит нам определённое количество раз определённое значение

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(10, 1fr);
}
```

![](_png/Pasted%20image%2020230118115557.png)

Так же свойство `grid-auto-rows` позволит нам указать определённые размеры для строк

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	grid-template-rows: 200px 200px;
}
```

![](_png/Pasted%20image%2020230118115749.png)

Но как можно увидеть, если не описать свойства для всех колонок, которые в будущем могут появиться, то они будут иметь дефолтный размер (под размер контента)

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-template-rows: 200px 200px; /* широкими остаются только первые две колонки */
}
```

![](_png/Pasted%20image%2020230118115859.png)

Свойство `grid-auto-rows` позволяет назначить для всех незатронутых другими свойствами строк своё значение размеров
Мы изменили размер первых двух строк на 120 пикселей, а все остальные уже будут по 50 пикселей

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-template-rows: 120px 120px;
	grid-auto-rows: 50px;
}
```

![](_png/Pasted%20image%2020230118120201.png)

Так же в гридах присутствует значение `auto-fill`, которое будет автоматически заполнять всё пустое пространство - конкретно тут будут создаваться колонки под ширину экрана сайта.
Функция `minmax()` уже принадлежит `CSS` и она позволит нам создавать колонки шириной от 100 пикселей до одной фракции.
Все вышеописанные свойтва позволят нам переносить избыток ячеек на следующие строки и подстраивать количество колонок под размер экрана

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}
```

![](_png/Pasted%20image%2020230118120755.png)

![](_png/Pasted%20image%2020230118120759.png)

![](_png/Pasted%20image%2020230118120801.png)

`auto-fit`, в свою очередь, уже будет подстраивать под размер экрана уже имеющиеся ячейки и растягивать их 

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

![](_png/Pasted%20image%2020230118120952.png)

Свойство `gap` позволяет создать отступы между ячейками

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	gap: 10px;
}
```

![](_png/Pasted%20image%2020230118121509.png)

Так же можно указать отступы для определённых осей

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	gap: 10px 100px;
}
```

![](_png/Pasted%20image%2020230118121602.png)

И так же существуют отдельные свойства для указания отступов для разных осей

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	row-gap: 10px;
	column-gap: 100px;
}
```
![](_png/Pasted%20image%2020230118121710.png)

Так же есть и старые свойства данной технологии, которые не нужно использовать - некст за нас пишет адаптивные стили под старые браузеры и вставит это значение, если потребуется

![](_png/Pasted%20image%2020230118121847.png)

## 003 Justify и align



![](_png/Pasted%20image%2020230118124600.png)

Свойство `justify-items` определяет расположение элементов по оси `X`
`stretch` - свойство по умолчанию

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;

	justify-items: stretch;
}
```
![](_png/Pasted%20image%2020230118135716.png)

Так же мы можем задать любую другую сторону через `left/right` или `flex`
Небольшое дополнение: *значения left и flex-start имеют немного разное значение. Если нам нужно будет сделать мультиязычный сайт (например, на английском и арабском), то старт для арабов будет справа (справа-налево), а для англо-саксов слева (чтение слева-направо)* 

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;

	justify-items: left; /* или flex-start */
}
```

![](_png/Pasted%20image%2020230118135209.png)

`center` отцентрирует объекты

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;

	justify-items: center;
}
```
![](_png/Pasted%20image%2020230118135638.png)

Дальше идёт свойство `align-items`, которое меняет положение объекта по оси `Y`

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;
	justify-items: stretch;

	align-items: flex-end;
}
```

`flex-end`
![](_png/Pasted%20image%2020230118140020.png)

`center`
![](_png/Pasted%20image%2020230118140107.png)

`flex-start` - прибьёт элементы кверху ячеек
![](_png/Pasted%20image%2020230118140209.png)

`stretch` - столбцы растянуты
![](_png/Pasted%20image%2020230118140215.png)

Свойство `align-content` уже двигает не просто сами элементы внутри ячеек сетки, а деформирует саму сетку

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;

	align-content: flex-end;
}
```

`flex-start`
![](_png/Pasted%20image%2020230118140544.png)

`flex-end`
![](_png/Pasted%20image%2020230118140547.png)

`center`
![](_png/Pasted%20image%2020230118140550.png)

`space-around` - создаёт равномерные отступы между всеми элементами, включая отступы от начала таблицы
![](_png/Pasted%20image%2020230118140816.png)

`space-between` - создаёт отступы только между элементами сетки без отступов от таблицы
![](_png/Pasted%20image%2020230118140819.png)

`space-evenly` - создаёт равномерные отступы в пространстве
![](_png/Pasted%20image%2020230118141021.png)

`justify-content` работает ровно так же как и прошлое, но по горизонтали

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;

	justify-content: center;
}
```

Дальше уже идут свойства, которые позволят расположить элементы отдельно конкретно под себя:
- `align-self` - выравнит элемент по вертикали
- `justify-self` - выравнит по горизонтали

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;
}

.c1 {
	justify-self: end;
	align-self: start;
}
```
![](_png/Pasted%20image%2020230118141703.png)

## 004 Распределение ячеек

Начальный сетап:

```CSS
.container {
	display: grid;
	gap: 10px;
	grid-template-columns: repeat(3, 1fr);
	grid-auto-rows: 100px;
}

.container > div {
	font-weight: bold;
	font-size: 20px;
	color: white;
	border: 2px solid #fe7a71;
	display: flex;
	align-items: center;
	justify-content: center;
}
```

![](_png/Pasted%20image%2020230118153805.png)

При отображении грид-сетки в девтулзе можно увидеть ярлыки сетки - они показывают индекс определённого направления (1, 2, 3, 4 колонка и так далее так же для строк). С другого конца идёт такой же отсчёт но в минусовых значениях.

![](_png/Pasted%20image%2020230118165307.png)

Свойства `grid-column-start` и `grid-column-end` позволят указать откуда и докуда можно будет растянуть нашу ячейку. Так же можно указать короткой записью через свойство `grid-column`

Конкретно сейчас мы растянули нужный нам блок и расположили его в нужной для нас плоскости экрана на три колонки (с 1 по 4 линию).

```CSS
.c1 {
	grid-column-start: 1;
	grid-column-end: -1;
}
```

или...

```CSS
.c1 {
	grid-column: 1 / -1;
}
```

![](_png/Pasted%20image%2020230118165310.png)

Сразу нужно сказать, что если указать с первой по пятую линию (то есть по линию, которой не существует, то появится определённая коллизия и ячейки могут деформироваться, что приведёт к неприятному эффекту)

![](_png/Pasted%20image%2020230118171342.png)

Так же куда удобнее будет для определения ширины ячейки использовать не линии, а сами ячейки. 
`span` говорит, что мы сейчас указываем ячейки, а не линии, которые нам нужны.

Приведённым кодом ниже мы говорим, что ячейка `c1` должна занимать с первой по третью ячейку 

```CSS
c1 {
	grid-column: 1 / span 3;
}
```
![](_png/Pasted%20image%2020230118171612.png)

Так же мы можем проименовать линии через `[имя]`, а не использовать цифры. 
Такой подход более уместен, если мы строим сложную сетку, которую будем дальше использовать в продакшене.

Те же самые манипуляции можно выполнять и с `row`-свойствами грида

```CSS
.container {
	display: grid;
	gap: 10px;
	grid-template-columns: [startline] 1fr [middle] 1fr 1fr [endline];
	grid-auto-rows: 100px;
}

.c1 {
	grid-column-start: middle;
	grid-column-end: endline;
}
```

![](_png/Pasted%20image%2020230118172606.png)

Чтобы увидеть имена нужных мест сетки, нужно их отобразить в лейауте внутри девтулз

![](_png/Pasted%20image%2020230118172459.png)

Свойство `grid-auto-flow` определяет в каком порядке и в каком виде будут располагаться ячейки внутри сетки

```CSS
.container {
	display: grid;
	gap: 10px;
	grid-template-columns: [startline] 1fr [middle] 1fr 1fr [endline];
	grid-auto-rows: 100px;

	grid-auto-flow: row;
}
```

`row` - стандартное расположение ячеек
![](_png/Pasted%20image%2020230118173103.png)

`column` - расположение только в колонку
![](_png/Pasted%20image%2020230118173201.png)

`dense` - вмещает ячейки как может в свободное пространство
![](_png/Pasted%20image%2020230118173529.png)

## 005 Template-area

Начальный тесплейт:

```CSS
.container {
	display: grid;
	padding: 10px;
	
	gap: 10px;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr;
}
```

![](_png/Pasted%20image%2020230121115328.png)

Свойство `grid-area` позволяет указать на какой линии начинать и на какой заканчивать:
*начало по вертикали / начало по горизонтали / конец по вертикали / конец по горизонтали*

```CSS
.container {
	display: grid;

	padding: 10px;

	gap: 10px;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr;
}

.header {
	grid-area: 1 / 1 / 3 / 4;
}
```

![](_png/Pasted%20image%2020230121115304.png)





```CSS
.container {
	display: grid;
	padding: 10px;

	gap: 10px;
	grid-template-columns: 1fr 1fr 1fr;

	grid-template-areas:
		'header header header'
		'sidebar body body'
		'footer footer footer';
}

.header {
	grid-area: header;
}

.sidebar {
	grid-area: sidebar;
}

.body {
	grid-area: body;
}

.footer {
	grid-area: footer;
}
```

![](_png/Pasted%20image%2020230121122146.png)





```CSS
@media (max-width: 720px) {
	.container {
		display: grid;
		padding: 10px;

		gap: 10px;
		grid-template-columns: 1fr 1fr 1fr;

		grid-template-areas:
			'header header header'
			'body body body'
			'sidebar sidebar sidebar'
			'footer footer footer';
	}
}
```

![](_png/Pasted%20image%2020230121122458.png)

Либо мы можем сделать вообще одноколоночную сетку и получить тот же результат, что представлен выше

```CSS
@media (max-width: 720px) {
	.container {
		display: grid;
		padding: 10px;

		gap: 10px;
		grid-template-columns: 1fr;

		grid-template-areas:
			'header'
			'body'
			'sidebar'
			'footer';
	}
}
```




```CSS
.container {
	display: grid;
	padding: 10px;

	gap: 10px;
	grid-template-columns: 1fr 1fr 1fr;

	grid-template-areas:
		'header header header'
		'sidebar body body'
		'. footer footer';
}
```
![](_png/Pasted%20image%2020230121122744.png)

Чтобы упростить и ускорить запись, можно воспользоваться записью `grid-template`, которая принимает в себя: 
*шаблон строки* **размер в px** / *распределение колонок*    

```CSS
.container {
	display: grid;
	padding: 10px;

	gap: 10px;
	grid-template:
		'header header header' 100px
		'sidebar body body' 150px
		'. footer footer' 200px
		/ 1fr 1fr 1fr;
}
```

![](_png/Pasted%20image%2020230121123015.png)

## 006 Лучшие практики










## 007 Вёрстка layout










## 008 Упражнение - Вёрстка footer












