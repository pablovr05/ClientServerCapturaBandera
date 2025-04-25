// Description: WebSocket server for the app

const { Server, OPEN } = require('ws');
const { v4: uuidv4 } = require('uuid');

class Obj {

    init(httpServer, port) {

        // Define empty callbacks
        this.onConnection = (socket, id) => { }
        this.onMessage = (socket, id, obj) => { }
        this.onClose = (socket, id) => { }

        // Run WebSocket server
        this.ws = new Server({ server: httpServer })
        this.socketsClients = new Map()
        console.log(`Listening for WebSocket queries on ${port}`)

        // What to do when a websocket client connects
        this.ws.on('connection', (ws) => { this.newConnection(ws) })
    }

    end() {
        this.ws.close()
    }

    // A websocket client connects
    newConnection(con) {

        const clientIP = con.headers['x-forwarded-for'] || con._socket.remoteAddress;

        // Si la dirección tiene el formato ::ffff:<IP>, extraemos solo la dirección IPv4
        const ipv4Regex = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/;
        const match = clientIP.match(ipv4Regex);

        let clientIpAddress = clientIP; // Por defecto, usamos la IP tal cual
        if (match) {
            clientIpAddress = match[1];  // Extraemos solo la parte IPv4
        }

        console.log("Client connected with IP: " + clientIpAddress);

    
        // Generar ID únic per al client
        const id = "C" + uuidv4().substring(0, 5).toUpperCase();
        const metadata = { id };
        this.socketsClients.set(con, metadata);
    
        // Enviar missatge de benvinguda amb ID únic
        con.send(JSON.stringify({
            type: "welcome",
            id: id,
            totalClients: this.getClientsIds().length,
            message: "Welcome to the server",
        }));
    
        // Informar tots els clients de la nova connexió
        this.broadcast(JSON.stringify({
            type: "newClient",
            id: id,
            totalClients: this.getClientsIds().length,
            message: "A new client joined the server",
        }));
    
        if (this.onConnection && typeof this.onConnection === "function") {
            this.onConnection(con, id);
        }
    
        con.on("close", () => {
            this.closeConnection(con);
        });
    
        con.on('message', (bufferedMessage) => { 
            this.newMessage(con, id, bufferedMessage);
        });
    }

    closeConnection(con) {
        const metadata = this.socketsClients.get(con);
        if (!metadata) return;
    
        const id = metadata.id;
    
        this.socketsClients.delete(con); // Eliminar del registro
    
        // Notificar a los demás clientes que este cliente se ha desconectado
        this.broadcast(JSON.stringify({
            type: "clientDisconnected",
            id: id,
            totalClients: this.getClientsIds().length,
            message: "A client has left the server",
        }));
    
        // ✅ Llamar al callback de desconexión
        if (this.onClose && typeof this.onClose === "function") {
            this.onClose(con, id);
        }
    }
    

    // Send a message to all websocket clients
    broadcast(msg) {
        console.log("Broadcasting message to all clients: ", msg); // Traza antes de intentar enviar el mensaje
        
        this.ws.clients.forEach((client) => {
            if (client.readyState === OPEN) {
                console.log(`Sending message to client: ${client.id}`); // Traza de qué cliente recibe el mensaje
                client.send(msg, (error) => {
                    if (error) {
                        console.log(`Error sending message to client ${client.id}:`, error); // Traza de error si no se puede enviar
                    } else {
                        console.log(`Message successfully sent to client ${client.id}`); // Traza de éxito
                    }
                });
            } else {
                console.log(`Client ${client.id} is not open, skipping...`); // Traza si el cliente no está abierto
            }
        });

        console.log("Broadcast process completed."); // Traza después de intentar enviar el mensaje a todos los clientes
    }


    // A message is received from a websocket client
    newMessage(ws, id, bufferedMessage) {
        var messageAsString = bufferedMessage.toString()
        if (this.onMessage && typeof this.onMessage === "function") {
            this.onMessage(ws, id, messageAsString)
        }
    }

    getClientData(id) {
        for (let [client, metadata] of this.socketsClients.entries()) {
            if (metadata.id === id) {
                return metadata;
            }
        }
        return null;
    }

    getClientsIds() {
        let clients = [];
        this.socketsClients.forEach((value, key) => {
            clients.push(value.id);
        });
        return clients;
    }

    getClientsData() {
        let clients = [];
        for (let [client, metadata] of this.socketsClients.entries()) {
            clients.push(metadata);
        }
        return clients;
    }
}

module.exports = Obj;