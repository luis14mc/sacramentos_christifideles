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

interface Molde {
  id: string;
  sacramento: string;
  tipo_constancia: string;
  nombre: string;
  archivo_nombre: string;
  archivo_mime: string;
  con_campos: boolean;
  contenido: string | null;
  margen_superior: number;
  archivo_bytes: number;
  activo: boolean;
  mapa_campos: Record<string, string>;
  created_at: string;
  updated_at: string;
}

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
  { value: 'parroquia.parroco', label: 'Parroquia (párroco)' },
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

export default function ConstanciasPage() {
  const permissions = usePermissions();
  const puedeGestionar = permissions.canManageConfiguracion;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<DocumentTextIcon className="h-6 w-6 text-primary" />}
          title="Constancias"
          subtitle="Molde PDF por sacramento: con campos rellenables o como hoja membretada."
        />

        <PageCard>
          <div className="space-y-2 text-sm text-base-content/70">
            <p>Sube un PDF por sacramento. El sistema detecta cómo usarlo:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-base-content">PDF con campos rellenables</span>: se llena
                cada campo con el dato que le asignes (nombre, fecha, libro…).
              </li>
              <li>
                <span className="font-medium text-base-content">Hoja membretada</span> (PDF sin campos, con
                logo y encabezado): el sistema escribe encima el texto de la constancia y la firma del párroco.
              </li>
            </ul>
            <p>Si un sacramento no tiene molde activo, se genera una constancia simple con el logo de la parroquia.</p>
          </div>
        </PageCard>

        <MoldesTab puedeGestionar={puedeGestionar} />
      </div>
    </AuthenticatedLayout>
  );
}

