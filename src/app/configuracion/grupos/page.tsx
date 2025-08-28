'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  PlusIcon, 
  UsersIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface GrupoParroquial {
  id_grupo_parroquial: number;
  nombre: string;
  descripcion?: string;
  _count: {
    miembros: number;
  };
}

export default function GruposParroquialesAdmin() {
  const router = useRouter();
  const [grupos, setGrupos] = useState<GrupoParroquial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/grupos');
      if (response.ok) {
        const data = await response.json();
        setGrupos(data);
      }
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrupos = grupos.filter(grupo => 
    grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <UsersIcon className="h-8 w-8 text-secondary mr-3" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Grupos Parroquiales
                </h1>
                <p className="text-base-content/70 text-sm">
                  Administrar grupos y comunidades parroquiales
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/configuracion/grupos/nuevo')}
              className="btn btn-secondary gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo Grupo
            </button>
          </div>

          {/* Search */}
          <div className="bg-base-100 rounded-lg border border-base-300 p-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                placeholder="Buscar grupo por nombre o descripción..."
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-base-content/70">
              Mostrando {filteredGrupos.length} de {grupos.length} grupos
            </p>
          </div>

          {/* Grupos grid */}
          {filteredGrupos.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-lg border border-base-300">
              <UsersIcon className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/60 mb-4">
                {searchTerm 
                  ? 'No se encontraron grupos con el término de búsqueda'
                  : 'No hay grupos parroquiales registrados'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/configuracion/grupos/nuevo')}
                  className="btn btn-secondary gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Crear Primer Grupo
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGrupos.map((grupo) => (
                <div
                  key={grupo.id_grupo_parroquial}
                  className="bg-base-100 rounded-lg border border-base-300 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mr-3">
                        <UsersIcon className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base-content text-lg">
                          {grupo.nombre}
                        </h3>
                        <p className="text-sm text-base-content/60">
                          {grupo._count.miembros} miembros
                        </p>
                      </div>
                    </div>
                    <div className="dropdown dropdown-end">
                      <button className="btn btn-ghost btn-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                        </svg>
                      </button>
                      <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <button
                            onClick={() => router.push(`/configuracion/grupos/${grupo.id_grupo_parroquial}`)}
                            className="flex items-center gap-2"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Ver detalles
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => router.push(`/configuracion/grupos/${grupo.id_grupo_parroquial}/editar`)}
                            className="flex items-center gap-2"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                            Editar
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => console.log('Eliminar grupo:', grupo.id_grupo_parroquial)}
                            className="flex items-center gap-2 text-error"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Eliminar
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {grupo.descripcion && (
                    <p className="text-base-content/70 text-sm mb-4 line-clamp-3">
                      {grupo.descripcion}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="badge badge-secondary badge-outline">
                      {(() => {
                        if (grupo._count.miembros === 0) return 'Sin miembros';
                        if (grupo._count.miembros === 1) return '1 miembro';
                        return `${grupo._count.miembros} miembros`;
                      })()}
                    </span>
                    <button
                      onClick={() => router.push(`/configuracion/grupos/${grupo.id_grupo_parroquial}`)}
                      className="btn btn-ghost btn-sm"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
