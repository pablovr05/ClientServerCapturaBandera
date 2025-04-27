package com.project.screens;

import com.badlogic.gdx.*;
import com.badlogic.gdx.graphics.*;
import com.badlogic.gdx.graphics.g2d.*;
import com.badlogic.gdx.scenes.scene2d.*;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.*;
import com.badlogic.gdx.scenes.scene2d.utils.*;
import com.badlogic.gdx.utils.Align;
import com.badlogic.gdx.utils.Scaling;
import com.badlogic.gdx.utils.ScreenUtils;
import com.badlogic.gdx.utils.viewport.ScreenViewport;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;

import org.json.JSONObject;

import okhttp3.Call;
import okhttp3.Callback;  // Importa Callback de okhttp3
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import java.io.IOException;
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

    private String nickname;
    private String email;
    private String phone;
    private String password;

    public TermsScreen(Game game, String nickname, String email, String phone, String password) {
        this.game = game;

        this.nickname = nickname;
        this.email = email;
        this.phone = phone;
        this.password = password;

        this.batch = new SpriteBatch();
        this.stage = new Stage(new ScreenViewport());
        Gdx.input.setInputProcessor(stage);

        FreeTypeFontGenerator generator = new FreeTypeFontGenerator(Gdx.files.internal("Roboto-Italic-VariableFont_wdth,wght.ttf"));
        FreeTypeFontGenerator.FreeTypeFontParameter parameter = new FreeTypeFontGenerator.FreeTypeFontParameter();
        parameter.size = 24;
        parameter.borderWidth = 0.1f;
        parameter.color = Color.WHITE;
        parameter.minFilter = Texture.TextureFilter.Linear;
        parameter.magFilter = Texture.TextureFilter.Linear;
        font = generator.generateFont(parameter);
        generator.dispose();

        backgroundTexture = new Texture("fondo3.gif");
        termsImage = new Texture("marcoTransparente.png"); // <-- carga aquí tu imagen para los términos (ponla en assets)

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
        
        // Aumentar el tamaño de la fuente para el Label
        FreeTypeFontGenerator generator = new FreeTypeFontGenerator(Gdx.files.internal("Roboto-Italic-VariableFont_wdth,wght.ttf"));
        FreeTypeFontGenerator.FreeTypeFontParameter parameter = new FreeTypeFontGenerator.FreeTypeFontParameter();
        parameter.size = 40;  // Tamaño de fuente más grande para el label
        parameter.color = Color.WHITE;
        parameter.minFilter = Texture.TextureFilter.Linear;
        parameter.magFilter = Texture.TextureFilter.Linear;
        BitmapFont largeFont = generator.generateFont(parameter);
        generator.dispose();
    
        labelStyle = new Label.LabelStyle(largeFont, Color.WHITE);  // Usar la nueva fuente más grande
    
        // Botones
        Texture buttonTexture = new Texture("button.png");
        Drawable buttonBackground = new TextureRegionDrawable(new TextureRegion(buttonTexture));
    
        TextButton.TextButtonStyle buttonStyle = new TextButton.TextButtonStyle();
        buttonStyle.font = font;
        buttonStyle.up = buttonBackground;
        buttonStyle.down = buttonBackground;
        
        // Cambiar color de texto de los botones a Dark Grey
        buttonStyle.fontColor = Color.DARK_GRAY;
    
        // Imagen
        Image termsImg = new Image(new TextureRegionDrawable(new TextureRegion(termsImage)));
        termsImg.setScaling(Scaling.fit);
    
        // Label
        termsLabel = new Label("Acepta los términos para continuar", labelStyle);
        termsLabel.setAlignment(Align.center);
    
        // Botones
        acceptButton = new TextButton("Aceptar", buttonStyle);
        acceptButton.padBottom(15f);
        cancelButton = new TextButton("Cancelar", buttonStyle);
        cancelButton.padBottom(15f);
    
        acceptButton.addListener(new ChangeListener() {
            @Override
            public void changed(ChangeEvent event, Actor actor) {
                registerUser(); // Llamamos a la función para registrar al usuario
                game.setScreen(new LoginScreen(game));
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
    

    private void registerUser() {
        System.out.println("🛠 Iniciando registro de usuario...");
    
        String urlString = "https://bandera3.ieti.site/api/register";
    
        // Crear el JSON para enviar
        JSONObject jsonPayload = new JSONObject();
        jsonPayload.put("nickname", this.nickname);
        jsonPayload.put("email", this.email);
        jsonPayload.put("phone", this.phone);
        jsonPayload.put("password", this.password);
    
        System.out.println("📦 Payload JSON a enviar:");
        System.out.println(jsonPayload.toString());
    
        OkHttpClient client = new OkHttpClient();
    
        RequestBody body = RequestBody.create(
            jsonPayload.toString(), MediaType.get("application/json; charset=utf-8")
        );
    
        Request request = new Request.Builder()
            .url(urlString)
            .post(body)
            .build();
    
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                System.out.println("❌ Error durante el proceso de registro:");
                e.printStackTrace();
                Gdx.app.postRunnable(() -> showToast("Error de conexión: " + e.getMessage()));
            }
    
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();
                System.out.println("📨 Respuesta del servidor:");
                System.out.println(responseBody);
    
                try {
                    JSONObject jsonResponse = new JSONObject(responseBody);
    
                    if (response.isSuccessful()) {
                        // Si la respuesta es exitosa
                        String message = jsonResponse.optString("message", "Registro exitoso. Revisa tu email.");
                        Gdx.app.postRunnable(() -> showToast(message));
                        System.out.println("🎯 " + message);
                    } else {
                        // Si la respuesta del servidor contiene un error
                        String error = jsonResponse.optString("error", "Error desconocido durante registro");
                        Gdx.app.postRunnable(() -> showToast("Error: " + error));
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
