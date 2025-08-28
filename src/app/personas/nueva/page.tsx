'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  ArrowLeftIcon,
  UserPlusIcon 
} from '@heroicons/react/24/outline';

interface Departamento {
  codigo_departamento: string;
  nombre_departamento: string;
}

interface Municipio {
  codigo_municipio: string;
  nombre_municipio: string;
  codigo_departamento: string;
}

interface SectorParroquial {
  id_sector_parroquial: string;
  nombre: string;
}

interface OrdenReligiosa {
  id_orden_religiosa: number;
  nombre: string;
}

export default function NuevaPersona() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [sectores, setSectores] = useState<SectorParroquial[]>([]);
  const [ordenesReligiosas, setOrdenesReligiosas] = useState<OrdenReligiosa[]>([]);
  
  const [formData, setFormData] = useState({
    numero_identidad: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    lugar_nacimiento: '',
    sexo: '',
    telefono: '',
    email: '',
    direccion: '',
    id_sector_parroquial: '',
    id_orden_religiosa: '',
    otra_orden_religiosa: '',
    estado_vital: 1,
    estado_activo_parroquia: 1
  });

  const [selectedDepartamento, setSelectedDepartamento] = useState('');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar departamentos
      const depResponse = await fetch('/api/ubicacion/departamentos');
      if (depResponse.ok) {
        const departamentosData = await depResponse.json();
        setDepartamentos(departamentosData);
      }

      // Cargar sectores parroquiales
      const sectResponse = await fetch('/api/sectores');
      if (sectResponse.ok) {
        const sectoresData = await sectResponse.json();
        setSectores(sectoresData);
      }

      // Cargar órdenes religiosas
      const ordResponse = await fetch('/api/ordenes-religiosas');
      if (ordResponse.ok) {
        const ordenesData = await ordResponse.json();
        setOrdenesReligiosas(ordenesData);
      }
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  const cargarMunicipios = async (codigoDepartamento: string) => {
    try {
      const response = await fetch(`/api/ubicacion/municipios?departamento=${codigoDepartamento}`);
      if (response.ok) {
        const municipiosData = await response.json();
        setMunicipios(municipiosData);
      }
    } catch (error) {
      console.error('Error al cargar municipios:', error);
    }
  };

  const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const codigoDepartamento = e.target.value;
    setSelectedDepartamento(codigoDepartamento);
    setFormData({...formData, lugar_nacimiento: ''});
    setMunicipios([]);
    
    if (codigoDepartamento) {
      cargarMunicipios(codigoDepartamento);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id_parroquia: 1, // Se asignará dinámicamente en el backend según la sesión
          id_sector_parroquial: parseInt(formData.id_sector_parroquial),
          id_orden_religiosa: parseInt(formData.id_orden_religiosa)
        }),
      });

      if (response.ok) {
        router.push('/personas');
      } else {
        const errorData = await response.json();
        console.error('Error al crear persona:', errorData);
        alert('Error al crear la persona. Revise los datos e intente nuevamente.');
      }
    } catch (error) {
      console.error('Error al crear persona:', error);
      alert('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="btn btn-ghost btn-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div className="flex items-center">
              <UserPlusIcon className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Nueva Persona
                </h1>
                <p className="text-base-content/70 text-sm">
                  Registrar una nueva persona en la comunidad parroquial
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información personal */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Información Personal</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="numero_identidad">
                      <span className="label-text">Número de Identidad *</span>
                    </label>
                    <input
                      id="numero_identidad"
                      type="text"
                      name="numero_identidad"
                      placeholder="0000-0000-00000"
                      className="input input-bordered"
                      value={formData.numero_identidad}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="sexo">
                      <span className="label-text">Sexo *</span>
                    </label>
                    <select
                      id="sexo"
                      name="sexo"
                      className="select select-bordered"
                      value={formData.sexo}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="nombres">
                      <span className="label-text">Nombres *</span>
                    </label>
                    <input
                      id="nombres"
                      type="text"
                      name="nombres"
                      placeholder="Nombres completos"
                      className="input input-bordered"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="apellidos">
                      <span className="label-text">Apellidos *</span>
                    </label>
                    <input
                      id="apellidos"
                      type="text"
                      name="apellidos"
                      placeholder="Apellidos completos"
                      className="input input-bordered"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="fecha_nacimiento">
                      <span className="label-text">Fecha de Nacimiento *</span>
                    </label>
                    <input
                      id="fecha_nacimiento"
                      type="date"
                      name="fecha_nacimiento"
                      className="input input-bordered"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lugar de nacimiento */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Lugar de Nacimiento</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="departamento">
                      <span className="label-text">Departamento *</span>
                    </label>
                    <select
                      id="departamento"
                      className="select select-bordered"
                      value={selectedDepartamento}
                      onChange={handleDepartamentoChange}
                      required
                    >
                      <option value="">Seleccionar departamento</option>
                      {departamentos.map((dept) => (
                        <option key={dept.codigo_departamento} value={dept.codigo_departamento}>
                          {dept.nombre_departamento}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="lugar_nacimiento">
                      <span className="label-text">Municipio *</span>
                    </label>
                    <select
                      id="lugar_nacimiento"
                      name="lugar_nacimiento"
                      className="select select-bordered"
                      value={formData.lugar_nacimiento}
                      onChange={handleInputChange}
                      disabled={!selectedDepartamento}
                      required
                    >
                      <option value="">Seleccionar municipio</option>
                      {municipios.map((mun) => (
                        <option key={mun.codigo_municipio} value={mun.codigo_municipio}>
                          {mun.nombre_municipio}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Información de Contacto</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="telefono">
                      <span className="label-text">Teléfono *</span>
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      name="telefono"
                      placeholder="0000-0000"
                      className="input input-bordered"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="email">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="correo@ejemplo.com"
                      className="input input-bordered"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label" htmlFor="direccion">
                      <span className="label-text">Dirección</span>
                    </label>
                    <textarea
                      id="direccion"
                      name="direccion"
                      placeholder="Dirección completa"
                      className="textarea textarea-bordered h-20"
                      value={formData.direccion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información parroquial */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Información Parroquial</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="id_sector_parroquial">
                      <span className="label-text">Sector Parroquial *</span>
                    </label>
                    <select
                      id="id_sector_parroquial"
                      name="id_sector_parroquial"
                      className="select select-bordered"
                      value={formData.id_sector_parroquial}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar sector</option>
                      {sectores.map((sector) => (
                        <option key={sector.id_sector_parroquial} value={sector.id_sector_parroquial}>
                          {sector.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="id_orden_religiosa">
                      <span className="label-text">Orden Religiosa *</span>
                    </label>
                    <select
                      id="id_orden_religiosa"
                      name="id_orden_religiosa"
                      className="select select-bordered"
                      value={formData.id_orden_religiosa}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar orden</option>
                      {ordenesReligiosas.map((orden) => (
                        <option key={orden.id_orden_religiosa} value={orden.id_orden_religiosa}>
                          {orden.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label" htmlFor="otra_orden_religiosa">
                      <span className="label-text">Otra Orden Religiosa</span>
                    </label>
                    <input
                      id="otra_orden_religiosa"
                      type="text"
                      name="otra_orden_religiosa"
                      placeholder="Especificar si aplica"
                      className="input input-bordered"
                      value={formData.otra_orden_religiosa}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-outline flex-1"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  'Guardar Persona'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
