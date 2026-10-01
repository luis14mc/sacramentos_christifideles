'use client';

import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import Swal from 'sweetalert2';
import { BuildingLibraryIcon } from '@heroicons/react/24/outline';

interface ParroquiaData {
  id_parroquia: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string | null;
  alias_liturgico: string | null;
  parroco_nombre: string | null;
}

interface FormState {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  alias_liturgico: string;
  parroco_nombre: string;
}

function toForm(d: ParroquiaData): FormState {
  return {
    nombre: d.nombre ?? '',
    direccion: d.direccion ?? '',
    telefono: d.telefono ?? '',
    email: d.email ?? '',
    alias_liturgico: d.alias_liturgico ?? '',
    parroco_nombre: d.parroco_nombre ?? '',
  };
}

export default function ConfiguracionParroquiaPage() {
  const permissions = usePermissions();
  const puedeGestionar = permissions.canManageConfiguracion;
  const puedeVer = permissions.canViewConfiguracion;
  const [data, setData] = useState<ParroquiaData | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    fetch('/api/configuracion/parroquia')
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || 'No autorizado');
        }
        return r.json();
      })
      .then((j: ParroquiaData) => {
        setData(j);
        setForm(toForm(j));
      })
      .catch(async (e) => {
        await Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'No se pudo cargar' });
        setData(null);
        setForm(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (puedeVer) cargar();
    else setLoading(false);
  }, [puedeVer]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch('/api/configuracion/parroquia', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'Error', text: j.error || 'No se pudo guardar' });
        return;
      }
      setData(j);
      setForm(toForm(j));
      await Swal.fire({ icon: 'success', title: 'Guardado', timer: 1200, showConfirmButton: false });
    } finally {
      setSaving(false);
    }
  };

  if (!puedeVer) {
    return (
      <AuthenticatedLayout>
        <PageHeader icon={<BuildingLibraryIcon className="h-6 w-6 text-primary" />} title="Datos de la parroquia" />
        <PageCard>
          <p className="text-base-content/70">No tienes permiso para ver la configuración parroquial.</p>
        </PageCard>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<BuildingLibraryIcon className="h-6 w-6 text-primary" />}
          title="Datos de la parroquia"
          subtitle="Información institucional usada en las constancias."
        />

        <PageCard>
          <p className="text-sm text-base-content/70">
            Estos valores aparecen en el encabezado de cada constancia. El nombre del párroco
            se incluye como <code className="text-xs">{`{{parroquia.parroco}}`}</code> en plantillas y moldes.
          </p>
        </PageCard>

        {loading && (
          <PageCard>
            <p className="text-base-content/60">Cargando…</p>
          </PageCard>
        )}

        {!loading && form && (
          <PageCard>
            <form onSubmit={guardar} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text">Nombre *</span>
                  <input
                    className="input input-bordered"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    maxLength={100}
                    required
                    readOnly={!puedeGestionar}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Teléfono *</span>
                  <input
                    className="input input-bordered"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    maxLength={100}
                    required
                    readOnly={!puedeGestionar}
                  />
                </label>
                <label className="form-control md:col-span-2">
                  <span className="label-text">Dirección *</span>
                  <input
                    className="input input-bordered"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    maxLength={1000}
                    required
                    readOnly={!puedeGestionar}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Email</span>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    readOnly={!puedeGestionar}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Alias litúrgico</span>
                  <input
                    className="input input-bordered"
                    value={form.alias_liturgico}
                    onChange={(e) => setForm({ ...form, alias_liturgico: e.target.value })}
                    maxLength={150}
                    readOnly={!puedeGestionar}
                  />
                </label>
                <label className="form-control md:col-span-2">
                  <span className="label-text">Nombre del párroco (firma constancias)</span>
                  <input
                    className="input input-bordered"
                    value={form.parroco_nombre}
                    onChange={(e) => setForm({ ...form, parroco_nombre: e.target.value })}
                    maxLength={150}
                    readOnly={!puedeGestionar}
                  />
                </label>
              </div>
              {puedeGestionar && (
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              )}
              {!puedeGestionar && (
                <p className="text-xs text-base-content/60">
                  Tu rol no permite editar estos datos.
                </p>
              )}
            </form>
          </PageCard>
        )}

        {data && (
          <p className="text-xs text-base-content/60">
            ID parroquia: {data.id_parroquia}. Los cambios se reflejan en la próxima constancia generada.
          </p>
        )}
      </div>
    </AuthenticatedLayout>
  );
}