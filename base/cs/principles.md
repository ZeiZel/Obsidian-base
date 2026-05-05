---
tags:
  - cs
  - solid
  - principles
  - yagni
  - kiss
  - dry
  - architecture
---

#Patterns #SOLID #YAGNI #KISS #DRY

# Принципы разработки

Принципы — это инструменты, которые позволяют разработчикам общаться на одном языке и строить системы похожим образом. Они помогают выявлять повторяющиеся ошибки и предотвращать их.

Кодовая база считается хорошей, если она:
1. Масштабируема и легко изменяема
2. Легко читаема другими разработчиками
3. Имеет простой и понятный код

Связанные статьи: [[programming]], [[System Design]]

---

### Введение

Паттерны, принципы, архитектура — инструменты общего языка разработчиков. Единая архитектура ускоряет погружение в проект и диктует общие правила, по которым пишется приложение.

Без принципов: каждый раз выводим формулу заново.  
С принципами: открываем готовое решение и применяем.

---

## SOLID

### SRP — Single Responsibility Principle

> Каждой сущности (классу, функции) — ровно одна ответственность

Если класс отвечает за несколько несвязанных вещей, любое изменение в одной области рискует сломать другую. Класс нужно дополнять через отдельные, узкоспециализированные модули.

**Пример нарушения:**

```typescript
// Один класс делает всё — это GodObject (антипаттерн)
class User {
    id: number;
    username: string;
    password: string;

    constructor(username: string, password: string) {
        this.id = Date.now() * Math.random();
        this.username = username;
        this.password = password;
    }

    save() { /* сохранение в БД */ }
    log() { console.log(this) }
    sendHttp() { /* отправка по HTTP */ }
    printReport() { /* вывод отчёта */ }
}
```

**Правильный вариант:**

```typescript
const generateId = () => Date.now() * Math.random();

// Только данные
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

// Только сохранение
class UserRepository {
    save(user: User) { /* сохранение в БД */ }
}

// Только логирование
class UserLogger {
    log(user: User) { console.log(user) }
}

// Только HTTP
class UserController {
    send(user: User) { return http.send() }
}
```

**Пример на фронте** — компонент Requisites отвечает только за отображение. Логика валидации вынесена в отдельные компоненты-обёртки:

```tsx
import React from 'react';

interface RequisitesProps {
    onSave: (obj) => void;
    onReset: () => void;
    title: string;
}

const Requisites = ({ onSave, onReset, title }: RequisitesProps) => (
	<form>
		<h1>{title}</h1>
		<input type="text" placeholder="ИНН"/>
		<input type="text" placeholder="БИК"/>
		<button onClick={onReset}>Сбросить форму</button>
		<button onClick={onSave}>Сохранить</button>
	</form>
);

const ForeignRequisites = (props: RequisitesProps) => {
    const validateForeignForm = () => { /* правила для иностранных */ }
    const saveHandler = () => {
        validateForeignForm();
        props.onSave({});
    }
    
    return (
	    <Requisites 
		    onSave={saveHandler} 
		    onReset={props.onReset} 
		    title={props.title}
		/>
	);
}

const RussianRequisites = (props: RequisitesProps) => {
    const validateRussianForm = () => { /* правила для российских */ }
    const saveHandler = () => {
        validateRussianForm();
        props.onSave({});
    }
    
    return (
	    <Requisites 
		    onSave={saveHandler} 
		    onReset={props.onReset} 
		    title={props.title}
	    />
	)
}

const CreateRequisitesForm = ({isForeign}) => {
    const createRequisites = () => {}
    const resetRequisites = () => {}

    if (isForeign) {
        return (
	        <ForeignRequisites 
		        onSave={createRequisites} 
		        onReset={resetRequisites} title="Сохранение реквизитов"
	        />
	    )
    }
    
    return (
	    <RussianRequisites 
		    onSave={createRequisites} 
		    onReset={resetRequisites} title="Сохранение реквизитов"
	    />
	)
}
```

