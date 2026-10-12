// Explorador de mercados: junta los de todas las plataformas y los filtra.
// No sabe nada de ninguna plataforma en particular.
import type { Idioma, Mercado, Plataforma } from './plataformas/tipos';

export const CATEGORIAS = ['cripto_hoy', 'cripto_mediano', 'bolsa', 'economia', 'otro'] as const;
export const PRECIOS = [0.5, 0.1] as const;

export interface Filtro {
  /** '' = todas; «guardadas» = solo las que marcaste con estrella. */
  categoria: string;
  creador: string;
  /** 0 = todos; si no, solo lados que cuestan menos de esto. */
  precioMax: number;
  plataforma: string;
  texto: string;
}

export const FILTRO_VACIO: Filtro = { categoria: '', creador: '', precioMax: 0, plataforma: '', texto: '' };

export interface Guardada {
  plataforma: string;
  id: string;
  pregunta: string;
  ts: number;
  /** Cuándo vence, para avisarte aunque la app esté cerrada. */
  vence: number | null;
}
export type Guardadas = Record<string, Guardada>;

export interface Explorado {
  ts: number;
  mercados: Mercado[];
  /** Plataformas que fallaron, con su error real. */
  errores: { plataforma: string; error: string }[];
}

export const clave = (m: { plataforma: string; id: string }) => `${m.plataforma}:${m.id}`;
export const categoriaDe = (m: Mercado) => (m.categoria === 'cripto' ? `cripto_${m.plazo}` : m.categoria);
const barato = (m: Mercado, max: number) => m.lados.some((l) => l.precio != null && l.precio < max);

/** Pide los mercados a cada plataforma. Si una falla, las demás se muestran igual. */
export async function explorar(plataformas: Plataforma[], idioma: Idioma = 'es', ahora: () => number = Date.now): Promise<Explorado> {
  const r = await Promise.allSettled(plataformas.map((p) => p.listarMercados(idioma)));
  const out: Explorado = { ts: ahora(), mercados: [], errores: [] };
  r.forEach((x, i) => {
    if (x.status === 'fulfilled') out.mercados.push(...x.value.mercados);
    else out.errores.push({ plataforma: plataformas[i].id, error: String(x.reason?.message || x.reason) });
  });
  return out;
}

export function filtrar(mercados: Mercado[], f: Filtro, guardadas: Guardadas = {}): Mercado[] {
  const q = f.texto.trim().toLowerCase();
  return mercados.filter((m) => {
    if (f.plataforma && m.plataforma !== f.plataforma) return false;
    if (f.creador && m.creador !== f.creador) return false;
    if (f.precioMax && !barato(m, f.precioMax)) return false;
    if (q && !m.pregunta.toLowerCase().includes(q)) return false;
    if (f.categoria === 'guardadas') return !!guardadas[clave(m)];
    return !f.categoria || categoriaDe(m) === f.categoria;
  });
}

/** Cuántos mercados hay en cada opción de cada filtro. */
export function contar(mercados: Mercado[], guardadas: Guardadas = {}) {
  const categorias: Record<string, number> = {},
    creadores: Record<string, number> = {},
    plataformas: Record<string, number> = {},
    precios: Record<string, number> = {};
  for (const m of mercados) {
    categorias[categoriaDe(m)] = (categorias[categoriaDe(m)] || 0) + 1;
    creadores[m.creador] = (creadores[m.creador] || 0) + 1;
    plataformas[m.plataforma] = (plataformas[m.plataforma] || 0) + 1;
    for (const p of PRECIOS) if (barato(m, p)) precios[p] = (precios[p] || 0) + 1;
  }
  return { total: mercados.length, categorias, creadores, plataformas, precios, guardadas: Object.keys(guardadas).length };
}

/** Guardadas que ya no salen en la lista: cerraron o vencieron. Si una plataforma no
 *  respondió, de las suyas no se sabe nada: no se dan por cerradas. */
export function cerradas(guardadas: Guardadas, e: Pick<Explorado, 'mercados' | 'errores'>): Guardada[] {
  const abiertos = new Set(e.mercados.map(clave)),
    sinDatos = new Set(e.errores.map((x) => x.plataforma));
  return Object.keys(guardadas)
    .filter((k) => !abiertos.has(k) && !sinDatos.has(guardadas[k].plataforma))
    .map((k) => guardadas[k]);
}

/** Marca o desmarca la estrella. Devuelve la lista nueva (no cambia la que recibe). */
export function alternarGuardada(guardadas: Guardadas, m: { plataforma: string; id: string; pregunta: string; vence?: number | null }, ahora: number): Guardadas {
  const out = { ...guardadas },
    k = clave(m);
  if (out[k]) delete out[k];
  else out[k] = { plataforma: m.plataforma, id: m.id, pregunta: m.pregunta, ts: ahora, vence: m.vence ?? null };
  return out;
}
