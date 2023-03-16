
```bash
npm i formik
```

==Formik== - это популярная библиотека под ==React== по работе с формами на странице.

- `initialValue` - важный начальный атрибут для компонента `Formik`. В него мы вписываем связанные имена с инпутами в виде ключей и их данные являются начальными значениями. Связь устанавливается с формами через атрибут внутри формы `name` или `id`
- `validate` - атрибут, который хранит функцию валидации форм
- `onSubmit` - атрибут, который хранит функцию, срабатывающую при отправке формы

Тут представлен пример классического использования формика на странице:

```JS
import React from 'react';
import { Formik } from 'formik';

const Basic = () => (
  <div>
    <h1>Anywhere in your app!</h1>
    <Formik
      // начальные значения
      initialValues={{ email: '', password: '' }}
      // функция валидации полей
      validate={values => {
        const errors = {};
        if (!values.email) {
          errors.email = 'Required';
        } else if (
          !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
        ) {
          errors.email = 'Invalid email address';
        }
        return errors;
      }}
      // функция сабмита формы
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          setSubmitting(false);
        }, 400);
      }}
    >
      {({
        values, // значения формы
        errors, // объект с ошибками
        touched, // отображает, трогал ли пользователь данную форму
        handleChange, // событие изменения формы
        handleBlur, // действие при снятии фокуса
        handleSubmit, // сабмит формы
        isSubmitting, // состояние сабмита формы
        /* and other goodies */
      }) => (
        // форма при сабмите будет выполнять данную операцию
        <form onSubmit={handleSubmit}>
          <input
            type="email" // тип
            name="email" // имя, которое связывает с initialValues
            onChange={handleChange} // действие при изменении
            onBlur={handleBlur} // действие при снятии фокуса
            value={values.email} // связывание значения
          />
          {/* отображаем ошибку, если такая появилась */}
          {errors.email && touched.email && errors.email}
          <input
            type="password"
            name="password"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.password}
          />
          {errors.password && touched.password && errors.password}
          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </form>
      )}
    </Formik>
  </div>
);

export default Basic;
```

Так же формик предоставляет готовые компоненты `Form`, `Field`, `ErrorMessage`, которые можно использовать в проекте вместо стандартных форм:

```JS
 // Render Prop
 import React from 'react';
 import { Formik, Form, Field, ErrorMessage } from 'formik';
 
 const Basic = () => (
   <div>
     <h1>Any place in your app!</h1>
     <Formik
       initialValues={{ email: '', password: '' }}
       validate={values => {
         const errors = {};
         if (!values.email) {
           errors.email = 'Required';
         } else if (
           !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
         ) {
           errors.email = 'Invalid email address';
         }
         return errors;
       }}
       onSubmit={(values, { setSubmitting }) => {
         setTimeout(() => {
           alert(JSON.stringify(values, null, 2));
           setSubmitting(false);
         }, 400);
       }}
     >
       {({ isSubmitting }) => (
         <Form>
           <Field type="email" name="email" />
           <ErrorMessage name="email" component="div" />
           <Field type="password" name="password" />
           <ErrorMessage name="password" component="div" />
           <button type="submit" disabled={isSubmitting}>
             Submit
           </button>
         </Form>
       )}
     </Formik>
   </div>
 );
 
 export default Basic;
```

Далее будет реализована форма отправки данных на пожертвования. Со всей формы будут собираться данные и выводиться в логе строковый вариант объекта

- функция `handleChange` будет перехватывать изменения внутри формы и определять, в какой произошли изменения
- функция формика `handleBlur` записывает формы в объект `touched`, который передаётся в форму внутри объекта `values`. После добавления этой функции в инпут, можно будет воспользоваться объектом `touched` для проверки при выводе ошибки

