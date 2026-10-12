// Agente en la nube (Cloudflare Workers). Lee mercados con las mismas plataformas que la app,
// da la sesión por huella, guarda los avisos para el teléfono, lee los mercados globales y
// consulta a las IA para analizar un mercado. Solo opina: las órdenes llegan después.
import { type Almacen, almacenD1 } from './almacen';
import { avisar, avisosDesde } from './avisos';
import { clave, explorar, type Explorado } from './explorar';
import { type Global, leerGlobal } from './global';
import { analizar, type Analisis, ErrorAnalisis } from './ia/analizar';
import { anotarUltima, cambiarIA, leerAjustes, leerClaves, leerPausas, sumarPausas, vistaIA } from './ia/config';
import { etiquetaModelo, preguntar } from './ia/proveedores';
import { buscarPlataforma, crearPlataformas, type Fabrica } from './plataformas/registro';
import { ErrorPlataforma, type Idioma } from './plataformas/tipos';
import { entrar, esDueno, type Llaves, reto, salir } from './sesion';

export const VERSION = '0.3.0';
const CACHE_MS = 60_000;
const CACHE_GLOBAL_MS = 5 * 60_000;
const CACHE_ANALISIS_MS = 10 * 60_000;

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
  const red: typeof fetch = op.fetch || ((...a) => fetch(...a));
  const plataformas = crearPlataformas({ fetch: red, ahora }, op.plataformas);
  // Una sola lectura por minuto e idioma aunque la app pregunte más seguido: cada lectura gasta subpeticiones.
  const memoria = new Map<string, { ts: number; datos: Explorado }>();
  const globales = new Map<string, { ts: number; datos: Global }>();
  const analisis = new Map<string, { ts: number; datos: Analisis }>();

  async function mercados(idioma: Idioma): Promise<Explorado> {
    const m = memoria.get(idioma);
    if (m && ahora() - m.ts < CACHE_MS) return m.datos;
    const datos = await explorar(plataformas, idioma, ahora);
    // Un fallo no se guarda: la próxima consulta lo reintenta.
    if (!datos.errores.length) memoria.set(idioma, { ts: ahora(), datos });
    return datos;
  }
  async function global(idioma: Idioma): Promise<Global> {
    const g = globales.get(idioma);
    if (g && ahora() - g.ts < CACHE_GLOBAL_MS) return g.datos;
    const datos = await leerGlobal({ fetch: red, ahora }, idioma);
    if (!datos.errores.length) globales.set(idioma, { ts: ahora(), datos });
    return datos;
  }

  async function publico(req: Request, url: URL): Promise<Response | null> {
    const idioma: Idioma = url.searchParams.get('idioma') === 'en' ? 'en' : 'es';
    switch (`${req.method} ${url.pathname}`) {
      case 'GET /api/v1/salud':
        return json({ ok: true, version: VERSION, ts: ahora(), modo: 'simulacion' });
      case 'GET /api/v1/plataformas':
        return json({ plataformas: plataformas.map((p) => ({ id: p.id, nombre: p.nombre, moneda: p.moneda, minimo_orden: p.minimo_orden })) });
      case 'GET /api/v1/mercados':
        return json(await mercados(idioma));
      case 'GET /api/v1/global':
        return json(await global(idioma));
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
    const idioma: Idioma = url.searchParams.get('idioma') === 'en' ? 'en' : 'es';
    switch (ruta) {
      case 'GET /api/v1/ia':
        return json(await vistaIA(almacen, env.ADMIN_TOKEN, ahora(), idioma));
      case 'POST /api/v1/ia': {
        const r = await cambiarIA(almacen, env.ADMIN_TOKEN, await cuerpo());
        return 'error' in r ? json(r, 400) : json(await vistaIA(almacen, env.ADMIN_TOKEN, ahora(), idioma));
      }
      case 'POST /api/v1/ia/probar': {
        // Una pregunta mínima a cada modelo de la lista: dice cuál responde, cuánto tarda y, si falla, por qué.
        const [ajustes, claves] = await Promise.all([leerAjustes(almacen), leerClaves(almacen, env.ADMIN_TOKEN)]);
        const mensajes = [{ role: 'system' as const, content: 'Respondes SOLO JSON.' }, { role: 'user' as const, content: 'Responde exactamente {"ok":true}' }];
        const pausas: Record<string, number> = {};
        const pruebas = await Promise.all(
          ajustes.modelos.map(async (modelo) => {
            const t0 = Date.now();
            try {
              await preguntar({ fetch: red, ahora }, modelo, claves, mensajes, 200);
              return { modelo, nombre: etiquetaModelo(modelo), ok: true, ms: Date.now() - t0 };
            } catch (e: any) {
              if (e?.pausaHasta) pausas[modelo] = e.pausaHasta;
              return { modelo, nombre: etiquetaModelo(modelo), ok: false, ms: Date.now() - t0, error: String(e?.message || e).slice(0, 200) };
            }
          }),
        );
        const buenas = pruebas.filter((p) => p.ok).length;
        await sumarPausas(almacen, ahora(), pausas);
        await anotarUltima(almacen, { ts: ahora(), ok: buenas > 0, que: 'prueba', detalle: buenas ? `${buenas}/${pruebas.length}` : pruebas[0]?.error || '' });
        return json({ ok: buenas > 0, pruebas });
      }
      case 'POST /api/v1/ia/analizar': {
        const c = await cuerpo();
        const id = clave({ plataforma: String(c.plataforma || ''), id: String(c.mercado || '') });
        const guardado = analisis.get(`${idioma} ${id}`);
        if (guardado && ahora() - guardado.ts < CACHE_ANALISIS_MS) return json({ ...guardado.datos, guardado: true });
        const lista = await mercados(idioma);
        const m = lista.mercados.find((x) => clave(x) === id);
        if (!m) return json({ error: idioma === 'en' ? 'That market is no longer open.' : 'Ese mercado ya no está abierto.' }, 404);
        const [ajustes, claves, pausas] = await Promise.all([leerAjustes(almacen), leerClaves(almacen, env.ADMIN_TOKEN), leerPausas(almacen, ahora())]);
        try {
          const r = await analizar({ entorno: { fetch: red, ahora }, mercado: m, plataforma: plataformas.find((p) => p.id === m.plataforma), global: await global(idioma).catch(() => null), claves, modelos: ajustes.modelos, consenso: ajustes.consenso, pausas, idioma });
          await sumarPausas(almacen, ahora(), r.pausas);
          await anotarUltima(almacen, { ts: ahora(), ok: true, que: 'analisis', detalle: `${r.analisis.acuerdo.total}/${r.analisis.votos.length}` });
          analisis.set(`${idioma} ${id}`, { ts: ahora(), datos: r.analisis });
          return json(r.analisis);
        } catch (e) {
          if (!(e instanceof ErrorAnalisis)) throw e;
          await sumarPausas(almacen, ahora(), e.pausas);
          await anotarUltima(almacen, { ts: ahora(), ok: false, que: 'analisis', detalle: e.message });
          return json({ error: e.message, votos: e.votos }, 502);
        }
      }
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
