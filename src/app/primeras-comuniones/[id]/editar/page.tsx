'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ComunionForm from '@/components/sacramentos/ComunionForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditarComunionPage() {
  const params = useParams();
  const id = String(params.id);
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
          <div className="flex items-center gap-3">
            <Link href={`/primeras-comuniones/${id}`} className="btn btn-ghost btn-sm"><ArrowLeftIcon className="h-4 w-4" /></Link>
            <h1 className="text-2xl font-bold">Editar Primera Comunión</h1>
          </div>
        </div>
        <ComunionForm registroId={id} />
      </div>
    </AuthenticatedLayout>
  );
}
