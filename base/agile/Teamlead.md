---
tags:
  - scrum
  - agile
  - teamlead
  - management
---

## Teamlead Roadmap

Карта компетенций технического лидера, адаптируемая под различные организации. Roadmap состоит из двух основных частей: **Роли и обязанности** (что делает тимлид) и **Личные навыки** (как он это делает).

> Каждая методология — это набор правил, ритуалов и артефактов, помогающих команде двигаться в определённом направлении.

**Связанные материалы:**
- [Agile и Scrum методологии](agile.md) — подробно о фреймворках и практиках
- [Структура IT-команды](command.md) — роли, грейды, иерархия
- [Как быть хорошим тимлидом](Как%20быть%20хорошим%20тимлидом.md) — практические советы
- [DISC модель](DISC.md) — типы личностей в команде
- [Team](Team.md) — командная работа


---
### Роли и обязанности

#### Administrator

Роль, отвечающая за построение и поддержание процессов разработки, управление проектами и взаимодействие со стейкхолдерами.

##### Построение цикла разработки

###### Разработка

**Готовые подходы**

- Lean
- [Scrum](agile.md#Scrum) — итеративная разработка спринтами
- [Kanban](agile.md#Kanban) — визуализация потока работы
- XP (Extreme Programming) — инженерные практики
- [SAFe](agile.md#SAFe) (Scaled Agile Framework) — масштабирование Agile

**Подробнее:** [Agile методологии и фреймворки](agile.md)

**Конструирование методологии**

Создание собственных методологий разработки, адаптированных под специфику команды и проекта. Включает выбор и комбинирование практик из различных фреймворков для формирования эффективного процесса.

**Ключевые принципы:**
- Методология должна соответствовать ценностям команды
- Чем проще работающая методология — тем лучше
- Постепенное внедрение практик вместо единовременного навязывания
- Автоматизация рутинных процессов для экономии времени коллег

**Фазы внедрения:**

| Фаза | Действия |
|------|----------|
| Подготовка | User Story документация, выбор инструментов, обсуждение с командой |
| Внедрение | Постепенная раскатка, уважение ко времени коллег, простота |
| Поддержка | Выделение времени на процессы, быстрое исправление ошибок |

**Антипаттерны:**
- Навязывание методологии сверху
- Частая смена методологий
- Cargo-cult ритуалы без понимания их цели
- Несоответствие между ценностями команды и допущениями методологии

**Ресурсы:**
- [Конструирование методологии](https://tlroadmap.io/roles/administrator/development-cycle/development/methodology.html)
- [Методологии разработки ПО](https://ru.wikipedia.org/wiki/Методология_разработки_программного_обеспечения)
- [Agile методологии](https://www.atlassian.com/agile)
- [Scrum Guide](https://scrumguides.org/)
- [Kanban Guide](https://kanban.university/kanban-guide/)

###### Получение задач

Процесс получения, анализа и приоритизации входящих задач. Включает фильтрацию запросов, оценку их важности и срочности, распределение по команде.

**Пайплайн обработки задач:**

```
Входящий запрос → Фильтрация → Декомпозиция → Оценка → Приоритизация → Backlog
```

**Инструменты:**
- Jira, Linear, YouTrack — трекеры задач
- Notion, Confluence — документация требований
- Miro, FigJam — визуализация и декомпозиция

**Техники приоритизации:**
- MoSCoW (Must, Should, Could, Won't)
- RICE (Reach, Impact, Confidence, Effort)
- ICE (Impact, Confidence, Ease)
- Weighted Shortest Job First (WSJF)

**Ресурсы:**
- [Получение задач](https://tlroadmap.io/roles/administrator/development-cycle/task-inbox.html)
- [Приоритизация задач](https://www.atlassian.com/agile/project-management/epics-stories-themes)
- [RICE Framework](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/)

###### Выпуск задач

Процесс завершения и выпуска выполненных задач.

**Приёмка**

Процесс проверки и принятия выполненной работы, соответствия требованиям и стандартам качества.

**Чеклист приёмки:**
- [ ] Соответствие Definition of Done
- [ ] Прохождение code review
- [ ] Успешные автотесты
- [ ] Документация обновлена
- [ ] Демонстрация стейкхолдерам

**Раскатка (Deployment)**

Процесс развёртывания готового функционала в production.

**Стратегии деплоя:**

| Стратегия | Описание | Риск |
|-----------|----------|------|
| Blue-Green | Два идентичных окружения, переключение трафика | Низкий |
| Canary | Постепенное увеличение % пользователей | Низкий |
| Rolling | Последовательное обновление инстансов | Средний |
| Big Bang | Одновременное обновление всего | Высокий |

**Ресурсы:**
- [Приёмка](https://tlroadmap.io/roles/administrator/development-cycle/release/acceptance.html)
- [Раскатка](https://tlroadmap.io/roles/administrator/development-cycle/release/rollout.html)
- [Blue-Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Canary Releases](https://martinfowler.com/bliki/CanaryRelease.html)
- [Feature Flags](https://launchdarkly.com/blog/what-are-feature-flags/)

##### Проектное управление

Методологии и подходы к управлению проектами для эффективного планирования, контроля и завершения проектов.

###### P3Express

Упрощённая методология управления проектами на основе PRINCE2, адаптированная для небольших и средних проектов. Фокус на практичности и минимизации бюрократии.

**Ключевые элементы:**
- 37 активностей, распределённых по 7 фазам
- Адаптивность под размер проекта
- Интеграция с Agile-практиками

**Ресурсы:**
- [P3Express](https://tlroadmap.io/roles/administrator/project-manager/p3express.html)
- [P3Express методология](https://www.p3express.com/)
- [P3Express Framework](https://www.p3express.com/framework/)

###### PDCA

PDCA (Plan-Do-Check-Act) — цикл Деминга для непрерывного улучшения процессов.

```
    ┌─────────┐
    │  PLAN   │ → Определить цели и процессы
    └────┬────┘
         ↓
    ┌─────────┐
    │   DO    │ → Выполнить запланированное
    └────┬────┘
         ↓
    ┌─────────┐
    │  CHECK  │ → Проверить результаты
    └────┬────┘
         ↓
    ┌─────────┐
    │   ACT   │ → Скорректировать и стандартизировать
    └────┬────┘
         ↓
    (повторить)
```

**Применение:**
- Улучшение процессов разработки
- Решение повторяющихся проблем
- Внедрение новых практик

**Ресурсы:**
- [PDCA](https://tlroadmap.io/roles/administrator/project-manager/pdca.html)
- [PDCA цикл](https://ru.wikipedia.org/wiki/PDCA)
- [Цикл Деминга](https://www.lean.org/lexicon/pdca)

###### PMBoK

PMBoK (Project Management Body of Knowledge) — свод знаний по управлению проектами от PMI.

**10 областей знаний PMBoK:**
1. Управление интеграцией
2. Управление содержанием
3. Управление расписанием
4. Управление стоимостью
5. Управление качеством
6. Управление ресурсами
7. Управление коммуникациями
8. Управление рисками
9. Управление закупками
10. Управление заинтересованными сторонами

**Ресурсы:**
- [PMBoK](https://tlroadmap.io/roles/administrator/project-manager/pmbok.html)
- [PMBoK Guide](https://www.pmi.org/pmbok-guide-standards/foundational/pmbok)
- [PMBoK на русском](https://ru.wikipedia.org/wiki/PMBOK)

###### Дополнительные фреймворки

- **OKR** (Objectives and Key Results) — целеполагание
- **PRINCE2** — процессный подход к управлению проектами
- **Lean Six Sigma** — устранение потерь и дефектов

##### Стейкхолдинг

Управление заинтересованными сторонами проекта.

**Определение:** Стейкхолдер — человек, чьи действия, поведение или решения могут повлиять на результаты проекта.

**Матрица стейкхолдеров (Influence/Interest Grid):**

|  | Низкий интерес | Высокий интерес |
|--|----------------|-----------------|
| **Высокое влияние** | Consultant (консультировать) | Partner (активно вовлекать) |
| **Низкое влияние** | Temporary Worker (минимум контакта) | Support (информировать) |

**Роли стейкхолдеров:**

| Роль | Влияние | Важность | Стратегия |
|------|---------|----------|-----------|
| Partner | Высокое | Высокая | Постоянное вовлечение, проактивность |
| Consultant | Высокое | Низкая | Консультации по ключевым решениям |
| Support | Низкое | Высокая | Регулярное информирование |
| Temporary Worker | Низкое | Низкая | Минимальное взаимодействие |

**Практики работы:**
1. Уточнить свою роль с исполнителями проекта
2. Установить процессы взаимодействия (даты, критерии успеха)
3. Запрашивать обратную связь о своей работе
4. Периодически пересматривать роль при изменении контекста

**Последствия плохой практики:**
- Снижение влияния на проект
- Разочарование зависимых сторон
- Избыточные переработки из-за поздно выявленных ожиданий

**Ресурсы:**
- [Стейкхолдинг](https://tlroadmap.io/roles/administrator/stakeholding.html)
- [Управление стейкхолдерами](https://ru.wikipedia.org/wiki/Заинтересованная_сторона)
- [Stakeholder Management](https://www.pmi.org/learning/library/stakeholder-management-project-success-11168)
- [Stakeholder Analysis](https://www.mindtools.com/pages/article/newPPM_07.htm)


---

#### Integrator

Роль связующего звена между бизнесом и технической командой.

##### Знание бизнеса

Понимание бизнес-модели компании, источников дохода, ключевых метрик и стратегических целей.

**Ключевые области:**
- Бизнес-модель и монетизация
- Unit-экономика продукта
- Ключевые метрики (North Star Metric, KPI)
- Конкурентная среда

**Ресурсы:**
- [Знание бизнеса](https://tlroadmap.io/roles/integrator/business-knowledge.html)
- [Business Model Canvas](https://www.strategyzer.com/canvas/business-model-canvas)
- [Lean Canvas](https://leanstack.com/lean-canvas)

##### Структура компании

Понимание организационной структуры, процессов принятия решений, ключевых людей и их зон ответственности.

**Важно знать:**
- Формальная и неформальная структура власти
- Процессы эскалации
- Ключевые decision makers
- Зоны ответственности смежных команд

**Ресурсы:**
- [Структура компании](https://tlroadmap.io/roles/integrator/company-structure.html)
- [Organizational Structure Types](https://www.atlassian.com/work-management/project-management/organizational-structure)

##### Корпоративная культура

Понимание ценностей, норм поведения и негласных правил организации.

**Элементы культуры:**
- Ценности компании
- Стиль коммуникации
- Отношение к ошибкам
- Work-life balance
- Процессы признания и награждения

**Ресурсы:**
- [Корпоративная культура](https://tlroadmap.io/roles/integrator/corporate-culture.html)
- [Culture Map](https://hbr.org/2014/01/the-culture-map-decoding-how-people-think-and-get-things-done)


---

#### People Manager

Роль, отвечающая за развитие людей и команды.

##### Управление людьми

###### Административная работа

Рутинные управленческие задачи: оформление отпусков, больничных, справок, контроль табеля.

**Инструменты:**
- HRIS системы (BambooHR, Workday)
- Таблицы учёта рабочего времени
- Календари команды

**Ресурсы:**
- [Административная работа](https://tlroadmap.io/roles/people-manager/people-management/admin.html)

###### Делегирование

Передача полномочий и ответственности членам команды для развития сотрудников и освобождения времени руководителя.

**Преимущества делегирования:**

| Для руководителя | Для сотрудника | Для команды |
|------------------|----------------|-------------|
| Освобождение времени | Возможности роста | Увеличение автономии |
| Развитие преемников | Расширение полномочий | Кросс-функциональность |
| Снижение bus factor | Карьерный рост | Меньше единых точек отказа |

**7 уровней делегирования (Jurgen Appelo):**

1. **Tell** — принять решение и сообщить
2. **Sell** — принять решение и убедить
3. **Consult** — получить совет, затем решить
4. **Agree** — достичь консенсуса
5. **Advise** — дать совет, решение за сотрудником
6. **Inquire** — узнать о решении после факта
7. **Delegate** — полная передача полномочий

**Практики:**
1. Провести аудит своих задач — что можно делегировать завтра?
2. Подобрать подходящий уровень делегирования
3. Назначить задачу, контролировать результат
4. После нескольких успешных итераций — передать полную ответственность

**Признаки плохого делегирования:**
- Критичные задачи не делегируются
- Нет контроля выполнения
- Несоответствие сложности задач и уровня сотрудника
- Неясные дедлайны и критерии успеха
- Перегрузка отдельных людей

**Ресурсы:**
- [Делегирование](https://tlroadmap.io/roles/people-manager/people-management/delegation.html)
- [Management 3.0 Delegation Poker](https://management30.com/practice/delegation-poker/)
- [Delegation Framework](https://www.mindtools.com/pages/article/newLDR_98.htm)

###### Развитие

Содействие профессиональному и личностному росту сотрудников.

**Инструменты развития:**
- Individual Development Plan (IDP)
- Менторинг и коучинг
- Ротация задач
- Обучающие программы
- Конференции и митапы

**Модель 70-20-10:**
- 70% — обучение через опыт (рабочие задачи)
- 20% — обучение через других (менторинг, обратная связь)
- 10% — формальное обучение (курсы, книги)

**Ресурсы:**
- [Развитие](https://tlroadmap.io/roles/people-manager/people-management/development.html)
- [70-20-10 Model](https://trainingindustry.com/wiki/strategy-alignment-and-planning/the-702010-model-for-learning-and-development/)

###### Обратная связь

Предоставление и получение фидбека для улучшения работы и развития сотрудников.

**Типы обратной связи:**

| Тип | Частота | Своевременность | Полнота |
|-----|---------|-----------------|---------|
| Периодический | По циклам (1-on-1, ревью) | Средняя | Высокая |
| Непрерывный | В процессе работы | Высокая | Низкая |
| Ситуационный | По событиям | Контролируемая | Контролируемая |

**Модели обратной связи:**

- **SBI** (Situation-Behavior-Impact)
- **COIN** (Context-Observation-Impact-Next steps)
- **Feedback Sandwich** (позитив-критика-позитив) — спорная модель

**Хорошие практики:**
- Получить разрешение перед предоставлением фидбека
- Баланс конструктивной критики и позитива
- Личная доставка в приватной беседе
- Своевременность — сразу после наблюдения
- Объяснение причин — почему поведение уместно/неуместно
- Запрашивать фидбек о себе у коллег

**Плохие практики:**
- Непрошеный фидбек
- Только негативный или только позитивный
- Отложенные письменные отчёты (спустя недели)

**Ресурсы:**
- [Обратная связь](https://tlroadmap.io/roles/people-manager/people-management/feedback.html)
- [Radical Candor](https://www.radicalcandor.com/)
- [Книга: Фидбек (Елена Золина, Игорь Манн)](https://www.mann-ivanov-ferber.ru/books/fidbek/)

###### Увольнение

Процесс расставания с сотрудником — как инициированный компанией, так и добровольный уход.

**Виды увольнений:**
- По инициативе работодателя (performance issues)
- По инициативе сотрудника
- По соглашению сторон

**Процесс:**
1. Документирование проблем с performance
2. Performance Improvement Plan (PIP)
3. Принятие решения
4. Exit interview
5. Передача дел
6. Offboarding

**Ресурсы:**
- [Увольнение](https://tlroadmap.io/roles/people-manager/people-management/firing.html)
- [Exit Interview Best Practices](https://www.shrm.org/resourcesandtools/tools-and-samples/toolkits/pages/conductingexitinterviews.aspx)

###### Найм

**Профиль кандидата**

Описание идеального кандидата: hard skills, soft skills, опыт, культурное соответствие.

**Компоненты профиля:**
- Технические требования (must have / nice to have)
- Поведенческие компетенции
- Культурный fit
- Потенциал роста

**Собеседования**

Процесс оценки кандидатов на соответствие профилю.

**Типы интервью:**
- Скрининг (HR)
- Техническое интервью
- System Design (для senior+)
- Поведенческое интервью (STAR method)
- Cultural fit

**STAR метод:**
- **S**ituation — опишите ситуацию
- **T**ask — какая была задача
- **A**ction — что вы сделали
- **R**esult — каков результат

**Onboarding**

Процесс адаптации нового сотрудника.

**Чеклист онбординга:**
- [ ] Доступы к системам
- [ ] Знакомство с командой
- [ ] Buddy/mentor назначен
- [ ] Первые задачи определены
- [ ] 30-60-90 plan составлен
- [ ] Регулярные check-in встречи

**Тестовый период**

Испытательный срок для оценки соответствия ожиданиям.

**Практики:**
- Чёткие критерии успешного прохождения
- Регулярная обратная связь
- Промежуточные check-points
- Финальная оценка с решением

**Ресурсы:**
- [Собеседования](https://tlroadmap.io/roles/people-manager/people-management/hiring/interview.html)
- [Onboarding](https://tlroadmap.io/roles/people-manager/people-management/hiring/onboarding.html)
- [Профиль кандидата](https://tlroadmap.io/roles/people-manager/people-management/hiring/profile.html)
- [Тестовый период](https://tlroadmap.io/roles/people-manager/people-management/hiring/test-period.html)
- [STAR Method](https://www.themuse.com/advice/star-interview-method)
- [Hiring Best Practices](https://www.lever.co/blog/hiring-best-practices/)

###### Мотивация

Понимание и влияние на эмоциональное и психологическое состояние сотрудников.

**Ключевые теории мотивации:**

| Теория | Автор | Суть |
|--------|-------|------|
| Пирамида потребностей | Maslow | 5 уровней потребностей (физиология → самореализация) |
| Теория потребностей | McClelland | Достижение, принадлежность, власть |
| Двухфакторная | Herzberg | Гигиенические факторы vs мотиваторы |
| Drive | Pink | Автономия, мастерство, цель |
| Поток | Csikszentmihalyi | Баланс сложности и навыков |

**Модель Pink (Drive):**
- **Autonomy** — самостоятельность в принятии решений
- **Mastery** — возможность развивать навыки
- **Purpose** — понимание целей и смысла работы

**Практические действия:**
- Конкурентная зарплата (+10-15% к рынку)
- Полугодовые пересмотры компенсации
- Публичное признание и спонтанные награды
- Усложнение задач с ростом автономии

**Инструменты оценки мотивации:**
- 10K Test
- Motivation Maps
- Stay Interviews

**Спектр вовлечённости:**
```
Disengagement → External motivation → Internal motivation → Flow
```

**Ресурсы:**
- [Мотивация](https://tlroadmap.io/roles/people-manager/people-management/motivation.html)
- [Drive (Daniel Pink)](https://www.danpink.com/books/drive/)
- [Flow (Csikszentmihalyi)](https://www.amazon.com/Flow-Psychology-Experience-Perennial-Classics/dp/0061339202)
- [Two-Factor Theory](https://www.mindtools.com/pages/article/herzberg-motivators-hygiene-factors.htm)

###### One-on-one

Регулярные приватные встречи руководителя с каждым членом команды.

**Определение:** One-on-one — регулярные приватные беседы между менеджером и его прямым подчинённым для построения доверия, обсуждения производительности и выравнивания целей.

**Преимущества:**

| Для сотрудника | Для руководителя |
|----------------|------------------|
| Гарантированное время для обсуждения | Глубокое понимание мотивации |
| Обсуждение сложных вопросов | Раннее выявление проблем |
| Чувство внимания | Равномерное внимание всем |

**Последствия игнорирования:**
- Ухудшение доверия
- Коммуникация только по операционным вопросам
- Сложности с performance management
- Ощущение фаворитизма

**Правило 10/90:** Руководитель говорит 10%, слушает 90%.

**Внедрение процесса:**
1. Создать профили сотрудников (мотивация, договорённости, достижения)
2. Запланировать регулярные встречи (чаще чем раз в месяц)
3. Установить правила: частота, длительность, место, формат
4. Подготовить список открытых вопросов

**Во время встречи:**
- Следовать подготовленной агенде
- Документировать обсуждения и action items
- Фокусироваться на приоритетах сотрудника

**Улучшение процесса:**
- Просить сотрудника готовить агенду заранее
- Вести детальные записи встреч
- Регулярно проверять актуальность карточки сотрудника
- Собирать фидбек об эффективности встреч

**Признаки плохих 1-on-1:**
- Нерегулярные встречи
- Обсуждение только тривиальных тем
- Односложные ответы сотрудника
- Повторяющиеся обсуждения без прогресса
- Незафиксированные договорённости
- Частые отмены
- Отсутствие исторической преемственности

**Ресурсы:**
- [One-on-one](https://tlroadmap.io/roles/people-manager/people-management/one-on-one.html)
- [Manager Tools: One on Ones](https://www.manager-tools.com/map-universe/one-ones)
- [The Art of the One-on-One Meeting](https://www.fellow.app/blog/management/one-on-one-meeting-definitive-guide/)
- [One-on-One Questions](https://getlighthouse.com/blog/one-on-one-meeting-questions-great-managers-ask/)

###### Промо

**Ассессмент**

Оценка компетенций сотрудника для принятия решений о повышении.

**Методы оценки:**
- 360-degree feedback
- Performance review
- Competency assessment
- Self-assessment

**Карьерная линейка**

Система грейдов и уровней в организации.

**Типичные уровни для разработчиков:**
```
Junior → Middle → Senior → Staff → Principal → Distinguished
                    ↓
              → Tech Lead → Engineering Manager → Director
```

**Компоненты карьерной линейки:**
- Описание уровней
- Критерии перехода
- Ожидания по компетенциям
- Процесс продвижения

**Ресурсы:**
- [Ассессмент](https://tlroadmap.io/roles/people-manager/people-management/promo/assessment.html)
- [Карьерная линейка](https://tlroadmap.io/roles/people-manager/people-management/promo/career.html)
- [Career Ladders](https://www.progression.fyi/)
- [Engineering Levels Guide](https://www.levels.fyi/)

##### Управление командой

###### Управление компетенциями

Отслеживание и развитие навыков команды.

**Инструменты:**
- Skills Matrix
- Competency Framework
- Knowledge Map

**Skills Matrix:**
| Навык | Alice | Bob | Carol |
|-------|-------|-----|-------|
| React | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Node.js | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| PostgreSQL | ⭐ | ⭐⭐ | ⭐⭐⭐ |

**Ресурсы:**
- [Управление компетенциями](https://tlroadmap.io/roles/people-manager/team-management/competency-management.html)

###### Климат в команде

Эмоциональное состояние команды и коллективная субъективная оценка ежедневной работы.

**Влияние на:**
- Метрики производительности
- Удовлетворённость работой
- Эмоциональное благополучие членов команды

**Последствия игнорирования:**
- Негативный фон усиливает все негативные явления
- Конфликты эскалируются вместо разрешения
- Уходы провоцируют дополнительные увольнения
- Команда не может восстановиться без вмешательства

**Методы оценки:**
- Интервью
- Опросы (Team Health Check)
- Ретроспективы
- eNPS (Employee Net Promoter Score)

**Инструменты:**
- [Spotify Team Health Check](https://engineering.atspotify.com/2014/09/squad-health-check-model/)
- Officevibe, Culture Amp — платформы для опросов

**Ресурсы:**
- [Климат в команде](https://tlroadmap.io/roles/people-manager/team-management/team-climate.html)
- [Psychological Safety](https://rework.withgoogle.com/guides/understanding-team-effectiveness/steps/foster-psychological-safety/)

###### Дизайн команды

Формирование оптимальной структуры и состава команды.

**Факторы:**
- Размер команды (оптимально 5-9 человек)
- Баланс компетенций
- Team Topologies (Stream-aligned, Platform, Enabling, Complicated-subsystem)

**Ресурсы:**
- [Дизайн команды](https://tlroadmap.io/roles/people-manager/team-management/team-design.html)
- [Team Topologies](https://teamtopologies.com/)
- [Two-Pizza Rule](https://www.theguardian.com/technology/2018/apr/24/the-two-pizza-rule-and-the-secret-of-amazons-success)

###### Запуск команды

Формирование новой команды или перезапуск существующей.

**Модель Tuckman:**
```
Forming → Storming → Norming → Performing → Adjourning
```

**Практики:**
- Team Charter
- Working Agreements
- Definition of Done
- Kick-off meeting

**Ресурсы:**
- [Запуск команды](https://tlroadmap.io/roles/people-manager/team-management/team-launch.html)
- [Tuckman's Stages](https://www.mindtools.com/pages/article/newLDR_86.htm)

###### Зрелость команды

Оценка и развитие уровня самоорганизации команды.

**Уровни зрелости:**
1. **Directing** — руководитель принимает все решения
2. **Coaching** — руководитель объясняет решения
3. **Supporting** — совместные решения
4. **Delegating** — команда принимает решения

**Ресурсы:**
- [Зрелость команды](https://tlroadmap.io/roles/people-manager/team-management/team-maturity.html)
- [Situational Leadership](https://situational.com/situational-leadership/)

###### Обеспечение прозрачности

Создание среды открытой коммуникации и видимости работы.

**Практики:**
- Визуализация работы (Kanban board)
- Регулярные статус-апдейты
- Открытые каналы коммуникации
- Документирование решений

**Ресурсы:**
- [Обеспечение прозрачности](https://tlroadmap.io/roles/people-manager/team-management/transparency.html)

###### Организация рабочего пространства

Создание комфортной физической и виртуальной среды для работы.

**Факторы:**
- Физическое пространство (офис, удалёнка, гибрид)
- Инструменты коммуникации
- Доступ к информации
- Эргономика

**Ресурсы:**
- [Организация рабочего пространства](https://tlroadmap.io/roles/people-manager/team-management/workspace.html)

##### Развитие технического бренда

Позиционирование команды и компании как технологического лидера.

**Направления:**
- Tech-блог
- Участие в конференциях
- Open Source контрибуции
- Митапы
- Подкасты

**Ресурсы:**
- [Развитие технического бренда](https://tlroadmap.io/roles/people-manager/techpr.html)


---

#### Product Owner

Роль, отвечающая за продуктовое видение и приоритизацию работы.

##### Принятие продуктовых решений

###### Целеполагание

Определение целей продукта и команды.

**Фреймворки:**
- **OKR** (Objectives & Key Results)
- **SMART** goals
- **North Star Metric**

**OKR структура:**
```
Objective: Качественная цель (вдохновляющая, амбициозная)
├── Key Result 1: Измеримый результат
├── Key Result 2: Измеримый результат
└── Key Result 3: Измеримый результат
```

**Ресурсы:**
- [Целеполагание](https://tlroadmap.io/roles/product-owner/product-decisions/goal-setting.html)
- [OKR](https://www.whatmatters.com/)
- [Measure What Matters](https://www.whatmatters.com/the-book)

###### Управление продуктовым бэклогом

**Генерация элементов бэклога**

Источники идей:
- Пользовательские исследования
- Обратная связь клиентов
- Анализ конкурентов
- Внутренние идеи команды
- Технические потребности

**Приоритизация бэклога**

**Техники приоритизации:**
- RICE (Reach × Impact × Confidence / Effort)
- ICE (Impact × Confidence × Ease)
- MoSCoW
- Value vs Effort matrix
- Kano Model
- WSJF (Weighted Shortest Job First)

**RICE формула:**
```
RICE Score = (Reach × Impact × Confidence) / Effort
```

**Ресурсы:**
- [Генерация элементов бэклога](https://tlroadmap.io/roles/product-owner/product-decisions/product-backlog-management/backlog-generation.html)
- [Приоритизация бэклога](https://tlroadmap.io/roles/product-owner/product-decisions/product-backlog-management/backlog-prioritization.html)
- [Product Backlog Management](https://www.scrum.org/resources/what-is-a-product-backlog)

###### Продуктовая стратегия

Долгосрочное видение развития продукта.

**Компоненты:**
- Vision (видение)
- Mission (миссия)
- Strategy (стратегия)
- Roadmap (дорожная карта)
- Tactics (тактика)

**Ресурсы:**
- [Продуктовая стратегия](https://tlroadmap.io/roles/product-owner/product-decisions/product-strategy.html)
- [Good Strategy Bad Strategy](https://www.amazon.com/Good-Strategy-Bad-Difference-Matters/dp/0307886239)

###### Управление роадмапом

Визуализация и планирование развития продукта.

**Типы роадмапов:**
- Feature-based
- Goal-based (Now-Next-Later)
- Theme-based
- Timeline-based

**Инструменты:**
- ProductPlan, Aha!, Roadmunk
- Notion, Miro
- Google Sheets

**Ресурсы:**
- [Управление роадмапом](https://tlroadmap.io/roles/product-owner/product-decisions/roadmap-management.html)
- [Product Roadmaps](https://www.productplan.com/learn/what-is-a-product-roadmap/)

##### Управление продуктом

###### Жизненный цикл фичей

Управление фичами от идеи до deprecation.

**Стадии:**
```
Ideation → Discovery → Definition → Development → Launch → Growth → Maturity → Decline
```

**Ресурсы:**
- [Жизненный цикл фичей](https://tlroadmap.io/roles/product-owner/product-management/feature-lifecycle.html)

###### Запуск продукта

Вывод продукта или фичи на рынок.

**Компоненты запуска:**
- Go-to-market strategy
- Launch checklist
- Communication plan
- Success metrics
- Rollback plan

**Ресурсы:**
- [Запуск продукта](https://tlroadmap.io/roles/product-owner/product-management/product-launch.html)
- [Product Launch Checklist](https://www.productplan.com/glossary/product-launch/)

##### Понимание продукта

###### Знание рынка

Понимание конкурентной среды и рыночных трендов.

**Методы:**
- Competitive analysis
- Market research
- Trend analysis
- TAM/SAM/SOM

**Ресурсы:**
- [Знание рынка](https://tlroadmap.io/roles/product-owner/product-understanding/market-knowledge.html)

###### Знание продукта

Глубокое понимание своего продукта.

**Области:**
- Функциональность
- Архитектура
- Ограничения
- Метрики
- Roadmap

**Ресурсы:**
- [Знание продукта](https://tlroadmap.io/roles/product-owner/product-understanding/product-knowledge.html)

###### Знание пользователей

Понимание потребностей и поведения пользователей.

**Методы исследований:**
- User interviews
- Surveys
- Usability testing
- Analytics analysis
- A/B testing

**Инструменты:**
- Hotjar, FullStory — сессионные записи
- Amplitude, Mixpanel — продуктовая аналитика
- UserTesting — тестирование юзабилити

**Ресурсы:**
- [Знание пользователей](https://tlroadmap.io/roles/product-owner/product-understanding/user-knowledge.html)
- [Jobs to be Done](https://jtbd.info/)
- [User Persona](https://www.nngroup.com/articles/persona/)


---

#### Technical Lead

Роль, отвечающая за техническое качество и архитектуру.

**Связанные материалы в репозитории:**
- [Архитектура](../architecture/architecture.md) — обзор архитектурных подходов
- [SOLID принципы](../architecture/SOLID%20принципы.md) — принципы объектно-ориентированного дизайна
- [System Design](../architecture/System%20Design/System%20Design.md) — проектирование систем
- [Чистый код](../Books/Чистый%20код/Чистый%20Код%20-%20Роберт%20Мартин.md) — практики написания качественного кода
- [DevOps](../devops/devops.md) — автоматизация и инфраструктура
- [CI/CD](../devops/CI-CD.md) — непрерывная интеграция и доставка

##### Архитектура

Проектирование и поддержка архитектуры системы.

###### Архитектурное ревью

Анализ и оценка архитектурных решений для выявления проблем, рисков и возможностей улучшения.

**Виды ревью:**
- Design Review (до реализации)
- Architecture Decision Records (ADR)
- Post-implementation review

**ADR структура:**
```markdown
# ADR-001: Название решения

## Статус
Принято / Отклонено / Заменено

## Контекст
Какая проблема решается?

## Решение
Что решили сделать?

## Последствия
Плюсы, минусы, риски
```

**Ресурсы:**
- [Архитектурное ревью](https://tlroadmap.io/roles/technical-lead/architecture/review.html)
- [Architecture Decision Records](https://adr.github.io/)
- [Software Architecture Review](https://martinfowler.com/articles/architectureReview.html)

###### Проектирование

Создание архитектуры системы с учётом требований, ограничений и долгосрочных целей.

**Архитектурные паттерны:**
- Monolith
- [Микросервисы](../backend/Microservices/Микросервисы.md) — распределённая архитектура
- Event-Driven
- CQRS
- [Hexagonal (Ports & Adapters)](../architecture/Architecture/Onion%20Architecture.md)
- [Clean Architecture](../architecture/Architecture/Architecture.md)
- [MV-паттерны](../architecture/Architecture/MV-patterns.md) — MVC, MVP, MVVM
- [FSD](../architecture/Architecture/FSD/FSD.md) — Feature-Sliced Design

**Ресурсы:**
- [Проектирование](https://tlroadmap.io/roles/technical-lead/architecture/design.html)
- [Software Architecture](https://martinfowler.com/architecture/)
- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Fundamentals of Software Architecture](https://www.oreilly.com/library/view/fundamentals-of-software/9781492043447/)
- **Внутренние:** [System Design](../architecture/System%20Design/System%20Design.md), [Архитектура](../architecture/Architecture/Architecture.md)

###### Эволюция

Постепенное развитие архитектуры без нарушения работы системы.

**Практики:**
- Strangler Fig Pattern
- Feature Toggles
- Database Migrations
- API Versioning
- Blue-Green Deployments

**Ресурсы:**
- [Эволюция](https://tlroadmap.io/roles/technical-lead/architecture/evolution.html)
- [Evolutionary Architecture](https://www.thoughtworks.com/insights/blog/microservices-evolutionary-architecture)
- [Building Evolutionary Architectures](https://www.oreilly.com/library/view/building-evolutionary-architectures/9781491986356/)

###### Сбор технических требований

Выявление и документирование нефункциональных требований.

**Категории NFR:**
- Performance (latency, throughput)
- Scalability (horizontal, vertical)
- Availability (uptime, SLA)
- Security (authentication, authorization)
- Maintainability (code quality, documentation)
- Observability (monitoring, logging, tracing)

**Ресурсы:**
- [Сбор технических требований](https://tlroadmap.io/roles/technical-lead/architecture/requirements.html)
- [Non-Functional Requirements](https://en.wikipedia.org/wiki/Non-functional_requirement)

##### Автоматизация цикла разработки

Настройка автоматизированных процессов для повышения скорости и качества.

###### Continuous Integration

Практика частой интеграции кода с автоматическими проверками.

**CI Pipeline:**
```
Commit → Build → Test → Static Analysis → Artifact
```

**Инструменты:**
- GitHub Actions, GitLab CI
- Jenkins, TeamCity
- CircleCI, Travis CI

**Ресурсы:**
- [Continuous Integration](https://tlroadmap.io/roles/technical-lead/automation/ci.html)
- [CI/CD Best Practices](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)

###### Автоматизация релизов

Настройка автоматизированного процесса развёртывания (CI/CD pipeline).

**CD Pipeline:**
```
Artifact → Deploy to Staging → Integration Tests → Deploy to Production → Smoke Tests
```

**Практики:**
- Infrastructure as Code (Terraform, Pulumi)
- GitOps (ArgoCD, Flux)
- Feature Flags
- Canary Releases
- Blue-Green Deployments

**Инструменты:**
- ArgoCD, Spinnaker
- [Kubernetes](../devops/kubernetes/Kubernetes%20+%20Helm.md), [Docker](../devops/docker/Docker%20+%20Ansible.md)
- Terraform, Ansible

**Ресурсы:**
- [Автоматизация релизов](https://tlroadmap.io/roles/technical-lead/automation/release.html)
- [Continuous Delivery](https://martinfowler.com/bliki/ContinuousDelivery.html)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitLab CI](https://docs.gitlab.com/ee/ci/)
- **Внутренние:** [CI/CD](../devops/CI-CD.md), [DevOps](../devops/devops.md)

###### Работа с системами контроля версий

Организация работы с Git и branching strategies.

**Branching Strategies:**
- [Git Flow](../cs/GIT/GitFlow.md)
- GitHub Flow
- Trunk-Based Development
- GitLab Flow

**Ресурсы:**
- [Работа с системами контроля версий](https://tlroadmap.io/roles/technical-lead/automation/vcs.html)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
- **Внутренние:** [Git](../cs/GIT/Git.md), [GitFlow](../cs/GIT/GitFlow.md), [GitHub Actions](../cs/GIT/Github%20Actions.md), [Conventional Commits](../cs/GIT/Соглашение%20о%20коммитах%201.0.0.md)

##### Capacity Management

Управление мощностью команды: планирование загрузки, оценка ресурсов.

**Метрики:**
- Velocity (Story Points per Sprint)
- Capacity (доступные человеко-часы)
- Cycle Time
- Lead Time

**Практики:**
- Sprint Planning с учётом capacity
- Учёт отпусков и больничных
- Buffer для незапланированной работы (15-20%)

**Ресурсы:**
- [Capacity Management](https://tlroadmap.io/roles/technical-lead/capacity.html)
- [Team Capacity Planning](https://www.atlassian.com/agile/project-management/capacity-planning)
- [Velocity vs Capacity](https://www.scrum.org/resources/blog/velocity-vs-capacity-scrum)

##### Управление знаниями

###### Техническая документация

Создание и поддержка документации.

**Типы документации:**
- API Documentation (OpenAPI, Swagger)
- Architecture Documentation (C4 Model)
- README, Getting Started
- Runbooks
- ADRs

**Инструменты:**
- Confluence, Notion
- MkDocs, Docusaurus
- Swagger, Redoc

**Ресурсы:**
- [Техническая документация](https://tlroadmap.io/roles/technical-lead/knowledge-management/documentation.html)
- [Documentation Best Practices](https://www.writethedocs.org/)
- [C4 Model](https://c4model.com/)

###### Распространение знаний

Обеспечение передачи знаний внутри команды.

**Практики:**
- Tech Talks
- Pair Programming
- Code Review
- Brown Bag Sessions
- Internal Wiki
- Mob Programming

**Ресурсы:**
- [Распространение знаний](https://tlroadmap.io/roles/technical-lead/knowledge-management/knowledge-management.html)

##### Обеспечение качества продукта

###### Работа с багами

Процесс обработки и устранения дефектов.

**Жизненный цикл бага:**
```
Reported → Triaged → In Progress → Fixed → Verified → Closed
```

**Приоритизация:**
- P0 (Critical) — блокирует работу
- P1 (High) — серьёзное влияние
- P2 (Medium) — умеренное влияние
- P3 (Low) — минимальное влияние

**Ресурсы:**
- [Работа с багами](https://tlroadmap.io/roles/technical-lead/product-quality/bugs.html)

###### Code Review

Проверка кода для обеспечения качества и распространения знаний.

**Преимущества:**
- Обнаружение багов
- Выявление архитектурных проблем
- Стандартизация кода
- Распространение знаний
- Обратная связь для разработчиков

**Хорошие практики:**

| Категория | Практика |
|-----------|----------|
| Процесс | Чёткие критерии pass/fail, атомарные MR |
| Коммуникация | Вопросы вместо критики, похвала, приоритизация фидбека |
| Автоматизация | Линтеры, автотесты, интеграция с мессенджерами |
| Скорость | Быстрый отклик (в идеале в тот же день) |

**Структура ревью:**
1. Понять бизнес-логику
2. Оценить архитектурные решения
3. Проверить детали реализации

**Плохие практики:**
- Неясная ответственность
- Отсутствие метрик успеха
- Задержки с фидбеком
- Токсичная коммуникация (сарказм, личные выпады)

**Ресурсы:**
- [Code review](https://tlroadmap.io/roles/technical-lead/product-quality/code-review.html)
- [Google Code Review Guide](https://google.github.io/eng-practices/review/)
- [How to Do Code Reviews Like a Human](https://mtlynch.io/human-code-reviews-1/)

###### Управление инцидентами

Минимизация негативного влияния от неожиданных сбоев.

**Ключевые практики:**

| Практика | Описание |
|----------|----------|
| Документирование | Обязательная запись инцидентов с деталями решения |
| Приоритизация | Ранжирование по влиянию на бизнес |
| Коммуникация | Поддержание записей о конфигурационном влиянии |
| Постмортемы | Анализ без обвинений (blameless post-mortem) |

**Классификация инцидентов:**
- **Minor** — минимальное влияние
- **Major** — значительное влияние, требует ресурсов
- **Critical** — критическое влияние, требует эскалации
- **Security** — инциденты безопасности (отдельный процесс)

**Методы разрешения:**
- Следование установленным процедурам
- Привлечение команд с экспертизой
- **Swarming** — коллективная работа до определения владельца

**Превентивные меры:**
- Формализация процедур
- Контракты с поставщиками поддержки
- Self-service системы для пользователей

**Антипаттерны:**
- Неполная документация инцидентов
- Отсутствие классификации по severity
- Поиск виноватых вместо причин
- Недостаточное выделение ресурсов

**Инструменты:**
- PagerDuty, Opsgenie — on-call
- Statuspage — коммуникация о статусе
- Jira Service Management — тикеты

**Ресурсы:**
- [Управление инцидентами](https://tlroadmap.io/roles/technical-lead/product-quality/incident-management.html)
- [Incident Management](https://sre.google/sre-book/managing-incidents/)
- [Blameless Post-Mortems](https://www.atlassian.com/incident-management/postmortem/blameless)

###### Метрики и мониторинг

Сбор, анализ и визуализация метрик работы системы.

**Типы метрик:**
- **Golden Signals** (Latency, Traffic, Errors, Saturation)
- **RED** (Rate, Errors, Duration)
- **USE** (Utilization, Saturation, Errors)

**Observability Stack:**
- **Metrics**: Prometheus, Datadog
- **Logs**: ELK Stack, Loki
- **Traces**: Jaeger, Zipkin
- **Visualization**: Grafana

**Ресурсы:**
- [Метрики и мониторинг](https://tlroadmap.io/roles/technical-lead/product-quality/metrics.html)
- [Observability](https://www.thoughtworks.com/insights/blog/observability)
- [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)

###### Нефункциональные требования

Обеспечение соответствия NFR.

**Категории:**
- Performance
- Scalability
- Availability
- Security
- Maintainability

**Ресурсы:**
- [Нефункциональные требования](https://tlroadmap.io/roles/technical-lead/product-quality/nfr.html)

###### Тестирование

Обеспечение качества через различные виды тестирования.

**Нефункциональное тестирование**

Тестирование характеристик системы: производительность, нагрузка, безопасность.

**Виды:**
- Performance Testing
- Load Testing
- Stress Testing
- Security Testing
- Chaos Engineering

**Инструменты:**
- JMeter, Gatling, k6 — нагрузочное тестирование
- OWASP ZAP — security testing
- Chaos Monkey — chaos engineering

**Ресурсы:**
- [Нефункциональное тестирование](https://tlroadmap.io/roles/technical-lead/product-quality/testing/non-functional.html)
- [Load Testing](https://k6.io/docs/test-types/load-testing/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

**Пирамида тестирования**

```
        /\
       /  \        E2E Tests (few)
      /----\
     /      \      Integration Tests (some)
    /--------\
   /          \    Unit Tests (many)
  /------------\
```

**Автоматизация тестирования API**

Создание автоматизированных тестов для REST, GraphQL API.

**Инструменты:**
- Postman, Newman
- REST Assured
- Karate
- pytest + requests

**Ресурсы:**
- [Автоматизация тестирования API](https://tlroadmap.io/roles/technical-lead/product-quality/testing/test-pyramid/api-testing.html)
- [Postman](https://www.postman.com/)
- [REST Assured](https://rest-assured.io/)

**Автоматизация тестирования GUI**

Автоматизация тестирования пользовательского интерфейса.

**Инструменты:**
- Playwright
- Cypress
- Selenium
- Puppeteer

**Ресурсы:**
- [Автоматизация тестирования GUI](https://tlroadmap.io/roles/technical-lead/product-quality/testing/test-pyramid/gui-testing.html)
- [Playwright](https://playwright.dev/)
- [Cypress](https://www.cypress.io/)

**Unit-тестирование**

Тестирование отдельных модулей кода.

**Best Practices:**
- Один assert на тест
- AAA паттерн (Arrange-Act-Assert)
- Изоляция (mocks, stubs)
- Fast, Independent, Repeatable

**Ресурсы:**
- [Unit-тестирование](https://tlroadmap.io/roles/technical-lead/product-quality/testing/test-pyramid/unit-testing.html)
- [Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

**Дополнительные ресурсы по тестированию:**
- [Тест-дизайн](https://tlroadmap.io/roles/technical-lead/product-quality/testing/test-design.html)
- [Оптимизация количества тестирования](https://tlroadmap.io/roles/technical-lead/product-quality/testing/test-optimization.html)
- [Планирование тестирования](https://tlroadmap.io/roles/technical-lead/product-quality/testing/planning.html)
- [Тестирование требований](https://tlroadmap.io/roles/technical-lead/product-quality/testing/testing-requirements.html)
- **Внутренние:** [Тестирование](../testing/testing.md), [Тестирование JavaScript](../testing/Тестирование%20JavaScript.md)

##### Знание технологий

###### Написание кода

Способность писать production-ready код.

**Ожидания:**
- Понимание кодовой базы
- Способность закрыть критичные задачи
- Пример для команды
- Code review

**Ресурсы:**
- [Написание кода](https://tlroadmap.io/roles/technical-lead/tech-knowledge/code.html)

###### Выбор и контроль технологий

Принятие решений о технологическом стеке.

**Факторы выбора:**
- Зрелость технологии
- Сообщество и экосистема
- Команда и экспертиза
- Performance requirements
- Total Cost of Ownership

**Ресурсы:**
- [Выбор и контроль технологий](https://tlroadmap.io/roles/technical-lead/tech-knowledge/stack-choice.html)
- [Technology Radar](https://www.thoughtworks.com/radar)

###### Знание технологического стека команды

Глубокое понимание используемых технологий.

**Ресурсы:**
- [Знание технологического стека команды](https://tlroadmap.io/roles/technical-lead/tech-knowledge/stack-knowledge.html)

##### Обеспечение технического качества

###### Чистый код

Написание понятного, поддерживаемого кода.

**Принципы:**
- SOLID
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)

**Ресурсы:**
- [Чистый код](https://tlroadmap.io/roles/technical-lead/tech-quality/clean-code.html)
- [Clean Code (Robert Martin)](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- **Внутренние:** [Чистый Код — Роберт Мартин](../Books/Чистый%20код/Чистый%20Код%20-%20Роберт%20Мартин.md), [SOLID принципы](../architecture/SOLID%20принципы.md)

###### Рефакторинг

Улучшение структуры кода без изменения поведения.

**Техники:**
- Extract Method/Class
- Rename
- Move Method
- Replace Conditional with Polymorphism

**Ресурсы:**
- [Рефакторинг](https://tlroadmap.io/roles/technical-lead/tech-quality/refactoring.html)
- [Refactoring (Martin Fowler)](https://refactoring.com/)
- [Refactoring Catalog](https://refactoring.com/catalog/)

###### Управление техническим долгом

Непрерывное выявление, оценка стоимости и устранение технического долга.

**Определение:** Технический долг — несделанная работа, которая будет мешать развитию проекта в будущем. Это не баги и не низкоприоритетные фичи, а проблемы архитектуры и качества кода.

**Последствия игнорирования:**
- Рост времени разработки и поддержки
- Сложность анализа кода
- Хрупкость системы
- В крайнем случае — необходимость полного переписывания

**Практики управления:**

| Практика | Описание |
|----------|----------|
| Code Review | Детальная оценка качества при разработке |
| Статический анализ | SonarQube и подобные инструменты |
| Внешний аудит | Объективная оценка третьей стороной |
| Sprint allocation | % спринта на работу с долгом |
| Непрерывный мониторинг | Ручные и автоматические проверки |

**Инструменты:**
- SonarQube, SonarCloud
- Code Climate
- Codacy

**Ресурсы:**
- [Управление техническим долгом](https://tlroadmap.io/roles/technical-lead/tech-quality/technical-debt.html)
- [Technical Debt](https://martinfowler.com/bliki/TechnicalDebt.html)
- [Managing Technical Debt](https://www.amazon.com/Managing-Technical-Debt-Reducing-Development/dp/013564593X)


---
### Личные навыки

Личные навыки (soft skills) критически важны для тимлида — они определяют способность эффективно взаимодействовать с командой, стейкхолдерами и влиять на результаты.

**Связанные материалы:**
- [DISC модель](DISC.md) — понимание типов личности
- [Team](Team.md) — командная динамика

#### Коммуникации

Коммуникация — основной инструмент тимлида. Качество коммуникации напрямую влияет на эффективность команды, скорость решения проблем и общий климат.

##### Коучинг

Помощь людям в достижении их целей через вопросы и поддержку. Коуч не даёт советов напрямую, а помогает человеку самостоятельно найти решение.

**Когда применять:**
- Развитие сотрудников
- Помощь в принятии решений
- Преодоление препятствий
- Карьерное планирование

**Модель GROW:**
- **G**oal — цель
- **R**eality — текущая ситуация
- **O**ptions — варианты действий
- **W**ill — план действий

**Ресурсы:**
- [Коучинг](https://tlroadmap.io/self-skills/communications/coaching.html)
- [GROW Model](https://www.mindtools.com/pages/article/newLDR_89.htm)

##### Управление конфликтами

Навыки разрешения и предотвращения конфликтов. Конфликты неизбежны в любой команде — важно уметь управлять ими конструктивно.

**Стратегии (Thomas-Kilmann):**

| Стратегия | Описание | Когда применять |
|-----------|----------|-----------------|
| Competing | Отстаивание своей позиции | Кризис, срочные решения |
| Collaborating | Поиск win-win решения | Важные вопросы, есть время |
| Compromising | Частичные уступки обеих сторон | Равные силы, среднее решение |
| Avoiding | Уход от конфликта | Незначительные вопросы |
| Accommodating | Уступка другой стороне | Отношения важнее результата |

**Признаки деструктивного конфликта:**
- Переход на личности
- Эскалация вместо разрешения
- Снижение продуктивности
- Формирование "лагерей"

**Практики разрешения:**
1. Выслушать обе стороны отдельно
2. Определить корневую причину
3. Найти общие интересы
4. Выработать решение вместе
5. Зафиксировать договорённости

**Ресурсы:**
- [Управление конфликтами](https://tlroadmap.io/self-skills/communications/conflicts.html)
- [Thomas-Kilmann Model](https://www.themyersbriggs.com/en-US/Products-and-Services/TKI)
- [Crucial Conversations](https://www.amazon.com/Crucial-Conversations-Talking-Stakes-Second/dp/0071771328)

##### Сотрудничество

Навыки эффективной работы с другими людьми. Включает кросс-функциональное взаимодействие, работу с другими командами и отделами.

**Принципы эффективного сотрудничества:**
- Общие цели важнее локальных
- Прозрачность и открытость
- Взаимное уважение
- Своевременная коммуникация
- Готовность помочь

**Барьеры сотрудничества:**
- Силосы между командами
- Конкуренция за ресурсы
- Недостаток доверия
- Разные приоритеты

**Практики улучшения:**
- Регулярные синки между командами
- Общие ретроспективы
- Ротация сотрудников
- Совместные OKR

**Связанные темы:**
- [Масштабирование Agile](agile.md#Масштабирование%20Agile)

**Ресурсы:**
- [Сотрудничество](https://tlroadmap.io/self-skills/communications/cooperation.html)

##### Фасилитация

Управление групповой дискуссией для достижения целей встречи. Фасилитатор нейтрален по отношению к содержанию и фокусируется на процессе.

**Роль фасилитатора:**
- Управление временем
- Вовлечение всех участников
- Фиксация решений
- Предотвращение доминирования
- Разрешение тупиковых ситуаций

**Техники:**

| Техника | Описание | Когда применять |
|---------|----------|-----------------|
| Brainstorming | Генерация идей без критики | Поиск решений |
| Dot Voting | Голосование точками | Приоритизация |
| Silent Writing | Тихая запись идей | Включение интровертов |
| Round Robin | Высказывание по кругу | Равное участие |
| Fishbowl | Внутренний и внешний круг | Сложные обсуждения |
| 1-2-4-All | Индивидуально → пары → группы | Консенсус |

**Типичные встречи для фасилитации:**
- [Ретроспективы](agile.md#Ретроспектива)
- Planning sessions
- Design workshops
- Brainstorming
- Decision-making meetings

**Ресурсы:**
- [Фасилитация](https://tlroadmap.io/self-skills/communications/facilitation.html)
- [Liberating Structures](https://www.liberatingstructures.com/)
- [Retromat](https://retromat.org/) — форматы ретроспектив

##### Дача и получение обратной связи

Навыки предоставления и принятия фидбека. Регулярная обратная связь — основа развития команды.

**Модель Radical Candor:**

```
              Высокая забота о человеке
                        │
    Ruinous Empathy     │     Radical Candor ★
    (не говорите        │     (говорите прямо
     неприятное)        │      с заботой)
                        │
────────────────────────┼────────────────────────
                        │
    Manipulative        │     Obnoxious Aggression
    Insincerity         │     (агрессивная критика
    (политкорректность) │      без заботы)
                        │
              Низкая забота о человеке

    ← Низкая прямота         Высокая прямота →
```

**Формула эффективного фидбека (SBI):**
- **S**ituation — конкретная ситуация
- **B**ehavior — наблюдаемое поведение
- **I**mpact — влияние на результат

**Пример:**
> "На вчерашнем standup (S), когда ты перебил коллегу (B), это создало напряжённую атмосферу и он не договорил свою мысль (I)."

**Получение фидбека:**
- Слушать без защиты
- Задавать уточняющие вопросы
- Благодарить за фидбек
- Рефлексировать и действовать

**Ресурсы:**
- [Дача и получение обратной связи](https://tlroadmap.io/self-skills/communications/feedback.html)
- [Radical Candor](https://www.radicalcandor.com/)
- [Thanks for the Feedback](https://www.amazon.com/Thanks-Feedback-Science-Receiving-Well/dp/0670014664)

##### Нетворкинг

Построение и поддержание профессиональных связей. Нетворк — один из главных активов тимлида.

**Почему важен нетворкинг:**
- Найм талантов (рефералы)
- Обмен опытом и практиками
- Карьерные возможности
- Решение сложных проблем
- Видение индустрии

**Практики:**
- Участие в митапах и конференциях
- Активность в профессиональных сообществах
- Менторинг и коучинг
- Регулярные coffee-чаты
- Ведение блога / канала

**Инструменты:**
- LinkedIn
- Telegram-чаты
- Discord/Slack сообщества
- Twitter/X

**Ресурсы:**
- [Нетворкинг](https://tlroadmap.io/self-skills/communications/networking.html)
- [Never Eat Alone](https://www.amazon.com/Never-Eat-Alone-Expanded-Updated/dp/0385346654)

##### Личный бренд

Позиционирование себя как эксперта в своей области. Сильный личный бренд помогает привлекать таланты и возможности.

**Каналы:**
- Технический блог
- Социальные сети (LinkedIn, Twitter)
- Выступления на конференциях
- Open Source контрибуции
- Подкасты и видео
- Книги и статьи

**Стратегия развития бренда:**
1. Определить нишу/экспертизу
2. Выбрать 1-2 основных канала
3. Регулярно создавать контент
4. Взаимодействовать с аудиторией
5. Измерять и корректировать

**Метрики:**
- Подписчики и охват
- Входящие запросы (найм, выступления)
- Цитируемость
- Узнаваемость в сообществе

**Ресурсы:**
- [Личный бренд](https://tlroadmap.io/self-skills/communications/personal-brand.html)
- [Show Your Work!](https://www.amazon.com/Show-Your-Work-Austin-Kleon/dp/076117897X)

##### Публичные выступления

Навыки презентации и выступлений — важный инструмент влияния для тимлида.

**Типы выступлений:**
- Внутренние презентации (команда, стейкхолдеры)
- Tech Talks (компания)
- Митапы (сообщество)
- Конференции (индустрия)
- Подкасты и интервью

**Структура выступления:**
1. **Hook** — привлечь внимание
2. **Problem** — обозначить проблему
3. **Solution** — предложить решение
4. **Proof** — доказательства (данные, примеры)
5. **Call to Action** — призыв к действию

**Практики подготовки:**
- Репетиции вслух
- Запись и просмотр себя
- Фидбек от коллег
- Постепенное усложнение (митапы → конференции)

**Типичные ошибки:**
- Слишком много контента
- Чтение со слайдов
- Отсутствие историй и примеров
- Игнорирование аудитории

**Ресурсы:**
- [Публичные выступления](https://tlroadmap.io/self-skills/communications/public-speaking.html)
- [TED Talks Guide](https://www.ted.com/participate/organize-a-local-tedx-event/tedx-organizer-guide/speakers-program/speaker-coaching)
- [Talk Like TED](https://www.amazon.com/Talk-Like-TED-Public-Speaking-Secrets/dp/1250061539)

##### Работа с текстом

Навыки письменной коммуникации. В распределённых командах текст — основной способ коммуникации.

**Области применения:**
- Техническая документация
- Emails и письма
- Slack/Teams сообщения
- RFC и Design Docs
- ADR (Architecture Decision Records)
- README и onboarding

**Принципы эффективного письма:**
- **Ясность** — одна мысль = одно предложение
- **Краткость** — убирать лишнее
- **Структура** — заголовки, списки, выделения
- **Контекст** — reader-first mindset
- **Actionability** — чёткие следующие шаги

**Шаблон RFC:**
```markdown
# RFC: Название предложения

## Статус
Draft / Under Review / Accepted / Rejected

## Контекст
Какую проблему решаем?

## Предложение
Что предлагаем сделать?

## Альтернативы
Какие варианты рассматривали?

## Последствия
Плюсы, минусы, риски
```

**Ресурсы:**
- [Работа с текстом](https://tlroadmap.io/self-skills/communications/text.html)
- [Technical Writing Courses](https://developers.google.com/tech-writing)
- [The Elements of Style](https://www.amazon.com/Elements-Style-Fourth-William-Strunk/dp/020530902X)
- [On Writing Well](https://www.amazon.com/Writing-Well-Classic-Guide-Nonfiction/dp/0060891548)

#### Стили менеджмента

Различные подходы к управлению командой.

**Основные стили:**

| Стиль | Описание | Когда применять |
|-------|----------|-----------------|
| Авторитарный | Руководитель принимает все решения | Кризис, новая команда |
| Демократический | Совместное принятие решений | Зрелая команда |
| Делегирующий | Передача полномочий команде | Высокая зрелость команды |
| Ситуационный | Адаптация под контекст | Всегда актуален |

**Ресурсы:**
- [Стили менеджмента](https://tlroadmap.io/self-skills/management-styles.html)
- [Leadership Styles](https://www.mindtools.com/pages/article/newLDR_84.htm)
- [Situational Leadership](https://www.kenblanchard.com/getattachment/Products/Solutions/Situational-Leadership-II/SLII-Overview/SLII-Overview.pdf)

#### Отношения

##### Понимание ценности различий

Навыки работы с разнообразной командой (diversity & inclusion). Разнообразие команды коррелирует с инновационностью и бизнес-результатами.

**Измерения разнообразия:**
- Демографическое (пол, возраст, национальность)
- Когнитивное (стиль мышления, образование)
- Функциональное (роли, экспертиза)
- Личностное (интроверты/экстраверты)

**Преимущества разнообразных команд:**
- Больше перспектив и идей
- Лучшее понимание пользователей
- Снижение групповое мышления
- Привлечение талантов

**Практики:**
- Inclusive hiring practices
- Awareness training
- Psychological safety
- Активное включение всех голосов
- Адаптация коммуникации

**Связанные модели:**
- [DISC](DISC.md) — понимание разных типов личности

**Ресурсы:**
- [Понимание ценности различий](https://tlroadmap.io/self-skills/relationship/diversity.html)
- [Project Include](https://projectinclude.org/)

##### Эмоциональный интеллект

Способность распознавать и управлять эмоциями — своими и других людей. EQ часто важнее IQ для лидеров.

**Компоненты (Goleman):**

| Компонент | Описание | Как развивать |
|-----------|----------|---------------|
| Self-awareness | Понимание своих эмоций | Journaling, медитация, фидбек |
| Self-regulation | Управление эмоциями | Пауза перед реакцией, дыхание |
| Motivation | Внутренняя мотивация | Цели, смысл работы |
| Empathy | Понимание эмоций других | Активное слушание, наблюдение |
| Social skills | Управление отношениями | Практика, networking |

**Признаки высокого EQ:**
- Способность сохранять спокойствие под давлением
- Понимание невербальных сигналов
- Адаптация стиля общения под собеседника
- Конструктивная реакция на критику
- Способность вдохновлять и мотивировать

**Связанные модели:**
- [DISC](DISC.md) — типы личности

**Ресурсы:**
- [Эмоциональный интеллект](https://tlroadmap.io/self-skills/relationship/emotional-intelligence.html)
- [Emotional Intelligence (Daniel Goleman)](https://www.amazon.com/Emotional-Intelligence-Matter-More-Than/dp/055338371X)
- [Primal Leadership](https://www.amazon.com/Primal-Leadership-Realizing-Emotional-Intelligence/dp/1591391849)

#### Развитие себя

Непрерывное развитие — ключевой навык для тимлида. Технологии и практики меняются, и лидер должен расти вместе с ними.

##### Работа с привычками

Формирование полезных привычек и избавление от вредных. Маленькие ежедневные действия создают большие результаты.

**Модели:**

**Atomic Habits (James Clear):**
- Привычка = Сигнал → Желание → Действие → Награда
- 1% improvement daily = 37x за год
- Системы важнее целей
- Identity-based habits

**Habit Loop (Charles Duhigg):**
- Cue → Routine → Reward
- Изменение routine при сохранении cue и reward

**Полезные привычки тимлида:**
- Утренний обзор приоритетов
- Регулярные 1-on-1
- Weekly review
- Чтение/обучение
- Физическая активность

**Техника внедрения:**
1. Начать с минимального действия (2 минуты)
2. Привязать к существующей привычке
3. Создать очевидные триггеры
4. Отмечать выполнение

**Ресурсы:**
- [Работа с привычками](https://tlroadmap.io/self-skills/self-development/habits.html)
- [Atomic Habits](https://jamesclear.com/atomic-habits)
- [The Power of Habit](https://www.amazon.com/Power-Habit-What-Life-Business/dp/081298160X)

##### Умение учиться

Навыки эффективного обучения. Meta-skill, который усиливает все остальные навыки.

**Техники:**

| Техника | Описание | Когда применять |
|---------|----------|-----------------|
| Spaced Repetition | Повторение с интервалами | Запоминание фактов |
| Active Recall | Активное вспоминание | Изучение концепций |
| Feynman Technique | Объяснение простыми словами | Глубокое понимание |
| Deliberate Practice | Целенаправленная практика | Навыки |
| Learning in Public | Публичное обучение | Мотивация, фидбек |

**Feynman Technique:**
1. Выбрать концепцию
2. Объяснить простыми словами (как ребёнку)
3. Выявить пробелы в понимании
4. Вернуться к источнику и упростить

**Пирамида обучения (retention rates):**
```
Лекция            5%
Чтение           10%
Аудио/Видео      20%
Демонстрация     30%
Обсуждение       50%
Практика         75%
Обучение других  90%
```

**Практики для тимлида:**
- Регулярное чтение (книги, статьи)
- Участие в конференциях
- Обучение команды (усиливает своё понимание)
- Эксперименты и pet-projects
- Ведение заметок (Obsidian, Notion)

**Ресурсы:**
- [Умение учиться](https://tlroadmap.io/self-skills/self-development/learning.html)
- [Learning How to Learn (Coursera)](https://www.coursera.org/learn/learning-how-to-learn)
- [Ultralearning](https://www.amazon.com/Ultralearning-Master-Outsmart-Competition-Accelerate/dp/006285268X)

##### Рефлексия

Анализ своих действий и решений. Рефлексия превращает опыт в обучение.

**Почему важно:**
- Извлечение уроков из опыта
- Выявление паттернов поведения
- Корректировка курса
- Предотвращение повторных ошибок

**Практики:**

| Практика | Частота | Описание |
|----------|---------|----------|
| Journaling | Ежедневно | Запись мыслей и наблюдений |
| Weekly Review | Еженедельно | Анализ недели, планирование |
| Monthly Retrospective | Ежемесячно | Глубокий анализ месяца |
| Quarterly Goals Review | Ежеквартально | Оценка прогресса по целям |
| Annual Review | Ежегодно | Анализ года, планирование следующего |

**Вопросы для рефлексии:**
- Что прошло хорошо? Почему?
- Что можно было сделать лучше?
- Что я узнал?
- Что я буду делать по-другому?
- Какие паттерны я замечаю?

**Weekly Review (шаблон):**
```markdown
## Неделя [дата]

### Достижения
- ...

### Вызовы
- ...

### Уроки
- ...

### Фокус на следующую неделю
- ...
```

**Ресурсы:**
- [Рефлексия](https://tlroadmap.io/self-skills/self-development/reflection.html)
- [The Bullet Journal Method](https://www.amazon.com/Bullet-Journal-Method-Present-Design/dp/0525533338)

#### Мышление

##### Принятие решений

Процесс решения проблем через выбор оптимального варианта.

**Процесс принятия решений:**
1. Идентификация и понимание проблемы
2. Определение целей
3. Сбор информации и генерация альтернатив
4. Оценка альтернатив по критериям
5. Конвертация субъективных оценок в числовые значения
6. Установление порогов отсечения
7. Реализация с итеративным пересмотром

**Фреймворки:**
- Decision Matrix
- PDCA (Deming-Shewhart Cycle)
- Theory of Constraints
- TRIZ (теория решения изобретательских задач)

**Хорошие практики:**
- Рассматривать несколько вариантов одновременно
- Использовать проверенные практики из других команд/индустрий
- Быстрые интуитивные решения для простых проблем
- Post-mortem анализ для улучшения будущих решений
- Баланс аналитической строгости и затраченных ресурсов

**Антипаттерны:**
- Чрезмерная привязанность к первому впечатлению
- Принятие решений в эмоциональном состоянии
- Прокрастинация или преждевременные решения
- Выбор пути наименьшего сопротивления вместо решения корневой проблемы

**Ресурсы:**
- [Принятие решений](https://tlroadmap.io/self-skills/thinking/decision-making.html)
- [Decision Theory](https://en.wikipedia.org/wiki/Decision_theory)
- [Thinking, Fast and Slow](https://www.amazon.com/Thinking-Fast-Slow-Daniel-Kahneman/dp/0374533555)

##### Стратегическое видение

Способность видеть долгосрочную перспективу и принимать решения с учётом будущего.

**Компоненты стратегического мышления:**
- Анализ трендов и рынка
- Понимание бизнес-целей
- Видение технического развития
- Оценка рисков и возможностей
- Планирование на 1-3-5 лет

**Инструменты стратегического планирования:**
- SWOT-анализ
- Porter's Five Forces
- Technology Radar
- Scenario Planning
- OKR для долгосрочных целей

**Практики развития:**
- Чтение индустриальных отчётов
- Участие в конференциях
- Networking с лидерами индустрии
- Анализ конкурентов
- Обсуждение стратегии с руководством

**Ресурсы:**
- [Стратегическое видение](https://tlroadmap.io/self-skills/thinking/strategic-vision.html)
- [Good Strategy Bad Strategy](https://www.amazon.com/Good-Strategy-Bad-Difference-Matters/dp/0307886239)
- [Technology Radar](https://www.thoughtworks.com/radar)

#### Тайм-менеджмент

Навыки эффективного управления временем.

##### Постановка личных целей

Определение и формулирование личных и профессиональных целей.

**Методологии:**
- **SMART** — Specific, Measurable, Achievable, Relevant, Time-bound
- **OKR** — Objectives and Key Results

**Ресурсы:**
- [Постановка личных целей](https://tlroadmap.io/self-skills/time-management/goal-setting.html)
- [SMART Goals](https://www.mindtools.com/pages/article/smart-goals.htm)
- [OKR Framework](https://www.whatmatters.com/resources/okr-meaning-examples)

##### Управление приоритетами

Умение различать срочное и важное.

**Техники:**
- **Матрица Эйзенхауэра:**

|  | Срочно | Не срочно |
|--|--------|-----------|
| **Важно** | Делать сейчас | Планировать |
| **Не важно** | Делегировать | Отказаться |

- **MoSCoW** — Must, Should, Could, Won't
- **Eat the Frog** — начинать с самой сложной задачи

**Ресурсы:**
- [Управление приоритетами](https://tlroadmap.io/self-skills/time-management/prioritization.html)
- [Матрица Эйзенхауэра](https://ru.wikipedia.org/wiki/Матрица_Эйзенхауэра)
- [MoSCoW Method](https://www.agilebusiness.org/dsdm-project-framework/moscow-prioritisation.html)

##### Управление временем

Техники для эффективного использования времени.

**Методы:**
- **Pomodoro** — 25 минут работы, 5 минут отдыха
- **Time Blocking** — выделение блоков времени под задачи
- **GTD** (Getting Things Done) — система управления задачами
- **Weekly Review** — еженедельный обзор и планирование

**Инструменты:**
- Todoist, Things 3, OmniFocus
- Calendly, Cal.com
- RescueTime, Toggl

**Ресурсы:**
- [Управление временем](https://tlroadmap.io/self-skills/time-management/time-management.html)
- [Pomodoro Technique](https://francescocirillo.com/pages/pomodoro-technique)
- [Getting Things Done](https://gettingthingsdone.com/)
- [Time Blocking](https://calendar.com/blog/time-blocking/)
- [Deep Work (Cal Newport)](https://www.amazon.com/Deep-Work-Focused-Success-Distracted/dp/1455586692)


---
### Книги и ресурсы

#### Менеджмент и лидерство
- [The Manager's Path](https://www.amazon.com/Managers-Path-Leaders-Navigating-Growth/dp/1491973897) — Camille Fournier
- [An Elegant Puzzle](https://www.amazon.com/Elegant-Puzzle-Systems-Engineering-Management/dp/1732265186) — Will Larson
- [Staff Engineer](https://staffeng.com/book) — Will Larson
- [High Output Management](https://www.amazon.com/High-Output-Management-Andrew-Grove/dp/0679762884) — Andy Grove
- [The Five Dysfunctions of a Team](https://www.amazon.com/Five-Dysfunctions-Team-Leadership-Fable/dp/0787960756) — Patrick Lencioni
- [Turn the Ship Around!](https://www.amazon.com/Turn-Ship-Around-Turning-Followers/dp/1591846404) — L. David Marquet

#### Техническое лидерство
- [Fundamentals of Software Architecture](https://www.oreilly.com/library/view/fundamentals-of-software/9781492043447/)
- [Building Evolutionary Architectures](https://www.oreilly.com/library/view/building-evolutionary-architectures/9781491986356/)
- [Clean Architecture](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) — Robert Martin
- [Designing Data-Intensive Applications](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321) — Martin Kleppmann
- **Внутренние:** [Чистый Код](../Books/Чистый%20код/Чистый%20Код%20-%20Роберт%20Мартин.md), [Создание микросервисов](../Books/Создание%20микросервиссов%20-%20Сэм%20Ньюмэн.md)

#### Процессы и продуктивность
- [The Phoenix Project](https://www.amazon.com/Phoenix-Project-DevOps-Helping-Business/dp/0988262509)
- [Team Topologies](https://teamtopologies.com/)
- [Accelerate](https://www.amazon.com/Accelerate-Software-Performing-Technology-Organizations/dp/1942788339)
- **Внутренние:** [Scrum. Революционный метод](../Books/Scrum.%20Революционный%20метод%20управления%20проектами.md), [Грокаем алгоритмы](../Books/Грокаем%20алгоритмы.md)

#### Коммуникация и soft skills
- [Radical Candor](https://www.radicalcandor.com/)
- [Crucial Conversations](https://www.amazon.com/Crucial-Conversations-Talking-Stakes-Second/dp/0071771328)
- [Nonviolent Communication](https://www.amazon.com/Nonviolent-Communication-Language-Life-Changing-Relationships/dp/189200528X)
- [Thanks for the Feedback](https://www.amazon.com/Thanks-Feedback-Science-Receiving-Well/dp/0670014664)


---
### Инструменты тимлида

#### Управление задачами
- Jira, Linear, YouTrack, Asana
- Notion, Confluence

#### Коммуникация
- Slack, Microsoft Teams
- Zoom, Google Meet

#### Визуализация и планирование
- Miro, FigJam, Lucidchart
- Excalidraw, Draw.io

#### Мониторинг и observability
- Grafana, Datadog, New Relic
- PagerDuty, Opsgenie

#### CI/CD
- GitHub Actions, GitLab CI
- Jenkins, ArgoCD

#### Документация
- Notion, Confluence
- MkDocs, Docusaurus
- Swagger, Redoc


---
### Внутренние ссылки (репозиторий)

#### Архитектура и разработка
- [Архитектура](../architecture/architecture.md)
- [SOLID принципы](../architecture/SOLID%20принципы.md)
- [System Design](../architecture/System%20Design/System%20Design.md)
- [MV-паттерны](../architecture/Architecture/MV-patterns.md)
- [FSD](../architecture/Architecture/FSD/FSD.md)
- [Микросервисы](../backend/Microservices/Микросервисы.md)

#### DevOps и инфраструктура
- [DevOps](../devops/devops.md)
- [CI/CD](../devops/CI-CD.md)
- [Kubernetes](../devops/kubernetes/Kubernetes%20+%20Helm.md)
- [Docker](../devops/docker/Docker%20+%20Ansible.md)

#### Разработка
- [Frontend](../frontend/frontend.md)
- [Backend](../backend/backend.md)
- [JavaScript](../frontend/JavaScript/JavaScript.md)
- [TypeScript](../edge/TypeScript/TypeScript.md)
- [Node.js](../backend/NodeJS/Node.js%20-%20с%20нуля%2C%20основы%20и%20построение%20архитектуры%20приложений.md)

#### Базы данных
- [Базы данных](../database/database.md)
- [PostgreSQL](../database/PostgreSQL.md)
- [MongoDB](../database/Mongo%20DB.md)
- [Redis](../database/Redis.md)

#### Git и версионирование
- [Git](../cs/GIT/Git.md)
- [GitFlow](../cs/GIT/GitFlow.md)
- [GitHub Actions](../cs/GIT/Github%20Actions.md)

#### Тестирование
- [Тестирование](../testing/testing.md)

#### AI
- [AI](../ai/AI.md)
- [AI Engineering](../ai/AI%20Engineering.md)
- [AI Instruments](../ai/AI%20Instruments.md)


---
### Внешние ссылки

- [TL Roadmap](https://tlroadmap.io/)
- [Engineering Ladders](https://www.engineeringladders.com/)
- [Progression.fyi](https://www.progression.fyi/)
- [Manager README](https://managerreadme.com/)
- [re:Work by Google](https://rework.withgoogle.com/)
- [LeadDev](https://leaddev.com/)
- [StaffEng](https://staffeng.com/)
- [Software Lead Weekly](https://softwareleadweekly.com/)
- [The Engineering Manager](https://theengineeringmanager.substack.com/)
