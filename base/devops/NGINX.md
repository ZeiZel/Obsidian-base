---
tags:
  - devops
  - nginx
  - load-balancing
  - reverse-proxy
title: NGINX
---

## Что такое NGINX и почему он быстрый

NGINX — веб-сервер, reverse proxy, load balancer, кэширующий прокси и TCP/UDP-прокси. Держит десятки тысяч одновременных соединений на скромном железе.

**Два типа процессов:**

```
          ┌──────────────┐
          │    Master    │  root: читает конфиг, открывает порты,
          │              │  управляет воркерами, ротация логов
          └──────┬───────┘
     ┌───────────┼───────────┐
     ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Worker 1 │ │ Worker 2 │ │ Worker N │  непривилегированные:
│ (epoll)  │ │ (epoll)  │ │ (epoll)  │  обрабатывают запросы
└──────────┘ └──────────┘ └──────────┘
```

**Почему быстрый:**

- Event-driven: один воркер в однопоточном цикле обслуживает тысячи соединений через `epoll` (Linux) / `kqueue` (BSD), переключаясь по готовности данных. Нет потока на соединение → нет переключений контекста и мегабайт стека на клиента.
- `sendfile()` — zero-copy отдача файлов без копирования в user space.
- Предсказуемое потребление памяти: воркеров фиксированное число, память растёт линейно от числа соединений, а не от числа потоков.

**Обратная сторона:** воркер однопоточный, поэтому любая блокирующая операция (медленный диск, DNS-резолв, тяжёлый Lua) стопорит все соединения этого воркера. Отсюда `aio threads`, отдельный `resolver` и запрет на блокирующий код в модулях.

**NGINX vs Apache.** Классический тезис «Apache = поток на соединение» верен для `prefork`/`worker` MPM; современный `event` MPM у Apache тоже событийный и разрыв уже не драматический. Реальная разница сегодня: Apache силён в `.htaccess`, per-directory конфигурации и встроенных интерпретаторах (`mod_php`); NGINX — в reverse proxy, статике, кэше и высоконагруженном edge. Для нового бэкенда почти всегда NGINX (или Envoy/Caddy/HAProxy — см. §2).

---

## Место в архитектуре (System Design)

### Где nginx стоит

```
Клиент → DNS → CDN (статика, edge-кэш)
              → Cloud LB / L4 (ALB, NLB, keepalived+VRRP)
                 → NGINX (L7: TLS, роутинг, кэш, rate limit, auth)
                    → Приложение (Go/Node/Java) → БД, Redis, Kafka
```

Типичные роли nginx:

1. **Edge / API gateway** — TLS-терминация, роутинг по домену и пути, rate limiting, security headers, кэш, статика.
2. **Балансировщик перед пулом инстансов** — L7 с health checks и retry.
3. **Ingress в Kubernetes** — тот же edge, но конфигурация генерируется контроллером (см. §23).
4. **Sidecar / локальный прокси** — реже, обычно здесь Envoy.
5. **L4-прокси** (`stream`) — TCP/UDP перед PostgreSQL, Redis, DNS, gRPC-пассsthrough.

### L4 vs L7

| |L4 (`stream`)|L7 (`http`)|
|---|---|---|
|Видит|IP, порт, TCP-поток, SNI (через `ssl_preread`)|метод, URI, заголовки, тело|
|Умеет|балансировать, TLS-терминацию/passthrough|роутинг по пути, кэш, rate limit, переписывание заголовков|
|Стоимость|минимальная, почти прозрачно|парсинг + буферизация|
|Когда|БД, очереди, произвольные протоколы, TLS-passthrough|HTTP/gRPC/WebSocket|

### Чем заменяют nginx и когда

|Инструмент|Сильная сторона|Когда брать вместо nginx|
|---|---|---|
|**HAProxy**|L4/L7-балансировка, богатые active health checks, отличная статистика|чистая балансировка с жёсткими требованиями к health checks и наблюдаемости|
|**Envoy**|динамическая конфигурация через xDS без reload, богатая телеметрия, основа service mesh (Istio)|микросервисы, mesh, canary/retry/outlier detection как первоклассные фичи|
|**Traefik**|авто-дискавери из Docker/k8s, авто-TLS|динамическая среда, где конфиг не хочется писать руками|
|**Caddy**|автоматический Let's Encrypt из коробки, простой конфиг|небольшие сервисы, где TLS-автоматизация важнее тонкой настройки|
|**Cloud LB (ALB/NLB, GCLB)**|managed, масштабируется сам, интеграция с WAF/ACM|когда не хочется владеть слоем балансировки|
|**CDN (Cloudflare, Fastly)**|кэш и защита на edge ближе к пользователю|статика, DDoS, глобальная аудитория|

NGINX выигрывает, когда нужен один компонент, который хорошо делает всё сразу: TLS + статика + кэш + прокси + rate limit, с конфигом в git и без внешних зависимостей.

### Отказоустойчивость и ёмкость

- **nginx сам по себе — точка отказа.** Минимум два инстанса: VIP через keepalived/VRRP, или облачный L4-балансировщик перед ними, или DaemonSet в k8s за Service type=LoadBalancer.
- **Ёмкость:** `worker_processes × worker_connections` — верхняя граница соединений. При проксировании одно клиентское соединение съедает **два** дескриптора (клиент + бэкенд), поэтому `worker_rlimit_nofile ≥ worker_connections × 2`.
- **Stateless.** Конфигурация nginx не хранит состояние сессий (кроме shared-зон кэша и лимитов, локальных для инстанса). Поэтому rate limit на двух инстансах считается независимо — реальный лимит удваивается. Для точного глобального лимита нужен внешний счётчик (Redis) на уровне приложения.

## Версии: что изменилось и почему это важно

- **1.30.x — текущая stable** (апрель 2026). Принесла из ветки 1.29: Early Hints (103), HTTP/2 к бэкенду, Encrypted ClientHello, **sticky sessions для upstream в open source**, Multipath TCP, и — важное для конфигов — **версия HTTP к проксируемому серверу по умолчанию теперь 1.1 с включённым keep-alive**.
- **1.31.x — mainline**: добавлены метод балансировки `least_time` и **поддержка HTTP forward proxy** в open source.
- Практические следствия для старых конспектов:
    - `proxy_http_version 1.1;` больше не обязателен для keepalive к upstream (но `proxy_set_header Connection "";` при использовании пула `keepalive` всё ещё нужен, и явное указание версии не вредит).
    - Sticky sessions больше не только в Plus.
    - Активные health checks — **по-прежнему только NGINX Plus**; в open source только пассивные (`max_fails`/`fail_timeout`).
- Обновляйтесь: в 1.30.x за 2026 год закрыт ряд CVE (rewrite-модуль, HTTP/2-инъекция в proxy, slice, charset). Пин на старую минорную версию в Dockerfile — это накопление уязвимостей.

## Установка и управление процессом

```bash
# Ubuntu/Debian — официальный репозиторий nginx.org
curl -fsSL https://nginx.org/keys/nginx_signing.key \
  | sudo gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" \
  | sudo tee /etc/apt/sources.list.d/nginx.list
sudo apt update && sudo apt install nginx
```

Сборка из исходников нужна только ради сторонних модулей (brotli, geoip2, ModSecurity, njs) или конкретного OpenSSL. Альтернатива — динамические модули (`--add-dynamic-module` + `load_module`), чтобы не пересобирать всё.

### Управление

