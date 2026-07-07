'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  PersonaSelectField,
  SacerdoteSelectField,
  type PersonaOption,
  type SacerdoteOption,
} from '@/components/sacramentos/PersonaSelectField';
import { validateSacramentoFormClient } from '@/lib/sacramento-form-validation';
import { logger } from '@/lib/logger';
import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface NumeracionPreview {
  numero_libro: string;
  numero_folio: string;
  numero_pagina: string;
  numero_registro: string;
}

function NuevoBautismoContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [sacerdotes, setSacerdotes] = useState<SacerdoteOption[]>([]);
  const [numeracion, setNumeracion] = useState<NumeracionPreview | null>(null);
  const [formData, setFormData] = useState({
    numero_identidad_bautizado: '',
    numero_identidad_madre: '',
    numero_identidad_padre: '',
    numero_identidad_madrina: '',
    numero_identidad_padrino: '',
    numero_identidad_catequista: '',
    numero_identidad_sacerdote: '',
    fecha_bautismo: new Date().toISOString().split('T')[0],
    nota_marginal: '',
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [personasRes, sacerdotesRes, numeradorRes] = await Promise.all([
          fetch('/api/personas'),
          fetch('/api/configuracion/sacerdotes'),
          fetch('/api/bautismos/numerador'),
        ]);

        if (personasRes.ok) {
          setPersonas(await personasRes.json());
        }
        if (sacerdotesRes.ok) {
          setSacerdotes(await sacerdotesRes.json());
        }
        if (numeradorRes.ok) {
          setNumeracion(await numeradorRes.json());
        }
      } catch (error) {
        logger.error('Error al cargar datos', error);
      }
    }

    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateSacramentoFormClient('bautismo', formData);
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
      const response = await fetch('/api/bautismos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Bautismo registrado',
          text: 'El registro se guardó correctamente.',
          confirmButtonColor: '#10b981',
        });
        router.push('/bautismos');
      } else {
        const data = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo registrar el bautismo',
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
            onClick={() => router.push('/bautismos')}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al listado
          </button>

          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Nuevo Bautismo</h1>
                <p className="text-base-content/70 text-sm">
                  Registrar un nuevo sacramento de bautismo
                </p>
              </div>
            </div>

            {numeracion && (
              <div className="alert alert-info mb-6">
                <div className="text-sm">
                  <strong>Próxima numeración:</strong> Libro {numeracion.numero_libro},
                  Folio {numeracion.numero_folio}, Registro {numeracion.numero_registro}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <PersonaSelectField
                label="Bautizado"
                value={formData.numero_identidad_bautizado}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, numero_identidad_bautizado: v }))
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
                  value={formData.numero_identidad_sacerdote}
                  onChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      numero_identidad_sacerdote: v,
                    }))
                  }
                  sacerdotes={sacerdotes}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Fecha de bautismo <span className="text-error ml-1">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.fecha_bautismo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha_bautismo: e.target.value }))
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
                  onClick={() => router.push('/bautismos')}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Registrar Bautismo'
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

export default function NuevoBautismoPage() {
  return (
    <ProtectedRoute requiredPermission="canCreateSacramentos">
      <NuevoBautismoContent />
    </ProtectedRoute>
  );
}
