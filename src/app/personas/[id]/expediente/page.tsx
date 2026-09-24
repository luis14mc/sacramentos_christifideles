'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import type { ExpedienteEntrada, ExpedientePersona } from '@/lib/expediente';

function formatearFecha(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ExpedientePersonaPage() {
  const params = useParams();
  const router = useRouter();
  const permissions = usePermissions();
  const numeroIdentidad = params.id as string;

  const [expediente, setExpediente] = useState<ExpedientePersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/personas/${encodeURIComponent(numeroIdentidad)}/expediente`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setExpediente(null);
            setError(body.error || 'No se pudo cargar el expediente');
          }
          return;
        }
        const data = (await res.json()) as ExpedientePersona;
        if (!cancelled) setExpediente(data);
      } catch {
        if (!cancelled) setError('Error de conexión');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [numeroIdentidad]);

  const abrirConstancia = (entrada: ExpedienteEntrada) => {
    const url = `/api/constancias/${entrada.sacramentoConstancia}/${entrada.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Expediente sacramental</h1>
            {expediente ? (
              <p className="text-base-content/70">
                {expediente.nombres} {expediente.apellidos} · {expediente.numero_identidad}
              </p>
            ) : (
              <p className="text-base-content/70">{numeroIdentidad}</p>
            )}
          </div>
          <div className="flex gap-2">
            {permissions.canSolicitarInterop && (
              <Link
                href={`/consultas?dni=${encodeURIComponent(numeroIdentidad)}`}
                className="btn btn-outline btn-sm"
                title="Pedir a otra parroquia los sacramentos de esta persona"
              >
                Consultar en otra parroquia
              </Link>
            )}
            <Link
              href={`/personas/${encodeURIComponent(numeroIdentidad)}`}
              className="btn btn-outline btn-sm"
            >
              Ficha de persona
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center min-h-[200px] items-center">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {!loading && expediente && expediente.entradas.length === 0 && (
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body text-center py-12">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-base-content/30 mb-3" />
              <p className="text-base-content/70">
                No hay sacramentos registrados como sujeto principal en esta parroquia.
              </p>
            </div>
          </div>
        )}

        {!loading && expediente && expediente.entradas.length > 0 && (
          <div className="space-y-3">
            {expediente.entradas.map((entrada) => (
              <div
                key={`${entrada.tipo}-${entrada.id}`}
                className="card bg-base-100 border border-base-300 shadow-sm"
              >
                <div className="card-body py-4 sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="badge badge-primary badge-outline">{entrada.rol}</span>
                      <span className="font-semibold text-base-content">{entrada.titulo}</span>
                    </div>
                    <p className="text-sm text-base-content/70">
                      {formatearFecha(entrada.fecha)}
                      {' · '}
                      Libro {entrada.libro}
                      {entrada.pagina ? `, pág. ${entrada.pagina}` : ''}
                      {`, reg. ${entrada.registro}`}
                      {entrada.folio ? ` · Folio ${entrada.folio}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link href={entrada.href} className="btn btn-sm btn-outline gap-1">
                      Ver registro
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </Link>
                    {permissions.canGenerateConstancias ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary gap-1"
                        onClick={() => abrirConstancia(entrada)}
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        Constancia PDF
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