```JS
import { useFormik } from 'formik';

// функция валидации форм
const validate = (values) => {
	const errors = {}; // массив ошибок формы

	// если отсутствует имя
	if (!values.name) {
		errors.name = 'Обязательное поле!';

		// если имя меньше двух символов
	} else if (values.name.length < 2) {
		errors.name = 'Имя должно иметь больше двух символов!';
	}

	// если отсутствует почта
	if (!values.email) {
		errors.email = 'Обязательное поле!';

		// если почта не подходит по структуре
	} else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
		errors.email = 'Нужно ввести корректную почту!';
	}

	return errors;
};

const Form = () => {
	// хук Формика
	const formik = useFormik({
		initialValues: {
			name: '',
			email: '',
			amount: 0,
			currency: '',
			text: '',
			terms: false,
		},
		validate, // эта функция валидации будет применяться автоматически
		onSubmit: (values) => {
			// данная функция выведет лог с объектом, который переведён в понятную строку
			console.log(JSON.stringify(values, null, 2));
		},
	});

	return (
		<form
			className='form'
			// сюда передаём функцию, которая будет перехватывать сабмит из формы
			onSubmit={formik.handleSubmit}
		>
			<h2>Отправить пожертвование</h2>
			<label htmlFor='name'>Ваше имя</label>
			<input
				id='name'
				name='name'
				type='text'
				// это значение будет связано с состоянием внутри формика
				value={formik.values.name}
				// эта функция будет отслеживать какие данные и в какой форме поменялись
				onChange={formik.handleChange}
				// сообщает формику, трогал ли пользователь данную форму
				onBlur={formik.handleBlur}
			/>
			{/* вывод ошибки */}
			{formik.errors.name && formik.touched.name ? (
				<div style={{ color: 'red' }}>{formik.errors.name}</div>
			) : null}
			<label htmlFor='email'>Ваша почта</label>
			<input
				id='email'
				name='email'
				type='email'
				value={formik.values.email}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			/>
			{formik.errors.email && formik.touched.email ? (
				<div style={{ color: 'red' }}>{formik.errors.email}</div>
			) : null}
			<label htmlFor='amount'>Количество</label>
			<input
				id='amount'
				name='amount'
				type='number'
				value={formik.values.amount}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			/>
			<label htmlFor='currency'>Валюта</label>
			<select
				id='currency'
				name='currency'
				value={formik.values.currency}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			>
				<option value=''>Выберите валюту</option>
				<option value='USD'>USD</option>
				<option value='UAH'>UAH</option>
				<option value='RUB'>RUB</option>
			</select>
			<label htmlFor='text'>Ваше сообщение</label>
			<textarea
				id='text'
				name='text'
				value={formik.values.text}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			/>
			<label
				className='checkbox'
				value={formik.values.terms}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			>
				<input name='terms' type='checkbox' />
				Соглашаетесь с политикой конфиденциальности?
			</label>
			<button type='submit'>Отправить</button>
		</form>
	);
};

export default Form;
```

- При вводе валидных данных форма будет их собирать и отправлять

![](_png/Pasted%20image%2020230316174234.png)

- Все формы могут воспринимать ошибки и реагируют на них

![](_png/Pasted%20image%2020230316185145.png)

- У нас выделяется всего один инпут с ошибкой (а не сразу во всех отображается ошибка, как бы было без `touched`)
- Так же данные не будут отправляться, если в поле есть невалидные данные

![](_png/Pasted%20image%2020230316185150.png)

Самый простой вариант валидации - это использовать стороннюю библиотеку, которая поможет избежать рутинных процессов, а именно - Yup. Он уже имеет много методов для валидации данных в себе и очень прост в использовании.

```bash
npm i yup
```

Тут показан пример, заданный в `validationSchema` (функция валидации данных находится второй по списку!). Все значения описаны в объекте схемы и через чейн вызваются функции проверки данных с формы. Сам Юп возвращает один объект ошибки, который работает подобно нашей самостоятельной реализации выше

