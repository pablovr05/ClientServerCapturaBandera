const fs = require('fs');
const path = require('path');
const { crearPartida } = require('./partidasDb');
const axios = require('axios');

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

    async addClient(id, socket, clientIp) {
        try {
            // Realizar la solicitud a la API para obtener los datos de la IP
            const response = await axios.get(`https://ipinfo.io/${clientIp}/json`);
            
            // Extraer solo la ciudad y el país
            const { city, country } = response.data;

            // Guardar la IP, ciudad y país junto con el socket
            this.clients.set(id, { socket, clientIp, city, country });

            console.log(`Cliente registrado con IP pública: ${clientIp}, Ciudad: ${city}, País: ${country}`);
        } catch (error) {
            console.error('Error al obtener la información de la IP:', error);
            // En caso de error, solo guardamos la IP y el socket (sin detalles adicionales)
            this.clients.set(id, { socket, clientIp });
            console.log(`Cliente registrado con IP pública: ${clientIp} (sin detalles de geolocalización)`);
        }

        // Devuelve la información del cliente (sin esperar la respuesta de la API)
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

    addGoldToLobbyCords(lobbyId, x, y) {
        // Verifica si el lobby existe
        const lobby = this.lobbys.get(lobbyId);
        if (lobby) {
            // Crea un objeto de oro con las coordenadas especificadas
            const gold = {
                type: 'gold',
                position: { x, y }
            };
    
            // Asegúrate de que el lobby tenga una propiedad "objects" para almacenar los objetos
            if (!lobby.objects) {
                lobby.objects = {};
            }
    
            // Asegúrate de que el lobby tenga un conjunto para el tipo de oro
            if (!lobby.objects.gold) {
                lobby.objects.gold = new Set();
            }
    
            // Añadir el objeto de oro al conjunto
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
            const position = this.assignInitialPosition();
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
        const centerX = 960;  // Centro en X
        const centerY = 960;  // Centro en Y
        
        // Rango de la zona en píxeles
        const offsetX = 704;  // 1408 / 2
        const offsetY = 704;  // 1408 / 2
        
        // Calculando los límites de la zona
        const minX = centerX - offsetX;
        const maxX = centerX + offsetX;
        const minY = centerY - offsetY;
        const maxY = centerY + offsetY;
    
        // Generar posición aleatoria dentro de los límites
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
                case "join": {
                    console.log(`Cliente ${id} se ha unido con los datos:`, obj);
                    
                    console.log(JSON.stringify(this.clients))
                    console.log(JSON.stringify(id))
                    const client = this.clients.get(id);

                    console.log(JSON.stringify(client));
                    
                    // Si el cliente existe, guardar la información adicional
                    const message = {
                        type: "idUser",  // O el tipo que desees
                        id: client.id
                    };
                    
                    // Usar el socket del cliente para enviar el mensaje
                    client.socket.send(JSON.stringify(message));
                    
                    // También podrías enviar más detalles si lo deseas
                    console.log(`Mensaje enviado al cliente ${client.id}:`, message);
                
                    break;
                }
                
                
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
                    const tileSize = 64;
                    const tolerance = 0.5;
                
                    const firstLobbyId = this.lobbys.keys().next().value;
                    if (!firstLobbyId) {
                        console.warn("No hay lobbys creados");
                        return;
                    }
                
                    const lobby = this.lobbys.get(firstLobbyId);
                    console.log(`Lobby encontrado: ${firstLobbyId}`);
                
                    if (!lobby.gameStarted) {
                        console.log("El juego aún no ha comenzado.");
                        break;
                    }
                
                    console.log("El juego ha comenzado. Procesando ataque...");
                
                    for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
                        if (teamSet.has(id)) {
                            const client = this.clients.get(id);
                            if (client && client.state === "IDLE" && client.hasGold === false) {
                                const attackerX = client.position.x;
                                const attackerY = client.position.y;
                                let attackerTileX = attackerX / tileSize;
                                let attackerTileY = attackerY / tileSize;                               

                                console.log(`Jugador ${client.id} está en estado IDLE y no tiene oro. Procediendo con el ataque...`);
                                console.log(`Posición del atacante (${client.id}): (${attackerX.toFixed(2)}, ${attackerY.toFixed(2)}) -> Casilla (${attackerTileX.toFixed(2)}, ${attackerTileY.toFixed(2)})`);
                
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
                
                                // Calcular área de ataque en casillas decimales
                                const attackRange = 1;
                                const attackWidth = 3;
                                const attackArea = this.getAttackArea(attackerTileX, attackerTileY, viewState, attackRange, attackWidth);
                
                                console.log(`Área de ataque calculada (casillas decimales):`);
                                console.table(attackArea);
                
                                for (const [otherId, otherClient] of this.clients.entries()) {
                                    if (otherId === id) continue;
                
                                    const sameTeam = lobby.teams[client.team]?.has(otherId);
                                    const isInGame = Object.values(lobby.teams).some(team => team.has(otherId));
                
                                    if (!sameTeam && isInGame) {
                                        const otherX = otherClient.position.x;
                                        const otherY = otherClient.position.y;
                                        const otherTileX = otherX / tileSize;
                                        const otherTileY = otherY / tileSize;
                
                                        console.log(`Posición del jugador ${otherId}: (${otherX.toFixed(2)}, ${otherY.toFixed(2)}) -> Casilla (${otherTileX.toFixed(2)}, ${otherTileY.toFixed(2)})`);
                
                                        const wasHit = attackArea.some(tile =>
                                            Math.abs(tile.x - otherTileX) < tolerance &&
                                            Math.abs(tile.y - otherTileY) < tolerance
                                        );
                
                                        if (wasHit) {
                                            console.log(`🎯 Jugador ${id} atacó y golpeó a ${otherId} en la casilla (${otherTileX.toFixed(2)}, ${otherTileY.toFixed(2)})`);
                
                                            const hitMessage = {
                                                type: "playerHit",
                                                attacker: id,
                                                victim: otherId,
                                            };
                
                                            for (const c of this.clients.values()) {
                                                c.socket.send(JSON.stringify(hitMessage));
                                            }

                                            const playerLastX = otherClient.position.x
                                            const playerLastY = otherClient.position.y

                                            const position = this.assignInitialPosition();

                                            otherClient.position = position;

                                            if (otherClient.hasGold === true) {
                                                otherClient.hasGold = false;
                                                client.hasGold = true;
                                            }
                
                                            // Puedes agregar lógica de daño aquí
                                        } else {
                                            console.log(`El jugador ${otherId} no fue golpeado.`);
                                        }
                                    }
                                }
                            } else {
                                console.log(`El jugador ${client.id} no está en estado IDLE o tiene oro, no puede atacar.`);
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
    
        // 🧠 Offset para corregir desplazamiento en TOP y BOTTOM
        const yOffset = (direction === "TOP") ? 2 : (direction === "BOTTOM") ? -2 : 0;
    
        for (let i = 1; i <= range; i++) {
            for (let j = -Math.floor(width / 2); j <= Math.floor(width / 2); j++) {
                let x = originX;
                let y = originY;
    
                switch (direction) {
                    case "TOP":
                        x += j;
                        y += yOffset - i;
                        break;
                    case "BOTTOM":
                        x += j;
                        y += yOffset + i;
                        break;
                    case "LEFT":
                        x += - i;
                        y += j;
                        break;
                    case "RIGHT":
                        x += + i;
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
