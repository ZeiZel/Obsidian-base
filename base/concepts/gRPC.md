
## Ментальная модель

### Что такое gRPC и чем он отличается по своей сути

gRPC — это фреймворк удалённого вызова процедур: вы описываете **сервис и его методы** в отдельном файле, генератор превращает это в код на вашем языке, и вызов удалённого метода выглядит как вызов обычной функции.

Ключевое отличие от REST лежит не в «бинарный против JSON» и не в «быстрее/медленнее», а в **модели мышления**:

| |REST|gRPC|
|---|---|---|
|Единица дизайна|**ресурс** (`/orders/42`) и операции над ним через HTTP-глаголы|**метод** (`OrderService.CancelOrder`)|
|Контракт|документация, OpenAPI-спека (часто пишется после кода)|`.proto` — единственный источник истины, код генерируется из него|
|Модель данных|«вот вам представление ресурса»|«вот вам типизированный аргумент и типизированный результат»|
|Кто главный|сервер отдаёт ресурс, клиент разбирается|схема, которой подчинены обе стороны|

Отсюда главный практический вывод: **gRPC — это contract-first по построению**. Нельзя «просто дописать поле и забыть» — файл `.proto` лежит в репозитории, генерирует код обеим сторонам, и его изменение проверяется линтером совместимости. Это дисциплина, которую REST тоже может иметь, но не требует.

Вторая идея: **действия, которые не ложатся на CRUD**, в REST выражаются криво (`POST /orders/42/cancel` — это ресурс? глагол? что?), а в gRPC выражаются естественно, потому что метод — это и есть базовая единица.

### 2. Где gRPC уместен и где нет

**Берите gRPC, когда:**

- **Сервис-сервис внутри периметра.** Это главный сценарий: строгий контракт, низкая задержка, кодогенерация клиентов на всех языках компании.
- Много языков в компании — генерация клиента бесплатна.
- Операции плохо ложатся на CRUD (`Reserve`, `Cancel`, `Recalculate`).
- Нужен **стриминг** в обе стороны: обработка прогресса, подписки, передача больших наборов данных порциями.
- Высокий RPS и важна задержка: бинарная сериализация, мультиплексирование HTTP/2, переиспользование соединений.

**Не берите, когда:**

- **Публичное API для браузера.** Браузер не умеет gRPC напрямую (нет доступа к HTTP/2-фреймам из JS). Нужен gRPC-Web + прокси или Connect.
- API для внешних партнёров, которым проще `curl` и JSON.
- Задача read-heavy с гибкой формой ответа под клиента — там уместнее GraphQL.
- Команда маленькая, сервисов два, а тулинга нет — цена входа (buf, генерация, CI) может не окупиться.
- Нужны стандартные HTTP-плюшки: кэширование по `Cache-Control`, CDN, браузерный devtools.

**Правило:** внутри — gRPC, наружу — REST/GraphQL. Между ними ставят gateway, который транслирует.

### 3. Протобуф-мышление: контракт как единица версионирования

`.proto` живёт дольше, чем код обеих сторон. Поэтому:

- поля нумеруются, и номер — это и есть идентичность поля на проводе, а не имя;
- имя поля можно поменять (провод не сломается, сломается только код), номер и тип — нельзя;
- удалённый номер уходит в `reserved`, чтобы никто случайно не переиспользовал;
- новое поле всегда опционально по смыслу: старый клиент его не пришлёт, и сервер должен работать.

Это не бюрократия, а следствие того, что в распределённой системе клиент и сервер деплоятся **не одновременно**. Во время раскатки в кластере одновременно живут старая и новая версии обоих.

---

## Часть II. Protocol Buffers

### 4. Синтаксис, который нужен на практике

