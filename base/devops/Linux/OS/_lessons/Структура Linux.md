
## Ядро Linux 

Ядро - это посредник между железом и выполняемыми процессами в ОС

![](_png/39645ed38720b9f9edbc11e94cfee305.png)

Изначальные системы шли без ядра и напрямую работали с системными ресурсами. Такой подход был очень неудобен, так как ресурсы могли отбираться другими процессами. ОС с Ядром предоставляли возможность писать приложения не под конкретную ОС, а под определённое ядро, которым пользовалось сразу несколько ОС, что упрощало миграцию приложений.

![](_png/1316b6433c02db529676fdf17ba7a21e.png)

Во-многом разработка приложений сильно упростилась после перехода операционных систем на использование конкретного ядра, которое могло быть совместимо между системами.

![](_png/b28a16117e8b407ed86a769d7152c465.png)

Самый простой и понятный пример использования ядра - это компания, в которой ядром является транспортная компания. Она скрывает под капотом все бизнес-процессы, которые нужны для выполнения операций и не заставляет клиентов обращаться напрямую к различным магазинам и отделам компании по вопросам того, как получить определённый нужный им товар.

![](_png/812f044ae15c766285ff1620f77754e8.png)

Ядро само определяет приоритетные ресурсы, выделяет нужное количество места на диске и само контролирует выделение определённого количества ресурсов для процесса.

![](_png/232ea696efcece669ceaaab2220797ed.png)

Есть несколько типов ядер. Чем ближе драйвер к аппаратному устройству, тем быстрее будут выполняться операции, но тем ниже будет отказоустойчивость.

Так же ядра делятся на несколько типов, которые имеют свои преимущества.

![](_png/ce31d49e130a516479cdaece4e8a5c76.png)

Ядро же самого Linux является монолитным. Оно выполяет все основные операции от управления памятью и процессами до контроля безопасности.

У всех компонентов ядра одно адресное пространство, что привдёт к сбою всей системы, если поломается хотя бы одна часть. 

Но само ядро является модульным, что позволяет расширять функционал системы

![](_png/6edf13bb81012a402e16b74b85160b15.png)

Мы можем использовать команду `uname` для определения версии и типа ядра. 

Каждый дистрибутив использует свою версию ядра и все версии находятся на `kernel.org` 

![](_png/9a99636f6e2125bada216c3d544124c0.png)

В целом существует множество дистрибутивов, которые предоставляюит разное оригинальное ПО для своих систем, но все построены на базе GNU Linux

![](_png/d2c34492de2fe9bc07b27a658ad360c6.png)

Всего ядро делится на два пространства:
- User Space - это пространство, в котором выполняются операции пользователя ОС
- Kernel Space - это пространство, которое занимается менеджментом, выполнением системных операций и общением с железом 

![](_png/38ab7aabe2c41bfebf94d8d48be0935c.png)

Для выполнения операции по открытию файла, мы должны дёрнуть одну из операций системного вызова linux, которая предоставит нам возможность выполнить определённые действия внутри нашего ПК на железе

Всего linux хранит около 380 различных операций

![](_png/9147a3a8d0069665afa22d0e90d83e3c.png)

## POSIX

POSIX - это набор стандартов интерфейсов, которые описывают взаимодействия между ОС и приложением.

Данный интерфейс позволяет нам переносить исходный код между дистрибутивами Linux и компилировать программу под нужный нам дистрибутив, так как он общается по интерфейсу POSIX с ядром.

![](_png/3dbba36a63656c9d9ca1479149e5484c.png)

Нужно сказать, что POSIX - это всего лишь набор правил, по которым должно работать приложение в пространстве пользователя. Сам же стандарт не относится никак к ядру. 

![](_png/da4cde2d4071c5e7bb4d36e5fc46376d.png)

## Работа с железом

Если представит работу с внешним диском в лиуксе, то его можно представить так:
- мы подключаем USB в компьютер
- ядро создаёт ивент
- пространство пользователя его слушает

![](_png/3e221a2d28612ff0e7eaabe8037ec541.png)

`dmesk` отображает сообщения из области ядра

![](_png/896371824f3ef790969eafcf4b4ad485.png)

Первая команда выведет девайсы устройства, которые видит ядро. Последним параметром было передано имя устройства.

Вторая команда выводит сведения о событиях ядра

![](_png/6c04555c96f9600da79e27be07a88f53.png)

