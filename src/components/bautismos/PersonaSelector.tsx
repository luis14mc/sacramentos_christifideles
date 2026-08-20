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

// Selector tenant-safe: consulta /api/personas con búsqueda limitada en backend.
// Nunca crea Personas inline; si no existe, el usuario debe registrarla primero.
export default function PersonaSelector({ label, value, onChange, required }: Props) {
  const [resultados, setResultados] = useState<PersonaLite[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seleccionada, setSeleccionada] = useState<PersonaLite | null>(null);

  useEffect(() => {
    if (!value) {
      setSeleccionada(null);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/personas?q=${encodeURIComponent(value)}&limit=8&lite=1`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PersonaLite[]) => {
        if (!Array.isArray(data)) return;
        const exacta = data.find((p) => p.numero_identidad === value) || null;
        setSeleccionada(exacta);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setSeleccionada(null);
      });

    return () => controller.abort();
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResultados([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/personas?q=${encodeURIComponent(q)}&limit=8&lite=1`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setResultados(Array.isArray(data) ? data : []))
        .catch((error) => {
          if (error?.name !== 'AbortError') setResultados([]);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const sinResultados = useMemo(
    () => Boolean(query.trim()) && !loading && resultados.length === 0,
    [query, loading, resultados.length]
  );

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
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => {
              setSeleccionada(null);
              setQuery('');
              setResultados([]);
              onChange('');
            }}
          >
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
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              autoComplete="off"
            />
          </div>

          {open && query.trim() && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-base-300 bg-base-100 shadow">
              {loading && (
                <li className="px-3 py-2 text-sm text-base-content/60">Buscando…</li>
              )}
              {sinResultados && (
                <li className="px-3 py-2 text-sm text-warning">
                  No existe esa Persona. Regístrela primero en el módulo Personas.
                </li>
              )}
              {!loading &&
                resultados.map((p) => (
                  <li key={p.numero_identidad}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-base-200"
                      onClick={() => {
                        setSeleccionada(p);
                        onChange(p.numero_identidad);
                        setOpen(false);
                        setQuery('');
                        setResultados([]);
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
