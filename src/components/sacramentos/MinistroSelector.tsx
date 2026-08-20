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
}

// Selector de ministro (sacerdote/obispo). Lista solo los ministros de la
// parroquia autenticada (GET /api/sacerdotes es tenant-safe). Reusable por
// todos los sacramentos.
export default function MinistroSelector({ label, value, onChange, required }: Props) {
  const [ministros, setMinistros] = useState<MinistroLite[]>([]);

  useEffect(() => {
    fetch('/api/sacerdotes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMinistros(Array.isArray(d) ? d : []))
      .catch(() => setMinistros([]));
  }, []);

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
