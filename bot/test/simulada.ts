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

export function hyperliquidSimulado(op: { caido?: boolean; meta?: unknown; precios?: Record<string, string> } = {}) {
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
    if (cuerpo.type === 'l2Book') return responder({ coin: cuerpo.coin, ...LIBRO });
    return new Response('null', { status: 422 });
  }) as typeof fetch;
  return { red, llamadas, estado };
}
