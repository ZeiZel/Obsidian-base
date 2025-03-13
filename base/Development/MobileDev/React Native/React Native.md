
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

![](_png/Pasted%20image%2020250303185941.png)

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

![](_png/Pasted%20image%2020250303190027.png)

#### align/justify

Дефолтно, `flexDirection` у нас равен `column`, поэтому основная ось, относительно которой работают align и justify - это вертикальная. Вспомогательной же будет горизонтальная. Если мы поменяем направление на `row`, то горизонтальная станет основной, а вертикальная вспомогательной.

- `alignItems` - отвечает за выравнивание элементов по вспомогательной оси
- `justifyContent` - отвечает за выравнивание элементов по основной оси

>[!info] Все базовые свойства работают точно так же, как и в вебе.

![](_png/Pasted%20image%2020250303190015.png)

![](_png/Pasted%20image%2020250303190105.png)

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

![](_png/Pasted%20image%2020250303190126.png)

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

![](_png/Pasted%20image%2020250303190147.png)

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

Чтобы добавить изображение в приложение, нам нужно воспользоваться нативным компонентом `Image`. Чтобы указать путь до локального изображения, нам нужно передать `require` либо мы можем указать сразу url на изображение из сети

`app / (tabs) / sample.tsx`
```TSX
import { Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';

const LOGO = require('@/shared/assets/logo.png');

export default function SamplePage() {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
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

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
		padding: 55,
		backgroundColor: '#16171D',
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
	logo: {
		width: 220,
	},
});
```

![](_png/Pasted%20image%2020250226183901.png)

### Input

Создадим отдельный компонент инпута нашего приложения на основе нативного инпута из RN

Сам инпут имеет схожее поведение с браузерным, но стилизацию псевдоселекторами тут заменили на пропсы. Если нам нужно покрасить плейсходер, то нужно будет воспользоваться `placeholderTextColor`

`shared / ui / Input / Input.tsx`
```TSX
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

export const Input = (props: TextInputProps) => {
	return <TextInput style={styles.input} placeholderTextColor={'#AFB2BF'} {...props} />;
};

const styles = StyleSheet.create({
	input: {
		height: 58,
		backgroundColor: '#2e2d3d',
		paddingHorizontal: 24,
		borderRadius: 10,
		fontSize: 16,
	},
});
```

И теперь можем наш инпут спокойно применять везде в приложении

`app / (tabs) / sample.tsx`
```TSX
import { Input } from '@/shared/ui';
import { Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';

const LOGO = require('@/shared/assets/logo.png');

export default function SamplePage() {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input placeholder='Password' />
					<Button title='Войти' />
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
		backgroundColor: '#16171D',
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
	logo: {
		width: 220,
	},
});
```

![](_png/Pasted%20image%2020250226190344.png)

### Дизайн система

Дизайн система в мобильном приложении будет полностью находиться в JS и триггериться из него. 

Сейчас нам нужно указать:
- `COLORS` - все возможные цвета
- `GAPS` - все возможные отступы между элементами
- `FONTS` - все возможные размеры шрифтов и их типы начертания
- `RADIUS` - возможные радиусы скругления

Тут используется максимально прямолинейная система, когда мы указываем цвет/размер прямо в наименовании константы, но стоит использовать имена по типу отображения (error / success / warning / info / day / night). Однако тут у нас только одна тёмная тема, поэтому в названии указывать цвета, а не домен использования - допустимо

`shared / const / tokens.const.ts`
```TS
export const COLORS = {
    black: '#16171D',
    blackLight: '#1E1F29',
    gray: '#AFB2BF',
    violetDark: '#2E2D3D',
    primary: '#6C38CC',
    primaryHover: '#452481',
    link: '#A97BFF',
    white: '#FAFAFA',
    red: '#CC384E',
    border: '#4D5064',
};

export const GAPS = {
    g8: 8,
    g10: 10,
    g16: 16,
    g20: 20,
    g50: 50,
};

export const FONTS = {
    f14: 14,
    f16: 16,
    f18: 18,
    f20: 20,
    f21: 21,
    regular: 'FiraSans-Regular',
    semibold: 'FiraSans-SemiBold',
};

export const RADIUS = {
    r10: 10,
    r17: 17,
};
```

Теперь применяем константы к нашим компонентам

`shared / ui / Input`
```TSX
import { COLORS, FONTS, RADIUS } from '@/shared/const';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

export const Input = (props: TextInputProps) => {
	return <TextInput style={styles.input} placeholderTextColor={'#AFB2BF'} {...props} />;
};

const styles = StyleSheet.create({
	input: {
		height: 58,
		backgroundColor: COLORS.violetDark,
		paddingHorizontal: 24,
		borderRadius: RADIUS.r10,
		fontSize: FONTS.f16,
		color: COLORS.gray,
	},
});
```

Вставляем наши переменные ДС в стили страницы

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
```

### SVG

Поддержки svg из коробки у нас нет, поэтому нужно будет установить отдельный пакет, который позволит имплементировать их в приложение

```bash
npm i react-native-svg
```

При вставке SVG в приложение, нам нужно будет заменить браузерные теги на теги из библиотеки. Она сама преобразует изображение нужным образом и соберёт картинку, которую нужно будет отобразить на мобильном устройстве

`shared / assets / icons / eye-closed.tsx`
```TSX
import Svg, { Path } from 'react-native-svg';

export const EyeClosedIcon = () => (
	<Svg width={24} height={24} fill='none'>
		<Path
			fill='#AFB2BF'
			d='M2.69 6...'
		/>
	</Svg>
);

```

Но чтобы ускорить ход дела, можно воспользоваться сайтом [react-svgr](https://react-svgr.com/playground/?native=true), который за нас сделает рутинный перевод svg в рякт

![](_png/Pasted%20image%2020250226195311.png)

И теперь мы просто можем вставить иконки, как React-компоненты в наше приложение

`app / index.tsx`
```TSX
import { EyeClosedIcon, EyeOpenedIcon } from '@/shared/assets/icons';

export default function LoginPage() {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
				<View style={styles.form}>
					<Input placeholder='Email' />
					<Input placeholder='Password' />
					<Button title='Войти' />
				</View>
				<EyeClosedIcon />
				<EyeOpenedIcon />
				<Text>Восстановить пароль</Text>
			</View>
		</View>
	);
}
```

![](_png/Pasted%20image%2020250226202801.png)

### Обработка событий

Обработка событий в RN достаточно похожа на веб, но отличается тем, что мы перехватываем специфичные для мобилки события через компоненты RN

Добавляем отдельно инпут нашего пароля, который будет обёрткой над нашим базовым инпутом. 

Воспользуемся компонентом `Pressable`, который перехватывает ивенты нажатия на экран и при событии `onPress` (нажатие), мы будем вызывать изменение состояния отображения текста. Чтобы скрыть текст под пароль, нужно передать параметр `secureTextEntry` в сам инпут

`shared / ui / PasswordInput / PasswordInput.tsx`
```TSX
import { EyeClosedIcon, EyeOpenedIcon } from '@/shared/assets/icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import { Input } from '../..';

export const PasswordInput = (props: TextInputProps) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

	const handleToggleShowState = () => setIsPasswordVisible((state) => !state);

	return (
		<View>
			<Input secureTextEntry={!isPasswordVisible} {...props} />
			<Pressable onPress={handleToggleShowState} style={styles.eyeIcon}>
				{isPasswordVisible ? <EyeOpenedIcon /> : <EyeClosedIcon />}
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create({
	eyeIcon: {
		position: 'absolute',
		right: 0,
		paddingHorizontal: 20,
		paddingVertical: 18,
	},
});
```

И вставялем инпут нашего пароля на главную

`app / index.tsx`
```TSX
export default function LoginPage() {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
				<View style={styles.form}>
					<Input placeholder='Email' />
					<PasswordInput placeholder='Password' />
					<Button title='Войти' />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View>
	);
}
```

![](_png/Pasted%20image%2020250226202716.png)

### Кнопка

Теперь нужно описать кнопку. Реализовываем для гибкости не нативную кнопку так же через компонент `Pressable`, как когда мы делали кнопку для инпута, но заворачиваем внутрь уже не кнопку, а вьюшку с текстом. 

Тут гоняться за нативностью не актуально для мобилного устройства, так как под каждую ОС кнопка выглядит совершеннно по-разному и проще будет сделать таким образом с самостоятельной отрисовкой. Так же у нас тут нет таких же острых проблем с доступностью

`shared / ui / Button / Button.tsx`
```TSX
import { COLORS, FONTS, RADIUS } from '@/shared/const';
import { Pressable, PressableProps, ButtonProps, View, Text, StyleSheet } from 'react-native';

export interface IButtonProps extends PressableProps, Pick<ButtonProps, 'title'> {
	text?: string;
}

export const Button = ({ title, text, ...props }: IButtonProps) => {
	return (
		<Pressable {...props}>
			<View style={styles.button}>
				<Text style={styles.text}>{title ?? text}</Text>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 58,
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.r10,
	},
	text: {
		color: COLORS.white,
		fontSize: FONTS.f18,
	},
});
```

И добавляем нашу новую кнопку на страницу

`app / index.tsx`
```TSX
import { Input, PasswordInput, Button } from '@/shared/ui';

