// Instalador, sesión por huella y avisos, con GitHub, Cloudflare, el agente y el teléfono simulados.
import blake from 'blakejs';
import nacl from 'tweetnacl';
import { describe, expect, it } from 'vitest';
import { almacenMemoria } from '../src/almacen';
import { crearAgente } from '../src/worker';
import { abrir } from './pantalla';
import { AHORA, hyperliquidSimulado } from './simulada';
import { telefonoSimulado } from './telefono';

const URL_AGENTE = 'https://cardon-predicciones.cardon-abc123.workers.dev';
const CUENTA = '0123456789abcdef0123456789abcdef';
const TOKEN_GH = 'ghp_' + 'x'.repeat(36);
const TOKEN_CF = 'cf_' + 'y'.repeat(37);

async function mundo(op: { sinD1?: boolean; fallaDespliegue?: boolean; sinBloqueo?: boolean } = {}) {
  const tel = await telefonoSimulado();
  const sim = hyperliquidSimulado();
  const caja = nacl.box.keyPair(); // la llave con la que GitHub recibe los secretos cifrados
  const gh = { repo: false, secretos: {} as Record<string, string>, lanzado: false, consultas: 0, pedidos: [] as string[] };
  const almacen = almacenMemoria();
  const agente = crearAgente({ fetch: sim.red, ahora: () => AHORA, almacen });
  let env: any = null; // el agente no existe hasta que el instalador lo despliega
  const abrirSecreto = (b64: string) => {
    const c = Buffer.from(b64, 'base64'), epk = c.subarray(0, 32);
    const claro = nacl.box.open(c.subarray(32), blake.blake2b(Buffer.concat([epk, caja.publicKey]), undefined, 24), epk, caja.secretKey);
    if (!claro) throw new Error('secreto mal cifrado');
    return Buffer.from(claro).toString();
  };
  const r = (status: number, datos: unknown = {}) => new Response(status === 204 ? null : JSON.stringify(datos), { status });
  const red = (async (u: unknown, init: RequestInit = {}) => {
    const url = String(u), metodo = init.method || 'GET', cab = (init.headers || {}) as Record<string, string>;
    if (url.startsWith('https://api.hyperliquid.xyz/')) return sim.red(url, init);
    if (url.startsWith(URL_AGENTE)) return env ? agente.fetch(new Request(url, init), env) : r(404, { error: 'aún no desplegado' });
    if (url.startsWith('https://api.cloudflare.com/client/v4/')) {
      if (cab.Authorization !== 'Bearer ' + TOKEN_CF || !url.includes('/accounts/' + CUENTA + '/')) return r(403, { success: false });
      return url.includes('/d1/') && op.sinD1 ? r(403, { success: false }) : r(200, { success: true, result: [] });
    }
    if (!url.startsWith('https://api.github.com/')) throw new Error('Destino no permitido en pruebas: ' + url);
    const ruta = url.slice('https://api.github.com'.length), base = '/repos/ana/cardon-predicciones-nube';
    gh.pedidos.push(`${metodo} ${ruta}`);
    if (cab.Authorization !== 'Bearer ' + TOKEN_GH) return r(401, { message: 'Bad credentials' });
    if (ruta === '/user') return r(200, { login: 'ana' });
    if (ruta === base) return gh.repo ? r(200, { default_branch: 'main' }) : r(404, { message: 'Not Found' });
    if (ruta === '/repos/tradiabot/cardon-predicciones/generate' && metodo === 'POST') {
      const c = JSON.parse(String(init.body));
      if (c.private !== true || c.owner !== 'ana' || c.name !== 'cardon-predicciones-nube') return r(422, { message: 'repo mal pedido' });
      gh.repo = true;
      return r(201, { default_branch: 'main' });
    }
    if (!gh.repo) return r(404, { message: 'Not Found' });
    if (ruta.startsWith(base + '/contents/.github/workflows/instalar.yml')) return r(200, {});
    if (ruta === base + '/actions/secrets/public-key') return r(200, { key: Buffer.from(caja.publicKey).toString('base64'), key_id: 'k1' });
    if (ruta.startsWith(base + '/actions/secrets/') && metodo === 'PUT') {
      const c = JSON.parse(String(init.body));
      if (c.key_id !== 'k1') return r(422, { message: 'key_id' });
      gh.secretos[ruta.split('/').pop()!] = abrirSecreto(c.encrypted_value);
      return r(201);
    }
    if (ruta === base + '/actions/workflows/instalar.yml/dispatches' && metodo === 'POST') {
      gh.lanzado = true;
      return r(204);
    }
    if (ruta.startsWith(base + '/actions/workflows/instalar.yml/runs')) {
      if (!gh.lanzado) return r(200, { workflow_runs: [] });
      if (gh.consultas++ < 1) return r(200, { workflow_runs: [{ status: 'in_progress', created_at: new Date(AHORA).toISOString() }] });
      // Aquí es donde, de verdad, instalar.yml despliega el agente con lo que hay en los secretos.
      if (!op.fallaDespliegue) env = { DEVICE_PUBLIC_KEY: gh.secretos.DEVICE_PUBLIC_KEY, ADMIN_TOKEN: gh.secretos.ADMIN_TOKEN };
      return r(200, { workflow_runs: [{ status: 'completed', conclusion: op.fallaDespliegue ? 'failure' : 'success', html_url: 'https://github.com/ana/cardon-predicciones-nube/actions/runs/1', created_at: new Date(AHORA).toISOString() }] });
    }
    if (ruta.startsWith(base + '/contents/cardon.json')) return r(200, { content: Buffer.from(JSON.stringify({ url: URL_AGENTE })).toString('base64') });
    return r(404, { message: 'Not Found: ' + ruta });
  }) as typeof fetch;

  // El teléfono: llave en su almacén seguro, huella y vigilante de avisos.
  const movil = { llave: false, huellas: 0, cancelar: false, nube: null as null | [string, string], vigiladas: null as any, permiso: false, pruebas: [] as string[][] };
  const nativo = (w: any) => ({
    huellaEstado: () => JSON.stringify({ disponible: true, publica: movil.llave ? tel.publica : null }),
    crearLlave: () => {
      if (op.sinBloqueo) return JSON.stringify({ error: 'SIN_BLOQUEO_DE_PANTALLA' });
      movil.llave = true;
      return JSON.stringify({ publica: tel.publica });
    },
    firmar: (mensaje: string) => {
      if (!movil.llave) return JSON.stringify({ error: 'SIN_LLAVE' });
      movil.huellas++;
      (movil.cancelar ? Promise.resolve(JSON.stringify({ error: 'CANCELADO' })) : tel.firmar(mensaje).then((firma) => JSON.stringify({ mensaje, firma }))).then((x) => w.onHuella(x));
      return JSON.stringify({ pendiente: true });
    },
    guardarNube: (api: string, token: string) => void (movil.nube = [api, token]),
    guardarVigiladas: (json: string, idioma: string, titulo: string, texto: string) => void (movil.vigiladas = { lista: JSON.parse(json), idioma, titulo, texto }),
    avisosEstado: () => JSON.stringify({ permiso: movil.permiso, estado: movil.nube?.[0] ? 'ok' : 'sin_nube', ts: AHORA }),
    pedirPermisoAvisos: () => void (movil.permiso = true),
    probarAvisos: (titulo: string, texto: string) => void movil.pruebas.push([titulo, texto]),
  });
  return { tel, gh, red, nativo, movil, almacen, desplegar: () => (env = { DEVICE_PUBLIC_KEY: tel.publica, ADMIN_TOKEN: 'respaldo-muy-largo' }) };
}

