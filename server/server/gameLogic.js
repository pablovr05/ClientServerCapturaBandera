const fs = require('fs');
const webSockets = require('./utilsWebSockets.js').default;
'use strict';

class GameLogic {
    
    constructor() {
        if (!GameLogic.instance) {
            this.clients = new Map(); // Almacena los clientes conectados
            this.lobbys = new Map();  // Almacena los lobbys activos
            GameLogic.instance = this;
        }
        return GameLogic.instance;
    }

    addClient(id, socket) {
        this.clients.set(id, {
            socket,
        });
        return this.clients.get(id);
    }

    // Es desconnecta un client
    removeClient(id) {
        this.clients.delete(id);
    }

    // Generar un código de 6 cifras para el lobby
    generateLobbyCode() {
        let code;
        do {
            code = Math.floor(100000 + Math.random() * 900000).toString();
        } while (this.lobbys.has(code)); // Evita duplicados
        return code;
    }

    // Crear un nuevo lobby con un código único de 6 cifras
    createLobby() {
        const lobbyId = this.generateLobbyCode();
        this.lobbys.set(lobbyId, new Set());
        return lobbyId;
    }

    // Añadir un cliente a un lobby
    addClientToLobby(lobbyId, clientId) {
        if (this.lobbys.has(lobbyId)) {
            this.lobbys.get(lobbyId).add(clientId);
        }
    }

    // Obtener los clientes de un lobby
    getLobbyClients(lobbyId) {
        return this.lobbys.get(lobbyId) || new Set();
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

const instance = new GameLogic();
Object.freeze(instance);
module.exports = instance;
