---
tags:
  - redis
  - database
  - cache
  - backend
  - nosql
---

## Что такое Redis

Redis — сервер структур данных **в оперативной памяти**, выполняющий команды **в одном потоке, атомарно, за микросекунды**. Это не «ещё одна БД», а быстрая **общая память для всех инстансов приложения**: всё, что ты положил бы в глобальную переменную или `sync.Map`, но что должно быть видно каждой реплике сервиса.

Три свойства, из которых следует всё остальное:

1. **Память, а не диск** → сотни тысяч операций в секунду с одного узла, латентность 0.1–0.5 мс по сети. Данные не могут быть больше RAM.
2. **Однопоточное выполнение команд** → каждая команда атомарна без блокировок; `INCR` из тысячи клиентов никогда не потеряет инкремент. Обратная сторона: одна медленная команда стопорит всех.
3. **Богатые структуры данных** → не только `GET/SET`, а списки, множества, сортированные множества, хэши, потоки, HyperLogLog, битмапы, geo. Это главное отличие от Memcached.

Документация: https://redis.io/docs/latest/ · Go-клиент: https://redis.io/docs/latest/develop/clients/go

> Контекст 2024+: после смены лицензии Redis появились форки **Valkey** (Linux Foundation, дефолт в AWS/GCP) и **KeyDB/Dragonfly** (многопоточные). API совместим; всё ниже применимо к ним.

---

## 2. Когда брать Redis, а когда нет

**Берём, когда:**

- читаем одно и то же много раз, а меняется редко → кэш;
- нужен атомарный счётчик/лимит, общий для всех инстансов → rate limiting, квоты, счётчики;
- короткоживущее состояние с автопротуханием → сессии, idempotency-ключи, OTP, временные токены;
- координация инстансов → лок, leader election, семафор;
- «топ-N» в реальном времени → sorted set вместо `ORDER BY ... LIMIT` на каждый запрос;
- лёгкая очередь или fan-out без гарантий Kafka;
- вероятностные счётчики на огромных объёмах (уникальные посетители).

**Не берём, когда:**

- данные не помещаются в RAM;
- данные — источник истины, потеря которых недопустима (персистентность есть, но это не WAL с fsync на каждый commit);
- нужны JOIN, агрегации, транзакции с откатом;
- нужен строгий порядок и replay событий между сервисами → Kafka.

### Сравнение

|                        | Redis                | Memcached | In-process cache | PostgreSQL    | Kafka              |
| ---------------------- | -------------------- | --------- | ---------------- | ------------- | ------------------ |
| Структуры данных       | 10+                  | строки    | любые Go-типы    | таблицы       | лог                |
| Общий между инстансами | да                   | да        | **нет**          | да            | да                 |
| TTL на ключ            | да                   | да        | да               | нет           | retention на топик |
| Атомарные операции     | да + Lua             | INCR/CAS  | mutex            | транзакции    | нет                |
| Персистентность        | опционально          | нет       | нет              | да            | да                 |
| Pub/Sub                | да, без гарантий     | нет       | нет              | LISTEN/NOTIFY | с гарантиями       |
| Латентность            | ~0.2 мс              | ~0.2 мс   | ~50 нс           | ~1 мс         | ~5 мс              |
| Многопоточность        | нет (I/O threads да) | да        | —                | да            | да                 |

Правило: локальный кэш — для сверхгорячих неизменяемых данных (конфиг, справочники, 1–2 с TTL поверх Redis для hot keys); Redis — для всего, что должно быть согласовано между репликами; Memcached — только если нужен тупой быстрый кэш строк и многопоточность на одном узле.

---

## 3. Структуры данных и их классические применения

