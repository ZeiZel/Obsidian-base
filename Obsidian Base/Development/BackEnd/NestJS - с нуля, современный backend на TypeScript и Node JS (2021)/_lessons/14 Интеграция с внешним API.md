
## 1. Обзор модуля

Нам нужно будет подключить два внешних API для работы с данными, которые мы можем получить с *hh.ru*:
- `HttpModule` - позволяет отправлять Htttp-запросы
- `Schedule` - позволяет выполнять запросы по определённому расписанию

Такая связка часто используется, чтобы доставать и загружать определённые данные по расписанию

![](_png/Pasted%20image%2020230407100008.png)

Порядок действий:

[Тут](https://github.com/hhru/api) находится документация по АПИ *hh.ru* 

![](_png/Pasted%20image%2020230407100720.png)

## 2. Подготовка моделей

По полученной выше документации запрос на вакансии по запросу `typescript`, мы получаем такой ответ:

![](_png/Pasted%20image%2020230407101336.png)

Добавляем модуль и сервис **hh**

```bash
nest g module hh
nest g service hh --no-spec
```

Модель описана интерфейсами по той причине, что нам нет нужды валидировать её (сторонний АПИ как-никак).

Тут мы описываем ответ по тем данным, которые приходят к нам с *hh.ru*

`src > hh > hh.model.ts`
```TS
// ответ от hh.ru
export interface HhResponse {
	items: Vacancy[];
	found: number;
	pages: number;
	per_page: number;
	page: number;
	clusters: Cluster[];
	arguments?: any;
	alternate_url: string;
}

// это отдельный кластер
export interface Cluster {
	name: string;
	id: string;
	items: ClusterElement[];
}

// отдельный элемент кластера
export interface ClusterElement {
	name: string;
	url: string;
	count: number;
}

// вакансия
export interface Vacancy {
	id: string;
	premium: boolean;
	name: string;
	department?: any;
	has_test: boolean;
	response_letter_required: boolean;
	area: Area;
	salary?: Salary;
	type: Type;
	address?: Address;
	response_url?: any;
	sort_point_distance?: any;
	published_at: string;
	created_at: string;
	archived: boolean;
	apply_alternate_url: string;
	insider_interview?: any;
	url: string;
	alternate_url: string;
	relations: any[];
	employer: Employer;
	snippet: Snippet;
	contacts?: Contact;
	schedule: Type;
	working_days: any[];
	working_time_intervals: any[];
	working_time_modes: any[];
	accept_temporary: boolean;
}

// контакты в вакансии
export interface Contact {
	name: string;
	email: string;
	phones: Phone[];
}

// телефон
export interface Phone {
	comment?: any;
	city: string;
	number: string;
	country: string;
}

//
export interface Snippet {
	requirement?: string;
	responsibility?: string;
}

// сотрудник
export interface Employer {
	id: string;
	name: string;
	url: string;
	alternate_url: string;
	logo_urls?: Logourl;
	vacancies_url: string;
	trusted: boolean;
}

//
export interface Logourl {
	'90': string;
	'240': string;
	original: string;
}

//
export interface Address {
	city?: string;
	street?: string;
	building?: string;
	description?: any;
	lat?: number;
	lng?: number;
	raw?: string;
	metro?: Metro;
	metro_stations: Metro[];
	id: string;
}

//
export interface Metro {
	station_name: string;
	line_name: string;
	station_id: string;
	line_id: string;
	lat: number;
	lng: number;
}

//
export interface Type {
	id: string;
	name: string;
}

//
export interface Salary {
	from: number;
	to?: number;
	currency: string;
	gross: boolean;
}

//
export interface Area {
	id: string;
	name: string;
	url: string;
}
```

Первым делом мы экспортируем наш сервис топ-пейджа, чтобы воспользоваться им в `HhModule`

`src > top-page > top-page.module.ts`
```TS
@Module({  
   controllers: [TopPageController],  
   imports: [  
      TypegooseModule.forFeature([  
         {  
            typegooseClass: TopPageModel,  
            schemaOptions: {  
               collection: 'TopPage',  
            },  
         },  
      ]),  
   ],  
   providers: [TopPageService],  
   exports: [TopPageService],  
})  
export class TopPageModule {}
```

Импортируем в `HhModule` сервис топ-пейджа, методы которого будем вызвать в данном модуле

`src > hh > hh.module.ts`
```TS
import { Module } from '@nestjs/common';
import { HhService } from './hh.service';
import { TopPageService } from '../top-page/top-page.service';

@Module({
	providers: [HhService],
	imports: [TopPageService],
})
export class HhModule {}
```

В сервисе топ-пейджа нужно будет добавить метод `findForHhUpdate()`, который будет искать **Курсы** для обновления данных **hh** (будем обновлять зарплаты в них)

`src > top-page > top-page.service.ts`
```TS
// метод, который будет искать все те записи, которые нужно обновить
async findForHhUpdate(date: Date) {
	return this.topPageModel
		.find({
			firstCategory: 0,
			// обращаемся к вложенному свойству
			'hh.updatedAt': {
				// ищем дату старше, чем текущая дата -1 день
				$lt: addDays(date, -1),
			},
		})
		.exec();
}
```

Так же нам нужно будет добавить дату обновления в модель топ-пейджа

`src > top-page > top-page.model.ts`
```TS
export class HhData {
	@prop()
	count: number; // количество вакансий

	@prop()
	juniorSalary: number;

	@prop()
	middleSalary: number;

	@prop()
	seniorSalary: number;

	@prop()
	updatedAt: Date; // дата
}
```

Так же добавляем дату в модель создания топ-пейджа

`src > top-page > create-top-page.model.ts`
```TS
export class HhDataDto {  
   @IsNumber()  
   count: number;  
  
   @IsNumber()  
   juniorSalary: number;  
  
   @IsNumber()  
   middleSalary: number;  
  
   @IsNumber()  
   seniorSalary: number;  
  
   @IsDate()  
   updatedAt: Date; // дата  
}
```

## 3. HttpModule











## 4. ScheduleModule




