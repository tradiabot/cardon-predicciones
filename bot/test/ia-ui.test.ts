// Las pantallas nuevas: colores de subida y bajada, mercados globales, «Analizar», panel de IA y semáforo.
import { describe, expect, it } from 'vitest';
import { almacenMemoria } from '../src/almacen';
import { crearAgente } from '../src/worker';
import { iaSimulada, redCompleta, voto } from './ia-simulada';
import { abrir } from './pantalla';
import { AHORA, hyperliquidSimulado } from './simulada';
import { telefonoSimulado } from './telefono';

const URL_AGENTE = 'https://cardon-predicciones.cardon-abc123.workers.dev';
const CLAVE_GROQ = 'gsk_' + 'a'.repeat(40) + '6tQF';
const PLATA = '[data-mercado="hyperliquid:10464"]';

async function sinNube(guion: Parameters<typeof iaSimulada>[0] = {}, porDefecto?: Parameters<typeof iaSimulada>[1], op: Parameters<typeof abrir>[0] = {}) {
  const sim = op.sim || hyperliquidSimulado();
  const ia = iaSimulada(guion, porDefecto);
  const a = await abrir({ sim, red: redCompleta(sim, ia), ...op });
  return { ...a, ia };
}

// Una app ya conectada a su nube: el agente de verdad, con Hyperliquid y las IA simuladas.
async function conNube(porDefecto?: Parameters<typeof iaSimulada>[1], version?: string) {
  const tel = await telefonoSimulado();
  const sim = hyperliquidSimulado();
  const ia = iaSimulada({}, porDefecto);
  const almacen = almacenMemoria();
  const agente = crearAgente({ fetch: redCompleta(sim, ia), ahora: () => AHORA, almacen });
  const env = { DEVICE_PUBLIC_KEY: tel.publica, ADMIN_TOKEN: 'respaldo-muy-largo' } as any;
  const pedidos: { ruta: string; cuerpo: string }[] = [];
  const red = redCompleta(sim, ia, (url, init) => {
    if (!url.startsWith(URL_AGENTE)) return null;
    pedidos.push({ ruta: url.slice(URL_AGENTE.length), cuerpo: String(init?.body || '') });
    if (version && url.endsWith('/salud')) return Promise.resolve(new Response(JSON.stringify({ ok: true, version }), { status: 200 }));
    return agente.fetch(new Request(url, init), env);
  });
  const movil = { permiso: true };
  const nativo = (w: any) => ({
    huellaEstado: () => JSON.stringify({ disponible: true, publica: tel.publica }),
    firmar: (mensaje: string) => {
      tel.firmar(mensaje).then((firma) => w.onHuella(JSON.stringify({ mensaje, firma })));
      return JSON.stringify({ pendiente: true });
    },
    guardarNube: () => {},
    guardarVigiladas: () => {},
    avisosEstado: () => JSON.stringify({ permiso: movil.permiso, estado: 'ok', ts: AHORA }),
  });
  const a = await abrir({ sim, red, nativo, local: { 'cardon-pred-api': URL_AGENTE + '/api/v1' } });
  a.tocar(a.q('.nav [data-target="config"]'));
  a.tocar(a.q('#nube-entrar'));
  await a.esperar(() => a.q('#nube-salir'), 'la sesión con huella');
  await a.esperar(() => a.q('#ia [data-proveedor="groq"]'), 'los ajustes de IA del agente');
  return { ...a, ia, almacen, pedidos, movil };
}

