package com.cardonpredicciones.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

/** Contenedor de la app: un WebView que carga la interfaz desde assets/web. */
public class MainActivity extends Activity {
    private WebView web;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(10, 15, 13));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.getSettings().setAllowFileAccess(true);
        web.setWebViewClient(new WebViewClient() {
            // Los enlaces https se abren en el navegador: la app nunca navega fuera de su pantalla.
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternal(request.getUrl().toString());
            }
            @SuppressWarnings("deprecation")
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternal(url);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showError();
            }
        });
        // Sin WebChromeClient, confirm() y prompt() de la interfaz devuelven «cancelar» sin mostrar nada:
        // los botones que piden confirmación parecerían muertos.
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                return dialog(message, null, result, null, false);
            }
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                return dialog(message, null, result, null, true);
            }
            @Override public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
                return dialog(message, defaultValue == null ? "" : defaultValue, result, result, true);
            }
        });
        setContentView(web, new ViewGroup.LayoutParams(-1, -1));
        web.loadUrl("file:///android_asset/web/index.html");
    }

    /** Diálogo nativo para alert/confirm/prompt de la interfaz. `input` no nulo = pide un texto. */
    private boolean dialog(String message, String input, JsResult result, JsPromptResult promptResult, boolean cancellable) {
        if (isFinishing()) { result.cancel(); return true; }
        try {
            final android.widget.EditText field = input == null ? null : new android.widget.EditText(this);
            android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert).setMessage(message);
            if (field != null) {
                field.setText(input);
                field.setSelectAllOnFocus(true);
                field.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
                android.widget.FrameLayout box = new android.widget.FrameLayout(this);
                int pad = (int) (20 * getResources().getDisplayMetrics().density);
                box.setPadding(pad, 0, pad, 0);
                box.addView(field);
                builder.setView(box);
            }
            builder.setPositiveButton(android.R.string.ok, (d, w) -> { if (field != null && promptResult != null) promptResult.confirm(field.getText().toString()); else result.confirm(); });
            if (cancellable) builder.setNegativeButton(android.R.string.cancel, (d, w) -> result.cancel());
            builder.setOnCancelListener(d -> result.cancel());
            builder.show();
        } catch (Exception error) { result.cancel(); }
        return true;
    }

    private boolean openExternal(String url) {
        if (url == null || !url.startsWith("https://")) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)));
        } catch (Exception ignored) {
            // sin navegador instalado: no se navega dentro de la app
        }
        return true;
    }

    private void showError() {
        TextView error = new TextView(this);
        error.setText("No se pudo cargar la interfaz. Cierra y vuelve a abrir la app.\nThe interface could not be loaded. Close and reopen the app.");
        error.setTextColor(Color.rgb(255, 112, 128));
        error.setTextSize(16);
        error.setPadding(32, 64, 32, 32);
        error.setBackgroundColor(Color.rgb(10, 15, 13));
        setContentView(error);
    }
}
