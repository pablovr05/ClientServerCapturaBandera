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
            teamTowers: {
                blue: new Set(),
                red: new Set(),
                yellow: new Set(),
                purple: new Set(),
            }
        });

        // Add gold to the newly created lobby
        this.addGoldToLobby(lobbyId);
        this.addTeamTowersToLobby(lobbyId)

        return lobbyId;
    }

    addTeamTowersToLobby(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;
    
        const level = this.mapData?.levels?.[0];
        const towerLayer = level?.layers?.find(layer => layer.name === "towers");
        if (!towerLayer || !towerLayer.tileMap) return;
    
        const tileToTeamMap = {
            14: "yellow",
            15: "yellow",
            22: "yellow",
            23: "yellow",
            30: "yellow",
            31: "yellow",
            12: "red",
            13: "red",
            20: "red",
            21: "red",
            28: "red",
            29: "red",
            10: "purple",
            11: "purple",
            18: "purple",
            19: "purple",
            26: "purple",
            27: "purple",
            8: "blue",
            9: "blue",
            16: "blue",
            17: "blue",
            24: "blue",
            25: "blue",
        };
    
        for (let row = 0; row < towerLayer.tileMap.length; row++) {
            for (let col = 0; col < towerLayer.tileMap[row].length; col++) {
                const tileId = towerLayer.tileMap[row][col];
                const team = tileToTeamMap[tileId];
    
                if (team && lobby.teamTowers[team]) {
                    const key = `${col},${31 - row}`; // invertido en Y como en isPositionValid
                    lobby.teamTowers[team].add(key);
                }
            }
        }
    
        console.log(`Towers added to lobby ${lobbyId}`);
    }
    

    addGoldToLobby(lobbyId) {
        // Define the boundaries for random position generation
        const minX = 512;
        const minY = 512;
        const maxX = 1536;
        const maxY = 1536;
        
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
            const teamName = Object.keys(lobby.teams).find(key => lobby.teams[key].has(clientId));
            client.position = position;
            client.state = "IDLE"
            client.team = teamName;
            client.hasGold = false;
    
            // Enviar mensaje al cliente
            if (client && client.socket) {
                client.socket.send(JSON.stringify({
                    type: "joinedLobby",
                    lobbyId: lobbyId,
                    position: position,
                    state: client.state,
                    team: teamName,
                    hasGold: false,
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

                                let newX, newY;

                                // Si el cliente tiene oro, reducir la velocidad
                                if (client.hasGold) {
                                    newX = client.position.x + dirX * speed / 1.5;
                                    newY = client.position.y + dirY * speed / 1.5;
                                } else {
                                    newX = client.position.x + dirX * speed;
                                    newY = client.position.y + dirY * speed;
                                }

                                this.checkGoldInteraction(firstLobbyId, newX, newY)

                                const towerColor = this.getTowerColorAtPosition(firstLobbyId, newX, newY);

                                if (towerColor) {
                                    const client = this.clients.get(id); // Obtén el cliente correspondiente

                                    if (client) {
                                        if (client.team === towerColor) {
                                            // El jugador ha tocado una torre de su propio color
                                            if (client.hasGold) {
                                                // Si el jugador tiene la llave
                                                console.log(`Jugador ${client.id} (${client.team}) ha tocado su propia torre con la llave en la posición (${client.position.x}, ${client.position.y})`);
                                                // Realiza alguna acción especial si el jugador tiene la llave
                                            } else {
                                                // Si no tiene la llave
                                                console.log(`Jugador ${client.id} (${client.team}) ha tocado su propia torre sin la llave en la posición (${client.position.x}, ${client.position.y})`);
                                                // Tal vez puedas notificar que no puede hacer nada
                                            }
                                        } else {
                                            // El jugador ha tocado una torre de otro color
                                            if (client.hasGold) {
                                                // Si el jugador tiene la llave, puede interactuar con la torre de otro color
                                                console.log(`Jugador ${client.id} (${client.team}) ha tocado una torre del equipo ${towerColor} con la llave en la posición (${client.position.x}, ${client.position.y})`);
                                                // Aquí podría haber alguna acción especial, como robar algo, desbloquear un área, etc.
                                            } else {
                                                // Si no tiene la llave
                                                console.log(`Jugador ${client.id} (${client.team}) ha tocado una torre del equipo ${towerColor} sin la llave en la posición (${client.position.x}, ${client.position.y})`);
                                                // Tal vez no permitas ninguna acción o envíes un mensaje indicando que no puede interactuar
                                            }
                                        }
                                    }
                                }

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
        
        // Verifica que esté dentro de los límites del mapa
        if (col < 0 || col >= 32 || row < 0 || row >= 32) return false;
    
        const level = this.mapData?.levels?.[0];
        if (!level) return true; // Si no hay mapa cargado, no bloqueamos
    
        // Busca las capas importantes por nombre
        const waterLayer = level.layers.find(layer => layer.name === "water0");
        const towerLayer = level.layers.find(layer => layer.name === "towers"); // Ajusta el nombre real
    
        // Si no existen esas capas, no bloqueamos por ellas
        if (!waterLayer || !towerLayer) return true;
    
        // Invertir el índice de la fila en el eje Y
        const invertedRow = 31 - row;
    
        // Comprobamos si la casilla en la fila invertida tiene agua o torre
        const isWater = waterLayer.tileMap?.[invertedRow]?.[col] !== -1;
        const isTower = towerLayer.tileMap?.[invertedRow]?.[col] !== -1;
    
        // Si hay agua o torre en esa casilla, no se puede mover ahí
        return !(isWater || isTower);
    }
    
    getTowerColorAtPosition(lobbyId, x, y) {
        const tileSize = 64;
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize); // invertido como en el mapa
    
        const key = `${col},${row}`;
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return null;
    
        for (const [teamColor, towerPositions] of Object.entries(lobby.teamTowers)) {
            if (towerPositions.has(key)) {
                return teamColor; // Devuelve el color de la torre en esa posición
            }
        }
    
        return null; // No hay torre en esa posición
    }

    checkGoldInteraction(lobbyId, x, y) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;
        for (const gold of lobby.objects.gold) {
            const dx = gold.position.x - x;
            const dy = gold.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 96) { // Si la distancia es menor a 32 píxeles, lo recogió
                const client = Array.from(lobby.teams.blue).find(clientId => this.clients.get(clientId)?.position.x === x && this.clients.get(clientId)?.position.y === y) ||
                              Array.from(lobby.teams.red).find(clientId => this.clients.get(clientId)?.position.x === x && this.clients.get(clientId)?.position.y === y) ||
                              Array.from(lobby.teams.yellow).find(clientId => this.clients.get(clientId)?.position.x === x && this.clients.get(clientId)?.position.y === y) ||
                              Array.from(lobby.teams.purple).find(clientId => this.clients.get(clientId)?.position.x === x && this.clients.get(clientId)?.position.y === y);
                              
                const clientObj = this.clients.get(client);
                if (clientObj && !clientObj.hasGold) {
                    clientObj.hasGold = true;
                    lobby.objects.gold.delete(gold);
                    
                    console.log(`Jugador ${clientObj.id} recogió el oro en (${gold.position.x}, ${gold.position.y})`);
                    break; // Sale del bucle una vez se ha recogido el oro
                }
            }
        }
    }
}

const instance = new GameLogic();
Object.freeze(instance);
module.exports = instance;
