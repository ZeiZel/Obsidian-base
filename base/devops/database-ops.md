---
tags:
  - devops
  - database
title: Database Operations
---

## PostgreSQL Operations

### Backup стратегии

Выбор стратегии бэкапа зависит от размера базы, допустимого RPO и RTO, а также требований к гранулярности восстановления.

#### Logical backup - pg_dump

Логический бэкап создаёт SQL-скрипт или архив с данными. Подходит для баз до 100 GB и миграций между версиями PostgreSQL.

```bash
# custom format - сжатый, поддерживает параллельное восстановление
pg_dump -Fc -j 4 -f /backups/mydb.dump mydb

# только схема
pg_dump -s -f /backups/schema.sql mydb

# конкретные таблицы
pg_dump -t orders -t order_items -Fc -f /backups/orders.dump mydb

# восстановление с параллелизмом
pg_restore -j 4 -d mydb /backups/mydb.dump
```

> [!important]
> pg_dump берёт consistent snapshot на момент начала. Для больших баз время бэкапа может быть значительным, но данные остаются консистентными.

#### Physical backup - pg_basebackup

Копирует весь data directory на уровне файлов. Быстрее для больших баз, но привязан к конкретной мажорной версии PostgreSQL.

```bash
# стандартный бэкап с WAL
pg_basebackup -D /backups/base -Ft -z -Xs -P -c fast

# с явным указанием хоста и слота репликации
pg_basebackup -h primary.db.local -U replicator \
  -D /backups/base -Ft -z -Xs -S backup_slot -P
```

#### WAL archiving

WAL archiving позволяет сохранять журналы транзакций для PITR. Без WAL-архивирования восстановление возможно только на момент создания бэкапа.

```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
archive_timeout = 300
```

#### pgBackRest

Инструмент для production backup с поддержкой инкрементальных бэкапов, параллельного сжатия и шифрования.

```ini
# /etc/pgbackrest/pgbackrest.conf
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=2
repo1-retention-diff=7
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass=secretkey
compress-type=zst
compress-level=3
process-max=4

[mydb]
pg1-path=/var/lib/postgresql/16/main
pg1-port=5432
```

```bash
# инициализация репозитория
pgbackrest --stanza=mydb stanza-create

# полный бэкап
pgbackrest --stanza=mydb --type=full backup

# инкрементальный бэкап
pgbackrest --stanza=mydb --type=incr backup

# дифференциальный бэкап
pgbackrest --stanza=mydb --type=diff backup

# проверка бэкапов
pgbackrest --stanza=mydb info

# восстановление
pgbackrest --stanza=mydb --delta restore
```

> [!info]
> pgBackRest поддерживает бэкап в S3, GCS и Azure Blob Storage. Для production рекомендуется хранить бэкапы в облачном объектном хранилище с cross-region replication.

#### Barman

Альтернатива pgBackRest от EnterpriseDB. Поддерживает rsync и streaming бэкап.

```ini
# /etc/barman.d/mydb.conf
[mydb]
description = "Production PostgreSQL"
ssh_command = ssh postgres@primary.db.local
conninfo = host=primary.db.local user=barman dbname=postgres
backup_method = postgres
streaming_archiver = on
slot_name = barman
retention_policy = RECOVERY WINDOW OF 7 DAYS
```

```bash
# создание бэкапа
barman backup mydb

# список бэкапов
barman list-backup mydb

# восстановление на определённый момент
barman recover mydb 20260322T010000 /var/lib/postgresql/16/main \
  --target-time "2026-03-22 01:30:00" \
  --remote-ssh-command "ssh postgres@standby.db.local"
```

### PITR - Point-in-Time Recovery

PITR позволяет восстановить базу на произвольный момент времени между бэкапами. Требует physical backup и непрерывную цепочку WAL-сегментов.

#### Настройка

```ini
# postgresql.conf на primary
wal_level = replica
archive_mode = on
archive_command = 'pgbackrest --stanza=mydb archive-push %p'
```

#### Восстановление

```bash
# остановить PostgreSQL
systemctl stop postgresql

# восстановить базовый бэкап
pgbackrest --stanza=mydb --delta \
  --type=time "--target=2026-03-22 14:30:00+03" \
  --target-action=promote restore

# запустить PostgreSQL - recovery произойдёт автоматически
systemctl start postgresql
```

При восстановлении через recovery.signal:

```ini
# postgresql.auto.conf (создаётся pgbackrest автоматически)
restore_command = 'pgbackrest --stanza=mydb archive-get %f "%p"'
recovery_target_time = '2026-03-22 14:30:00+03'
recovery_target_action = 'promote'
```