|Структура|Что это|Классические use case'ы|
|---|---|---|
|**String**|байты до 512 МБ; числа инкрементятся атомарно|кэш сериализованных объектов, счётчики, локи, idempotency-ключи, feature flags|
|**Hash**|поле→значение внутри ключа|объекты с частичным обновлением (профиль, сессия), корзина, счётчики по категориям|
|**List**|двусвязный список|простая очередь задач (`LPUSH`/`BRPOP`), лента «последние N», история|
|**Set**|уникальные строки|теги, «кто лайкнул», пересечения/объединения (общие друзья), дедупликация|
|**Sorted Set**|элементы с числовым score, отсортированы|лидерборды, топ-N, rate limiting sliding window, отложенные задачи (score=время), приоритетные очереди, time series|
|**Stream**|append-only лог с consumer group и ack|лёгкая очередь с подтверждением, лог событий одного сервиса|
|**HyperLogLog**|вероятностный счётчик уникальных, 12 КБ, ±0.81 %|уникальные посетители/просмотры за период|
|**Bitmap**|биты по смещению|«был ли активен пользователь N в день D», bloom-подобные флаги|
|**Geo**|sorted set с geohash|«ближайшие точки в радиусе»|
|**Pub/Sub**|каналы, fire-and-forget|инвалидация локальных кэшей, чат, live-уведомления|
|**JSON / Search / TimeSeries** (модули, Redis Stack)|документы с путями, вторичные индексы, временные ряды|когда нужен поиск по полям без отдельного ES|

Полный список: https://redis.io/docs/latest/develop/data-types/

---

## Подключение

```go
package redisx

import (
	"context"
	"time"

	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
)

func New(ctx context.Context, addr, password string) (*redis.Client, error) {
	c := redis.NewClient(&redis.Options{
		Addr:            addr,
		Password:        password,
		PoolSize:        20,                     // ≈ ожидаемая параллельность × 1.5
		MinIdleConns:    5,
		DialTimeout:     2 * time.Second,
		ReadTimeout:     500 * time.Millisecond, // Redis быстрый; ждём дольше — что-то не так
		WriteTimeout:    500 * time.Millisecond,
		MaxRetries:      2,
		MinRetryBackoff: 10 * time.Millisecond,
		MaxRetryBackoff: 100 * time.Millisecond,
	})
	if err := redisotel.InstrumentTracing(c); err != nil {
		return nil, err
	}
	if err := redisotel.InstrumentMetrics(c); err != nil {
		return nil, err
	}
	return c, c.Ping(ctx).Err()
}
```

- **Один клиент на процесс**: потокобезопасен, держит пул.
- **Namespace в ключах**: `app:service:entity:id`. Через год на этом Redis будет 20 сервисов.
- **TTL всегда**, кроме осознанных исключений. Без TTL память растёт до `maxmemory`, потом вытеснение всего подряд.
- **`UNLINK` вместо `DEL`** для больших значений — удаление в фоне.
- **Никогда `KEYS`** в проде; `SCAN` в крайнем случае; лучше — индекс-множество ключей.
- **Ошибка Redis не роняет запрос**: кэш недоступен → идём в БД, логируем, метрика. Лимитер недоступен → fail-open или fail-closed, но решение записано.
- **Таймауты в клиенте** обязательны: завис Redis — не должны зависнуть все хендлеры.
- **Сериализация**: JSON для простоты, protobuf/msgpack когда CPU на маршалинг заметен; кэшируй только нужные поля.

---

## Практика: реализации, которые нужны в любом проекте

### 5.1 Cache-aside с защитой от stampede

Самый частый паттерн: читаем из кэша; на промах — из БД, кладём в кэш с TTL. Классическая проблема — **cache stampede** (thundering herd): популярный ключ протух, 500 одновременных запросов увидели промах, все 500 пошли в БД. Решения: `singleflight` (в процессе один поход в БД на ключ), jitter к TTL (ключи не протухают пачкой), опционально early refresh (обновлять до истечения).

```go
package cache

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"math/rand/v2"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/singleflight"
)

type Loader[T any] func(ctx context.Context) (T, error)

type Cache[T any] struct {
	rdb *redis.Client
	sf  singleflight.Group
	ttl time.Duration
}

func New[T any](rdb *redis.Client, ttl time.Duration) *Cache[T] {
	return &Cache[T]{rdb: rdb, ttl: ttl}
}

func (c *Cache[T]) Get(ctx context.Context, key string, load Loader[T]) (T, error) {
	var zero T

	raw, err := c.rdb.Get(ctx, key).Bytes()
	switch {
	case err == nil:
		var v T
		if json.Unmarshal(raw, &v) == nil {
			return v, nil
		}
		// битое значение — считаем промахом и перезапишем
	case !errors.Is(err, redis.Nil):
		slog.Warn("redis get failed, fallback", "key", key, "err", err) // Redis лёг — не падаем
	}

	// singleflight: параллельные промахи одного ключа схлопываются в один вызов load
	v, err, _ := c.sf.Do(key, func() (any, error) {
		val, err := load(ctx)
		if err != nil {
			return nil, err
		}
		b, _ := json.Marshal(val)
		jitter := time.Duration(rand.Int64N(int64(c.ttl / 5))) - c.ttl/10 // ±10 %
		if err := c.rdb.Set(ctx, key, b, c.ttl+jitter).Err(); err != nil {
			slog.Warn("redis set failed", "key", key, "err", err)
		}
		return val, nil
	})
	if err != nil {
		return zero, err
	}
	return v.(T), nil
}

// Инвалидация: сначала БД, потом удалить ключ.
func (c *Cache[T]) Invalidate(ctx context.Context, key string) error {
	return c.rdb.Unlink(ctx, key).Err()
}
```

