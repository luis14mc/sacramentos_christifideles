'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { PlusIcon, EyeIcon, PencilSquareIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface PersonaLite { numero_identidad: string; nombres: string; apellidos: string; }
interface Row {
  id_matrimonio: string;
  fecha_matrimonio: string;
  numero_libro: string;
  numero_pagina: string | null;
  numero_registro: string;
  esposa: PersonaLite | null;
  esposo: PersonaLite | null;
  sacerdote: PersonaLite | null;
}

const nom = (p: PersonaLite | null) => (p ? `${p.nombres} ${p.apellidos}` : '—');

export default function MatrimoniosPage() {
  const permissions = usePermissions();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');

  const cargar = (q = '') => {
    setLoading(true);
    const url = q ? `/api/matrimonios?nombre=${encodeURIComponent(q)}` : '/api/matrimonios';
    fetch(url)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setRows(Array.isArray(d.data) ? d.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => cargar(), []);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<UsersIcon className="h-6 w-6 text-primary" />}
          title="Matrimonios"
          subtitle="Registros de matrimonio de la parroquia"
          actions={
            permissions.canCreateSacramentos ? (
              <Link href="/matrimonios/nuevo" className="btn btn-primary gap-2">
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo matrimonio</span>
                <span className="sm:hidden">Nuevo</span>
              </Link>
            ) : undefined
          }
        />

        <PageCard>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                className="input input-bordered w-full pl-10"
                placeholder="Buscar por nombre de un contrayente…"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && cargar(nombre)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => cargar(nombre)}>Buscar</button>
          </div>
        </PageCard>

        <PageCard padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="font-semibold">Esposa</th>
                  <th className="font-semibold">Esposo</th>
                  <th className="font-semibold">Fecha</th>
                  <th className="font-semibold">Libro</th>
                  <th className="font-semibold">Página</th>
                  <th className="font-semibold">Registro</th>
                  <th className="font-semibold">Sacerdote</th>
                  <th className="font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="text-center text-base-content/60 py-12">Cargando…</td></tr>}
                {!loading && rows.length === 0 && <tr><td colSpan={8} className="text-center text-base-content/60 py-12">Sin registros.</td></tr>}
                {rows.map((b) => (
                  <tr key={b.id_matrimonio} className="hover:bg-base-200/30">
                    <td>{nom(b.esposa)}</td>
                    <td>{nom(b.esposo)}</td>
                    <td>{b.fecha_matrimonio ? String(b.fecha_matrimonio).slice(0, 10) : '—'}</td>
                    <td>{b.numero_libro}</td>
                    <td>{b.numero_pagina ?? '—'}</td>
                    <td>{b.numero_registro}</td>
                    <td>{nom(b.sacerdote)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/matrimonios/${b.id_matrimonio}`} className="btn btn-ghost btn-xs" title="Ver"><EyeIcon className="h-4 w-4" /></Link>
                        {permissions.canEditSacramentos && (
                          <Link href={`/matrimonios/${b.id_matrimonio}/editar`} className="btn btn-ghost btn-xs" title="Editar"><PencilSquareIcon className="h-4 w-4" /></Link>
                        )}
                      </div>
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
