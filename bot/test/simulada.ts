// Hyperliquid simulado: responde como la API pública con una muestra real recortada.
// Solo conoce la lectura (/info). Cualquier otra dirección, incluida la de enviar órdenes, falla.
import muestra from './datos/hyperliquid.json';

export const AHORA = Date.UTC(2026, 9, 12, 0, 0);
export const LIBRO = {
  levels: [
    [
      { px: '0.96', sz: '276.0', n: 1 },
      { px: '0.95118', sz: '200.0', n: 1 },
    ],
    [
      { px: '0.99667', sz: '1204.0', n: 4 },
      { px: '0.9979', sz: '5477.0', n: 2 },
    ],
  ],
};

// El libro de cada lado, coherente con su precio: se compra 0,004 por encima y se vende 0,004 por debajo.
// Un precio de 0,5 exacto es un libro vacío; el mercado de SOL usa el libro fijo de arriba.
function libroDe(coin: string, precios: Record<string, string>) {
  const medio = Number(precios[coin]);
  if (/^#10999\d$/.test(coin) || !Number.isFinite(medio)) return LIBRO;
  if (medio === 0.5) return { levels: [[], []] };
  const n = (px: number, sz: string) => ({ px: String(Math.round(px * 100000) / 100000), sz, n: 1 });
  return { levels: [[n(medio - 0.004, '300.0'), n(medio - 0.01, '900.0')], [n(medio + 0.004, '250.0'), n(medio + 0.01, '800.0')]] };
}

// Ayer, cada primer lado valía 5 puntos menos y cada segundo lado 5 puntos más: así hay verdes y rojos.
function ladosAyer(precios: Record<string, string>) {
  const ctxs = Object.keys(precios)
    .filter((k) => k.startsWith('#'))
    .map((coin) => ({ coin, prevDayPx: String(Math.max(0.001, Number(precios[coin]) + (Number(coin.slice(1)) % 10 === 0 ? -0.05 : 0.05))), dayNtlVlm: '120.5', midPx: precios[coin] }));
  return [{ universe: [] }, [{ coin: 'PURR/USDC', prevDayPx: '0.1', dayNtlVlm: '1.0' }, ...ctxs]];
}
const activos = (lista: [string, string, string][]) => [{ universe: lista.map(([name]) => ({ name })) }, lista.map(([, midPx, prevDayPx]) => ({ midPx, markPx: midPx, prevDayPx, dayNtlVlm: '1000.0' }))];
// BTC sube 3 % y la bolsa 1 %: el semáforo global sale verde.
export const CRIPTO = activos([
  ['BTC', '82400', '80000'],
  ['ETH', '2550', '2500'],
  ['SOL', '110', '112.2'],
  ['HYPE', '88', '0'],
]);
export const BOLSA = activos([
  ['xyz:SP500', '7878', '7800'],
  ['xyz:XYZ100', '31000', '30900'],
  ['xyz:GOLD', '4200', '4190'],
  ['xyz:CL', '89', '91'],
  ['xyz:EUR', '1.12', '1.12'],
]);
// Siete días de velas de una hora que suben poco a poco de 100 a 116,7.
export const VELAS = Array.from({ length: 168 }, (_, i) => ({ t: i, c: String(100 + i / 10) }));

export function hyperliquidSimulado(op: { caido?: boolean; meta?: unknown; precios?: Record<string, string>; sinAyer?: boolean } = {}) {
  const llamadas: Record<string, any>[] = [];
  const estado = { caido: !!op.caido };
  const red = (async (url: unknown, init?: RequestInit) => {
    if (String(url) !== 'https://api.hyperliquid.xyz/info') throw new Error(`Hyperliquid simulado: dirección no permitida en pruebas (${String(url)})`);
    const cuerpo = JSON.parse(String(init?.body || '{}'));
    llamadas.push(cuerpo);
    if (estado.caido) return new Response('caído', { status: 502 });
    const responder = (x: unknown) => new Response(JSON.stringify(x), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (cuerpo.type === 'outcomeMeta') return responder(op.meta ?? muestra.outcomeMeta);
    if (cuerpo.type === 'allMids') return responder(cuerpo.dex === 'xyz' ? muestra.allMidsXyz : (op.precios ?? muestra.allMids));
    if (cuerpo.type === 'l2Book') return responder({ coin: cuerpo.coin, ...libroDe(cuerpo.coin, (op.precios ?? muestra.allMids) as Record<string, string>) });
    if (op.sinAyer && /AssetCtxs$/.test(cuerpo.type)) return new Response('caído', { status: 500 });
    if (cuerpo.type === 'spotMetaAndAssetCtxs') return responder(ladosAyer(op.precios ?? muestra.allMids));
    if (cuerpo.type === 'metaAndAssetCtxs') return responder(cuerpo.dex === 'xyz' ? BOLSA : CRIPTO);
    if (cuerpo.type === 'candleSnapshot') return responder(VELAS);
    return new Response('null', { status: 422 });
  }) as typeof fetch;
  return { red, llamadas, estado };
}
