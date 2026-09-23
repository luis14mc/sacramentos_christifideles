'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import Swal from 'sweetalert2';
import {
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const SACRAMENTOS: [string, string][] = [
  ['bautismo', 'Bautismo'],
  ['primera_comunion', 'Primera Comunión'],
  ['confirmacion', 'Confirmación'],
  ['matrimonio', 'Matrimonio'],
];

const TIPOS: [string, string][] = [
  ['predeterminado', 'Predeterminado'],
  ['notas', 'Notas'],
  ['institucional', 'Institucional'],
];

const TOKENS: { value: string; label: string }[] = [
  { value: 'persona.nombre_completo', label: 'Persona (nombre completo)' },
  { value: 'persona.nombres', label: 'Persona (nombres)' },
  { value: 'persona.apellidos', label: 'Persona (apellidos)' },
  { value: 'persona.dni', label: 'Persona (DNI)' },
  { value: 'conyuge.nombre_completo', label: 'Cónyuge (nombre completo)' },
  { value: 'conyuge.dni', label: 'Cónyuge (DNI)' },
  { value: 'parroquia.nombre', label: 'Parroquia (nombre)' },
  { value: 'parroquia.alias', label: 'Parroquia (alias litúrgico)' },
  { value: 'parroquia.direccion', label: 'Parroquia (dirección)' },
  { value: 'parroquia.telefono', label: 'Parroquia (teléfono)' },
  { value: 'fecha_sacramento', label: 'Fecha del sacramento' },
  { value: 'libro', label: 'Libro' },
  { value: 'pagina', label: 'Página' },
  { value: 'registro', label: 'Registro' },
  { value: 'acta', label: 'Acta' },
  { value: 'sacerdote.nombre', label: 'Sacerdote (nombre)' },
  { value: 'ministro.nombre', label: 'Ministro (nombre)' },
  { value: 'nota_marginal', label: 'Nota marginal' },
  { value: 'fecha_emision', label: 'Fecha de emisión' },
];

interface Molde {
  id: string;
  sacramento: string;
  tipo_constancia: string;
  nombre: string;
  archivo_nombre: string;
  archivo_mime: string;
  archivo_bytes: number;
  activo: boolean;
  mapa_campos: Record<string, string>;
  created_at: string;
  updated_at: string;
}

function bytesHumano(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function etiquetaSacramento(v: string) {
  return SACRAMENTOS.find(([x]) => x === v)?.[1] ?? v;
}
function etiquetaTipo(v: string) {
  return TIPOS.find(([x]) => x === v)?.[1] ?? v;
}

export default function MoldesConstanciaPage() {
  const permissions = usePermissions();
  const puedeGestionar = permissions.canManageConfiguracion;
  const [rows, setRows] = useState<Molde[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    fetch('/api/configuracion/moldes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const eliminar = async (m: Molde) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar molde?',
      text: `Se borrará "${m.nombre}". Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/configuracion/moldes/${m.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'No se pudo eliminar' });
      return;
    }
    await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
    cargar();
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<DocumentTextIcon className="h-6 w-6 text-primary" />}
          title="Moldes de constancia"
          subtitle="Sube un PDF con AcroForm por sacramento y tipo. La constancia se rellena con datos del servidor."
        />

        {puedeGestionar && (
          <PageCard>
            <SubirMoldeForm onSubido={cargar} />
          </PageCard>
        )}

        <PageCard padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="font-semibold">Sacramento</th>
                  <th className="font-semibold">Tipo</th>
                  <th className="font-semibold">Nombre</th>
                  <th className="font-semibold">Tamaño</th>
                  <th className="font-semibold">Activo</th>
                  <th className="font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center text-base-content/60 py-12">
                      Cargando…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-base-content/60 py-12">
                      No hay moldes. Si un sacramento no tiene molde activo, se usa la plantilla de texto.
                    </td>
                  </tr>
                )}
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-base-200/30">
                    <td>{etiquetaSacramento(m.sacramento)}</td>
                    <td>{etiquetaTipo(m.tipo_constancia)}</td>
                    <td>
                      <div className="font-medium">{m.nombre}</div>
                      <div className="text-xs text-base-content/60">{m.archivo_nombre}</div>
                    </td>
                    <td className="text-xs">{bytesHumano(m.archivo_bytes)}</td>
                    <td>
                      {m.activo ? (
                        <span className="badge badge-success">Sí</span>
                      ) : (
                        <span className="badge badge-ghost">No</span>
                      )}
                    </td>
                    <td className="text-right">
                      {puedeGestionar && (
                        <div className="flex justify-end gap-1">
                          <a
                            href={`/api/configuracion/moldes/${m.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs"
                            aria-label="Descargar molde"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </a>
                          <button className="btn btn-ghost btn-xs" onClick={() => verMapeo(m)}>
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => eliminar(m)}>
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
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

function verMapeo(m: Molde) {
  const entradas = Object.entries(m.mapa_campos);
  const html =
    entradas.length === 0
      ? '<p class="text-base-content/60">Sin mapeo registrado.</p>'
      : `<table class="table table-sm"><thead><tr><th>Campo PDF</th><th>Token</th></tr></thead><tbody>${entradas
          .map(
            ([c, t]) =>
              `<tr><td><code>${c}</code></td><td><code>${t}</code></td></tr>`
          )
          .join('')}</tbody></table>`;
  void Swal.fire({
    title: `Mapeo — ${m.nombre}`,
    html,
    width: 600,
    showCloseButton: true,
    showConfirmButton: false,
  });
}

interface SubirMoldeFormProps {
  onSubido: () => void;
}

function SubirMoldeForm({ onSubido }: SubirMoldeFormProps) {
  const [sacramento, setSacramento] = useState('bautismo');
  const [tipo, setTipo] = useState('predeterminado');
  const [nombre, setNombre] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [camposPdf, setCamposPdf] = useState<string[]>([]);
  const [mapa, setMapa] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);

  const mapaValido = useMemo(() => {
    return camposPdf.every((c) => typeof mapa[c] === 'string' && mapa[c].length > 0);
  }, [camposPdf, mapa]);

  const alElegirArchivo = async (f: File | null) => {
    setArchivo(f);
    setMapa({});
    if (!f) {
      setCamposPdf([]);
      return;
    }
    // El servicio real se ejecuta en backend; aquí hacemos un pre-check subiendo
    // el archivo al endpoint /campos en modo "preview" sería costoso, así que
    // pedimos al backend solo el listado al guardar (en este formulario, si el
    // usuario sube sin mapear, guardamos mapa vacío y el backend lo acepta).
    // Para mantener la UX asistida, simulamos sin listar hasta el submit.
    setCamposPdf([]);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      await Swal.fire({ icon: 'error', title: 'Falta el PDF' });
      return;
    }
    if (!nombre.trim()) {
      await Swal.fire({ icon: 'error', title: 'Falta el nombre' });
      return;
    }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('sacramento', sacramento);
      fd.append('tipo_constancia', tipo);
      fd.append('nombre', nombre.trim());
      fd.append('archivo', archivo);
      fd.append('mapa_campos', JSON.stringify(mapa));
      const res = await fetch('/api/configuracion/moldes', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'No se pudo subir' });
        return;
      }
      // Si el backend devolvió campos del PDF, los mostramos para mapeo posterior.
      const idCreado = data.id as string | undefined;
      if (idCreado) {
        const r2 = await fetch(`/api/configuracion/moldes/${idCreado}/campos`);
        if (r2.ok) {
          const j = (await r2.json()) as { campos: string[] };
          setCamposPdf(j.campos ?? []);
        }
      }
      await Swal.fire({ icon: 'success', title: 'Molde subido', timer: 1200, showConfirmButton: false });
      setNombre('');
      setArchivo(null);
      setMapa({});
      onSubido();
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-3">
      <h3 className="font-semibold">Subir molde</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <select className="select select-bordered" value={sacramento} onChange={(e) => setSacramento(e.target.value)}>
          {SACRAMENTOS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select className="select select-bordered" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          className="input input-bordered md:col-span-2"
          placeholder="Nombre del molde (ej. Predeterminado 2026)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <input
        type="file"
        accept="application/pdf"
        className="file-input file-input-bordered w-full"
        onChange={(e) => alElegirArchivo(e.target.files?.[0] ?? null)}
      />
      {camposPdf.length > 0 && (
        <div className="rounded-md border border-base-300 p-3 space-y-2">
          <p className="text-sm font-medium">Mapeo de campos AcroForm</p>
          <p className="text-xs text-base-content/60">
            Asocia cada campo del PDF con un token. La constancia solo se emite si todos están mapeados.
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {camposPdf.map((campo) => (
              <label key={campo} className="flex flex-col gap-1 text-sm">
                <code className="text-xs">{campo}</code>
                <select
                  className="select select-bordered select-sm"
                  value={mapa[campo] ?? ''}
                  onChange={(e) => setMapa({ ...mapa, [campo]: e.target.value })}
                >
                  <option value="">— Seleccionar token —</option>
                  {TOKENS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={subiendo || (camposPdf.length > 0 && !mapaValido)}>
          {subiendo ? 'Subiendo…' : 'Subir molde'}
        </button>
        {camposPdf.length > 0 && !mapaValido && (
          <span className="text-xs text-warning self-center">
            Faltan tokens por mapear antes de poder guardar.
          </span>
        )}
      </div>
    </form>
  );
}
