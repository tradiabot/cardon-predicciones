import { describe, expect, it } from 'vitest';
import { alternarGuardada, categoriaDe, cerradas, clave, contar, explorar, FILTRO_VACIO, filtrar } from '../src/explorar';
import { crearHyperliquid } from '../src/plataformas/hyperliquid';
import { AHORA, hyperliquidSimulado } from './simulada';

const cargar = async () => (await explorar([crearHyperliquid({ fetch: hyperliquidSimulado().red, ahora: () => AHORA })], 'es', () => AHORA)).mercados;
const f = (x: Partial<typeof FILTRO_VACIO>) => ({ ...FILTRO_VACIO, ...x });

describe('Explorador: filtros', () => {
  it('cuenta cuántos hay en cada filtro', async () => {
    const c = contar(await cargar());
    expect(c.total).toBe(14);
    expect(c.categorias).toEqual({ cripto_hoy: 4, cripto_mediano: 2, bolsa: 3, economia: 5 });
    expect(c.creadores).toEqual({ Hyperliquid: 4, skew: 1, out: 4, 'trade.xyz': 5 });
    expect(c.plataformas).toEqual({ hyperliquid: 14 });
    expect(c.precios).toEqual({ '0.5': 13, '0.1': 2 });
  });

  it('filtra por categoría, creador, precio y texto, y los combina', async () => {
    const m = await cargar();
    expect(filtrar(m, f({ categoria: 'cripto_hoy' })).map((x) => x.id)).toEqual(['10999', '11002', '11004', '11003']);
    expect(filtrar(m, f({ creador: 'skew' })).map((x) => x.id)).toEqual(['10231']);
    expect(filtrar(m, f({ precioMax: 0.1 })).map((x) => x.id)).toEqual(['10999', '11002']);
    expect(filtrar(m, f({ texto: 'fed' }))).toHaveLength(3);
    expect(filtrar(m, f({ categoria: 'economia', creador: 'out', precioMax: 0.5 })).map((x) => x.id)).toEqual(['3600', '8573']);
    for (const x of filtrar(m, f({ categoria: 'bolsa' }))) expect(categoriaDe(x)).toBe('bolsa');
  });

  it('menos de 0,50 exige que algún lado cueste menos de eso', async () => {
    const fuera = (await cargar()).filter((x) => !filtrar([x], f({ precioMax: 0.5 })).length);
    expect(fuera.map((x) => x.id)).toEqual(['10231']); // 0,5 y 0,5: ninguno es «menos de»
  });
});

describe('Explorador: guardadas', () => {
  it('la estrella guarda y quita, y «Guardadas» filtra', async () => {
    const m = await cargar();
    let g = alternarGuardada({}, m[0], 1000);
    expect(g[clave(m[0])]).toEqual({ plataforma: 'hyperliquid', id: '10999', pregunta: '¿SOL ≥ 109,32 al vencer?', ts: 1000, vence: Date.UTC(2026, 9, 12, 6, 0) });
    expect(filtrar(m, f({ categoria: 'guardadas' }), g).map((x) => x.id)).toEqual(['10999']);
    expect(contar(m, g).guardadas).toBe(1);
    g = alternarGuardada(g, m[0], 2000);
    expect(g).toEqual({});
  });

  it('una guardada que ya no sale en la lista se da por cerrada', async () => {
    const m = await cargar();
    const g = alternarGuardada(alternarGuardada({}, m[0], 1), m[1], 2);
    expect(cerradas(g, { mercados: m, errores: [] })).toEqual([]);
    expect(cerradas(g, { mercados: m.slice(1), errores: [] }).map((x) => x.id)).toEqual(['10999']);
  });

  it('si la plataforma no respondió, no se dan por cerradas', async () => {
    const m = await cargar();
    const g = alternarGuardada({}, m[0], 1);
    expect(cerradas(g, { mercados: [], errores: [{ plataforma: 'hyperliquid', error: 'caída' }] })).toEqual([]);
  });
});

describe('Explorador: fallos', () => {
  it('devuelve el error real de la plataforma que falla', async () => {
    const r = await explorar([crearHyperliquid({ fetch: hyperliquidSimulado({ caido: true }).red })]);
    expect(r.mercados).toEqual([]);
    expect(r.errores).toEqual([{ plataforma: 'hyperliquid', error: 'Hyperliquid respondió HTTP 502' }]);
  });
});
