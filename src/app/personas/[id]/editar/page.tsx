'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import Swal from 'sweetalert2';
import { 
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface PersonaEditar {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono: string;
  email?: string;
  direccion?: string;
  estado_vital: number;
  estado_activo_parroquia: number;
  id_sector_parroquial: string;
  id_orden_religiosa: string;
}

export default function EditarPersona() {
  const router = useRouter();
  const params = useParams();
  const numeroIdentidad = params.id as string;
  
  const [persona, setPersona] = useState<PersonaEditar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectores, setSectores] = useState<any[]>([]);
  const [ordenesReligiosas, setOrdenesReligiosas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    telefono: '',
    email: '',
    direccion: '',
    estado_vital: 1,
    estado_activo_parroquia: 1,
    id_sector_parroquial: '',
    id_orden_religiosa: ''
  });

  useEffect(() => {
    const cargarPersona = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/personas/${numeroIdentidad}`);
        
        if (response.ok) {
          const data = await response.json();
          setPersona(data);
          
          const newFormData = {
            nombres: data.nombres || '',
            apellidos: data.apellidos || '',
            fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : '',
            sexo: data.sexo || '',
            telefono: data.telefono || '',
            email: data.email || '',
            direccion: data.direccion || '',
            estado_vital: data.estado_vital ?? 1,
            estado_activo_parroquia: data.estado_activo_parroquia ?? 1,
            id_sector_parroquial: data.id_sector_parroquial || '',
            id_orden_religiosa: data.id_orden_religiosa || ''
          };
          
          setFormData(newFormData);
        } else {
          const errorText = await response.text();
          console.error('Error en response:', errorText);
          await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo cargar la información de la persona. Status: ${response.status}`,
            confirmButtonColor: '#ef4444'
          });
          router.push('/personas');
        }
      } catch (error) {
        console.error('Error al cargar persona:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error de conexión al cargar la persona',
          confirmButtonColor: '#ef4444'
        });
        router.push('/personas');
      } finally {
        setLoading(false);
      }
    };

    const cargarSectores = async () => {
      try {
        const response = await fetch('/api/sectores');
        if (response.ok) {
          const data = await response.json();
          setSectores(data);
        }
      } catch (error) {
        console.error('Error al cargar sectores:', error);
      }
    };

    const cargarOrdenesReligiosas = async () => {
      try {
        const response = await fetch('/api/ordenes-religiosas');
        if (response.ok) {
          const data = await response.json();
          setOrdenesReligiosas(data);
        }
      } catch (error) {
        console.error('Error al cargar órdenes religiosas:', error);
      }
    };

    if (numeroIdentidad) {
      cargarPersona();
      cargarSectores();
      cargarOrdenesReligiosas();
    }
  }, [numeroIdentidad, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombres || !formData.apellidos || !formData.telefono) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos Requeridos',
        text: 'Por favor complete todos los campos obligatorios',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/personas/${numeroIdentidad}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id_parroquia: 3 // Parroquia Cristo Resucitado
        }),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La información de la persona se ha actualizado correctamente.',
          confirmButtonColor: '#10b981'
        });
        router.push(`/personas/${numeroIdentidad}`);
      } else {
        const errorData = await response.text();
        let errorMessage = 'Error al actualizar la persona';
        
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.details || parsedError.error || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }
        
        await Swal.fire({
          icon: 'error',
          title: 'Error al Actualizar',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSaving(false);
    }
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

  if (!persona) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-base-content/60">Persona no encontrada</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="btn btn-ghost btn-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                Editar Persona
              </h1>
              <p className="text-base-content/70">
                {persona.numero_identidad}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <form onSubmit={handleSubmit} className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Nombres *</span>
                  </label>
                  <input
                    type="text"
                    name="nombres"
                    className="input input-bordered w-full"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Apellidos *</span>
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    className="input input-bordered w-full"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Fecha de Nacimiento</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    className="input input-bordered w-full"
                    value={formData.fecha_nacimiento}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Sexo</span>
                  </label>
                  <select
                    name="sexo"
                    className="select select-bordered w-full"
                    value={formData.sexo}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Teléfono *</span>
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    className="input input-bordered w-full"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="input input-bordered w-full"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-medium">Dirección</span>
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    className="input input-bordered w-full"
                    value={formData.direccion}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Sector Parroquial</span>
                  </label>
                  <select
                    name="id_sector_parroquial"
                    className="select select-bordered w-full"
                    value={formData.id_sector_parroquial}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar sector...</option>
                    {sectores.map((sector: any) => (
                      <option key={sector.id_sector_parroquial} value={sector.id_sector_parroquial}>
                        {sector.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Orden Religiosa</span>
                  </label>
                  <select
                    name="id_orden_religiosa"
                    className="select select-bordered w-full"
                    value={formData.id_orden_religiosa}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar orden...</option>
                    {ordenesReligiosas.map((orden: any) => (
                      <option key={orden.id_orden_religiosa} value={orden.id_orden_religiosa}>
                        {orden.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Estado Vital</span>
                  </label>
                  <select
                    name="estado_vital"
                    className="select select-bordered w-full"
                    value={formData.estado_vital}
                    onChange={handleInputChange}
                  >
                    <option value={1}>Vivo</option>
                    <option value={0}>Fallecido</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Estado en Parroquia</span>
                  </label>
                  <select
                    name="estado_activo_parroquia"
                    className="select select-bordered w-full"
                    value={formData.estado_activo_parroquia}
                    onChange={handleInputChange}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="card-actions justify-end mt-6 pt-4 border-t border-base-300">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn btn-ghost"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}