```bash
nginx -t                 # проверить синтаксис — ВСЕГДА перед reload
nginx -T                 # вывести полный развёрнутый конфиг (все include)
nginx -V                 # версия + флаги сборки + список модулей
nginx -s reload          # graceful: применить новый конфиг без разрыва соединений
nginx -s quit            # graceful shutdown: дождаться завершения запросов
nginx -s stop            # немедленно, рвёт соединения
nginx -s reopen          # переоткрыть логи (для logrotate)
```

**Что происходит при `reload`:**

1. Master читает и валидирует новый конфиг. Ошибка → старые воркеры продолжают работать со старым конфигом, новый не применяется. Поэтому `nginx -t` обязателен: без него сломанный конфиг может тихо не примениться.
2. Master запускает новые воркеры с новым конфигом.
3. Старым воркерам шлётся сигнал «завершиться мягко»: они перестают принимать новые соединения и доживают текущие.
4. Старые воркеры висят, пока не закроются keep-alive и long-lived соединения (WebSocket!). Ограничивается `worker_shutdown_timeout 30s;` — без него после частых reload у вас будет зоопарк старых воркеров, жрущих память.

**Обновление бинарника без даунтайма:** `kill -USR2 <master_pid>` (поднять новый master), `kill -WINCH <old_master>` (мягко погасить старые воркеры), затем `QUIT` старому master или `HUP` для отката.

**Ротация логов:** logrotate + `kill -USR1` (или `nginx -s reopen`) в `postrotate`.

```
/var/log/nginx/*.log {
    daily missingok rotate 30 compress delaycompress notifempty
    create 0640 nginx adm sharedscripts
    postrotate
        [ -f /run/nginx.pid ] && kill -USR1 $(cat /run/nginx.pid)
    endscript
}
```

## Структура конфигурации

Контексты и наследование: `main → events / http → server → location`. Директива из `http` наследуется во все `server`, из `server` — во все `location`; более специфичный контекст переопределяет.

```nginx
# main
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 16384;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    # ... общие настройки
    include /etc/nginx/conf.d/*.conf;   # по файлу на сайт/сервис
}

stream {          # L4 TCP/UDP — отдельный от http контекст
    # ...
}
```

**Раскладка файлов:** `nginx.conf` — только глобальное; `conf.d/<service>.conf` — по серверу на сервис; `snippets/` — переиспользуемые куски (`include snippets/proxy-headers.conf;`, `include snippets/ssl.conf;`). Не дублируйте `proxy_set_header` в двадцати местах.

**Важно про наследование:** `add_header`, `proxy_set_header`, `limit_req` и ряд других директив **не аддитивны**: если задать хоть одну в дочернем контексте, все унаследованные того же типа перестают действовать. Это причина №1 «почему пропали мои security headers в /api» (см. §16).

---

## Как nginx обрабатывает запрос

### Выбор `server`

1. Отбираются все `server` с совпадающей парой `IP:port` из `listen`.
2. Среди них ищется совпадение `server_name` с заголовком `Host`: точное имя → маска `*.example.com` → маска `mail.*` → регулярка (в порядке появления).
3. Нет совпадений → `default_server` для этого порта.
4. Нет `default_server` → первый `server` в конфиге.

Полезный дефолт-заглушка, чтобы не отдавать случайный сайт по IP:

```nginx
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    ssl_certificate     /etc/nginx/ssl/dummy.crt;   # для 443 сертификат обязателен
    ssl_certificate_key /etc/nginx/ssl/dummy.key;
    return 444;   # nginx-специфичный: закрыть соединение без ответа
}
```

### Выбор `location` — точный алгоритм

```nginx
location = /health            { }   # 1. exact
location ^~ /static/          { }   # 2. preferential prefix (regex не проверяются)
location ~ \.php$             { }   # 3. regex, case-sensitive
location ~* \.(jpg|png|webp)$ { }   # 4. regex, case-insensitive
location /api/                { }   # 5. prefix
location /                    { }   #    fallback
```

1. Проверяются все prefix-локейшены, запоминается **самый длинный** совпавший.
2. Если он с ` = ` — используется он, поиск прекращается.
3. Если он с `^~` — используется он, регулярки не проверяются.
4. Иначе проверяются regex-локейшены **в порядке их появления в конфиге**; первый совпавший побеждает.
5. Если ни одна регулярка не совпала — используется запомненный самый длинный prefix.

Отсюда практика: `location = /health` для health-чека (самый быстрый матч), `^~ /static/` чтобы статика не проходила через дорогие регулярки.

### 6.3 Фазы обработки запроса

Понимание фаз объясняет большинство «магических» багов:

```
POST_READ      → realip (set_real_ip_from)
SERVER_REWRITE → rewrite на уровне server
FIND_CONFIG    → выбор location
REWRITE        → rewrite/set/if внутри location
POST_REWRITE   → перезапуск цикла, если URI изменился
PREACCESS      → limit_req, limit_conn, degradation
ACCESS         → allow/deny, auth_basic, auth_request
TRY_FILES      → try_files
CONTENT        → proxy_pass / fastcgi_pass / root / return
LOG            → access_log
```

Следствия:

- `realip` отрабатывает раньше `limit_req` — поэтому лимиты считаются по реальному IP клиента, но **только если** realip настроен (§9.2).
- `if` внутри `location` работает на фазе REWRITE, **до** выбора content-хендлера, поэтому `if` + `proxy_pass` даёт неинтуитивные результаты.
- `limit_req` срабатывает до `auth_request` — лимит применяется к неаутентифицированным запросам тоже (обычно это то, что нужно).

### 6.4 rewrite, return, try_files, if

```nginx
# return — самый дешёвый способ. Используйте его, когда можно.
return 301 https://$host$request_uri;
return 200 "ok";
return 444;                       # закрыть соединение без ответа

# rewrite regex replacement [flag]
rewrite ^/old/(.*)$ /new/$1 permanent;   # 301 клиенту
rewrite ^/old/(.*)$ /new/$1 redirect;    # 302 клиенту
rewrite ^/api/v1/(.*)$ /$1 break;        # переписать URI, остаться в этом location
rewrite ^/api/v1/(.*)$ /$1 last;         # переписать и заново искать location
```

- `last` → новый цикл поиска location (максимум 10 итераций, потом 500).
- `break` → остановить обработку rewrite-директив, остаться здесь.
- Без флага → продолжить выполнение следующих rewrite в этом блоке.

**«If is evil».** Внутри `location` безопасны только два случая: `return ...` и `rewrite ... last`. Всё остальное (особенно `if` + `proxy_pass`, `if` + `add_header`) ведёт себя непредсказуемо, потому что `if` создаёт вложенный конфигурационный контекст. Вместо `if` используйте `map`, `try_files`, отдельные `location`. В контексте `server` (например, `if ($blocked) { return 403; }`) это приемлемо.

**try_files и именованные локейшены:**

```nginx
location / {
    try_files $uri $uri/ /index.html;         # SPA
}

location / {
    try_files $uri @backend;                  # статика, иначе на бэкенд
}
location @backend {                           # именованный location
    proxy_pass http://app;
}
```

**Кастомные ошибки:**

```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;
location = /50x.html { root /usr/share/nginx/html; internal; }

# Перехватывать коды ошибок ОТ БЭКЕНДА и отдавать свои страницы
proxy_intercept_errors on;

# Фоллбэк на другой location при ошибке
error_page 502 503 504 = @maintenance;
location @maintenance { return 503 "under maintenance"; }
```

---

## 7. Переменные, map, split_clients, geo

### map — вычисляемые переменные

