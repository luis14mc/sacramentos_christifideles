'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface CleroDetalle {
  numero_identidad: string;
  es_parroco: number;
  estado_ministerial: number;
  otra_orden_religiosa?: string | null;
  rango: { nombre: string };
  orden_religiosa?: { nombre: string } | null;
  parroquia: { nombre: string };
  persona: {
    nombres: string;
    apellidos: string;
    telefono?: string;
    email?: string | null;
    fecha_nacimiento?: string;
    lugar_nacimiento?: string;
  };
}

function VerCleroContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [clero, setClero] = useState<CleroDetalle | null>(null);

  const cargarClero = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/configuracion/sacerdotes/${encodeURIComponent(id)}`);

      if (!response.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'No encontrado',
          text: 'El registro clerical no existe',
          confirmButtonColor: '#590202',
        });
        router.push('/configuracion/sacerdotes');
        return;
      }

      setClero(await response.json());
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    cargarClero();
  }, [cargarClero]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex justify-center min-h-[400px] items-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!clero) return null;

  return (
    <AuthenticatedLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <button
            type="button"
            onClick={() => router.push('/configuracion/sacerdotes')}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al listado
          </button>

          <div className="bg-base-100 rounded-xl border border-base-300 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <UserCircleIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {clero.persona.nombres} {clero.persona.apellidos}
                  </h1>
                  <p className="text-base-content/70">{clero.numero_identidad}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-2"
                onClick={() =>
                  router.push(
                    `/configuracion/sacerdotes/${encodeURIComponent(id)}/editar`
                  )
                }
              >
                <PencilSquareIcon className="h-4 w-4" />
                Editar datos clericales
              </button>
            </div>

            <div className="mb-6 rounded-lg border border-base-300 p-4 bg-base-200/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-base-content/70">Datos personales (Persona)</p>
                <Link
                  href={`/personas/${encodeURIComponent(id)}/editar`}
                  className="btn btn-ghost btn-xs"
                >
                  Editar en Personas
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-base-content/60">Teléfono</p>
                  <p className="font-medium">{clero.persona.telefono || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Email</p>
                  <p className="font-medium">{clero.persona.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Fecha de nacimiento</p>
                  <p className="font-medium">{clero.persona.fecha_nacimiento || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Lugar de nacimiento</p>
                  <p className="font-medium">{clero.persona.lugar_nacimiento || '—'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-content/60">Grado ministerial</p>
                <p className="font-medium">
                  {clero.es_parroco === 1 ? 'Párroco' : clero.rango.nombre}
                </p>
              </div>
              <div>
                <p className="text-sm text-base-content/60">Orden religiosa</p>
                <p className="font-medium">{clero.orden_religiosa?.nombre || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/60">Parroquia</p>
                <p className="font-medium">{clero.parroquia.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/60">Estado ministerial</p>
                <span
                  className={`badge ${clero.estado_ministerial === 1 ? 'badge-success' : 'badge-error'}`}
                >
                  {clero.estado_ministerial === 1 ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {clero.otra_orden_religiosa && (
                <div className="md:col-span-2">
                  <p className="text-sm text-base-content/60">Otra orden religiosa</p>
                  <p className="font-medium">{clero.otra_orden_religiosa}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function VerCleroPage() {
  return (
    <ProtectedRoute requiredPermission="canManageConfiguracion">
      <VerCleroContent />
    </ProtectedRoute>
  );
}
