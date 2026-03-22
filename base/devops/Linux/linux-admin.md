---
tags:
  - devops
  - linux
title: Linux - продвинутое администрирование
---

# Linux - продвинутое администрирование

## Performance Troubleshooting

### Методология

**USE Method** (Utilization, Saturation, Errors) - для каждого ресурса (CPU, memory, disk, network) проверяем три метрики: утилизацию, насыщенность и ошибки.

**RED Method** (Rate, Errors, Duration) - для сервисов: количество запросов в секунду, процент ошибок, распределение задержек.

> [!summary] Порядок диагностики
> 1. `uptime` - load average за 1/5/15 минут
> 2. `dmesg -T | tail` - ошибки ядра
> 3. `vmstat 1 5` - общая картина CPU, memory, I/O
> 4. `iostat -xz 1 5` - дисковый I/O
> 5. `free -h` - состояние памяти
> 6. `sar -n DEV 1 5` - сетевой трафик
> 7. `top` или `htop` - процессы

### CPU

Метрика load average из `/proc/loadavg` показывает среднее количество процессов в очереди выполнения. Значение выше количества ядер указывает на перегрузку.

```bash
# Общая загрузка CPU по ядрам, обновление каждую секунду
mpstat -P ALL 1 5

# CPU и context switches по конкретному процессу
pidstat -w -p <PID> 1

# Частота переключений контекста для всей системы
vmstat 1 5
# колонки cs (context switches) и in (interrupts)

# Профилирование: какие функции потребляют CPU прямо сейчас
perf top

# Запись профиля в файл для детального анализа
perf record -g -p <PID> -- sleep 30
perf report
```

Высокий `%sys` в `mpstat` говорит о том, что ядро тратит много времени на системные вызовы. Высокий `%iowait` указывает на ожидание дискового I/O.

```bash
# Количество context switches - если выше 10-20k/sec, возможна проблема
cat /proc/<PID>/status | grep voluntary_ctxt_switches
```

### Memory

```bash
# Состояние памяти
free -h

# Детальная статистика
cat /proc/meminfo

# Динамический мониторинг (si/so - swap in/out)
vmstat 1 5
```

OOM Killer срабатывает, когда система исчерпывает доступную память. Поведение контролируется через `overcommit_memory`:

```bash
# Режимы overcommit
# 0 - эвристика ядра (по умолчанию)
# 1 - всегда разрешать overcommit
# 2 - строгий режим, не выделять больше swap + ratio*RAM
cat /proc/sys/vm/overcommit_memory

# OOM score процесса - чем выше, тем вероятнее убийство
cat /proc/<PID>/oom_score

# Защита процесса от OOM (от -1000 до 1000, -1000 = иммунитет)
echo -1000 > /proc/<PID>/oom_score_adj
```

Cgroups v2 позволяют задавать лимиты памяти для групп процессов:

```bash
# Создание cgroup с лимитом памяти
mkdir /sys/fs/cgroup/myapp
echo 512M > /sys/fs/cgroup/myapp/memory.max
echo 256M > /sys/fs/cgroup/myapp/memory.high

# Назначение процесса в cgroup
echo <PID> > /sys/fs/cgroup/myapp/cgroup.procs

# Текущее потребление
cat /sys/fs/cgroup/myapp/memory.current
```

Swap - когда нужен и настройка:

```bash
# Текущий swappiness (0-100, по умолчанию 60)
cat /proc/sys/vm/swappiness

# Для серверов с БД рекомендуется 10 или ниже
sysctl vm.swappiness=10

# Создание swap файла
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

> [!important]
> Для production серверов с базами данных и in-memory хранилищами устанавливайте `swappiness=1` или `swappiness=10`. Полное отключение swap опасно - при исчерпании RAM сработает OOM killer без предупреждения.

### Disk I/O

```bash
# Статистика I/O по устройствам
# await - среднее время выполнения запроса (мс)
# %util - загрузка устройства
iostat -xz 1 5

# I/O по процессам в реальном времени
iotop -oP

# Список блочных устройств
lsblk -f

# UUID и тип файловой системы
blkid

# Бенчмарк случайного чтения 4k блоками
fio --name=randread --ioengine=libaio --rw=randread \
    --bs=4k --numjobs=4 --size=1G --runtime=30 \
    --time_based --group_reporting

