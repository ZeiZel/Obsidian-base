---
tags:
  - backend
  - golang
  - temporal
  - workflow
  - microservices
---

Temporal - движок durable execution, который гарантирует завершение бизнес-процессов даже при сбоях инфраструктуры. В отличие от обычных очередей задач, Temporal сохраняет полное состояние выполнения и автоматически восстанавливает процессы после перезапуска.

Ключевые отличия от очередей (RabbitMQ, Kafka, asynq):
- Состояние workflow сохраняется на сервере Temporal, а не в коде приложения
- Встроенные таймеры, ретраи, саги, сигналы и запросы
- Детерминистичное воспроизведение - при перезапуске worker восстанавливает состояние, "проигрывая" историю событий
- Видимость - можно в любой момент запросить состояние workflow

## Основные концепции

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

- **Workflow** - детерминистичная функция, описывающая бизнес-процесс. Оркестрирует activities, обрабатывает сигналы, может длиться от миллисекунд до месяцев
- **Activity** - единица работы с побочными эффектами (HTTP-запрос, запись в БД, отправка email). Может автоматически ретраиться
- **Worker** - процесс, который подключается к Temporal Server и выполняет workflows и activities
- **Task Queue** - именованная очередь, через которую Temporal Server распределяет задачи по workers
- **Workflow ID** - уникальный бизнес-идентификатор процесса (например, order-12345)
- **Run ID** - UUID конкретного запуска workflow

---

## Workflows

Workflow в Temporal - детерминистичная функция. Это означает строгие ограничения на то, что можно делать внутри:

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

func OrderWorkflow(ctx workflow.Context, order Order) (OrderResult, error) {
	logger := workflow.GetLogger(ctx)
	logger.Info("order workflow started", "orderID", order.ID)

	// Настройка activity options
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:    time.Second,
			BackoffCoefficient: 2.0,
			MaximumAttempts:    3,
		},
	})

	// Последовательное выполнение activities
	var validated OrderValidation
	if err := workflow.ExecuteActivity(actCtx, ValidateOrder, order).Get(ctx, &validated); err != nil {
		return OrderResult{}, fmt.Errorf("validate: %w", err)
	}

	var payment PaymentResult
	if err := workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &payment); err != nil {
		return OrderResult{}, fmt.Errorf("charge: %w", err)
	}

	// Таймер - workflow "засыпает", но Temporal помнит и разбудит
	workflow.Sleep(ctx, 24*time.Hour) // не блокирует worker

	var shipment ShipmentResult
	if err := workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, &shipment); err != nil {
		return OrderResult{}, fmt.Errorf("ship: %w", err)
	}

	return OrderResult{
		PaymentID:  payment.ID,
		TrackingNo: shipment.TrackingNo,
	}, nil
}
```

> [!important] Детерминизм workflow критически важен. Temporal восстанавливает состояние, воспроизводя историю событий. Если код workflow изменился между запусками (например, добавилась новая activity), это приведёт к non-determinism error. Для изменений используйте версионирование через workflow.GetVersion().

---

## Activities

Activities содержат код с побочными эффектами - всё то, что нельзя делать в workflow:

```go
import (
	"context"
	"go.temporal.io/sdk/activity"
)

func ValidateOrder(ctx context.Context, order Order) (OrderValidation, error) {
	// Обычный Go-код - HTTP-вызовы, БД, файлы
	logger := activity.GetInfo(ctx).ActivityType.Name
	// ...
	return OrderValidation{Valid: true}, nil
}

func ChargePayment(ctx context.Context, order Order) (PaymentResult, error) {
	// Вызов платёжного API
	result, err := stripeClient.Charge(order.Amount, order.Currency)
	if err != nil {
		return PaymentResult{}, err
	}
	return PaymentResult{ID: result.ID}, nil
}