> [!success] Преимущества SRP:
> - Устраняет антипаттерн GodObject
> - Декомпозиция → лучшая читаемость
> - Инкапсулированная логика → легче писать тесты
> - Изменения в одной зоне не ломают другие

### OCP — Open/Closed Principle

> Программные сущности должны быть **открыты** для расширения, но **закрыты** для изменения

Новый функционал добавляется через новые сущности, связанные с существующими, без модификации текущего кода.

**Пример нарушения** — добавление нового оружия требует правки класса Character:

```typescript
// Плохо: добавление нового оружия → редактируем Character
class Character {
    attack(weaponType: string) {
        if (weaponType === 'sword') { 
	        console.log('Удар мечом') 
	    }
	    
        else if (weaponType === 'crossbow') { 
	        console.log('Выстрел из арбалета') 
	    }
        // Новое оружие → ещё один if-else...
    }
}
```

**Правильный вариант** — новые виды оружия через наследование, Character не меняется:

```typescript
interface Attacker {
    attack: () => void;
}

class Weapon implements Attacker {
    damage: number;
    range: number;

    constructor(damage: number, range: number) {
        this.damage = damage;
        this.range = range;
    }

    attack() {}
}

class Sword extends Weapon {
    attack() { console.log('Удар мечом с уроном ' + this.damage) }
}

class Crossbow extends Weapon {
    attack() { console.log('Выстрел из арбалета с уроном ' + this.damage) }
}

class Knife extends Weapon {
    attack() { console.log('Удар ножом с уроном ' + this.damage) }
}

// Добавление нового оружия: просто новый класс, Character не трогаем
class MagicWand extends Weapon {
    attack() { console.log('Магический выстрел с уроном ' + this.damage) }
}

class Character {
    name: string;
    weapon: Weapon;

    constructor(name: string, weapon: Weapon) {
        this.name = name;
        this.weapon = weapon;
    }

    changeWeapon(newWeapon: Weapon) { this.weapon = newWeapon; }
    attack() { this.weapon.attack(); }
}

const sword = new Sword(15, 2);
const character = new Character('Warrior', sword);
character.attack();

const crossbow = new Crossbow(40, 100);
character.changeWeapon(crossbow);
character.attack();
```

**Пример с сортировкой:**

```typescript
class Sort {
    public static sort(array: any[]): any[] { return [] }
}

class BubbleSort extends Sort {
    public static sort(array: any[]): any[] { return array; }
}

class QuickSort extends Sort {
    public static sort(array: any[]): any[] { return array; }
}

class MergeSort extends Sort {
    public static sort(array: any[]): any[] { return array; }
}

// SortClient инкапсулирует логику выбора — PersonList и MusicList не меняются
class SortClient extends Sort {
    public static sort(array: any[]): any[] {
        if (array.length < 10) return BubbleSort.sort(array);
        else if (array.length < 1000) return MergeSort.sort(array);
        else return QuickSort.sort(array);
    }
}

class PersonList {
    constructor(public persons: Person[]) {}
    sort() { SortClient.sort(this.persons) }
}

class MusicList {
    constructor(public musics: Music[]) {}
    sort() { SortClient.sort(this.musics) }
}
```

> [!success] Преимущества OCP:
> - Нет нужды в регрессионном тестировании при добавлении функций
> - Снижается вероятность ошибок в существующем коде

### LSP — Liskov Substitution Principle

> Функции, использующие базовый тип, должны одинаково корректно работать с любым дочерним типом. Наследник **дополняет** поведение, но не **замещает** несовместимым образом.

Нарушение LSP: дочерний класс не может выполнить контракт родителя.

**Пример нарушения** — MongoDB не умеет joinTables, но наследует Database:

```typescript
// Плохо: NOSQLDatabase наследует joinTables из Database,
// но не может его реализовать
class Database {
    connect() {}
    read() {}
    write() {}
    joinTables() {} // ← специфично для SQL!
}

class MongoDatabase extends Database {
    joinTables() {
        throw new Error("MongoDB не поддерживает JOIN"); // LSP нарушен
    }
}
```

**Правильный вариант** — разделить иерархию:

