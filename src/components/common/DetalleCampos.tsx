import type { ReactNode } from 'react';

/**
 * Lista etiqueta → valor para vistas de detalle. En móvil la etiqueta va
 * encima del valor; desde `sm` se muestran en dos columnas.
 */
export default function DetalleCampos({ filas }: { filas: ReadonlyArray<readonly [string, ReactNode]> }) {
  return (
    <dl className="divide-y divide-base-200">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="px-4 py-3 sm:grid sm:grid-cols-[14rem_1fr] sm:gap-4 sm:px-6">
          <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/60 sm:text-sm sm:normal-case sm:tracking-normal sm:text-base-content">
            {etiqueta}
          </dt>
          <dd className="mt-1 break-words text-sm sm:mt-0">{valor ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
