---
tags:
  - "#ErrorBoundary"
  - "#BundleAnalyzer"
  - "#ReactTestingLibrary"
  - "#Storybook"
  - "#Loki"
  - "#CI"
  - "#Screenshot"
---

## 22 ErrorBoundary. Обработка React ошибок

В React обработка ошибок происходит за счёт классового компонента ErrorBoundary, который отображает экран ошибки при возникновении любой ошибки в приложении

Сам компонент выглядит следующим образом. Нужно сказать, что в `componentDidCatch` можно поместить отправку ошибок пользователя на сервер.

Так же нужно упомянуть, что при получении ошибки мы будем выводить заранее определённую страницу с ошибкой. Эту страницу с ошибкой нужно обернуть в `Suspense`

`src / app / providers / ErrorBoundary / ui / ErrorBoundary.tsx`
```TSX
import React, { ErrorInfo, ReactNode, Suspense } from 'react';
import { ErrorPage } from '@/widgets/ErrorPage';
import { Skeleton } from '@/widgets/Skeleton';

/* пропсы компонента */
interface ErrorBoundaryProps {
	children: ReactNode;
}

/* стейт компонента */
interface ErrorBoundaryState {
	hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		/* todo реализовать сервис для логирования ошибок на странице */
		console.log(error, errorInfo);
	}

	render() {
		const { hasError } = this.state;
		const { children } = this.props;

		if (hasError) {
			return (
				<Suspense fallback={<Skeleton />}>
					<ErrorPage />
				</Suspense>
			);
		}

		return children;
	}
}
```

Далее так уже будет выглядеть страница с ошибкой

`src / widgets / ErrorPage / ui / ErrorPage.tsx`
```TSX
import React from 'react';
import styles from './ErrorPage.module.scss';
import { useTranslation } from 'react-i18next';
import { Button, HTag, HTagType } from '@/shared/ui';
import { TRANSLATIONS_API } from '@/shared/const';

export const ErrorPage = () => {
	const { t } = useTranslation(TRANSLATIONS_API.error.translate);

	const handleReloadPage = () => {
		location.reload();
	};

	return (
		<div className={styles.error}>
			<HTag tag={HTagType.H1}>{t(TRANSLATIONS_API.error.components.error_page_title)}</HTag>
			<Button onClick={handleReloadPage}>
				{t(TRANSLATIONS_API.error.components.error_page_button)}
			</Button>
		</div>
	);
};
```

И всё приложение так же нужно обернуть в `ErrorBoundary`

`src / index.tsx`
```TSX
root.render(
	<BrowserRouter>
		<ErrorBoundary>
			<ThemeProvider>
				<StrictMode>
					<Suspense fallback={<Skeleton />}>
						<App />
					</Suspense>
				</StrictMode>
			</ThemeProvider>
		</ErrorBoundary>
	</BrowserRouter>,
);
```

Ну и так же можно заранее реализовать компонент кнопки ошибки, который будет выводить нам кастомную ошибку на странице

`src / app / providers / ErrorBoundary / ui / ErrorButton.tsx`
```TSX
import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/ui';
import { useTranslation } from 'react-i18next';
import { TRANSLATIONS_API } from '@/shared/const';

export const ErrorButton = () => {
	const { t } = useTranslation(TRANSLATIONS_API.error.translate);

	const [error, setError] = useState<boolean>(false);

	const handleCastError = () => setError((prevState) => !prevState);

	useEffect(() => {
		if (error) {
			throw new Error(t(TRANSLATIONS_API.error.components.error_bug_message));
		}
	}, [error]);

	return (
		<Button onClick={handleCastError}>{t(TRANSLATIONS_API.error.components.error_bug)}</Button>
	);
};
```

![](_png/Pasted%20image%2020231112102522.png)

## 23 Анализ размера банда. BundleAnalyzer

Первым делом нужно установить зависимости

```bash
npm install --save-dev webpack-bundle-analyzer @types/webpack-bundle-analyzer
```

Далее нам нужно будет добавить плагин для анализа бандла в билд

`config / build / buildPlugins.ts`
```TS
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const plugins = [  
    // то плагин, который будет показывать прогресс сборки  
    new ProgressPlugin(),  
    // это плагин, который будет добавлять самостоятельно скрипт в наш index.html  
    new HTMLWebpackPlugin({  
       // указываем путь до базового шаблона той вёрстки, которая нужна в нашем проекте  
       template: paths.html,  
    }),  
    // этот плагин будет отвечать за отделение чанков с css от файлов JS  
    new MiniCssExtractPlugin({  
       filename: 'css/[name].[contenthash:8].css',  
       chunkFilename: 'css/[name].[contenthash:8].css',  
    }),  
    // этот плагин позволяет прокидывать глобальные переменные в приложение  
    new DefinePlugin({  
       __IS_DEV__: JSON.stringify(isDev),  
       __API__: JSON.stringify('https://' /* api_path */),  
    }),  
    /* данный плагин анализирует размеры собираемых пакетов */  
	new BundleAnalyzerPlugin({  
	    /*  
	    * отключаем автоматические открытие анализатора    
	    * он будет открываться по ссылке из терминала    * */    
	    * openAnalyzer: false,  
	}),
];
```

