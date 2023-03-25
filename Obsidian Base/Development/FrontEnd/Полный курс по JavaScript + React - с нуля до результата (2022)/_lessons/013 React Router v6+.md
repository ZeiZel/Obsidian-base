
И теперь нужно установить последнюю версию роутера

```bash
npm i react-router-dom@latest
```

>[!info] [Тут](https://github.com/remix-run/react-router/blob/main/docs/upgrading/v5.md#upgrade-to-react-router-v6) находится руководство о переходе с пятой версии на шестую

> Вместо компонента `Switch` используется компонент `Routes`. 

> Нужный компонент для отрисовки теперь передаётся не в качестве `child`, а передаётся внутрь атрибута `element`. 

> Теперь вместо хука `useHistory` нужно использовать `useNavigate`

Теперь мы пишем не так: 

```TS
const history = useHistory();

/// CODE ...

<button onClick={() => history.push('/')}>BACK</button>
```

А так:

```TSX
import { Link, useNavigate, useParams } from 'react-router-dom';

interface IUserItemPageParams {
	id: string;
}

const UserItemPage: FC = () => {
	const [user, setUser] = useState<IUser | null>(null);
	const params = useParams();

	// используем навигацию
	const navigate = useNavigate();

	async function fetchUser() {
		try {
			const response = await axios.get<IUser>(
				'https://jsonplaceholder.typicode.com/users/' + params.id,
			);
			setUser(response.data);
		} catch (e) {
			console.error(e);
		}
	}

	useEffect(() => {
		fetchUser();
	}, []);

	return (
		<div>
			{/* перемещаемся в нужное место */}
			<button onClick={() => navigate('/users')}>back</button>
			<h1>Страница пользователя {user?.name}</h1>
			<h4>Проживает в {user?.address.city}</h4>
		</div>
	);
};
```

> Хук `useRouteMatch` заменили на `useMatch`

> Компонент `Prompt` больше не поддерживается

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

> Так же из компонента `NavLink` удалили атрибуты `activeStyle` и `activeClassName`. Вместо них нужно самому делать функции по добавлению нужного функционала

Исправим хедер страницы, чтобы он поддерживал 6 версию роутер-дома:
- заменяем `exact` на `end`
- заменяем `activeStyle` на `style`. Сам же стиль будет автоматически принимать в себя аргумент активности (`isActive`), чтобы мы могли навесить нужные нам стили

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