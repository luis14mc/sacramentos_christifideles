export interface UserPermissions {
  canViewDashboard: boolean;
  canViewPersonas: boolean;
  /** Expediente sacramental agregado por persona (v1) */
  canViewExpediente: boolean;
  canManagePersonas: boolean;
  canViewUsuarios: boolean;
  canManageUsuarios: boolean;
  canViewSacerdotes: boolean;
  canManageSacerdotes: boolean;
  canViewSacramentos: boolean;
  canCreateSacramentos: boolean;
  canEditSacramentos: boolean;
  canDeleteSacramentos: boolean;
  canViewConstancias: boolean;
  canGenerateConstancias: boolean;
  canViewReportes: boolean;
  canViewConfiguracion: boolean;
  canManageConfiguracion: boolean;
  /** Interoperabilidad: consultar a otra parroquia vía hub */
  canSolicitarInterop: boolean;
  /** Interoperabilidad: aprobar/rechazar consultas entrantes (comparte datos) */
  canResolverInterop: boolean;
}

export const defaultPermissions: UserPermissions = {
  canViewDashboard: false,
  canViewPersonas: false,
  canViewExpediente: false,
  canManagePersonas: false,
  canViewUsuarios: false,
  canManageUsuarios: false,
  canViewSacerdotes: false,
  canManageSacerdotes: false,
  canViewSacramentos: false,
  canCreateSacramentos: false,
  canEditSacramentos: false,
  canDeleteSacramentos: false,
  canViewConstancias: false,
  canGenerateConstancias: false,
  canViewReportes: false,
  canViewConfiguracion: false,
  canManageConfiguracion: false,
  canSolicitarInterop: false,
  canResolverInterop: false,
};

const fullAccess: UserPermissions = {
  canViewDashboard: true,
  canViewPersonas: true,
  canViewExpediente: true,
  canManagePersonas: true,
  canViewUsuarios: true,
  canManageUsuarios: true,
  canViewSacerdotes: true,
  canManageSacerdotes: true,
  canViewSacramentos: true,
  canCreateSacramentos: true,
  canEditSacramentos: true,
  canDeleteSacramentos: true,
  canViewConstancias: true,
  canGenerateConstancias: true,
  canViewReportes: true,
  canViewConfiguracion: true,
  canManageConfiguracion: true,
  canSolicitarInterop: true,
  canResolverInterop: true,
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
    canManageSacerdotes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'sacerdote': {
    ...fullAccess,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canManageSacerdotes: false,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'diacono': {
    ...fullAccess,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canManageSacerdotes: false,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'secretario': {
    canViewDashboard: true,
    canViewPersonas: true,
    canViewExpediente: true,
    canManagePersonas: false,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewSacerdotes: true,
    canManageSacerdotes: true,
    canViewSacramentos: true,
    canCreateSacramentos: true,
    canEditSacramentos: false,
    canDeleteSacramentos: false,
    canViewConstancias: true,
    canGenerateConstancias: true,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
    canSolicitarInterop: true,
    canResolverInterop: false,
  },
  'catequista': {
    ...defaultPermissions,
    canViewPersonas: true,
    canViewExpediente: true,
    canViewSacramentos: true,
  },
  'solo lectura': {
    ...defaultPermissions,
    canViewPersonas: true,
    canViewExpediente: true,
    canViewSacerdotes: true,
    canViewSacramentos: true,
    canViewConstancias: true,
  },
};

// Alias de roles equivalentes (p. ej. variantes de género o sinónimos usados en BD/UI).
const roleAliases: Record<string, string> = {
  secretaria: 'secretario',
  'admin parroquial': 'admin parroquia',
  párroco: 'parroco',
  diácono: 'diacono',
};

export function normalizeRole(role?: string | null): string {
  const normalized = (role || 'guest').trim().toLowerCase();
  return roleAliases[normalized] ?? normalized;
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
