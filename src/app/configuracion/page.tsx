'use client';

import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { 
  CogIcon, 
  UsersIcon, 
  UserCircleIcon,
  HomeModernIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const configurationModules = [
  {
    name: 'Sacerdotes',
    description: 'Administrar sacerdotes, diáconos y religiosos',
    href: '/configuracion/sacerdotes',
    icon: UserCircleIcon,
    color: 'bg-primary hover:bg-primary/80',
    stats: '0 registrados'
  },
  {
    name: 'Grupos Parroquiales',
    description: 'Gestionar grupos y comunidades parroquiales',
    href: '/configuracion/grupos',
    icon: UsersIcon,
    color: 'bg-secondary hover:bg-secondary/80',
    stats: '0 grupos'
  },
  {
    name: 'Roles Parroquiales',
    description: 'Definir roles y responsabilidades',
    href: '/configuracion/roles',
    icon: ShieldCheckIcon,
    color: 'bg-accent hover:bg-accent/80',
    stats: '0 roles'
  },
  {
    name: 'Sectores Parroquiales',
    description: 'Organizar sectores y capillas',
    href: '/configuracion/sectores',
    icon: HomeModernIcon,
    color: 'bg-info hover:bg-info/80',
    stats: '0 sectores'
  }
];

export default function Configuracion() {
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center mb-4">
              <CogIcon className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                Configuración
              </h1>
            </div>
            <p className="text-base-content/70 text-sm sm:text-base">
              Administra la configuración de tu parroquia, desde sacerdotes hasta grupos parroquiales
            </p>
          </div>

          {/* Configuration modules grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {configurationModules.map((module) => (
              <button
                key={module.name}
                className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 hover:shadow-md transition-all duration-200 text-left w-full"
                onClick={() => router.push(module.href)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`p-3 rounded-lg ${module.color} text-white mr-4`}>
                        <module.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-base-content">
                          {module.name}
                        </h3>
                        <p className="text-sm text-base-content/60">
                          {module.stats}
                        </p>
                      </div>
                    </div>
                    <p className="text-base-content/70 text-sm mb-4">
                      {module.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(module.href);
                      }}
                      className={`btn btn-sm ${module.color.replace('bg-', 'btn-').replace(' hover:bg-', ' hover:btn-')} text-white`}
                    >
                      Administrar
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Additional info */}
          <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
                  <CogIcon className="w-4 h-4 text-info" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-info">
                  Configuración del Sistema
                </h3>
                <div className="mt-2 text-sm text-base-content/70">
                  <p>
                    Desde este módulo puedes gestionar todos los aspectos organizacionales de tu parroquia.
                    Asegúrate de tener los permisos necesarios para realizar cambios.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
