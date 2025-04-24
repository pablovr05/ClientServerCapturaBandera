package com.project.clases;

public class AttackEffect {
    public float x, y;
    public String direction;
    public float timer;
    public String attackerId;
    public String playerTeam;

    public AttackEffect(float x, float y, String direction, String attackerId, String playerTeam) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.attackerId = attackerId;
        this.playerTeam = playerTeam;
        this.timer = 0f;
    }

    @Override
    public String toString() {
        return "AttackEffect{" +
               "x=" + x +
               ", y=" + y +
               ", direction='" + direction + '\'' +
               ", timer=" + timer +
               ", team=" + playerTeam +
               '}';
    }
}
