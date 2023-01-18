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












## 003 Justify и align










## 004 Распределение ячеек










## 005 Template-area










## 006 Лучшие практики










## 007 Вёрстка layout










## 008 Упражнение - Вёрстка footer