```typescript
class Database {
    connect() {}
    read() {}
    write() {}
}

class SQLDatabase extends Database {
    connect() {}
    read() {}
    write() {}
    joinTables() {}  // только для SQL
}

class NOSQLDatabase extends Database {
    connect() {}
    read() {}
    write() {}
    createIndex() {} // только для NoSQL
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

// Принимает Database — работает с любым наследником
function startApp(database: Database) {
    database.connect();
}

startApp(new MongoDatabase());  // ✓
startApp(new MySQLDatabase());  // ✓
```

### ISP — Interface Segregation Principle

> Программные сущности не должны зависеть от методов, которые они не используют

Большие интерфейсы нужно разбивать на мелкие, специализированные.

**Пример нарушения** — один большой интерфейс для разных классов:

```typescript
// Плохо: один интерфейс содержит всё
interface IEverything {
    parseUrl: (url) => void;
    addQueryParams: (params: Record<string, string>) => void;
    navigate: (route: string) => void;
    attachEventListeners: () => void;
    prepareUrlForClient: (url: string) => void;
}

// ServerRouter вынужден реализовывать navigate и attachEventListeners,
// которые ему не нужны
class ServerRouter implements IEverything { ... }
```

**Правильный вариант** — разделить на узкие интерфейсы:

```typescript
enum Route {
    ABOUT = 'about_page',
    HOME = 'home_page',
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

// Каждый класс реализует только нужные интерфейсы
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

**Пример с HTTP-клиентами:**

```typescript
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

// Серверный — только HTTP
class ServerHttp implements HttpRequest {
    delete(): void {}
    get(): void {}
    post(): void {}
    put(): void {}
}

// Клиентский — HTTP + токены
class ClientHttp implements HttpRequest, TokenStorage {
    delete(): void {}
    get(): void {}
    post(): void {}
    put(): void {}
    addToken(): void { return localStorage.get('token') }
    getToken(): void {}
}
```

> [!success] Преимущества ISP:
> - Сущности не зависят от ненужных методов
> - Код становится менее связанным
> - Предсказуемое поведение

### DIP — Dependency Inversion Principle

> Модули высокого уровня не должны зависеть от модулей низкого уровня.  
> Все должны зависеть от **абстракций**. Абстракции не должны зависеть от деталей - детали зависят от абстракций.

**Аналогия:** пульт управления станком (абстракция) отделяет рабочего от конкретной модели станка. При замене станка не нужно переучивать рабочего.

**Пример нарушения** — высокоуровневый UserService напрямую зависит от конкретной БД:

```typescript
// Плохо: UserService знает про конкретный класс MongoDBRepository
class MongoDBRepository {
    getUsers(): User[] { return [] }
}

class UserService {
    private repo = new MongoDBRepository(); // жёсткая зависимость!

    filterUserByAge(age: number) {
        const users = this.repo.getUsers();
        // ...
    }
}
// Чтобы сменить БД — нужно менять UserService
```

**Правильный вариант** — зависимость от интерфейса, а не от реализации:

```typescript
// Абстракция
interface UserRepository {
    getUsers: () => User[];
}

// Реализации
class MongoDBRepository implements UserRepository {
    getUsers(): User[] {
        console.log("Get users from MongoDB");
        return [];
    }
}

class PostgresRepository implements UserRepository {
    getUsers(): User[] {
        console.log("Get users from PostgreSQL");
        return [];
    }
}

// Высокоуровневый модуль зависит от абстракции
class UserService {
    constructor(private userRepository: UserRepository) {}

    filterUserByAge(age: number) {
        const users = this.userRepository.getUsers();
        console.log(users);
    }
}

// Инъекция зависимости — подставляем любую реализацию
const userServiceMongo = new UserService(new MongoDBRepository());
const userServicePostgres = new UserService(new PostgresRepository());
```

**Пример с музыкальными сервисами:**

```typescript
interface MusicApi {
    getTracks: () => void;
}

class YandexMusicApi implements MusicApi {
    getTracks(): void {}
}

class SpotifyApi implements MusicApi {
    getTracks(): void {}
}

