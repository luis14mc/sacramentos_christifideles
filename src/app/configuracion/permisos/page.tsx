'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Permiso {
  id_permiso: number;
  accion: string;
  rol: {
    id_rol: number;
    nombre: string;
  };
}

interface Pagina {
  id_pagina: number;
  nombre: string;
  descripcion: string;
  url: string;
  permisos: Permiso[];
}

interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
}

interface PermisosData {
  permisos: Pagina[];
  roles: Rol[];
}

type AccionesPermisos = {
  [key: string]: {
    leer: boolean;
    escribir: boolean;
    eliminar: boolean;
    administrar: boolean;
  };
};

export default function SistemaPermisos() {
  const [data, setData] = useState<PermisosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [permisos, setPermisos] = useState<AccionesPermisos>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    cargarPermisos();
  }, []);

  const actualizarPermisosLocalez = useCallback(() => {
    if (!data || !selectedRol) return;

    const nuevosPermisos: AccionesPermisos = {};
    
    data.permisos.forEach(pagina => {
      const permisosRol = pagina.permisos.filter(p => p.rol.id_rol === selectedRol);
      nuevosPermisos[pagina.id_pagina] = {
        leer: permisosRol.some(p => p.accion === 'leer'),
        escribir: permisosRol.some(p => p.accion === 'escribir'),
        eliminar: permisosRol.some(p => p.accion === 'eliminar'),
        administrar: permisosRol.some(p => p.accion === 'administrar')
      };
    });

    setPermisos(nuevosPermisos);
  }, [data, selectedRol]);

  useEffect(() => {
    if (data && selectedRol) {
      actualizarPermisosLocalez();
    }
  }, [selectedRol, data, actualizarPermisosLocalez]);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/permisos');
      if (response.ok) {
        const datos = await response.json();
        setData(datos);
        if (datos.roles.length > 0) {
          setSelectedRol(datos.roles[0].id_rol);
        }
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los permisos del sistema',
          confirmButtonColor: '#590202'
        });
      }
    } catch (error) {
      logger.error('Error al cargar permisos:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al cargar los permisos',
        confirmButtonColor: '#590202'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (paginaId: number, accion: string, valor: boolean) => {
    setPermisos(prev => ({
      ...prev,
      [paginaId]: {
        ...prev[paginaId],
        [accion]: valor
      }
    }));
  };

  const guardarPermisos = async () => {
    if (!selectedRol) return;

    try {
      setSaving(true);
      const response = await fetch('/api/configuracion/permisos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rol_id: selectedRol,
          permisos_bulk: permisos
        }),
      });

      if (response.ok) {
        await cargarPermisos();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        await Swal.fire({
          icon: 'success',
          title: '¡Guardado!',
          text: 'Los permisos se guardaron correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        const errorData = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: errorData.error || 'No se pudieron guardar los permisos',
          confirmButtonColor: '#590202'
        });
      }
    } catch (error) {
      logger.error('Error al guardar permisos:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al guardar los permisos',
        confirmButtonColor: '#590202'
      });
    } finally {
      setSaving(false);
    }
  };

  const aplicarTemplate = (template: string) => {
    if (!data) return;

    const nuevosPermisos: AccionesPermisos = {};

    data.permisos.forEach(pagina => {
      switch (template) {
        case 'admin':
          nuevosPermisos[pagina.id_pagina] = {
            leer: true,
            escribir: true,
            eliminar: true,
            administrar: true
          };
          break;
        case 'editor':
          nuevosPermisos[pagina.id_pagina] = {
            leer: true,
            escribir: true,
            eliminar: false,
            administrar: false
          };
          break;
        case 'lectura':
          nuevosPermisos[pagina.id_pagina] = {
            leer: true,
            escribir: false,
            eliminar: false,
            administrar: false
          };
          break;
        case 'ninguno':
          nuevosPermisos[pagina.id_pagina] = {
            leer: false,
            escribir: false,
            eliminar: false,
            administrar: false
          };
          break;
        default:
          break;
      }
    });

    setPermisos(nuevosPermisos);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Sistema de Permisos
                </h1>
              </div>
              {success && (
                <div className="alert alert-success shadow-lg w-auto">
                  <CheckIcon className="h-6 w-6" />
                  <span>Permisos guardados exitosamente</span>
                </div>
              )}
            </div>
            <p className="text-base-content/70 text-sm sm:text-base">
              Gestiona los permisos de acceso para cada rol del sistema
            </p>
          </div>

          {/* Selector de Rol */}
          <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-primary mr-2" />
                  <h2 className="card-title">Seleccionar Rol</h2>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => aplicarTemplate('admin')}
                    className="btn btn-sm btn-primary"
                    disabled={saving}
                  >
                    Admin Completo
                  </button>
                  <button
                    onClick={() => aplicarTemplate('editor')}
                    className="btn btn-sm btn-secondary"
                    disabled={saving}
                  >
                    Solo Edición
                  </button>
                  <button
                    onClick={() => aplicarTemplate('lectura')}
                    className="btn btn-sm btn-accent"
                    disabled={saving}
                  >
                    Solo Lectura
                  </button>
                  <button
                    onClick={() => aplicarTemplate('ninguno')}
                    className="btn btn-sm btn-ghost"
                    disabled={saving}
                  >
                    Sin Permisos
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.roles.map((rol) => (
                  <button
                    key={rol.id_rol}
                    onClick={() => setSelectedRol(rol.id_rol)}
                    className={`card ${
                      selectedRol === rol.id_rol 
                        ? 'bg-primary text-primary-content shadow-lg' 
                        : 'bg-base-200 hover:bg-base-300'
                    } transition-all duration-200`}
                  >
                    <div className="card-body p-4">
                      <h3 className="font-semibold">{rol.nombre}</h3>
                      <p className="text-sm opacity-70">{rol.descripcion}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matriz de Permisos */}
          {selectedRol && (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
                    <h2 className="card-title">
                      Permisos para: {data?.roles.find(r => r.id_rol === selectedRol)?.nombre}
                    </h2>
                  </div>
                  <button
                    onClick={guardarPermisos}
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm mr-2"></span>
                        Guardando...
                      </>
                    ) : (
                      'Guardar Permisos'
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-base-200">
                      <tr>
                        <th>Página</th>
                        <th className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <EyeIcon className="h-4 w-4 text-info" />
                            <span>Leer</span>
                          </div>
                        </th>
                        <th className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <PencilIcon className="h-4 w-4 text-warning" />
                            <span>Escribir</span>
                          </div>
                        </th>
                        <th className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <TrashIcon className="h-4 w-4 text-error" />
                            <span>Eliminar</span>
                          </div>
                        </th>
                        <th className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <CogIcon className="h-4 w-4 text-primary" />
                            <span>Administrar</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.permisos.map((pagina) => (
                        <tr key={pagina.id_pagina} className="hover:bg-base-50">
                          <td>
                            <div>
                              <div className="font-semibold">{pagina.nombre}</div>
                              <div className="text-sm text-base-content/60">{pagina.descripcion}</div>
                              <div className="text-xs text-base-content/40">{pagina.url}</div>
                            </div>
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={permisos[pagina.id_pagina]?.leer || false}
                              onChange={(e) => handlePermisoChange(pagina.id_pagina, 'leer', e.target.checked)}
                              className="checkbox checkbox-info"
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={permisos[pagina.id_pagina]?.escribir || false}
                              onChange={(e) => handlePermisoChange(pagina.id_pagina, 'escribir', e.target.checked)}
                              className="checkbox checkbox-warning"
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={permisos[pagina.id_pagina]?.eliminar || false}
                              onChange={(e) => handlePermisoChange(pagina.id_pagina, 'eliminar', e.target.checked)}
                              className="checkbox checkbox-error"
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={permisos[pagina.id_pagina]?.administrar || false}
                              onChange={(e) => handlePermisoChange(pagina.id_pagina, 'administrar', e.target.checked)}
                              className="checkbox checkbox-primary"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data?.permisos.length === 0 && (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-12 w-12 text-base-content/20 mx-auto mb-4" />
                    <p className="text-base-content/60">No hay páginas configuradas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-6 alert alert-info">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-4 h-4 text-info" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-info">
                  Información sobre Permisos
                </h3>
                <div className="mt-2 text-sm text-base-content/70">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Leer:</strong> Permite ver el contenido de la página</li>
                    <li><strong>Escribir:</strong> Permite crear y editar registros</li>
                    <li><strong>Eliminar:</strong> Permite eliminar registros</li>
                    <li><strong>Administrar:</strong> Permite configurar y gestionar completamente el módulo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}