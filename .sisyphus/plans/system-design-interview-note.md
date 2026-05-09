# System Design Interview — Методичка по прохождению

## TL;DR

> **Quick Summary**: Создать в `base/interview/system-design.md` структурированное руководство по прохождению System Design интервью: фреймворк шагов, коммуникационные паттерны, разборы 2-3 реальных кейсов (WhatsApp + ещё), инфраструктурный реализм (стойки, диски, RBAC, Network Policy). Ссылки на существующую базу через стандартный markdown.
> 
> **Deliverables**:
> - `base/interview/system-design.md` — готовая заметка (~1500-2500 строк)
> - Все перекрёстные ссылки на существующие заметки верифицированы
> 
> **Estimated Effort**: Large (10 задач, ~4-6 часов работы)
> **Parallel Execution**: YES — 2 waves + final verification
> **Critical Path**: Task 1 → Task 3 → Task 5 → Task 8 → Final Verification

---

## Context

### Original Request
Пользователь хочет заметку по прохождению System Design интервью на базе существующих материалов. Заметка должна покрывать: процесс интервью, технические концепты, разборы кейсов, инфраструктурные детали (RBAC, Network Policy, стойки с дисками). Стиль: DDIA + Alex Xu.

### Interview Summary
**Key Discussions**:
- **Формат**: Методичка по процессу, а не 50-вопросный Q&A (осознанный отход от паттерна javascript.md/react.md/web.md)
- **Фокус**: Процесс + технические концепты + walkthrough кейсов + инфраструктурный слой
- **Ссылки**: Стандартный markdown `[текст](путь.md)`, не wikilinks
- **Стиль**: DDIA (Kleppmann) + System Design Interview (Alex Xu) — методологичный, с фокусом на trade-off'ы
- **Инфраструктура**: Реальные цифры по дискам, стойкам, Network Policy, RBAC — детали, которых нет в существующих заметках

**Research Findings**:
- System Design.md (~2400 строк): Исчерпывающая техническая база. Содержит раздел «Этапы проектирования» — **не дублировать**, а ссылаться
- ДЗ.md: WhatsApp design exercise с конкретными требованиями (200M DAU, 10 msg/день, кросс-девайс синхронизация) — отличный кандидат для walkthrough
- `base/devops/`: Сети (2038 строк), Хранение, Доступ/права, K8s Entities (NetworkPolicy, RBAC), service-mesh, database-ops — богатая база для инфраструктурного слоя
- Существующие интервью-заметки: tags → intro → numbered Q&A. Новая заметка будет narrative-методичкой, а не Q&A

### Metis Review
**Identified Gaps** (addressed):
- **Пересечение с System Design.md**: Заметка НЕ переобъясняет дизайн-методологию. Фокусируется на *интервью-процессе*: что спрашивать, как презентовать, критерии оценки интервьювера, тайминг 45-60 минут, коммуникационные паттерны
- **Формат vs существующие**: Осознанный отход от Q&A в пользу narrative-методички — так и задумано
- **Формат ссылок**: Стандартный markdown, не wikilinks — соответствует System Design.md и явному запросу пользователя

---

## Work Objectives

### Core Objective
Создать готовую к использованию заметку `base/interview/system-design.md` — структурированное руководство по прохождению System Design интервью, опирающееся на существующую базу знаний и добавляющее процессные/инфраструктурные детали.

### Concrete Deliverables
- `base/interview/system-design.md` — финальная заметка

### Definition of Done
- [ ] Заметка существует в `base/interview/system-design.md`
- [ ] Все markdown-ссылки на существующие заметки валидны (файлы существуют)
- [ ] Заметка проходит `npx quartz build -d base` без ошибок
- [ ] Контент покрывает: процесс интервью, 2-3 walkthrough, инфраструктурный слой, ссылки на базу
- [ ] Нет дублирования контента из System Design.md (только ссылки)

### Must Have
- Фреймворк прохождения: пошаговая структура 45-60 минутного интервью
- Коммуникационные паттерны: что спрашивать у интервьювера на каждом шаге
- Разбор WhatsApp (из ДЗ.md) как полноценный walkthrough с dialogue-примерами
- Инфраструктурный реализм: цифры по дискам (8TB SSD, 20TB HDD), стойки (40U, ~20-40 дисков), Network Policy, RBAC-модели
- Ссылки на существующие заметки через markdown `[текст](путь.md)`
- Чек-лист подготовки и список типичных ошибок

### Must NOT Have (Guardrails)
- **НЕ дублировать** техническую методологию из System Design.md (этапы проектирования, критерии ИС)
- **НЕ использовать** wikilinks — только стандартный markdown
- **НЕ делать** 50-вопросный Q&A формат — это narrative-методичка
- **НЕ копировать** готовые дизайны из Alex Xu/Grokking — адаптировать и добавлять инфраструктурные детали
- **НЕ углубляться** в детали фронтенда (по ДЗ.md: «фронтенд проектировать не нужно»)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Quartz build, markdown lint)
- **Automated tests**: None (content note)
- **Agent-Executed QA**: Mandatory for all tasks

