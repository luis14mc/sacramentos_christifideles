import { useSession } from 'next-auth/react';
import {
  getPermissionsForRole,
  type UserPermissions,
} from '@/lib/permissions';

export type { UserPermissions } from '@/lib/permissions';

export function usePermissions(): UserPermissions {
  const { data: session } = useSession();
  return getPermissionsForRole(session?.user?.rol);
}

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