// Долгая activity с heartbeat
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
			// Heartbeat сообщает Temporal что activity жива
			// Если worker упадёт, Temporal перезапустит activity на другом worker
			activity.RecordHeartbeat(ctx, lineCount)
		}
		// обработка строки...
	}
	return scanner.Err()
}
```

Activity options контролируют поведение:

- StartToCloseTimeout - максимальное время выполнения одной попытки
- ScheduleToCloseTimeout - максимальное время от постановки в очередь до завершения
- HeartbeatTimeout - если heartbeat не приходит за это время, activity считается зависшей
- RetryPolicy - стратегия повторных попыток

---

## Сигналы (Signals)

Сигналы позволяют отправлять данные в работающий workflow извне:

```go
// Workflow принимает сигнал
func ApprovalWorkflow(ctx workflow.Context, request Request) (string, error) {
	// Создание канала для сигнала
	approvalCh := workflow.GetSignalChannel(ctx, "approval-signal")

	// Выполнить предварительную проверку
	var checkResult CheckResult
	workflow.ExecuteActivity(ctx, PreCheck, request).Get(ctx, &checkResult)

	// Ожидание сигнала одобрения (с таймаутом)
	var approval ApprovalDecision
	timerCtx, cancelTimer := workflow.WithCancel(ctx)

	selector := workflow.NewSelector(ctx)

	selector.AddReceive(approvalCh, func(ch workflow.ReceiveChannel, more bool) {
		ch.Receive(ctx, &approval)
		cancelTimer()
	})

	selector.AddFuture(workflow.NewTimer(timerCtx, 72*time.Hour), func(f workflow.Future) {
		approval = ApprovalDecision{Approved: false, Reason: "timeout"}
	})

	selector.Select(ctx)

	if !approval.Approved {
		return "", fmt.Errorf("rejected: %s", approval.Reason)
	}

	// Продолжение после одобрения
	workflow.ExecuteActivity(ctx, ExecuteRequest, request).Get(ctx, nil)
	return "completed", nil
}

// Клиент отправляет сигнал
func sendApproval(c client.Client, workflowID string, decision ApprovalDecision) error {
	return c.SignalWorkflow(context.Background(), workflowID, "", "approval-signal", decision)
}
```

---

## Запросы (Queries)

Запросы позволяют читать состояние workflow без побочных эффектов:

```go
func OrderTrackingWorkflow(ctx workflow.Context, order Order) error {
	status := "created"
	var trackingNo string

	// Регистрация query handler
	err := workflow.SetQueryHandler(ctx, "get-status", func() (OrderStatus, error) {
		return OrderStatus{
			Status:     status,
			TrackingNo: trackingNo,
		}, nil
	})
	if err != nil {
		return err
	}

	status = "processing"
	workflow.ExecuteActivity(ctx, ProcessOrder, order).Get(ctx, nil)

	status = "shipped"
	workflow.ExecuteActivity(ctx, ShipOrder, order).Get(ctx, &trackingNo)

	status = "delivered"
	return nil
}

// Клиент делает запрос
resp, err := c.QueryWorkflow(ctx, workflowID, "", "get-status")
var status OrderStatus
resp.Get(&status)
fmt.Printf("Статус: %s, Трекинг: %s\n", status.Status, status.TrackingNo)
```

---

## Дочерние Workflows

Workflow может запускать другие workflows как дочерние:

```go
func ParentWorkflow(ctx workflow.Context, orders []Order) error {
	// Запуск дочерних workflows для каждого заказа
	var futures []workflow.ChildWorkflowFuture
	for _, order := range orders {
		childCtx := workflow.WithChildOptions(ctx, workflow.ChildWorkflowOptions{
			WorkflowID:        fmt.Sprintf("order-%d", order.ID),
			ParentClosePolicy: enums.PARENT_CLOSE_POLICY_TERMINATE, // или ABANDON, REQUEST_CANCEL
		})

		future := workflow.ExecuteChildWorkflow(childCtx, OrderWorkflow, order)
		futures = append(futures, future)
	}

	// Ожидание завершения всех дочерних workflows
	for i, f := range futures {
		var result OrderResult
		if err := f.Get(ctx, &result); err != nil {
			workflow.GetLogger(ctx).Error("child workflow failed",
				"orderID", orders[i].ID, "err", err)
			continue
		}
	}
	return nil
}
```

ParentClosePolicy определяет что происходит с дочерним workflow при завершении родителя:
- TERMINATE - немедленно завершить
- ABANDON - оставить работать независимо
- REQUEST_CANCEL - запросить отмену

---

## Таймеры и ожидание

```go
// workflow.Sleep - приостановка на указанное время
workflow.Sleep(ctx, 24*time.Hour) // не блокирует worker, Temporal разбудит

