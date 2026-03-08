---
tags:
  - ai
  - engineering
  - pipeline
  - mlops
  - specifications
---

## Что такое AI Engineering

**AI Engineering** — дисциплина на стыке Software Engineering и Machine Learning, фокусирующаяся на построении production-ready AI-систем. В отличие от ML Research, здесь акцент на интеграции, масштабировании и поддержке AI-решений.

![[_canvas/ai-engineering-overview.canvas]]

---

## Пайплайн работы с AI

### Общая схема

![[_canvas/ai-pipeline.canvas]]

### Этапы детально

#### 1. Анализ требований

| Артефакт | Содержание |
|----------|------------|
| **PRD** (Product Requirements) | Бизнес-цели, пользовательские сценарии |
| **User Stories** | Конкретные кейсы использования |
| **Success Metrics** | KPI, метрики успеха |
| **Constraints** | Ограничения (latency, cost, compliance) |

#### 2. Дизайн AI-решения

- Выбор подхода: fine-tuning vs RAG vs prompting
- Архитектура системы
- Выбор моделей и провайдеров
- Планирование интеграций

#### 3. Build (Разработка)

- Реализация компонентов
- Prompt engineering
- Тестирование (unit, integration, eval)
- Документация

#### 4. Deploy (Релиз)

- CI/CD pipeline
- Feature flags
- Canary/Blue-green deployment
- Rollback стратегия

#### 5. Monitor (Мониторинг)

- Метрики качества (accuracy, latency)
- Логирование запросов/ответов
- Алерты на деградацию
- A/B тестирование

---

## Создание спецификаций для AI-проектов

### Структура спецификации

```markdown
# Спецификация: [Название фичи]

## 1. Обзор
- Краткое описание
- Бизнес-цель
- Целевая аудитория

## 2. Требования
### Функциональные
- FR-001: [Описание]
- FR-002: [Описание]

### Нефункциональные
- NFR-001: Latency < 500ms p95
- NFR-002: Availability 99.9%

## 3. User Stories
- US-001: Как [роль], я хочу [действие], чтобы [результат]

## 4. Архитектура
- Диаграмма компонентов
- Выбор технологий
- Интеграции

## 5. API Contract
- Endpoints
- Request/Response схемы
- Коды ошибок

## 6. Тест-план
- Unit tests
- Integration tests
- E2E scenarios

## 7. Rollout план
- Этапы раскатки
- Метрики успеха
- Критерии отката
```

### Пример спецификации

```markdown
# Спецификация: AI-ассистент для код-ревью

## 1. Обзор
Автоматический анализ Pull Request с выявлением проблем
безопасности, производительности и code style.

## 2. Требования

### Функциональные
- FR-001: Анализ diff в PR на наличие уязвимостей
- FR-002: Проверка соответствия code style
- FR-003: Генерация комментариев с рекомендациями
- FR-004: Интеграция с GitHub/GitLab

### Нефункциональные
- NFR-001: Время анализа < 60 секунд для PR до 500 строк
- NFR-002: False positive rate < 10%
- NFR-003: Поддержка языков: TypeScript, Python, Go

## 3. User Stories
- US-001: Как разработчик, я хочу получать автоматические
  комментарии к PR, чтобы быстрее находить проблемы
- US-002: Как тимлид, я хочу видеть метрики качества PR,
  чтобы отслеживать прогресс команды

## 4. Архитектура
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───►│  Webhook    │───►│  Analyzer   │
│   Webhook   │    │  Handler    │    │  Service    │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                   ┌─────────────┐    ┌──────▼──────┐
                   │   GitHub    │◄───│   LLM API   │
                   │   Comments  │    │  (Claude)   │
                   └─────────────┘    └─────────────┘
```

---

## Последовательность разработки AI-проекта

### Фаза 0: Discovery (1-2 недели)

```
┌─────────────────────────────────────────────────────┐
│  1. Сбор требований                                 │
│     - Интервью со стейкхолдерами                    │
│     - Анализ существующих процессов                 │
│     - Определение success criteria                  │
│                                                     │
│  2. Feasibility study                               │
│     - Оценка технической возможности                │
│     - Proof of Concept                              │
│     - Оценка затрат (tokens, infra)                 │
│                                                     │
│  3. Документация                                    │
│     - PRD                                           │
│     - Technical Design Doc                          │
│     - Risk assessment                               │
└─────────────────────────────────────────────────────┘
```

### Фаза 1: Foundation (2-3 недели)

| Задача | Описание |
|--------|----------|
| Инфраструктура | Настройка окружений (dev, staging, prod) |
| CI/CD | Пайплайны сборки и деплоя |
| Observability | Логирование, метрики, трейсинг |
| SDK интеграция | Подключение LLM API |

### Фаза 2: Core Development (4-8 недель)

```
Week 1-2: MVP
├── Базовый prompt
├── Минимальная интеграция
└── Smoke tests

Week 3-4: Iteration 1
├── Улучшение prompt
├── Обработка edge cases
└── Unit tests

Week 5-6: Iteration 2
├── RAG интеграция (если нужно)
├── Кэширование
└── Integration tests

Week 7-8: Polish
├── Оптимизация
├── E2E tests
└── Документация
```

### Фаза 3: Hardening (2-3 недели)

