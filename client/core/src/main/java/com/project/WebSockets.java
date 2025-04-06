package com.project;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONObject; // Asegúrate de importar esta clase para manejar JSON

import com.project.screens.MenuScreen;

import java.net.URI;

public class WebSockets {
    private WebSocketClient webSocketClient;
    private MenuScreen menuScreen; // Instancia de MenuScreen

    public WebSockets(MenuScreen menuScreen) {
        this.menuScreen = menuScreen;  // Recibimos y almacenamos la instancia
        connectWebSocket();
    }

    private void connectWebSocket() {
        try {
            URI serverUri = new URI("wss://bandera3.ieti.site/ws");

            webSocketClient = new WebSocketClient(serverUri) {
                @Override
                public void onOpen(ServerHandshake handshake) {
                    System.out.println("Conectado al servidor WebSocket");
                    sendMessage("Hola desde LibGDX!"); // Envía un mensaje al servidor al conectar
                }

                @Override
                public void onMessage(String message) {
                    // Parseamos el mensaje recibido para procesarlo
                    try {
                        JSONObject jsonMessage = new JSONObject(message);
                        String messageType = jsonMessage.getString("type");

                        System.out.println(message);
                        switch (messageType) {
                            
                            case "welcome":
                                handleUpdateClientsConnected(jsonMessage);
                                break;
                            case "newClient":
                                handleUpdateClientsConnected(jsonMessage);
                                break;
                            case "clientDisconnected":
                                handleUpdateClientsConnected(jsonMessage);
                                break;
                            default:
                                System.out.println("Tipo de mensaje desconocido: " + messageType);
                                break;
                        }
                    } catch (Exception e) {
                        System.err.println("Error al procesar el mensaje recibido: " + e.getMessage());
                    }
                }

                @Override
                public void onClose(int code, String reason, boolean remote) {
                    System.out.println("Conexión cerrada. Código: " + code + ", Motivo: " + reason);
                }

                @Override
                public void onError(Exception ex) {
                    System.err.println("Error en WebSocket: " + ex.getMessage());
                }
            };

            webSocketClient.connect();

        } catch (Exception e) {
            System.err.println("Error al conectar WebSocket: " + e.getMessage());
        }
    }

    // Maneja la actualización de la cantidad de clientes conectados
    private void handleUpdateClientsConnected(JSONObject jsonMessage) {
        int totalClients = jsonMessage.getInt("totalClients");
        System.out.println("Total de jugadores conectados: " + totalClients);

        // Actualizar la UI de MenuScreen con el nuevo número de jugadores
        if (menuScreen != null) {
            menuScreen.updatePlayersCount(totalClients);  // Llamamos el método para actualizar la interfaz
        }
    }

    public void sendMessage(String message) {
        if (webSocketClient != null && webSocketClient.isOpen()) {
            System.out.println("Mensaje a enviar: " + message);
            webSocketClient.send(message);
        } else {
            System.out.println("No se pudo enviar el mensaje. WebSocket no conectado.");
        }
    }

    public void dispose() {
        if (webSocketClient != null) {
            webSocketClient.close();
        }
    }
}
