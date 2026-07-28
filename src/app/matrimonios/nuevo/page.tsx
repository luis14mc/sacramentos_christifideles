'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface NumeracionPreview {
  numero_libro: string;
  numero_acta?: string;
  numero_registro: string;
}

const initialForm = {
  numero_identidad_esposo: '',
  numero_identidad_esposa: '',
  numero_identidad_padrino: '',
  numero_identidad_madrina: '',
  numero_identidad_sacerdote: '',
  numero_identidad_padre_esposo: '',
  numero_identidad_madre_esposo: '',
  numero_identidad_padre_esposa: '',
  numero_identidad_madre_esposa: '',
  fecha_matrimonio: new Date().toISOString().split('T')[0],
  nota_marginal: '',
};

function NuevoMatrimonioContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [sacerdotes, setSacerdotes] = useState<SacerdoteOption[]>([]);
  const [numeracion, setNumeracion] = useState<NumeracionPreview | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [personasRes, sacerdotesRes, numeradorRes] = await Promise.all([
          fetch('/api/personas'),
          fetch('/api/configuracion/sacerdotes?tipo=sacerdote&activos=1'),
          fetch('/api/matrimonios/numerador'),
        ]);

        if (personasRes.ok) setPersonas(await personasRes.json());
        if (sacerdotesRes.ok) {
          const clero = await sacerdotesRes.json();
          setSacerdotes(clero.map(cleroToSelectOption));
        }
        if (numeradorRes.ok) setNumeracion(await numeradorRes.json());
      } catch (error) {
        logger.error('Error al cargar datos:', error);
      }
    }

    cargarDatos();
  }, []);

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

    setLoading(true);

    try {
      const response = await fetch('/api/matrimonios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Matrimonio registrado',
          text: 'El registro se guardó correctamente.',
          confirmButtonColor: '#10b981',
        });
        router.push('/matrimonios');
      } else {
        const data = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo registrar',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ef4444',
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
                <h1 className="text-2xl font-bold">Nuevo Matrimonio</h1>
                <p className="text-base-content/70 text-sm">
                  Registrar sacramento de matrimonio
                </p>
              </div>
            </div>

            {numeracion && (
              <div className="alert alert-info mb-6">
                <div className="text-sm">
                  <strong>Próxima numeración:</strong> Libro {numeracion.numero_libro},
                  Acta {numeracion.numero_acta}, Registro {numeracion.numero_registro}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-base-content/60 mb-3">
                  Contrayentes
                </h2>
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
              </div>

              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-base-content/60 mb-3">
                  Padres del esposo (opcional)
                </h2>
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
              </div>

              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-base-content/60 mb-3">
                  Padres de la esposa (opcional)
                </h2>
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
              </div>

              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-base-content/60 mb-3">
                  Testigos y celebrante
                </h2>
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
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Fecha de matrimonio <span className="text-error ml-1">*</span>
                  </span>
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
                  placeholder="Observaciones opcionales..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => router.push('/matrimonios')}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Registrar'
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

export default function NuevoMatrimonioPage() {
  return (
    <ProtectedRoute requiredPermission="canCreateSacramentos">
      <NuevoMatrimonioContent />
    </ProtectedRoute>
  );
}
