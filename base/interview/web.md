---
tags:
  - interview
  - web
  - frontend
---

## Введение

Эта подборка охватывает 50 вопросов по Web-платформе, которые Senior Frontend Developer должен понимать на глубоком уровне. Это не про JavaScript или React - это про то, как работает браузер, сеть, безопасность и производительность. Каждый ответ содержит объяснение внутренней механики, векторы атак (где применимо), стратегии защиты и осознанные tradeoffs.

Вопросы идут в порядке убывания частоты появления на собеседованиях: от фундаментальной безопасности до продвинутых тем архитектуры.

---

### 1. Полный цикл загрузки и рендеринга страницы: от URL до пикселя

**1. Ввод URL и DNS-резолвинг** - пользователь вводит URL, браузер проверяет кеш (браузерный, OS, роутер, ISP). Рекурсивный DNS-запрос: Root → TLD → Authoritative. A/AAAA записи возвращают IP. Оптимизации: `dns-prefetch` (только DNS, ~50ms в тёплом кеше, до 300ms в холодном), `preconnect` (DNS + TCP + TLS).

**2. TCP handshake** - SYN → SYN-ACK → ACK, 1.5 RTT (~30-100ms). TCP Fast Open (TFO) для повторных соединений позволяет отправлять данные уже в SYN-пакете, экономя 1 RTT.

**3. TLS handshake** (HTTPS):
- TLS 1.2: 2-RTT (ClientHello → ServerHello → Certificate → Key Exchange → Finished)
- TLS 1.3: 1-RTT (объединены шаги, шифруется больше данных)
- Session resumption через Session ID/Tickets, 0-RTT для повторных визитов
- Итого: ~50-200ms для TLS 1.3

**4. HTTP-запрос и ответ:**
- Отправка запроса (метод, заголовки, тело), server-side обработка
- HTTP/2: мультиплексирование стримов в одном TCP-соединении, HPACK сжатие заголовков
- HTTP/3 (QUIC): UDP вместо TCP, устранение HOL blocking, 0-RTT resumption, connection migration
- Ответ: статус, заголовки, body

**5. Парсинг HTML и построение DOM:**
Браузер получает первые байты, начинает инкрементальный парсинг: байты → символы → токены → узлы DOM. Preload scanner (спекулятивный анализ) обнаруживает ресурсы пока парсер заблокирован скриптом. Parser-blocking скрипты (`<script>` без атрибутов) останавливают парсинг. `async` - загружается параллельно, выполняется сразу после загрузки. `defer` - загружается параллельно, выполняется после парсинга в порядке объявления.

**6. Парсинг CSS и построение CSSOM:**
Загрузка всех CSS (link, style, inline), построение CSS Object Model. CSS render-blocking - браузер не может рендерить без CSSOM, так как не знает стили. Но CSS НЕ блокирует DOM-парсинг. Каскадирование и specificity определяют финальные значения свойств.

**7. JavaScript: загрузка и выполнение:**
Parser-blocking скрипты останавливают парсинг. Async-скрипты выполняются как готовы (порядок не гарантирован). Defer-скрипты выполняются после DOM-парсинга в порядке объявления, перед DOMContentLoaded. Module-скрипты (`<script type="module">`) defer по умолчанию. Влияние на DOMContentLoaded: defer-скрипты задерживают событие до своего выполнения.

**8. Построение Render Tree:**
Объединение DOM + CSSOM. Исключаются невидимые элементы (`display: none`, `<head>`, `<script>`, `<link>`). Псевдоэлементы (`:before`, `:after`) включаются в Render Tree. Render Tree содержит только видимые элементы с их стилями.

**9. Layout (Reflow):**
Вычисление геометрии каждого видимого элемента - размеры, позиции. Box model: content → padding → border → margin. Reflow вызывают: изменение размеров, позиции, содержимого, resize окна, смена шрифта. Forced synchronous layout возникает при чтении геометрических свойств (`offsetHeight`, `clientWidth`, `getComputedStyle()`) между записями DOM - браузер вынужден синхронно пересчитать layout.

**10. Paint:**
Преобразование Layout-дерева в список команд отрисовки (display lists). Разбивка на слои: `will-change`, `transform`, `<video>`, `<canvas>` создают отдельные composite-слои. Порядок отрисовки определяется z-index и stacking context. Paint заполняет пиксели - цвет, тени, фон, текст.

**11. Composite:**
Объединение слоёв в финальное изображение. GPU-ускорение через `translateZ(0)`, `will-change`. Compositor thread работает независимо от main thread - анимации `transform` и `opacity` выполняются на compositor thread без блокировки main thread. Это единственный способ плавных 60fps анимаций.

> [!important]
> Полный цикл от клика до первого пикселя: DNS (~50ms в тёплом кеше, до 300ms в холодном) → TCP (~1.5 RTT, ~30-100ms) → TLS (~1-2 RTT, ~50-200ms для TLS 1.3) → HTTP-запрос (~1 RTT, ~30-100ms) → парсинг HTML (~5-20ms на 100KB) → CSSOM (~5-20ms) → JS-выполнение (зависит от объёма) → Layout (~10-30ms) → Paint (~10-20ms) → Composite (~5ms на GPU). Итого First Contentful Paint обычно 1-2.5 секунды на среднестатистическом соединении.

---

### 2. XSS: Reflected, Stored, DOM-based

**XSS (Cross-Site Scripting)** - инъекция злонамеренного скрипта в контекст другого пользователя. Три типа:

**Reflected XSS** - сервер отражает несанированный пользовательский ввод обратно в HTML (например, параметр `?q=<script>...</script>` в поисковом запросе). Срабатывает при переходе жертвы по подготовленной ссылке.

**Stored XSS** - злонамеренный скрипт сохраняется в базе данных (комментарий, поле профиля) и выполняется у всех посетителей страницы. Наиболее опасный тип.

**DOM-based XSS** - атака происходит исключительно на клиенте: `innerHTML`, `eval()`, `document.write()`, `location.hash` используются для вставки данных из untrusted source в sink без валидации.

```javascript
// DOM-based XSS через location.hash
const userInput = location.hash.slice(1);
document.getElementById('content').innerHTML = userInput; // XSS!
```

**Защита:**
- Content-Security-Policy с `script-src 'self'` и nonce-based подходом
- Всегда использовать `textContent` вместо `innerHTML` при вставке пользовательского контента
- Санировать контент через DOMPurify если HTML-вставка неизбежна
- Escaping контекстно-зависимый: HTML-entities в HTML-контексте, JavaScript-escape в JS-контексте

> [!important]
> CSP - это defence-in-depth, последняя линия защиты, а не замена санированию. Если у вас есть innerHTML с пользовательскими данными, никакой CSP не защитит от DOM XSS если скрипт уже на странице с разрешённым 'self'.

**Почему `textContent` безопаснее:** `textContent` присваивает значение как текстовый узел в DOM, не проходя HTML-парсинг. `<script>` будет отображаться как текст, а не исполняться.

---

### 3. CSRF - механика атаки, SameSite cookies, CSRF tokens

**CSRF (Cross-Site Request Forgery)** - атакующий заставляет браузер жертвы выполнить нежелательный запрос к сайту, где жертва аутентифицирована. Браузер автоматически прикрепляет куки к кросс-доменному запросу.

**Механика:** Пользователь залогинен на `bank.com`. Атакующий размещает на `evil.com` форму `<form action="https://bank.com/transfer" method="POST">` с скрытыми полями и автосабмитом. Браузер отправляет куки `bank.com` вместе с запросом.

```html
<!-- На evil.com -->
<form action="https://bank.com/transfer" method="POST" id="csrf">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.getElementById('csrf').submit();</script>
```

**Защита:**
- **SameSite cookies**: `SameSite=Strict` блокирует отправку кук при кросс-сайтовых запросах. `SameSite=Lax` разрешает для top-level navigation (ссылкам), но блокирует для POST-форм с других сайтов - разумный default
- **CSRF tokens**: сервер генерирует уникальный токен на сессию, клиент отправляет его в заголовке или теле запроса. Атакующий не может прочитать токен из-за SOP
- **Double-submit cookie**: токен дублируется в куке и в теле/заголовке запроса - сервер сравнивает их. Не требует хранения токена на сервере, но менее надёжен при subdomain takeover
- **Custom header requirement**: API требует кастомный заголовок (`X-Requested-With: XMLHttpRequest`) - браузеры не позволяют кросс-доменным формам устанавливать кастомные заголовки без CORS

> [!important]
> С современными браузерами `SameSite=Lax` (дефолт с Chrome 80+) покрывает большинство CSRF-векторов. Однако для защиты от уязвимостей на поддоменах и старых браузерах комбинируйте с CSRF-токенами.

---

### 4. CORS - preflight, simple requests, credentials

**CORS (Cross-Origin Resource Sharing)** - механизм, позволяющий серверу ослабить Same-Origin Policy для конкретных origin'ов. Браузер проверяет ответные заголовки и решает, разрешить ли доступ JS к ответу.

**Simple requests** - GET/POST/HEAD с определёнными заголовками (`Accept`, `Accept-Language`, `Content-Language`, `Content-Type: text/plain | multipart/form-data | application/x-www-form-urlencoded`). Не требуют preflight.

**Preflight** - OPTIONS запрос, отправляемый браузером перед основным запросом если тот не "simple" (например, `Content-Type: application/json` или кастомный заголовок). Сервер отвечает заголовками `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age`.

```http
OPTIONS /api/data HTTP/1.1
Origin: https://example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: X-Custom-Header

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, PUT, DELETE
Access-Control-Allow-Headers: X-Custom-Header
Access-Control-Max-Age: 86400
```

**Credentials:** По умолчанию кросс-доменные запросы не отправляют куки. Для включения: клиент `fetch(url, { credentials: 'include' })` или `xhr.withCredentials = true`, сервер `Access-Control-Allow-Credentials: true`. При этом `Access-Control-Allow-Origin` не может быть `*`.

**Почему `*` + credentials несовместимы:** Если бы сервер мог разрешить `*` с credentials, любой сайт мог бы читать аутентифицированные ответы. Браузер принудительно требует конкретный origin.

> [!info]
> Preflight существует чтобы старые сервера, не знающие о CORS, не могли быть атакованы через cross-origin DELETE или PUT запросы, которые они не ожидают.

---

### 5. Content-Security-Policy (CSP)

**CSP** - HTTP-заголовок (или `<meta>`), определяющий какие ресурсы и откуда браузер может загружать. Белый список источников.

**Основные директивы:**
- `default-src` - fallback для всех неуказанных директив
- `script-src` - разрешённые источники скриптов (и inline-скриптов при `'unsafe-inline'`)
- `style-src` - источники стилей
- `img-src`, `font-src`, `connect-src`, `frame-src`, `media-src`
- `frame-ancestors` - кто может встраивать страницу в iframe (заменяет X-Frame-Options)
- `form-action` - куда можно отправлять формы

**Nonce-based подход:** Сервер генерирует случайный nonce для каждого ответа, вставляет его в CSP-заголовок и в атрибут `<script nonce="...">`. Легитимные скрипты выполняются, инлайн-инъекции - нет.

```http
Content-Security-Policy: script-src 'nonce-r4nd0m' 'strict-dynamic'; style-src 'self'; img-src *
```

```html
<script nonce="r4nd0m">console.log('allowed');</script>
```

**Hash-based подход:** В CSP указывается SHA-256 хеш разрешённого инлайн-скрипта. Не требует генерировать nonce на сервере, но при любом изменении скрипта хеш надо обновить.

```http
Content-Security-Policy: script-src 'sha256-abc123...' 'strict-dynamic'
```

**`'strict-dynamic'`** - разрешает скрипту, загруженному через nonce/hash, создавать другие скрипты (например, через `document.createElement('script')`). Без этого динамически созданные легитимные скрипты блокируются.

**Report-only:** `Content-Security-Policy-Report-Only` позволяет собирать отчёты о нарушениях не блокируя их:
```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
```

> [!important]
> CSP - мощный defence-in-depth инструмент, но его сложно правильно сконфигурировать на существующем приложении. Начинайте с Report-Only, собирайте отчёты, итеративно ужесточайте политику.

---

### 6. Same-Origin Policy (SOP) + COOP/COEP

**Same-Origin Policy** - фундаментальный механизм безопасности браузера, предотвращающий доступ документа или скрипта из одного origin к ресурсам другого origin.

**Что такое origin:** `scheme + host + port`. `https://example.com:443` и `http://example.com:80` - разные origin из-за scheme. `https://example.com` и `https://sub.example.com` - разные из-за host.

**Что ограничивает SOP:**
- Доступ к DOM другого окна/iframe (cross-origin iframe нечитаем)
- AJAX-запросы - ответ читаем только с того же origin (CORS ослабляет это)
- Доступ к localStorage, cookies, IndexedDB - разделены по origin
- Шрифты через `@font-face` (по умолчанию)

**Что НЕ ограничивает SOP (по историческим причинам):**
- `<script>`, `<img>`, `<video>`, `<link>`, `<iframe>` могут загружать кросс-доменные ресурсы (но их содержимое недоступно через JS, только отображение)

> [!info]
> SOP существует не просто так - без него любой сайт мог бы через fetch читать ваш почтовый ящик на gmail.com, или через iframe + DOM-доступ читать страницу банка, где вы залогинены.

**Современное расширение:** `Cross-Origin-Opener-Policy (COOP)` и `Cross-Origin-Embedder-Policy (COEP)` позволяют процессной изоляции origin'ов и включают мощные фичи вроде `SharedArrayBuffer`.

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**COOP** (`Cross-Origin-Opener-Policy`) контролирует, может ли страница иметь доступ к `window.opener` при открытии кросс-доменного окна. `same-origin` изолирует страницу в отдельном browsing context - кросс-доменные окна не получают ссылку на opener. Это предотвращает Spectre-подобные атаки через shared memory.

**COEP** (`Cross-Origin-Embedder-Policy`) требует, чтобы все кросс-доменные ресурсы были явно разрешены через CORS или CORP. `require-corp` означает: каждый кросс-доменный ресурс должен иметь заголовок `Cross-Origin-Resource-Policy: same-site` или `cross-origin`, либо быть загружен через CORS. Без COEP браузер не даст доступ к `SharedArrayBuffer` и `performance.measureUserAgentSpecificMemory()`.

Вместе COOP + COEP создают полностью изолированный origin - это требование для мощных API, работающих с общей памятью между воркерами.

---

### 7. HTTPS/TLS handshake: 1.3 vs 1.2, certificate chain, HSTS

**TLS handshake (1.3):** Клиент отправляет ClientHello с поддерживаемыми cipher suites и случайным числом. Сервер отвечает ServerHello, выбирая cipher suite, плюс свой случайный number, и отправляет сертификат с публичным ключом. Обе стороны вычисляют общий секрет через (EC)DHE. В TLS 1.3 весь handshake занимает 1-RTT (против 2-RTT в TLS 1.2).

