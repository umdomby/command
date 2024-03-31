# Шпаргалка по Emit
---

```js
io.on('connect', onConnect);
function onConnect(socket){
  // отправка клиенту
  socket.emit('hello', 'can you hear me?', 1, 2, 'abc');
  // отправка всем клиентам, кроме отправителя
  socket.broadcast.emit('broadcast', 'hello friends!');
  // отправка всем клиентам комнаты 'game', кроме отправителя
  socket.to('game').emit('nice game', "let's play a game");
  // отправка всем клиентам комнат 'game1' и/или 'game2' , кроме отправителя
  socket.to('game1').to('game2').emit('nice game', "let's play a game (too)");
  // отправка всем клиентам комнаты 'game' , включая отправителя
  io.in('game').emit('big-announcement', 'the game will start soon');
  // отправка всем клиентам пространства имен 'myNamespace', включая отправителя
  io.of('myNamespace').emit('bigger-announcement', 'the tournament will start soon');
  // отправка в определенную комнату в определенном пространстве имен, включая отправителя
  io.of('myNamespace').to('room').emit('event', 'message');
  // отправка на индивидуальный socketid (личное сообщение)
  io.to(`${socketId}`).emit('hey', 'I just met you');
  // ВНИМАНИЕ: `socket.to(socket.id).emit()` НЕ будет работать, как бы мы отправляли сообщение всем в комнату
  // `socket.id`, а не отправителю. Вместо этого, используйте `socket.emit()`.
  // отправка с подтверждением
  socket.emit('question', 'do you think so?', function (answer) {});
  // отправка без сжатия
  socket.compress(false).emit('uncompressed', "that's rough");
  // отправка сообщения, которое может быть отброшено, если клиент не готов к приему сообщений
  socket.volatile.emit('maybe', 'do you really need it?');
  // указание, имеют ли данные для отправки двоичные данные
  socket.binary(false).emit('what', 'I have no binaries!');
  // отправка всем клиентам на этом узле (при использовании нескольких узлов)
  io.local.emit('hi', 'my lovely babies');
  // отправка всем подключенным клиентам
  io.emit('an event sent to all connected clients');
};
```

Если вам не важна логика переподключения и тому подобное, посмотрите <a href="https://github.com/socketio/engine.io">Engine.IO</a>,  который использует Socket.IO и является транспортным уровнем WebSocket.

# Комнаты и пространства имен
## Пространства имен

SocketIO позволяет вам «именовать» свои сокеты, то есть назначать различные *конечные точки* (*endpoints*) или *пути* (*paths*).

Это полезная функция, позволяющая минимизировать количество ресурсов (TCP-соединений) и в то же время разделять проблемы в вашем приложении за счет разделения каналов связи.

### Пространство имен по умолчанию

Мы называем пространством имен по умолчанию `/`, и это то, к чему клиенты SocketIO подключаются по умолчанию, и то, которое сервер слушает по умолчанию.

Это пространство имен задается с помощью `io.sockets` или `io`:

```js
// оба примера будут генерировать все сокеты, подключенные к`/`
io.sockets.emit('hi', 'everyone');
io.emit('hi', 'everyone'); // краткая форма
```

Каждое пространство имен генерирует событие `connection`, которое получает каждый экземпляр `Socket` в качестве параметра

```js
io.on('connection', function(socket){
  socket.on('disconnect', function(){ });
});
```

### Пользовательские пространства имен

Чтобы настроить собственное пространство имен, вы должны вызвать функцию `of` на стороне сервера:

```js
const nsp = io.of('/my-namespace');
nsp.on('connection', function(socket){
  console.log('someone connected');
});
nsp.emit('hi', 'everyone!');
```

На стороне клиента вы подключаете SocketIO к этому пространству имен:
```js
const socket = io('/my-namespace');
```

**ВАЖНО:** Пространство имен является частью реализации протокола SocketIO и не связано с фактическим URL-адресом базового транспортного протокола, который по умолчанию равен `/socket.io/…`.

## Комнаты

В каждом пространстве имен вы также можете определить произвольные каналы, которые сокеты могут `присоединять` (`join`) и `покидать` (`leave`).

### Подключение и отключение

Вы можете вызвать `join`, чтобы подписать сокет на данный канал:

```js
io.on('connection', function(socket){
  socket.join('some room');
});
```

А затем  используйте `to` или` in` (они одинаковы) при трансляции(broadcasting) или генерации(emitting):

```js
io.to('some room').emit('some event');
```

Чтобы выйти из канала, вы вызываете `exit` так же, как` join`.

### Комната по умолчанию

Каждый `Socket` в SocketIO идентифицируется случайным, неопределяемым, уникальным идентификатором `Socket#id`. Для удобства каждый сокет автоматически присоединяется к комнате, идентифицируемой этим идентификатором.

Это позволяет легко транслировать сообщения на другие сокеты:

```js
io.on('connection', function(socket){
  socket.on('say to someone', function(id, msg){
    socket.broadcast.to(id).emit('my message', msg);
  });
});
```

