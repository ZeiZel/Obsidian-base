
## Теория CI/CD

==CI== - ==Continuous integration== - Непрерывная интеграция
==CD== - ==Continuous delivery== - Непрерывное развёртывание

Пайплайн выглядит следующим образом:
- Планирование 
- Разработка
- Сборка
- Тестирование
- Релиз 
- Развёртывание
- Управление 
- Мониторинг

![](_png/fc6770195d5438037b9dfae8e36de5d2.png)

Пример:
- Менеджер присылает задачу
- Создаём ветку для создания новой фичи проекта
- Пишем код
- Далее создаём `pull`/`merge` `request` и отдаём код на ревью
- Если всё ок, то код можно заливать в мастер

Однако так же нужно было прогнать все проверки и тесты (разные линтеры, юниты, e2e и так далее). Однако это всё процесс очень долгий и выполнять его каждый раз самостоятельно - трудная задача

И тут в дело вступает CI. Она позволяет автоматизировать проведение всех проверок перед тем, как залить определённые изменения в ветку

![](_png/587da6e0250ff8bb518105b4d33e9635.png)

CD же представляет из себя `merge` всех изменений с основной веткой, сборку приложения и деплой этой сборки

## Рассматриваем реальный пример. Приступаем к практике. CI pipeline. Github actions

CI зачастую реализуется через сервисы по типу GitLab, Jenkins, BitBucket, GitHub Actions. 

Конкретно тут был описан файл, который будет при `push` и `pull` в главную ветку запускать `jobs` по указанной стратегии

Каждый шаг указывается в `steps`

`.github > workflows > github-actions-demo.yml`
```YML
name: GitHub Actions Demo
on:
    push:
        branches: [main]
    pull_request:
        branches: [main]
jobs:
    init:
        runs-on: ubuntu-latest
        strategy:
            matrix:
                node-version: [19.x]
        steps:
            - uses: actions/checkout@v3
            - name: Staring Node.js ${{ matrix.node-version }}
              uses: actions/setup-node@v3
              with:
                  node-version: ${{ matrix.node-version }}
            - name: install modules
              run: npm install
            - name: build project
              run: npm run build
            - name: build storybook
              run: npm run build:storybook
            - name: unit test
              run: npm run test:unit
            - name: e2e test
              run: npm run test:e2e
            - name: lint code
              run: npm run lint
```

Теперь остаётся только залить изменения в ветку

![](_png/b04a96c3173e5ec1afec5d623a267734.png)

Если мы словим ошибку, то гитхаб нам о ней даст знать

![](_png/2328eaee55a1f0cea93fd74fac0c0a45.png)

![](_png/cb368fbf07c7d206c70ea45fe6ea3851.png)

Если коммит пройдёт успешно, то будет указана галочка

![](_png/3aa7d9639c9330d8be729300fcd0d08b.png)

![](_png/005b6ebda88b2ecbec959018d6802deb.png)

## Настраиваем (CD) деплой приложения

Задеплоить приложение можно [сюда](https://app.netlify.com/)

Добавляем новый проект с нашего гитхаба и добавляем его в Нетлифай

![](_png/d13fe44fa4ebdf2421ac4679b2e10c6b.png)

Нетлифай берёт доступ к проекту на гитхабе и отслеживает его изменения, чтобы деплоить проект у себя автоматически

![](_png/df0772b75972ac2f5715d5d58ba7c589.png)

И по ссылке можно просмотреть приложение:

![](_png/994af9402604e8e53a6fbf2b6e7a2697.png)

