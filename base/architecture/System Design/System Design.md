---
tags:
  - systemdesign
  - db
---



---

## Основные термины



## Хранение данных




## Распределённое хранение данных




## Паттерны и приёмы проектирования



## Дизайн популярных систем














---

## Основные термины

Масштабируемость (Scalability): вертикальная vs горизонтальная
Доступность (Availability): SLA, SLO, SLI, 9s (99.9%, 99.99%)
Производительность (Performance): latency, throughput, QPS
Надёжность (Reliability): fault tolerance, resilience
Консистентность (Consistency): ACID, CAP theorem, BASE
Пропускная способность (Throughput): TPS, RPS
Задержка (Latency): p50, p95, p99
Кэширование (Caching): cache-aside, write-through, write-back
Балансировка нагрузки (Load Balancing): round-robin, least connections, consistent hashing
Репликация (Replication): master-slave, master-master
Шардирование (Sharding): horizontal partitioning
Очереди (Message Queues): pub/sub, point-to-point
API Gateway: routing, authentication, rate limiting
CDN (Content Delivery Network)
Микросервисы vs Монолит
Stateless vs Stateful сервисы

## Хранение данных

Детализировать типы и подходы:

Типы баз данных:
Реляционные (SQL): PostgreSQL, MySQL, Oracle
NoSQL: документные (MongoDB), ключ-значение (Redis), колоночные (Cassandra), графовые (Neo4j)
In-memory: Redis, Memcached
Поисковые: Elasticsearch, Solr
Индексы: B-tree, LSM-tree, hash indexes
Транзакции: ACID свойства, изоляция уровней
Нормализация vs Денормализация
Оптимизация запросов: explain plans, индексы, партиционирование
Backup и восстановление: стратегии, RPO, RTO


## Распределённое хранение данных

Углубить концепции распределённых систем:

CAP Theorem: Consistency, Availability, Partition tolerance
PACELC Theorem: расширение CAP
Консенсус алгоритмы: Raft, Paxos, PBFT
Репликация:
Синхронная vs асинхронная
Master-slave, master-master, multi-master
Quorum, read/write quorum
Шардирование:
Стратегии: range-based, hash-based, directory-based
Проблемы: hot spots, rebalancing
Consistent hashing
Распределённые транзакции: 2PC, Saga pattern, TCC
Eventual consistency: vector clocks, CRDTs
Distributed locks: Redis, ZooKeeper, etcd
Leader election: алгоритмы и реализации

## Паттерны и приёмы проектирования

Систематизировать архитектурные паттерны:

Архитектурные паттерны:
Layered Architecture
Microservices
Event-Driven Architecture
CQRS (Command Query Responsibility Segregation)
Event Sourcing
Serverless
Service Mesh
Паттерны масштабирования:
Horizontal vs Vertical scaling
Database sharding
Read replicas
Caching strategies
CDN
Паттерны отказоустойчивости:
Circuit Breaker
Retry with exponential backoff
Bulkhead
Timeout
Graceful degradation
Паттерны обработки данных:
Batch processing
Stream processing
MapReduce
Lambda architecture
Kappa architecture
Паттерны коммуникации:
API Gateway
Service Discovery
Message Queue
Pub/Sub
Request/Response
Паттерны безопасности:
Authentication & Authorization
OAuth 2.0, JWT
Rate limiting
Encryption at rest and in transit

## Дизайн популярных систем

Добавить case studies реальных систем:

URL Shortener (bit.ly, TinyURL)
Distributed Cache (Redis, Memcached)
Chat System (WhatsApp, Slack)
News Feed (Facebook, Twitter)
Video Streaming (YouTube, Netflix)
Search Engine (Google)
E-commerce Platform (Amazon)
Ride-sharing (Uber, Lyft)
Payment System (Stripe, PayPal)
File Storage (Dropbox, Google Drive)
Notification System
Analytics System
Для каждой системы описать:

