
Обычно, чтобы передавать состояние из одного компонента в другой, мы пользуемся таким подходом:

![](_png/bf046a6da263cfb6114e57d8011472db.png)

Но иногда нам может понадобиться логика определённого компонента сразу в нескольких местах, что заставит нас переделывать один и тот же компонент

Чтобы можно было воспользоваться логикой одного компонента внутри другого компонента и не делать жёсткую вёрстку, можно воспользоваться следующим подходом:

```JS
// это функция, которая выводит сообщение с определённым каунтером
const Message = (props) => {
    return (
        <h2>The counter is {props.counter}</h2>
    )
}

// Это сам каунтер с кнопкой
class Counter extends Component {
    state = {
        counter: 0
    }

    changeCounter = () => {
        this.setState(({counter}) => ({
            counter: counter + 1
        }))
    }

    render() {
        return (
            <>
                <button
                    className={'btn btn-primary'}
                    onClick={this.changeCounter}>
                    Click me
                </button>
                
                {/* тут мы вызваем рендер одного компонента внутри другого и передаём в него нужный пропс */}
                {this.props.render(this.state.counter)}
            </>
        )
    }
}

function App() {
  return (
    <Wrapper>
    
		{/* тут мы используем подход, когда независимый компонент передаёт состояние в другой независимый компонент */}
        <Counter render={counter => (
            <Message counter={counter}/>
        )}/>

        <HelloGreating/>
        <BootstrapTest
            left = {
                <DynamicGreating color={'primary'}>
                    <h2>This weel was hard</h2>
                    <h2>Hello world!</h2>
                </DynamicGreating>
            }
            right = {
                <DynamicGreating color={'primary'}>
                    <h2>RIGHT!</h2>
                </DynamicGreating>
            }
        />

        <WhoAmI name='John' surname="Smith" link="facebook.com"/>
        <WhoAmI name='Alex' surname="Shepard" link="vk.com"/>
    </Wrapper>
  );
}

export default App;
```



![](_png/2f1bc8cacbddd53ad5dba9dabde196fa.png)


>[!note] Такой подход называется Render-props, когда мы передаём внутрь одного компонента в качестве пропса другой компонент на отрисовку
> - При таком подходе мы передаём в компонент функцию, которая при вызове возвращает вёрстку и на вход принимает аргументы от родителя 