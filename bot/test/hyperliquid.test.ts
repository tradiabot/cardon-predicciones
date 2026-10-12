import { describe, expect, it } from 'vitest';
import { crearHyperliquid } from '../src/plataformas/hyperliquid';
import { ErrorPlataforma } from '../src/plataformas/tipos';
import { AHORA, hyperliquidSimulado } from './simulada';

const crear = (op?: Parameters<typeof hyperliquidSimulado>[0]) => {
  const sim = hyperliquidSimulado(op);
  return { hl: crearHyperliquid({ fetch: sim.red, ahora: () => AHORA }), sim };
};
const mercados = async (idioma: 'es' | 'en' = 'es') => (await crear().hl.listarMercados(idioma)).mercados;

describe('Hyperliquid: leer mercados', () => {
  it('lee los mercados abiertos con pregunta, vencimiento, precio de cada lado y creador', async () => {
    const lista = await mercados();
    const sol = lista.find((m) => m.id === '10999')!;
    expect(sol).toMatchObject({ plataforma: 'hyperliquid', pregunta: '¿SOL ≥ 109,32 al vencer?', categoria: 'cripto', plazo: 'hoy', creador: 'Hyperliquid', moneda: 'USDC', comision_doble: false, horas: 6 });
    expect(sol.vence).toBe(Date.UTC(2026, 9, 12, 6, 0));
    expect(sol.lados).toEqual([
      { id: '#109990', nombre: 'Sí', precio: 0.978335, cambio: 0.05 },
      { id: '#109991', nombre: 'No', precio: 0.021665, cambio: -0.05 },
    ]);
    expect(sol).toMatchObject({ subyacente: 'SOL', precio_actual: 111.685, objetivo: 109.32, distancia_pct: 2.16 });
  });

  it('todos llevan su plataforma y dos lados con identificador', async () => {
    const lista = await mercados();
    expect(lista).toHaveLength(14);
    for (const m of lista) {
      expect(m.plataforma).toBe('hyperliquid');
      expect(m.lados).toHaveLength(2);
      for (const l of m.lados) expect(l.id).toMatch(/^#\d+$/);
    }
  });

  it('entiende cada tipo de mercado', async () => {
    const p = Object.fromEntries((await mercados()).map((m) => [m.id, m.pregunta]));
    expect(p['11002']).toBe('¿BTC < 81 334 al vencer?');
    expect(p['11003']).toBe('¿BTC entre 81 334 y 84 653 al vencer?');
    expect(p['11004']).toBe('¿BTC ≥ 84 653 al vencer?');
    expect(p['7186']).toBe('¿HYPE toca 75 antes del 1 nov?');
    expect(p['10464']).toBe('¿Plata ≥ 60,7 al vencer?');
    expect(p['9200']).toBe('¿UNH ≥ 420 al vencer?');
    expect(p['4886']).toBe('¿La Fed mantiene la tasa de interés (October 2026 FOMC)?');
    expect(p['5112']).toBe('¿Anthropic confirma su salida a bolsa antes del 30 nov?');
    expect(p['8573']).toBe('¿Anthropic vale 1,5 billones de USD o más en su primer día en bolsa?');
  });

  it('deja fuera deportes y mercados de relleno', async () => {
    const ids = (await mercados()).map((m) => m.id);
    for (const fuera of ['11121', '10362', '8656', '11001']) expect(ids).not.toContain(fuera);
  });

  it('marca la comisión doble de los creadores externos y los libros vacíos', async () => {
    const m = Object.fromEntries((await mercados()).map((x) => [x.id, x]));
    expect(m['11255']).toMatchObject({ creador: 'out', comision_doble: true });
    expect(m['10464']).toMatchObject({ creador: 'trade.xyz', comision_doble: false });
    expect(m['10231']).toMatchObject({ creador: 'skew', comision_doble: true, sin_ofertas: true });
    expect(m['10999'].sin_ofertas).toBe(false);
  });

  it('separa categorías y plazos', async () => {
    const m = Object.fromEntries((await mercados()).map((x) => [x.id, `${x.categoria}/${x.plazo}`]));
    expect(m).toMatchObject({ '10999': 'cripto/hoy', '7186': 'cripto/mediano', '10464': 'bolsa/hoy', '9200': 'bolsa/mediano', '4886': 'economia/mediano' });
  });

  it('no muestra los que ya vencieron', async () => {
    const hl = crearHyperliquid({ fetch: hyperliquidSimulado().red, ahora: () => Date.UTC(2026, 9, 12, 7, 0) });
    const ids = (await hl.listarMercados()).mercados.map((m) => m.id);
    expect(ids).not.toContain('10999');
    expect(ids).toContain('7186');
  });

  it('también en inglés', async () => {
    const m = Object.fromEntries((await mercados('en')).map((x) => [x.id, x]));
    expect(m['10999'].pregunta).toBe('SOL ≥ 109.32 at expiry?');
    expect(m['10999'].lados[0].nombre).toBe('Yes');
    expect(m['11255'].pregunta).toBe('WTI crude oil ≥ 91.196 at expiry?');
    expect(m['4887'].pregunta).toBe('The Fed cuts the interest rate (October 2026 FOMC)?');
  });

  it('sigue leyendo aunque cambie el formato de un mercado', async () => {
    const meta = { outcomes: [{ outcome: 1, name: 'Recurring', description: 'class:priceBinary|underlying:BTC|expiry:roto|targetPrice:abc', sideSpecs: [{ name: 'Yes' }, { name: 'No' }] }, { outcome: 2 }, null], questions: [] };
    const { hl } = crear({ meta, precios: { '#10': '0.4', '#11': '0.6' } });
    await expect(hl.listarMercados()).resolves.toMatchObject({ plataforma: 'hyperliquid' });
  });
});

describe('Hyperliquid: cambio frente a ayer', () => {
  it('cada lado dice cuánto cambió hoy, y el mercado su volumen y el cambio de su activo', async () => {
    const sol = (await mercados()).find((m) => m.id === '10999')!;
    expect(sol.lados.map((l) => l.cambio)).toEqual([0.05, -0.05]);
    expect(sol).toMatchObject({ subyacente_id: 'SOL', cambio_subyacente_pct: -0.46, volumen: 241 });
    const petroleo = (await mercados()).find((m) => m.id === '11255')!;
    expect(petroleo).toMatchObject({ subyacente_id: 'xyz:CL', cambio_subyacente_pct: -1.51 });
  });

  it('sin precio de ayer no inventa un cambio', async () => {
    const hype = (await mercados()).find((m) => m.id === '7186')!;
    expect(hype.cambio_subyacente_pct).toBeNull(); // ayer = 0 en la lista: sin dato
  });

  it('si esas listas fallan, los mercados se leen igual, solo sin colores', async () => {
    const hl = crearHyperliquid({ fetch: hyperliquidSimulado({ sinAyer: true }).red, ahora: () => AHORA });
    const lista = (await hl.listarMercados()).mercados;
    expect(lista).toHaveLength(14);
    expect(lista[0].lados[0]).toMatchObject({ precio: 0.978335, cambio: null });
    expect(lista[0]).toMatchObject({ cambio_subyacente_pct: null, volumen: null });
  });

  it('da la historia del activo de un mercado: 24 horas y 7 días', async () => {
    const { hl, sim } = crear();
    const sol = (await hl.listarMercados()).mercados.find((m) => m.id === '10999')!;
    expect(await hl.historia!(sol)).toEqual({ cambio_24h_pct: 2.1, rango_24h: [114.3, 116.7], cambio_7d_pct: 16.7, rango_7d: [100, 116.7] });
    expect(sim.llamadas.at(-1)).toMatchObject({ type: 'candleSnapshot', req: { coin: 'SOL', interval: '1h', endTime: AHORA } });
    const fed = (await hl.listarMercados()).mercados.find((m) => m.id === '4887')!;
    expect(await hl.historia!(fed)).toBeNull();
  });
});

describe('Hyperliquid: libro y errores', () => {
  it('da el libro de un lado: quién compra y quién vende', async () => {
    const { hl, sim } = crear();
    const libro = await hl.libro('#109990');
    expect(libro).toMatchObject({ plataforma: 'hyperliquid', lado: '#109990', compras: [{ precio: 0.96, unidades: 276 }, { precio: 0.95118, unidades: 200 }], ventas: [{ precio: 0.99667, unidades: 1204 }, { precio: 0.9979, unidades: 5477 }] });
    expect(sim.llamadas).toEqual([{ type: 'l2Book', coin: '#109990' }]);
  });

  it('rechaza un lado inválido sin salir a la red', async () => {
    const { hl, sim } = crear();
    await expect(hl.libro('BTC')).rejects.toThrow('Mercado inválido');
    expect(sim.llamadas).toHaveLength(0);
  });

  it('si Hyperliquid falla, dice el error real', async () => {
    const { hl } = crear({ caido: true });
    await expect(hl.listarMercados()).rejects.toThrow('Hyperliquid respondió HTTP 502');
    await expect(hl.listarMercados()).rejects.toBeInstanceOf(ErrorPlataforma);
  });

  it('solo lee: nunca llama a la dirección de órdenes y operar aún no existe', async () => {
    const { hl, sim } = crear();
    await hl.listarMercados();
    expect(sim.llamadas.map((c) => c.type)).toEqual(['outcomeMeta', 'allMids', 'allMids', 'spotMetaAndAssetCtxs', 'metaAndAssetCtxs', 'metaAndAssetCtxs']);
    expect(() => hl.comprar({ lado: '#109990', unidades: 1, limite: 0.5 }, {})).toThrow('solo lee mercados');
    expect(() => hl.vender({ lado: '#109990', unidades: 1, limite: 0.5 }, {})).toThrow('solo lee mercados');
  });

  it('la red de verdad está cortada en las pruebas', async () => {
    await expect(fetch('https://api.hyperliquid.xyz/exchange', { method: 'POST' })).rejects.toThrow('no pueden salir a la red');
    await expect(hyperliquidSimulado().red('https://api.hyperliquid.xyz/exchange', { method: 'POST' })).rejects.toThrow('no permitida');
  });
});