`map` объявляется **только в контексте `http`** (частая ошибка — засунуть его в `server`; конфиг не пройдёт `nginx -t`). Вычисляется лениво, при первом обращении.

```nginx
http {
    # WebSocket upgrade
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    # Белый список для rate limit: пустой ключ = лимит не применяется
    map $remote_addr $limit_key {
        default        $binary_remote_addr;
        10.0.0.0/8     "";
        192.168.0.0/16 "";
    }

    # CORS: отражать только доверенные Origin
    map $http_origin $cors_origin {
        default "";
        ~^https://(.+\.)?example\.com$ $http_origin;
    }

    # Не логировать health checks и метрики
    map $request_uri $loggable {
        ~*^/health  0;
        ~*^/metrics 0;
        default     1;
    }
}
```

### split_clients — canary и A/B

Детерминированное разбиение трафика по хешу ключа:

```nginx
http {
    split_clients "${remote_addr}${http_user_agent}" $variant {
        5%   "canary";     # 5% на новую версию
        *    "stable";
    }

    map $variant $backend_pool {
        canary  http://backend_v2;
        default http://backend_v1;
    }

    server {
        location / { proxy_pass $backend_pool; }
    }
}
```

Канареечный деплой по заголовку (для ручного тестирования) — через `map`:

```nginx
map $http_x_canary $backend_pool {
    "1"     http://backend_v2;
    default http://backend_v1;
}
```

### geo — переменные по IP

```nginx
geo $blocked {
    default        0;
    10.0.0.0/8     0;
    203.0.113.0/24 1;
}
server {
    if ($blocked) { return 403; }
}
```

GeoIP2 (модуль `ngx_http_geoip2_module` + база MaxMind) даёт страну/город:

```nginx
geoip2 /usr/share/GeoIP/GeoLite2-Country.mmdb {
    $geoip2_country_code country iso_code;
}
map $geoip2_country_code $allowed_country { default yes; XX no; }
```

### Полезные встроенные переменные

`$remote_addr`, `$http_*`, `$args`, `$request_uri` (исходный, с query), `$uri` (нормализованный, после rewrite), `$scheme`, `$host`, `$request_id` (уникальный ID запроса), `$request_time`, `$upstream_addr`, `$upstream_status`, `$upstream_response_time`, `$upstream_connect_time`, `$upstream_cache_status`, `$ssl_protocol`, `$ssl_client_s_dn`.

---

## 8. Статика

### root vs alias

```nginx
location /static/ {
    root /var/www;            # путь = root + URI → /var/www/static/app.js
}
location /files/ {
    alias /var/www/static/;   # путь = alias + остаток → /var/www/static/app.js
}
```

Правило: с `alias` всегда следите за слэшами и **не используйте `alias` внутри regex-location** без явного capture — источник path traversal.

### Кэширование и отдача

```nginx
server {
    root /var/www/app;

    location / {
        try_files $uri $uri/ /index.html;   # SPA
    }

    # Ассеты с хешем в имени — неизменяемые
    location ~* \.(js|css|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(jpg|jpeg|png|gif|svg|webp|avif)$ {
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }
}
```

### I/O и сжатие

```nginx
http {
    sendfile on;            # zero-copy отдача файлов
    tcp_nopush on;          # заголовки + начало файла одним пакетом (только с sendfile)
    tcp_nodelay on;         # отключить Nagle: важно для keep-alive и WebSocket
    aio threads;            # асинхронный I/O через пул потоков (предпочтительнее "aio on")

    # Кэш метаданных открытых файлов
    open_file_cache max=10000 inactive=60s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    gzip on;
    gzip_min_length 1024;       # мелочь сжимать бессмысленно
    gzip_comp_level 5;          # 4–6 — баланс CPU/размер
    gzip_vary on;               # Vary: Accept-Encoding — обязательно для CDN
    gzip_proxied any;
    gzip_types text/plain text/css text/xml application/json
               application/javascript application/xml image/svg+xml;
    gzip_static on;             # отдать app.js.gz, если он лежит рядом

    # Brotli (модуль ngx_brotli, собирается отдельно) — на 15–20% лучше gzip
    # brotli on;
    # brotli_static on;
    # brotli_types ...;
}
```

### X-Accel-Redirect — приватные файлы через nginx

Классический паттерн: бэкенд проверяет права, а сам файл (гигабайты видео) отдаёт nginx, не занимая воркер приложения.

```nginx
location /protected/ {
    internal;                       # напрямую снаружи недоступно
    alias /var/storage/private/;
}
```

Приложение отвечает `200` с заголовком `X-Accel-Redirect: /protected/file.mp4` и пустым телом — nginx подменяет ответ содержимым файла.

---

## 9. Reverse proxy

### 9.1 Базовая конфигурация

```nginx
# snippets/proxy.conf
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host  $host;
proxy_set_header X-Request-ID      $request_id;   # сквозная трассировка

proxy_connect_timeout 5s;     # установка TCP-соединения — должен быть коротким
proxy_send_timeout    30s;    # отправка запроса
proxy_read_timeout    60s;    # ожидание ответа (не всего ответа, а паузы между чтениями)

proxy_next_upstream error timeout http_502 http_503;
proxy_next_upstream_tries 2;
proxy_next_upstream_timeout 10s;
```

```nginx
location / {
    proxy_pass http://backend;
    include snippets/proxy.conf;
}
```

**Слэш в `proxy_pass`:**

|Конфигурация|Запрос|Уйдёт на бэкенд как|
|---|---|---|
|`location /api/ { proxy_pass http://b:8080/; }`|`/api/users`|`/users` (префикс заменён)|
|`location /api/ { proxy_pass http://b:8080; }`|`/api/users`|`/api/users` (URI как есть)|

**Осторожно с `proxy_next_upstream`:** по умолчанию nginx не повторяет неидемпотентные запросы (POST/PATCH/LOCK). Если добавить ключевое слово `non_idempotent` — повтор POST приведёт к дублю платежа/заказа. Делайте это только если бэкенд идемпотентен по `Idempotency-Key`.

### 9.2 realip — критически важно

Когда nginx стоит за облачным LB, CDN или другим прокси, `$remote_addr` — это IP прокси, а не клиента. Последствия: в логах бесполезные адреса, geo-блокировка не работает, а **`limit_req_zone $binary_remote_addr` лимитирует весь трафик как один клиент**.

```nginx
# Доверяем только своим прокси/подсетям CDN
set_real_ip_from 10.0.0.0/8;
set_real_ip_from 172.16.0.0/12;
set_real_ip_from 173.245.48.0/20;     # пример: подсеть CDN
real_ip_header   X-Forwarded-For;
real_ip_recursive on;                  # взять последний недоверенный IP из цепочки
```

Обратная сторона: **никогда не доверяйте `X-Forwarded-For` от произвольного источника**. Если `set_real_ip_from` шире, чем ваши реальные прокси, любой клиент подделает заголовок и обойдёт rate limit и блокировки.

Для L4 (когда перед nginx стоит TCP-балансировщик) правильный способ — PROXY protocol:

```nginx
server {
    listen 443 ssl proxy_protocol;
    set_real_ip_from 10.0.0.0/8;
    real_ip_header proxy_protocol;
}
```

### 9.3 Буферизация

```nginx
proxy_buffering on;              # дефолт: nginx вычитывает ответ бэкенда в буферы
proxy_buffer_size 8k;            # буфер под заголовки ответа
proxy_buffers 8 16k;             # буферы под тело
proxy_busy_buffers_size 32k;     # сколько можно отдавать клиенту, пока остальное читается
proxy_max_temp_file_size 1024m;  # 0 = запретить сброс на диск
```

