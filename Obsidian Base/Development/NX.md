
## Имплементация монорепы

Сейчас будет пример создания трёх приложений и двух библиотек
  
- Два приложения React: клиентское и административное.  
- Библиотека React с именем common-components, которая будет содержать компоненты, совместно используемые проектами React
- А Node.js сервер с именем backend
- Библиотека TypeScript с именами функций, которые будут использоваться серверной частью

## Установка

Чтобы создать базовый проект с NX, нам нужно создать workspace, в котором у нас будут находиться проекты

```bash
npx create-nx-workspace@latest <project>
```

У нас в процессе создания монорепы будет возможность выбрать установку для одного проекта и для моддержки монорепозитория. Среда для одного проекта скорее нужна только для оптимизации загрузки пакетов, сборки билдов и CI/CD

![](_png/Pasted%20image%2020240619195230.png)

Далее нам нужно установить пакеты, которые будут контролировать проекты с определёнными технологиями (установили и добавили в окружение пакеты для работы с нодой, экспрессом, нестом, некстом и реакт). Каждый из этих пакетов предоставляет дополнительные возможности для CLI по установке новых приложений.

```bash
# Установит nextjs приложение
nx add @nx/next
# Другие популярные сетапы
nx add @nx/react 
nx add @nx/express 
nx add @nx/nest 
nx add @nx/node
```

После ввода данной команды мы создаём второй проект. Проекты создаются через вызов установленного проекта `@nx/react` с флагом `:app`. После этого проект с React создастся в папке `apps/admin`, а в `apps/backend` проект с нодой

```bash
npx nx g @nx/react:app admin
npx nx g @nx/node:app backend
```

Чтобы создать библиотеку для React-проектов, нам нужно задать через пакет `@nx/react` с флагом `:lib` папку с распространяемыми компонентами. Флаг `:lib` создаёт проект с шейребл компонентами приложения под выбранный стек пакета. Конкретно тут можно расположить общие компоненты для нескольких проектов и они будут собираться из конфига, который находится внутри папки `lib/common-components`  

```
npx nx g @nx/react:lib common-components
```

Данная команда создаст общие для всех проектов компоненты 

```
npx nx g @nx/js:lib functions
```

И на данный момент мы имеем следующую структуру:

```
|__ apps
|    |__ admin
|    |__ admin-e2e
|    |__ backend
|    |__ backend-e2e
|    |__ customer
|    |__ customer-e2e
|__ libs
|    |__ custom-components
|    |__ functions
```

Так же мы можем отобразить граф взаимосвязей в проекте

```
npx nx graph
```
![](_png/Pasted%20image%2020240619205026.png)

Далее мы можем воспользоваться встроенным генератором из nx и сделать react-компонент, который будет доступен сразу в обоих наших react-проектах 

```bash
npx nx g @nx/react:component header \
--project=common-components --export
```

`libs/common-components/src/lib/header/header.tsx`
```TSX
import styles from './header.module.css';

/* eslint-disable-next-line */
export interface HeaderProps {
  text: string;
}

export function Header(props: HeaderProps) {
  return (
    <header>{props.text}</header>
  );
}

export default Header;
```

Сразу нужно сказать, что все пакеты, которые мы устанавливаем на несколько проектов используются во всех наших приложениях. Тут стоит аккуратнее выбирать зависимости, потому что они будут одинаковы для всех пакетов

```
npm install axios cors date-fns
```

Далее нам нужно немного сделать тестовое приложение, которое будет иметь взаимосвязи внутри монорепозитория

`apps/admin/src/app/app.tsx`
```TSX
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';

import { Header } from '@myorg/common-components';
import { useEffect, useState } from 'react';

import axios from 'axios';

export function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/admin').then((response) => {
      setMessage(response.data);
    });
  }, []);

  return (
    <div>
      <Header text="Welcome to admin!" />
      <p>{message}</p>
    </div>
  );
}

export default App;
```
`apps/customer/src/app/app.tsx`
```TSX
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';

import { Header } from '@myorg/common-components';
import { useEffect, useState } from 'react';

import axios from 'axios';

export function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/customer').then((response) => {
      setMessage(response.data);
    });
  }, []);

  return (
    <div>
      <Header text="Welcome to customer!" />
      <p>{message}</p>
    </div>
  );
}

export default App;
```

`libs/functions/src/lib/functions.ts`
```TS
import { format } from 'date-fns';

export function currentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
```

`apps/backend/src/main.ts`
```TS
import express from 'express';
import { currentDate } from '@myorg/functions';
import cors from 'cors';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use(cors({ origin: '*' }));

app.get('/customer', (req, res) => {
  res.send(`[ customer ] ${currentDate()}`);
});

app.get('/admin', (req, res) => {
  res.send(`[ admin ] ${currentDate()}`);
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
```

И теперь мы имеем следующие зависимости

![](_png/Pasted%20image%2020240619210139.png)

Далее в разных терминалах мы можем засёрвить наши приложения

```
npx nx serve backend
npx nx serve admin
npx nx serve customer
```

![](_png/Pasted%20image%2020240619210406.png)

## Механизм отслеживания изменений

С помощью гита выделяем изменения в проекте

```bash
git add .
git commit -m "Initial commit"
```

Далее мы можем запустить проверку графом, какие элементы системы были подвержены изменениям

```bash
npx nx affected:graph
```

![](_png/Pasted%20image%2020240619210808.png)

Данная команда позволяет произвести тестирование на те компоненты, которые были подвержены изменениям

```bash
npx nx affected -t test
```


