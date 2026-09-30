'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import {
  CogIcon,
  UsersIcon,
  UserCircleIcon,
  HomeModernIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface ConfigCard {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

const configurationModules: ConfigCard[] = [
  {
    name: 'Datos de la parroquia',
    description: 'Nombre, dirección, teléfono y párroco que firma las constancias',
    href: '/configuracion/parroquia',
    icon: BuildingLibraryIcon,
    color: 'bg-primary hover:bg-primary/80',
  },
  {
    name: 'Sectores y capillas',
    description: 'Organiza el territorio parroquial y las capillas',
    href: '/configuracion/sectores',
    icon: HomeModernIcon,
    color: 'bg-info hover:bg-info/80',
  },
  {
    name: 'Constancias',
    description: 'Plantillas de texto y moldes PDF por sacramento',
    href: '/configuracion/constancias',
    icon: DocumentTextIcon,
    color: 'bg-warning hover:bg-warning/80',
  },
  {
    name: 'Órdenes religiosas',
    description: 'Catálogo diocesano, salesiano, franciscano y otras órdenes',
    href: '/configuracion/ordenes-religiosas',
    icon: UsersIcon,
    color: 'bg-secondary hover:bg-secondary/80',
  },
  {
    name: 'Rangos sacerdotales',
    description: 'Catálogo de diácono, presbítero, obispo y demás rangos',
    href: '/configuracion/rangos-sacerdotales',
    icon: UserCircleIcon,
    color: 'bg-accent hover:bg-accent/80',
  },
];

export default function Configuracion() {
  const [sectoresCount, setSectoresCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/configuracion/sectores')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSectoresCount(Array.isArray(d) ? d.length : null))
      .catch(() => setSectoresCount(null));
  }, []);

  const statsLabel = (key: string) => {
    if (key === 'Sectores y capillas') {
      return sectoresCount === null ? null : `${sectoresCount} sectores`;
    }
    return null;
  };

  return (
    <AuthenticatedLayout>
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center mb-4">
              <CogIcon className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                Configuración
              </h1>
            </div>
            <p className="text-base-content/70 text-sm sm:text-base">
              Administra los catálogos y la configuración de tu parroquia
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {configurationModules.map((module) => {
              const stats = statsLabel(module.name);
              return (
                <Link
                  key={module.name}
                  href={module.href}
                  className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 hover:shadow-md transition-all duration-200 text-left w-full"
                >
                  <div className="flex items-center mb-3">
                    <div className={`p-3 rounded-lg ${module.color} text-white mr-4`}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-base-content">
                        {module.name}
                      </h3>
                      {stats && (
                        <p className="text-sm text-base-content/60">{stats}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-base-content/70 text-sm">
                    {module.description}
                  </p>
                </Link>
              );
            })}
          </div>

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
                    Desde este módulo puedes gestionar los aspectos organizacionales de tu parroquia.
                    Asegúrate de tener los permisos necesarios para realizar cambios.
                  </p>
                </div>
              </div>
            </div>
          </div>
    </AuthenticatedLayout>
  );
}