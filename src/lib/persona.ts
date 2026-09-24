// Helpers compartidos del core Persona (Sprint 1).
// Fuente funcional de verdad: docs/christi_fidelis_bdd_pg_v3.sql

/**
 * Serializa una Persona de Prisma a JSON seguro.
 * `id_sector_parroquial` es BigInt y no puede devolverse directamente por
 * NextResponse.json. `numero_identidad` y `telefono` ya son String en el
 * modelo, pero los normalizamos por consistencia.
 */
export function serializePersona<T extends Record<string, unknown>>(persona: T) {
  const p = persona as Record<string, unknown>;
  return {
    ...p,
    numero_identidad:
      p.numero_identidad !== undefined && p.numero_identidad !== null
        ? String(p.numero_identidad)
        : p.numero_identidad,
    telefono:
      p.telefono !== undefined && p.telefono !== null ? String(p.telefono) : p.telefono,
    id_sector_parroquial:
      p.id_sector_parroquial !== undefined && p.id_sector_parroquial !== null
        ? (p.id_sector_parroquial as bigint).toString()
        : null,
    id_orden_religiosa:
      p.id_orden_religiosa !== undefined && p.id_orden_religiosa !== null
        ? String(p.id_orden_religiosa)
        : null,
  };
}

/** Normaliza y valida sexo: sólo 'F' o 'M' (CHECK del SQL v3). Acepta género textual. */
export function normalizeSexo(sexo?: unknown, genero?: unknown): 'F' | 'M' | null {
  if (sexo === 'F' || sexo === 'M') return sexo;
  if (genero === 'Masculino') return 'M';
  if (genero === 'Femenino') return 'F';
  return null;
}

/** estado_vital válido según SQL v3: 0, 1 o 2. */
export function isEstadoVitalValido(v: number): boolean {
  return v === 0 || v === 1 || v === 2;
}

/** estado_activo_parroquia válido según SQL v3: 0 o 1. */
export function isEstadoActivoValido(v: number): boolean {
  return v === 0 || v === 1;
}

/** Sacramentos en los que la persona es sujeto principal (resumen para listados). */
export interface ResumenSacramentos {
  bautismo: boolean;
  primera_comunion: boolean;
  confirmacion: boolean;
  matrimonio: boolean;
}

export type SacramentoResumen = keyof ResumenSacramentos;

export const SACRAMENTOS_RESUMEN: readonly SacramentoResumen[] = [
  'bautismo',
  'primera_comunion',
  'confirmacion',
  'matrimonio',
];

/** `_count` de Prisma para calcular el resumen sin traer los registros. */
export const personaSacramentosCount = {
  _count: {
    select: {
      bautismos_bautizado: true,
      comuniones_persona: true,
      confirmaciones_confirmado: true,
      matrimonios_esposo: true,
      matrimonios_esposa: true,
    },
  },
} as const;

export interface PersonaSacramentosCount {
  bautismos_bautizado: number;
  comuniones_persona: number;
  confirmaciones_confirmado: number;
  matrimonios_esposo: number;
  matrimonios_esposa: number;
}

export function resumenSacramentos(count: PersonaSacramentosCount): ResumenSacramentos {
  return {
    bautismo: count.bautismos_bautizado > 0,
    primera_comunion: count.comuniones_persona > 0,
    confirmacion: count.confirmaciones_confirmado > 0,
    matrimonio: count.matrimonios_esposo + count.matrimonios_esposa > 0,
  };
}

/** Filtro Prisma "tiene / no tiene" un sacramento como sujeto principal. */
export function whereSacramento(sacramento: SacramentoResumen, tiene: boolean) {
  const rel = tiene ? 'some' : 'none';
  switch (sacramento) {
    case 'bautismo':
      return { bautismos_bautizado: { [rel]: {} } };
    case 'primera_comunion':
      return { comuniones_persona: { [rel]: {} } };
    case 'confirmacion':
      return { confirmaciones_confirmado: { [rel]: {} } };
    case 'matrimonio':
      return tiene
        ? { OR: [{ matrimonios_esposo: { some: {} } }, { matrimonios_esposa: { some: {} } }] }
        : { matrimonios_esposo: { none: {} }, matrimonios_esposa: { none: {} } };
  }
}