Буферизация нужна, чтобы медленный клиент не держал соединение с бэкендом («slow client attack»): nginx быстро забирает ответ, освобождает воркер приложения и раздаёт клиенту сам.

**Но она ломает стриминг.** Для Server-Sent Events, стриминга LLM-ответов,длинных `text/event-stream`:

```nginx
location /events {
    proxy_pass http://backend;
    proxy_buffering off;          # отдавать по мере поступления
    proxy_cache off;
    proxy_read_timeout 1h;
    chunked_transfer_encoding on;
}
```

Альтернатива без правки nginx: бэкенд отдаёт заголовок `X-Accel-Buffering: no` — nginx отключит буферизацию для этого ответа.

**Загрузка файлов:** тело запроса больше `client_body_buffer_size` пишется во временный файл на диск. Для потоковой загрузки в бэкенд:

```nginx
location /upload {
    proxy_request_buffering off;   # стримить тело сразу в бэкенд
    client_max_body_size 5g;
    proxy_pass http://backend;
}
```

### 9.4 HTTPS-бэкенды и unix-сокеты

```nginx
location / {
    proxy_pass https://secure-backend;
    proxy_ssl_verify on;                                  # по умолчанию OFF (!)
    proxy_ssl_trusted_certificate /etc/nginx/ssl/ca.pem;
    proxy_ssl_name backend.internal;                      # SNI
    proxy_ssl_server_name on;
    proxy_ssl_session_reuse on;
    # mTLS к бэкенду:
    proxy_ssl_certificate     /etc/nginx/ssl/client.crt;
    proxy_ssl_certificate_key /etc/nginx/ssl/client.key;
}
```

Unix-сокет вместо TCP на том же хосте экономит сетевой стек:

```nginx
upstream app { server unix:/run/app.sock; }
```

---

## 10. WebSocket, gRPC, HTTP/2, HTTP/3

### WebSocket

```nginx
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout  3600s;    # иначе соединение порвётся по таймауту
    proxy_send_timeout  3600s;
}
```

Помните: долгоживущие соединения продлевают жизнь старых воркеров при `reload` — ставьте `worker_shutdown_timeout`.

### gRPC

```nginx
upstream grpc_backend {
    server app1:50051;
    server app2:50051;
    keepalive 32;
}

server {
    listen 443 ssl;
    http2 on;                      # gRPC требует HTTP/2

    location / {
        grpc_pass grpc://grpc_backend;        # grpcs:// для TLS к бэкенду
        grpc_set_header X-Real-IP $remote_addr;
        grpc_read_timeout 300s;
        grpc_send_timeout 300s;
    }

    # Отдельный роут на конкретный сервис
    location /wallet.v1.WalletService/ {
        grpc_pass grpc://wallet_backend;
    }
}
```

Почему это важно: gRPC держит **долгоживущие HTTP/2-соединения**, и обычная L4-балансировка (или k8s Service) закрепляет клиента за одним подом навсегда — нагрузка перекашивается. L7-балансировка nginx/Envoy распределяет отдельные gRPC-стримы, а не соединения. Это стандартный вопрос на собеседовании по микросервисам.

### HTTP/2 и HTTP/3

```nginx
server {
    listen 443 ssl;
    http2 on;                       # директива http2 (с 1.25.1), не параметр listen

    listen 443 quic reuseport;      # HTTP/3, нужен --with-http_v3_module
    http3 on;
    add_header Alt-Svc 'h3=":443"; ma=86400' always;   # анонс поддержки h3

    ssl_protocols TLSv1.2 TLSv1.3;
}
```

Для QUIC нужно открыть **UDP/443** в фаерволе — забывают постоянно. HTTP/2 даёт мультиплексирование (нет head-of-line blocking на уровне HTTP), HTTP/3 переносит это на QUIC поверх UDP, убирая HOL-блокировку на уровне TCP — заметнее всего на плохих мобильных сетях.

---

## 11. Load balancing

```nginx
upstream backend {
    # --- алгоритм (по умолчанию round robin) ---
    least_conn;                 # на сервер с наименьшим числом активных соединений
    # least_time header;        # 1.31+: минимальное время ответа + активные соединения
    # ip_hash;                  # закрепление клиента по IP
    # hash $request_uri consistent;   # произвольный ключ, consistent hashing
    # random two least_conn;    # 2 случайных, из них менее загруженный

    server 10.0.1.10:8080 weight=3;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=30s max_conns=100;
    server 10.0.1.13:8080 backup;   # только если все основные недоступны
    server 10.0.1.14:8080 down;     # выведен вручную

    keepalive 32;               # пул idle-соединений к бэкендам НА КАЖДЫЙ воркер
    keepalive_requests 1000;
    keepalive_timeout 60s;

    zone backend_zone 64k;      # shared memory: общее состояние для всех воркеров
}

server {
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";   # обязательно при использовании keepalive
    }
}
```

### Выбор алгоритма

|Алгоритм|Когда|
|---|---|
|round robin|бэкенды одинаковые, запросы однородные — дефолт|
|`least_conn`|запросы разной длительности (часть долгих)|
|`least_time`|бэкенды разной мощности или нестабильная сеть (1.31+)|
|`hash $key consistent`|нужна привязка к серверу по ключу (шардирование кэша) с минимальной перебалансировкой при изменении пула|
|`ip_hash`|примитивная привязка сессии; ломается за NAT и CDN|
|`random two least_conn`|большие пулы, где полный обход списка дорог («power of two choices»)|

### Sticky sessions

С 1.30 доступны в open source. Но сначала честный ответ: **sticky — это костыль**. Правильное решение — сделать приложение stateless и хранить сессии в Redis/JWT. Прилипание ломает равномерность нагрузки, мешает выводу инстанса из ротации и превращает падение одного пода в потерю сессий его пользователей. Используйте, только если переписать приложение нельзя.

### Health checks

- **Пассивные (open source):** `max_fails=3 fail_timeout=30s` — сервер выводится из ротации после N неудач в окне и возвращается через `fail_timeout`. Ключевое ограничение: они реагируют **только на реальный трафик**. Упавший бэкенд при низком RPS обнаружится нескоро, а первые N запросов всё равно получат ошибку.
- **Активные (`health_check`) — только NGINX Plus.** В open source альтернативы: `nginx_upstream_check_module` (Tengine), внешний скрипт, перегенерирующий upstream, или Consul-template. В Kubernetes эту роль берёт на себя readinessProbe: не готовый под просто исчезает из Endpoints.

### Динамический DNS — самая частая продовая ловушка

Имена в `upstream` резолвятся **один раз при старте/reload**. В Docker/Kubernetes контейнер перезапустился, IP сменился — nginx продолжает долбиться в старый адрес и отдаёт 502, пока его не перезагрузят.

```nginx
# Вариант 1: переменная в proxy_pass заставляет резолвить в рантайме
server {
    resolver 127.0.0.11 valid=10s ipv6=off;   # 127.0.0.11 — DNS Docker; в k8s — kube-dns
    resolver_timeout 3s;

    location / {
        set $upstream http://app-service:3000;
        proxy_pass $upstream;
    }
}
```

Важный побочный эффект: при переменной в `proxy_pass` nginx **не нормализует URI автоматически** — часто нужно дописывать `$request_uri` вручную. Вариант 2 — `resolve` в `server` внутри `upstream` (NGINX Plus) или внешний генератор конфига.

---

## 12. Кэширование ответов

