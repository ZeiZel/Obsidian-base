---
tags:
 - interview
 - javascript
 - frontend
---

Собеседование на позицию Senior JavaScript Developer проверяет не столько знание синтаксиса, сколько глубину понимания внутренних механизмов языка. В этой статье собраны 50 вопросов, которые покрывают ключевые темы: от Event Loop до Web Workers, от прототипов до WebAssembly. Каждый ответ написан с расчётом на уровень Senior: объясняется не только *как* работает механизм, но и *почему* он так устроен, какие есть граничные случаи и на что это влияет в продакшене.

---

### 1. Что такое Event Loop и в чём разница между microtasks и macrotasks?

Event Loop - это механизм, который позволяет JavaScript (однопоточному языку) выполнять неблокирующие операции. Он постоянно проверяет Call Stack и очередь задач.

**Macrotasks** (или просто *tasks*): `setTimeout`, `setInterval`, I/O, UI rendering, `setImmediate` (Node.js). Каждая макрозадача выполняется за один тик Event Loop, после чего JS проверяет очередь microtasks.

**Microtasks**: `Promise.then/catch/finally`, `queueMicrotask`, `MutationObserver`. Ключевое отличие - после выполнения каждой макрозадачи **вся очередь microtasks опустошается полностью** до того, как будет взята следующая макрозадача. Более того, microtasks, добавленные во время выполнения microtask, также выполняются в этом же цикле.

> [!important]
> Microtasks выполняются **до** рендеринга. Если вы бесконечно добавляете microtasks, браузер никогда не отрисует кадр - интерфейс зависнет.

**Базовый пример — три очереди за один тик:**

```js
console.log('1');
setTimeout(() => console.log('macrotask'), 0);
Promise.resolve().then(() => console.log('microtask'));
console.log('2');
// Вывод: 1, 2, microtask, macrotask
```

**Полный разбор всех нюансов:**

Пример ниже покрывает: синхронный код, microtasks (Promise.then, queueMicrotask), macrotasks (setTimeout), setTimeout внутри Promise.then, вложенные microtasks, цепочки .then, и даже microtask внутри macrotask-колбэка.

```js
console.log('A: sync top-level');

setTimeout(() => {
  console.log('B: macrotask 1 (setTimeout 0)');

  Promise.resolve().then(() => {
    console.log('C: microtask inside macrotask 1');
  });

  queueMicrotask(() => {
    console.log('D: queueMicrotask inside macrotask 1');
  });
}, 0);

Promise.resolve()
  .then(() => {
    console.log('E: first microtask');
    // Возврат не-промиса — следующий .then выполнится в этом же microtask-цикле
    return 'F';
  })
  .then((val) => {
    console.log(`G: chained .then, got "${val}"`);

    // setTimeout ВНУТРИ microtask — это macrotask, пойдёт в следующую итерацию event loop
    setTimeout(() => {
      console.log('H: macrotask 2, created inside microtask chain');
      // microtask внутри macrotask 2
      Promise.resolve().then(() => console.log('I: microtask inside macrotask 2'));
    }, 0);

    // Возвращаем Promise — цепочка ПОДОЖДЁТ его разрешения
    return Promise.resolve('J');
  })
  .then((val) => {
    console.log(`K: chained .then after promise, got "${val}"`);

    // Создаём ещё один microtask — он добавится в очередь и выполнится в этом же тике
    Promise.resolve().then(() => console.log('L: nested microtask, same tick'));
  })
  .then(() => {
    console.log('M: final .then in chain');
  });

setTimeout(() => {
  console.log('N: macrotask 3, separate setTimeout');
  // Проверка: microtask в macrotask 3
  Promise.resolve().then(() => console.log('O: microtask inside macrotask 3'));
}, 0);

queueMicrotask(() => {
  console.log('P: standalone queueMicrotask');
});

console.log('Q: sync bottom-level');
```

**Вывод (проверь себя — закрой правую колонку):**

```
A: sync top-level
Q: sync bottom-level
E: first microtask
P: standalone queueMicrotask
G: chained .then, got "F"
K: chained .then after promise, got "J"
L: nested microtask, same tick
M: final .then in chain
B: macrotask 1 (setTimeout 0)
C: microtask inside macrotask 1
D: queueMicrotask inside macrotask 1
N: macrotask 3, separate setTimeout
O: microtask inside macrotask 3
H: macrotask 2, created inside microtask chain
I: microtask inside macrotask 2
```

**Пошаговый разбор — почему именно в этом порядке:**

**Фаза 1: синхронный код** — call stack выполняет всё подряд.

```
A: sync top-level      → console.log, без очередей
Q: sync bottom-level   → console.log, без очередей
```

После выполнения синхронного кода очереди заполнены так:
- **microtask queue:** [E, P] — `.then()` от `Promise.resolve()` и `queueMicrotask`
- **macrotask queue:** [B, N] — два `setTimeout(0)` на верхнем уровне

**Фаза 2: microtasks первого цикла** — event loop опустошает очередь microtasks полностью.

Microtask [0]: **E**. Выводит `E: first microtask`. Возвращает `'F'` (не Promise) → следующий `.then(G)` немедленно добавляется в microtask-очередь.

Microtask-очередь после E: **[P, G]**

Microtask [1]: **P**. Выводит `P: standalone queueMicrotask`.

Microtask-очередь после P: **[G]**

Microtask [2]: **G**. Выводит `G: chained .then, got "F"`. Создаёт `setTimeout(H)` → уходит в macrotask-очередь. Возвращает `Promise.resolve('J')` — **ключевой момент**: возврат Promise из `.then()` включает механизм «разворачивания» (promise assimilation). Движок создаёт дополнительный microtask для обработки этого Promise. После его разрешения значением `'J'`, `.then(K)` добавляется в microtask-очередь.

Macrotask-очередь теперь: **[B, N, H]**

Microtask [3]: **K**. Выводит `K: chained .then after promise, got "J"`. Создаёт `Promise.resolve().then(L)` → L добавляется в microtask-очередь. Возврат undefined из K резолвит следующий `.then(M)` → M добавляется в microtask-очередь.

Microtask-очередь после K: **[L, M]**

Microtask [4]: **L**. Выводит `L: nested microtask, same tick`.

Microtask [5]: **M**. Выводит `M: final .then in chain`.

Microtask-очередь пуста.

> [!important]
> Ключевые выводы из примера:
> 1. **Microtask-очередь опустошается полностью** перед каждой macrotask — E, P, G, K, L, M выполнились до того, как любая macrotask (B, N, H) получила управление.
> 2. **Microtask, созданный внутри microtask, остаётся в том же тике** — L (создан внутри K) и M выполняются немедленно, не дожидаясь macrotask.
> 3. **Macrotask (setTimeout), созданный внутри microtask, уходит в следующую итерацию** — H создан внутри G (microtask), но выполнится только после B и N (которые были зарегистрированы раньше в macrotask-очереди).
> 4. **`Promise.resolve()` внутри `.then()` добавляет один дополнительный microtask-тик** для promise assimilation — поэтому G → K требует на один microtask больше, чем если бы G вернул `'J'` напрямую.

**Практический вывод:** если вам нужно отложить выполнение до следующего тика, но до рендеринга - используйте microtask. Если нужно дать браузеру отрисовать кадр между операциями - используйте `setTimeout(0)` или `requestAnimationFrame`.

**Модель потоков браузера  -  кто на ком живёт и почему Workers не блокируют страницу**

Браузер многопоточен, но JavaScript на каждом потоке однопоточный. Ключевое отличие, которое часто путают: у каждого JS-контекста **свой собственный Event Loop**, работающий на **своём физическом потоке ОС**. Они не делят одну очередь задач.

| Поток | Свой Event Loop | Откуда приходят задачи |
|---|---|---|
| **Main thread** (страница) | Да, отдельный | IO thread (fetch/XHR), compositor (requestAnimationFrame), timer thread (setTimeout), browser process (клики, клавиатура  -  через IPC) |
| **Web Worker** | Да, **свой собственный** | Его собственный код + `postMessage` из других потоков |
| **Service Worker** | Да, **свой собственный** | События `fetch`, `activate`, `install` от браузерного процесса |

> [!important]
> Web Worker и Service Worker никогда не попадают в Event Loop главного потока. У каждого из них своя очередь задач, свой стек вызовов, свой экземпляр JS-движка. Именно поэтому `while(true)` в worker-е вешает worker, но не трогает страницу  -  это два разных потока с разными event loop-ами.

**Как события от браузерных потоков попадают в Main thread:**

У главного потока нет доступа к железу напрямую. Браузерные подсистемы работают на отдельных потоках и лишь уведомляют главный поток о завершении:

- **UI-события (клик, ввод):** перехватываются browser process (отдельный процесс!) на уровне ОС. Browser process через IPC (inter-process communication) передаёт событие в renderer process, где оно ставится macrotask-ом в очередь главного потока
- **Сетевые ответы (`fetch`, `XMLHttpRequest`):** Network thread выполняет запрос, получает ответ, ставит callback macrotask в очередь главного потока. Сам запрос не блокирует главный поток
- **Таймеры (`setTimeout`):** Timer thread отсчитывает время, по истечении ставит callback macrotask в очередь главного потока

Все эти потоки **не выполняют JavaScript**  -  они лишь помещают callback в очередь macrotasks главного потока. Главный поток извлекает их по одной и выполняет синхронно.

**Почему Workers не блокируют главный поток:**

Когда вы вызываете `worker.postMessage(data)` из главного потока:
1. Данные сериализуются через structured clone (полная копия, память не шарится)
2. Вызов возвращается мгновенно  -  главный поток идёт дальше
3. На стороне worker-а поступление сообщения становится **macrotask в событийном цикле самого worker-а** (не главного потока!)
4. Worker в своём темпе разбирает свою очередь, вызывает `onmessage`

Когда worker отвечает через `self.postMessage(result)`:
1. Данные снова сериализуются
2. На стороне главного потока получение становится macrotask в его очереди
3. Главный поток дойдёт до него, когда разберёт предыдущие macrotasks

Это принципиальное отличие от `setTimeout(callback, 0)`  -  тот ставит macrotask **в этот же самый Event Loop** (главный поток). А `postMessage` ставит macrotask **в Event Loop другого потока**.

**Кто распределяет потоки по физическим ядрам CPU:**

Не браузер. Chromium создаёт OS-level threads (`pthread_create` на Linux/macOS, `CreateThread` на Windows). Распределение этих потоков по физическим ядрам выполняет **планировщик операционной системы** (CFS в Linux, XNU в macOS). Браузер может только задавать приоритеты потоков (`Thread Priority`), но не привязку к ядрам. Поэтому на многоядерном процессоре главный поток и Web Worker действительно исполняются параллельно.

**Внутреннее устройство (спецификация):** Алгоритм Event Loop описан в HTML Spec. Каждая итерация Event Loop **конкретного потока** (главного, worker-а, service worker-а):

1. Выбрать одну macrotask из очереди этого потока (UI-события через IPC, таймеры, сетевые колбэки  -  только для главного потока; `postMessage`  -  для любого)
2. Выполнить её
3. Опустошить очередь microtasks этого потока
4. Если это главный поток и нужно  -  выполнить рендеринг

В Node.js (libuv) схема похожа, но добавляются фазы: timers → pending callbacks → idle/prepare → poll → check → close callbacks, и microtasks выполняются между фазами. Node.js использует собственный пул потоков (thread pool) для файлового I/O и криптографии. Worker Threads в Node.js (`new Worker()`) работают по тому же принципу  -  отдельный экземпляр V8, отдельный libuv event loop, свой пул потоков.

---

### 2. Замыкания (closures) и взаимодействие со сборкой мусора

Замыкание - это функция, которая запоминает своё лексическое окружение (Lexical Environment), даже когда она выполняется вне этого окружения. По спецификации, замыкание сохраняет ссылку на **весь** объект переменных (Variable Environment), а не только на используемые переменные.

> [!important]
> Двигаясь по цепочке `[[Environment]]`, замыкание удерживает в памяти **все** переменные внешней функции, даже те, которые внутри замыкания не используются. Это может приводить к утечкам памяти.

```js
function outer() {
  const hugeArray = new Array(10_000_000).fill('x');
  const small = 'used';
  return function inner() {
    console.log(small); // hugeArray не используется, но удерживается в памяти
  };
}
const fn = outer();
// hugeArray не будет собран GC, пока fn существует
```

**V8 оптимизация:** Современные движки (V8, SpiderMonkey) анализируют, какие переменные реально используются в замыкании, и могут освобождать неиспользуемые. Но полагаться на это нельзя - особенно в случаях с `eval` или `with`, которые отключают оптимизации.

**Сборка мусора** работает по алгоритму Mark-and-Sweep: начиная от корней (root set - глобальный объект, стек вызовов), GC обходит все достижимые объекты и помечает их. Непомеченные удаляются. Замыкание сохраняет достижимость Variable Environment → переменные не собираются.

**Поколения (Generational GC)** основаны на гипотезе о поколениях: большинство объектов умирают молодыми. Память делится на:

- **Young generation (Nursery):** новые объекты. Здесь используется **Scavenger** (полукопирующий сборщик) - быстрый, но с ограниченным объёмом. Живые объекты копируются в промежуточное пространство, затем во Old generation.
- **Old generation:** объекты, пережившие несколько сборок. Здесь работает полный **Mark-Sweep-Compact** + **Mark-Compact** для дефрагментации.

> [!important]
> Minor GC (в Young generation) происходит часто и быстро. Major GC (полная сборка) - реже, но может вызывать заметные паузы. Именно поэтому важно не создавать много долгоживущих объектов без необходимости.

**Оптимизации V8:**
- **Incremental marking** - пометка разбивается на маленькие шаги, чтобы не блокировать поток JS
- **Concurrent marking** - пометка выполняется в фоновом потоке параллельно JS
- **Idle-time GC** - GC запускается, когда основной поток простаивает

**Практические выводы:**
- Не создавайте замыкания над большими структурами данных, если они не нужны внутри
- Явно обнуляйте ссылки (`fn = null`), когда замыкание больше не нужно
- Используйте блочную область видимости (`let`, `const` в блоках), чтобы ограничить время жизни переменных

