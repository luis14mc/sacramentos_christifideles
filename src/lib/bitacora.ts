import type { Prisma } from '@prisma/client';

export type AccionCrud = 'C' | 'R' | 'U' | 'D';

export interface BitacoraParams {
  parishId: number;
  userId: bigint;
  accion: AccionCrud;
  nombreTabla: string;
  idAfectado?: bigint | null;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  actorIp?: string | null;
  userAgent?: string | null;
}

/**
 * Registra una entrada en bitacora_crud. Debe llamarse dentro de la misma
 * transacción que la escritura auditada (recibe un tx de $transaction) para
 * garantizar consistencia: no queda operación sin su bitácora.
 */
export async function registrarBitacora(
  tx: Prisma.TransactionClient,
  params: BitacoraParams
): Promise<void> {
  await tx.bitacoraCrud.create({
    data: {
      id_parroquia: params.parishId,
      id_usuario: params.userId,
      accion: params.accion,
      nombre_tabla: params.nombreTabla,
      id_tabla_afectado: params.idAfectado ?? null,
      old_values: params.oldValues,
      new_values: params.newValues,
      actor_ip: params.actorIp ?? null,
      user_agent: params.userAgent ?? null,
    },
  });
}

/** Extrae IP y user-agent de la request para trazabilidad (best-effort). */
export function contextoAuditoria(req: Request): { actorIp: string | null; userAgent: string | null } {
  const fwd = req.headers.get('x-forwarded-for');
  const actorIp = fwd ? fwd.split(',')[0].trim() : req.headers.get('x-real-ip');
  return { actorIp: actorIp || null, userAgent: req.headers.get('user-agent') };
}
