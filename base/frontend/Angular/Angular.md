---
tags:
  - angular
  - rxjs
  - ngrx
  - typescript
  - frontend
---

# Angular — Полное руководство

Angular — это платформа и фреймворк для создания одностраничных клиентских приложений с использованием HTML и TypeScript. Разрабатывается командой Google.

---

## Введение и философия

### Что такое Angular

Angular — это **полноценная платформа** для разработки, а не просто библиотека. Он включает:
- Компонентную архитектуру
- Систему модулей
- Dependency Injection
- Роутинг
- HTTP-клиент
- Формы (реактивные и шаблонные)
- Анимации
- Тестирование

### Отличия от React/Vue

| Характеристика | Angular | React | Vue |
|----------------|---------|-------|-----|
| Тип | Фреймворк | Библиотека | Фреймворк |
| Язык | TypeScript | JavaScript/TSX | JavaScript/TS |
| Архитектура | MVC/MVVM | Компонентная | Компонентная |
| Binding | Two-way | One-way | Two-way |
| DI | Встроенный | Нет | Нет |
| CLI | Angular CLI | Create React App | Vue CLI |

### Установка и создание проекта

```bash
# Установка Angular CLI глобально
npm install -g @angular/cli

# Создание нового проекта
ng new my-app

# Запуск dev-сервера
cd my-app
ng serve

# Генерация компонента
ng generate component components/header
# или сокращённо
ng g c components/header

# Генерация сервиса
ng g s services/api

# Генерация модуля
ng g m features/auth

# Сборка для продакшена
ng build --configuration=production
```

---

## Архитектура приложения

### Структура проекта

```
src/
├── app/
│   ├── components/          # Переиспользуемые компоненты
│   ├── pages/               # Страницы (роутинг)
│   ├── services/            # Сервисы (логика, API)
│   ├── models/              # Интерфейсы и типы
│   ├── guards/              # Route guards
│   ├── interceptors/        # HTTP interceptors
│   ├── pipes/               # Custom pipes
│   ├── directives/          # Custom directives
│   ├── store/               # NgRx store (state management)
│   ├── app.component.ts     # Корневой компонент
│   ├── app.module.ts        # Корневой модуль
│   └── app-routing.module.ts # Роутинг
├── assets/                  # Статические файлы
├── environments/            # Конфигурации окружений
├── index.html               # Точка входа HTML
├── main.ts                  # Точка входа приложения
└── styles.scss              # Глобальные стили
```

### Модули (NgModules)

Модули — это контейнеры для группировки связанных компонентов, директив, пайпов и сервисов.

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
  // Компоненты, директивы, пайпы этого модуля
  declarations: [
    AppComponent,
    HeaderComponent
  ],
  // Импортируемые модули
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  // Сервисы доступные во всём приложении
  providers: [],
  // Корневой компонент для запуска
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Standalone Components (Angular 14+)

Начиная с Angular 14, можно создавать компоненты без модулей:

```typescript
// header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true, // Standalone компонент
  imports: [CommonModule, RouterModule], // Импорты прямо в компоненте
  template: `
    <header>
      <nav>
        <a routerLink="/">Home</a>
        <a routerLink="/about">About</a>
      </nav>
    </header>
  `,
  styles: [`
    header {
      background: #333;
      padding: 1rem;
    }
    a {
      color: white;
      margin-right: 1rem;
    }
  `]
})
export class HeaderComponent {}
```

Запуск приложения со standalone компонентом:

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
});
```

---

## Компоненты

### Анатомия компонента

```typescript
// user-card.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

// Интерфейс для типизации
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

@Component({
  // CSS-селектор для использования в шаблонах
  selector: 'app-user-card',

  // Путь к HTML-шаблону (или template для inline)
  templateUrl: './user-card.component.html',

  // Пути к файлам стилей (или styles для inline)
  styleUrls: ['./user-card.component.scss'],

  // Инкапсуляция стилей
  // Emulated (default) - эмуляция Shadow DOM
  // None - глобальные стили
  // ShadowDom - нативный Shadow DOM
  encapsulation: ViewEncapsulation.Emulated
})
export class UserCardComponent implements OnInit, OnDestroy {

  // Входные параметры от родителя
  @Input() user!: User;
  @Input() showActions: boolean = true;

  // События для родителя
  @Output() onEdit = new EventEmitter<User>();
  @Output() onDelete = new EventEmitter<number>();

  // Внутреннее состояние
  isExpanded: boolean = false;

  // Lifecycle hook - после инициализации
  ngOnInit(): void {
    console.log('Component initialized with user:', this.user);
  }

  // Lifecycle hook - перед уничтожением
  ngOnDestroy(): void {
    console.log('Component destroyed');
  }

  // Методы компонента
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  editUser(): void {
    this.onEdit.emit(this.user);
  }

  deleteUser(): void {
    this.onDelete.emit(this.user.id);
  }
}
```

```html
<!-- user-card.component.html -->
<div class="user-card" [class.expanded]="isExpanded">
  <div class="avatar">
    <img [src]="user.avatar || 'assets/default-avatar.png'" [alt]="user.name">
  </div>

  <div class="info">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
  </div>

  <button (click)="toggleExpand()">
    {{ isExpanded ? 'Collapse' : 'Expand' }}
  </button>

  <div *ngIf="showActions" class="actions">
    <button (click)="editUser()">Edit</button>
    <button (click)="deleteUser()">Delete</button>
  </div>
</div>
```

### Использование компонента

```html
<!-- parent.component.html -->
<app-user-card
  [user]="currentUser"
  [showActions]="canEdit"
  (onEdit)="handleEdit($event)"
  (onDelete)="handleDelete($event)">
</app-user-card>

<!-- Итерация по списку -->
<app-user-card
  *ngFor="let user of users; trackBy: trackByUserId"
  [user]="user"
  (onDelete)="removeUser($event)">
</app-user-card>
```

```typescript
// parent.component.ts
export class ParentComponent {
  users: User[] = [];
  currentUser: User = { id: 1, name: 'John', email: 'john@example.com' };
  canEdit: boolean = true;

