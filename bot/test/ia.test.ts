// IA: proveedores, análisis con consenso, frenos del sistema, claves cifradas y rutas del agente.
import { describe, expect, it } from 'vitest';
import { almacenMemoria } from '../src/almacen';
import { leerGlobal } from '../src/global';
import { analizar, ErrorAnalisis, juntarVotos, leerVoto, type Voto } from '../src/ia/analizar';
import { cambiarIA, leerClaves, vistaIA } from '../src/ia/config';
import { ErrorIA, esperaMs, etiquetaModelo, MODELOS_SIN_CLAVE, partirModelo, preguntar, recortar } from '../src/ia/proveedores';
import { crearHyperliquid } from '../src/plataformas/hyperliquid';
import { crearAgente } from '../src/worker';
import { iaSimulada, redCompleta, voto } from './ia-simulada';
import { AHORA, hyperliquidSimulado } from './simulada';
import { telefonoSimulado } from './telefono';

const [SUPER, ULTRA] = MODELOS_SIN_CLAVE;
const GROQ = 'groq:qwen/qwen3.8-27b';
const CLAVE_GROQ = 'gsk_' + 'a'.repeat(40) + '6tQF';
const MSJ = [{ role: 'user' as const, content: 'hola' }];

async function escena(guion: Parameters<typeof iaSimulada>[0] = {}, porDefecto?: Parameters<typeof iaSimulada>[1]) {
  const sim = hyperliquidSimulado();
  const ia = iaSimulada(guion, porDefecto);
  const red = redCompleta(sim, ia);
  const hl = crearHyperliquid({ fetch: red, ahora: () => AHORA });
  const mercados = (await hl.listarMercados()).mercados;
  const de = (id: string) => mercados.find((m) => m.id === id)!;
  const pedir = (id: string, mas: Partial<Parameters<typeof analizar>[0]> = {}) =>
    analizar({ entorno: { fetch: red, ahora: () => AHORA }, mercado: de(id), plataforma: hl, claves: {}, modelos: MODELOS_SIN_CLAVE, consenso: { activo: true, tamano: 2 }, ...mas });
  return { sim, ia, red, hl, de, pedir };
}
const PLATA = '10464'; // Sí 0,503 · No 0,497, sin comisión doble
const ETH = '10231'; // libro vacío
const PETROLEO = '11255'; // comisión doble, Sí 0,232

