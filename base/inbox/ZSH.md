
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

![](Development/_png/Pasted%20image%2020240817200033.png)

Так же вместе с OMZsh у нас установилась утилита `z`, которая хранит пути до наших репозиториев в проекте. То есть она может позволить нам ввести только `z <имя_репозитория>`, чтобы найти определённый проект с git (по нему и производится поиск) внутри себя.

![](Development/_png/Pasted%20image%2020240929131323.png)
