---
tags:
  - backend
  - golang
  - go
  - databases
  - postgresql
  - gorm
  - redis
  - sql
---

## Работа с базами данных

Практически любое серверное приложение работает с базой данных. Go предоставляет стандартный пакет `database/sql` для реляционных БД, а экосистема предлагает мощные библиотеки: pgx для PostgreSQL, sqlx для удобного маппинга, GORM как ORM, sqlc для генерации кода из SQL, и go-redis для работы с Redis. В этой главе мы пройдём от низкоуровневых SQL-запросов до паттернов проектирования слоя данных.

> [!NOTE] Предварительные требования
> Для работы с примерами из этой главы вам понадобится:
> - Go 1.21+ (см. [[01-basics]])
> - Docker и docker-compose для запуска PostgreSQL и Redis
> - Базовое знание SQL (SELECT, INSERT, UPDATE, DELETE, JOIN)
> - Понимание HTTP-сервера из [[03-networking]]

---

## 1. Пакет database/sql

Пакет `database/sql` - это стандартный интерфейс Go для работы с реляционными базами данных. Он не содержит конкретного драйвера, а определяет набор интерфейсов, которые реализуются драйверами.

### 1.1 Подключение и пул соединений

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	// Импорт драйвера PostgreSQL через blank import.
	// Подчёркивание означает, что мы не используем пакет напрямую,
	// но его функция init() регистрирует драйвер в database/sql.
	_ "github.com/lib/pq"
)

func main() {
	// sql.Open НЕ устанавливает соединение с БД!
	// Он только создаёт объект *sql.DB и валидирует DSN-строку.
	// Реальное соединение создаётся лениво при первом запросе.
	dsn := "postgres://user:password@localhost:5432/mydb?sslmode=disable"
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		// Ошибка здесь означает проблему с DSN, а не с соединением
		log.Fatalf("ошибка открытия БД: %v", err)
	}
	defer db.Close()

	// Настройка пула соединений - критически важно для продакшена!

	// Максимальное количество открытых соединений к БД.
	// Значение по умолчанию 0 означает "без ограничений" - это опасно!
	// Установите значение исходя из возможностей вашей БД.
	// PostgreSQL по умолчанию поддерживает 100 соединений.
	db.SetMaxOpenConns(25)

	// Максимальное количество idle-соединений в пуле.
	// Idle-соединения готовы к повторному использованию.
	// Рекомендуется устанавливать равным MaxOpenConns.
	db.SetMaxIdleConns(25)

	// Максимальное время жизни соединения.
	// После этого времени соединение будет закрыто и создано заново.
	// Помогает при ротации DNS и балансировке нагрузки.
	db.SetConnMaxLifetime(5 * time.Minute)

	// Максимальное время, которое соединение может быть idle.
	// Если соединение не использовалось дольше этого времени, оно закрывается.
	db.SetConnMaxIdleTime(1 * time.Minute)

	// Ping проверяет реальное соединение с БД.
	// Используйте PingContext с таймаутом в продакшене.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("БД недоступна: %v", err)
	}

	fmt.Println("Успешно подключились к базе данных!")
}
```

> [!WARNING] sql.Open не подключается к БД
> Самая частая ошибка новичков: `sql.Open` только создаёт объект `*sql.DB` и проверяет формат DSN. Реальное TCP-соединение устанавливается лениво при первом запросе. Всегда вызывайте `db.PingContext()` после `sql.Open`, чтобы убедиться, что БД доступна.

> [!TIP] Оптимальные настройки пула
> - `MaxOpenConns` = количество ядер CPU * 2 + количество дисков (формула от PostgreSQL wiki)
> - `MaxIdleConns` = `MaxOpenConns` (чтобы не пересоздавать соединения)
> - `ConnMaxLifetime` = 5-10 минут (для ротации DNS)
> - `ConnMaxIdleTime` = 1-3 минуты (для освобождения неиспользуемых)

### 1.2 Архитектура database/sql

```
┌─────────────────────────────────────┐
│           Ваше приложение           │
├─────────────────────────────────────┤
│            database/sql             │
│  ┌──────────┐  ┌─────────────────┐  │
│  │ *sql.DB  │──│  Connection Pool │  │
│  └──────────┘  └─────────────────┘  │
├─────────────────────────────────────┤
│     driver.Driver (интерфейс)       │
├──────────┬──────────┬───────────────┤
│  lib/pq  │   pgx    │   go-sqlite3  │
└──────────┴──────────┴───────────────┘
         │          │          │
    PostgreSQL    PostgreSQL   SQLite
```

`*sql.DB` - это не одно соединение, а **пул соединений**. Он автоматически управляет созданием, переиспользованием и закрытием соединений. Поэтому `*sql.DB` безопасен для конкурентного использования из множества горутин (см. [[05-concurrency]]).

###### 🏠 Домашнее задание

1. Создайте PostgreSQL через Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:16`
2. Напишите программу, которая подключается к БД, настраивает пул и проверяет соединение через `PingContext`
3. Добавьте чтение DSN из переменной окружения `DATABASE_URL` (используйте `os.Getenv`)
4. Реализуйте функцию `waitForDB(db *sql.DB, maxRetries int)`, которая пытается выполнить Ping с экспоненциальным backoff

---

## 2. Выполнение запросов

### 2.1 QueryRowContext — один результат

```go
// QueryRowContext выполняет запрос, который возвращает максимум одну строку.
// Всегда используйте версии с Context для контроля таймаутов!
func getUserByID(ctx context.Context, db *sql.DB, id int64) (User, error) {
	var user User

	// QueryRowContext не возвращает ошибку напрямую.
	// Ошибка проявится при вызове Scan.
	err := db.QueryRowContext(ctx,
		"SELECT id, name, email, created_at FROM users WHERE id = $1", id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

	if err != nil {
		// sql.ErrNoRows - специальная ошибка, означающая "строка не найдена".
		// Это НЕ ошибка - это нормальная ситуация, которую нужно обработать отдельно.
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, fmt.Errorf("пользователь с id=%d не найден: %w", id, err)
		}
		return User{}, fmt.Errorf("ошибка запроса пользователя: %w", err)
	}

	return user, nil
}
```

> [!WARNING] Всегда проверяйте sql.ErrNoRows
> Не путайте "строка не найдена" с реальной ошибкой БД. `sql.ErrNoRows` — это штатная ситуация, а не ошибка соединения. Используйте `errors.Is(err, sql.ErrNoRows)` для проверки.

### 2.2 QueryContext — несколько результатов

```go
// QueryContext возвращает набор строк, которые нужно итерировать.
func getActiveUsers(ctx context.Context, db *sql.DB) ([]User, error) {
	// QueryContext возвращает *sql.Rows и error
	rows, err := db.QueryContext(ctx,
		"SELECT id, name, email, created_at FROM users WHERE active = $1 ORDER BY name",
		true,
	)
	if err != nil {
		return nil, fmt.Errorf("ошибка запроса пользователей: %w", err)
	}
	// ОБЯЗАТЕЛЬНО закрываем rows! Иначе соединение не вернётся в пул.
	// defer гарантирует закрытие даже при ошибке.
	defer rows.Close()

	var users []User

	// rows.Next() перемещает курсор на следующую строку.
	// Возвращает false, когда строки закончились ИЛИ при ошибке.
	for rows.Next() {
		var u User
		// Scan копирует значения текущей строки в переменные.
		// Порядок аргументов должен совпадать с порядком колонок в SELECT.
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("ошибка сканирования строки: %w", err)
		}
		users = append(users, u)
	}

	// ОБЯЗАТЕЛЬНО проверяем rows.Err() после цикла!
	// rows.Next() может вернуть false из-за ошибки, а не из-за конца данных.
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка итерации строк: %w", err)
	}

	return users, nil
}
```

> [!WARNING] Три обязательных правила работы с rows
> 1. **defer rows.Close()** — иначе соединение утечёт из пула
> 2. **rows.Next()** в цикле — для итерации по результатам
> 3. **rows.Err()** после цикла — для проверки ошибок, прервавших итерацию

### 2.3 ExecContext — INSERT, UPDATE, DELETE

```go
// ExecContext используется для запросов, не возвращающих строки данных.
func createUser(ctx context.Context, db *sql.DB, name, email string) (int64, error) {
	// RETURNING id позволяет получить сгенерированный ID в PostgreSQL.
	// Но с ExecContext нужно использовать другой подход - LastInsertId.
	// Для PostgreSQL лучше использовать QueryRowContext с RETURNING.
	result, err := db.ExecContext(ctx,
		"INSERT INTO users (name, email) VALUES ($1, $2)",
		name, email,
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	// RowsAffected возвращает количество затронутых строк.
	// Полезно для UPDATE и DELETE, чтобы убедиться, что запрос подействовал.
	affected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("ошибка получения affected rows: %w", err)
	}
	fmt.Printf("Затронуто строк: %d\n", affected)

	// LastInsertId НЕ поддерживается в PostgreSQL!
	// Для PostgreSQL используйте QueryRowContext с RETURNING id.
	// LastInsertId работает в MySQL и SQLite.
	return affected, nil
}

// Правильный способ получить ID в PostgreSQL — через RETURNING
func createUserPostgres(ctx context.Context, db *sql.DB, name, email string) (int64, error) {
	var id int64
	err := db.QueryRowContext(ctx,
		"INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
		name, email,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("ошибка создания пользователя: %w", err)
	}
	return id, nil
}
```

### 2.4 Prepared Statements

```go
// Prepared statements полезны для повторяющихся запросов.
// БД компилирует запрос один раз и переиспользует план выполнения.
func batchInsertWithPrepared(ctx context.Context, db *sql.DB, users []User) error {
	// PrepareContext создаёт подготовленный запрос на сервере БД.
	stmt, err := db.PrepareContext(ctx,
		"INSERT INTO users (name, email) VALUES ($1, $2)",
	)
	if err != nil {
		return fmt.Errorf("ошибка подготовки запроса: %w", err)
	}
	defer stmt.Close() // Обязательно закрываем!

	for _, u := range users {
		// ExecContext вызывается на stmt, а не на db.
		// Запрос уже скомпилирован, передаются только параметры.
		_, err := stmt.ExecContext(ctx, u.Name, u.Email)
		if err != nil {
			return fmt.Errorf("ошибка вставки пользователя %s: %w", u.Name, err)
		}
	}

	return nil
}
```

> [!INFO] Когда использовать Prepared Statements
> - Один и тот же запрос выполняется в цикле с разными параметрами
> - Запрос выполняется очень часто и нужна максимальная производительность
> - **Не используйте** для одноразовых запросов: создание prepared statement — это дополнительный round-trip к серверу

> [!TIP] Всегда используйте Context-версии методов
> `QueryContext`, `QueryRowContext`, `ExecContext`, `PrepareContext` — эти методы принимают `context.Context`, что позволяет:
> - Устанавливать таймауты на запросы
> - Отменять длинные запросы при отмене HTTP-запроса
> - Передавать trace ID для распределённой трассировки

###### 🏠 Домашнее задание

1. Создайте таблицу `products` (id, name, price, quantity, created_at) и напишите функции CRUD с `database/sql`
2. Реализуйте поиск продуктов по имени с использованием `LIKE` и `QueryContext`
3. Напишите функцию `updateProductPrice`, которая обновляет цену и возвращает количество затронутых строк
4. Реализуйте `batchInsertProducts` с использованием Prepared Statements
5. Добавьте обработку `sql.ErrNoRows` для функции `getProductByID`

