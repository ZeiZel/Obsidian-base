#Patterns #SOLID 

### Введение

Паттерны, принципы, архитектура - это инструменты, которые позволяют разработчикам общаться на одном и том же языке. Определённая архитектура позволяет быстрее въехать разработчику в проект, так как она диктует общие принципы и правила, по которым мы пишем приложение. 
Все эти парадигмы позволяют нам строить системы примерно похоже. Очень многие ошибки начинают сходиться и повторяться, отчего их проще находить и исправлять

Мир без паттернов можно представить так: мы каждый раз выводим формулу для решения определённой задачи, вместо того, чтобы использовать определённый алгоритм решения собственно этой задачи

![](_png/7d5bfac1e4273280288c56b10efe9fe6.png)
![](_png/f7ccbb933ef42a42f5a531cfc0db9383.png)

Однако за нас эти формулы уже вывели и нам не нужно этого делать. Мы просто открываем формулы и используем их для решения задачи

![](_png/882d7a02f0597261c64b6dfb97038a1d.png)

Паттерны помогают нам творить хороший и чистый код

Кодовая база будет считаться хорошей, если она:
1) Масштабируема и в неё легко вносить изменения
2) Легко вникаема другими людьми
3) Имеет простой код

Принципы SOLID:

![](_png/dc59318868e5e14ad08673b6976c67d3.png)

### SRP (Single Resposibility Principle)

> Это принцип, при котором мы назначаем одной сущности (классу, функции) ровно одну задачу 

![](_png/73171173228dc7d1cfadbbec4467ae3f.png)

Представим, что у нас есть система, которая имеет свои данные и она должна уметь сохранять себя, отправлять свои данные, печатать их, логировать и так далее. Если писать всё в одном классе, то дополнять систему в будущем и править её не будет представляться возможным - система станет кашей, которую невозможно будет править и поддерживать, а нововведения от заказчика станут недобавляемы

![](_png/8a4f19e95267905130aae7bddc2c682f.png)

Поэтому нам нужно будет делить модель данных и поведение сущности

![](_png/b3a339327038e0ba4a97da0192791621.png)

И вот самый простой пример: в первом случае, весь функционал пользователя находится в нём самом, а во втором мы вынесли логику в другие классы

![|600](_png/a22304ddf4aa3cee44b1626a04b9a783.png)

![|600](_png/9499147deb39230d997a966cc449454b.png)

Весь код:

```TS
const http = {send: () => ({})};

const generateId = () => Date.now() * Math.random();

class User {
  id: number;
  username: string;
  password: string;

  constructor(username: string, password: string) {
    this.id = generateId();
    this.username = username;
    this.password = password;
  }
}

class UserRepository {
  save(user: User) {
    // сохранение пользователя в бд
  }
}

class UserLogger {
  log(user: User) {
    console.log(user)
  }
}

class UserController {
  send(user: User) {
    return http.send()
  }
}
```

Либо вот пример с `DataFetcher`, который реализует в себе использование большого числа отдельных методов

![|600](_png/0cd612ec51fffc5049af06ae79019f01.png)

В идеальном варианте, стоит сделать отдельный класс, который будет выполнять всю избыточную логику класса

```TS
class HttpClient {
  get(url: string) {}
  post() {}
  put() {}
  delete() {}
}

class UserService {
  client: HttpClient;
  constructor(client) {
      this.client = client;
  }
  getOneUser(id: number) {}
  getAllUsers() {}
}

class RequisitesService {
  createRequisites() {}
  getRequisites() {}
  updateRequisites() {}
}
```

###### Примеры на фронте

Мы имеем компонент, который отвечает за отрисовку формы отправки реквизитов

![](_png/30751c2b617930b17a3c9cd2c2f15af3.png)

Далее в него мы добавляем функционал по отправке реквизитов, обнулению формы и валидации данных.
Пока всё нормально, так как вся вложенная логика относится к одной форме

![](_png/a905fa1baca9aed21d63cffd02e5a360.png)

