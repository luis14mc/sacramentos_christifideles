'use client';

import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import Swal from 'sweetalert2';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface Plantilla {
  id: string;
  sacramento: string;
  nombre: string;
  contenido: string;
  activo: boolean;
}

const SACRAMENTOS: [string, string][] = [
  ['bautismo', 'Bautismo'],
  ['primera_comunion', 'Primera Comunión'],
  ['confirmacion', 'Confirmación'],
  ['matrimonio', 'Matrimonio'],
];

const PLACEHOLDERS = '{{parroquia.nombre}} {{persona.nombre_completo}} {{persona.dni}} {{conyuge.nombre_completo}} {{fecha_sacramento}} {{libro}} {{pagina}} {{registro}} {{acta}} {{sacerdote.nombre}} {{nota_marginal}} {{fecha_emision}}';

export default function PlantillasConstanciaPage() {
  const permissions = usePermissions();
  const puedeGestionar = permissions.canManageConfiguracion;
  const [rows, setRows] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ sacramento: 'bautismo', nombre: '', contenido: '', activo: true });

  const cargar = () => {
    setLoading(true);
    fetch('/api/configuracion/constancias')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => cargar(), []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? 'PUT' : 'POST';
    const body = editId ? { id: editId, nombre: form.nombre, contenido: form.contenido, activo: form.activo } : form;
    const res = await fetch('/api/configuracion/constancias', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { await Swal.fire({ icon: 'error', title: 'Error', text: data.error || '' }); return; }
    await Swal.fire({ icon: 'success', title: 'Guardada', timer: 1000, showConfirmButton: false });
    setEditId(null);
    setForm({ sacramento: 'bautismo', nombre: '', contenido: '', activo: true });
    cargar();
  };

  const toggleActivo = async (p: Plantilla) => {
    await fetch('/api/configuracion/constancias', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: p.id, activo: !p.activo }) });
    cargar();
  };

  const editar = (p: Plantilla) => {
    setEditId(p.id);
    setForm({ sacramento: p.sacramento, nombre: p.nombre, contenido: p.contenido, activo: p.activo });
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Plantillas de constancia</h1>
        </div>
        <p className="text-sm text-base-content/60">
          Si un sacramento no tiene plantilla activa, la constancia usa una plantilla por defecto. Placeholders disponibles:
          <br /><code className="text-xs">{PLACEHOLDERS}</code>
        </p>

        {puedeGestionar && (
          <form onSubmit={guardar} className="space-y-3 rounded-lg border border-base-300 p-4">
            <h3 className="font-semibold">{editId ? 'Editar plantilla' : 'Nueva plantilla'}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select className="select select-bordered" value={form.sacramento} disabled={Boolean(editId)} onChange={(e) => setForm({ ...form, sacramento: e.target.value })}>
                {SACRAMENTOS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
              </select>
              <input className="input input-bordered md:col-span-2" placeholder="Nombre de la plantilla" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <textarea className="textarea textarea-bordered w-full" rows={5} placeholder="Contenido con placeholders…" value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} required />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="checkbox checkbox-sm" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Activa
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm">{editId ? 'Guardar cambios' : 'Crear plantilla'}</button>
              {editId && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditId(null); setForm({ sacramento: 'bautismo', nombre: '', contenido: '', activo: true }); }}>Cancelar</button>}
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table">
            <thead><tr><th>Sacramento</th><th>Nombre</th><th>Activa</th><th className="text-right">Acciones</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center text-base-content/60">Cargando…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/60">Sin plantillas (se usa la default).</td></tr>}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{SACRAMENTOS.find(([v]) => v === p.sacramento)?.[1] ?? p.sacramento}</td>
                  <td>{p.nombre}</td>
                  <td>{p.activo ? <span className="badge badge-success">Sí</span> : <span className="badge badge-ghost">No</span>}</td>
                  <td className="text-right">
                    {puedeGestionar && (
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost btn-xs" onClick={() => editar(p)}>Editar</button>
                        <button className="btn btn-ghost btn-xs" onClick={() => toggleActivo(p)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                      </div>
                    )}
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
