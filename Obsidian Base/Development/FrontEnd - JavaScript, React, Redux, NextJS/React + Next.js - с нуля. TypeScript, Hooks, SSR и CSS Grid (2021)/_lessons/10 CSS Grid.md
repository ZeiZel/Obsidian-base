#CSS #CSSGrid 

## 001 Обзор модуля

>[!info] Плюсы `CSS Grid`:
> - Легко адаптировать сайты, написанные на гридах
> - Макеты верстаются куда быстрее, чем на `flexbox` (особенно быстрее, чем на `float` или таблицах)
> - Элементы можно гибко располагать на странице (в отличие от того же определённого потока, что мы задали в `flexbox`)

## 002 Template и gap




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



![](_png/Pasted%20image%2020230118103706.png)



```CSS
.container {
	display: grid;
	grid-template-columns: 100px 100px;
}
```



![](_png/Pasted%20image%2020230118103743.png)




```CSS
.container {
	display: grid;
	grid-template-columns: 1fr 1fr;
}
```

![](_png/Pasted%20image%2020230118103818.png)





```CSS
.container {
	display: grid;
	grid-template-columns: 33% 33% 33%;
}
```

![](_png/Pasted%20image%2020230118115338.png)





```CSS
.container {
	display: grid;
	grid-template-columns: 10% auto 10%;
}
```

![](_png/Pasted%20image%2020230118115434.png)




```CSS
.container {
	display: grid;
	grid-template-columns: repeat(10, 1fr);
}
```

![](_png/Pasted%20image%2020230118115557.png)




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



```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}
```

![](_png/Pasted%20image%2020230118120755.png)

![](_png/Pasted%20image%2020230118120759.png)

![](_png/Pasted%20image%2020230118120801.png)



```CSS
.container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

![](_png/Pasted%20image%2020230118120952.png)












## 003 Justify и align










## 004 Распределение ячеек










## 005 Template-area










## 006 Лучшие практики










## 007 Вёрстка layout










## 008 Упражнение - Вёрстка footer












