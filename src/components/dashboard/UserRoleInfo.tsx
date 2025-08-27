'use client';

import { useSession } from 'next-auth/react';
import { useCanAccess } from '@/hooks/usePermissions';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

export default function UserRoleInfo() {
  const { data: session } = useSession();
  const { permissions, userRole, canAccess } = useCanAccess();

  if (!session?.user) {
    return null;
  }

  const user = session.user as any;

  const permissionChecks = [
    { label: 'Ver Dashboard', key: 'canViewDashboard' as const },
    { label: 'Gestionar Usuarios', key: 'canManageUsuarios' as const },
    { label: 'Ver Sacramentos', key: 'canViewSacramentos' as const },
    { label: 'Crear Sacramentos', key: 'canCreateSacramentos' as const },
    { label: 'Editar Sacramentos', key: 'canEditSacramentos' as const },
    { label: 'Borrar Sacramentos', key: 'canDeleteSacramentos' as const },
    { label: 'Ver Reportes', key: 'canViewReportes' as const },
    { label: 'Ver Configuración', key: 'canViewConfiguracion' as const },
    { label: 'Generar Constancias', key: 'canGenerateConstancias' as const },
  ];

  return (
    <div className="bg-base-100 rounded-lg border border-base-300 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <UserIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Información de Usuario</h3>
          <p className="text-base-content/70">Permisos y rol actual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos del Usuario */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Datos del Usuario
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/70">Nombre:</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/70">Rol:</span>
              <span className={`badge ${
                userRole === 'administrador' ? 'badge-primary' :
                userRole === 'parroco' ? 'badge-secondary' :
                userRole === 'secretario' ? 'badge-warning' :
                'badge-ghost'
              }`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Permisos */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4" />
            Permisos de Acceso
          </h4>
          <div className="space-y-2">
            {permissionChecks.map((check) => {
              const hasPermission = canAccess(check.key);
              return (
                <div key={check.key} className="flex items-center justify-between text-sm">
                  <span className="text-base-content/70">{check.label}:</span>
                  <div className="flex items-center gap-1">
                    {hasPermission ? (
                      <CheckCircleIcon className="h-4 w-4 text-success" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-error" />
                    )}
                    <span className={hasPermission ? 'text-success' : 'text-error'}>
                      {hasPermission ? 'Permitido' : 'Denegado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mensaje especial para secretario */}
      {userRole === 'secretario' && (
        <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
          <div className="flex items-start gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-info mt-0.5" />
            <div>
              <h5 className="font-medium text-info">Rol Secretario - Permisos Específicos</h5>
              <p className="text-sm text-base-content/80 mt-1">
                Puedes crear nuevos registros de sacramentos y generar constancias, pero no editar ni eliminar registros existentes. 
                No tienes acceso a gestión de usuarios, reportes ni configuración.
              </p>
              <div className="mt-2 text-xs text-base-content/70">
                <strong>✅ Permitido:</strong> Crear sacramentos, generar constancias<br />
                <strong>❌ Restringido:</strong> Editar/eliminar sacramentos, usuarios, reportes, configuración
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
