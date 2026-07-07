'use client';

export interface PersonaOption {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}

export function PersonaSelectField({
  label,
  value,
  onChange,
  personas,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  personas: PersonaOption[];
  required?: boolean;
}) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      <select
        className="select select-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Seleccionar persona...</option>
        {personas.map((p) => (
          <option key={p.numero_identidad} value={p.numero_identidad}>
            {p.nombres} {p.apellidos} ({p.numero_identidad})
          </option>
        ))}
      </select>
    </div>
  );
}

export interface SacerdoteOption {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}

export function SacerdoteSelectField({
  label = 'Sacerdote',
  placeholder = 'Seleccionar sacerdote...',
  value,
  onChange,
  sacerdotes,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (id: string) => void;
  sacerdotes: SacerdoteOption[];
}) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">
          {label} <span className="text-error ml-1">*</span>
        </span>
      </label>
      <select
        className="select select-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">{placeholder}</option>
        {sacerdotes.map((s) => (
          <option key={s.numero_identidad} value={s.numero_identidad}>
            {s.nombres} {s.apellidos}
          </option>
        ))}
      </select>
    </div>
  );
}