---

### 3. Правила привязки `this` и стрелочные функции

Значение `this` определяется не местом объявления функции, а тем, **как** функция вызывается. Есть 4 правила (в порядке приоритета):

1. **`new`** - `this` = новый создаваемый объект
2. **Явная привязка** - `call`, `apply`, `bind` (кроме стрелочных функций)
3. **Неявная привязка** - вызов как метода объекта (`obj.fn()`)
4. **Default** - в strict mode `undefined`, иначе - глобальный объект (`window`)

```js
const obj = {
  name: 'Alice',
  greet() { console.log(this.name); },
  arrowGreet: () => console.log(this.name),
};
obj.greet();       // 'Alice' - неявная привязка
obj.arrowGreet();  // undefined - arrow не имеет своего this

const fn = obj.greet;
fn();              // undefined (strict) - потеря контекста
```

**Стрелочные функции** не имеют собственного `this`. Их `this` лексически привязан к `this` объемлющей области видимости **в момент объявления**. Это значение нельзя изменить ни через `bind/call/apply`, ни через `new`.

> [!important]
> Стрелочные функции не подходят для методов объектов (если нужен доступ к `this` объекта) и не могут быть конструкторами. Их идеальное применение - колбэки внутри методов, где `this` должен указывать на объект-владелец.

```js
class Component {
  constructor() {
    this.count = 0;
    // Стрелка запоминает this конструктора
    document.addEventListener('click', () => this.count++);
  }
}
```

**Внутреннее устройство:** В спецификации у стрелочных функций нет внутреннего слота `[[Construct]]` и нет `[[ThisMode]]` (который у обычных функций равен `lexical` или `strict`). Их `[[ThisMode]]` всегда `lexical`.

---

### 4. Hoisting и Temporal Dead Zone (TDZ)

**Hoisting (поднятие)** - поведение, при котором объявления переменных и функций перемещаются в начало своей области видимости на этапе компиляции (до выполнения кода).

- **`var`:** поднимается и инициализируется `undefined`. Доступ до строки объявления вернёт `undefined`.
- **`function`:** поднимается целиком с телом. Можно вызвать до объявления.
- **`let`/`const`:** поднимаются, но **не инициализируются**. Период от начала блока до строки объявления называется Temporal Dead Zone (TDZ). Доступ к переменной в TDZ вызывает `ReferenceError`.
- **`class`:** поднимается, но с TDZ (как `let`).

```js
console.log(a); // undefined (var hoisted)
var a = 1;

console.log(b); // ReferenceError: TDZ
let b = 2;

hoisted(); // 'I work' (function declaration hoisted)
function hoisted() { console.log('I work'); }
```

> [!important]
> TDZ существует для того, чтобы сделать поведение `let`/`const` более предсказуемым. С `var` вы можете случайно прочитать `undefined` и получить трудноотлаживаемый баг. TDZ форсирует правильный порядок: объявить перед использованием.

**Как движок обрабатывает TDZ:** При входе в блок для каждой `let`/`const` переменной создаётся запись в Lexical Environment, но с флагом «не инициализирована». Любая попытка чтения до присвоения бросает исключение. После выполнения строки объявления флаг снимается.

---

### 5. Цепочка прототипов и проблемы `__proto__`

Каждый объект в JS имеет внутренний слот `[[Prototype]]`, который указывает на другой объект (или `null`). Это формирует цепочку прототипов: при доступе к свойству, если его нет в объекте, JS ищет его в `[[Prototype]]`, затем в `[[Prototype]]` прототипа и так далее.

```js
const parent = { x: 1 };
const child = { y: 2 };
Object.setPrototypeOf(child, parent);
console.log(child.x); // 1 - найдено в parent по цепочке
```

**Проблемы `__proto__`:**

1. **Производительность:** `__proto__` - это геттер/сеттер на `Object.prototype`. Изменение `[[Prototype]]` существующего объекта ломает оптимизации движка (Hidden Classes / Shapes), потому что V8 строит предположения о структуре объекта на этапе компиляции.

2. **Безопасность:** `__proto__` доступен через `Object.prototype.__proto__`. Если объект создан через `Object.create(null)`, у него нет `__proto__`.

3. **Путаница:** `__proto__` и `prototype` - разные вещи. `prototype` есть только у функций (конструкторов), это объект, который будет присвоен `[[Prototype]]` нового экземпляра. `__proto__` - это нестандартный (но де-факто реализованный) аксессор к `[[Prototype]]` любого объекта.

> [!important]
> Всегда используйте `Object.getPrototypeOf(obj)` и `Object.setPrototypeOf(obj, proto)` вместо `__proto__`. А лучше - создавайте объекты с нужным прототипом сразу через `Object.create(proto)`.

```js
// Правильно
const child = Object.create(parent);
// Неправильно
const child = {};
child.__proto__ = parent; // ломает оптимизации V8
```

**Интересный факт:** `Function.prototype` - это функция (единственная функция без `prototype` как свойства конструктора), а `Object.prototype.__proto__ === null` - конец цепочки прототипов.

---

### 6. `null` vs `undefined` vs undeclared: отличия и способы проверки

Три разных состояния, которые часто путают:

- **`undefined`** - значение присвоено автоматически переменной, которой не дали значения. Также возвращается при отсутствии свойства в объекте, отсутствии return в функции, параметрах без аргументов
- **`null`** - явное «пустое» значение, которое разработчик присваивает сам, чтобы показать отсутствие объекта
- **undeclared** - переменная вообще не объявлена. Любая попытка обращения вызывает `ReferenceError`

```js
let a;           // a === undefined (автоматическое значение)
const b = null;  // b === null (явное отсутствие)
// c - undeclared, обращение к c вызовет ReferenceError

const obj = {};
console.log(obj.missing); // undefined - свойство не существует
```

**Исторический баг:** `typeof null === 'object'` - это ошибка, заложенная в первой реализации JavaScript. В оригинальной реализации значения хранились как тег + значение, и `null` был представлен как нулевой указатель с тегом объекта. Исправление сломало бы обратную совместимость, поэтому баг остался навсегда.

**Как проверять:**

```js
// Проверка на undefined
typeof x === 'undefined';    // безопасно даже для undeclared
x === undefined;             // ReferenceError если x undeclared

// Проверка на null
x === null;

// Проверка на null ИЛИ undefined одновременно
x == null;                   // true для null и undefined (== null trick)
x === null || x === undefined;

// Для undeclared - только typeof
typeof undeclaredVar === 'undefined'; // true, без ошибки
```

**`void 0`** - альтернатива `undefined`. В старом коде `undefined` можно было перезаписать (`undefined = 42`), поэтому использовали `void 0` (выражение `void` всегда возвращает `undefined`). В современном JS `undefined` - read-only, но `void 0` всё ещё встречается.

**Взаимодействие с Optional Chaining:**

```js
const user = null;
user?.name; // undefined - цепочка прерывается на null

const user2 = undefined;
user2?.name; // undefined - то же поведение
```

**Default параметры и null:** параметры по умолчанию срабатывают **только на `undefined`**, не на `null`:

```js
function greet(name = 'Guest') {
  console.log(name);
}
greet();           // 'Guest' - undefined触发 default
greet(null);       // null - null это валидное значение
greet(undefined);  // 'Guest' - undefined触发 default
```

> [!important]
> `== null` - единственный оправданный случай использования `==`. Он проверяет и `null`, и `undefined` одновременно. Для всего остального используйте `===`.

---

### 7. Состояния Promise, цепочки и статические методы

Promise может находиться в одном из трёх состояний:
- **pending** - ожидание
- **fulfilled** - успешно завершён (значение сохраняется в `[[PromiseResult]]`)
- **rejected** - завершён с ошибкой (причина в `[[PromiseResult]]`)

Переход между состояниями однократный и необратимый.

**Цепочки:** `.then()` и `.catch()` всегда возвращают **новый** Promise, что позволяет строить цепочки. Если колбэк возвращает значение - следующий `.then()` получит его. Если возвращает Promise - цепочка «подождёт» его разрешения. Если колбэк бросает исключение - следующий `.catch()` перехватит его.

```js
Promise.resolve(1)
  .then(v => v * 2)         // 2
  .then(v => Promise.resolve(v + 1)) // 3
  .then(v => { throw new Error('oops'); })
  .catch(e => 'caught')
  .then(console.log);       // 'caught'
```

**Статические методы:**

| Метод | Когда резолвится | Когда rejected |
|-------|-----------------|----------------|
| `Promise.all([])` | Все fulfilled | Первый rejected |
| `Promise.allSettled([])` | Все settled | Никогда (всегда fulfilled) |
| `Promise.race([])` | Первый settled | Первый rejected |
| `Promise.any([])` | Первый fulfilled | Все rejected (AggregateError) |

> [!important]
> `Promise.all` - режим fail-fast: если один упал, результат всего массива теряется. Используйте `Promise.allSettled`, когда нужно дождаться всех, независимо от ошибок. `Promise.any` полезен, когда вам нужен хотя бы один успешный ответ (например, запрос к нескольким репликам).

**Граничные случаи:**
- `Promise.all([])` - немедленно fulfilled с `[]`
- `Promise.race([])` - вечно pending (никто не завершится)
- `Promise.any([])` - rejected с `AggregateError`

---

### 8. Внутреннее устройство async/await

`async/await` - это синтаксический сахар над генераторами и промисами. Ключевая идея: генератор может приостанавливать выполнение (`yield`), а промис представляет будущее значение. `async/await` комбинирует это для написания асинхронного кода в синхронном стиле.

**Как это работает внутри:**

`async function` - это функция, которая:
1. Всегда возвращает Promise (не-промис значения оборачиваются)
2. Внутри своего тела трансформируется в генератороподобный автомат состояний

Каждый `await` - это точка, где выполнение может приостановиться. Движок преобразует тело функции в state machine:

```js
// Было:
async function fetchData() {
  const user = await fetch('/user');
  const posts = await fetch('/posts?user=' + user.id);
  return posts;
}

// Трансформируется (упрощённо) в:
function fetchData() {
  return spawn(function* () {
    const user = yield fetch('/user');
    const posts = yield fetch('/posts?user=' + user.id);
    return posts;
  });
}

function spawn(gen) {
  return new Promise((resolve, reject) => {
    function step(nextFn) {
      let next;
      try {
        next = nextFn();
      } catch (e) {
        return reject(e);
      }
      if (next.done) return resolve(next.value);
      Promise.resolve(next.value).then(
        v => step(() => gen.next(v)),
        e => step(() => gen.throw(e))
      );
    }
    step(() => gen.next());
  });
}
```

> [!important]
> `await` на не-промис значении не создаёт microtask (спецификация: `await` вызывает `Promise.resolve()`, что для не-промисов просто возвращает значение). Но если справа промис - создаётся microtask на обработку `.then()`.

**Подводный камень:** `await` всегда приостанавливает выполнение async-функции, даже если промис уже resolved. Но движок может оптимизировать это в некоторых случаях.

---

### 9. ` == ` vs ` === `, приведение типов, `NaN`, `-0` и `Object.is()`

**` === ` (Strict Equality):** не выполняет приведение типов. Если типы разные - `false`. Исключения: `NaN !== NaN` и `+0 === -0`.

**` == ` (Abstract Equality):** выполняет приведение типов по алгоритму Abstract Equality Comparison:
1. Если типы одинаковые → ` === `
2. `null == undefined` → `true` (особый случай)
3. Если сравниваются число и строка → строка преобразуется в число
4. Если один из операндов - boolean → boolean преобразуется в число
5. Если один операнд - объект → объект преобразуется в примитив

```js
console.log(null == undefined);  // true
console.log(null === undefined); // false
console.log('5' == 5);           // true ('5' → 5)
console.log(true == 1);          // true (true → 1)
console.log(false == 0);         // true (false → 0)
```

**Почему `[] + [] === ""`:**
1. Оператор `+` сначала преобразует операнды в примитивы через `ToPrimitive` (hint: `'default'`).
2. Для объектов вызывается `[Symbol.toPrimitive]`, если нет - `valueOf()`, затем `toString()`.
3. `[].toString()` возвращает `""`.
4. `"" + "" = ""`.

```js
console.log([] + []);        // ""
console.log([] + {});        // "[object Object]"
console.log([] == ![]);      // true (WTF!)

// [] == ![]:
// ![] → false (объект всегда truthy)
// [] == false → ToNumber([]) == 0, ToNumber(false) == 0
// 0 == 0 → true
```

**`NaN` (Not a Number)** - специальное значение типа Number. Уникальное свойство: `NaN` не равно самому себе (`NaN !== NaN`).

```js
console.log(typeof NaN);       // 'number'
console.log(NaN === NaN);      // false
console.log(Object.is(NaN, NaN)); // true
console.log(Number.isNaN(NaN));   // true
console.log(isNaN('hello'));      // true - глобальная isNaN приводит к числу!
console.log(Number.isNaN('hello')); // false - Number.isNaN без приведения
```

**`-0`** - отрицательный ноль (IEEE 754):

```js
console.log(-0 === 0);          // true (=== не различает)
console.log(Object.is(-0, 0));  // false
console.log(1 / -0);            // -Infinity
```

**Три алгоритма сравнения:**

| Операция                           | NaN vs NaN | +0 vs -0 |
| ---------------------------------- | ---------- | -------- |
| ===                                | false      | true     |
| `Object.is()` (SameValue)          | true       | false    |
| SameValueZero (Map, Set, includes) | true       | true     |

> [!important]
> Всегда используйте ` === `, если нет явной причины использовать ` == `. Единственное оправданное применение ` == `: проверка `x == null` (эквивалентно `x === null || x === undefined`). Для проверки на `NaN` используйте `Number.isNaN()`, а не глобальную `isNaN()`.

---

### 10. Делегирование событий, всплытие и Custom Events

**Делегирование событий** - техника, при которой один обработчик на родителе обрабатывает события от множества дочерних элементов. Использует всплытие (bubbling) событий.

