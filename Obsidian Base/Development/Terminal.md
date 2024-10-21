---
tags:
  - "#terminal"
  - "#tmux"
  - lazygit
  - zsh
description:
---

>[!info] [Dotfiles](https://github.com/ZeiZel/dotfiles)

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

Либо можно воспользоваться kitty, который будет даже немного лучше тем, что поддерживает в себе отображение медиа-контента и более широко настраивается

`.config / kitty / kitty.conf`
```
# :vim set filetype=conf:
allow_remote_control yes
scrollback_pager bash -c "exec nvim 63<&0 0</dev/null -u NONE -c 'map <silent> q :qa!<CR>' -c 'set shell=bash scrollback=100000 termguicolors laststatus=0 clipboard+=unnamedplus' -c 'autocmd TermEnter * stopinsert' -c 'autocmd TermClose * call cursor(max([0,INPUT_LINE_NUMBER-1])+CURSOR_LINE, CURSOR_COLUMN)' -c 'terminal sed </dev/fd/63 -e \"s/'$'\x1b'']8;;file:[^\]*[\]//g\" && sleep 0.01 && printf \"'$'\x1b'']2;\"'"

font_family      JetBrainsMono Nerd Font
font_size 13.0

include ./kitty-themes/themes/Argonaut.conf

# enable_audio_bell no
bell_path pw-play /usr/share/sounds/freedesktop/stereo/bell.oga
bell_on_tab yes

single_window_margin_width -1
window_margin_width 5

remember_window_size  yes
draw_minimal_borders no

tab_bar_style slant

cursor_shape block
hide_window_decorations yes
macos_quit_when_last_window_closed yes

background_opacity         0.85
dynamic_background_opacity no

allow_remote_control yes
cursor_blink_interval 0
mouse_hide_wait 3

map kitty_mod+y show_scrollback

map kitty_mod+enter    launch --cwd=current
map kitty_mod+alt+t  set_tab_title
map kitty_mod+t        new_tab
map kitty_mod+d detach_tab         # moves the tab into a new OS window
map kitty_mod+f detach_window         # moves the window into a new OS window
map kitty_mod+alt+w close_window
map kitty_mod+w new_window


map kitty_mod+s launch --location=hsplit
map kitty_mod+x launch --location=vsplit
map kitty_mod+r layout_action rotate

map kitty_mod+h neighboring_window left
map kitty_mod+l neighboring_window right
map kitty_mod+k neighboring_window up
map kitty_mod+j neighboring_window down

map kitty_mod+alt+k move_window up
map kitty_mod+alt+h move_window left
map kitty_mod+alt+l move_window right
map kitty_mod+alt+j move_window down

# map kitty_mod+left resize_window narrower
# map kitty_mod+right resize_window wider
# map kitty_mod+up resize_window taller
# map kitty_mod+down resize_window shorter

enabled_layouts splits:split_axis=horizontal
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

Устанавливаем OMZSH

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

Далее устанавливаем [NVM](https://github.com/nvm-sh/nvm) и тему [powerlevel10k](https://github.com/romkatv/powerlevel10k/tree/master)

Далее нужно добавить данный конфиг для zsh

`~/.zshrc`
```bash
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

export ZSH="$HOME/.oh-my-zsh"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
ZSH_THEME="powerlevel10k/powerlevel10k"
source ~/powerlevel10k/powerlevel10k.zsh-theme

plugins=(git z docker fzf fzf-zsh-plugin zsh-autosuggestions history)

source $ZSH/oh-my-zsh.sh

alias ls="eza --tree --level=1 --icons=always --no-time --no-user --no-permissions"

export PATH="/usr/local/opt/openjdk/bin:$PATH"
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

# alias nvc="NVIM_APPNAME=nvchad nvim"
alias nv="nvim"

function nvims() {
  items=("default" "nv") 
  config=$(printf "%s\n" "${items[@]}" | fzf --prompt=" Neovim Config  " --height=~50% --layout=reverse --border --exit-0)
  if [[ -z $config ]]; then
    echo "Nothing selected"
    return 0
  elif [[ $config == "default" ]]; then
    config=""
  fi
  NVIM_APPNAME=$config nvim $@
}

function htt() {
  httpyac $1 --json -a | jq -r ".requests[0].response.body" | jq | bat --language=json
}

[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" 

# pnpm
export PNPM_HOME="/home/zeizel/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
```

И склонировать репозитории с плагинами `git z docker fzf thefuck zsh-autosuggestions history` (строчка `plugins = (...)`) в папку `~/.oh-my-zsh/custom/plugins`

```
https://github.com/nvbn/thefuck
https://github.com/zsh-users/zsh-autosuggestions
https://github.com/agkozak/zsh-z
https://github.com/unixorn/fzf-zsh-plugin
https://github.com/romkatv/powerlevel10k
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

#### NODE

Вся конфигурация уже есть в `.zshrc`, поэтому нам нужно просто установить NVM

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install <version>
npm i -g @nestjs/cli nx pnpm yarn npm-check-updates
pnpm setup
```

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
