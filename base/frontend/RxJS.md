---
tags:
  - frontend
  - rxjs
  - angular
  - react
  - vue
---
## RxJS

RxJS (Reactive Extensions for JavaScript) - библиотека для реактивного программирования на основе потоков данных (streams). Вместо того чтобы запрашивать данные императивно, мы описываем, как данные трансформируются по мере поступления.

Реактивная парадигма рассматривает все как поток событий: клики пользователя, HTTP-ответы, таймеры, WebSocket-сообщения, изменения состояния. Каждый поток можно фильтровать, трансформировать, комбинировать с другими потоками и обрабатывать ошибки декларативно.

Когда использовать RxJS, а когда Promise/async-await:

- Promise подходит для одноразовых асинхронных операций - один запрос, один ответ
- async/await удобен для последовательных асинхронных цепочек с простой логикой
- RxJS необходим, когда данные приходят многократно (events, WebSocket), когда нужна отмена операций, когда требуется сложная комбинация нескольких асинхронных источников, или когда нужны операторы вроде debounce, throttle, retry

> [!important]
> RxJS не замена промисам. Это инструмент для другого класса задач. Если у вас простой fetch-запрос без отмены и повторов - Promise или async/await проще и читаемее.

## Основные концепции

**Observable** - источник событий. Ленивый: начинает эмитить значения только при подписке. Может эмитить ноль или более значений и завершиться либо успехом (complete), либо ошибкой (error).

Observer - потребитель событий. Объект с тремя коллбэками: `next` для получения значений, `error` для обработки ошибки, `complete` для обработки завершения потока.

Subscription - связь между Observable и Observer. Возвращается при вызове `subscribe()`. Используется для отписки через `unsubscribe()`, что освобождает ресурсы и предотвращает утечки памяти.

Operators - чистые функции, трансформирующие поток без изменения исходного Observable. Применяются через метод `pipe()`. Каждый оператор возвращает новый Observable.

Subject - особый тип Observable, который одновременно является и Observer. Позволяет отправлять значения множеству подписчиков (multicast).

Scheduler - управляет временем выполнения подписок и эмиссии значений. В большинстве случаев явно указывать Scheduler не нужно, но для тестирования (TestScheduler) и контроля производительности они полезны.

```typescript
import { Observable, Observer, Subscription } from 'rxjs';

// Observable - источник
const source$ = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

// Observer - потребитель
const observer: Observer<number> = {
  next: (value) => console.log('Value:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Done'),
};

// Subscription - связь
const sub: Subscription = source$.subscribe(observer);
sub.unsubscribe();
```

## Создание Observable

Конструктор `new Observable()` дает полный контроль над эмиссией. Функция-фабрика получает subscriber, через который вызываются `next`, `error`, `complete`. Можно вернуть teardown-функцию для очистки ресурсов.

```typescript
import { Observable } from 'rxjs';

const custom$ = new Observable<number>((subscriber) => {
  let count = 0;
  const id = setInterval(() => {
    subscriber.next(count++);
    if (count > 5) {
      subscriber.complete();
    }
  }, 1000);

  // Teardown: вызывается при unsubscribe или complete
  return () => {
    clearInterval(id);
    console.log('Cleaned up');
  };
});
```

Creation operators покрывают большинство сценариев без ручного конструирования:

```typescript
import {
  of, from, fromEvent, interval, timer,
  defer, range, EMPTY, NEVER, throwError
} from 'rxjs';

// of - эмитит переданные значения и завершается
const values$ = of(1, 2, 3);

// from - конвертирует итерируемое, Promise или Observable-like
const fromArray$ = from([10, 20, 30]);
const fromPromise$ = from(fetch('/api/data'));

// fromEvent - события DOM
const clicks$ = fromEvent(document, 'click');
const input$ = fromEvent<InputEvent>(searchInput, 'input');

// interval - эмитит числа с интервалом (мс)
const tick$ = interval(1000); // 0, 1, 2, 3...

// timer - первая эмиссия через delay, далее с интервалом
const delayed$ = timer(2000);          // одно значение через 2с
const periodic$ = timer(1000, 5000);   // через 1с, затем каждые 5с

// defer - создает Observable лениво при подписке
const lazy$ = defer(() => from(fetch('/api/data')));

// range - диапазон чисел
const numbers$ = range(1, 10); // 1..10

// EMPTY - сразу complete, без значений
// NEVER - никогда не эмитит и не завершается
// throwError - сразу error
const error$ = throwError(() => new Error('Something failed'));
```

> [!info]
> `defer` особенно полезен для оборачивания Promise-based API. Без defer промис создается сразу при объявлении, а не при подписке. С defer каждая подписка создает свежий промис.

## Операторы трансформации

Операторы трансформации изменяют значения в потоке. Самый простой - `map`, аналог `Array.prototype.map`.

```typescript
import { of, interval } from 'rxjs';
import {
  map, scan, reduce, switchMap, mergeMap,
  concatMap, exhaustMap, buffer, bufferTime,
  bufferCount, pairwise, groupBy, mergeAll
} from 'rxjs/operators';

// map - преобразует каждое значение
of(1, 2, 3).pipe(
  map(x => x * 10)
); // 10, 20, 30

// scan - аккумулятор (как reduce, но эмитит промежуточные результаты)
of(1, 2, 3, 4).pipe(
  scan((acc, val) => acc + val, 0)
); // 1, 3, 6, 10

// reduce - аккумулятор, эмитит только финальный результат
of(1, 2, 3, 4).pipe(
  reduce((acc, val) => acc + val, 0)
); // 10

// pairwise - эмитит текущее и предыдущее значение парами
of(1, 2, 3, 4).pipe(
  pairwise()
); // [1,2], [2,3], [3,4]

// bufferTime - собирает значения за период времени
interval(100).pipe(
  bufferTime(1000)
); // каждую секунду массив из ~10 значений
```

Higher-order mapping operators - ключевые операторы RxJS. Они маппят каждое входящее значение в новый Observable и управляют подписками на внутренние потоки.

```typescript
import { fromEvent, of } from 'rxjs';
import { switchMap, mergeMap, concatMap, exhaustMap, delay } from 'rxjs/operators';

// switchMap - отписывается от предыдущего внутреннего Observable при новом значении
// Использование: поиск, навигация, когда важен только последний запрос
searchInput$.pipe(
  switchMap(term => apiService.search(term))
);

// mergeMap - подписывается на все внутренние Observable параллельно
// Использование: когда порядок не важен и все запросы нужны (лайки, логи)
clicks$.pipe(
  mergeMap(event => apiService.trackClick(event))
);

// concatMap - подписывается на следующий только после завершения предыдущего
// Использование: когда важен порядок (очередь загрузки файлов)
fileQueue$.pipe(
  concatMap(file => uploadService.upload(file))
);

// exhaustMap - игнорирует новые значения, пока внутренний Observable активен
// Использование: кнопка отправки формы (защита от двойного клика)
submitButton$.pipe(
  exhaustMap(() => apiService.submitForm(formData))
);
```

> [!summary]
> Выбор higher-order mapping оператора:
> - switchMap - нужен только последний результат (поиск, autocomplete)
> - mergeMap - все результаты параллельно (аналитика, независимые запросы)
> - concatMap - все результаты последовательно (очереди, транзакции)
> - exhaustMap - игнорировать пока занят (отправка формы, логин)

## Операторы фильтрации

Операторы фильтрации пропускают или блокируют значения по условию, а также контролируют количество и частоту эмиссий.