**TLS 1.2 vs 1.3 ключевые отличия:**
- TLS 1.2: 2-RTT handshake, поддерживает устаревшие cipher suites (RSA key exchange, CBC mode, SHA-1)
- TLS 1.3: 1-RTT handshake, удалены все небезопасные алгоритмы, обязательный (EC)DHE (forward secrecy), 0-RTT resumption через PSK (pre-shared key)
- TLS 1.3 шифрует больше данных handshake - в 1.2 ServerHello и сертификат были в открытом виде, в 1.3 они зашифрованы

**Цепочка доверия (Chain of Trust):** Сертификат сайта подписан Intermediate CA, Intermediate CA подписан Root CA. Root CA встроены в браузер/ОС (trust store). Проверка идёт снизу вверх: если корень доверенный, вся цепочка доверенная.

**Сертификаты:**
- **DV (Domain Validation):** проверка только владения доменом
- **OV (Organization Validation):** проверка организации
- **EV (Extended Validation):** расширенная проверка (зелёная плашка, сейчас браузеры убирают)

**Почему HTTPS важен кроме шифрования:** HTTPS обеспечивает три свойства - конфиденциальность (шифрование), целостность (MAC, защита от модификации), и аутентификацию (удостоверяет, что клиент общается с настоящим сервером).

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

> [!important]
> HSTS заголовок заставляет браузер всегда использовать HTTPS для домена, даже если пользователь ввёл http:// - защита от SSL-stripping атак. Для включения в HSTS preload list (встроенную в браузеры) домен должен подать заявку на hstspreload.org.

---

### 8. JWT: HS256 vs RS256, refresh flow, полный цикл создания и проверки

**JWT (JSON Web Token)**  -  компактный URL-safe формат передачи claims между сторонами. Состоит из трёх частей через точку: `header.payload.signature`.

```
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjJ9.signature

header:  { "alg": "RS256", "typ": "JWT" }
payload: { "sub": "123", "iat": 1516239022, "exp": 1516242622 }
```

**HS256 vs RS256  -  ключевой выбор архитектуры:**

| | HS256 (HMAC + SHA-256) | RS256 (RSA + SHA-256) |
|---|---|---|
| Тип ключа | Один симметричный секрет | Пара: приватный + публичный ключ |
| Кто подписывает | Auth-сервер (знает секрет) | Auth-сервер (приватным ключом) |
| Кто проверяет | Любой, у кого есть секрет | Любой с публичным ключом |
| Ротация ключей | Сложно  -  нужно синхронизировать секрет между всеми сервисами | Просто  -  новый приватный ключ, публичный через JWKS-эндпоинт |
| Где применять | Монолит, один сервис | Микросервисы, распределённые системы |

```js
// HS256  -  подпись и проверка ОДНИМ секретом
const secret = process.env.JWT_SECRET
const token = jwt.sign({ sub: '123' }, secret, { algorithm: 'HS256' })
const payload = jwt.verify(token, secret)

// RS256  -  подпись ПРИВАТНЫМ, проверка ПУБЛИЧНЫМ
const privateKey = fs.readFileSync('private.pem')
const publicKey = fs.readFileSync('public.pem')
const token = jwt.sign({ sub: '123' }, privateKey, { algorithm: 'RS256' })
const payload = jwt.verify(token, publicKey)
```

> [!important]
> В микросервисной архитектуре используйте RS256. Auth-сервис подписывает токен приватным ключом, а все остальные сервисы проверяют публичным (через JWKS endpoint: `GET /.well-known/jwks.json`). Никто кроме auth-сервиса не знает приватный ключ  -  компрометация одного сервиса не позволяет подделывать токены.

**Полный цикл создания и использования токенов:**

```
┌─ ПОЛЬЗОВАТЕЛЬ ─┐     ┌─ AUTH СЕРВЕР ─┐     ┌─ API СЕРВЕР ─┐
│                 │     │                │     │               │
│ 1. POST /login  │────>│ 2. Проверка    │     │               │
│    (email+pass) │     │    пароля      │     │               │
│                 │     │                │     │               │
│                 │     │ 3. Генерация:  │     │               │
│                 │     │  access_token  │     │               │
│                 │     │  (RS256, 15m)  │     │               │
│                 │     │  refresh_token │     │               │
│                 │     │  (opaque/256b) │     │               │
│                 │     │                │     │               │
│ 4. access_token │<────│  (в теле)      │     │               │
│    refresh_token│<────│  (HttpOnly     │     │               │
│    (Set-Cookie) │     │   Secure       │     │               │
│                 │     │   SameSite)    │     │               │
│                 │     │                │     │               │
│ 5. GET /api/me  │─────────────────────────>│ 6. Проверка:  │
│ Authorization:  │                          │  - signature │
│ Bearer <access> │                          │  - exp       │
│                 │                          │  - issuer    │
│                 │     ┌────────────────────│  - audience  │
│                 │     │  JWKS endpoint     │               │
│                 │     │  GET /.well-known/ │               │
│                 │     │  jwks.json         │               │
│                 │     └────────────────────│               │
│                 │                          │               │
│ 7. 200 + данные │<─────────────────────────│               │
│                 │     │                │     │               │
│                                      │     │               │
│ [15 минут спустя  -  access истёк]     │     │               │
│                                      │     │               │
│ 8. GET /api/me  │─────────────────────────>│ 9. 401        │
│                 │     │                │     │               │
│ 10. POST/refresh│────>│ 11. Проверка:  │     │               │
│ (cookie авто)   │     │  refresh_token │     │               │
│                 │     │  (из HttpOnly  │     │               │
│                 │     │   cookie)      │     │               │
│                 │     │                │     │               │
│                 │     │ 12. Новый      │     │               │
│                 │     │  access_token  │     │               │
│                 │     │  + при         │     │               │
│                 │     │  token         │     │               │
│                 │     │  rotation      │     │               │
│                 │     │  новый refresh │     │               │
│                 │     │                │     │               │
│ 13. access_token │<────│  (в теле)      │     │               │
│    refresh_token │<────│  (Set-Cookie)  │     │               │
│                 │     │                │     │               │
│ 14. GET /api/me │─────────────────────────>│ 15. 200       │
│ (с новым access)│                          │               │
└─────────────────┘     └────────────────┘     └───────────────┘
```

**По шагам:**

1. Пользователь логинится  -  отправляет email/password
2. Auth-сервер проверяет учётные данные
3. Генерирует **access_token** (RS256, 15 минут): `{ sub: userId, iat, exp, iss, aud }` + **refresh_token** (opaque строка 256 бит случайных данных, или JWT с долгим сроком)
4. Access token возвращается в теле ответа (frontend хранит в памяти/closure). Refresh token  -  в HttpOnly Secure SameSite cookie
5. Frontend шлёт access token в заголовке `Authorization: Bearer <token>` с каждым API-запросом
6. API-сервер проверяет token: загружает публичный ключ с JWKS-эндпоинта (`/.well-known/jwks.json`), проверяет подпись, сверяет `exp`, `iss`, `aud`
7. Если всё OK  -  возвращает данные
8-9. Через 15 минут access token истекает  -  сервер возвращает 401
10-11. Frontend (или axios-интерсептор) молча шлёт POST /refresh  -  браузер автоматически прикрепляет HttpOnly cookie с refresh token
12. Auth-сервер проверяет refresh token. При **token rotation**  -  старый refresh token инвалидируется, выдаётся НОВЫЙ refresh token (защита от replay: если украденный refresh использован повторно, инвалидируется вся сессия)
13. Новые токены возвращаются: access в теле, refresh в Set-Cookie
14-15. Повтор оригинального запроса с новым access token

**Token Rotation  -  защита от кражи refresh token:**

```js
// На сервере: при использовании refresh token
async function refreshTokens(oldRefreshToken) {
  const session = await db.findSessionByRefreshToken(oldRefreshToken)

  if (!session) {
    // Refresh token не найден  -  возможно, уже был использован злоумышленником
    // Инвалидируем ВСЕ сессии пользователя, заставляем перелогиниться
    await db.invalidateAllUserSessions(session.userId)
    throw new Error('Token reuse detected  -  all sessions revoked')
  }

  if (session.refreshTokenUsed) {
    // Refresh token использован ПОВТОРНО  -  это атака!
    // Владелец использовал оригинальный, злоумышленник пытается использовать копию
    await db.invalidateAllUserSessions(session.userId)
    throw new Error('Token replay attack detected')
  }

  // Помечаем старый как использованный и создаём новый
  await db.markRefreshTokenUsed(oldRefreshToken)
  const newTokens = await generateTokenPair(session.userId)
  return newTokens
}
```

**Где хранить access token на фронтенде:**

| Место | Защита от XSS | Защита от CSRF | Сохраняется после перезагрузки |
|---|---|---|---|
| HttpOnly cookie | ✅ (JS не читает) | ❌ (нужен SameSite + CSRF token) | ✅ |
| localStorage | ❌ (JS читает) | ✅ (не отправляется авто) | ✅ |
| sessionStorage | ❌ (JS читает) | ✅ | ❌ (только вкладка) |
| Closure variable | ✅ (вне DOM) | ✅ | ❌ |
| Service Worker | ✅ | ✅ | ✅ |

Рекомендация: access token  -  в памяти (closure), refresh token  -  в HttpOnly Secure SameSite=Strict cookie. Никогда не храните refresh token в localStorage.

**Алгоритм `none` атака:** если сервер доверяет `alg` из header, злоумышленник может отправить JWT с `"alg": "none"` и произвольным payload  -  подпись не проверяется. Всегда игнорируйте `alg` из header, используйте захардкоженный список допустимых алгоритмов.

---

### 9. OAuth 2.0 / PKCE flow

**OAuth 2.0** - протокол делегирования авторизации (не аутентификации!). Позволяет приложению получить ограниченный доступ к ресурсам пользователя без передачи пароля.

**Authorization Code Flow (рекомендуемый):**
1. Браузер редиректится на `/authorize` Authorization Server с `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`
2. Пользователь логинится и даёт согласие
3. Authorization Server редиректит обратно с `code` (authorization code, одноразовый)
4. Бэкенд обменивает `code + code_verifier` на `access_token + refresh_token` через POST `/token`

**Почему этот flow безопаснее Implicit:** Access token не появляется в URL/fragment браузера, не сохраняется в browser history. Код одноразовый, привязан к client_secret, требует участия бэкенда.

**Implicit Flow (DEPRECATED):** Токен возвращался прямо во fragment URL (`#access_token=...`). Уязвим к token leakage через Referer header, browser history, и JS на любой странице где приложение открыто в iframe.

**PKCE (Proof Key for Code Exchange):**
```javascript
// Генерация code_verifier и code_challenge на клиенте
const codeVerifier = base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
const codeChallenge = base64URLEncode(await sha256(codeVerifier));
// code_challenge отправляется в /authorize, code_verifier - в /token
```
PKCE предотвращает authorization code interception - даже если код украден, без `code_verifier` обменять на токен невозможно. Обязателен для мобильных/SPA приложений.

**OpenID Connect (OIDC):** надстройка над OAuth 2.0 для аутентификации. Добавляет `id_token` (JWT с информацией о пользователе) и эндпоинт `/userinfo`.

> [!important]
> Для SPA всегда используйте Authorization Code Flow + PKCE, никогда не Implicit Flow. Токены доступа храните в памяти (closure variable), не в localStorage, если есть угроза XSS.

---

### 10. Clickjacking + X-Frame-Options

**Clickjacking** - атака, при которой сайт жертвы встраивается в прозрачный iframe поверх безобидной страницы. Пользователь думает, что кликает по кнопке на видимой странице, а на самом деле кликает по скрытой кнопке в iframe.

**Защита через заголовки:**
- `X-Frame-Options: DENY` - полностью запрещает встраивание в iframe
- `X-Frame-Options: SAMEORIGIN` - разрешает только своим страницам
- `X-Frame-Options: ALLOW-FROM https://trusted.com` - устарел, не поддерживается в Chrome

**CSP frame-ancestors (современный подход):**
```http
Content-Security-Policy: frame-ancestors 'self' https://trusted.com
```
`frame-ancestors` гибче, чем `X-Frame-Options`: поддерживает несколько источников, использует тот же синтаксис CSP. Используйте его, а `X-Frame-Options` оставляйте для старых браузеров как fallback.

> [!important]
> Всегда выставляйте оба заголовка. `X-Frame-Options: DENY` как fallback для IE/старых Safari, и `frame-ancestors 'none'` в CSP для современных браузеров.

---

### 11. SRI (Subresource Integrity)

**SRI** - атрибут `integrity` на `<script>` и `<link>`, содержащий base64-encoded криптографический хеш. Браузер сверяет хеш загруженного ресурса с указанным, и если они не совпадают - отказывается выполнять/применять.

```html
<script src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>
```

**Зачем:** CDN может быть скомпрометирован. Если атакующий заменит jQuery на CDN злонамеренной версией, SRI-хеши не совпадут и скрипт не выполнится.

**Генерация хеша:**
```bash
openssl dgst -sha384 -binary lib.js | openssl base64 -A
# или
cat lib.js | openssl dgst -sha384 -binary | base64
```

**Важно:** При использовании SRI с кросс-доменным CDN обязателен `crossorigin="anonymous"` - без него CORS не разрешит браузеру загрузить ресурс для проверки integrity на cross-origin ресурсах.

> [!info]
> SRI работает только для ресурсов, которые вы контролируете (знаете хеш версии). Для динамически генерируемого контента на сторонних CDN не применим. Комбинируйте SRI с CSP `require-sri-for` директивой.

---

### 12. HTTP Caching: Cache-Control, ETag, stale-while-revalidate

**Уровни кеширования:** Browser cache (private) → Proxy cache (shared) → CDN cache → Origin server.

**Cache-Control директивы:**
- `max-age` - сколько секунд ресурс считается свежим
- `s-maxage` - то же для shared cache (CDN), перекрывает max-age
- `no-cache` - требует валидацию перед использованием (с ETag/Last-Modified), но кеш можно хранить
- `no-store` - полный запрет кеширования (чувствительные данные)
- `must-revalidate` - после истечения max-age обязательна валидация, нельзя отдавать stale
- `public` - можно кешировать даже аутентифицированные ответы
- `private` - только browser cache (персональные данные)
- `immutable` - ресурс никогда не изменится, браузер не делает conditional request даже при reload

**Conditional requests (валидация):**
- `ETag` + `If-None-Match` - сервер генерирует хеш контента. Если не изменился - `304 Not Modified` без тела
- `Last-Modified` + `If-Modified-Since` - сравнение по времени. Грубее чем ETag (время может совпасть при изменениях)

```
Клиент: GET /style.css
Сервер:  200 OK
         ETag: "abc123"
         Cache-Control: max-age=3600

// Через час (max-age истёк):
Клиент: GET /style.css
         If-None-Match: "abc123"
Сервер:  304 Not Modified  // ресурс не изменился
         Cache-Control: max-age=3600  // продляем свежесть
```

**stale-while-revalidate:** Разрешает отдавать stale (устаревший) контент клиенту, пока асинхронно запрашивается свежий. Отличный UX компромисс: мгновенный ответ + обновление в фоне.

```http
Cache-Control: max-age=3600, stale-while-revalidate=86400
```

