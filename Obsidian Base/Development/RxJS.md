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


## RxJs fromEvent search input. Оптимизируй запросы на сервер в несколько строк с RxJS



`main.ts`
```TS
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import './rxjs.lesson';

platformBrowserDynamic()
	.bootstrapModule(AppModule)
	.catch((err) => console.error(err));
```



`rxjs.lesson.ts`
```JS
import { Observable } from 'rxjs';

// суффикс $ обозначает, что это Observable
const search$ = new Observable((observer) => {
	console.log('Start in observable');

	observer.next(1);
	observer.next(2);
	observer.next(3);

	console.log('End in observable');
});

console.log('Start subscribe');
```

















