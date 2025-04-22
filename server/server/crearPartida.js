const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'miJuego';
const collectionName = 'partidas';

async function crearPartida({ gameId, estat, totalplayers, spectators }) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const partidas = db.collection(collectionName);

        const nuevaPartida = {
            gameId,
            date: new Date(),
            estat,
            totalplayers,
            spectators
        };

        const resultado = await partidas.insertOne(nuevaPartida);
        console.log('✅ Partida creada con _id:', resultado.insertedId);
        return resultado.insertedId;

    } catch (error) {
        console.error('❌ Error al crear la partida:', error);
    } finally {
        await client.close();
    }
}

async function obtenerPartidas() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const partidas = db.collection(collectionName);

        const lista = await partidas.find().toArray();
        return lista;

    } catch (error) {
        console.error('❌ Error al obtener partidas:', error);
        return [];
    } finally {
        await client.close();
    }
}


module.exports = { crearPartida, obtenerPartidas };
