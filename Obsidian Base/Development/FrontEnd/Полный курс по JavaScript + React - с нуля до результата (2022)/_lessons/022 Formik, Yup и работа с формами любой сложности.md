
==Formik== - это популярная библиотека под ==React== по работе с формами на странице.

- `initialValue` - важный начальный атрибут для компонента `Formik`. В него мы вписываем связанные имена с инпутами в виде ключей и их данные являются начальными значениями. Связь устанавливается с формами через атрибут внутри формы `name` или `id`
- `validate` - атрибут, который хранит функцию валидации форм

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
        touched, // 
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