И далее нам приходит задача обрабатывать одним способом русские реквизиты и иностранные, что требует от нас проверку компонента на разные локали

![](_png/1f3fff79cacceefa6405843db1ed3c14.png)

Для более правильной реализации данной задачи нужно вынести логику функций в отдельные модули

![](_png/f91e4fd9161ef6ef91d2ff4ce47910f5.png)

И уже из этих модулей вызывать нашу форму с подходящими функциями

Такой способ позволит сохранить подход единственной ответственности в приложении

![](_png/f16d96ed50b611a1534bcbfd3cea234a.png)

А сюда мы выносим отдельное создание реквизитов под разные локали

![](_png/384ed4ca95822c0d5d4bd303fde3ec68.png)

Полный код:

```TSX
import React from 'react';

interface RequisitesProps {
  onSave: (obj) => void;
  onReset: () => void;
  title: string;
}
const Requisites = (props: RequisitesProps) => {
  const {
    onSave,
    onReset,
    title,
  } = props;

  return (
    <form>
      <h1>{title}</h1>
      <input type="text" placeholder="ИНН"/>
      <input type="text" placeholder="БИК"/>
      <input type="text" placeholder="НАЗВАНИЕ БАНКА"/>
      <input type="text" placeholder="НОМЕР СЧЕТА"/>
      <button onClick={onReset}>Сбросить форму</button>
      <button onClick={onSave}>Сохранить</button>
    </form>
  );
};

const ForeignRequisites = (props: RequisitesProps) => {
  const validateForeignFORM = () => {
    // правила валидации
  }
  const saveHandler = () => {
    validateForeignFORM()
    props.onSave({})
  }
  return <Requisites onSave={saveHandler} onReset={props.onReset} title={props.title}/>
}

const RussianRequisites = (props: RequisitesProps) => {
  const validateRussianFORM = () => {
    // правила валидации
  }
  const saveHandler = () => {
    validateRussianFORM()
    props.onSave({})
  }
  return <Requisites onSave={saveHandler} onReset={props.onReset} title={props.title}/>
}

const CreateRequisitesForm = ({isForeign}) => {
  const createRequisites = () => {}
  const resetRequisites = () => {}

  if(isForeign) {
    return <ForeignRequisites
      onSave={createRequisites}
      onReset={resetRequisites}
      title={'Сохранение реквизитов'}
    />
  }
  return <RussianRequisites
    onSave={createRequisites}
    onReset={resetRequisites}
    title={'Сохранение реквизитов'}
  />
}

const updateRequisitesForm = ({isForeign}) => {
  const updateRequisites = () => {}
  const resetRequisites = () => {}

  if(isForeign) {
    return <ForeignRequisites
      onSave={updateRequisites}
      onReset={resetRequisites}
      title={'Обновление реквизитов'}
    />
  }
  return <RussianRequisites
    onSave={updateRequisites}
    onReset={resetRequisites}
    title={'Обновление реквизитов'}
  />
}
```

> [!success] Преимущества подхода:
> - Избавление от антипаттерна GodObject
> - Приложение разбивается на отдельные модули (декомпозиция), что приводит к лучшей читабельности
> - Логика выполнения определённых операций инкапсулируется в определённых функциях, что так же упрощает написание тестов
> - Становится легче вносить изменения в проект

### OCP (Opened-Closed Principle)

> Все программные сущности (классы, компоненты, модули, сущности) должны быть открыты для расширения, но закрыты для изменения

Мы должны добавлять новый функционал за счёт добавления новой сущности, которая будет посредством определённой логики связана с другой сущностью

![](_png/4221f54a8c008bd94e946f7e35ea2eeb.png)

###### Первый пример

У нас есть персонаж, который принимает в себя имя и оружие, а так же вызывает функцию из оружия 

![](_png/49340af73a021204c9872e48b88a121a.png)

Само оружие хранит в себе характеристики и атаку 

