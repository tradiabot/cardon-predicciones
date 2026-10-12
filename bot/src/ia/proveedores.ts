// Proveedores de IA gratuitos con el formato de OpenAI: el mismo catálogo que Cardón DeFi y Kumo.
// Un modelo se escribe «proveedor:modelo», p. ej. «kilo:nvidia/nemotron-3-super-120b-a12b:free».
export const PROVEEDORES = {
  kilo: {
    nombre: 'Kilo', url: 'https://api.kilo.ai/api/gateway', pide_clave: false, alta: null,
    modelos: ['nvidia/nemotron-3-super-120b-a12b:free', 'nvidia/nemotron-3-ultra-550b-a55b:free'],
    nota: ['Gratis, sin cuenta ni clave. Unas 200 consultas por hora; tarda de 4 a 30 s porque piensa antes de responder.', 'Free, no account or key. About 200 requests per hour; takes 4 to 30 s because it thinks before answering.'],
  },
  groq: {
    nombre: 'Groq', url: 'https://api.groq.com/openai/v1', pide_clave: true, alta: 'https://console.groq.com/keys',
    modelos: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile'],
    nota: ['Cuenta gratis → «Create API Key» (empieza por gsk_). Muy rápida.', 'Free account → “Create API Key” (starts with gsk_). Very fast.'],
  },
  google: {
    nombre: 'Google AI Studio (Gemini)', url: 'https://generativelanguage.googleapis.com/v1beta/openai', pide_clave: true, alta: 'https://aistudio.google.com/app/apikey',
    modelos: ['gemini-3.7-flash'],
    nota: ['Con tu cuenta de Google → «Create API key». En el plan gratis Google puede usar lo que envías (solo datos públicos de mercados).', 'With your Google account → “Create API key”. On the free plan Google may use what you send (only public market data).'],
  },
  openrouter: {
    nombre: 'OpenRouter', url: 'https://openrouter.ai/api/v1', pide_clave: true, alta: 'https://openrouter.ai/workspaces/default/keys',
    modelos: ['openrouter/free'],
    nota: ['Cuenta con correo → crea una clave (sk-or-…). Gratis: unas 50 consultas al día.', 'Account with email → create a key (sk-or-…). Free: about 50 requests a day.'],
  },
  cerebras: {
    nombre: 'Cerebras', url: 'https://api.cerebras.ai/v1', pide_clave: true, alta: 'https://cloud.cerebras.ai',
    modelos: ['gpt-oss-120b', 'qwen-3-235b-a22b-instruct-2507'],
    nota: ['Cuenta gratis → API Keys. Muy rápida.', 'Free account → API Keys. Very fast.'],
  },
  mistral: {
    nombre: 'Mistral', url: 'https://api.mistral.ai/v1', pide_clave: true, alta: 'https://console.mistral.ai/api-keys',
    modelos: ['mistral-small-latest'],
    nota: ['Cuenta con correo, plan gratis «Experiment» → crea una API key.', 'Account with email, free “Experiment” plan → create an API key.'],
  },
} as const;

export type IdProveedor = keyof typeof PROVEEDORES;
export type Claves = Partial<Record<IdProveedor, string>>;
export const IDS_PROVEEDOR = Object.keys(PROVEEDORES) as IdProveedor[];
/** Lo que funciona sin configurar nada: dos modelos de Kilo, que no pide clave. */
export const MODELOS_SIN_CLAVE = PROVEEDORES.kilo.modelos.map((m) => `kilo:${m}`);

export function partirModelo(entrada: string): { proveedor: IdProveedor; modelo: string } | null {
  const i = entrada.indexOf(':');
  const p = i > 0 ? entrada.slice(0, i) : '';
  return p in PROVEEDORES && entrada.length > i + 1 ? { proveedor: p as IdProveedor, modelo: entrada.slice(i + 1) } : null;
}

/** Nombre corto para la pantalla: «nemotron-3-super-120b · Kilo». */
export function etiquetaModelo(entrada: string): string {
  const m = partirModelo(entrada);
  if (!m) return entrada;
  return `${m.modelo.split('/').pop()!.replace(/:free$/, '')} · ${PROVEEDORES[m.proveedor].nombre.split(' ')[0]}`;
}

