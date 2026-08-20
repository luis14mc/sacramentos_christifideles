import { prisma } from '@/lib/prisma';

// Helpers de dominio compartidos por los sacramentos (Bautismo, Primera
// Comunión, Confirmación). Mantiene una sola implementación de la validación
// tenant-safe de participantes y ministros. La lógica específica de cada
// sacramento vive en su propio módulo (bautismo.ts, primera-comunion.ts, ...).

export interface RolPersona {
  label: string;
  dni: string;
}

export function trimStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

export function normalizarFecha(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isPrismaUniqueError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

/**
 * Verifica que TODAS las Personas indicadas existan dentro de la parroquia de
 * sesión. Tenant-safe: una Persona de otra parroquia se trata como inexistente.
 * Devuelve un mensaje de error (para 400) o null si todas existen.
 */
export async function validarPersonasTenant(
  parishId: number,
  roles: RolPersona[]
): Promise<string | null> {
  const dnis = [...new Set(roles.map((r) => r.dni))];
  const encontradas = await prisma.persona.findMany({
    where: { id_parroquia: parishId, numero_identidad: { in: dnis } },
    select: { numero_identidad: true },
  });
  const set = new Set(encontradas.map((p) => p.numero_identidad));
  for (const r of roles) {
    if (!set.has(r.dni)) {
      return `El/La ${r.label} (DNI ${r.dni}) no existe como Persona en tu parroquia. Regístrelo primero en el módulo Personas.`;
    }
  }
  return null;
}

/**
 * Verifica que el ministro (sacerdote/obispo) exista en orden_sacerdotal dentro
 * de la parroquia de sesión. Devuelve un mensaje de error o null.
 */
export async function validarMinistroTenant(
  parishId: number,
  dni: string,
  label = 'sacerdote'
): Promise<string | null> {
  const ministro = await prisma.ordenSacerdotal.findUnique({
    where: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad: dni } },
    select: { numero_identidad: true },
  });
  return ministro ? null : `El ${label} (DNI ${dni}) no existe en tu parroquia.`;
}
