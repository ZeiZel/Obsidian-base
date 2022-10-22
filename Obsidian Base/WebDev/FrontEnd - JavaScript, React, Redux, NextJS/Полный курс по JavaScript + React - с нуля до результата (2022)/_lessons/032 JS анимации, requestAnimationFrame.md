
Главная проблема CSS-анимаций заключается в том, что построить сложную анимацию крайне сложно. Так же для настройки плавности анимации используются сугубо кривые Безье 

```CSS
p {
  animation-duration: 3s;
  animation-name: slidein;
}

@keyframes slidein {
  from {
    margin-left: 100%;
    width: 300%;
  }

  to {
    margin-left: 0%;
    width: 100%;
  }
}
```

Главная проблема анимаций на JS через тот же `setTimeout` заключается в том, что они не реагируют на частоту кадров пользователя на компьютере. Обычно она составляет 60 кадров в секунду, но ПК пользователя может быть нагружен и не способен выдавать нужное количество кадров в секунду

![](_png/Pasted%20image%2020221022102327.png)

Поэтому был создан API: `requestAnimationFrame`. Он подстраивается под количество кадров на компьютере пользователя и позволяет реализовать адекватную анимацию. Так же он оптимизирует нашу анимацию (запускает анимацию и производит отрисовку в браузере одновременно, а не последовательно, как в обычных функциях). 

==Стандартный вариант==
Вот так выглядит стоковая анимация через `setInterval`

```JS
const btn = document.querySelector(".animation-button"),  
    box = document.querySelector(".box-rider");

function myAnimation() {  
    const box = document.querySelector(".box-rider");  
    let pos = 0;  
  
    const id = setInterval(frame, 5);  
    function frame() {  
        if (pos === 480) {  
            clearInterval(id);  
        } else {  
            pos++;  
            box.style.top = `${pos}px`;  
            box.style.left = `${pos}px`;  
        }    }  
}  
btn.addEventListener('click', myAnimation)
```

==Предпочтительный вариант==
И вот так выглядит код с использованием `requestAnimationFrame`. Тут мы рекурсивно вызываем функцию по заданному условию, что позволяет нам сократить код и не использовать таймауты. Так же эта анимация и более оптимизирована под браузеры.

```JS
const btn = document.querySelector(".animation-button"),  
    box = document.querySelector(".box-rider");

let pos = 0;  
function myAnimationFrame() {  
    pos++;  
    box.style.top = `${pos}px`;  
    box.style.left = `${pos}px`;  

	// Тут идёт перевызов функции до тех пор, пока не будет выполнено условие
    if (pos < 480) {  
        requestAnimationFrame(myAnimationFrame);  
    }  
}  

// Вызов функции с аргументами в листенерах нужно осуществлять через стрелочные функции
btn.addEventListener('click', () => requestAnimationFrame(myAnimationFrame));
```

Этот код позволит остановить анимацию по нашему усмотрению

```JS
let id = requestAnimationFrame(myAnimationFrame);  
cancelAnimationFrame(id);
```