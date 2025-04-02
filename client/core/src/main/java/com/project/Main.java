package com.project;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.GlyphLayout;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.utils.ScreenUtils;

public class Main extends ApplicationAdapter {
    private SpriteBatch batch;
    private ShapeRenderer shapeRenderer;
    private BitmapFont font;

    // Botón
    private int buttonX, buttonY, buttonWidth, buttonHeight;
    private int cornerRadius = 15; // Radio de esquinas redondeadas

    // Contador de jugadores
    private int playersInMatch = 0;

    @Override
    public void create() {
        batch = new SpriteBatch();
        shapeRenderer = new ShapeRenderer();
        font = new BitmapFont();
        font.setColor(Color.WHITE); // Texto en blanco

        // Posicionar el botón en el centro con tamaño reducido
        buttonWidth = 250;
        buttonHeight = 80;
        buttonX = (Gdx.graphics.getWidth() - buttonWidth) / 2;
        buttonY = (Gdx.graphics.getHeight() - buttonHeight) / 2;
    }

    @Override
    public void render() {
        ScreenUtils.clear(0, 0, 0, 1); // Fondo negro

        // Dibujar botón con bordes redondeados
        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        shapeRenderer.setColor(Color.RED); // Color del botón

        // Dibujar rectángulo central
        shapeRenderer.rect(buttonX + cornerRadius, buttonY, buttonWidth - 2 * cornerRadius, buttonHeight);
        shapeRenderer.rect(buttonX, buttonY + cornerRadius, buttonWidth, buttonHeight - 2 * cornerRadius);

        // Redondear esquinas
        shapeRenderer.circle(buttonX + cornerRadius, buttonY + cornerRadius, cornerRadius);
        shapeRenderer.circle(buttonX + buttonWidth - cornerRadius, buttonY + cornerRadius, cornerRadius);
        shapeRenderer.circle(buttonX + cornerRadius, buttonY + buttonHeight - cornerRadius, cornerRadius);
        shapeRenderer.circle(buttonX + buttonWidth - cornerRadius, buttonY + buttonHeight - cornerRadius, cornerRadius);

        shapeRenderer.end();

        // Añadir texto en el botton
        batch.begin();
        GlyphLayout layout = new GlyphLayout(font, "Start");
        float textX = buttonX + (buttonWidth - layout.width) / 2;
        float textY = buttonY + (buttonHeight + layout.height) / 2;
        font.draw(batch, layout, textX, textY);
        batch.end();

        // Dibujar texto de jugadores
        batch.begin();
        String playersText = "Players in match: " + playersInMatch;
        GlyphLayout playersLayout = new GlyphLayout(font, playersText);
        float playersTextX = (Gdx.graphics.getWidth() - playersLayout.width) / 2;
        float playersTextY = buttonY - 20;
        font.draw(batch, playersLayout, playersTextX, playersTextY);
        batch.end();

        // Detectar clic en botón
        if (Gdx.input.justTouched()) {
            int touchX = Gdx.input.getX();
            int touchY = Gdx.graphics.getHeight() - Gdx.input.getY(); // Ajuste de coordenadas

            if (touchX >= buttonX && touchX <= buttonX + buttonWidth &&
                touchY >= buttonY && touchY <= buttonY + buttonHeight) {
                System.out.println("Empezando partida...");
                // Aquí puedes enviar el evento al servidor para iniciar la partida
            }
        }
    }

    @Override
    public void dispose() {
        batch.dispose();
        shapeRenderer.dispose();
        font.dispose();
    }
}