export default function LoginPage() {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
				<View style={styles.form}>
					<Input placeholder='Email' />
					<PasswordInput placeholder='Password' />
					<Button title={'Войти'} />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View>
	);
}
```

![](_png/Pasted%20image%2020250226204018.png)

## Анимация

### Основы анимации

Анимация в RN строится на нативном компоненте `Animated`, который предоставляет нам множество интерфейсов для реализации анимации

При создании `Animated` мы можем выбрать `Value` либо `ValueXY`, которые будут представлять из себя анимационные величины

Для изменения величин во времени мы можем использовать `Animated.timing` (линейное изменение) и `Animated.spring` (анимация по Безье). Для него мы передаём конченые значения и триггерим `start` анимации. В `start` можно передать коллбэк, который отработает на старте.

Чтобы была возможность применить анимацию на компоненте, нужно `View` так же брать из объекта `Animated`

`shared / ui / Button / Button.tsx`
```TSX
import { Animated, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';

export function Button({ text, ...props }: PressableProps & { text: string }) {
	const animatedValue = new Animated.ValueXY({
		x: 0,
		y: 0
	});

	/* Animated.timing(animatedValue, {
		toValue: {
			x: 100,
			y: 100
		},
		// длительность
		duration: 2000,
		useNativeDriver: true
	}).start(); */
	
	Animated.timing(animatedValue, {
		toValue: {
			x: 100,
			y: 100
		},
		useNativeDriver: true
		// триггерим любое событие на старте анимации
	}).start(() => console.log('asdadsd'));
	
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
```

![](_png/Pasted%20image%2020250227205514.png)

### Как работает анимация

Изначально, вызов и обработка анимации происходят на стороне JS и триггерят на каждый кадр огромное количество порядков, которые потом уходят в Bridge и он рендерит изменение положения элемента

Это может приводить к тому, что мы можем заблокировать основной поток своими неоптимальными действиями

![](_png/Pasted%20image%2020250303190215.png)

Когда мы используем нативный драйвер всю ответственность за калькуляцию операции мы перекладываем на нативные методы и уже они будут вызывать нужный нам рендер, так как Bridge просто отдал факт того, что нужно провести следующую калькуляцию в такой последовательности

![](_png/Pasted%20image%2020250303190225.png)

И у нас будет разное поведение анимации при разных значениях `useNativeDriver`: 
- если мы поставим `false`, то в купе с тяжёлой анимацией, у нас будет просто скачок из одного в другое место, потому что поток не смог обработать анимацию и кинуть сигнал на рендер через Bridge
- если мы поставим `true`, то анимация отработает полностью даже при заблокированном потоке, потому что сигнал мы отправили на устройство сразу

>[!hint] Дефолтно стоит ставить `useNativeDriver` на `true`

>[!warning] Однако иногда анимация может сбоить с нативным драйвером и рисоваться с багами, поэтому может понадобиться использовать `false` 

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
		useNativeDriver: true / false
	}).start();

	useEffect(() => {
		for (let i = 1; i < 10000; i++) {
			console.log('2');
		}
	}, [])

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
```

### Ограничения анимации

Самым большим ограничением нативного драйвера анимации является отсутствие возможности менять layout элементов. Если нам нужно проанимировать любые другие значения, кроме `transform`, то мы обязаны использовать `useNativeDriver: false`

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
```

![](_png/Pasted%20image%2020250227211208.png)

Чтобы удобно и хорошо работать со сложной анимацией в мобильном приложении, нам нужно будет воспользоваться [React Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/)

Он работает эффективнее, так как использует возможности новой архитектуры и пользуется `sharedValue` между JS и нативной средой

![](_png/Pasted%20image%2020250303190243.png)

### Интерполяция

Интерполяция позволяет нам изменять входной диапазон значений в другой выходной

> Сейчас мы будем добавлять анимацию изменения цвета кнопки

Для этого мы создадим анимационное значение `new Animated.Value(100)`, из него соберём интерполяцию перехода из `inputRange` (входное числовое значение) в `outputRange` (выходной массив значений). Меняя число, мы будем менять цвет от одного к другому во времени

`timing` будет линейно изменять цвет в течение трёх секунд

Так же из стилей можно вырезать будет `backgroundColor`, так как мы вставляем свой

`shared / ui / Button / Button.tsx`
```TSX
import { Animated, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';

export function Button({ text, ...props }: PressableProps & { text: string }) {
	// анимационное значение
	const animatedValue = new Animated.Value(100);
	// интерполяция между числом и цветом с выводом цвета
	const color = animatedValue.interpolate({
		// входной массив значений
		inputRange: [0, 100],
		// и промеждуток между этими цветами мы будем получать от изменения value, который находится между значениями из inputRange
		outputRange: [Colors.primaryHover, Colors.primary]
	});

	// анимация цвета во времени
	Animated.timing(animatedValue, {
		toValue: 0,
		duration: 3000,
		useNativeDriver: true
	}).start();

	return (
		<Pressable {...props}>
			<Animated.View style={{
				// добавляем цвет в бэкграунд
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
		// вырезали backgroundColor
		borderRadius: RADIUS.r10,
	},
	text: {
		color: COLORS.white,
		fontSize: FONTS.f18,
	},
});
```

Теперь у нас есть автоматическая интерполяция цвета от одного к другому

### Анимация кнопки

У нас есть несколько разных событий, которые мы можем повесить на `Pressable` компонент:
- `onPress` - стандартная отработка нажатия с возможностью не отрабатывать при миссклике (нажал и потянул или совершил другое действие)
- `onPressIn` - сразу при нажатии на кнопку
- `onPressOut` - при снятии пальца с кнопки
- `onLongPress` - нажали и удерживаем

`shared / ui / Button / Button.tsx`
```TSX
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';

export interface IButtonProps extends PressableProps, Pick<ButtonProps, 'title'> {
	text?: string;
}

export const Button = ({ title, text, onPressIn, onPressOut, ...props }: IButtonProps) => {
	const animatedValue = new Animated.Value(100);
	const color = animatedValue.interpolate({
		inputRange: [0, 100],
		outputRange: [COLORS.primaryHover, COLORS.primary],
	});

	const handleAnimate = (value: number) => {
		Animated.timing(animatedValue, {
			useNativeDriver: true,
			duration: 100,
			toValue: value,
		}).start();
	}

	const handleOnPressIn = (e: GestureResponderEvent) => {
		handleAnimate(0)
		onPressIn?.(e);
	};

	const handleOnPressOut = (e: GestureResponderEvent) => {
		handleAnimate(100)
		onPressOut?.(e);
	};

	return (
		<Pressable {...props} onPressIn={handleOnPressIn} onPressOut={handleOnPressOut}>
			<Animated.View
				style={{
					...styles.button,
					backgroundColor: color,
				}}
			>
				<Text style={styles.text}>{title ?? text}</Text>
			</Animated.View>
		</Pressable>
	);
};
```

Теперь при нажатии на кнопку, у нас будет срабатывать анимация изменения цвета кнопки

### Alert и Toast

Для реализации уведомлений у нас есть несколько сущностей:
- `ToastAndroid` - специфичное для андроида уведомление
- `Alert` - кроссплатформенный класс, который вызывает стандартное уведомление для каждый платформы. Содержит в себе `alert` и `prompt`

Чтобы воспользоваться `ToastAndroid` стоит проверить, на какой платформе мы находимся. Информацию о платформе в себе хранит объект `Platform`.

`app / index.tsx`
```TSX
import { Alert, Image, Platform, StyleSheet, Text, ToastAndroid, View } from 'react-native';

export default function LoginPage() {
	const alertIn = () => {
		// проверяем платформу
		if (Platform.OS === 'android') {
			// вызываем уведомление для андроида
			ToastAndroid.showWithGravity('Неверный логин или пароль', ToastAndroid.LONG, ToastAndroid.CENTER);
		}
	}

	const alertOut = () => {
		// вызываем окошко алёрта
		Alert.alert('Произошла ошибка', 'Неверный логин или пароль', [
			{
				text: 'Хорошо',
				isPreferred: true,
				onPress: () => {
				},
				style: 'cancel',
			},
			{
				text: 'Отмена',
				isPreferred: true,
				onPress: () => {
				},
				style: 'default',
			},
		]);
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
				<View style={styles.form}>
					<Input placeholder="Email" />
					<PasswordInput placeholder="Password" />
					<Button title={'Войти'} onPress={alertIn} onPressOut={alertOut} />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View>
	);
}
```

Вот так выглядит `Alert`

![](_png/Pasted%20image%2020250228185052.png)

И вот так выглядит `ToastAndroid.showWithGravity`

![](_png/Pasted%20image%2020250228184735.png)

### Уведомление

Опишем интерфейс уведомления. Оно будет получать только строку с ошибкой

`shared / ui / ErrorNotification / ErrorNotification.props.ts`
```TSX
export interface ErrorNotificationProps {
	error?: string;
}
```

Далее реализуем компонент этого уведомления. Тут мы должны будем использовать состояние с занесением ошибки и скрытием её от пользователя через таймаут.

Чтобы триггернуть анимацию при появлении вёрстки, нам нужно воспользоваться событием `onLayout`, которое триггерится, когда у нас меняется лейаут. То есть так мы сможем триггернуть старт анимации при появлении этого компонента `Animated.View`

В качестве ширины уведомления воспользуемся `Dimensions.get('screen').width` откуда получим полную ширину экрана вместо использования `100%`, который не растянется на всю ширину из-за абсолютного позиционирования

`shared / ui / ErrorNotification / ErrorNotification.tsx`
```TSX
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { IErrorNotificationProps } from './ErrorNotification.props';
import { COLORS, FONTS } from '@/shared/const';

export const ErrorNotification = ({ error }: IErrorNotificationProps) => {
	const [isShown, setIsShown] = useState(false);
	const animatedValue = new Animated.Value(-100);

	const onEnter = () => {
		Animated.timing(animatedValue, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start();
	};

	useEffect(() => {
		if (!error) return;
		setIsShown(true);
		const timerId = setTimeout(() => {
			setIsShown(false);
		}, 5000);
		return () => {
			clearTimeout(timerId);
		};
	}, [error]);

	return isShown && (
		<Animated.View
			onLayout={onEnter}
			style={{
				...styles.error,
				transform: [
					{ translateY: animatedValue },
				]
			}}
		>
			<Text style={styles.error__text}>
				{error}
			</Text>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	error: {
		position: 'absolute',
		top: 0,
		width: Dimensions.get('screen').width,
		padding: 15,
		backgroundColor: COLORS.red,
	},
	error__text: {
		fontSize: FONTS.f16,
		color: COLORS.white,
		textAlign: 'center',
		fontFamily: FONTS.regular,
	},
});
```

И вставляем уведомление на главную страницу

`app / index.tsx`
```TSX
export default function LoginPage() {
	const [error, setError] = useState('');

	const alertIn = () => {
		setError('Неверный логин или пароль!');
		setTimeout(() => {
			setError(undefined);
		}, 4000)
	};

	return (
		<View style={styles.container}>
			<ErrorNotification error={error} />
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
				<View style={styles.form}>
					<Input placeholder="Email" />
					<PasswordInput placeholder="Password" />
					<Button title={'Войти'} onPress={alertIn} />
				</View>
				<Text>Восстановить пароль</Text>
			</View>
		</View>
	);
}
```

![](_png/Pasted%20image%2020250301105040.png)

## Отладка и lint

### Eslint

Устанавливаем форматтировщик и линтер

```bash
bun i prettier eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-native
```

Конфиг для eslint, в котором так же находится и конфиг для prettier

`.eslintrc`
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
        "endOfLine": "auto",
        "jsxSingleQuote": true,
        "tabWidth": 4,
        "arrowParens": "always"
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

Все ошибки у нас вываливаются одновременно в консоли телефона и в консоли бандлера

![](_png/Pasted%20image%2020250302180011.png)

Так же в консоли бандлера у нас выходят логи, которые мы задали сами

![](_png/Pasted%20image%2020250302180047.png)

### Отладчик Chrome

Меню дебага позволяет нам произвести множество операций над приложением в мобильном устройстве

Менюшку экспо с инструментами мы можем открыть через шейк телефона либо через нажатие клавиши `m` в терминале с бандлером

![](_png/Pasted%20image%2020250302180803.png)

Element Inspector позволяет нам глянуть: 

- на полный путь до элемента и на его параметры, которые рисуют элемент именно таким

![](_png/Pasted%20image%2020250302180746.png)

- На возможные участки для клика пользователем

![](_png/Pasted%20image%2020250302183804.png)

- на нетворк запросы
- на производительность страницы

Если в меню мы открыем JS Debugger, то увидим обычный DevTools, через который можно удобно просмотреть всю информацию по проекту, включая возможность работы с Components и Profiler вкладками дебаггера React

![](_png/Pasted%20image%2020250302183955.png)

### React Dev Tools









### Отладка и lint













## Expo router

### Выбор роутинга

React Navigation следует принципу структуризации роутов как кода, когда Expo Router предлагает нам удобный роутинг по типу того, что предоставляет NextJS

![](_png/Pasted%20image%2020250303190308.png)

### Добавление роута

Если мы используем дефолтный проект без роутинга, то наша стартовая точка - это `App.jsx` в корне проекта. Внутрь неё мы должны были бы навешивать React Navigation. 

> В приложение нужно завести app-роутер, который аналогичен тому, что сейчас есть в nextjs

Полная последовательность подключения всегда [указана в документации](https://docs.expo.dev/router/installation/)

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

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
      "expo-router", // <--
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

И в итоге мы получаем роутер, который основан на папке `app`, где каждый `index` или `name.tsx` будет являться страницей: `app / (tabs) / sample.tsx`

### Страницы и навигации

Создадим страницу восстановления `restore`, которая теперь будет доступна нам по роуту `/restore`. В качестве отображения для роута используется дефолтно экспортируемая функция

Чтобы создать линк на другой роут, нам нужно воспользоваться компонентом `Link` из `expo-router`, который предоставит нам возможность перейти на этот роут

`app / restore.tsx`
```TSX
import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function Restore() {
	return (
		<View>
			<Text>This is restore page</Text>
			<Link href={'/'}>
				<Text>Login</Text>
			</Link>
		</View>
	);
}
```

И на странице логина, которую мы обозначили как `index` (основная страница группы, которая будет грузиться первой на `/`), мы так же создадим ссылку на восстановление пароля

`app / index.tsx`
```TSX
export default function LoginPage() {
	const [error, setError] = useState('');

	console.log('LoginPage', error);

	const alertIn = () => {
		setError('Неверный логин или пароль!');
	};

	return (
		<View style={styles.container}>
			<ErrorNotification error={error} />
			<View style={styles.content}>
				<Image source={LOGO} resizeMode={'contain'} style={styles.logo} />
				<View style={styles.form}>
					<Input placeholder='Email' />
					<PasswordInput placeholder='Password' />
					<Button title={'Войти'} onPress={alertIn} />
				</View>
				<Link href={'/restore'}>
					<Text>Восстановить пароль</Text>
				</Link>
			</View>
		</View>
	);
}
```

### Layout

Для того, чтобы описать layout наших скринов, мы должны воспользоваться прямо в папке роутера зарезервированным словом `_layout`

Expo предоставляет нам компонент `Slot`, который скажет роутингу, куда нужно вставлять скрин страницы (то есть в него вставится компонент, который мы дефолтно экспортировали из страницы)

`app / _layout.tsx`
```TSX
import { Slot } from 'expo-router';
import { Text } from 'react-native';

export default function RootRayout() {
	return (
		<>
			<Text>Header</Text>
			<Slot />
			<Text>Footer</Text>
		</>
	)
}
```

Но чаще всего в лейауте определяют поведение роутинга и для этого используют компонент `Stack`. Он уже позволяет нам положить в стек страницу и вернуться к предыдущей из стрелки вверху экрана

`app / _layout.tsx`
```TSX
import { Stack } from 'expo-router';

export default function RootRayout() {
	return <Stack />;
}
```

Теперь у нас появилась такая стек-менюшка

![](_png/Pasted%20image%2020250303201537.png)

Так же мы имеем `Tabs`

`app / _layout.tsx`
```TSX
import { Tabs } from 'expo-router';

export default function RootRayout() {
	return <Tabs />;
}
```

![](_png/Pasted%20image%2020250303201731.png)

### Stack

Компонент `Stack` позволяет нам указать метаданные, которые повлияют на отображение страницы

Первый вариант - это когда мы через `Stack.Screen` указываем на конкретной странице, какие парметры мы хотим ей указать

> Параметр `presentation` лучше не указывать в этом месте, так как он более общий и с ним лучше работать из лейаута

`app / restore.tsx`
```TSX
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function Restore() {
	return (
		<View>
			<Stack.Screen options={{ title: 'Восстановить пароль' }} />
			<Text>This is restore page</Text>
			<Link href={'/'}>
				<Text>Login</Text>
			</Link>
		</View>
	);
}
```

Второй вариант и самый правильный - это использовать `Stack` в лейауте. Тут мы можем сразу указать внутри общего `Stack` с параметрами сразу для всех странц отдельные `Stack` для каждой страницы через `Stack.Screen` с указанием пропса `name`, в котором передадим роут этого экрана

`app / _layout.tsx`
```TSX
import { Stack } from 'expo-router';
import { Colors } from '../shared/tokens';

export default function RootRayout() {
	return (
		<Stack
			screenOptions={{
				statusBarBackgroundColor: COLORS.black,
				contentStyle: {
					backgroundColor: COLORS.black,
				},
			}}
		>
			<Stack.Screen name={'index'} />
			<Stack.Screen
				name={'restore'}
				options={{
					presentation: 'modal',
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
```

Основная страница у нас остаётся с хедером

![](_png/Pasted%20image%2020250304192203.png)

А страница восстановления откроется без хедера и в режиме модалки (на айфоне модалка реализована интереснее)

![](_png/Pasted%20image%2020250304192228.png)

После задания `contentStyle` задник поменяется везде

![](_png/Pasted%20image%2020250304192432.png)

### SafeArea и StatusBar

Меняем дефолтный бэкграунд приложения в его настройках. Это позволит избавиться от мерцания при переходе между страницами

`app.json`
```JSON
"backgroundColor": "#16171D",
```

Далее добавим `StatusBar` из `expo-status-bar`, который позволит нам кастоизировать статус-бар нашего телефона

Добавляем `SafeAreaProvider` и `useSafeAreaInsets` из `react-native-safe-area-context`. Они помогут провайдить безопасные границы для тапов внутри приложения. 

`app / _layout.tsx`
```TSX
import { Stack } from 'expo-router';
import { Colors } from '../shared/tokens';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootRayout() {
	// хук, из которого получим безопасные отступы
	const insets = useSafeAreaInsets();
	return (
		<SafeAreaProvider>
			<StatusBar barStyle={'dark-content'} />
			<Stack
				screenOptions={{
					statusBarBackgroundColor: COLORS.black,
					headerShown: false,
					contentStyle: {
						// применяем отступ сверху
						paddingTop: insets.top,
						backgroundColor: COLORS.black,
					},
				}}
			>
				<Stack.Screen name={'index'} />
				<Stack.Screen
					name={'restore'}
					options={{
						presentation: 'modal',
					}}
				/>
			</Stack>
		</SafeAreaProvider>
	);
}
```

Благодаря настройке `StatusBar`, мы получили возможность скорректировать наш статусбар на мобильном устройстве. Если андроид автоматически определяет цвет от контента, то iOS не всегда такое умеет.

![](_png/Pasted%20image%2020250304194249.png)

Так же у нас появился безопасный отступ сверху, который оттолкнёт контент от краёв

![](_png/Pasted%20image%2020250304195847.png)

### Подключение шрифта

Самые универсальные шрифты - это otf и ttf - они поддерживаются на любой платформе и могут использоваться везде.

Способа подключения шрифтов у нас тоже два - подключение в конфиге и из хука

Первым делом, нужно добавить `ttf` шрифты в нашу папку ассетов `shared / assets / fonts / FiraSans / FiraSans-SemiBold.ttf`

#### подключение в конфиге

Тут нам нужно просто добавить наш плагин `expo-font` и в его параметрах указать пути до шрифтов

`app.config.ts`
```TS
plugins: [
	'expo-router',
	[
		'expo-font',
		{
			fonts: [
				'./shared/assets/fonts/FiraSans-Regular.ttf',
				'./shared/assets/fonts/FiraSans-SemiBold.ttf',
			],
		},
	],
],
```

#### Подключение через хук

Далее добавляем шрифт через хук `useFonts` из expo, который принимает в себя объект вида `имя:импорт шрифта`

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

	if (!loaded) {
		return null;
	}
```

>[!hint] Но теперь у нас есть проблема при использовании такого подхода. Она заключается в том, что мы будем видеть пустой экран при подгрузке шрифта, пока он не подгрузится 

#### Использование

Далее добавляем имена наших шрифтов в токены, чтобы ими вдальнейшем воспользоваться

>[!warning] Имена должны совпадать с тем, что мы указали при импорте наших шрифтов 

`shared / const / tokens.const.ts`
```TSX
export const FONTS = {
	f16: 16,
	f18: 18,
	regular: 'FiraSans',
	semibold: 'FiraSansSemiBold',
};
```

Далее добавляем шрифты из токенов в нашу кнопку, инпут и уведомление

```TSX
import { Fonts ... } from '../tokens';

// Button / ErrorNotification
text: {
	color: COLORS.white,
	fontSize: FONTS.f18,
	fontFamily: FONTS.regular,
},

// Input
const styles = StyleSheet.create({
	input: {
		...
		fontFamily: Fonts.regular,
	},
});
```

Теперь у нас подтянулись шрифты в приложении

![](_png/Pasted%20image%2020250304195813.png)

### SplashScreen

SplashScreen - это наш начальный загрузочный экран при входе в приложение

Первым делом меняем изображение сплеша в наших ассетов с дефолтного на наш

Отдельно только стоит сказать, что можно экспортировать только лого, так как сплэш будет того же цвета, который мы указали в конфиге и это легче настроить будет там под разные ситуации 

![](_png/Pasted%20image%2020250216095742.png)

За его конфигурацию отвечает пакет `expo-splash-screen`, который мы можем применить в плагинах

- Первым делом, укажем путь до изображения сплешскрина в `image`. 
- Затем нам нужно указать метод ресайзинга `resizeMode` на `contain`, чтобы не сжимать изображение, а центрировать его. 
- И поменяем задник в `backgroundColor` под цвет задника сплеша `#16171D`
- Укажем размер изображения `imageWidth`

`app.config.ts`
```TS
plugins: [
	'expo-router',
	[
		'expo-font',
		{
			fonts: [
				'./shared/assets/fonts/FiraSans-Regular.ttf',
				'./shared/assets/fonts/FiraSans-SemiBold.ttf',
			],
		},
	],
	[
		'expo-splash-screen',
		{
			image: './shared/assets/splash.png',
			imageWidth: 200,
			resizeMode: 'contain',
			backgroundColor: '#ffffff',
			dark: {
				image: './assets/splash.png',
				backgroundColor: '#16171D',
			},
		},
	],
],
```

И теперь нам нужно законтролить отображение сплеша в приложении через объект `expo-splash-screen`, чтобы у нас не было леаут-шифтинга при подгрузке шрифтов.

1. Отключаем автовыключение сплешэкрана через `preventAutoHideAsync`
2. Триггерим `hideAsync`, чтобы скрыть сплеш после загрузки шрифтов `loaded`
3. Если произойдёт ошибка подгрузки шрифта, то выкинем ошибку на экран

`app / _layout.tsx`
```TSX
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';

preventAutoHideAsync();

export default function RootLayout() {
	const insets = useSafeAreaInsets();

	const [loaded, error] = useFonts({
		FiraSans: FiraSansFont,
	});

	useEffect(() => {
		if (loaded) {
			hideAsync();
		}
	}, [loaded]);

	useEffect(() => {  
	    if (error) {  
	       throw error;  
	    }  
	}, [error]);

	if (!loaded) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<StatusBar barStyle={'dark-content'} />
			<Stack
				screenOptions={{
					statusBarBackgroundColor: COLORS.black,
					headerShown: false,
					contentStyle: {
						paddingTop: insets.top,
						backgroundColor: COLORS.black,
					},
				}}
			>
				<Stack.Screen name={'index'} />
				<Stack.Screen
					name={'restore'}
					options={{
						presentation: 'modal',
					}}
				/>
			</Stack>
		</SafeAreaProvider>
	);
}
```

Теперь у нас настроен SplashScreen на всём промежутке начальной загрузки приложения

![](_png/Pasted%20image%2020250304203258.png)

### Unmatched

Реализуем страницу, которая будет выходить пользователю, если он перешёл на несуществующий экран

За такую страницу отвечает зарезервированное слово `+not-found`

`app / +not-found.tsx`
```TSX
import { Stack, Unmatched } from 'expo-router';

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: 'Oops!' }} />
			<Unmatched />
		</>
	);
}
```

![](_png/Pasted%20image%2020250304203958.png)

### Страница ошибки

Создадим компонент кастомной ссылки, который мы смэтчим с дизайном

`shared / ui / CustomLink / CustomLink.tsx`
```TSX
import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { LinkProps } from 'expo-router/build/link/Link';
import { COLORS, FONTS } from '@/shared/const';

export const CustomLink = ({ text, ...props }: LinkProps & { text: string }) => {
	return (
		<Link style={styles.link} {...props}>
			<Text>{text}</Text>
		</Link>
	);
};

const styles = StyleSheet.create({
	link: {
		fontSize: FONTS.f18,
		color: COLORS.link,
		fontFamily: FONTS.regular,
	},
});
```

Далее добавим нашу кастомную ссылку на страницу логина

`app / index.tsx`
```TSX
<CustomLink href={'/restore'} text="Восстановить пароль" />
```

Добавляем вёрстку страницы `nnot-found` а так же добавляем сюда вьюшку безопасной зоны для клика

Тут мы используем `SafeAreaView` вместо обычного `View`, чтобы не пользоваться хуком `useSafeAreaInsets`, который иногда может сбоить. `SafeAreaView` позволяет персонально в каждом компоненте воспользоваться встроенными отступами с безопасной зоной

`app / [...unmathed].tsx`
```TSX
import { Image, StyleSheet, Text, View } from 'react-native';
import { CustomLink } from '@/shared/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAPS } from '@/shared/const';
import UnmatchedIcon from '@/shared/assets/images/unmatched.png';

export default function UnmatchedCustom() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Image style={styles.image} source={UnmatchedIcon} resizeMode='contain' />
				<Text style={styles.text}>
					Ооо... что-то пошло не так. Попробуйте вернуться на главный экран приложения
				</Text>
				<CustomLink href={'/'} text='На главный экран' />
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
		gap: GAPS.g50,
	},
	image: {
		width: 204,
		height: 282,
	},
	text: {
		color: COLORS.white,
		fontSize: FONTS.f18,
		textAlign: 'center',
		fontFamily: FONTS.regular,
	},
});
```

Теперь у нас имеется полноценная своя страница ненайденных вещей

![](_png/Pasted%20image%2020250304205216.png)

### Route параметры

Роуты с параметрами пишутся ровно так же, как и в NextJS. Параметры передаются в квадратных скобках `[]`

Получить доступ к параметру мы можем через хук `useLocalSearchParams` из `expo-router`. Он берёт локальные параметры, которые доступны для компонента и обновляется только тогда, когда они поменялись для этого компонента.

Так же существует ещё и `useGlobalSearchParams`, который применяется при изменении глобальных параметров. Он уже может вызывать множество ререндеров, так как обновляется постоянно при изменении любого параметра.

`app / course / [alias].tsx`
```TSX
import { Text } from 'react-native';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS } from '@/shared/const';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Courses() {
	const { alias } = useLocalSearchParams<{ alias: string }>();

	return (
		<SafeAreaView>
			<Text style={{ 
				fontSize: FONTS.f21, 
				color: COLORS.white 
			}}>
				{alias}
			</Text>
		</SafeAreaView>
	);
}
```

Для примера заменим ссылку на странице входа и перейдём по ней

`app / login.tsx`
```TSX
<CustomLink
	href={{
		pathname: '/courses/[alias]',
		params: { alias: 'typescript' },
	}}
	text={'typescript'}
/>
<CustomLink href={'/courses/javascript'} text={'javascript'} />
```

![](_png/Pasted%20image%2020250305192812.png)

### Структура проекта

Объединим наши роуты через синтаксис группировки `(alias)`. Это позволит нам поместить в одно место роуты без изменения путей к скринам.

`app / (app) / _layout.tsx`
```TSX
import { Stack } from 'expo-router';

export default function AppLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" />
		</Stack>
	);
}
```

Добавляем страницу моих курсов как основную страницу в приложении

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

Автоматически при вкладывании роута через `app / _layout.tsx` у нас дочерний лейаут будет вкладываться внутрь `_layout.tsx` из более высокого порядка. 

Если `_layout.tsx` находятся относительно другого лейаута в группе `(alias) / _layoyt.tsx`, то такие лейауты не будут вкладываться друг в друга. Они будут заменять друг друга и приоритет будет иметь тот лейаут, который находится внутри группы. Таким образом мы можем реализовать разные лейауты для разных групп роутов. 

### Expo router







## Запросы и состояния

#jotai #FSD

### Выбор State Manager

[Jotai](https://jotai.org/) - хорошее и очень простое решение для хранения и управления состоянием. Имеет понятную и короткую документацию с небольшим количеством функционала.

![](_png/Pasted%20image%2020250303190332.png)

### Архитектура проекта

В проекте будет использоваться [FSD](../../Architecture/Dev/FSD.md)

### Первый атом

Устанавливаем `jotai`

```bash
bun i jotai
```

Добавляем интерфейс пользователя

`entities / user / model / user.model.ts`
```TS
export interface User {
	id: number;
	name: string;
	surname?: string;
	photo?: string;
}
```

Добавляем стейт пользователя в атоме. Создать отдельную атомарную единицу стейта можно через `atom`. Для неё опишем состояние `UserState`

`entities / user / model / user.state.ts`
```TS
import { atom } from 'jotai';
import { User } from './user.model';

export interface UserState {
	profile: User | null;
	isLoading: boolean;
	error: string | null;
}

export const profileAtom = atom<UserState>({
	profile: {
		id: 1,
		name: 'Антон',
	},
	isLoading: false,
	error: null,
});
```

Получаем профиль пользователя из атома

`app / (app) / index.tsx`
```TSX
import { useAtom } from 'jotai';
import { View, Text } from 'react-native';
import { COLORS } from '@/shared/tokens';
import { profileAtom } from '@/entities/user';

export default function MyCourses() {
	const [profile] = useAtom(profileAtom);
	
	return (
		<View>
			<Text style={{ color: COLORS.white }}>MyCourses</Text>
			<Text>{profile.profile?.name}</Text>
		</View>
	);
}
```

![](_png/Pasted%20image%2020250311193403.png)

### AsyncStorage

Для поиска подходящей библиотеки под RN можно воспользоваться любым решением из [react-native.directory](https://reactnative.directory/)

Давным давно `AsyncStorage` стал deprecated в RN и вместо него рекоммендуют использовать любое другое коммьюнити хранилище

Установим асинхронное хранилище

```bash
bun i @react-native-async-storage/async-storage
```

Асинхронное хранилище позволяет нам пользоваться некоторым подобием `localStorage` в мобильном приложении, но в рамках мобильного приложения

`AsyncStorage` - это объект, который хранит локально в приложении глобальные значения. Сам он работает подобно синтаксису `localStorage`, но асинхронно:

- `setItem` - установить значение
- `getAllKeys` - получить все ключи
- `getItem` - получить значение по ключу
- `removeItem` - удалить значение из стора

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

И вот такой вывод получим:

```bash
# получили ключ
["demo"]
# получаем значение по ключу
test
# удаляем значение
undefined
# получаем значение по ключу, которое было удалено
null
```

>[!warning] `AsyncStorage` под капотом использует SQLite и:
> - максимально ограничивает вмещаемую текстовую информацию до 6 мегабайт
> - максимальную вместимость значение можно расширить через флаг
> - в хранилище можно помещать только текст (использовать `JSON.stringify` и `parse`)
### atomWithStorage

Теперь нужно реализовать атом, который будет подкреплён к стейту через персистентное хранилище. Это нам нужно будет для того, чтобы сохранять состояние авторизации пользователя

Из `jotai` берём `createJSONStorage`, который позволит создать нам кастомное хранилище данных. Далее берём не просто `atom`, а `atomWithStorage`, который позволит нам для атома задать своё собственное хранилище

`entities / auth / model / auth.state.ts`
```TS
import { createJSONStorage, atomWithStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthState {
	access_token: string | null;
	isLoading: boolean;
	error: string | null;
}

const storage = createJSONStorage<AuthState>(() => AsyncStorage);

export const authAtom = atomWithStorage<AuthState>(
	// ключ, по которому будет сохраняться состояние
	'auth',
	// начальные данные
	{
		access_token: null,
		isLoading: false,
		error: null,
	},
	// сам стор
	storage,
);
```

Далее нужно будет сделать запрос на сервер, чтобы получать данные по клиенту

### Запросы на сервер

Установим библиотеку для работы с запросами

```bash
npm i axios
```

Опишем интерфейс ответа на запрос

`entities / auth / model / auth.intefaces.ts`
```TS
export interface IAuthResponse {
	accessToken: string;
}
```

Укажем пути до рестов `api` в сущности авторизации

`entities / auth / api / api.ts`
```TS
export const PREFIX = 'https://purpleschool.ru/api-v2';
export const API = {
	login: `${PREFIX}/auth/login`,
};
```

Вставим запрос на авторизацию, откуда получим токен. Вставить сюда можно свои реальные данные для входа в [app.purpleschool.ru](https://app.purpleschool.ru)

`app / (app) / index.tsx`
```TSX
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';
import { useAtom } from 'jotai';

import { profileAtom } from '@/entities/user';
import { API, IAuthResponse } from '@/entities/auth';

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

Дальше нам стоит добавить запрос с сам стейт

### Запросы в State - Вход и Выход

Опишем интерфейсы модули авторизации. На запрос мы должны отправлять почту и пароль, а в ответе получать токен доступа

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

В состояние авторизации добавим

`entities / auth / model / auth.state.ts`
```TSX
import { createJSONStorage, atomWithStorage } from 'jotai/utils';  
import AsyncStorage from '@react-native-async-storage/async-storage';  
import { atom } from 'jotai';  
import { AuthResponse, LoginRequest } from './auth.intefaces';  
import axios, { AxiosError } from 'axios';  
import { API } from '../api/api';  
  
export interface AuthState {  
    access_token: string | null;  
    isLoading: boolean;  
    error: string | null;  
}  
  
const storage = createJSONStorage<AuthState>(() => AsyncStorage);  
  
const INITIAL_STATE: AuthState = {  
    access_token: null,  
    isLoading: false,  
    error: null,  
};  
  
export const authAtom = atomWithStorage<AuthState>('auth', INITIAL_STATE, storage);  

// этот атом будет стирать токен из приложения и разлогинивать нас
// тут уже хук вернёт первым параметром ничего, а вторым функцию разлогина 
export const logoutAtom = atom(null, (_get, set) => {  
    set(authAtom, INITIAL_STATE);  
});  

// атом авторизации
export const loginAtom = atom(
	// первым параметром мы передаём функцию-геттер наших данных по состояния
	// первым параметром из хука этот атом будет возвращать данные по авторизации
    (get) => get(authAtom),  
    // вторым параметром мы передадим функцию-сеттер данных в наш стейт
    // этот метод вернёт хук для совершения авторизации
    async (_get, set, { email, password }: LoginRequest) => {  
       set(authAtom, {  
          ...INITIAL_STATE,  
          isLoading: true,  
       });  
       try {  
          const { data } = await axios.post<AuthResponse>(API.login, {  
             email,  
             password,  
          });  
          set(authAtom, {  
             ...INITIAL_STATE,  
             access_token: data.access_token,  
          });  
       } catch (error) {  
          if (error instanceof AxiosError) {  
             set(authAtom, {  
                ...INITIAL_STATE,  
                error: error.response?.data.message,  
             });  
          }  
       }  
    },  
);
```

И добавим вызов метода `loginAtom` через `useAtom` (где вторым аргументом будет функция для запроса данных, подвязанная под стейт), чтобы получить `access_token` из `auth`

Логаут мы можем организовать через `useSetAtom`, который не будет возвращать `get` (то есть текущий стейт), а отдаст только функцию-сеттер

`app / (app) / index.tsx`
```TSX
import { useAtom } from 'jotai';
import { View, Text } from 'react-native';
import { logoutAtom, loginAtom } from '@/entities/auth';
import { useEffect } from 'react';

export default function MyCourses() {
	const [auth, login] = useAtom(loginAtom);
	const logout = useSetAtom(logoutAtom);

	useEffect(() => {
		login({ 
			email: 'vasia@pupkin.ru', 
			password: '12345678' 
		})
			.then(logout);
	}, []);

	return (
		<View>
			<Text>{auth?.access_token}</Text>
		</View>
	);
}
```

### Программный редирект

Если пользователь перешёл на любую другую страницу кроме логина и у него нет `access_token`, то нам нужно его переадресовать обратно на логин

Для реализации этой задачи нам помогут: 
- `useRootNavigationState`, который вернёт состояние навигации пользователя 
- `useAtomValue`, который вернёт только стейт (данные из функции-геттера)
- объект `router`, который работает как обычный браузерный роутер

`app / (app) / index.tsx`
```TSX
import { useAtomValue } from 'jotai';
import { View, Text } from 'react-native';
import { authAtom } from '../../entities/auth/model/auth.state';
import { useEffect } from 'react';
import { router, useRootNavigationState } from 'expo-router';

export default function MyCourses() {
	// получили только данные из стейта
	const { access_token } = useAtomValue(authAtom);
	// получили состояние текущего роутинга
	const state = useRootNavigationState();

	useEffect(() => {
		// если роутер не проинициализирован
		if (!state?.key) return;
		// если токена нет, то возвращаемся на логин
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

Это программный редирект, который мы можем выполнять для перемещения пользователя по приложению. Проверку токена лучше выполнять лейауте, чтобы каждый раз проверять наличие токена или проверять факт того, что сессия не протухла. 

### Redirect компонент

Сделаем более валидный редирект не из компонента, а из `_layout`, который будет постоянно отслеживать наличие токена. Таким образом мы обезопасим сильнее наше приложение и не нужно будет костыльно проверять наличие токена роутера.

Чистим компонент, куда мы добавили старый редирект

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

И переносим логику редиректа в лейаут. Тут мы так же получаем значение токена из атома, но выполняем редирект лейаут-компонентом `Redirect`, который выполнит редирект органичнее в рамках нашего приложения

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

Такой способ имеет лучший отклик в рамках приложения, так как у нас не будет мерцаний и предзагрузки основной страницы. Тут мы сразу отследим наличие токена авторизации и сразу полетим до загрузки страницы на другой экран.

### Реализация логина

Добавляем кнопку выхода на главный экран

`app/(app)/index.tsx`
```TSX
import { View, Text } from 'react-native';
import { Button } from '@/shared/ui';
import { useSetAtom } from 'jotai';
import { logoutAtom } from '@/entities/auth';

export default function MyCourses() {
	const logout = useSetAtom(logoutAtom);
	return (
		<View>
			<Text>index</Text>
			<Button text="Выход" onPress={logout} />
		</View>
	);
}
```

И на страницу логина добавляем наш хук авторизации. Тут мы должны будем собирать сами данные с нашей формы и переводить инпуты в контролируемые. 

Сохранять данные из инпутов в RN проще, так как нам не нужно отслеживать ивенты и нам всего лишь достаточно передать в пропс `onChangeText` функцию-сеттер из `useState`

`app / login.tsx`
```TSX
import { StyleSheet, View, Image } from 'react-native';
import { Input } from '../shared/Input/Input';
import { Colors, Gaps } from '../shared/tokens';
import { Button } from '../shared/Button/Button';
import { ErrorNotification } from '../shared/ErrorNotification/ErrorNotification';
import { useEffect, useState } from 'react';
import { CustomLink } from '../shared/CustomLink/CustomLink';
import { useAtom } from 'jotai';
import { loginAtom } from '../entities/auth/model/auth.state';
import { router } from 'expo-router';

export default function Login() {
	const [localError, setLocalError] = useState<string | undefined>();
	const [email, setEmail] = useState<string>();
	const [password, setPassword] = useState<string>();
	const [{ access_token, isLoading, error }, login] = useAtom(loginAtom);

	const submit = () => {
		if (!email) return setLocalError('Не введён email');
		if (!password) return setLocalError('Не введён пароль');
		login({ email, password });
	};

	// выводим ошибку из запроса
	useEffect(() => {
		if (error) {
			setLocalError(error);
		}
	}, [error]);

	// редирект при успешном входе
	useEffect(() => {
		if (access_token) {
			router.replace('/(app)');
		}
	}, [access_token]);

	return (
		<View style={styles.container}>
			<ErrorNotification error={localError} />
			<View style={styles.content}>
				<Image style={styles.logo} source={require('../assets/logo.png')} resizeMode="contain" />
				<View style={styles.form}>
					<Input placeholder="Email" onChangeText={setEmail} />
					<Input isPassword placeholder="Пароль" onChangeText={setPassword} />
					<Button text="Войти" onPress={submit} />
				</View>
				<CustomLink href={'/course/typescript'} text="Восстановить пароль" />
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

И теперь бэк полностью отрабатывает наши запросы на авторизацию

![](_png/Pasted%20image%2020250313201927.png)

Теперь у нас есть рабочий редирект после получения токена доступа

![](_png/Pasted%20image%2020250313205529.png)

### ActivityIndicator

Добавим фейковую задержку в авторизацию, чтобы увидеть спиннер индикатора

`entities / auth / model / auth.state.ts`
```TS
export const loginAtom = atom(
	(get) => get(authAtom),
	async (_get, set, { email, password }: LoginRequest) => {
		set(authAtom, {
			isLoading: true,
			access_token: null,
			error: null,
		});
		try {
			/** фейковая задержка, чтобы увидеть загрузку */
			await new Promise<void>((resolve) =>
				setTimeout(() => {
					resolve();
				}, 2000),
			);
			
			const { data } = await axios.post<AuthResponse>(API.login, {  
			    email,  
			    password,  
			});  
			set(authAtom, {  
			    ...INITIAL_STATE,  
			    access_token: data.accessToken,  
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
```

Далее нам нужно добавить в кнопку обработку пропса `isLoading` через который мы будем показывать нативный компонент реакта `ActivityIndicator`, что отобразит нам загрузку

`shared / ui / Button / Button.tsx`
```TSX
import {  
    ActivityIndicator,  
    Animated,  
    ButtonProps,  
    GestureResponderEvent,  
    Pressable,  
    PressableProps,  
    StyleSheet,  
    Text,  
} from 'react-native';  
import { COLORS, FONTS, RADIUS } from '../../../const';  
  
export interface IButtonProps extends PressableProps, Pick<ButtonProps, 'title'> {  
    text?: string;  
    isLoading?: boolean;  
}  
  
export function Button({ title, text, onPressIn, onPressOut, isLoading = false, ...props }: IButtonProps) {  
    const animatedValue = new Animated.Value(100);  
    const color = animatedValue.interpolate({  
       inputRange: [0, 100],  
       outputRange: [COLORS.primaryHover, COLORS.primary],  
    });  
  
    const handleAnimate = (value: number) => {  
       Animated.timing(animatedValue, {  
          useNativeDriver: true,  
          duration: 100,  
          toValue: value,  
       }).start();  
    };  
  
    const handleOnPressIn = (e: GestureResponderEvent) => {  
       handleAnimate(0);  
       onPressIn?.(e);  
    };  
  
    const handleOnPressOut = (e: GestureResponderEvent) => {  
       handleAnimate(100);  
       onPressOut?.(e);  
    };  
  
    return (  
       <Pressable {...props} onPressIn={handleOnPressIn} onPressOut={handleOnPressOut}>  
          <Animated.View  
             style={{  
                ...styles.button,  
                backgroundColor: color,  
             }}  
          >  
             {!isLoading && <Text style={styles.text}>{title ?? text}</Text>}  
             {isLoading && <ActivityIndicator size={'large'} color={COLORS.white} />}  
          </Animated.View>  
       </Pressable>  
    );  
}
```

И теперь добавляем состояние загрузки запроса в саму кнопку на странице авторизации

`app / login.tsx`
```TSX
const [{ access_token, isLoading, error }, login] = useAtom(loginAtom);

return (
		<View style={styles.container}>
			<ErrorNotification error={localError} />
			<View style={styles.content}>
				<Image style={styles.logo} source={require('../assets/logo.png')} resizeMode="contain" />
				<View style={styles.form}>
					<Input placeholder="Email" onChangeText={setEmail} />
					<Input isPassword placeholder="Пароль" onChangeText={setPassword} />
					<Button text="Войти" onPress={submit} />
					<Button text="Войти" onPress={submit} isLoading={isLoading} />
				</View>
				<CustomLink href={'/course/typescript'} text="Восстановить пароль" />
				<CustomLink href={'/restore'} text="Восстановить пароль" />
			</View>
		</View>
	);
```

Теперь в кнопке появился лоадер

![](_png/Pasted%20image%2020250313202350.png)

## Боковая панель

### Drawer Layout

Полная установка [Drawer](https://docs.expo.dev/router/advanced/drawer/) уже описана в документации expo. Это нужно просто повторить, чтобы выполнить операцию.

```bash
npx expo install @react-navigation/drawer react-native-gesture-handler react-native-reanimated
```

`'expo-router/babel` не нужен в expo SDK выше 50 версии, а плагин `'react-native-reanimated/plugin'` установить нам будет нужно

`babel.config.js`
```JS
module.exports = function (api) {  
    api.cache(true);  
    return {  
       presets: ['babel-preset-expo'],  
       plugins: ['react-native-reanimated/plugin'],  
    };  
};
```

И далее добавляем в лейауте авторизованного приложения дефолтный `Drawer`

`app / (app) / _layout.tsx`
```TSX
import { Redirect, Stack } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useAtomValue } from 'jotai';
import { authAtom } from '@/entities/auth';

export default function AppRayout() {
	const { access_token } = useAtomValue(authAtom);
	if (!access_token) {
		return <Redirect href="/login" />;
	}

	return (
		<Drawer>
			<Drawer.Screen name="index" />
		</Drawer>
	);
}
```

Теперь у нас появился дефолтный дровер в приложении

![](_png/Pasted%20image%2020250313210028.png)

### Стилизация панели

Добавляем новую иконку

`assets/icons/menu.tsx`
```TSX
import * as React from 'react';
import Svg, { Rect } from 'react-native-svg';
const MenuIcon = () => (
	<Svg width={26} height={24} fill="none">
		<Rect width={10} height={1.65} x={4.96} y={4} fill="#AFB2BF" rx={0.825} />
		<Rect width={16} height={1.65} x={4.96} y={8.65} fill="#AFB2BF" rx={0.825} />
		<Rect width={12} height={1.65} x={4.96} y={13.3} fill="#AFB2BF" rx={0.825} />
		<Rect width={16} height={1.65} x={4.96} y={17.95} fill="#AFB2BF" rx={0.825} />
	</Svg>
);
export default MenuIcon;
```

Добавляем в токен новый цвет и размер шрифта

```TS
export const Colors = {
	black: '#16171D',
	blackLight: '#1E1F29',
	gray: '#AFB2BF',
	violetDark: '#2E2D3D',
	primary: '#6C38CC',
	primaryHover: '#452481',
	link: '#A97BFF',
	white: '#FAFAFA',
	red: '#CC384E',
};

export const Fonts = {
	f16: 16,
	f18: 18,
	f20: 20,
	regular: 'FiraSans',
	semibold: 'FiraSansSemiBold',
};
```

Стилизуем сам Drawer

`app/(app)/_layout.tsx`
```TSX
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useAtomValue } from 'jotai';
import { authAtom } from '../../entities/auth/model/auth.state';
import { Colors, Fonts } from '../../shared/tokens';
import { Text } from 'react-native';

export default function AppRayout() {
	const { access_token } = useAtomValue(authAtom);
	if (!access_token) {
		return <Redirect href="/login" />;
	}

	return (
		<Drawer
			screenOptions={({ navigation }) => ({
				headerStyle: {
					backgroundColor: Colors.blackLight,
					shadowColor: Colors.blackLight,
					shadowOpacity: 0,
				},
				headerLeft: () => {
					return <Text>!</Text>;
				},
				headerTitleStyle: {
					color: Colors.white,
					fontFamily: 'FiraSans',
					fontSize: Fonts.f20,
				},
				headerTitleAlign: 'center',
				sceneContainerStyle: {
					backgroundColor: Colors.black,
				},
			})}
		>
			<Drawer.Screen
				name="index"
				options={{
					title: 'Мои курсы',
				}}
			/>
		</Drawer>
	);
}
```





### Кнопка открытия

Добавляем фичу, которая будет выполнять действие закрытия бокового дровера

`features/layout/ui/MenuButton/MenuButton.tsx`
```TSX
import { View, Pressable, PressableProps, StyleSheet } from 'react-native';
import MenuIcon from '../../../../assets/icons/menu';
import { useState } from 'react';
import { Colors } from '../../../../shared/tokens';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MenuButton({ navigation, ...props }: PressableProps & { navigation: any }) {
	const [clicked, setClicked] = useState<boolean>(false);

	return (
		<Pressable
			{...props}
			onPressIn={() => setClicked(true)}
			onPressOut={() => setClicked(false)}
			onPress={() => navigation.toggleDrawer()}
		>
			<View
				style={{
					...styles.button,
					backgroundColor: clicked ? Colors.violetDark : Colors.blackLight,
				}}
			>
				<MenuIcon />
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
		flex: 1,
	},
});
```

Добавляем в лейаут саму кастомную кнопку открытия

`app/(app)/_layout.tsx`
```TSX
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useAtomValue } from 'jotai';
import { authAtom } from '../../entities/auth/model/auth.state';
import { Colors, Fonts } from '../../shared/tokens';
import { MenuButton } from '../../features/layout/ui/MenuButton/MenuButton';

export default function AppRayout() {
	const { access_token } = useAtomValue(authAtom);
	if (!access_token) {
		return <Redirect href="/login" />;
	}

	return (
		<Drawer
			screenOptions={({ navigation }) => ({
				headerStyle: {
					backgroundColor: Colors.blackLight,
					shadowColor: Colors.blackLight,
					shadowOpacity: 0,
				},
				headerLeft: () => {
					return <MenuButton navigation={navigation} />;
				},
```






### Кастомный Drawer



`entities/layout/ui/CustomDrawer/CustomDrawer.tsx`
```TSX
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../../../shared/tokens';
import { CustomLink } from '../../../../shared/CustomLink/CustomLink';
export function CustomDrawer(props: DrawerContentComponentProps) {
	return (
		<DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
			<View>
				<Text>Текст</Text>
			</View>
			<View>
				<CustomLink text="Выход" href={'/login'} />
				<Image source={require('../../../../assets/logo.png')} resizeMode="contain" />
			</View>
		</DrawerContentScrollView>
	);
}
const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		backgroundColor: Colors.black,
	},
});
```

Добавляем в лейаут наш кастомный контент дровера

`app/(app)/_layout.tsx`
```TSX
import { CustomDrawer } from '../../entities/layout/ui/CustomDrawer/CustomDrawer';

export default function AppRayout() {
	const { access_token } = useAtomValue(authAtom);
	if (!access_token) {
		return <Redirect href="/login" />;
	}

	return (
		<Drawer
			drawerContent={(props) => <CustomDrawer {...props} />}
			screenOptions={({ navigation }) => ({
```




### Стилизация Drawer

Добавляем иконку закрытия

`assets/icons/close.tsx`
```TSX
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
const CloseIcon = () => (
	<Svg width={24} height={24} fill="none">
		<Path stroke="#AFB2BF" strokeLinecap="round" strokeWidth={1.5} d="M19 5 5 19M5 5l14 14" />
	</Svg>
);
export default CloseIcon;
```

И фичу закрытия дровера

`features/layout/ui/CloseDrawer/CloseDrawer.tsx`
```TSX
import { View, Pressable, StyleSheet } from 'react-native';
import CloseIcon from '../../../../assets/icons/close';
import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types';

export function CloseDrawer(navigation: DrawerNavigationHelpers) {
	return (
		<Pressable onPress={() => navigation.closeDrawer()}>
			<View style={styles.button}>
				<CloseIcon />
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		top: 20,
		right: 20,
	},
});
```

И завершаем кастомный дровер, добавив в него возможность выйти из приложения и из дровера

`entities/layout/ui/CustomDrawer/CustomDrawer.tsx`
```TSX
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../../../shared/tokens';
import { CustomLink } from '../../../../shared/CustomLink/CustomLink';
import { CloseDrawer } from '../../../../features/layout/ui/CloseDrawer/CloseDrawer';
import { useSetAtom } from 'jotai';
import { logoutAtom } from '../../../auth/model/auth.state';

export function CustomDrawer(props: DrawerContentComponentProps) {
	const logout = useSetAtom(logoutAtom);
	return (
		<DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
			<View>
			<View style={styles.content}>
				<CloseDrawer {...props.navigation} />
				<Text>Текст</Text>
			</View>
			<View>
				<CustomLink text="Выход" href={'/login'} />
				<Image source={require('../../../../assets/logo.png')} resizeMode="contain" />
			<View style={styles.footer}>
				<CustomLink text="Выход" onPress={() => logout()} href={'/login'} />
				<Image
					style={styles.logo}
					source={require('../../../../assets/logo.png')}
					resizeMode="contain"
				/>
			</View>
		</DrawerContentScrollView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		backgroundColor: Colors.black,
	},
	content: {
		flex: 1,
	},
	footer: {
		gap: 50,
		alignItems: 'center',
		marginBottom: 40,
	},
	logo: {
		width: 160,
	},
});
```




### Получение данных профиля



`shared/api.ts`
```TS
export const PREFIX = 'https://purpleschool.ru/api-v2';
```


`entities/user/api/api.ts`
```TS
import { PREFIX } from '../../../shared/api';

export const API = {
	profile: `${PREFIX}/user/profile`,
};
```



`entities/auth/api/api.ts`
```TSX
import { PREFIX } from '../../../shared/api';

export const API = {
	login: `${PREFIX}/auth/login`,
};
```

Добавляем атом загрузки профиля пользователя `loadProfileAtom`

`entities/user/model/user.state.ts`
```TSX
import { atom } from 'jotai';
import { User } from './user.model';
import { authAtom } from '../../auth/model/auth.state';
import axios, { AxiosError } from 'axios';
import { API } from '../api/api';

export const profileAtom = atom<UserState>({
	profile: null,
	isLoading: false,
	error: null,
});

export const loadProfileAtom = atom(
	async (get) => {
		return get(profileAtom);
	},
	async (get, set) => {
		const { access_token } = await get(authAtom);
		set(profileAtom, {
			isLoading: true,
			profile: null,
			error: null,
		});
		try {
			const { data } = await axios.get<User>(API.profile, {
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			});
			set(profileAtom, {
				isLoading: false,
				profile: data,
				error: null,
			});
		} catch (error) {
			if (error instanceof AxiosError) {
				set(profileAtom, {
					isLoading: false,
					profile: null,
					error: error.response?.data.message,
				});
			}
		}
	},
);

export interface UserState {
	profile: User | null;
	isLoading: boolean;
	error: string | null;
}
```

Добавляем загрузку профиля `loadProfileAtom` и выводим имя пользователя

`entities/layout/ui/CustomDrawer/CustomDrawer.tsx`
```TSX
import { CloseDrawer } from '../../../../features/layout/ui/CloseDrawer/CloseDrawer';
import { useAtom, useSetAtom } from 'jotai';
import { logoutAtom } from '../../../auth/model/auth.state';
import { loadProfileAtom } from '../../../user/model/user.state';
import { useEffect } from 'react';

export function CustomDrawer(props: DrawerContentComponentProps) {
	const logout = useSetAtom(logoutAtom);
	const [profile, loadProfile] = useAtom(loadProfileAtom);
	useEffect(() => {
		loadProfile();
	}, []);

	return (
		<DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
			<View style={styles.content}>
				<CloseDrawer {...props.navigation} />
				<Text>{profile.profile?.name}</Text>
			</View>
```


### Компонент пользователя

Добавляем иконку аватара `assets/images/avatar.png`

![](_png/Pasted%20image%2020250217182526.png)



`entities/user/ui/UserMenu/UserMenu.tsx`
```TSX
import { View, Image, StyleSheet, Text } from 'react-native';
import { User } from '../../model/user.model';
import { Colors, Fonts, Gaps } from '../../../../shared/tokens';
export function UserMenu({ user }: { user: User | null }) {
	if (!user) {
		return;
	}
	return (
		<View style={styles.container}>
			{user.photo ? (
				<Image
					style={styles.image}
					source={{
						uri: user.photo,
					}}
				/>
			) : (
				<Image source={require('../../../../assets/images/avatar.png')} />
			)}
			<Text style={styles.name}>
				{user.name} {user.surname}
			</Text>
		</View>
	);
}
const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		gap: Gaps.g8,
		marginTop: 30,
	},
	image: {
		width: 70,
		height: 70,
		borderRadius: 35,
	},
	name: {
		fontSize: Fonts.f16,
		fontFamily: Fonts.regular,
		color: Colors.white,
	},
});
```

Прокидываем пользователя в наш компонент `UserMenu`

`entities/layout/ui/CustomDrawer/CustomDrawer.tsx`
```TSX
import { UserMenu } from '../../../user/ui/UserMenu/UserMenu';

export function CustomDrawer(props: DrawerContentComponentProps) {
	const logout = useSetAtom(logoutAtom);
	const [profile, loadProfile] = useAtom(loadProfileAtom);

	useEffect(() => {
		loadProfile();
	}, []);

	return (
		<DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
			<View style={styles.content}>
				<CloseDrawer {...props.navigation} />
				<UserMenu user={profile.profile} />
			</View>
```



### Компонент меню


`assets/menu/profile.tsx`
```TSX
import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
const ProfileIcon = () => (
	<Svg width={24} height={24} fill="none">
		<Circle cx={12} cy={7} r={4.25} stroke="#AFB2BF" strokeWidth={1.5} />
		<Path
			stroke="#AFB2BF"
			strokeWidth={1.5}
			d="m7.118 15.288.638-.299a10 10 0 0 1 8.488 0l.638.3A5.418 5.418 0 0 1 20 20.193c0 .997-.809 1.806-1.806 1.806H5.806A1.806 1.806 0 0 1 4 20.194a5.418 5.418 0 0 1 3.118-4.906Z"
		/>
	</Svg>
);
export default ProfileIcon;
```



`assets/menu/courses.tsx`
```TSX
import * as React from 'react';
import Svg, { G, Path, Defs, ClipPath } from 'react-native-svg';
const CoursesIcon = () => (
	<Svg width={24} height={24} fill="none">
		<G clipPath="url(#a)">
			<Path
				stroke="#AFB2BF"
				strokeWidth={1.5}
				d="m4.65 11.294 5.374 2.874a4 4 0 0 0 3.773 0l5.373-2.874m-14.52 0L1.948 9.478C.653 8.61.805 6.661 2.219 6.004l7.599-3.531a5 5 0 0 1 4.19-.011l7.69 3.525c1.433.656 1.579 2.634.258 3.494l-2.785 1.813m-14.52 0v5.713c0 .523.203 1.026.607 1.36C6.358 19.272 8.852 21 11.91 21c3.058 0 5.553-1.727 6.653-2.634.403-.333.607-.835.607-1.359v-5.713"
			/>
			<Path stroke="#AFB2BF" d="M22 10v5" />
			<Path
				fill="#AFB2BF"
				d="m22.861 17.023-.368-2.148c-.095-.554-.89-.554-.986 0l-.368 2.148a4 4 0 0 0 .053 1.61l.322 1.341c.123.511.85.511.972 0l.322-1.341a4 4 0 0 0 .053-1.61Z"
			/>
		</G>
		<Defs>
			<ClipPath id="a">
				<Path fill="#fff" d="M0 0h24v24H0z" />
			</ClipPath>
		</Defs>
	</Svg>
);
export default CoursesIcon;
```



`entities/layout/ui/MenuItem/MenuItem.tsx`
```TSX
import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types';
import { ReactNode, useState } from 'react';
import { Pressable, PressableProps, Text, View } from 'react-native';
interface MenuItemProps {
	navigation: DrawerNavigationHelpers;
	icon: ReactNode;
	text: string;
	path: string;
}
export function MenuItem({
	navigation,
	icon,
	text,
	path,
	...props
}: MenuItemProps & PressableProps) {
	const [clicked, setClicked] = useState<boolean>(false);
	return (
		<Pressable
			{...props}
			onPress={() => navigation.navigate(path)}
			onPressIn={() => setClicked(true)}
			onPressOut={() => setClicked(false)}
		>
			<View>
				{icon}
				<Text>{text}</Text>
			</View>
		</Pressable>
	);
}
```



`entities/layout/ui/CustomDrawer/CustomDrawer.tsx`
```TSX
import CoursesIcon from '../../../../assets/menu/courses';
import ProfileIcon from '../../../../assets/menu/profile';
import { MenuItem } from '../MenuItem/MenuItem';
const MENU = [
	{ text: 'Курсы', icon: <CoursesIcon />, path: '/(app)' },
	{ text: 'Профиль', icon: <ProfileIcon />, path: '/profile' },
];

export function CustomDrawer(props: DrawerContentComponentProps) {
	const logout = useSetAtom(logoutAtom);
	const [profile, loadProfile] = useAtom(loadProfileAtom);

	useEffect(() => {
		loadProfile();
	}, []);

	return (
		<DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
			<View style={styles.content}>
				<CloseDrawer {...props.navigation} />
				<UserMenu user={profile.profile} />
				{MENU.map((menu) => (
					<MenuItem key={menu.path} {...menu} navigation={props.navigation} />
				))}
			</View>
			<View style={styles.footer}>
				<CustomLink text="Выход" onPress={() => logout()} href={'/login'} />
				<Image
					style={styles.logo}
					source={require('../../../../assets/logo.png')}
					resizeMode="contain"
				/>
			</View>
		</DrawerContentScrollView>
	);
}
```





### Навигация



`entities/user/ui/UserMenu/UserMenu.tsx`
```TSX
const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		gap: Gaps.g8,
		marginTop: 30,
		marginBottom: 40,
	},
```


`app/(app)/profile.tsx`
```TSX
import { View, Text } from 'react-native';
export default function Profile() {
	return (
		<View>
			<Text>Profile</Text>
		</View>
	);
}
```



`app/(app)/_layout.tsx`
```TSX
>
	<Drawer.Screen
		name="index"
		options={{
			title: 'Мои курсы',
		}}
	/>
	<Drawer.Screen
		name="profile"
		options={{
			title: 'Профиль',
		}}
	/>
</Drawer>
```



`entities/layout/ui/MenuItem/MenuItem.tsx`
```TSX
import { DrawerContentComponentProps } from '@react-navigation/drawer/lib/typescript/src/types';
import { ReactNode, useState } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Gaps } from '../../../../shared/tokens';

interface MenuItemProps {
	drawer: DrawerContentComponentProps;
	icon: ReactNode;
	text: string;
	path: string;
}

export function MenuItem({ drawer, icon, text, path, ...props }: MenuItemProps & PressableProps) {
	const [clicked, setClicked] = useState<boolean>(false);
	const isActive = drawer.state.routes[drawer.state.index].name === path;

	return (
		<Pressable
			{...props}
			onPress={() => drawer.navigation.navigate(path)}
			onPressIn={() => setClicked(true)}
			onPressOut={() => setClicked(false)}
		>
			<View
				style={{
					...styles.menu,
					borderColor: isActive ? Colors.primary : Colors.black,
					backgroundColor: clicked || isActive ? Colors.violetDark : Colors.black,
				}}
			>
				{icon}
				<Text style={styles.text}>{text}</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	menu: {
		flexDirection: 'row',
		gap: Gaps.g20,
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderRightWidth: 5,
		alignItems: 'center',
	},
	text: {
		color: Colors.white,
		fontSize: Fonts.f16,
		fontFamily: Fonts.regular,
	},
});
```

И сейчас добавляем пути в нашем приложени через мапу

`entities/layout/ui/CustomDrawer/CustomDrawer.tsx`
```TSX
const MENU = [
	{ text: 'Курсы', icon: <CoursesIcon />, path: 'index' },
	{ text: 'Профиль', icon: <ProfileIcon />, path: 'profile' },
];

export function CustomDrawer(props: DrawerContentComponentProps) {
	const logout = useSetAtom(logoutAtom);
	const [profile, loadProfile] = useAtom(loadProfileAtom);

	useEffect(() => {
		loadProfile();
	}, []);

	return (
		<DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
			<View style={styles.content}>
				<CloseDrawer {...props.navigation} />
				<UserMenu user={profile.profile} />
				{MENU.map((menu) => (
					<MenuItem key={menu.path} {...menu} navigation={props.navigation} />
					<MenuItem key={menu.path} {...menu} drawer={props} />
				))}
			</View>
```





## Нативные возможности

### Обновление Expo



```bash
npm i expo@latest
```

И вырезаем `expo-router/babel`, так как теперь для роутера он не нужен

`babel.config.js`
```TS
module.exports = function (api) {
	api.cache(true);
	return {
		presets: ['babel-preset-expo'],
-		plugins: ['expo-router/babel', 'react-native-reanimated/plugin'],
+		plugins: ['react-native-reanimated/plugin'],
	};
};
```

Все ошибки обновлений будут выходить на экран устройства и то, что придётся нам обновить - поменяем. 

Менять версию сразу всех пакетов не стоит, так как не всё может быть совместимо

![](_png/Pasted%20image%2020250217185307.png)

### Рефакторинг приложения

Переместим `CustomDrawer` в виджеты

Далее добавим плагин шрифтов в конфиг приложения

`app.json`
```JSON
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
  ]
  
],
```

Тут нужно поменять названия шрифтов на оригинальные из файлов

`shared/tokens.ts`
```TS
export const Fonts = {
	f16: 16,
	f18: 18,
	f20: 20,
	// regular: 'FiraSans',
	// semibold: 'FiraSansSemiBold',
	regular: 'FiraSans-Regular',
	semibold: 'FiraSans-SemiBold',
};
```

Добавляем имена шрифтов в ключи `useFonts`

`app/_layout.tsx`
```TSX
const [loaded, error] = useFonts({
		//FiraSans: require('../assets/fonts/FiraSans-Regular.ttf'),
		//FiraSansSemiBold: require('../assets/fonts/FiraSans-SemiBold.ttf'),
		'FiraSans-Regular': require('../assets/fonts/FiraSans-Regular.ttf'),
		'FiraSans-SemiBold': require('../assets/fonts/FiraSans-SemiBold.ttf'),
	});
```

И оборачиваем дровер в хэндлер жестов `GestureHandlerRootView`

`app/(app)/_layout.tsx`
```TSX
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useAtomValue } from 'jotai';
import { authAtom } from '../../entities/auth/model/auth.state';
import { Colors, Fonts } from '../../shared/tokens';
import { MenuButton } from '../../features/layout/ui/MenuButton/MenuButton';
import { CustomDrawer } from '../../widget/layout/ui/CustomDrawer/CustomDrawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function AppRayout() {
	const { access_token } = useAtomValue(authAtom);
	if (!access_token) {
		return <Redirect href="/login" />;
	}

	return (
		<GestureHandlerRootView style={styles.wrapper}>
			<Drawer
				drawerContent={(props) => <CustomDrawer {...props} />}
				screenOptions={({ navigation }) => ({
					headerStyle: {
						backgroundColor: Colors.blackLight,
						shadowColor: Colors.blackLight,
						shadowOpacity: 0,
					},
					headerLeft: () => {
						return <MenuButton navigation={navigation} />;
					},
					headerTitleStyle: {
						color: Colors.white,
						fontFamily: Fonts.regular,
						fontSize: Fonts.f20,
					},
					headerTitleAlign: 'center',
					sceneContainerStyle: {
						backgroundColor: Colors.black,
					},
				})}
			>
				<Drawer.Screen
					name="index"
					options={{
						title: 'Мои курсы',
					}}
				/>
				<Drawer.Screen
					name="profile"
					options={{
						title: 'Профиль',
					}}
				/>
			</Drawer>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
});
```


### ImagePicker



```bash
npm i expo-image-picker
```



`app/(app)/profile.tsx`
```TSX
import { useState } from 'react';
import { View, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../shared/Button/Button';

export default function Profile() {
	const [image, setImage] = useState(null);
	const pickAvatar = async () => {
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});
		console.log(result);
	};
	return (
		<View>
			<Text>Profile</Text>
			<Button text="Выбрать изображение" onPress={pickAvatar} />
		</View>
	);
}
```



### Permissions



`app/(app)/profile.tsx`
```TSX
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import {
	launchCameraAsync,
	MediaTypeOptions,
	useCameraPermissions,
	PermissionStatus,
} from 'expo-image-picker';
import { Button } from '../../shared/Button/Button';

export default function Profile() {
	const [image, setImage] = useState(null);
	const [cameraPermissions, requestCameraPermission] = useCameraPermissions();

	const varifyCameraPermissions = async () => {
		if (cameraPermissions?.status === PermissionStatus.UNDETERMINED) {
			const res = await requestCameraPermission();
			return res.granted;
		}
		if (cameraPermissions?.status === PermissionStatus.DENIED) {
			Alert.alert('Недостаточно прав для доступа к камере');
			return false;
		}
		return true;
	};

	const pickAvatar = async () => {
		const isPermissionGranted = await varifyCameraPermissions();
		if (!isPermissionGranted) {
			return;
		}
		const result = await launchCameraAsync({
			mediaTypes: MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});
		console.log(result);
	};

	return (
		<View>
			<Text>Profile</Text>
			<Button text="Выбрать изображение" onPress={pickAvatar} />
		</View>
	);
}
```



### Отображение изображения


`app/(app)/profile.tsx`
```TSX
import { useState } from 'react';
import { View, Text, Alert, Image } from 'react-native';
import {
	launchCameraAsync,
	MediaTypeOptions,
	useCameraPermissions,
	launchImageLibraryAsync,
	useMediaLibraryPermissions,
	PermissionStatus,
} from 'expo-image-picker';
import { Button } from '../../shared/Button/Button';

export default function Profile() {
	const [image, setImage] = useState<string | null>(null);
	const [cameraPermissions, requestCameraPermission] = useCameraPermissions();
	const [libraryPermissions, requestLibraryPermission] = useMediaLibraryPermissions();

	const varifyCameraPermissions = async () => {
		if (cameraPermissions?.status === PermissionStatus.UNDETERMINED) {
			const res = await requestCameraPermission();
			return res.granted;
		}
		if (cameraPermissions?.status === PermissionStatus.DENIED) {
			Alert.alert('Недостаточно прав для доступа к камере');
			return false;
		}
		return true;
	};

	const varifyMediaPermissions = async () => {
		if (libraryPermissions?.status === PermissionStatus.UNDETERMINED) {
			const res = await requestLibraryPermission();
			return res.granted;
		}
		if (libraryPermissions?.status === PermissionStatus.DENIED) {
			Alert.alert('Недостаточно прав для доступа к фото');
			return false;
		}
		return true;
	};

	const captureAvatar = async () => {
		const isPermissionGranted = await varifyCameraPermissions();
		if (!isPermissionGranted) {
			return;
		}
		const result = await launchCameraAsync({
			mediaTypes: MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});
		if (!result.assets) {
			return;
		}
		setImage(result.assets[0].uri);
	};

	const pickAvatar = async () => {
		const isPermissionGranted = await varifyMediaPermissions();
		if (!isPermissionGranted) {
			return;
		}
		const result = await launchImageLibraryAsync({
			mediaTypes: MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});
		if (!result.assets) {
			return;
		}
		console.log(result);
		setImage(result.assets[0].uri);
	};

	return (
		<View>
			<Text>Profile</Text>
			<Button text="Снять изображение" onPress={captureAvatar} />
			<Button text="Выбрать из галери" onPress={pickAvatar} />
			{image && (
				<Image
					source={{
						uri: image,
						width: 100,
						height: 100,
					}}
				/>
			)}
		</View>
	);
}
```



### Компонент загрузки


`assets/icons/upload.tsx`
```TSX
import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
const UploadIcon = (props: SvgProps) => (
	<Svg width={24} height={24} fill="none" {...props}>
		<Path
			stroke="#fff"
			strokeLinecap="round"
			strokeWidth={1.5}
			d="M6.286 19C3.919 19 2 17.104 2 14.765c0-2.34 1.919-4.236 4.286-4.236.284 0 .562.028.83.08m7.265-2.582a5.765 5.765 0 0 1 1.905-.321c.654 0 1.283.109 1.87.309m-11.04 2.594a5.577 5.577 0 0 1-.354-1.962C6.762 5.528 9.32 3 12.476 3c2.94 0 5.361 2.194 5.68 5.015m-11.04 2.594a4.29 4.29 0 0 1 1.55.634m9.49-3.228C20.392 8.78 22 10.881 22 13.353c0 2.707-1.927 4.97-4.5 5.52"
		/>
		<Path
			stroke="#fff"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={1.5}
			d="M12 16v6m0-6 2 2m-2-2-2 2"
		/>
	</Svg>
);
export default UploadIcon;
```



`shared/ImageUploader/ImageUploader.tsx`
```TSX
import {
	MediaTypeOptions,
	launchImageLibraryAsync,
	useMediaLibraryPermissions,
	PermissionStatus,
} from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import UploadIcon from '../../assets/icons/upload';
import { Colors, Fonts, Gaps, Radius } from '../tokens';
interface ImageUploaderProps {
	onUpload: (uri: string) => void;
}
export function ImageUploader({ onUpload }: ImageUploaderProps) {
	const [libraryPermissions, requestLibraryPermission] = useMediaLibraryPermissions();
	const varifyMediaPermissions = async () => {
		if (libraryPermissions?.status === PermissionStatus.UNDETERMINED) {
			const res = await requestLibraryPermission();
			return res.granted;
		}
		if (libraryPermissions?.status === PermissionStatus.DENIED) {
			Alert.alert('Недостаточно прав для доступа к фото');
			return false;
		}
		return true;
	};
	const pickImage = async () => {
		const isPermissionGranted = await varifyMediaPermissions();
		if (!isPermissionGranted) {
			return;
		}
		const result = await launchImageLibraryAsync({
			mediaTypes: MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});
		if (!result.assets) {
			return;
		}
		onUpload(result.assets[0].uri);
	};
	return (
		<Pressable onPress={pickImage}>
			<View style={styles.container}>
				<UploadIcon />
				<Text style={styles.text}>Загрузить изображение</Text>
			</View>
		</Pressable>
	);
}
const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: Gaps.g8,
		backgroundColor: Colors.violetDark,
		borderRadius: Radius.r10,
		paddingHorizontal: 20,
		paddingVertical: 17,
		alignItems: 'center',
	},
	text: {
		fontSize: Fonts.f14,
		fontFamily: Fonts.regular,
		color: Colors.white,
	},
});
```



`app/(app)/profile.tsx`
```TSX
import { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ImageUploader } from '../../shared/ImageUploader/ImageUploader';
import { Gaps } from '../../shared/tokens';

export default function Profile() {
	const [image, setImage] = useState<string | null>(null);

	return (
		<View style={styles.container}>
			{image ? (
				<Image
					style={styles.image}
					source={{
						uri: image,
					}}
				/>
			) : (
				<Image source={require('../../assets/images/avatar.png')} />
			)}
			<ImageUploader onUpload={setImage} />
		</View>
	);
}

const styles = StyleSheet.create({
	image: {
		width: 70,
		height: 70,
		borderRadius: 35,
	},
	container: {
		flexDirection: 'row',
		gap: Gaps.g20,
		alignItems: 'center',
		paddingHorizontal: 30,
		paddingVertical: 20,
	},
});
```



### Загрузка на сервер


```bash
npm i form-data
```



`shared/ImageUploader/ImageUploader.interface.ts`
```TSX
export interface UploadResponse {
	urls: {
		original: string;
		webP: string;
	};
}
```



`shared/api.ts`
```TSX
export const FILE_API = {
	uploadImage: `${PREFIX}/files/upload-image?folder=demo`,
};
```

Добавляем метод `uploadToServer`, которым мы будем загружать на сервер новую аватарку

`shared/ImageUploader/ImageUploader.tsx`
```TSX
import {
	MediaTypeOptions,
	launchImageLibraryAsync,
	useMediaLibraryPermissions,
	PermissionStatus,
} from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import UploadIcon from '../../assets/icons/upload';
import { Colors, Fonts, Gaps, Radius } from '../tokens';
import FormData from 'form-data';
import axios, { AxiosError } from 'axios';
import { FILE_API } from '../api';
import { UploadResponse } from './ImageUploader.interface';

interface ImageUploaderProps {
	onUpload: (uri: string) => void;
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
	const [libraryPermissions, requestLibraryPermission] = useMediaLibraryPermissions();

	const varifyMediaPermissions = async () => {
		if (libraryPermissions?.status === PermissionStatus.UNDETERMINED) {
			const res = await requestLibraryPermission();
			return res.granted;
		}
		if (libraryPermissions?.status === PermissionStatus.DENIED) {
			Alert.alert('Недостаточно прав для доступа к фото');
			return false;
		}
		return true;
	};

	const pickImage = async () => {
		const isPermissionGranted = await varifyMediaPermissions();
		if (!isPermissionGranted) {
			return;
		}
		const result = await launchImageLibraryAsync({
			mediaTypes: MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});
		if (!result.assets) {
			return;
		}
		await uploadToServer(result.assets[0].uri, result.assets[0].fileName ?? '');
	};

	const uploadToServer = async (uri: string, name: string) => {
		const formData = new FormData();
		formData.append('files', {
			uri,
			name,
			type: 'image/jpeg',
		});
		try {
			const { data } = await axios.post<UploadResponse>(FILE_API.uploadImage, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			onUpload(data.urls.original);
		} catch (error) {
			if (error instanceof AxiosError) {
				console.error(error);
			}
		}
	};
```



### Улучшаем код



`entities/user/ui/Avatar/Avatar.tsx`
```TSX
import { Image, StyleSheet } from 'react-native';
export function Avatar({ image }: { image: string | null }) {
	return (
		<>
			{image ? (
				<Image
					style={styles.image}
					source={{
						uri: image,
					}}
				/>
			) : (
				<Image source={require('../../../../assets/images/avatar.png')} />
			)}
		</>
	);
}
const styles = StyleSheet.create({
	image: {
		width: 70,
		height: 70,
		borderRadius: 35,
	},
});
```


`app/(app)/profile.tsx`
```TSX
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ImageUploader } from '../../shared/ImageUploader/ImageUploader';
import { Gaps } from '../../shared/tokens';
import { Avatar } from '../../entities/user/ui/Avatar/Avatar';

export default function Profile() {
	const [image, setImage] = useState<string | null>(null);

	return (
		<View style={styles.container}>
			<Avatar image={image} />
			<ImageUploader onUpload={setImage} onError={(e) => console.log(e)} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: Gaps.g20,
		alignItems: 'center',
		paddingHorizontal: 30,
		paddingVertical: 20,
	},
});
```

`shared/ImageUploader/ImageUploader.tsx`
```TSX
import {
	MediaTypeOptions,
	launchImageLibraryAsync,
	useMediaLibraryPermissions,
	PermissionStatus,
} from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import UploadIcon from '../../assets/icons/upload';
import { Colors, Fonts, Gaps, Radius } from '../tokens';
import FormData from 'form-data';
import axios, { AxiosError } from 'axios';
import { FILE_API } from '../api';
import { UploadResponse } from './ImageUploader.interface';

interface ImageUploaderProps {
	onUpload: (uri: string) => void;
	onError: (error: string) => void;
}

export function ImageUploader({ onUpload, onError }: ImageUploaderProps) {
	const [libraryPermissions, requestLibraryPermission] = useMediaLibraryPermissions();

	const upload = async () => {
		const isPermissionGranted = await varifyMediaPermissions();
		if (!isPermissionGranted) {
			onError('Недостаточно прав');
			return;
		}
		const asset = await pickImage();
		if (!asset) {
			onError('Не выбрано изображение');
			return;
		}
		const uploadedUrl = await uploadToServer(asset.uri, asset.fileName ?? '');
		if (!uploadedUrl) {
			onError('Не удалось загрузить изображение');
			return;
		}
		onUpload(uploadedUrl);
	};

	const varifyMediaPermissions = async () => {
		if (libraryPermissions?.status === PermissionStatus.UNDETERMINED) {
			const res = await requestLibraryPermission();
			return res.granted;
		}
		if (libraryPermissions?.status === PermissionStatus.DENIED) {
			Alert.alert('Недостаточно прав для доступа к фото');
			return false;
		}
		return true;
	};

	const pickImage = async () => {
		const result = await launchImageLibraryAsync({
			mediaTypes: MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});
		if (!result.assets) {
			return null;
		}
		return result.assets[0];
	};

	const uploadToServer = async (uri: string, name: string) => {
		const formData = new FormData();
		formData.append('files', {
			uri,
			name,
			type: 'image/jpeg',
		});
		try {
			const { data } = await axios.post<UploadResponse>(FILE_API.uploadImage, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			return data.urls.original;
		} catch (error) {
			if (error instanceof AxiosError) {
				console.error(error);
			}
			return null;
		}
	};

	return (
		<Pressable onPress={upload}>
			<View style={styles.container}>
				<UploadIcon />
				<Text style={styles.text}>Загрузить изображение</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: Gaps.g8,
		backgroundColor: Colors.violetDark,
		borderRadius: Radius.r10,
		paddingHorizontal: 20,
		paddingVertical: 17,
		alignItems: 'center',
	},
	text: {
		fontSize: Fonts.f14,
		fontFamily: Fonts.regular,
		color: Colors.white,
	},
});
```



`widget/user/ui/UserMenu/UserMenu.tsx`
```TSX
import { View, StyleSheet, Text } from 'react-native';
import { User } from '../../../../entities/user/model/user.model';
import { Colors, Fonts, Gaps } from '../../../../shared/tokens';
import { Avatar } from '../../../../entities/user/ui/Avatar/Avatar';

export function UserMenu({ user }: { user: User | null }) {
	if (!user) {
		return;
	}
	return (
		<View style={styles.container}>
			<Avatar image={user.photo ?? null} />
			<Text style={styles.name}>
				{user.name} {user.surname}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		gap: Gaps.g8,
		marginTop: 30,
		marginBottom: 40,
	},
	name: {
		fontSize: Fonts.f16,
		fontFamily: Fonts.regular,
		color: Colors.white,
	},
});
```



### Сохранение профиля



`entities/user/model/user.state.ts`
```TSX
export const updateProfileAtom = atom(
	async (get) => {
		return get(profileAtom);
	},
	async (get, set, { photo }: { photo: string }) => {
		try {
			const { access_token } = await get(authAtom);
			const { data } = await axios.patch<User>(
				API.profile,
				{
					photo,
				},
				{
					headers: {
						Authorization: `Bearer ${access_token}`,
					},
				},
			);
			set(profileAtom, {
				isLoading: false,
				profile: data,
				error: null,
			});
		} catch (error) {
			if (error instanceof AxiosError) {
				set(profileAtom, {
					isLoading: false,
					profile: null,
					error: error.response?.data.message,
				});
			}
		}
	},
);
```



`app/(app)/profile.tsx`
```TSX
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ImageUploader } from '../../shared/ImageUploader/ImageUploader';
import { Gaps } from '../../shared/tokens';
import { Avatar } from '../../entities/user/ui/Avatar/Avatar';
import { useAtom } from 'jotai';
import { updateProfileAtom } from '../../entities/user/model/user.state';
import { Button } from '../../shared/Button/Button';

export default function Profile() {
	const [image, setImage] = useState<string | null>(null);
	const [profile, updateProfile] = useAtom(updateProfileAtom);

	const submitProfile = () => {
		if (!image) {
			return;
		}
		updateProfile({ photo: image });
	};

	useEffect(() => {
		if (profile && profile.profile?.photo) {
			setImage(profile.profile?.photo);
		}
	}, [profile]);

	return (
		<View>
			<View style={styles.container}>
				<Avatar image={image} />
				<ImageUploader onUpload={setImage} onError={(e) => console.log(e)} />
			</View>
			<Button text="Сохранить" onPress={submitProfile} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: Gaps.g20,
		alignItems: 'center',
		paddingHorizontal: 30,
		paddingVertical: 20,
	},
});
```



### Sharing API



```bash
npm i expo-sharing
```

Добавляем метод `shareProfile`

`app/(app)/profile.tsx`
```TSX
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ImageUploader } from '../../shared/ImageUploader/ImageUploader';
import { Gaps } from '../../shared/tokens';
import { Avatar } from '../../entities/user/ui/Avatar/Avatar';
import { useAtom } from 'jotai';
import { updateProfileAtom } from '../../entities/user/model/user.state';
import { Button } from '../../shared/Button/Button';
import * as Sharing from 'expo-sharing';

export default function Profile() {
	const [image, setImage] = useState<string | null>(null);
	const [profile, updateProfile] = useAtom(updateProfileAtom);

	const shareProfile = async () => {
		const isShaingAvailable = await Sharing.isAvailableAsync();
		if (!isShaingAvailable) {
			return;
		}
		await Sharing.shareAsync('https://purpleschool.ru', {
			dialogTitle: 'Поделиться профилем',
		});
	};

	const submitProfile = () => {
		if (!image) {
			return;
		}
		updateProfile({ photo: image });
	};

	useEffect(() => {
		if (profile && profile.profile?.photo) {
			setImage(profile.profile?.photo);
		}
	}, [profile]);

	return (
		<View>
			<View style={styles.container}>
				<Avatar image={image} />
				<ImageUploader onUpload={setImage} onError={(e) => console.log(e)} />
			</View>
			<Button text="Сохранить" onPress={submitProfile} />
			<Button text="Поделиться" onPress={shareProfile} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: Gaps.g20,
		alignItems: 'center',
		paddingHorizontal: 30,
		paddingVertical: 20,
	},
});
```



## Разрешения и layout

### Ориентация экрана



`app.json`
```JSON
"orientation": "portrait",
```

### ScreenOrientation



```bash
npm i expo-screen-orientatio
```



`shared/hooks.ts`
```TSX
import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export function useScreenOrientation() {
	const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>();
	useEffect(() => {
		ScreenOrientation.getOrientationAsync().then((o) => setOrientation(o));
		ScreenOrientation.addOrientationChangeListener((e) => {
			setOrientation(e.orientationInfo.orientation);
		});
		return () => {
			ScreenOrientation.removeOrientationChangeListeners();
		};
	}, []);
	return orientation;
}
```

Добавляем `style` в инпут

`shared/Input/Input.tsx`
```TSX
export function Input({ isPassword, style, ...props }: TextInputProps & { isPassword?: boolean }) {
	const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

	return (
		<View style={style}>
```



`app/login.tsx`
```TSX
/* eslint-disable react-native/no-inline-styles */
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { Input } from '../shared/Input/Input';
import { Colors, Gaps } from '../shared/tokens';
import { Button } from '../shared/Button/Button';
import { ErrorNotification } from '../shared/ErrorNotification/ErrorNotification';
import { useEffect, useState } from 'react';
import { CustomLink } from '../shared/CustomLink/CustomLink';
import { useAtom } from 'jotai';
import { loginAtom } from '../entities/auth/model/auth.state';
import { router } from 'expo-router';
import { useScreenOrientation } from '../shared/hooks';
import { Orientation } from 'expo-screen-orientation';

export default function Login() {
	const [localError, setLocalError] = useState<string | undefined>();
	const [email, setEmail] = useState<string>();
	const [password, setPassword] = useState<string>();
	const [{ access_token, isLoading, error }, login] = useAtom(loginAtom);
	const orientation = useScreenOrientation();

	const submit = () => {
		if (!email) {
			setLocalError('Не введён email');
			return;
		}
		if (!password) {
			setLocalError('Не введён пароль');
			return;
		}
		login({ email, password });
	};

	useEffect(() => {
		if (error) {
			setLocalError(error);
		}
	}, [error]);

	useEffect(() => {
		if (access_token) {
			router.replace('/(app)');
		}
	}, [access_token]);

	return (
		<View style={styles.container}>
			<ErrorNotification error={localError} />
			<View style={styles.content}>
				<Image style={styles.logo} source={require('../assets/logo.png')} resizeMode="contain" />
				<View style={styles.form}>
					<View
						style={{
							...styles.inputs,
							flexDirection: orientation === Orientation.PORTRAIT_UP ? 'column' : 'row',
						}}
					>
						<Input
							style={{
								width:
									orientation === Orientation.PORTRAIT_UP
										? 'auto'
										: Dimensions.get('window').width / 2 - 16 - 48,
							}}
							placeholder="Email"
							onChangeText={setEmail}
						/>
						<Input
							style={{
								width:
									orientation === Orientation.PORTRAIT_UP
										? 'auto'
										: Dimensions.get('window').width / 2 - 16 - 48,
							}}
							isPassword
							placeholder="Пароль"
							onChangeText={setPassword}
						/>
					</View>
					<Button text="Войти" onPress={submit} isLoading={isLoading} />
				</View>
				<CustomLink href={'/restore'} text="Восстановить пароль" />
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
	inputs: {
		gap: Gaps.g16,
	},
});
```



### Поддержка планшетов













### KeyboardAvoidingView

Оборачиваем контент в `KeyboardAvoidingView`

`app/login.tsx`
```TSX
import { StyleSheet, View, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';

export default function Login() {
	const [localError, setLocalError] = useState<string | undefined>();
	const [email, setEmail] = useState<string>();
	const [password, setPassword] = useState<string>();
	const [{ access_token, isLoading, error }, login] = useAtom(loginAtom);
	const orientation = useScreenOrientation();

	const submit = () => {
		if (!email) {
			setLocalError('Не введён email');
			return;
		}
		if (!password) {
			setLocalError('Не введён пароль');
			return;
		}
		login({ email, password });
	};

	useEffect(() => {
		if (error) {
			setLocalError(error);
		}
	}, [error]);

	useEffect(() => {
		if (access_token) {
			router.replace('/(app)');
		}
	}, [access_token]);

	return (
		<View style={styles.container}>
			<ErrorNotification error={localError} />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.content}
			>
				<Image style={styles.logo} source={require('../assets/logo.png')} resizeMode="contain" />
				<View style={styles.form}>
					<View
						style={{
							...styles.inputs,
							flexDirection: orientation === Orientation.PORTRAIT_UP ? 'column' : 'row',
						}}
					>
						<Input
							style={{
								width:
									orientation === Orientation.PORTRAIT_UP
										? 'auto'
										: Dimensions.get('window').width / 2 - 16 - 48,
							}}
							placeholder="Email"
							onChangeText={setEmail}
						/>
						<Input
							style={{
								width:
									orientation === Orientation.PORTRAIT_UP
										? 'auto'
										: Dimensions.get('window').width / 2 - 16 - 48,
							}}
							isPassword
							placeholder="Пароль"
							onChangeText={setPassword}
						/>
					</View>
					<Button text="Войти" onPress={submit} isLoading={isLoading} />
				</View>
				<CustomLink href={'/restore'} text="Восстановить пароль" />
			</KeyboardAvoidingView>
		</View>
	);
}
```



### Platform



`tsconfig.json`
```JSON
{
	"extends": "expo/tsconfig.base",
	"compilerOptions": {
		"strict": true,
		"moduleSuffixes": [
			".ios",
			".android",
			".native",
			""
		],
	}
}
```

Мы можем в зависимости от платформы выбрать своё значение через объект `Platform`

`app/login.tsx`
```TSX
import { Platform } from 'react-native';

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
		width: Platform.select({ ios: 220, android: 300 }),
	},
	inputs: {
		gap: Gaps.g16,
	},
});
```



`features/layout/ui/CloseDrawer/CloseDrawer.android.tsx`
```TSX
import { View, Pressable, StyleSheet } from 'react-native';
import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types';
import CloseIcon from '../../../../assets/icons/close';

export function CloseDrawer(navigation: DrawerNavigationHelpers) {
	return (
		<Pressable onPress={() => navigation.closeDrawer()}>
			<View style={styles.button}>
				<CloseIcon />
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		top: 20,
		right: 20,
	},
});
```



## Списки

### Данные курсов



`entities/course/api/api.ts`
```TS
import { PREFIX } from '../../../shared/api';
export const API = {
	my: `${PREFIX}/course/my`,
};
```



`entities/course/model/course.model.ts`
```TS
export interface Progress {
	progressPercent: number;
	tariffLessonsCount: number;
	userViewedLessonsCount: number;
}
export type StudentCourseDescription = {
	id: number;
	shortTitle: string;
	image: string;
	title: string;
	alias: string;
	length: number;
	avgRating: number;
	price: number;
	courseOnDirection: { direction: Record<'name', string> }[];
	tariffs: Tariff[];
	progress: Progress;
};
export type Tariff = {
	id: number;
	name: string;
	price: number;
	type: TariffType;
	oldPrice?: number;
	creditPrice?: number;
	lengthInMonth: number;
	courseId: number;
	createdAt: string;
	videoUuid: string;
};
export enum TariffType {
	free = 'free',
	basic = 'basic',
	mentor = 'mentor',
	project = 'project',
}
```



`entities/course/model/course.state.ts`
```TS
import { atom } from 'jotai';
import { authAtom } from '../../auth/model/auth.state';
import axios, { AxiosError } from 'axios';
import { API } from '../api/api';
import { StudentCourseDescription } from './course.model';
export const courseAtom = atom<CourseState>({
	courses: [],
	isLoading: false,
	error: null,
});
export const loadCourseAtom = atom(
	async (get) => {
		return get(courseAtom);
	},
	async (get, set) => {
		try {
			const { access_token } = await get(authAtom);
			set(courseAtom, {
				isLoading: true,
				courses: [],
				error: null,
			});
			const { data } = await axios.get<StudentCourseDescription[]>(API.my, {
				params: {
					studentCourse: 'dontMy',
				},
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			});
			set(courseAtom, {
				isLoading: false,
				courses: data,
				error: null,
			});
		} catch (error) {
			if (error instanceof AxiosError) {
				set(courseAtom, {
					isLoading: false,
					courses: [],
					error: error.response?.data.message,
				});
			}
		}
	},
);
export interface CourseState {
	courses: StudentCourseDescription[];
	isLoading: boolean;
	error: string | null;
}
```



`app/(app)/index.tsx`
```TSX
import { View, Text } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { courseAtom, loadCourseAtom } from '../../entities/course/model/course.state';
import { useEffect } from 'react';

export default function MyCourses() {
	const { isLoading, error, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	return (
		<View>
			<Text>index</Text>
			{courses.length > 0 && courses.map((c) => <Text key={c.id}>{c.title}</Text>)}
		</View>
	);
}
```




### Вёрстка карточки



`shared/Chip/Chip.tsx`
```TSX
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../tokens';
export function Chip({ text }: { text: string }) {
	return (
		<View style={styles.container}>
			<Text style={styles.text}>{text}</Text>
		</View>
	);
}
const styles = StyleSheet.create({
	container: {
		paddingVertical: 5,
		paddingHorizontal: 10,
		borderColor: Colors.border,
		borderRadius: Radius.r17,
		borderWidth: 1,
	},
	text: {
		fontFamily: Fonts.regular,
		fontSize: Fonts.f14,
		color: Colors.white,
	},
});
```



`entities/course/ui/CourseCard/CourseCard.tsx`
```TSX
import { StyleSheet, View, Image, Text } from 'react-native';
import { StudentCourseDescription } from '../../model/course.model';
import { Chip } from '../../../../shared/Chip/Chip';
import { Button } from '../../../../shared/Button/Button';
import { Colors, Radius } from '../../../../shared/tokens';
export function CourseCard({ image, title, courseOnDirection }: StudentCourseDescription) {
	return (
		<View style={styles.card}>
			<Image
				source={{
					uri: image,
				}}
				style={styles.image}
				height={200}
			/>
			<View style={styles.header}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.chips}>
					{courseOnDirection.length > 0 &&
						courseOnDirection.map((c) => <Chip text={c.direction.name} />)}
				</View>
			</View>
			<View style={styles.footer}>
				<Button text="Купить" />
			</View>
		</View>
	);
}
const styles = StyleSheet.create({
	card: {
		flexDirection: 'column',
		borderRadius: Radius.r10,
		backgroundColor: Colors.blackLight,
	},
	image: {},
	title: {},
	chips: {},
	header: {},
	footer: {},
});
```



`app/(app)/index.tsx`
```TSX
import { View, Text, StyleSheet } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { courseAtom, loadCourseAtom } from '../../entities/course/model/course.state';
import { useEffect } from 'react';
import { CourseCard } from '../../entities/course/ui/CourseCard/CourseCard';
import { Gaps } from '../../shared/tokens';

export default function MyCourses() {
	const { isLoading, error, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	return (
		<View style={styles.wrapper}>
			{courses.length > 0 && courses.map((c) => <CourseCard {...c} key={c.id} />)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flexDirection: 'column',
		gap: Gaps.g20,
		padding: 20,
	},
});
```



### ScrollView



`entities/course/ui/CourseCard/CourseCard.tsx`
```TSX
import { StyleSheet, View, Image, Text } from 'react-native';
import { StudentCourseDescription } from '../../model/course.model';
import { Chip } from '../../../../shared/Chip/Chip';
import { Button } from '../../../../shared/Button/Button';
import { Colors, Fonts, Gaps, Radius } from '../../../../shared/tokens';

export function CourseCard({ image, shortTitle, courseOnDirection }: StudentCourseDescription) {
	return (
		<View style={styles.card}>
			<Image
				source={{
					uri: image,
				}}
				style={styles.image}
				height={200}
			/>
			<View style={styles.header}>
				<Text style={styles.title}>{shortTitle}</Text>
				<View style={styles.chips}>
					{courseOnDirection.length > 0 &&
						courseOnDirection.map((c) => <Chip text={c.direction.name} />)}
				</View>
			</View>
			<View style={styles.footer}>
				<Button text="Купить" />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'column',
		borderRadius: Radius.r10,
		backgroundColor: Colors.blackLight,
	},
	image: {
		borderRadius: 10,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
	},
	title: {
		fontSize: Fonts.f21,
		color: Colors.white,
		fontFamily: Fonts.semibold,
		marginBottom: 12,
	},
	chips: {
		flexDirection: 'row',
		gap: Gaps.g10,
	},
	header: {
		paddingHorizontal: 24,
		paddingVertical: 18,
	},
	footer: {
		backgroundColor: Colors.violetDark,
		paddingHorizontal: 24,
		paddingVertical: 20,
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
	},
});
```



`app/(app)/index.tsx`
```TSX
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { courseAtom, loadCourseAtom } from '../../entities/course/model/course.state';
import { useEffect } from 'react';
import { CourseCard } from '../../entities/course/ui/CourseCard/CourseCard';
import { Gaps } from '../../shared/tokens';

export default function MyCourses() {
	const { isLoading, error, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	return (
		<ScrollView>
			<View style={styles.wrapper}>
				{courses.length > 0 && courses.map((c) => <CourseCard {...c} key={c.id} />)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flexDirection: 'column',
		gap: Gaps.g20,
		padding: 20,
	},
});
```



### FlatList



`app/(app)/index.tsx`
```TSX
import { View, StyleSheet, FlatList } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { courseAtom, loadCourseAtom } from '../../entities/course/model/course.state';
import { useEffect } from 'react';
import { CourseCard } from '../../entities/course/ui/CourseCard/CourseCard';
import { StudentCourseDescription } from '../../entities/course/model/course.model';

export default function MyCourses() {
	const { isLoading, error, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	const renderCourse = ({ item }: { item: StudentCourseDescription }) => {
		return (
			<View style={styles.item}>
				<CourseCard {...item} />
			</View>
		);
	};

	return (
		<>
			{courses.length > 0 && (
				<FlatList
					data={courses}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderCourse}
				/>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	item: {
		padding: 20,
	},
});
```



### RefreshControl



`app/(app)/index.tsx`
```TSX
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { courseAtom, loadCourseAtom } from '../../entities/course/model/course.state';
import { useEffect } from 'react';
import { CourseCard } from '../../entities/course/ui/CourseCard/CourseCard';
import { StudentCourseDescription } from '../../entities/course/model/course.model';
import { Colors } from '../../shared/tokens';

export default function MyCourses() {
	const { isLoading, error, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	const renderCourse = ({ item }: { item: StudentCourseDescription }) => {
		return (
			<View style={styles.item}>
				<CourseCard {...item} />
			</View>
		);
	};

	return (
		<>
			{isLoading && (
				<ActivityIndicator style={styles.activity} size="large" color={Colors.primary} />
			)}
			{courses.length > 0 && (
				<FlatList
					refreshControl={
						<RefreshControl
							tintColor={Colors.primary}
							titleColor={Colors.primary}
							refreshing={isLoading}
							onRefresh={loadCourse}
						/>
					}
					data={courses}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderCourse}
				/>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	item: {
		padding: 20,
	},
	activity: {
		marginTop: 30,
	},
});
```



### Linking



`entities/course/ui/CourseCard/CourseCard.tsx`
```TSX
import { StyleSheet, View, Image, Text, Linking } from 'react-native';
import { StudentCourseDescription } from '../../model/course.model';
import { Chip } from '../../../../shared/Chip/Chip';
import { Button } from '../../../../shared/Button/Button';
import { Colors, Fonts, Gaps, Radius } from '../../../../shared/tokens';

export function CourseCard({
	image,
	shortTitle,
	courseOnDirection,
	alias,
}: StudentCourseDescription) {
	return (
		<View style={styles.card}>
			<Image
				source={{
					uri: image,
				}}
				style={styles.image}
				height={200}
			/>
			<View style={styles.header}>
				<Text style={styles.title}>{shortTitle}</Text>
				<View style={styles.chips}>
					{courseOnDirection.length > 0 &&
						courseOnDirection.map((c) => <Chip text={c.direction.name} />)}
				</View>
			</View>
			<View style={styles.footer}>
				<Button
					text="Купить"
					onPress={() => Linking.openURL(`https://purpleschool.ru/course/${alias}`)}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'column',
		borderRadius: Radius.r10,
		backgroundColor: Colors.blackLight,
	},
	image: {
		borderRadius: 10,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
	},
	title: {
		fontSize: Fonts.f21,
		color: Colors.white,
		fontFamily: Fonts.semibold,
		marginBottom: 12,
	},
	chips: {
		flexDirection: 'row',
		gap: Gaps.g10,
	},
	header: {
		paddingHorizontal: 24,
		paddingVertical: 18,
	},
	footer: {
		backgroundColor: Colors.violetDark,
		paddingHorizontal: 24,
		paddingVertical: 20,
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
	},
});
```



### Градиентный текст / LinearGradient



```bash
npm i expo-linear-gradient @react-native-masked-view/masked-view
```



`entities/course/ui/CourseCard/CourseCard.tsx`
```TSX
import { StyleSheet, View, Image, Text, Linking } from 'react-native';
import { StudentCourseDescription } from '../../model/course.model';
import { Chip } from '../../../../shared/Chip/Chip';
import { Button } from '../../../../shared/Button/Button';
import { Colors, Fonts, Gaps, Radius } from '../../../../shared/tokens';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export function CourseCard({
	image,
	shortTitle,
	courseOnDirection,
	alias,
	tariffs,
}: StudentCourseDescription) {
	return (
		<View style={styles.card}>
			<Image
				source={{
					uri: image,
				}}
				style={styles.image}
				height={200}
			/>
			<View style={styles.header}>
				<Text style={styles.title}>{shortTitle}</Text>
				<View style={styles.chips}>
					{courseOnDirection.length > 0 &&
						courseOnDirection.map((c) => <Chip text={c.direction.name} />)}
				</View>
				<MaskedView
					maskElement={<Text style={styles.tariff}>Тариф &laquo;{tariffs[0].name}&raquo;</Text>}
				>
					<LinearGradient
						colors={['#D77BE5', '#6C38CC']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
					>
						<Text style={{ ...styles.tariff, ...styles.tariffWithOpacity }}>
							Тариф &laquo;{tariffs[0].name}&raquo;
						</Text>
					</LinearGradient>
				</MaskedView>
			</View>
			<View style={styles.footer}>
				<Button
					text="Купить"
					onPress={() => Linking.openURL(`https://purpleschool.ru/course/${alias}`)}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'column',
		borderRadius: Radius.r10,
		backgroundColor: Colors.blackLight,
	},
	tariff: {
		marginTop: 10,
		fontSize: Fonts.f16,
		fontFamily: Fonts.regular,
	},
	tariffWithOpacity: {
		opacity: 0,
	},
	image: {
		borderRadius: 10,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
	},
	title: {
		fontSize: Fonts.f21,
		color: Colors.white,
		fontFamily: Fonts.semibold,
		marginBottom: 12,
	},
	chips: {
		flexDirection: 'row',
		gap: Gaps.g10,
	},
	header: {
		paddingHorizontal: 24,
		paddingVertical: 18,
	},
	footer: {
		backgroundColor: Colors.violetDark,
		paddingHorizontal: 24,
		paddingVertical: 20,
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
	},
});
```



### Progress Bar



`entities/course/ui/CourseProgress/CourseProgress.tsx`
```TSX
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../../../shared/tokens';
export function CourseProgress({
	totalLessons,
	passedLessons,
}: {
	totalLessons: number;
	passedLessons: number;
}) {
	const percent = Math.round((passedLessons / totalLessons) * 100);
	return (
		<View style={styles.wrapper}>
			<View style={styles.head}>
				<Text style={styles.textPercent}>{percent}%</Text>
				<Text style={styles.textCount}>
					{passedLessons}/{totalLessons}
				</Text>
			</View>
			<View style={styles.bar}>
				<View
					style={{
						...styles.progress,
						width: `${percent}%`,
					}}
				/>
			</View>
		</View>
	);
}
const styles = StyleSheet.create({
	wrapper: {
		marginBottom: 18,
	},
	textPercent: {
		fontSize: Fonts.f16,
		fontFamily: Fonts.regular,
		color: Colors.secondary,
	},
	textCount: {
		fontSize: Fonts.f12,
		fontFamily: Fonts.regular,
		color: Colors.grayLight,
	},
	head: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	bar: {
		height: 5,
		borderRadius: 20,
		backgroundColor: Colors.border,
	},
	progress: {
		height: 5,
		borderRadius: 20,
		backgroundColor: Colors.secondary,
	},
});
```



`widget/course/ui/CourseCard/CourseCard.tsx`
```TSX
export function CourseCard({
	image,
	shortTitle,
	courseOnDirection,
	alias,
	tariffs,
}: StudentCourseDescription) {
	return (
		<View style={styles.card}>
			<Image
				source={{
					uri: image,
				}}
				style={styles.image}
				height={200}
			/>
			<View style={styles.header}>
				<CourseProgress totalLessons={120} passedLessons={40} />
				<Text style={styles.title}>{shortTitle}</Text>
```



## Нотификации

### Типы уведомлений

У нас есть два типа уведомлений: локальные и пуши

Локальные уведомления вызываются самим приложением, а пуши триггерятся нашим бэкэндом.

![](_png/Pasted%20image%2020250303190411.png)

Управляют мобильными пушами для каждой из систем - Google и Apple. Мы можем отправлять пуши через хабы (тот же Expo), которые подключатся к сервисам пушей распространителей. 

### Установка expo-notifications

Устанавливаем плагин `expo-notifications` 

```bash
npm i expo-notifications
```

Добавляем иконку для уведомлений `assets/notification-icon.png`

И добавляем плагин нотификаций из экспо

`app.json`
```JSON
"plugins": [
  ...
  [
	"expo-notifications",
	{
	  "icon": "./assets/notification-icon.png",
	  "color": "#16171D"
	}
  ]
],
```



### Отправка уведомлений



`app/(app)/index.tsx`
```TSX
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { courseAtom, loadCourseAtom } from '../../entities/course/model/course.state';
import { useEffect } from 'react';
import { CourseCard } from '../../widget/course/ui/CourseCard/CourseCard';
import { StudentCourseDescription } from '../../entities/course/model/course.model';
import { Colors } from '../../shared/tokens';
import { Button } from '../../shared/Button/Button';
import * as Notioficaitons from 'expo-notifications';

export default function MyCourses() {
	const { isLoading, error, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	const renderCourse = ({ item }: { item: StudentCourseDescription }) => {
		return (
			<View style={styles.item}>
				<CourseCard {...item} />
			</View>
		);
	};

	const scheduleNotification = () => {
		Notioficaitons.scheduleNotificationAsync({
			content: {
				title: 'Не забудь пройти курс',
				body: 'Не забывай учиться каждый день!',
				data: { success: true },
			},
			trigger: {
				seconds: 5,
			},
		});
	};

	return (
		<>
			{isLoading && (
				<ActivityIndicator style={styles.activity} size="large" color={Colors.primary} />
			)}
			<Button text="Напомнить" onPress={scheduleNotification} />
			{courses.length > 0 && (
				<FlatList
					refreshControl={
						<RefreshControl
							tintColor={Colors.primary}
							titleColor={Colors.primary}
							refreshing={isLoading}
							onRefresh={loadCourse}
						/>
					}
					data={courses}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderCourse}
				/>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	item: {
		padding: 20,
	},
	activity: {
		marginTop: 30,
	},
});
```



### Обработка уведомлений

Добавляем хэндлер уведомлений внутри лейаута авторизованной зоны приложения

`app/(app)/_layout.tsx`
```TSX
import * as Notificaitons from 'expo-notifications';

Notificaitons.setNotificationHandler({
	handleNotification: async () => ({
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowAlert: true,
	}),
});
```



`app/(app)/index.tsx`
```TSX
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { courseAtom, loadCourseAtom } from '../../entities/course/model/course.state';
import { useEffect } from 'react';
import { CourseCard } from '../../widget/course/ui/CourseCard/CourseCard';
import { StudentCourseDescription } from '../../entities/course/model/course.model';
import { Colors } from '../../shared/tokens';
import { Button } from '../../shared/Button/Button';
import * as Notificaitons from 'expo-notifications';

export default function MyCourses() {
	const { isLoading, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	const renderCourse = ({ item }: { item: StudentCourseDescription }) => {
		return (
			<View style={styles.item}>
				<CourseCard {...item} />
			</View>
		);
	};

	const allowsNotification = async () => {
		const settings = await Notificaitons.getPermissionsAsync();
		return (
			settings.granted || settings.ios?.status == Notificaitons.IosAuthorizationStatus.PROVISIONAL
		);
	};
	const requestPermissions = async () => {
		return Notificaitons.requestPermissionsAsync({
			ios: {
				allowAlert: true,
				allowBadge: true,
				allowSound: true,
			},
		});
	};
	const scheduleNotification = async () => {
		const granted = await allowsNotification();
		if (!granted) {
			await requestPermissions();
		}
		Notificaitons.scheduleNotificationAsync({
			content: {
				title: 'Не забудь пройти курс',
				body: 'Не забывай учиться каждый день!',
				data: { success: true },
			},
			trigger: {
				seconds: 5,
			},
		});
	};
```


### Нажатие на уведомление



`shared/Notification/Notification.tsx`
```TSX
import * as Notificaitons from 'expo-notifications';
import { useEffect } from 'react';

export function Notificaiton() {
	Notificaitons.setNotificationHandler({
		handleNotification: async () => ({
			shouldPlaySound: true,
			shouldSetBadge: true,
			shouldShowAlert: true,
		}),
	});
	
	useEffect(() => {
		const subRecieved = Notificaitons.addNotificationReceivedListener((notification) => {
			console.log(notification.request.content.data);
		});
		const subResponseReceived = Notificaitons.addNotificationResponseReceivedListener(
			(notification) => {
				console.log('Clicked');
				console.log(notification.notification.request.content.data);
			},
		);
		return () => {
			subRecieved.remove();
			subResponseReceived.remove();
		};
	}, []);
	
	return <></>;
}
```

Добавляем компонент `Notificaiton` в корневой лейаут приложения

`app/_layout.tsx`
```TSX
<SafeAreaProvider>
	<Notificaiton />
	<StatusBar style="light" />
	<Stack
```




### Уведомление с URL

Обновляем нотификатор

`app/(app)/index.tsx`
```TSX
const scheduleNotification = async () => {
	const granted = await allowsNotification();
	if (!granted) {
		await requestPermissions();
	}
	Notificaitons.scheduleNotificationAsync({
		content: {
			title: 'Новый курс TypeScript',
			body: 'Начни учиться уже сейчас!',
			data: { alias: 'typescript' },
		},
		trigger: {
			seconds: 5,
		},
	});
};
```

Тут мы будем открывать ссылку с алиасом, который мы задали в уведомлениях через `router`. Сам алиас мы получим из объекта уведомления, который получается из `addNotificationResponseReceivedListener` листенера уведомлений

`shared/Notification/Notification.tsx`
```TSX
import * as Notificaitons from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function Notificaiton() {
	const router = useRouter();
	Notificaitons.setNotificationHandler({
		handleNotification: async () => ({
			shouldPlaySound: true,
			shouldSetBadge: true,
			shouldShowAlert: true,
		}),
	});

	useEffect(() => {
		const subRecieved = Notificaitons.addNotificationReceivedListener((notification) => {
			console.log(notification.request.content.data);
		});
		const subResponseReceived = Notificaitons.addNotificationResponseReceivedListener(
			(notification) => {
				const alias = notification.notification.request.content.data.alias;
				router.push(`/(app)/course/${alias}`);
			},
		);
		return () => {
			subRecieved.remove();
			subResponseReceived.remove();
		};
	}, []);

	return <></>;
}
```









### Работа с push-уведомлениями



```bash
npm i expo-device
```

Достаём из `Device` параметр `isDevice` и проверяем, что у нас мобильное устройство

Убираем `Notificaitons.scheduleNotificationAsync` и заменяем на `getExpoPushTokenAsync`, через который мы получим токен для пушей

```TSX
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export default function MyCourses() {
	const { isLoading, courses } = useAtomValue(courseAtom);
	const loadCourse = useSetAtom(loadCourseAtom);

	useEffect(() => {
		loadCourse();
	}, []);

	const renderCourse = ({ item }: { item: StudentCourseDescription }) => {
		return (
			<View style={styles.item}>
				<CourseCard {...item} />
			</View>
		);
	};

	const allowsNotification = async () => {
		const settings = await Notificaitons.getPermissionsAsync();
		return (
			settings.granted || settings.ios?.status == Notificaitons.IosAuthorizationStatus.PROVISIONAL
		);
	};

	const requestPermissions = async () => {
		return Notificaitons.requestPermissionsAsync({
			ios: {
				allowAlert: true,
				allowBadge: true,
				allowSound: true,
			},
		});
	};

	const scheduleNotification = async () => {
		const granted = await allowsNotification();
		if (!granted) {
			await requestPermissions();
		}
		if (Device.isDevice) {
			const token = await Notificaitons.getExpoPushTokenAsync({
				projectId: Constants.expoConfig?.extra?.eas.projectId,
			});
			console.log(token);
		}
	};
```



### Использование push-токена

Добавляем токен пушей в приложение

`app.json`
```JSON
"extra": { "eas": { "projectId": "9e8de316-bef0-4e46-9476-cabcea343056" } },
```



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



![](_png/Pasted%20image%2020250303190436.png)








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










