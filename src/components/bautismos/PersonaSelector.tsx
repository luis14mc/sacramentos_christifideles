'use client';

import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PersonaLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (numeroIdentidad: string) => void;
  required?: boolean;
}

// Selector de Persona: SOLO permite elegir Personas ya registradas en la
// parroquia autenticada (GET /api/personas es tenant-safe). Nunca crea
// Personas inline; si no existe, indica registrarla primero en Personas.
export default function PersonaSelector({ label, value, onChange, required }: Props) {
  const [personas, setPersonas] = useState<PersonaLite[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/personas')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (active) setPersonas(Array.isArray(data) ? data : []);
      })
      .catch(() => active && setPersonas([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const seleccionada = useMemo(
    () => personas.find((p) => p.numero_identidad === value),
    [personas, value]
  );

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return personas.slice(0, 8);
    return personas
      .filter(
        (p) =>
          p.numero_identidad.toLowerCase().includes(q) ||
          `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [personas, query]);

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">
          {label} {required && <span className="text-error">*</span>}
        </span>
      </label>

      {seleccionada ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-base-300 px-3 py-2">
          <span className="text-sm">
            <span className="font-medium">
              {seleccionada.nombres} {seleccionada.apellidos}
            </span>{' '}
            <span className="text-base-content/60">· DNI {seleccionada.numero_identidad}</span>
          </span>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => onChange('')}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-base-300 px-3 py-2">
            <MagnifyingGlassIcon className="h-4 w-4 text-base-content/50" />
            <input
              type="text"
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Buscar por DNI o nombre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
            />
          </div>
          {open && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-base-300 bg-base-100 shadow">
              {loading && <li className="px-3 py-2 text-sm text-base-content/60">Cargando…</li>}
              {!loading && resultados.length === 0 && (
                <li className="px-3 py-2 text-sm text-warning">
                  No existe esa Persona. Regístrela primero en el módulo Personas.
                </li>
              )}
              {resultados.map((p) => (
                <li key={p.numero_identidad}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-base-200"
                    onClick={() => {
                      onChange(p.numero_identidad);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <span className="font-medium">
                      {p.nombres} {p.apellidos}
                    </span>{' '}
                    <span className="text-base-content/60">· {p.numero_identidad}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
