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

export const fullPermissions: UserPermissions = {
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
