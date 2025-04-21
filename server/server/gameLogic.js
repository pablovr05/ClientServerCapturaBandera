const fs = require('fs');
const path = require('path');
class GameLogic {
    constructor() {
        if (!GameLogic.instance) {
            this.clients = new Map();
            this.lobbys = new Map();
            this.mapData = this.loadMapData(); // cargamos el mapa
    
            GameLogic.instance = this;
        }
        return GameLogic.instance;
    }
    
    loadMapData() {
        const filePath = path.join(__dirname, 'assets', 'game_data.json');
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const map = JSON.parse(data);
            console.log("Mapa cargado correctamente.");
            return map;
        } catch (err) {
            console.error("Error cargando el mapa:", err);
            return null;
        }
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
        
        // Create the lobby with initial teams and objects
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
            },
            spectators: new Set(),
        });

        // Add gold to the newly created lobby
        this.addGoldToLobby(lobbyId);

        return lobbyId;
    }

    addGoldToLobby(lobbyId) {
        // Define the boundaries for random position generation
        const minX = 128;
        const minY = 128;
        const maxX = 1920;
        const maxY = 1920;
        
        // Generate a random position for the gold within the boundaries
        const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
        
        // Create a gold object with the generated position
        const gold = {
            type: 'gold',
            position: { x, y }
        };
        
        // Add the gold object to the lobby objects
        const lobby = this.lobbys.get(lobbyId);
        if (lobby) {
            lobby.objects.gold.add(gold);
            console.log(`Gold added to lobby ${lobbyId} at position: (${x}, ${y})`);
        } else {
            console.warn(`Lobby with ID ${lobbyId} not found`);
        }
    }
    
    addSpectatorToLobby(lobbyId, clientId) {
        if (this.lobbys.has(lobbyId)) {
            const lobby = this.lobbys.get(lobbyId);
    
            lobby.spectators.add(clientId);
    
            const client = this.clients.get(clientId);
    
            if (client && client.socket) {
                client.socket.send(JSON.stringify({
                    type: "joinedAsSpectator",
                    lobbyId: lobbyId,
                }));
            }
        }
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
            client.state = "IDLE"
    
            // Enviar mensaje al cliente
            if (client && client.socket) {
                client.socket.send(JSON.stringify({
                    type: "joinedLobby",
                    lobbyId: lobbyId,
                    team: Object.keys(lobby.teams).find(key => lobby.teams[key].has(clientId)),
                    position: position,
                    state: client.state,
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

    getLobbyClients(lobbyId) {
        return this.lobbys.get(lobbyId) || new Set();
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
                        state: client.state,
                        team: teamName
                    });
                }
            }
        }
    
        return {
            players,
            projectiles: Array.from(lobby.objects.projectiles),
            gold: Array.from(lobby.objects.gold),
            spectators: Array.from(lobby.spectators),
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
    
            //console.log("Mensaje de tipo: " + obj.type + " recibido de " + socket);
    
            switch (obj.type) {
                case "addClientToLobby":
                    const firstLobbyId = this.lobbys.keys().next().value;

                    if (firstLobbyId) {
                        this.addClientToLobby(firstLobbyId, id);  // Añadir al primer lobby disponible
                    }

                    console.log("Se añadió un cliente al primer servidor: " + id + " al servidor: " + firstLobbyId)

                    break;
                
                case "addSpectatorToLobby": {
                        const firstLobbyId = this.lobbys.keys().next().value;
    
                        if (firstLobbyId) {
                            this.addSpectatorToLobby(firstLobbyId, id);  // Añadir al primer lobby disponible
                        }
    
                        console.log("Se añadió un espectador al primer servidor: " + id + " al servidor: " + firstLobbyId)
    
                        break;
                }
                
                case "updateMovement": {
                    const dirX = obj.x; // entre -1 y 1
                    const dirY = obj.y;
                    const speed = 2;
                
                    const firstLobbyId = this.lobbys.keys().next().value;
                    if (!firstLobbyId) {
                        console.warn("No hay lobbys creados");
                        return;
                    }
                
                    const lobby = this.lobbys.get(firstLobbyId);
                
                    for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
                        if (teamSet.has(id)) {
                            const client = this.clients.get(id);
                            if (client && client.position) {
                                const newX = client.position.x + dirX * speed;
                                const newY = client.position.y + dirY * speed;
                
                                if (this.isPositionValid(newX, newY)) {
                                    client.position.x = newX;
                                    client.position.y = newY;
                                    client.state = obj.state;
                                } else {
                                    // Opcional: enviar mensaje de colisión al cliente
                                    client.socket?.send(JSON.stringify({
                                        type: "collision",
                                        message: "Movimiento bloqueado por colisión"
                                    }));
                                }
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
    
    isPositionValid(x, y) {
        const tileSize = 64;
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);
    
        // Asegúrate que esté dentro del rango del mapa
        if (col < 0 || col >= 32 || row < 0 || row >= 32) return false;
    
        const layers = this.mapData?.layers;
        if (!layers || layers.length < 5) return true; // Si no hay mapa cargado, permite mover
    
        const getTile = (layerIndex) => {
            const layer = layers[layerIndex];
            const index = row * layer.width + col;
            return layer.data[index];
        };
    
        const isWater = getTile(0) !== -1;   // capa 0 → mar
        const isTower = getTile(4) !== -1;   // capa 4 → torres

        console.log(isWater)
        console.log(isTower)

        console.log(getTile(0))
        console.log(getTile(4))
    
        return !(isWater || isTower); // Bloqueamos si hay agua o torre
    }        
}

const instance = new GameLogic();
Object.freeze(instance);
module.exports = instance;