```typescript
import { interval, fromEvent, of } from 'rxjs';
import {
  filter, take, takeUntil, takeWhile,
  first, last, skip, skipUntil,
  debounceTime, throttleTime, distinctUntilChanged,
  auditTime, sample
} from 'rxjs/operators';

// filter - пропускает значения, удовлетворяющие предикату
of(1, 2, 3, 4, 5).pipe(
  filter(x => x % 2 === 0)
); // 2, 4

// take - берет первые N значений и завершается
interval(100).pipe(take(5)); // 0, 1, 2, 3, 4

// takeUntil - берет значения, пока не эмитит другой Observable
// Основной паттерн для отписки в Angular
const destroy$ = new Subject<void>();
source$.pipe(
  takeUntil(destroy$)
).subscribe(/* ... */);
// В ngOnDestroy: destroy$.next(); destroy$.complete();

// takeWhile - берет, пока предикат истинен
of(1, 2, 3, 4, 1, 2).pipe(
  takeWhile(x => x < 4)
); // 1, 2, 3

// first - первое значение (опционально с предикатом), потом complete
of(1, 2, 3).pipe(first()); // 1
of(1, 2, 3).pipe(first(x => x > 1)); // 2

// skip - пропускает первые N значений
of(1, 2, 3, 4).pipe(skip(2)); // 3, 4

// distinctUntilChanged - пропускает дубликаты подряд
of(1, 1, 2, 2, 3, 1).pipe(
  distinctUntilChanged()
); // 1, 2, 3, 1

// С функцией сравнения для объектов
users$.pipe(
  distinctUntilChanged((prev, curr) => prev.id === curr.id)
);
```

Операторы управления частотой - критически важны для оптимизации пользовательского ввода и высокочастотных событий:

```typescript
// debounceTime - эмитит только если за указанный период не было новых значений
// Использование: поисковый ввод
searchInput$.pipe(
  debounceTime(300)  // ждет 300мс тишины
);

// throttleTime - эмитит первое значение, затем игнорирует в течение периода
// Использование: scroll, resize, rate limiting
scroll$.pipe(
  throttleTime(100)  // не чаще раза в 100мс
);

// auditTime - при получении значения ждет период, затем эмитит последнее
// Использование: когда нужно последнее значение за период
mousemove$.pipe(
  auditTime(200)
);

// sample - эмитит последнее значение при срабатывании notifier
source$.pipe(
  sample(interval(1000))  // берет последнее значение каждую секунду
);
```

## Операторы комбинирования

Операторы комбинирования объединяют несколько Observable в один.

```typescript
import {
  merge, concat, combineLatest, forkJoin,
  zip, race
} from 'rxjs';
import { withLatestFrom, startWith } from 'rxjs/operators';

// merge - объединяет потоки, эмитит значения по мере поступления из любого
const all$ = merge(clicks$, keypresses$, touches$);

// concat - подписывается на следующий поток только после завершения предыдущего
const sequence$ = concat(init$, data$, cleanup$);

// combineLatest - эмитит массив последних значений из всех потоков
// при каждой новой эмиссии любого из них
// Все потоки должны эмитить хотя бы одно значение
const combined$ = combineLatest([filters$, sorting$, pagination$]).pipe(
  map(([filters, sorting, pagination]) => ({ filters, sorting, pagination }))
);

// forkJoin - ждет завершения всех потоков, эмитит массив последних значений
// Аналог Promise.all для Observable
const parallel$ = forkJoin({
  users: httpClient.get<User[]>('/api/users'),
  roles: httpClient.get<Role[]>('/api/roles'),
  permissions: httpClient.get<Permission[]>('/api/permissions'),
});

// zip - объединяет потоки поэлементно (1-й с 1-м, 2-й со 2-м)
const paired$ = zip(ids$, names$).pipe(
  map(([id, name]) => ({ id, name }))
);

// withLatestFrom - при эмиссии основного потока берет последнее из дополнительного
clicks$.pipe(
  withLatestFrom(currentUser$),
  map(([event, user]) => ({ event, user }))
);

// startWith - начинает поток с указанного значения
searchResults$.pipe(
  startWith([])  // пустой массив до первого результата
);

// race - подписывается на первый эмитивший поток, остальные отбрасывает
const fastest$ = race(
  httpClient.get('/api/primary'),
  httpClient.get('/api/fallback').pipe(delay(3000))
);
```

