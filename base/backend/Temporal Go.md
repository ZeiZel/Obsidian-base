---
tags:
  - backend
  - golang
  - temporal
  - workflow
  - microservices
---

## Что такое Temporal и зачем он нужен

Представь типичный бизнес-процесс: пользователь оформляет заказ. Нужно проверить данные, зарезервировать товар на складе, списать деньги с карты, отправить посылку и уведомить покупателя. Каждый шаг - это вызов отдельного сервиса или API, и на каждом шаге что-то может пойти не так. Сервер может упасть, сеть может отвалиться, платёжный шлюз может вернуть таймаут.

В обычном приложении придётся самостоятельно решать все эти проблемы: сохранять состояние процесса в базе данных, писать логику повторных попыток, реализовывать откат при ошибках, следить за таймаутами. Код бизнес-логики быстро обрастает инфраструктурным шумом и становится сложным для понимания.

Temporal - это движок durable execution, который берёт всю эту работу на себя. Он гарантирует, что бизнес-процесс дойдёт до конца, даже если по пути случатся сбои. Ты описываешь процесс как обычную функцию на Go, а Temporal обеспечивает его надёжное выполнение.

Ключевая идея Temporal - разделение бизнес-логики и инфраструктурной надёжности. Ты пишешь код так, как будто всё работает идеально: вызвал функцию валидации, вызвал функцию оплаты, вызвал функцию отправки. Temporal незаметно для тебя сохраняет состояние после каждого шага и при сбое восстанавливает процесс ровно с того места, где он остановился.

### Чем Temporal отличается от очередей задач

Очереди вроде RabbitMQ, Kafka или asynq решают более узкую задачу - доставить сообщение от отправителя к получателю. Но они не знают про состояние процесса. Если worker обработал три шага из пяти и упал, очередь не может восстановить процесс с четвёртого шага. Придётся самому хранить состояние, реализовывать стейт-машину и писать код восстановления.

Temporal принципиально отличается:

- Состояние workflow хранится на сервере Temporal, а не в коде приложения. Не нужно сохранять промежуточные результаты в базу данных
- Таймеры, ретраи, саги, сигналы и запросы встроены в платформу. Не нужно изобретать их заново для каждого проекта
- Детерминистичное воспроизведение - при перезапуске worker Temporal восстанавливает состояние, "проигрывая" историю событий. Workflow продолжается с того шага, на котором остановился
- Видимость - в любой момент можно запросить текущее состояние workflow, узнать на каком он шаге и что произошло

---

## Архитектура Temporal

Прежде чем писать код, важно понять, из каких частей состоит Temporal и как они взаимодействуют.

```
┌─────────────────────────────────────────────┐
│              Temporal Server                  │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ History │  │ Matching │  │ Frontend  │  │
│  │ Service │  │ Service  │  │ Service   │  │
│  └─────────┘  └──────────┘  └───────────┘  │
│              ↕ Task Queues                   │
└─────────────────────────────────────────────┘
         ↕                    ↕
   ┌───────────┐        ┌──────────┐
   │  Worker   │        │  Client  │
   │ (Workflow │        │ (запуск, │
   │  Activity)│        │  сигналы,│
   │           │        │  запросы)│
   └───────────┘        └──────────┘
```

Temporal Server - центральный компонент, который хранит состояние всех workflow и координирует выполнение. Внутри него работают несколько сервисов. History Service записывает каждое событие в историю workflow. Matching Service распределяет задачи по worker-ам через task queue. Frontend Service предоставляет API для клиентов.

Worker - это процесс на твоей стороне, который подключается к Temporal Server и выполняет реальный код workflow и activities. Worker-ов может быть несколько, они могут работать на разных машинах. Если один worker упадёт, Temporal перенаправит задачу на другой.

Client - код, который запускает workflow, отправляет сигналы и делает запросы. Обычно это HTTP-хендлер API или CLI-утилита.

Task Queue - именованная очередь, через которую Temporal Server распределяет задачи по worker-ам. Worker при запуске указывает, какую task queue он слушает. Это позволяет маршрутизировать разные типы задач на разные группы worker-ов.

### Ключевые понятия

Workflow - функция на Go, которая описывает бизнес-процесс. Она оркестрирует activities, обрабатывает сигналы, может "засыпать" на часы и дни. Workflow обязана быть детерминистичной - об этом подробно ниже.

Activity - единица реальной работы с побочными эффектами. HTTP-запрос к платёжному шлюзу, запись в базу данных, отправка email - всё это activities. Они могут автоматически повторяться при сбоях.

Workflow ID - уникальный бизнес-идентификатор процесса. Например, `order-12345`. По нему можно найти workflow, отправить ему сигнал или запросить состояние.

Run ID - технический UUID конкретного запуска workflow. У одного Workflow ID может быть несколько Run ID, если workflow перезапускался.

---

## Workflows

### Что такое workflow и почему детерминизм

Workflow - это обычная функция Go, которая принимает `workflow.Context` и входные данные, а возвращает результат и ошибку. Внешне она выглядит как обычный код, но внутри действуют строгие правила.

Главное правило - детерминизм. Это означает, что если запустить workflow с теми же входными данными дважды, он должен пройти ровно те же шаги в том же порядке. Зачем это нужно? Temporal восстанавливает состояние workflow через replay - он "проигрывает" историю событий, чтобы восстановить все локальные переменные и понять, на каком шаге процесс остановился. Если код workflow изменился между запусками, replay сломается, потому что история событий не будет совпадать с новым кодом.

Из-за требования детерминизма внутри workflow нельзя использовать операции, результат которых может отличаться при повторном выполнении:

```go
import (
	"time"
	"go.temporal.io/sdk/workflow"
)

// Внутри workflow НЕЛЬЗЯ:
// - вызывать time.Now(), time.Sleep()     -> использовать workflow.Now(), workflow.Sleep()
// - делать HTTP-запросы, обращаться к БД  -> выносить в activities
// - использовать math/rand               -> использовать workflow.SideEffect()
// - работать с файловой системой          -> выносить в activities
// - использовать горутины Go              -> использовать workflow.Go()
// - использовать каналы Go               -> использовать workflow.Channel
```

Каждый пункт имеет свою причину. `time.Now()` при replay вернёт другое время, чем при первом запуске. HTTP-запрос может вернуть другой ответ. `math/rand` вернёт другое число. Всё это нарушит детерминизм. Для каждой из этих операций Temporal предоставляет свой аналог, результат которого записывается в историю и при replay возвращается из неё.

