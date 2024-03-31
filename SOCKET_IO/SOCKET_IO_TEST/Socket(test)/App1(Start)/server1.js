const path = require('path');
const express = require('express');
const app = express();
const fs = require("fs");
require('dotenv').config();
const privateKey = fs.readFileSync(path.resolve(__dirname, '../cert/serbotonline/privkey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname, '../cert/serbotonline/cert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname, '../cert/serbotonline/chain.pem'));
const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};
const https = require('https');
const httpsServer = https.createServer(credentials, app);
const io = require('socket.io')(httpsServer);

io.on('connection', socket => {
//Sender
    socket.emit("hello", "world", (response) => {
        console.log(response); // "got it"
    });
//Receiver
    socket.on("hello", (arg, callback) => {
        console.log(arg); // "world"
        callback("got it");
    });
//timeout
//     socket.timeout(5000).emit("hello", "world", (err, response) => {
//         if (err) {
//             // the other side did not acknowledge the event in the given delay
//         } else {
//             console.log(response); // "got it"
//         }
//     });

// Multiplexing
// to all connected clients
    io.emit("hello");

// to all connected clients in the "news" room
    io.to("news").emit("hello");
});

const publicPath = path.join(__dirname, '../client/build');
app.use(express.static(publicPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

const port = process.env.SERVER_PORT_HTTPS || 4444
httpsServer.listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});