### QA Policy
- **Content validity**: Agent verifies markdown syntax, link validity, Quartz build
- **Cross-reference check**: Every `[text](path.md)` link resolves to an existing file
- **Anti-duplication check**: No substantial content overlap with System Design.md methodology section

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — research + outline):
├── Task 1: Research DDIA/Alex Xu structure + gather infra specs [deep]
├── Task 2: Outline walkthrough examples [quick]

Wave 2 (After Wave 1 — content writing, MAX PARALLEL):
├── Task 3: Write interview framework (process + communication) [writing]
├── Task 4: Write WhatsApp walkthrough [writing]
├── Task 5: Write infrastructure realism section [writing]
├── Task 6: Write second walkthrough (choose: URL Shortener or Chat) [writing]
├── Task 7: Write preparation checklist + common mistakes [writing]

Wave 3 (After Wave 2 — integration, SEQUENTIAL):
├── Task 8: Write intro, conclusion, and cross-reference integration [writing]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Verify links + Quartz build [quick]
├── Task F2: Anti-duplication audit vs System Design.md [quick]
```

**Critical Path**: Task 1 → Task 3 → Task 8 → F1 → F2
**Parallel Speedup**: Wave 2 writes 5 sections in parallel (Tasks 3-7), ~60% faster than sequential
**Max Concurrent**: 5 (Wave 2)

### Dependency Matrix

- **1 (Research)**: None — 3, 4, 5, 6, 7 (Wave 1 → Wave 2)
- **2 (Outline)**: None — 4, 6 (Wave 1 → Wave 2)
- **3 (Framework)**: 1 — 8
- **4 (WhatsApp)**: 1, 2 — 8
- **5 (Infrastructure)**: 1 — 8
- **6 (Walkthrough 2)**: 1, 2 — 8
- **7 (Checklist)**: 1 — 8
- **8 (Integration)**: 3, 4, 5, 6, 7 — F1, F2
- **F1 (Links)**: 8 — None
- **F2 (Audit)**: 8 — None

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `deep` (research), T2 → `quick` (outline)
- **Wave 2**: **5** — T3 → `writing`, T4 → `writing`, T5 → `writing`, T6 → `writing`, T7 → `writing`
- **Sequential**: **1** — T8 → `writing` (integration)
- **FINAL**: **2** — F1 → `quick`, F2 → `quick`

---

## TODOs

- [x] 1. **Research: структура DDIA/Alex Xu + сбор инфраструктурных спецификаций**

  **What to do**:
  - Изучить структуру System Design Interview (Alex Xu) — как организованы walkthrough главы (Requirements → Estimation → High-Level Design → Deep Dive → Wrap-up)
  - Изучить DDIA (Kleppmann) часть I (Foundations) на предмет структуры глав о надёжности, масштабируемости, maintainability
  - Собрать реальные спецификации: размеры дисков (SSD 1-8TB, HDD 8-20TB), стойки (стандарт 42U, typical 20-40 дисков на стойку), latency-цифры между датацентрами (<1ms same DC, 5-20ms same region, 50-200ms cross-continent)
  - Собрать информацию по Network Policy (K8s NetworkPolicy, AWS Security Groups) и RBAC (K8s RBAC, IAM roles)
  - Задокументировать найденную структуру и цифры в ответе задачи для использования в Task 3-7

  **Must NOT do**:
  - Не копировать контент из книг дословно — только структуру и цифры
  - Не углубляться в детали, не нужные для интервью (например, специфику BGP-роутинга)

  **Recommended Agent Profile**:
  > Research-heavy task: external resources + synthesis
  - **Category**: `deep`
    - Reason: Requires autonomous research across multiple sources and synthesis into structured output
  - **Skills**: [`research`]
    - `research`: Domain-appropriate for deep multi-source investigation and structured output

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 3, 4, 5, 6, 7 (все разделы зависят от структуры и цифр)
  - **Blocked By**: None

  **References**:
  - `base/architecture/System Design/System Design.md` — существующая методология (чтобы знать, что НЕ дублировать)
  - `base/architecture/System Design/ДЗ.md` — требования WhatsApp для walkthrough
  - `base/devops/networks.md` — существующая база по сетям (latency, топологии)
  - `base/devops/linux/os/_lessons/Хранение.md` — существующая база по хранению
  - `base/devops/kubernetes/Kubernetes Entities.md` — K8s NetworkPolicy, RBAC entities

  **Acceptance Criteria**:
  - [ ] Структура глав Alex Xu задокументирована (5 фаз walkthrough)
  - [ ] Таблица инфраструктурных спецификаций собрана (диски, стойки, latency, пропускная способность)
  - [ ] Модели RBAC и Network Policy описаны на уровне детализации для SD-интервью

  **QA Scenarios**:

  ```
  Scenario: Research output is complete and usable
    Tool: Bash (read output file)
    Preconditions: Task agent has documented findings
    Steps:
      1. Verify structure documentation includes all 5 Alex Xu phases
      2. Verify specs table has at minimum: disk sizes (SSD/HDD), rack config, DC latency ranges
      3. Verify RBAC/NetworkPolicy descriptions are at SD-interview level (not K8s YAML deep-dive)
    Expected Result: All three deliverables present and at appropriate detail level
    Failure Indicators: Missing phases, missing spec categories, overly technical RBAC details
    Evidence: .sisyphus/evidence/task-1-research-specs.md
  ```

  **Evidence to Capture**:
  - [ ] Research findings documented in evidence file

  **Commit**: NO (research only, used by downstream tasks)

- [x] 2. **Outline: структура walkthrough-примеров**

  **What to do**:
  - На основе структуры из Task 1, создать подробный outline для 2 walkthrough:
    1. **WhatsApp** (из ДЗ.md) — основной, детальный разбор
    2. **URL Shortener** или **Chat System** — второй, более компактный пример
  - Для каждого walkthrough определить: ключевые вопросы интервьюверу на каждом шаге, ожидаемые диалоговые паттерны, места для инфраструктурных вставок
  - Определить, где и как вставлять ссылки на существующие заметки
  - Согласовать outline с Task 1 (структура глав Alex Xu)

  **Must NOT do**:
  - Не писать полный контент walkthrough — только outline/план разделов
  - Не добавлять третий walkthrough без явной необходимости (scope control)

  **Recommended Agent Profile**:
  > Structural planning — lightweight task
  - **Category**: `quick`
    - Reason: Outline creation based on existing templates, single deliverable
  - **Skills**: []
    - No specialized skills needed — structural planning with existing references

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 4, 6 (walkthrough writing depends on outline)
  - **Blocked By**: None (can outline before full research, then refine)

  **References**:
  - `base/architecture/System Design/ДЗ.md` — полные требования WhatsApp (200M DAU, latency, cross-device sync)
  - `base/architecture/System Design/System Design.md` — техническая база для ссылок

  **Acceptance Criteria**:
  - [ ] Outline для WhatsApp walkthrough: 5 фаз (Requirements → Estimation → HLD → Deep Dive → Wrap-up)
  - [ ] Outline для второго walkthrough: те же 5 фаз, компактнее
  - [ ] Для каждой фазы указаны: вопросы интервьюверу, ожидаемые ответы, места для инфраструктурных деталей
  - [ ] Определены точки вставки ссылок на существующие заметки (минимум 3 на walkthrough)

  **QA Scenarios**:

  ```
  Scenario: Outline covers all required phases
    Tool: Bash (read output file)
    Preconditions: Task agent has created outline document
    Steps:
      1. Verify WhatsApp outline has exactly 5 phases matching Alex Xu structure
      2. Verify second walkthrough outline has 5 phases
      3. Verify each phase lists interviewer questions (minimum 2 per phase)
      4. Verify infrastructure insertion points are marked (minimum 2 per walkthrough)
    Expected Result: Two complete outlines with all required elements
    Failure Indicators: Missing phases, no interviewer questions, no infra markers
    Evidence: .sisyphus/evidence/task-2-walkthrough-outline.md
  ```

  **Evidence to Capture**:
  - [ ] Walkthrough outlines documented in evidence file

  **Commit**: NO (outline only, used by downstream tasks)

- [ ] 3. **Write: Фреймворк прохождения интервью**

  **What to do**:
  - Написать раздел «Структура System Design интервью» — сердце заметки
  - Покрыть:
    - **Что оценивает интервьювер**: не «знание технологий», а умение определять требования, делать trade-off'ы, коммуницировать, структурировать мышление
    - **Тайминг 45-60 минут**: разбивка по фазам с процентами времени
    - **Пошаговый фреймворк**: что делать на каждой фазе, что спрашивать, что рисовать на доске
    - **Коммуникационные паттерны**: как говорить о trade-off'ах, как признавать пробелы в знаниях, как «thinking out loud»
    - **Типичные ловушки**: over-engineering, premature optimization, молчаливое рисование, игнорирование требований
  - Использовать таблицы для фаз/тайминга и callouts для ключевых правил
  - Сослаться на [System Design.md](base/architecture/System%20Design/System%20Design.md) для технических деталей нефункциональных требований

  **Must NOT do**:
  - НЕ переобъяснять «Основные критерии ИС» (надёжность, масштабируемость, etc.) — на них только сослаться
  - НЕ углубляться в конкретные технологии на этом этапе

  **Recommended Agent Profile**:
  > Process/methodology writing with technical accuracy
  - **Category**: `writing`
    - Reason: Structured methodology guide requiring clear prose, tables, and instructional tone
  - **Skills**: [`knowledge-writer`]
    - `knowledge-writer`: Project-specific skill for writing Obsidian knowledge base notes with proper formatting

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5, 6, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8 (integration)
  - **Blocked By**: Task 1 (структура)

  **References**:
  - Task 1 research output — структура глав Alex Xu, критерии оценки интервьювера
  - `base/architecture/System Design/System Design.md#Основные критерии ИС` — НФТ (ссылаться, не дублировать)
  - `base/interview/javascript.md:1-8` — пример формата введения в существующих заметках
  - `base/interview/react.md:1-8` — ещё один пример формата введения

  **Acceptance Criteria**:
  - [ ] Раздел «Что оценивает интервьювер» написан (не «знания», а «процесс»)
  - [ ] Таблица тайминга: 5 фаз с процентами времени (Requirements ~20%, Estimation ~10%, HLD ~30%, Deep Dive ~30%, Wrap-up ~10%)
  - [ ] Каждая фаза: что делать + что спрашивать + что рисовать
  - [ ] Раздел коммуникационных паттернов (минимум 5 конкретных приёмов)
  - [ ] Раздел типичных ловушек (минимум 5 с примерами)
  - [ ] Минимум 2 ссылки на System Design.md
  - [ ] Использованы callouts (`> [!important]`, `> [!info]`) для ключевых правил

  **QA Scenarios**:

  ```
  Scenario: Framework section is complete and actionable
    Tool: Bash (read + grep)
    Preconditions: Section written in system-design.md
    Steps:
      1. grep "Что оценивает" — verify section exists with non-empty content
      2. grep "таблица\|тайминг\|фаза" — verify timing breakdown exists
      3. grep "коммуникац\|спрашивать\|thinking out loud" — verify communication patterns
      4. grep "ловуш\|ошибк\|anti-pattern" — verify pitfalls section
      5. Count callouts: grep -c "^> \[!" — verify at least 5 callouts
      6. Count cross-references: grep -c "\.\.\/" — verify at least 2 links to base
    Expected Result: All sections present, 5+ callouts, 2+ cross-references
    Failure Indicators: Missing sections, no callouts, no cross-references
    Evidence: .sisyphus/evidence/task-3-framework.md
  ```

  **Evidence to Capture**:
  - [ ] grep output showing section coverage
  - [ ] Count of callouts and cross-references

  **Commit**: NO (groups with Tasks 4-8 in Wave 2)

