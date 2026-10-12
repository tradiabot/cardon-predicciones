// Sumar una plataforma = su módulo (aquí test/falsa.ts) + una entrada en la lista. Nada más cambia.
import { describe, expect, it } from 'vitest';
import { contar, explorar, FILTRO_VACIO, filtrar } from '../src/explorar';
import { crearHyperliquid } from '../src/plataformas/hyperliquid';
import { buscarPlataforma, crearPlataformas, PLATAFORMAS } from '../src/plataformas/registro';
import { crearAgente } from '../src/worker';
import { crearFalsa } from './falsa';
import { AHORA, hyperliquidSimulado } from './simulada';

const entorno = () => ({ fetch: hyperliquidSimulado().red, ahora: () => AHORA });
const LISTA = [crearHyperliquid, crearFalsa];

describe('Una plataforma nueva de ejemplo («Feria»)', () => {
  it('hoy la lista de verdad solo trae Hyperliquid', () => {
    expect(crearPlataformas(entorno()).map((p) => p.id)).toEqual(['hyperliquid']);
    expect(PLATAFORMAS).toHaveLength(1);
  });

  it('con una entrada más, el explorador junta los mercados de las dos', async () => {
    const r = await explorar(crearPlataformas(entorno(), LISTA), 'es', () => AHORA);
    expect(r.errores).toEqual([]);
    const c = contar(r.mercados);
    expect(c.plataformas).toEqual({ hyperliquid: 14, feria: 2 });
    expect(c.creadores.Feria).toBe(2);
    expect(c.precios['0.1']).toBe(3);
    expect(filtrar(r.mercados, { ...FILTRO_VACIO, plataforma: 'feria' }).map((m) => m.pregunta)).toEqual(['¿Llueve el domingo en la feria?', '¿Sale el 7 en la tómbola?']);
    expect(filtrar(r.mercados, { ...FILTRO_VACIO, texto: 'tómbola' })[0]).toMatchObject({ plataforma: 'feria', moneda: 'FICHAS' });
  });

  it('si una plataforma cae, la otra se sigue viendo', async () => {
    const lista = crearPlataformas({ fetch: hyperliquidSimulado({ caido: true }).red, ahora: () => AHORA }, LISTA);
    const r = await explorar(lista, 'es', () => AHORA);
    expect(r.mercados.map((m) => m.plataforma)).toEqual(['feria', 'feria']);
    expect(r.errores).toEqual([{ plataforma: 'hyperliquid', error: 'Hyperliquid respondió HTTP 502' }]);
  });

  it('cumple toda la interfaz común: libro, comprar, vender, posiciones y saldo', async () => {
    const feria = buscarPlataforma(crearPlataformas(entorno(), LISTA), 'feria');
    expect((await feria.libro('lluvia-si')).ventas[0]).toEqual({ precio: 0.3, unidades: 50 });
    expect(await feria.comprar({ lado: 'lluvia-si', unidades: 10, limite: 0.29 }, {})).toMatchObject({ unidades: 0 }); // el límite no alcanza
    expect(await feria.comprar({ lado: 'lluvia-si', unidades: 10, limite: 0.3 }, {})).toMatchObject({ plataforma: 'feria', unidades: 10, precio: 0.3, total: 3 });
    expect(await feria.posiciones({})).toEqual([{ plataforma: 'feria', mercado: 'lluvia', lado: 'lluvia-si', unidades: 10, costo: 0.3 }]);
    expect(await feria.saldo({})).toMatchObject({ plataforma: 'feria', moneda: 'FICHAS', libre: 97 });
    expect(await feria.vender({ lado: 'lluvia-si', unidades: 4, limite: 0.3 }, {})).toMatchObject({ unidades: 4, total: 1.2 });
    expect((await feria.saldo({})).libre).toBeCloseTo(98.2);
  });

  it('el agente de la nube la sirve sin cambiar una línea suya', async () => {
    const agente = crearAgente({ ...entorno(), plataformas: LISTA });
    const pedir = async (ruta: string) => (await agente.fetch(new Request('https://agente.prueba' + ruta))).json() as Promise<any>;
    expect((await pedir('/api/v1/plataformas')).plataformas.map((p: any) => p.id)).toEqual(['hyperliquid', 'feria']);
    expect((await pedir('/api/v1/mercados')).mercados).toHaveLength(16);
    expect(await pedir('/api/v1/libro?plataforma=feria&lado=tombola-si')).toMatchObject({ plataforma: 'feria', ventas: [{ precio: 0.08, unidades: 50 }] });
  });

  it('una plataforma que no está en la lista se rechaza con un error claro', () => {
    expect(() => buscarPlataforma(crearPlataformas(entorno()), 'feria')).toThrow('Plataforma desconocida: feria');
  });
});
