const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'miJuego';
const collectionName = 'partidas';

async function crearPartida({ gameId, estat, totalplayers, spectators, winner }) {
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
            spectators,
            winner
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
        console.log('🔌 Conectando a MongoDB...');
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db(dbName);
        console.log(`📂 Usando base de datos: ${dbName}`);

        const partidas = db.collection(collectionName);
        console.log(`📄 Accediendo a la colección: ${collectionName}`);

        const lista = await partidas.find().toArray();
        console.log(`📦 Se han recuperado ${lista.length} partidas`);

        return lista;

    } catch (error) {
        console.error('❌ Error al obtener partidas:', error);
        return [];
    } finally {
        console.log('🔒 Cerrando conexión con MongoDB...');
        await client.close();
    }
}

async function clearMongoDb() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const partidas = db.collection(collectionName);

        // Eliminar todas las entradas en la colección 'partidas'
        const resultado = await partidas.deleteMany({});
        console.log(`✅ Se eliminaron ${resultado.deletedCount} partidas de la base de datos`);

    } catch (error) {
        console.error('❌ Error al borrar las partidas:', error);
    } finally {
        await client.close();
    }
}



module.exports = { crearPartida, obtenerPartidas, clearMongoDb };
