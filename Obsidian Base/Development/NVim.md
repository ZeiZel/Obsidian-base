
>[!summary] Писать в виме - это как использовать определённый язык программирования. Мы общаемся с Вимом, используя определённый синтаксис. `d2w` может расшировываться, как `delete 2 words`, что является понятным путём для редактирования текста. Каждое сочетание в виме переводится определённым полноценным словом, которое описывает действие клавиши. 

## Настройка терминала

В качестве базы будет использоваться Alacrity

Для него нам нужно будет создать конфиг:

`~/.config/alacritty/alacritty.toml`
```bash
[env]
TERM = "xterm-256color"

[window]
padding.x = 20
padding.y = 20

decorations = "Buttonless" 
opacity = 0.92
blur = true

[font]
normal.family = "JetBrainsMono Nerd Font"
size = 22.0
```

Далее устанавливаем zsh на нашу систему, если не установлен и указываем в качестве дефолтного терминала

```bash
sudo apt install zsh
chsh -s $(which zsh)
```

Далее нужно добавить данный конфиг для zsh

`~/.zshrc`
```rc
# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi


# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"
export KUBECONFIG=/Users/alaricode/.kube/purple-cluster_kubeconfig.yaml
export NVM_DIR="$HOME/.nvm"
  [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
# Set name of the theme to load --- if set to "random", it will
# load a random theme each time oh-my-zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
# ZSH_THEME="robbyrussell"
ZSH_THEME="powerlevel10k/powerlevel10k"

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in $ZSH/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior
# zstyle ':omz:update' mode disabled  # disable automatic updates
# zstyle ':omz:update' mode auto      # update automatically without asking
# zstyle ':omz:update' mode reminder  # just remind me to update when it's time

# Uncomment the following line to change how often to auto-update (in days).
# zstyle ':omz:update' frequency 13

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# You can also set it to another string to have that shown instead of the default red dots.
# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"
# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git z docker fzf thefuck zsh-autosuggestions history)

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

# The next line updates PATH for client-keystone-auth.
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

## Настройки VIM (nvchad)

Конфиг находится в `~./.config/nvim`

Первым делом, зададим строкам диагностики дополнительные иконки из наших иконок шрифтов. Позволить себе мы это можем, так как используем `nerd font` и вставляем нужные иконки под нужный тип сообщения.

`lua > options.lua`
```lua
require "nvchad.options"

-- основные знаки, которыми будут подсвечиваться сообщения
local signs = { Error = " ", Warn = " ", Hint = "", Info = " " }
-- логика использования иконок
for type, icon in pairs(signs) do
  local hl = "DiagnosticSign" .. type
  vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = hl })
end
```

Тут уже находится конфиг самого `nvchad`, котоырй достаточно просто настраивать

`lua > chadrc.lua`
```lua
-- This file  needs to have same structure as nvconfig.lua
-- https://github.com/NvChad/NvChad/blob/v2.5/lua/nvconfig.lua

---@type ChadrcConfig
local M = {}

M.ui = {
  theme = "github_dark",
  transparency = true,
  statusline = {
    theme = "vscode_colored",
  },
  nvdash = {
    load_on_startup = true,
    header = {
      "Welcome home, Varery",
      "Thanks for nice <...>"
    },
  },

  hl_override = {
    Comment = { italic = true },
    ["@comment"] = { italic = true },
    DiffChange = {
      bg = "#464414",
      fg = "none",
    },
    DiffAdd = {
      bg = "#103507",
      fg = "none",
    },
    DiffRemoved = {
      bg = "#461414",
      fg = "none",
    },
  },
}

return M
```

Настройки форматтиеров чада

`lua > configs > conform.lua`
```lua
local options = {
  formatters_by_ft = {
    lua = { "stylua" },
    css = { "prettier" },
    html = { "prettier" },
    javascript = { "prettier" },
    typescript = { "prettier" },
    typescriptreact = { "prettier" },
    javascriptreact = { "prettier" },
  },

  format_on_save = {
    -- These options will be passed to conform.format()
    timeout_ms = 500,
    lsp_fallback = true,
  },
}