Функциональные требования
Нефункциональные требования (масштаб, производительность)
Архитектура высокого уровня
Компоненты системы
Масштабирование и оптимизация
Trade-offs и решения
Дополнительные разделы для добавления

## Методология проектирования

Процесс интервью по System Design
Шаги проектирования: требования, оценка масштаба, API, схема данных, архитектура, детализация
Оценка масштаба: пользователи, запросы, хранение, пропускная способность
Back-of-the-envelope calculations


## Инструменты и технологии


Базы данных: PostgreSQL, MySQL, MongoDB, Cassandra, Redis, Elasticsearch
Очереди: RabbitMQ, Kafka, AWS SQS
Кэширование: Redis, Memcached, CDN
Мониторинг: Prometheus, Grafana, ELK Stack
Оркестрация: Kubernetes, Docker Swarm
Service Mesh: Istio, Linkerd


## Метрики и мониторинг

Метрики производительности
Логирование и трейсинг
Алертинг
Dashboards


---
## Дополнительно

### ДЗ

#### Первая часть

**Необходимо спроектировать мессенджер WhatsApp** самостоятельно (_даже если вы еще ничего не знаете или если ваш дизайн будет состоять из одного сервера и БД - это будет НОРМАЛЬНО_)

**Показывать этот дизайн никому не нужно**, он будет лишь только у вас - после каждого занятия вы будете возвращаться к этому дизайну - смотреть на то, что было сделано неправильно и изменять, исходя из полученных знаний на уроках (_а в конце курса, я покажу - как бы я спроектировал подобную систему_).

**Требования к системе:**

- Сезонности у системы нет;
- Системой будут пользоваться по всему миру;
- Приложение будет показывать непрочитанные сообщения;
- Приложение будет поддерживать чаты и личные сообщения;
- Отправлять можно только текст и картинки в сообщениях;
- Максимальный размер изображения в сообщении = 1МБ;
- Максимальное кол-во изображений в сообщении = 3;
- Максимальный размер текста в сообщении = 2000 символов;
- Клиентами будут мобильные, десктопные и WEB приложения;
- 200 000 000 уникальных пользователей заходят в приложение каждый день;
- Каждый пользователь в среднем отправляет 10 сообщений в день;
- Каждый пользователь в среднем просматривает сообщения 20 раз в день;
- Система должна работать 24 на 7 (допустимо 4 часа и 23 минуты простоя в год);
- Приложение должно показывать статусы онлайн/оффлайн пользователей, а также когда пользователь был последний раз в сети;
- Сообщение до получателя должно успевать доходить за 3 секунды (_если пользователя нет в сети - ему должно прийти Push уведомление на мобильный телефон_);
- Приложение должно поддерживать кросс-девайсную синхронизацию (_если у вас это приложение открыто на телефоне и ноутбуке, и например вы прочитали сообщение на телефоне, то сообщение должно отобразиться прочитанным и на ноутбуке_);

**Дополнительно:**

- Фронтенд проектировать не нужно (_концентрируемся только на бэкенде_)
- Аутентификацию проектировать не нужно (_представим, что эта часть системы уже кем-то реализована_)

