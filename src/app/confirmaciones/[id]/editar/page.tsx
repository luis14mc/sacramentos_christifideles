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
import { ArrowLeftIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

function EditarConfirmacionContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [obispos, setObispos] = useState<SacerdoteOption[]>([]);
  const [formData, setFormData] = useState({
    numero_identidad_confirmado: '',
    numero_identidad_madre: '',
    numero_identidad_padre: '',
    numero_identidad_madrina: '',
    numero_identidad_padrino: '',
    numero_identidad_catequista: '',
    numero_identidad_obispo: '',
    fecha_confirmacion: '',
    nota_marginal: '',
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [recordRes, personasRes, sacerdotesRes] = await Promise.all([
        fetch(`/api/confirmaciones/${id}`),
        fetch('/api/personas'),
        fetch('/api/configuracion/sacerdotes?tipo=obispo&activos=1'),
      ]);

      if (personasRes.ok) setPersonas(await personasRes.json());
      if (sacerdotesRes.ok) {
        const clero = await sacerdotesRes.json();
        setObispos(clero.map(cleroToSelectOption));
      }

      if (recordRes.ok) {
        const r = await recordRes.json();
        setFormData({
          numero_identidad_confirmado: r.numero_identidad_confirmado,
          numero_identidad_madre: r.numero_identidad_madre,
          numero_identidad_padre: r.numero_identidad_padre,
          numero_identidad_madrina: r.numero_identidad_madrina,
          numero_identidad_padrino: r.numero_identidad_padrino,
          numero_identidad_catequista: r.numero_identidad_catequista,
          numero_identidad_obispo: r.numero_identidad_obispo,
          fecha_confirmacion: r.fecha_confirmacion.split('T')[0],
          nota_marginal: r.nota_marginal || '',
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'No encontrado',
          text: 'El registro no existe',
          confirmButtonColor: '#ef4444',
        });
        router.push('/confirmaciones');
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

    const validation = validateSacramentoFormClient('confirmacion', formData);
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
      const response = await fetch(`/api/confirmaciones/${id}`, {
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
        router.push('/confirmaciones');
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
            onClick={() => router.push('/confirmaciones')}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al listado
          </button>

          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Editar Confirmación</h1>
                <p className="text-base-content/70 text-sm">
                  Modificar datos del registro sacramental
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <PersonaSelectField
                label="Confirmado"
                value={formData.numero_identidad_confirmado}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, numero_identidad_confirmado: v }))
                }
                personas={personas}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PersonaSelectField
                  label="Padre"
                  value={formData.numero_identidad_padre}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_padre: v }))
                  }
                  personas={personas}
                />
                <PersonaSelectField
                  label="Madre"
                  value={formData.numero_identidad_madre}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_madre: v }))
                  }
                  personas={personas}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PersonaSelectField
                  label="Catequista"
                  value={formData.numero_identidad_catequista}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_catequista: v }))
                  }
                  personas={personas}
                />
                <SacerdoteSelectField
                  label="Obispo"
                  placeholder="Seleccionar obispo..."
                  value={formData.numero_identidad_obispo}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, numero_identidad_obispo: v }))
                  }
                  sacerdotes={obispos}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Fecha de confirmación</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.fecha_confirmacion}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha_confirmacion: e.target.value }))
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
                  onClick={() => router.push('/confirmaciones')}
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

export default function EditarConfirmacionPage() {
  return (
    <ProtectedRoute requiredPermission="canEditSacramentos">
      <EditarConfirmacionContent />
    </ProtectedRoute>
  );
}
