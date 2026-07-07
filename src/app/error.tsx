'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('App error boundary', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body text-center">
          <h1 className="card-title justify-center text-error">Algo salió mal</h1>
          <p className="text-base-content/70">
            Ocurrió un error inesperado. Puede intentar de nuevo o contactar al administrador.
          </p>
          <div className="card-actions justify-center mt-4">
            <button type="button" className="btn btn-primary" onClick={reset}>
              Reintentar
            </button>
            <a href="/dashboard" className="btn btn-ghost">
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