---

## 3. Транзакции

Транзакции гарантируют атомарность группы операций: либо все выполнятся успешно, либо ни одна. Это критически важно для операций, изменяющих несколько таблиц или строк.

### 3.1 Основы транзакций

```go
// transferBalance — классический пример перевода денег между счетами.
// Без транзакции деньги могут "исчезнуть" или "удвоиться".
func transferBalance(ctx context.Context, db *sql.DB, fromID, toID int64, amount float64) error {
	// BeginTx начинает транзакцию с указанными параметрами.
	// TxOptions позволяет задать уровень изоляции и режим "только чтение".
	tx, err := db.BeginTx(ctx, &sql.TxOptions{
		// Уровни изоляции (от слабого к сильному):
		// sql.LevelReadUncommitted — грязное чтение (не используйте!)
		// sql.LevelReadCommitted  — видит только закоммиченные данные (по умолчанию в PostgreSQL)
		// sql.LevelRepeatableRead — повторное чтение даёт те же результаты
		// sql.LevelSerializable   — полная изоляция, как последовательное выполнение
		Isolation: sql.LevelRepeatableRead,
	})
	if err != nil {
		return fmt.Errorf("ошибка начала транзакции: %w", err)
	}

	// defer tx.Rollback() БЕЗОПАСЕН после Commit!
	// Если Commit уже выполнен, Rollback — это no-op (ничего не делает).
	// Это гарантирует откат при любой ошибке или панике.
	defer tx.Rollback()

	// Проверяем баланс отправителя
	var balance float64
	err = tx.QueryRowContext(ctx,
		"SELECT balance FROM accounts WHERE id = $1 FOR UPDATE", // FOR UPDATE блокирует строку
		fromID,
	).Scan(&balance)
	if err != nil {
		return fmt.Errorf("ошибка чтения баланса отправителя: %w", err)
	}

	if balance < amount {
		return fmt.Errorf("недостаточно средств: баланс=%.2f, требуется=%.2f", balance, amount)
	}

	// Списываем средства с отправителя
	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - $1 WHERE id = $2",
		amount, fromID,
	)
	if err != nil {
		return fmt.Errorf("ошибка списания средств: %w", err)
	}

	// Начисляем средства получателю
	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance + $1 WHERE id = $2",
		amount, toID,
	)
	if err != nil {
		return fmt.Errorf("ошибка начисления средств: %w", err)
	}

	// Записываем транзакцию в историю
	_, err = tx.ExecContext(ctx,
		"INSERT INTO transfers (from_account, to_account, amount) VALUES ($1, $2, $3)",
		fromID, toID, amount,
	)
	if err != nil {
		return fmt.Errorf("ошибка записи перевода: %w", err)
	}

	// Commit фиксирует все изменения транзакции.
	// Если Commit вернул ошибку — данные НЕ были сохранены!
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("ошибка коммита транзакции: %w", err)
	}

	return nil
}
```

> [!WARNING] FOR UPDATE — блокировка строк
> `SELECT ... FOR UPDATE` блокирует выбранные строки до конца транзакции. Это предотвращает гонку состояний (race condition), когда два перевода одновременно читают один и тот же баланс. Без `FOR UPDATE` возможна ситуация "потерянного обновления".

### 3.2 Паттерн: функция-обёртка для транзакций

```go
// execInTx — вспомогательная функция для выполнения кода в транзакции.
// Автоматически выполняет Commit при успехе и Rollback при ошибке.
func execInTx(ctx context.Context, db *sql.DB, fn func(tx *sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("ошибка начала транзакции: %w", err)
	}
	defer tx.Rollback()

	// Выполняем переданную функцию
	if err := fn(tx); err != nil {
		return err // Rollback выполнится через defer
	}

	return tx.Commit()
}

// Использование:
func example(ctx context.Context, db *sql.DB) error {
	return execInTx(ctx, db, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(ctx, "UPDATE users SET active = true WHERE id = $1", 1)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, "INSERT INTO audit_log (action) VALUES ($1)", "activate_user")
		return err
	})
}
```

> [!TIP] Паттерн defer tx.Rollback()
> Всегда используйте `defer tx.Rollback()` сразу после `BeginTx`. Это безопасно:
> - Если `Commit()` уже выполнен — `Rollback()` ничего не делает (no-op)
> - Если произошла ошибка — `Rollback()` откатит все изменения
> - Если произошла паника — `defer` всё равно вызовет `Rollback()`

###### 🏠 Домашнее задание

1. Создайте таблицы `accounts` и `transfers`, реализуйте функцию `transferBalance`
2. Напишите тест, который проверяет, что при недостаточном балансе перевод не выполняется, а данные остаются без изменений
3. Реализуйте обобщённую функцию `execInTx` и используйте её в двух разных операциях
4. Добавьте запись в audit_log внутри транзакции перевода средств

---

## 4. PostgreSQL с pgx

pgx — самый производительный драйвер PostgreSQL для Go. В отличие от `lib/pq`, он поддерживает расширенный протокол PostgreSQL, batch-запросы и COPY.

### 4.1 Подключение через pgxpool

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()

	// pgxpool.New создаёт пул соединений.
	// В отличие от sql.Open, он СРАЗУ устанавливает соединение и проверяет его.
	pool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("ошибка подключения к БД: %v", err)
	}
	defer pool.Close()

	// Можно также настроить пул через конфигурацию
	config, err := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("ошибка парсинга конфигурации: %v", err)
	}

	// Настройки пула соединений
	config.MaxConns = 25          // Максимум соединений
	config.MinConns = 5           // Минимум живых соединений
	config.MaxConnLifetime = 5 * 60 * 1000000000 // 5 минут в наносекундах
	config.MaxConnIdleTime = 1 * 60 * 1000000000 // 1 минута

	poolWithConfig, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		log.Fatalf("ошибка создания пула: %v", err)
	}
	defer poolWithConfig.Close()

	fmt.Println("Подключение к PostgreSQL через pgx установлено!")
}
```

### 4.2 Batch-запросы

```go
// Batch позволяет отправить несколько запросов за один network round-trip.
// Это значительно быстрее, чем выполнять запросы по одному.
func batchExample(ctx context.Context, pool *pgxpool.Pool) error {
	batch := &pgx.Batch{}

	// Добавляем запросы в batch. Они будут отправлены все разом.
	batch.Queue("INSERT INTO users (name, email) VALUES ($1, $2)", "Алексей", "alex@example.com")
	batch.Queue("INSERT INTO users (name, email) VALUES ($1, $2)", "Мария", "maria@example.com")
	batch.Queue("SELECT count(*) FROM users")

	// SendBatch отправляет все запросы за одно обращение к серверу
	br := pool.SendBatch(ctx, batch)
	defer br.Close()

	// Обрабатываем результаты в том же порядке, в каком добавляли запросы
	// Первый INSERT
	_, err := br.Exec()
	if err != nil {
		return fmt.Errorf("ошибка первого INSERT: %w", err)
	}

	// Второй INSERT
	_, err = br.Exec()
	if err != nil {
		return fmt.Errorf("ошибка второго INSERT: %w", err)
	}

	// SELECT count(*)
	var count int64
	err = br.QueryRow().Scan(&count)
	if err != nil {
		return fmt.Errorf("ошибка SELECT count: %w", err)
	}

	fmt.Printf("Всего пользователей: %d\n", count)
	return nil
}
```

### 4.3 COPY для массовой вставки

```go
// CopyFrom — самый быстрый способ вставить большое количество строк в PostgreSQL.
// Использует протокол COPY, который в 10-100x быстрее обычных INSERT.
func bulkInsertUsers(ctx context.Context, pool *pgxpool.Pool, users []User) (int64, error) {
	// CopyFromRows создаёт источник данных из слайса слайсов
	rows := make([][]interface{}, len(users))
	for i, u := range users {
		rows[i] = []interface{}{u.Name, u.Email, u.CreatedAt}
	}

	// CopyFrom выполняет COPY ... FROM STDIN
	copyCount, err := pool.CopyFrom(
		ctx,
		pgx.Identifier{"users"},            // Имя таблицы
		[]string{"name", "email", "created_at"}, // Имена колонок
		pgx.CopyFromRows(rows),              // Источник данных
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка COPY: %w", err)
	}

	return copyCount, nil // Возвращает количество вставленных строк
}
```

> [!INFO] pgx vs database/sql
> | Критерий | database/sql | pgx |
> |----------|-------------|-----|
> | Совместимость | Любая СУБД | Только PostgreSQL |
> | Производительность | Хорошая | Отличная (нативный протокол) |
> | Batch-запросы | Нет | Да |
> | COPY протокол | Нет | Да |
> | Типы PostgreSQL | Базовые | Полная поддержка (массивы, JSON, hstore) |
> | Пул соединений | Встроенный в sql.DB | pgxpool |
> | Миграция на другую СУБД | Легко | Невозможно |

> [!TIP] Когда выбирать pgx
> - Проект использует **только PostgreSQL** и не планируется миграция на другую СУБД
> - Нужна **максимальная производительность** (batch, COPY)
> - Используются специфичные типы PostgreSQL (массивы, jsonb, hstore, enum)
> - Нужен **LISTEN/NOTIFY** для real-time уведомлений

###### 🏠 Домашнее задание

1. Перепишите подключение к PostgreSQL с `lib/pq` на `pgxpool`
2. Реализуйте batch-вставку 100 записей и сравните время с последовательными INSERT
3. Используйте `CopyFrom` для вставки 10000 строк и измерьте время
4. Реализуйте функцию, которая использует Batch для одновременного получения пользователя и его заказов

---

## 5. sqlx — удобная обёртка над database/sql

sqlx расширяет `database/sql`, добавляя автоматический маппинг строк в структуры, named parameters и другие удобства, сохраняя полную совместимость с `database/sql`.

### 5.1 Подключение и автоматический маппинг

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// Структура с тегами db для маппинга колонок
type User struct {
	ID        int64     `db:"id"`
	Name      string    `db:"name"`
	Email     string    `db:"email"`
	Active    bool      `db:"active"`
	CreatedAt time.Time `db:"created_at"`
}

func main() {
	// sqlx.Connect = sql.Open + Ping. Сразу проверяет соединение!
	db, err := sqlx.Connect("postgres", "postgres://user:password@localhost:5432/mydb?sslmode=disable")
	if err != nil {
		log.Fatalf("ошибка подключения: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// GetContext — аналог QueryRowContext + Scan, но автоматически маппит в структуру.
	// Нужен ровно один результат, иначе ошибка.
	var user User
	err = db.GetContext(ctx, &user,
		"SELECT id, name, email, active, created_at FROM users WHERE id = $1", 1,
	)
	if err != nil {
		log.Printf("ошибка получения пользователя: %v", err)
	}

	// SelectContext — аналог QueryContext, но автоматически маппит в слайс структур.
	// Не нужно вручную вызывать rows.Next() и rows.Scan()!
	var users []User
	err = db.SelectContext(ctx, &users,
		"SELECT id, name, email, active, created_at FROM users WHERE active = $1",
		true,
	)
	if err != nil {
		log.Printf("ошибка получения пользователей: %v", err)
	}

	for _, u := range users {
		fmt.Printf("%d: %s (%s)\n", u.ID, u.Name, u.Email)
	}
}
```

