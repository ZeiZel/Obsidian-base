
Попробуем воспользоваться методом, который срабатывает при появлении ошибки в компоненте `componentDidCatch`. В нём мы установим состояние ошибки компонента и выведем информацию о полученных аргументах.

`src > component > charInfo > CharInfo.js`
```JS
// сработает при ошибке  
// error - сама ошибка / errorInfo - информация о компоненте, в котором произошла ошибка  
componentDidCatch(error, errorInfo) {  
   console.log(error, errorInfo);  
   this.setState({ error: true });  
}  
  
updateChar = () => {  
   const { charId } = this.props;  
  
   if (!charId) return;  
  
   this.onCharLoading();  
  
   this.marvelService.getCharacter(charId).then(this.onCharLoaded).catch(this.onError);  
  
   // ошибка  
   this.foo.bar = 0;  
};
```

И, как мы видим, ошибка всё равно выскакивает и в консоли нет информации из метода. Логика данного хука была изменена в 16 версии реакта и теперь она не предотвращает краш всей страницы. Это было сделано с целью предотвращения отправки на сервер некорректных данных. 

![](_png/Pasted%20image%2020230304193328.png)

И тут мы переходим к такому подходу, как **Error Boundary** (предохранители) - это функционал, который собой оборачивает наш компонент, и если в нём происходит ошибка, то он её отлавливает






