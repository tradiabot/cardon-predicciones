// Sesión por huella. Al instalar, el teléfono crea una llave en su almacén seguro (solo se usa
// tras huella, rostro o PIN) y deja aquí su mitad pública. Para entrar, firma un reto de un solo
// uso y el agente le da un token de sesión. Del token solo se guarda su huella digital (SHA-256).
import type { Almacen } from './almacen';

export const PREFIJO = 'Cardón Predicciones · iniciar sesión';
const SESION_MS = 90 * 86_400_000;
const RETO_MS = 5 * 60_000;
const MAX_SESIONES = 5;
const MAX_RETOS = 20;

type Sesiones = Record<string, { creada: number; vence: number }>;
type Retos = Record<string, number>;
export interface Llaves {
  /** Llave pública del teléfono (SPKI en base64, curva P-256). */
  publica?: string;
  /** Contraseña de administrador: método manual de respaldo. */
  admin?: string;
}

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function huella(texto: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
}
// Comparación que tarda lo mismo acierte o no.
async function iguales(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([huella(a), huella(b)]);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0 && a.length > 0;
}

/** Android firma en formato DER; WebCrypto quiere r y s pegados (32 + 32 bytes). */
export function derARaw(der: Uint8Array): Uint8Array | null {
  if (der[0] !== 0x30) return null;
  let i = der[1] & 0x80 ? 2 + (der[1] & 0x7f) : 2;
  const out = new Uint8Array(64);
  for (const base of [0, 32]) {
    if (der[i] !== 0x02) return null;
    const n = der[i + 1];
    let v = der.subarray(i + 2, i + 2 + n);
    if (v.length !== n) return null;
    while (v.length > 32 && v[0] === 0) v = v.subarray(1);
    if (v.length > 32) return null;
    out.set(v, base + 32 - v.length);
    i += 2 + n;
  }
  return i === der.length ? out : null;
}

async function firmaValida(publica: string, mensaje: string, firma: string): Promise<boolean> {
  try {
    const raw = derARaw(b64(firma));
    if (!raw) return false;
    const llave = await crypto.subtle.importKey('spki', b64(publica), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, llave, raw as BufferSource, new TextEncoder().encode(mensaje));
  } catch {
    return false;
  }
}

export function portador(req: Request): string {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

export async function esDueno(req: Request, llaves: Llaves, almacen: Almacen, ahora: number): Promise<boolean> {
  const dado = portador(req);
  if (!dado) return false;
  if (llaves.admin && (await iguales(dado, llaves.admin))) return true;
  const s = ((await almacen.leer<Sesiones>('sesiones')) || {})[hex(await huella(dado))];
  return !!s && s.vence > ahora;
}

export async function reto(almacen: Almacen, ahora: number): Promise<{ mensaje: string; segundos: number }> {
  const unico = crypto.randomUUID();
  const vivos = Object.entries((await almacen.leer<Retos>('retos')) || {})
    .filter(([, hasta]) => hasta > ahora)
    .slice(-(MAX_RETOS - 1));
  await almacen.guardar('retos', Object.fromEntries([...vivos, [unico, ahora + RETO_MS]]));
  return { mensaje: `${PREFIJO} · ${new Date(ahora).toISOString()} · ${unico}`, segundos: RETO_MS / 1000 };
}

export type Entrada = { error: string; status: number } | { token: string; vence: number; primera: boolean };

export async function entrar(llaves: Llaves, almacen: Almacen, cuerpo: { mensaje?: unknown; firma?: unknown }, ahora: number): Promise<Entrada> {
  if (!llaves.publica) return { error: 'Este agente no tiene registrada la llave de ningún teléfono. Vuelve a instalarlo desde la app.', status: 409 };
  const mensaje = String(cuerpo.mensaje ?? ''),
    firma = String(cuerpo.firma ?? '');
  const partes = mensaje.split(' · ');
  if (partes.length !== 4 || `${partes[0]} · ${partes[1]}` !== PREFIJO || !/^[A-Za-z0-9+/=]{80,200}$/.test(firma)) return { error: 'Inicio de sesión con formato inválido', status: 400 };
  const retos = (await almacen.leer<Retos>('retos')) || {};
  const hasta = retos[partes[3]];
  if (!hasta || hasta <= ahora) return { error: 'El reto caducó: inténtalo de nuevo', status: 401 };
  if (!(await firmaValida(llaves.publica, mensaje, firma))) return { error: 'Este teléfono no es el que instaló el agente. Reinstala desde la app o usa la contraseña de administrador.', status: 401 };
  delete retos[partes[3]];
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const previas = (await almacen.leer<Sesiones>('sesiones')) || {};
  const vivas = Object.entries(previas)
    .filter(([, s]) => s.vence > ahora)
    .sort((a, b) => a[1].creada - b[1].creada)
    .slice(-(MAX_SESIONES - 1));
  const vence = ahora + SESION_MS;
  await almacen.guardar('retos', retos);
  await almacen.guardar('sesiones', Object.fromEntries([...vivas, [hex(await huella(token)), { creada: ahora, vence }]]));
  return { token, vence, primera: Object.keys(previas).length === 0 };
}

/** Cierra la sesión del token presentado (la contraseña de administrador no se cierra: se cambia en Cloudflare). */
export async function salir(req: Request, almacen: Almacen): Promise<boolean> {
  const sesiones = (await almacen.leer<Sesiones>('sesiones')) || {};
  const k = hex(await huella(portador(req)));
  if (!sesiones[k]) return false;
  delete sesiones[k];
  await almacen.guardar('sesiones', sesiones);
  return true;
}
