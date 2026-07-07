import type { TenantDb } from '@/lib/prisma-tenant';

export type NumeradorModulo =
  | 'bautismo'
  | 'primera_comunion'
  | 'confirmacion'
  | 'matrimonio';

export interface NumeracionDisplay {
  numero_libro: string;
  numero_folio: string;
  numero_pagina: string;
  numero_registro: string;
  numero_acta?: string;
}

export interface NumeradorState {
  ultimo_libro: number | null;
  ultimo_folio: number | null;
  ultimo_registro: number | null;
}

export interface NumeradorActaState extends NumeradorState {
  ultimo_acta: number | null;
}

export interface NumeracionComputed {
  next: {
    ultimo_libro: number;
    ultimo_folio: number;
    ultimo_registro: number;
    ultimo_acta?: number;
  };
  display: NumeracionDisplay;
}

const MODULOS_CON_ACTA: NumeradorModulo[] = [
  'primera_comunion',
  'confirmacion',
  'matrimonio',
];

export function usesActaNumeracion(modulo: NumeradorModulo): boolean {
  return MODULOS_CON_ACTA.includes(modulo);
}

/** Calcula el siguiente correlativo sin persistir (testeable). */
export function computeNextNumeracion(state: NumeradorState): NumeracionComputed {
  const libro = state.ultimo_libro ?? 1;
  const folio = state.ultimo_folio ?? 0;
  const registro = (state.ultimo_registro ?? 0) + 1;

  return {
    next: { ultimo_libro: libro, ultimo_folio: folio, ultimo_registro: registro },
    display: {
      numero_libro: String(libro),
      numero_folio: String(folio),
      numero_pagina: String(folio),
      numero_registro: String(registro),
    },
  };
}

/** Calcula correlativo para módulos con numero_acta (primera comunión, confirmación). */
export function computeNextNumeracionActa(
  state: NumeradorActaState
): NumeracionComputed {
  const libro = state.ultimo_libro ?? 1;
  const folio = state.ultimo_folio ?? 0;
  const acta = (state.ultimo_acta ?? 0) + 1;
  const registro = (state.ultimo_registro ?? 0) + 1;

  return {
    next: {
      ultimo_libro: libro,
      ultimo_folio: folio,
      ultimo_acta: acta,
      ultimo_registro: registro,
    },
    display: {
      numero_libro: String(libro),
      numero_folio: String(folio),
      numero_pagina: String(folio),
      numero_acta: String(acta),
      numero_registro: String(registro),
    },
  };
}

function computeForModulo(
  modulo: NumeradorModulo,
  row: {
    ultimo_libro: number | null;
    ultimo_folio: number | null;
    ultimo_registro: number | null;
    ultimo_acta?: number | null;
  }
): NumeracionComputed {
  if (usesActaNumeracion(modulo)) {
    return computeNextNumeracionActa({
      ultimo_libro: row.ultimo_libro,
      ultimo_folio: row.ultimo_folio,
      ultimo_registro: row.ultimo_registro,
      ultimo_acta: row.ultimo_acta ?? null,
    });
  }
  return computeNextNumeracion({
    ultimo_libro: row.ultimo_libro,
    ultimo_folio: row.ultimo_folio,
    ultimo_registro: row.ultimo_registro,
  });
}

/** Reserva el siguiente número en transacción (incremento atómico). */
export async function reserveNextNumeracion(
  db: TenantDb,
  parishId: number,
  modulo: NumeradorModulo
): Promise<NumeracionDisplay> {
  const row = await db.numeradores.findUnique({
    where: {
      id_parroquia_modulo_scope: {
        id_parroquia: parishId,
        modulo,
        scope: 'general',
      },
    },
  });

  if (!row) {
    const created = await db.numeradores.create({
      data: {
        id_parroquia: parishId,
        modulo,
        scope: 'general',
        ultimo_libro: 1,
        ultimo_folio: 0,
        ultimo_registro: 0,
        ultimo_acta: usesActaNumeracion(modulo) ? 0 : undefined,
      },
    });
    const computed = computeForModulo(modulo, created);
    await db.numeradores.update({
      where: { id: created.id },
      data: computed.next,
    });
    return computed.display;
  }

  const computed = computeForModulo(modulo, row);

  await db.numeradores.update({
    where: { id: row.id },
    data: computed.next,
  });

  return computed.display;
}

/** Vista previa del siguiente número sin reservar. */
export async function previewNextNumeracion(
  db: TenantDb,
  parishId: number,
  modulo: NumeradorModulo
): Promise<NumeracionDisplay> {
  const row = await db.numeradores.findUnique({
    where: {
      id_parroquia_modulo_scope: {
        id_parroquia: parishId,
        modulo,
        scope: 'general',
      },
    },
  });

  return computeForModulo(modulo, {
    ultimo_libro: row?.ultimo_libro ?? 1,
    ultimo_folio: row?.ultimo_folio ?? 0,
    ultimo_registro: row?.ultimo_registro ?? 0,
    ultimo_acta: row?.ultimo_acta ?? 0,
  }).display;
}

