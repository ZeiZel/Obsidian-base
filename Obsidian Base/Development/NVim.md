
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

Дальше идёт конфиг маппингов, в котором можно задать под определённый режим определённую операцию. Первый блок - режим, второй - сочетание, третий - аналог. Дальше идёт описание команды, которое можно увидеть в окне подсказки (одиночное нажатие на клавишу действия и некоторое вреия удержания).

`lua > mappings.lua`
```lua
require "nvchad.mappings"

-- add yours here

local map = vim.keymap.set

map("n", ";", ":", { desc = "CMD enter command mode" })
map("i", "jk", "<ESC>")

-- map({ "n", "i", "v" }, "<C-s>", "<cmd> w <cr>")
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

Далее идёт конфиг для еслинта

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

Тут находится конфиг lsp серверов для нашей апы

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






## Inside и around








## Проблемы, параграфы и теги


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

![](_png/Pasted%20image%2020231028163855.png)

`shift + ?` - вызовет подсказку со всеми доступными командами для совершения действия

![](_png/Pasted%20image%2020231028164908.png)

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








