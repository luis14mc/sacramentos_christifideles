import type { TenantDb } from '@/lib/prisma-tenant';
import { safeParseBody } from '@/lib/validation';
import { primeraComunionBodySchema } from '@/lib/validators/schemas';

export const PRIMERA_COMUNION_TABLE = 'primera_comunion';

export const primeraComunionInclude = {
  persona: {
    select: { numero_identidad: true, nombres: true, apellidos: true, sexo: true },
  },
  madre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  catequista: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  sacerdote: { select: { numero_identidad: true, nombres: true, apellidos: true } },
} as const;

const PERSONA_FIELDS = [
  'numero_identidad_persona',
  'numero_identidad_madre',
  'numero_identidad_padre',
  'numero_identidad_catequista',
] as const;

export interface PrimeraComunionValidationResult {
  ok: true;
  data: {
    numero_identidad_persona: string;
    numero_identidad_madre: string;
    numero_identidad_padre: string;
    numero_identidad_catequista: string;
    numero_identidad_sacerdote: string;
    fecha_primera_comunion: string;
    nota_marginal: string | null;
    numero_libro?: string;
    numero_acta?: string;
    numero_pagina?: string;
    numero_registro?: string;
  };
}

export interface PrimeraComunionValidationError {
  ok: false;
  error: string;
}

export function validatePrimeraComunionInput(
  body: unknown
): PrimeraComunionValidationResult | PrimeraComunionValidationError {
  return safeParseBody(primeraComunionBodySchema, body);
}

export function serializePrimeraComunion(record: {
  id_primera_comunion: bigint;
  [key: string]: unknown;
}) {
  return {
    ...record,
    id_primera_comunion: record.id_primera_comunion.toString(),
  };
}

export async function assertPrimeraComunionReferencias(
  db: TenantDb,
  parishId: number,
  data: PrimeraComunionValidationResult['data']
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
