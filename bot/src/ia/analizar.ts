// «Analizar»: una o varias IA leen un mercado y dicen si conviene comprar un lado o no entrar.
// Solo opinan: aquí no se crea ni se envía ninguna orden. El resultado sale con un semáforo:
// verde = comprar con buena confianza, amarillo = comprar con dudas, rojo = no entrar.
import { type Color, type Global, resumenGlobal } from '../global';
import type { Historia, Idioma, Mercado, Plataforma } from '../plataformas/tipos';
import { type Claves, type EntornoIA, ErrorIA, etiquetaModelo, preguntar, sacarJson } from './proveedores';

export type Sugerencia = 'COMPRAR' | 'NO_ENTRAR';
export type Pausas = Record<string, number>;
export interface Consenso {
  activo: boolean;
  /** Cuántas IA opinan a la vez: de 2 a 5. */
  tamano: number;
}
export interface Voto {
  modelo: string;
  ok: boolean;
  ms: number;
  sugerencia?: Sugerencia;
  /** Identificador del lado que compraría (null si no entra). */
  lado?: string | null;
  /** Probabilidad, de 0 a 100, de que gane el primer lado del mercado. */
  probabilidad?: number;
  confianza?: number;
  motivo?: string;
  error?: string;
}
export interface Analisis {
  plataforma: string;
  mercado: string;
  pregunta: string;
  ts: number;
  sugerencia: Sugerencia;
  lado: string | null;
  lado_nombre: string | null;
  primer_lado: string;
  /** Lo que cree la IA y lo que dice el mercado para el primer lado, en %. */
  probabilidad: number | null;
  precio: number | null;
  /** Lo que cuesta de verdad comprar una unidad del lado sugerido: la oferta de venta más barata del libro. */
  costo: number | null;
  /** Puntos de ventaja del lado sugerido: probabilidad de la IA menos lo que cuesta comprarlo. */
  ventaja: number | null;
  confianza: number;
  color: Color;
  motivo: string;
  /** Por qué el sistema cambió la sugerencia de la IA a «no entrar», si lo hizo. */
  freno: 'sin_ofertas' | 'poca_ventaja' | null;
  acuerdo: { a_favor: number; total: number };
  votos: Voto[];
}

/** Ventaja mínima, en puntos, para sugerir una compra: tiene que cubrir comisiones y el margen de error. */
export const VENTAJA_MIN = 5;
export const VENTAJA_MIN_DOBLE = 8;
export const CONFIANZA_VERDE = 60;

/** Lo que dice el libro de cada lado: a cuánto se puede comprar y vender ahora mismo (null = nadie ofrece). */
export type Ofertas = Record<string, { comprar: number | null; vender: number | null }>;

export class ErrorAnalisis extends Error {
  constructor(
    mensaje: string,
    readonly pausas: Pausas,
    readonly votos: Voto[] = [],
  ) {
    super(mensaje);
    this.name = 'ErrorAnalisis';
  }
}

function sistema(idioma: Idioma, lados: string[]): string {
  const lengua = idioma === 'en' ? 'inglés' : 'español';
  return `Eres analista de mercados de predicción. Cada mercado es una pregunta de sí o no: una unidad del lado que acierta paga 1 y la del que falla paga 0. El precio de un lado (de 0 a 1) es la probabilidad que le da el mercado.
Recibes un mercado en JSON: la pregunta, la regla que decide quién gana, las horas que faltan y, de cada lado, su precio medio, su cambio de hoy y lo que dice el libro: "comprar_cuesta" (lo que pagarías de verdad por unidad) y "vender_paga". Si "comprar_cuesta" es null, nadie vende ese lado. Cuando "comprar_cuesta" está lejos del precio medio, el precio medio no es real: fíate del libro. Si depende de un precio, también el activo, su precio actual, el objetivo, la distancia y cómo se movió en 24 h y 7 días; y "global", el ánimo general de los mercados. No inventes datos ni noticias que no estén ahí.
Tu trabajo:
1. Estima la probabilidad real, de 0 a 100, de que gane el PRIMER lado ("${lados[0] ?? ''}"). Piensa en cuánto suele moverse el activo en el tiempo que falta frente a la distancia al objetivo.
2. Sugiere COMPRAR un lado solo si tu probabilidad para ese lado supera a su "comprar_cuesta" (o a su precio, si no viene el libro) por al menos ${VENTAJA_MIN} puntos (${VENTAJA_MIN_DOBLE} si "comision_doble" es true). Si no hay esa ventaja, si "sin_ofertas" es true o si no tienes datos para opinar: NO_ENTRAR.
3. La confianza (0 a 100) dice cuánto te fías de tu propia estimación, no la probabilidad.
Responde SOLO un objeto JSON:
{"probabilidad":0-100,"sugerencia":"COMPRAR"|"NO_ENTRAR","lado":${lados.map((l) => `"${l}"`).join('|')}|null,"confianza":0-100,"motivo":"máximo 220 caracteres en ${lengua}, sencillo, sin jerga"}`;
}

