import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl mt-4 text-base-content/80">Página no encontrada</p>
        <Link href="/dashboard" className="btn btn-primary mt-6">
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