  handleEdit(user: User): void {
    console.log('Editing user:', user);
  }

  handleDelete(userId: number): void {
    this.users = this.users.filter(u => u.id !== userId);
  }

  // trackBy для оптимизации ngFor
  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
```

---

## Template Syntax (Синтаксис шаблонов)

### Интерполяция

```html
<!-- Простая интерполяция -->
<h1>{{ title }}</h1>

<!-- Выражения -->
<p>{{ 1 + 2 }}</p>
<p>{{ user.name.toUpperCase() }}</p>
<p>{{ isActive ? 'Active' : 'Inactive' }}</p>

<!-- Вызов методов -->
<p>{{ getFullName() }}</p>

<!-- Пайпы для форматирования -->
<p>{{ price | currency:'USD' }}</p>
<p>{{ birthday | date:'dd.MM.yyyy' }}</p>
<p>{{ text | uppercase }}</p>
<p>{{ data | json }}</p>
```

### Property Binding (Привязка свойств)

```html
<!-- Привязка атрибутов -->
<img [src]="imageUrl" [alt]="imageAlt">
<button [disabled]="isLoading">Submit</button>
<input [value]="name" [placeholder]="placeholder">

<!-- Привязка классов -->
<div [class.active]="isActive"></div>
<div [class]="classExpression"></div>
<div [ngClass]="{ 'active': isActive, 'disabled': isDisabled }"></div>

<!-- Привязка стилей -->
<div [style.color]="textColor"></div>
<div [style.font-size.px]="fontSize"></div>
<div [ngStyle]="{ 'color': textColor, 'font-size': fontSize + 'px' }"></div>
```

### Event Binding (Привязка событий)

```html
<!-- Клик -->
<button (click)="onClick()">Click me</button>
<button (click)="onClick($event)">With event</button>

<!-- События ввода -->
<input (input)="onInput($event)">
<input (change)="onChange($event)">
<input (focus)="onFocus()" (blur)="onBlur()">

<!-- Клавиатура -->
<input (keyup)="onKeyUp($event)">
<input (keyup.enter)="onEnter()">
<input (keydown.escape)="onEscape()">
<input (keydown.ctrl.s)="onSave()">

<!-- Форма -->
<form (submit)="onSubmit($event)">
  <button type="submit">Submit</button>
</form>
```

### Two-way Binding (Двусторонняя привязка)

```html
<!-- ngModel для форм (требует FormsModule) -->
<input [(ngModel)]="name">

<!-- Эквивалент развёрнутой записи -->
<input [ngModel]="name" (ngModelChange)="name = $event">

<!-- Кастомная двусторонняя привязка -->
<app-counter [(count)]="counterValue"></app-counter>
```

```typescript
// counter.component.ts
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="decrement()">-</button>
    <span>{{ count }}</span>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  @Input() count: number = 0;
  @Output() countChange = new EventEmitter<number>(); // Имя: propertyName + 'Change'

  increment(): void {
    this.count++;
    this.countChange.emit(this.count);
  }

  decrement(): void {
    this.count--;
    this.countChange.emit(this.count);
  }
}
```

### Структурные директивы

```html
<!-- *ngIf - условный рендеринг -->
<div *ngIf="isVisible">Visible content</div>

<div *ngIf="user; else noUser">
  Welcome, {{ user.name }}!
</div>
<ng-template #noUser>
  Please log in
</ng-template>

<!-- *ngIf с then -->
<div *ngIf="isLoading; then loadingTpl; else contentTpl"></div>
<ng-template #loadingTpl>Loading...</ng-template>
<ng-template #contentTpl>Content loaded</ng-template>

<!-- *ngFor - итерация -->
<ul>
  <li *ngFor="let item of items">{{ item.name }}</li>
</ul>

<!-- *ngFor с контекстными переменными -->
<ul>
  <li *ngFor="let item of items;
              let i = index;
              let first = first;
              let last = last;
              let even = even;
              let odd = odd;
              trackBy: trackByFn">
    {{ i + 1 }}. {{ item.name }}
    <span *ngIf="first">(First)</span>
    <span *ngIf="last">(Last)</span>
  </li>
</ul>

<!-- *ngSwitch - множественное условие -->
<div [ngSwitch]="status">
  <p *ngSwitchCase="'active'">User is active</p>
  <p *ngSwitchCase="'pending'">User is pending</p>
  <p *ngSwitchCase="'blocked'">User is blocked</p>
  <p *ngSwitchDefault>Unknown status</p>
</div>

<!-- @if @for @switch (Angular 17+ Control Flow) -->
@if (isLoggedIn) {
  <p>Welcome back!</p>
} @else {
  <p>Please log in</p>
}

@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div>No items found</div>
}

@switch (status) {
  @case ('active') { <span>Active</span> }
  @case ('pending') { <span>Pending</span> }
  @default { <span>Unknown</span> }
}
```

### Template Reference Variables

```html
<!-- Ссылка на DOM-элемент -->
<input #nameInput type="text">
<button (click)="greet(nameInput.value)">Greet</button>

<!-- Ссылка на компонент -->
<app-timer #timer></app-timer>
<button (click)="timer.start()">Start Timer</button>
<button (click)="timer.stop()">Stop Timer</button>

<!-- Ссылка на директиву -->
<form #myForm="ngForm" (ngSubmit)="onSubmit(myForm)">
  <input name="email" ngModel required>
  <button [disabled]="myForm.invalid">Submit</button>
</form>
```

---

## Жизненный цикл компонента

Angular компоненты проходят через серию этапов от создания до уничтожения.

```typescript
import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  DoCheck,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked,
  SimpleChanges,
  Input
} from '@angular/core';

