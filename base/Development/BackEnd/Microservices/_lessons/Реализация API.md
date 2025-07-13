
## Стратегии реализации API

### Микросервис как точка API

Самый простой вариант - это реализовать каждый МС как отдельную точку для входа для получения данных

Плюсы:
- Это просто

Минусы:
- **Агрегация данных на клиенте**. Самая большая проблема данного подхода заключается в том, что агрегацией данных будет заниматься фронт. То есть на клиенте мы запрашиваем из разных источников разные данные и затем на нём же эти данные объединяем.
- **Повторение логики между приложениями**. Но и так же если у нас появится мобильное приложение, то такую агрегацию нужно будет делать и на этой мобилке. 
- **Отсутствует сквозная авторизация**. Обрабатывать тот же авторизационный токен нужно будет в каждом из МС.

![](_png/Pasted%20image%2020250127203654.png)

### API - gateway

Второй маттерн - это реализация отдельный входной точки в приложение через сервис API. 

В идеальом мире, API - это просто передатчик данных от фронта в МС и обратно. Нам НЕ нужно хранить бизнес-логику внутри API (очень желательно).

Что выносится в API:
- Валидация авторизации
- Ограничение числа запросов. Мы можем вынести немного логики ограничений в API, чтобы укрепить Anti-DDOS.
- Кэширование
- Сбор метрик (скорость ответов, просчёта, длину event loop). Grafana + Prometheus, ELK 
- Логирование и пометка запросов

Плюсы:
- Единая входная точка
- Быстрая агрегация на бэке. В рамках ноды, большие процессы нужно выносить в отдельный Worker (процесс), чтобы не блокировать основной поток. 
- Применим Query / Command паттерн

Минусы:
- **Сбор логики агрегации в одном месте**. Если мы преподготавливаем данные для определённых ответов через сбор всей нужной информации из разных МС, то мы волей-неволей придём к концентрации бизнес-логики в одном АПИ-монолите (разрозненный монолит). Это нужно минимизировать максимально, насколько это возможно. 

![](_png/Pasted%20image%2020250127204941.png)

### BFF (Backend for frontend)

Для каждого приложения пишется своё API, чтобы взаимодействовать только с нужными частями сервисов и самим агрегировать из них нужные для нас данные.

Плюсы:
- Максимизация удобства для Frontend. Удобно, когда под каждый проект есть большие команды (бэкэнд, фронтенд, мобилка)
- Все плюсы API Gateway

Минусы:
- Частичное дублирование логики
- Все минусы API Gateway

![](_png/Pasted%20image%2020250128183851.png)

### GraphQL - Gateweay

Когда мы в качестве API устанавливаем GraphQL, мы получаем всё то же самое, что и API Gateway, но у нас больше договорённостей по данным.

![](_png/Pasted%20image%2020250128184338.png)

### GraphQL Federation

В этом паттерне каждый МС будет иметь свои схемы данных и все сервисы будут общаться по GQL. 

![](_png/Pasted%20image%2020250128184513.png)

## Паттерны получения данных

### Композиция в API Gateway

У МС есть некоторые особенности работы с данными:
Каждый МС должен иметь свою БД. Иметь свою БД должен, потому что если все будут работать с единым источником, то данные будут неконсистентны (пока один читает данные, другой будет эти строки переписывать). Каждый сервис должен работать с данными из своей доменной области и оперировать только ими.

Представим ситуацию. Нам нужно получить обзоры на определённый курс. Данные, нужные для формирования ответа, лежат в разных участках. Получаем курс, к которому нужны review, получаем сами review, получаем отдельные данные из МС Users и далее объединяем поля курса (id курса), пользователей (имя, аватарка) и обзоров (контент) для цельного ответа на клиент. 

Такая композиция данных должна, скорее, происходить прямо в БД, чтобы не занимать основной поток. 

Особенно, когда мы говорим про

![](_png/Pasted%20image%2020250129183818.png)

### Композиция в микросервисах

Одним из подходов можно выделить композицию данных прямо в сервисах.

Однако тут мы тоже сталкиваемся с проблемами, что:
- у нас операции происходят не в БД и занимают поток
- ниже отказоустойчивость

> Однако реализовать такой подход достаточно просто

![](_png/Pasted%20image%2020250129184252.png)

### CQRS

CQRS (Command Query Responsibility Segregation) - это подход, при котором мы разделяем код на методы, которые изменяют состояние и просто читают это состояние. 

| No CQRS                                                                                   | CQRS                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Приходим сразу в апишку и сразу работаем с доменной областью через все возможные операции | Отправляем запрос в API и непосредственно с доменной областью работают только операции изменения данных, а операция на чтение вынесена в отдельный модуль |

В этом случае мы делим CRUD (create, read, update, delete) на две группы, где выносим чтение отдельно. Чтение выносится в отдельный модуль, где данные берутся из вьюшки, которая уже имеет читаемые поля и очищена от ненужных.

Сама View создаётся по ивенту. Когда мы отправляем один из CUD запросов на изменение данных, мы отправляем event в отдельный обработчик Query, который записывает данные в своё view. 

