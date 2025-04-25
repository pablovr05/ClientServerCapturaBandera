const fs = require('fs');
const path = require('path');
const { crearPartida } = require('./crearPartida');

const GAME_DURATION = 3 * 1000;  // Duración del juego de 3 segundos
const COUNTDOWN_30_SECONDS = 30 * 1000;  // Contador de 60 segundos

class GameLogic {
    constructor() {
        if (!GameLogic.instance) {
            this.clients = new Map();
            this.lobbys = new Map();
            this.mapData = this.loadMapData(); // cargamos el mapa
            this.gameTimers = new Map();  // Mantener un timer para cada lobby
    
            GameLogic.instance = this;
        }
        return GameLogic.instance;
    }

    // Método que se llama cuando hay un cambio en la cantidad de jugadores
    checkPlayerCountForGameStart(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;
    
        const playerCount = this.getTotalPlayerCountInLobby(lobbyId);
    
        // ✅ Solo iniciar el contador si hay al menos 2 jugadores, el juego no ha empezado y no hay contador corriendo
        if (playerCount >= 2 && !lobby.gameStarted && !this.gameTimers.has(lobbyId)) {
            this.startGameCountdown(lobbyId);
        }
    }    

    // Método que obtiene el total de jugadores en el lobby
    getTotalPlayerCountInLobby(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return 0;

        return Object.values(lobby.teams).reduce((total, teamSet) => total + teamSet.size, 0);
    }

    // Método para iniciar el contador para comenzar la partida
    startGameCountdown(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;
    
        if (lobby.gameStarted) return;
    
        lobby.timeToStart = COUNTDOWN_30_SECONDS;
    
        this.gameTimers.set(lobbyId, setInterval(() => {
            const playerCount = this.getTotalPlayerCountInLobby(lobbyId);
    
            // 🚨 Si hay menos de 2 jugadores, detener y NO reiniciar el contador
            if (playerCount < 2) {
                console.log(`Contador detenido en lobby ${lobbyId}, jugadores insuficientes.`);
    
                clearInterval(this.gameTimers.get(lobbyId));
                this.gameTimers.delete(lobbyId);
    
                lobby.timeToStart = COUNTDOWN_30_SECONDS;
                this.broadcastCountdown(lobbyId, lobby.timeToStart);
    
                return;
            }
    
            lobby.timeToStart -= 1000;
    
            this.broadcastCountdown(lobbyId, lobby.timeToStart);
    
            if (lobby.timeToStart <= 0) {
                clearInterval(this.gameTimers.get(lobbyId));
                this.gameTimers.delete(lobbyId);
    
                lobby.gameStarted = true;
                console.log(`La partida en el lobby ${lobbyId} ha comenzado!`);
                this.startGame(lobbyId);
            }
        }, 1000));

        this.checkPlayerCountForGameStart(lobbyId)
    }
    

    // Método para reiniciar el contador cuando no haya jugadores
    resetGameStartCountdown(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;

        if (lobby.gameStarted) return;

        if (this.gameTimers.has(lobbyId)) {
            clearInterval(this.gameTimers.get(lobbyId));
            this.gameTimers.delete(lobbyId);
        }

        // Resetear el tiempo de inicio a 60 segundos
        lobby.timeToStart = COUNTDOWN_30_SECONDS;
        this.broadcastCountdown(lobbyId, lobby.timeToStart);  // Informar a todos los jugadores
    }

    // Método para iniciar el juego
    startGame(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;

        // Empezar el juego
        console.log(`Iniciando la partida en el lobby ${lobbyId}`);
        lobby.gameStarted = true;
        // Notificar a todos los jugadores que el juego ha comenzado
        this.broadcastGameStarted(lobbyId);
    }

    // Método para notificar la cuenta atrás a todos los jugadores y espectadores
    broadcastCountdown(lobbyId, timeLeft) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;

        const message = {
            type: "countdown",
            timeLeft: timeLeft / 1000,  // Convertir a segundos
        };

        console.log( "Tiempo restante para empezar " + timeLeft / 1000)