> [!info]
> combineLatest не эмитит, пока каждый источник не эмитит хотя бы одно значение. Если один из потоков может быть пустым - используйте `startWith` для начального значения.

## Операторы обработки ошибок

В реактивных потоках ошибка прерывает подписку. Операторы обработки ошибок позволяют перехватывать ошибки и восстанавливать поток.

```typescript
import { of, timer, throwError, EMPTY } from 'rxjs';
import { catchError, retry, finalize, tap } from 'rxjs/operators';

// catchError - перехватывает ошибку и возвращает новый Observable
apiService.getData().pipe(
  catchError((error) => {
    console.error('API Error:', error);
    return of([]); // fallback значение
  })
);

// catchError с пробросом ошибки
apiService.getData().pipe(
  catchError((error) => {
    logService.logError(error);
    return throwError(() => new Error(`Processed: ${error.message}`));
  })
);

// catchError с EMPTY - тихое подавление ошибки
nonCriticalAction$.pipe(
  catchError(() => EMPTY)
);

// retry с конфигурацией (замена deprecated retryWhen)
apiService.getData().pipe(
  retry({
    count: 3,                       // максимум 3 попытки
    delay: (error, retryCount) => {
      // Exponential backoff
      const delayMs = Math.pow(2, retryCount) * 1000;
      console.log(`Retry ${retryCount} in ${delayMs}ms`);
      return timer(delayMs);
    },
    resetOnSuccess: true,           // сбросить счетчик при успехе
  }),
  catchError((error) => {
    // Все попытки исчерпаны
    return of({ data: null, error: error.message });
  })
);

// finalize - выполняется при complete или error (аналог finally)
apiService.getData().pipe(
  tap(() => showSpinner()),
  finalize(() => hideSpinner())
);
```

Стратегии обработки ошибок:

- Retry с backoff - для временных сетевых ошибок
- Fallback value - возвращение значения по умолчанию через `catchError(() => of(defaultValue))`
- Rethrow - логирование и проброс далее через `catchError(err => throwError(() => err))`
- Ignore - подавление через `catchError(() => EMPTY)` для некритичных операций
- Retry only specific errors - фильтрация ошибок внутри delay-функции retry

## Subject и его варианты

**Subject** - одновременно Observable и Observer. В отличие от обычного Observable, Subject является multicast - все подписчики получают одни и те же значения.

```typescript
import { Subject, BehaviorSubject, ReplaySubject, AsyncSubject } from 'rxjs';

// Subject - базовый, без начального значения
const subject = new Subject<string>();
subject.subscribe(v => console.log('A:', v));
subject.subscribe(v => console.log('B:', v));
subject.next('hello'); // A: hello, B: hello
// Поздний подписчик не получит прошлые значения
subject.subscribe(v => console.log('C:', v));
subject.next('world'); // A: world, B: world, C: world

// BehaviorSubject - хранит текущее значение, новый подписчик сразу получает его
const behavior = new BehaviorSubject<number>(0); // начальное значение обязательно
behavior.subscribe(v => console.log('Value:', v)); // сразу: Value: 0
behavior.next(1);  // Value: 1
behavior.getValue(); // синхронный доступ к текущему значению (использовать осторожно)

// ReplaySubject - сохраняет N последних значений для новых подписчиков
const replay = new ReplaySubject<string>(3); // буфер на 3 значения
replay.next('a');
replay.next('b');
replay.next('c');
replay.next('d');
replay.subscribe(v => console.log(v)); // b, c, d (последние 3)

// ReplaySubject с ограничением по времени
const timedReplay = new ReplaySubject<string>(100, 5000); // до 100 значений за последние 5с

// AsyncSubject - эмитит только последнее значение и только при complete
const async = new AsyncSubject<number>();
async.subscribe(v => console.log('Result:', v));
async.next(1);
async.next(2);
async.next(3);
async.complete(); // Result: 3
```