### 5.2 Named Parameters

```go
// NamedExec позволяет использовать именованные параметры вместо $1, $2.
// Значения берутся из полей структуры или map.
func createUserNamed(ctx context.Context, db *sqlx.DB, user User) error {
	_, err := db.NamedExecContext(ctx,
		`INSERT INTO users (name, email, active) 
		 VALUES (:name, :email, :active)`,
		user, // Значения берутся из полей структуры по тегам db
	)
	return err
}

// Также можно использовать map
func createUserFromMap(ctx context.Context, db *sqlx.DB) error {
	_, err := db.NamedExecContext(ctx,
		"INSERT INTO users (name, email) VALUES (:name, :email)",
		map[string]interface{}{
			"name":  "Иван",
			"email": "ivan@example.com",
		},
	)
	return err
}
```

> [!INFO] database/sql vs sqlx
> | Операция | database/sql | sqlx |
> |----------|-------------|------|
> | Один результат | `QueryRowContext` + `Scan` (по полям) | `GetContext` (автомаппинг) |
> | Несколько результатов | `QueryContext` + `rows.Next()` + `Scan` | `SelectContext` (в слайс) |
> | Именованные параметры | Нет ($1, $2) | `NamedExecContext` |
> | Совместимость с sql.DB | — | Полная (sqlx.DB встраивает sql.DB) |

###### 🏠 Домашнее задание

1. Перепишите CRUD-функции из раздела 2 с использованием `sqlx`
2. Сравните количество строк кода: `database/sql` vs `sqlx`
3. Реализуйте поиск с динамическими фильтрами, используя `sqlx.In` для IN-запросов
4. Напишите функцию `createUsersBatch`, которая вставляет несколько пользователей через `NamedExecContext`

---

## 6. Миграции базы данных

Миграции — это версионируемые изменения схемы БД. Каждая миграция содержит два файла: up (применить изменение) и down (откатить изменение).

### 6.1 golang-migrate

```bash
# Установка golang-migrate
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Создание миграции
migrate create -ext sql -dir migrations -seq create_users_table

# Будут созданы два файла:
# migrations/000001_create_users_table.up.sql
# migrations/000001_create_users_table.down.sql

# Применить все миграции
migrate -path migrations -database "postgres://user:password@localhost:5432/mydb?sslmode=disable" up

# Откатить последнюю миграцию
migrate -path migrations -database "postgres://user:password@localhost:5432/mydb?sslmode=disable" down 1

# Посмотреть текущую версию
migrate -path migrations -database "postgres://user:password@localhost:5432/mydb?sslmode=disable" version
```

### 6.2 SQL-файлы миграций

```sql
-- migrations/000001_create_users_table.up.sql
-- Создаём таблицу пользователей с основными полями

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Уникальный индекс по email — не допускает дубликатов
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Индекс для фильтрации по активности
CREATE INDEX IF NOT EXISTS idx_users_active ON users (active);

-- Составной индекс для сортировки активных пользователей по имени
CREATE INDEX IF NOT EXISTS idx_users_active_name ON users (active, name);
```

```sql
-- migrations/000001_create_users_table.down.sql
-- Откат: удаляем таблицу

DROP TABLE IF EXISTS users;
```

### 6.3 Встраивание миграций с embed.FS

```go
package main

import (
	"embed"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
)

// Встраиваем SQL-файлы прямо в бинарник.
// Это позволяет деплоить один файл без отдельных миграционных файлов.
//go:embed migrations/*.sql
var migrationsFS embed.FS

func runMigrations(databaseURL string) error {
	// Создаём источник миграций из встроенной FS
	source, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return err
	}

	m, err := migrate.NewWithSourceInstance("iofs", source, databaseURL)
	if err != nil {
		return err
	}

	// Up применяет все непримёнённые миграции
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}

	log.Println("Миграции успешно применены")
	return nil
}
```