describe('Interfaz: colores de subida y bajada', () => {
  it('cada lado dice cuánto cambió hoy: verde si subió, rojo si bajó', async () => {
    const a = await sinNube();
    await a.listo();
    const [si, no] = [...a.q('[data-mercado="hyperliquid:10999"]').querySelectorAll('.pm-lado')];
    expect(si.querySelector('.sube')!.textContent).toBe('▲ +5,0 puntos hoy');
    expect(no.querySelector('.baja')!.textContent).toBe('▼ -5,0 puntos hoy');
    expect(a.q('[data-mercado="hyperliquid:10999"] small .baja').textContent).toBe('▼ -0,46 % hoy');
    expect(a.q('[data-mercado="hyperliquid:11002"] small .sube').textContent).toBe('▲ +4,87 % hoy');
  });

  it('si no llega el precio de ayer, los mercados se ven igual, sin colores', async () => {
    const a = await sinNube({}, undefined, { sim: hyperliquidSimulado({ sinAyer: true }) });
    await a.listo();
    expect(a.preguntas()).toHaveLength(14);
    expect(a.todos('#pm-lista .sube, #pm-lista .baja')).toHaveLength(0);
  });

  it('los colores del semáforo son los mismos en los cuatro temas', async () => {
    const css = (await import('./pantalla')).leer('style.css');
    expect(css).toMatch(/--verde: #35d07f;[\s\S]*--ambar: #f0b93a;[\s\S]*--rojo: #ff5c6c;/);
    expect(css).toMatch(/\.sube \{\s*color: var\(--verde\);/);
    expect(css).toMatch(/\.baja \{\s*color: var\(--rojo\);/);
  });
});

describe('Interfaz: mercados globales', () => {
  it('la pestaña Global muestra el semáforo, sus razones y cada precio con su cambio', async () => {
    const a = await sinNube();
    a.tocar(a.q('.nav [data-target="global"]'));
    await a.esperar(() => a.q('#g-lista .g-celda'), 'los mercados globales');
    expect(a.q('#global').classList.contains('active')).toBe(true);
    expect(a.q('#g-semaforo .luz').className).toBe('luz verde');
    expect(a.q('#g-semaforo b').textContent).toBe('Verde: el mercado tiene apetito');
    expect(a.todos('#g-semaforo li').map((l) => l.textContent)).toEqual(['S&P 500 (EE. UU.) +1,00 % ▲', 'Nasdaq 100 (tecnología) +0,32 %', 'Bitcoin +3,00 % ▲', 'Miedo y codicia (cripto) 72/100 ▲']);
    expect(a.todos('#g-lista .panel-title').map((t) => t.textContent)).toEqual(['Cripto', 'Bolsa', 'Materias primas', 'Divisas', 'Ánimo']);
    const btc = a.q('[data-ind="btc"]');
    expect(btc.querySelector('b')!.textContent).toBe('82.400 USD');
    expect(btc.querySelector('.sube')!.textContent).toBe('▲ +3,00 %');
    expect(a.q('[data-ind="petroleo"] .baja').textContent).toBe('▼ -2,20 %');
    expect(a.q('[data-ind="eur"] .igual').textContent).toBe('0,00 %');
    expect(a.q('[data-ind="hype"] em').textContent).toBe('');
    expect(a.q('[data-ind="animo"] b').textContent).toBe('72 /100');
    expect(a.q('#g-estado').textContent).toContain('Precios públicos de Hyperliquid');
  });

  it('en rojo cuando todo cae', async () => {
    const a = await sinNube();
    a.tocar(a.q('.nav [data-target="global"]'));
    await a.esperar(() => a.q('#g-semaforo .luz.verde'), 'la primera lectura');
    a.ia.estado.animo = 20;
    const original = a.w.fetch;
    a.w.fetch = async (u: string, init: RequestInit) => {
      const r = await original(u, init);
      const c = JSON.parse(String(init?.body || '{}'));
      if (c.type !== 'metaAndAssetCtxs') return r;
      const d = await r.json();
      for (const x of d[1]) x.prevDayPx = String(Number(x.midPx) * 1.05);
      return new Response(JSON.stringify(d), { status: 200 });
    };
    a.tocar(a.q('#g-actualizar'));
    await a.esperar(() => a.q('#g-semaforo .luz.rojo'), 'el semáforo en rojo');
    expect(a.q('#g-semaforo b').textContent).toBe('Rojo: hay miedo');
    expect(a.q('[data-ind="btc"] .baja').textContent).toBe('▼ -4,76 %');
  });

  it('si no llegan, enseña el error real y no inventa precios', async () => {
    const a = await abrir({ sim: hyperliquidSimulado({ caido: true }) });
    a.tocar(a.q('.nav [data-target="global"]'));
    await a.esperar(() => a.q('#g-semaforo').textContent!.includes('No llegó'), 'el error');
    expect(a.q('#g-semaforo').textContent).toContain('Cripto: HTTP 502');
    expect(a.todos('#g-lista .g-celda')).toHaveLength(0);
  });

  it('en inglés', async () => {
    const a = await sinNube({}, undefined, { idioma: 'en' });
    expect(a.q('.nav [data-target="global"] small').textContent).toBe('Global');
    a.tocar(a.q('.nav [data-target="global"]'));
    await a.esperar(() => a.q('#g-lista .g-celda'), 'global markets');
    expect(a.q('#g-semaforo b').textContent).toBe('Green: the market has appetite');
    expect(a.q('[data-ind="petroleo"] span').textContent).toBe('WTI crude oil');
  });
});

describe('Interfaz: analizar con IA', () => {
  it('sin nube funciona con Kilo, gratis y sin clave: dos IA opinan y sale el semáforo', async () => {
    const a = await sinNube();
    await a.listo();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    expect(a.q(PLATA + ' .ia-res').textContent).toContain('Las IA están leyendo el mercado');
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'el análisis');
    const r = a.q(PLATA + ' .ia-res');
    expect(r.getAttribute('data-color')).toBe('verde');
    expect(r.querySelector('.luz')!.className).toBe('luz verde');
    expect(r.querySelector('b')!.textContent).toBe('Comprar «Sí»');
    expect(r.querySelector('.pill')!.textContent).toBe('confianza 70 %');
    expect(r.textContent).toContain('La IA cree que «Sí» gana con 62 %. El precio medio dice 50 %. Comprar «Sí» cuesta ahora 0,507 por unidad. Ventaja de «Sí»: +11,3 puntos.');
    expect(r.textContent).toContain('La plata lleva días firme');
    expect(r.textContent).toContain('Coinciden 2 de 2 IA.');
    expect([...r.querySelectorAll('.ia-votos li')].map((l) => l.textContent)).toEqual(['nemotron-3-super-120b-a12b · Kilo: comprar «Sí» (70)', 'nemotron-3-ultra-550b-a55b · Kilo: comprar «Sí» (70)']);
    expect(r.textContent).toContain('no un consejo financiero');
    expect(a.ia.llamadas.map((l) => [l.url, l.clave])).toEqual([['https://api.kilo.ai/api/gateway/chat/completions', null], ['https://api.kilo.ai/api/gateway/chat/completions', null]]);
    expect(a.q(PLATA + ' [data-analizar]').textContent).toBe('Analizar otra vez');
  });

  it('en la app instalada, Kilo se llama por la app Android (el navegador no puede)', async () => {
    const sim = hyperliquidSimulado();
    const ia = iaSimulada();
    const nativas: string[][] = [];
    const a = await abrir({
      sim,
      red: redCompleta(sim, ia),
      nativo: (w: any) => ({
        http: (id: string, metodo: string, url: string, cab: string, cuerpo: string) => {
          nativas.push([metodo, url]);
          ia.red(url, { method: metodo, headers: JSON.parse(cab), body: cuerpo }).then(async (r) => w.onNativeHttp(id, r.status, await r.text()));
        },
      }),
    });
    await a.listo();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'el análisis');
    expect(nativas).toEqual([['POST', 'https://api.kilo.ai/api/gateway/chat/completions'], ['POST', 'https://api.kilo.ai/api/gateway/chat/completions']]);
    expect(a.q(PLATA + ' .ia-res b').textContent).toBe('Comprar «Sí»');
  });

  it('«no entrar» sale en rojo y el freno del sistema se explica', async () => {
    const a = await sinNube({}, voto({ probabilidad: 55, confianza: 90 }));
    await a.listo();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'el análisis');
    const r = a.q(PLATA + ' .ia-res');
    expect(r.getAttribute('data-color')).toBe('rojo');
    expect(r.querySelector('b')!.textContent).toBe('No entrar');
    expect(r.querySelector('.pm-aviso')!.textContent).toBe('La IA se inclinaba por «Sí», pero a lo que cuesta comprarlo no queda ventaja suficiente para cubrir comisiones: mejor no entrar.');
  });

  it('lo que escribe la IA se escapa antes de pintarlo', async () => {
    const malo = '<img src=x onerror="window.pwn=1">';
    const a = await sinNube({}, voto({ motivo: malo }));
    await a.listo();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'el análisis');
    expect(a.d.querySelector('.ia-res img')).toBeNull();
    expect(a.q(PLATA + ' .ia-res').textContent).toContain(malo);
    expect(a.w.pwn).toBeUndefined();
  });

  it('si las IA fallan, muestra el motivo real y deja reintentar', async () => {
    const a = await sinNube({}, { status: 500, cuerpo: { error: { message: 'caída <b>total</b>' } } });
    await a.listo();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res.pm-aviso'), 'el error');
    expect(a.q(PLATA + ' .ia-res').textContent).toContain('La IA no pudo opinar: nemotron-3-super-120b-a12b · Kilo: Kilo HTTP 500: caída <b>total</b>');
    expect(a.d.querySelector('.ia-res b')).toBeNull();
    a.ia.estado.porDefecto = voto();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'el análisis al reintentar');
  });

  it('analizar no guarda claves ni manda nada tuyo: solo datos del mercado', async () => {
    const a = await sinNube();
    await a.listo();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'el análisis');
    const enviado = JSON.parse(a.ia.llamadas[0].cuerpo.messages[1].content);
    expect(Object.keys(enviado).sort()).toEqual(['activo', 'comision_doble', 'global', 'horas_para_vencer', 'lados', 'pregunta', 'regla', 'sin_ofertas', 'volumen_del_dia']);
    expect(a.sim.llamadas.every((c) => ['outcomeMeta', 'allMids', 'spotMetaAndAssetCtxs', 'metaAndAssetCtxs', 'candleSnapshot', 'l2Book'].includes(c.type))).toBe(true);
  });

  it('en inglés', async () => {
    const a = await sinNube({}, voto({ lado: 'Yes', motivo: 'Silver has been firm for days.' }), { idioma: 'en' });
    await a.listo();
    expect(a.q(PLATA + ' [data-analizar]').textContent).toBe('🤖 Analyze with AI');
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'the analysis');
    expect(a.q(PLATA + ' .ia-res b').textContent).toBe('Buy “Yes”');
    expect(a.ia.llamadas[0].cuerpo.messages[0].content).toContain('en inglés');
  });

  it('con tu nube, el análisis lo hace tu agente con las IA que configuraste', async () => {
    const a = await conNube();
    a.tocar(a.q('.nav [data-target="mercados"]'));
    await a.listo();
    a.tocar(a.q(PLATA + ' [data-analizar]'));
    await a.esperar(() => a.q(PLATA + ' .ia-res .luz'), 'el análisis');
    expect(a.q(PLATA + ' .ia-res b').textContent).toBe('Comprar «Sí»');
    expect(a.pedidos.filter((p) => p.ruta.startsWith('/api/v1/ia/analizar'))).toEqual([{ ruta: '/api/v1/ia/analizar?idioma=es', cuerpo: '{"plataforma":"hyperliquid","mercado":"10464"}' }]);
  });
});

