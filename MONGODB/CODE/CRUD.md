client
```
    const sendMusicMongoDel = (_id) => {
        store.webSocket.send(JSON.stringify({
            id: store.idSocket,
            method: 'mongoMusicDel',
            message: _id
        }))
    }
    <button onClick={()=>sendMusicMongoDel(mongoMusic._id)}>Dell</button>
```
server
```
    await Pl.remove({"_id":msg.message});
    await Pl.find({socketId: msg.id}).then(pl => {
        wssSendPersIdOne(JSON.stringify({
            method: 'mongoMusicToClient',
            message: pl
        }), ws)
    })
```