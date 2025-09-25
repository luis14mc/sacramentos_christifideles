'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import useTheme from '@/hooks/useTheme';
import {
    Bars3Icon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    CogIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
    readonly setSidebarOpen: (open: boolean) => void;
    readonly parroquiaNombre?: string;
}

export default function Header({ setSidebarOpen, parroquiaNombre }: HeaderProps) {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { theme, toggleTheme } = useTheme();
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-base-100 shadow-sm border-b border-base-300 h-16">
            <div className="flex items-center justify-between px-4 h-full">
                {/* Mobile menu button */}
                <div className="flex items-center">
                    <button
                        className="lg:hidden p-2 rounded-md text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Abrir menu"
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    {/* Parish name - only on desktop */}
                    <div className="hidden lg:block ml-4">
                        <h1 className="text-lg font-semibold text-base-content">
                            {parroquiaNombre || 'Sistema de Gestión Parroquial'}
                        </h1>
                    </div>
                </div>

                {/* Right side - Theme toggle and user menu */}
                <div className="flex items-center space-x-4">
                    {/* Parish name - mobile */}
                    <div className="lg:hidden">
                        <p className="text-sm font-medium text-base-content truncate max-w-32">
                            {parroquiaNombre}
                        </p>
                    </div>

                    {/* Theme toggle con DaisyUI */}
                    <label className="swap swap-rotate">
                        {/* checkbox oculto que controla el estado */}
                        <input 
                            type="checkbox" 
                            className="theme-controller" 
                            onChange={toggleTheme}
                            checked={theme === 'dark'}
                        />
                        
                        {/* ícono del sol */}
                        <svg className="swap-off h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
                        </svg>
                        
                        {/* ícono de la luna */}
                        <svg className="swap-on h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
                        </svg>
                    </label>

                    {/* User menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-base-200 transition-colors"
                        >
                            <div className="avatar">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-content relative">
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{lineHeight: '1'}}>
                                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-base-content">
                                    {session?.user?.name || 'Usuario'}
                                </p>
                                <p className="text-xs text-base-content/60 capitalize">
                                    {(session?.user as { rol?: string })?.rol || 'Sin rol'}
                                </p>
                            </div>
                        </button>

                        {/* Dropdown menu */}
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-base-100 rounded-lg shadow-lg ring-1 ring-base-300 z-50">
                                <div className="py-1">
                                    {/* User info */}
                                    <div className="px-4 py-3 border-b border-base-300">
                                        <p className="text-sm font-medium text-base-content">
                                            {session?.user?.name}
                                        </p>
                                        <p className="text-xs text-base-content/60">
                                            {session?.user?.email}
                                        </p>
                                        <p className="text-xs text-primary font-medium capitalize">
                                            Rol: {(session?.user as { rol?: string })?.rol || 'Sin rol'}
                                        </p>
                                    </div>

                                    {/* Menu items */}
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            // TODO: Navigate to profile
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-base-content hover:bg-base-200"
                                    >
                                        <UserCircleIcon className="mr-3 h-4 w-4" />
                                        Mi Perfil
                                    </button>

                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            // TODO: Navigate to settings
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-base-content hover:bg-base-200"
                                    >
                                        <CogIcon className="mr-3 h-4 w-4" />
                                        Configuración
                                    </button>

                                    <div className="border-t border-base-300">
                                        <button
                                            onClick={() => signOut({ callbackUrl: '/login' })}
                                            className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-error/10"
                                        >
                                            <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