### Простой workflow

Рассмотрим workflow обработки заказа. Он последовательно выполняет три шага: валидация, оплата, отправка.

```go
func OrderWorkflow(ctx workflow.Context, order Order) (OrderResult, error) {
	logger := workflow.GetLogger(ctx)
	logger.Info("order workflow started", "orderID", order.ID)

	// Настройка параметров для activities
	// Эти параметры определяют таймауты и политику повторных попыток
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:    time.Second,
			BackoffCoefficient: 2.0,
			MaximumAttempts:    3,
		},
	})

	// Шаг 1: Валидация заказа
	// ExecuteActivity запускает activity и возвращает Future
	// .Get() блокирует workflow до получения результата
	var validated OrderValidation
	err := workflow.ExecuteActivity(actCtx, ValidateOrder, order).Get(ctx, &validated)
	if err != nil {
		return OrderResult{}, fmt.Errorf("validate: %w", err)
	}

	// Шаг 2: Списание оплаты
	var payment PaymentResult
	err = workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &payment)
	if err != nil {
		return OrderResult{}, fmt.Errorf("charge: %w", err)
	}

	// Шаг 3: Ожидание 24 часа перед отправкой
	// workflow.Sleep не блокирует worker - Temporal записывает таймер
	// в историю и "разбудит" workflow через 24 часа
	workflow.Sleep(ctx, 24*time.Hour)

	// Шаг 4: Отправка
	var shipment ShipmentResult
	err = workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, &shipment)
	if err != nil {
		return OrderResult{}, fmt.Errorf("ship: %w", err)
	}

	return OrderResult{
		PaymentID:  payment.ID,
		TrackingNo: shipment.TrackingNo,
	}, nil
}
```

Этот код выглядит как обычная последовательная программа, но за кулисами происходит магия. После каждого `ExecuteActivity` Temporal записывает результат в историю. Если worker упадёт после оплаты, но до отправки, Temporal запустит workflow на другом worker. При replay он прочитает из истории, что валидация и оплата уже выполнены, и продолжит с шага отправки. Activity оплаты не будет вызвана повторно - Temporal вернёт сохранённый результат.

Обрати внимание на `workflow.Sleep(ctx, 24*time.Hour)`. В обычной программе это заблокировало бы поток на сутки. В Temporal это создаёт таймер на сервере. Worker свободен и может выполнять другие задачи. Через 24 часа Temporal "разбудит" workflow, и он продолжит выполнение.

> [!important] Детерминизм workflow критически важен. Если код workflow изменился между запусками - например, добавился новый шаг между оплатой и отправкой - Temporal выдаст non-determinism error, потому что история событий не совпадает с текущим кодом. Для безопасных изменений используется версионирование через `workflow.GetVersion()`.

### Версионирование workflow

Когда нужно изменить логику уже запущенных workflow, нельзя просто поменять код - это сломает replay. Temporal предоставляет механизм версионирования:

```go
func OrderWorkflow(ctx workflow.Context, order Order) (OrderResult, error) {
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
	})

	// GetVersion возвращает номер версии для этого workflow
	// Первый аргумент - идентификатор изменения
	// Второй - минимальная поддерживаемая версия
	// Третий - текущая версия
	v := workflow.GetVersion(ctx, "add-fraud-check", workflow.DefaultVersion, 1)

	var validated OrderValidation
	err := workflow.ExecuteActivity(actCtx, ValidateOrder, order).Get(ctx, &validated)
	if err != nil {
		return OrderResult{}, err
	}

	// Новый шаг добавлен только для версии 1+
	// Старые workflow (DefaultVersion) пропустят этот блок
	if v >= 1 {
		err = workflow.ExecuteActivity(actCtx, CheckFraud, order).Get(ctx, nil)
		if err != nil {
			return OrderResult{}, err
		}
	}

	// остальные шаги...
	return OrderResult{}, nil
}
```

При replay старых workflow `GetVersion` вернёт `DefaultVersion`, и блок с `CheckFraud` будет пропущен. Новые workflow получат версию 1 и выполнят проверку на мошенничество. Так можно безопасно эволюционировать логику, не ломая уже запущенные процессы.

---

## Activities

### Что такое activity и зачем она нужна

Activity - это место для кода с побочными эффектами. Всё, что нельзя делать внутри workflow, выносится в activity: HTTP-запросы, работа с базой данных, отправка email, чтение файлов, вызовы внешних API.

В отличие от workflow, activity - это обычная Go-функция с обычным `context.Context`. Внутри неё можно делать всё что угодно. Temporal запускает activity на worker, и если она упадёт или вернёт ошибку, автоматически повторит попытку на этом или другом worker согласно настроенной RetryPolicy.

```go
import (
	"context"
	"go.temporal.io/sdk/activity"
)

// Activity валидации - вызывает внешний сервис
func ValidateOrder(ctx context.Context, order Order) (OrderValidation, error) {
	// Внутри activity можно писать обычный Go-код
	// HTTP-вызовы, обращения к БД, работа с файлами - всё разрешено
	resp, err := validationService.Check(ctx, order)
	if err != nil {
		return OrderValidation{}, err
	}
	return OrderValidation{Valid: resp.IsValid}, nil
}

// Activity оплаты - вызывает платёжный API
func ChargePayment(ctx context.Context, order Order) (PaymentResult, error) {
	result, err := stripeClient.Charge(order.Amount, order.Currency)
	if err != nil {
		// Если Stripe вернул ошибку, Temporal повторит попытку
		// согласно RetryPolicy (через 1 сек, потом через 2 сек, потом через 4 сек)
		return PaymentResult{}, err
	}
	return PaymentResult{ID: result.ID}, nil
}
```

Ключевая идея: activity изолирует побочные эффекты от детерминистичного кода workflow. Результат каждой activity записывается в историю Temporal. При replay workflow activity не выполняется повторно - Temporal возвращает сохранённый результат.

### Heartbeat для долгих activity

Если activity выполняется долго - например, обрабатывает большой файл или ждёт внешний процесс - нужен механизм, который сообщит Temporal, что activity ещё жива. Для этого используется heartbeat.

