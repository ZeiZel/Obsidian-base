#Vue

## Теория

Во вью реализован компонентный подход для реализации приложения

![](_png/Pasted%20image%2020230610101650.png)

Так же вью решает проблему реактивности в веб-приложениях. При обычном подходе, страница не знает, что у неё изменилось значение какого-либо элемента

![](_png/Pasted%20image%2020230610102827.png)

При использовании вью, мы создаём модели, которые представляют собой данные, которые мы можем изменять в шаблонах

![](_png/Pasted%20image%2020230610102928.png)

Те данные, которые мы описываем под изменения, называются моделями. Под капотом они оборачиваются в прокси, который срабатывает на получение и установку модели и тем самым срабатывает рендер

![](_png/Pasted%20image%2020230610103351.png)

## Начало разработки. Создание проекта

Устанавливаем CLI от Vue и создаём с его помощью проект

```bash
npm i -g @vue/cli
vue create <project>
```

И таким образом будет выглядеть стоковый проект

![](_png/Pasted%20image%2020230610105902.png)

## Компонент App

В основном файле JS мы подключаем корневой компонент, в который и будут складываться все компоненты

`src > main.js`
```JS
import { createApp } from 'vue';
import App from './components/App.vue';

createApp(App).mount('#app');
```

И таким образом выглядит стоковый компонент vue:
- `template` - шаблон компонента
- `script` - скрипты компонента
- `style` - стили компонента

`src > components > App.vue`
```vue
// Single File Component

<template>
	<!-- HTML code -->
</template>

<script setup>
	// JS code
</script>

<style scoped>
	/* CSS code */
</style>
```

## Интерполяция

Внутрь двойных скобок `{{ переменная }}` мы можем помещать переменные из `this` скоупа

`src > components > App.vue`
```vue
<template>
	<div>
		<h2>Количество лайков {{ likes }}</h2>
		<button>+</button>
	</div>
</template>

<script>
export default {
	data() {
		return {
			likes: 0,
		};
	},
};
</script>

<style>
h1 {
	font-family: Montserratm, sans-serif;
}
</style>
```

![](_png/Pasted%20image%2020230610111842.png)

## Methods. V-ON. Слушатели событий

Из скрипта мы можем экспортировать методы, которые мы будем использовать внутри событий вёрстки. Чтобы подключить события вью, мы можем воспользоваться конструкцией `v-on:` или его аналогом `@`

`src > components > App.vue`
```vue
<template>
	<div>
		<h2>Лайки {{ likes }}</h2>
		<h2>Дизлайки {{ dislikes }}</h2>
		<div>
			<button v-on:click="addLike">+</button>
			<button @click="addDislike">-</button>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			likes: 0,
			dislikes: 0,
		};
	},
	methods: {
		addLike() {
			this.likes += 1;
		},
		addDislike() {
			this.dislikes += 1;
		},
	},
};
</script>

<style>
h1 {
	font-family: Montserratm, sans-serif;
}
</style>
```

![](_png/Pasted%20image%2020230610114705.png)

## Vue devtools. Инструменты разработчика

![](_png/Pasted%20image%2020230610114759.png)

## Cтили

Флаг `scoped` говорит нам о том, что стили будут сохраняться в одном компоненте и не будут уходить в глобалку

```vue
<template>
	<div class="post">
		<div><strong>Название</strong> JavaScript</div>
		<div><strong>Описание</strong> JS - универсальный язык</div>
	</div>
	<div class="post">
		<div><strong>Название</strong> JavaScript</div>
		<div><strong>Описание</strong> JS - универсальный язык</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			likes: 0,
			dislikes: 0,
		};
	},
	methods: {
		addLike() {
			this.likes += 1;
		},
		addDislike() {
			this.dislikes += 1;
		},
	},
};
</script>

<style scoped>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	font-family: Montserratm, sans-serif;
}

.post {
	padding: 15px;
	margin-top: 15px;

	border: 2px solid #8951fd;
}
</style>
```

![](_png/Pasted%20image%2020230626075131.png)

## Отрисовка в цикле. Директива V-FOR

Для создания итерируемой конструкции для перебора имеющихся данных во вью существует две директивы:
- `v-for` - в ней мы указываем, перебор какого массива будет
- `v-bind:key` - присваиваем ключ для каждого элемента перебора

```vue
<template>
	<div class="post" v-for="post in posts" v-bind:key="post.id">
		<div><strong>Название</strong> {{ post.title }}</div>
		<div><strong>Описание</strong> {{ post.body }}</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			posts: [
				{ id: 1, title: 'JavaScript', body: 'JS - is universal language' },
				{ id: 2, title: 'C#', body: 'C# - is beautiful language' },
				{ id: 3, title: 'Java', body: 'Java - is banking language' },
			],
		};
	},
	methods: {},
};
</script>

<style>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	font-family: Montserratm, sans-serif;
}

.post {
	padding: 15px;
	margin-top: 15px;

	border: 2px solid #8951fd;
}
</style>
```