![](_png/Pasted%20image%2020231112121408.png)

## 24 React Testing Library. Тесты на компоненты метка

Первым делом нужно устранить данную проблему с нечитабельностью абсолютных импортов:

![](_png/Pasted%20image%2020231112123644.png)

Далее устанавливаем необходимые библиотеки для тестирования фронта

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @babel/preset-react identity-obj-proxy
```

Далее нам нужно создать такой сетап файл, который будет импортировать данные зависимости в тесты

`config / jest / jest.setup.ts`
```TS
/* виртуальный дом, который будет собираться в тестах */
import '@testing-library/jest-dom';
/* Рантайм для работы джеста с асинхронностью */
import 'regenerator-runtime/runtime';
```

Собираем такой конфиг:

`config / jest / jest.config.ts`
```TS
import type { Config } from 'jest';

const config: Config = {
	/* устанавливаем сюда глобальные переменные */
	globals: {
		__IS_DEV__: true,
		__API__: '',
		__PROJECT__: 'jest',
	},
	/* очищаем моковые данные */
	clearMocks: true,
	/*
	 * корневая точка
	 * мы её настраиваем так как
	 * */
	rootDir: '../../',
	modulePaths: ['<rootDir>src'],
	/* разворачиваемся в браузере */
	testEnvironment: 'jsdom',
	/* настройки для запуска тестов с ипользованием
	 * - абсолютных импортов
	 * - стилей
	 * */
	moduleNameMapper: {
		/* эта настройка нужна для поддержки абсолютных импортов */
		'^@/(.*)$': '<rootDir>/src/$1',
		'\\.s?css$': 'identity-obj-proxy',
		/* чтобы работали svg, их нужно заменить на моковый компонент */
		'\\.svg': '<rootDir>/config/jest/jestEmptyComponent.tsx',
	},
	moduleDirectories: ['node_modules', '<rootDir>/'],
	/* эту директорию не трогаем */
	coveragePathIgnorePatterns: ['\\\\node_modules\\\\'],
	/* доступные расширения файлов */
	moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
	/* регулярка, по которой находим файлы с тестами */
	testMatch: ['<rootDir>src/**/*(*.)@(spec|test).[tj]s?(x)'],
	/* тут мы определяем путь до файла с сетапмами джеста */
	setupFilesAfterEnv: ['<rootDir>config/jest/setupTests.ts'],
	/* тут настроен репорт для проходок тестов */
	reporters: [
		'default',
		[
			'jest-html-reporters',
			{
				publicPath: '<rootDir>/reports/unit',
				filename: 'report.html',
				// openReport: true,
				inlineSource: true,
			},
		],
	],
};

export default config;
```

В тс конфиг добавляем путь до сетапа джеста

`tsconfig.json`
```JSON
"include": [
	"./config/jest/setupTests.ts",
	"./src/**/*.ts",
	"./src/**/*.tsx"
],
```

В бейбел добавляем пресет для работы реакта в тестах

`babel.config.js`
```JS
module.exports = {
	presets: [
		'@babel/preset-env',
		'@babel/preset-typescript',
		['@babel/preset-react', { runtime: 'automatic' }],
	],
};
```

И пишем самый простой тест для проверки работы тестов

`src / shared / ui / Button / ui / Button.test.tsx`
```TSX
import { render, screen } from '@testing-library/react';
import { Button, ThemeButton } from '@/shared/ui';

describe('Button', () => {
	test('button text', () => {
		render(<Button>TEST</Button>);
		expect(screen.getByText('TEST')).toBeInTheDocument();
	});

	test('button classname', () => {
		render(<Button theme={ThemeButton.CLEAR}>TEST</Button>);
		expect(screen.getByText('TEST')).toHaveClass('clear');
	});
});
```

Так же нужно написать заглушку, которая будет заменять svg в проекте на себя

`config / jest / jestEmptyComponent.tsx`
```TSX
import React from 'react';

const jestEmptyComponent = function () {
	return <div />;
};

export default jestEmptyComponent;
```

Далее пишем тесты для 

```TSX
import { render, screen } from '@testing-library/react';
import { withTranslation } from 'react-i18next';
import { Sidebar } from '@/widgets';

describe('Sidebar', () => {
	test('toggle sidebar', () => {
		/* компоненты, которые используют перевод нужно обернуть в withTranslation */
		const SidebarWithTranslation = withTranslation()(Sidebar);
		render(<SidebarWithTranslation />);
		expect(screen.getByTestId('sidebar')).toBeInTheDocument();
	});
});
```


Чтобы тесты прогонялись внутри вебшторма, нужно так же настроить его раннер тестов

![](_png/Pasted%20image%2020231112143914.png)

## 25 Настраиваем Storybook. Декораторы. Стори кейсы на компоненты






## 26 Скриншотные тесты. Loki. Регрессионное UI тестирование






## 27 CI pipeline. Автоматизация прогона тестов метка






## 28 Сайдбар. Состояния кнопки. UI Screenshot test report