Выбор типа Subject:

- Subject - шина событий, когда прошлые значения не важны
- BehaviorSubject - состояние с текущим значением (авторизация, выбранный элемент, тема)
- ReplaySubject - кеш последних событий, поздние подписчики должны получить историю
- AsyncSubject - нужен только финальный результат вычисления

## Hot vs Cold Observables

Cold Observable создает отдельный источник данных для каждого подписчика. Каждая подписка запускает производство данных заново. HTTP-запрос через HttpClient - типичный cold observable: каждый `subscribe` отправляет новый запрос.

Hot Observable разделяет один источник между всеми подписчиками. Значения производятся независимо от наличия подписчиков. `fromEvent(document, 'click')` - hot: клики происходят вне зависимости от подписок, подписчик получает только события после подписки.

```typescript
import { interval, connectable, Subject } from 'rxjs';
import { share, shareReplay, take, tap } from 'rxjs/operators';

// Cold: каждый подписчик получает свою последовательность
const cold$ = interval(1000).pipe(take(3));
cold$.subscribe(v => console.log('Sub1:', v)); // 0, 1, 2
cold$.subscribe(v => console.log('Sub2:', v)); // 0, 1, 2 (независимо)

// share - превращает cold в hot, multicast через Subject
const shared$ = interval(1000).pipe(
  tap(v => console.log('Source:', v)), // вызывается один раз
  share()
);
shared$.subscribe(v => console.log('A:', v));
shared$.subscribe(v => console.log('B:', v));
// Source вызывается один раз, результат получают оба подписчика

// shareReplay - multicast + кеш последних N значений для поздних подписчиков
const cached$ = apiService.getConfig().pipe(
  shareReplay({ bufferSize: 1, refCount: true })
);
// Первый subscribe делает HTTP-запрос
// Второй subscribe получает закешированный результат
// refCount: true - при отсутствии подписчиков отписывается от источника

// connectable - ручной контроль начала эмиссии
const source$ = connectable(interval(1000), { connector: () => new Subject() });
source$.subscribe(v => console.log('A:', v));
source$.subscribe(v => console.log('B:', v));
source$.connect(); // начать эмиссию
```

> [!important]
> `shareReplay` с `refCount: true` - стандартный паттерн для кеширования HTTP-запросов. Без `refCount` поток никогда не отписывается от источника, что может привести к утечкам памяти.

## RxJS в Angular

Angular глубоко интегрирован с RxJS. HttpClient, Router, Reactive Forms, Interceptors - все возвращают Observable.

HttpClient возвращает cold Observable, который делает запрос при подписке и автоматически завершается после ответа:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map, shareReplay } from 'rxjs/operators';

interface ApiResponse<T> {
  data: T;
  meta: { total: number };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  // Кешированный запрос конфигурации
  readonly config$ = this.http.get<AppConfig>('/api/config').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>('/api/users').pipe(
      retry({ count: 2, delay: 1000 }),
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 0) {
      return throwError(() => new Error('Network error'));
    }
    return throwError(() => new Error(`Server error: ${error.status}`));
  }
}
```

AsyncPipe в шаблоне автоматически подписывается и отписывается при уничтожении компонента:

```typescript
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (users$ | async; as users) {
      @for (user of users; track user.id) {
        <div>{{ user.name }}</div>
      }
    } @else {
      <p>Loading...</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  private userService = inject(UserService);
  users$ = this.userService.getUsers();
}
```

Reactive Forms с valueChanges:

```typescript
import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<input [formControl]="searchControl" placeholder="Search..." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  private searchService = inject(SearchService);
  private destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.searchService.search(term ?? '')),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      // обработка результатов
    });
  }
}
```

> [!info]
> `takeUntilDestroyed` из `@angular/core/rxjs-interop` - современная замена паттерну с `Subject` и `takeUntil` в `ngOnDestroy`. Работает в injection context (конструктор, field initializer) или с явно переданным `DestroyRef`.

Router events:

```typescript
import { inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export class AppComponent {
  private router = inject(Router);

  currentUrl$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects)
  );
}
```

State management с BehaviorSubject:

```typescript
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

