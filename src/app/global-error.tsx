'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#b91c1c' }}>Error crítico</h1>
        <p>No se pudo cargar la aplicación.</p>
        <button type="button" onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
