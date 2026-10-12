# Compilar la app

Requisitos: JDK 17 o superior y el SDK de Android (plataforma 34, build-tools 34.0.0). El contenedor es una Activity con un WebView que carga la interfaz desde `app/src/main/assets/web/`.

```bash
cd ../../bot && npm run app                   # copia app/web a la app (hazlo tras cada cambio)
cd ../app/android
./gradlew assemblePublicaRelease -PfirmaLocal # firmada con la llave de depuración de tu equipo
```

En un teléfono con Termux hace falta además `-Pandroid.aapt2FromMavenOverride=/usr/lib/android-sdk/build-tools/debian/aapt2`.

La edición `personal` es para una compilación propia que ya apunte a tu nube: crea `app/src/personal/assets/web/config.js` (no se versiona) con `window.CARDON = { publica: false, api: 'https://TU-AGENTE.workers.dev/api/v1', plantilla: 'tradiabot/cardon-predicciones', version: '0.2.0' };` y compila con `assemblePersonalRelease`. Entrar sigue pidiendo tu huella.
