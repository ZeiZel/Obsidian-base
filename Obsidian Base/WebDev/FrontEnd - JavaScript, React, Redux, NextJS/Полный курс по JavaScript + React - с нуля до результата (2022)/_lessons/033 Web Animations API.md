
==Web Animations API== - это API, который связывает анимации JS и CSS. То есть в него мы передаём сначала ключевые кадры как в CSS, а уже потом передаём опции, которые влияют на эту анимацию


```JS
animate(keyframes, options)
```



```JS
document.getElementById("tunnel").animate([
  // keyframes
  { transform: 'translateY(0px)' },
  { transform: 'translateY(-300px)' }
], {
  // timing options
  duration: 1000,
  iterations: Infinity
});
```

Этим кодом мы заанимировали бесконечное движение телефона по ограниченным координатам

```JS
const btnPhone = document.querySelector('#iphone'),  
      btnMacbook = document.querySelector('#macbook'),  
      images = document.querySelectorAll('img');  
  
const phoneAnimation = images[0].animate([  
    // keyframes  
    { transform: 'translateY(0)' },  
    { transform: 'translateY(-100px)' },  
    { transform: 'translateY(100px)' },  
    { transform: 'translateY(0)' }  
], {  
    // timing options  
    duration: 3000,  
    iterations: Infinity  
});
```
![](_png/Pasted%20image%2020221022114245.png)

Анимация имеет 4 состояния (`PlayState`):
- idle
- running
- paused
- finished

Тут уже представлена полноценная реализация этой анимации со стейтами паузы, а так же с несколькими изменяемыми свойствами. Это более удобный вариант нежели чем создание такой же анимации через CSS

```JS
const btnPhone = document.querySelector('#iphone'),  
      btnMacbook = document.querySelector('#macbook'),  
      images = document.querySelectorAll('img');  
  
// переменная, которая будет хранить анимацию  
let phoneAnimation;  
// Регулируем анимацию по кнопке  
btnPhone.addEventListener('click', () => {  
    // Запускаем анимацию при нажатии на кнопку  
    if (!phoneAnimation) {  
        phoneAnimation = images[0].animate([  
            // keyframes  
            { transform: 'translateY(0) rotate(0)',  
                filter: 'opacity(100%)'},  
            { transform: 'translateY(-100px) rotate(180deg)',  
                filter: 'opacity(50%)'},  
            { transform: 'translateY(100px) rotate(270deg)',  
                filter: 'opacity(90%)'},  
            { transform: 'translateY(0) rotate(360deg)',  
                filter: 'opacity(100%)'}  
        ], {  
            // timing options  
            duration: 3000,  
            iterations: Infinity  
        });  
        // Если анимация находится в состоянии паузы, то  
    } else if (phoneAnimation.playState === 'paused') {  
        // ... нужно опять запустить анимацию  
        phoneAnimation.play();  
        // Если анимация есть и она не стоит на паузе, то мы её должны поставить на паузу  
    } else {  
        phoneAnimation.pause();  
    }  
})
```
![](_png/Pasted%20image%2020221022115706.png)