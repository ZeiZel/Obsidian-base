
React Transition Group - классический модуль для создания анимаций в реакте.

Компонент `Transition`. Он принимает в себя на вход `nodeRef` (элемент ссылки), `in` (элемент появляется или исчезает со страницы) и `timeout` (длительность анимации)

Элемент при появлении делится на три этапа (пропс `in` в позиции `false`, что говорит об отсутствии элемента):
- `onEnter` - инициализация появления
- `onEntering` - появление
- `onEntered` - окончание появления на странице

Противоположные состояния имеются, при наличии элемента на странице (актуальна анимация исчезновения элемента со страницы)

Все этапы изображены тут:

![](_png/Pasted%20image%2020230316100337.png)

Все промежутки ожидания имеют определённую длительность. Анимировать мы можем переход от `entering` к `entered` и от `exiting` к `exited`

![](_png/Pasted%20image%2020230316100341.png)



> Тут стоит отметить, что свойство `display` (`none` и `block`) невозможно анимировать, поэтому их не используем

```JS
import { useState, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { Transition } from 'react-transition-group'; // импорт
import './App.css';

const Modal = ({ showModal, onClose }) => {
	// длительность
	const duration = 300;

	// базовые стили
	const defaultStyle = {
		transition: `all ${duration}ms ease-in-out`,
		opacity: 0,
		visibility: 'hidden',
	};

	// стили на разных этапах перехода
	const transitionStyles = {
		entering: { opacity: 1, visibility: 'visible' },
		entered: { opacity: 1, visibility: 'visible' },
		exiting: { opacity: 0, visibility: 'hidden' },
		exited: { opacity: 0, visibility: 'hidden' },
	};

	return (
		<Transition in={showModal} timeout={duration}>
			{(state) => (
				<div className='modal mt-5 d-block' style={{ ...defaultStyle, ...transitionStyles[state] }}>
					<div className='modal-dialog'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>Typical modal window</h5>
								<button
									onClick={() => onClose(false)}
									type='button'
									className='btn-close'
									aria-label='Close'
								></button>
							</div>
							<div className='modal-body'>
								<p>Modal body content</p>
							</div>
							<div className='modal-footer'>
								<button onClick={() => onClose(false)} type='button' className='btn btn-secondary'>
									Close
								</button>
								<button onClick={() => onClose(false)} type='button' className='btn btn-primary'>
									Save changes
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</Transition>
	);
};

function App() {
	const [showModal, setShowModal] = useState(false);

	return (
		<Container>
			<Modal showModal={showModal} onClose={setShowModal} />
			<button type='button' className='btn btn-warning mt-5' onClick={() => setShowModal(true)}>
				Open Modal
			</button>
		</Container>
	);
}

export default App;
```

![](_png/Pasted%20image%2020230316124609.png)

Так же в транзишене есть атрибут, который размонтирует компонент, когда его нет на странице

![](_png/Pasted%20image%2020230316124655.png)

![](_png/Pasted%20image%2020230316124701.png)

![](_png/Pasted%20image%2020230316124657.png)

Так же стоит рассказать, что для транзишена ещё имеются и функции, которые позволяют выполнять разные операции на разных этапах анимации компонента.

Например, `onEntering` принимает в себя функцию, которая может выполниться во время появления компонента

Тут показан жизненный цикл выполнения данных функций:

![](_png/Pasted%20image%2020230316124920.png)

![](_png/Pasted%20image%2020230316125004.png)












