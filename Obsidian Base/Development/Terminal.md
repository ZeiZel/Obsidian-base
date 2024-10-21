---
tags:
  - "#terminal"
  - "#tmux"
  - lazygit
  - zsh
---

#### Alacritty

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

#### Kitty


`.config / kitty / kitty.conf`
```

```

#### ZSH

ZSH - Z Shell - оболочка командной строки, которая предоставляет более широкий выбор инструментария, чем Bash


- Более полное контекстное завершение файловых имен и команд
- Предоставление возможных команд по tab юзеру возможные значения
- Поддержка плагинов: позволяет расширять функционал оболочки сторонними плагинами, которые создает комьюнити
- Поддержка разнообразных тем
- Кастомизация при помощи скриптов O my Zch

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

`ctrl+r` - включает поиск по командам

![](_png/Pasted%20image%2020240817200033.png)

Так же вместе с OMZsh у нас установилась утилита `z`, которая хранит пути до наших репозиториев в проекте. То есть она может позволить нам ввести только `z <имя_репозитория>`, чтобы найти определённый проект с git (по нему и производится поиск) внутри себя.

![](_png/Pasted%20image%2020240929131323.png)

#### Brew

Далее устанавливаем [brew](https://brew.sh/)

````
brew install eza
````

#### Yazi

Далее нам очень поможет в перемещении по файловой структуре утилита `yazi`, которая построена на моушенах вима.

```
brew install yazi ffmpegthumbnailer sevenzip jq poppler fd ripgrep fzf zoxide imagemagick
```

`config / yazi / yazi.toml`
```toml
[opener]
edit = [
	{ run = 'nvim "$@"', block = true },
]
```

Через `o` yazi откроет файл в neovim. 
Так же выход из yazi будет в ту самую папку, где мы остановились в утилите.
Картинки можно отображать в треминале kitty, который поддерживает такой функционал.

![](_png/Pasted%20image%2020240929132638.png)




## TMUX

Условно за `leader` в tmux отвечает сочетание `ctrl + b`. В конфиге сочетание изменится на `ctrl+a`.

Первым делом нужно установить сам плагин

```bash
brew isntall tmux
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

Далее нужно будет скопировать конфиг

`~/.tmux.conf`
```bash
set -g default-terminal "screen-256color"

# Основной префикс
set -g prefix C-a

# Сортировка по имени
bind s choose-tree -sZ -O name

# Изменение индексов
set -g base-index 1
setw -g pane-base-index 1

# Переназначение клавиш
unbind %
bind | split-window -h # | разделит вертикально

unbind '"'
bind - split-window -v # - разделит горизонтально

unbind r
bind r source-file ~/.tmux.conf

bind -r j resize-pane -D 5
bind -r k resize-pane -U 5
bind -r l resize-pane -R 5
bind -r h resize-pane -L 5

bind -r m resize-pane -Z

set -g mouse on

set-window-option -g mode-keys vi

bind-key -T copy-mode-vi 'v' send -X begin-selection 
bind-key -T copy-mode-vi 'y' send -X copy-selection 

unbind -T copy-mode-vi MouseDragEnd1Pane
# Плагины
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
## бесшовное переключение между окнами вима и tmux
set -g @plugin 'christoomey/vim-tmux-navigator'
## настройка красивой сессии
set -g @plugin 'jimeh/tmux-themepack'
# следующие 3 плагина сохраняют сессии даже после перезагрузки ПК
set -g @plugin 'tmux-plugins/tmux-resurrect' 
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @plugin 'tmux-plugins/tmux-sessionist'

set -g @themepack 'powerline/default/purple'

set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'

# Старт менеджера плагинов
run '~/.tmux/plugins/tpm/tpm'
```

Для установки всех плагинов нужно использовать: `tmux` и потом `leader + shift + i`.

Переход в tmux осуществляется следующей одноимённой командой

```bash
tmux
```

`leader + s` - открывает окно с сессиями терминалов. В нижнем окне можно кратко просмотреть сессию.

Одним из способов создать новую сессию может стать ввод в этом окне команды `:new -s <имя>`

Чтобы переименовать сессию так же можно воспользоваться `leader + $`

`leader + shift + c` - создание новой сессии (сразу с вводом имени сессии) - благодаря плагину `sessionist`

![](_png/Pasted%20image%2020240724202854.png)

`leader + p/n` - переход к предыдущей/следующей вкладке
`leader + shift + c` - создание новой сессии
`leader + n/p` - переключение вкладок вперёд/назад
`leader + shift ) или (` - переключение между сессиями
`leader + g` - позволяет включить поиск нужной сессии. Нужно, чтобы долго не искать нужную
`leader + ,` - переименование вкладки

![](_png/Pasted%20image%2020240724204855.png)

`leader + c` - создать новую вкладку
`leader + 0...9` - перейти в нужную вкладку

![](_png/Pasted%20image%2020240724204528.png)

Так же кроме ==сессий== и ==вкладок== мы можем делать ==сплиты== с помощью `leader + | и -` (кастомные сочетания)

Через `ctrl + hjkl` мы можем переключаться между окнами, а с помощью `leader + hjkl` мы можем менять размер сплита

`ctrl + d` - удалит сплит

![](_png/Pasted%20image%2020240724205201.png)

`leader + ctrl + s` - сохранение текущего окружения

![](_png/Pasted%20image%2020240724202652.png)

##### Команды tmux

Удаление сессии

`tmux kill-session -t <имя>` - удаление сессии
`tmux kill-server` - удаление сервера tmux