require("conform").setup(options)
```

Далее идёт конфиг для еслинта. Тут используется eslint, который дёргается даемоном, чтобы работал немного быстрее.

`lua > configs > lint.lua`
```lua
require("lint").linters_by_ft = {
  javascript = { "eslint_d" },
  typescript = { "eslint_d" },
  typescriptreact = { "eslint_d" },
  javascriptreact = { "eslint_d" },
}

vim.api.nvim_create_autocmd({ "BufWritePost" }, {
  callback = function()
    require("lint").try_lint()
  end,
})
```

И тут находится оверрайды для типов поддерживаемых наших файлов

`lua > configs > overrides.lua`
```lua
local M = {}

M.treesitter = {
  ensure_installed = {
    "vim",
    "lua",
    "html",
    "css",
    "javascript",
    "typescript",
    "tsx",
    "c",
    "markdown",
    "markdown_inline",
    "prisma",
    "go",
  },
  indent = {
    enable = true,
  },
}

M.mason = {
  ensure_installed = {
    "lua-language-server",
    "css-lsp",
    "html-lsp",
    "typescript-language-server",
    "deno",
    "prettier",
    "eslint_d",
    "clangd",
    "clang-format",
    "node-debug2-adapter",
    "gopls",
    "gradle_ls",
  },
}

-- git support in nvimtree
M.nvimtree = {
  git = {
    enable = true,
  },

  renderer = {
    highlight_git = true,
    icons = {
      show = {
        git = true,
      },
    },
  },
}

return M
```

Тут находится конфиг lsp серверов для нашего конфига. 

lsp - это сервер языка, который анализирует код и предоставляет автокомплиты.

`lua > configs > lspconfig.lua`
```lua
local configs = require("nvchad.configs.lspconfig")

local on_attach = configs.on_attach
local on_init = configs.on_init
local capabilities = configs.capabilities

local lspconfig = require "lspconfig"

-- if you just want default config for the servers then put them in a table
local servers = { "html", "cssls", "tsserver", "clangd", "gopls", "gradle_ls" }

local function organize_imports()
  local params = {
    command = "_typescript.organizeImports",
    arguments = { vim.api.nvim_buf_get_name(0) },
  }
  vim.lsp.buf.execute_command(params)
end

for _, lsp in ipairs(servers) do
  lspconfig[lsp].setup {
    on_attach = on_attach,
    capabilities = capabilities,
    commands = {
      OrganizeImports = {
        organize_imports,
        description = "Organize Imports",
      },
    },
    settings = {
      gopls = {
        completeUnimported = true,
        usePlaceholders = true,
        analyses = {
          unusedparams = true,
        }
      }
    }
  }
  lspconfig.prismals.setup {}
