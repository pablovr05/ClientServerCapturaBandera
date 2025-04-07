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
        this.clients.set(id, { socket });
        return this.clients.get(id);
    }

    removeClient(id) {
        console.log(`Eliminando cliente con ID: ${id}`);
    
        // Eliminar de los lobbys
        for (const [lobbyId, lobby] of this.lobbys.entries()) {
            for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
                if (teamSet.has(id)) {
                    teamSet.delete(id);
                    console.log(`Cliente ${id} eliminado del equipo "${teamName}" en el lobby ${lobbyId}`);
                }
            }
        }
    }
    
    generateLobbyCode() {
        let code;
        do {
            code = Math.floor(100000 + Math.random() * 900000).toString();
        } while (this.lobbys.has(code));
        return code;
    }

    createLobby() {
        const lobbyId = this.generateLobbyCode();
        this.lobbys.set(lobbyId, {
            teams: {
                blue: new Set(),
                purple: new Set(),
                red: new Set(),
                yellow: new Set(),
            },
            objects: {
                projectiles: new Set(),
                gold: new Set(),
            }
        });
        return lobbyId;
    }

    addClientToLobby(lobbyId, clientId) {
        if (this.lobbys.has(lobbyId)) {
            const lobby = this.lobbys.get(lobbyId);
            const teams = Object.values(lobby.teams);
    
            let teamWithLeastPlayers = teams[0];
            for (let team of teams) {
                if (team.size < teamWithLeastPlayers.size) {
                    teamWithLeastPlayers = team;
                }
            }
    
            teamWithLeastPlayers.add(clientId);
    
            const position = this.assignInitialPosition(clientId);
            const client = this.clients.get(clientId);
            client.position = position;
    
            // Enviar mensaje al cliente
            if (client && client.socket) {
                client.socket.send(JSON.stringify({
                    type: "joinedLobby",
                    lobbyId: lobbyId,
                    team: Object.keys(lobby.teams).find(key => lobby.teams[key].has(clientId)),
                    position: position
                }));
            }
        }
    }    

    assignInitialPosition() {
        const minX = 128;
        const minY = 128;
        const maxX = 1920;
        const maxY = 1920;
    
        // Genera una posición válida dentro de los límites
        const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
    
        return { x, y };
    }

    createProjectile(team, x, y, direction) {
        const projectile = { team, x, y, direction };
        this.lobbys.forEach(lobby => {
            lobby.objects.projectiles.add(projectile);
        });
    }

    createGold(x, y) {
        const gold = { x, y };
        this.lobbys.forEach(lobby => {
            lobby.objects.gold.add(gold);
        });
    }

    getLobbyClients(lobbyId) {
        return this.lobbys.get(lobbyId) || new Set();
    }

    updateGame(fps) {
        //console.log("Se actualiza el juego");
    }

    getGameState(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return {};
    
        const players = [];
    
        for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
            for (const clientId of teamSet) {
                const client = this.clients.get(clientId);
                if (client) {
                    players.push({
                        id: clientId,
                        position: client.position,
                        team: teamName
                    });
                }
            }
        }
    
        return {
            players,
            projectiles: Array.from(lobby.objects.projectiles),
            gold: Array.from(lobby.objects.gold)
        };
    }    

    handleMessage(id, msg, socket) {
        try {
            let obj;
            try {
                obj = JSON.parse(msg);
            } catch (e) {
                // No es un JSON válido, tratamos el mensaje como string plano
                if (msg === "create lobby") {
                    const newLobbyId = this.createLobby();
                    console.log("Se ha creado un nuevo servidor: " + newLobbyId);
                    socket.send(JSON.stringify({
                        type: "lobbyCreated",
                        lobbyId: newLobbyId
                    }));
                }
                return; // Salimos aquí porque ya manejamos el mensaje
            }
    
            // Si sí es un JSON válido
            if (!obj.type) return;
    
            console.log("Mensaje de tipo: " + obj.type + " recibido de " + socket);
    
            switch (obj.type) {
                case "addClientToLobby":
                    const firstLobbyId = this.lobbys.keys().next().value;
                    
                    console.log(firstLobbyId)
                    console.log(id)

                    if (firstLobbyId) {
                        this.addClientToLobby(firstLobbyId, id);  // Añadir al primer lobby disponible
                    }

                    console.log("Se añadió un cliente al primer servidor: " + id + " al servidor: " + firstLobbyId)

                    break;
                
                    case "updateMovement": {
                        const dirX = obj.x; // entre -1 y 1
                        const dirY = obj.y;
                        const speed = 5; // o la velocidad que tú quieras ajustar
                    
                        const firstLobbyId = this.lobbys.keys().next().value;
                        if (!firstLobbyId) {
                            console.warn("No hay lobbys creados");
                            return;
                        }
                    
                        const lobby = this.lobbys.get(firstLobbyId);
                        let userFound = false;
                    
                        for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
                            if (teamSet.has(id)) {
                                const client = this.clients.get(id);
                                if (client && client.position) {
                                    client.position.x += dirX * speed;
                                    client.position.y += dirY * speed;
                                    userFound = true;
                                }
                                break;
                            }
                        }
                    
                        break;
                    }
                    

                default:
                    break;
            }
    
        } catch (error) {
            console.error("Error en handleMessage:", error);
        }
    }    
}

const instance = new GameLogic();
Object.freeze(instance);
module.exports = instance;
