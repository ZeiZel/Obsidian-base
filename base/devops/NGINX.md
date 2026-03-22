---
tags:
  - devops
  - nginx
  - load-balancing
  - reverse-proxy
title: NGINX
---

## Архитектура и модель работы

NGINX - высокопроизводительный веб-сервер, reverse proxy и load balancer, созданный для обработки десятков тысяч одновременных соединений с минимальным потреблением ресурсов.

Архитектура состоит из двух типов процессов:

- master process - читает конфигурацию, управляет worker-процессами, открывает порты, записывает в лог. Работает с привилегиями root
- worker process - обрабатывает клиентские запросы. Каждый worker работает в однопоточном event loop, обслуживая тысячи соединений без создания отдельных потоков или процессов

```
                    ┌──────────────┐
                    │    Master    │
                    │   Process    │
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Worker 1 │ │ Worker 2 │ │ Worker N │
        │ (epoll)  │ │ (epoll)  │ │ (epoll)  │
        └──────────┘ └──────────┘ └──────────┘
```

**Event-driven модель** использует системные вызовы `epoll` (Linux), `kqueue` (FreeBSD/macOS) для асинхронной обработки I/O. Один worker обслуживает тысячи соединений в неблокирующем режиме, переключаясь между ними по мере готовности данных.

> [!info] NGINX vs Apache
> Apache по умолчанию создает отдельный поток или процесс на каждое соединение (prefork/worker MPM), что приводит к высокому потреблению памяти при большом числе соединений. NGINX использует фиксированное количество worker-процессов с event-driven архитектурой, что дает предсказуемое потребление ресурсов под любой нагрузкой. Apache лучше подходит для сценариев с .htaccess и mod_php, NGINX - для reverse proxy, статики и высоконагруженных систем.

## Установка и управление

### Установка из пакетного менеджера

```bash
# Ubuntu/Debian - официальный репозиторий NGINX
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" \
| sudo tee /etc/apt/sources.list.d/nginx.list

sudo apt update && sudo apt install nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install nginx

# macOS
brew install nginx
```

### Сборка из исходников

Сборка из исходников нужна, когда требуются нестандартные модули или конкретная версия OpenSSL.

```bash
wget https://nginx.org/download/nginx-1.26.2.tar.gz
tar -xzf nginx-1.26.2.tar.gz
cd nginx-1.26.2

./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_v3_module \
    --with-http_realip_module \
    --with-http_gzip_static_module \
    --with-http_stub_status_module \
    --with-stream \
    --with-stream_ssl_module \
    --with-openssl=/path/to/openssl-3.x

make && sudo make install
```

### Управление процессом

```bash
# Проверка конфигурации перед применением
nginx -t

# Перезагрузка конфигурации без остановки (graceful)
nginx -s reload

# Быстрая остановка (прерывает активные соединения)
nginx -s stop

# Плавная остановка (дожидается завершения активных запросов)
nginx -s quit

# Повторное открытие лог-файлов (для logrotate)
nginx -s reopen

# Через systemd
sudo systemctl start nginx
sudo systemctl reload nginx
sudo systemctl status nginx
```

> [!important]
> Всегда выполняйте `nginx -t` перед `nginx -s reload`. Ошибка в конфигурации при reload не обрушит текущий процесс, но новая конфигурация не применится, а ошибка может остаться незамеченной.

## Структура конфигурации

Конфигурация NGINX построена на иерархии контекстов. Каждый контекст содержит директивы, а вложенные контексты наследуют директивы от родительских.

```nginx
# Main контекст (глобальный уровень)
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    # Events контекст - настройки обработки соединений
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # HTTP контекст - настройки HTTP-сервера
    include /etc/nginx/mime.types;

    server {
        # Server контекст - виртуальный хост
        listen 80;
        server_name example.com;

        location / {
            # Location контекст - обработка конкретных URI
            root /var/www/html;
        }

        location /api/ {
            # Другой location - проксирование к бэкенду
            proxy_pass http://backend;
        }
    }
}

stream {
    # Stream контекст - TCP/UDP проксирование (L4)
    server {
        listen 5432;
        proxy_pass postgresql_cluster;
    }
}
```

