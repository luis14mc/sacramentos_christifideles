import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: { $executeRaw: ReturnType<typeof vi.fn> }) => Promise<unknown>) =>
      fn({ $executeRaw: vi.fn().mockResolvedValue(undefined) })
    ),
  },
}));

import { isRlsEnabled, withTenantScope } from '@/lib/prisma-tenant';
import { prisma } from '@/lib/prisma';

describe('isRlsEnabled', () => {
  const original = process.env.DATABASE_RLS_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DATABASE_RLS_ENABLED;
    } else {
      process.env.DATABASE_RLS_ENABLED = original;
    }
  });

  it('devuelve false cuando la variable no está definida', () => {
    delete process.env.DATABASE_RLS_ENABLED;
    expect(isRlsEnabled()).toBe(false);
  });

  it('devuelve true solo con valor exacto "true"', () => {
    process.env.DATABASE_RLS_ENABLED = 'true';
    expect(isRlsEnabled()).toBe(true);

    process.env.DATABASE_RLS_ENABLED = '1';
    expect(isRlsEnabled()).toBe(false);
  });
});

describe('withTenantScope', () => {
  const original = process.env.DATABASE_RLS_ENABLED;

  afterEach(() => {
    vi.clearAllMocks();
    if (original === undefined) {
      delete process.env.DATABASE_RLS_ENABLED;
    } else {
      process.env.DATABASE_RLS_ENABLED = original;
    }
  });

  it('usa prisma global cuando RLS está desactivado', async () => {
    delete process.env.DATABASE_RLS_ENABLED;
    const callback = vi.fn(async (db: unknown) => db);

    await withTenantScope(3, callback);

    expect(callback).toHaveBeenCalledWith(prisma);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('envuelve en transacción cuando RLS está activo', async () => {
    process.env.DATABASE_RLS_ENABLED = 'true';
    const callback = vi.fn(async () => 'ok');

    const result = await withTenantScope(5, callback);

    expect(result).toBe('ok');
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalled();
  });
});