> [!important]
> Для статических ресурсов с хешем в имени файла (`app.abc123.js`) используйте `Cache-Control: max-age=31536000, immutable`. Для HTML-страниц - `no-cache` с ETag, чтобы всегда валидировать, но экономить трафик. Без immutable браузер делает conditional request при Navigate Reload даже для хешированных ресурсов.

---

### 13. HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)

**HTTP/1.1 проблемы:**
- Head-of-Line (HOL) blocking на уровне соединения - один медленный запрос блокирует все следующие
- 6-8 параллельных соединений на домен (browser connection limit) для обхода HOL - создаёт overhead
- Текстовый протокол, многословные заголовки (несжатые повторы Cookie, User-Agent)

**HTTP/2 (SPDY-основа):**
- **Мультиплексирование (multiplexing):** множество стримов в одном TCP-соединении. Запросы не ждут друг друга, ответы приходят в любом порядке
- **Header compression (HPACK):** заголовки сжимаются и кешируются между запросами, особенно эффективно для повторяющихся Cookie
- **Server Push:** сервер может отправить ресурсы до их запроса (CSS, JS), но на практике сложен и деприкейтится в Chrome
- **Бинарный протокол:** более эффективный парсинг, меньше байт
- **Stream prioritization:** клиент может задавать приоритеты стримов (weight, dependency), браузер управляет порядком отдачи

**HTTP/2 проблема:** TCP HOL blocking - потеря одного TCP-пакета блокирует все стримы (т.к. TCP гарантирует порядок доставки). HTTP/3 решает это полностью, переходя на UDP.

**HTTP/3 (QUIC):**
- Основан на UDP с QUIC вместо TCP+TLS
- Полностью устраняет HOL blocking - потеря пакета влияет только на один стрим
- 0-RTT возобновление соединения (для повторных визитов)
- Встроенное шифрование (TLS 1.3 встроен в QUIC)
- Connection migration - соединение не рвётся при смене IP (WiFi → 4G)
- Улучшенная congestion control: QUIC реализует собственную логику управления потоком в userspace, не зависит от ОС. Поддерживает BBRv2 и другие современные алгоритмы
- Faster handshake: QUIC объединяет транспортный и криптографический handshake в один этап. TLS 1.3 handshake идёт параллельно с установлением QUIC соединения
- No middlebox interference: TCP часто ломается из-за агрессивных NAT и фаерволов (особенно в мобильных сетях). UDP более стабилен, QUIC сам обеспечивает надёжность

```http
# Альтернативный сервис - сервер сообщает о доступности HTTP/3
Alt-Svc: h3=":443"; ma=86400
```

**QUIC tradeoffs:**
- UDP блокируется некоторыми корпоративными фаерволами (HTTP/3 fallback на TCP)
- Серверная инфраструктура должна поддерживать UDP (не все load balancers умеют)
- Отладка сложнее - стандартные TCP-тулзы (tcpdump, Wireshark) не работают без ключей шифрования

> [!info]
> HTTP/2 даёт основной выигрыш без изменения кода - достаточно включить HTTPS. HTTP/3 требует поддержки UDP на уровне инфраструктуры и даёт прирост на нестабильных сетях и мобильных устройствах. По данным Google, HTTP/3 улучшает p90 latency на 3-10% в мобильных сетях.

---

### 14. Cookies: Secure, HttpOnly, SameSite, Domain, Path

**Cookie атрибуты:**

**Secure:** Кука отправляется только по HTTPS. Критически важно для кук с sensitive данными. Без этого атакующий через MITM на публичной WiFi может перехватить куку.

**HttpOnly:** Кука недоступна через `document.cookie` в JavaScript. Защита от XSS - даже если атакующий инжектирует скрипт, он не может украсть такую куку.

**SameSite:**
- `Strict` - кука никогда не отправляется при кросс-сайтовых запросах, даже при клике по ссылке. Максимальная защита от CSRF, но пользователь не будет аутентифицирован при переходе с внешнего сайта
- `Lax` - кука отправляется при top-level navigation (ссылках) GET-методом, но не в POST-формах и iframe. Оптимальный баланс UX и безопасности, дефолт в Chrome
- `None` - кука отправляется во всех кросс-сайтовых запросах. Обязательно требует `Secure`

**Domain:** Если не указан, кука привязана к точному хосту. `Domain=example.com` делает куку доступной на всех поддоменах (включая `app.example.com`, `api.example.com`). Чем уже scope, тем безопаснее.

**Path:** Ограничивает куку определённым путём на сервере. `Path=/admin` - кука отправляется только на `/admin/*`. Не является security mechanism - Same-Origin Policy работает на уровне origin, не path.

```http
Set-Cookie: session_id=abc123; Secure; HttpOnly; SameSite=Lax; Path=/
Set-Cookie: refresh_token=xyz789; Secure; HttpOnly; SameSite=Strict; Path=/api/auth
```

**Cookie prefixes (дополнительный уровень защиты):**
- `__Host-` - кука должна быть Secure, без Domain атрибута, Path=/
- `__Secure-` - кука должна быть Secure

```http
Set-Cookie: __Host-session=abc123; Secure; HttpOnly; SameSite=Lax; Path=/
```

> [!important]
> Разделяйте access token и refresh token: access - SameSite=Lax для удобства (пользователь видит себя залогиненным при переходе по ссылке), refresh - SameSite=Strict на узкий Path=/api/auth (только для token refresh эндпоинта, атакующий не может подделать запрос на обновление).

---

### 15. Service Workers: lifecycle, caching strategies, offline

**Service Worker (SW)** - JS-файл, работающий в фоновом потоке браузера, выступающий как программируемый прокси между страницей и сетью. Не имеет доступа к DOM, работает только на HTTPS (кроме localhost).

**Жизненный цикл:**
1. **Registration:** `navigator.serviceWorker.register('/sw.js')`
2. **Install:** событие `install` - идеальное время для предкеширования критических ресурсов. `event.waitUntil()` продлевает фазу install
3. **Waiting:** SW установлен, но старый SW активен. `self.skipWaiting()` форсирует немедленную активацию
4. **Activate:** событие `activate` - очистка старых кешей. `clients.claim()` заставляет SW контролировать все открытые страницы без перезагрузки
5. **Fetch:** SW перехватывает все сетевые запросы страницы - может вернуть из кеша, модифицировать запрос, или пропустить в сеть

```javascript
// sw.js - Cache First стратегия для статики
const CACHE_NAME = 'v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/', '/styles.css', '/app.js'])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request)
    )
  );
});
```

**Стратегии кеширования:**
- **Cache First:** статика (шелы приложения)
- **Network First:** API-ответы, которые важна свежесть
- **Stale While Revalidate:** UX баланс - мгновенный кеш + фоновое обновление
- **Network Only:** некешируемые данные (платёжные)
- **Cache Only:** оффлайн-fallback страницы

> [!important]
> Service Worker - мощный инструмент, но сломанный SW может "закирпичить" сайт для пользователя (старый код кеширует невалидный ответ, и никакие перезагрузки не помогут). Всегда: (1) версионируйте кеши, (2) оставляйте no-cache для HTML, (3) тестируйте обновление SW между версиями, (4) реализуйте кнопку "force update" при детекте версионного несоответствия.

---

### 16. CDN: edge servers, cache invalidation, edge computing

**CDN (Content Delivery Network)** - географически распределённая сеть серверов (edge servers), кеширующих контент ближе к пользователю.

**Как работает маршрутизация:**
1. DNS резолвит домен на IP ближайшего edge (anycast routing или geo-DNS)
2. Edge-сервер проверяет кеш: HIT (возвращает из кеша) или MISS (запрашивает с origin, кеширует, возвращает)
3. Контент распределяется по tiered cache: Edge → Regional → Origin - уменьшает нагрузку на origin

**Cache invalidation стратегии:**
- **Purge:** активное удаление из кеша (через API, обычно ~несколько секунд). `curl -X PURGE https://cdn.example.com/image.jpg`
- **TTL-based:** контент живёт в кеше заданное время, затем автоматически запрашивается свежий
- **Cache key versioning:** `style.v2.css` - смена имени при изменении, старый URL истечёт сам
- **Surrogate keys (Fastly):** тэговое инвалидирование - инвалидировать все ресурсы с тэгом `post-42`

**Типичная CDN-архитектура для SPA:**
```http
# HTML - не кешируем на CDN (динамический контент)
Cache-Control: no-cache
CDN-Cache-Control: no-cache

# Статика с хешем - кешируем навсегда
Cache-Control: public, max-age=31536000, immutable

# API ответы - короткий TTL
Cache-Control: public, max-age=60, s-maxage=300
Surrogate-Key: post-42 category-news
```

**Edge computing:** Современные CDN позволяют запускать код на edge (Cloudflare Workers, Fastly Compute, Lambda@Edge) - A/B тестирование, аутентификация, гео-редиректы выполняются максимально близко к пользователю.