@Component({
  selector: 'app-lifecycle',
  template: `<p>{{ data }}</p>`
})
export class LifecycleComponent implements
  OnInit,
  OnDestroy,
  OnChanges,
  DoCheck,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked
{
  @Input() data: string = '';

  constructor() {
    // 1. Вызывается при создании экземпляра
    // Используется для инъекции зависимостей
    // НЕ используется для инициализации данных
    console.log('1. Constructor');
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 2. Вызывается при изменении @Input свойств
    // Вызывается ДО ngOnInit и при каждом изменении
    console.log('2. OnChanges', changes);

    if (changes['data']) {
      console.log('Previous:', changes['data'].previousValue);
      console.log('Current:', changes['data'].currentValue);
      console.log('First change:', changes['data'].firstChange);
    }
  }

  ngOnInit(): void {
    // 3. Вызывается ОДИН РАЗ после первого ngOnChanges
    // Используется для инициализации данных
    // Загрузка данных с сервера, подписки
    console.log('3. OnInit');
  }

  ngDoCheck(): void {
    // 4. Вызывается при каждой проверке изменений
    // Используется для кастомной логики обнаружения изменений
    // ОСТОРОЖНО: вызывается очень часто!
    console.log('4. DoCheck');
  }

  ngAfterContentInit(): void {
    // 5. Вызывается после проецирования контента (ng-content)
    // Вызывается ОДИН РАЗ
    console.log('5. AfterContentInit');
  }

  ngAfterContentChecked(): void {
    // 6. Вызывается после проверки проецированного контента
    console.log('6. AfterContentChecked');
  }

  ngAfterViewInit(): void {
    // 7. Вызывается после инициализации view и дочерних view
    // Здесь можно работать с @ViewChild
    // Вызывается ОДИН РАЗ
    console.log('7. AfterViewInit');
  }

  ngAfterViewChecked(): void {
    // 8. Вызывается после проверки view
    console.log('8. AfterViewChecked');
  }

  ngOnDestroy(): void {
    // 9. Вызывается перед уничтожением компонента
    // Используется для очистки: отписки, таймеры, etc.
    console.log('9. OnDestroy');
  }
}
```

### Порядок вызова

```
Constructor
↓
ngOnChanges (если есть @Input)
↓
ngOnInit
↓
ngDoCheck
↓
ngAfterContentInit
↓
ngAfterContentChecked
↓
ngAfterViewInit
↓
ngAfterViewChecked
↓
(при изменениях) ngOnChanges → ngDoCheck → ngAfterContentChecked → ngAfterViewChecked
↓
ngOnDestroy
```

---

## Dependency Injection (DI)

### Основы DI

DI — это паттерн, при котором зависимости передаются извне, а не создаются внутри класса.

```typescript
// Без DI (плохо)
class UserComponent {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService(); // Жёсткая связь
  }
}

// С DI (хорошо)
class UserComponent {
  constructor(private apiService: ApiService) {
    // Angular сам создаст и передаст экземпляр
  }
}
```

### Создание сервисов

```typescript
// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  // Сервис доступен во всём приложении (singleton)
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  // Приватное состояние
  private usersSubject = new BehaviorSubject<User[]>([]);

  // Публичный Observable для подписки
  users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Методы работы с данными
  loadUsers(): void {
    this.http.get<User[]>(this.apiUrl).subscribe(users => {
      this.usersSubject.next(users);
    });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Использование в компоненте

```typescript
// user-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngFor="let user of users">
      {{ user.name }} - {{ user.email }}
    </div>
  `
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];

  // Subject для отписки
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Подписка с автоматической отпиской
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
      });

    // Загрузка данных
    this.userService.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Уровни предоставления сервисов

```typescript
// 1. На уровне приложения (singleton)
@Injectable({
  providedIn: 'root'
})
export class GlobalService {}

// 2. На уровне модуля
@NgModule({
  providers: [ModuleService]
})
export class FeatureModule {}

// 3. На уровне компонента (новый экземпляр для каждого компонента)
@Component({
  selector: 'app-example',
  providers: [LocalService]
})
export class ExampleComponent {}
```

### Injection Tokens

```typescript
// Для инъекции примитивов или конфигурации
import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  production: boolean;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

// Регистрация
@NgModule({
  providers: [
    {
      provide: APP_CONFIG,
      useValue: {
        apiUrl: 'https://api.example.com',
        production: true
      }
    }
  ]
})
export class AppModule {}

// Использование
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(@Inject(APP_CONFIG) private config: AppConfig) {
    console.log(this.config.apiUrl);
  }
}
```

---

## Формы

### Template-driven Forms

Простой подход для несложных форм.

```typescript
// Требуется FormsModule
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  template: `
    <form #loginForm="ngForm" (ngSubmit)="onSubmit(loginForm)">
      <div>
        <label for="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          [(ngModel)]="model.email"
          required
          email
          #email="ngModel">
        <div *ngIf="email.invalid && email.touched" class="error">
          <span *ngIf="email.errors?.['required']">Email is required</span>
          <span *ngIf="email.errors?.['email']">Invalid email format</span>
        </div>
      </div>

      <div>
        <label for="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          [(ngModel)]="model.password"
          required
          minlength="6"
          #password="ngModel">
        <div *ngIf="password.invalid && password.touched" class="error">
          <span *ngIf="password.errors?.['required']">Password is required</span>
          <span *ngIf="password.errors?.['minlength']">
            Min length: {{ password.errors?.['minlength'].requiredLength }}
          </span>
        </div>
      </div>

      <button type="submit" [disabled]="loginForm.invalid">
        Login
      </button>
    </form>
  `
})
export class LoginFormComponent {
  model = {
    email: '',
    password: ''
  };

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log('Form data:', this.model);
    }
  }
}
```

### Reactive Forms

Более мощный и гибкий подход.

