
## Часть I. Ментальная модель

### 1. Что такое GraphQL и в чём его идея

GraphQL — это **язык запросов к графу данных** и спецификация его выполнения. Не база данных, не транспорт, не замена HTTP. Работает поверх обычного HTTP, обычно одним эндпоинтом `POST /graphql`.

Центральная идея: **клиент описывает форму нужных данных, сервер её возвращает ровно в этой форме**.

```graphql
query {
  order(id: "42") {
    id
    status
    customer { name email }
    items { sku qty price }
  }
}
```

```json
{ "data": { "order": { "id": "42", "status": "PAID",
  "customer": { "name": "Иван", "email": "i@example.com" },
  "items": [ { "sku": "A-1", "qty": 2, "price": 500 } ] } } }
```

Ответ изоморфен запросу — это не случайность, а фундамент: клиент всегда знает форму ответа заранее, без документации.

### 2. Какую боль это решает

GraphQL родился в Facebook из конкретной проблемы мобильных клиентов:

- **Over-fetching.** `GET /orders/42` отдаёт 40 полей, а экрану нужно три. На мобильной сети это лишний трафик и батарея.
- **Under-fetching и водопад запросов.** Чтобы нарисовать карточку заказа, нужно `/orders/42`, потом `/customers/7`, потом `/orders/42/items`, потом по товару на каждую позицию. Каждый круг — это RTT.
- **Взрыв эндпоинтов.** Под каждый экран появляется `/orders/42/for-mobile-card`, `/orders/42/for-admin-table`. Бэкенд становится заложником вёрстки.
- **Версионирование.** `/v1`, `/v2`, `/v3` живут вечно, потому что неизвестно, кто чем пользуется.

GraphQL отвечает: **один эндпоинт, одна схема, клиент берёт ровно то, что ему нужно, за один round-trip**. Версий нет — есть эволюция схемы с `@deprecated` и аналитикой по использованию полей.

### 3. Смена модели мышления

Главный сдвиг для бэкендера: **вы больше не проектируете эндпоинты — вы проектируете граф предметной области**.

|REST-мышление|GraphQL-мышление|
|---|---|
|«какие ручки нужны экрану»|«какие сущности есть и как они связаны»|
|ответ формирует сервер|форму ответа выбирает клиент|
|один хендлер собирает весь ответ|каждое **поле** — независимая функция (resolver)|
|контракт = URL + JSON-схема|контракт = типизированная схема, проверяемая на этапе запроса|

Второй сдвиг: **поле — это функция**. `Order.customer` — не колонка в JOIN, а вызов, который может сходить в другой сервис. Это и есть источник силы (композиция) и главный источник проблем (N+1).

### 4. Когда GraphQL уместен, а когда вреден

**Уместен:**

- Много разнородных клиентов (web, iOS, Android, партнёрский портал) с разными потребностями в данных.
- Сильно связанные данные, где UI постоянно ходит по графу.
- Read-heavy продукт с быстро меняющимся фронтендом: новый экран не требует нового бэкенд-релиза.
- BFF-слой, агрегирующий несколько бэкенд-сервисов для фронта.

**Вреден или избыточен:**

- Один клиент и стабильный API — REST проще, дешевле и понятнее.
- Сервис-сервис внутри периметра — там нужен строгий контракт и скорость, то есть **gRPC**.
- Write-heavy и операции-команды: мутации в GraphQL выражают действия хуже, чем RPC-методы.
- Файлы, стриминг, бинарные данные.
- Требуется агрессивное HTTP-кэширование и CDN: `POST /graphql` кэшировать нечем (см. §14).
- Маленькая команда без опыта: DataLoader, ограничение сложности, авторизация на уровне полей — всё это надо написать до выхода в прод, иначе получите DDoS собственными клиентами.

**Честный вывод:** GraphQL — это инструмент **фронт-фасада**, а не универсальная замена всему. Самая здоровая архитектура 2020-х: gRPC между сервисами, GraphQL (или REST) на границе для фронта.

---

## Часть II. Схема

### 5. SDL: типы

Схема пишется на SDL (Schema Definition Language) и является контрактом.