describe('Proveedores de IA', () => {
  it('Kilo no pide clave y va con 4096 tokens de margen', async () => {
    const ia = iaSimulada({}, '{"ok":true}');
    expect(await preguntar({ fetch: ia.red }, SUPER, {}, MSJ)).toBe('{"ok":true}');
    expect(ia.llamadas[0]).toMatchObject({ url: 'https://api.kilo.ai/api/gateway/chat/completions', clave: null, modelo: 'nvidia/nemotron-3-super-120b-a12b:free' });
    expect(ia.llamadas[0].cuerpo).toMatchObject({ max_tokens: 4096, response_format: { type: 'json_object' } });
  });

  it('los demás van con su clave, y sin clave no se llama a nadie', async () => {
    const ia = iaSimulada({}, '{"ok":true}');
    await preguntar({ fetch: ia.red }, GROQ, { groq: CLAVE_GROQ }, MSJ);
    expect(ia.llamadas[0]).toMatchObject({ url: 'https://api.groq.com/openai/v1/chat/completions', clave: 'Bearer ' + CLAVE_GROQ });
    await expect(preguntar({ fetch: ia.red }, GROQ, {}, MSJ)).rejects.toThrow('falta la clave de Groq');
    expect(ia.llamadas).toHaveLength(1);
  });

  it('con «límite agotado» (429) dice hasta cuándo descansar', async () => {
    const groq = iaSimulada({}, { status: 429, cuerpo: { error: { message: 'Rate limit reached (TPD). Please try again in 2m30s.' } } });
    const e: ErrorIA = await preguntar({ fetch: groq.red, ahora: () => AHORA }, GROQ, { groq: CLAVE_GROQ }, MSJ).catch((x) => x);
    expect(e).toBeInstanceOf(ErrorIA);
    expect(e.pausaHasta).toBe(AHORA + 150_000);
    const otro: ErrorIA = await preguntar({ fetch: iaSimulada({}, { status: 429 }).red, ahora: () => AHORA }, SUPER, {}, MSJ).catch((x) => x);
    expect(otro.pausaHasta).toBe(AHORA + 600_000);
    expect(esperaMs('try again in 44.4s')).toBe(44_400);
  });

  it('una clave rechazada o una respuesta vacía dan el motivo real, sin enseñar la clave', async () => {
    const mala: Error = await preguntar({ fetch: iaSimulada({}, { status: 401, cuerpo: { error: { message: 'Invalid API Key' } } }).red }, GROQ, { groq: CLAVE_GROQ }, MSJ).catch((x) => x);
    expect(mala.message).toBe('Groq rechazó la clave (HTTP 401)');
    expect(mala.message).not.toContain(CLAVE_GROQ);
    await expect(preguntar({ fetch: iaSimulada({}, '<think>mmm</think>').red }, SUPER, {}, MSJ)).rejects.toThrow('Kilo respondió vacío');
    const sinRed = (async () => {
      throw new Error('sin conexión');
    }) as unknown as typeof fetch;
    await expect(preguntar({ fetch: sinRed }, SUPER, {}, MSJ)).rejects.toThrow('Kilo no respondió: sin conexión');
  });

  it('nombres cortos y claves recortadas', () => {
    expect(etiquetaModelo(SUPER)).toBe('nemotron-3-super-120b-a12b · Kilo');
    expect(etiquetaModelo('google:gemini-3.7-flash')).toBe('gemini-3.7-flash · Google');
    expect(partirModelo('inventado:x')).toBeNull();
    expect(recortar(CLAVE_GROQ)).toBe('gsk_…6tQF');
    expect(recortar('corta')).toBe('…');
  });
});

