'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  persona?: any;
}

interface FormData {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
  estado_civil: string;
  telefono: string;
  email: string;
  direccion: string;
  departamento_id: string | null;
  municipio_id: string | null;
  sector_id: string | null;
}

const initialFormData: FormData = {
  numero_identidad: '',
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  genero: '',
  estado_civil: '',
  telefono: '',
  email: '',
  direccion: '',
  departamento_id: null,
  municipio_id: null,
  sector_id: null,
};

export default function PersonaModal({ isOpen, onClose, onSuccess }: PersonaModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);

  const steps = [
    { id: 1, title: 'Información Personal' },
    { id: 2, title: 'Ubicación' },
    { id: 3, title: 'Contacto' },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setCurrentStep(1);
      cargarDepartamentos();
      cargarSectores();
    }
  }, [isOpen]);

  const cargarDepartamentos = async () => {
    try {
      const response = await fetch('/api/ubicacion/departamentos');
      if (response.ok) {
        const data = await response.json();
        setDepartamentos(data);
      }
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
    }
  };

  const cargarMunicipios = async (departamentoId: string) => {
    console.log('🏙️ Cargando municipios para departamento:', departamentoId);
    try {
      const response = await fetch(`/api/ubicacion/municipios?departamento=${departamentoId}`);
      console.log('📡 Respuesta municipios - Status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🏙️ Municipios recibidos:', data);
        setMunicipios(data);
      } else {
        console.error('❌ Error al cargar municipios - Status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error al cargar municipios:', error);
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

  useEffect(() => {
    console.log('🔄 Cambio en departamento_id:', formData.departamento_id);
    if (formData.departamento_id) {
      cargarMunicipios(formData.departamento_id);
    } else {
      console.log('🧹 Limpiando municipios');
      setMunicipios([]);
      setFormData(prev => ({ ...prev, municipio_id: null }));
    }
  }, [formData.departamento_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('📝 Input change:', { name, value });
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.numero_identidad && formData.nombres && formData.apellidos && 
                 formData.fecha_nacimiento && formData.genero);
      case 2:
        return !!(formData.departamento_id && formData.municipio_id);
      case 3:
        return !!formData.telefono;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 3 && validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'La persona se ha registrado correctamente.',
          showConfirmButton: true,
          confirmButtonText: 'OK',
          confirmButtonColor: '#22c55e'
        });

        onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Error desconocido al registrar la persona';
        
        await Swal.fire({
          icon: 'error',
          title: 'Error al Registrar',
          text: errorMessage,
          showConfirmButton: true,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#ef4444'
        });
      }
      
    } catch (error) {
      console.error('Error en la petición:', error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Error al Registrar',
        text: 'Error de conexión. Intente nuevamente.',
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ef4444'
      });
      
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold">Información Personal</h3>
              <p className="text-sm text-base-content/60 mt-2">Complete los datos básicos de la persona</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label" htmlFor="numero_identidad">
                  <span className="label-text font-medium">Número de Identidad *</span>
                </label>
                <input
                  id="numero_identidad"
                  type="text"
                  name="numero_identidad"
                  placeholder="0801-1990-12345"
                  className="input input-bordered w-full"
                  value={formData.numero_identidad}
                  onChange={handleInputChange}
                  maxLength={15}
                />
                <div className="label">
                  <span className="label-text-alt text-xs">Formato: 0000-0000-00000</span>
                </div>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="genero">
                  <span className="label-text font-medium">Género *</span>
                </label>
                <select
                  id="genero"
                  name="genero"
                  className="select select-bordered w-full"
                  value={formData.genero}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>Seleccione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="nombres">
                  <span className="label-text font-medium">Nombres *</span>
                </label>
                <input
                  id="nombres"
                  type="text"
                  name="nombres"
                  placeholder="Juan Carlos"
                  className="input input-bordered w-full"
                  value={formData.nombres}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="apellidos">
                  <span className="label-text font-medium">Apellidos *</span>
                </label>
                <input
                  id="apellidos"
                  type="text"
                  name="apellidos"
                  placeholder="García López"
                  className="input input-bordered w-full"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="fecha_nacimiento">
                  <span className="label-text font-medium">Fecha de Nacimiento *</span>
                </label>
                <input
                  id="fecha_nacimiento"
                  type="date"
                  name="fecha_nacimiento"
                  className="input input-bordered w-full"
                  value={formData.fecha_nacimiento}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="estado_civil">
                  <span className="label-text font-medium">Estado Civil</span>
                </label>
                <select
                  id="estado_civil"
                  name="estado_civil"
                  className="select select-bordered w-full"
                  value={formData.estado_civil}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>Seleccione...</option>
                  <option value="Soltero">Soltero</option>
                  <option value="Casado">Casado</option>
                  <option value="Divorciado">Divorciado</option>
                  <option value="Viudo">Viudo</option>
                  <option value="Unión libre">Unión libre</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold">Ubicación</h3>
              <p className="text-sm text-base-content/60 mt-2">Seleccione la ubicación geográfica</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label" htmlFor="departamento_id">
                  <span className="label-text font-medium">Departamento *</span>
                </label>
                <select
                  id="departamento_id"
                  name="departamento_id"
                  className="select select-bordered w-full"
                  value={formData.departamento_id || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccione departamento...</option>
                  {departamentos.map((dept) => (
                    <option key={dept.codigo_departamento} value={dept.codigo_departamento}>
                      {dept.nombre_departamento}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="municipio_id">
                  <span className="label-text font-medium">Municipio *</span>
                </label>
                <select
                  id="municipio_id"
                  name="municipio_id"
                  className="select select-bordered w-full"
                  value={formData.municipio_id || ''}
                  onChange={handleInputChange}
                  disabled={!formData.departamento_id}
                >
                  <option value="">
                    {!formData.departamento_id ? 'Primero seleccione departamento' : 'Seleccione municipio...'}
                  </option>
                  {municipios.map((mun) => (
                    <option key={mun.codigo_municipio} value={mun.codigo_municipio}>
                      {mun.nombre_municipio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control md:col-span-2">
                <label className="label" htmlFor="sector_id">
                  <span className="label-text font-medium">Sector Parroquial</span>
                </label>
                <select
                  id="sector_id"
                  name="sector_id"
                  className="select select-bordered w-full"
                  value={formData.sector_id || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccione sector...</option>
                  {sectores.map((sector) => (
                    <option key={sector.id_sector_parroquial} value={sector.id_sector_parroquial}>
                      {sector.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold">Información de Contacto</h3>
              <p className="text-sm text-base-content/60 mt-2">Datos para comunicarse con la persona</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label" htmlFor="telefono">
                  <span className="label-text font-medium">Teléfono *</span>
                </label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  placeholder="98765432"
                  className="input input-bordered w-full"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  maxLength={8}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text font-medium">Correo Electrónico</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="correo@ejemplo.com"
                  className="input input-bordered w-full"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label" htmlFor="direccion">
                  <span className="label-text font-medium">Dirección</span>
                </label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  placeholder="Colonia, barrio, calle, casa"
                  className="input input-bordered w-full"
                  value={formData.direccion}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <h2 className="text-2xl font-bold">Nueva Persona</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-square">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 bg-base-100">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id 
                    ? 'bg-primary text-primary-content' 
                    : 'bg-base-300 text-base-content/60'
                  }
                `}>
                  {step.id}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary' : 'text-base-content/60'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {step.id < steps.length && (
                  <div className={`hidden sm:block w-12 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-base-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-base-300">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevStep}
              className="btn btn-outline"
              disabled={currentStep === 1}
            >
              Anterior
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="btn btn-primary"
                disabled={!validateStep(currentStep)}
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={!validateStep(3) || loading}
              >
                {loading ? 'Guardando...' : 'Guardar Persona'}
              </button>
            )}
          </div>

          <div className="text-sm text-base-content/60">
            Paso {currentStep} de {steps.length}
          </div>
        </div>
      </div>
    </div>
  );
}