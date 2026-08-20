'use client';

import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import MatrimonioForm from '@/components/sacramentos/MatrimonioForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NuevoMatrimonioPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/matrimonios" className="btn btn-ghost btn-sm"><ArrowLeftIcon className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold">Registrar Matrimonio</h1>
        </div>
        <p className="text-sm text-base-content/60">Los contrayentes, padrinos y (si se informan) los padres deben existir previamente como Personas de esta parroquia.</p>
        <MatrimonioForm />
      </div>
    </AuthenticatedLayout>
  );
}