```js
// Без делегирования (плохо): 1000 обработчиков для 1000 элементов
document.querySelectorAll('.item').forEach(el =>
  el.addEventListener('click', handleClick)
);

// С делегированием (хорошо): 1 обработчик
document.getElementById('list').addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (!item) return; // Клик не по .item - игнорируем
  handleItemClick(item);
});
```

**Преимущества:**
- Меньше памяти (1 обработчик вместо N)
- Автоматически работает для динамически добавленных элементов
- Проще управление: добавлен/удалён один обработчик, а не множество

**Фазы события:** capturing (от window к цели) → target → bubbling (от цели к window). Делегирование работает на фазе bubbling.

**Custom Events** - создание собственных событий для коммуникации между компонентами:

```js
const event = new CustomEvent('user:login', {
  detail: { userId: 42, name: 'Alice' },
  bubbles: true,      // Всплывает по DOM
  composed: true,     // Пересекает Shadow DOM boundary
  cancelable: true,   // Можно отменить через preventDefault()
});

document.addEventListener('user:login', (e) => {
  console.log('User logged in:', e.detail.userId);
});

document.dispatchEvent(event);
```

> [!important]
> `composed: true` критично для работы через Shadow DOM. Без него кастомное событие, отправленное внутри Shadow DOM, не выйдет за его границы.

**Недостатки делегирования:**
- Сложнее дебажить (стек-трейс указывает на родителя, не на источник)
- `event.stopPropagation()` в дочернем элементе может сломать делегирование
- Некоторые события не всплывают: `focus`, `blur`, `load`, `unload` (но `focusin`/`focusout` всплывают)

---

### 11. `forEach` vs `map` и сравнение методов массивов

Все методы массивов решают разные задачи. Ключевое различие между `forEach` и `map`:

- **`forEach`** - для сайд-эффектов. Ничего не возвращает (`undefined`). Нельзя прервать (кроме `throw`)
- **`map`** - для трансформации. Возвращает **новый массив** той же длины. Поддерживает chaining

```js
const nums = [1, 2, 3];

// forEach - сайд-эффекты
nums.forEach(n => console.log(n)); // undefined

// map - трансформация
const doubled = nums.map(n => n * 2); // [2, 4, 6]

// filter - фильтрация
const evens = nums.filter(n => n % 2 === 0); // [2]

// reduce - аккумуляция
const sum = nums.reduce((acc, n) => acc + n, 0); // 6

// find / findIndex - первый элемент по условию
const first = nums.find(n => n > 1); // 2

// some / every - проверка условия
nums.some(n => n > 2); // true
nums.every(n => n > 0); // true
```

> [!important]
> `map` возвращает новый массив - это иммутабельный паттерн. `forEach` мутирует внешний контекст. Используйте `map` когда результат нужен, `forEach` когда важны сайд-эффекты (лог, DOM, запросы).

**Ранний выход:** `forEach` нельзя прервать через `break` или `return`. Для раннего выхода используйте `some` (останавливается на `true`) или `every` (останавливается на `false`):

```js
// Нельзя прервать forEach
nums.forEach(n => {
  if (n === 2) return; // пропускает только этот элемент, не весь цикл
  console.log(n);
});

// some - останавливается на первом true
nums.some(n => {
  if (n === 2) return true; // цикл остановлен
  console.log(n);
  return false;
});

// Лучше: for...of с break
for (const n of nums) {
  if (n === 2) break;
  console.log(n);
}
```

**Промежуточные массивы:** цепочка `filter().map()` создаёт промежуточный массив. Для одного прохода используйте `reduce` или `flatMap`:

```js
// Два прохода, промежуточный массив
const result = nums.filter(n => n > 1).map(n => n * 2);

// Один проход через reduce
const result = nums.reduce((acc, n) => n > 1 ? [...acc, n * 2] : acc, []);
```

**Sparse arrays (дырки):** методы массивов по-разному обрабатывают отсутствующие элементы:

```js
const sparse = [1, , 3]; // дырка на индексе 1
sparse.forEach(v => console.log(v)); // 1, 3 (пропускает дырку)
sparse.map(v => v * 2);              // [2, empty, 6] (сохраняет дырку)
```

**Производительность:** `forEach` медленнее обычного `for` цикла из-за вызова функции на каждой итерации. Для критичных к производительности участков используйте `for` или `for...of`.

---

### 12. Debounce и Throttle

Обе техники ограничивают частоту вызова функции, но по-разному.

**Debounce** - откладывает выполнение. Функция вызывается только после того, как прошло N мс с последней попытки вызова. Каждый новый вызов сбрасывает таймер.

**Throttle** - гарантирует, что функция вызывается не чаще чем раз в N мс. Первая попытка выполняется сразу, а последующие в течение интервала игнорируются.

```js
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const throttle = (fn, delay) => {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
};
```

> [!important]
> **Debounce** применяется, когда важно только финальное событие: поисковые подсказки (отправить запрос после окончания ввода), автосохранение, ресайз окна. **Throttle** - когда важна регулярность: scroll-события, ресайз в реальном времени, отслеживание движения мыши.

**Продвинутые варианты:**
- `throttle` с сохранением последнего вызова (выполнить trailing edge)
- `debounce` с немедленным первым вызовом (leading edge)
- `requestAnimationFrame throttle` - для синхронизации с рендерингом

---

### 13. Реализация `Function.prototype.bind`

`bind()` создаёт новую функцию, у которой `this` фиксирован переданным значением, а часть аргументов может быть предзаполнена (частичное применение).

**Полифил (упрощённый, без поддержки `new`):**

```js
Function.prototype.myBind = function (context, ...boundArgs) {
  const originalFn = this;
  return function (...args) {
    return originalFn.apply(context, [...boundArgs, ...args]);
  };
};
```

**Полный полифил (с поддержкой `new`):**

```js
Function.prototype.myBind = function (context, ...boundArgs) {
  if (typeof this !== 'function') {
    throw new TypeError('Bind must be called on a function');
  }
  const originalFn = this;
  const boundFn = function (...args) {
    // Если вызвано с new, this instanceof boundFn
    const isNewCall = this instanceof boundFn;
    const targetContext = isNewCall ? this : context;
    return originalFn.apply(targetContext, [...boundArgs, ...args]);
  };
  // Поддерживаем prototype
  boundFn.prototype = Object.create(originalFn.prototype || Object.prototype);
  return boundFn;
};
```

> [!important]
> Ключевой момент: если bound-функция вызывается с `new`, привязанный `this` игнорируется - `new` имеет более высокий приоритет. Именно так ведёт себя нативный `bind()`. Также создание `boundFn.prototype` через `Object.create` гарантирует, что изменения прототипа оригинальной функции не затронут уже созданные bound-функции.

**Интересный факт:** bound-функция, созданная через `bind()`, не имеет `.prototype` (в обычном смысле) - но это свойство есть. Повторный `bind` не меняет `this` - используется `this` первого `bind`.

---

### 14. ES6 Classes vs ES5 конструкторы

**ES5 конструкторы** - функции, вызываемые с `new`. Наследование через `Object.create()` и установку `prototype`:

```js
// ES5
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  console.log(this.name + ' makes a sound');
};

function Dog(name, breed) {
  Animal.call(this, name); // вызов родительского конструктора
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function() {
  console.log(this.name + ' barks');
};
```

**ES6 Classes** - синтаксический сахар над прототипами, но с важными отличиями:

```js
// ES6
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(this.name + ' makes a sound');
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // ОБЯЗАТЕЛЬНО перед использованием this
    this.breed = breed;
  }
  bark() {
    console.log(this.name + ' barks');
  }
}
```

> [!important]
> `class` - это сахар, но с критическими отличиями от функций:
> 1. **Hoisting:** class declaration в TDZ - нельзя использовать до объявления (function declaration hoisted с телом)
> 2. **`super()`:** в derived class ОБЯЗАТЕЛЬНО вызвать `super()` до первого обращения к `this`
> 3. **Strict mode:** код внутри class всегда в strict mode
> 4. **`new` обязателен:** `class` нельзя вызвать без `new` (TypeError)

**Private поля (`#`):**真正的 приватные поля, недоступные снаружи:

```js
class Counter {
  #count = 0; // private field

  increment() {
    this.#count++;
  }
  get value() { return this.#count; }
}
```

**Статические методы и блоки:**

```js
class MathUtils {
  static PI = 3.14159; // static field

  static add(a, b) { return a + b; }

  static {
    // static block - выполняется при определении класса
    // можно настроить приватные поля, валидацию
  }
}
```

**`instanceof` поведение:** работает и для class, и для конструкторов, потому что под капотом проверяет цепочку прототипов:

```js
const dog = new Dog('Rex', 'Labrador');
dog instanceof Dog;     // true
dog instanceof Animal;  // true (через prototype chain)
dog instanceof Object;  // true
```

---

### 15. Деструктуризация: значения по умолчанию, вложенная, в параметрах

**Деструктуризация** - синтаксис для извлечения значений из массивов и объектов в переменные.

```js
// Массивы
const [a, b = 2, ...rest] = [1];
console.log(a, b, rest); // 1, 2, []

// Объекты: переименование + default
const { name: userName = 'Guest', age = 18 } = { name: 'Alice' };
console.log(userName, age); // 'Alice', 18

// Вложенная деструктуризация
const { user: { profile: { avatar = 'default.png' } } } = {
  user: { profile: {} },
};
console.log(avatar); // 'default.png'

// В параметрах функции
function draw({ x = 0, y = 0, radius = 10 } = {}) {
  console.log(x, y, radius);
}
draw();            // 0, 0, 10 - дефолт = {} срабатывает
draw({ x: 5 });    // 5, 0, 10
```

> [!important]
> **Разница между `= {}` и отсутствием дефолта:**
> ```js
> function fn({ x } = {}) { }  // fn() - OK, fn(null) - TypeError
> function fn({ x = 1 }) { }   // fn() - TypeError (деструктуризация undefined)
> ```
> Первый вариант безопаснее: при вызове без аргументов срабатывает `= {}`.

**Edge cases:**
- Деструктуризация `null`/`undefined` выбрасывает `TypeError`
- `const { length } = 'hello'` работает - строки имеют свойство `length`
- Можно деструктурировать итераторы: `const [a, b] = new Set([1, 2])`
- Деструктуризация с вычисляемыми свойствами: `const { [key]: val } = obj`

---

### 16. Spread vs Rest операторы

Оба используют синтаксис `...`, но в разных контекстах:

**Spread (`...iterable`)** - «разворачивает» итерируемый объект в отдельные элементы. Используется там, где ожидаются элементы:
- Вызов функции: `fn(...args)`
- Литерал массива: `[...arr, newItem]`
- Литерал объекта (ES2018): `{...obj, newProp: 'val'}`

**Rest (`...identifier`)** - «собирает» оставшиеся элементы в массив. Используется там, где объявляется переменная:
- Параметры функции: `function fn(a, ...rest) {}`
- Деструктуризация массива: `const [first, ...rest] = arr`
- Деструктуризация объекта: `const { a, ...rest } = obj`

```js
// Spread
const numbers = [1, 2, 3];
console.log(Math.max(...numbers)); // Math.max(1, 2, 3)
const copy = [...numbers, 4, 5];   // [1, 2, 3, 4, 5]

// Rest
const [head, ...tail] = [1, 2, 3, 4];
console.log(tail); // [2, 3, 4]

function sum(multiplier, ...nums) {
  return nums.reduce((s, n) => s + n, 0) * multiplier;
}
console.log(sum(2, 1, 2, 3)); // 12
```

> [!important]
> Spread создаёт **поверхностную** копию. Вложенные объекты/массивы сохраняют ту же ссылку. Для глубокого копирования используйте `structuredClone`. Rest-параметр должен быть последним в списке параметров. Spread в литералах объекта копирует **собственные перечислимые** свойства (не копирует свойства прототипа и неперечислимые свойства).

**Производительность:** spread в вызове функции (например, `fn(...args)`) имеет накладные расходы при большом количестве аргументов - каждый элемент передаётся через стек. V8 имеет ограничение на размер стека для spread.

---

### 17. Глубокое клонирование: `structuredClone` vs `JSON.parse(JSON.stringify())`

**`structuredClone(value)`** - встроенная функция для глубокого клонирования объектов, использующая Structured Clone Algorithm (тот же алгоритм, что и `postMessage`).

```js
const original = {
  date: new Date(),
  map: new Map([[1, 'one']]),
  set: new Set([1, 2, 3]),
  regex: /test/gi,
  nested: { buffer: new ArrayBuffer(8) },
};

const clone = structuredClone(original);
console.log(clone.date instanceof Date); // true - тип сохранён
console.log(clone.map instanceof Map);   // true
```

**Что поддерживает `structuredClone` и не поддерживает `JSON`:**

| Тип | JSON | structuredClone |
|-----|------|-----------------|
| Date | ❌ (строка) | ✅ |
| Map, Set | ❌ | ✅ |
| RegExp | ❌ (пустой объект) | ✅ |
| ArrayBuffer, TypedArrays | ❌ | ✅ |
| Blob, File | ❌ | ✅ |
| ImageData, ImageBitmap | ❌ | ✅ |
| Циклические ссылки | ❌ (TypeError) | ✅ |
| Функции | ❌ | ❌ (DataCloneError) |
| Symbol | ❌ | ❌ |
| DOM-узлы | ❌ | ❌ |
| Прототип | ❌ (теряется) | ❌ (теряется) |

```js
// Передача во второй аргумент - transfer list (как postMessage)
const buffer = new ArrayBuffer(1024);
const clone = structuredClone({ data: buffer }, { transfer: [buffer] });
console.log(buffer.byteLength); // 0 - buffer передан, оригинал очищен
```

> [!important]
> `structuredClone` - это то, что нужно использовать по умолчанию для глубокого копирования. Он быстрее `JSON.parse(JSON.stringify())` (не тратит время на сериализацию/парсинг строк), сохраняет больше типов и поддерживает циклические ссылки. Главное ограничение: функции, Symbol и DOM-узлы не клонируются.