![](_png/Pasted%20image%2020250129184737.png)

>[!info] Почему это актуально?
>Мы не всегда хотим прочитать данные, как это представлено у нас в модели и как мы записываем эти данные. Иногда данные нужно вернуть в другом виде.

### CQRS в микросервисах

Мы отправляем запрос в МС на получение определённых данных. Сам МС может хранить в себе модуль Query, а можно и вынести его отдельно в другой МС (но это реже).

В ситуации, когда мы сразу при триггере какого-либо ивента в других МС, отправляем данные в другой МС, который собирает все эти ивенты и создаёт из них View, мы ускоряем отправку ответа в нужном формате и без сложных агрегаций на клиент.

Плюсы: 
- Эффективная реализация запросов
- Разделение отвественности между View и Domain model

Минусы:
- Временной лаг обновления данных
- Сложность системы

![](_png/Pasted%20image%2020250129190419.png)

Сложности реализации:
- Обработка дублирующих событий (запросы нужно обрабатывать по идентификатору)
- Неконсистентность данных (может не быть финального состояния на момент запроса)
- Возрастающая сложность при нарастании числа событий (чем больше событий, тем дороже их создавать)
- Логирование и пометка запросов (логирование происходящих ивентов для чека стека событий)

## Авторизация на API + Взаимодействие с account

### Инициализация проекта

Создаём новое приложение `api`, которое будет у нас агрегировать все данные из всех микросервисов и хэндлить авторизацию.

В корневом файле добавляем глобавльный префикс `api`, который нужен будет для запросов.

`apps / api / src / main.ts`
```TS
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const globalPrefix = 'api';
	app.setGlobalPrefix(globalPrefix);
	const port = process.env.PORT || 3333;
	await app.listen(port);
	Logger.log(
		`🚀 API is running on: http://localhost:${port}/${globalPrefix}`
	);
}

bootstrap();
```

И заранее удаляем прослушивание порта из первого МС, потому что он вообще не взаимодействует с HTTP. 

`apps / accounts / src / main.ts`
```TS
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	// заменяем listen на init
	await app.init();
	Logger.log(
		`🚀 Accounts is running`
	);
}

bootstrap();
```

### Перенос конфигураций

Далее нужно перенести конфиги подключения RMQ и JWT-секрета из прошлых МС

Однако тут мы вырежем прослушивание определённой очереди, потому что тут не располагается никакой View-базы

`apps / api / src / app / configs / rmq.config.ts`
```TS
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IRMQServiceAsyncOptions } from 'nestjs-rmq';

export const getRMQConfig = (): IRMQServiceAsyncOptions => ({
	inject: [ConfigService],
	imports: [ConfigModule],
	useFactory: (configService: ConfigService) => ({
		exchangeName: configService.get('AMQP_EXCHANGE') ?? '',
		connections: [
			{
				login: configService.get('AMQP_USER') ?? '',
				password: configService.get('AMQP_PASSWORD') ?? '',
				host: configService.get('AMQP_HOSTNAME') ?? ''
			}
		],
		// тут вырезали биндинг к очереди
		prefetchCount: 32,
		serviceName: 'purple-account'
	})
})
```

`apps / api / src / app / configs / jwt.config.ts`
```TS
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt'

export const getJWTConfig = (): JwtModuleAsyncOptions => ({
	imports: [ConfigModule],
	inject: [ConfigService],
	useFactory: (configService: ConfigService) => ({
		secret: configService.get('JWT_SECRET')
	})
});
```

### Перенос DTO аккаунтов

Так же копируем пейлоды (DTOшки из старых МС) авторизации и регистрации.

Сделано таким образом, потому что не всегда данные, которые прилетают извне, равны данным, которые нужно отправить в МС. Закладываем возможность некоторых преобразований. Такой подход будет более архитектурно-правильным.

`apps / api / src / app / dtos / login.dto.ts`
```TS
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
	@IsEmail()
	email: string;

	@IsString()
	password: string;
}
```

`apps / api / src / app / dtos / register.dto.ts`
```TS
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
	@IsEmail()
	email: string;

	@IsString()
	password: string;

	@IsOptional()
	@IsString()
	displayName?: string;
}
```

### JWT-авторизация

Далее нам нужно прокинуть энвы для подключения к RMQ и секрет JWT, который должен совпадать с секретом другого МС. Это нужно, чтобы не ходить никуда в другое место и быстро брать данные для авторизации. 

То есть МС Accounts знает, как авторизовать и зарегистрировать клиента. API имеет только JWT-секрет, чтобы валидировать запрос и не отправлять никаких транзакций в МС Accounts. 

`envs / .api.env`
```ENV
JWT_SECRET=yellow

