```js
// client side code
var socket = io.connect();
socket.emit('create', 'room1');

// server side code
io.sockets.on('connection', function(socket) {
  socket.on('create', function(room) {
    socket.join(room);
  });
});
```


```js
//client
const [myId, setMyId] = useState(localStorage.getItem('myId') || '')
useEffect(()=>{
    socket.current = io("https://servicerobot.pro:4433/", { query: { id: myId } });
})

//server
io.on('connection', (socket) => {
    const room = socket.handshake.query.id
    //socket.join(room);
    io.to(room).emit('hello','hello room ' + room);
})

```