**`JSON.parse(JSON.stringify())`** - старый подход, который до сих пор встречается. Его ограничения:
- `Date` превращается в строку
- `Map`, `Set`, `RegExp` теряются
- `undefined`, функции, Symbol - silently удаляются из объектов
- Циклические ссылки - `TypeError`
- `Infinity`, `NaN` - `null`

---

### 18. Map vs Set vs WeakMap vs WeakSet

Четыре коллекции с разными характеристиками:

**Map** - коллекция ключ-значение. Ключом может быть **любой тип** (не только строки). Сохраняет порядок вставки.

**Set** - коллекция уникальных значений. Любые типы. Полезно для удаления дубликатов.

**WeakMap** - как Map, но ключи **только объекты** и ссылки слабые. Если на объект-ключ нет других ссылок, запись удаляется GC.

**WeakSet** - как Set, но значения **только объекты** и ссылки слабые.

```js
// Map
const map = new Map();
map.set('key', 'value');
map.set(42, 'number key');
map.set({ obj: true }, 'object key');
console.log(map.size); // 3

// Set
const set = new Set([1, 2, 2, 3]);
console.log(set.size); // 3 (дубликаты удалены)
console.log([...new Set([1, 1, 2])]); // [1, 2] - удаление дубликатов

// WeakMap
const wm = new WeakMap();
const obj = {};
wm.set(obj, { metadata: 'secret' });
// Когда obj будет удалён, запись в wm тоже исчезнет

// WeakSet
const ws = new WeakSet();
ws.add(obj);
console.log(ws.has(obj)); // true
```

> [!important]
> WeakMap и WeakSet **не перебираемы** (нет `.size`, `.keys()`, `.forEach()`). Это сделано намеренно - состояние GC не должно быть наблюдаемо из JS (принцип прозрачности GC).

**Когда что использовать:**

| Задача | Решение |
|--------|---------|
| Ключи - объекты, автоочистка | WeakMap |
| Отслеживание посещённых объектов | WeakSet |
| Ключи - любые типы, порядок важен | Map |
| Уникальные значения, удаление дубликатов | Set |
| Простой словарь, ключи - строки | `{}` или `Object.create(null)` |

---

### 19. localStorage vs sessionStorage vs cookies

| Характеристика | `localStorage` | `sessionStorage` | Cookies |
|---------------|----------------|------------------|---------|
| Объём | ~5-10 MB | ~5-10 MB | ~4 KB |
| Доступ | Синхронный | Синхронный | Синхронный (`document.cookie`) |
| Тип данных | Строки | Строки | Строки |
| Время жизни | Пока не удалят | До закрытия вкладки | По `Expires`/`Max-Age` |
| Область видимости | Origin | Origin + вкладка | Origin + path |
| Отправляется на сервер | Нет | Нет | Да (каждый запрос) |
| HTTP-only | Нет | Нет | Да (`HttpOnly` флаг) |

```js
// localStorage
localStorage.setItem('token', 'abc123');
const token = localStorage.getItem('token');
localStorage.removeItem('token');

// sessionStorage
sessionStorage.setItem('form-data', JSON.stringify(data));

// Cookies (через document.cookie)
document.cookie = 'session=abc; path=/; Secure; SameSite=Strict';
```

> [!important]
> **localStorage** - синхронный API, который блокирует главный поток. Каждая операция чтения/записи обращается к диску (через кеш ОС). Никогда не используйте `localStorage` для частых операций или больших объёмов данных. Cookies отправляются с каждым HTTP-запросом - не храните в них большие данные.

**Когда что использовать:**
- **localStorage:** токен авторизации, настройки темы, маленькие конфигурационные данные
- **sessionStorage:** временное состояние формы, загруженный файл до отправки
- **Cookies:** сессионные идентификаторы (с `HttpOnly`, `Secure`, `SameSite`), CSRF-токены

---

### 20. Function Declarations vs Expressions + IIFE

**Function Declaration** - полноценное объявление функции с именем. Hoisted целиком (с телом):

```js
hoisted(); // 'Works!' - declaration hoisted с телом
function hoisted() {
  console.log('Works!');
}
```

**Function Expression** - функция как часть выражения. Hoisted только переменная (как `var`), значение `undefined`:

```js
notHoisted(); // TypeError: notHoisted is not a function
const notHoisted = function() {
  console.log('Does not work before');
};
```

**Named Function Expression** - именованная функция в выражении. Имя доступно только внутри функции (для рекурсии):

```js
const factorial = function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1); // fact доступно только внутри
};
// fact is not defined outside
```

**Arrow Functions** - анонимные функции с лексическим `this`:

```js
const add = (a, b) => a + b;
```

> [!important]
> Declaration hoisted с телом, Expression hoisted только как переменная (`undefined`). Arrow functions не имеют своего `this`, `arguments`, `prototype`. Declaration видна во всей области видимости, Expression - только после строки присвоения.

**IIFE (Immediately Invoked Function Expression)** - функция, которая вызывается сразу после создания:

```js
// Почему нужны скобки: function declaration не может быть вызвана сразу
// function() {}() - SyntaxError!

// Решение: обернуть в () - превращает в expression
(function() {
  console.log('IIFE');
})();

// Альтернативные записи:
(function() { console.log('IIFE'); }());
+function() { console.log('IIFE'); }();
!function() { console.log('IIFE'); }();
```

**Современные use-cases IIFE:**
- **Модули до ES6:** изоляция кода от глобальной области видимости
- **Async IIFE:** запуск async кода на верхнем уровне (до top-level await):

```js
(async () => {
  const data = await fetch('/api/data');
  // ...
})();
```

- **Замыкания для сохранения состояния:**

```js
const counter = (function() {
  let count = 0; // приватная переменная
  return {
    increment: () => ++count,
    getCount: () => count,
  };
})();
```

С появлением ES6 модулей и top-level await необходимость в IIFE уменьшилась, но паттерн всё ещё полезен для инкапсуляции.

---

### 21. `"use strict"` - строгий режим

**Strict mode** - ограниченный вариант JavaScript, который меняет семантику для предотвращения ошибок и включения оптимизаций. Включается директивой `"use strict"` в начале файла или функции.

> [!important]
> Код ES6 модуей (`import`/`export`) и классов **всегда** в strict mode, даже без директивы.

**Что меняет strict mode:**

```js
'use strict';

// 1. this = undefined (не глобальный объект)
function fn() { console.log(this); }
fn(); // undefined (в non-strict: window/global)

// 2. Нет неявных глобальных переменных
x = 42; // ReferenceError (в non-strict: создаёт глобальную x)

// 3. Нельзя удалить переменные
let a = 1;
delete a; // SyntaxError

// 4. Нет дубликатов параметров
function sum(a, a) { } // SyntaxError

// 5. Нет with
with (obj) { } // SyntaxError

// 6. eval создаёт свою область видимости
eval('var x = 1');
console.log(x); // ReferenceError (в non-strict: x = 1 в текущей области)

// 7. Нет восьмеричных литералов
var octal = 010; // SyntaxError (в non-strict: 8)

// 8. Зарезервированные слова нельзя использовать как имена
var implements = 1; // SyntaxError
```

**Практические последствия:**

- В strict mode `this` в функциях (не методах) равен `undefined`, а не `window`. Это ломает старый код, который полагался на неявный глобальный объект
- `call`/`apply` с `null`/`undefined` не заменяют `this` на глобальный объект
- `arguments` не aliasится с именованными параметрами:

```js
'use strict';
function fn(a) {
  arguments[0] = 42;
  console.log(a); // 42 в non-strict, оригинальное значение в strict
}
```

**Когда использовать:** всегда. Все современные инструменты (бандлеры, фреймворки) генерируют strict mode код. Если вы пишете на ES6+ модулях - strict mode включён автоматически.

---

### 22. Каррирование vs Частичное применение

**Каррирование (currying)** - трансформация функции от многих аргументов в последовательность функций от одного аргумента: `f(a, b, c) → f(a)(b)(c)`.

**Частичное применение (partial application)** - фиксация части аргументов функции, возврат новой функции, которая принимает оставшиеся аргументы: `f(a, b, c) → f(a).bind(null, b)(c)`.

```js
// Каррирование
const curry = (fn) => {
  const curried = (...args) =>
    args.length >= fn.length
      ? fn(...args)
      : (...more) => curried(...args, ...more);
  return curried;
};

const add = curry((a, b, c) => a + b + c);
console.log(add(1)(2)(3));    // 6
console.log(add(1, 2)(3));    // 6

// Частичное применение
const partial = (fn, ...preset) => (...args) => fn(...preset, ...args);
const addOne = partial((a, b) => a + b, 1);
console.log(addOne(5)); // 6
```

> [!important]
> Разница: каррирование **всегда** создаёт унарные функции и зависит от количества аргументов (`fn.length`). Частичное применение фиксирует конкретные аргументы и не зависит от арности. Каррирование - частный случай частичного применения.

**Практическое применение:** каррирование удобно для создания цепочек трансформаций в функциональном программировании. Частичное применение - для предзаполнения параметров (например, логгер с фиксированным уровнем: `const error = partial(log, 'ERROR')`).

---

### 23. Мемоизация

**Мемоизация** - кеширование результатов функции для предотвращения повторных вычислений при одинаковых аргументах. Это компромисс: память в обмен на процессорное время.

```js
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const fib = memoize((n) => {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
});
console.log(fib(40)); // Мгновенно, без мемоизации - несколько секунд
```

> [!important]
> Проблемы: `JSON.stringify` не сериализует функции, Symbol, undefined, циклические ссылки. Для сложных ключей используйте `Map` с составным ключом. Следите за памятью - для долгоживущих приложений используйте LRU-кеш с ограничением размера.

**Мемоизация в React:** `useMemo` и `useCallback` - это мемоизация для значений и функций соответственно. `React.memo` - мемоизация целого компонента по пропсам (поверхностное сравнение).

**Производительность:** мемоизация имеет накладные расходы на проверку кеша и сериализацию ключей. Она оправдана только для функций с дорогими вычислениями или функций, вызываемых очень часто с одинаковыми аргументами.

---

### 24. Генераторы, итераторы и асинхронные корутины

**Генератор** (`function*`) - функция, которая может приостанавливать и возобновлять своё выполнение, возвращая итератор. Каждый вызов `.next()` возобновляет выполнение до следующего `yield`.

```js
function* gen() {
  const a = yield 1;
  const b = yield a * 2;
  return b;
}
const it = gen();
console.log(it.next());   // { value: 1, done: false }
console.log(it.next(10)); // { value: 20, done: false } - 10 передано в a
console.log(it.next(5));  // { value: 5, done: true } - 5 передано в b
```

**`yield*`** делегирует выполнение другому итератору/генератору. Все вызовы `.next()`, `.throw()`, `.return()` пробрасываются через делегирование:

```js
function* flat(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) yield* flat(item);
    else yield item;
  }
}
```

**Протокол итератора:** объект считается итератором, если у него есть метод `next()`, возвращающий `{ value, done }`. **Протокол итерируемого:** объект является итерируемым, если у него есть метод `[Symbol.iterator]`, возвращающий итератор.

> [!important]
> Генераторы - это одновременно и итерируемые, и итераторы. Это значит, что генератор можно использовать в `for..of`, spread, деструктуризации.

**Генераторы как асинхронные корутины до появления async/await**

До ES2017 именно генераторы использовались для написания плоского асинхронного кода. Идея: генератор через `yield` отдаёт Promise наружу, а внешняя функция-раннер (`spawn`/`co`) дожидается его разрешения и возвращает результат обратно в генератор через `.next(value)`. Генератор приостанавливается на каждом `yield` и возобновляется, когда Promise resolved  -  имитируя синхронное исполнение.

Разберём по шагам на примере двух последовательных fetch-запросов:

```js
function spawn(genFn) {
  const gen = genFn()

  function handle(result) {
    if (result.done) return Promise.resolve(result.value)
    return Promise.resolve(result.value).then(
      res => handle(gen.next(res)),
      err => handle(gen.throw(err)),
    )
  }

  return Promise.resolve().then(() => handle(gen.next()))
}

// Использование  -  выглядит почти как async/await, но это генератор
spawn(function* () {
  const userResponse = yield fetch('/api/user/1')
  const user = yield userResponse.json()
  const postsResponse = yield fetch(`/api/posts?userId=${user.id}`)
  const posts = yield postsResponse.json()
  return posts
}).then(posts => console.log(posts))
```

Что происходит по шагам c первым `fetch('/api/user/1')`:

1. `spawn` вызывает `gen.next()`  -  генератор доходит до первого `yield fetch(...)`, отдаёт Promise наружу и ставится на паузу
2. `spawn` получает `{ value: Promise<Response>, done: false }`
3. `Promise.resolve(result.value)`  -  подписывается на этот Promise (fetch-запрос уходит в сеть, JS на главном потоке свободен!)
4. Когда fetch завершается, `.then(res => handle(gen.next(res)))`  -  `res` (Response объект) передаётся **обратно в генератор** через `gen.next(res)`. Внутри генератора это значение присваивается в `userResponse`
5. Генератор возобновляется, доходит до `yield userResponse.json()`, снова отдаёт Promise наружу
6. Процесс повторяется для `.json()` и следующего fetch

Ключевой механизм: `yield <Promise>` заставляет генератор замереть, а `gen.next(value)`  -  возобновиться с этим значением на месте `yield`. Раннер жонглирует промисами снаружи, генератор внутри пишется как синхронный код.

Именно эту схему реализовала библиотека `co` (TJ Holowaychuk, 2013)  -  десятки миллионов загрузок до того, как `async/await` стал нативным. `async/await` по сути встроил этот паттерн в сам движок, поэтому `spawn` больше не нужен вручную.

> [!important]
> Генераторы не устарели. `redux-saga` использует их до сих пор, потому что `yield` позволяет не только приостанавливать выполнение, но и тестировать сайд-эффекты без моков: тест просто проверяет, что генератор вернул правильную последовательность `yield`-значений, не выполняя их.