> [!important]
> Ключевой принцип: HTML страница - no-cache (всегда валидировать свежесть ETag'ом), статические ассеты с content-hash в имени - immutable + долгий max-age. Смешивание этих подходов - основная причина проблем с деплоем ("старый HTML ссылается на старый JS, новый JS уже задеплоен").

---

### 17. DNS: resolution, record types, dns-prefetch, DoH

**Процесс разрешения DNS:**

1. Браузер проверяет свой DNS-кеш (chrome://net-internals/#dns)
2. Проверка системного кеша ОС
3. Проверка файла `/etc/hosts` (или эквивалент)
4. Запрос к DNS-резолверу (обычно роутер или DNS-сервер провайдера)
5. Резолвер рекурсивно опрашивает DNS-иерархию:
   - Root DNS сервер → возвращает TLD-сервер (`.com`)
   - TLD-сервер → возвращает authoritative сервер домена
   - Authoritative сервер → возвращает IP-адрес

**Типы записей DNS:**
- **A** - IPv4 адрес: `example.com. 300 IN A 93.184.216.34`
- **AAAA** - IPv6 адрес
- **CNAME** - alias на другое имя: `www.example.com → example.com`
- **MX** - почтовый сервер
- **TXT** - произвольный текст (SPF, DKIM, domain verification)
- **NS** - authoritative name server
- **SOA** - Start of Authority, информация о зоне (serial, refresh, retry intervals)
- **SRV** - service location (используется для VoIP, XMPP, и discovery сервисов)

**Время резолва и оптимизации:**
- `dns-prefetch` в `<link rel="dns-prefetch" href="//api.example.com">` - браузер начинает DNS-резолвинг заранее, до того как понадобится
- `preconnect` включает DNS + TCP + TLS
- Каждый новый домен в критическом пути стоит ~50-100ms на резолвинг

**DNS over HTTPS (DoH):**
DoH шифрует DNS-запросы через HTTPS, предотвращая:
- Просмотр DNS-трафика провайдером (privacy)
- DNS spoofing и manipulation (security)
- Блокировку сайтов на уровне DNS (censorship circumvention)

```javascript
// Браузерная настройка DoH (Chrome/Firefox)
// Настройки → Privacy & Security → DNS over HTTPS
// Или через DNS-провайдера: Cloudflare (1.1.1.1), Google (8.8.8.8)
```

**DoH tradeoffs:**
- Плюсы: приватность, защита от MITM, обход DNS-блокировок
- Минусы: корпоративные DNS-фильтры обходятся (проблема для IT-департаментов), дополнительная задержка HTTPS handshake поверх DNS, зависимость от конкретного DoH-провайдера

**DNS over TLS (DoT):** Альтернатива DoH - шифрует DNS через TLS на порту 853. Работает на уровне ОС (не браузера), но менее распространён.

> [!info]
> Минимизируйте количество уникальных доменов на странице, используйте `preconnect` для критических third-party доменов. DoH повышает приватность, но не заменяет HTTPS - это защита только DNS-запросов, не всего трафика.

---

### 18. REST vs GraphQL vs gRPC

**REST (Representational State Transfer):**
- Множество эндпоинтов, каждый возвращает фиксированную структуру данных
- Under-fetching: данных недостаточно → запросы к нескольким эндпоинтам
- Over-fetching: данных слишком много, клиент использует только часть полей
- HTTP-кеширование (CDN, браузер) работает из коробки
- Простая отладка через curl, browser devtools

**GraphQL:**
- Один эндпоинт `/graphql`, клиент запрашивает ровно то что нужно
- Решает over-fetching и under-fetching - один запрос → ровно нужные данные
- Сложный кеширование на клиенте (Apollo InMemoryCache, нормализация по `__typename` + `id`)
- N+1 проблема на сервере требует DataLoader на бэкенде
- Один большой query со множеством резолверов может быть медленнее REST-эндпоинта с SQL JOIN
- Сложнее CDN-кеширование (POST-запросы по умолчанию не кешируются, нужен persisted queries/Automatic Persisted Queries)

**gRPC (gRPC Remote Procedure Calls):**
- Protocol Buffers (бинарный формат) - компактнее JSON
- HTTP/2 транспорт с мультиплексированием стримов
- Стриминг из коробки (unary, server-streaming, client-streaming, bidi)
- Строгая контрактная типизация - `.proto` файлы генерируют клиентский и серверный код
- В браузере ограничен: требует gRPC-Web прокси (Envoy), так как браузерный fetch не поддерживает полный HTTP/2

```protobuf
// Пример proto-файла
service UserService {
  rpc GetUser (UserRequest) returns (UserResponse);
}

message UserRequest {
  int32 id = 1;
}
```

> [!info]
> Выбор для фронтенда: REST для публичных API и контента (кеширование, простота), GraphQL для сложных UI с вариативными данными (админ-панели, дашборды), gRPC для внутренних сервисов и высоконагруженных real-time приложений (через gRPC-Web для браузера).

---

### 19. WebSockets: handshake, frames, reconnection, vs SSE

**WebSocket** - полнодуплексный протокол поверх TCP для постоянного соединения через один сокет. Инициируется HTTP-апгрейдом.

**Handshake (101 Switching Protocols):**
```http
Клиент:
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

Сервер:
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
`Sec-WebSocket-Accept` вычисляется как `base64(sha1(Sec-WebSocket-Key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))`. Эта константа гарантирует, что сервер понимает WebSocket протокол (а не случайный HTTP-сервер).

**Фреймы:** Сообщения разбиваются на фреймы. Каждый фрейм имеет opcode (text, binary, ping, pong, close), FIN-бит (последний фрейм сообщения), MASK-бит (клиент→сервер ВСЕГДА маскируются с XOR, защита от cache poisoning на прокси).

**Reconnection strategies:**
```javascript
class RobustWebSocket {
  constructor(url, maxRetries = 5) {
    this.url = url;
    this.retries = 0;
    this.maxRetries = maxRetries;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onclose = (e) => {
      if (e.code !== 1000) { // не нормальное закрытие
        const delay = Math.min(1000 * 2 ** this.retries, 30000); // exponential backoff
        setTimeout(() => this.connect(), delay);
        this.retries++;
      }
    };
  }
}
```

**WebSockets vs SSE:** WebSockets - bidirectional, сложнее в масштабировании (sticky sessions), собственный протокол. SSE - только сервер→клиент, работает поверх HTTP (прокси/CDN понимают), авто-реконнект из коробки.

**Масштабирование:** WebSocket держит постоянное TCP-соединение. При горизонтальном масштабировании нужен sticky session (балансер направляет конкретного пользователя на тот же сервер) или Redis pub/sub для кросс-серверной коммуникации.

> [!important]
> WebSocket не дружит с HTTP/2 напрямую (для WS используют HTTP/1.1 апгрейд). HTTP/3 решает это лучше. Для надёжных real-time приложений всегда проектируйте reconnection с exponential backoff + jitter и message queue на время разрыва - не теряйте сообщения.

---

### 20. Server-Sent Events (SSE)

**SSE** - однонаправленный (сервер → клиент) протокол для стриминга событий через HTTP. Клиент подключается к эндпоинту, сервер держит соединение открытым и отправляет текстовые события.

```
Клиент:
GET /events HTTP/1.1
Accept: text/event-stream

Сервер:
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

data: {"price": 100.50}

event: alert
data: {"message": "Server restarting"}

id: 42
data: {"status": "ok"}

: это комментарий (игнорируется клиентом, используется для keepalive)
```

**Когда SSE вместо WebSockets:**
- Данные текут только в одном направлении (тикеры, ленты новостей, логи)
- Нужна простая интеграция с HTTP-инфраструктурой (прокси, CDN, аутентификация через куки)
- Требуется авто-реконнект - EventSource API сам переподключается при разрыве, сохраняя Last-Event-Id для возобновления стрима

**Ограничения SSE:**
- Максимум 6 подключений на домен в HTTP/1.1 (разделяется с обычными запросами). HTTP/2 снимает это ограничение через мультиплексирование
- Нет бинарных данных - только UTF-8 текст (можно кодировать в base64, но накладно)
- Нет кастомных заголовков при подключении (EventSource API не поддерживает)

```javascript
const events = new EventSource('/api/events');
events.addEventListener('alert', (e) => {
  const data = JSON.parse(e.data);
  showAlert(data.message);
});
events.onerror = () => {
  // EventSource автоматически попробует переподключиться
  // с заголовком Last-Event-Id для возобновления
};
```

> [!info]
> SSE отлично подходит для real-time фидов и прогресс-баров (загрузка файла, статус сборки). EventSource API встроен в браузер, не требует library. Комбинируйте SSE (чтение стрима) + обычный fetch POST (отправка действий) вместо WebSocket для многих use-case'ов.

---

### 21. TCP handshake: SYN, SYN-ACK, ACK, TFO

**3-way handshake:**
1. Клиент → Сервер: `SYN` (seq=x, флаг SYN)
2. Сервер → Клиент: `SYN-ACK` (seq=y, ack=x+1, флаги SYN, ACK)
3. Клиент → Сервер: `ACK` (seq=x+1, ack=y+1, флаг ACK)

**Почему именно 3-way:** TCP требует согласования начальных sequence numbers для обеих сторон. Каждая сторона подтверждает, что она может и отправлять и принимать:
- После шага 2: клиент знает, что сервер жив и принимает
- После шага 3: сервер знает, что клиент жив и принимает

Двух шагов недостаточно - если клиент отправляет SYN, сервер отвечает SYN-ACK и считает соединение установленным, но клиент мог уже отвалиться (полуоткрытое соединение). Третий ACK подтверждает, что клиент всё ещё на связи.

**SYN flood атака:** Атакующий отправляет множество SYN, игнорирует SYN-ACK. Сервер выделяет ресурсы под полуоткрытые соединения, исчерпывая connection queue. Защита: SYN cookies - сервер не хранит состояние, а кодирует информацию в sequence number.

**TCP Fast Open (TFO):**
TFO позволяет отправлять данные уже в SYN-пакете, минуя необходимость ждать завершения handshake. Это сокращает задержку на 1 RTT для повторных соединений с тем же сервером.

```
# Обычный TCP: SYN → SYN-ACK → ACK → DATA (3 RTT до данных)
# С TFO: SYN + DATA → SYN-ACK + DATA → ACK (1 RTT до данных)
```

Как работает TFO:
1. При первом соединении клиент получает TFO cookie от сервера (в SYN-ACK)
2. При повторном соединении клиент включает cookie в SYN-пакет вместе с данными
3. Сервер валидирует cookie и сразу начинает обрабатывать данные, не дожидаясь ACK

**Ограничения TFO:**
- Работает только для повторных соединений (нужен cookie с предыдущего визита)
- Поддержка зависит от ОС (Linux 3.6+, macOS 10.11+, Windows - ограниченная)
- Размер данных в SYN ограничен (~16KB, зависит от MSS)
- Не все серверы поддерживают TFO

**TLS добавляет 1-2 RTT поверх TCP handshake.** Общее время на установку соединения:
- HTTP/1.1 HTTPS: TCP (1 RTT) + TLS 1.2 (2 RTT) - итого 3 RTT до первого байта
- HTTP/1.1 HTTPS с TLS 1.3: TCP (1 RTT) + TLS 1.3 (1 RTT) - итого 2 RTT
- HTTP/3: QUIC (0-1 RTT, UDP без TCP handshake) - итого 0-1 RTT
- С TFO + TLS 1.3: TCP (0 RTT для данных) + TLS 1.3 (1 RTT) - итого 1 RTT

> [!important]
> Каждый RTT стоит ~20-200ms в зависимости от географической удалённости. TCP+TLS handshake - значительная часть TTFB. `preconnect`, keep-alive и HTTP/2 мультиплексирование критичны для уменьшения этой задержки.

---

### 22. Keep-Alive + connection pooling

**Keep-Alive (HTTP persistent connection):** В HTTP/1.0 соединение закрывалось после каждого запроса-ответа. Keep-Alive позволяет переиспользовать одно TCP-соединение для нескольких запросов - не надо повторять TCP+TLS handshake для каждого ресурса.

```http
Connection: keep-alive
Keep-Alive: timeout=5, max=1000
```

**Как работает connection pooling в браузере:**
- Браузер открывает до 6 соединений на домен (HTTP/1.1)
- Каждое соединение переиспользуется (keep-alive) для нескольких запросов
- Если запросов больше 6 - они ставятся в очередь и ждут освобождения соединения
- В HTTP/2 одно соединение на домен, мультиплексирование убирает необходимость в пуле

**Проблемы keep-alive без правильного таймаута:**
- Сервер держит открытыми тысячи idle соединений → memory pressure
- Load balancer должен уметь отслеживать idle timeout и закрывать их чисто
- На мобильных устройствах каждое открытое TCP-соединение потребляет радио-батарею

> [!info]
> HTTP/2 решает проблему 6-соединений одним мультиплексируемым соединением. Но если доменов несколько - для каждого создаётся отдельное HTTP/2 соединение. `preconnect` всё ещё полезен для установки соединения с критическими third-party доменами заранее.

---

### 23. Long Polling vs Short Polling vs WebSockets vs SSE

**Short Polling:** Клиент регулярно опрашивает сервер с фиксированным интервалом.
```javascript
setInterval(async () => {
  const data = await fetch('/api/updates').then(r => r.json());
  updateUI(data);
}, 5000);
```
Минусы: создаёт нагрузку на сервер даже когда данных нет, задержка до 5 секунд.

**Long Polling:** Клиент делает запрос, сервер держит соединение открытым пока не появятся данные (или timeout), затем клиент сразу делает новый запрос.
```javascript
async function longPoll() {
  const data = await fetch('/api/updates?since=' + lastId).then(r => r.json());
  updateUI(data);
  longPoll(); // немедленно новый запрос
}
```
Плюсы: почти real-time, не создаёт лишних запросов. Минусы: каждый запрос - новый TCP + HTTP overhead, сложно масштабировать (сервер держит много открытых соединений).

**WebSockets:** Постоянное полнодуплексное TCP-соединение. Минимальный overhead после установки, bidirectional, подходит для чатов и игр.

**SSE:** Однонаправленный (сервер→клиент) стрим поверх HTTP. Автореконнект, простота.

**Сравнительная таблица выборов:**

| Критерий | Short Polling | Long Polling | WebSockets | SSE |
|---|---|---|---|---|
| Направление | Client→Server | Client→Server | Bidirectional | Server→Client |
| Задержка | Высокая | Низкая | Минимальная | Низкая |
| Масштабирование | Простое | Сложное | Сложное | Среднее |
| HTTP/2 совместимость | Да | Частично | Нет (отдельный протокол) | Да |
| Авто-реконнект | Н/П | Ручной | Ручной | Встроен |

> [!info]
> Практическое правило: SSE для дашбордов, лент, уведомлений где данные идут сервер→клиент. WebSockets для чатов, коллаборативного редактирования, игр где bidirectional критичен. HTTP polling - для ситуаций где инфраструктура не поддерживает persistent connections.

---

### 24. Critical Rendering Path: DOM → CSSOM → Render Tree → Layout → Paint → Composite

**Critical Rendering Path (CRP)** - последовательность шагов, которые браузер выполняет для превращения HTML, CSS и JS в пиксели на экране.

**Шаги:**
1. **DOM (Document Object Model):** Браузер парсит HTML байты → символы → токены → узлы → DOM-дерево. Парсинг инкрементальный и не блокируется ожиданием картинок, но блокируется синхронными скриптами
2. **CSSOM (CSS Object Model):** Парсинг CSS в дерево стилей. CSS Parser строже чем HTML - ошибка не ломает парсинг, просто пропускает правило. CSS render-blocking: браузер не начнёт рендеринг без CSSOM
3. **Render Tree:** Объединение DOM + CSSOM, только видимые элементы (`display: none` исключены, `visibility: hidden` включены)
4. **Layout (Reflow):** Расчёт геометрии - координаты и размеры каждого элемента в зависимости от viewport
5. **Paint:** Отображение (растеризация) пикселей - цвет, тени, фон, текст
6. **Composite:** Объединение слоёв (изолированных bitmap) в финальное изображение - происходит на GPU

```html
<!-- CSS - render-blocking -->
<link rel="stylesheet" href="styles.css">

<!-- JS - parser-blocking (и render-blocking через ожидание CSSOM) -->
<script src="app.js"></script>

<!-- Атрибуты для неблокирующей загрузки -->
<script async src="analytics.js"></script> <!-- выполняется сразу после загрузки -->
<script defer src="app.js"></script> <!-- выполняется после DOM-парсинга, до DOMContentLoaded -->
```

**Оптимизация CRP:**
- Critical CSS inline в `<head>`, остальные стили асинхронно через `media="print" onload="this.media='all'"`
- `defer` для не-критических скриптов
- Минимизировать глубину DOM (парсинг быстрее, селекторы быстрее)
- Preload критических ресурсов: `<link rel="preload" href="font.woff2" as="font" crossorigin>`

> [!important]
> Critical CSS inline делает First Paint быстрее (не нужно ждать внешние CSS файлы), но увеличивает HTML размер. Обычно применяют для above-the-fold стилей (первые ~14KB - размер одного congestion window в TCP). Для современных SPA подход может отличаться - SSR даёт HTML с контентом, стили стримятся.

---

### 25. Repaint vs Reflow: causes, avoidance

**Reflow (Layout):** Браузер пересчитывает позиции и размеры элементов в документе. Это самая дорогая операция, так как перерасчёт одного элемента может каскадно затронуть всё дерево.

**Что вызывает Reflow:**
- Изменение размеров/позиции (width, height, margin, padding, top, left)
- Изменение содержимого (текст, картинки)
- Добавление/удаление DOM-элементов
- Изменение размера окна
- Изменение шрифта
- Чтение геометрических свойств после записи без батчинга (см. Layout Thrashing)

**Repaint:** Перерисовка пикселей элемента без изменения геометрии. Дешевле, но всё ещё затратно.

**Что вызывает Repaint (но не Reflow):**
- `color`, `background-color`, `box-shadow`, `outline`
- `visibility`
- `border-color`

**Свойства, вообще не затрагивающие Render Tree (только Composite):**
- `transform` (translate, rotate, scale)
- `opacity` (только этот слой composite)
- `filter` (при определённых условиях GPU)

```css
/* ❌ Плохо - вызывает layout + paint */
.box { top: 10px; background: red; }

/* ✓ Хорошо - только composite, GPU-ускоренно */
.box { transform: translateY(10px); }
```

```css
/* contain: строгий layout/reflow изолируется внутри элемента */
.widget {
  contain: layout style; /* reflow внутри .widget не влияет на остальную страницу */
}
```

> [!important]
> Для анимаций используйте ТОЛЬКО `transform` и `opacity`. Они работают на compositor thread (GPU), не блокируют main thread, никогда не вызывают reflow/repaint. Любые другие свойства (`width`, `top`, `margin`) при анимации вызывают layout на каждом кадре = джанк.

---

### 26. Browser Event Loop + rendering timing: macrotasks, microtasks, rAF positioning

**Event Loop** - бесконечный цикл, координирующий выполнение JS, рендеринг и другие задачи в браузере. Архитектура: один main thread для JS и большей части рендеринга.

**Очереди и приоритет:**
1. **Macrotasks (Task queue):** `setTimeout`, `setInterval`, `I/O`, UI rendering, `postMessage`, `MessageChannel`. Одна macrotask за итерацию event loop
2. **Microtasks:** `Promise.then/catch/finally`, `MutationObserver`, `queueMicrotask()`. Выполняются ВСЕ до перехода к следующей macrotask или рендеру
3. **requestAnimationFrame (rAF):** Выполняется ПЕРЕД рендерингом, синхронизирован с частотой обновления экрана (60fps → каждые ~16.7ms)
4. **Render:** Браузер решает, нужен ли рендер (есть ли изменения DOM/CSS), и если да - выполняет style → layout → paint → composite

**Порядок в одной итерации:**
```
macrotask → ВСЕ microtasks → rAF callbacks → render → requestIdleCallback → macrotask → ...
```

```javascript
requestAnimationFrame(() => console.log('2. rAF - before paint'));
setTimeout(() => console.log('4. setTimeout'), 0);
Promise.resolve().then(() => console.log('1. microtask'));
console.log('0. sync');

// Вывод: 0, 1, 2, (render), 4
```

**Важное следствие:** Если macrotask плодит microtasks (рекурсивные `Promise.then`), рендеринг НЕ ПРОИЗОЙДЁТ пока очередь microtasks не опустеет. Можно случайно заблокировать UI, бесконечно добавляя microtasks.

> [!important]
> `requestAnimationFrame` - единственный гарантированный способ выполнить код перед рендерингом. Идеально для: чтения layout-свойств (все DOM изменения уже применены), обновления анимаций, батчинга DOM-изменений в одном кадре. Не используйте `setTimeout(0)` для этого - он может выполниться до или после рендера непредсказуемо.

---

### 27. requestAnimationFrame vs requestIdleCallback vs setTimeout

**requestAnimationFrame (rAF):**
- Выполняется перед каждым repaint, синхронизирован с vsync
- Гарантированно вызывается ~60 раз в секунду (при активной вкладке)
- На неактивных вкладках приостанавливается (экономия батареи)
- Используется для: анимаций, обновления canvas, батчинга DOM-операций перед рендером

**requestIdleCallback (rIC):**
- Выполняется когда браузер НЕ занят (между кадрами, при простое)
- Получает `IdleDeadline` с `timeRemaining()` - сколько миллисекунд осталось до следующего кадра
- Низкий приоритет, НЕ подходит для изменения DOM (может вызвать непредсказуемую задержку)
- Используется для: аналитики, отправки логов, префетчинга, не-критических обновлений

```javascript
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    processTask(tasks.shift());
  }
}, { timeout: 2000 }); // если idle нет 2 секунды - выполнить принудительно
```

**setTimeout(cb, 0):**
- Добавляет macrotask, выполнится после текущей macrotask и ВСЕХ microtasks
- Не гарантирует время выполнения - реальная задержка ≥4ms для вложенных вызовов (clamping), но не синхронизирован с рендером
- Используется для: разбиения длинных задач (yield to event loop), defer-а выполнения

**Сравнение:**
| | rAF | rIC | setTimeout |
|---|---|---|---|
| Синхронизация с рендером | Перед рендером | В idle | Не синхронизирован |
| Приоритет | Высокий | Низкий | Средний |
| Анимации | ✓ Идеально | ✗ | ✗ (джиттер) |
| DOM изменения | ✓ | ✗ Не рекомендуется | ✓ |
| Фоновая работа | ✗ | ✓ Идеально | Средне |

> [!info]
> Для анимаций используйте rAF. Для разбиения длинных задач на чанки по 50ms (INP-friendly) используйте `scheduler.postTask()` или `scheduler.yield()` - новые API, позволяющие браузеру приоритизировать. Для логов/аналитики идеально подходит rIC.

---

### 28. Layout Thrashing + FastDOM pattern

**Layout Thrashing** - паттерн когда JS чередует чтение layout-свойств и запись стилей, заставляя браузер делать reflow на каждой итерации.

```javascript
// ❌ Layout Thrashing - reflow на каждой итерации
for (let i = 0; i < elements.length; i++) {
  const height = elements[i].offsetHeight; // READ → layout
  elements[i].style.height = height + 10 + 'px'; // WRITE → invalidates layout
}
```

Браузер вынужден синхронно пересчитывать layout после каждой записи, так как следующий read требует актуальных значений.

**FastDOM паттерн:** Разделяем чтения и записи - сначала все read, потом все write.

```javascript
// ✓ FastDOM - один reflow
const heights = [];
for (const el of elements) {
  heights.push(el.offsetHeight); // ТОЛЬКО READ
}
for (let i = 0; i < elements.length; i++) {
  elements[i].style.height = heights[i] + 10 + 'px'; // ТОЛЬКО WRITE
}
```

**Как детектить:**
- Chrome DevTools → Performance → запишите профиль → ищите фиолетовые полосы "Layout" с маркером "Forced reflow"
- В коде: между каждым `style.xxx = ...` и следующим `offsetHeight/clientWidth/getComputedStyle()` вставлен ли write? Если да - вероятен thrashing

**Почему это важно:** Каждый forced reflow может занимать десятки-сотни миллисекунд на сложных страницах. При 60fps бюджет одного кадра - 16.7ms, из которых JS должен занять ~10ms. Thrashing легко сжирает весь бюджет и вызывает джанк.

> [!important]
> Используйте `requestAnimationFrame` для батчинга write-операций. Все read делайте синхронно в начале кадра, все write - в колбеке rAF. Либо используйте библиотеки (fastdom, React с Virtual DOM) которые делают это автоматически.

---

### 29. Composite Layers: GPU acceleration, will-change

**Composite-слой** - изолированное растровое изображение (битмап), хранящееся в GPU-памяти. Браузер может композитить слои, не затрагивая main thread.

**Как создаются слои:**
- 3D CSS свойства: `transform: translateZ(0)`, `translate3d(0,0,0)`
- `<video>`, `<canvas>`, `<iframe>`
- `will-change` свойство - явное указание браузеру, что элемент будет анимироваться
- `opacity` анимация + отдельный stacking context
- `position: fixed` или `overflow: scroll` часто создают слои

**translateZ(0) hack:** Форсирует создание composite-слоя. Работает, но это хак, не семантичный, и создаёт лишние слои без причины, что расходует GPU-память.

```css
/* ✓ Правильно - явно указываем что изменится */
.slide-in {
  will-change: transform;
}
/* Лучше применять will-change непосредственно перед анимацией и убирать после */
```

**Как исследовать слои:** Chrome DevTools → Rendering → Layer borders (показывает оранжевые границы слоёв). Layers panel в DevTools показывает все слои, их размер и причину создания.

**Проблемы избыточных слоёв:**
- Каждый слой потребляет GPU-память (растровое изображение размером с элемент)
- Много слоёв на мобильных = краш вкладки из-за исчерпания GPU-памяти
- Слишком большие слои (>3000×3000px) дороги для композитинга

> [!info]
> Эмпирическое правило: явно создавайте слой только для анимируемых элементов через `will-change`. Не используйте `translateZ(0)` глобально на все элементы - это увеличивает memory footprint без пользы. Для скролл-контейнеров с частыми обновлениями - `will-change: scroll-position`.

---

### 30. Core Web Vitals: LCP, INP, CLS overview

**Core Web Vitals** - метрики Google, измеряющие реальный пользовательский опыт. Влияют на SEO (page experience ranking signal).

**LCP (Largest Contentful Paint):**
Измеряет время загрузки самого большого видимого элемента (hero image, video poster, текстовый блок). Хорошо: ≤2.5s. Плохо: >4.0s.
Основная метрика perceived loading speed.

**INP (Interaction to Next Paint):** ЗАМЕНИЛ FID в марте 2024. Измеряет задержку между взаимодействием пользователя (клик, тап, нажатие клавиши) и следующим отрисованным кадром для ВСЕХ взаимодействий на странице, а не только первого. Берётся 75-й перцентиль худших взаимодействий. Хорошо: ≤200ms. Плохо: >500ms.

**CLS (Cumulative Layout Shift):**
Измеряет визуальную стабильность - сумму всех неожиданных сдвигов контента за время жизни страницы. Максимальный счёт одной сессии сдвигов - 5 секунд (session window). Хорошо: ≤0.1. Плохо: >0.25.

**Почему заменили FID на INP:**
FID измерял только задержку ПЕРВОГО взаимодействия и только input delay (время до начала обработки), игнорируя processing time и presentation delay. INP охватывает всю цепочку: input delay + processing time + rendering delay, для всех взаимодействий.

```javascript
// Измерение INP через PerformanceObserver
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.interactionId > 0) {
      const duration = entry.processingEnd - entry.startTime;
      console.log(`${entry.name}: ${duration}ms`);
    }
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });
```

> [!important]
> Core Web Vitals - это не просто чек-лист, а индикаторы UX. LCP < 2.5s требует быстрого TTFB + раннюю загрузку главного контента. INP < 200ms требует, чтобы обработчики событий и рендер-апдейты укладывались в кадр. CLS < 0.1 требует резервирования места под весь динамический контент.

---

### 31. LCP optimization: 4 phases, preload, fetchpriority, fonts

**LCP** измеряет когда largest above-the-fold элемент становится видимым. Типичные LCP-элементы: `<img>`, `<image>` (SVG), `<video>` poster, фоновое изображение через `url()`, текстовый блок (p, h1).

**Что влияет на LCP (4 фазы):**
1. **TTFB (Time to First Byte):** серверная задержка - до ~40% времени LCP
2. **Load delay:** время от TTFB до начала загрузки LCP-ресурса - улучшается preload, inline critical CSS
3. **Load time:** время загрузки ресурса - размер файла, сжатие, CDN
4. **Render delay:** время от загрузки до рендера - если LCP-элемент - текст, нужен font block period; если картинка - decoding

**Оптимизация LCP:**
```html
<!-- Preload LCP-изображения -->
<link rel="preload" as="image" href="hero.webp" imagesrcset="hero-2x.webp 2x">

