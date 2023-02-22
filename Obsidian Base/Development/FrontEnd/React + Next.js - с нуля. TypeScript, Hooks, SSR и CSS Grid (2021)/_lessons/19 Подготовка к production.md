

## 001 Добавление meta на страницу

Очень важно в рамках SEO-оптимизации для каждой страницы правильно сгенерировать передачу информации в тайтл и дескрипшн страницы. Это поможет правильно ранжировать страницу в поиске, так как поисковик выбирает ключевые слова со страницы и потом уже по ним выводит страницу.

Первым делом настроим тайтл и дескрипшн. Будем выводить в компоненте некста `Head` информацию по странице. Эта информация генерируется на сервере, поэтому всё будет подставляться динамически

`pages / [type] / [alias].tsx`
```TSX
function TopPage({ firstCategory, page, products }: TopPageProps): JSX.Element {  
   return (  
      <>  
    {/* данный компонент позволит перезаписать мета-информацию страницы */}  
         <Head>  
            <title>{page.metaTitle}</title>  
            <meta name={'description'} content={page.metaDescription} />  
         </Head>  
         <TopPageComponent firstCategory={firstCategory} page={page} products={products} />;  
      </>  
   );  
}
```

![](_png/Pasted%20image%2020230222080705.png)

При передаче ссылки другому человеку в интернете некоторые ресурсы позволяют из ссылки вытащить определённые элементы, которые дополнят эту ссылку полезной информацией для пользователя.

Теги для передачи:
- `og:image` - изображение, которое будет браться для другого сайта
- `og:title` - заголовок
- `og:description` - описание

![](_png/Pasted%20image%2020230222080819.png)

Вот пример того, что можно получить с хабра при пересылке в вк:

![](_png/Pasted%20image%2020230222081415.png)

Далее для каждой отдельной страницы алиаса будут добавлены несколько тегов, которые позволят отобразить содержание страницы:
- `og:title`
- `og:description`
- `og:type` - позволит описать назначение страницы

`pages / [type] / [alias].tsx`
```TSX
function TopPage({ firstCategory, page, products }: TopPageProps): JSX.Element {  
   return (  
      <>  
    {/* данный компонент позволит перезаписать мета-информацию страницы */}  
         <Head>  
            <title>{page.metaTitle}</title>  
            <meta name={'description'} content={page.metaDescription} />  
            <meta property={'og:title'} content={page.metaTitle} />  
            <meta property={'og:description'} content={page.metaDescription} />  
            <meta property={'og:type'} content={'article'} />  
         </Head>  
         <TopPageComponent firstCategory={firstCategory} page={page} products={products} />;  
      </>  
   );  
}
```

Так же в компоненте страниц нужно указать мета-теги, которые будут распространятся на все страницы в приложении:
- `og:url` - будет генерировать в нашем случае ссылку до страницы, которая будет использоваться для перехода на наш ресурс 
- `og:locale` - скажет, что сайт построен на русском языке

`pages / _app.tsx`
```TSX
function MyApp({ Component, pageProps, router }: AppProps): JSX.Element {  
   return (  
      <>  
         <Head>  
            <title>MyTop - наш лучший топ</title>  
            <link rel='icon' href='/favicon.ico' />  
            <link rel='preconnect' href='https://fonts.gstatic.com' />  
            <link  
               href='https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap'  
               rel='stylesheet'  
            />  
            {/* сюда уже помещаем ссылку на страницу и через роутер получаем путь до открытой страницы */}  
            <meta  
               property={'og:url'}  
               content={process.env.NEXT_PUBLIC_DOMAIN + router.asPath}  
            />  
            {/* тут уже просто указываем язык страницы */}  
            <meta property={'og:locale'} content={'ru_RU'} />  
         </Head>  
         <Component {...pageProps} />  
      </>  
   );  
}
```

И теперь все добавленные опенграф теги можно увидеть на странице

![](_png/Pasted%20image%2020230222082531.png)

## 002 Установка метрики

Первым делом нужно установить в проект зависимость яндекс-метрики

```bash
npm i react-yandex-metrika
```

Яндекс метрика является достаточно тяжёлым дополнительным функционалом в программу, что замедлит работу приложения в целом. Однако мы можем немного оптимизировать его работу.

Функция `ym` производит подсчёт каунтера при определённых условиях. Конкретно мы будем её триггерить при изменении страницы на фронте.

Далее идёт компонент `YMInitializer` который в целом инициализирует работу с метрикой.

`pages / _app.tsx`
```TSX
import ym from 'react-yandex-metrika'; // каунтер  
import { YMInitializer } from 'react-yandex-metrika'; // инициализирует работу с метрикой

function MyApp({ Component, pageProps, router }: AppProps): JSX.Element {  
   // далее при удачном событии изменении пути роута  
   router.events.on('routeChangeComplete', (url: string) => {  
      // проверяем, что мы не на сервере  
      if (typeof window !== 'undefined') {  
         // и тут выполняем событие hit перехода на определённый url  
         ym('hit', url);  
      }  
   });  
  
   return (  
      <>  
         <Head>  
            <title>MyTop - наш лучший топ</title>  
            <link rel='icon' href='/favicon.ico' />  
            <link rel='preconnect' href='https://fonts.gstatic.com' />  
            <link rel='preconnect' href='https://mc.yandex.ru' />  
            <link  
               href='https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap'  
               rel='stylesheet'  
            />  
            <meta  
               property={'og:url'}  
               content={process.env.NEXT_PUBLIC_DOMAIN + router.asPath}  
            />  
            <meta property={'og:locale'} content={'ru_RU'} />  
         </Head>  
         {/* сама инициализация яндекс-метрики */}  
         <YMInitializer  
            // массив id счётчиков метрики  
            accounts={[]}  
            // далее передаём опции  
            // первый параметр позволит просматривать статистику посещений, а второй откладывает метрику до загрузки приложения            
            options={{ webvisor: true, defer: true }}  
            // так же можно указать версию счётчика  
            version={'2'}  
         />  
         <Component {...pageProps} />  
      </>  
   );  
}
```

## 003 Husky

Husky - если говорить грубо, то это хуки для гита. Мы можем подписаться на определённые действия с гитом (на те же коммиты) и выполнять определённые действия внутри нашего проекта (например, прогон линтеров)

Устанавливаем husky:

```bash
npm i -D husky
```

Далее нужно установить скрипт `prepare`, который установит нам хаски в проект:

```JSON
"scripts": {  
   "prepare": "husky install",  
   "dev": "next dev",  
   "debug": "NODE_OPTIONS='--inspect' next dev",  
   "build": "next build",  
   "start": "next start",  
   "stylelint": "stylelint \"**/*.css\" --fix"
},
```

Запускаем его и получаем папку с `.husky`:

```bash
npm run prepare
```

Далее мы можем добавить файл, который будет содержать команды, выполняемые в определённый промежуток через выполнение хаски.
Конкретно тут мы добавляем процедуру, которая будет выполняться перед коммитом 

```bash
npx husky add .husky/pre-commit "npm test"
```

![](_png/Pasted%20image%2020230222085554.png)

Поменяем тест на выполнение команды стайллинта. И теперь перед каждым коммитом будет прогоняться стайллинт.

```
#!/usr/bin/env sh  
. "$(dirname -- "$0")/_/husky.sh"  
  
npm run stylelint
```

## 004 Next export











## 005 Страницы 404, 500











## 006 Сборка контейнера Docker











## 007 Запуск через docker-compose











## 008 Github actions






