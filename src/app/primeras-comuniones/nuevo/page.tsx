'use client';

import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ComunionForm from '@/components/sacramentos/ComunionForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NuevaComunionPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/primeras-comuniones" className="btn btn-ghost btn-sm"><ArrowLeftIcon className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold">Registrar Primera Comunión</h1>
        </div>
        <p className="text-sm text-base-content/60">Todos los participantes deben existir previamente como Personas de esta parroquia.</p>
        <ComunionForm />
      </div>
    </AuthenticatedLayout>
  );
}
