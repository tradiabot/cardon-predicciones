// «Feria»: una plataforma de ejemplo, inventada, que vive entera en memoria. Demuestra que
// sumar una plataforma es este módulo y una entrada en la lista, sin tocar pantallas ni reglas.
import { type Credenciales, type Entorno, ErrorPlataforma, type Mercado, type PedidoOrden, type Plataforma, type ResultadoOrden } from '../src/plataformas/tipos';

export function crearFalsa(entorno: Entorno): Plataforma {
  const ahora = entorno.ahora || Date.now;
  const saldos = { libre: 100 };
  const tengo: Record<string, { unidades: number; costo: number }> = {};
  const mercado = (id: string, pregunta: string, si: number): Mercado => ({
    plataforma: 'feria', id, pregunta, regla: null, categoria: 'otro', plazo: 'mediano', vence: ahora() + 72 * 3_600_000, horas: 72,
    lados: [
      { id: `${id}-si`, nombre: 'Sí', precio: si },
      { id: `${id}-no`, nombre: 'No', precio: Math.round((1 - si) * 1000) / 1000 },
    ],
    moneda: 'FICHAS', creador: 'Feria', comision_doble: false, sin_ofertas: false, subyacente: null, precio_actual: null, objetivo: null, distancia_pct: null,
  });
  const lista = () => [mercado('lluvia', '¿Llueve el domingo en la feria?', 0.3), mercado('tombola', '¿Sale el 7 en la tómbola?', 0.08)];
  const precioDe = (lado: string) => {
    const l = lista().flatMap((m) => m.lados).find((x) => x.id === lado);
    if (!l || l.precio == null) throw new ErrorPlataforma('feria', 'Ese lado no existe en la Feria');
    return l.precio;
  };
  const operar = (p: PedidoOrden, compra: boolean): ResultadoOrden => {
    const precio = precioDe(p.lado);
    const vacio = { plataforma: 'feria', lado: p.lado, unidades: 0, precio: 0, total: 0, id: null };
    if (compra ? precio > p.limite : precio < p.limite) return vacio;
    const total = Math.round(p.unidades * precio * 100) / 100;
    const t = (tengo[p.lado] ||= { unidades: 0, costo: precio });
    if (compra) {
      if (total > saldos.libre) throw new ErrorPlataforma('feria', 'No te alcanzan las fichas');
      saldos.libre -= total;
      t.unidades += p.unidades;
    } else {
      if (p.unidades > t.unidades) throw new ErrorPlataforma('feria', 'No tienes tantas unidades');
      saldos.libre += total;
      t.unidades -= p.unidades;
    }
    return { plataforma: 'feria', lado: p.lado, unidades: p.unidades, precio, total, id: `feria-${ahora()}` };
  };
  return {
    id: 'feria',
    nombre: 'Feria',
    moneda: 'FICHAS',
    minimo_orden: 1,
    claves: [{ id: 'boleto', nombre: 'Número de boleto', secreta: true }],
    listarMercados: async () => ({ plataforma: 'feria', ts: ahora(), mercados: lista() }),
    libro: async (lado) => ({ plataforma: 'feria', lado, ts: ahora(), compras: [{ precio: precioDe(lado) - 0.01, unidades: 50 }], ventas: [{ precio: precioDe(lado), unidades: 50 }] }),
    saldo: async (_c: Credenciales) => ({ plataforma: 'feria', moneda: 'FICHAS', libre: saldos.libre, total: saldos.libre }),
    posiciones: async () =>
      Object.entries(tengo)
        .filter(([, v]) => v.unidades > 0)
        .map(([lado, v]) => ({ plataforma: 'feria', mercado: lado.replace(/-(si|no)$/, ''), lado, unidades: v.unidades, costo: v.costo })),
    comprar: async (p) => operar(p, true),
    vender: async (p) => operar(p, false),
    cobrar: async () => 0,
  };
}