/** Una clave nunca se enseña entera: «gsk_…6tQF». */
export function recortar(clave: string): string {
  return clave.length < 12 ? '…' : `${clave.slice(0, 4)}…${clave.slice(-4)}`;
}

/** Espera que pide Groq al agotar el límite («try again in 1m2.5s»), en ms. */
export function esperaMs(mensaje: string): number | null {
  const m = /try again in (?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?/i.exec(mensaje);
  if (!m || !(m[1] || m[2] || m[3])) return null;
  return ((Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0)) * 1000;
}

export class ErrorIA extends Error {
  constructor(
    mensaje: string,
    /** Si el proveedor dijo «límite agotado»: hasta cuándo no conviene volver a llamarlo. */
    readonly pausaHasta: number | null = null,
  ) {
    super(mensaje);
    this.name = 'ErrorIA';
  }
}

export interface Mensaje {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface EntornoIA {
  fetch: typeof fetch;
  ahora?: () => number;
}

// Los modelos que piensan antes de responder (Kilo, gpt-oss) necesitan margen o el JSON llega cortado.
function ajustes(proveedor: IdProveedor, modelo: string, tope: number): Record<string, unknown> {
  if (proveedor === 'kilo') return { max_tokens: 4096 };
  if (/gpt-oss/.test(modelo)) return { reasoning_effort: 'low', max_completion_tokens: Math.max(1500, tope) };
  return { max_tokens: tope };
}

/** Una pregunta a un modelo. Cualquier fallo (también «sin clave») lanza ErrorIA con el motivo real. */
export async function preguntar(entorno: EntornoIA, entrada: string, claves: Claves, mensajes: Mensaje[], tope = 800): Promise<string> {
  const m = partirModelo(entrada);
  if (!m) throw new ErrorIA(`modelo mal escrito: ${entrada}`);
  const p = PROVEEDORES[m.proveedor];
  const clave = claves[m.proveedor];
  if (p.pide_clave && !clave) throw new ErrorIA(`falta la clave de ${p.nombre}`);
  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' };
  if (clave) cabeceras.Authorization = `Bearer ${clave}`;
  const tiempo = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(m.proveedor === 'kilo' ? 45_000 : 25_000) : undefined;
  let r: Response;
  try {
    r = await entorno.fetch(`${p.url}/chat/completions`, {
      method: 'POST',
      headers: cabeceras,
      body: JSON.stringify({ model: m.modelo, temperature: 0.2, messages: mensajes, ...ajustes(m.proveedor, m.modelo, tope), response_format: { type: 'json_object' } }),
      signal: tiempo,
    });
  } catch (e: any) {
    throw new ErrorIA(`${p.nombre} no respondió: ${String(e?.message || e).slice(0, 100)}`);
  }
  const texto = await r.text();
  let cuerpo: any = {};
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    if (r.ok) throw new ErrorIA(`${p.nombre} respondió algo que no se entiende`);
  }
  if (!r.ok) {
    const mensaje = String((typeof cuerpo?.error === 'string' ? cuerpo.error : cuerpo?.error?.message) || cuerpo?.message || `HTTP ${r.status}`);
    if (r.status === 429) {
      // Groq dice cuánto esperar; los demás solo responden 429: se descansa 10 minutos.
      const espera = Math.max(60_000, esperaMs(mensaje) ?? 600_000);
      throw new ErrorIA(`límite de ${p.nombre} agotado`, (entorno.ahora || Date.now)() + espera);
    }
    if (r.status === 401 || r.status === 403) throw new ErrorIA(`${p.nombre} rechazó la clave (HTTP ${r.status})`);
    throw new ErrorIA(`${p.nombre} HTTP ${r.status}: ${mensaje.slice(0, 140)}`);
  }
  const contenido = String(cuerpo?.choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!contenido) throw new ErrorIA(`${p.nombre} respondió vacío`);
  return contenido;
}

export function sacarJson(crudo: string): Record<string, unknown> {
  const a = crudo.indexOf('{');
  const b = crudo.lastIndexOf('}');
  if (a < 0 || b <= a) throw new ErrorIA('la respuesta no trae JSON');
  try {
    return JSON.parse(crudo.slice(a, b + 1));
  } catch {
    throw new ErrorIA('la respuesta trae un JSON roto');
  }
}
