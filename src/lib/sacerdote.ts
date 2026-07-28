import type { TenantDb } from '@/lib/prisma-tenant';
import { safeParseBody } from '@/lib/validation';
import {
  cleroCreateSchema,
  cleroDeactivateSchema,
  cleroUpdateSchema,
} from '@/lib/validators/schemas';

export const CLERO_TABLE = 'orden_sacerdotal';

export const RANGOS_MINISTERIALES = ['Diácono', 'Presbítero', 'Sacerdote', 'Obispo'] as const;
export const RANGOS_SACRAMENTO_SACERDOTE = ['Diácono', 'Presbítero', 'Sacerdote', 'Obispo'] as const;
export const RANGOS_SACRAMENTO_OBISPO = ['Obispo'] as const;

export const cleroInclude = {
  rango: { select: { id_rango_sacerdotal: true, nombre: true, descripcion: true } },
  orden_religiosa: { select: { id_orden_religiosa: true, nombre: true } },
  parroquia: { select: { id_parroquia: true, nombre: true } },
  persona: {
    select: {
      numero_identidad: true,
      nombres: true,
      apellidos: true,
      telefono: true,
      email: true,
      fecha_nacimiento: true,
      lugar_nacimiento: true,
      sexo: true,
      estado_vital: true,
    },
  },
} as const;

export type CleroValidationResult = {
  ok: true;
  data: {
    numero_identidad: string;
    id_rango_sacerdotal: number;
    id_orden_religiosa: number | null;
    otra_orden_religiosa: string | null;
    es_parroco: number;
    estado_ministerial: number;
    imagen: string | null;
  };
};

export type CleroValidationError = { ok: false; error: string };

function mapCleroData(
  data: {
    id_rango_sacerdotal: string | number;
    id_orden_religiosa?: string | number | null;
    otra_orden_religiosa?: string | null;
    es_parroco?: string | number | boolean | null;
    estado_ministerial?: string | number | null;
    imagen?: string | null;
  },
  numeroIdentidad: string
): CleroValidationResult['data'] {
  return {
    numero_identidad: numeroIdentidad,
    id_rango_sacerdotal: Number(data.id_rango_sacerdotal),
    id_orden_religiosa: data.id_orden_religiosa
      ? Number(data.id_orden_religiosa)
      : null,
    otra_orden_religiosa: data.otra_orden_religiosa || null,
    es_parroco: data.es_parroco
      ? data.es_parroco === true
        ? 1
        : Number(data.es_parroco)
      : 0,
    estado_ministerial:
      data.estado_ministerial !== undefined ? Number(data.estado_ministerial) : 1,
    imagen: data.imagen || null,
  };
}

export function validateCleroCreateInput(
  body: unknown
): CleroValidationResult | CleroValidationError {
  const parsed = safeParseBody(cleroCreateSchema, body);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    data: mapCleroData(parsed.data, parsed.data.numero_identidad),
  };
}

export function validateCleroUpdateInput(
  body: unknown,
  numeroIdentidad: string
): CleroValidationResult | CleroValidationError {
  const parsed = safeParseBody(cleroUpdateSchema, body);
  if (!parsed.ok) return parsed;
  return { ok: true, data: mapCleroData(parsed.data, numeroIdentidad) };
}

export function validateCleroDeactivateInput(
  body: unknown
): { ok: true; data: { estado_ministerial: number } } | CleroValidationError {
  const parsed = safeParseBody(cleroDeactivateSchema, body);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    data: { estado_ministerial: Number(parsed.data.estado_ministerial) },
  };
}

