import { leerCodigoInstancia } from '@/lib/instancia-env';
import {
  cabecerasFirmadas,
  verificarFirma,
  CABECERA_FIRMA,
  CABECERA_INSTANCIA,
  CABECERA_TIMESTAMP,
} from '@/lib/interop/firma';
import { EMISOR_HUB } from '@/lib/interop/contrato';

/**
 * Lado instancia de la interoperabilidad: configuración, llamadas firmadas
 * al hub y verificación de las peticiones que llegan del hub.
 */

export interface ConfigInterop {
  hubUrl: string;
  secreto: string;
  codigo: string;
}

/** Devuelve null si la instancia no tiene interoperabilidad configurada. */
export function leerConfigInterop(
  env: Record<string, string | undefined> = process.env
): ConfigInterop | null {
  const hubUrl = env.INTEROP_HUB_URL?.trim().replace(/\/+$/, '');
  const secreto = env.INTEROP_SECRET?.trim();
  const codigo = leerCodigoInstancia(env);
  if (!hubUrl || !secreto || !codigo) return null;
  return { hubUrl, secreto, codigo };
}

export class ErrorHub extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message);
    this.name = 'ErrorHub';
  }
}

const TIMEOUT_HUB_MS = 10_000;

/** Llamada firmada al hub. Lanza ErrorHub si el hub no responde 2xx. */
export async function llamarHub<T>(
  config: ConfigInterop,
  metodo: 'GET' | 'POST',
  ruta: string,
  body?: unknown
): Promise<T> {
  const cuerpo = body === undefined ? '' : JSON.stringify(body);
  let res: Response;
  try {
    res = await fetch(`${config.hubUrl}${ruta}`, {
      method: metodo,
      headers: cabecerasFirmadas(config.secreto, config.codigo, metodo, ruta, cuerpo),
      body: metodo === 'GET' ? undefined : cuerpo,
      signal: AbortSignal.timeout(TIMEOUT_HUB_MS),
      cache: 'no-store',
    });
  } catch {
    throw new ErrorHub('El hub de interoperabilidad no está disponible', null);
  }
  if (!res.ok) {
    throw new ErrorHub(`El hub respondió ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

/**
 * Verifica que una petición entrante venga firmada por el hub.
 * Recibe el cuerpo ya leído como texto (la firma cubre el cuerpo exacto).
 */
export function verificarPeticionHub(
  config: ConfigInterop,
  req: Request,
  cuerpo: string
): boolean {
  if (req.headers.get(CABECERA_INSTANCIA) !== EMISOR_HUB) return false;
  const resultado = verificarFirma(config.secreto, {
    timestamp: req.headers.get(CABECERA_TIMESTAMP) ?? '',
    firma: req.headers.get(CABECERA_FIRMA),
    metodo: req.method,
    ruta: new URL(req.url).pathname,
    cuerpo,
  });
  return resultado.ok;
}
