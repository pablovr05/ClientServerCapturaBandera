package com.project.screens;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.utils.ScreenUtils;
import com.project.WebSockets;
import org.json.JSONArray;
import org.json.JSONObject;

public class GameScreen implements Screen {
    private final Game game;
    private SpriteBatch batch;
    private ShapeRenderer shapeRenderer;
    private BitmapFont font, titleFont;
    private Texture backgroundImage;
    private WebSockets webSockets;

    private JSONObject latestGameState; // Aquí se guarda el estado actual

    public GameScreen(Game game, WebSockets webSockets) {
        this.game = game;
        this.webSockets = webSockets;

        batch = new SpriteBatch();
        shapeRenderer = new ShapeRenderer();
        font = new BitmapFont();
        titleFont = new BitmapFont();
        backgroundImage = new Texture("mapa.png");
    }

    @Override
    public void show() {
        // Inicialización adicional si es necesaria
    }

    @Override
    public void render(float delta) {
        ScreenUtils.clear(0, 0, 0, 1);

        batch.begin();
        batch.draw(backgroundImage, 0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
        batch.end();

        if (latestGameState != null) {
            drawPlayers(latestGameState);
        }
    }

    public void paintPlayers(JSONObject data) {
        System.out.println("info a dibujar: " + data);
        if (!data.has("gameState")) return;
        latestGameState = data.getJSONObject("gameState");
    }

    private void drawPlayers(JSONObject gameState) {
        if (!gameState.has("players")) return;

        JSONArray players = gameState.getJSONArray("players");

        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);

        for (int i = 0; i < players.length(); i++) {
            JSONObject player = players.getJSONObject(i);
            JSONObject pos = player.getJSONObject("position");

            float x = (float) pos.getDouble("x");
            float y = (float) pos.getDouble("y");
            String team = player.getString("team");

            float scaleX = (float) Gdx.graphics.getWidth() / 2048f;
            float scaleY = (float) Gdx.graphics.getHeight() / 2048f;
            float screenX = x * scaleX;
            float screenY = y * scaleY;

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
