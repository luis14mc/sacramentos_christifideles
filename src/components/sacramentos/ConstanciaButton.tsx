'use client';

import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

// Botón único para descargar/abrir la constancia PDF de cualquier sacramento.
// El endpoint es tenant-safe y obtiene todos los datos del servidor.
export default function ConstanciaButton({ sacramento, id }: { sacramento: string; id: string }) {
  return (
    <a
      href={`/api/constancias/${sacramento}/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline btn-sm"
    >
      <DocumentArrowDownIcon className="h-4 w-4" /> Descargar constancia PDF
    </a>
  );
}
