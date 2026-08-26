'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { PlusIcon, EyeIcon, PencilSquareIcon, UserCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CleroRow {
  numero_identidad: string;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  estado_vital: number | null;
  es_parroco: number;
  estado_ministerial: number;
  rango: { nombre: string } | null;
  orden_religiosa: { nombre: string } | null;
}

function labelVital(v: number | null) {
  if (v === 1) return 'Vivo';
  if (v === 0) return 'Fallecido';
  if (v === 2) return 'Desaparecido';
  return '—';
}

export default function SacerdotesPage() {
  const permissions = usePermissions();
  const [rows, setRows] = useState<CleroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [rango, setRango] = useState('');
  const [estado, setEstado] = useState('');

  const cargar = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (rango.trim()) params.set('rango', rango.trim());
    if (estado === '0' || estado === '1') params.set('estado', estado);
    fetch(`/api/sacerdotes?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setRows(Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<UserCircleIcon className="h-6 w-6 text-primary" />}
          title="Sacerdotes"
          subtitle="Condición clerical de personas de la parroquia"
          actions={
            permissions.canManageSacerdotes ? (
              <Link href="/sacerdotes/nuevo" className="btn btn-primary gap-2">
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo sacerdote</span>
                <span className="sm:hidden">Nuevo</span>
              </Link>
            ) : undefined
          }
        />

        <PageCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                className="input input-bordered w-full pl-10"
                placeholder="DNI, nombre o apellido…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && cargar()}
              />
            </div>
            <input
              className="input input-bordered w-full"
              placeholder="Rango…"
              value={rango}
              onChange={(e) => setRango(e.target.value)}
            />
            <select className="select select-bordered w-full" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Estado ministerial</option>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary" onClick={cargar}>
              Buscar
            </button>
          </div>
        </PageCard>

        <PageCard padding={false}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estado vital</th>
                  <th>Rango</th>
                  <th>Orden</th>
                  <th>Párroco</th>
                  <th>Ministerio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      <span className="loading loading-spinner loading-md" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-base-content/60">
                      No hay registros clericales
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.numero_identidad}>
                      <td>{r.numero_identidad}</td>
                      <td>
                        {r.nombres} {r.apellidos}
                      </td>
                      <td>{r.telefono || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td>{labelVital(r.estado_vital)}</td>
                      <td>{r.rango?.nombre || '—'}</td>
                      <td>{r.orden_religiosa?.nombre || '—'}</td>
                      <td>{r.es_parroco === 1 ? 'Sí' : 'No'}</td>
                      <td>
                        <span className={`badge ${r.estado_ministerial === 1 ? 'badge-success' : 'badge-ghost'}`}>
                          {r.estado_ministerial === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="flex gap-1">
                        <Link href={`/sacerdotes/${encodeURIComponent(r.numero_identidad)}`} className="btn btn-ghost btn-sm">
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {permissions.canManageSacerdotes ? (
                          <Link
                            href={`/sacerdotes/${encodeURIComponent(r.numero_identidad)}/editar`}
                            className="btn btn-ghost btn-sm"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </PageCard>
      </div>
    </AuthenticatedLayout>
  );
}
