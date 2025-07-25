
Условно за `leader` в tmux отвечает сочетание `ctrl + b`. В конфиге сочетание изменится на `ctrl + a`.

Первым делом нужно установить сам плагин

```bash
brew install tmux
```

Далее нужно будет скопировать пакетный менеджер tmux

```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

Потом нужно удалить все сессии tmux

```bash
tmux
tmux kill-server
```

Далее нужно будет скопировать конфиг в корень `~/.tmux.conf`

Для установки всех плагинов нужно использовать: `tmux` и потом `leader + shift + i`.

Переход в tmux осуществляется следующей одноимённой командой

```bash
tmux
```

`leader + s` - открывает окно с сессиями терминалов. В нижнем окне можно кратко просмотреть сессию.

Одним из способов создать новую сессию может стать ввод в этом окне команды `:new -s <имя>`

Чтобы переименовать сессию так же можно воспользоваться `leader + $`

`leader + shift + c` - создание новой сессии (сразу с вводом имени сессии) - благодаря плагину `sessionist`

![](_png/22337201b17addeb61f61c96e59af9f4.png)

`leader + p/n` - переход к предыдущей/следующей вкладке
`leader + shift + c` - создание новой сессии
`leader + n/p` - переключение вкладок вперёд/назад
`leader + shift ) или (` - переключение между сессиями
`leader + g` - позволяет включить поиск нужной сессии. Нужно, чтобы долго не искать нужную
`leader + ,` - переименование вкладки

![](_png/0db4f77e7cb49073def90a89bb19f4d4.png)

`leader + c` - создать новую вкладку
`leader + 0...9` - перейти в нужную вкладку

![](_png/35b24abf4905b5470cd63e42f0165394.png)

Так же кроме ==сессий== и ==вкладок== мы можем делать ==сплиты== с помощью `leader + | и -` (кастомные сочетания)

Через `ctrl + hjkl` мы можем переключаться между окнами, а с помощью `leader + hjkl` мы можем менять размер сплита

`ctrl + d` - удалит сплит

![](_png/6c20a6f99533e47b7762423741108825.png)

`leader + ctrl + s` - сохранение текущего окружения

![](_png/56933fca743301dc3c0c9c258fac7767.png)

##### Команды tmux

Удаление сессии

`tmux kill-session -t <имя>` - удаление сессии
`tmux kill-server` - удаление сервера tmux
