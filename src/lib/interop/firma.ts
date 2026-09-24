import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Firma HMAC-SHA256 para la comunicación instancia ↔ hub.
 *
 * Módulo puro (solo node:crypto) para que lo compartan la app parroquial y
 * `hub/`. Ver docs/PLAN_MULTIPARROQUIA.md, Fase 4.
 */

export const CABECERA_INSTANCIA = 'x-interop-instancia';
export const CABECERA_TIMESTAMP = 'x-interop-timestamp';
export const CABECERA_FIRMA = 'x-interop-firma';

/** Desfase máximo aceptado entre relojes (anti-replay básico). */
export const DESFASE_MAXIMO_MS = 5 * 60 * 1000;

export interface DatosFirma {
  timestamp: string;
  metodo: string;
  ruta: string;
  cuerpo: string;
}

function mensajeCanonico({ timestamp, metodo, ruta, cuerpo }: DatosFirma): string {
  return `${timestamp}\n${metodo.toUpperCase()}\n${ruta}\n${cuerpo}`;
}

export function calcularFirma(secreto: string, datos: DatosFirma): string {
  return createHmac('sha256', secreto).update(mensajeCanonico(datos)).digest('hex');
}

/** Cabeceras listas para `fetch`. */
export function cabecerasFirmadas(
  secreto: string,
  instancia: string,
  metodo: string,
  ruta: string,
  cuerpo: string,
  ahora: number = Date.now()
): Record<string, string> {
  const timestamp = String(ahora);
  return {
    'content-type': 'application/json',
    [CABECERA_INSTANCIA]: instancia,
    [CABECERA_TIMESTAMP]: timestamp,
    [CABECERA_FIRMA]: calcularFirma(secreto, { timestamp, metodo, ruta, cuerpo }),
  };
}

export type ResultadoVerificacion =
  | { ok: true }
  | { ok: false; motivo: 'cabeceras' | 'timestamp' | 'firma' };

export function verificarFirma(
  secreto: string,
  datos: DatosFirma & { firma: string | null },
  ahora: number = Date.now()
): ResultadoVerificacion {
  if (!datos.firma || !datos.timestamp) return { ok: false, motivo: 'cabeceras' };

  const ts = Number(datos.timestamp);
  if (!Number.isFinite(ts) || Math.abs(ahora - ts) > DESFASE_MAXIMO_MS) {
    return { ok: false, motivo: 'timestamp' };
  }

  const esperada = Buffer.from(calcularFirma(secreto, datos), 'hex');
  const recibida = Buffer.from(datos.firma, 'hex');
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return { ok: false, motivo: 'firma' };
  }
  return { ok: true };
}
