'use client';

import { useCanAccess } from '@/hooks/usePermissions';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ReadOnlyNoticeProps {
  readonly entity?: string;
  readonly showIcon?: boolean;
  readonly className?: string;
}

export default function ReadOnlyNotice({ 
  entity = 'contenido',
  showIcon = true,
  className = ''
}: ReadOnlyNoticeProps) {
  const { userRole } = useCanAccess();

  // Solo mostrar para secretarios y otros roles con permisos limitados
  if (userRole !== 'secretario') {
    return null;
  }

  return (
    <div className={`alert alert-warning mb-4 ${className}`}>
      {showIcon && (
        <ExclamationTriangleIcon className="h-5 w-5" />
      )}
      <div>
        <h3 className="font-medium">Modo Solo Lectura</h3>
        <div className="text-sm">
          Tienes permisos de lectura para {entity}. No puedes crear ni editar registros.
        </div>
      </div>
    </div>
  );
}

// Componente para botones deshabilitados con tooltip
interface PermissionButtonProps {
  readonly permission: 'canManagePersonas' | 'canCreateSacramentos' | 'canEditSacramentos' | 'canDeleteSacramentos' | 'canManageUsuarios' | 'canManageConfiguracion';
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly title?: string;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
}

export function PermissionButton({
  permission,
  children,
  className = '',
  onClick,
  title,
  disabled = false,
  type = 'button'
}: PermissionButtonProps) {
  const { canAccess, userRole } = useCanAccess();
  
  const hasPermission = canAccess(permission);
  const isDisabled = disabled || !hasPermission;
  
  const getTooltipMessage = () => {
    if (disabled) return title;
    if (!hasPermission) {
      return `Tu rol de ${userRole} no tiene permisos para esta acción`;
    }
    return title;
  };

  return (
    <button
      type={type}
      onClick={hasPermission ? onClick : undefined}
      className={`${className} ${isDisabled ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
      disabled={isDisabled}
      title={getTooltipMessage()}
    >
      {children}
    </button>
  );
}
