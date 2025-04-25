const express = require('express');
const game = require('./gameLogic.js');
const Obj = require('./utilsWebSockets.js');
const GameLoop = require('./utilsGameLoop.js');
const { obtenerPartidas, clearMongoDb } = require('./crearPartida');

let gameLoop = new GameLoop();

const debug = true;
const port = 3000;

// Inicialitzar WebSockets i la lògica del joc
const ws = new Obj();

// Inicialitzar servidor Express
const app = express();
app.use(express.static('public'));
app.use(express.json());

clearMongoDb()

app.get('/api/games', async (req, res) => {
    console.log("📡 Petición GET /api/games recibida");

    try {
        const partidas = await obtenerPartidas();
        console.log("✅ Enviando partidas al cliente...");
        res.json(partidas);
    } catch (error) {
        console.error("❌ Error al obtener partidas en el endpoint:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Inicialitzar servidor HTTP
const httpServer = app.listen(port, () => {
    console.log(`Servidor HTTP escoltant a: http://localhost:${port}`);
});

// Gestionar WebSockets
ws.init(httpServer, port);

ws.onConnection = (socket, id) => {
    if (debug) console.log("WebSocket client connected: " + id);
     console.log(socket)
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

gameLoop.run = (fps) => {

    game.lobbys.forEach((lobby, lobbyId) => {
        const gameState = game.getGameState(lobbyId);

        const gameStateStr = JSON.stringify(gameState);

        if (prevStates.get(lobbyId) === gameStateStr) return; // Nada cambió

        prevStates.set(lobbyId, gameStateStr);

        Object.keys(lobby.teams).forEach(teamKey => {
            const team = lobby.teams[teamKey];
            team.forEach(clientId => {
                const client = game.clients.get(clientId);
                if (client) {
                    client.socket.send(JSON.stringify({ type: "update", gameState }));
                }
            });
        });

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