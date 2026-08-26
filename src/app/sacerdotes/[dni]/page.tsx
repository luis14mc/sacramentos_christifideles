'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface CleroDetalle {
  numero_identidad: string;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  sexo: string | null;
  estado_vital: number | null;
  fecha_nacimiento: string | null;
  es_parroco: number;
  estado_ministerial: number;
  rango: { nombre: string } | null;
  orden_religiosa: { nombre: string } | null;
  sacramentos?: {
    bautismos: number;
    primeras_comuniones: number;
    confirmaciones: number;
    matrimonios: number;
  };
}

function labelVital(v: number | null) {
  if (v === 1) return 'Vivo';
  if (v === 0) return 'Fallecido';
  if (v === 2) return 'Desaparecido';
  return '—';
}

export default function DetalleSacerdotePage() {
  const params = useParams();
  const dni = decodeURIComponent(String(params.dni));
  const permissions = usePermissions();
  const [row, setRow] = useState<CleroDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/sacerdotes/${encodeURIComponent(dni)}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => data && setRow(data))
      .finally(() => setLoading(false));
  }, [dni]);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageCard>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/sacerdotes" className="btn btn-ghost btn-sm">
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">
                  {row ? `${row.nombres} ${row.apellidos}` : 'Sacerdote'}
                </h1>
                <p className="text-sm text-base-content/60">DNI {dni}</p>
              </div>
            </div>
            {row && permissions.canManageSacerdotes ? (
              <Link href={`/sacerdotes/${encodeURIComponent(dni)}/editar`} className="btn btn-primary gap-2">
                <PencilSquareIcon className="h-4 w-4" />
                Editar
              </Link>
            ) : null}
          </div>
        </PageCard>

        {loading ? (
          <PageCard>
            <div className="py-8 text-center">
              <span className="loading loading-spinner loading-md" />
            </div>
          </PageCard>
        ) : notFound || !row ? (
          <PageCard>
            <p>Registro clerical no encontrado.</p>
          </PageCard>
        ) : (
          <>
            <PageCard>
              <h2 className="font-semibold mb-3">Datos personales</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-base-content/60">DNI</dt>
                  <dd>{row.numero_identidad}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Nombre</dt>
                  <dd>
                    {row.nombres} {row.apellidos}
                  </dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Teléfono</dt>
                  <dd>{row.telefono || '—'}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Correo</dt>
                  <dd>{row.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Estado vital</dt>
                  <dd>{labelVital(row.estado_vital)}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Persona</dt>
                  <dd>
                    <Link className="link" href={`/personas/${encodeURIComponent(row.numero_identidad)}`}>
                      Ver ficha en Personas
                    </Link>
                  </dd>
                </div>
              </dl>
            </PageCard>

            <PageCard>
              <h2 className="font-semibold mb-3">Datos clericales</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-base-content/60">Rango</dt>
                  <dd>{row.rango?.nombre || '—'}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Orden religiosa</dt>
                  <dd>{row.orden_religiosa?.nombre || '—'}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Párroco</dt>
                  <dd>{row.es_parroco === 1 ? 'Sí' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-base-content/60">Estado ministerial</dt>
                  <dd>{row.estado_ministerial === 1 ? 'Activo' : 'Inactivo'}</dd>
                </div>
              </dl>
            </PageCard>

            <PageCard>
              <h2 className="font-semibold mb-3">Sacramentos celebrados</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <li>Bautismos: {row.sacramentos?.bautismos ?? 0}</li>
                <li>Primeras comuniones: {row.sacramentos?.primeras_comuniones ?? 0}</li>
                <li>Confirmaciones: {row.sacramentos?.confirmaciones ?? 0}</li>
                <li>Matrimonios: {row.sacramentos?.matrimonios ?? 0}</li>
              </ul>
            </PageCard>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
