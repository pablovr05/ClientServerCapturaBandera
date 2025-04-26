const express = require('express');
const game = require('./gameLogic.js');
const Obj = require('./utilsWebSockets.js');
const GameLoop = require('./utilsGameLoop.js');
const { obtenerPartidas, clearMongoDb } = require('./partidasDb.js');
const { crearUsuario, validarUsuario, obtenerUsuarioPorToken } = require('./usuariosDb');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

let gameLoop = new GameLoop();

const debug = true;
const port = 3000;

// Inicialitzar WebSockets i la lògica del joc
const ws = new Obj();

// Inicialitzar servidor Express
const app = express();
app.use(express.static('public'));
app.use(express.json());

clearMongoDb();

// Configurar nodemailer (asegúrate de no poner datos sensibles directamente en el código)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "pablovicenteroura2005@gmail.com", // Configura las variables de entorno
        pass: "Viro2005$"
    }
});

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

app.get('/api/terms', (req, res) => {
    const termsPath = path.join(__dirname, 'terms.txt');

    fs.readFile(termsPath, 'utf8', (err, data) => {
        if (err) {
            console.error("❌ Error leyendo términos:", err);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
        res.send(data);
    });
});

app.post('/api/register', async (req, res) => {
    const { nickname, email, phone, acceptTerms } = req.body;

    if (!nickname || !email) {
        return res.status(400).json({ error: 'Nickname y email son obligatorios' });
    }

    if (!acceptTerms) {
        return res.status(400).json({ error: 'Debes aceptar los términos de uso' });
    }

    const token = uuidv4();

    try {
        await crearUsuario({ nickname, email, phone, token, validated: false });

        const confirmUrl = `http://localhost:${port}/api/confirm/${token}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER, // Usar el email configurado en las variables de entorno
            to: email,
            subject: 'Confirma tu registro',
            html: `<h2>Hola ${nickname}!</h2><p>Haz click en el siguiente enlace para confirmar tu cuenta:</p><a href="${confirmUrl}">Confirmar Cuenta</a>`
        });

        console.log(`✅ Email de confirmación enviado a ${email}`);
        res.json({ message: "Registro exitoso. Revisa tu email para confirmar tu cuenta." });

    } catch (error) {
        console.error('❌ Error en el registro:', error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ----------- 📩 API: Confirmar registro ----------------
app.get('/api/confirm/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const usuario = await obtenerUsuarioPorToken(token);

        if (!usuario) {
            return res.status(400).send("Token inválido o expirado.");
        }

        await validarUsuario(token);

        res.send(`<h1>✅ Registro confirmado!</h1><p>Ya puedes usar tu nickname: <strong>${usuario.nickname}</strong></p>`);

    } catch (error) {
        console.error('❌ Error en la confirmación:', error);
        res.status(500).send("Error interno del servidor.");
    }
});

// Inicialitzar servidor HTTP
const httpServer = app.listen(port, () => {
    console.log(`Servidor HTTP escuchando en: http://localhost:${port}`);
});

// Gestionar WebSockets
ws.init(httpServer, port);

ws.onConnection = (socket, id, clientIp) => {
    if (debug) {
        console.log("WebSocket client connected: " + id);
        console.log("Client IP: " + clientIp); // Puedes ver la IP en los logs también
    }
    game.addClient(id, socket, clientIp); // Pasamos la IP aquí
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

// Gestionar el cierre del servidor
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
    console.log('Rebuda senyal de tancament, aturant el servidor...');
    httpServer.close();
    ws.end();
    process.exit(0);
}
