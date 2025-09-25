'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  HeartIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';

interface PersonaDetalle {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento?: string;
  sexo: string;
  telefono: string;
  email?: string;
  direccion?: string;
  estado_vital: number;
  estado_activo_parroquia: number;
  sector?: {
    nombre: string;
  };
  orden_religiosa?: {
    nombre: string;
  };
  municipio_nacimiento?: {
    nombre_municipio: string;
    departamento: {
      nombre_departamento: string;
    };
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  personaId: string | null;
  onEdit: (personaId: string) => void;
  onDelete: (personaId: string) => void;
}

export default function PersonaViewModal({ isOpen, onClose, personaId, onEdit, onDelete }: Props) {
  const [persona, setPersona] = useState<PersonaDetalle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && personaId) {
      cargarPersona();
    }
  }, [isOpen, personaId]);

  const cargarPersona = async () => {
    if (!personaId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/personas/${personaId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPersona(data);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información de la persona',
          confirmButtonColor: '#ef4444'
        });
        onClose();
      }
    } catch (error) {
      console.error('Error al cargar persona:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error de conexión al cargar la persona',
        confirmButtonColor: '#ef4444'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (personaId) {
      onClose();
      onEdit(personaId);
    }
  };

  const handleDelete = () => {
    if (personaId) {
      onClose();
      onDelete(personaId);
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = nacimiento.getMonth();
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const handleClose = () => {
    setPersona(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12 h-12 relative">
                <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold" style={{lineHeight: '1'}}>
                  {persona ? `${persona.nombres[0]}${persona.apellidos[0]}` : <UserIcon className="h-6 w-6" />}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">
                Detalles de Persona
              </h2>
              {persona && (
                <p className="text-base-content/70 text-sm">
                  {persona.numero_identidad}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        )}

        {/* Content */}
        {!loading && persona && (
          <div className="space-y-6">
            {/* Información Personal */}
            <div className="card bg-base-50 border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-base flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Información Personal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">Nombres</p>
                    <p className="font-semibold">{persona.nombres}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Apellidos</p>
                    <p className="font-semibold">{persona.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Sexo</p>
                    <p className="font-medium">
                      {persona.sexo === 'M' ? 'Masculino' : persona.sexo === 'F' ? 'Femenino' : 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Fecha de Nacimiento</p>
                    <div className="flex items-center gap-1">
                      <CalendarDaysIcon className="h-4 w-4 text-base-content/60" />
                      <span>{formatFecha(persona.fecha_nacimiento)}</span>
                      {persona.fecha_nacimiento && (
                        <span className="text-sm text-base-content/60">
                          ({getEdad(persona.fecha_nacimiento)} años)
                        </span>
                      )}
                    </div>
                  </div>
                  {persona.municipio_nacimiento && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-base-content/60">Lugar de Nacimiento</p>
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4 text-base-content/60" />
                        <span>
                          {persona.municipio_nacimiento.nombre_municipio}, 
                          {persona.municipio_nacimiento.departamento.nombre_departamento}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="card bg-base-50 border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-base flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-primary" />
                  Información de Contacto
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">Teléfono</p>
                    <div className="flex items-center gap-1">
                      <PhoneIcon className="h-4 w-4 text-base-content/60" />
                      <span className="font-medium">{persona.telefono}</span>
                    </div>
                  </div>
                  {persona.email && (
                    <div>
                      <p className="text-sm text-base-content/60">Email</p>
                      <div className="flex items-center gap-1">
                        <EnvelopeIcon className="h-4 w-4 text-base-content/60" />
                        <span className="font-medium">{persona.email}</span>
                      </div>
                    </div>
                  )}
                  {persona.direccion && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-base-content/60">Dirección</p>
                      <div className="flex items-start gap-1">
                        <MapPinIcon className="h-4 w-4 text-base-content/60 mt-0.5" />
                        <span className="font-medium">{persona.direccion}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información Parroquial */}
            <div className="card bg-base-50 border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-base flex items-center gap-2">
                  <BuildingLibraryIcon className="h-5 w-5 text-primary" />
                  Información Parroquial
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.sector && (
                    <div>
                      <p className="text-sm text-base-content/60">Sector Parroquial</p>
                      <p className="font-medium">{persona.sector.nombre}</p>
                    </div>
                  )}
                  {persona.orden_religiosa && (
                    <div>
                      <p className="text-sm text-base-content/60">Orden Religiosa</p>
                      <p className="font-medium">{persona.orden_religiosa.nombre}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-base-content/60">Estado Vital</p>
                    <div className="flex items-center gap-2">
                      <HeartIcon className={`h-4 w-4 ${persona.estado_vital === 1 ? 'text-success' : 'text-error'}`} />
                      <span className={`badge badge-sm ${persona.estado_vital === 1 ? 'badge-success' : 'badge-error'}`}>
                        {persona.estado_vital === 1 ? 'Vivo' : 'Fallecido'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Estado en Parroquia</p>
                    <div className="flex items-center gap-2">
                      <BuildingLibraryIcon className={`h-4 w-4 ${persona.estado_activo_parroquia === 1 ? 'text-success' : 'text-warning'}`} />
                      <span className={`badge badge-sm ${persona.estado_activo_parroquia === 1 ? 'badge-success' : 'badge-warning'}`}>
                        {persona.estado_activo_parroquia === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-action">
          <button
            onClick={handleClose}
            className="btn btn-ghost"
          >
            Cerrar
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-error gap-2"
            disabled={!persona}
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar
          </button>
          <button
            onClick={handleEdit}
            className="btn btn-primary gap-2"
            disabled={!persona}
          >
            <PencilSquareIcon className="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}