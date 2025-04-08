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
    private SpriteBatch uiBatch;
    private ShapeRenderer shapeRenderer;
    private ShapeRenderer uiShapeRenderer;
    private BitmapFont font, titleFont;
    private Texture backgroundImage;
    private WebSockets webSockets;

    private OrthographicCamera camera;

    private JSONObject latestGameState;

    private float playerX, playerY;

    private Joystick joystick;

    private Vector2 movementOutput;

    private float lastPlayerX, lastPlayerY;  // Para almacenar la última posición conocida
    private float interpolationFactor = 1f; // Factor de interpolación (ajustable)

    public GameScreen(Game game, WebSockets webSockets) {
        this.game = game;
        this.webSockets = webSockets;

        movementOutput = new Vector2();

        camera = new OrthographicCamera();
        camera.setToOrtho(false, 800, 600);

        batch = new SpriteBatch(); // para el mundo
        uiBatch = new SpriteBatch(); // para la UI

        shapeRenderer = new ShapeRenderer(); // para mundo
        uiShapeRenderer = new ShapeRenderer(); // para UI

        font = new BitmapFont();
        titleFont = new BitmapFont();
        backgroundImage = new Texture("mapa.png");

        joystick = new Joystick(175, 175, 75);
    }

    @Override
    public void show() {}

    @Override
    public void render(float delta) {
    
        ScreenUtils.clear(0, 0, 0, 1);

        if (latestGameState != null) {

            try {
                updatePlayerPosition(latestGameState);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

            // === Parte del mundo (con cámara) ===
            camera.position.set(playerX, playerY, 0);

            System.out.println("Camera pos: " + playerX + ", " + playerY);

            camera.update();

            batch.setProjectionMatrix(camera.combined);
            shapeRenderer.setProjectionMatrix(camera.combined);

            batch.begin();
            batch.draw(backgroundImage, 0, 0, 2048, 2048);
            batch.end();

            try {
                drawPlayers(latestGameState);
                drawGold(latestGameState);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
        }

        // === Parte de la UI (con proyección fija) ===
        uiShapeRenderer.setProjectionMatrix(new Matrix4().setToOrtho2D(0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight()));
        uiBatch.setProjectionMatrix(new Matrix4().setToOrtho2D(0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight()));

        // Dibujar joystick
        uiShapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        joystick.draw(uiShapeRenderer);
        uiShapeRenderer.end();

        // Procesar movimiento del joystick
        Vector2 touchPosition = new Vector2(Gdx.input.getX(), Gdx.input.getY());
        movementOutput = joystick.update(touchPosition);

        // Enviar movimiento al servidor
        JSONObject message = new JSONObject();
        try {
            message.put("type", "updateMovement");
            message.put("x", (double) movementOutput.x);
            message.put("y", (double) movementOutput.y);
            message.put("id", webSockets.getPlayerId());

            webSockets.sendMessage(message.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void updatePlayerPosition(JSONObject gameState) throws JSONException {
        if (!gameState.has("players")) return;
    
        JSONArray players = gameState.getJSONArray("players");
        String clientId = webSockets.getPlayerId();
    
        for (int i = 0; i < players.length(); i++) {
            JSONObject player = players.getJSONObject(i);
            if (player.getString("id").equals(clientId)) {
                JSONObject pos = player.getJSONObject("position");
                float newX = (float) pos.getDouble("x");
                float newY = (float) pos.getDouble("y");
    
                // Interpolación: mueve suavemente el jugador hacia la nueva posición
                playerX += newX;
                playerY += newY;
    
                // Actualiza las últimas posiciones conocidas
                lastPlayerX = playerX;
                lastPlayerY = playerY;
    
                break;
            }
        }
    
        System.out.println("La posición interpolada del jugador es: " + playerX + "," + playerY);
    }
    

    public void paintEntities(JSONObject data) throws JSONException {
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

            shapeRenderer.setColor(0.5f, 1f, 0f, 1f);
            shapeRenderer.circle(x, y, 17);

            switch (team.toLowerCase()) {
                case "blue": shapeRenderer.setColor(0, 0, 1, 1); break;
                case "red": shapeRenderer.setColor(1, 0, 0, 1); break;
                case "purple": shapeRenderer.setColor(0.5f, 0, 0.5f, 1); break;
                case "yellow": shapeRenderer.setColor(1, 1, 0, 1); break;
                default: shapeRenderer.setColor(1, 1, 1, 1); break;
            }

            shapeRenderer.circle(x, y, 12);
        }
        shapeRenderer.end();
    }

    private void drawGold(JSONObject gameState) throws JSONException {
        if (!gameState.has("gold")) return;

        JSONArray golds = gameState.getJSONArray("gold");

        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        for (int i = 0; i < golds.length(); i++) {
            JSONObject gold = golds.getJSONObject(i);
            JSONObject pos = gold.getJSONObject("position");

            float x = (float) pos.getDouble("x");
            float y = (float) pos.getDouble("y");

            shapeRenderer.setColor(1f, 0.84f, 0f, 1f);
            shapeRenderer.circle(x, y, 12);

            shapeRenderer.setColor(1f, 1f, 0.2f, 1f);
            shapeRenderer.circle(x, y, 8);
        }
        shapeRenderer.end();
    }

    @Override public void resize(int width, int height) {}
    @Override public void pause() {}
    @Override public void resume() {}
    @Override public void hide() {}

    @Override
    public void dispose() {
        batch.dispose();
        uiBatch.dispose();
        shapeRenderer.dispose();
        uiShapeRenderer.dispose();
        font.dispose();
        titleFont.dispose();
        backgroundImage.dispose();
    }
}