Иерархия наследования: `main → events / http → server → location`. Директивы, установленные в `http`, наследуются во все `server` блоки, а из `server` - во все `location`. Более специфичный контекст может переопределить наследованное значение.

## Основные директивы

```nginx
# Количество worker-процессов. auto = по числу CPU ядер
worker_processes auto;

# Максимальное число файловых дескрипторов на worker
worker_rlimit_nofile 65535;

events {
    # Максимальное число одновременных соединений на один worker
    # Реальный лимит = worker_processes * worker_connections
    worker_connections 4096;

    # Механизм мультиплексирования (epoll для Linux, kqueue для BSD)
    use epoll;

    # Принимать все новые соединения сразу, а не по одному
    multi_accept on;
}

http {
    # Использовать системный вызов sendfile для передачи файлов
    # Обходит копирование данных из kernel space в user space
    sendfile on;

    # Отправлять заголовки и начало файла в одном пакете
    # Работает только совместно с sendfile
    tcp_nopush on;

    # Отключить алгоритм Nagle - отправлять данные без задержки
    # Важно для WebSocket и keep-alive соединений
    tcp_nodelay on;

    # Время ожидания между запросами в keep-alive соединении
    keepalive_timeout 65;

    # Таймаут на чтение тела запроса от клиента
    client_body_timeout 30;

    # Таймаут на чтение заголовков запроса от клиента
    client_header_timeout 30;

    # Таймаут на отправку ответа клиенту
    send_timeout 30;

    # Максимальный размер тела запроса (upload limit)
    client_max_body_size 100m;
}
```

## Виртуальные хосты (server blocks)

Server block определяет виртуальный хост - набор правил для обработки запросов к конкретному домену и порту.

```nginx
# Основной сайт
server {
    listen 80;
    listen [::]:80;                    # IPv6
    server_name example.com www.example.com;

    root /var/www/example.com/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

# API на отдельном поддомене
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

# Сервер по умолчанию - обрабатывает запросы без совпадения server_name
server {
    listen 80 default_server;
    server_name _;
    return 444;    # Закрыть соединение без ответа
}
```

Порядок выбора server block при поступлении запроса:

1. NGINX выбирает все server блоки с совпадающей парой IP:port из директивы `listen`
2. Среди них ищет совпадение `server_name` с заголовком Host запроса
3. Если совпадений нет, используется `default_server` для этого порта
4. Если `default_server` не указан, используется первый server block в конфигурации

## Location blocks

Location определяет, как обрабатывать запросы по конкретным URI. Приоритет обработки от высшего к низшему:

```nginx
server {
    listen 80;
    server_name example.com;

    # 1. Exact match (=) - наивысший приоритет
    # Совпадение только для точного URI /health
    location = /health {
        return 200 "ok";
        add_header Content-Type text/plain;
    }

    # 2. Preferential prefix (^~) - если совпадает, regex не проверяются
    # Все URI, начинающиеся с /static/
    location ^~ /static/ {
        root /var/www;
        expires 30d;
    }

    # 3. Regex case-sensitive (~)
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php-fpm.sock;
        include fastcgi_params;
    }

    # 4. Regex case-insensitive (~*)
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        root /var/www/images;
        expires 90d;
        add_header Cache-Control "public, immutable";
    }

    # 5. Prefix match (без модификатора) - наименьший приоритет
    # Если ни один regex не совпал, используется самый длинный prefix
    location /api/ {
        proxy_pass http://backend;
    }

    # Корневой prefix - матчит все, что не попало в другие location
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> [!summary] Алгоритм выбора location
> 1. Проверяются все prefix-location, запоминается самый длинный совпавший
> 2. Если самый длинный prefix имеет модификатор `=` (exact) - используется он, поиск прекращается
> 3. Если самый длинный prefix имеет модификатор `^~` - используется он, regex не проверяются
> 4. Проверяются regex-location в порядке появления в конфигурации. Первый совпавший побеждает
> 5. Если ни один regex не совпал, используется запомненный самый длинный prefix

## Раздача статического контента

### root vs alias

```nginx
# root - путь к файлу = root + URI
location /static/ {
    root /var/www;
    # Запрос /static/app.js → /var/www/static/app.js
}

