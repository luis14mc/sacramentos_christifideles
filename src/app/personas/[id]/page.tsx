'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  ArrowLeftIcon,
  UserIcon,
  PencilSquareIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  HomeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface PersonaDetalle {
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
  created_at: string;
  sector: {
    nombre: string;
  };
  orden_religiosa: {
    nombre: string;
  };
  municipio_nacimiento: {
    nombre_municipio: string;
    departamento: {
      nombre_departamento: string;
    };
  };
}

export default function DetallePersona() {
  const router = useRouter();
  const params = useParams();
  const numeroIdentidad = params.id as string;
  
  const [persona, setPersona] = useState<PersonaDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPersona = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/personas/${numeroIdentidad}`);
        if (response.ok) {
          const data = await response.json();
          setPersona(data);
        } else {
          router.push('/personas');
        }
      } catch (error) {
        console.error('Error al cargar persona:', error);
        router.push('/personas');
      } finally {
        setLoading(false);
      }
    };

    if (numeroIdentidad) {
      cargarPersona();
    }
  }, [numeroIdentidad, router]);

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
    
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoColor = () => {
    if (!persona) return 'badge-neutral';
    if (persona.estado_vital === 0) return 'badge-error';
    if (persona.estado_activo_parroquia === 0) return 'badge-warning';
    return 'badge-success';
  };

  const getEstadoTexto = () => {
    if (!persona) return 'Desconocido';
    if (persona.estado_vital === 0) return 'Fallecido';
    if (persona.estado_activo_parroquia === 0) return 'Inactivo';
    return 'Activo';
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
            <UserIcon className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/60">Persona no encontrada</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

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
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-content grid place-items-center mr-4">
                      <span className="text-xl font-bold">
                        {persona.nombres.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                      {persona.nombres} {persona.apellidos}
                    </h1>
                    <p className="text-base-content/70">
                      {persona.numero_identidad}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${getEstadoColor()}`}>
                    {getEstadoTexto()}
                  </span>
                  <button
                    onClick={() => router.push(`/personas/${numeroIdentidad}/editar`)}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información personal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <h2 className="card-title mb-4">Información Personal</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-base-content/60" />
                      <div>
                        <p className="text-sm text-base-content/60">Fecha de Nacimiento</p>
                        <p className="font-medium">
                          {formatearFecha(persona.fecha_nacimiento)}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {calcularEdad(persona.fecha_nacimiento)} años
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-base-content/60" />
                      <div>
                        <p className="text-sm text-base-content/60">Sexo</p>
                        <p className="font-medium">
                          {persona.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPinIcon className="h-5 w-5 text-base-content/60" />
                      <div>
                        <p className="text-sm text-base-content/60">Lugar de Nacimiento</p>
                        <p className="font-medium">
                          {persona.municipio_nacimiento.nombre_municipio}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {persona.municipio_nacimiento.departamento.nombre_departamento}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-base-content/60" />
                      <div>
                        <p className="text-sm text-base-content/60">Registrado</p>
                        <p className="font-medium">
                          {formatearFecha(persona.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <h2 className="card-title mb-4">Contacto</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="h-5 w-5 text-base-content/60" />
                      <div>
                        <p className="text-sm text-base-content/60">Teléfono</p>
                        <p className="font-medium">{persona.telefono}</p>
                      </div>
                    </div>

                    {persona.email && (
                      <div className="flex items-center gap-3">
                        <EnvelopeIcon className="h-5 w-5 text-base-content/60" />
                        <div>
                          <p className="text-sm text-base-content/60">Email</p>
                          <p className="font-medium">{persona.email}</p>
                        </div>
                      </div>
                    )}

                    {persona.direccion && (
                      <div className="flex items-start gap-3">
                        <HomeIcon className="h-5 w-5 text-base-content/60 mt-0.5" />
                        <div>
                          <p className="text-sm text-base-content/60">Dirección</p>
                          <p className="font-medium">{persona.direccion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Información parroquial */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <h2 className="card-title text-base mb-4">Información Parroquial</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-base-content/60 mb-1">Sector</p>
                      <div className="badge badge-outline">
                        {persona.sector.nombre}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-base-content/60 mb-1">Orden Religiosa</p>
                      <p className="text-sm font-medium">
                        {persona.orden_religiosa.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <h2 className="card-title text-base mb-4">Acciones</h2>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => router.push(`/personas/${numeroIdentidad}/editar`)}
                      className="btn btn-sm btn-outline w-full justify-start gap-2"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Editar Información
                    </button>
                    <button className="btn btn-sm btn-outline w-full justify-start gap-2">
                      <UserGroupIcon className="h-4 w-4" />
                      Ver Sacramentos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
