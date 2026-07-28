'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CleroForm, {
  buildCleroPayload,
  emptyCleroForm,
} from '@/components/configuracion/CleroForm';
import type { PersonaOption } from '@/components/sacramentos/PersonaSelectField';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';

function NuevoCleroContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [formData, setFormData] = useState(emptyCleroForm);

  useEffect(() => {
    async function loadPersonas() {
      try {
        const response = await fetch('/api/personas');
        if (response.ok) {
          setPersonas(await response.json());
        }
      } finally {
        setLoadingPersonas(false);
      }
    }
    loadPersonas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero_identidad) {
      await Swal.fire({
        icon: 'warning',
        title: 'Persona requerida',
        text: 'Debe registrar primero a la persona en el módulo Personas',
        confirmButtonColor: '#590202',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/configuracion/sacerdotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCleroPayload(formData)),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Ministro registrado',
          text: 'La extensión clerical se guardó correctamente.',
          confirmButtonColor: '#590202',
        });
        router.push('/configuracion/sacerdotes');
      } else {
        const data = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo registrar el ministro',
          confirmButtonColor: '#590202',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#590202',
      });
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <UserPlusIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Nuevo Ministro Ordenado</h1>
                <p className="text-base-content/70 text-sm">
                  Asignar extensión clerical a una persona ya registrada
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <CleroForm
                formData={formData}
                setFormData={setFormData}
                personas={personas}
                loadingPersonas={loadingPersonas}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => router.push('/configuracion/sacerdotes')}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function NuevoCleroPage() {
  return (
    <ProtectedRoute requiredPermission="canManageConfiguracion">
      <NuevoCleroContent />
    </ProtectedRoute>
  );
}
