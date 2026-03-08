---
tags:
  - redis
  - database
  - cache
  - backend
  - nosql
---

## Redis

**Redis** (Remote Dictionary Server) — высокопроизводительное in-memory хранилище данных типа ключ-значение. Используется как база данных, кэш, брокер сообщений и очередь задач.

---

### Что такое Redis

Redis хранит данные в оперативной памяти, что обеспечивает время отклика в микросекундах. В отличие от традиционных БД, Redis не использует SQL — это NoSQL хранилище с богатым набором структур данных.

**Ключевые характеристики:**

| Характеристика | Описание |
|----------------|----------|
| **In-memory** | Данные в ОЗУ, скорость чтения ~100k ops/sec |
| **Персистентность** | Опциональное сохранение на диск (RDB, AOF) |
| **Структуры данных** | Strings, Lists, Sets, Hashes, Sorted Sets, Streams |
| **Атомарность** | Все операции атомарны |
| **Репликация** | Master-Replica, Redis Cluster |
| **Pub/Sub** | Встроенная система сообщений |

---

### Преимущества и сценарии использования

#### Когда использовать Redis

| Сценарий | Описание |
|----------|----------|
| **Кэширование** | Кэш БД-запросов, сессий, API-ответов |
| **Сессии** | Хранение пользовательских сессий |
| **Rate Limiting** | Ограничение количества запросов |
| **Очереди задач** | Job queues, фоновые задачи |
| **Leaderboards** | Рейтинги, таблицы лидеров (Sorted Sets) |
| **Real-time analytics** | Счётчики, метрики в реальном времени |
| **Pub/Sub** | Уведомления, чаты, события |
| **Distributed locks** | Блокировки в распределённых системах |

#### Преимущества

- **Скорость** — операции за микросекунды
- **Простота** — понятный API, легко начать
- **Гибкость** — множество структур данных
- **Атомарность** — встроенные атомарные операции (INCR, LPUSH)
- **TTL** — автоматическое истечение ключей
- **Кластеризация** — горизонтальное масштабирование

#### Когда НЕ использовать Redis

- Основное хранилище критичных данных (без бэкапа в persistent DB)
- Данные больше доступной RAM
- Сложные запросы с JOIN, агрегациями
- ACID-транзакции с откатом

---

### Установка

#### macOS

```bash
brew install redis
brew services start redis

# Проверка
redis-cli ping
# PONG
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install redis-server

# Запуск
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Проверка статуса
sudo systemctl status redis-server
```

#### Windows (WSL2)

```bash
# В WSL2 Ubuntu
sudo apt update
sudo apt install redis-server

# Запуск
sudo service redis-server start
```

#### Docker

```bash
# Запуск контейнера
docker run --name redis -p 6379:6379 -d redis:7-alpine

# С персистентностью
docker run --name redis -p 6379:6379 -v redis-data:/data -d redis:7-alpine redis-server --appendonly yes

# Подключение
docker exec -it redis redis-cli
```

#### Подключение к CLI

```bash
# Локальное подключение
redis-cli

# Удалённое подключение
redis-cli -h hostname -p 6379 -a password

# С URL
redis-cli -u redis://user:password@hostname:6379/0
```

---

### Базовые команды

#### Strings (строки)

Самый простой тип данных. Может хранить строки, числа, бинарные данные (до 512 MB).

```bash
# Установка значения
127.0.0.1:6379> SET name "Valery"
OK

# Получение значения
127.0.0.1:6379> GET name
"Valery"

# Установка с TTL (секунды)
127.0.0.1:6379> SETEX session:123 3600 "user_data"
OK

# Установка только если ключ не существует
127.0.0.1:6379> SETNX lock:resource "locked"
(integer) 1

# Установка нескольких значений
127.0.0.1:6379> MSET key1 "value1" key2 "value2"
OK

127.0.0.1:6379> MGET key1 key2
1) "value1"
2) "value2"
```

#### Числовые операции

```bash
# Инкремент (атомарный)
127.0.0.1:6379> SET counter 10
OK

127.0.0.1:6379> INCR counter
(integer) 11

127.0.0.1:6379> INCRBY counter 5
(integer) 16

127.0.0.1:6379> DECR counter
(integer) 15

# Для float
127.0.0.1:6379> SET price 10.50
OK

127.0.0.1:6379> INCRBYFLOAT price 0.25
"10.75"
```

