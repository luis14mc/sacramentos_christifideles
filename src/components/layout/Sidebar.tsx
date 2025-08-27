'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Personas', href: '/personas', icon: UsersIcon },
  { name: 'Bautismos', href: '/bautismos', icon: BookOpenIcon },
  { name: 'Primera Comunión', href: '/primera-comunion', icon: HeartIcon },
  { name: 'Confirmaciones', href: '/confirmaciones', icon: ClipboardDocumentListIcon },
  { name: 'Matrimonios', href: '/matrimonios', icon: HeartIcon },
  { name: 'Constancias', href: '/constancias', icon: DocumentTextIcon },
  { name: 'Reportes', href: '/reportes', icon: ChartBarIcon },
  { name: 'Configuración', href: '/configuracion', icon: CogIcon },
];

interface SidebarProps {
  readonly sidebarOpen: boolean;
  readonly setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  // Cerrar sidebar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden cursor-default"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSidebarOpen(false);
            }
          }}
          aria-label="Cerrar sidebar"
          tabIndex={-1}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-base-100 border-r border-base-300 z-30
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header del sidebar */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-base-300">
          <div className="flex items-center">
            <Image
              src="/assets/logos/CF_LOGO_LETRAS.png"
              alt="ChristiFideles"
              width={160}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </div>
          {/* Botón de cierre solo en móvil */}
          <button
            className="lg:hidden p-1 rounded-md text-base-content/60 hover:text-base-content hover:bg-base-200"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar sidebar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Cerrar sidebar en móvil después de navegar
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-content font-semibold'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive 
                    ? 'text-primary-content' 
                    : 'text-base-content/50 group-hover:text-base-content/70'
                }`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-base-300">
          <p className="text-xs text-base-content/60 text-center">
            Sistema de Gestión Parroquial v1.0
          </p>
        </div>
      </div>
    </>
  );
}
