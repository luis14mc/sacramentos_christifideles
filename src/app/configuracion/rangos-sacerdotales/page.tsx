'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface Rango {
  id_rango_sacerdotal: number;
  nombre: string;
  descripcion?: string | null;
  _count?: { orden_sacerdotal: number };
}

export default function RangosSacerdotalesPage() {
  const permissions = usePermissions();
  const [items, setItems] = useState<Rango[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const cargar = () => {
    setLoading(true);
    fetch('/api/rangos-sacerdotales')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async () => {
    if (!nombre.trim()) {
      await Swal.fire({ icon: 'warning', title: 'El nombre es obligatorio' });
      return;
    }
    const url = editId ? `/api/rangos-sacerdotales/${editId}` : '/api/rangos-sacerdotales';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: data.error || 'Error' });
      return;
    }
    setNombre('');
    setDescripcion('');
    setEditId(null);
    cargar();
  };

  const editar = (item: Rango) => {
    setEditId(item.id_rango_sacerdotal);
    setNombre(item.nombre);
    setDescripcion(item.descripcion || '');
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0 gap-3">
          <Link href="/configuracion" className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <IdentificationIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Rangos sacerdotales</h1>
            <p className="text-base-content/70 text-sm">Catálogo: diácono, presbítero, obispo, etc.</p>
          </div>
        </div>
      </div>

      {permissions.canManageConfiguracion ? (
        <div className="bg-base-100 rounded-lg border border-base-300 p-4 mb-6 space-y-3">
          <h2 className="font-semibold">{editId ? 'Editar rango' : 'Nuevo rango'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input input-bordered w-full"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <input
              className="input input-bordered w-full"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary gap-2" onClick={guardar}>
              <PlusIcon className="h-4 w-4" />
              {editId ? 'Guardar' : 'Agregar'}
            </button>
            {editId ? (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditId(null);
                  setNombre('');
                  setDescripcion('');
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="bg-base-100 rounded-lg border border-base-300 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>En uso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-base-content/60">
                  No hay rangos
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id_rango_sacerdotal}>
                  <td>{item.nombre}</td>
                  <td>{item.descripcion || '—'}</td>
                  <td>{item._count?.orden_sacerdotal ?? 0}</td>
                  <td>
                    {permissions.canManageConfiguracion ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => editar(item)}>
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AuthenticatedLayout>
  );
}