#### Управление ключами

```bash
# Проверка существования
127.0.0.1:6379> EXISTS name
(integer) 1

# Удаление
127.0.0.1:6379> DEL name
(integer) 1

# Тип ключа
127.0.0.1:6379> TYPE mykey
string

# Поиск ключей по паттерну (ОСТОРОЖНО в production!)
127.0.0.1:6379> KEYS user:*
1) "user:1"
2) "user:2"

# Безопасный итератор (для production)
127.0.0.1:6379> SCAN 0 MATCH user:* COUNT 100
1) "0"
2) 1) "user:1"
   2) "user:2"

# Переименование
127.0.0.1:6379> RENAME oldkey newkey
OK

# Очистка всей базы (ОПАСНО!)
127.0.0.1:6379> FLUSHDB
OK

# Очистка всех баз (ОЧЕНЬ ОПАСНО!)
127.0.0.1:6379> FLUSHALL
OK
```

---

### TTL (Time To Live)

Redis автоматически удаляет ключи по истечении срока жизни.

```bash
# Установка TTL для существующего ключа (секунды)
127.0.0.1:6379> SET mykey "value"
OK

127.0.0.1:6379> EXPIRE mykey 60
(integer) 1

# Проверка оставшегося времени
127.0.0.1:6379> TTL mykey
(integer) 58

# -1 = ключ без TTL (бессрочный)
# -2 = ключ не существует

# TTL в миллисекундах
127.0.0.1:6379> PTTL mykey
(integer) 57500

# Установка с TTL сразу
127.0.0.1:6379> SETEX session:abc 3600 "data"
OK

# В миллисекундах
127.0.0.1:6379> PSETEX temp 5000 "expires in 5 seconds"
OK

# SET с опциями (современный способ)
127.0.0.1:6379> SET key "value" EX 60 NX
OK
# EX seconds | PX milliseconds
# NX = только если не существует
# XX = только если существует

# Удаление TTL (сделать бессрочным)
127.0.0.1:6379> PERSIST mykey
(integer) 1

# Установка абсолютного времени истечения (Unix timestamp)
127.0.0.1:6379> EXPIREAT mykey 1735689600
(integer) 1
```

---

### Структуры данных

#### Lists (списки)

Упорядоченные коллекции строк. Реализованы как linked lists — O(1) для добавления в начало/конец.

```bash
# Добавление в начало (слева)
127.0.0.1:6379> LPUSH tasks "task3"
(integer) 1
127.0.0.1:6379> LPUSH tasks "task2"
(integer) 2
127.0.0.1:6379> LPUSH tasks "task1"
(integer) 3

# Добавление в конец (справа)
127.0.0.1:6379> RPUSH tasks "task4"
(integer) 4

# Получение диапазона (0 = первый, -1 = последний)
127.0.0.1:6379> LRANGE tasks 0 -1
1) "task1"
2) "task2"
3) "task3"
4) "task4"

# Получение элемента по индексу
127.0.0.1:6379> LINDEX tasks 0
"task1"

# Длина списка
127.0.0.1:6379> LLEN tasks
(integer) 4

# Удаление и возврат из начала/конца
127.0.0.1:6379> LPOP tasks
"task1"

127.0.0.1:6379> RPOP tasks
"task4"

# Блокирующее ожидание (для очередей)
127.0.0.1:6379> BLPOP queue 30
# Ждёт 30 секунд появления элемента

# Обрезка списка (оставить только диапазон)
127.0.0.1:6379> LTRIM tasks 0 99
OK
```

**Применение Lists:**
- Очереди задач (LPUSH + BRPOP)
- Лента событий (последние N элементов)
- История действий

#### Sets (множества)

Неупорядоченные коллекции уникальных строк.