function MoldesTab({ puedeGestionar }: { puedeGestionar: boolean }) {
  const [rows, setRows] = useState<Molde[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Molde | null>(null);

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

  const verMapeo = (m: Molde) => {
    const entradas = Object.entries(m.mapa_campos);
    const html =
      entradas.length === 0
        ? '<p class="text-base-content/60">Sin mapeo registrado.</p>'
        : `<table class="table table-sm"><thead><tr><th>Campo PDF</th><th>Token</th></tr></thead><tbody>${entradas
            .map(([c, t]) => `<tr><td><code>${c}</code></td><td><code>${t}</code></td></tr>`)
            .join('')}</tbody></table>`;
    void Swal.fire({ title: `Mapeo — ${m.nombre}`, html, width: 600, showCloseButton: true, showConfirmButton: false });
  };

  return (
    <div className="space-y-6">
      {puedeGestionar && editando && (
        <PageCard>
          <MembreteEditor
            molde={editando}
            onListo={() => {
              setEditando(null);
              cargar();
            }}
            onCancelar={() => setEditando(null)}
          />
        </PageCard>
      )}

      {puedeGestionar && !editando && (
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
                <th className="font-semibold">Formato</th>
                <th className="font-semibold">Nombre</th>
                <th className="font-semibold">Tamaño</th>
                <th className="font-semibold">Activo</th>
                <th className="font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center text-base-content/60 py-12">Cargando…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="text-center text-base-content/60 py-12">No hay moldes. Sube la hoja membretada o el PDF de constancia de cada sacramento.</td></tr>
              )}
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-base-200/30">
                  <td>{etiquetaSacramento(m.sacramento)}</td>
                  <td>{etiquetaTipo(m.tipo_constancia)}</td>
                  <td>
                    <span className="badge badge-ghost whitespace-nowrap">
                      {m.con_campos ? 'Con campos' : 'Hoja membretada'}
                    </span>
                  </td>
                  <td>
                    <div className="font-medium">{m.nombre}</div>
                    <div className="text-xs text-base-content/60">{m.archivo_nombre}</div>
                  </td>
                  <td className="text-xs">{bytesHumano(m.archivo_bytes)}</td>
                  <td>{m.activo ? <span className="badge badge-success">Sí</span> : <span className="badge badge-ghost">No</span>}</td>
                  <td className="text-right">
                    {puedeGestionar && (
                      <div className="flex justify-end gap-1">
                        <a href={`/api/configuracion/moldes/${m.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs" aria-label="Descargar molde">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </a>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => (m.con_campos ? verMapeo(m) : setEditando(m))}
                          aria-label={m.con_campos ? 'Ver mapeo de campos' : 'Editar texto de la hoja membretada'}
                          title={m.con_campos ? 'Ver mapeo de campos' : 'Editar texto y margen'}
                        >
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
  );
}

interface SubirMoldeFormProps {
  onSubido: () => void;
}

function SubirMoldeForm({ onSubido }: SubirMoldeFormProps) {
  const [sacramento, setSacramento] = useState('bautismo');
  const [tipo, setTipo] = useState('predeterminado');
  const [nombre, setNombre] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [borradorId, setBorradorId] = useState<string | null>(null);
  const [membrete, setMembrete] = useState<Molde | null>(null);
  const [camposPdf, setCamposPdf] = useState<string[]>([]);
  const [mapa, setMapa] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [activando, setActivando] = useState(false);

  const mapaCompleto = useMemo(() => {
    if (camposPdf.length === 0) return false;
    return camposPdf.every((c) => typeof mapa[c] === 'string' && mapa[c].length > 0);
  }, [camposPdf, mapa]);

  const reset = () => {
    setNombre('');
    setArchivo(null);
    setBorradorId(null);
    setCamposPdf([]);
    setMapa({});
  };

  const cargarCampos = async (id: string) => {
    const r = await fetch(`/api/configuracion/moldes/${id}/campos`);
    if (r.ok) {
      const j = (await r.json()) as { campos: string[] };
      setCamposPdf(j.campos ?? []);
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) { await Swal.fire({ icon: 'error', title: 'Falta el PDF' }); return; }
    if (!nombre.trim()) { await Swal.fire({ icon: 'error', title: 'Falta el nombre' }); return; }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('sacramento', sacramento);
      fd.append('tipo_constancia', tipo);
      fd.append('nombre', nombre.trim());
      fd.append('archivo', archivo);
      const res = await fetch('/api/configuracion/moldes', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'No se pudo subir' });
        return;
      }
      const idCreado = data.id as string;
      if (data.con_campos === false) {
        // Hoja membretada: no hay campos que mapear; se configura el texto.
        setMembrete(data as Molde);
      } else {
        setBorradorId(idCreado);
        await cargarCampos(idCreado);
      }
      onSubido();
    } finally {
      setSubiendo(false);
    }
  };

  const activar = async () => {
    if (!borradorId || !mapaCompleto) return;
    setActivando(true);
    try {
      const res = await fetch(`/api/configuracion/moldes/${borradorId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ activo: true, mapa_campos: mapa }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'Error al activar', text: data.error || 'Error' });
        return;
      }
      await Swal.fire({ icon: 'success', title: 'Molde activado', timer: 1200, showConfirmButton: false });
      reset();
      onSubido();
    } finally {
      setActivando(false);
    }
  };

  if (membrete) {
    return (
      <MembreteEditor
        molde={membrete}
        onListo={() => {
          setMembrete(null);
          reset();
          onSubido();
        }}
        onCancelar={() => {
          setMembrete(null);
          reset();
        }}
      />
    );
  }

  if (borradorId) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold">Mapear campos AcroForm — {nombre}</h3>
        <p className="text-xs text-base-content/60">
          PDF recibido como borrador. Asocia cada campo del PDF con un token de la lista y activa el molde.
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
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary btn-sm" disabled={!mapaCompleto || activando} onClick={activar}>
            {activando ? 'Activando…' : 'Activar molde'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Cancelar</button>
          {!mapaCompleto && (
            <span className="text-xs text-warning self-center">
              Asigna un token a cada campo antes de activar.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <h3 className="font-semibold">Subir molde</h3>
      <p className="text-xs text-base-content/60">
        Sube la hoja membretada de la parroquia o un PDF con campos rellenables. Queda como borrador
        hasta que lo actives.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <select className="select select-bordered" value={sacramento} onChange={(e) => setSacramento(e.target.value)}>
          {SACRAMENTOS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
        </select>
        <select className="select select-bordered" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
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
        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
      />
      <button type="submit" className="btn btn-primary btn-sm" disabled={subiendo || !archivo || !nombre.trim()}>
        {subiendo ? 'Subiendo…' : 'Subir PDF'}
      </button>
    </form>
  );
}

const TEXTO_EJEMPLO =
  'Hace constar que {{persona.nombre_completo}} (DNI {{persona.dni}}) recibió el sacramento ' +
  'el {{fecha_sacramento}}, ante el ministro {{ministro.nombre}}, quedando registrado en el ' +
  'libro {{libro}}, página {{pagina}}, registro {{registro}}.';

/**
 * Texto y margen de una hoja membretada. El texto admite los mismos datos
 * automáticos que los moldes con campos ({{persona.nombre_completo}}, etc.).
 */
function MembreteEditor({
  molde,
  onListo,
  onCancelar,
}: {
  molde: Molde;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [contenido, setContenido] = useState(molde.contenido ?? '');
  const [margen, setMargen] = useState(String(molde.margen_superior ?? 170));
  const [guardando, setGuardando] = useState(false);

  const insertar = (token: string) => setContenido((c) => `${c}{{${token}}}`);

  const guardar = async (activar: boolean) => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/configuracion/moldes/${molde.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contenido,
          margen_superior: Number(margen),
          ...(activar ? { activo: true } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: data.error || 'Error' });
        return;
      }
      await Swal.fire({
        icon: 'success',
        title: activar ? 'Hoja membretada activada' : 'Guardado',
        timer: 1200,
        showConfirmButton: false,
      });
      onListo();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Hoja membretada — {molde.nombre}</h3>
        <p className="text-xs text-base-content/60">
          El PDF no tiene campos rellenables, así que se usará como hoja membretada: se conserva su diseño y
          se escribe encima el título, este texto, los datos del libro y la firma del párroco.
        </p>
      </div>

      <label className="form-control">
        <span className="label-text mb-1">Texto de la constancia</span>
        <textarea
          className="textarea textarea-bordered min-h-32 w-full"
          value={contenido}
          maxLength={4000}
          placeholder={`Si lo dejas vacío se usa el texto estándar. Ejemplo:\n${TEXTO_EJEMPLO}`}
          onChange={(e) => setContenido(e.target.value)}
        />
      </label>

      <div>
        <p className="mb-2 text-xs text-base-content/60">Toca un dato para agregarlo al texto:</p>
        <div className="flex flex-wrap gap-1">
          {TOKENS.map((t) => (
            <button key={t.value} type="button" className="btn btn-outline btn-xs" onClick={() => insertar(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="form-control max-w-xs">
        <span className="label-text mb-1">Espacio libre arriba para el membrete (puntos)</span>
        <input
          type="number"
          min={0}
          max={600}
          className="input input-bordered"
          value={margen}
          onChange={(e) => setMargen(e.target.value)}
        />
        <span className="mt-1 text-xs text-base-content/60">
          170 deja libre unos 6 cm. Auméntalo si el texto tapa el encabezado.
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={guardando} onClick={() => guardar(true)}>
          {molde.activo ? 'Guardar' : 'Guardar y activar'}
        </button>
        {!molde.activo && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={guardando} onClick={() => guardar(false)}>
            Guardar sin activar
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