```go
func ProcessLargeFile(ctx context.Context, path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineCount := 0
	for scanner.Scan() {
		lineCount++
		if lineCount%1000 == 0 {
			// RecordHeartbeat сообщает Temporal, что activity работает
			// Аргумент - прогресс, который можно использовать при перезапуске
			activity.RecordHeartbeat(ctx, lineCount)
		}
		// обработка строки...
	}
	return scanner.Err()
}
```

Heartbeat решает две задачи. Во-первых, если worker упадёт, Temporal заметит отсутствие heartbeat и перезапустит activity на другом worker. Без heartbeat Temporal узнает об этом только когда истечёт StartToCloseTimeout, что может быть долго. Во-вторых, значение heartbeat (в примере - номер обработанной строки) сохраняется и доступно при перезапуске через `activity.GetHeartbeatDetails()`, что позволяет продолжить обработку с того места, где остановились.

### Таймауты activity

Activity options контролируют поведение выполнения. Понимание каждого таймаута важно для корректной настройки:

- StartToCloseTimeout - максимальное время выполнения одной попытки activity. Если activity не завершилась за это время, Temporal считает её упавшей и запускает повторную попытку. Это основной таймаут, который нужно указывать всегда
- ScheduleToCloseTimeout - максимальное время от момента, когда Temporal поставил activity в очередь, до момента её успешного завершения. Включает время ожидания в очереди и все повторные попытки. Используется, когда нужно ограничить общее время
- HeartbeatTimeout - если heartbeat не приходит за это время, Temporal считает activity зависшей. Актуально только для activity, которые вызывают `RecordHeartbeat`
- ScheduleToStartTimeout - максимальное время ожидания в очереди до начала выполнения. Полезно для обнаружения ситуаций, когда worker-ов недостаточно

```go
actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
	StartToCloseTimeout:    30 * time.Second,
	HeartbeatTimeout:       10 * time.Second,
	ScheduleToCloseTimeout: 5 * time.Minute,
	RetryPolicy: &temporal.RetryPolicy{
		InitialInterval:    time.Second,
		BackoffCoefficient: 2.0,
		MaximumAttempts:    5,
	},
})
```

---

## Повторные попытки (Retries)

### Как работает RetryPolicy

Одно из главных преимуществ Temporal - автоматические повторные попытки. Не нужно писать циклы с `time.Sleep` и счётчиком попыток. Достаточно описать политику, и Temporal сделает всё сам.

```go
retryPolicy := &temporal.RetryPolicy{
	InitialInterval:    time.Second,       // первая задержка - 1 секунда
	BackoffCoefficient: 2.0,               // каждая следующая задержка в 2 раза больше
	MaximumInterval:    time.Minute,       // но не больше 1 минуты
	MaximumAttempts:    5,                 // максимум 5 попыток (0 = бесконечно)
	NonRetryableErrorTypes: []string{      // эти ошибки не ретраить
		"InvalidInput",
		"InsufficientFunds",
	},
}
```

С такой политикой повторные попытки будут выполняться через 1 сек, 2 сек, 4 сек, 8 сек. Если activity каждый раз возвращает ошибку, после пятой попытки workflow получит ошибку и сможет её обработать.

Обрати внимание на `NonRetryableErrorTypes`. Не все ошибки имеет смысл повторять. Если пользователь указал невалидные данные или на счёте недостаточно средств, повторная попытка через 2 секунды ничего не изменит. Такие ошибки нужно пометить как non-retryable.

### Маркировка ошибок как non-retryable

Внутри activity можно явно указать, что определённая ошибка не подлежит повторным попыткам:

```go
func ChargePayment(ctx context.Context, order Order) error {
	err := gateway.Charge(order.Amount)
	if err == nil {
		return nil
	}

	// Ошибка "недостаточно средств" - повторять бессмысленно
	if errors.Is(err, ErrInsufficientFunds) {
		return temporal.NewNonRetryableApplicationError(
			"insufficient funds", "InsufficientFunds", err)
	}

	// Все остальные ошибки (сетевые, таймауты) будут повторяться
	// согласно RetryPolicy
	return err
}
```

Это важный паттерн. Бизнес-ошибки (невалидные данные, нехватка средств, товар закончился) помечаются как non-retryable и сразу всплывают в workflow для обработки. Инфраструктурные ошибки (сеть, таймауты, временная недоступность сервиса) остаются retryable, и Temporal повторяет попытки.

---

## Сигналы (Signals)

### Зачем нужны сигналы

Сигналы решают задачу взаимодействия с работающим workflow извне. Представь: workflow обработки заказа дошёл до шага "ожидание одобрения менеджером". Менеджер через веб-интерфейс нажимает кнопку "Одобрить". Как передать это решение в работающий workflow?

Сигнал - это асинхронное сообщение, которое клиент отправляет в workflow. Workflow может ожидать сигнал, обрабатывать его и продолжать выполнение. Сигнал доставляется надёжно - даже если worker в момент отправки недоступен, сигнал будет доставлен, когда worker подключится.

### Workflow с ожиданием сигнала

```go
func ApprovalWorkflow(ctx workflow.Context, request Request) (string, error) {
	// Создаём канал для приёма сигналов с именем "approval-signal"
	// Имя - это строковый идентификатор, по которому клиент отправляет сигнал
	approvalCh := workflow.GetSignalChannel(ctx, "approval-signal")

	// Выполняем предварительную проверку
	var checkResult CheckResult
	err := workflow.ExecuteActivity(ctx, PreCheck, request).Get(ctx, &checkResult)
	if err != nil {
		return "", err
	}

	// Теперь нужно дождаться решения менеджера, но не вечно
	// Selector - аналог select в Go, но для workflow
	var approval ApprovalDecision
	timerCtx, cancelTimer := workflow.WithCancel(ctx)

	selector := workflow.NewSelector(ctx)

	// Вариант 1: пришёл сигнал одобрения
	selector.AddReceive(approvalCh, func(ch workflow.ReceiveChannel, more bool) {
		ch.Receive(ctx, &approval)
		cancelTimer() // отменяем таймер - сигнал уже получен
	})

	// Вариант 2: прошло 72 часа - таймаут
	selector.AddFuture(workflow.NewTimer(timerCtx, 72*time.Hour), func(f workflow.Future) {
		approval = ApprovalDecision{Approved: false, Reason: "timeout"}
	})

	// Select блокирует workflow до одного из событий
	selector.Select(ctx)

	if !approval.Approved {
		return "", fmt.Errorf("rejected: %s", approval.Reason)
	}

	// Одобрено - продолжаем выполнение
	err = workflow.ExecuteActivity(ctx, ExecuteRequest, request).Get(ctx, nil)
	if err != nil {
		return "", err
	}
	return "completed", nil
}
```

