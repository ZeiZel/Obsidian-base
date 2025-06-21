---
tags:
  - "#terminal"
  - "#tmux"
  - lazygit
  - zsh
description:
---

>[!info] [Dotfiles](https://github.com/ZeiZel/dotfiles)

#### Brew

Далее устанавливаем [brew](https://brew.sh/)

````
brew install eza
````

#### NODE

Вся конфигурация уже есть в `.zshrc`, поэтому нам нужно просто установить NVM

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install <version>
npm i -g @nestjs/cli nx pnpm yarn bun npm-check-updates
pnpm setup
```
