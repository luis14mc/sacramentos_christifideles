'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import SacerdoteForm from '@/components/sacerdotes/SacerdoteForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditarSacerdotePage() {
  const params = useParams();
  const dni = decodeURIComponent(String(params.dni));

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
          <div className="flex items-center gap-3">
            <Link href={`/sacerdotes/${encodeURIComponent(dni)}`} className="btn btn-ghost btn-sm">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Editar condición clerical</h1>
              <p className="text-sm text-base-content/60 mt-1">
                Los datos personales se modifican en el módulo Personas.
              </p>
            </div>
          </div>
        </div>
        <SacerdoteForm dni={dni} />
      </div>
    </AuthenticatedLayout>
  );
}
