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

import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;

import org.json.JSONObject;
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
                registerUser(); // Llamamos a la función para registrar al usuario
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

        // Construir el JSON usando JSONObject
        JSONObject jsonPayload = new JSONObject();
        jsonPayload.put("nickname", nickname);
        jsonPayload.put("email", email);
        jsonPayload.put("phone", phone);
        jsonPayload.put("password", password);

        System.out.println("📦 Payload JSON a enviar:");
        System.out.println(jsonPayload.toString());

        try {
            System.out.println("🌐 Creando objeto URL...");
            URL url = new URL(urlString);

            System.out.println("🔗 Abriendo conexión...");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; utf-8");
            connection.setRequestProperty("Accept", "application/json");

            System.out.println("✉️ Enviando datos al servidor...");
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonPayload.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            System.out.println("✅ Datos enviados correctamente.");

            int responseCode = connection.getResponseCode();
            System.out.println("🔍 Código de respuesta: " + responseCode);

            InputStream inputStream;
            if (responseCode >= 200 && responseCode < 400) {
                inputStream = connection.getInputStream();
            } else {
                inputStream = connection.getErrorStream();
            }

            System.out.println("⏳ Leyendo respuesta...");
            try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                System.out.println("📨 Respuesta recibida del servidor:");
                System.out.println(response.toString());
            }

            if (responseCode == HttpURLConnection.HTTP_OK) {
                System.out.println("🎯 Registro exitoso, cambiando a pantalla de menú...");
                game.setScreen(new MenuScreen(game));
            } else {
                System.out.println("⚠️ El servidor respondió con error (" + responseCode + ")");
            }

        } catch (Exception e) {
            System.out.println("❌ Error durante el proceso de registro:");
            e.printStackTrace();
        }
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