# Бенчмарк последовательной записи
fio --name=seqwrite --ioengine=libaio --rw=write \
    --bs=1M --numjobs=1 --size=4G --runtime=30 \
    --time_based --group_reporting

# SMART мониторинг - здоровье диска
smartctl -a /dev/sda

# Быстрая проверка состояния
smartctl -H /dev/sda
```

> [!info]
> Значение `await` выше 10 мс для SSD или выше 20 мс для HDD сигнализирует о проблемах. `%util` близкий к 100% означает, что устройство перегружено.

### Network

```bash
# Трафик по интерфейсам в реальном времени
iftop -i eth0

# Трафик по процессам
nethogs eth0

# Статистика по сетевым интерфейсам
sar -n DEV 1 5

# Ошибки и дропы на интерфейсах
ip -s link show eth0

# Количество соединений по состояниям
ss -s

# TCP соединения в состоянии TIME_WAIT
ss -tan state time-wait | wc -l

# Bandwidth тест
iperf3 -c <remote-host>
```

---

## systemd - продвинутое использование

### Создание unit файлов

Структура unit файла для сервиса:

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application Service
Documentation=https://docs.myapp.com
After=network-online.target postgresql.service
Wants=network-online.target
Requires=postgresql.service

[Service]
Type=notify
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStartPre=/opt/myapp/check-config.sh
ExecStart=/opt/myapp/bin/server --config /etc/myapp/config.yaml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
TimeoutStartSec=30s
TimeoutStopSec=30s

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/myapp /var/log/myapp
PrivateTmp=yes

# Resource limits
MemoryMax=1G
CPUQuota=200%
LimitNOFILE=65536

# Environment
EnvironmentFile=/etc/myapp/env
Environment=LOG_LEVEL=info

[Install]
WantedBy=multi-user.target
```

Типы сервисов:

| Type | Описание | Когда использовать |
|------|----------|-------------------|
| simple | Процесс из ExecStart является основным | Большинство демонов |
| forking | Демон форкается, родитель завершается | Legacy приложения с PIDFile |
| oneshot | Выполняется один раз и завершается | Скрипты инициализации |
| notify | Уведомляет systemd о готовности через sd_notify | Приложения с поддержкой sd_notify |
| exec | Как simple, но MAINPID отслеживается после exec | Обертки вокруг основного процесса |

```bash
# Применение изменений после редактирования unit файла
systemctl daemon-reload

# Включение и запуск
systemctl enable --now myapp.service

# Статус с последними логами
systemctl status myapp.service

# Причина последнего падения
systemctl show myapp.service -p ExecMainStatus,Result
```

### Timers вместо cron

Systemd timers предоставляют логирование через journald, зависимости от других сервисов, точный контроль выполнения и persistent таймеры, которые наверстывают пропущенные запуски.

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=900
AccuracySec=1min

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Backup job

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
User=backup
Nice=19
IOSchedulingClass=idle
```

Форматы `OnCalendar`:

```bash
# Каждый день в 3:00
OnCalendar=*-*-* 03:00:00

# Каждый понедельник в 6:30
OnCalendar=Mon *-*-* 06:30:00

# Каждые 15 минут
OnCalendar=*:0/15

# Первое число каждого месяца
OnCalendar=*-*-01 00:00:00

# Проверка формата
systemd-analyze calendar "Mon *-*-* 06:30:00"
```

Другие триггеры:

```ini
# Через 5 минут после загрузки
OnBootSec=5min

# Через 1 час после последнего запуска
OnUnitActiveSec=1h

# Комбинация - первый запуск после загрузки, потом периодически
OnBootSec=10min
OnUnitActiveSec=6h
```

```bash
# Список активных таймеров
systemctl list-timers --all

# Принудительный запуск
systemctl start backup.service
```

### journalctl - работа с логами

```bash
# Логи конкретного сервиса
journalctl -u myapp.service

# С момента последней загрузки
journalctl -u myapp.service -b

# За последний час
journalctl -u myapp.service --since "1 hour ago"

# За конкретный период
journalctl --since "2026-03-20 10:00" --until "2026-03-20 12:00"

# Только ошибки и критические
journalctl -u myapp.service -p err

# Follow mode - поток новых записей
journalctl -u myapp.service -f

# JSON формат для парсинга
journalctl -u myapp.service -o json-pretty