class VKMusicApi implements MusicApi {
    getTracks(): void {}
}

// MusicClient — абстракция между UI и конкретным API
class MusicClient implements MusicApi {
    constructor(private client: MusicApi) {}

    getTracks() { this.client.getTracks(); }
}

const MusicApp = () => {
    const API = new MusicClient(new SpotifyApi()); // меняем одну строку
    API.getTracks();
}
```



---

## YAGNI — You Aren't Gonna Need It

> Не пиши код, который «может понадобиться» в будущем

Принцип пришёл из **XP (Extreme Programming)** - методологии быстрой разработки с итерационным циклом. Авторство - Рон Джеффрис.

Почему вредно нарушать: 

- **Мёртвый код**: написанный, но неиспользуемый код нужно поддерживать, тестировать, понимать
- **Случайная сложность**: кодовая база растёт без реальной пользы
- **Overengineering**: системы с излишними абстракциями медленнее разрабатываются и сложнее меняются
- **Ложные предположения**: предсказания о будущих требованиях часто неверны

**Пример нарушения YAGNI**

```typescript
// Нужен был просто метод sendEmail.
// Разработчик решил "сделать на будущее" универсальный NotificationService
// с 10 методами, стратегиями, провайдерами — хотя нужен был только email.

interface NotificationProvider {
    send(message: string, recipient: string): Promise<void>;
}

class EmailProvider implements NotificationProvider {
    async send(message, recipient) { /* ... */ }
}

class SMSProvider implements NotificationProvider {
    async send(message, recipient) { /* ... */ }
}

class PushProvider implements NotificationProvider {
    async send(message, recipient) { /* ... */ }
}

class SlackProvider implements NotificationProvider {
    async send(message, recipient) { /* ... */ }
}

class NotificationService {
    private providers: NotificationProvider[] = [];

    addProvider(provider: NotificationProvider): this {
        this.providers.push(provider);
        return this;
    }

    async sendToAll(message: string, recipient: string) { /* ... */ }
    async sendToFirst(message: string, recipient: string) { /* ... */ }
    async sendWithRetry(message: string, recipient: string, retries: number) { /* ... */ }
    async sendBatch(messages: Array<{message: string, recipient: string}>) { /* ... */ }
    async schedule(message: string, recipient: string, date: Date) { /* ... */ }
}

// Реальная задача требовала только этого:
// sendWelcomeEmail(userEmail: string)
```

**Пример соблюдения YAGNI**

```typescript
// Простейшая реализация для текущей задачи
async function sendWelcomeEmail(userEmail: string): Promise<void> {
    await emailClient.send({
        to: userEmail,
        subject: "Добро пожаловать!",
        body: "Спасибо за регистрацию."
    });
}

// Когда появится реальная потребность в SMS — тогда добавим
// Когда появится реальная потребность в batch — тогда абстрагируем
```

Связь с другими принципами:

- **KISS**: YAGNI - частный случай. Не усложняй то, что не нужно сейчас.
- **DRY**: Преждевременная абстракция ради будущего DRY - нарушение YAGNI.
- **SOLID/OCP**: Проектируй для расширения, но не реализуй расширение заранее.

> [!NOTE] YAGNI не означает "пиши плохой код". Означает: не реализуй то, что не нужно прямо сейчас.



---

## KISS — Keep It Simple, Stupid

> Решение должно быть максимально простым

Принцип сформулирован в **ВМС США** инженером Кларенсом «Келли» Джонсоном (Kelly Johnson). Суть: самолёт должен быть прост в ремонте в полевых условиях обычным механиком с набором базовых инструментов.

В разработке ПО: код должен быть прост в понимании и изменении обычным разработчиком команды.

### Простота vs примитивность

| Простота (KISS) | Примитивность |
|----------------|---------------|
| Решает задачу элегантно | Решает задачу любым способом |
| Понятна без объяснений | Может быть запутанной |
| Легко расширяема | Трудно изменяема |
| Намеренно выбрана | Результат невнимания |

### Когда сложность оправдана

Различают два вида сложности:

- **Доменная (Essential Complexity)**: сложность самой задачи, неизбежная. Алгоритм сжатия сложен потому, что сложна математика - не потому, что плохо написан.
- **Случайная (Accidental Complexity)**: сложность, привнесённая самими разработчиками через лишние абстракции, паттерны не по месту, overengineering.

KISS борется с **случайной сложностью**.

**Пример нарушения KISS**:

```typescript
// 5 уровней наследования ради одного метода formatCurrency()
abstract class BaseFormatter {
    abstract format(value: number): string;
}

