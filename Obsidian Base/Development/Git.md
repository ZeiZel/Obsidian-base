#Git #GitHub 

# 1. Подготовка

## 01 Установка имени и электронной почты

Если вы никогда ранее не использовали git, для начала вам необходимо осуществить установку. Выполните следующие команды, чтобы git узнал ваше имя и электронную почту.

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@whatever.com"
```

## 02 Параметры установки окончаний строк

```bash
git config --global core.autocrlf true
git config --global core.safecrlf warn
```

## 03 Установка отображения unicode

По умолчанию, git будет печатать не-[ASCII символы](https://unicode-table.com/ru/#basic-latin) в именах файлов в виде восьмеричных последовательностей `\nnn`. Чтобы избежать нечитаемых строк, установите соответствующий флаг:

```bash
git config --global core.quotepath off
```