// workflow.NewTimer - создание таймера для использования в selector
timer := workflow.NewTimer(ctx, 5*time.Minute)

// workflow.Await - ожидание условия
var approved bool
workflow.Await(ctx, func() bool { return approved })

// Selector - мультиплексирование каналов и таймеров (аналог select)
selector := workflow.NewSelector(ctx)

selector.AddReceive(signalCh, func(ch workflow.ReceiveChannel, more bool) {
	var data SignalData
	ch.Receive(ctx, &data)
	// обработка сигнала
})

selector.AddFuture(workflow.NewTimer(ctx, 10*time.Minute), func(f workflow.Future) {
	// таймаут
})

selector.Select(ctx) // блокируется до одного из событий
```

---

## Повторные попытки (Retries)

RetryPolicy настраивается для activities и child workflows:

```go
retryPolicy := &temporal.RetryPolicy{
	InitialInterval:        time.Second,       // начальная задержка
	BackoffCoefficient:     2.0,               // множитель задержки
	MaximumInterval:        time.Minute,       // максимальная задержка
	MaximumAttempts:        5,                 // максимум попыток (0 = бесконечно)
	NonRetryableErrorTypes: []string{          // ошибки, которые не ретраить
		"InvalidInput",
		"InsufficientFunds",
	},
}

actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
	StartToCloseTimeout: 30 * time.Second,
	RetryPolicy:         retryPolicy,
})
```

Для маркировки ошибки как non-retryable внутри activity:

```go
func ChargePayment(ctx context.Context, order Order) error {
	err := gateway.Charge(order.Amount)
	if errors.Is(err, ErrInsufficientFunds) {
		// Эта ошибка не будет ретраиться
		return temporal.NewNonRetryableApplicationError(
			"insufficient funds", "InsufficientFunds", err)
	}
	return err
}
```

---

## Saga Pattern

Saga в Temporal реализуется через компенсационные действия при ошибках:

```go
func OrderSagaWorkflow(ctx workflow.Context, order Order) error {
	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy:         &temporal.RetryPolicy{MaximumAttempts: 3},
	})

	// Список компенсаций (выполняются в обратном порядке при ошибке)
	var compensations []func(workflow.Context) error

	// Шаг 1: Резервирование товара
	var reservation ReservationResult
	err := workflow.ExecuteActivity(actCtx, ReserveInventory, order).Get(ctx, &reservation)
	if err != nil {
		return fmt.Errorf("reserve: %w", err)
	}
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, ReleaseInventory, reservation.ID).Get(ctx, nil)
	})

	// Шаг 2: Списание оплаты
	var payment PaymentResult
	err = workflow.ExecuteActivity(actCtx, ChargePayment, order).Get(ctx, &payment)
	if err != nil {
		compensate(ctx, compensations)
		return fmt.Errorf("charge: %w", err)
	}
	compensations = append(compensations, func(ctx workflow.Context) error {
		return workflow.ExecuteActivity(actCtx, RefundPayment, payment.ID).Get(ctx, nil)
	})

	// Шаг 3: Отправка
	err = workflow.ExecuteActivity(actCtx, ShipOrder, order).Get(ctx, nil)
	if err != nil {
		compensate(ctx, compensations)
		return fmt.Errorf("ship: %w", err)
	}

	// Шаг 4: Уведомление
	_ = workflow.ExecuteActivity(actCtx, NotifyCustomer, order).Get(ctx, nil)

	return nil
}