![](_png/3372af87c4b3d63fb5fcd9defccd5bab.png)

Вывод:

![](_png/bb320904b041bb17d1e9b619dc9318a9.png)

Однако, если мы столкнёмся с тем, что нам нужно будет добавить несколько оружий, то уже придётся городить разные условия

![](_png/64c6d0343fd76c92b9a9e328e498aa99.png)

![](_png/bb9c34f885d26f91bbff5ff30ecda76f.png)

Чтобы вынести логику отдельного метода, можно имплементировать нужные методы через интерфейс

![](_png/564b1085a0b577c7bb9c04916a20f67c.png)

И экстендить исходящие классы оружия от родительского, чтобы наследовать функционал

![](_png/e4b012c4ccd88711cd205d7241d0c49b.png)

![](_png/481bd7647f7eb025e1b22f16e3c87830.png)

Теперь можно удалить выбор типа из конструктора

![](_png/f0770e2505dc9989bfdeeb172ac248ad.png)

И создаём новое оружие через отдельный класс 

![](_png/4eaf79975fd67c5315f636e3779abe68.png)

Полный код:

```TS
interface Attacker {
  attack: () => void;
}
class Weapon implements Attacker {
  damage: number; // 0 - 100;
  range: number; // 0 - 100;

  constructor( damage: number, range: number) {
    this.damage = damage;
    this.range = range;
  }

  attack() {}
}

class Sword extends Weapon {
  attack() {
    console.log('Удар мечом с уроном ' + this.damage)
  }
}

class Crossbow extends Weapon {
  attack() {
    console.log('Выстрел из арбалета с уроном ' + this.damage)
  }
}

class Knife extends Weapon {
  attack() {
    console.log('Удар ножом с уроном ' + this.damage)
  }
}

class Character {
  name: string;
  weapon: Weapon;

  constructor(name: string, weapon: Weapon) {
    this.name = name;
    this.weapon = weapon;
  }

  changeWeapon(newWeapon: Weapon) {
    this.weapon = newWeapon;
  }

  attack() {
    this.weapon.attack();
  }
}

const sword = new Sword(15, 2);
const character = new Character('Warrior', sword);
character.attack()

const crossbow = new Crossbow(40, 100);
character.changeWeapon(crossbow);
character.attack()
```

###### Второй пример

Мы имеем два класса: персонаж и список персонажей

![](_png/711064049cf65a11ceaab4d694366642.png)

![](_png/4e4b0ed4cab9b6505376cd0d26e26007.png)

А так же имеем три типа сортировок списков

![](_png/cdf5ea29d0b64ca65cdc7157bbe7f8b6.png)

Данные методы сортировки мы применяем в разных случаях, чтобы оптимизировать работу кода

![](_png/6082c917aaeac5d0e1a25507a5c1a354.png)

Так же у нас имеется список музыки, который так же сортируется в зависимости от размера массива

Тут мы сталкиваемся с такой проблемой, что мы дублируем код условия

![](_png/b1ed20544a7e9d91a8d97b7e06326b71.png)

Первое, что мы должны сделать, чтобы привести все связанные классы к одному родителю - это создать базовый класс

![](_png/42eb58ebd5e0f0e1df00b734326f70d9.png)

Далее мы создаём клиент, который будет сам определять, какую сортировку от массива применять

![](_png/53361b77b403afe803b85d58f86a3dc2.png)

И теперь сортировку за нас выполняет отдельный клиент, который инкапсулировал в себе логику выполнения

![](_png/a55fac97a5c35c413be9353d7d6b7d0f.png)

Полный код:

```TS
class Sort {
  public static sort(array: any[]): any[] {return []}
}

class BubbleSort extends Sort{
  public static sort(array: any[]): any[] {
    return array;
  }
}

class QuickSort extends Sort {
  public static sort(array: any[]): any[] {
    return array;
  }
}

class MergeSort extends Sort {
  public static sort(array: any[]): any[] {
    return array;
  }
}

class SortClient extends Sort{
  public static sort(array: any[]): any[] {
    if(array.length < 10) {
      return BubbleSort.sort(array);
    } else if (array.length < 1000 ) {
      return MergeSort.sort(array);
    } else {
      return QuickSort.sort(array)
    }
  }
}

class Person {
  fullname: string;

  constructor(fullname: string) {
    this.fullname = fullname;
  }
}

class PersonList {
  persons: Person[]

  constructor(persons: Person[]) {
    this.persons = persons;
  }
  sort() {
    SortClient.sort(this.persons)
  }
}

class Music {}

class MusicList {
  musics: Music[]
  constructor(musics: Music[]) {
    this.musics = musics;
  }

  sort() {
    SortClient.sort(this.musics)
  }
}
```

Либо приведём подобный пример на фронте:

```TSX
import React from "react";

interface RequisitesProps {
  onSave: (obj) => void;
  onReset: () => void;
  title: string;
}
const Requisites = (props: RequisitesProps) => {
  const {
    onSave,
    onReset,
    title,
  } = props;

  return (
    <form>
      <h1>{title}</h1>
      <input type="text" placeholder="ИНН"/>
      <input type="text" placeholder="БИК"/>
      <input type="text" placeholder="НАЗВАНИЕ БАНКА"/>
      <input type="text" placeholder="НОМЕР СЧЕТА"/>
      <button onClick={onReset}>Сбросить форму</button>
      <button onClick={onSave}>Сохранить</button>
    </form>
  );
};

const ForeignRequisites = (props: RequisitesProps) => {

  return (
    <div>
      <input type="text" placeholder="SWIFT"/>
      <input type="text" placeholder="KPP"/>
      <input type="text" placeholder=""/>
      <Requisites
        onSave={}
        onReset={}
        title={}
      />
    </div>
  )
}
```

> [!success] Основные плюсы данного подхода:
>  - Отпадает потребность в регрессионном тестировании (e2e)
>  - Падает вероятность ошибок

### LSP (Liskov Substitution Principle)

> Функции и сущности, которые используют родительский тип должны точно так же работать и с дочерними классами, т.е. наследуемый класс должен дополнять поведение базового класса, а не замещать

Представим такую ситуацию, что у нас имеется базовый класс. Далее мы создаём функцию, которая принимает в себя класс, который подходит по интерфейсу к базовому классу. Если мы заэкстендим другой класс от базового, то у нас **должна остаться возможность** передать его в ту функцию.

![](_png/a33efa7227559a2170a15ab3f7ab0635.png)

Мы имеем базовый класс персонажа. Он умеет есть и думать. Далее идёт разработчик. Он ко всему прочему умеет ещё писать код. Далее несколько базовых классов наследуются от разработчика, но один из этих классов не умеет кодить, что может приводить к ошибкам

![](_png/8df50e231d9324189a1b9c977f1be5fe.png)

Мы имеем базовый класс базы данных, имеющий три базовых операции для всех БД, в который мы так же добавили специфический метод объединения таблиц 

![](_png/13a3cc772037b3310edf22560b7cf50c.png)

Если первая БД нормально заэкстендилась, так как она реляционная 

![](_png/850e7f2aa388a6442786b20c382b000b.png)

То уже вторая база (документоориентированная) не может иметь такой метод объединения таблиц

![](_png/2b7c9affdc3bb1ef7dcdeef76aa7689a.png)

Более правильным вариантом было бы создать от базового класса ещё два разветвлённых класса, которые имеют отношение к разным видам БД 

![](_png/568705086486ce2bc7cb3e0a72d75468.png)

И уже конкретные БД экстендить от обобщённых  

![](_png/45f2523c6e17f9a774783d41dc8abe70.png)

Это позволит нормально работать с разными БД под один базовый тип - `Database`

![](_png/b7375c75da843d334871e5375a07e6a4.png)

Полный код:

