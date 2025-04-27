const express = require('express');
const game = require('./gameLogic.js');
const Obj = require('./utilsWebSockets.js');
const GameLoop = require('./utilsGameLoop.js');
const { obtenerPartidas, clearMongoDb } = require('./partidasDb.js');
const { crearUsuario, validarUsuario, obtenerUsuarioPorToken, obtenerUsuarios, clearUsuariosDb, obtenerUsuarioPorNickname } = require('./usuariosDb');
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
clearUsuariosDb();

// Configurar nodemailer (asegúrate de no poner datos sensibles directamente en el código)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "pablovicenteroura2005@gmail.com", // Configura las variables de entorno
        pass: "rodenfkrtrnueevc"
    }
});

app.post('/api/login', async (req, res) => {
    console.log("📡 Petición POST /api/login recibida");
    const { nickname, password } = req.body;

    if (!nickname || !password) {
        return res.status(400).json({ error: 'Nickname y password son obligatorios' });
    }

    try {
        const usuarios = await obtenerUsuarios();
        const usuario = usuarios.find(u => u.nickname === nickname);

        if (!usuario) {
            console.log('❌ Usuario no encontrado');
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (usuario.password !== password) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        console.log('✅ Login exitoso');
        res.json({ message: 'Login exitoso', nickname: usuario.nickname });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
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

app.get('/api/usuarios', async (req, res) => {
    console.log("📡 Petición GET /api/usuarios recibida");

    try {
        // Usamos la función obtenerUsuarios que acaba de ser definida
        const usuarios = await obtenerUsuarios();
        console.log("✅ Enviando usuarios al cliente...");
        res.json(usuarios);  // Responde con la lista de usuarios
    } catch (error) {
        console.error("❌ Error al obtener usuarios en el endpoint:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get('/api/terms', (req, res) => {
    const termsPath = path.join(__dirname, 'assets/terms.txt');

    fs.readFile(termsPath, 'utf8', (err, data) => {
        if (err) {
            console.error("❌ Error leyendo términos:", err);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
        res.send(data);
    });
});

app.post('/api/register', async (req, res) => {
    // Imprimir los encabezados de la solicitud
    console.log("🌐 Encabezados de la solicitud:", req.headers);

    // Imprimir todo el cuerpo de la solicitud recibido
    console.log("📨 Mensaje recibido del cliente:", req.body);

    const { nickname, email, phone, password } = req.body;

    // Verificar que todos los campos necesarios estén presentes
    if (!nickname || !email || !password) {
        return res.status(400).json({ error: 'Nickname, email, and password are required' });
    }

    // Validar si el email tiene un formato correcto (simple validación de formato de email)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const token = uuidv4();

    try {
        // Guardar el usuario con la contraseña en texto plano
        await crearUsuario({ nickname, email, phone, password, token, validated: false });

        const confirmUrl = `https://bandera3.ieti.site/api/confirm/${token}`;

        // Intentar enviar el correo de confirmación
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Confirm your registration',
                html: `<h2>Hola ${nickname}!</h2><p>Dale click a este link para poder autenticar tu cuenta:</p><a href="${confirmUrl}">Confirmar cuenta</a>`
            });

            console.log(`✅ Confirmation email sent to ${email}`);
            return res.json({ message: "Registration successful. Check your email to confirm your account." });
        } catch (emailError) {
            console.error('❌ Error al enviar el correo:', emailError);
            return res.status(500).json({ error: "Error sending confirmation email. Please try again later." });
        }

    } catch (error) {
        console.error('❌ Error en el registro:', error);
        return res.status(500).json({ error: "Internal server error during registration" });
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

app.get('/api/usuario/:nickname', async (req, res) => {
    const { nickname } = req.params;

    console.log(`📡 Petición GET /api/usuario/${nickname} recibida`);

    if (!nickname) {
        return res.status(400).json({ error: 'Nickname es obligatorio' });
    }

    try {
        const usuario = await obtenerUsuarioPorNickname(nickname);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log(`✅ Usuario encontrado: ${usuario.nickname}`);
        return res.json(usuario);

    } catch (error) {
        console.error('❌ Error al obtener el usuario:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
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

    game.addClient(id, socket, clientIp);

    const message = {
        type: "clientId",
        id: id
    };

    socket.send(JSON.stringify(message));

    console.log(`Mensaje enviado al cliente ${id}:`, message);
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

    //console.log("Usuarios conectados:");
    game.clients.forEach((client, clientId) => {
        console.log(JSON.stringify(game.clients));
    });

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
