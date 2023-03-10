`useRef()` - это хук, который предоставляет прямой доступ к ДОМ-элементам на странице


![](_png/Pasted%20image%2020230310100636.png)



```JS
const Form = () => {
	const [text, setText] = useState('');

	const myRef = useRef(1);

	useEffect(() => console.log(myRef.current));

	return (
		<Container>
			<form className='w-50 border mt-5 p-3 m-auto'>
				<div className='mb-3'>
					<label htmlFor='exampleFormControlInput1' className='form-label'>
						Email address
					</label>
					<input
						onChange={(e) => setText(e.target.value)}
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
						onClick={() => myRef.current + 1}
						className='form-control'
						id='exampleFormControlTextarea1'
						rows='3'
					></textarea>
				</div>
			</form>
		</Container>
	);
};
```
![](_png/Pasted%20image%2020230310101723.png)





