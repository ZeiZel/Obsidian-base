
### Neotree

Neotree - это плагин для отображения боковой менюшки с файлами проекта

Так же мы имеем дополнительные поля в нашей конфигурации lazy:
- `branch` - ветка, с которой нужно стянуть актуальный плагин
- `dependencies` - представляет собой отображение дополнительных зависимостей пакета

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

### Bufferline








### Lualine








### Telescope








### Доработка цветов








### Терминал







