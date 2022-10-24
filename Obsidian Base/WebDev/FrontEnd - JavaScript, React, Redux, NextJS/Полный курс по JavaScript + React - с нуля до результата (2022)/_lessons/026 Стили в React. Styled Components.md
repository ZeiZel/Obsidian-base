
[Styled Components](https://styled-components.com/) в ==React== позволяют писать CSS код ==прямо== внутри реакт-компонентов

Устанавливаются через:

```bash
npm install --save styled-components
```

Дальше для реализации компонента с логикой и его стилями используются ==[тэгированные шаблонные строки](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)==

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