```proto
syntax = "proto3";

package orders.v1;                       // версия — часть пакета, не имени файла

option go_package = "github.com/acme/gen/go/orders/v1;ordersv1";

import "google/protobuf/timestamp.proto";
import "google/protobuf/field_mask.proto";

// Сообщение — структура данных. Числа справа — номера полей на проводе.
message Order {
  string id                            = 1;
  string customer_id                   = 2;
  OrderStatus status                   = 3;
  repeated OrderItem items             = 4;   // список
  map<string, string> metadata         = 5;   // словарь (только скалярные ключи)
  google.protobuf.Timestamp created_at = 6;   // well-known type
  int64 total_cents                    = 7;   // деньги — целые, никогда не float
  optional string comment              = 8;   // явная "отсутствие значения" ≠ ""
}

message OrderItem {
  string sku    = 1;
  int32  qty    = 2;
  int64  price_cents = 3;
}

enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;   // нулевое значение ОБЯЗАТЕЛЬНО и означает "не задано"
  ORDER_STATUS_CREATED     = 1;
  ORDER_STATUS_PAID        = 2;
  ORDER_STATUS_CANCELLED   = 3;
}

// oneof — ровно одно поле из набора
message PaymentMethod {
  oneof method {
    CardPayment card     = 1;
    WalletPayment wallet = 2;
  }
}

message CardPayment   { string token = 1; }
message WalletPayment { string wallet_id = 1; }

// Сервис — набор методов
service OrderService {
  rpc GetOrder(GetOrderRequest) returns (GetOrderResponse);
  rpc ListOrders(ListOrdersRequest) returns (ListOrdersResponse);
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
  rpc UpdateOrder(UpdateOrderRequest) returns (UpdateOrderResponse);
  rpc WatchOrder(WatchOrderRequest) returns (stream OrderEvent);       // server streaming
  rpc ImportOrders(stream ImportOrderRequest) returns (ImportSummary); // client streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);           // bidirectional
}

// ВСЕГДА оборачивайте аргумент и результат в отдельные сообщения,
// даже если сейчас там одно поле — иначе не сможете расширить без слома.
message GetOrderRequest  { string order_id = 1; }
message GetOrderResponse { Order order = 1; }
```

**Правила, которые спасают от боли:**

1. **Никогда не используйте голые скаляры в сигнатуре RPC.** `rpc GetOrder(string)` — так нельзя, и это к лучшему: `GetOrderRequest` можно расширить.
2. **Enum: нулевое значение — `UNSPECIFIED`.** В proto3 скаляры не различают «не задано» и «нулевое значение», поэтому 0 должен означать «не задано».
3. **Имена enum с префиксом типа** (`ORDER_STATUS_PAID`), потому что в C++ enum-значения живут в области видимости родителя.
4. **Деньги — целые в минимальных единицах.** `float`/`double` для денег — баг по определению.
5. **`optional`** в proto3 (вернулся в 3.15) даёт presence: можно отличить «поле не пришло» от «пришёл ноль». Для PATCH-семантики это критично.
6. **Well-known types**: `Timestamp`, `Duration`, `FieldMask`, `Struct`, `Any`, `Empty`. `FieldMask` — стандартный способ сказать «обнови только эти поля».
7. **Версия в пакете** (`orders.v1`), а не в имени сервиса. Ломающее изменение = новый пакет `orders.v2`, который какое-то время живёт рядом.

### 5. Что нельзя менять: правила совместимости

|Действие|Можно?|Комментарий|
|---|---|---|
|Добавить новое поле с новым номером|✅|старый код его проигнорирует|
|Удалить поле|⚠️|только с `reserved 8; reserved "comment";`|
|Переименовать поле|✅ на проводе|но сломает код всех потребителей — фактически ломающее|
|Изменить номер поля|❌|это другое поле|
|Изменить тип поля|❌|кроме узкого набора совместимых (`int32`↔`int64`↔`uint32` с оговорками)|
|Добавить значение в enum|⚠️|старый клиент получит неизвестное число — обрабатывайте `default`|
|Переместить поле в/из `oneof`|❌|меняет представление|
|Добавить метод в сервис|✅||
|Удалить/переименовать метод|❌|старые клиенты получат `Unimplemented`|

Проверяется это не глазами, а `buf breaking` в CI (§9).

### 6. Как это летит по проводу

Protobuf кодирует поле как пару **(номер, wire type)** + значение, в формате varint для чисел. Практические следствия:

- Имена полей **не передаются** — отсюда компактность (в 3–10 раз меньше JSON) и отсюда же нечитаемость без схемы.
- Поля с номерами 1–15 занимают один байт на тег, 16–2047 — два. **Самые частые поля нумеруйте 1–15.**
- Незаданные поля не передаются вовсе — пустое сообщение весит 0 байт.
- Порядок полей в бинарном виде не гарантирован → **сериализованный protobuf нельзя использовать как ключ кэша или считать от него хеш**. Классическая ловушка.
- Нет самоописания: без `.proto` байты бессмысленны. Поэтому дебаг требует `grpcurl` с рефлексией или `buf curl`.

---

## Часть III. Что под капотом

### 7. HTTP/2 и почему это важно

gRPC — это HTTP/2 плюс соглашения. Один RPC — это один HTTP/2 **стрим** внутри соединения.

```
POST /orders.v1.OrderService/GetOrder HTTP/2
content-type: application/grpc+proto
te: trailers
grpc-timeout: 5S
authorization: Bearer ...

[HEADERS фрейм] → [DATA фреймы: length-prefixed protobuf] → [TRAILERS: grpc-status, grpc-message]
```

Что из этого следует на практике:

- **Мультиплексирование.** Сотни параллельных вызовов идут по одному TCP-соединению без head-of-line blocking на уровне HTTP. Поэтому клиент **не нужно** пулить — один `ClientConn` обслуживает всё приложение и потокобезопасен.
- **Статус в трейлерах.** Результат вызова приходит **после** тела, в HTTP-трейлерах. Именно поэтому gRPC не работает через прокси, не умеющие трейлеры, и не работает в браузере напрямую.
- **HPACK-сжатие заголовков** — метаданные дешёвы, но не бесплатны.
- **Долгоживущие соединения.** Отсюда главная эксплуатационная проблема: балансировка (§16).
- Поверх TCP, значит head-of-line blocking на уровне TCP остаётся: потеря пакета тормозит все стримы соединения.

### 8. Четыре типа вызовов

|Тип|Сигнатура|Когда|
|---|---|---|
|**Unary**|`rpc M(Req) returns (Resp)`|95% случаев: обычный запрос-ответ|
|**Server streaming**|`returns (stream Resp)`|подписка на события, выдача большого списка порциями, прогресс долгой операции|
|**Client streaming**|`(stream Req)`|загрузка файла кусками, батч-импорт, агрегация метрик от клиента|
|**Bidirectional**|`(stream Req) returns (stream Resp)`|чат, интерактивные сессии, протоколы с обменом состоянием|

Стрим — это **не** очередь: он живёт в рамках одного соединения, не переживает разрыв и не имеет replay. Для гарантированной доставки событий между сервисами нужна Kafka, а не bidi-стрим. Стрим хорош для «пока клиент подключён».

---

## Часть IV. Реализация на Go

### 9. Тулинг: buf

`protoc` с его флагами — легаси. Стандарт сегодня — **buf**.

```yaml
# buf.yaml
version: v2
modules:
  - path: proto
lint:
  use: [STANDARD]
breaking:
  use: [FILE]
```

```yaml
# buf.gen.yaml
version: v2
managed:
  enabled: true
  override:
    - file_option: go_package_prefix
      value: github.com/acme/gen/go
plugins:
  - remote: buf.build/protocolbuffers/go
    out: gen/go
    opt: paths=source_relative
  - remote: buf.build/grpc/go
    out: gen/go
    opt: paths=source_relative,require_unimplemented_servers=true
```

```bash
buf lint                                   # стиль и правила именования
buf format -w                              # автоформат
buf generate                               # кодогенерация
buf breaking --against '.git#branch=main'  # проверка совместимости — в CI обязательно
buf curl --schema proto \
  --data '{"order_id":"42"}' \
  https://api.internal/orders.v1.OrderService/GetOrder
```

Сгенерированный код **коммитится в репозиторий**: воспроизводимость сборки, работающий `go build` без тулчейна protobuf, видимость диффа в ревью.

### 10. Сервер

```go
package main

import (
    "context"
    "errors"
    "net"
    "os"
    "os/signal"
    "syscall"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/health"
    healthpb "google.golang.org/grpc/health/grpc_health_v1"
    "google.golang.org/grpc/keepalive"
    "google.golang.org/grpc/reflection"
    "google.golang.org/grpc/status"
    "google.golang.org/genproto/googleapis/rpc/errdetails"

    ordersv1 "github.com/acme/gen/go/orders/v1"
)

// Реализация сервиса. Встраивание Unimplemented обязательно:
// при добавлении метода в .proto код продолжит компилироваться.
type orderServer struct {
    ordersv1.UnimplementedOrderServiceServer
    repo Repository
}

func (s *orderServer) GetOrder(ctx context.Context, req *ordersv1.GetOrderRequest) (*ordersv1.GetOrderResponse, error) {
    if req.GetOrderId() == "" {
        // Валидация → InvalidArgument с деталями
        st := status.New(codes.InvalidArgument, "order_id is required")
        st, _ = st.WithDetails(&errdetails.BadRequest{
            FieldViolations: []*errdetails.BadRequest_FieldViolation{
                {Field: "order_id", Description: "must not be empty"},
            },
        })
        return nil, st.Err()
    }

    order, err := s.repo.Get(ctx, req.GetOrderId())
    switch {
    case errors.Is(err, ErrNotFound):
        return nil, status.Errorf(codes.NotFound, "order %s not found", req.GetOrderId())
    case err != nil:
        // Не отдавайте наружу текст ошибки БД — только код и нейтральное сообщение
        return nil, status.Error(codes.Internal, "internal error")
    }

    return &ordersv1.GetOrderResponse{Order: toProto(order)}, nil
}

func main() {
    srv := grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            RecoveryUnary(),     // паника не должна ронять процесс
            LoggingUnary(),
            AuthUnary(),
            ValidateUnary(),
        ),
        grpc.ChainStreamInterceptor(RecoveryStream(), LoggingStream()),
        grpc.MaxRecvMsgSize(16<<20),   // дефолт 4 МБ на приём
        grpc.KeepaliveParams(keepalive.ServerParameters{
            MaxConnectionIdle:     5 * time.Minute,
            MaxConnectionAge:      30 * time.Minute, // принудительный реконнект → перебалансировка
            MaxConnectionAgeGrace: 10 * time.Second,
            Time:                  1 * time.Minute,
            Timeout:               20 * time.Second,
        }),
        grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
            MinTime:             30 * time.Second,
            PermitWithoutStream: true,
        }),
    )

    ordersv1.RegisterOrderServiceServer(srv, &orderServer{repo: repo})

    // Health-чек: k8s-проба и клиентская балансировка опираются на него
    hs := health.NewServer()
    healthpb.RegisterHealthServer(srv, hs)
    hs.SetServingStatus("orders.v1.OrderService", healthpb.HealthCheckResponse_SERVING)

    // Рефлексия: grpcurl и Buf Studio смогут работать без .proto на руках.
    // В проде — только во внутреннем периметре.
    reflection.Register(srv)

    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        panic(err)
    }

    go func() {
        stop := make(chan os.Signal, 1)
        signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
        <-stop
        hs.SetServingStatus("orders.v1.OrderService", healthpb.HealthCheckResponse_NOT_SERVING)
        time.Sleep(5 * time.Second) // дать балансировщику убрать нас из ротации
        srv.GracefulStop()          // дождаться активных RPC
    }()

    if err := srv.Serve(lis); err != nil {
        panic(err)
    }
}
```