abstract class LocaleAwareFormatter extends BaseFormatter {
    constructor(protected locale: string) { super(); }
}

abstract class CurrencyFormatterBase extends LocaleAwareFormatter {
    constructor(locale: string, protected currency: string) {
        super(locale);
    }
}

abstract class RegionalCurrencyFormatter extends CurrencyFormatterBase {
    abstract getSymbol(): string;
}

class RussianRubleFormatter extends RegionalCurrencyFormatter {
    getSymbol() { return "₽"; }

    format(value: number): string {
        return `${value.toFixed(2)} ${this.getSymbol()}`;
    }
}

// Нужно было:
const formatCurrency = (value: number) => `${value.toFixed(2)} ₽`;
```

**Пример соблюдения KISS**:

```typescript
// Простая функция вместо иерархии классов
function formatCurrency(value: number, currency = "RUB"): string {
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency,
    }).format(value);
}

formatCurrency(1234.5);         // "1 234,50 ₽"
formatCurrency(1234.5, "USD");  // "1 234,50 $"

// Если потом понадобится больше — ТОГДА усложним (YAGNI!)
```

Связь с другими принципами:

- **YAGNI**: не пиши лишнее → сохраняешь простоту (KISS)
- **DRY**: абстракция ради устранения дублирования должна оставаться простой
- **SRP**: одна ответственность → проще понимать и изменять
- **ISP**: маленькие интерфейсы проще больших

> [!NOTE] Простота — не цель сама по себе. Цель — управляемость кодовой базы. Простота — лучший способ её достичь.



---

## DRY — Don't Repeat Yourself

> "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system"  
> — Andy Hunt & Dave Thomas, "The Pragmatic Programmer"

### Суть

Каждая единица знания (логика, правило, алгоритм) должна иметь одно каноническое представление. Изменение требования должно требовать изменения только в одном месте.

### DRY vs WET

**WET** — Write Everything Twice / We Enjoy Typing  
Код, где одна и та же логика продублирована в нескольких местах.

### Правило трёх

> Дублируй дважды, абстрагируй на третий раз

- Первый раз — просто пишем
- Второй раз — замечаем дублирование, держим в голове
- Третий раз — абстрагируем

Это предотвращает **преждевременную абстракцию** (которую осуждает YAGNI).

### Пример нарушения DRY

```typescript
// Логика валидации email продублирована в трёх местах

class RegistrationService {
    register(email: string, password: string) {
        // Дублирование #1
        if (!email.includes("@") || email.length < 5) {
            throw new Error("Некорректный email");
        }
        // ... логика регистрации
    }
}

class ProfileService {
    updateEmail(userId: string, email: string) {
        // Дублирование #2 — та же логика, возможно уже с багом
        if (!email.includes("@") || email.length < 5) {
            throw new Error("Некорректный email");
        }
        // ... обновление профиля
    }
}

class InviteService {
    sendInvite(email: string) {
        // Дублирование #3 — логика начинает расходиться
        if (!email.includes("@")) {
            throw new Error("Некорректный email");
            // Забыли про проверку длины!
        }
        // ... отправка инвайта
    }
}
```

### Пример соблюдения DRY

```typescript
// Единое, каноническое представление правила валидации email
function validateEmail(email: string): void {
    if (!email.includes("@") || email.length < 5) {
        throw new ValidationError("email", "Некорректный email");
    }
}

// Все сервисы используют одну функцию
class RegistrationService {
    register(email: string, password: string) {
        validateEmail(email); // одна строка
        // ...
    }
}