Для дизайна можно пользоваться инструментами [Lucidchart](https://www.lucidchart.com/pages/ru) или [Miro](https://miro.com/) - там достаточно богатый функционал и в будущем вам будет просто туда вносить изменения. В дизайне хотелось бы видеть:

- Расчет нагрузки и потребления памяти у основных операций.
- Модель данных (_описать основные сущности в БД и как они взаимосвязаны_);
- API (_расписывать REST или GraphQL не нужно - просто словами опишите основные операции над вашей системой_);
- Верхнеуровневое проектирование основных компонентов системы и их отношений с другими компонентами системы;

**Желаем удачи в дизайне WhatsApp!** (_после курса будет очень любопытно понаблюдать за собственным прогрессом_)

#### Вторая часть

**Итоговый проект**

Все домашние задания вас постепенно приближали к созданию итогового проекта по проектированию социальной сети ВКонтакте.

Хотелось бы, чтобы у вас в итоге получился весомый репозиторий, с полноценной архитектурой приложения, чтобы в будущем вы могли это продемонстрировать на собеседованиях или рассказать об этом своему работодателю.

**Функциональные требования** - их необходимо взять из первого домашнего задания по проектирования API (_все те операции из API необходимо будет воплотить в будущей архитектуре_).

**Нефункциональные требования** - у вас есть бизнес заказчик [со следующей информацией](https://vc.ru/vk/279614-auditoriya-vkontakte-2021-ezhegodnyy-rost-prodolzhaetsya) о DAU и активностях пользователей. Остальные нефункциональные требования по доступности, согласованности, лимитах и всем остальном вам нужно определить самостоятельно, исходя из вашего опыта.

**Верхнеуровневый дизайн** - необходимо сделать верхнеуровневый дизайн с использованием [C4 model](https://c4model.com/) (_не спускаемся ниже второго уровня - только system и container diagram_) и [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML) (_можно пользоваться_ [_PlantUML Online Editor_](http://www.plantuml.com/plantuml/uml/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000)_, чтобы не приходилось ставить ничего дополнительного на ваш компьютер_)

В репозитории необходимо сделать презентабельную [README.md](http://README.md) с описанием системы и требований, верхнеуровневым дизайном, а также с основыми расчетами. Хотелось бы, чтобы у вас в итоге получилось что-то [похожее на это](https://github.com/Balun-courses/system_design) (_индивидуальность приветствуется_).

### Чеклист

- Availability
- Consistency (strong / eventual)
- Количество пользователей (DAU / MAU)
- Количество сущностей (например кол-во отелей или задач на LeetCode)
- Лимиты и ограничения (например макс размер сообщения / картинки или макс кол-во людей в чате)
- Поведение пользователей (как много операций в день / неделю / месяц осуществляет пользователь)
- Data retention (храним ли все или можем что-то удалять / агрегировать / ...)
- Response time (на создание / получение / удаление / сохранение / ...)
- Безопасность (если нужно)
- Геораспределенность
- Сезонности

### Дополнительные материалы

КНИГИ:

- Высоконагруженные приложения. Программирование, масштабирование, поддержка
- Site Reliability Engineering. Надежность и безотказность как в Google
- System Design. Подготовка к сложному интервью
- Микросервисы. Паттерны разработки и рефакторинга
- Распределенные системы

ВИДЕО-КУРСЫ:

- [HighLoad](https://www.youtube.com/playlist?list=PL4_hYwCyhAvZuoK6Y0FaCh-25jEYtBvDo)
- [Распределенные системы](https://www.youtube.com/playlist?list=PLEqoHzpnmTfAW2gYw2R80EmGDwWqUR9mD)

РЕКОМЕНДУЕМЫЕ СТАТЬИ:

- [Graceful degradation](https://habr.com/ru/companies/yandex/articles/438606/)
- [Теория шардирования](https://habr.com/ru/companies/oleg-bunin/articles/433370/)
- [Consistent против Rendezvous](https://habr.com/ru/companies/mygames/articles/669390/)
- [Как работают реляционные базы данных](https://habr.com/ru/articles/487654/)
- [У семи программистов адрес без дома](https://habr.com/ru/companies/hflabs/articles/260601/)
- [Гид по заголовкам кэширования HTTP для начинающих](https://habr.com/ru/articles/253121/)
- [Как сэкономить миллион долларов на базе данных на высоконагруженном проекте](https://habr.com/ru/companies/oleg-bunin/articles/310690/)
- [Архитектура in-memory СУБД](https://habr.com/ru/companies/vk/articles/562192/)
- [Архитектура Mail.ru Cloud Storage](https://habr.com/ru/companies/vk/articles/513356/)
- [Паттерн Outbox](https://habr.com/ru/companies/lamoda/articles/678932/)
