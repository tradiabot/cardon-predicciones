// Dónde guarda cosas el agente. En la nube es D1 (tabla «cajon»); en las pruebas, memoria.
export interface Almacen {
  leer<T>(clave: string): Promise<T | null>;
  guardar(clave: string, valor: unknown): Promise<void>;
}

export function almacenD1(db: D1Database, ahora: () => number = Date.now): Almacen {
  return {
    async leer<T>(clave: string) {
      const fila = await db.prepare('SELECT valor FROM cajon WHERE clave = ?').bind(clave).first<{ valor: string }>();
      return fila ? (JSON.parse(fila.valor) as T) : null;
    },
    async guardar(clave, valor) {
      await db.prepare('INSERT INTO cajon (clave, valor, ts) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, ts = excluded.ts').bind(clave, JSON.stringify(valor), ahora()).run();
    },
  };
}

export function almacenMemoria(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    async leer<T>(clave: string) {
      const v = datos.get(clave);
      return v == null ? null : (JSON.parse(v) as T);
    },
    async guardar(clave, valor) {
      datos.set(clave, JSON.stringify(valor));
    },
  };
}
