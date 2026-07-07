'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  CogIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ClockIcon,
  LanguageIcon,
  PaintBrushIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ParroquiaConfig {
  id_parroquia: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ubicacion?: string;
  municipio?: {
    nombre_municipio: string;
    departamento: {
      nombre_departamento: string;
    };
  };
  config?: {
    alias_liturgico?: string;
    logo_url?: string;
    sello_digital_url?: string;
    tz?: string;
    idioma?: string;
    opciones?: {
      pie_constancia?: string;
    };
  };
}

export default function ConfiguracionGeneral() {
  const [config, setConfig] = useState<ParroquiaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    parroquia: {
      id_parroquia: 0,
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      ubicacion: ''
    },
    configuracion: {
      alias_liturgico: '',
      logo_url: '',
      sello_digital_url: '',
      tz: 'America/Tegucigalpa',
      idioma: 'es',
      opciones: {
        pie_constancia: 'En el nombre del Padre, del Hijo y del Espíritu Santo'
      }
    }
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/general');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        
        // Actualizar formulario con datos cargados
        setFormData({
          parroquia: {
            id_parroquia: data.id_parroquia,
            nombre: data.nombre || '',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            email: data.email || '',
            ubicacion: data.ubicacion || ''
          },
          configuracion: {
            alias_liturgico: data.config?.alias_liturgico || '',
            logo_url: data.config?.logo_url || '',
            sello_digital_url: data.config?.sello_digital_url || '',
            tz: data.config?.tz || 'America/Tegucigalpa',
            idioma: data.config?.idioma || 'es',
            opciones: {
              pie_constancia: data.config?.opciones?.pie_constancia || 'En el nombre del Padre, del Hijo y del Espíritu Santo'
            }
          }
        });

        // Establecer preview del logo si existe
        if (data.config?.logo_url) {
          setLogoPreview(data.config.logo_url);
        }
      }
    } catch (error) {
      logger.error('Error al cargar configuración:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al cargar',
        text: 'No se pudo cargar la configuración de la parroquia',
        confirmButtonColor: '#590202'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch('/api/configuracion/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedData = await response.json();

        setConfig(updatedData);
        
        // Actualizar formData con los datos guardados
        setFormData({
          parroquia: {
            id_parroquia: updatedData.id_parroquia,
            nombre: updatedData.nombre || '',
            direccion: updatedData.direccion || '',
            telefono: updatedData.telefono || '',
            email: updatedData.email || '',
            ubicacion: updatedData.ubicacion || ''
          },
          configuracion: {
            alias_liturgico: updatedData.config?.alias_liturgico || '',
            logo_url: updatedData.config?.logo_url || '',
            sello_digital_url: updatedData.config?.sello_digital_url || '',
            tz: updatedData.config?.tz || 'America/Tegucigalpa',
            idioma: updatedData.config?.idioma || 'es',
            opciones: {
              pie_constancia: updatedData.config?.opciones?.pie_constancia || 'En el nombre del Padre, del Hijo y del Espíritu Santo'
            }
          }
        });

        // Actualizar preview del logo
        if (updatedData.config?.logo_url) {
          setLogoPreview(updatedData.config.logo_url);
        }

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        // Forzar recarga del layout para actualizar el navbar
        window.dispatchEvent(new Event('parroquiaConfigUpdated'));
        
        // SweetAlert de éxito
        await Swal.fire({
          icon: 'success',
          title: '¡Guardado!',
          text: 'La configuración se guardó correctamente',
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
          text: errorData.error || 'No se pudo guardar la configuración',
          confirmButtonColor: '#590202'
        });
      }
    } catch (error) {
      logger.error('Error al guardar configuración:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al guardar la configuración',
        confirmButtonColor: '#590202'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    if (name.startsWith('parroquia.')) {
      const field = name.replace('parroquia.', '');
      setFormData(prev => ({
        ...prev,
        parroquia: {
          ...prev.parroquia,
          [field]: value
        }
      }));
    } else if (name.startsWith('configuracion.')) {
      const field = name.replace('configuracion.', '');
      setFormData(prev => ({
        ...prev,
        configuracion: {
          ...prev.configuracion,
          [field]: value
        }
      }));
    } else if (name.startsWith('opciones.')) {
      const field = name.replace('opciones.', '');
      setFormData(prev => ({
        ...prev,
        configuracion: {
          ...prev.configuracion,
          opciones: {
            ...prev.configuracion.opciones,
            [field]: type === 'checkbox' ? checked : value
          }
        }
      }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);

      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const logoUrl = data.url;

        // Actualizar preview
        setLogoPreview(logoUrl);

        // Actualizar formData
        setFormData(prev => ({
          ...prev,
          configuracion: {
            ...prev.configuracion,
            logo_url: logoUrl
          }
        }));

        // SweetAlert de éxito
        await Swal.fire({
          icon: 'success',
          title: 'Logo subido',
          text: 'El logo se subió correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        const errorData = await response.json();
        await Swal.fire({
          icon: 'error',
          title: 'Error al subir',
          text: errorData.error || 'No se pudo subir el logo',
          confirmButtonColor: '#590202'
        });
      }
    } catch (error) {
      logger.error('Error al subir logo:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al subir el logo',
        confirmButtonColor: '#590202'
      });
    } finally {
      setUploadingLogo(false);
    }
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CogIcon className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Configuración General
                </h1>
              </div>
              {success && (
                <div className="alert alert-success shadow-lg w-auto">
                  <CheckIcon className="h-6 w-6" />
                  <span>Configuración guardada exitosamente</span>
                </div>
              )}
            </div>
            <p className="text-base-content/70 text-sm sm:text-base">
              Administra la información general de tu parroquia y configuraciones del sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de la Parroquia */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-6">
                <div className="flex items-center mb-6">
                  <BuildingOfficeIcon className="h-6 w-6 text-primary mr-3" />
                  <h2 className="text-xl font-semibold text-base-content">Información de la Parroquia</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Primera fila - Nombre (ancho completo) */}
                  <div className="form-control w-full">
                    <label className="label" htmlFor="nombre">
                      <span className="label-text font-medium">Nombre de la Parroquia *</span>
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      name="parroquia.nombre"
                      value={formData.parroquia.nombre}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Ej: Parroquia San José"
                      required
                    />
                  </div>

                  {/* Segunda fila - Teléfono y Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label" htmlFor="telefono">
                        <span className="label-text font-medium">Teléfono</span>
                      </label>
                      <div className="relative">
                        <PhoneIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
                        <input
                          id="telefono"
                          type="tel"
                          name="parroquia.telefono"
                          value={formData.parroquia.telefono}
                          onChange={handleInputChange}
                          className="input input-bordered w-full pl-10"
                          placeholder="+504 2222-3333"
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label" htmlFor="email">
                        <span className="label-text font-medium">Correo Electrónico</span>
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
                        <input
                          id="email"
                          type="email"
                          name="parroquia.email"
                          value={formData.parroquia.email}
                          onChange={handleInputChange}
                          className="input input-bordered w-full pl-10"
                          placeholder="parroquia@ejemplo.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tercera fila - Ubicación */}
                  <div className="form-control">
                    <label className="label" htmlFor="ubicacion">
                      <span className="label-text font-medium">Código de Ubicación (Municipio)</span>
                    </label>
                    <div className="relative">
                      <MapPinIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
                      <input
                        id="ubicacion"
                        type="text"
                        name="parroquia.ubicacion"
                        value={formData.parroquia.ubicacion}
                        onChange={handleInputChange}
                        className="input input-bordered w-full pl-10"
                        placeholder="Ej: 0801 (Distrito Central)"
                      />
                    </div>
                    <div className="label">
                      <span className="label-text-alt text-base-content/60">
                        Código del municipio según división territorial de Honduras
                      </span>
                    </div>
                  </div>

                  {/* Cuarta fila - Dirección */}
                  <div className="form-control">
                    <label className="label" htmlFor="direccion">
                      <span className="label-text font-medium">Dirección Completa</span>
                    </label>
                    <textarea
                      id="direccion"
                      name="parroquia.direccion"
                      value={formData.parroquia.direccion}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full"
                      rows={3}
                      placeholder="Dirección completa de la parroquia..."
                    />
                  </div>

                  {/* Información de ubicación actual */}
                  {config?.municipio && (
                    <div className="alert alert-info">
                      <MapPinIcon className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">Ubicación Actual</div>
                        <div className="text-sm">
                          {config.municipio.nombre_municipio}, {config.municipio.departamento.nombre_departamento}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Configuración Litúrgica */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-6">
                <div className="flex items-center mb-6">
                  <GlobeAltIcon className="h-6 w-6 text-primary mr-3" />
                  <h2 className="text-xl font-semibold text-base-content">Configuración Litúrgica</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Primera fila - Nombre Litúrgico (ancho completo) */}
                  <div className="form-control w-full">
                    <label className="label" htmlFor="alias_liturgico">
                      <span className="label-text font-medium">Nombre Litúrgico</span>
                    </label>
                    <input
                      id="alias_liturgico"
                      type="text"
                      name="configuracion.alias_liturgico"
                      value={formData.configuracion.alias_liturgico}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Ej: Parroquia San José - Tegucigalpa"
                    />
                    <div className="label">
                      <span className="label-text-alt text-base-content/60">
                        Nombre que aparecerá en documentos oficiales y constancias
                      </span>
                    </div>
                  </div>

                  {/* Segunda fila - Zona horaria e idioma */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label" htmlFor="tz">
                        <span className="label-text font-medium">Zona Horaria</span>
                      </label>
                      <div className="relative">
                        <ClockIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
                        <select
                          id="tz"
                          name="configuracion.tz"
                          value={formData.configuracion.tz}
                          onChange={handleInputChange}
                          className="select select-bordered w-full pl-10"
                        >
                          <option value="America/Tegucigalpa">América/Tegucigalpa (UTC-6)</option>
                          <option value="America/Guatemala">América/Guatemala (UTC-6)</option>
                          <option value="America/El_Salvador">América/El_Salvador (UTC-6)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label" htmlFor="idioma">
                        <span className="label-text font-medium">Idioma del Sistema</span>
                      </label>
                      <div className="relative">
                        <LanguageIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
                        <select
                          id="idioma"
                          name="configuracion.idioma"
                          value={formData.configuracion.idioma}
                          onChange={handleInputChange}
                          className="select select-bordered w-full pl-10"
                        >
                          <option value="es">Español</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo de la Parroquia */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-6">
                <div className="flex items-center mb-6">
                  <PaintBrushIcon className="h-6 w-6 text-primary mr-3" />
                  <h2 className="text-xl font-semibold text-base-content">Logo de la Parroquia</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Logo de la Parroquia */}
                  <div className="form-control">
                    <div className="label">
                      <span className="label-text font-medium">Logo de la Parroquia</span>
                      <span className="label-text-alt text-base-content/60">Opcional</span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Preview del logo */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center bg-base-200 relative overflow-hidden">
                          {logoPreview ? (
                            <Image 
                              src={logoPreview} 
                              alt="Logo de la parroquia" 
                              fill
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="text-center text-base-content/40 text-sm">
                              Sin logo
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload de archivo */}
                      <div className="flex-1">
                        <input
                          type="file"
                          id="logo_file"
                          accept="image/*"
                          className="file-input file-input-bordered w-full"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                        <div className="mt-2">
                          <p className="text-sm text-base-content/60">
                            Este logo aparecerá en el navbar del sistema y en los documentos oficiales.
                          </p>
                          <p className="text-xs text-base-content/50 mt-1">
                            Formatos: JPG, PNG, GIF, WEBP, SVG (máximo 2MB)
                          </p>
                        </div>
                        {uploadingLogo && (
                          <div className="mt-2 flex items-center space-x-2 text-sm">
                            <span className="loading loading-spinner loading-sm"></span>
                            <span>Subiendo logo...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pie de constancias */}
                  <div className="form-control">
                    <label className="label" htmlFor="pie_constancia">
                      <span className="label-text font-medium">Pie de Constancias y Certificados</span>
                    </label>
                    <textarea
                      id="pie_constancia"
                      name="opciones.pie_constancia"
                      value={formData.configuracion.opciones.pie_constancia}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full"
                      rows={3}
                      placeholder="Texto que aparece al final de las constancias..."
                    />
                    <div className="label">
                      <span className="label-text-alt text-base-content/60">
                        Mensaje que aparecerá al final de todos los certificados y constancias
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <div>
                    <h3 className="text-lg font-semibold text-base-content">¿Listo para guardar?</h3>
                    <p className="text-sm text-base-content/60">
                      Los cambios se aplicarán inmediatamente al sistema
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={cargarConfiguracion}
                      className="btn btn-ghost"
                      disabled={saving}
                    >
                      Descartar Cambios
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary min-w-[160px]"
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="flex items-center space-x-2">
                          <span className="loading loading-spinner loading-sm"></span>
                          <span>Guardando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckIcon className="h-5 w-5" />
                          <span>Guardar Configuración</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}