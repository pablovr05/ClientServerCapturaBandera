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

        // Crear el JSON para enviar
        JSONObject jsonPayload = new JSONObject();
        jsonPayload.put("nickname", this.nickname);
        jsonPayload.put("email", this.email);
        jsonPayload.put("phone", this.phone);
        jsonPayload.put("password", this.password);

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
                System.out.println("❌ Error durante el proceso de registro:");
                e.printStackTrace();
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    // Si la solicitud fue exitosa
                    System.out.println("🎯 Registro exitoso, respuesta del servidor:");
                    System.out.println(response.body().string());
                } else {
                    // Si hubo un error en la solicitud
                    System.out.println("⚠️ El servidor respondió con error: " + response.code());
                    System.out.println(response.body().string());
                }
            }
        });
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