/** Lo que se le envía a la IA: solo datos públicos del mercado, nunca nada de la persona. */
export function contextoDe(m: Mercado, historia: Historia | null, global: Global | null, ofertas: Ofertas = {}): Record<string, unknown> {
  const ctx: Record<string, unknown> = {
    pregunta: m.pregunta,
    regla: m.regla,
    horas_para_vencer: m.horas,
    lados: m.lados.map((l) => ({
      lado: l.nombre,
      precio: l.precio,
      cambio_hoy_puntos: l.cambio == null ? null : Math.round(l.cambio * 1000) / 10,
      ...(ofertas[l.id] ? { comprar_cuesta: ofertas[l.id].comprar, vender_paga: ofertas[l.id].vender } : {}),
    })),
    volumen_del_dia: m.volumen ?? null,
    comision_doble: m.comision_doble,
    sin_ofertas: m.sin_ofertas,
  };
  if (m.subyacente) {
    ctx.activo = {
      nombre: m.subyacente,
      precio_actual: m.precio_actual,
      objetivo: m.objetivo,
      distancia_al_objetivo_pct: m.distancia_pct,
      cambio_hoy_pct: m.cambio_subyacente_pct ?? null,
      ...(historia || {}),
    };
  }
  const g = resumenGlobal(global);
  if (g) ctx.global = g;
  return ctx;
}

export function leerVoto(crudo: string, m: Mercado): Pick<Voto, 'sugerencia' | 'lado' | 'probabilidad' | 'confianza' | 'motivo'> {
  const d = sacarJson(crudo);
  const numero = (x: unknown, que: string) => {
    const n = Number(x);
    if (x == null || x === '' || !Number.isFinite(n) || n < 0 || n > 100) throw new ErrorIA(`${que} inválida: ${String(x).slice(0, 20)}`);
    return n;
  };
  const probabilidad = numero(d.probabilidad, 'probabilidad');
  const confianza = numero(d.confianza, 'confianza');
  const s = String(d.sugerencia || '').toUpperCase().replace(/\s+/g, '_');
  if (s !== 'COMPRAR' && s !== 'NO_ENTRAR') throw new ErrorIA(`sugerencia inválida: ${String(d.sugerencia).slice(0, 20)}`);
  let lado: string | null = null;
  if (s === 'COMPRAR') {
    const nombre = String(d.lado ?? '').trim().toLowerCase();
    const l = m.lados.find((x) => x.nombre.toLowerCase() === nombre);
    if (!l) throw new ErrorIA(`sugirió comprar un lado que no existe: ${String(d.lado).slice(0, 20)}`);
    lado = l.id;
  }
  return { sugerencia: s, lado, probabilidad, confianza, motivo: String(d.motivo ?? '').slice(0, 240) };
}

function mediana(v: number[]): number {
  const o = [...v].sort((a, b) => a - b);
  const mitad = Math.floor(o.length / 2);
  return o.length % 2 ? o[mitad] : (o[mitad - 1] + o[mitad]) / 2;
}

