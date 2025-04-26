package com.project.screens;

import okhttp3.Call;
import okhttp3.Callback;  // Importa Callback de okhttp3
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import org.json.JSONObject;
import java.io.IOException;

public class TermsScreen2 {

    private String nickname;
    private String email;
    private String phone;
    private String password;

    // Constructor
    public TermsScreen2(String nickname, String email, String phone, String password) {
        this.nickname = nickname;
        this.email = email;
        this.phone = phone;
        this.password = password;
    }

    // Función para registrar el usuario
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
    
    // Llamar a esta función en el lugar adecuado, por ejemplo, cuando el usuario acepta los términos.
    public static void main(String[] args) {
        TermsScreen2 termsScreen = new TermsScreen2("wd", "wd", "wd", "wd");
        termsScreen.registerUser();
    }
}
