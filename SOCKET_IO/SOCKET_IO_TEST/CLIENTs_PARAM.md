```js
//server
var util = require("util"),
    io = require('/socket.io').listen(8080),
    fs = require('fs'),
    os = require('os'),
    url = require('url');

var clients =[];

io.sockets.on('connection', function (socket) {

    socket.on('storeClientInfo', function (data) {

        var clientInfo = new Object();
        clientInfo.customId     = data.customId;
        clientInfo.clientId     = socket.id;
        clients.push(clientInfo);
    });

    socket.on('disconnect', function (data) {

        for( var i=0, len=clients.length; i<len; ++i ){
            var c = clients[i];

            if(c.clientId == socket.id){
                clients.splice(i,1);
                break;
            }
        }

    });
});
```
```js
//client
var socket = io.connect('http://localhost', {port: 8080});
socket.on('connect', function (data) {
    socket.emit('storeClientInfo', { customId:"000CustomIdHere0000" });
});
```


