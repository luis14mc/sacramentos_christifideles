'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  PlusIcon, 
  UserCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface PersonaRef {
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?: string | null;
}

interface MinistroOrdenado {
  numero_identidad: string;
  es_parroco: number;
  estado_ministerial: number;
  persona: PersonaRef;
  rango: { nombre: string };
  orden_religiosa?: { nombre: string } | null;
}

export default function CleroAdmin() {
  const router = useRouter();
  const [ministros, setMinistros] = useState<MinistroOrdenado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  useEffect(() => {
    cargarSacerdotes();
  }, []);

  const cargarSacerdotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/sacerdotes');
      if (response.ok) {
        const data = await response.json();
        setMinistros(data);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los sacerdotes',
          confirmButtonColor: '#590202'
        });
      }
    } catch (error) {
      logger.error('Error al cargar sacerdotes:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al cargar los sacerdotes',
        confirmButtonColor: '#590202'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMinistros = ministros.filter((ministro) => {
    const matchesSearch =
      ministro.persona.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ministro.persona.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ministro.numero_identidad.includes(searchTerm);

    const matchesEstado =
      filterEstado === 'todos' ||
      (filterEstado === 'activos' && ministro.estado_ministerial === 1) ||
      (filterEstado === 'inactivos' && ministro.estado_ministerial === 0);

    return matchesSearch && matchesEstado;
  });

  const handleDelete = async (ministro: MinistroOrdenado) => {
    const result = await Swal.fire({
      title: '¿Desactivar o eliminar registro clerical?',
      html: `¿Qué desea hacer con <strong>${ministro.persona.nombres} ${ministro.persona.apellidos}</strong>?<br><small>Si tiene sacramentos asociados, solo se desactivará. La persona no se elimina.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#590202',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `/api/configuracion/sacerdotes/${encodeURIComponent(ministro.numero_identidad)}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          const data = await response.json();
          await Swal.fire({
            icon: 'success',
            title: data.deactivated ? 'Desactivado' : 'Eliminado',
            text:
              data.message ||
              'El registro clerical fue procesado. La persona permanece en el sistema.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          cargarSacerdotes();
        } else {
          const errorData = await response.json();
          await Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: errorData.error || 'No se pudo eliminar el sacerdote',
            confirmButtonColor: '#590202'
          });
        }
      } catch (error) {
        logger.error('Error al eliminar:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al eliminar el sacerdote',
          confirmButtonColor: '#590202'
        });
      }
    }
  };

  const getRangoColor = (esParroco: number) => {
    return esParroco === 1 ? 'badge-primary' : 'badge-secondary';
  };

  const getEstadoColor = (estado: number) => {
    return estado === 1 ? 'badge-success' : 'badge-error';
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <UserCircleIcon className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Clero
                </h1>
                <p className="text-base-content/70 text-sm">
                  Ministros ordenados vinculados a personas registradas
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/configuracion/sacerdotes/nuevo')}
              className="btn btn-primary gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo Ministro
            </button>
          </div>

          {/* Search and filters */}
          <div className="bg-base-100 rounded-lg border border-base-300 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o número de identidad..."
                    className="input input-bordered w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="select select-bordered w-full"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-base-content/70">
              Mostrando {filteredMinistros.length} de {ministros.length} ministros
            </p>
          </div>

          {/* Sacerdotes table */}
          <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden">
            {filteredMinistros.length === 0 ? (
              <div className="text-center py-12">
                <UserCircleIcon className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
                <p className="text-base-content/60 mb-4">
                  {searchTerm || filterEstado !== 'todos' 
                    ? 'No se encontraron ministros con los filtros aplicados'
                    : 'No hay ministros ordenados registrados'
                  }
                </p>
                {(!searchTerm && filterEstado === 'todos') && (
                  <button
                    onClick={() => router.push('/configuracion/sacerdotes/nuevo')}
                    className="btn btn-primary gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Registrar Primer Ministro
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ministro</th>
                      <th>Contacto</th>
                      <th>Rango</th>
                      <th>Orden</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMinistros.map((ministro) => (
                      <tr key={ministro.numero_identidad} className="hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                <span className="text-sm font-bold">
                                  {ministro.persona.nombres.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-base-content">
                                {ministro.persona.nombres} {ministro.persona.apellidos}
                              </div>
                              <div className="text-sm opacity-50">
                                {ministro.numero_identidad}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-base-content/70">
                          <div className="text-sm">
                            {ministro.persona.telefono && (
                              <div>📞 {ministro.persona.telefono}</div>
                            )}
                            {ministro.persona.email && (
                              <div>✉️ {ministro.persona.email}</div>
                            )}
                            {!ministro.persona.telefono && !ministro.persona.email && (
                              <span className="text-base-content/40">Sin contacto</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRangoColor(ministro.es_parroco)}`}>
                            {ministro.es_parroco === 1 ? 'Párroco' : ministro.rango.nombre}
                          </span>
                        </td>
                        <td className="text-base-content/70 text-sm">
                          {ministro.orden_religiosa?.nombre || '—'}
                        </td>
                        <td>
                          <span className={`badge ${getEstadoColor(ministro.estado_ministerial)}`}>
                            {ministro.estado_ministerial === 1 ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/configuracion/sacerdotes/${encodeURIComponent(ministro.numero_identidad)}`
                                )
                              }
                              className="btn btn-ghost btn-xs"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/configuracion/sacerdotes/${encodeURIComponent(ministro.numero_identidad)}/editar`
                                )
                              }
                              className="btn btn-ghost btn-xs"
                              title="Editar"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ministro)}
                              className="btn btn-ghost btn-xs text-error"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
