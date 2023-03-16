
**React Transition Group** - классический модуль для создания анимаций в React.

```bash
npm install react-transition-group
```

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

Например, нам нужно скрыть кнопку, которая является триггером для модального окна

```JS
const Modal = ({ showModal, setShowTrigger, onClose }) => {
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
		<Transition in={showModal} timeout={duration} onEnter={() => setShowTrigger(false)} onExited={() => setShowTrigger(true)}>
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
	const [showTrigger, setShowTrigger] = useState(true);

	return (
		<Container>
			<Modal showModal={showModal} setShowTrigger={setShowTrigger} onClose={setShowModal} />
			{showTrigger ? (
				<button type='button' className='btn btn-warning mt-5' onClick={() => setShowModal(true)}>
					Open Modal
				</button>
			) : null}
		</Container>
	);
}
```

![](_png/Pasted%20image%2020230316130500.png)

![](_png/Pasted%20image%2020230316130502.png)

Далее идёт компонент `CSSTransition`. Его отличительная особенность заключается в том, что мы не должны передавать состояния внутрь компонента и рендерить весь компонент через функцию тоже не нужно. Этот компонент работает с готовыми стилями и производит анимацию на её основе.

Данный компонент принимает в себя атрибут classNames, где указывается начальное наименование стилей, которые относятся к этому компоненту и далее они воспроизводятся в зависимости от их префикса:
- `-enter`
- `-enter-active`
- `-exit`
- `-exit-active`

```JS
const Modal = ({ showModal, setShowTrigger, onClose }) => {
	// длительность
	const duration = 300;

	return (
		<CSSTransition
			in={showModal}
			timeout={duration}
			onEnter={() => setShowTrigger(false)}
			onExited={() => setShowTrigger(true)}
			// базовый className
			classNames={'modal'}
			// для решения проблем с обрывом анимации
			mountOnEnter
			unmountOnExit
		>
			<div className='modal mt-5 d-block'>
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
		</CSSTransition>
	);
};
```

```CSS
/* дефолтное состояние компонента */
/* лучше не использовать такой подход, а просто атрибутами в компоненте транзишена указать mountOnEnter и unmountOnExit */
/* .modal {
  visibility: hidden;
  opacity: 0;
} */

/* начало появления компонента */
.modal-enter {
  opacity: 0;
}

/* конечное состояние анимации компонента */
.modal-enter-active {
  visibility: visible;
  opacity: 1;
  transition: all 300ms;
}

/* указываем конечное состояние компонента */
.modal-enter-done {
  visibility: visible;
  opacity: 1;
}

.modal-exit {
  opacity: 1;
}

/* конечное состояние вышедшего компонента */
.modal-exit-active {
  visibility: hidden;
  opacity: 0;
  transition: all 300ms;
}

```

Далее идут два компоненты - `SwitchTransition` и `TransitionGroup` - это компоненты, которые модифицируют поведение первых двух

Основной особенностью `SwitchTransition` является переключение режимов анимации через атрибут `mode`:

- `out-in` - запускает анимацию и дожидаётся её окончания перед тем, как запустить анимацию другого компонента

![](_png/Pasted%20image%2020230316142123.png)

- `in-out` - сначала дожидается анимации появления второго компонента и только потом удаляет первый компонент со страницы

![](_png/Pasted%20image%2020230316142141.png)
![](_png/Pasted%20image%2020230316142144.png)

Компонент `TransitionGroup` занимается оборачиванием других компонентов анимации.

Конкретно в этом компоненте обычно разворачивают остальные компоненты транзишена из массива. Так же он позволяет не указывать атрибут `in`, так как этот компонент отслеживает начало всех анимаций.

![](_png/Pasted%20image%2020230316142630.png)
