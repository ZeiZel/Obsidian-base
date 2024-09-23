
### Neotree

Neotree - это плагин для отображения боковой менюшки с файлами проекта

Так же мы имеем дополнительные поля в нашей конфигурации lazy:
- `branch` - ветка, с которой нужно стянуть актуальный плагин
- `dependencies` - представляет собой отображение дополнительных зависимостей пакета

Отдельно мы тут включаем диагностику `diagnostic` и назначаем каждому типу предупреждения свою иконку

`lua / plugins / neo-tree.lua`
```lua
return {
	"nvim-neo-tree/neo-tree.nvim",
	branch = "v3.x",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"nvim-tree/nvim-web-devicons",
		"MunifTanjim/nui.nvim",
	},
	config = function()
		-- эти параметры сделают плавающее окошко редактирования прозрачным 
		vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none", fg = "none"})
		vim.api.nvim_set_hl(0, "FloatBorder", { bg = "none", fg = "none"})
		
		vim.diagnostic.config({
			signs = {
				text = {
					[vim.diagnostic.severity.ERROR] = " ",
					[vim.diagnostic.severity.WARN] = " ",
					[vim.diagnostic.severity.INFO] = " ",
					[vim.diagnostic.severity.HINT] = " ",
				},
			},
		})
		require("neo-tree").setup({
			close_if_last_window = false,
		})
	end,
}
```

Теперь по команде `:Neotree` мы можем открыть окно с файлами нашего проекта

- Для перемещения между деревом проекта и открытым файлом нужно использовать те же сочетания, что и при split (ранее забиндили на `ctrl + сторона движения`)
- `a` - создать новый файл/папку
- `d` - удалить файл
- `x` - вырезать файл
- `p` - вставка файла
- ну и так же работают те же самые режимы выделения и копирования

![](_png/Pasted%20image%2020240921164713.png)

Добавим в маппинги строчку, по которой мы будем быстро открывать и закрывать отображение дерева `<leader>e`

`lua / core / mappings.lua`
```lua
-- Устанавливаем дефолтный кейбиндинг для Neotree плагина 
vim.keymap.set("n", "<leader>e", ":Neotree left toggle reveal<CR>")
```

### Bufferline

Сейчас мы пока можем работать только в одном файле. Чтобы расширить свои возможности и работать сразу с несколькими буферами, можно установить плагин `Bufferline`

![](_png/Pasted%20image%2020240922073203.png)

Установка плагина производится несложно, а вот всё остальное требует настройки:

- Обозначаем локальные цвета
- Вызываем `setup`, в который передаём опции с иконками и цветами для подсветки

`lua / plugins / bufferline.lua`
```lua
return {
	{
		'akinsho/bufferline.nvim',
		version = "*",
		dependencies = 'nvim-tree/nvim-web-devicons',
		config = function()
		local bufferline = require("bufferline")

		local gray = "#585b70"
		local links = "#89dceb"

		bufferline.setup({
			options = {
				mode = "buffers",
				numbers = "none",
				color_icons = false,
				indicator = {
					style = "none",
				},
				modified_icon = "●",
				left_trunc_marker = "",
				right_trunc_marker = "",
				diagnostics = "nvim_lsp",
				diagnostics_indicator = function(count, level, diagnostics_dict, context)
					local s = " "
					for e, _ in pairs(diagnostics_dict) do
						local sym = e == "error" and " " or (e == "warning" and " " or " ")
						s = s .. sym
					end
					return s
				end,
				always_show_bufferline = true,
			},
			highlights = {
				background = {
					fg = gray,
				},
				buffer_selected = {
					fg = links,
				},
				buffer_visible = {
					fg = gray,
				},
				separator = {
					bg = "#1e1e2e",
					fg = "#1e1e2e",
				},
				diagnostic = {},
			},
		})
	end,
	}
}
```

Биндинги на быструю работу:
- `tab` - перейти на следующую вкладку
- `shift + tab` - перейти на предыдущую вкладку
- `lead + x` - закрыть текущую вкладку
- `shift + x` - закрыть остальные вкладки

`lua / core / mappings.lua`
```lua
-- Настройка табуляции
vim.keymap.set("n", "<Tab>", ":BufferLineCycleNext<CR>")
vim.keymap.set("n", "<s-Tab>", ":BufferLineCyclePrev<CR>")
vim.keymap.set("n", "<leader>x", ":BufferLinePickClose<CR>")
vim.keymap.set("n", "<c-x>", ":BufferLineCloseOthers<CR>")
```

### Lualine

