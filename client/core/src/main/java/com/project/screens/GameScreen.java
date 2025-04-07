package com.project.screens;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
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
        ScreenUtils.clear(0, 0, 0, 1); // Clear the screen with black color

        if (latestGameState != null) {
            // Update player position
            try {
                updatePlayerPosition(latestGameState);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

            // Draw the background
            batch.begin();
            batch.draw(backgroundImage, 0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight()); // Map background
            batch.end();

            try {
                drawPlayers(latestGameState); // Draw other players
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
        }

        // Update and draw the joystick
        Vector2 touchPosition = new Vector2(Gdx.input.getX(), Gdx.input.getY());

        movementOutput = joystick.update(touchPosition); // Update joystick state with the current touch position

        // Crear un objeto JSON con el tipo "updateMovement" y los valores correspondientes
        JSONObject message = new JSONObject();
        try {
            message.put("type", "updateMovement");
            message.put("x", Double.valueOf(movementOutput.x));  // Convert float to Double
            message.put("y", Double.valueOf(movementOutput.y));  // Convert float to Double
            message.put("id", webSockets.getPlayerId());  // Suponiendo que webSockets.getPlayerId() devuelve el ID del jugador

            // Enviar el mensaje al servidor
            webSockets.sendMessage(message.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }

        // Draw the joystick
        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        joystick.draw(shapeRenderer); // Draw joystick background and thumbstick
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

            // Scale player coordinates for the screen size
            float scaleX = (float) Gdx.graphics.getWidth() / 2048f;
            float scaleY = (float) Gdx.graphics.getHeight() / 2048f;
            float screenX = x * scaleX;
            float screenY = y * scaleY;

            // Set color based on player's team
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

            // Draw player as a circle on the screen
            shapeRenderer.circle(screenX, screenY, 5);
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
