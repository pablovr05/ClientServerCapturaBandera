const express = require('express');
const game = require('./gameLogic.js');
const Obj = require('./utilsWebSockets.js');
const GameLoop = require('./utilsGameLoop.js');

let gameLoop = new GameLoop();

const debug = true;
const port = 3000;

// Inicialitzar WebSockets i la lògica del joc
const ws = new Obj();

// Inicialitzar servidor Express
const app = express();
app.use(express.static('public'));
app.use(express.json());

// Inicialitzar servidor HTTP
const httpServer = app.listen(port, () => {
    console.log(`Servidor HTTP escoltant a: http://localhost:${port}`);
});

// Gestionar WebSockets
ws.init(httpServer, port);

ws.onConnection = (socket, id) => {
    if (debug) console.log("WebSocket client connected: " + id);
    game.addClient(id, socket);
};

ws.onMessage = (socket, id, msg) => {
    game.handleMessage(id, msg, socket);
};

ws.onClose = (socket, id) => {
    if (debug) console.log("WebSocket client disconnected: " + id);
    game.removeClient(id);
};

const prevStates = new Map();

const GAME_DURATION = 180 * 1000;  // Duración del juego de 3 segundos
const COUNTDOWN_60_SECONDS = 60 * 1000;  // Contador de 60 segundos
const COUNTDOWN_3_SECONDS = 3 * 1000;  // Contador de 3 segundos

gameLoop.run = (fps) => {
    game.lobbys.forEach((lobby, lobbyId) => {
        // Inicializar el tiempo si no existe
        if (!lobby.gameStartTime) {
            lobby.gameStartTime = Date.now();
            lobby.countdown = COUNTDOWN_60_SECONDS;  // Comienza con 60 segundos
            lobby.isGameOver = false;
        }

        // Verificar el número de jugadores
        const playerCount = Object.values(lobby.teams).reduce((acc, team) => acc + team.size, 0);
        
        // Cambiar el contador si hay 3 jugadores en el lobby
        if (playerCount >= 3 && lobby.countdown !== COUNTDOWN_3_SECONDS) {
            lobby.countdown = COUNTDOWN_3_SECONDS;  // Cambia a 3 segundos
            lobby.gameStartTime = Date.now();  // Reiniciar el temporizador cuando cambia el contador
        }

        const elapsedTime = Date.now() - lobby.gameStartTime;

        if (lobby.countdown === COUNTDOWN_60_SECONDS) {
            // Si el contador es de 60 segundos, verificar si debe iniciar el juego
            if (elapsedTime >= COUNTDOWN_60_SECONDS) {
                // El tiempo se acabó, el juego empieza con duración de 3 segundos
                if (!lobby.isGameOver) {
                    lobby.isGameOver = true;
                    // Informar a los jugadores y espectadores
                    Object.keys(lobby.teams).forEach(teamKey => {
                        const team = lobby.teams[teamKey];
                        team.forEach(clientId => {
                            const client = game.clients.get(clientId);
                            if (client) {
                                client.socket.send(JSON.stringify({
                                    type: "gameStart",
                                    message: `¡El juego ha comenzado! Durará 3 segundos.`
                                }));
                            }
                        });
                    });

                    // Enviar mensaje a los espectadores
                    lobby.spectators.forEach(clientId => {
                        const client = game.clients.get(clientId);
                        if (client) {
                            client.socket.send(JSON.stringify({
                                type: "gameStart",
                                message: "El juego ha comenzado, dura 3 segundos."
                            }));
                        }
                    });
                    // Reiniciar el tiempo para la duración del juego (3 segundos)
                    lobby.gameStartTime = Date.now();
                }
            }
        } else if (lobby.countdown === COUNTDOWN_3_SECONDS) {
            // Si el contador es de 3 segundos, verificar si se debe terminar el juego
            if (elapsedTime >= GAME_DURATION) {
                // El juego terminó
                if (!lobby.isGameOver) {
                    lobby.isGameOver = true;
                    // Informar a los jugadores y espectadores
                    Object.keys(lobby.teams).forEach(teamKey => {
                        const team = lobby.teams[teamKey];
                        team.forEach(clientId => {
                            const client = game.clients.get(clientId);
                            if (client) {
                                client.socket.send(JSON.stringify({
                                    type: "gameOver",
                                    message: `La partida ha terminado. ¡Reiniciando!`
                                }));
                            }
                        });
                    });

                    // Enviar mensaje a los espectadores
                    lobby.spectators.forEach(clientId => {
                        const client = game.clients.get(clientId);
                        if (client) {
                            client.socket.send(JSON.stringify({
                                type: "gameOver",
                                message: "La partida ha terminado. ¡Reiniciando!"
                            }));
                        }
                    });

                    // Reiniciar el ciclo del juego
                    lobby.gameStartTime = Date.now();  // Reiniciar para el siguiente ciclo de 60 segundos
                    lobby.isGameOver = false;  // Permitir el reinicio de la partida
                }
            }
        }

        // Enviar el estado del juego a los jugadores y espectadores
        const gameState = game.getGameState(lobbyId);
        const gameStateStr = JSON.stringify(gameState);

        if (prevStates.get(lobbyId) === gameStateStr) return; // Nada cambió

        prevStates.set(lobbyId, gameStateStr);

        // Enviar estado actualizado a jugadores y espectadores
        Object.keys(lobby.teams).forEach(teamKey => {
            const team = lobby.teams[teamKey];
            team.forEach(clientId => {
                const client = game.clients.get(clientId);
                if (client) {
                    client.socket.send(JSON.stringify({ type: "update", gameState }));
                }
            });
        });

        // Enviar estado actualizado a los espectadores
        lobby.spectators.forEach(clientId => {
            const client = game.clients.get(clientId);
            if (client) {
                client.socket.send(JSON.stringify({ type: "update", gameState }));
            }
        });
    });
};

gameLoop.start();

// Gestionar el tancament del servidor
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
    console.log('Rebuda senyal de tancament, aturant el servidor...');
    httpServer.close();
    ws.end();
    process.exit(0);
}