AMQP_EXCHANGE=purple
AMQP_USER=guest
AMQP_PASSWORD=guest
AMQP_HOSTNAME=localhost
```

Опишем заранее ответ из нашего сервиса авторизации. Он нам возвращает id aka JWT

`libs / interfaces / src / lib / auth.interface.ts`
```TS
export interface IJWTPayload {
	id: string;
}
```

Описываем стратегию JWT-авторизации

`apps / api / src / app / strategies / jwt.strategy.ts`
```TS
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport'
import { IJWTPayload } from '@purple/interfaces';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Инжектим в DI, чтобы иметь доступ к ConfigService из дерева зависимостей
@Injectable()
export class JwtStratagy extends PassportStrategy(Strategy) {
	constructor(configService: ConfigService) {
		super({
			// использовать будем как Bearer токен
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken,
			// Непротухаемый
			ignoreExpiration: true,
			// передаём секрет из конфигсервиса
			secretOrKey: configService.get('JWT_SECRET')
		})
	}

	// мы будем дешифровать те данные, что возвращает login (его id)
	async validate({ id }: IJWTPayload) {
		return id;
	}
}
```

Добавляем гуард авторизации для запросов в контроллере. Он описывает, как мы хотим защитить наш роут.

`apps / api / src / app / guards / jwt.guard.ts`
```TS
import { AuthGuard } from '@nestjs/passport';

export class JWTAuthGuard extends AuthGuard('jwt') {}
```

### Авторизация через createParamDecorator

Этот декторатор будет доставать нашего пользователя в виде его id.

`apps / api / src / app / guards / user.decorator.ts`
```TS
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	return ctx.switchToHttp().getRequest()?.user;
})
```

Далее опишем контроллер пользователя:
- Этот контроллер будет доступен по роуту `/user` (`Controller`)
- Хэндлер информации по пользователю доступен по `/info` (`Post`)
- Гуардим запрос через декоратор `UseGuards` с использованием нашего гуарда `JWTAuthGuard`
- И получаем идентификатор пользователя из запроса через гуард идентификации `UserId`

`apps / api / src / app / controllers / user.controller.ts`
```TS
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JWTAuthGuard } from '../guards/jwt.guard';
import { UserId } from '../guards/user.decorator';

@Controller('user')
export class UserController {
	constructor() {}

	@UseGuards(JWTAuthGuard)
	@Post('info')
	async info(@UserId() userId: string) {}
}
```

### Авторизация через общение с Accounts

Сейчас в API нужно реализовать отправку запросов в МС Accounts по RMQ через метод `send`

Тут мы отдельно используем `RegisterDto` (для прилетевших данных) и `AccountRegister.Request` (для отправляемых), чтобы соблюдать контракты.

`apps / api / src / app / controllers / auth.controller.ts`
```TS
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AccountLogin, AccountRegister } from '@purple/contracts';
import { RMQService } from 'nestjs-rmq';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly rmqService: RMQService
	) {}

	@Post('register')
	async register(@Body() dto: RegisterDto) {
		try {
			return await this.rmqService
				.send<
					AccountRegister.Request, // тип запроса
					AccountRegister.Response // тип ответа
				// топик очереди RMQ, данные запроса
				>(AccountRegister.topic, dto);
		} catch (e) {
			if (e instanceof Error) {
				throw new UnauthorizedException(e.message);
			}
		}
	}

	@Post('login')
	async login(@Body() dto: LoginDto) {
		try {
			return await this.rmqService.send<
				AccountLogin.Request, 
				AccountLogin.Response
			>(AccountLogin.topic, dto);
		} catch (e) {
			if (e instanceof Error) {
				throw new UnauthorizedException(e.message);
			}
		}
	}
}
```

### Связывание контроллеров

- подключаем в корневом модуле оба наших контроллера (авторизации и пользователя)
- подключаем JWT-авторизацию через `JwtModule` (асинхронно+конфиг)
- `RMQModule` (асинхронно+конфиг)
- импортируем `PassportModule` для JWT
- подключаем `ConfigModule` с указанием пути до энвов от корня проекта

`apps / api / src / app / app.module.ts`
```TS
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RMQModule } from 'nestjs-rmq';
import { getJWTConfig } from './configs/jwt.config';
import { getRMQConfig } from './configs/rmq.config';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';

@Module({
	imports: [
		ConfigModule.forRoot({ 
			// путь до энвов
			envFilePath: 'envs/.api.env', 
			// энвы глобальны
			isGlobal: true 
		}),
		RMQModule.forRootAsync(getRMQConfig()),
		JwtModule.registerAsync(getJWTConfig()),
		PassportModule
	],
	controllers: [AuthController, UserController]
})
export class AppModule {}
```

### Запуск

Далее нам нужно поднять композ со всеми конфигами и триггернуть все сервисы

```bash
nx run-many --target=serve --all --parallel=10
```

![](_png/Pasted%20image%2020250129202934.png)

Теперь отправляем запрос на регистрацию

![](_png/Pasted%20image%2020250129203541.png)

В очереди проскочил этот запрос

![](_png/Pasted%20image%2020250129203608.png)

Далее мы спокойно можем авторизоваться

![](_png/Pasted%20image%2020250129203738.png)

В результате наше API отправляет RMQ запрос на внутренний МС и возвращает ожидаемый ответ на клиент.
