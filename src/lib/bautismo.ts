import { validarPersonasTenant, validarMinistroTenant } from '@/lib/sacramentos';

// Roles que deben existir como Persona dentro de la MISMA parroquia.
export const ROLES_PERSONA = [
  ['numero_identidad_bautizado', 'bautizado'],
  ['numero_identidad_madre', 'madre'],
  ['numero_identidad_padre', 'padre'],
  ['numero_identidad_madrina', 'madrina'],
  ['numero_identidad_padrino', 'padrino'],
  ['numero_identidad_catequista', 'catequista'],
] as const;

export interface BautismoInput {
  numero_identidad_bautizado: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_catequista: string;
  numero_identidad_sacerdote: string;
  fecha_bautismo: Date;
  numero_folio: string;
  numero_libro: string;
  numero_pagina: string;
  numero_registro: string;
  nota_marginal: string | null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v === undefined || v === null ? '' : String(v).trim();
}

/**
 * Normaliza y valida los campos obligatorios del SQL v3. Devuelve el input
 * tipado o un mensaje de error (para responder 400). No toca la base de datos.
 */
export function normalizeBautismoInput(
  data: Record<string, unknown>
): { input: BautismoInput } | { error: string } {
  const requeridosDni: [keyof BautismoInput, string][] = [
    ['numero_identidad_bautizado', 'bautizado'],
    ['numero_identidad_madre', 'madre'],
    ['numero_identidad_padre', 'padre'],
    ['numero_identidad_madrina', 'madrina'],
    ['numero_identidad_padrino', 'padrino'],
    ['numero_identidad_catequista', 'catequista'],
    ['numero_identidad_sacerdote', 'sacerdote'],
  ];
  const values: Record<string, string> = {};
  for (const [field, label] of requeridosDni) {
    const v = str(data[field]);
    if (!v) return { error: `Falta el DNI del ${label}` };
    values[field] = v;
  }

  const registrales: [keyof BautismoInput, string][] = [
    ['numero_folio', 'folio'],
    ['numero_libro', 'libro'],
    ['numero_pagina', 'página'],
    ['numero_registro', 'registro'],
  ];
  for (const [field, label] of registrales) {
    const v = str(data[field]);
    if (!v) return { error: `El número de ${label} es obligatorio` };
    values[field] = v;
  }

  if (!data.fecha_bautismo) {
    return { error: 'La fecha de bautismo es obligatoria' };
  }
  const fecha = new Date(data.fecha_bautismo as string);
  if (Number.isNaN(fecha.getTime())) {
    return { error: 'Fecha de bautismo inválida' };
  }

  const nota = data.nota_marginal !== undefined && data.nota_marginal !== null
    ? String(data.nota_marginal).trim() || null
    : null;

  return {
    input: {
      numero_identidad_bautizado: values.numero_identidad_bautizado,
      numero_identidad_madre: values.numero_identidad_madre,
      numero_identidad_padre: values.numero_identidad_padre,
      numero_identidad_madrina: values.numero_identidad_madrina,
      numero_identidad_padrino: values.numero_identidad_padrino,
      numero_identidad_catequista: values.numero_identidad_catequista,
      numero_identidad_sacerdote: values.numero_identidad_sacerdote,
      fecha_bautismo: fecha,
      numero_folio: values.numero_folio,
      numero_libro: values.numero_libro,
      numero_pagina: values.numero_pagina,
      numero_registro: values.numero_registro,
      nota_marginal: nota,
    },
  };
}

/**
 * Verifica que TODAS las Personas participantes existan en la parroquia de la
 * sesión y que el sacerdote pertenezca a esa parroquia. Tenant-safe: una
 * Persona/sacerdote de otra parroquia se trata como inexistente. Devuelve un
 * mensaje de error (para 400) o null si todo es válido.
 */
export async function validarReferenciasTenant(
  parishId: number,
  input: BautismoInput
): Promise<string | null> {
  const personas = await validarPersonasTenant(
    parishId,
    ROLES_PERSONA.map(([field, label]) => ({ label, dni: input[field] as string }))
  );
  if (personas) return personas;
  return validarMinistroTenant(parishId, input.numero_identidad_sacerdote, 'sacerdote');
}

export const bautismoInclude = {
  bautizado: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madrina: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padrino: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  catequista: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  sacerdote: { select: { numero_identidad: true, nombres: true, apellidos: true } },
} as const;
