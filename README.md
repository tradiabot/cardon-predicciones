<p align="center"><img src="brand/logo-mark.svg" alt="Cardón" width="96"></p>

# Cardón Predicciones

**Agente de Mercados de Predicción · Prediction Markets Agent** — versión piloto, etapa 1

Hermana de Cardón DeFi. Hace una sola cosa: mercados de predicción, es decir, preguntas de sí o no en las que cada unidad paga 1 USDC si aciertas y 0 si fallas. No compra ni vende monedas.

> **No es consejo financiero.** Puedes perder todo lo que pongas, y cada persona es responsable de que usar estos mercados sea legal en su país. [Aviso legal](AVISO-LEGAL.md).

## Qué hace hoy (etapa 1)

Explorador de los mercados de **Hyperliquid**, solo lectura. No pide claves ni cuenta.

- Lista de mercados abiertos con pregunta, vencimiento, precio de cada lado y creador.
- Filtros por categoría, creador y precio; cada uno dice cuántos mercados tiene. Buscador.
- Estrella para guardar mercados; los que cierran se marcan «Ya no está abierto».
- Aviso cuando un mercado cobra comisión doble por ser de un creador externo.
- Libro de órdenes de cada lado: quién compra y quién vende ahora.
- Cuatro temas de color, español e inglés.

Deportes y premios quedan fuera, igual que en Kumo.

## Lo que viene

| Etapa | Contenido |
|---|---|
| 2 | Comprar, vender, posiciones y órdenes; primero en simulación |
| 3 | IA con consenso, «Pedir a la IA» y supervisor |
| 4 | Instalador de la nube y edición pública completa |

## Estructura

| Carpeta | Contenido |
|---|---|
| `bot/src/plataformas/` | Una carpeta por lo propio de cada plataforma: `tipos.ts` (la interfaz común), `registro.ts` (la lista) e `hyperliquid.ts` |
| `bot/src/explorar.ts` | El explorador: junta y filtra mercados sin saber de qué plataforma son |
| `bot/src/worker.ts` | El agente de la nube (Cloudflare Workers). Hoy solo sirve lectura; aún no se despliega |
| `bot/test/` | Pruebas, con Hyperliquid simulado y una plataforma falsa de ejemplo |
| `app/web/` | La interfaz (HTML y JavaScript). `nucleo.js` se genera desde `bot/src` |
| `app/android/` | El contenedor Android (un WebView) |
| `brand/` | Logos e iconos, los mismos de Cardón DeFi |

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
