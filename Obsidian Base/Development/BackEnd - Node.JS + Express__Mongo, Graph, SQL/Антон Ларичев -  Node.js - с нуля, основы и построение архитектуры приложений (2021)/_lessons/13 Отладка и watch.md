## 073 Eslint и prettier

Установи `prettier` и `eslint` вместе с плагинами, парсерами и конфигами

```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier typescript
```

- одиночные кавычки
- висячая `,`
- использование табов
- `;` в конце
- пробелы между фигурными скобочками
- максимальная длина
- конечная строка: автоматически

`.prettierrc`
```JSON
{
	"singleQuote": true,
	"trailingComma": "all",
	"useTabs": true,
	"semi": true,
	"bracketSpacing": true,
	"printWidth": 100,
	"endOfLine": "auto"
}
```

- `no-unused-vars` - не используемые переменные (включая функции и объекты) - отключено у нас
- `explicit-function-return-type` - нужно явно указывать, что возвращает функция 

`.eslintrc`
```JSON
{
	"root": true,
	"parser": "@typescript-eslint/parser",
	"plugins": [
		"@typescript-eslint"
	],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended"
	],
	"rules": {
		"@typescript-eslint/ban-types": "off",
		"@typescript-eslint/no-unused-vars": [
			"off"
		],
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/explicit-function-return-type": [
			"warn"
		],
		"prettier/prettier": [
			"error",
			{
				"singleQuote": true,
				"useTabs": true,
				"semi": true,
				"trailingComma": "all",
				"bracketSpacing": true,
				"printWidth": 100,
				"endOfLine": "auto"
			}
		]
	}
}
```






## 074 Подключение nodemon






## 075 Отладка






## 076 Анализ памяти






## 077 Мониторинг производительности








