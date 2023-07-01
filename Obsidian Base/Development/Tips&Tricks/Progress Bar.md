
## NextJS

Для того, чтобы добавить прогрессбар в приложение NextJS, нужно установить пакет прогрессбара

```bash
npm i nextjs-progressbar
```

Далее нужно подключить `NextProgress` в корневом компоненте

`_app.tsx`
```JSX
import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import NextProgress from 'nextjs-progressbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<meta charSet='UTF-8' />
				<meta httpEquiv='X-UA-Compatible' content='IE=edge' />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
				<link rel='icon' type='img/svg' sizes='32x32' href='logo.svg' />
			</Head>
			<NextProgress />
			<Component {...pageProps} />
			<ToastContainer
				position={'bottom-right'}
				hideProgressBar={false}
				closeOnClick
				rtl={false}
				theme={'dark'}
			/>
		</>
	);
}
```

И теперь у нас имеется прогрессбар

![](_png/Pasted%20image%2020230701130240.png)