```TS
class Database {
  connect() {}
  read() {}
  write() {}
}

class SQLDatabase extends Database {
  connect() {}
  read() {}
  write() {}
  joinTables() {}
}

class NOSQLDatabase extends Database {
  connect() {}
  read() {}
  write() {}
  createIndex() {}
}

class MySQLDatabase extends SQLDatabase {
  connect() {}
  read() {}
  write() {}
  joinTables() {}
}

class MongoDatabase extends NOSQLDatabase {
  connect() {}
  read() {}
  write() {}
  createIndex() {}
  mergeDocuments() {}
}


function startApp(database: Database) {
  database.connect()
}
startApp(new MongoDatabase())
startApp(new MySQLDatabase())
```

Пример использования подхода на фронте:

```TSX
import React from "react";

interface RequisitesProps {
  onSave?: (obj) => void;
  onReset?: () => void;
  title?: string;
}
const Requisites = (props: RequisitesProps) => {
  const {
    onSave,
    onReset,
    title,
  } = props;

  return (
    <form>

        <div>
          <input type="text" placeholder="SWIFT"/>
          <input type="text" placeholder="KPP"/>
          <input type="text" placeholder=""/>
        </div>
      <h1>{title}</h1>
      <input type="text" placeholder="ИНН"/>
      <input type="text" placeholder="БИК"/>
      <input type="text" placeholder="НАЗВАНИЕ БАНКА"/>
      <input type="text" placeholder="НОМЕР СЧЕТА"/>
      <button onClick={onReset}>Сбросить форму</button>
      <button onClick={onSave}>Сохранить</button>
    </form>
  );
};

const ForeignRequisites = () => {

  return (
    <div>
      <input type="text" placeholder="SWIFT"/>
      <input type="text" placeholder="KPP"/>
      <input type="text" placeholder=""/>
      <Requisites
      />
    </div>
  )
}

const PassportData = () => {
  return (
    <div>
      <input type="number" placeholder="Серия паспорта"/>
      <input type="number" placeholder="Номер паспорта"/>
    </div>
  )
}

const FullRequisitesForm = () => {
  return (
    <div>
      <PassportData />
      <Requisites />
    </div>
  )
}

const FullForeignRequisitesForm = () => {
  return (
    <div>
      <PassportData />
      <ForeignRequisites />
    </div>
  )
}
```

### ISP (Interface Segragation Principle)

> Программные сущности не должны зависеть от методов, которые они не используют

Все наши большие интерфейсы нужно разбивать на более мелкие, которые должны решать только одну задачу 

![](_png/dd672fed0a40f4f0d69b70ece8622b0d.png)

Самый простой пример нарушения принципа: мы используем один и тот же интерфейс для нескольких классов, где только один класс использует всю функциональность интерфейса - остальные либо возвращают null, либо выкидывают ошибку при использовании метода
*Такая практика является плохой*

![](_png/7b633995afeb1a1fae38d0eab5446df1.png)



![](_png/24ed16b487ff3313f3d63c70234e0d11.png)



![](_png/aa3855476c66b8d8882d85a13b81762a.png)

Тут мы разбили приложение, которое предоставляет SSR. Конкретно тут реализуется роутинг на сервере и на клиенте. 

Серверный роутер должен принимать подготовитель ссылок и парсер ссылок. На фронте же нужно получить роут и отрендерить его - сам роутер (для навигации) и парсер ссылок

```TS
enum Route {
  ABOUT='about_page',
  HOME='home_page',
}

interface UrlParser {
  parseUrl: (url) => void;
  addQueryParams: (params: Record<string, string>) => void;
}

interface Router {
  navigate: (route: Route) => void;
  attachEventListeners: () => void;
}

interface UrlPreparer {
  prepareUrlForClient: (url: string) => void;
}

class ServerRouter implements UrlParser, UrlPreparer {
  parseUrl(url): void {}
  addQueryParams(params: Record<string, string>): void {}
  prepareUrlForClient(url: string): void {}
}

class ClientRouter implements Router, UrlParser {
  addQueryParams(params: Record<string, string>): void {}
  parseUrl(url): void {}
  attachEventListeners(): void {}
  navigate(route: Route): void {}
}
```

