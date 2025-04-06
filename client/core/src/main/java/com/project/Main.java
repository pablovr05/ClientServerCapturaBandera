package com.project;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.GlyphLayout;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.utils.ScreenUtils;

public class Main extends ApplicationAdapter {
    private SpriteBatch batch;
    private ShapeRenderer shapeRenderer;
    private BitmapFont font, titleFont;
    private WebSockets webSockets;

    // Configuración del panel
    private float marginRatio = 0.05f; // 5% del ancho de la pantalla como margen
    private float panelX, panelY, panelWidth, panelHeight;
    private int panelCornerRadius = 25; // Radio de esquinas redondeadas

    // Configuración del botón
    private int buttonWidth = 250, buttonHeight = 80;
    private float buttonX, buttonY;
    private int buttonCornerRadius = 15;

    // Contador de jugadores
    private int playersInMatch = 0;

    // Imagen de fondo
    private Texture backgroundImage;

    @Override
    public void create() {
        batch = new SpriteBatch();
        webSockets = new WebSockets();
        webSockets.create();
        shapeRenderer = new ShapeRenderer();
        font = new BitmapFont();
        font.setColor(Color.BLACK);

        // Fuente más grande para el título
        titleFont = new BitmapFont();
        titleFont.getData().setScale(3.5f); // Aumentar el tamaño del título
        titleFont.setColor(Color.GOLD); // Color dorado para el título

        // Cargar la imagen de fondo
        backgroundImage = new Texture(Gdx.files.internal("fondo.png"));

        // Calcular dimensiones del panel
        float screenWidth = Gdx.graphics.getWidth();
        float screenHeight = Gdx.graphics.getHeight();
        float margin = screenWidth * marginRatio; // Margen en función del ancho

        panelWidth = screenWidth * 0.3f; // 30% del ancho de la pantalla
        panelHeight = screenHeight * 0.8f; // 80% de la altura de la pantalla
        panelX = margin;
        panelY = (screenHeight - panelHeight) / 2;

        // Posicionar el botón dentro del panel
        buttonX = panelX + (panelWidth - buttonWidth) / 2;
        buttonY = panelY + panelHeight * 0.2f; // Ubicar el botón más abajo
    }

    @Override
    public void render() {
        ScreenUtils.clear(0, 0, 0, 1); // Fondo negro

        batch.begin();
        batch.draw(backgroundImage, 0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight()); // Imagen de fondo
        batch.end();

        // Dibujar el panel blanco sólido (sin opacidad)
        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        shapeRenderer.setColor(1, 1, 1, 1); // Color blanco sólido (opacidad eliminada)
        drawRoundedRect(shapeRenderer, panelX, panelY, panelWidth, panelHeight, panelCornerRadius);
        shapeRenderer.end();

        // Dibujar título del juego
        batch.begin();
        String titleText = "Golden Knights";
        GlyphLayout titleLayout = new GlyphLayout(titleFont, titleText);
        float titleX = panelX + (panelWidth - titleLayout.width) / 2;
        float titleY = panelY + panelHeight - 50; // Ubicar el título en la parte superior
        titleFont.draw(batch, titleLayout, titleX, titleY);
        batch.end();

        // Dibujar botón con bordes redondeados
        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        shapeRenderer.setColor(Color.RED);
        drawRoundedRect(shapeRenderer, buttonX, buttonY, buttonWidth, buttonHeight, buttonCornerRadius);
        shapeRenderer.end();

        // Dibujar texto en el botón
        batch.begin();
        font.getData().setScale(1.5f);
        GlyphLayout layout = new GlyphLayout(font, "Start");
        float textX = buttonX + (buttonWidth - layout.width) / 2;
        float textY = buttonY + (buttonHeight + layout.height) / 2;
        font.draw(batch, layout, textX, textY);

        // Dibujar texto de jugadores en el panel
        String playersText = "Players in match: " + playersInMatch;
        GlyphLayout playersLayout = new GlyphLayout(font, playersText);
        float playersTextX = panelX + (panelWidth - playersLayout.width) / 2;
        float playersTextY = panelY + panelHeight * 0.8f;
        font.draw(batch, playersLayout, playersTextX, playersTextY);
        batch.end();
    }

    @Override
    public void dispose() {
        batch.dispose();
        shapeRenderer.dispose();
        font.dispose();
        titleFont.dispose();
        backgroundImage.dispose();
    }

    // Método para dibujar un rectángulo con esquinas redondeadas
    private void drawRoundedRect(ShapeRenderer renderer, float x, float y, float width, float height, float radius) {
        renderer.rect(x + radius, y, width - 2 * radius, height);
        renderer.rect(x, y + radius, width, height - 2 * radius);
        renderer.circle(x + radius, y + radius, radius);
        renderer.circle(x + width - radius, y + radius, radius);
        renderer.circle(x + radius, y + height - radius, radius);
        renderer.circle(x + width - radius, y + height - radius, radius);
    }
}  