```typescript
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

@Component({
  selector: 'app-registration-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- Простое поле -->
      <div>
        <label>Name:</label>
        <input formControlName="name">
        <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
          <span *ngIf="form.get('name')?.errors?.['required']">Name is required</span>
        </div>
      </div>

      <!-- Email с кастомной валидацией -->
      <div>
        <label>Email:</label>
        <input formControlName="email">
        <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
          <span *ngIf="form.get('email')?.errors?.['required']">Email is required</span>
          <span *ngIf="form.get('email')?.errors?.['email']">Invalid email</span>
          <span *ngIf="form.get('email')?.errors?.['emailTaken']">Email already taken</span>
        </div>
      </div>

      <!-- Вложенная группа -->
      <div formGroupName="address">
        <h4>Address</h4>
        <input formControlName="street" placeholder="Street">
        <input formControlName="city" placeholder="City">
        <input formControlName="zip" placeholder="ZIP">
      </div>

      <!-- FormArray для динамических полей -->
      <div>
        <h4>Phone Numbers</h4>
        <div formArrayName="phones">
          <div *ngFor="let phone of phonesArray.controls; let i = index">
            <input [formControlName]="i">
            <button type="button" (click)="removePhone(i)">Remove</button>
          </div>
        </div>
        <button type="button" (click)="addPhone()">Add Phone</button>
      </div>

      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>

    <!-- Отладка -->
    <pre>{{ form.value | json }}</pre>
    <pre>Valid: {{ form.valid }}</pre>
  `
})
export class RegistrationFormComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      // Простые поля с валидацией
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email], [this.emailValidator()]],

      // Вложенная группа
      address: this.fb.group({
        street: [''],
        city: ['', Validators.required],
        zip: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
      }),

      // Массив значений
      phones: this.fb.array([
        this.fb.control('', Validators.required)
      ])
    });
  }

  // Getter для удобного доступа
  get phonesArray(): FormArray {
    return this.form.get('phones') as FormArray;
  }

  addPhone(): void {
    this.phonesArray.push(this.fb.control('', Validators.required));
  }

  removePhone(index: number): void {
    this.phonesArray.removeAt(index);
  }

  // Кастомный асинхронный валидатор
  emailValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.checkEmailExists(control.value).pipe(
        map(exists => exists ? { emailTaken: true } : null)
      );
    };
  }

  checkEmailExists(email: string): Observable<boolean> {
    // Имитация проверки на сервере
    return of(email === 'taken@example.com').pipe(delay(500));
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
    } else {
      // Пометить все поля как touched
      this.form.markAllAsTouched();
    }
  }
}
```

### Кастомные валидаторы

```typescript
// validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Синхронный валидатор
export function forbiddenNameValidator(forbiddenName: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = forbiddenName.test(control.value);
    return forbidden ? { forbiddenName: { value: control.value } } : null;
  };
}

// Валидатор для сравнения полей
export function matchFieldsValidator(field1: string, field2: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const value1 = group.get(field1)?.value;
    const value2 = group.get(field2)?.value;
    return value1 === value2 ? null : { fieldsMismatch: true };
  };
}

// Использование
this.form = this.fb.group({
  username: ['', [forbiddenNameValidator(/admin/i)]],
  password: ['', Validators.required],
  confirmPassword: ['', Validators.required]
}, {
  validators: matchFieldsValidator('password', 'confirmPassword')
});
```

---

## Роутинг

### Базовая настройка

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { UserListComponent } from './pages/users/user-list.component';
import { UserDetailComponent } from './pages/users/user-detail.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  // Простой маршрут
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },

  // Маршрут с параметром
  { path: 'users', component: UserListComponent },
  { path: 'users/:id', component: UserDetailComponent },

  // Защищённый маршрут
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard]
  },

  // Lazy loading модуля
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module')
      .then(m => m.DashboardModule)
  },

  // Редирект
  { path: 'home', redirectTo: '', pathMatch: 'full' },

  // Wildcard (404)
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

### Навигация

```html
<!-- Ссылки -->
<nav>
  <a routerLink="/">Home</a>
  <a routerLink="/about">About</a>
  <a [routerLink]="['/users', userId]">User Profile</a>

  <!-- С query params -->
  <a [routerLink]="['/products']"
     [queryParams]="{ category: 'electronics', sort: 'price' }">
    Products
  </a>

  <!-- Активный стиль -->
  <a routerLink="/about"
     routerLinkActive="active"
     [routerLinkActiveOptions]="{ exact: true }">
    About
  </a>
</nav>

<!-- Место для рендеринга роутов -->
<router-outlet></router-outlet>
```

```typescript
// Программная навигация
import { Router, ActivatedRoute } from '@angular/router';

@Component({...})
export class SomeComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  goToUser(id: number): void {
    // Абсолютный путь
    this.router.navigate(['/users', id]);

    // Относительный путь
    this.router.navigate(['../edit'], { relativeTo: this.route });

    // С query params
    this.router.navigate(['/search'], {
      queryParams: { q: 'angular' }
    });
  }
}
```

### Получение параметров

```typescript
// user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-user-detail',
  template: `
    <div *ngIf="user">
      <h2>{{ user.name }}</h2>
    </div>
  `
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Способ 1: Snapshot (не реагирует на изменения)
    const id = this.route.snapshot.paramMap.get('id');

    // Способ 2: Observable (реагирует на изменения)
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = Number(params.get('id'));
        return this.userService.getUser(id);
      })
    ).subscribe(user => {
      this.user = user;
    });

    // Query params
    this.route.queryParamMap.subscribe(params => {
      const sort = params.get('sort');
    });
  }
}
```

### Route Guards

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> {

    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Редирект на логин
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}

// Functional guard (Angular 14+)
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

### Resolvers

```typescript
// user.resolver.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserResolver implements Resolve<User> {

  constructor(private userService: UserService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<User> {
    const id = Number(route.paramMap.get('id'));
    return this.userService.getUser(id);
  }
}

// В роутах
const routes: Routes = [
  {
    path: 'users/:id',
    component: UserDetailComponent,
    resolve: { user: UserResolver }
  }
];

// В компоненте
ngOnInit() {
  this.user = this.route.snapshot.data['user'];
  // или
  this.route.data.subscribe(data => {
    this.user = data['user'];
  });
}
```

---

## HTTP Client

### Базовое использование

```typescript
// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';

interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'https://api.example.com';

  constructor(private http: HttpClient) {}

  // GET запрос
  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users`).pipe(
      map(response => response.data),
      retry(3),
      catchError(this.handleError)
    );
  }

  // GET с параметрами
  searchUsers(query: string, page: number): Observable<User[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', '10');

    return this.http.get<User[]>(`${this.baseUrl}/users`, { params });
  }

  // POST запрос
  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, user);
  }

  // PUT запрос
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user);
  }

  // PATCH запрос
  patchUser(id: number, updates: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/users/${id}`, updates);
  }

  // DELETE запрос
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  // С кастомными заголовками
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.post(`${this.baseUrl}/upload`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  // Обработка ошибок
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

### HTTP Interceptors

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const token = this.authService.getToken();

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}

// error.interceptor.ts
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
        }
        if (error.status === 500) {
          // Показать уведомление
        }
        return throwError(() => error);
      })
    );
  }
}

// Регистрация в модуле
@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
})
export class AppModule {}
```

---

## RxJS в Angular

### Основные операторы

```typescript
import {
  Observable,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  of,
  from,
  interval,
  timer,
  forkJoin,
  combineLatest,
  merge,
  concat
} from 'rxjs';

import {
  map,
  filter,
  tap,
  take,
  takeUntil,
  takeWhile,
  skip,
  first,
  last,
  distinctUntilChanged,
  debounceTime,
  throttleTime,
  delay,
  switchMap,
  mergeMap,
  concatMap,
  exhaustMap,
  catchError,
  retry,
  retryWhen,
  finalize,
  share,
  shareReplay
} from 'rxjs/operators';
```

### Трансформация данных

```typescript
// map - преобразование каждого значения
this.users$.pipe(
  map(users => users.filter(u => u.active))
);

// filter - фильтрация значений
this.numbers$.pipe(
  filter(n => n > 10)
);

// tap - side effects без изменения потока
this.data$.pipe(
  tap(data => console.log('Received:', data)),
  tap(data => this.store.dispatch(setData(data)))
);

// distinctUntilChanged - только уникальные последовательные значения
this.searchQuery$.pipe(
  distinctUntilChanged(),
  switchMap(query => this.search(query))
);

// distinctUntilChanged с компаратором
this.user$.pipe(
  distinctUntilChanged((prev, curr) => prev.id === curr.id)
);
```

### Обработка времени

```typescript
// debounceTime - ждёт паузу перед эмитом
this.searchInput.valueChanges.pipe(
  debounceTime(300), // Ждёт 300ms без ввода
  distinctUntilChanged(),
  switchMap(term => this.searchService.search(term))
);

// throttleTime - ограничивает частоту эмитов
fromEvent(window, 'scroll').pipe(
  throttleTime(100), // Максимум раз в 100ms
  map(() => window.scrollY)
);

// delay - задержка
this.notification$.pipe(
  delay(3000) // Показать через 3 секунды
);
```

### Flattening операторы

```typescript
// switchMap - отменяет предыдущий запрос при новом
// Используйте для поиска, автокомплита
this.searchTerm$.pipe(
  switchMap(term => this.api.search(term))
);

// mergeMap (flatMap) - параллельное выполнение
// Используйте когда порядок не важен
this.userIds$.pipe(
  mergeMap(id => this.api.getUser(id))
);

// concatMap - последовательное выполнение
// Используйте когда важен порядок
this.tasks$.pipe(
  concatMap(task => this.processTask(task))
);

// exhaustMap - игнорирует новые пока текущий не завершён
// Используйте для предотвращения дублей (клик по кнопке)
this.submitClick$.pipe(
  exhaustMap(() => this.api.submit(this.form.value))
);
```

### Комбинирование потоков

```typescript
// forkJoin - ждёт завершения всех
forkJoin({
  users: this.api.getUsers(),
  products: this.api.getProducts(),
  settings: this.api.getSettings()
}).subscribe(({ users, products, settings }) => {
  // Все данные загружены
});

// combineLatest - эмитит при изменении любого
combineLatest([
  this.route.params,
  this.route.queryParams
]).pipe(
  map(([params, query]) => ({ ...params, ...query }))
);

// merge - объединяет в один поток
merge(
  fromEvent(this.el, 'mouseenter'),
  fromEvent(this.el, 'focus')
).subscribe(() => this.showTooltip());

// concat - последовательное объединение
concat(
  this.loadInitialData(),
  this.loadAdditionalData()
);
```

### Обработка ошибок

```typescript
// catchError - перехват и обработка
this.api.getData().pipe(
  catchError(error => {
    console.error('Error:', error);
    return of([]); // Возврат fallback значения
  })
);

// retry - повтор при ошибке
this.api.getData().pipe(
  retry(3) // Повторить 3 раза
);

// retryWhen с задержкой
this.api.getData().pipe(
  retryWhen(errors =>
    errors.pipe(
      delay(1000), // Ждать 1 секунду
      take(3) // Максимум 3 попытки
    )
  )
);

// finalize - выполняется в конце (успех или ошибка)
this.api.getData().pipe(
  finalize(() => this.isLoading = false)
);
```

### Subjects

```typescript
// Subject - базовый multicast
const subject = new Subject<number>();
subject.subscribe(v => console.log('A:', v));
subject.subscribe(v => console.log('B:', v));
subject.next(1); // A: 1, B: 1
subject.next(2); // A: 2, B: 2

// BehaviorSubject - хранит последнее значение
const behavior = new BehaviorSubject<number>(0); // Начальное значение
behavior.subscribe(v => console.log('Value:', v)); // Сразу получит 0
behavior.next(1);
console.log(behavior.getValue()); // Синхронный доступ к значению

// ReplaySubject - хранит N последних значений
const replay = new ReplaySubject<number>(3); // Хранит 3 значения
replay.next(1);
replay.next(2);
replay.next(3);
replay.next(4);
replay.subscribe(v => console.log(v)); // 2, 3, 4

