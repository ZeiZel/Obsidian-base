
## Установка алиаса

Чтобы не писать постоянно pnpm, мы можем создать алиас

### на win

```
notepad $profile.AllUsersAllHosts
```


`profile.ps1`
```
set-alias -name pn -value pnpm
```

### на linux


```
alias pn=pnpm
```