/**
 * Junta los votos:
 * - gana la opción (comprar tal lado o no entrar) con más confianza sumada; empate → no entrar;
 * - la confianza es la media de quienes votaron eso × (0,5 + 0,5 × acuerdo): si todas coinciden
 *   se conserva, si coinciden 2 de 3 baja un 17 %;
 * - la probabilidad es la mediana de todas;
 * - y dos frenos que no dependen de la IA: sin ofertas o con poca ventaja, nunca se sugiere comprar.
 *   La ventaja se mide contra lo que cuesta comprar de verdad (el libro), no contra el precio medio:
 *   en un mercado casi vacío el precio medio puede decir 0,50 cuando la única oferta está en 0,99.
 */
export function juntarVotos(votos: Voto[], m: Mercado, ahora: number, ofertas: Ofertas = {}): Analisis | null {
  const ok = votos.filter((v) => v.ok && v.sugerencia);
  if (!ok.length) return null;
  const opcion = (v: Voto) => (v.sugerencia === 'COMPRAR' && v.lado ? v.lado : '');
  const suma: Record<string, number> = {};
  for (const v of ok) suma[opcion(v)] = (suma[opcion(v)] || 0) + Math.max(1, v.confianza ?? 0);
  const orden = Object.keys(suma).sort((a, b) => suma[b] - suma[a]);
  let lado: string | null = orden.length > 1 && suma[orden[0]] === suma[orden[1]] ? null : orden[0] || null;
  const aFavor = ok.filter((v) => opcion(v) === (lado ?? ''));
  const media = aFavor.length ? aFavor.reduce((a, v) => a + (v.confianza ?? 0), 0) / aFavor.length : Math.min(...ok.map((v) => v.confianza ?? 0));
  let confianza = Math.round(media * (0.5 + (0.5 * aFavor.length) / ok.length));
  const probabilidad = Math.round(mediana(ok.map((v) => v.probabilidad ?? 50)) * 10) / 10;
  const primero = m.lados[0];
  const precio = primero?.precio != null ? Math.round(primero.precio * 1000) / 10 : null;
  let ventaja: number | null = null;
  let costo: number | null = null;
  let freno: Analisis['freno'] = null;
  if (lado) {
    const i = m.lados.findIndex((l) => l.id === lado);
    const libro = ofertas[lado];
    // Con el libro a la vista manda lo que cuesta comprar; sin él, el precio medio.
    costo = libro ? libro.comprar : (m.lados[i]?.precio ?? null);
    // Con dos lados, la probabilidad del segundo es lo que le falta al primero para llegar a 100.
    const mia = i === 0 ? probabilidad : 100 - probabilidad;
    ventaja = costo != null ? Math.round((mia - costo * 100) * 10) / 10 : null;
    if (m.sin_ofertas || (libro && libro.comprar == null)) freno = 'sin_ofertas';
    else if (ventaja == null || ventaja < (m.comision_doble ? VENTAJA_MIN_DOBLE : VENTAJA_MIN)) freno = 'poca_ventaja';
  }
  const guia = [...(aFavor.length ? aFavor : ok)].sort((a, b) => (b.confianza ?? 0) - (a.confianza ?? 0))[0];
  const sugerido = lado;
  if (freno) {
    lado = null;
    confianza = Math.min(confianza, 50);
  }
  return {
    plataforma: m.plataforma,
    mercado: m.id,
    pregunta: m.pregunta,
    ts: ahora,
    sugerencia: lado ? 'COMPRAR' : 'NO_ENTRAR',
    lado,
    lado_nombre: m.lados.find((l) => l.id === (lado ?? sugerido))?.nombre ?? null,
    primer_lado: primero?.nombre ?? '',
    probabilidad,
    precio,
    costo,
    ventaja,
    confianza,
    color: !lado ? 'rojo' : confianza >= CONFIANZA_VERDE ? 'verde' : 'amarillo',
    motivo: guia.motivo ?? '',
    freno,
    acuerdo: { a_favor: aFavor.length, total: ok.length },
    votos,
  };
}

