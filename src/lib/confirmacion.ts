import type { TenantDb } from '@/lib/prisma-tenant';
import { findCleroActivo, RANGOS_SACRAMENTO_OBISPO } from '@/lib/sacerdote';
import { validateConfirmacionRoleConflicts } from '@/lib/sacrament-role-validation';
import { safeParseBody } from '@/lib/validation';
import { confirmacionBodySchema } from '@/lib/validators/schemas';

export const CONFIRMACION_TABLE = 'confirmacion';

export const confirmacionInclude = {
  confirmado: {
    select: { numero_identidad: true, nombres: true, apellidos: true, sexo: true },
  },
  madre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madrina: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padrino: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  catequista: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  obispo: {
    select: {
      numero_identidad: true,
      es_parroco: true,
      estado_ministerial: true,
      rango: { select: { nombre: true } },
      persona: { select: { nombres: true, apellidos: true } },
    },
  },
} as const;

const PERSONA_FIELDS = [
  'numero_identidad_confirmado',
  'numero_identidad_madre',
  'numero_identidad_padre',
  'numero_identidad_madrina',
  'numero_identidad_padrino',
  'numero_identidad_catequista',
] as const;

export interface ConfirmacionValidationResult {
  ok: true;
  data: {
    numero_identidad_confirmado: string;
    numero_identidad_madre: string;
    numero_identidad_padre: string;
    numero_identidad_madrina: string;
    numero_identidad_padrino: string;
    numero_identidad_catequista: string;
    numero_identidad_obispo: string;
    fecha_confirmacion: string;
    nota_marginal: string | null;
    numero_libro?: string;
    numero_acta?: string;
    numero_pagina?: string;
    numero_registro?: string;
  };
}

export interface ConfirmacionValidationError {
  ok: false;
  error: string;
}

export function validateConfirmacionInput(
  body: unknown
): ConfirmacionValidationResult | ConfirmacionValidationError {
  const parsed = safeParseBody(confirmacionBodySchema, body);
  if (!parsed.ok) return parsed;

  const roleCheck = validateConfirmacionRoleConflicts(parsed.data);
  if (!roleCheck.ok) return roleCheck;

  return parsed;
}

export function serializeConfirmacion(record: {
  id_confirmacion: bigint;
  [key: string]: unknown;
}) {
  return {
    ...record,
    id_confirmacion: record.id_confirmacion.toString(),
  };
}

export async function assertConfirmacionReferencias(
  db: TenantDb,
  parishId: number,
  data: ConfirmacionValidationResult['data']
): Promise<string | null> {
  for (const field of PERSONA_FIELDS) {
    const persona = await db.persona.findFirst({
      where: {
        id_parroquia: parishId,
        numero_identidad: data[field],
      },
      select: { numero_identidad: true },
    });
    if (!persona) {
      return `Persona no encontrada: ${data[field]}`;
    }
  }

  const obispoCheck = await findCleroActivo(
    db,
    parishId,
    data.numero_identidad_obispo,
    RANGOS_SACRAMENTO_OBISPO
  );
  if (!obispoCheck.ok) {
    return obispoCheck.error;
  }

  return null;
}
