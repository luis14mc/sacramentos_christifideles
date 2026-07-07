import type { TenantDb } from '@/lib/prisma-tenant';
import type { Prisma } from '@prisma/client';

export type BitacoraAccion = 'C' | 'U' | 'D';

export async function logBitacoraCrud(
  db: TenantDb,
  params: {
    parishId: number;
    userId: bigint;
    accion: BitacoraAccion;
    nombreTabla: string;
    idTabla?: bigint;
    oldValues?: Prisma.InputJsonValue;
    newValues?: Prisma.InputJsonValue;
  }
): Promise<void> {
  await db.bitacoraCrud.create({
    data: {
      id_parroquia: params.parishId,
      id_usuario: params.userId,
      accion: params.accion,
      id_tabla_afectado: params.idTabla ?? null,
      nombre_tabla: params.nombreTabla,
      old_values: params.oldValues ?? undefined,
      new_values: params.newValues ?? undefined,
    },
  });
}
