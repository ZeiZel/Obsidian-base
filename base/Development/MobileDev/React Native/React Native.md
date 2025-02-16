
## Введение

React Native - это фреймворк на котором можно разрабатывать мобильные приложения с помощью React. Он выполняет роль ReactDOM в среде мобильных приложений и позволяет общаться с устройством через своего внутреннего посредника.

![](_png/Pasted%20image%2020241006150342.png)

React Native предоставляет
- набор компонентов, которые преобразуются в нативные
- API для работы с нативными возможностями ОС
- движок, который принимает запросы из JS на выполнение нативной логики

![](_png/Pasted%20image%2020241006150406.png)

## Настройка окружения

Для работы React Native приложения нам понадобится [NodeJs](https://nodejs.org/en). 

Скачиваем [AndroidStudio](https://developer.android.com/studio).

После скачивания и установки всех пакетов, нам нужно будет выбрать эмулятор устройства. Стоить выбирать устройства с поддержкой PlayStore для поддержки его API.

![](_png/Pasted%20image%2020250113192743.png)

![](_png/Pasted%20image%2020241006154343.png)

Далее выбираем операционную систему UpsideDownCake.

![](_png/Pasted%20image%2020241006154444.png)

Далее мы сможем создать виртуальное устройство.

![](_png/Pasted%20image%2020241006154537.png)

Ну и в менеджере устройств остаётся выбрать только наше нужное устройство.

![](_png/Pasted%20image%2020241006154905.png)

На наше физическое мобильное устройство нужно будет установить [ExpoGo](https://expo.dev/go), чтобы у нас была возможность удобно разрабатывать наш проект и тестировать его на реальном устройстве.

## Старт

### Как работает React Native

Если в браузере React работает достаточно стандартно и привычно нам, то в React Native применяется другой подход рендеринга, который включает в себя огромное количество различных библиотек и интерфейсов

![](_png/Pasted%20image%2020241006155418.png)

Для взаимодействия React с браузером используется дополнительная библиотека — ReactDOM. Подобную роль для мобильных устройств выполняет React Native, позволяя React работать с нативными компонентами операционных систем (именно что компоненты RN берёт нативные от каждого устройства).

![](_png/Pasted%20image%2020241006155405.png)

### UI и логика

В RN в 
- качестве блока используется View, который в рантайме переходит в UIView (iOS) и в ViewGroup (Android)
- качестве текста используется Text, который так же переходит в UITextView и TextView соответственно

JSX существует только в рамках разработки. Вся остальная JS логика остаётся существовать в рантайме и переводится уже самим RN в нативные вызовы.

![](_png/Pasted%20image%2020241006163220.png)

Есть два вида архитектуры RN-приложений, которые сложились со временем.

Первая архитектура предполагает то, что наш скомпилированный JS-код будет взаимодействовать с Bridge, который будет сообщать нативному устройству, какие API дёргаются и какие нативные компоненты рендерядтся.

У нас имеется поток JS, внутри которого исполняется JS и отправляет запросы на Bridge. Поток работает на основе JavaScript Core - это движок, который запускает JS на мобильном устройстве.

Через Bridge у нас запросы отправляются в нативный поток. Нативный поток работает с целевой платформой. Он запускает в себе сразу все компоненты приложения (даже те, которые сейчас могут не использоваться во время загрузки).

Нативная платформа общается с теневым потоком, который стилизует нативные компоненты под те, что мы реализовали в JSX.

Основными недостатками данной архитектуры являются:
1. Bridge, который сереализует / десереализует сообщения и может тормозить отрисовку UI
2. Так же Bridge асинхронен, поэтому даже синхронные компоненты будут вызваться асинхронно
3. Все потоки никак не связаны друг с другом. Они не представляют, что происходит друг в друге.

![](_png/Pasted%20image%2020241006163237.png)

В новой архитектуре у нас так же остаются три потока, но вместо одного Bridge, у нас появляется JSInterface, который позволяет общаться с нативными интерфейсами без пересылки сообщений. Всё ядро общения построено на биндингах C++. Интерфейс может быть как синхронным, так и асинхронным. 

Fabric - это новый компонент, который синхронизирует дерево из JS и отображение в Layout.

Turbo Modules - это пакет с модулями, которые не загружаются при первой загрузке приложения (по типу камеры, bluetooth, nfc)

CodeGen - это генератор интерфейса на C++, который взаимодействует с модулями посредников и собирает описанный компонент.

![](_png/Pasted%20image%2020241006163555.png)

### EXPO CLI vs RN CLI

Expo - это удобный инструмент для работы с RN. Он предоставляет свои компоненты и роутинг. Он предоставляет платные услуги, но всё доступно и в бесплатном режиме.

RN - это нативный CLI, который может быть полезен для более гибкого написания нативных компонентов, но с ним тяжелее работать. Лучше дефолтно его не использовать.

Из Expo можно одной командой перейти в RN, а обратно уже нет.

![](_png/Pasted%20image%2020241013191523.png)

### Старт проекта + Обзор проекта

Устанавливаем наш свежий проект

```bash
npx create-expo-app@latest rn-simple-app
```

И далее перед нами открывается большая структура. В файле `app.json` находится начальный конфиг приложения, в котором указано, что, откуда и какие ресурсы нужно брать для сборки приложения, а так же его начальные настройки.

![](_png/Pasted%20image%2020241013194353.png)

1. чтобы запустить приложение, нам нужно будет скачать Expo App на наш мобильный телефон
2. стартануть сервер
3. отсканировать QR либо скопировать сокет подключения
4. Нажать на
	1. `a`, чтобы поднять android
	2. `i` - IOS
	3. `w` - Web

```bash
bun start
```

![](_png/Pasted%20image%2020250208184610.png)

После этих действий на наше устройство закинется бандл с хот релодом

## Компоненты и стили

### Использование компонентов

Заместо использования базовых компонентов из веба, мы должны использовать те, что представляет `react-native` (либо другая библиотека нативных компонентов) по типу: `View`, `Text` или других. 

- `View` - это аналог `div`, в который мы всегда должны оборачивать контент.
- `Text` - это компонент, в который мы должны складывать текст. Помещать в другое место вне него уже нельзя, так как это выдаст ошибку.

```TSX
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'green',
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default function SamplePage() {
	return (
		<View style={styles.container}>
			<Text>Привет!</Text>
			<Button title='Я дефолтный заголовок' />
			<TextInput value='Я значение, которое можно тыкать' />
		</View>
	);
}
```

И примерно так будет выглядеть наш стек компонентов

![](_png/Pasted%20image%2020250209172249.png)

### Стилизация

Стили выглядят похожим образом на то, что есть в вебе, но и сильно отличаются. В RN за стили отвечают объекты стилей, которые определённым образом имплементируют подход из ванильного CSS, но не дублируют его польностью. То есть у нас отсутствует grid либо некоторые свойства разбито на множество других подсвойств.

![](_png/Pasted%20image%2020250209100407.png)

Стили мы можем писать любыми способами, как и в нативном JS, но стоит для их описания использовать `StyleSheet.create`, который предоставит нам удобные типы и автокомплит по стилям

```TS
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';

const outInline = {
	color: 'blue',
};

const stylesPalette = {
	text: {
		color: 'blue',
	},
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'green',
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		color: 'blue',
		borderColor: 'blue',
		borderWidth: 1,
	},
});

export default function SamplePage() {
	return (
		<View style={styles.container}>
			<Text>Привет!</Text>
			<Text style={{ color: 'blue' }}>Инлайн</Text>
			<Text style={outInline}>Вынесенный инлайн</Text>
			<Text style={stylesPalette.text}>Объект со стилями</Text>
			<Text style={styles.text}>Stylesheet</Text>
			<Button title='Я дефолтный заголовок' />
			<TextInput value='Я значение, которое можно тыкать' />
		</View>
	);
}
```

![](_png/Pasted%20image%2020250209181245.png)

#### Flex

Изначально все элементы внутри `View` располагаются через `flex` и `column`. 
В `display` у нас есть только `flex` и `none` отображение.

Контейнером, в нашем случае, будет являться любой элемент, на который накинут `display: flex`, а айтемом - все вложенные. 

![](_png/Pasted%20image%2020250209185336.png)

#### align/justify

Дефолтно, `flexDirection` у нас равен `column`, поэтому основная ось, относительно которой работают align и justify - это вертикальная. Вспомогательной же будет горизонтальная. Если мы поменяем направление на `row`, то горизонтальная станет основной, а вертикальная вспомогательной.

- `alignItems` - отвечает за выравнивание элементов по вспомогательной оси
- `justifyContent` - отвечает за выравнивание элементов по основной оси

>[!info] Все базовые свойства работают точно так же, как и в вебе.

![](_png/Pasted%20image%2020250209185305.png)

То есть дефолтно мы опишем такой конфиг, когда элементы выравниваются по основной оси по центру и на вспомогательной с равными отступами

```TSX
<View
	style={{
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 500,
		backgroundColor: 'yellow',
	}}
>
	<View style={{ width: 100, height: 100, backgroundColor: 'tomato' }} />
	<View style={{ width: 100, height: 100, backgroundColor: 'blue' }} />
	<View style={{ width: 100, height: 100, backgroundColor: 'violet' }} />
</View>
```

![](_png/Pasted%20image%2020250209203047.png)

Но если поменяем основную ось, то у нас так же останется, что `jc` раскидал элементы по основной оси, а `ai` распределил по вспомогательной (тут - по-центру)

```TSX
flexDirection: 'row',
```

![](_png/Pasted%20image%2020250209203108.png)

#### self

Так же ничто нам не мешает воспользоваться `alignSelf` для центровки отдельного элемента

```TSX
<View
	style={{
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 500,
		backgroundColor: 'yellow',
	}}
>
	<View style={{ width: 100, height: 100, backgroundColor: 'tomato' }} />
	<View
		style={{
			alignSelf: 'flex-start',
			width: 100,
			height: 100,
			backgroundColor: 'blue',
		}}
	/>
	<View style={{ width: 100, height: 100, backgroundColor: 'violet' }} />
</View>
```

![](_png/Pasted%20image%2020250209203706.png)

#### wrap

`flexWrap` со значением `wrap` так же переносит элементы, если они не влезают в контейнер

![](_png/Pasted%20image%2020250210182254.png)

```TSX
<View
	style={{
		flexDirection: 'row',
		height: 500,
		backgroundColor: 'yellow',
		flexWrap: 'wrap',
	}}
>
	<View style={{ width: 300, height: 100, backgroundColor: 'tomato' }} />
	<View
		style={{
			width: 100,
			height: 100,
			backgroundColor: 'blue',
		}}
	/>
	<View style={{ width: 100, height: 100, backgroundColor: 'violet' }} />
</View>
```

Однако если мы добавим `alignContent`, то мы так же поменяем поведение контента и перенесём его по дополнительной оси по-центру

```TSX
alignContent: 'center',
alignItems: 'center',
```

![](_png/Pasted%20image%2020250210182601.png)

#### basis/grow/shrink

`flexBasis` говорит нам, что данный элемент в идеале должен быть не меньше определённой ширины

```TSX
<View
	style={{
		flexDirection: 'row',
		height: 500,
		backgroundColor: 'yellow',
	}}
>
	<View style={{ flexBasis: 100, height: 100, backgroundColor: 'tomato' }}>
		<Text>1</Text>
	</View>
	<View style={{ flexBasis: 100, height: 100, backgroundColor: 'blue' }}>
		<Text>2</Text>
	</View>
	<View style={{ flexBasis: 100, height: 100, backgroundColor: 'violet' }}>
		<Text>3</Text>
	</View>
</View>
```

![](_png/Pasted%20image%2020250210185049.png)

`flexGrow` говорит о том, какой процент пространства этот элемент должен занимать. Если один элемент имеет значение 1, то он будет стараться занимать всё оставшееся пространство. Если два, то они поделят оставшееся поровну.

```TSX
<View
		style={{
			flexDirection: 'row',
			height: 500,
			backgroundColor: 'yellow',
		}}
>
		<View style={{ flexBasis: 100, flexGrow: 1, height: 100, backgroundColor: 'tomato' }}>
			<Text>1</Text>
		</View>
		<View style={{ flexBasis: 100, flexGrow: 1, height: 100, backgroundColor: 'blue' }}>
			<Text>2</Text>
		</View>
		<View style={{ flexBasis: 100, height: 100, backgroundColor: 'violet' }}>
			<Text>3</Text>
		</View>
	</View>
</View>
```

![](_png/Pasted%20image%2020250210185127.png)

`flexShrink` отвечает за преполненное пространство. Если `grow` отвечает за распределение заполненного пространства относительно базиса, то `shrink` начинает работать только тогда, когда у нас контент начинает заполняться. 

>[!info] Все эти параметры используются для мощной гибкости вместе
> `basis` определит наш идеальный размер, `grow` незаполненное пространство, а `shrink` уже отработает заполненные места

#### gap

`gap` / `rowGap` / `columnGap` - определяют отступы между элементами

```TSX
<View
	style={{
		flexDirection: 'row',
		height: 500,
		backgroundColor: 'yellow',
		columnGap: 20,
		rowGap: 30,
		flexWrap: 'wrap',
	}}
>
	<View style={{ flexBasis: 100, flexGrow: 1, height: 100, backgroundColor: 'tomato' }}>
		<Text>1</Text>
	</View>
	<View style={{ flexBasis: 100, flexGrow: 1, height: 100, backgroundColor: 'blue' }}>
		<Text>2</Text>
	</View>
	<View style={{ flexBasis: 100, height: 100, backgroundColor: 'violet' }}>
		<Text>3</Text>
	</View>
	<View style={{ flexBasis: 100, height: 100, backgroundColor: 'cyan' }}>
		<Text>3</Text>
	</View>
	<View style={{ flexBasis: 100, height: 100, backgroundColor: 'brown' }}>
		<Text>3</Text>
	</View>
</View>
```

![](_png/Pasted%20image%2020250210185852.png)

#### dimensions

Но представим такую ситуацию, когда нам нужно правильно посчитать отступ. То есть элементы должны занимать половину ширины экрана и учитывать отступ между ними. 

Чтобы посчитать такую ширину, флексов не хватит. Нам нужно будет воспользоваться объектом ширины экрана, который мы можем получить из RN.

```TSX
import { View, Text, StyleSheet, Dimensions } from 'react-native';

export default function SamplePage() {
	const width = Dimensions.get('window').width;

	return (
		<View style={styles.container}>
			<View
				style={{
					paddingTop: 200,
					flexDirection: 'row',
					height: 500,
					backgroundColor: 'yellow',
					gap: 10,
					flexWrap: 'wrap',
				}}
			>
				<View style={{ width: width / 2 - 5, height: 100, backgroundColor: 'tomato' }}>
					<Text>1</Text>
				</View>
				<View style={{ width: width / 2 - 5, height: 100, backgroundColor: 'blue' }}>
					<Text>2</Text>
				</View>
				<View style={{ width: width / 2 - 5, height: 100, backgroundColor: 'violet' }}>
					<Text>3</Text>
				</View>
			</View>
		</View>
	);
}
```

![](_png/Pasted%20image%2020250210190903.png)

Объект `Dimensions` позволяет нам получить размеры нашего экрана или окна из RN. Мы можем из него получить обычный скейл, скейл шрифта, высоту и ширину

### Вёрстка логина

Сделали базовую вёрстку

```TSX
import { View, Text, Button, TextInput, StyleSheet, Dimensions } from 'react-native';

const styles = StyleSheet.create({
	container: {
		/** заполняет всё пространство по направлению флекса */
		flex: 1,
		justifyContent: 'center',
		backgroundColor: '#5456',
		padding: 55,
	},
	content: {
		alignItems: 'center',
		gap: 50,
	},
	form: {
		alignSelf: 'stretch',
		gap: 16,
	},
	input: {
		backgroundColor: '#2E2D3D',
	},
});

export default function SamplePage() {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text>VioletSchool</Text>
				<View style={styles.form}>
					<TextInput style={styles.input} />
					<TextInput style={styles.input} />
					<Button title='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View>
	);
}
```

![](_png/Pasted%20image%2020250210193444.png)

То, к чему нужно будет прийти

![](_png/Pasted%20image%2020250210193504.png)

## События и создание компонента

### Image

Чтобы добавить изображение в приложение, нам нужно воспользоваться нативным компонентом `Image`, в который мы можем сразу передать `require` с путём до любого изображения

`app / (tabs) / sample.tsx`
```TSX
import { StatusBar } from 'expo-status-bar';
import { Button, Dimensions, StyleSheet, Text, View, Image } from 'react-native';

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
		backgroundColor: '#16171D'
	},
	content: {
		alignItems: 'center',
		gap: 50
	},
	form: {
		alignSelf: 'stretch',
		gap: 16
	},
	input: {
		backgroundColor: '#2E2D3D'
	},
	logo: {
		width: 220
	}
});

export default function SamplePage() {
	const width = Dimensions.get('window').width;
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<TextInput style={styles.input} />
					<TextInput style={styles.input} />
					<Button title='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View >
	);
}
```





### Input



`shared / ui / Input / Input.tsx`
```TSX
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

const styles = StyleSheet.create({
	input: {
		height: 58,
		backgroundColor: '#2E2D3D',
		paddingHorizontal: 24,
		borderRadius: 10,
		fontSize: 16,
	}
});

export function Input(props: TextInputProps) {
	return (
		<TextInput
			style={styles.input}
			placeholderTextColor={'#AFB2BF'}
			{...props} />
	)
}
```



`app / (tabs) / sample.tsx`
```TSX
import { StatusBar } from 'expo-status-bar';
import { Button, Dimensions, StyleSheet, Text, View, Image } from 'react-native';
import { Input } from '@/shared/ui';

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
		backgroundColor: '#16171D'
	},
	content: {
		alignItems: 'center',
		gap: 50
	},
	form: {
		alignSelf: 'stretch',
		gap: 16
	},
	input: {
		backgroundColor: '#2E2D3D'
	},
	logo: {
		width: 220
	}
});

export default function SamplePage() {
	const width = Dimensions.get('window').width;
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input placeholder='Пароль' />
					<Button title='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View >
	);
}
```



### Дизайн система



`shared / const / tokens.const.ts`
```TS
export const Colors = {
	black: '#16171D',
	gray: '#AFB2BF',
	violetDark: '#2E2D3D',
	primary: '#6C38CC',
	primaryHover: '#452481',
	link: '#A97BFF'
}

export const Gaps = {
	g16: 16,
	g50: 50
}

export const Radius = {
	r10: 10
}
```



`shared / ui / Input`
```TSX
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { Colors, Radius } from '../../const';

const styles = StyleSheet.create({
	input: {
		height: 58,
		backgroundColor: Colors.violetDark,
		paddingHorizontal: 24,
		borderRadius: Radius.r10,
		fontSize: 16,
	}
});

export function Input(props: TextInputProps) {
	return (
		<TextInput
			style={styles.input}
			placeholderTextColor={Colors.gray}
			{...props} />
	)
}
```



`app / (tabs) / sample.tsx`
```TSX
import { StatusBar } from 'expo-status-bar';
import { Button, Dimensions, StyleSheet, Text, View, Image } from 'react-native';
import { Input } from '@/shared/ui';
import { Colors, Gaps } from '@/shared/const';

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
		backgroundColor: Colors.black
	},
	content: {
		alignItems: 'center',
		gap: Gaps.g50
	},
	form: {
		alignSelf: 'stretch',
		gap: Gaps.g16
	},
	logo: {
		width: 220
	}
});

export default function SamplePage() {
	const width = Dimensions.get('window').width;
	
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input placeholder='Пароль' />
					<Button title='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View >
	);
}
```



### SVG



```bash
npm i react-native-svg
```



`shared / assets / icons / eye-closed.tsx`
```TSX
import * as React from "react"
import Svg, { Path } from "react-native-svg"

const EyeClosedIcon = () => (
	<Svg
		width={24}
		height={24}
		fill="none"
	>
		<Path
			fill="#AFB2BF"
			d="M2.69 6.705a.75.75 0 0 0-1.38..."
		/>
	</Svg>
)

export default EyeClosedIcon
```



`app / (tabs) / sample.tsx`
```TSX
export default function SamplePage() {
	const width = Dimensions.get('window').width;
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input placeholder='Пароль' />
					<Button title='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
				<EyeClosedIcon />
				<EyeOpenedIcon />
			</View>
		</View >
	);
}
```




### Обработка событий



`shared / ui / Input.tsx`
```TSX
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Colors, Radius } from '../../const';
import { useState } from 'react';
import { EyeOpenedIcon, EyeClosedIcon } from '../../assets/icons';

const styles = StyleSheet.create({
	input: {
		height: 58,
		backgroundColor: Colors.violetDark,
		paddingHorizontal: 24,
		borderRadius: Radius.r10,
		fontSize: 16,
		color: Colors.gray
	},
	eyeIcon: {
		position: 'absolute',
		right: 0,
		paddingHorizontal: 20,
		paddingVertical: 18
	}
});

export const Input = (
	{ isPassword, ...props }: TextInputProps & { isPassword?: boolean }
) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

	return (
		<View>
			<TextInput
				style={styles.input}
				secureTextEntry={
					isPassword && !isPasswordVisible
				}
				placeholderTextColor={Colors.gray}
				{...props} 
			/>
			{isPassword && 
				<Pressable 
					onPress={
						() => 
							setIsPasswordVisible(state => !state)
					} 
					style={styles.eyeIcon}
				>
					{isPasswordVisible 
						? <EyeOpenedIcon /> 
						: <EyeClosedIcon />
					}
				</Pressable>
			}
		</View>
	)
}
```



`app / (tabs) / sample.tsx`
```TSX
export default function SamplePage() {
	const width = Dimensions.get('window').width;
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input isPassword placeholder='Пароль' />
					<Button title='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View >
	);
}
```






### Кнопка

Немного обновляем наши токены и добавляем туда различные размеры шрифтов

`shared / const / tokens.const.ts`
```TSX
export const Colors = {
	black: '#16171D',
	gray: '#AFB2BF',
	violetDark: '#2E2D3D',
	primary: '#6C38CC',
	primaryHover: '#452481',
	link: '#A97BFF',
	white: '#FAFAFA'
}

export const Gaps = {
	g16: 16,
	g50: 50
}

export const Radius = {
	r10: 10
}

export const Fonts = { // <--
	f16: 16,
	f18: 18
}
```

Теперь нужно описать кнопку. Реализовываем для гибкости не нативную кнопку так же через компонент `Pressable`, как когда мы делали кнопку для инпута

`shared / ui / Button / Button.tsx`
```TSX
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../../const';

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 58,
		backgroundColor: Colors.primary,
		borderRadius: Radius.r10,
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f18
	}
})

export function Button({ text, ...props }: PressableProps & { text: string }) {
	return (
		<Pressable {...props}>
			<View style={styles.button}>
				<Text style={styles.text}>{text}</Text>
			</View>
		</Pressable>
	)
}
```

И добавляем нашу новую кнопку на страницу

`app / (tabs) / sample.tsx`
```TSX
export default function SamplePage() {
	const width = Dimensions.get('window').width;
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input isPassword placeholder='Пароль' />
					<Button text='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View >
	);
}
```



## Анимация

### Основы анимации



`shared / ui / Button / Button.tsx`
```TSX
import { Animated, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';

export function Button({ text, ...props }: PressableProps & { text: string }) {
	const animatedValue = new Animated.ValueXY({
		x: 0,
		y: 0
	});
	Animated.spring(animatedValue, {
		toValue: {
			x: 100,
			y: 100
		},
		useNativeDriver: true
	}).start();
	return (
		<Pressable {...props}>
			<Animated.View style={{
				...styles.button, transform: [
					{ translateX: animatedValue.x },
					{ translateY: animatedValue.y }
				]
			}}>
				<Text style={styles.text}>{text}</Text>
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 58,
		backgroundColor: Colors.primary,
		borderRadius: Radius.r10,
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f18
	}
})
```



### Как работает анимация



`shared / ui / Button / Button.tsx`
```TSX
import { Animated, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';
import { useEffect } from 'react';

export function Button({ text, ...props }: PressableProps & { text: string }) {
	const animatedValue = new Animated.ValueXY({
		x: 0,
		y: 0
	});

	Animated.timing(animatedValue, {
		toValue: {
			x: 100,
			y: 100
		},
		duration: 2000,
		useNativeDriver: true
	}).start();

	return (
		<Pressable {...props}>
			<Animated.View style={{
				...styles.button, transform: [
					{ translateX: animatedValue.x },
					{ translateY: animatedValue.y }
				]
			}}>
				<Text style={styles.text}>{text}</Text>
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 58,
		backgroundColor: Colors.primary,
		borderRadius: Radius.r10,
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f18
	}
})
```



### Ограничения анимации



`shared / ui / Button / Button.tsx`
```TSX
import { Animated, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';

export function Button({ text, ...props }: PressableProps & { text: string }) {
	const animatedValue = new Animated.ValueXY({
		x: 0,
		y: 0
	});

	Animated.timing(animatedValue, {
		toValue: {
			x: 100,
			y: 100
		},
		duration: 2000,
		useNativeDriver: false
	}).start();

	return (
		<Pressable {...props}>
			<Animated.View style={{
				...styles.button, width: animatedValue.x, height: animatedValue.y
			}}>
				<Text style={styles.text}>{text}</Text>
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 58,
		backgroundColor: Colors.primary,
		borderRadius: Radius.r10,
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f18
	}
})
```


### Интерполяция




```TSX
import { Animated, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';

export function Button({ text, ...props }: PressableProps & { text: string }) {
	const animatedValue = new Animated.Value(100);
	const color = animatedValue.interpolate({
		inputRange: [0, 100],
		outputRange: [Colors.primaryHover, Colors.primary]
	});

	Animated.timing(animatedValue, {
		toValue: 0,
		duration: 3000,
		useNativeDriver: true
	}).start();

	return (
		<Pressable {...props}>
			<Animated.View style={{
				...styles.button, backgroundColor: color
			}}>
				<Text style={styles.text}>{text}</Text>
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 58,
		borderRadius: Radius.r10,
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f18
	}
})
```


### Анимация кнопки




```TSX
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';

export function Button({ text, ...props }: PressableProps & { text: string }) {
	const animatedValue = new Animated.Value(100);
	const color = animatedValue.interpolate({
		inputRange: [0, 100],
		outputRange: [Colors.primaryHover, Colors.primary]
	});

	const fadeIn = (e: GestureResponderEvent) => {
		Animated.timing(animatedValue, {
			toValue: 0,
			duration: 100,
			useNativeDriver: true
		}).start();
		props.onPressIn && props.onPressIn(e);
	}

	const fadeOut = (e: GestureResponderEvent) => {
		Animated.timing(animatedValue, {
			toValue: 100,
			duration: 100,
			useNativeDriver: true
		}).start();
		props.onPressOut && props.onPressOut(e);
	}

	return (
		<Pressable {...props} onPressIn={fadeIn} onPressOut={fadeOut}>
			<Animated.View style={{
				...styles.button, backgroundColor: color
			}}>
				<Text style={styles.text}>{text}</Text>
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 58,
		borderRadius: Radius.r10,
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f18
	}
})
```


### Alert и Toast

Отключаем нативные драйверы в анимациях кнопки

`shared / ui / Button / Button.tsx`
```TSX
const fadeIn = (e: GestureResponderEvent) => {
	Animated.timing(animatedValue, {
		toValue: 0,
		duration: 100,
		useNativeDriver: false
	}).start();
	props.onPressIn && props.onPressIn(e);
}

const fadeOut = (e: GestureResponderEvent) => {
	Animated.timing(animatedValue, {
		toValue: 100,
		duration: 100,
		useNativeDriver: false
	}).start();
	props.onPressOut && props.onPressOut(e);
}
```



`app / (tabs) / sample.tsx`
```TSX
import { Dimensions, StyleSheet, Text, View, Image, Alert, ToastAndroid, Platform } from 'react-native';
import { Input } from './shared/Input/Input';
import { Colors, Gaps } from './shared/tokens';
import { Button } from './shared/Button/Button';

export default function SamplePage() {
	const width = Dimensions.get('window').width;

	const alert = () => {
		// Alert
		// Alert.alert('Ошибка', 'Неверный логин или пароль', [{
		// 	text: 'Хорошо',
		// 	onPress: () => {},
		// 	style: 'cancel'
		// }]);
		if (Platform.OS === 'android') {
			ToastAndroid.showWithGravity(
				'Неверный логин или пароль',
				ToastAndroid.LONG,
				ToastAndroid.CENTER,
			);
		}
	}

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input isPassword placeholder='Пароль' />
					<Button text='Войти' onPress={alert} />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View >
	);
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
		backgroundColor: Colors.black
	},
	content: {
		alignItems: 'center',
		gap: Gaps.g50
	},
	form: {
		alignSelf: 'stretch',
		gap: Gaps.g16
	},
	logo: {
		width: 220
	}
});
```


### Уведомление



`shared / const / tokens.const.ts`
```TS
export const Colors = {
	black: '#16171D',
	gray: '#AFB2BF',
	violetDark: '#2E2D3D',
	primary: '#6C38CC',
	primaryHover: '#452481',
	link: '#A97BFF',
	white: '#FAFAFA',
	red: '#CC384E'
}

export const Gaps = {
	g16: 16,
	g50: 50
}

export const Radius = {
	r10: 10
}

export const Fonts = {
	f16: 16,
	f18: 18
}
```



`shared / ui / ErrorNotification / ErrorNotification.props.ts`
```TSX
export interface ErrorNotificationProps {
	error?: string;
}
```



`shared / ui / ErrorNotification / ErrorNotification.tsx`
```TSX
import { useEffect, useState } from 'react';
import { ErrorNotificationProps } from './ErrorNotification.props';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Fonts } from '../tokens';

export function ErrorNotification({ error }: ErrorNotificationProps) {
	const [isShown, setIsShown] = useState<boolean>(false);

	useEffect(() => {
		if (!error) {
			return;
		}
		setIsShown(true);
		const timerId = setTimeout(() => {
			setIsShown(false);
		}, 3000);
		return () => {
			clearTimeout(timerId);
		}
	}, [error]);

	if (!isShown) {
		return <></>;
	}

	return (
		<View style={styles.error}>
			<Text style={styles.errorText}>{error}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	error: {
		position: 'absolute',
		width: Dimensions.get('screen').width,
		backgroundColor: Colors.red,
		padding: 15,
		top: 50
	},
	errorText: {
		fontSize: Fonts.f16,
		color: Colors.white,
		textAlign: 'center'
	}
})
```



`app / (tabs) / sample.tsx`
```TSX
import { StyleSheet, Text, View, Image } from 'react-native';
import { Input } from './shared/Input/Input';
import { Colors, Gaps } from './shared/tokens';
import { Button } from './shared/Button/Button';
import { ErrorNotification } from './shared/ErrorNotification/ErrorNotification';
import { useState } from 'react';

export default function SamplePage() {
	const [error, setError] = useState<string | undefined>();

	const alert = () => {
		setError('Неверный логин и пароль')
	}

	return (
		<View style={styles.container}>
			<ErrorNotification error={error} />
			<View style={styles.content}>
				<Image
					style={styles.logo}
					source={require('./assets/logo.png')}
					resizeMode='contain'
				/>
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input isPassword placeholder='Пароль' />
					<Button text='Войти' onPress={alert} />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View >
	);
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
		backgroundColor: Colors.black
	},
	content: {
		alignItems: 'center',
		gap: Gaps.g50
	},
	form: {
		alignSelf: 'stretch',
		gap: Gaps.g16
	},
	logo: {
		width: 220
	}
});
```


### Анимация окна уведомлений

Добавляем очистку ошибки через таймаут

`app / (tabs) / sample.tsx`
```TSX
const alert = () => {
	setError('Неверный логин и пароль');
	setTimeout(() => {
		setError(undefined);
	}, 4000)
}
```



`shared / ui / ErrorNotification / ErrorNotification.tsx`
```TSX
import { useEffect, useState } from 'react';
import { ErrorNotificationProps } from './ErrorNotification.props';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Colors, Fonts } from '../tokens';

export function ErrorNotification({ error }: ErrorNotificationProps) {
	const [isShown, setIsShown] = useState<boolean>(false);
	const animatedValue = new Animated.Value(-100);

	const onEnter = () => {
		Animated.timing(animatedValue, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true
		}).start();
	}

	useEffect(() => {
		if (!error) {
			return;
		}
		setIsShown(true);
		const timerId = setTimeout(() => {
			setIsShown(false);
		}, 3000);
		return () => {
			clearTimeout(timerId);
		}
	}, [error]);

	if (!isShown) {
		return <></>;
	}

	return (
		<Animated.View style={{
			...styles.error, transform: [
				{ translateY: animatedValue }
			]
		}} onLayout={onEnter}>
			<Text style={styles.errorText}>{error}</Text>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	error: {
		position: 'absolute',
		width: Dimensions.get('screen').width,
		backgroundColor: Colors.red,
		padding: 15,
		top: 50
	},
	errorText: {
		fontSize: Fonts.f16,
		color: Colors.white,
		textAlign: 'center'
	}
})
```


## Отладка и lint

### Eslint



`.eslintrc.json`
```JSON
{
	"plugins": [
		"prettier",
		"react",
		"react-native"
	],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"rules": {
		"react-native/no-unused-styles": 2,
		"react-native/split-platform-components": 2,
		"react-native/no-inline-styles": 2,
		"react-native/no-color-literals": 2,
		"react-native/no-raw-text": 2,
		"react-native/no-single-element-style-arrays": 2,
		"react-hooks/exhaustive-deps": "off",
		"prettier/prettier": [
			"error",
			{
				"singleQuote": true,
				"useTabs": true,
				"semi": true,
				"trailingComma": "all",
				"bracketSpacing": true,
				"printWidth": 100,
				"endOfLine": "auto"
			}
		],
		"@typescript-eslint/no-empty-function": [
			"off"
		],
		"@typescript-eslint/interface-name-prefix": "off",
		"@typescript-eslint/ban-types": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off"
	}
}
```

### Обработка ошибок









### Отладчик Chrome









### React Dev Tools









### Отладка и lint













## Expo router

### Выбор роутинга

> В приложение нужно завести app-роутер, который аналогичен тому, что сейчас есть в nextjs

Описание метода роутинга находится в корневом конфиге приложения в `plugins`. Тут нам нужно указать модуль, который отвечает за роутинг

`app.json`
```JSON
{
  "expo": {
    "name": "expo-example",
    "slug": "expo-example",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Далее, если у нас стоял дефолтный роутинг, то нам нужно поменять входную точку в `main` на то, что описано в документации роутера и добавить сам пакет роутера

`package.json`
```JSON
_ "main": "node_modules/expo/AppEntry.js",
+ "main": "expo-router/entry",

"expo-router": "^2.0.0",
```

Далее нужно описать babel (либо не нужно, если роутер изначально был выбран при инициализации проекта)

`babel.config.js`
```JSX
module.exports = function (api) {
	api.cache(true);
	return {
		presets: ['babel-preset-expo'],
		plugins: ['expo-router/babel'],
	};
};
```

И в итоге мы получаем роутер, который основан на папке `app`, где каждый `index` или `name.tsx` будет являться страницей

`app / (tabs) / sample.tsx`
```TSX
import { StyleSheet, Text, View, Image } from 'react-native';
import { Input } from '../shared/Input/Input';
import { Colors, Gaps } from '../shared/tokens';
import { Button } from '../shared/Button/Button';
import { ErrorNotification } from '../shared/ErrorNotification/ErrorNotification';
import { useState } from 'react';

export default function SamplePage() {
	const [error, setError] = useState<string | undefined>();

	const alert = () => {
		setError('Неверный логин и пароль');
		setTimeout(() => {
			setError(undefined);
		}, 4000);
	};

	return (
		<View style={styles.container}>
			<ErrorNotification error={error} />
			<View style={styles.content}>
				<Image style={styles.logo} source={require('../assets/logo.png')} resizeMode="contain" />
				<View style={styles.form}>
					<Input placeholder="Email" />
					<Input isPassword placeholder="Пароль" />
					<Button text="Войти" onPress={alert} />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
		backgroundColor: Colors.black,
	},
	content: {
		alignItems: 'center',
		gap: Gaps.g50,
	},
	form: {
		alignSelf: 'stretch',
		gap: Gaps.g16,
	},
	logo: {
		width: 220,
	},
});
```



### Добавление роута








### Страницы и навигации



`app / login.tsx`
```TSX
export default function Login() {
	const [error, setError] = useState<string | undefined>();

	const alert = () => {
		setError('Неверный логин и пароль');
		setTimeout(() => {
			setError(undefined);
		}, 4000);
	};

	return (
		<View style={styles.container}>
			<ErrorNotification error={error} />
			<View style={styles.content}>
				<Image style={styles.logo} source={require('../assets/logo.png')} resizeMode="contain" />
				<View style={styles.form}>
					<Input placeholder="Email" />
					<Input isPassword placeholder="Пароль" />
					<Button text="Войти" onPress={alert} />
				</View>
				<Link href={'/restore'}>
					<Text>Восстановить пароль</Text>
				</Link>
			</View>
		</View>
	);
}
```



`app / restore.tsx`
```TSX
import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function Restore() {
	return (
		<View>
			<Link href={'/'}>
				<Text>Restore</Text>
			</Link>
		</View>
	);
}
```




### Layout



`app / _layout.tsx`
```TSX
import { Stack } from 'expo-router';

export default function RootRayout() {
	return <Stack />;
}
```



### Stack



`app / _layout.tsx`
```TSX
import { Stack } from 'expo-router';
import { Colors } from '../shared/tokens';

export default function RootRayout() {
	return (
		<Stack
			screenOptions={{
				statusBarColor: Colors.black,
				contentStyle: {
					backgroundColor: Colors.black,
				},
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="restore"
				options={{
					presentation: 'modal',
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
```



### SafeArea и StatusBar

Меняем дефолтный бэкграунд приложения в его настройках

`app.json`
```JSON
"backgroundColor": "#16171D",
```

Далее добавим `StatusBar` из `expo-status-bar`, который предложит нам кастомизированный статусбар с возможностью его контролировать.

Добавляем `SafeAreaProvider` и `useSafeAreaInsets` из `react-native-safe-area-context`. Они помогут провайдить безопасные границы для тапов внутри приложения. 

`app / _layout.tsx`
```TSX
import { Stack } from 'expo-router';
import { Colors } from '../shared/tokens';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootRayout() {
	const insets = useSafeAreaInsets();
	return (
		<SafeAreaProvider>
			<StatusBar style="light" />
			<Stack
				screenOptions={{
					statusBarColor: Colors.black,
					contentStyle: {
						backgroundColor: Colors.black,
						paddingTop: insets.top,
					},
					headerShown: false,
				}}
			>
				<Stack.Screen name="index" />
				<Stack.Screen
					name="restore"
					options={{
						presentation: 'modal',
					}}
				/>
			</Stack>
		</SafeAreaProvider>
	);
}
```

И осталось теперь только скорректировать цвет текста восстановления токеном из `Colors`

`app / restore.tsx`
```TSX
import { Link } from 'expo-router';
import { View, Text } from 'react-native';
import { Colors } from '../shared/tokens';

export default function Restore() {
	return (
		<View>
			<Link href={'/'}>
				<Text style={{ color: Colors.white }}>Restore</Text>
			</Link>
		</View>
	);
}
```




### Подключение шрифта

Первым делом, нужно добавить `ttf` шрифты в нашу папку ассетов `shared / assets / fonts / FiraSans / FiraSans-SemiBold.ttf`

Далее добавляем шрифт через хук из expo

`app/_layout.tsx`
```TSX
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootRayout() {
	const insets = useSafeAreaInsets();
	const [loaded, error] = useFonts({
		FiraSans: require('../assets/fonts/FiraSans-Regular.ttf'),
		FiraSansSemiBold: require('../assets/fonts/FiraSans-SemiBold.ttf'),
	});
```

Далее добавляем имена наших шрифтов в токены, чтобы ими вдальнейшем воспользоваться

`shared / const / tokens.const.ts`
```TSX
export const Fonts = {
	f16: 16,
	f18: 18,
	regular: 'FiraSans',
	semibold: 'FiraSansSemiBold',
};
```

Далее добавляем шрифты из токенов в нашу кнопку, инпут и уведомление

```TSX
import { Colors, Fonts, Radius } from '../tokens';

// Button / ErrorNotification
text: {
	color: Colors.white,
	fontSize: Fonts.f18,
	fontFamily: Fonts.regular,
},

// Input
const styles = StyleSheet.create({
	input: {
		height: 58,
		backgroundColor: Colors.violetDark,
		paddingHorizontal: 24,
		borderRadius: Radius.r10,
		fontSize: 16,
		color: Colors.gray,
		fontFamily: Fonts.regular,
	},
	eyeIcon: {
		position: 'absolute',
		right: 0,
		paddingHorizontal: 20,
		paddingVertical: 18,
	},
});
```





### SplashScreen

- Первым делом, укажем путь до изображения сплешскрина в `image`. 
- Затем нам нужно указать метод ресайзинга на `contain`, чтобы не сжимать изображение, а центрировать его. 
- И поменяем задник в `backgroundColor` под цвет задника сплеша `#16171D`

`app.json`
```JSON
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#16171D"
},
```

Первым делом меняем изображение сплеша в наших ассетов с дефолтного на наш

![](_png/Pasted%20image%2020250216095742.png)

И теперь нам нужно законтролить отображение сплеша в приложении через объект `SplashScreen`, чтобы у нас не было леаут-шифтинга при подгрузке шрифтов.

1. Отключаем автовыключение сплешэкрана через `preventAutoHideAsync`
2. Триггерим `hideAsync`, чтобы скрыть сплеш после загрузки шрифтов
3. Если произойдёт ошибка подгрузки шрифта, то выкинем ошибку на экран

`app / _layout.tsx`
```TSX
import { Stack, SplashScreen } from 'expo-router';
import { Colors } from '../shared/tokens';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootRayout() {
	const insets = useSafeAreaInsets();
	const [loaded, error] = useFonts({
		FiraSans: require('../assets/fonts/FiraSans-Regular.ttf'),
		FiraSansSemiBold: require('../assets/fonts/FiraSans-SemiBold.ttf'),
	});

	useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<StatusBar style="light" />
			<Stack
				screenOptions={{
					statusBarColor: Colors.black,
					contentStyle: {
						backgroundColor: Colors.black,
						paddingTop: insets.top,
					},
					headerShown: false,
				}}
			>
				<Stack.Screen name="index" />
				<Stack.Screen
					name="restore"
					options={{
						presentation: 'modal',
					}}
				/>
			</Stack>
		</SafeAreaProvider>
	);
}
```



### Unmatched

Реализуем страницу, которая будет выходить пользователю, если он перешёл на несуществующий экран

`app / [...unmathed].tsx`
```TSX
import { View, Text } from 'react-native';

export default function UnmatchedCustom() {
	return (
		<View>
			<Text>Не нашли</Text>
		</View>
	);
}
```




### Страница ошибки



`shared / ui / CustomLink / CustomLink.tsx`
```TSX
import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Colors, Fonts } from '../tokens';
import { LinkProps } from 'expo-router/build/link/Link';

export function CustomLink({ text, ...props }: LinkProps & { text: string }) {
	return (
		<Link style={styles.link} {...props}>
			<Text>{text}</Text>
		</Link>
	);
}

const styles = StyleSheet.create({
	link: {
		fontSize: Fonts.f18,
		color: Colors.link,
		fontFamily: Fonts.regular,
	},
});
```

Далее добавим нашу кастомную ссылку на страницу логина

`app / index.tsx`
```TSX
<CustomLink href={'/restore'} text="Восстановить пароль" />
```

Далее тут мы можем отказаться от использования хука и перейти на провайдер `SafeAreaProvider` из `react-native-safe-area-context`

`app / _layout.tsx`
```TSX
import { Stack, SplashScreen } from 'expo-router';
import { Colors } from '../shared/tokens';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootRayout() {
	const [loaded, error] = useFonts({
		FiraSans: require('../assets/fonts/FiraSans-Regular.ttf'),
		FiraSansSemiBold: require('../assets/fonts/FiraSans-SemiBold.ttf'),
	});

	useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<StatusBar style="light" />
			<Stack
				screenOptions={{
					statusBarColor: Colors.black,
					contentStyle: {
						backgroundColor: Colors.black,
					},
					headerShown: false,
				}}
			>
				<Stack.Screen name="index" />
				<Stack.Screen
					name="restore"
					options={{
						presentation: 'modal',
					}}
				/>
			</Stack>
		</SafeAreaProvider>
	);
}
```

Добавляем вёрстку страницы непопада а так же добавляем сюда вьюшку безопасной зоны для клика

`app / [...unmathed].tsx`
```TSX
import { Image, StyleSheet, Text, View } from 'react-native';
import { CustomLink } from '../shared/CustomLink/CustomLink';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Gaps } from '../shared/tokens';

export default function UnmatchedCustom() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Image
					style={styles.image}
					source={require('../assets/images/unmatched.png')}
					resizeMode="contain"
				/>
				<Text style={styles.text}>
					Ооо... что-то пошло не так. Попробуйте вернуться на главный экран приложения
				</Text>
				<CustomLink href={'/'} text="На главный экран" />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
	},
	content: {
		alignItems: 'center',
		gap: Gaps.g50,
	},
	image: {
		width: 204,
		height: 282,
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f18,
		textAlign: 'center',
		fontFamily: Fonts.regular,
	},
});
```




### Route параметры

Роуты с параметрами пишутся ровно так же, как и в NextJS. Параметры передаются в квадратных скобках `[]`

Получить доступ к параметру мы можем через хук `useLocalSearchParams` из `expo-router`

`app / course / [alias].tsx`
```TSX
import { View, Text } from 'react-native';
import { Colors } from '../../shared/tokens';
import { useLocalSearchParams } from 'expo-router';

export default function CoursePage() {
	const { alias } = useLocalSearchParams();
	return (
		<View>
			<Text style={{ color: Colors.white }}>{alias}</Text>
		</View>
	);
}
```

Для примера заменим ссылку на странице входа и перейдём по ней

`app / login.tsx`
```TSX
<CustomLink href={'/course/typescript'} text="Восстановить пароль" />
```



### Структура проекта

Объединим наши роуты через синтаксис группировки `(alias)`. Это позволит нам поместить в одно место роуты без изменения путей к скринам.


`app / (app) / _layout.tsx`
```TSX
import { Stack } from 'expo-router';

export default function AppRayout() {
	return (
		<Stack>
			<Stack.Screen name="index" />
		</Stack>
	);
}
```

Доавбялем страницу моих курсов как основную страницу в приложении

`app / (app) / index.tsx`
```TSX
import { View, Text } from 'react-native';
import { Colors } from '../../shared/tokens';

export default function MyCourses() {
	return (
		<View>
			<Text style={{ color: Colors.white }}>MyCourses</Text>
		</View>
	);
}
```

Меняем имя страницы авторизации с `index` на `login`

`app / _layout.tsx`
```TSX
<SafeAreaProvider>
		<StatusBar style="light" />
		<Stack
			screenOptions={{
				statusBarColor: Colors.black,
				contentStyle: {
					backgroundColor: Colors.black,
				},
				headerShown: false,
			}}
>
			<Stack.Screen name="login" />
			<Stack.Screen
				name="restore"
				options={{
					presentation: 'modal',
				}}
			/>
		</Stack>
	</SafeAreaProvider>
```

И меняем роут нашей страницы с курсом

`[‎app/course/[alias].tsx -> ‎app/(app)/course/[alias].tsx]`

### Вложенные Layout




### Expo router







## Запросы и состояния

### Выбор State Manager













### Архитектура проекта













### Первый атом



`package.json`
```JSON
"expo-constants": "~14.4.2",
"expo-linking": "~5.0.2",
"expo-router": "^2.0.0",
"jotai": "^2.6.2",
"react-native-gesture-handler": "~2.12.0",
"react-native-svg": "13.9.0"
```



`entities/user/model/user.model.ts`
```TS
export interface User {
	id: number;
	name: string;
	surname?: string;
	photo?: string;
}
```



`entities/user/model/user.state.ts`
```TS
import { atom } from 'jotai';
import { User } from './user.model';

export const profileAtom = atom<UserState>({
	profile: {
		id: 1,
		name: 'Антон',
	},
	isLoading: false,
	error: null,
});

export interface UserState {
	profile: User | null;
	isLoading: boolean;
	error: string | null;
}
```



`app/(app)/index.tsx`
```TSX
import { useAtom } from 'jotai';
import { View, Text } from 'react-native';
import { Colors } from '../../shared/tokens';
import { profileAtom } from '../../entities/user/model/user.state';

export default function MyCourses() {
	const [profile] = useAtom(profileAtom);
	return (
		<View>
			<Text style={{ color: Colors.white }}>MyCourses</Text>
			<Text>{profile.profile?.name}</Text>
		</View>
	);
}
```






### AsyncStorage



`package.json`
```JSON
"@react-native-async-storage/async-storage": "1.18.2"
```



`app / (app) / index.tsx`
```TSX
import { useAtom } from 'jotai';
import { View, Text } from 'react-native';
import { profileAtom } from '../../entities/user/model/user.state';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

export default function MyCourses() {
	const [profile] = useAtom(profileAtom);
	useEffect(() => {
		AsyncStorage.setItem('demo', 'test').then(async () => {
			console.log(await AsyncStorage.getAllKeys());
			console.log(await AsyncStorage.getItem('demo'));
			console.log(await AsyncStorage.removeItem('demo'));
			console.log(await AsyncStorage.getItem('demo'));
		});
	}, []);
```









### atomWithStorage


`entities/auth/model/auth.state.ts`
```TS
import { createJSONStorage, atomWithStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = createJSONStorage<AuthState>(() => AsyncStorage);

export const authAtom = atomWithStorage<AuthState>(
	'auth',
	{
		access_token: null,
		isLoading: false,
		error: null,
	},
	storage,
);

export interface AuthState {
	access_token: string | null;
	isLoading: boolean;
	error: string | null;
}
```









### Запросы на сервер



```bash
npm i axios
```



`entities/auth/model/auth.intefaces.ts`
```TS
export interface IAuthResponse {
	access_token: string;
}
```



`entities/auth/api/api.ts`
```TS
export const PREFIX = 'https://purpleschool.ru/api-v2';
export const API = {
	login: `${PREFIX}/auth/login`,
};
```



`app / (app) / index.tsx`
```TSX
import { useAtom } from 'jotai';
import { View, Text } from 'react-native';
import { profileAtom } from '../../entities/user/model/user.state';
import axios from 'axios';
import { API } from '../../entities/auth/api/api';
import { useEffect } from 'react';
import { IAuthResponse } from '../../entities/auth/model/auth.intefaces';

export default function MyCourses() {
	const [profile] = useAtom(profileAtom);
	const login = async () => {
		const { data } = await axios.post<IAuthResponse>(API.login, {
			email: 'vasia@pupkin.ru',
			password: '123456789',
		});
		console.log(data);
	};
	useEffect(() => {
		login();
	}, []);
	return (
		<View>
			<Text>{profile.profile?.name}</Text>
```



### Запросы в State



`entities / auth / model / auth.intefaces.ts`
```TS
export interface AuthResponse {
	access_token: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}
```



`entities / auth / model / auth.state.ts`
```TSX
import { createJSONStorage, atomWithStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { atom } from 'jotai';
import { AuthResponse, LoginRequest } from './auth.intefaces';
import axios, { AxiosError } from 'axios';
import { API } from '../api/api';

const storage = createJSONStorage<AuthState>(() => AsyncStorage);

export const authAtom = atomWithStorage<AuthState>(
	'auth',
	{
		access_token: null,
		isLoading: false,
		error: null,
	},
	storage,
);

export const loginAtom = atom(
	(get) => get(authAtom),
	async (_get, set, { email, password }: LoginRequest) => {
		set(authAtom, {
			isLoading: true,
			access_token: null,
			error: null,
		});
		try {
			const { data } = await axios.post<AuthResponse>(API.login, {
				email,
				password,
			});
			set(authAtom, {
				isLoading: false,
				access_token: data.access_token,
				error: null,
			});
		} catch (error) {
			if (error instanceof AxiosError) {
				set(authAtom, {
					isLoading: false,
					access_token: null,
					error: error.response?.data.message,
				});
			}
		}
	},
);

export interface AuthState {
	access_token: string | null;
	isLoading: boolean;
	error: string | null;
}
```



`app / (app) / index.tsx`
```TSX
import { useAtom } from 'jotai';
import { View, Text } from 'react-native';
import { loginAtom } from '../../entities/auth/model/auth.state';
import { useEffect } from 'react';

export default function MyCourses() {
	const [auth, login] = useAtom(loginAtom);

	useEffect(() => {
		login({ email: 'vasia@pupkin.ru', password: '12345678' });
	}, []);

	return (
		<View>
			<Text>{auth?.access_token}</Text>
		</View>
	);
}
```







### Выход



`entities / auth / model / auth.state.ts`
```TSX
import { createJSONStorage, atomWithStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { atom } from 'jotai';
import { AuthResponse, LoginRequest } from './auth.intefaces';
import axios, { AxiosError } from 'axios';
import { API } from '../api/api';

const storage = createJSONStorage<AuthState>(() => AsyncStorage);

const INITIAL_STATE = {
	access_token: null,
	isLoading: false,
	error: null,
};

export const authAtom = atomWithStorage<AuthState>('auth', INITIAL_STATE, storage);

export const logoutAtom = atom(null, (_get, set) => {
	set(authAtom, INITIAL_STATE);
});

export const loginAtom = atom(
	(get) => get(authAtom),
	async (_get, set, { email, password }: LoginRequest) => {
		set(authAtom, {
			isLoading: true,
			access_token: null,
			error: null,
		});
		try {
			const { data } = await axios.post<AuthResponse>(API.login, {
				email,
				password,
			});
			set(authAtom, {
				isLoading: false,
				access_token: data.access_token,
				error: null,
			});
		} catch (error) {
			if (error instanceof AxiosError) {
				set(authAtom, {
					isLoading: false,
					access_token: null,
					error: error.response?.data.message,
				});
			}
		}
	},
);

export interface AuthState {
	access_token: string | null;
	isLoading: boolean;
	error: string | null;
}
```



`app/(app)/index.tsx`
```TSX
import { useSetAtom } from 'jotai';
import { View, Text } from 'react-native';
import { logoutAtom } from '../../entities/auth/model/auth.state';
import { useEffect } from 'react';

export default function MyCourses() {
	// const [auth, login] = useAtom(loginAtom);
	const logout = useSetAtom(logoutAtom);

	useEffect(() => {
		logout();
	}, []);

	return (
		<View>
			<Text>index</Text>
		</View>
	);
}
```




### Программный редирект



`app / (app) / index.tsx`
```TSX
import { useAtomValue } from 'jotai';
import { View, Text } from 'react-native';
import { authAtom } from '../../entities/auth/model/auth.state';
import { useEffect } from 'react';
import { router, useRootNavigationState } from 'expo-router';

export default function MyCourses() {
	const { access_token } = useAtomValue(authAtom);
	const state = useRootNavigationState();

	useEffect(() => {
		if (!state?.key) return;
		if (!access_token) {
			router.replace('/login');
		}
	}, [access_token, state]);

	return (
		<View>
			<Text>index</Text>
		</View>
	);
}
```









### Redirect компонент

Чистим компонент с курсом

`app / (app) / index.tsx`
```TSX
import { View, Text } from 'react-native';

export default function MyCourses() {
	return (
		<View>
			<Text>index</Text>
		</View>
	);
}
```

И переносим логику редиректа в лейаут

`app / (app) / _layout.tsx`
```TSX
import { Redirect, Stack } from 'expo-router';
import { useAtomValue } from 'jotai';
import { authAtom } from '../../entities/auth/model/auth.state';

export default function AppRayout() {
	const { access_token } = useAtomValue(authAtom);
	
	if (!access_token) {
		return <Redirect href="/login" />;
	}

	return (
		<Stack>
			<Stack.Screen name="index" />
		</Stack>
	);
}
```


### Реализация логина













### ActivityIndicator









## Боковая панель

### Drawer Layout













### Стилизация панели













### Кнопка открытия













### Кастомный Drawer













### Стилизация Drawer













### Получение данных профиля













### Компонент пользователя













### Компонент меню













### Навигация




















## Нативные возможности

### Обновление Expo













### Рефакторинг приложения













### ImagePicker













### Permissions













### Отображение изображения













### Permissions













### Компонент загрузки













### Загрузка на сервер













### Улучшаем код













### Сохранение профиля













### Sharing API







## Разрешения и layout

### ScreenOrientation













### Поддержка планшетов













### KeyboardAvoidingView













### Platform


















## Списки

### Данные курсов













### Вёрстка карточки













### ScrollView













### FlatList













### RefreshControl













### Linking













### Градиентный текст













### Progress Bar





## Нотификации

### Типы уведомлений













### Установка expo-notofocations













### Отправка уведомлений













### Обработка уведомлений













### Реакция на уведомления













### Нажатие на уведомление













### Уведомление с URL













### Работа с push-уведомлениями













### Использование push-токена








## Сборка и публикация

### Переменные окружения

Первым делом, сразу добавим энвы в игнор

`.gitignore`
```
.env
```

Далее добавим переменную, чтобы была возможность разрабатывать локально

Все переменные должны иметь префикс `EXPO_PUBLIC_` как тот же `NEXT_PUBLIC_`

`.env`
```
EXPO_PUBLIC_DOMAIN=https://purpleschool.ru/api-v2
```

И теперь можно использовать переменную сразу из процесса

`shared / api / api.ts`
```TS
export const PREFIX = `${process.env.EXPO_PUBLIC_DOMAIN}/api-v2`;
```




### Процесс публикации













### Конфигурация иконки

Меняем адаптивную и обычную иконку приложения

![](_png/Pasted%20image%2020250216103237.png)

Теперь нам нужно сменить конфигурацию

`app.json`
```JSON
{
  "expo": {
-    "name": "native-app",
-    "slug": "native-app",
+    "name": "PupleSchool Demo App",
+    "slug": "purple-school-demo-app",
+	"description": "Приложение школы PurpleSchool для прохождения курсов",
    "version": "1.0.0",
+	"platforms": ["ios", "android"],
    "icon": "./assets/icon.png",
+	"orientation": "portrait",
    "userInterfaceStyle": "light",
	"backgroundColor": "#16171D",
+	"primaryColor": "#6C38CC",
	"extra": { 
	"eas": { 
		"projectId": "9e8de316-bef0-4e46-9476-cabcea343056" 
		} 
	},
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#16171D"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
-     "supportsTablet": true
+     "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
	  [
		"expo-font",
		{
			"fonts": [
				"./assets/fonts/FiraSans-Regular.ttf",
				"./assets/fonts/FiraSans-SemiBold.ttf"
			]
		}
	  ],
	  [
        "expo-notifications",
			{
				"icon": "./assets/notification-icon.png",
				"color": "#16171D"
			}
      ],
+	  [
        "expo-image-picker",
        {
			"photosPermission": "Необходимо разрешение для выбора фото профиля"
        }
      ]
    ],
	"scheme": "purpleschool"
  }
}
```







### Сборка через EAS

Первым делом, подготовим конфиг приложения к сборке

`app.json`
```JSON
{
  "expo": {
    "name": "PupleSchool Demo App",
	/** слаг должен быть без "-" */
    "slug": "purpleschooldemoapp",
    "description": "Приложение школы PurpleSchool для прохождения курсов",
    "version": "1.0.0",
    "platforms": [
      "ios",
      "android"
    ],
    "icon": "./assets/icon.png",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "backgroundColor": "#16171D",
    "primaryColor": "#6C38CC",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#16171D"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
	  /** указываем разрешения, которые понадобятся для андроида */
      "permissions": [
        "android.permission.RECORD_AUDIO"
      ],
      "package": "ru.purpleschool.purpleappdemo"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/FiraSans-Regular.ttf",
            "./assets/fonts/FiraSans-SemiBold.ttf"
          ]
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#16171D"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Необходимо разрешение для выбора фото профиля"
        }
      ]
    ],

	/** дополняем схему и добавялем параметры сборки */
    "scheme": "purpleschool",
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "ae16f11a-60ff-4bc6-a52c-ce1a2f7b011d"
      }
    },
    "owner": "alaricode"
  }
}
```

Далее нужно сгенерирть конфиг для билда в `eas`

`eas.json`
```JSON
{
  "cli": {
    "version": ">= 7.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
	  "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```





### Сборка через XCode

Убираем папку сборки из гита

`.gitignore`
```
ios/
```

В настройках приложения нужно добавить имя бандла `bundleIdentifier`, в котором указать имя приложения

`app.json`
```JSON
"ios": {
  "supportsTablet": false,
  "bundleIdentifier": "ru.purpleschool.purpleappdemo"
},
```

Меняем методы сборки в пакадже на expo сборку

`package.json`
```JSON
"scripts": {
	"start": "expo start",
-	"android": "expo start --android",
-   "ios": "expo start --ios",
+   "android": "expo run:android",
+   "ios": "expo run:ios",
	"web": "expo start --web"
},
```






### Сборка через Android Studio

Единственное, что нам нужно сделать в коде - это убрать папку вывода приложения из отслеживания гитом

`.gitignore`
```
android/
```



### Сборка через Expo










