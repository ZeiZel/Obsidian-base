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






## 24 React Testing Library. Тесты на компоненты метка






## 25 Настраиваем Storybook. Декораторы. Стори кейсы на компоненты






## 26 Скриншотные тесты. Loki. Регрессионное UI тестирование






## 27 CI pipeline. Автоматизация прогона тестов метка






## 28 Сайдбар. Состояния кнопки. UI Screenshot test report








