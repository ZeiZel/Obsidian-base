#RxJS #Реактивность

## RxJs Теория: Observable, Observer, Subscription, Pipe

==Observable== - конструктор источника событий
==Observer== - слушатель событий, создает источник событий путем подписки

Такой подход подразумевает под собой создание конструктора событий ==Observable==, на который подписываются слушатели событий. В свою очередь, сами слушатели событий 

==Promise== уже сам является источником события. Он вызван и может выдать либо ошибку, либо успешный результат. Так же на него можно подписаться с помощью `then`, если будет успех или `reject`, если вылезет ошибка

![](_png/Pasted%20image%2020230609163552.png)

У нас в приложении есть три Observable, которые вызываются, когда срабатывает Observer. Так же Observable могут вызывать друг друга через `pipe`, чтобы вызваться друг за другом

![](_png/Pasted%20image%2020230609163607.png)

Мы вызываем события у обзёрвера ровно до тех пор, пока он не закончит выполнение операции ошибкой или выполнением запроса. Дальше уже события не будут доходить до обзёрвера.

`Observer.next` - метод для получения следующего события
`Observer.error` - метод обработки ошибки источника событий
`Observer.complete` - метод для выполнения действий на закрытии источника событий

![](_png/Pasted%20image%2020230609163619.png)

Pipe - процесс расширения конструктора источника события
Pipe получает операторы - чистые функции

В качестве пайпа, мы можем задать тот же фильтр, который будет отсеивать невалидные запросы на сервер

![](_png/Pasted%20image%2020230609163629.png)

## 1. Как работает RxJS

Основной идеей работы RxJS является подписка на определённые события и реагирование на них. 

Конкретно в примере мы создаём подписку, которая триггерит подписанные на неё функции раз в секунду. 

Через `subscribe` мы подписываемся на эмиттер события и выполняем код раз в определённое время.

```TS
import { Component } from '@angular/core';
import { interval } from 'rxjs';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	constructor() {
		const intervalStream$ = interval(1000);

		intervalStream$.subscribe((value) => {
			console.log(value);
		});
	}
}
```

![](_png/Pasted%20image%2020230626152619.png)

## 2. Оптимизация стримов

Если мы никак не будем контролировать и отключать стримы, то у нас они будут постоянно активны и постоянно копиться. Прошлый пример будет работать постоянно, пока страница активна. 

Чтобы исправить данную проблему, мы можем сохранить объект стрима в поле с типом `Subscription`, чтобы иметь возможность отписаться от стрима через `unsubscribe()` 

```TS
import { Component } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	sub: Subscription;

	constructor() {
		const intervalStream$ = interval(1000);

		this.sub = intervalStream$.subscribe((value) => {
			console.log(value);
		});
	}

	stop() {
		this.sub.unsubscribe();
	}
}
```

Кнопка будет вызывать срабатывание метода остановки интервала

```HTML
<div class='container'>
	<h1>RxJS</h1>
	<button class='btn' (click)='stop()'>Stop Interval</button>
</div>
```

И теперь кнопка останавливает интервал

![](_png/Pasted%20image%2020230626155734.png)

## 3. Как использовать операторы

В RxJS присутствует огромное множество операторов, которые могут разными способами обрабатывать данные и сам стрим

Чейн `pipe()` принимает в себя операторы, которые и будут работать над нашими данными

Конкретно в данном примере в пайп попадает два оператора, из которых:
- `filter` - фильтрует проходящие дальше данные
- `map` - видоизменяет данные

```TS
import { Component } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	sub: Subscription;

	constructor() {
		const intervalStream$ = interval(1000);

		this.sub = intervalStream$
			.pipe(
				filter((value) => value % 2 === 0),
				map((value) => `Mapped ${value}`),
			)
			.subscribe((value) => {
				console.log(value);
			});
	}

	stop() {
		this.sub.unsubscribe();
	}
}
```

И теперь у нас выходят в консоль только чётные замапленные данные

![](_png/Pasted%20image%2020230626162626.png)

## 4. Создание своего стрима










## 5. Как работает Subject















