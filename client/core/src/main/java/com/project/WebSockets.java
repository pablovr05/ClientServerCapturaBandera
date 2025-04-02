package com.project;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;

public class WebSockets {
    private WebSocketClient webSocketClient;

    public void create() {
        connectWebSocket();
    }

    private void connectWebSocket() {
        try {
            URI serverUri = new URI("wss://pvicenteroura.ieti.site/ws");

            webSocketClient = new WebSocketClient(serverUri) {
                @Override
                public void onOpen(ServerHandshake handshake) {
                    System.out.println("Conectado al servidor WebSocket");
                    send("Hola desde LibGDX!"); // Envía un mensaje al servidor al conectar
                }

                @Override
                public void onMessage(String message) {
                    System.out.println("Mensaje recibido: " + message);
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
