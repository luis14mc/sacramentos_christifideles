'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">Bautismos</h1>
          </div>
          {permissions.canCreateSacramentos && (
            <Link href="/bautismos/nuevo" className="btn btn-primary btn-sm">
              <PlusIcon className="h-4 w-4" /> Nuevo bautismo
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-base-300 px-3 py-2">
            <MagnifyingGlassIcon className="h-4 w-4 text-base-content/50" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Buscar por nombre del bautizado…"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargar(nombre)}
            />
          </div>
          <button className="btn btn-sm" onClick={() => cargar(nombre)}>
            Buscar
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table">
            <thead>
              <tr>
                <th>Bautizado</th>
                <th>DNI</th>
                <th>Fecha</th>
                <th>Libro</th>
                <th>Página</th>
                <th>Registro</th>
                <th>Sacerdote</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center text-base-content/60">Cargando…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-base-content/60">Sin bautismos registrados.</td>
                </tr>
              )}
              {rows.map((b) => (
                <tr key={b.id_bautismo}>
                  <td>{b.bautizado ? `${b.bautizado.nombres} ${b.bautizado.apellidos}` : '—'}</td>
                  <td>{b.bautizado?.numero_identidad ?? '—'}</td>
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
      </div>
    </AuthenticatedLayout>
  );
}
