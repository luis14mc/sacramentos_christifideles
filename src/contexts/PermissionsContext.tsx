'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  defaultPermissions,
  type UserPermissions,
} from '@/types/permissions';

interface PermissionsContextValue {
  permissions: UserPermissions;
  loading: boolean;
  userRole: string;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: defaultPermissions,
  loading: true,
  userRole: 'guest',
  refresh: async () => undefined,
});

export function PermissionsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] =
    useState<UserPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user?.rol || 'guest').toLowerCase();

  const fetchPermissions = useCallback(async () => {
    if (status !== 'authenticated') {
      setPermissions(defaultPermissions);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/me/permissions');
      if (!response.ok) {
        throw new Error('No se pudieron cargar permisos');
      }
      const data = await response.json();
      setPermissions(data.permissions as UserPermissions);
    } catch {
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void fetchPermissions();
  }, [fetchPermissions, session?.user?.id]);

  const value = useMemo(
    () => ({
      permissions,
      loading,
      userRole,
      refresh: fetchPermissions,
    }),
    [permissions, loading, userRole, fetchPermissions]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
