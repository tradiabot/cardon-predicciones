import { describe, expect, it } from 'vitest';
import { almacenMemoria } from '../src/almacen';
import { avisar } from '../src/avisos';
import { derARaw } from '../src/sesion';
import { crearAgente } from '../src/worker';
import { AHORA, hyperliquidSimulado } from './simulada';
import { telefonoSimulado } from './telefono';

async function preparar() {
  const tel = await telefonoSimulado();
  const almacen = almacenMemoria();
  let reloj = AHORA;
  const agente = crearAgente({ fetch: hyperliquidSimulado().red, ahora: () => reloj, almacen });
  const env = { DEVICE_PUBLIC_KEY: tel.publica, ADMIN_TOKEN: 'contraseña-larga-de-respaldo' } as any;
  const pedir = async (ruta: string, op: { cuerpo?: unknown; token?: string; metodo?: string; env?: any } = {}) => {
    const r = await agente.fetch(
      new Request('https://agente.prueba' + ruta, { method: op.metodo || (op.cuerpo ? 'POST' : 'GET'), headers: op.token ? { authorization: 'Bearer ' + op.token } : {}, body: op.cuerpo ? JSON.stringify(op.cuerpo) : undefined }),
      op.env || env,
    );
    return { status: r.status, datos: (await r.json()) as any };
  };
  const entrar = async (firmante = tel) => {
    const { mensaje } = (await pedir('/api/v1/sesion/reto', { metodo: 'POST' })).datos;
    return pedir('/api/v1/sesion/entrar', { cuerpo: { mensaje, firma: await firmante.firmar(mensaje) } });
  };
  return { tel, almacen, pedir, entrar, env, avanzar: (ms: number) => (reloj += ms) };
}

describe('Sesión por huella', () => {
  it('el teléfono que instaló firma el reto y recibe una sesión', async () => {
    const a = await preparar();
    const r = await a.entrar();
    expect(r.status).toBe(200);
    expect(r.datos.token).toMatch(/^[0-9a-f]{64}$/);
    expect(r.datos.vence).toBe(AHORA + 90 * 86_400_000);
    expect((await a.pedir('/api/v1/sesion', { token: r.datos.token })).datos).toEqual({ valida: true });
  });

  it('el token no se guarda: solo su huella digital', async () => {
    const a = await preparar();
    const { token } = (await a.entrar()).datos;
    expect([...a.almacen.datos.values()].join(' ')).not.toContain(token);
  });

  it('otro teléfono no entra', async () => {
    const a = await preparar();
    const r = await a.entrar(await telefonoSimulado());
    expect(r.status).toBe(401);
    expect(r.datos.error).toContain('no es el que instaló');
  });

  it('un reto sirve una sola vez y caduca a los 5 minutos', async () => {
    const a = await preparar();
    const { mensaje } = (await a.pedir('/api/v1/sesion/reto', { metodo: 'POST' })).datos;
    const firma = await a.tel.firmar(mensaje);
    expect((await a.pedir('/api/v1/sesion/entrar', { cuerpo: { mensaje, firma } })).status).toBe(200);
    expect((await a.pedir('/api/v1/sesion/entrar', { cuerpo: { mensaje, firma } })).datos.error).toContain('caducó');
    const otro = (await a.pedir('/api/v1/sesion/reto', { metodo: 'POST' })).datos.mensaje;
    a.avanzar(5 * 60_000 + 1);
    expect((await a.pedir('/api/v1/sesion/entrar', { cuerpo: { mensaje: otro, firma: await a.tel.firmar(otro) } })).status).toBe(401);
  });

  it('no acepta firmar otra cosa que un reto de inicio de sesión', async () => {
    const a = await preparar();
    const mensaje = 'Retirar todo · ya · x · y';
    const r = await a.pedir('/api/v1/sesion/entrar', { cuerpo: { mensaje, firma: await a.tel.firmar(mensaje) } });
    expect(r).toMatchObject({ status: 400, datos: { error: 'Inicio de sesión con formato inválido' } });
  });

  it('sin sesión no se entra a la zona privada; lo público sigue abierto', async () => {
    const a = await preparar();
    expect((await a.pedir('/api/v1/avisos')).status).toBe(401);
    expect((await a.pedir('/api/v1/avisos', { token: 'inventado' })).status).toBe(401);
    expect((await a.pedir('/api/v1/sesion')).datos.error).toContain('inicia sesión con tu huella');
    expect((await a.pedir('/api/v1/mercados')).status).toBe(200);
  });

  it('la sesión caduca a los 90 días y se puede cerrar antes', async () => {
    const a = await preparar();
    const { token } = (await a.entrar()).datos;
    expect((await a.pedir('/api/v1/sesion/salir', { token, metodo: 'POST' })).datos).toEqual({ cerrada: true });
    expect((await a.pedir('/api/v1/sesion', { token })).status).toBe(401);
    const otra = (await a.entrar()).datos.token;
    a.avanzar(90 * 86_400_000 + 1);
    expect((await a.pedir('/api/v1/sesion', { token: otra })).status).toBe(401);
  });

  it('la contraseña de administrador sirve de respaldo', async () => {
    const a = await preparar();
    expect((await a.pedir('/api/v1/sesion', { token: 'contraseña-larga-de-respaldo' })).status).toBe(200);
    expect((await a.pedir('/api/v1/sesion', { token: 'contraseña-larga-de-respald0' })).status).toBe(401);
  });

  it('un agente sin llave de teléfono lo dice claro', async () => {
    const a = await preparar();
    const { mensaje } = (await a.pedir('/api/v1/sesion/reto', { metodo: 'POST' })).datos;
    const r = await a.pedir('/api/v1/sesion/entrar', { cuerpo: { mensaje, firma: await a.tel.firmar(mensaje) }, env: {} });
    expect(r).toMatchObject({ status: 409 });
  });

  it('convierte las firmas de Android (DER) y rechaza las mal formadas', () => {
    const r = new Uint8Array(32).fill(0x11), s = new Uint8Array(32).fill(0x80);
    const der = Uint8Array.from([0x30, 69, 0x02, 32, ...r, 0x02, 33, 0, ...s]);
    expect([...derARaw(der)!]).toEqual([...r, ...s]);
    expect(derARaw(Uint8Array.from([0x31, 0]))).toBeNull();
    expect(derARaw(der.subarray(0, 40))).toBeNull();
  });
});

describe('Avisos para el teléfono', () => {
  it('al conectar por primera vez deja un aviso de bienvenida, y solo esa vez', async () => {
    const a = await preparar();
    const { token } = (await a.entrar()).datos;
    await a.entrar();
    const r = (await a.pedir('/api/v1/avisos', { token })).datos;
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0]).toMatchObject({ tipo: 'nube', titulo: 'Tu nube está conectada', ts: AHORA });
    expect(r.ahora).toBe(AHORA);
  });

  it('solo devuelve los posteriores al último que ya viste', async () => {
    const a = await preparar();
    const { token } = (await a.entrar()).datos;
    await avisar(a.almacen, AHORA, { tipo: 'propuesta', titulo: 'Propuesta nueva', texto: 'Comprar 10 de «Sí»' });
    await avisar(a.almacen, AHORA, { tipo: 'orden', titulo: 'Orden ejecutada', texto: '10 a 0,31' });
    const todos = (await a.pedir('/api/v1/avisos', { token })).datos.avisos;
    expect(todos.map((x: any) => x.tipo)).toEqual(['nube', 'propuesta', 'orden']);
    expect(new Set(todos.map((x: any) => x.id)).size).toBe(3);
    const nuevos = (await a.pedir(`/api/v1/avisos?desde=${todos[1].ts}`, { token })).datos.avisos;
    expect(nuevos.map((x: any) => x.titulo)).toEqual(['Orden ejecutada']);
  });

  it('guarda como mucho los últimos 50', async () => {
    const a = await preparar();
    for (let i = 0; i < 60; i++) await avisar(a.almacen, AHORA + i, { tipo: 'orden', titulo: `n${i}`, texto: '' });
    const lista = await a.almacen.leer<any[]>('avisos');
    expect(lista).toHaveLength(50);
    expect(lista![0].titulo).toBe('n10');
  });
});
