
[Styled Components](https://styled-components.com/) в ==React== позволяют писать CSS код ==прямо== внутри реакт-компонентов

Устанавливаются через:

```bash
npm install --save styled-components
```

Дальше для реализации компонента с логикой и его стилями используются ==[тэгированные шаблонные строки](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)==
Конкретно тут мы сделаем компонент `Button`, который будет представлять из себя ссылку `a` с определёнными стилями внутри кавычек

```JSX
const Button = styled.a`
  /* This renders the buttons above... Edit me! */
  display: inline-block;
  border-radius: 3px;
  padding: 0.5rem 0;
  margin: 0.5rem 1rem;
  width: 11rem;
  background: transparent;
  color: white;
  border: 2px solid white;

  /* The GitHub button is a primary button
   * edit this to target it specifically! */
  ${props => props.primary && css`
    background: white;
    color: black;
  `}
`
```



```JSX
// импорт стилевых компонентов
import styled from 'styled-components';

// Создание стилевых компонентов
const Wrapper = styled.div`  
    width: 600px;    
    margin: 80px auto 0 auto;
`;  

function App() {  
    return (  
	    // Использование стилевых компонентов
        <Wrapper>  
            <WhoAmI name='John' surname="Smith" link="google.com" />  
            <WhoAmI name='Angela' surname="Coose" link="facebook.com" />  
        </Wrapper>  
    );  
}
```

