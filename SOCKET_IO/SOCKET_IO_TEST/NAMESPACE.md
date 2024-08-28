На вашем сервере не забудьте также указать путь:

```js
var io  = require('socket.io')(http, { path: '/myapp/socket.io'});

io
.of('/my-namespace')
.on('connection', function(socket){
    console.log('a user connected with id %s', socket.id);

    socket.on('my-message', function (data) {
        io.of('my-namespace').emit('my-message', data);
        // or socket.emit(...)
        console.log('broadcasting my-message', data);
    });
});
```

На своем клиенте не путайте пространство имен и путь:

```js
var socket = io('http://www.example.com/my-namespace', { path: '/myapp/socket.io'});
```