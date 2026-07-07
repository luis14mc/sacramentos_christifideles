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
import {
  DocumentCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface PersonaRef {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}

interface PrimeraComunionRecord {
  id_primera_comunion: string;
  fecha_primera_comunion: string;
  numero_libro: string;
  numero_acta: string;
  numero_registro: string;
  persona: PersonaRef;
  sacerdote: PersonaRef;
}

function PrimeraComunionPageContent() {
  const router = useRouter();
  const [registros, setRegistros] = useState<PrimeraComunionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cargarRegistros = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/primera-comunion');
      if (response.ok) {
        setRegistros(await response.json());
      }
    } catch (error) {
      logger.error('Error al cargar primera comunión:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  const eliminarRegistro = async (id: string, nombre: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar registro?',
      text: `Se eliminará la primera comunión de ${nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/primera-comunion/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El registro fue eliminado.',
          confirmButtonColor: '#10b981',
        });
        cargarRegistros();
      } else {
        const data = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo eliminar',
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

  const filtered = registros.filter((r) => {
    const term = searchTerm.toLowerCase();
    const nombre = `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase();
    return (
      nombre.includes(term) ||
      r.persona.numero_identidad.includes(searchTerm) ||
      r.numero_registro.includes(searchTerm) ||
      r.numero_acta.includes(searchTerm)
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

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center shrink-0">
                    <DocumentCheckIcon className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Primera Comunión</h1>
                    <p className="text-base-content/70 text-sm mt-1">
                      Registro sacramental de primeras comuniones
                    </p>
                  </div>
                </div>
                <CreateSacramentoButton
                  label="Nueva Primera Comunión"
                  onClick={() => router.push('/primera-comunion/nuevo')}
                />
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, identidad, acta o registro..."
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
                      <th>Comunicante</th>
                      <th>Fecha</th>
                      <th>Libro / Acta / Reg.</th>
                      <th>Sacerdote</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-base-content/60">
                          No hay registros de primera comunión
                        </td>
                      </tr>
                    ) : (
                      paginated.map((r) => (
                        <tr key={r.id_primera_comunion}>
                          <td>
                            <div className="font-medium">
                              {r.persona.nombres} {r.persona.apellidos}
                            </div>
                            <div className="text-xs text-base-content/60">
                              {r.persona.numero_identidad}
                            </div>
                          </td>
                          <td>{formatFecha(r.fecha_primera_comunion)}</td>
                          <td>
                            <span className="font-mono text-sm">
                              {r.numero_libro} / {r.numero_acta} / {r.numero_registro}
                            </span>
                          </td>
                          <td>
                            {r.sacerdote.nombres} {r.sacerdote.apellidos}
                          </td>
                          <td>
                            <div className="flex justify-end">
                              <SacramentoActionButtons
                                onEdit={() =>
                                  router.push(
                                    `/primera-comunion/${r.id_primera_comunion}/editar`
                                  )
                                }
                                onDelete={() =>
                                  eliminarRegistro(
                                    r.id_primera_comunion,
                                    `${r.persona.nombres} ${r.persona.apellidos}`
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

export default function PrimeraComunionPage() {
  return (
    <ProtectedRoute requiredPermission="canViewSacramentos">
      <PrimeraComunionPageContent />
    </ProtectedRoute>
  );
}