![](_png/Pasted%20image%2020230626081058.png)

## Двустороннее связывание

Для реализации добавления поста на страницу, нужно сначала реализовать двусторонне связывание, которое позволит синхронизировать данные из инпутов с данными компонента

Конкретно для связывания данных во вью используется `v-bind`, который привязывает одни данные под другие

И так же нам нужен будет атрибут `@input`, который хранит в себе метод присвоения определённых данных из формы на странице к форме вью (он будет передавать наши введённые данные в данные компонента)

```vue
<template>
	<div class="app">
		<form action="">
			<h4>Создать пост</h4>
			<input
				v-bind:value="title"
				@input="inputTitle"
				type="text"
				class="input"
				placeholder="название"
			/>
			<input
				v-bind:value="body"
				@input="inputBody"
				type="text"
				class="input"
				placeholder="описание"
			/>
			<button @click="createPost">Добавить</button>
		</form>
		<div class="post" v-for="post in posts" v-bind:key="post.id">
			<div><strong>Название</strong> {{ post.title }}</div>
			<div><strong>Описание</strong> {{ post.body }}</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			posts: [
				{ id: 1, title: 'JavaScript', body: 'JS - is universal language' },
				{ id: 2, title: 'C#', body: 'C# - is beautiful language' },
				{ id: 3, title: 'Java', body: 'Java - is banking language' },
			],
			title: '',
			body: '',
		};
	},
	methods: {
		createPost() {},
		inputTitle(event) {
			this.title = event.target.value;
		},
		inputBody(event) {
			this.body = event.target.value;
		},
	},
};
</script>
```

![](_png/Pasted%20image%2020230626083925.png)

Так же можно сократить запись и вместо отдельного метода просто указать, что мы приравниваем нужное нам значение к зарезервированному ивенту `$event.target.value` 

```vue
<template>
	<div class="app">
		<form action="">
			<h4>Создать пост</h4>
			<input
				v-bind:value="title"
				@input="title = $event.target.value"
				type="text"
				class="input"
				placeholder="название"
			/>
			<input
				v-bind:value="body"
				@input="body = $event.target.value"
				type="text"
				class="input"
				placeholder="описание"
			/>
			<button @click="createPost">Добавить</button>
		</form>
		<div class="post" v-for="post in posts" v-bind:key="post.id">
			<div><strong>Название</strong> {{ post.title }}</div>
			<div><strong>Описание</strong> {{ post.body }}</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			posts: [
				{ id: 1, title: 'JavaScript', body: 'JS - is universal language' },
				{ id: 2, title: 'C#', body: 'C# - is beautiful language' },
				{ id: 3, title: 'Java', body: 'Java - is banking language' },
			],
			title: '',
			body: '',
		};
	},
	methods: {
		createPost() {},
	},
};
</script>
```

## Модификаторы stop, prevent

Далее реализуем метод `createPost`, через который будем добавлять новые посты. Но тут встаёт проблема, что страница перезагружается при отправке формы. 

Чтобы исправить вышеописанную проблему, можно передать в функцию `event` и прописать `stopPropagation` или `preventDefault`, но вью предоставляет модификатор `@submit`, который в себе имеет `prevent`, останавливающий выполнение ивентов при сабмите формы

```vue
<template>
	<div class="app">
		<form action="" @submit.prevent>
			<h4>Создать пост</h4>
			<input
				v-bind:value="title"
				@input="title = $event.target.value"
				type="text"
				class="input"
				placeholder="название"
			/>
			<input
				v-bind:value="body"
				@input="body = $event.target.value"
				type="text"
				class="input"
				placeholder="описание"
			/>
			<button @click="createPost">Добавить</button>
		</form>
		<div class="post" v-for="post in posts" v-bind:key="post.id">
			<div><strong>Название</strong> {{ post.title }}</div>
			<div><strong>Описание</strong> {{ post.body }}</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			posts: [
				{ id: 1, title: 'JavaScript', body: 'JS - is universal language' },
				{ id: 2, title: 'C#', body: 'C# - is beautiful language' },
				{ id: 3, title: 'Java', body: 'Java - is banking language' },
			],
			title: '',
			body: '',
		};
	},
	methods: {
		createPost(event) {
			const newPost = {
				id: Date.now(),
				title: this.title,
				body: this.body,
			};

			this.posts.push(newPost);

			this.title = '';
			this.body = '';
		},
	},
};
</script>
```

![](_png/Pasted%20image%2020230626085304.png)

## Декомпозиция. Создаем переиспользуемые компоненты. Props. Передаем данные в компонент

Первым делом вынесем список постов. Он должен будет извне принимать список постов. Чтобы указать принимаемые пропсы в компонент, нужно указать внутрь `props` нужное значение, прописать его типы и указать обязателен ли этот пропс 