- Security review
- Performance testing
- Load testing
- Chaos engineering

### Фаза 4: Rollout (1-2 недели)

```
Day 1-3: Internal testing
   └── Dogfooding

Day 4-7: Beta
   └── 5% пользователей
   └── Мониторинг метрик

Day 8-10: Gradual rollout
   └── 25% → 50% → 100%
   └── Готовность к откату
```

---

## Интеграция AI в разработку

### Уровни интеграции

```
Level 0: Manual
└── Копирование в ChatGPT

Level 1: IDE Integration
└── Copilot, Tabnine
└── Autocomplete, inline suggestions

Level 2: CLI Agents
└── Claude Code, Codex
└── Автономное выполнение задач

Level 3: CI/CD Integration
└── Automated code review
└── Test generation
└── Documentation updates

Level 4: Full Automation
└── Autonomous agents
└── Self-healing systems
└── Continuous optimization
```

### Практики интеграции

#### CLAUDE.md / AGENTS.md

Файлы конфигурации для AI-агентов в репозитории:

```markdown
# CLAUDE.md

## Project Overview
Краткое описание проекта и архитектуры.

## Commands
- `npm run dev` - запуск dev-сервера
- `npm test` - запуск тестов

## Architecture
- `src/` - исходный код
- `tests/` - тесты
- `docs/` - документация

## Conventions
- Использовать TypeScript strict mode
- Тесты обязательны для публичных API
- Документировать сложную логику
```

#### Prompt Files

Структурированные промпты для повторяющихся задач:

```markdown
# prompts/feature-implementation.md

## Context
Проект: {{project_name}}
Технологии: {{tech_stack}}

## Task
Реализовать функциональность: {{feature_description}}

## Requirements
1. Следовать архитектурным принципам из docs/architecture.md
2. Покрыть код тестами
3. Обновить CHANGELOG.md

## Constraints
- Не изменять публичные API без согласования
- Использовать существующие утилиты из src/utils/
```

---

## Современные инструменты и практики

### RAG (Retrieval-Augmented Generation)

Подход к обогащению контекста LLM внешними данными.

![[_canvas/rag-architecture.canvas]]

**Компоненты RAG:**

| Компонент | Инструменты |
|-----------|-------------|
| Vector DB | Pinecone, Weaviate, Chroma, pgvector |
| Embeddings | OpenAI ada-002, Cohere, Sentence Transformers |
| Retriever | LangChain, LlamaIndex |
| Chunking | Semantic chunking, sliding window |

### Prompt Engineering

Техники оптимизации промптов:

| Техника | Описание |
|---------|----------|
| **Zero-shot** | Прямой запрос без примеров |
| **Few-shot** | Примеры в промпте |
| **Chain-of-Thought** | Пошаговое рассуждение |
| **Self-consistency** | Множественная генерация + голосование |
| **ReAct** | Reasoning + Acting |

### Eval & Testing

```python
# Пример eval pipeline
from promptfoo import Eval

eval = Eval(
    prompts=["prompts/v1.txt", "prompts/v2.txt"],
    providers=["openai:gpt-4", "anthropic:claude-3"],
    tests=[
        {"input": "...", "expected": "..."},
        {"input": "...", "assert": {"type": "contains", "value": "..."}}
    ]
)

results = eval.run()
```

**Инструменты:**
- promptfoo
- LangSmith
- Weights & Biases
- Braintrust

### Cost Optimization

| Стратегия | Описание |
|-----------|----------|
| **Caching** | Кэширование частых запросов |
| **Model routing** | Дешёвые модели для простых задач |
| **Prompt compression** | Сжатие длинных контекстов |
| **Batching** | Группировка запросов |

---

## AI-first Development Workflow

### С использованием Spec Kit

[[AI Instruments#Spec Kit|Spec Kit]] предоставляет структурированный процесс:

```
Specify → Plan → Tasks → Implement

1. /speckit.constitution  — базовые принципы
2. /speckit.specify       — детальная спецификация
3. /speckit.plan          — архитектурный план
4. /speckit.tasks         — декомпозиция на задачи
5. /speckit.implement     — реализация
```

### С использованием Beads

[[AI Instruments#Beads|Beads]] для трекинга задач агентами:

```bash
# Инициализация
bd init

# Создание задач из спецификации
bd create "Implement user authentication"
bd create "Add rate limiting"

# Выполнение
bd ready           # Показать доступные задачи
bd start <id>      # Взять задачу в работу
bd close <id>      # Закрыть задачу
```

---

## Best Practices

### Документация

1. **CLAUDE.md** — контекст проекта для AI-агентов
2. **Architecture Decision Records (ADR)** — обоснование решений
3. **API Documentation** — OpenAPI/Swagger
4. **Runbooks** — инструкции по операциям

### Безопасность

- Никогда не передавать секреты в промптах
- Валидация и санитизация входных данных
- Rate limiting для API
- Audit logging

### Качество

- Eval pipelines для регрессий
- A/B тестирование промптов
- Мониторинг качества ответов
- Feedback loops от пользователей

---

## Ссылки

- [[AI Agent|AI Agents]]
- [[AI Instruments|AI Instruments]]
- [[AI#RAG|RAG]]
- [LangChain Documentation](https://python.langchain.com/)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [OpenAI Cookbook](https://cookbook.openai.com/)
