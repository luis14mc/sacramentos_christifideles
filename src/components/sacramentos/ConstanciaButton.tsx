'use client';

import { useEffect, useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface Firmantes {
  parroco: string | null;
  vicario: string | null;
}

// Botón para abrir la certificación PDF de cualquier sacramento.
// El endpoint es tenant-safe y obtiene todos los datos del servidor; aquí solo
// se elige quién firma (párroco o vicario parroquial).
export default function ConstanciaButton({ sacramento, id }: { sacramento: string; id: string }) {
  const [firmantes, setFirmantes] = useState<Firmantes | null>(null);
  const [firmante, setFirmante] = useState<'parroco' | 'vicario'>('parroco');

  useEffect(() => {
    let cancelado = false;
    fetch('/api/constancias/firmantes')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Firmantes | null) => {
        if (cancelado) return;
        const f = d ?? { parroco: null, vicario: null };
        setFirmantes(f);
        // Sin párroco configurado, firma el vicario.
        if (!f.parroco && f.vicario) setFirmante('vicario');
      })
      .catch(() => {
        if (!cancelado) setFirmantes({ parroco: null, vicario: null });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const href = `/api/constancias/${sacramento}/${id}${firmante === 'vicario' ? '?firmante=vicario' : ''}`;

  if (firmantes && !firmantes.parroco && !firmantes.vicario) {
    return (
      <div className="flex flex-col gap-1">
        <button type="button" className="btn btn-outline btn-sm" disabled>
          <DocumentArrowDownIcon className="h-4 w-4" /> Descargar certificación PDF
        </button>
        <span className="text-xs text-warning">
          Configure el párroco en Configuración → Datos de la parroquia para emitir certificaciones.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {firmantes?.vicario && (
        <select
          className="select select-bordered select-sm"
          aria-label="Quién firma la certificación"
          value={firmante}
          onChange={(e) => setFirmante(e.target.value as 'parroco' | 'vicario')}
        >
          {firmantes.parroco && <option value="parroco">Firma el párroco: {firmantes.parroco}</option>}
          <option value="vicario">Firma el vicario: {firmantes.vicario}</option>
        </select>
      )}
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
        <DocumentArrowDownIcon className="h-4 w-4" /> Descargar certificación PDF
      </a>
    </div>
  );
}