> [!TIP] goose как альтернатива
> [goose](https://github.com/pressly/goose) — ещё один популярный инструмент миграций:
> - Поддерживает миграции на Go (не только SQL)
> - Простой CLI: `goose up`, `goose down`, `goose status`
> - Можно встроить в приложение как библиотеку

> [!WARNING] Правила работы с миграциями
> 1. **Никогда не редактируйте** уже применённые миграции
> 2. **Всегда пишите down-миграции** для возможности отката
> 3. **Тестируйте down-миграции** — они часто ломаются
> 4. В продакшене используйте golang-migrate или goose, **не AutoMigrate от GORM**
> 5. Делайте миграции обратно совместимыми при zero-downtime деплоях

###### 🏠 Домашнее задание

1. Установите `golang-migrate` и создайте миграции для таблиц `users`, `products`, `orders`
2. Напишите up/down миграции для добавления колонки `phone` в таблицу `users`
3. Встройте миграции в приложение с помощью `embed.FS`
4. Создайте скрипт, который автоматически применяет миграции при старте приложения

---

## 7. GORM — ORM для Go

GORM — самая популярная ORM в Go. Она предоставляет удобный API для работы с БД: автоматический маппинг структур в таблицы, миграции, ассоциации, хуки и многое другое.

### 7.1 Установка и настройка

```go
package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func initDB() (*gorm.DB, error) {
	dsn := "host=localhost user=postgres password=secret dbname=mydb port=5432 sslmode=disable"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// Логгер для отладки SQL-запросов
		Logger: logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			logger.Config{
				SlowThreshold:             200 * time.Millisecond, // Порог медленного запроса
				LogLevel:                  logger.Info,            // Уровень логирования
				IgnoreRecordNotFoundError: true,                  // Не логировать "record not found"
				Colorful:                  true,                   // Цветной вывод
			},
		),

		// Стратегия именования таблиц и колонок
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",     // Префикс таблиц (например, "app_")
			SingularTable: false,  // true: User → user, false: User → users
			NoLowerCase:   false,  // true: не преобразовывать в snake_case
		},

		// Транслировать ошибки PostgreSQL в GORM-ошибки
		// Например, unique violation → gorm.ErrDuplicatedKey
		TranslateError: true,
	})

	if err != nil {
		return nil, fmt.Errorf("ошибка подключения GORM: %w", err)
	}

	// Настройка пула соединений через underlying sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("ошибка получения sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(25)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	sqlDB.SetConnMaxIdleTime(1 * time.Minute)

	return db, nil
}
```

### 7.2 Модели

```go
// gorm.Model встраивает стандартные поля:
// ID        uint           `gorm:"primaryKey"`
// CreatedAt time.Time
// UpdatedAt time.Time
// DeletedAt gorm.DeletedAt `gorm:"index"` — для soft delete

// User — модель пользователя с различными GORM-тегами
type User struct {
	gorm.Model // Встраивает ID, CreatedAt, UpdatedAt, DeletedAt

	// primaryKey — определяет первичный ключ (если не используется gorm.Model)
	// uniqueIndex — уникальный индекс, запрещает дубликаты
	// index — обычный индекс для ускорения поиска
	// size — максимальная длина для VARCHAR
	// type — явное указание типа колонки в БД
	// not null — колонка обязательна
	// default — значение по умолчанию в БД
	// check — ограничение CHECK
	// column — переопределить имя колонки
	// - — игнорировать поле (не создавать колонку)
	// -> — только для чтения (нельзя записывать)

	Name     string `gorm:"size:255;not null;index"`
	Email    string `gorm:"size:255;uniqueIndex;not null"`
	Age      int    `gorm:"check:age > 0"`
	Role     string `gorm:"size:50;default:'user';not null"`
	Bio      string `gorm:"type:text"`
	Balance  float64 `gorm:"type:decimal(10,2);default:0;not null"`
	IsActive bool   `gorm:"default:true;not null;column:active"`

	// Внутреннее поле, не сохраняется в БД
	TempPassword string `gorm:"-"`

	// Только для чтения — GORM не будет записывать это поле
	ProfileViews int `gorm:"->"`

	// Ассоциации (подробнее ниже)
	Posts    []Post    `gorm:"foreignKey:AuthorID"`
	Profile  Profile   `gorm:"foreignKey:UserID"`
}

type Post struct {
	gorm.Model
	Title    string `gorm:"size:500;not null"`
	Content  string `gorm:"type:text;not null"`
	AuthorID uint   `gorm:"not null;index"`
	Author   User   `gorm:"foreignKey:AuthorID"`

	Tags []Tag `gorm:"many2many:post_tags;"` // Many-to-Many через промежуточную таблицу
}

type Tag struct {
	gorm.Model
	Name  string `gorm:"size:100;uniqueIndex;not null"`
	Posts []Post `gorm:"many2many:post_tags;"`
}

type Profile struct {
	gorm.Model
	UserID  uint   `gorm:"uniqueIndex;not null"`
	Avatar  string `gorm:"size:500"`
	Phone   string `gorm:"size:20"`
}
```

### 7.3 AutoMigrate

```go
func autoMigrate(db *gorm.DB) error {
	// AutoMigrate создаёт таблицы, добавляет колонки и индексы.
	// НО: не удаляет колонки, не изменяет типы, не удаляет индексы.
	return db.AutoMigrate(
		&User{},
		&Post{},
		&Tag{},
		&Profile{},
	)
}
```

> [!WARNING] AutoMigrate — только для разработки!
> AutoMigrate **не подходит для продакшена**:
> - Не создаёт down-миграции (нельзя откатить)
> - Не удаляет устаревшие колонки
> - Не изменяет типы существующих колонок
> - Нет контроля версий изменений
> 
> Для продакшена используйте [[#6. Миграции базы данных|golang-migrate]] или goose.

### 7.4 CRUD-операции

#### Create — создание записей

```go
func createExamples(db *gorm.DB) {
	// Создание одной записи
	user := User{
		Name:  "Алексей",
		Email: "alex@example.com",
		Age:   25,
		Role:  "admin",
	}
	result := db.Create(&user)
	// После Create поле user.ID будет заполнено автоматически!
	fmt.Printf("ID нового пользователя: %d\n", user.ID)
	fmt.Printf("Затронуто строк: %d\n", result.RowsAffected)
	if result.Error != nil {
		log.Printf("ошибка создания: %v", result.Error)
	}

	// Batch-создание — вставка нескольких записей за раз
	users := []User{
		{Name: "Мария", Email: "maria@example.com", Age: 30},
		{Name: "Иван", Email: "ivan@example.com", Age: 28},
		{Name: "Ольга", Email: "olga@example.com", Age: 35},
	}
	result = db.Create(&users) // Вставка одним запросом
	fmt.Printf("Создано пользователей: %d\n", result.RowsAffected)

	// Создание с указанием конкретных полей
	db.Select("Name", "Email").Create(&User{
		Name:  "Пётр",
		Email: "petr@example.com",
		Age:   40, // Age будет проигнорирован!
	})

	// Обработка дубликата email (если TranslateError: true)
	dup := User{Name: "Алексей2", Email: "alex@example.com"}
	if err := db.Create(&dup).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			log.Println("Пользователь с таким email уже существует")
		}
	}
}
```

#### Read — чтение записей

```go
func readExamples(db *gorm.DB) {
	var user User
	var users []User

	// First — первая запись по первичному ключу (ORDER BY id ASC LIMIT 1)
	db.First(&user)

	// First по ID
	db.First(&user, 10) // SELECT * FROM users WHERE id = 10

	// First с условием
	db.First(&user, "email = ?", "alex@example.com")

	// Find — все записи
	db.Find(&users)

	// Where — условия выборки
	db.Where("active = ?", true).Find(&users)
	db.Where("age > ? AND role = ?", 18, "user").Find(&users)
	db.Where("name LIKE ?", "%лекс%").Find(&users)
	db.Where("name IN ?", []string{"Алексей", "Мария"}).Find(&users)

	// Where со структурой — удобно, но ОСТОРОЖНО с нулевыми значениями!
	db.Where(&User{Name: "Алексей", Age: 25}).Find(&users)
	// ВНИМАНИЕ: Age=0 будет проигнорирован! GORM пропускает нулевые значения.
	// Для поиска по нулевым значениям используйте map:
	db.Where(map[string]interface{}{"name": "Алексей", "age": 0}).Find(&users)

	// Select — выбор конкретных полей
	db.Select("name", "email").Find(&users)

	// Count — количество записей
	var count int64
	db.Model(&User{}).Where("active = ?", true).Count(&count)

	// Order, Limit, Offset — сортировка и пагинация
	db.Order("created_at DESC").Limit(10).Offset(0).Find(&users)

	// Group и Having
	type Result struct {
		Role  string
		Count int64
	}
	var results []Result
	db.Model(&User{}).Select("role, count(*) as count").
		Group("role").Having("count(*) > ?", 1).Find(&results)

	// Raw SQL — если нужен сложный запрос
	db.Raw("SELECT * FROM users WHERE age > ? ORDER BY name", 18).Scan(&users)

	// Обработка "не найдено"
	result := db.First(&user, 999)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		log.Println("Пользователь не найден")
	}
}
```

#### Update — обновление записей

```go
func updateExamples(db *gorm.DB) {
	var user User
	db.First(&user, 1)

	// Обновление одного поля
	db.Model(&user).Update("name", "Новое Имя")

	// Обновление нескольких полей через структуру
	// ВНИМАНИЕ: нулевые значения (0, "", false) будут ПРОИГНОРИРОВАНЫ!
	db.Model(&user).Updates(User{
		Name: "Алексей Обновлённый",
		Age:  0,     // НЕ обновится! 0 — нулевое значение для int.
		IsActive: false, // НЕ обновится! false — нулевое значение для bool.
	})

	// Для обновления нулевыми значениями используйте map
	db.Model(&user).Updates(map[string]interface{}{
		"name":   "Алексей",
		"age":    0,     // Обновится на 0
		"active": false, // Обновится на false
	})

	// Обновление с условием (без предварительной загрузки)
	db.Model(&User{}).Where("role = ?", "guest").Update("active", false)

	// Select + Updates — обновить только указанные поля
	db.Model(&user).Select("Name", "Age").Updates(User{Name: "Тест", Age: 0})
	// Age обновится на 0, потому что он явно указан в Select!
}
```

> [!WARNING] Нулевые значения при Update через структуру
> GORM игнорирует поля с нулевыми значениями (0, "", false, nil) при обновлении через структуру. Это сделано для защиты от случайного затирания данных. Если нужно установить нулевое значение:
> 1. Используйте `map[string]interface{}` вместо структуры
> 2. Используйте `Select("field").Updates(...)` для явного указания полей
> 3. Используйте типы-указатели (`*int`, `*string`, `*bool`) в модели

#### Delete — удаление записей

```go
func deleteExamples(db *gorm.DB) {
	// Soft Delete — если модель содержит gorm.DeletedAt (из gorm.Model)
	// GORM не удаляет запись, а ставит метку deleted_at = NOW()
	var user User
	db.First(&user, 1)
	db.Delete(&user) // UPDATE users SET deleted_at = NOW() WHERE id = 1

	// Delete по ID
	db.Delete(&User{}, 1)

	// Delete по условию
	db.Where("active = ?", false).Delete(&User{})

	// Soft-deleted записи НЕ ВИДНЫ в обычных запросах!
	var users []User
	db.Find(&users) // WHERE deleted_at IS NULL (автоматически)

	// Чтобы увидеть удалённые записи, используйте Unscoped
	db.Unscoped().Find(&users) // Все записи, включая удалённые

	// Физическое удаление (настоящий DELETE)
	db.Unscoped().Delete(&user) // DELETE FROM users WHERE id = 1
}
```

### 7.5 Scopes — переиспользуемые фрагменты запросов

```go
// Scope — это функция, которая модифицирует запрос GORM.
// Позволяет переиспользовать часто встречающиеся условия.

// Active — scope для фильтрации только активных записей
func Active(db *gorm.DB) *gorm.DB {
	return db.Where("active = ?", true)
}

// Paginate — scope для пагинации
func Paginate(page, pageSize int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if page <= 0 {
			page = 1
		}
		if pageSize <= 0 || pageSize > 100 {
			pageSize = 20
		}
		offset := (page - 1) * pageSize
		return db.Offset(offset).Limit(pageSize)
	}
}

// ByRole — scope для фильтрации по роли
func ByRole(role string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("role = ?", role)
	}
}

// OrderByRecent — scope для сортировки по дате создания
func OrderByRecent(db *gorm.DB) *gorm.DB {
	return db.Order("created_at DESC")
}

// Использование Scopes: условия комбинируются через AND
func getScopedUsers(db *gorm.DB) []User {
	var users []User

	// Цепочка Scopes: активные админы, отсортированные по дате, страница 2
	db.Scopes(Active, ByRole("admin"), OrderByRecent, Paginate(2, 10)).
		Find(&users)

	// Генерирует SQL:
	// SELECT * FROM users
	// WHERE active = true AND role = 'admin' AND deleted_at IS NULL
	// ORDER BY created_at DESC
	// LIMIT 10 OFFSET 10

	return users
}
```

### 7.6 Ассоциации

```go
// Определение моделей с ассоциациями
type Author struct {
	gorm.Model
	Name     string    `gorm:"size:255;not null"`
	Email    string    `gorm:"size:255;uniqueIndex;not null"`
	Articles []Article `gorm:"foreignKey:AuthorID"` // Has Many
	Profile  AuthorProfile `gorm:"foreignKey:AuthorID"` // Has One
}

type Article struct {
	gorm.Model
	Title    string `gorm:"size:500;not null"`
	Content  string `gorm:"type:text"`
	AuthorID uint   `gorm:"not null;index"` // Foreign key
	Author   Author `gorm:"foreignKey:AuthorID"` // Belongs To

	Categories []Category `gorm:"many2many:article_categories;"` // Many to Many
}

type Category struct {
	gorm.Model
	Name     string    `gorm:"size:100;uniqueIndex;not null"`
	Articles []Article `gorm:"many2many:article_categories;"`
}

type AuthorProfile struct {
	gorm.Model
	AuthorID uint   `gorm:"uniqueIndex;not null"`
	Bio      string `gorm:"type:text"`
	Website  string `gorm:"size:500"`
}
```

#### Preload — решение проблемы N+1

```go
func associationExamples(db *gorm.DB) {
	// Проблема N+1:
	// Без Preload, обращение к article.Author для каждой статьи
	// генерирует отдельный SELECT — N дополнительных запросов!

	// Preload загружает ассоциации отдельными запросами (batch)
	var articles []Article
	db.Preload("Author").               // Загрузить авторов
		Preload("Categories").           // Загрузить категории
		Find(&articles)
	// Выполнит 3 запроса:
	// 1. SELECT * FROM articles
	// 2. SELECT * FROM authors WHERE id IN (1, 2, 3...)
	// 3. SELECT * FROM categories JOIN article_categories...

	// Вложенный Preload
	var authors []Author
	db.Preload("Articles.Categories"). // Загрузить статьи, а для них — категории
		Preload("Profile").
		Find(&authors)

	// Preload с условием
	db.Preload("Articles", "created_at > ?", time.Now().AddDate(0, -1, 0)).
		Find(&authors)

	// Joins — загрузка через SQL JOIN (один запрос, но только для Belongs To / Has One)
	var article Article
	db.Joins("Author").First(&article, 1)
	// Выполнит один запрос:
	// SELECT articles.*, Author.* FROM articles
	// LEFT JOIN authors AS "Author" ON articles.author_id = "Author".id
	// WHERE articles.id = 1

	// Создание с ассоциациями — GORM автоматически создаёт связанные записи
	newAuthor := Author{
		Name:  "Новый Автор",
		Email: "new@example.com",
		Articles: []Article{
			{Title: "Первая статья", Content: "Контент..."},
			{Title: "Вторая статья", Content: "Ещё контент..."},
		},
		Profile: AuthorProfile{
			Bio: "Разработчик",
		},
	}
	db.Create(&newAuthor) // Создаст автора, профиль и обе статьи
}
```

> [!TIP] Preload vs Joins
> - **Preload** — загружает ассоциации отдельными запросами. Подходит для Has Many и Many to Many.
> - **Joins** — загружает через SQL JOIN одним запросом. Подходит для Belongs To и Has One. Быстрее для простых ассоциаций, но не поддерживает Has Many.

### 7.7 Хуки (Hooks)

```go
// Хуки позволяют выполнить код до/после операций CRUD.
// Определяются как методы модели.

func (u *User) BeforeCreate(tx *gorm.DB) error {
	// Вызывается перед INSERT
	// Используется для валидации, хеширования паролей, генерации UUID и т.д.
	if u.Email == "" {
		return errors.New("email обязателен")
	}
	u.Email = strings.ToLower(u.Email) // Нормализация email
	return nil
}

func (u *User) AfterCreate(tx *gorm.DB) error {
	// Вызывается после INSERT
	// Используется для отправки уведомлений, логирования, создания связанных записей
	log.Printf("Создан пользователь: %d (%s)", u.ID, u.Email)
	return nil
}

func (u *User) BeforeUpdate(tx *gorm.DB) error {
	// Вызывается перед UPDATE
	// Используется для валидации изменений
	if u.Age < 0 {
		return errors.New("возраст не может быть отрицательным")
	}
	return nil
}

func (u *User) BeforeDelete(tx *gorm.DB) error {
	// Вызывается перед DELETE (включая soft delete)
	// Можно проверить условия или каскадно удалить связанные данные
	log.Printf("Удаление пользователя: %d", u.ID)
	return nil
}

// Полный список хуков:
// BeforeCreate / AfterCreate
// BeforeUpdate / AfterUpdate
// BeforeSave   / AfterSave    (вызывается и для Create, и для Update)
// BeforeDelete / AfterDelete
// AfterFind                    (вызывается после любого SELECT)
```

> [!NOTE] Хуки выполняются в транзакции
> Все хуки GORM выполняются внутри транзакции. Если хук возвращает ошибку, транзакция откатывается и операция не выполняется. Это гарантирует целостность данных.

### 7.8 Транзакции в GORM

```go
func gormTransactions(db *gorm.DB) {
	// Способ 1: Автоматические транзакции с db.Transaction
	// Commit при nil error, Rollback при любой ошибке
	err := db.Transaction(func(tx *gorm.DB) error {
		// Создаём пользователя
		user := User{Name: "Транзакция", Email: "tx@example.com"}
		if err := tx.Create(&user).Error; err != nil {
			return err // Автоматический Rollback
		}

		// Создаём профиль
		profile := AuthorProfile{AuthorID: user.ID, Bio: "Тест"}
		if err := tx.Create(&profile).Error; err != nil {
			return err // Автоматический Rollback
		}

		// Если вернуть nil — Commit
		return nil
	})
	if err != nil {
		log.Printf("транзакция откатилась: %v", err)
	}

	// Способ 2: Вложенные транзакции (savepoints)
	err = db.Transaction(func(tx *gorm.DB) error {
		tx.Create(&User{Name: "Внешняя", Email: "outer@example.com"})

		// Вложенная транзакция создаёт SAVEPOINT
		err := tx.Transaction(func(tx2 *gorm.DB) error {
			tx2.Create(&User{Name: "Внутренняя", Email: "inner@example.com"})
			return errors.New("ошибка во внутренней транзакции")
			// ROLLBACK TO SAVEPOINT — откатывается только внутренняя
		})
		// err != nil, но внешняя транзакция может продолжить работу
		log.Printf("внутренняя ошибка (ожидаемо): %v", err)

		return nil // Commit внешней транзакции
		// "Внешняя" сохранится, "Внутренняя" — нет
	})

	// Способ 3: Ручное управление
	tx := db.Begin()
	defer tx.Rollback()

	if err := tx.Create(&User{Name: "Ручная", Email: "manual@example.com"}).Error; err != nil {
		return
	}
	if err := tx.Commit().Error; err != nil {
		return
	}
}
```

### 7.9 Repository Pattern с GORM

```go
// UserRepository определяет интерфейс для работы с пользователями.
// Абстрагирует слой данных от бизнес-логики.
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uint) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	List(ctx context.Context, page, pageSize int) ([]User, int64, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uint) error
}

// gormUserRepository — реализация UserRepository с использованием GORM
type gormUserRepository struct {
	db *gorm.DB
}

// NewUserRepository создаёт новый экземпляр репозитория
func NewUserRepository(db *gorm.DB) UserRepository {
	return &gormUserRepository{db: db}
}

func (r *gormUserRepository) Create(ctx context.Context, user *User) error {
	// WithContext передаёт контекст в GORM для поддержки таймаутов и отмены
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *gormUserRepository) GetByID(ctx context.Context, id uint) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("пользователь id=%d не найден", id)
		}
		return nil, err
	}
	return &user, nil
}

func (r *gormUserRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *gormUserRepository) List(ctx context.Context, page, pageSize int) ([]User, int64, error) {
	var users []User
	var total int64

	// Считаем общее количество записей (для пагинации)
	if err := r.db.WithContext(ctx).Model(&User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Получаем страницу с данными
	err := r.db.WithContext(ctx).
		Scopes(Paginate(page, pageSize), OrderByRecent).
		Find(&users).Error

	return users, total, err
}

func (r *gormUserRepository) Update(ctx context.Context, user *User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *gormUserRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&User{}, id).Error
}
```

> [!summary] Преимущества Repository Pattern
> 1. **Тестируемость** — можно подменить репозиторий моком в тестах (см. [[07-testing]])
> 2. **Абстракция** — бизнес-логика не зависит от GORM, можно заменить на sqlx или pgx
> 3. **Единая точка входа** — все запросы к таблице в одном месте
> 4. **WithContext** — каждый метод принимает `context.Context` для таймаутов и отмены

###### 🏠 Домашнее задание

1. Создайте модели `Product` и `Category` с ассоциацией Many-to-Many
2. Реализуйте полный CRUD для `Product` с использованием GORM
3. Напишите Scope `ByPriceRange(min, max float64)` и `InStock()` (quantity > 0)
4. Добавьте хук `BeforeCreate` для `Product`, который валидирует цену (> 0)
5. Реализуйте Repository Pattern для `Product` с методами `Create`, `GetByID`, `List`, `Search`, `Update`, `Delete`
6. Напишите функцию создания заказа в транзакции: создать Order, уменьшить quantity у Product, создать OrderItem

---

## 8. sqlc — генерация кода из SQL

sqlc — это инструмент, который генерирует типобезопасный Go-код из SQL-запросов. Вы пишете SQL, а sqlc создаёт функции Go с правильными типами.

### 8.1 Настройка

```yaml
# sqlc.yaml — конфигурация sqlc
version: "2"
sql:
  - engine: "postgresql"
    queries: "query/"      # Папка с SQL-запросами
    schema: "migrations/"  # Папка с миграциями (для определения типов)
    gen:
      go:
        package: "db"          # Имя пакета Go
        out: "internal/db"     # Папка для сгенерированного кода
        sql_package: "pgx/v5"  # Использовать pgx вместо database/sql
        emit_json_tags: true   # Добавить json-теги
        emit_db_tags: true     # Добавить db-теги
```

### 8.2 SQL-запросы

```sql
-- query/users.sql

-- name: GetUser :one
-- Получить пользователя по ID
SELECT id, name, email, active, created_at
FROM users
WHERE id = $1;

-- name: ListUsers :many
-- Получить список пользователей с пагинацией
SELECT id, name, email, active, created_at
FROM users
WHERE active = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CreateUser :one
-- Создать пользователя и вернуть ID
INSERT INTO users (name, email, active)
VALUES ($1, $2, $3)
RETURNING id, name, email, active, created_at;

-- name: UpdateUser :exec
-- Обновить данные пользователя
UPDATE users
SET name = $2, email = $3, updated_at = NOW()
WHERE id = $1;

-- name: DeleteUser :exec
-- Удалить пользователя
DELETE FROM users WHERE id = $1;

-- name: CountActiveUsers :one
-- Подсчитать активных пользователей
SELECT count(*) FROM users WHERE active = true;
```

### 8.3 Сгенерированный код

```go
// Сгенерировано sqlc автоматически (НЕ РЕДАКТИРОВАТЬ)

// GetUser — получить пользователя по ID
func (q *Queries) GetUser(ctx context.Context, id int64) (User, error) {
	row := q.db.QueryRow(ctx, getUserSQL, id)
	var user User
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Active, &user.CreatedAt)
	return user, err
}

// ListUsers — список пользователей с пагинацией
func (q *Queries) ListUsers(ctx context.Context, arg ListUsersParams) ([]User, error) {
	rows, err := q.db.Query(ctx, listUsersSQL, arg.Active, arg.Limit, arg.Offset)
	// ... итерация и маппинг
}

// Использование:
func main() {
	pool, _ := pgxpool.New(ctx, databaseURL)
	queries := db.New(pool)

	user, err := queries.GetUser(ctx, 1)
	users, err := queries.ListUsers(ctx, db.ListUsersParams{
		Active: true,
		Limit:  10,
		Offset: 0,
	})
}
```

> [!INFO] sqlc vs GORM: когда что использовать
> | Критерий | sqlc | GORM |
> |----------|------|------|
> | Подход | SQL-first (вы пишете SQL) | Code-first (вы пишете Go) |
> | Типобезопасность | Полная (генерация кода) | Частичная (runtime) |
> | Производительность | Максимальная (чистый SQL) | Хорошая (рефлексия, абстракции) |
> | Контроль SQL | Полный | GORM генерирует SQL за вас |
> | Ассоциации | Ручные JOIN-ы | Автоматические Preload/Joins |
> | Миграции | Отдельно (golang-migrate) | AutoMigrate (для разработки) |
> | Кривая обучения | Нужно знать SQL | Больше абстракций |

###### 🏠 Домашнее задание

1. Установите sqlc и настройте `sqlc.yaml` для вашего проекта
2. Напишите SQL-запросы для CRUD операций таблицы `products`
3. Сгенерируйте Go-код и используйте его в простом приложении
4. Сравните объём кода и удобство использования sqlc vs GORM

---

## 9. Redis: go-redis

Redis — это in-memory хранилище данных, которое используется как кэш, брокер сообщений, хранилище сессий и очередь задач.

### 9.1 Подключение

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

func initRedis() *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:         "localhost:6379",  // Адрес Redis
		Password:     "",               // Пароль (по умолчанию пустой)
		DB:           0,                // Номер БД (0-15)
		DialTimeout:  5 * time.Second,  // Таймаут подключения
		ReadTimeout:  3 * time.Second,  // Таймаут чтения
		WriteTimeout: 3 * time.Second,  // Таймаут записи
		PoolSize:     10,               // Размер пула соединений
		MinIdleConns: 5,                // Минимум idle-соединений
	})

	// Проверяем подключение
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("ошибка подключения к Redis: %v", err)
	}

	fmt.Println("Redis подключён!")
	return rdb
}
```

### 9.2 Базовые операции

```go
func basicOperations(ctx context.Context, rdb *redis.Client) {
	// ============ СТРОКИ (Strings) ============

	// Set — записать значение с TTL (время жизни)
	err := rdb.Set(ctx, "user:1:name", "Алексей", 10*time.Minute).Err()
	if err != nil {
		log.Printf("ошибка Set: %v", err)
	}

	// Set без TTL (0 — бессрочно)
	rdb.Set(ctx, "config:version", "1.0.0", 0)

	// Get — прочитать значение
	val, err := rdb.Get(ctx, "user:1:name").Result()
	if err == redis.Nil {
		// Ключ не существует — это НЕ ошибка
		fmt.Println("ключ не найден")
	} else if err != nil {
		log.Printf("ошибка Get: %v", err)
	} else {
		fmt.Printf("Имя: %s\n", val) // "Алексей"
	}

	// ============ ХЕШИ (Hashes) ============
	// Хеш — это словарь (map) внутри ключа. Идеален для хранения объектов.

	// HSet — записать поля хеша
	rdb.HSet(ctx, "user:1", map[string]interface{}{
		"name":  "Алексей",
		"email": "alex@example.com",
		"age":   25,
	})

	// HGet — прочитать одно поле
	email, _ := rdb.HGet(ctx, "user:1", "email").Result()
	fmt.Printf("Email: %s\n", email)

	// HGetAll — прочитать все поля
	userData, _ := rdb.HGetAll(ctx, "user:1").Result()
	for k, v := range userData {
		fmt.Printf("%s: %s\n", k, v)
	}

	// ============ СПИСКИ (Lists) ============
	// Список — двусвязный список. Используется как очередь задач.

	// LPush — добавить в начало списка
	rdb.LPush(ctx, "queue:tasks", "task1", "task2", "task3")

	// RPop — извлечь из конца списка (FIFO)
	task, _ := rdb.RPop(ctx, "queue:tasks").Result()
	fmt.Printf("Задача: %s\n", task) // "task1"

	// LLen — длина списка
	length, _ := rdb.LLen(ctx, "queue:tasks").Result()
	fmt.Printf("Задач в очереди: %d\n", length)

	// ============ МНОЖЕСТВА (Sets) ============
	// Множество — неупорядоченная коллекция уникальных элементов.

	// SAdd — добавить элементы
	rdb.SAdd(ctx, "user:1:tags", "golang", "backend", "postgresql")

	// SMembers — получить все элементы
	tags, _ := rdb.SMembers(ctx, "user:1:tags").Result()
	fmt.Printf("Теги: %v\n", tags)

	// SIsMember — проверить наличие элемента
	exists, _ := rdb.SIsMember(ctx, "user:1:tags", "golang").Result()
	fmt.Printf("Есть тег golang: %v\n", exists)

	// ============ СЧЁТЧИКИ (Counters) ============

	// Incr — атомарный инкремент на 1
	rdb.Set(ctx, "page:views", 0, 0)
	rdb.Incr(ctx, "page:views")
	rdb.Incr(ctx, "page:views")

	// IncrBy — атомарный инкремент на N
	rdb.IncrBy(ctx, "page:views", 10)

	views, _ := rdb.Get(ctx, "page:views").Int64()
	fmt.Printf("Просмотров: %d\n", views) // 12

	// ============ УПРАВЛЕНИЕ КЛЮЧАМИ ============

	// Del — удалить ключи
	rdb.Del(ctx, "user:1:name", "config:version")

	// Expire — установить TTL на существующий ключ
	rdb.Expire(ctx, "user:1", 1*time.Hour)

	// TTL — узнать оставшееся время жизни
	ttl, _ := rdb.TTL(ctx, "user:1").Result()
	fmt.Printf("TTL: %v\n", ttl)

	// Exists — проверить существование ключа
	count, _ := rdb.Exists(ctx, "user:1").Result()
	fmt.Printf("Ключ существует: %v\n", count > 0)
}
```

### 9.3 Cache-Aside паттерн

```go
// Cache-Aside (Lazy Loading) — самый распространённый паттерн кэширования.
// 1. Проверяем кэш
// 2. Если кэш пуст (cache miss) — запрашиваем из БД
// 3. Записываем результат в кэш
// 4. При обновлении — инвалидируем кэш