<!-- Используем fetchpriority для LCP-изображения -->
<img src="hero.webp" fetchpriority="high" loading="eager" decoding="sync">
```

**Стратегии:**
- LCP-изображение должно загружаться с HTML, не через JS (сразу в `<img src>`, не через React state)
- Используйте современные форматы (WebP, AVIF) - меньше байт на то же качество
- Responsive images с `srcset` - не грузить десктопную 2x картинку на маленький экран
- Inline небольшие изображения в data-URI если они критичны
- Не лейзилоадьте LCP-изображение (`loading="lazy"` на нём = плохо)
- Серверный рендеринг (SSR) - пользователь видит контент быстрее

**LCP и веб-шрифты:** Текстовый LCP-блок может задерживаться загрузкой шрифтов. Используйте `font-display: swap` + preload для шрифтов:
```css
@font-face {
  font-family: 'Inter';
  src: url('inter.woff2') format('woff2');
  font-display: swap; /* Показать fallback шрифт сразу, заменить когда загрузится */
}
```

> [!important]
> LCP - это НЕ просто "картинка быстро загрузилась". Это метрика отражающая всю цепочку от соединения с сервером до отрисовки главного элемента. Для сложных SPA без SSR LCP будет плохим почти всегда, так как JS должен выполниться прежде чем хоть что-то появится.

---

### 32. INP: what it replaced FID, how to measure/improve

**INP** - метрика отзывчивости, заменившая FID в марте 2024. Измеряет latency ВСЕХ взаимодействий (не только первого) на протяжении всего визита.

**Измеряемые взаимодействия:** click, tap, key press (не scroll и не hover).

**Что включает задержка INP:**
1. **Input delay:** время от события до начала обработки (main thread занят другими задачами)
2. **Processing time:** время выполнения обработчиков событий (JS execution)
3. **Presentation delay:** время от окончания обработки до paint (браузер ждёт следующего кадра)

**Почему FID недостаточен:** FID измерял только input delay первого взаимодействия. Реальная UX проблема часто в том, что после загрузки страницы обработка событий занимает 300ms - FID уже не считает, а пользователь страдает.

**Как улучшить INP:**
1. Разбивайте длинные задачи: задача >50ms должна быть разбита на чанки
   ```javascript
   function processLargeArray(items, callback) {
     let index = 0;
     function chunk() {
       const end = Math.min(index + 10, items.length);
       for (; index < end; index++) callback(items[index]);
       if (index < items.length) {
         scheduler.postTask(chunk, { priority: 'user-blocking' });
       }
     }
     chunk();
   }
   ```
2. Избегайте больших re-render в обработчиках событий - используйте колбек-батчинг через rAF
3. Yield to main thread: `scheduler.yield()` - новый API для явной отдачи контроля event loop
4. Не делайте дорогих операций в `scroll`, `mousemove` - throttle/debounce

**Методология INP:** Берётся 75-й перцентиль всех задержек взаимодействия. Если у пользователя было 100 кликов, 75 из них быстрее 200ms - INP хороший. Один медленный клик из 100 не сильно повлияет.

> [!important]
> Переход от FID к INP радикально меняет фокус оптимизации: нужно следить не только за загрузкой страницы, но и за отзывчивостью на ВСЁМ протяжении сессии. Long Tasks API и Total Blocking Time (TBT) становятся критически важными метриками для дебага.

---

### 33. CLS: causes, session window, solutions

**CLS** измеряет неожиданные сдвиги макета, когда видимый элемент меняет позицию между кадрами. Оценка = impact fraction × distance fraction.

**Impact fraction:** доля viewport, затронутая сдвигом (0-1).
**Distance fraction:** насколько далеко элемент сдвинулся относительно viewport (0-1).

**Session window:** сдвиги группируются в окна по 5 секунд (1 секунда между сдвигами = разрыв окна). CLS = максимальная сумма сдвигов в одном окне.

**Основные причины CLS и решения:**

1. **Изображения без размеров:**
   ```html
   <!-- ❌ Плохо - браузер не знает размер до загрузки -->
   <img src="photo.jpg">
   <!-- ✓ Хорошо - резервируем место заранее -->
   <img src="photo.jpg" width="800" height="600">
   <!-- или -->
   <style>.img-container { aspect-ratio: 4/3; }</style>
   ```

2. **Динамический контент (реклама, эмбеды):**
   ```css
   .ad-slot {
     min-height: 250px; /* резервируем минимальное место */
   }
   ```

3. **Веб-шрифты (FOIT/FOUT):**
   ```css
   @font-face {
     font-display: optional; /* или swap, избегать block */
   }
   /* Подберите fallback-шрифт с похожими метриками */
   @font-face {
     font-family: 'Custom';
     src: url('custom.woff2');
     font-display: swap;
     ascent-override: 90%; /* метрики fallback-шрифта */
     descent-override: 20%;
   }
   ```

4. **Поздняя подгрузка данных в элементы:**
   ```css
   .content { min-height: calc(100vh - 200px); }
   ```

5. **Анимации, меняющие layout:**
   ```css
   /* ❌ Сдвигает контент вниз */
   @keyframes slideIn { from { top: -100px; } to { top: 0; } }
   /* ✓ Использует transform - не влияет на layout */
   @keyframes slideIn { from { transform: translateY(-100px); } to { transform: translateY(0); } }
   ```

> [!important]
> CLS - самая коварная метрика. Её сложно заметить при разработке (всегда тёплый кеш, быстрая загрузка), но на медленных соединениях сдвиги становятся критичными. Обязательно тестируйте CLS в throttled-условиях и на реальных устройствах.

---

### 34. TTFB: components, optimization

**TTFB** - время от начала запроса до получения первого байта ответа. Включает: redirect time, DNS lookup, TCP+TLS handshake, server processing time.

**TTFB для разных протоколов в идеальных условиях (0ms latency):**
- HTTP/1.1 HTTPS: TCP (1 RTT) + TLS 1.2 (2 RTT) = 3 RTT
- HTTP/2 HTTPS: TCP (1 RTT) + TLS 1.3 (1 RTT) = 2 RTT
- HTTP/3: QUIC (0 RTT для повторных соединений) = 0-1 RTT

На практике каждый RTT стоит 20-200ms в зависимости от географии.

**Что влияет на TTFB:**
1. **Server processing time:** генерация ответа (database query, SSR, template rendering) - основная доля для динамических страниц
2. **Redirects:** каждый redirect добавляет RTT - избегайте цепочек, используйте `rel="canonical"`
3. **Network latency:** физическое расстояние до сервера
4. **Connection setup:** DNS, TCP, TLS - минимизируется через `preconnect` и HTTP/2/3

**Оптимизация TTFB для фронтендера:**
```html
<!-- Preconnect к критическому API/ориджину -->
<link rel="preconnect" href="https://api.example.com" crossorigin>

