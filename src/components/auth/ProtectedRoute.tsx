'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useCanAccess, UserPermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof UserPermissions;
  requiredRoles?: string[];
  fallbackRoute?: string;
  showUnauthorized?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  requiredRoles,
  fallbackRoute = '/dashboard',
  showUnauthorized = false
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canAccess, hasAnyRole } = useCanAccess();

  useEffect(() => {
    if (status === 'loading') return; // Aún cargando

    if (!session) {
      router.push('/login');
      return;
    }

    // Verificar permisos específicos
    if (requiredPermission && !canAccess(requiredPermission)) {
      router.push(fallbackRoute);
      return;
    }

    // Verificar roles específicos
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      router.push(fallbackRoute);
      return;
    }
  }, [session, status, requiredPermission, requiredRoles, canAccess, hasAnyRole, router, fallbackRoute]);

  // Mostrar loading mientras verifica
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // No hay sesión
  if (!session) {
    return null;
  }

  // Verificar permisos
  const hasRequiredPermission = !requiredPermission || canAccess(requiredPermission);
  const hasRequiredRole = !requiredRoles || hasAnyRole(requiredRoles);

  if (!hasRequiredPermission || !hasRequiredRole) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
            <p className="text-base-content/70 mb-4">
              No tienes permisos suficientes para acceder a esta página.
            </p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="btn btn-primary"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

// HOC para facilitar el uso
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: keyof UserPermissions,
  requiredRoles?: string[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        requiredPermission={requiredPermission} 
        requiredRoles={requiredRoles}
      >
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
