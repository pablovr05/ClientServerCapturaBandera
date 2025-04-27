package com.project;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONException;
import org.json.JSONObject; // Asegúrate de importar esta clase para manejar JSON

import com.project.screens.GameScreen;
import com.project.screens.MenuScreen;

import java.net.URI;

import javax.json.JsonObject;

public class WebSockets {
    private WebSocketClient webSocketClient;
    private MenuScreen menuScreen;
    private GameScreen gameScreen;
    private String playerId;

    // Guardar estos valores
    private String id;
    private String username;
    private String email;
    private String phone;
    private String validated;

    public WebSockets(MenuScreen menuScreen, String id, String username, String email, String phone, String validated) {
        this.menuScreen = menuScreen;
        this.id = id;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.validated = validated;

        connectWebSocket();
    }

    private void connectWebSocket() {
        try {
            URI serverUri = new URI("wss://bandera3.ieti.site");

            webSocketClient = new WebSocketClient(serverUri) {
                @Override
                public void onOpen(ServerHandshake handshake) {
                    System.out.println("Conectado al servidor WebSocket");

                    // Crear el JSON que quieres enviar
                    JSONObject json = new JSONObject();
                    try {
                        json.put("type", "join");
                    } catch (JSONException e) {
                        System.err.println("Error creando JSON de conexión: " + e.getMessage());
                    }

                    // Enviar el JSON como String
                    sendMessage(json.toString());
                }

                @Override
                public void onMessage(String message) {
                    try {
                        JSONObject jsonMessage = new JSONObject(message);
                        String messageType = jsonMessage.getString("type");

                        switch (messageType) {
                            case "welcome":
                                playerId = jsonMessage.getString("id");
                                handleUpdateClientsConnected(jsonMessage);
                                break;
                            case "newClient":
                                handleUpdateClientsConnected(jsonMessage);
                                break;
                            case "clientDisconnected":
                                handleUpdateClientsConnected(jsonMessage);
                                break;
                            case "update":
                                handleUpdate(jsonMessage);
                                break;
                            case "performAttack":
                                handleAttack(jsonMessage);
                                break;
                            case "clientId":
                                String clientId = jsonMessage.getString("id");
                                sendUserInformation(clientId);
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

    private void handleUpdateClientsConnected(JSONObject jsonMessage) throws JSONException {
        int totalClients = jsonMessage.getInt("totalClients");
        System.out.println("Total de jugadores conectados: " + totalClients);

        if (menuScreen != null) {
            menuScreen.updatePlayersCount(totalClients);
        }
    }

    private void handleUpdate(JSONObject jsonMessage) throws JSONException {
        gameScreen.paintEntities(jsonMessage);
    }

    private void handleAttack(JSONObject jsonMessage) throws JSONException {
        gameScreen.handleAttack(jsonMessage);
    }

    public void sendMessage(String message) {
        if (webSocketClient != null && webSocketClient.isOpen()) {
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

    public void setGameScreen(GameScreen gameScreen) {
        this.gameScreen = gameScreen;
    }

    public String getPlayerId() {
        return playerId;
    }

    private void sendUserInformation(String clientId) {
        // Crear un objeto JSON con la información adicional del usuario
        JSONObject userInformation = new JSONObject();
        try {
            userInformation.put("type", "userInfo");
            userInformation.put("clientId", clientId);
            userInformation.put("id", this.id);
            userInformation.put("username", this.username);
            userInformation.put("email", this.email);
            userInformation.put("phone", this.phone);
            userInformation.put("validated", this.validated);

            // Enviar la información adicional al servidor
            webSocketClient.send(userInformation.toString());
            System.out.println("Sent user info: " + userInformation.toString());

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}