<!-- Указываем режим 103 Early Hints для серверной логики -->
<!-- Сервер отправляет 103 с Link-заголовками для preload пока готовится основной ответ -->
```

**Серверные оптимизации (которые должен понимать фронтендер):**
- Кеширование на edge (CDN) - HTML с `CDN-Cache-Control` для не-персонализированных страниц
- Edge workers (Cloudflare Workers, Lambda@Edge) - обработка запроса на ближайшем edge, минуя origin
- Streaming SSR - отправка HTML чанками по мере генерации (TTFB раньше, контент видим быстрее)

> [!info]
> TTFB > 800ms считается проблемным (Lighthouse). Для статического контента TTFB > 200ms - повод проверить CDN и географическое распределение. Для SSR - нормально до 500ms, выше - нужен edge-кешинг или streaming.

---

### 35. Resource Hints: preload, prefetch, preconnect, dns-prefetch, prerender

**Resource Hints** - `<link>` атрибуты, подсказывающие браузеру что и когда загружать, оптимизируя критический путь.

**dns-prefetch:**
```html
<link rel="dns-prefetch" href="//api.example.com">
```
Выполняет DNS-резолвинг заранее (~50-100ms экономии). Используйте для сторонних доменов которые скоро понадобятся (API, CDN, analytics).

**preconnect:**
```html
<link rel="preconnect" href="https://api.example.com">
```
DNS + TCP + TLS handshake. Экономит 100-500ms. Используйте для КРИТИЧЕСКИХ third-party origins. Не злоупотребляйте - каждое preconnect открывает соединение, которое потребляет ресурсы. Максимум 4-6 на страницу.

**preload:**
```html
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="hero.jpg" as="image" imagesrcset="hero-2x.jpg 2x">
```
Загружает ресурс с ВЫСОКИМ приоритетом немедленно. Обязательно указывайте `as` (font, image, script, style) чтобы браузер знал Content-Type и мог приоритизировать. Без `as` - запрос будет с низким приоритетом, неправильно.

**prefetch:**
```html
<link rel="prefetch" href="page-2.js">
```
Загружает ресурс с НИЗКИМ приоритетом, для будущих навигаций (следующая страница). Выполняется в idle time. Не гарантирует что ресурс будет загружен - браузер может отменить если не хватает ресурсов.

**prerender:**
```html
<link rel="prerender" href="https://example.com/next-page">
```
Загружает И РЕНДЕРИТ целую страницу в фоновом iframe. Мгновенная навигация, но потребляет много ресурсов. Chrome ограничивает количество одновременных prerender.

```html
<!-- Типичная комбинация для SPA -->
<link rel="preconnect" href="https://api.example.com" crossorigin>
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
<link rel="preload" href="/critical.css" as="style">
<link rel="prefetch" href="/page-about.js">
```

> [!important]
> preload - мощный но опасный инструмент. Если вы preload'ите ресурс и не используете в течение ~3 секунд - Chrome покажет консольное предупреждение, ресурс считается потраченным впустую, ухудшая общую загрузку. Preload'ьте только ресурсы, которые ТОЧНО понадобятся в critical path.

---

### 36. Priority Hints (fetchpriority)

**Priority Hints** - атрибут `fetchpriority`, позволяющий явно указать браузеру приоритет загрузки ресурса поверх дефолтных эвристик браузера.

**Приоритеты загрузки браузера (по умолчанию):**
- **Highest:** CSS (блокирует рендеринг), шрифты
- **High:** скрипты в `<head>` (блокируют парсинг), preload, картинки в viewport
- **Medium:** скрипты с `defer`/`async`
- **Low:** скрипты с `async` внизу страницы, prefetch, картинки вне viewport
- **Lowest:** картинки с `loading="lazy"`

Браузер определяет приоритет автоматически на основе позиции элемента в DOM, типа ресурса, и видимости. Но эвристики не идеальны - именно здесь `fetchpriority` вступает в игру.

```html
<!-- LCP-изображение: самый высокий приоритет -->
<img src="hero.webp" fetchpriority="high">

<!-- Не-критическая картинка в футере: низкий приоритет -->
<img src="footer-logo.png" fetchpriority="low" loading="lazy">

<!-- Критический скрипт -->
<script src="main.js" fetchpriority="high"></script>

<!-- Preload + fetchpriority -->
<link rel="preload" href="hero.webp" as="image" fetchpriority="high">
```

**Какие элементы поддерживают `fetchpriority`:**
- `<img>` - наиболее распространённый use-case
- `<link rel="preload">` - для любого типа ресурса
- `<script>` - для JS-бандлов
- `fetch()` API - через опцию `{ priority: 'high' | 'low' | 'auto' }`

**fetchpriority vs preload:**
Это разные инструменты с разными целями:
- `preload` - говорит браузеру "начни загружать этот ресурс НЕМЕДЛЕННО, не жди пока дойдёшь до него в HTML"
- `fetchpriority` - говорит браузеру "когда ты загружаешь этот ресурс, поставь его ВЫШЕ/НИЖЕ в очереди сетевых запросов"

Они работают вместе: preload определяет КОГДА начать загрузку, fetchpriority определяет КАКОЙ приоритет у этого запроса в сетевой очереди.

**Когда использовать `fetchpriority="high"`:**
- LCP-изображение, которое браузер мог бы определить как low-priority (например, если оно загружается через CSS background-image или находится ниже в DOM)
- Критический JS-бандл, от которого зависит интерактивность
- Шрифты для above-the-fold текста

**Когда использовать `fetchpriority="low"`:**
- Изображения ниже сгиба (below-the-fold), которые браузер мог бы загрузить с высоким приоритетом
- Не-критические скрипты, которые всё равно нужны, но не срочно
- Ресурсы для контента, который появится только после пользовательского взаимодействия

**Как `fetchpriority` влияет на HTTP/2+:**
В HTTP/2 мультиплексирование позволяет отправлять множество запросов параллельно, но сервер всё ещё решает в каком порядке отдавать данные (stream prioritization). `fetchpriority` передаёт приоритет в HTTP/2 stream weight, влияя на порядок отдачи сервером. В HTTP/3/QUIC приоритизация работает аналогично, но с улучшенной обработкой из-за отсутствия TCP HOL blocking.

**Измерение эффекта:**
Chrome DevTools → Network → колонка "Priority" показывает приоритет каждого запроса. До и после добавления `fetchpriority` можно увидеть изменение порядка загрузки.

> [!important]
> `fetchpriority` не меняет ПОРЯДОК загрузки (HTML всё ещё парсится сверху вниз), он меняет КОНКУРЕНЦИЮ в очереди сетевых запросов. Ресурс с `fetchpriority="high"` получит приоритет над другими в тот момент, когда запрос отправлен. Используйте Lighthouse - он подсвечивает изображения с неправильным приоритетом.

---

### 37. Bundle size optimization: code splitting, tree shaking, compression

**Оптимизация размера бандла** - постоянный процесс, а не разовая акция. Каждый kilobyte JS стоит: download time (сеть), parse time (CPU), execution time (CPU).

**Code Splitting - разделение кода на бандлы:**
```javascript
// Статический import - входит в основной бандл
import { heavyFunction } from './heavy.js';

// Динамический import - отдельный чанк, загружается при необходимости
const { heavyFunction } = await import('./heavy.js');
```

Уровни code splitting:
- **Route-level:** каждая страница - отдельный бандл. Простейший и самый эффективный
- **Component-level:** тяжёлые компоненты лениво загружаются (чарты, rich text editors)
- **Vendor chunk:** framework + общие зависимости выносятся в отдельный бандл для долгосрочного кеширования

**Tree Shaking - удаление мёртвого кода:**
Работает только с ES modules (статический `import`/`export`). CommonJS (`require`) не shakable.
```javascript
// ❌ Не tree-shakable - весь модуль включается
import _ from 'lodash';
_.debounce(fn, 300);

// ✓ Tree-shakable - только debounce
import { debounce } from 'lodash-es';
debounce(fn, 300);
```
Условия для tree shaking: ES modules + production mode + `sideEffects: false` в package.json (для библиотек).

**Другие техники:**
- **Differential serving:** `<script type="module">` для современных браузеров (меньше полифилов). Legacy - в `<script nomodule>`
- **Compression:** Brotli (лучше чем Gzip, но медленнее сжатие), Zopfli (максимальное Gzip, медленно, для статики на CDN). Brotli даёт ~15-20% выигрыш над Gzip для JS/CSS
- **Image CDN:** автоматическая конвертация в WebP/AVIF, ресайз до нужного размера
- **Shared dependencies:** если микрофронтенды - выносить общие зависимости (react, react-dom) через Module Federation `shared` конфигурацию

**Мониторинг:**
```javascript
// Webpack: webpack-bundle-analyzer
// Vite: rollup-plugin-visualizer
// Общий: bundlesize в CI (не дать бандлу вырасти без ревью)
```

> [!important]
> Code splitting - это НЕ про уменьшение общего размера кода. Это про загрузку ТОЛЬКО нужного кода для текущей страницы. При плохом сплиттинге пользователь на /home качает код для /settings. Правильный сплиттинг даёт больший прирост TTI, чем любые микрооптимизации размера.

---

### 38. Lazy Loading: loading="lazy", IntersectionObserver, dynamic import()

**Нативный lazy loading (HTML атрибут):**
```html
<img src="photo.jpg" loading="lazy" decoding="async">
<iframe src="video.html" loading="lazy"></iframe>
```
Браузер сам решает когда загружать на основе расстояния до viewport (обычно ~1250px для Chrome). Не требует JS, работает мгновенно. Но нет контроля над thresholds и нельзя lazy-load background-image.

**Intersection Observer для кастомной логики:**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src; // подстановка реального src
      img.classList.add('loaded');
      observer.unobserve(img);
    }
  });
}, { rootMargin: '200px' }); // загружать за 200px до появления

document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
```

Плюсы Intersection Observer: точный контроль threshold, rootMargin для предзагрузки, можно лейзилоадить что угодно (iframe, компоненты, фоны). Не влияет на layout - колбек вызывается асинхронно.

**Динамический import (code splitting):**
```javascript
// Ленивая загрузка модуля при навигации
button.addEventListener('click', async () => {
  const { renderChart } = await import('./heavy-chart.js');
  renderChart(data);
});

// Preload модуля по ховеру
button.addEventListener('mouseenter', () => {
  import('./heavy-chart.js'); // начинает загрузку, но не выполняет
});
```

**Ленивая загрузка компонентов в React/Vue:**
```javascript
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
// Suspense с fallback UI
<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

> [!info]
> Комбинируйте подходы: `loading="lazy"` для ниже-сгиба картинок (просто и без JS), Intersection Observer для компонентов/фонов с кастомной логикой, dynamic `import()` для тяжелых JS-бандлов. Не лейзилоадьте above-the-fold изображения - это увеличит LCP.

---

### 39. content-visibility + contain: CSS containment for performance

**content-visibility** - CSS свойство, позволяющее браузеру пропускать рендеринг невидимых (вне viewport) элементов. Применяет автоматический `contain` к элементу.

```css
/* Браузер НЕ рендерит элемент, пока он находится вне viewport */
.long-page-section {
  content-visibility: auto;
  contain-intrinsic-size: 500px; /* placeholder высота для скролбара */
}
```

**Как работает:** `content-visibility: auto` говорит браузеру: "не лейауть, не пейнти содержимое этого элемента пока он не приблизится к viewport". Это даёт огромный прирост на длинных страницах (списки, infinite scroll history).

**contain-intrinsic-size** - placeholder размер, чтобы скролбар был корректным и не дёргался при подгрузке. Без него элемент схлопнется до 0px.

**Свойство `contain`:**
- `contain: layout` - внутренний reflow не влияет на внешний (и наоборот)
- `contain: paint` - содержимое не рисуется за границами элемента (как `overflow: hidden` но без clipping скролбаров)
- `contain: size` - размер элемента не зависит от потомков (нужен явный размер)
- `contain: style` - counter и quotes изолированы
- `contain: strict` = `layout paint size style`

```css
/* Компонент-виджет, изолированный от остальной страницы */
.dashboard-widget {
  contain: layout style;
  content-visibility: auto;
  contain-intrinsic-size: 300px;
}
```

**Когда применять:** Длинные страницы с однотипными секциями (новостные ленты, e-commerce каталоги, infinite scroll). Не применяйте для above-the-fold контента - это замедлит First Paint.

> [!important]
> `content-visibility: auto` + `contain-intrinsic-size` - пожалуй, самый простой способ радикально улучшить LCP и общую производительность длинных страниц. Браузер просто не рендерит оффскрин контент, экономя layout/paint на всём что вне viewport. Прирост может быть 2-10x на страницах с тысячами элементов.

---

### 40. BFCache (Back-Forward Cache) + Page Lifecycle API

**BFCache (Back-Forward Cache)** - механизм браузера, который сохраняет полную snapshot страницы (DOM, JS state, CSSOM, render tree) в памяти при навигации away. При возврате через кнопку "Назад" или "Вперёд" страница восстанавливается мгновенно - без повторной загрузки, парсинга, или выполнения JS.

**Как работает BFCache:**
1. Пользователь уходит со страницы (клик по ссылке, forward navigation)
2. Браузер проверяет, eligible ли страница для BFCache
3. Если да - замораживает страницу (freeze event), сохраняет snapshot
4. При возврате - размораживает (resume/pageshow event), страница появляется мгновенно

**Когда страница НЕ eligible для BFCache:**
- Есть открытые WebSocket соединения
- Есть `unload` event listener (это блокирует BFCache в Chrome!)
- Используется `window.opener` (страница была открыта через `window.open`)
- Есть active `beforeunload` handler
- Страница содержит `<form>` с unsaved changes
- Используется `navigator.sendBeacon` в unload
- Страница использует `SharedArrayBuffer` без правильной COOP/COEP настройки

**Page Lifecycle API - состояния страницы:**
```
Active → Passive → Hidden → Frozen → Terminated
  ↑         ↓
  └── Resumed ←──
```

- **Active:** страница на переднем плане, пользователь взаимодействует
- **Passive:** страница видна но не в фокусе (другое окно поверх)
- **Hidden:** страница скрыта (пользователь переключил вкладку)
- **Frozen:** страница в BFCache, JS execution приостановлен, таймеры заморожены
- **Terminated:** страница удалена из памяти (evicted из BFCache)

**Freeze/Resume события:**
```javascript
// Обработка заморозки (страница уходит в BFCache)
document.addEventListener('freeze', () => {
  // Остановить polling, закрыть WebSocket, сохранить state
  clearInterval(pollingInterval);
});

// Обработка разморозки (страница возвращается из BFCache)
document.addEventListener('resume', () => {
  // Перезапустить polling, проверить свежесть данных
  startPolling();
});

// pageshow с persisted = true означает возврат из BFCache
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Страница восстановлена из BFCache
    // Обновить данные, проверить авторизацию
    refreshUserData();
  }
});
```

**Почему страницы evict'ятся из BFCache:**
- Memory pressure (браузеру нужна память для новой страницы)
- Страница была в BFCache слишком долго (TTL зависит от браузера)
- Страница использовала ресурсы, которые не могут быть заморожены
- Пользователь очистил browsing data

**Как тестировать BFCache:**
- Chrome DevTools → Application → Back-forward cache → Run test
- Или через URL: `chrome://discards/` показывает BFCache eligibility
- В тестах: навигация away и back с проверкой `event.persisted` в `pageshow`

**Влияние на Core Web Vitals:**
BFCache радикально улучшает LCP и INP для возвратных навигаций - страница появляется мгновенно, без network round-trips. Google учитывает BFCache в CrUX данных, но Lighthouse пока не тестирует его напрямую.