func compensate(ctx workflow.Context, compensations []func(workflow.Context) error) {
	// Выполнение компенсаций в обратном порядке
	for i := len(compensations) - 1; i >= 0; i-- {
		if err := compensations[i](ctx); err != nil {
			workflow.GetLogger(ctx).Error("compensation failed", "err", err)
		}
	}
}
```

> [!info] Если на шаге ChargePayment произошла ошибка, saga автоматически вызовет ReleaseInventory (компенсация шага 1). Если ошибка на ShipOrder - вызовутся RefundPayment и ReleaseInventory в обратном порядке.

---

## Worker

Worker - процесс, который подключается к Temporal Server и выполняет workflow и activity функции:

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
	w := worker.New(c, "order-processing", worker.Options{
		MaxConcurrentActivityExecutionSize:     10,
		MaxConcurrentWorkflowTaskExecutionSize: 5,
	})

	// Регистрация workflows и activities
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

	if err := w.Run(worker.InterruptCh()); err != nil {
		log.Fatal("unable to start worker", err)
	}
}
```

---

## Полный пример - Order Processing

Пример объединяет все концепции: workflow с сигналами одобрения, activities, saga-компенсации, query для статуса:

```go
// === Типы ===

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

// === Workflow ===

func OrderProcessingWorkflow(ctx workflow.Context, order Order) (OrderStatus, error) {
	status := OrderStatus{Phase: "validating"}

	// Query handler для отслеживания статуса
	workflow.SetQueryHandler(ctx, "status", func() (OrderStatus, error) {
		return status, nil
	})

	actCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 30 * time.Second,
		RetryPolicy:         &temporal.RetryPolicy{MaximumAttempts: 3},
	})

	// Валидация заказа
	if err := workflow.ExecuteActivity(actCtx, ValidateOrder, order).Get(ctx, nil); err != nil {
		status.Phase = "validation_failed"
		return status, err
	}

	// Ожидание одобрения менеджером (для заказов > 10000)
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

	// Saga: резервирование -> оплата -> отправка
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

	// Уведомление (не критично, ошибка не откатывает процесс)
	_ = workflow.ExecuteActivity(actCtx, NotifyCustomer, order).Get(ctx, nil)

	status.Phase = "completed"
	return status, nil
}

// === Запуск workflow (клиент) ===

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

	fmt.Printf("Workflow started: ID=%s RunID=%s\n", we.GetID(), we.GetRunID())
	return we.GetID(), nil
}

// === Одобрение заказа (клиент) ===

func approveOrder(c client.Client, orderID string, approved bool) error {
	return c.SignalWorkflow(context.Background(),
		fmt.Sprintf("order-%s", orderID), "",
		"manager-approval", approved)
}

// === Запрос статуса (клиент) ===

func getOrderStatus(c client.Client, orderID string) (OrderStatus, error) {
	resp, err := c.QueryWorkflow(context.Background(),
		fmt.Sprintf("order-%s", orderID), "", "status")
	if err != nil {
		return OrderStatus{}, err
	}

	var status OrderStatus
	if err := resp.Get(&status); err != nil {
		return OrderStatus{}, err
	}
	return status, nil
}
```

> [!summary] Temporal workflow гарантирует, что заказ будет обработан до конца даже при падении worker-ов, перезапусках серверов или сетевых проблемах. Состояние (фаза, paymentID, trackingNo) восстанавливается автоматически через replay истории событий.

---

## Ссылки

- [Go (Golang)](Golang.md)
- [Микросервисы](Microservices/Микросервисы.md)
- [Temporal Go SDK](https://docs.temporal.io/develop/go)
- [Temporal Documentation](https://docs.temporal.io)