end
```

Настройка и добавление плагинов устроена достаточно просто. 

- Первым аргументом идёт `<имя автора>/<имя плагина>`
- Дальше ивент, при котором срабатывает плагин
- А в конце находится конфиг плагина. Сами конфиги лучше создавать в папке `configs`, чтобы не загромождать файл с плагинами   

`lua > plugins > init.lua`
```lua
return {
  {
    "stevearc/conform.nvim",
    event = "BufWritePre",
    config = function()
      require "configs.conform"
    end,
  },
  {
    "christoomey/vim-tmux-navigator",
    lazy = false,
    cmd = {
      "TmuxNavigateLeft",
      "TmuxNavigateDown",
      "TmuxNavigateUp",
      "TmuxNavigateRight",
      "TmuxNavigatePrevious",
    },
  },
  {
    "stevearc/dressing.nvim",
    lazy = false,
    opts = {},
  },
  {
    "neovim/nvim-lspconfig",
    config = function()
      require("nvchad.configs.lspconfig").defaults()
      require "configs.lspconfig"
    end,
  },
  { "nvim-neotest/nvim-nio" },
  {
    "williamboman/mason.nvim",
    opts = {
      ensure_installed = {
        "lua-language-server",
        "stylua",
        "html-lsp",
        "css-lsp",
        "prettier",
        "eslint-lsp",
        "gopls",
        "js-debug-adapter",
        "typescript-language-server",
      },
    },
  },

  {
    "nvim-treesitter/nvim-treesitter",
    opts = {
      ensure_installed = {
        "vim",
        "lua",
        "vimdoc",
        "html",
        "css",
        "typescript",
        "javascript",
        "go",
      },
    },
  },
  {
    "mfussenegger/nvim-lint",
    event = "VeryLazy",
    config = function()
      require "configs.lint"
    end,
  },
  {
    "neovim/nvim-lspconfig",
    config = function()
      require "configs.lspconfig"
    end,
  },
  {
    "windwp/nvim-ts-autotag",
    event = "VeryLazy",
    config = function()
      require("nvim-ts-autotag").setup()
    end,
  },
  {
    "max397574/better-escape.nvim",
    event = "InsertEnter",
    config = function()
      require("better_escape").setup()
    end,
  },
  -- {
  --   "jackMort/ChatGPT.nvim",
  --   event = "VeryLazy",
  --   config = function()
  --     require("chatgpt").setup {}
  --   end,
  --   dependencies = {
  --     "MunifTanjim/nui.nvim",
  --     "nvim-lua/plenary.nvim",
  --     "nvim-telescope/telescope.nvim",
  --   },
  -- },
  {
    "nvim-neotest/neotest",
    event = "VeryLazy",
    config = function()
      require("neotest").setup {
        adapters = {
          require "neotest-jest" {
            jestCommand = "npm test --",
            jestConfigFile = "jest.config.ts",
            env = { CI = true },
            cwd = function(path)
              return vim.fn.getcwd()
            end,
          },
        },
      }
    end,
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-treesitter/nvim-treesitter",
      "antoinemadec/FixCursorHold.nvim",
      "haydenmeade/neotest-jest",
    },
  },
  {
    "mfussenegger/nvim-dap",
    config = function()
      local ok, dap = pcall(require, "dap")
      if not ok then
        return
      end
      dap.configurations.typescript = {
        {
          type = "node2",
          name = "node attach",
          request = "attach",
          program = "${file}",
          cwd = vim.fn.getcwd(),
          sourceMaps = true,
          protocol = "inspector",
        },
      }
      dap.adapters.node2 = {
        type = "executable",
        command = "node-debug2-adapter",
        args = {},
      }
    end,
    dependencies = {
      "mxsdev/nvim-dap-vscode-js",
    },
  },
  {
    "rcarriga/nvim-dap-ui",
    config = function()
      require("dapui").setup()

      local dap, dapui = require "dap", require "dapui"

      dap.listeners.after.event_initialized["dapui_config"] = function()
        dapui.open {}
      end
      dap.listeners.before.event_terminated["dapui_config"] = function()
        dapui.close {}
      end
      dap.listeners.before.event_exited["dapui_config"] = function()
        dapui.close {}
      end
    end,
    dependencies = {
      "mfussenegger/nvim-dap",
    },
  },
  {
    "folke/neodev.nvim",
    config = function()
      require("neodev").setup {
        library = { plugins = { "nvim-dap-ui" }, types = true },
      }
    end,
  },
  { "tpope/vim-fugitive" },
  { "rbong/vim-flog", dependencies = {
    "tpope/vim-fugitive",
  }, lazy = false },
  { "sindrets/diffview.nvim", lazy = false },
  {
    "ggandor/leap.nvim",
    lazy = false,
    config = function()
      require("leap").add_default_mappings(true)
    end,
  },
  {
    "kevinhwang91/nvim-bqf",
    lazy = false,
  },
  {
    "folke/trouble.nvim",
    lazy = false,
    dependencies = { "nvim-tree/nvim-web-devicons" },
  },
  {
    "folke/todo-comments.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    lazy = false,
    config = function()
      require("todo-comments").setup()
    end,
  }, -- To make a plugin not be loaded
  {
    "Exafunction/codeium.vim",
    lazy = false,
  },
}
```

Дальше идёт конфиг маппингов, в котором можно задать под определённый режим определённую операцию. Первый блок - режим, второй - сочетание, третий - аналог. Дальше идёт описание команды, которое можно увидеть в окне подсказки (одиночное нажатие на клавишу действия и некоторое вреия удержания).

Так же в сам маппинг можно задать функцию, которая исполнится при его нажатии.

`lua > mappings.lua`
```lua
require "nvchad.mappings"

