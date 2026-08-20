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