```nginx
http {
    proxy_cache_path /var/cache/nginx/app
        levels=1:2                 # двухуровневая иерархия каталогов
        keys_zone=app_cache:10m    # shared memory под ключи (~80k ключей на 10m)
        max_size=10g               # лимит на диске
        inactive=60m               # удалять, если не обращались 60 минут
        use_temp_path=off;         # писать сразу в целевой каталог

    server {
        location / {
            proxy_pass http://backend;
            proxy_cache app_cache;

            proxy_cache_key "$scheme$request_method$host$request_uri";
            proxy_cache_valid 200 302 10m;
            proxy_cache_valid 404 1m;
            proxy_cache_min_uses 2;         # кэшировать со 2-го запроса

            # Обход кэша
            proxy_cache_bypass $http_cache_control $cookie_nocache;
            proxy_no_cache $http_pragma;

            # Отдавать протухшее, если бэкенд лёг — graceful degradation
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            proxy_cache_background_update on;   # обновлять в фоне, клиенту отдавать stale
            proxy_cache_lock on;                # только один запрос идёт на бэкенд
            proxy_cache_lock_timeout 5s;        # остальные ждут → защита от stampede

            proxy_cache_revalidate on;          # условные запросы по ETag/Last-Modified

            add_header X-Cache-Status $upstream_cache_status always;  # HIT/MISS/BYPASS/EXPIRED/STALE/UPDATING
        }
    }
}
```

**Ловушки, которые ловят все:**

1. **`Set-Cookie` от бэкенда отключает кэширование ответа целиком.** Если бэкенд шлёт сессионную куку на каждый ответ, кэш просто не работает. Лечение — убедиться, что бэкенд не шлёт куку для кэшируемых роутов, либо:
    
    ```nginx
    proxy_ignore_headers Set-Cookie Cache-Control Expires X-Accel-Expires;proxy_hide_header Set-Cookie;     # ОПАСНО: убедитесь, что ответ реальнопубличный
    ```
    
2. **`Cache-Control: no-store/private` от бэкенда** тоже отключает кэш — по умолчанию nginx его уважает.
3. **`Vary`**: если бэкенд отдаёт `Vary: Accept-Encoding`, nginx хранит отдельные копии. `Vary: *` — кэширование отключается.
4. **Ключ кэша.** Дефолт — `$scheme$proxy_host$request_uri`. Если ответ зависит от пользователя, а ключ его не учитывает, вы отдадите чужие данные. Если зависит от языка — добавьте `$http_accept_language`. Никогда не кэшируйте персонализированные ответы без `$cookie_session` в ключе (а лучше вообще не кэшируйте).
5. **Инвалидация.** `proxy_cache_purge` — только в Plus; в open source — сторонний `ngx_cache_purge` или удаление файлов из каталога кэша. На практике проще управлять через `proxy_cache_valid` и версионирование URL.
6. **Большие файлы и Range-запросы** — модуль `slice`: режет объект на куски и кэширует их отдельно, иначе один Range-запрос вытянет и закэширует весь гигабайтный файл.

Диагностика всегда через `X-Cache-Status` — без него отладка кэша превращается в гадание.

---

## 13. Rate limiting и защита

```nginx
http {
    # $binary_remote_addr — 4 байта вместо 7–15 у $remote_addr; 10m ≈ 160k IP
    limit_req_zone $limit_key zone=general:10m rate=30r/s;
    limit_req_zone $limit_key zone=api:10m     rate=10r/s;
    limit_req_zone $limit_key zone=login:10m   rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    limit_req_status 429;
    limit_conn_status 429;
    # limit_req_dry_run on;    # считать и логировать, но не блокировать — для обкатки лимитов

    server {
        location / {
            limit_req zone=general burst=20 nodelay;
            limit_conn addr 100;
        }
        location /api/ {
            limit_req zone=api burst=10 nodelay;
        }
        location = /api/auth/login {
            limit_req zone=login burst=3;         # без nodelay: запросы ставятся в очередь
        }
        # Ограничение скорости отдачи (например, для скачивания)
        location /downloads/ {
            limit_rate_after 10m;
            limit_rate 1m;
        }
    }
}
```

**`burst` и `nodelay`.** Алгоритм — leaky bucket. `burst=20` создаёт очередь на 20 запросов сверх rate. Без `nodelay` избыточные запросы **задерживаются**, выравниваясь под rate (клиент ждёт). С `nodelay` они выполняются мгновенно, но «токены» тратятся, и следующие сверх burst получают 429. Есть промежуточный вариант `delay=5`: первые 5 из burst — без задержки, остальные с задержкой.

**Важно:** `limit_req` считает по `$binary_remote_addr`, который за прокси будет адресом прокси — сначала настройте realip (§9.2), иначе лимит либо не работает, либо режет всех.

**Помните про распределённость:** на трёх инстансах nginx лимит фактически утраивается — зоны локальны для процесса (в open source; синхронизация зон есть только в Plus).

Дополнительно: `limit_except` (разрешить только определённые методы), `allow`/`deny` для админок, `auth_basic` для внутренних тулов, ModSecurity/Coraza как WAF, `client_body_timeout`/`client_header_timeout` против Slowloris.

---

## 14. TLS

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;    # для TLS1.3 актуален выбор клиента
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Возобновление сессий: снижает latency повторных подключений
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets on;
    # Тикеты безопасны при регулярной ротации ключа (ssl_session_ticket_key + перезапуск).
    # Отключать их стоит, только если ротацию организовать нельзя: в TLS 1.3 это
    # полностью убивает resumption и 0-RTT. Forward secrecy обеспечивает ECDHE, не это.

    ssl_stapling on;                  # OCSP stapling: nginx сам получает статус сертификата
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

server {                              # редирект HTTP → HTTPS
    listen 80;
    server_name example.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }   # для ACME
    location / { return 301 https://$host$request_uri; }
}
```

**Автоматизация сертификатов:** certbot с `--nginx` или `--webroot`, acme.sh, cert-manager в k8s, либо модуль `nginx-acme` (получение сертификатов силами самого nginx). Проверьте, что renew hook делает `nginx -s reload`.

**HSTS preload** добавляйте только осознанно: `preload` в списке браузеров откатить почти невозможно, и весь домен с поддоменами навсегда останется HTTPS-only.

### mTLS (взаимная аутентификация)

```nginx
server {
    listen 443 ssl;
    ssl_client_certificate /etc/nginx/ssl/ca.pem;   # CA, которым подписаны клиенты
    ssl_verify_client on;                            # или optional
    ssl_verify_depth 2;
    ssl_crl /etc/nginx/ssl/crl.pem;

    location / {
        proxy_pass http://backend;
        proxy_set_header X-Client-DN     $ssl_client_s_dn;
        proxy_set_header X-Client-Verify $ssl_client_verify;
        proxy_set_header X-Client-Serial $ssl_client_serial;
    }
}
```

Это типовой способ аутентификации service-to-service и партнёрских интеграций.

### TLS passthrough (не терминировать TLS на nginx)

Когда сертификат должен оставаться на бэкенде — L4 с чтением SNI без расшифровки:

```nginx
stream {
    map $ssl_preread_server_name $upstream_pool {
        api.example.com   api_backend;
        admin.example.com admin_backend;
        default           default_backend;
    }
    upstream api_backend { server 10.0.1.10:443; }

    server {
        listen 443;
        ssl_preread on;            # прочитать SNI из ClientHello
        proxy_pass $upstream_pool;
    }
}
```

---

## 15. Аутентификация и делегирование

### auth_request — внешний сервис авторизации

nginx делает подзапрос к auth-сервису; `2xx` → пропустить, `401/403` → отклонить. Позволяет вынести проверку JWT/сессии в один сервис и не дублировать её в каждом бэкенде.

```nginx
location /private/ {
    auth_request /_auth;

    # Забрать данные из ответа auth-сервиса и передать бэкенду
    auth_request_set $user_id $upstream_http_x_user_id;
    proxy_set_header X-User-Id $user_id;

    proxy_pass http://backend;
}

