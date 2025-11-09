---
tags:
  - k8s
  - kubernetes
  - helm
  - helmfile
---

## Кратко о Helmfile

**Helmfile** — инструмент для централизованного менеджмента множества Helm-чартов/приложений с автоматизацией деплоя, параметризации окружений и безопасного хранения секретов.  

Helmfile-инфраструктура может описываться одним конфигом и быть гибко расширяемой — любые приложения, чарты и их значения можно “подключить” декларативно, single-source-of-truth.

---

## Ключевые возможности Helmfile, используемые в проекте

- **Один центральный `helmfile.yaml`** — точка входа во все чарты, окружения, values, secrets, шаблоны.
- **IaC**: структура проекта полностью декларативна, расширяется автоматически при добавлении новых релизов, окружений или параметров.
- **Поддержка сторонних Helm-репозиториев**: достаточно прописать репозиторий, например, bitnami, nginx или любой свой.
- **Гибкая работа с values и secrets**: переменные/секреты наследуются, могут переопределяться для разных слоев конфигурации (глобально, для окружения, приложения, секрета).
- **Обработка множественных окружений через environments**.
- **Интеграция собственных чартов прямо в конфиг**.

---

## Установка

```bash
helm init --client-only || echo "probably helm3"  
```


```bash
helm plugin install https://github.com/databus23/helm-diff  
helm plugin install https://github.com/rimusz/helm-tiller  
```

```bash
# default
wget -O ~/bin/helmfile https://github.com/roboll/helmfile/releases/download/v0.102.0/helmfile_linux_amd64  
chmod +x ~/bin/helmfile  

# brew
brew install helmfile
```

```bash
helmfile init --force
```

---
## Пример простой конфигурации

Представим, что у нас в проекте несколько чартов разных приложений

- `charts`
	- `backend`
	- `database`
	- `webapp`

`helmfile.yaml`
```YAML
# список релизов, которые нужно будет менеджментить
releases:
  - name: webapp # имя окружения
    namespace: default # пространство имён
    chart: ./charts/webapp # месторасположение чарта
    version: "0.1.0" # версия релиза
    wait: true # ожидаем установку
    installed: true # требуется ли установка конкретного чарта
  - name: backend
    namespace: default
    chart: ./charts/backend
    wait: true
  - name: database
    namespace: default
    chart: ./charts/database
    wait: true
```

Эта команда выведет список всех чартов, которые менеджментит helmfile

```bash
helmfile list
```

```bash
helmfile apply
```

```bash
helmfile sync
```

```bash
helmfile destroy
```

Через `set` можно установить свои значения `values`

`helmfile.yaml`
```YAML
  - name: backend
    namespace: default
    chart: ./backend
    wait: true
    set:
      - name: replicaCount
        value: 2
```

Чтобы посмотреть различия в чартах, которые будут сделаны из-за изменений, нужно прогнать

```bash
helmfile diff
```

### Репозитории

Мы можем подключать чарты из внешних репозиториев и сразу их применять 

```YAML
releases:
  - name: nginx
    namespace: default
    chart: oci://registry-1.docker.io/bitnamicharts/nginx # link
    version: "15.4.4"
    wait: true
    set:
      - name: service.type
        value: ClusterIP
```

`helmfile.yaml`
```YAML
# отдельное поле со списком
repositories:
 - name: prometheus-community
   url: https://prometheus-community.github.io/helm-charts

releases:
- name: prom-norbac-ubuntu
  namespace: prometheus
  chart: prometheus-community/prometheus # name и имя чарта из репозитория
  set:
  - name: rbac.create
    value: false
```

Определение `oci` репозитория

```YAML
repositories:
  - name: ocirepo
    url: registry-1.docker.io/bitnamicharts
    oci: true

releases:
  - name: nginx
    namespace: default
    chart: ocirepo/nginx
    version: 15.4.4
    wait: true
    set:
      - name: service.type
        value: ClusterIP
```

---
## Пример расширяемого конфигурирования

### Импорт стороннего репозитория  

Подключение внешнего каталога helm-чартов:

`.helmfile / repositories.yaml`
```
repositories:
 - name: bitnami
   url: https://charts.bitnami.com/bitnami
```

### Добавление релиза/чарта через external repo  

Здесь chart из стороннего репозитория, а values — переопределяются для каждого окружения.

`.helmfile/releases.yaml.gotmpl`
```
releases:
 - name: redis
   namespace: common
   chart: bitnami/redis
   version: 17.4.0
   installed: true
   values:
	 - password: secretpassword
	 - values/redis/{{ .Environment.Name }}.yaml
```

### Интеграция собственного Helm-чарта

Если нужно подключить свой чарт (например, charts/custom-app/):

```
releases:
  - name: custom-app
    namespace: apps
    chart: ./charts/custom-app
    version: 1.0.0
    installed: true
    values:
      - values/custom-app/{{ .Environment.Name }}.yaml
```

Helmfile автоматически учтет любые values-файлы и secrets для этого приложения.

---

## Организация окружений

- Окружения описываются в `.helmfile/environments.yaml`.  
- Для каждого окружения заводится своя папка в `envs/`:
  
  ```
  envs/
    staging/
      env.yaml
      values/
      secrets/
    prod/
      env.yaml
      values/
      secrets/
  ```

В `env.yaml` прописываются параметры окружения, в `values/` — параметры для конкретного приложения, в `secrets/` — зашифрованные sensitive-переменные (через SOPS).

---

## Основные команды для управления стэком

Деплой окружения полностью

```bash
helmfile -e prod apply
```

Обновить только конкретный релиз  

```bash
helmfile -l name=redis sync
```

Рендер манифестов без деплоя  

```bash
helmfile template
```

Работа с секретами через SOPS  

```bash
helm secrets edit envs/prod/secrets/_all.yaml
```

---

## Новая парадигма — как Helmfile меняет подход

- **Декларативность и контроль** — весь стек описан в git, все изменения отслеживаются, canary/rollback интуитивен.
- **Масштабируемость и расширяемость** — новый чарт или окружение добавляются за минуты через файлы и шаблоны.
- **Безопасность** — секреты хранятся безопасно, не попадают в открытый git.
- **Управление мультиокружениями** — быстрое переключение между dev/staging/prod.
- **Гибкость для DevOps** — чарты внутри, чарты снаружи, любые конфигурации — всё по единому workflow.

---

## TL;DR

Helmfile описывает всю инфраструктуру как код — ваши Kubernetes-приложения, параметры, secrets, зависимости, окружения, их связи и логику выкатки, всё управляется одной командой.

## Samples

- https://github.com/zam-zam/zzamzam-k8s
- https://github.com/zam-zam/helmfile-examples
