package com.project.screens;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.utils.ScreenUtils;
import com.project.WebSockets;
import com.badlogic.gdx.graphics.Texture;

public class GameScreen implements Screen {
    private final Game game;
    private SpriteBatch batch;
    private ShapeRenderer shapeRenderer;
    private BitmapFont font, titleFont;
    private Texture backgroundImage;
    private WebSockets webSockets;

    public GameScreen(Game game, WebSockets webSockets) {
        this.game = game;
        batch = new SpriteBatch();
        shapeRenderer = new ShapeRenderer();
        font = new BitmapFont();
        titleFont = new BitmapFont();
        backgroundImage = new Texture("mapa.png");
        this.webSockets = webSockets;
    }

    @Override
    public void show() {
        // Este método se llama cuando la pantalla es mostrada
        // Aquí puedes inicializar recursos adicionales si es necesario
    }

    @Override
    public void render(float delta) {
        // Limpiar la pantalla (opcional, pero es buena práctica)
        ScreenUtils.clear(0, 0, 0, 1); // Limpia la pantalla con un color negro

        // Comienza el bloque de dibujo con SpriteBatch
        batch.begin();

        // Dibuja la imagen de fondo (ajustada al tamaño de la pantalla)
        batch.draw(backgroundImage, 0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight());

        // Aquí puedes agregar más elementos gráficos, como botones o textos

        // Finaliza el bloque de dibujo
        batch.end();
    }


    @Override
    public void resize(int width, int height) {
        // Este método se llama cuando la ventana cambia de tamaño
        // Puedes ajustar la lógica de tu UI aquí si es necesario
    }

    @Override
    public void pause() {
        // Este método se llama cuando la aplicación entra en segundo plano
        // Puedes pausar la lógica del juego aquí si es necesario
    }

    @Override
    public void resume() {
        // Este método se llama cuando la aplicación vuelve a primer plano
        // Puedes reanudar la lógica del juego aquí si es necesario
    }

    @Override
    public void hide() {
        // Este método se llama cuando la pantalla es escondida
        // Aquí puedes liberar recursos si es necesario
    }

    @Override
    public void dispose() {
        // Este método se llama cuando la pantalla es destruida
        batch.dispose();
        shapeRenderer.dispose();
        font.dispose();
        titleFont.dispose();
        backgroundImage.dispose();
    }
}