`lspci` - выводит список всех PCI устройств

![](_png/34e330ba9d7bb251fc6b5529b856d2ee.png)

`lsblk` - выводит список физических дисков системы. Так же тут можно увидеть мажорные и минорные номера. Мажорные определяют тип диска, а минорные являются просто идентификаторами мажорных устройств

![](_png/954b6aea89e0b99ab2df1d7716773197.png)

Вывод данных о процессоре

![](_png/4d59ef0d689952118162147fb00bbe08.png)

Вывод памяти

`free` - выведет количество свободной и использованной ОЗУ

![](_png/24d441b0505430117f9e9a034c3677a1.png)

`lshw` - команда для вывода информации целиком об оборудовании 

![](_png/52ddb9597fff208fea1b47f0d86dd7a7.png)

## Порядок Загрузки в Linux 

![](_png/8668aef3fd49017778d31ecf1e66fbcf.jpg)

1. Самотестирование BIOS перед включением
2. Запуск загрузочного кода из Master Boot Record
3. Далее идёт GRUB2, который позволит определить параметры загрузки для последующего шага
4. Инициализация ядра
5. Процесс инициализации. Подготавливает пользовательское пространство и запускает начальные процессы. Зачастую этим занимается даемон systemd, который отвечает за монтирование хоста

![](_png/375a4645956d5d039f704cb4a0a7bfa4.png)



![](_png/ed06710010248c92211055907de6f8cf.png)

Чтобы узнать, какой загрущик использует система, можно воспользоваться командой `ls -l /sbin/init`

![](_png/54296bc395c7bf26ad464c26ee3c2e1a.png)

## Runlevels 

Runlevels - это метод запуска ОС. Есть несколько режимов запуска системы, но из основных - это N5 (GUI) и N3 (консоль).

Так как линукс зачастую используется на серверах, то и запускать мы можем только командную строку. 

![](_png/7010c6cf763556277b11120fd1cd0efa.png)

![](_png/5979b1ee378c7a17472ff46bb2b45dac.png)

Таким образом можно поменять способ загрузки системы

![](_png/be7a6bc228f98d8a3af2192f28d605fb.png)

## Типы Файлов 

Всё в Linux является файлом

![](_png/3d824b9e972864459a9b38c32ecf4985.png)

Существует глобально три типа файлов:
- Обычные
- Директории
- Специальные файлы

![](_png/9c059ed2bfffc32b70015bf4a92710b1.png)

Далее идут специальные файлы:
1. Символьные файлы - хранятся в dev / позволяют обмениваться данными с устройствами ввода / вывода
2. Блочные файлы - так же хранится в dev / считываются блоками используя буфер (ОЗУ/ПЗУ)
3. Ссылки
4. Сокет - обеспечивает связь между двумя процесами
5. Именованый канал - определяет один процесс в качестве входа к другому
6. Дверь - передаёт код из клиентского процесса в серверный

![](_png/3b6fb7ed9c0fffd786c1e82442add1b1.png)

Просмотреть тип файла можно командой `file`

![](_png/b227967fab55c59ce4593310837791b4.png)

А так же его можно вывести через `ls -ld`

![](_png/fa5352a2997bd92cd30d7221ae31da9e.png)
## Ссылки 

Файлы-ссылки в Linux, как упоминалось ранее, делятся на жёсткие и мягкие. Вся информация о положении файла привязана к дескриптору (iNode), к которому привязаны сведения о файле.

Hard link - это имя файла в системе линукс. Используется он как указатель на дескриптор файла.

![](_png/c67829f8e8e80eb604a7ab807ff40461.png)

Таких ссылок может быть несколько на один файл в системе. Несколько их делается для большего удобства в использовании.

![](_png/36b90f5c99d26fb81669f2ed3512d854.png)

Soft link - это ссылка на жёсткую ссылку. Она выступает в роли ярлыка в рабочей системе. 

![](_png/ead8634f779a5f37a8df433aecd21476.png)

Создавать жёсткие ссылки можно с использованием `ln`, а мягкие с `ln -s`. Жёсткие не меняют дескриптор памяти и всегда ссылаются только на него. Каждая жёсткая ссылка хранит количество таких же жёстких ссылок. 

Мягкие ссылки создают отдельный дескриптор файла и только отображают, на какую жёсткую ссылку ссылаются.

![](_png/686b1334c59afd94c6713c68e9b8339f.png)