# alias - путь к файлу = alias + остаток URI после location
location /files/ {
    alias /var/www/static/;
    # Запрос /files/app.js → /var/www/static/app.js
}
```

### try_files и кеширование

```nginx
server {
    listen 80;
    server_name cdn.example.com;
    root /var/www/static;

    # SPA - все несуществующие пути отдают index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Статические ассеты с хешем в имени - агрессивное кеширование
    location ~* \.(js|css|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Изображения - умеренное кеширование
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Включить листинг директории (для отладки, не для production)
    location /debug/files/ {
        alias /var/www/uploads/;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
    }
}
```

## Reverse Proxy

Основной сценарий использования NGINX в production - проксирование запросов к приложениям на бэкенде.

```nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;

        # Передача оригинальных заголовков клиента на бэкенд
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;

        # Таймауты подключения к бэкенду
        proxy_connect_timeout 10s;     # Таймаут установки TCP-соединения
        proxy_send_timeout 30s;        # Таймаут отправки запроса на бэкенд
        proxy_read_timeout 60s;        # Таймаут чтения ответа от бэкенда

        # Буферизация ответов от бэкенда
        proxy_buffering on;
        proxy_buffer_size 8k;          # Буфер для заголовков ответа
        proxy_buffers 8 8k;            # Количество и размер буферов для тела ответа
        proxy_busy_buffers_size 16k;   # Размер буферов, которые могут отправляться клиенту
                                       # пока остальные буферы ещё заполняются

        # HTTP версия для соединения с бэкендом
        proxy_http_version 1.1;

        # Перенаправить на следующий upstream при ошибке
        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 10s;
    }

    # Проксирование с изменением URI
    location /api/v1/ {
        # Запрос /api/v1/users → http://backend:8080/users
        proxy_pass http://backend:8080/;
    }

    # Проксирование без изменения URI
    location /service/ {
        # Запрос /service/health → http://backend:8080/service/health
        proxy_pass http://backend:8080;
    }
}
```

> [!important]
> Обратите внимание на слэш в конце `proxy_pass`. `proxy_pass http://backend/` (со слэшем) заменит location prefix в URI, а `proxy_pass http://backend` (без слэша) передаст полный оригинальный URI.

## WebSocket Proxying

WebSocket требует обновления HTTP-соединения через заголовки Upgrade и Connection.

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name ws.example.com;

    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # Заголовки для WebSocket handshake
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Увеличенные таймауты для long-lived соединений
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

## Load Balancing

### Upstream блок и алгоритмы

```nginx
# Round Robin (по умолчанию) - равномерное распределение
upstream backend_rr {
    server 10.0.1.10:8080 weight=3;     # Получает 3x больше запросов
    server 10.0.1.11:8080 weight=1;
    server 10.0.1.12:8080 weight=1;

    server 10.0.1.20:8080 backup;        # Используется только если все основные недоступны

    # Параметры health check
    # max_fails - число неудачных попыток, после которого сервер считается недоступным
    # fail_timeout - время, на которое сервер выводится из ротации, и окно для подсчета max_fails
    server 10.0.1.13:8080 max_fails=3 fail_timeout=30s;
}

# Least Connections - запрос идет на сервер с наименьшим числом активных соединений
upstream backend_lc {
    least_conn;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080;
}

# IP Hash - привязка клиента к серверу по IP (session persistence)
upstream backend_ip {
    ip_hash;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080 down;    # Временно выведен из ротации
}

# Generic Hash - произвольный ключ хеширования
upstream backend_hash {
    hash $request_uri consistent;    # consistent hashing минимизирует перебалансировку
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080;
}

# Random with Two Choices - выбирает 2 случайных сервера, отправляет на менее загруженный
upstream backend_random {
    random two least_conn;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080;
}
```

### Keep-alive к upstream

```nginx
upstream backend {
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;

    # Пул keep-alive соединений к каждому бэкенду
    keepalive 32;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}

server {
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";    # Обязательно для keep-alive к upstream
    }
}
```

