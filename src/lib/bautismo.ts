import type { TenantDb } from '@/lib/prisma-tenant';
import { findCleroActivo, RANGOS_SACRAMENTO_SACERDOTE } from '@/lib/sacerdote';
import { validateBautismoRoleConflicts } from '@/lib/sacrament-role-validation';
import { safeParseBody } from '@/lib/validation';
import { bautismoBodySchema } from '@/lib/validators/schemas';

export const BAUTISMO_TABLE = 'bautismo';

export const bautismoInclude = {
  bautizado: {
    select: { numero_identidad: true, nombres: true, apellidos: true, sexo: true },
  },
  madre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madrina: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padrino: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  catequista: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  sacerdote: {
    select: {
      numero_identidad: true,
      es_parroco: true,
      estado_ministerial: true,
      rango: { select: { nombre: true } },
      persona: { select: { nombres: true, apellidos: true } },
    },
  },
} as const;

export interface BautismoInput {
  numero_identidad_bautizado: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_catequista: string;
  numero_identidad_sacerdote: string;
  fecha_bautismo: string;
  nota_marginal?: string | null;
  numero_libro?: string;
  numero_folio?: string;
  numero_pagina?: string;
  numero_registro?: string;
}

export interface BautismoValidationResult {
  ok: true;
  data: Required<
    Pick<
      BautismoInput,
      | 'numero_identidad_bautizado'
      | 'numero_identidad_madre'
      | 'numero_identidad_padre'
      | 'numero_identidad_madrina'
      | 'numero_identidad_padrino'
      | 'numero_identidad_catequista'
      | 'numero_identidad_sacerdote'
      | 'fecha_bautismo'
    >
  > & {
    nota_marginal: string | null;
    numero_libro?: string;
    numero_folio?: string;
    numero_pagina?: string;
    numero_registro?: string;
  };
}

export interface BautismoValidationError {
  ok: false;
  error: string;
}

const PERSONA_FIELDS = [
  'numero_identidad_bautizado',
  'numero_identidad_madre',
  'numero_identidad_padre',
  'numero_identidad_madrina',
  'numero_identidad_padrino',
  'numero_identidad_catequista',
] as const;

export function validateBautismoInput(
  body: unknown
): BautismoValidationResult | BautismoValidationError {
  const parsed = safeParseBody(bautismoBodySchema, body);
  if (!parsed.ok) return parsed;

  const roleCheck = validateBautismoRoleConflicts(parsed.data);
  if (!roleCheck.ok) return roleCheck;

  return parsed;
}

export function serializeBautismo(bautismo: {
  id_bautismo: bigint;
  [key: string]: unknown;
}) {
  return {
    ...bautismo,
    id_bautismo: bautismo.id_bautismo.toString(),
  };
}

export async function assertBautismoReferencias(
  db: TenantDb,
  parishId: number,
  data: BautismoValidationResult['data']
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

  const sacerdoteCheck = await findCleroActivo(
    db,
    parishId,
    data.numero_identidad_sacerdote,
    RANGOS_SACRAMENTO_SACERDOTE
  );
  if (!sacerdoteCheck.ok) {
    return sacerdoteCheck.error;
  }

  return null;
}
