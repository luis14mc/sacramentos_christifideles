'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface Orden {
  id_orden_religiosa: number;
  nombre: string;
  nombre_latin?: string | null;
  abreviatura?: string | null;
  descripcion?: string | null;
  rama: string;
  _count?: { orden_sacerdotal: number; personas: number };
}

export default function OrdenesReligiosasPage() {
  const permissions = usePermissions();
  const [items, setItems] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    nombre_latin: '',
    abreviatura: '',
    descripcion: '',
    rama: 'N',
  });
  const [editId, setEditId] = useState<number | null>(null);

  const cargar = () => {
    setLoading(true);
    fetch('/api/ordenes-religiosas')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async () => {
    if (!form.nombre.trim()) {
      await Swal.fire({ icon: 'warning', title: 'El nombre es obligatorio' });
      return;
    }
    const url = editId ? `/api/ordenes-religiosas/${editId}` : '/api/ordenes-religiosas';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: data.error || 'Error' });
      return;
    }
    setForm({ nombre: '', nombre_latin: '', abreviatura: '', descripcion: '', rama: 'N' });
    setEditId(null);
    cargar();
  };

  const editar = (item: Orden) => {
    setEditId(item.id_orden_religiosa);
    setForm({
      nombre: item.nombre,
      nombre_latin: item.nombre_latin || '',
      abreviatura: item.abreviatura || '',
      descripcion: item.descripcion || '',
      rama: item.rama || 'N',
    });
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0 gap-3">
          <Link href="/configuracion" className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <BookOpenIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Órdenes religiosas</h1>
            <p className="text-base-content/70 text-sm">Catálogo: diocesano, salesiano, franciscano, etc.</p>
          </div>
        </div>
      </div>

      {permissions.canManageConfiguracion ? (
        <div className="bg-base-100 rounded-lg border border-base-300 p-4 mb-6 space-y-3">
          <h2 className="font-semibold">{editId ? 'Editar orden' : 'Nueva orden'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input input-bordered w-full"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            />
            <input
              className="input input-bordered w-full"
              placeholder="Nombre en latín"
              value={form.nombre_latin}
              onChange={(e) => setForm((p) => ({ ...p, nombre_latin: e.target.value }))}
            />
            <input
              className="input input-bordered w-full"
              placeholder="Abreviatura"
              value={form.abreviatura}
              onChange={(e) => setForm((p) => ({ ...p, abreviatura: e.target.value }))}
            />
            <select
              className="select select-bordered w-full"
              value={form.rama}
              onChange={(e) => setForm((p) => ({ ...p, rama: e.target.value }))}
            >
              <option value="N">Ninguna</option>
              <option value="M">Masculina</option>
              <option value="F">Femenina</option>
            </select>
            <input
              className="input input-bordered w-full md:col-span-2"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
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
                  setForm({ nombre: '', nombre_latin: '', abreviatura: '', descripcion: '', rama: 'N' });
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
              <th>Abrev.</th>
              <th>Rama</th>
              <th>Personas</th>
              <th>Clero</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-base-content/60">
                  No hay órdenes
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id_orden_religiosa}>
                  <td>{item.nombre}</td>
                  <td>{item.abreviatura || '—'}</td>
                  <td>{item.rama}</td>
                  <td>{item._count?.personas ?? 0}</td>
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