type CachedUserRepository struct {
	db    *gorm.DB
	cache *redis.Client
	ttl   time.Duration
}

func NewCachedUserRepository(db *gorm.DB, cache *redis.Client) *CachedUserRepository {
	return &CachedUserRepository{
		db:    db,
		cache: cache,
		ttl:   15 * time.Minute, // Время жизни кэша
	}
}

func (r *CachedUserRepository) GetByID(ctx context.Context, id uint) (*User, error) {
	cacheKey := fmt.Sprintf("user:%d", id)

	// 1. Проверяем кэш
	cached, err := r.cache.Get(ctx, cacheKey).Bytes()
	if err == nil {
		// Cache hit — десериализуем и возвращаем
		var user User
		if err := json.Unmarshal(cached, &user); err == nil {
			return &user, nil
		}
	}

	// 2. Cache miss — запрашиваем из БД
	var user User
	if err := r.db.WithContext(ctx).First(&user, id).Error; err != nil {
		return nil, err
	}

	// 3. Записываем в кэш
	data, err := json.Marshal(user)
	if err == nil {
		r.cache.Set(ctx, cacheKey, data, r.ttl)
	}

	return &user, nil
}

func (r *CachedUserRepository) Update(ctx context.Context, user *User) error {
	// Обновляем в БД
	if err := r.db.WithContext(ctx).Save(user).Error; err != nil {
		return err
	}

	// Инвалидируем кэш — при следующем чтении данные подтянутся из БД
	cacheKey := fmt.Sprintf("user:%d", user.ID)
	r.cache.Del(ctx, cacheKey)

	return nil
}

