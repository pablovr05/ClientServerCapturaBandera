package com.project.screens;

import com.badlogic.gdx.*;
import com.badlogic.gdx.graphics.*;
import com.badlogic.gdx.graphics.g2d.*;
import com.badlogic.gdx.scenes.scene2d.*;
import com.badlogic.gdx.scenes.scene2d.ui.*;
import com.badlogic.gdx.scenes.scene2d.utils.*;
import com.badlogic.gdx.utils.Align;
import com.badlogic.gdx.utils.Scaling;
import com.badlogic.gdx.utils.ScreenUtils;
import com.badlogic.gdx.utils.viewport.ScreenViewport;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;

public class TermsScreen implements Screen {

    private final Game game;
    private Stage stage;
    private SpriteBatch batch;
    private BitmapFont font;
    private Texture backgroundTexture;
    private Texture termsImage;

    private Table table;
    private Container<Table> container;
    private TextButton acceptButton;
    private TextButton cancelButton;
    private Label termsLabel;

    public TermsScreen(Game game) {
        this.game = game;
        this.batch = new SpriteBatch();
        this.stage = new Stage(new ScreenViewport());
        Gdx.input.setInputProcessor(stage);

        FreeTypeFontGenerator generator = new FreeTypeFontGenerator(Gdx.files.internal("Roboto-Italic-VariableFont_wdth,wght.ttf"));
        FreeTypeFontGenerator.FreeTypeFontParameter parameter = new FreeTypeFontGenerator.FreeTypeFontParameter();
        parameter.size = 32;
        parameter.color = Color.WHITE;
        parameter.minFilter = Texture.TextureFilter.Linear;
        parameter.magFilter = Texture.TextureFilter.Linear;
        font = generator.generateFont(parameter);
        generator.dispose();

        backgroundTexture = new Texture("fondo3.gif");
        termsImage = new Texture("fondo.png"); // <-- carga aquí tu imagen para los términos (ponla en assets)

        createUI();
    }

    private void createUI() {
        table = new Table();
        table.top().pad(30);
        container = new Container<>(table);
        container.setTransform(true);
        container.setFillParent(false);

        // Estilos
        Label.LabelStyle labelStyle = new Label.LabelStyle(font, Color.WHITE);
        Texture buttonTexture = new Texture("button.png");
        Drawable buttonBackground = new TextureRegionDrawable(new TextureRegion(buttonTexture));

        TextButton.TextButtonStyle buttonStyle = new TextButton.TextButtonStyle();
        buttonStyle.font = font;
        buttonStyle.up = buttonBackground;
        buttonStyle.down = buttonBackground;

        // Imagen
        Image termsImg = new Image(new TextureRegionDrawable(new TextureRegion(termsImage)));
        termsImg.setScaling(Scaling.fit);

        // Label
        termsLabel = new Label("Acepta los términos para continuar", labelStyle);
        termsLabel.setAlignment(Align.center);

        // Botones
        acceptButton = new TextButton("Aceptar", buttonStyle);
        cancelButton = new TextButton("Cancelar", buttonStyle);

        acceptButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                game.setScreen(new MenuScreen(game));
            }
        });

        cancelButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                game.setScreen(new LoginScreen(game));
            }
        });

        // Subtabla para poner los botones juntos
        Table buttonsTable = new Table();
        buttonsTable.add(acceptButton).width(250).height(80).padRight(20);
        buttonsTable.add(cancelButton).width(250).height(80);

        // Construcción principal
        table.add(termsImg)
            .width(Gdx.graphics.getWidth() * 0.6f)
            .height(Gdx.graphics.getHeight() * 0.6f)
            .row();

        table.add(termsLabel)
            .padTop(20)
            .padBottom(20)
            .row();

        table.add(buttonsTable) // Aquí agregamos los botones juntos
            .padTop(20)
            .row();

        stage.addActor(container);
    }


    @Override
    public void show() {}

    @Override
    public void render(float delta) {
        ScreenUtils.clear(0, 0, 0, 1);

        batch.begin();
        batch.draw(backgroundTexture, 0, 0, Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
        batch.end();

        stage.act(delta);
        stage.draw();
    }

    @Override
    public void resize(int width, int height) {
        stage.getViewport().update(width, height, true);
        float containerWidth = width * 0.8f;
        container.setSize(containerWidth, height);
        container.setPosition((width - containerWidth) / 2f, 0);
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
        batch.dispose();
        font.dispose();
        backgroundTexture.dispose();
        termsImage.dispose();
    }
}
