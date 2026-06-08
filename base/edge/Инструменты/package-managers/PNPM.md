---
tags:
  - edge
---
#PNPM #NodeJS #PackageManager

[NPM: pnpm](https://www.npmjs.com/package/pnpm)

## Что это такое?

PNPM - быстрый пакетный менеджер для Node.js. Он экономит место на диске за счёт общего хранилища пакетов и жёстких ссылок, а также строже работает с зависимостями, чем классический npm.

## Базовые команды

```bash
# установка зависимостей
pnpm install

# установка пакета в dependencies
pnpm add zod

# установка пакета в devDependencies
pnpm add -D typescript vitest

# удаление пакета
pnpm remove lodash

# запуск скрипта из package.json
pnpm dev

# выполнение пакета без установки в проект
pnpm dlx create-vite
```

## Почему PNPM полезен в TypeScript-проектах

- быстрее ставит зависимости в больших проектах;
- хорошо подходит для monorepo;
- уменьшает случайные зависимости от пакетов, которые не указаны в `package.json`;
- поддерживает workspaces из коробки;
- удобен для CI за счёт lockfile `pnpm-lock.yaml`.

## Workspaces

`pnpm-workspace.yaml`

```YAML
packages:
  - apps/*
  - packages/*
  - libs/*
```

После этого можно держать несколько приложений и библиотек в одном репозитории.

```bash
# запустить build во всех пакетах
pnpm -r build

# запустить команду только в одном пакете
pnpm --filter web dev

# добавить зависимость в конкретный пакет
pnpm --filter api add zod
```

## Установка алиаса

Чтобы не писать постоянно pnpm, мы можем создать алиас

### на win

```
notepad $profile.AllUsersAllHosts
```

`profile.ps1`

```
set-alias -name pn -value pnpm
```

### на linux

```
alias pn=pnpm
```

## Плюсы

- быстрая установка зависимостей;
- экономит место на диске;
- сильная поддержка workspaces и monorepo.

## Минусы

- строгая структура node_modules может вскрыть ошибки зависимостей;
- некоторые старые пакеты ожидают npm/yarn-поведение;
- команде нужно привыкнуть к фильтрам и workspace-командам.

## Когда использовать

- нужен пакетный менеджер для современного TypeScript-проекта;
- в репозитории несколько apps/packages;
- важны скорость CI и воспроизводимость lockfile.
