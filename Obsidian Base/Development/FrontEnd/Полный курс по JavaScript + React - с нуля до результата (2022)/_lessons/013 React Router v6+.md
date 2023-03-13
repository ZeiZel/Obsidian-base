
И теперь нужно установить последнюю версию роутера

```bash
npm i react-router-dom@latest
```

>[!info] [Тут](https://github.com/remix-run/react-router/blob/main/docs/upgrading/v5.md#upgrade-to-react-router-v6) находится руководство о переходе с пятой версии на шестую

> Вместо компонента `Switch` используется компонент `Routes`. 

> Нужный компонент для отрисовки теперь передаётся не в качестве `child`, а передаётся внутрь атрибута `element`. 

> Так же нужно сказать, что такого атрибута как `exact` теперь не существует. Внутри `Routes` проходит правильное сравнение ссылок, что не приводит к рендеру одного компонента внутри другого. Если нам нужно будет использовать эквивалент этому атрибуту в `NavLink`, то там мы вместо него пишем `end`

`components > app > App.js`
```JS
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const App = () => {
	return (
		<Router>
			<div className='app'>
				<AppHeader />
				<main>
					<Routes>
						<Route path={'/'} element={<MainPage />} />
						<Route path={'/comics'} element={<ComicsPage />} />
					</Routes>
				</main>
			</div>
		</Router>
	);
};
```

Так же в новой версии у нас пропала наша классическая композиция, когда у нас свитч рендерил сразу все страницы, если их не разделять атрибутом `exact`. Чтобы использовать данную функциональность и подгружать другую страницу внутри нашей страницы, нужно использовать компонент `<Outlet />`. Он загрузит другой компонент на нашей странице при клике на нужную ссылку.

![](_png/Pasted%20image%2020230313124515.png)

> Так же нужно указать, что ссылки внутри роутов будут относиться к этим роутам. То есть, если родительский роут имеет ссылку `to='/comics'`, то при выборе внутри него ссылки `to='/deadpool'` мы перейдём по ссылке `/comics/deadpool`. В пятой версии с этим были определённые трудности.

Из вышеописанных исправлений вытекает дополнительный функционал: 
- `to='.'` будет осуществлять переход на эту же страницу
- `to='..'` будет вызывать страницу на один уровень выше (родительскую)
- `to='../bayonette'` выйдет на уровень выше и перейдёт оттуда на другую страницу (которая находится в родительском компоненте)

> Теперь вместо хука `useHistory` нужно использовать `useNavigate`

> Так же из компонента `NavLink` удалили атрибуты `activeStyle` и `activeClassName`. Вместо них нужно самому делать функции по добавлению нужного функционала

```JS
const AppHeader = () => {
	return (
		<header className='app__header'>
			<h1 className='app__title'>
				<Link to={'/'}>
					<span>Marvel</span> information portal
				</Link>
			</h1>
			<nav className='app__menu'>
				<ul>
					<li>
						<NavLink
							// вставляем вместо exact
							end
							// можно так передать стили
							style={({ isActive }) => 
								({ color: isActive ? '#9F0013' : 'inherit' })}
							to={'/'}
						>
							Characters
						</NavLink>
					</li>
					/
					<li>
						<NavLink
							end
							// а можно так
							style={({ isActive }) => 
								(isActive ? { color: '#9F0013' } : {})}
							to={'/comics'}
						>
							Comics
						</NavLink>
					</li>
				</ul>
			</nav>
		</header>
	);
};
```

Теперь применение стилей правильно работает:

![](_png/Pasted%20image%2020230313130658.png)



