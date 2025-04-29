const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'miJuego';
const playersCollectionName = 'jugadores'; // Colección para los jugadores

async function guardarJugadores({ gameId, players, winnerTeam}) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const jugadores = db.collection(playersCollectionName);

        const jugadoresData = players.map(client => ({
            gameId,
            username: client.username,
            email: client.email,
            phone: client.phone,
            country: client.country,
            city: client.city,
            clientIp: client.clientIp,
            validated: client.validated,
            team: client.team,
            result: (client.team === winnerTeam) ? "GANADOR" : "PERDEDOR", // Determinamos si fue ganador o perdedor
            date: new Date()
        }));

        const resultado = await jugadores.insertMany(jugadoresData);
        console.log('✅ Jugadores guardados con éxito, _ids:', resultado.insertedIds);
        return resultado.insertedIds;

    } catch (error) {
        console.error('❌ Error al guardar jugadores:', error);
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

module.exports = { obtenerJugadores, guardarJugadores, borrarTodosLosJugadores };