export function normalizeRangoNombre(nombre: string): string {
  return nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function isRangoAllowed(
  nombreRango: string,
  allowed: readonly string[]
): boolean {
  const normalized = normalizeRangoNombre(nombreRango);
  return allowed.some((r) => {
    const candidate = normalizeRangoNombre(r);
    return normalized === candidate || normalized.includes(candidate);
  });
}

export async function assertPersonaExistsForClero(
  db: TenantDb,
  parishId: number,
  numeroIdentidad: string
): Promise<string | null> {
  const persona = await db.persona.findFirst({
    where: { id_parroquia: parishId, numero_identidad: numeroIdentidad },
    select: { numero_identidad: true },
  });
  if (!persona) {
    return 'Debe registrar primero a la persona en el módulo Personas.';
  }
  return null;
}

export async function assertCleroNoDuplicado(
  db: TenantDb,
  parishId: number,
  numeroIdentidad: string
): Promise<string | null> {
  const existing = await db.ordenSacerdotal.findFirst({
    where: { id_parroquia: parishId, numero_identidad: numeroIdentidad },
    select: { numero_identidad: true },
  });
  if (existing) {
    return 'Ya existe un registro clerical para esta persona en la parroquia.';
  }
  return null;
}

export async function assertPersonaSinCleroActivo(
  db: TenantDb,
  parishId: number,
  numeroIdentidad: string
): Promise<string | null> {
  const clero = await db.ordenSacerdotal.findFirst({
    where: {
      id_parroquia: parishId,
      numero_identidad: numeroIdentidad,
      estado_vital: 1,
    },
    select: { numero_identidad: true },
  });
  if (clero) {
    return 'No se puede eliminar la persona porque tiene un registro clerical activo.';
  }
  return null;
}

export async function assertCleroCatalogos(
  db: TenantDb,
  data: CleroValidationResult['data']
): Promise<string | null> {
  const rango = await db.rangoOrdenSacerdotal.findUnique({
    where: { id_rango_sacerdotal: data.id_rango_sacerdotal },
    select: { id_rango_sacerdotal: true, nombre: true },
  });
  if (!rango) {
    return 'Rango ministerial no válido';
  }
  if (!isRangoAllowed(rango.nombre, RANGOS_MINISTERIALES)) {
    return `Rango no permitido. Use: ${RANGOS_MINISTERIALES.join(', ')}`;
  }

  if (data.id_orden_religiosa) {
    const orden = await db.ordenReligiosa.findUnique({
      where: { id_orden_religiosa: data.id_orden_religiosa },
      select: { id_orden_religiosa: true },
    });
    if (!orden) {
      return 'Orden religiosa no válida';
    }
  }

  return null;
}

export async function clearOtherParrocos(
  db: TenantDb,
  parishId: number,
  numeroIdentidad: string
): Promise<void> {
  await db.ordenSacerdotal.updateMany({
    where: {
      id_parroquia: parishId,
      es_parroco: 1,
      numero_identidad: { not: numeroIdentidad },
    },
    data: { es_parroco: 0 },
  });
}

export async function countCleroReferencias(
  db: TenantDb,
  parishId: number,
  numeroIdentidad: string
): Promise<number> {
  const [bautismos, comuniones, confirmaciones, matrimonios] = await Promise.all([
    db.bautismo.count({
      where: { id_parroquia: parishId, numero_identidad_sacerdote: numeroIdentidad },
    }),
    db.primeraComunion.count({
      where: { id_parroquia: parishId, numero_identidad_sacerdote: numeroIdentidad },
    }),
    db.confirmacion.count({
      where: { id_parroquia: parishId, numero_identidad_obispo: numeroIdentidad },
    }),
    db.matrimonio.count({
      where: { id_parroquia: parishId, numero_identidad_sacerdote: numeroIdentidad },
    }),
  ]);

  return bautismos + comuniones + confirmaciones + matrimonios;
}

export type CleroWithPersona = {
  numero_identidad: string;
  id_parroquia: number;
  id_rango_sacerdotal: number;
  id_orden_religiosa: number | null;
  otra_orden_religiosa?: string | null;
  es_parroco: number;
  estado_ministerial: number;
  imagen?: string | null;
  rango: { id_rango_sacerdotal: number; nombre: string; descripcion?: string | null };
  orden_religiosa?: { id_orden_religiosa: number; nombre: string } | null;
  parroquia: { id_parroquia: number; nombre: string };
  persona: {
    numero_identidad: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string | null;
    fecha_nacimiento: Date;
    lugar_nacimiento: string;
    sexo: string;
    estado_vital: number;
  };
};

export type CleroDbRecord = Omit<CleroWithPersona, 'estado_ministerial'> & {
  estado_ministerial?: number;
  estado_vital?: number;
};

export function normalizeCleroRecord(clero: CleroDbRecord): CleroWithPersona {
  return {
    ...clero,
    estado_ministerial: clero.estado_ministerial ?? clero.estado_vital ?? 1,
  };
}

export function serializeClero(clero: CleroDbRecord) {
  const normalized = normalizeCleroRecord(clero);
  return {
    numero_identidad: normalized.numero_identidad,
    id_parroquia: normalized.id_parroquia,
    id_rango_sacerdotal: normalized.id_rango_sacerdotal,
    id_orden_religiosa: normalized.id_orden_religiosa,
    otra_orden_religiosa: normalized.otra_orden_religiosa,
    es_parroco: normalized.es_parroco,
    estado_ministerial: normalized.estado_ministerial,
    imagen: normalized.imagen,
    rango: normalized.rango,
    orden_religiosa: normalized.orden_religiosa,
    parroquia: normalized.parroquia,
    persona: {
      ...normalized.persona,
      fecha_nacimiento: normalized.persona.fecha_nacimiento.toISOString().split('T')[0],
    },
  };
}

export function cleroCompoundId(parishId: number, numeroIdentidad: string) {
  return {
    id_parroquia_numero_identidad: {
      id_parroquia: parishId,
      numero_identidad: numeroIdentidad,
    },
  };
}

export async function findCleroActivo(
  db: TenantDb,
  parishId: number,
  numeroIdentidad: string,
  allowedRangos: readonly string[]
): Promise<{ ok: true; clero: CleroWithPersona } | { ok: false; error: string }> {
  const clero = await db.ordenSacerdotal.findFirst({
    where: {
      id_parroquia: parishId,
      numero_identidad: numeroIdentidad,
      estado_vital: 1,
    },
    include: cleroInclude,
  });

  if (!clero) {
    return {
      ok: false,
      error: `Ministro ordenado no encontrado o inactivo: ${numeroIdentidad}`,
    };
  }

  if (!isRangoAllowed(clero.rango.nombre, allowedRangos)) {
    return {
      ok: false,
      error: `El rango "${clero.rango.nombre}" no es válido para este sacramento`,
    };
  }

  return { ok: true, clero: normalizeCleroRecord(clero as CleroDbRecord) };
}

export function nombreCleroFromRecord(clero: {
  persona?: { nombres: string; apellidos: string };
  nombres?: string;
  apellidos?: string;
}) {
  if (clero.persona) {
    return { nombres: clero.persona.nombres, apellidos: clero.persona.apellidos };
  }
  return { nombres: clero.nombres ?? '', apellidos: clero.apellidos ?? '' };
}

export function cleroToSelectOption(clero: {
  numero_identidad: string;
  persona: { nombres: string; apellidos: string };
  rango?: { nombre: string };
  estado_ministerial?: number;
}) {
  const nombre = nombreCleroFromRecord(clero);
  return {
    numero_identidad: clero.numero_identidad,
    nombres: nombre.nombres,
    apellidos: nombre.apellidos,
    rango: clero.rango?.nombre,
    estado_ministerial: clero.estado_ministerial,
  };
}

export function filterCleroParaSacramento<
  T extends {
    estado_ministerial?: number;
    rango?: { nombre: string };
  },
>(clero: T[], tipo: 'sacerdote' | 'obispo'): T[] {
  const activos = clero.filter((c) => c.estado_ministerial !== 0);
  const allowed =
    tipo === 'obispo' ? RANGOS_SACRAMENTO_OBISPO : RANGOS_SACRAMENTO_SACERDOTE;
  return activos.filter((c) => c.rango && isRangoAllowed(c.rango.nombre, allowed));
}

/** Mapea datos clericales al cliente Prisma actual (estado_vital) hasta migración completa */
export function cleroPrismaWriteData(data: CleroValidationResult['data']) {
  return {
    id_rango_sacerdotal: data.id_rango_sacerdotal,
    id_orden_religiosa: data.id_orden_religiosa ?? 1,
    otra_orden_religiosa: data.otra_orden_religiosa,
    es_parroco: data.es_parroco,
    estado_vital: data.estado_ministerial,
    imagen: data.imagen,
  };
}

export const cleroActivoWhere = { estado_vital: 1 } as const;
export const sacerdoteInclude = cleroInclude;
export const validateSacerdoteCreateInput = validateCleroCreateInput;
export const validateSacerdoteUpdateInput = validateCleroUpdateInput;
export const assertSacerdoteCatalogos = assertCleroCatalogos;
export const countSacerdoteReferencias = countCleroReferencias;
export const serializeSacerdote = serializeClero;
