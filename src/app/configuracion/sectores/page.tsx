'use client';

import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import Swal from 'sweetalert2';
import { HomeModernIcon } from '@heroicons/react/24/outline';

interface Sector {
  id_sector_parroquial: string;
  id_parroquia: number;
  id_tipo_sector_parroquial: number;
  nombre: string;
  nombre_capilla: string | null;
  direccion: string;
  tipo_sector?: { nombre: string } | null;
}


interface FormState {
  nombre: string;
  nombre_capilla: string;
  direccion: string;
}

const EMPTY_FORM: FormState = { nombre: '', nombre_capilla: '', direccion: '' };

export default function ConfiguracionSectoresPage() {
  const permissions = usePermissions();
  const puedeGestionar = permissions.canManageConfiguracion;
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const rSect = await fetch('/api/configuracion/sectores');
      const dSect = await rSect.json().catch(() => []);
      setSectores(Array.isArray(dSect) ? dSect : []);
    } catch {
      setSectores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const iniciarNuevo = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const editar = (s: Sector) => {
    setEditId(s.id_sector_parroquial);
    setForm({
      nombre: s.nombre,
      nombre_capilla: s.nombre_capilla ?? '',
      direccion: s.direccion,
    });
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      nombre: form.nombre,
      nombre_capilla: form.nombre_capilla,
      direccion: form.direccion,
    };
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/configuracion/sectores/${editId}` : '/api/configuracion/sectores';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      await Swal.fire({ icon: 'error', title: 'Error', text: j.error || 'No se pudo guardar' });
      return;
    }
    await Swal.fire({ icon: 'success', title: 'Guardado', timer: 1000, showConfirmButton: false });
    iniciarNuevo();
    cargar();
  };

  const eliminar = async (s: Sector) => {
    const conf = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar sector?',
      text: `Se eliminará "${s.nombre}". Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!conf.isConfirmed) return;
    const res = await fetch(`/api/configuracion/sectores/${s.id_sector_parroquial}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      await Swal.fire({ icon: 'error', title: 'Error', text: j.error || 'No se pudo eliminar' });
      return;
    }
    await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false });
    cargar();
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<HomeModernIcon className="h-6 w-6 text-primary" />}
          title="Sectores y capillas"
          subtitle="Organiza el territorio parroquial. Cada Persona requiere un sector."
        />

        {puedeGestionar && (
          <PageCard>
            <form onSubmit={enviar} className="space-y-3">
              <h3 className="font-semibold">{editId ? 'Editar sector' : 'Nuevo sector'}</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text">Nombre *</span>
                  <input
                    className="input input-bordered"
                    placeholder="Ej. Sede parroquial, Sector Las Uvas"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    maxLength={55}
                    required
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Nombre de capilla (opcional)</span>
                  <input
                    className="input input-bordered"
                    value={form.nombre_capilla}
                    onChange={(e) => setForm({ ...form, nombre_capilla: e.target.value })}
                    maxLength={55}
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
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm">{editId ? 'Guardar cambios' : 'Crear sector'}</button>
                {editId && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={iniciarNuevo}>Cancelar</button>
                )}
              </div>
            </form>
          </PageCard>
        )}

        <PageCard padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="font-semibold">Nombre</th>
                  <th className="font-semibold">Capilla</th>
                  <th className="font-semibold">Dirección</th>
                  <th className="font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={4} className="text-center text-base-content/60 py-12">Cargando…</td></tr>
                )}
                {!loading && sectores.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-base-content/60 py-12">Sin sectores.</td></tr>
                )}
                {sectores.map((s) => (
                  <tr key={s.id_sector_parroquial} className="hover:bg-base-200/30">
                    <td>{s.nombre}</td>
                    <td>{s.nombre_capilla || '—'}</td>
                    <td className="max-w-md truncate" title={s.direccion}>{s.direccion}</td>
                    <td className="text-right">
                      {puedeGestionar && (
                        <div className="flex justify-end gap-1">
                          <button className="btn btn-ghost btn-xs" onClick={() => editar(s)}>Editar</button>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => eliminar(s)}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageCard>
      </div>
    </AuthenticatedLayout>
  );
}