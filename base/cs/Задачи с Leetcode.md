


## Easy

### Правильная последовательность скобок

>[!info] Условие задачи:
> 
> На вход нам поступает строка со скобочками, расставленными в разном порядке: `[]`, `()`, `{}`. Нам нужно определить валидность строк со скобочками: у каждой скобочки должна быть своя по типу закрывающаяся скобочка.
> 
> Валидные примеры: `()[]{}`, `[()]`
> Невалидные примеры: `[)`, `([)]`

>[!success] Логика решения:
>На вход мы получили такую строку: `[({})]`. Мы не можем просто посчитать количество скобочек и проверить их тип, так как нам важна последовательность. Для более правильного решения данной задачи, нам нужно будет найти сначала одну из пар скобочек (тут это `{}`) и вырезать её. Дальше нам нужно довырезать все оставшиеся скобочки. Если строка в конце останется пустой, то строка оказалась валидной.

Самый простой способ решения - это использование подхода FILO, когда мы складываем первые непохожие друг на друга скобочки в стек и далее берём самые верхние данные из стека и сопоставляем их с оставшимися символами из строки

![](_png/999a28cf23849a64bfc999c43263e931.png)

```JS
const s1 = '()';
const s2 = '()[][()]';
const s3 = '([)]';

function isValid(s) {
	// это массив с нашим стеком (FIFO)
	const stack = [];
	// это маппинг от закрывающейся скобочки к отрывающейся
	const brackets = {
		')': '(',
		'}': '{',
		']': '[',
	};

	// итерируемся по строке
	for (let i = 0; i < s.length; i++) {
		// текущая скобочка
		const current = s[i];

		// если скобочка закрывающаяся
		if (isClosedBracket(current)) {
			// еслки открывающаяся скобочка, которая относится к вбранной закрывающейся, не равна значению из стека (например, если идёт (]), то вернём невалидность
			if (brackets[current] !== stack.pop()) return false;
		} else {
			stack.push(current);
		}
	}

	// если длина стека = 0, то только тогда мы можем вернуть валидность строки
	return stack.length === 0;
}

// эта функция будет возвращать true, если скобочка будет входить в массив скобок
function isClosedBracket(character) {
	return [')', '}', ']'].indexOf(character) > -1;
}

console.log(isValid(s1));
console.log(isValid(s2));
console.log(isValid(s3));
```

Сложность алгоритма линейна `O(n)`, так как перебор элементов идёт через цикл

![](_png/97812ee94851815a4d63b8173574f8a6.png)



## Medium 

### Лучшее время для продажи и покупки акций

>[!info] Условие задачи:
> 
> К нам на вход поступает массив цен на акции. Нам нужно определить, в какие дни нам нужно покупать акции, а в какие дни продавать акции, чтобы получить максимальную выгоду.
> 
> Из примера по графику мы сначала покупаем акции за минимальную цену (1 и 3 доллара) и продаём (5 и 6 долларов). 
> 
> Сумма должна считаться по конечной прибыли (продажа - покупка): 5-1 и 6-3

> если график будет постоянно падать, то возврат должен быть 0

![](_png/13070dff33fb77cecde541885a3e8f62.png)

```JS
const price1 = [7, 1, 5, 3, 6, 4];
const price2 = [1, 2, 3, 4, 5];

function maxProfit(prices) {
    // текущая выручка
	let result = 0;

    // итерируем массив с ценами за весь приод
	for (let i = 0; i < prices.length; i++) {
        // если текущая цена больше цены предыдущего дня 
		if (prices[i] > prices[i - 1]) {
            // то добавляем разницу себе в прибыль
            result += prices[i] - prices[i - 1];
		}
	}

	return result;
}

console.log(maxProfit(prices1));
console.log(maxProfit(prices2));
```

Сложность алгоритма `O(n)`, так как в функции находится всего лишь один цикл

![|400](_png/c59b7d397818084f8a149f907744371e.png)

### Объединение интервалов

>[!info] Условие задачи:
> 
> Мы должны соединить пересекающиеся интервалы, чтобы на выходе мы имели один интервал. 
> В функцию попадает массив интервалов `[[1,3],[2,6],[8,10],[15,18]]`, где интервалы `[1,3],[2,6]` пересекаются (остальные друг друга не касаются). На выходе мы должны получить массив интервалов `[[1,6],[8,10],[15,18]]`, в котором все пересекающиеся интервалы будут объединены.