Selector работает как `select` в Go, но для мира Temporal. Он ожидает либо сигнал из канала, либо срабатывание таймера. Какое событие произойдёт первым, то и обработается. Если менеджер одобрит заказ через час - workflow продолжит работу через час. Если за 72 часа никто не одобрит - workflow получит отказ по таймауту.

### Отправка сигнала из клиента

Отправить сигнал в workflow можно из любого места - HTTP-хендлера, CLI-утилиты, другого workflow:

```go
func sendApproval(c client.Client, workflowID string, decision ApprovalDecision) error {
	// Первый аргумент - Workflow ID
	// Второй - Run ID (пустая строка = текущий запуск)
	// Третий - имя сигнала (должно совпадать с именем в GetSignalChannel)
	// Четвёртый - данные сигнала
	return c.SignalWorkflow(
		context.Background(),
		workflowID, "",
		"approval-signal", decision,
	)
}
```

---

## Запросы (Queries)

### Зачем нужны запросы

Запросы позволяют прочитать текущее состояние workflow без побочных эффектов. Это нужно для отображения статуса в интерфейсе: на какой фазе находится заказ, какие шаги уже выполнены, какой трекинг-номер присвоен.

В отличие от сигналов, запросы не изменяют состояние workflow. Они просто читают переменные и возвращают результат. Запросы обрабатываются синхронно - клиент получает ответ сразу.

```go
func OrderTrackingWorkflow(ctx workflow.Context, order Order) error {
	// Локальные переменные хранят состояние
	status := "created"
	var trackingNo string

	// Регистрируем query handler - функцию, которую клиент может вызвать
	// "get-status" - имя запроса
	err := workflow.SetQueryHandler(ctx, "get-status", func() (OrderStatus, error) {
		return OrderStatus{
			Status:     status,
			TrackingNo: trackingNo,
		}, nil
	})
	if err != nil {
		return err
	}

	// По мере выполнения workflow переменные обновляются
	status = "processing"
	err = workflow.ExecuteActivity(ctx, ProcessOrder, order).Get(ctx, nil)
	if err != nil {
		return err
	}

	status = "shipped"
	err = workflow.ExecuteActivity(ctx, ShipOrder, order).Get(ctx, &trackingNo)
	if err != nil {
		return err
	}

	status = "delivered"
	return nil
}
```

Когда клиент делает query, Temporal вызывает зарегистрированный handler, который читает текущие значения переменных `status` и `trackingNo`. Если workflow находится на шаге "shipping", query вернёт `status: "shipped"` и номер отслеживания.

```go
// Клиентский код для запроса статуса
resp, err := c.QueryWorkflow(ctx, workflowID, "", "get-status")
if err != nil {
	return OrderStatus{}, err
}
var status OrderStatus
err = resp.Get(&status)
```

> [!info] Query handler должен быть чистой функцией - только чтение переменных, никаких побочных эффектов. Нельзя запускать activities, писать в каналы или изменять состояние workflow внутри query handler.

---

## Таймеры и ожидание

### Почему таймеры Temporal отличаются от time.Sleep

В обычном Go-коде `time.Sleep(24 * time.Hour)` заблокирует горутину на сутки. Если процесс перезапустится, таймер потеряется. В Temporal таймеры работают иначе: `workflow.Sleep` создаёт запись в истории событий на сервере Temporal. Worker при этом свободен - он может выполнять другие задачи. Через указанное время Temporal отправит задачу worker-у, и workflow продолжит работу.

Это позволяет создавать workflow, которые длятся месяцами. Например, подписка с ежемесячным списанием или процесс онбординга нового клиента с напоминаниями через 3, 7 и 30 дней.

```go
// workflow.Sleep - простое ожидание
workflow.Sleep(ctx, 24*time.Hour)

// workflow.NewTimer - создание таймера для использования в selector
// Полезно, когда нужно ждать таймер ИЛИ сигнал - что придёт первым
timer := workflow.NewTimer(ctx, 5*time.Minute)

// workflow.Await - ожидание условия
// Блокирует workflow до тех пор, пока функция-условие не вернёт true
// Проверяется каждый раз, когда workflow получает событие (сигнал, результат activity)
var approved bool
workflow.Await(ctx, func() bool { return approved })
```

### Selector - мультиплексирование событий

Selector - мощный инструмент, который позволяет ожидать сразу несколько событий и реагировать на первое из них. Это аналог конструкции `select` в Go, но работающий в мире Temporal.

```go
selector := workflow.NewSelector(ctx)

// Ожидаем сигнал из канала
selector.AddReceive(signalCh, func(ch workflow.ReceiveChannel, more bool) {
	var data SignalData
	ch.Receive(ctx, &data)
	// обработка сигнала
})

// Одновременно ожидаем таймер
selector.AddFuture(workflow.NewTimer(ctx, 10*time.Minute), func(f workflow.Future) {
	// таймаут - сигнал не пришёл за 10 минут
})

// Select блокирует workflow до первого из событий
selector.Select(ctx)
```

Selector часто используется в паттерне "ожидание с таймаутом": workflow ждёт внешнее событие (сигнал, результат child workflow), но если событие не приходит за определённое время, выполняется альтернативная логика.

---

## Дочерние Workflows

### Когда использовать дочерние workflow

Иногда бизнес-процесс слишком сложен для одного workflow, или один и тот же подпроцесс используется в нескольких местах. В таких случаях workflow может запустить другие workflow как дочерние.

Типичные сценарии для дочерних workflow:

- Параллельная обработка нескольких заказов в рамках одного батча
- Выделение переиспользуемой логики (процесс оплаты используется в нескольких бизнес-процессах)
- Ограничение размера истории событий - для очень длинных процессов история может стать слишком большой, и её стоит разделить на несколько workflow

