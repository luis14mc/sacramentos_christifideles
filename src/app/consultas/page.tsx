'use client';

import { Fragment, Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { ArrowsRightLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '@/hooks/usePermissions';
import type { InstanciaPublica, RespuestaConsulta } from '@/lib/interop/contrato';

/**
 * Consultas entre parroquias (Fase 4, docs/PLAN_MULTIPARROQUIA.md).
 * "Mis consultas": lo que esta parroquia pidió. "Recibidas": lo que otras
 * parroquias piden y requiere aprobación manual.
 */

interface Solicitud {
  id_solicitud: string;
  uuid: string | null;
  direccion: 'S' | 'E';
  codigo_parroquia_contraparte: string;
  nombre_parroquia_contraparte: string | null;
  numero_identidad_consultado: string;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'error_envio';
  motivo_rechazo: string | null;
  respuesta: RespuestaConsulta | null;
  created_at: string;
  resuelta_at: string | null;
}

const ESTADO: Record<Solicitud['estado'], { texto: string; clase: string }> = {
  pendiente: { texto: 'Pendiente', clase: 'badge-warning' },
  aprobada: { texto: 'Aprobada', clase: 'badge-success' },
  rechazada: { texto: 'Rechazada', clase: 'badge-error' },
  error_envio: { texto: 'No entregada', clase: 'badge-ghost' },
};

const SACRAMENTO: Record<string, string> = {
  bautismo: 'Bautismo',
  primera_comunion: 'Primera Comunión',
  confirmacion: 'Confirmación',
  matrimonio: 'Matrimonio',
};

/** Los datos de otra parroquia nunca se interpolan en HTML sin escapar. */
function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function fecha(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('es-HN', { timeZone: 'UTC' }) : '—';
}

function RespuestaDetalle({ respuesta }: { respuesta: RespuestaConsulta }) {
  if (!respuesta.encontrado) {
    return <p className="text-sm text-base-content/70">La parroquia no tiene registrada a esta persona.</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="font-semibold">{respuesta.nombres} {respuesta.apellidos}</span>
        <span className="text-base-content/60"> · nacimiento {fecha(respuesta.fecha_nacimiento)}</span>
      </p>
      {respuesta.sacramentos.length === 0 ? (
        <p className="text-base-content/70">Sin sacramentos registrados en esa parroquia.</p>
      ) : (
        <table className="table table-xs">
          <thead>
            <tr><th>Sacramento</th><th>Fecha</th><th>Libro</th><th>Página</th><th>Registro</th><th>Folio</th></tr>
          </thead>
          <tbody>
            {respuesta.sacramentos.map((s, i) => (
              <tr key={i}>
                <td>{SACRAMENTO[s.tipo] ?? s.tipo}</td>
                <td>{fecha(s.fecha)}</td>
                <td>{s.libro}</td>
                <td>{s.pagina ?? '—'}</td>
                <td>{s.registro}</td>
                <td>{s.folio ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ConsultasContenido() {
  const permisos = usePermissions();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'S' | 'E'>('S');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [parroquias, setParroquias] = useState<InstanciaPublica[]>([]);
  const [errorHub, setErrorHub] = useState<string | null>(null);
  const [form, setForm] = useState({
    destino: '',
    numero_identidad: searchParams.get('dni') ?? '',
    motivo: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);

  const cargar = useCallback(async (direccion: 'S' | 'E') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interop/solicitudes?direccion=${direccion}`);
      setSolicitudes(res.ok ? await res.json() : []);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(tab);
  }, [tab, cargar]);

  useEffect(() => {
    if (!permisos.canSolicitarInterop) return;
    fetch('/api/interop/parroquias')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setParroquias(data);
        setErrorHub(null);
      })
      .catch((e: Error) => setErrorHub(e.message || 'El hub de interoperabilidad no está disponible'));
  }, [permisos.canSolicitarInterop]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch('/api/interop/solicitudes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        await Swal.fire('No se pudo enviar', data.error, 'error');
      } else {
        await Swal.fire(
          'Consulta enviada',
          'La otra parroquia debe aprobarla. Verás la respuesta en "Mis consultas".',
          'success'
        );
        setForm({ destino: '', numero_identidad: '', motivo: '' });
      }
      if (tab === 'S') cargar('S');
      else setTab('S');
    } finally {
      setEnviando(false);
    }
  };

  const resolver = async (s: Solicitud, accion: 'aprobar' | 'rechazar') => {
    let motivo_rechazo: string | undefined;
    if (accion === 'aprobar') {
      const ok = await Swal.fire({
        title: '¿Aprobar consulta?',
        html: `Se compartirán con <b>${escaparHtml(s.nombre_parroquia_contraparte ?? s.codigo_parroquia_contraparte)}</b> el nombre, la fecha de nacimiento y los datos de libro de los sacramentos de <b>${escaparHtml(s.numero_identidad_consultado)}</b>.<br/><br/>No se comparten teléfono, dirección ni datos de padres o padrinos.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Aprobar y enviar',
        cancelButtonText: 'Cancelar',
      });
      if (!ok.isConfirmed) return;
    } else {
      const r = await Swal.fire({
        title: 'Rechazar consulta',
        input: 'text',
        inputLabel: 'Motivo del rechazo',
        inputValidator: (v) => (!v?.trim() ? 'Indica un motivo' : undefined),
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar',
      });
      if (!r.isConfirmed) return;
      motivo_rechazo = r.value;
    }

    const res = await fetch(`/api/interop/solicitudes/${s.id_solicitud}/resolver`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accion, motivo_rechazo }),
    });
    const data = await res.json();
    if (!res.ok) await Swal.fire('Error', data.error, 'error');
    cargar('E');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ArrowsRightLeftIcon className="h-6 w-6 text-primary" />}
        title="Consultas entre parroquias"
        subtitle="Solicita o responde información sacramental de otra parroquia"
      />

      {permisos.canSolicitarInterop && (
        <PageCard>
          <h2 className="font-semibold mb-3">Nueva consulta</h2>
          {errorHub ? (
            <div className="alert alert-warning text-sm">{errorHub}</div>
          ) : (
            <form onSubmit={enviar} className="grid gap-3 md:grid-cols-4 items-end">
              <label className="form-control">
                <span className="label-text text-sm mb-1">Parroquia</span>
                <select
                  className="select select-bordered select-sm"
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  required
                >
                  <option value="">Selecciona…</option>
                  {parroquias.map((p) => (
                    <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text text-sm mb-1">Número de identidad</span>
                <input
                  className="input input-bordered input-sm"
                  value={form.numero_identidad}
                  maxLength={20}
                  onChange={(e) => setForm({ ...form, numero_identidad: e.target.value })}
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text text-sm mb-1">Motivo</span>
                <input
                  className="input input-bordered input-sm"
                  value={form.motivo}
                  maxLength={500}
                  placeholder="Ej. expediente matrimonial"
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar consulta'}
              </button>
            </form>
          )}
        </PageCard>
      )}

      <PageCard>
        <div className="flex items-center justify-between mb-3">
          <div role="tablist" className="tabs tabs-boxed tabs-sm">
            {permisos.canSolicitarInterop && (
              <button role="tab" className={`tab ${tab === 'S' ? 'tab-active' : ''}`} onClick={() => setTab('S')}>
                Mis consultas
              </button>
            )}
            {permisos.canResolverInterop && (
              <button role="tab" className={`tab ${tab === 'E' ? 'tab-active' : ''}`} onClick={() => setTab('E')}>
                Recibidas
              </button>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => cargar(tab)} title="Actualizar">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><span className="loading loading-spinner" /></div>
        ) : solicitudes.length === 0 ? (
          <p className="text-center text-sm text-base-content/60 py-8">No hay consultas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>{tab === 'S' ? 'Parroquia consultada' : 'Parroquia solicitante'}</th>
                  <th>Identidad</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <Fragment key={s.id_solicitud}>
                    <tr>
                      <td>{fecha(s.created_at)}</td>
                      <td>{s.nombre_parroquia_contraparte ?? s.codigo_parroquia_contraparte}</td>
                      <td className="font-mono text-xs">{s.numero_identidad_consultado}</td>
                      <td className="max-w-xs truncate" title={s.motivo}>{s.motivo}</td>
                      <td>
                        <span className={`badge badge-sm ${ESTADO[s.estado].clase}`}>{ESTADO[s.estado].texto}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {tab === 'E' && s.estado === 'pendiente' && (
                          <>
                            <button className="btn btn-success btn-xs mr-1" onClick={() => resolver(s, 'aprobar')}>Aprobar</button>
                            <button className="btn btn-ghost btn-xs" onClick={() => resolver(s, 'rechazar')}>Rechazar</button>
                          </>
                        )}
                        {tab === 'S' && (s.respuesta || s.motivo_rechazo) && (
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setAbierta(abierta === s.id_solicitud ? null : s.id_solicitud)}
                          >
                            {abierta === s.id_solicitud ? 'Ocultar' : 'Ver respuesta'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {abierta === s.id_solicitud && (
                      <tr>
                        <td colSpan={6} className="bg-base-200/50">
                          {s.respuesta ? (
                            <RespuestaDetalle respuesta={s.respuesta} />
                          ) : (
                            <p className="text-sm">Rechazada: {s.motivo_rechazo}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </div>
  );
}

export default function ConsultasPage() {
  return (
    <AuthenticatedLayout>
      <Suspense fallback={null}>
        <ConsultasContenido />
      </Suspense>
    </AuthenticatedLayout>
  );
}
