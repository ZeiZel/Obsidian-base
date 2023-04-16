
`useId()` - генерирует уникальный идентификатор (он не должен использоваться для формирования атрибута `key`)

```JS
function Checkbox() {
  const id = useId(); // сгенерирует уникальный ключ
  return (
    <>
      <label htmlFor={id}>Do you like React?</label>
      <input id={id} type="checkbox" name="react"/>
    </>
  );
```

Так же были добавлены хуки для интеграции сторонних библиотек:
-   [`useSyncExternalStore`](https://ru.reactjs.org/docs/hooks-reference.html#usesyncexternalstore)
-   [`useInsertionEffect`](https://ru.reactjs.org/docs/hooks-reference.html#useinsertioneffect)

Конкурентный режим — это нововведение в React. Его задача — адаптировать приложение к разным устройствам и скорости сети. Пока что Concurrent Mode — эксперимент, который может быть изменён разработчиками библиотеки, а значит, новых инструментов нет в стабильной версии.

Сам конкурентный режим может ставить на рендер сразу несколько компонентов или ставить их на паузу определяя приоритет


```JS
import data from './data';
import {useState, useMemo} from 'react';

function App() {
    const [text, setText] = useState('');
    const [posts, setPosts] = useState(data);

    const filteredPosts = useMemo(() => {
        return posts.filter(item => item.name.toLowerCase().includes(text));
    }, [text]);

    const onValueChange = (e) => {
        setText(e.target.value);
    }

    return (
        <>
            <input value={text} type='text' onChange={onValueChange}/>

            <hr/>

            <div>
                {filteredPosts.map(post => (
                    <div key={post._id}>
                        <h4>{post.name}</h4>
                    </div>
                ))}
            </div>
        </>
    );
}

export default App;
```



![](_png/f22d0f508989c155656dfaf8105359fd.png)

И сейчас мы столкнулись с такой проблемой, что ввод в инпут очень сильно лагает. Дело в том, что наш стейт меняется сразу при вводе новых данных, что тормозит ввод новых символов из-за постоянного рендера

![](_png/b9b5467630baaa2689d2ddb470453d85.png)

`useDeferredValue()` - данный хук позволит получить нужное нам значение с небольшим интервалом, чтобы задержать рендер компонента

![](_png/35a67e2de341fabc00f476beac829bc8.png)

`useTransition()` - так же позволяет задержать перерендер компонента, но предоставляет возможность самому указать, что будет в интервале и как на него реагировать

Хук возвращает нам булеан ожидания рендера `isPending` и функцию, в которой будет находиться функция, которая выполняется длительное время. Далее нам нужно будет только сделать условный рендеринг, куда мы вставим спиннер (или другой элемент для ожидания загрузки)

![](_png/6945a9cefbcaebc0e4f63eec55830ce1.png)

И тут появляется элемент загрузки

![](_png/1166997b33f145d5bb9dfb5fd5f5c50b.png)