// AsyncSubject - эмитит только последнее значение при complete
const async = new AsyncSubject<number>();
async.next(1);
async.next(2);
async.subscribe(v => console.log(v));
async.next(3);
async.complete(); // Только сейчас эмитит: 3
```

### Паттерн отписки

```typescript
@Component({...})
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Все подписки автоматически отпишутся
    this.data$.pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    this.otherData$.pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Или с использованием DestroyRef (Angular 16+)
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({...})
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.data$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}
```

### Async Pipe

```typescript
@Component({
  template: `
    <!-- Автоматическая подписка и отписка -->
    <div *ngIf="user$ | async as user">
      {{ user.name }}
    </div>

    <!-- Несколько async -->
    <ng-container *ngIf="{
      users: users$ | async,
      loading: loading$ | async
    } as vm">
      <div *ngIf="vm.loading">Loading...</div>
      <ul *ngIf="!vm.loading">
        <li *ngFor="let user of vm.users">{{ user.name }}</li>
      </ul>
    </ng-container>
  `
})
export class UserComponent {
  user$ = this.userService.getUser(1);
  users$ = this.userService.getUsers();
  loading$ = this.store.select(selectLoading);
}
```

---

## NgRx — State Management

NgRx — это библиотека для управления состоянием, основанная на Redux паттерне.

### Установка

```bash
ng add @ngrx/store
ng add @ngrx/effects
ng add @ngrx/store-devtools
ng add @ngrx/entity
```

### Архитектура NgRx

```
┌─────────────────────────────────────────────────────────┐
│                        Component                         │
│                                                         │
│    dispatch(Action) ──────────┐                        │
│                                │                        │
│    ◄────────── select(State) ──┴──┐                    │
└─────────────────────────────────────────────────────────┘
              │                     ▲
              ▼                     │
┌─────────────────────┐   ┌─────────────────────┐
│       Action        │   │       Selector      │
│  { type, payload }  │   │   (state) => data   │
└─────────────────────┘   └─────────────────────┘
              │                     ▲
              ▼                     │
┌─────────────────────────────────────────────────────────┐
│                         Store                            │
│                                                         │
│    ┌─────────────┐         ┌─────────────────┐         │
│    │   Reducer   │ ──────► │      State      │         │
│    │ (state,     │         │                 │         │
│    │  action) => │         │  { users: [],   │         │
│    │  newState   │         │    loading: ... │         │
│    └─────────────┘         └─────────────────┘         │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│                        Effects                           │
│                                                         │
│    Action ──► Side Effect (API) ──► Action              │
└─────────────────────────────────────────────────────────┘
```

### State (Состояние)

```typescript
// store/user/user.state.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

export const initialUserState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null
};
```

### Actions (Действия)

```typescript
// store/user/user.actions.ts
import { createAction, props } from '@ngrx/store';
import { User } from './user.state';

// Загрузка пользователей
export const loadUsers = createAction(
  '[User List] Load Users'
);

export const loadUsersSuccess = createAction(
  '[User API] Load Users Success',
  props<{ users: User[] }>()
);

export const loadUsersFailure = createAction(
  '[User API] Load Users Failure',
  props<{ error: string }>()
);

// Выбор пользователя
export const selectUser = createAction(
  '[User List] Select User',
  props<{ userId: number }>()
);

// CRUD операции
export const addUser = createAction(
  '[User Form] Add User',
  props<{ user: Omit<User, 'id'> }>()
);

export const addUserSuccess = createAction(
  '[User API] Add User Success',
  props<{ user: User }>()
);

export const updateUser = createAction(
  '[User Form] Update User',
  props<{ user: User }>()
);

export const deleteUser = createAction(
  '[User List] Delete User',
  props<{ userId: number }>()
);
```

### Reducer (Редьюсер)

```typescript
// store/user/user.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { initialUserState } from './user.state';
import * as UserActions from './user.actions';

export const userReducer = createReducer(
  initialUserState,

  // Загрузка
  on(UserActions.loadUsers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false
  })),

  on(UserActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Выбор
  on(UserActions.selectUser, (state, { userId }) => ({
    ...state,
    selectedUser: state.users.find(u => u.id === userId) || null
  })),

  // Добавление
  on(UserActions.addUserSuccess, (state, { user }) => ({
    ...state,
    users: [...state.users, user]
  })),

  // Обновление
  on(UserActions.updateUser, (state, { user }) => ({
    ...state,
    users: state.users.map(u => u.id === user.id ? user : u)
  })),

  // Удаление
  on(UserActions.deleteUser, (state, { userId }) => ({
    ...state,
    users: state.users.filter(u => u.id !== userId)
  }))
);
```

### Effects (Эффекты)

```typescript
// store/user/user.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';

import { UserService } from '../../services/user.service';
import * as UserActions from './user.actions';

@Injectable()
export class UserEffects {

  constructor(
    private actions$: Actions,
    private userService: UserService,
    private router: Router
  ) {}

