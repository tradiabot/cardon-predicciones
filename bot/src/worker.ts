// Agente en la nube (Cloudflare Workers). Lee mercados con las mismas plataformas que la app,
// da la sesión por huella y guarda los avisos para el teléfono. Órdenes e IA llegan después.
import { type Almacen, almacenD1 } from './almacen';
import { avisar, avisosDesde } from './avisos';
import { explorar } from './explorar';
import { buscarPlataforma, crearPlataformas, type Fabrica } from './plataformas/registro';
import { ErrorPlataforma, type Idioma } from './plataformas/tipos';
import { entrar, esDueno, type Llaves, reto, salir } from './sesion';

export const VERSION = '0.2.0';
const CACHE_MS = 60_000;

export interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  DEVICE_PUBLIC_KEY?: string;
}
export interface Opciones {
  fetch?: typeof fetch;
  ahora?: () => number;
  plataformas?: Fabrica[];
  /** Solo para pruebas: en la nube el almacén es la base D1 de `env`. */
  almacen?: Almacen;
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
function json(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS } });
}

export function crearAgente(op: Opciones = {}) {
  const ahora = op.ahora || Date.now;
  const plataformas = crearPlataformas({ fetch: op.fetch || ((...a) => fetch(...a)), ahora }, op.plataformas);
  // Una sola lectura por minuto e idioma aunque la app pregunte más seguido: cada lectura gasta subpeticiones.
  const memoria = new Map<string, { ts: number; datos: unknown }>();

  async function publico(req: Request, url: URL): Promise<Response | null> {
    const idioma: Idioma = url.searchParams.get('idioma') === 'en' ? 'en' : 'es';
    switch (`${req.method} ${url.pathname}`) {
      case 'GET /api/v1/salud':
        return json({ ok: true, version: VERSION, ts: ahora(), modo: 'simulacion' });
      case 'GET /api/v1/plataformas':
        return json({ plataformas: plataformas.map((p) => ({ id: p.id, nombre: p.nombre, moneda: p.moneda, minimo_orden: p.minimo_orden })) });
      case 'GET /api/v1/mercados': {
        const m = memoria.get(idioma);
        if (m && ahora() - m.ts < CACHE_MS) return json(m.datos);
        const datos = await explorar(plataformas, idioma, ahora);
        // Un fallo no se guarda: la próxima consulta lo reintenta.
        if (!datos.errores.length) memoria.set(idioma, { ts: ahora(), datos });
        return json(datos);
      }
      case 'GET /api/v1/libro':
        return json(await buscarPlataforma(plataformas, url.searchParams.get('plataforma') || '').libro(url.searchParams.get('lado') || ''));
    }
    return null;
  }

  async function privado(req: Request, url: URL, env: Env): Promise<Response> {
    const almacen = op.almacen || (env.DB ? almacenD1(env.DB, ahora) : null);
    if (!almacen) return json({ error: 'Al agente le falta su base de datos (D1). Vuelve a instalarlo desde la app.' }, 500);
    const llaves: Llaves = { publica: env.DEVICE_PUBLIC_KEY, admin: env.ADMIN_TOKEN };
    const ruta = `${req.method} ${url.pathname}`;
    const cuerpo = async () => (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (ruta === 'POST /api/v1/sesion/reto') return json(await reto(almacen, ahora()));
    if (ruta === 'POST /api/v1/sesion/entrar') {
      const r = await entrar(llaves, almacen, await cuerpo(), ahora());
      if ('error' in r) return json({ error: r.error }, r.status);
      if (r.primera) await avisar(almacen, ahora(), { tipo: 'nube', titulo: 'Tu nube está conectada', texto: 'Este teléfono ya recibe los avisos de tu agente. Todo empieza en simulación.' });
      return json({ token: r.token, vence: r.vence });
    }
    if (!(await esDueno(req, llaves, almacen, ahora()))) return json({ error: 'Sesión no válida o caducada: inicia sesión con tu huella.' }, 401);
    switch (ruta) {
      case 'GET /api/v1/sesion':
        return json({ valida: true });
      case 'POST /api/v1/sesion/salir':
        return json({ cerrada: await salir(req, almacen) });
      case 'GET /api/v1/avisos': {
        const desde = Number(url.searchParams.get('desde')) || 0;
        return json({ ahora: ahora(), avisos: await avisosDesde(almacen, desde) });
      }
    }
    return json({ error: 'No existe' }, 404);
  }

  return {
    async fetch(req: Request, env: Env = {} as Env): Promise<Response> {
      try {
        const url = new URL(req.url);
        if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
        if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
        if (!url.pathname.startsWith('/api/v1/')) return json({ error: 'No existe' }, 404);
        return (await publico(req, url)) || (await privado(req, url, env));
      } catch (e: any) {
        // El error real, tal cual: sin esconderlo detrás de un mensaje genérico.
        return json({ error: String(e?.message || e), plataforma: e instanceof ErrorPlataforma ? e.plataforma : undefined }, e instanceof ErrorPlataforma ? 502 : 500);
      }
    },
  };
}

export default crearAgente();