`PostList.vue`
```vue
<template>
	<div class="post" v-for="post in posts" v-bind:key="post.id">
		<div><strong>Название</strong> {{ post.title }}</div>
		<div><strong>Описание</strong> {{ post.body }}</div>
	</div>
</template>

<script>
export default {
	props: {
		posts: {
			type: Array,
			required: true,
		},
	},
};
</script>

<style scoped>
.post {
	padding: 15px;
	margin-top: 15px;

	border: 2px solid #8951fd;
}
</style>
```

Компонент формы, который пока не может создавать новые посты

`PostForm.vue`
```vue
<template>
	<form action="" @submit.prevent>
		<h4>Создать пост</h4>
		<input
			v-bind:value="post.title"
			@input="post.title = $event.target.value"
			type="text"
			class="input"
			placeholder="название"
		/>
		<input
			v-bind:value="post.body"
			@input="post.body = $event.target.value"
			type="text"
			class="input"
			placeholder="описание"
		/>
		<button>Добавить</button>
	</form>
</template>

<script>
export default {
	data() {
		return {
			post: {
				title: '',
				body: '',
			},
		};
	},
};
</script>

<style scoped>
.input {
	display: flex;

	width: 50%;

	padding: 5px;
	margin: 15px 0;

	border: 1px solid #8951fd;
}
</style>
```

И теперь, чтобы подключить дочерние компоненты в целевой, нужно:
1) Импортировать нужные компоненты в скриптах
2) Проинициализировать их в блоке `components`
3) Добавить их в в сам компонент в темплейте

Чтобы передать пропсы внутрь компонента, нужно через `v-bind` прописать те пропсы, которые принимает компонент и указать объект с пропсами.
Так же, чтобы кратко записать биндинг достаточно написать вместо `v-bind` просто `:`

`App.vue`
```vue
<template>
	<div class="app">
		<post-form />
		<post-list :posts="posts" />
	</div>
</template>

<script>
import PostList from '@/components/PostList.vue';
import PostForm from '@/components/PostForm.vue';

export default {
	components: {
		PostForm,
		PostList,
	},
	data() {
		return {
			posts: [
				{ id: 1, title: 'JavaScript', body: 'JS - is universal language' },
				{ id: 2, title: 'C#', body: 'C# - is beautiful language' },
				{ id: 3, title: 'Java', body: 'Java - is banking language' },
			],
		};
	},
};
</script>

<style>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	font-family: Montserratm, sans-serif;
}

.app {
	padding: 15px;
}

button {
	padding: 5px;

	color: #8951fd;

	border: 1px solid #8951fd;
}
</style>
```

> [!warning] Пропсы изменять в дочернем компоненте нельзя. Нужно их изменять в родительском и передавать в готовом виде уже в дочерний!

## V-MODEL

Стандартное двусторонне связывание предусматривает под собой написание правильных событий и атрибутов и постоянное повторение данной записи. 

![](_png/Pasted%20image%2020230626094209.png)

Можно упростить связывание через указание простого атрибута `v-model`, который за нас реализует указание правильных событий, атрибутов, функций присвоения значений.

Так же далее создадим заново функцию создания поста. 

Сейчас перед нами встаёт задача передачи данных для создания нового поста в компонент со списком постов

`PostList.vue`
```vue
<template>
	<form action="" @submit.prevent>
		<h4>Создать пост</h4>
		<input 
			v-model="post.title" 
			type="text" 
			class="input" 
			placeholder="название" 
		/>
		<input 
			v-model="post.body" 
			type="text" 
			class="input" 
			placeholder="описание" 
		/>
		<button @click="createPost">Добавить</button>
	</form>
</template>

<script>
export default {
	data() {
		return {
			post: {
				title: '',
				body: '',
			},
		};
	},
	methods: {
		createPost() {
			this.post.id = Date.now();

			this.posts.push(newPost);

			this.title = '';
			this.body = '';
		},
	},
};
</script>

<style scoped>
.input {
	display: flex;

	width: 50%;

	padding: 5px;
	margin: 15px 0;

	border: 1px solid #8951fd;
}
</style>
```

## $emit. Обмен данными между дочерним и родительским компонентом











## Библиотека UI компонентов




## Глобальная регистрация компонента




## Подробно о V-MODEL




##  Удаление поста. Ключи KEY в цикле




##  Отрисовка по условию












##  Модальное окно








##  Модификаторы V-MODEL








##  Работа с сервером. Получаем посты. Axios








##  Жизненный цикл компонента








##  Индикатор загрузки данных








##  Выпадающий список. Сортировка постов








##  Наблюдаемые WATCH и вычисляемые COMPUTED свойства








##  Анимации transition group








##  Поиск постов. Фильтрация








##  Пагинация. Постраничный вывод








##  Динамический биндинг классов и стилей








##  Динамическая пагинация. Бесконечная лента. Intersection API








##  Refs. Доступ к DOM элементу








##  VUE-ROUTER. Постраничная навигация








##  Динамическая навигация








##  Создаем собственные директивы V-INTERSACTION и V-FOCUS








##  Mixins. Примеси








##  Vuex. Глобальное состояние приложения








##  Composition API