```go
func ParentWorkflow(ctx workflow.Context, orders []Order) error {
	// Запускаем дочерний workflow для каждого заказа
	var futures []workflow.ChildWorkflowFuture

	for _, order := range orders {
		childCtx := workflow.WithChildOptions(ctx, workflow.ChildWorkflowOptions{
			// Workflow ID дочернего workflow - уникальный для каждого заказа
			WorkflowID: fmt.Sprintf("order-%d", order.ID),
			// Что делать с дочерним workflow, если родитель завершится
			ParentClosePolicy: enums.PARENT_CLOSE_POLICY_TERMINATE,
		})

		// ExecuteChildWorkflow запускает дочерний workflow асинхронно
		// и возвращает Future - обещание результата
		future := workflow.ExecuteChildWorkflow(childCtx, OrderWorkflow, order)
		futures = append(futures, future)
	}

	// Ожидаем завершения всех дочерних workflows
	for i, f := range futures {
		var result OrderResult
		if err := f.Get(ctx, &result); err != nil {
			workflow.GetLogger(ctx).Error("child workflow failed",
				"orderID", orders[i].ID, "err", err)
			continue // ошибка одного заказа не останавливает остальные
		}
	}
	return nil
}
```

Все дочерние workflow запускаются параллельно - `ExecuteChildWorkflow` не блокирует выполнение, а возвращает Future. Блокировка происходит только в цикле `.Get()`, где мы ожидаем результаты.

ParentClosePolicy определяет, что происходит с дочерним workflow при завершении родителя:

- TERMINATE - немедленно завершить дочерний workflow. Используется, когда дочерний workflow не имеет смысла без родителя
- ABANDON - оставить дочерний workflow работать независимо. Используется, когда дочерний процесс должен завершиться в любом случае
- REQUEST_CANCEL - запросить отмену дочернего workflow. Даёт дочернему workflow шанс корректно завершиться

---

## Saga Pattern

### Проблема распределённых транзакций

В монолитной системе можно обернуть несколько операций в одну транзакцию БД: если что-то пошло не так, всё откатится. В распределённой системе такой возможности нет. Резервирование товара на складе, списание денег и создание доставки - это вызовы разных сервисов, и нет единой транзакции, которая их объединяет.

Saga решает эту проблему через компенсационные действия. Каждый успешный шаг регистрирует операцию отката. Если последующий шаг падает, все предыдущие шаги откатываются в обратном порядке.

```go
func OrderSagaWorkflow(ctx workflow.Context, order Order) error {
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy:         &temporal.RetryPolicy{MaximumAttempts: 3},
	})

	// Список компенсаций - функций отката
	// При ошибке они выполнятся в обратном порядке (стек)
	var compensations []func(workflow.Context) error

	// Шаг 1: Резервирование товара
	var reservation ReservationResult
	err := workflow.ExecuteActivity(actCtx, ReserveInventory, order).Get(ctx, &reservation)
	if err != nil {
		// Первый шаг - компенсировать нечего
		return fmt.Errorf("reserve: %w", err)
	}
	// Регистрируем компенсацию: если следующие шаги упадут, отпустим резерв
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, ReleaseInventory, reservation.ID).Get(ctx, nil)
	})

	// Шаг 2: Списание оплаты
	var payment PaymentResult
	err = workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &payment)
	if err != nil {
		// Оплата не прошла - откатываем шаг 1 (отпускаем резерв)
		compensate(ctx, compensations)
		return fmt.Errorf("charge: %w", err)
	}
	// Регистрируем компенсацию: возврат денег
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, RefundPayment, payment.ID).Get(ctx, nil)
	})

	// Шаг 3: Отправка
	err = workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, nil)
	if err != nil {
		// Отправка не прошла - откатываем шаги 2 и 1
		// RefundPayment, затем ReleaseInventory
		compensate(ctx, compensations)
		return fmt.Errorf("ship: %w", err)
	}

	// Шаг 4: Уведомление (не критично)
	_ = workflow.ExecuteActivity(actCtx, NotifyCustomer, order).Get(ctx, nil)

	return nil
}

// compensate выполняет компенсации в обратном порядке
func compensate(ctx workflow.Context, compensations []func(workflow.Context) error) {
	for i := len(compensations) - 1; i >= 0; i-- {
		if err := compensations[i](ctx); err != nil {
			// Логируем ошибку компенсации, но продолжаем
			// Temporal обеспечит ретраи для самих activities компенсации
			workflow.GetLogger(ctx).Error("compensation failed", "err", err)
		}
	}
}
```

Разберём сценарий ошибки на шаге 3. К этому моменту товар зарезервирован (шаг 1) и деньги списаны (шаг 2). Отправка провалилась. Функция `compensate` выполнит компенсации в обратном порядке: сначала `RefundPayment` (вернёт деньги), затем `ReleaseInventory` (отпустит резерв). Каждая компенсация - это activity, которая тоже может ретраиться при сбоях.

> [!info] Компенсация шага 4 (NotifyCustomer) не регистрируется, потому что уведомление - некритичный шаг. Его ошибка игнорируется оператором `_`. Если уведомление не отправилось, откатывать предыдущие шаги не нужно.

---

## Worker

### Что делает worker и как его настроить

Worker - это Go-процесс, который подключается к Temporal Server и говорит: "Я готов выполнять задачи из очереди order-processing". Temporal Server раздаёт задачи worker-ам, а worker выполняет зарегистрированные workflow и activity функции.

Worker не хранит состояние - он stateless. Можно запустить несколько worker-ов на разных машинах, и Temporal будет распределять задачи между ними. Если один worker упадёт, задачи автоматически перенаправятся на другие.

```go
package main

import (
	"log"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

func main() {
	// Подключение к Temporal Server
	c, err := client.Dial(client.Options{
		HostPort:  "localhost:7233",
		Namespace: "default",
	})
	if err != nil {
		log.Fatal("unable to create client", err)
	}
	defer c.Close()

	// Создание worker для конкретной task queue
	// Все workflow и activities регистрируются на одной task queue
	w := worker.New(c, "order-processing", worker.Options{
		// Максимум 10 activities выполняются одновременно на этом worker
		MaxConcurrentActivityExecutionSize: 10,
		// Максимум 5 workflow tasks обрабатываются одновременно
		MaxConcurrentWorkflowTaskExecutionSize: 5,
	})

	// Регистрация - worker узнаёт какие функции он умеет выполнять
	w.RegisterWorkflow(OrderWorkflow)
	w.RegisterWorkflow(OrderSagaWorkflow)
	w.RegisterWorkflow(ApprovalWorkflow)
	w.RegisterActivity(ValidateOrder)
	w.RegisterActivity(ChargePayment)
	w.RegisterActivity(RefundPayment)
	w.RegisterActivity(ReserveInventory)
	w.RegisterActivity(ReleaseInventory)
	w.RegisterActivity(ShipOrder)
	w.RegisterActivity(NotifyCustomer)

	// Run блокирует выполнение и обрабатывает задачи из task queue
	// InterruptCh() позволяет корректно завершить worker по SIGINT/SIGTERM
	if err := w.Run(worker.InterruptCh()); err != nil {
		log.Fatal("unable to start worker", err)
	}
}
```