  // Загрузка пользователей
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUsers),
      mergeMap(() =>
        this.userService.getUsers().pipe(
          map(users => UserActions.loadUsersSuccess({ users })),
          catchError(error =>
            of(UserActions.loadUsersFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Добавление пользователя
  addUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.addUser),
      mergeMap(({ user }) =>
        this.userService.createUser(user).pipe(
          map(newUser => UserActions.addUserSuccess({ user: newUser })),
          catchError(error =>
            of(UserActions.loadUsersFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Эффект без dispatch (side effect only)
  addUserSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.addUserSuccess),
      tap(() => this.router.navigate(['/users']))
    ),
    { dispatch: false }
  );
}
```

### Selectors (Селекторы)

```typescript
// store/user/user.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { UserState } from './user.state';

// Feature selector
export const selectUserState = createFeatureSelector<UserState>('users');

// Простые селекторы
export const selectAllUsers = createSelector(
  selectUserState,
  (state) => state.users
);

export const selectUsersLoading = createSelector(
  selectUserState,
  (state) => state.loading
);

export const selectUsersError = createSelector(
  selectUserState,
  (state) => state.error
);

export const selectSelectedUser = createSelector(
  selectUserState,
  (state) => state.selectedUser
);

// Вычисляемые селекторы
export const selectActiveUsers = createSelector(
  selectAllUsers,
  (users) => users.filter(u => u.active)
);

export const selectUsersCount = createSelector(
  selectAllUsers,
  (users) => users.length
);

// Параметризованный селектор
export const selectUserById = (userId: number) => createSelector(
  selectAllUsers,
  (users) => users.find(u => u.id === userId)
);

// Комбинированный селектор
export const selectUserViewModel = createSelector(
  selectAllUsers,
  selectUsersLoading,
  selectUsersError,
  (users, loading, error) => ({
    users,
    loading,
    error,
    hasUsers: users.length > 0
  })
);
```

### Регистрация Store

```typescript
// app.module.ts
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { userReducer } from './store/user/user.reducer';
import { UserEffects } from './store/user/user.effects';

@NgModule({
  imports: [
    // Корневой store
    StoreModule.forRoot({
      users: userReducer
    }),

    // Эффекты
    EffectsModule.forRoot([UserEffects]),

    // DevTools (только для разработки)
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    })
  ]
})
export class AppModule {}

// Для feature модулей
@NgModule({
  imports: [
    StoreModule.forFeature('users', userReducer),
    EffectsModule.forFeature([UserEffects])
  ]
})
export class UserModule {}
```

### Использование в компоненте

```typescript
// user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as UserActions from '../store/user/user.actions';
import * as UserSelectors from '../store/user/user.selectors';
import { User } from '../store/user/user.state';

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="loading$ | async" class="loading">
      Loading...
    </div>

    <div *ngIf="error$ | async as error" class="error">
      {{ error }}
    </div>

    <ul *ngIf="users$ | async as users">
      <li *ngFor="let user of users"
          (click)="selectUser(user.id)"
          [class.selected]="(selectedUser$ | async)?.id === user.id">
        {{ user.name }} - {{ user.email }}
        <button (click)="deleteUser(user.id); $event.stopPropagation()">
          Delete
        </button>
      </li>
    </ul>

    <button (click)="loadUsers()">Reload</button>
  `
})
export class UserListComponent implements OnInit {
  // Подписки на store
  users$: Observable<User[]> = this.store.select(UserSelectors.selectAllUsers);
  loading$: Observable<boolean> = this.store.select(UserSelectors.selectUsersLoading);
  error$: Observable<string | null> = this.store.select(UserSelectors.selectUsersError);
  selectedUser$: Observable<User | null> = this.store.select(UserSelectors.selectSelectedUser);

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.store.dispatch(UserActions.loadUsers());
  }

  selectUser(userId: number): void {
    this.store.dispatch(UserActions.selectUser({ userId }));
  }

  deleteUser(userId: number): void {
    this.store.dispatch(UserActions.deleteUser({ userId }));
  }
}
```

### NgRx Entity

Для упрощения работы с коллекциями:

```typescript
// store/user/user.reducer.ts
import { createEntityAdapter, EntityState } from '@ngrx/entity';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserState extends EntityState<User> {
  selectedUserId: number | null;
  loading: boolean;
  error: string | null;
}

// Адаптер
export const userAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

// Начальное состояние
export const initialState: UserState = userAdapter.getInitialState({
  selectedUserId: null,
  loading: false,
  error: null
});

// Reducer с адаптером
export const userReducer = createReducer(
  initialState,

  on(UserActions.loadUsersSuccess, (state, { users }) =>
    userAdapter.setAll(users, { ...state, loading: false })
  ),

  on(UserActions.addUserSuccess, (state, { user }) =>
    userAdapter.addOne(user, state)
  ),

  on(UserActions.updateUser, (state, { user }) =>
    userAdapter.updateOne({ id: user.id, changes: user }, state)
  ),

  on(UserActions.deleteUser, (state, { userId }) =>
    userAdapter.removeOne(userId, state)
  )
);

// Селекторы от адаптера
export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = userAdapter.getSelectors(selectUserState);
```

---

## Signals (Angular 16+)

Signals — новый реактивный примитив для управления состоянием.

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <h1>Count: {{ count() }}</h1>
    <h2>Double: {{ doubleCount() }}</h2>

    <button (click)="increment()">+</button>
    <button (click)="decrement()">-</button>
    <button (click)="reset()">Reset</button>
  `
})
export class CounterComponent {
  // Создание signal
  count = signal(0);

  // Computed signal (автоматически пересчитывается)
  doubleCount = computed(() => this.count() * 2);

  // Effect (side effect при изменении сигнала)
  constructor() {
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
      // Вызывается каждый раз при изменении count
    });
  }

  increment(): void {
    // Методы изменения
    this.count.update(value => value + 1);
  }

  decrement(): void {
    this.count.update(value => value - 1);
  }

  reset(): void {
    this.count.set(0);
  }
}
```

### Signals vs Observables

```typescript
import { signal, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Observable, interval } from 'rxjs';

@Component({...})
export class ExampleComponent {
  // Observable -> Signal
  private timer$ = interval(1000);
  timerSignal = toSignal(this.timer$, { initialValue: 0 });

  // Signal -> Observable
  private count = signal(0);
  count$ = toObservable(this.count);

  // Использование в шаблоне
  // Signal: {{ timerSignal() }}
  // Observable: {{ count$ | async }}
}
```

---

## Оптимизация и производительность

### Change Detection

```typescript
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-optimized',
  template: `...`,
  // OnPush - проверяет изменения только при:
  // 1. Изменении @Input ссылки
  // 2. Событии из шаблона
  // 3. Async pipe эмите
  // 4. Ручном вызове markForCheck/detectChanges
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  updateData(): void {
    // Принудительная проверка
    this.cdr.markForCheck();

    // Или полная детекция
    this.cdr.detectChanges();
  }

  // Отключение детекции
  pauseDetection(): void {
    this.cdr.detach();
  }

  // Включение обратно
  resumeDetection(): void {
    this.cdr.reattach();
  }
}
```

### trackBy для ngFor

```html
<div *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</div>
```

```typescript
trackById(index: number, item: Item): number {
  return item.id;
}
```

### Lazy Loading

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module')
      .then(m => m.AdminModule)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(c => c.DashboardComponent)
  }
];
```

### Pure Pipes

```typescript
// Чистый pipe (по умолчанию) - вызывается только при изменении входа
@Pipe({
  name: 'myPipe',
  pure: true // default
})
export class MyPurePipe implements PipeTransform {
  transform(value: any): any {
    return processValue(value);
  }
}