```go
users := cache.New[User](rdb, 10*time.Minute)
u, err := users.Get(ctx, "app:users:"+id, func(ctx context.Context) (User, error) {
	return repo.GetUser(ctx, id)
})
```

Что спрашивают:

- **Обновление: «обновил БД → удалил ключ»**, а не «обновил ключ». При двух параллельных записях обновление ключа может оставить старое значение; удаление проще, следующий читатель перезаполнит.
- **Гонка «прочитал старое → записал в кэш после чужого удаления»**: окно маленькое, TTL его закрывает; при строгих требованиях — версия в значении и запись через Lua только если версия новее.
- **Negative caching**: несуществующие id кэшируй маркером на 30–60 с, иначе они бьют в БД.
- **Что кэшировать**: дорого считать + часто читают + устаревание на TTL допустимо. Баланс счёта — нет.
- **Write-through / write-behind** — альтернативы cache-aside: пишем в кэш и БД вместе (проще консистентность, дороже запись) или сначала в кэш, потом асинхронно в БД (быстро, риск потери). Cache-aside — дефолт.
- **Read-through** — кэш сам ходит в источник (в Redis нет из коробки, делается обёрткой как выше).

Официальный гайд на Go: https://redis.io/docs/latest/develop/use-cases/cache-aside/go/

### 5.2 Rate limiter: token bucket на Lua

Почему Lua: проверка и списание должны быть одной атомарной операцией, иначе 100 параллельных запросов пройдут проверку «есть 1 токен» одновременно. Lua выполняется на сервере целиком, без вклинивания других команд.

Алгоритмы: **fixed window** (`INCR` + `EXPIRE`, просто, всплеск 2× на границе окна), **sliding window log** (sorted set с timestamp каждого запроса, точно, O(N) памяти), **sliding window counter** (два окна с весами, компромисс), **token bucket** (позволяет бурсты до capacity, 2 числа на ключ). Token bucket — дефолт для API.

```go
package ratelimit

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// KEYS[1] — ключ; ARGV: capacity, refill_per_sec, now_ms, cost → {allowed, remaining, retry_after_ms}
var tokenBucket = redis.NewScript(`
local key      = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill   = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local cost     = tonumber(ARGV[4])

local b = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(b[1])
local ts     = tonumber(b[2])
if tokens == nil then tokens = capacity; ts = now end

local elapsed = math.max(0, now - ts) / 1000.0
tokens = math.min(capacity, tokens + elapsed * refill)

local allowed, retry_after = 0, 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retry_after = math.ceil((cost - tokens) / refill * 1000)
end