```bash
# Добавление элементов
127.0.0.1:6379> SADD tags "javascript" "redis" "backend"
(integer) 3

# Повторное добавление не работает
127.0.0.1:6379> SADD tags "javascript"
(integer) 0

# Все элементы
127.0.0.1:6379> SMEMBERS tags
1) "backend"
2) "javascript"
3) "redis"

# Проверка наличия
127.0.0.1:6379> SISMEMBER tags "redis"
(integer) 1

# Количество элементов
127.0.0.1:6379> SCARD tags
(integer) 3

# Удаление элемента
127.0.0.1:6379> SREM tags "backend"
(integer) 1

# Случайный элемент
127.0.0.1:6379> SRANDMEMBER tags
"javascript"

# Операции над множествами
127.0.0.1:6379> SADD set1 "a" "b" "c"
127.0.0.1:6379> SADD set2 "b" "c" "d"

# Пересечение
127.0.0.1:6379> SINTER set1 set2
1) "b"
2) "c"

# Объединение
127.0.0.1:6379> SUNION set1 set2
1) "a"
2) "b"
3) "c"
4) "d"

# Разность
127.0.0.1:6379> SDIFF set1 set2
1) "a"
```

**Применение Sets:**
- Теги, категории
- Уникальные посетители
- Друзья, подписчики (пересечение = общие друзья)

#### Hashes (хэши)

Коллекции пар поле-значение. Идеальны для хранения объектов.

```bash
# Установка полей
127.0.0.1:6379> HSET user:1 name "John" email "john@example.com" age 30
(integer) 3

# Получение поля
127.0.0.1:6379> HGET user:1 name
"John"

# Получение нескольких полей
127.0.0.1:6379> HMGET user:1 name email
1) "John"
2) "john@example.com"

# Все поля и значения
127.0.0.1:6379> HGETALL user:1
1) "name"
2) "John"
3) "email"
4) "john@example.com"
5) "age"
6) "30"

# Только ключи или значения
127.0.0.1:6379> HKEYS user:1
1) "name"
2) "email"
3) "age"

127.0.0.1:6379> HVALS user:1
1) "John"
2) "john@example.com"
3) "30"

# Проверка существования поля
127.0.0.1:6379> HEXISTS user:1 email
(integer) 1

# Удаление поля
127.0.0.1:6379> HDEL user:1 age
(integer) 1

# Инкремент числового поля
127.0.0.1:6379> HINCRBY user:1 login_count 1
(integer) 1

# Количество полей
127.0.0.1:6379> HLEN user:1
(integer) 2
```

**Применение Hashes:**
- Профили пользователей
- Сессии с метаданными
- Конфигурации
- Счётчики по категориям

#### Sorted Sets (упорядоченные множества)

Множества с score (весом) для каждого элемента. Автоматически сортируются по score.

```bash
# Добавление элементов с score
127.0.0.1:6379> ZADD leaderboard 100 "player1" 85 "player2" 150 "player3"
(integer) 3

# Диапазон по позиции (от меньшего score к большему)
127.0.0.1:6379> ZRANGE leaderboard 0 -1
1) "player2"
2) "player1"
3) "player3"

# С выводом score
127.0.0.1:6379> ZRANGE leaderboard 0 -1 WITHSCORES
1) "player2"
2) "85"
3) "player1"
4) "100"
5) "player3"
6) "150"

# В обратном порядке (топ игроки)
127.0.0.1:6379> ZREVRANGE leaderboard 0 2 WITHSCORES
1) "player3"
2) "150"
3) "player1"
4) "100"
5) "player2"
6) "85"

# Ранг элемента (позиция)
127.0.0.1:6379> ZRANK leaderboard "player1"
(integer) 1

127.0.0.1:6379> ZREVRANK leaderboard "player1"
(integer) 1

# Score элемента
127.0.0.1:6379> ZSCORE leaderboard "player1"
"100"

# Инкремент score
127.0.0.1:6379> ZINCRBY leaderboard 10 "player1"
"110"

# Диапазон по score
127.0.0.1:6379> ZRANGEBYSCORE leaderboard 80 120 WITHSCORES
1) "player2"
2) "85"
3) "player1"
4) "110"

# Количество элементов
127.0.0.1:6379> ZCARD leaderboard
(integer) 3

# Количество в диапазоне score
127.0.0.1:6379> ZCOUNT leaderboard 80 120
(integer) 2

# Удаление
127.0.0.1:6379> ZREM leaderboard "player2"
(integer) 1
```

**Применение Sorted Sets:**
- Лидерборды, рейтинги
- Приоритетные очереди
- Временные метки (score = timestamp)
- Rate limiting (sliding window)

