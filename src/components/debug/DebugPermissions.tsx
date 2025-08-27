'use client';

import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';

export default function DebugPermissions() {
  const { data: session, status } = useSession();
  const permissions = usePermissions();

  return (
    <div className="bg-yellow-100 border border-yellow-300 p-2 rounded mb-4 text-xs">
      <h3 className="font-bold">🐛 DEBUG PERMISOS</h3>
      <p>Status: {status}</p>
      <p>Session: {session ? 'Sí' : 'No'}</p>
      {session && (
        <>
          <p>Usuario: {session.user?.name}</p>
          <p>Email: {session.user?.email}</p>
          <p>Rol: <strong>{session.user?.rol || 'NO DEFINIDO'}</strong></p>
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold">Ver permisos</summary>
            <div className="mt-1 text-xs grid grid-cols-2 gap-1">
              <span>Dashboard: {permissions.canViewDashboard ? '✅' : '❌'}</span>
              <span>Personas: {permissions.canViewPersonas ? '✅' : '❌'}</span>
              <span>Usuarios: {permissions.canViewUsuarios ? '✅' : '❌'}</span>
              <span>Sacramentos: {permissions.canViewSacramentos ? '✅' : '❌'}</span>
              <span>Crear Sacr.: {permissions.canCreateSacramentos ? '✅' : '❌'}</span>
              <span>Editar Sacr.: {permissions.canEditSacramentos ? '✅' : '❌'}</span>
              <span>Borrar Sacr.: {permissions.canDeleteSacramentos ? '✅' : '❌'}</span>
              <span>Constancias: {permissions.canViewConstancias ? '✅' : '❌'}</span>
              <span>Reportes: {permissions.canViewReportes ? '✅' : '❌'}</span>
              <span>Config.: {permissions.canViewConfiguracion ? '✅' : '❌'}</span>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
