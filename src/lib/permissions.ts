export interface UserPermissions {
  canViewDashboard: boolean;
  canViewPersonas: boolean;
  canManagePersonas: boolean;
  canViewUsuarios: boolean;
  canManageUsuarios: boolean;
  canViewSacramentos: boolean;
  canCreateSacramentos: boolean;
  canEditSacramentos: boolean;
  canDeleteSacramentos: boolean;
  canViewConstancias: boolean;
  canGenerateConstancias: boolean;
  canViewReportes: boolean;
  canViewConfiguracion: boolean;
  canManageConfiguracion: boolean;
}

export const defaultPermissions: UserPermissions = {
  canViewDashboard: true,
  canViewPersonas: false,
  canManagePersonas: false,
  canViewUsuarios: false,
  canManageUsuarios: false,
  canViewSacramentos: false,
  canCreateSacramentos: false,
  canEditSacramentos: false,
  canDeleteSacramentos: false,
  canViewConstancias: false,
  canGenerateConstancias: false,
  canViewReportes: false,
  canViewConfiguracion: false,
  canManageConfiguracion: false,
};

const fullAccess: UserPermissions = {
  canViewDashboard: true,
  canViewPersonas: true,
  canManagePersonas: true,
  canViewUsuarios: true,
  canManageUsuarios: true,
  canViewSacramentos: true,
  canCreateSacramentos: true,
  canEditSacramentos: true,
  canDeleteSacramentos: true,
  canViewConstancias: true,
  canGenerateConstancias: true,
  canViewReportes: true,
  canViewConfiguracion: true,
  canManageConfiguracion: true,
};

export const rolePermissions: Record<string, UserPermissions> = {
  'super admin': fullAccess,
  'admin parroquia': fullAccess,
  'administrador': fullAccess,
  'parroco': {
    ...fullAccess,
    canManageUsuarios: false,
    canManageConfiguracion: false,
  },
  'vicario': {
    ...fullAccess,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'sacerdote': {
    ...fullAccess,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'diacono': {
    ...fullAccess,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'secretario': {
    canViewDashboard: true,
    canViewPersonas: true,
    canManagePersonas: false,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewSacramentos: true,
    canCreateSacramentos: true,
    canEditSacramentos: false,
    canDeleteSacramentos: false,
    canViewConstancias: true,
    canGenerateConstancias: true,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'catequista': {
    ...defaultPermissions,
    canViewPersonas: true,
    canViewSacramentos: true,
  },
  'solo lectura': {
    ...defaultPermissions,
    canViewPersonas: true,
    canViewSacramentos: true,
    canViewConstancias: true,
  },
};

export function normalizeRole(role?: string | null): string {
  return (role || 'guest').trim().toLowerCase();
}

export function getPermissionsForRole(role?: string | null): UserPermissions {
  return rolePermissions[normalizeRole(role)] || defaultPermissions;
}

export function hasPermission(
  role: string | null | undefined,
  permission: keyof UserPermissions
): boolean {
  return getPermissionsForRole(role)[permission];
}