redis.call('HSET', key, 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', key, math.ceil(capacity / refill * 1000) + 1000) -- неактивные ключи сами исчезнут
return {allowed, math.floor(tokens), retry_after}
`)

type Limiter struct {
	rdb      *redis.Client
	capacity int
	refill   float64 // токенов/сек
}

type Result struct {
	Allowed    bool
	Remaining  int64
	RetryAfter time.Duration
}

func (l *Limiter) Allow(ctx context.Context, subject string, cost int) (Result, error) {
	res, err := tokenBucket.Run(ctx, l.rdb, []string{"app:ratelimit:" + subject},
		l.capacity, l.refill, time.Now().UnixMilli(), cost).Int64Slice()
	if err != nil {
		return Result{Allowed: true}, err // fail-open; решение задокументировано
	}
	return Result{Allowed: res[0] == 1, Remaining: res[1], RetryAfter: time.Duration(res[2]) * time.Millisecond}, nil
}
```

HTTP-middleware: `429` + заголовки `Retry-After`, `X-RateLimit-Remaining`. `redis.NewScript` сам делает `EVALSHA`, а при `NOSCRIPT` — `EVAL`.

### 5.3 Distributed lock — правильно и с честными оговорками

Зачем: не дать двум инстансам одновременно выполнять одно и то же (cron-задача, обработка одной сущности, «только один лидер»).

Три классические ошибки: `SET` без `NX` (лок перезаписывается); `DEL` без проверки токена (снял чужой лок после истечения своего); TTL без продления (долгая работа пережила лок).

```go
package lock

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrNotAcquired = errors.New("lock not acquired")

var releaseScript = redis.NewScript(`
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0`)

var extendScript = redis.NewScript(`
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('PEXPIRE', KEYS[1], ARGV[2]) end
return 0`)

type Lock struct {
	rdb   *redis.Client
	key   string
	token string
	ttl   time.Duration
	stop  chan struct{}
	lost  chan struct{} // закрывается, если лок потерян — бизнес-логика должна это проверять
}

func Acquire(ctx context.Context, rdb *redis.Client, key string, ttl time.Duration) (*Lock, error) {
	b := make([]byte, 16)
	rand.Read(b)
	token := hex.EncodeToString(b)

	ok, err := rdb.SetNX(ctx, key, token, ttl).Result() // SET key token NX PX ttl
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrNotAcquired
	}
	l := &Lock{rdb: rdb, key: key, token: token, ttl: ttl, stop: make(chan struct{}), lost: make(chan struct{})}
	go l.watchdog()
	return l, nil
}

func (l *Lock) Lost() <-chan struct{} { return l.lost }

func (l *Lock) watchdog() {
	t := time.NewTicker(l.ttl / 3)
	defer t.Stop()
	for {
		select {
		case <-l.stop:
			return
		case <-t.C:
			ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
			n, err := extendScript.Run(ctx, l.rdb, []string{l.key}, l.token, l.ttl.Milliseconds()).Int()
			cancel()
			if err != nil || n == 0 {
				close(l.lost)
				return
			}
		}
	}
}

func (l *Lock) Release(ctx context.Context) error {
	close(l.stop)
	return releaseScript.Run(ctx, l.rdb, []string{l.key}, l.token).Err()
}
```

```go
lk, err := lock.Acquire(ctx, rdb, "app:cron:daily-report", 30*time.Second)
if errors.Is(err, lock.ErrNotAcquired) {
	return nil // другой инстанс уже делает
}
defer lk.Release(ctx)
// в длинных циклах: select { case <-lk.Lost(): abort }
```

**Честная оговорка — это и есть senior-ответ.** Лок в Redis не даёт гарантии взаимного исключения: процесс может встать на GC/остановку ВМ после проверки, TTL истечёт, второй инстанс возьмёт лок, потом первый проснётся и продолжит писать. **Redlock** (кворум из 5 независимых Redis) защищает от падения одного Redis, но не от этой паузы — спор Клеппмана и antirez (2016). Настоящую корректность даёт **fencing token** на стороне хранилища: монотонный номер лока, который проверяет сама БД/файловая система, или уникальный ключ в БД (`INSERT ... ON CONFLICT`), который отсечёт второго. Redis-лок — оптимизация («не делать двойную работу»), а не гарантия. Если есть PostgreSQL — `pg_advisory_xact_lock` в той же транзакции проще и честнее. Готовые библиотеки: `bsm/redislock`, `go-redsync/redsync` (Redlock).

### 5.4 Idempotency key для POST

Клиент повторил `POST /payments` после таймаута — платёж не должен пройти дважды. Стандарт де-факто (Stripe): заголовок `Idempotency-Key`, сервер хранит ответ 24 часа.

```go
package idem

var claim = redis.NewScript(`
if redis.call('SET', KEYS[1], 'in_progress', 'NX', 'EX', ARGV[1]) then return 1 end
return 0`)

type Store struct{ rdb *redis.Client; ttl time.Duration }

// first=true — мы первые; cached!=nil — ответ есть; оба false/nil — другой запрос ещё в работе.
func (s *Store) Claim(ctx context.Context, key string) (first bool, cached []byte, err error) {
	k := "app:idem:" + key
	n, err := claim.Run(ctx, s.rdb, []string{k}, int(s.ttl.Seconds())).Int()
	if err != nil {
		return false, nil, err
	}
	if n == 1 {
		return true, nil, nil
	}
	v, err := s.rdb.Get(ctx, k).Bytes()
	if err != nil || string(v) == "in_progress" {
		return false, nil, err
	}
	return false, v, nil
}

func (s *Store) Store(ctx context.Context, key string, response []byte) error {
	return s.rdb.Set(ctx, "app:idem:"+key, response, s.ttl).Err()
}

func (s *Store) Abort(ctx context.Context, key string) error {
	return s.rdb.Del(ctx, "app:idem:"+key).Err() // обработка упала — освобождаем ключ
}
```

В хендлере: `Claim` → `cached` есть → вернуть с тем же статусом; `in_progress` → `409`; первые → выполнить, `Store`. В ключ добавляй `user_id`, чтобы чужой ключ не вернул чужой ответ. Для денег — дублируй в таблице БД: Redis может вытеснить.

### 5.5 Топ-N и лидерборды: Sorted Set

`SELECT ... ORDER BY score DESC LIMIT 100` на каждый запрос — full scan. В Redis: O(log N) на инкремент, O(N+log M) на чтение топа.

```go
func (s *Board) AddScore(ctx context.Context, day, member string, delta float64) error {
	key := "app:top:" + day
	pipe := s.rdb.TxPipeline() // MULTI/EXEC — один round-trip, атомарно
	pipe.ZIncrBy(ctx, key, delta, member)
	pipe.Expire(ctx, key, 48*time.Hour)
	_, err := pipe.Exec(ctx)
	return err
}

func (s *Board) Top(ctx context.Context, day string, n int64) ([]redis.Z, error) {
	return s.rdb.ZRevRangeWithScores(ctx, "app:top:"+day, 0, n-1).Result()
}

func (s *Board) Rank(ctx context.Context, day, member string) (int64, error) {
	return s.rdb.ZRevRank(ctx, "app:top:"+day, member).Result() // позиция конкретного участника
}
```

`ZUNIONSTORE` по 7 дневным ключам → «топ за неделю» без пересчёта. Тот же sorted set — приоритетная очередь (`score=priority`) и отложенные задачи (`score=execute_at`, воркер атомарно в Lua берёт `ZRANGEBYSCORE -inf now LIMIT 1` + `ZREM`).

### 5.6 Сессии и счётчики: Hash

```go
// сессия: частичное чтение/обновление без пересериализации всего объекта
rdb.HSet(ctx, "app:session:"+sid, map[string]any{"user_id": uid, "role": role, "last_seen": now})
rdb.Expire(ctx, "app:session:"+sid, 24*time.Hour)
role, _ := rdb.HGet(ctx, "app:session:"+sid, "role").Result()
rdb.HIncrBy(ctx, "app:stats:"+uid, "logins", 1)
```

Sliding expiration: продлевать `EXPIRE` при каждом обращении. JWT vs Redis-сессии: JWT не отзываются — для logout/бана нужен denylist в Redis (`SET jwt:revoked:<jti> 1 EX <remaining>`).

### 5.7 Уникальные: HyperLogLog и Bitmap

```go
rdb.PFAdd(ctx, "app:uniq:page:42:2026-09-13", visitorID) // 12 КБ на любое число посетителей
n, _ := rdb.PFCount(ctx, "app:uniq:page:42:2026-09-13").Result()
rdb.PFMerge(ctx, "app:uniq:page:42:week", day1, day2, ...)  // объединение периодов

rdb.SetBit(ctx, "app:active:2026-09-13", userID, 1)         // 1 бит на пользователя
rdb.BitOpAnd(ctx, "app:active:both", "app:active:2026-09-12", "app:active:2026-09-13") // retention
```

### 5.8 Очередь задач: List vs Stream

```go
// List — просто, без подтверждения: BRPOP снял = задача исчезла; упал воркер — потеряли
rdb.LPush(ctx, "app:jobs:email", payload)
res, _ := rdb.BRPop(ctx, 30*time.Second, "app:jobs:email").Result()

// Stream — с consumer group, ack и повторной доставкой невыполненного
rdb.XAdd(ctx, &redis.XAddArgs{Stream: "app:events", MaxLen: 100000, Approx: true, Values: map[string]any{"type": "signup", "uid": uid}})
rdb.XGroupCreateMkStream(ctx, "app:events", "workers", "$")
msgs, _ := rdb.XReadGroup(ctx, &redis.XReadGroupArgs{Group: "workers", Consumer: hostname, Streams: []string{"app:events", ">"}, Count: 10, Block: 5 * time.Second}).Result()
// ... обработка ...
rdb.XAck(ctx, "app:events", "workers", msgID)
// XPENDING / XAUTOCLAIM — забрать «зависшие» у упавшего консьюмера
```

Для реальных очередей задач на Go возьми готовое: `hibiken/asynq` (Redis-backed, retries, scheduling, UI).

---

## 6. Pipeline, транзакции, Lua

|Механизм|Что даёт|Когда|
|---|---|---|
|**Pipeline**|N команд за 1 round-trip, **без** атомарности|пакетные записи/чтения; `MGET` вместо N `GET`|
|**MULTI/EXEC** (`TxPipeline`)|команды подряд без вклинивания; **нет rollback**; `WATCH` — оптимистичная блокировка (CAS)|«инкремент + expire», перевод между двумя ключами с `WATCH`|
|**Lua** (`EVAL`)|атомарный скрипт с логикой|если между чтением и записью есть `if` — это Lua: лимитер, лок, CAS|
|**Functions** (Redis 7+)|Lua-функции, зарегистрированные на сервере|то же, но переживает рестарт и удобнее версионировать|

Lua-скрипт блокирует сервер на время выполнения — держи его коротким, никаких циклов по большим коллекциям.

---

## 7. Pub/Sub vs Streams vs Kafka

- **Pub/Sub** — fire-and-forget. Подписчик офлайн → сообщение потеряно. Для «сбросить локальный кэш на всех инстансах», live-уведомлений, чата — идеально. Для бизнес-событий — нет. В кластере с 7.0 — `SSUBSCRIBE` (sharded).
- **Streams** — лог с consumer group, ack, повторной доставкой. «Kafka на минималках»: одна нода, retention по длине, нет партиций. Для внутренних очередей одного сервиса.
- **Kafka** — события как контракт между сервисами, replay, порядок по ключу, retention в днях, несколько независимых групп.

---

## 8. Персистентность, память, HA

**Персистентность.** RDB — снапшот раз в N минут: компактно, быстрый рестарт, потеря до N минут. AOF — журнал команд, `appendfsync everysec` — потеря ≤1 с; `always` — медленно. Для чистого кэша — можно без (`save ""`); для локов/idempotency/очередей — AOF everysec. Даже с AOF Redis — не источник истины.

**Память.** `maxmemory` + `maxmemory-policy`:

- `allkeys-lru` / `allkeys-lfu` — чистый кэш;
- `volatile-lru` — в одном инстансе и кэш (с TTL), и данные без TTL, которые нельзя терять;
- `noeviction` — очереди, локи: лучше ошибка записи, чем молча потерянная задача.

Отсюда правило: **кэш и «важное» — в разных инстансах**, им нужны разные политики. Следи за `used_memory`, `evicted_keys`, `mem_fragmentation_ratio`.

**HA.**

- **Master–replica**: асинхронная репликация; при failover последние записи могут потеряться.
- **Sentinel**: мониторинг + автоматический failover одного мастера; клиенты спрашивают у Sentinel, кто мастер (`redis.NewFailoverClient`).
- **Cluster**: шардирование по 16384 хеш-слотам, каждый мастер с репликами. Multi-key команды (`MULTI`, Lua, `MGET`) требуют ключи в одном слоте → **hash tags**: `app:user:{123}:profile` и `app:user:{123}:settings` попадут в один слот. `redis.NewClusterClient`. Нет `SELECT db`, нет cross-slot транзакций.
- Managed: ElastiCache/MemoryDB (AWS), Memorystore (GCP), Redis Cloud, Yandex Managed Redis — берут HA и бэкапы на себя.

---

## 9. Подводные камни

|Проблема|Как проявляется|Что делать|
|---|---|---|
|**Hot key**|один ключ 100k rps, одна нода в 100 % CPU|локальный кэш 1–2 с; реплики для чтения; N копий ключа с рандомным суффиксом|
|**Big key**|`HGETALL`/`SMEMBERS` на миллионе элементов блокирует всех|`HSCAN`/`SSCAN`, дробить, `MEMORY USAGE`, `redis-cli --bigkeys`|
|Нет TTL|память растёт → вытеснение|TTL везде, алерт на `used_memory`|
|`KEYS *`|latency spike|`SCAN`; индекс-множество|
|Кэш и очередь вместе|LRU вытеснил задачи|разные инстансы/политики|
|Cache stampede|БД ложится при протухании популярного ключа|singleflight, jitter, early refresh|
|Cache penetration|запросы несуществующих id бьют в БД|negative caching, bloom filter|
|Нет таймаутов|завис Redis → зависли хендлеры|таймауты, circuit breaker вокруг кэша|
|Лок без токена/продления|двойное выполнение|§5.3|
|Кластер и multi-key|`CROSSSLOT` ошибка|hash tags|
|Сериализация|CPU на JSON > сеть|protobuf/msgpack, кэшировать поля|
|Мониторинг|узнаём от пользователей|`redis_exporter`: hit ratio, evicted_keys, connected_clients, `SLOWLOG`, latency|

---

## 10. Чек-лист «продовой» реализации

- [ ] Ключи с namespace и TTL (или обоснованием его отсутствия)
- [ ] Ошибки Redis не роняют запрос; есть fallback и метрика
- [ ] Таймауты клиента выставлены
- [ ] Проверка-и-действие — в Lua, не в двух командах
- [ ] Лок: уникальный токен, Lua-release, продление, понимание, что это не гарантия
- [ ] Stampede закрыт singleflight + jitter; penetration — negative cache
- [ ] Инвалидация: сначала БД, потом `UNLINK`
- [ ] Hit ratio, `evicted_keys`, `SLOWLOG`, latency на дашборде
- [ ] `maxmemory-policy` соответствует типу данных; кэш и очереди раздельно
- [ ] Для кластера — hash tags в multi-key операциях
- [ ] В README: какие данные в Redis, что будет, если он упадёт

---

## 11. Вопросы с собеседований и короткие ответы

1. **Почему Redis быстрый, если он однопоточный?** Всё в памяти, нет блокировок, epoll и pipelining; с 6.0 I/O в отдельных потоках. Однопоточность — гарантия атомарности.
2. **Redis vs Memcached?** Структуры данных, персистентность, репликация, Lua, pub/sub vs простой многопоточный кэш строк.
3. **Cache-aside vs write-through vs write-behind?** Кто и когда пишет в кэш; cache-aside — дефолт, write-behind — быстро и рискованно.
4. **Как бороться со stampede?** singleflight/мьютекс на ключ, jitter TTL, early refresh, «stale-while-revalidate».
5. **Как сделать распределённый лок и что с ним не так?** `SET NX PX` + токен + Lua release + watchdog; не гарантия из-за пауз — нужен fencing token или лок в БД.
6. **Redlock работает?** Защищает от отказа одного узла, не от GC-пауз и часов; для корректности не достаточен.
7. **Rate limiting — какие алгоритмы?** Fixed window, sliding log, sliding counter, token bucket; атомарность через Lua.
8. **Транзакции в Redis есть?** `MULTI/EXEC` — атомарная пачка без rollback; `WATCH` — оптимистичная блокировка; Lua — атомарная логика.
9. **RDB vs AOF?** Снапшот vs журнал; для кэша не нужно, для важного — AOF everysec; Redis всё равно не источник истины.
10. **Eviction policies?** `allkeys-lru/lfu` для кэша, `volatile-*` для смешанного, `noeviction` для очередей.
11. **Sentinel vs Cluster?** HA для одного мастера vs шардирование + HA; в кластере — hash slots и hash tags.
12. **Hot key / big key?** Локальный кэш, реплики, копии ключа / SCAN-варианты, дробление.
13. **Pub/Sub надёжен?** Нет: офлайн-подписчик теряет; для надёжности — Streams или Kafka.
14. **Что кэшировать нельзя?** Источники истины с требованием строгой консистентности (балансы, инвентарь) — либо не кэшировать, либо с версионированием и короткими TTL.
15. **Как сделать очередь с подтверждением?** Streams + consumer group + `XACK` + `XAUTOCLAIM`, или готовый `asynq`.