Можно запустить несколько worker-ов для разных task queue. Например, тяжёлые activity обработки файлов можно вынести на отдельную task queue с worker-ами на мощных машинах, а лёгкие API-вызовы - на другую:

```go
// Worker для API-операций
w1 := worker.New(c, "api-tasks", worker.Options{
	MaxConcurrentActivityExecutionSize: 50,
})
w1.RegisterActivity(ValidateOrder)
w1.RegisterActivity(ChargePayment)

// Worker для тяжёлых задач (на другой машине)
w2 := worker.New(c, "heavy-tasks", worker.Options{
	MaxConcurrentActivityExecutionSize: 3,
})
w2.RegisterActivity(ProcessLargeFile)
w2.RegisterActivity(GenerateReport)
```

В workflow при вызове activity можно указать конкретную task queue:

```go
heavyCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
	TaskQueue:           "heavy-tasks",
	StartToCloseTimeout: 10 * time.Minute,
})
workflow.ExecuteActivity(heavyCtx, ProcessLargeFile, path).Get(ctx, nil)
```

---

## Клиент Temporal

### Запуск workflow и взаимодействие с ним

Клиент - это код, который инициирует бизнес-процессы и взаимодействует с ними. Обычно клиент живёт в HTTP-хендлере API или в CLI-утилите.

```go
import (
	"context"
	"fmt"
	"go.temporal.io/sdk/client"
)

func createTemporalClient() (client.Client, error) {
	return client.Dial(client.Options{
		HostPort:  "localhost:7233",
		Namespace: "default",
	})
}

// Запуск нового workflow
func startOrder(c client.Client, order Order) (string, error) {
	options := client.StartWorkflowOptions{
		// Workflow ID - бизнес-идентификатор
		// Temporal гарантирует уникальность: если workflow с таким ID уже запущен,
		// повторный запуск вернёт ошибку (защита от дублей)
		ID:        fmt.Sprintf("order-%s", order.ID),
		TaskQueue: "order-processing",
	}

	// ExecuteWorkflow запускает workflow и возвращает handle для отслеживания
	we, err := c.ExecuteWorkflow(context.Background(), options,
		OrderProcessingWorkflow, order)
	if err != nil {
		return "", err
	}

	fmt.Printf("Workflow started: ID=%s RunID=%s\n", we.GetID(), we.GetRunID())
	return we.GetID(), nil
}
```

Workflow ID играет роль ключа идемпотентности. Если пользователь дважды нажмёт кнопку "Оформить заказ", второй вызов `ExecuteWorkflow` с тем же ID вернёт ошибку, а не запустит дублирующий процесс.

### Ожидание результата

```go
// Синхронное ожидание результата workflow
func waitForOrder(c client.Client, workflowID string) (OrderStatus, error) {
	// GetWorkflow получает handle по Workflow ID
	we := c.GetWorkflow(context.Background(), workflowID, "")

	// Get блокирует до завершения workflow и возвращает результат
	var status OrderStatus
	err := we.Get(context.Background(), &status)
	return status, err
}
```

### Отмена workflow

```go
// Запрос на отмену workflow
func cancelOrder(c client.Client, workflowID string) error {
	return c.CancelWorkflow(context.Background(), workflowID, "")
}
```

При отмене workflow получает ошибку `ctx.Err() == context.Canceled`. Если workflow написан корректно, он может выполнить cleanup-логику перед завершением.

---

## Расширенные возможности

### SideEffect - недетерминистичные операции

Иногда в workflow нужен результат операции, которая не является детерминистичной, но при этом не тянет на полноценную activity. Например, генерация UUID или получение текущего времени. Для этого используется `SideEffect`:

```go
// SideEffect выполняется один раз, результат записывается в историю
// При replay возвращается сохранённый результат
var requestID string
encodedID := workflow.SideEffect(ctx, func(ctx workflow.Context) interface{} {
	return uuid.New().String()
})
encodedID.Get(&requestID)
```

`SideEffect` выполняет функцию один раз и записывает результат в историю. При replay функция не вызывается - результат берётся из истории. Это сохраняет детерминизм.

### workflow.Go - конкурентность внутри workflow

Внутри workflow нельзя использовать горутины Go (`go func()`), но можно использовать их аналог от Temporal:

```go
func ParallelWorkflow(ctx workflow.Context, items []Item) error {
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
	})

	// Запускаем обработку каждого элемента конкурентно
	var futures []workflow.Future
	for _, item := range items {
		item := item // capture
		future, settable := workflow.NewFuture(ctx)
		workflow.Go(ctx, func(gCtx workflow.Context) {
			var result ItemResult
			err := workflow.ExecuteActivity(actCtx, ProcessItem, item).Get(gCtx, &result)
			if err != nil {
				settable.SetError(err)
			} else {
				settable.Set(result, nil)
			}
		})
		futures = append(futures, future)
	}

	// Ожидаем все результаты
	for _, f := range futures {
		var result ItemResult
		if err := f.Get(ctx, &result); err != nil {
			return err
		}
	}
	return nil
}
```

### Continue-As-New

Если workflow выполняется очень долго (например, бесконечный цикл обработки), история событий может стать слишком большой. Continue-As-New позволяет "перезапустить" workflow с чистой историей, сохранив состояние:

```go
func RecurringWorkflow(ctx workflow.Context, state WorkflowState) error {
	for i := 0; i < 100; i++ {
		// Обработка очередной итерации
		err := workflow.ExecuteActivity(ctx, ProcessBatch, state.Offset).Get(ctx, nil)
		if err != nil {
			return err
		}
		state.Offset += 100
		state.Iterations++

		workflow.Sleep(ctx, time.Minute)
	}

	// После 100 итераций перезапускаем workflow с обновлённым состоянием
	// История событий обнуляется, но логическая цепочка сохраняется
	return workflow.NewContinueAsNewError(ctx, RecurringWorkflow, state)
}
```

> [!important] Continue-As-New необходим для workflow, которые работают неограниченно долго. Без него история будет расти бесконечно, что приведёт к проблемам с производительностью. Практическое правило - делайте Continue-As-New каждые несколько тысяч событий.