        for (const clientId of lobby.teams.blue) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.teams.red) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.teams.yellow) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.teams.purple) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.spectators) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }
    }

    // Método para notificar que el juego ha comenzado
    broadcastGameStarted(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;

        const message = {
            type: "gameStarted",
            message: "El juego ha comenzado!",
        };

        for (const clientId of lobby.teams.blue) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.teams.red) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.teams.yellow) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.teams.purple) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }

        for (const clientId of lobby.spectators) {
            const client = this.clients.get(clientId);
            if (client && client.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }
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
                    this.checkPlayerCountForGameStart(lobbyId);
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

        // Crear el lobby con equipos e inicialización de objetos
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
            },
            // Variables del juego para este lobby
            gameStarted: false,  // Si el juego ha comenzado en este lobby
            timeToStart: 60 * 1000,  // Tiempo para iniciar el juego en milisegundos (60 segundos)
        });

        // Añadir oro y torres al lobby recién creado
        this.addGoldToLobby(lobbyId);
        this.addTeamTowersToLobby(lobbyId);

        return lobbyId;
    }

    addTeamTowersToLobby(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;
    
        const level = this.mapData?.levels?.[0];
        const towerLayer = level?.layers?.find(layer => layer.name === "towers");
        if (!towerLayer || !towerLayer.tileMap) return;
    
        const tileToTeamMap = {
            6: "yellow",
            7: "yellow",
            14: "yellow",
            15: "yellow",
            22: "yellow",
            23: "yellow",
            30: "yellow",
            31: "yellow",
            4: "red",
            5: "red",
            12: "red",
            13: "red",
            20: "red",
            21: "red",
            28: "red",
            29: "red",
            2: "purple",
            3: "purple",
            10: "purple",
            11: "purple",
            18: "purple",
            19: "purple",
            26: "purple",
            27: "purple",
            0: "blue",
            1: "blue",
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
            
            // Verificar si el lobby ya tiene 4 jugadores
            const totalPlayersInLobby = Object.values(lobby.teams).reduce((total, team) => total + team.size, 0);
            
            if (totalPlayersInLobby >= 4) {
                // Si ya hay 4 jugadores en el lobby, no agregar más
                console.log(`No se puede agregar más jugadores al lobby ${lobbyId}. Ya tiene 4 jugadores.`);
                return; // No agregamos al nuevo jugador
            }
            
            // Si hay espacio, agregar el jugador al equipo con menos jugadores
            const teams = Object.values(lobby.teams);
            let teamWithLeastPlayers = teams[0];
            for (let team of teams) {
                if (team.size < teamWithLeastPlayers.size) {
                    teamWithLeastPlayers = team;
                }
            }
    
            teamWithLeastPlayers.add(clientId);
    
            // Asignar la posición inicial del jugador
            const position = this.assignInitialPosition(clientId);
            const client = this.clients.get(clientId);
            const teamName = Object.keys(lobby.teams).find(key => lobby.teams[key].has(clientId));
            client.position = position;
            client.state = "IDLE";
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
    
            console.log(`Jugador ${clientId} ha sido agregado al lobby ${lobbyId} en el equipo ${teamName}`);

            this.checkPlayerCountForGameStart(lobbyId)
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

                case "attack": {
                    const viewState = obj.viewState;
                
                    const firstLobbyId = this.lobbys.keys().next().value;
                    if (!firstLobbyId) {
                        console.warn("No hay lobbys creados");
                        return;
                    }
                
                    const lobby = this.lobbys.get(firstLobbyId);
                
                    if (!lobby.gameStarted) break;
                
                    for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
                        if (teamSet.has(id)) {
                            const client = this.clients.get(id);
                            if (client && client.state === "IDLE" && client.hasGold === false) {
                
                                const message = {
                                    type: "performAttack",
                                    attacker: id,
                                    viewState: viewState,
                                    team: client.team,
                                    message: `El jugador con id: ${client.id} está atacando en dirección: ${viewState}`,
                                };
                
                                // Avisar a todos del ataque
                                for (const [clientId, c] of this.clients.entries()) {
                                    if (
                                        lobby.teams.blue.has(clientId) ||
                                        lobby.teams.red.has(clientId) ||
                                        lobby.teams.yellow.has(clientId) ||
                                        lobby.teams.purple.has(clientId) ||
                                        lobby.spectators.has(clientId)
                                    ) {
                                        c.socket.send(JSON.stringify(message));
                                    }
                                }
                
                                // ⚠️ NUEVO: calcular área de ataque
                                const attackRange = 3; // puedes ajustar el rango
                                const attackWidth = 3; // puedes ajustar el ancho
                                const attackArea = this.getAttackArea(client.position.x, client.position.y, viewState, attackRange, attackWidth);
                
                                for (const [otherId, otherClient] of this.clients.entries()) {
                                    if (otherId === id) continue;
                
                                    // Verifica si es enemigo
                                    const sameTeam = lobby.teams[client.team]?.has(otherId);
                                    const isInGame = lobby.teams.blue.has(otherId) || lobby.teams.red.has(otherId) || lobby.teams.yellow.has(otherId) || lobby.teams.purple.has(otherId);
                
                                    if (!sameTeam && isInGame) {
                                        const pos = otherClient.position;
                
                                        const wasHit = attackArea.some(tile =>
                                            Math.floor(tile.x) === Math.floor(pos.x) && Math.floor(tile.y) === Math.floor(pos.y)
                                        );
                
                                        if (wasHit) {
                                            console.log(`🎯 Jugador ${id} atacó y golpeó a ${otherId}`);
                
                                            const hitMessage = {
                                                type: "playerHit",
                                                attacker: id,
                                                victim: otherId,
                                            };
                
                                            // Avisar a todos del impacto
                                            for (const c of this.clients.values()) {
                                                c.socket.send(JSON.stringify(hitMessage));
                                            }
                
                                            // Aquí podrías agregar lógica de daño o efectos especiales
                                        }
                                    }
                                }
                            }
                            break;
                        }
                    }
                
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

                    if (!lobby.gameStarted) break;
                
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

                                this.checkGoldInteraction(firstLobbyId, newX, newY, id);

                                const towerColor = this.getTowerColorAtPosition(firstLobbyId, newX, newY);

                                if (towerColor) {
                                    const client = this.clients.get(id); // Obtén el cliente correspondiente

                                    if (client) {
                                        if (client.team === towerColor) {
                                            // El jugador ha tocado una torre de su propio color
                                            if (client.hasGold) {
                                                console.log(`Jugador ${client.id} (${client.team}) ha tocado su propia torre con la llave)`);

                                                this.endGame(firstLobbyId, client);
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
    
    getAttackArea(originX, originY, direction, range, width) {
        const area = [];
    
        for (let i = 1; i <= range; i++) {
            for (let j = -Math.floor(width / 2); j <= Math.floor(width / 2); j++) {
                let x = originX;
                let y = originY;
    
                switch (direction) {
                    case "TOP":
                        x += j;
                        y -= i;
                        break;
                    case "BOTTOM":
                        x += j;
                        y += i;
                        break;
                    case "LEFT":
                        x -= i;
                        y += j;
                        break;
                    case "RIGHT":
                        x += i;
                        y += j;
                        break;
                }
    
                area.push({ x, y });
            }
        }
    
        return area;
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

    checkGoldInteraction(lobbyId, x, y, clientId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;
    
        for (const gold of lobby.objects.gold) {
            const dx = gold.position.x - x;
            const dy = gold.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            if (distance < 32) { // Ya estás bien con esta tolerancia
                const clientObj = this.clients.get(clientId);
                if (clientObj && !clientObj.hasGold) {
                    clientObj.hasGold = true;
                    lobby.objects.gold.delete(gold);
    
                    console.log(`Jugador ${clientObj.id} recogió el oro en (${gold.position.x}, ${gold.position.y})`);
                    break;
                }
            }
        }
    }
    

    endGame(lobbyId, winnerClient) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;
    
        // Mostrar mensaje del ganador
        console.log(`El juego ha terminado. El ganador es el jugador ${winnerClient.id} del equipo ${winnerClient.team}`);
    
        // Broadcast a todos los jugadores y espectadores en el lobby
        const message = {
            type: "gameOver",
            winner: winnerClient.id,
            team: winnerClient.team,
            message: "¡El juego ha terminado! El ganador es el equipo " + winnerClient.team
        };

        crearPartida({
            gameId: Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000,
            estat: 1,
            totalplayers: this.getTotalPlayerCountInLobby(lobbyId),
            spectators: lobby.spectators.length,
            winner: winnerClient.team,
        }).then(id => {
            console.log('Partida creada con éxito, id:', id);
        }).catch(err => {
            console.error('Error al crear partida:', err.message);
        });
    
        // Enviar el mensaje a todos los clientes en el lobby
        for (const [clientId, client] of this.clients.entries()) {
            if (lobby.teams.blue.has(clientId) || lobby.teams.red.has(clientId) || lobby.teams.yellow.has(clientId) || lobby.teams.purple.has(clientId) || lobby.spectators.has(clientId)) {
                client.socket.send(JSON.stringify(message));
            }
        }
    
        // Reiniciar el estado de los jugadores
        for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
            for (const clientId of teamSet) {
                const client = this.clients.get(clientId);
                if (client) {
                    client.hasGold = false;  // Reiniciar estado del oro
                    client.position = this.assignInitialPosition();  // Asignar nuevas posiciones
                    client.state = "IDLE";  // Reiniciar el estado
                }
            }
        }
    
        // Generar un nuevo oro
        this.addGoldToLobby(lobbyId);
    
        // Iniciar el ciclo del juego nuevamente
        console.log("Nuevo oro generado y jugadores reiniciados, el ciclo del juego reiniciado.");

        lobby.gameStarted = false;

        this.resetGameStartCountdown(lobbyId)

        this.checkPlayerCountForGameStart(lobbyId);
    
        // Opcional: Puedes configurar un nuevo ciclo de juego aquí, o simplemente dejarlo como está.
    }
}

const instance = new GameLogic();
Object.freeze(instance);
module.exports = instance;
