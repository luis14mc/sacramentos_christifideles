import {
  trimStr,
  normalizarFecha,
  validarPersonasTenant,
  validarMinistroTenant,
  ministroSelect,
} from '@/lib/sacramentos';

export interface ConfirmacionInput {
  numero_identidad_confirmado: string;
  // Madre y padre opcionales individualmente; al menos UNO debe estar presente.
  numero_identidad_madre: string | null;
  numero_identidad_padre: string | null;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_catequista: string;
  numero_identidad_obispo: string;
  fecha_confirmacion: Date;
  numero_acta: string;
  numero_libro: string;
  numero_pagina: string | null;
  numero_registro: string;
  nota_marginal: string | null;
}

const DNI_FIELDS: [keyof ConfirmacionInput, string][] = [
  ['numero_identidad_confirmado', 'confirmado'],
  ['numero_identidad_madrina', 'madrina'],
  ['numero_identidad_padrino', 'padrino'],
  ['numero_identidad_catequista', 'catequista'],
  ['numero_identidad_obispo', 'obispo'],
];

// numero_pagina es opcional en el SQL v3 (String?). El resto es obligatorio.
const REGISTRAL_REQUERIDOS: [keyof ConfirmacionInput, string][] = [
  ['numero_acta', 'acta'],
  ['numero_libro', 'libro'],
  ['numero_registro', 'registro'],
];

export function normalizeConfirmacionInput(
  data: Record<string, unknown>
): { input: ConfirmacionInput } | { error: string } {
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
      error: 'Debe registrar al menos la madre o el padre del confirmado.',
    };
  }

  for (const [field, label] of REGISTRAL_REQUERIDOS) {
    const v = trimStr(data[field]);
    if (!v) return { error: `El número de ${label} es obligatorio` };
    values[field] = v;
  }
  if (!data.fecha_confirmacion) {
    return { error: 'La fecha de confirmación es obligatoria' };
  }
  const fecha = normalizarFecha(data.fecha_confirmacion);
  if (!fecha) return { error: 'Fecha de confirmación inválida' };

  const pagina = trimStr(data.numero_pagina) || null;
  const nota =
    data.nota_marginal !== undefined && data.nota_marginal !== null
      ? String(data.nota_marginal).trim() || null
      : null;

  return {
    input: {
      numero_identidad_confirmado: values.numero_identidad_confirmado,
      numero_identidad_madre: madre || null,
      numero_identidad_padre: padre || null,
      numero_identidad_madrina: values.numero_identidad_madrina,
      numero_identidad_padrino: values.numero_identidad_padrino,
      numero_identidad_catequista: values.numero_identidad_catequista,
      numero_identidad_obispo: values.numero_identidad_obispo,
      fecha_confirmacion: fecha,
      numero_acta: values.numero_acta,
      numero_libro: values.numero_libro,
      numero_pagina: pagina,
      numero_registro: values.numero_registro,
      nota_marginal: nota,
    },
  };
}

export function confirmacionCreateData(
  input: ConfirmacionInput,
  parishId: number,
  overrides: { numero_registro?: string } = {}
): Record<string, unknown> {
  const connectPersona = (numero_identidad: string) => ({
    connect: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad } },
  });

  const data: Record<string, unknown> = {
    parroquia: { connect: { id_parroquia: parishId } },
    confirmado: connectPersona(input.numero_identidad_confirmado),
    madrina: connectPersona(input.numero_identidad_madrina),
    padrino: connectPersona(input.numero_identidad_padrino),
    catequista: connectPersona(input.numero_identidad_catequista),
    obispo: {
      connect: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: input.numero_identidad_obispo,
        },
      },
    },
    fecha_confirmacion: input.fecha_confirmacion,
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

export function confirmacionUpdateData(
  input: ConfirmacionInput,
  parishId: number
): Record<string, unknown> {
  const connectPersona = (numero_identidad: string) => ({
    connect: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad } },
  });

  const data: Record<string, unknown> = {
    confirmado: connectPersona(input.numero_identidad_confirmado),
    madrina: connectPersona(input.numero_identidad_madrina),
    padrino: connectPersona(input.numero_identidad_padrino),
    catequista: connectPersona(input.numero_identidad_catequista),
    obispo: {
      connect: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: input.numero_identidad_obispo,
        },
      },
    },
    fecha_confirmacion: input.fecha_confirmacion,
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

export async function validarReferenciasConfirmacion(
  parishId: number,
  input: ConfirmacionInput
): Promise<string | null> {
  const personas = await validarPersonasTenant(parishId, [
    { label: 'confirmado', dni: input.numero_identidad_confirmado },
    ...(input.numero_identidad_madre ? [{ label: 'madre', dni: input.numero_identidad_madre }] : []),
    ...(input.numero_identidad_padre ? [{ label: 'padre', dni: input.numero_identidad_padre }] : []),
    { label: 'madrina', dni: input.numero_identidad_madrina },
    { label: 'padrino', dni: input.numero_identidad_padrino },
    { label: 'catequista', dni: input.numero_identidad_catequista },
  ]);
  if (personas) return personas;
  return validarMinistroTenant(parishId, input.numero_identidad_obispo, 'obispo');
}

export const confirmacionInclude = {
  confirmado: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padre: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  madrina: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  padrino: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  catequista: { select: { numero_identidad: true, nombres: true, apellidos: true } },
  obispo: { select: ministroSelect },
} as const;
