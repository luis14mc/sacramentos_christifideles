'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function InstallationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Datos de la parroquia
    nombreParroquia: '',
    direccion: '',
    telefono: '',
    email: '',
    municipio: '0801', // Distrito Central por defecto
    
    // Datos del administrador
    nombreAdmin: '',
    emailAdmin: '',
    passwordAdmin: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.passwordAdmin !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setStep(3); // Paso de completado
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const error = await response.json();
        alert('Error en la instalación: ' + error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión durante la instalación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src="/assets/logos/CF_LOGO.png"
              alt="ChristiFideles"
              width={120}
              height={120}
              className="h-20 w-auto"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Configuración Inicial</h1>
          <p className="text-gray-600 text-lg">Sistema de Gestión Parroquial</p>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-red-800 mb-4">¡Bienvenido!</h2>
              <p className="text-gray-600">
                Es la primera vez que usas el sistema. Vamos a configurar tu parroquia 
                y crear tu usuario administrador.
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium"
              >
                Comenzar Configuración
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-red-800 mb-6 text-center">
              Configurar Parroquia
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos de la Parroquia */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Parroquia</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Parroquia *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombreParroquia}
                      onChange={(e) => setFormData({...formData, nombreParroquia: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Ej: Parroquia Cristo Resucitado"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="+504 2222-3333"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Dirección completa de la parroquia"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="contacto@parroquia.com"
                  />
                </div>
              </div>

              {/* Datos del Administrador */}
              <div className="bg-red-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Usuario Administrador</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombreAdmin}
                      onChange={(e) => setFormData({...formData, nombreAdmin: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Nombre del administrador"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.emailAdmin}
                      onChange={(e) => setFormData({...formData, emailAdmin: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="admin@parroquia.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.passwordAdmin}
                      onChange={(e) => setFormData({...formData, passwordAdmin: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Atrás
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Configurando...
                    </>
                  ) : (
                    'Completar Instalación'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 p-8 text-center">
            <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-green-800 mb-4">¡Instalación Completada!</h2>
            <p className="text-gray-600 mb-6">
              Tu parroquia ha sido configurada exitosamente. 
              Serás redirigido al login en unos segundos.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-medium">
                Ya puedes iniciar sesión con tus credenciales de administrador
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
