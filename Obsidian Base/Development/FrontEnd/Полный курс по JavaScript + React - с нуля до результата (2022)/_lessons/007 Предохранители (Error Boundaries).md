


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



![](_png/Pasted%20image%2020230304193328.png)








