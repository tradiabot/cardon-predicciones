// Hyperliquid (HIP-4, «outcome markets»). Todo lo propio de esta plataforma vive aquí.
//
// Cada mercado tiene un número y dos lados; el lado se llama «#N» con N = 10 × mercado + lado
// (0 = el primero, normalmente «Sí»). Cada unidad vale entre 0 y 1 USDC y al vencer paga 1 si
// aciertas y 0 si no. Los datos de lectura son públicos: no hacen falta claves.
import { type Categoria, type Entorno, ErrorPlataforma, type Idioma, type Lado, type Libro, type ListaMercados, type Mercado, type Nivel, type Plataforma } from './tipos';

const ID = 'hyperliquid';
const URL_INFO = 'https://api.hyperliquid.xyz/info';
// Mínimo por orden: ~1 USDC. Hyperliquid no lo publica; se comprueba con órdenes reales en la etapa 2.
const MINIMO_ORDEN = 1;
const HORAS_HOY = 36;
const MAX_MERCADOS = 300;

type Json = Record<string, any>;

// Quién crea cada mercado («venue»). Sin venue = Hyperliquid. Los creadores externos ponen HYPE
// en garantía y, con deployerFeeScale > 0, cobran su parte: la comisión es el doble.
const CREADORES: Record<string, string> = { '': 'Hyperliquid', out: 'out', skew: 'skew', txyz: 'trade.xyz' };
const NOMBRES_SUB: Record<string, [string, string]> = {
  'xyz:XYZ100': ['Nasdaq 100', 'Nasdaq 100'],
  'xyz:SP500': ['S&P 500', 'S&P 500'],
  'xyz:CL': ['Petróleo WTI', 'WTI crude oil'],
  'xyz:BRENTOIL': ['Petróleo Brent', 'Brent crude oil'],
  'xyz:GOLD': ['Oro', 'Gold'],
  'xyz:SILVER': ['Plata', 'Silver'],
  'xyz:SPCX': ['SpaceX', 'SpaceX'],
};
const ES_DEPORTE = /sport|award|contest/i;

function campos(desc: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const parte of String(desc || '').split('|')) {
    const i = parte.indexOf(':');
    if (i > 0) out[parte.slice(0, i).trim()] = parte.slice(i + 1).trim();
  }
  return out;
}

