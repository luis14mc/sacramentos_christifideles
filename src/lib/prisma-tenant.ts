import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type TenantDb = Prisma.TransactionClient | typeof prisma;

export function isRlsEnabled(): boolean {
  return process.env.DATABASE_RLS_ENABLED === 'true';
}

async function setTenantSession(
  tx: Prisma.TransactionClient,
  parishId: number
): Promise<void> {
  if (!Number.isInteger(parishId) || parishId <= 0) {
    throw new Error('Invalid parishId for RLS session');
  }
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${String(parishId)}, true)`;
}

/**
 * Ejecuta operaciones con RLS activo (SET app.tenant_id) cuando
 * DATABASE_RLS_ENABLED=true. Si no, usa el cliente Prisma global.
 */
export async function withTenantScope<T>(
  parishId: number,
  callback: (db: TenantDb) => Promise<T>
): Promise<T> {
  if (!isRlsEnabled()) {
    return callback(prisma);
  }

  return prisma.$transaction(async (tx) => {
    await setTenantSession(tx, parishId);
    return callback(tx);
  });
}

/** Transacción explícita con RLS opcional (creaciones multi-paso). */
export async function withTenantTransaction<T>(
  parishId: number,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    if (isRlsEnabled()) {
      await setTenantSession(tx, parishId);
    }
    return callback(tx);
  });
}