# Логи ядра
journalctl -k
```

Persistent журналы:

```bash
# По умолчанию логи хранятся в /run/log/journal (tmpfs, теряются при перезагрузке)
# Для сохранения на диск:
mkdir -p /var/log/journal
systemd-tmpfiles --create --prefix /var/log/journal

# Настройка ротации
# /etc/systemd/journald.conf
# SystemMaxUse=2G       - максимальный размер на диске
# SystemMaxFileSize=100M - максимальный размер одного файла
# MaxRetentionSec=30day  - хранить не дольше 30 дней

# Текущий размер журналов
journalctl --disk-usage

# Ручная очистка
journalctl --vacuum-size=1G
journalctl --vacuum-time=7d
```

### Targets

```bash
# Текущий target
systemctl get-default

# Переключение
systemctl set-default multi-user.target  # без GUI
systemctl set-default graphical.target   # с GUI

# Переход в rescue mode (single user)
systemctl isolate rescue.target

# Список всех targets
systemctl list-units --type target
```

### Socket activation

Socket activation позволяет systemd слушать порт и запускать сервис только при поступлении первого соединения:

```ini
# /etc/systemd/system/myapp.socket
[Unit]
Description=My App Socket

[Socket]
ListenStream=8080
Accept=no

[Install]
WantedBy=sockets.target
```

```bash
systemctl enable --now myapp.socket
# Сервис myapp.service запустится при первом подключении на порт 8080
```

### Слайсы и cgroups

```bash
# Дерево cgroups
systemd-cgls

# Потребление ресурсов по cgroups в реальном времени
systemd-cgtop

# Ограничение ресурсов для сервиса (runtime, без перезагрузки)
systemctl set-property myapp.service MemoryMax=1G
systemctl set-property myapp.service CPUQuota=150%

# Создание слайса для группировки сервисов
# /etc/systemd/system/apps.slice
# [Slice]
# MemoryMax=4G
# CPUQuota=300%
```

Назначение сервиса в слайс - добавить `Slice=apps.slice` в секцию `[Service]`.

---

## Process Management

### Signals

| Signal | Номер | Действие | Использование |
|--------|-------|----------|---------------|
| SIGTERM | 15 | Graceful shutdown | По умолчанию при `kill PID` |
| SIGKILL | 9 | Принудительное завершение | Последнее средство, процесс не может перехватить |
| SIGHUP | 1 | Перечитать конфигурацию | Nginx, Apache, многие демоны |
| SIGUSR1 | 10 | Пользовательский | Ротация логов, дамп состояния |
| SIGUSR2 | 12 | Пользовательский | Graceful restart в некоторых приложениях |
| SIGSTOP | 19 | Приостановка | Заморозка процесса |
| SIGCONT | 18 | Возобновление | Разморозка процесса |

```bash
# Graceful shutdown
kill -TERM <PID>

# Принудительное завершение (только если SIGTERM не помог)
kill -KILL <PID>

# Перечитать конфигурацию nginx
kill -HUP $(cat /var/run/nginx.pid)

# Всем процессам в группе
kill -TERM -<PGID>
```

Перехват сигналов в bash-скриптах:

```bash
#!/bin/bash
cleanup() {
    echo "Cleaning up..."
    rm -f /tmp/myapp.lock
    exit 0
}

trap cleanup SIGTERM SIGINT
trap "echo 'Reloading config...'; source /etc/myapp/config" SIGHUP

# Основной цикл
while true; do
    do_work
    sleep 1
done
```

### nice, renice, ionice

```bash
# Запуск процесса с пониженным приоритетом CPU (-20..19, больше = ниже приоритет)
nice -n 10 ./heavy-computation.sh

# Изменение приоритета работающего процесса
renice -n 5 -p <PID>

# Приоритет I/O (классы: 1=realtime, 2=best-effort, 3=idle)
ionice -c 3 -p <PID>

# Запуск с idle I/O - не мешает другим процессам
ionice -c 3 dd if=/dev/sda of=/backup/disk.img bs=1M
```

### ulimits

```bash
# Текущие лимиты
ulimit -a

# Максимальное количество открытых файлов
ulimit -n 65536

