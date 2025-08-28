'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import PersonaModal from '../../components/modals/PersonaModal';
import { 
  PlusIcon, 
  UsersIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface Persona {
  numero_identidad: string;
  id_parroquia: number;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono: string;
  email?: string;
  estado_vital: number;
  estado_activo_parroquia: number;
  sector: {
    nombre: string;
  };
  orden_religiosa: {
    nombre: string;
  };
  municipio_nacimiento: {
    nombre_municipio: string;
    departamento: {
      nombre_departamento: string;
    };
  };
}

export default function PersonasPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSexo, setFilterSexo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarPersonas();
  }, []);

  const cargarPersonas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/personas');
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    cargarPersonas();
    setIsModalOpen(false);
  };

  // Filtros
  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = 
      persona.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.numero_identidad.includes(searchTerm) ||
      persona.telefono.includes(searchTerm);

    const matchesSexo = filterSexo === 'todos' || persona.sexo === filterSexo;
    
    const matchesEstado = filterEstado === 'todos' || 
      (filterEstado === 'activos' && persona.estado_vital === 1 && persona.estado_activo_parroquia === 1) ||
      (filterEstado === 'inactivos' && (persona.estado_vital === 0 || persona.estado_activo_parroquia === 0));

    return matchesSearch && matchesSexo && matchesEstado;
  });

  // Paginación
  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonas = filteredPersonas.slice(startIndex, startIndex + itemsPerPage);

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
    
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const getEstadoColor = (persona: Persona) => {
    if (persona.estado_vital === 0) return 'badge-error';
    if (persona.estado_activo_parroquia === 0) return 'badge-warning';
    return 'badge-success';
  };

  const getEstadoTexto = (persona: Persona) => {
    if (persona.estado_vital === 0) return 'Fallecido';
    if (persona.estado_activo_parroquia === 0) return 'Inactivo';
    return 'Activo';
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
      <div className="min-h-screen bg-base-200/30">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header mejorado */}
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                      <UsersIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                        Personas
                      </h1>
                      <p className="text-base-content/70 text-sm mt-1">
                        Gestionar miembros de la comunidad parroquial
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                        <span>Total: {personas.length}</span>
                        <span>•</span>
                        <span>Activos: {personas.filter(p => p.estado_vital === 1 && p.estado_activo_parroquia === 1).length}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary gap-2 shrink-0 shadow-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Nueva Persona</span>
                    <span className="sm:hidden">Nueva</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search and filters mejorados */}
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search mejorado */}
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, apellido, identidad o teléfono..."
                        className="input input-bordered w-full pl-10 focus:input-primary transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filters mejorados */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                      <FunnelIcon className="h-4 w-4 text-base-content/50 shrink-0" />
                      <select
                        className="select select-bordered select-sm focus:select-primary transition-colors"
                        value={filterSexo}
                        onChange={(e) => setFilterSexo(e.target.value)}
                      >
                        <option value="todos">Todos</option>
                        <option value="M">👨 Masculino</option>
                        <option value="F">👩 Femenino</option>
                      </select>
                    </div>
                    <select
                      className="select select-bordered select-sm focus:select-primary transition-colors"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="activos">✅ Activos</option>
                      <option value="inactivos">❌ Inactivos</option>
                    </select>
                  </div>
                </div>

                {/* Results info mejorado */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-4 pt-4 border-t border-base-300">
                  <p className="text-sm text-base-content/70">
                    Mostrando <span className="font-medium">{paginatedPersonas.length}</span> de{' '}
                    <span className="font-medium">{filteredPersonas.length}</span> personas
                    {filteredPersonas.length !== personas.length && (
                      <span className="text-base-content/50"> (de {personas.length} total)</span>
                    )}
                  </p>
                  {totalPages > 1 && (
                    <div className="text-sm text-base-content/70">
                      Página <span className="font-medium">{currentPage}</span> de{' '}
                      <span className="font-medium">{totalPages}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Personas table mejorada */}
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
            {filteredPersonas.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-10 w-10 text-base-content/30" />
                </div>
                <h3 className="text-lg font-medium text-base-content/60 mb-2">
                  {searchTerm || filterSexo !== 'todos' || filterEstado !== 'todos'
                    ? 'No se encontraron personas'
                    : 'No hay personas registradas'
                  }
                </h3>
                <p className="text-sm text-base-content/50 mb-6">
                  {searchTerm || filterSexo !== 'todos' || filterEstado !== 'todos'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza registrando la primera persona de la comunidad'
                  }
                </p>
                {(!searchTerm && filterSexo === 'todos' && filterEstado === 'todos') && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Registrar Primera Persona
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead className="bg-base-200/50">
                    <tr>
                      <th className="font-semibold">Persona</th>
                      <th className="font-semibold">Contacto</th>
                      <th className="font-semibold">Información</th>
                      <th className="font-semibold">Sector</th>
                      <th className="font-semibold">Estado</th>
                      <th className="font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPersonas.map((persona) => (
                      <tr key={`${persona.id_parroquia}-${persona.numero_identidad}`} className="hover:bg-base-200/30 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-content grid place-items-center shadow-sm">
                                <span className="text-sm font-bold">
                                  {persona.nombres.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-base-content truncate">
                                {persona.nombres} {persona.apellidos}
                              </div>
                              <div className="text-sm text-base-content/60 font-mono">
                                {persona.numero_identidad}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span>📞</span>
                              <span className="font-mono">{persona.telefono}</span>
                            </div>
                            {persona.email && (
                              <div className="flex items-center gap-1">
                                <span>✉️</span>
                                <span className="truncate max-w-[150px]" title={persona.email}>
                                  {persona.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-sm text-base-content/70">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span>{persona.sexo === 'M' ? '👨' : '👩'}</span>
                              <span>{calcularEdad(persona.fecha_nacimiento)} años</span>
                            </div>
                            <div 
                              className="flex items-center gap-1 truncate max-w-[150px]" 
                              title={`${persona.municipio_nacimiento.nombre_municipio}, ${persona.municipio_nacimiento.departamento.nombre_departamento}`}
                            >
                              <span>📍</span>
                              <span>{persona.municipio_nacimiento.nombre_municipio}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm text-base-content/70">
                          <div className="truncate max-w-[120px]" title={persona.sector.nombre}>
                            <span className="inline-flex items-center gap-1">
                              <span>⛪</span>
                              <span>{persona.sector.nombre}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-sm ${getEstadoColor(persona)} shadow-sm`}>
                            {getEstadoTexto(persona)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => router.push(`/personas/${persona.numero_identidad}`)}
                              className="btn btn-ghost btn-xs hover:bg-info/20 hover:text-info transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/personas/${persona.numero_identidad}/editar`)}
                              className="btn btn-ghost btn-xs hover:bg-warning/20 hover:text-warning transition-colors"
                              title="Editar"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => console.log('Eliminar persona:', persona.numero_identidad)}
                              className="btn btn-ghost btn-xs hover:bg-error/20 hover:text-error transition-colors"
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

          {/* Pagination mejorada */}
          {totalPages > 1 && (
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-base-content/70">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredPersonas.length)}</span>{' '}
                  de <span className="font-medium">{filteredPersonas.length}</span> personas
                </div>
                
                <div className="join shadow-sm">
                  <button
                    className="join-item btn btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    «
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-active btn-primary' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="join-item btn btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Nueva Persona */}
        <PersonaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </div>
      </div>
    </AuthenticatedLayout>
  );
}
