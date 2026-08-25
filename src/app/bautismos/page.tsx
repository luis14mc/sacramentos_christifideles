'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { PlusIcon, EyeIcon, PencilSquareIcon, BookOpenIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface PersonaLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}
interface BautismoRow {
  id_bautismo: string;
  fecha_bautismo: string;
  numero_libro: string;
  numero_pagina: string;
  numero_registro: string;
  bautizado: PersonaLite | null;
  sacerdote: PersonaLite | null;
}

export default function BautismosPage() {
  const permissions = usePermissions();
  const [rows, setRows] = useState<BautismoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');

  const cargar = (q = '') => {
    setLoading(true);
    const url = q ? `/api/bautismos?nombre=${encodeURIComponent(q)}` : '/api/bautismos';
    fetch(url)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setRows(Array.isArray(d.data) ? d.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<BookOpenIcon className="h-6 w-6 text-primary" />}
          title="Bautismos"
          subtitle="Registros de bautismo de la parroquia"
          actions={
            permissions.canCreateSacramentos ? (
              <Link href="/bautismos/nuevo" className="btn btn-primary gap-2">
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo bautismo</span>
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
                placeholder="Buscar por nombre del bautizado…"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && cargar(nombre)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => cargar(nombre)}>
              Buscar
            </button>
          </div>
        </PageCard>

        <PageCard padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="font-semibold">Bautizado</th>
                  <th className="font-semibold">DNI</th>
                  <th className="font-semibold">Fecha</th>
                  <th className="font-semibold">Libro</th>
                  <th className="font-semibold">Página</th>
                  <th className="font-semibold">Registro</th>
                  <th className="font-semibold">Sacerdote</th>
                  <th className="font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="text-center text-base-content/60 py-12">Cargando…</td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-base-content/60 py-12">Sin bautismos registrados.</td>
                  </tr>
                )}
                {rows.map((b) => (
                  <tr key={b.id_bautismo} className="hover:bg-base-200/30">
                    <td>{b.bautizado ? `${b.bautizado.nombres} ${b.bautizado.apellidos}` : '—'}</td>
                    <td className="font-mono text-sm">{b.bautizado?.numero_identidad ?? '—'}</td>
                    <td>{b.fecha_bautismo ? String(b.fecha_bautismo).slice(0, 10) : '—'}</td>
                    <td>{b.numero_libro}</td>
                    <td>{b.numero_pagina}</td>
                    <td>{b.numero_registro}</td>
                    <td>{b.sacerdote ? `${b.sacerdote.nombres} ${b.sacerdote.apellidos}` : '—'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/bautismos/${b.id_bautismo}`} className="btn btn-ghost btn-xs" title="Ver">
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {permissions.canEditSacramentos && (
                          <Link href={`/bautismos/${b.id_bautismo}/editar`} className="btn btn-ghost btn-xs" title="Editar">
                            <PencilSquareIcon className="h-4 w-4" />
                          </Link>
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
