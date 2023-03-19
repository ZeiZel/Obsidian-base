
Так же куда более простым способом в реализации подключения редакса к реакту будет использование хуков:
- `useSelector` - позволяет получить из глобального хранилища (стора) нужное нам состояние 
- `useDispatch` - предоставляет доступ к функции `dispatch`

`Counter.js`
```JS
import { useDispatch, useSelector } from 'react-redux';
import { inc, dec, rnd } from '../actions';

const Counter = () => {
	// эта функция позволяет получить состояние из стора
	const { counter } = useSelector((state) => state);

	// эта функция отвечает за генерацию функций-диспэтчей
	const dispatch = useDispatch();

	return (
		<div className='wrapper'>
			<h1>{counter}</h1>
			<button className='btn' onClick={() => dispatch(dec())}>
				DEC
			</button>
			<button className='btn' onClick={() => dispatch(inc())}>
				INC
			</button>
			<button className='btn' onClick={() => dispatch(rnd())}>
				RND
			</button>
		</div>
	);
};

export default Counter;
```

Отличия `useSelector` от `mapStateToProps`:
- хук возвращает всё, что угодно, а не только то, что идёт на пропсы
- коллюэк функция позволяет сделать всё, что угодно с данными, но она должна оставаться чистой и синхронной
- в само значение, которое вызывает функцию, может помещаться что угодно (строка, массив, функция и так далее)
- в хуке отсутствует свойство ownProp, который используется для передачи собственных пропсов для отслеживания
- при срабатывании диспэтч-функции, хук сам проверяет не изменились ли данные, которые он возвращает. Тут уже проверка проходит не по всему объекту, как в обычной функции, а по отдельным полям объекта (если мы сразу возвращаем объект, но если мы возвращаем через `return`, то тут уже будет проходить проверка по всему объекту)
- Так же хук при изменении стейта в сторе будет вызывать перерендер компонента

Так же, когда мы возвращаем из функции новый объект, то у нас каждый раз будет создаваться новый объект, что будет вызывать перерендеры компонента. Чтобы избавиться от данной ошибки, можно:
- просто дублировать использование хука `useSelector` при запросе отдельных свойств из стора
- использовать функцию [Reselect](https://react-redux.js.org/api/hooks) из сторонней библиотеки
```JS
import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'

const selectNumCompletedTodos = createSelector(
  (state) => state.todos,
  (todos) => todos.filter((todo) => todo.completed).length
)

export const CompletedTodosCounter = () => {
  const numCompletedTodos = useSelector(selectNumCompletedTodos)
  return <div>{numCompletedTodos}</div>
}

export const App = () => {
  return (
    <>
      <span>Number of completed todos:</span>
      <CompletedTodosCounter />
    </>
  )
}
```
- либо можно использовать функцию `shallowEqual`:
```JS
import { shallowEqual, useSelector } from 'react-redux'

// later
const selectedData = useSelector(selectorReturningObject, shallowEqual)
```

Если мы говорим про хук `useDispatch`, то тут нужно упомянуть, что при передаче его дальше по иерархии в нижние компоненты, нужно обернуть его в `useCallback`, чтобы каждый раз не пересоздавался диспэтч. Дело в том, что пересоздание диспэтча будет вызывать пересоздание и самого компонента.

```JS
const incrementCounter = useCallback(
	() => dispatch({ type: 'increment-counter' }),
	[dispatch]
)
```

Так же существует хук `useStore`, который возвращает полностью весь объект стора, но им пользоваться не стоит

```JS
import React from 'react'
import { useStore } from 'react-redux'

export const CounterComponent = ({ value }) => {
  const store = useStore()

  // ТОЛЬКО ПРИМЕР! Такое делать в реальном примере нельзя
  // Компонент не будет автоматически обновлён, если стор будет изменён
  return <div>{store.getState()}</div>
}
```







