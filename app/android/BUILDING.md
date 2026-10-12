# Compilar la app

Requisitos: JDK 17 o superior y el SDK de Android (plataforma 34, build-tools 34.0.0). El contenedor es una Activity con un WebView que carga la interfaz desde `app/src/main/assets/web/`.

```bash
cd ../../bot && npm run app                   # copia app/web a la app (hazlo tras cada cambio)
cd ../app/android
./gradlew assemblePublicaRelease -PfirmaLocal # firmada con la llave de depuración de tu equipo
```

En un teléfono con Termux hace falta además `-Pandroid.aapt2FromMavenOverride=/usr/lib/android-sdk/build-tools/debian/aapt2`.

La edición `personal` es para una compilación propia que apunte a tu nube: crea `app/src/personal/assets/web/config.js` (no se versiona). En la etapa 1 la app no usa nube, así que las dos ediciones son iguales.