#### Streams (потоки)

Append-only структура для логов и событий (добавлено в Redis 5.0).

```bash
# Добавление события (* = автогенерация ID)
127.0.0.1:6379> XADD events * action "login" user "john"
"1699123456789-0"

127.0.0.1:6379> XADD events * action "purchase" user "john" amount "100"
"1699123456790-0"

# Чтение событий
127.0.0.1:6379> XRANGE events - +
1) 1) "1699123456789-0"
   2) 1) "action"
      2) "login"
      3) "user"
      4) "john"
2) 1) "1699123456790-0"
   2) 1) "action"
      2) "purchase"
      3) "user"
      4) "john"
      5) "amount"
      6) "100"

# Последние N событий
127.0.0.1:6379> XREVRANGE events + - COUNT 5

# Длина потока
127.0.0.1:6379> XLEN events
(integer) 2

# Consumer groups для распределённой обработки
127.0.0.1:6379> XGROUP CREATE events mygroup $ MKSTREAM

# Чтение как consumer
127.0.0.1:6379> XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS events >
```

---

### Pub/Sub (публикация/подписка)

Механизм обмена сообщениями между клиентами.

```bash
# Терминал 1 — подписчик
127.0.0.1:6379> SUBSCRIBE notifications
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "notifications"
3) (integer) 1

# Терминал 2 — публикация
127.0.0.1:6379> PUBLISH notifications "New message!"
(integer) 1

# Терминал 1 получит:
1) "message"
2) "notifications"
3) "New message!"

# Подписка по паттерну
127.0.0.1:6379> PSUBSCRIBE user:*
# Получит сообщения из user:1, user:2, ...
```

**Ограничения Pub/Sub:**
- Сообщения не сохраняются (fire-and-forget)
- Если подписчик оффлайн — сообщение потеряно
- Для надёжной доставки используйте Streams

---

### Транзакции

Redis поддерживает атомарное выполнение группы команд.

```bash
# Начало транзакции
127.0.0.1:6379> MULTI
OK

127.0.0.1:6379(TX)> INCR counter
QUEUED

127.0.0.1:6379(TX)> INCR counter
QUEUED

127.0.0.1:6379(TX)> GET counter
QUEUED

# Выполнение
127.0.0.1:6379(TX)> EXEC
1) (integer) 1
2) (integer) 2
3) "2"

# Отмена транзакции
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> SET key "value"
QUEUED
127.0.0.1:6379(TX)> DISCARD
OK

# Оптимистичная блокировка (WATCH)
127.0.0.1:6379> WATCH balance
OK
127.0.0.1:6379> GET balance
"100"
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> DECRBY balance 50
QUEUED
127.0.0.1:6379(TX)> EXEC
# Вернёт nil, если balance изменился между WATCH и EXEC
```

**Важно:** Redis транзакции НЕ поддерживают откат (rollback). Если команда внутри MULTI/EXEC падает, остальные всё равно выполнятся.

---

### Lua-скрипты

Атомарное выполнение сложной логики на сервере.

```bash
# Простой скрипт
127.0.0.1:6379> EVAL "return redis.call('GET', KEYS[1])" 1 mykey
"value"

# Скрипт с логикой (атомарный инкремент с проверкой)
127.0.0.1:6379> EVAL "
local current = redis.call('GET', KEYS[1])
if current then
    return redis.call('INCR', KEYS[1])
else
    redis.call('SET', KEYS[1], 1)
    return 1
end
" 1 counter
(integer) 1

# Загрузка скрипта для повторного использования
127.0.0.1:6379> SCRIPT LOAD "return redis.call('GET', KEYS[1])"
"a5260dd66ce02462..."

127.0.0.1:6379> EVALSHA "a5260dd66ce02462..." 1 mykey
"value"
```

**Применение Lua:**
- Атомарные операции check-and-set
- Rate limiting
- Distributed locks (Redlock)

---

### Персистентность

Redis поддерживает два механизма сохранения данных на диск.

#### RDB (Redis Database)

Снимки данных через заданные интервалы.

