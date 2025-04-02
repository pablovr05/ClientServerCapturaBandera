const fs = require('fs');
const webSockets = require('./utilsWebSockets.js').default;
'use strict';

class GameLogic {
    constructor() {
        this.players = new Map();
    }

    // Es connecta un client/jugador
    addClient(id, socket) {

        this.players.set(id, {
            socket,
        });
        return this.players.get(id);
    }

    // Es desconnecta un client/jugador
    removeClient(id) {
        this.players.delete(id);
    }

    // Tractar un missatge d'un client/jugador
    handleMessage(id, msg, socket) {
        try {
            let obj = JSON.parse(msg);
            if (!obj.type) return;
            console.log("Mensaje de tipo: " + obj.type + " recibido de " + socket)
            switch (obj.type) {
                case "touch":
                    console.log(msg)
                    socket.send(JSON.stringify({
                        type: "touch",
                        id: obj.x,
                        x: obj.y,
                    }));
                    break;
                default:
                    break;
            }
        } catch (error) {}
    }
}

module.exports = GameLogic;
