'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  PlusIcon, 
  UserCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Sacerdote {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?: string;
  es_parroco: number;
  estado_vital: number;
  rango: {
    nombre: string;
  };
  orden_religiosa: {
    nombre: string;
  };
}

export default function SacerdotesAdmin() {
  const router = useRouter();
  const [sacerdotes, setSacerdotes] = useState<Sacerdote[]>([]);
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
        setSacerdotes(data);
      }
    } catch (error) {
      console.error('Error al cargar sacerdotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSacerdotes = sacerdotes.filter(sacerdote => {
    const matchesSearch = 
      sacerdote.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sacerdote.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sacerdote.numero_identidad.includes(searchTerm);

    const matchesEstado = filterEstado === 'todos' || 
      (filterEstado === 'activos' && sacerdote.estado_vital === 1) ||
      (filterEstado === 'inactivos' && sacerdote.estado_vital === 0);

    return matchesSearch && matchesEstado;
  });

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
                  Sacerdotes
                </h1>
                <p className="text-base-content/70 text-sm">
                  Administrar sacerdotes, diáconos y religiosos
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/configuracion/sacerdotes/nuevo')}
              className="btn btn-primary gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo Sacerdote
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
              Mostrando {filteredSacerdotes.length} de {sacerdotes.length} sacerdotes
            </p>
          </div>

          {/* Sacerdotes table */}
          <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden">
            {filteredSacerdotes.length === 0 ? (
              <div className="text-center py-12">
                <UserCircleIcon className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
                <p className="text-base-content/60 mb-4">
                  {searchTerm || filterEstado !== 'todos' 
                    ? 'No se encontraron sacerdotes con los filtros aplicados'
                    : 'No hay sacerdotes registrados'
                  }
                </p>
                {(!searchTerm && filterEstado === 'todos') && (
                  <button
                    onClick={() => router.push('/configuracion/sacerdotes/nuevo')}
                    className="btn btn-primary gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Registrar Primer Sacerdote
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sacerdote</th>
                      <th>Contacto</th>
                      <th>Rango</th>
                      <th>Orden</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSacerdotes.map((sacerdote) => (
                      <tr key={sacerdote.numero_identidad} className="hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                <span className="text-sm font-bold">
                                  {sacerdote.nombres.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-base-content">
                                {sacerdote.nombres} {sacerdote.apellidos}
                              </div>
                              <div className="text-sm opacity-50">
                                {sacerdote.numero_identidad}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-base-content/70">
                          <div className="text-sm">
                            {sacerdote.telefono && (
                              <div>📞 {sacerdote.telefono}</div>
                            )}
                            {sacerdote.email && (
                              <div>✉️ {sacerdote.email}</div>
                            )}
                            {!sacerdote.telefono && !sacerdote.email && (
                              <span className="text-base-content/40">Sin contacto</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRangoColor(sacerdote.es_parroco)}`}>
                            {sacerdote.es_parroco === 1 ? 'Párroco' : sacerdote.rango.nombre}
                          </span>
                        </td>
                        <td className="text-base-content/70 text-sm">
                          {sacerdote.orden_religiosa.nombre}
                        </td>
                        <td>
                          <span className={`badge ${getEstadoColor(sacerdote.estado_vital)}`}>
                            {sacerdote.estado_vital === 1 ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/configuracion/sacerdotes/${sacerdote.numero_identidad}`)}
                              className="btn btn-ghost btn-xs"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/configuracion/sacerdotes/${sacerdote.numero_identidad}/editar`)}
                              className="btn btn-ghost btn-xs"
                              title="Editar"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {/* TODO: Confirmar eliminación */}}
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