### 11. Коды ошибок

gRPC не использует HTTP-коды. Свой набор из 17 значений — знать надо все, спрашивают часто:

|Код|Когда|
|---|---|
|`OK`|успех|
|`InvalidArgument`|запрос невалиден сам по себе (независимо от состояния системы)|
|`FailedPrecondition`|запрос валиден, но состояние системы не позволяет (заказ уже оплачен)|
|`OutOfRange`|частный случай: индекс/диапазон за пределами|
|`NotFound`|сущности нет|
|`AlreadyExists`|создание того, что уже есть|
|`PermissionDenied`|аутентифицирован, но нет прав|
|`Unauthenticated`|не аутентифицирован|
|`ResourceExhausted`|квота, rate limit|
|`Aborted`|конфликт конкурентного доступа (оптимистическая блокировка)|
|`Unavailable`|сервис временно недоступен — **единственный код, который безопасно ретраить по умолчанию**|
|`DeadlineExceeded`|не уложились в дедлайн|
|`Cancelled`|клиент отменил|
|`Unimplemented`|метод не реализован (частая причина — рассинхрон версий .proto)|
|`Internal`|наш баг|
|`DataLoss`|потеря/повреждение данных|
|`Unknown`|всё остальное; обычно означает, что кто-то вернул голую `error`|

Разница `InvalidArgument` / `FailedPrecondition` / `Aborted` — классический вопрос: первое «запрос плохой всегда», второе «плохой сейчас, повтор без изменений не поможет», третье «повтор на более высоком уровне может помочь».

Детали ошибок — `google.rpc.errdetails`: `BadRequest` (валидация по полям), `QuotaFailure`, `RetryInfo`, `ErrorInfo` (машиночитаемый `reason` и `domain`), `LocalizedMessage`. Это даёт структурированные ошибки без изобретения своего формата.

### 12. Интерцепторы

Аналог middleware. Пишутся один раз на инфраструктурный слой.

```go
func LoggingUnary() grpc.UnaryServerInterceptor {
    return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
        start := time.Now()
        resp, err := handler(ctx, req)
        code := status.Code(err)

        slog.InfoContext(ctx, "rpc",
            "method", info.FullMethod,
            "code", code.String(),
            "duration_ms", time.Since(start).Milliseconds(),
        )
        rpcDuration.WithLabelValues(info.FullMethod, code.String()).Observe(time.Since(start).Seconds())
        return resp, err
    }
}

func RecoveryUnary() grpc.UnaryServerInterceptor {
    return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
        defer func() {
            if r := recover(); r != nil {
                slog.ErrorContext(ctx, "panic", "method", info.FullMethod, "panic", r,
                    "stack", string(debug.Stack()))
                err = status.Error(codes.Internal, "internal error")
            }
        }()
        return handler(ctx, req)
    }
}

func AuthUnary() grpc.UnaryServerInterceptor {
    public := map[string]bool{"/grpc.health.v1.Health/Check": true}

    return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
        if public[info.FullMethod] {
            return handler(ctx, req)
        }
        md, ok := metadata.FromIncomingContext(ctx)
        if !ok {
            return nil, status.Error(codes.Unauthenticated, "missing metadata")
        }
        vals := md.Get("authorization")
        if len(vals) == 0 {
            return nil, status.Error(codes.Unauthenticated, "missing token")
        }
        claims, err := parseJWT(strings.TrimPrefix(vals[0], "Bearer "))
        if err != nil {
            return nil, status.Error(codes.Unauthenticated, "invalid token")
        }
        return handler(context.WithValue(ctx, userKey{}, claims), req)
    }
}
```

