'use client';

import { useEffect, useState } from 'react';

interface MinistroLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  rango?: { nombre: string } | null;
}

interface Props {
  label: string; // "Sacerdote" u "Obispo"
  value: string;
  onChange: (numeroIdentidad: string) => void;
  required?: boolean;
  /**
   * Filtro opcional por nombre de rango (contains, case-insensitive).
   * Confirmación usa `obispo` para priorizar obispos/arzobispos.
   * No hay código/tipo estable de rango: no se hardcodean IDs.
   */
  rango?: string;
}

// Selector de ministro. GET /api/sacerdotes?lite=1 es tenant-safe y solo
// incluye clero activo (estado_ministerial=1) con Persona viva.
export default function MinistroSelector({ label, value, onChange, required, rango }: Props) {
  const [ministros, setMinistros] = useState<MinistroLite[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ lite: '1' });
    if (rango) params.set('rango', rango);
    fetch(`/api/sacerdotes?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMinistros(Array.isArray(d) ? d : []))
      .catch(() => setMinistros([]));
  }, [rango]);

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">
          {label} {required && <span className="text-error">*</span>}
        </span>
      </label>
      <select
        className="select select-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Seleccionar {label.toLowerCase()}…</option>
        {ministros.map((m) => (
          <option key={m.numero_identidad} value={m.numero_identidad}>
            {m.nombres} {m.apellidos}
            {m.rango?.nombre ? ` (${m.rango.nombre})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
