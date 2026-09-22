export default function Loading() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
