package com.project.screens;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.math.Matrix4;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.ScreenUtils;
import com.project.WebSockets;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import com.project.clases.Joystick;

public class GameScreen implements Screen {
    private final Game game;
    private SpriteBatch batch;
    private ShapeRenderer shapeRenderer;
    private BitmapFont font, titleFont;
    private Texture backgroundImage;
    private WebSockets webSockets;

    private OrthographicCamera camera;

    private JSONObject latestGameState; // Aquí se guarda el estado actual

    private float playerX, playerY; // Posición del jugador

    private Joystick joystick; // Declare the joystick

    private Vector2 movementOutput;
    private Vector2 newMovementOutput;

    public GameScreen(Game game, WebSockets webSockets) {
        this.game = game;
        this.webSockets = webSockets;
        movementOutput = new Vector2();
        newMovementOutput = new Vector2();

        camera = new OrthographicCamera();
        camera.setToOrtho(false, 800, 600); // Tamaño de la cámara

        batch = new SpriteBatch();
        shapeRenderer = new ShapeRenderer();
        font = new BitmapFont();
        titleFont = new BitmapFont();
        backgroundImage = new Texture("mapa.png");

        // Initialize the joystick (position and radius)
        joystick = new Joystick(175, 175, 75); // Position it at the bottom-right corner
    }

    @Override
    public void show() {
        // Initial setup or logic if needed
    }

    @Override
public void render(float delta) {
    ScreenUtils.clear(0, 0, 0, 1); // Limpiar la pantalla con color negro

    if (latestGameState != null) {
        // Actualizar la posición del jugador
        try {
            updatePlayerPosition(latestGameState);
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }

        // Actualizar la cámara para seguir al jugador
        camera.position.set(playerX, playerY, 0);
        camera.update();

        batch.setProjectionMatrix(camera.combined); // Usamos la cámara para el batch
        shapeRenderer.setProjectionMatrix(camera.combined); // Usamos la cámara para el shapeRenderer

        // Dibujar el fondo
        batch.begin();
        batch.draw(backgroundImage, 0, 0); // Asegúrate de que el mapa comienza en (0,0)
        batch.end();

        try {
            drawPlayers(latestGameState); // Dibujar otros jugadores
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    // Actualizar la posición del toque para el joystick
    Vector2 touchPosition = new Vector2(Gdx.input.getX(), Gdx.input.getY());
    movementOutput = joystick.update(touchPosition); // Actualiza el estado del joystick con la posición actual del toque

    // Crear un objeto JSON con el tipo "updateMovement" y los valores correspondientes
    JSONObject message = new JSONObject();
    try {
        message.put("type", "updateMovement");
        message.put("x", Double.valueOf(movementOutput.x));  // Convertir float a Double
        message.put("y", Double.valueOf(movementOutput.y));  // Convertir float a Double
        message.put("id", webSockets.getPlayerId());  // Obtener el ID del jugador
    
        // Enviar el mensaje al servidor
        webSockets.sendMessage(message.toString());
    } catch (JSONException e) {
        e.printStackTrace();
    }

    // Establecer la proyección para dibujar el joystick siempre en la pantalla (sin la cámara)
    shapeRenderer.setProjectionMatrix(new Matrix4());  // Restablecer la proyección a la pantalla

    // Dibujar el joystick en la parte inferior derecha de la pantalla
    shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
    joystick.draw(shapeRenderer);  // Dibujar el fondo y el thumbstick del joystick
    shapeRenderer.end();
}
 
 
    private void updatePlayerPosition(JSONObject gameState) throws JSONException {
        if (!gameState.has("players")) return;

        JSONArray players = gameState.getJSONArray("players");
        String clientId = webSockets.getPlayerId();  // Get player ID

        // Find the player with the matching clientId
        for (int i = 0; i < players.length(); i++) {
            JSONObject player = players.getJSONObject(i);

            // Compare player ID with the client ID
            if (player.getString("id").equals(clientId)) {
                JSONObject pos = player.getJSONObject("position");
                playerX = pos.getLong("x");
                playerY = pos.getLong("y");
                break;  // Stop loop once the player is found
            }
        }
        //System.out.println("Player position: " + playerX + "," + playerY);  // Print player position
    }

    public void paintPlayers(JSONObject data) throws JSONException {
        //System.out.println("Drawing info: " + data);
        if (!data.has("gameState")) return;
        latestGameState = data.getJSONObject("gameState");
    }

    private void drawPlayers(JSONObject gameState) throws JSONException {
        if (!gameState.has("players")) return;
    
        JSONArray players = gameState.getJSONArray("players");
    
        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
    
        for (int i = 0; i < players.length(); i++) {
            JSONObject player = players.getJSONObject(i);
            JSONObject pos = player.getJSONObject("position");
    
            float x = (float) pos.getDouble("x");
            float y = (float) pos.getDouble("y");
            String team = player.getString("team");
    
            // === Dibujar borde verde fosforito ===
            shapeRenderer.setColor(0.5f, 1f, 0f, 1f); // lime green
            shapeRenderer.circle(x, y, 17); // radio mayor (borde)
    
            // === Dibujar jugador encima (relleno) ===
            switch (team.toLowerCase()) {
                case "blue":
                    shapeRenderer.setColor(0, 0, 1, 1);
                    break;
                case "red":
                    shapeRenderer.setColor(1, 0, 0, 1);
                    break;
                case "purple":
                    shapeRenderer.setColor(0.5f, 0, 0.5f, 1);
                    break;
                case "yellow":
                    shapeRenderer.setColor(1, 1, 0, 1);
                    break;
                default:
                    shapeRenderer.setColor(1, 1, 1, 1);
            }
    
            shapeRenderer.circle(x, y, 12); // radio del jugador
        }
    
        shapeRenderer.end();
    }    

    @Override
    public void resize(int width, int height) { }

    @Override
    public void pause() { }

    @Override
    public void resume() { }

    @Override
    public void hide() { }

    @Override
    public void dispose() {
        batch.dispose();
        shapeRenderer.dispose();
        font.dispose();
        titleFont.dispose();
        backgroundImage.dispose();
    }
}