> [!info] Активные health checks
> Бесплатная версия NGINX поддерживает только пассивные health checks через `max_fails` и `fail_timeout`. Активные health checks, которые периодически отправляют запросы на бэкенды, доступны только в NGINX Plus. Как альтернатива - модуль `nginx_upstream_check_module` от Tengine.

## SSL/TLS

### Базовая конфигурация

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name example.com www.example.com;

    # Сертификат и ключ
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Протоколы - только TLS 1.2 и 1.3
    ssl_protocols TLSv1.2 TLSv1.3;

    # Шифры - сервер определяет приоритет
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Кеш SSL-сессий для ускорения повторных подключений
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;    # Отключить для perfect forward secrecy

    # OCSP Stapling - NGINX сам получает статус сертификата и отдает клиенту
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # Diffie-Hellman параметры для DHE шифров
    ssl_dhparam /etc/nginx/dhparam.pem;    # openssl dhparam -out dhparam.pem 4096

    # HSTS - принудительный HTTPS на 1 год
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location / {
        root /var/www/html;
    }
}

# Редирект HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}
```

### HTTP/2 и HTTP/3

```nginx
server {
    # HTTP/2 включается директивой http2 (с NGINX 1.25.1)
    listen 443 ssl;
    http2 on;

    # HTTP/3 (QUIC) - требует сборки с --with-http_v3_module
    listen 443 quic reuseport;
    add_header Alt-Svc 'h3=":443"; ma=86400' always;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://backend;
    }
}
```

## Rate Limiting

Rate limiting защищает от DDoS-атак, брутфорса и чрезмерного потребления ресурсов.

```nginx
http {
    # Определение зон ограничения
    # $binary_remote_addr занимает 4 байта вместо 7-15 у $remote_addr
    # 10m зоны хватает для ~160 000 IP-адресов

    # Общий лимит - 30 запросов в секунду на IP
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Лимит для API - 10 запросов в секунду на IP
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Лимит для login - 5 запросов в минуту на IP
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Лимит одновременных соединений
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # Код ответа при превышении лимита (по умолчанию 503)
    limit_req_status 429;
    limit_conn_status 429;

    server {
        listen 80;
        server_name api.example.com;

        # Общий лимит - burst позволяет всплески до 20 запросов
        # nodelay - всплесковые запросы обрабатываются сразу, а не ставятся в очередь
        location / {
            limit_req zone=general burst=20 nodelay;
            limit_conn addr 100;
            proxy_pass http://backend;
        }

        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://backend;
        }

        # Строгий лимит для эндпоинта аутентификации
        location /api/auth/login {
            limit_req zone=login burst=3;    # Без nodelay - запросы встают в очередь
            proxy_pass http://backend;
        }
    }
}
```

> [!info] burst и nodelay
> `burst=20` создает очередь на 20 запросов. Без `nodelay` избыточные запросы обрабатываются с задержкой, выдерживая установленный rate. С `nodelay` запросы из burst обрабатываются мгновенно, но следующие запросы сверх burst получат 429 до восстановления "токенов" в bucket.

## Кеширование

Proxy cache позволяет NGINX сохранять ответы от бэкенда и отдавать их без обращения к upstream.

```nginx
http {
    # Определение кеша
    # levels=1:2 - двухуровневая иерархия директорий
    # keys_zone=app_cache:10m - 10MB для хранения ключей в shared memory
    # max_size=10g - максимальный размер кеша на диске
    # inactive=60m - удалять записи, к которым не обращались 60 минут
    # use_temp_path=off - писать файлы сразу в cache directory
    proxy_cache_path /var/cache/nginx/app
        levels=1:2
        keys_zone=app_cache:10m
        max_size=10g
        inactive=60m
        use_temp_path=off;

    server {
        listen 80;
        server_name app.example.com;

        location / {
            proxy_pass http://backend;
            proxy_cache app_cache;

            # Ключ кеша
            proxy_cache_key "$scheme$request_method$host$request_uri";

            # Время жизни кеша по кодам ответа
            proxy_cache_valid 200 302 10m;
            proxy_cache_valid 404 1m;
            proxy_cache_valid any 5m;

            # Минимальное число запросов перед кешированием
            proxy_cache_min_uses 2;

            # Условия обхода кеша
            proxy_cache_bypass $http_cache_control $cookie_nocache;
            proxy_no_cache $http_pragma;

            # Заголовок для диагностики - HIT, MISS, BYPASS, EXPIRED
            add_header X-Cache-Status $upstream_cache_status always;

            # Отдавать устаревший кеш, если бэкенд недоступен
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503;

            # Блокировка - только один запрос обновляет кеш, остальные ждут
            proxy_cache_lock on;
            proxy_cache_lock_timeout 5s;

            # Фоновое обновление кеша
            proxy_cache_background_update on;
        }

        # Кеш не нужен для мутирующих запросов
        location /api/ {
            proxy_pass http://backend;
            proxy_cache off;
        }
    }
}
```

## Security Headers

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name secure.example.com;

    # Запретить встраивание в iframe (защита от clickjacking)
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Запретить MIME-type sniffing
    add_header X-Content-Type-Options "nosniff" always;

    # Скрыть версию NGINX
    server_tokens off;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.example.com; frame-ancestors 'self';" always;

    # Политика реферера
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Permissions Policy (бывший Feature-Policy)
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://backend;
    }
}
```

