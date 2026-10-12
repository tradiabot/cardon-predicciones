import { describe, expect, it } from 'vitest';
import { type Indicador, lecturaPorReglas, leerGlobal, resumenGlobal } from '../src/global';
import { iaSimulada, redCompleta } from './ia-simulada';
import { AHORA, hyperliquidSimulado } from './simulada';

const leer = (idioma: 'es' | 'en' = 'es', sim = hyperliquidSimulado(), ia = iaSimulada()) => leerGlobal({ fetch: redCompleta(sim, ia), ahora: () => AHORA }, idioma);
const ind = (id: string, cambio: number | null, valor = 100): Indicador => ({ id, nombre: id, grupo: 'bolsa', valor, cambio, unidad: '' });

describe('Mercados globales', () => {
  it('lee cripto, bolsa, materias primas, divisas y el ánimo, con su cambio frente a ayer', async () => {
    const g = await leer();
    expect(g.errores).toEqual([]);
    expect(g.ts).toBe(AHORA);
    expect(g.indicadores.map((i) => i.id)).toEqual(['btc', 'eth', 'sol', 'hype', 'sp500', 'nasdaq', 'oro', 'petroleo', 'eur', 'animo']);
    expect(g.indicadores.find((i) => i.id === 'btc')).toEqual({ id: 'btc', nombre: 'Bitcoin', grupo: 'cripto', valor: 82400, cambio: 3, unidad: 'USD' });
    expect(g.indicadores.find((i) => i.id === 'sol')!.cambio).toBe(-1.96);
    expect(g.indicadores.find((i) => i.id === 'petroleo')).toMatchObject({ nombre: 'Petróleo WTI', grupo: 'materias', cambio: -2.2 });
    expect(g.indicadores.find((i) => i.id === 'animo')).toMatchObject({ valor: 72, cambio: 7, unidad: '/100', grupo: 'animo' });
  });

  it('un precio de ayer en 0 es «sin dato»: no inventa un cambio', async () => {
    expect((await leer()).indicadores.find((i) => i.id === 'hype')).toMatchObject({ valor: 88, cambio: null });
  });

  it('semáforo verde cuando suben la bolsa y la cripto', async () => {
    const { lectura } = await leer();
    expect(lectura.color).toBe('verde');
    expect(lectura.puntos).toBe(2);
    expect(lectura.razones).toEqual(['S&P 500 (EE. UU.) +1,00 % ▲', 'Nasdaq 100 (tecnología) +0,32 %', 'Bitcoin +3,00 % ▲', 'Miedo y codicia (cripto) 72/100 ▲']);
  });

  it('rojo cuando caen, amarillo cuando no hay rumbo o no hay datos', () => {
    expect(lecturaPorReglas([ind('sp500', -1.2), ind('btc', -3)]).color).toBe('rojo');
    expect(lecturaPorReglas([ind('sp500', 0.2), ind('btc', -0.5)])).toMatchObject({ color: 'amarillo', puntos: 0 });
    expect(lecturaPorReglas([ind('sp500', 1), ind('btc', -3)]).color).toBe('amarillo');
    expect(lecturaPorReglas([])).toEqual({ color: 'amarillo', puntos: 0, razones: [] });
  });

  it('en inglés', async () => {
    const g = await leer('en');
    expect(g.indicadores.find((i) => i.id === 'petroleo')!.nombre).toBe('WTI crude oil');
    expect(g.lectura.razones[0]).toBe('S&P 500 (US) +1.00 % ▲');
  });

  it('si una fuente falla, dice cuál y sigue con las demás', async () => {
    const ia = iaSimulada();
    const red = (async (u: unknown, init?: RequestInit) => (String(u).includes('alternative.me') ? new Response('x', { status: 503 }) : redCompleta(hyperliquidSimulado(), ia)(u as string, init))) as typeof fetch;
    const g = await leerGlobal({ fetch: red, ahora: () => AHORA });
    expect(g.errores).toEqual(['Miedo y codicia: HTTP 503']);
    expect(g.indicadores.some((i) => i.id === 'btc')).toBe(true);
    expect(g.indicadores.some((i) => i.id === 'animo')).toBe(false);
    const caido = await leer('es', hyperliquidSimulado({ caido: true }));
    expect(caido.errores).toEqual(['Cripto: HTTP 502', 'Bolsa y materias primas: HTTP 502']);
    expect(caido.lectura.color).toBe('amarillo');
  });

  it('solo lee: dos consultas a Hyperliquid y una al índice de ánimo', async () => {
    const sim = hyperliquidSimulado();
    await leer('es', sim);
    expect(sim.llamadas).toEqual([{ type: 'metaAndAssetCtxs' }, { type: 'metaAndAssetCtxs', dex: 'xyz' }]);
  });

  it('el resumen para la IA es corto', async () => {
    const r = resumenGlobal(await leer())!;
    expect(r).toMatchObject({ semaforo: 'verde', puntos: 2, miedo_codicia: 72 });
    expect(JSON.stringify(r).length).toBeLessThan(300);
    expect(resumenGlobal(null)).toBeNull();
  });
});