> [!important]
> Регулярно тестируйте PITR на staging-окружении. Бэкап без проверенного восстановления - это не бэкап.

### Replication

#### Streaming Replication

Основной механизм репликации PostgreSQL. Primary отправляет WAL-записи на replica в реальном времени.

На primary:

```ini
# postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB

# для synchronous replication
synchronous_standby_names = 'replica1'
synchronous_commit = on
```

```sql
-- создание пользователя для репликации
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secret';
```

```
# pg_hba.conf
host replication replicator 10.0.0.0/24 scram-sha-256
```

На replica:

```bash
# инициализация реплики
pg_basebackup -h primary.db.local -U replicator \
  -D /var/lib/postgresql/16/main -Xs -P -R
```

Флаг `-R` создаёт standby.signal и прописывает primary_conninfo в postgresql.auto.conf.

#### Async vs Sync

Асинхронная репликация - primary не ждёт подтверждения от replica. Возможна потеря данных при failover.

Синхронная репликация - primary ждёт подтверждения записи WAL на replica. Гарантирует zero data loss, но увеличивает latency.

```ini
# synchronous_commit варианты
synchronous_commit = off          # не ждать записи WAL
synchronous_commit = local        # ждать записи на primary
synchronous_commit = remote_write # ждать записи в OS cache на replica
synchronous_commit = on           # ждать записи WAL на replica
synchronous_commit = remote_apply # ждать применения WAL на replica
```

#### Logical Replication

Репликация на уровне логических изменений. Позволяет реплицировать отдельные таблицы и работает между разными мажорными версиями.

```sql
-- на publisher
CREATE PUBLICATION my_pub FOR TABLE orders, customers;

-- на subscriber
CREATE SUBSCRIPTION my_sub
  CONNECTION 'host=primary.db.local dbname=mydb user=replicator'
  PUBLICATION my_pub;

-- проверка статуса
SELECT * FROM pg_stat_subscription;
```

#### Replication Slots

Слоты репликации гарантируют, что primary сохраняет WAL-сегменты до тех пор, пока replica их не получит.

```sql
-- физический слот
SELECT pg_create_physical_replication_slot('replica1_slot');

-- логический слот
SELECT pg_create_logical_replication_slot('my_slot', 'pgoutput');

-- мониторинг слотов
SELECT slot_name, slot_type, active,
       pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS lag_bytes
FROM pg_replication_slots;
```

> [!important]
> Неактивный replication slot накапливает WAL и может заполнить диск. Всегда мониторьте размер WAL и удаляйте неиспользуемые слоты.

### High Availability - Patroni

**Patroni** - менеджер HA для PostgreSQL, использующий distributed consensus через etcd, ZooKeeper или Consul.

#### Архитектура

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  etcd1  │    │  etcd2  │    │  etcd3  │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────┴────┐    ┌────┴────┐    ┌────┴────┐
│ Patroni │    │ Patroni │    │ Patroni │
│ Primary │    │ Replica │    │ Replica │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
              ┌─────┴─────┐
              │ HAProxy /  │
              │ PgBouncer  │
              └────────────┘
```

#### Конфигурация Patroni

```yaml
# /etc/patroni/patroni.yml
scope: postgres-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 10.0.1.1:8008

etcd3:
  hosts: etcd1:2379,etcd2:2379,etcd3:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    synchronous_mode: true
    postgresql:
      use_pg_rewind: true
      use_slots: true
      parameters:
        max_connections: 200
        shared_buffers: 4GB
        effective_cache_size: 12GB
        work_mem: 64MB
        maintenance_work_mem: 512MB
        wal_level: replica
        max_wal_senders: 10
        max_replication_slots: 10

  initdb:
    - encoding: UTF8
    - data-checksums

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 10.0.1.1:5432
  data_dir: /var/lib/postgresql/16/main
  authentication:
    superuser:
      username: postgres
      password: supersecret
    replication:
      username: replicator
      password: repsecret
```

#### Управление кластером

```bash
# статус кластера
patronictl -c /etc/patroni/patroni.yml list

# плановое переключение (switchover)
patronictl -c /etc/patroni/patroni.yml switchover

# принудительное переключение (failover)
patronictl -c /etc/patroni/patroni.yml failover

# изменение параметров
patronictl -c /etc/patroni/patroni.yml edit-config