> [!important]
> Директива `add_header` в дочернем контексте полностью заменяет заголовки из родительского. Если вы добавляете `add_header` в `location`, все `add_header` из `server` перестают действовать для этого location. Используйте модуль `headers-more` или дублируйте заголовки в каждом location.

## Gzip Compression

```nginx
http {
    gzip on;

    # Минимальный размер ответа для сжатия (маленькие ответы сжимать бессмысленно)
    gzip_min_length 1024;

    # Уровень сжатия (1-9). 4-6 - оптимальный баланс CPU/сжатие
    gzip_comp_level 5;

    # MIME-типы для сжатия (text/html сжимается всегда)
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/atom+xml
        image/svg+xml
        font/woff2;

    # Добавить заголовок Vary: Accept-Encoding
    # Важно для корректной работы CDN и прокси
    gzip_vary on;

    # Сжимать ответы от проксируемых серверов
    gzip_proxied any;

    # Не сжимать для старых IE
    gzip_disable "msie6";

    # Число и размер буферов для сжатия
    gzip_buffers 16 8k;

    # Предварительно сжатые файлы (Brotli/gzip static)
    # Если существует app.js.gz, отдать его вместо сжатия на лету
    gzip_static on;
}
```

## Логирование

### Форматы логов

```nginx
http {
    # Стандартный формат
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';

    # Расширенный формат с информацией о проксировании
    log_format upstream_log '$remote_addr - $remote_user [$time_local] '
                            '"$request" $status $body_bytes_sent '
                            'rt=$request_time urt=$upstream_response_time '
                            'us=$upstream_status ua=$upstream_addr';

    # JSON формат - удобен для парсинга в ELK/Loki
    log_format json_log escape=json
        '{'
            '"time": "$time_iso8601",'
            '"remote_addr": "$remote_addr",'
            '"request_method": "$request_method",'
            '"request_uri": "$request_uri",'
            '"status": $status,'
            '"body_bytes_sent": $body_bytes_sent,'
            '"request_time": $request_time,'
            '"upstream_response_time": "$upstream_response_time",'
            '"upstream_status": "$upstream_status",'
            '"http_user_agent": "$http_user_agent",'
            '"http_referer": "$http_referer",'
            '"request_id": "$request_id"'
        '}';

    # Использование
    access_log /var/log/nginx/access.log main;
    access_log /var/log/nginx/access.json.log json_log;
    error_log /var/log/nginx/error.log warn;

    server {
        # Условное логирование - не логировать health checks
        map $request_uri $loggable {
            ~*^/health 0;
            ~*^/metrics 0;
            default 1;
        }

        access_log /var/log/nginx/app.log json_log if=$loggable;

        # Отключить access log для статики
        location ~* \.(js|css|png|jpg|gif|ico)$ {
            access_log off;
        }
    }
}
```

