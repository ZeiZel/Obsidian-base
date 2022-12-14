### **006 Promise (ES6)**

- Promise (обещание) – это блок кода, который будет выполняться асинхронно относительно другого кода. Промис позволяет избежать «**collback****-****hell**» ситуации, когда у нас огромное количество таймаутов и вложенных функций

- Это код через сетТаймауты, который не гарантирует нам 100% на выполнение кода и может выдать ошибку
![](_png/Pasted%20image%2020220909180841.png)
- И коротко о том, что такое промисы. Они позволяют реализовать код, который обещают выполнить асинхронно относительно остального кода – они не останавливают выполнение основного потока кода и выполняются параллельно

Промисы создаются через конструктор. Внутрь промиса вкладывается функция, которая принимает в себя два аргумента – resolve и reject, которые тоже являются функциями. Обе вложенные функции отвечают за возврат значения в разных ситуациях.

resolve – возвращает значение, когда функция выполнилась успешно  

reject – возвращает значение, когда функция выполнилась с ошибкой

Дальше идёт уже чейновая природа обработки промиса. Мы пишем имя промиса и **then**().(много then).**catch**().(много catch).**finally**(). Каждый чейн выполняет свою работу, которую мы для него пропишем. **then** срабатывает, когда промис завершается резолвом и так же резолв передаёт своё значение в этот then. **catch** срабатывает, когда промис завершается реджектом и реджект так же передаёт вписанное в него значения в этот кэтч
![](_png/Pasted%20image%2020220909180849.png)
- И опять же про природу чейнов. Мы могли бы полностью прописывать промисы внутри thenов и создавать всё новые и новые промисы. Однако из thenов мы можем возвращать промисы (будет возвращаться значение внутри резолва или реджекта) и данные будут передаваться дальше по цепочке (выполнилось – передалось дальше и так бесконечно)
![](_png/Pasted%20image%2020220909180859.png)
![](_png/Pasted%20image%2020220909180908.png)
- И основной мем, из-за которого мы используем промисы – это их чейновое выполнение. Конкретно тут выполняется сначала первый промис, потом резолв возвращает в then объект. Внутри первого чейна создаём новый промис, который у нас возвращается через ретёрн (возвращается то, что передаёт резолв при выполнении промиса). Дальше у нас идут ещё два чейна, которые выполняют действия последовательно друг за другом
![](_png/Pasted%20image%2020220909180913.png)
- И если у нас выполняется в конце промиса **reject**, то блок кода чейнится в **catch** (вместо then)
![](_png/Pasted%20image%2020220909180921.png)
- Чейн **finally** срабатывает при любом исходе промиса (реджект/резолв) и всегда добавляется в конец
![](_png/Pasted%20image%2020220909180926.png)
- Тут пример небольшого промиса для следующих двух методов
![](_png/Pasted%20image%2020220909180931.png)
- И далее идёт так же важная команда, которая позволяет реализовать выполнение кода при выполнении сразу нескольких промисов. Например, мы отправили запрос на несколько разных серверов и нам обязательно нужно, чтобы выполнились сразу все нужные запросы (ну будем использовать сразу несколько картинок для иллюстрации чего-то)

Promise.all
![](_png/Pasted%20image%2020220909180940.png)
- И так же есть метод, который выполняется сразу при выполнении первого промиса – Promise.race()
![](_png/Pasted%20image%2020220909180951.png)