# Максимальное количество процессов
ulimit -u 4096
```

Постоянная настройка через `/etc/security/limits.conf`:

```
# /etc/security/limits.conf
myapp    soft    nofile    65536
myapp    hard    nofile    65536
myapp    soft    nproc     4096
myapp    hard    nproc     4096
myapp    soft    memlock   unlimited
myapp    hard    memlock   unlimited

# Для всех пользователей
*        soft    nofile    65536
*        hard    nofile    65536
```

> [!info]
> Для systemd-сервисов лимиты задаются в unit файле через `LimitNOFILE=65536`, `LimitNPROC=4096`, `LimitMEMLOCK=infinity`. Файл `limits.conf` на них не влияет.

### /proc filesystem

```bash
# Информация о процессе
cat /proc/<PID>/status    # статус, память, потоки
cat /proc/<PID>/cmdline   # командная строка запуска
cat /proc/<PID>/environ   # переменные окружения

# Открытые файловые дескрипторы
ls -la /proc/<PID>/fd
# Количество
ls /proc/<PID>/fd | wc -l

# Карта памяти процесса
cat /proc/<PID>/maps

# Текущий рабочий каталог
ls -la /proc/<PID>/cwd

# Бинарный файл процесса
ls -la /proc/<PID>/exe

# Сетевые соединения процесса
cat /proc/<PID>/net/tcp
```

### strace - отладка системных вызовов

```bash
# Трассировка запущенного процесса
strace -p <PID>

# Только сетевые вызовы
strace -e trace=network -p <PID>

# Только файловые операции
strace -e trace=file -p <PID>

# С временными метками и подсчетом времени в каждом вызове
strace -T -tt -p <PID>

# Статистика системных вызовов
strace -c -p <PID>
# Нажать Ctrl+C через некоторое время для вывода таблицы

# Запуск команды под strace с записью в файл
strace -o /tmp/trace.log -f ./myapp
```

### lsof - открытые файлы и сокеты

```bash
# Все открытые файлы процесса
lsof -p <PID>

# Кто использует конкретный файл
lsof /var/log/syslog

# Кто слушает на порту
lsof -i :8080

# Все сетевые соединения процесса
lsof -i -a -p <PID>

# TCP соединения в определенном состоянии
lsof -i TCP -s TCP:ESTABLISHED

# Все удаленные, но открытые файлы (занимают место на диске)
lsof +L1

# Файлы, открытые пользователем
lsof -u myapp
```

---

## Kernel Tuning (sysctl)

### Сетевые параметры

```bash
# /etc/sysctl.d/99-network-tuning.conf

# Максимальная очередь входящих соединений (по умолчанию 128, мало для нагруженных серверов)
net.core.somaxconn = 65535

# Переиспользование TIME_WAIT сокетов (безопасно включать)
net.ipv4.tcp_tw_reuse = 1

# Диапазон эфемерных портов (по умолчанию 32768-60999)
net.ipv4.ip_local_port_range = 1024 65535

# Буферы приема/отправки
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Максимальная очередь SYN (для защиты от SYN flood)
net.ipv4.tcp_max_syn_backlog = 65535

# Включение SYN cookies (защита от SYN flood)
net.ipv4.tcp_syncookies = 1

# Максимальное количество отслеживаемых соединений (conntrack)
net.netfilter.nf_conntrack_max = 1048576

# Ускорение обнаружения мертвых соединений
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 5

# Очередь бэклога сетевого стека
net.core.netdev_max_backlog = 65535
```

### Memory

```bash
# /etc/sysctl.d/99-memory-tuning.conf

# Склонность к использованию swap (0-100)
# 10 - для серверов приложений
# 1 - для серверов БД
vm.swappiness = 10

# Процент памяти для dirty pages перед принудительным сбросом
vm.dirty_ratio = 40

# Процент памяти для dirty pages перед фоновым сбросом
vm.dirty_background_ratio = 10

# Режим overcommit (0=эвристика, 1=всегда, 2=строгий)
vm.overcommit_memory = 0

# Для Redis/Elasticsearch рекомендуется:
# vm.overcommit_memory = 1
```

### File System

```bash
# /etc/sysctl.d/99-fs-tuning.conf

# Максимальное количество открытых файлов для всей системы
fs.file-max = 2097152

# Лимит inotify watches (для IDE, webpack, файловых мониторов)
fs.inotify.max_user_watches = 524288

# Количество inotify instances
fs.inotify.max_user_instances = 512
```

### Применение

```bash
# Применить все файлы из /etc/sysctl.d/
sysctl --system