### Ротация логов

```bash
# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        [ -f /run/nginx.pid ] && kill -USR1 $(cat /run/nginx.pid)
    endscript
}
```

Сигнал `USR1` заставляет NGINX переоткрыть файлы логов, что необходимо после ротации.

## Директива map

Map создает переменные на основе значений других переменных. Вычисляется лениво - только при первом обращении к переменной.

```nginx
http {
    # Определение бэкенда по домену
    map $host $backend {
        default        http://default_backend;
        api.example.com    http://api_backend;
        admin.example.com  http://admin_backend;
    }

    # Определение типа устройства
    map $http_user_agent $is_mobile {
        default 0;
        ~*mobile 1;
        ~*android 1;
        ~*iphone 1;
    }

    # Формирование CORS заголовка
    map $http_origin $cors_origin {
        default "";
        ~^https://(.+\.)?example\.com$ $http_origin;
        ~^https://(.+\.)?staging\.example\.com$ $http_origin;
    }

    # Ограничение rate limit для белого списка
    map $remote_addr $limit_key {
        default $binary_remote_addr;
        10.0.0.0/8 "";        # Не лимитировать внутреннюю сеть
        192.168.0.0/16 "";
    }

    limit_req_zone $limit_key zone=api:10m rate=10r/s;

    server {
        listen 80;

        location / {
            proxy_pass $backend;

            # Условный CORS
            add_header Access-Control-Allow-Origin $cors_origin always;
        }
    }
}
```

## Geo и GeoIP

### Блокировка по IP

```nginx
http {
    # Geo модуль - определение переменных по IP клиента
    geo $blocked {
        default 0;
        10.0.0.0/8 0;          # Внутренняя сеть - разрешено
        192.168.0.0/16 0;
        203.0.113.0/24 1;      # Заблокированная подсеть
        198.51.100.50 1;       # Заблокированный IP
    }

    server {
        if ($blocked) {
            return 403;
        }

        location / {
            proxy_pass http://backend;
        }
    }
}
```

### GeoIP2 - блокировка по стране

```nginx
# Требует модуля ngx_http_geoip2_module и базы MaxMind GeoLite2
load_module modules/ngx_http_geoip2_module.so;

http {
    geoip2 /usr/share/GeoIP/GeoLite2-Country.mmdb {
        $geoip2_country_code country iso_code;
    }

    map $geoip2_country_code $allowed_country {
        default yes;
        CN no;
        RU no;
    }

    server {
        if ($allowed_country = no) {
            return 403;
        }

        location / {
            proxy_pass http://backend;
        }
    }
}
```

## Stream Module (L4 TCP/UDP)

Stream модуль позволяет проксировать и балансировать TCP/UDP трафик на транспортном уровне.

```nginx
# Загрузка модуля (если собран динамически)
load_module modules/ngx_stream_module.so;

stream {
    # TCP балансировка для PostgreSQL
    upstream postgresql {
        least_conn;
        server 10.0.1.10:5432 max_fails=3 fail_timeout=30s;
        server 10.0.1.11:5432 max_fails=3 fail_timeout=30s;
        server 10.0.1.12:5432 backup;
    }

    server {
        listen 5432;
        proxy_pass postgresql;
        proxy_connect_timeout 5s;
        proxy_timeout 3600s;    # Таймаут неактивности соединения
    }

    # TCP балансировка для Redis Sentinel
    upstream redis {
        server 10.0.1.10:6379;
        server 10.0.1.11:6379;
    }

    server {
        listen 6379;
        proxy_pass redis;
        proxy_connect_timeout 3s;
    }

    # UDP балансировка для DNS
    upstream dns_servers {
        server 10.0.1.10:53;
        server 10.0.1.11:53;
    }

    server {
        listen 53 udp;
        proxy_pass dns_servers;
        proxy_responses 1;    # Ожидаемое количество UDP-ответов
        proxy_timeout 5s;
    }

    # SSL termination для MySQL
    server {
        listen 3307 ssl;
        ssl_certificate /etc/nginx/ssl/mysql.crt;
        ssl_certificate_key /etc/nginx/ssl/mysql.key;
        proxy_pass 10.0.1.10:3306;
    }
}
```

