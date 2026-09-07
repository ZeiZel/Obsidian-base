---
tags:
  - terminal
  - nvim
  - brew
  - aerospace
  - tmux
  - herdr
  - workmux
  - ghostty
  - lazygit
  - lazydocker
---

> [Репозиторий конфигурации](https://github.com/ZeiZel/dotfiles)

Практическая карта терминального окружения macOS/Linux: что установлено
конфигурацией, какую проблему решает каждый инструмент и какие клавиши держать
в мышечной памяти. Brewfile описывает желаемое состояние; наличие конкретного
бинарника на текущем компьютере не предполагается.

## Быстрый маршрут

| Задача | Точка входа |
|---|---|
| Выбрать рабочее пространство | `ZSH_MULTIPLEXER=herdr` (по умолчанию), `tmux` или `none` |
| Lazygit поверх терминала | Herdr/Tmux: `Ctrl+A`, затем `g` |
| Workmux | Tmux: `Ctrl+A`, затем `W`; меню: `Ctrl+A`, затем `w` |
| Файлы | `yy`/`ya` — Yazi; `Ctrl+T` — FZF-файл; `Alt+C` — FZF-каталог |
| История команд | `↑`/`↓` — native Zsh, `Ctrl+R` — Atuin |
| Редактор | `nvim`; лидер Neovim — `Space` |
| Git status | `gst`; граф — `glog`; partial staging — `gap` |
| Docker / Kubernetes | `ld`; `k9`; `kgp`; `kl POD`; `ke POD -- sh` |
| SQL/HTTP | `hq` — Harlequin; `post` — Posting |
| Мониторинг | `bt`/`btop`, `procs`, `duf`, `dust`, `bandwhich` |

## Модель слоёв

1. Ghostty или WezTerm рисует терминал; AeroSpace раскладывает окна macOS.
2. Zsh отвечает за быстрый prompt, aliases, completion, history и выбор
   мультиплексора.
3. Herdr — текущий default workspace; Tmux + TPM + Workmux — совместимая
   альтернатива для ручного запуска.
4. Neovim — IDE, а внешние TUI (Lazygit, Yazi, btop, k9s, Posting) открываются
   в popup или отдельной pane.
5. Brewfile и Ansible описывают установку и ссылки; Stow раскладывает dotfiles.

Важно: `ZSH_MULTIPLEXER` выбирается до запуска нового shell. Допустимы
`ZSH_MULTIPLEXER=herdr`, `ZSH_MULTIPLEXER=tmux`, `ZSH_MULTIPLEXER=none`;
неизвестное значение безопасно оставляет обычный Zsh.
Скрипты не запускаются в SSH, IDE, вложенном multiplexer, `TERM=dumb` и
не-интерактивном shell. `ZSH_HERDR_AUTOSTART=0` и `ZSH_TMUX_AUTOSTART=0` —
только аварийные kill-switches старых backend-скриптов.

## Herdr и Reviewr

Herdr сохраняет рабочие пространства/агентов и даёт единый UI. Он убирает
ручное восстановление panes и быстрые переключения между workspaces; состояние
и checkout плагинов живут в `~/.config/herdr`, а не в репозитории.

| Клавиши | Действие |
|---|---|
| `Ctrl+A`, `g` | Lazygit в full-terminal popup |
| `Ctrl+A`, `Shift+R` | Toggle Reviewr для текущего Git diff |
| `Ctrl+A`, `f` | Session navigator |
| `Ctrl+A`, `w` | Workspace picker |
| `Ctrl+A`, `v` / `-` | Split вправо / вниз |
| `Ctrl+A`, `h/j/k/l` | Переход между panes |
| `Ctrl+A`, `z` | Zoom текущего pane |
| `Ctrl+A`, `q` | Detach, оставив процессы работать |
| `Ctrl+A`, `Ctrl+A` | Передать буквальный `Ctrl+A` приложению |
| `Ctrl+A`, `?` | Справка Herdr |

Reviewr — ручной code-review поверх текущей ветки; base выбирается среди
`dev`, `develop`, `main`, `master`. PR/MR view использует уже авторизованный
`gh`, `glab` или `az`. Плагин не следует автоматически запускать в каждом
worktree; его checkout и sockets — runtime state.

Проверка установки: `herdr config check`, `herdr status`,
`herdr plugin list --json`, `herdr plugin action list --plugin persiyanov.reviewr`.

## Tmux, TPM и Workmux

Prefix Tmux — `Ctrl+A`: нажать и отпустить, затем действие. Tmux решает задачу
долгоживущих процессов и переносимой раскладки, TPM — обновление плагинов, а
Workmux связывает Git worktree с отдельной Tmux-сессией и агентом Codex.

### Сессии, окна и panes

| Клавиши | Действие |
|---|---|
| `Prefix s` | Дерево sessions/windows |
| `Prefix C` | Новая session |
| `Prefix X` | Подтверждённо завершить session |
| `Prefix d` | Detach |
| `Prefix c` | Новое окно в текущем каталоге |
| `Prefix 1..9` | Перейти к окну |
| `Prefix 0` | Перейти к окну 10 |
| `Prefix C-h` | Предыдущее окно |
| `Prefix C-l` | Перерисовать экран (эта binding переопределяет next-window) |
| `Prefix Tab` | Последнее окно |
| `Prefix </>` | Переместить окно |
| `Prefix \|` / `-` | Split вправо / вниз, сохранив каталог |
| `Prefix h/j/k/l` | Focus pane |
| `Prefix H/J/K/L` | Resize на 5 клеток |
| `Prefix Alt+h/j/k/l` | Resize на 1 клетку |
| `Prefix z` | Zoom pane |
| `Prefix M` / `m` | Mark / unmark pane |

### Copy mode, popups и layouts

| Клавиши | Действие |
|---|---|
| `Prefix [` | Copy mode |
| `Space` / `Ctrl+Space` | Обычное / прямоугольное выделение |
| `Enter` | Скопировать и выйти |
| `Esc`, `Ctrl+G`, `q` | Выйти без копирования |
| `Prefix r` | Reload `tmux.conf` |
| `Prefix S` | Synchronize panes |
| `Prefix C-k` | Очистить scrollback и экран |
| `Prefix t` | Toggle status bar |
| `Prefix g` | Lazygit popup (текущий каталог) |
| `Prefix W` | Workmux dashboard worktrees |
| `Prefix b` / `y` / `f` | Btop / Yazi / FZF popup |
| `Prefix n` | Открыть `~/notes.md` в `$EDITOR` |
| `Prefix Alt+1..5` | Предустановленные layouts |
| `Prefix D` / `I` | Dev (70/30) / IDE layout |

### Workmux menu

`Prefix+w` открывает discoverable menu. Следующий символ выбирает действие:

| Меню | Действие |
|---|---|
| `w` | Dashboard worktrees: создать/открыть |
| `a` | Dashboard агентов |
| `d` | Diff текущего проекта |
| `s` | Sidebar текущей сессии |
| `r` | Восстановить Workmux-сессии |
| `b` / `m` | Rebase / merge с подтверждением |
| `c` | Закрыть worktree с подтверждением |
| `?` | Документация Workmux |

Прямые команды: `wm add BRANCH`, `wm list`, `wm open BRANCH`, `wm merge`.
`Prefix+W` сохраняется как одноклавишный dashboard. Дополнительные TPM
плагины: `Prefix o` SessionX, `Prefix F` tmux-fzf, `Prefix T` tmux-thumbs,
`Prefix u` URL picker, `Prefix e` fuzzy-поиск текста pane. Их точные клавиши
могут меняться версией плагина — смотрите popup help.

## Ghostty, WezTerm и AeroSpace

Ghostty — лёгкий нативный renderer и основной конфиг терминала; он настроен в
`ghostty/config`, но не устанавливается Brewfile автоматически. WezTerm —
альтернативный программируемый терминал из `wezterm/wezterm.lua`. AeroSpace
делает tiling окон macOS и устанавливается cask-ом. Эти слои не заменяют
мультиплексор: закрытие окна без `detach` не должно быть способом завершать
рабочие процессы.

### Ghostty

Клавиши из tracked `ghostty/config`:

| Клавиша | Действие |
|---|---|
| `Cmd+D` | Новый split справа |
| `Cmd+Shift+D` | Новый split вниз |
| `Cmd+W` | Закрыть surface |
| `Cmd+Enter` | Toggle fullscreen |
| `Cmd+K` | Очистить экран |
| `Cmd+T` | Новая вкладка |
| `Cmd+Shift+[` / `Cmd+Shift+]` | Предыдущая / следующая вкладка |

WezTerm — альтернативный программируемый renderer; его Lua-конфиг не является
конфигом Ghostty, поэтому клавиши могут различаться.

### AeroSpace

| Клавиша | Действие |
|---|---|
| `Alt+H/J/K/L` | Focus окна влево/вниз/вверх/вправо |
| `Alt+Shift+H/J/K/L` | Переместить окно |
| `Alt+Slash` / `Alt+Comma` | Tiles / accordion layout |
| `Alt+F` | Fullscreen |
| `Alt+Minus` / `Alt+Equal` | Smart resize −50/+50 |
| `Alt+1..9` | Перейти на workspace |
| `Alt+Shift+1..9` | Переместить окно на workspace |
| `Alt+Tab` | Предыдущий workspace |
| `Alt+Shift+;`, затем `r/f/Backspace/Esc` | Service mode |

## Zsh, prompt, история и навигация

Zsh настроен для быстрого интерактивного старта: `env.zsh` — PATH и окружение,
`plugins.zsh` — плагины, `prompt.zsh`/Starship — prompt, `init.zsh` — runtime
инициализация. Emacs — единственная ZLE keymap: это устраняет случайное
включение Vim-навигации в терминале.

| Клавиши | Действие |
|---|---|
| `↑` / `↓` | Нативная история Zsh |
| `Ctrl+R` | Atuin: поиск истории с контекстом |
| `Ctrl+T` | FZF файл, вставить путь |
| `Alt+C` | FZF каталог и `cd` |
| `Ctrl+A` / `Ctrl+E` | Начало / конец строки (вне prefix) |
| `Ctrl+←/→` | Перемещение по словам |
| `Ctrl+W` | Удалить слово слева |
| `Ctrl+U` / `Ctrl+K` | Удалить до начала / конца строки |
| `Tab` | Completion команды, файла, ветки, аргумента |

Prompt показывает время, длительность последней команды, текущий Git branch и
dirty state, Docker-контекст и используемые технологии проекта. Медленные
проверки не являются асинхронными: вычисление Starship синхронное, внешние
модули ограничены 250 ms и marker-scoped. В prompt нет network fetch. Detached
и lock-protected обновление относится только к сгенерированным shell integration
shim-файлам; не добавляйте в prompt произвольные команды.

Zsh-плагины: `zsh-autosuggestions` показывает подсказку по истории,
`zsh-syntax-highlighting` подсвечивает команду, `zsh-completions` расширяет
completion. Это provisioned formulae, а не гарантия наличия на хосте.

Полезные команды и aliases:

| Сценарий | Команда |
|---|---|
| Известный каталог | `z fragment` (`zoxide`) |
| FZF открыть файл в Neovim | `fv` |
| Yazi с возвратом выбранного каталога | `yy` |
| Dotfiles | `dotfiles` |
| Git | `gst`, `glog`, `gdiff`, `gap`, `gco`, `grb`, `gsh`, `gshp` |
| Compose | `dcup`, `dcdown`, `dclogs`, `dps`, `dx` |
| Herdr | `herdrs`, `herdrl`, `herdrr`, `reviewr` |
| Node/pnpm | `nrd`, `nrt`, `nrl`, `prd`, `prt`, `prb` |
| Nx/Angular | `nxb`, `nxs`, `nxt`, `nxl`, `nxa`; `ngb`, `ngs`, `ngt` |
| Helm | `hl`, `hla`, `hui`, `hs`, `hru` |
| Kubernetes | `kgp`, `kgpw`, `kgs`, `kgd`, `krollout`, `krestart`, `ktop` |
| Terraform | `tfi`, `tfp`, `tfa`, `tfv`, `tff`, `tfwl`, `tfws` |
| Ansible | `ap`, `ag`, `av`, `al` |
| HTTP/SQL | `post`, `hq` |

## Yazi, FZF, Zoxide, Broot и Navi

Yazi решает медленную навигацию и безопасное пакетное перемещение файлов;
`yazi`/`ya` открывает TUI, `yy` возвращает выбранный каталог в shell. FZF —
универсальный fuzzy picker (файлы, каталоги, история, `Prefix f`), `fd` — его
быстрый backend. Zoxide учит часто используемые каталоги (`z rentverse`).
Broot (`broot`) даёт интерактивное дерево с быстрым переходом, Navi (`navi`) —
поиск командных рецептов. У FZF/Yazi preview может читать содержимое файлов —
не открывайте доверительные данные в чужих окружениях.

## Git: CLI, Lazygit, Delta и Neovim

Обычный Git остаётся точным и скриптуемым интерфейсом. Lazygit решает проблему
перегруженного CLI: показывает status, историю, branches, diff, partial stage,
stash и конфликты в одном TUI. `e` открывает выбранный файл в `$EDITOR`.

### Lazygit daily

| Клавиша | Действие |
|---|---|
| `h/j/k/l` | Навигация |
| `?` | Help текущей панели; `/` — фильтр |
| `Space` / `a` | Stage/unstage файл / всё |
| `Enter` на файле | Diff и отдельные строки |
| `Space` / `v` в diff | Hunk/line stage и range selection |
| `e` | Открыть файл в Neovim |
| `c` / `A` | Commit / amend |
| `s` / `S` | Stash / stash menu |
| `p` / `P` | Pull / push |
| `z` / `Z` | Undo / redo Git operation |
| `q` | Выйти |

### Branches, history и rebase

| Контекст/клавиша | Действие |
|---|---|
| Branches `Space` / `n` / `-` | Checkout / новая ветка / предыдущая ветка |
| Branches `r` / `M` / `w` | Rebase / merge / создать worktree |
| Commits `i` | Interactive rebase |
| Commits `s` / `f` / `r` / `d` | Squash / fixup / reword / drop |
| Commits `Ctrl+J/K` | Переместить commit вниз / вверх |
| Commits `C`, затем `V` | Copy и cherry-pick commit |
| Commits `T` / `Space` | Tag / checkout detached HEAD |

### Конфликты

| Клавиша | Действие |
|---|---|
| `M` на конфликтующем файле | Меню разрешения конфликта |
| `h/l` / `j/k` | Предыдущий/следующий конфликт; предыдущий/следующий hunk |
| `Space` | Выбрать текущую сторону/hunk |
| `b` | Взять обе стороны |
| `e` | Открыть файл в Neovim |
| `z` | Отменить разрешение последнего конфликта |
| `m` | Continue / abort / skip merge или rebase |

### Разделение интерфейсов

- Lazygit — ежедневный status, partial staging, branch/history и быстрый editor.
- Neogit — commit/rebase/branch workflow внутри Neovim (`<Space>gg`, compact
  `<Space>gs`, log `<Space>gl`).
- Diffview — история и трёхстороннее разрешение конфликтов (`<Space>gm`, `]x`/
  `[x`, `2do` ours, `3do` theirs).
- Gitsigns — локальные hunks: `]h`/`[h`, `<Space>ghs` stage,
  `<Space>ghr` reset, `<Space>ghu` toggle stage текущего hunk (`stage_hunk`),
  `<Space>ghp` preview, `<Space>ghb` blame, `<Space>gB` toggle inline blame.

Delta делает `git diff` читаемым (Catppuccin, side-by-side), Difftastic сравнивает
структуру AST, а `gitleaks` ищет секреты. `gcoall` опасен: отбрасывает все
неукоммиченные изменения. Перед reset/checkout проверяйте `gst`.

## Системный мониторинг и файлы

`btop` — процессы, CPU/RAM/disk/network в одном TUI (`bt`, `Prefix b`),
`bottom` — лёгкая альтернатива; `procs`/`pst` — читаемый process tree.
Полные keymaps btop и Yazi не принадлежат этому репозиторию: используйте
встроенный `?`/help и актуальную upstream-документацию.
`duf`/`dust` показывают свободное место/потребление, `gping` — latency-график,
`bandwhich` — bandwidth по процессам, `lnav` — интерактивные логи, `trippy` и
`mtr` — сетевой маршрут. На macOS для точного процесса используйте Activity
Monitor, а TUI — для быстрой диагностики.

`eza` заменяет `ls`, `bat` — `cat` с подсветкой, `glow` — Markdown, `jless` —
JSON, `jq`/`yq` — структурное преобразование, `sd` — безопаснее sed,
`choose` — выбор колонок, `ast-grep` — структурный поиск. `tree`, `tokei`,
`atool`, `sevenzip`, `imagemagick`, `ffmpegthumbnailer`, `poppler` закрывают
дерево проекта, статистику, архивы, изображения и PDF.

`thefuck` есть только как provisioned Brewfile formula: tracked alias не задан.
Upstream alias при необходимости добавляется вручную в локальный override.

## Docker, Kubernetes, Helm, IaC и безопасность

| Инструмент | Проблема/вход |
|---|---|
| Docker Compose | `dco`, `dcup`, `dcdown`, `dclogs`; повторяемый локальный stack |
| Lazydocker | `ld`; TUI для containers/images/volumes |
| Dive | `div`; слои и размер Docker image |
| Kubernetes | `k`, `kg*`, `kd*`, `kl`, `ke`, `kpf`; быстрый диагностика ресурсов |
| K9s | `k9`; интерактивный cluster UI |
| kubectx/kubens | `kc`, `kns`; context/namespace без длинных флагов |
| Helm | `h`, `hl`, `hui`, `hd`, `hs`, `hru`; charts и release |
| kustomize/kubeconform | overlays и проверка Kubernetes YAML |
| stern | логи нескольких pods |
| minikube/qemu | локальный cluster и VM |
| Terraform | `tfp` перед `tfa`; `tfaa` и `tfda` требуют особой осторожности |
| Ansible | `ap`, `al`; provisioning и lint |
| trivy/gitleaks | vulnerability и secret scanning до push |
| AWS CLI | `aws-whoami`, `aws-regions`; проверка identity перед действиями |

`kdel`, `dprune`, `dvprune`, `tfaa`, `tfda`, `hd` и `krestart` могут удалять
ресурсы или менять окружение. Сначала проверьте context, namespace и diff;
для production используйте явный approval. Секреты не кладите в aliases,
prompt, git или эту заметку.

## HTTP, API и базы данных

Posting (`post`) — коллекции HTTP-запросов в TUI; `httpie`, `xh`, `httpyac` и
`resterm` — CLI/API-клиенты для скриптов и `.http`-файлов. `grpcurl` проверяет
gRPC. В Neovim `Space lp` открывает Posting.

### Posting и Resterm

В Posting сохранены upstream widget keys и добавлены Vim-style команды:

| Клавиша | Действие |
|---|---|
| `Ctrl+J`, `Alt+Enter`, `Ctrl+Enter` | Отправить request |
| `/`, `Ctrl+P`, `Ctrl+Shift+P` | Поиск requests |
| `:`, `Ctrl+P` | Команды |
| `F1`, `?`, `Ctrl+?`, `Ctrl+Shift+/` | Help |
| `h/j/k/l`, `g/G` | Навигация native widgets (не переназначена) |

В Resterm bindings заменяют defaults:

| Клавиша | Действие |
|---|---|
| `Tab`, `Ctrl+J`, `Ctrl+L` | Следующий focus |
| `Shift+Tab`, `Ctrl+H`, `Ctrl+K` | Предыдущий focus |
| `Ctrl+Enter`, `Cmd+Enter`, `Alt+Enter`, `Ctrl+M` | Отправить request |

В Resterm `Esc` оставлен редактору: сначала выйдите из editor focus, затем
используйте навигацию TUI.

Harlequin (`hq`) — SQL TUI для PostgreSQL и других поддержанных БД; PostgreSQL
(`postgresql@16`) и Redis — Brewfile-формулы/клиенты, которые этим dotfiles
конфигом автоматически не запускаются. Database UI в Neovim открывается
`Space D`, располагается справа, `Ctrl+L` переводит фокус из редактора в DBUI,
`Ctrl+H` возвращает его. Всегда проверяйте URL, database и read-only режим перед
запросом; `kubectl exec` к production DB выполняйте только по процедуре доступа.

## Neovim как IDE

Leader — `Space`; конфигурация LazyVim лениво загружает language extras, LSP,
formatter, tests, DAP и тяжёлые TUI только по команде/буферу. Это сохраняет
быстрый пустой старт. `Ctrl+/` открывает встроенный терминал, `Space l d` —
Lazydocker.

### Neovim: поиск и навигация

| Клавиши | Действие |
|---|---|
| `Space Space` / `Space /` | Файл / текст во всём проекте |
| `Space sb` / `Space sw` | Строки buffer / слово или selection по проекту |
| `/текст`, `n`/`N`, `*`/`#` | Поиск, следующее/предыдущее, слово под курсором |
| `42G` / `:42`, `gg` / `G` | Строка 42 / начало и конец файла |
| `Ctrl+O` / `Ctrl+I`, `%` | Jump list / парная скобка или tag |
| `Space e` / `Space fe` | Explorer от Git root |
| `Space E` / `Space fE` | Explorer от текущего каталога |
| `Space ,`, `Tab`/`Shift+Tab` | Buffers и переход между ними |
| `Space fr`, `Space sk` | Recent files / поиск mappings |

В shorthand выше `Space` означает `<Space>`: например, explorer также
вызывается полными chords `<Space>fe` и `<Space>fE`.

### LSP, автофикс и refactoring

| Клавиши | Действие |
|---|---|
| `gd`, `gr`, `gI`, `gy`, `gD` | Definition / references / implementation / type / declaration |
| `K`, `gK` | Hover / signature help |
| `Space cr`, `Space cR` | Rename symbol / rename file через LSP |
| `Space ca`, `Space cA` | Quick fix / source-level action |
| `Space co`, `Space cf` | Organize imports / format buffer или selection |
| `Space cD`, `Space cM` | TS: fix all diagnostics / добавить missing imports |
| `Space rs`, `ri`, `rI` | Refactor picker / inline variable/function |
| Visual `Space rf`, `rF`, `rx` | Extract function / в файл / variable |
| `Space cd`, `]d`/`[d`, `]e`/`[e` | Diagnostic / следующая-previous diagnostic/error |
| `Space qq`, `Space qb` | Trouble: project / buffer diagnostics |

### Редактирование, окна и инструменты

| Клавиши | Действие |
|---|---|
| `jj`, `Space w`, `Ctrl+S` | Выйти из Insert / сохранить |
| `u`/`Ctrl+R`, `.`, `ciw`, `diw` | Undo/redo, repeat, change/delete word |
| `dd`/`yy`, `p`/`P` | Delete/yank line, paste after/before |
| `gcc`, Visual `gc` | Комментарий строки/selection |
| `Space ms`, `Space p`, `[y`/`]y` | Multicursor, yank history, previous/next yank |
| `Ctrl+h/j/k/l`, `|`, `\` | Окна: focus, vertical/horizontal split |
| `Ctrl+/`, `Space ld`, `Space lp`, `Space D` | Terminal / Lazydocker / Posting / DBUI |
| `Space oo`, `Space or`, `Space ow` | Overseer task / restart / task list |

### Neovim Git, tests и debug

| Клавиши | Действие |
|---|---|
| `<Space>gg`, `<Space>gs`, `<Space>gc`, `<Space>gl`, `<Space>gb`, `<Space>gt`, `<Space>gr` | Neogit status/compact/commit/log/branch/tag/rebase |
| `<Space>gd`, `<Space>gD`, `<Space>gh`, `<Space>gH`, `<Space>gm` | Diff / previous commit / file history / repo history / conflicts |
| `]h`/`[h`, `<Space>ghs`, `<Space>ghr`, `<Space>ghu`, `<Space>ghp`, `<Space>ghb`, `<Space>gB` | Hunks, stage/reset/toggle-stage/preview/blame/inline blame |
| `]x`/`[x`, `2do`/`3do` | Conflict navigation, ours/theirs in Diffview |
| `<Space>tr`, `<Space>tt`, `<Space>tT`, `<Space>tl`, `<Space>td` | Neotest nearest/file/all/last/debug |
| `<Space>ts`, `<Space>to`, `<Space>tO`, `<Space>tS`, `<Space>tc`, `<Space>tC` | Summary/output/panel/stop/coverage/summary |
| `<Space>db`, `<Space>dB`, `<Space>dL`, `<Space>dX` | Breakpoint / conditional / logpoint / clear all |
| `<Space>dc`, `<Space>di`, `<Space>dO`, `<Space>do`, `<Space>dt`, `<Space>du`, `<Space>de` | Continue/step in/over/out/terminate/UI/evaluate |

### Neovim sessions

При обычном запуске `nvim` без аргументов проектная сессия автоматически
восстанавливается; перед `:qa`/`:wqa` раскладка сохраняется. Исключения —
запуск с файлами, stdin, `--headless`, `-c`, `-S` и editor для Git message.

| Клавиши | Действие |
|---|---|
| `Space qs` / `qS` / `ql` | Restore текущей / выбрать snapshot / последняя |
| `Space qd` | Не сохранять временную раскладку |
| `Space qq` | Trouble diagnostics, не выход |
| `:q`, `:qa`, `:wqa` | Выйти / выйти из всех / сохранить и выйти |

Helm/Jinja source-шаблоны получают только YAML-like/Jinja syntax highlighting;
`helm_ls`, `yamlls` и formatters для `yaml.jinja` намеренно отключены. В true
Helm buffer `helm-ls.nvim` экспериментально показывает inline resolved values,
если chart context разрешается, но точный результат даёт только `helm template`
или `helm lint` через явный project task. SQL completion отключён на стрелках,
чтобы навигация не лагала.

## Языки, package managers и project CLI

Mason/LazyVim extras дают LSP, Treesitter, formatter, DAP и test adapter для
JavaScript/TypeScript, Go, Rust, Python, C#, Lua, HTML/CSS, SQL, Helm/YAML.
Brewfile желает `go`, `rustup`, `dotnet`, `python`, `pyenv`, `uv`,
`cargo-nextest`; проектные менеджеры Node — npm/pnpm/Bun, а Nx/Angular aliases
ускоряют monorepo. Не смешивайте несколько LSP-клиентов одного языка без
причины; источник истины для project scripts — `package.json`, `Makefile`,
`Taskfile` или `.workmux.yaml`.

## Homebrew, mas, Stow и Ansible

`brew bundle --no-upgrade --file Brewfile` безопасно приводит машину к желаемому
набору формул и casks без неожиданных обновлений. Без `--no-upgrade` Homebrew
может обновить или остановить GUI casks. `brew bundle check --file Brewfile
--verbose` только проверяет состояние и ничего не устанавливает. `mas` —
только Mac App Store; Amphetamine — единственное приложение, которым управляет
`mas`, и это не cask. GUI casks (Docker Desktop, Maccy, Flameshot, ChatGPT,
Claude, Mos, VS Code, JetBrains Toolbox, AeroSpace и fonts) — companion apps,
не terminal tools. Установка/обновление cask может остановить приложение и
запросить sudo.

Stow раскладывает конфиги (`stow --restow --no-folding`), но не использует
`--adopt`: host-файл не должен перезаписывать source. Ansible запускается через
`all.yml` в порядке platform → homebrew → dotfiles → git → node → docker.
Изменение YAML проверяйте `ansible-playbook -i inventory/hosts.ini all.yml
--syntax-check` и `ansible-lint`; применение playbook — отдельная осознанная
операция.

### Каталог Brewfile

| Группа | Формулы (desired state) | Статус |
|---|---|---|
| Основа | `stow`, `git`, `neovim`, `tmux`, `herdr`, `workmux`, `bat`, `btop`, `yazi`, `atuin`, `starship` | Интегрированы |
| Shell/search | `zsh`, `bash`, `fzf`, `fd`, `ripgrep`, `zoxide`, `fzf-tab`, `zsh-*`, `eza`, `tree`, `tldr` | Интегрированы |
| JSON/text | `jq`, `yq`, `glow`, `jless`, `sd`, `choose-rust`, `ast-grep`, `tokei`, `atool`, `sevenzip` | CLI aliases/проектные tasks |
| Disk/network | `dust`, `duf`, `gping`, `bottom`, `hyperfine`, `viddy`, `doggo`, `bandwhich`, `lnav`, `trippy`, `mtr`, `nmap`, `tcpdump` | Provisioned, upstream defaults |
| Git | `lazygit`, `gh`, `glab`, `git-lfs`, `git-delta`, `difftastic` | Lazygit/Delta интегрированы |
| Containers/K8s | `kubectl`, `kubectx`, `minikube`, `helm`, `k9s`, `kustomize`, `kubeconform`, `stern`, `lazydocker`, `dive`, `qemu` | Aliases/TUI интегрированы |
| IaC/security/cloud | `terraform`, `ansible`, `ansible-lint`, `gitleaks`, `trivy`, `awscli` | Aliases/tasks; upstream defaults |
| Languages/runtime | `go`, `rustup`, `dotnet`, `python`, `pyenv`, `uv`, `cargo-nextest`, `redis`, `postgresql@16` | Toolchain/project dependent |
| HTTP/DB | `httpie`, `xh`, `httpyac`, `posting`, `resterm`, `harlequin`, `grpcurl` | `post`/`hq` и project configs |
| GNU/POSIX | `grep`, `gnutls`, `gnu-which`, `gnu-indent`, `gnu-tar`, `gnu-sed`, `gzip`, `diffutils`, `findutils`, `coreutils`, `gawk`, `make`, `watch`, `ed`, `bc`, `curl`, `wget`, `less`, `nano` | Provisioned, upstream defaults |
| Media/files | `ffmpegthumbnailer`, `imagemagick`, `poppler` | Provisioned, upstream defaults |

Exact tap-qualified declarations, useful when auditing Brewfile:
`raine/workmux/workmux`, `jesseduffield/lazygit/lazygit`, `derailed/k9s/k9s`,
`hashicorp/tap/terraform`. Brewfile describes desired state and does not claim
that any formula is installed on the host.

## AI CLI и рабочие пространства

AI-инструменты (Codex/Claude и project-local skills) запускаются внутри Herdr,
Tmux или Workmux-pane, чтобы сохранять context и процессы между окнами. Не
включайте тяжёлые AI desktop apps в prompt или shell startup. Проектные
spec/plan/implement последовательности, Beads и Workmux должны оставаться
явными; runtime state, OAuth и credential files не коммитятся.

## Безопасность и диагностика

- Перед destructive Git/Docker/Kubernetes/Terraform-командой выполните `gst`,
  проверьте branch/context/namespace и используйте полный флаг вместо alias.
- Не публикуйте `.env`, kubeconfig, токены, shell history и scrollback. Herdr
  сохраняет `pane_history=false` намеренно.
- Если пропал prompt: `command -v zsh starship git`; временно
  `ZSH_MULTIPLEXER=none zsh -f`; затем проверьте `zsh -n zsh/.zshrc zsh/*.zsh`.
- Если стартует не тот multiplexer: проверьте `~/.zshrc.local`,
  `echo $ZSH_MULTIPLEXER`, вложенность и `TERM`; новое окно терминала перечитает
  переменную.
- Если lag при scroll/completion: отключите внешние desktop AI apps, проверьте
  `btop`/`procs`, выключите сетевые проверки prompt и запускайте `nvim --clean`
  для сравнения.
- Если Tmux не видит Workmux: `command -v workmux`, затем `Prefix r`; если
  Herdr popup пуст, проверьте `herdr status` и PATH launch service.
- Если Neovim не видит LSP: `:LspInfo`, `:Mason`, root marker и project runtime;
  не устанавливайте второй сервер поверх LazyVim extra.

## Источники истины

- [Dotfiles](https://github.com/ZeiZel/dotfiles) — конфигурация и Brewfile.
- [Neovim README](https://github.com/ZeiZel/dotfiles/blob/main/nvim/README.md) —
  IDE pipeline и mappings.
- [Cheatsheet](https://github.com/ZeiZel/dotfiles/blob/main/docs/CHEATSHEET.md) —
  короткая ежедневная карта.
- [Workmux](https://github.com/raine/workmux) и
  [Tmux](https://github.com/tmux/tmux) — upstream documentation.
- В приложениях `?`/help всегда имеет приоритет над этой заметкой при обновлении
  версии инструмента.
