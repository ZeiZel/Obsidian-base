
Для ==React== существует отдельный и подогнанный под него ==[Bootstrap](https://react-bootstrap.github.io/getting-started/introduction)==

```bash
npm install react-bootstrap bootstrap
```

Дальше в `index.js` (самый основной JS-файл) нужно запихнуть файл стилей

```JSX
import 'bootstrap/dist/css/bootstrap.min.css';
```

И далее в побочных файлах только остаётся импортировать определённые компоненты бутстрапа 

```JSX
import {Container, Row, Col} from 'react-bootstrap';  
  
const BootstrapTest = () => {  
    return (  
        <Container>  
            <Row>  
                <Col>1 of 2</Col>  
                <Col>2 of 2</Col>  
            </Row>  
        </Container>  
    );  
}  
  
export default BootstrapTest;
```


