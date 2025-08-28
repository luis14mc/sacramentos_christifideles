'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  PlusIcon, 
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface RolParroquial {
  id_rol_parroquial: number;
  nombre: string;
  descripcion?: string;
  _count: {
    miembros: number;
  };
}

export default function RolesParroquialesAdmin() {
  const router = useRouter();
  const [roles, setRoles] = useState<RolParroquial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(rol => 
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rol.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <ShieldCheckIcon className="h-8 w-8 text-accent mr-3" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Roles Parroquiales
                </h1>
                <p className="text-base-content/70 text-sm">
                  Definir roles y responsabilidades en la parroquia
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/configuracion/roles/nuevo')}
              className="btn btn-accent gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo Rol
            </button>
          </div>

          {/* Search */}
          <div className="bg-base-100 rounded-lg border border-base-300 p-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                placeholder="Buscar rol por nombre o descripción..."
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-base-content/70">
              Mostrando {filteredRoles.length} de {roles.length} roles
            </p>
          </div>

          {/* Roles list */}
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-lg border border-base-300">
              <ShieldCheckIcon className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/60 mb-4">
                {searchTerm 
                  ? 'No se encontraron roles con el término de búsqueda'
                  : 'No hay roles parroquiales definidos'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/configuracion/roles/nuevo')}
                  className="btn btn-accent gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Crear Primer Rol
                </button>
              )}
            </div>
          ) : (
            <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rol</th>
                      <th>Descripción</th>
                      <th>Asignaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map((rol) => (
                      <tr key={rol.id_rol_parroquial} className="hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                              <ShieldCheckIcon className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <div className="font-bold text-base-content">
                                {rol.nombre}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-base-content/70">
                          <div className="max-w-md">
                            {rol.descripcion ? (
                              <p className="text-sm line-clamp-2">
                                {rol.descripcion}
                              </p>
                            ) : (
                              <span className="text-base-content/40 italic">
                                Sin descripción
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-accent badge-outline">
                              {(() => {
                                if (rol._count.miembros === 0) return 'Sin asignaciones';
                                if (rol._count.miembros === 1) return '1 persona';
                                return `${rol._count.miembros} personas`;
                              })()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/configuracion/roles/${rol.id_rol_parroquial}/editar`)}
                              className="btn btn-ghost btn-xs"
                              title="Editar"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => console.log('Eliminar rol:', rol.id_rol_parroquial)}
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
            </div>
          )}

          {/* Info box */}
          <div className="mt-8 bg-warning/10 border border-warning/20 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-4 h-4 text-warning" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-warning">
                  Roles Parroquiales
                </h3>
                <div className="mt-2 text-sm text-base-content/70">
                  <p>
                    Los roles parroquiales definen las responsabilidades y funciones que pueden 
                    desempeñar los miembros de la comunidad en diferentes grupos y actividades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
