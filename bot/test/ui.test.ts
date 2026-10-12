// La interfaz de verdad (app/web) corriendo en jsdom con Hyperliquid simulado.
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';
import { crearFalsa } from './falsa';
import { AHORA, hyperliquidSimulado } from './simulada';

const WEB = new URL('../../app/web/', import.meta.url);
const leer = (f: string) => readFileSync(new URL(f, WEB), 'utf8');
let nucleo = '';
beforeAll(async () => {
  const r = await build({ entryPoints: ['src/nucleo.ts'], bundle: true, format: 'iife', globalName: 'NUCLEO', target: 'es2019', write: false, banner: { js: '/* Generado con «npm run app» desde bot/src. No lo edites a mano. */' } });
  nucleo = r.outputFiles[0].text;
});

interface Op {
  aceptado?: boolean;
  idioma?: string;
  sim?: ReturnType<typeof hyperliquidSimulado>;
  conFeria?: boolean;
  guardadas?: object;
}
async function abrir(op: Op = {}) {
  const sim = op.sim || hyperliquidSimulado();
  const dom = new JSDOM(leer('index.html').replace(/<script src="[^"]+"><\/script>/g, ''), { url: 'https://app.prueba/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window as any;
  // Igual que una etiqueta <script>: lo declarado arriba del todo queda global.
  const correr = (codigo: string) => new Script(codigo).runInContext(dom.getInternalVMContext());
  w.fetch = sim.red;
  w.scrollTo = () => {};
  w.Date.now = () => AHORA;
  if (op.aceptado !== false) w.localStorage.setItem('cardon-pred-aviso', JSON.stringify({ v: '2026-10-12' }));
  w.localStorage.setItem('cardon-pred-idioma', op.idioma || 'es');
  if (op.guardadas) w.localStorage.setItem('cardon-pred-guardadas', JSON.stringify(op.guardadas));
  for (const f of ['config.js', 'i18n.js']) correr(leer(f));
  correr(nucleo);
  if (op.conFeria) {
    // Lo único que cambia al sumar una plataforma: una entrada más en la lista.
    const original = w.NUCLEO.crearPlataformas;
    w.NUCLEO = { ...w.NUCLEO, crearPlataformas: (entorno: any) => [...original(entorno), crearFalsa({ fetch: sim.red, ahora: () => AHORA })] };
  }
  for (const f of ['base.js', 'app.js']) correr(leer(f));
  const d = w.document as Document;
  const q = (s: string) => d.querySelector(s) as HTMLElement;
  const todos = (s: string) => [...d.querySelectorAll(s)] as HTMLElement[];
  const esperar = async (cond: () => unknown, que = 'la condición') => {
    for (let i = 0; i < 200; i++) {
      if (cond()) return;
      await new Promise((r) => setTimeout(r, 5));
    }
    throw new Error(`No llegó: ${que}`);
  };
  const tocar = (e: Element | null | undefined) => {
    if (!e) throw new Error('No encontré qué tocar');
    e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  };
  const chip = (texto: string) => todos('.pm-filtro button').find((b) => b.textContent!.startsWith(texto));
  const preguntas = () => todos('#pm-lista .pm-cab b').map((b) => b.textContent);
  const listo = () => esperar(() => todos('#pm-lista .pm-mercado').length > 0, 'la lista de mercados');
  return { w, d, q, todos, esperar, tocar, chip, preguntas, listo, sim };
}

describe('Interfaz: aviso legal', () => {
  it('es obligatorio al abrir y nada sale a la red antes de aceptarlo', async () => {
    const a = await abrir({ aceptado: false });
    expect(a.q('#aviso')).toBeTruthy();
    expect(a.q('#aviso').textContent).toContain('No es consejo financiero');
    expect(a.q('#aviso').textContent).toContain('Puedes perder todo lo que pongas');
    expect(a.q('#aviso').textContent).toContain('Que sea legal depende de ti');
    expect(a.q('#aviso-cerrar')).toBeNull();
    await new Promise((r) => setTimeout(r, 30));
    expect(a.sim.llamadas).toHaveLength(0);
    const ok = a.q('#aviso-ok') as HTMLButtonElement;
    expect(ok.disabled).toBe(true);
    for (const id of ['av1', 'av2']) {
      (a.q('#' + id) as HTMLInputElement).checked = true;
      a.q('#' + id).dispatchEvent(new a.w.Event('change'));
    }
    expect(ok.disabled).toBe(true);
    (a.q('#av3') as HTMLInputElement).checked = true;
    a.q('#av3').dispatchEvent(new a.w.Event('change'));
    expect(ok.disabled).toBe(false);
    a.tocar(ok);
    expect(a.q('#aviso')).toBeNull();
    await a.listo();
    expect(JSON.parse(a.w.localStorage.getItem('cardon-pred-aviso')).v).toBe('2026-10-12');
  });

  it('se puede volver a leer desde Config, ya con botón de cerrar', async () => {
    const a = await abrir();
    expect(a.q('#aviso')).toBeNull();
    a.tocar(a.q('#ver-aviso'));
    expect(a.q('#aviso .aviso').textContent).toContain('Descargo');
    a.tocar(a.q('#aviso-cerrar'));
    expect(a.q('#aviso')).toBeNull();
  });
});

describe('Interfaz: explorar mercados', () => {
  it('lista los mercados con pregunta, vencimiento, precio de cada lado y creador', async () => {
    const a = await abrir();
    await a.listo();
    expect(a.preguntas()).toHaveLength(14);
    const sol = a.q('[data-mercado="hyperliquid:10999"]');
    expect(sol.querySelector('b')!.textContent).toBe('¿SOL ≥ 109,32 al vencer?');
    expect(sol.textContent).toContain('vence en 6 h 0 min');
    expect(sol.textContent).toContain('creado por Hyperliquid');
    expect(sol.textContent).toContain('SOL ahora 111,69 (+2,16%)');
    const lados = [...sol.querySelectorAll('.pm-lado')].map((l) => l.querySelector('span')!.textContent + ' ' + l.querySelector('b')!.textContent);
    expect(lados).toEqual(['Sí · 98% 0,978', 'No · 2% 0,022']);
    expect(a.q('#pm-estado').textContent).toContain('14 de 14 mercados');
  });

  it('cada filtro muestra cuántos tiene', async () => {
    const a = await abrir();
    await a.listo();
    const textos = a.todos('.pm-filtro button').map((b) => b.textContent);
    for (const t of ['Todas · 14', 'Cripto hoy · 4', 'Cripto mediano plazo · 2', 'Bolsa y materias primas · 3', 'Economía · 5', 'Otros', '★ Guardadas', 'Creador: todos', 'trade.xyz · 5', 'Hyperliquid · 4', 'out · 4', 'skew · 1', 'Precio: todos', 'Menos de 0,50 · 13', 'Menos de 0,10 · 2'])
      expect(textos).toContain(t);
  });

  it('filtra por categoría, creador y precio, y por texto', async () => {
    const a = await abrir();
    await a.listo();
    a.tocar(a.chip('Cripto hoy'));
    expect(a.preguntas()).toHaveLength(4);
    expect(a.chip('Cripto hoy')!.className).toBe('active');
    a.tocar(a.chip('Menos de 0,10'));
    expect(a.preguntas()).toEqual(['¿SOL ≥ 109,32 al vencer?', '¿BTC < 81 334 al vencer?']);
    // Con el filtro de precio solo se ve el lado barato.
    expect(a.todos('[data-mercado="hyperliquid:10999"] .pm-lado span').map((s) => s.textContent)).toEqual(['No · 2%']);
    a.tocar(a.chip('Todas'));
    a.tocar(a.chip('Precio: todos'));
    a.tocar(a.chip('skew'));
    expect(a.preguntas()).toEqual(['¿ETH ≥ 2 311 al vencer?']);
    a.tocar(a.chip('Creador: todos'));
    const buscar = a.q('#pm-buscar') as HTMLInputElement;
    buscar.value = 'anthropic';
    buscar.dispatchEvent(new a.w.Event('input'));
    expect(a.preguntas()).toHaveLength(2);
    buscar.value = 'zzz';
    buscar.dispatchEvent(new a.w.Event('input'));
    expect(a.q('#pm-lista').textContent).toBe('Nada con ese filtro.');
  });

  it('avisa de la comisión doble de un creador externo y de los libros vacíos', async () => {
    const a = await abrir();
    await a.listo();
    expect(a.q('[data-mercado="hyperliquid:11255"]').textContent).toContain('Comisión doble: este mercado lo creó out');
    expect(a.q('[data-mercado="hyperliquid:10231"]').textContent).toContain('Sin ofertas');
    expect(a.q('[data-mercado="hyperliquid:10999"]').textContent).not.toContain('Comisión doble');
  });

  it('enseña el libro de un lado al pedirlo y lo oculta al volver a tocar', async () => {
    const a = await abrir();
    await a.listo();
    const boton = () => a.q('[data-mercado="hyperliquid:10999"] [data-lado="#109990"]');
    expect(boton().textContent).toBe('Ver libro');
    a.tocar(boton());
    await a.esperar(() => a.q('.pm-libro table'), 'el libro');
    const libro = a.q('[data-mercado="hyperliquid:10999"] .pm-libro').textContent!;
    expect(libro).toContain('0,997');
    expect(libro).toContain('1204 u.');
    expect(libro).toContain('el más barato vende a 0,997');
    expect(libro).toContain('el que más paga da 0,960');
    expect(a.sim.llamadas.at(-1)).toEqual({ type: 'l2Book', coin: '#109990' });
    expect(boton().textContent).toBe('Ocultar libro');
    a.tocar(boton());
    expect(a.q('.pm-libro')).toBeNull();
  });

  it('la estrella guarda un mercado, «Guardadas» lo filtra y se recuerda al reabrir', async () => {
    const a = await abrir();
    await a.listo();
    a.tocar(a.q('[data-estrella="hyperliquid:7186"]'));
    expect(a.q('[data-estrella="hyperliquid:7186"]').textContent).toBe('★');
    expect(a.chip('★ Guardadas')!.textContent).toBe('★ Guardadas · 1');
    a.tocar(a.chip('★ Guardadas'));
    expect(a.preguntas()).toEqual(['¿HYPE toca 75 antes del 1 nov?']);
    const b = await abrir({ guardadas: JSON.parse(a.w.localStorage.getItem('cardon-pred-guardadas')) });
    await b.listo();
    expect(b.q('[data-estrella="hyperliquid:7186"]').getAttribute('aria-pressed')).toBe('true');
    b.tocar(b.q('[data-estrella="hyperliquid:7186"]'));
    expect(b.w.localStorage.getItem('cardon-pred-guardadas')).toBe('{}');
  });

  it('una guardada que venció se marca «Ya no está abierto» y se puede quitar', async () => {
    const guardadas = { 'hyperliquid:999': { plataforma: 'hyperliquid', id: '999', pregunta: '¿BTC ≥ 80 000 ayer?', ts: AHORA - 26 * 3_600_000 } };
    const a = await abrir({ guardadas });
    await a.listo();
    a.tocar(a.chip('★ Guardadas'));
    const cerrada = a.q('.pm-cerrado');
    expect(cerrada.textContent).toContain('¿BTC ≥ 80 000 ayer?');
    expect(cerrada.textContent).toContain('Ya no está abierto');
    expect(cerrada.textContent).toContain('Lo guardaste hace 1 d');
    a.tocar(cerrada.querySelector('[data-estrella]'));
    expect(a.q('.pm-cerrado')).toBeNull();
    expect(a.q('#pm-lista').textContent).toContain('Aún no guardas ninguno');
  });

  it('si Hyperliquid falla, muestra el error real; al volver, se recupera', async () => {
    const sim = hyperliquidSimulado({ caido: true });
    const a = await abrir({ sim });
    await a.esperar(() => a.q('.pm-error'), 'el error');
    expect(a.q('.pm-error').textContent).toContain('Hyperliquid no respondió: Hyperliquid respondió HTTP 502');
    sim.estado.caido = false;
    a.tocar(a.q('#pm-actualizar'));
    await a.listo();
    expect(a.q('.pm-error')).toBeNull();
    // Y si cae después, se conservan los últimos datos con el aviso.
    sim.estado.caido = true;
    a.tocar(a.q('#pm-actualizar'));
    await a.esperar(() => a.q('.pm-error'), 'el error');
    expect(a.q('.pm-error').textContent).toContain('Se muestran los últimos datos que llegaron');
    expect(a.preguntas()).toHaveLength(14);
  });

  it('escapa todo texto que viene de fuera', async () => {
    const malo = '<img src=x onerror="window.pwn=1">';
    const meta = { outcomes: [{ outcome: 5, name: malo, description: malo, sideSpecs: [{ name: malo }, { name: 'No' }], venue: malo }], questions: [] };
    const a = await abrir({ sim: hyperliquidSimulado({ meta, precios: { '#50': '0.4', '#51': '0.6' } }) });
    await a.listo();
    expect(a.d.querySelector('#pm-lista img')).toBeNull();
    expect(a.d.querySelector('.pm-filtro img')).toBeNull();
    expect(a.q('.pm-mercado b').textContent).toContain(malo);
    expect(a.w.pwn).toBeUndefined();
  });
});

describe('Interfaz: configuración', () => {
  it('Plataformas muestra hoy solo Hyperliquid y el filtro de plataforma queda oculto', async () => {
    const a = await abrir();
    await a.listo();
    expect(a.todos('#plataformas .pm-plataforma b').map((b) => b.textContent)).toEqual(['Hyperliquid']);
    expect(a.q('#plataformas').textContent).toContain('billetera de agente');
    expect(a.q('#pm-plataformas').hidden).toBe(true);
  });

  it('con una plataforma más (la de ejemplo) aparece sola en Config, en el filtro y en la lista', async () => {
    const a = await abrir({ conFeria: true });
    await a.listo();
    expect(a.todos('#plataformas .pm-plataforma b').map((b) => b.textContent)).toEqual(['Hyperliquid', 'Feria']);
    expect(a.q('#pm-plataformas').hidden).toBe(false);
    expect(a.todos('#pm-plataformas button').map((b) => b.textContent)).toEqual(['Plataforma: todas', 'Hyperliquid · 14', 'Feria · 2']);
    a.tocar(a.chip('Feria · 2'));
    expect(a.preguntas()).toEqual(['¿Llueve el domingo en la feria?', '¿Sale el 7 en la tómbola?']);
    expect(a.q('[data-mercado="feria:lluvia"]').textContent).toContain('Feria');
    a.tocar(a.q('[data-mercado="feria:tombola"] [data-lado="tombola-si"]'));
    await a.esperar(() => a.q('.pm-libro table'), 'el libro de la Feria');
    expect(a.q('.pm-libro').textContent).toContain('0,080');
  });

  it('cambia entre los 4 temas de color', async () => {
    const a = await abrir();
    expect(a.todos('#temas .theme-opt').map((b) => b.getAttribute('data-tema'))).toEqual(['noche', 'atardecer', 'oasis', 'arena']);
    expect(a.d.documentElement.getAttribute('data-theme')).toBe('noche');
    a.tocar(a.q('[data-tema="arena"]'));
    expect(a.d.documentElement.getAttribute('data-theme')).toBe('arena');
    expect(a.w.localStorage.getItem('cardon-pred-tema')).toBe('arena');
    expect(a.q('[data-tema="arena"]').className).toContain('active');
  });

  it('cambia a inglés: textos fijos, filtros y preguntas', async () => {
    const a = await abrir();
    await a.listo();
    a.tocar(a.q('[data-idioma="en"]'));
    await a.esperar(() => a.preguntas()[0] === 'SOL ≥ 109.32 at expiry?', 'las preguntas en inglés');
    expect(a.q('.topbar .eyebrow').textContent).toBe('PREDICTION MARKETS AGENT');
    expect(a.chip('Crypto today')!.textContent).toBe('Crypto today · 4');
    expect(a.chip('Under 0.50')).toBeTruthy();
    expect(a.q('[data-mercado="hyperliquid:10999"]').textContent).toContain('expires in 6 h 0 min');
    expect(a.d.documentElement.lang).toBe('en');
    expect(a.w.localStorage.getItem('cardon-pred-idioma')).toBe('en');
  });

  it('donaciones: las tres direcciones y la firma bajo «¡Gracias!»', async () => {
    const a = await abrir();
    expect(a.todos('#donar .address').map((c) => c.textContent)).toEqual(['0xAC43f9b0E7F0ae6386cfC8ef6BFf62CE9c3006A1', 'bc1qd9j45f4t0jwyhjhqh2kvz2cr7k8xye460rr2y7', '447gTj6Hg6gaAEAUmjqfhqDZr1PziUTvbT4LYLpmLVnTNVFK6cqeqPfh6P4neMKLWX5jDXAr94fWHacJwDvjmCzBBH8wPBt']);
    const firma = a.q('#firma');
    expect(firma.textContent).toBe('Hecho xhumanx + IA');
    expect(firma.previousElementSibling!.textContent).toContain('¡Gracias!');
    a.tocar(a.q('[data-idioma="en"]'));
    expect(a.q('#firma').textContent).toBe('Hecho xhumanx + IA');
  });

  it('la barra de abajo cambia de pantalla', async () => {
    const a = await abrir();
    a.tocar(a.q('.nav [data-target="config"]'));
    expect(a.q('#config').className).toContain('active');
    expect(a.q('#mercados').className).not.toContain('active');
  });
});

describe('Lo que se empaqueta en la app', () => {
  it('nucleo.js está al día con bot/src', () => {
    expect(leer('nucleo.js')).toBe(nucleo);
  });

  it('la app Android lleva exactamente la misma interfaz', () => {
    const android = new URL('../../app/android/app/src/main/assets/web/', import.meta.url);
    for (const f of ['index.html', 'app.js', 'base.js', 'i18n.js', 'nucleo.js', 'style.css', 'config.js']) expect(readFileSync(new URL(f, android), 'utf8'), f).toBe(leer(f));
  });

  it('la edición pública no lleva datos de nadie', () => {
    expect(leer('config.js')).toContain("api: ''");
    for (const f of ['index.html', 'app.js', 'base.js', 'i18n.js', 'nucleo.js', 'config.js']) {
      expect(leer(f), f).not.toMatch(/0x1c22/i);
      expect(leer(f), f).not.toMatch(/workers\.dev/);
    }
  });
});