Также генераторы  -  основа для управления потоками данных и ленивых вычислений с backpressure (генератор не производит следующее значение, пока потребитель не запросил `.next()`). Используется в `for..of`, spread, деструктуризации.

---

### 25. Иммутабельность: `Object.freeze` vs `Object.seal` vs `Object.preventExtensions`

JS предоставляет три уровня «запечатывания» объектов:

| Метод                           | Добавление свойств | Удаление свойств | Изменение значений | Изменение дескрипторов |
| ------------------------------- | ------------------ | ---------------- | ------------------ | ---------------------- |
| `Object.preventExtensions(obj)` | ❌                  | ✅                | ✅                  | ✅                      |
| `Object.seal(obj)`              | ❌                  | ❌                | ✅                  | ❌                      |
| `Object.freeze(obj)`            | ❌                  | ❌                | ❌                  | ❌                      |

```js
const obj = { x: 1, y: 2 };

Object.preventExtensions(obj);
obj.z = 3;   // Silent fail (или TypeError в strict)
delete obj.x; // OK
obj.x = 10;  // OK

Object.seal(obj);
delete obj.y; // Не работает
obj.x = 10;   // OK

Object.freeze(obj);
obj.x = 10;   // Не работает
obj.y = 20;   // Не работает
```

> [!important]
> **Ключевые ограничения `Object.freeze`:**
> 1. Это **поверхностная** заморозка - вложенные объекты остаются изменяемыми. Для глубокой заморозки нужно рекурсивно обойти все свойства.
> 2. В не-strict режиме операции молча игнорируются, в strict mode - `TypeError`.
> 3. `Object.freeze` не делает объект неизменяемым с точки зрения ссылок - переменная всё ещё может указывать на другой объект.

```js
const frozen = Object.freeze({ inner: { x: 1 } });
frozen.inner.x = 5; // OK! Поверхностная заморозка

function deepFreeze(obj) {
  Object.freeze(obj);
  Object.values(obj).forEach(v => {
    if (typeof v === 'object' && v !== null && !Object.isFrozen(v)) {
      deepFreeze(v);
    }
  });
}
```

**Внутреннее устройство:** методы меняют внутренние флаги объекта: `[[Extensible]]` становится `false`, а `[[Configurable]]` и `[[Writable]]` у свойств - `false`. Проверить можно через `Object.isExtensible()`, `Object.isSealed()`, `Object.isFrozen()`.

**Property Descriptors: `Object.defineProperty` и `Object.defineProperties`**

Каждое свойство объекта имеет не только значение, но и набор флагов-дескрипторов. `Object.defineProperty` позволяет контролировать их явно — это низкоуровневый механизм, на котором построены `freeze`/`seal`/`preventExtensions`.

**Дескрипторы данных (data descriptors):**

| Флаг | По умолчанию | Что делает |
|---|---|---|
| `value` | `undefined` | Значение свойства |
| `writable` | `false` | Можно ли изменить значение через присваивание |
| `enumerable` | `false` | Видно ли свойство в `for...in`, `Object.keys()`, spread |
| `configurable` | `false` | Можно ли удалить свойство или изменить его дескрипторы |

**Дескрипторы доступа (accessor descriptors):** вместо `value`/`writable` используются `get` и `set`.

```js
const user = {}

// Свойство с полным контролем всех флагов
Object.defineProperty(user, 'name', {
  value: 'Alice',
  writable: false,      // нельзя перезаписать
  enumerable: true,     // видно в Object.keys()
  configurable: false,  // нельзя удалить или переопределить дескрипторы
})

user.name = 'Bob'       // ❌ silently ignored (TypeError в strict mode)
delete user.name         // ❌ нельзя удалить

// Геттер/сеттер через defineProperty
Object.defineProperty(user, 'fullName', {
  get() {
    return `${this.firstName} ${this.lastName}`
  },
  set(value) {
    [this.firstName, this.lastName] = value.split(' ')
  },
  enumerable: true,
  configurable: true,
})

user.fullName = 'John Doe'
console.log(user.firstName) // 'John'
```

**Массовое определение: `Object.defineProperties`:**

```js
const product = {}
Object.defineProperties(product, {
  id: {
    value: crypto.randomUUID(),
    writable: false,
    enumerable: true,
    configurable: false,
  },
  price: {
    value: 0,
    writable: true,
    enumerable: false,   // скрыто от Object.keys() и JSON.stringify
    configurable: true,
  },
  priceWithTax: {
    get() { return this.price * 1.2 },
    enumerable: true,
    configurable: false,
  },
})
```

> [!important]
> При создании свойства через литерал `obj.x = 5` или `{ x: 5 }` все флаги (`writable`, `enumerable`, `configurable`) по умолчанию `true`. При создании через `Object.defineProperty` — по умолчанию `false`. Это главный источник багов: забыл явно выставить `writable: true` — свойство стало readonly.

**Как связаны defineProperty и freeze/seal/preventExtensions:**

`Object.preventExtensions(obj)` = устанавливает `[[Extensible]]: false`  
`Object.seal(obj)` = `preventExtensions` + для каждого свойства ставит `configurable: false`  
`Object.freeze(obj)` = `seal` + для каждого свойства ставит `writable: false`

Все три метода используют `Object.defineProperty` внутри себя для изменения дескрипторов существующих свойств. Понимание дескрипторов необходимо, чтобы осознать, почему `freeze` не запрещает изменять вложенные объекты — он меняет `writable` только у непосредственных свойств, а вложенные объекты это ссылки, для которых `writable: false` означает «нельзя переприсвоить ссылку», но содержимое по ссылке менять можно.

**Проверка дескрипторов:** `Object.getOwnPropertyDescriptor(obj, 'prop')` возвращает объект с текущими флагами.

```js
const desc = Object.getOwnPropertyDescriptor(user, 'name')
console.log(desc)
// { value: 'Alice', writable: false, enumerable: true, configurable: false }
```

---

### 26. Паттерны обработки ошибок и кастомные ошибки

**Базовый механизм:**
```js
try {
  const data = JSON.parse(input);
  if (!data.id) throw new Error('Missing ID');
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error('Invalid JSON:', err.message);
  } else {
    throw err; // Перебрасываем неизвестные ошибки
  }
} finally {
  cleanup(); // Выполняется всегда, даже после return/throw в try
}
```

**Кастомные ошибки:**

```js
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    // Восстанавливаем стек-трейс (V8 требует это для подклассов Error)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

// Использование
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new NetworkError('Request failed', response.status);
  }
} catch (err) {
  if (err instanceof NetworkError) {
    showToast(`Server error: ${err.statusCode}`);
  } else if (err instanceof ValidationError) {
    highlightField(err.field);
  }
}
```

> [!important]
> **Паттерн Result/Option** (вместо try/catch везде): возвращайте объект результата вместо выбрасывания исключений. Это делает поток управления явным и типобезопасным (особенно в TypeScript):
> ```js
> function parseJSON(str) {
>   try {
>     return { ok: true, value: JSON.parse(str) };
>   } catch (e) {
>     return { ok: false, error: e };
>   }
> }
> ```

**Правила:**
- Никогда не проглатывайте ошибки (пустой `catch`). Минимум - логируйте.
- Создавайте иерархию кастомных ошибок для разных слоёв приложения.
- `finally` выполняется даже при `return` внутри `try`. Будьте осторожны: `return` в `finally` переопределит `return` из `try`.

---

### 27. Proxy и Reflect

**Proxy** позволяет перехватывать фундаментальные операции над объектами (чтение, запись, перебор, вызов и т.д.). Это метапрограммирование: вы контролируете не значение свойств, а то, как JS взаимодействует с объектом.

```js
const target = { x: 1, y: 2 };
const proxy = new Proxy(target, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    throw new ReferenceError(`Property "${String(prop)}" doesn't exist`);
  },
  set(target, prop, value) {
    if (typeof value !== 'number') {
      throw new TypeError('Value must be a number');
    }
    return Reflect.set(target, prop, value);
  },
});
```

**Reflect** - это объект-одиночка, предоставляющий методы, соответствующие каждой ловушке Proxy. Он делает то же, что и соответствующие операции, но возвращает удобные результаты (например, `Reflect.defineProperty` возвращает `boolean` вместо выбрасывания исключения).

> [!important]
> Всегда используйте `Reflect.*` внутри ловушек Proxy вместо прямого обращения. Это гарантирует корректное поведение с геттерами, сеттерами и цепочкой прототипов (параметр `receiver` - ключевой для правильной работы `this` в аксессорах).

**Ловушки Proxy (все 13):**

| Ловушка | Перехватывает |
|---------|--------------|
| `get` | чтение свойства |
| `set` | запись свойства |
| `has` | оператор `in` |
| `deleteProperty` | `delete obj.prop` |
| `ownKeys` | `Object.keys`, `for..in` |
| `getOwnPropertyDescriptor` | дескриптор свойства |
| `defineProperty` | `Object.defineProperty` |
| `preventExtensions` | `Object.preventExtensions` |
| `isExtensible` | `Object.isExtensible` |
| `getPrototypeOf` | `Object.getPrototypeOf` |
| `setPrototypeOf` | `Object.setPrototypeOf` |
| `apply` | вызов функции |
| `construct` | `new` |

**Use-cases:** реактивность (Vue 3), валидация, логирование, мемоизация, API-обёртки, negative array indices (`arr[-1]`).

---

### 28. Symbols и well-known symbols

**Symbol** - примитивный тип данных, гарантирующий уникальность. Каждый вызов `Symbol('desc')` создаёт уникальное значение, даже если описание одинаковое. Основное назначение - создание уникальных ключей свойств объекта, которые не конфликтуют с другими свойствами.

```js
const id = Symbol('id');
const obj = { [id]: 'secret', id: 'public' };
console.log(obj.id);   // 'public'
console.log(obj[id]);  // 'secret'
// Symbol-ключи не видны в Object.keys() и for..in
console.log(Object.keys(obj));          // ['id']
console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(id)]
```

**Global symbols:** `Symbol.for('key')` возвращает один и тот же символ в рамках всего приложения (реестр глобальных символов). `Symbol.keyFor(sym)` получает ключ из реестра.

**Well-known symbols** - это предопределённые символы, которые управляют поведением объектов в JS:

| Symbol | Назначение |
|--------|-----------|
| `Symbol.iterator` | Делает объект итерируемым (`for..of`) |
| `Symbol.asyncIterator` | Асинхронный итератор (`for await..of`) |
| `Symbol.toStringTag` | Кастомизация `Object.prototype.toString()` |
| `Symbol.toPrimitive` | Преобразование объекта в примитив |
| `Symbol.hasInstance` | Поведение `instanceof` |
| `Symbol.species` | Конструктор для производных объектов |
| `Symbol.match/replace/search/split` | Кастомное поведение в `String.prototype.*` |

> [!important]
> Well-known symbols позволяют вашим объектам встраиваться в стандартные протоколы JS. Например, реализовав `[Symbol.iterator]`, ваш объект будет работать с `for..of`, spread, `Array.from()`.

```js
const range = {
  from: 1, to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { done: true };
      },
    };
  },
};
console.log([...range]); // [1, 2, 3, 4, 5]
```

---

### 29. ESM vs CommonJS и tree-shaking

**CommonJS (CJS):** используется в Node.js (до недавнего времени - стандарт по умолчанию).
- Синхронная загрузка: `const mod = require('./mod')`
- Экспорт через `module.exports`
- Динамический: `require` можно вызывать в любом месте, условно
- Значения экспорта копируются (для примитивов) или передаются по ссылке (объекты)
- Нет tree-shaking (статический анализ затруднён)

**ES Modules (ESM):** стандарт ECMAScript.
- Декларативный импорт: `import { foo } from './mod.js'`
- Асинхронная загрузка (в браузере - фаза fetch + фаза evaluation)
- Статический: импорты анализируются до выполнения кода
- **Live bindings**: импортированная переменная - это живая ссылка на экспорт, она отражает изменения
- Поддерживает tree-shaking

```js
// ESM - live bindings
// counter.js
export let count = 0;
export function increment() { count++; }

// main.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1 - живая связь!
```

> [!important]
> **Tree-shaking** - удаление неиспользуемого кода из финального бандла - возможен только с ESM. Причина: ESM имеет статическую структуру - импорты и экспорты известны до выполнения, их нельзя обернуть в `if/else`. Бандлеры (Webpack, Rollup) анализируют граф зависимостей и исключают неиспользуемые экспорты.

**Node.js и ESM:** с Node 12+ ESM поддерживается через флаг `"type": "module"` в `package.json` или расширение `.mjs`. Взаимодействие CJS и ESM асимметрично: ESM может импортировать CJS (через default import), но CJS не может `require()` ESM напрямую (только через динамический `import()`).

---

### 30. Optional Chaining (`?.`) и Nullish Coalescing (`??`)

**Optional Chaining (`?.`)** - безопасный доступ к вложенным свойствам. Если левая часть `null` или `undefined`, выражение возвращает `undefined` вместо выбрасывания `TypeError`.

```js
const street = user?.address?.street;
// Без ?.:
// const street = user && user.address && user.address.street;

// Работает для:
obj?.prop       // свойства
obj?.[expr]     // вычисляемые свойства
arr?.[index]    // индексы массива
fn?.()          // вызов функции (если fn - null/undefined, возвращает undefined)
```

**Nullish Coalescing (`??`)** - возвращает правый операнд, только если левый равен `null` или `undefined` (в отличие от `||`, который срабатывает на любое falsy-значение: `0`, `''`, `false`, `NaN`).

```js
const count = 0;
console.log(count || 10);  // 10 - 0 это falsy!
console.log(count ?? 10);  // 0 - 0 не null и не undefined

