'use client';

import { useState, useEffect } from 'react';
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
  fecha_bautismo: string;
  fecha_primera_comunion: string;
  fecha_confirmacion: string;
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
  fecha_bautismo: '',
  fecha_primera_comunion: '',
  fecha_confirmacion: '',
};

export default function PersonaModal({ isOpen, onClose, onSuccess, persona }: PersonaModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);

  const steps = [
    { id: 1, title: 'Información Personal' },
    { id: 2, title: 'Ubicación' },
    { id: 3, title: 'Contacto' },
    { id: 4, title: 'Sacramentos' },
  ];

  // Debug: Log cuando cambia formData
  useEffect(() => {
    console.log('FormData updated:', formData);
  }, [formData]);

  useEffect(() => {
    if (persona) {
      setFormData(persona);
    } else {
      setFormData(initialFormData);
    }
    setCurrentStep(1);
  }, [persona, isOpen]);

  useEffect(() => {
    if (isOpen) {
      console.log('🚀 Modal abierto, cargando departamentos...');
      setLoadingDepartamentos(true);
      fetch('/api/ubicacion/departamentos')
        .then(res => {
          console.log('🌍 Respuesta departamentos:', res.status, res.ok);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('✅ Departamentos cargados:', data.length, 'items');
          if (data.length > 0) {
            console.log('🔍 Primer departamento:', data[0]);
            console.log('🔍 Keys del primer departamento:', Object.keys(data[0]));
          }
          setDepartamentos(data);
        })
        .catch(error => {
          console.error('❌ Error cargando departamentos:', error);
        })
        .finally(() => {
          setLoadingDepartamentos(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.departamento_id) {
      console.log('🏘️ Cargando municipios para departamento:', formData.departamento_id);
      // El departamento_id ya es el codigo_departamento
      fetch(`/api/ubicacion/municipios?departamento=${formData.departamento_id}`)
        .then(res => {
          console.log('📡 Respuesta municipios:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('🏘️ Municipios cargados:', data);
          setMunicipios(data);
        })
        .catch(error => {
          console.error('❌ Error cargando municipios:', error);
        });
    } else {
      console.log('🏘️ Limpiando municipios - no hay departamento seleccionado');
      setMunicipios([]);
      setFormData(prev => ({ ...prev, municipio_id: null }));
    }
  }, [formData.departamento_id]);

  useEffect(() => {
    // Cargar sectores parroquiales siempre (independiente de ubicación)
    console.log('🏛️ Cargando todos los sectores parroquiales');
    fetch(`/api/sectores`)
      .then(res => {
        console.log('📡 Respuesta sectores - Status:', res.status);
        console.log('📡 Respuesta sectores - OK:', res.ok);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('🏛️ Sectores cargados - Total:', data.length);
        console.log('🏛️ Sectores cargados - Data:', data);
        setSectores(data);
      })
      .catch(error => {
        console.error('❌ Error cargando sectores:', error);
      });
  }, []); // Sin dependencias - se carga una sola vez al abrir el modal

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    console.log('� SIMPLE CHANGE:', { name, value });
    
    // Para probar, mantener todo como string primero
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log('� NEW FORM DATA:', newData);
      return newData;
    });
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
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    try {
      console.log('🚀 Enviando datos:', formData);
      
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📡 Respuesta recibida - Status:', response.status);
      console.log('📡 Respuesta recibida - OK:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Persona guardada exitosamente:', result);
        onSuccess(result);
        onClose();
      } else {
        // Obtener el detalle del error del servidor
        const errorData = await response.text();
        console.error('❌ Error del servidor - Status:', response.status);
        console.error('❌ Error del servidor - Data:', errorData);
        
        let errorMessage = 'Error al guardar la persona';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.details || parsedError.error || errorMessage;
        } catch (e) {
          errorMessage = errorData || errorMessage;
        }
        
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error completo al guardar:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
                  <option value="">Seleccione...</option>
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
                  <option value="">Seleccione...</option>
                  <option value="Soltero">Soltero</option>
                  <option value="Casado">Casado</option>
                  <option value="Divorciado">Divorciado</option>
                  <option value="Viudo">Viudo</option>
                  <option value="Union Libre">Unión Libre</option>
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
              {/* Debug info */}
              <div className="text-xs text-gray-500 mt-2">
                Departamentos: {departamentos.length} | 
                Municipios: {municipios.length} | 
                Sectores: {sectores.length} |<br/>
                Selected Dept: {formData.departamento_id} |
                Selected Mun: {formData.municipio_id} |
                Selected Sec: {formData.sector_id}
              </div>
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
                  <option value="">Seleccione...</option>
                  {departamentos.length > 0 ? (
                    departamentos.map((dept, index) => (
                      <option key={`dept-${dept.codigo_departamento || index}`} value={dept.codigo_departamento}>
                        {dept.nombre_departamento || 'Departamento sin nombre'}
                      </option>
                    ))
                  ) : (
                    <option disabled>Cargando departamentos...</option>
                  )}
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
                  <option value="">Seleccione...</option>
                  {municipios.map((mun, index) => (
                    <option key={`mun-${mun.codigo_municipio || index}`} value={mun.codigo_municipio}>
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
                  <option value="">Seleccione...</option>
                  {sectores.map((sector, index) => (
                    <option key={`sector-${sector.id_sector_parroquial || index}`} value={sector.id_sector_parroquial?.toString()}>
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
              <p className="text-sm text-base-content/60 mt-2">Complete los datos de contacto</p>
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
                  placeholder="9876-5432"
                  className="input input-bordered w-full"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  maxLength={9}
                />
                <div className="label">
                  <span className="label-text-alt text-xs">Formato: 0000-0000</span>
                </div>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text font-medium">Correo Electrónico</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="juan.garcia@ejemplo.com"
                  className="input input-bordered w-full"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label" htmlFor="direccion">
                  <span className="label-text font-medium">Dirección Completa</span>
                </label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  placeholder="Colonia, calle, número de casa"
                  className="input input-bordered w-full"
                  value={formData.direccion}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold">Información de Sacramentos</h3>
              <p className="text-sm text-base-content/60 mt-2">Fechas de los sacramentos recibidos (opcional)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-control">
                <label className="label" htmlFor="fecha_bautismo">
                  <span className="label-text font-medium">Fecha de Bautismo</span>
                </label>
                <input
                  id="fecha_bautismo"
                  type="date"
                  name="fecha_bautismo"
                  className="input input-bordered w-full"
                  value={formData.fecha_bautismo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="fecha_primera_comunion">
                  <span className="label-text font-medium">Primera Comunión</span>
                </label>
                <input
                  id="fecha_primera_comunion"
                  type="date"
                  name="fecha_primera_comunion"
                  className="input input-bordered w-full"
                  value={formData.fecha_primera_comunion}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="fecha_confirmacion">
                  <span className="label-text font-medium">Confirmación</span>
                </label>
                <input
                  id="fecha_confirmacion"
                  type="date"
                  name="fecha_confirmacion"
                  className="input input-bordered w-full"
                  value={formData.fecha_confirmacion}
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
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] p-0 relative">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-center">Nueva Persona</h2>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle absolute top-4 right-4"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Steps */}
          <div className="steps w-full">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              let stepClasses = 'step ';
              if (isCompleted) {
                stepClasses += 'step-success';
              } else if (isCurrent) {
                stepClasses += 'step-primary';
              }

              return (
                <div key={`step-${step.id || index}`} className={stepClasses} data-content={isCompleted ? "✓" : step.id}>
                  <div className="text-xs font-medium">{step.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto" style={{ height: 'calc(90vh - 200px)' }}>
          <div className="max-w-3xl mx-auto">
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-base-100 border-t border-base-300 px-6 py-4">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn btn-outline min-w-[100px]"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-base-content/60 text-center">
                Paso {currentStep} de 4
              </div>
              <div className="w-32 bg-base-300 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="btn btn-primary min-w-[100px]"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!validateStep(4) || loading}
                className="btn btn-success min-w-[100px]"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <button 
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
    </div>
  );
}
