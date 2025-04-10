package com.project.clases;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.*;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Vector2;

public class Joystick {
    // Initialize variables
    Vector2 parentPosition;
    float radius;

    Vector2 thumbstickPosition;
    float thumbstickSize;

    float horizontalInput = 0;
    float verticalInput = 0;

    boolean isPressed = false;


    public Joystick(float x, float y, float radius) {
        // Set values
        this.parentPosition = new Vector2(x, y);
        this.radius = radius;

        this.thumbstickPosition = new Vector2(this.parentPosition.x, this.parentPosition.y);
        this.thumbstickSize = 20;
    }

    public Vector2 update(Vector2 touchPosition) {
        // Convertir las coordenadas Y para que coincidan con el sistema de coordenadas del mundo
        touchPosition.y = Gdx.graphics.getHeight() - touchPosition.y;
    
        // Verifica si el toque está dentro del área del joystick
        boolean isInJoystick = touchPosition.dst(parentPosition) <= radius;
    
        // Detectar si el joystick fue presionado o no
        if (Gdx.input.justTouched() && isInJoystick) {
            isPressed = true;
        } else if (!Gdx.input.isTouched()) {
            isPressed = false;
        }
    
        // Actualiza la posición del thumbstick
        if (isPressed) {
            if (isInJoystick) {
                thumbstickPosition.set(touchPosition); // Mover el thumbstick al toque si está dentro del radio
            } else {
                // Si el toque está fuera del área, restringir el movimiento al borde del radio
                float angle = angleToPoint(parentPosition, touchPosition);
                thumbstickPosition.x = (float) (parentPosition.x + Math.cos(angle) * radius);
                thumbstickPosition.y = (float) (parentPosition.y + Math.sin(angle) * radius);
            }
        } else {
            // Si no está presionado, resetear el thumbstick a la posición original
            thumbstickPosition.set(parentPosition);
        }
    
        // Calcular el desplazamiento en relación al centro del joystick
        float deltaX = thumbstickPosition.x - parentPosition.x;
        float deltaY = thumbstickPosition.y - parentPosition.y;
    
        // Calcular la distancia del thumbstick desde el centro
        float distance = (float) Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
        // Calculamos el multiplicador de velocidad (max 1)
        float speedMultiplier = distance / radius;
    
        // Asegurarnos de que el multiplicador no supere 1
        if (speedMultiplier > 1) {
            speedMultiplier = 1;
        }
    
        // Calcular las entradas horizontales y verticales
        horizontalInput = deltaX / radius; // Rango entre -1 y 1
        verticalInput = deltaY / radius;   // Rango entre -1 y 1
    
        // Retornar los valores de entrada horizontal y vertical como un Vector2
        //System.out.println("Horizontal: " + horizontalInput + ", Vertical: " + verticalInput);
    
        return new Vector2(horizontalInput, verticalInput); // Retorna los valores de dirección
    }
    

    // Draws every frame
    public void draw(ShapeRenderer shapeRenderer) {
        // Draw joystick background
        shapeRenderer.setColor(Color.BLACK);
        shapeRenderer.circle(parentPosition.x, parentPosition.y, radius);

        // Draw thumbstick
        shapeRenderer.setColor(Color.WHITE);
        shapeRenderer.circle(thumbstickPosition.x, thumbstickPosition.y, thumbstickSize);
    }

    // Gets the horizontalInput value
    public float getHorizontalInput() {return horizontalInput;}

    // Gets the verticalInput value
    public float getVerticalInput() {return verticalInput;}

    // Set the position for the joystick
    public void setPosition(float x, float y) {
        this.parentPosition.x = x;
        this.parentPosition.y = y;
    }

    // Gets the angle of the thumbstick
    public float getThumbstickAngle() {
        float localThumbstickX = thumbstickPosition.x - parentPosition.x;
        float localThumbstickY = thumbstickPosition.y - parentPosition.y;
        return new Vector2(localThumbstickX, localThumbstickY).angleDeg();
    }

    // Return the radius of the thumbstick
    public float getRadius() {return radius;}

    // Return the angle of a vector
    private float angle(Vector2 vector) {return MathUtils.atan2(vector.y, vector.x);}

    // Return the point of the angle
    private float angleToPoint(Vector2 vectorA, Vector2 vectorB) {
        return angle(new Vector2(vectorB.x - vectorA.x, vectorB.y - vectorA.y));
    }

    public String getDirection(Vector2 movementOutput) {
        float x = movementOutput.x;
        float y = movementOutput.y;

        if (x == 0 && y == 0) {
            return "IDLE";
        } else if (x > 0) {
            return "RIGHT";
        }
        return "LEFT";
    }

}