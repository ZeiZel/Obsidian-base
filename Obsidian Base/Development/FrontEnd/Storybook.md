
Для установки сторибука понадобится в проекте ввести данную команду:

```bash
npx sb init
```

После установки, у нас появится скрипт для запуска сторибука

`package.json`
```JSON
"scripts": {
	"start": "react-scripts start",
	"build": "react-scripts build",
	"test": "react-scripts test",
	"eject": "react-scripts eject",
	"sb": "storybook dev -p 6006",
	"build-storybook": "storybook build"
},
```

















