import type { TenantDb } from '@/lib/prisma-tenant';
import { safeParseBody } from '@/lib/validation';
import { matrimonioBodySchema } from '@/lib/validators/schemas';

export const MATRIMONIO_TABLE = 'matrimonio';

export const matrimonioInclude = {
  esposo: {
    select: { numero_identidad: true, nombres: true, apellidos: true, sexo: true },
  },
  esposa: {
    select: { numero_identidad: true, nombres: true, apellidos: true, sexo: true },
  },
  padrino: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madrina: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre_esposo: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madre_esposo: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre_esposa: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madre_esposa: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  sacerdote: { select: { numero_identidad: true, nombres: true, apellidos: true } },
} as const;

const REQUIRED_PERSONA_FIELDS = [
  'numero_identidad_esposo',
  'numero_identidad_esposa',
  'numero_identidad_padrino',
  'numero_identidad_madrina',
] as const;

const OPTIONAL_PERSONA_FIELDS = [
  'numero_identidad_padre_esposo',
  'numero_identidad_madre_esposo',
  'numero_identidad_padre_esposa',
  'numero_identidad_madre_esposa',
] as const;

export interface MatrimonioValidationResult {
  ok: true;
  data: {
    numero_identidad_esposo: string;
    numero_identidad_esposa: string;
    numero_identidad_padrino: string;
    numero_identidad_madrina: string;
    numero_identidad_sacerdote: string;
    numero_identidad_padre_esposo: string | null;
    numero_identidad_madre_esposo: string | null;
    numero_identidad_padre_esposa: string | null;
    numero_identidad_madre_esposa: string | null;
    fecha_matrimonio: string;
    nota_marginal: string | null;
    numero_libro?: string;
    numero_acta?: string;
    numero_pagina?: string;
    numero_registro?: string;
  };
}

export interface MatrimonioValidationError {
  ok: false;
  error: string;
}

export function validateMatrimonioInput(
  body: unknown
): MatrimonioValidationResult | MatrimonioValidationError {
  return safeParseBody(matrimonioBodySchema, body);
}

export function serializeMatrimonio(record: {
  id_matrimonio: bigint;
  [key: string]: unknown;
}) {
  return {
    ...record,
    id_matrimonio: record.id_matrimonio.toString(),
  };
}

export async function assertMatrimonioReferencias(
  db: TenantDb,
  parishId: number,
  data: MatrimonioValidationResult['data']
): Promise<string | null> {
  for (const field of REQUIRED_PERSONA_FIELDS) {
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

  for (const field of OPTIONAL_PERSONA_FIELDS) {
    const id = data[field];
    if (!id) continue;

    const persona = await db.persona.findFirst({
      where: {
        id_parroquia: parishId,
        numero_identidad: id,
      },
      select: { numero_identidad: true },
    });
    if (!persona) {
      return `Persona no encontrada: ${id}`;
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