- [ ] 4. **Write: WhatsApp Walkthrough**

  **What to do**:
  - На основе outline из Task 2 и требований из ДЗ.md, написать полноценный walkthrough дизайна WhatsApp
  - Формат: narrative с dialogue-вставками (интервьювер → кандидат)
  - Покрыть все 5 фаз:
    1. **Requirements** (20%): Уточнение требований у интервьювера — DAU, media types, latency SLA, cross-device sync. Пример диалога.
    2. **Capacity Estimation** (10%): Расчёт traffic (200M × 10 msg × avg size), storage (текст + изображения 1MB × 3), bandwidth. Таблица с цифрами.
    3. **High-Level Design** (30%): Архитектурная диаграмма (словами + ASCII/структурой) — Chat Service, Message Queue, DB cluster, CDN для медиа, Push Notification service. Обоснование выбора WebSocket для real-time.
    4. **Deep Dive** (30%): Детальный разбор — схема БД (users, messages, chats, chat_members), шардирование по chat_id, кэширование последних сообщений, очередь сообщений (Kafka), хранение медиа (S3-compatible + CDN), cross-device sync (last_read_watermark), статусы онлайн (heartbeat + Redis TTL)
    5. **Wrap-up** (10%): Бутылочные горлышки, что можно улучшить при росте до 1B users
  - **Инфраструктурные вставки**: при обсуждении БД — типы дисков (SSD для горячих данных, HDD для архива), при обсуждении сервисов — Network Policy между ними, при обсуждении доступа — RBAC-модель
  - Ссылки: [System Design.md](/base/architecture/System%20Design/System%20Design.md) — разделы про WebSocket, шардирование, кэширование, очереди

  **Must NOT do**:
  - НЕ проектировать фронтенд (по ДЗ.md)
  - НЕ проектировать аутентификацию (по ДЗ.md)
  - НЕ рисовать диаграммы в формате изображений — только ASCII/структурное описание
  - НЕ углубляться в детали реализации push-уведомлений (APNs/FCM)

  **Recommended Agent Profile**:
  > Complex technical writing with system design depth — requires both writing skill and backend architecture knowledge
  - **Category**: `writing`
    - Reason: Long-form technical narrative with structured sections, tables, and dialogue
  - **Skills**: [`knowledge-writer`, `backend-dev`]
    - `knowledge-writer`: Obsidian formatting, callouts, tables, frontmatter
    - `backend-dev`: System design accuracy — database design, message queues, sharding, caching

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 5, 6, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8 (integration)
  - **Blocked By**: Tasks 1 (структура), 2 (outline)

  **References**:
  - `base/architecture/System Design/ДЗ.md` — полные требования WhatsApp
  - `base/architecture/System Design/System Design.md` — технические разделы для ссылок:
    - WebSocket и SSE (lines 412-439)
    - Шардирование (lines 2097-2188)
    - Кэширование (lines 606-920)
    - Брокеры сообщений (lines 1566-1653)
    - Репликация (lines 1743-1951)
  - `base/devops/database-ops.md` — практические аспекты эксплуатации БД
  - `base/devops/message-queues-ops.md` — практические аспекты Kafka/RMQ
  - Task 1 research — инфраструктурные цифры для estimation
  - Task 2 outline — структура walkthrough

  **Acceptance Criteria**:
  - [ ] Все 5 фаз покрыты (Requirements → Estimation → HLD → Deep Dive → Wrap-up)
  - [ ] Минимум 3 dialogue-вставки (интервьювер ↔ кандидат)
  - [ ] Capacity estimation с конкретными цифрами (traffic, storage, bandwidth)
  - [ ] High-level architecture description (минимум 6 компонентов)
  - [ ] Deep dive: схема БД (4+ таблицы), стратегия шардирования, кэширование, media storage, cross-device sync
  - [ ] Минимум 3 инфраструктурные вставки (диски, Network Policy, RBAC)
  - [ ] Минимум 5 ссылок на существующие заметки

  **QA Scenarios**:

  ```
  Scenario: WhatsApp walkthrough is complete and technically accurate
    Tool: Bash (read + grep)
    Preconditions: Section written in system-design.md
    Steps:
      1. grep "Requirements\|Требования" — verify phase 1 exists
      2. grep "Estimation\|Расчёт\|DAU\|bandwidth" — verify phase 2 with numbers
      3. grep "High-Level\|Архитектур\|компонент" — verify phase 3 with 6+ components
      4. grep "Deep Dive\|Детальн\|шардирован\|кэширован\|схема БД" — verify phase 4
      5. grep "Wrap-up\|Бутылочн\|улучшить\|1B" — verify phase 5
      6. grep "SSD\|HDD\|Network Policy\|RBAC\|стойк" — verify 3+ infra details
      7. grep "\.\./" — count cross-references (expect 5+)
    Expected Result: All 5 phases present, 3+ infra details, 5+ cross-references
    Failure Indicators: Missing phases, no numbers in estimation, no infra details, fewer than 5 links
    Evidence: .sisyphus/evidence/task-4-whatsapp-walkthrough.md
  ```

  **Evidence to Capture**:
  - [ ] grep verification output
  - [ ] Line count of WhatsApp section (expect 300-500 lines)

  **Commit**: NO (groups with Tasks 3-8 in Wave 2)

