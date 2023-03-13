
Сейчас имеется сразу несколько версий реакт-роутер-дома, но стоит начать с пятой 

![](_png/Pasted%20image%2020230313093811.png)

Устанавливаем нужную нам версию через `@версия`

```bash
npm i react-router-dom@5.3.4
```

BrowserRouter - роутер по всем страницам приложения
Route - отдельный роут приложения
Switch - переключатель



```JS
import { useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const App = () => {
	const [selectedChar, setSelectedChar] = useState(null);

	const onCharSelected = (id) => {
		setSelectedChar(id);
	};

	return (
		<Router>
			<div className='app'>
				<AppHeader />
				<main>
					<Route path={'/'}>
						<ErrorBoundary>
							<RandomChar />
						</ErrorBoundary>
						<div className='char__content'>
							<ErrorBoundary>
								<CharList onCharSelected={onCharSelected} />
							</ErrorBoundary>
							<ErrorBoundary>
								<CharInfo charId={selectedChar} />
							</ErrorBoundary>
						</div>
						<img className='bg-decoration' src={decoration} alt='vision' />
					</Route>
					<Route path={'/comics'}>
						<AppBanner />
						<ComicsList />
					</Route>
				</main>
			</div>
		</Router>
	);
};

export default App;
```

Но тут стоит заметить, что роутер компонует между собой элементы с ссылками, которые хранят одинаковые значения. То есть в данном случае первый роут и второй объединятся, так как `/` и `/comics` имеют при себе слеш

![](_png/Pasted%20image%2020230313095201.png)

И при переходе на `/comics` у нас будет следующая картина:

![](_png/Pasted%20image%2020230313095231.png)