Готовые: `go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc` (трейсы и метрики одной строкой), `github.com/grpc-ecosystem/go-grpc-middleware/v2` (recovery, logging, auth, retry), `protovalidate-go` (валидация по правилам прямо в `.proto`).

### 13. Метаданные и дедлайны

**Метаданные** — аналог HTTP-заголовков: `authorization`, `x-request-id`, `traceparent`. Ключи в нижнем регистре; суффикс `-bin` для бинарных значений.

```go
// Клиент
ctx = metadata.AppendToOutgoingContext(ctx, "x-request-id", reqID)

// Сервер
md, _ := metadata.FromIncomingContext(ctx)

// Сервер → клиент
grpc.SetHeader(ctx, metadata.Pairs("x-served-by", hostname))   // до ответа
grpc.SetTrailer(ctx, metadata.Pairs("x-cost", "42"))           // после
```

**Дедлайны — то, что отличает зрелую систему от незрелой.** Клиент ставит дедлайн, gRPC передаёт его в заголовке `grpc-timeout`, сервер получает его в `ctx`, и — главное — **пробрасывает дальше**: в БД, в следующий gRPC-вызов, в HTTP-клиент.

```go
ctx, cancel := context.WithTimeout(ctx, 300*time.Millisecond)
defer cancel()
resp, err := client.GetOrder(ctx, req)
```

Правила:

1. **Дедлайн ставит вызывающий, а не сервис.** Только он знает свой бюджет.
2. **Дедлайн — всегда**, у каждого вызова. Вызов без дедлайна висит вечно и держит ресурсы.
3. **Бюджет уменьшается вниз по цепочке.** Если у вас 300 мс и три последовательных вызова, каждому достаётся меньше — оставляйте запас на свою работу.
4. **Сервер обязан уважать `ctx.Done()`** и прекращать работу: не тратьте CPU и соединения с БД на запрос, ответ на который уже никто не ждёт.
5. Отмена распространяется автоматически: клиент нажал «отмена» → `ctx` отменился по всей цепочке.

### 14. Клиент

```go
func NewOrderClient(target string) (ordersv1.OrderServiceClient, func() error, error) {
    // Service config: политика балансировки и ретраев, задаётся декларативно
    const serviceConfig = `{
      "loadBalancingConfig": [{"round_robin":{}}],
      "methodConfig": [{
        "name": [{"service": "orders.v1.OrderService"}],
        "waitForReady": true,
        "retryPolicy": {
          "maxAttempts": 4,
          "initialBackoff": "0.1s",
          "maxBackoff": "1s",
          "backoffMultiplier": 2,
          "retryableStatusCodes": ["UNAVAILABLE", "RESOURCE_EXHAUSTED"]
        }
      }]
    }`

    conn, err := grpc.NewClient(target,
        grpc.WithTransportCredentials(insecure.NewCredentials()), // внутри mesh; иначе TLS
        grpc.WithDefaultServiceConfig(serviceConfig),
        grpc.WithStatsHandler(otelgrpc.NewClientHandler()),        // трейсы и метрики
        grpc.WithKeepaliveParams(keepalive.ClientParameters{
            Time:                30 * time.Second,
            Timeout:             10 * time.Second,
            PermitWithoutStream: true,
        }),
    )
    if err != nil {
        return nil, nil, err
    }
    return ordersv1.NewOrderServiceClient(conn), conn.Close, nil
}
```

Что здесь важно:

- **`grpc.NewClient` вместо `grpc.Dial`.** `Dial` устарел; `NewClient` не подключается немедленно и корректно работает с резолверами.
- **Один `ClientConn` на процесс и сервис.** Он потокобезопасен, мультиплексирует и сам управляет подключениями. Пул создавать не нужно.
- **Retry только для идемпотентных методов.** `retryPolicy` в service config ретраит на уровне транспорта; для `CreateOrder` это дубликат заказа. Либо ограничивайте политику конкретными методами, либо делайте методы идемпотентными через ключ (`idempotency_key` в запросе).
- **`waitForReady: true`** заставляет ждать готовности вместо мгновенного `Unavailable` — полезно при старте, опасно при инцидентах (запросы копятся). Осознанный выбор.
- **Circuit breaker** gRPC не даёт — берите `sony/gobreaker` поверх клиента.

