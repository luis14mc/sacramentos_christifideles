'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import ConstanciaButton from '@/components/sacramentos/ConstanciaButton';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface PersonaLite { numero_identidad: string; nombres: string; apellidos: string; }
interface Confirmacion {
  numero_acta: string; numero_libro: string; numero_pagina: string | null; numero_registro: string;
  fecha_confirmacion: string; nota_marginal: string | null;
  confirmado: PersonaLite | null; madre: PersonaLite | null; padre: PersonaLite | null;
  madrina: PersonaLite | null; padrino: PersonaLite | null; catequista: PersonaLite | null;
  obispo: PersonaLite | null;
}

const fmt = (p: PersonaLite | null) => (p ? `${p.nombres} ${p.apellidos} · DNI ${p.numero_identidad}` : '—');

export default function DetalleConfirmacionPage() {
  const params = useParams();
  const id = String(params.id);
  const permissions = usePermissions();
  const [b, setB] = useState<Confirmacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/confirmaciones/${id}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => d && setB(d))
      .finally(() => setLoading(false));
  }, [id]);

  const filas: [string, string][] = b ? [
    ['Confirmado', fmt(b.confirmado)], ['Madre', fmt(b.madre)], ['Padre', fmt(b.padre)],
    ['Madrina', fmt(b.madrina)], ['Padrino', fmt(b.padrino)], ['Catequista', fmt(b.catequista)],
    ['Obispo', fmt(b.obispo)],
    ['Fecha', b.fecha_confirmacion ? String(b.fecha_confirmacion).slice(0, 10) : '—'],
    ['Acta', b.numero_acta], ['Libro', b.numero_libro], ['Página', b.numero_pagina || '—'],
    ['Registro', b.numero_registro], ['Nota marginal', b.nota_marginal || '—'],
  ] : [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/confirmaciones" className="btn btn-ghost btn-sm"><ArrowLeftIcon className="h-4 w-4" /></Link>
            <h1 className="text-2xl font-bold">Detalle de Confirmación</h1>
          </div>
          {b && (
            <div className="flex gap-2">
              <ConstanciaButton sacramento="confirmacion" id={id} />
              {permissions.canEditSacramentos && (
                <Link href={`/confirmaciones/${id}/editar`} className="btn btn-primary btn-sm"><PencilSquareIcon className="h-4 w-4" /> Editar</Link>
              )}
            </div>
          )}
        </div>
        {loading && <p className="text-base-content/60">Cargando…</p>}
        {notFound && <p className="text-error">Registro no encontrado.</p>}
        {b && (
          <div className="overflow-hidden rounded-lg border border-base-300">
            <table className="table">
              <tbody>{filas.map(([k, v]) => (<tr key={k}><th className="w-56 bg-base-200">{k}</th><td>{v}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
