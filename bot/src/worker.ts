// Agente en la nube (Cloudflare Workers). En esta etapa solo lee mercados: las mismas
// plataformas que usa la app, detrás de /api/v1. Órdenes, IA y sesión llegan después.
import { explorar } from './explorar';
import { buscarPlataforma, crearPlataformas, type Fabrica } from './plataformas/registro';
import { ErrorPlataforma, type Idioma } from './plataformas/tipos';

export const VERSION = '0.1.0';
const CACHE_MS = 60_000;

export interface Opciones {
  fetch?: typeof fetch;
  ahora?: () => number;
  plataformas?: Fabrica[];
}

function json(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
  });
}

export function crearAgente(op: Opciones = {}) {
  const ahora = op.ahora || Date.now;
  const plataformas = crearPlataformas({ fetch: op.fetch || ((...a) => fetch(...a)), ahora }, op.plataformas);
  // Una sola lectura por minuto e idioma aunque la app pregunte más seguido: cada lectura gasta subpeticiones.
  const memoria = new Map<string, { ts: number; datos: unknown }>();

  async function ruta(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    if (req.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
    const idioma: Idioma = url.searchParams.get('idioma') === 'en' ? 'en' : 'es';
    switch (url.pathname) {
      case '/api/v1/salud':
        return json({ ok: true, version: VERSION, ts: ahora() });
      case '/api/v1/plataformas':
        return json({ plataformas: plataformas.map((p) => ({ id: p.id, nombre: p.nombre, moneda: p.moneda, minimo_orden: p.minimo_orden })) });
      case '/api/v1/mercados': {
        const m = memoria.get(idioma);
        if (m && ahora() - m.ts < CACHE_MS) return json(m.datos);
        const datos = await explorar(plataformas, idioma, ahora);
        // Un fallo no se guarda: la próxima consulta lo reintenta.
        if (!datos.errores.length) memoria.set(idioma, { ts: ahora(), datos });
        return json(datos);
      }
      case '/api/v1/libro':
        return json(await buscarPlataforma(plataformas, url.searchParams.get('plataforma') || '').libro(url.searchParams.get('lado') || ''));
      default:
        return json({ error: 'No existe' }, 404);
    }
  }

  return {
    async fetch(req: Request): Promise<Response> {
      try {
        return await ruta(req);
      } catch (e: any) {
        // El error real, tal cual: sin esconderlo detrás de un mensaje genérico.
        return json({ error: String(e?.message || e), plataforma: e instanceof ErrorPlataforma ? e.plataforma : undefined }, e instanceof ErrorPlataforma ? 502 : 500);
      }
    },
  };
}

export default crearAgente();
