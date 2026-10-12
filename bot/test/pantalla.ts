// La interfaz de verdad (app/web) corriendo en jsdom, con la red y el teléfono simulados.
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { crearFalsa } from './falsa';
import { AHORA, hyperliquidSimulado } from './simulada';

const WEB = new URL('../../app/web/', import.meta.url);
export const leer = (f: string) => readFileSync(new URL(f, WEB), 'utf8');
let nucleo: Promise<string> | null = null;
export function nucleoFresco(): Promise<string> {
  nucleo ||= build({ entryPoints: ['src/nucleo.ts'], bundle: true, format: 'iife', globalName: 'NUCLEO', target: 'es2019', write: false, banner: { js: '/* Generado con «npm run app» desde bot/src. No lo edites a mano. */' } }).then((r) => r.outputFiles[0].text);
  return nucleo;
}

export interface Op {
  aceptado?: boolean;
  idioma?: string;
  sim?: ReturnType<typeof hyperliquidSimulado>;
  conFeria?: boolean;
  guardadas?: object;
  /** Red completa (GitHub, Cloudflare, tu agente). Por defecto solo existe Hyperliquid simulado. */
  red?: typeof fetch;
  /** El teléfono: lo que la app Android expone como window.AndroidApp. */
  nativo?: (w: any) => object;
  local?: Record<string, string>;
}
export async function abrir(op: Op = {}) {
  const sim = op.sim || hyperliquidSimulado();
  const dom = new JSDOM(leer('index.html').replace(/<script src="[^"]+"><\/script>/g, ''), { url: 'https://app.prueba/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window as any;
  // Igual que una etiqueta <script>: lo declarado arriba del todo queda global.
  const correr = (codigo: string) => new Script(codigo).runInContext(dom.getInternalVMContext());
  w.fetch = op.red || sim.red;
  w.scrollTo = () => {};
  w.TextEncoder = TextEncoder;
  w.Date.now = () => AHORA;
  // Las esperas del instalador (3 a 6 s entre consultas) no se esperan en las pruebas.
  const pausa = w.setTimeout.bind(w);
  w.setTimeout = (f: () => void, ms: number) => pausa(f, Math.min(ms || 0, 2));
  if (op.aceptado !== false) w.localStorage.setItem('cardon-pred-aviso', JSON.stringify({ v: '2026-10-12' }));
  w.localStorage.setItem('cardon-pred-idioma', op.idioma || 'es');
  if (op.guardadas) w.localStorage.setItem('cardon-pred-guardadas', JSON.stringify(op.guardadas));
  for (const [k, v] of Object.entries(op.local || {})) w.localStorage.setItem(k, v);
  if (op.nativo) w.AndroidApp = op.nativo(w);
  for (const f of ['config.js', 'i18n.js']) correr(leer(f));
  correr(await nucleoFresco());
  if (op.conFeria) {
    // Lo único que cambia al sumar una plataforma: una entrada más en la lista.
    const original = w.NUCLEO.crearPlataformas;
    w.NUCLEO = { ...w.NUCLEO, crearPlataformas: (entorno: any) => [...original(entorno), crearFalsa({ fetch: sim.red, ahora: () => AHORA })] };
  }
  for (const f of ['base.js', 'app.js', 'sellar.js', 'nube.js']) correr(leer(f));
  const d = w.document as Document;
  const q = (s: string) => d.querySelector(s) as HTMLElement;
  const todos = (s: string) => [...d.querySelectorAll(s)] as HTMLElement[];
  const esperar = async (cond: () => unknown, que = 'la condición') => {
    for (let i = 0; i < 400; i++) {
      if (cond()) return;
      await new Promise((r) => setTimeout(r, 5));
    }
    throw new Error(`No llegó: ${que}`);
  };
  const tocar = (e: Element | null | undefined) => {
    if (!e) throw new Error('No encontré qué tocar');
    e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  };
  const escribir = (sel: string, valor: string) => {
    (q(sel) as HTMLInputElement).value = valor;
  };
  const chip = (texto: string) => todos('.pm-filtro button').find((b) => b.textContent!.startsWith(texto));
  const preguntas = () => todos('#pm-lista .pm-cab b').map((b) => b.textContent);
  const listo = () => esperar(() => todos('#pm-lista .pm-mercado').length > 0, 'la lista de mercados');
  return { w, d, q, todos, esperar, tocar, escribir, chip, preguntas, listo, sim };
}
