'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { PersonaSelectField, type PersonaOption } from '@/components/sacramentos/PersonaSelectField';

export interface RangoMinisterial {
  id_rango_sacerdotal: number;
  nombre: string;
  descripcion?: string | null;
}

export interface OrdenReligiosa {
  id_orden_religiosa: number;
  nombre: string;
}

export interface CleroFormData {
  numero_identidad: string;
  id_rango_sacerdotal: string;
  id_orden_religiosa: string;
  otra_orden_religiosa: string;
  es_parroco: boolean;
  estado_ministerial: number;
}

export const emptyCleroForm: CleroFormData = {
  numero_identidad: '',
  id_rango_sacerdotal: '',
  id_orden_religiosa: '',
  otra_orden_religiosa: '',
  es_parroco: false,
  estado_ministerial: 1,
};

interface CleroFormProps {
  formData: CleroFormData;
  setFormData: React.Dispatch<React.SetStateAction<CleroFormData>>;
  personas: PersonaOption[];
  isEdit?: boolean;
  loadingPersonas?: boolean;
  personaDetalle?: {
    nombres: string;
    apellidos: string;
    telefono?: string;
    email?: string | null;
    fecha_nacimiento?: string;
  };
}

export function useCleroCatalogos() {
  const [rangos, setRangos] = useState<RangoMinisterial[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenReligiosa[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rangosRes, ordenesRes] = await Promise.all([
          fetch('/api/rangos-sacerdotales'),
          fetch('/api/ordenes-religiosas'),
        ]);

        if (rangosRes.ok) setRangos(await rangosRes.json());
        if (ordenesRes.ok) setOrdenes(await ordenesRes.json());
      } catch {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los catálogos',
          confirmButtonColor: '#590202',
        });
      } finally {
        setLoadingCatalogos(false);
      }
    }

    load();
  }, []);

  return { rangos, ordenes, loadingCatalogos };
}

export default function CleroForm({
  formData,
  setFormData,
  personas,
  isEdit = false,
  loadingPersonas = false,
  personaDetalle,
}: CleroFormProps) {
  const { rangos, ordenes, loadingCatalogos } = useCleroCatalogos();

  if (loadingCatalogos || loadingPersonas) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  const personaSeleccionada = personas.find(
    (p) => p.numero_identidad === formData.numero_identidad
  );

  return (
    <div className="space-y-4">
      {!isEdit ? (
        <>
          <PersonaSelectField
            label="Persona"
            value={formData.numero_identidad}
            onChange={(id) => setFormData((prev) => ({ ...prev, numero_identidad: id }))}
            personas={personas}
          />
          {formData.numero_identidad && !personaSeleccionada && (
            <div className="alert alert-warning">
              <span>
                Debe registrar primero a la persona en el módulo{' '}
                <Link href="/personas/nueva" className="link link-primary font-medium">
                  Personas
                </Link>
                .
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-base-300 p-4 space-y-3 bg-base-200/30">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-base-content/70">Datos personales (solo lectura)</p>
            <Link
              href={`/personas/${encodeURIComponent(formData.numero_identidad)}/editar`}
              className="btn btn-ghost btn-xs"
            >
              Editar en Personas
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-base-content/60">Nombre: </span>
              <span className="font-medium">
                {personaDetalle
                  ? `${personaDetalle.nombres} ${personaDetalle.apellidos}`
                  : formData.numero_identidad}
              </span>
            </div>
            <div>
              <span className="text-base-content/60">Identidad: </span>
              <span className="font-medium">{formData.numero_identidad}</span>
            </div>
            {personaDetalle?.telefono && (
              <div>
                <span className="text-base-content/60">Teléfono: </span>
                <span>{personaDetalle.telefono}</span>
              </div>
            )}
            {personaDetalle?.email && (
              <div>
                <span className="text-base-content/60">Email: </span>
                <span>{personaDetalle.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label" htmlFor="clero-rango">
            <span className="label-text font-medium">
              Grado ministerial <span className="text-error">*</span>
            </span>
          </label>
          <select
            id="clero-rango"
            className="select select-bordered"
            value={formData.id_rango_sacerdotal}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, id_rango_sacerdotal: e.target.value }))
            }
            required
          >
            <option value="">Seleccionar grado...</option>
            {rangos.map((r) => (
              <option key={r.id_rango_sacerdotal} value={r.id_rango_sacerdotal}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="clero-orden">
            <span className="label-text font-medium">Orden religiosa</span>
          </label>
          <select
            id="clero-orden"
            className="select select-bordered"
            value={formData.id_orden_religiosa}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, id_orden_religiosa: e.target.value }))
            }
          >
            <option value="">Seleccionar orden...</option>
            {ordenes.map((o) => (
              <option key={o.id_orden_religiosa} value={o.id_orden_religiosa}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-control">
        <label className="label" htmlFor="clero-otra-orden">
          <span className="label-text font-medium">Otra orden religiosa</span>
        </label>
        <input
          id="clero-otra-orden"
          type="text"
          className="input input-bordered"
          value={formData.otra_orden_religiosa}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, otra_orden_religiosa: e.target.value }))
          }
          maxLength={255}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={formData.es_parroco}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, es_parroco: e.target.checked }))
            }
          />
          <span className="label-text">Es párroco actual</span>
        </label>

        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={formData.estado_ministerial === 1}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                estado_ministerial: e.target.checked ? 1 : 0,
              }))
            }
          />
          <span className="label-text">Activo en el ministerio</span>
        </label>
      </div>
    </div>
  );
}

export function buildCleroPayload(formData: CleroFormData) {
  return {
    numero_identidad: formData.numero_identidad.trim(),
    id_rango_sacerdotal: formData.id_rango_sacerdotal,
    id_orden_religiosa: formData.id_orden_religiosa || undefined,
    otra_orden_religiosa: formData.otra_orden_religiosa || null,
    es_parroco: formData.es_parroco ? 1 : 0,
    estado_ministerial: formData.estado_ministerial,
  };
}