# перезагрузка конфигурации на всех нодах
patronictl -c /etc/patroni/patroni.yml reload postgres-cluster
```

### Connection Pooling - PgBouncer

PgBouncer снижает нагрузку на PostgreSQL, переиспользуя соединения. Без пулера каждое соединение создаёт отдельный процесс в PostgreSQL.

#### Режимы работы

- session - клиент владеет серверным соединением на всё время сессии. Минимальный выигрыш
- transaction - соединение выделяется на время транзакции. Рекомендуемый режим для большинства приложений
- statement - соединение выделяется на каждый запрос. Не поддерживает multi-statement транзакции

#### Конфигурация

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

pool_mode = transaction
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_client_conn = 1000
max_db_connections = 100

# таймауты
server_idle_timeout = 600
client_idle_timeout = 0
query_timeout = 0
query_wait_timeout = 120

# логирование
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

#### Мониторинг PgBouncer

```sql
-- подключение к admin-консоли
psql -p 6432 -U pgbouncer pgbouncer

-- статистика пулов
SHOW POOLS;

-- активные клиенты
SHOW CLIENTS;

-- серверные соединения
SHOW SERVERS;

-- общая статистика
SHOW STATS;

-- конфигурация
SHOW CONFIG;
```

### Мониторинг PostgreSQL

#### pg_stat_statements

Расширение для отслеживания статистики выполнения запросов. Критически важно для выявления медленных и частых запросов.

```ini
# postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = top
```

```sql
CREATE EXTENSION pg_stat_statements;

-- топ-10 запросов по общему времени
SELECT query,
       calls,
       round(total_exec_time::numeric, 2) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- запросы с высоким соотношением shared_blks_read к shared_blks_hit
SELECT query,
       shared_blks_hit,
       shared_blks_read,
       round(100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_pct
FROM pg_stat_statements
WHERE calls > 100
ORDER BY cache_hit_pct ASC
LIMIT 10;
```

#### pg_stat_activity

Текущая активность в базе.

```sql
-- активные запросы
SELECT pid, usename, client_addr, state,
       now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- блокировки
SELECT blocked.pid AS blocked_pid,
       blocked.query AS blocked_query,
       blocking.pid AS blocking_pid,
       blocking.query AS blocking_query
FROM pg_stat_activity AS blocked
JOIN pg_locks AS bl ON bl.pid = blocked.pid
JOIN pg_locks AS kl ON kl.locktype = bl.locktype
  AND kl.database IS NOT DISTINCT FROM bl.database
  AND kl.relation IS NOT DISTINCT FROM bl.relation
  AND kl.page IS NOT DISTINCT FROM bl.page
  AND kl.tuple IS NOT DISTINCT FROM bl.tuple
  AND kl.transactionid IS NOT DISTINCT FROM bl.transactionid
  AND kl.pid != bl.pid
  AND kl.granted
JOIN pg_stat_activity AS blocking ON blocking.pid = kl.pid
WHERE NOT bl.granted;
```

#### pg_stat_replication

```sql
-- статус репликации
SELECT client_addr,
       state,
       sent_lsn,
       write_lsn,
       flush_lsn,
       replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes,
       sync_state
FROM pg_stat_replication;
```

#### Prometheus - postgres_exporter

```yaml
# docker-compose.yml
services:
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    environment:
      DATA_SOURCE_NAME: "postgresql://monitor:secret@postgres:5432/mydb?sslmode=disable"
    ports:
      - "9187:9187"
```

Ключевые метрики для алертинга:

```yaml
# prometheus alert rules
groups:
  - name: postgresql
    rules:
      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical

      - alert: PostgreSQLReplicationLag
        expr: pg_replication_lag > 30
        for: 5m
        labels:
          severity: warning

      - alert: PostgreSQLDeadlocks
        expr: rate(pg_stat_database_deadlocks[5m]) > 0
        for: 5m
        labels:
          severity: warning

      - alert: PostgreSQLConnectionsHigh
        expr: pg_stat_activity_count / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning

      - alert: PostgreSQLDiskSpace
        expr: pg_database_size_bytes / node_filesystem_size_bytes > 0.85
        for: 10m
        labels:
          severity: warning
```

### Vacuum и Autovacuum

PostgreSQL использует MVCC - старые версии строк не удаляются сразу, а помечаются как dead tuples. VACUUM освобождает место от dead tuples.

#### Настройка autovacuum

```ini
# postgresql.conf
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min

# пороги запуска
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.05

# ограничение ресурсов
autovacuum_vacuum_cost_delay = 2ms
autovacuum_vacuum_cost_limit = 1000
```

Для больших таблиц с активной записью стоит уменьшить scale_factor:

```sql
-- настройка autovacuum для конкретной таблицы
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 0
);
```

#### Мониторинг bloat

```sql
-- dead tuples и последний vacuum
SELECT schemaname, relname,
       n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
       last_vacuum, last_autovacuum,
       last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- оценка table bloat
