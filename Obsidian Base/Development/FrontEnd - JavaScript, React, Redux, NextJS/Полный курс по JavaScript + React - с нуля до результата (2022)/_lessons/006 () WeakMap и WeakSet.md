### **006 () WeakMap и WeakSet**

- Как мы знаем, сборщик мусора удаляет объекты, на которых уже нет ссылок в проекте. В данном примере ссылка на объект остаётся в массиве и поэтому он не стирается
![](_png/Pasted%20image%2020220909165050.png)
- Уже в этом примере объект не стирается, так как ссылку на объект хранит в себе карта
![](_png/Pasted%20image%2020220909165057.png)
- И дальше у нас идёт объект WeakMap. Это объект, у которого

1) ключи – только объекты

2) При отсутствии ссылки на объект извне – объект будет удалён сборщиком мусора

- Если сейчас мы решим проверить значения через **keys****()**, то мы получим ошибку, так как таких методов как keys, values и entries – не существует для такой карты. Get, set, delete, has – единственные методы, которые у нас остаются от обычной карты. Поэтому проверим через наличие значения **has****()**

Если мы выведем просто карту, то наш интерпретатор не будет понимать, что за объект находится в карте
![](_png/Pasted%20image%2020220909165105.png)
![](_png/Pasted%20image%2020220909165112.png)
- Самый простой пример использования WeakMap – это отображение пользователей в онлайне в каком-нибудь чате. Если пользователь offline, то он получает значение null и скрывается из онлайна чата.

-
![](_png/Pasted%20image%2020220909165121.png)
- И уже дальше у нас идёт WeakSet. Если Set хранит в себе только уникальные значения массива, то WeakSet хранит эти значения только до тех пор, пока хоть какой-то объект ссылается на них в проекте. WeakSet поддерживает только add, has, delete.

- Пример реализации прочитанных сообщений. ВикСет принимает в себя значения массива с сообщениями. Как прочитать сообщение можно один раз, так и добавить в прочитанные сообщения система одно сообщение может только один раз.

И тут у нас сразу видна такая структура WeakSet. В него мы добавили 3 разных объекта. Далее мы обращаемся к наличию третьего элемента в этом сете. Но так как мы из массива удалили первый элемент, то он съехал на одно значение назад и сам виксет теперь имеет только 2 значения вместо трёх, как это было до стирания первого элемента (при стирании объекта из массива все элементы по индексам сдвигаются на один элемент к началу)
![](_png/Pasted%20image%2020220909165145.png)