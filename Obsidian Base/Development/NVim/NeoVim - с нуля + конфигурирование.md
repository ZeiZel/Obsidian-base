
## Введение

Vim - это консольный редактор

Его можно как запустить удалённом сервере и уже поднять внутри него свою конфигурацию, так и просто импортировать конфигурацию удобно и быстро на любой другой компьютер 

![](_png/Pasted%20image%2020240901115145.png)

Стоит различать, что vim-motions и vim-редактор - это две разные сущности, которые можно отделить друг от друга. Те же моушены можно использовать в любой IDE или редакторе через плагины, потому что это целый подход к работе с текстом.

![](_png/Pasted%20image%2020240901115203.png)

## Настройка окружения

### Vim или NVim

Vim:
- присутствует из коробки во многих системах
- у него только один простой конфигурационный файл

NeoVim:
- Конфигурируется на lua, который проще vimscript и предоставляет возможность разнести разные группы по разным файлам 
- Является многопоточным и ускоренным за счёт libuv
- Имеет больше плагинов
- Имеет широкую базу различных удобных сборок

![](_png/Pasted%20image%2020240901123734.png)

### Выбор терминала

Самый универсальный вариант - Alacritty. Он работает под любой ОС.

![](_png/Pasted%20image%2020240901125018.png)

### Настройка терминала

По пути нам нужно будет создать конфиг для alacritty

`~/.config/alacritty/alacritty.toml`
```bash
[env]
TERM = "xterm-256color"

[font]
size = 13.0

[font.normal]
family = "JetBrainsMono Nerd Font"
style = "Regular"

[window]
decorations = "Buttonless"
opacity = 0.92
blur = true

[window.padding]
x = 0
y = 0

[selection]
save_to_clipboard = true
```

Далее устанавливаем zsh на нашу систему, если не установлен и указываем в качестве дефолтного терминала

```bash
sudo apt install zsh
chsh -s $(which zsh)
```

Далее нужно добавить данный конфиг для zsh

`~/.zshrc`
```bash
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi


# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"
export KUBECONFIG=/Users/alaricode/.kube/purple-cluster_kubeconfig.yaml
export NVM_DIR="$HOME/.nvm"
  [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"
ZSH_THEME="powerlevel10k/powerlevel10k"

plugins=(git z docker fzf thefuck zsh-autosuggestions history)

source $ZSH/oh-my-zsh.sh

if [ -f '/Users/alaricode/vk-cloud-solutions/path.bash.inc' ]; then source '/Users/alaricode/vk-cloud-solutions/path.bash.inc'; fi

# bun completions
[ -s "/Users/alaricode/.bun/_bun" ] && source "/Users/alaricode/.bun/_bun"
alias ls="eza --tree --level=1 --icons=always --no-time --no-user --no-permissions"

export PATH="/usr/local/opt/openjdk/bin:$PATH"
export PATH="/Users/alaricode/.cargo/bin"
export PATH=/bin:/usr/bin:/usr/local/bin:/sbin:${PATH}
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

eval "$(fzf --zsh)"
function yy() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
	yazi "$@" --cwd-file="$tmp"
	if cwd="$(cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
		cd -- "$cwd"
	fi
	rm -f -- "$tmp"
}

function htt() {
  httpyac $1 --json -a | jq -r ".requests[0].response.body" | jq | bat --language=json
}

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
```

И склонировать репозитории с плагинами `git z docker fzf thefuck zsh-autosuggestions history` (строчка `plugins = (...)`) в папку `~/.oh-my-zsh/custom/plugins`

```
https://github.com/nvbn/thefuck?tab=readme-ov-file#installation
https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md#homebrew
https://github.com/agkozak/zsh-z
https://github.com/unixorn/fzf-zsh-plugin?tab=readme-ov-file#oh-my-zsh

https://github.com/romkatv/powerlevel10k?tab=readme-ov-file#oh-my-zsh
```

````
brew install eza
````

### Установка NVim





### Создание первого файла





## Базовые motion

### Режимы
### Создание первого файла
### Базовые перемещения
### Как практиковаться
### Комбинации движений
### Продвинутое перемещние
### Перемещение по блокам
### Файлы и buffers







## Удаление и копирование

### Удаление текста
### inside и around
### Копирование и вставка
### Регистры









## Преобразование текста

### Замена текста
### Поиск по буферу
### Замена в файле








## Visual mode и макросы

### Visual Mode
### Изменение регистра
### V-Line Mode
### V-Block Mode
### Макросы







## Основы lua

### Установка

### Переменные

### Циклы

### Ветвления

### Функции

### Tables

### Модули








## Конфигурация

### Путь конфигурации
### Структура конфигурации
### Базовые настройки
### Сочетания клавиш
### Split окон
### Менеджер плагинов
### Тема







## Плагины UI

### Neotree
### Bufferline
### Lualine
### Telescope
### Доработка цветов
### Терминал








## Плагины для разработки

### Cmp
### LSP
### Mason
### Ensure install
### Стилизация
### Treesitter
### Быстрый переход
### Dressing
### Trouble
### Formatting
### Linting








## Продвинутая работа

### Версионирование
### Git плагины
### Leap
### Which key
### Несколько сборок NVim
### Dashboard
















