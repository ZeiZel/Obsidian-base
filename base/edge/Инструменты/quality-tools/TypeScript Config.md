---
tags:
  - edge
  - typescript
  - tsconfig
---
#TypeScript #tsconfig

[NPM: typescript](https://www.npmjs.com/package/typescript)

## Что это такое?

`tsconfig.json` - центральная настройка TypeScript-проекта. Хороший конфиг сильно влияет на качество продукта: он либо ловит ошибки заранее, либо пропускает их в runtime.

## Базовый строгий конфиг

```JSON
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

## Важные опции

- `strict` - включает набор строгих проверок.
- `noUncheckedIndexedAccess` - заставляет учитывать, что элемента массива или объекта может не быть.
- `exactOptionalPropertyTypes` - делает optional-поля честнее: отсутствие поля и `undefined` перестают смешиваться без необходимости.
- `noImplicitOverride` - требует писать `override` при переопределении методов класса.
- `noFallthroughCasesInSwitch` - защищает от случайного проваливания между `case`.
- `forceConsistentCasingInFileNames` - ловит проблемы с регистром путей, которые часто проявляются только в CI/Linux.
- `skipLibCheck` - ускоряет проверку, пропуская типизацию `.d.ts` из зависимостей.

## Проверка типов без сборки

```JSON
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

Эту команду стоит запускать в CI отдельно от тестов и линтера.

## Для библиотек

```JSON
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false
  }
}
```

Если библиотека собирается через [[build-tools/tsup|tsup]], генерацию деклараций можно поручить ему через `dts: true`.

## Плюсы

- строгий конфиг ловит ошибки до запуска приложения;
- единый `tsconfig` задаёт правила для IDE, build и CI;
- опции можно разделять по app/lib/test-конфигам.

## Минусы

- слишком строгий конфиг в legacy-коде требует миграции;
- часть опций может конфликтовать с настройками bundler/framework;
- `skipLibCheck` ускоряет сборку, но скрывает ошибки в декларациях зависимостей.

## Когда использовать

- проект пишется на TypeScript;
- нужна отдельная CI-команда `tsc --noEmit`;
- команда хочет постепенно ужесточать типизацию.
