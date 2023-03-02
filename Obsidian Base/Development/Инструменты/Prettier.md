#prettier

Глобальная установка плагина:

```bash
npm install --global prettier
```

В корне проекта нужно создать файл `.prettierrc` с настройками

Настройки ==prettier==:

- `tabWidth` - ширина табуляции
- `useTabs` - использовать табы
- `singleQuote` - одинарные ковычки  
- `jsxSingleQuote` - одинарные кавычки в jsx
- `arrowParens` - если в стрелочной функции один аргумент, то его нужно удалять
- `semi` - точка с запятой в конце
- `trailingComma` - ставить запятую в конце (у объектов)
- `printWidth` - максимальная длина строки
- `bracketSpacing` - будет оставлять по пробелу отступов внутри объектов `{ имя }`
- `endOfLine` - окончание строк будет оставаться по умолчанию

```JSON
{  
  "useTabs": true,  
  "tabWidth": 4,  
  "printWidth": 100,  
  "trailingComma": "all",  
  "singleQuote": true,  
  "jsxSingleQuote": true,  
  "semi": true,  
  "bracketSpacing": true,  
  "endOfLine": "auto"  
}
```

Далее в настройках указываем путь до плагина и активируем форматирование при сохранении (так же можно указать дополнительные файлы с форматированием).

![](_png/Pasted%20image%2020221029110516.png)