### 15. Стриминг на практике

**Server streaming** — подписка на события заказа:

```go
func (s *orderServer) WatchOrder(req *ordersv1.WatchOrderRequest, stream ordersv1.OrderService_WatchOrderServer) error {
    ctx := stream.Context()

    sub, err := s.bus.Subscribe(ctx, req.GetOrderId())
    if err != nil {
        return status.Error(codes.Internal, "subscribe failed")
    }
    defer sub.Close()

    // Периодический пинг, чтобы прокси не порвали простаивающее соединение
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return ctx.Err()            // клиент ушёл или дедлайн истёк
        case ev, ok := <-sub.Events():
            if !ok {
                return nil              // источник закрылся — нормальное завершение
            }
            if err := stream.Send(toProtoEvent(ev)); err != nil {
                return err              // клиент отвалился
            }
        case <-ticker.C:
            if err := stream.Send(&ordersv1.OrderEvent{Type: ordersv1.EventType_EVENT_TYPE_HEARTBEAT}); err != nil {
                return err
            }
        }
    }
}
```

**Client streaming** — батч-импорт:

```go
func (s *orderServer) ImportOrders(stream ordersv1.OrderService_ImportOrdersServer) error {
    var imported, failed int32
    batch := make([]*Order, 0, 100)

    for {
        req, err := stream.Recv()
        if errors.Is(err, io.EOF) {                 // клиент закончил отправку
            if err := s.repo.BulkInsert(stream.Context(), batch); err != nil {
                return status.Error(codes.Internal, "bulk insert failed")
            }
            imported += int32(len(batch))
            return stream.SendAndClose(&ordersv1.ImportSummary{Imported: imported, Failed: failed})
        }
        if err != nil {
            return err
        }

        order, err := validate(req.GetOrder())
        if err != nil {
            failed++
            continue
        }
        batch = append(batch, order)

        if len(batch) >= 100 {                      // пишем пачками, не по одному
            if err := s.repo.BulkInsert(stream.Context(), batch); err != nil {
                return status.Error(codes.Internal, "bulk insert failed")
            }
            imported += int32(len(batch))
            batch = batch[:0]
        }
    }
}
```

Правила стриминга:

- **Проверяйте `stream.Context().Done()`** — иначе горутина живёт после ухода клиента.
- **Heartbeat** для долгих стримов: L7-прокси рвут простаивающие соединения по таймауту.
- **Backpressure нет из коробки.** `Send` блокируется, когда заполнено окно HTTP/2 — это и есть весь механизм. Если продюсер быстрее консумера, нужен свой буфер с политикой сброса.
- **Стрим не переживает разрыв.** Клиент должен уметь переподключиться и досинхронизироваться (по курсору/оффсету в запросе).
- Для bidi определите, кто закрывает первым, иначе получите взаимную блокировку.

### 16. Балансировка: главная эксплуатационная проблема

gRPC держит **долгоживущие соединения**. L4-балансировщик (обычный `Service` в Kubernetes, NLB, iptables) распределяет **соединения**, а не запросы. Итог: клиент один раз подключился к поду A и все его запросы навсегда идут в под A. При скейлинге новые поды не получают трафика, нагрузка перекошена.

Три решения:

1. **Client-side балансировка** (нативная для gRPC). Клиент сам знает все адреса и применяет `round_robin`:
    
    ```
    headless Service в k8s (clusterIP: None) → DNS отдаёт все IP подов
    target: dns:///orders.default.svc.cluster.local:50051
    loadBalancingConfig: round_robin
    ```
    
    Плюс: минимум сетевых хопов. Минус: клиент узнаёт об изменениях с задержкой DNS TTL; нужен `MaxConnectionAge` на сервере, чтобы соединения периодически пересоздавались и перебалансировались.
    
2. **L7-прокси**: Envoy, Linkerd, nginx (`grpc_pass`), Istio. Прокси терминирует HTTP/2 и распределяет **отдельные RPC**. Плюс: работает с любым клиентом, даёт retry/outlier detection. Минус: лишний хоп.
    
3. **xDS / service mesh** — динамическая конфигурация балансировки, `grpc-go` умеет xDS нативно без sidecar-прокси.
    

Забыть про это — классическая ошибка, которая всплывает, когда сервис скейлится, а нагрузка не размазывается.

### 17. TLS и mTLS