### Update (Temporal 1.21+)

Update - это комбинация сигнала и запроса. В отличие от сигнала, Update синхронный - клиент ожидает результат. В отличие от запроса, Update может изменять состояние workflow.

```go
// Регистрация update handler в workflow
err := workflow.SetUpdateHandler(ctx, "add-item", func(ctx workflow.Context, item OrderItem) (OrderStatus, error) {
	// Валидация - можно отклонить update
	if item.Quantity <= 0 {
		return OrderStatus{}, fmt.Errorf("invalid quantity")
	}

	// Изменение состояния workflow
	order.Items = append(order.Items, item)
	status.Phase = "updated"

	return status, nil
})
```

```go
// Клиентский вызов update
handle, err := c.UpdateWorkflow(ctx, client.UpdateWorkflowOptions{
	WorkflowID: workflowID,
	UpdateName: "add-item",
	Args:       []interface{}{newItem},
})
var result OrderStatus
err = handle.Get(ctx, &result)
```

---

## Полный пример - Order Processing

Этот пример объединяет все концепции: workflow с сигналами одобрения, activities, saga-компенсации, query для отслеживания статуса. Он показывает, как все части Temporal работают вместе в реальном бизнес-процессе.

### Типы данных

```go
type Order struct {
	ID       string
	UserID   string
	Amount   int64
	Currency string
	Items    []OrderItem
}

type OrderItem struct {
	ProductID string
	Quantity  int
}

type OrderStatus struct {
	Phase      string
	Approved   bool
	PaymentID  string
	TrackingNo string
}
```

### Workflow

```go
func OrderProcessingWorkflow(ctx workflow.Context, order Order) (OrderStatus, error) {
	status := OrderStatus{Phase: "validating"}

	// Query handler - позволяет клиенту в любой момент узнать статус заказа
	workflow.SetQueryHandler(ctx, "status", func() (OrderStatus, error) {
		return status, nil
	})

	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy:         &temporal.RetryPolicy{MaximumAttempts: 3},
	})

	// === Фаза 1: Валидация ===
	if err := workflow.ExecuteActivity(actCtx, ValidateOrder, order).Get(ctx, nil); err != nil {
		status.Phase = "validation_failed"
		return status, err
	}

	// === Фаза 2: Одобрение (только для крупных заказов) ===
	if order.Amount > 10000 {
		status.Phase = "awaiting_approval"

		approvalCh := workflow.GetSignalChannel(ctx, "manager-approval")
		selector := workflow.NewSelector(ctx)

		var approved bool
		selector.AddReceive(approvalCh, func(ch workflow.ReceiveChannel, more bool) {
			ch.Receive(ctx, &approved)
		})
		selector.AddFuture(workflow.NewTimer(ctx, 48*time.Hour), func(f workflow.Future) {
			approved = false
		})
		selector.Select(ctx)

		status.Approved = approved
		if !approved {
			status.Phase = "rejected"
			return status, fmt.Errorf("order not approved")
		}
	} else {
		status.Approved = true
	}

	// === Фаза 3: Saga - резервирование -> оплата -> отправка ===
	var compensations []func(workflow.Context) error

	status.Phase = "reserving"
	var reservationID string
	if err := workflow.ExecuteActivity(actCtx, ReserveInventory, order).Get(ctx, &reservationID); err != nil {
		status.Phase = "reservation_failed"
		return status, err
	}
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, ReleaseInventory, reservationID).Get(ctx, nil)
	})

	status.Phase = "charging"
	var paymentID string
	if err := workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &paymentID); err != nil {
		compensate(ctx, compensations)
		status.Phase = "payment_failed"
		return status, err
	}
	status.PaymentID = paymentID
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, RefundPayment, paymentID).Get(ctx, nil)
	})

	status.Phase = "shipping"
	var trackingNo string
	if err := workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, &trackingNo); err != nil {
		compensate(ctx, compensations)
		status.Phase = "shipping_failed"
		return status, err
	}
	status.TrackingNo = trackingNo

	// === Фаза 4: Уведомление (не критично) ===
	_ = workflow.ExecuteActivity(actCtx, NotifyCustomer, order).Get(ctx, nil)

	status.Phase = "completed"
	return status, nil
}
```

### Клиентский код

```go
// Запуск workflow
func startOrder(c client.Client, order Order) (string, error) {
	options := client.StartWorkflowOptions{
		ID:        fmt.Sprintf("order-%s", order.ID),
		TaskQueue: "order-processing",
	}

	we, err := c.ExecuteWorkflow(context.Background(), options,
		OrderProcessingWorkflow, order)
	if err != nil {
		return "", err
	}
	return we.GetID(), nil
}

// Одобрение заказа менеджером
func approveOrder(c client.Client, orderID string, approved bool) error {
	return c.SignalWorkflow(context.Background(),
		fmt.Sprintf("order-%s", orderID), "",
		"manager-approval", approved)
}

// Запрос текущего статуса
func getOrderStatus(c client.Client, orderID string) (OrderStatus, error) {
	resp, err := c.QueryWorkflow(context.Background(),
		fmt.Sprintf("order-%s", orderID), "", "status")
	if err != nil {
		return OrderStatus{}, err
	}
	var status OrderStatus
	err = resp.Get(&status)
	return status, err
}
```

> [!summary] Temporal workflow гарантирует, что заказ будет обработан до конца даже при падении worker-ов, перезапусках серверов или сетевых проблемах. Состояние (фаза, paymentID, trackingNo) восстанавливается автоматически через replay истории событий. Saga обеспечивает корректный откат при ошибках, а сигналы позволяют внешним системам взаимодействовать с процессом.

---

## Тестирование workflow

### Зачем отдельный фреймворк для тестирования

Workflow нельзя протестировать обычным `go test` без Temporal Server - ведь `workflow.ExecuteActivity`, `workflow.Sleep` и другие функции работают через SDK Temporal. Для тестирования Temporal предоставляет тестовое окружение, которое эмулирует сервер в памяти. Таймеры при этом не ждут реальное время - тестовое окружение "перематывает" время вперёд.