// Часто используется с ?.
const theme = user?.settings?.theme ?? 'light';
```

> [!important]
> `||` проверяет на **falsy**, `??` проверяет на **nullish** (`null`/`undefined`). Это ключевое отличие. Используйте `??` для дефолтных значений, когда `0`, `''`, `false` - валидные значения. Не используйте `??` вместе с `||` без скобок - это синтаксическая ошибка (приоритет неоднозначен).

**Производительность:** `?.` не создаёт дополнительных функций или объектов. Движок обрабатывает его как серию условных переходов на уровне байткода - практически без оверхеда по сравнению с ручной проверкой.

---

### 31. Tagged Template Literals

**Tagged templates** - это вызов функции, где шаблонная строка разбирается на части: массив строковых фрагментов и подставленные значения.

```js
function tag(strings, ...values) {
  console.log(strings); // ['Hello, ', '! You have ', ' messages.']
  console.log(values);  // ['Alice', 5]
  return strings.reduce((result, str, i) =>
    result + str + (values[i] ?? ''), '');
}

const name = 'Alice';
const count = 5;
const result = tag`Hello, ${name}! You have ${count} messages.`;
// strings всегда на 1 длиннее, чем values
```

**Практические применения:**

1. **SQL-экранирование (предотвращение инъекций):**
```js
function sql(strings, ...values) {
  const escaped = values.map(v => {
    if (typeof v === 'string') return "'" + v.replace(/'/g, "''") + "'";
    return v;
  });
  return strings.reduce((q, s, i) => q + s + (escaped[i - 1] ?? ''), '');
}
const q = sql`SELECT * FROM users WHERE name = ${userInput}`;
```

2. **i18n:**
```js
console.log(i18n`Hello, ${name}`); // зависит от локали
```

3. **Styled Components (CSS-in-JS):**
```js
const Button = styled.button`
  color: ${props => props.primary ? 'blue' : 'gray'};
  font-size: 1em;
`;
```

> [!important]
> `String.raw` - это встроенный tag function, который возвращает «сырую» строку, не обрабатывая escape-последовательности. Полезно для регулярных выражений и путей Windows: `String.raw`C:\Users\name`` → `C:\Users\name`.

---

### 32. Web Workers: Dedicated, Shared и postMessage

**Web Workers** позволяют выполнять код в фоновых потоках, не блокируя главный поток. Они не имеют доступа к DOM, но имеют доступ к `fetch`, `IndexedDB`, `WebSocket`.

**Dedicated Worker:** один поток, доступный только создавшему его скрипту.

```js
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ type: 'HEAVY_CALC', data: largeArray });
worker.onmessage = (e) => {
  console.log('Result:', e.data);
};
worker.onerror = (e) => {
  console.error('Worker error:', e.message);
};
worker.terminate(); // Принудительное завершение

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data.data);
  self.postMessage(result);
};
```

**Shared Worker:** один поток, доступный нескольким скриптам (окнам, вкладкам, iframe на одном origin):

```js
// main.js
const worker = new SharedWorker('shared-worker.js');
worker.port.start(); // Обязательно для SharedWorker
worker.port.postMessage('Hello');
worker.port.onmessage = (e) => console.log(e.data);

// shared-worker.js
const connections = new Set();
self.onconnect = (e) => {
  const port = e.ports[0];
  connections.add(port);
  port.onmessage = (msg) => {
    connections.forEach(c => c.postMessage(msg.data)); // Broadcast
  };
  port.start();
};
```

> [!important]
> **postMessage и Structured Clone Algorithm:** данные передаются не по ссылке, а копируются (structured clone). Это значит, что передача большого объёма данных может быть дорогой. **Transferable objects** (`ArrayBuffer`, `MessagePort`) могут быть переданы без копирования - право владения переходит к получателю:
> ```js
> worker.postMessage(buffer, [buffer]); // buffer становится недоступен в main.js
> ```

---

### 33. Жизненный цикл Service Worker

**Service Worker** - это прокси-слой между веб-приложением и сетью. Работает в отдельном потоке, перехватывает сетевые запросы и управляет кешированием. Является основой для Progressive Web Apps (PWA).

**Жизненный цикл:**

```
Регистрация → Установка (install) → Ожидание (waiting) → Активация (activate) → Работа (fetch, message)
```

1. **Register:** `navigator.serviceWorker.register('/sw.js')`
2. **Install:** событие `install`. Кешируем статические ресурсы. `event.waitUntil()` продлевает установку до завершения промиса.
3. **Waiting:** SW установлен, но старый SW ещё активен. Новый ждёт, пока закроются все вкладки со старым SW. `self.skipWaiting()` форсирует немедленную активацию.
4. **Activate:** событие `activate`. Чистим старые кеши. `self.clients.claim()` позволяет SW контролировать все открытые вкладки сразу.
5. **Idle/Terminated:** SW может быть остановлен браузером, когда не используется, и перезапущен при событии.

```js
// sw.js
const CACHE_NAME = 'v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/', '/styles.css', '/app.js'])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        // Cache then network (stale-while-revalidate)
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
    )
  );
});
```

> [!important]
> Service Worker работает только на **HTTPS** (кроме localhost). Он имеет ограниченное время жизни (не более 30 секунд на обработку события), после чего браузер может его принудительно завершить. Поэтому вся долгая работа должна делаться асинхронно.

**Стратегии кеширования:**
- **Cache First:** вернуть из кеша, если нет - fetch. Для статики.
- **Network First:** попробовать fetch, если нет - кеш. Для свежих данных.
- **Stale-While-Revalidate:** вернуть из кеша, параллельно обновить кеш. Баланс скорости и свежести.

---

### 34. AbortController, XMLHttpRequest и сравнение с fetch

**AbortController** позволяет отменять асинхронные операции - fetch-запросы, таймеры, стримы, EventListener'ы.

```js
const controller = new AbortController();
const { signal } = controller;

// Отменяемый fetch
fetch('/api/large-data', { signal })
  .then(res => res.json())
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Request was cancelled');
    }
  });

// Отмена через 5 секунд (таймаут)
setTimeout(() => controller.abort(), 5000);

// Интеграция с любым асинхронным кодом
function doWork(signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);

    const onAbort = () => {
      reject(signal.reason);
      cleanup();
    };
    signal.addEventListener('abort', onAbort, { once: true });

    // ... асинхронная работа
  });
}
```

**Передача signal в несколько операций:**

```js
const controller = new AbortController();

// Одна отмена для нескольких запросов
Promise.all([
  fetch('/api/users', { signal: controller.signal }),
  fetch('/api/posts', { signal: controller.signal }),
]).catch(e => {
  if (e.name === 'AbortError') { /* все отменены */ }
});

controller.abort();
```

> [!important]
> `AbortSignal` имеет метод `abort()` (статический) для создания предотменённого сигнала: `AbortSignal.abort()`. И `AbortSignal.timeout(ms)` - создаёт сигнал с автоматической отменой через N миллисекунд. Это позволяет писать: `fetch(url, { signal: AbortSignal.timeout(5000) })`.

**XMLHttpRequest  -  когда стоит предпочесть fetch**

`fetch` не умеет отслеживать прогресс загрузки файла на сервер (upload progress). `XMLHttpRequest` умеет  -  это его главное преимущество в 2025 году. Так же XHR даёт доступ к событиям на каждом этапе запроса (`readyState`), что полезно для детальной диагностики.

Сравнение XHR vs fetch:

| Возможность | XHR | fetch |
|---|---|---|
| Upload progress | `xhr.upload.onprogress` | ❌ нет (даже в 2025) |
| Download progress | `xhr.onprogress` | ❌ через ReadableStream + response.body.getReader() |
| Abort | `xhr.abort()` | AbortController + signal |
| Timeout | `xhr.timeout = ms` | `AbortSignal.timeout(ms)` |
| Credentials | `withCredentials = true` | `credentials: 'include'` |
| Service Worker | Нет (не перехватывается) | Да |

> [!important]
> XHR не перехватывается Service Worker-ом  -  `fetch`-событие срабатывает только для `fetch()` и нативных запросов страницы. Если вам нужно, чтобы запрос обрабатывался Service Worker-ом (кеширование, офлайн), используйте `fetch`.

Практическое правило:

- **XHR**  -  когда нужен upload progress (загрузка файлов с прогресс-баром), или если запросы не должны проходить через Service Worker
- **fetch**  -  во всех остальных случаях: проще, на Promise, перехватывается Service Worker-ом, имеет стриминг ответа

---

### 35. Утечки памяти: причины, обнаружение и GC deep dive

**Основные причины утечек:**

1. **Глобальные переменные и забытые объявления:**

```js
function leak() {
  bar = 'leaked'; // Без let/const/var - глобальная переменная
}
```

2. **Забытые таймеры и колбэки:**

```js
const data = hugeArray;
setInterval(() => {
  process(data); // data никогда не освободится
}, 1000);
// Решение: clearInterval(id) при размонтировании компонента
```

3. **Оторванные DOM-узлы (Detached DOM):**

```js
let element = document.getElementById('button');
document.body.removeChild(element);
// element всё ещё в памяти через переменную, хотя узел удалён из DOM
element = null; // Решение
```

4. **Замыкания, удерживающие большие объекты:**

```js
function outer() {
  const huge = new Array(1e7);
  return () => huge[0]; // Замыкание держит весь huge
}
```

5. **Неочищенные EventListener'ы:**

```js
element.addEventListener('click', handler);
// Если element удалён из DOM, но на listener есть ссылка извне - утечка
// Решение: element.removeEventListener('click', handler)
// Или: addEventListener(..., { once: true }) / { signal: abortController.signal }
```

6. **Некорректное использование Map/Set/WeakRef:** если ключи в Map - объекты, они не собираются GC, пока запись существует.

> [!important]
> **Обнаружение утечек (Chrome DevTools):**
> 1. **Memory panel → Heap Snapshot:** снимите snapshot до и после подозрительной операции. Сравните снапшоты - найдите объекты, количество которых неоправданно растёт.
> 2. **Allocation instrumentation on timeline:** записывает все аллокации во времени. Видно, какие функции создают больше всего объектов.
> 3. **Allocation sampling:** профилирование с меньшим оверхедом, показывает, где выделяется память.
> 4. **Performance monitor:** показывает реальное потребление JS heap в реальном времени.

**Сборка мусора и утечки:**

JavaScript использует поколенческий (generational) Mark-and-Sweep. Память делится на Young generation (новые объекты, быстрый Scavenger) и Old generation (долгоживущие объекты, полный Mark-Sweep-Compact).

Утечки происходят, когда объекты остаются достижимыми от корней (глобальный объект, стек вызовов, замыкания), но больше не нужны приложению. GC не может их удалить, потому что они технически «живые».

**Правила предотвращения:**

- Всегда очищайте таймеры и слушатели при размонтировании
- Используйте WeakMap/WeakSet для метаданных объектов
- Избегайте замыканий над большими структурами
- `AbortController` для отмены асинхронных операций

---

### 36. `requestAnimationFrame` vs `requestIdleCallback`

**`requestAnimationFrame` (rAF)** - планирует выполнение колбэка перед следующим рендерингом (repaint) браузера. Частота: обычно 60 fps (~16.7ms на кадр), синхронизирована с частотой обновления экрана.

```js
function animate() {
  updatePositions();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

**`requestIdleCallback` (rIC)** - планирует выполнение колбэка, когда браузер простаивает (после рендеринга, когда нет других задач). Не гарантирует время выполнения.

```js
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    process(tasks.shift());
  }
  if (tasks.length > 0) {
    requestIdleCallback(/* ... */); // Продолжаем позже
  }
}, { timeout: 2000 }); // Гарантирует вызов не позже чем через 2с
```

> [!important]
> **rAF** - для всего, что связано с анимацией и визуальными обновлениями. Браузер оптимизирует: группирует rAF-колбэки, приостанавливает их на неактивных вкладках. **rIC** - для низкоприоритетной работы: префетчинг, аналитика, предзагрузка данных. Не используйте rIC для критического пути рендеринга.

**Ключевые различия:**
- rAF получает `DOMHighResTimeStamp`, rIC получает `IdleDeadline` с методом `timeRemaining()`
- rAF гарантированно выполняется каждый кадр (если нет блокировок), rIC может не выполниться вообще
- rAF - обязателен для анимаций (альтернатива: `setTimeout(0)` дёргается и не синхронизирован с рендерингом)
- rIC не поддерживается в Safari (только Chrome)

---

### 37. IntersectionObserver, MutationObserver, ResizeObserver

Три наблюдателя, которые заменяют неэффективные решения на основе `scroll`/`resize` событий:

**IntersectionObserver** - отслеживает пересечение элемента с viewport или другим элементом:

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target); // Lazy loading
      observer.unobserve(entry.target); // Отписываемся после загрузки
    }
  });
}, { rootMargin: '200px', threshold: 0.1 });

document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
```

**MutationObserver** - отслеживает изменения в DOM-дереве:

```js
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        initTooltips(node);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  // attributes: true, characterData: true - если нужно отслеживать и это
});
```

**ResizeObserver** - отслеживает изменения размеров элемента:

```js
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    updateChart(entry.target, width, height);
  }
});

observer.observe(document.querySelector('.chart-container'));
```

> [!important]
> **Отличие от событий:** `IntersectionObserver` работает асинхронно и не нагружает главный поток (в отличие от `scroll` с `getBoundingClientRect()`). `ResizeObserver` ловит изменения размера любых элементов (не только window). `MutationObserver` - единственный надёжный способ отследить вставку элементов сторонними скриптами.

**Производительность:** все три наблюдателя выполняют колбэки **микрозадачами** или в конце кадра, а не синхронно. Это предотвращает каскадные изменения DOM и обеспечивает batch-обработку мутаций.

---

### 38. Профилирование производительности: Performance API, User Timing

**Performance API** предоставляет высокоточные временные метки (с точностью до микросекунд) для измерения производительности.

**`performance.now()`** - возвращает `DOMHighResTimeStamp` (миллисекунды с дробной частью, монотонные часы - не подвержены изменению системного времени):

```js
const start = performance.now();
heavyComputation();
const end = performance.now();
console.log(`Took ${end - start}ms`);
```

**User Timing API (`performance.mark` / `performance.measure`):**

```js
performance.mark('start-task');

// ... выполняем задачу ...

performance.mark('end-task');
performance.measure('task-duration', 'start-task', 'end-task');

const measure = performance.getEntriesByName('task-duration')[0];
console.log(`Duration: ${measure.duration}ms`);

