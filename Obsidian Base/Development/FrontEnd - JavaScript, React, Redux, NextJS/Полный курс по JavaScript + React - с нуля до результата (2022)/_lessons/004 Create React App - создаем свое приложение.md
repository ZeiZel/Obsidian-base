### **004 Create React App - создаем свое приложение**

Чтобы создать Реакт-проект

Через npx устанавливаем плагин create-react-app в папку first-react-proj (можно поставить «.» и темплэйт загрузится в текущую папку)

```bash
npx create-react-app first-react-proj

cd имя_папки // переходим в папку

npm start // запускаем компиляцию через вебпак
```

Это два основных файла в срц

![](../_png/Pasted%20image%2020220909181849.png)

Это та индекс-страница, которую просто так открывать бессмысленно – запуск только через npm start покажет нам результат. Так же в носкрипте есть текст, который выйдет если отключены скрипты на странице

![](../_png/Pasted%20image%2020220909181854.png)

И компиляцией jsx в навтивный js занимается бэйбель

![](../_png/Pasted%20image%2020220909181859.png)
[https://babeljs.io/docs/en/babel-plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx)