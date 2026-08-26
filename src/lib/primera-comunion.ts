import {
  trimStr,
  normalizarFecha,
  validarPersonasTenant,
  validarMinistroTenant,
  ministroSelect,
} from '@/lib/sacramentos';

export interface ComunionInput {
  numero_identidad_persona: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_catequista: string;
  numero_identidad_sacerdote: string;
  fecha_primera_comunion: Date;
  numero_acta: string;
  numero_libro: string;
  numero_pagina: string;
  numero_registro: string;
  nota_marginal: string | null;
}

const DNI_FIELDS: [keyof ComunionInput, string][] = [
  ['numero_identidad_persona', 'comulgante'],
  ['numero_identidad_madre', 'madre'],
  ['numero_identidad_padre', 'padre'],
  ['numero_identidad_catequista', 'catequista'],
  ['numero_identidad_sacerdote', 'sacerdote'],
];

const REGISTRAL_FIELDS: [keyof ComunionInput, string][] = [
  ['numero_acta', 'acta'],
  ['numero_libro', 'libro'],
  ['numero_pagina', 'página'],
  ['numero_registro', 'registro'],
];

export function normalizeComunionInput(
  data: Record<string, unknown>
): { input: ComunionInput } | { error: string } {
  const values: Record<string, string> = {};
  for (const [field, label] of DNI_FIELDS) {
    const v = trimStr(data[field]);
    if (!v) return { error: `Falta el DNI del ${label}` };
    values[field] = v;
  }
  for (const [field, label] of REGISTRAL_FIELDS) {
    const v = trimStr(data[field]);
    if (!v) return { error: `El número de ${label} es obligatorio` };
    values[field] = v;
  }
  if (!data.fecha_primera_comunion) {
    return { error: 'La fecha de primera comunión es obligatoria' };
  }
  const fecha = normalizarFecha(data.fecha_primera_comunion);
  if (!fecha) return { error: 'Fecha de primera comunión inválida' };

  const nota =
    data.nota_marginal !== undefined && data.nota_marginal !== null
      ? String(data.nota_marginal).trim() || null
      : null;

  return {
    input: {
      numero_identidad_persona: values.numero_identidad_persona,
      numero_identidad_madre: values.numero_identidad_madre,
      numero_identidad_padre: values.numero_identidad_padre,
      numero_identidad_catequista: values.numero_identidad_catequista,
      numero_identidad_sacerdote: values.numero_identidad_sacerdote,
      fecha_primera_comunion: fecha,
      numero_acta: values.numero_acta,
      numero_libro: values.numero_libro,
      numero_pagina: values.numero_pagina,
      numero_registro: values.numero_registro,
      nota_marginal: nota,
    },
  };
}

export async function validarReferenciasComunion(
  parishId: number,
  input: ComunionInput
): Promise<string | null> {
  const personas = await validarPersonasTenant(parishId, [
    { label: 'comulgante', dni: input.numero_identidad_persona },
    { label: 'madre', dni: input.numero_identidad_madre },
    { label: 'padre', dni: input.numero_identidad_padre },
    { label: 'catequista', dni: input.numero_identidad_catequista },
  ]);
  if (personas) return personas;
  return validarMinistroTenant(parishId, input.numero_identidad_sacerdote, 'sacerdote');
}

export const comunionInclude = {
  persona: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  catequista: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  sacerdote: { select: ministroSelect },
} as const;