class ProfileService {
    updateEmail(userId: string, email: string) {
        validateEmail(email); // одна строка
        // ...
    }
}

class InviteService {
    sendInvite(email: string) {
        validateEmail(email); // одна строка
        // ...
    }
}
// Изменение правила валидации → правим в одном месте → работает везде
```

### Когда дублирование допустимо

DRY — не абсолют. Иногда дублирование лучше неправильной абстракции:

1. **Разные контексты**: две функции выглядят одинаково сейчас, но отвечают за разные доменные понятия. При изменении одной - другая меняться не должна.
2. **Случайное сходство**: совпадение реализации - не совпадение семантики.
3. **Преждевременная абстракция хуже дублирования**: плохая абстракция связывает код, который не должен быть связан.

```typescript
// Антипример DRY — случайное сходство
function calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

function calculateCartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// Хотя код выглядит одинаково, OrderItem и CartItem — разные домены.
// Объединение в одну функцию создаст ненужную связность.
// Правило "случайного сходства": код одинаковый, но менять будем по-разному.
```

TypeScript-примеры устранения DRY

```typescript
// Дублирование типов → Generic
type ApiResponse<T> = {
    data: T;
    status: number;
    message: string;
    timestamp: Date;
};

// Вместо:
// type UserApiResponse = { data: User; status: number; ... }
// type OrderApiResponse = { data: Order; status: number; ... }

// Дублирование логики обработки ответа → утилита
async function apiCall<T>(
    url: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
        throw new HttpError(response.status, await response.text());
    }
    
    return response.json();
}

// Дублирование валидации → схема (например, Zod)
import { z } from "zod";

const UserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18),
});

type User = z.infer<typeof UserSchema>; // тип из схемы — одно место истины

// Валидация везде через схему
UserSchema.parse(input); // один источник правил
```



---

## Связи между принципами

| Принцип | Ключевой вопрос | Антипаттерн который предотвращает |
|---------|----------------|----------------------------------|
| **SRP** | Одна ли ответственность у сущности? | GodObject, монолитный класс |
| **OCP** | Расширяется ли без модификации? | Бесконечные if/else при добавлении функций |
| **LSP** | Можно ли подставить подтип без сюрпризов? | Нарушенный контракт наследника |
| **ISP** | Зависит ли класс только от нужных методов? | Жирный интерфейс, "заглушки" в реализации |
| **DIP** | Зависит ли высокоуровневый код от абстракций? | Жёсткая привязка к конкретным классам |
| **YAGNI** | Нужно ли это прямо сейчас? | Overengineering, мёртвый код |
| **KISS** | Решено ли просто? | Случайная сложность, лишние слои |
| **DRY** | Есть ли единственный источник истины? | Расходящиеся копии логики, WET-код |

SOLID + YAGNI + KISS + DRY как единая система

```
┌─────────────────────────────────────────────────────────────────┐
│                    ЕДИНАЯ СИСТЕМА ПРИНЦИПОВ                     │
├─────────────────┬───────────────────────────────────────────────┤
│   ЧТО СТРОИТЬ   │  SOLID — правильная структура кода            │
│   (Дизайн)      │  ├─ SRP: одна ответственность                 │
│                 │  ├─ OCP: открыт/закрыт                        │
│                 │  ├─ LSP: подтипы совместимы                   │
│                 │  ├─ ISP: узкие интерфейсы                     │
│                 │  └─ DIP: зависи от абстракций                 │
├─────────────────┼───────────────────────────────────────────────┤
│   КАК СТРОИТЬ   │  YAGNI — строй только то, что нужно сейчас    │
│   (Процесс)     │  KISS — строй максимально просто              │
│                 │  DRY — не дублируй знания                     │
└─────────────────┴───────────────────────────────────────────────┘
```

> [!TIP] Принципы иногда конфликтуют. Например, жёсткое следование DRY может привести к нарушению YAGNI (создание преждевременной абстракции), или нарушению SRP (объединение несвязанного кода ради устранения дублирования). Стоит использовать принципы как инструменты, не как религию.
