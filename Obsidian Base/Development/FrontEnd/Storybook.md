
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

Так же сформируются два файла конфигурации, которые будут отвечать за то, какие файлы будут и по каким параметрам определяться как источники историй для сторибука

`.storybook > main.ts`
```TS
import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["..\\public"],
};

export default config;
```

Сохраняет настройки лейаута

`.storybook > preview.ts`
```TS
import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
```