```go
// Сервер: mTLS
cert, _ := tls.LoadX509KeyPair("server.crt", "server.key")
caPool := x509.NewCertPool()
ca, _ := os.ReadFile("ca.crt")
caPool.AppendCertsFromPEM(ca)

creds := credentials.NewTLS(&tls.Config{
    Certificates: []tls.Certificate{cert},
    ClientCAs:    caPool,
    ClientAuth:   tls.RequireAndVerifyClientCert,
    MinVersion:   tls.VersionTLS13,
})
srv := grpc.NewServer(grpc.Creds(creds))

// Клиент
clientCert, _ := tls.LoadX509KeyPair("client.crt", "client.key")
conn, _ := grpc.NewClient(target, grpc.WithTransportCredentials(
    credentials.NewTLS(&tls.Config{
        Certificates: []tls.Certificate{clientCert},
        RootCAs:      caPool,
        ServerName:   "orders.internal",
    }),
))
```

В service mesh (Istio/Linkerd) mTLS обычно делает sidecar — тогда приложение говорит plaintext внутри пода. Решение «кто отвечает за TLS» должно быть явным, а не «как-нибудь».

### 18. Тестирование

`bufconn` даёт настоящий gRPC-стек поверх in-memory соединения — без портов и флаков:

```go
func newTestClient(t *testing.T, svc ordersv1.OrderServiceServer) ordersv1.OrderServiceClient {
    t.Helper()
    lis := bufconn.Listen(1024 * 1024)

    srv := grpc.NewServer()
    ordersv1.RegisterOrderServiceServer(srv, svc)
    go func() { _ = srv.Serve(lis) }()
    t.Cleanup(srv.Stop)

    conn, err := grpc.NewClient("passthrough:///bufnet",
        grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) {
            return lis.DialContext(ctx)
        }),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    require.NoError(t, err)
    t.Cleanup(func() { _ = conn.Close() })

    return ordersv1.NewOrderServiceClient(conn)
}

func TestGetOrder_NotFound(t *testing.T) {
    c := newTestClient(t, &orderServer{repo: emptyRepo{}})
    _, err := c.GetOrder(context.Background(), &ordersv1.GetOrderRequest{OrderId: "nope"})
    require.Equal(t, codes.NotFound, status.Code(err))
}
```

Отладка живого сервиса:

```bash
grpcurl -plaintext localhost:50051 list                              # рефлексия
grpcurl -plaintext localhost:50051 describe orders.v1.OrderService
grpcurl -plaintext -d '{"order_id":"42"}' localhost:50051 orders.v1.OrderService/GetOrder
ghz --insecure --proto order.proto --call orders.v1.OrderService/GetOrder -n 10000 -c 50 localhost:50051
```

---

## Часть V. gRPC и внешний мир

### 19. Браузер: gRPC-Web, gateway, Connect

Браузер не может говорить gRPC: JS не имеет доступа к HTTP/2-фреймам и трейлерам. Варианты:

|Подход|Как работает|Цена|
|---|---|---|
|**gRPC-Web**|отдельный протокол, трейлеры кодируются в тело; нужен прокси (Envoy, `grpcwebproxy`)|лишний компонент, нет клиентского стриминга|
|**grpc-gateway**|генерирует REST/JSON-фасад из `.proto` с аннотациями `google.api.http`; попутно генерирует OpenAPI|два представления одного API, аннотации в proto|
|**Connect** (`connect-go`)|один сервер отвечает сразу по трём протоколам: Connect (простой HTTP/1.1+JSON, можно `curl`), gRPC и gRPC-Web|чуть медленнее чистого grpc-go, но заметно проще|

Пример grpc-gateway-аннотации:

```proto
import "google/api/annotations.proto";

rpc GetOrder(GetOrderRequest) returns (GetOrderResponse) {
  option (google.api.http) = { get: "/v1/orders/{order_id}" };
}
rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse) {
  option (google.api.http) = { post: "/v1/orders", body: "*" };
}
```

**Connect** заслуживает отдельного внимания: тот же `.proto`, тот же codegen, но сервер — обычный `http.Handler`, работает на стандартном `net/http`, поддерживает HTTP/1.1 и `curl` из коробки. В 2026-м это дефолтный выбор для нового проекта, где API нужен и сервисам, и браузеру. Бенчмарки показывают, что чистый `grpc-go` быстрее (порядка 20k против 16k rps на пустом сообщении), а вариант grpc-go через `ServeHTTP` — медленнее обоих, так что если критична максимальная производительность, остаётся `grpc-go`, а если важны HTTP/1.1, gRPC-Web без прокси и отладка курлом — Connect. Библиотека требует Go 1.25+, а с версии 1.19.2 есть флаг `simple` в кодогенераторе, убирающий обёртки запроса/ответа ради более лаконичного API. Существует и модуль `connectrpc.com/connect/v2`, при этом v1 остаётся стабильным и поддерживается бессрочно.

```go
// Connect: сервер — обычный http.Handler
mux := http.NewServeMux()
path, handler := ordersv1connect.NewOrderServiceHandler(&orderServer{},
    connect.WithInterceptors(loggingInterceptor, authInterceptor))
mux.Handle(path, handler)
http.ListenAndServe(":8080", h2c.NewHandler(mux, &http2.Server{})) // h2c для gRPC без TLS
```

