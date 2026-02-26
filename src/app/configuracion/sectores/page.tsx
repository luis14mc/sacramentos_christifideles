'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  PlusIcon, 
  HomeModernIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface SectorParroquial {
  id_sector_parroquial: number;
  nombre: string;
  nombre_capilla?: string;
  direccion?: string;
  telefono?: string;
  responsable?: string;
  parroquia: {
    nombre: string;
  };
  tipoSector: {
    nombre: string;
    descripcion: string;
  };
  _count: {
    miembros: number;
  };
}

interface TipoSector {
  id_tipo_sector_parroquial: number;
  nombre: string;
  descripcion: string;
}

export default function SectoresParroquialesAdmin() {
  const [sectores, setSectores] = useState<SectorParroquial[]>([]);
  const [tiposSector, setTiposSector] = useState<TipoSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SectorParroquial | null>(null);
  const [formData, setFormData] = useState({
    id_parroquia: 1,
    id_tipo_sector_parroquial: 1,
    nombre: '',
    nombre_capilla: '',
    direccion: '',
    telefono: '',
    responsable: ''
  });

  useEffect(() => {
    cargarSectores();
    cargarTiposSector();
  }, []);

  const cargarSectores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/sectores');
      if (response.ok) {
        const data = await response.json();
        setSectores(data);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error al cargar',
          text: 'No se pudieron cargar los sectores parroquiales',
          confirmButtonColor: '#590202'
        });
      }
    } catch (error) {
      console.error('Error al cargar sectores:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al cargar los sectores',
        confirmButtonColor: '#590202'
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposSector = async () => {
    try {
      const response = await fetch('/api/sectores');
      if (response.ok) {
        const data = await response.json();
        setTiposSector(data);
      }
    } catch (error) {
      console.error('Error al cargar tipos de sector:', error);
    }
  };

  const filteredSectores = sectores.filter(sector => 
    sector.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.nombre_capilla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.tipoSector.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const payload = editingItem 
        ? { ...formData, id_sector_parroquial: editingItem.id_sector_parroquial }
        : formData;

      const response = await fetch('/api/configuracion/sectores', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await cargarSectores();
        handleCloseModal();
        
        await Swal.fire({
          icon: 'success',
          title: editingItem ? '¡Actualizado!' : '¡Guardado!',
          text: `El sector ha sido ${editingItem ? 'actualizado' : 'creado'} correctamente`,
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
          text: errorData.error || 'No se pudo guardar el sector',
          confirmButtonColor: '#590202'
        });
      }
    } catch (error) {
      console.error('Error al guardar sector:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al guardar el sector',
        confirmButtonColor: '#590202'
      });
    }
  };

  const handleEdit = (sector: SectorParroquial) => {
    setEditingItem(sector);
    setFormData({
      id_parroquia: 1,
      id_tipo_sector_parroquial: 1,
      nombre: sector.nombre,
      nombre_capilla: sector.nombre_capilla || '',
      direccion: sector.direccion || '',
      telefono: sector.telefono || '',
      responsable: sector.responsable || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, nombre: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar sector?',
      html: `¿Estás seguro de eliminar el sector <strong>${nombre}</strong>?<br><small>Esta acción no se puede deshacer.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#590202',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/configuracion/sectores?id=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await cargarSectores();
          await Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El sector ha sido eliminado correctamente',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error al eliminar sector:', error);
        alert('Error al eliminar el sector');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      id_parroquia: 1,
      id_tipo_sector_parroquial: 1,
      nombre: '',
      nombre_capilla: '',
      direccion: '',
      telefono: '',
      responsable: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <AuthenticatedLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <HomeModernIcon className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Sectores Parroquiales
                </h1>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Sector
              </button>
            </div>
            <p className="text-base-content/70 text-sm sm:text-base">
              Administra los sectores, capillas y comunidades de la parroquia
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Buscar sectores..."
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300">
                  <div className="stat-figure text-primary">
                    <HomeModernIcon className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Sectores</div>
                  <div className="stat-value text-primary">{sectores.length}</div>
                </div>
                <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300">
                  <div className="stat-figure text-secondary">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Miembros</div>
                  <div className="stat-value text-secondary">
                    {sectores.reduce((acc, sector) => acc + sector._count.miembros, 0)}
                  </div>
                </div>
                <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300">
                  <div className="stat-figure text-accent">
                    <HomeModernIcon className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Capillas</div>
                  <div className="stat-value text-accent">
                    {sectores.filter(s => s.nombre_capilla).length}
                  </div>
                </div>
                <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300">
                  <div className="stat-figure text-info">
                    <MapPinIcon className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Con Dirección</div>
                  <div className="stat-value text-info">
                    {sectores.filter(s => s.direccion).length}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-base-200">
                      <tr>
                        <th>Sector/Capilla</th>
                        <th>Tipo</th>
                        <th>Responsable</th>
                        <th>Contacto</th>
                        <th>Miembros</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSectores.map((sector) => (
                        <tr key={sector.id_sector_parroquial} className="hover:bg-base-50">
                          <td>
                            <div>
                              <div className="font-semibold text-base-content">
                                {sector.nombre}
                              </div>
                              {sector.nombre_capilla && (
                                <div className="text-sm text-base-content/60">
                                  Capilla: {sector.nombre_capilla}
                                </div>
                              )}
                              {sector.direccion && (
                                <div className="text-xs text-base-content/50 flex items-center mt-1">
                                  <MapPinIcon className="w-3 h-3 mr-1" />
                                  {sector.direccion}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-outline">
                              {sector.tipoSector.nombre}
                            </div>
                          </td>
                          <td>
                            {sector.responsable ? (
                              <div className="flex items-center">
                                <UserIcon className="w-4 h-4 mr-2 text-base-content/40" />
                                {sector.responsable}
                              </div>
                            ) : (
                              <span className="text-base-content/40">Sin asignar</span>
                            )}
                          </td>
                          <td>
                            {sector.telefono ? (
                              <div className="flex items-center">
                                <PhoneIcon className="w-4 h-4 mr-2 text-base-content/40" />
                                {sector.telefono}
                              </div>
                            ) : (
                              <span className="text-base-content/40">Sin teléfono</span>
                            )}
                          </td>
                          <td>
                            <div className="badge badge-primary">
                              {sector._count.miembros}
                            </div>
                          </td>
                          <td>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(sector)}
                                className="btn btn-ghost btn-xs"
                                title="Editar"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(sector.id_sector_parroquial, sector.nombre)}
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

                {filteredSectores.length === 0 && (
                  <div className="text-center py-12">
                    <HomeModernIcon className="h-12 w-12 text-base-content/20 mx-auto mb-4" />
                    <p className="text-base-content/60">
                      {searchTerm ? 'No se encontraron sectores' : 'No hay sectores registrados'}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary mt-4"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Crear primer sector
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingItem ? 'Editar Sector' : 'Nuevo Sector'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre del Sector *</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tipo de Sector *</span>
                  </label>
                  <select
                    name="id_tipo_sector_parroquial"
                    value={formData.id_tipo_sector_parroquial}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    {tiposSector.map((tipo) => (
                      <option key={tipo.id_tipo_sector_parroquial} value={tipo.id_tipo_sector_parroquial}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre de la Capilla</span>
                  </label>
                  <input
                    type="text"
                    name="nombre_capilla"
                    value={formData.nombre_capilla}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Responsable</span>
                  </label>
                  <input
                    type="text"
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Teléfono</span>
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Dirección</span>
                </label>
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered"
                  rows={3}
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}