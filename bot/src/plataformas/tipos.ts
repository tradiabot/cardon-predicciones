// Interfaz común de las plataformas de mercados de predicción.
//
// Todo lo que no es propio de una plataforma (pantallas, órdenes, IA, límites) habla
// solo con esto. Cada mercado, lado, orden y posición lleva `plataforma` desde que nace.
// Para sumar una plataforma: un módulo que cumpla `Plataforma` y una entrada en registro.ts.

export type Idioma = 'es' | 'en';
export type Categoria = 'cripto' | 'bolsa' | 'economia' | 'otro';

export interface Lado {
  /** Identificador del lado dentro de su plataforma (en Hyperliquid, «#104640»). */
  id: string;
  nombre: string;
  /** Precio medio de 0 a 1 (la probabilidad que le da el mercado). null = sin precio. */
  precio: number | null;
  /** Cuánto cambió el precio frente a ayer, en puntos de precio (0,05 = +5 puntos). */
  cambio?: number | null;
}

export interface Mercado {
  plataforma: string;
  /** Identificador del mercado dentro de su plataforma. */
  id: string;
  pregunta: string;
  /** Cómo se decide quién gana, en una frase. */
  regla: string | null;
  categoria: Categoria;
  /** «hoy» si vence en las próximas horas; si no, «mediano». */
  plazo: 'hoy' | 'mediano';
  vence: number | null;
  horas: number | null;
  lados: Lado[];
  /** Moneda en la que se paga y se cobra. */
  moneda: string;
  creador: string;
  /** El creador cobra su parte: la comisión es el doble. */
  comision_doble: boolean;
  /** Libro vacío: el precio que se ve no es real. */
  sin_ofertas: boolean;
  /** Activo del que depende (mercados de precio) y cuánto vale ahora. */
  subyacente: string | null;
  precio_actual: number | null;
  objetivo: number | null;
  distancia_pct: number | null;
  /** Nombre del activo dentro de su plataforma (para pedir su historia). */
  subyacente_id?: string | null;
  /** Cuánto cambió el activo frente a ayer, en %. */
  cambio_subyacente_pct?: number | null;
  /** Cuánto se movió en el último día, en `moneda`. */
  volumen?: number | null;
}

/** Cómo se ha movido el activo del que depende un mercado. */
export interface Historia {
  cambio_24h_pct: number | null;
  rango_24h: [number, number] | null;
  cambio_7d_pct: number | null;
  rango_7d: [number, number] | null;
}

export interface ListaMercados {
  plataforma: string;
  ts: number;
  mercados: Mercado[];
}

export interface Nivel {
  precio: number;
  unidades: number;
}

export interface Libro {
  plataforma: string;
  lado: string;
  ts: number;
  /** Quienes compran, del que más paga al que menos. */
  compras: Nivel[];
  /** Quienes venden, del más barato al más caro. */
  ventas: Nivel[];
}

export interface Saldo {
  plataforma: string;
  moneda: string;
  libre: number;
  total: number;
}

export interface Posicion {
  plataforma: string;
  mercado: string;
  lado: string;
  unidades: number;
  /** Lo que pagaste por unidad en promedio (null si la plataforma no lo dice). */
  costo: number | null;
}

export interface PedidoOrden {
  lado: string;
  unidades: number;
  /** Compra: pagas como máximo esto. Venta: cobras como mínimo esto. De 0,001 a 0,999. */
  limite: number;
}

export interface ResultadoOrden {
  plataforma: string;
  lado: string;
  /** Lo que de verdad se llenó (puede ser 0 o menos de lo pedido). */
  unidades: number;
  precio: number;
  total: number;
  id: string | null;
}

/** Lo que cada plataforma necesita para leer tu cuenta y firmar. Se guarda por plataforma. */
export type Credenciales = Record<string, string>;

export interface Plataforma {
  id: string;
  nombre: string;
  moneda: string;
  /** Mínimo aproximado por orden, en `moneda`. */
  minimo_orden: number;
  /** Datos que pide Config → Plataformas (nunca se muestran completos de vuelta). */
  claves: { id: string; nombre: string; secreta: boolean }[];
  listarMercados(idioma?: Idioma): Promise<ListaMercados>;
  libro(lado: string): Promise<Libro>;
  saldo(cred: Credenciales): Promise<Saldo>;
  posiciones(cred: Credenciales): Promise<Posicion[]>;
  comprar(pedido: PedidoOrden, cred: Credenciales): Promise<ResultadoOrden>;
  vender(pedido: PedidoOrden, cred: Credenciales): Promise<ResultadoOrden>;
  /** Cobra lo ganado en mercados ya resueltos. Devuelve cuánto se cobró (0 si la plataforma paga sola). */
  cobrar(cred: Credenciales): Promise<number>;
  /** Opcional: historia del activo del que depende un mercado. La usa la IA. */
  historia?(mercado: Mercado): Promise<Historia | null>;
}

/** Lo que una plataforma recibe del entorno: así se prueba con una red simulada. */
export interface Entorno {
  fetch: typeof fetch;
  ahora?: () => number;
}

/** Error con un mensaje que se puede mostrar tal cual a la persona. */
export class ErrorPlataforma extends Error {
  constructor(
    public plataforma: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorPlataforma';
  }
}
