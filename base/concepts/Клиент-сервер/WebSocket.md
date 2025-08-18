#WebSocket

## Теория

Веб-сокеты - это протокол для двунаправленной связи между клиентом и сервером через интернет. Они позволяют установить постоянное соединение между браузером и сервером, который может использоваться для передачи данных в режиме реального времени.

Основные методы, используемые в веб-сокетах, включают:

1. `WebSocket()`: конструктор объекта WebSocket, который создает новый экземпляр веб-сокета.
2. `send()`: метод, который отправляет данные на сервер через веб-сокет.
3. `close()`: метод, который закрывает веб-сокет.
4. `onopen()`: событие, которое происходит при открытии соединения с сервером.
5. `onmessage()`: событие, которое происходит при получении сообщения от сервера.
6. `onerror()`: событие, которое происходит при возникновении ошибки во время работы с веб-сокетами.

При использовании веб-сокетов, клиент и сервер устанавливают постоянное соединение. Как только соединение установлено, данные можно передавать в обоих направлениях без необходимости повторного подключения или перезагрузки страницы.

При передаче данных через веб-сокеты, данные могут быть закодированы в различных форматах, таких как JSON, XML или бинарный формат. Веб-сокеты также позволяют отправлять и получать файлы, аудио и видео потоки и другие типы данных в режиме реального времени.

## Реализация

На стороне сервера создается объект `rooms`, который содержит список всех комнат и пользователей в каждой комнате. При создании новой комнаты сервер проверяет, существует ли уже комната с таким же именем, и отправляет сообщение об ошибке, если комната уже существует. Если комната не существует, сервер создает новую комнату и добавляет создателя комнаты в список ее участников.

В обработчике для присоединения к комнате сервер проверяет, существует ли комната с указанным именем, и отправляет сообщение об ошибке, если комната не существует. Если комната существует, сервер добавляет пользователя в список ее участников и отправляет всем участникам комнаты сообщение о том, что новый пользователь присоединился к комнате.

Обработчик для отправки сообщения в комнату просто передает полученные данные всем участникам комнаты, используя метод `io.to(roomName).emit()`.

Обработчик для отключения пользователя от чата удаляет пользователя из всех комнат и отправляет сообщение об уходе всем участникам соответствующих комнат.

`server.js`

```JS
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// список комнат и пользователей в каждой комнате
const rooms = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', socket => {
  console.log('User connected');

  // обработчик для создания комнаты
  socket.on('create_room', roomName => {
    console.log('Creating room', roomName);
    if (!rooms[roomName]) {
      // если комнаты не существует - создаем новую
      rooms[roomName] = [socket.id];
      socket.join(roomName);
      socket.emit('created_room', { roomName, participants: [] });
    } else {
      // иначе отправляем сообщение об ошибке
      socket.emit('error', 'Room already exists');
    }
  });

  // обработчик для присоединения к комнате
  socket.on('join_room', ({ roomName, username }) => {
    console.log(`${username} is joining ${roomName}`);
    if (rooms[roomName]) {
      // если комната существует - добавляем пользователя в нее
      rooms[roomName].push(socket.id);
      socket.join(roomName);
      const participants = rooms[roomName].map(id =>
        io.sockets.connected[id].username
      );
      io.to(roomName).emit('joined_room', { roomName, participants });
      socket.emit('room_joined', { roomName, username });
    } else {
      // иначе отправляем сообщение об ошибке
      socket.emit('error', 'Room does not exist');
    }
  });

  // обработчик для отправки сообщения в комнату
  socket.on('send_message', ({ roomName, message }) => {
    console.log(`${socket.username} sent a message to ${roomName}: ${message}`);
    io.to(roomName).emit('new_message', { roomName, message, sender: socket.username });
  });

  // обработчик для отключения пользователя от чата
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
    // удаляем пользователя из всех комнат, в которых он находился
    Object.keys(rooms).forEach(roomName => {
      if (rooms[roomName].includes(socket.id)) {
        rooms[roomName] = rooms[roomName].filter(id => id !== socket.id);
        const participants = rooms[roomName].map(id =>
          io.sockets.connected[id].username
        );
        io.to(roomName).emit('user_left', { roomName, participants, username: socket.username });
      }
    });
  });

  // добавляем имя пользователя к сокету
  socket.on('set_username', username => {
    socket.username = username;
    console.log(`Username set: ${socket.username}`);
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

Клиентский код использует две основные функции - `joinRoom()` для присоединения к комнате и `switchRoom()` для переключения на новую комнату. Когда пользователь присоединяется к комнате, он отправляет на сервер сообщение `join_room` с именем комнаты и своим именем пользователя. Сервер добавляет пользователя в список участников комнаты и отправляет всем участникам комнаты сообщение `joined_room` с списком всех участников. Каждый раз, когда пользователь отправляет сообщение в комнату, клиентский код отправляет на сервер сообщение `send_message`, которое содержит текст сообщения и имя текущей комнаты. Сервер затем отправляет всем участникам комнаты сообщение `new_message`, которое содержит текст сообщения, имя отправителя и имя текущей комнаты.

Когда пользователь покидает комнату или отключается от чата, клиент отправляет на сервер сообщение `disconnect`, который удаляет пользователя из всех комнат и отправляет соответствующие сообщения об уходе. Каждый пользователь также может задать свое имя при входе в чат, используя сообщение `set_username`.

`client.js`

```JS
const socket = io();

