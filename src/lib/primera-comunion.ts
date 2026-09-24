import {
  trimStr,
  normalizarFecha,
  validarPersonasTenant,
  validarMinistroTenant,
  ministroSelect,
} from '@/lib/sacramentos';

export interface ComunionInput {
  numero_identidad_persona: string;
  // Madre y padre opcionales individualmente; al menos UNO debe estar presente.
  numero_identidad_madre: string | null;
  numero_identidad_padre: string | null;
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
  const madre = trimStr(data.numero_identidad_madre);
  const padre = trimStr(data.numero_identidad_padre);
  if (!madre && !padre) {
    return {
      error: 'Debe registrar al menos la madre o el padre del comulgante.',
    };
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
      numero_identidad_madre: madre || null,
      numero_identidad_padre: padre || null,
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

export function comunionCreateData(
  input: ComunionInput,
  parishId: number,
  overrides: { numero_registro?: string } = {}
): Record<string, unknown> {
  const connectPersona = (numero_identidad: string) => ({
    connect: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad } },
  });

  const data: Record<string, unknown> = {
    parroquia: { connect: { id_parroquia: parishId } },
    persona: connectPersona(input.numero_identidad_persona),
    catequista: connectPersona(input.numero_identidad_catequista),
    sacerdote: {
      connect: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: input.numero_identidad_sacerdote,
        },
      },
    },
    fecha_primera_comunion: input.fecha_primera_comunion,
    numero_acta: input.numero_acta,
    numero_libro: input.numero_libro,
    numero_pagina: input.numero_pagina,
    numero_registro: overrides.numero_registro ?? input.numero_registro,
    nota_marginal: input.nota_marginal,
  };

  if (input.numero_identidad_madre) {
    data.madre = connectPersona(input.numero_identidad_madre);
  }
  if (input.numero_identidad_padre) {
    data.padre = connectPersona(input.numero_identidad_padre);
  }

  return data;
}

export function comunionUpdateData(
  input: ComunionInput,
  parishId: number
): Record<string, unknown> {
  const connectPersona = (numero_identidad: string) => ({
    connect: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad } },
  });

  const data: Record<string, unknown> = {
    persona: connectPersona(input.numero_identidad_persona),
    catequista: connectPersona(input.numero_identidad_catequista),
    sacerdote: {
      connect: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: input.numero_identidad_sacerdote,
        },
      },
    },
    fecha_primera_comunion: input.fecha_primera_comunion,
    numero_acta: input.numero_acta,
    numero_libro: input.numero_libro,
    numero_pagina: input.numero_pagina,
    numero_registro: input.numero_registro,
    nota_marginal: input.nota_marginal,
  };

  if (input.numero_identidad_madre) {
    data.madre = connectPersona(input.numero_identidad_madre);
  } else {
    data.madre = { disconnect: true };
  }
  if (input.numero_identidad_padre) {
    data.padre = connectPersona(input.numero_identidad_padre);
  } else {
    data.padre = { disconnect: true };
  }

  return data;
}

export async function validarReferenciasComunion(
  parishId: number,
  input: ComunionInput
): Promise<string | null> {
  const personas = await validarPersonasTenant(parishId, [
    { label: 'comulgante', dni: input.numero_identidad_persona },
    ...(input.numero_identidad_madre ? [{ label: 'madre', dni: input.numero_identidad_madre }] : []),
    ...(input.numero_identidad_padre ? [{ label: 'padre', dni: input.numero_identidad_padre }] : []),
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