SELECT tablename,
       pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total_size,
       pg_size_pretty(pg_relation_size(tablename::regclass)) AS table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC
LIMIT 20;
```

#### pg_repack

Online reorganization таблиц без блокировки. Альтернатива VACUUM FULL, которая блокирует таблицу.

```bash
# установка
apt install postgresql-16-repack

# перепаковка таблицы
pg_repack -d mydb -t orders

# перепаковка всей базы
pg_repack -d mydb

# только индексы
pg_repack -d mydb -t orders --only-indexes
```

### PostgreSQL Upgrades

#### pg_upgrade

Быстрое обновление между мажорными версиями. Работает in-place, но требует даунтайм.

```bash
# проверка совместимости
/usr/lib/postgresql/17/bin/pg_upgrade \
  --old-datadir=/var/lib/postgresql/16/main \
  --new-datadir=/var/lib/postgresql/17/main \
  --old-bindir=/usr/lib/postgresql/16/bin \
  --new-bindir=/usr/lib/postgresql/17/bin \
  --check

# обновление с использованием hard links (быстрее)
pg_upgrade \
  --old-datadir=/var/lib/postgresql/16/main \
  --new-datadir=/var/lib/postgresql/17/main \
  --old-bindir=/usr/lib/postgresql/16/bin \
  --new-bindir=/usr/lib/postgresql/17/bin \
  --link

# после обновления - обновить статистику
/usr/lib/postgresql/17/bin/vacuumdb --all --analyze-in-stages
```

#### Zero-downtime upgrade через logical replication

Для сценариев, когда даунтайм недопустим:

1. Поднять новый кластер на целевой версии
2. Настроить logical replication со старого на новый
3. Дождаться синхронизации
4. Переключить приложение на новый кластер
5. Отключить репликацию

```sql
-- на старом кластере (publisher)
CREATE PUBLICATION upgrade_pub FOR ALL TABLES;

-- на новом кластере (subscriber)
CREATE SUBSCRIPTION upgrade_sub
  CONNECTION 'host=old-primary.db.local dbname=mydb user=replicator'
  PUBLICATION upgrade_pub;

-- проверка лага репликации
SELECT * FROM pg_stat_subscription;
```

---

## MySQL/MariaDB Operations

### Backup

#### mysqldump

Логический бэкап. Подходит для баз до 50 GB.

```bash
# полный бэкап с позицией binlog
mysqldump --all-databases --single-transaction \
  --routines --triggers --events \
  --master-data=2 --flush-logs \
  -u root -p > /backups/full_backup.sql

# конкретная база
mysqldump --single-transaction --routines \
  -u root -p mydb > /backups/mydb.sql

# восстановление
mysql -u root -p mydb < /backups/mydb.sql
```

#### Percona XtraBackup

Physical backup для InnoDB. Поддерживает hot backup без блокировки таблиц.

```bash
# полный бэкап
xtrabackup --backup --target-dir=/backups/full \
  --user=root --password=secret

# подготовка бэкапа
xtrabackup --prepare --target-dir=/backups/full

# инкрементальный бэкап
xtrabackup --backup --target-dir=/backups/incr1 \
  --incremental-basedir=/backups/full \
  --user=root --password=secret

# подготовка инкрементального бэкапа
xtrabackup --prepare --apply-log-only --target-dir=/backups/full
xtrabackup --prepare --target-dir=/backups/full \
  --incremental-dir=/backups/incr1

# восстановление
systemctl stop mysql
xtrabackup --copy-back --target-dir=/backups/full
chown -R mysql:mysql /var/lib/mysql
systemctl start mysql
```

#### Binlog для PITR

```ini
# my.cnf
[mysqld]
log_bin = /var/log/mysql/mysql-bin
binlog_format = ROW
expire_logs_days = 14
max_binlog_size = 256M
server_id = 1
```

```bash
# восстановление из binlog до конкретного момента
mysqlbinlog --stop-datetime="2026-03-22 14:30:00" \
  /var/log/mysql/mysql-bin.000042 | mysql -u root -p
```

### Replication

#### GTID-based Replication

GTID упрощает управление репликацией и failover.

```ini
# my.cnf на primary
[mysqld]
server_id = 1
gtid_mode = ON
enforce_gtid_consistency = ON
log_bin = /var/log/mysql/mysql-bin
binlog_format = ROW
```

```ini
# my.cnf на replica
[mysqld]
server_id = 2
gtid_mode = ON
enforce_gtid_consistency = ON
relay_log = /var/log/mysql/relay-bin
read_only = ON
```

```sql
-- настройка репликации на replica
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST = 'primary.db.local',
  SOURCE_USER = 'replicator',
  SOURCE_PASSWORD = 'secret',
  SOURCE_AUTO_POSITION = 1;