```graphql
"Заказ пользователя"
type Order {
  id: ID!                       # ! = non-null
  status: OrderStatus!
  totalCents: Int!
  comment: String               # nullable
  customer: Customer!           # связь — тоже поле
  items: [OrderItem!]!          # непустой-по-типу список непустых элементов
  createdAt: DateTime!          # кастомный скаляр
}

type OrderItem {
  sku: String!
  qty: Int!
  priceCents: Int!
  product: Product!             # отдельный resolver → потенциальный N+1
}

enum OrderStatus { CREATED PAID SHIPPED CANCELLED }

scalar DateTime                 # кастомный скаляр: сериализация ваша

interface Node { id: ID! }      # интерфейс: общий набор полей

type Customer implements Node {
  id: ID!
  name: String!
  email: String!
  orders(first: Int = 20, after: String): OrderConnection!
}

union SearchResult = Order | Customer | Product   # union: без общих полей

input CreateOrderInput {        # input-типы отдельны от output-типов
  customerId: ID!
  items: [OrderItemInput!]!
  idempotencyKey: String!
}

type CreateOrderPayload {       # payload-обёртка вместо голого Order
  order: Order
  errors: [UserError!]!
}

type UserError {                # ожидаемые ошибки — часть схемы, а не errors[]
  field: String
  message: String!
  code: ErrorCode!
}

type Query {
  order(id: ID!): Order
  orders(filter: OrderFilter, first: Int = 20, after: String): OrderConnection!
  node(id: ID!): Node
}

type Mutation {
  createOrder(input: CreateOrderInput!): CreateOrderPayload!
  cancelOrder(input: CancelOrderInput!): CancelOrderPayload!
}

type Subscription {
  orderStatusChanged(orderId: ID!): Order!
}
```

**Нотация `[OrderItem!]!` читается справа налево:** сам список не может быть null, и элементы внутри не могут быть null. Варианты: `[T]` (может быть null и список, и элементы), `[T!]` (список nullable, элементы нет), `[T]!` (список обязателен, элементы могут быть null).

### 6. Nullability — важнее, чем кажется

Nullability в GraphQL — не косметика, а **механизм распространения ошибок**. Если resolver non-null поля вернул ошибку, движок не может вернуть `null` в это поле — он «поднимает» null вверх до ближайшего nullable-родителя, **вырезая целую ветку ответа**.

```
Order.customer: Customer!   → падение в customer занулит весь Order
Order.customer: Customer    → падение вернёт customer: null, остальной заказ уцелеет
```

Практическое правило: **non-null ставьте только там, где значение действительно не может отсутствовать никогда и данные локальны**. Поля, за которыми стоит вызов другого сервиса, делайте nullable — иначе падение соседнего сервиса обнулит весь экран. Обратное изменение (`T` → `T!`) ломающее, а (`T!` → `T`) — тоже ломающее для клиента, который на non-null рассчитывал. Ошибиться легко, исправить дорого.

### 7. Дизайн мутаций

Три правила, выработанные практикой (и закреплённые в Relay-конвенциях):

1. **Один аргумент `input`**, один тип на мутацию. Проще эволюционировать.
2. **Payload-обёртка** вместо голого типа: туда потом добавятся `errors`, `clientMutationId`, затронутые сущности.
3. **Ожидаемые ошибки — в схеме** (`errors: [UserError!]!`), а не в глобальном `errors[]`. «Недостаточно средств» — это не исключение, а нормальный результат бизнес-операции, и клиент должен получить его типизированно.

Мутации выполняются **последовательно** (в отличие от полей query, которые параллельны) — это гарантия спецификации.

Идемпотентность GraphQL не даёт — добавляйте `idempotencyKey` в input и дедуплицируйте на сервере, как в REST.

### 8. Пагинация: cursor connections

Offset-пагинация (`limit`/`offset`) ломается на изменяющихся данных: вставка записи сдвигает страницы, и пользователь видит дубли или пропуски. Стандарт в GraphQL — **Relay Cursor Connections**:

```graphql
type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int          # дорого: отдельный COUNT — делайте nullable и по требованию
}
type OrderEdge {
  node: Order!
  cursor: String!          # opaque-строка, обычно base64 от ключа сортировки
}
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

Курсор должен быть **непрозрачным** для клиента (base64 от `created_at|id`) и соответствовать keyset-запросу в БД: `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT $3`.

---

## Часть III. Как выполняется запрос

### 9. Жизненный цикл

```
HTTP POST /graphql
   ↓
1. PARSE       — текст запроса → AST
   ↓
2. VALIDATE    — проверка против схемы: существуют ли поля, типы аргументов,
                 фрагменты, переменные. Ошибка → 200 с errors, резолверы НЕ вызываются
   ↓
3. [ваши правила] — глубина, сложность, persisted queries, rate limit
   ↓
4. EXECUTE     — обход дерева: для каждого поля вызывается resolver
                 • поля Query выполняются ПАРАЛЛЕЛЬНО
                 • поля Mutation — ПОСЛЕДОВАТЕЛЬНО
                 • дочерние резолверы вызываются после родительского
   ↓
