const {rooms} = socket;

Array.from(rooms)
    // LEAVE ONLY CLIENT CREATED ROOM
    .filter(roomID => roomID.length < 8)
    .forEach(roomID => {

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        clients
            .forEach(clientID => {
                io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
                    peerID: socket.id,
                });

                socket.emit(ACTIONS.REMOVE_PEER, {
                    peerID: clientID,
                });
            });

        socket.leave(roomID);
    });