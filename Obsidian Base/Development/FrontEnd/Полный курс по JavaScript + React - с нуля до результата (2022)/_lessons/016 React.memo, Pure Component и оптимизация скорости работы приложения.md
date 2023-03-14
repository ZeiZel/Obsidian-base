
`React.memo` - это компонент высшего порядка (HOC), который предназначен для мемоизации рендера компонента. Если в компонент не пришли новые пропсы или не изменился стейт, то компонент не перерендерится и сохранит ресурсы компьютера пользователя. 

Например, мы имеем форму. При нажатии на кнопку компонент формы получает новые пропсы и перерендеривается.

```JS
import { useState } from 'react';
import { Container } from 'react-bootstrap';
import './App.css';

const Form = (props) => {
	console.log('render Form');

	return (
		<Container>
			<form className='w-50 border mt-5 p-3 m-auto'>
				<div className='mb-3'>
					<label htmlFor='exampleFormControlInput1' className='form-label mt-3'>
						Email address
					</label>
					<input
						value={props.mail}
						type='email'
						className='form-control'
						id='exampleFormControlInput1'
						placeholder='name@example.com'
					/>
				</div>
				<div className='mb-3'>
					<label htmlFor='exampleFormControlTextarea1' className='form-label'>
						Example textarea
					</label>
					<textarea
						value={props.text}
						className='form-control'
						id='exampleFormControlTextarea1'
						rows='3'
					></textarea>
				</div>
			</form>
		</Container>
	);
};

function App() {
	const [data, setData] = useState({
		mail: 'name@example.com',
		text: 'some text',
	});

	return (
		<>
			<Form mail={data.mail} text={data.text} />
			<button
				onClick={() =>
					setData({
						mail: 'second@example.com',
						text: 'another text',
					})
				}
			>
				Click me
			</button>
		</>
	);
}

export default App;
```

![](_png/Pasted%20image%2020230314172408.png)

Чтобы решить вышеописанную проблему, нужно просто обернуть компонент в `memo()`, который сохранит результат рендера и при неизменных значениях не будет рендерить компонент заново

```JS
// обернём компонент в memo()
const Form = memo((props) => {
	console.log('render Form');

	/// CODE ...
});
```

![](_png/Pasted%20image%2020230314173409.png)

Однако тут нужно упомянуть, что перерендер будет происходить, если внутри пропсов мы передаём свойства с вложенными объектами

```JS
function App() {
	const [data, setData] = useState({
		// объект внутри свойства объекта
		mail: { name: 'name@example.com' },
		text: 'some text',
	});

	return (
		<>
			<Form mail={data.mail} text={data.text} />
			<button
				onClick={() =>
					setData({
						// передаём mail - name
						mail: { name: 'name@example.com' },
						text: 'another text',
					})
				}
			>
				Click me
			</button>
		</>
	);
}
```

![](_png/Pasted%20image%2020230314174603.png)

Чтобы указать, что в приложении нам нужно реализовать для определённого пропса глубокую проверку (проверять изменение вложенных значений), то нам нужно реализовать функцию, которая будет сравнивать значения и возвращать `boolean`

```JS
// функция для сравнения пропсов
const propsCompare = (prevProps, nextProps) => {
	return prevProps.mail.name === nextProps.mail.name;
};

const Form = memo((props) => {
	console.log('render Form');

	return (
		<Container>
			<form className='w-50 border mt-5 p-3 m-auto'>
				<div className='mb-3'>
					<label 
						htmlFor='exampleFormControlInput1' 
						className='form-label mt-3'
					>	
						Email address
					</label>
					<input
						value={props.mail.name}
						type='email'
						className='form-control'
						id='exampleFormControlInput1'
						placeholder='name@example.com'
					/>
				</div>
				<div className='mb-3'>
					<label 
						htmlFor='exampleFormControlTextarea1' 
						className='form-label'
					>	
						Example textarea
					</label>
					<textarea
						value={props.text}
						className='form-control'
						id='exampleFormControlTextarea1'
						rows='3'
					></textarea>
				</div>
			</form>
		</Container>
	);
}, propsCompare);
```

![](_png/Pasted%20image%2020230314175906.png)





==Pure Component== - это