START REPLICA;
SHOW REPLICA STATUS\G
```

#### Semi-Synchronous Replication

Компромисс между производительностью async и надёжностью sync.

```sql
-- на primary
INSTALL PLUGIN rpl_semi_sync_source SONAME 'semisync_source.so';
SET GLOBAL rpl_semi_sync_source_enabled = 1;
SET GLOBAL rpl_semi_sync_source_timeout = 5000;

-- на replica
INSTALL PLUGIN rpl_semi_sync_replica SONAME 'semisync_replica.so';
SET GLOBAL rpl_semi_sync_replica_enabled = 1;
```

#### Group Replication

Multi-primary или single-primary режим с автоматическим failover.

```ini
# my.cnf
[mysqld]
plugin_load_add = 'group_replication.so'
group_replication_group_name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
group_replication_start_on_boot = OFF
group_replication_local_address = "10.0.1.1:33061"
group_replication_group_seeds = "10.0.1.1:33061,10.0.1.2:33061,10.0.1.3:33061"
group_replication_single_primary_mode = ON
```

### InnoDB Tuning

Основные параметры, влияющие на производительность:

```ini
# my.cnf
[mysqld]
# buffer pool - 70-80% доступной RAM
innodb_buffer_pool_size = 12G
innodb_buffer_pool_instances = 8

# redo log
innodb_log_file_size = 2G
innodb_log_buffer_size = 64M

# I/O
innodb_io_capacity = 2000
innodb_io_capacity_max = 4000
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 1

# concurrency
innodb_thread_concurrency = 0
innodb_read_io_threads = 8
innodb_write_io_threads = 8

# другие
innodb_file_per_table = ON
innodb_open_files = 4000
innodb_lock_wait_timeout = 50
```

> [!info]
> innodb_flush_log_at_trx_commit = 1 обеспечивает ACID compliance. Значение 2 повышает производительность, но допускает потерю до 1 секунды транзакций при краше ОС.

---

## Database в Kubernetes

### Операторы для PostgreSQL

#### CloudNativePG

Оператор, разработанный EDB. Нативная интеграция с Kubernetes, автоматический failover и бэкапы.

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: database
spec:
  instances: 3
  imageName: ghcr.io/cloudnative-pg/postgresql:16.2

  storage:
    size: 100Gi
    storageClass: gp3-encrypted

  resources:
    requests:
      memory: 4Gi
      cpu: "2"
    limits:
      memory: 8Gi
      cpu: "4"

  postgresql:
    parameters:
      shared_buffers: "2GB"
      effective_cache_size: "6GB"
      work_mem: "64MB"
      max_connections: "200"
      pg_stat_statements.max: "10000"
      pg_stat_statements.track: "top"
    shared_preload_libraries:
      - "pg_stat_statements"

  bootstrap:
    initdb:
      database: mydb
      owner: app
      secret:
        name: postgres-credentials

  backup:
    barmanObjectStore:
      destinationPath: s3://my-backups/postgres/
      s3Credentials:
        accessKeyId:
          name: s3-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: s3-creds
          key: SECRET_ACCESS_KEY
      wal:
        compression: gzip
      data:
        compression: gzip
    retentionPolicy: "30d"

  monitoring:
    enablePodMonitor: true

  affinity:
    topologyKey: topology.kubernetes.io/zone
```

#### Zalando Postgres Operator

```yaml
apiVersion: acid.zalan.do/v1
kind: postgresql
metadata:
  name: postgres-cluster
  namespace: database
spec:
  teamId: "myteam"
  numberOfInstances: 3
  volume:
    size: 100Gi
    storageClass: gp3-encrypted

  postgresql:
    version: "16"
    parameters:
      shared_buffers: "2GB"
      max_connections: "200"

  patroni:
    synchronous_mode: true
    ttl: 30
    loop_wait: 10

  resources:
    requests:
      cpu: "2"
      memory: 4Gi
    limits:
      cpu: "4"
      memory: 8Gi

  users:
    app:
      - superuser
      - createdb
  databases:
    mydb: app

  enableConnectionPooler: true
  connectionPooler:
    numberOfInstances: 2
    mode: transaction
    defaultCpuRequest: 500m
    defaultMemoryRequest: 256Mi
```

### Managed vs Self-hosted

Выбор между managed и self-hosted зависит от нескольких факторов:

