import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const cleroInclude = {
  persona: {
    select: {
      numero_identidad: true,
      nombres: true,
      apellidos: true,
      telefono: true,
      email: true,
      sexo: true,
      estado_vital: true,
      fecha_nacimiento: true,
    },
  },
  rango: { select: { id_rango_sacerdotal: true, nombre: true } },
  orden_religiosa: { select: { id_orden_religiosa: true, nombre: true } },
} as const;

export const cleroDetailInclude = {
  ...cleroInclude,
  _count: {
    select: {
      bautismos_sacerdote: true,
      comuniones_sacerdote: true,
      confirmaciones_obispo: true,
      matrimonios_sacerdote: true,
    },
  },
} as const;

export const cleroLiteSelect = {
  numero_identidad: true,
  es_parroco: true,
  estado_ministerial: true,
  persona: { select: { nombres: true, apellidos: true, estado_vital: true } },
  rango: { select: { nombre: true } },
} as const;

type CountClero = {
  bautismos_sacerdote?: number;
  comuniones_sacerdote?: number;
  confirmaciones_obispo?: number;
  matrimonios_sacerdote?: number;
};

export function serializeClero<T extends Record<string, unknown>>(row: T) {
  const r = row as Record<string, unknown>;
  const persona = (r.persona ?? {}) as Record<string, unknown>;
  const count = (r._count ?? null) as CountClero | null;
  return {
    numero_identidad: String(r.numero_identidad ?? persona.numero_identidad ?? ''),
    nombres: persona.nombres ?? null,
    apellidos: persona.apellidos ?? null,
    telefono: persona.telefono ?? null,
    email: persona.email ?? null,
    sexo: persona.sexo ?? null,
    estado_vital: persona.estado_vital ?? null,
    fecha_nacimiento: persona.fecha_nacimiento ?? null,
    id_rango_sacerdotal: r.id_rango_sacerdotal ?? null,
    id_orden_religiosa: r.id_orden_religiosa ?? null,
    es_parroco: r.es_parroco ?? 0,
    estado_ministerial: r.estado_ministerial ?? 0,
    rango: r.rango ?? null,
    orden_religiosa: r.orden_religiosa ?? null,
    sacramentos: count
      ? {
          bautismos: count.bautismos_sacerdote ?? 0,
          primeras_comuniones: count.comuniones_sacerdote ?? 0,
          confirmaciones: count.confirmaciones_obispo ?? 0,
          matrimonios: count.matrimonios_sacerdote ?? 0,
        }
      : undefined,
  };
}

export function serializeCleroLite<T extends Record<string, unknown>>(row: T) {
  const r = row as Record<string, unknown>;
  const persona = (r.persona ?? {}) as Record<string, unknown>;
  return {
    numero_identidad: String(r.numero_identidad ?? ''),
    nombres: persona.nombres ?? '',
    apellidos: persona.apellidos ?? '',
    es_parroco: r.es_parroco ?? 0,
    estado_ministerial: r.estado_ministerial ?? 0,
    rango: r.rango ?? null,
  };
}

export function parishIdFromSession(session: { user?: { parishId?: string } } | null): number | null {
  const raw = session?.user?.parishId;
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

export function isEstadoMinisterialValido(v: number): boolean {
  return v === 0 || v === 1;
}

export function isEsParrocoValido(v: number): boolean {
  return v === 0 || v === 1;
}

export class CleroError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'CleroError';
  }
}

export async function resolverPersonaClerical(
  parishId: number,
  numeroIdentidad: string
): Promise<{ numero_identidad: string; sexo: string; estado_vital: number }> {
  const persona = await prisma.persona.findUnique({
    where: {
      id_parroquia_numero_identidad: {
        id_parroquia: parishId,
        numero_identidad: numeroIdentidad,
      },
    },
    select: { numero_identidad: true, sexo: true, estado_vital: true },
  });

  if (!persona) {
    throw new CleroError(
      404,
      'La persona debe estar registrada antes de asignarle una condición clerical.'
    );
  }
  if (persona.sexo !== 'M') {
    throw new CleroError(
      400,
      'Solo una persona de sexo masculino puede registrarse como miembro del clero en esta versión.'
    );
  }
  if (persona.estado_vital !== 1) {
    throw new CleroError(400, 'No se puede registrar como clero a una persona fallecida.');
  }
  return persona;
}

/** IDs de catálogo clerical son SMALLINT; valores fuera de rango no se envían a Prisma. */
export function isSmallIntCatalogId(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 32767;
}

export async function asegurarCatalogosClero(idRango: number, idOrden: number): Promise<void> {
  if (!isSmallIntCatalogId(idRango)) {
    throw new CleroError(400, 'Rango sacerdotal inválido.');
  }
  if (!isSmallIntCatalogId(idOrden)) {
    throw new CleroError(400, 'Orden religiosa inválida.');
  }
  const [rango, orden] = await Promise.all([
    prisma.rangoOrdenSacerdotal.findUnique({ where: { id_rango_sacerdotal: idRango } }),
    prisma.ordenReligiosa.findUnique({ where: { id_orden_religiosa: idOrden } }),
  ]);
  if (!rango) throw new CleroError(400, 'Rango sacerdotal inválido.');
  if (!orden) throw new CleroError(400, 'Orden religiosa inválida.');
}

export function cleroWhereUnique(parishId: number, numeroIdentidad: string) {
  return {
    id_parroquia_numero_identidad: {
      id_parroquia: parishId,
      numero_identidad: numeroIdentidad,
    },
  };
}

function mergePersonaWhere(
  current: Prisma.PersonaWhereInput | undefined,
  extra: Prisma.PersonaWhereInput
): Prisma.PersonaWhereInput {
  return { ...(current ?? {}), ...extra };
}

export function cleroListWhere(input: {
  parishId: number;
  q?: string;
  dni?: string;
  nombre?: string;
  apellido?: string;
  rango?: string;
  estado?: string;
  lite?: boolean;
}): Prisma.OrdenSacerdotalWhereInput {
  const where: Prisma.OrdenSacerdotalWhereInput = { id_parroquia: input.parishId };
  let persona: Prisma.PersonaWhereInput | undefined;

  if (input.lite) {
    where.estado_ministerial = 1;
    persona = mergePersonaWhere(persona, { estado_vital: 1 });
  } else if (input.estado === '0' || input.estado === '1') {
    where.estado_ministerial = Number(input.estado);
  }

  if (input.rango) {
    where.rango = { nombre: { contains: input.rango, mode: 'insensitive' } };
  }

  const dni = input.dni?.trim();
  if (dni) persona = mergePersonaWhere(persona, { numero_identidad: { contains: dni, mode: 'insensitive' } });

  const nombre = input.nombre?.trim();
  if (nombre) persona = mergePersonaWhere(persona, { nombres: { contains: nombre, mode: 'insensitive' } });

  const apellido = input.apellido?.trim();
  if (apellido) persona = mergePersonaWhere(persona, { apellidos: { contains: apellido, mode: 'insensitive' } });

  const q = input.q?.trim();
  if (q) {
    persona = mergePersonaWhere(persona, {
      OR: [
        { numero_identidad: { contains: q, mode: 'insensitive' } },
        { nombres: { contains: q, mode: 'insensitive' } },
        { apellidos: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (persona) where.persona = persona;
  return where;
}
