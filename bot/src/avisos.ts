// Avisos del agente para el teléfono: propuestas nuevas, órdenes ejecutadas, mercados vencidos…
// La app los consulta cada tanto y los muestra como notificaciones de Android.
import type { Almacen } from './almacen';

export type TipoAviso = 'nube' | 'propuesta' | 'orden' | 'vencido' | 'pausa';
export interface Aviso {
  id: string;
  ts: number;
  tipo: TipoAviso;
  titulo: string;
  texto: string;
}
const MAX = 50;

export async function avisar(almacen: Almacen, ahora: number, nuevo: Omit<Aviso, 'id' | 'ts'>): Promise<Aviso> {
  const lista = (await almacen.leer<Aviso[]>('avisos')) || [];
  // Dos avisos en el mismo milisegundo no deben pisarse: el ts siempre avanza.
  const ts = Math.max(ahora, (lista.at(-1)?.ts ?? 0) + 1);
  const aviso: Aviso = { id: `${ts}`, ts, tipo: nuevo.tipo, titulo: nuevo.titulo.slice(0, 80), texto: nuevo.texto.slice(0, 240) };
  await almacen.guardar('avisos', [...lista, aviso].slice(-MAX));
  return aviso;
}

export async function avisosDesde(almacen: Almacen, desde: number): Promise<Aviso[]> {
  return ((await almacen.leer<Aviso[]>('avisos')) || []).filter((a) => a.ts > desde);
}