# Применить конкретный файл
sysctl -p /etc/sysctl.d/99-network-tuning.conf

# Применить один параметр на лету (не сохраняется после перезагрузки)
sysctl -w net.core.somaxconn=65535

# Проверить текущее значение
sysctl net.core.somaxconn
```

> [!important]
> Всегда создавайте отдельные файлы в `/etc/sysctl.d/` вместо редактирования `/etc/sysctl.conf`. Это упрощает управление конфигурацией через Ansible и позволяет откатывать изменения по отдельности.

---

## LVM - продвинутый уровень

### Базовые операции

```bash
# Стек: Physical Volume (PV) → Volume Group (VG) → Logical Volume (LV)

# Создание PV
pvcreate /dev/sdb /dev/sdc

# Создание VG
vgcreate data_vg /dev/sdb /dev/sdc

# Создание LV
lvcreate -L 100G -n app_lv data_vg

# Создание файловой системы
mkfs.xfs /dev/data_vg/app_lv

# Монтирование
mount /dev/data_vg/app_lv /opt/app
echo '/dev/data_vg/app_lv /opt/app xfs defaults 0 0' >> /etc/fstab
```

### Расширение

```bash
# Добавление нового диска в VG
pvcreate /dev/sdd
vgextend data_vg /dev/sdd

# Расширение LV на 50G
lvextend -L +50G /dev/data_vg/app_lv

# Расширение файловой системы (XFS)
xfs_growfs /opt/app

# Расширение файловой системы (ext4)
resize2fs /dev/data_vg/app_lv

# Расширение LV с одновременным расширением FS
lvextend -L +50G -r /dev/data_vg/app_lv
```

### Снапшоты

```bash
# Создание снапшота (нужно свободное место в VG)
lvcreate -L 10G -s -n app_snap /dev/data_vg/app_lv

# Монтирование снапшота для чтения
mount -o ro /dev/data_vg/app_snap /mnt/snap

# Откат к снапшоту (LV должен быть размонтирован)
umount /opt/app
lvconvert --merge /dev/data_vg/app_snap
mount /dev/data_vg/app_lv /opt/app

# Удаление снапшота
lvremove /dev/data_vg/app_snap
```

### Thin Provisioning

Thin provisioning позволяет выделять больше места, чем физически доступно, и заполнять его по мере необходимости:

```bash
# Создание thin pool
lvcreate -L 200G --thinpool thin_pool data_vg

# Создание thin LV (виртуальный размер больше пула)
lvcreate -V 100G --thin -n app1_lv data_vg/thin_pool
lvcreate -V 100G --thin -n app2_lv data_vg/thin_pool
lvcreate -V 100G --thin -n app3_lv data_vg/thin_pool

# Суммарно 300G при физических 200G - работает пока реальное потребление меньше пула

# Мониторинг заполнения
lvs -o +data_percent,metadata_percent data_vg/thin_pool
```

> [!important]
> Настройте мониторинг заполнения thin pool. При 100% заполнении все thin LV станут недоступны. Автоматическое расширение настраивается в `/etc/lvm/lvm.conf` через параметр `thin_pool_autoextend_threshold`.

---

## RAID

### Уровни

| Уровень | Минимум дисков | Отказоустойчивость | Емкость | Использование |
|---------|---------------|-------------------|---------|---------------|
| RAID 0 | 2 | Нет | N * size | Только скорость, без надежности |
| RAID 1 | 2 | 1 диск | size | Загрузочные разделы, малые тома |
| RAID 5 | 3 | 1 диск | (N-1) * size | Хранение данных, чтение |
| RAID 6 | 4 | 2 диска | (N-2) * size | Критичные данные |
| RAID 10 | 4 | 1 диск на пару | N/2 * size | Базы данных, высокая производительность |

### mdadm - управление программным RAID

```bash
# Создание RAID 10
mdadm --create /dev/md0 --level=10 --raid-devices=4 \
    /dev/sd{b,c,d,e}

# Информация о массиве
mdadm --detail /dev/md0
cat /proc/mdstat

# Сохранение конфигурации
mdadm --detail --scan >> /etc/mdadm/mdadm.conf

