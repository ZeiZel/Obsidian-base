
Далее нам очень поможет в перемещении по файловой структуре утилита `yazi`, которая построена на моушенах вима

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

![](_png/d89510ddc08e645eeaab68a8f10e6c48.png)