```go
import (
	"testing"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.temporal.io/sdk/testsuite"
)

func TestOrderWorkflow_Success(t *testing.T) {
	// Создаём тестовое окружение
	testSuite := &testsuite.WorkflowTestSuite{}
	env := testSuite.NewTestWorkflowEnvironment()

	// Мокаем activities - вместо реальных вызовов возвращаем фиксированные результаты
	env.OnActivity(ValidateOrder, mock.Anything, mock.Anything).
		Return(OrderValidation{Valid: true}, nil)
	env.OnActivity(ChargePayment, mock.Anything, mock.Anything).
		Return(PaymentResult{ID: "pay-123"}, nil)
	env.OnActivity(ShipOrder, mock.Anything, mock.Anything).
		Return(ShipmentResult{TrackingNo: "TRACK-456"}, nil)

	// Запускаем workflow
	order := Order{ID: "1", Amount: 5000}
	env.ExecuteWorkflow(OrderProcessingWorkflow, order)

	// Проверяем результат
	assert.True(t, env.IsWorkflowCompleted())
	assert.NoError(t, env.GetWorkflowError())

	var result OrderStatus
	assert.NoError(t, env.GetWorkflowResult(&result))
	assert.Equal(t, "completed", result.Phase)
	assert.Equal(t, "pay-123", result.PaymentID)
	assert.Equal(t, "TRACK-456", result.TrackingNo)
}
```

### Тестирование с сигналами

```go
func TestOrderWorkflow_Approval(t *testing.T) {
	testSuite := &testsuite.WorkflowTestSuite{}
	env := testSuite.NewTestWorkflowEnvironment()

	// Мокаем activities
	env.OnActivity(ValidateOrder, mock.Anything, mock.Anything).Return(nil, nil)
	env.OnActivity(ReserveInventory, mock.Anything, mock.Anything).Return("res-1", nil)
	env.OnActivity(ChargePayment, mock.Anything, mock.Anything).Return("pay-1", nil)
	env.OnActivity(ShipOrder, mock.Anything, mock.Anything).Return("TRACK-1", nil)
	env.OnActivity(NotifyCustomer, mock.Anything, mock.Anything).Return(nil)

	// Регистрируем отложенный сигнал
	// Через 1 час после начала workflow отправляем одобрение
	env.RegisterDelayedCallback(func() {
		env.SignalWorkflow("manager-approval", true)
	}, time.Hour)

	// Запускаем workflow с крупным заказом (>10000 - требует одобрения)
	order := Order{ID: "2", Amount: 50000}
	env.ExecuteWorkflow(OrderProcessingWorkflow, order)

	assert.True(t, env.IsWorkflowCompleted())
	assert.NoError(t, env.GetWorkflowError())

	var result OrderStatus
	env.GetWorkflowResult(&result)
	assert.True(t, result.Approved)
	assert.Equal(t, "completed", result.Phase)
}
```

### Тестирование таймаутов

```go
func TestOrderWorkflow_ApprovalTimeout(t *testing.T) {
	testSuite := &testsuite.WorkflowTestSuite{}
	env := testSuite.NewTestWorkflowEnvironment()

	env.OnActivity(ValidateOrder, mock.Anything, mock.Anything).Return(nil, nil)

	// Не отправляем сигнал - проверяем что workflow отклонит заказ по таймауту
	order := Order{ID: "3", Amount: 50000}
	env.ExecuteWorkflow(OrderProcessingWorkflow, order)

	// Workflow завершился с ошибкой - таймаут одобрения
	assert.True(t, env.IsWorkflowCompleted())
	assert.Error(t, env.GetWorkflowError())
}
```

Тестовое окружение автоматически перематывает таймеры. `workflow.NewTimer(ctx, 48*time.Hour)` в тесте не ждёт двое суток, а срабатывает мгновенно, когда тестовое окружение понимает, что других событий нет.

---

## Наблюдаемость и отладка

### Temporal Web UI

Temporal поставляется с веб-интерфейсом, где можно увидеть все workflow, их состояние, историю событий и результаты. Это главный инструмент отладки. Для каждого workflow видно:

- Текущее состояние (Running, Completed, Failed, Cancelled, Timed Out)
- Полную историю событий - какие activities были запущены, с какими параметрами, что вернули
- Входные данные и результат workflow
- Pending activities и signals

### Temporal CLI (tctl)

```bash
# Просмотр запущенных workflow
tctl workflow list

# Детали конкретного workflow
tctl workflow describe -w order-12345

# История событий
tctl workflow show -w order-12345

# Отправка сигнала из CLI
tctl workflow signal -w order-12345 --name manager-approval --input '"true"'

# Query статуса
tctl workflow query -w order-12345 --query_type status

# Отмена workflow
tctl workflow cancel -w order-12345

# Завершение workflow (принудительное)
tctl workflow terminate -w order-12345
```

---

## Частые ошибки и подводные камни

### Non-determinism error

Самая частая ошибка при работе с Temporal. Возникает, когда код workflow изменился так, что replay не может восстановить состояние. Типичные причины:

- Добавление или удаление вызова activity без `GetVersion`
- Изменение порядка вызовов activity
- Использование `time.Now()`, `math/rand` или других недетерминистичных операций
- Изменение типов параметров activity

Решение - всегда использовать `workflow.GetVersion()` при изменении логики workflow, у которого есть запущенные экземпляры.

### Activity timeout слишком маленький

Если activity не укладывается в StartToCloseTimeout, Temporal считает её упавшей и запускает повторную попытку. При этом первая попытка может всё ещё работать. Это может привести к двойным списаниям или дублированию данных. Решение - ставить таймаут с запасом и использовать идемпотентные операции.

### Забытый heartbeat для долгих activity

Если activity работает дольше StartToCloseTimeout, но не отправляет heartbeat, Temporal считает её зависшей. Для долгих операций необходимо использовать `activity.RecordHeartbeat` и настраивать HeartbeatTimeout.

### Слишком большая история событий

Workflow, который работает месяцами с тысячами итераций, накапливает огромную историю. Это замедляет replay и увеличивает нагрузку на Temporal Server. Решение - использовать Continue-As-New для периодического сброса истории.

### Блокировка горутин Go внутри workflow

Использование стандартных горутин и каналов Go внутри workflow ломает детерминизм. Только `workflow.Go()` и `workflow.Channel` безопасны для использования в workflow.

---

## Ссылки

- [Go (Golang)](Golang.md)
- [Микросервисы](Microservices/Микросервисы.md)
- [Temporal Go SDK](https://docs.temporal.io/develop/go)
- [Temporal Documentation](https://docs.temporal.io)