local map = vim.keymap.set

map("n", ";", ":", { desc = "CMD enter command mode" })
map("n", "<leader>w", "<cmd>w<CR>", { desc = "Save" })
map("n", "<leader>cx", function()
  require("nvchad.tabufline").closeAllBufs()
end, { desc = "Close All Buffers" })

map("n", "<leader>ft", "<cmd>TodoTelescope<CR>", { desc = "Find Todo" })
map("n", "\\", "<cmd>:vsplit <CR>", { desc = "Vertical Split" })
map("n", "<c-l>", "<cmd>:TmuxNavigateRight<cr>", { desc = "Tmux Right" })
map("n", "<c-h>", "<cmd>:TmuxNavigateLeft<cr>", { desc = "Tmux Left" })
map("n", "<c-k>", "<cmd>:TmuxNavigateUp<cr>", { desc = "Tmux Up" })
map("n", "<c-j>", "<cmd>:TmuxNavigateDown<cr>", { desc = "Tmux Down" })

-- Trouble

map("n", "<leader>qx", "<cmd>TroubleToggle<CR>", { desc = "Open Trouble" })
map("n", "<leader>qw", "<cmd>TroubleToggle workspace_diagnostics<CR>", { desc = "Open Workspace Trouble" })
map("n", "<leader>qd", "<cmd>TroubleToggle document_diagnostics<CR>", { desc = "Open Document Trouble" })
map("n", "<leader>qq", "<cmd>TroubleToggle quickfix<CR>", { desc = "Open Quickfix" })
map("n", "<leader>ql", "<cmd>TroubleToggle loclist<CR>", { desc = "Open Location List" })
map("n", "<leader>qt", "<cmd>TodoTrouble<CR>", { desc = "Open Todo Trouble" })

-- Tests
map("n", "<leader>tt", function()
  require("neotest").run.run()
end, { desc = "Run nearest test" })
map("n", "<leader>tf", function()
  require("neotest").run.run(vim.fn.expand "%")
end, { desc = "Run file test" })
map("n", "<leader>to", ":Neotest output<CR>", { desc = "Show test output" })
map("n", "<leader>ts", ":Neotest summary<CR>", { desc = "Show test summary" })

-- Debug
map("n", "<leader>du", function()
  require("dapui").toggle()
end, { desc = "Toggle Debug UI" })
map("n", "<leader>db", function()
  require("dap").toggle_breakpoint()
end, { desc = "Toggle Breakpoint" })
map("n", "<leader>ds", function()
  require("dap").continue()
end, { desc = "Start" })
map("n", "<leader>dn", function()
  require("dap").step_over()
end, { desc = "Step Over" })

-- Git
map("n", "<leader>gl", ":Flog<CR>", { desc = "Git Log" })
map("n", "<leader>gf", ":DiffviewFileHistory<CR>", { desc = "Git File History" })
map("n", "<leader>gc", ":DiffviewOpen HEAD~1<CR>", { desc = "Git Last Commit" })
map("n", "<leader>gt", ":DiffviewToggleFile<CR>", { desc = "Git File History" })

-- Terminal
map("n", "<C-]>", function()
  require("nvchad.term").toggle { pos = "vsp", size = 0.4 }
end, { desc = "Toogle Terminal Vertical" })
map("n", "<C-\\>", function()
  require("nvchad.term").toggle { pos = "sp", size = 0.4 }
end, { desc = "Toogle Terminal Horizontal" })
map("n", "<C-f>", function()
  require("nvchad.term").toggle { pos = "float" }
end, { desc = "Toogle Terminal Float" })
map("t", "<C-]>", function()
  require("nvchad.term").toggle { pos = "vsp" }
end, { desc = "Toogle Terminal Vertical" })
map("t", "<C-\\>", function()
  require("nvchad.term").toggle { pos = "sp" }
end, { desc = "Toogle Terminal Horizontal" })
map("t", "<C-f>", function()
  require("nvchad.term").toggle { pos = "float" }
end, { desc = "Toogle Terminal Float" })