# Замена сбойного диска
mdadm --manage /dev/md0 --fail /dev/sdc
mdadm --manage /dev/md0 --remove /dev/sdc
# Физическая замена диска
mdadm --manage /dev/md0 --add /dev/sdf
```

Мониторинг:

```bash
# Статус перестроения
cat /proc/mdstat

# Настройка email уведомлений
# /etc/mdadm/mdadm.conf
# MAILADDR admin@example.com
# PROGRAM /usr/local/bin/raid-alert.sh

# Запуск мониторинга
mdadm --monitor --scan --daemonise
```

---

## SELinux

### Режимы работы

```bash
# Текущий режим
getenforce

# Переключение без перезагрузки
setenforce 0  # permissive (только логирование)
setenforce 1  # enforcing (блокировка)

# Постоянная настройка
# /etc/selinux/config
# SELINUX=enforcing
```

| Режим | Поведение |
|-------|-----------|
| enforcing | Применяет политики и блокирует нарушения |
| permissive | Логирует нарушения, но не блокирует |
| disabled | Полностью отключен |

### Контексты безопасности

```bash
# Просмотр контекста файлов
ls -Z /var/www/html/

# Просмотр контекста процессов
ps auxZ | grep nginx

# Изменение контекста файла
chcon -t httpd_sys_content_t /var/www/html/index.html

# Восстановление контекста по умолчанию
restorecon -Rv /var/www/html/

# Добавление правила для контекста (переживет restorecon)
semanage fcontext -a -t httpd_sys_content_t "/opt/myapp(/.*)?"
restorecon -Rv /opt/myapp/
```

### Troubleshooting

```bash
# Анализ отказов из audit.log
ausearch -m AVC -ts recent

# Человекочитаемое объяснение
audit2why < /var/log/audit/audit.log

# Для RHEL/CentOS - графический анализ
sealert -a /var/log/audit/audit.log

# Генерация модуля политики из отказов
audit2allow -a -M mypolicy
semodule -i mypolicy.pp
```

### Booleans

```bash
# Список всех booleans
getsebool -a

# Конкретный boolean
getsebool httpd_can_network_connect

# Включение (постоянное)
setsebool -P httpd_can_network_connect on
setsebool -P httpd_can_network_connect_db on

# Поиск boolean по ключевому слову
semanage boolean -l | grep httpd
```

> [!info]
> При переводе сервера в production сначала включайте SELinux в permissive mode, анализируйте логи с помощью `audit2why`, создавайте необходимые политики, и только потом переключайте в enforcing.

---

## AppArmor

### Управление профилями

```bash
# Статус всех профилей
aa-status

# Режимы:
# enforce - блокирует нарушения
# complain - только логирует
# unconfined - профиль не загружен

# Переключение в режим complain для отладки
aa-complain /etc/apparmor.d/usr.sbin.nginx

# Переключение в enforce
aa-enforce /etc/apparmor.d/usr.sbin.nginx

# Отключение профиля
aa-disable /etc/apparmor.d/usr.sbin.nginx

# Перезагрузка всех профилей
systemctl reload apparmor
```

### Создание профиля

```bash
# Автоматическая генерация в complain mode
aa-genprof /usr/local/bin/myapp

# После работы приложения - обучение на основе логов
aa-logprof
```

Пример профиля:

```
# /etc/apparmor.d/usr.local.bin.myapp
#include <tunables/global>