async function hastaInstalar(m: Awaited<ReturnType<typeof mundo>>, op: Parameters<typeof abrir>[0] = {}) {
  const a = await abrir({ red: m.red, nativo: m.nativo, ...op });
  a.tocar(a.q('.nav [data-target="config"]'));
  a.tocar(a.q('#nube-instalar'));
  a.tocar(a.q('#i-seguir')); // Empezar
  a.tocar(a.q('#h-crear'));
  a.tocar(a.q('#i-seguir'));
  a.escribir('#gh-token', TOKEN_GH);
  a.tocar(a.q('#i-seguir'));
  await a.esperar(() => a.q('#cf-cuenta'), 'el paso de Cloudflare');
  a.escribir('#cf-cuenta', CUENTA);
  a.escribir('#cf-token', TOKEN_CF);
  a.tocar(a.q('#i-seguir'));
  await a.esperar(() => a.q('#i-registro'), 'el último paso');
  return a;
}

describe('Instalador de la nube', () => {
  it('sin nube, la app lo dice y ofrece instalarla', async () => {
    const m = await mundo();
    const a = await abrir({ red: m.red, nativo: m.nativo });
    expect(a.q('#nube').textContent).toContain('SIN INSTALAR');
    expect(a.q('#estado-nube').textContent).toBe('SOLO LECTURA');
    expect(a.q('#nube-entrar')).toBeNull();
    expect(m.gh.pedidos).toEqual([]);
  });

  it('instala de principio a fin: repo privado, claves cifradas, despliegue y sesión con huella', async () => {
    const m = await mundo();
    const a = await hastaInstalar(m);
    expect(a.q('#r-gh').textContent).toBe('ana');
    expect(a.q('.setup-summary').textContent).toContain('Simulación');
    a.tocar(a.q('#i-seguir'));
    await a.esperar(() => !a.q('#instalador'), 'el fin de la instalación');
    // GitHub recibió las cuatro claves, cifradas para él, con los valores correctos.
    expect(Object.keys(m.gh.secretos).sort()).toEqual(['ADMIN_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'DEVICE_PUBLIC_KEY']);
    expect(m.gh.secretos).toMatchObject({ CLOUDFLARE_API_TOKEN: TOKEN_CF, CLOUDFLARE_ACCOUNT_ID: CUENTA, DEVICE_PUBLIC_KEY: m.tel.publica });
    expect(m.gh.secretos.ADMIN_TOKEN).toMatch(/^[0-9a-f]{48}$/);
    // La app queda conectada, con sesión de huella (no con la contraseña de administrador).
    expect(a.w.localStorage.getItem('cardon-pred-api')).toBe(URL_AGENTE + '/api/v1');
    const sesion = a.w.localStorage.getItem('cardon-pred-sesion');
    expect(sesion).toMatch(/^[0-9a-f]{64}$/);
    expect(sesion).not.toBe(m.gh.secretos.ADMIN_TOKEN);
    expect(m.movil.huellas).toBe(1);
    expect(a.q('#nube').textContent).toContain('CONECTADA');
    expect(a.q('#nube').textContent).toContain(URL_AGENTE);
    expect(a.q('#estado-nube').textContent).toBe('CONECTADA');
    // El vigilante de avisos ya sabe a quién preguntar, y el agente dejó su aviso de bienvenida.
    expect(m.movil.nube).toEqual([URL_AGENTE + '/api/v1', sesion]);
    expect((await m.almacen.leer<any[]>('avisos'))!.map((x) => x.titulo)).toEqual(['Tu nube está conectada']);
  });

  it('los tokens de GitHub y Cloudflare no quedan guardados en el teléfono', async () => {
    const m = await mundo();
    const a = await hastaInstalar(m);
    a.tocar(a.q('#i-seguir'));
    await a.esperar(() => !a.q('#instalador'), 'el fin de la instalación');
    const guardado = JSON.stringify({ ...a.w.localStorage }) + JSON.stringify(m.movil.nube);
    for (const secreto of [TOKEN_GH, TOKEN_CF, m.gh.secretos.ADMIN_TOKEN]) expect(guardado).not.toContain(secreto);
    expect(a.d.body.innerHTML).not.toContain(TOKEN_GH);
  });

  it('si el repositorio ya existe lo reutiliza (reinstalar o actualizar)', async () => {
    const m = await mundo();
    m.gh.repo = true;
    const a = await hastaInstalar(m);
    a.tocar(a.q('#i-seguir'));
    await a.esperar(() => !a.q('#instalador'), 'el fin de la instalación');
    expect(m.gh.pedidos.some((p) => p.includes('/generate'))).toBe(false);
  });

  it('rechaza un token de GitHub malo y un Cloudflare sin permiso D1, diciendo por qué', async () => {
    const m = await mundo({ sinD1: true });
    const a = await abrir({ red: m.red, nativo: m.nativo });
    a.tocar(a.q('#nube-instalar'));
    a.tocar(a.q('#i-seguir'));
    a.tocar(a.q('#h-crear'));
    a.tocar(a.q('#i-seguir'));
    a.escribir('#gh-token', 'ghp_' + 'z'.repeat(36));
    a.tocar(a.q('#i-seguir'));
    await a.esperar(() => a.q('#gh-nota').textContent === 'GitHub no reconoce ese token.', 'el rechazo de GitHub');
    a.escribir('#gh-token', TOKEN_GH);
    a.tocar(a.q('#i-seguir'));
    await a.esperar(() => a.q('#cf-cuenta'), 'el paso de Cloudflare');
    a.escribir('#cf-cuenta', 'corto');
    a.escribir('#cf-token', TOKEN_CF);
    a.tocar(a.q('#i-seguir'));
    expect(a.q('#cf-nota').textContent).toBe('El Account ID son 32 letras y números.');
    a.escribir('#cf-cuenta', CUENTA);
    a.tocar(a.q('#i-seguir'));
    await a.esperar(() => a.q('#cf-nota').textContent!.includes('D1'), 'el aviso de D1');
    expect(a.q('#i-registro')).toBeNull();
  });

  it('sin bloqueo de pantalla no se puede crear la llave, y lo explica', async () => {
    const m = await mundo({ sinBloqueo: true });
    const a = await abrir({ red: m.red, nativo: m.nativo });
    a.tocar(a.q('#nube-instalar'));
    a.tocar(a.q('#i-seguir'));
    a.tocar(a.q('#h-crear'));
    expect(a.q('#h-nota').textContent).toContain('Activa primero el bloqueo de pantalla');
    expect((a.q('#i-seguir') as HTMLButtonElement).disabled).toBe(true);
  });

  it('si el despliegue falla, muestra el error real con el enlace y deja reintentar', async () => {
    const m = await mundo({ fallaDespliegue: true });
    const a = await hastaInstalar(m);
    a.tocar(a.q('#i-seguir'));
    await a.esperar(() => a.q('#i-registro .bad'), 'el error');
    expect(a.q('#i-registro .bad').textContent).toContain('la instalación falló en GitHub Actions. Detalle: https://github.com/ana/cardon-predicciones-nube/actions/runs/1');
    expect(a.q('#i-seguir').textContent).toBe('Reintentar');
    expect(a.w.localStorage.getItem('cardon-pred-api')).toBeNull();
  });

  it('no se abre antes de aceptar el aviso legal', async () => {
    const m = await mundo();
    const a = await abrir({ red: m.red, nativo: m.nativo, aceptado: false });
    a.tocar(a.q('#nube-instalar'));
    expect(a.q('#instalador')).toBeNull();
  });

  it('también en inglés', async () => {
    const m = await mundo();
    const a = await abrir({ red: m.red, nativo: m.nativo, idioma: 'en' });
    expect(a.q('#nube').textContent).toContain('NOT INSTALLED');
    a.tocar(a.q('#nube-instalar'));
    expect(a.q('#instalador h2').textContent).toBe('Your agent, in your own cloud');
  });
});

describe('Sesión por huella desde la app', () => {
  const conNube = { 'cardon-pred-api': URL_AGENTE + '/api/v1' };

  it('con nube pero sin sesión, ofrece entrar con huella y entra', async () => {
    const m = await mundo();
    m.desplegar();
    m.movil.llave = true;
    const a = await abrir({ red: m.red, nativo: m.nativo, local: conNube });
    expect(a.q('#nube').textContent).toContain('SIN SESIÓN');
    a.tocar(a.q('#nube-entrar'));
    await a.esperar(() => a.q('#nube').textContent!.includes('CONECTADA'), 'la sesión');
    expect(m.movil.huellas).toBe(1);
    expect(a.q('#nube-entrar')).toBeNull();
  });

  it('si cancelas la huella no entra y lo dice', async () => {
    const m = await mundo();
    m.desplegar();
    m.movil.llave = true;
    m.movil.cancelar = true;
    const a = await abrir({ red: m.red, nativo: m.nativo, local: conNube });
    a.tocar(a.q('#nube-entrar'));
    await a.esperar(() => a.q('#nube-nota').textContent === 'Cancelado.', 'el aviso de cancelado');
    expect(a.w.localStorage.getItem('cardon-pred-sesion')).toBeFalsy();
  });

  it('un teléfono que no instaló la nube no entra, con el motivo real', async () => {
    const m = await mundo(), otro = await mundo();
    otro.desplegar(); // la nube conoce la llave de OTRO teléfono
    m.movil.llave = true;
    const a = await abrir({ red: otro.red, nativo: m.nativo, local: conNube });
    a.tocar(a.q('#nube-entrar'));
    await a.esperar(() => a.q('#nube-nota').textContent!.includes('no es el que instaló'), 'el rechazo');
  });

  it('una sesión guardada que sigue valiendo se reconoce al abrir; cerrar sesión la invalida', async () => {
    const m = await mundo();
    m.desplegar();
    m.movil.llave = true;
    const a = await abrir({ red: m.red, nativo: m.nativo, local: conNube });
    a.tocar(a.q('#nube-entrar'));
    await a.esperar(() => a.q('#nube-salir'), 'la sesión');
    const sesion = a.w.localStorage.getItem('cardon-pred-sesion');
    const b = await abrir({ red: m.red, nativo: m.nativo, local: { ...conNube, 'cardon-pred-sesion': sesion } });
    await b.esperar(() => b.q('#nube').textContent!.includes('CONECTADA'), 'la sesión guardada');
    expect(m.movil.huellas).toBe(1);
    b.tocar(b.q('#nube-salir'));
    await b.esperar(() => b.q('#nube').textContent!.includes('SIN SESIÓN'), 'el cierre');
    const c = await abrir({ red: m.red, nativo: m.nativo, local: { ...conNube, 'cardon-pred-sesion': sesion } });
    await c.esperar(() => c.q('#nube-entrar'), 'la sesión ya no vale');
  });

  it('conectar una nube ya instalada: con la huella o con la contraseña de administrador', async () => {
    const m = await mundo();
    m.desplegar();
    m.movil.llave = true;
    const a = await abrir({ red: m.red, nativo: m.nativo });
    a.tocar(a.q('#nube-instalar'));
    a.escribir('#ya-url', 'cardon.workers.dev');
    a.tocar(a.q('#ya-huella'));
    expect(a.q('#ya-nota').textContent).toBe('Revisa la dirección (https://…).');
    a.escribir('#ya-url', URL_AGENTE);
    a.tocar(a.q('#ya-huella'));
    await a.esperar(() => !a.q('#instalador'), 'la conexión');
    expect(a.q('#nube').textContent).toContain('CONECTADA');
    const b = await abrir({ red: m.red, nativo: m.nativo });
    b.tocar(b.q('#nube-instalar'));
    b.escribir('#ya-url', URL_AGENTE);
    b.escribir('#ya-clave', 'contraseña-equivocada');
    b.tocar(b.q('#ya-clave-ir'));
    await b.esperar(() => b.q('#ya-nota').textContent!.includes('Sesión no válida'), 'el rechazo');
    b.escribir('#ya-clave', 'respaldo-muy-largo');
    b.tocar(b.q('#ya-clave-ir'));
    await b.esperar(() => !b.q('#instalador'), 'la conexión con contraseña');
  });
});

describe('Avisos en el teléfono', () => {
  it('pasa al vigilante los mercados guardados con su vencimiento y los textos en tu idioma', async () => {
    const m = await mundo();
    const a = await abrir({ red: m.red, nativo: m.nativo });
    await a.listo();
    expect(m.movil.vigiladas.lista).toEqual([]);
    a.tocar(a.q('[data-estrella="hyperliquid:10999"]'));
    expect(m.movil.vigiladas).toEqual({ lista: [{ k: 'hyperliquid:10999', pregunta: '¿SOL ≥ 109,32 al vencer?', vence: Date.UTC(2026, 9, 12, 6, 0) }], idioma: 'es', titulo: 'Venció un mercado que guardaste', texto: 'Se liquida solo: no hay que vender.' });
    a.tocar(a.q('[data-idioma="en"]'));
    expect(m.movil.vigiladas).toMatchObject({ idioma: 'en', titulo: 'A market you saved has expired' });
    a.tocar(a.q('[data-estrella="hyperliquid:10999"]'));
    expect(m.movil.vigiladas.lista).toEqual([]);
  });

  it('pide el permiso y envía un aviso de prueba', async () => {
    const m = await mundo();
    const a = await abrir({ red: m.red, nativo: m.nativo });
    expect(a.q('#avisos-panel').textContent).toContain('SIN PERMISO');
    expect(a.q('#avisos-estado').textContent).toContain('Sin nube conectada');
    a.tocar(a.q('#avisos-activar'));
    expect(m.movil.permiso).toBe(true);
    a.tocar(a.q('#avisos-probar'));
    expect(m.movil.pruebas).toEqual([['Cardón Predicciones', 'Así se ven los avisos. Todo en orden.']]);
  });

  it('fuera de la app Android lo dice en vez de fingir', async () => {
    const a = await abrir();
    expect(a.q('#avisos-panel').textContent).toContain('Solo disponible en la app Android');
    a.tocar(a.q('#nube-instalar'));
    a.tocar(a.q('#i-seguir'));
    expect(a.q('#h-nota').textContent).toBe('Solo disponible en la app Android.');
  });
});
