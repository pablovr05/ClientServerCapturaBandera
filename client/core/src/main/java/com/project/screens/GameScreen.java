package com.project.screens;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.files.FileHandle;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
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

import java.util.HashMap;
import java.util.Map;

import javax.json.JsonObject;

public class GameScreen implements Screen {
    private final Game game;
    private SpriteBatch batch;
    private SpriteBatch uiBatch;
    private ShapeRenderer shapeRenderer;
    private ShapeRenderer uiShapeRenderer;
    private BitmapFont font, titleFont;
    private WebSockets webSockets;

    private OrthographicCamera camera;

    private JSONObject latestGameState;

    private float playerX, playerY;

    private Joystick joystick;

    private Vector2 movementOutput;

    private Texture warriorBlueSheet;
    private Texture warriorRedSheet;
    private Texture warriorPurpleSheet;
    private Texture warriorYellowSheet;
    private Texture goldSheet;

    private Texture grassSheet;
    private Texture waterSheet;
    private Texture foamSheet;
    private Texture decoSheet;
    private Texture towerSheet;

    private TextureRegion[][] blueFrames;
    private TextureRegion[][] redFrames;
    private TextureRegion[][] purpleFrames;
    private TextureRegion[][] yellowFrames;
    private TextureRegion[][] goldFrames;

    private TextureRegion[][] waterFrames;
    private TextureRegion[][] foamFrames;
    private TextureRegion[][] grassFrames;
    private TextureRegion[][] decoFrames;
    private TextureRegion[][] towerFrames;

    private JSONObject gameData;

    private float animationTimer = 0f;
    private float frameDuration = 0.1f; // 10 fps

    private Texture buttonTexture;
    private float buttonX;
    private float buttonY;
    private float buttonRadius = 75;

    private float buttonCooldown = 2f; // segundos de cooldown
    private float timeSinceLastPress = 0f;
    private boolean buttonEnabled = true;

    private Map<String, String> playerDirections = new HashMap<>();

    public GameScreen(Game game, WebSockets webSockets) throws JSONException {
        this.game = game;
        this.webSockets = webSockets;

        movementOutput = new Vector2();

        camera = new OrthographicCamera();
        camera.setToOrtho(false, 1000, 800);

        batch = new SpriteBatch(); // para el mundo
        uiBatch = new SpriteBatch(); // para la UI

        shapeRenderer = new ShapeRenderer(); // para mundo
        uiShapeRenderer = new ShapeRenderer(); // para UI

        font = new BitmapFont();
        titleFont = new BitmapFont();

        joystick = new Joystick(175, 175, 75);

        initTextures();
    }

    private void initTextures() throws JSONException {
        //Animaciones
        warriorBlueSheet = new Texture("Troops/Warrior/Blue/Warrior_Blue.png");
        warriorRedSheet = new Texture("Troops/Warrior/Red/Warrior_Red.png");
        warriorPurpleSheet = new Texture("Troops/Warrior/Purple/Warrior_Purple.png");
        warriorYellowSheet = new Texture("Troops/Warrior/Yellow/Warrior_Yellow.png");
        goldSheet = new Texture("G_Spawn.png");

        blueFrames = extractFrames(warriorBlueSheet, 192, 192, 8, 6);
        redFrames = extractFrames(warriorRedSheet, 192, 192, 8, 6);
        purpleFrames = extractFrames(warriorPurpleSheet, 192, 192, 8, 6);
        yellowFrames = extractFrames(warriorYellowSheet, 192, 192, 8, 6);
        goldFrames = extractFrames(goldSheet, 128, 128, 8, 7);

        FileHandle file = Gdx.files.internal("game_data.json");
        String jsonString = file.readString();
        gameData = new JSONObject(jsonString);

        grassSheet = new Texture("tilemap_Flat.png");
        waterSheet = new Texture("water.png");
        foamSheet = new Texture("foam.png");
        decoSheet = new Texture("deco.png");
        towerSheet = new Texture("towers.png");

        buttonTexture = new Texture(Gdx.files.internal("button.png"));

        grassFrames = extractFrames(grassSheet, 64, 64, 4, 10);
        waterFrames = extractFrames(waterSheet, 64, 64, 1, 1);
        foamFrames = extractFrames(foamSheet, 64, 64, 3, 24);
        decoFrames = extractFrames(decoSheet, 64, 64, 1, 15);
        towerFrames = extractFrames(towerSheet, 64, 64, 4, 8);
    }

