'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { PlusIcon, EyeIcon, PencilSquareIcon, HeartIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface PersonaLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}
interface Row {
  id_primera_comunion: string;
  fecha_primera_comunion: string;
  numero_libro: string;
  numero_pagina: string;
  numero_registro: string;
  persona: PersonaLite | null;
  sacerdote: PersonaLite | null;
}

export default function PrimerasComunionesPage() {
  const permissions = usePermissions();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');

  const cargar = (q = '') => {
    setLoading(true);
    const url = q ? `/api/primeras-comuniones?nombre=${encodeURIComponent(q)}` : '/api/primeras-comuniones';
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
          icon={<HeartIcon className="h-6 w-6 text-primary" />}
          title="Primeras Comuniones"
          subtitle="Registros de primera comunión de la parroquia"
          actions={
            permissions.canCreateSacramentos ? (
              <Link href="/primeras-comuniones/nuevo" className="btn btn-primary gap-2">
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva comunión</span>
                <span className="sm:hidden">Nueva</span>
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
                placeholder="Buscar por nombre del comulgante…"
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
                  <th className="font-semibold">Comulgante</th>
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
                {loading && <tr><td colSpan={8} className="text-center text-base-content/60 py-12">Cargando…</td></tr>}
                {!loading && rows.length === 0 && <tr><td colSpan={8} className="text-center text-base-content/60 py-12">Sin registros.</td></tr>}
                {rows.map((b) => (
                  <tr key={b.id_primera_comunion} className="hover:bg-base-200/30">
                    <td>{b.persona ? `${b.persona.nombres} ${b.persona.apellidos}` : '—'}</td>
                    <td className="font-mono text-sm">{b.persona?.numero_identidad ?? '—'}</td>
                    <td>{b.fecha_primera_comunion ? String(b.fecha_primera_comunion).slice(0, 10) : '—'}</td>
                    <td>{b.numero_libro}</td>
                    <td>{b.numero_pagina}</td>
                    <td>{b.numero_registro}</td>
                    <td>{b.sacerdote ? `${b.sacerdote.nombres} ${b.sacerdote.apellidos}` : '—'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/primeras-comuniones/${b.id_primera_comunion}`} className="btn btn-ghost btn-xs" title="Ver"><EyeIcon className="h-4 w-4" /></Link>
                        {permissions.canEditSacramentos && (
                          <Link href={`/primeras-comuniones/${b.id_primera_comunion}/editar`} className="btn btn-ghost btn-xs" title="Editar"><PencilSquareIcon className="h-4 w-4" /></Link>
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
