'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No exponer detalles sensibles al usuario; registrar en consola del servidor/cliente.
    console.error('Error de aplicación:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-error">Ocurrió un error</h1>
          <p className="text-base-content/70">
            No pudimos completar la operación. Puedes reintentar o volver más tarde.
          </p>
          {error.digest && (
            <p className="text-xs text-base-content/50">Referencia: {error.digest}</p>
          )}
          <div className="card-actions mt-4">
            <button className="btn btn-primary" onClick={() => reset()}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