function venceMs(t: unknown): number | null {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(String(t || ''));
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

function numero(x: unknown): number | null {
  const n = Number(x);
  return x != null && x !== '' && Number.isFinite(n) ? n : null;
}

// Miles con espacio (85 501) para que no se confundan con decimales; en español, coma decimal (109,32).
export function cifraEn(n: number, idioma: Idioma = 'es'): string {
  if (n >= 1000) return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const s = String(Number(n.toPrecision(6)));
  return idioma === 'en' ? s : s.replace('.', ',');
}

function textos(idioma: Idioma) {
  const es = idioma !== 'en';
  const cifra = (n: number) => cifraEn(n, idioma);
  const fecha = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString(es ? 'es' : 'en', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
  const si = es ? '«Sí»' : '“Yes”';
  return {
    es,
    fecha,
    sub: (s: string) => NOMBRES_SUB[s]?.[es ? 0 : 1] || s.replace(/^xyz:/, ''),
    lado(n: unknown): string {
      const x = String(n || '').replace(/^template:/, '');
      if (x === 'Yes') return es ? 'Sí' : 'Yes';
      if (x === 'Over') return es ? 'Más' : 'Over';
      if (x === 'Under') return es ? 'Menos' : 'Under';
      return x;
    },
    precio: (N: string, o: number) =>
      es
        ? { pregunta: `¿${N} ≥ ${cifra(o)} al vencer?`, regla: `${si} gana si ${N} está en ${cifra(o)} o más al vencer.` }
        : { pregunta: `${N} ≥ ${cifra(o)} at expiry?`, regla: `${si} wins if ${N} is at ${cifra(o)} or higher at expiry.` },
    toque: (N: string, o: number, v: number | null) =>
      es
        ? { pregunta: `¿${N} toca ${cifra(o)} antes del ${fecha(v)}?`, regla: `${si} gana si ${N} toca ${cifra(o)} en cualquier momento antes de vencer.` }
        : { pregunta: `${N} touches ${cifra(o)} before ${fecha(v)}?`, regla: `${si} wins if ${N} touches ${cifra(o)} at any time before expiry.` },
    rango(N: string, desde: number | null, hasta: number | null) {
      if (desde == null && hasta != null)
        return es
          ? { pregunta: `¿${N} < ${cifra(hasta)} al vencer?`, regla: `${si} gana si al vencer ${N} está por debajo de ${cifra(hasta)}.` }
          : { pregunta: `${N} < ${cifra(hasta)} at expiry?`, regla: `${si} wins if ${N} is below ${cifra(hasta)} at expiry.` };
      if (hasta == null && desde != null)
        return es
          ? { pregunta: `¿${N} ≥ ${cifra(desde)} al vencer?`, regla: `${si} gana si al vencer ${N} está en ${cifra(desde)} o más.` }
          : { pregunta: `${N} ≥ ${cifra(desde)} at expiry?`, regla: `${si} wins if ${N} is at ${cifra(desde)} or higher at expiry.` };
      const a = cifra(desde ?? 0),
        b = cifra(hasta ?? 0);
      return es
        ? { pregunta: `¿${N} entre ${a} y ${b} al vencer?`, regla: `${si} gana si al vencer ${N} está entre ${a} y ${b}.` }
        : { pregunta: `${N} between ${a} and ${b} at expiry?`, regla: `${si} wins if ${N} is between ${a} and ${b} at expiry.` };
    },
    fuente: (f: string) => (es ? ` Se resuelve con: ${f}.` : ` Resolved with: ${f}.`),
    tasa(institucion: string, nombre: string, etiqueta: string) {
      const fed = /federal/i.test(institucion);
      const que = /NoChange/.test(nombre) ? 0 : /Decrease/.test(nombre) ? 1 : 2;
      if (es) {
        const quien = fed ? 'la Fed' : institucion || 'el banco central';
        const v = ['mantiene', 'baja', 'sube'][que];
        return { pregunta: `¿${quien[0].toUpperCase() + quien.slice(1)} ${v} la tasa de interés (${etiqueta || 'próxima decisión'})?`, regla: `${si} gana si ${quien} ${v} la tasa en esa decisión.` };
      }
      const quien = fed ? 'the Fed' : institucion || 'the central bank';
      const v = ['holds', 'cuts', 'raises'][que];
      return { pregunta: `${quien[0].toUpperCase() + quien.slice(1)} ${v} the interest rate (${etiqueta || 'next decision'})?`, regla: `${si} wins if ${quien} ${v} the rate at that decision.` };
    },
    ipo: (empresa: string, v: number | null) =>
      es
        ? { pregunta: `¿${empresa} confirma su salida a bolsa antes del ${fecha(v)}?`, regla: `${si} gana si ${empresa} confirma oficialmente su salida a bolsa antes del ${fecha(v)}.` }
        : { pregunta: `${empresa} confirms its IPO before ${fecha(v)}?`, regla: `${si} wins if ${empresa} officially confirms its IPO before ${fecha(v)}.` },
    ipoValor(empresa: string, milesDeMillones: number, v: number | null) {
      if (es) {
        const valor = milesDeMillones >= 1000 ? `${cifra(milesDeMillones / 1000)} billones` : `${cifra(milesDeMillones)} mil millones`;
        return { pregunta: `¿${empresa} vale ${valor} de USD o más en su primer día en bolsa?`, regla: `${si} gana si ${empresa} sale a bolsa antes del ${fecha(v)} y cierra su primer día con ese valor o más.` };
      }
      const valor = milesDeMillones >= 1000 ? `${cifra(milesDeMillones / 1000)} trillion` : `${cifra(milesDeMillones)} billion`;
      return { pregunta: `${empresa} worth USD ${valor} or more on its first trading day?`, regla: `${si} wins if ${empresa} lists before ${fecha(v)} and closes its first day at that value or more.` };
    },
  };
}

interface Leido {
  categoria?: Categoria;
  pregunta?: string;
  regla?: string;
  sub?: string;
  externo?: string;
  tipo: 'precio' | 'toque' | 'rango' | 'evento';
  objetivo?: number | null;
  desde?: number | null;
  hasta?: number | null;
  vence: number | null;
  fuente?: string;
}

// Qué pregunta un mercado. null = deportes o relleno («otro resultado»): no se muestran.
function leerMercado(o: Json, q: Json | undefined, T: ReturnType<typeof textos>): Leido | null {
  const nombre = String(o.name || ''),
    desc = String(o.description || ''),
    c = campos(desc),
    cq = q ? campos(q.description) : {};
  if (ES_DEPORTE.test(nombre) || ES_DEPORTE.test(String(q?.name || '')) || c.participant || c.competition || c.candidate || cq.sport || cq.competition || cq.award) return null;
  if (/fallback/i.test(nombre) || desc === 'other') return null;
  const perp = desc.startsWith('perp:') ? desc.split('|')[0].slice(5) : null;
  if (c.class === 'priceBinary' && c.underlying) return { tipo: 'precio', sub: c.underlying, objetivo: numero(c.targetPrice), vence: venceMs(c.expiry) };
  if (nombre === 'template:binaryPrice' && perp) return { tipo: 'precio', sub: perp, objetivo: numero(c.threshold), vence: venceMs(c.time), fuente: c.priceDescription };
  if (nombre === 'template:priceTouch' && perp) return { tipo: 'toque', sub: perp, objetivo: numero(c.target), vence: venceMs(c.time), fuente: c.priceDescription };
  if (nombre === 'template:binaryPriceExternal') return { tipo: 'precio', externo: c.shortName || c.instrument, objetivo: numero(c.threshold), vence: venceMs(c.time), fuente: c.priceDescription };
  if (cq.class === 'priceBucket' && cq.underlying && c.index != null) {
    const t = String(cq.priceThresholds || '')
        .split(',')
        .map(Number)
        .filter((x) => x > 0),
      k = Number(c.index);
    return { tipo: 'rango', sub: cq.underlying, desde: k > 0 ? (t[k - 1] ?? null) : null, hasta: k < t.length ? t[k] : null, vence: venceMs(cq.expiry) };
  }
  if (/^template:policyRate/.test(nombre)) return { tipo: 'evento', categoria: 'economia', ...T.tasa(String(cq.institution || ''), nombre, String(cq.decisionLabel || '')), vence: venceMs(cq.scheduledDecision) ?? venceMs(cq.decisionDeadline) };
  if (nombre === 'template:companyIpoConfirmed' && c.company) {
    const v = venceMs(c.dateTime);
    return { tipo: 'evento', categoria: 'economia', ...T.ipo(c.company, v), vence: v };
  }
  if (nombre === 'template:companyIpoFirstDayMarketCap' && c.company) {
    const v = venceMs(c.listingDeadline);
    return { tipo: 'evento', categoria: 'economia', ...T.ipoValor(c.company, Number(c.marketCapThresholdB), v), vence: v };
  }
  const n2 = nombre.replace(/^template:/, '');
  return { tipo: 'evento', categoria: 'otro', pregunta: desc ? `${n2} · ${desc.slice(0, 80)}` : n2, vence: venceMs(cq.resolutionDeadline) };
}

/** Convierte la respuesta de Hyperliquid en mercados con la forma común. */
export function leerMercados(meta: Json, precios: Json, ahora: number, idioma: Idioma = 'es'): Mercado[] {
  const T = textos(idioma);
  const preguntas: Record<string, Json> = {};
  for (const q of meta?.questions || []) for (const n of [...(q?.namedOutcomes || []), q?.fallbackOutcome]) preguntas[n] = q;
  const lista: Mercado[] = [];
  for (const o of meta?.outcomes || []) {
    if (!o || typeof o.outcome !== 'number') continue; // entrada que no es un mercado
    const m = leerMercado(o, preguntas[o.outcome], T);
    if (!m) continue;
    if (m.vence && m.vence < ahora) continue;
    if (m.externo && precios['xyz:' + m.externo] != null) m.sub = 'xyz:' + m.externo;
    const lados: Lado[] = (o.sideSpecs || []).map((sd: Json, i: number) => {
      const id = `#${o.outcome * 10 + i}`;
      return { id, nombre: T.lado(sd.name), precio: numero(precios[id]) };
    });
    if (!lados.some((l) => l.precio != null)) continue;
    // 0,5 / 0,5 exactos = libro vacío: ese precio no es real.
    const sinOfertas = lados.length === 2 && lados.every((l) => l.precio === 0.5);
    const N = m.sub ? T.sub(m.sub) : m.externo || '';
    let { pregunta, regla } = m;
    if (m.tipo === 'precio' && m.objetivo != null) ({ pregunta, regla } = T.precio(N, m.objetivo));
    if (m.tipo === 'toque' && m.objetivo != null) ({ pregunta, regla } = T.toque(N, m.objetivo, m.vence));
    if (m.tipo === 'rango') ({ pregunta, regla } = T.rango(N, m.desde ?? null, m.hasta ?? null));
    if (!pregunta) continue;
    // Cada creador resuelve con su propia fuente de precio (p. ej. skew usa Pyth).
    if (m.fuente && regla) regla += T.fuente(m.fuente);
    const horas = m.vence ? Math.round((m.vence - ahora) / 360_000) / 10 : null;
    const actual = m.sub ? numero(precios[m.sub]) : null;
    const objetivo = m.tipo === 'rango' ? null : (m.objetivo ?? null);
    lista.push({
      plataforma: ID,
      id: String(o.outcome),
      pregunta,
      regla: regla || null,
      categoria: m.categoria || (m.sub ? (m.sub.startsWith('xyz:') ? 'bolsa' : 'cripto') : m.externo ? 'bolsa' : 'otro'),
      plazo: horas != null && horas <= HORAS_HOY ? 'hoy' : 'mediano',
      vence: m.vence,
      horas,
      lados,
      moneda: String(o.quoteToken || 'USDC'),
      creador: CREADORES[String(o.venue || '')] || String(o.venue),
      comision_doble: Number(o.deployerFeeScale) > 0,
      sin_ofertas: sinOfertas,
      subyacente: N || null,
      precio_actual: actual,
      objetivo,
      distancia_pct: actual != null && objetivo ? Math.round((actual / objetivo - 1) * 10000) / 100 : null,
    });
  }
  const orden: Record<Categoria, number> = { cripto: 0, bolsa: 1, economia: 2, otro: 3 };
  lista.sort((a, b) => orden[a.categoria] - orden[b.categoria] || (a.vence || 9e15) - (b.vence || 9e15));
  return lista.slice(0, MAX_MERCADOS);
}

export function crearHyperliquid(entorno: Entorno): Plataforma {
  const ahora = entorno.ahora || Date.now;
  async function info(cuerpo: Json): Promise<any> {
    let r: Response;
    try {
      r = await entorno.fetch(URL_INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    } catch (e: any) {
      throw new ErrorPlataforma(ID, `Hyperliquid no respondió: ${String(e?.message || e).slice(0, 120)}`);
    }
    if (!r.ok) throw new ErrorPlataforma(ID, `Hyperliquid respondió HTTP ${r.status}`);
    return r.json();
  }
  const etapa2 = (): never => {
    throw new ErrorPlataforma(ID, 'Esta versión solo lee mercados: operar y ver tu cuenta llega en la etapa 2.');
  };
  return {
    id: ID,
    nombre: 'Hyperliquid',
    moneda: 'USDC',
    minimo_orden: MINIMO_ORDEN,
    claves: [
      { id: 'cuenta', nombre: 'Dirección de tu cuenta', secreta: false },
      { id: 'clave_agente', nombre: 'Clave de la billetera de agente (API wallet)', secreta: true },
    ],
    async listarMercados(idioma: Idioma = 'es'): Promise<ListaMercados> {
      // Los precios de bolsa y materias primas viven en otro libro («xyz»): si falla, se sigue sin ellos.
      const [meta, mids, midsXyz] = await Promise.all([info({ type: 'outcomeMeta' }), info({ type: 'allMids' }), info({ type: 'allMids', dex: 'xyz' }).catch(() => ({}))]);
      const ts = ahora();
      return { plataforma: ID, ts, mercados: leerMercados(meta, { ...mids, ...midsXyz }, ts, idioma) };
    },
    async libro(lado: string): Promise<Libro> {
      if (!/^#\d{2,9}$/.test(lado)) throw new ErrorPlataforma(ID, 'Mercado inválido');
      const d = await info({ type: 'l2Book', coin: lado });
      const [compras, ventas] = d?.levels || [[], []];
      const nivel = (x: Json): Nivel => ({ precio: Number(x.px), unidades: Number(x.sz) });
      return { plataforma: ID, lado, ts: ahora(), compras: (compras || []).slice(0, 5).map(nivel), ventas: (ventas || []).slice(0, 5).map(nivel) };
    },
    saldo: etapa2,
    posiciones: etapa2,
    comprar: etapa2,
    vender: etapa2,
    cobrar: etapa2,
  };
}
