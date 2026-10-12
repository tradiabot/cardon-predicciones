package com.cardonpredicciones.app;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.util.Iterator;

/** Lo que la interfaz web puede pedirle al teléfono (window.AndroidApp): huella, avisos y el instalador. */
public class Puente {
    private static final String LLAVE = "cardon_pred_sesion_v1";
    private static final String PREFIJO_SESION = "Cardón Predicciones · iniciar sesión · ";
    private final Activity activity;
    private final Context context;
    private final WebView web;

    Puente(Activity activity, WebView web) { this.activity = activity; this.context = activity.getApplicationContext(); this.web = web; }

    private String error(String codigo) { try { return new JSONObject().put("error", codigo).toString(); } catch (Exception e) { return "{\"error\":\"ERROR\"}"; } }
    private String error(Exception e) { return error(e.getClass().getSimpleName() + (e.getMessage() == null ? "" : ": " + e.getMessage())); }
    private void responder(String funcion, String json) { web.post(() -> web.evaluateJavascript("window." + funcion + "&&window." + funcion + "(" + JSONObject.quote(json) + ");", null)); }

    /* ---------- Huella: una llave que solo se puede usar tras huella, rostro o PIN ---------- */

    private KeyStore almacen() throws Exception { KeyStore s = KeyStore.getInstance("AndroidKeyStore"); s.load(null); return s; }

    private String publica() throws Exception {
        java.security.cert.Certificate cert = almacen().getCertificate(LLAVE);
        return cert == null ? null : Base64.encodeToString(cert.getPublicKey().getEncoded(), Base64.NO_WRAP);
    }

    /** {disponible, publica}: si el teléfono puede usar huella y si ya tiene su llave. */
    @JavascriptInterface public String huellaEstado() {
        try {
            String p = publica();
            return new JSONObject().put("disponible", Build.VERSION.SDK_INT >= Build.VERSION_CODES.P).put("publica", p == null ? JSONObject.NULL : p).toString();
        } catch (Exception e) { return error(e); }
    }

