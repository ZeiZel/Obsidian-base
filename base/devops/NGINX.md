#nginx

NGINX – это высокопроизводительный веб-сервер и обратный прокси-сервер, который часто используется для балансировки нагрузки, кеширования контента и обеспечения безопасности приложений. Он известен своей легкостью, гибкостью и высокой производительностью при обработке большого количества запросов.

### Основные компоненты конфигурации

Конфигурационные файлы NGINX обычно находятся в директории `/etc/nginx/`:

- **nginx.conf** – основной файл конфигурации, где определяются глобальные настройки сервера.
- **sites-enabled/** – директория, содержащая ссылки на отдельные виртуальные хосты.
- **sites-available/** – директория, хранящая все доступные конфигурации виртуальных хостов.

### Структура файла `nginx.conf`

- **user**: определяет пользователя, от имени которого будет запущен сервер.
- **worker_processes**: количество рабочих процессов, рекомендуется устанавливать равным количеству ядер процессора (`auto` автоматически выбирает оптимальное число).
- **error_log**: путь к файлу логов ошибок.
- **events**: параметры обработки событий, таких как максимальное количество соединений на одного рабочего процесса.
- **http**: блок, содержащий настройки HTTP-сервера.
    - **include**: включает внешние файлы конфигурации.
    - **log_format**: формат записи логов доступа.
    - **access_log**: путь к файлу логов доступа.
    - **sendfile**, **tcp_nopush**, **tcp_nodelay**: оптимизация передачи файлов.
    - **gzip**: включение сжатия данных для уменьшения трафика.
    - **include /etc/nginx/sites-enabled/**: подключение всех конфигурационных файлов виртуальных хостов.

`nginx.conf`

```nginx
# Глобальная секция настроек
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Настройки gzip сжатия
    gzip on;
    gzip_disable "msie6";

    # Включаем конфиг отдельных сайтов
    include /etc/nginx/sites-enabled/*;
}
```

### Конфигурации виртуальных хостов

Виртуальный хост позволяет настроить разные домены на одном сервере. Например, для сайта `example.com`, создаем файл `/etc/nginx/sites-available/example.com.conf`

- **listen**: порт, на котором слушает сервер.
- **server_name**: список доменов, обслуживаемых этим виртуальным хостом.
- **root**: корневая директория для статического контента.
- **index**: файлы, которые будут использоваться в качестве индекса по умолчанию.
- **location**: секции, определяющие поведение сервера для различных URL.

`etc / nginx / sites-available / example.com.conf`

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/example.com/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

После создания этого файла нужно создать символическую ссылку в директорию `sites-enabled`:

```bash
ln -s /etc/nginx/sites-available/example.com.conf /etc/nginx/sites-enabled/
```

Затем перезапустить NGINX:

```bash
systemctl restart nginx
```

### Использование NGINX в Docker

Для запуска NGINX в контейнере Docker можно воспользоваться официальным образом `nginx`. Вот пример простого `Dockerfile`:

```dockerfile
FROM nginx:alpine
COPY ./default.conf /etc/nginx/conf.d/default.conf
```

Здесь мы копируем нашу собственную конфигурацию `default.conf` в контейнер. Файл `default.conf` может выглядеть так:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
    }
}
```

Запуск контейнера:

```bash
docker build -t my-nginx .
docker run -d -p 8080:80 my-nginx
```

Теперь можно получить доступ к приложению через порт 8080 на локальном хосте.