Далее у нас идёт ещё один пример, когда мы отправляем запросы внтури сервера и с клиента на сервер. Интерфейс их запросов похож, однако он может различаться тем, что на фронте нам может потребоваться токен. 
Тут мы отделяем работу с токенами в отдельный интерфейс `TokenStorage` и сам запрос, который находится в `HttpRequest`. Второй интерфейс используется на сервере для запросов.

```TS
interface Router {
  parseUrl: (url) => void;
  addQueryParams: (params: Record<string, string>) => void;
}

interface HttpRequest {
  get: () => void;
  post: () => void;
  put: () => void;
  delete: () => void;
}

interface TokenStorage {
  addToken: () => void;
  getToken: () => void;
}

// Внутри используем axios или http module
class ServerHttp implements HttpRequest {
  delete(): void {}
  get(): void {}
  post(): void {}
  put(): void {}
}

// Внутри используем fetch
class ClientHttp implements HttpRequest, TokenStorage {
  delete(): void {}
  get(): void {}
  post(): void {}
  put(): void {}

  addToken(): void {
    return localStorage.get('token')
  }
  getToken(): void {}
}

const createDependencyContainer = (router: Router, store, httpRequest: HttpRequest) => {
  return {
    getRouter: () => router,
    getStore: () => store,
    getRequest: () => httpRequest,
  }
}
```

> [!success] Основные плюсы данного подхода:
>  - Мы избавляем программные сущности от методов, которые они не используют
>  - Получаем более предсказуемую работу кода
>  - Код становится менее связанным между друг другом

### DIP (Dependency Invertion Principle)

> Модули высокого уровня не должны зависеть от модулей более низкого уровня - все они должны зависеть от абстракций, а абстракции в это время не должны зависеть от деталей, так как детали должны зависеть от абстракций

Самый простой пример для объяснения данного прицнипа:
- на нашем заводе присутствуют работники, станки и электричество
- все они связаны: работник работает за станком, станок работает от электричества
- и тут в станке ломается одна деталь
- после замены детали мы замечаем, что логика работы станка меняется и нам требуются новые рабочие, так же для станка требуется большее напряжение, что требует замены как рабочих рук, так и системы электропитания

*Это явный пример нарушения данного принципа*

![](_png/162c27b400a007fa9a3f26f568be3b58.png)

Чтобы решить проблему со станками можно:
- предоставить работникам пульт, который будет сам регулировать работу станка, что позволит нам менять целые станки
- поставить трансформатор, чтобы контролировать поток электричества к станку

![](_png/16dc5d11a85742f787ab57b22262b7a8.png)

Тут представлена работа сразу с несколькими сервисами. Представленная реализация работы с несколькими клиентами позволяет нам не писать логику работы под один определённый сервис - мы можем начать работать с любым из них. 

```TS
// базовый интерфейс для всех музыкальных сервисов
interface MusicApi {
  getTracks: () => void;
}

// первый музыкальный сервис
class YandexMusicApi implements MusicApi {
  getTracks(): void {}
}

// второй музыкальный сервис
class SpotifyApi implements MusicApi {
  getTracks(): void {}
}

// третий музыкальный сервис
class VKMusicApi implements MusicApi {
  getTracks(): void {}
}

// класс музыкального клиента, который вызвает нужный клиент - это определённая абстракция / звено между АПИ клиента и музыкального сервиса
class MusicClient implements MusicApi {
  client: MusicApi;

  constructor(client: MusicApi) {
    this.client = client;
  }

  getTracks() {
    this.client.getTracks();
  }
}

// входная точка в приложение
const MusicApp = () => {
  // тут мы определяем, с каким клиентом сейчас мы хотим работать 
  const API = new MusicClient(new SpotifyApi())

  API.getTracks()
}
```
