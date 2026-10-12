// Ajustes de IA del agente, editables desde la app: qué modelos usar, en qué orden, el consenso
// y las claves de cada proveedor. Las claves se guardan cifradas (AES-GCM, con una llave que sale
// de ADMIN_TOKEN) y nunca vuelven enteras: la app solo ve «gsk_…6tQF».
import type { Almacen } from '../almacen';
import type { Idioma } from '../plataformas/tipos';
import type { Consenso, Pausas } from './analizar';
import { type Claves, type IdProveedor, IDS_PROVEEDOR, MODELOS_SIN_CLAVE, partirModelo, PROVEEDORES, recortar } from './proveedores';

export interface AjustesIA {
  modelos: string[];
  consenso: Consenso;
}
export interface UltimaIA {
  ts: number;
  ok: boolean;
  que: 'analisis' | 'prueba';
  detalle: string;
}
export const MAX_MODELOS = 8;
export const AJUSTES_INICIALES: AjustesIA = { modelos: MODELOS_SIN_CLAVE, consenso: { activo: true, tamano: 2 } };

interface Cifrado {
  iv: string;
  datos: string;
}
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const deB64 = (t: string) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));

async function llave(admin: string | undefined): Promise<CryptoKey> {
  if (!admin) throw new Error('Al agente le falta ADMIN_TOKEN: no puede cifrar tus claves. Vuelve a instalarlo desde la app.');
  const crudo = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`cardon-predicciones:ia:${admin}`));
  return crypto.subtle.importKey('raw', crudo, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function leerClaves(almacen: Almacen, admin: string | undefined): Promise<Claves> {
  const c = await almacen.leer<Cifrado>('ia_claves');
  if (!c) return {};
  try {
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(c.iv) as BufferSource }, await llave(admin), deB64(c.datos) as BufferSource);
    return JSON.parse(new TextDecoder().decode(claro)) as Claves;
  } catch {
    return {}; // ADMIN_TOKEN cambió (reinstalación): esas claves ya no se pueden leer y hay que ponerlas otra vez
  }
}

async function guardarClaves(almacen: Almacen, admin: string | undefined, claves: Claves): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const datos = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, await llave(admin), new TextEncoder().encode(JSON.stringify(claves)));
  await almacen.guardar('ia_claves', { iv: b64(iv), datos: b64(new Uint8Array(datos)) } satisfies Cifrado);
}

export async function leerAjustes(almacen: Almacen): Promise<AjustesIA> {
  const a = await almacen.leer<AjustesIA>('ia_config');
  return a?.modelos?.length ? a : AJUSTES_INICIALES;
}
export async function leerPausas(almacen: Almacen, ahora: number): Promise<Pausas> {
  const p = (await almacen.leer<Pausas>('ia_pausas')) || {};
  return Object.fromEntries(Object.entries(p).filter(([, hasta]) => hasta > ahora));
}
/** Solo escribe si hay pausas nuevas: cada escritura cuenta en el plan gratuito. */
export async function sumarPausas(almacen: Almacen, ahora: number, nuevas: Pausas): Promise<void> {
  if (!Object.keys(nuevas).length) return;
  await almacen.guardar('ia_pausas', { ...(await leerPausas(almacen, ahora)), ...nuevas });
}
export async function anotarUltima(almacen: Almacen, ultima: UltimaIA): Promise<void> {
  await almacen.guardar('ia_ultima', { ...ultima, detalle: ultima.detalle.slice(0, 200) });
}

