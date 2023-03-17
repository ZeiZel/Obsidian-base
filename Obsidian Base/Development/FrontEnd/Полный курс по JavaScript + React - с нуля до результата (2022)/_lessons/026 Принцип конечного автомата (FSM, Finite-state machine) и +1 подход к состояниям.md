
Начнём с того, что в приведённом примере ниже, отображение на странице зависит от данных четырёх состояний. Это очень громоздкая и зачастую непонятная конструкция, но ей пользуются для реализации вёрстки на страницах.

![](_png/Pasted%20image%2020230317162107.png)

И тут к нам приходит **Концепция Конечного Автомата** (FSM - Finite-State Machine - State Machine - Машина состояний). Это такая сущность (математическая модель), которая имеет определённое количество состояний. То есть данная сущность может иметь ровно одно состояние в определённый момент времени.

Если кнопка скрыта, то она уже имеет определённое состояние. Она не может быть выключена, так как она скрыта и так далее.

На примере курьера можно привести его состояния:
- Ожидание (тут он может отдохнуть, выпить кофе)
- Получение заказа (тут он уже уточняет адрес, общается с заказчиком и так далее)
- Доставка заказа (уже тут он перемещается к заказчику)
- Получение оплаты (а тут получает оплату и дальше переходит в состояние ожидания)

Данная концепция не выделяется как отдельный приём. Оно отвечает лишь за то, что мы контролируем количество состояний, которое может быть в приложении.

Для работы со машиной состояний имеется несколько библиотек под JS (их стоит использовать уже вместе с `Redux`):
- [Xstate](https://xstate.js.org/docs/recipes/react.html)
- [Robot](https://thisrobot.life/)
- [Machina.js](http://machina-js.org/)

Модифицируем хук, который выполняет получение данных с сервера. В него на каждый из этапов будем устанавливать состояние процесса, который будет вызвать определённый рендер в компонентах

`hooks > http.hook.js`
```JS
import { useState, useCallback } from 'react';

export const useHttp = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// тут будет находиться состояние процесса
	// начальное - ожидание
	const [process, setProcess] = useState('waiting');

	const request = useCallback(
		async (
			url,
			method = 'GET',
			body = null,
			headers = { 'Content-Type': 'application/json' },
		) => {
			setLoading(true);
			// тут происходит загрузка
			setProcess('loading');

			try {
				const response = await fetch(url, { method, body, headers });

				if (!response.ok) {
					throw new Error(`Could not fetch ${url}, status: ${response.status}`);
				}

				const data = await response.json();

				setLoading(false);
				return data;
			} catch (e) {
				setLoading(false);
				setError(e.message);

				// так же состояние может принять в себя ошибку
				setProcess('error');
				throw e;
			}
		},
		[],
	);

	const clearError = useCallback(() => {
		setError(null);

		// тут так же будет стоять ожидание
		setProcess('waiting');
	}, []);

	return { loading, request, error, clearError, process, setProcess };
};
```

Возвращаем хук установки процесса и состояние самого процесса через хук сервиса общения с сервером

`service > MarvelService.js`
```JS
const useMarvelService = () => {
	const { loading, request, error, clearError, process, setProcess } = useHttp();

	/// CODE ...

	return {
		loading,
		error,
		clearError,
		getAllCharacters,
		getCharacterByName,
		getCharacter,
		getAllComics,
		getComic,
		process,
		setProcess,
	};
};
```

Эта уже сама машина состояний. Тут мы определяем, какие процессы будут выполняться на разных этапах процесса

`utils > setContent.js`
```JS
import Skeleton from '../components/skeleton/Skeleton';
import Spinner from '../components/spinner/Spinner';
import ErrorMessage from '../components/errorMessage/ErrorMessage';

// по состоянию процесса компонент будет рендерить разные части интерфейса
export const setContent = (process, Component, data) => {
	switch (process) {
		case 'waiting':
			return <Skeleton />;
		case 'loading':
			return <Spinner />;
		case 'confirmed':
			return <Component data={data} />;
		case 'error':
			return <ErrorMessage />;
		default:
			throw new Error('Unexpected process state in this case');
	}
};
```

И далее тут в рендере используем `setContent()`. Эта функция будет каждый раз перевызываться при изменении состояния `process`. Так же в этом же компоненте нужно вызывать `setProcess` после того, как мы получили данные внутри `updateChar`

`component > charInfo > CharInfo.js`
```JS
const CharInfo = (props) => {
	const [char, setChar] = useState(null);

	const { getCharacter, clearError, process, setProcess } = useMarvelService();

	useEffect(() => {
		updateChar();
	}, [props.charId]);

	const updateChar = () => {
		const { charId } = props;
		if (!charId) {
			return;
		}

		clearError();
		getCharacter(charId)
			.then(onCharLoaded)
			// тут мы подтверждаем загрузку данных, чтобы рендер персонажа был с данными
			.then(() => setProcess('confirmed'));
	};

	const onCharLoaded = (char) => {
		setChar(char);
	};

	return <div className='char__info'>{setContent(process, View, char)}</div>;
};
```

Так же стоит переименовать пропс, получаемый в компоненте на тот, что передаётся внутри свича

![](_png/Pasted%20image%2020230317175349.png)

Тут так же пришлось решать проблему с тем, что в списке во время загрузки отображалось `null` (это приводит к тому, что мы поднимаемся вверх страницы и заново приходится скроллить вниз по списку). Эту проблему можно было решить только переписав функцию установки контента, где мы в загрузке показываем старый список или спиннер (если старых элементов списка нет)

`component > charList > CharList.js`
```JS

```





Код мы оптимизировали и компонент информации о персонаже так же работает

![](_png/Pasted%20image%2020230317182024.png)













