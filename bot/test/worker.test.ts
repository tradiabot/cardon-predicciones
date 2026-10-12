import { describe, expect, it } from 'vitest';
import { crearAgente } from '../src/worker';
import { AHORA, hyperliquidSimulado } from './simulada';

function preparar(op?: Parameters<typeof hyperliquidSimulado>[0]) {
  const sim = hyperliquidSimulado(op);
  let reloj = AHORA;
  const agente = crearAgente({ fetch: sim.red, ahora: () => reloj });
  const pedir = async (ruta: string, init?: RequestInit) => {
    const r = await agente.fetch(new Request('https://agente.prueba' + ruta, init));
    return { status: r.status, datos: (await r.json().catch(() => null)) as any, cabeceras: r.headers };
  };
  return { sim, pedir, avanzar: (ms: number) => (reloj += ms) };
}

describe('Agente en la nube con Hyperliquid simulado', () => {
  it('responde salud y la lista de plataformas', async () => {
    const { pedir } = preparar();
    expect((await pedir('/api/v1/salud')).datos).toMatchObject({ ok: true, ts: AHORA, modo: 'simulacion' });
    expect((await pedir('/api/v1/plataformas')).datos).toEqual({ plataformas: [{ id: 'hyperliquid', nombre: 'Hyperliquid', moneda: 'USDC', minimo_orden: 1 }] });
  });

  it('sirve los mercados, en el idioma pedido', async () => {
    const { pedir } = preparar();
    const es = await pedir('/api/v1/mercados');
    expect(es.status).toBe(200);
    expect(es.datos.mercados).toHaveLength(14);
    expect(es.datos.mercados[0]).toMatchObject({ plataforma: 'hyperliquid', pregunta: '¿SOL ≥ 109,32 al vencer?' });
    expect((await pedir('/api/v1/mercados?idioma=en')).datos.mercados[0].pregunta).toBe('SOL ≥ 109.32 at expiry?');
  });

  it('gasta pocas subpeticiones: 3 por lectura y una sola lectura por minuto', async () => {
    const { pedir, sim, avanzar } = preparar();
    await pedir('/api/v1/mercados');
    expect(sim.llamadas).toHaveLength(3); // el plan gratis de Cloudflare permite 50 por ejecución
    await pedir('/api/v1/mercados');
    avanzar(59_000);
    await pedir('/api/v1/mercados');
    expect(sim.llamadas).toHaveLength(3);
    avanzar(2_000);
    await pedir('/api/v1/mercados');
    expect(sim.llamadas).toHaveLength(6);
  });

  it('sirve el libro de un lado', async () => {
    const { pedir } = preparar();
    const r = await pedir('/api/v1/libro?plataforma=hyperliquid&lado=%23109990');
    expect(r.datos).toMatchObject({ plataforma: 'hyperliquid', lado: '#109990', ventas: [{ precio: 0.99667, unidades: 1204 }, { precio: 0.9979, unidades: 5477 }] });
  });

  it('si Hyperliquid cae, lo dice tal cual y lo reintenta en la siguiente consulta', async () => {
    const { pedir, sim } = preparar({ caido: true });
    const r = await pedir('/api/v1/mercados');
    expect(r.datos).toMatchObject({ mercados: [], errores: [{ plataforma: 'hyperliquid', error: 'Hyperliquid respondió HTTP 502' }] });
    expect((await pedir('/api/v1/libro?plataforma=hyperliquid&lado=%23109990'))).toMatchObject({ status: 502, datos: { error: 'Hyperliquid respondió HTTP 502', plataforma: 'hyperliquid' } });
    sim.estado.caido = false;
    expect((await pedir('/api/v1/mercados')).datos.mercados).toHaveLength(14);
  });

  it('rechaza lo que no existe y todo lo que no sea leer', async () => {
    const { pedir, sim } = preparar();
    expect((await pedir('/api/v1/ordenes')).status).toBe(500); // sin base de datos no hay zona privada
    expect((await pedir('/api/v1/mercados', { method: 'DELETE' })).status).toBe(405);
    expect((await pedir('/api/v1/libro?plataforma=otra&lado=x'))).toMatchObject({ status: 502, datos: { error: 'Plataforma desconocida: otra' } });
    expect((await pedir('/api/v1/libro?plataforma=hyperliquid&lado=BTC')).datos.error).toBe('Mercado inválido');
    expect(sim.llamadas).toHaveLength(0);
  });
});