- [ ] 5. **Write: Инфраструктурный реализм**

  **What to do**:
  - Написать отдельный раздел (или врезки для walkthrough) о том, как система выглядит в реальной жизни
  - Покрыть:
    - **Физический уровень**: стойки (42U, типично 20-40 дисков на стойку), диски (SSD 1-8TB для горячих данных, HDD 8-20TB для холодных), RAM (256GB-2TB на сервер), CPU (типичные конфигурации)
    - **Сетевой уровень**: latency между компонентами (same DC <1ms, same region 5-20ms, cross-continent 50-200ms), пропускная способность (10Gbps/25Gbps/100Gbps на сервер), Network Policy (K8s NetworkPolicy — какие сервисы могут общаться)
    - **Access Control**: RBAC-модель (роли: admin, developer, viewer), IAM на уровне облака, принцип least privilege, примеры политик
    - **Стоимость**: примерные цифры стоимости инфраструктуры (сервер, диск, трафик) для реализма в обсуждении
  - Использовать таблицы для сравнения и callouts для ключевых цифр
  - Ссылки на: [networks.md](base/devops/networks.md), [Хранение.md](base/devops/linux/os/_lessons/Хранение.md), [Доступ и права.md](base/devops/linux/os/_lessons/Доступ%20и%20права.md), [Kubernetes Entities.md](base/devops/kubernetes/Kubernetes%20Entities.md)

  **Must NOT do**:
  - НЕ углубляться в конфигурацию конкретного железа (модели серверов, вендоры)
  - НЕ писать K8s YAML-манифесты — только концептуальное описание политик
  - НЕ делать раздел длиннее 200 строк — это supporting материал, не основной фокус

  **Recommended Agent Profile**:
  > Infrastructure writing with DevOps knowledge
  - **Category**: `writing`
    - Reason: Structured technical writing about infrastructure — tables, specs, comparisons
  - **Skills**: [`knowledge-writer`, `devops`]
    - `knowledge-writer`: Obsidian formatting for structured tech content
    - `devops`: Infrastructure domain knowledge — hardware specs, networking, K8s RBAC/NetworkPolicy

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4, 6, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8 (integration)
  - **Blocked By**: Task 1 (инфраструктурные цифры из research)

  **References**:
  - `base/devops/networks.md` — сетевая база (OSI, устройства, топологии, latency)
  - `base/devops/linux/os/_lessons/Хранение.md` — база по хранению (блочные устройства, разделы)
  - `base/devops/linux/os/_lessons/Доступ и права.md` — Linux permissions, users, groups
  - `base/devops/kubernetes/Kubernetes Entities.md` — K8s NetworkPolicy, RBAC
  - `base/devops/service-mesh.md` — service mesh (Istio, Linkerd) для mTLS
  - Task 1 research — собранные спецификации

  **Acceptance Criteria**:
  - [ ] Таблица физических спецификаций (диски, стойки, RAM, CPU) с конкретными цифрами
  - [ ] Таблица сетевых latency (same DC, same region, cross-continent, cross-continent with CDN)
  - [ ] Описание Network Policy на концептуальном уровне (какие сервисы общаются)
  - [ ] Описание RBAC-модели (роли, принцип least privilege)
  - [ ] Минимум 3 ссылки на devops-заметки
  - [ ] Не длиннее 200 строк

  **QA Scenarios**:

  ```
  Scenario: Infrastructure section has real, specific numbers
    Tool: Bash (read + grep)
    Preconditions: Section written in system-design.md
    Steps:
      1. grep "[0-9]\+TB\|[0-9]\+GB" — verify specific storage/RAM numbers
      2. grep "[0-9]\+ms\|latency\|задержк" — verify latency numbers
      3. grep "Network Policy\|RBAC\|least privilege" — verify access control concepts
      4. Verify line count is under 200 for the section
    Expected Result: Concrete numbers across all categories, access control described, under 200 lines
    Failure Indicators: Vague specs ("большие диски"), no latency numbers, no RBAC mention
    Evidence: .sisyphus/evidence/task-5-infrastructure.md
  ```

  **Evidence to Capture**:
  - [ ] grep output showing specific numbers
  - [ ] Line count verification

  **Commit**: NO (groups with Tasks 3-8 in Wave 2)

