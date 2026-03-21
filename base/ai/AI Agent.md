---
tags:
  - ai
  - agent
  - llm
  - orchestration
  - automation
---

## Что такое AI-агент

**AI-агент** — это автономная система на базе LLM, способная самостоятельно планировать и выполнять задачи, используя инструменты и внешние источники данных. В отличие от простого чат-бота, агент может:

- Разбивать сложную задачу на подзадачи
- Выбирать и использовать инструменты (API, базы данных, файловую систему)
- Принимать решения на основе промежуточных результатов
- Итеративно улучшать результат

### Ключевые компоненты агента

```
┌─────────────────────────────────────────────────────┐
│                    AI Agent                         │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   LLM    │  │  Memory  │  │     Tools        │  │
│  │  (Brain) │  │ (Context)│  │ (Capabilities)   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                      │                              │
│              ┌───────▼───────┐                     │
│              │   Planner     │                     │
│              │  (Reasoning)  │                     │
│              └───────────────┘                     │
└─────────────────────────────────────────────────────┘
```

| Компонент | Назначение |
|-----------|------------|
| **LLM** | Ядро агента, отвечает за понимание задачи и генерацию решений |
| **Memory** | Хранение контекста, истории действий, долгосрочная память |
| **Tools** | Внешние инструменты: API, поиск, выполнение кода, файловые операции |
| **Planner** | Модуль планирования: разбиение задач, выбор стратегии |

---

## Типы AI-агентов

### По уровню автономности

| Тип | Описание | Пример |
|-----|----------|--------|
| **Reactive** | Реагирует на запросы, не планирует | Чат-бот с RAG |
| **Deliberative** | Планирует перед действием | Claude Code в plan mode |
| **Autonomous** | Полностью автономное выполнение | AutoGPT, Devin |

### По архитектуре

- **Single Agent** — один агент выполняет все задачи
- **Multi-Agent** — команда специализированных агентов с разными ролями
- **Hierarchical** — иерархия агентов с менеджером и исполнителями

---

## Архитектуры мульти-агентных систем

### Supervisor (Менеджер)

```
                ┌─────────────┐
                │  Supervisor │
                │   (Manager) │
                └──────┬──────┘
           ┌──────────┼──────────┐
           ▼          ▼          ▼
      ┌────────┐ ┌────────┐ ┌────────┐
      │Agent 1 │ │Agent 2 │ │Agent 3 │
      │(Coder) │ │(Tester)│ │(Docs)  │
      └────────┘ └────────┘ └────────┘
```

Supervisor распределяет задачи между агентами и агрегирует результаты.

**Применение:** Сложные проекты с чётким разделением ответственности.

### Peer-to-Peer (Равноправные)

```
      ┌────────┐     ┌────────┐
      │Agent 1 │◄───►│Agent 2 │
      └────┬───┘     └───┬────┘
           │             │
           └──────┬──────┘
                  ▼
             ┌────────┐
             │Agent 3 │
             └────────┘
```

Агенты общаются напрямую без центрального координатора.

**Применение:** Brainstorming, дебаты, коллективное решение.

### Pipeline (Конвейер)

```
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│Analyst │───►│Designer│───►│ Coder  │───►│Reviewer│
└────────┘    └────────┘    └────────┘    └────────┘
```

Последовательная передача задачи между специализированными агентами.

**Применение:** Процессы с чёткими этапами (SDLC).

---

## Организация команды агентов

### Роли в команде

| Роль | Обязанности | Инструменты |
|------|-------------|-------------|
| **Project Manager** | Планирование, декомпозиция задач | Beads, Jira API |
| **Architect** | Проектирование системы, ревью решений | Read, Analyze |
| **Developer** | Написание кода | Edit, Write, Bash |
| **Reviewer** | Код-ревью, проверка качества | Read, Grep |
| **Tester** | Написание и запуск тестов | Bash, Test frameworks |
| **DevOps** | CI/CD, деплой | Docker, K8s, GitHub Actions |

### Пример конфигурации команды

```yaml
# .claude/agents/team.yaml
agents:
  - name: architect
    role: "Solution Architect"
    capabilities:
      - read_code
      - analyze_architecture
      - create_diagrams
    restrictions:
      - no_code_changes
      - name
    role: "Senior Developer"
    capabilities:
      - read_code
      - write_code
      - run_tests
    guidelines:
      - "Follow SOLID principles"
      - "Write unit tests for new code"

  - name: reviewer
    role: "Code Reviewer"
    capabilities:
      - read_code
      - add_comments
    restrictions:
      - no_code_changes
    focus:
      - security
      - performance
      - maintainability
```

---

## Фреймворки для построения агентов

### LangChain / LangGraph

Популярный фреймворк для создания LLM-приложений и агентов.

```python
from langgraph.graph import StateGraph
from langchain_openai import ChatOpenAI

# Определение состояния
class AgentState(TypedDict):
    messages: list
    next_step: str

# Создание графа
workflow = StateGraph(AgentState)
workflow.add_node("planner", planner_node)
workflow.add_node("executor", executor_node)
workflow.add_edge("planner", "executor")
```

