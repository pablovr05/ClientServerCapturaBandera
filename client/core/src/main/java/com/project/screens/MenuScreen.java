package com.project.screens;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.utils.ChangeListener;
import com.project.WebSockets;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.Screen;

public class MenuScreen implements Screen {
    private final Game game;
    private Stage stage;
    private SpriteBatch batch;
    private BitmapFont font;
    private Label titleLabel, playersLabel;
    private TextButton startButton;
    private Texture backgroundTexture; // Fondo de la pantalla
    private int playersInMatch = 0;

    private WebSockets webSockets;

    public MenuScreen(Game game) {
        this.game = game;
        batch = new SpriteBatch();
        font = new BitmapFont(); // Usando una fuente básica

        // Cargar la imagen de fondo
        backgroundTexture = new Texture("fondo.png");

        // Configurar el stage
        stage = new Stage();
        Gdx.input.setInputProcessor(stage);

        // Crear el estilo para las etiquetas
        Label.LabelStyle labelStyle = new Label.LabelStyle();
        labelStyle.font = font;

        titleLabel = new Label("Golden Knight", labelStyle);
        titleLabel.setFontScale(3f);
        titleLabel.setColor(Color.GOLD);

        // Crear el estilo para la etiqueta de jugadores
        playersLabel = new Label("Players: " + playersInMatch, labelStyle);
        playersLabel.setFontScale(2.0f);
        playersLabel.setWidth(100);
        playersLabel.setColor(Color.BLACK);

        // Crear el estilo para el botón
        TextButton.TextButtonStyle buttonStyle = new TextButton.TextButtonStyle();
        buttonStyle.font = font;
        startButton = new TextButton("Start Game", buttonStyle);
        startButton.setColor(Color.BLACK);
        startButton.setSize(250, 80);

        startButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                // Cambiar a la pantalla del juego
                game.setScreen(new GameScreen(game));
            }
        });

        // Crear la tabla para los elementos UI alineados a la izquierda
        Table table = new Table();
        table.setFillParent(false); // La tabla ocupa toda la pantalla

        // Creamos un fondo solo para los elementos de la tabla
        table.setBackground(new Image(new TextureRegion(new Texture("marco.png"))).getDrawable());
        
        table.setWidth(750);
        table.setHeight(750);

        // Centrar los elementos dentro de la tabla
        table.defaults().center().pad(10);  // Usamos `.center()` para alinear al centro y `.pad()` para agregar espacio entre elementos

        table.add(titleLabel).row();
        table.add(playersLabel).row();
        table.add(startButton).row();

        // Añadir la tabla al stage
        stage.addActor(table);

        webSockets = new WebSockets(this);

    }

    // Método que simula la actualización de los jugadores conectados
    public void updatePlayersCount(int newCount) {
        playersInMatch = newCount;
        playersLabel.setText("Players: " + playersInMatch);
    }

    @Override
    public void show() {
        // El Stage ya está configurado
    }

    @Override
    public void render(float delta) {
        batch.begin();
        // Dibujar el fondo
        batch.draw(backgroundTexture, 0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
        batch.end();

        // Dibujar el stage (UI)
        stage.act(Math.min(Gdx.graphics.getDeltaTime(), 1 / 30f));
        stage.draw();
    }

    @Override
    public void resize(int width, int height) {
        stage.getViewport().update(width, height, true);
    }

    @Override
    public void pause() {}

    @Override
    public void resume() {}

    @Override
    public void hide() {}

    @Override
    public void dispose() {
        stage.dispose();
        backgroundTexture.dispose(); // Liberar la textura del fondo
        batch.dispose();
        font.dispose();
    }
}
