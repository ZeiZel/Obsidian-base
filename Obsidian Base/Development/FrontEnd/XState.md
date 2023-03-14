
XState - это машина состояний. То есть данная библиотека позволяет нам описать переход от одних состояний в проекте к другим состояниям и контролировать их.

Самый простой пример - это светофор:
- Горит зелёный свет
- проходит таймер
- Загорает жёлтый свет
- проходит таймер
- Загорает красный свет
- проходит таймер
- Загорает зелёный свет

И эта последовательность не может поменяться или нарушиться - оно запрограммирована

```JS
import { createMachine } from 'xstate';

const lightMachine = createMachine({
  id: 'light',
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: 'yellow'
      }
    },
    yellow: {
      on: {
        TIMER: 'red'
      }
    },
    red: {
      on: {
        TIMER: 'green'
      }
    }
  }
});

const currentState = 'green';

const nextState = lightMachine.transition(currentState, 'TIMER').value;
```

![](_png/Pasted%20image%2020230314092425.png)

[Тут](https://xstate-catalogue.com/) находятся примеры различных описаний состояний, которыми мы можем воспользоваться

Например, аутентификация.

![](_png/Pasted%20image%2020230314092953.png)









