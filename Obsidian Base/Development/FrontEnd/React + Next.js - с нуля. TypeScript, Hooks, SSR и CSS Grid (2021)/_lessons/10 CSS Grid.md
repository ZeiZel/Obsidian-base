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

![](_png/623a82fab6806ffa9e00a9e441a1c99f.png)

Первым делом, мы должны установить дисплей в значение `grid`. 
Свойство `grid-template-columns` позволит нам установить ширину наших колонок на странице. 

```CSS
.container {
	display: grid;
	grid-template-columns: 100px 100px;
}
```

Так же можно нажать на кнопку в девтулзе, который отобразит, как выглядит и работает грид на странице

![](_png/181b84be31203f3345fae973b49f7fd7.png)

Так же в системе `grid` присутствует единица измерения `fr` (фракции), которые равномерно заполняют всё доступное пространство и делят его с остальными столбцами

```CSS
.container {
	display: grid;
	grid-template-columns: 1fr 1fr;
}
```

![](_png/9ed4d517e3132467b022e0b856ede0ab.png)

Так же мы можем использовать проценты для описания размера ячеек, но проще сделать это было бы фракциями

```CSS
.container {
	display: grid;
	grid-template-columns: 33% 33% 33%;
}
```

![](_png/b1695ba8e82b43ac2ad08ca11fd82059.png)

Так же можно указать автозаполнение всего оставшегося пространства для колонок 

```CSS
.container {
	display: grid;
	grid-template-columns: 10% auto 10%;
}
```

![](_png/a2490d5c67d8d3485b7a0f3a5a3991d3.png)

Так же существует функция `repeat()`, которая повторит нам определённое количество раз определённое значение

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(10, 1fr);
}
```

![](_png/4d8ef2ea470659f9d3728718b30b99bc.png)

Так же свойство `grid-auto-rows` позволит нам указать определённые размеры для строк

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	grid-template-rows: 200px 200px;
}
```

![](_png/2c5bc266377c6ec7b742aac9d0cefc75.png)

Но как можно увидеть, если не описать свойства для всех колонок, которые в будущем могут появиться, то они будут иметь дефолтный размер (под размер контента)

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-template-rows: 200px 200px; /* широкими остаются только первые две колонки */
}
```

![](_png/5f08f4dd29f9bf464e19154ba4e29d2e.png)

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

![](_png/f163bf0c533e49360fc61b67e3a1d3d8.png)

Так же в гридах присутствует значение `auto-fill`, которое будет автоматически заполнять всё пустое пространство - конкретно тут будут создаваться колонки под ширину экрана сайта.
Функция `minmax()` уже принадлежит `CSS` и она позволит нам создавать колонки шириной от 100 пикселей до одной фракции.
Все вышеописанные свойтва позволят нам переносить избыток ячеек на следующие строки и подстраивать количество колонок под размер экрана

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}
```

![](_png/d487f101567887e19fc2f6eddc2d09e0.png)

![](_png/d99493b4b57a13269becf9046258958b.png)

![](_png/a74bdf8a696a9d9b6c0e6854e75d784c.png)

`auto-fit`, в свою очередь, уже будет подстраивать под размер экрана уже имеющиеся ячейки и растягивать их 

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

![](_png/11759d187f5a12fa8e285edf77916624.png)

Свойство `gap` позволяет создать отступы между ячейками

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	gap: 10px;
}
```

![](_png/1729ee43638e203521b445346560b846.png)

Так же можно указать отступы для определённых осей

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	gap: 10px 100px;
}
```

![](_png/6d2fd307ef4fc121a5080737d007e2ff.png)

И так же существуют отдельные свойства для указания отступов для разных осей

```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	row-gap: 10px;
	column-gap: 100px;
}
```
![](_png/534bdadb21c28da8462621528732d6b2.png)

Так же есть и старые свойства данной технологии, которые не нужно использовать - некст за нас пишет адаптивные стили под старые браузеры и вставит это значение, если потребуется

![](_png/615a5b78b01653b62dce7f44f6451739.png)

## 003 Justify и align



![](_png/90a20412560e9cf6d1056825f1c2a725.png)

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
![](_png/bcb62bd68d064a10a8a732e7ff969736.png)

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

![](_png/8e9b8fd3f317679b8863b93672eb427f.png)

`center` отцентрирует объекты

```CSS
.container {
	display: grid;
	height: 500px;
	border: 2px solid white;

	justify-items: center;
}
```
![](_png/c13162909afb2f754c49a3c91ff61cbd.png)

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
![](_png/7634d476c8f3e46692991ec3628f0552.png)

`center`
![](_png/8fffe31bd627118cbaff366f92a494f3.png)

`flex-start` - прибьёт элементы кверху ячеек
![](_png/5c6d5f5acfd3a6d9d16d854aa3b91d4b.png)