// обработчик для нажатия кнопки "Создать комнату"
document.getElementById('create-room').addEventListener('submit', (event) => {
	event.preventDefault();
	const roomName = document.getElementById('room-name').value;
	socket.emit('create_room', roomName);
});

// обработчик для нажатия кнопки "Присоединиться к комнате"
document.getElementById('join-room').addEventListener('submit', (event) => {
	event.preventDefault();
	const roomName = document.getElementById('room-name').value;
	const username = document.getElementById('username').value;
	socket.emit('join_room', { roomName, username });
});

// обработчик для отправки сообщения в текущую комнату
document.getElementById('send-message').addEventListener('submit', (event) => {
	event.preventDefault();
	const message = document.getElementById('message').value;
	socket.emit('send_message', { roomName: currentRoom, message });
});

// обработчик для получения сообщения от сервера о создании новой комнаты
socket.on('created_room', ({ roomName, participants }) => {
	console.log(`Room created: ${roomName}`);
	// добавляем комнату в список доступных комнат
	const roomList = document.getElementById('room-list');
	const newRoom = document.createElement('li');
	newRoom.textContent = roomName;
	newRoom.addEventListener('click', () => joinRoom(roomName));
	roomList.appendChild(newRoom);
});

// обработчик для получения сообщения от сервера о присоединении к комнате
socket.on('room_joined', ({ roomName, username }) => {
	console.log(`${username} joined ${roomName}`);
	// переключаемся на новую комнату
	switchRoom(roomName);
});

// обработчик для получения сообщения от сервера о присоединении нового пользователя к комнате
socket.on('joined_room', ({ roomName, participants }) => {
	console.log(`Participants in ${roomName}: ${participants}`);
	// отображаем список участников комнаты
	const participantList = document.getElementById('participant-list');
	participantList.innerHTML = '';
	participants.forEach((username) => {
		const newParticipant = document.createElement('li');
		newParticipant.textContent = username;
		participantList.appendChild(newParticipant);
	});
});

// обработчик для получения нового сообщения от сервера
socket.on('new_message', ({ roomName, message, sender }) => {
	console.log(`New message in ${roomName} from ${sender}: ${message}`);
	// добавляем сообщение в чат
	const chatBox = document.getElementById('chat-box');
	const newMessage = document.createElement('div');
	newMessage.classList.add('message');
	newMessage.innerHTML = `<span class="sender">${sender}</span>: ${message}`;
	chatBox.appendChild(newMessage);
});

// обработчик для получения сообщения от сервера о том, что пользователь покинул комнату
socket.on('user_left', ({ roomName, participants, username }) => {
	console.log(`${username} left ${roomName}`);
	// отображаем список участников комнаты
	const participantList = document.getElementById('participant-list');
	participantList.innerHTML = '';
	participants.forEach((username) => {
		const newParticipant = document.createElement('li');
		newParticipant.textContent = username;
		participantList.appendChild(newParticipant);
	});
});

// функция для переключения на новую комнату
function switchRoom(roomName) {
	currentRoom = roomName;
	console.log(`Switching to room: ${roomName}`);
	// отображаем имя текущей комнаты
	const currentRoomTitle = document.getElementById('current-room-title');
	currentRoomTitle.textContent = roomName;
	// очищаем чат
	const chatBox = document.getElementById('chat-box');
	chatBox.innerHTML = '';
	// запрашиваем список участников комнаты
	socket.emit('get_participants', roomName);
}

// функция для присоединения к комнате
function joinRoom(roomName) {
	console.log(`Joining room: ${roomName}`);
	const username = document.getElementById('username').value;
	socket.emit('join_room', { roomName, username });
}

// инициализация приложения
let currentRoom;
switchRoom('general');
```