> [!important]
> Никогда не используйте `unload` event listener - он блокирует BFCache. Замените на `pagehide` или `visibilitychange`. Если ваша страница не попадает в BFCache, каждый возврат пользователя означает полную перезагрузку - это сотни миллисекунд задержки, которых можно избежать.

---

### 41. DOM parsing mechanics

**DOM parsing** - процесс превращения HTML-байтов в DOM-дерево. Браузер делает это инкрементально, по мере поступления байтов от сети.

**Инкрементальный HTML parsing:**
Браузер не ждёт загрузки всего HTML. Как только первые байты приходят, tokenizer начинает работу:
1. Байты → символы (через encoding detection)
2. Символы → токены (`<tag>`, `</tag>`, текст, комментарий)
3. Токены → узлы DOM-дерева

**Speculative parsing (preload scanner):**
Пока основной HTML-парсер заблокирован синхронным скриптом, браузер запускает preload scanner - отдельный поток, который сканирует оставшийся HTML в поисках ресурсов для загрузки (`<img>`, `<link>`, `<script src>`). Это позволяет начать загрузку ресурсов заранее, не дожидаясь разблокировки парсера.

```html
<script src="blocking.js"></script>
<!-- Пока blocking.js загружается и выполняется, preload scanner уже нашёл: -->
<link rel="stylesheet" href="styles.css"> <!-- начнёт загрузку заранее -->
<img src="hero.jpg"> <!-- начнёт загрузку заранее -->
```

**Parser-blocking scripts:**
Синхронный `<script src="...">` без `async` или `defer` блокирует HTML-парсинг:
1. Парсер доходит до `<script>`
2. Останавливает парсинг HTML
3. Загружает скрипт (если внешний)
4. Выполняет скрипт
5. Только потом продолжает парсинг

Именно поэтому скрипты традиционно размещали в конце `<body>` - чтобы DOM был построен до выполнения JS.

**CSS блокирует рендеринг, но НЕ парсинг:**
Это важное различие. CSSOM строится параллельно с DOM-парсингом. Но:
- CSS блокирует рендеринг (браузер не покажет страницу без CSSOM)
- CSS НЕ блокирует DOM-парсинг (браузер продолжает строить DOM)
- CSS блокирует выполнение JS (скрипт ждёт CSSOM, так как может читать computed styles через `getComputedStyle`)

**async/defer impact on parsing:**
```html
<!-- Блокирует парсинг: загружается и выполняется немедленно -->
<script src="app.js"></script>

<!-- НЕ блокирует парсинг: загружается параллельно, выполняется сразу после загрузки -->
<script async src="analytics.js"></script>

<!-- НЕ блокирует парсинг: загружается параллельно, выполняется после DOM-парсинга, перед DOMContentLoaded -->
<script defer src="app.js"></script>
```

**`<template>` element (inert DOM):**
`<template>` создаёт DocumentFragment - DOM-дерево, которое не рендерится и не участвует в layout. Содержимое template полностью inert: скрипты не выполняются, картинки не загружаются, стили не применяются. Активация происходит при `document.importNode(template.content, true)` или `template.content.cloneNode(true)`.

```html
<template id="card-template">
  <div class="card">
    <img src="placeholder.jpg"> <!-- НЕ загружается пока template не активирован -->
  </div>
</template>
```

**innerHTML vs createElement performance:**
- `innerHTML` - браузер парсит HTML-строку в DOM. Быстрее для массовой вставки, но требует full re-parse и XSS-опасен при пользовательском контенте
- `createElement` - программное создание узлов. Медленнее для массовой вставки, но безопаснее и даёт больше контроля
- Для больших вставок `innerHTML` может быть в 2-5x быстрее, но `DocumentFragment` + `createElement` даёт лучшую производительность при множественных вставках

> [!info]
> Современный браузер оптимизирует парсинг aggressively. Speculative preload scanner - одна из самых важных оптимизаций: она позволяет загружать ресурсы параллельно с выполнением blocking-скриптов. Используйте `defer` для всех скриптов которые не нужны до DOMContentLoaded - это даёт парсеру работать без блокировок.

---

### 42. SSR vs SSG vs CSR vs ISR

**CSR (Client-Side Rendering):**
Браузер загружает минимальный HTML + JS бандл, рендерит всё на клиенте.
- Плюсы: простой деплой (статический хостинг), богатая интерактивность
- Минусы: плохой SEO (пустой HTML для краулеров, хотя Googlebot теперь рендерит JS), плохой LCP/FCP, большой JS в основном потоке

**SSR (Server-Side Rendering):**
Сервер рендерит HTML на каждый запрос, отправляет готовую страницу с данными.
- Плюсы: отличный LCP/FCP, хороший SEO, пользователь видит контент сразу
- Минусы: выше TTFB (сервер должен отработать), дороже инфраструктура, атака на сервер влияет на доступность

**SSG (Static Site Generation):**
HTML генерируется на билде, раздаётся как статика.
- Плюсы: мгновенный TTFB (CDN), минимальный LCP, не нужен сервер, высокая надёжность
- Минусы: длинный билд для больших сайтов, контент не обновляется между билдами, персонализация ограничена

**ISR (Incremental Static Regeneration):**
Комбинация SSG + SSR. Страницы генерируются на билде, но при запросе к устаревшей (stale) странице она регенерируется в фоне.
- Плюсы: быстро как SSG, но контент обновляется в реальном времени
- Минусы: сложнее инфраструктура, stale-while-revalidate паттерн (пользователь может получить устаревшую версию)

**Когда что выбирать:**
```javascript
// CSR - internal tools, dashboards, SPA за логином
//   (SEO не важен, пользователи авторизованы)

// SSR - новостные сайты, e-commerce, блоги с комментариями
//   (важен свежий контент + SEO)

// SSG - документация, маркетинговые страницы, блоги редких авторов
//   (контент меняется редко, нужна максимальная скорость)

// ISR - e-commerce с частыми обновлениями цен, крупные блоги
//   (нужна скорость CDN + свежесть контента)
```

**Hybrid подходы:** Next.js позволяет на одной странице смешивать SSG (общая структура) + CSR (персонализированные данные через `useEffect`). Или streaming SSR с Suspense boundaries - контент стримится чанками, быстрые части рендерятся раньше.

> [!important]
> Нет серебряной пули. Для контентного сайта SSG на CDN - идеал. Для SPA-приложения за логином CSR приемлем. Для продукта с SEO - SSR + edge caching. Ключевое: не выбирайте архитектуру до того как определите аудиторию (SEO-зависимая?) и частоту обновления контента.

---

### 43. Microfrontends: Module Federation, iframes, Web Components

**Микрофронтенды (MFE)** - архитектурный подход, при котором фронтенд-приложение собирается из независимо разрабатываемых и деплоимых микро-приложений.

**Подходы:**

1. **Module Federation (Webpack 5 / Rspack):**
   ```javascript
   // host/webpack.config.js
   new ModuleFederationPlugin({
     name: 'host',
     remotes: {
       checkout: 'checkout@http://localhost:3001/remoteEntry.js',
       products: 'products@http://localhost:3002/remoteEntry.js',
     },
     shared: { react: { singleton: true, eager: true } },
   });
   ```
   Позволяет загружать JS-модули из других приложений в рантайме. Shared-зависимости (react, react-dom) загружаются один раз. Самый популярный подход для Webpack-экосистемы.

2. **iframe:**
   Простейшая изоляция: полная изоляция DOM, CSS, JS. Коммуникация через `postMessage`. Минусы: плохая производительность (каждый iframe - отдельный browsing context), сложная маршрутизация, плохой UX (скролл, accessibility).

3. **Web Components:**
   Каждая команда поставляет кастомный элемент. Независимы от фреймворка.
   ```javascript
   class CheckoutWidget extends HTMLElement {
     connectedCallback() {
       this.innerHTML = '<checkout-app></checkout-app>';
       import('./checkout-bootstrap.js');
     }
   }
   customElements.define('checkout-widget', CheckoutWidget);
   ```

4. **Server-side composition (Tailor, Podium):**
   Сервер собирает HTML из нескольких микро-приложений на уровне шаблонов. Каждый фрагмент рендерится независимо, с собственным TTL и fallback.

**Tradeoffs:**
- Плюсы: независимые деплои, изолированные команды, можно использовать разные фреймворки
- Минусы: сложность оркестрации, дублирование зависимостей (раздувание бандла), сложное end-to-end тестирование, проблемы с shared state и роутингом
- **Не начинайте с микрофронтендов** если у вас не десятки команд и независимые релизные циклы. Это решение организационной проблемы, а не технической

> [!important]
> Module Federation даёт наилучший UX (общий SPA, нет перезагрузок страницы между MFE), но сложнее в настройке. iframe дают наилучшую изоляцию ценой UX. Web Components дают фреймворк-независимость. Выбор зависит от приоритета: UX побеждает изоляцию или наоборот.

---

### 44. BFF (Backend for Frontend) pattern

**BFF** - серверный слой, создаваемый специально под нужды конкретного фронтенд-клиента. Вместо того чтобы фронтенд общался с десятками микросервисов, он общается с одним BFF, который агрегирует и трансформирует данные.

**Проблема без BFF:**
```
Mobile App → /api/users (user service)
           → /api/orders (order service)
           → /api/products (product service)
           ← 3 запроса с разными форматами данных ← сложная логика на клиенте
```

**С BFF:**
```
Mobile App → /mobile-api/dashboard → BFF → /users + /orders + /products
                                        ← агрегирует и форматирует ← один запрос
```

**Зачем нужен BFF:**
1. **Агрегация данных:** собрать данные из 5 микросервисов в один ответ, оптимизированный для экрана. Меньше round-trips, меньше логики на клиенте
2. **Трансформация форматов:** бэкенд отдаёт snake_case, фронтенд хочет camelCase. Или бэкенд отдаёт полные модели, фронтенду нужна проекция (view model)
3. **Секьюрность:** API ключи и токены живут в BFF, не в браузере. BFF выполняет OAuth code exchange (confidential client, не public)
4. **Специфичная для канала логика:** мобильное приложение хочет сжатые данные (меньше трафика), веб - полные для SEO

**GraphQL как BFF:**
GraphQL-сервер часто выполняет роль BFF - он агрегирует данные из множества источников (REST API, базы данных, gRPC сервисы) и предоставляет единый endpoint. Резолверы GraphQL могут вызывать разные backend-сервисы и комбинировать результаты.

```graphql
# Один GraphQL query заменяет 3 REST запроса
query Dashboard {
  user { name, avatar }
  recentOrders { id, total, status }
  recommendations { id, name, price }
}
```

**BFF vs API Gateway:**
- API Gateway - единая точка входа для ВСЕХ клиентов, маршрутизирует запросы к backend-сервисам. Generic, не специфичен для клиента
- BFF - специфичен для ОДНОГО клиента (web, iOS, Android). Знает UI-потребности, трансформирует данные под конкретный экран
- Часто BFF стоит ЗА API Gateway: Client → API Gateway → BFF → Backend Services

**Пер-client BFF:**
В крупных организациях каждый клиент имеет свой BFF:
- `web-bff` - полный UI, SEO, rich interactions
- `mobile-bff` - компактные ответы, offline-first, push notifications
- `partner-bff` - ограниченный набор данных для внешних интеграций

**Кеширование в BFF:**
BFF - идеальное место для кеширования:
- Кеширует ответы backend-сервисов (уменьшает нагрузку)
- Применяет стратегии stale-while-revalidate
- Может использовать Redis для shared cache между инстансами

**Когда BFF overkill:**
- Монолит на бэкенде (BFF дублирует логику)
- Один клиент (если только Web - overhead неоправдан)
- Маленькое приложение (few endpoints, simple data shapes)
- GraphQL уже покрывает потребность в гибких запросах

> [!info]
> BFF - это про адаптацию бэкенд-API к нуждам конкретного UI. Это не GraphQL-сервер (хотя может содержать его) и не API Gateway (хотя выполняет похожую роль). Это тонкий translation/aggregation слой, специфичный для одного клиента. Обычно разрабатывается фронтенд-командой.

---

### 45. State management patterns: URL vs localStorage vs server cache vs client state

**Принцип:** каждое состояние должно храниться там, где его жизненный цикл наиболее соответствует смыслу данных.

**URL (Query params, path params, hash):**
Состояние, которое должно пережить перезагрузку и быть shareable.
```javascript
// Храним фильтры и пагинацию в URL
/search?q=react&page=2&sort=date
// Пользователь может скопировать ссылку и отправить коллеге
```
Что хранить в URL: поисковые запросы, фильтры, пагинацию, выбранную вкладку, состояние модального окна (если оно должно открываться по ссылке).

**Server cache (React Query, SWR, Apollo Cache):**
Серверные данные - всё что пришло от API. Не надо копировать их в Redux.
```javascript
const { data, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000, // 5 минут считаем свежим
});
```
Серверный кеш решает: дедупликацию запросов, кеширование, оптимистичные обновления, фоновую ревалидацию.

**Client state (useState, useReducer, Redux, Zustand, Jotai):**
Состояние UI - открыто ли меню, какая тема, состояние формы до сабмита.
```javascript
const [isOpen, setIsOpen] = useState(false);
const [theme, setTheme] = useState('light');
```

**localStorage / sessionStorage:**
Данные которые должны пережить перезагрузку, но не являются URL-shareable.
- localStorage: тема, язык, onboarding completion
- sessionStorage: временный черновик формы, scroll position
- **Никогда:** access/refresh токены (XSS вектор)

**IndexedDB:**
Большие объёмы структурированных данных для offline-first. Сообщения чата, закешированные ответы API.

> [!important]
> Правило трёх вопросов: (1) Нужно ли это состояние при перезагрузке? → URL или storage. (2) Это данные с сервера? → server cache (React Query/SWR). (3) Это преходящее UI-состояние? → client state (useState/Redux). Если данные попали в две категории - вы что-то делаете неправильно.

---

### 46. Offline-first architecture: Service Worker, IndexedDB, Background Sync

**Offline-first** - архитектура, где приложение работает без сети, а сетевая синхронизация происходит когда возможно. Не "best effort", а гарантированная работа.

**Ключевые технологии:**
1. **Service Worker** - перехватывает запросы, возвращает из кеша
2. **IndexedDB** - структурированное хранилище на клиенте
3. **Background Sync** - отложенная отправка данных когда появится сеть
4. **Cache API** - программный кеш HTTP-ответов

**Стратегия кеширования - Stale While Revalidate:**
```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('v1').then(cache =>
      cache.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cached || fetchPromise; // cached - немедленно, network - для обновления
      })
    )
  );
});
```

**Проблема конфликтов синхронизации:**
Два пользователя редактируют один и тот же документ офлайн. Оба синхронизируют изменения - чьи данные сохранить?

**Стратегии разрешения конфликтов:**
1. **Last Write Wins (LWW):** простое, но данные могут потеряться
2. **CRDT (Conflict-free Replicated Data Types):** математически гарантируют конвергенцию без конфликтов. Подходит для collaborative editing (текст, счётчики)
3. **Operational Transformation (OT):** трансформация операций для разрешения конфликтов. Google Docs
4. **Ручное разрешение:** сохранить обе версии, показать пользователю diff, он решает

