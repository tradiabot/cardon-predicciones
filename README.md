<p align="center"><img src="brand/logo-lockup.svg" alt="Cardón Predicciones" width="460"></p>

**Agente de Mercados de Predicción · Prediction Markets Agent** — piloto temprano

Hermana de Cardón DeFi. Hace una sola cosa: mercados de predicción, es decir, preguntas de sí o no en las que cada unidad paga 1 USDC si aciertas y 0 si fallas. No compra ni vende monedas.

- Sitio: https://tradiabot.github.io/cardon-predicciones/
- Descarga para Android (piloto): https://github.com/tradiabot/cardon-predicciones/releases/latest
- [Aviso legal y descargo de responsabilidad](AVISO-LEGAL.md)

> **No es consejo financiero.** Puedes perder todo lo que pongas, y cada persona es responsable de que usar estos mercados sea legal en su país.

## Qué hace hoy

- **Explorador de Hyperliquid, solo lectura.** Mercados abiertos con pregunta, vencimiento, precio de cada lado y creador; filtros por categoría, creador y precio con su cuenta; buscador y libro de órdenes. Deportes y premios quedan fuera.
- **Guardadas.** Estrella para vigilar mercados; los que cierran se marcan «Ya no está abierto».
- **Avisos.** Notificaciones de Android cuando vence un mercado guardado y, con la nube conectada, las que mande tu agente.
- **Tu nube.** La app instala tu propio agente en tu Cloudflare (ver abajo). Empieza en simulación.
- **Sesión por huella.** El teléfono firma un reto con una llave que solo funciona tras huella, rostro o PIN.
- Cuatro temas de color, español e inglés.

Todavía no: comprar y vender, posiciones y órdenes, IA con consenso y dinero real.

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