@Injectable({ providedIn: 'root' })
export class StateService {
  private state$ = new BehaviorSubject<AppState>({
    user: null,
    theme: 'light',
    notifications: [],
  });

  // Селекторы
  readonly user$ = this.select(s => s.user);
  readonly theme$ = this.select(s => s.theme);
  readonly unreadCount$ = this.select(
    s => s.notifications.filter(n => !n.read).length
  );

  private select<T>(selector: (state: AppState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  updateUser(user: User | null): void {
    this.state$.next({ ...this.state$.value, user });
  }

  addNotification(notification: Notification): void {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      notifications: [...current.notifications, notification],
    });
  }
}
```

HTTP Interceptors:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(newToken => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

## RxJS в React

React построен на однонаправленном потоке данных и хуках, а не на Observable. RxJS в React оправдан для сложных асинхронных сценариев, где хуков и стандартных подходов недостаточно.

Базовый хук для интеграции:

```typescript
import { useState, useEffect, useRef } from 'react';
import { Observable, Subscription } from 'rxjs';

function useObservable<T>(observable$: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);
  const subscriptionRef = useRef<Subscription>();

  useEffect(() => {
    subscriptionRef.current = observable$.subscribe({
      next: setValue,
      error: (err) => console.error('Observable error:', err),
    });

    return () => subscriptionRef.current?.unsubscribe();
  }, [observable$]);

  return value;
}

// Использование
function SearchResults() {
  const [term, setTerm] = useState('');
  const term$ = useRef(new BehaviorSubject('')).current;

  useEffect(() => { term$.next(term); }, [term]);

  const results$ = useMemo(
    () => term$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(t => t ? searchApi(t) : of([])),
    ),
    [term$]
  );

  const results = useObservable(results$, []);

  return (
    <div>
      <input value={term} onChange={e => setTerm(e.target.value)} />
      {results.map(r => <div key={r.id}>{r.title}</div>)}
    </div>
  );
}
```

Event handling с fromEvent:

```typescript
import { useEffect, useRef } from 'react';
import { fromEvent } from 'rxjs';
import { throttleTime, map } from 'rxjs/operators';

function ScrollTracker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sub = fromEvent(containerRef.current, 'scroll').pipe(
      throttleTime(100),
      map((e: Event) => (e.target as HTMLElement).scrollTop),
    ).subscribe(scrollTop => {
      // логика на основе позиции скролла
    });

    return () => sub.unsubscribe();
  }, []);

  return <div ref={containerRef} style={{ overflow: 'auto' }}>...</div>;
}
```

Когда RxJS избыточен в React:

- Простые fetch-запросы - достаточно React Query / SWR
- Локальное состояние компонента - достаточно useState/useReducer
- Глобальное состояние - Zustand или Jotai проще интегрируются с React
- Простая подписка на события - useEffect с addEventListener

RxJS в React оправдан, когда нужны сложные потоки: комбинация нескольких WebSocket-каналов, real-time dashboards с множеством источников, сложная координация параллельных и последовательных запросов.

## RxJS в Vue

Vue 3 Composition API естественно интегрируется с RxJS через пакет `@vueuse/rxjs` или ручные обертки.

```typescript
// composable для интеграции Observable с Vue refs
import { ref, onUnmounted, Ref } from 'vue';
import { Observable, Subscription } from 'rxjs';

