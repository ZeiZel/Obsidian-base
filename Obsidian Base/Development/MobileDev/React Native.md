#React #ReactNative

## Введение

Плюсы языка:

![](_png/Pasted%20image%2020230702144028.png)

Основные различия в синтаксисе:

![](_png/Pasted%20image%2020230702144303.png)

Во что переводится `View`

![](_png/Pasted%20image%2020230702144330.png)

Так выглядит пример нативной и браузерной вёрстки

![](_png/Pasted%20image%2020230702144353.png)

Реакт нэйтив переводится в чистый JS, а затем движок Bridge выполняет операции в нужной ОС по инструкции JS

![](_png/Pasted%20image%2020230702144610.png)

Для создания первых приложений очень удобно будет использовать Expo CLI для развёртывания приложения на React

![](_png/Pasted%20image%2020230702144921.png)

## Создаем проект с помощью expo-cli

Так же можно в наличии шаблоны на ts

```bash
npx create-expo-app .
```

## Изучаем структуру проекта

`app.json` - настройки expo
`app.js` - корневой компонент приложения (вместо `index.js`, как в обычном реакт)

Дальше всё как в обычном веб-приложении

![](_png/Pasted%20image%2020230702172502.png)

## Запуск проекта

Запускаем приложение классической командой

```bash
npm run start
```

## Про Metro Bundler

Metro Bundler позволяет интерпретировать любой системе (ios/android/pc), что написано на JS и выполнить заданные действия. JS будет выполнять определённое действие и MB будет объяснять всем ОС, что нужно будет сделать, чтобы отобразить данные нативные элементы

## Скачиваем Android Studio и настраиваем

Лучше молить бога, чтобы всё запустилось - смотрим [туториалы](https://www.youtube.com/watch?v=K-aD8ClG1FQ&t=38s)

## Запускаем на реальном устройстве приложение

Устанавливаем Expo Go на своё устройство

Сканируем QR или вставляем ссылку

![](_png/Pasted%20image%2020230702184116.png)

И получаем итоговое приложение на Андроид

## Скачиваем scrcpy для шаринга экрана устройства на ПК

[Тут](https://github.com/Genymobile/scrcpy) находится приложение для шаринга экрана на компьютер. У телефона должен быть включён режим отладки, чтобы получить к нему доступ по кабелю

![](_png/Pasted%20image%2020230702190102.png)

## Запускаем Expo в устройстве и открываем наше приложение

В терминале нужно нажать `m` и в телефоне нужно подключить горячую перезагрузку, чтобы изменения применялись автоматически после сохранения 

![](_png/Pasted%20image%2020230702190631.png)

## Начальная разработка приложения и стилизация

Изначально мы имеем два элемента, которые работают аналогично и в браузере:
- `View` - это замена для элемента `div`, который хранит в себе элементы
- `Text` - это замена для элемента `p`, который хранит в себе текст, но с одной оговоркой - мы обязательно должны использовать этот элемент для хранения текста

Если нам нужно будет передать классы или напрямую стили, нам нужно будет использовать атрибут `style`. 

Для генерации стилей мы можем использовать `StyleSheet.create()`, что является аналогом `createStyles` из `materialui`

`App.js`
```JSX
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
// import './styles.css'

export default function App() {
	return (
		<View style={styles.container}>
			<Text style={styles.textStyles}>Hello</Text>
			<Text
				style={{
					fontSize: 16,
				}}
			>
				world!
			</Text>
			<StatusBar style='auto' />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},
	textStyles: {
		color: 'purple',
		fontSize: 24,
	},
});
```

![](_png/Pasted%20image%2020230814140416.png)

## Устанавливаем styled-components для стилизации компонентов

Устанавливаем стилизованные компоненты

```bash
npm i styled-components
```

И далее можем реализовывать более простым образом компоненты, как на сайтах. Но с одним отличием - импортируем стилевые компоненты из `/native`

```JSX
import { View } from 'react-native';
import styled from 'styled-components/native';

const Post = styled.View`
	padding: 15px;

	width: 100px;
	height: 100px;

	background: red;
	border-radius: 15px;
`;

export default function App() {
	return (
		<View>
			<Post />
		</View>
	);
}
```

![](_png/Pasted%20image%2020230814141601.png)

## Начинаем верстать статью

Компонент `StatusBar` отодвигает все элементы от статусбара

![](_png/Pasted%20image%2020230815071521.png)

Создаём пост в отдельном файле

Так же тут нужно обратить внимание, что для отображения изображений, нужно использовать компонент `Image`

`components / Post / Post.jsx`
```JSX
import styled from 'styled-components/native';

const PostView = styled.View`
	display: flex;
	flex-direction: row;

	padding: 15px;

	/* border-bottom: 1px solid rgba(0, 0, 0, 0.1); - так написать нельзя в styled-components */
	border-bottom-width: 1px;
	border-bottom-color: rgba(0, 0, 0, 0.1);
	border-bottom-style: solid;
`;

const PostDetails = styled.View`
	justify-content: center;
`;

const PostImage = styled.Image`
	margin-right: 12px;
	width: 100px;
	height: 100px;
	border-radius: 12px;
`;

const PostTitle = styled.Text`
	font-size: 16px;
	font-weight: 700;
`;

const PostDate = styled.Text`
	font-size: 12px;
	color: rgba(0, 0, 0, 0.4);
`;

export const Post = ({ title, imageUri, createdAt }) => {
	return (
		<PostView>
			<PostImage
				source={{
					uri: imageUri,
				}}
			/>
			<PostDetails>
				<PostTitle>{title}</PostTitle>
				<PostDate>{createdAt}</PostDate>
			</PostDetails>
		</PostView>
	);
};
```

И далее используем данный компонент с обычной передачей пропсов

`App.js`
```JSX
import { StatusBar, View } from 'react-native';
import { Post } from './components/Post/Post';

export default function App() {
	return (
		<View>
			<Post
				title={'yes'}
				createdAt={'yes'}
				imageUri={
					'https://media.kg-portal.ru/anime/j/jojosbizarreadventurediamondisunbreakable/images/jojosbizarreadventurediamondisunbreakable_32.jpg'
				}
			/>
			<StatusBar theme={'auto'} />
		</View>
	);
}
```

![](_png/Pasted%20image%2020230815083925.png)

## Устанавливаем Axios и делаем запрос на получение статей






## Как правильно рендерить список с возможностью скролла (FlatList)






## Делаем рендер иконки загрузки контента (ActivityIndicator)






## Перезагрузка контента по свайпу (RefreshController)






## Делаем статью кликабельной (TouchableOpacity)






## Переносим код отображения статьей в HomeScreen






## Создаем экран отображения полной статьи FullPostScreen






## Подключаем роутинг с помощью React Navigation






## Делаем переход на экран полной записи при клике на статью






## Обрезаем заголовки статей для корректного отображения списка