```JS
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Form = () => {
	// хук Формика
	const formik = useFormik({
		initialValues: {
			name: '',
			email: '',
			amount: 0,
			currency: '',
			text: '',
			terms: false,
		},
		// тут мы должны описать схему валидации
		validationSchema: Yup.object({
			// поле name
			name: Yup.string() // тип - строка
				.min(2, 'Имя должно иметь больше двух символов!') // минимальная длина и сообщение
				.required('Обязательное поле'), // обязательно к заполнению
			email: Yup.string()
				.email('Нужно ввести корректную почту!')
				.required('Обязательное поле'),
			amount: Yup.number()
				.min(5, 'Пожертвование не меньше 5 уе')
				.max(1000, 'Пожертвование не больше 1000 уе')
				.required('Обязательное поле'),
			currency: Yup.string().required('Выберите валюту'),
			text: Yup.string(), // необязательное поле
			terms: Yup.boolean()
				.oneOf([true], 'Необходимо согласие') // тут значение будет валидным, если оно равно одному из указанных в массиве
				.required('Подтвердите согласие'),
		}),
		onSubmit: (values) => {
			// данная функция выведет лог с объектом, который переведён в понятную строку
			console.log(JSON.stringify(values, null, 2));
		},
	});

	return (
		<form
			className='form'
			// сюда передаём функцию, которая будет перехватывать сабмит из формы
			onSubmit={formik.handleSubmit}
		>
			<h2>Отправить пожертвование</h2>
			<label htmlFor='name'>Ваше имя</label>
			<input
				id='name'
				name='name'
				type='text'
				// это значение будет связано с состоянием внутри формика
				value={formik.values.name}
				// эта функция будет отслеживать какие данные и в какой форме поменялись
				onChange={formik.handleChange}
				// сообщает формику, трогал ли пользователь данную форму
				onBlur={formik.handleBlur}
			/>
			{/* вывод ошибки */}
			{formik.errors.name && formik.touched.name ? (
				<div style={{ color: 'red' }}>{formik.errors.name}</div>
			) : null}
			<label htmlFor='email'>Ваша почта</label>
			<input
				id='email'
				name='email'
				type='email'
				value={formik.values.email}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			/>
			{formik.errors.email && formik.touched.email ? (
				<div style={{ color: 'red' }}>{formik.errors.email}</div>
			) : null}
			<label htmlFor='amount'>Количество</label>
			<input
				id='amount'
				name='amount'
				type='number'
				value={formik.values.amount}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			/>
			{formik.errors.amount && formik.touched.amount ? (
				<div style={{ color: 'red' }}>{formik.errors.amount}</div>
			) : null}
			<label htmlFor='currency'>Валюта</label>
			<select
				id='currency'
				name='currency'
				value={formik.values.currency}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			>
				<option value=''>Выберите валюту</option>
				<option value='USD'>USD</option>
				<option value='UAH'>UAH</option>
				<option value='RUB'>RUB</option>
			</select>
			{formik.errors.currency && formik.touched.currency ? (
				<div style={{ color: 'red' }}>{formik.errors.currency}</div>
			) : null}
			<label htmlFor='text'>Ваше сообщение</label>
			<textarea
				id='text'
				name='text'
				value={formik.values.text}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			/>
			{formik.errors.text && formik.touched.text ? (
				<div style={{ color: 'red' }}>{formik.errors.text}</div>
			) : null}
			<label
				className='checkbox'
				value={formik.values.terms}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
			>
				<input name='terms' type='checkbox' />
				Соглашаетесь с политикой конфиденциальности?
			</label>
			{formik.errors.terms && formik.touched.terms ? (
				<div style={{ color: 'red' }}>{formik.errors.terms}</div>
			) : null}
			<button type='submit'>Отправить</button>
		</form>
	);
};

export default Form;
```

И так выглядят все реакции на ошибки в форме:

![](_png/Pasted%20image%2020230316193936.png)





