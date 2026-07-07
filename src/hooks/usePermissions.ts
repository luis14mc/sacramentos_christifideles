import {
  defaultPermissions,
  type UserPermissions,
} from '@/types/permissions';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useSession } from 'next-auth/react';

export type { UserPermissions } from '@/types/permissions';
export { defaultPermissions } from '@/types/permissions';

export function usePermissions(): UserPermissions {
  const { permissions, loading } = usePermissionsContext();
  const { status } = useSession();

  if (status !== 'authenticated' || loading) {
    return defaultPermissions;
  }

  return permissions;
}

export function useCanAccess() {
  const { permissions, userRole } = usePermissionsContext();
  const { data: session } = useSession();

  const canAccess = (permission: keyof UserPermissions): boolean => {
    return permissions[permission];
  };

  const hasRole = (role: string): boolean => {
    return userRole === role.toLowerCase();
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((r) => r.toLowerCase() === userRole);
  };

  return {
    canAccess,
    hasRole,
    hasAnyRole,
    permissions,
    userRole: session?.user?.rol?.toLowerCase() ?? userRole,
  };
}
