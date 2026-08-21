'use client';

import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface Registro {
  id_accion: string;
  fecha: string;
  accion: string;
  nombre_tabla: string;
  id_tabla_afectado: string | null;
  id_usuario: string;
  usuario_nombre: string | null;
  actor_ip: string | null;
  user_agent: string | null;
  old_values: unknown;
  new_values: unknown;
}

const ACCION_LABEL: Record<string, string> = { C: 'Creación', R: 'Lectura', U: 'Actualización', D: 'Eliminación' };

export default function AuditoriaPage() {
  const [rows, setRows] = useState<Registro[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<Registro | null>(null);
  const [f, setF] = useState({ desde: '', hasta: '', tabla: '', accion: '' });
  const pageSize = 20;

  const cargar = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
    if (f.desde) params.set('desde', f.desde);
    if (f.hasta) params.set('hasta', f.hasta);
    if (f.tabla) params.set('tabla', f.tabla);
    if (f.accion) params.set('accion', f.accion);
    fetch(`/api/auditoria?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { data: [], total: 0 }))
      .then((d) => { setRows(d.data || []); setTotal(d.total || 0); })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(1); setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Auditoría</h1>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input type="date" className="input input-bordered input-sm" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} />
          <input type="date" className="input input-bordered input-sm" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} />
          <input className="input input-bordered input-sm" placeholder="Tabla/módulo" value={f.tabla} onChange={(e) => setF({ ...f, tabla: e.target.value })} />
          <select className="select select-bordered select-sm" value={f.accion} onChange={(e) => setF({ ...f, accion: e.target.value })}>
            <option value="">Toda acción</option>
            <option value="C">Creación</option>
            <option value="U">Actualización</option>
            <option value="D">Eliminación</option>
            <option value="R">Lectura</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => { setPage(1); cargar(1); }}>Filtrar</button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-sm">
            <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Registro</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center text-base-content/60">Cargando…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center text-base-content/60">Sin registros.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id_accion}>
                  <td>{new Date(r.fecha).toLocaleString('es')}</td>
                  <td>{r.usuario_nombre ?? `#${r.id_usuario}`}</td>
                  <td><span className="badge badge-ghost">{ACCION_LABEL[r.accion] ?? r.accion}</span></td>
                  <td>{r.nombre_tabla}</td>
                  <td>{r.id_tabla_afectado ?? '—'}</td>
                  <td className="text-right"><button className="btn btn-ghost btn-xs" onClick={() => setDetalle(r)}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-base-content/60">{total} registros</span>
          <div className="flex gap-2">
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); cargar(p); }}>Anterior</button>
            <span className="px-2 py-1">{page} / {totalPages}</span>
            <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); cargar(p); }}>Siguiente</button>
          </div>
        </div>
      </div>

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetalle(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg bg-base-100 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-semibold">Detalle de auditoría</h3>
            <div className="space-y-1 text-sm">
              <div><b>Fecha:</b> {new Date(detalle.fecha).toLocaleString('es')}</div>
              <div><b>Usuario:</b> {detalle.usuario_nombre ?? `#${detalle.id_usuario}`}</div>
              <div><b>Acción:</b> {ACCION_LABEL[detalle.accion] ?? detalle.accion}</div>
              <div><b>Módulo:</b> {detalle.nombre_tabla}</div>
              <div><b>Registro afectado:</b> {detalle.id_tabla_afectado ?? '—'}</div>
              <div><b>IP:</b> {detalle.actor_ip ?? '—'}</div>
              <div className="break-all"><b>User agent:</b> {detalle.user_agent ?? '—'}</div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 font-medium">Valores anteriores</div>
                <pre className="overflow-auto rounded bg-base-200 p-2 text-xs">{detalle.old_values ? JSON.stringify(detalle.old_values, null, 2) : '—'}</pre>
              </div>
              <div>
                <div className="mb-1 font-medium">Valores nuevos</div>
                <pre className="overflow-auto rounded bg-base-200 p-2 text-xs">{detalle.new_values ? JSON.stringify(detalle.new_values, null, 2) : '—'}</pre>
              </div>
            </div>
            <div className="mt-4 text-right"><button className="btn btn-sm" onClick={() => setDetalle(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