describe('Analizar un mercado', () => {
  it('dos IA coinciden en comprar con ventaja: semáforo verde', async () => {
    const e = await escena();
    const { analisis: a, pausas } = await e.pedir(PLATA);
    expect(a).toMatchObject({ plataforma: 'hyperliquid', mercado: PLATA, sugerencia: 'COMPRAR', lado: '#104640', lado_nombre: 'Sí', primer_lado: 'Sí', probabilidad: 62, precio: 50.3, costo: 0.50655, ventaja: 11.3, confianza: 70, color: 'verde', freno: null, acuerdo: { a_favor: 2, total: 2 }, ts: AHORA });
    expect(a.votos.map((v) => v.modelo)).toEqual([SUPER, ULTRA]);
    expect(pausas).toEqual({});
  });

  it('a la IA solo le llegan datos públicos del mercado, con historia y contexto global', async () => {
    const e = await escena();
    await e.pedir('10999', { global: await leerGlobal({ fetch: e.red, ahora: () => AHORA }) });
    const [sistema, usuario] = e.ia.llamadas[0].cuerpo.messages;
    expect(sistema.content).toContain('PRIMER lado ("Sí")');
    expect(sistema.content).toContain('en español');
    const ctx = JSON.parse(usuario.content);
    expect(ctx).toMatchObject({ pregunta: '¿SOL ≥ 109,32 al vencer?', horas_para_vencer: 6, comision_doble: false, sin_ofertas: false, volumen_del_dia: 241 });
    expect(ctx.lados).toEqual([
      { lado: 'Sí', precio: 0.978335, cambio_hoy_puntos: 5, comprar_cuesta: 0.99667, vender_paga: 0.96 },
      { lado: 'No', precio: 0.021665, cambio_hoy_puntos: -5, comprar_cuesta: 0.99667, vender_paga: 0.96 },
    ]);
    expect(ctx.activo).toMatchObject({ nombre: 'SOL', precio_actual: 111.685, objetivo: 109.32, distancia_al_objetivo_pct: 2.16, cambio_hoy_pct: -0.46, cambio_24h_pct: 2.1, cambio_7d_pct: 16.7 });
    expect(ctx.activo.rango_7d).toEqual([100, 116.7]);
    expect(ctx.global).toMatchObject({ semaforo: 'verde', miedo_codicia: 72 });
    expect(Object.keys(ctx).sort()).toEqual(['activo', 'comision_doble', 'global', 'horas_para_vencer', 'lados', 'pregunta', 'regla', 'sin_ofertas', 'volumen_del_dia']);
  });

  it('comprar con poca confianza sale amarillo; no entrar sale rojo', async () => {
    const dudosa = await escena({}, voto({ confianza: 45 }));
    expect((await dudosa.pedir(PLATA)).analisis).toMatchObject({ sugerencia: 'COMPRAR', color: 'amarillo', confianza: 45 });
    const fuera = await escena({}, voto({ sugerencia: 'NO_ENTRAR', lado: null, probabilidad: 51, confianza: 80 }));
    expect((await fuera.pedir(PLATA)).analisis).toMatchObject({ sugerencia: 'NO_ENTRAR', lado: null, lado_nombre: null, color: 'rojo', ventaja: null, freno: null });
  });

  it('puede sugerir el segundo lado: su probabilidad es lo que le falta al primero', async () => {
    const e = await escena({}, voto({ probabilidad: 30, lado: 'No' }));
    expect((await e.pedir(PLATA)).analisis).toMatchObject({ sugerencia: 'COMPRAR', lado: '#104641', lado_nombre: 'No', probabilidad: 30, costo: 0.50145, ventaja: 19.9 });
  });

  it('freno del sistema: aunque la IA diga comprar, sin ofertas o con poca ventaja es «no entrar»', async () => {
    const e = await escena({}, voto({ probabilidad: 90, confianza: 95 }));
    expect((await e.pedir(ETH)).analisis).toMatchObject({ sugerencia: 'NO_ENTRAR', lado: null, lado_nombre: 'Sí', color: 'rojo', freno: 'sin_ofertas', confianza: 50 });
    // Comisión doble: hacen falta 8 puntos y solo hay 6,4.
    const justa = await escena({}, voto({ probabilidad: 30, confianza: 90 }));
    expect((await justa.pedir(PETROLEO)).analisis).toMatchObject({ sugerencia: 'NO_ENTRAR', color: 'rojo', freno: 'poca_ventaja', ventaja: 6.4 });
    // Sin comisión doble bastan 5: con 4,3 tampoco.
    const corta = await escena({}, voto({ probabilidad: 55 }));
    expect((await corta.pedir(PLATA)).analisis).toMatchObject({ sugerencia: 'NO_ENTRAR', freno: 'poca_ventaja', ventaja: 4.3 });
  });

  it('la ventaja se mide contra lo que cuesta comprar de verdad, no contra el precio medio', async () => {
    // Caso real: mercado casi vacío con precio medio 0,50, donde la única oferta de «No» está en 0,9998.
    const e = await escena({}, voto({ probabilidad: 5, lado: 'No', confianza: 90 }));
    const libros = { '#104640': [['0.0002', '5445'], ['0.9916', '10']], '#104641': [['0.0084', '10'], ['0.9998', '5445']] } as Record<string, string[][]>;
    const hl = { ...e.hl, libro: async (lado: string) => ({ plataforma: 'hyperliquid', lado, ts: AHORA, compras: [{ precio: Number(libros[lado][0][0]), unidades: 1 }], ventas: [{ precio: Number(libros[lado][1][0]), unidades: 1 }] }) };
    const a = (await e.pedir(PLATA, { plataforma: hl })).analisis;
    expect(a).toMatchObject({ sugerencia: 'NO_ENTRAR', color: 'rojo', freno: 'poca_ventaja', lado_nombre: 'No', costo: 0.9998, ventaja: -5 });
    // Con el precio medio habría salido «comprar» con 45 puntos de ventaja: sin plataforma (sin libro) se ve la diferencia.
    expect((await e.pedir(PLATA, { plataforma: undefined })).analisis).toMatchObject({ sugerencia: 'COMPRAR', ventaja: 45.3 });
  });

  it('si nadie vende el lado sugerido, es «no entrar» aunque el precio medio parezca bueno', async () => {
    const e = await escena();
    const hl = { ...e.hl, libro: async (lado: string) => ({ plataforma: 'hyperliquid', lado, ts: AHORA, compras: [{ precio: 0.4, unidades: 5 }], ventas: [] }) };
    expect((await e.pedir(PLATA, { plataforma: hl })).analisis).toMatchObject({ sugerencia: 'NO_ENTRAR', freno: 'sin_ofertas', costo: null, ventaja: null });
  });

  it('si el libro no llega, el análisis sigue con el precio medio', async () => {
    const e = await escena();
    const hl = { ...e.hl, libro: async () => { throw new Error('caído'); } };
    expect((await e.pedir(PLATA, { plataforma: hl as any })).analisis).toMatchObject({ sugerencia: 'COMPRAR', costo: 0.50255, ventaja: 11.7 });
  });

  it('si no coinciden, gana la opción con más confianza y la confianza baja; el empate es «no entrar»', async () => {
    const e = await escena({ [partirModelo(SUPER)!.modelo]: voto({ confianza: 80, probabilidad: 66 }), [partirModelo(ULTRA)!.modelo]: voto({ sugerencia: 'NO_ENTRAR', lado: null, confianza: 60, probabilidad: 60 }) });
    const { analisis: a } = await e.pedir(PLATA);
    expect(a).toMatchObject({ sugerencia: 'COMPRAR', lado_nombre: 'Sí', acuerdo: { a_favor: 1, total: 2 }, confianza: 60, probabilidad: 63, color: 'verde' });
    const empate = await escena({ [partirModelo(SUPER)!.modelo]: voto({ confianza: 70 }), [partirModelo(ULTRA)!.modelo]: voto({ lado: 'No', probabilidad: 30, confianza: 70 }) });
    expect((await empate.pedir(PLATA)).analisis).toMatchObject({ sugerencia: 'NO_ENTRAR', color: 'rojo' });
  });

  it('una IA que falla o responde mal no tumba el análisis: queda anotado su error real', async () => {
    const e = await escena({ [partirModelo(SUPER)!.modelo]: 'no sé', [partirModelo(ULTRA)!.modelo]: voto() });
    const { analisis: a } = await e.pedir(PLATA);
    expect(a.acuerdo).toEqual({ a_favor: 1, total: 1 });
    expect(a.votos[0]).toMatchObject({ ok: false, error: 'la respuesta no trae JSON' });
    // Con consenso pedido, una sola opinión no llega al verde.
    expect(a).toMatchObject({ sugerencia: 'COMPRAR', confianza: 70, color: 'amarillo' });
  });

  it('respuestas inválidas se rechazan: probabilidad fuera de rango, sugerencia rara o un lado que no existe', async () => {
    const m = (await escena()).de(PLATA);
    expect(() => leerVoto(voto({ probabilidad: 140 }), m)).toThrow('probabilidad inválida');
    expect(() => leerVoto(voto({ sugerencia: 'VENDER TODO' }), m)).toThrow('sugerencia inválida');
    expect(() => leerVoto(voto({ lado: 'Quizás' }), m)).toThrow('un lado que no existe');
    expect(leerVoto('Claro: ' + voto({ lado: 'sí', motivo: 'x'.repeat(500) }) + ' Suerte.', m)).toMatchObject({ lado: '#104640', sugerencia: 'COMPRAR' });
    expect(leerVoto(voto({ motivo: 'x'.repeat(500) }), m).motivo).toHaveLength(240);
  });

  it('si el límite de un modelo se agota, se anota su descanso y no se le vuelve a llamar', async () => {
    const e = await escena({ [partirModelo(SUPER)!.modelo]: { status: 429 } });
    const r = await e.pedir(PLATA);
    expect(r.pausas).toEqual({ [SUPER]: AHORA + 600_000 });
    const antes = e.ia.llamadas.length;
    await e.pedir(PLATA, { pausas: r.pausas });
    expect(e.ia.llamadas.slice(antes).map((l) => l.modelo)).toEqual([partirModelo(ULTRA)!.modelo]);
  });

  it('si ninguna responde, falla con el motivo de cada una', async () => {
    const e = await escena({}, { status: 500, cuerpo: { error: { message: 'caída' } } });
    const err: ErrorAnalisis = await e.pedir(PLATA).catch((x) => x);
    expect(err).toBeInstanceOf(ErrorAnalisis);
    expect(err.message).toBe('nemotron-3-super-120b-a12b · Kilo: Kilo HTTP 500: caída | nemotron-3-ultra-550b-a55b · Kilo: Kilo HTTP 500: caída');
    const todas: ErrorAnalisis = await e.pedir(PLATA, { pausas: { [SUPER]: AHORA + 1, [ULTRA]: AHORA + 1 } }).catch((x) => x);
    expect(todas.message).toContain('descansando');
  });

  it('sin consenso opina solo la primera que responda; con consenso de 3 opinan tres a la vez', async () => {
    const e = await escena();
    const modelos = [SUPER, ULTRA, GROQ, 'groq:openai/gpt-oss-120b'];
    const una = await e.pedir(PLATA, { modelos, consenso: { activo: false, tamano: 3 } });
    expect(una.analisis.votos).toHaveLength(1);
    const tres = await e.pedir(PLATA, { modelos, claves: { groq: CLAVE_GROQ }, consenso: { activo: true, tamano: 3 } });
    expect(tres.analisis.votos.map((v) => v.modelo)).toEqual([SUPER, ULTRA, GROQ]);
    expect(tres.analisis.acuerdo).toEqual({ a_favor: 3, total: 3 });
  });

  it('analizar solo lee: ninguna llamada a la dirección de órdenes', async () => {
    const e = await escena();
    await e.pedir(PLATA);
    expect(e.sim.llamadas.every((c) => ['outcomeMeta', 'allMids', 'spotMetaAndAssetCtxs', 'metaAndAssetCtxs', 'candleSnapshot', 'l2Book'].includes(c.type))).toBe(true);
  });

  it('un mercado vencido no se analiza', async () => {
    const e = await escena();
    await expect(analizar({ entorno: { fetch: e.red, ahora: () => AHORA }, mercado: { ...e.de(PLATA), vence: AHORA - 1 }, claves: {}, modelos: MODELOS_SIN_CLAVE, consenso: { activo: true, tamano: 2 } })).rejects.toThrow('ya venció');
    expect(e.ia.llamadas).toHaveLength(0);
  });

  it('juntar votos sin ninguno válido no inventa nada', async () => {
    const m = (await escena()).de(PLATA);
    const malos: Voto[] = [{ modelo: SUPER, ok: false, ms: 1, error: 'x' }];
    expect(juntarVotos(malos, m, AHORA)).toBeNull();
  });
});

