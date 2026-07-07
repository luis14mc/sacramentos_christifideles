import { describe, expect, it } from 'vitest';
import { ForbiddenError } from '@/lib/errors';
import { isFullAccessRole, requireSuperAdmin } from '@/lib/rbac';
import { assertParishAccess } from '@/lib/tenant';
import { checkRateLimit } from '@/lib/rate-limit';

describe('assertParishAccess', () => {
  it('permite cuando no se envía parroquia en el request', () => {
    expect(() => assertParishAccess(undefined, 3)).not.toThrow();
    expect(() => assertParishAccess(null, 3)).not.toThrow();
  });

  it('permite cuando la parroquia coincide', () => {
    expect(() => assertParishAccess(3, 3)).not.toThrow();
  });

  it('rechaza cross-tenant', () => {
    expect(() => assertParishAccess(2, 3)).toThrow(ForbiddenError);
  });
});

describe('checkRateLimit', () => {
  it('bloquea después del máximo de intentos', () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});

describe('isFullAccessRole', () => {
  it('reconoce roles con acceso total', () => {
    expect(isFullAccessRole('Super Admin')).toBe(true);
    expect(isFullAccessRole('Admin Parroquia')).toBe(true);
    expect(isFullAccessRole('administrador')).toBe(true);
  });

  it('rechaza roles sin acceso total', () => {
    expect(isFullAccessRole('Secretario')).toBe(false);
    expect(isFullAccessRole('Solo Lectura')).toBe(false);
  });
});

describe('requireSuperAdmin', () => {
  it('permite super admin', () => {
    expect(() => requireSuperAdmin('Super Admin')).not.toThrow();
  });

  it('rechaza otros roles', () => {
    expect(() => requireSuperAdmin('Secretario')).toThrow(ForbiddenError);
  });
});