- [ ] 6. **Write: Второй walkthrough (URL Shortener или Chat System)**

  **What to do**:
  - На основе outline из Task 2, написать второй walkthrough — более компактный чем WhatsApp
  - Выбрать одну из двух тем (рекомендация: URL Shortener как контрастный пример — другая проблема, другие trade-off'ы)
  - Формат: narrative с dialogue-вставками, 5 фаз
  - Покрыть:
    - Requirements: функциональные (shorten URL, redirect, analytics) и нефункциональные (high availability > consistency, low latency redirects)
    - Capacity: read-heavy (100:1 read/write ratio), traffic estimation, storage for URL mappings
    - HLD: Load Balancer → Application Servers → Cache (Redis) → Database, Key Generation Service
    - Deep Dive: хэш-функция для генерации ключей (base62, collision handling), схема БД, кэширование популярных URL, rate limiting, очистка устаревших ссылок
    - Wrap-up: масштабирование, geo-distribution через CDN
  - Инфраструктурные вставки: при обсуждении кэша — in-memory vs dedicated Redis, при обсуждении БД — выбор между SQL и NoSQL для key-value нагрузки
  - Ссылки на соответствующие разделы System Design.md

  **Must NOT do**:
  - НЕ делать второй walkthrough таким же длинным как WhatsApp — цель ~200-300 строк (компактный)
  - НЕ выбирать тему, которая дублирует технические решения WhatsApp (нужен контраст)

  **Recommended Agent Profile**:
  > Technical writing for a compact design walkthrough
  - **Category**: `writing`
    - Reason: Compact technical walkthrough with different trade-offs than WhatsApp
  - **Skills**: [`knowledge-writer`]
    - `knowledge-writer`: Obsidian formatting

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4, 5, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8 (integration)
  - **Blocked By**: Tasks 1 (структура), 2 (outline)

  **References**:
  - Task 2 outline — структура второго walkthrough
  - `base/architecture/System Design/System Design.md`:
    - Кэширование (lines 606-920) — cache strategies, eviction
    - Виды баз данных (lines 926-1067) — Key-Value stores
    - CAP теорема (lines 1997-2065) — AP vs CP выбор
  - Task 1 research — цифры для estimation

  **Acceptance Criteria**:
  - [ ] Все 5 фаз покрыты (компактно)
  - [ ] Минимум 1 dialogue-вставка
  - [ ] Capacity estimation с конкретными цифрами
  - [ ] High-level architecture (5+ компонентов)
  - [ ] Deep dive: key generation, DB выбор, кэширование
  - [ ] Минимум 1 инфраструктурная вставка
  - [ ] Минимум 3 ссылки на существующие заметки
  - [ ] Длина секции: 200-300 строк

  **QA Scenarios**:

  ```
  Scenario: Second walkthrough is compact but complete
    Tool: Bash (read + grep)
    Preconditions: Section written in system-design.md
    Steps:
      1. Verify all 5 phases present (same check as Task 4 but compact)
      2. Verify at least 1 dialogue pattern
      3. Verify at least 3 cross-references to base
      4. Verify section line count between 200-300
    Expected Result: Complete compact walkthrough with different trade-offs than WhatsApp
    Failure Indicators: Missing phases, no dialogue, fewer than 3 links, outside 200-300 line range
    Evidence: .sisyphus/evidence/task-6-walkthrough-2.md
  ```

  **Evidence to Capture**:
  - [ ] grep verification output
  - [ ] Line count of second walkthrough section

  **Commit**: NO (groups with Tasks 3-8 in Wave 2)

- [ ] 7. **Write: Чек-лист подготовки + типичные ошибки**

  **What to do**:
  - Написать завершающий практический раздел заметки
  - **Чек-лист подготовки**:
    - Список тем для повторения (со ссылками на разделы System Design.md)
    - Список практических упражнений (спроектировать X, Y, Z)
    - Ресурсы для подготовки: DDIA, Alex Xu, Grokking, системные блоги (Netflix, Uber, Meta)
    - Практические советы: рисовать диаграммы заранее, тренироваться с таймером, записывать себя
  - **Типичные ошибки**:
    - Минимум 7 конкретных ошибок с примерами
    - Каждая: описание ошибки → почему это плохо → как правильно
    - Примеры: «сразу рисовать микросервисы не узнав требований», «игнорировать нефункциональные требования», «молча рисовать 10 минут без коммуникации», «выбирать технологию без обоснования trade-off'ов», «не считать capacity», «забывать про мониторинг и observability», «проектировать идеальную систему без компромиссов»
  - **Roadmap подготовки**: от новичка до уверенного прохождения (3 стадии: основы → практика → глубина)

  **Must NOT do**:
  - НЕ дублировать содержание System Design.md — только ссылки на разделы
  - НЕ рекомендовать платные курсы без оговорки «если бюджет позволяет»

  **Recommended Agent Profile**:
  > Structured advice writing — checklists, tips
  - **Category**: `writing`
    - Reason: Structured practical advice with checklists and categorized errors
  - **Skills**: [`knowledge-writer`]
    - `knowledge-writer`: Obsidian formatting for structured content

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4, 5, 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8 (integration)
  - **Blocked By**: Task 1 (общая структура)

  **References**:
  - `base/architecture/System Design/System Design.md` — все разделы для ссылок в чек-листе
  - `base/interview/javascript.md:1-8` — пример intro секции существующих заметок
  - Task 1 research — ресурсы (DDIA, Alex Xu)

  **Acceptance Criteria**:
  - [ ] Чек-лист тем для повторения (10+ пунктов с ссылками)
  - [ ] Список практических упражнений (5+ конкретных систем для проектирования)
  - [ ] 7+ типичных ошибок с форматом: ошибка → почему плохо → как правильно
  - [ ] Roadmap подготовки (3 стадии)
  - [ ] Минимум 8 ссылок на разделы System Design.md

  **QA Scenarios**:

  ```
  Scenario: Checklist section is practical and actionable
    Tool: Bash (read + grep)
    Preconditions: Section written in system-design.md
    Steps:
      1. grep "Чек-лист\|подготовк\|повторен" — verify checklist section exists
      2. grep "ошибк\|антипаттерн\|ловушк" — verify errors section with 7+ items
      3. grep "стади\|этап\|roadmap\|план подготовк" — verify roadmap exists
      4. Count cross-references: grep -c "\.\.\/" in the section (expect 8+)
    Expected Result: Checklist + errors + roadmap all present, 8+ cross-references
    Failure Indicators: Missing sections, fewer than 7 errors, fewer than 8 links
    Evidence: .sisyphus/evidence/task-7-checklist.md
  ```

  **Evidence to Capture**:
  - [ ] grep verification output
  - [ ] Count of errors listed

  **Commit**: NO (groups with Tasks 3-8 in Wave 2)

- [ ] 8. **Write: Введение, заключение, сборка и интеграция**

  **What to do**:
  - Написать введение заметки:
    - Что такое System Design интервью и чем оно отличается от coding/behavioral
    - Кому нужна эта заметка (Middle → Senior переход)
    - Как читать: последовательно или по частям
    - Структура заметки (оглавление)
  - Написать заключение: ключевые takeaways (3-5 пунктов), напутствие
  - **Интеграция всех секций**:
    - Собрать написанное в Tasks 3-7 в единый файл `base/interview/system-design.md`
    - Добавить frontmatter (tags: interview, systemdesign, architecture)
    - Обеспечить консистентность стиля между секциями (единые заголовки, форматирование)
    - Проверить, что все запланированные ссылки на месте
    - Добавить разделители (`---`) между крупными секциями
  - **Форматирование**: callouts для ключевых правил, таблицы для сравнений, code blocks для ASCII-диаграмм (если есть)

  **Must NOT do**:
  - НЕ менять содержание секций из Tasks 3-7 без необходимости (только стилистическая правка)
  - НЕ добавлять новые крупные секции без согласования

  **Recommended Agent Profile**:
  > Integration + polish — editorial work
  - **Category**: `writing`
    - Reason: Editorial integration of multiple sections, maintaining consistency
  - **Skills**: [`knowledge-writer`]
    - `knowledge-writer`: Obsidian formatting, frontmatter, cross-references

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all Wave 2 tasks)
  - **Parallel Group**: Sequential (after Tasks 3-7)
  - **Blocks**: Final Verification (F1, F2)
  - **Blocked By**: Tasks 3, 4, 5, 6, 7

  **References**:
  - All Task 3-7 outputs — content to integrate
  - `base/interview/javascript.md:1-11` — пример frontmatter и введения
  - `base/interview/react.md:1-11` — ещё один пример формата
  - `base/interview/web.md:1-14` — пример развёрнутого введения

  **Acceptance Criteria**:
  - [ ] Файл `base/interview/system-design.md` существует
  - [ ] Frontmatter с тегами: interview, systemdesign, architecture
  - [ ] Введение: что такое SD-интервью, для кого, как читать, оглавление
  - [ ] Заключение: 3-5 ключевых takeaways
  - [ ] Все секции из Tasks 3-7 интегрированы
  - [ ] Стиль консистентен между секциями
  - [ ] Все разделители и заголовки унифицированы

  **QA Scenarios**:

  ```
  Scenario: Note is assembled and well-formatted
    Tool: Bash (read + grep)
    Preconditions: system-design.md assembled
    Steps:
      1. head -5 system-design.md — verify frontmatter with tags
      2. grep "^## " system-design.md — list all H2 sections (expect 6+)
      3. grep "^> \[!" system-design.md — verify callouts present throughout
      4. grep -c "^---$" system-design.md — verify section dividers
    Expected Result: Well-structured note with frontmatter, sections, callouts, dividers
    Failure Indicators: Missing frontmatter, fewer than 6 H2 sections, no callouts
    Evidence: .sisyphus/evidence/task-8-integration.md
  ```

  **Evidence to Capture**:
  - [ ] Section structure overview
  - [ ] Frontmatter verification
  - [ ] Callout count

  **Commit**: YES (single commit with all content)
  - Message: `feat(interview): add System Design interview methodology guide`
  - Files: `base/interview/system-design.md`
  - Pre-commit: `npx quartz build -d base`

