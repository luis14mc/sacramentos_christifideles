'use client';

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useSession } from 'next-auth/react';

function PerfilContent() {
  const { data: session } = useSession();
  const user = session?.user as {
    name?: string | null;
    email?: string | null;
    rol?: string;
    parishId?: string | number;
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body space-y-3">
            <div>
              <span className="text-sm text-base-content/60">Nombre</span>
              <p className="font-medium">{user?.name || '—'}</p>
            </div>
            <div>
              <span className="text-sm text-base-content/60">Email</span>
              <p className="font-medium">{user?.email || '—'}</p>
            </div>
            <div>
              <span className="text-sm text-base-content/60">Rol</span>
              <p className="font-medium capitalize">{user?.rol || '—'}</p>
            </div>
            {user?.parishId && (
              <div>
                <span className="text-sm text-base-content/60">Parroquia ID</span>
                <p className="font-medium">{user.parishId}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <PerfilContent />
    </ProtectedRoute>
  );
}