## Мониторинг

### stub_status

```nginx
server {
    listen 8080;
    server_name localhost;

    # Доступ только из внутренней сети
    allow 10.0.0.0/8;
    allow 127.0.0.1;
    deny all;

    location /nginx_status {
        stub_status;
    }
}
```

Вывод `stub_status`:

```
Active connections: 291
server accepts handled requests
 16630948 16630948 31070465
Reading: 6 Writing: 179 Waiting: 106
```

- Active connections - текущие активные соединения (включая waiting)
- accepts - общее число принятых соединений
- handled - общее число обработанных соединений (должно совпадать с accepts)
- requests - общее число обработанных запросов
- Reading - соединения, в которых NGINX читает заголовки запроса
- Writing - соединения, в которых NGINX отправляет ответ
- Waiting - keep-alive соединения в ожидании нового запроса

### Prometheus nginx-exporter

```yaml
# docker-compose.yml
services:
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:1.1
    command:
      - --nginx.scrape-uri=http://nginx:8080/nginx_status
    ports:
      - "9113:9113"
```

Основные метрики для мониторинга:

- `nginx_connections_active` - активные соединения
- `nginx_connections_reading` / `writing` / `waiting`
- `nginx_http_requests_total` - общее число запросов
- `nginx_connections_accepted` / `handled`

Для более глубокого мониторинга используйте VTS (Virtual Host Traffic Status) модуль, который предоставляет метрики по виртуальным хостам, upstream и кодам ответов.

## Performance Tuning

### Системные лимиты

```nginx
# Максимальное число файловых дескрипторов на worker
# Должно быть >= worker_connections * 2 (каждое соединение = 2 дескриптора: клиент + бэкенд)
worker_rlimit_nofile 65535;

events {
    worker_connections 16384;
}
```

Системные лимиты на уровне ОС:

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

### Кеширование открытых файлов

```nginx
http {
    # Кеш метаданных файлов (дескрипторы, размеры, время модификации)
    open_file_cache max=10000 inactive=60s;
    open_file_cache_valid 30s;        # Время между проверками актуальности кеша
    open_file_cache_min_uses 2;       # Минимальное число обращений для кеширования
    open_file_cache_errors on;        # Кешировать ошибки (файл не найден)
}
```

### Буферы

```nginx
http {
    # Буферы для чтения заголовков запроса клиента
    # Увеличивайте при ошибке "Request Header Or Cookie Too Large"
    large_client_header_buffers 4 16k;

    # Буфер для тела запроса клиента
    client_body_buffer_size 16k;

    # Буфер для заголовков запроса
    client_header_buffer_size 4k;

    # Буферы для проксирования
    proxy_buffer_size 8k;             # Заголовки ответа от upstream
    proxy_buffers 8 16k;              # Тело ответа от upstream
    proxy_busy_buffers_size 32k;      # Буферы, отправляемые клиенту
}
```

### Оптимальная production конфигурация

```nginx
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 16384;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Скрыть версию
    server_tokens off;

    # I/O оптимизация
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    aio on;

    # Таймауты
    keepalive_timeout 65;
    keepalive_requests 1000;
    client_body_timeout 30;
    client_header_timeout 30;
    send_timeout 30;

    # Буферы
    client_max_body_size 100m;
    client_body_buffer_size 16k;
    large_client_header_buffers 4 16k;

    # Кеш файлов
    open_file_cache max=10000 inactive=60s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Gzip
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_vary on;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml
               application/xml+rss application/atom+xml image/svg+xml;

    # Логирование
    log_format json_log escape=json
        '{'
            '"time":"$time_iso8601",'
            '"remote_addr":"$remote_addr",'
            '"method":"$request_method",'
            '"uri":"$request_uri",'
            '"status":$status,'
            '"bytes":$body_bytes_sent,'
            '"rt":$request_time,'
            '"urt":"$upstream_response_time",'
            '"ua":"$http_user_agent",'
            '"rid":"$request_id"'
        '}';

    access_log /var/log/nginx/access.json.log json_log;

    include /etc/nginx/conf.d/*.conf;
}
```

