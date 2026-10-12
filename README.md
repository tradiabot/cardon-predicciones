<p align="center"><img src="brand/logo-lockup.svg" alt="Cardón Predicciones" width="460"></p>

**Agente de Mercados de Predicción · Prediction Markets Agent** — versión 1.0

Hermana de Cardón DeFi. Hace una sola cosa: mercados de predicción, es decir, preguntas de sí o no en las que cada unidad paga 1 USDC si aciertas y 0 si fallas. No compra ni vende monedas.

- Sitio: https://tradiabot.github.io/cardon-predicciones/
- Descarga para Android: https://github.com/tradiabot/cardon-predicciones/releases/download/v1.0.0/Cardon-Predicciones-1.0.0.apk
- [Aviso legal y descargo de responsabilidad](AVISO-LEGAL.md)

> **No es consejo financiero.** Puedes perder todo lo que pongas, y cada persona es responsable de que usar estos mercados sea legal en su país.

## Qué hace hoy

- **Explorador de Hyperliquid, solo lectura.** Mercados abiertos con pregunta, vencimiento, precio de cada lado y creador; filtros por categoría, creador y precio con su cuenta; buscador y libro de órdenes. Deportes y premios quedan fuera.
- **Semáforo de precios.** Cada lado y cada activo dicen cuánto cambiaron frente a ayer: verde si subió, rojo si bajó. También el volumen del día.
- **Mercados globales.** Pestaña «Global» con cripto, bolsa, materias primas, divisas y el índice de miedo y codicia, cada uno con su cambio del día, y un semáforo general (verde, amarillo, rojo) sacado con reglas fijas, sin IA.
- **Analizar con IA.** Un botón en cada mercado: una o varias IA estiman la probabilidad y dicen «comprar tal lado» o «no entrar», con semáforo. Funciona sin configurar nada con Kilo (gratis, sin clave). Con tu nube puedes sumar Groq, Gemini, OpenRouter, Cerebras y Mistral, y elegir consenso de 2 a 5 IA. Solo opina: no crea órdenes.
- **Semáforo de estado.** En Config, cuatro luces (mercados, nube, IA, avisos) que dicen qué falla y cómo arreglarlo.
- **Guardadas.** Estrella para vigilar mercados; los que cierran se marcan «Ya no está abierto».
- **Avisos.** Notificaciones de Android cuando vence un mercado guardado y, con la nube conectada, las que mande tu agente.
- **Tu nube.** La app instala tu propio agente en tu Cloudflare (ver abajo). Empieza en simulación.
- **Sesión por huella.** El teléfono firma un reto con una llave que solo funciona tras huella, rostro o PIN.
- Cuatro temas de color, español e inglés.

Todavía no: comprar y vender, posiciones y órdenes, «Pedir a la IA», el supervisor automático y dinero real.

### Cómo decide el análisis

- A la IA solo le llegan datos públicos del mercado: pregunta, regla, precios, libro, historia del activo y el semáforo global. Nada tuyo.
- La ventaja se mide contra lo que cuesta comprar de verdad (la oferta más barata del libro), no contra el precio medio: en un mercado casi vacío el precio medio puede decir 0,50 cuando la única oferta está en 0,99.
- Frenos que no dependen de la IA: si nadie vende ese lado, o si la ventaja no llega a 5 puntos (8 con comisión doble), el resultado es «no entrar».
- Verde = comprar con confianza de 60 o más y al menos dos IA respondiendo; amarillo = comprar con dudas; rojo = no entrar.
- Las claves de los proveedores se guardan cifradas en tu nube y solo se ven recortadas (`gsk_…6tQF`). Un modelo que agota su límite descansa y no se le vuelve a llamar hasta que pase.
- Es una opinión automática. No es consejo financiero.

## Instalar tu nube (desde la app)

| Paso | Qué necesitas | Para qué |
|---|---|---|
| 1. Huella | Bloqueo de pantalla activo (Android 9 o superior) | El teléfono crea su llave; tu agente guarda la mitad pública |
| 2. GitHub | Cuenta gratuita y un token con permisos **repo** y **workflow** | Guarda una copia privada del código y lo instala |
| 3. Cloudflare | Cuenta gratuita, tu **Account ID** y un token **Edit Cloudflare Workers** con el permiso extra **Account · D1 · Edit** | Es donde vive tu agente |

La app crea el repositorio privado `cardon-predicciones-nube` en tu GitHub (copia de esta plantilla), guarda tus claves **cifradas** como secretos de ese repositorio y lanza [`instalar.yml`](.github/workflows/instalar.yml), que despliega el agente `cardon-predicciones` en tu Cloudflare.

