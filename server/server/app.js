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
    //Aquí se debería hacer un broadcast de los usuarios conectados para conectarse
};

gameLoop.run = (fps) => {
    // Se actualiza el estado del juego
    game.updateGame(fps);

    // Enviar el estado del juego solo para los lobbies activos
    game.lobbys.forEach((lobby, lobbyId) => {
        const gameState = game.getGameState(lobbyId);
        console.log(`Enviando estado del juego al lobby ${lobbyId}:`);
        console.log(JSON.stringify({ type: "update", gameState }, null, 2));

        // Recorrer los equipos y enviar el estado a los clientes
        Object.keys(lobby.teams).forEach(teamKey => {
            const team = lobby.teams[teamKey];
            team.forEach(clientId => {
                const client = game.clients.get(clientId);
                if (client) {
                    client.socket.send(JSON.stringify({ type: "update", gameState }));
                }
            });
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