import {
  trimStr,
  normalizarFecha,
  validarPersonasTenant,
  validarMinistroTenant,
  ministroSelect,
  type RolPersona,
} from '@/lib/sacramentos';

export interface MatrimonioInput {
  numero_identidad_esposa: string;
  numero_identidad_esposo: string;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_sacerdote: string;
  numero_identidad_madre_esposa: string | null;
  numero_identidad_padre_esposa: string | null;
  numero_identidad_madre_esposo: string | null;
  numero_identidad_padre_esposo: string | null;
  fecha_matrimonio: Date;
  numero_acta: string;
  numero_libro: string;
  numero_pagina: string | null;
  numero_registro: string;
  nota_marginal: string | null;
}

const DNI_REQUERIDOS: [keyof MatrimonioInput, string][] = [
  ['numero_identidad_esposa', 'esposa'],
  ['numero_identidad_esposo', 'esposo'],
  ['numero_identidad_madrina', 'madrina'],
  ['numero_identidad_padrino', 'padrino'],
  ['numero_identidad_sacerdote', 'sacerdote'],
];

// Padres de los contrayentes: opcionales según SQL v3 (String?).
const DNI_OPCIONALES: [keyof MatrimonioInput, string][] = [
  ['numero_identidad_madre_esposa', 'madre de la esposa'],
  ['numero_identidad_padre_esposa', 'padre de la esposa'],
  ['numero_identidad_madre_esposo', 'madre del esposo'],
  ['numero_identidad_padre_esposo', 'padre del esposo'],
];

// numero_pagina es opcional en el SQL v3 (String?); el resto obligatorio.
const REGISTRAL_REQUERIDOS: [keyof MatrimonioInput, string][] = [
  ['numero_acta', 'acta'],
  ['numero_libro', 'libro'],
  ['numero_registro', 'registro'],
];

export function normalizeMatrimonioInput(
  data: Record<string, unknown>
): { input: MatrimonioInput } | { error: string } {
  const req: Record<string, string> = {};
  for (const [field, label] of DNI_REQUERIDOS) {
    const v = trimStr(data[field]);
    if (!v) return { error: `Falta el DNI del/de la ${label}` };
    req[field] = v;
  }
  for (const [field, label] of REGISTRAL_REQUERIDOS) {
    const v = trimStr(data[field]);
    if (!v) return { error: `El número de ${label} es obligatorio` };
    req[field] = v;
  }

  const opt: Record<string, string | null> = {};
  for (const [field] of DNI_OPCIONALES) {
    opt[field] = trimStr(data[field]) || null;
  }

  if (!data.fecha_matrimonio) return { error: 'La fecha de matrimonio es obligatoria' };
  const fecha = normalizarFecha(data.fecha_matrimonio);
  if (!fecha) return { error: 'Fecha de matrimonio inválida' };

  // Los contrayentes deben ser Personas diferentes.
  if (req.numero_identidad_esposa === req.numero_identidad_esposo) {
    return { error: 'Los contrayentes deben ser Personas diferentes.' };
  }

  const pagina = trimStr(data.numero_pagina) || null;
  const nota =
    data.nota_marginal !== undefined && data.nota_marginal !== null
      ? String(data.nota_marginal).trim() || null
      : null;

  return {
    input: {
      numero_identidad_esposa: req.numero_identidad_esposa,
      numero_identidad_esposo: req.numero_identidad_esposo,
      numero_identidad_madrina: req.numero_identidad_madrina,
      numero_identidad_padrino: req.numero_identidad_padrino,
      numero_identidad_sacerdote: req.numero_identidad_sacerdote,
      numero_identidad_madre_esposa: opt.numero_identidad_madre_esposa,
      numero_identidad_padre_esposa: opt.numero_identidad_padre_esposa,
      numero_identidad_madre_esposo: opt.numero_identidad_madre_esposo,
      numero_identidad_padre_esposo: opt.numero_identidad_padre_esposo,
      fecha_matrimonio: fecha,
      numero_acta: req.numero_acta,
      numero_libro: req.numero_libro,
      numero_pagina: pagina,
      numero_registro: req.numero_registro,
      nota_marginal: nota,
    },
  };
}

export async function validarReferenciasMatrimonio(
  parishId: number,
  input: MatrimonioInput
): Promise<string | null> {
  const roles: RolPersona[] = [
    { label: 'esposa', dni: input.numero_identidad_esposa },
    { label: 'esposo', dni: input.numero_identidad_esposo },
    { label: 'madrina', dni: input.numero_identidad_madrina },
    { label: 'padrino', dni: input.numero_identidad_padrino },
  ];
  // Padres opcionales: si fueron informados, DEBEN existir en el tenant.
  for (const [field, label] of DNI_OPCIONALES) {
    const dni = input[field] as string | null;
    if (dni) roles.push({ label, dni });
  }

  const personas = await validarPersonasTenant(parishId, roles);
  if (personas) return personas;
  return validarMinistroTenant(parishId, input.numero_identidad_sacerdote, 'sacerdote');
}

const personaSel = { select: { numero_identidad: true, nombres: true, apellidos: true } } as const;

export const matrimonioInclude = {
  esposa: personaSel,
  esposo: personaSel,
  madrina: personaSel,
  padrino: personaSel,
  madre_esposa: personaSel,
  padre_esposa: personaSel,
  madre_esposo: personaSel,
  padre_esposo: personaSel,
  sacerdote: { select: ministroSelect },
} as const;
