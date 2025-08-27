import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  HeartIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline';

import { UserPermissions } from '@/hooks/usePermissions';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  requiredPermission?: keyof UserPermissions;
  roles?: string[]; // Roles específicos que pueden ver esta opción
}

// Configuración completa de navegación con permisos
export const navigationConfig: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: HomeIcon,
    requiredPermission: 'canViewDashboard'
  },
  { 
    name: 'Personas', 
    href: '/personas', 
    icon: UserIcon,
    requiredPermission: 'canViewPersonas'
  },
  { 
    name: 'Usuarios', 
    href: '/usuarios', 
    icon: ShieldCheckIcon,
    requiredPermission: 'canViewUsuarios'
  },
  { 
    name: 'Bautismos', 
    href: '/bautismos', 
    icon: BookOpenIcon,
    requiredPermission: 'canViewSacramentos'
  },
  { 
    name: 'Primera Comunión', 
    href: '/primera-comunion', 
    icon: HeartIcon,
    requiredPermission: 'canViewSacramentos'
  },
  { 
    name: 'Confirmaciones', 
    href: '/confirmaciones', 
    icon: ClipboardDocumentListIcon,
    requiredPermission: 'canViewSacramentos'
  },
  { 
    name: 'Matrimonios', 
    href: '/matrimonios', 
    icon: HeartIcon,
    requiredPermission: 'canViewSacramentos'
  },
  { 
    name: 'Constancias', 
    href: '/constancias', 
    icon: DocumentTextIcon,
    requiredPermission: 'canViewConstancias'
  },
  { 
    name: 'Reportes', 
    href: '/reportes', 
    icon: ChartBarIcon,
    requiredPermission: 'canViewReportes'
  },
  { 
    name: 'Configuración', 
    href: '/configuracion', 
    icon: CogIcon,
    requiredPermission: 'canViewConfiguracion'
  },
];

// Función para filtrar navegación según permisos
export function getFilteredNavigation(permissions: UserPermissions): NavigationItem[] {
  return navigationConfig.filter(item => {
    if (!item.requiredPermission) {
      return true; // Elemento público
    }
    
    return permissions[item.requiredPermission];
  });
}
