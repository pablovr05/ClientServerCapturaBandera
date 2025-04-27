package com.project.screens;

import java.io.IOException;

import org.json.JSONObject;

import com.badlogic.gdx.*;
import com.badlogic.gdx.graphics.*;
import com.badlogic.gdx.graphics.g2d.*;
import com.badlogic.gdx.scenes.scene2d.*;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.*;
import com.badlogic.gdx.scenes.scene2d.utils.*;
import com.badlogic.gdx.utils.Align;
import com.badlogic.gdx.utils.ScreenUtils;
import com.badlogic.gdx.utils.viewport.ScreenViewport;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

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
                        showToast("Faltan datos para el registro");
                    }
                } else {
                    System.out.println("Iniciando sesión:");
                    System.out.println("Nickname: " + nicknameField.getText());
                    System.out.println("Contraseña: " + passwordField.getText());
                    loginUser(nicknameField.getText(), passwordField.getText());
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

    private void loginUser(String nickname, String password) {
        System.out.println("🛠 Iniciando login de usuario...");
    
        String urlString = "https://bandera3.ieti.site/api/login";
    
        // Crear el JSON para enviar
        JSONObject jsonPayload = new JSONObject();
        jsonPayload.put("nickname", nickname);
        jsonPayload.put("password", password);
    
        System.out.println("📦 Payload JSON a enviar:");
        System.out.println(jsonPayload.toString());
    
        // Crear el cliente OkHttp
        OkHttpClient client = new OkHttpClient();
    
        // Crear el cuerpo de la solicitud
        RequestBody body = RequestBody.create(
            jsonPayload.toString(), MediaType.get("application/json; charset=utf-8")
        );
    
        // Crear la solicitud POST
        Request request = new Request.Builder()
            .url(urlString)
            .post(body)
            .build();
    
        // Enviar la solicitud
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                System.out.println("❌ Error durante el proceso de login:");
                e.printStackTrace();
    
                Gdx.app.postRunnable(() -> {
                    showToast("Error de conexión: " + e.getMessage());
                });
            }
    
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();  // Leer la respuesta como String
                System.out.println("📨 Respuesta del servidor:");
                System.out.println(responseBody);
    
                try {
                    JSONObject jsonResponse = new JSONObject(responseBody);
    
                    if (response.isSuccessful()) {
                        // Si el login fue exitoso
                        String message = jsonResponse.optString("message", "Login exitoso");
                        Gdx.app.postRunnable(() -> showToast(message));  // Mostrar toast bonito
                        System.out.println("🎯 " + message);
    
                        // Aquí podemos hacer algo específico si el login fue exitoso, como redirigir a otra pantalla
                        // Por ejemplo:
                        if (message.equals("Login exitoso")) {
                            // Llamar una función que redirija a la pantalla principal del usuario
                            game.setScreen(new MenuScreen(game));
                        }
                    } else {
                        // Si hubo error
                        String error = jsonResponse.optString("error", "Error desconocido");
                        Gdx.app.postRunnable(() -> showToast(error));  // Mostrar error en toast
                        System.out.println("⚠️ Error recibido: " + error);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    Gdx.app.postRunnable(() -> showToast("Error procesando respuesta del servidor"));
                }
            }
        });
    }
    
    private void showToast(String message) {
        // Crear un fondo de color (negro semi-transparente)
        Pixmap pixmap = new Pixmap(1, 1, Pixmap.Format.RGBA8888);
        pixmap.setColor(0, 0, 0, 0.7f);  // Negro con 70% de opacidad
        pixmap.fill();
        Texture backgroundTexture = new Texture(pixmap);
        pixmap.dispose();
    
        Drawable backgroundDrawable = new TextureRegionDrawable(new TextureRegion(backgroundTexture));
    
        // Estilo de la Label
        Label.LabelStyle labelStyle = new Label.LabelStyle();
        labelStyle.font = font;  // Tu fuente
        labelStyle.fontColor = Color.WHITE;  // Texto blanco para contraste
    
        // Crear el label
        final Label toastLabel = new Label(message, labelStyle);
        toastLabel.setAlignment(Align.center);
    
        // Meter el label en un container para poder ponerle padding y fondo
        Container<Label> container = new Container<>(toastLabel);
        container.setBackground(backgroundDrawable);
        container.pad(20);  // Un poco de padding alrededor del texto
        container.pack();
    
        // Posicionar en el centro
        container.setPosition(Gdx.graphics.getWidth() / 2f, Gdx.graphics.getHeight() / 2f, Align.center);
    
        stage.addActor(container);
    
        // Animaciones: entrar suave, esperar, salir
        container.addAction(Actions.sequence(
            Actions.alpha(0),
            Actions.fadeIn(0.5f),
            Actions.delay(2f),
            Actions.fadeOut(0.5f),
            Actions.removeActor()
        ));
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