`stretch` - столбцы растянуты
![](_png/efe810a45bdb470bf92ebca7434df78b.png)

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
![](_png/cf68f80dacce67f9cb1cf1a4aa438229.png)

`flex-end`
![](_png/51dec4aa8341341f9a1f53f48c250cb5.png)

`center`
![](_png/eb9cd1d147b5085ed6b69ad083ef716e.png)

`space-around` - создаёт равномерные отступы между всеми элементами, включая отступы от начала таблицы
![](_png/35f7d1b64b993b245c644aa3f79d0b00.png)

`space-between` - создаёт отступы только между элементами сетки без отступов от таблицы
![](_png/7920af53d636e2d7ea18d5e1e3e92b42.png)

`space-evenly` - создаёт равномерные отступы в пространстве
![](_png/2cdbecd52981bc3d3ae1a28bfc387c5e.png)

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
![](_png/1c034a91a11e1d7ebcb10e5fa8afa455.png)

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

![](_png/69ee08f941c94c75e5ca1da5987adf9c.png)

При отображении грид-сетки в девтулзе можно увидеть ярлыки сетки - они показывают индекс определённого направления (1, 2, 3, 4 колонка и так далее так же для строк). С другого конца идёт такой же отсчёт но в минусовых значениях.

![](_png/a2d07e8ce2802d8a00653d334681cad3.png)

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

![](_png/66594bc51f30b73d43c88f1834f384a8.png)

Сразу нужно сказать, что если указать с первой по пятую линию (то есть по линию, которой не существует, то появится определённая коллизия и ячейки могут деформироваться, что приведёт к неприятному эффекту)

![](_png/2573a27434b5e1671c8a9525af69aa9d.png)

Так же куда удобнее будет для определения ширины ячейки использовать не линии, а сами ячейки. 
`span` говорит, что мы сейчас указываем ячейки, а не линии, которые нам нужны.

Приведённым кодом ниже мы говорим, что ячейка `c1` должна занимать с первой по третью ячейку 

```CSS
c1 {
	grid-column: 1 / span 3;
}
```
![](_png/e5b4f8d7eaee1e9a6e707037615f455c.png)

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

![](_png/246d6533b210cb9e8b952e0b7edf1557.png)

Чтобы увидеть имена нужных мест сетки, нужно их отобразить в лейауте внутри девтулз

![](_png/4396072cc5410c2423ae789325e57b99.png)

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
![](_png/246d6533b210cb9e8b952e0b7edf1557.png)

`column` - расположение только в колонку
![](_png/adfd21b7869c6d80384510c9aeb95275.png)

`dense` - вмещает ячейки как может в свободное пространство
![](_png/84c96231ead0952849b5480ee381d958.png)

## 005 Template-area

Начальный теvплейт:

```CSS
.container {
	display: grid;
	padding: 10px;
	
	gap: 10px;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr;
}
```

![](_png/494175e24cf1dba86444c45c582f1f87.png)

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

![](_png/2cd3796074e50d8429df228dcd0db8c2.png)

Так же можно показать расположение объектов на странице с использованием `grid-template-areas`, который хранит в себе названия ячеек и представляет их в виде сетки. Чтобы сетка с этими элементами начала работать, нужно в сам элемент ячейки запихнуть `grid-area` и проименовать его  

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

![](_png/0ab2e2dd69b12cb5f4181a8954c0de0b.png)

Так же мы можем спокойно менять элементы сетки с использованием адаптива

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

![](_png/9af13a10806f0fbf5013fd871926c28c.png)

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

Если использовать `.` в сетке, то можно отобразить пустое пространство в сетке

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
![](_png/77a21c96663511ac96d1144921d8f03d.png)

Чтобы упростить и ускорить запись, можно воспользоваться записью `grid-template`, которая принимает в себя: 
`'footer footer footer'` - запись колонки
`200px` - размер колонки 
`/ 1fr 1fr 1fr` - распределение колонок (через `/`)

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

![](_png/54ec3c5c36e28ccf428f1d9647f7e1c0.png)

## 006 Лучшие практики

1) **Если в макете много колонок, то не обязательно создавать столько же в гриде**
Мы создаём только нужное под макет количество колонок. Дизайнер мог сделать такое количество просто для более удобного для себя позиционирования объектов. 
Однако, если все 20 колонок используются для обычной страницы и того же адаптива, то придётся создать все 20 колонок. 

![](_png/ff4a136be413b96998a91850edb80535.png)

2) **Стоит всегда использовать именованные колонки и пространства**
Это позволит сохранять корректную вёрстку, если мы добавим между колонками ещё колонки или если добавим новые ячейки в нашу сетку - ссылка останется той же, что и была до

![](_png/11773d83c007c8b845619d4de4fbf2d5.png)