| Критерий | Managed (RDS, Cloud SQL) | Self-hosted (Operator) |
|----------|--------------------------|------------------------|
| Операционная нагрузка | Минимальная | Значительная |
| Стоимость (маленькие базы) | Дороже | Дешевле |
| Стоимость (большие базы) | Значительно дороже | Дешевле |
| Гибкость настройки | Ограниченная | Полная |
| Extensions | Ограниченный набор | Любые |
| Мажорные обновления | Managed, но с даунтаймом | Полный контроль |
| Бэкапы | Автоматические | Настраиваемые |
| HA / Failover | Встроенный | Через оператор |

> [!summary]
> Для команд без выделенного DBA - managed databases. Для команд с экспертизой и требованиями к гибкости - self-hosted с операторами. Гибридный подход тоже допустим: production на managed, dev/staging на операторах.

---

## Managed Databases

### AWS RDS / Aurora

#### Provisioning через Terraform

```hcl
resource "aws_db_instance" "postgres" {
  identifier     = "production-postgres"
  engine         = "postgres"
  engine_version = "16.2"
  instance_class = "db.r6g.xlarge"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.db.arn

  db_name  = "mydb"
  username = "postgres"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled    = true
  monitoring_interval             = 60
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "production-postgres-final"

  parameter_group_name = aws_db_parameter_group.postgres16.name

  tags = {
    Environment = "production"
    Team        = "platform"
  }
}

resource "aws_db_parameter_group" "postgres16" {
  family = "postgres16"
  name   = "production-postgres16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "top"
  }
}
```

#### Aurora

Aurora обеспечивает автоматическую репликацию на уровне storage с failover за 30 секунд.

```hcl
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "production-aurora"
  engine             = "aurora-postgresql"
  engine_version     = "16.1"
  database_name      = "mydb"
  master_username    = "postgres"
  master_password    = data.aws_secretsmanager_secret_version.db_password.secret_string

  storage_encrypted = true
  kms_key_id        = aws_kms_key.db.arn

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.db.name

  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  deletion_protection     = true

  enabled_cloudwatch_logs_exports = ["postgresql"]
}

resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = 3
  identifier         = "production-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.r6g.xlarge"
  engine             = aws_rds_cluster.aurora.engine

  performance_insights_enabled = true
  monitoring_interval          = 60
}
```

### Google Cloud SQL

```hcl
resource "google_sql_database_instance" "postgres" {
  name             = "production-postgres"
  database_version = "POSTGRES_16"
  region           = "us-central1"

  settings {
    tier              = "db-custom-4-16384"
    availability_type = "REGIONAL"
    disk_size         = 100
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      require_ssl     = true
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }

    insights_config {
      query_insights_enabled  = true
      record_application_tags = true
      record_client_address   = true
    }

    maintenance_window {
      day          = 1
      hour         = 4
      update_track = "stable"
    }
  }

  deletion_protection = true
}
```

---

## Database Migrations в CI/CD

### Инструменты миграций

#### Flyway

SQL-based миграции с версионированием. Простой и предсказуемый.

```
migrations/
├── V1__create_users.sql
├── V2__create_orders.sql
├── V3__add_email_index.sql
└── V4__add_status_column.sql
```

```sql
-- V1__create_users.sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
```

```yaml
# CI/CD pipeline step
- name: Run migrations
  run: |
    flyway -url=jdbc:postgresql://$DB_HOST:5432/$DB_NAME \
           -user=$DB_USER -password=$DB_PASSWORD \
           -locations=filesystem:./migrations \
           migrate
```

#### golang-migrate

Миграции с поддержкой up и down.

```bash
# создание миграции
migrate create -ext sql -dir migrations -seq add_orders_table

# применение
migrate -path migrations \
  -database "postgres://user:pass@host:5432/mydb?sslmode=require" \
  up

# откат последней миграции
migrate -path migrations \
  -database "postgres://user:pass@host:5432/mydb?sslmode=require" \
  down 1
```

#### Atlas

Декларативный подход к миграциям. Описывает целевую схему, генерирует миграции автоматически.

```hcl
# schema.hcl
schema "public" {}

table "users" {
  schema = schema.public
  column "id" {
    type = bigint
    identity {
      generated = ALWAYS
    }
  }
  column "email" {
    type = varchar(255)
    null = false
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_users_email" {
    unique  = true
    columns = [column.email]
  }
}
```

```bash
# генерация миграции из разницы между схемой и базой
atlas migrate diff add_users \
  --dir "file://migrations" \
  --to "file://schema.hcl" \
  --dev-url "docker://postgres/16"

# применение
atlas migrate apply --dir "file://migrations" \
  --url "postgres://user:pass@host:5432/mydb?sslmode=require"
```

