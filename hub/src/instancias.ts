import type { Instancia } from '@prisma/client';
import { prisma } from './prisma';
import { descifrar } from './cifrado';
import {
  cabecerasFirmadas,
  verificarFirma,
  CABECERA_FIRMA,
  CABECERA_INSTANCIA,
  CABECERA_TIMESTAMP,
} from '../../src/lib/interop/firma';
import { EMISOR_HUB } from '../../src/lib/interop/contrato';

/**
 * Autentica una petición firmada por una instancia. Devuelve la instancia
 * activa o null. Recibe el cuerpo ya leído (la firma cubre el cuerpo exacto).
 */
export async function autenticarInstancia(req: Request, cuerpo: string): Promise<Instancia | null> {
  const codigo = req.headers.get(CABECERA_INSTANCIA);
  if (!codigo || codigo === EMISOR_HUB) return null;

  const instancia = await prisma.instancia.findUnique({ where: { codigo } });
  if (!instancia?.activa) return null;

  const resultado = verificarFirma(descifrar(instancia.secreto_cifrado), {
    timestamp: req.headers.get(CABECERA_TIMESTAMP) ?? '',
    firma: req.headers.get(CABECERA_FIRMA),
    metodo: req.method,
    ruta: new URL(req.url).pathname,
    cuerpo,
  });
  return resultado.ok ? instancia : null;
}

const TIMEOUT_MS = 10_000;

/** POST firmado por el hub hacia una instancia. true si respondió 2xx. */
export async function enviarAInstancia(
  instancia: Instancia,
  ruta: string,
  body: unknown
): Promise<boolean> {
  const cuerpo = JSON.stringify(body);
  try {
    const res = await fetch(`${instancia.url}${ruta}`, {
      method: 'POST',
      headers: cabecerasFirmadas(
        descifrar(instancia.secreto_cifrado),
        EMISOR_HUB,
        'POST',
        ruta,
        cuerpo
      ),
      body: cuerpo,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}
