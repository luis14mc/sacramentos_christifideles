'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CleroForm, {
  buildCleroPayload,
  emptyCleroForm,
  type CleroFormData,
} from '@/components/configuracion/CleroForm';
import type { PersonaOption } from '@/components/sacramentos/PersonaSelectField';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

function EditarCleroContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [personaDetalle, setPersonaDetalle] = useState<{
    nombres: string;
    apellidos: string;
    telefono?: string;
    email?: string | null;
    fecha_nacimiento?: string;
  }>();
  const [formData, setFormData] = useState<CleroFormData>(emptyCleroForm);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [cleroRes, personasRes] = await Promise.all([
        fetch(`/api/configuracion/sacerdotes/${encodeURIComponent(id)}`),
        fetch('/api/personas'),
      ]);

      if (personasRes.ok) setPersonas(await personasRes.json());

      if (!cleroRes.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'No encontrado',
          text: 'El registro clerical no existe',
          confirmButtonColor: '#590202',
        });
        router.push('/configuracion/sacerdotes');
        return;
      }

      const data = await cleroRes.json();
      setFormData({
        numero_identidad: data.numero_identidad,
        id_rango_sacerdotal: String(data.id_rango_sacerdotal),
        id_orden_religiosa: data.id_orden_religiosa
          ? String(data.id_orden_religiosa)
          : '',
        otra_orden_religiosa: data.otra_orden_religiosa || '',
        es_parroco: data.es_parroco === 1,
        estado_ministerial: data.estado_ministerial,
      });
      setPersonaDetalle(data.persona);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = buildCleroPayload(formData);
      delete (payload as { numero_identidad?: string }).numero_identidad;
      const response = await fetch(
        `/api/configuracion/sacerdotes/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Los datos clericales se guardaron correctamente.',
          confirmButtonColor: '#590202',
        });
        router.push('/configuracion/sacerdotes');
      } else {
        const data = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo actualizar el registro',
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex justify-center min-h-[400px] items-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

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
                <PencilSquareIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Editar Ministro</h1>
                <p className="text-base-content/70 text-sm">{id}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <CleroForm
                formData={formData}
                setFormData={setFormData}
                personas={personas}
                personaDetalle={personaDetalle}
                isEdit
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => router.push('/configuracion/sacerdotes')}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Guardar cambios'
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

export default function EditarCleroPage() {
  return (
    <ProtectedRoute requiredPermission="canManageConfiguracion">
      <EditarCleroContent />
    </ProtectedRoute>
  );
}