location = /_auth {
    internal;
    proxy_pass http://auth-service/verify;
    proxy_pass_request_body off;           # тело не нужно
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header X-Original-Method $request_method;
}
```

Цена: **дополнительный подзапрос на каждый запрос** — auth-сервис должен быть быстрым (кэш в Redis) и рядом. Валидация JWT нативно есть только в Plus (`auth_jwt`); в open source — njs или auth_request.

Для внутренних тулов достаточно `auth_basic` + `auth_basic_user_file` (htpasswd).

---

## 16. Заголовки безопасности и CORS

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'" always;
server_tokens off;     # скрыть версию nginx
```

**Главная ловушка:** `add_header` **не наследуется аддитивно**. Если в `location` появился хоть один `add_header`, все `add_header` из `server`/`http` для этого location перестают действовать. Решения:

- держать заголовки в `snippets/security-headers.conf` и `include` в каждый location;
- модуль `headers-more` (`more_set_headers`), который лишён этой семантики.

Флаг `always` заставляет отдавать заголовок и для ошибочных кодов (4xx/5xx) — без него заголовки пропадут на страницах ошибок.

### CORS с preflight

```nginx
map $http_origin $cors_origin {
    default "";
    ~^https://(.+\.)?example\.com$ $http_origin;
}

location /api/ {
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin      $cors_origin always;
        add_header Access-Control-Allow-Methods     "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers     "Authorization, Content-Type, X-Request-Id" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age           86400 always;
        add_header Content-Length 0;
        return 204;
    }

    add_header Access-Control-Allow-Origin      $cors_origin always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Vary Origin always;      # иначе кэш отдаст чужой Origin

    proxy_pass http://backend;
}
```

Никогда не сочетайте `Access-Control-Allow-Origin: *` с `Allow-Credentials: true` — браузер отклонит, а если бы принял, это была бы дыра.

---

## 17. Forward proxy (прямой прокси)

Reverse proxy защищает **серверы**, forward proxy обслуживает **клиентов**, регулируя их доступ наружу (корпоративный egress, фильтрация, аудит).

**Историческая правда:** nginx для этого не предназначался. Варианты по состоянию на 2026:

**1. HTTP (без CONNECT) — костыль, работает давно:**

```nginx
server {
    listen 3128;
    resolver 1.1.1.1 ipv6=off;
    location / {
        proxy_pass http://$http_host$request_uri;
        proxy_set_header Host $http_host;
    }
}
```

Только plain HTTP. HTTPS так не проксируется — клиент шлёт `CONNECT`, а nginx его не понимает.

**2. HTTPS через CONNECT:**

- **NGINX Plus (R36+)**: штатная директива `tunnel_pass` — включает CONNECT-туннель в `server`/`location`. Требует `resolver`; по умолчанию туннелирует на `$host:$request_port`; доступ обязательно ограничивают через `geo`/`allow`. Остальные методы (GET/POST) в этом режиме нужно явно запрещать.
    
    ```nginx
    server {    listen 10.10.1.11:3128;    resolver 1.1.1.1;    tunnel_pass;}
    ```
    
- **Open source, mainline 1.31.0+**: поддержка HTTP forward proxy добавлена в ядро.
- **Open source, старые версии**: сторонний модуль `ngx_http_proxy_connect_module` (chobits) — требует пересборки.

**3. L4 / прозрачный прокси** через `stream` + `ssl_preread`: получить SNI из ClientHello и проксировать TCP без расшифровки и без CONNECT (см. §14).

**Практический вывод:** если вам нужен полноценный egress-прокси с ACL, аутентификацией и логированием — берите **Squid** (классика) или **Envoy** (если уже в mesh). nginx как forward proxy рассматривайте, только если вы уже на 1.31+/Plus и сценарий простой.

---

## 18. Stream module (L4 TCP/UDP)

```nginx
stream {
    log_format basic '$remote_addr [$time_local] $protocol $status '
                     '$bytes_sent $bytes_received $session_time $upstream_addr';
    access_log /var/log/nginx/stream.log basic;

    # TCP: балансировка PostgreSQL (read-реплики)
    upstream pg_replicas {
        least_conn;
        server 10.0.1.10:5432 max_fails=3 fail_timeout=30s;
        server 10.0.1.11:5432 max_fails=3 fail_timeout=30s;
        server 10.0.1.12:5432 backup;
    }
    server {
        listen 5432;
        proxy_pass pg_replicas;
        proxy_connect_timeout 5s;
        proxy_timeout 1h;            # таймаут неактивности соединения
        proxy_protocol on;           # передать реальный IP клиента бэкенду
    }

    # UDP: DNS
    upstream dns { server 10.0.1.10:53; server 10.0.1.11:53; }
    server {
        listen 53 udp;
        proxy_pass dns;
        proxy_responses 1;           # сколько ответных датаграмм ожидать
        proxy_timeout 5s;
    }

    # TLS-терминация перед не-HTTP сервисом
    server {
        listen 3307 ssl;
        ssl_certificate     /etc/nginx/ssl/mysql.crt;
        ssl_certificate_key /etc/nginx/ssl/mysql.key;
        proxy_pass 10.0.1.10:3306;
    }
}
```

Ограничение: балансировка БД через L4 **не заменяет** pgbouncer/patroni. nginx не знает, кто мастер, а кто реплика, и не умеет разруливать failover — он просто раскидывает TCP-соединения.

---

## 19. Деплойные паттерны

**Canary:** `split_clients` по проценту (§7) или роутинг по заголовку/куке для ручной проверки.

**Blue-green:** два upstream, переключение одной строкой + `nginx -s reload` (граничные соединения доживают на старом).

**Страница обслуживания:**

```nginx
location / {
    if (-f /var/www/maintenance.on) { return 503; }
    proxy_pass http://backend;
}
error_page 503 @maintenance;
location @maintenance {
    root /var/www/errors;
    rewrite ^ /maintenance.html break;
}
```

**Graceful degradation:** `proxy_cache_use_stale` + `error_page 502 = @fallback` — отдавать кэш или заглушку вместо 502.

**Zero-downtime деплой приложения:** readiness-эндпоинт + вывод инстанса из ротации (в k8s — readinessProbe; на голом железе — `down` в upstream + reload, либо Consul-template).

---

## 20. Логирование

```nginx
http {
    log_format json_log escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"method":"$request_method",'
        '"uri":"$request_uri",'
        '"status":$status,'
        '"bytes":$body_bytes_sent,'
        '"rt":$request_time,'                    # полное время запроса
        '"urt":"$upstream_response_time",'       # время ответа бэкенда
        '"uct":"$upstream_connect_time",'        # время установки соединения
        '"us":"$upstream_status",'
        '"ua":"$upstream_addr",'
        '"cache":"$upstream_cache_status",'
        '"host":"$host",'
        '"referer":"$http_referer",'
        '"agent":"$http_user_agent",'
        '"xff":"$http_x_forwarded_for",'
        '"rid":"$request_id"'                    # сквозной ID → в бэкенд и в трейс
    '}';

    map $request_uri $loggable { ~*^/health 0; ~*^/metrics 0; default 1; }

    # buffer/flush снижают дисковый I/O на высоких RPS
    access_log /var/log/nginx/access.json.log json_log buffer=64k flush=5s if=$loggable;
    error_log  /var/log/nginx/error.log warn;

    # Или сразу в syslog → Loki/ELK, без файлов и ротации
    # access_log syslog:server=127.0.0.1:514,tag=nginx json_log;
}
```

