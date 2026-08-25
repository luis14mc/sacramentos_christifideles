'use client';

import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ConfirmacionForm from '@/components/sacramentos/ConfirmacionForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NuevaConfirmacionPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
          <div className="flex items-center gap-3">
            <Link href="/confirmaciones" className="btn btn-ghost btn-sm"><ArrowLeftIcon className="h-4 w-4" /></Link>
            <div>
              <h1 className="text-2xl font-bold">Registrar Confirmación</h1>
              <p className="text-sm text-base-content/60 mt-1">Todos los participantes deben existir previamente como Personas de esta parroquia.</p>
            </div>
          </div>
        </div>
        <ConfirmacionForm />
      </div>
    </AuthenticatedLayout>
  );
}