```bash
# И это просто работает:
curl -X POST https://api.internal/orders.v1.OrderService/GetOrder \
  -H 'Content-Type: application/json' -d '{"order_id":"42"}'
```

### 20. Производительность и эксплуатация

- **Размеры сообщений.** Дефолт `MaxRecvMsgSize` 4 МБ. Большие полезные нагрузки лучше стримить чанками, а не поднимать лимит до сотен мегабайт.
- **Сжатие** (`grpc.UseCompressor(gzip.Name)`) экономит сеть ценой CPU. На мелких сообщениях внутри ДЦ обычно вредно, на крупных ответах через WAN — полезно.
- **Keepalive** обязателен, если между вами есть NAT или L7-прокси: иначе простаивающие соединения умирают молча, и первый запрос после паузы падает.
- **`MaxConnectionAge`** — недооценённая настройка: заставляет клиентов периодически переподключаться, что перераспределяет нагрузку после скейлинга.
- **Метрики**: `otelgrpc` даёт RED по методам из коробки. Смотреть: rps и латентность по методу, распределение кодов (особенно `Unavailable`, `DeadlineExceeded`, `ResourceExhausted`), число открытых соединений и стримов.
- **Graceful shutdown**: `NOT_SERVING` в health → пауза → `GracefulStop()`. Без паузы балансировщик продолжит слать трафик в закрывающийся под.

## Вопросы с собеседований

1. **Чем gRPC отличается от REST по существу?** Метод против ресурса; contract-first с кодогенерацией; бинарный protobuf; HTTP/2 с мультиплексированием и стримингом.
2. **Почему нельзя менять номер поля в protobuf?** Номер — это идентичность поля на проводе; имя не передаётся вовсе.
3. **Зачем `reserved`?** Чтобы удалённый номер/имя никто не переиспользовал и не сломал старых клиентов.
4. **Зачем нулевое значение enum — `UNSPECIFIED`?** proto3 не различает «не задано» и нулевое значение; 0 должен означать «не задано».
5. **Как работает `optional` в proto3?** Даёт presence — можно отличить отсутствие поля от нулевого значения; критично для PATCH.
6. **Что передаётся по проводу при unary-вызове?** HEADERS (путь `/пакет.Сервис/Метод`, `grpc-timeout`, метаданные) → DATA с length-prefixed protobuf → TRAILERS с `grpc-status`.
7. **Почему gRPC не работает в браузере?** Нужен доступ к HTTP/2-фреймам и трейлерам, которого у JS нет. Решения: gRPC-Web + прокси, grpc-gateway, Connect.
8. **Разница `InvalidArgument`, `FailedPrecondition`, `Aborted`?** Запрос плохой всегда / состояние не позволяет сейчас / конфликт конкурентного доступа.
9. **Какие коды безопасно ретраить?** `Unavailable`, иногда `ResourceExhausted` и `DeadlineExceeded` — и только для идемпотентных методов.
10. **Как передаётся дедлайн и что должен делать сервер?** Заголовок `grpc-timeout` → `ctx`; сервер обязан пробрасывать дальше и прекращать работу по `ctx.Done()`.
11. **Нужно ли пулить gRPC-соединения?** Нет: `ClientConn` потокобезопасен и мультиплексирует поверх HTTP/2.
12. **Почему gRPC плохо балансируется обычным k8s Service?** L4 распределяет соединения, а они долгоживущие. Решения: client-side LB через headless Service, L7-прокси, xDS, `MaxConnectionAge`.
13. **Четыре типа RPC и когда какой?** §8.
14. **Чем стрим отличается от очереди?** Стрим не переживает разрыв, нет replay и гарантий доставки — для этого нужна Kafka.
15. **Как обеспечить обратную совместимость?** Только добавлять поля, `reserved` на удалённые, версия в пакете, `buf breaking` в CI.
16. **Зачем `UnimplementedXxxServer` встраивать в реализацию?** Чтобы добавление метода в `.proto` не ломало компиляцию.
17. **Что такое рефлексия и стоит ли включать в проде?** Сервис, отдающий схему по запросу; удобно для `grpcurl`, но наружу открывать не стоит.
18. **Как тестировать gRPC-сервис?** `bufconn` — реальный стек без сети.
19. **Чем Connect отличается от grpc-go?** Обычный `http.Handler`, три протокола сразу, работает по HTTP/1.1 и с `curl`; чуть медленнее.
20. **Как сделать идемпотентный метод?** Ключ идемпотентности в запросе + дедупликация на сервере; ретраи на транспорте без этого опасны.
