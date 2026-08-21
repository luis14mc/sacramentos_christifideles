import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Módulos con numeración soportada en v1 (allowlist; sin defunción todavía).
export const MODULOS_NUMERADOR = ['bautismo', 'primera_comunion', 'confirmacion', 'matrimonio'] as const;
export type ModuloNumerador = (typeof MODULOS_NUMERADOR)[number];

export const SCOPE_DEFAULT = 'general';

export function esModuloValido(modulo: string): modulo is ModuloNumerador {
  return (MODULOS_NUMERADOR as readonly string[]).includes(modulo);
}

export interface Sugerencia {
  modulo: string;
  scope: string;
  ultimo_libro: number;
  ultimo_registro: number;
  sugerido: { numero_libro: string; numero_registro: string };
}

/**
 * Lectura no mutante: devuelve el estado actual del numerador y una sugerencia
 * para el próximo registro. La autoridad final de unicidad es el constraint
 * de la base de datos.
 */
export async function peekNumeracion(
  parishId: number,
  modulo: ModuloNumerador,
  scope: string = SCOPE_DEFAULT
): Promise<Sugerencia> {
  const row = await prisma.numeradores.findUnique({
    where: { id_parroquia_modulo_scope: { id_parroquia: parishId, modulo, scope } },
    select: { ultimo_libro: true, ultimo_registro: true },
  });
  const ultimoLibro = row?.ultimo_libro ?? 0;
  const ultimoRegistro = row?.ultimo_registro ?? 0;
  return {
    modulo,
    scope,
    ultimo_libro: ultimoLibro,
    ultimo_registro: ultimoRegistro,
    sugerido: {
      numero_libro: String(ultimoLibro > 0 ? ultimoLibro : 1),
      numero_registro: String(ultimoRegistro + 1),
    },
  };
}

/**
 * Reserva atómica del siguiente número de registro para (parroquia, módulo,
 * scope). Debe ejecutarse dentro de una transacción (recibe el tx).
 *
 * NO usa MAX()+1: garantiza la fila única con upsert y luego incrementa con un
 * UPDATE atómico (`{ increment: 1 }`), que toma un lock de fila en PostgreSQL;
 * dos transacciones concurrentes se serializan y obtienen valores distintos.
 * Devuelve el número de registro recién reservado.
 */
export async function siguienteRegistro(args: {
  tx: Prisma.TransactionClient;
  parishId: number;
  modulo: ModuloNumerador;
  scope?: string;
}): Promise<number> {
  const { tx, parishId, modulo } = args;
  const scope = args.scope ?? SCOPE_DEFAULT;

  await tx.numeradores.upsert({
    where: { id_parroquia_modulo_scope: { id_parroquia: parishId, modulo, scope } },
    create: {
      id_parroquia: parishId,
      modulo,
      scope,
      ultimo_libro: 0,
      ultimo_folio: 0,
      ultimo_acta: 0,
      ultimo_registro: 0,
    },
    update: {},
  });

  const actualizado = await tx.numeradores.update({
    where: { id_parroquia_modulo_scope: { id_parroquia: parishId, modulo, scope } },
    data: { ultimo_registro: { increment: 1 } },
    select: { ultimo_registro: true },
  });

  return actualizado.ultimo_registro ?? 0;
}