export interface Pedido {
  entorno: EntornoIA;
  mercado: Mercado;
  /** La plataforma del mercado, para pedirle la historia del activo (si sabe darla). */
  plataforma?: Plataforma;
  global?: Global | null;
  claves: Claves;
  modelos: string[];
  consenso: Consenso;
  /** Modelos que agotaron su límite y hasta cuándo descansan. */
  pausas?: Pausas;
  idioma?: Idioma;
}

/**
 * Con consenso: pregunta a la vez a las primeras IA disponibles y junta sus votos; si responde
 * menos de la mitad, sigue con las siguientes de la lista. Sin consenso: una tras otra hasta que
 * una responda. Devuelve también las pausas nuevas, para no gastar llamadas en modelos agotados.
 */
export async function analizar(p: Pedido): Promise<{ analisis: Analisis; pausas: Pausas }> {
  const ahora = (p.entorno.ahora || Date.now)();
  const idioma = p.idioma || 'es';
  const m = p.mercado;
  if (m.vence && m.vence < ahora) throw new ErrorAnalisis(idioma === 'en' ? 'This market has already expired.' : 'Este mercado ya venció.', {});
  let historia: Historia | null = null;
  try {
    historia = (await p.plataforma?.historia?.(m)) ?? null;
  } catch {
    // Sin historia la IA opina igual, con menos datos.
  }
  // El libro de cada lado: sin él no se sabe lo que cuesta comprar de verdad. Si no llega, se sigue con el precio medio.
  const ofertas: Ofertas = {};
  if (p.plataforma) {
    await Promise.all(
      m.lados.map(async (l) => {
        try {
          const libro = await p.plataforma!.libro(l.id);
          ofertas[l.id] = { comprar: libro.ventas[0]?.precio ?? null, vender: libro.compras[0]?.precio ?? null };
        } catch {
          // sin libro de este lado
        }
      }),
    );
  }
  const mensajes = [
    { role: 'system' as const, content: sistema(idioma, m.lados.map((l) => l.nombre)) },
    { role: 'user' as const, content: JSON.stringify(contextoDe(m, historia, p.global ?? null, ofertas)) },
  ];
  const pausas: Pausas = {};
  const votar = async (modelo: string): Promise<Voto> => {
    const t0 = Date.now();
    try {
      const leido = leerVoto(await preguntar(p.entorno, modelo, p.claves, mensajes), m);
      return { modelo, ok: true, ms: Date.now() - t0, ...leido };
    } catch (e: any) {
      if (e instanceof ErrorIA && e.pausaHasta) pausas[modelo] = e.pausaHasta;
      return { modelo, ok: false, ms: Date.now() - t0, error: String(e?.message || e).slice(0, 200) };
    }
  };
  const libres = p.modelos.filter((x) => (p.pausas?.[x] ?? 0) <= ahora);
  const votos: Voto[] = [];
  if (p.consenso.activo) {
    const primeros = libres.slice(0, Math.max(2, Math.min(5, p.consenso.tamano)));
    votos.push(...(await Promise.all(primeros.map(votar))));
    for (const x of libres.slice(primeros.length)) {
      if (votos.filter((v) => v.ok).length * 2 >= primeros.length) break;
      votos.push(await votar(x));
    }
  } else {
    for (const x of libres) {
      votos.push(await votar(x));
      if (votos[votos.length - 1].ok) break;
    }
  }
  const analisis = juntarVotos(votos, m, ahora, ofertas);
  if (!analisis) {
    const detalle = votos.map((v) => `${etiquetaModelo(v.modelo)}: ${v.error}`).join(' | ');
    const sinModelos = idioma === 'en' ? 'All your AI models are resting after hitting their limit. Try again in a few minutes.' : 'Todas tus IA están descansando porque agotaron su límite. Prueba en unos minutos.';
    throw new ErrorAnalisis(detalle || sinModelos, pausas, votos);
  }
  // Con consenso pedido, una sola opinión no basta para el verde: se queda en amarillo.
  if (p.consenso.activo && analisis.acuerdo.total < 2 && analisis.color === 'verde') analisis.color = 'amarillo';
  return { analisis, pausas };
}
