'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  DocumentCheckIcon, 
  HeartIcon, 
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

interface ParroquiaData {
  parroquia: {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    config: {
      alias_liturgico: string;
      tz: string;
      idioma: string;
      opciones: Record<string, unknown>;
    } | null;
  };
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    telefono: string;
  };
}

interface DashboardStats {
  totalPersonas: number;
  totalBautismos: number;
  totalPrimerasComuniones: number;
  totalConfirmaciones: number;
  totalMatrimonios: number;
  totalUsuarios: number;
  usuariosActivos: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [parroquiaData, setParroquiaData] = useState<ParroquiaData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPersonas: 0,
    totalBautismos: 0,
    totalPrimerasComuniones: 0,
    totalConfirmaciones: 0,
    totalMatrimonios: 0,
    totalUsuarios: 0,
    usuariosActivos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/dashboard?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setParroquiaData(data.parroquiaData);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session?.user?.id]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 dark:border-red-400"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statsCards = [
    {
      name: 'Total Personas',
      value: stats.totalPersonas,
      icon: UsersIcon,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      name: 'Bautismos',
      value: stats.totalBautismos,
      icon: BookOpenIcon,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      name: 'Primeras Comuniones',
      value: stats.totalPrimerasComuniones,
      icon: DocumentCheckIcon,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      name: 'Confirmaciones',
      value: stats.totalConfirmaciones,
      icon: ClipboardDocumentListIcon,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      name: 'Matrimonios',
      value: stats.totalMatrimonios,
      icon: HeartIcon,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      name: 'Usuarios del Sistema',
      value: stats.totalUsuarios,
      icon: ShieldCheckIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  const quickActions = [
    {
      name: 'Registrar Bautismo',
      description: 'Nuevo registro de bautismo',
      href: '/bautismos/nuevo',
      icon: BookOpenIcon,
      color: 'bg-success hover:bg-success/80'
    },
    {
      name: 'Nueva Persona',
      description: 'Registrar nueva persona',
      href: '/personas/nueva',
      icon: UsersIcon,
      color: 'bg-info hover:bg-info/80'
    },
    {
      name: 'Primera Comunión',
      description: 'Registrar primera comunión',
      href: '/primera-comunion/nueva',
      icon: DocumentCheckIcon,
      color: 'bg-warning hover:bg-warning/80'
    },
    {
      name: 'Generar Constancia',
      description: 'Emitir constancia sacramental',
      href: '/constancias/nueva',
      icon: ClipboardDocumentListIcon,
      color: 'bg-secondary hover:bg-secondary/80'
    },
    {
      name: 'Gestionar Usuarios',
      description: 'Administrar usuarios del sistema',
      href: '/usuarios',
      icon: ShieldCheckIcon,
      color: 'bg-primary hover:bg-primary/80'
    }
  ];

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          setSidebarOpen={setSidebarOpen} 
          parroquiaNombre={parroquiaData?.parroquia?.nombre}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome section */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content mb-2">
                ¡Bienvenido, {session.user.name}!
              </h1>
              <p className="text-base-content/70 text-sm sm:text-base">
                {parroquiaData?.parroquia?.config?.alias_liturgico || parroquiaData?.parroquia?.nombre}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {statsCards.map((stat) => (
                <div
                  key={stat.name}
                  className="bg-base-100 rounded-lg sm:rounded-xl shadow-sm border border-base-300 p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-base-content/60 truncate">
                        {stat.name}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-base-content mt-1">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-sm border border-base-300 p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-base sm:text-lg font-semibold text-base-content mb-4">
                Acciones Rápidas
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => router.push(action.href)}
                    className="flex flex-col items-center p-3 sm:p-6 bg-base-200 rounded-lg hover:bg-base-300 transition-colors group"
                  >
                    <div className={`p-2 sm:p-3 rounded-lg ${action.color} text-white mb-2 sm:mb-3 group-hover:scale-105 transition-transform`}>
                      <action.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-base-content text-center leading-tight">
                      {action.name}
                    </h3>
                    <p className="text-xs text-base-content/60 text-center mt-1 hidden sm:block">
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent activity placeholder */}
            <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-sm border border-base-300 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-base-content">
                  Actividad Reciente
                </h2>
                <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Ver todo
                </button>
              </div>
              <div className="text-center py-8 sm:py-12">
                <p className="text-base-content/60 text-sm sm:text-base">
                  No hay actividad reciente para mostrar
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