// Очистка
performance.clearMarks('start-task');
performance.clearMarks('end-task');
performance.clearMeasures('task-duration');
```

**Performance Observer - слушаем метрики:**

```js
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
observer.observe({ entryTypes: ['measure', 'resource', 'navigation'] });
```

**Core Web Vitals:**
- **LCP (Largest Contentful Paint):** время загрузки самого большого элемента
- **FID (First Input Delay):** задержка до первого взаимодействия
- **CLS (Cumulative Layout Shift):** стабильность вёрстки
- **INP (Interaction to Next Paint):** отзывчивость на взаимодействия (заменяет FID)

> [!important]
> **Performance API vs `Date.now()`:** `performance.now()` монотонно и имеет высокое разрешение. `Date.now()` зависит от системных часов и имеет миллисекундное разрешение. Всегда используйте `performance.now()` для бенчмаркинга.

```js
// Измерение времени загрузки страницы
const [navigation] = performance.getEntriesByType('navigation');
console.log(`DOM ready: ${navigation.domContentLoadedEventEnd}ms`);
console.log(`Page load: ${navigation.loadEventEnd}ms`);
```

---

### 39. IndexedDB: схема, транзакции, курсоры, сравнение с localStorage

**IndexedDB** - асинхронная NoSQL база данных в браузере. Поддерживает транзакции, индексы, курсоры и хранение любых типов данных (через structured clone).

```js
// Открытие/создание БД
const request = indexedDB.open('myDB', 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  // ObjectStore - аналог таблицы
  const store = db.createObjectStore('users', { keyPath: 'id' });
  // Индексы для поиска
  store.createIndex('email', 'email', { unique: true });
  store.createIndex('name', 'name', { unique: false });
};

request.onsuccess = (event) => {
  const db = event.target.result;
  // Транзакция (только чтение)
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');

  // Получение по ключу
  const userRequest = store.get(1);
  userRequest.onsuccess = () => console.log(userRequest.result);

  // Поиск по индексу
  const emailIndex = store.index('email');
  const emailRequest = emailIndex.get('alice@example.com');
};
```

**Транзакции:** IndexedDB использует ACID-транзакции. Каждая операция должна быть в транзакции. Транзакции автоматически коммитятся при завершении всех запросов.

```js
// readwrite транзакция
const tx = db.transaction('users', 'readwrite');
const store = tx.objectStore('users');

store.put({ id: 1, name: 'Alice', email: 'alice@example.com' });
store.delete(2);

tx.oncomplete = () => console.log('Transaction committed');
tx.onerror = (e) => console.error('Transaction failed', e);
```

**Курсоры** - итерация по записям:

```js
const tx = db.transaction('users', 'readonly');
const store = tx.objectStore('users');
const cursorRequest = store.openCursor();

cursorRequest.onsuccess = (event) => {
  const cursor = event.target.result;
  if (cursor) {
    console.log(cursor.value);
    cursor.continue(); // следующая запись
  }
};
```

**Сравнение с localStorage:**

| Характеристика | localStorage | IndexedDB |
|---------------|--------------|-----------|
| Объём | ~5-10 MB | Гигабайты (зависит от диска) |
| Доступ | Синхронный (блокирует поток) | Асинхронный (не блокирует) |
| Типы данных | Только строки | Любые (structured clone) |
| Индексы | Нет | Да (составные) |
| Транзакции | Нет | ACID |
| Сложность | Простой API | Сложный, нужен wrapper |

> [!important]
> **localStorage** блокирует главный поток при каждой операции. **IndexedDB** - асинхронный и не блокирует. Для серьёзных данных (оффлайн-кеш, PWA, большие объёмы) всегда используйте IndexedDB. Для простого хранения настроек/токенов - localStorage.

---

### 40. V8 internals: JIT (Ignition/TurboFan) + Hidden Classes

**JIT-компиляция в V8** комбинирует интерпретатор и оптимизирующий компилятор.

**Этапы выполнения JS в V8:**

1. **Парсинг:** исходный код → AST (Abstract Syntax Tree)
2. **Ignition (интерпретатор):** AST → байткод. Ignition выполняет байткод и параллельно собирает **профилировочную информацию** (type feedback): какие типы реально приходят в переменные, какие ветки выполняются чаще.
3. **TurboFan (оптимизирующий компилятор):** когда функция становится «горячей» (вызывается много раз), TurboFan компилирует её байткод в нативный машинный код, используя собранную информацию о типах.

```js
function add(a, b) {
  return a + b;
}
// Первые вызовы - Ignition (байткод)
add(1, 2);     // type feedback: a=Number, b=Number
add(3, 4);     // функция становится "горячей"
// TurboFan оптимизирует, предполагая что a и b - числа
add(5, 6);     // выполняется как нативный код
```

> [!important]
> **Деоптимизация:** если предположения TurboFan нарушаются (например, в оптимизированную функцию передают строку вместо числа), происходит деоптимизация - нативный код выбрасывается, выполнение возвращается к Ignition. Это дорого. Именно поэтому стабильность типов критична для производительности JS.

**Sparkplug:** появился в V8 v9.1 - промежуточный компилятор между Ignition и TurboFan. Быстро компилирует байткод в нативный код без сложных оптимизаций. Позволяет быстрее достигать приемлемой производительности, пока TurboFan делает глубокую оптимизацию.

**Скрытые классы (Hidden Classes / Shapes):**

JavaScript - язык с динамической типизацией, но V8 оптимизирует доступ к свойствам объектов через механизм **скрытых классов**.

- Каждому объекту назначается скрытый класс (Map), который описывает структуру свойств и их смещения в памяти.
- Объекты с одинаковой структурой свойств (добавленных в одном порядке) разделяют один скрытый класс.
- Когда свойство добавляется, создаётся **transition tree** - новый скрытый класс, наследующий от предыдущего.

```js
function Point(x, y) {
  this.x = x;  // Map M0 → M1 (добавили x)
  this.y = y;  // Map M1 → M2 (добавили y)
}
const p1 = new Point(1, 2); // Map = M2
const p2 = new Point(3, 4); // Map = M2 - тот же скрытый класс!

// Ломаем оптимизацию:
p1.z = 5; // Новый скрытый класс M3 (p2 остаётся на M2)
```

> [!important]
> **Правила для сохранения скрытых классов:**
> 1. Инициализируйте все свойства в конструкторе
> 2. Добавляйте свойства всегда в одном порядке
> 3. Не удаляйте свойства (оператор `delete`) - это создаёт переход к slow-mode объекту (словарю)
> 4. Не добавляйте свойства объектам после создания, если это не предусмотрено

**Inline Caches (IC):** техника, использующая скрытые классы. Когда V8 встречает `obj.x`, он запоминает скрытый класс `obj` и смещение `x`. При следующем обращении к объекту с тем же скрытым классом, доступ идёт напрямую по сохранённому смещению - без поиска в хеш-таблице.

---

### 41. Temporal API vs Date

**Temporal** - новый API для работы с датами и временем (Stage 3, скоро станет стандартом). Решает фундаментальные проблемы `Date`.

**Проблемы `Date`:**
1. Мутабельность: `date.setMonth(1)` меняет исходный объект
2. Парсинг строк зависит от реализации (хоть и специфицирован): `new Date('01-02-2025')` - это 1 февраля или 2 января?
3. Часовые пояса: `Date` всегда в UTC или локальном времени, нет явного IANA timezone
4. Нет типов для «только дата» или «только время»
5. `getMonth()` возвращает 0-11 (WTF)

**Temporal предоставляет раздельные типы:**

```js
// Сравнение
// Date (старый)
const d = new Date(2025, 4, 6); // месяц 4 = май 😕
const tomorrow = new Date(d);
tomorrow.setDate(d.getDate() + 1);

// Temporal (новый)
const today = Temporal.PlainDate.from({ year: 2025, month: 5, day: 6 });
const tomorrow = today.add({ days: 1 }); // Иммутабельно!

const now = Temporal.Now.zonedDateTimeISO(); // Текущее время с часовым поясом
const meeting = Temporal.ZonedDateTime.from({
  year: 2025, month: 5, day: 6,
  hour: 14, timeZone: 'Europe/Moscow',
});
```

**Основные типы Temporal:**

| Тип | Назначение |
|-----|-----------|
| `Temporal.PlainDate` | Только дата (год, месяц, день) |
| `Temporal.PlainTime` | Только время (часы, минуты, секунды) |
| `Temporal.PlainDateTime` | Дата + время без часового пояса |
| `Temporal.PlainYearMonth` | Год + месяц |
| `Temporal.PlainMonthDay` | Месяц + день |
| `Temporal.ZonedDateTime` | Дата + время + IANA timezone |
| `Temporal.Instant` | Точка на временной шкале (как Unix timestamp) |
| `Temporal.Duration` | Продолжительность |
| `Temporal.Now` | Фабрика для текущего времени |

> [!important]
> Все типы Temporal **иммутабельны**. Операции вроде `.add()`, `.subtract()`, `.with()` возвращают новый объект. Это предотвращает целый класс багов, связанных с мутацией дат. Приведение типов между Plain и Zoned требует явного указания часового пояса.

---

### 42. Intl API: даты, числа, сравнение

**Intl API** (ECMAScript Internationalization API) предоставляет локале-зависимые форматирование, сравнение и парсинг. Встроен во все современные движки без дополнительных библиотек.

**`Intl.DateTimeFormat` - форматирование дат:**

```js
const date = new Date('2025-05-06T14:30:00Z');

// Базовое
new Intl.DateTimeFormat('ru-RU').format(date);
// "06.05.2025"

// С опциями
new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'full',
  timeStyle: 'short',
}).format(date);
// "вторник, 6 мая 2025 г. в 14:30"

// Относительное время
new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' }).format(-3, 'day');
// "3 дня назад"
```

**`Intl.NumberFormat` - форматирование чисел и валют:**

```js
// Числа
new Intl.NumberFormat('ru-RU').format(1234567.89);
// "1 234 567,89"

// Валюта
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(42);
// "$42.00"

// Компактная запись
new Intl.NumberFormat('en-US', { notation: 'compact' }).format(1500000);
// "1.5M"

// Проценты, единицы измерения
new Intl.NumberFormat('ru', { style: 'unit', unit: 'kilometer-per-hour' }).format(120);
// "120 км/ч"
```

**`Intl.Collator` - локализованное сравнение строк:**

```js
const collator = new Intl.Collator('ru-RU', { sensitivity: 'base' });
const names = ['Анна', 'Борис', 'Владимир'];
names.sort(collator.compare); // Корректная сортировка для русского
// ['Анна', 'Борис', 'Владимир']
```

> [!important]
> `Intl.Collator` критически важен для сортировки не-ASCII строк. Наивная сортировка `array.sort()` сравнивает по кодам Unicode и даёт неверный результат для многих языков. Например, немецкая `ß` и `ä`, испанская `ñ`, французские диакритики - все требуют `Collator`.

**Дополнительные API:**
- `Intl.ListFormat` - форматирование списков: `['Alice', 'Bob', 'Charlie']` → `"Alice, Bob и Charlie"`
- `Intl.PluralRules` - правила множественного числа (для i18n)
- `Intl.DisplayNames` - локализованные названия языков, стран, валют

---

### 43. Custom Elements + Shadow DOM

**Web Components** - набор стандартов для создания переиспользуемых, инкапсулированных компонентов без фреймворков. Состоят из трёх технологий:

1. **Custom Elements** - собственные HTML-элементы
2. **Shadow DOM** - инкапсулированное DOM-дерево и стили
3. **HTML Templates** - `<template>` и `<slot>`

```js
class UserCard extends HTMLElement {
  static observedAttributes = ['name', 'avatar'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) this.render();
  }

  render() {
    const name = this.getAttribute('name') || 'Anonymous';
    const avatar = this.getAttribute('avatar') || 'default-avatar.png';
    this.shadowRoot.innerHTML = `
      <style>
        .card { border: 1px solid #ccc; padding: 1rem; }
      </style>
      <div class="card">
        <img src="${avatar}" alt="${name}" />
        <span>${name}</span>
      </div>
    `;
  }

  cleanup() {
    // Убираем слушатели, таймеры и т.д.
  }
}

customElements.define('user-card', UserCard);
```

```html
<user-card name="Alice" avatar="/alice.png"></user-card>
```

> [!important]
> **Жизненный цикл Custom Elements:**
> - `constructor()` - создание элемента, вызов `super()`, инициализация (без DOM)
> - `connectedCallback()` - добавление в DOM, настройка слушателей
> - `disconnectedCallback()` - удаление из DOM, очистка ресурсов
> - `attributeChangedCallback(name, oldVal, newVal)` - изменение наблюдаемого атрибута
> - `adoptedCallback()` - перемещение в новый документ

**Shadow DOM vs Light DOM:**

**Light DOM** - обычное DOM-дерево, которое видит пользователь и к которому имеют доступ любые скрипты и стили.

**Shadow DOM** - инкапсулированное поддерево, прикреплённое к элементу через `attachShadow()`. Стили внутри Shadow DOM не влияют на внешний документ, и внешние стили не проникают внутрь (с некоторыми исключениями).

```js
const host = document.createElement('div');
const shadow = host.attachShadow({ mode: 'open' }); // или 'closed'

