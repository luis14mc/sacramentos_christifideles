'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '@/hooks/usePermissions';
import { getFilteredNavigation } from '@/config/navigation';

interface SidebarProps {
  readonly sidebarOpen: boolean;
  readonly setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const permissions = usePermissions();

  const navigation = getFilteredNavigation(permissions);

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
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-base-100 border-r border-base-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/marca/CF_LOGO.png"
              alt="ChristiFideles"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="font-bold text-lg text-primary">ChristiFideles</span>
          </div>
          <button
            className="lg:hidden p-1 rounded-md text-base-content/60 hover:text-base-content hover:bg-base-200"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar sidebar"
            type="button"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/' || pathname === '/dashboard'
                : pathname === item.href;
            const IconComponent = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-content font-semibold shadow-md'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <IconComponent
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-primary-content' : 'text-base-content/50 group-hover:text-base-content'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