**Трассировка.** `$request_id` генерируется nginx; передавайте его бэкенду (`proxy_set_header X-Request-ID $request_id;`), логируйте с обеих сторон и кладите в trace-контекст — по одному ID соберётся весь путь запроса. Разница `$request_time` и `$upstream_response_time` показывает, где время: у клиента (медленная сеть), в nginx или на бэкенде.

**Уровни `error_log`:** `warn` в проде; `debug` требует сборки с `--with-debug` и даёт огромный объём — включайте точечно через `debug_connection 10.0.0.5;`.

---

## 21. Мониторинг

```nginx
server {
    listen 127.0.0.1:8080;
    location /nginx_status { stub_status; allow 127.0.0.1; deny all; }
}
```

```
Active connections: 291
server accepts handled requests
 16630948 16630948 31070465
Reading: 6 Writing: 179 Waiting: 106
```

- `accepts` ≠ `handled` → упёрлись в `worker_connections` или лимит дескрипторов.
- `Waiting` — keep-alive соединения в простое; большая доля — нормально.
- `Reading`/`Writing` — активная работа.

**Prometheus:** `nginx/nginx-prometheus-exporter` поверх `stub_status`. Метрики: `nginx_connections_active/reading/writing/waiting`, `nginx_http_requests_total`, `nginx_connections_accepted/handled`.

Проблема: `stub_status` не даёт разбивки по кодам ответов, upstream и вхостам. Варианты глубже:

- модуль **VTS** (`nginx-module-vts`) — метрики по вхостам, upstream, кодам;
- экспорт из **логов** (`mtail`, `grok_exporter`, promtail+Loki) — гибко, но дороже;
- NGINX Plus API.

**Что алертить:** доля 5xx, p99 `$request_time`, `$upstream_response_time` по upstream, рост 499, `accepts != handled`, доля `X-Cache-Status=MISS`, срок жизни TLS-сертификата, рестарты воркеров в error.log.

---

## 22. Performance tuning

```nginx
worker_processes auto;              # = числу ядер
worker_rlimit_nofile 65535;         # ≥ worker_connections × 2
worker_shutdown_timeout 30s;        # не копить старые воркеры после reload

events {
    worker_connections 16384;
    # use epoll;        — выбирается автоматически, указывать не нужно
    # multi_accept on;  — в большинстве случаев не помогает, может вредить
}

http {
    keepalive_timeout 65;
    keepalive_requests 1000;
    client_max_body_size 100m;
    client_body_buffer_size 16k;
    client_header_buffer_size 4k;
    large_client_header_buffers 4 16k;   # поднять при "Request Header Or Cookie Too Large"
    client_body_timeout 30;
    client_header_timeout 30;
    send_timeout 30;
}
```

ОС:

```bash
# /etc/security/limits.conf
nginx soft nofile 65535
nginx hard nofile 65535

# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.core.netdev_max_backlog = 65535
```

`listen 80 backlog=65535;` — согласуйте с `somaxconn`.

**Что реально даёт эффект** (в порядке убывания): keepalive к бэкендам, кэширование ответов, gzip/brotli для текста, `open_file_cache` для статики, sendfile. Тюнинг `multi_accept` и подобного — шум на фоне отсутствующего кэша.

---

## 23. Docker и Kubernetes

### Dockerfile

```dockerfile
# Непривилегированный официальный образ: уже слушает 8080, все права расставлены
FROM nginxinc/nginx-unprivileged:1.30-alpine

COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx conf.d/    /etc/nginx/conf.d/

EXPOSE 8080

# В alpine нет curl — используем wget из busybox
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
```

Если всё же строите non-root на базе обычного `nginx`: кроме `/var/cache/nginx` и `/var/log/nginx` нужно отдать права на `/var/lib/nginx` и путь pid-файла (или перенести `pid` в `/tmp`), а `listen` перевести на порт > 1024.

Логи в контейнере штатно шлют в stdout/stderr симлинками (`/dev/stdout`), ротация внутри образа не нужна.

### Kubernetes: nginx как Deployment

```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: nginx-config }
data:
  nginx.conf: |
    worker_processes auto;
    events { worker_connections 4096; }
    http {
        include /etc/nginx/mime.types;
        server_tokens off;
        sendfile on;
        server {
            listen 8080;
            location = /health { return 200 "ok"; access_log off; }
            location / {
                proxy_pass http://app-service:3000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: nginx }
spec:
  replicas: 3
  selector: { matchLabels: { app: nginx } }
  template:
    metadata:
      labels: { app: nginx }
      annotations:
        # Пересоздать поды при изменении ConfigMap: смонтированный ConfigMap
        # сам по себе nginx не перезагружает
        checksum/config: "<sha256 конфига, подставляется Helm/kustomize>"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 101
      containers:
        - name: nginx
          image: nginxinc/nginx-unprivileged:1.30-alpine
          ports: [{ containerPort: 8080 }]
          volumeMounts:
            - { name: nginx-config, mountPath: /etc/nginx/nginx.conf, subPath: nginx.conf }
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits:   { cpu: 500m, memory: 256Mi }
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 3
            periodSeconds: 5
          lifecycle:
            preStop:
              exec: { command: ["/bin/sh", "-c", "sleep 5 && nginx -s quit"] }
      volumes:
        - name: nginx-config
          configMap: { name: nginx-config }
```

Нюансы:

- Смонтированный ConfigMap обновляется в поде с задержкой и **не вызывает reload**. Нужна checksum-аннотация (пересоздание подов) или sidecar-reloader.
- `preStop` со `sleep` даёт kube-proxy время убрать под из Endpoints до остановки — иначе часть запросов улетит в закрывающийся под.
- Порт > 1024, потому что контейнер работает не от root.

### Ingress: важное изменение 2025–2026

Сообщество Kubernetes объявило о **ретайременте контроллера Ingress NGINX** с рекомендацией переходить на **Gateway API**: best-effort поддержка держалась до марта 2026, после чего нет ни релизов, ни багфиксов, ни исправлений уязвимостей. Планировавшийся преемник **InGate тоже закрыт** — контрибьюторов не нашлось, и прямого наследника не назвали. Существующие деплойменты продолжают работать, чарты и образы остаются доступны, но риск накапливается: новые CVE закрывать некому.

Отдельно: аннотация `nginx.ingress.kubernetes.io/configuration-snippet` (инъекция произвольного конфига) относится именно к тому классу фич, который признали security-проблемой, и в поздних версиях контроллера отключена по умолчанию. Не закладывайтесь на неё.

Что делать:

- **Новые кластеры** — Gateway API с активно поддерживаемой реализацией (Envoy Gateway, kgateway, Istio, Traefik, шлюз облачного провайдера).
- **Хочется остаться на nginx** — есть отдельный живой проект **NGINX Ingress Controller от F5** (`nginx/kubernetes-ingress`), это не тот же самый контроллер: другой репозиторий, другие CRD и аннотации.
- **Существующие кластеры** — инвентаризация аннотаций и план миграции; аннотации делятся на те, что имеют прямой аналог в Gateway API, те, что переносятся в policy-ресурсы реализации, и те, что придётся переписать.

