
Это тот файл приложения, который будет шэриться через `json-server` и от которого будут выводиться новые посты

`heroses.json`
```JSON
{
    "heroes": [
        {
            "id": 1,
            "name": "Первый герой",
            "description": "Первый герой в рейтинге!",
            "element": "fire"
        },
        {
            "id": 2,
            "name": "Неизвестный герой",
            "description": "Скрывающийся в тени",
            "element": "wind"
        },
        {
            "id": 3,
            "name": "Морской герой",
            "description": "Как аквамен, но не из DC",
            "element": "water"
        }
    ],
    "filters": [
        "all",
        "fire",
        "water",
        "wind",
        "earth"
    ]
}
```

Стор редакса

`src > store > index.js`
```JS
import { createStore } from 'redux';
import reducer from '../reducers';

const store = createStore(reducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

export default store;
```

Редьюсер редакса. Пока он один, но в дальнейшем будет пополняться их количество

`src > reducer > index.js`
```JS
const initialState = {
    heroes: [],
    heroesLoadingStatus: 'idle',
    filters: []
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'HEROES_FETCHING':
            return {
                ...state,
                heroesLoadingStatus: 'loading'
            }
        case 'HEROES_FETCHED':
            return {
                ...state,
                heroes: action.payload,
                heroesLoadingStatus: 'idle'
            }
        case 'HEROES_FETCHING_ERROR':
            return {
                ...state,
                heroesLoadingStatus: 'error'
            }
        default: return state
    }
}

export default reducer;
```

А уже тут описаны экшены редакса

`src > actions > index.js`
```JS
export const heroesFetching = () => {
    return {
        type: 'HEROES_FETCHING'
    }
}

export const heroesFetched = (heroes) => {
    return {
        type: 'HEROES_FETCHED',
        payload: heroes
    }
}

export const heroesFetchingError = () => {
    return {
        type: 'HEROES_FETCHING_ERROR'
    }
}
```

Хук отправки запроса на сервер будет возвращать один ответ от сервера

`src > hooks > http.hook.js`
```JS
import { useCallback } from "react";

export const useHttp = () => {
    // const [process, setProcess] = useState('waiting');

    const request = useCallback(async (url, method = 'GET', body = null, headers = {'Content-Type': 'application/json'}) => {

        // setProcess('loading');

        try {
            const response = await fetch(url, {method, body, headers});

            if (!response.ok) {
                throw new Error(`Could not fetch ${url}, status: ${response.status}`);
            }

            const data = await response.json();

            return data;
        } catch(e) {
            // setProcess('error');
            throw e;
        }
    }, []);

    // const clearError = useCallback(() => {
        // setProcess('loading');
    // }, []);

    return {
	    request, 
		// clearError, 
		// process, 
		// setProcess
    }
}
```

Тут уже располагается вся основная часть приложения

`src > index.js`
```JS
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from './components/app/App';
import store from './store';

import './styles/index.scss';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

Это основной компонент `App`

`src > components > app > App.js`
```JS
import HeroesList from '../heroesList/HeroesList';
import HeroesAddForm from '../heroesAddForm/HeroesAddForm';
import HeroesFilters from '../heroesFilters/HeroesFilters';

import './app.scss';

const App = () => {
    
    return (
        <main className="app">
            <div className="content">
                <HeroesList/>
                <div className="content__interactive">
                    <HeroesAddForm/>
                    <HeroesFilters/>
                </div>
            </div>
        </main>
    )
}

export default App;
```