```JS
const data1 = [
	[1, 3],
	[2, 6],
	[8, 10],
	[15, 18],
];

const data2 = [
	[1, 4],
	[4, 5],
];

function merge(intervals) {
	// если пришёл один интервал, то вернём неизменный массив интервалов
	if (intervals.length < 2) return intervals;

	// сортируем интервалы от меньшего к большему по начальному значению [[8,3],[1,3]] => [[1,3], [8,3]]
	intervals.sort((a, b) => a[0] - b[0]);

	// сразу присваиваем первый интервал
	let result = [intervals[0]];

	// проходимся по массиву интервалов
	for (let interval of intervals) {
		// берём самый последний интервал из результирующего массива
		let recent = result[result.length - 1];

		// если конец текущего интервала закончился позже или тогда же, когда и начало итерируемого интервала, то...
		if (recent[1] >= interval[0]) {
            // нам нужно будет в последний элемент результирующего массива перезаписать окончание интервала через выборку максимального значения
			recent[1] = Math.max(recent[1], interval[1]);
		} else {
			// если не так, то пушим текущий интервал в результирующий массив
			result.push(interval);
		}
	}

	return result;
}

console.log(merge(data1));
console.log(merge(data2));
```

Сложность алгоритма составляет `O(n*logn)`. Результат:

![](_png/4108843832a793a0486fe6a8f48e8c3f.png)

## Hard

### Сбор дождевой воды

>[!info] Условие задачи:
> 
> На вход подаётся массив с числами, которые отображают наши возвышенности (карта высот). Если высота может быть разная, то ширина блока всегда = 1.
> 
> Нужно ответить на вопрос: сколько воды наберётся на данных возвышенностях, если пройдёт дождь

>[!success] Логика решения:
> Нам нужно посчитать, какие будут самые низкие границы справа и слева между колонками, чтобы посчитать количество воды, которое может набраться

Первым делом, стоит определить высоту, которой равняются юниты рельефа, которые удерживают воду

![](_png/9b9001070f1fd65117dbd71ed306b302.png)

В этом случае нам нужно:
- посчитать максимальную высоту блоков слева для каждого отдельного барьера
- посчитать максимальную высоту барьеров для каждого блока, но справа
- найти минимальное значение из двух высот
- посчитать объём через вычитание высоты текущего барьера и минимальной выбранной высоты

![](_png/b7dab63ae8280641161154cf95f07a49.png)

Так же можно решить данную задачу используя линейную сложность по памяти `O(1)`

Тут нам нужно будет воспользоваться алгоритмом *два указателя*, где нам нужно будет:
- поставить два маркера
- если левый маркер будет больше правого, то правый маркер передвигаем правый маркер левее
- если наоборот, то двигаем левый маркер правее

![](_png/a6375ac0e1c1e9983aa9167bb1e97658.png)
![](_png/3c0704ffe9ff21a30f15232829b883b1.png)

```JS
const height1 = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
const height2 = [4, 2, 0, 3, 2, 5];

function trap(height) {
	// максимальная высота блока слева
	let maxLeft = height[0];
	// максимальная высота блока справа
	let maxRight = height[height.length - 1];

	// тут располагаются сами указатели
	// с ними мы отступаем на один шаг от краёв, так как на них никогда не будет воды
	let left = 1;
	let right = height.length - 2;

	// всего юнитов воды, которые влезут на поверхность
	let total = 0;

	while (left <= right) {
		if (maxLeft <= maxRight) {
			// если максимальная высота блока при вычете текущей высоты блока даёт больше нуля
			if (maxLeft - height[left] > 0) {
				// то плюсуем получившиеся юниты воды (через вычет максимальной высоты слева из текущей высоты)
				total += maxLeft - height[left];
			}

			// в максимальную высоту блока передаём новый максимум
			maxLeft = Math.max(maxLeft, height[left]);

			// если левый указатель меньше, чем правый, то передвигаем левый указатель дальше
			left += 1;
		} else {
			maxRight = Math.max(maxRight, height[right]);

			// так же можно избавиться от проверки, так как у нас идёт установка максимальной высоты до присвоения нового значения воды (т.е. сюда может попасть 0)
			total += maxRight - height[right];

			// если правый указатель меньше, чем левый, то передвигаем правый указатель левее
			right -= 1;
		}
	}

	return total;
}

console.log(trap(height1));
console.log(trap(height2));
```

![|400](_png/2a8de53f9756e94af6bffd54b6e3b795.png)

