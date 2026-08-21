'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { BookOpenIcon, EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface PersonaLite { numero_identidad: string; nombres: string; apellidos: string; }
interface LibroRegistro {
  id: string;
  sacramento: string;
  personaPrincipal: PersonaLite | null;
  personaSecundaria: PersonaLite | null;
  fecha: string | null;
  numero_libro: string;
  numero_pagina: string | null;
  numero_registro: string;
}

const SACRAMENTOS: [string, string][] = [
  ['bautismo', 'Bautismo'],
  ['primera_comunion', 'Primera Comunión'],
  ['confirmacion', 'Confirmación'],
  ['matrimonio', 'Matrimonio'],
];

const RUTA_DETALLE: Record<string, string> = {
  bautismo: '/bautismos',
  primera_comunion: '/primeras-comuniones',
  confirmacion: '/confirmaciones',
  matrimonio: '/matrimonios',
};

const nom = (p: PersonaLite | null) => (p ? `${p.nombres} ${p.apellidos}` : '—');

export default function LibrosPage() {
  const [sacramento, setSacramento] = useState('bautismo');
  const [libro, setLibro] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<LibroRegistro[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = () => {
    setLoading(true);
    const p = new URLSearchParams({ sacramento });
    if (libro) p.set('libro', libro);
    if (q) p.set('q', q);
    fetch(`/api/libros?${p.toString()}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setRows(Array.isArray(d.data) ? d.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sacramento]);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Libros sacramentales</h1>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Sacramento</span></label>
            <select className="select select-bordered" value={sacramento} onChange={(e) => setSacramento(e.target.value)}>
              {SACRAMENTOS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Libro</span></label>
            <input className="input input-bordered" value={libro} onChange={(e) => setLibro(e.target.value)} placeholder="N.º de libro" />
          </div>
          <div className="form-control md:col-span-2">
            <label className="label"><span className="label-text">Persona (nombre)</span></label>
            <input className="input input-bordered" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cargar()} placeholder="Buscar por nombre…" />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={cargar}>Consultar libro</button>

        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table">
            <thead>
              <tr>
                <th>Persona</th><th>Fecha</th><th>Libro</th><th>Página</th><th>Registro</th><th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center text-base-content/60">Cargando…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center text-base-content/60">Sin registros.</td></tr>}
              {rows.map((r) => (
                <tr key={`${r.sacramento}-${r.id}`}>
                  <td>{nom(r.personaPrincipal)}{r.personaSecundaria ? ` & ${nom(r.personaSecundaria)}` : ''}</td>
                  <td>{r.fecha ? String(r.fecha).slice(0, 10) : '—'}</td>
                  <td>{r.numero_libro}</td>
                  <td>{r.numero_pagina ?? '—'}</td>
                  <td>{r.numero_registro}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`${RUTA_DETALLE[r.sacramento]}/${r.id}`} className="btn btn-ghost btn-xs" title="Ver"><EyeIcon className="h-4 w-4" /></Link>
                      <a href={`/api/constancias/${r.sacramento}/${r.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs" title="Constancia PDF"><DocumentArrowDownIcon className="h-4 w-4" /></a>
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
