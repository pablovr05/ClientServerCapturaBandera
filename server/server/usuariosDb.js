const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'miJuego';
const collectionName = 'usuarios';

async function crearUsuario({ nickname, email, phone, token, validated }) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const usuarios = db.collection(collectionName);

        const nuevoUsuario = {
            nickname,
            email,
            phone,
            token,
            validated,
            date: new Date()
        };

        const resultado = await usuarios.insertOne(nuevoUsuario);
        console.log('✅ Usuario creado con _id:', resultado.insertedId);
        return resultado.insertedId;

    } catch (error) {
        console.error('❌ Error al crear el usuario:', error);
    } finally {
        await client.close();
    }
}

async function validarUsuario(token) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const usuarios = db.collection(collectionName);

        const resultado = await usuarios.updateOne(
            { token },
            { $set: { validated: true } }
        );

        if (resultado.matchedCount === 0) {
            console.log('❌ No se encontró un usuario con ese token');
            return false;
        }

        console.log('✅ Usuario validado correctamente');
        return true;

    } catch (error) {
        console.error('❌ Error al validar el usuario:', error);
        return false;
    } finally {
        await client.close();
    }
}

async function obtenerUsuarioPorToken(token) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const usuarios = db.collection(collectionName);

        const usuario = await usuarios.findOne({ token });
        return usuario;

    } catch (error) {
        console.error('❌ Error al obtener usuario por token:', error);
        return null;
    } finally {
        await client.close();
    }
}

module.exports = { crearUsuario, validarUsuario, obtenerUsuarioPorToken };
