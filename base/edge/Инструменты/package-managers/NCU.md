---
tags:
  - edge
---
#NCU #Dependencies

[NPM: npm-check-updates](https://www.npmjs.com/package/npm-check-updates)

NCU (`npm-check-updates`) - пакет, который проверяет обновления зависимостей проекта и может обновлять версии в `package.json`.

Его удобно использовать перед плановым обновлением зависимостей, но не стоит бездумно обновлять все major-версии в продукте.

Установка пакета

```bash
npm i -g npm-check-updates
```

Покажет, какие обновления можно внести в `package.json`

```bash
ncu
```

Проверка обновлений и обновление `package.json`

```bash
ncu -u
```

Устанавливаем обновления

```bash
npm i
```

## Практичный сценарий

```bash
# посмотреть доступные обновления
ncu

# обновить только patch/minor
ncu -u --target minor

# поставить зависимости
pnpm install

# проверить проект
pnpm lint
pnpm test
pnpm typecheck
```

## Обновление отдельных пакетов

```bash
ncu '/^@types\\//'
ncu -u zod typescript vitest
```

## Что проверять после обновления

- changelog для major-версий;
- lockfile;
- `tsc --noEmit`;
- unit/e2e тесты;
- сборку production-бандла;
- работу миграций, если обновлялись ORM или database-клиенты.

## Плюсы

- быстро показывает доступные обновления;
- умеет обновлять версии выборочно;
- удобен для планового dependency maintenance.

## Минусы

- может привести к большим breaking changes при бездумном `-u`;
- не заменяет чтение changelog;
- после обновления обязательно нужны тесты и typecheck.

## Когда использовать

- нужно регулярно обновлять зависимости;
- хочется разделять patch/minor/major обновления;
- перед обновлением есть время на проверку сборки и тестов.
