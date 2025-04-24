package com.project.clases;

public class AttackEffect {
    public float x, y;
    public String direction;
    public float timer;

    public AttackEffect(float x, float y, String direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.timer = 0f;
    }
}
