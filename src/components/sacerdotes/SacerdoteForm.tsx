'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';
import PersonaSelector from '@/components/bautismos/PersonaSelector';

interface CatalogoRango {
  id_rango_sacerdotal: number;
  nombre: string;
}
interface CatalogoOrden {
  id_orden_religiosa: number;
  nombre: string;
}

interface Props {
  dni?: string;
}

export default function SacerdoteForm({ dni }: Props) {
  const router = useRouter();
  const isEdit = Boolean(dni);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [rangos, setRangos] = useState<CatalogoRango[]>([]);
  const [ordenes, setOrdenes] = useState<CatalogoOrden[]>([]);
  const [personaLabel, setPersonaLabel] = useState('');
  const [form, setForm] = useState({
    numero_identidad: dni ?? '',
    id_rango_sacerdotal: '',
    id_orden_religiosa: '',
    es_parroco: 0,
    estado_ministerial: 1,
  });

  useEffect(() => {
    Promise.all([fetch('/api/rangos-sacerdotales'), fetch('/api/ordenes-religiosas')])
      .then(async ([rangosResponse, ordenesResponse]) => {
        if (!rangosResponse.ok || !ordenesResponse.ok) throw new Error();
        const [rangosData, ordenesData] = await Promise.all([rangosResponse.json(), ordenesResponse.json()]);
        if (!Array.isArray(rangosData) || !Array.isArray(ordenesData) || !rangosData.length || !ordenesData.length) throw new Error();
        setRangos(rangosData);
        setOrdenes(ordenesData);
      })
      .catch(() => {
        setRangos([]);
        setOrdenes([]);
        setCatalogError('No se pudieron cargar los catálogos clericales. Intente nuevamente.');
      })
      .finally(() => setCatalogLoading(false));
  }, []);

  useEffect(() => {
    if (!dni) return;
    fetch(`/api/sacerdotes/${encodeURIComponent(dni)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        if (!row) return;
        setForm({
          numero_identidad: row.numero_identidad,
          id_rango_sacerdotal: String(row.id_rango_sacerdotal ?? ''),
          id_orden_religiosa: String(row.id_orden_religiosa ?? ''),
          es_parroco: Number(row.es_parroco) || 0,
          estado_ministerial: Number(row.estado_ministerial) === 0 ? 0 : 1,
        });
        setPersonaLabel(`${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim());
      })
      .catch(() => undefined);
  }, [dni]);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const guardar = async () => {
    if (!form.numero_identidad) {
      await Swal.fire({ icon: 'warning', title: 'Seleccione una persona' });
      return;
    }
    if (catalogError || !rangos.length || !ordenes.length) {
      await Swal.fire({ icon: 'error', title: 'Catálogos no disponibles', text: catalogError || 'No hay catálogos clericales disponibles.' });
      return;
    }
    if (!form.id_rango_sacerdotal || !form.id_orden_religiosa) {
      await Swal.fire({ icon: 'warning', title: 'Complete los datos clericales' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        numero_identidad: form.numero_identidad,
        id_rango_sacerdotal: Number(form.id_rango_sacerdotal),
        id_orden_religiosa: Number(form.id_orden_religiosa),
        es_parroco: form.es_parroco,
        estado_ministerial: form.estado_ministerial,
      };
      const res = await fetch(
        isEdit ? `/api/sacerdotes/${encodeURIComponent(form.numero_identidad)}` : '/api/sacerdotes',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: data.error || 'Error' });
        return;
      }
      router.push(`/sacerdotes/${encodeURIComponent(form.numero_identidad)}`);
    } catch {
      await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: 'Error de red. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl shadow-sm border border-base-300 bg-base-100 p-6">
        <h3 className="mb-3 font-semibold">Persona</h3>
        {isEdit ? (
          <p className="text-sm">
            {personaLabel || form.numero_identidad} · DNI {form.numero_identidad}
            <span className="block text-base-content/60 mt-1">
              Los datos personales se editan en{' '}
              <Link className="link" href={`/personas/${encodeURIComponent(form.numero_identidad)}`}>
                Personas
              </Link>
              .
            </span>
          </p>
        ) : (
          <>
            <PersonaSelector
              label="Persona (sexo masculino, ya registrada)"
              required
              sexo="M"
              estadoVital={1}
              value={form.numero_identidad}
              onChange={(v) => setField('numero_identidad', v)}
            />
            <p className="text-xs text-base-content/60 mt-2">
              Si no aparece, regístrela primero en Personas. No se crea persona desde este módulo.
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl shadow-sm border border-base-300 bg-base-100 p-6">
        <h3 className="mb-3 font-semibold">Datos clericales</h3>
        {catalogLoading && <p className="mb-3 text-sm text-base-content/60">Cargando catálogos…</p>}
        {catalogError && <p className="mb-3 text-sm text-error" role="alert">{catalogError}</p>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                Rango sacerdotal <span className="text-error">*</span>
              </span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.id_rango_sacerdotal}
              onChange={(e) => setField('id_rango_sacerdotal', e.target.value)}
              required
            >
              <option value="">Seleccionar rango…</option>
              {rangos.map((r) => (
                <option key={r.id_rango_sacerdotal} value={r.id_rango_sacerdotal}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                Orden religiosa <span className="text-error">*</span>
              </span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.id_orden_religiosa}
              onChange={(e) => setField('id_orden_religiosa', e.target.value)}
              required
            >
              <option value="">Seleccionar orden…</option>
              {ordenes.map((o) => (
                <option key={o.id_orden_religiosa} value={o.id_orden_religiosa}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">¿Es párroco?</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.es_parroco}
              onChange={(e) => setField('es_parroco', Number(e.target.value))}
            >
              <option value={0}>No</option>
              <option value={1}>Sí</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Estado ministerial</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.estado_ministerial}
              onChange={(e) => setField('estado_ministerial', Number(e.target.value))}
            >
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/sacerdotes" className="btn btn-ghost">
          Cancelar
        </Link>
        <button className="btn btn-primary" onClick={guardar} disabled={loading || catalogLoading || Boolean(catalogError) || !rangos.length || !ordenes.length}>
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar'}
        </button>
      </div>
    </div>
  );
}
