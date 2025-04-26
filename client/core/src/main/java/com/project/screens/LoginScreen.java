package com.project.screens;

import com.badlogic.gdx.*;
import com.badlogic.gdx.graphics.*;
import com.badlogic.gdx.graphics.g2d.*;
import com.badlogic.gdx.scenes.scene2d.*;
import com.badlogic.gdx.scenes.scene2d.ui.*;
import com.badlogic.gdx.scenes.scene2d.utils.*;
import com.badlogic.gdx.utils.Align;
import com.badlogic.gdx.utils.ScreenUtils;
import com.badlogic.gdx.utils.viewport.ScreenViewport;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;

public class LoginScreen implements Screen {

    private final Game game;
    private Stage stage;
    private BitmapFont font;
    private SpriteBatch batch;
    private Texture backgroundTexture;

    private Table table;
    private TextField nicknameField;
    private TextField emailField;
    private TextField phoneField;
    private TextField passwordField;
    private TextButton confirmButton;
    private TextButton loginModeButton;
    private TextButton registerModeButton;
    private TextButton guestButton;
    private Label titleLabel;
    private Container<Table> container;

    private boolean isRegisterMode = false;

    public LoginScreen(Game game) {
        this.game = game;
        this.batch = new SpriteBatch();
        this.stage = new Stage(new ScreenViewport());
        Gdx.input.setInputProcessor(stage);

        // Cargar fuente TTF bonita
        FreeTypeFontGenerator generator = new FreeTypeFontGenerator(Gdx.files.internal("Roboto-Italic-VariableFont_wdth,wght.ttf"));
        FreeTypeFontGenerator.FreeTypeFontParameter parameter = new FreeTypeFontGenerator.FreeTypeFontParameter();
        parameter.size = 32; // tamaño grande y nítido
        parameter.color = Color.WHITE;
        parameter.minFilter = Texture.TextureFilter.Linear;
        parameter.magFilter = Texture.TextureFilter.Linear;
        font = generator.generateFont(parameter);
        generator.dispose();

        backgroundTexture = new Texture("fondo3.gif");

        createUI();
    }

    private void createUI() {
        table = new Table();
        table.top().pad(30);

        container = new Container<>(table);
        container.setTransform(true);
        container.setFillParent(false);

        Pixmap pixmap = new Pixmap(1, 1, Pixmap.Format.RGBA8888);
        pixmap.setColor(Color.WHITE);
        pixmap.fill();
        Texture whiteTexture = new Texture(pixmap);
        pixmap.dispose();

        // Estilo para el título
        Label.LabelStyle labelStyle = new Label.LabelStyle(font, Color.WHITE);

        // Estilo para el fondo de los botones
        Texture buttonTexture = new Texture("button.png"); // Añade tu imagen de fondo
        Drawable buttonBackground = new TextureRegionDrawable(new TextureRegion(buttonTexture));

        // Estilo para los TextFields
        TextField.TextFieldStyle textFieldStyle = new TextField.TextFieldStyle();
        textFieldStyle.font = font;
        textFieldStyle.fontColor = Color.BLACK;
        textFieldStyle.background = new TextureRegionDrawable(new TextureRegion(whiteTexture));

        // Estilo para los botones
        TextButton.TextButtonStyle buttonStyle = new TextButton.TextButtonStyle();
        buttonStyle.font = font;
        buttonStyle.up = buttonBackground; // Asignar fondo a los botones
        buttonStyle.down = buttonBackground; // Fondo cuando el botón es presionado

        // Crear el título
        titleLabel = new Label("Login / Registro", labelStyle);

        // Crear los campos de texto
        nicknameField = new TextField("", textFieldStyle);
        nicknameField.setMessageText("Nickname");

        emailField = new TextField("", textFieldStyle);
        emailField.setMessageText("Email");

        phoneField = new TextField("", textFieldStyle);
        phoneField.setMessageText("Teléfono (opcional)");

        passwordField = new TextField("", textFieldStyle);
        passwordField.setMessageText("Contraseña");
        passwordField.setPasswordCharacter('*');
        passwordField.setPasswordMode(true);

        // Crear los botones
        confirmButton = new TextButton("Confirmar", buttonStyle);
        loginModeButton = new TextButton("Modo Login", buttonStyle);
        registerModeButton = new TextButton("Modo Registro", buttonStyle);
        guestButton = new TextButton("Entrar como Invitado", buttonStyle);

        // Listener para los botones
        confirmButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                if (isRegisterMode) {
                    System.out.println("Registrando:");
                    System.out.println("Nickname: " + nicknameField.getText());
                    System.out.println("Email: " + emailField.getText());
                    System.out.println("Teléfono: " + phoneField.getText());
                    System.out.println("Contraseña: " + passwordField.getText());
                    if (!nicknameField.getText().isEmpty() && !emailField.getText().isEmpty() && !passwordField.getText().isEmpty()) {
                        game.setScreen(new TermsScreen(game, nicknameField.getText(), emailField.getText(), phoneField.getText(), passwordField.getText()));
                    } else {
                        System.out.println("Faltan datos para el registro");
                    }
                } else {
                    System.out.println("Iniciando sesión:");
                    System.out.println("Nickname: " + nicknameField.getText());
                    System.out.println("Contraseña: " + passwordField.getText());
                }
            }
        });

        loginModeButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                isRegisterMode = false;
                rebuildForm();
            }
        });

        registerModeButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                isRegisterMode = true;
                rebuildForm();
            }
        });

        guestButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                game.setScreen(new MenuScreen(game));
            }
        });

        rebuildForm();
    }

    private void rebuildForm() {
        table.clear();

        titleLabel.setText(isRegisterMode ? "Registro" : "Login");

        table.add(titleLabel).colspan(2).padBottom(25).expandX().fillX().row();
        table.add(nicknameField).colspan(2).height(50).padBottom(15).expandX().fillX().row();

        if (isRegisterMode) {
            table.add(emailField).colspan(2).height(50).padBottom(15).expandX().fillX().row();
            table.add(phoneField).colspan(2).height(50).padBottom(15).expandX().fillX().row();
        }

        table.add(passwordField).colspan(2).height(50).padBottom(25).expandX().fillX().row();

        // Botones con mayor altura
        table.add(confirmButton).colspan(2).height(80).padBottom(25).expandX().fillX().row();  // Aumenté la altura a 70
        table.add(loginModeButton).height(80).pad(5).expandX().fillX();  // Aumenté la altura a 70
        table.add(registerModeButton).height(80).pad(5).expandX().fillX().row();  // Aumenté la altura a 70
        table.add(guestButton).colspan(2).height(80).padTop(20).expandX().fillX();  // Aumenté la altura a 70

        stage.clear();
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
        float containerWidth = width * 0.5f;
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
    }
}