Так же можно прокачать наше нижнее меню и сделать его более информативным, чем сейчас. Сделать это не так уж и сложно - достаточно добавить плагин [Lualine](https://github.com/nvim-lualine/lualine.nvim), который добавит информацию по языку, ветке, системе, строке и сделать это более красивым и приятным образом

![](_png/Pasted%20image%2020240922085916.png)

Для этого можно воспользоваться следующим конфигом, где мы определяем свои цвета, тему и сепараторы (включая закругления по краям)

`lua / plugins / lualine.lua`
```lua
return {
	{
		'nvim-lualine/lualine.nvim',
		dependencies = { 'nvim-tree/nvim-web-devicons' },
		config = function()
			local colors = {
				blue   = '#80a0ff',
				cyan   = '#79dac8',
				black  = '#080808',
				white  = '#c6c6c6',
				red    = '#ff5189',
				violet = '#d183e8',
				grey   = '#303030',
			}

			local bubbles_theme = {
				normal = {
					a = { fg = colors.black, bg = colors.violet },
					b = { fg = colors.white, bg = colors.grey },
					c = { fg = colors.white },
				},

				insert = { a = { fg = colors.black, bg = colors.blue } },
				visual = { a = { fg = colors.black, bg = colors.cyan } },
				replace = { a = { fg = colors.black, bg = colors.red } },

				inactive = {
					a = { fg = colors.white, bg = colors.black },
					b = { fg = colors.white, bg = colors.black },
					c = { fg = colors.white },
				},
			}
			require('lualine').setup({
				options = {
					globalstatus = true,
					theme = bubbles_theme,
					component_separators = '',
					section_separators = { left = '', right = '' },
				},
				sections = {
					lualine_a = { { 'mode', separator = { left = '' }, right_padding = 2 } },
					lualine_b = { 'filename', 'branch' },
					lualine_c = {
						'%=', --[[ add your center compoentnts here in place of this comment ]]
					},
					lualine_x = {},
					lualine_y = { 'filetype', 'progress' },
					lualine_z = {
						{ 'location', separator = { right = '' }, left_padding = 2 },
					},
				},
				inactive_sections = {
					lualine_a = { 'filename' },
					lualine_b = {},
					lualine_c = {},
					lualine_x = {},
					lualine_y = {},
					lualine_z = { 'location' },
				},
				tabline = {},
				extensions = {},
			})
		end
	}
}
```

### Telescope

Далее нам нужно организовать удобный поиск по проекту, чтобы мы смогли быстро найти интересующую нас строчку кода, буфер, тег, коммит и так далее. Для этого нам нужно будет установить [Telescope]()

![](_png/Pasted%20image%2020240922091226.png)

Для начала установим fuzzyfinder, который предоставляет поиск по словам в терминале

```bash
brew install fzf
```

Далее дефолтно устанавливаем телескоп и настраиваем ему локальные кейбиндинги, которые будут ссылаться не на определённую команду, а на функцию, которую провайдит пакет

- `<leader>ff` - поиск по файлам в дереве проекта
- `<leader>fw` - поиск по словам
- `<leader>fb` - поиск по открытым буферам

`lua / plugins / lualine.lua`
```lua
return {
    'nvim-telescope/telescope.nvim', 
    tag = '0.1.8',
    dependencies = { 'nvim-lua/plenary.nvim' },
	config = function()
		require('telescope').setup({})
		local builtin = require('telescope.builtin')
		vim.keymap.set('n', '<leader>ff', builtin.find_files, {})
		vim.keymap.set('n', '<leader>fw', builtin.live_grep, {})
		vim.keymap.set('n', '<leader>fb', builtin.buffers, {})
	end
}
```

Для того, чтобы перемещаться по результатам поиска, можно через `jj` перейти в нормальный режим / через `Tab` выбирать результат поиска.

Так же через `:Telescope`, мы можем выбирать, по какой группе будет вестись поиск

![](_png/Pasted%20image%2020240922092242.png)

### Терминал

Так же для полноценной работы с редактором нам понадобится терминал. Его мы добавим плагином [Toggleterm](https://github.com/akinsho/toggleterm.nvim)

![](_png/Pasted%20image%2020240922094258.png)

Нам нужно будет добавить небольшой и простенький конфиг для подгрузки плагина, где нам нужно будет задать сочетания для работы с терминалом:

- `ctrl + \` - тугглит терминал
- `jj` - так же переведёт в *normal mode*

`lua / plugins / toggleterm.lua`
```lua
return {
	{
		'akinsho/toggleterm.nvim',
		version = "*",
		config = function()
			require('toggleterm').setup({
				open_mapping = [[<c-\>]],
			})
			function _G.set_terminal_keymaps()
				local opts = { buffer = 0 }
				vim.keymap.set('t', '<esc>', [[<C-\><C-n>]], opts)
				vim.keymap.set('t', 'jj', [[<C-\><C-n>]], opts)
				vim.keymap.set('t', '<C-h>', [[<Cmd>wincmd h<CR>]], opts)
				vim.keymap.set('t', '<C-j>', [[<Cmd>wincmd j<CR>]], opts)
				vim.keymap.set('t', '<C-k>', [[<Cmd>wincmd k<CR>]], opts)
				vim.keymap.set('t', '<C-l>', [[<Cmd>wincmd l<CR>]], opts)
				vim.keymap.set('t', '<C-w>', [[<C-\><C-n><C-w>]], opts)
			end

			-- if you only want these mappings for toggle term use term://*toggleterm#* instead
			vim.cmd('autocmd! TermOpen term://* lua set_terminal_keymaps()')
		end
	}
}
```
