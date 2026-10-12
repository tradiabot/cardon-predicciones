package com.cardonpredicciones.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;

/**
 * Notificaciones nativas (el WebView no tiene Web Push). Cada ~15 min (el mínimo de JobScheduler) y al abrir la app:
 *  1. avisa de los mercados guardados que ya vencieron (no necesita red ni nube);
 *  2. si hay nube y sesión, pide a tu agente los avisos nuevos (propuestas, órdenes ejecutadas…).
 */
final class Avisos {
    static final String CANAL = "cardon_avisos";
    static final int JOB_ID = 6101;
    private static final String PREFS = "cardon_avisos";

    private Avisos() {}

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static boolean permiso(Context c) {
        if (Build.VERSION.SDK_INT < 33) return true;
        return c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
    }

    static void programar(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null || js.getPendingJob(JOB_ID) != null) return;
        js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(c, AvisosJobService.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_NONE)
            .setPeriodic(15 * 60 * 1000L)
            .setPersisted(true)
            .build());
    }

    static void mostrar(Context c, int id, String titulo, String cuerpo) {
        if (!permiso(c)) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(new NotificationChannel(CANAL, "Cardón Predicciones", NotificationManager.IMPORTANCE_HIGH));
        Intent abrir = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, abrir, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CANAL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat_cardon).setColor(0xFF2FBF9B).setContentTitle(titulo).setContentText(cuerpo)
            .setStyle(new Notification.BigTextStyle().bigText(cuerpo)).setAutoCancel(true).setContentIntent(pi);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
        nm.notify(id, b.build());
    }

    /** Devuelve cuántos avisos mostró. El último resultado queda en «estado» para enseñarlo en Config. */
    static synchronized int revisar(Context c) {
        int n = vencidos(c);
        try {
            n += nube(c);
        } catch (Exception e) {
            estado(c, "error: " + e.getClass().getSimpleName() + (e.getMessage() == null ? "" : " " + e.getMessage()));
        }
        return n;
    }

    private static void estado(Context c, String texto) {
        prefs(c).edit().putString("estado", texto).putLong("estado_ts", System.currentTimeMillis()).apply();
    }

    /** Mercados guardados cuyo vencimiento ya pasó: un aviso por cada uno, una sola vez. */
    private static int vencidos(Context c) {
        SharedPreferences p = prefs(c);
        int n = 0;
        try {
            JSONArray lista = new JSONArray(p.getString("vigiladas", "[]"));
            Set<String> avisadas = new HashSet<>(p.getStringSet("avisadas", new HashSet<String>()));
            Set<String> siguen = new HashSet<>();
            long ahora = System.currentTimeMillis();
            for (int i = 0; i < lista.length(); i++) {
                JSONObject m = lista.getJSONObject(i);
                String k = m.optString("k");
                long vence = m.optLong("vence", 0);
                if (k.isEmpty()) continue;
                if (avisadas.contains(k)) { siguen.add(k); continue; }
                if (vence <= 0 || vence > ahora) continue;
                mostrar(c, k.hashCode(), p.getString("vencido_titulo", "Venció un mercado que guardaste"), m.optString("pregunta") + "\n" + p.getString("vencido_texto", "Se liquida solo: no hay que vender."));
                siguen.add(k);
                n++;
            }
            // Solo se recuerdan las que siguen guardadas: al quitar la estrella se olvida.
            p.edit().putStringSet("avisadas", siguen).apply();
        } catch (Exception ignored) {
            // lista ilegible: no hay nada que avisar
        }
        return n;
    }

    private static int nube(Context c) throws Exception {
        SharedPreferences p = prefs(c);
        String api = p.getString("api", ""), token = p.getString("token", "");
        if (api.isEmpty() || token.isEmpty()) { estado(c, "sin_nube"); return 0; }
        HttpURLConnection con = (HttpURLConnection) new URL(api + "/avisos?desde=" + p.getLong("desde", 0)).openConnection();
        try {
            con.setConnectTimeout(15000);
            con.setReadTimeout(20000);
            con.setRequestProperty("Authorization", "Bearer " + token);
            int code = con.getResponseCode();
            if (code == 401) { estado(c, "sesion"); return 0; }
            if (code != 200) { estado(c, "HTTP " + code); return 0; }
            InputStream in = con.getInputStream();
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] trozo = new byte[4096];
            for (int k; (k = in.read(trozo)) > 0; ) buf.write(trozo, 0, k);
            in.close();
            JSONArray avisos = new JSONObject(buf.toString("UTF-8")).optJSONArray("avisos");
            long desde = p.getLong("desde", 0);
            int n = 0;
            for (int i = 0; avisos != null && i < avisos.length(); i++) {
                JSONObject a = avisos.getJSONObject(i);
                mostrar(c, ("nube" + a.optString("id")).hashCode(), a.optString("titulo", "Cardón Predicciones"), a.optString("texto"));
                desde = Math.max(desde, a.optLong("ts", 0));
                n++;
            }
            p.edit().putLong("desde", desde).apply();
            estado(c, "ok");
            return n;
        } finally {
            con.disconnect();
        }
    }
}
