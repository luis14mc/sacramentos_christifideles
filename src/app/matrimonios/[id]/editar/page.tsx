'use client';

import { logger } from '@/lib/logger';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { validateSacramentoFormClient } from '@/lib/sacramento-form-validation';
import { cleroToSelectOption } from '@/lib/sacerdote';
import {
  PersonaSelectField,
  SacerdoteSelectField,
  type PersonaOption,
  type SacerdoteOption,
} from '@/components/sacramentos/PersonaSelectField';
import { ArrowLeftIcon, HeartIcon } from '@heroicons/react/24/outline';

function EditarMatrimonioContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [sacerdotes, setSacerdotes] = useState<SacerdoteOption[]>([]);
  const [formData, setFormData] = useState({
    numero_identidad_esposo: '',
    numero_identidad_esposa: '',
    numero_identidad_padrino: '',
    numero_identidad_madrina: '',
    numero_identidad_sacerdote: '',
    numero_identidad_padre_esposo: '',
    numero_identidad_madre_esposo: '',
    numero_identidad_padre_esposa: '',
    numero_identidad_madre_esposa: '',
    fecha_matrimonio: '',
    nota_marginal: '',
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [recordRes, personasRes, sacerdotesRes] = await Promise.all([
        fetch(`/api/matrimonios/${id}`),
        fetch('/api/personas'),
        fetch('/api/configuracion/sacerdotes?tipo=sacerdote&activos=1'),
      ]);

      if (personasRes.ok) setPersonas(await personasRes.json());
      if (sacerdotesRes.ok) {
        const clero = await sacerdotesRes.json();
        setSacerdotes(clero.map(cleroToSelectOption));
      }

      if (recordRes.ok) {
        const r = await recordRes.json();
        setFormData({
          numero_identidad_esposo: r.numero_identidad_esposo,
          numero_identidad_esposa: r.numero_identidad_esposa,
          numero_identidad_padrino: r.numero_identidad_padrino,
          numero_identidad_madrina: r.numero_identidad_madrina,
          numero_identidad_sacerdote: r.numero_identidad_sacerdote,
          numero_identidad_padre_esposo: r.numero_identidad_padre_esposo || '',
          numero_identidad_madre_esposo: r.numero_identidad_madre_esposo || '',
          numero_identidad_padre_esposa: r.numero_identidad_padre_esposa || '',
          numero_identidad_madre_esposa: r.numero_identidad_madre_esposa || '',
          fecha_matrimonio: r.fecha_matrimonio.split('T')[0],
          nota_marginal: r.nota_marginal || '',
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'No encontrado',
          text: 'El registro no existe',
          confirmButtonColor: '#ef4444',
        });
        router.push('/matrimonios');
      }
    } catch (error) {
      logger.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateSacramentoFormClient('matrimonio', formData);
    if (!validation.ok) {
      await Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: validation.error,
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/matrimonios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'El registro se actualizó correctamente.',
          confirmButtonColor: '#10b981',
        });
        router.push('/matrimonios');
      } else {
        const data = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo actualizar',
          confirmButtonColor: '#ef4444',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg" />
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
            onClick={() => router.push('/matrimonios')}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al listado
          </button>

          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <HeartIcon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Editar Matrimonio</h1>
                <p className="text-base-content/70 text-sm">
                  Modificar datos del registro sacramental
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PersonaSelectField
                  label="Esposo"
                  value={formData.numero_identidad_esposo}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_esposo: v }))
                  }
                  personas={personas}
                />
                <PersonaSelectField
                  label="Esposa"
                  value={formData.numero_identidad_esposa}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_esposa: v }))
                  }
                  personas={personas}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PersonaSelectField
                  label="Padre del esposo"
                  value={formData.numero_identidad_padre_esposo}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_padre_esposo: v }))
                  }
                  personas={personas}
                  required={false}
                />
                <PersonaSelectField
                  label="Madre del esposo"
                  value={formData.numero_identidad_madre_esposo}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_madre_esposo: v }))
                  }
                  personas={personas}
                  required={false}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PersonaSelectField
                  label="Padre de la esposa"
                  value={formData.numero_identidad_padre_esposa}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_padre_esposa: v }))
                  }
                  personas={personas}
                  required={false}
                />
                <PersonaSelectField
                  label="Madre de la esposa"
                  value={formData.numero_identidad_madre_esposa}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_madre_esposa: v }))
                  }
                  personas={personas}
                  required={false}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PersonaSelectField
                  label="Padrino"
                  value={formData.numero_identidad_padrino}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_padrino: v }))
                  }
                  personas={personas}
                />
                <PersonaSelectField
                  label="Madrina"
                  value={formData.numero_identidad_madrina}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_madrina: v }))
                  }
                  personas={personas}
                />
                <SacerdoteSelectField
                  value={formData.numero_identidad_sacerdote}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_sacerdote: v }))
                  }
                  sacerdotes={sacerdotes}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Fecha de matrimonio</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.fecha_matrimonio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha_matrimonio: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nota marginal</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  maxLength={1000}
                  value={formData.nota_marginal}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nota_marginal: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => router.push('/matrimonios')}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
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

export default function EditarMatrimonioPage() {
  return (
    <ProtectedRoute requiredPermission="canEditSacramentos">
      <EditarMatrimonioContent />
    </ProtectedRoute>
  );
}