describe('Ajustes de IA en la nube', () => {
  const ADMIN = 'contraseña-larga-de-respaldo';

  it('empieza con Kilo, sin claves y con consenso de 2', async () => {
    const v = await vistaIA(almacenMemoria(), ADMIN, AHORA);
    expect(v.modelos).toEqual(MODELOS_SIN_CLAVE);
    expect(v.consenso).toEqual({ activo: true, tamano: 2 });
    expect(v.proveedores.map((p) => p.id)).toEqual(['kilo', 'groq', 'google', 'openrouter', 'cerebras', 'mistral']);
    expect(v.proveedores[0]).toMatchObject({ pide_clave: false, tiene_clave: true, clave: null });
    expect(v.proveedores[1]).toMatchObject({ pide_clave: true, tiene_clave: false, clave: null, alta: 'https://console.groq.com/keys' });
  });

  it('una clave se guarda cifrada y solo vuelve recortada', async () => {
    const almacen = almacenMemoria();
    expect(await cambiarIA(almacen, ADMIN, { claves: { groq: CLAVE_GROQ } })).toEqual({ ok: true });
    expect([...almacen.datos.values()].join(' ')).not.toContain(CLAVE_GROQ);
    expect([...almacen.datos.values()].join(' ')).not.toContain('a'.repeat(20));
    const v = await vistaIA(almacen, ADMIN, AHORA);
    expect(v.proveedores[1]).toMatchObject({ tiene_clave: true, clave: 'gsk_…6tQF' });
    expect(JSON.stringify(v)).not.toContain(CLAVE_GROQ);
    expect(await leerClaves(almacen, ADMIN)).toEqual({ groq: CLAVE_GROQ });
    // Con otra contraseña del agente (reinstalación) ya no se pueden leer: hay que ponerlas de nuevo.
    expect(await leerClaves(almacen, 'otra-contraseña')).toEqual({});
  });

  it('al poner una clave su primer modelo entra a la lista; al quitarla, salen los suyos', async () => {
    const almacen = almacenMemoria();
    await cambiarIA(almacen, ADMIN, { claves: { groq: CLAVE_GROQ } });
    expect((await vistaIA(almacen, ADMIN, AHORA)).modelos).toEqual([GROQ, ...MODELOS_SIN_CLAVE]);
    await cambiarIA(almacen, ADMIN, { claves: { groq: null } });
    const v = await vistaIA(almacen, ADMIN, AHORA);
    expect(v.modelos).toEqual(MODELOS_SIN_CLAVE);
    expect(v.proveedores[1].clave).toBeNull();
  });

  it('valida claves, modelos y consenso', async () => {
    const a = almacenMemoria();
    expect(await cambiarIA(a, ADMIN, { claves: { groq: 'corta' } })).toEqual({ error: 'La clave de Groq no tiene buena forma: cópiala entera, sin espacios.' });
    expect(await cambiarIA(a, ADMIN, { claves: { kilo: 'x'.repeat(30) } })).toMatchObject({ error: expect.stringContaining('no usa clave') });
    expect(await cambiarIA(a, ADMIN, { modelos: [] })).toEqual({ error: 'Deja al menos un modelo.' });
    expect(await cambiarIA(a, ADMIN, { modelos: ['inventado:x'] })).toMatchObject({ error: expect.stringContaining('Modelo no válido') });
    expect(await cambiarIA(a, ADMIN, { modelos: Array.from({ length: 9 }, (_, i) => `groq:m${i}`) })).toEqual({ error: 'Máximo 8 modelos.' });
    expect(await cambiarIA(a, ADMIN, { consenso: { tamano: 6 } })).toEqual({ error: 'El consenso usa entre 2 y 5 IA.' });
    expect(await cambiarIA(a, ADMIN, { consenso: { activo: false, tamano: 3 }, modelos: [ULTRA, SUPER] })).toEqual({ ok: true });
    expect(await vistaIA(a, ADMIN, AHORA)).toMatchObject({ modelos: [ULTRA, SUPER], consenso: { activo: false, tamano: 3 } });
    await expect(cambiarIA(almacenMemoria(), undefined, { claves: { groq: CLAVE_GROQ } })).rejects.toThrow('ADMIN_TOKEN');
  });
});

