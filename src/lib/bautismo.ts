import type { TenantDb } from '@/lib/prisma-tenant';
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
  sacerdote: { select: { numero_identidad: true, nombres: true, apellidos: true } },
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
  return safeParseBody(bautismoBodySchema, body);
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

  const sacerdote = await db.ordenSacerdotal.findFirst({
    where: {
      id_parroquia: parishId,
      numero_identidad: data.numero_identidad_sacerdote,
    },
    select: { numero_identidad: true },
  });

  if (!sacerdote) {
    return `Sacerdote no encontrado: ${data.numero_identidad_sacerdote}`;
  }

  return null;
}
