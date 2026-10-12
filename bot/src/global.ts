// Mercados globales: cripto, bolsa, materias primas, divisas y el ánimo del mercado, con su
// cambio frente a ayer y un semáforo (verde, amarillo, rojo) sacado con reglas simples, sin IA.
// Los precios salen de datos públicos de Hyperliquid (que cotiza también bolsa y materias primas
// todo el día) y el índice de miedo y codicia de alternative.me. Nada de esto pide claves.
import type { Entorno, Idioma } from './plataformas/tipos';

export type Grupo = 'cripto' | 'bolsa' | 'materias' | 'divisas' | 'animo';
export type Color = 'verde' | 'amarillo' | 'rojo';

export interface Indicador {
  id: string;
  nombre: string;
  grupo: Grupo;
  valor: number | null;
  /** Cambio frente a ayer en % (en «miedo y codicia», en puntos). */
  cambio: number | null;
  unidad: string;
}
export interface Lectura {
  color: Color;
  /** De -2 (mucho miedo) a +2 (mucho apetito). */
  puntos: number;
  razones: string[];
}
export interface Global {
  ts: number;
  indicadores: Indicador[];
  lectura: Lectura;
  errores: string[];
}

const URL_INFO = 'https://api.hyperliquid.xyz/info';
const URL_ANIMO = 'https://api.alternative.me/fng/?limit=2';

// [id, activo en Hyperliquid, grupo, nombre en español, nombre en inglés, unidad]
const LISTA: [string, string, Grupo, string, string, string][] = [
  ['btc', 'BTC', 'cripto', 'Bitcoin', 'Bitcoin', 'USD'],
  ['eth', 'ETH', 'cripto', 'Ethereum', 'Ethereum', 'USD'],
  ['sol', 'SOL', 'cripto', 'Solana', 'Solana', 'USD'],
  ['hype', 'HYPE', 'cripto', 'Hyperliquid', 'Hyperliquid', 'USD'],
  ['sp500', 'xyz:SP500', 'bolsa', 'S&P 500 (EE. UU.)', 'S&P 500 (US)', ''],
  ['nasdaq', 'xyz:XYZ100', 'bolsa', 'Nasdaq 100 (tecnología)', 'Nasdaq 100 (tech)', ''],
  ['nikkei', 'xyz:JP225', 'bolsa', 'Nikkei 225 (Japón)', 'Nikkei 225 (Japan)', ''],
  ['kospi', 'xyz:KR200', 'bolsa', 'Kospi 200 (Corea)', 'Kospi 200 (Korea)', ''],
  ['oro', 'xyz:GOLD', 'materias', 'Oro', 'Gold', 'USD'],
  ['plata', 'xyz:SILVER', 'materias', 'Plata', 'Silver', 'USD'],
  ['petroleo', 'xyz:CL', 'materias', 'Petróleo WTI', 'WTI crude oil', 'USD'],
  ['eur', 'xyz:EUR', 'divisas', 'Euro en dólares', 'Euro in dollars', ''],
  ['jpy', 'xyz:JPY', 'divisas', 'Dólar en yenes', 'Dollar in yen', ''],
];

const num = (x: unknown): number | null => {
  const n = Number(x);
  return x != null && x !== '' && Number.isFinite(n) && n > 0 ? n : null;
};
const redondo = (n: number) => Math.round(n * 100) / 100;

/** Convierte las dos listas de Hyperliquid (cripto y bolsa) en indicadores. */
export function leerIndicadores(idioma: Idioma, ...listas: unknown[]): Indicador[] {
  const por: Record<string, any> = {};
  for (const par of listas) {
    if (!Array.isArray(par)) continue;
    (par[0]?.universe || []).forEach((u: any, i: number) => {
      if (u?.name && par[1]?.[i]) por[u.name] = par[1][i];
    });
  }
  const out: Indicador[] = [];
  for (const [id, activo, grupo, es, en, unidad] of LISTA) {
    const c = por[activo];
    const valor = num(c?.midPx) ?? num(c?.markPx);
    if (valor == null) continue;
    const ayer = num(c?.prevDayPx);
    out.push({ id, nombre: idioma === 'en' ? en : es, grupo, valor, cambio: ayer ? redondo((valor / ayer - 1) * 100) : null, unidad });
  }
  return out;
}