Пример Ingress ниже — для legacy-кластеров, как справка:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/limit-rps: "30"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [app.example.com]
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service: { name: frontend-service, port: { number: 80 } }
```

---

## 24. Troubleshooting

|Симптом|Причины|Что делать|
|---|---|---|
|**502 Bad Gateway**|бэкенд не слушает или упал; неверный адрес в `proxy_pass`; устаревший DNS у upstream; бэкенд закрыл keep-alive соединение раньше nginx; SELinux|`curl` к бэкенду напрямую, `tail -f error.log`, `ss -tlnp`, проверить §11 про DNS, `setsebool -P httpd_can_network_connect 1`|
|**504 Gateway Timeout**|бэкенд не ответил за `proxy_read_timeout`|поднять таймаут — но это симптом, чинить производительность бэкенда|
|**413 Request Entity Too Large**|тело больше `client_max_body_size`|поднять в нужном `location`|
|**499 Client Closed Request**|клиент ушёл, не дождавшись ответа|искать долгие ответы; массовые 499 = деградация или слишком короткий таймаут у клиента|
|**400 Request Header Or Cookie Too Large**|большие куки/JWT|`large_client_header_buffers 4 16k`|
|**worker_connections are not enough**|упёрлись в лимит|поднять `worker_connections` и `worker_rlimit_nofile`, проверить `accepts != handled`|
|Пропали security headers в одном location|`add_header` в дочернем контексте перебил родительские|§16|
|Кэш всегда MISS|`Set-Cookie` или `Cache-Control: private` от бэкенда, `proxy_cache_min_uses`|§12|
|Rate limit режет всех как одного|нет realip за прокси|§9.2|
|SSE/стриминг «залипает»|`proxy_buffering on`|§9.3|
|Память растёт после деплоев|старые воркеры живут из-за WebSocket|`worker_shutdown_timeout`|
|Конфиг «не применился»|`reload` при ошибке в конфиге|всегда `nginx -t` перед reload|
|502 после рестарта контейнера бэкенда|DNS закэширован при старте|§11, динамический resolver|

Инструменты диагностики: `nginx -T` (полный развёрнутый конфиг), `nginx -V` (модули), `error_log ... debug` вместе с `debug_connection <ip>` (точечный debug без потопа логов), `$upstream_*` переменные в access-логе, `curl -v -H 'Host: example.com'`, `ss -s`, `tcpdump`.

---

## 25. Production-чеклист

- [ ] `worker_processes auto`, `worker_rlimit_nofile`, `worker_shutdown_timeout` выставлены
- [ ] `nginx -t` в CI и перед каждым reload
- [ ] Версия не старше текущей stable-ветки, CVE отслеживаются
- [ ] TLS 1.2+, HSTS, OCSP stapling, автопродление сертификатов с reload-хуком
- [ ] `realip` настроен, `set_real_ip_from` строго по доверенным подсетям
- [ ] Security headers + `server_tokens off`, заголовки вынесены в snippet и включены во все location
- [ ] Rate limiting на публичных и auth-эндпоинтах, проверено, что считает по реальному IP
- [ ] Таймауты заданы для всех `proxy_*` и клиентских директив
- [ ] `proxy_next_upstream` не повторяет неидемпотентные запросы
- [ ] Кэш: есть `X-Cache-Status`, `use_stale` + `cache_lock`, проверено поведение с `Set-Cookie`
- [ ] Health-эндпоинт, probes, readiness выводит инстанс из ротации
- [ ] Логи в JSON, `$request_id` пробрасывается в бэкенд, в логе есть `$upstream_response_time`
- [ ] Метрики в Prometheus, алерты на 5xx, p99, срок жизни сертификата
- [ ] Динамический DNS для upstream решён (resolver или генерация конфига)
- [ ] Есть второй инстанс nginx и способ переключения (VIP/keepalived или облачный LB)
- [ ] Стриминговые эндпоинты с `proxy_buffering off`
- [ ] Конфиг в git, деплой воспроизводим, секреты не зашиты в образ

---

## 26. Вопросы с собеседований

1. **Почему nginx держит больше соединений, чем Apache prefork?** Event loop поверх epoll вместо потока на соединение: память растёт от числа соединений, а не потоков. У Apache есть event MPM, и разрыв сегодня меньше, чем в 2010-х.
2. **Как выбирается `server` и `location`?** §6.1–6.2, включая приоритет ` = `, `^~`, regex в порядке объявления, затем самый длинный prefix.
3. **`root` vs `alias`?** root добавляет весь URI к пути, alias заменяет префикс location.
4. **Что делает `nginx -s reload` и может ли он уронить прод?** Поднимаются новые воркеры, старые доживают запросы. При ошибке конфига новый не применяется, старые продолжают работать — поэтому `nginx -t` обязателен.
5. **Как передать бэкенду реальный IP клиента?** `X-Forwarded-For` плюс обязательно `set_real_ip_from`/`real_ip_header`, на L4 — PROXY protocol. И почему доверять XFF от произвольного источника нельзя.
6. **`least_conn` vs round robin, когда `ip_hash`?** §11.
7. **Есть ли активные health checks в open source?** Нет, только пассивные `max_fails`/`fail_timeout`, и они реагируют лишь на реальный трафик.
8. **Почему после рестарта контейнера бэкенда сыплются 502?** DNS для upstream резолвится один раз при старте; лечится resolver + переменная в `proxy_pass`.
9. **Зачем `proxy_buffering` и когда его выключают?** Защита бэкенда от медленных клиентов; выключают для SSE и стриминга.
10. **Почему ответы не кэшируются?** `Set-Cookie` или `Cache-Control` от бэкенда, `Vary`, `proxy_cache_min_uses`.
11. **Как защититься от cache stampede?** `proxy_cache_lock` + `proxy_cache_use_stale updating` + `proxy_cache_background_update`.
12. **`burst` vs `nodelay` в `limit_req`?** Leaky bucket: очередь на burst, с nodelay — мгновенная обработка всплеска, без — выравнивание задержками.
13. **Почему rate limit на трёх инстансах фактически тройной?** Зоны локальны для процесса и хоста; синхронизация только в Plus.
14. **Как сделать canary?** `split_clients` по проценту или роутинг по заголовку через `map`.
15. **Куда пропали security headers в `/api`?** `add_header` не наследуется аддитивно.
16. **Почему «if is evil»?** `if` в location создаёт вложенный конфигурационный контекст; безопасны только `return` и `rewrite ... last`.
17. **Как роутить по домену, не терминируя TLS?** `stream` + `ssl_preread` по SNI.
18. **Чем nginx хуже Envoy для микросервисов?** Нет динамической конфигурации без reload (xDS), беднее телеметрия, нет первоклассных outlier detection и retry-политик.
19. **Как балансировать gRPC и почему L4 плохо подходит?** Долгоживущие HTTP/2-соединения закрепляются за одним подом; нужен L7 (`grpc_pass`), который распределяет стримы.
20. **Что такое `auth_request` и какова цена?** Делегирование авторизации подзапросом к отдельному сервису; дополнительный RTT на каждый запрос, auth-сервис становится критическим путём.
21. **Что происходит с WebSocket при reload?** Соединения живут на старых воркерах до `worker_shutdown_timeout`.
22. **Умеет ли nginx быть forward proxy?** §17: исторически нет; CONNECT появился в Plus (`tunnel_pass`) и в open source mainline 1.31; для серьёзного egress берут Squid/Envoy.