3) **Использовать фракции более предпочтительно**
Фракции - это гибка единица, которая описывает часть от пространства, что позволит просто и быстро распределить его на всю сетку

![](_png/0362c3d8806fe4b118899a85a6634e3c.png)

## 007 Вёрстка layout

Первым делом нужно добавить стили в компонент `Layout` и так же вместо фрагмента сейчас использовать `wrapper` для всего контента

`Layout.tsx`
```TSX
const Layout = ({ children }: ILayoutProps) => {
	return (
		<div className={styles.wrapper}>
			<Header className={styles.header} />
			<Sidebar className={styles.sidebar} />
			<div className={styles.body}>{children}</div>
			<Footer className={styles.footer} />
		</div>
	);
};

export const withLayout = <T extends Record<string, unknown>>(Component: FunctionComponent<T>) => {
	return function withLayoutComponent(props: T): JSX.Element {
		return (
			<Layout>
				<Component {...props} />
			</Layout>
		);
	};
};
```

Далее нужно сверстать сетку и адаптив страницы.

Глобально на странице мы имеем 3 строки: 
- `Header` - скрыт на десктопах, занимает ширину равную контентной части
- `Sidebar`/`Body` - сама контентная часть
- `Footer` - должен уметь растягиваться на всю страницу

Даже если для строки задан `display: none`, то она продолжает участвовать в сетке, но просто не отображается

Для создания сетки мы будем использовать 4 колонки: 
- Пустую для растягивания (самая левая)
- `Sidebar`
- `Body`
- Пустую для растягивания (самая правая)
Пустые колонки будут иметь размер `auto`, чтобы они спокойно растягивались под ширину экрана пользователя. В них не будет никакого контента - они предназначены лишь для возможности растягивания страницы

`Layout.module.css`
```CSS
.wrapper {
	display: grid;

	/* Растянет сетку на всю страницу */
	min-height: 100vh;

	/* определит ширину колонок - слева и справа для растягивания сайта */
	grid-template-columns: auto 230px minmax(320px, 1200px) auto;
	/* определит высоту колонок - хедер и футер под размер контента */
	grid-template-rows: auto 1fr auto;
	/* определит шаблон расположения колонок - точки остаются под растягиваемые колонки*/
	grid-template-areas:
		'. header header .'
		'. sidebar body .'
		'footer footer footer footer';
}

.header {
	/* скроем заголовок на десктопах */
	display: none;
	grid-area: header;
}

.body {
	grid-area: body;
}

.sidebar {
	grid-area: sidebar;
}

.footer {
	grid-area: footer;
}

/* Адаптив под мобилки */
@media (max-width: 765px) {
	/* тут нужно перестроить колонки, так как после удаления сайдбара остаётся пустое пространство */
	.wrapper {
		grid-template-columns: minmax(320px, 1fr);
		grid-template-areas:
			'header'
			'body'
			'footer';
	}

	/* Показываем наш хедер */
	.header {
		display: block;
	}

	/* Скрываем сайдбар */
	.sidebar {
		display: none;
	}
}
```

## 008 Упражнение - Вёрстка footer

Установим модуль для форматирования даты

```bash
npm i date-fns
```

Сюда будут добавлены просто три даты. 
Для поддержания даты прав на сайт, будет создаваться всегда новая дата, от которой мы будем брать только год с помощью функции `format()`.
Чтобы при нажатии на ссылку, она открывалась в другом окне, нужно добавить в неё `target='_blank'`

`Footer.tsx`
```TSX
import React from 'react';
import styles from './Footer.module.css';
import cn from 'classnames';
import { IFooterProps } from './Footer.props';
import { format } from 'date-fns';

export const Footer = ({ className, ...props }: IFooterProps) => {
	return (
		<footer className={cn(className, styles.footer)} {...props}>
			<div>OwlTop © 2020 - {format(new Date(), 'yyyy')} Все права защищены</div>
			<a href='#' target='_blank'>
				Пользовательское соглашение
			</a>
			<a href='#' target='_blank'>
				Политика конфиденциальности
			</a>
		</footer>
	);
};
```

Тут мы поделили сетку футера на три колонки, которые в планшетной версии трансформируются в одну. Так же добавлена анимация на наведение мышки.

`Footer.module.css`
```CSS
.footer {
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 10px 40px;

	color: var(--white);
	font-size: 16px;
	line-height: 20px;

	background: var(--primary);
	padding: 25px 30px;
}

.footer a:hover {
	transition: all 0.2s;
	color: var(--gray);
}

@media (max-width: 765px) {
	.footer {
		grid-template-columns: 1fr;
	}
}
```

Версия для десктопа (не имеет хедера, но имеет сайдбар)

![](_png/88b9ddc9f2d555b2cee2252d0ae5605e.png)

Версия для планшетов (имеет хедер, но без сайдбара)

![](_png/7b198b20c6aaffc536e529dfee3af1fc.png)