/** Lo que ve la app: catálogo, qué proveedores tienen clave (recortada) y los ajustes vigentes. */
export async function vistaIA(almacen: Almacen, admin: string | undefined, ahora: number, idioma: Idioma = 'es') {
  const [ajustes, claves, pausas, ultima] = await Promise.all([leerAjustes(almacen), leerClaves(almacen, admin), leerPausas(almacen, ahora), almacen.leer<UltimaIA>('ia_ultima')]);
  return {
    proveedores: IDS_PROVEEDOR.map((id) => {
      const p = PROVEEDORES[id];
      const clave = claves[id];
      return { id, nombre: p.nombre, pide_clave: p.pide_clave, alta: p.alta, nota: p.nota[idioma === 'en' ? 1 : 0], modelos: p.modelos.map((m) => `${id}:${m}`), tiene_clave: !p.pide_clave || !!clave, clave: clave ? recortar(clave) : null };
    }),
    modelos: ajustes.modelos,
    consenso: ajustes.consenso,
    pausas,
    ultima: ultima || null,
    max_modelos: MAX_MODELOS,
  };
}

export interface CambioIA {
  claves?: Record<string, string | null>;
  modelos?: unknown;
  consenso?: { activo?: unknown; tamano?: unknown };
}

export async function cambiarIA(almacen: Almacen, admin: string | undefined, cuerpo: CambioIA): Promise<{ error: string } | { ok: true }> {
  let ajustes = await leerAjustes(almacen);
  let tocado = false;
  if (cuerpo.claves && typeof cuerpo.claves === 'object') {
    const claves = await leerClaves(almacen, admin);
    for (const [id, valor] of Object.entries(cuerpo.claves)) {
      if (!(id in PROVEEDORES) || !PROVEEDORES[id as IdProveedor].pide_clave) return { error: `Ese proveedor no usa clave: ${id.slice(0, 20)}` };
      const p = id as IdProveedor;
      const deEste = (m: string) => partirModelo(m)?.proveedor === p;
      if (valor === null || valor === '') {
        delete claves[p];
        // Sin clave, sus modelos solo darían error: se quitan de la lista.
        const resto = ajustes.modelos.filter((m) => !deEste(m));
        ajustes = { ...ajustes, modelos: resto.length ? resto : AJUSTES_INICIALES.modelos };
      } else {
        const clave = String(valor).trim();
        if (clave.length < 12 || clave.length > 300 || /\s/.test(clave)) return { error: `La clave de ${PROVEEDORES[p].nombre} no tiene buena forma: cópiala entera, sin espacios.` };
        claves[p] = clave;
        // Con la clave puesta, su primer modelo entra a la lista para que se use sin más pasos.
        if (!ajustes.modelos.some(deEste) && ajustes.modelos.length < MAX_MODELOS) ajustes = { ...ajustes, modelos: [`${p}:${PROVEEDORES[p].modelos[0]}`, ...ajustes.modelos] };
      }
      tocado = true;
    }
    await guardarClaves(almacen, admin, claves);
  }
  if (cuerpo.modelos !== undefined) {
    if (!Array.isArray(cuerpo.modelos)) return { error: 'La lista de modelos no llegó bien.' };
    const modelos = [...new Set(cuerpo.modelos.map((m) => String(m).trim()).filter(Boolean))];
    if (!modelos.length) return { error: 'Deja al menos un modelo.' };
    if (modelos.length > MAX_MODELOS) return { error: `Máximo ${MAX_MODELOS} modelos.` };
    for (const m of modelos) if (!/^[\w.:/-]{3,120}$/.test(m) || !partirModelo(m)) return { error: `Modelo no válido: ${m.slice(0, 60)}. Se escribe proveedor:modelo (${IDS_PROVEEDOR.join(', ')}).` };
    ajustes = { ...ajustes, modelos };
    tocado = true;
  }
  if (cuerpo.consenso !== undefined) {
    const tamano = Number(cuerpo.consenso?.tamano ?? ajustes.consenso.tamano);
    if (!Number.isInteger(tamano) || tamano < 2 || tamano > 5) return { error: 'El consenso usa entre 2 y 5 IA.' };
    ajustes = { ...ajustes, consenso: { activo: cuerpo.consenso?.activo === undefined ? ajustes.consenso.activo : !!cuerpo.consenso.activo, tamano } };
    tocado = true;
  }
  if (tocado) await almacen.guardar('ia_config', ajustes);
  return { ok: true };
}