**Особенности:**
- Граф состояний для сложной логики
- Встроенная поддержка инструментов
- Память и персистентность

### CrewAI

Фреймворк для создания команд AI-агентов.

```python
from crewai import Agent, Task, Crew

# Определение агентов
researcher = Agent(
    role="Researcher",
    goal="Find relevant information",
    backstory="Expert in data analysis",
    tools=[search_tool, read_tool]
)

writer = Agent(
    role="Writer",
    goal="Create high-quality content",
    backstory="Professional technical writer"
)

# Создание задач
research_task = Task(
    description="Research the topic",
    agent=researcher
)

# Формирование команды
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential
)
```

### AutoGen (Microsoft)

Фреймворк для conversational AI-агентов.

```python
from autogen import AssistantAgent, UserProxyAgent

assistant = AssistantAgent(
    name="assistant",
    llm_config={"model": "gpt-4"}
)

user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "coding"}
)

user_proxy.initiate_chat(
    assistant,
    message="Create a Python script for data analysis"
)
```

---

## Claude Code как агентная система

[[AI Instruments#Claude|Claude Code]] — это CLI-агент от Anthropic с продвинутыми возможностями.

### Архитектура Claude Code

```
┌─────────────────────────────────────────┐
│              Claude Code                │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   Claude    │  │   Tool System   │  │
│  │   (Opus/    │  │  - Bash         │  │
│  │   Sonnet)   │  │  - Read/Write   │  │
│  └─────────────┘  │  - Edit         │  │
│         │         │  - Grep/Glob    │  │
│         ▼         └─────────────────┘  │
│  ┌─────────────┐                       │
│  │  Subagents  │  ┌─────────────────┐  │
│  │  - Explore  │  │     Memory      │  │
│  │  - Plan     │  │  - CLAUDE.md    │  │
│  │  - Custom   │  │  - .claude/     │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

### Режимы работы

| Режим | Описание | Применение |
|-------|----------|------------|
| **Code** | Прямое выполнение задач | Небольшие изменения |
| **Plan** | Планирование перед выполнением | Сложные фичи |
| **Agent** | Делегирование субагентам | Параллельные задачи |

### Субагенты Claude Code

Субагенты — это специализированные экземпляры Claude с ограниченным контекстом.

```bash
# Встроенные субагенты
- Explore: исследование кодовой базы
- Plan: создание планов реализации
- Bash: выполнение команд

# Кастомные субагенты
claude /config  # → Agents → Create
```

**Конфигурация субагента:**

```markdown
# .claude/agents/security-reviewer.md

## Role
Security Code Reviewer

## Instructions
- Analyze code for security vulnerabilities
- Check for OWASP Top 10 issues
- Report findings with severity levels

## Capabilities
- Read files
- Search code (Grep, Glob)

## Restrictions
- No code modifications
- No command execution
```

---

## Паттерны оркестрации агентов

### ReAct (Reasoning + Acting)

Агент чередует размышления (reasoning) и действия (acting).

```
Thought: Нужно найти файл с определением API
Action: Grep("api.*endpoint")
Observation: Найден файл src/api/routes.ts
Thought: Теперь нужно прочитать его содержимое
Action: Read("src/api/routes.ts")
...
```

### Plan-and-Execute

Сначала создаётся полный план, затем последовательное выполнение.

```
1. PLAN:
   - [ ] Изучить текущую архитектуру
   - [ ] Создать новый модуль
   - [ ] Написать тесты
   - [ ] Обновить документацию

2. EXECUTE:
   [Последовательное выполнение шагов]
```

### Reflexion

Агент анализирует свои ошибки и корректирует поведение.

```
Attempt 1: Код не компилируется
Reflection: Забыл импортировать модуль
Attempt 2: Тесты падают
Reflection: Неправильная логика в условии
Attempt 3: Success
```

---

## Best Practices

### Проектирование агентов

1. **Чёткие роли** — каждый агент должен иметь ясную специализацию
2. **Минимальные права** — давать только необходимые инструменты
3. **Явные инструкции** — детальное описание ожидаемого поведения
4. **Guardrails** — ограничения для предотвращения нежелательных действий

### Отладка агентов

```bash
# Включить verbose mode в Claude Code
claude --verbose

# Просмотр логов
cat ~/.claude/logs/latest.log

# Трассировка действий
bd trace <task-id>
```

### Мониторинг

- Логирование всех действий агентов
- Метрики: время выполнения, количество итераций, использование токенов
- Алерты на аномальное поведение

---

## Ссылки

- [[AI Instruments#Claude|Claude Code]]
- [[AI Instruments#Beads|Beads Task Tracker]]
- [[AI Engineering|AI Engineering Pipeline]]
- [LangChain Documentation](https://python.langchain.com/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [AutoGen Documentation](https://microsoft.github.io/autogen/)