    /** Crea la llave del teléfono (si no existe) y devuelve su mitad pública. La privada nunca sale del almacén seguro. */
    @JavascriptInterface public String crearLlave() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return error("HUELLA_NO_DISPONIBLE");
        try {
            if (publica() == null) {
                KeyPairGenerator g = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");
                KeyGenParameterSpec.Builder b = new KeyGenParameterSpec.Builder(LLAVE, KeyProperties.PURPOSE_SIGN)
                    .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .setUserAuthenticationRequired(true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) b.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG | KeyProperties.AUTH_DEVICE_CREDENTIAL);
                else b.setUserAuthenticationValidityDurationSeconds(-1);
                g.initialize(b.build());
                g.generateKeyPair();
            }
            return new JSONObject().put("publica", publica()).toString();
        } catch (Exception e) {
            // Sin bloqueo de pantalla (o sin huella registrada en Android 9 y 10) el almacén seguro se niega.
            return error("SIN_BLOQUEO_DE_PANTALLA");
        }
    }

    /** Tras huella, rostro o PIN firma un reto de inicio de sesión (y nada más). Responde en window.onHuella(json). */
    @JavascriptInterface public String firmar(String mensaje) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return error("HUELLA_NO_DISPONIBLE");
        try {
            if (mensaje == null || !mensaje.startsWith(PREFIJO_SESION) || mensaje.length() > 200) return error("MENSAJE_INVALIDO");
            KeyStore s = almacen();
            if (!s.containsAlias(LLAVE)) return error("SIN_LLAVE");
            Signature firma = Signature.getInstance("SHA256withECDSA");
            firma.initSign((PrivateKey) s.getKey(LLAVE, null));
            activity.runOnUiThread(() -> {
                try {
                    boolean en = "en".equals(Avisos.prefs(context).getString("idioma", "es"));
                    BiometricPrompt.Builder b = new BiometricPrompt.Builder(activity)
                        .setTitle(en ? "Sign in to Cardón Predicciones" : "Entrar a Cardón Predicciones")
                        .setSubtitle(en ? "Use fingerprint, face or device PIN" : "Usa huella, rostro o el PIN del teléfono")
                        .setDescription(en ? "Your phone signs an access message. It moves no money." : "Tu teléfono firma un mensaje de acceso. No mueve dinero.");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) b.setAllowedAuthenticators(android.hardware.biometrics.BiometricManager.Authenticators.BIOMETRIC_STRONG | android.hardware.biometrics.BiometricManager.Authenticators.DEVICE_CREDENTIAL);
                    else b.setNegativeButton(en ? "Cancel" : "Cancelar", context.getMainExecutor(), (d, w) -> responder("onHuella", error("CANCELADO")));
                    b.build().authenticate(new BiometricPrompt.CryptoObject(firma), new CancellationSignal(), context.getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                        @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult r) {
                            try {
                                Signature f = r.getCryptoObject() != null && r.getCryptoObject().getSignature() != null ? r.getCryptoObject().getSignature() : firma;
                                f.update(mensaje.getBytes(StandardCharsets.UTF_8));
                                responder("onHuella", new JSONObject().put("mensaje", mensaje).put("firma", Base64.encodeToString(f.sign(), Base64.NO_WRAP)).toString());
                            } catch (Exception e) { responder("onHuella", error(e)); }
                        }
                        @Override public void onAuthenticationError(int codigo, CharSequence texto) { responder("onHuella", error(codigo == 10 || codigo == 13 || codigo == 5 ? "CANCELADO" : "HUELLA_" + codigo + ": " + texto)); }
                    });
                } catch (Exception e) { responder("onHuella", error(e)); }
            });
            return "{\"pendiente\":true}";
        } catch (android.security.keystore.KeyPermanentlyInvalidatedException e) {
            return error("LLAVE_INVALIDADA");
        } catch (Exception e) { return error(e); }
    }

    /* ---------- Avisos ---------- */

    /** Guarda la dirección del agente y la sesión para que el vigilante de avisos pueda preguntarle. Solo https. */
    @JavascriptInterface public void guardarNube(String api, String token) {
        String a = api == null ? "" : api.trim();
        if (!a.isEmpty() && !a.matches("https://[A-Za-z0-9.-]+/api/v1")) return;
        SharedPreferences p = Avisos.prefs(context);
        SharedPreferences.Editor e = p.edit().putString("api", a).putString("token", token == null ? "" : token);
        if (!a.equals(p.getString("api", ""))) e.remove("desde");
        e.apply();
    }

    /** Mercados guardados con su vencimiento, y los textos del aviso en el idioma de la app. */
    @JavascriptInterface public void guardarVigiladas(String json, String idioma, String titulo, String texto) {
        try {
            new JSONArray(json);
            Avisos.prefs(context).edit().putString("vigiladas", json).putString("idioma", "en".equals(idioma) ? "en" : "es").putString("vencido_titulo", titulo).putString("vencido_texto", texto).apply();
        } catch (Exception ignored) {
            // lista ilegible: se conserva la anterior
        }
    }

    @JavascriptInterface public String avisosEstado() {
        try {
            SharedPreferences p = Avisos.prefs(context);
            return new JSONObject().put("permiso", Avisos.permiso(context)).put("estado", p.getString("estado", "")).put("ts", p.getLong("estado_ts", 0)).toString();
        } catch (Exception e) { return error(e); }
    }

    @JavascriptInterface public void pedirPermisoAvisos() {
        if (Build.VERSION.SDK_INT >= 33 && !Avisos.permiso(context)) activity.requestPermissions(new String[] { "android.permission.POST_NOTIFICATIONS" }, 4201);
    }

    /** Muestra una notificación de prueba y revisa ya los avisos pendientes. */
    @JavascriptInterface public void probarAvisos(String titulo, String texto) {
        Avisos.mostrar(context, 1, titulo, texto);
        new Thread(() -> { Avisos.revisar(context); responder("onAvisos", avisosEstado()); }).start();
    }

    /* ---------- Instalador ---------- */

    /**
     * Petición HTTPS sin las restricciones de origen del WebView, solo hacia GitHub y Cloudflare (el instalador
     * las necesita para crear la nube de la persona) y hacia Kilo, la IA gratuita que no pide clave. Responde en window.onNativeHttp(id, status, texto).
     */
    @JavascriptInterface public void http(String id, String method, String url, String headersJson, String body) {
        new Thread(() -> {
            int status = 0;
            String text;
            HttpURLConnection con = null;
            try {
                if (url == null || !(url.startsWith("https://api.github.com/") || url.startsWith("https://api.cloudflare.com/client/v4/") || url.startsWith("https://api.kilo.ai/api/gateway/"))) throw new IllegalArgumentException("destino no permitido");
                con = (HttpURLConnection) new URL(url).openConnection();
                con.setRequestMethod(method);
                con.setConnectTimeout(20000);
                con.setReadTimeout(60000); // la IA sin clave piensa antes de responder: puede tardar medio minuto
                JSONObject headers = new JSONObject(headersJson == null || headersJson.isEmpty() ? "{}" : headersJson);
                for (Iterator<String> it = headers.keys(); it.hasNext(); ) { String k = it.next(); con.setRequestProperty(k, headers.getString(k)); }
                if (body != null && !body.isEmpty()) {
                    con.setDoOutput(true);
                    try (OutputStream out = con.getOutputStream()) { out.write(body.getBytes(StandardCharsets.UTF_8)); }
                }
                status = con.getResponseCode();
                InputStream in = status >= 400 ? con.getErrorStream() : con.getInputStream();
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                if (in != null) { byte[] trozo = new byte[8192]; for (int n; (n = in.read(trozo)) > 0; ) buf.write(trozo, 0, n); in.close(); }
                text = buf.toString("UTF-8");
            } catch (Exception e) {
                status = 0;
                text = error(e);
            } finally {
                if (con != null) con.disconnect();
            }
            final String js = "window.onNativeHttp&&window.onNativeHttp(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(text) + ")";
            web.post(() -> web.evaluateJavascript(js, null));
        }).start();
    }
}