// Нечистый pipe - вызывается при каждой проверке изменений
@Pipe({
  name: 'myImpurePipe',
  pure: false // используйте осторожно!
})
export class MyImpurePipe implements PipeTransform {
  transform(value: any): any {
    return processValue(value);
  }
}
```

### Defer (Angular 17+)

```html
<!-- Ленивая загрузка с условиями -->
@defer (on viewport) {
  <app-heavy-component />
} @placeholder {
  <div>Loading placeholder...</div>
} @loading (minimum 500ms) {
  <app-spinner />
} @error {
  <div>Failed to load component</div>
}

<!-- Условия загрузки -->
@defer (on idle) { ... }           <!-- Когда браузер idle -->
@defer (on viewport) { ... }        <!-- Когда виден во viewport -->
@defer (on interaction) { ... }     <!-- При взаимодействии -->
@defer (on hover) { ... }           <!-- При наведении -->
@defer (on timer(2000)) { ... }     <!-- Через 2 секунды -->
@defer (when condition) { ... }     <!-- При условии -->
@defer (prefetch on idle) { ... }   <!-- Предзагрузка -->
```

---

## Тестирование

### Unit тесты компонента

```typescript
// user-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { UserListComponent } from './user-list.component';
import { UserService } from '../services/user.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  const mockUsers = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
  ];

  beforeEach(async () => {
    // Создание mock сервиса
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers', 'deleteUser']);
    userServiceSpy.getUsers.and.returnValue(of(mockUsers));

    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(userServiceSpy.getUsers).toHaveBeenCalled();
    expect(component.users.length).toBe(2);
  });

  it('should display users in template', () => {
    const userElements = fixture.debugElement.queryAll(By.css('.user-item'));
    expect(userElements.length).toBe(2);
    expect(userElements[0].nativeElement.textContent).toContain('John');
  });

  it('should delete user when delete button clicked', () => {
    userServiceSpy.deleteUser.and.returnValue(of(void 0));

    const deleteButton = fixture.debugElement.query(By.css('.delete-btn'));
    deleteButton.triggerEventHandler('click', null);

    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith(1);
  });
});
```

### Тестирование сервисов

```typescript
// user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Проверка что нет незавершённых запросов
  });

  it('should fetch users', () => {
    const mockUsers = [{ id: 1, name: 'John' }];

    service.getUsers().subscribe(users => {
      expect(users.length).toBe(1);
      expect(users[0].name).toBe('John');
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should create user', () => {
    const newUser = { name: 'Jane', email: 'jane@example.com' };
    const createdUser = { id: 1, ...newUser };

    service.createUser(newUser).subscribe(user => {
      expect(user.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(createdUser);
  });
});
```

---

## Best Practices

### 1. Структура проекта

```
src/app/
├── core/                    # Singleton сервисы, guards, interceptors
│   ├── services/
│   ├── guards/
│   ├── interceptors/
│   └── core.module.ts
├── shared/                  # Переиспользуемые компоненты, pipes, directives
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── shared.module.ts
├── features/               # Feature modules
│   ├── users/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── users.module.ts
│   └── products/
├── store/                  # Root store (если не feature modules)
└── app.module.ts
```

### 2. Именование

```typescript
// Компоненты: kebab-case для файлов, PascalCase для классов
// user-profile.component.ts
export class UserProfileComponent {}

// Сервисы
// user.service.ts
export class UserService {}

// Интерфейсы
// user.model.ts или user.interface.ts
export interface User {}

// Actions (NgRx)
// [Source] Event
export const loadUsers = createAction('[User Page] Load Users');
```

### 3. Подписки

```typescript
// ❌ Плохо - утечка памяти
ngOnInit() {
  this.data$.subscribe(data => this.data = data);
}

// ✅ Хорошо - async pipe
// В шаблоне: {{ data$ | async }}

// ✅ Хорошо - takeUntil
private destroy$ = new Subject<void>();
ngOnInit() {
  this.data$.pipe(takeUntil(this.destroy$)).subscribe();
}
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 4. Immutability

```typescript
// ❌ Плохо - мутация
this.users.push(newUser);

// ✅ Хорошо - новый массив
this.users = [...this.users, newUser];

// ❌ Плохо - мутация объекта
this.user.name = 'New Name';

// ✅ Хорошо - новый объект
this.user = { ...this.user, name: 'New Name' };
```

### 5. Smart и Dumb компоненты

```typescript
// Smart (Container) - работает с данными
@Component({
  selector: 'app-user-list-container',
  template: `
    <app-user-list
      [users]="users$ | async"
      [loading]="loading$ | async"
      (selectUser)="onSelectUser($event)">
    </app-user-list>
  `
})
export class UserListContainerComponent {
  users$ = this.store.select(selectUsers);
  loading$ = this.store.select(selectLoading);

  onSelectUser(id: number) {
    this.store.dispatch(selectUser({ id }));
  }
}

// Dumb (Presentational) - только отображение
@Component({
  selector: 'app-user-list',
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  @Input() users: User[] = [];
  @Input() loading: boolean = false;
  @Output() selectUser = new EventEmitter<number>();
}
```

---

## Полезные ресурсы

- [Angular Documentation](https://angular.io/docs)
- [NgRx Documentation](https://ngrx.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular CLI](https://angular.io/cli)
- [Angular Style Guide](https://angular.io/guide/styleguide)
