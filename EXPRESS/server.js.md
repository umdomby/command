const Pl = require('./models/Pl');
const Jook = require('./models/Jook');
// const Connection = require('./Server/models/Connections');
// const Message = require('./Server/models/Messages');
// const Message = require('./Server/models/Messages');

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const app = express();

const WebSocketServer = require('ws').Server;
//const WebSocket = require('ws');

require('dotenv').config()
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
app.use(cors())
app.use(express.json({extended: true}))
app.use(express.static(path.resolve(__dirname, 'static')))


const privateKey = fs.readFileSync(path.resolve(__dirname, './cert/serbotonline/privkey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname, './cert/serbotonline/cert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname, './cert/serbotonline/chain.pem'));

// const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/serbotonline/key.key'));
// const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/serbotonline/cert.crt'));

util = require('util');
var filepath = path.join(__dirname, './public/1.mp3');
app.get('/1.mp3', function (req, res) {
    res.set({'Content-Type': 'audio/mpeg'});
    var readStream = fs.createReadStream(filepath);
    readStream.pipe(res);
})

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

app.use((req, res) => {
    res.send('Hello there !');
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const start = async () => {

    try {
        // await mongoose.connect(process.env.DATABASE_URL)
        //     .then(() => console.log("Successfully connect to MongoDB."))
        //     .catch(err => console.error("Connection error", err));

        const wsa = new WebSocketServer({server: httpServer});
        wsa.on('connection', ws => {

            ws.send('connected WS server')
            ws.on('message', msgg => {
                msg = JSON.parse(msgg)
                switch (msg.method) {
                    case "connection":
                        console.log(msg.connected + ' case connection ws.on ' + msg.id + ' ' )
                        ws.id = msg.id
                        wsaSend(JSON.stringify({method: 'connection', id : msg.id}), ws)
                        break;
                    case "testFromArduino":
                        console.log('Frontend --> Server --> Arduino --> Server ' + ' id: ' + msg.id + " OnOff: " + msg.messageOnOff)
                        break;
                    case "messagesOnOff":
                        // let mess8 = JSON.stringify({
                        //     method: 'messagesOnOff',
                        //     messageOnOff: msg.messageOnOff,
                        // })
                        console.log(msg.id + ' Frontend --> Server  OnOff: ' + msg.messageOnOff)
                        //to Arduino
                        let mess11 = JSON.stringify({
                            method: 'test',
                            id : msg.id,
                            messageOnOff: msg.messageOnOff,
                        })
                        //wssSend(mess8, ws)
                        wsaSend(mess11, ws)
                        break;
                    case 'connectByte':
                        //console.log('id ' + msg.id + ' connectByte ' + msg.connectByte)
                        let mess12 = JSON.stringify({
                            method: 'connectByte',
                            connectByte: msg.connectByte,
                        })
                        wsaSend(mess12, ws)
                        break;
                    // case 'arduino':
                    //     console.log('id ' + msg.id + ' ' + msg.txt + ' OnOff ' + msg.messageOnOff)
                    //     break;
                    default:
                    //console.log('default')
                        wsaSend(msgg, ws)
                }
            })
        })

        const wss = new WebSocketServer({server: httpsServer});
        wss.on('connection', ws => {
            ws.on('message', async msgg => {
                try {
                    msg = JSON.parse(msgg)
                    switch (msg.method) {
                        case "connection":
                            console.log('Connected Chrome id ' + msg.id)
                            console.log('persId ' + msg.persId)
                            ws.id = msg.id
                            ws.persId = msg.persId
                            wss.clients.forEach(function each(client) {
                                console.log('client.id connection Chrome ' + client.id)
                            });
                            wsa.clients.forEach(function each(client) {
                                console.log('client.id connection arduino ' + client.id)
                            });
                            const mess = JSON.stringify({
                                method: 'connection',
                                id: msg.id,
                                persId: msg.persId
                            })
                            wssSend(mess, ws)

                            await Pl.find({socketId: msg.id}).then(pl => {
                                wssSendPersIdOne(JSON.stringify({
                                    method: 'mongoMusicToClient',
                                    message: pl
                                }), ws)
                            })

                            await Jook.find({socketId: msg.id}).then(jook => {
                                wssSendPersIdOne(JSON.stringify({
                                    method: 'mongoJookToClient',
                                    message: jook
                                }), ws)
                            })
                            break;

                        case "mongoMusic":
                            const pl = new Pl({link: msg.link, name: msg.name, pl: msg.pl, socketId: ws.id});
                            await pl.save();
                            await Pl.find({socketId: msg.id}).then(pl => {
                                wssSendPersIdOne(JSON.stringify({
                                    method: 'mongoMusicToClient',
                                    message: pl
                                }), ws)
                            })
                            break

                        case "mongoMusicPl":
                            await Pl.find({socketId: msg.id, pl: msg.message}).then(pl => {
                                wssSendPersIdOne(JSON.stringify({
                                    method: 'mongoMusicToClient',
                                    message: pl
                                }), ws)
                            })
                            break

                        case "mongoMusicDel":
                            await Pl.remove({"_id": msg.message});
                            await Pl.find({socketId: msg.id}).then(pl => {
                                wssSendPersIdOne(JSON.stringify({
                                    method: 'mongoMusicToClient',
                                    message: pl
                                }), ws)
                            })
                            break

                        case "mongoJook":
                            console.log(msg.txtJook + msg.name + msg.pl + ws.id)
                            const jook = new Jook({txtJook: msg.txtJook, name: msg.name, pl: msg.pl, socketId: ws.id});
                            await jook.save();
                            await Jook.find({socketId: msg.id}).then(pl => {
                                wssSendPersIdOne(JSON.stringify({
                                    method: 'mongoJookToClient',
                                    message: pl
                                }), ws)
                            })
                            break

                        case "mongoJookDel":
                            await Jook.remove({"_id": msg.message});
                            await Jook.find({socketId: msg.id}).then(jook => {
                                wssSendPersIdOne(JSON.stringify({
                                    method: 'mongoJookToClient',
                                    message: jook
                                }), ws)
                            })
                            break

                        default:
                            // console.log('default method: ' + msg.method + ' message: ' + msg.message)
                            if (msg.meSend === false && msg.meSend !== undefined) {
                                wssSendPersId(JSON.stringify(msg), ws)
                                // console.log('message: ' + msg.message)
                            } else if (msg.meSend === true && msg.meSend !== undefined) {
                                wssSend(JSON.stringify(msg), ws)
                                // console.log('message: ' + msg.message)
                            } else {
                                wsaSend(msgg, ws)
                                console.log(msg)
                            }
                            break;
                    }
                } catch (e) {
                    console.log(e)
                }
                //wsaSend(msgg, ws)
            })
        })

        const wsaSend = (mess, ws) => {
            wsa.clients.forEach(function each(client) {
                //console.log('client.id ' + client.id + ' ws.id  ' + ws.id );
                if (client.id === ws.id && client.readyState === client.OPEN) {
                    client.send(mess)
                }
            });
        }
        const wssSendPersIdOne = (mess, ws) => {
            wss.clients.forEach(function each(client) {
                if (client.persId === ws.persId && client.readyState === client.OPEN) {
                    client.send(mess)
                }
            });
        }
        const wssSendPersId = (mess, ws) => {
            wss.clients.forEach(function each(client) {
                if (client.id === ws.id && client.persId !== ws.persId && client.readyState === client.OPEN) {
                    //if (client.id === ws.id && client.readyState === client.OPEN) {
                    client.send(mess)
                }
            });
        }
        const wssSend = (mess, ws) => {
            wss.clients.forEach(function each(client) {
                if (client.id === ws.id && client.readyState === client.OPEN) {
                    client.send(mess)
                }
            });
        }

        httpServer.listen(process.env.PORT_HTTP, () => {
            console.log('HTTP Server running on port 8081 for Arduino');
        });
        httpsServer.listen(process.env.PORT_HTTPS, () => {
            console.log('HTTPS Server running on port 4443');
        });

    } catch (e) {
        console.log(e)
    }
}

start()
