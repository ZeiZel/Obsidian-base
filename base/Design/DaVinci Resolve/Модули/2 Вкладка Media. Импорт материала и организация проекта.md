# 2 Вкладка Media. Импорт материала и организация проекта
#Media #Proxy

## 1 Знакомство с программой пайплайн работы и настройка интерфейса. Настройки проекта

Отключаем нижнюю панель навигации. 

Далее для переключения по вкладкам используем `shift + 2-8`. 
`shift + 1` - вызовет *Project Manager*
`shift + 9` - вызовет настройки проекта

![](_png/d5a2b30857eb0d27449d5128eca04e7b.png)

В настройках проекта обязательно нужно выставить количество кадров снятого видео

![](_png/76f6a7a81dfed60b1310895a07a38bfb.png)

Далее у нас идёт сглаживание. 
Если мы сжимаем изображение (уменьшаем), то там нужно будет выставить *smoother*, так как резкость поднимется. Если мы увеличиваем изображение, то нам нужно будет использовать *sharper*, так как резкость упадёт

![](_png/2b95fdb5bfd9fed79aca03d04d5cb0c3.png)

Цветовую гамму проекта ставим на 2.4

![](_png/8a6b50b529bbd58ad7c6b4196ec02909.png)

И далее добавляем в проект отдельную папку, в которую будут попадать все таймлинии

![](_png/f99f8684d12b9eca2ec576457776f80c.png)

И далее можно сохранить текущие настройки как пресет

![](_png/35fe57b0db64560258e40e062aa10608.png)


## 2 Импорт материала вкладка media

Самое важное - прежде чем закинуть файлы в проект, мы можем просмотреть метаданные, которые помогут нам настроить проект заранее

![](_png/1917433dc609c9e2e80b021246cd9388.png)

Далее через это меню мы можем импортировать материалы в проект сохраняя структуру папок

![](_png/899fb9698f2d2d6e588ba1a983c7fb6e.png)

Если просто перетащить папку, то иерархия папок не будет соблюдаться и все файлы закинутся просто вразнобой

![](_png/d1793ab242b662b01279b1131002a731.png)

Так же мы можем заэкстрактить отдельную аудиодорожку, чтобы она была в проекте 

![](_png/4b9369a3bb503e52aa6c6e262085e660.png)

Далее, если у нас есть последовательность фотографий, которая отличается только цифрой, то давинчи будет автоматически переводить её в секвенцию

![](_png/7849f9e988de4c87968cb480cf143377.png)
![](_png/330308b3feadb395b3b1cfb2ac3064db.png)

Чтобы решить эту проблему, нужно режим отображения перевести в индивидуальный

![](_png/6a28bf9bd872c9bf33160e9a6507ece7.png)

При отображении всех материалов списком оставляем такие колонки. Тут мы можем посмотреть тип, фреймрейт, разрешение, сколько раз использовали в проекте и делали ли мы прокси для данного видео

![](_png/a94b7f3620dab8aeaab5cf459fcd7972.png)

Ну и так же можно сделать пресет для такого лейаута

![](_png/6ef397ea16c34f268adb4225d4a4d75a.png)

Так же можно открыть мини-таймлинию для просмотра футажа

![](_png/01c1870c0611834565f2a3b8f7b888d3.png)


## 3 Организация проекта

```
2023.13.05 Project-name
|-1_FOOTAGE    // храним наши видеоматериалы
|-2_ASSETS     // храним материалы из интернета, сторонние видео, 2Д, 3Д, аудио
|-|-1_IMGS     // папка для изображений
|-|-2_VIDS     // папка для видеоассетов
|-|-3_COMPOUNDS
|-|-4_FUSION CLIPS
|-3_SOUND      // папка для звуковых ассетов
|-|-1_SFX      // папка для звуковых эффектов
|-|-2_MUSIC    // папка для музыки
|-4_EXPORT     // папка для версий экспорта
|-|-1_RENDERS  // папка для рендера проблемных участков
```

При выборе параметра `add smart bin` мы можем добавить умную папку в медиапул, которая будет отображать только те материалы, которые мы выберем по фильтрам

![](_png/06283f137aafe60bb2ba1192b4457d57.png)

Далее идёт *Power Bins*, который уже предоставляет одну очень важную функцию - постоянный доступ из *всех проектов* к общим ассетам, которые можно использовать во *всех проектах*

![](_png/ef4beb2a3b8079f123e60a7ea1b40c35.png)


## 4 Создание и настройка таймлайна

Во вкладке *edit* мы можем создать таймлайн из нужных нам ассетов 

![](_png/9107dfefa6af70ab7c0190869cc0ef4e.png)

Пример

![](_png/8d19c49e8a4c54ac24d79777c11d50c3.png)


## 5 Пайплайн работы с другими монтажными программами

Первым делом, нужно экспортировать из другой монтажки XML-файл с монтажом

![](_png/b17f6c1b71734d7c935ae60af4453960.png)

Далее нужно перенести футажи в проект и импортировать XML в давинчи

![](_png/203291a29c256274a15617233d809c06.png)

Уберём автоматический импорт клипов и добавим имя таймлайну

![](_png/96b193349e0a72fb6b6b64d5ad691490.png)

И далее нам нужно будет выбрать папку, в которую мы заранее перенесли исходники

![](_png/8905aa908b14d018ae04d859f1b447d9.png)

Так же, если у нас уже есть какой-либо рендер, то его можно добавить как референс для нашего монтажа

![](_png/1cd7754fbad30cb0e247f3048a9b8354.png)

Сам референс отображён шашечкой и не может быть закинут в таймлайн

![](_png/1e854b68fa557209b32b92c7bde8be82.png)

Далее мы для таймлайна устанавливаем референсный клип, который позволит нам проверить монтаж из одной монтажки в другой (нашей целевой, конечной)

![](_png/f32124f72f59c312bc2dbfe826a44a88.png)

Сведение монтажки идёт по двум окнам, где в первом выбираем шашечный оффлайн

![](_png/f07c3079db53c4b720a1337f2186b5b6.png)

Чтобы перевести квадратное видео в анаморфот, нужно выбрать нужные футажи и через ПКМ выбрать *clip attributes*

![](_png/625e7a2ca6b885d3b27c5e898156f024.png)

Так же мы можем накинуть тут своё каше на видео

![](_png/e913a907a47ee4e644fa59660c5b1f68.png)


## 6 Создание прокси. Разница между прокси и optimized media

Отличия Optimized Media и Proxy:
- прокси можно переподключить к видео, если мы переместили проект
- прокси предоставляет собой один видеофайл
- оптимизированные медиа представляют собой изображения на каждый кадр, которые нельзя переподключить

Для создания и переподключения прокси у нас есть следующие сценарии:

![](_png/d511fdea4f4fa0644e59de4ad93d7080.png)

В настройках проекта мы уже можем настроить прокси на те, что нам нужны

![](_png/cfa2ecfad520d0a0eac659834f325888.png)

Если у нас были подключены прокси в одном проекте, то нам нужно будет сначала их отключить, чтобы подключить 

![](_png/14144766fb83a761f65288354bc7c646.png)

Чтобы включать и выключать прокси, нужно воспользоваться следующей функцией:

![](_png/054005ebaeb5cab344209e5f8cd371f5.png)
