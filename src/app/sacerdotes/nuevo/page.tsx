'use client';

import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import SacerdoteForm from '@/components/sacerdotes/SacerdoteForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NuevoSacerdotePage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
          <div className="flex items-center gap-3">
            <Link href="/sacerdotes" className="btn btn-ghost btn-sm">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Registrar sacerdote</h1>
              <p className="text-sm text-base-content/60 mt-1">
                La persona debe existir previamente en esta parroquia. Solo se registra la condición clerical.
              </p>
            </div>
          </div>
        </div>
        <SacerdoteForm />
      </div>
    </AuthenticatedLayout>
  );
}