function useObservable<T>(observable$: Observable<T>, initialValue: T): Ref<T> {
  const value = ref<T>(initialValue) as Ref<T>;
  let sub: Subscription;

  sub = observable$.subscribe({
    next: (v) => { value.value = v; },
    error: (err) => console.error(err),
  });

  onUnmounted(() => sub.unsubscribe());
  return value;
}

// Мост ref → Observable
import { watch } from 'vue';
import { Subject } from 'rxjs';

function refToObservable<T>(source: Ref<T>): Observable<T> {
  const subject = new Subject<T>();
  watch(source, (val) => subject.next(val));
  return subject.asObservable();
}
```

Пример поиска в Vue 3 + RxJS:

```typescript
import { defineComponent, ref } from 'vue';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export default defineComponent({
  setup() {
    const searchTerm = ref('');
    const searchTerm$ = refToObservable(searchTerm);

    const results = useObservable(
      searchTerm$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => term ? searchApi(term) : of([])),
      ),
      []
    );

    return { searchTerm, results };
  },
});
```

Для большинства задач во Vue достаточно встроенных `watch`, `computed` и `watchEffect`. RxJS добавляет ценность при работе с WebSocket, сложной координацией запросов и потоковой обработкой данных.

## Паттерны и лучшие практики

Всегда отписывайтесь от долгоживущих подписок. Это главная причина утечек памяти в RxJS-приложениях.

```typescript
// Angular: takeUntilDestroyed (современный подход)
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ /* ... */ })
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  constructor() {
    interval(1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(/* ... */);
  }
}

// Angular: AsyncPipe (предпочтительно для шаблонов)
// Подписка и отписка управляются автоматически
@Component({
  template: `{{ data$ | async }}`
})
export class MyComponent {
  data$ = this.service.getData();
}
```

Избегайте вложенных подписок. Это самый распространенный анти-паттерн:

```typescript
// Плохо: вложенные subscribe
userService.getUser(id).subscribe(user => {
  orderService.getOrders(user.id).subscribe(orders => {
    // вложенность растет, отписка не управляется
  });
});

// Хорошо: higher-order mapping operators
userService.getUser(id).pipe(
  switchMap(user => orderService.getOrders(user.id))
).subscribe(orders => {
  // плоская структура, автоматическая отписка от внутреннего Observable
});
```

Marble testing для проверки поведения потоков:

```typescript
import { TestScheduler } from 'rxjs/testing';

describe('search operator', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should debounce and deduplicate', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input  = cold('--a--b--b--c--|');
      const expected =    '-------b------(c|)';
      // Marble syntax:
      // - = 1 frame (виртуальное время)
      // a, b, c = эмитированные значения
      // | = complete
      // # = error

      const result = input.pipe(
        debounceTime(3, scheduler),
        distinctUntilChanged()
      );

      expectObservable(result).toBe(expected);
    });
  });
});
```

Предотвращение утечек памяти - чеклист:

- Каждый `subscribe` должен иметь стратегию отписки
- Для шаблонов Angular - использовать `async` pipe вместо ручного subscribe
- Для императивных подписок - `takeUntilDestroyed` или `takeUntil(destroy$)`
- HTTP-запросы (cold, single-value) обычно не нуждаются в ручной отписке, но отмена запроса при destroy может быть полезна для UX
- `shareReplay` всегда с `refCount: true`
- В `effect` (Angular signals) не создавать подписки без отписки

Распространенные анти-паттерны:

- subscribe внутри subscribe - заменять на switchMap/mergeMap/concatMap
- subscribe только ради side-effect - использовать `tap` внутри pipe
- Хранение Subscription в массиве для ручной отписки - заменять на `takeUntil`
- Использование `getValue()` у BehaviorSubject в pipe-цепочке - это нарушение реактивности, лучше использовать `withLatestFrom`
- Создание Observable в шаблоне Angular при каждом change detection - выносить в поле компонента