    private TextureRegion[][] extractFrames(Texture sheet, int frameWidth, int frameHeight, int totalRows, int framesPerRow) {
        TextureRegion[][] allFrames = new TextureRegion[totalRows][framesPerRow];
        for (int row = 0; row < totalRows; row++) {
            for (int col = 0; col < framesPerRow; col++) {
                TextureRegion frame = new TextureRegion(sheet, col * frameWidth, row * frameHeight, frameWidth, frameHeight);
                allFrames[row][col] = frame;
            }
        }
        return allFrames;
    }

    @Override
    public void show() {
    }

    @Override
    public void render(float delta) {
        animationTimer += delta;

        // Limpiar la pantalla con un fondo negro
        ScreenUtils.clear(0.278f, 0.671f, 0.663f, 1f);

        if (!buttonEnabled) {
            timeSinceLastPress += delta;
            if (timeSinceLastPress >= buttonCooldown) {
                buttonEnabled = true;
                timeSinceLastPress = 0f;
                System.out.println("Botón listo para usarse nuevamente.");
            }
        }        

        if (latestGameState != null) {
            try {
                updatePlayerPosition(latestGameState);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

            // === Parte del mundo (con cámara) ===
            camera.position.set(playerX, playerY, 0);
            camera.update();

            batch.setProjectionMatrix(camera.combined);
            shapeRenderer.setProjectionMatrix(camera.combined);


            // === Luego dibujar el mapa ===
            try {
                drawMap(0, 0);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

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

        Vector2 touchPos = new Vector2(Gdx.input.getX(), Gdx.input.getY());
        Vector2 unprojected = new Vector2(touchPos.x, Gdx.graphics.getHeight() - touchPos.y);

        if (Gdx.input.isTouched()) {
            float dist = unprojected.dst(buttonX, buttonY);

            if (dist <= buttonRadius && buttonEnabled) {
                System.out.println("Botón tocado!");
                buttonEnabled = false; // desactiva el botón
                timeSinceLastPress = 0f;

                JSONObject message = new JSONObject();
                try {
                    message.put("type", "attack");
                    message.put("viewState", joystick.getDirectionView(movementOutput));
                    message.put("id", webSockets.getPlayerId());

                    webSockets.sendMessage(message.toString());
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }



        // Dibujar joystick
        uiShapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        joystick.draw(uiShapeRenderer);

        uiShapeRenderer.setColor(0.9f, 0.1f, 0.1f, 1);
        uiShapeRenderer.circle(buttonX, buttonY, buttonRadius);

        // Si está en cooldown, dibujar la animación de recarga
        if (!buttonEnabled) {
            float cooldownPercent = timeSinceLastPress / buttonCooldown;
            float angle = 360 * (1 - cooldownPercent); // de lleno a vacío

            uiShapeRenderer.setColor(0.1f, 0.1f, 0.1f, 0.6f); // color del overlay (gris semitransparente)
            uiShapeRenderer.arc(buttonX, buttonY, buttonRadius, 90, angle); // empieza desde arriba (90°)
        }


        uiShapeRenderer.end();

        // Mostrar contador de jugadores
        if (latestGameState != null && latestGameState.has("players")) {
            JSONArray players = null;
            try {
                players = latestGameState.getJSONArray("players");
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            int numberOfPlayers = players.length();

            // Establecer la posición en la esquina superior derecha
            float xPosition = Gdx.graphics.getWidth() - 150;  // Ajustar un margen de 150 píxeles desde el borde
            float yPosition = Gdx.graphics.getHeight() - 50;  // Ajustar 50 píxeles desde la parte superior

            // Cambiar el color del texto a negro
            font.setColor(0, 0, 0, 1);  // Color negro

            // Aumentar el tamaño del texto
            font.getData().setScale(1.5f);  // Ajusta este valor según lo grande que lo quieras

            uiBatch.begin();
            font.draw(uiBatch, "Players: " + numberOfPlayers, xPosition, yPosition);  // Dibuja el texto
            uiBatch.end();
        }

        // Procesar movimiento del joystick
        Vector2 touchPosition = new Vector2(Gdx.input.getX(), Gdx.input.getY());
        movementOutput = joystick.update(touchPosition);

        // Enviar movimiento al servidor
        JSONObject message = new JSONObject();
        try {
            message.put("type", "updateMovement");
            message.put("x", (double) movementOutput.x);
            message.put("y", (double) movementOutput.y);
            message.put("state", joystick.getDirection(movementOutput));
            message.put("id", webSockets.getPlayerId());

            webSockets.sendMessage(message.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void drawMap(int x, int y) throws JSONException {
        batch.begin();
    
        JSONArray layers = gameData.getJSONArray("levels").getJSONObject(0).getJSONArray("layers");
    
        for (int i = 0; i < layers.length(); i++) {
            JSONObject layer = layers.getJSONObject(i);
            String layerName = layer.getString("name");
            int tileWidth = layer.getInt("tilesWidth");
            int tileHeight = layer.getInt("tilesHeight");
    
            // Obtener el tile map de esta capa
            JSONArray tileMap = layer.getJSONArray("tileMap");
    
            // Set de texturas por capa
            TextureRegion[][] currentFrameSet = getTextureForLayer(layerName);
            if (currentFrameSet != null) {
                int positionX = x;
                int positionY = y;
    
                for (int row = tileMap.length() - 1; row > -1; row--) {
                    positionX = x;
                    JSONArray rowTiles = tileMap.getJSONArray(row);
    
                    for (int col = 0; col < rowTiles.length(); col++) {
                        int tile = rowTiles.getInt(col);
                        if (tile != -1) {
                            int tileRow = tile / currentFrameSet[0].length;
                            int tileCol = tile % currentFrameSet[0].length;
    
                            batch.draw(currentFrameSet[tileRow][tileCol], positionX, positionY);
                        }
                        positionX += tileWidth;
                    }
                    positionY += tileHeight;
                }
            }
        }
        batch.end();
    }
    
    private TextureRegion[][] getTextureForLayer(String layerName) {
        switch (layerName) {
            case "water0": return waterFrames;
            case "water1": return foamFrames;
            case "grass": return grassFrames;
            case "deco": return decoFrames;
            case "towers": return towerFrames;
            default: return null;
        }
    }

    private void updatePlayerPosition(JSONObject gameState) throws JSONException {
        if (!gameState.has("players")) return;

        JSONArray players = gameState.getJSONArray("players");

        for (int i = 0; i < players.length(); i++) {
            JSONObject player = players.getJSONObject(i);
            String playerId = player.getString("id"); // Usar el id del jugador para identificar a todos

            JSONObject pos = player.getJSONObject("position");
            float newX = (float) pos.getDouble("x");
            float newY = (float) pos.getDouble("y");

            // Quitar la interpolación y asignar directamente la nueva posición
            if (playerId.equals(webSockets.getPlayerId())) {
                // Dentro de tu clase de render/update en libGDX
                float delta = Gdx.graphics.getDeltaTime();

                // Si quieres interpolar suavemente la posición recibida desde el servidor:
                float lerpFactor = 10f * delta;
                playerX += (newX - playerX) * lerpFactor;
                playerY += (newY - playerY) * lerpFactor;
            }

            // Actualizar dirección solo si el estado ha cambiado
            String state = player.getString("state").toUpperCase();

            // Si el estado no es "IDLE" y ha cambiado, se actualiza la dirección
            if (!state.equals("IDLE") && !state.equals(playerDirections.get(playerId))) {
                playerDirections.put(playerId, state); // Guardamos la dirección de todos los jugadores
                System.out.println("Updated direction for player " + playerId + ": " + state);
            }
        }
    }


    public void paintEntities(JSONObject data) throws JSONException {
        if (!data.has("gameState")) return;
        latestGameState = data.getJSONObject("gameState");
    }

    private void drawPlayers(JSONObject gameState) throws JSONException {
        if (!gameState.has("players")) return;

        JSONArray players = gameState.getJSONArray("players");
        batch.begin();

        for (int i = 0; i < players.length(); i++) {
            JSONObject player = players.getJSONObject(i);
            JSONObject pos = player.getJSONObject("position");

            float x = (float) pos.getDouble("x");
            float y = (float) pos.getDouble("y");
            String team = player.getString("team").toLowerCase();
            String state = player.getString("state").toUpperCase();

            String lastDirection = playerDirections.getOrDefault(player.getString("id"), "RIGHT");

            TextureRegion[][] frames = null;
            switch (team) {
                case "blue":   frames = blueFrames;   break;
                case "red":    frames = redFrames;    break;
                case "purple": frames = purpleFrames; break;
                case "yellow": frames = yellowFrames; break;
            }

            if (frames != null) {

                int row = (state.equals("RIGHT") || state.equals("LEFT")) ? 1 : 0;
                int frameIndex = ((int)(animationTimer / frameDuration)) % 6;

                TextureRegion frame = frames[row][frameIndex];

                if (state.equals("LEFT") || (state.equals("IDLE") && lastDirection.equals("LEFT"))) {
                    frame = new TextureRegion(frame); // Evitar modificar original
                    frame.flip(true, false);  // Volteamos el sprite
                }

                if (!state.equals("IDLE")) {

                }

                float scale = 0.85f;  // Ajusta la escala según lo necesites
                batch.draw(frame, x - (96 * scale), y - (96 * scale), frame.getRegionWidth() * scale, frame.getRegionHeight() * scale);
            }
        }
        batch.end();
    }

    private void drawGold(JSONObject gameState) throws JSONException {
        if (!gameState.has("gold")) return;

        JSONArray golds = gameState.getJSONArray("gold");

        batch.begin();
        for (int i = 0; i < golds.length(); i++) {
            JSONObject gold = golds.getJSONObject(i);
            JSONObject pos = gold.getJSONObject("position");

            float x = (float) pos.getDouble("x");
            float y = (float) pos.getDouble("y");

            int frameIndex = ((int)(animationTimer / frameDuration)) % 7;
            TextureRegion[][] frames = goldFrames;

            TextureRegion frame = frames[0][frameIndex];

            float scale = 1f;  // Ajusta la escala según lo necesites
            batch.draw(frame, x - (96 * scale), y - (96 * scale), frame.getRegionWidth() * scale, frame.getRegionHeight() * scale);

        }
        batch.end();
    }

    @Override
    public void resize(int width, int height) {
        buttonX = width - buttonRadius - 100; // 25 px de margen desde la derecha
        buttonY = buttonRadius + 100;         // 25 px desde abajo
    }

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
        warriorBlueSheet.dispose();
        warriorRedSheet.dispose();
        warriorPurpleSheet.dispose();
        warriorYellowSheet.dispose();
        grassSheet.dispose();
        waterSheet.dispose();
        foamSheet.dispose();
        decoSheet.dispose();
        goldSheet.dispose();
        buttonTexture.dispose();
    }
}