func (r *CachedUserRepository) Delete(ctx context.Context, id uint) error {
	if err := r.db.WithContext(ctx).Delete(&User{}, id).Error; err != nil {
		return err
	}

	// Инвалидируем кэш
	cacheKey := fmt.Sprintf("user:%d", id)
	r.cache.Del(ctx, cacheKey)

	return nil
}
```

> [!TIP] Стратегии инвалидации кэша
> - **Delete on write** (выше) — удаляем из кэша при обновлении. Просто и надёжно.
> - **Write-through** — обновляем кэш одновременно с БД. Быстрее на чтение, но сложнее.
> - **TTL** — данные сами устаревают через заданное время. Подходит, если допустима небольшая задержка обновления.

### 9.4 Распределённые блокировки

```go
// Распределённая блокировка (distributed lock) предотвращает одновременное
// выполнение одной и той же операции несколькими экземплярами приложения.

func acquireLock(ctx context.Context, rdb *redis.Client, key string, ttl time.Duration) (bool, error) {
	// SetNX — Set if Not eXists. Атомарная операция.
	// Возвращает true, если ключ был установлен (блокировка получена).
	// TTL гарантирует, что блокировка будет освобождена, даже если приложение упадёт.
	ok, err := rdb.SetNX(ctx, "lock:"+key, "locked", ttl).Result()
	return ok, err
}

func releaseLock(ctx context.Context, rdb *redis.Client, key string) error {
	return rdb.Del(ctx, "lock:"+key).Err()
}

// Использование:
func processOrder(ctx context.Context, rdb *redis.Client, orderID string) error {
	lockKey := "order:" + orderID

	// Пытаемся получить блокировку
	acquired, err := acquireLock(ctx, rdb, lockKey, 30*time.Second)
	if err != nil {
		return fmt.Errorf("ошибка получения блокировки: %w", err)
	}
	if !acquired {
		return fmt.Errorf("заказ %s уже обрабатывается", orderID)
	}
	defer releaseLock(ctx, rdb, lockKey)

	// Безопасно обрабатываем заказ — только один экземпляр приложения
	fmt.Printf("Обработка заказа %s...\n", orderID)
	time.Sleep(2 * time.Second) // Имитация работы
	fmt.Printf("Заказ %s обработан\n", orderID)

	return nil
}
```

> [!WARNING] Простая блокировка имеет ограничения
> Реализация выше подходит для простых случаев. Для продакшена используйте библиотеку **go-redsync**, которая реализует алгоритм Redlock:
> - Поддержка нескольких экземпляров Redis
> - Автоматическое продление блокировки
> - Корректная обработка сбоев

### 9.5 Pub/Sub

```go
// Pub/Sub — механизм публикации/подписки для real-time сообщений.
// Подписчик получает сообщения мгновенно.

// Издатель (Publisher)
func publishNotification(ctx context.Context, rdb *redis.Client, channel, message string) error {
	return rdb.Publish(ctx, channel, message).Err()
}

// Подписчик (Subscriber)
func subscribeToNotifications(ctx context.Context, rdb *redis.Client, channel string) {
	// Subscribe создаёт подписку на канал
	sub := rdb.Subscribe(ctx, channel)
	defer sub.Close()

	// Channel() возвращает Go-канал для получения сообщений
	ch := sub.Channel()

	for msg := range ch {
		fmt.Printf("Канал: %s, Сообщение: %s\n", msg.Channel, msg.Payload)
	}
}

// Использование:
// Горутина-подписчик (см. [[05-concurrency]])
// go subscribeToNotifications(ctx, rdb, "notifications")
//
// Публикация
// publishNotification(ctx, rdb, "notifications", "Новый заказ #123")
```

###### 🏠 Домашнее задание

1. Реализуйте кэширование списка продуктов с использованием Cache-Aside паттерна
2. Создайте счётчик просмотров страниц с использованием `Incr`
3. Реализуйте простую очередь задач: один сервис пишет задачи в список, другой читает и обрабатывает
4. Добавьте распределённую блокировку для операции создания заказа
5. Реализуйте хранение сессий в Redis с TTL

---

## 10. MongoDB

MongoDB — документоориентированная NoSQL база данных. В Go для работы с ней используется официальный драйвер `mongo-driver`.

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Product struct {
	ID          string    `bson:"_id,omitempty"`
	Name        string    `bson:"name"`
	Description string    `bson:"description"`
	Price       float64   `bson:"price"`
	Tags        []string  `bson:"tags"`
	CreatedAt   time.Time `bson:"created_at"`
}

func mongoExample() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Подключение к MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	// Выбираем коллекцию (аналог таблицы)
	collection := client.Database("mydb").Collection("products")

	// Вставка документа
	product := Product{
		Name:      "Ноутбук",
		Price:     85000,
		Tags:      []string{"электроника", "компьютеры"},
		CreatedAt: time.Now(),
	}
	result, err := collection.InsertOne(ctx, product)
	fmt.Printf("Вставлен документ: %v\n", result.InsertedID)

	// Поиск документа
	var found Product
	err = collection.FindOne(ctx, bson.M{"name": "Ноутбук"}).Decode(&found)
	fmt.Printf("Найден: %s (%.0f руб.)\n", found.Name, found.Price)

	// Поиск нескольких документов
	cursor, err := collection.Find(ctx, bson.M{"price": bson.M{"$gte": 50000}})
	if err != nil {
		log.Fatal(err)
	}
	var products []Product
	cursor.All(ctx, &products)
}
```

> [!INFO] Когда использовать MongoDB vs PostgreSQL
> **MongoDB подходит, когда:**
> - Схема данных часто меняется или не определена заранее
> - Данные имеют древовидную / вложенную структуру (JSON-документы)
> - Нужна горизонтальная масштабируемость (шардинг)
> - Нет сложных JOIN-ов между коллекциями
>
> **PostgreSQL лучше, когда:**
> - Данные имеют чёткую реляционную структуру
> - Нужны сложные запросы с JOIN, агрегациями, оконными функциями
> - Важна строгая целостность данных (ACID транзакции)
> - Нужны уникальные индексы, CHECK-ограничения, внешние ключи

###### 🏠 Домашнее задание

1. Установите MongoDB через Docker и подключитесь из Go
2. Реализуйте CRUD для коллекции `products` с вложенными документами (массив отзывов)
3. Сравните код MongoDB и PostgreSQL для одинаковых операций

---

## 11. Продвинутые паттерны

### 11.1 Repository Pattern

```go
// Repository Pattern абстрагирует доступ к данным.
// Бизнес-логика работает через интерфейс, не зная о конкретной БД.

// Интерфейс репозитория — определяет контракт
type TodoRepository interface {
	Create(ctx context.Context, todo *Todo) error
	GetByID(ctx context.Context, id uint) (*Todo, error)
	List(ctx context.Context, filter TodoFilter) ([]Todo, int64, error)
	Update(ctx context.Context, todo *Todo) error
	Delete(ctx context.Context, id uint) error
}

// Фильтр для поиска
type TodoFilter struct {
	Status   *string
	Priority *int
	Page     int
	PageSize int
}

// Реализация с PostgreSQL (GORM)
type postgresTodoRepo struct {
	db *gorm.DB
}

func NewPostgresTodoRepo(db *gorm.DB) TodoRepository {
	return &postgresTodoRepo{db: db}
}

func (r *postgresTodoRepo) List(ctx context.Context, filter TodoFilter) ([]Todo, int64, error) {
	var todos []Todo
	var total int64

	query := r.db.WithContext(ctx).Model(&Todo{})

	// Динамическая фильтрация
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.Priority != nil {
		query = query.Where("priority = ?", *filter.Priority)
	}

	// Подсчёт общего количества
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Пагинация и сортировка
	err := query.Scopes(Paginate(filter.Page, filter.PageSize)).
		Order("created_at DESC").
		Find(&todos).Error

	return todos, total, err
}

// Сервисный слой работает с интерфейсом, а не с конкретной реализацией
type TodoService struct {
	repo TodoRepository
}

func NewTodoService(repo TodoRepository) *TodoService {
	return &TodoService{repo: repo}
}

func (s *TodoService) CreateTodo(ctx context.Context, title, description string) (*Todo, error) {
	// Бизнес-логика: валидация
	if title == "" {
		return nil, errors.New("название задачи обязательно")
	}

	todo := &Todo{
		Title:       title,
		Description: description,
		Status:      "new",
		Priority:    1,
	}

	if err := s.repo.Create(ctx, todo); err != nil {
		return nil, fmt.Errorf("ошибка создания задачи: %w", err)
	}

	return todo, nil
}
```