shadow.innerHTML = `
  <style>
    p { color: red; }
  </style>
  <p>Текст внутри Shadow DOM</p>
  <slot name="header"></slot>
  <slot></slot>
`;
```

> [!important]
> **`mode: 'open'` vs `mode: 'closed'`:**
> - `open`: `element.shadowRoot` доступен из JS (можно инспектировать и менять)
> - `closed`: `element.shadowRoot` возвращает `null`. Shadow DOM недоступен извне.

**`<slot>` - композиция:** слоты позволяют «проецировать» Light DOM ноды в Shadow DOM. Именованные слоты (`<slot name="...">`) принимают элементы с соответствующим атрибутом `slot`. Безымянный слот принимает всё остальное.

**CSS-особенности:**
- `:host` - стилизация самого элемента-хоста изнутри Shadow DOM
- `:host-context(selector)` - стилизация хоста в зависимости от внешних предков
- `::part(name)` - позволяет выборочно стилизовать элементы Shadow DOM снаружи
- `::slotted(selector)` - стилизация элементов, попавших в слот
- Наследуемые CSS-свойства (`color`, `font-*`) проникают через Shadow boundary

**Два типа Custom Elements:**
- **Autonomous custom elements:** наследуют `HTMLElement` (`<user-card>`)
- **Customized built-in elements:** наследуют существующие элементы (`<button is="fancy-button">`), но **Safari не поддерживает** этот тип

---

### 44. Регулярные выражения: lookahead/lookbehind, именованные группы

Современный JS поддерживает продвинутые возможности регулярных выражений:

**Lookahead (опережающая проверка):**
- `(?=pattern)` - positive lookahead (совпадение, если ДАЛEE pattern)
- `(?!pattern)` - negative lookahead (совпадение, если ДАЛEE НЕ pattern)

```js
// Найти число, за которым следует "px"
/\d+(?=px)/.exec('width: 100px')  // ['100']
// Найти число, за которым НЕ следует "px"
/\d+(?!px)/.exec('100em 200px')   // ['100']
```

**Lookbehind (ретроспективная проверка) - ES2018:**
- `(?<=pattern)` - positive lookbehind
- `(?<!pattern)` - negative lookbehind

```js
// Найти число, перед которым "$"
/(?<=\$)\d+/.exec('Price: $42')  // ['42']

// Найти "script", перед которым НЕ "java"
/(?<!java)script/.test('javascript'); // false
/(?<!java)script/.test('typescript');  // true
```

**Именованные группы (Named Capturing Groups) - ES2018:**

```js
const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = regex.exec('2025-05-06');

console.log(match.groups);        // { year: '2025', month: '05', day: '06' }
console.log(match.groups.year);   // '2025'

// Использование в replace
'2025-05-06'.replace(regex, '$<day>/$<month>/$<year>'); // '06/05/2025'
```

> [!important]
> **Ограничение lookbehind:** длина искомого паттерна должна быть фиксированной (нет квантификаторов `+`, `*`). В V8 это ограничение снято с Chrome 76+ для `(?<=)`, но `(?<!)` с переменной длиной может иметь проблемы с производительностью.

**Флаги:**
- `g` - global (все совпадения)
- `i` - case-insensitive
- `m` - multiline (`^` и `$` работают для каждой строки)
- `s` - dotAll (`.` включает `\n`) - ES2018
- `u` - unicode (поддержка суррогатных пар)
- `y` - sticky (поиск с позиции `lastIndex`)
- `d` - indices (позиции совпадений в строке) - ES2022

---

### 45. BigInt: когда использовать и ограничения

**BigInt** - примитивный тип для целых чисел произвольной точности. Литерал: `123n`, преобразование: `BigInt(123)`.

**Проблема Number:** `Number` - это IEEE 754 double (64 бита). Безопасный диапазон целых чисел: `[-(2^53 - 1), 2^53 - 1]` (проверяется `Number.MAX_SAFE_INTEGER` и `Number.MIN_SAFE_INTEGER`). Выход за пределы вызывает потерю точности:

```js
console.log(9007199254740992 === 9007199254740993); // true (WTF!)
console.log(9007199254740992n === 9007199254740993n); // false (BigInt)
```

**Когда использовать BigInt:**
- Финансовые расчёты (хранение в копейках/центах, без округления)
- Криптография (операции с большими простыми числами)
- Уникальные ID (Twitter Snowflake, Discord IDs - > 2^53)
- Точная арифметика для научных расчётов

```js
// Финансы: все в копейках
const price = 100500n; // 1005.00 руб. в копейках
const quantity = 3n;
const total = price * quantity; // 301500n - точно!

// Проблема: Number и BigInt не смешиваются
price + 10; // TypeError: Cannot mix BigInt and other types
price + 10n; // OK
Number(price) + 10; // OK (но теряем точность для больших чисел!)
```

> [!important]
> **Ограничения BigInt:**
> 1. Нельзя смешивать с Number в арифметике (явное преобразование)
> 2. Нет дробной части: `5n / 2n = 2n` (целочисленное деление, дробная часть отбрасывается)
> 3. `Math` методы не работают с BigInt: `Math.max(1n, 2n)` - `TypeError`
> 4. `JSON.stringify` не поддерживает BigInt: `TypeError: Do not know how to serialize a BigInt`
> 5. Не поддерживается в `parseInt()` / `parseFloat()`
> 6. Унарный `+` не работает: `+1n` - `TypeError`

```js
// Сериализация BigInt
BigInt.prototype.toJSON = function() {
  return this.toString();
};
JSON.stringify({ value: 42n }); // '{"value":"42"}'
```

---

### 46. `<script>` async vs defer: загрузка и выполнение

Три способа подключения скриптов, каждый со своим поведением:

**Нормальный `<script>`** (без атрибутов):
- Блокирует парсинг HTML во время загрузки
- Выполняется сразу после загрузки
- Порядок в документе = порядок выполнения

```html
<!-- Парсинг HTML останавливается, пока script.js не загрузится и не выполнится -->
<script src="script.js"></script>
```

**`<script async>`**:
- Загружается параллельно с парсингом HTML
- Выполняется **сразу после загрузки**, не дожидаясь окончания парсинга
- **Порядок выполнения НЕ гарантирован** - какой загрузился первым, тот и выполнился
- Выполняется до `DOMContentLoaded`

```html
<!-- Загружается параллельно, выполнится когда готов - может до, может после другого async -->
<script async src="analytics.js"></script>
<script async src="ads.js"></script>
```

**`<script defer>`**:
- Загружается параллельно с парсингом HTML
- Выполняется **после окончания парсинга**, перед `DOMContentLoaded`
- **Порядок выполнения гарантирован** - в порядке появления в документе
- Идеально для скриптов, которым нужен готовый DOM

```html
<!-- Оба загрузятся параллельно, но выполнятся по порядку после парсинга -->
<script defer src="vendor.js"></script>
<script defer src="app.js"></script>
```

> [!important]
> **Модульные скрипты (`<script type="module">`) по умолчанию ведут себя как `defer`** - загружаются параллельно, выполняются после парсинга, порядок гарантирован. `async` можно добавить к module для отмены порядка.

**Влияние на DOMContentLoaded:**
- Нормальные скрипты: DOMContentLoaded ждёт их выполнения
- `async`: DOMContentLoaded НЕ ждёт (скрипт может выполниться до или после)
- `defer`: DOMContentLoaded ждёт выполнения всех defer-скриптов

**Best practices:**
- **`defer`** - для основного кода приложения (нужен DOM, важен порядок)
- **`async`** - для независимых скриптов (аналитика, реклама, не зависят от DOM и друг от друга)
- **Без атрибутов** - только для inline-скриптов или когда порядок критичен и скрипт маленький

---

### 47. Streams API: ReadableStream, WritableStream, tee

**Streams API** позволяет обрабатывать данные по частям (чанками), не загружая всё в память. Это фундаментальный примитив для эффективной работы с большими объёмами данных.

```js
// Чтение fetch-ответа как потока
const response = await fetch('/large-file');
const reader = response.body.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // value - Uint8Array (чанк данных)
  processChunk(value);
}
```

**Создание ReadableStream (push-based):**

```js
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue('chunk 1');
    controller.enqueue('chunk 2');
    controller.close(); // или controller.error(new Error())
  },
});

const reader = stream.getReader();
console.log(await reader.read()); // { done: false, value: 'chunk 1' }
```

**WritableStream (sink):**

```js
const writable = new WritableStream({
  write(chunk) { console.log('Writing:', chunk); },
  close() { console.log('Done'); },
});

const writer = writable.getWriter();
await writer.write('hello');
await writer.close();
```

**TransformStream (pipe):**

```js
const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk.toUpperCase());
  },
});
// pipe через TransformStream
input.readable.pipeThrough(transform).pipeTo(output.writable);
```

> [!important]
> **Teeing (tee):** `readable.tee()` создаёт две независимые копии ReadableStream. Полезно, когда одни данные нужно отправить в несколько мест (например, отобразить прогресс и сохранить в кеш):
> ```js
> const [stream1, stream2] = response.body.tee();
> updateProgress(stream1); // Отслеживаем прогресс
> saveToCache(stream2);    // Кешируем
> ```

**Backpressure (противодавление):** встроенный механизм - если `writer.write()` возвращает промис, который резолвится, когда потребитель готов принять данные. Это предотвращает переполнение буфера.

---

### 48. Основы WebAssembly

**WebAssembly (Wasm)** - бинарный формат инструкций для стековой виртуальной машины, выполняемый в браузере на близкой к нативной скорости. Это не замена JS, а дополнение для вычислительно-интенсивных задач.

**Основные характеристики:**
- Бинарный формат (.wasm), компилируется из C/C++/Rust/Go/Zig
- Строгая типизация (i32, i64, f32, f64)
- Линейная память (песочница) - непрерывный массив байтов, доступный из Wasm и JS через `ArrayBuffer`
- Не имеет доступа к DOM, Web API - взаимодействие только через импорты/экспорты функций
- Потокобезопасен (может выполняться в Web Workers)

```js
// Загрузка и использование Wasm
const response = await fetch('module.wasm');
const bytes = await response.arrayBuffer();
const { instance } = await WebAssembly.instantiate(bytes, {
  env: {
    // Импортируемые функции (из JS в Wasm)
    log: (ptr, len) => {
      const str = new TextDecoder().decode(
        new Uint8Array(instance.exports.memory.buffer, ptr, len)
      );
      console.log(str);
    },
  },
});

// Вызов экспортируемой функции
const result = instance.exports.calculate(42);
```

> [!important]
> Wasm-модуль работает в той же песочнице, что и JS - доступ к системе ограничен браузером. Производительность близка к нативной благодаря AOT/JIT-компиляции. Основные сценарии: обработка изображений/видео, 3D-рендеринг, криптография, эмуляторы, научные расчёты, игры.

**Ключевые концепции:**

- `WebAssembly.Module` - скомпилированный модуль (код)
- `WebAssembly.Instance` - экземпляр модуля с состоянием (память, таблицы)
- `WebAssembly.Memory` - линейная память, разделяемая между JS и Wasm
- `WebAssembly.Table` - таблица функций
- SIMD-инструкции (128-bit) доступны для параллельной обработки данных

---

### 49. TypedArrays и ArrayBuffers

**ArrayBuffer** - непрерывный блок бинарных данных фиксированной длины в памяти (сырые байты). Не может быть прочитан или изменён напрямую.

**TypedArrays** - «представления» (views) над ArrayBuffer, позволяющие читать и писать типизированные данные:

```js
const buffer = new ArrayBuffer(16); // 16 байт
const int32View = new Int32Array(buffer); // 4 элемента по 4 байта
const uint8View = new Uint8Array(buffer); // 16 элементов по 1 байту

int32View[0] = 42;
console.log(uint8View[0]); // 42 (младший байт первого int32)
```

**Доступные типы:**

| Тип | Размер | Диапазон |
|-----|--------|----------|
| `Int8Array` / `Uint8Array` | 1 байт | -128..127 / 0..255 |
| `Uint8ClampedArray` | 1 байт | 0..255 (с clamping) |
| `Int16Array` / `Uint16Array` | 2 байта | ±32767 / 0..65535 |
| `Int32Array` / `Uint32Array` | 4 байта | ±2^31 / 0..2^32 |
| `BigInt64Array` / `BigUint64Array` | 8 байт | BigInt |
| `Float32Array` | 4 байта | IEEE 754 single |
| `Float64Array` | 8 байт | IEEE 754 double |

> [!important]
> **Endianness:** TypedArrays используют порядок байтов платформы (little-endian на x86/ARM). `DataView` позволяет контролировать endianness: `dataView.getInt32(offset, littleEndian)`.

```js
// DataView - гибкое чтение с контролем endianness
const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);
view.setInt32(0, 0x12345678, true); // little-endian
console.log(view.getUint8(0)); // 0x78 (младший байт первый)
```

**Практическое применение:** работа с бинарными форматами (изображения, видео, protobuf), WebGL, WebAssembly память, криптография (Web Crypto API), высокопроизводительные вычисления.

---

### 50. SharedArrayBuffer и Atomics

**SharedArrayBuffer** - разделяемый между потоками (Web Workers) буфер памяти. В отличие от `postMessage`, данные не копируются - все потоки видят один и тот же блок памяти.

```js
// main.js
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

const worker = new Worker('worker.js');
worker.postMessage(sharedBuffer);

Atomics.store(sharedArray, 0, 0);
Atomics.add(sharedArray, 0, 1); // Атомарный инкремент
```

```js
// worker.js
self.onmessage = (e) => {
  const sharedArray = new Int32Array(e.data);
  Atomics.add(sharedArray, 0, 1); // Без гонки данных
};
```

**Atomics** - глобальный объект с атомарными операциями для SharedArrayBuffer. Гарантирует, что операция выполняется **неделимо** - другой поток не может прочитать или изменить значение во время операции.

| Метод | Описание |
|-------|---------|
| `Atomics.add(array, index, value)` | Атомарное сложение |
| `Atomics.sub(array, index, value)` | Атомарное вычитание |
| `Atomics.and/or/xor` | Атомарные битовые операции |
| `Atomics.compareExchange(array, index, expected, replacement)` | CAS (compare-and-swap) |
| `Atomics.store/load` | Атомарная запись/чтение |
| `Atomics.wait(array, index, value, timeout)` | Блокирующее ожидание |
| `Atomics.notify(array, index, count)` | Уведомление ожидающих |

> [!important]
> **Ограничения безопасности:** после Spectre/Meltdown, `SharedArrayBuffer` доступен только при определённых заголовках: `Cross-Origin-Opener-Policy: same-origin` и `Cross-Origin-Embedder-Policy: require-corp`. Без них `SharedArrayBuffer` будет `undefined`.

**Use-cases:** многопоточные вычисления (без копирования данных), разделяемые структуры данных (кольцевые буферы), синхронизация между вкладками.
