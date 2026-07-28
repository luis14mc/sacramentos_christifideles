'use client';

import { logger } from '@/lib/logger';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  CreateSacramentoButton,
  SacramentoActionButtons,
  SacramentoSecretaryNotice,
} from '@/components/sacramentos/SacramentoPermissions';
import ReadOnlyNotice from '@/components/common/ReadOnlyNotice';
import { nombreCleroFromRecord } from '@/lib/sacerdote';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface PersonaRef {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}

interface CleroRef {
  numero_identidad: string;
  persona?: PersonaRef;
  nombres?: string;
  apellidos?: string;
}

interface BautismoRecord {
  id_bautismo: string;
  fecha_bautismo: string;
  numero_libro: string;
  numero_folio: string;
  numero_pagina: string;
  numero_registro: string;
  nota_marginal?: string | null;
  bautizado: PersonaRef;
  sacerdote: CleroRef;
  padre: PersonaRef;
  madre: PersonaRef;
}

function BautismosPageContent() {
  const router = useRouter();
  const [bautismos, setBautismos] = useState<BautismoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cargarBautismos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bautismos');
      if (response.ok) {
        setBautismos(await response.json());
      }
    } catch (error) {
      logger.error('Error al cargar bautismos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarBautismos();
  }, [cargarBautismos]);

  const eliminarBautismo = async (id: string, nombre: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar bautismo?',
      text: `Se eliminará el registro de ${nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/bautismos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El registro de bautismo fue eliminado.',
          confirmButtonColor: '#10b981',
        });
        cargarBautismos();
      } else {
        const data = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo eliminar el registro',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const filtered = bautismos.filter((b) => {
    const term = searchTerm.toLowerCase();
    const nombre = `${b.bautizado.nombres} ${b.bautizado.apellidos}`.toLowerCase();
    return (
      nombre.includes(term) ||
      b.bautizado.numero_identidad.includes(searchTerm) ||
      b.numero_registro.includes(searchTerm) ||
      b.numero_libro.includes(searchTerm)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-base-200/30">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <SacramentoSecretaryNotice />
            <ReadOnlyNotice entity="bautismos" />

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpenIcon className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Bautismos</h1>
                    <p className="text-base-content/70 text-sm mt-1">
                      Registro sacramental de bautismos parroquiales
                    </p>
                  </div>
                </div>
                <CreateSacramentoButton
                  label="Nuevo Bautismo"
                  onClick={() => router.push('/bautismos/nuevo')}
                />
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, identidad, libro o registro..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Bautizado</th>
                      <th>Fecha</th>
                      <th>Libro / Folio / Reg.</th>
                      <th>Sacerdote</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-base-content/60">
                          No hay registros de bautismo
                        </td>
                      </tr>
                    ) : (
                      paginated.map((b) => (
                        <tr key={b.id_bautismo}>
                          <td>
                            <div className="font-medium">
                              {b.bautizado.nombres} {b.bautizado.apellidos}
                            </div>
                            <div className="text-xs text-base-content/60">
                              {b.bautizado.numero_identidad}
                            </div>
                          </td>
                          <td>{formatFecha(b.fecha_bautismo)}</td>
                          <td>
                            <span className="font-mono text-sm">
                              {b.numero_libro} / {b.numero_folio} / {b.numero_registro}
                            </span>
                          </td>
                          <td>
                            {(() => {
                              const s = nombreCleroFromRecord(b.sacerdote);
                              return `${s.nombres} ${s.apellidos}`;
                            })()}
                          </td>
                          <td>
                            <div className="flex justify-end">
                              <SacramentoActionButtons
                                onEdit={() => router.push(`/bautismos/${b.id_bautismo}/editar`)}
                                onDelete={() =>
                                  eliminarBautismo(
                                    b.id_bautismo,
                                    `${b.bautizado.nombres} ${b.bautizado.apellidos}`
                                  )
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t border-base-300">
                  <button
                    className="btn btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Anterior
                  </button>
                  <span className="flex items-center px-3 text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="btn btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function BautismosPage() {
  return (
    <ProtectedRoute requiredPermission="canViewSacramentos">
      <BautismosPageContent />
    </ProtectedRoute>
  );
}
