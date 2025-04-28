const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'miJuego';
const playersCollectionName = 'jugadores'; // Colección para los jugadores

async function guardarInformacionJugadores(lobbyId, gameId) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const jugadoresCollection = db.collection(playersCollectionName);

        // Obtener todos los jugadores del lobby
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return;

        const jugadoresInfo = [];

        for (const [teamName, teamSet] of Object.entries(lobby.teams)) {
            for (const clientId of teamSet) {
                const client = this.clients.get(clientId);
                if (client) {
                    const resultado = (client.team === winnerClient.team) ? "GANADOR" : "PERDEDOR";

                    // Guardar la información del jugador en el array
                    jugadoresInfo.push({
                        gameId: gameId, // Guardamos el gameId de la partida
                        playerId: client.id,
                        username: client.username,
                        email: client.email,
                        phone: client.phone,
                        country: client.country,
                        city: client.city,
                        clientIp: client.clientIp,
                        validated: client.validated,
                        state: client.state,
                        hasGold: client.hasGold,
                        position: client.position ? { x: client.position.x, y: client.position.y } : null,
                        result: resultado,
                        team: client.team,
                        socketStatus: client.socket ? "Conectado" : "Desconectado",
                        date: new Date(),
                    });
                }
            }
        }

        // Insertar todos los jugadores en la colección 'jugadores'
        const resultado = await jugadoresCollection.insertMany(jugadoresInfo);
        console.log(`✅ ${resultado.insertedCount} jugadores guardados con éxito en MongoDB`);

    } catch (error) {
        console.error('❌ Error al guardar la información de los jugadores:', error);
    } finally {
        await client.close();
    }
}

// Función para borrar todos los registros de los jugadores
async function borrarTodosLosJugadores() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const jugadoresCollection = db.collection(playersCollectionName);

        // Eliminar todos los registros de jugadores
        const resultado = await jugadoresCollection.deleteMany({});
        console.log(`✅ Se han eliminado ${resultado.deletedCount} registros de jugadores de MongoDB`);

    } catch (error) {
        console.error('❌ Error al borrar los registros de los jugadores:', error);
    } finally {
        await client.close();
    }
}


async function obtenerJugadores() {
    const client = new MongoClient(uri);

    try {
        console.log('🔌 Conectando a MongoDB...');
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db(dbName);
        console.log(`📂 Usando base de datos: ${dbName}`);

        const jugadoresCollection = db.collection(playersCollectionName);
        console.log(`📄 Accediendo a la colección: ${playersCollectionName}`);

        // Recuperar todos los jugadores
        const listaJugadores = await jugadoresCollection.find().toArray();
        console.log(`📦 Se han recuperado ${listaJugadores.length} jugadores`);

        return listaJugadores;

    } catch (error) {
        console.error('❌ Error al obtener los jugadores:', error);
        return [];
    } finally {
        console.log('🔒 Cerrando conexión con MongoDB...');
        await client.close();
    }
}

module.exports = { obtenerJugadores, guardarInformacionJugadores, borrarTodosLosJugadores };