describe('Interfaz: Config → IA', () => {
  it('sin nube explica que usa Kilo gratis y deja probarla', async () => {
    const a = await sinNube({}, '{"ok":true}');
    a.tocar(a.q('.nav [data-target="config"]'));
    expect(a.q('#ia .pill').textContent).toBe('KILO · GRATIS');
    expect(a.q('#ia').textContent).toContain('gratis, sin cuenta y sin clave');
    expect(a.q('#ia input')).toBeNull();
    a.tocar(a.q('#ia-probar'));
    await a.esperar(() => a.todos('#ia .ia-votos li').length === 2, 'la prueba');
    expect(a.todos('#ia .ia-votos li').every((l) => l.querySelector('.luz.verde') && /respondió en/.test(l.textContent!))).toBe(true);
  });

  it('con nube lista los seis proveedores y guarda una clave: vuelve recortada y no queda en el teléfono', async () => {
    const a = await conNube('{"ok":true}');
    expect(a.todos('#ia [data-proveedor]').map((p) => p.getAttribute('data-proveedor'))).toEqual(['kilo', 'groq', 'google', 'openrouter', 'cerebras', 'mistral']);
    expect(a.q('#ia [data-proveedor="kilo"] .pill').textContent).toBe('no pide clave');
    expect(a.q('#ia [data-proveedor="groq"] .pill').textContent).toBe('sin clave');
    expect(a.q('#ia [data-proveedor="groq"] [data-copiar]').getAttribute('data-copiar')).toBe('https://console.groq.com/keys');
    a.escribir('[data-clave-de="groq"]', CLAVE_GROQ);
    a.tocar(a.q('[data-guardar-clave="groq"]'));
    await a.esperar(() => a.q('#ia [data-proveedor="groq"] .pill').textContent === 'clave gsk_…6tQF', 'la clave recortada');
    expect(a.q('#ia-nota').textContent).toBe('Clave guardada: gsk_…6tQF');
    expect((a.q('[data-clave-de="groq"]') as HTMLInputElement).value).toBe('');
    expect(a.d.body.innerHTML).not.toContain(CLAVE_GROQ);
    expect(JSON.stringify({ ...a.w.localStorage })).not.toContain(CLAVE_GROQ);
    expect([...a.almacen.datos.values()].join(' ')).not.toContain(CLAVE_GROQ);
    expect(a.todos('#ia .ia-modelo span').map((s) => s.textContent)).toEqual(['1. qwen3.8-27b · Groq', '2. nemotron-3-super-120b-a12b · Kilo', '3. nemotron-3-ultra-550b-a55b · Kilo']);
    expect(a.q('#ia .pill').textContent).toBe('3 MODELOS');
    a.tocar(a.q('[data-quitar-clave="groq"]'));
    await a.esperar(() => a.q('#ia [data-proveedor="groq"] .pill').textContent === 'sin clave', 'quitar la clave');
    expect(a.todos('#ia .ia-modelo')).toHaveLength(2);
  });

  it('una clave mal copiada se rechaza con el motivo', async () => {
    const a = await conNube();
    a.escribir('[data-clave-de="groq"]', 'corta');
    a.tocar(a.q('[data-guardar-clave="groq"]'));
    await a.esperar(() => a.q('#ia-nota').textContent, 'el aviso');
    expect(a.q('#ia-nota').textContent).toBe('La clave de Groq no tiene buena forma: cópiala entera, sin espacios.');
  });

  it('ordena, quita y añade modelos, y ajusta el consenso', async () => {
    const a = await conNube();
    a.tocar(a.q('[data-subir-modelo="kilo:nvidia/nemotron-3-ultra-550b-a55b:free"]'));
    await a.esperar(() => a.q('#ia .ia-modelo span').textContent === '1. nemotron-3-ultra-550b-a55b · Kilo', 'el nuevo orden');
    a.tocar(a.q('[data-quitar-modelo="kilo:nvidia/nemotron-3-super-120b-a12b:free"]'));
    await a.esperar(() => a.todos('#ia .ia-modelo').length === 1, 'quitar un modelo');
    expect(a.q('[data-quitar-modelo]')).toBeNull(); // siempre queda al menos uno
    a.tocar(a.q('[data-anadir-modelo="kilo:nvidia/nemotron-3-super-120b-a12b:free"]'));
    await a.esperar(() => a.todos('#ia .ia-modelo').length === 2, 'añadir un modelo');
    expect(a.q('#ia-consenso').textContent).toBe('Consenso activado');
    a.tocar(a.q('#ia-consenso'));
    await a.esperar(() => a.q('#ia-consenso').textContent === 'Consenso desactivado', 'apagar el consenso');
    a.tocar(a.q('[data-consenso-n="4"]'));
    await a.esperar(() => a.q('[data-consenso-n="4"]').classList.contains('active'), 'consenso de 4');
    expect(await a.almacen.leer('ia_config')).toEqual({ modelos: ['kilo:nvidia/nemotron-3-ultra-550b-a55b:free', 'kilo:nvidia/nemotron-3-super-120b-a12b:free'], consenso: { activo: false, tamano: 4 } });
  });
});