### 11.2 Оптимистичная блокировка (Optimistic Locking)

```go
// Оптимистичная блокировка предотвращает потерю обновлений
// при конкурентном редактировании одной записи.
// Использует колонку version, которая увеличивается при каждом обновлении.

type Document struct {
	gorm.Model
	Title   string `gorm:"size:500;not null"`
	Content string `gorm:"type:text"`
	Version int    `gorm:"not null;default:1"` // Колонка версии
}

func updateDocumentOptimistic(ctx context.Context, db *gorm.DB, doc *Document) error {
	currentVersion := doc.Version

	// Обновляем только если version совпадает
	result := db.WithContext(ctx).
		Model(doc).
		Where("version = ?", currentVersion).             // Проверяем текущую версию
		Updates(map[string]interface{}{
			"title":   doc.Title,
			"content": doc.Content,
			"version": currentVersion + 1,                 // Увеличиваем версию
		})

	if result.Error != nil {
		return result.Error
	}

	// Если RowsAffected == 0, значит кто-то изменил запись раньше нас
	if result.RowsAffected == 0 {
		return fmt.Errorf("конфликт: документ был изменён другим пользователем, обновите страницу")
	}

	doc.Version = currentVersion + 1
	return nil
}
```

### 11.3 Cursor-based пагинация

```go
// Offset-based пагинация (LIMIT/OFFSET) тормозит на больших таблицах,
// потому что БД должна пропустить все строки до OFFSET.
// На таблице с 1 млн строк OFFSET 999000 будет очень медленным.

// Cursor-based пагинация использует ID или timestamp последней записи
// как "курсор" для следующей страницы. Скорость не зависит от номера страницы.

type CursorPage struct {
	Items      []Todo `json:"items"`
	NextCursor string `json:"next_cursor,omitempty"` // ID последнего элемента
	HasMore    bool   `json:"has_more"`
}

func listTodosWithCursor(ctx context.Context, db *gorm.DB, cursor string, pageSize int) (*CursorPage, error) {
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	query := db.WithContext(ctx).Order("id DESC").Limit(pageSize + 1)

	// Если есть курсор — фильтруем по нему
	if cursor != "" {
		cursorID, err := strconv.ParseUint(cursor, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("невалидный курсор: %w", err)
		}
		query = query.Where("id < ?", cursorID)
	}

	var todos []Todo
	if err := query.Find(&todos).Error; err != nil {
		return nil, err
	}

	page := &CursorPage{}

	// Если получили pageSize+1 записей — есть ещё данные
	if len(todos) > pageSize {
		page.HasMore = true
		todos = todos[:pageSize] // Убираем лишнюю запись
	}

	page.Items = todos

	// Курсор для следующей страницы — ID последнего элемента
	if len(todos) > 0 && page.HasMore {
		page.NextCursor = fmt.Sprintf("%d", todos[len(todos)-1].ID)
	}

	return page, nil
}

// Запрос первой страницы:  GET /todos?page_size=20
// Запрос второй страницы:  GET /todos?page_size=20&cursor=80
// Запрос третьей страницы: GET /todos?page_size=20&cursor=60
```

> [!INFO] Offset vs Cursor пагинация
> | Критерий | Offset (LIMIT/OFFSET) | Cursor |
> |----------|----------------------|--------|
> | Скорость на больших таблицах | Деградирует (O(offset)) | Постоянная (O(1)) |
> | Переход на конкретную страницу | Да | Нет |
> | Стабильность при INSERT | Записи могут дублироваться/пропускаться | Стабильные результаты |
> | Сложность реализации | Простая | Средняя |
> | Подходит для | Панели администратора | Бесконечная прокрутка, API |

### 11.4 Nullable-колонки

```go
// database/sql предоставляет специальные типы для nullable-колонок
type UserProfile struct {
	ID        int64
	Name      string
	Phone     sql.NullString // Может быть NULL
	Age       sql.NullInt64  // Может быть NULL
	BirthDate sql.NullTime   // Может быть NULL
	Score     sql.NullFloat64
	Active    sql.NullBool
}

// Работа с sql.NullString:
func nullableExample(ctx context.Context, db *sql.DB) {
	var profile UserProfile
	err := db.QueryRowContext(ctx,
		"SELECT id, name, phone, age FROM user_profiles WHERE id = $1", 1,
	).Scan(&profile.ID, &profile.Name, &profile.Phone, &profile.Age)
	if err != nil {
		log.Fatal(err)
	}

	// Проверяем, есть ли значение
	if profile.Phone.Valid {
		fmt.Printf("Телефон: %s\n", profile.Phone.String)
	} else {
		fmt.Println("Телефон не указан")
	}

	// Создание NullString
	phone := sql.NullString{String: "+7-999-123-45-67", Valid: true}
	noPhone := sql.NullString{Valid: false} // NULL

	_, _ = phone, noPhone
}

// В GORM для nullable полей используются указатели:
type GormUserProfile struct {
	gorm.Model
	Name  string  `gorm:"not null"`
	Phone *string // Указатель = nullable. nil = NULL в БД.
	Age   *int
}
```

### 11.5 Unit of Work (основы)

```go
// Unit of Work — паттерн, который группирует несколько операций в одну транзакцию.
// Все изменения применяются разом или откатываются.

type UnitOfWork struct {
	db *gorm.DB
}

func NewUnitOfWork(db *gorm.DB) *UnitOfWork {
	return &UnitOfWork{db: db}
}

// Do выполняет функцию в рамках одной транзакции.
// Все репозитории внутри fn работают с одним и тем же tx.
func (uow *UnitOfWork) Do(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return uow.db.WithContext(ctx).Transaction(fn)
}

// Использование:
func createOrderWithUoW(ctx context.Context, uow *UnitOfWork, order *Order, items []OrderItem) error {
	return uow.Do(ctx, func(tx *gorm.DB) error {
		// Создаём заказ
		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// Создаём позиции заказа
		for i := range items {
			items[i].OrderID = order.ID
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}

		// Уменьшаем остатки товаров
		for _, item := range items {
			result := tx.Model(&Product{}).
				Where("id = ? AND quantity >= ?", item.ProductID, item.Quantity).
				Update("quantity", gorm.Expr("quantity - ?", item.Quantity))

			if result.RowsAffected == 0 {
				return fmt.Errorf("товар %d: недостаточно на складе", item.ProductID)
			}
		}

		return nil // Commit
	})
}
```

###### 🏠 Домашнее задание

1. Реализуйте Repository Pattern для двух сущностей: `User` и `Order`
2. Добавьте оптимистичную блокировку в обновление документа и напишите тест с конкурентным доступом
3. Замените offset-пагинацию на cursor-based в API списка задач
4. Реализуйте Unit of Work для создания заказа с несколькими позициями
5. Добавьте nullable-поля в модель пользователя (телефон, дата рождения) и обработайте их корректно

---

## 12. Сквозной проект: Todo API с PostgreSQL

Объединяем знания из [[03-networking]] (REST API) и этой главы (базы данных) в полноценное приложение.

### 12.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: todo_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

```bash
# Запуск
docker-compose up -d

# Проверка
docker-compose ps
docker-compose logs postgres
```

### 12.2 Структура проекта

```
todo-api/
├── cmd/
│   └── server/
│       └── main.go          # Точка входа
├── internal/
│   ├── model/
│   │   └── todo.go           # Модели данных
│   ├── repository/
│   │   └── todo_repository.go # Слой доступа к данным
│   ├── service/
│   │   └── todo_service.go    # Бизнес-логика
│   └── handler/
│       └── todo_handler.go    # HTTP-обработчики
├── migrations/
│   ├── 000001_create_todos_table.up.sql
│   └── 000001_create_todos_table.down.sql
├── docker-compose.yml
├── go.mod
└── go.sum
```

### 12.3 Модель

```go
// internal/model/todo.go
package model

import (
	"time"

	"gorm.io/gorm"
)

// Todo — основная модель задачи
type Todo struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"size:500;not null;index" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Status      string         `gorm:"size:50;not null;default:'new';index" json:"status"`
	Priority    int            `gorm:"not null;default:1;check:priority >= 1 AND priority <= 5" json:"priority"`
	CreatedAt   time.Time      `gorm:"not null" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"not null" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"` // Soft delete, скрыт из JSON
}

// Допустимые статусы
const (
	StatusNew        = "new"
	StatusInProgress = "in_progress"
	StatusDone       = "done"
	StatusCancelled  = "cancelled"
)

// Validate проверяет корректность данных
func (t *Todo) Validate() error {
	if t.Title == "" {
		return fmt.Errorf("title обязателен")
	}
	if len(t.Title) > 500 {
		return fmt.Errorf("title слишком длинный (макс. 500 символов)")
	}
	if t.Priority < 1 || t.Priority > 5 {
		return fmt.Errorf("priority должен быть от 1 до 5")
	}
	validStatuses := map[string]bool{
		StatusNew: true, StatusInProgress: true,
		StatusDone: true, StatusCancelled: true,
	}
	if t.Status != "" && !validStatuses[t.Status] {
		return fmt.Errorf("невалидный status: %s", t.Status)
	}
	return nil
}

// CreateTodoRequest — запрос на создание задачи
type CreateTodoRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    int    `json:"priority"`
}

// UpdateTodoRequest — запрос на обновление задачи
type UpdateTodoRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
	Priority    *int    `json:"priority"`
}

// TodoFilter — параметры фильтрации
type TodoFilter struct {
	Status   *string
	Priority *int
	Search   *string // Поиск по title
	Page     int
	PageSize int
}

// TodoListResponse — ответ со списком задач и метаданными пагинации
type TodoListResponse struct {
	Items      []Todo `json:"items"`
	Total      int64  `json:"total"`
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
	TotalPages int    `json:"total_pages"`
}
```

### 12.4 Миграция

```sql
-- migrations/000001_create_todos_table.up.sql

