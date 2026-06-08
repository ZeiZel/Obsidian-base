---
tags:
  - edge
---
#VSCode #TypeScript

[NPM: @types/vscode](https://www.npmjs.com/package/@types/vscode)

## Настройки

Настройки ==VSCode==:

```JSON
{
    // workbench

    "workbench.colorTheme": "Community Material Theme Ocean",

    // editor

    "editor.fontSize": 21, // размер шрифта
    "editor.formatOnSave": true, // форматирование при сохранении
    "editor.wordWrap": "bounded", // переноси строк
    "editor.folding": false, // сворачивание кода
    "editor.smoothScrolling": true, // плавная прокрутка
    "editor.minimap.enabled": false, // миникарта сбоку отключена
    "editor.inlineSuggest.enabled": true,
    "editor.detectIndentation": true, //
    "editor.scrollBeyondLastLine": true, // будет ли редактор прокручиваться за пределы последней строки
    "editor.suggestSelection": "first", // в выпадающем списке сначала подсказки, а потом всё остальное
    "editor.cursorBlinking": "expand", // красивое мигание курсора
    "editor.bracketPairColorization.enabled": true, // разноцветные скобки

    //explorer

    "explorer.confirmDelete": false,
    "explorer.compactFolders": false,
    "explorer.confirmDragAndDrop": false,

    // files

    "files.autoSave": "afterDelay", // автосохранение
    // для нормальной работы tailwind
    "files.associations": { "*.scss": "postcss", "*.module.scss": "postcss" },

    // prettier

    "prettier.useTabs": true,
    "prettier.tabWidth": 4,
    "prettier.printWidth": 100,
    "prettier.trailingComma": "all",
    "prettier.singleQuote": true,
    "prettier.jsxSingleQuote": true,
    "prettier.semi": true,
    "prettier.bracketSpacing": true,
    "prettier.endOfLine": "auto",

    // breadcrumbs

    "breadcrumbs.enabled": false,

    // прочее

    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
}
```

## Полезные расширения для TypeScript

- ESLint - подсветка и автофикс правил линтера.
- Prettier - форматирование кода.
- Error Lens - показывает ошибки прямо в строке.
- Pretty TypeScript Errors - делает ошибки TypeScript понятнее.
- Tailwind CSS IntelliSense - автокомплит классов Tailwind.
- Vitest - запуск тестов из редактора.
- GitLens - история изменений и blame.
- Path Intellisense - подсказки путей.

## Настройки для строгого TypeScript-проекта

```JSON
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

`typescript.tsdk` заставляет VSCode использовать версию TypeScript из проекта, а не встроенную версию редактора. Это важно, чтобы локальная разработка и CI проверяли код одинаково.

## Плюсы

- сильная TypeScript-интеграция из коробки;
- большая экосистема расширений;
- настройки проекта можно хранить рядом с кодом.

## Минусы

- это редактор, а не npm-пакет runtime-разработки;
- качество опыта зависит от расширений и настроек;
- тяжёлые workspace могут требовать настройки TypeScript server.

## Когда использовать

- команда работает с TypeScript/React/Node.js;
- нужно единое поведение форматирования и lint в IDE;
- важны быстрые подсказки, refactor tools и type errors в редакторе.
