import { validarPersonasTenant, validarMinistroTenant } from '@/lib/sacramentos';

// Roles que deben existir como Persona dentro de la MISMA parroquia.
// Padrino y madrina son OPCIONALES individualmente: la regla de negocio v1
// exige al menos UNO de los dos (ver normalizeBautismoInput).
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
  // Opcionales: al menos uno entre padrino y madrina debe estar presente.
  numero_identidad_madrina: string | null;
  numero_identidad_padrino: string | null;
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
 *
 * Regla v1: padrino y madrina son opcionales individualmente; se exige al
 * menos UNO de los dos. La BD refuerza la misma regla con un CHECK.
 */
export function normalizeBautismoInput(
  data: Record<string, unknown>
): { input: BautismoInput } | { error: string } {
  const requeridosDni: [keyof BautismoInput, string][] = [
    ['numero_identidad_bautizado', 'bautizado'],
    ['numero_identidad_madre', 'madre'],
    ['numero_identidad_padre', 'padre'],
    ['numero_identidad_catequista', 'catequista'],
    ['numero_identidad_sacerdote', 'sacerdote'],
  ];
  const values: Record<string, string> = {};
  for (const [field, label] of requeridosDni) {
    const v = str(data[field]);
    if (!v) return { error: `Falta el DNI del ${label}` };
    values[field] = v;
  }

  // Padrino y madrina son opcionales; se admiten vacío o DNI.
  const madrina = str(data.numero_identidad_madrina);
  const padrino = str(data.numero_identidad_padrino);
  if (!madrina && !padrino) {
    return {
      error: 'Debe registrar al menos un padrino o una madrina para el bautismo.',
    };
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
      numero_identidad_madrina: madrina || null,
      numero_identidad_padrino: padrino || null,
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
 *
 * Padrino y madrina son opcionales; si vienen vacíos no se validan.
 */
export async function validarReferenciasTenant(
  parishId: number,
  input: BautismoInput
): Promise<string | null> {
  const personas = await validarPersonasTenant(
    parishId,
    ROLES_PERSONA.flatMap(([field, label]) => {
      const dni = input[field] as string | null;
      return dni ? [{ label, dni }] : [];
    })
  );
  if (personas) return personas;
  return validarMinistroTenant(parishId, input.numero_identidad_sacerdote, 'sacerdote');
}

/**
 * Prepara el `data` para `prisma.bautismo.create`.
 *
 * Prisma tiene un quirk conocido con FKs compuestas parcialmente nulas: cuando
 * la columna opcional queda vacía, no puede inferir la parroquia por la FK
 * parcial y exige conexiones explícitas a TODAS las relaciones. Por eso este
 * helper conecta explícitamente cada relación obligatoria a
 * `persona`/`orden_sacerdotal` usando el `parishId` de sesión. La FK escalar
 * `id_parroquia` se pasa directamente (válido en UncheckedCreateInput).
 *
 * Las relaciones OPCIONALES (madrina/padrino) solo se incluyen cuando vienen
 * informadas (connect). En `create` no existe la relación previa, así que
 * omitirlas deja la columna en NULL por defecto.
 */
export function bautismoCreateData(
  input: BautismoInput,
  parishId: number,
  overrides: { numero_registro?: string } = {}
): Record<string, unknown> {
  const connectPersona = (numero_identidad: string) => ({
    connect: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad } },
  });

  const data: Record<string, unknown> = {
    parroquia: { connect: { id_parroquia: parishId } },
    bautizado: connectPersona(input.numero_identidad_bautizado),
    madre: connectPersona(input.numero_identidad_madre),
    padre: connectPersona(input.numero_identidad_padre),
    catequista: connectPersona(input.numero_identidad_catequista),
    sacerdote: {
      connect: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: input.numero_identidad_sacerdote,
        },
      },
    },
    fecha_bautismo: input.fecha_bautismo,
    numero_folio: input.numero_folio,
    numero_libro: input.numero_libro,
    numero_pagina: input.numero_pagina,
    numero_registro: overrides.numero_registro ?? input.numero_registro,
    nota_marginal: input.nota_marginal,
  };

  if (input.numero_identidad_madrina) {
    data.madrina = connectPersona(input.numero_identidad_madrina);
  }
  if (input.numero_identidad_padrino) {
    data.padrino = connectPersona(input.numero_identidad_padrino);
  }

  return data;
}

/**
 * Prepara el `data` para `prisma.bautismo.update`.
 *
 * A diferencia de `bautismoCreateData`, en update los FKs escalares opcionales
 * NO se pasan (Prisma no admite asignar NULL directamente al escalar; usamos la
 * sintaxis de relación `disconnect: true` para dejarlos en NULL). Para las
 * relaciones opcionales vacías emite `disconnect: true`.
 */
export function bautismoUpdateData(
  input: BautismoInput,
  parishId: number
): Record<string, unknown> {
  const connectPersona = (numero_identidad: string) => ({
    connect: { id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad } },
  });

  const data: Record<string, unknown> = {
    id_parroquia: parishId,
    bautizado: connectPersona(input.numero_identidad_bautizado),
    madre: connectPersona(input.numero_identidad_madre),
    padre: connectPersona(input.numero_identidad_padre),
    catequista: connectPersona(input.numero_identidad_catequista),
    sacerdote: {
      connect: {
        id_parroquia_numero_identidad: {
          id_parroquia: parishId,
          numero_identidad: input.numero_identidad_sacerdote,
        },
      },
    },
    fecha_bautismo: input.fecha_bautismo,
    numero_folio: input.numero_folio,
    numero_libro: input.numero_libro,
    numero_pagina: input.numero_pagina,
    numero_registro: input.numero_registro,
    nota_marginal: input.nota_marginal,
  };

  // Opcionales: si hay DNI se conecta la relación; si no, se desconecta.
  if (input.numero_identidad_madrina) {
    data.madrina = connectPersona(input.numero_identidad_madrina);
  } else {
    data.madrina = { disconnect: true };
  }
  if (input.numero_identidad_padrino) {
    data.padrino = connectPersona(input.numero_identidad_padrino);
  } else {
    data.padrino = { disconnect: true };
  }

  return data;
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