## NGINX в Docker и Kubernetes

### Docker

```dockerfile
FROM nginx:1.26-alpine

# Удалить дефолтную конфигурацию
RUN rm /etc/nginx/conf.d/default.conf

# Копировать кастомную конфигурацию
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Создать директорию для кеша
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Использовать непривилегированного пользователя
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: production
data:
  nginx.conf: |
    user nginx;
    worker_processes auto;
    error_log /var/log/nginx/error.log warn;

    events {
        worker_connections 4096;
    }

    http {
        include /etc/nginx/mime.types;
        server_tokens off;
        sendfile on;
        tcp_nopush on;
        keepalive_timeout 65;
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;

        server {
            listen 8080;

            location /health {
                return 200 "ok";
                access_log off;
            }

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
metadata:
  name: nginx
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.26-alpine
        ports:
        - containerPort: 8080
        volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 3
          periodSeconds: 5
      volumes:
      - name: nginx-config
        configMap:
          name: nginx-config
```

### NGINX Ingress Controller

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "30"
    nginx.ingress.kubernetes.io/limit-rps: "30"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    - api.example.com
    secretName: app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
```

## Типичные ошибки и troubleshooting

### 502 Bad Gateway

Причина - NGINX не может получить ответ от upstream.

Диагностика:

```bash
# Проверить, работает ли бэкенд
curl -v http://127.0.0.1:3000/health

# Проверить логи NGINX
tail -f /var/log/nginx/error.log

# Проверить сетевую связность
ss -tlnp | grep 3000
```

Типичные причины:
- Бэкенд не запущен или упал
- Неправильный адрес/порт в `proxy_pass`
- Бэкенд перегружен и не принимает соединения
- SELinux блокирует сетевые подключения NGINX (`setsebool -P httpd_can_network_connect 1`)

### 504 Gateway Timeout

Причина - бэкенд не ответил за отведенное время.

```nginx
# Увеличить таймауты
location /api/ {
    proxy_pass http://backend;
    proxy_connect_timeout 30s;
    proxy_read_timeout 120s;    # Увеличить для долгих операций
    proxy_send_timeout 30s;
}
```

Если проблема повторяется, это сигнал о проблемах производительности бэкенда, а не конфигурации NGINX.

### 413 Request Entity Too Large

Причина - тело запроса превышает `client_max_body_size`.

```nginx
# Глобально или в конкретном location
client_max_body_size 100m;

# Для эндпоинта загрузки файлов
location /upload/ {
    client_max_body_size 500m;
    proxy_pass http://backend;
}
```

### 499 Client Closed Request

NGINX-специфичный код - клиент закрыл соединение до получения ответа. Частая причина - слишком долгий ответ бэкенда, и клиент не дождался.

### Permission denied при подключении к upstream

```bash
# SELinux на CentOS/RHEL
setsebool -P httpd_can_network_connect 1

# Проверить права на сокет (для Unix-сокетов)
ls -la /run/php/php-fpm.sock
# Должно быть: srw-rw---- nginx www-data
```

### Отладка конфигурации

```bash
# Показать скомпилированную конфигурацию (все include развернуты)
nginx -T

# Проверить синтаксис
nginx -t

# Версия и модули
nginx -V

# Тест конкретного файла конфигурации
nginx -t -c /path/to/nginx.conf
```

> [!summary] Чеклист production-конфигурации
> - `worker_processes auto` и `worker_rlimit_nofile` выставлены
> - SSL/TLS настроен с TLSv1.2+ и HSTS
> - Security headers добавлены (X-Frame-Options, CSP, nosniff)
> - `server_tokens off` скрывает версию
> - Rate limiting для публичных эндпоинтов
> - Gzip включен для текстовых типов
> - Логирование в JSON для парсинга в ELK/Loki
> - Health check endpoint для мониторинга и Kubernetes probes
> - `proxy_next_upstream` для отказоустойчивости
> - `proxy_cache_use_stale` для graceful degradation
> - Таймауты выставлены для всех proxy-директив
> - `nginx -t` выполняется перед каждым reload