---

## Final Verification Wave

- [ ] F1. **Link Verification + Quartz Build** — `quick`
  Run `npx quartz build -d base` to verify the note compiles. Parse the markdown and verify EVERY `[text](path.md)` link resolves to an existing file in `base/`. Check for broken relative paths.
  Output: `Build [PASS/FAIL] | Links [N/N valid] | VERDICT`

- [ ] F2. **Anti-Duplication Audit** — `quick`
  Read the methodology section of System Design.md (offset around line 2337+, «Паттерны и приёмы проектирования» / «Этапы проектирования»). Compare with the interview note. Flag any section that re-explains methodology instead of linking. Flag any missing cross-reference opportunities.
  Output: `Duplication [N sections flagged] | Missing links [N] | VERDICT`

---

## Commit Strategy

- **Single commit**: `feat(interview): add System Design interview methodology guide`
  - Files: `base/interview/system-design.md`
  - Pre-commit: `npx quartz build -d base` (verify build passes)

---

## Success Criteria

### Verification Commands
```bash
npx quartz build -d base          # Expected: Build completes without errors
grep -c '\[.*\](.*\.md)' base/interview/system-design.md  # Expected: >5 cross-references
```

### Final Checklist
- [ ] Заметка в `base/interview/system-design.md`
- [ ] Quartz build проходит
- [ ] Все markdown-ссылки валидны
- [ ] Фреймворк интервью покрыт (шаги, тайминг, коммуникация)
- [ ] WhatsApp walkthrough с диалогами
- [ ] Инфраструктурный слой (диски, стойки, RBAC, Network Policy)
- [ ] Чек-лист подготовки и ошибки
- [ ] Нет дублирования System Design.md методологии