const signo = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2).replace('.', ',')}`;

/**
 * El semáforo: suma puntos con reglas fijas. Verde = el mercado tiene apetito (sube la bolsa y
 * la cripto), rojo = hay miedo (caen), amarillo = ni una cosa ni la otra.
 */
export function lecturaPorReglas(ind: Indicador[], idioma: Idioma = 'es'): Lectura {
  const es = idioma !== 'en';
  const de = (id: string) => ind.find((i) => i.id === id);
  const pct = (n: number) => (es ? signo(n) : signo(n).replace(',', '.')) + ' %';
  let puntos = 0;
  const razones: string[] = [];
  const mover = (id: string, umbral: number, peso: number) => {
    const i = de(id);
    if (i?.cambio == null) return;
    const p = i.cambio > umbral ? peso : i.cambio < -umbral ? -peso : 0;
    puntos += p;
    razones.push(`${i.nombre} ${pct(i.cambio)}${p > 0 ? ' ▲' : p < 0 ? ' ▼' : ''}`);
  };
  mover('sp500', 0.5, 1);
  mover('nasdaq', 0.7, 0.5);
  mover('btc', 2, 1);
  const animo = de('animo');
  if (animo?.valor != null) {
    const p = animo.valor > 60 ? 0.5 : animo.valor < 30 ? -0.5 : 0;
    puntos += p;
    razones.push(`${animo.nombre} ${Math.round(animo.valor)}/100${p > 0 ? ' ▲' : p < 0 ? ' ▼' : ''}`);
  }
  puntos = Math.max(-2, Math.min(2, Math.round(puntos * 2) / 2));
  return { color: !razones.length ? 'amarillo' : puntos >= 1 ? 'verde' : puntos <= -1 ? 'rojo' : 'amarillo', puntos, razones };
}

export async function leerGlobal(entorno: Entorno, idioma: Idioma = 'es'): Promise<Global> {
  const ahora = entorno.ahora || Date.now;
  const errores: string[] = [];
  const intento = async <T>(que: string, f: () => Promise<T>): Promise<T | null> => {
    try {
      return await f();
    } catch (e: any) {
      errores.push(`${que}: ${String(e?.message || e).slice(0, 120)}`);
      return null;
    }
  };
  const info = async (cuerpo: object) => {
    const r = await entorno.fetch(URL_INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };
  const [cripto, bolsa, animo] = await Promise.all([
    intento(idioma === 'en' ? 'Crypto' : 'Cripto', () => info({ type: 'metaAndAssetCtxs' })),
    intento(idioma === 'en' ? 'Stocks and commodities' : 'Bolsa y materias primas', () => info({ type: 'metaAndAssetCtxs', dex: 'xyz' })),
    intento(idioma === 'en' ? 'Fear and greed' : 'Miedo y codicia', async () => {
      const r = await entorno.fetch(URL_ANIMO);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as any;
    }),
  ]);
  const indicadores = leerIndicadores(idioma, cripto, bolsa);
  const [hoy, antes] = animo?.data || [];
  const valor = num(hoy?.value);
  if (valor != null) {
    const previo = num(antes?.value);
    indicadores.push({ id: 'animo', nombre: idioma === 'en' ? 'Fear and greed (crypto)' : 'Miedo y codicia (cripto)', grupo: 'animo', valor, cambio: previo != null ? valor - previo : null, unidad: '/100' });
  }
  return { ts: ahora(), indicadores, lectura: lecturaPorReglas(indicadores, idioma), errores };
}

/** Versión corta para la IA (pocas palabras: cada consulta cuenta en el plan gratuito). */
export function resumenGlobal(g: Global | null): Record<string, unknown> | null {
  if (!g || !g.indicadores.length) return null;
  return {
    semaforo: g.lectura.color,
    puntos: g.lectura.puntos,
    cambios_del_dia_pct: Object.fromEntries(g.indicadores.filter((i) => i.cambio != null && i.grupo !== 'animo').map((i) => [i.id, i.cambio])),
    miedo_codicia: g.indicadores.find((i) => i.id === 'animo')?.valor ?? null,
  };
}
