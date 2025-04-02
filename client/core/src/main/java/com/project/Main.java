package com.project;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.ScreenUtils;
import javax.json.Json;
import javax.json.JsonObject;

/** {@link com.badlogic.gdx.ApplicationListener} implementation shared by all platforms. */
public class Main extends ApplicationAdapter {
    private SpriteBatch batch;
    private Texture image;
    private WebSockets webSockets;

    // Variables para detectar cambios de posición
    private int lastX = -1;
    private int lastY = -1;

    @Override
    public void create() {
        webSockets = new WebSockets();
        webSockets.create();
        batch = new SpriteBatch();
        image = new Texture("libgdx.png");
    }

    @Override
    public void render() {
        ScreenUtils.clear(0.15f, 0.15f, 0.2f, 1f);

        // Si la pantalla está siendo tocada o el mouse está presionado
        if (Gdx.input.isTouched()) {
            int touchX = Gdx.input.getX();
            int touchY = Gdx.input.getY();

            // Solo enviamos el mensaje si la posición ha cambiado
            if (touchX != lastX || touchY != lastY) {
                lastX = touchX;
                lastY = touchY;

                JsonObject jsonObject = Json.createObjectBuilder()
                    .add("type", "touch")
                    .add("x", touchX)
                    .add("y", touchY)
                    .build();
    
                webSockets.sendMessage(jsonObject.toString());
            }
        }

        batch.begin();
        batch.draw(image, 140, 210);
        batch.end();
    }

    @Override
    public void dispose() {
        batch.dispose();
        image.dispose();
    }
}