describe('Agente en la nube: IA y mercados globales', () => {
  async function nube(guion: Parameters<typeof iaSimulada>[0] = {}, porDefecto?: Parameters<typeof iaSimulada>[1]) {
    const tel = await telefonoSimulado();
    const sim = hyperliquidSimulado();
    const ia = iaSimulada(guion, porDefecto);
    const almacen = almacenMemoria();
    let reloj = AHORA;
    const agente = crearAgente({ fetch: redCompleta(sim, ia), ahora: () => reloj, almacen });
    const env = { DEVICE_PUBLIC_KEY: tel.publica, ADMIN_TOKEN: 'contraseña-larga-de-respaldo' } as any;
    let token = '';
    const pedir = async (ruta: string, op: { cuerpo?: unknown; metodo?: string; anonimo?: boolean } = {}) => {
      const r = await agente.fetch(new Request('https://agente.prueba' + ruta, { method: op.metodo || (op.cuerpo ? 'POST' : 'GET'), headers: token && !op.anonimo ? { authorization: 'Bearer ' + token } : {}, body: op.cuerpo ? JSON.stringify(op.cuerpo) : undefined }), env);
      return { status: r.status, datos: (await r.json()) as any, texto: '' };
    };
    const { mensaje } = (await pedir('/api/v1/sesion/reto', { metodo: 'POST' })).datos;
    token = (await pedir('/api/v1/sesion/entrar', { cuerpo: { mensaje, firma: await tel.firmar(mensaje) } })).datos.token;
    return { sim, ia, almacen, pedir, avanzar: (ms: number) => (reloj += ms) };
  }

  it('los mercados globales son públicos y se leen una vez cada 5 minutos', async () => {
    const n = await nube();
    const r = await n.pedir('/api/v1/global', { anonimo: true });
    expect(r.status).toBe(200);
    expect(r.datos.lectura.color).toBe('verde');
    const antes = n.sim.llamadas.length;
    await n.pedir('/api/v1/global', { anonimo: true });
    expect(n.sim.llamadas).toHaveLength(antes);
    n.avanzar(5 * 60_000 + 1);
    await n.pedir('/api/v1/global', { anonimo: true });
    expect(n.sim.llamadas).toHaveLength(antes + 2);
  });

  it('la IA es solo del dueño: sin sesión no hay ajustes, ni pruebas, ni análisis', async () => {
    const n = await nube();
    for (const [ruta, metodo] of [['/api/v1/ia', 'GET'], ['/api/v1/ia', 'POST'], ['/api/v1/ia/probar', 'POST'], ['/api/v1/ia/analizar', 'POST']]) expect((await n.pedir(ruta, { metodo, anonimo: true })).status).toBe(401);
    expect(n.ia.llamadas).toHaveLength(0);
  });

  it('guardar una clave desde la app: vuelve recortada y el agente ya la usa', async () => {
    const n = await nube({}, '{"ok":true}');
    const r = await n.pedir('/api/v1/ia', { cuerpo: { claves: { groq: CLAVE_GROQ } } });
    expect(r.status).toBe(200);
    expect(r.datos.proveedores[1].clave).toBe('gsk_…6tQF');
    expect(JSON.stringify(r.datos)).not.toContain(CLAVE_GROQ);
    expect([...n.almacen.datos.values()].join(' ')).not.toContain(CLAVE_GROQ);
    const p = await n.pedir('/api/v1/ia/probar', { metodo: 'POST' });
    expect(p.datos.ok).toBe(true);
    expect(p.datos.pruebas.map((x: any) => [x.nombre, x.ok])).toEqual([['qwen3.8-27b · Groq', true], ['nemotron-3-super-120b-a12b · Kilo', true], ['nemotron-3-ultra-550b-a55b · Kilo', true]]);
    expect(n.ia.llamadas.find((l) => l.url.includes('groq'))!.clave).toBe('Bearer ' + CLAVE_GROQ);
    expect((await n.pedir('/api/v1/ia')).datos.ultima).toMatchObject({ ok: true, que: 'prueba', detalle: '3/3' });
    expect((await n.pedir('/api/v1/ia', { cuerpo: { claves: { groq: 'mala' } } })).status).toBe(400);
  });

  it('analiza un mercado con consenso y guarda el resultado 10 minutos para no gastar consultas', async () => {
    const n = await nube();
    const r = await n.pedir('/api/v1/ia/analizar', { cuerpo: { plataforma: 'hyperliquid', mercado: PLATA } });
    expect(r.status).toBe(200);
    expect(r.datos).toMatchObject({ sugerencia: 'COMPRAR', lado_nombre: 'Sí', color: 'verde', acuerdo: { a_favor: 2, total: 2 } });
    expect(JSON.parse(n.ia.llamadas[0].cuerpo.messages[1].content).global.semaforo).toBe('verde');
    expect(n.ia.llamadas).toHaveLength(2);
    expect((await n.pedir('/api/v1/ia/analizar', { cuerpo: { plataforma: 'hyperliquid', mercado: PLATA } })).datos.guardado).toBe(true);
    expect(n.ia.llamadas).toHaveLength(2);
    n.avanzar(10 * 60_000 + 1);
    await n.pedir('/api/v1/ia/analizar', { cuerpo: { plataforma: 'hyperliquid', mercado: PLATA } });
    expect(n.ia.llamadas).toHaveLength(4);
    expect((await n.pedir('/api/v1/ia')).datos.ultima).toMatchObject({ ok: true, que: 'analisis' });
  });

  it('en inglés pide el motivo en inglés', async () => {
    const n = await nube();
    await n.pedir('/api/v1/ia/analizar?idioma=en', { cuerpo: { plataforma: 'hyperliquid', mercado: PLATA } });
    expect(n.ia.llamadas[0].cuerpo.messages[0].content).toContain('en inglés');
    expect(JSON.parse(n.ia.llamadas[0].cuerpo.messages[1].content).pregunta).toBe('Silver ≥ 60.7 at expiry?');
  });

  it('un mercado que no existe da 404; si las IA fallan, 502 con el motivo y el descanso anotado', async () => {
    const n = await nube({}, { status: 429 });
    expect((await n.pedir('/api/v1/ia/analizar', { cuerpo: { plataforma: 'hyperliquid', mercado: '999999' } })).status).toBe(404);
    const r = await n.pedir('/api/v1/ia/analizar', { cuerpo: { plataforma: 'hyperliquid', mercado: PLATA } });
    expect(r.status).toBe(502);
    expect(r.datos.error).toContain('límite de Kilo agotado');
    const v = (await n.pedir('/api/v1/ia')).datos;
    expect(v.pausas).toEqual({ [SUPER]: AHORA + 600_000, [ULTRA]: AHORA + 600_000 });
    expect(v.ultima).toMatchObject({ ok: false, que: 'analisis' });
    // Mientras descansan no se les vuelve a llamar.
    const antes = n.ia.llamadas.length;
    expect((await n.pedir('/api/v1/ia/analizar', { cuerpo: { plataforma: 'hyperliquid', mercado: PLATA } })).datos.error).toContain('descansando');
    expect(n.ia.llamadas).toHaveLength(antes);
  });

  it('un análisis gasta pocas subpeticiones (el plan gratuito permite 50)', async () => {
    const n = await nube();
    await n.pedir('/api/v1/ia/analizar', { cuerpo: { plataforma: 'hyperliquid', mercado: '10999' } });
    // 6 de mercados + 2 globales + 1 de historia + 2 libros a Hyperliquid, 1 al índice de ánimo y 2 IA: 14 en total.
    expect(n.sim.llamadas).toHaveLength(11);
    expect(n.ia.llamadas).toHaveLength(2);
  });
});