```bash
# redis.conf
save 900 1      # Снимок каждые 15 мин если >= 1 изменение
save 300 10     # Снимок каждые 5 мин если >= 10 изменений
save 60 10000   # Снимок каждую минуту если >= 10000 изменений

dbfilename dump.rdb
dir /var/lib/redis

# Ручное создание снимка
127.0.0.1:6379> BGSAVE
Background saving started

127.0.0.1:6379> LASTSAVE
(integer) 1699123456
```

**Плюсы RDB:** компактные файлы, быстрое восстановление.
**Минусы:** возможна потеря данных между снимками.

#### AOF (Append Only File)

Журнал всех операций записи.

```bash
# redis.conf
appendonly yes
appendfilename "appendonly.aof"

# Частота синхронизации
appendfsync always    # Каждая операция (медленно, надёжно)
appendfsync everysec  # Каждую секунду (баланс)
appendfsync no        # На усмотрение ОС (быстро, рискованно)

# Перезапись AOF (сжатие)
127.0.0.1:6379> BGREWRITEAOF
```

**Плюсы AOF:** минимальная потеря данных (до 1 секунды).
**Минусы:** большие файлы, медленнее восстановление.

#### Рекомендация

Для production используйте оба механизма:

```bash
# redis.conf
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec
```

---

### Репликация и кластеризация

#### Master-Replica

```bash
# На реплике
127.0.0.1:6379> REPLICAOF master-host 6379

# Проверка статуса
127.0.0.1:6379> INFO replication
# role:slave
# master_host:master-host
# master_link_status:up
```

#### Redis Sentinel

Автоматический failover при падении master.

```bash
# sentinel.conf
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
```

#### Redis Cluster

Горизонтальное шардирование данных.

```bash
# Создание кластера
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1

# Подключение к кластеру
redis-cli -c -h 127.0.0.1 -p 7000
```

---

### Безопасность

#### Аутентификация

```bash
# redis.conf
requirepass your_secure_password

# ACL (Redis 6+)
user default on >password ~* +@all
user readonly on >readpass ~* +@read -@write

# Подключение с паролем
redis-cli -a your_secure_password
# или
127.0.0.1:6379> AUTH your_secure_password
```

#### Сетевая безопасность

```bash
# redis.conf
# Привязка только к локальным интерфейсам
bind 127.0.0.1 ::1

# Отключение опасных команд
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command CONFIG ""

# TLS (Redis 6+)
tls-port 6379
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
```

---

### Интеграция с приложениями

#### Node.js (ioredis)

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'password',
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Базовые операции
await redis.set('key', 'value');
await redis.set('session:123', JSON.stringify(data), 'EX', 3600);

const value = await redis.get('key');
const session = JSON.parse(await redis.get('session:123'));

// Pipeline (batch операции)
const pipeline = redis.pipeline();
pipeline.incr('counter1');
pipeline.incr('counter2');
pipeline.get('counter1');
const results = await pipeline.exec();

// Pub/Sub
const sub = new Redis();
sub.subscribe('notifications');
sub.on('message', (channel, message) => {
  console.log(`${channel}: ${message}`);
});

await redis.publish('notifications', 'Hello!');

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
});
```

#### Python (redis-py)

```python
import redis
import json

r = redis.Redis(
    host='localhost',
    port=6379,
    password='password',
    db=0,
    decode_responses=True
)

# Базовые операции
r.set('key', 'value')
r.setex('session:123', 3600, json.dumps(data))

value = r.get('key')
session = json.loads(r.get('session:123'))

# Pipeline
pipe = r.pipeline()
pipe.incr('counter1')
pipe.incr('counter2')
pipe.get('counter1')
results = pipe.execute()

# Pub/Sub
pubsub = r.pubsub()
pubsub.subscribe('notifications')

for message in pubsub.listen():
    if message['type'] == 'message':
        print(f"{message['channel']}: {message['data']}")
```

---

### Паттерны использования

#### Кэширование с Cache-Aside

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // Попытка из кэша
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Из БД
  const user = await db.users.findById(userId);

  // Сохранение в кэш
  await redis.setex(cacheKey, 3600, JSON.stringify(user));

  return user;
}

// Инвалидация при обновлении
async function updateUser(userId, data) {
  await db.users.update(userId, data);
  await redis.del(`user:${userId}`);
}
```

#### Rate Limiting (sliding window)

