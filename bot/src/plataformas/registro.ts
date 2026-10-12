// La lista de plataformas. Sumar una es: escribir su módulo y añadir aquí una línea.
import { crearHyperliquid } from './hyperliquid';
import { type Entorno, ErrorPlataforma, type Plataforma } from './tipos';

export type Fabrica = (entorno: Entorno) => Plataforma;

export const PLATAFORMAS: Fabrica[] = [crearHyperliquid];

export function crearPlataformas(entorno: Entorno, fabricas: Fabrica[] = PLATAFORMAS): Plataforma[] {
  return fabricas.map((f) => f(entorno));
}

export function buscarPlataforma(lista: Plataforma[], id: string): Plataforma {
  const p = lista.find((x) => x.id === id);
  if (!p) throw new ErrorPlataforma(id, `Plataforma desconocida: ${id}`);
  return p;
}
