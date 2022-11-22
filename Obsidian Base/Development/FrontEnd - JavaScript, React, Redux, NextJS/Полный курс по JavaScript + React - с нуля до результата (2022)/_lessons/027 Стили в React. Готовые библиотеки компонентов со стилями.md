
Для ==React== существует отдельный и подогнанный под него ==[Bootstrap](https://react-bootstrap.github.io/getting-started/introduction)==

```bash
npm install react-bootstrap bootstrap
```

Дальше в `index.js` (самый основной JS-файл) нужно запихнуть файл стилей

```JSX
import 'bootstrap/dist/css/bootstrap.min.css';
```

И далее в побочных файлах только остаётся импортировать определённые компоненты бутстрапа (из документации)

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

![](_png/Pasted%20image%2020221024182616.png)

Использование в основном файле:

```JSX
import React, {StrictMode} from 'react';  
import ReactDOM from 'react-dom/client';  
import './index.css';  
import App, {Btn, Field, Header} from './App';  
import styled from 'styled-components';  

// Импорты бутстрапа и примера
import 'bootstrap/dist/css/bootstrap.min.css';  
import BootstrapTest from './BootstrapTest';  
  
const root = ReactDOM.createRoot(document.getElementById('root'));  
root.render(  
  <StrictMode>  
      <App/>  
      <BootstrapTest/>  {/* использование */}
  </StrictMode>  
);
```