CREATE TABLE IF NOT EXISTS todos (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    status      VARCHAR(50) NOT NULL DEFAULT 'new',
    priority    INT NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_todos_status ON todos (status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos (priority);
CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON todos (deleted_at);
CREATE INDEX IF NOT EXISTS idx_todos_title ON todos USING gin (to_tsvector('russian', title));
```

```sql
-- migrations/000001_create_todos_table.down.sql

DROP TABLE IF EXISTS todos;
```

### 12.5 Репозиторий

```go
// internal/repository/todo_repository.go
package repository

import (
	"context"
	"fmt"
	"math"

	"todo-api/internal/model"

	"gorm.io/gorm"
)

// TodoRepository — интерфейс для работы с задачами
type TodoRepository interface {
	Create(ctx context.Context, todo *model.Todo) error
	GetByID(ctx context.Context, id uint) (*model.Todo, error)
	List(ctx context.Context, filter model.TodoFilter) (*model.TodoListResponse, error)
	Update(ctx context.Context, todo *model.Todo) error
	Delete(ctx context.Context, id uint) error
}

// gormTodoRepo — реализация репозитория на GORM
type gormTodoRepo struct {
	db *gorm.DB
}

// NewTodoRepository создаёт новый экземпляр репозитория
func NewTodoRepository(db *gorm.DB) TodoRepository {
	return &gormTodoRepo{db: db}
}

func (r *gormTodoRepo) Create(ctx context.Context, todo *model.Todo) error {
	if todo.Status == "" {
		todo.Status = model.StatusNew
	}
	if todo.Priority == 0 {
		todo.Priority = 1
	}
	return r.db.WithContext(ctx).Create(todo).Error
}

func (r *gormTodoRepo) GetByID(ctx context.Context, id uint) (*model.Todo, error) {
	var todo model.Todo
	err := r.db.WithContext(ctx).First(&todo, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("задача id=%d не найдена", id)
		}
		return nil, fmt.Errorf("ошибка получения задачи: %w", err)
	}
	return &todo, nil
}

func (r *gormTodoRepo) List(ctx context.Context, filter model.TodoFilter) (*model.TodoListResponse, error) {
	// Значения по умолчанию
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 20
	}

	query := r.db.WithContext(ctx).Model(&model.Todo{})

	// Применяем фильтры
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.Priority != nil {
		query = query.Where("priority = ?", *filter.Priority)
	}
	if filter.Search != nil && *filter.Search != "" {
		query = query.Where("title ILIKE ?", "%"+*filter.Search+"%")
	}

	// Считаем общее количество
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("ошибка подсчёта задач: %w", err)
	}

	// Получаем страницу данных
	var todos []model.Todo
	offset := (filter.Page - 1) * filter.PageSize
	err := query.
		Order("priority DESC, created_at DESC").
		Limit(filter.PageSize).
		Offset(offset).
		Find(&todos).Error
	if err != nil {
		return nil, fmt.Errorf("ошибка получения задач: %w", err)
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.PageSize)))

	return &model.TodoListResponse{
		Items:      todos,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (r *gormTodoRepo) Update(ctx context.Context, todo *model.Todo) error {
	return r.db.WithContext(ctx).Save(todo).Error
}

func (r *gormTodoRepo) Delete(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Delete(&model.Todo{}, id)
	if result.Error != nil {
		return fmt.Errorf("ошибка удаления задачи: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("задача id=%d не найдена", id)
	}
	return nil
}
```

### 12.6 Сервис

```go
// internal/service/todo_service.go
package service

import (
	"context"
	"fmt"

	"todo-api/internal/model"
	"todo-api/internal/repository"
)

type TodoService struct {
	repo repository.TodoRepository
}

func NewTodoService(repo repository.TodoRepository) *TodoService {
	return &TodoService{repo: repo}
}

func (s *TodoService) Create(ctx context.Context, req model.CreateTodoRequest) (*model.Todo, error) {
	todo := &model.Todo{
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		Status:      model.StatusNew,
	}

	// Валидация
	if err := todo.Validate(); err != nil {
		return nil, fmt.Errorf("ошибка валидации: %w", err)
	}

	if err := s.repo.Create(ctx, todo); err != nil {
		return nil, fmt.Errorf("ошибка создания задачи: %w", err)
	}

	return todo, nil
}

func (s *TodoService) GetByID(ctx context.Context, id uint) (*model.Todo, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TodoService) List(ctx context.Context, filter model.TodoFilter) (*model.TodoListResponse, error) {
	return s.repo.List(ctx, filter)
}

func (s *TodoService) Update(ctx context.Context, id uint, req model.UpdateTodoRequest) (*model.Todo, error) {
	// Получаем текущую задачу
	todo, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Обновляем только переданные поля (partial update)
	if req.Title != nil {
		todo.Title = *req.Title
	}
	if req.Description != nil {
		todo.Description = *req.Description
	}
	if req.Status != nil {
		todo.Status = *req.Status
	}
	if req.Priority != nil {
		todo.Priority = *req.Priority
	}

	// Валидация обновлённых данных
	if err := todo.Validate(); err != nil {
		return nil, fmt.Errorf("ошибка валидации: %w", err)
	}

	if err := s.repo.Update(ctx, todo); err != nil {
		return nil, fmt.Errorf("ошибка обновления задачи: %w", err)
	}

	return todo, nil
}

func (s *TodoService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}
```

### 12.7 HTTP-обработчики

```go
// internal/handler/todo_handler.go
package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"todo-api/internal/model"
	"todo-api/internal/service"
)

type TodoHandler struct {
	service *service.TodoService
}

func NewTodoHandler(service *service.TodoService) *TodoHandler {
	return &TodoHandler{service: service}
}

// RegisterRoutes регистрирует маршруты для Todo API
func (h *TodoHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/todos", h.Create)
	mux.HandleFunc("GET /api/todos", h.List)
	mux.HandleFunc("GET /api/todos/{id}", h.GetByID)
	mux.HandleFunc("PUT /api/todos/{id}", h.Update)
	mux.HandleFunc("DELETE /api/todos/{id}", h.Delete)
}

func (h *TodoHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.CreateTodoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "невалидный JSON")
		return
	}

	todo, err := h.service.Create(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, todo)
}

func (h *TodoHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "невалидный ID")
		return
	}

	todo, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, todo)
}

func (h *TodoHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := model.TodoFilter{
		Page:     parseIntQuery(r, "page", 1),
		PageSize: parseIntQuery(r, "page_size", 20),
	}

	if status := r.URL.Query().Get("status"); status != "" {
		filter.Status = &status
	}
	if priority := r.URL.Query().Get("priority"); priority != "" {
		if p, err := strconv.Atoi(priority); err == nil {
			filter.Priority = &p
		}
	}
	if search := r.URL.Query().Get("search"); search != "" {
		filter.Search = &search
	}

	result, err := h.service.List(r.Context(), filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *TodoHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "невалидный ID")
		return
	}

	var req model.UpdateTodoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "невалидный JSON")
		return
	}

	todo, err := h.service.Update(r.Context(), id, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, todo)
}

func (h *TodoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "невалидный ID")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}

// Вспомогательные функции

func parseID(r *http.Request) (uint, error) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func parseIntQuery(r *http.Request, key string, defaultVal int) int {
	val := r.URL.Query().Get(key)
	if val == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(val)
	if err != nil || n <= 0 {
		return defaultVal
	}
	return n
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
```

### 12.8 Точка входа

```go
// cmd/server/main.go
package main

import (
	"context"
	"embed"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"todo-api/internal/handler"
	"todo-api/internal/model"
	"todo-api/internal/repository"
	"todo-api/internal/service"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// Подключение к PostgreSQL
	dsn := getEnv("DATABASE_URL", "host=localhost user=postgres password=secret dbname=todo_db port=5432 sslmode=disable")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Info),
		TranslateError: true,
	})
	if err != nil {
		log.Fatalf("ошибка подключения к БД: %v", err)
	}

	// Настройка пула соединений
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(25)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	// Миграции (для разработки — AutoMigrate)
	if err := db.AutoMigrate(&model.Todo{}); err != nil {
		log.Fatalf("ошибка миграции: %v", err)
	}
	log.Println("Миграции применены")

	// Инициализация слоёв
	todoRepo := repository.NewTodoRepository(db)
	todoService := service.NewTodoService(todoRepo)
	todoHandler := handler.NewTodoHandler(todoService)

	// Настройка маршрутов
	mux := http.NewServeMux()
	todoHandler.RegisterRoutes(mux)

	// Middleware для логирования
	loggedMux := loggingMiddleware(mux)

	// HTTP-сервер
	addr := getEnv("PORT", ":8080")
	server := &http.Server{
		Addr:         addr,
		Handler:      loggedMux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Printf("Сервер запущен на %s", addr)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("ошибка сервера: %v", err)
		}
	}()

	// Ожидание сигнала завершения
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Завершение работы сервера...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("ошибка остановки сервера: %v", err)
	}

	sqlDB.Close()
	log.Println("Сервер остановлен")
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
```

### 12.9 Тестирование API

```bash
# Запуск
docker-compose up -d
go run cmd/server/main.go

# Создание задачи
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Изучить GORM", "description": "Прочитать документацию", "priority": 3}'

# Получение списка
curl http://localhost:8080/api/todos
curl "http://localhost:8080/api/todos?status=new&page=1&page_size=10"
curl "http://localhost:8080/api/todos?search=GORM"

# Получение по ID
curl http://localhost:8080/api/todos/1

# Обновление
curl -X PUT http://localhost:8080/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# Удаление (soft delete)
curl -X DELETE http://localhost:8080/api/todos/1
```

> [!summary] Архитектура сквозного проекта
> ```
> HTTP Request → Handler → Service → Repository → PostgreSQL
>                  ↑          ↑            ↑
>              валидация   бизнес-     абстракция
>              JSON        логика      данных
> ```
> 
> - **Handler** — парсит HTTP-запрос, вызывает сервис, формирует ответ
> - **Service** — содержит бизнес-логику, валидацию, оркестрацию
> - **Repository** — единственный слой, который знает о GORM/SQL
> 
> Этот подход позволяет:
> - Тестировать каждый слой отдельно (см. [[07-testing]])
> - Заменить GORM на pgx без изменения сервиса и обработчиков
> - Добавить кэширование Redis в репозиторий, не трогая остальной код

###### 🏠 Домашнее задание

1. Разверните проект с docker-compose и протестируйте все эндпоинты через curl
2. Добавьте модель `Category` с ассоциацией Many-to-Many к `Todo`
3. Реализуйте эндпоинт `PATCH /api/todos/:id/status` для смены статуса с валидацией переходов (new → in_progress → done)
4. Добавьте кэширование через Redis для метода `GetByID` с инвалидацией при Update и Delete
5. Замените AutoMigrate на golang-migrate с embed.FS
6. Добавьте эндпоинт `GET /api/todos/stats`, который возвращает количество задач по статусам
7. Напишите интеграционные тесты для репозитория с использованием testcontainers-go (см. [[07-testing]])
8. Реализуйте cursor-based пагинацию для списка задач

---

## Итоги

В этой главе мы рассмотрели полный стек работы с базами данных в Go:

| Уровень | Инструмент | Когда использовать |
|---------|-----------|-------------------|
| Низкий | `database/sql` | Максимальный контроль, переносимость между СУБД |
| Низкий | `pgx` | Максимальная производительность с PostgreSQL |
| Средний | `sqlx` | Удобный маппинг, named parameters, совместимость с sql.DB |
| Средний | `sqlc` | SQL-first подход, генерация типобезопасного кода |
| Высокий | `GORM` | Быстрая разработка, ассоциации, хуки, миграции |
| Кэш | `go-redis` | Кэширование, очереди, блокировки, Pub/Sub |
| NoSQL | `mongo-driver` | Документоориентированные данные без жёсткой схемы |

> [!TIP] Рекомендации по выбору
> - **Новый проект, нужна скорость разработки** → GORM + golang-migrate
> - **Критична производительность** → pgx + sqlc
> - **Нужна переносимость между СУБД** → database/sql или sqlx
> - **Кэширование** → Redis (go-redis)
> - **Гибкая схема данных** → MongoDB (но сначала убедитесь, что PostgreSQL JSONB не подойдёт!)

В следующей главе [[05-concurrency]] мы изучим горутины, каналы и паттерны конкурентности, которые позволяют Go обрабатывать тысячи запросов к БД одновременно.