/usr/local/bin/myapp {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  /usr/local/bin/myapp mr,
  /etc/myapp/** r,
  /var/lib/myapp/** rw,
  /var/log/myapp/** w,
  /tmp/myapp-* rw,

  network inet stream,
  network inet dgram,

  deny /etc/shadow r,
  deny /etc/passwd w,
}
```

---

## SSH - продвинутая настройка

### ~/.ssh/config

```
# Общие настройки
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
    IdentitiesOnly yes

# Прямое подключение
Host web-prod
    HostName 10.0.1.10
    User deploy
    IdentityFile ~/.ssh/prod_ed25519
    Port 2222

# Подключение через bastion
Host app-prod
    HostName 10.0.2.20
    User deploy
    ProxyJump bastion-prod

Host bastion-prod
    HostName bastion.example.com
    User jump
    IdentityFile ~/.ssh/bastion_ed25519

# Группа серверов с общими параметрами
Host staging-*
    User deploy
    IdentityFile ~/.ssh/staging_ed25519
    ProxyJump bastion-staging

Host staging-web
    HostName 10.1.1.10

Host staging-api
    HostName 10.1.1.20
```

### Tunneling

```bash
# Local forward - доступ к удаленному порту через локальный
# Подключение к PostgreSQL на удаленном сервере через localhost:5433
ssh -L 5433:localhost:5432 db-prod

# Remote forward - открытие локального сервиса на удаленном хосте
# Удаленный сервер сможет подключиться к вашему localhost:3000
ssh -R 8080:localhost:3000 remote-server

# Dynamic forward - SOCKS прокси
ssh -D 1080 bastion-prod
# Настроить приложения на SOCKS5 proxy localhost:1080

# Конфигурация в ~/.ssh/config
Host db-tunnel
    HostName db-prod.example.com
    LocalForward 5433 localhost:5432
    LocalForward 6380 redis-host:6379
```

### Hardening sshd_config

```bash
# /etc/ssh/sshd_config

# Запрет входа root
PermitRootLogin no

# Только ключевая аутентификация
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey

# Ограничение пользователей
AllowUsers deploy monitoring
AllowGroups ssh-users

# Нестандартный порт (obscurity, не security)
Port 2222

# Ограничение попыток
MaxAuthTries 3
MaxSessions 5
LoginGraceTime 30

# Запрет пустых паролей
PermitEmptyPasswords no

# Отключение X11 forwarding
X11Forwarding no

# Запрет agent forwarding (включать только где нужно)
AllowAgentForwarding no

# Баннер
Banner /etc/ssh/banner

# Алгоритмы (только современные)
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
```

```bash
# Проверка конфигурации перед применением
sshd -t

# Перезагрузка без разрыва текущих соединений
systemctl reload sshd
```

> [!important]
> Перед изменением настроек SSH всегда держите открытую сессию для отката. Проверяйте конфигурацию через `sshd -t` перед перезагрузкой сервиса.

---

## Автоматизация

### systemd timers

Рассмотрены выше в разделе systemd. Основные преимущества перед cron:

- Логирование через journald
- Зависимости от других сервисов
- Контроль ресурсов через cgroups
- Persistent таймеры (наверстывание пропущенных запусков)
- Рандомизация задержки для распределения нагрузки

### at и batch

```bash
# Одноразовое задание на конкретное время
echo "/usr/local/bin/maintenance.sh" | at 03:00

# Через 2 часа
echo "/usr/local/bin/report.sh" | at now + 2 hours

# batch - выполнится когда load average ниже порога (по умолчанию 1.5)
echo "/usr/local/bin/heavy-task.sh" | batch

# Список запланированных заданий
atq

# Удаление задания
atrm <job-id>
```

### incron - автоматизация по событиям файловой системы

```bash
# Установка
apt install incron  # Debian/Ubuntu
yum install incron  # RHEL/CentOS

# Разрешение пользователю
echo "deploy" >> /etc/incron.allow

# Редактирование таблицы
incrontab -e

# Формат: <путь> <маска> <команда>
# Маски: IN_CREATE, IN_MODIFY, IN_DELETE, IN_MOVED_TO, IN_CLOSE_WRITE

# Обработка загруженных файлов
/var/uploads IN_CLOSE_WRITE /usr/local/bin/process-upload.sh $@/$#

# Перезагрузка конфига при изменении
/etc/myapp/config.yaml IN_CLOSE_WRITE systemctl reload myapp

# Список текущих правил
incrontab -l
```

---

## Troubleshooting Runbook

### High CPU

```bash
# 1. Определить общую загрузку
uptime
# load average > количество ядер = перегрузка

# 2. Найти процесс-виновник
top -bn1 -o %CPU | head -20

# 3. Проверить - CPU в user space или kernel space
mpstat -P ALL 1 3
# Высокий %usr = приложение, высокий %sys = системные вызовы

# 4. Для конкретного процесса - что он делает
strace -c -p <PID> -S calls
# Ctrl+C через 10 секунд

# 5. Профилирование
perf top -p <PID>
```

### High Memory

```bash
# 1. Общая картина
free -h

# 2. Топ потребителей
ps aux --sort=-%mem | head -20

# 3. Проверить OOM события
dmesg -T | grep -i "oom\|out of memory"
journalctl -k | grep -i oom

# 4. Детальное потребление процесса (в килобайтах)
cat /proc/<PID>/status | grep -E "VmRSS|VmSize|VmSwap"

# 5. Проверить утечки - рост RSS со временем
while true; do
    ps -p <PID> -o pid,rss,vsz --no-headers
    sleep 60
done
```

### Disk Full

```bash
# 1. Какие разделы заполнены
df -h

# 2. Где занято место (от корня)
du -sh /* 2>/dev/null | sort -rh | head -10

# 3. Углубиться в проблемный каталог
du -sh /var/* 2>/dev/null | sort -rh | head -10

# 4. Большие файлы
find / -xdev -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# 5. Удаленные но открытые файлы (не освобождают место)
lsof +L1

# 6. Inodes исчерпаны (df -h показывает свободное место, но нельзя создать файлы)
df -i
```

### Network Issues

```bash
# 1. Интерфейсы работают
ip addr show
ip link show

# 2. DNS разрешается
dig example.com
host example.com

# 3. Маршрутизация
ip route show
traceroute -n <target>

# 4. Порт доступен
ss -tlnp | grep <PORT>
nc -zv <host> <port>

# 5. Firewall не блокирует
iptables -L -n -v
nft list ruleset

# 6. Ошибки и дропы на интерфейсе
ip -s link show eth0

# 7. Количество соединений (слишком много TIME_WAIT?)
ss -s
ss -tan state time-wait | wc -l
```

### Process Issues

```bash
# 1. Процесс работает
systemctl status myapp
ps aux | grep myapp

# 2. Что мешает запуску
journalctl -u myapp -n 50 --no-pager

# 3. Зависший процесс - что делает
strace -p <PID> 2>&1 | head -20

# 4. Файловые дескрипторы исчерпаны
ls /proc/<PID>/fd | wc -l
cat /proc/<PID>/limits | grep "open files"

# 5. Deadlock - потоки процесса
ls /proc/<PID>/task/
cat /proc/<PID>/task/*/status | grep State

# 6. Ресурсы (cgroup лимиты достигнуты?)
systemctl show myapp | grep -E "Memory|CPU"
```

> [!summary] Общий алгоритм диагностики
> 1. `uptime` - load average, сколько система работает
> 2. `dmesg -T | tail -20` - ошибки ядра
> 3. `free -h` - память
> 4. `df -h` - диски
> 5. `top -bn1 | head -20` - процессы
> 6. `ss -s` - сетевые соединения
> 7. `journalctl -p err --since "1 hour ago"` - ошибки в логах

---

## Полезные однострочники

```bash
# 1. Топ-10 процессов по CPU
ps aux --sort=-%cpu | head -11

# 2. Топ-10 процессов по памяти
ps aux --sort=-%mem | head -11

# 3. Количество соединений по IP
ss -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -10

# 4. Размер каталогов первого уровня
du -sh */ 2>/dev/null | sort -rh

# 5. Поиск больших файлов (>100MB)
find / -xdev -type f -size +100M -exec ls -lh {} \; 2>/dev/null | sort -k5 -rh

# 6. Кто слушает на каких портах
ss -tlnp

# 7. Последние входы в систему
last -20

# 8. Неудачные попытки входа
lastb -20

# 9. Файлы измененные за последний час
find /etc -mmin -60 -type f 2>/dev/null

# 10. Текущие дисковые операции
iostat -xz 1 1

# 11. Количество открытых файлов по процессам
lsof 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# 12. TCP соединения в TIME_WAIT
ss -tan state time-wait | wc -l

# 13. Проверка доступности порта на удаленном хосте
nc -zv -w3 <host> <port>

# 14. Мониторинг трафика на интерфейсе (пакеты/сек)
sar -n DEV 1 5

# 15. Процессы, потребляющие I/O
iotop -oP -bn1

# 16. Zombie процессы
ps aux | awk '$8 ~ /Z/ {print}'

# 17. Текущий context switch rate
vmstat 1 3 | tail -1 | awk '{print "CS:", $12, "Interrupts:", $11}'

# 18. Температура CPU (если установлен lm-sensors)
sensors 2>/dev/null || cat /sys/class/thermal/thermal_zone*/temp

# 19. Uptime и средняя загрузка в одну строку
uptime | awk -F'load average:' '{print $2}'

# 20. Быстрый аудит безопасности - SUID файлы
find / -perm -4000 -type f 2>/dev/null
```
