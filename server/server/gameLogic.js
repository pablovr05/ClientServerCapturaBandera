const fs = require('fs');
const webSockets = require('./utilsWebSockets.js').default;
'use strict';

class GameLogic {
    
    constructor() {
        if (!GameLogic.instance) {
            this.clients = new Map();
            this.lobbys = new Map();
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

    // Crear un nuevo lobby con un código único de 6 cifras y cuatro equipos
    createLobby() {
        const lobbyId = this.generateLobbyCode();
        this.lobbys.set(lobbyId, {
            teams: {
                blue: new Set(),
                purple: new Set(),
                red: new Set(),
                yellow: new Set(),
            },
        });
        return lobbyId;
    }

    // Añadir un cliente a un lobby, repartiéndolo de manera equitativa
    addClientToLobby(lobbyId, clientId) {
        if (this.lobbys.has(lobbyId)) {
            const lobby = this.lobbys.get(lobbyId);
            const teams = Object.values(lobby.teams); // Obtener los equipos como array
            
            // Encontrar el equipo con menor número de jugadores
            let teamWithLeastPlayers = teams[0];
            for (let team of teams) {
                if (team.size < teamWithLeastPlayers.size) {
                    teamWithLeastPlayers = team;
                }
            }

            // Añadir el cliente al equipo con menos jugadores
            teamWithLeastPlayers.add(clientId);
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
