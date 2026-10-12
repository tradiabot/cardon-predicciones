// IA simulada: responde como un proveedor con formato de OpenAI, según un guion por modelo.
// También hace de alternative.me (miedo y codicia). Cualquier otra dirección falla.
import type { hyperliquidSimulado } from './simulada';

export const voto = (o: { probabilidad?: number; sugerencia?: string; lado?: string | null; confianza?: number; motivo?: string } = {}) =>
  JSON.stringify({ probabilidad: 62, sugerencia: 'COMPRAR', lado: 'Sí', confianza: 70, motivo: 'La plata lleva días firme y está pegada al objetivo.', ...o });

type Guion = string | { status: number; cuerpo?: unknown };
export interface LlamadaIA {
  url: string;
  modelo: string;
  clave: string | null;
  cuerpo: any;
}

export function iaSimulada(guion: Record<string, Guion> = {}, porDefecto: Guion = voto()) {
  const llamadas: LlamadaIA[] = [];
  const estado = { guion, porDefecto, animo: 72 };
  const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'Content-Type': 'application/json' } });
  const red = (async (u: unknown, init: RequestInit = {}) => {
    const url = String(u);
    if (url === 'https://api.alternative.me/fng/?limit=2') return json({ data: [{ value: String(estado.animo), value_classification: 'Greed' }, { value: '65' }] });
    if (!url.endsWith('/chat/completions')) throw new Error(`IA simulada: dirección no permitida en pruebas (${url})`);
    const cuerpo = JSON.parse(String(init.body));
    const cab = new Headers(init.headers as HeadersInit);
    llamadas.push({ url, modelo: cuerpo.model, clave: cab.get('authorization'), cuerpo });
    const g = estado.guion[cuerpo.model] ?? estado.porDefecto;
    if (typeof g === 'string') return json({ choices: [{ message: { content: g } }] });
    return json(g.cuerpo ?? { error: { message: 'fallo simulado' } }, g.status);
  }) as typeof fetch;
  return { red, llamadas, estado };
}

/** Hyperliquid simulado + IA simulada (+ lo que se quiera añadir) en una sola red. */
export function redCompleta(sim: ReturnType<typeof hyperliquidSimulado>, ia: ReturnType<typeof iaSimulada>, otra?: (url: string, init?: RequestInit) => Promise<Response> | null): typeof fetch {
  return (async (u: unknown, init?: RequestInit) => {
    const url = String(u);
    const r = otra?.(url, init);
    if (r) return r;
    return url.startsWith('https://api.hyperliquid.xyz/') ? sim.red(url, init) : ia.red(url, init);
  }) as typeof fetch;
}
