'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  parroquiaNombre?: string;
}

interface ParroquiaInfo {
  nombre: string;
  config?: {
    logo_url?: string;
  };
}

export default function AuthenticatedLayout({ 
  children, 
  parroquiaNombre 
}: AuthenticatedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parroquiaInfo, setParroquiaInfo] = useState<ParroquiaInfo | null>(null);

  // Cargar información de la parroquia
  useEffect(() => {
    const loadParroquiaInfo = async () => {
      try {
        const response = await fetch('/api/configuracion/general');
        if (response.ok) {
          const data = await response.json();
          setParroquiaInfo(data);
        }
      } catch (error) {
        console.error('Error cargando info de parroquia:', error);
      }
    };

    if (status === 'authenticated') {
      loadParroquiaInfo();
    }

    // Escuchar evento de actualización de configuración
    const handleConfigUpdate = () => {
      loadParroquiaInfo();
    };

    window.addEventListener('parroquiaConfigUpdated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('parroquiaConfigUpdated', handleConfigUpdate);
    };
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cerrar sidebar en desktop cuando se redimensiona la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, setSidebarOpen]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          setSidebarOpen={setSidebarOpen} 
          parroquiaNombre={parroquiaNombre || parroquiaInfo?.nombre}
          parroquiaLogo={parroquiaInfo?.config?.logo_url}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