describe('Interfaz: semáforo', () => {
  const luces = (a: Awaited<ReturnType<typeof abrir>>) => Object.fromEntries(a.todos('#semaforo .sem-fila').map((f) => [f.getAttribute('data-luz'), [f.getAttribute('data-color'), f.querySelector('small')!.textContent]]));

  it('cuatro luces: mercados, nube, IA y avisos, cada una con qué hacer', async () => {
    const a = await sinNube({}, '{"ok":true}');
    await a.listo();
    a.tocar(a.q('.nav [data-target="config"]'));
    expect(luces(a)).toEqual({
      mercados: ['verde', '14 mercados leídos hace un momento.'],
      nube: ['amarillo', 'Sin instalar. Explorar y la IA gratis funcionan igual.'],
      ia: ['amarillo', 'Aún sin probar. Toca «Revisar ahora».'],
      avisos: ['amarillo', 'Solo funcionan en la app instalada.'],
    });
    a.tocar(a.q('#sem-revisar'));
    await a.esperar(() => luces(a).ia[0] === 'verde', 'la IA en verde');
    expect(luces(a).ia[1]).toBe('Respondió hace un momento.');
  });

  it('en rojo dice el error real: Hyperliquid caído e IA caída', async () => {
    const sim = hyperliquidSimulado({ caido: true });
    const a = await sinNube({}, { status: 500, cuerpo: { error: { message: 'caída' } } }, { sim });
    await a.esperar(() => a.q('#pm-errores .pm-error'), 'el error de mercados');
    a.tocar(a.q('.nav [data-target="config"]'));
    a.tocar(a.q('#sem-revisar'));
    await a.esperar(() => luces(a).ia[0] === 'rojo', 'la IA en rojo');
    expect(luces(a).mercados).toEqual(['rojo', 'Hyperliquid respondió HTTP 502 Revisa tu conexión y toca «Revisar ahora».']);
    expect(luces(a).ia[1]).toBe('Falló hace un momento: Kilo HTTP 500: caída');
    sim.estado.caido = false;
    a.ia.estado.porDefecto = '{"ok":true}';
    a.tocar(a.q('#sem-revisar'));
    await a.esperar(() => luces(a).ia[0] === 'verde' && luces(a).mercados[0] === 'verde', 'todo en verde otra vez');
  });

  it('con nube: conectada, IA según tu agente y avisos según el permiso', async () => {
    const a = await conNube('{"ok":true}');
    await a.esperar(() => luces(a).nube[1].includes('1.0.0'), 'la versión de la nube');
    expect(luces(a).nube).toEqual(['verde', 'Conectada (versión 1.0.0).']);
    expect(luces(a).avisos).toEqual(['verde', 'Activados.']);
    a.tocar(a.q('#sem-revisar'));
    await a.esperar(() => luces(a).ia[0] === 'verde', 'la IA en verde');
    expect(a.pedidos.some((p) => p.ruta === '/api/v1/ia/probar')).toBe(true);
    a.movil.permiso = false;
    a.tocar(a.q('.nav [data-target="mercados"]'));
    a.tocar(a.q('.nav [data-target="config"]'));
    expect(luces(a).avisos).toEqual(['rojo', 'Sin permiso. Toca «Activar avisos» más abajo.']);
  });

  it('avisa si tu nube es de una versión anterior a la app', async () => {
    const a = await conNube('{"ok":true}', '0.2.0');
    await a.esperar(() => luces(a).nube[0] === 'amarillo' && luces(a).nube[1].includes('0.2.0'), 'el aviso de versión');
    expect(luces(a).nube[1]).toBe('Conectada, pero tu nube es la versión 0.2.0 y la app la 1.0.0. Toca «Reinstalar o actualizar» en Mi nube.');
  });

  it('sin sesión pide entrar con huella', async () => {
    const a = await abrir({ local: { 'cardon-pred-api': URL_AGENTE + '/api/v1' } });
    a.tocar(a.q('.nav [data-target="config"]'));
    expect(luces(a).nube).toEqual(['amarillo', 'Sin sesión. Toca «Entrar con huella» en Mi nube.']);
  });
});
