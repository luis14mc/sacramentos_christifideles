import { describe, it, expect } from 'vitest';
import {
  normalizeRole,
  getPermissionsForRole,
  hasPermission,
} from '@/lib/permissions';

describe('permissions: normalizeRole y alias', () => {
  it('normaliza mayúsculas y espacios', () => {
    expect(normalizeRole('  Super Admin ')).toBe('super admin');
  });

  it('mapea alias "secretaria" -> "secretario"', () => {
    expect(normalizeRole('Secretaria')).toBe('secretario');
  });

  it('mapea alias "admin parroquial" -> "admin parroquia"', () => {
    expect(normalizeRole('Admin Parroquial')).toBe('admin parroquia');
  });

  it('rol nulo o vacío -> guest', () => {
    expect(normalizeRole(null)).toBe('guest');
    expect(normalizeRole('')).toBe('guest');
  });
});

describe('permissions: matriz de roles', () => {
  it('secretaria hereda permisos de secretario (crea pero no edita sacramentos)', () => {
    expect(hasPermission('secretaria', 'canCreateSacramentos')).toBe(true);
    expect(hasPermission('secretaria', 'canEditSacramentos')).toBe(false);
    expect(hasPermission('secretaria', 'canGenerateConstancias')).toBe(true);
    expect(hasPermission('secretaria', 'canManageConfiguracion')).toBe(false);
  });

  it('catequista puede ver sacramentos pero no emitir constancias', () => {
    expect(hasPermission('catequista', 'canViewSacramentos')).toBe(true);
    expect(hasPermission('catequista', 'canGenerateConstancias')).toBe(false);
  });

  it('rol desconocido cae en permisos mínimos (sin dashboard)', () => {
    const perms = getPermissionsForRole('rol-inexistente');
    expect(perms.canViewDashboard).toBe(false);
    expect(perms.canViewPersonas).toBe(false);
    expect(perms.canManageConfiguracion).toBe(false);
  });

  it('super admin tiene acceso total', () => {
    expect(hasPermission('super admin', 'canManageUsuarios')).toBe(true);
    expect(hasPermission('super admin', 'canManageConfiguracion')).toBe(true);
  });
});