-- Basic

map("i", "jj", "<ESC>")
map("i", "<C-g>", function()
  return vim.fn["codeium#Accept"]()
end, { expr = true })

-- map({ "n", "i", "v" }, "<C-s>", "<cmd> w <cr>")
```

После копирования данного конфига на другой ПК, нам нужно будет запустить

`:Lazy` -> `I` / `U` - для установки или обновления всех нужных компонентов `nvchad`
`:MasonInstallAll` - для установки всех нужных серверов и плагинов

![](_png/Pasted%20image%2020240709210928.png)

## NVIM

>[!danger] NVim не воспринимает русскую раскладку и с ней вообще не работает!

В Vim существует 5 режимов:
- normal - просмотр кода
- insert - вставка
	- `i` - войдёт в режим вставки перед текущей позицией курсора.
	- `shift + i` - войдёт в режим вставки в начале строки.
	- `a` - войдёт в режим вставки после текущей позиции курсора.
	- `shift + a` - войдёт в режим вставки в конце строки.
	- `o` - создаст новую строку ниже текущей и войдите в режим вставки.
	- `shift + o` - создаст новую строку выше текущей и войдёт в режим вставки.
	- `r` - заменит текущий символ (без перехода в режим вставки).
	- `shift + r` - войдёт в режим замены, где можно будет заменять символы непосредственно.
- visual - выделение кода
	- `v` - войдёт в режим визуального выделения для выделения текста.
- visual-line - выделение в рамках одной строки
	- `V` - войдёт в режим визуального выделения для выделения строк.
	- `Ctrl + v` - войдёт в режим блочного выделения для выделения прямоугольных областей текста.
- command - позволяет работать с коммандами vim
	- `:` - вызывает режим команд

![](_png/Pasted%20image%2020230916210748.png)

## Базовое перемещение

Для базовых перемещений по коду:
- `j/k` - вверх-вниз
- `h/l` - влево-вправо

>[!info] При перемещении по строкам, у нас отображается номер нашей строки и номер по возрастанию до той, до которой мы можем быстро перескочить
>![](_png/Pasted%20image%2020230917110459.png)

### Горизонтальные перемещения:

- `0` - перемещает в начало строки
- `$` - перемещает в конец строки
- `w/b` - переход вперёд/назад по словам
- `e` - переходит вперёд по словам, но в конец слова

### Вертикальные перемещения:

- `число + shift + G` - перемещение на определённую строку (перейдёт на выбранную по числу строку)
- `число + jk` - перемещение вверх/вниз на определённое число строк
- `gg` - перемещение в начало файла
- `shift + g` - перемещение в конец файла

### Структура команды

Так же стоит упомянуть, что число, которое мы вводим работает почти на все движения. То есть, если нам нужно переместиться на 2 слова вперёд с помощью `w`, то мы можем написать `2 + w`. Так же к движению мы можем добавить команду. 

Например, нажав на `d2w` мы сможем удалить два слова, а при `dw` - одно

![](_png/Pasted%20image%2020231021180752.png)

Вместо `Ctrl+Z` в Vim работает `u`. Сам же вим хранит все изменения, которые мы совершали в файле, поэтому можно откатываться даже до тех изменений, которые были до входа в файл
Чтобы вернуть отменённые изменения, нам нужно нажать на `Ctrl + r`

Чтобы скопировать код, нужно будет нажать на `y`. Выделять текст для копирования мы можем в отдельном режиме для выделения строчек.

Чтобы вставить скопированный код, мы можем воспользоваться `p` (вставить под) либо `shift + p` (вставить над)

>[!info] Основное преимущество Vim заключается в том, что все эти команды мы можем комбинировать и посредством таких вот команд `shift + v` - `3 + j` - `d` быстро удалять ненужные строки (либо можно просто `d + 3 + j` нажать, что сделать то же самое)

Режим команд открывается через `:` и по `tab` предоставляет список команд (`tab` / `shift tab` - перемещение вверх  / вниз)

![](_png/Pasted%20image%2020231021200033.png)

Если нажать на `/`, то откроется аналогичный поиск like `ctrl+f`, который в нормальном режиме позволяет переходить по выделенным элементам через `n`

![](_png/Pasted%20image%2020231021200325.png)

## Продвинутое перемещение

## Продвинутые вертикальные движения

`%` - позволяет нам передвигаться между открывающей и закрывающей скобками (любыми)

![](_png/Pasted%20image%2020231022181550.png)

`{` / `}` - скобки предоставляют 

![](_png/Pasted%20image%2020231022183634.png)

Все те движения, что мы совершаем в виме - мы можем откатить. Если нам нужно будет откатиться на прошлое движение, то мы можем воспользоваться `ctrl + o`. Может это быть полезно, например, если мы зашли внутрь типа и нам нужно быстро вернуться обратно.

`ctrl + d` / `ctrl + u` - перемещение на половину экрана вниз / вверх

Если `/` позволяет нам написать то, что нам нужно найти, то `*` позволяет нам быстро занести то слово в поиск, на котором находится наш курсор (курсор стоял на `this`)

![](_png/Pasted%20image%2020231022185447.png)

## Продвинутые горизонтальные движения

`f` ищет определённую букву в строке вперёд, а `shift+f` ищёт назад

Эффективно использовать такое перемещение, если нам нужно перемещаться по аргументам, которые разделены запятой. Так же это очень эффективно, когда мы работаем с именованием *CamelCase*

Если нужно продолжать передвигаться дальше по найденной букве, то мы нажимаем `;`

![](_png/Pasted%20image%2020231022191701.png)

## Работа со словами

`space + r + a` - переименовать слово глобально

![](_png/Pasted%20image%2020240711200240.png)

`c + w` - режим редактирования слова. В нём мы сразу переходим в режим редактирования и удаляем искомое нами слово. Если сделать просто `d + w`, то мы останемся в нормальном режиме

Чтобы быстро скопировать слово, мы можем воспользоваться `v + i + w + y`. В этой последовательности добавилось  слово `i` (inside), которое позволяет выполнить операцию внутри слова.

Так же можно упростить операцию копирования с использованием `yiw`.

## Inside и around

`ci)` - эта операция позволила нам удалить всё, что находится внутри скобочек в конструкторе. Эта операция позволяет сразу скорректировать текущее слово, на котором стоял курсор и почистить всё до конца внутренней скобочки. 

![](_png/Pasted%20image%2020240711203735.png)

Для примера так же можно удалить всё внутри блока `di{`

![](_png/Pasted%20image%2020240711204329.png)

Так же есть модификатор `a`, который как и `i` позволяет выполнить операцию над элементом, но тут уже выделяет ещё и включая прописанный элемент (если `i` сохранит скобку, то `a` захватит и её)

## Проблемы, параграфы и теги

`W` - перенесёт не по словам, а по символам, которые не разделены пробелами. То есть в `this.action.find(new Field())` мы от `this` перейдём к `Field`.
Так же это работает и с сочетаниями, такими как `dW`

Так же мы можем выделять, до какого места проводить операцию. Оператор `t` (to) позволяет выполнить команду до определённого символа. `dt,` удалит выражение до запятой (не включая её). Если мы выполним `df,`, то удалим всё вместе с запятой

`dip` - позволит удалить нам всё внутри параграфа. Сам модификатор `p` отвечает за действие внутри параграфа.

`dit` - позволит удалить всё внутри тега. Сам модификатор `t` позволяет манипулировать над строками внутри тегов.

![](_png/Pasted%20image%2020240711205744.png)



## Работа с FileTree

- активные действия
	- `o` - открыть/раскрыть папку, перейти в файл
	- `q` - закрыть файловое дерево 
- Работа с файлом
	- `d` - удаляет файл
	- `a` - создаст файл (если нужно сделать директорию, то нужно будет прописать `папка\файл.расширение`) 
	- `r` - переименование файла
	- `n` - перемещение файла
- Работа с путями
	- `x` - копирует полный путь до файла 
	- `yy` - копирует имя файла

## Командная строка  



## Интерфейсные команды 

`lead + e` - откроет проводник и позволит сразу в него перейти

![](_png/Pasted%20image%2020240709195914.png)

`ctrl + h / l` - позволяет переключаться между окнами слева / справа

![](_png/Pasted%20image%2020231028171211.png)

`a` - позволит создать новый файл
`r` - позволит переименовать файл

![](_png/Pasted%20image%2020240709203519.png)

`lead + ff` - откроет телескоп, который быстро найдёт нам все нужные файлы
`lead + fw` - позволяет быстро найти определённое слово

![](_png/Pasted%20image%2020231028163855.png)

`shift + ?` - вызовет подсказку со всеми доступными командами для совершения действия

![](_png/Pasted%20image%2020231028164908.png)

`lead` + `v` / `h` - вертикальное / горизонтальное открытие терминала
Если использовать с `alt`, то это позволить тугглить терминал

![](_png/Pasted%20image%2020240709212050.png)

`shift + </>` - переключение вкладок в проводнике

- файлы проводника
- текущие открытые вкладки
- гит

![](_png/Pasted%20image%2020231028165035.png)

`lead + c` - закрыть файл
`]b` / `[b` - перемещение по вкладкам влево/вправо

![](_png/Pasted%20image%2020231028170415.png)

`lead + f + b` - откроет поиск по всем буферам

![](_png/Pasted%20image%2020231028170645.png)

`lead + /` - комментирование кода

![](_png/Pasted%20image%2020231028170927.png)

`lead + f / w` - поиск по слову 

![](_png/Pasted%20image%2020231028171409.png)

`lead + fo` - поиск по старым открытым файлам 

![](_png/Pasted%20image%2020231028173208.png)

Команда `:MasonInstall` позволяет нам установить любые языковые сервера

(окошко открывается с помощью `:Mason`)

![](_png/Pasted%20image%2020231028174457.png)

По умолчанию, файлы, которые начинаются на точку, скрыты. Чтобы их отобразить, нужно нажать на `H`

![](_png/Pasted%20image%2020231028180829.png)

`F7` - откроет терминал вима

![](_png/Pasted%20image%2020231028181622.png)

`leader` + `t` + `h` - настройка тем в реальном времени

![](_png/Pasted%20image%2020240710175551.png)

## Описание плагинов

1. Neotest - плагин для удобного запуска тестов в приложении

`leader` + `t` запускает множество команд для прогонки тестов

![](_png/Pasted%20image%2020240710175456.png)

2. DAP - плагин для дебага приложения

Первым делом получаем сокет с активным дебагом от нашего приложения

![](_png/Pasted%20image%2020240710175951.png)

`leader` + `d` + `b` - ставим точку остановы

![](_png/Pasted%20image%2020240710180024.png)

`leader` + `d` + `u` - открытие окна с дебагом
`leader` + `d` + `s` - запуск дебага

И когда выполнение кода дойдёт до точки, то окно заполнится нужными данными

![](_png/Pasted%20image%2020240710180413.png)

3. Neodev - подсказка сигнатуры вызова метода

![](_png/Pasted%20image%2020240710184418.png)

4. Flog - дерево гита

`:Flog` - откроет удобное для просмотра дерево коммитов

![](_png/Pasted%20image%2020240710184720.png)

5. Diffview - показывает изменения между файлами для гита

`lead + g + f` - откроет историю изменений файла. Очень удобно смотреть на различные изменения файла в течение времени

![](_png/Pasted%20image%2020240710184859.png)

6. Leap - упрощение вертикальных перемещений

`s` + первые два символа искомой строки

Позволяет быстро искать по двум символам нужные значения

7. better-bqf

`g + f` - позволяет быстро найти все определения функции / метода в коде и удобно предоставляет список внизу с окошком

На `o` можно перейти на нужный референс

![](_png/Pasted%20image%2020240710190019.png)

8. Todo Comments

Подсвечивает тудушки и остальные ключевые слова в проекте

`:TodoQuickFix`

![](_png/Pasted%20image%2020240710190423.png)

9. Codeium - бесплатный ИИ с автокомплитом

`ctrl + g` - принятие строки автокомплита






