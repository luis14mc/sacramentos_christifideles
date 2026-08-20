'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import BautismoForm from '@/components/bautismos/BautismoForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditarBautismoPage() {
  const params = useParams();
  const id = String(params.id);
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/bautismos/${id}`} className="btn btn-ghost btn-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Editar Bautismo</h1>
        </div>
        <BautismoForm bautismoId={id} />
      </div>
    </AuthenticatedLayout>
  );
}
