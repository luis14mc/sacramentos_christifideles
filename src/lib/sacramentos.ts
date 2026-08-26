import { prisma } from '@/lib/prisma';
import { jsonSafe } from '@/lib/serialize';

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


export const ministroSelect = {
  numero_identidad: true,
  persona: { select: { nombres: true, apellidos: true } },
} as const;

export function flattenMinistro(
  m: { numero_identidad: string; persona: { nombres: string; apellidos: string } } | null | undefined
) {
  if (!m) return null;
  return {
    numero_identidad: m.numero_identidad,
    nombres: m.persona.nombres,
    apellidos: m.persona.apellidos,
  };
}

export function flattenMinistroRelacion(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(flattenMinistroRelacion);
  if (!value || typeof value !== 'object') return value;
  const row = value as Record<string, unknown>;
  const next = { ...row };
  for (const key of ['sacerdote', 'obispo'] as const) {
    const m = next[key];
    if (m && typeof m === 'object' && 'persona' in m) {
      const rel = m as { numero_identidad?: string; persona?: { nombres?: string; apellidos?: string } };
      next[key] = {
        numero_identidad: rel.numero_identidad,
        nombres: rel.persona?.nombres ?? '',
        apellidos: rel.persona?.apellidos ?? '',
      };
    }
  }
  return next;
}

export function jsonSafeSacramento(value: unknown): unknown {
  return jsonSafe(flattenMinistroRelacion(value));
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
  label = 'sacerdote',
  paraNuevaAlta = true
): Promise<string | null> {
  const ministro = await prisma.ordenSacerdotal.findUnique({
    where: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad: dni } },
    select: {
      numero_identidad: true,
      estado_ministerial: true,
      persona: { select: { estado_vital: true } },
    },
  });
  if (!ministro) return `El ${label} (DNI ${dni}) no existe en tu parroquia.`;
  if (paraNuevaAlta) {
    if (ministro.estado_ministerial !== 1) {
      return `El ${label} (DNI ${dni}) no está activo ministerialmente.`;
    }
    if (ministro.persona.estado_vital !== 1) {
      return `El ${label} (DNI ${dni}) no está disponible: la persona no figura como viva.`;
    }
  }
  return null;
}