```javascript
// Простейшая LWW синхронизация (PouchDB/CouchDB модель)
const doc = {
  _id: 'note-1',
  _rev: '2-abc',
  content: 'Hello world',
  updatedAt: Date.now() // временная метка для LWW
};
```

**Background Sync API:**
```javascript
// Регистрируем sync когда пользователь офлайн
navigator.serviceWorker.ready.then(reg => {
  return reg.sync.register('sync-messages');
});

// В Service Worker обрабатываем sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});
```

> [!important]
> Offline-first требует дисциплины: каждая операция записи должна работать без сети и предоставлять feedback пользователю что данные ещё не синхронизированы. Визуальные индикаторы синхронизации, пессимистичное/оптимистичное обновление UI, обработка конфликтов - это не опционально, а обязательно.

---

### 47. Authentication in SPA: access + refresh tokens, HttpOnly cookie vs localStorage

**Выбор хранилища для токенов - самый контроверсиальный вопрос SPA-безопасности.**

**Подход A: HttpOnly cookies (рекомендуемый):**
```
Browser: POST /login { email, password } (credentials: 'include')
Server:  Set-Cookie: access_token=...; Secure; HttpOnly; SameSite=Lax; Path=/
         Set-Cookie: refresh_token=...; Secure; HttpOnly; SameSite=Strict; Path=/api/auth/refresh
```
- Access token в куке (Secure + HttpOnly) - JS не читает, автоматически с каждым запросом
- XSS не может украсть токен (HttpOnly), но может делать запросы от имени пользователя
- CSRF защита через SameSite + дополнительный CSRF-токен в заголовке
- Refresh token на строгом SameSite=Strict и Path=/api/auth/refresh

**Подход B: localStorage + Authorization header:**
```
Browser: localStorage.setItem('access_token', token)
         fetch(url, { headers: { Authorization: `Bearer ${token}` } })
```
- XSS читает токен напрямую - полная компрометация
- Нет автоматической отправки - защита от CSRF из коробки
- Подвержен XSS-векторам: любая npm-зависимость, XSS в rich text, `<a href="javascript:...">` оставленный в комментариях

**Подход C: BFF (Backend for Frontend) - максимальная безопасность:**
```
Browser → BFF (/api/*) → Backend
         ← HTTP-only cookie ←
```
- Токены живут в BFF (конфиденциальный клиент, не public)
- Браузер общается с BFF через сессионную HttpOnly куку
- BFF проксирует запросы к основному API, прикрепляя access token
- Самый безопасный подход, но требует дополнительной инфраструктуры

**Token refresh flow с обработкой race conditions:**
```javascript
let refreshPromise = null;

async function apiFetch(url, options) {
  let res = await fetch(url, withAuth(options));
  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshToken().finally(() => { refreshPromise = null; });
    }
    await refreshPromise; // все параллельные 401 ждут один refresh
    res = await fetch(url, withAuth(options));
  }
  return res;
}
```

> [!important]
> HttpOnly cookie (с Secure, SameSite=Lax) - рекомендуемый подход для большинства SPA. localStorage - только если вы абсолютно уверены в отсутствии XSS (что невозможно в реальном мире). Комбинируйте с CSP и регулярным аудитом npm-зависимостей.

---

### 48. PWA: manifest, Service Worker, install prompt

**PWA (Progressive Web Application)** - веб-приложение, использующее современные API для поведения, близкого к нативному.

**Ключевые компоненты:**

**1. Web App Manifest:**
```json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
`display: standalone` - открывается без браузерного chrome. `maskable` иконка - адаптируется под форму иконок платформы (Android adaptive icons).

**2. Service Worker:**
Обязателен для offline-работы и installability. Без SW страница не проходит PWA criteria в Chrome.

**3. Install Prompt:**
```javascript
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // не показывать автоматический мини-бар
  deferredPrompt = e;
  // Показать кастомную кнопку "Установить"
});

installButton.addEventListener('click', async () => {
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response: ${outcome}`); // 'accepted' или 'dismissed'
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
});
```

**Критерии installability (Chrome):**
1. HTTPS
2. Valid manifest (с иконками минимум 192x192 и 512x512)
3. Зарегистрированный Service Worker с fetch handler
4. Пользователь провёл на сайте достаточно времени (engagement heuristic)

**Продвинутые PWA-фичи:**
- **Web Share API:** `navigator.share({ title, url })` - нативный share sheet
- **Shortcuts:** быстрые действия из контекстного меню иконки
- **Periodic Background Sync:** периодическое обновление в фоне
- **Web OTP API:** автозаполнение SMS OTP кодов

> [!info]
> PWA - это не просто "добавить манифест + SW". Это progressive enhancement: базовый сайт работает везде, PWA-фичи добавляются там где поддерживаются. Лучшая стратегия: начните с HTTPS и responsive design, добавьте manifest, затем SW с офлайн-страницей, затем кеширование.

---

### 49. Accessibility (a11y): ARIA, focus management, screen readers

**Accessibility (a11y)** - практика создания интерфейсов, доступных для людей с ограниченными возможностями. Это не про "поддержку screen readers", а про то, что ВСЕ пользователи взаимодействуют с интерфейсом по-разному: клавиатура, мышь, тач, голос, switch-устройства.

**ARIA (Accessible Rich Internet Applications):**
ARIA атрибуты добавляют семантику там, где HTML недостаточно.

```html
<!-- Tab компонент -->
<div role="tablist" aria-label="Product tabs">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">
    Description
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabindex="-1">
    Reviews
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Product description...
</div>
```

**Ключевые ARIA правила:**
- `aria-label` - человекочитаемый label для элементов без видимого текста
- `aria-labelledby` - ссылается на ID элемента-заголовка
- `aria-describedby` - дополнительное описание
- `aria-live="polite/assertive"` - динамическое объявление изменений (ошибки, загрузка)
- `aria-expanded`, `aria-selected`, `aria-current` - состояние интерактивных элементов

**Focus management:**
```javascript
// После закрытия модального окна - вернуть фокус
const previousFocus = document.activeElement;
modal.showModal();
// ...работа с модалкой...
modal.addEventListener('close', () => {
  previousFocus.focus(); // возвращаем фокус куда было
});

// Focus trap в модальном окне
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && e.shiftKey && e.target === firstFocusable) {
    e.preventDefault();
    lastFocusable.focus();
  }
});
```

**Screen reader только контент (sr-only):**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```
Для текста который должен быть прочитан screen reader но не виден: label кнопки-иконки, skip-link для клавиатурной навигации.

**Keyboard navigation:**
- Все интерактивные элементы должны быть доступны через Tab
- Tab order должен соответствовать визуальному порядку (избегайте `tabindex > 0`)
- Enter/Space - основные клавиши активации
- Escape - закрытие, отмена

> [!important]
> Accessibility - не фича, это базовая функциональность. Тестируйте: отключите мышь и пройдите по сайту только клавиатурой. Включите VoiceOver (Cmd+F5 на Mac) и попробуйте выполнить основные сценарии. Плагин axe DevTools для быстрого аудита. Внедрите a11y линтер (eslint-plugin-jsx-a11y) в CI - ловите ошибки до прода.

---

### 50. SEO for SPA: SSR, prerendering, dynamic rendering, meta tags

**Фундаментальная проблема SPA + SEO:** поисковые роботы приходят за HTML. SPA по умолчанию отдаёт пустой `<div id="root"></div>` и JS-бандл. Googlebot умеет рендерить JS (с 2019, на базе Chrome 74), но это медленно, ресурсозатратно и непредсказуемо.

**Подходы к решению:**

**1. SSR (Server-Side Rendering):**
Сервер рендерит страницу с данными, отдаёт полный HTML. Идеально для SEO.
```javascript
// Next.js App Router - RSC (React Server Components)
export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  // Рендерится на сервере, HTML содержит данные продукта
  return <ProductDetails product={product} />;
}
```
Минусы: стоимость инфраструктуры, задержка сервера (TTFB).

**2. Prerendering / SSG (Static Site Generation):**
HTML генерируется на билде, раздаётся как статика.
```javascript
// Next.js: getStaticPaths + getStaticProps
export async function getStaticPaths() {
  const products = await getProducts();
  return { paths: products.map(p => ({ params: { id: p.id } })), fallback: 'blocking' };
}
```
Подходит для контента который редко меняется. Не работает для миллионов страниц (слишком долгий билд).

**3. Dynamic Rendering:**
Сервер определяет, робот или пользователь (по User-Agent), и для роботов отдаёт пререндеренный HTML (Puppeteer/Playwright), а для пользователей - обычный SPA. Используется как временное решение, не рекомендуется как постоянное.

**4. Meta tags для всех подходов:**
```html
<title>Product Name - My Store</title>
<meta name="description" content="Buy Product Name for $29.99...">
<meta property="og:title" content="Product Name">
<meta property="og:image" content="https://example.com/product-image.jpg">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://example.com/product/123">
```

**Структурированные данные (JSON-LD):**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD"
  }
}
</script>
```
Обеспечивает rich results в поиске (цена, рейтинг, наличие). JSON-LD не зависит от JS-рендеринга - парсится из HTML напрямую.

> [!important]
> Googlebot рендерит JS, но с ЗАДЕРЖКОЙ (часы-дни для render queue). Не полагайтесь на это. SSR или SSG - единственные надёжные подходы для production SEO. Dynamic rendering - костыль, а не стратегия.

---

### 51. Internationalization (i18n) advanced

**i18n** - подготовка приложения к поддержке множества языков и культурных особенностей. Не просто перевод строк, а форматирование дат, чисел, валют, plural rules, RTL-поддержка.

**ICU MessageFormat (стандарт для сложных переводов):**
```
// ICU MessageFormat строка в JSON переводов
{
  "items_count": "{count, plural, =0 {No items} one {# item} other {# items}}",
  "gender_msg": "{gender, select, male {He} female {She} other {They}} liked this",
  "date_range": "{start, date, medium} - {end, date, medium}"
}
```
Обрабатывает plural rules (не `count === 1`, а Unicode CLDR plural rules - в русском one/few/many, в арабском другие), gender, select.

**RTL (Right-to-Left) поддержка:**
```css
/* Используйте логические свойства вместо физических */
.element {
  margin-inline-start: 16px;  /* вместо margin-left */
  padding-inline-end: 8px;    /* вместо padding-right */
  border-inline-start: 1px solid;  /* вместо border-left */
  inset-inline-start: 0;      /* вместо left: 0 */
}
/* При dir="rtl" на <html> эти свойства автоматически зеркалируются */
```

```html
<html dir="rtl" lang="ar">
```

**CSS logical properties для RTL:**
- `margin-inline-start/end` вместо `margin-left/right`
- `padding-inline-start/end` вместо `padding-left/right`
- `border-inline-start/end` вместо `border-left/right`
- `inset-inline-start/end` вместо `left/right`
- `text-align: start` вместо `text-align: left`
- `float: inline-start` вместо `float: left`

`dir="auto"` на элементах с пользовательским контентом автоматически определяет направление текста на основе первого "сильного" символа (буквы).

**Динамическая загрузка переводов:**
```javascript
// Загружаем только переводы для текущего языка
const locale = navigator.language; // 'ru-RU', 'en-US'
const messages = await import(`./locales/${locale}.js`);

// С fallback цепочкой: 'pt-BR' → 'pt' → 'en'
function resolveLocale(preferred) {
  const available = ['en', 'pt', 'pt-BR', 'ru'];
  if (available.includes(preferred)) return preferred;
  const base = preferred.split('-')[0];
  if (available.includes(base)) return base;
  return 'en'; // fallback
}
```

**Локализация дат, чисел, валют через Intl API:**
```javascript
const date = new Date();
new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(date);
// '6 мая 2026 г.'

new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(99.99);
// '99,99 €'  (европейский формат: запятая для десятичных, пробел для тысяч)

new Intl.RelativeTimeFormat('ru', { style: 'long' }).format(-3, 'day');
// '3 дня назад'

// List formatting
new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(['A', 'B', 'C']);
// 'A, B, and C'
```

**React i18n библиотеки сравнение:**

**react-intl (FormatJS):**
- Самый зрелый, основан на ICU MessageFormat
- Компоненты `<FormattedMessage>`, `<FormattedDate>`, `<FormattedNumber>`
- Плюсы: полная ICU поддержка, хорошая производительность с babel-plugin для extraction
- Минусы: большой bundle size, сложный setup

**next-intl:**
- Нативная интеграция с Next.js App Router
- Поддержка i18n routing, middleware для locale detection
- Плюсы: tree-shakable, type-safe, server components support
- Минусы: привязан к Next.js, не подходит для других фреймворков

**i18next:**
- Самая популярная библиотека, экосистема плагинов
- Поддержка backend (загрузка переводов с сервера), caching, interpolation
- Плюсы: гибкий, много плагинов, работает с любым фреймворком
- Минусы: свой формат (не ICU), требует адаптеров для React (react-i18next)

**Translation extraction workflow:**
1. Разметка строк в коде через i18n функции/компоненты
2. Extraction tool (i18next-parser, formatjs cli) сканирует код, генерирует JSON keys
3. Переводчики работают с JSON файлами (через Lokalise, Crowdin, Transifex)
4. CI проверяет что все keys переведены, нет orphaned keys
5. Переводы деплоятся как часть build pipeline

**Common pitfalls:**
- **Concatenation:** `"Hello " + name + ", you have " + count + " messages"` - не переводится. Используйте ICU: `"{greeting} {name}, you have {count, plural, one {# message} other {# messages}}"`
- **Context loss:** одно слово "Save" может быть глаголом (сохранить) или существительным (сейф). Используйте keys с контекстом: `"button.save"`, `"noun.save"`
- **Hardcoded dates/numbers:** всегда используйте Intl API, не форматируйте вручную
- **Font support:** не все шрифты поддерживают все языки. Используйте font fallback chains с Noto Sans как универсальный fallback
- **Layout expansion:** немецкий текст на 30% длиннее английского, арабский может быть короче. Дизайн должен выдерживать ±50% изменения длины текста

> [!info]
> i18n - это не про "добавить переводы в конце". Это архитектурное решение. Форматирование дат/чисел/валют через Intl (браузерный API, не нужны библиотеки), логические CSS-свойства для RTL-ready вёрстки, ICU MessageFormat для plural/select правил, динамическая загрузка переводов (не раздувать основной бандл).

---

> [!summary]
> Эти 50 вопросов покрывают ключевые знания Senior Frontend Developer о Web-платформе. Глубокое понимание безопасности (XSS, CSRF, CORS, CSP) критично, потому что фронтендер - первая линия защиты пользовательских данных. Знание HTTP и сетевых протоколов позволяет принимать обоснованные архитектурные решения. Понимание внутренностей браузера (Event Loop, Critical Rendering Path, composite layers) необходимо для решения сложных проблем производительности.
>
> Senior-уровень - это не про заучивание ответов, а про понимание tradeoffs: почему выбрали WebSocket вместо SSE, почему JWT в HttpOnly cookie а не localStorage, почему ISR а не SSG для конкретного проекта. Именно этого ждут на собеседовании.
