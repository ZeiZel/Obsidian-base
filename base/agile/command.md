---
tags:
  - team
  - management
  - organization
  - roles
---

## IT-команда: структура и роли

Структура современной IT-организации от разработчиков до C-level руководителей. Понимание ролей, ответственностей и взаимодействия между членами команды.


---
### Иерархия IT-организации

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              C-LEVEL (C-Suite)                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │   CEO   │  │   CTO   │  │   COO   │  │   CFO   │  │   CPO   │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────────┘  └────┬────┘           │
└───────┼────────────┼────────────┼────────────────────────┼─────────────────┘
        │            │            │                        │
        ▼            ▼            ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VP / DIRECTOR LEVEL                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │VP Engineering│  │  VP Product  │  │  VP Design   │  │  VP Operations│    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MANAGEMENT LEVEL                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Engineering   │  │Product       │  │Design        │  │Project       │    │
│  │Manager       │  │Manager       │  │Manager       │  │Manager       │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┘    │
└─────────┼──────────────────┼──────────────────┼─────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TEAM LEVEL                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Team Lead │  │Product Owner│  │Lead Designer│  │  Analyst   │            │
│  └─────┬──────┘  └────────────┘  └─────┬──────┘  └────────────┘            │
│        │                               │                                     │
│        ▼                               ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    INDIVIDUAL CONTRIBUTORS                       │       │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │       │
│  │  │ Senior  │ │ Middle  │ │ Junior  │ │Designer │ │   QA    │   │       │
│  │  │Developer│ │Developer│ │Developer│ │         │ │Engineer │   │       │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```


---
### C-Level руководители

#### CEO (Chief Executive Officer)

Генеральный директор — высшее должностное лицо компании.

**Обязанности:**
- Стратегическое видение и направление развития компании
- Принятие ключевых бизнес-решений
- Взаимодействие с советом директоров и инвесторами
- Формирование корпоративной культуры
- Публичное представление компании

**Ключевые метрики:**
- Revenue и прибыльность
- Рыночная доля
- Рост компании (headcount, клиенты)
- Удовлетворённость инвесторов

#### CTO (Chief Technology Officer)

Технический директор — отвечает за техническую стратегию.

**Обязанности:**
- Техническая стратегия и видение
- Выбор технологического стека
- R&D и инновации
- Техническая экспертиза для бизнес-решений
- Найм и развитие технических лидеров

**Взаимодействие:**
- С CEO — трансляция технических возможностей в бизнес-стратегию
- С VP Engineering — делегирование операционного управления
- С Product — техническая feasibility фичей

**Ключевые метрики:**
- Техническое качество продукта
- Инновационность решений
- Scalability и reliability систем
- Технический долг

**Связанные темы:**
- [Архитектура систем](../architecture/architecture.md)
- [System Design](../architecture/System%20Design/System%20Design.md)

#### COO (Chief Operating Officer)

Операционный директор — отвечает за повседневную деятельность.

**Обязанности:**
- Операционная эффективность
- Процессы и их оптимизация
- Управление ресурсами
- Масштабирование операций
- Кросс-функциональная координация

**Ключевые метрики:**
- Операционная эффективность
- Время цикла (cycle time)
- Использование ресурсов
- SLA выполнение

#### CFO (Chief Financial Officer)

Финансовый директор — отвечает за финансы.

**Обязанности:**
- Финансовое планирование и бюджетирование
- Инвестиционные решения
- Отчётность и compliance
- Управление рисками
- M&A (слияния и поглощения)

#### CPO (Chief Product Officer)

Продуктовый директор — отвечает за продуктовую стратегию.

**Обязанности:**
- Продуктовое видение и стратегия
- Портфель продуктов
- Исследование рынка и пользователей
- Roadmap на уровне компании
- Go-to-market стратегия

**Связанные темы:**
- [Agile и Scrum](agile.md)


---
### VP / Director Level

#### VP of Engineering

Вице-президент по разработке — операционное управление разработкой.

**Обязанности:**
- Управление engineering-организацией
- Найм и развитие Engineering Managers
- Процессы разработки и delivery
- Техническое качество
- Бюджет и ресурсы engineering

**Отличие от CTO:**

| CTO | VP Engineering |
|-----|----------------|
| Стратегия и видение | Execution и delivery |
| Внешние коммуникации | Внутренние процессы |
| Инновации и R&D | Операционная эффективность |
| Техническая экспертиза | Управление людьми |

#### VP of Product

Вице-президент по продукту — управление продуктовой командой.

**Обязанности:**
- Управление Product Managers
- Продуктовая стратегия на уровне направления
- Приоритизация между продуктами/командами
- Метрики и OKR продукта

#### VP of Design

Вице-президент по дизайну — управление дизайн-функцией.

**Обязанности:**
- Design system и стандарты
- UX-стратегия
- Управление дизайн-командой
- Design operations


---
### Management Level

#### Engineering Manager (EM)

Менеджер разработки — управление командой разработчиков.

**Обязанности:**
- Найм и увольнение в команде
- Performance management
- 1-on-1 и развитие сотрудников
- Процессы в команде
- Delivery и качество
- Взаимодействие со стейкхолдерами

**Типы EM:**

| Тип | Фокус | Соотношение |
|-----|-------|-------------|
| People-focused | Люди, развитие, культура | 80% people / 20% tech |
| Tech-focused | Архитектура, код, техническое лидерство | 40% people / 60% tech |
| Balanced | Сбалансированный подход | 50% people / 50% tech |

**Связанные темы:**
- [Teamlead Roadmap](Teamlead.md)
- [Как быть хорошим тимлидом](Как%20быть%20хорошим%20тимлидом.md)

#### Product Manager (PM)

Продуктовый менеджер — владелец продукта или его части.

**Обязанности:**
- Понимание пользователей и рынка
- Определение what и why (не how)
- Приоритизация backlog
- Roadmap и стратегия продукта
- Метрики и аналитика
- Go-to-market

**Инструменты:**
- Jira, Linear, Asana — backlog management
- Amplitude, Mixpanel — аналитика
- Figma — прототипы
- Notion, Confluence — документация

**Product Manager vs Product Owner:**

| Product Manager | Product Owner |
|-----------------|---------------|
| Стратегический фокус | Тактический фокус |
| Работа с рынком | Работа с командой |
| Vision и roadmap | Backlog и спринты |
| Исследования и discovery | Execution и delivery |

**Связанные темы:**
- [Agile методологии](agile.md)
- [Scrum](agile.md#Scrum)

#### Project Manager (PjM)

Менеджер проектов — управление проектами и сроками.

**Обязанности:**
- Планирование проектов
- Управление сроками и бюджетом
- Risk management
- Коммуникация со стейкхолдерами
- Отчётность о прогрессе

**Методологии:**
- PMBoK
- PRINCE2
- Agile (Scrum Master функции)

**Project Manager vs Product Manager:**

| Project Manager | Product Manager |
|-----------------|-----------------|
| Сроки и бюджет | Ценность и видение |
| How и when | What и why |
| Временные проекты | Постоянный продукт |
| Delivery focused | Value focused |

#### Design Manager

Менеджер дизайна — управление дизайн-командой.

**Обязанности:**
- Управление дизайнерами
- Design review и качество
- Design operations
- Найм и развитие команды


---
### Team Level

#### Team Lead / Tech Lead

Технический лидер команды.

**Обязанности:**
- Техническое лидерство
- Code review и качество кода
- Архитектурные решения в рамках команды
- Менторинг разработчиков
- Координация с другими командами

**Подробнее:** [Teamlead Roadmap](Teamlead.md)

**Виды Tech Lead:**

| Тип | Описание |
|-----|----------|
| Team Lead | Фокус на людях + техническое лидерство |
| Tech Lead | Фокус на технических решениях |
| Staff Engineer | IC-трек, техническое влияние через экспертизу |

**Связанные темы:**
- [SOLID принципы](../architecture/SOLID%20принципы.md)
- [Clean Architecture](../Books/Чистый%20код/Чистый%20Код%20-%20Роберт%20Мартин.md)
- [CI/CD](../devops/CI-CD.md)

#### Product Owner (PO)

Владелец продукта в Scrum-команде.

**Обязанности:**
- Управление Product Backlog
- Определение приоритетов
- Acceptance criteria
- Демо и приёмка работ
- Связь с бизнесом

**Связанные темы:**
- [Scrum](agile.md#Scrum)
- [Приоритизация бэклога](agile.md#Приоритизация%20бэклога)

#### Scrum Master

Фасилитатор Scrum-процесса.

**Обязанности:**
- Фасилитация Scrum-событий
- Устранение impediments
- Коучинг команды по Agile
- Защита команды от внешних воздействий
- Улучшение процессов

**Связанные темы:**
- [Scrum](agile.md#Scrum)
- [Ретроспектива](agile.md#Ретроспектива)

#### Business Analyst (BA)

Бизнес-аналитик — связь между бизнесом и разработкой.

**Обязанности:**
- Сбор и анализ требований
- Документирование требований (BRD, SRS)
- User stories и acceptance criteria
- Моделирование процессов (BPMN)
- UAT (User Acceptance Testing)

**Артефакты:**
- Business Requirements Document (BRD)
- Software Requirements Specification (SRS)
- Use Cases
- User Stories
- Process diagrams (BPMN)

#### System Analyst

Системный аналитик — технический анализ и проектирование.

**Обязанности:**
- Технические требования
- Интеграционные спецификации
- API design
- Database design
- Техническая документация

**Связанные темы:**
- [REST API](../backend/REST/REST.md)
- [System Design](../architecture/System%20Design/System%20Design.md)


---
### Individual Contributors (IC)

#### Разработчики

##### Frontend Developer

Разработчик пользовательского интерфейса.

**Технологии:**
- HTML, CSS, JavaScript/TypeScript
- React, Vue, Angular
- State management (Redux, MobX, Zustand)
- Тестирование (Jest, Cypress, Playwright)

**Связанные темы:**
- [Frontend](../frontend/frontend.md)
- [JavaScript](../frontend/JavaScript/JavaScript.md)
- [React](../frontend/React/React%20Foundamentals.md)
- [TypeScript](../edge/TypeScript/TypeScript.md)
- [State Managers](../frontend/State%20Managers/Zustand.md)

##### Backend Developer

Разработчик серверной части.

**Технологии:**
- Node.js, Go, Python, Java, PHP
- REST, GraphQL, gRPC
- Databases (PostgreSQL, MongoDB, Redis)
- Message queues (RabbitMQ, Kafka)

**Связанные темы:**
- [Backend](../backend/backend.md)
- [Node.js](../backend/NodeJS/Node.js%20-%20с%20нуля%2C%20основы%20и%20построение%20архитектуры%20приложений.md)
- [REST API](../backend/REST/REST.md)
- [PostgreSQL](../database/PostgreSQL.md)
- [Микросервисы](../backend/Microservices/Микросервисы.md)

##### Fullstack Developer

Разработчик, владеющий frontend и backend.

**Особенности:**
- Широкий технический кругозор
- Способность закрыть задачу end-to-end
- Востребован в небольших командах и стартапах

##### DevOps Engineer / SRE

Инженер по инфраструктуре и надёжности.

**Обязанности:**
- CI/CD pipelines
- Infrastructure as Code
- Мониторинг и alerting
- Incident management
- Автоматизация

**Технологии:**
- Kubernetes, Docker
- Terraform, Ansible
- Prometheus, Grafana
- GitHub Actions, GitLab CI

**Связанные темы:**
- [DevOps](../devops/devops.md)
- [CI/CD](../devops/CI-CD.md)
- [Kubernetes](../devops/kubernetes/Kubernetes%20+%20Helm.md)
- [Docker](../devops/docker/Docker%20+%20Ansible.md)

##### Mobile Developer

Разработчик мобильных приложений.

**Направления:**
- iOS (Swift, SwiftUI)
- Android (Kotlin, Jetpack Compose)
- Cross-platform (React Native, Flutter)

**Связанные темы:**
- [React Native](../mobile/React%20Native/React%20Native.md)

#### QA Engineer

Инженер по обеспечению качества.

**Виды тестирования:**
- Manual testing
- Automated testing (UI, API)
- Performance testing
- Security testing

**Уровни QA:**

| Уровень | Обязанности |
|---------|-------------|
| Junior QA | Выполнение тест-кейсов, баг-репорты |
| Middle QA | Написание тест-кейсов, автотесты |
| Senior QA | Тест-стратегия, архитектура автотестов |
| QA Lead | Управление QA-командой, процессы |

**Связанные темы:**
- [Тестирование](../testing/testing.md)

#### Designer

##### UX Designer

Дизайнер пользовательского опыта.

**Обязанности:**
- User research
- Information architecture
- Wireframing и прототипирование
- Usability testing
- User flows и journey maps

##### UI Designer

Дизайнер пользовательского интерфейса.

**Обязанности:**
- Visual design
- Design system
- Иконки и иллюстрации
- Анимации и микро-взаимодействия

##### Product Designer

Продуктовый дизайнер = UX + UI + продуктовое мышление.

**Обязанности:**
- End-to-end дизайн фичей
- Участие в product discovery
- Метрики и аналитика дизайна
- A/B тестирование дизайн-решений

**Инструменты:**
- Figma, Sketch
- Miro, FigJam
- Principle, Framer

**Связанные темы:**
- [Design](../Design/Design.md)
- [Figma](../Design/Figma.md)

#### Data Engineer / Data Scientist

##### Data Engineer

Инженер данных — инфраструктура для данных.

**Обязанности:**
- ETL/ELT pipelines
- Data warehouses
- Data lakes
- Data quality

**Технологии:**
- Apache Spark, Airflow
- BigQuery, Redshift, Snowflake
- Python, SQL

##### Data Scientist

Специалист по анализу данных и ML.

**Обязанности:**
- Анализ данных
- Machine Learning модели
- Статистические исследования
- A/B тестирование

**Связанные темы:**
- [AI and Data Science](../ai/AI%20and%20Data%20Science.md)

#### Technical Writer

Технический писатель — документация.

**Обязанности:**
- API документация
- User guides
- Internal documentation
- Release notes


---
### Грейды разработчиков

#### Junior Developer

**Характеристики:**
- 0-2 года опыта
- Выполняет задачи под руководством
- Учится паттернам и практикам
- Требует code review и менторинга

**Ожидания:**
- Выполнение простых задач
- Следование code style
- Базовое понимание инструментов
- Активное обучение

**Что развивать:**
- Технические навыки
- Понимание кодовой базы
- Самостоятельность
- Коммуникация

#### Middle Developer

**Характеристики:**
- 2-5 лет опыта
- Самостоятельно выполняет задачи
- Участвует в code review
- Может менторить junior

**Ожидания:**
- Самостоятельная работа над фичами
- Качественный код без постоянного контроля
- Участие в архитектурных обсуждениях
- Оценка задач

**Что развивать:**
- Системное мышление
- Архитектурные навыки
- Soft skills
- Менторинг

#### Senior Developer

**Характеристики:**

- 5+ лет опыта
- Технический лидер в команде
- Принимает архитектурные решения
- Менторит middle и junior

**Ожидания:**

- Архитектурные решения
- Техническое лидерство
- Code review и стандарты
- Оценка рисков
- Документация решений

**Влияние:**

- Команда (5-10 человек)
- Продукт/модуль

**Связанные темы:**

- [SOLID принципы](../architecture/SOLID%20принципы.md)
- [Архитектура](../architecture/Architecture/Architecture.md)

#### Staff / Principal Engineer

**Характеристики:**
- 8+ лет опыта
- Техническое влияние на несколько команд
- Стратегические технические решения
- Определяет технические стандарты

**Ожидания:**
- Кросс-командное влияние
- Технические инициативы компании
- Менторинг senior developers
- Внешние выступления и статьи

**Влияние:**
- Несколько команд / направление
- Техническая культура компании


---
### Роль AI в командах разработки

#### AI как инструмент разработчика

Искусственный интеллект трансформирует процесс разработки на всех уровнях.

**AI-инструменты для разработки:**

| Категория | Инструменты | Применение |
|-----------|-------------|------------|
| Code completion | GitHub Copilot, Cursor, Codeium | Автодополнение, генерация кода |
| Code review | CodeRabbit, Codacy AI | Автоматический анализ PR |
| Testing | Diffblue, Testim | Генерация тестов |
| Documentation | Mintlify, Readme AI | Автоматическая документация |
| Debugging | Sentry AI, Datadog AI | Анализ ошибок |

**Связанные темы:**
- [AI Engineering](../ai/AI%20Engineering.md)
- [AI Instruments](../ai/AI%20Instruments.md)
- [AI Prompts](../ai/AI%20Prompts.md)

#### AI и грейды разработчиков

**Влияние AI на разные уровни:**

| Грейд | Влияние AI | Изменение роли |
|-------|-----------|----------------|
| Junior | Высокое | AI ускоряет обучение, помогает с рутиной |
| Middle | Среднее | AI усиливает продуктивность |
| Senior | Низкое | Фокус на architecture, AI как инструмент |
| Staff | Минимальное | Стратегия, AI governance |

**Junior + AI:**
- AI как персональный ментор
- Быстрое понимание кодовой базы
- Ускоренное обучение паттернам
- Помощь с базовыми задачами

**Middle + AI:**
- Автоматизация рутинных задач
- Быстрое прототипирование
- Генерация тестов
- Code review assistance

**Senior + AI:**
- AI для exploration of solutions
- Автоматизация документации
- Анализ технического долга
- Обучение AI-инструментам команды

#### AI как член команды

**AI Agent в команде:**

AI-агенты могут выполнять определённые роли:

| Роль AI Agent | Функции |
|---------------|---------|
| Code Reviewer | Автоматический анализ PR |
| Test Writer | Генерация unit/integration тестов |
| Doc Writer | Документация кода и API |
| Bug Triager | Классификация и приоритизация багов |
| Support Bot | Первая линия поддержки |

**Связанные темы:**
- [AI Agent](../ai/AI%20Agent.md)

#### AI Governance

**Вопросы для команды:**
- Какие AI-инструменты разрешены?
- Как проверять AI-сгенерированный код?
- Политика использования данных
- Ответственность за AI-код

**Best Practices:**
1. Code review для AI-кода обязателен
2. Понимание сгенерированного кода
3. Тестирование AI-кода
4. Не передавать sensitive данные в AI


---
### Типичные команды

#### Scrum Team (5-9 человек)

```
┌─────────────────────────────────────────┐
│              SCRUM TEAM                 │
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │Product Owner│  │Scrum Master │       │
│  └─────────────┘  └─────────────┘       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      Development Team           │    │
│  │  ┌────────┐ ┌────────┐          │    │
│  │  │Frontend│ │Backend │          │    │
│  │  └────────┘ └────────┘          │    │
│  │  ┌────────┐ ┌────────┐          │    │
│  │  │  QA    │ │Designer│          │    │
│  │  └────────┘ └────────┘          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Связанные темы:**
- [Scrum](agile.md#Scrum)

#### Feature Team

Команда, способная доставить фичу end-to-end.

**Состав:**

- Product Owner / PM
- Frontend Developer(s)
- Backend Developer(s)
- QA Engineer
- Designer (часто shared)
- Tech Lead (опционально)

#### Platform Team

Команда, создающая внутренние инструменты для других команд.

**Состав:**

- Tech Lead
- Backend/Infra Engineers
- DevOps/SRE
- Technical Writer

**Продукты:**

- Internal APIs
- Developer tools
- Infrastructure components


---
### Взаимодействие ролей

#### Типичный flow разработки фичи

```
Business Need
      │
      ▼
┌─────────────┐
│     PM      │──→ Исследование, user stories
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Designer   │──→ UX research, wireframes, UI
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Analyst   │──→ Требования, спецификации
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Tech Lead  │──→ Technical design, декомпозиция
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Developers  │──→ Implementation
└─────┬───────┘
      │
      ▼
┌─────────────┐
│     QA      │──→ Тестирование
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   DevOps    │──→ Deploy
└─────┬───────┘
      │
      ▼
   Release
```

#### RACI Matrix (пример)

| Активность | PM | Designer | Dev | QA | DevOps |
|------------|----|---------|----|----|----|
| Требования | R | C | C | I | I |
| UX Design | A | R | C | I | I |
| Development | I | C | R | C | I |
| Testing | I | I | C | R | I |
| Deployment | I | I | C | C | R |

**R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed


---
### Career Tracks

#### Individual Contributor (IC) Track

```
Junior → Middle → Senior → Staff → Principal → Distinguished
```

Фокус на техническое мастерство и влияние через экспертизу.

#### Management Track

```
Tech Lead → Engineering Manager → Director → VP → CTO
```

Фокус на людей, процессы и организационное влияние.

#### Переход между треками

| IC → Management | Management → IC |
|-----------------|-----------------|
| Желание развивать людей | Желание hands-on работы |
| Soft skills развиты | Технические навыки актуальны |
| Готовность отказаться от кода | Готовность к меньшему scope |


---
### Масштабирование команд

#### Закон Брукса

> "Добавление людей к опаздывающему проекту задерживает его ещё больше"

#### Two-Pizza Rule (Amazon)

Команда должна быть достаточно маленькой, чтобы накормить её двумя пиццами (5-8 человек).

#### Team Topologies

**Типы команд:**

| Тип                   | Описание                                   |
| --------------------- | ------------------------------------------ |
| Stream-aligned        | Команда, ориентированная на поток ценности |
| Platform              | Команда, создающая платформу для других    |
| Enabling              | Команда, помогающая другим командам        |
| Complicated-subsystem | Команда для сложных технических подсистем  |

**Связанные темы:**
- [Масштабирование Agile](agile.md#Масштабирование%20Agile)



---
### Культура и ценности

#### Психологическая безопасность

Ключевой фактор эффективности команды (исследование Google Project Aristotle).

**Признаки:**

- Можно задавать "глупые" вопросы
- Ошибки воспринимаются как обучение
- Конфликты обсуждаются открыто
- Идеи принимаются независимо от источника

#### Инженерная культура

**Характеристики здоровой инженерной культуры:**

- Ownership и ответственность
- Continuous learning
- Blameless post-mortems
- Documentation culture
- Code review как обучение

**Связанные темы:**
- [DISC модель](DISC.md)
- [Team](Team.md)


---
### Ресурсы

#### Книги

- [The Manager's Path](https://www.amazon.com/Managers-Path-Leaders-Navigating-Growth/dp/1491973897) — Camille Fournier
- [An Elegant Puzzle](https://www.amazon.com/Elegant-Puzzle-Systems-Engineering-Management/dp/1732265186) — Will Larson
- [Team Topologies](https://teamtopologies.com/) — Matthew Skelton, Manuel Pais
- [The Phoenix Project](https://www.amazon.com/Phoenix-Project-DevOps-Helping-Business/dp/0988262509)
- [Accelerate](https://www.amazon.com/Accelerate-Software-Performing-Technology-Organizations/dp/1942788339)

#### Ссылки

- [Engineering Ladders](https://www.engineeringladders.com/)
- [Progression.fyi](https://www.progression.fyi/)
- [levels.fyi](https://www.levels.fyi/)
- [StaffEng](https://staffeng.com/)
- [LeadDev](https://leaddev.com/)
