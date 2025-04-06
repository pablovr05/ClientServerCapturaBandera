package com.project;

import com.badlogic.gdx.Game;
import com.project.screens.MenuScreen;


public class Main extends Game {
    @Override
    public void create() {
        this.setScreen(new MenuScreen(this)); // pantalla inicial
    }
}
