'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import ConstanciaButton from '@/components/sacramentos/ConstanciaButton';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface PersonaLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}
interface Bautismo {
  id_bautismo: string;
  fecha_bautismo: string;
  numero_libro: string;
  numero_folio: string;
  numero_pagina: string;
  numero_registro: string;
  nota_marginal: string | null;
  bautizado: PersonaLite | null;
  madre: PersonaLite | null;
  padre: PersonaLite | null;
  madrina: PersonaLite | null;
  padrino: PersonaLite | null;
  catequista: PersonaLite | null;
  sacerdote: PersonaLite | null;
}

function persona(p: PersonaLite | null) {
  return p ? `${p.nombres} ${p.apellidos} · DNI ${p.numero_identidad}` : '—';
}

export default function DetalleBautismoPage() {
  const params = useParams();
  const id = String(params.id);
  const permissions = usePermissions();
  const [b, setB] = useState<Bautismo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/bautismos/${id}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => data && setB(data))
      .finally(() => setLoading(false));
  }, [id]);

  const filas: [string, string][] = b
    ? [
        ['Bautizado', persona(b.bautizado)],
        ['Madre', persona(b.madre)],
        ['Padre', persona(b.padre)],
        ['Madrina', persona(b.madrina)],
        ['Padrino', persona(b.padrino)],
        ['Catequista', persona(b.catequista)],
        ['Sacerdote', persona(b.sacerdote)],
        ['Fecha de Bautismo', b.fecha_bautismo ? String(b.fecha_bautismo).slice(0, 10) : '—'],
        ['Libro', b.numero_libro],
        ['Folio', b.numero_folio],
        ['Página', b.numero_pagina],
        ['Registro', b.numero_registro],
        ['Nota marginal', b.nota_marginal || '—'],
      ]
    : [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/bautismos" className="btn btn-ghost btn-sm">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Detalle de Bautismo</h1>
          </div>
          {b && (
            <div className="flex gap-2">
              <ConstanciaButton sacramento="bautismo" id={id} />
              {permissions.canEditSacramentos && (
                <Link href={`/bautismos/${id}/editar`} className="btn btn-primary btn-sm">
                  <PencilSquareIcon className="h-4 w-4" /> Editar
                </Link>
              )}
            </div>
          )}
        </div>

        {loading && <p className="text-base-content/60">Cargando…</p>}
        {notFound && <p className="text-error">Bautismo no encontrado.</p>}

        {b && (
          <div className="overflow-hidden rounded-lg border border-base-300">
            <table className="table">
              <tbody>
                {filas.map(([k, v]) => (
                  <tr key={k}>
                    <th className="w-56 bg-base-200">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
