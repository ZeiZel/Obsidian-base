---
tags:
  - git
  - vcs
  - workflow
  - commits
  - devops
---

#Git #GitHub

> [!tip] [Гайд по Git](https://githowto.com/ru/setup)

- [1. Введение](_lessons/1.%20Введение.md)
- [2. Базовые команды](_lessons/2.%20Базовые%20команды.md)
- [3. Начало работы с Git](_lessons/3.%20Начало%20работы%20с%20Git.md)
- [4. Ветки и изменения](_lessons/4.%20Ветки%20и%20изменения.md)
- [5. Удаление](_lessons/5.%20Удаление.md)
- [6. Продвинутая работа](_lessons/6.%20Продвинутая%20работа.md)
- [7. Удалённый репозиторий](_lessons/7.%20Удалённый%20репозиторий.md)

Дополнительный материалы:

- [Соглашение о коммитах 1.0.0](Соглашение%20о%20коммитах%201.0.0.md)
- [GitFlow](GitFlow.md)
- [Github Actions](Github%20Actions.md)

---

## GitFlow

В начальной своей версии проект имеет две ветки:

- `main` — стабильный продакшн
- `dev` — текущая разработка

В эти ветки запрещено вносить изменения без Pull Request.

Чтобы реализовать фичу: отделяемся от `dev`, разрабатываем в отдельной ветке, по окончанию сливаем в `dev` через PR.

**Release-ветка** — получает изменения из `dev` перед заливом в `main`. В неё коммитят только фиксы (если тестировщики обнаружили баги).

**Hotfix-ветка** — при критической проблеме отделяется напрямую от `main`. После фикса сливается как в `main`, так и в `dev` (чтобы не потерять изменения).

`dev` должна хранить все изменения проекта.

> [!info] Преимущества GitFlow
>
> - Удобный процесс для код-ревью
> - Подходит для редких релизов
> - Подходит для работы с несколькими командами

> [!warning] Недостатки GitFlow
>
> - Много merge-конфликтов
> - Много merge-коммитов
> - Сложный путь до релиза

---

## Conventional Commits

> Спецификация: https://www.conventionalcommits.org/en/v1.0.0/

Соглашение о коммитах — простой набор правил для создания понятной истории коммитов. Совместимо с [Семантическим Версионированием](https://semver.org/lang/ru/).

### Структура сообщения

```
<тип>[опциональный скоп]: <краткое описание>

[опциональное тело — подробное объяснение]

[опциональный футер: ссылки, breaking changes]
```

### Типы коммитов

| Тип | Что означает | Влияние на SemVer |
|-----|-------------|-------------------|
| `feat` | Новая функциональность | MINOR (0.X.0) |
| `fix` | Исправление бага | PATCH (0.0.X) |
| `BREAKING CHANGE` | Несовместимое изменение API | MAJOR (X.0.0) |
| `build` | Изменения сборки, зависимостей | — |
| `chore` | Служебные задачи (не затрагивают продукт) | — |
| `ci` | Конфигурация CI/CD | — |
| `docs` | Только документация | — |
| `style` | Форматирование (пробелы, запятые), не CSS | — |
| `refactor` | Рефакторинг (не фича, не баг) | — |
| `perf` | Оптимизация производительности | — |
| `test` | Добавление/исправление тестов | — |
| `revert` | Откат предыдущего коммита | — |

### Scope — область изменений

Scope — существительное в скобках, указывающее область кода:

```
feat(auth): add OAuth2 support
fix(api): handle null response from payment service
docs(readme): update installation steps
```

### Breaking Changes — два способа

**Способ 1: `!` в типе**
```
feat!: migrate to new authentication flow
feat(api)!: rename endpoint /users to /accounts
```

**Способ 2: Футер `BREAKING CHANGE:`**
```
feat: migrate to new auth

BREAKING CHANGE: JWT tokens now expire after 15 minutes instead of 1 hour.
Update your token refresh logic accordingly.
```

### Реальные примеры

```bash
# Простая фича
feat(cart): add quantity selector to product card

# Баг с указанием scope
fix(checkout): prevent duplicate order submission on double-click

# Документация
docs: add API authentication examples to README

# Рефакторинг без изменений поведения
refactor(user-service): extract validation logic to separate module

# CI/CD изменение
ci: add caching for node_modules in GitHub Actions

# Breaking change через !
feat(api)!: remove deprecated v1 endpoints

# Breaking change с телом и футером
fix(auth): update token validation

Previously tokens were validated client-side only.
Now all tokens are validated server-side on each request.

BREAKING CHANGE: Clients must handle 401 responses and refresh tokens.
Refs: #247

# Revert
revert: feat(payments): add Apple Pay support

Refs: abc1234
```

### Связь с Semantic Versioning

```
fix: ...     → 1.0.0 → 1.0.1  (patch)
feat: ...    → 1.0.1 → 1.1.0  (minor)
feat!: ...   → 1.1.0 → 2.0.0  (major)
```

### Инструменты

```bash
# commitlint — валидация сообщений коммитов
npm install --save-dev @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
# + подключить к husky commit-msg хуку

# commitizen — интерактивное создание коммитов
npm install --save-dev commitizen cz-conventional-changelog
npx cz  # вместо git commit

# semantic-release — автоматический релиз по коммитам
npm install --save-dev semantic-release
```

---

## Продвинутые инструменты Git

### git worktree — несколько рабочих деревьев

```bash
# Создать новое рабочее дерево для существующей ветки
git worktree add ../hotfix hotfix-branch

# Создать с новой веткой
git worktree add -b feature/new-ui ../new-ui

# Посмотреть список
git worktree list

# Удалить
git worktree remove ../hotfix
```

Когда использовать: нужно переключиться на hotfix не прерывая текущую работу, без stash. Каждое дерево — отдельная папка с общим `.git`.

---

### git filter-repo — переписывание истории

> [!WARNING] Перезаписывает историю. Все участники должны сделать `git clone` заново после этого.

```bash
# Установить (pip)
pip install git-filter-repo

# Удалить файл из всей истории (например, случайно закоммиченный секрет)
git filter-repo --path secrets.env --invert-paths

# Изменить email автора во всех коммитах
git filter-repo --email-callback 'return b"new@email.com"'
```

Предпочитай `git filter-repo` вместо устаревшего `git filter-branch` — быстрее и безопаснее.

---

### git bisect — бинарный поиск регрессии

```bash
git bisect start
git bisect bad                    # текущий коммит сломан
git bisect good v1.2.0            # этот тег работал

# Git переключает коммиты, ты тестируешь:
git bisect good   # или
git bisect bad

# Автоматизированный поиск
git bisect run npm test

git bisect reset   # выйти
```

Находит за O(log n) проверок коммит, который сломал функциональность.

---

### git reflog — журнал ссылок

```bash
git reflog                        # все действия с HEAD
git reflog show feature/auth      # действия с веткой

# Восстановить удалённый коммит
git checkout -b recovery abc1234  # хеш из reflog

# Откатиться после неудачного rebase
git reset --hard HEAD@{3}
```

> [!TIP] reflog хранится локально 90 дней. Это спасательный круг при любых катастрофах.

---

### git stash — детально

```bash
git stash push -m "WIP: auth form"
git stash list
git stash pop                      # применить и удалить
git stash apply stash@{2}          # применить без удаления
git stash branch feature/new stash@{0}  # создать ветку из stash
git stash --include-untracked      # включить неотслеживаемые файлы
git stash drop stash@{1}
git stash clear
```

---

### git cherry-pick — перенос коммитов

```bash
git cherry-pick abc1234
git cherry-pick abc1234..def5678   # диапазон
git cherry-pick -n abc1234         # без автокоммита (--no-commit)
```

Используй когда нужно перенести конкретный фикс из одной ветки в другую без merge.

---

### git rebase — интерактивный

```bash
# Переписать последние 5 коммитов
git rebase -i HEAD~5
```

В редакторе доступны команды:
- `pick` — оставить как есть
- `squash` / `s` — объединить с предыдущим
- `fixup` / `f` — объединить, выбросить сообщение
- `reword` / `r` — изменить сообщение
- `edit` / `e` — остановиться для изменений
- `drop` / `d` — удалить коммит

```bash
# Rebase поверх другой базы
git rebase --onto main feature/old feature/new

# Когда rebase, когда merge:
# rebase — для feature-веток перед PR (чистая история)
# merge — для интеграции в main/develop (сохраняет контекст)
```

---

### git submodule и git subtree

```bash
# Submodule — ссылка на конкретный коммит другого репо
git submodule add https://github.com/org/lib libs/lib
git submodule update --init --recursive

# Subtree — вливает историю другого репо
git subtree add --prefix=libs/lib https://github.com/org/lib main --squash
```

| | Submodule | Subtree |
|--|-----------|---------|
| **Хранение** | Ссылка на коммит | Копия кода в репо |
| **Обновление** | `git submodule update` | `git subtree pull` |
| **Сложность** | Выше (нужно знать про submodules) | Ниже для клонирующих |
| **Изменения** | Не смешиваются с основным репо | Смешиваются в истории |

---

### Git Hooks — автоматизация

```bash
# .git/hooks/pre-commit (chmod +x)
#!/bin/sh
npm run lint && npm run test:unit
```

Популярные хуки:
- `pre-commit` — линтинг, форматирование
- `commit-msg` — валидация формата сообщения
- `pre-push` — запуск тестов

```bash
# Для JS-проектов: husky
npm install --save-dev husky
npx husky init
echo "npm run lint" > .husky/pre-commit
```

Husky автоматически устанавливает хуки при `npm install` (через `prepare` скрипт).