5. Сборка ответа { data, errors, extensions }
```

Важно: **валидация происходит до любого обращения к данным**. Это большое преимущество перед REST — кривой запрос не доходит до БД.

### 10. Resolver — единица исполнения

Каждое поле имеет резолвер с сигнатурой `(parent, args, context, info) → value`. Если резолвер не написан, движок берёт одноимённое поле из родительского объекта (trivial resolver).

```
query { order(id:"42") { id customer { name } items { product { title } } } }

Query.order(id: 42)                     ← 1 вызов
├── Order.id                            ← тривиальный, из объекта
├── Order.customer  → БД/сервис          ← 1 вызов
└── Order.items     → БД                 ← 1 вызов
    └── OrderItem.product → БД           ← ПО ВЫЗОВУ НА КАЖДУЮ ПОЗИЦИЮ ⚠
```

### 11. N+1: главная проблема

Последняя строка выше — это и есть **N+1**. Десять позиций → десять отдельных запросов за товарами. Двадцать заказов на странице, в каждом по десять позиций → двести запросов на один HTTP-запрос от клиента.

Решение — **DataLoader**: буфер, который собирает все вызовы за один «тик» event loop (в Go — за короткое окно времени или до заполнения батча), делает один батч-запрос `WHERE id = ANY($1)` и раскладывает результаты обратно.

```
без DataLoader:  SELECT * FROM products WHERE id = 1;  (×N)
с DataLoader:    SELECT * FROM products WHERE id = ANY('{1,2,3,...}');  (×1)
```

Два обязательных свойства загрузчика:

- **Батчинг** — объединение вызовов в один запрос.
- **Кэш в пределах запроса** — один и тот же `product:7` загружается однажды. Кэш обязан жить **только в рамках одного HTTP-запроса**, иначе получите утечку данных между пользователями и устаревшие значения.

**Правило:** каждое поле-связь должно ходить через loader. Не «когда заметим тормоза», а сразу — иначе N+1 находят в проде.

### 12. Ошибки

Спецификация: GraphQL почти всегда отвечает **HTTP 200**, а ошибки лежат в поле `errors` рядом с частичными `data`.

```json
{
  "data": { "order": { "id": "42", "customer": null } },
  "errors": [{
    "message": "customer service unavailable",
    "path": ["order", "customer"],
    "extensions": { "code": "UPSTREAM_UNAVAILABLE" }
  }]
}
```

Практика, которую стоит принять как правило:

- **Ожидаемые ошибки бизнес-логики** («нет на складе», «неверный пароль») → типизированный результат в схеме (§7). Клиенту их надо обрабатывать в UI, а не парсить строки.
- **Неожиданные** (БД упала, паника) → в `errors[]` с машиночитаемым `extensions.code`, без внутренних деталей наружу.
- **Никогда не отдавайте текст внутренней ошибки и стектрейс** — это классическая утечка. Логируйте полностью, наружу отдавайте код и correlation id.
- Частичный ответ — это фича: упал один сервис, остальная часть экрана отрисуется.

---

## Часть IV. Реализация на Go (gqlgen)

### 13. Почему gqlgen и как он устроен

В Go три подхода: `graphql-go/graphql` (схема в рантайме, много `map[string]interface{}`), `graph-gophers/graphql-go` (схема + рефлексия по структурам), **`99designs/gqlgen`** (schema-first + кодогенерация, полная типобезопасность). Для продакшена стандарт — gqlgen: вы пишете `.graphql`, он генерирует модели и интерфейсы резолверов, а вы заполняете тела. Забыли реализовать поле — не скомпилируется.

```bash
mkdir example && cd example && go mod init example
go get -tool github.com/99designs/gqlgen     # Go 1.24+: tool-зависимости в go.mod
go tool gqlgen init                           # каркас проекта
# ... правим schema.graphqls ...
go tool gqlgen generate                       # перегенерация после каждого изменения схемы
```

```yaml
# gqlgen.yml
schema: [graph/*.graphqls]
exec:   { filename: graph/generated.go, package: graph }
model:  { filename: graph/model/models_gen.go, package: model }
resolver:
  layout: follow-schema
  dir: graph
  package: graph
  filename_template: "{name}.resolvers.go"

# Маппинг GraphQL-типов на ваши доменные структуры — чтобы не плодить дубли
models:
  ID:   { model: [github.com/99designs/gqlgen/graphql.ID, github.com/99designs/gqlgen/graphql.Int64] }
  DateTime: { model: github.com/99designs/gqlgen/graphql.Time }
  Order:
    model: example/internal/domain.Order
    fields:
      customer: { resolver: true }    # заставить сгенерировать отдельный resolver
      items:    { resolver: true }
```

### 14. Резолверы

```go
package graph

// Query.order
func (r *queryResolver) Order(ctx context.Context, id string) (*domain.Order, error) {
    // Авторизация — здесь, а не в HTTP-middleware: middleware не знает, какие поля запросили
    user := auth.FromContext(ctx)
    if user == nil {
        return nil, gqlerror.Errorf("unauthenticated")
    }

    order, err := r.Orders.Get(ctx, id)
    if errors.Is(err, domain.ErrNotFound) {
        return nil, nil            // поле nullable → просто null, не ошибка
    }
    if err != nil {
        return nil, fmt.Errorf("get order: %w", err)
    }
    if !user.CanSee(order) {
        return nil, nil            // не «403», а «не существует» — не раскрываем наличие
    }
    return order, nil
}

// Order.customer — поле-связь, ОБЯЗАТЕЛЬНО через loader
func (r *orderResolver) Customer(ctx context.Context, obj *domain.Order) (*domain.Customer, error) {
    return loaders.For(ctx).CustomerByID.Load(ctx, obj.CustomerID)
}

// Order.items
func (r *orderResolver) Items(ctx context.Context, obj *domain.Order) ([]*domain.OrderItem, error) {
    return loaders.For(ctx).ItemsByOrderID.Load(ctx, obj.ID)
}

// OrderItem.product — тот самый N+1, закрытый батчем
func (r *orderItemResolver) Product(ctx context.Context, obj *domain.OrderItem) (*domain.Product, error) {
    return loaders.For(ctx).ProductByID.Load(ctx, obj.SKU)
}

// Mutation.createOrder — payload с типизированными ошибками
func (r *mutationResolver) CreateOrder(ctx context.Context, input model.CreateOrderInput) (*model.CreateOrderPayload, error) {
    user := auth.FromContext(ctx)
    if user == nil {
        return nil, gqlerror.Errorf("unauthenticated")
    }

    order, err := r.Orders.Create(ctx, user.ID, toDomain(input), input.IdempotencyKey)
    switch {
    case errors.Is(err, domain.ErrOutOfStock):
        // ожидаемая ошибка → часть схемы, HTTP 200, data не null
        return &model.CreateOrderPayload{
            Errors: []*model.UserError{{
                Field: ptr("items"), Message: "товара нет в наличии", Code: model.ErrorCodeOutOfStock,
            }},
        }, nil
    case err != nil:
        return nil, fmt.Errorf("create order: %w", err)   // неожиданная → errors[]
    }
    return &model.CreateOrderPayload{Order: order, Errors: nil}, nil
}
```

### 15. DataLoader

```go
package loaders

import (
    "context"
    "net/http"
    "time"

    "github.com/vikstrous/dataloadgen"
)

type Loaders struct {
    CustomerByID   *dataloadgen.Loader[string, *domain.Customer]
    ProductByID    *dataloadgen.Loader[string, *domain.Product]
    ItemsByOrderID *dataloadgen.Loader[string, []*domain.OrderItem]
}

type ctxKey struct{}

// Middleware создаёт НОВЫЕ loaders на каждый HTTP-запрос.
// Общий на всё приложение loader = утечка данных между пользователями и устаревший кэш.
func Middleware(repo *Repo, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        l := &Loaders{
            CustomerByID: dataloadgen.NewLoader(repo.fetchCustomers,
                dataloadgen.WithWait(2*time.Millisecond),   // окно сбора батча
                dataloadgen.WithBatchCapacity(100),
            ),
            ProductByID:    dataloadgen.NewLoader(repo.fetchProducts, dataloadgen.WithWait(2*time.Millisecond)),
            ItemsByOrderID: dataloadgen.NewLoader(repo.fetchItemsByOrder, dataloadgen.WithWait(2*time.Millisecond)),
        }
        next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, l)))
    })
}

func For(ctx context.Context) *Loaders { return ctx.Value(ctxKey{}).(*Loaders) }

// Batch-функция: на входе N ключей, на выходе N значений В ТОМ ЖЕ ПОРЯДКЕ.
// Это контракт loader'а — нарушите порядок, и клиент получит чужие данные.
func (r *Repo) fetchCustomers(ctx context.Context, ids []string) ([]*domain.Customer, []error) {
    rows, err := r.db.Query(ctx,
        `SELECT id, name, email FROM customers WHERE id = ANY($1)`, ids)
    if err != nil {
        errs := make([]error, len(ids))
        for i := range errs {
            errs[i] = err
        }
        return make([]*domain.Customer, len(ids)), errs
    }
    defer rows.Close()

    byID := make(map[string]*domain.Customer, len(ids))
    for rows.Next() {
        var c domain.Customer
        if err := rows.Scan(&c.ID, &c.Name, &c.Email); err != nil {
            // ...
        }
        byID[c.ID] = &c
    }

    out := make([]*domain.Customer, len(ids))
    errs := make([]error, len(ids))
    for i, id := range ids {
        if c, ok := byID[id]; ok {
            out[i] = c
        } else {
            errs[i] = domain.ErrNotFound   // ошибка привязана к конкретному ключу
        }
    }
    return out, errs
}
```

Ключевые моменты: loaders создаются **на запрос**, batch-функция возвращает значения **в порядке ключей**, а окно ожидания (`WithWait`) — компромисс между задержкой и эффективностью батча (1–5 мс обычно достаточно, потому что резолверы одного уровня вызываются почти одновременно).

### 16. Сервер, middleware и лимиты

```go
func main() {
    resolver := &graph.Resolver{Orders: orderSvc, Customers: customerSvc}

    srv := handler.New(graph.NewExecutableSchema(graph.Config{
        Resolvers:  resolver,
        Directives: graph.DirectiveRoot{Auth: authDirective},
    }))

    // Транспорты: включайте только нужные
    srv.AddTransport(transport.Options{})
    srv.AddTransport(transport.POST{})
    srv.AddTransport(transport.MultipartForm{MaxUploadSize: 32 << 20})
    // GET намеренно НЕ включаем: он открывает CSRF-вектор для мутаций.
    // Если нужен GET (для CDN + persisted queries) — только для query, с CSRF-защитой.

    srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))     // кэш распарсенных запросов
    srv.Use(extension.Introspection{})                       // в проде — только для внутренних
    srv.Use(extension.AutomaticPersistedQuery{Cache: lru.New[string](100)})

    // ЗАЩИТА: без этих двух строк любой клиент может положить сервер одним запросом
    srv.Use(extension.FixedComplexityLimit(300))
    srv.Use(&DepthLimit{Max: 12})

    // Обработка паник и ошибок
    srv.SetRecoverFunc(func(ctx context.Context, err any) error {
        slog.ErrorContext(ctx, "panic in resolver", "err", err, "stack", string(debug.Stack()))
        return gqlerror.Errorf("internal server error")
    })
    srv.SetErrorPresenter(func(ctx context.Context, e error) *gqlerror.Error {
        err := graphql.DefaultErrorPresenter(ctx, e)
        var domainErr *domain.Error
        if errors.As(e, &domainErr) {
            err.Message = domainErr.PublicMessage
            err.Extensions = map[string]any{"code": domainErr.Code}
            return err
        }
        // неизвестная ошибка: наружу — только код и correlation id
        slog.ErrorContext(ctx, "resolver error", "err", e)
        return &gqlerror.Error{
            Message:    "internal server error",
            Extensions: map[string]any{"code": "INTERNAL", "requestId": reqid.From(ctx)},
        }
    })

    mux := http.NewServeMux()
    mux.Handle("/graphql",
        auth.Middleware(
            loaders.Middleware(repo,
                otelhttp.NewHandler(srv, "graphql"))))

    // Playground — ТОЛЬКО в dev
    if cfg.Env == "dev" {
        mux.Handle("/", playground.Handler("GraphQL", "/graphql"))
    }

    http.ListenAndServe(":8080", mux)
}
```

Стоимость полей задаётся в схеме или в коде:

```go
cfg := graph.Config{Resolvers: resolver}
cfg.Complexity.Query.Orders = func(childComplexity, first int, filter *model.OrderFilter) int {
    return first * childComplexity        // список стоит first × стоимость элемента
}
cfg.Complexity.Order.Items = func(childComplexity int) int {
    return 10 * childComplexity
}
```

### 17. Аутентификация и авторизация

**Аутентификация** — в HTTP-middleware до GraphQL: распарсили токен, положили пользователя в `context`.

**Авторизация — в резолверах**, потому что HTTP-middleware не знает, какие поля запросили. Три уровня:

```go
// 1. На уровне поля — через директиву в схеме
// directive @auth(requires: Role = USER) on FIELD_DEFINITION | OBJECT
// type Order { internalNotes: String @auth(requires: ADMIN) }

func authDirective(ctx context.Context, obj any, next graphql.Resolver, requires *model.Role) (any, error) {
    user := auth.FromContext(ctx)
    if user == nil {
        return nil, gqlerror.Errorf("unauthenticated")
    }
    if !user.HasRole(*requires) {
        return nil, gqlerror.Errorf("forbidden")
    }
    return next(ctx)
}

// 2. На уровне объекта — проверка владения внутри резолвера (см. §14)

// 3. На уровне строк — фильтрация в запросе к БД по tenant/user
```

Ключевая мысль: **в GraphQL нет «защищённого эндпоинта»**. Одно поле, доступное не тому пользователю, — это утечка, до которой можно дойти по графу с любого корня. Проектируйте авторизацию по полям и по данным, а не по «ручкам».

### 18. Безопасность: чего боится GraphQL-сервер

|Угроза|Суть|Защита|
|---|---|---|
|**Глубокая рекурсия**|`order { customer { orders { customer { ... } } } }` на 50 уровней|depth limit (10–15)|
|**Взрыв сложности**|`orders(first: 1000) { items { product { reviews(first: 1000) } } }`|complexity limit со стоимостью полей и учётом `first`|
|**Batching-атака**|массив из 1000 операций в одном HTTP-запросе|ограничить размер батча или отключить батчинг|
|**Алиасная атака**|`a: order(id:1) b: order(id:2) ... ×1000` в одном запросе|complexity limit, ограничение числа корневых полей|
|**Интроспекция**|карта всей схемы для атакующего|отключать в публичном проде (не безопасность сама по себе, но снижает удобство разведки)|
|**Утечка через ошибки**|стектрейсы, SQL-тексты в `errors`|`ErrorPresenter`, наружу только коды|
|**Отсутствие rate limit**|обычный по числу запросов не работает: один запрос ≠ одна единица нагрузки|лимит по **стоимости** запроса, а не по количеству|
|**CSRF**|мутации через GET или `Content-Type: text/plain`|только POST + `application/json`, проверка `Content-Type`, CSRF-токен|

Самый надёжный вариант для публичного API: **persisted queries** — клиент присылает не текст запроса, а хеш заранее согласованного запроса. Сервер выполняет только то, что есть в реестре. Это сразу закрывает и произвольную сложность, и интроспекцию, и позволяет кэшировать по хешу. APQ (`AutomaticPersistedQuery`) — облегчённая версия того же для экономии трафика.

### 19. Кэширование

**Плохая новость:** HTTP-кэш, CDN и `Cache-Control` по умолчанию не работают. `POST /graphql` с телом не кэшируется ничем, а каждый клиент запрашивает свою форму данных.

Что делают вместо этого:

1. **Нормализованный кэш на клиенте.** Apollo Client, Relay, urql хранят объекты по `__typename:id` и переиспользуют их между запросами. Отсюда требование к серверу: **отдавайте глобально уникальный `id` у каждого объекта**, иначе клиентский кэш не работает.
2. **Persisted queries + GET** — тогда запрос становится кэшируемым URL, и CDN оживает.
3. **Server-side кэш на уровне резолверов/loaders** — Redis под конкретные сущности, а не под ответ целиком.
4. **`@cacheControl(maxAge:)`** — директива Apollo-экосистемы: сервер вычисляет минимальный maxAge по дереву и отдаёт `Cache-Control` в заголовке. Работает только если все поля в ответе публичные.
5. **Response cache** для полностью публичных запросов (каталог, справочники) по хешу запроса.

### 20. Подписки

```graphql
type Subscription {
  orderStatusChanged(orderId: ID!): Order!
}
```

```go
func (r *subscriptionResolver) OrderStatusChanged(ctx context.Context, orderID string) (<-chan *domain.Order, error) {
    if !auth.FromContext(ctx).CanSee(orderID) {
        return nil, gqlerror.Errorf("forbidden")
    }

    ch := make(chan *domain.Order, 1)

    sub, err := r.Bus.Subscribe(ctx, "order."+orderID)   // Redis Pub/Sub, NATS или Kafka
    if err != nil {
        return nil, err
    }

    go func() {
        defer close(ch)
        defer sub.Close()
        for {
            select {
            case <-ctx.Done():            // клиент отключился — обязательно обрабатывать
                return
            case ev, ok := <-sub.Events():
                if !ok {
                    return
                }
                select {
                case ch <- ev.Order:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    return ch, nil
}
```

```go
srv.AddTransport(&transport.Websocket{
    KeepAlivePingInterval: 10 * time.Second,
    Upgrader: websocket.Upgrader{CheckOrigin: checkAllowedOrigin},   // не пропускайте любой Origin
    InitFunc: func(ctx context.Context, init transport.InitPayload) (context.Context, *transport.InitPayload, error) {
        // аутентификация в WS идёт в connection_init, а не в HTTP-заголовках
        user, err := auth.FromToken(init.Authorization())
        if err != nil {
            return nil, nil, errors.New("unauthenticated")
        }
        return auth.WithUser(ctx, user), nil, nil
    },
})
```

Что нужно помнить о подписках в проде:

- Протокол — `graphql-transport-ws` (современный) поверх WebSocket; есть и вариант поверх SSE для однонаправленных случаев.
- **Аутентификация в `connection_init`**, потому что браузерный WebSocket не умеет кастомные заголовки.
- **Масштабирование:** подписчик подключён к одному поду, а событие пришло в другой. Нужна внешняя шина (Redis Pub/Sub, NATS, Kafka), а не локальный in-memory bus.
- Каждая подписка — это живая горутина и соединение. Тысяча пользователей на экране заказа — тысяча соединений; планируйте лимиты и таймауты.
- Подписки — не замена очереди: при разрыве события теряются, клиент должен уметь дозапросить состояние.

### 21. Эволюция схемы

В GraphQL **нет версий** — есть непрерывная эволюция.

**Безопасно:** добавить тип; добавить nullable-поле; добавить необязательный аргумент; добавить значение в enum (осторожно: старый клиент получит неизвестное значение); пометить `@deprecated(reason: "...")`.

**Ломающе:** удалить/переименовать поле или тип; сделать nullable-поле non-null и наоборот; добавить обязательный аргумент; удалить значение enum; сузить тип.

Процесс, который работает:

1. Пометить поле `@deprecated` с указанием замены.
2. Собирать **аналитику использования полей** — кто и как часто вызывает устаревшее поле.
3. Удалить, когда счётчик обнулился и клиенты обновились.

В CI ставят **schema checks**: сравнение схемы с предыдущей версией и падение сборки на ломающих изменениях (GraphQL Inspector, Apollo Rover, Hive). Это аналог `buf breaking` из мира gRPC — обязательный элемент зрелого процесса.

### 22. Несколько сервисов: federation vs BFF

Когда графов много:

|Подход|Суть|Когда|
|---|---|---|
|**BFF-монолит**|один GraphQL-сервис ходит в остальные (REST/gRPC) и собирает граф|2–10 сервисов, одна команда владеет фасадом. Самый простой и чаще всего правильный выбор|
|**Federation** (Apollo Federation v2)|каждый сервис публикует свою часть схемы, шлюз склеивает их в единый граф; типы расширяются через `@key`, `@external`|много команд, каждая владеет своей частью графа|
|**Schema stitching**|ручная склейка схем на шлюзе|легаси-подход, вытеснен federation|

Federation даёт независимые релизы команд ценой серьёзной инфраструктуры: шлюз, композиция схем, распределённая трассировка, планировщик запросов. Не начинайте с неё — начните с BFF, переходите, когда границы команд реально болят.

### 23. Наблюдаемость

GraphQL по умолчанию непрозрачен: все запросы идут в один URL с кодом 200. Что нужно настроить:

- **Метрики по операциям, а не по URL.** Ключ — имя операции (`query GetOrderPage`) плюс её хеш. Требуйте от клиентов именованных операций — анонимные запросы невозможно анализировать.
- **Трассировка по резолверам**: OpenTelemetry-расширение gqlgen даёт span на поле — сразу видно, какое поле съело 300 мс.
- **Счётчики использования полей** — для депрекации (§21).
- **Логировать** имя операции, переменные (с маскированием секретов), стоимость, длительность, коды ошибок.
- **Алерты** на долю запросов с `errors`, на p99 по тяжёлым операциям, на превышение complexity-лимита (это либо атака, либо клиент сломался).

---

## Часть V. Итоги

### 24. GraphQL vs REST vs gRPC

||REST|GraphQL|gRPC|
|---|---|---|---|
|Единица дизайна|ресурс|граф типов|метод|
|Кто выбирает форму ответа|сервер|клиент|схема|
|Транспорт|HTTP/1.1+|HTTP (обычно POST)|HTTP/2|
|Формат|JSON|JSON|protobuf|
|Типизация контракта|опционально (OpenAPI)|обязательна (схема)|обязательна (proto)|
|Кодогенерация|опциональна|клиент по схеме|обе стороны|
|HTTP-кэш и CDN|отлично|плохо (нужны persisted queries)|нет|
|Стриминг|SSE/WebSocket|subscriptions|нативный, 4 вида|
|Over/under-fetching|есть|решено|нет (метод возвращает что задумано)|
|Сложность сервера|низкая|высокая|средняя|
|Типичное место|публичное API, простые сервисы|фронт-фасад, BFF|сервис-сервис|

**Практический канон:** gRPC внутри, GraphQL или REST снаружи. GraphQL берут, когда клиентов много и они разные; REST — когда API простое и публичное; gRPC — везде, где общаются сервисы.

### 25. Антипаттерны

1. **Резолвер ходит в БД напрямую без loader.** N+1 в первый же день.
2. **Схема — зеркало таблиц БД.** Схема должна описывать предметную область, а не `snake_case` колонки; иначе миграция БД становится ломающим изменением API.
3. **Всё non-null.** Один упавший сервис обнуляет весь ответ.
4. **Авторизация только в HTTP-middleware.** Middleware не знает про поля.
5. **Нет лимитов сложности.** Клиент (или атакующий) кладёт БД одним запросом.
6. **Голые ошибки бизнес-логики в `errors[]`.** Клиент парсит строки вместо типов.
7. **Мутации как CRUD** (`updateOrder(input: всё-поле-опционально)`) вместо намерений (`cancelOrder`, `applyDiscount`). Теряется бизнес-смысл и валидация.
8. **Общий DataLoader на приложение.** Утечка данных между пользователями.
9. **GraphQL между микросервисами.** Дорогой парсинг, неявные контракты, нет стриминга — здесь нужен gRPC.
10. **Интроспекция и playground открыты в проде.**

### 26. Вопросы с собеседований

1. **Что такое GraphQL и что он решает?** Язык запросов к графу; over-fetching, under-fetching, взрыв эндпоинтов, версионирование.
2. **Почему один эндпоинт и HTTP 200 почти всегда?** Маршрутизация внутри запроса, а не в URL; частичные ответы с `data` + `errors`.
3. **Что такое resolver и когда он вызывается?** Функция на поле; тривиальные берут значение из родителя; дочерние — после родительского.
4. **Query параллельно, mutation последовательно — почему?** Гарантия спецификации: мутации имеют побочные эффекты и их порядок должен быть детерминирован.
5. **Что такое N+1 и как решается?** Поле-связь вызывает запрос на каждый элемент; DataLoader с батчингом и per-request кэшем.
6. **Почему loader создаётся на каждый запрос?** Иначе кэш переживёт запрос: утечка чужих данных и устаревшие значения.
7. **Как устроена nullability и почему она важна?** Ошибка в non-null поле «поднимает» null до ближайшего nullable-родителя, вырезая ветку ответа.
8. **Как версионировать GraphQL API?** Никак — `@deprecated`, аналитика использования, schema checks в CI.
9. **Как защититься от тяжёлых запросов?** Depth limit, complexity limit со стоимостью полей, лимит батча и алиасов, persisted queries, rate limit по стоимости.
10. **Почему GraphQL плохо кэшируется и что делать?** POST с телом; persisted queries + GET, нормализованный кэш на клиенте, кэш на уровне резолверов.
11. **Где делать авторизацию?** В резолверах (плюс директивы и фильтрация на уровне строк), не только в middleware.
12. **Как отдавать ошибки бизнес-логики?** Типизированным payload в схеме; в `errors[]` — только неожиданные, без внутренних деталей.
13. **Как устроена пагинация?** Relay cursor connections с opaque-курсором поверх keyset-запроса.
14. **Как работают подписки и как их масштабировать?** WebSocket (`graphql-transport-ws`), аутентификация в `connection_init`, внешняя шина для многоподовой раскладки.
15. **Federation vs BFF?** Независимость команд ценой инфраструктуры против простоты; начинать стоит с BFF.
16. **Чем GraphQL хуже gRPC для сервис-сервис?** Дороже парсинг и выполнение, нет нативного стриминга и строгих бинарных контрактов.
17. **Что такое persisted queries?** Клиент шлёт хеш заранее согласованного запроса; закрывает сложность, интроспекцию и открывает кэширование.
18. **Что положить в `extensions`?** Машиночитаемый код ошибки, трассировку, correlation id, информацию о кэше.

---

## 27. Ссылки

- Спецификация: https://spec.graphql.org/
- Официальные best practices: https://graphql.org/learn/best-practices/
- Relay Cursor Connections: https://relay.dev/graphql/connections.htm
- gqlgen: https://gqlgen.com/ · https://github.com/99designs/gqlgen
- dataloadgen (Go): https://github.com/vikstrous/dataloadgen
- Apollo Federation: https://www.apollographql.com/docs/federation/
- GraphQL Inspector (schema checks): https://the-guild.dev/graphql/inspector
- Рекомендации OWASP по GraphQL: https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- graphql-transport-ws: https://github.com/enisdenjo/graphql-ws