```javascript
async function isRateLimited(userId, limit = 100, window = 60) {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - (window * 1000);

  const pipe = redis.pipeline();

  // Удаление старых записей
  pipe.zremrangebyscore(key, 0, windowStart);
  // Добавление текущего запроса
  pipe.zadd(key, now, `${now}`);
  // Подсчёт запросов в окне
  pipe.zcard(key);
  // Обновление TTL
  pipe.expire(key, window);

  const results = await pipe.exec();
  const requestCount = results[2][1];

  return requestCount > limit;
}
```

#### Distributed Lock (Redlock)

```javascript
import Redlock from 'redlock';

const redlock = new Redlock([redis], {
  retryCount: 3,
  retryDelay: 200,
  retryJitter: 100
});

async function processWithLock(resourceId) {
  let lock;
  try {
    lock = await redlock.acquire([`lock:${resourceId}`], 5000);

    // Критическая секция
    await doWork(resourceId);

  } finally {
    if (lock) {
      await lock.release();
    }
  }
}
```

---

### Мониторинг и отладка

#### Основные команды

```bash
# Информация о сервере
127.0.0.1:6379> INFO
127.0.0.1:6379> INFO memory
127.0.0.1:6379> INFO replication

# Статистика памяти
127.0.0.1:6379> MEMORY STATS
127.0.0.1:6379> MEMORY USAGE mykey

# Количество ключей
127.0.0.1:6379> DBSIZE

# Мониторинг команд в реальном времени (ОСТОРОЖНО!)
127.0.0.1:6379> MONITOR

# Медленные запросы
127.0.0.1:6379> SLOWLOG GET 10
127.0.0.1:6379> SLOWLOG LEN
127.0.0.1:6379> SLOWLOG RESET

# Статистика клиентов
127.0.0.1:6379> CLIENT LIST
127.0.0.1:6379> CLIENT KILL ID 123

# Debug
127.0.0.1:6379> DEBUG SLEEP 1
127.0.0.1:6379> DEBUG OBJECT mykey
```

#### Метрики для мониторинга

| Метрика | Описание | Как получить |
|---------|----------|--------------|
| `used_memory` | Используемая память | INFO memory |
| `connected_clients` | Активные подключения | INFO clients |
| `instantaneous_ops_per_sec` | Операций в секунду | INFO stats |
| `keyspace_hits/misses` | Cache hit ratio | INFO stats |
| `rejected_connections` | Отклонённые подключения | INFO stats |
| `rdb_last_save_time` | Время последнего RDB | INFO persistence |

---

### Подводные камни и Best Practices

#### Чего избегать

| Проблема | Решение |
|----------|---------|
| `KEYS *` в production | Используйте `SCAN` с курсором |
| Большие значения (>100KB) | Разбивайте на части или используйте другое хранилище |
| Блокирующие команды | Используйте ASYNC версии (UNLINK вместо DEL) |
| Отсутствие TTL | Всегда ставьте TTL для кэша |
| Один Redis для всего | Разделяйте кэш и очереди |
| Хранение секретов | Используйте шифрование, Vault |

#### Memory Management

```bash
# Политика вытеснения при переполнении памяти
maxmemory 2gb
maxmemory-policy allkeys-lru

# Варианты:
# noeviction — ошибка при переполнении
# allkeys-lru — удаление наименее используемых
# volatile-lru — LRU только среди ключей с TTL
# allkeys-random — случайное удаление
# volatile-ttl — удаление с наименьшим TTL
```

#### Best Practices

1. **Именование ключей** — используйте namespace: `user:123:profile`, `cache:api:users`
2. **Сериализация** — JSON для простоты, MessagePack/Protobuf для производительности
3. **Connection pooling** — используйте пулы подключений
4. **Pipeline** — группируйте команды для снижения latency
5. **TTL везде** — избегайте бесконечного роста памяти
6. **Мониторинг** — настройте алерты на memory, connections, latency
7. **Backup** — регулярные бэкапы RDB, репликация

---

### Ссылки

- [Redis Documentation](https://redis.io/docs/)
- [Redis Commands](https://redis.io/commands/)
- [ioredis (Node.js)](https://github.com/redis/ioredis)
- [redis-py (Python)](https://redis-py.readthedocs.io/)
- [Redis University](https://university.redis.com/)
