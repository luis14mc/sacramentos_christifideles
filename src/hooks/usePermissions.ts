import { useSession } from 'next-auth/react';

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

// Definición de permisos por rol
const rolePermissions: Record<string, UserPermissions> = {
  'super admin': {
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
  },
  'administrador': {
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
  },
  'parroco': {
    canViewDashboard: true,
    canViewPersonas: true,
    canManagePersonas: true,
    canViewUsuarios: true,
    canManageUsuarios: false, // Solo puede ver, no gestionar usuarios
    canViewSacramentos: true,
    canCreateSacramentos: true,
    canEditSacramentos: true,
    canDeleteSacramentos: true, // SÍ puede dar de baja sacramentos
    canViewConstancias: true,
    canGenerateConstancias: true,
    canViewReportes: true, // SÍ puede ver reportería
    canViewConfiguracion: true,
    canManageConfiguracion: false, // Solo puede ver configuración
  },
  'vicario': {
    canViewDashboard: true,
    canViewPersonas: true,
    canManagePersonas: true,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewSacramentos: true,
    canCreateSacramentos: true,
    canEditSacramentos: true,
    canDeleteSacramentos: true,
    canViewConstancias: true,
    canGenerateConstancias: true,
    canViewReportes: true,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'sacerdote': {
    canViewDashboard: true,
    canViewPersonas: true,
    canManagePersonas: true,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewSacramentos: true,
    canCreateSacramentos: true,
    canEditSacramentos: true,
    canDeleteSacramentos: true,
    canViewConstancias: true,
    canGenerateConstancias: true,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'diacono': {
    canViewDashboard: true,
    canViewPersonas: true,
    canManagePersonas: true,
    canViewUsuarios: false,
    canManageUsuarios: false,
    canViewSacramentos: true,
    canCreateSacramentos: true,
    canEditSacramentos: true,
    canDeleteSacramentos: true,
    canViewConstancias: true,
    canGenerateConstancias: true,
    canViewReportes: false,
    canViewConfiguracion: false,
    canManageConfiguracion: false,
  },
  'secretario': {
    canViewDashboard: true,
    canViewPersonas: true,
    canManagePersonas: false, // Solo lectura
    canViewUsuarios: false, // NO acceso a usuarios
    canManageUsuarios: false,
    canViewSacramentos: true,
    canCreateSacramentos: true, // SÍ puede crear sacramentos
    canEditSacramentos: false, // NO puede editar
    canDeleteSacramentos: false, // NO puede borrar
    canViewConstancias: true,
    canGenerateConstancias: true, // SÍ puede generar constancias
    canViewReportes: false, // NO acceso a reportes
    canViewConfiguracion: false, // NO acceso a configuración
    canManageConfiguracion: false,
  },
};

// Permisos por defecto (usuario sin rol específico)
const defaultPermissions: UserPermissions = {
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

export function usePermissions(): UserPermissions {
  const { data: session } = useSession();
  
  if (!session?.user) {
    return defaultPermissions;
  }
  
  // Normalizar el rol a minúsculas para consistencia
  const userRole = (session.user.rol || 'guest').toLowerCase();
  
  return rolePermissions[userRole] || defaultPermissions;
}

// Hook para verificar permisos específicos
export function useCanAccess() {
  const permissions = usePermissions();
  const { data: session } = useSession();
  
  const canAccess = (permission: keyof UserPermissions): boolean => {
    return permissions[permission];
  };
  
  const hasRole = (role: string): boolean => {
    const userRole = session?.user?.rol?.toLowerCase();
    return userRole === role.toLowerCase();
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    const userRole = session?.user?.rol?.toLowerCase();
    return userRole ? roles.some(r => r.toLowerCase() === userRole) : false;
  };
  
  return {
    canAccess,
    hasRole,
    hasAnyRole,
    permissions,
    userRole: (session?.user?.rol || 'guest').toLowerCase(),
  };
}
