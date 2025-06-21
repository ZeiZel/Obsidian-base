
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

![](../Development/_png/Pasted%20image%2020240929132638.png)