### Zero-downtime Migrations

#### Expand-Contract Pattern

Безопасный паттерн для изменения схемы без даунтайма. Состоит из трёх фаз:

1. Expand - добавить новую структуру, не удаляя старую
2. Migrate - перенести данные и код на новую структуру
3. Contract - удалить старую структуру после полного перехода

Пример переименования колонки:

```sql
-- Phase 1: Expand - добавить новую колонку
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
UPDATE users SET full_name = name WHERE full_name IS NULL;
-- deploy code that writes to both columns

-- Phase 2: Migrate - переключить чтение на новую колонку
-- deploy code that reads from full_name

-- Phase 3: Contract - удалить старую колонку
ALTER TABLE users DROP COLUMN name;
```

#### Backward Compatible Changes

Безопасные операции для production:

- Добавление таблицы или колонки с NULL или DEFAULT
- Добавление индекса CONCURRENTLY
- Добавление новых значений в enum

Опасные операции, требующие expand-contract:

- Удаление или переименование колонки
- Изменение типа колонки
- Добавление NOT NULL без DEFAULT
- Удаление таблицы

```sql
-- безопасное создание индекса (без блокировки таблицы)
CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status);

-- безопасное добавление NOT NULL
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
-- deploy code that fills phone
UPDATE users SET phone = 'unknown' WHERE phone IS NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
ALTER TABLE users ALTER COLUMN phone SET DEFAULT 'unknown';
```

> [!important]
> В PostgreSQL DDL-операции берут ACCESS EXCLUSIVE LOCK. CREATE INDEX CONCURRENTLY и добавление колонки с DEFAULT (PG 11+) - исключения, которые не блокируют таблицу.

### Rollback стратегии

Forward-only migrations предпочтительнее rollback. Вместо отката создаётся новая миграция, исправляющая проблему.

Если rollback необходим:

```bash
# golang-migrate - откат последней миграции
migrate down 1

# flyway - undo migration (требует Teams edition)
flyway undo

# ручной откат
psql -f migrations/rollback/V4__rollback_status_column.sql
```

Рекомендации:

- Каждая миграция должна быть идемпотентной
- Для каждой миграции писать rollback-скрипт
- Тестировать миграции на копии production данных
- Миграции выполняются отдельно от деплоя приложения
- Никогда не изменять уже применённые миграции

---

## Redis Operations

### Persistence

Redis поддерживает три режима сохранения данных на диск.

#### RDB Snapshots

Полный snapshot данных через заданные интервалы. Компактный формат, быстрая загрузка.

```ini
# redis.conf
save 900 1       # snapshot если 1 key изменился за 900 секунд
save 300 10      # snapshot если 10 keys изменились за 300 секунд
save 60 10000    # snapshot если 10000 keys изменились за 60 секунд

dbfilename dump.rdb
dir /var/lib/redis

rdbcompression yes
rdbchecksum yes
```

#### AOF - Append Only File

Журналирование каждой write-операции. Более надёжный, но файл растёт быстрее.

```ini
# redis.conf
appendonly yes
appendfilename "appendonly.aof"

# fsync стратегия
# appendfsync always    # каждая операция - максимальная надёжность
appendfsync everysec    # раз в секунду - рекомендуемый баланс
# appendfsync no        # OS решает - быстрее, но рискованнее

# авто-перезапись AOF при достижении размера
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

#### Hybrid - RDB + AOF

Рекомендуемый режим для production. При рестарте Redis загружает AOF поверх RDB.

```ini
# redis.conf
aof-use-rdb-preamble yes
appendonly yes
save 900 1
save 300 10
```

### Redis Sentinel

Автоматический failover и service discovery для Redis master-replica.

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Sentinel │    │ Sentinel │    │ Sentinel │
│  :26379  │    │  :26379  │    │  :26379  │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────┴────┐    ┌─────┴────┐    ┌─────┴────┐
│  Redis  │    │  Redis   │    │  Redis   │
│ Master  │───>│ Replica  │    │ Replica  │
│  :6379  │    │  :6379   │    │  :6379   │
└─────────┘    └──────────┘    └──────────┘
```

```ini
# sentinel.conf
sentinel monitor mymaster 10.0.1.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1

sentinel auth-pass mymaster secretpassword
```

Параметр `2` в `sentinel monitor` - quorum. Минимальное число Sentinel, которые должны согласиться, что master недоступен.

```bash
# проверка статуса
redis-cli -p 26379 SENTINEL masters
redis-cli -p 26379 SENTINEL replicas mymaster
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster
```

