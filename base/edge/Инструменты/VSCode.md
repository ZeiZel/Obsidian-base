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
