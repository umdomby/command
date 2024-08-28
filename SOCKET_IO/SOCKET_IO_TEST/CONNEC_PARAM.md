```js
// client.js
const socket = io('https://195.174.3.104:3000', { query: { myParam: 'myValue' } });

// server.js.md
io.on("connection", (socket) => console.log(socket.handshake.query.myParam);  // myValue
```