Подключение из приложения через Sentinel:

```python
# Python пример
from redis.sentinel import Sentinel

sentinel = Sentinel([
    ('sentinel1.local', 26379),
    ('sentinel2.local', 26379),
    ('sentinel3.local', 26379)
], socket_timeout=0.5)

master = sentinel.master_for('mymaster', socket_timeout=0.5)
replica = sentinel.slave_for('mymaster', socket_timeout=0.5)

master.set('key', 'value')
value = replica.get('key')
```

### Redis Cluster

Горизонтальное масштабирование Redis через шардинг данных по hash slots. Всего 16384 слота, распределённых между нодами.

#### Создание кластера

```bash
# запуск нод (минимум 6 для 3 master + 3 replica)
redis-cli --cluster create \
  10.0.1.1:6379 10.0.1.2:6379 10.0.1.3:6379 \
  10.0.1.4:6379 10.0.1.5:6379 10.0.1.6:6379 \
  --cluster-replicas 1
```

```ini
# redis.conf для cluster node
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
cluster-announce-ip 10.0.1.1
cluster-announce-port 6379
cluster-announce-bus-port 16379
```

#### Resharding

Перемещение hash slots между нодами для балансировки нагрузки.

```bash
# проверка распределения слотов
redis-cli --cluster check 10.0.1.1:6379

# перемещение 1000 слотов на ноду
redis-cli --cluster reshard 10.0.1.1:6379 \
  --cluster-from <source-node-id> \
  --cluster-to <target-node-id> \
  --cluster-slots 1000 \
  --cluster-yes

# автоматическая ребалансировка
redis-cli --cluster rebalance 10.0.1.1:6379 \
  --cluster-use-empty-masters
```

#### Добавление и удаление нод

```bash
# добавить master ноду
redis-cli --cluster add-node 10.0.1.7:6379 10.0.1.1:6379

# добавить replica для конкретного master
redis-cli --cluster add-node 10.0.1.8:6379 10.0.1.1:6379 \
  --cluster-slave --cluster-master-id <master-node-id>

# удалить ноду (сначала переместить слоты)
redis-cli --cluster del-node 10.0.1.7:6379 <node-id>
```

### Мониторинг Redis

#### Встроенные команды

```bash
# общая информация
redis-cli INFO

# секции INFO
redis-cli INFO memory
redis-cli INFO replication
redis-cli INFO stats
redis-cli INFO keyspace

# медленные запросы
redis-cli SLOWLOG GET 10
redis-cli SLOWLOG LEN
redis-cli SLOWLOG RESET

# настройка порога slowlog (в микросекундах)
redis-cli CONFIG SET slowlog-log-slower-than 10000
redis-cli CONFIG SET slowlog-max-len 128
```

Ключевые метрики из INFO:

```
# Memory
used_memory_human        # текущее потребление
used_memory_peak_human   # пиковое потребление
mem_fragmentation_ratio  # >1.5 указывает на фрагментацию

# Stats
instantaneous_ops_per_sec  # текущий RPS
hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses)
evicted_keys               # ключи вытесненные из-за maxmemory
rejected_connections       # отклонённые соединения

# Replication
connected_slaves
master_repl_offset
slave_repl_offset          # разница = лаг репликации

# Clients
connected_clients
blocked_clients
```

#### Prometheus - redis_exporter

```yaml
# docker-compose.yml
services:
  redis-exporter:
    image: oliver006/redis_exporter:latest
    environment:
      REDIS_ADDR: "redis://redis:6379"
      REDIS_PASSWORD: "secret"
    ports:
      - "9121:9121"
```

Алерты для Redis:

```yaml
groups:
  - name: redis
    rules:
      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning

      - alert: RedisReplicationBroken
        expr: redis_connected_slaves < 1
        for: 5m
        labels:
          severity: critical

      - alert: RedisSlowlogGrowing
        expr: delta(redis_slowlog_length[5m]) > 10
        for: 5m
        labels:
          severity: warning

      - alert: RedisHighLatency
        expr: redis_commands_duration_seconds_total / redis_commands_processed_total > 0.01
        for: 5m
        labels:
          severity: warning

      - alert: RedisEvictions
        expr: rate(redis_evicted_keys_total[5m]) > 0
        for: 5m
        labels:
          severity: warning
```

> [!summary]
> Для production-окружения критически важно настроить мониторинг на всех уровнях: база данных, connection pooler, replication lag, disk usage, backup success. Алерты должны быть actionable - каждый алерт должен содержать ссылку на runbook с инструкцией по реагированию.
