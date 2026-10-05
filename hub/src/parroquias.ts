import { prisma } from './prisma';
import { cifrar, generarSecreto } from './cifrado';

/**
 * Altas y cambios de parroquias registradas. Lo usan el panel web y el CLI
 * (`pnpm instancia …`), para que ambos apliquen exactamente las mismas reglas.
 */

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ErrorValidacion extends Error {}

function normalizarUrl(url: string): string {
  const limpia = url.trim().replace(/\/+$/, '');
  let u: URL;
  try {
    u = new URL(limpia);
  } catch {
    throw new ErrorValidacion('La URL no es válida (ej. https://christifideles.parroquia.org).');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new ErrorValidacion('La URL debe empezar con https://');
  }
  return `${u.protocol}//${u.host}`;
}

function validarNombre(nombre: string): string {
  const n = nombre.trim();
  if (!n || n.length > 100) throw new ErrorValidacion('El nombre es obligatorio (máx. 100 caracteres).');
  return n;
}

/** Registra una parroquia y devuelve su secreto (se muestra una sola vez). */
export async function registrarParroquia(codigo: string, nombre: string, url: string): Promise<string> {
  const c = codigo.trim().toLowerCase();
  if (!SLUG.test(c) || c.length > 50) {
    throw new ErrorValidacion('El código debe ir en minúsculas, con guiones (ej. salvador-del-mundo).');
  }
  if (await prisma.instancia.findUnique({ where: { codigo: c } })) {
    throw new ErrorValidacion(`Ya existe una parroquia con el código "${c}".`);
  }
  const secreto = generarSecreto();
  await prisma.instancia.create({
    data: { codigo: c, nombre: validarNombre(nombre), url: normalizarUrl(url), secreto_cifrado: cifrar(secreto) },
  });
  return secreto;
}

/** Genera un secreto nuevo; el anterior deja de servir de inmediato. */
export async function rotarSecreto(codigo: string): Promise<string> {
  const secreto = generarSecreto();
  await prisma.instancia.update({ where: { codigo }, data: { secreto_cifrado: cifrar(secreto) } });
  return secreto;
}

export async function cambiarEstado(codigo: string, activa: boolean): Promise<void> {
  await prisma.instancia.update({ where: { codigo }, data: { activa } });
}

export async function editarParroquia(codigo: string, nombre: string, url: string): Promise<void> {
  await prisma.instancia.update({
    where: { codigo },
    data: { nombre: validarNombre(nombre), url: normalizarUrl(url) },
  });
}

export type EstadoConexion = 'en_linea' | 'sin_respuesta';

/** Semáforo: ¿la parroquia responde su /api/health? */
export async function comprobarParroquia(url: string, timeoutMs = 4000): Promise<EstadoConexion> {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
    return res.ok ? 'en_linea' : 'sin_respuesta';
  } catch {
    return 'sin_respuesta';
  }
}