| Clave | Dónde vive | Quién más la ve |
|---|---|---|
| Llave del teléfono (mitad privada) | Almacén seguro de Android; no se puede copiar | Nadie |
| Tokens de GitHub y Cloudflare | Secretos de tu repositorio privado; la app no los conserva | Nadie |
| Contraseña de administrador (respaldo) | La crea el instalador; secreto de tu repositorio y de tu Worker | Nadie |
| Sesión de la app | El teléfono guarda el token; tu agente solo su huella digital (SHA-256) | Nadie |

## Lo que viene

| Etapa | Contenido |
|---|---|
| 2 | Comprar, vender, posiciones y órdenes; primero en simulación |
| 3 | IA con consenso, «Pedir a la IA» y supervisor |

## Estructura

| Carpeta | Contenido |
|---|---|
| `bot/src/plataformas/` | Una carpeta por lo propio de cada plataforma: `tipos.ts` (la interfaz común), `registro.ts` (la lista) e `hyperliquid.ts` |
| `bot/src/explorar.ts` | El explorador: junta y filtra mercados sin saber de qué plataforma son |
| `bot/src/worker.ts` | El agente de la nube (Cloudflare Workers, base D1): lectura de mercados, sesión por huella (`sesion.ts`) y avisos (`avisos.ts`) |
| `bot/test/` | Pruebas, con Hyperliquid, GitHub, Cloudflare y el teléfono simulados, y una plataforma falsa de ejemplo |
| `app/web/` | La interfaz (HTML y JavaScript). `nucleo.js` se genera desde `bot/src` |
| `app/android/` | El contenedor Android: WebView, huella, avisos y el puente del instalador |
| `.github/workflows/instalar.yml` | El instalador que corre en el GitHub de cada persona |
| `docs/` | El sitio (GitHub Pages) |
| `brand/` | Logos e iconos, y el script que los genera |

La app y el agente usan **el mismo código** para leer mercados: `npm run app` empaqueta `bot/src/nucleo.ts` en `app/web/nucleo.js`.

## Desarrollo

```bash
cd bot
npm ci
npm test            # módulos, agente e interfaz (jsdom)
npm run typecheck
npm run app         # regenera app/web/nucleo.js y copia app/web a la app Android
```

Las pruebas no pueden salir a la red: `test/preparar.ts` corta la red de verdad y el Hyperliquid simulado solo conoce la dirección de lectura. No hay forma de que una prueba envíe una orden.

Para instalar a mano, sin la app: copia `bot/wrangler.plantilla.toml` a `wrangler.toml`, sustituye los valores entre guiones bajos, crea la base con `npx wrangler d1 create cardon_predicciones`, aplica `npx wrangler d1 migrations apply cardon_predicciones --remote`, despliega con `npx wrangler deploy` y pon el secreto `ADMIN_TOKEN` con `npx wrangler secret put`.

Para compilar la app, ver [app/android/BUILDING.md](app/android/BUILDING.md).

## Cómo agregar una plataforma

1. Escribe `bot/src/plataformas/<nombre>.ts` con una función que devuelva un objeto `Plataforma` (ver `tipos.ts`): listar mercados, libro de órdenes, comprar, vender, posiciones, saldo y cobrar lo ganado. Cada mercado, orden y posición lleva el `id` de su plataforma.
2. Añade esa función a la lista `PLATAFORMAS` de `registro.ts`.

Eso es todo: las pantallas, los filtros y el agente la recogen solos. El filtro de plataforma del explorador aparece en cuanto hay más de una, y Config → Plataformas la lista con sus claves. `bot/test/falsa.ts` es un ejemplo completo y `plataforma-falsa.test.ts` demuestra que no hace falta tocar nada más.

Lo que ya se sabe para cuando toque:

- La librería ccxt (4.5.85 o superior) trae `ccxt.prediction` con Hyperliquid, Polymarket, Limitless, Myriad, Opinion, Predict.fun y SX Bet. Solo funciona en modo asíncrono.
- Candidatas: **Polymarket** (Polygon, USDC) y **Limitless** (Base, USDC). Kalshi no, porque pide verificar identidad.
- Polymarket rechaza las órdenes que salen de Estados Unidos, y GitHub Actions corre allí. Ese bloqueo no se salta: la orden tendría que salir firmada del teléfono, o la plataforma quedar en solo lectura.
- Esas plataformas piden la clave privada de la billetera, que sí puede mover todo el saldo. Harían falta una billetera aparte con poco dinero y un aviso claro.
- Sin comprobar todavía: que no pidan identidad, sus comisiones y el mínimo por orden.

## Licencia

[MIT](LICENSE). Hecho xhumanx + IA.
