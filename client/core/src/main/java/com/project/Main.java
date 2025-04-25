package com.project;

import com.badlogic.gdx.Game;
import com.project.screens.LoginScreen;


public class Main extends Game {
    @Override
    public void create() {
        this.setScreen(new LoginScreen(this)); // pantalla inicial
    }
}
